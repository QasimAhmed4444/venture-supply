import { Router } from "express";
import { getSupabase } from "../lib/supabase.js";
import { requireAdmin, requireAuth } from "../middlewares/requireAuth.js";
import { auditLog } from "../middlewares/auditLog.js";
import type { VerifiedSession } from "../lib/sessionToken.js";

const router = Router();

// R2-NB-21: FALLBACK_COUPONS removed — DB is the single source of truth

function toCamel(row: Record<string, unknown>) {
  return {
    id: row.id,
    code: row.code,
    enTitle: row.en_title,
    arTitle: row.ar_title,
    type: row.type,
    value: Number(row.value ?? 0),
    minOrder: Number(row.min_order ?? 0),
    audience: row.audience,
    maxUses: row.max_uses,
    usesCount: Number(row.uses_count ?? 0),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

// GET /coupons — admin only (list for admin management panel)
router.get("/coupons", requireAdmin, async (_req, res) => {
  const sb = getSupabase();
  if (!sb) return res.json([]);
  const { data, error } = await sb.from("coupons").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.json((data ?? []).map(toCamel));
});

// GET /coupons/validate — authenticated customers validating a coupon at checkout
// Audience is derived from the session role — not trusted from the client
router.get("/coupons/validate", requireAuth, async (req, res) => {
  const session = (req as any).session as VerifiedSession;
  const { code, total } = req.query as Record<string, string>;
  if (!code) return res.status(400).json({ error: "code required" });

  // Derive audience from the authenticated session, never from client input
  const audience = session.role === "b2b" ? "b2b" : "b2c";

  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });

  const { data, error } = await sb
    .from("coupons")
    .select("*")
    .ilike("code", code)
    .single();

  // R2-NB-21: no fallback — DB only
  if (error || !data) return res.status(404).json({ error: "Coupon not found" });
  const raw = data;

  const coupon = toCamel(raw as Record<string, unknown>);
  const now = new Date();

  if (!coupon.isActive) return res.status(400).json({ error: "Coupon is inactive" });
  if (coupon.startsAt && new Date(coupon.startsAt as string) > now) return res.status(400).json({ error: "Coupon not yet valid" });
  if (coupon.endsAt && new Date(coupon.endsAt as string) < now) return res.status(400).json({ error: "Coupon has expired" });
  if (coupon.maxUses != null && coupon.usesCount >= (coupon.maxUses as number)) return res.status(400).json({ error: "Coupon usage limit reached" });

  // R2-NB-22: minOrder check still useful as a UX hint, but only when total is provided
  const orderTotal = Number(total ?? 0);
  if (coupon.minOrder && orderTotal > 0 && orderTotal < coupon.minOrder) {
    return res.status(400).json({ error: `Minimum order SAR ${coupon.minOrder} required` });
  }

  if (coupon.audience !== "both" && coupon.audience !== audience) {
    return res.status(400).json({ error: "Coupon not valid for your account type" });
  }

  // R2-NB-22: do NOT compute or return discount — real discount is computed server-side at order placement
  return res.json({
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    minOrder: coupon.minOrder,
    enTitle: coupon.enTitle,
    arTitle: coupon.arTitle,
    freeDelivery: coupon.type === "free_delivery",
  });
});

// POST /coupons — admin only
router.post("/coupons", requireAdmin, auditLog("create", "coupon"), async (req, res) => {
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

// PUT /coupons/:id — admin only
router.put("/coupons/:id", requireAdmin, auditLog("update", "coupon"), async (req, res) => {
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

// DELETE /coupons/:id — admin only
router.delete("/coupons/:id", requireAdmin, auditLog("delete", "coupon"), async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  const { error } = await sb.from("coupons").delete().eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  return res.json({ ok: true });
});

export default router;
