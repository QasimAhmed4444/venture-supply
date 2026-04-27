import { useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Filter, ChevronRight, ChevronLeft } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/data/products";
import { categories } from "@/data/categories";
import { brands } from "@/data/brands";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  scope?: "all" | "category" | "brand" | "search";
}

export function ProductListingPage({ scope = "all" }: Props) {
  const { t, isRTL, language } = useLanguage();
  const params = useParams();
  const [location] = useLocation();
  const queryString = location.split("?")[1] ?? "";
  const search = new URLSearchParams(queryString);
  const q = search.get("q")?.toLowerCase() ?? "";
  const initialBrand = search.get("brand") ?? undefined;

  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialBrand ? [initialBrand] : []);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 600]);
  const [sortBy, setSortBy] = useState("relevance");

  const categoryId = scope === "category" ? params.slug : undefined;
  const category = categoryId ? categories.find((c) => c.slug === categoryId) : undefined;

  const filtered = useMemo(() => {
    let list = products;
    if (categoryId) list = list.filter((p) => p.categoryId === categoryId);
    if (q) list = list.filter((p) => p.enName.toLowerCase().includes(q) || p.arName.includes(q));
    if (selectedBrands.length) list = list.filter((p) => selectedBrands.includes(p.brandId));
    if (selectedAvailability.length) list = list.filter((p) => selectedAvailability.includes(p.stockStatus));
    list = list.filter((p) => p.b2cPrice >= priceRange[0] && p.b2cPrice <= priceRange[1]);
    if (sortBy === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    if (sortBy === "price-asc") list = [...list].sort((a, b) => a.b2cPrice - b.b2cPrice);
    if (sortBy === "price-desc") list = [...list].sort((a, b) => b.b2cPrice - a.b2cPrice);
    return list;
  }, [categoryId, q, selectedBrands, selectedAvailability, priceRange, sortBy]);

  const toggle = (val: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(val) ? list.filter((v) => v !== val) : [...list, val]);
  };

  const Chev = isRTL ? ChevronLeft : ChevronRight;
  const heading = category ? t(`category.${category.id}`) : q ? `"${q}"` : t("listing.all_products");

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <span className="hover:text-foreground cursor-pointer" onClick={() => window.history.back()}>{t("nav.home")}</span>
        <Chev className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">{heading}</span>
      </nav>

      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">{heading}</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} {t("common.results")}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("common.sort_by")}:</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-44 h-9" data-testid="select-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">{t("listing.sort.relevance")}</SelectItem>
              <SelectItem value="rating">{t("listing.sort.rating")}</SelectItem>
              <SelectItem value="price-asc">{t("listing.sort.price_asc")}</SelectItem>
              <SelectItem value="price-desc">{t("listing.sort.price_desc")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Filters */}
        <aside className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-5">
              <div className="flex items-center gap-2 text-sm font-semibold pb-2 border-b">
                <Filter className="w-4 h-4" /> {t("common.filters")}
              </div>

              <div>
                <Label className="text-sm font-semibold mb-3 block">{t("listing.brand")}</Label>
                <div className="space-y-2">
                  {brands.map((b) => (
                    <div key={b.id} className="flex items-center gap-2">
                      <Checkbox id={`b-${b.id}`} checked={selectedBrands.includes(b.id)} onCheckedChange={() => toggle(b.id, selectedBrands, setSelectedBrands)} data-testid={`filter-brand-${b.id}`} />
                      <Label htmlFor={`b-${b.id}`} className="text-sm font-normal cursor-pointer">{b.name}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-semibold mb-3 block">{t("listing.price_range")}</Label>
                <Slider value={priceRange} onValueChange={(v) => setPriceRange(v as [number, number])} min={0} max={600} step={10} className="my-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{priceRange[0]} {language === "ar" ? "ر.س" : "SAR"}</span>
                  <span>{priceRange[1]} {language === "ar" ? "ر.س" : "SAR"}</span>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-semibold mb-3 block">{t("listing.availability")}</Label>
                <div className="space-y-2">
                  {[
                    { id: "in-stock", label: t("product.in_stock") },
                    { id: "low-stock", label: t("product.low_stock") },
                  ].map((a) => (
                    <div key={a.id} className="flex items-center gap-2">
                      <Checkbox id={`a-${a.id}`} checked={selectedAvailability.includes(a.id)} onCheckedChange={() => toggle(a.id, selectedAvailability, setSelectedAvailability)} />
                      <Label htmlFor={`a-${a.id}`} className="text-sm font-normal cursor-pointer">{a.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button variant="ghost" size="sm" className="w-full" onClick={() => { setSelectedBrands([]); setSelectedAvailability([]); setPriceRange([0, 600]); }}>
                {t("common.cancel")} {t("common.filters").toLowerCase()}
              </Button>
            </CardContent>
          </Card>
        </aside>

        {/* Grid */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <p className="font-semibold text-lg">{t("listing.empty")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("common.no_results")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
