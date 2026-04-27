import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { DemoSwitcher } from "@/components/DemoSwitcher";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { LayoutDashboard, Package, MapPin, Bell, Settings, Building2, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRole } from "@/contexts/RoleContext";

export function AccountLayout({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const { role } = useRole();
  const [location] = useLocation();

  const items = [
    { href: "/account", icon: LayoutDashboard, label: t("account.dashboard") },
    { href: "/account/orders", icon: Package, label: t("account.orders") },
    { href: "/account/addresses", icon: MapPin, label: t("account.addresses") },
    role === "b2b"
      ? { href: "/account/business", icon: Building2, label: t("account.business_profile") }
      : { href: "/account/profile", icon: User, label: t("account.profile") },
    { href: "/account/notifications", icon: Bell, label: t("account.notifications") },
    { href: "/account/settings", icon: Settings, label: t("account.settings") },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DemoSwitcher />
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          <aside>
            <Card className="p-2 sticky top-32">
              <nav className="flex flex-col">
                {items.map((item) => {
                  const active = location === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <span className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm hover-elevate cursor-pointer ${active ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`} data-testid={`nav-account-${item.href}`}>
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </Card>
          </aside>
          <div>{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
