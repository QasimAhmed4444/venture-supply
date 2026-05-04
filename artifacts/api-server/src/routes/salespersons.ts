import { Router } from "express";
import { getSupabase } from "../lib/supabase.js";
import { requireAdmin } from "../middlewares/requireAuth.js";

const router = Router();

function toCamel(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    region: row.region,
    monthlyTarget: Number(row.monthly_target ?? 0),
    monthlyNewCustomerTarget: Number(row.monthly_new_customer_target ?? 5),
    monthlyOrderTarget: Number(row.monthly_order_target ?? 20),
    monthlySales: Number(row.monthly_sales ?? 0),
    customersCount: Number(row.customers_count ?? 0),
    ordersThisMonth: Number(row.orders_this_month ?? 0),
    pendingOrders: Number(row.pending_orders ?? 0),
    status: row.status,
    joinedDate: row.joined_date,
    createdAt: row.created_at,
    categoriesServed: Array.isArray(row.categories_served) ? row.categories_served : [],
    assignedCustomerIds: Array.isArray(row.assigned_customer_ids) ? row.assigned_customer_ids : [],
  };
}

function toSnake(body: Record<string, unknown>) {
  return {
    name: body.name,
    email: body.email,
    phone: body.phone,
    region: body.region,
    monthly_target: body.monthlyTarget != null ? Number(body.monthlyTarget) : undefined,
    monthly_new_customer_target: body.monthlyNewCustomerTarget != null ? Number(body.monthlyNewCustomerTarget) : undefined,
    monthly_order_target: body.monthlyOrderTarget != null ? Number(body.monthlyOrderTarget) : undefined,
    monthly_sales: body.monthlySales != null ? Number(body.monthlySales) : undefined,
    customers_count: body.customersCount != null ? Number(body.customersCount) : undefined,
    orders_this_month: body.ordersThisMonth != null ? Number(body.ordersThisMonth) : undefined,
    pending_orders: body.pendingOrders != null ? Number(body.pendingOrders) : undefined,
    status: body.status,
    joined_date: body.joinedDate,
    categories_served: Array.isArray(body.categoriesServed) ? body.categoriesServed : undefined,
    assigned_customer_ids: Array.isArray(body.assignedCustomerIds) ? body.assignedCustomerIds : undefined,
  };
}

router.get("/salespersons", async (_req, res) => {
  const sb = getSupabase();
  if (!sb) return res.json([]);
  const { data, error } = await sb.from("salespersons").select("*").order("monthly_sales", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.json((data ?? []).map(toCamel));
});

router.get("/salespersons/:id", async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  const { data, error } = await sb.from("salespersons").select("*").eq("id", req.params.id).single();
  if (error || !data) return res.status(404).json({ error: "Not found" });
  return res.json(toCamel(data as Record<string, unknown>));
});

router.post("/salespersons", requireAdmin, async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  const id = `sp-${Date.now().toString(36)}`;
  const payload = { id, ...toSnake(req.body) };
  const { data, error } = await sb.from("salespersons").insert(payload).select().single();
  if (error) return res.status(400).json({ error: error.message });

  if (Array.isArray(req.body.assignedCustomerIds) && req.body.assignedCustomerIds.length > 0) {
    const newIds = req.body.assignedCustomerIds as string[];
    await sb.from("customers").update({ assigned_salesperson_id: id }).in("id", newIds);
  }

  return res.status(201).json(toCamel(data as Record<string, unknown>));
});

router.put("/salespersons/:id", requireAdmin, async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  const spId = req.params.id;
  const payload = toSnake(req.body);
  const filtered = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined));
  const { data, error } = await sb.from("salespersons").update(filtered).eq("id", spId).select().single();
  if (error) return res.status(400).json({ error: error.message });

  if (Array.isArray(req.body.assignedCustomerIds)) {
    const newIds = req.body.assignedCustomerIds as string[];
    await sb.from("customers").update({ assigned_salesperson_id: null }).eq("assigned_salesperson_id", spId);
    if (newIds.length > 0) {
      await sb.from("customers").update({ assigned_salesperson_id: spId }).in("id", newIds);
    }
  }

  return res.json(toCamel(data as Record<string, unknown>));
});

router.delete("/salespersons/:id", requireAdmin, async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  const { error } = await sb.from("salespersons").delete().eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  return res.status(204).send();
});

export default router;
