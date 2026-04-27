import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Category } from "@/data/categories";

export function CategoryCard({ category }: { category: Category }) {
  const { t } = useLanguage();
  return (
    <Link href={`/categories/${category.slug}`}>
      <div className="group cursor-pointer hover-elevate active-elevate-2 rounded-lg overflow-hidden bg-card border border-border/60 hover:border-secondary/60 transition-all" data-testid={`card-category-${category.id}`}>
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          <img src={category.image} alt={t(`category.${category.id}`)} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
        <div className="p-3 text-center">
          <h3 className="font-semibold text-sm">{t(`category.${category.id}`)}</h3>
          <p className="text-xs text-muted-foreground mt-1">{category.productCount} {t("admin.product_count").toLowerCase()}</p>
        </div>
      </div>
    </Link>
  );
}
