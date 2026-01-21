import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // APK 파일 직접 다운로드 라우트
  app.get("/vungtau-dokkaebi.apk", (_req, res) => {
    const apkPath = path.resolve(distPath, "vungtau-dokkaebi.apk");
    if (fs.existsSync(apkPath)) {
      res.setHeader("Content-Type", "application/vnd.android.package-archive");
      res.setHeader("Content-Disposition", "attachment; filename=vungtau-dokkaebi.apk");
      res.sendFile(apkPath);
    } else {
      res.status(404).send("APK file not found");
    }
  });

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
