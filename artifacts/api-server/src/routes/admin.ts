import { Router } from "express";
import bcrypt from "bcryptjs";
import { getSupabase } from "../lib/supabase.js";
import { seedProducts, seedCategories, seedBrands, seedCustomers, seedSalespersons, seedOrders } from "../lib/seedData.js";
import { requireAdmin } from "../middlewares/requireAuth.js";
import { logger } from "../lib/logger.js";

const router = Router();

// /admin/seed re-creates demo catalog/orders/staff data. Restricted to
// authenticated admins so a production endpoint can never be hit by an
// unauthenticated caller (which previously could re-introduce well-known
// demo credentials).
router.post("/admin/seed", requireAdmin, async (_req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "Supabase not configured" });

  const results: Record<string, unknown> = {};

  const { error: catErr, data: catData } = await sb
    .from("categories").upsert(seedCategories, { onConflict: "id" }).select("id");
  results.categories = catErr ? { error: catErr.message } : { upserted: catData?.length };

  const { error: brandErr, data: brandData } = await sb
    .from("brands").upsert(seedBrands, { onConflict: "id" }).select("id");
  results.brands = brandErr ? { error: brandErr.message } : { upserted: brandData?.length };

  const { error: prodErr, data: prodData } = await sb
    .from("products").upsert(seedProducts, { onConflict: "id" }).select("id");
  results.products = prodErr ? { error: prodErr.message } : { upserted: prodData?.length };

  // Salespersons must exist before customers (customers.assigned_salesperson_id FK)
  // and before orders (orders.salesperson_id FK).
  const spRows = seedSalespersons.map((s) => ({
    id: s.id, name: s.name, email: s.email, phone: s.phone, region: s.region,
    monthly_target: s.monthlyTarget, monthly_sales: s.monthlySales,
    customers_count: s.customersCount, orders_this_month: s.ordersThisMonth,
    pending_orders: s.pendingOrders, status: s.status, joined_date: s.joinedDate,
  }));
  const { error: spErr, data: spData } = await sb
    .from("salespersons").upsert(spRows, { onConflict: "id" }).select("id");
  results.salespersons = spErr ? { error: spErr.message } : { upserted: spData?.length };

  const customerRows = seedCustomers.map((c) => ({
    id: c.id, name: c.name, email: c.email, phone: c.phone, city: c.city, type: c.type,
    total_orders: c.totalOrders, lifetime_value: c.lifetimeValue,
    assigned_salesperson_id: c.assignedSalespersonId,
    joined_date: c.joinedDate, business: c.business, addresses: c.addresses,
  }));
  const { error: custErr, data: custData } = await sb
    .from("customers").upsert(customerRows, { onConflict: "id" }).select("id");
  results.customers = custErr ? { error: custErr.message } : { upserted: custData?.length };

  const orderRows = seedOrders.map((o: any) => ({
    id: o.id, tracking_id: o.trackingId, customer_id: o.customerId,
    customer_name: o.customerName, customer_type: o.customerType,
    salesperson_id: o.salespersonId ?? null, status: o.status, order_type: o.orderType,
    payment_method: o.paymentMethod, placed_at: o.placedAt, estimated_at: o.estimatedAt,
    delivery_address: o.deliveryAddress, city: o.city, items: o.items,
    subtotal: o.subtotal, vat: o.vat, delivery_charge: o.deliveryCharge,
    total: o.total, history: o.history,
  }));
  const { error: orderErr, data: orderData } = await sb
    .from("orders").upsert(orderRows, { onConflict: "id" }).select("id");
  results.orders = orderErr ? { error: orderErr.message } : { upserted: orderData?.length };

  // Staff seeding requires explicit, operator-supplied passwords. There is
  // no longer any in-code default — running /admin/seed without
  // SEED_ADMIN_PASSWORD and SEED_SALES_PASSWORD will skip the staff rows
  // entirely. Passwords are bcrypt-hashed before being written. To onboard
  // the very first admin without seeding, use /api/auth/bootstrap-admin.
  const envAdminPwd = process.env["SEED_ADMIN_PASSWORD"];
  const envSalesPwd = process.env["SEED_SALES_PASSWORD"];

  if (!envAdminPwd || !envSalesPwd) {
    results.staff = {
      error:
        "Skipping staff seed: set SEED_ADMIN_PASSWORD and SEED_SALES_PASSWORD " +
        "(strong, owner-controlled) before running /admin/seed, or onboard the " +
        "first admin via /api/auth/bootstrap-admin and add the rest from the admin UI.",
      skipped: true,
    };
  } else {
    const adminEmail = (process.env["SEED_ADMIN_EMAIL"] ?? "admin@example.com").toLowerCase();
    const salesEmail = (process.env["SEED_SALES_EMAIL"] ?? "sales@example.com").toLowerCase();

    const [adminHash, salesHash] = await Promise.all([
      bcrypt.hash(envAdminPwd, 10),
      bcrypt.hash(envSalesPwd, 10),
    ]);
    const staff = [
      { id: "staff-admin-001", email: adminEmail, password: adminHash, role: "admin", name: "Sami Al-Rashid", salesperson_id: null },
      { id: "staff-sales-001", email: salesEmail, password: salesHash, role: "sales", name: "Omar Al-Shehri", salesperson_id: "sp-001" },
    ];
    const { error: staffErr, data: staffData } = await sb
      .from("staff").upsert(staff, { onConflict: "id" }).select("id");
    results.staff = staffErr ? { error: staffErr.message } : { upserted: staffData?.length };
  }

  logger.info({ results }, "Seed completed");
  return res.json({ ok: true, results });
});

export default router;
