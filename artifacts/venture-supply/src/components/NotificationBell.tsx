import { useState, useCallback, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Bell, CheckCheck, ShoppingCart, RefreshCw, Package, Volume2, Eye } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotificationPreferences } from "@/contexts/NotificationPreferencesContext";
import { useRealtimeOrdersContext, type RealtimeNotification } from "@/contexts/RealtimeOrdersContext";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";

export type NotificationVariant = "admin" | "sales" | "customer";

interface NotificationBellProps {
  variant?: NotificationVariant;
  filter?: (record: Record<string, unknown>) => boolean;
  align?: "start" | "end" | "center";
  className?: string;
}

function timeAgo(ts: number, language: string): string {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return language === "ar" ? "الآن" : "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return language === "ar" ? `منذ ${mins} د` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return language === "ar" ? `منذ ${hrs} س` : `${hrs}h ago`;
}

function getIcon(type: RealtimeNotification["type"], variant: NotificationVariant) {
  if (type === "new_order") {
    return variant === "customer"
      ? <Package className="w-4 h-4" />
      : <ShoppingCart className="w-4 h-4" />;
  }
  return <RefreshCw className="w-4 h-4" />;
}

function getTitle(type: RealtimeNotification["type"], variant: NotificationVariant, language: string): string {
  const ar = language === "ar";
  if (type === "new_order") {
    if (variant === "customer") return ar ? "طلبك تم استلامه" : "Order Received";
    if (variant === "sales")   return ar ? "طلب معيّن لك" : "New Assigned Order";
    return ar ? "طلب جديد" : "New Order";
  }
  if (variant === "customer") return ar ? "تحديث على طلبك" : "Your Order Updated";
  return ar ? "تحديث طلب" : "Order Updated";
}

function getIconColors(type: RealtimeNotification["type"]) {
  return type === "new_order"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-blue-100 text-blue-700";
}

function getViewAllHref(variant: NotificationVariant): string {
  if (variant === "sales") return "/sales/orders";
  if (variant === "customer") return "/account/orders";
  return "/admin/orders";
}

export function NotificationBell({
  variant = "admin",
  filter,
  align = "end",
  className = "",
}: NotificationBellProps) {
  const { language, isRTL } = useLanguage();
  const {
    soundEnabled,
    visualPulseEnabled,
    setSoundEnabled,
    setVisualPulseEnabled,
    playChime,
  } = useNotificationPreferences();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Staff bells (admin/sales) read from the persistent RealtimeOrdersProvider
  // so notifications survive page navigation. Customer bell keeps its own
  // local subscription with the legacy filter so it can run on storefront
  // pages outside the staff provider.
  const usesSharedState = variant === "admin" || variant === "sales";
  const shared = useRealtimeOrdersContext();
  const [localNotifications, setLocalNotifications] = useState<RealtimeNotification[]>([]);

  const triggerPulse = useCallback(() => {
    if (!visualPulseEnabled) return;
    setPulse(true);
    if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
    pulseTimeoutRef.current = setTimeout(() => setPulse(false), 2200);
  }, [visualPulseEnabled]);

  const handleLocalNotification = useCallback(
    (n: RealtimeNotification) => {
      setLocalNotifications((prev) => [n, ...prev].slice(0, 50));
      triggerPulse();
    },
    [triggerPulse],
  );

  // Subscribe locally only when not using the shared provider — staff bells
  // get their notifications from the persistent RealtimeOrdersProvider.
  useRealtimeOrders(handleLocalNotification, filter, { enabled: !usesSharedState });

  // Pulse the staff bell when the shared notification list grows.
  const sharedCount = shared.notifications.length;
  const prevSharedCountRef = useRef(sharedCount);
  useEffect(() => {
    if (!usesSharedState) return;
    if (sharedCount > prevSharedCountRef.current) triggerPulse();
    prevSharedCountRef.current = sharedCount;
  }, [usesSharedState, sharedCount, triggerPulse]);

  useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
    };
  }, []);

  const notifications = usesSharedState ? shared.notifications : localNotifications;
  const unread = usesSharedState
    ? shared.unreadCount
    : localNotifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    if (usesSharedState) {
      shared.markAllRead();
    } else {
      setLocalNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }, [usesSharedState, shared]);

  const resolvedAlign = isRTL ? (align === "end" ? "start" : "end") : align;
  const ar = language === "ar";

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) markAllRead();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative ${className} ${pulse && visualPulseEnabled ? "animate-pulse ring-2 ring-secondary ring-offset-1 rounded-full" : ""}`}
          aria-label={ar ? "الإشعارات" : "Notifications"}
          data-testid="button-notification-bell"
        >
          <Bell className={`w-5 h-5 ${pulse && visualPulseEnabled ? "text-secondary" : ""}`} />
          {unread > 0 && (
            <Badge className="absolute -top-1 -end-1 h-5 min-w-5 px-1 flex items-center justify-center text-[10px] font-bold bg-secondary text-secondary-foreground border-0 rounded-full">
              {unread > 99 ? "99+" : unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align={resolvedAlign}
        className="w-80 p-0 shadow-xl"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">
            {ar ? "الإشعارات" : "Notifications"}
          </h3>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={markAllRead}
            >
              <CheckCheck className="w-3.5 h-3.5 me-1" />
              {ar ? "تحديد الكل مقروء" : "Mark all read"}
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="py-10 text-center">
            <Bell className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {ar ? "لا توجد إشعارات بعد" : "No notifications yet"}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {variant === "customer"
                ? (ar ? "ستظهر تحديثات طلباتك هنا" : "Your order updates will appear here")
                : (ar ? "ستظهر الطلبات الجديدة والتحديثات هنا" : "New orders & updates will appear here")}
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="divide-y">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 transition-colors ${!n.read ? "bg-secondary/5" : ""}`}
                >
                  <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getIconColors(n.type)}`}>
                    {getIcon(n.type, variant)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">
                      {getTitle(n.type, variant, language)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      <span className="font-mono">{n.trackingId}</span>
                      {n.customerName && variant !== "customer" ? ` · ${n.customerName}` : ""}
                      {n.status ? ` → ${n.status}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {timeAgo(n.at, language)}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="mt-2 w-2 h-2 rounded-full bg-secondary shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="px-4 py-3 border-t space-y-2.5 bg-muted/30">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground/80 font-semibold">
            {ar ? "التفضيلات" : "Preferences"}
          </p>
          <div className="flex items-center justify-between">
            <label htmlFor="notif-sound" className="flex items-center gap-2 text-xs cursor-pointer">
              <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
              {ar ? "تنبيه صوتي" : "Sound alert"}
            </label>
            <Switch
              id="notif-sound"
              checked={soundEnabled}
              onCheckedChange={(v) => {
                setSoundEnabled(v);
                if (v) playChime();
              }}
              data-testid="switch-notification-sound"
            />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="notif-pulse" className="flex items-center gap-2 text-xs cursor-pointer">
              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
              {ar ? "نبضة بصرية" : "Visual pulse"}
            </label>
            <Switch
              id="notif-pulse"
              checked={visualPulseEnabled}
              onCheckedChange={setVisualPulseEnabled}
              data-testid="switch-notification-pulse"
            />
          </div>
        </div>

        <div className="px-4 py-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={() => {
              setOpen(false);
              setLocation(getViewAllHref(variant));
            }}
          >
            {variant === "customer"
              ? (ar ? "عرض جميع طلباتي" : "View my orders")
              : (ar ? "عرض جميع الطلبات" : "View all orders")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
