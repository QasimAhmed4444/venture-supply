import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package, Check, MapPin, CreditCard, Calendar, Download,
  RotateCw, Search, ArrowLeft, Wifi, WifiOff, Clock,
  AlertCircle, CheckCircle2, Truck, Box, ShoppingBag, Share2,
} from "lucide-react";
import { useOrder } from "@/hooks/useOrders";
import type { Order, OrderStatus } from "@/data/orders";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { PriceTag } from "@/components/PriceTag";
import { StatusBadge } from "@/components/StatusBadge";

// ─── Status normalisation (DB may use underscores) ────────────────────────────
function norm(s: string): OrderStatus {
  return s.replace(/_/g, "-") as OrderStatus;
}

// ─── Step definitions ─────────────────────────────────────────────────────────
interface Step { status: OrderStatus; en: string; ar: string; Icon: React.ElementType }

const DELIVERY_STEPS: Step[] = [
  { status: "new",               en: "Order Placed",     ar: "تم الطلب",        Icon: ShoppingBag },
  { status: "confirmed",         en: "Confirmed",        ar: "تأكيد",           Icon: CheckCircle2 },
  { status: "preparing",         en: "Preparing",        ar: "جارٍ التجهيز",    Icon: Box },
  { status: "packed",            en: "Packed",           ar: "تم التعبئة",      Icon: Package },
  { status: "out-for-delivery",  en: "Out for Delivery", ar: "في الطريق إليك",  Icon: Truck },
  { status: "delivered",         en: "Delivered",        ar: "تم التسليم",      Icon: Check },
];

const PICKUP_STEPS: Step[] = [
  { status: "new",               en: "Order Placed",   ar: "تم الطلب",       Icon: ShoppingBag },
  { status: "confirmed",         en: "Confirmed",      ar: "تأكيد",          Icon: CheckCircle2 },
  { status: "preparing",         en: "Preparing",      ar: "جارٍ التجهيز",   Icon: Box },
  { status: "packed",            en: "Packed",         ar: "تم التعبئة",     Icon: Package },
  { status: "ready-for-pickup",  en: "Ready",          ar: "جاهز للاستلام",  Icon: Check },
];

const HISTORY_LABELS: Record<string, { en: string; ar: string }> = {
  new:               { en: "Order placed",             ar: "تم تقديم الطلب" },
  confirmed:         { en: "Order confirmed",           ar: "تم تأكيد الطلب" },
  preparing:         { en: "Preparing your order",      ar: "جارٍ تجهيز طلبك" },
  packed:            { en: "Order packed",              ar: "تم تعبئة الطلب" },
  "out-for-delivery":{ en: "Out for delivery",          ar: "الطلب في الطريق" },
  "out_for_delivery":{ en: "Out for delivery",          ar: "الطلب في الطريق" },
  delivered:         { en: "Order delivered",           ar: "تم تسليم الطلب" },
  "ready-for-pickup":{ en: "Ready for pickup",          ar: "جاهز للاستلام" },
  "ready_for_pickup":{ en: "Ready for pickup",          ar: "جاهز للاستلام" },
  cancelled:         { en: "Order cancelled",           ar: "تم إلغاء الطلب" },
};

const STEP_COLORS: Record<string, string> = {
  new:               "bg-blue-500",
  confirmed:         "bg-emerald-500",
  preparing:         "bg-amber-500",
  packed:            "bg-violet-500",
  "out-for-delivery":"bg-sky-500",
  "out_for_delivery":"bg-sky-500",
  delivered:         "bg-emerald-600",
  "ready-for-pickup":"bg-teal-500",
  cancelled:         "bg-red-500",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function TrackingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-36 w-full rounded-xl" />
      <div className="grid md:grid-cols-2 gap-4">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

function SearchForm({ language }: { language: string }) {
  const [val, setVal] = useState("");
  const [, setLocation] = useLocation();
  const ar = language === "ar";

  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
        <Package className="w-8 h-8" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">{ar ? "تتبع طلبك" : "Track Your Order"}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {ar ? "أدخل رقم التتبع للاطلاع على حالة طلبك مباشرة" : "Enter your tracking ID to see live order status"}
        </p>
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (val.trim()) setLocation(`/track/${encodeURIComponent(val.trim())}`);
        }}
      >
        <Input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={ar ? "مثال: VS-O-1042" : "e.g. VS-O-1042"}
          className="flex-1 font-mono"
        />
        <Button type="submit" className="bg-primary hover:bg-primary/90">
          <Search className="w-4 h-4 me-1.5" />
          {ar ? "بحث" : "Track"}
        </Button>
      </form>
    </div>
  );
}

function NotFoundState({ tid, language }: { tid: string; language: string }) {
  const ar = language === "ar";
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
      <AlertCircle className="w-12 h-12 text-muted-foreground/40 mx-auto" />
      <h1 className="text-2xl font-bold">{ar ? "لم يُعثر على الطلب" : "Order Not Found"}</h1>
      <p className="text-muted-foreground text-sm font-mono">{tid}</p>
      <div className="flex gap-2 justify-center">
        <Link href="/track"><Button variant="outline">{ar ? "بحث آخر" : "Try another"}</Button></Link>
        <Link href="/"><Button className="bg-primary hover:bg-primary/90">{ar ? "الرئيسية" : "Home"}</Button></Link>
      </div>
    </div>
  );
}

// ─── Progress Stepper ─────────────────────────────────────────────────────────
function ProgressStepper({ order, language }: { order: Order; language: string }) {
  const ar = language === "ar";
  const currentStatus = norm(order.status);
  const isPickup = order.orderType === "pickup";
  const steps = isPickup ? PICKUP_STEPS : DELIVERY_STEPS;

  const currentIdx = steps.findIndex((s) => s.status === currentStatus);
  const reachedIdx = currentIdx === -1 ? 0 : currentIdx;

  // Build timestamp map from history
  const historyMap: Record<string, string> = {};
  (order.history ?? []).forEach((h) => {
    historyMap[norm(h.status)] = h.at;
  });

  const progressPct = steps.length > 1
    ? (reachedIdx / (steps.length - 1)) * 100
    : 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <h2 className="font-bold">{ar ? "مسار الطلب" : "Order Progress"}</h2>
          {order.estimatedAt && currentStatus !== "delivered" && currentStatus !== "cancelled" && (
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {ar ? "التسليم المتوقع:" : "Est. delivery:"}
              <span className="font-medium text-foreground">
                {new Date(order.estimatedAt).toLocaleDateString(ar ? "ar-SA" : "en-GB", { day: "numeric", month: "short" })}
              </span>
            </span>
          )}
        </div>

        <div className="relative overflow-x-auto pb-2">
          {/* Track line */}
          <div className="absolute top-5 start-6 end-6 h-0.5 bg-border" />
          <div
            className="absolute top-5 start-6 h-0.5 bg-emerald-500 transition-all duration-700"
            style={{ width: `calc(${progressPct}% - 1.5rem)` }}
          />
          <div className="relative flex justify-between min-w-[420px]">
            {steps.map((step, i) => {
              const reached = i <= reachedIdx;
              const isCurrent = i === reachedIdx;
              const ts = historyMap[step.status];
              const StepIcon = step.Icon;

              return (
                <div key={step.status} className="flex flex-col items-center gap-1.5 w-[80px]">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 z-10
                      ${reached
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                        : "bg-muted text-muted-foreground border-2 border-border"}
                      ${isCurrent && currentStatus !== "delivered" ? "ring-4 ring-emerald-200 animate-pulse" : ""}
                    `}
                  >
                    {reached ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[11px] text-center font-medium leading-tight ${reached ? "text-foreground" : "text-muted-foreground"}`}>
                    {ar ? step.ar : step.en}
                  </span>
                  {ts && (
                    <span className="text-[10px] text-muted-foreground/60 text-center leading-tight">
                      {new Date(ts).toLocaleString(ar ? "ar-SA" : "en-GB", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── History Timeline ─────────────────────────────────────────────────────────
function HistoryTimeline({ order, language, isLive }: { order: Order; language: string; isLive: boolean }) {
  const ar = language === "ar";
  const history = [...(order.history ?? [])].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );

  return (
    <Card className="h-full">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{ar ? "سجل الحالات" : "Status History"}</h3>
          <div className={`flex items-center gap-1.5 text-xs ${isLive ? "text-emerald-600" : "text-muted-foreground"}`}>
            {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isLive ? (ar ? "مباشر" : "Live") : (ar ? "غير متصل" : "Offline")}
            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
          </div>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{ar ? "لا يوجد سجل بعد" : "No history yet"}</p>
        ) : (
          <div className="relative space-y-0">
            {history.map((entry, i) => {
              const label = HISTORY_LABELS[entry.status] ?? HISTORY_LABELS[norm(entry.status)];
              const color = STEP_COLORS[entry.status] ?? STEP_COLORS[norm(entry.status)] ?? "bg-muted-foreground";
              const isFirst = i === 0;
              return (
                <div key={`${entry.status}-${entry.at}`} className="flex gap-3 relative">
                  {/* vertical connector */}
                  {i < history.length - 1 && (
                    <div className="absolute start-[7px] top-5 bottom-0 w-0.5 bg-border" />
                  )}
                  <div className={`w-3.5 h-3.5 rounded-full shrink-0 mt-1 z-10 ${color} ${isFirst ? "ring-2 ring-offset-1 ring-current" : ""}`} />
                  <div className="pb-4 flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-tight ${isFirst ? "text-foreground" : "text-muted-foreground"}`}>
                      {ar ? (label?.ar ?? entry.status) : (label?.en ?? entry.status)}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      {new Date(entry.at).toLocaleString(ar ? "ar-SA" : "en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    {isFirst && isLive && (
                      <Badge className="mt-1 text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 border-0">
                        {ar ? "آخر تحديث" : "Latest"}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function OrderTrackingPage() {
  const { tid } = useParams<{ tid?: string }>();
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const [isLive, setIsLive] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: order, isLoading } = useOrder(tid);
  const ar = language === "ar";

  // ── SSE live-tracking for this specific order ──
  useEffect(() => {
    if (!tid) return;
    let destroyed = false;

    function connect() {
      if (destroyed) return;
      const BASE = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
      const es = new EventSource(`${BASE}/api/realtime/orders`);
      esRef.current = es;

      es.addEventListener("connected", () => setIsLive(true));

      es.addEventListener("order:updated", (event: MessageEvent) => {
        try {
          const { record } = JSON.parse(event.data) as { record: Record<string, unknown> };
          const rTid = String(record.tracking_id ?? "");
          if (rTid === tid || rTid === order?.trackingId) {
            qc.invalidateQueries({ queryKey: ["order", tid] });
            qc.invalidateQueries({ queryKey: ["orders"] });
            toast({
              title: ar ? "تم تحديث حالة طلبك" : "Order status updated",
              description: `${rTid} → ${String(record.status ?? "")}`,
            });
          }
        } catch { /* ignore */ }
      });

      es.addEventListener("order:new", (event: MessageEvent) => {
        try {
          const record = JSON.parse(event.data) as Record<string, unknown>;
          if (String(record.tracking_id ?? "") === tid) {
            qc.invalidateQueries({ queryKey: ["order", tid] });
          }
        } catch { /* ignore */ }
      });

      es.onerror = () => {
        setIsLive(false);
        es.close();
        if (!destroyed) {
          reconnectRef.current = setTimeout(connect, 5_000);
        }
      };
    }

    connect();
    return () => {
      destroyed = true;
      setIsLive(false);
      esRef.current?.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [tid]);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `Order ${tid}`, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        toast({ title: ar ? "تم نسخ الرابط" : "Link copied!", description: url });
      });
    }
  }, [tid, ar, toast]);

  // ── Render states ──
  if (!tid) return <SearchForm language={language} />;
  if (isLoading && !order) return <TrackingSkeleton />;
  if (!order) return <NotFoundState tid={tid} language={language} />;

  const currentStatus = norm(order.status);
  const isCancelled = currentStatus === "cancelled";
  const isPickup = order.orderType === "pickup";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4" dir={isRTL ? "rtl" : "ltr"}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="-ms-1 mt-0.5">
              <ArrowLeft className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{ar ? "تتبع الطلب" : "Order Tracking"}</h1>
            <p className="text-muted-foreground mt-0.5 font-mono text-sm">{order.trackingId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${isLive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-border text-muted-foreground"}`}>
            {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isLive
              ? <><span>{ar ? "تتبع مباشر" : "Live tracking"}</span><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /></>
              : <span>{ar ? "جارٍ الاتصال…" : "Connecting…"}</span>
            }
          </div>
          <StatusBadge status={order.status} className="text-sm py-1 px-2.5" />
        </div>
      </div>

      {/* ── Cancelled banner ── */}
      {isCancelled && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700">{ar ? "تم إلغاء هذا الطلب" : "This order has been cancelled"}</p>
              {order.cancellationReason && (
                <p className="text-sm text-red-600/80 mt-0.5">{order.cancellationReason}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Progress stepper ── */}
      {!isCancelled && <ProgressStepper order={order} language={language} />}

      {/* ── Address + History grid ── */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-secondary" />
                {isPickup ? (ar ? "موقع الاستلام" : "Pickup Location") : (ar ? "عنوان التوصيل" : "Delivery Address")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{order.deliveryAddress}</p>
              <p className="text-sm font-medium">{order.city}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <CreditCard className="w-4 h-4 text-secondary" />
                {ar ? "تفاصيل الدفع" : "Payment Details"}
              </h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{ar ? "طريقة الدفع" : "Method"}</span>
                  <span className="font-medium capitalize">{order.paymentMethod?.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> {ar ? "تاريخ الطلب" : "Placed"}</span>
                  <span>{new Date(order.placedAt).toLocaleDateString(ar ? "ar-SA" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                {order.customerName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{ar ? "اسم العميل" : "Customer"}</span>
                    <span className="truncate max-w-[150px]">{order.customerName}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <HistoryTimeline order={order} language={language} isLive={isLive} />
      </div>

      {/* ── Order Items ── */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Package className="w-4 h-4" />
            {ar ? "محتوى الطلب" : "Order Items"}
            <Badge variant="outline" className="ms-auto text-xs">{order.items.length} {ar ? "منتج" : "items"}</Badge>
          </h3>
          <div className="space-y-3">
            {order.items.map((it) => {
              const name = ar ? it.arName : it.enName;
              return (
                <div key={`${it.productId}-${it.packSize}`} className="flex gap-3 items-center">
                  <img
                    src={it.image}
                    alt={name}
                    className="w-14 h-14 rounded-lg object-cover shrink-0 border"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight truncate">{name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{it.packSize} × {it.qty}</p>
                  </div>
                  <PriceTag amount={it.unitPrice * it.qty} size="sm" />
                </div>
              );
            })}
          </div>
          <Separator />
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>{ar ? "المجموع الفرعي" : "Subtotal"}</span>
              <PriceTag amount={order.subtotal} size="sm" />
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{ar ? "ضريبة القيمة المضافة (15%)" : "VAT (15%)"}</span>
              <PriceTag amount={order.vat} size="sm" />
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{ar ? "رسوم التوصيل" : "Delivery"}</span>
              {order.deliveryCharge === 0
                ? <span className="text-emerald-600 font-semibold">{ar ? "مجاني" : "Free"}</span>
                : <PriceTag amount={order.deliveryCharge} size="sm" />
              }
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between items-baseline">
              <span className="font-bold text-base">{ar ? "الإجمالي" : "Total"}</span>
              <PriceTag amount={order.total} size="lg" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Actions ── */}
      <div className="flex flex-wrap gap-2 pb-4">
        <Button variant="outline" onClick={() => toast({ title: ar ? "فاتورة" : "Invoice", description: ar ? "قريباً" : "Coming soon" })}>
          <Download className="w-4 h-4 me-2" />
          {ar ? "تنزيل الفاتورة" : "Download Invoice"}
        </Button>
        <Button variant="outline" onClick={() => toast({ title: ar ? "إعادة طلب" : "Reorder", description: ar ? "قريباً" : "Coming soon" })}>
          <RotateCw className="w-4 h-4 me-2" />
          {ar ? "إعادة الطلب" : "Reorder"}
        </Button>
        <Button variant="outline" onClick={handleShare}>
          <Share2 className="w-4 h-4 me-2" />
          {ar ? "مشاركة التتبع" : "Share Tracking"}
        </Button>
      </div>
    </div>
  );
}
