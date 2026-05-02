import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, MapPin, ChevronDown, Menu, User, LogOut, Bell, Heart, Package, Building2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRole } from "@/contexts/RoleContext";
import { Logo } from "./Logo";
import { CartDrawer } from "./CartDrawer";
import { NotificationBell } from "./NotificationBell";
import { categories } from "@/data/categories";

export function Header() {
  const { t, language, isRTL } = useLanguage();
  const { role, isAuthenticated, customer, logout } = useRole();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const customerFilter = useMemo(
    () =>
      customer
        ? (record: Record<string, unknown>) =>
            record.customer_id === customer.id
        : undefined,
    [customer]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) setLocation(`/products?q=${encodeURIComponent(search.trim())}`);
  };

  const navItems = [
    { href: "/", label: t("nav.home") },
    { href: "/products", label: t("nav.products") },
    { href: "/offers", label: t("nav.offers") },
    { href: "/about", label: t("nav.about") },
    { href: "/contact", label: t("nav.contact") },
  ];

  return (
    <header className="bg-card border-b sticky top-0 z-40 shadow-sm" dir={isRTL ? "rtl" : "ltr"}>
      <div className="bg-primary text-primary-foreground hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>{t("nav.location")}: <span className="font-semibold">Madinah Al Munawwarah, KSA</span></span>
          </div>
          <div className="flex items-center gap-5">
            <a href="tel:+966547206862" className="hover:text-secondary transition-colors">+966 54 720 6862</a>
            <a href="mailto:info@venturesupply.sa" className="hover:text-secondary transition-colors">info@venturesupply.sa</a>
            <Link href="/request-product" className="hover:text-secondary transition-colors">{t("nav.request_product")}</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side={language === "ar" ? "right" : "left"} className="w-72">
            <nav className="flex flex-col gap-2 mt-8">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <span className="block px-3 py-2 hover-elevate rounded-md text-sm font-medium">{item.label}</span>
                </Link>
              ))}
              <div className="border-t my-2" />
              <p className="text-xs text-muted-foreground px-3 mb-1 uppercase">{t("home.categories.title")}</p>
              {categories.map((c) => (
                <Link key={c.id} href={`/categories/${c.slug}`}>
                  <span className="block px-3 py-1.5 hover-elevate rounded-md text-sm">{t(`category.${c.id}`)}</span>
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link href="/" className="shrink-0">
          <Logo size="lg" />
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-auto hidden sm:block">
          <div className="relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("nav.search_placeholder")}
              className={`bg-muted/50 border-border/60 focus-visible:bg-card ${isRTL ? "pr-10" : "pl-10"}`}
              data-testid="input-search"
            />
          </div>
        </form>

        <div className="flex items-center gap-1">
          {isAuthenticated && customer ? (
            <NotificationBell
              variant="customer"
              filter={customerFilter}
              align="end"
              className="hidden md:inline-flex text-primary"
            />
          ) : (
            <Button variant="ghost" size="icon" className="hidden md:inline-flex relative text-primary" data-testid="button-notifications">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-secondary rounded-full" />
            </Button>
          )}
          <CartDrawer />
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1.5 hidden md:inline-flex text-primary" data-testid="button-account-menu">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium max-w-[100px] truncate">{customer?.name.split(" ")[0] ?? "Account"}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-56">
                <DropdownMenuLabel>{customer?.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/account"><DropdownMenuItem><User className="w-4 h-4 me-2" />{t("account.dashboard")}</DropdownMenuItem></Link>
                <Link href="/account/orders"><DropdownMenuItem><Package className="w-4 h-4 me-2" />{t("account.orders")}</DropdownMenuItem></Link>
                {role === "b2b" && (
                  <Link href="/account/business"><DropdownMenuItem><Building2 className="w-4 h-4 me-2" />{t("account.business_profile")}</DropdownMenuItem></Link>
                )}
                <Link href="/account/notifications"><DropdownMenuItem><Bell className="w-4 h-4 me-2" />{t("account.notifications")}</DropdownMenuItem></Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logout(); setLocation("/"); }}><LogOut className="w-4 h-4 me-2" />{t("common.logout")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button variant="default" className="bg-secondary text-white hover:bg-secondary/90 hidden md:inline-flex font-semibold shadow-sm" data-testid="button-login">
                {t("common.login")}
              </Button>
            </Link>
          )}
        </div>
      </div>

      <nav className="border-t border-border/40 bg-card hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <span className="px-3 py-2.5 text-sm font-semibold text-primary hover:text-secondary transition-colors block">{item.label}</span>
            </Link>
          ))}
          <div className="w-px h-5 bg-border mx-1" />
          {categories.slice(0, 6).map((c) => (
            <Link key={c.id} href={`/categories/${c.slug}`}>
              <span className="px-3 py-2.5 text-sm text-muted-foreground hover:text-secondary transition-colors block whitespace-nowrap">{t(`category.${c.id}`)}</span>
            </Link>
          ))}
          <Link href="/products">
            <span className="px-3 py-2.5 text-sm text-muted-foreground hover:text-secondary transition-colors block">{t("common.view_all")}</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
