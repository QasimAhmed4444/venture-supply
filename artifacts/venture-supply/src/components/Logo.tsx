import { useLanguage } from "@/contexts/LanguageContext";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "light";
}

export function Logo({ size = "md", variant = "default" }: LogoProps) {
  const { t, isRTL } = useLanguage();
  const dim = size === "sm" ? "h-8" : size === "lg" ? "h-14" : "h-10";
  const text = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl";
  const sub = size === "sm" ? "text-[10px]" : size === "lg" ? "text-xs" : "text-[11px]";
  const color = variant === "light" ? "text-white" : "text-primary";
  const subColor = variant === "light" ? "text-white/80" : "text-muted-foreground";

  return (
    <div className="flex items-center gap-3" data-testid="logo">
      <div className={`${dim} aspect-square rounded-md bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm`}>
        <span className="text-secondary font-serif font-bold text-xl">V</span>
      </div>
      <div className={`flex flex-col leading-tight ${isRTL ? "items-end" : "items-start"}`}>
        <span className={`${text} font-bold tracking-tight ${color}`}>{t("brand.name")}</span>
        <span className={`${sub} ${subColor} tracking-wide uppercase`}>{t("brand.tagline")}</span>
      </div>
    </div>
  );
}
