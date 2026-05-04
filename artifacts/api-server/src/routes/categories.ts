import { Router } from "express";
import { getSupabase } from "../lib/supabase.js";
import { seedCategories } from "../lib/seedData.js";
import { requireAdmin } from "../middlewares/requireAuth.js";

const router = Router();

function toCamel(row: Record<string, unknown>) {
  return {
    id: row.id,
    slug: row.slug,
    image: row.image,
    productCount: row.product_count,
  };
}

router.get("/categories", async (_req, res) => {
  const sb = getSupabase();
  if (!sb) return res.json(seedCategories.map(toCamel));
  try {
    const { data, error } = await sb.from("categories").select("*").order("id");
    if (error || !data?.length) return res.json(seedCategories.map(toCamel));
    return res.json(data.map(toCamel));
  } catch {
    return res.json(seedCategories.map(toCamel));
  }
});

router.post("/categories", requireAdmin, async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  try {
    const b = req.body as Record<string, unknown>;
    if (!b.id) b.id = String(b.enName ?? `cat-${Date.now()}`).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const row = {
      id: b.id,
      slug: b.slug ?? b.id,
      image: b.image ?? null,
      product_count: b.productCount ?? 0,
    };
    const { data, error } = await sb.from("categories").insert(row).select().single();
    if (error || !data) return res.status(400).json({ error: error?.message ?? "insert failed" });
    return res.status(201).json(toCamel(data as Record<string, unknown>));
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "internal" });
  }
});

router.put("/categories/:id", requireAdmin, async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  try {
    const b = req.body as Record<string, unknown>;
    const updates: Record<string, unknown> = {};
    if (b.image !== undefined) updates.image = b.image;
    if (b.productCount !== undefined) updates.product_count = b.productCount;
    if (b.slug !== undefined) updates.slug = b.slug;
    const { data, error } = await sb.from("categories").update(updates).eq("id", req.params.id).select().single();
    if (error || !data) return res.status(400).json({ error: error?.message ?? "update failed" });
    return res.json(toCamel(data as Record<string, unknown>));
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "internal" });
  }
});

router.delete("/categories/:id", requireAdmin, async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  try {
    const { error } = await sb.from("categories").delete().eq("id", req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "internal" });
  }
});

export default router;
