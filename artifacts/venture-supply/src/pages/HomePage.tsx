import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Truck, ShieldCheck, HandCoins, Headphones, Sparkles } from "lucide-react";
import { CategoryCard } from "@/components/CategoryCard";
import { ProductCard } from "@/components/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRole } from "@/contexts/RoleContext";
import { categories } from "@/data/categories";
import { brands } from "@/data/brands";
import { getFeaturedProducts, products } from "@/data/products";
import { promotions } from "@/data/promotions";

export function HomePage() {
  const { t, isRTL } = useLanguage();
  const { role } = useRole();
  const featured = getFeaturedProducts();
  const popular = products.slice(0, 8);
  const banners = promotions.slice(0, 3);

  const Chevron = isRTL ? "←" : "→";

  return (
    <div className="space-y-12 pb-8">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1599735734820-5f76b88a4146?w=1800&q=80')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/85 to-primary/30" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28 grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-secondary/20 border border-secondary/40 rounded-full px-3 py-1 text-xs font-semibold text-secondary uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              {t("brand.subtitle")}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight whitespace-pre-line">
              {t("hero.title")}
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/85 max-w-xl">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/products">
                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold gap-2 text-base px-7 h-12" data-testid="button-hero-shop">
                  {t("hero.cta")} <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              {role !== "b2b" && (
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 font-semibold text-base px-7 h-12" data-testid="button-hero-b2b">
                    {t("hero.cta_b2b")}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Truck, en: "Free delivery over 200", ar: "توصيل مجاني فوق 200" },
            { icon: ShieldCheck, en: "Authentic brands", ar: "علامات أصلية" },
            { icon: HandCoins, en: "B2B credit terms", ar: "ائتمان لعملاء الأعمال" },
            { icon: Headphones, en: "Saudi-based support", ar: "دعم سعودي" },
          ].map((b, i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-secondary/10 text-secondary flex items-center justify-center">
                  <b.icon className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium leading-tight">{isRTL ? b.ar : b.en}</p>
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

      {/* PROMO BANNER */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-4">
          {banners.map((p) => (
            <Link key={p.id} href="/offers">
              <div className="group relative overflow-hidden rounded-lg aspect-[16/9] hover-elevate cursor-pointer">
                <img src={p.banner} alt={isRTL ? p.arTitle : p.enTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent" />
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
              <div className="inline-flex items-center gap-2 bg-secondary/20 border border-secondary/40 rounded-full px-3 py-1 text-xs font-semibold text-secondary uppercase tracking-wider">
                B2B
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">{t("home.b2b.title")}</h2>
              <p className="text-primary-foreground/85 max-w-xl">{t("home.b2b.subtitle")}</p>
            </div>
            <div className="flex md:justify-end">
              <Link href="/login">
                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold">
                  {t("home.b2b.cta")} <ArrowRight className="w-4 h-4 ms-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* BRANDS */}
      <section className="max-w-7xl mx-auto px-4">
        <SectionHeader title={t("home.brands.title")} subtitle={t("home.brands.subtitle")} t={t} />
        <div className="grid md:grid-cols-3 gap-4">
          {brands.map((b) => (
            <Link key={b.id} href={`/products?brand=${b.id}`}>
              <Card className="hover-elevate active-elevate-2 cursor-pointer h-full border-border/60">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-md flex items-center justify-center text-primary-foreground font-bold text-3xl shadow-md" style={{ background: b.accent }}>
                    {b.name[0]}
                  </div>
                  <h3 className="font-bold text-lg">{b.name}</h3>
                  <p className="text-sm text-muted-foreground">{isRTL ? b.arTagline : b.enTagline}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title, subtitle, viewAll, t }: { title: string; subtitle?: string; viewAll?: string; t: (k: string) => string }) {
  return (
    <div className="flex items-end justify-between mb-5 gap-4">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h2>
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
