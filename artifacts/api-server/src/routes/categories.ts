import { Router } from "express";
import { getSupabase } from "../lib/supabase.js";
import { seedCategories } from "../lib/seedData.js";

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

export default router;
