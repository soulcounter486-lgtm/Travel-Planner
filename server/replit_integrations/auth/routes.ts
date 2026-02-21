import type { Express } from "express";
import { authStorage } from "./storage";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user - 세션 기반 인증을 우선 처리
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      console.log("=== /api/auth/user called ===");
      console.log("isAuthenticated:", req.isAuthenticated?.());
      console.log("req.user:", JSON.stringify(req.user, null, 2));
      console.log("session id:", req.sessionID);
      console.log("session.userId:", req.session?.userId);
      console.log("session.passport:", req.session?.passport);
      
      // 1. 세션 기반 인증 확인 (이메일 로그인) - 우선 처리
      if (req.session?.userId) {
        const userId = req.session.userId;
        console.log("Session auth - Looking up user:", userId);
        
        const dbUser = await authStorage.getUser(userId);
        console.log("DB user found:", dbUser ? "yes" : "no");
        
        if (dbUser) {
          return res.json(dbUser);
        }
      }
      
      // 2. Passport.js 인증 확인 (OAuth 로그인)
      if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims) {
        const userId = req.user.claims.sub;
        console.log("Passport auth - Looking up user:", userId);
        
        const dbUser = await authStorage.getUser(userId);
        console.log("DB user found:", dbUser ? "yes" : "no");
        
        if (dbUser) {
          return res.json(dbUser);
        }
      }
      
      console.log("User not authenticated");
      return res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile - 회원가입 정보 업데이트
  app.patch("/api/auth/user", async (req: any, res) => {
    try {
      let userId: string | null = null;
      
      // 1. 세션 기반 인증 확인 (이메일 로그인)
      if (req.session?.userId) {
        userId = req.session.userId;
        console.log("Session auth - Updating user:", userId);
      }
      // 2. Passport.js 인증 확인 (OAuth 로그인)
      else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims) {
        userId = req.user.claims.sub;
        console.log("Passport auth - Updating user:", userId);
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { nickname, gender, birthDate } = req.body;
      
      const updatedUser = await authStorage.updateUser(userId, {
        nickname,
        gender,
        birthDate,
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
}
