import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { logger } from "./logger.js";

let _client: SupabaseClient | null = null;

function isJwt(value: string | undefined): value is string {
  return typeof value === "string" && value.startsWith("eyJ");
}

export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;
  const url = process.env["SUPABASE_URL"];
  // SUPABASE_SERVICE_ROLE_KEY_LOCAL is set via .env and won't be overridden
  // by a Replit secret. SUPABASE_SERVICE_ROLE_KEY is the production secret.
  // We validate both are actual JWTs before trusting them; fall back to the
  // anon key if neither is a valid JWT.
  const localKey = process.env["SUPABASE_SERVICE_ROLE_KEY_LOCAL"];
  const secretKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  const serviceKey = isJwt(localKey) ? localKey : isJwt(secretKey) ? secretKey : undefined;
  const anonKey = process.env["SUPABASE_ANON_KEY"];
  const key = serviceKey ?? anonKey;
  if (!url || !key) {
    logger.warn(
      "SUPABASE_URL and a Supabase key (SUPABASE_SERVICE_ROLE_KEY preferred, SUPABASE_ANON_KEY fallback) are required — using mock data fallback",
    );
    return null;
  }
  try {
    _client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    logger.info(
      { url, keyType: serviceKey ? "service_role" : "anon" },
      "Supabase client initialised",
    );
    return _client;
  } catch (err) {
    logger.error({ err }, "Failed to create Supabase client — falling back to mock data");
    return null;
  }
}
