import app from "./app";
import { logger } from "./lib/logger";
import { getSupabase } from "./lib/supabase";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Verify Supabase service role key works at startup.
  // A SELECT count on a tiny system table is low-cost and confirms the key
  // actually has service-role privileges.  If it fails, log a fatal error so
  // the deployment is immediately visible as misconfigured in the log stream.
  try {
    const sb = getSupabase();
    if (!sb) {
      logger.error("Supabase startup check FAILED — client could not be created (missing URL or key)");
    } else {
      const { error } = await sb.from("customers").select("id", { count: "exact", head: true });
      if (error) {
        logger.error(
          { supabaseError: error.message, code: error.code },
          "Supabase startup check FAILED — service role key may be wrong or RLS is blocking access",
        );
      } else {
        logger.info("Supabase startup check passed — service role access confirmed");
      }
    }
  } catch (startupErr) {
    logger.error({ err: startupErr }, "Supabase startup check threw an unexpected error");
  }
});
