import { Router } from "express";
import { getSupabase } from "../lib/supabase.js";
import { requireAdmin } from "../middlewares/requireAuth.js";

const router = Router();

function toCamel(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    defaultDiscount: Number(row.default_discount ?? 0),
    minOrderValue: Number(row.min_order_value ?? 0),
    creditAllowed: Boolean(row.credit_allowed),
    creditLimit: row.credit_limit != null ? Number(row.credit_limit) : null,
    status: row.status,
    createdAt: row.created_at,
  };
}

router.get("/business-types", async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  const { data, error } = await sb.from("business_types").select("*").order("name");
  if (error) {
    req.log?.error({ error }, "business types list failed");
    return res.status(500).json({ error: "Failed to load business types" });
  }
  return res.json((data ?? []).map(toCamel));
});

router.post("/business-types", requireAdmin, async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  const b = req.body;
  const id = `bt-${Date.now().toString(36)}`;
  const { data, error } = await sb.from("business_types").insert({
    id, name: b.name, code: b.code?.toUpperCase(), description: b.description ?? null,
    default_discount: b.defaultDiscount ?? 0, min_order_value: b.minOrderValue ?? 0,
    credit_allowed: b.creditAllowed ?? false,
    credit_limit: b.creditAllowed && b.creditLimit ? Number(b.creditLimit) : null,
    status: b.status ?? "active",
  }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json(toCamel(data as Record<string, unknown>));
});

router.put("/business-types/:id", requireAdmin, async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  const b = req.body;
  const payload: Record<string, unknown> = {};
  if (b.name !== undefined) payload.name = b.name;
  if (b.code !== undefined) payload.code = b.code?.toUpperCase();
  if (b.description !== undefined) payload.description = b.description;
  if (b.defaultDiscount !== undefined) payload.default_discount = Number(b.defaultDiscount);
  if (b.minOrderValue !== undefined) payload.min_order_value = Number(b.minOrderValue);
  if (b.creditAllowed !== undefined) payload.credit_allowed = b.creditAllowed;
  if (b.creditLimit !== undefined) payload.credit_limit = b.creditAllowed && b.creditLimit ? Number(b.creditLimit) : null;
  if (b.status !== undefined) payload.status = b.status;
  const { data, error } = await sb.from("business_types").update(payload).eq("id", req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  return res.json(toCamel(data as Record<string, unknown>));
});

router.delete("/business-types/:id", requireAdmin, async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  const { error } = await sb.from("business_types").delete().eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  return res.status(204).send();
});

export default router;
