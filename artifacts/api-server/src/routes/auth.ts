import { Router } from "express";
import { getSupabase } from "../lib/supabase.js";

const router = Router();

const HARDCODED: Record<string, { password: string; role: string; name: string; salespersonId?: string }> = {
  "admin@example.com": { password: "Admin@12345", role: "admin", name: "Sami Al-Rashid" },
  "sales@example.com": { password: "Sales@12345", role: "sales", name: "Omar Al-Shehri", salespersonId: "sp-001" },
};

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
        return res.json({
          ok: true,
          role: data.role,
          name: data.name,
          salespersonId: data.salesperson_id ?? undefined,
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

export default router;
