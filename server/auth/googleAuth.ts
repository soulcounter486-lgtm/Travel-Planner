import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express, RequestHandler } from "express";
import { authStorage } from "../replit_integrations/auth/storage";
import { db } from "../db";
import { users, coupons, userCoupons, adminNotifications } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export async function setupGoogleAuth(app: Express) {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.log("Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "https://vungtau.blog/api/auth/google/callback",
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value || "";
          // expires_at: 7일 후 만료 (Replit Auth와 동일한 형식)
          const expiresAt = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
          const user = {
            claims: {
              sub: `google:${profile.id}`,
              email: email,
              first_name: profile.name?.givenName || "",
              last_name: profile.name?.familyName || "",
              profile_image_url: profile.photos?.[0]?.value || "",
              exp: expiresAt,
            },
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: expiresAt,
            provider: "google",
          };

          const googleUserId = `google:${profile.id}`;
          
          // 기존 사용자 확인
          const existingUser = await db.select().from(users).where(eq(users.id, googleUserId)).limit(1);
          const isNewUser = existingUser.length === 0;
          
          await authStorage.upsertUser({
            id: googleUserId,
            email: email,
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            profileImageUrl: profile.photos?.[0]?.value || "",
          });

          // 첫 로그인 환영 쿠폰 발급
          const currentUser = existingUser[0];
          if (isNewUser || (currentUser && !currentUser.welcomeCouponIssued)) {
            try {
              const welcomeCoupons = await db.select().from(coupons).where(
                and(
                  eq(coupons.isWelcomeCoupon, true),
                  eq(coupons.isActive, true)
                )
              );
              
              for (const coupon of welcomeCoupons) {
                await db.insert(userCoupons).values({
                  userId: googleUserId,
                  couponId: coupon.id,
                  isUsed: false,
                });
              }
              
              await db.update(users).set({ welcomeCouponIssued: true }).where(eq(users.id, googleUserId));
              console.log("Welcome coupon issued for Google user:", googleUserId);
            } catch (couponError) {
              console.error("Welcome coupon issue error:", couponError);
            }
          }
          
          // 관리자 알림 생성 (신규회원 또는 로그인)
          try {
            const nickname = profile.name?.givenName || email || "구글 사용자";
            if (isNewUser) {
              await db.insert(adminNotifications).values({
                type: "new_member",
                userId: googleUserId,
                userEmail: email,
                userNickname: nickname,
                message: `새 회원 가입: ${nickname} (구글)`,
              });
            } else {
              await db.insert(adminNotifications).values({
                type: "login",
                userId: googleUserId,
                userEmail: email,
                userNickname: nickname,
                message: `로그인: ${nickname} (구글)`,
              });
            }
          } catch (notifError) {
            console.error("Admin notification error:", notifError);
          }

          done(null, user);
        } catch (error) {
          done(error as Error, undefined);
        }
      }
    )
  );

  app.get("/api/auth/google/login", (req, res, next) => {
    console.log("Google login initiated");
    const returnTo = req.query.returnTo as string || req.headers.referer || "/";
    (req.session as any).returnTo = returnTo;
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.redirect("/");
      }
      passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: "select_account",
      })(req, res, next);
    });
  });

  app.get("/api/auth/google/callback", (req, res, next) => {
    const returnTo = (req.session as any).returnTo || "/";
    
    passport.authenticate("google", (err: any, user: any, info: any) => {
      if (err) {
        console.error("Google auth error:", err);
        return res.redirect("/?error=auth&message=" + encodeURIComponent(err.message || "Unknown error"));
      }
      if (!user) {
        return res.redirect("/?error=no_user");
      }
      
      req.logIn(user, (loginErr) => {
        console.log("Google login - User logged in, sessionID:", req.sessionID);
        if (loginErr) {
          console.error("Login error:", loginErr);
          return res.redirect("/?error=login&message=" + encodeURIComponent(loginErr.message || "Login failed"));
        }
        
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.redirect("/?error=session");
          console.log("Google login - Session saved successfully, sessionID:", req.sessionID);
          }
          res.redirect(returnTo);
        });
      });
    })(req, res, next);
  });

  app.get("/api/auth/google/relogin", (req, res, next) => {
    console.log("Google relogin initiated");
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      (req.session as any).returnTo = "/";
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Session save error:", saveErr);
          return res.redirect("/");
        }
        passport.authenticate("google", {
          scope: ["profile", "email"],
          prompt: "select_account",
        })(req, res, next);
      });
    });
  });

  // 디버그 엔드포인트
  app.get("/api/auth/debug", (req: any, res) => {
    res.json({
      isAuthenticated: req.isAuthenticated?.() || false,
      sessionID: req.sessionID,
      user: req.user ? {
        provider: req.user.provider,
        claims: req.user.claims,
        expires_at: req.user.expires_at
      } : null,
      session: {
        cookie: req.session?.cookie,
        hasPassport: !!req.session?.passport
      }
    });
  });

  console.log("Google OAuth configured successfully");
}
