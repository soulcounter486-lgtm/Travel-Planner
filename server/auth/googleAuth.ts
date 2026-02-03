import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express, RequestHandler } from "express";
import { authStorage } from "../replit_integrations/auth/storage";

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
        callbackURL: "https://vungtau.blog/api/auth/google/callback",
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

          await authStorage.upsertUser({
            id: `google:${profile.id}`,
            email: email,
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            profileImageUrl: profile.photos?.[0]?.value || "",
          });

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

  // 테스트용 콜백 - JSON 응답 반환
  app.get("/api/auth/google/callback", (req, res, next) => {
    const returnTo = (req.session as any).returnTo || "/";
    
    passport.authenticate("google", (err: any, user: any, info: any) => {
      if (err) {
        return res.json({ step: "authenticate", error: err.message, info });
      }
      if (!user) {
        return res.json({ step: "no_user", info: JSON.stringify(info) });
      }
      
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          return res.json({ step: "login", error: loginErr.message });
        }
        
        req.session.save((saveErr) => {
          if (saveErr) {
            return res.json({ step: "save", error: saveErr.message });
          }
          // 성공 시 리다이렉트
          res.redirect("/?login=success&email=" + encodeURIComponent(user.claims?.email || "unknown"));
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
