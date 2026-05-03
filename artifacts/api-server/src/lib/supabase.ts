import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { logger } from "./logger.js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;

  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !key) {
    logger.error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set — server cannot start without them",
    );
    return null;
  }

  if (!key.startsWith("eyJ")) {
    logger.error(
      { keyPrefix: key.slice(0, 8) },
      "SUPABASE_SERVICE_ROLE_KEY does not look like a JWT — it may be a PAT token (sbp_...) or an anon key. " +
        "Open Replit Secrets and paste the service_role JWT from Supabase → Project Settings → API.",
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
