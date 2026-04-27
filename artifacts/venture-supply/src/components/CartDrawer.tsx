import { Link } from "wouter";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PriceTag } from "./PriceTag";
import { useState } from "react";

export function CartDrawer() {
  const { items, count, subtotal, vat, total, updateQty, removeItem } = useCart();
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="button-open-cart">
          <ShoppingCart className="w-5 h-5" />
          {count > 0 && (
            <span className="absolute -top-1 -end-1 bg-secondary text-secondary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {count}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side={language === "ar" ? "left" : "right"} className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>
            {t("cart.title")} ({count} {t("cart.item_count")})
          </SheetTitle>
        </SheetHeader>
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
            <ShoppingBag className="w-16 h-16 text-muted-foreground/40" />
            <div>
              <p className="font-semibold">{t("cart.empty")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("cart.empty.subtitle")}</p>
            </div>
            <Link href="/products">
              <Button variant="outline" onClick={() => setOpen(false)}>{t("cart.continue_shopping")}</Button>
            </Link>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {items.map((item) => {
                  const name = language === "ar" ? item.arName : item.enName;
                  return (
                    <div key={`${item.productId}-${item.packSize}`} className="flex gap-3 p-3 border rounded-md" data-testid={`cart-item-${item.productId}`}>
                      <img src={item.image} alt={name} className="w-16 h-16 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-snug line-clamp-2">{name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.packSize}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 border rounded-md">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(item.productId, item.packSize, item.qty - 1)} data-testid={`button-decrease-${item.productId}`}>
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(item.productId, item.packSize, item.qty + 1)} data-testid={`button-increase-${item.productId}`}>
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <PriceTag amount={item.unitPrice * item.qty} size="sm" />
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-600 hover:text-rose-700" onClick={() => removeItem(item.productId, item.packSize)} data-testid={`button-remove-${item.productId}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            <div className="border-t p-4 space-y-3 bg-muted/30">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{t("common.subtotal")}</span><PriceTag amount={subtotal} size="sm" /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("common.vat")}</span><PriceTag amount={vat} size="sm" /></div>
                <Separator className="my-2" />
                <div className="flex justify-between items-baseline"><span className="font-semibold">{t("common.total")}</span><PriceTag amount={total} size="lg" /></div>
              </div>
              <Link href="/checkout" className="block">
                <Button className="w-full bg-primary hover:bg-primary/90" size="lg" onClick={() => setOpen(false)} data-testid="button-checkout">
                  {t("cart.proceed_checkout")}
                </Button>
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
