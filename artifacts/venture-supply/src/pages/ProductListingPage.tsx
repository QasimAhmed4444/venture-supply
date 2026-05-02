import { useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Filter, ChevronRight, ChevronLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useBrands } from "@/hooks/useBrands";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRole } from "@/contexts/RoleContext";

interface Props {
  scope?: "all" | "category" | "brand" | "search";
}

export function ProductListingPage({ scope = "all" }: Props) {
  const { t, isRTL, language } = useLanguage();
  const { role } = useRole();
  const isB2B = role === "b2b";
  const params = useParams();
  const [location] = useLocation();
  const queryString = location.split("?")[1] ?? "";
  const searchParams = new URLSearchParams(queryString);
  const q = searchParams.get("q")?.toLowerCase() ?? "";
  const initialBrand = searchParams.get("brand") ?? (scope === "brand" ? params.slug : undefined);

  const urlCategoryId = scope === "category" ? params.slug : undefined;

  const [activeCategory, setActiveCategory] = useState<string>(urlCategoryId ?? "");
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialBrand ? [initialBrand] : []);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 600]);
  const [sortBy, setSortBy] = useState("relevance");

  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  const activeCat = categories.find((c) => c.id === activeCategory || c.slug === activeCategory);
  const activeBrand = scope === "brand" && selectedBrands.length === 1 ? brands.find((b) => b.id === selectedBrands[0]) : null;

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory) {
      list = list.filter((p) => p.categoryId === activeCategory || p.categoryId === activeCat?.id);
    }
    if (q) list = list.filter((p) => p.enName.toLowerCase().includes(q) || p.arName.includes(q));
    if (selectedBrands.length) list = list.filter((p) => selectedBrands.includes(p.brandId));
    if (selectedAvailability.length) list = list.filter((p) => selectedAvailability.includes(p.stockStatus));
    const priceKey = isB2B ? "b2bPrice" : "b2cPrice";
    list = list.filter((p) => p[priceKey] >= priceRange[0] && p[priceKey] <= priceRange[1]);
    if (sortBy === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    if (sortBy === "price-asc") list = [...list].sort((a, b) => a[priceKey] - b[priceKey]);
    if (sortBy === "price-desc") list = [...list].sort((a, b) => b[priceKey] - a[priceKey]);
    return list;
  }, [products, activeCategory, activeCat, q, selectedBrands, selectedAvailability, priceRange, sortBy, isB2B]);

  const toggleBrand = (val: string) => {
    setSelectedBrands((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
  };
  const toggleAvail = (val: string) => {
    setSelectedAvailability((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
  };

  const Chev = isRTL ? ChevronLeft : ChevronRight;
  const heading = activeCat
    ? t(`category.${activeCat.id}`)
    : activeBrand
    ? activeBrand.name
    : q
    ? `"${q}"`
    : t("listing.all_products");

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <span className="hover:text-foreground cursor-pointer" onClick={() => window.history.back()}>{t("nav.home")}</span>
        <Chev className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">{heading}</span>
      </nav>

      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-primary">{heading}</h1>
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

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar Filters */}
        <aside>
          <Card className="sticky top-24 overflow-hidden">
            <CardContent className="p-4 space-y-5">
              <div className="flex items-center gap-2 text-sm font-semibold pb-2 border-b text-primary">
                <Filter className="w-4 h-4" /> {t("common.filters")}
              </div>

              {/* CATEGORIES — always visible, single-select */}
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide mb-3 block text-muted-foreground">
                  {t("home.categories.title")}
                </Label>
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => setActiveCategory("")}
                    className={`w-full text-start px-2 py-1.5 rounded text-sm transition-colors ${activeCategory === "" ? "bg-primary text-white font-semibold" : "hover:bg-muted text-foreground"}`}
                    data-testid="filter-cat-all"
                  >
                    {language === "ar" ? "جميع الفئات" : "All categories"}
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveCategory(activeCategory === c.id ? "" : c.id)}
                      className={`w-full text-start px-2 py-1.5 rounded text-sm transition-colors ${activeCategory === c.id ? "bg-primary text-white font-semibold" : "hover:bg-muted text-foreground"}`}
                      data-testid={`filter-cat-${c.id}`}
                    >
                      {t(`category.${c.id}`)}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* BRANDS */}
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide mb-3 block text-muted-foreground">
                  {t("listing.brand")}
                </Label>
                <div className="space-y-1.5">
                  {brands.map((b) => (
                    <div key={b.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`b-${b.id}`}
                        checked={selectedBrands.includes(b.id)}
                        onCheckedChange={() => toggleBrand(b.id)}
                        data-testid={`filter-brand-${b.id}`}
                      />
                      <Label htmlFor={`b-${b.id}`} className="text-sm font-normal cursor-pointer">{b.name}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* PRICE RANGE */}
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide mb-3 block text-muted-foreground">
                  {t("listing.price_range")}
                </Label>
                <Slider value={priceRange} onValueChange={(v) => setPriceRange(v as [number, number])} min={0} max={600} step={10} className="my-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{priceRange[0]} {language === "ar" ? "ر.س" : "SAR"}</span>
                  <span>{priceRange[1]} {language === "ar" ? "ر.س" : "SAR"}</span>
                </div>
              </div>

              <Separator />

              {/* AVAILABILITY */}
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide mb-3 block text-muted-foreground">
                  {t("listing.availability")}
                </Label>
                <div className="space-y-1.5">
                  {[
                    { id: "in-stock", label: t("product.in_stock") },
                    { id: "low-stock", label: t("product.low_stock") },
                  ].map((a) => (
                    <div key={a.id} className="flex items-center gap-2">
                      <Checkbox id={`a-${a.id}`} checked={selectedAvailability.includes(a.id)} onCheckedChange={() => toggleAvail(a.id)} />
                      <Label htmlFor={`a-${a.id}`} className="text-sm font-normal cursor-pointer">{a.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground text-xs"
                onClick={() => { setSelectedBrands([]); setActiveCategory(""); setSelectedAvailability([]); setPriceRange([0, 600]); }}
              >
                {language === "ar" ? "مسح الفلاتر" : "Clear all filters"}
              </Button>
            </CardContent>
          </Card>
        </aside>

        {/* Product Grid */}
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
