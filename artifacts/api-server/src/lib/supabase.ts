import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { logger } from "./logger.js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;
  const url = process.env["SUPABASE_URL"];
  // Prefer the service-role key so the API server bypasses RLS for trusted
  // server-side operations (orders, customers, staff, etc.). Fall back to
  // the anon key only when the service-role key is unavailable — note that
  // most non-catalog routes will return empty results under production RLS
  // when running with the anon key.
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
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
