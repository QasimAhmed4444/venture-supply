import { ReactNode, useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { DemoSwitcher } from "@/components/DemoSwitcher";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LayoutDashboard, FolderTree, Boxes, Package, ShoppingBag, Users, Briefcase, Tag, Sparkles, BarChart3, Settings, LogOut, Bell, CheckCheck, ShoppingCart, RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRole } from "@/contexts/RoleContext";
import { useRealtimeOrders, type RealtimeNotification } from "@/hooks/useRealtimeOrders";

function timeAgo(ts: number, language: string): string {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return language === "ar" ? "الآن" : "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return language === "ar" ? `منذ ${mins} د` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return language === "ar" ? `منذ ${hrs} س` : `${hrs}h ago`;
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const { t, isRTL, language } = useLanguage();
  const { adminName, logout } = useRole();
  const [location, setLocation] = useLocation();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [open, setOpen] = useState(false);

  const handleNotification = useCallback((n: RealtimeNotification) => {
    setNotifications((prev) => [n, ...prev].slice(0, 50));
  }, []);

  useRealtimeOrders(handleNotification);

  const unread = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const items = [
    { href: "/admin", icon: LayoutDashboard, label: t("admin.dashboard") },
    { href: "/admin/categories", icon: FolderTree, label: t("admin.categories") },
    { href: "/admin/products", icon: Package, label: t("admin.products") },
    { href: "/admin/inventory", icon: Boxes, label: t("admin.inventory") },
    { href: "/admin/orders", icon: ShoppingBag, label: t("admin.orders") },
    { href: "/admin/customers", icon: Users, label: t("admin.customers") },
    { href: "/admin/salespersons", icon: Briefcase, label: t("admin.salespersons") },
    { href: "/admin/promotions", icon: Sparkles, label: t("admin.promotions") },
    { href: "/admin/brands", icon: Tag, label: t("admin.brands") },
    { href: "/admin/reports", icon: BarChart3, label: t("admin.reports") },
    { href: "/admin/settings", icon: Settings, label: t("admin.settings") },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <DemoSwitcher />
      <div className="flex flex-1">
        <aside className={`w-64 bg-card border-${isRTL ? "l" : "r"} flex flex-col shrink-0 hidden lg:flex`}>
          <div className="p-4 border-b">
            <Link href="/admin"><Logo size="sm" /></Link>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mt-2 font-semibold">{t("admin.title")}</p>
          </div>
          <nav className="flex-1 p-2 overflow-y-auto">
            {items.map((item) => {
              const active = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <span className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm hover-elevate cursor-pointer mb-0.5 ${active ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`} data-testid={`nav-admin-${item.href}`}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t">
            <Button variant="ghost" className="w-full justify-start" onClick={() => { logout(); setLocation("/"); }}>
              <LogOut className="w-4 h-4 me-2" /> {t("common.logout")}
            </Button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-card border-b py-3 px-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t("common.welcome")},</p>
              <h2 className="font-semibold">{adminName}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) markAllRead(); }}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                    <Bell className="w-5 h-5" />
                    {unread > 0 && (
                      <Badge className="absolute -top-1 -end-1 h-5 min-w-5 px-1 flex items-center justify-center text-[10px] font-bold bg-secondary text-secondary-foreground border-0 rounded-full">
                        {unread > 99 ? "99+" : unread}
                      </Badge>
                    )}
                    {unread === 0 && (
                      <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align={isRTL ? "start" : "end"}
                  className="w-80 p-0 shadow-xl"
                  sideOffset={8}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="font-semibold text-sm">
                      {language === "ar" ? "الإشعارات" : "Notifications"}
                    </h3>
                    <div className="flex items-center gap-2">
                      {notifications.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-muted-foreground hover:text-foreground"
                          onClick={markAllRead}
                        >
                          <CheckCheck className="w-3.5 h-3.5 me-1" />
                          {language === "ar" ? "تحديد الكل مقروء" : "Mark all read"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="py-10 text-center">
                      <Bell className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {language === "ar" ? "لا توجد إشعارات بعد" : "No notifications yet"}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {language === "ar"
                          ? "ستظهر الطلبات الجديدة والتحديثات هنا"
                          : "New orders & updates will appear here"}
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
                            <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.type === "new_order" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                              {n.type === "new_order"
                                ? <ShoppingCart className="w-4 h-4" />
                                : <RefreshCw className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium leading-tight">
                                {n.type === "new_order"
                                  ? (language === "ar" ? "طلب جديد" : "New Order")
                                  : (language === "ar" ? "تحديث طلب" : "Order Updated")}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                <span className="font-mono">{n.trackingId}</span>
                                {n.customerName ? ` · ${n.customerName}` : ""}
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

                  <div className="px-4 py-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground"
                      onClick={() => { setOpen(false); setLocation("/admin/orders"); }}
                    >
                      {language === "ar" ? "عرض جميع الطلبات" : "View all orders"}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-x-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
