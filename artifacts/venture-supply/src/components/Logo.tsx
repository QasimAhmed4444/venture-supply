import { useLanguage } from "@/contexts/LanguageContext";
import vsLogo from "@assets/VS_Profile_1777479537900.png";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "light";
  showText?: boolean;
}

export function Logo({ size = "md", variant = "default", showText = false }: LogoProps) {
  const { t } = useLanguage();
  const dim =
    size === "sm" ? "h-9" : size === "lg" ? "h-14" : size === "xl" ? "h-20" : "h-12";

  return (
    <div className="flex items-center gap-3" data-testid="logo">
      <img
        src={vsLogo}
        alt={t("brand.name")}
        className={`${dim} w-auto object-contain ${variant === "light" ? "brightness-0 invert" : ""}`}
        draggable={false}
      />
      {showText && (
        <span className={`font-bold tracking-tight ${variant === "light" ? "text-white" : "text-primary"} ${size === "lg" || size === "xl" ? "text-xl" : "text-base"}`}>
          {t("brand.name")}
        </span>
      )}
    </div>
  );
}
