import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { DemoSwitcher } from "@/components/DemoSwitcher";
import { Logo } from "@/components/Logo";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { LayoutDashboard, FolderTree, Boxes, Package, ShoppingBag, Users, Briefcase, Tag, Sparkles, BarChart3, Settings, LogOut } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRole } from "@/contexts/RoleContext";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { t, isRTL } = useLanguage();
  const { adminName, logout } = useRole();
  const [location, setLocation] = useLocation();

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
      <ScrollToTop />
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
              <NotificationBell variant="admin" align="end" />
            </div>
          </header>
          <main className="flex-1 p-6 overflow-x-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
