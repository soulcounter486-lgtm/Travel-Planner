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

  // Passport 직렬화: 사용자 ID만 저장
  passport.serializeUser((user: any, cb) => {
    console.log("Serializing user:", user?.claims?.sub);
    // 사용자 ID만 세션에 저장
    cb(null, user?.claims?.sub || user?.id);
  });

  // Passport 역직렬화: 세션에서 사용자 ID를 읽어서 전체 사용자 객체 복원
  passport.deserializeUser((id: string, cb) => {
    console.log("Deserializing user:", id);
    // 여기서는 단순히 ID를 반환하고, 실제 사용자 정보는 /api/auth/user에서 조회
    cb(null, { claims: { sub: id }, id });
  });

  app.get("/api/login", (req, res) => {
    res.status(400).json({ message: "Replit login is no longer supported. Please use Google, Kakao, or Email login." });
  });

  app.get("/api/callback", (req, res) => {
    res.status(400).json({ message: "Replit callback is no longer supported." });
  });

  app.get("/api/logout", (req, res) => {
    // 세션 데이터 초기화
    (req.session as any).userId = null;
    (req.session as any).user = null;
    
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("Session destroy error:", destroyErr);
        }
        res.clearCookie('connect.sid');
        res.redirect("/");
      });
    });
  });

  app.get("/api/auth/replit/relogin", (req, res) => {
    // 세션 데이터 초기화
    (req.session as any).userId = null;
    (req.session as any).user = null;
    
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const sessionData = req.session as any;

  // 1. 세션 기반 인증 확인 (이메일 로그인)
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

  // 2. Passport.js 인증 확인 (OAuth 로그인)
  if (req.isAuthenticated?.()) {
    return next();
  }

  return res.status(401).json({ message: "Unauthorized" });
};
