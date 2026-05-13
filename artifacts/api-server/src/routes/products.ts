import { Router } from "express";
import { getSupabase } from "../lib/supabase.js";
import { requireAdmin } from "../middlewares/requireAuth.js";
import { verifySessionToken } from "../lib/sessionToken.js";
import { auditLog } from "../middlewares/auditLog.js";

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
    b2cPrice: Number(row.b2c_price ?? 0),
    b2bPrice: Number(row.b2b_price ?? 0),
    packs: row.packs ?? [],
    minOrderQty: row.min_order_qty ?? 1,
    rating: Number(row.rating ?? 0),
    reviewCount: row.review_count,
    stockStatus: row.stock_status,
    stockQty: row.stock_qty,
    image: row.image,
    featured: row.featured ?? false,
  };
}

function toSnake(b: Record<string, unknown>) {
  const row: Record<string, unknown> = {};
  if (b.sku !== undefined) row.sku = b.sku;
  if (b.slug !== undefined) row.slug = b.slug;
  if (b.enName !== undefined) row.en_name = b.enName;
  if (b.arName !== undefined) row.ar_name = b.arName;
  if (b.enDescription !== undefined) row.en_description = b.enDescription;
  if (b.arDescription !== undefined) row.ar_description = b.arDescription;
  if (b.brandId !== undefined) row.brand_id = b.brandId;
  if (b.categoryId !== undefined) row.category_id = b.categoryId;
  if (b.audience !== undefined) row.audience = b.audience;
  if (b.b2cPrice !== undefined) row.b2c_price = b.b2cPrice;
  if (b.b2bPrice !== undefined) row.b2b_price = b.b2bPrice;
  if (b.packs !== undefined) row.packs = b.packs;
  if (b.minOrderQty !== undefined) row.min_order_qty = b.minOrderQty;
  if (b.stockStatus !== undefined) row.stock_status = b.stockStatus;
  if (b.stockQty !== undefined) row.stock_qty = b.stockQty;
  if (b.image !== undefined) row.image = b.image;
  if (b.featured !== undefined) row.featured = b.featured;
  return row;
}

// R2-NB-11: GET /products with optional auth for audience filtering
router.get("/products", async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });

  // Optional auth - read role if token present, default to public (b2c) view
  const auth = req.headers["authorization"];
  let role: string | null = null;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    const session = verifySessionToken(auth.slice(7).trim());
    if (session) role = session.role;
  }

  try {
    let query = sb.from("products").select("*").order("featured", { ascending: false }).order("created_at");

    // Audience filter: guests + b2c see b2c|both; b2b sees b2b|both; staff sees all
    if (role === "b2b") {
      query = query.in("audience", ["b2b", "both"]);
    } else if (role === "admin" || role === "sales") {
      // staff sees everything - no filter
    } else {
      // guest or b2c
      query = query.in("audience", ["b2c", "both"]);
    }

    if (req.query.category) query = query.eq("category_id", req.query.category as string);
    if (req.query.brand)    query = query.eq("brand_id", req.query.brand as string);
    if (req.query.search)   query = query.ilike("en_name", `%${req.query.search}%`);
    const { data, error } = await query;
    if (error || !data) {
      req.log?.error({ error }, "products list failed");
      return res.status(500).json({ error: "Failed to load products" });
    }
    return res.json(data.map(toCamel));
  } catch (err) {
    req.log?.error({ err }, "products list failed");
    return res.status(500).json({ error: "Failed to load products" });
  }
});

router.get("/products/:slug", async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(404).json({ error: "not found" });
  try {
    const { data } = await sb.from("products").select("*").eq("slug", req.params.slug).single();
    if (!data) return res.status(404).json({ error: "not found" });
    return res.json(toCamel(data as Record<string, unknown>));
  } catch {
    return res.status(500).json({ error: "internal" });
  }
});

router.post("/products", requireAdmin, auditLog("create", "product"), async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  try {
    const b = req.body as Record<string, unknown>;
    if (!b.id) b.id = `p-${Date.now()}`;
    if (!b.slug) b.slug = String(b.enName ?? b.id).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const row = { id: b.id, ...toSnake(b) };
    const { data, error } = await sb.from("products").insert(row).select().single();
    if (error || !data) return res.status(400).json({ error: error?.message ?? "insert failed" });
    return res.status(201).json(toCamel(data as Record<string, unknown>));
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "internal" });
  }
});

router.put("/products/:id", requireAdmin, auditLog("update", "product"), async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  try {
    const updates = toSnake(req.body as Record<string, unknown>);
    const { data, error } = await sb.from("products").update(updates).eq("id", req.params.id).select().single();
    if (error || !data) return res.status(400).json({ error: error?.message ?? "update failed" });
    return res.json(toCamel(data as Record<string, unknown>));
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "internal" });
  }
});

router.delete("/products/:id", requireAdmin, auditLog("delete", "product"), async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  try {
    const { error } = await sb.from("products").delete().eq("id", req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "internal" });
  }
});

export default router;
