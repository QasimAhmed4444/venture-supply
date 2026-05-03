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

function pickServiceRoleKey(): string | undefined {
  // SUPABASE_SERVICE_ROLE_KEY_LOCAL is loaded from the .env file and takes
  // priority over the Replit secret so a correct dev key always wins even
  // when the secret was accidentally set to the anon key.
  const local = process.env["SUPABASE_SERVICE_ROLE_KEY_LOCAL"];
  const secret = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  for (const [label, key] of [
    ["SUPABASE_SERVICE_ROLE_KEY_LOCAL", local],
    ["SUPABASE_SERVICE_ROLE_KEY", secret],
  ] as [string, string | undefined][]) {
    if (!key || !key.startsWith("eyJ")) continue;
    const role = decodeJwtRole(key);
    if (role === "service_role") return key;
    logger.warn(
      { envVar: label, roleInToken: role },
      `${label} JWT claims role='${role}' — skipping (need service_role)`,
    );
  }
  return undefined;
}

export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;

  const url = process.env["SUPABASE_URL"];
  const key = pickServiceRoleKey();

  if (!url) {
    logger.error("SUPABASE_URL is not set");
    return null;
  }

  if (!key) {
    logger.error(
      "No valid service_role JWT found in SUPABASE_SERVICE_ROLE_KEY_LOCAL or SUPABASE_SERVICE_ROLE_KEY. " +
        "In Replit Secrets, set SUPABASE_SERVICE_ROLE_KEY to the service_role (secret) key from " +
        "Supabase → Project Settings → API. Make sure you copy the bottom key labelled " +
        "'service_role secret', NOT the anon/public key at the top.",
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
