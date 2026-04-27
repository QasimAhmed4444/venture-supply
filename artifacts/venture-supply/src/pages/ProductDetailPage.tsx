import { useState } from "react";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Star, ShoppingCart, Plus, Minus, Truck, ShieldCheck, Package2, ChevronRight, ChevronLeft } from "lucide-react";
import { products, getProductById } from "@/data/products";
import { categories } from "@/data/categories";
import { brands } from "@/data/brands";
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
  const product = products.find((p) => p.slug === slug);
  const isB2B = role === "b2b";

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">{t("common.no_results")}</h1>
        <Link href="/products"><Button className="mt-4">{t("listing.all_products")}</Button></Link>
      </div>
    );
  }

  const visiblePacks = product.packs.filter((p) => (isB2B ? p.b2bPrice : p.b2cPrice));
  const [selectedPackIdx, setSelectedPackIdx] = useState(0);
  const [qty, setQty] = useState(isB2B ? product.minOrderQty : 1);

  const pack = visiblePacks[selectedPackIdx] ?? product.packs[0];
  const unitPrice = (isB2B ? pack.b2bPrice : pack.b2cPrice) ?? (isB2B ? product.b2bPrice : product.b2cPrice);
  const name = language === "ar" ? product.arName : product.enName;
  const description = language === "ar" ? product.arDescription : product.enDescription;
  const brand = brands.find((b) => b.id === product.brandId);
  const category = categories.find((c) => c.id === product.categoryId);

  const related = products.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4);
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
        <Link href={`/categories/${category?.slug}`}><span className="hover:text-foreground cursor-pointer">{category && t(`category.${category.id}`)}</span></Link>
        <Chev className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium truncate">{name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <div className="aspect-square overflow-hidden rounded-lg bg-muted border">
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
              <div className="flex items-baseline gap-3">
                <PriceTag amount={unitPrice} size="xl" />
                {isB2B && product.b2cPrice > 0 && (
                  <PriceTag amount={product.b2cPrice} size="md" muted strike />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t("common.vat")} {language === "ar" ? "مشمولة" : "included"}</p>

              <div>
                <p className="text-sm font-semibold mb-2">{t("product.pack_size")}</p>
                <div className="flex flex-wrap gap-2">
                  {visiblePacks.map((p, i) => (
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
                <p className="text-xs text-muted-foreground">
                  {t("product.min_order")}: <span className="font-semibold text-foreground">{product.minOrderQty}</span>
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
                <Button size="lg" className="flex-1 bg-primary hover:bg-primary/90 gap-2" onClick={handleAdd} disabled={product.stockStatus === "out-of-stock"} data-testid="button-add-to-cart">
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
                <div><dt className="text-muted-foreground">{t("product.category")}</dt><dd className="font-medium">{category && t(`category.${category.id}`)}</dd></div>
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
    </div>
  );
}
