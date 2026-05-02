import { Router } from "express";
import { getSupabase } from "../lib/supabase.js";
import { seedBrands } from "../lib/seedData.js";

const router = Router();

function toCamel(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    enTagline: row.en_tagline,
    arTagline: row.ar_tagline,
    accent: row.accent,
    logo: row.logo_url ?? undefined,
    isPhoto: row.is_photo ?? false,
  };
}

function toSnake(b: Record<string, unknown>) {
  const row: Record<string, unknown> = {};
  if (b.name !== undefined) row.name = b.name;
  if (b.enTagline !== undefined) row.en_tagline = b.enTagline;
  if (b.arTagline !== undefined) row.ar_tagline = b.arTagline;
  if (b.accent !== undefined) row.accent = b.accent;
  if (b.logo !== undefined) row.logo_url = b.logo;
  if (b.isPhoto !== undefined) row.is_photo = b.isPhoto;
  return row;
}

router.get("/brands", async (_req, res) => {
  const sb = getSupabase();
  if (!sb) return res.json(seedBrands.map(toCamel));
  try {
    const { data, error } = await sb.from("brands").select("*").order("id");
    if (error || !data?.length) return res.json(seedBrands.map(toCamel));
    return res.json(data.map(toCamel));
  } catch {
    return res.json(seedBrands.map(toCamel));
  }
});

router.post("/brands", async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  try {
    const b = req.body as Record<string, unknown>;
    if (!b.id) b.id = String(b.name ?? `brand-${Date.now()}`).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const row = { id: b.id, ...toSnake(b) };
    const { data, error } = await sb.from("brands").insert(row).select().single();
    if (error || !data) return res.status(400).json({ error: error?.message ?? "insert failed" });
    return res.status(201).json(toCamel(data as Record<string, unknown>));
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "internal" });
  }
});

router.put("/brands/:id", async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  try {
    const updates = toSnake(req.body as Record<string, unknown>);
    const { data, error } = await sb.from("brands").update(updates).eq("id", req.params.id).select().single();
    if (error || !data) return res.status(400).json({ error: error?.message ?? "update failed" });
    return res.json(toCamel(data as Record<string, unknown>));
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "internal" });
  }
});

router.delete("/brands/:id", async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  try {
    const { error } = await sb.from("brands").delete().eq("id", req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "internal" });
  }
});

export default router;
