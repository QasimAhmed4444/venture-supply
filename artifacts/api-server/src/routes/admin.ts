import { Router } from "express";
import { getSupabase } from "../lib/supabase.js";
import { seedCategories, seedBrands, seedProducts } from "../lib/seedData.js";

const router = Router();

router.post("/admin/seed", async (_req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "Supabase not configured" });

  const results: Record<string, unknown> = {};

  const { error: catErr, data: catData } = await sb
    .from("categories").upsert(seedCategories, { onConflict: "id" }).select("id");
  results.categories = catErr ? { error: catErr.message } : { upserted: catData?.length };

  const { error: brandErr, data: brandData } = await sb
    .from("brands").upsert(seedBrands, { onConflict: "id" }).select("id");
  results.brands = brandErr ? { error: brandErr.message } : { upserted: brandData?.length };

  const { error: prodErr, data: prodData } = await sb
    .from("products").upsert(seedProducts, { onConflict: "id" }).select("id");
  results.products = prodErr ? { error: prodErr.message } : { upserted: prodData?.length };

  return res.json({ ok: true, results });
});

export default router;
