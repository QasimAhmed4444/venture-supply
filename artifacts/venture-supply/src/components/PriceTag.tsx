import { useLanguage } from "@/contexts/LanguageContext";

interface PriceTagProps {
  amount: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  muted?: boolean;
  strike?: boolean;
}

export function PriceTag({ amount, size = "md", className = "", muted = false, strike = false }: PriceTagProps) {
  const { language } = useLanguage();
  const sizes = { sm: "text-sm", md: "text-base", lg: "text-xl", xl: "text-3xl" };
  const currencyCls = size === "xl" ? "text-base" : size === "lg" ? "text-sm" : "text-xs";
  const currency = language === "ar" ? "ر.س" : "SAR";
  const color = muted ? "text-muted-foreground" : "text-foreground";
  const strikeCls = strike ? "line-through opacity-60" : "";

  return (
    <span className={`inline-flex items-baseline gap-1 font-semibold ${sizes[size]} ${color} ${strikeCls} ${className}`} data-testid="price-tag">
      <span>{amount.toFixed(2)}</span>
      <span className={`${currencyCls} font-medium opacity-70`}>{currency}</span>
    </span>
  );
}
