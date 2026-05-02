import { Router } from "express";
import { getSupabase } from "../lib/supabase.js";

const router = Router();

function toCamel(row: Record<string, unknown>) {
  return {
    id: row.id,
    code: row.code,
    enTitle: row.en_title,
    arTitle: row.ar_title,
    type: row.type,
    value: Number(row.value),
    minOrder: Number(row.min_order),
    audience: row.audience,
    maxUses: row.max_uses,
    usesCount: Number(row.uses_count ?? 0),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

router.get("/coupons", async (_req, res) => {
  const sb = getSupabase();
  if (!sb) return res.json([]);
  const { data, error } = await sb.from("coupons").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.json((data ?? []).map(toCamel));
});

router.get("/coupons/validate", async (req, res) => {
  const { code, total, audience } = req.query as Record<string, string>;
  if (!code) return res.status(400).json({ error: "code required" });

  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });

  const { data, error } = await sb
    .from("coupons")
    .select("*")
    .ilike("code", code)
    .single();

  if (error || !data) return res.status(404).json({ error: "Coupon not found" });

  const coupon = toCamel(data as Record<string, unknown>);
  const now = new Date();

  if (!coupon.isActive) return res.status(400).json({ error: "Coupon is inactive" });
  if (coupon.startsAt && new Date(coupon.startsAt as string) > now) return res.status(400).json({ error: "Coupon not yet valid" });
  if (coupon.endsAt && new Date(coupon.endsAt as string) < now) return res.status(400).json({ error: "Coupon has expired" });
  if (coupon.maxUses != null && coupon.usesCount >= (coupon.maxUses as number)) return res.status(400).json({ error: "Coupon usage limit reached" });

  const orderTotal = Number(total ?? 0);
  if (coupon.minOrder && orderTotal < coupon.minOrder) {
    return res.status(400).json({ error: `Minimum order SAR ${coupon.minOrder} required` });
  }

  if (audience && coupon.audience !== "both" && coupon.audience !== audience) {
    return res.status(400).json({ error: "Coupon not valid for your account type" });
  }

  let discount = 0;
  if (coupon.type === "percent") discount = +(orderTotal * coupon.value / 100).toFixed(2);
  else if (coupon.type === "fixed") discount = Math.min(coupon.value, orderTotal);
  else if (coupon.type === "free_delivery") discount = 0;

  return res.json({ ...coupon, discount, freeDelivery: coupon.type === "free_delivery" });
});

router.post("/coupons", async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  const b = req.body as Record<string, unknown>;
  if (!b.code) return res.status(400).json({ error: "code required" });
  const row = {
    id: b.id ?? `cp-${Date.now()}`,
    code: String(b.code).toUpperCase(),
    en_title: b.enTitle,
    ar_title: b.arTitle,
    type: b.type ?? "percent",
    value: Number(b.value ?? 0),
    min_order: Number(b.minOrder ?? 0),
    audience: b.audience ?? "both",
    max_uses: b.maxUses ? Number(b.maxUses) : null,
    uses_count: 0,
    starts_at: b.startsAt ?? null,
    ends_at: b.endsAt ?? null,
    is_active: b.isActive !== false,
  };
  const { data, error } = await sb.from("coupons").insert(row).select().single();
  if (error || !data) return res.status(400).json({ error: error?.message ?? "insert failed" });
  return res.status(201).json(toCamel(data as Record<string, unknown>));
});

router.put("/coupons/:id", async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  const b = req.body as Record<string, unknown>;
  const updates: Record<string, unknown> = {};
  if (b.code !== undefined) updates.code = String(b.code).toUpperCase();
  if (b.enTitle !== undefined) updates.en_title = b.enTitle;
  if (b.arTitle !== undefined) updates.ar_title = b.arTitle;
  if (b.type !== undefined) updates.type = b.type;
  if (b.value !== undefined) updates.value = Number(b.value);
  if (b.minOrder !== undefined) updates.min_order = Number(b.minOrder);
  if (b.audience !== undefined) updates.audience = b.audience;
  if (b.maxUses !== undefined) updates.max_uses = b.maxUses ? Number(b.maxUses) : null;
  if (b.startsAt !== undefined) updates.starts_at = b.startsAt || null;
  if (b.endsAt !== undefined) updates.ends_at = b.endsAt || null;
  if (b.isActive !== undefined) updates.is_active = b.isActive;
  const { data, error } = await sb.from("coupons").update(updates).eq("id", req.params.id).select().single();
  if (error || !data) return res.status(400).json({ error: error?.message ?? "update failed" });
  return res.json(toCamel(data as Record<string, unknown>));
});

router.delete("/coupons/:id", async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  const { error } = await sb.from("coupons").delete().eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  return res.json({ ok: true });
});

export default router;
