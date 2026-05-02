import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// categories table: id, slug, image, product_count
// products table:   id, sku, slug, en_name, ar_name, en_description, ar_description,
//                   brand_id, category_id, audience, b2c_price, b2b_price, packs(jsonb),
//                   min_order_qty, rating, review_count, stock_status, stock_qty, image, featured

const CATEGORY_MAP = {
  "TEA":             { id: "beverages" },
  "OIL":             { id: "oils" },
  "PINK SALT":       { id: "pink-salt" },
  "FRIED ONION":     { id: "specialty" },
  "PULSES -CHEF":    { id: "pulses" },
  "VERMICELLI":      { id: "vermicelli" },
  "HERBS &  SPICES": { id: "plain-spices" },
  "RECIPE - CHEF":   { id: "recipe-mix" },
  "RECIPE - MALKA":  { id: "recipe-mix" },
  "PLAIN - MALKA":   { id: "plain-spices" },
  "DESERT - MALKA":  { id: "desserts" },
  "CURRY POWDER":    { id: "recipe-mix" },
  "RICE":            { id: "rice" },
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

// existing categories in DB (known from seed)
const EXISTING_CATS = new Set(["rice","plain-spices","recipe-mix","beverages","oils","sauces","pulses"]);
// new ones to add
const NEW_CATS = {
  "pink-salt":   { slug: "pink-salt",   image: IMAGES["pink-salt"] },
  "specialty":   { slug: "specialty",   image: IMAGES["specialty"] },
  "vermicelli":  { slug: "vermicelli",  image: IMAGES["vermicelli"] },
  "desserts":    { slug: "desserts",    image: IMAGES["desserts"] },
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
  if (v.result != null) return String(v.result);
  return String(v).trim();
}

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
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

    // Category header: col2 == col3 and matches known key
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
    const slug = toSlug(enName) + "-" + sku.toLowerCase().replace(/[^a-z0-9]/g, "-");

    const isLargeBag = packSize === "BAG" && enName.includes("40Kg");
    const b2bPrice = isLargeBag ? 180 : packSize === "BAG" ? 95 : packSize === "TIN" ? 145 : 45;
    const b2cPrice = +(b2bPrice * 1.25).toFixed(2);
    const stockQty = Math.floor(20 + Math.random() * 80);

    products.push({
      id,
      sku,
      slug,
      en_name: enName,
      ar_name: arName,
      brand_id: detectBrand(enName),
      category_id: cat.id,
      audience: "both",
      b2c_price: b2cPrice,
      b2b_price: b2bPrice,
      packs: [{ size: packSize, b2cPrice, b2bPrice, minOrderQty: 1 }],
      min_order_qty: 1,
      rating: +(3.8 + Math.random() * 1.2).toFixed(1),
      review_count: Math.floor(5 + Math.random() * 120),
      stock_qty: stockQty,
      stock_status: stockQty < 30 ? "low-stock" : "in-stock",
      image: IMAGES[cat.id] || IMAGES["plain-spices"],
      featured: false,
    });
  }

  console.log(`Parsed ${products.length} products`);
  products.slice(0, 5).forEach((p) => console.log(`  ${p.sku} | ${p.en_name.substring(0, 55)}`));

  // Upsert any missing categories
  process.stdout.write("New categories: ");
  for (const [id, cat] of Object.entries(NEW_CATS)) {
    if (!EXISTING_CATS.has(id)) {
      const { error } = await sb.from("categories").upsert({ id, ...cat }, { onConflict: "id" });
      if (error) process.stdout.write(`✗${id}(${error.message}) `);
      else process.stdout.write(`✓${id} `);
    }
  }
  console.log("\nCategories done.");

  // Update product_count for all categories after import (do this at end)
  // First upsert all products
  const BATCH = 20;
  let imported = 0;
  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH);
    const { error } = await sb.from("products").upsert(batch, { onConflict: "id" });
    if (error) {
      console.error(`\nBatch ${i} error: ${error.message}`);
    } else {
      imported += batch.length;
      process.stdout.write("=");
    }
  }
  console.log(`\nImported ${imported}/${products.length} products.`);

  // Update product counts per category
  process.stdout.write("Updating product counts: ");
  const catCounts = {};
  for (const p of products) {
    catCounts[p.category_id] = (catCounts[p.category_id] || 0) + 1;
  }
  for (const [catId, count] of Object.entries(catCounts)) {
    // get existing count first
    const { data } = await sb.from("products").select("id", { count: "exact" }).eq("category_id", catId);
    const total = data?.length ?? count;
    const { error } = await sb.from("categories").update({ product_count: total }).eq("id", catId);
    if (error) process.stdout.write(`✗${catId} `);
    else process.stdout.write(`✓${catId} `);
  }
  console.log("\nDone!");
}

run().catch((e) => { console.error(e); process.exit(1); });
