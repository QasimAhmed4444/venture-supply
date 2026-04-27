import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { RoleProvider, useRole } from "@/contexts/RoleContext";
import { Button } from "@/components/ui/button";

const queryClient = new QueryClient();

function DemoSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const { role, setRole } = useRole();

  return (
    <div className="bg-primary text-primary-foreground py-2 px-4 flex justify-between items-center text-sm">
      <div className="flex gap-2 items-center">
        <span className="font-semibold opacity-70 uppercase tracking-wider text-xs">Demo Mode</span>
        <select 
          className="bg-primary-foreground/10 border-none rounded px-2 py-1 text-sm outline-none"
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
        >
          <option value="guest" className="text-black">B2C Customer</option>
          <option value="b2b" className="text-black">B2B Customer</option>
          <option value="admin" className="text-black">Admin</option>
          <option value="sales" className="text-black">Salesperson</option>
        </select>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 text-primary-foreground hover:bg-primary-foreground/20 hover:text-white"
        onClick={() => setLanguage(language === "en" ? "ar" : "en")}
      >
        {language === "en" ? "العربية" : "English"}
      </Button>
    </div>
  );
}

function Home() {
  const { t } = useLanguage();
  const { role } = useRole();

  return (
    <div className="min-h-screen bg-background">
      <DemoSwitcher />
      <header className="bg-card border-b py-4 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-primary flex items-center gap-2">
            <span className="bg-secondary text-secondary-foreground p-1 rounded-md">V</span>
            Venture Supply
          </div>
          <nav className="hidden md:flex gap-6 font-medium text-muted-foreground">
            <a href="#" className="text-primary">{t("nav.home")}</a>
            <a href="#" className="hover:text-primary transition-colors">{t("nav.products")}</a>
            <a href="#" className="hover:text-primary transition-colors">{t("nav.offers")}</a>
            <a href="#" className="hover:text-primary transition-colors">{t("nav.about")}</a>
            <a href="#" className="hover:text-primary transition-colors">{t("nav.contact")}</a>
          </nav>
          <div>
            <Button>{t("role." + role)} Profile</Button>
          </div>
        </div>
      </header>
      
      <main>
        <section className="bg-primary/5 py-20 px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl font-bold text-foreground leading-tight">
              {t("hero.title")}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t("hero.subtitle")}
            </p>
            <div className="pt-4">
              <Button size="lg" className="text-lg px-8">{t("action.add_to_cart")}</Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <RoleProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </RoleProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
