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
    subtotal: Number(row.subtotal ?? 0),
    vat: Number(row.vat ?? 0),
    deliveryCharge: Number(row.delivery_charge ?? 0),
    total: Number(row.total ?? 0),
    notes: row.notes ?? null,
    couponCode: (row.coupon_code as string | null) ?? null,
    discount: Number(row.discount ?? 0),
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

// GET /orders/:id — public for tracking links; scoped by role for authenticated users
router.get("/orders/:id", async (req, res) => {
  const session = (req as any).session as VerifiedSession | undefined;
  const sb = getSupabase();

  if (!sb) return res.status(404).json({ error: "not found" });
  try {
    const { data } = await sb
      .from("orders")
      .select("*")
      .or(`id.eq.${req.params.id},tracking_id.eq.${req.params.id}`)
      .maybeSingle();
    if (!data) return res.status(404).json({ error: "not found" });

    const order = toCamel(data as Record<string, unknown>);

    // Authenticated customers can only see their own orders
    if (session?.role === "b2c" || session?.role === "b2b") {
      const { data: cust } = await sb.from("customers").select("id").eq("email", session.email).maybeSingle();
      if (!cust || cust.id !== order.customerId) {
        return res.status(404).json({ error: "not found" });
      }
    }

    // Sales can only see orders for their assigned customers
    if (session?.role === "sales") {
      const { data: staff } = await sb.from("staff").select("salesperson_id").eq("id", session.sub).maybeSingle();
      const spId = staff?.salesperson_id as string | null;
      if (spId && order.salespersonId !== spId) {
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
    const body = req.body as Record<string, unknown>;
    let autoSalespersonId: string | null = null;

    let customerId = body.customerId as string | undefined;
    if (session.role === "b2c" || session.role === "b2b") {
      const { data: cust } = await sb.from("customers").select("id, assigned_salesperson_id").eq("email", session.email).maybeSingle();
      if (cust) {
        customerId = cust.id as string;
        if (!body.salespersonId && cust.assigned_salesperson_id) {
          autoSalespersonId = cust.assigned_salesperson_id as string;
        }
      }
    }

    // ── Server-side pricing ───────────────────────────────────────────────────
    const rawItems = Array.isArray(body.items) ? (body.items as Record<string, unknown>[]) : [];
    const customerType = (body.customerType as string | undefined) ?? (session.role === "b2b" || session.role === "sales" ? "b2b" : "b2c");
    const isB2B = customerType === "b2b";

    let pricedItems: Record<string, unknown>[] = rawItems;
    if (rawItems.length > 0) {
      const productIds = [...new Set(rawItems.map((it) => it.productId as string).filter(Boolean))];
      const { data: products } = await sb.from("products").select("id, b2c_price, b2b_price, packs").in("id", productIds);
      const prodMap: Record<string, Record<string, unknown>> = {};
      for (const p of (products ?? [])) prodMap[p.id as string] = p as Record<string, unknown>;

      pricedItems = rawItems.map((it) => {
        const prod = prodMap[it.productId as string];
        let unitPrice: number;
        if (prod) {
          const packSize = it.packSize as string | undefined;
          const packs = Array.isArray(prod.packs) ? (prod.packs as Record<string, unknown>[]) : [];
          const pack = packSize ? packs.find((pk) => pk.size === packSize) : packs[0];
          if (pack) {
            unitPrice = Number((isB2B ? (pack.b2bPrice ?? pack.b2b_price) : (pack.b2cPrice ?? pack.b2c_price)) ?? (isB2B ? prod.b2b_price : prod.b2c_price) ?? 0);
          } else {
            unitPrice = Number((isB2B ? prod.b2b_price : prod.b2c_price) ?? 0);
          }
        } else {
          unitPrice = 0;
        }
        return { ...it, unitPrice };
      });
    }

    const subtotal = +pricedItems.reduce((s, it) => s + Number(it.unitPrice ?? 0) * Number(it.qty ?? 0), 0).toFixed(2);
    const vat = +(subtotal * 0.15).toFixed(2);
    const orderType = (body.orderType as string | undefined) ?? "delivery";
    const baseDelivery = orderType === "pickup" ? 0 : isB2B ? 0 : subtotal >= 200 ? 0 : 25;

    // Re-validate coupon server-side
    const couponCode = (body.couponCode as string | undefined) ?? null;
    let discount = 0;
    let freeDelivery = false;
    if (couponCode) {
      try {
        const { data: cp } = await sb.from("coupons").select("*").ilike("code", couponCode).maybeSingle();
        if (cp && cp.is_active) {
          const now = new Date();
          const notExpired = (!cp.starts_at || new Date(cp.starts_at as string) <= now)
            && (!cp.ends_at || new Date(cp.ends_at as string) >= now);
          const withinLimit = cp.max_uses == null || Number(cp.uses_count ?? 0) < Number(cp.max_uses);
          const audienceOk = cp.audience === "both" || (isB2B ? cp.audience === "b2b" : cp.audience === "b2c");
          const minOk = subtotal >= Number(cp.min_order ?? 0);
          if (notExpired && withinLimit && audienceOk && minOk) {
            if (cp.type === "percent") discount = +(subtotal * Number(cp.value) / 100).toFixed(2);
            else if (cp.type === "fixed") discount = Math.min(Number(cp.value), subtotal);
            else if (cp.type === "free_delivery") freeDelivery = true;
          }
        }
      } catch {
        // best-effort coupon re-validation; don't fail the order
      }
    }

    const deliveryCharge = freeDelivery ? 0 : baseDelivery;
    const total = Math.max(0, +(subtotal + vat + deliveryCharge - discount).toFixed(2));

    const b: Record<string, unknown> = { ...body, ...(autoSalespersonId ? { salespersonId: autoSalespersonId } : {}) };

    const row = {
      id: b.id,
      tracking_id: b.trackingId,
      customer_id: customerId ?? b.customerId,
      customer_name: b.customerName,
      customer_type: customerType,
      salesperson_id: b.salespersonId ?? null,
      status: b.status ?? "new",
      order_type: orderType,
      payment_method: b.paymentMethod ?? "cod",
      placed_at: b.placedAt ?? new Date().toISOString(),
      estimated_at: b.estimatedAt ?? null,
      delivery_address: b.deliveryAddress,
      city: b.city,
      notes: b.notes ?? null,
      ...(couponCode != null ? { coupon_code: couponCode } : {}),
      ...(discount ? { discount } : {}),
      items: pricedItems,
      subtotal,
      vat,
      delivery_charge: deliveryCharge,
      total,
      history: b.history ?? [{ status: "new", at: new Date().toISOString() }],
    };

    const { data, error } = await sb.from("orders").insert(row).select().single();
    if (error || !data) return res.status(400).json({ error: error?.message ?? "insert failed" });

    // Increment coupon uses_count atomically via RPC
    if (row.coupon_code) {
      try {
        await sb.rpc("increment_coupon_uses", { coupon_code: row.coupon_code as string });
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
