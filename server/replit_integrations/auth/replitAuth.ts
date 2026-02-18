import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true, // 테이블이 없으면 자동으로 생성하도록 변경
    ttl: sessionTtl,
    tableName: "sessions",
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
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res) => {
    res.status(400).json({ message: "Replit login is no longer supported." });
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
  const session = req.session as any;

  console.log("[DEBUG] isAuthenticated - session?.userId:", session?.userId, "req.isAuthenticated():", req.isAuthenticated(), "user?.provider:", user?.provider);

  // 1. 세션 기반 이메일 로그인 확인
  if (session?.userId) {
    // 세션에 사용자 ID가 있으면 인증됨 - req.user에도 설정
    if (!req.user) {
      (req as any).user = { 
        claims: { sub: session.userId }, 
        provider: 'email',
        ...session.user 
      };
    }
    return next();
  }

  // 2. Passport.js 인증 확인
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Google OAuth 또는 Kakao 사용자는 별도 토큰 갱신 없이 통과
  if (user.provider === "google" || user.provider === "kakao") {
    // expires_at이 없거나 아직 유효하면 통과
    const now = Math.floor(Date.now() / 1000);
    if (!user.expires_at || now <= user.expires_at) {
      return next();
    }
    // 만료됐으면 재로그인 필요
    return res.status(401).json({ message: "Unauthorized" });
  }

  return res.status(401).json({ message: "Unauthorized" });
};
