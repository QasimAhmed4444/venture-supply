import { Router } from "express";
import { randomBytes, randomUUID } from "node:crypto";
import { getSupabase } from "../lib/supabase.js";
import { requireAuth, requireRole, requireAdmin } from "../middlewares/requireAuth.js";
import { auditLog } from "../middlewares/auditLog.js";
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

// GET /orders/:id — R2-NB-9: sanitize ID to prevent PostgREST filter injection
router.get("/orders/:id", async (req, res) => {
  const session = (req as any).session as VerifiedSession | undefined;
  const sb = getSupabase();

  if (!sb) return res.status(404).json({ error: "not found" });

  const raw = String(req.params.id ?? "");
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(raw)) {
    return res.status(400).json({ error: "Invalid order ID" });
  }

  try {
    let { data } = await sb.from("orders").select("*").eq("id", raw).maybeSingle();
    if (!data) {
      ({ data } = await sb.from("orders").select("*").eq("tracking_id", raw).maybeSingle());
    }
    if (!data) return res.status(404).json({ error: "not found" });

    const order = toCamel(data as Record<string, unknown>);

    if (session?.role === "b2c" || session?.role === "b2b") {
      const { data: cust } = await sb.from("customers").select("id").eq("email", session.email).maybeSingle();
      if (!cust || cust.id !== order.customerId) {
        return res.status(404).json({ error: "not found" });
      }
    }

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

// POST /orders — any authenticated user
router.post("/orders", requireAuth, auditLog("create", "order"), async (req, res) => {
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
        if (cust.assigned_salesperson_id) {
          autoSalespersonId = cust.assigned_salesperson_id as string;
        }
      }
    }

    // ── R2-NB-1+2+3+4+5: Role-gated field derivation ──────────────────────────
    const isStaff = session.role === "admin" || session.role === "sales";

    const customerType = isStaff
      ? ((body.customerType as string | undefined) ?? "b2c")
      : (session.role === "b2b" ? "b2b" : "b2c");
    const isB2B = customerType === "b2b";

    let salespersonId: string | null = null;
    if (isStaff) {
      salespersonId = (body.salespersonId as string | undefined) ?? null;
    } else {
      if (autoSalespersonId) salespersonId = autoSalespersonId;
    }

    const status = isStaff ? ((body.status as string | undefined) ?? "new") : "new";

    const history = isStaff && Array.isArray(body.history)
      ? body.history
      : [{ status, at: new Date().toISOString(), by: isStaff ? session.sub : "system" }];

    // Server always generates IDs
    const orderId = `o-${randomUUID()}`;
    const trackingId = `VS-O-${randomBytes(4).toString("hex").toUpperCase()}`;

    const placedAt = isStaff && body.placedAt
      ? (body.placedAt as string)
      : new Date().toISOString();

    // ── R2-NB-14: items cap ───────────────────────────────────────────────────
    const rawItems = Array.isArray(body.items) ? (body.items as Record<string, unknown>[]) : [];
    if (rawItems.length > 50) {
      return res.status(400).json({ error: "Too many items (max 50 per order)" });
    }

    let pricedItems: Record<string, unknown>[] = rawItems;
    if (rawItems.length > 0) {
      const productIds = [...new Set(rawItems.map((it) => it.productId as string).filter(Boolean))];
      const { data: products } = await sb.from("products")
        .select("id, en_name, b2c_price, b2b_price, packs, stock_qty, stock_status, audience")
        .in("id", productIds);
      const prodMap: Record<string, Record<string, unknown>> = {};
      for (const p of (products ?? [])) prodMap[p.id as string] = p as Record<string, unknown>;

      try {
        pricedItems = rawItems.map((it) => {
          const prod = prodMap[it.productId as string];
          let unitPrice: number;
          if (prod) {
            const qty = Number(it.qty ?? 0);
            if (qty <= 0) throw new Error(`Invalid quantity for ${prod.en_name ?? it.productId}`);
            if (prod.stock_status === "out-of-stock") throw new Error(`${prod.en_name} is out of stock`);
            if (qty > Number(prod.stock_qty ?? 0)) throw new Error(`Only ${prod.stock_qty} of ${prod.en_name} available`);
            if (!isStaff) {
              if (customerType === "b2c" && prod.audience === "b2b") throw new Error(`${prod.en_name} is B2B-only`);
              if (customerType === "b2b" && prod.audience === "b2c") throw new Error(`${prod.en_name} is B2C-only`);
            }
            const packSize = it.packSize as string | undefined;
            const packs = Array.isArray(prod.packs) ? (prod.packs as Record<string, unknown>[]) : [];
            const pack = packSize ? packs.find((pk) => pk.size === packSize) : packs[0];
            if (pack) {
              unitPrice = Number((isB2B ? (pack.b2bPrice ?? pack.b2b_price) : (pack.b2cPrice ?? pack.b2c_price)) ?? (isB2B ? prod.b2b_price : prod.b2c_price) ?? 0);
            } else {
              unitPrice = Number((isB2B ? prod.b2b_price : prod.b2c_price) ?? 0);
            }
            return { ...it, unitPrice, productName: prod.en_name as string };
          } else {
            unitPrice = 0;
            return { ...it, unitPrice };
          }
        });
      } catch (err: any) {
        return res.status(400).json({ error: err?.message ?? "Validation failed" });
      }
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

    // ── R3-DB-4: B2B credit check via view ────────────────────────────────────
    if (body.paymentMethod === "credit") {
      if (customerType !== "b2b") return res.status(403).json({ error: "Credit only for B2B" });
      if (!customerId) return res.status(401).json({ error: "Login required for credit orders" });

      const { data: creditStatus } = await sb
        .from("v_b2b_credit_status")
        .select("*")
        .eq("customer_id", customerId)
        .maybeSingle();

      if (!creditStatus || !creditStatus.allow_credit) {
        return res.status(403).json({ error: "Credit not approved for this account" });
      }
      if (Number(creditStatus.outstanding ?? 0) + total > Number(creditStatus.credit_limit ?? 0)) {
        const available = Number(creditStatus.credit_limit ?? 0) - Number(creditStatus.outstanding ?? 0);
        return res.status(402).json({ error: `Credit limit exceeded. Available: ${available.toFixed(2)} SAR` });
      }
    }

    const row = {
      id: orderId,
      tracking_id: trackingId,
      customer_id: customerId ?? null,
      customer_name: body.customerName,
      customer_type: customerType,
      salesperson_id: salespersonId,
      status,
      order_type: orderType,
      payment_method: body.paymentMethod ?? "cod",
      placed_at: placedAt,
      estimated_at: body.estimatedAt ?? null,
      delivery_address: body.deliveryAddress,
      city: body.city,
      notes: body.notes ?? null,
      ...(couponCode != null ? { coupon_code: couponCode } : {}),
      ...(discount ? { discount } : {}),
      items: pricedItems,
      subtotal,
      vat,
      delivery_charge: deliveryCharge,
      total,
      history,
    };

    const { data, error } = await sb.from("orders").insert(row).select().single();
    if (error || !data) return res.status(400).json({ error: error?.message ?? "insert failed" });

    // ── R3-DB-2: Mirror items into order_items table for analytics ────────────
    if (pricedItems.length > 0) {
      try {
        const flatItems = pricedItems.map((it: any) => ({
          order_id: (data as any).id,
          product_id: it.productId,
          product_name: it.productName ?? it.enName ?? null,
          pack_size: it.packSize ?? null,
          quantity: Number(it.qty ?? it.quantity ?? 1),
          unit_price: Number(it.unitPrice ?? 0),
          line_total: Number(it.unitPrice ?? 0) * Number(it.qty ?? it.quantity ?? 1),
        }));
        await sb.from("order_items").insert(flatItems);
      } catch {
        // best-effort — analytics table, not source of truth
      }
    }

    // R2-NB-6: increment coupon uses_count atomically via RPC
    if (row.coupon_code) {
      try {
        await sb.rpc("increment_coupon_uses", { p_code: row.coupon_code as string });
      } catch {
        // best-effort
      }
    }

    return res.json(toCamel(data as Record<string, unknown>));
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "internal" });
  }
});

// PUT /orders/:id — admin and sales only
// R3-DB-3: DB trigger blocks illegal transitions; surface 409 for those
router.put("/orders/:id", requireRole("admin", "sales"), auditLog("update", "order"), async (req, res) => {
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
    if (error) {
      // DB trigger (enforce_order_status_transition) raises check violation errcode 23514
      if (error.code === "23514" || error.message?.includes("Illegal status transition") || error.message?.includes("terminal state")) {
        return res.status(409).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
    if (!data) return res.status(400).json({ error: "update failed" });
    return res.json(toCamel(data as Record<string, unknown>));
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "internal" });
  }
});

// DELETE /orders/:id — admin only
router.delete("/orders/:id", requireAdmin, auditLog("delete", "order"), async (req, res) => {
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
