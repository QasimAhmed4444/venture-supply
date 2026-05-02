import { useLanguage } from "@/contexts/LanguageContext";
import vsLogo from "@assets/VS_Profile_1777479537900.png";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "light";
  showText?: boolean;
}

export function Logo({ size = "md", variant = "default", showText = false }: LogoProps) {
  const { t } = useLanguage();

  const h = size === "sm" ? 44 : size === "lg" ? 68 : size === "xl" ? 96 : 56;

  return (
    <div className="flex items-center gap-2" data-testid="logo">
      <img
        src={vsLogo}
        alt={t("brand.name")}
        style={{ height: h, width: "auto", objectFit: "contain", display: "block" }}
        className={variant === "light" ? "brightness-0 invert" : ""}
        draggable={false}
      />
      {showText && (
        <span
          className={`font-bold tracking-tight ${variant === "light" ? "text-white" : "text-primary"} ${size === "lg" || size === "xl" ? "text-xl" : "text-base"}`}
        >
          {t("brand.name")}
        </span>
      )}
    </div>
  );
}
