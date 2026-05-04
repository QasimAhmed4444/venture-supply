import { Router } from "express";
import { getSupabase } from "../lib/supabase.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import type { VerifiedSession } from "../lib/sessionToken.js";

const router = Router();

// R3-DB-1: Use dashboard_stats RPC — O(1) at DB, sales sees their own numbers
router.get("/dashboard/stats", requireAuth, async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });

  const session = (req as any).session as VerifiedSession;

  let salespersonId: string | null = null;
  if (session.role === "sales") {
    const { data: staff } = await sb
      .from("staff")
      .select("salesperson_id")
      .eq("id", session.sub)
      .maybeSingle();
    salespersonId = (staff?.salesperson_id as string | null) ?? null;
  }

  const { data, error } = await sb.rpc("dashboard_stats", { p_salesperson_id: salespersonId });
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data ?? {});
});

export default router;
