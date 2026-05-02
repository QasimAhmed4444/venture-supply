import { Router } from "express";
import { getSupabase } from "../lib/supabase.js";
import { seedProducts } from "../lib/seedData.js";

const router = Router();

function toCamel(row: Record<string, unknown>) {
  return {
    id: row.id,
    sku: row.sku,
    slug: row.slug,
    enName: row.en_name,
    arName: row.ar_name,
    enDescription: row.en_description,
    arDescription: row.ar_description,
    brandId: row.brand_id,
    categoryId: row.category_id,
    audience: row.audience ?? "both",
    b2cPrice: Number(row.b2c_price),
    b2bPrice: Number(row.b2b_price),
    packs: row.packs ?? [],
    minOrderQty: row.min_order_qty ?? 1,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    stockStatus: row.stock_status,
    stockQty: row.stock_qty,
    image: row.image,
    featured: row.featured ?? false,
  };
}

router.get("/products", async (req, res) => {
  const sb = getSupabase();
  if (!sb) {
    return res.json(seedProducts.map(toCamel));
  }
  try {
    let query = sb.from("products").select("*").order("featured", { ascending: false }).order("created_at");
    if (req.query.category) query = query.eq("category_id", req.query.category as string);
    if (req.query.brand)    query = query.eq("brand_id", req.query.brand as string);
    if (req.query.search)   query = query.ilike("en_name", `%${req.query.search}%`);
    const { data, error } = await query;
    if (error || !data?.length) {
      return res.json(seedProducts.map(toCamel));
    }
    return res.json(data.map(toCamel));
  } catch {
    return res.json(seedProducts.map(toCamel));
  }
});

router.get("/products/:slug", async (req, res) => {
  const sb = getSupabase();
  if (!sb) {
    const p = seedProducts.find((x) => x.slug === req.params.slug);
    if (!p) return res.status(404).json({ error: "not found" });
    return res.json(toCamel(p as unknown as Record<string, unknown>));
  }
  try {
    const { data, error } = await sb.from("products").select("*").eq("slug", req.params.slug).single();
    if (error || !data) {
      const p = seedProducts.find((x) => x.slug === req.params.slug);
      if (!p) return res.status(404).json({ error: "not found" });
      return res.json(toCamel(p as unknown as Record<string, unknown>));
    }
    return res.json(toCamel(data as Record<string, unknown>));
  } catch {
    return res.status(500).json({ error: "internal" });
  }
});

export default router;
