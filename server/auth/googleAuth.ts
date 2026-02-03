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
        callbackURL: "/api/auth/google/callback",
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value || "";
          const user = {
            claims: {
              sub: `google:${profile.id}`,
              email: email,
              first_name: profile.name?.givenName || "",
              last_name: profile.name?.familyName || "",
              profile_image_url: profile.photos?.[0]?.value || "",
            },
            access_token: accessToken,
            refresh_token: refreshToken,
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
    const returnTo = req.query.returnTo as string || req.headers.referer || "/";
    (req.session as any).returnTo = returnTo;
    req.session.save(() => {
      passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: "select_account",
      })(req, res, next);
    });
  });

  app.get("/api/auth/google/callback", (req, res, next) => {
    const returnTo = (req.session as any).returnTo || "/";
    passport.authenticate("google", {
      successRedirect: returnTo,
      failureRedirect: "/",
    })(req, res, next);
  });

  app.get("/api/auth/google/relogin", (req, res, next) => {
    req.logout(() => {
      (req.session as any).returnTo = "/";
      req.session.save(() => {
        passport.authenticate("google", {
          scope: ["profile", "email"],
          prompt: "select_account",
        })(req, res, next);
      });
    });
  });

  console.log("Google OAuth configured successfully");
}
