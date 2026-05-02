import { useLanguage } from "@/contexts/LanguageContext";
import vsLogo from "@assets/VS_Profile_1777479537900.png";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "light";
  showText?: boolean;
}

export function Logo({ size = "md", variant = "default", showText = false }: LogoProps) {
  const { t } = useLanguage();

  const containerH =
    size === "sm" ? 40 : size === "lg" ? 72 : size === "xl" ? 96 : 52;
  const imgH = Math.round(containerH * 1.35);

  return (
    <div className="flex items-center gap-3" data-testid="logo">
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{ height: containerH, width: "auto" }}
      >
        <img
          src={vsLogo}
          alt={t("brand.name")}
          style={{ height: imgH, width: "auto", objectFit: "contain" }}
          className={variant === "light" ? "brightness-0 invert" : ""}
          draggable={false}
        />
      </div>
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
