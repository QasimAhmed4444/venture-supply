import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { logger } from "./logger.js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) {
    logger.warn("SUPABASE_URL or SUPABASE_ANON_KEY not set — using mock data fallback");
    return null;
  }
  try {
    _client = createClient(url, key);
    logger.info({ url }, "Supabase client initialised");
    return _client;
  } catch (err) {
    logger.error({ err }, "Failed to create Supabase client — falling back to mock data");
    return null;
  }
}
