import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ShoppingCart } from "lucide-react";
import { PriceTag } from "./PriceTag";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRole } from "@/contexts/RoleContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/data/products";

const stockColors = {
  "in-stock": "text-emerald-700 dark:text-emerald-400",
  "low-stock": "text-amber-700 dark:text-amber-400",
  "out-of-stock": "text-rose-700 dark:text-rose-400",
};

export function ProductCard({ product }: { product: Product }) {
  const { t, language } = useLanguage();
  const { role } = useRole();
  const { addItem } = useCart();
  const { toast } = useToast();
  const isB2B = role === "b2b";
  const showB2BPrice = isB2B && product.b2bPrice > 0;
  const name = language === "ar" ? product.arName : product.enName;
  const displayPrice = showB2BPrice ? product.b2bPrice : product.b2cPrice;
  const defaultPack = product.packs.find((p) => (showB2BPrice ? p.b2bPrice : p.b2cPrice)) ?? product.packs[0];
  const defaultPrice = showB2BPrice ? defaultPack?.b2bPrice ?? product.b2bPrice : defaultPack?.b2cPrice ?? product.b2cPrice;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stockStatus === "out-of-stock") return;
    addItem({
      productId: product.id,
      enName: product.enName,
      arName: product.arName,
      packSize: defaultPack?.size ?? "1kg",
      unitPrice: defaultPrice ?? displayPrice,
      qty: isB2B ? product.minOrderQty : 1,
      image: product.image,
    });
    toast({ title: t("product.added"), description: name });
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="group cursor-pointer overflow-hidden border-border/60 hover:border-secondary/60 hover-elevate active-elevate-2 transition-all duration-300 h-full" data-testid={`card-product-${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img src={product.image} alt={name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          {product.featured && (
            <div className="absolute top-2 start-2 bg-secondary text-secondary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm">
              {t("listing.sort.rating").split(" ")[0] === "Highest" ? "Featured" : "مميز"}
            </div>
          )}
          {isB2B && product.b2cPrice > 0 && product.b2bPrice < product.b2cPrice && (
            <div className="absolute top-2 end-2 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm">
              {t("product.you_save")} {Math.round(((product.b2cPrice - product.b2bPrice) / product.b2cPrice) * 100)}%
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1 text-xs">
              <Star className="w-3 h-3 fill-secondary text-secondary" />
              <span className="font-medium">{product.rating}</span>
              <span className="text-muted-foreground">({product.reviewCount})</span>
            </div>
            <span className={`text-[11px] font-medium ${stockColors[product.stockStatus]}`}>
              {t(`product.${product.stockStatus.replace("-", "_")}`)}
            </span>
          </div>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 min-h-[2.5rem]" data-testid={`text-product-name-${product.id}`}>
            {name}
          </h3>
          <div className="flex items-end justify-between pt-1">
            <div className="flex flex-col">
              <PriceTag amount={defaultPrice ?? displayPrice} size="lg" />
              {isB2B && product.b2cPrice > 0 && (
                <span className="text-[11px] text-muted-foreground line-through">
                  {product.b2cPrice.toFixed(2)} {language === "ar" ? "ر.س" : "SAR"}
                </span>
              )}
              {isB2B && (
                <span className="text-[11px] text-muted-foreground">
                  {t("product.min_order")}: {product.minOrderQty}
                </span>
              )}
            </div>
            <Button
              size="icon"
              variant="default"
              className="bg-primary hover:bg-primary/90 h-9 w-9"
              disabled={product.stockStatus === "out-of-stock"}
              onClick={handleAdd}
              data-testid={`button-add-cart-${product.id}`}
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
