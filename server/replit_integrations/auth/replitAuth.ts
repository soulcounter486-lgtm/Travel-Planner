import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  // DB 테이블 없이 메모리에 세션을 저장하도록 변경 (배포 에러 해결용)
  return session({
    secret: process.env.SESSION_SECRET || "travel-planner-secret",
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

  passport.serializeUser((user: any, cb) => {
    cb(null, user);
  });

  passport.deserializeUser((user: any, cb) => {
    cb(null, user);
  });

  // Replit 전용 API 엔드포인트들을 빈 핸들러로 대체하거나 에러 메시지 반환
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
  const session = req.session as any;

  // 1. 이메일 로그인 세션 확인
  if (session?.userId) {
    if (!req.user) {
      (req as any).user = { 
        id: session.userId,
        provider: 'email',
        ...session.user 
      };
    }
    return next();
  }

  // 2. Passport (Google, Kakao) 인증 확인
  if (req.isAuthenticated()) {
    return next();
  }

  return res.status(401).json({ message: "Unauthorized" });
};

export function registerAuthRoutes(app: Express) {
  // 기존에 이 함수가 호출되고 있었다면 빈 함수로 유지하여 에러 방지
}
