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

export default router;
