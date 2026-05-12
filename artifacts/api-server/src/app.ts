import { createRequire } from "node:module";
import type { IncomingMessage, ServerResponse } from "node:http";
import express, { type Express, type RequestHandler } from "express";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import type { Logger } from "pino";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

declare global {
  namespace Express {
    interface Request {
      log?: Logger;
    }
  }
}

const require = createRequire(import.meta.url);
const pinoHttp = require("pino-http") as (options: {
  logger: typeof logger;
  serializers: {
    req(req: IncomingMessage & { id?: string | number }): unknown;
    res(res: ServerResponse): unknown;
  };
}) => RequestHandler;

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Security headers
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 60_000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

const couponLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

app.use(globalLimiter);
app.use("/api/auth", authLimiter);
app.use("/api/coupons/validate", couponLimiter);

// R2-NB-10: CORS allowlist - set CORS_ORIGINS env var (comma-separated) for production
const allowedOrigins = (process.env["CORS_ORIGINS"] ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true); // dev fallback: allow all
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS: origin not allowed"));
  },
  credentials: false,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
