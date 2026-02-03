import type { Express } from "express";
import { authStorage } from "./storage";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user - 인증 없이 세션에서 직접 확인
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      console.log("=== /api/auth/user called ===");
      console.log("isAuthenticated:", req.isAuthenticated?.());
      console.log("req.user:", JSON.stringify(req.user, null, 2));
      console.log("session id:", req.sessionID);
      
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        console.log("User not authenticated");
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = req.user;
      if (!user || !user.claims) {
        console.log("No user claims found");
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = user.claims.sub;
      console.log("Looking up user:", userId);
      
      const dbUser = await authStorage.getUser(userId);
      console.log("DB user found:", dbUser ? "yes" : "no");
      
      if (!dbUser) {
        return res.status(401).json({ message: "User not found" });
      }
      
      res.json(dbUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
