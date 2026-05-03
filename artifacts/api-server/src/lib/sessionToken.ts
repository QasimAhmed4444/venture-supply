import crypto from "node:crypto";
import { logger } from "./logger.js";

const DEFAULT_TTL_SECONDS = 12 * 60 * 60; // 12 hours

let _secret: string | null = null;

function getSecret(): string {
  if (_secret) return _secret;
  const fromEnv = process.env["SESSION_SECRET"];
  if (fromEnv && fromEnv.length >= 16) {
    _secret = fromEnv;
    return _secret;
  }
  // Fallback: ephemeral per-process secret. All previously-issued tokens
  // become invalid on restart. Loud warning so production deployments set
  // SESSION_SECRET explicitly.
  _secret = crypto.randomBytes(32).toString("hex");
  logger.warn(
    "SESSION_SECRET is not set (or is too short). Using an ephemeral per-process secret — all session tokens will be invalidated on restart.",
  );
  return _secret;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function fromB64url(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

export interface SessionPayload {
  sub: string;        // staff id
  role: string;       // staff role
  email: string;
}

export interface VerifiedSession extends SessionPayload {
  exp: number;
}

export function signSessionToken(payload: SessionPayload, ttlSeconds = DEFAULT_TTL_SECONDS): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = b64url(JSON.stringify({ ...payload, exp }));
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

export function verifySessionToken(token: string): VerifiedSession | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts as [string, string];
  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");
  // Constant-time compare
  const a = fromB64url(sig);
  const b = fromB64url(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let parsed: VerifiedSession;
  try {
    parsed = JSON.parse(fromB64url(body).toString("utf8")) as VerifiedSession;
  } catch {
    return null;
  }
  if (!parsed?.exp || parsed.exp < Math.floor(Date.now() / 1000)) return null;
  return parsed;
}
