import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { logger } from "./logger.js";

let _client: SupabaseClient | null = null;

function decodeJwtRole(jwt: string): string | undefined {
  try {
    const payload = jwt.split(".")[1];
    if (!payload) return undefined;
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const decoded = JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as Record<string, unknown>;
    return typeof decoded.role === "string" ? decoded.role : undefined;
  } catch {
    return undefined;
  }
}

export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;

  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !key) {
    logger.error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set",
    );
    return null;
  }

  if (!key.startsWith("eyJ")) {
    logger.error(
      { keyPrefix: key.slice(0, 8) },
      "SUPABASE_SERVICE_ROLE_KEY is not a JWT — it may be a PAT token (sbp_...). " +
        "Open Replit Secrets and paste the service_role JWT from Supabase → Project Settings → API.",
    );
    return null;
  }

  const roleInToken = decodeJwtRole(key);
  if (roleInToken !== "service_role") {
    logger.error(
      { roleInToken },
      "SUPABASE_SERVICE_ROLE_KEY JWT contains role='" +
        (roleInToken ?? "unknown") +
        "' — expected 'service_role'. " +
        "The anon key was provided instead. " +
        "Open Replit Secrets and replace SUPABASE_SERVICE_ROLE_KEY with the service_role JWT from Supabase → Project Settings → API.",
    );
    return null;
  }

  try {
    _client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    logger.info(
      { url, keyType: "service_role" },
      "Supabase client initialised",
    );
    return _client;
  } catch (err) {
    logger.error({ err }, "Failed to create Supabase client");
    return null;
  }
}
