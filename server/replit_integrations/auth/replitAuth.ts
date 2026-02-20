import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";

export function getSession() {
  const sessionTtl = 30 * 24 * 60 * 60; // 30 days in seconds
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
    pruneSessionInterval: 60 * 15,
  });
  return session({
    secret: process.env.SESSION_SECRET || "travel-planner-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionTtl * 1000,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, cb) => {
    cb(null, user);
  });

  passport.deserializeUser((user: any, cb) => {
    cb(null, user);
  });

  app.get("/api/login", (req, res) => {
    res.status(400).json({ message: "Replit login is no longer supported. Please use Google, Kakao, or Email login." });
  });

  app.get("/api/callback", (req, res) => {
    res.status(400).json({ message: "Replit callback is no longer supported." });
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });

  app.get("/api/auth/replit/relogin", (req, res) => {
    res.redirect("/");
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  const sessionData = req.session as any;

  if (sessionData?.userId) {
    if (!req.user) {
      (req as any).user = {
        id: sessionData.userId,
        claims: { sub: sessionData.userId },
        provider: 'email',
        ...sessionData.user
      };
    }
    return next();
  }

  if (req.isAuthenticated()) {
    return next();
  }

  return res.status(401).json({ message: "Unauthorized" });
};
