import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Package, Truck, MapPin, Calendar, ShoppingBag } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PriceTag } from "@/components/PriceTag";

export function OrderSuccessPage() {
  const { t, isRTL, language } = useLanguage();
  const ar = language === "ar";
  const tid =
    (typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("id")
      : null) ?? "VS-O-2099";

  let summary: {
    trackingId?: string;
    total?: number;
    orderType?: string;
    paymentMethod?: string;
    address?: string;
    itemCount?: number;
    estimatedAt?: string;
  } = {};
  try {
    summary = JSON.parse(sessionStorage.getItem("vs.lastOrder") ?? "{}");
  } catch {}

  const isPickup = summary.orderType === "pickup";
  const estDate = summary.estimatedAt
    ? new Date(summary.estimatedAt).toLocaleDateString(ar ? "ar-SA" : "en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <Card className="text-center border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
        <CardContent className="p-10 space-y-6">

          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{t("order.success.title")}</h1>
            <p className="text-muted-foreground mt-2">{t("order.success.subtitle")}</p>
          </div>

          {/* Tracking ID box */}
          <div className="bg-card rounded-xl p-5 mx-auto max-w-sm border shadow-sm space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("order.tracking_id")}</p>
              <p className="text-2xl font-mono font-bold text-primary mt-1" data-testid="text-tracking-id">{tid}</p>
            </div>

            {(summary.total != null || summary.itemCount != null) && (
              <div className="pt-3 border-t space-y-2">
                {summary.itemCount != null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      {ar ? "عدد المنتجات" : "Items"}
                    </span>
                    <Badge variant="secondary">{summary.itemCount} {ar ? "منتج" : "items"}</Badge>
                  </div>
                )}
                {summary.total != null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("common.total")}</span>
                    <PriceTag amount={summary.total} size="lg" />
                  </div>
                )}
                {summary.orderType && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      {isPickup ? <MapPin className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                      {ar ? "نوع الطلب" : "Order type"}
                    </span>
                    <span className="font-medium capitalize">{isPickup ? (ar ? "استلام ذاتي" : "Pickup") : (ar ? "توصيل" : "Delivery")}</span>
                  </div>
                )}
                {estDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {ar ? "الوصول المتوقع" : "Est. arrival"}
                    </span>
                    <span className="font-medium text-emerald-700">{estDate}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status mini-flow */}
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <Package className="w-4 h-4" />
            <span>{t("status.preparing")}</span>
            <span className="opacity-40">→</span>
            {isPickup
              ? <><MapPin className="w-4 h-4" /><span>{ar ? "جاهز للاستلام" : "Ready for pickup"}</span></>
              : <><Truck className="w-4 h-4" /><span>{t("status.out-for-delivery")}</span></>
            }
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Link href={`/track/${tid}`}>
              <Button size="lg" className="bg-primary hover:bg-primary/90" data-testid="button-track-order">
                {t("order.track_order")}
              </Button>
            </Link>
            <Link href="/products">
              <Button size="lg" variant="outline">{t("order.continue_shopping")}</Button>
            </Link>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
