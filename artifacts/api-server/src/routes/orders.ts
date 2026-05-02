import { Router } from "express";
import { getSupabase } from "../lib/supabase.js";
import { seedOrders } from "../lib/seedData.js";

const router = Router();

function toCamel(row: Record<string, unknown>) {
  return {
    id: row.id,
    trackingId: row.tracking_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerType: row.customer_type,
    salespersonId: row.salesperson_id,
    status: row.status,
    orderType: row.order_type,
    paymentMethod: row.payment_method,
    placedAt: row.placed_at,
    estimatedAt: row.estimated_at,
    deliveryAddress: row.delivery_address,
    city: row.city,
    items: row.items ?? [],
    subtotal: Number(row.subtotal),
    vat: Number(row.vat),
    deliveryCharge: Number(row.delivery_charge),
    total: Number(row.total),
    notes: row.notes ?? null,
    cancellationReason: row.cancellation_reason,
    history: row.history ?? [],
  };
}

router.get("/orders", async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.json(seedOrders);
  try {
    let q = sb.from("orders").select("*").order("placed_at", { ascending: false });
    if (req.query.status && req.query.status !== "all") q = q.eq("status", req.query.status as string);
    if (req.query.customerId) q = q.eq("customer_id", req.query.customerId as string);
    if (req.query.salespersonId) q = q.eq("salesperson_id", req.query.salespersonId as string);
    const { data, error } = await q;
    if (error || !data) return res.json(seedOrders);
    return res.json(data.length ? data.map(toCamel) : seedOrders);
  } catch {
    return res.json(seedOrders);
  }
});

router.get("/orders/:id", async (req, res) => {
  const sb = getSupabase();
  if (!sb) {
    const o = seedOrders.find((x: any) => x.id === req.params.id || x.trackingId === req.params.id);
    if (!o) return res.status(404).json({ error: "not found" });
    return res.json(o);
  }
  try {
    const { data } = await sb.from("orders").select("*").or(`id.eq.${req.params.id},tracking_id.eq.${req.params.id}`).single();
    if (!data) return res.status(404).json({ error: "not found" });
    return res.json(toCamel(data as Record<string, unknown>));
  } catch {
    return res.status(500).json({ error: "internal" });
  }
});

router.post("/orders", async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  try {
    const b = req.body as Record<string, unknown>;
    const row = {
      id: b.id,
      tracking_id: b.trackingId,
      customer_id: b.customerId,
      customer_name: b.customerName,
      customer_type: b.customerType ?? "b2c",
      salesperson_id: b.salespersonId ?? null,
      status: b.status ?? "new",
      order_type: b.orderType ?? "delivery",
      payment_method: b.paymentMethod ?? "cod",
      placed_at: b.placedAt ?? new Date().toISOString(),
      estimated_at: b.estimatedAt ?? null,
      delivery_address: b.deliveryAddress,
      city: b.city,
      notes: b.notes ?? null,
      items: b.items ?? [],
      subtotal: b.subtotal ?? 0,
      vat: b.vat ?? 0,
      delivery_charge: b.deliveryCharge ?? 0,
      total: b.total ?? 0,
      history: b.history ?? [{ status: "new", at: new Date().toISOString() }],
    };
    const { data, error } = await sb.from("orders").insert(row).select().single();
    if (error || !data) return res.status(400).json({ error: error?.message ?? "insert failed" });
    return res.json(toCamel(data as Record<string, unknown>));
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "internal" });
  }
});

router.put("/orders/:id", async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  try {
    const b = req.body as Record<string, unknown>;
    const updates: Record<string, unknown> = {};
    if (b.status !== undefined) updates.status = b.status;
    if (b.deliveryAddress !== undefined) updates.delivery_address = b.deliveryAddress;
    if (b.estimatedAt !== undefined) updates.estimated_at = b.estimatedAt;
    if (b.notes !== undefined) updates.notes = b.notes;
    if (b.cancellationReason !== undefined) updates.cancellation_reason = b.cancellationReason;
    if (b.history !== undefined) updates.history = b.history;
    const { data, error } = await sb.from("orders").update(updates).eq("id", req.params.id).select().single();
    if (error || !data) return res.status(400).json({ error: error?.message ?? "update failed" });
    return res.json(toCamel(data as Record<string, unknown>));
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "internal" });
  }
});

router.delete("/orders/:id", async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  try {
    const { error } = await sb.from("orders").delete().eq("id", req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "internal" });
  }
});

export default router;
