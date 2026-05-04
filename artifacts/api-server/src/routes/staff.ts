import { Router } from "express";
import bcrypt from "bcryptjs";
import { getSupabase } from "../lib/supabase.js";
import { requireAdmin } from "../middlewares/requireAuth.js";
import { auditLog } from "../middlewares/auditLog.js";

const router = Router();

router.use("/staff", requireAdmin);

const BCRYPT_ROUNDS = 10;
const STAFF_ROLES = new Set(["admin", "sales"]);

function toCamel(row: Record<string, unknown>) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    salespersonId: (row.salesperson_id as string | null) ?? null,
    createdAt: row.created_at,
  };
}

router.get("/staff", async (_req, res) => {
  const sb = getSupabase();
  if (!sb) return res.json([]);
  const { data, error } = await sb
    .from("staff")
    .select("id,email,name,role,salesperson_id,created_at")
    .in("role", ["admin", "sales"])
    .order("created_at", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  return res.json((data ?? []).map((r) => toCamel(r as Record<string, unknown>)));
});

router.post("/staff", auditLog("create", "staff"), async (req, res) => {
  const { name, email, password, role, salespersonId } = req.body as {
    name?: string; email?: string; password?: string; role?: string; salespersonId?: string | null;
  };

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "name, email, password and role are required" });
  }
  if (!STAFF_ROLES.has(role)) {
    return res.status(400).json({ error: "role must be 'admin' or 'sales'" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });

  const lower = email.toLowerCase().trim();

  const { data: existing } = await sb.from("staff").select("id").eq("email", lower).maybeSingle();
  if (existing) return res.status(409).json({ error: "Email is already registered" });

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const { data, error } = await sb
    .from("staff")
    .insert({
      email: lower,
      password: passwordHash,
      role,
      name,
      salesperson_id: role === "sales" ? salespersonId ?? null : null,
    })
    .select("id,email,name,role,salesperson_id,created_at")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json(toCamel(data as Record<string, unknown>));
});

router.put("/staff/:id", auditLog("update", "staff"), async (req, res) => {
  const { name, email, password, role, salespersonId } = req.body as {
    name?: string; email?: string; password?: string; role?: string; salespersonId?: string | null;
  };

  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });

  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (email !== undefined) update.email = email.toLowerCase().trim();
  if (role !== undefined) {
    if (!STAFF_ROLES.has(role)) return res.status(400).json({ error: "role must be 'admin' or 'sales'" });
    update.role = role;
  }
  if (salespersonId !== undefined) update.salesperson_id = salespersonId;
  if (password !== undefined && password !== "") {
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    update.password = await bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  const { data, error } = await sb
    .from("staff")
    .update(update)
    .eq("id", req.params.id)
    .in("role", ["admin", "sales"])
    .select("id,email,name,role,salesperson_id,created_at")
    .single();

  if (error || !data) return res.status(400).json({ error: error?.message ?? "Not found" });
  return res.json(toCamel(data as Record<string, unknown>));
});

// Use the delete_staff_safely RPC which enforces last-admin protection atomically
// R2-NB-19: correct param name p_id, self-delete guard, last-admin 409
router.delete("/staff/:id", auditLog("delete", "staff"), async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });

  const session = (req as any).session;
  if (req.params.id === session?.sub) {
    return res.status(400).json({ error: "Cannot delete your own account" });
  }

  const { data, error } = await sb.rpc("delete_staff_safely", { p_id: req.params.id });
  if (error) {
    if (error.message?.toLowerCase().includes("last admin")) {
      return res.status(409).json({ error: "Cannot delete the last admin" });
    }
    return res.status(400).json({ error: error.message });
  }
  if (data === false) {
    return res.status(409).json({ error: "Cannot delete the last admin" });
  }
  return res.status(204).send();
});

export default router;
