import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── category mapping ─────────────────────────────────────────────────────────
const CATEGORY_MAP = {
  "TEA":           { id: "beverages",    enName: "Beverages",        arName: "المشروبات" },
  "OIL":           { id: "oils",         enName: "Oils",             arName: "الزيوت" },
  "PINK SALT":     { id: "pink-salt",    enName: "Pink Salt",        arName: "ملح وردي" },
  "FRIED ONION":   { id: "specialty",    enName: "Specialty Items",  arName: "منتجات متخصصة" },
  "PULSES -CHEF":  { id: "pulses",       enName: "Pulses & Lentils", arName: "البقوليات والعدس" },
  "VERMICELLI":    { id: "vermicelli",   enName: "Vermicelli",       arName: "الشعيرية" },
  "HERBS &  SPICES": { id: "plain-spices", enName: "Plain Spices",  arName: "التوابل" },
  "RECIPE - CHEF": { id: "recipe-mix",  enName: "Recipe Mix",       arName: "خلطات الطبخ" },
  "RECIPE - MALKA":{ id: "recipe-mix",  enName: "Recipe Mix",       arName: "خلطات الطبخ" },
  "PLAIN - MALKA": { id: "plain-spices",enName: "Plain Spices",     arName: "التوابل" },
  "DESERT - MALKA":{ id: "desserts",    enName: "Desserts",         arName: "الحلويات" },
  "CURRY POWDER":  { id: "recipe-mix",  enName: "Recipe Mix",       arName: "خلطات الطبخ" },
  "RICE ":         { id: "rice",        enName: "Rice",             arName: "الأرز" },
  "RICE":          { id: "rice",        enName: "Rice",             arName: "الأرز" },
};

// ── brand mapping ─────────────────────────────────────────────────────────────
function detectBrand(name) {
  const n = name.toLowerCase();
  if (n.includes("malka"))    return "malka";
  if (n.includes("vital"))    return "vital";
  if (n.includes("chef"))     return "chef-flavor";
  if (n.includes("dawn"))     return "chef-flavor";
  if (n.includes("al-hijaaz") || n.includes("hijaaz")) return "chef-flavor";
  if (n.includes("al qaryah") || n.includes("qaryah")) return "chef-flavor";
  return "chef-flavor";
}

// ── product image pool (Unsplash) by category ─────────────────────────────────
const IMAGES = {
  "beverages":   "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80",
  "oils":        "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80",
  "pink-salt":   "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&q=80",
  "specialty":   "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=400&q=80",
  "pulses":      "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400&q=80",
  "vermicelli":  "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&q=80",
  "plain-spices":"https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80",
  "recipe-mix":  "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=400&q=80",
  "desserts":    "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80",
  "rice":        "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&q=80",
};

// ── parse Excel ───────────────────────────────────────────────────────────────
async function parseProducts() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(resolve(__dirname, "../../attached_assets/VS_Product_List_1777735871852.xlsx"));
  const sheet = wb.getWorksheet(1);

  const products = [];
  let currentCategory = null;
  let skuCounters = {};

  for (let r = 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const col2 = row.getCell(2).value;
    const col3 = row.getCell(3).value;
    const col4 = row.getCell(4).value;
    const col6 = row.getCell(6).value;

    // category header rows: col2 === col3 === col4 (all same string, category name)
    const c2str = typeof col2 === "string" ? col2.trim() : null;
    const c3str = typeof col3 === "string" ? col3.trim() : null;
    if (c2str && c2str === c3str && CATEGORY_MAP[c2str]) {
      currentCategory = c2str;
      skuCounters[currentCategory] = skuCounters[currentCategory] || 0;
      continue;
    }
    // Also check the trimmed version with trailing space
    const c2trim = c2str?.trimEnd();
    if (c2trim && c2trim === c3str?.trimEnd() && CATEGORY_MAP[c2trim + " "]) {
      currentCategory = c2trim + " ";
      skuCounters[currentCategory] = skuCounters[currentCategory] || 0;
      continue;
    }
    if (c2trim && CATEGORY_MAP[c2trim]) {
      currentCategory = c2trim;
      skuCounters[currentCategory] = skuCounters[currentCategory] || 0;
      continue;
    }

    if (!currentCategory) continue;

    // product row: col3 is product name string or col3 has value
    let enName = null;
    if (typeof col3 === "string") enName = col3.trim();
    else if (col3 && typeof col3 === "object" && col3.richText) enName = col3.richText.map(r => r.text).join("").trim();

    if (!enName || enName === currentCategory) continue;
    // Skip header-like row
    if (enName.toUpperCase() === "PRODUCT") continue;

    let arName = null;
    if (typeof col4 === "string") arName = col4.trim();
    else if (col4 && typeof col4 === "object" && col4.richText) arName = col4.richText.map(r => r.text).join("").trim();
    if (!arName) arName = enName;

    const packSize = typeof col6 === "string" ? col6.trim() : "CTN";
    const cat = CATEGORY_MAP[currentCategory] || CATEGORY_MAP[currentCategory?.trimEnd()];
    if (!cat) continue;

    skuCounters[currentCategory] = (skuCounters[currentCategory] || 0) + 1;
    const catCode = cat.id.toUpperCase().replace(/-/g, "").slice(0, 4);
    const sku = `VS-${catCode}-${String(skuCounters[currentCategory]).padStart(3, "0")}`;

    const brandId = detectBrand(enName);
    const image = IMAGES[cat.id] || IMAGES["plain-spices"];

    // Derive reasonable price from pack size / product type
    const isLargeBag = packSize === "BAG" && enName.includes("40Kg");
    const b2bPrice = isLargeBag ? 180 : packSize === "BAG" ? 95 : packSize === "TIN" ? 145 : 45;
    const b2cPrice = +(b2bPrice * 1.25).toFixed(2);

    products.push({
      id: `vs-xl-${sku.toLowerCase()}`,
      sku,
      en_name: enName,
      ar_name: arName,
      category_id: cat.id,
      brand_id: brandId,
      image,
      b2c_price: b2cPrice,
      b2b_price: b2bPrice,
      stock_qty: Math.floor(20 + Math.random() * 80),
      stock_status: "in-stock",
      pack_size: packSize,
      audience: "both",
      packs: JSON.stringify([{ size: packSize, b2cPrice, b2bPrice, minOrderQty: 1 }]),
      min_order_qty: 1,
      rating: +(3.8 + Math.random() * 1.2).toFixed(1),
      review_count: Math.floor(5 + Math.random() * 120),
      featured: false,
      created_at: new Date().toISOString(),
    });
  }

  return products;
}

// ── ensure categories exist ───────────────────────────────────────────────────
async function ensureCategories() {
  const cats = Object.values(CATEGORY_MAP);
  const unique = [...new Map(cats.map(c => [c.id, c])).values()];
  for (const c of unique) {
    const { error } = await sb.from("categories").upsert({
      id: c.id,
      en_name: c.enName,
      ar_name: c.arName,
      image: IMAGES[c.id] || IMAGES["plain-spices"],
    }, { onConflict: "id" });
    if (error) console.warn("category upsert warn:", c.id, error.message);
    else console.log("category ok:", c.id);
  }
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Parsing Excel…");
  const products = await parseProducts();
  console.log(`Parsed ${products.length} products`);

  console.log("\nEnsuring categories…");
  await ensureCategories();

  console.log("\nUpserting products in batches…");
  const BATCH = 20;
  let inserted = 0;
  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH);
    const { error } = await sb.from("products").upsert(batch, { onConflict: "sku" });
    if (error) {
      console.error(`Batch ${i}–${i + BATCH - 1} error:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`Upserted ${inserted}/${products.length}`);
    }
  }

  console.log(`\nDone! ${inserted} products imported.`);
  if (inserted < products.length) console.warn(`${products.length - inserted} products had errors.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
