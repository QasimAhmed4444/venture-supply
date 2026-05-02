import { Router } from "express";
import { getSupabase } from "../lib/supabase.js";

const router = Router();

const HARDCODED: Record<string, { password: string; role: string; name: string; salespersonId?: string }> = {
  "admin@example.com": { password: "Admin@12345", role: "admin", name: "Sami Al-Rashid" },
  "sales@example.com": { password: "Sales@12345", role: "sales", name: "Omar Al-Shehri", salespersonId: "sp-001" },
};

function customerToCamel(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    type: row.type,
    totalOrders: row.total_orders ?? 0,
    lifetimeValue: Number(row.lifetime_value ?? 0),
    assignedSalespersonId: row.assigned_salesperson_id ?? undefined,
    joinedDate: row.joined_date,
    business: row.business ?? undefined,
    addresses: row.addresses ?? [],
  };
}

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    return res.status(400).json({ error: "email and password required" });
  }

  const lower = email.toLowerCase().trim();
  const sb = getSupabase();

  if (sb) {
    try {
      const { data } = await sb
        .from("staff")
        .select("*")
        .eq("email", lower)
        .eq("password", password)
        .single();

      if (data) {
        // For customer roles, look up their full customer record by email
        if (data.role === "b2c" || data.role === "b2b") {
          const { data: cust } = await sb
            .from("customers")
            .select("*")
            .eq("email", lower)
            .single();
          return res.json({
            ok: true,
            role: data.role as string,
            name: data.name as string,
            customer: cust ? customerToCamel(cust as Record<string, unknown>) : null,
          });
        }
        return res.json({
          ok: true,
          role: data.role as string,
          name: data.name as string,
          salespersonId: (data.salesperson_id as string | undefined) ?? undefined,
        });
      }
    } catch {
      // fall through to hardcoded
    }
  }

  const hc = HARDCODED[lower];
  if (hc && hc.password === password) {
    return res.json({ ok: true, role: hc.role, name: hc.name, salespersonId: hc.salespersonId });
  }

  return res.status(401).json({ error: "Invalid credentials" });
});

router.post("/auth/register", async (req, res) => {
  const { name, email, phone, password, type, businessName, crNumber, vatNumber } = req.body as {
    name: string; email: string; phone: string; password: string;
    type?: string; businessName?: string; crNumber?: string; vatNumber?: string;
  };

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: "name, email, phone and password are required" });
  }

  const lower = email.toLowerCase().trim();
  const sb = getSupabase();

  if (!sb) return res.status(503).json({ error: "Service unavailable" });

  // Check for duplicate email in staff (credentials table)
  try {
    const { data: existing } = await sb.from("staff").select("id").eq("email", lower).maybeSingle();
    if (existing) return res.status(409).json({ error: "Email is already registered" });
  } catch {
    // ignore lookup errors
  }

  // Check for duplicate email in customers
  try {
    const { data: existingCust } = await sb.from("customers").select("id").eq("email", lower).maybeSingle();
    if (existingCust) return res.status(409).json({ error: "Email is already registered" });
  } catch {
    // ignore
  }

  // Build customer record
  const customerId = `c-${Date.now().toString(36)}`;
  const accountType = type === "b2b" ? "b2b" : "b2c";
  const business =
    accountType === "b2b" && businessName
      ? { name: businessName, type: "retailer", crNumber: crNumber ?? "", vatNumber: vatNumber ?? "" }
      : null;

  const { data: newCustomer, error: custErr } = await sb
    .from("customers")
    .insert({
      id: customerId,
      name,
      email: lower,
      phone,
      city: null,
      type: accountType,
      total_orders: 0,
      lifetime_value: 0,
      business,
      addresses: [],
      joined_date: new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();

  if (custErr || !newCustomer) {
    return res.status(400).json({ error: custErr?.message ?? "Could not create account" });
  }

  // Store credentials in staff table
  const { error: staffErr } = await sb.from("staff").insert({
    email: lower,
    password,
    role: accountType,
    name,
  });

  if (staffErr) {
    // Roll back customer row
    await sb.from("customers").delete().eq("id", customerId);
    return res.status(400).json({ error: staffErr.message });
  }

  return res.status(201).json({
    ok: true,
    role: accountType,
    name,
    customer: customerToCamel(newCustomer as Record<string, unknown>),
  });
});

export default router;
