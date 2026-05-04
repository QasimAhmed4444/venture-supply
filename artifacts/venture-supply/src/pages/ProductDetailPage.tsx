import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Star, ShoppingCart, Plus, Minus, Truck, ShieldCheck, Package2, ChevronRight, ChevronLeft, Clock } from "lucide-react";
import { useProduct, useProducts } from "@/hooks/useProducts";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { categories } from "@/data/categories";
import { brands } from "@/data/brands";
import type { Product } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";
import { PriceTag } from "@/components/PriceTag";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRole } from "@/contexts/RoleContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

export function ProductDetailPage() {
  const { slug } = useParams();
  const { t, isRTL, language } = useLanguage();
  const { role } = useRole();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { data: product } = useProduct(slug);
  const { data: allProducts = [] } = useProducts();
  const { ids: recentIds, track } = useRecentlyViewed();
  const isB2B = role === "b2b";

  useEffect(() => {
    if (product?.id) track(product.id);
  }, [product?.id, track]);

  const visiblePacks = product ? product.packs.filter((p) => (isB2B ? p.b2bPrice : p.b2cPrice)) : [];
  const displayPacks = visiblePacks.length > 0 ? visiblePacks : (product?.packs ?? []);
  const [selectedPackIdx, setSelectedPackIdx] = useState(0);
  const [qty, setQty] = useState(isB2B ? (product?.minOrderQty ?? 1) : 1);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">{t("common.no_results")}</h1>
        <Link href="/products"><Button className="mt-4">{t("listing.all_products")}</Button></Link>
      </div>
    );
  }

  const pack = displayPacks[selectedPackIdx] ?? product.packs[0];
  const unitPrice = (isB2B ? pack.b2bPrice : pack.b2cPrice) ?? (isB2B ? product.b2bPrice : product.b2cPrice);
  const name = language === "ar" ? product.arName : product.enName;
  const description = language === "ar" ? product.arDescription : product.enDescription;
  const brand = brands.find((b) => b.id === product.brandId);
  const category = categories.find((c) => c.id === product.categoryId);

  const related = allProducts.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4);
  const relatedIds = new Set([product.id, ...related.map((p) => p.id)]);
  const youMayAlsoLike = [
    ...allProducts.filter((p) => p.brandId === product.brandId && !relatedIds.has(p.id)),
    ...allProducts.filter((p) => p.featured && !relatedIds.has(p.id)),
  ]
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
    .slice(0, 4);
  const recentlyViewed = recentIds
    .filter((id) => id !== product.id)
    .map((id) => allProducts.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 6);
  const Chev = isRTL ? ChevronLeft : ChevronRight;

  const handleAdd = () => {
    addItem({
      productId: product.id,
      enName: product.enName,
      arName: product.arName,
      packSize: pack.size,
      unitPrice,
      qty,
      image: product.image,
    });
    toast({ title: t("product.added"), description: name });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4 flex-wrap">
        <Link href="/"><span className="hover:text-foreground cursor-pointer">{t("nav.home")}</span></Link>
        <Chev className="w-3.5 h-3.5" />
        <Link href={`/categories/${category?.slug ?? product.categoryId}`}><span className="hover:text-foreground cursor-pointer">{category ? t(`category.${category.id}`) : product.categoryId}</span></Link>
        <Chev className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium truncate">{name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted border">
            <img src={product.image} alt={name} className="w-full h-full object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[product.image, product.image, product.image, product.image].map((img, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-md border hover-elevate cursor-pointer">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {brand && <Badge variant="secondary" className="font-semibold">{brand.name}</Badge>}
              {product.featured && <Badge className="bg-secondary text-secondary-foreground">Featured</Badge>}
            </div>
            <h1 className="text-3xl font-bold">{name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={`w-4 h-4 ${i <= Math.round(product.rating) ? "fill-secondary text-secondary" : "text-muted-foreground/30"}`} />
                ))}
                <span className="text-sm font-medium ms-1">{product.rating}</span>
                <span className="text-sm text-muted-foreground">({product.reviewCount} {language === "ar" ? "تقييم" : "reviews"})</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-sm text-muted-foreground">{t("product.sku")}: <span className="font-mono">{product.sku}</span></span>
            </div>
          </div>

          <p className="text-muted-foreground leading-relaxed">{description}</p>

          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-baseline gap-3 flex-wrap">
                <PriceTag amount={unitPrice} size="xl" />
                <span className="text-xs text-muted-foreground font-medium">
                  / {language === "ar" ? "للعبوة" : "per pack"} ({pack.size})
                </span>
                {isB2B && product.b2cPrice > 0 && (
                  <PriceTag amount={product.b2cPrice} size="md" muted strike />
                )}
                {isB2B && (
                  <Badge className="bg-secondary/15 text-secondary border-0 ms-1">
                    {language === "ar" ? "طلب بالجملة" : "Bulk order"}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t("common.vat")} {language === "ar" ? "مشمولة" : "included"}</p>

              {isB2B && qty > 0 && (
                <div className="rounded-md bg-primary/5 border border-primary/20 p-3 flex items-center justify-between">
                  <div className="text-xs">
                    <p className="text-muted-foreground">
                      {language === "ar" ? "إجمالي السطر" : "Line total"}
                      <span className="text-muted-foreground/70 ms-1">({qty} × {pack.size})</span>
                    </p>
                  </div>
                  <PriceTag amount={unitPrice * qty} size="md" />
                </div>
              )}

              <div>
                <p className="text-sm font-semibold mb-2">{t("product.pack_size")}</p>
                <div className="flex flex-wrap gap-2">
                  {displayPacks.map((p, i) => (
                    <button
                      key={p.size}
                      onClick={() => setSelectedPackIdx(i)}
                      className={`px-4 py-2 rounded-md border text-sm font-medium hover-elevate active-elevate-2 ${i === selectedPackIdx ? "border-primary bg-primary/5 text-primary" : "border-border"}`}
                      data-testid={`button-pack-${p.size}`}
                    >
                      {p.size}
                    </button>
                  ))}
                </div>
              </div>

              {isB2B && (
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                  <p className="text-muted-foreground">
                    {t("product.min_order")}: <span className="font-semibold text-foreground">{product.minOrderQty}</span>
                    <span className="text-muted-foreground/70 ms-1">
                      ({language === "ar" ? "عبوات" : "packs"})
                    </span>
                  </p>
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 font-medium">
                    <ShieldCheck className="w-3 h-3" />
                    {language === "ar" ? "مؤهل لشروط الائتمان" : "Eligible for credit terms"}
                  </span>
                </div>
              )}
              {isB2B && qty < product.minOrderQty && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
                  {language === "ar"
                    ? `الحد الأدنى للطلب هو ${product.minOrderQty} عبوة`
                    : `Minimum order quantity is ${product.minOrderQty} packs`}
                </p>
              )}

              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-md">
                  <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setQty(Math.max(isB2B ? product.minOrderQty : 1, qty - 1))} data-testid="button-qty-minus">
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold">{qty}</span>
                  <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setQty(qty + 1)} data-testid="button-qty-plus">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <Button size="lg" className="flex-1 bg-primary hover:bg-primary/90 gap-2" onClick={handleAdd} disabled={product.stockStatus === "out-of-stock" || (isB2B && qty < product.minOrderQty)} data-testid="button-add-to-cart">
                  <ShoppingCart className="w-4 h-4" />
                  {t("product.add_to_cart")}
                </Button>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-secondary shrink-0" /><span>{language === "ar" ? "توصيل خلال 1-3 أيام" : "Delivery in 1-3 days"}</span></div>
                <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-secondary shrink-0" /><span>{language === "ar" ? "ضمان الجودة" : "Quality guaranteed"}</span></div>
                <div className="flex items-center gap-2"><Package2 className="w-4 h-4 text-secondary shrink-0" /><span>{language === "ar" ? "تغليف فاخر" : "Premium packaging"}</span></div>
                <div className="flex items-center gap-2"><Star className="w-4 h-4 text-secondary shrink-0" /><span>{language === "ar" ? "مفضل لدى العملاء" : "Customer favourite"}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="desc" className="mt-10">
        <TabsList>
          <TabsTrigger value="desc">{t("product.description")}</TabsTrigger>
          <TabsTrigger value="specs">{language === "ar" ? "المواصفات" : "Specifications"}</TabsTrigger>
        </TabsList>
        <TabsContent value="desc" className="prose prose-sm max-w-none mt-4">
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        </TabsContent>
        <TabsContent value="specs">
          <Card>
            <CardContent className="p-5">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-muted-foreground">{t("product.brand")}</dt><dd className="font-medium">{brand?.name}</dd></div>
                <div><dt className="text-muted-foreground">{t("product.category")}</dt><dd className="font-medium">{category ? t(`category.${category.id}`) : product.categoryId}</dd></div>
                <div><dt className="text-muted-foreground">{t("product.sku")}</dt><dd className="font-mono">{product.sku}</dd></div>
                <div><dt className="text-muted-foreground">{t("product.rating")}</dt><dd className="font-medium">{product.rating} / 5</dd></div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4">{t("product.related")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {youMayAlsoLike.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4">
            {language === "ar" ? "قد يعجبك أيضاً" : "You may also like"}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {youMayAlsoLike.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {recentlyViewed.length > 0 && (
        <RecentlyViewedSection items={recentlyViewed} language={language} isRTL={isRTL} />
      )}
    </div>
  );
}

function RecentlyViewedSection({
  items,
  language,
  isRTL,
}: {
  items: Product[];
  language: string;
  isRTL: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -260 : 260, behavior: "smooth" });
  };
  return (
    <section className="mt-14">
      <div className="flex items-end justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-secondary" />
          <h2 className="text-2xl font-bold">
            {language === "ar" ? "شاهدت مؤخراً" : "Recently Viewed"}
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scroll(isRTL ? "right" : "left")}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors text-primary"
            aria-label="Previous"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scroll(isRTL ? "left" : "right")}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors text-primary"
            aria-label="Next"
          >
            →
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((p) => (
          <div key={p.id} className="flex-shrink-0 snap-start" style={{ width: 230 }}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
