import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import fs from "fs";
import path from "path";
import { getOgDataForPath, injectOgTags, getSeoSettings, injectSeoMeta } from "./og-tags";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  app.get("/", async (req, res, next) => {
    try {
      const seoSettings = await getSeoSettings();
      const hasSeo = seoSettings["seo_title"] || seoSettings["seo_description"] || seoSettings["seo_keywords"];
      if (!hasSeo) return next();

      let htmlPath: string;
      if (process.env.NODE_ENV === "production") {
        htmlPath = path.resolve(__dirname, "public", "index.html");
      } else {
        htmlPath = path.resolve(import.meta.dirname, "..", "client", "index.html");
      }

      let html = await fs.promises.readFile(htmlPath, "utf-8");
      html = injectSeoMeta(html, seoSettings);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch {
      next();
    }
  });

  app.get("/board/:id", async (req, res, next) => {
    try {
      const postId = parseInt(req.params.id, 10);
      if (isNaN(postId)) return next();

      const ogData = await getOgDataForPath(req.path);
      if (!ogData) return next();

      let htmlPath: string;
      if (process.env.NODE_ENV === "production") {
        htmlPath = path.resolve(__dirname, "public", "index.html");
      } else {
        htmlPath = path.resolve(import.meta.dirname, "..", "client", "index.html");
      }

      let html = await fs.promises.readFile(htmlPath, "utf-8");
      html = injectOgTags(html, ogData);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch {
      next();
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
