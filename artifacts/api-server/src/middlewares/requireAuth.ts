import type { Request, Response, NextFunction } from "express";
import { verifySessionToken, type VerifiedSession } from "../lib/sessionToken.js";

declare module "express" {
  interface Request {
    session?: VerifiedSession;
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers["authorization"];
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  return null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const session = verifySessionToken(token);
  if (!session) {
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }
  req.session = session;
  next();
}

export function requireRole(...allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    requireAuth(req, res, () => {
      if (!req.session || !allowed.includes(req.session.role)) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      next();
    });
  };
}

export const requireAdmin = requireRole("admin");

/** Attaches session if a valid token is present, but never rejects the request. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (token) {
    const session = verifySessionToken(token);
    if (session) req.session = session;
  }
  next();
}
