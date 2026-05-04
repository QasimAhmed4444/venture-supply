import { Router } from "express";
import { getSupabase } from "../lib/supabase.js";
import { requireAuth, requireRole, requireAdmin } from "../middlewares/requireAuth.js";
import { auditLog } from "../middlewares/auditLog.js";
import type { VerifiedSession } from "../lib/sessionToken.js";

const router = Router();

function toCamel(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    type: row.type,
    totalOrders: row.total_orders,
    lifetimeValue: Number(row.lifetime_value ?? 0),
    assignedSalespersonId: row.assigned_salesperson_id ?? undefined,
    joinedDate: row.joined_date,
    business: row.business ?? undefined,
    addresses: row.addresses ?? [],
  };
}

// GET /customers — admin and sales only
// R3-DB-6: sales scoped via customer_assignments junction table
router.get("/customers", requireRole("admin", "sales"), async (req, res) => {
  const session = (req as any).session as VerifiedSession;
  const sb = getSupabase();
  if (!sb) return res.json([]);
  try {
    let q = sb.from("customers").select("*").order("created_at", { ascending: false });
    if (req.query.type && req.query.type !== "all") q = q.eq("type", req.query.type as string);

    if (session.role === "sales") {
      const { data: staff } = await sb.from("staff").select("salesperson_id").eq("id", session.sub).maybeSingle();
      const spId = (staff?.salesperson_id as string | null) ?? null;
      if (!spId) return res.json([]);
      // R3-DB-6: use junction table instead of assigned_salesperson_id
      const { data: assignments } = await sb
        .from("customer_assignments")
        .select("customer_id")
        .eq("salesperson_id", spId);
      const customerIds = (assignments ?? []).map((a) => a.customer_id as string);
      if (customerIds.length === 0) return res.json([]);
      q = q.in("id", customerIds);
    }

    const { data, error } = await q;
    if (error || !data) return res.json([]);
    return res.json(data.map(toCamel));
  } catch {
    return res.json([]);
  }
});

// POST /customers — admin and sales only
router.post("/customers", requireRole("admin", "sales"), auditLog("create", "customer"), async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  const b = req.body;
  // R2-NB-29: credit settings are admin-only
  const session = (req as any).session;
  if ((b.allowCredit || b.creditLimit) && session.role !== "admin") {
    return res.status(403).json({ error: "Credit settings can only be set by admin" });
  }
  const id = `c-${Date.now().toString(36)}`;
  const business = b.type === "b2b" && b.businessName
    ? { name: b.businessName, type: b.businessTypeCode ?? "retailer", crNumber: "", vatNumber: "", businessTypeId: b.businessTypeId ?? null, allowCredit: b.allowCredit ?? false, creditLimit: b.allowCredit ? Number(b.creditLimit ?? 0) : null }
    : null;
  const addresses = b.address
    ? [{ id: `a-${Date.now().toString(36)}`, label: "Primary", fullAddress: b.address, city: b.city ?? "", isDefault: true }]
    : [];
  const { data, error } = await sb.from("customers").insert({
    id,
    name: b.name,
    email: b.email ?? null,
    phone: b.phone ?? null,
    city: b.city ?? null,
    type: b.type ?? "b2c",
    total_orders: 0,
    lifetime_value: 0,
    business,
    addresses,
    joined_date: new Date().toISOString().slice(0, 10),
  }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json(toCamel(data as Record<string, unknown>));
});

// PUT /customers/:id — authenticated (admin/sales or own record)
router.put("/customers/:id", requireAuth, auditLog("update", "customer"), async (req, res) => {
  const session = (req as any).session as VerifiedSession;
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });

  // B2C/B2B can only update their own record; verify ownership
  if (session.role === "b2c" || session.role === "b2b") {
    const { data: existing } = await sb.from("customers").select("id,email").eq("id", req.params.id).maybeSingle();
    if (!existing || existing.email !== session.email) {
      return res.status(403).json({ error: "Forbidden" });
    }
  }

  const b = req.body;
  const payload: Record<string, unknown> = {};

  if (session.role === "b2c" || session.role === "b2b") {
    // Customers may only update safe personal fields
    if (b.name !== undefined) payload.name = b.name;
    if (b.phone !== undefined) payload.phone = b.phone;
    if (b.city !== undefined) payload.city = b.city;
    if (b.addresses !== undefined) payload.addresses = b.addresses;
    // Allow updating safe business sub-fields only
    if (b.business !== undefined) {
      const safeBiz: Record<string, unknown> = {};
      if (b.business.name !== undefined) safeBiz.name = b.business.name;
      if (b.business.crNumber !== undefined) safeBiz.crNumber = b.business.crNumber;
      if (b.business.vatNumber !== undefined) safeBiz.vatNumber = b.business.vatNumber;
      // Preserve existing credit/approval fields by fetching current record
      const { data: cur } = await sb.from("customers").select("business").eq("id", req.params.id).maybeSingle();
      const existingBiz = (cur?.business as Record<string, unknown> | null) ?? {};
      payload.business = { ...existingBiz, ...safeBiz };
    }
  } else {
    // Admin / sales — full update
    if (b.name !== undefined) payload.name = b.name;
    if (b.email !== undefined) payload.email = String(b.email).toLowerCase().trim();
    if (b.phone !== undefined) payload.phone = b.phone;
    if (b.city !== undefined) payload.city = b.city;
    if (b.type !== undefined) payload.type = b.type;
    if (b.assignedSalespersonId !== undefined) payload.assigned_salesperson_id = b.assignedSalespersonId;
    if (b.business !== undefined) payload.business = b.business;
    if (b.addresses !== undefined) payload.addresses = b.addresses;
  }

  const { data, error } = await sb.from("customers").update(payload).eq("id", req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });

  // Sync customer_assignments junction table whenever assignedSalespersonId changes
  if (session.role !== "b2c" && session.role !== "b2b" && b.assignedSalespersonId !== undefined) {
    const spId = b.assignedSalespersonId as string | null;
    if (spId) {
      // Demote any existing primary, then upsert this assignment as primary
      await sb.from("customer_assignments")
        .update({ is_primary: false })
        .eq("customer_id", req.params.id);
      await sb.from("customer_assignments")
        .upsert({
          customer_id: req.params.id,
          salesperson_id: spId,
          is_primary: true,
          commission_split: 100,
          assigned_by: session.sub,
        }, { onConflict: "customer_id,salesperson_id" });
    } else {
      // Salesperson unassigned — remove all junction entries for this customer
      await sb.from("customer_assignments").delete().eq("customer_id", req.params.id);
    }
  }

  return res.json(toCamel(data as Record<string, unknown>));
});

// DELETE /customers/:id — admin only
router.delete("/customers/:id", requireAdmin, auditLog("delete", "customer"), async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  const { error } = await sb.from("customers").delete().eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  return res.status(204).send();
});

// GET /customers/:id — authenticated
router.get("/customers/:id", requireAuth, async (req, res) => {
  const session = (req as any).session as VerifiedSession;
  const sb = getSupabase();
  if (!sb) return res.status(404).json({ error: "not found" });
  try {
    const { data } = await sb.from("customers").select("*").eq("id", req.params.id).single();
    if (!data) return res.status(404).json({ error: "not found" });

    if (session.role === "b2c" || session.role === "b2b") {
      if ((data as any).email !== session.email) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    return res.json(toCamel(data as Record<string, unknown>));
  } catch {
    return res.status(500).json({ error: "internal" });
  }
});

// ── R3-DB-6: Customer assignment endpoints ────────────────────────────────────

// GET /customers/:id/salespersons — authenticated
router.get("/customers/:id/salespersons", requireAuth, async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  const { data, error } = await sb
    .from("v_customer_salespersons")
    .select("*")
    .eq("customer_id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data ?? []);
});

// POST /customers/:id/salespersons — admin only
router.post("/customers/:id/salespersons", requireAdmin, async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  const session = (req as any).session;
  const { salespersonId, isPrimary, commissionSplit, notes } = req.body;
  if (!salespersonId) return res.status(400).json({ error: "salespersonId required" });

  // If new primary, demote existing primaries
  if (isPrimary) {
    await sb.from("customer_assignments")
      .update({ is_primary: false })
      .eq("customer_id", req.params.id);
  }

  const { data, error } = await sb.from("customer_assignments").insert({
    customer_id: req.params.id,
    salesperson_id: salespersonId,
    is_primary: !!isPrimary,
    commission_split: Number(commissionSplit ?? 100),
    assigned_by: session.sub,
    notes: notes ?? null,
  }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json(data);
});

// PUT /customers/:id/credit — admin only, R4-FIX-2: B2B credit management
router.put("/customers/:id/credit", requireAdmin, auditLog("update", "customer_credit"), async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });

  const { allowCredit, creditLimit, approvalStatus, approvalNotes } = req.body as {
    allowCredit?: boolean;
    creditLimit?: number;
    approvalStatus?: "pending" | "approved" | "rejected";
    approvalNotes?: string;
  };

  if (approvalStatus && !["pending", "approved", "rejected"].includes(approvalStatus)) {
    return res.status(400).json({ error: "Invalid approval status" });
  }
  if (creditLimit !== undefined && (Number(creditLimit) < 0 || Number(creditLimit) > 10_000_000)) {
    return res.status(400).json({ error: "Credit limit out of range (0 - 10,000,000)" });
  }

  const { data: cust } = await sb.from("customers").select("type, business").eq("id", req.params.id).maybeSingle();
  if (!cust) return res.status(404).json({ error: "Customer not found" });
  if (cust.type !== "b2b") return res.status(400).json({ error: "Credit only available for B2B customers" });

  const session = (req as any).session;
  const existingBiz = (cust.business as Record<string, unknown> | null) ?? {};

  const updatedBiz = {
    ...existingBiz,
    allowCredit: allowCredit ?? existingBiz.allowCredit ?? false,
    creditLimit: creditLimit !== undefined ? Number(creditLimit) : (existingBiz.creditLimit ?? 0),
    approvalStatus: approvalStatus ?? existingBiz.approvalStatus ?? "pending",
    approvalNotes: approvalNotes ?? existingBiz.approvalNotes ?? null,
    approvedBy: approvalStatus === "approved" ? session.sub : (existingBiz.approvedBy ?? null),
    approvedAt: approvalStatus === "approved" ? new Date().toISOString() : (existingBiz.approvedAt ?? null),
  };

  const { data, error } = await sb.from("customers")
    .update({ business: updatedBiz })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  const { data: status } = await sb
    .from("v_b2b_credit_status")
    .select("*")
    .eq("customer_id", req.params.id)
    .maybeSingle();

  return res.json({ customer: data, creditStatus: status ?? null });
});

// GET /customers/:id/credit — admin/sales, or the B2B customer themselves
router.get("/customers/:id/credit", requireAuth, async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  const session = (req as any).session as VerifiedSession;
  const isStaff = session.role === "admin" || session.role === "sales";
  if (!isStaff) {
    const { data: selfCust } = await sb.from("customers").select("id").eq("email", session.email).maybeSingle();
    if (!selfCust || (selfCust.id as string) !== req.params.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
  }

  const { data: cust } = await sb.from("customers")
    .select("id, name, type, business")
    .eq("id", req.params.id)
    .maybeSingle();
  if (!cust) return res.status(404).json({ error: "Customer not found" });
  if (cust.type !== "b2b") return res.status(400).json({ error: "Credit only available for B2B customers" });

  const { data: outstanding } = await sb.rpc("customer_outstanding_credit", { p_customer_id: req.params.id });

  const biz = (cust.business as Record<string, unknown>) ?? {};
  const limit = Number(biz.creditLimit ?? 0);
  const out = Number(outstanding ?? 0);

  return res.json({
    customerId: cust.id,
    customerName: cust.name,
    allowCredit: biz.allowCredit ?? false,
    creditLimit: limit,
    approvalStatus: biz.approvalStatus ?? "pending",
    approvalNotes: biz.approvalNotes ?? null,
    approvedBy: biz.approvedBy ?? null,
    approvedAt: biz.approvedAt ?? null,
    outstanding: out,
    available: Math.max(0, limit - out),
  });
});

// DELETE /customers/:id/salespersons/:salespersonId — admin only
router.delete("/customers/:id/salespersons/:salespersonId", requireAdmin, async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  const { error } = await sb.from("customer_assignments")
    .delete()
    .eq("customer_id", req.params.id)
    .eq("salesperson_id", req.params.salespersonId);
  if (error) return res.status(400).json({ error: error.message });
  return res.status(204).send();
});

export default router;
