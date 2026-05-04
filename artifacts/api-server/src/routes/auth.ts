import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "node:crypto";
import { getSupabase } from "../lib/supabase.js";
import { signSessionToken, verifySessionToken } from "../lib/sessionToken.js";

const router = Router();

const BCRYPT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

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
  // Legacy plaintext row — accept once and silently upgrade
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
  const { name, email, phone, password, type, businessName, crNumber, vatNumber, businessTypeId } = req.body as {
    name: string; email: string; phone: string; password: string;
    type?: string; businessName?: string; crNumber?: string; vatNumber?: string; businessTypeId?: string; businessTypeIds?: string[];
  };
  // Support both single businessTypeId and multi-select businessTypeIds array
  const rawBtIds: string[] = Array.isArray(req.body.businessTypeIds) && req.body.businessTypeIds.length > 0
    ? req.body.businessTypeIds as string[]
    : (businessTypeId ? [businessTypeId] : []);

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: "name, email, phone and password are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const lower = email.toLowerCase().trim();
  const sb = getSupabase();

  if (!sb) return res.status(503).json({ error: "Service unavailable" });

  try {
    const { data: existing } = await sb.from("staff").select("id").eq("email", lower).maybeSingle();
    if (existing) return res.status(409).json({ error: "Email is already registered" });
  } catch {
    // ignore lookup errors
  }

  try {
    const { data: existingCust } = await sb.from("customers").select("id").eq("email", lower).maybeSingle();
    if (existingCust) return res.status(409).json({ error: "Email is already registered" });
  } catch {
    // ignore
  }

  const customerId = `c-${Date.now().toString(36)}`;
  const accountType = type === "b2b" ? "b2b" : "b2c";

  let resolvedBtName = "retailer";
  let resolvedBtIds: string[] = [];
  if (accountType === "b2b" && rawBtIds.length > 0) {
    const { data: bts } = await sb.from("business_types").select("id, code").in("id", rawBtIds);
    if (bts && bts.length > 0) {
      resolvedBtIds = bts.map((bt) => bt.id as string);
      resolvedBtName = (bts[0]?.code as string | undefined)?.toLowerCase() ?? "retailer";
    }
  }

  const business =
    accountType === "b2b" && businessName
      ? { name: businessName, type: resolvedBtName, crNumber: crNumber ?? "", vatNumber: vatNumber ?? "", businessTypeIds: resolvedBtIds, businessTypeId: resolvedBtIds[0] ?? null }
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

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const { error: staffErr } = await sb.from("staff").insert({
    email: lower,
    password: passwordHash,
    role: accountType,
    name,
  });

  if (staffErr) {
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
// Change password
// ---------------------------------------------------------------------------
router.post("/auth/change-password", async (req, res) => {
  const { email, currentPassword, newPassword } = req.body as {
    email?: string; currentPassword?: string; newPassword?: string;
  };
  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ error: "email, currentPassword and newPassword are required" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
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
// Forgot password — generate a reset token and store its hash
// ---------------------------------------------------------------------------
router.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) return res.status(400).json({ error: "email is required" });

  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "Service unavailable" });

  const lower = email.toLowerCase().trim();
  const { data: staff } = await sb
    .from("staff").select("id").eq("email", lower).maybeSingle();

  // Always respond the same way to prevent email enumeration
  if (!staff) {
    return res.json({ ok: true, message: "If that address is registered, a reset link has been sent." });
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();

  await sb.from("staff").update({
    reset_token_hash: tokenHash,
    reset_token_expires_at: expiresAt,
  }).eq("id", staff.id as string);

  // R2-NB-18: never return the token in the HTTP response — log to server console only
  const resetUrl = `${process.env["APP_URL"] ?? ""}/reset-password?token=${token}`;
  console.log(`[RESET] Password reset link for ${lower}: ${resetUrl}`);
  // TODO: wire to email provider (Resend/SendGrid). Token is logged to server console for now.
  return res.json({ ok: true, message: "If that address is registered, a reset link has been sent." });
});

// ---------------------------------------------------------------------------
// Reset password — verify token hash and update password
// ---------------------------------------------------------------------------
router.post("/auth/reset-password", async (req, res) => {
  const { token, newPassword } = req.body as { token?: string; newPassword?: string };
  if (!token || !newPassword) {
    return res.status(400).json({ error: "token and newPassword are required" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "Service unavailable" });

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data: staff } = await sb
    .from("staff")
    .select("id, reset_token_expires_at")
    .eq("reset_token_hash", tokenHash)
    .maybeSingle();

  if (!staff) return res.status(400).json({ error: "Invalid or expired reset token" });

  const expiresAt = staff.reset_token_expires_at as string | null;
  if (!expiresAt || new Date(expiresAt) < new Date()) {
    return res.status(400).json({ error: "Reset token has expired" });
  }

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  const { error: updErr } = await sb.from("staff").update({
    password: newHash,
    reset_token_hash: null,
    reset_token_expires_at: null,
  }).eq("id", staff.id as string);

  if (updErr) return res.status(500).json({ error: updErr.message });

  return res.json({ ok: true, message: "Password updated successfully." });
});

// ---------------------------------------------------------------------------
// Set password (authenticated — salesperson/admin already logged in)
// ---------------------------------------------------------------------------
router.post("/auth/set-password", async (req, res) => {
  const header = req.headers["authorization"];
  const token = typeof header === "string" && header.startsWith("Bearer ") ? header.slice(7) : "";
  const session = verifySessionToken(token);
  if (!session) return res.status(401).json({ error: "Invalid or expired session" });

  const { newPassword } = req.body as { newPassword?: string };
  if (!newPassword) return res.status(400).json({ error: "newPassword is required" });
  if (newPassword.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "Service unavailable" });

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  const { error: updErr } = await sb.from("staff").update({ password: newHash }).eq("id", session.sub);
  if (updErr) return res.status(500).json({ error: updErr.message });

  return res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Initial admin bootstrap
// ---------------------------------------------------------------------------
router.post("/auth/bootstrap-admin", async (req, res) => {
  const expectedToken = process.env["BOOTSTRAP_TOKEN"];
  if (!expectedToken || expectedToken.length < 16) {
    return res.status(403).json({
      error: "Bootstrap is disabled. Set BOOTSTRAP_TOKEN (>=16 chars) in the server environment to enable it.",
    });
  }
  // R2-NB-25: constant-time comparison padded to fixed length to prevent timing leak
  const provided = req.headers["x-bootstrap-token"];
  if (typeof provided !== "string") {
    return res.status(401).json({ error: "Invalid bootstrap token" });
  }
  const PAD = 64;
  const aBuf = Buffer.from(provided.padEnd(PAD, "\0").slice(0, PAD));
  const bBuf = Buffer.from(expectedToken.padEnd(PAD, "\0").slice(0, PAD));
  let diff = provided.length !== expectedToken.length ? 1 : 0;
  for (let i = 0; i < PAD; i++) diff |= aBuf[i]! ^ bBuf[i]!;
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
