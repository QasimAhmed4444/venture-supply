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

export const seedCategories = [
  { id: "rice",            slug: "rice",            image: RICE,   product_count: 12 },
  { id: "plain-spices",    slug: "plain-spices",    image: SPICE,  product_count: 15 },
  { id: "recipe-mix",      slug: "recipe-mix",      image: SPICE_2,product_count: 13 },
  { id: "pulses-lentils",  slug: "pulses-lentils",  image: PULSES, product_count: 9  },
  { id: "oils",            slug: "oils",            image: OIL,    product_count: 1  },
  { id: "pink-salt",       slug: "pink-salt",       image: SALT,   product_count: 1  },
  { id: "beverages",       slug: "beverages",       image: TEA,    product_count: 5  },
  { id: "sauces",          slug: "sauces",          image: SAUCE,  product_count: 4  },
  { id: "specialty-items", slug: "specialty-items", image: SPEC,   product_count: 3  },
];

export const seedBrands = [
  { id: "chef-flavor", name: "Chef Flavor", en_tagline: "Premium rice, oils & spices",        ar_tagline: "أرز، زيوت وبهارات فاخرة",       accent: "#C73838", logo_url: null,  is_photo: false },
  { id: "malka",       name: "Malka",       en_tagline: "Authentic spices & Himalayan salt",   ar_tagline: "بهارات أصيلة وملح هيمالايا",     accent: "#7A2A1A", logo_url: null,  is_photo: false },
  { id: "vital",       name: "Vital",       en_tagline: "Premium tea, every cup",              ar_tagline: "شاي فاخر في كل كوب",            accent: "#0E5C2F", logo_url: null,  is_photo: false },
  { id: "almari",      name: "Al Mari",     en_tagline: "Trusted everyday essentials",         ar_tagline: "أساسيات يومية موثوقة",           accent: "#085890", logo_url: null,  is_photo: false },
  { id: "almarai",     name: "Almarai",     en_tagline: "Fresh dairy, juices & long-life milk",ar_tagline: "ألبان وعصائر طازجة",             accent: "#004B87", logo_url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80", is_photo: true },
  { id: "nadec",       name: "Nadec",       en_tagline: "Agriculture & dairy, nationwide",     ar_tagline: "زراعة وألبان على مستوى المملكة", accent: "#00A651", logo_url: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&q=80", is_photo: true },
  { id: "nada",        name: "Nada Dairy",  en_tagline: "Fresh yogurt, cheese & juices",       ar_tagline: "زبادي وجبن وعصائر طازجة",        accent: "#E31837", logo_url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&q=80", is_photo: true },
  { id: "alyoum",      name: "Alyoum",      en_tagline: "Premium fresh & frozen poultry",      ar_tagline: "دواجن طازجة ومجمدة فاخرة",       accent: "#FF6B35", logo_url: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&q=80", is_photo: true },
  { id: "sunbulah",    name: "Sunbulah",    en_tagline: "Flour, pastry & baking products",     ar_tagline: "طحين ومعجنات ومنتجات المخبوزات", accent: "#8B6914", logo_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80", is_photo: true },
];

export const seedProducts = [
  { id:"p-chef-1121-sella",    sku:"VS-RIC-1001", slug:"chef-rice-1121-sella-basmati",    en_name:"Chef Rice 1121 Sella Basmati",    ar_name:"أرز شِف 1121 سيلا بسمتي",       en_description:"Long-grain 1121 Sella Basmati — golden, aromatic and non-sticky.", ar_description:"أرز سيلا بسمتي 1121 طويل الحبة، ذهبي اللون.", brand_id:"chef-flavor", category_id:"rice",           audience:"both", b2c_price:18,  b2b_price:14,   packs:[{size:"1kg",b2cPrice:18},{size:"5kg",b2cPrice:84},{size:"40kg",b2bPrice:540}], min_order_qty:5, rating:4.7, review_count:28,  stock_status:"in-stock",   stock_qty:95,  image:RICE,   featured:true  },
  { id:"p-chef-1121-creamy",   sku:"VS-RIC-1002", slug:"chef-rice-1121-creamy-basmati",   en_name:"Chef Rice 1121 Creamy Basmati",   ar_name:"أرز شِف 1121 بسمتي كريمي",      en_description:"Creamy white 1121 Basmati — ideal for biryani and pilaf.",         ar_description:"بسمتي كريمي 1121 بقوام طري، مثالي للبرياني.", brand_id:"chef-flavor", category_id:"rice",           audience:"both", b2c_price:17,  b2b_price:13.5, packs:[{size:"1kg",b2cPrice:17},{size:"5kg",b2cPrice:80},{size:"40kg",b2bPrice:520}], min_order_qty:5, rating:4.8, review_count:45,  stock_status:"in-stock",   stock_qty:80,  image:RICE_2, featured:true  },
  { id:"p-chef-1121-golden",   sku:"VS-RIC-1003", slug:"chef-rice-1121-golden-sella",     en_name:"Chef Rice 1121 Golden Sella",     ar_name:"أرز شِف 1121 سيلا ذهبي",        en_description:"Premium 1121 Golden Sella with rich golden hue.",                  ar_description:"سيلا ذهبي 1121 فاخر بلون ذهبي مميز.",         brand_id:"chef-flavor", category_id:"rice",           audience:"both", b2c_price:19,  b2b_price:15,   packs:[{size:"1kg",b2cPrice:19},{size:"5kg",b2cPrice:88},{size:"40kg",b2bPrice:580}], min_order_qty:5, rating:4.6, review_count:62,  stock_status:"in-stock",   stock_qty:60,  image:RICE,   featured:false },
  { id:"p-chef-1509-sella",    sku:"VS-RIC-1004", slug:"chef-rice-1509-sella-basmati",    en_name:"Chef Rice 1509 Sella Basmati",    ar_name:"أرز شِف 1509 سيلا بسمتي",       en_description:"1509 Sella Basmati — value-friendly long grain rice.",             ar_description:"بسمتي سيلا 1509 بقيمة ممتازة.",               brand_id:"chef-flavor", category_id:"rice",           audience:"both", b2c_price:16,  b2b_price:12.5, packs:[{size:"1kg",b2cPrice:16},{size:"5kg",b2cPrice:75}],                          min_order_qty:5, rating:4.9, review_count:79,  stock_status:"low-stock",  stock_qty:12,  image:RICE_2, featured:false },
  { id:"p-malka-cumin",        sku:"VS-SPI-1005", slug:"malka-cumin-seeds",               en_name:"Malka Cumin Seeds",               ar_name:"كمون مالكا",                     en_description:"Premium whole cumin seeds — bold aroma, clean finish.",            ar_description:"بذور كمون كاملة فاخرة بأريج قوي.",            brand_id:"malka",       category_id:"plain-spices",   audience:"both", b2c_price:8,   b2b_price:5.5,  packs:[{size:"100g",b2cPrice:8},{size:"500g",b2cPrice:35}],                         min_order_qty:10,rating:4.5, review_count:33,  stock_status:"in-stock",   stock_qty:200, image:SPICE,  featured:false },
  { id:"p-malka-turmeric",     sku:"VS-SPI-1006", slug:"malka-turmeric-powder",           en_name:"Malka Turmeric Powder",           ar_name:"كركم مالكا",                     en_description:"Bright-yellow turmeric with high curcumin content.",               ar_description:"كركم أصفر فاقع بمحتوى كوركومين عالٍ.",         brand_id:"malka",       category_id:"plain-spices",   audience:"both", b2c_price:7,   b2b_price:4.8,  packs:[{size:"100g",b2cPrice:7},{size:"500g",b2cPrice:30}],                         min_order_qty:10,rating:4.7, review_count:41,  stock_status:"in-stock",   stock_qty:180, image:SPICE_2,featured:false },
  { id:"p-malka-biryani-mix",  sku:"VS-MIX-1007", slug:"malka-biryani-masala",            en_name:"Malka Biryani Masala",            ar_name:"مسالة برياني مالكا",             en_description:"Authentic biryani spice blend for restaurant-quality results.",     ar_description:"مزيج بهارات برياني أصيل لنتائج مطعم.",         brand_id:"malka",       category_id:"recipe-mix",     audience:"both", b2c_price:12,  b2b_price:8.5,  packs:[{size:"100g",b2cPrice:12},{size:"500g",b2cPrice:55}],                        min_order_qty:10,rating:4.8, review_count:52,  stock_status:"in-stock",   stock_qty:150, image:SPICE,  featured:true  },
  { id:"p-chef-red-lentils",   sku:"VS-PUL-1008", slug:"chef-red-lentils",                en_name:"Chef Red Lentils",                ar_name:"عدس أحمر شِف",                   en_description:"Hulled red lentils — quick-cooking and protein-rich.",             ar_description:"عدس أحمر مقشور سريع الطبخ وغني بالبروتين.",    brand_id:"chef-flavor", category_id:"pulses-lentils", audience:"both", b2c_price:9,   b2b_price:6.5,  packs:[{size:"500g",b2cPrice:9},{size:"1kg",b2cPrice:16}],                          min_order_qty:10,rating:4.6, review_count:28,  stock_status:"in-stock",   stock_qty:120, image:PULSES, featured:false },
  { id:"p-chef-chickpeas",     sku:"VS-PUL-1009", slug:"chef-chickpeas",                  en_name:"Chef Chickpeas",                  ar_name:"حمص شِف",                        en_description:"Large, round kabuli chickpeas — perfect for hummus and stews.",     ar_description:"حمص كابولي كبير مستدير، مثالي للحمص والحساء.", brand_id:"chef-flavor", category_id:"pulses-lentils", audience:"both", b2c_price:11,  b2b_price:7.5,  packs:[{size:"500g",b2cPrice:11},{size:"1kg",b2cPrice:20}],                         min_order_qty:10,rating:4.5, review_count:36,  stock_status:"in-stock",   stock_qty:90,  image:PULSES, featured:false },
  { id:"p-chef-sunflower-oil", sku:"VS-OIL-1010", slug:"chef-sunflower-oil",              en_name:"Chef Sunflower Oil",              ar_name:"زيت عباد الشمس شِف",             en_description:"Refined sunflower oil — light, neutral flavour for all cooking.",   ar_description:"زيت عباد شمس مكرر بنكهة محايدة لجميع الطهي.", brand_id:"chef-flavor", category_id:"oils",           audience:"both", b2c_price:22,  b2b_price:17,   packs:[{size:"1L",b2cPrice:22},{size:"5L",b2cPrice:100}],                           min_order_qty:6, rating:4.7, review_count:44,  stock_status:"in-stock",   stock_qty:70,  image:OIL,    featured:false },
  { id:"p-malka-pink-salt",    sku:"VS-SAL-1011", slug:"malka-himalayan-pink-salt",       en_name:"Malka Himalayan Pink Salt",       ar_name:"ملح الهيمالايا الوردي مالكا",    en_description:"Pure Himalayan pink salt — mineral-rich and naturally sourced.",    ar_description:"ملح هيمالايا وردي نقي غني بالمعادن.",          brand_id:"malka",       category_id:"pink-salt",      audience:"both", b2c_price:15,  b2b_price:10,   packs:[{size:"500g",b2cPrice:15},{size:"1kg",b2cPrice:28}],                         min_order_qty:6, rating:4.9, review_count:67,  stock_status:"in-stock",   stock_qty:85,  image:SALT,   featured:false },
  { id:"p-vital-tea-green",    sku:"VS-BEV-1012", slug:"vital-green-tea",                 en_name:"Vital Green Tea",                 ar_name:"شاي أخضر فايتال",                en_description:"Premium green tea bags with a fresh, clean taste.",                ar_description:"أكياس شاي أخضر فاخرة بنكهة نظيفة ومنعشة.",    brand_id:"vital",       category_id:"beverages",      audience:"both", b2c_price:18,  b2b_price:13,   packs:[{size:"25 bags",b2cPrice:18},{size:"100 bags",b2cPrice:65}],                  min_order_qty:12,rating:4.6, review_count:53,  stock_status:"in-stock",   stock_qty:110, image:TEA,    featured:false },
  { id:"p-vital-tea-earl-grey",sku:"VS-BEV-1013", slug:"vital-earl-grey-tea",             en_name:"Vital Earl Grey Tea",             ar_name:"شاي إيرل غراي فايتال",           en_description:"Classic Earl Grey with bergamot — aromatic and refreshing.",        ar_description:"إيرل غراي كلاسيكي مع برغموت، عطر ومنعش.",      brand_id:"vital",       category_id:"beverages",      audience:"both", b2c_price:22,  b2b_price:16,   packs:[{size:"25 bags",b2cPrice:22},{size:"100 bags",b2cPrice:80}],                  min_order_qty:12,rating:4.8, review_count:38,  stock_status:"in-stock",   stock_qty:95,  image:TEA,    featured:true  },
  { id:"p-chef-tomato-sauce",  sku:"VS-SAU-1014", slug:"chef-tomato-pasta-sauce",         en_name:"Chef Tomato Pasta Sauce",         ar_name:"صلصة طماطم باستا شِف",           en_description:"Rich Italian-style tomato sauce with herbs.",                       ar_description:"صلصة طماطم إيطالية غنية بالأعشاب.",            brand_id:"chef-flavor", category_id:"sauces",         audience:"both", b2c_price:14,  b2b_price:9.5,  packs:[{size:"350g",b2cPrice:14},{size:"700g",b2cPrice:26}],                        min_order_qty:12,rating:4.5, review_count:29,  stock_status:"in-stock",   stock_qty:75,  image:SAUCE,  featured:false },
  { id:"p-malka-ghee",         sku:"VS-SPC-1015", slug:"malka-pure-ghee",                 en_name:"Malka Pure Ghee",                 ar_name:"سمن بلدي مالكا",                 en_description:"Pure clarified butter — rich aroma, perfect for Middle Eastern cooking.", ar_description:"سمن نقي بأريج غني، مثالي للطبخ الشرقي.",   brand_id:"malka",       category_id:"specialty-items",audience:"both", b2c_price:35,  b2b_price:26,   packs:[{size:"500g",b2cPrice:35},{size:"1kg",b2cPrice:65}],                         min_order_qty:6, rating:4.9, review_count:81,  stock_status:"in-stock",   stock_qty:50,  image:SPEC,   featured:true  },
];

const ago = (days: number, hours = 0) => {
  const d = new Date(2026, 3, 27);
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
};
const inDays = (days: number) => {
  const d = new Date(2026, 3, 27);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

export const seedCustomers = [
  { id: "c-001", name: "Ahmed Al-Qahtani",       email: "ahmed.qahtani@example.sa",          phone: "+966 54 123 4567", city: "Riyadh",  type: "b2c", totalOrders: 14, lifetimeValue: 1820,   assignedSalespersonId: null,    joinedDate: "2025-08-12", business: null, addresses: [{ id:"a-1", label:"Home",  fullAddress:"King Fahd Rd, Al Olaya District, Building 24, Apt 4",city:"Riyadh",  isDefault:true  }] },
  { id: "c-002", name: "Fatima Al-Saud",         email: "fatima.saud@example.sa",            phone: "+966 56 234 5678", city: "Jeddah",  type: "b2c", totalOrders: 22, lifetimeValue: 3140,   assignedSalespersonId: null,    joinedDate: "2025-05-03", business: null, addresses: [{ id:"a-3", label:"Home",  fullAddress:"Al Tahlia St, Al Andalus District",                 city:"Jeddah",  isDefault:true  }] },
  { id: "c-003", name: "Mohammad Al-Ghamdi",     email: "m.ghamdi@example.sa",               phone: "+966 55 345 6789", city: "Madinah", type: "b2c", totalOrders: 7,  lifetimeValue: 940,    assignedSalespersonId: null,    joinedDate: "2026-01-18", business: null, addresses: [{ id:"a-4", label:"Home",  fullAddress:"Quba Rd, Al Aziziyah",                              city:"Madinah", isDefault:true  }] },
  { id: "c-004", name: "Noura Al-Rashid",        email: "noura.rashid@example.sa",           phone: "+966 50 456 7890", city: "Dammam",  type: "b2c", totalOrders: 11, lifetimeValue: 1560,   assignedSalespersonId: null,    joinedDate: "2025-09-22", business: null, addresses: [{ id:"a-5", label:"Home",  fullAddress:"King Saud Rd, Al Faisaliyah",                       city:"Dammam",  isDefault:true  }] },
  { id: "c-005", name: "Khalid Al-Harbi (Al Andalus Restaurant Group)", email: "purchasing@alandalus-restaurants.sa", phone: "+966 11 567 8901", city: "Riyadh",  type: "b2b", totalOrders: 48, lifetimeValue: 184500, assignedSalespersonId: "sp-001", joinedDate: "2024-11-05", business: { name:"Al Andalus Restaurant Group",  type:"horeca",      crNumber:"1010 234 567", vatNumber:"300 123 456 7800003" }, addresses: [{ id:"a-6", label:"Main Kitchen", fullAddress:"Industrial Area Phase 3, Warehouse 24", city:"Riyadh",  isDefault:true  }] },
  { id: "c-006", name: "Sara Al-Mutairi (Hilal Mart Chain)",            email: "procurement@hilalmart.sa",          phone: "+966 12 678 9012", city: "Jeddah",  type: "b2b", totalOrders: 64, lifetimeValue: 246800, assignedSalespersonId: "sp-002", joinedDate: "2024-07-20", business: { name:"Hilal Mart Chain",                 type:"retailer",    crNumber:"4030 345 678", vatNumber:"300 234 567 8900003" }, addresses: [{ id:"a-8", label:"Central Warehouse", fullAddress:"Al Khumrah Industrial Zone",          city:"Jeddah",  isDefault:true  }] },
  { id: "c-007", name: "Yousef Al-Anazi (Madinah Hospitality Group)",   email: "supply@madinah-hospitality.sa",     phone: "+966 14 789 0123", city: "Madinah", type: "b2b", totalOrders: 36, lifetimeValue: 142300, assignedSalespersonId: "sp-001", joinedDate: "2024-09-18", business: { name:"Madinah Hospitality Group",         type:"horeca",      crNumber:"4030 456 789", vatNumber:"300 345 678 9000003" }, addresses: [{ id:"a-9", label:"Hotel Supplies", fullAddress:"Quba Rd, Hilton Tower",               city:"Madinah", isDefault:true  }] },
  { id: "c-008", name: "Khalid Al-Shammari (Saffron Catering)",         email: "ops@saffron-catering.sa",           phone: "+966 13 890 1234", city: "Dammam",  type: "b2b", totalOrders: 29, lifetimeValue: 98400,  assignedSalespersonId: "sp-003", joinedDate: "2025-02-10", business: { name:"Saffron Catering Co.",              type:"horeca",      crNumber:"2050 567 890", vatNumber:"300 456 789 0100003" }, addresses: [{ id:"a-10",label:"Central Kitchen",fullAddress:"Al Khobar Industrial Area",            city:"Dammam",  isDefault:true  }] },
  { id: "c-009", name: "Ali Al-Dosari (Riyadh Wholesale Foods)",        email: "buy@riyadhwholesale.sa",            phone: "+966 11 901 2345", city: "Riyadh",  type: "b2b", totalOrders: 72, lifetimeValue: 312600, assignedSalespersonId: "sp-004", joinedDate: "2024-05-08", business: { name:"Riyadh Wholesale Foods",            type:"wholesaler",  crNumber:"1010 678 901", vatNumber:"300 567 890 1200003" }, addresses: [{ id:"a-11",label:"Warehouse",      fullAddress:"Al Sulay Industrial Area",             city:"Riyadh",  isDefault:true  }] },
  { id: "c-010", name: "Layla Al-Otaibi",        email: "layla.otaibi@example.sa",           phone: "+966 55 012 3456", city: "Makkah",  type: "b2c", totalOrders: 5,  lifetimeValue: 620,    assignedSalespersonId: null,    joinedDate: "2026-02-14", business: null, addresses: [{ id:"a-12",label:"Home",  fullAddress:"Aziziyah, Building 12",                             city:"Makkah",  isDefault:true  }] },
];

export const seedSalespersons = [
  { id: "sp-001", name: "Omar Al-Shehri",    email: "omar.shehri@venturesupply.sa",    phone: "+966 50 111 2233", region: "Central / Madinah",         monthlyTarget: 80000,  monthlySales: 64200,  customersCount: 12, ordersThisMonth: 28, pendingOrders: 3, status: "active", joinedDate: "2024-09-12" },
  { id: "sp-002", name: "Hamad Al-Zahrani",  email: "hamad.zahrani@venturesupply.sa",  phone: "+966 56 222 3344", region: "Western (Jeddah, Makkah)",  monthlyTarget: 100000, monthlySales: 92800,  customersCount: 18, ordersThisMonth: 41, pendingOrders: 5, status: "active", joinedDate: "2024-06-04" },
  { id: "sp-003", name: "Bandar Al-Mansouri",email: "bandar.mansouri@venturesupply.sa",phone: "+966 55 333 4455", region: "Eastern Province",          monthlyTarget: 70000,  monthlySales: 51400,  customersCount: 9,  ordersThisMonth: 19, pendingOrders: 2, status: "active", joinedDate: "2025-01-22" },
  { id: "sp-004", name: "Mansour Al-Otaibi", email: "mansour.otaibi@venturesupply.sa", phone: "+966 54 444 5566", region: "Riyadh / Wholesale",        monthlyTarget: 120000, monthlySales: 108700, customersCount: 14, ordersThisMonth: 36, pendingOrders: 4, status: "active", joinedDate: "2024-03-15" },
];

const items1 = [
  { productId:"p-chef-1121-sella", enName:"Chef Rice 1121 Sella Basmati", arName:"أرز شِف 1121 سيلا بسمتي",  packSize:"5kg",   unitPrice:84,  qty:2, image:RICE  },
  { productId:"p-malka-pink-salt", enName:"Malka Himalayan Pink Salt",    arName:"ملح الهيمالايا الوردي مالكا",packSize:"1kg",   unitPrice:28,  qty:1, image:SALT  },
  { productId:"p-vital-tea-green", enName:"Vital Green Tea",               arName:"شاي أخضر فايتال",           packSize:"25 bags",unitPrice:32, qty:2, image:TEA   },
];
const items2 = [
  { productId:"p-malka-biryani-mix",enName:"Malka Biryani Masala",        arName:"مسالة برياني مالكا",         packSize:"500g",  unitPrice:18,  qty:3, image:SPICE },
  { productId:"p-malka-cumin",      enName:"Malka Cumin Seeds",            arName:"كمون مالكا",                 packSize:"500g",  unitPrice:18,  qty:2, image:SPICE },
];
const itemsB2B1 = [
  { productId:"p-chef-1121-sella",    enName:"Chef Rice 1121 Sella Basmati",arName:"أرز شِف 1121 سيلا بسمتي",  packSize:"40kg",  unitPrice:540, qty:20,image:RICE  },
  { productId:"p-chef-sunflower-oil", enName:"Chef Sunflower Oil",          arName:"زيت عباد الشمس شِف",        packSize:"5L",    unitPrice:72,  qty:30,image:OIL   },
  { productId:"p-malka-biryani-mix",  enName:"Malka Biryani Masala",        arName:"مسالة برياني مالكا",         packSize:"500g",  unitPrice:195, qty:5, image:SPICE },
];
const itemsB2B2 = [
  { productId:"p-vital-tea-green",  enName:"Vital Green Tea",              arName:"شاي أخضر فايتال",             packSize:"100 bags",unitPrice:240,qty:12,image:TEA   },
  { productId:"p-chef-red-lentils", enName:"Chef Red Lentils",             arName:"عدس أحمر شِف",                packSize:"1kg",    unitPrice:95, qty:10,image:PULSES},
];

function calc(items: any[], orderType: string, customerType: string) {
  const subtotal = items.reduce((s: number, i: any) => s + i.unitPrice * i.qty, 0);
  const vat = +(subtotal * 0.15).toFixed(2);
  const deliveryCharge = orderType === "pickup" ? 0 : customerType === "b2b" ? 0 : subtotal >= 200 ? 0 : 25;
  const total = +(subtotal + vat + deliveryCharge).toFixed(2);
  return { subtotal: +subtotal.toFixed(2), vat, deliveryCharge, total };
}

const orderSpecs = [
  { id:"o-1042", customerId:"c-001", customerName:"Ahmed Al-Qahtani",                  customerType:"b2c", salespersonId:null,   status:"out-for-delivery", orderType:"delivery", paymentMethod:"cod",    placedAt:ago(0,4),  estimatedAt:inDays(0), city:"Riyadh",  deliveryAddress:"King Fahd Rd, Al Olaya District, Building 24, Apt 4", items:items1  },
  { id:"o-1031", customerId:"c-001", customerName:"Ahmed Al-Qahtani",                  customerType:"b2c", salespersonId:null,   status:"delivered",        orderType:"delivery", paymentMethod:"card",   placedAt:ago(8),    estimatedAt:ago(6),    city:"Riyadh",  deliveryAddress:"King Fahd Rd, Al Olaya District, Building 24, Apt 4", items:items2  },
  { id:"o-1040", customerId:"c-002", customerName:"Fatima Al-Saud",                    customerType:"b2c", salespersonId:null,   status:"preparing",        orderType:"delivery", paymentMethod:"card",   placedAt:ago(0,7),  estimatedAt:inDays(1), city:"Jeddah",  deliveryAddress:"Al Tahlia St, Al Andalus District",                   items:items2  },
  { id:"o-1037", customerId:"c-004", customerName:"Noura Al-Rashid",                   customerType:"b2c", salespersonId:null,   status:"ready-for-pickup", orderType:"pickup",   paymentMethod:"bank",   placedAt:ago(1),    estimatedAt:inDays(0), city:"Dammam",  deliveryAddress:"Pickup — Dammam Hub",                                 items:items2  },
  { id:"o-1004", customerId:"c-010", customerName:"Layla Al-Otaibi",                   customerType:"b2c", salespersonId:null,   status:"cancelled",        orderType:"delivery", paymentMethod:"cod",    placedAt:ago(5),    estimatedAt:ago(3),    city:"Makkah",  deliveryAddress:"Aziziyah, Building 12",                               items:items1  },
  { id:"o-2018", customerId:"c-005", customerName:"Al Andalus Restaurant Group",       customerType:"b2b", salespersonId:"sp-001",status:"out-for-delivery", orderType:"delivery", paymentMethod:"credit", placedAt:ago(1,3),  estimatedAt:inDays(0), city:"Riyadh",  deliveryAddress:"Industrial Area Phase 3, Warehouse 24",               items:itemsB2B1},
  { id:"o-2019", customerId:"c-006", customerName:"Hilal Mart Chain",                  customerType:"b2b", salespersonId:"sp-002",status:"confirmed",         orderType:"delivery", paymentMethod:"credit", placedAt:ago(0,2),  estimatedAt:inDays(2), city:"Jeddah",  deliveryAddress:"Al Khumrah Industrial Zone",                          items:itemsB2B1},
  { id:"o-2017", customerId:"c-007", customerName:"Madinah Hospitality Group",         customerType:"b2b", salespersonId:"sp-001",status:"preparing",         orderType:"delivery", paymentMethod:"credit", placedAt:ago(0,9),  estimatedAt:inDays(2), city:"Madinah", deliveryAddress:"Quba Rd, Hilton Tower",                               items:itemsB2B2},
  { id:"o-2016", customerId:"c-008", customerName:"Saffron Catering Co.",              customerType:"b2b", salespersonId:"sp-003",status:"packed",            orderType:"delivery", paymentMethod:"card",   placedAt:ago(2),    estimatedAt:inDays(1), city:"Dammam",  deliveryAddress:"Al Khobar Industrial Area",                           items:itemsB2B2},
  { id:"o-2015", customerId:"c-009", customerName:"Riyadh Wholesale Foods",            customerType:"b2b", salespersonId:"sp-004",status:"new",               orderType:"delivery", paymentMethod:"credit", placedAt:ago(0,1),  estimatedAt:inDays(3), city:"Riyadh",  deliveryAddress:"Al Sulay Industrial Area",                            items:itemsB2B1},
  { id:"o-1029", customerId:"c-003", customerName:"Mohammad Al-Ghamdi",                customerType:"b2c", salespersonId:null,   status:"delivered",         orderType:"delivery", paymentMethod:"card",   placedAt:ago(12),   estimatedAt:ago(10),   city:"Madinah", deliveryAddress:"Quba Rd, Al Aziziyah",                                items:items2  },
];

export const seedOrders = orderSpecs.map((s) => {
  const totals = calc(s.items, s.orderType, s.customerType);
  return {
    ...s,
    trackingId: `VS-${s.id.toUpperCase()}`,
    history: [{ status: s.status, at: s.placedAt }],
    ...totals,
  };
});
