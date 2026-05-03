import { Router } from "express";
import { getSupabase } from "../lib/supabase.js";
import { requireAuth, requireRole, requireAdmin } from "../middlewares/requireAuth.js";
import type { VerifiedSession } from "../lib/sessionToken.js";

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
    couponCode: (row.coupon_code as string | null) ?? null,
    discount: row.discount ? Number(row.discount) : undefined,
    cancellationReason: row.cancellation_reason,
    history: row.history ?? [],
  };
}

// GET /orders — scoped by role
router.get("/orders", requireAuth, async (req, res) => {
  const session = (req as any).session as VerifiedSession;
  const sb = getSupabase();

  let customerIdFilter: string | undefined;
  let salespersonIdFilter: string | undefined;

  if (session.role === "b2c" || session.role === "b2b") {
    if (sb) {
      const { data: cust } = await sb.from("customers").select("id").eq("email", session.email).maybeSingle();
      customerIdFilter = (cust?.id as string | undefined) ?? undefined;
    }
    if (!customerIdFilter) return res.json([]);
  } else if (session.role === "sales") {
    if (sb) {
      const { data: staff } = await sb.from("staff").select("salesperson_id").eq("id", session.sub).maybeSingle();
      salespersonIdFilter = (staff?.salesperson_id as string | undefined) ?? undefined;
    }
    if (!salespersonIdFilter) return res.json([]);
  } else if (session.role === "admin") {
    customerIdFilter = req.query.customerId as string | undefined;
    salespersonIdFilter = req.query.salespersonId as string | undefined;
  }

  if (!sb) return res.json([]);

  try {
    let q = sb.from("orders").select("*").order("placed_at", { ascending: false });
    if (req.query.status && req.query.status !== "all") q = q.eq("status", req.query.status as string);
    if (customerIdFilter) q = q.eq("customer_id", customerIdFilter);
    if (salespersonIdFilter) q = q.eq("salesperson_id", salespersonIdFilter);
    const { data, error } = await q;
    if (error || !data) return res.json([]);
    return res.json(data.map(toCamel));
  } catch {
    return res.json([]);
  }
});

// GET /orders/:id — scoped by role
router.get("/orders/:id", requireAuth, async (req, res) => {
  const session = (req as any).session as VerifiedSession;
  const sb = getSupabase();

  if (!sb) return res.status(404).json({ error: "not found" });
  try {
    const { data } = await sb.from("orders").select("*").or(`id.eq.${req.params.id},tracking_id.eq.${req.params.id}`).single();
    if (!data) return res.status(404).json({ error: "not found" });

    const order = toCamel(data as Record<string, unknown>);

    if (session.role === "b2c" || session.role === "b2b") {
      const { data: cust } = await sb.from("customers").select("id").eq("email", session.email).maybeSingle();
      if (!cust || cust.id !== order.customerId) {
        return res.status(404).json({ error: "not found" });
      }
    } else if (session.role === "sales") {
      const { data: staff } = await sb.from("staff").select("salesperson_id").eq("id", session.sub).maybeSingle();
      if (!staff?.salesperson_id || staff.salesperson_id !== order.salespersonId) {
        return res.status(404).json({ error: "not found" });
      }
    }

    return res.json(order);
  } catch {
    return res.status(500).json({ error: "internal" });
  }
});

// POST /orders — any authenticated user can place an order
router.post("/orders", requireAuth, async (req, res) => {
  const session = (req as any).session as VerifiedSession;
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });

  try {
    const b = req.body as Record<string, unknown>;

    let customerId = b.customerId as string | undefined;
    if (session.role === "b2c" || session.role === "b2b") {
      const { data: cust } = await sb.from("customers").select("id").eq("email", session.email).maybeSingle();
      if (cust) customerId = cust.id as string;
    }

    const row = {
      id: b.id,
      tracking_id: b.trackingId,
      customer_id: customerId ?? b.customerId,
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
      coupon_code: (b.couponCode as string | undefined) ?? null,
      discount: b.discount ? Number(b.discount) : 0,
      items: b.items ?? [],
      subtotal: b.subtotal ?? 0,
      vat: b.vat ?? 0,
      delivery_charge: b.deliveryCharge ?? 0,
      total: b.total ?? 0,
      history: b.history ?? [{ status: "new", at: new Date().toISOString() }],
    };

    const { data, error } = await sb.from("orders").insert(row).select().single();
    if (error || !data) return res.status(400).json({ error: error?.message ?? "insert failed" });

    // Increment coupon uses_count atomically
    if (row.coupon_code) {
      try {
        const { data: cp } = await sb
          .from("coupons")
          .select("id,uses_count")
          .ilike("code", row.coupon_code as string)
          .maybeSingle();
        if (cp) {
          await sb
            .from("coupons")
            .update({ uses_count: ((cp.uses_count as number) || 0) + 1 })
            .eq("id", cp.id as string);
        }
      } catch {
        // best-effort — don't fail the order
      }
    }

    return res.json(toCamel(data as Record<string, unknown>));
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "internal" });
  }
});

// PUT /orders/:id — admin and sales only
router.put("/orders/:id", requireRole("admin", "sales"), async (req, res) => {
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

// DELETE /orders/:id — admin only
router.delete("/orders/:id", requireAdmin, async (req, res) => {
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
