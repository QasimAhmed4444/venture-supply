import { Router } from "express";
import { getSupabase } from "../lib/supabase.js";
import { seedCustomers } from "../lib/seedData.js";

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

router.get("/customers", async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.json(seedCustomers);
  try {
    let q = sb.from("customers").select("*").order("created_at", { ascending: false });
    if (req.query.type && req.query.type !== "all") q = q.eq("type", req.query.type as string);
    const { data, error } = await q;
    if (error || !data) return res.json(seedCustomers);
    return res.json(data.length ? data.map(toCamel) : seedCustomers);
  } catch {
    return res.json(seedCustomers);
  }
});

router.get("/customers/:id", async (req, res) => {
  const sb = getSupabase();
  if (!sb) {
    const c = seedCustomers.find((x: any) => x.id === req.params.id);
    if (!c) return res.status(404).json({ error: "not found" });
    return res.json(c);
  }
  try {
    const { data } = await sb.from("customers").select("*").eq("id", req.params.id).single();
    if (!data) return res.status(404).json({ error: "not found" });
    return res.json(toCamel(data as Record<string, unknown>));
  } catch {
    return res.status(500).json({ error: "internal" });
  }
});

export default router;
