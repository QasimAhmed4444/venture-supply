import { Router } from "express";
import { getSupabase } from "../lib/supabase.js";

const router = Router();

router.get("/regions", async (_req, res) => {
  const sb = getSupabase();
  if (!sb) return res.json([]);
  const { data, error } = await sb.from("regions").select("id, name, name_ar, sort_order").order("sort_order");
  if (error) return res.status(500).json({ error: error.message });
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
