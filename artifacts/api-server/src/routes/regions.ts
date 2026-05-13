import { Router } from "express";
import { getSupabase } from "../lib/supabase.js";

const router = Router();

router.get("/regions", async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  const { data, error } = await sb.from("regions").select("id, name, name_ar, sort_order").order("sort_order");
  if (error) {
    req.log?.error({ error }, "regions list failed");
    return res.status(500).json({ error: "Failed to load regions" });
  }
  return res.json(
    (data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      nameAr: r.name_ar ?? null,
      sortOrder: Number(r.sort_order ?? 0),
    }))
  );
});

export default router;
