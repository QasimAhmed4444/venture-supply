import { Router } from "express";
import { getSupabase } from "../lib/supabase.js";
import { requireAuth, requireRole, requireAdmin } from "../middlewares/requireAuth.js";
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
    lifetimeValue: Number(row.lifetime_value),
    assignedSalespersonId: row.assigned_salesperson_id ?? undefined,
    joinedDate: row.joined_date,
    business: row.business ?? undefined,
    addresses: row.addresses ?? [],
  };
}

// GET /customers — admin and sales only
router.get("/customers", requireRole("admin", "sales"), async (req, res) => {
  const session = (req as any).session as VerifiedSession;
  const sb = getSupabase();
  if (!sb) return res.json([]);
  try {
    let q = sb.from("customers").select("*").order("created_at", { ascending: false });
    if (req.query.type && req.query.type !== "all") q = q.eq("type", req.query.type as string);

    // For sales role, scope to customers assigned to this salesperson
    if (session.role === "sales") {
      const { data: staff } = await sb.from("staff").select("salesperson_id").eq("id", session.sub).maybeSingle();
      const spId = (staff?.salesperson_id as string | null) ?? null;
      if (!spId) return res.json([]);
      q = q.eq("assigned_salesperson_id", spId);
    }

    const { data, error } = await q;
    if (error || !data) return res.json([]);
    return res.json(data.map(toCamel));
  } catch {
    return res.json([]);
  }
});

// POST /customers — admin and sales only
router.post("/customers", requireRole("admin", "sales"), async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  const b = req.body;
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
router.put("/customers/:id", requireAuth, async (req, res) => {
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
  if (b.name !== undefined) payload.name = b.name;
  if (b.email !== undefined) payload.email = b.email;
  if (b.phone !== undefined) payload.phone = b.phone;
  if (b.city !== undefined) payload.city = b.city;
  if (b.type !== undefined) payload.type = b.type;
  if (b.assignedSalespersonId !== undefined) payload.assigned_salesperson_id = b.assignedSalespersonId;
  if (b.business !== undefined) payload.business = b.business;
  if (b.addresses !== undefined) payload.addresses = b.addresses;
  const { data, error } = await sb.from("customers").update(payload).eq("id", req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  return res.json(toCamel(data as Record<string, unknown>));
});

// DELETE /customers/:id — admin only
router.delete("/customers/:id", requireAdmin, async (req, res) => {
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

    // B2C/B2B can only see their own record
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

export default router;
