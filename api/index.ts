import express, { Response, NextFunction } from "express";
import type { Request } from "express";
import { createServer } from "node:http";
import path from "path";
import fs from "fs";
import { registerRoutes } from "../server/routes";

const app = express();
const httpServer = createServer(app);

// Ensure uploads directory exists (uses /tmp on Vercel — ephemeral but functional)
const UPLOAD_DIR = process.env.VERCEL ? "/tmp/uploads" : path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/uploads", express.static(UPLOAD_DIR));

app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("Error:", err);
  if (res.headersSent) return next(err);
  return res.status(status).json({ message });
});

// Register all API routes
registerRoutes(httpServer, app);

export default app;
