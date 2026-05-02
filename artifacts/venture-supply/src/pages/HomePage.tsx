import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Truck, ShieldCheck, HandCoins, Headphones, Award, MapPin, Layers, Globe2, CheckCircle, Building2, Store } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRole } from "@/contexts/RoleContext";
import { categories } from "@/data/categories";
import { brands } from "@/data/brands";
import { products } from "@/data/products";

const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=1800&q=80",
    enTitle: "Premium Wholesale\nSupplies for Your Business",
    arTitle: "مستلزمات بالجملة\nلأعمالك التجارية",
    enSubtitle: "Venture Supply offers the best quality food products at competitive wholesale prices across the Kingdom.",
    arSubtitle: "تقدم فينتشر سبلاي أفضل المنتجات الغذائية بأسعار جملة تنافسية في جميع أنحاء المملكة.",
  },
  {
    image: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1800&q=80",
    enTitle: "Authentic spices &\nrecipe blends",
    arTitle: "بهارات أصيلة\nوخلطات وصفات",
    enSubtitle: "From Malka and Chef Flavor — premium quality, consistent every time.",
    arSubtitle: "من ملكة وشِف فلايفور — جودة فاخرة وثبات في كل مرة.",
  },
  {
    image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=1800&q=80",
    enTitle: "Your trusted\nfood distribution partner",
    arTitle: "شريككم الموثوق\nفي توزيع الغذاء",
    enSubtitle: "Serving retail chains and the HORECA sector across Saudi Arabia since 2019.",
    arSubtitle: "نخدم سلاسل التجزئة وقطاع الضيافة في المملكة العربية السعودية منذ 2019.",
  },
];

export function HomePage() {
  const { t, isRTL } = useLanguage();
  const { role } = useRole();
  const popular = products.slice(0, 4);
  const [slideIdx, setSlideIdx] = useState(0);
  const [brandIdx, setBrandIdx] = useState(0);
  const brandTrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setSlideIdx((i) => (i + 1) % heroSlides.length), 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setBrandIdx((i) => (i + 1) % brands.length), 3000);
    return () => clearInterval(id);
  }, []);

  const slide = heroSlides[slideIdx];
  const Chevron = isRTL ? "←" : "→";

  return (
    <div className="pb-8">

      {/* ── HERO SLIDER ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ height: "520px" }}>
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
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(6,30,58,0.82) 50%, rgba(6,30,58,0.35) 100%)" }} />

        <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-center">
          <div className="max-w-xl space-y-5">
            <h1
              key={slideIdx}
              className="text-4xl md:text-5xl font-bold leading-tight text-white whitespace-pre-line"
              style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
            >
              {isRTL ? slide.arTitle : slide.enTitle}
            </h1>
            <p className="text-white/85 text-base md:text-lg leading-relaxed">
              {isRTL ? slide.arSubtitle : slide.enSubtitle}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/products">
                <Button size="lg" className="font-semibold gap-2 text-sm px-6 h-11" style={{ background: "#18B8E0", color: "#fff" }} data-testid="button-hero-shop">
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

      {/* ── TRUST STRIP ─────────────────────────────────────────── */}
      <section className="border-y border-border/50 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-5 grid grid-cols-2 md:grid-cols-4 divide-x divide-border/50">
          {[
            { icon: Truck, en: "Nationwide delivery", ar: "توصيل لجميع المناطق" },
            { icon: ShieldCheck, en: "Authentic brands", ar: "علامات أصلية" },
            { icon: HandCoins, en: "B2B credit terms", ar: "ائتمان لعملاء الأعمال" },
            { icon: Headphones, en: "Saudi-based support", ar: "دعم سعودي" },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-2 first:ps-0 last:pe-0">
              <b.icon className="w-5 h-5 shrink-0 text-secondary" />
              <p className="text-sm font-semibold text-primary">{isRTL ? b.ar : b.en}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATEGORIES ──────────────────────────────────────────── */}
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

        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
          {categories.map((c) => (
            <Link key={c.id} href={`/categories/${c.slug}`}>
              <div className="group flex-shrink-0 w-36 cursor-pointer rounded-lg overflow-hidden bg-card border border-border/60 hover:border-secondary/60 hover:shadow-md transition-all" data-testid={`card-category-${c.id}`}>
                <div className="h-24 overflow-hidden bg-muted">
                  <img
                    src={c.image}
                    alt={t(`category.${c.id}`)}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80"; }}
                  />
                </div>
                <div className="p-2.5 text-center">
                  <h3 className="font-semibold text-xs text-primary leading-tight">{t(`category.${c.id}`)}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{c.productCount} products</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── WHY VENTURE SUPPLY ──────────────────────────────────── */}
      <section className="bg-slate-50 border-y border-border/40 mt-14">
        <div className="max-w-7xl mx-auto px-4 py-14">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-foreground mb-3">
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

      {/* ── POPULAR PRODUCTS ────────────────────────────────────── */}
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

      {/* ── BRANDS AUTO-CAROUSEL ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 mt-14">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">{t("home.brands.title")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("home.brands.subtitle")}</p>
          </div>
        </div>
        <div className="relative overflow-hidden" ref={brandTrackRef}>
          <div className="flex gap-4" style={{ transition: "transform 0.6s ease", transform: `translateX(${isRTL ? "" : "-"}${brandIdx * 0}px)` }}>
            {[...brands, ...brands].map((b, i) => (
              <Link key={`${b.id}-${i}`} href={`/brands/${b.id}`}>
                <Card className="hover:shadow-lg active-elevate-2 cursor-pointer border-border/60 overflow-hidden group flex-shrink-0 w-60 transition-all hover:border-secondary/60">
                  <div className="h-36 flex items-center justify-center bg-white border-b border-border/50 p-5">
                    {b.logo ? (
                      <img src={b.logo} alt={b.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-extrabold shadow" style={{ background: b.accent }}>
                        {b.name[0]}
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 text-center space-y-1">
                    <h3 className="font-bold text-primary">{b.name}</h3>
                    <p className="text-xs text-muted-foreground">{isRTL ? b.arTagline : b.enTagline}</p>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary pt-1">
                      {t("common.see_more")} {Chevron}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="flex gap-3 mt-5 justify-center">
            {brands.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Brand ${i + 1}`}
                onClick={() => setBrandIdx(i)}
                className="h-1.5 rounded-full transition-all"
                style={{ width: i === brandIdx % brands.length ? 24 : 8, background: i === brandIdx % brands.length ? "#085890" : "#CBD5E1" }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── B2B CTA ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 mt-14">
        <div className="rounded-2xl overflow-hidden border-0 px-8 md:px-14 py-10 md:py-12" style={{ background: "linear-gradient(135deg, #06243f 0%, #085890 100%)" }}>
          <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 bg-yellow-400/20 border border-yellow-400/40 rounded-full px-3 py-1 text-xs font-bold text-yellow-300 uppercase tracking-wider">
                {isRTL ? "للشركات" : "For Businesses"}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug">
                {isRTL
                  ? "تعاون مع فينتشر سبلاي لاحتياجاتك التجارية"
                  : "Partner with Venture Supply for your commercial needs."}
              </h2>
              <ul className="space-y-2.5">
                {(isRTL
                  ? ["مدير حساب مخصص", "خصومات الحجم وأسعار مخصصة", "توصيل أولوية وشروط ائتمان"]
                  : ["Dedicated Account Manager", "Volume Discounts & Custom Pricing", "Priority Delivery & Credit Terms"]
                ).map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-white/90 text-sm font-medium">
                    <CheckCircle className="w-4 h-4 text-secondary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link href="/login">
                  <Button size="lg" className="font-semibold gap-2 text-sm h-11" style={{ background: "#18B8E0", color: "#fff" }} data-testid="button-b2b-corporate">
                    <Building2 className="w-4 h-4" />
                    {isRTL ? "فتح حساب مؤسسي" : "Open Corporate Account"}
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 font-semibold text-sm h-11" data-testid="button-b2b-retailer">
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
