import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import type { OrderStatus } from "@/data/orders";

const styles: Record<OrderStatus, string> = {
  "new": "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800",
  "confirmed": "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-800",
  "preparing": "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800",
  "packed": "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950 dark:text-violet-200 dark:border-violet-800",
  "out-for-delivery": "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-200 dark:border-cyan-800",
  "delivered": "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800",
  "ready-for-pickup": "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-200 dark:border-teal-800",
  "cancelled": "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800",
};

export function StatusBadge({ status, className = "" }: { status: OrderStatus; className?: string }) {
  const { t } = useLanguage();
  return (
    <Badge variant="outline" className={`${styles[status]} font-medium ${className}`} data-testid={`badge-status-${status}`}>
      {t(`status.${status}`)}
    </Badge>
  );
}
