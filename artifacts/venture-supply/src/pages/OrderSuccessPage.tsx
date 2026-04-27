import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, Truck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PriceTag } from "@/components/PriceTag";

export function OrderSuccessPage() {
  const { t, isRTL } = useLanguage();
  const [location] = useLocation();
  const queryString = location.split("?")[1] ?? "";
  const tid = new URLSearchParams(queryString).get("id") ?? "VS-O-2099";

  let summary: any = {};
  try {
    summary = JSON.parse(sessionStorage.getItem("vs.lastOrder") ?? "{}");
  } catch {}

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <Card className="text-center border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
        <CardContent className="p-10 space-y-5">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{t("order.success.title")}</h1>
            <p className="text-muted-foreground mt-2">{t("order.success.subtitle")}</p>
          </div>

          <div className="bg-card rounded-lg p-5 mx-auto max-w-sm border">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("order.tracking_id")}</p>
            <p className="text-2xl font-mono font-bold text-primary mt-1" data-testid="text-tracking-id">{tid}</p>
            {summary.total != null && (
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("common.total")}</span>
                <PriceTag amount={summary.total} size="lg" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <Package className="w-4 h-4" /><span>{t("status.preparing")}</span>
            <span className="opacity-50">{isRTL ? "→" : "→"}</span>
            <Truck className="w-4 h-4" /><span>{t("status.out-for-delivery")}</span>
          </div>

          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Link href={`/track/${tid}`}>
              <Button size="lg" className="bg-primary hover:bg-primary/90" data-testid="button-track-order">{t("order.track_order")}</Button>
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
