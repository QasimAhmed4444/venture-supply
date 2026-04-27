import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRole, type UserRole } from "@/contexts/RoleContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Languages, ShieldCheck } from "lucide-react";

export function DemoSwitcher() {
  const { language, setLanguage, t, isRTL } = useLanguage();
  const { role, setRole } = useRole();
  const [, setLocation] = useLocation();

  const handleRoleChange = (value: string) => {
    const r = value as UserRole;
    setRole(r);
    if (r === "admin") setLocation("/admin");
    else if (r === "sales") setLocation("/sales");
    else setLocation("/");
  };

  return (
    <div className="bg-primary text-primary-foreground py-1.5 px-4 flex flex-wrap justify-between items-center text-xs gap-2 border-b border-primary-foreground/10" dir={isRTL ? "rtl" : "ltr"} data-testid="demo-switcher">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider opacity-90">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{t("demo.mode")}</span>
        </div>
        <span className="opacity-75 hidden sm:inline">{t("demo.viewing_as")}:</span>
        <Select value={role === "guest" ? "b2c" : role} onValueChange={handleRoleChange}>
          <SelectTrigger className="h-7 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 w-44 text-xs" data-testid="select-demo-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="b2c">{t("demo.role.guest")}</SelectItem>
            <SelectItem value="b2b">{t("demo.role.b2b")}</SelectItem>
            <SelectItem value="admin">{t("demo.role.admin")}</SelectItem>
            <SelectItem value="sales">{t("demo.role.sales")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-primary-foreground hover:bg-primary-foreground/20 gap-1.5"
        onClick={() => setLanguage(language === "en" ? "ar" : "en")}
        data-testid="button-toggle-language"
      >
        <Languages className="w-3.5 h-3.5" />
        {language === "en" ? "العربية" : "English"}
      </Button>
    </div>
  );
}
