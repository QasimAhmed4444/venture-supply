import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Truck, ShieldCheck, HandCoins, Headphones, Award, MapPin, Layers, Globe2, CheckCircle, Building2, Store } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRole } from "@/contexts/RoleContext";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useBrands } from "@/hooks/useBrands";

const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=1800&q=80",
    enTitle: "Premium Wholesale\nSupplies for Your Business",
    arTitle: "مستلزمات بالجملة\nلأعمالك التجارية",
    enSubtitle: "Venture Supply offers the best quality food products at competitive wholesale prices across the Kingdom.",
    arSubtitle: "تقدم فينتشر سبلاي أفضل المنتجات الغذائية بأسعار جملة تنافسية في جميع أنحاء المملكة.",
  },
  {
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1800&q=80",
    enTitle: "Trusted by retail chains\nand HORECA partners",
    arTitle: "موثوق من سلاسل التجزئة\nوشركاء الضيافة",
    enSubtitle: "Wholesale food distribution built for Saudi retailers, restaurants, hotels, and catering businesses.",
    arSubtitle: "توزيع غذائي بالجملة لتجار التجزئة والمطاعم والفنادق وشركات التموين السعودية.",
  },
  {
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1800&q=80",
    enTitle: "Your trusted\nfood distribution partner",
    arTitle: "شريككم الموثوق\nفي توزيع الغذاء",
    enSubtitle: "Serving retail chains and the HORECA sector across Saudi Arabia since 2019.",
    arSubtitle: "نخدم سلاسل التجزئة وقطاع الضيافة في المملكة العربية السعودية منذ 2019.",
  },
];

export function HomePage() {
  const { t, isRTL } = useLanguage();
  const { role } = useRole();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const popular = products.filter((p) => p.featured).slice(0, 4).concat(products.slice(0, 4)).slice(0, 4);
  const BRAND_PRIORITY = ["chef-flavor", "malka", "vital"];
  const sortedBrands = [...brands].sort((a, b) => {
    const ai = BRAND_PRIORITY.indexOf(a.id);
    const bi = BRAND_PRIORITY.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  const [slideIdx, setSlideIdx] = useState(0);
  const brandScrollRef = useRef<HTMLDivElement>(null);

  // Hero auto-slide only — NO auto-scroll for brands section
  useEffect(() => {
    const id = setInterval(() => setSlideIdx((i) => (i + 1) % heroSlides.length), 5000);
    return () => clearInterval(id);
  }, []);

  const slide = heroSlides[slideIdx];
  const Chevron = isRTL ? "←" : "→";

  const scrollBrands = (dir: "left" | "right") => {
    if (!brandScrollRef.current) return;
    const amount = 260;
    brandScrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="pb-8">

      {/* ── HERO SLIDER ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ height: 520 }}>
        {heroSlides.map((s, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{
              backgroundImage: `url('${s.image}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: i === slideIdx ? 1 : 0,
            }}
          />
        ))}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(6,30,58,0.85) 45%, rgba(6,30,58,0.25) 100%)" }} />

        <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-center">
          <div className="max-w-lg space-y-5">
            <h1
              key={slideIdx}
              className="text-4xl md:text-5xl font-bold leading-tight text-white whitespace-pre-line"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.3)" }}
            >
              {isRTL ? slide.arTitle : slide.enTitle}
            </h1>
            <p className="text-white/85 text-base md:text-lg leading-relaxed">
              {isRTL ? slide.arSubtitle : slide.enSubtitle}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/products">
                <Button size="lg" className="font-semibold gap-2 text-sm px-6 h-11 text-white" style={{ background: "#18B8E0" }} data-testid="button-hero-shop">
                  {t("hero.cta")} <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              {role !== "b2b" && (
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-white/50 bg-white/10 text-white hover:bg-white/20 font-semibold text-sm px-6 h-11" data-testid="button-hero-b2b">
                    {t("hero.cta_b2b")}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setSlideIdx(i)}
              className="h-1.5 rounded-full transition-all"
              style={{ width: i === slideIdx ? 28 : 10, background: i === slideIdx ? "#18B8E0" : "rgba(255,255,255,0.45)" }}
            />
          ))}
        </div>
      </section>

      {/* ── TRUST STRIP ──────────────────────────────────────────── */}
      <section className="border-b border-border/50 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-4 divide-x divide-border/40">
          {[
            { icon: Truck, en: "Nationwide delivery", ar: "توصيل لجميع المناطق" },
            { icon: ShieldCheck, en: "Authentic brands", ar: "علامات أصلية" },
            { icon: HandCoins, en: "B2B credit terms", ar: "ائتمان لعملاء الأعمال" },
            { icon: Headphones, en: "Saudi-based support", ar: "دعم سعودي" },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-2 first:ps-0 last:pe-0">
              <b.icon className="w-4 h-4 shrink-0 text-secondary" />
              <p className="text-sm font-semibold text-primary">{isRTL ? b.ar : b.en}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 mt-12">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">{t("home.categories.title")}</h2>
            <p className="text-sm font-bold text-muted-foreground mt-1">{t("home.categories.subtitle")}</p>
          </div>
          <Link href="/products">
            <Button variant="ghost" size="sm" className="gap-1 text-secondary hover:text-secondary shrink-0">
              {t("common.view_all")} <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {categories.map((c) => (
            <Link key={c.id} href={`/categories/${c.id}`}>
              <div
                className="group flex-shrink-0 cursor-pointer rounded-xl overflow-hidden bg-card border border-border/60 hover:border-secondary/60 hover:shadow-md transition-all"
                style={{ width: 170 }}
                data-testid={`card-category-${c.id}`}
              >
                <div className="relative overflow-hidden bg-muted" style={{ height: 130 }}>
                  <img
                    src={c.image}
                    alt={t(`category.${c.id}`)}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80"; }}
                  />
                  <span className="absolute bottom-2 start-2 bg-primary/85 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {t(`category.${c.id}`)}
                  </span>
                </div>
                <div className="p-3 text-center">
                  <h3 className="font-semibold text-sm text-primary leading-tight">{t(`category.${c.id}`)}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.productCount} products</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── WHY VENTURE SUPPLY ───────────────────────────────────── */}
      <section className="bg-slate-50 border-y border-border/40 mt-14">
        <div className="max-w-7xl mx-auto px-4 py-14">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              {isRTL ? "لماذا فينتشر سبلاي" : "Why Venture Supply"}
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary">
              {t("about.differentiators")}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Award, title: t("about.diff.brands.title"), text: t("about.diff.brands.text") },
              { icon: MapPin, title: t("about.diff.location.title"), text: t("about.diff.location.text") },
              { icon: Layers, title: t("about.diff.range.title"), text: t("about.diff.range.text") },
              {
                icon: Globe2,
                title: isRTL ? "تغطية وطنية" : "Nationwide reach",
                text: isRTL
                  ? "نخدم تجار التجزئة وقطاع الضيافة في جميع أنحاء المملكة العربية السعودية."
                  : "Serving retail and HORECA partners across the entire Kingdom of Saudi Arabia.",
              },
            ].map((card, i) => (
              <Card key={i} className="border-border/60 hover:shadow-md transition-all bg-white">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#085890" }}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-primary text-base">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── POPULAR PRODUCTS ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 mt-14">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">{t("home.popular.title")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("home.popular.subtitle")}</p>
          </div>
          <Link href="/products">
            <Button variant="ghost" size="sm" className="gap-1 text-secondary hover:text-secondary shrink-0">
              {t("common.view_all")} <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {popular.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* ── BRANDS CAROUSEL ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 mt-14">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">{t("home.brands.title")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("home.brands.subtitle")}</p>
          </div>
          {/* Manual scroll arrows */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollBrands(isRTL ? "right" : "left")}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors text-primary"
              aria-label="Previous brands"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scrollBrands(isRTL ? "left" : "right")}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors text-primary"
              aria-label="Next brands"
            >
              →
            </button>
          </div>
        </div>

        <div
          ref={brandScrollRef}
          className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {sortedBrands.map((b) => (
            <Link key={b.id} href={`/brands/${b.id}`}>
              <Card className="cursor-pointer border border-border/60 overflow-hidden group flex-shrink-0 snap-start hover:border-primary/50 hover:shadow-lg transition-all duration-300" style={{ width: 240 }}>
                {/* Image area */}
                <div className="relative overflow-hidden" style={{ height: 160 }}>
                  {b.isPhoto ? (
                    <>
                      <img
                        src={b.logo}
                        alt={b.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80"; }}
                      />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(6,30,58,0.75) 0%, transparent 60%)" }} />
                      <div
                        className="absolute bottom-3 start-3 w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-extrabold shadow-md"
                        style={{ background: b.accent }}
                      >
                        {b.name[0]}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white p-6 border-b border-border/40">
                      {b.logo ? (
                        <img
                          src={b.logo}
                          alt={b.name}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div
                          className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-extrabold shadow"
                          style={{ background: b.accent }}
                        >
                          {b.name[0]}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <CardContent className="p-4 space-y-1">
                  <h3 className="font-bold text-primary text-sm">{b.name}</h3>
                  <p className="text-xs text-muted-foreground leading-snug">{isRTL ? b.arTagline : b.enTagline}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary pt-1">
                    {t("common.see_more")} {Chevron}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ── B2B CTA ──────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 mt-14">
        <div
          className="rounded-2xl overflow-hidden px-8 md:px-14 py-10 md:py-12 border border-[#0a3260]/20"
          style={{ background: "linear-gradient(135deg, #06243f 0%, #0c3d6e 100%)" }}
        >
          <div className="grid md:grid-cols-[1fr_auto] gap-8 items-start">
            <div className="space-y-5 max-w-xl">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider" style={{ background: "#F59E0B22", color: "#FCD34D", border: "1px solid #F59E0B44" }}>
                {isRTL ? "للشركات" : "For Businesses"}
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug">
                {isRTL
                  ? "تعاون مع فينتشر سبلاي لاحتياجاتك التجارية."
                  : "Partner with Venture Supply for your commercial needs."}
              </h2>
              <ul className="space-y-2.5">
                {(isRTL
                  ? ["مدير حساب مخصص", "خصومات الحجم وأسعار مخصصة", "توصيل أولوية وشروط ائتمان"]
                  : ["Dedicated Account Manager", "Volume Discounts & Custom Pricing", "Priority Delivery & Credit Terms"]
                ).map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-white/90 text-sm">
                    <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "#18B8E0" }} />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link href="/login">
                  <Button size="default" className="font-semibold gap-2 text-sm h-10 text-white" style={{ background: "#18B8E0" }} data-testid="button-b2b-corporate">
                    <Building2 className="w-4 h-4" />
                    {isRTL ? "فتح حساب مؤسسي" : "Open Corporate Account"}
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="default" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/15 font-semibold text-sm h-10 gap-2" data-testid="button-b2b-retailer">
                    <Store className="w-4 h-4" />
                    {isRTL ? "تسجيل كبائع تجزئة" : "Retailer Registration"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
