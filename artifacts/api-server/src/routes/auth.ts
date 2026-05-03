import { Router } from "express";
import bcrypt from "bcryptjs";
import { getSupabase } from "../lib/supabase.js";
import { signSessionToken } from "../lib/sessionToken.js";

const router = Router();

const BCRYPT_ROUNDS = 10;

function isBcryptHash(value: unknown): value is string {
  return typeof value === "string" && /^\$2[aby]\$/.test(value);
}

async function verifyPassword(
  sb: ReturnType<typeof getSupabase>,
  staffId: string,
  storedPassword: string,
  submittedPassword: string,
): Promise<boolean> {
  if (isBcryptHash(storedPassword)) {
    return bcrypt.compare(submittedPassword, storedPassword);
  }
  // Legacy plaintext row (e.g. created by an older demo seed). Accept once
  // and silently upgrade to a bcrypt hash so subsequent logins are secure.
  if (storedPassword !== submittedPassword) return false;
  if (sb) {
    try {
      const upgraded = await bcrypt.hash(submittedPassword, BCRYPT_ROUNDS);
      await sb.from("staff").update({ password: upgraded }).eq("id", staffId);
    } catch {
      // best-effort upgrade; do not fail the login on hash error
    }
  }
  return true;
}

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

  if (!sb) {
    return res.status(503).json({ error: "Authentication service unavailable" });
  }

  const { data: staff, error } = await sb
    .from("staff")
    .select("*")
    .eq("email", lower)
    .maybeSingle();

  if (error || !staff) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ok = await verifyPassword(
    sb,
    staff.id as string,
    staff.password as string,
    password,
  );
  if (!ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const role = staff.role as string;
  const token = signSessionToken({ sub: staff.id as string, role, email: lower });

  if (role === "b2c" || role === "b2b") {
    const { data: cust } = await sb
      .from("customers")
      .select("*")
      .eq("email", lower)
      .single();
    return res.json({
      ok: true,
      role,
      name: staff.name as string,
      token,
      customer: cust ? customerToCamel(cust as Record<string, unknown>) : null,
    });
  }

  return res.json({
    ok: true,
    role,
    name: staff.name as string,
    token,
    salespersonId: (staff.salesperson_id as string | undefined) ?? undefined,
  });
});

router.post("/auth/register", async (req, res) => {
  const { name, email, phone, password, type, businessName, crNumber, vatNumber } = req.body as {
    name: string; email: string; phone: string; password: string;
    type?: string; businessName?: string; crNumber?: string; vatNumber?: string;
  };

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: "name, email, phone and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
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
    const isRls = custErr?.message?.toLowerCase().includes("row-level security");
    const userMsg = isRls
      ? "Registration is temporarily unavailable — please try again in a moment."
      : (custErr?.message ?? "Could not create account");
    req.log?.error({ supabaseCode: custErr?.code, supabaseMsg: custErr?.message }, "customers INSERT failed");
    return res.status(400).json({ error: userMsg });
  }

  // Store hashed credentials in staff table
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const { error: staffErr } = await sb.from("staff").insert({
    email: lower,
    password: passwordHash,
    role: accountType,
    name,
  });

  if (staffErr) {
    // Roll back customer row
    await sb.from("customers").delete().eq("id", customerId);
    return res.status(400).json({ error: staffErr.message });
  }

  const { data: createdStaff } = await sb
    .from("staff").select("id").eq("email", lower).maybeSingle();
  const token = createdStaff
    ? signSessionToken({ sub: createdStaff.id as string, role: accountType, email: lower })
    : undefined;

  return res.status(201).json({
    ok: true,
    role: accountType,
    name,
    token,
    customer: customerToCamel(newCustomer as Record<string, unknown>),
  });
});

// ---------------------------------------------------------------------------
// Change password — verifies current password against staff table
// ---------------------------------------------------------------------------
router.post("/auth/change-password", async (req, res) => {
  const { email, currentPassword, newPassword } = req.body as {
    email?: string; currentPassword?: string; newPassword?: string;
  };
  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ error: "email, currentPassword and newPassword are required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  if (newPassword === currentPassword) {
    return res.status(400).json({ error: "New password must differ from current password" });
  }
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "Service unavailable" });

  const lower = email.toLowerCase().trim();
  const { data: staff, error } = await sb
    .from("staff").select("id, password").eq("email", lower).maybeSingle();
  if (error || !staff) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await verifyPassword(sb, staff.id as string, staff.password as string, currentPassword);
  if (!ok) return res.status(401).json({ error: "Current password is incorrect" });

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  const { error: updErr } = await sb.from("staff").update({ password: newHash }).eq("id", staff.id as string);
  if (updErr) return res.status(500).json({ error: updErr.message });

  return res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Initial admin bootstrap
// ---------------------------------------------------------------------------
// One-shot endpoint to create the first admin staff member. To use it, the
// operator must:
//   1. Set BOOTSTRAP_TOKEN to a strong, secret value in the deployment env
//      (the endpoint returns 403 / "disabled" if it is unset).
//   2. Send that exact token in the `X-Bootstrap-Token` header.
//   3. Have zero existing admin rows (returns 409 once any admin exists, so
//      this path cannot be used for privilege escalation later).
// All three checks must pass — there is no public path to create an admin.
router.post("/auth/bootstrap-admin", async (req, res) => {
  const expectedToken = process.env["BOOTSTRAP_TOKEN"];
  if (!expectedToken || expectedToken.length < 16) {
    return res.status(403).json({
      error: "Bootstrap is disabled. Set BOOTSTRAP_TOKEN (>=16 chars) in the server environment to enable it.",
    });
  }
  const provided = req.headers["x-bootstrap-token"];
  if (typeof provided !== "string" || provided.length !== expectedToken.length) {
    return res.status(401).json({ error: "Invalid bootstrap token" });
  }
  // Constant-time comparison
  const a = Buffer.from(provided);
  const b = Buffer.from(expectedToken);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  if (diff !== 0) {
    return res.status(401).json({ error: "Invalid bootstrap token" });
  }

  const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "Service unavailable" });

  const { data: existingAdmins, error: chkErr } = await sb
    .from("staff").select("id").eq("role", "admin").limit(1);
  if (chkErr) return res.status(500).json({ error: chkErr.message });
  if (existingAdmins && existingAdmins.length > 0) {
    return res.status(409).json({ error: "An admin already exists. Use the staff management UI." });
  }

  const lower = email.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const { error: insErr } = await sb.from("staff").insert({
    email: lower, password: passwordHash, role: "admin", name,
  });
  if (insErr) return res.status(400).json({ error: insErr.message });
  return res.status(201).json({ ok: true });
});

export default router;
