import { ReactNode, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Logo } from "@/components/Logo";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { LayoutDashboard, Users, ShoppingBag, PlusCircle, TrendingUp, LogOut } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRole } from "@/contexts/RoleContext";

export function SalesLayout({ children }: { children: ReactNode }) {
  const { t, isRTL } = useLanguage();
  const { role, salesperson, logout } = useRole();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (role !== "sales") {
      setLocation("/admin/login");
    }
  }, [role, setLocation]);

  if (role !== "sales") return null;

  const salesFilter = useMemo(
    () =>
      salesperson
        ? (record: Record<string, unknown>) =>
            record.salesperson_id === salesperson.id
        : undefined,
    [salesperson]
  );

  const items = [
    { href: "/sales", icon: LayoutDashboard, label: t("sales.dashboard") },
    { href: "/sales/customers", icon: Users, label: t("sales.my_customers") },
    { href: "/sales/orders", icon: ShoppingBag, label: t("sales.my_orders") },
    { href: "/sales/create-order", icon: PlusCircle, label: t("sales.create_order") },
    { href: "/sales/performance", icon: TrendingUp, label: t("sales.performance") },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <ScrollToTop />
      <div className="flex flex-1">
        <aside className={`w-60 bg-card border-${isRTL ? "l" : "r"} flex flex-col shrink-0 hidden lg:flex`}>
          <div className="p-4 border-b">
            <Link href="/sales"><Logo size="sm" /></Link>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mt-2 font-semibold">{t("sales.title")}</p>
          </div>
          <nav className="flex-1 p-2">
            {items.map((item) => {
              const active = location === item.href || (item.href !== "/sales" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <span className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm hover-elevate cursor-pointer mb-0.5 ${active ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`} data-testid={`nav-sales-${item.href}`}>
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
              <p className="text-sm text-muted-foreground">{t("sales.welcome")},</p>
              <h2 className="font-semibold">{salesperson?.name}</h2>
              <p className="text-xs text-muted-foreground">{salesperson?.region}</p>
            </div>
            <NotificationBell variant="sales" filter={salesFilter} align="end" />
          </header>
          <main className="flex-1 p-6 overflow-x-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
