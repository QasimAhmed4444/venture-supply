import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { logger } from "./logger.js";

let _client: SupabaseClient | null = null;

function decodeJwtRole(jwt: string): string | undefined {
  try {
    const payload = jwt.split(".")[1];
    if (!payload) return undefined;
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const decoded = JSON.parse(
      Buffer.from(padded, "base64").toString("utf8"),
    ) as Record<string, unknown>;
    return typeof decoded.role === "string" ? decoded.role : undefined;
  } catch {
    return undefined;
  }
}

/**
 * If the secret was accidentally saved with two JWTs concatenated (a common
 * copy-paste mistake from the Supabase dashboard), extract just the first one.
 * A JWT has exactly three base64url segments separated by dots. Any run of
 * base64url chars that starts with "eyJ" and is followed by two more dot-
 * separated segments is treated as a complete JWT.
 */
function extractFirstJwt(raw: string): string {
  const trimmed = raw.trim();
  // Fast path: already a clean JWT (exactly 2 dots)
  if ((trimmed.match(/\./g) ?? []).length === 2) return trimmed;

  // Split on dots and rebuild the first three segments, being careful that
  // the third segment (signature) ends before the next "eyJ" header starts.
  const parts = trimmed.split(".");
  if (parts.length < 3) return trimmed;

  const header = parts[0]!;
  const payload = parts[1]!;
  const sigPlusRest = parts[2]!;

  // The signature ends where the next JWT header begins
  const nextJwtIdx = sigPlusRest.indexOf("eyJ");
  const sig = nextJwtIdx === -1 ? sigPlusRest : sigPlusRest.slice(0, nextJwtIdx);

  return `${header}.${payload}.${sig}`;
}

export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;

  const url = process.env["SUPABASE_URL"];
  const rawKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !rawKey) {
    logger.error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set as Replit Secrets",
    );
    return null;
  }

  if (!rawKey.startsWith("eyJ")) {
    logger.error(
      { keyPrefix: rawKey.slice(0, 8) },
      "SUPABASE_SERVICE_ROLE_KEY is not a JWT. In Replit Secrets, paste the service_role key from Supabase → Project Settings → API.",
    );
    return null;
  }

  const key = extractFirstJwt(rawKey);
  const dotCount = (key.match(/\./g) ?? []).length;
  if (dotCount !== 2) {
    logger.error({ dotCount }, "Could not extract a valid JWT from SUPABASE_SERVICE_ROLE_KEY");
    return null;
  }

  const roleInToken = decodeJwtRole(key);
  if (roleInToken !== "service_role") {
    logger.error(
      { roleInToken },
      `SUPABASE_SERVICE_ROLE_KEY has role='${roleInToken ?? "unknown"}' — expected 'service_role'. ` +
        "Copy the service_role key (not the anon key) from Supabase → Project Settings → API.",
    );
    return null;
  }

  try {
    _client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    logger.info({ url, keyType: "service_role" }, "Supabase client initialised");
    return _client;
  } catch (err) {
    logger.error({ err }, "Failed to create Supabase client");
    return null;
  }
}
