import { useState, useMemo, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, ChevronDown, Menu, User, LogOut, Bell, Package, Building2, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRole } from "@/contexts/RoleContext";
import { Logo } from "./Logo";
import { CartDrawer } from "./CartDrawer";
import { NotificationBell } from "./NotificationBell";
import { categories } from "@/data/categories";

export function Header() {
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { role, isAuthenticated, customer, logout } = useRole();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [langOpen, setLangOpen] = useState(false);
  const langCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openLang = () => {
    if (langCloseTimer.current) {
      clearTimeout(langCloseTimer.current);
      langCloseTimer.current = null;
    }
    setLangOpen(true);
  };
  const scheduleCloseLang = () => {
    if (langCloseTimer.current) clearTimeout(langCloseTimer.current);
    langCloseTimer.current = setTimeout(() => setLangOpen(false), 180);
  };

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
      <div className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* LEFT: hamburger + search */}
        <div className="flex items-center gap-3 min-w-0">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden shrink-0">
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

          <form onSubmit={handleSearch} className="flex-1 min-w-0 max-w-md hidden sm:block">
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
        </div>

        {/* CENTER: logo */}
        <Link href="/" className="shrink-0 justify-self-center">
          <Logo size="lg" />
        </Link>

        {/* RIGHT: actions */}
        <div className="flex items-center gap-1 justify-end">
          <DropdownMenu open={langOpen} onOpenChange={setLangOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:inline-flex text-muted-foreground hover:text-primary transition-colors"
                aria-label="Change language"
                data-testid="button-toggle-language"
                onMouseEnter={openLang}
                onMouseLeave={scheduleCloseLang}
                onClick={() => setLangOpen((v) => !v)}
              >
                <Globe className="w-[18px] h-[18px]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isRTL ? "start" : "end"}
              className="w-32"
              onMouseEnter={openLang}
              onMouseLeave={scheduleCloseLang}
            >
              <DropdownMenuItem
                onClick={() => { setLanguage("en"); setLangOpen(false); }}
                className={language === "en" ? "bg-primary/10 text-primary font-semibold" : ""}
                data-testid="lang-option-en"
              >
                English
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setLanguage("ar"); setLangOpen(false); }}
                className={language === "ar" ? "bg-primary/10 text-primary font-semibold" : ""}
                data-testid="lang-option-ar"
              >
                العربية
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isAuthenticated && customer && (
            <NotificationBell
              variant="customer"
              filter={customerFilter}
              align="end"
              className="hidden md:inline-flex text-primary"
            />
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" className="bg-secondary text-white hover:bg-secondary/90 hidden md:inline-flex font-semibold shadow-sm gap-1.5" data-testid="button-login">
                  {t("common.login")} <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-56">
                <DropdownMenuLabel>{isRTL ? "تسجيل الدخول" : "Sign in as"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/login?as=b2c">
                  <DropdownMenuItem data-testid="login-as-b2c">
                    <User className="w-4 h-4 me-2" />
                    {isRTL ? "عميل أفراد (B2C)" : "Personal Customer (B2C)"}
                  </DropdownMenuItem>
                </Link>
                <Link href="/login?as=b2b">
                  <DropdownMenuItem data-testid="login-as-b2b">
                    <Building2 className="w-4 h-4 me-2" />
                    {isRTL ? "حساب أعمال (B2B)" : "Business Account (B2B)"}
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <Link href="/register">
                  <DropdownMenuItem data-testid="link-register">
                    {isRTL ? "إنشاء حساب جديد" : "Create new account"}
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
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
