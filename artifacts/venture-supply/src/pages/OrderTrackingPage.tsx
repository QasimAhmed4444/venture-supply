import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Package, Check, MapPin, CreditCard, Calendar, Download, RotateCw } from "lucide-react";
import { getOrderByTracking, type OrderStatus } from "@/data/orders";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { PriceTag } from "@/components/PriceTag";
import { StatusBadge } from "@/components/StatusBadge";

const STEPS: OrderStatus[] = ["new", "confirmed", "preparing", "packed", "out-for-delivery", "delivered"];

export function OrderTrackingPage() {
  const { tid } = useParams();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const order = tid ? getOrderByTracking(tid) : undefined;

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">{t("common.no_results")}</h1>
        <p className="text-muted-foreground mt-2">Tracking ID: {tid}</p>
        <Link href="/"><Button className="mt-4">{t("nav.home")}</Button></Link>
      </div>
    );
  }

  const reachedIdx = STEPS.indexOf(order.status);
  const isCancelled = order.status === "cancelled";
  const isPickup = order.status === "ready-for-pickup";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t("order.tracking.title")}</h1>
          <p className="text-muted-foreground mt-1 font-mono">{order.trackingId}</p>
        </div>
        <StatusBadge status={order.status} className="text-sm py-1.5 px-3" />
      </div>

      {!isCancelled && !isPickup && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Progress</h2>
              <span className="text-sm text-muted-foreground">{t("order.estimated")}: <span className="font-medium text-foreground">{new Date(order.estimatedAt).toLocaleDateString(language === "ar" ? "ar-SA" : "en-GB")}</span></span>
            </div>
            <div className="relative">
              <div className="absolute top-4 start-4 end-4 h-0.5 bg-border" />
              <div className="absolute top-4 start-4 h-0.5 bg-emerald-500 transition-all" style={{ width: `calc(${(reachedIdx / (STEPS.length - 1)) * 100}% - 1rem)` }} />
              <div className="relative flex justify-between">
                {STEPS.map((s, i) => {
                  const reached = i <= reachedIdx;
                  return (
                    <div key={s} className="flex flex-col items-center gap-1.5 max-w-[80px]">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${reached ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground border"}`}>
                        {reached ? <Check className="w-4 h-4" /> : <span className="text-xs font-semibold">{i + 1}</span>}
                      </div>
                      <span className={`text-[11px] text-center font-medium ${reached ? "text-foreground" : "text-muted-foreground"}`}>{t(`status.${s}`)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4" /> {t("order.delivery_address")}</h3>
            <p className="text-sm text-muted-foreground">{order.deliveryAddress}</p>
            <p className="text-sm">{order.city}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><CreditCard className="w-4 h-4" /> {t("order.payment_method")}</h3>
            <p className="text-sm">{t(`checkout.payment.${order.paymentMethod}`)}</p>
            <p className="text-sm flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {t("order.placed_on")}: {new Date(order.placedAt).toLocaleString(language === "ar" ? "ar-SA" : "en-GB")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><Package className="w-4 h-4" /> {language === "ar" ? "محتوى الطلب" : "Order items"}</h3>
          <div className="space-y-3">
            {order.items.map((it) => {
              const itName = language === "ar" ? it.arName : it.enName;
              return (
                <div key={`${it.productId}-${it.packSize}`} className="flex gap-3 items-center">
                  <img src={it.image} alt={itName} className="w-14 h-14 rounded object-cover" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{itName}</p>
                    <p className="text-xs text-muted-foreground">{it.packSize} × {it.qty}</p>
                  </div>
                  <PriceTag amount={it.unitPrice * it.qty} size="sm" />
                </div>
              );
            })}
          </div>
          <Separator />
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{t("common.subtotal")}</span><PriceTag amount={order.subtotal} size="sm" /></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("common.vat")}</span><PriceTag amount={order.vat} size="sm" /></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("common.delivery_charge")}</span>{order.deliveryCharge === 0 ? <span className="text-emerald-700 font-semibold">{t("common.free")}</span> : <PriceTag amount={order.deliveryCharge} size="sm" />}</div>
            <Separator className="my-1" />
            <div className="flex justify-between items-baseline"><span className="font-bold">{t("common.total")}</span><PriceTag amount={order.total} size="lg" /></div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => toast({ title: t("order.invoice"), description: t("common.feature_coming_soon") })}><Download className="w-4 h-4 me-2" /> {t("order.invoice")}</Button>
        <Button variant="outline" onClick={() => toast({ title: t("order.reorder"), description: t("common.feature_coming_soon") })}><RotateCw className="w-4 h-4 me-2" /> {t("order.reorder")}</Button>
      </div>
    </div>
  );
}
