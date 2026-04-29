import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Truck, ShieldCheck, HandCoins, Headphones, Sparkles, Award, MapPin, Layers, Globe2 } from "lucide-react";
import { CategoryCard } from "@/components/CategoryCard";
import { ProductCard } from "@/components/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRole } from "@/contexts/RoleContext";
import { categories } from "@/data/categories";
import { brands } from "@/data/brands";
import { getFeaturedProducts, products } from "@/data/products";
import { promotions } from "@/data/promotions";

const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=1800&q=80",
    enTitle: "Premium Saudi flavors,\ndelivered with trust",
    arTitle: "نكهات سعودية فاخرة،\nموصَّلة بثقة",
    enSubtitle: "Rice, spices, pulses, oils and beverages — sourced for retail chains and the HORECA sector across the Kingdom.",
    arSubtitle: "أرز، بهارات، بقوليات، زيوت ومشروبات — لقطاع التجزئة وقطاع الضيافة في جميع أنحاء المملكة.",
  },
  {
    image: "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=1800&q=80",
    enTitle: "Authentic spices &\nrecipe blends",
    arTitle: "بهارات أصيلة\nوخلطات وصفات",
    enSubtitle: "From Malka and Chef Flavor — premium quality, consistent every time.",
    arSubtitle: "من ملكة وشِف فلايفور — جودة فاخرة وثبات في كل مرة.",
  },
  {
    image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=1800&q=80",
    enTitle: "Vital tea,\nevery cup, every day",
    arTitle: "شاي فيتال،\nفي كل كوب وكل يوم",
    enSubtitle: "A premium tea range crafted for the Saudi household and HORECA market.",
    arSubtitle: "تشكيلة شاي فاخرة مصممة للمنزل السعودي وقطاع الضيافة.",
  },
];

export function HomePage() {
  const { t, isRTL } = useLanguage();
  const { role } = useRole();
  const featured = getFeaturedProducts();
  const popular = products.slice(0, 8);
  const banners = promotions.slice(0, 3);
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSlideIdx((i) => (i + 1) % heroSlides.length), 4500);
    return () => clearInterval(id);
  }, []);

  const Chevron = isRTL ? "←" : "→";
  const slide = heroSlides[slideIdx];

  return (
    <div className="space-y-14 pb-8">
      {/* HERO SLIDER */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground">
        {heroSlides.map((s, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{
              backgroundImage: `url('${s.image}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: i === slideIdx ? 0.25 : 0,
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/85 to-primary/30" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28 grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-secondary/20 border border-secondary/50 rounded-full px-3 py-1 text-xs font-semibold text-white uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              {t("brand.subtitle")}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight whitespace-pre-line min-h-[180px] md:min-h-[260px] transition-all duration-500" key={slideIdx}>
              {isRTL ? slide.arTitle : slide.enTitle}
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 max-w-xl">
              {isRTL ? slide.arSubtitle : slide.enSubtitle}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/products">
                <Button size="lg" className="bg-secondary text-white hover:bg-secondary/90 font-semibold gap-2 text-base px-7 h-12" data-testid="button-hero-shop">
                  {t("hero.cta")} <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              {role !== "b2b" && (
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 font-semibold text-base px-7 h-12" data-testid="button-hero-b2b">
                    {t("hero.cta_b2b")}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
        {/* Slide indicators */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setSlideIdx(i)}
              className={`h-1.5 rounded-full transition-all ${i === slideIdx ? "w-8 bg-secondary" : "w-3 bg-white/40 hover:bg-white/60"}`}
            />
          ))}
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Truck, en: "Nationwide delivery", ar: "توصيل لجميع المناطق" },
            { icon: ShieldCheck, en: "Authentic brands", ar: "علامات أصلية" },
            { icon: HandCoins, en: "B2B credit terms", ar: "ائتمان لعملاء الأعمال" },
            { icon: Headphones, en: "Saudi-based support", ar: "دعم سعودي" },
          ].map((b, i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-secondary/15 text-secondary flex items-center justify-center">
                  <b.icon className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold leading-tight text-primary">{isRTL ? b.ar : b.en}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4">
        <SectionHeader title={t("home.categories.title")} subtitle={t("home.categories.subtitle")} viewAll="/products" t={t} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {categories.slice(0, 5).map((c) => <CategoryCard key={c.id} category={c} />)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-3 md:mt-4">
          {categories.slice(5).map((c) => <CategoryCard key={c.id} category={c} />)}
        </div>
      </section>

      {/* WHY VENTURE SUPPLY */}
      <section className="bg-muted/40 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-14">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-2">
              {isRTL ? "لماذا فينتشر سبلاي" : "Why Venture Supply"}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">
              {t("about.differentiators")}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <Card key={i} className="border-border/70 hover-elevate transition-all">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                    <card.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-primary">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PROMO BANNER */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-4">
          {banners.map((p) => (
            <Link key={p.id} href="/offers">
              <div className="group relative overflow-hidden rounded-lg aspect-[16/9] hover-elevate cursor-pointer">
                <img src={p.banner} alt={isRTL ? p.arTitle : p.enTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent" />
                <div className="absolute inset-0 p-5 flex flex-col justify-end text-primary-foreground">
                  <p className="font-bold text-lg leading-tight">{isRTL ? p.arTitle : p.enTitle}</p>
                  <p className="text-sm text-primary-foreground/85 mt-1">{isRTL ? p.arDescription : p.enDescription}</p>
                  <span className="text-xs text-secondary font-semibold mt-2 inline-flex items-center gap-1">{t("common.see_more")} {Chevron}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* POPULAR */}
      <section className="max-w-7xl mx-auto px-4">
        <SectionHeader title={t("home.popular.title")} subtitle={t("home.popular.subtitle")} viewAll="/products" t={t} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {popular.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* BRANDS — real logos */}
      <section className="max-w-7xl mx-auto px-4">
        <SectionHeader title={t("home.brands.title")} subtitle={t("home.brands.subtitle")} t={t} />
        <div className="grid md:grid-cols-3 gap-4">
          {brands.map((b) => (
            <Link key={b.id} href={`/brands/${b.id}`}>
              <Card className="hover-elevate active-elevate-2 cursor-pointer h-full border-border/60 overflow-hidden group">
                <div className="h-32 flex items-center justify-center bg-white border-b border-border/60 p-4">
                  <img src={b.logo} alt={b.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
                </div>
                <CardContent className="p-5 text-center space-y-2">
                  <h3 className="font-bold text-lg text-primary">{b.name}</h3>
                  <p className="text-sm text-muted-foreground">{isRTL ? b.arTagline : b.enTagline}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary pt-1">
                    {t("common.see_more")} {Chevron}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="max-w-7xl mx-auto px-4">
        <SectionHeader title={isRTL ? "المنتجات المميزة" : "Featured products"} subtitle={isRTL ? "اختيارات فاخرة من فريقنا" : "Premium picks from our team"} viewAll="/products" t={t} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* B2B CTA */}
      <section className="max-w-7xl mx-auto px-4">
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground overflow-hidden border-0">
          <CardContent className="p-8 md:p-12 grid md:grid-cols-[2fr_1fr] gap-6 items-center">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 bg-secondary/20 border border-secondary/50 rounded-full px-3 py-1 text-xs font-semibold text-white uppercase tracking-wider">
                B2B
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">{t("home.b2b.title")}</h2>
              <p className="text-primary-foreground/90 max-w-xl">{t("home.b2b.subtitle")}</p>
            </div>
            <div className="flex md:justify-end">
              <Link href="/login">
                <Button size="lg" className="bg-secondary text-white hover:bg-secondary/90 font-semibold">
                  {t("home.b2b.cta")} <ArrowRight className="w-4 h-4 ms-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function SectionHeader({ title, subtitle, viewAll, t }: { title: string; subtitle?: string; viewAll?: string; t: (k: string) => string }) {
  return (
    <div className="flex items-end justify-between mb-5 gap-4">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {viewAll && (
        <Link href={viewAll}>
          <Button variant="ghost" size="sm" className="gap-1 text-secondary hover:text-secondary">
            {t("common.view_all")} <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      )}
    </div>
  );
}
