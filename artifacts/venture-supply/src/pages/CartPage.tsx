import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PriceTag } from "@/components/PriceTag";

export function CartPage() {
  const { items, count, subtotal, vat, total, updateQty, removeItem } = useCart();
  const { t, language, isRTL } = useLanguage();
  const [, setLocation] = useLocation();
  const deliveryCharge = subtotal >= 200 ? 0 : 25;
  const grandTotal = +(total + deliveryCharge).toFixed(2);

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-20 h-20 text-muted-foreground/30 mx-auto mb-4" />
        <h1 className="text-3xl font-bold">{t("cart.empty")}</h1>
        <p className="text-muted-foreground mt-2">{t("cart.empty.subtitle")}</p>
        <Link href="/products"><Button className="mt-6">{t("cart.continue_shopping")}</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("cart.title")} ({count} {t("cart.item_count")})</h1>
      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-3">
          {items.map((item) => {
            const name = language === "ar" ? item.arName : item.enName;
            return (
              <Card key={`${item.productId}-${item.packSize}`} data-testid={`cart-page-item-${item.productId}`}>
                <CardContent className="p-4 flex gap-4">
                  <img src={item.image} alt={name} className="w-24 h-24 object-cover rounded-md" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold leading-tight">{name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.packSize}</p>
                    <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                      <div className="flex items-center border rounded-md">
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => updateQty(item.productId, item.packSize, item.qty - 1)}>
                          <Minus className="w-3.5 h-3.5" />
                        </Button>
                        <span className="w-10 text-center font-medium">{item.qty}</span>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => updateQty(item.productId, item.packSize, item.qty + 1)}>
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <PriceTag amount={item.unitPrice * item.qty} size="lg" />
                        <Button variant="ghost" size="icon" className="text-rose-600 hover:text-rose-700" onClick={() => removeItem(item.productId, item.packSize)} data-testid={`button-remove-cart-${item.productId}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="h-fit sticky top-32">
          <CardContent className="p-5 space-y-4">
            <h2 className="font-bold text-lg">{t("checkout.summary")}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("common.subtotal")}</span><PriceTag amount={subtotal} size="sm" /></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("common.vat")}</span><PriceTag amount={vat} size="sm" /></div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("common.delivery_charge")}</span>
                {deliveryCharge === 0 ? <span className="text-emerald-700 font-semibold">{t("common.free")}</span> : <PriceTag amount={deliveryCharge} size="sm" />}
              </div>
              <Separator />
              <div className="flex justify-between items-baseline pt-1">
                <span className="font-bold">{t("common.total")}</span>
                <PriceTag amount={grandTotal} size="xl" />
              </div>
            </div>
            <Button size="lg" className="w-full bg-primary hover:bg-primary/90 gap-2" onClick={() => setLocation("/checkout")} data-testid="button-proceed-checkout">
              {t("cart.proceed_checkout")} <ArrowRight className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
            </Button>
            <Link href="/products"><Button variant="ghost" className="w-full">{t("cart.continue_shopping")}</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
