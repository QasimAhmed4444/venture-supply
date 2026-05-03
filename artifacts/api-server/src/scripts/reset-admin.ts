import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const url = process.env["SUPABASE_URL"] ?? "";
const rawKey = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";
const match = rawKey.match(/eyJ[\w-]+\.eyJ[\w-]+\.[\w-]+/);
const key = match ? match[0] : rawKey.trim();

if (!url || !key) {
  console.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const NEW_EMAIL = "admin@venturesupply.sa";
const NEW_PASSWORD = "pakistan12345";
const NEW_NAME = "Admin";

const { data: admins, error } = await sb.from("staff").select("id, email, name").eq("role", "admin");
if (error) { console.error("Query failed:", error.message); process.exit(1); }

console.log("Existing admins:", admins);

if (!admins || admins.length === 0) {
  console.log("No admin found — inserting fresh one.");
  const hash = await bcrypt.hash(NEW_PASSWORD, 10);
  const { error: insErr } = await sb.from("staff").insert({ email: NEW_EMAIL, password: hash, role: "admin", name: NEW_NAME });
  if (insErr) { console.error("Insert failed:", insErr.message); process.exit(1); }
  console.log("Admin created:", NEW_EMAIL);
} else {
  const admin = admins[0]!;
  console.log(`Updating admin id=${admin.id} (${admin.email}) → ${NEW_EMAIL}`);
  const hash = await bcrypt.hash(NEW_PASSWORD, 10);
  const { error: updErr } = await sb.from("staff").update({ email: NEW_EMAIL, password: hash, name: NEW_NAME }).eq("id", admin.id);
  if (updErr) { console.error("Update failed:", updErr.message); process.exit(1); }
  console.log("Done. Admin is now:", NEW_EMAIL);
}
