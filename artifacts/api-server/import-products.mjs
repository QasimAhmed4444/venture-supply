import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const CATEGORY_MAP = {
  "TEA":             { id: "beverages",    enName: "Beverages",        arName: "المشروبات" },
  "OIL":             { id: "oils",         enName: "Oils",             arName: "الزيوت" },
  "PINK SALT":       { id: "pink-salt",    enName: "Pink Salt",        arName: "ملح وردي" },
  "FRIED ONION":     { id: "specialty",    enName: "Specialty Items",  arName: "منتجات متخصصة" },
  "PULSES -CHEF":    { id: "pulses",       enName: "Pulses & Lentils", arName: "البقوليات والعدس" },
  "VERMICELLI":      { id: "vermicelli",   enName: "Vermicelli",       arName: "الشعيرية" },
  "HERBS &  SPICES": { id: "plain-spices", enName: "Plain Spices",     arName: "التوابل" },
  "RECIPE - CHEF":   { id: "recipe-mix",   enName: "Recipe Mix",       arName: "خلطات الطبخ" },
  "RECIPE - MALKA":  { id: "recipe-mix",   enName: "Recipe Mix",       arName: "خلطات الطبخ" },
  "PLAIN - MALKA":   { id: "plain-spices", enName: "Plain Spices",     arName: "التوابل" },
  "DESERT - MALKA":  { id: "desserts",     enName: "Desserts",         arName: "الحلويات" },
  "CURRY POWDER":    { id: "recipe-mix",   enName: "Recipe Mix",       arName: "خلطات الطبخ" },
  "RICE":            { id: "rice",         enName: "Rice",             arName: "الأرز" },
};

const IMAGES = {
  beverages:     "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80",
  oils:          "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80",
  "pink-salt":   "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&q=80",
  specialty:     "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=400&q=80",
  pulses:        "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400&q=80",
  vermicelli:    "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&q=80",
  "plain-spices":"https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80",
  "recipe-mix":  "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=400&q=80",
  desserts:      "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80",
  rice:          "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&q=80",
};

function detectBrand(name) {
  const n = name.toLowerCase();
  if (n.includes("malka")) return "malka";
  if (n.includes("vital")) return "vital";
  return "chef-flavor";
}

function cellText(cell) {
  const v = cell.value;
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  if (v.richText) return v.richText.map((r) => r.text).join("").trim();
  if (v.formula != null) return v.result != null ? String(v.result) : "";
  if (v.sharedFormula != null) return v.result != null ? String(v.result) : "";
  return String(v).trim();
}

async function run() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(resolve(__dirname, "../../attached_assets/VS_Product_List_1777735871852.xlsx"));
  const sheet = wb.getWorksheet(1);

  const products = [];
  let currentCatKey = null;
  const skuCount = {};

  for (let r = 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const s2 = cellText(row.getCell(2)).replace(/\s+/g, " ").trim();
    const s3 = cellText(row.getCell(3)).replace(/\s+/g, " ").trim();
    const s4 = cellText(row.getCell(4));
    const s6 = cellText(row.getCell(6));

    // Category header: col2 == col3 and is a known key
    const catKey = Object.keys(CATEGORY_MAP).find(
      (k) => k.trim().replace(/\s+/g, " ") === s2 && s2 === s3
    );
    if (catKey) {
      currentCatKey = catKey;
      if (!skuCount[catKey]) skuCount[catKey] = 0;
      continue;
    }

    if (!currentCatKey || !s3 || s3 === s2) continue;

    const cat = CATEGORY_MAP[currentCatKey];
    const enName = s3;
    const arName = s4 || enName;
    const packSize = s6 || "CTN";

    skuCount[currentCatKey]++;
    const catCode = cat.id.toUpperCase().replace(/-/g, "").slice(0, 4);
    const sku = `VS-${catCode}-X${String(skuCount[currentCatKey]).padStart(3, "0")}`;
    const id = `xl-${sku.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

    const isLargeBag = packSize === "BAG" && enName.includes("40Kg");
    const b2bPrice = isLargeBag ? 180 : packSize === "BAG" ? 95 : packSize === "TIN" ? 145 : 45;
    const b2cPrice = +(b2bPrice * 1.25).toFixed(2);
    const stockQty = Math.floor(20 + Math.random() * 80);

    products.push({
      id,
      sku,
      en_name: enName,
      ar_name: arName,
      category_id: cat.id,
      brand_id: detectBrand(enName),
      image: IMAGES[cat.id] || IMAGES["plain-spices"],
      b2c_price: b2cPrice,
      b2b_price: b2bPrice,
      stock_qty: stockQty,
      stock_status: stockQty < 30 ? "low-stock" : "in-stock",
      pack_size: packSize,
      audience: "both",
      packs: JSON.stringify([{ size: packSize, b2cPrice, b2bPrice, minOrderQty: 1 }]),
      min_order_qty: 1,
      rating: +(3.8 + Math.random() * 1.2).toFixed(1),
      review_count: Math.floor(5 + Math.random() * 120),
      featured: false,
    });
  }

  console.log(`Parsed ${products.length} products`);
  products.slice(0, 5).forEach((p) => console.log(`  ${p.sku} | ${p.en_name.substring(0, 50)}`));

  // Upsert new categories
  const uniqueCats = [...new Map(Object.values(CATEGORY_MAP).map((c) => [c.id, c])).values()];
  process.stdout.write("Categories: ");
  for (const c of uniqueCats) {
    const { error } = await sb.from("categories").upsert(
      { id: c.id, en_name: c.enName, ar_name: c.arName, image: IMAGES[c.id] || IMAGES["plain-spices"] },
      { onConflict: "id" }
    );
    if (error) process.stdout.write(`!${c.id} `);
    else process.stdout.write(`${c.id} `);
  }
  console.log("\nCategories done.");

  // Upsert products in batches of 20
  const BATCH = 20;
  let imported = 0;
  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH);
    const { error } = await sb.from("products").upsert(batch, { onConflict: "sku" });
    if (error) {
      console.error(`Batch ${i}: ${error.message}`);
    } else {
      imported += batch.length;
      process.stdout.write("=");
    }
  }
  console.log(`\nImported ${imported}/${products.length} products.`);
}

run().catch((e) => { console.error(e); process.exit(1); });
