import pg from "pg";

const { Client } = pg;

const client = new Client({
  host: `db.${new URL(process.env.SUPABASE_URL).hostname.split(".supabase.co")[0].replace("db.", "")}.supabase.co`,
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

// Derive host properly
const projectRef = new URL(process.env.SUPABASE_URL).hostname.replace(".supabase.co", "");
client.host = `db.${projectRef}.supabase.co`;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS categories (
  id            TEXT PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  image         TEXT,
  product_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS brands (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  en_tagline  TEXT,
  ar_tagline  TEXT,
  accent      TEXT,
  logo_url    TEXT,
  is_photo    BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS products (
  id             TEXT PRIMARY KEY,
  sku            TEXT,
  slug           TEXT UNIQUE NOT NULL,
  en_name        TEXT NOT NULL,
  ar_name        TEXT,
  en_description TEXT,
  ar_description TEXT,
  brand_id       TEXT REFERENCES brands(id),
  category_id    TEXT REFERENCES categories(id),
  audience       TEXT DEFAULT 'both',
  b2c_price      NUMERIC(10,2) DEFAULT 0,
  b2b_price      NUMERIC(10,2) DEFAULT 0,
  packs          JSONB DEFAULT '[]',
  min_order_qty  INTEGER DEFAULT 1,
  rating         NUMERIC(3,1) DEFAULT 4.5,
  review_count   INTEGER DEFAULT 0,
  stock_status   TEXT DEFAULT 'in-stock',
  stock_qty      INTEGER DEFAULT 100,
  image          TEXT,
  featured       BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE brands     DISABLE ROW LEVEL SECURITY;
ALTER TABLE products   DISABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON categories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON brands     TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON products   TO anon, authenticated;
`;

const RICE    = "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=900&q=80";
const RICE_2  = "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=900&q=80";
const SPICE   = "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=900&q=80";
const SPICE_2 = "https://images.unsplash.com/photo-1599735734820-5f76b88a4146?w=900&q=80";
const PULSES  = "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=900&q=80";
const OIL     = "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=900&q=80";
const SALT    = "https://images.unsplash.com/photo-1518110925495-b37653e00ee9?w=900&q=80";
const TEA     = "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=900&q=80";
const SAUCE   = "https://images.unsplash.com/photo-1589135233689-cb27b3717c1f?w=900&q=80";
const SPEC    = "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=900&q=80";

const categories = [
  { id:"rice",            slug:"rice",            image:RICE,    product_count:12 },
  { id:"plain-spices",    slug:"plain-spices",    image:SPICE,   product_count:15 },
  { id:"recipe-mix",      slug:"recipe-mix",      image:SPICE_2, product_count:13 },
  { id:"pulses-lentils",  slug:"pulses-lentils",  image:PULSES,  product_count:9  },
  { id:"oils",            slug:"oils",            image:OIL,     product_count:1  },
  { id:"pink-salt",       slug:"pink-salt",       image:SALT,    product_count:1  },
  { id:"beverages",       slug:"beverages",       image:TEA,     product_count:5  },
  { id:"sauces",          slug:"sauces",          image:SAUCE,   product_count:4  },
  { id:"specialty-items", slug:"specialty-items", image:SPEC,    product_count:3  },
];

const brands = [
  { id:"chef-flavor", name:"Chef Flavor",  en_tagline:"Premium rice, oils & spices",         ar_tagline:"أرز، زيوت وبهارات فاخرة",        accent:"#C73838", logo_url:null,  is_photo:false },
  { id:"malka",       name:"Malka",        en_tagline:"Authentic spices & Himalayan salt",    ar_tagline:"بهارات أصيلة وملح هيمالايا",     accent:"#7A2A1A", logo_url:null,  is_photo:false },
  { id:"vital",       name:"Vital",        en_tagline:"Premium tea, every cup",               ar_tagline:"شاي فاخر في كل كوب",             accent:"#0E5C2F", logo_url:null,  is_photo:false },
  { id:"almari",      name:"Al Mari",      en_tagline:"Trusted everyday essentials",          ar_tagline:"أساسيات يومية موثوقة",           accent:"#085890", logo_url:null,  is_photo:false },
  { id:"almarai",     name:"Almarai",      en_tagline:"Fresh dairy, juices & long-life milk", ar_tagline:"ألبان وعصائر طازجة",             accent:"#004B87", logo_url:"https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80", is_photo:true },
  { id:"nadec",       name:"Nadec",        en_tagline:"Agriculture & dairy, nationwide",      ar_tagline:"زراعة وألبان على مستوى المملكة", accent:"#00A651", logo_url:"https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&q=80", is_photo:true },
  { id:"nada",        name:"Nada Dairy",   en_tagline:"Fresh yogurt, cheese & juices",        ar_tagline:"زبادي وجبن وعصائر طازجة",        accent:"#E31837", logo_url:"https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&q=80", is_photo:true },
  { id:"alyoum",      name:"Alyoum",       en_tagline:"Premium fresh & frozen poultry",       ar_tagline:"دواجن طازجة ومجمدة فاخرة",       accent:"#FF6B35", logo_url:"https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&q=80", is_photo:true },
  { id:"sunbulah",    name:"Sunbulah",     en_tagline:"Flour, pastry & baking products",      ar_tagline:"طحين ومعجنات ومنتجات المخبوزات", accent:"#8B6914", logo_url:"https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80", is_photo:true },
];

const products = [
  { id:"p-chef-1121-sella",     sku:"VS-RIC-1001", slug:"chef-rice-1121-sella-basmati",    en_name:"Chef Rice 1121 Sella Basmati",    ar_name:"أرز شِف 1121 سيلا بسمتي",       en_description:"Long-grain 1121 Sella Basmati — golden, aromatic and non-sticky.", ar_description:"أرز سيلا بسمتي 1121 طويل الحبة، ذهبي اللون.", brand_id:"chef-flavor", category_id:"rice",           audience:"both", b2c_price:18,  b2b_price:14,   packs:[{size:"1kg",b2cPrice:18},{size:"5kg",b2cPrice:84},{size:"40kg",b2bPrice:540}], min_order_qty:5,  rating:4.7, review_count:28,  stock_status:"in-stock",  stock_qty:95,  image:RICE,    featured:true  },
  { id:"p-chef-1121-creamy",    sku:"VS-RIC-1002", slug:"chef-rice-1121-creamy-basmati",   en_name:"Chef Rice 1121 Creamy Basmati",   ar_name:"أرز شِف 1121 بسمتي كريمي",      en_description:"Creamy white 1121 Basmati — ideal for biryani and pilaf.",         ar_description:"بسمتي كريمي 1121 بقوام طري، مثالي للبرياني.", brand_id:"chef-flavor", category_id:"rice",           audience:"both", b2c_price:17,  b2b_price:13.5, packs:[{size:"1kg",b2cPrice:17},{size:"5kg",b2cPrice:80},{size:"40kg",b2bPrice:520}], min_order_qty:5,  rating:4.8, review_count:45,  stock_status:"in-stock",  stock_qty:80,  image:RICE_2,  featured:true  },
  { id:"p-chef-1121-golden",    sku:"VS-RIC-1003", slug:"chef-rice-1121-golden-sella",     en_name:"Chef Rice 1121 Golden Sella",     ar_name:"أرز شِف 1121 سيلا ذهبي",        en_description:"Premium 1121 Golden Sella with rich golden hue.",                  ar_description:"سيلا ذهبي 1121 فاخر بلون ذهبي مميز.",         brand_id:"chef-flavor", category_id:"rice",           audience:"both", b2c_price:19,  b2b_price:15,   packs:[{size:"1kg",b2cPrice:19},{size:"5kg",b2cPrice:88},{size:"40kg",b2bPrice:580}], min_order_qty:5,  rating:4.6, review_count:62,  stock_status:"in-stock",  stock_qty:60,  image:RICE,    featured:false },
  { id:"p-chef-1509-sella",     sku:"VS-RIC-1004", slug:"chef-rice-1509-sella-basmati",    en_name:"Chef Rice 1509 Sella Basmati",    ar_name:"أرز شِف 1509 سيلا بسمتي",       en_description:"1509 Sella Basmati — value-friendly long grain rice.",             ar_description:"بسمتي سيلا 1509 بقيمة ممتازة.",               brand_id:"chef-flavor", category_id:"rice",           audience:"both", b2c_price:16,  b2b_price:12.5, packs:[{size:"1kg",b2cPrice:16},{size:"5kg",b2cPrice:75}],                          min_order_qty:5,  rating:4.9, review_count:79,  stock_status:"low-stock", stock_qty:12,  image:RICE_2,  featured:false },
  { id:"p-malka-cumin",         sku:"VS-SPI-1005", slug:"malka-cumin-seeds",               en_name:"Malka Cumin Seeds",               ar_name:"كمون مالكا",                     en_description:"Premium whole cumin seeds — bold aroma, clean finish.",            ar_description:"بذور كمون كاملة فاخرة بأريج قوي.",            brand_id:"malka",       category_id:"plain-spices",   audience:"both", b2c_price:8,   b2b_price:5.5,  packs:[{size:"100g",b2cPrice:8},{size:"500g",b2cPrice:35}],                         min_order_qty:10, rating:4.5, review_count:33,  stock_status:"in-stock",  stock_qty:200, image:SPICE,   featured:false },
  { id:"p-malka-turmeric",      sku:"VS-SPI-1006", slug:"malka-turmeric-powder",           en_name:"Malka Turmeric Powder",           ar_name:"كركم مالكا",                     en_description:"Bright-yellow turmeric with high curcumin content.",               ar_description:"كركم أصفر فاقع بمحتوى كوركومين عالٍ.",         brand_id:"malka",       category_id:"plain-spices",   audience:"both", b2c_price:7,   b2b_price:4.8,  packs:[{size:"100g",b2cPrice:7},{size:"500g",b2cPrice:30}],                         min_order_qty:10, rating:4.7, review_count:41,  stock_status:"in-stock",  stock_qty:180, image:SPICE_2, featured:false },
  { id:"p-malka-biryani-mix",   sku:"VS-MIX-1007", slug:"malka-biryani-masala",            en_name:"Malka Biryani Masala",            ar_name:"مسالة برياني مالكا",             en_description:"Authentic biryani spice blend for restaurant-quality results.",     ar_description:"مزيج بهارات برياني أصيل لنتائج مطعم.",         brand_id:"malka",       category_id:"recipe-mix",     audience:"both", b2c_price:12,  b2b_price:8.5,  packs:[{size:"100g",b2cPrice:12},{size:"500g",b2cPrice:55}],                        min_order_qty:10, rating:4.8, review_count:52,  stock_status:"in-stock",  stock_qty:150, image:SPICE,   featured:true  },
  { id:"p-chef-red-lentils",    sku:"VS-PUL-1008", slug:"chef-red-lentils",                en_name:"Chef Red Lentils",                ar_name:"عدس أحمر شِف",                   en_description:"Hulled red lentils — quick-cooking and protein-rich.",             ar_description:"عدس أحمر مقشور سريع الطبخ وغني بالبروتين.",   brand_id:"chef-flavor", category_id:"pulses-lentils", audience:"both", b2c_price:9,   b2b_price:6.5,  packs:[{size:"500g",b2cPrice:9},{size:"1kg",b2cPrice:16}],                          min_order_qty:10, rating:4.6, review_count:28,  stock_status:"in-stock",  stock_qty:120, image:PULSES,  featured:false },
  { id:"p-chef-chickpeas",      sku:"VS-PUL-1009", slug:"chef-chickpeas",                  en_name:"Chef Chickpeas",                  ar_name:"حمص شِف",                        en_description:"Large kabuli chickpeas — perfect for hummus and stews.",            ar_description:"حمص كابولي كبير مستدير، مثالي للحمص والحساء.", brand_id:"chef-flavor", category_id:"pulses-lentils", audience:"both", b2c_price:11,  b2b_price:7.5,  packs:[{size:"500g",b2cPrice:11},{size:"1kg",b2cPrice:20}],                         min_order_qty:10, rating:4.5, review_count:36,  stock_status:"in-stock",  stock_qty:90,  image:PULSES,  featured:false },
  { id:"p-chef-sunflower-oil",  sku:"VS-OIL-1010", slug:"chef-sunflower-oil",              en_name:"Chef Sunflower Oil",              ar_name:"زيت عباد الشمس شِف",             en_description:"Refined sunflower oil — light, neutral flavour for all cooking.",   ar_description:"زيت عباد شمس مكرر بنكهة محايدة لجميع الطهي.", brand_id:"chef-flavor", category_id:"oils",           audience:"both", b2c_price:22,  b2b_price:17,   packs:[{size:"1L",b2cPrice:22},{size:"5L",b2cPrice:100}],                           min_order_qty:6,  rating:4.7, review_count:44,  stock_status:"in-stock",  stock_qty:70,  image:OIL,     featured:false },
  { id:"p-malka-pink-salt",     sku:"VS-SAL-1011", slug:"malka-himalayan-pink-salt",       en_name:"Malka Himalayan Pink Salt",       ar_name:"ملح الهيمالايا الوردي مالكا",    en_description:"Pure Himalayan pink salt — mineral-rich and naturally sourced.",    ar_description:"ملح هيمالايا وردي نقي غني بالمعادن.",          brand_id:"malka",       category_id:"pink-salt",      audience:"both", b2c_price:15,  b2b_price:10,   packs:[{size:"500g",b2cPrice:15},{size:"1kg",b2cPrice:28}],                         min_order_qty:6,  rating:4.9, review_count:67,  stock_status:"in-stock",  stock_qty:85,  image:SALT,    featured:false },
  { id:"p-vital-tea-green",     sku:"VS-BEV-1012", slug:"vital-green-tea",                 en_name:"Vital Green Tea",                 ar_name:"شاي أخضر فايتال",                en_description:"Premium green tea bags with a fresh, clean taste.",                ar_description:"أكياس شاي أخضر فاخرة بنكهة نظيفة ومنعشة.",   brand_id:"vital",       category_id:"beverages",      audience:"both", b2c_price:18,  b2b_price:13,   packs:[{size:"25 bags",b2cPrice:18},{size:"100 bags",b2cPrice:65}],                  min_order_qty:12, rating:4.6, review_count:53,  stock_status:"in-stock",  stock_qty:110, image:TEA,     featured:false },
  { id:"p-vital-tea-earl-grey", sku:"VS-BEV-1013", slug:"vital-earl-grey-tea",             en_name:"Vital Earl Grey Tea",             ar_name:"شاي إيرل غراي فايتال",           en_description:"Classic Earl Grey with bergamot — aromatic and refreshing.",        ar_description:"إيرل غراي كلاسيكي مع برغموت، عطر ومنعش.",     brand_id:"vital",       category_id:"beverages",      audience:"both", b2c_price:22,  b2b_price:16,   packs:[{size:"25 bags",b2cPrice:22},{size:"100 bags",b2cPrice:80}],                  min_order_qty:12, rating:4.8, review_count:38,  stock_status:"in-stock",  stock_qty:95,  image:TEA,     featured:true  },
  { id:"p-chef-tomato-sauce",   sku:"VS-SAU-1014", slug:"chef-tomato-pasta-sauce",         en_name:"Chef Tomato Pasta Sauce",         ar_name:"صلصة طماطم باستا شِف",           en_description:"Rich Italian-style tomato sauce with herbs.",                       ar_description:"صلصة طماطم إيطالية غنية بالأعشاب.",           brand_id:"chef-flavor", category_id:"sauces",         audience:"both", b2c_price:14,  b2b_price:9.5,  packs:[{size:"350g",b2cPrice:14},{size:"700g",b2cPrice:26}],                        min_order_qty:12, rating:4.5, review_count:29,  stock_status:"in-stock",  stock_qty:75,  image:SAUCE,   featured:false },
  { id:"p-malka-ghee",          sku:"VS-SPC-1015", slug:"malka-pure-ghee",                 en_name:"Malka Pure Ghee",                 ar_name:"سمن بلدي مالكا",                 en_description:"Pure clarified butter — rich aroma, perfect for Middle Eastern cooking.", ar_description:"سمن نقي بأريج غني، مثالي للطبخ الشرقي.", brand_id:"malka",       category_id:"specialty-items",audience:"both", b2c_price:35,  b2b_price:26,   packs:[{size:"500g",b2cPrice:35},{size:"1kg",b2cPrice:65}],                         min_order_qty:6,  rating:4.9, review_count:81,  stock_status:"in-stock",  stock_qty:50,  image:SPEC,    featured:true  },
];

async function upsertRows(tableName, rows, conflictCol = "id") {
  for (const row of rows) {
    const keys   = Object.keys(row);
    const values = Object.values(row).map(v => typeof v === "object" && v !== null ? JSON.stringify(v) : v);
    const cols   = keys.map(k => `"${k}"`).join(", ");
    const params = keys.map((_, i) => `$${i + 1}`).join(", ");
    const update = keys.filter(k => k !== conflictCol).map(k => `"${k}" = EXCLUDED."${k}"`).join(", ");
    const sql    = `INSERT INTO ${tableName} (${cols}) VALUES (${params}) ON CONFLICT ("${conflictCol}") DO UPDATE SET ${update}`;
    await client.query(sql, values);
  }
}

async function main() {
  await client.connect();
  console.log("✓ Connected to Supabase Postgres");

  await client.query(SCHEMA);
  console.log("✓ Schema created (tables ready)");

  await upsertRows("categories", categories);
  console.log(`✓ Seeded ${categories.length} categories`);

  await upsertRows("brands", brands);
  console.log(`✓ Seeded ${brands.length} brands`);

  await upsertRows("products", products);
  console.log(`✓ Seeded ${products.length} products`);

  await client.end();
  console.log("✓ Done — Supabase is live!");
}

main().catch(err => { console.error("✗ Error:", err.message); process.exit(1); });
