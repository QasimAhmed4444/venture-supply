import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Trash2, ShoppingBag, Users as UsersIcon, AlertTriangle, TrendingUp, Wallet, Eye,
  Pencil, Search, Download, FileText, Package, DollarSign, Building2, CheckCircle2,
  Clock, XCircle, Truck, PackageCheck, ShoppingCart, X, ChevronUp, ChevronDown, Upload,
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/useCategories";
import { useBrands } from "@/hooks/useBrands";
import { useProducts } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useCustomers";
import { useOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import { useDashboard } from "@/hooks/useDashboard";
import { useSalespersons, useCreateSalesperson, useUpdateSalesperson, useDeleteSalesperson, type Salesperson } from "@/hooks/useSalespersons";
import { useRegions, type Region } from "@/hooks/useRegions";
import { useCreateStaff } from "@/hooks/useStaff";
import { apiFetch } from "@/lib/api";
import { useBusinessTypes, useCreateBusinessType, useUpdateBusinessType, useDeleteBusinessType, type BusinessType } from "@/hooks/useBusinessTypes";
import { useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from "@/hooks/useCustomerMutations";
import {
  useCreateProduct, useDeleteProduct, useUpdateProduct,
  useCreateCategory, useDeleteCategory, useUpdateCategory,
  useCreateBrand, useDeleteBrand, useUpdateBrand,
} from "@/hooks/useMutations";
import { useCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon, type Coupon } from "@/hooks/useCoupons";
import { ORDER_STATUSES, type Order, type OrderStatus } from "@/data/orders";
import { type Category } from "@/data/categories";
import { type Customer } from "@/data/customers";
import { StatusBadge } from "@/components/StatusBadge";
import { PriceTag } from "@/components/PriceTag";

const PRIMARY = "hsl(25, 47%, 24%)";
const SECONDARY = "hsl(42, 82%, 50%)";
const COLORS = [PRIMARY, SECONDARY, "hsl(155 40% 30%)", "hsl(0 65% 45%)", "hsl(220 50% 45%)", "hsl(280 40% 45%)"];

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function AdminDashboardPage() {
  const { t, language } = useLanguage();
  const { data: stats } = useDashboard();
  const { data: products = [] } = useProducts();
  const { data: orders = [] } = useOrders();
  const { data: customers = [] } = useCustomers();
  const { data: salespersons = [] } = useSalespersons();
  const { data: categories = [] } = useCategories();

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = stats?.ordersToday ?? orders.filter((o) => o.placedAt.slice(0, 10) === todayStr).length;
  const revenueToday = stats?.revenueToday ?? orders.filter((o) => o.placedAt.slice(0, 10) === todayStr).reduce((s, o) => s + o.total, 0);
  const pendingOrders = stats?.pendingOrders ?? orders.filter((o) => ["new", "confirmed", "preparing", "packed"].includes(o.status)).length;
  const lowStock = stats?.lowStock ?? products.filter((p) => p.stockStatus === "low-stock").length;
  const totalSales = orders.reduce((s, o) => s + o.total, 0);

  const now = new Date();
  const revenueData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now.getTime() - (29 - i) * 86_400_000);
    const dayStr = d.toISOString().slice(0, 10);
    const dayRevenue = orders.filter((o) => o.placedAt.slice(0, 10) === dayStr).reduce((s, o) => s + o.total, 0);
    return { day: `${d.getMonth() + 1}/${d.getDate()}`, revenue: dayRevenue };
  });

  const statusData = ORDER_STATUSES.map((s) => ({
    name: t(`status.${s}`),
    value: orders.filter((o) => o.status === s).length,
  })).filter((d) => d.value > 0);
  const statusTotal = statusData.reduce((a, b) => a + b.value, 0);
  const STATUS_COLORS = [
    "hsl(220 80% 55%)",
    "hsl(155 55% 38%)",
    "hsl(38 92% 50%)",
    "hsl(280 65% 55%)",
    "hsl(15 80% 55%)",
    "hsl(195 75% 45%)",
    "hsl(340 70% 50%)",
    "hsl(100 55% 40%)",
  ];

  const topCategories = useMemo(() => {
    const catMap: Record<string, number> = {};
    for (const o of orders) for (const it of o.items) {
      const prod = products.find((p) => p.id === it.productId);
      if (prod) catMap[prod.categoryId] = (catMap[prod.categoryId] ?? 0) + it.unitPrice * it.qty;
    }
    return Object.entries(catMap).map(([k, v]) => ({ name: t(`category.${k}`), value: Math.round(v) })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [orders, products, t]);

  const topProducts = [...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 5);

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const paymentTimeSeries = useMemo(() => MONTHS.map((month, i) => {
    const mo = orders.filter((o) => new Date(o.placedAt).getMonth() === i);
    return { month, b2c: mo.filter((o) => o.customerType === "b2c").reduce((s, o) => s + o.total, 0), b2b: mo.filter((o) => o.customerType === "b2b").reduce((s, o) => s + o.total, 0) };
  }), [orders]);

  const spPerf = salespersons.map((s) => ({ name: s.name.split(" ")[0], sales: s.monthlySales, target: s.monthlyTarget }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("admin.dashboard")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("common.today")} · {new Date().toLocaleDateString(language === "ar" ? "ar-SA" : "en-GB")}</p>
      </div>

      {/* 7 KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
        <KpiCard icon={UsersIcon} label="Total Customers" value={String(customers.length)} accent="bg-violet-100 text-violet-700" />
        <KpiCard icon={Package} label="Total Products" value={String(products.length)} accent="bg-sky-100 text-sky-700" />
        <KpiCard icon={DollarSign} label="Total Sales" value={<PriceTag amount={totalSales} size="md" />} accent="bg-emerald-100 text-emerald-700" />
        <KpiCard icon={ShoppingBag} label="Total Orders" value={String(orders.length)} accent="bg-indigo-100 text-indigo-700" />
        <KpiCard icon={Wallet} label={t("admin.kpi.orders_today")} value={String(todayOrders)} accent="bg-blue-100 text-blue-700" />
        <KpiCard icon={TrendingUp} label={t("admin.kpi.pending_orders")} value={String(pendingOrders)} accent="bg-amber-100 text-amber-700" />
        <KpiCard icon={AlertTriangle} label={t("admin.kpi.low_stock")} value={String(lowStock)} accent="bg-rose-100 text-rose-700" />
      </div>

      {/* Revenue + Orders by status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <h2 className="font-bold mb-4">{t("admin.chart.revenue")}</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke={PRIMARY} strokeWidth={2.5} dot={{ r: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h2 className="font-bold mb-1">{t("admin.chart.orders_by_status")}</h2>
            <p className="text-xs text-muted-foreground mb-3">
              {language === "ar" ? "مقارنة: الجديدة مقابل المُسلَّمة" : "New vs Delivered"}
            </p>
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={3}
                    label={({ cx, cy, midAngle, outerRadius: or, name, value }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = or + 22;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text x={x} y={y} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={11} fill="#374151">
                          <tspan x={x} dy="0">{name}</tspan>
                          <tspan x={x} dy="13" fontWeight="700" fill={STATUS_COLORS[statusData.findIndex((d) => d.name === name) % STATUS_COLORS.length]}>{value}</tspan>
                        </text>
                      );
                    }}
                    labelLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
                  >
                    {statusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number, name: string) => [`${v} orders`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{language === "ar" ? "الإجمالي" : "Total"}</span>
                <span className="text-2xl font-bold leading-none">{statusTotal}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Time Series B2B vs B2C */}
      <Card>
        <CardContent className="p-5">
          <h2 className="font-bold mb-4">Payment Time Series (B2B vs B2C)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={paymentTimeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="b2c" stackId="1" stroke={SECONDARY} fill={SECONDARY} fillOpacity={0.4} name="B2C" />
                <Area type="monotone" dataKey="b2b" stackId="1" stroke={PRIMARY} fill={PRIMARY} fillOpacity={0.4} name="B2B" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Sales by Category + Salesperson Performance */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <h2 className="font-bold mb-1">{language === "ar" ? "أعلى 5 فئات" : "Top 5 Categories"}</h2>
            <p className="text-xs text-muted-foreground mb-3">{language === "ar" ? "بإجمالي المبيعات" : "By total sales"}</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCategories} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="value" fill={PRIMARY} name="Sales (SAR)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h2 className="font-bold mb-4">Salesperson Performance</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spPerf}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill={PRIMARY} name="Sales" />
                  <Bar dataKey="target" fill={SECONDARY} name="Target" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products + Recent Orders */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <h2 className="font-bold mb-4">{t("admin.top_products")}</h2>
            <div className="space-y-3">
              {topProducts.map((p, i) => {
                const name = language === "ar" ? p.arName : p.enName;
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                    <img src={p.image} alt={name} className="w-10 h-10 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight truncate">{name}</p>
                      <p className="text-xs text-muted-foreground">{p.reviewCount} {language === "ar" ? "بيع" : "sold"}</p>
                    </div>
                    <PriceTag amount={p.b2cPrice} size="sm" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h2 className="font-bold mb-4">{t("admin.recent_orders")}</h2>
            <div className="space-y-2">
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-2 py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-mono text-xs">{o.trackingId}</p>
                    <p className="text-sm font-medium">{o.customerName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriceTag amount={o.total} size="sm" />
                    <StatusBadge status={o.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: any; accent: string }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className={`w-9 h-9 rounded-lg ${accent} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="font-bold text-lg leading-tight">{value}</div>
        <div className="text-[11px] text-muted-foreground leading-tight">{label}</div>
      </CardContent>
    </Card>
  );
}

function ImageUploadField({ value, onChange, label = "Image" }: { value: string; onChange: (v: string) => void; label?: string }) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <label className="flex-1 cursor-pointer">
          <div className="flex items-center gap-2 h-9 px-3 border rounded-md bg-background hover:bg-muted transition-colors text-sm text-muted-foreground">
            <Upload className="w-4 h-4 shrink-0" />
            <span className="truncate">{value ? "Change image…" : "Choose image…"}</span>
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
        {value && (
          <img src={value} alt="preview" className="w-9 h-9 object-cover rounded border shrink-0" />
        )}
      </div>
    </div>
  );
}

// ─── Categories ────────────────────────────────────────────────────────────────

export function AdminCategoriesPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const updateCategory = useUpdateCategory();
  const [addOpen, setAddOpen] = useState(false);
  const [newCat, setNewCat] = useState({ enName: "", image: "" });
  const [editCat, setEditCat] = useState<{ id: string; image: string; productCount?: number } | null>(null);
  const [editCatImage, setEditCatImage] = useState("");

  const handleCreate = () => {
    if (!newCat.enName) return;
    createCategory.mutate(newCat, {
      onSuccess: () => {
        toast({ title: t("common.create"), description: `"${newCat.enName}" added` });
        setAddOpen(false);
        setNewCat({ enName: "", image: "" });
      },
      onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("admin.categories")}</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 me-1.5" /> {t("common.add")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{language === "ar" ? "إضافة فئة" : "Add Category"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>{t("common.name")} (EN)</Label><Input value={newCat.enName} onChange={(e) => setNewCat((p) => ({ ...p, enName: e.target.value }))} /></div>
              <ImageUploadField value={newCat.image} onChange={(v) => setNewCat((p) => ({ ...p, image: v }))} label={`${t("common.image")}`} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>{language === "ar" ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={handleCreate} disabled={createCategory.isPending}>{createCategory.isPending ? "Saving…" : t("common.create")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((c) => (
          <Card key={c.id} className="overflow-hidden">
            <div className="h-32 bg-muted overflow-hidden">
              {c.image ? <img src={c.image} alt={c.id} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>}
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold">{t(`category.${c.id}`)}</h3>
              <p className="text-xs text-muted-foreground">{c.productCount ?? 0} products</p>
              <div className="flex gap-1 mt-3">
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => { setEditCat(c); setEditCatImage(c.image ?? ""); }}><Pencil className="w-3.5 h-3.5 me-1" /> Edit</Button>
                <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => deleteCategory.mutate(c.id, { onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }) })}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={!!editCat} onOpenChange={() => setEditCat(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{language === "ar" ? "تعديل الفئة" : "Edit Category"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <ImageUploadField value={editCatImage} onChange={setEditCatImage} label={`${t("common.image")}`} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCat(null)}>{language === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => {
              if (!editCat) return;
              updateCategory.mutate({ id: editCat.id, image: editCatImage }, {
                onSuccess: () => { toast({ title: language === "ar" ? "تم التحديث" : "Category updated" }); setEditCat(null); },
                onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
              });
            }} disabled={updateCategory.isPending}>{updateCategory.isPending ? "Saving…" : t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Products ──────────────────────────────────────────────────────────────────

export function AdminProductsPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [brand, setBrand] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const { data: businessTypes = [] } = useBusinessTypes();
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();
  const [newProd, setNewProd] = useState({ enName: "", arName: "", sku: "", description: "", b2cPrice: "", b2bPrice: "", categoryId: "", brandId: "", businessTypeId: "", image: "", stockQty: "100", minStockQty: "20", active: true, allowOos: false });
  const [editProd, setEditProd] = useState<(typeof products)[0] | null>(null);
  const [editProdData, setEditProdData] = useState({ enName: "", arName: "", b2cPrice: "", b2bPrice: "", image: "", stockQty: "", stockStatus: "in-stock", featured: false, active: true });

  const filtered = useMemo(() => products.filter((p) => {
    const name = language === "ar" ? p.arName : p.enName;
    return (search === "" || name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
      && (cat === "all" || p.categoryId === cat)
      && (brand === "all" || p.brandId === brand);
  }), [products, search, cat, brand, language]);

  const handleCreate = () => {
    if (!newProd.enName || !newProd.b2cPrice) return;
    createProduct.mutate({
      enName: newProd.enName, arName: newProd.arName, sku: newProd.sku,
      b2cPrice: Number(newProd.b2cPrice), b2bPrice: Number(newProd.b2bPrice),
      categoryId: newProd.categoryId || categories[0]?.id || "rice",
      brandId: newProd.brandId || brands[0]?.id || "chef-flavor",
      image: newProd.image, stockQty: Number(newProd.stockQty), stockStatus: "in-stock",
      audience: "both", packs: [], minOrderQty: 1, rating: 0, reviewCount: 0, featured: false,
    }, {
      onSuccess: () => {
        toast({ title: t("common.create"), description: `"${newProd.enName}" created` });
        setAddOpen(false);
        setNewProd({ enName: "", arName: "", sku: "", description: "", b2cPrice: "", b2bPrice: "", categoryId: "", brandId: "", businessTypeId: "", image: "", stockQty: "100", minStockQty: "20", active: true, allowOos: false });
      },
      onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold">{t("admin.products")}</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild><Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 me-1.5" />{t("admin.add_product")}</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{t("admin.add_product")}</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Basic Info</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Product Name (EN)</Label><Input value={newProd.enName} onChange={(e) => setNewProd((p) => ({ ...p, enName: e.target.value }))} /></div>
                <div><Label>Product Name (AR)</Label><Input value={newProd.arName} onChange={(e) => setNewProd((p) => ({ ...p, arName: e.target.value }))} /></div>
              </div>
              <div><Label>SKU</Label><Input value={newProd.sku} onChange={(e) => setNewProd((p) => ({ ...p, sku: e.target.value }))} /></div>
              <div><Label>Description</Label><Input value={newProd.description} onChange={(e) => setNewProd((p) => ({ ...p, description: e.target.value }))} placeholder="Short description…" /></div>
              <Separator />
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Pricing</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>B2C Price (SAR)</Label><Input type="number" value={newProd.b2cPrice} onChange={(e) => setNewProd((p) => ({ ...p, b2cPrice: e.target.value }))} /></div>
                <div><Label>B2B Price (SAR)</Label><Input type="number" value={newProd.b2bPrice} onChange={(e) => setNewProd((p) => ({ ...p, b2bPrice: e.target.value }))} /></div>
              </div>
              <Separator />
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Classification</p>
              <div><Label>{t("product.category")}</Label>
                <select className="w-full h-9 px-3 border rounded-md bg-background" value={newProd.categoryId} onChange={(e) => setNewProd((p) => ({ ...p, categoryId: e.target.value }))}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{t(`category.${c.id}`)}</option>)}
                </select>
              </div>
              <div><Label>{t("product.brand")}</Label>
                <select className="w-full h-9 px-3 border rounded-md bg-background" value={newProd.brandId} onChange={(e) => setNewProd((p) => ({ ...p, brandId: e.target.value }))}>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div><Label>Business Type <span className="text-muted-foreground">(optional)</span></Label>
                <select className="w-full h-9 px-3 border rounded-md bg-background" value={newProd.businessTypeId} onChange={(e) => setNewProd((p) => ({ ...p, businessTypeId: e.target.value }))}>
                  <option value="">— Any —</option>
                  {businessTypes.map((bt) => <option key={bt.id} value={bt.id}>{bt.name}</option>)}
                </select>
              </div>
              <Separator />
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Inventory</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Stock Quantity</Label><Input type="number" value={newProd.stockQty} onChange={(e) => setNewProd((p) => ({ ...p, stockQty: e.target.value }))} /></div>
                <div><Label>Minimum Stock Level</Label><Input type="number" value={newProd.minStockQty} onChange={(e) => setNewProd((p) => ({ ...p, minStockQty: e.target.value }))} /></div>
              </div>
              <Separator />
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Media & Controls</p>
              <ImageUploadField value={newProd.image} onChange={(v) => setNewProd((p) => ({ ...p, image: v }))} label="Product Image" />
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={newProd.active} onCheckedChange={(v) => setNewProd((p) => ({ ...p, active: v }))} id="new-active" />
                  <Label htmlFor="new-active">Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={newProd.allowOos} onCheckedChange={(v) => setNewProd((p) => ({ ...p, allowOos: v }))} id="new-oos" />
                  <Label htmlFor="new-oos">Allow Orders When Out of Stock</Label>
                </div>
              </div>
            </div>
            <DialogFooter><Button onClick={handleCreate} disabled={createProduct.isPending}>{createProduct.isPending ? "Saving…" : t("common.create")}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="SKU or name" className="ps-10" />
            </div>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All category</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{t(`category.${c.id}`)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All brands" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All brand</SelectItem>
                {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">{filtered.length} products</p>
          <Table>
            <TableHeader><TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>{t("common.name")}</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>B2C Price</TableHead>
              <TableHead>B2B Price</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead className="text-end">{t("common.actions")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.slice(0, 50).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                  <TableCell><div className="flex items-center gap-2"><img src={p.image} alt={p.enName} className="w-8 h-8 rounded object-cover" /><span className="font-medium text-sm">{language === "ar" ? p.arName : p.enName}</span></div></TableCell>
                  <TableCell className="text-xs">{t(`category.${p.categoryId}`)}</TableCell>
                  <TableCell>{p.b2cPrice > 0 ? <PriceTag amount={p.b2cPrice} size="sm" /> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                  <TableCell>{p.b2bPrice > 0 ? <PriceTag amount={p.b2bPrice} size="sm" /> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                  <TableCell><Badge variant={p.stockStatus === "in-stock" ? "default" : p.stockStatus === "low-stock" ? "secondary" : "destructive"}>{t(`product.${p.stockStatus.replace("-", "_")}`)}</Badge></TableCell>
                  <TableCell className="text-end space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditProd(p); setEditProdData({ enName: p.enName, arName: p.arName, b2cPrice: String(p.b2cPrice), b2bPrice: String(p.b2bPrice), image: p.image || "", stockQty: String(p.stockQty), stockStatus: p.stockStatus, featured: p.featured ?? false, active: true }); }}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => deleteProduct.mutate(p.id, { onSuccess: () => toast({ title: "Deleted" }), onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }) })}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editProd} onOpenChange={() => setEditProd(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{language === "ar" ? "تعديل المنتج" : "Edit Product"}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name (EN)</Label><Input value={editProdData.enName} onChange={(e) => setEditProdData((p) => ({ ...p, enName: e.target.value }))} /></div>
              <div><Label>Name (AR)</Label><Input value={editProdData.arName} onChange={(e) => setEditProdData((p) => ({ ...p, arName: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>B2C Price</Label><Input type="number" value={editProdData.b2cPrice} onChange={(e) => setEditProdData((p) => ({ ...p, b2cPrice: e.target.value }))} /></div>
              <div><Label>B2B Price</Label><Input type="number" value={editProdData.b2bPrice} onChange={(e) => setEditProdData((p) => ({ ...p, b2bPrice: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Stock Qty</Label><Input type="number" value={editProdData.stockQty} onChange={(e) => setEditProdData((p) => ({ ...p, stockQty: e.target.value }))} /></div>
              <div><Label>{t("common.status")}</Label>
                <select className="w-full h-9 px-3 border rounded-md bg-background" value={editProdData.stockStatus} onChange={(e) => setEditProdData((p) => ({ ...p, stockStatus: e.target.value }))}>
                  <option value="in-stock">In Stock</option>
                  <option value="low-stock">Low Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>
              </div>
            </div>
            <ImageUploadField value={editProdData.image} onChange={(v) => setEditProdData((p) => ({ ...p, image: v }))} label="Product Image" />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={editProdData.featured} onCheckedChange={(v) => setEditProdData((p) => ({ ...p, featured: v }))} id="edit-featured" />
                <Label htmlFor="edit-featured">{language === "ar" ? "مميز" : "Featured"}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editProdData.active} onCheckedChange={(v) => setEditProdData((p) => ({ ...p, active: v }))} id="edit-active" />
                <Label htmlFor="edit-active">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProd(null)}>Cancel</Button>
            <Button onClick={() => {
              if (!editProd) return;
              updateProduct.mutate({ id: editProd.id, enName: editProdData.enName, arName: editProdData.arName, b2cPrice: Number(editProdData.b2cPrice), b2bPrice: Number(editProdData.b2bPrice), image: editProdData.image, stockQty: Number(editProdData.stockQty), stockStatus: editProdData.stockStatus as any, featured: editProdData.featured }, {
                onSuccess: () => { toast({ title: "Product updated" }); setEditProd(null); },
                onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
              });
            }} disabled={updateProduct.isPending}>{updateProduct.isPending ? "Saving…" : t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Inventory ─────────────────────────────────────────────────────────────────

export function AdminInventoryPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const updateProduct = useUpdateProduct();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [adjustProd, setAdjustProd] = useState<(typeof products)[0] | null>(null);
  const [adjustMode, setAdjustMode] = useState<"set" | "add" | "reduce">("set");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustStatus, setAdjustStatus] = useState("in-stock");

  const filtered = useMemo(() => products.filter((p) => {
    const name = language === "ar" ? p.arName : p.enName;
    return (search === "" || name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
      && (catFilter === "all" || p.categoryId === catFilter)
      && (brandFilter === "all" || p.brandId === brandFilter)
      && (stockFilter === "all" || p.stockStatus === stockFilter);
  }), [products, search, catFilter, brandFilter, stockFilter, language]);

  const computeNewQty = () => {
    const current = adjustProd?.stockQty ?? 0;
    const delta = Number(adjustQty);
    if (adjustMode === "set") return delta;
    if (adjustMode === "add") return current + delta;
    return Math.max(0, current - delta);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">{t("admin.inventory")}</h1>
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name / SKU" className="ps-10" />
            </div>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{t(`category.${c.id}`)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Brand" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Stock status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Stock (Qty)</TableHead>
              <TableHead>Min Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-end">{t("admin.adjust_stock")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell><img src={p.image} alt={p.enName} className="w-8 h-8 rounded object-cover" /></TableCell>
                  <TableCell className="font-medium text-sm">{language === "ar" ? p.arName : p.enName}</TableCell>
                  <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                  <TableCell className="text-xs">{t(`category.${p.categoryId}`)}</TableCell>
                  <TableCell className="text-xs">{brands.find((b) => b.id === p.brandId)?.name ?? "—"}</TableCell>
                  <TableCell><span className={`font-bold ${p.stockStatus === "low-stock" ? "text-amber-700" : p.stockStatus === "out-of-stock" ? "text-rose-700" : "text-emerald-700"}`}>{p.stockQty ?? "—"}</span></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{20}</TableCell>
                  <TableCell><Badge variant={p.stockStatus === "in-stock" ? "default" : p.stockStatus === "low-stock" ? "secondary" : "destructive"}>{t(`product.${p.stockStatus.replace("-", "_")}`)}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">—</TableCell>
                  <TableCell className="text-end"><Button size="sm" variant="outline" onClick={() => { setAdjustProd(p); setAdjustQty(String(p.stockQty ?? 0)); setAdjustStatus(p.stockStatus); setAdjustMode("set"); }}>{t("admin.adjust_stock")}</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!adjustProd} onOpenChange={() => setAdjustProd(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust Stock — {adjustProd ? (language === "ar" ? adjustProd.arName : adjustProd.enName) : ""}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-1">
              {(["set", "add", "reduce"] as const).map((m) => (
                <Button key={m} size="sm" variant={adjustMode === m ? "default" : "outline"} onClick={() => { setAdjustMode(m); setAdjustQty(""); }} className="capitalize">{m}</Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {adjustMode === "set" ? "Set exact quantity" : adjustMode === "add" ? `Add to current (${adjustProd?.stockQty ?? 0})` : `Reduce from current (${adjustProd?.stockQty ?? 0})`}
            </p>
            <div><Label>{adjustMode === "set" ? "New Quantity" : "Amount to " + adjustMode}</Label><Input type="number" min="0" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} /></div>
            {adjustQty && <p className="text-sm font-medium">Result: <span className="text-primary">{computeNewQty()} units</span></p>}
            <div><Label>{t("common.status")}</Label>
              <select className="w-full h-9 px-3 border rounded-md bg-background" value={adjustStatus} onChange={(e) => setAdjustStatus(e.target.value)}>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustProd(null)}>Cancel</Button>
            <Button onClick={() => {
              if (!adjustProd) return;
              updateProduct.mutate({ id: adjustProd.id, stockQty: computeNewQty(), stockStatus: adjustStatus as any }, {
                onSuccess: () => { toast({ title: "Stock updated" }); setAdjustProd(null); },
                onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
              });
            }} disabled={updateProduct.isPending}>{updateProduct.isPending ? "Saving…" : t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Orders ────────────────────────────────────────────────────────────────────

const STATUS_ACTIONS: { status: OrderStatus; label: string; icon: any; color: string }[] = [
  { status: "confirmed", label: "Approve", icon: CheckCircle2, color: "text-emerald-600" },
  { status: "preparing", label: "Mark Preparing", icon: Clock, color: "text-amber-600" },
  { status: "packed", label: "Packed", icon: PackageCheck, color: "text-sky-600" },
  { status: "ready-for-pickup", label: "Ready for Pickup", icon: ShoppingCart, color: "text-violet-600" },
  { status: "out-for-delivery", label: "Out for Delivery", icon: Truck, color: "text-blue-600" },
  { status: "delivered", label: "Mark Delivered", icon: CheckCircle2, color: "text-emerald-700" },
  { status: "cancelled", label: "Cancel / Failed", icon: XCircle, color: "text-rose-600" },
];

export function AdminOrdersPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "b2c" | "b2b">("all");
  const [spFilter, setSpFilter] = useState("all");
  const [payFilter, setPayFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { data: allOrders = [] } = useOrders();
  const { data: salespersons = [] } = useSalespersons();
  const { data: customers = [] } = useCustomers();
  const updateStatus = useUpdateOrderStatus();
  const [selected, setSelected] = useState<Order | null>(null);

  const filtered = useMemo(() => allOrders.filter((o) => {
    const s = search.toLowerCase();
    const matchSearch = !s || o.trackingId.toLowerCase().includes(s) || o.customerName.toLowerCase().includes(s);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchType = typeFilter === "all" || o.customerType === typeFilter;
    const matchSP = spFilter === "all" || o.salespersonId === spFilter;
    const matchPay = payFilter === "all" || o.paymentMethod === payFilter;
    const matchFrom = !dateFrom || o.placedAt >= dateFrom;
    const matchTo = !dateTo || o.placedAt <= dateTo + "T23:59:59";
    return matchSearch && matchStatus && matchType && matchSP && matchPay && matchFrom && matchTo;
  }), [allOrders, search, statusFilter, typeFilter, spFilter, payFilter, dateFrom, dateTo]);

  const handleStatusChange = (newStatus: string) => {
    if (!selected) return;
    const history = [...(selected.history ?? []), { status: newStatus as OrderStatus, at: new Date().toISOString() }];
    updateStatus.mutate({ id: selected.id, status: newStatus as OrderStatus, history }, {
      onSuccess: () => {
        setSelected({ ...selected, status: newStatus as OrderStatus, history });
        toast({ title: t("admin.update_status"), description: t(`status.${newStatus}`) });
      },
      onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
    });
  };

  const exportCsv = () => {
    const rows = [["Order ID", "Tracking", "Customer", "Type", "Salesperson", "Items", "Total", "Payment", "Status", "Date"]];
    for (const o of filtered) {
      const sp = salespersons.find((s) => s.id === o.salespersonId);
      rows.push([o.id, o.trackingId, o.customerName, o.customerType.toUpperCase(), sp?.name ?? "—", String(o.items.length), o.total.toFixed(2), o.paymentMethod, o.status, new Date(o.placedAt).toLocaleDateString()]);
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv); a.download = "orders.csv"; a.click();
    toast({ title: "Exported", description: `${filtered.length} orders downloaded` });
  };

  const getCustomerContact = (customerId: string) => customers.find((c) => c.id === customerId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold">{t("admin.orders")}</h1>
        <Button variant="outline" onClick={exportCsv}><Download className="w-4 h-4 me-1.5" /> Export CSV</Button>
      </div>

      <Card>
        <CardContent className="p-5 space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Order ID / Customer" className="ps-10" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="b2c">B2C</SelectItem>
                <SelectItem value="b2b">B2B</SelectItem>
              </SelectContent>
            </Select>
            <Select value={spFilter} onValueChange={setSpFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Salesperson" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Salespersons</SelectItem>
                {salespersons.map((s) => <SelectItem key={s.id} value={s.id}>{s.name.split(" ")[0]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={payFilter} onValueChange={setPayFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Payment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="cod">Cash on Delivery</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="credit">Credit (B2B)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <Label className="text-xs text-muted-foreground">Date Range:</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36 h-8 text-sm" />
            <span className="text-xs text-muted-foreground">to</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36 h-8 text-sm" />
            {(dateFrom || dateTo) && <Button size="sm" variant="ghost" onClick={() => { setDateFrom(""); setDateTo(""); }} className="h-8 text-xs">Clear</Button>}
            <span className="text-xs text-muted-foreground ms-auto">{filtered.length} orders</span>
          </div>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Tracking ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Salesperson</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Est. Delivery</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((o) => {
                const sp = salespersons.find((s) => s.id === o.salespersonId);
                const cust = getCustomerContact(o.customerId);
                return (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link href={`/track/${o.trackingId}`} className="font-mono text-xs font-semibold text-primary hover:underline">{o.trackingId}</Link>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{o.customerName}</p>
                      {cust && <p className="text-xs text-muted-foreground">{cust.phone}</p>}
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{o.customerType.toUpperCase()}</Badge></TableCell>
                    <TableCell className="text-xs">{sp ? sp.name.split(" ")[0] : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-sm">{o.items.length}</TableCell>
                    <TableCell><PriceTag amount={o.total} size="sm" /></TableCell>
                    <TableCell><Badge variant="outline" className="text-xs capitalize">{o.paymentMethod}</Badge></TableCell>
                    <TableCell className="text-xs">{new Date(o.placedAt).toLocaleDateString(language === "ar" ? "ar-SA" : "en-GB")}</TableCell>
                    <TableCell className="text-xs">{o.estimatedAt ? new Date(o.estimatedAt).toLocaleDateString(language === "ar" ? "ar-SA" : "en-GB") : "—"}</TableCell>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                    <TableCell className="text-end"><Button size="sm" variant="outline" onClick={() => setSelected(o)}><Eye className="w-3.5 h-3.5 me-1" /> View</Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{selected?.trackingId}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {/* Quick action buttons */}
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Quick Actions</p>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_ACTIONS.map(({ status, label, icon: Icon, color }) => (
                    <Button key={status} size="sm" variant="outline" className={`text-xs ${color}`} onClick={() => handleStatusChange(status)} disabled={selected.status === status || updateStatus.isPending}>
                      <Icon className="w-3 h-3 me-1" />{label}
                    </Button>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="text-sm space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-28 shrink-0">Status:</span>
                  <StatusBadge status={selected.status} />
                </div>
                <p><span className="text-muted-foreground">Customer:</span> <span className="font-medium">{selected.customerName}</span> <Badge variant="outline" className="text-xs ms-1">{selected.customerType.toUpperCase()}</Badge></p>
                {selected.salespersonId && <p><span className="text-muted-foreground">Salesperson:</span> {salespersons.find((s) => s.id === selected.salespersonId)?.name ?? selected.salespersonId}</p>}
                {getCustomerContact(selected.customerId) && (
                  <p><span className="text-muted-foreground">Phone:</span> {getCustomerContact(selected.customerId)?.phone}</p>
                )}
                <p><span className="text-muted-foreground">Address:</span> {selected.deliveryAddress}, {selected.city}</p>
                <p><span className="text-muted-foreground">Payment:</span> <span className="capitalize">{selected.paymentMethod}</span></p>
                <p><span className="text-muted-foreground">Order Date:</span> {new Date(selected.placedAt).toLocaleDateString()}</p>
                {selected.estimatedAt && <p><span className="text-muted-foreground">Est. Delivery:</span> {new Date(selected.estimatedAt).toLocaleDateString()}</p>}
                {selected.notes && (
                  <div className="mt-1.5 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
                    <p className="text-xs font-semibold text-amber-700 mb-0.5">Delivery Notes</p>
                    <p className="text-amber-900 text-xs">{selected.notes}</p>
                  </div>
                )}
              </div>
              <Separator />
              <div className="space-y-2">
                {selected.items.map((it) => (
                  <div key={`${it.productId}-${it.packSize}`} className="flex justify-between text-sm">
                    <span>{(language === "ar" ? it.arName : it.enName)} × {it.qty}</span>
                    <PriceTag amount={it.unitPrice * it.qty} size="sm" />
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between font-bold"><span>{t("common.total")}</span><PriceTag amount={selected.total} size="md" /></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Customers ─────────────────────────────────────────────────────────────────

const BLANK_CUST = { name: "", email: "", phone: "", city: "", address: "", type: "b2c" as "b2c" | "b2b", businessName: "", businessTypeId: "", creditLimit: "", allowCredit: false, active: true, assignedSalespersonId: "" };

export function AdminCustomersPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [tab, setTab] = useState<"all" | "b2c" | "b2b">("all");
  const [search, setSearch] = useState("");
  const [spFilter, setSpFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<"name" | "city" | "totalOrders" | "lifetimeValue" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };
  const { data: allCustomers = [] } = useCustomers();
  const { data: businessTypes = [] } = useBusinessTypes();
  const { data: salespersons = [] } = useSalespersons();
  const list = allCustomers
    .filter((c) => tab === "all" || c.type === tab)
    .filter((c) => spFilter === "all" || c.assignedSalespersonId === spFilter)
    .filter((c) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        (c.business?.name ?? "").toLowerCase().includes(q)
      );
    });
  const sorted = sortKey
    ? [...list].sort((a, b) => {
        const mul = sortDir === "asc" ? 1 : -1;
        if (sortKey === "name") return mul * a.name.localeCompare(b.name);
        if (sortKey === "city") return mul * (a.city ?? "").localeCompare(b.city ?? "");
        if (sortKey === "totalOrders") return mul * (a.totalOrders - b.totalOrders);
        if (sortKey === "lifetimeValue") return mul * (a.lifetimeValue - b.lifetimeValue);
        return 0;
      })
    : list;
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const [addOpen, setAddOpen] = useState(false);
  const [newCust, setNewCust] = useState(BLANK_CUST);
  const [viewCust, setViewCust] = useState<(typeof allCustomers)[0] | null>(null);
  const [editCust, setEditCust] = useState<(typeof allCustomers)[0] | null>(null);
  const [editData, setEditData] = useState(BLANK_CUST);

  const openEdit = (c: (typeof allCustomers)[0]) => {
    setEditCust(c);
    setEditData({
      name: c.name,
      email: c.email,
      phone: c.phone,
      city: c.city,
      address: c.addresses?.[0]?.fullAddress ?? "",
      type: c.type,
      businessName: c.business?.name ?? "",
      businessTypeId: "",
      creditLimit: (c.business as any)?.creditLimit != null ? String((c.business as any).creditLimit) : "",
      allowCredit: (c.business as any)?.allowCredit ?? false,
      active: true,
      assignedSalespersonId: c.assignedSalespersonId ?? "",
    });
  };

  const exportCsv = () => {
    const rows = [["Name", "Email", "Phone", "City", "Type", "Business Name", "Business Type", "Salesperson", "Orders", "Lifetime Value (SAR)", "Joined"]];
    for (const c of sorted) {
      const sp = salespersons.find((s) => s.id === c.assignedSalespersonId);
      rows.push([
        c.name, c.email, c.phone, c.city, c.type.toUpperCase(),
        c.business?.name ?? "",
        c.business?.type ?? "",
        sp?.name ?? "",
        String(c.totalOrders),
        c.lifetimeValue.toFixed(2),
        c.joinedDate ? new Date(c.joinedDate).toLocaleDateString() : "",
      ]);
    }
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `customers${tab !== "all" ? `-${tab}` : ""}${search ? `-search` : ""}.csv`;
    a.click();
    toast({ title: "Exported", description: `${list.length} customer${list.length !== 1 ? "s" : ""} downloaded` });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold">{t("admin.customers")}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}><Download className="w-4 h-4 me-1.5" /> Export CSV</Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 me-1.5" /> Add Customer</Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Basic Info</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Customer Name</Label><Input value={newCust.name} onChange={(e) => setNewCust((p) => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>Email</Label><Input type="email" value={newCust.email} onChange={(e) => setNewCust((p) => ({ ...p, email: e.target.value }))} /></div>
              </div>
              <div><Label>Phone Number</Label><Input value={newCust.phone} onChange={(e) => setNewCust((p) => ({ ...p, phone: e.target.value }))} /></div>
              <Separator />
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Account Info</p>
              <div><Label>Customer Type</Label>
                <div className="flex gap-3 mt-1">
                  {(["b2c", "b2b"] as const).map((v) => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value={v} checked={newCust.type === v} onChange={() => setNewCust((p) => ({ ...p, type: v }))} />
                      <span className="font-medium">{v.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
              </div>
              {newCust.type === "b2b" && (
                <>
                  <Separator />
                  <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">B2B Info</p>
                  <div><Label>Business Name</Label><Input value={newCust.businessName} onChange={(e) => setNewCust((p) => ({ ...p, businessName: e.target.value }))} /></div>
                  <div><Label>Business Type</Label>
                    <select className="w-full h-9 px-3 border rounded-md bg-background" value={newCust.businessTypeId} onChange={(e) => setNewCust((p) => ({ ...p, businessTypeId: e.target.value }))}>
                      <option value="">— Select —</option>
                      {businessTypes.map((bt) => <option key={bt.id} value={bt.id}>{bt.name} ({bt.code})</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={newCust.allowCredit} onCheckedChange={(v) => setNewCust((p) => ({ ...p, allowCredit: v }))} id="new-credit" />
                    <Label htmlFor="new-credit">Allow Credit</Label>
                  </div>
                  {newCust.allowCredit && <div><Label>Credit Limit (SAR)</Label><Input type="number" value={newCust.creditLimit} onChange={(e) => setNewCust((p) => ({ ...p, creditLimit: e.target.value }))} /></div>}
                </>
              )}
              <Separator />
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Location</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>City</Label><Input value={newCust.city} onChange={(e) => setNewCust((p) => ({ ...p, city: e.target.value }))} /></div>
                <div><Label>Address</Label><Input value={newCust.address} onChange={(e) => setNewCust((p) => ({ ...p, address: e.target.value }))} /></div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={newCust.active} onCheckedChange={(v) => setNewCust((p) => ({ ...p, active: v }))} id="new-cust-active" />
                <Label htmlFor="new-cust-active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                if (!newCust.name) return;
                const bt = businessTypes.find((b) => b.id === newCust.businessTypeId);
                createCustomer.mutate({ ...newCust, businessTypeCode: bt?.code }, {
                  onSuccess: () => {
                    toast({ title: "Customer added", description: `${newCust.name} saved to database` });
                    setAddOpen(false);
                    setNewCust(BLANK_CUST);
                  },
                  onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
                });
              }} disabled={createCustomer.isPending}>{createCustomer.isPending ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Tabs value={tab} onValueChange={(v) => { setTab(v as any); setSearch(""); }}>
          <TabsList><TabsTrigger value="all">{t("common.all")} ({allCustomers.length})</TabsTrigger><TabsTrigger value="b2c">B2C ({allCustomers.filter((c) => c.type === "b2c").length})</TabsTrigger><TabsTrigger value="b2b">B2B ({allCustomers.filter((c) => c.type === "b2b").length})</TabsTrigger></TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8 h-9"
            placeholder="Search by name, email, phone, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="shrink-0">
          <select
            className="h-9 px-3 border rounded-md bg-background text-sm"
            value={spFilter}
            onChange={(e) => setSpFilter(e.target.value)}
          >
            <option value="all">All Salespersons</option>
            <option value="__unassigned">Unassigned</option>
            {salespersons.map((sp) => (
              <option key={sp.id} value={sp.id}>{sp.name}</option>
            ))}
          </select>
        </div>
        {(search || spFilter !== "all") && (
          <p className="text-xs text-muted-foreground self-center">{list.length} result{list.length !== 1 ? "s" : ""}</p>
        )}
      </div>
      <Card>
        <CardContent className="p-5">
          <Table>
            <TableHeader><TableRow>
              {(["name", "city"] as const).includes(sortKey as any) || true ? (
                <>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("name")}>
                    <span className="flex items-center gap-1">Name {sortKey === "name" ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronUp className="w-3 h-3 opacity-20" />}</span>
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("city")}>
                    <span className="flex items-center gap-1">City {sortKey === "city" ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronUp className="w-3 h-3 opacity-20" />}</span>
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Salesperson</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("totalOrders")}>
                    <span className="flex items-center gap-1">Orders {sortKey === "totalOrders" ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronUp className="w-3 h-3 opacity-20" />}</span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("lifetimeValue")}>
                    <span className="flex items-center gap-1">Lifetime Value {sortKey === "lifetimeValue" ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronUp className="w-3 h-3 opacity-20" />}</span>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </>
              ) : null}
            </TableRow></TableHeader>
            <TableBody>
              {sorted.map((c) => (
                <TableRow key={c.id}>
                  <TableCell><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{c.name[0]}</div><p className="font-medium text-sm">{c.name}</p></div></TableCell>
                  <TableCell className="text-sm">{c.email}</TableCell>
                  <TableCell className="text-xs">{c.phone}</TableCell>
                  <TableCell className="text-sm">{c.city}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{c.type.toUpperCase()}</Badge></TableCell>
                  <TableCell className="text-xs">{c.business?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-xs">
                    {(() => {
                      const sp = salespersons.find((s) => s.id === c.assignedSalespersonId);
                      return sp
                        ? <span className="flex items-center gap-1"><div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">{sp.name[0]}</div>{sp.name}</span>
                        : <span className="text-muted-foreground">—</span>;
                    })()}
                  </TableCell>
                  <TableCell>{c.totalOrders}</TableCell>
                  <TableCell><PriceTag amount={c.lifetimeValue} size="sm" /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setViewCust(c)}><Eye className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => {
                        if (!confirm(`Remove ${c.name}?`)) return;
                        deleteCustomer.mutate(c.id, {
                          onSuccess: () => toast({ title: "Customer removed" }),
                          onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
                        });
                      }}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!viewCust} onOpenChange={() => setViewCust(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{viewCust?.name}</DialogTitle></DialogHeader>
          {viewCust && (
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Email:</span> {viewCust.email}</p>
              <p><span className="text-muted-foreground">Phone:</span> {viewCust.phone}</p>
              <p><span className="text-muted-foreground">City:</span> {viewCust.city}</p>
              <p><span className="text-muted-foreground">Type:</span> <Badge variant="outline" className="text-xs">{viewCust.type.toUpperCase()}</Badge></p>
              {viewCust.business && (
                <>
                  <Separator />
                  <p><span className="text-muted-foreground">Business:</span> {viewCust.business.name}</p>
                  <p><span className="text-muted-foreground">Type:</span> {viewCust.business.type}</p>
                  <p><span className="text-muted-foreground">CR#:</span> {viewCust.business.crNumber}</p>
                  <p><span className="text-muted-foreground">VAT#:</span> {viewCust.business.vatNumber}</p>
                </>
              )}
              <Separator />
              <p><span className="text-muted-foreground">Total Orders:</span> {viewCust.totalOrders}</p>
              <p><span className="text-muted-foreground">Lifetime Value:</span> <PriceTag amount={viewCust.lifetimeValue} size="sm" /></p>
              {viewCust.addresses.map((a) => (
                <div key={a.id} className="p-2 border rounded-md text-xs">
                  <p className="font-semibold">{a.label} {a.isDefault && <Badge variant="secondary" className="text-xs ms-1">Default</Badge>}</p>
                  <p className="text-muted-foreground">{a.fullAddress}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit Customer Dialog ── */}
      <Dialog open={!!editCust} onOpenChange={() => setEditCust(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Customer — {editCust?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Basic Info</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Customer Name</Label><Input value={editData.name} onChange={(e) => setEditData((p) => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Email</Label><Input type="email" value={editData.email} onChange={(e) => setEditData((p) => ({ ...p, email: e.target.value }))} /></div>
            </div>
            <div><Label>Phone Number</Label><Input value={editData.phone} onChange={(e) => setEditData((p) => ({ ...p, phone: e.target.value }))} /></div>
            <Separator />
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Account Info</p>
            <div><Label>Customer Type</Label>
              <div className="flex gap-3 mt-1">
                {(["b2c", "b2b"] as const).map((v) => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value={v} checked={editData.type === v} onChange={() => setEditData((p) => ({ ...p, type: v }))} />
                    <span className="font-medium">{v.toUpperCase()}</span>
                  </label>
                ))}
              </div>
            </div>
            {editData.type === "b2b" && (
              <>
                <Separator />
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">B2B Info</p>
                <div><Label>Business Name</Label><Input value={editData.businessName} onChange={(e) => setEditData((p) => ({ ...p, businessName: e.target.value }))} /></div>
                <div><Label>Business Type</Label>
                  <select className="w-full h-9 px-3 border rounded-md bg-background" value={editData.businessTypeId} onChange={(e) => setEditData((p) => ({ ...p, businessTypeId: e.target.value }))}>
                    <option value="">— Select —</option>
                    {businessTypes.map((bt) => <option key={bt.id} value={bt.id}>{bt.name} ({bt.code})</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editData.allowCredit} onCheckedChange={(v) => setEditData((p) => ({ ...p, allowCredit: v }))} id="edit-credit" />
                  <Label htmlFor="edit-credit">Allow Credit</Label>
                </div>
                {editData.allowCredit && (
                  <div><Label>Credit Limit (SAR)</Label><Input type="number" value={editData.creditLimit} onChange={(e) => setEditData((p) => ({ ...p, creditLimit: e.target.value }))} /></div>
                )}
              </>
            )}
            <Separator />
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Assigned Salesperson</p>
            <div>
              <Label>Salesperson</Label>
              <select
                className="w-full h-9 px-3 border rounded-md bg-background mt-1"
                value={editData.assignedSalespersonId}
                onChange={(e) => setEditData((p) => ({ ...p, assignedSalespersonId: e.target.value }))}
              >
                <option value="">— Unassigned —</option>
                {salespersons.map((sp) => (
                  <option key={sp.id} value={sp.id}>{sp.name}</option>
                ))}
              </select>
            </div>
            <Separator />
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Location</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>City</Label><Input value={editData.city} onChange={(e) => setEditData((p) => ({ ...p, city: e.target.value }))} /></div>
              <div><Label>Address</Label><Input value={editData.address} onChange={(e) => setEditData((p) => ({ ...p, address: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCust(null)}>Cancel</Button>
            <Button onClick={() => {
              if (!editCust || !editData.name) return;
              const bt = businessTypes.find((b) => b.id === editData.businessTypeId);
              const business = editData.type === "b2b" && editData.businessName
                ? {
                    name: editData.businessName,
                    type: bt?.code?.toLowerCase() ?? editCust.business?.type ?? "retailer",
                    crNumber: editCust.business?.crNumber ?? "",
                    vatNumber: editCust.business?.vatNumber ?? "",
                    allowCredit: editData.allowCredit,
                    creditLimit: editData.allowCredit && editData.creditLimit ? Number(editData.creditLimit) : null,
                  }
                : null;
              updateCustomer.mutate({
                id: editCust.id,
                name: editData.name,
                email: editData.email,
                phone: editData.phone,
                city: editData.city,
                type: editData.type,
                business,
                assignedSalespersonId: editData.assignedSalespersonId || null,
              } as any, {
                onSuccess: () => {
                  toast({ title: "Customer updated", description: `${editData.name} saved` });
                  setEditCust(null);
                },
                onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
              });
            }} disabled={updateCustomer.isPending}>{updateCustomer.isPending ? "Saving…" : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Salespersons ──────────────────────────────────────────────────────────────

const BLANK_SP = { name: "", email: "", phone: "", region: "", monthlyTarget: "80000", monthlyNewCustomerTarget: "5", monthlyOrderTarget: "20", status: "active" as "active" | "inactive", joinedDate: "", password: "", categoriesServed: [] as string[], assignedCustomerIds: [] as string[] };

function CustomerMultiSelect({ selected, onChange, customers, businessTypes }: {
  selected: string[];
  onChange: (ids: string[]) => void;
  customers: Customer[];
  businessTypes: BusinessType[];
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || (c.business?.name ?? "").toLowerCase().includes(q) || c.city.toLowerCase().includes(q);
  });
  const selectedCustomers = customers.filter((c) => selected.includes(c.id));
  const getBtName = (c: Customer) => {
    const btId = (c.business as any)?.businessTypeId;
    return btId ? (businessTypes.find((bt) => bt.id === btId)?.name ?? null) : null;
  };
  return (
    <div>
      {selectedCustomers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedCustomers.map((c) => {
            const btName = getBtName(c);
            return (
              <span key={c.id} className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs border border-primary/20">
                {c.business?.name || c.name}{btName ? ` · ${btName}` : ""}
                <button type="button" onClick={() => onChange(selected.filter((id) => id !== c.id))} className="hover:text-rose-600 leading-none"><X className="w-3 h-3" /></button>
              </span>
            );
          })}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-8 h-8 text-sm"
          placeholder="Search B2B customers…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="mt-1 border rounded-md bg-popover shadow-md max-h-40 overflow-y-auto">
          {filtered.map((c) => {
            const checked = selected.includes(c.id);
            const btName = getBtName(c);
            return (
              <button key={c.id} type="button"
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-2 ${checked ? "bg-primary/5" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); onChange(checked ? selected.filter((id) => id !== c.id) : [...selected, c.id]); }}
              >
                <div className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${checked ? "bg-primary border-primary" : "border-border"}`}>
                  {checked && <CheckCircle2 className="w-2.5 h-2.5 text-primary-foreground" />}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-xs truncate">{c.business?.name || c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.name} · {c.city}{btName ? ` · ${btName}` : ""}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SPForm({ data, setData, categories, regions, b2bCustomers, businessTypes }: {
  data: typeof BLANK_SP;
  setData: (fn: (p: typeof BLANK_SP) => typeof BLANK_SP) => void;
  categories: Category[];
  regions: Region[];
  b2bCustomers: Customer[];
  businessTypes: BusinessType[];
}) {
  const { t } = useLanguage();
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Name</Label><Input value={data.name} onChange={(e) => setData((p) => ({ ...p, name: e.target.value }))} /></div>
        <div><Label>Email</Label><Input type="email" value={data.email} onChange={(e) => setData((p) => ({ ...p, email: e.target.value }))} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Phone</Label><Input value={data.phone} onChange={(e) => setData((p) => ({ ...p, phone: e.target.value }))} /></div>
        <div>
          <Label>Region</Label>
          <select
            className="w-full h-9 px-3 border rounded-md bg-background text-sm"
            value={data.region}
            onChange={(e) => setData((p) => ({ ...p, region: e.target.value }))}
          >
            <option value="">— Select region —</option>
            {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      </div>
      <div><Label>Password <span className="text-muted-foreground text-xs">(login account)</span></Label><Input type="password" value={data.password} onChange={(e) => setData((p) => ({ ...p, password: e.target.value }))} placeholder="Min. 8 characters" autoComplete="new-password" /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Monthly Target (SAR)</Label><Input type="number" value={data.monthlyTarget} onChange={(e) => setData((p) => ({ ...p, monthlyTarget: e.target.value }))} /></div>
        <div><Label>New Customers / Month</Label><Input type="number" value={data.monthlyNewCustomerTarget} onChange={(e) => setData((p) => ({ ...p, monthlyNewCustomerTarget: e.target.value }))} /></div>
        <div><Label>Orders / Month Target</Label><Input type="number" value={data.monthlyOrderTarget} onChange={(e) => setData((p) => ({ ...p, monthlyOrderTarget: e.target.value }))} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Status</Label>
          <select className="w-full h-9 px-3 border rounded-md bg-background" value={data.status} onChange={(e) => setData((p) => ({ ...p, status: e.target.value as any }))}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div><Label>Joined Date</Label><Input type="date" value={data.joinedDate} onChange={(e) => setData((p) => ({ ...p, joinedDate: e.target.value }))} /></div>
      </div>
      <div>
        <Label>Assigned B2B Customers</Label>
        <div className="mt-1.5">
          <CustomerMultiSelect
            selected={data.assignedCustomerIds}
            onChange={(ids) => setData((p) => ({ ...p, assignedCustomerIds: ids }))}
            customers={b2bCustomers}
            businessTypes={businessTypes}
          />
        </div>
      </div>
      {categories.length > 0 && (
        <div>
          <Label>Business Categories Served</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {categories.map((cat) => {
              const checked = data.categoriesServed.includes(cat.id);
              return (
                <button key={cat.id} type="button"
                  onClick={() => setData((p) => ({ ...p, categoriesServed: checked ? p.categoriesServed.filter((id) => id !== cat.id) : [...p.categoriesServed, cat.id] }))}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${checked ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border text-muted-foreground hover:border-primary/40"}`}
                >{t(`category.${cat.id}`)}</button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminSalespersonsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { data: salespersons = [], isLoading } = useSalespersons();
  const { data: regions = [] } = useRegions();
  const { data: categories = [] } = useCategories();
  const { data: businessTypes = [] } = useBusinessTypes();
  const { data: b2bCustomers = [] } = useCustomers("b2b");
  const createSP = useCreateSalesperson();
  const updateSP = useUpdateSalesperson();
  const deleteSP = useDeleteSalesperson();
  const createStaff = useCreateStaff();

  const [addOpen, setAddOpen] = useState(false);
  const [newSP, setNewSP] = useState(BLANK_SP);
  const [editSP, setEditSP] = useState<Salesperson | null>(null);
  const [editData, setEditData] = useState(BLANK_SP);

  const openEdit = (s: Salesperson) => {
    setEditSP(s);
    setEditData({ name: s.name, email: s.email, phone: s.phone ?? "", region: s.region ?? "", monthlyTarget: String(s.monthlyTarget), monthlyNewCustomerTarget: String((s as any).monthlyNewCustomerTarget ?? 5), monthlyOrderTarget: String((s as any).monthlyOrderTarget ?? 20), status: s.status, joinedDate: s.joinedDate ? s.joinedDate.slice(0, 10) : "", password: "", categoriesServed: (s as any).categoriesServed ?? [], assignedCustomerIds: (s as any).assignedCustomerIds ?? [] });
  };

  const toPayload = (d: typeof BLANK_SP) => ({
    name: d.name, email: d.email, phone: d.phone, region: d.region,
    monthlyTarget: Number(d.monthlyTarget),
    monthlyNewCustomerTarget: Number(d.monthlyNewCustomerTarget),
    monthlyOrderTarget: Number(d.monthlyOrderTarget),
    status: d.status,
    joinedDate: d.joinedDate || undefined,
    categoriesServed: d.categoriesServed,
    assignedCustomerIds: d.assignedCustomerIds,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("admin.salespersons")}</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 me-1.5" /> Add</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Salesperson</DialogTitle></DialogHeader>
            <SPForm data={newSP} setData={setNewSP} categories={categories} regions={regions} b2bCustomers={b2bCustomers} businessTypes={businessTypes} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                if (!newSP.name || !newSP.email) {
                  toast({ title: "Missing fields", description: "Name and email are required.", variant: "destructive" });
                  return;
                }
                createSP.mutate(toPayload(newSP) as any, {
                  onSuccess: (created: any) => {
                    if (newSP.password) {
                      createStaff.mutate(
                        { name: newSP.name, email: newSP.email, password: newSP.password, role: "sales", salespersonId: created.id },
                        {
                          onSuccess: () => toast({ title: "Salesperson added", description: "Login account created." }),
                          onError: () => toast({ title: "Salesperson added", description: "Could not create login — add manually in Staff Access.", variant: "destructive" }),
                        }
                      );
                    } else {
                      toast({ title: "Salesperson added" });
                    }
                    setAddOpen(false); setNewSP(BLANK_SP);
                  },
                  onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
                });
              }} disabled={createSP.isPending || createStaff.isPending}>{createSP.isPending || createStaff.isPending ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-5">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Customers</TableHead>
                <TableHead>Sales This Month</TableHead>
                <TableHead>Monthly Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {salespersons.map((s) => {
                  const pct = s.monthlyTarget > 0 ? Math.round((s.monthlySales / s.monthlyTarget) * 100) : 0;
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div><p className="font-medium text-sm">{s.name}</p><p className="text-xs text-muted-foreground">{s.phone}</p></div>
                      </TableCell>
                      <TableCell className="text-sm">{s.email}</TableCell>
                      <TableCell className="text-xs">{s.region}</TableCell>
                      <TableCell>{s.customersCount}</TableCell>
                      <TableCell><PriceTag amount={s.monthlySales} size="sm" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${pct >= 100 ? "bg-emerald-500" : pct >= 75 ? "bg-amber-400" : "bg-rose-400"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <span className="text-xs font-semibold">{pct}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">of SAR {s.monthlyTarget.toLocaleString()}</p>
                      </TableCell>
                      <TableCell><Badge variant={s.status === "active" ? "default" : "outline"} className={s.status === "active" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : ""}>{s.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => {
                            if (!confirm(`Remove ${s.name}?`)) return;
                            deleteSP.mutate(s.id, {
                              onSuccess: () => toast({ title: "Removed" }),
                              onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
                            });
                          }}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editSP} onOpenChange={() => setEditSP(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Salesperson</DialogTitle></DialogHeader>
          <SPForm data={editData} setData={setEditData} categories={categories} regions={regions} b2bCustomers={b2bCustomers} businessTypes={businessTypes} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSP(null)}>Cancel</Button>
            <Button onClick={() => {
              if (!editSP) return;
              updateSP.mutate({ id: editSP.id, ...toPayload(editData) } as any, {
                onSuccess: () => { toast({ title: "Updated" }); setEditSP(null); },
                onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
              });
            }} disabled={updateSP.isPending}>{updateSP.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Promotions ────────────────────────────────────────────────────────────────

const BLANK_COUPON = { code: "", enTitle: "", arTitle: "", type: "percent" as const, value: "0", minOrder: "0", audience: "both" as const, maxUses: "", startsAt: "", endsAt: "", isActive: true };

function CouponForm({ data, setData }: { data: typeof BLANK_COUPON; setData: (fn: (p: typeof BLANK_COUPON) => typeof BLANK_COUPON) => void }) {
  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Code</Label><Input value={data.code} onChange={(e) => setData((p) => ({ ...p, code: e.target.value.toUpperCase() }))} className="font-mono uppercase" /></div>
        <div><Label>Type</Label>
          <select className="w-full h-9 px-3 border rounded-md bg-background" value={data.type} onChange={(e) => setData((p) => ({ ...p, type: e.target.value as any }))}>
            <option value="percent">Percent %</option>
            <option value="fixed">Fixed Amount SAR</option>
            <option value="free_delivery">Free Delivery</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Title (EN)</Label><Input value={data.enTitle} onChange={(e) => setData((p) => ({ ...p, enTitle: e.target.value }))} /></div>
        <div><Label>Title (AR)</Label><Input value={data.arTitle} onChange={(e) => setData((p) => ({ ...p, arTitle: e.target.value }))} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>{data.type === "percent" ? "Value %" : "Value SAR"}</Label><Input type="number" value={data.value} onChange={(e) => setData((p) => ({ ...p, value: e.target.value }))} /></div>
        <div><Label>Min Order SAR</Label><Input type="number" value={data.minOrder} onChange={(e) => setData((p) => ({ ...p, minOrder: e.target.value }))} /></div>
        <div><Label>Max Uses</Label><Input type="number" value={data.maxUses} placeholder="∞" onChange={(e) => setData((p) => ({ ...p, maxUses: e.target.value }))} /></div>
      </div>
      <div><Label>Audience</Label>
        <select className="w-full h-9 px-3 border rounded-md bg-background" value={data.audience} onChange={(e) => setData((p) => ({ ...p, audience: e.target.value as any }))}>
          <option value="both">All</option>
          <option value="b2c">B2C only</option>
          <option value="b2b">B2B only</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Starts</Label><Input type="date" value={data.startsAt} onChange={(e) => setData((p) => ({ ...p, startsAt: e.target.value }))} /></div>
        <div><Label>Ends</Label><Input type="date" value={data.endsAt} onChange={(e) => setData((p) => ({ ...p, endsAt: e.target.value }))} /></div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={data.isActive} onCheckedChange={(v) => setData((p) => ({ ...p, isActive: v }))} />
        <Label>Active</Label>
      </div>
    </div>
  );
}

export function AdminPromotionsPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { data: coupons = [], isLoading } = useCoupons();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();
  const [addOpen, setAddOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState(BLANK_COUPON);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [editData, setEditData] = useState(BLANK_COUPON);

  const openEdit = (c: Coupon) => {
    setEditCoupon(c);
    setEditData({ code: c.code, enTitle: c.enTitle ?? "", arTitle: c.arTitle ?? "", type: c.type as any, value: String(c.value), minOrder: String(c.minOrder), audience: c.audience as any, maxUses: c.maxUses != null ? String(c.maxUses) : "", startsAt: c.startsAt ? c.startsAt.slice(0, 10) : "", endsAt: c.endsAt ? c.endsAt.slice(0, 10) : "", isActive: c.isActive });
  };

  const toPayload = (d: typeof BLANK_COUPON) => ({
    code: d.code, enTitle: d.enTitle || null, arTitle: d.arTitle || null, type: d.type,
    value: Number(d.value), minOrder: Number(d.minOrder), audience: d.audience,
    maxUses: d.maxUses ? Number(d.maxUses) : null, startsAt: d.startsAt || null,
    endsAt: d.endsAt || null, isActive: d.isActive,
  });

  const typeLabel = (c: Coupon) => c.type === "percent" ? `${c.value}%` : c.type === "fixed" ? `SAR ${c.value}` : "Free delivery";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("admin.promotions")}</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 me-1.5" /> {t("admin.add_promotion")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Promotion</DialogTitle></DialogHeader>
            <CouponForm data={newCoupon} setData={setNewCoupon} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                createCoupon.mutate(toPayload(newCoupon) as any, {
                  onSuccess: () => { toast({ title: "Coupon created" }); setAddOpen(false); setNewCoupon(BLANK_COUPON); },
                  onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
                });
              }} disabled={createCoupon.isPending}>{createCoupon.isPending ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-5">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Min Order</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {coupons.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-bold text-sm">{c.code}</TableCell>
                    <TableCell className="text-sm">{language === "ar" ? c.arTitle : c.enTitle}</TableCell>
                    <TableCell><Badge variant="secondary">{typeLabel(c)}</Badge></TableCell>
                    <TableCell className="text-xs capitalize">{c.audience}</TableCell>
                    <TableCell className="text-xs">{c.minOrder > 0 ? <PriceTag amount={c.minOrder} size="sm" /> : "—"}</TableCell>
                    <TableCell className="text-xs">{c.usesCount}{c.maxUses != null ? `/${c.maxUses}` : ""}</TableCell>
                    <TableCell className="text-xs">{c.endsAt ? new Date(c.endsAt).toLocaleDateString() : "—"}</TableCell>
                    <TableCell><Badge variant={c.isActive ? "default" : "outline"} className={c.isActive ? "bg-emerald-100 text-emerald-700 border-emerald-200" : ""}>{c.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => deleteCoupon.mutate(c.id, { onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }) })}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editCoupon} onOpenChange={() => setEditCoupon(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Coupon</DialogTitle></DialogHeader>
          <CouponForm data={editData} setData={setEditData} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCoupon(null)}>Cancel</Button>
            <Button onClick={() => {
              if (!editCoupon) return;
              updateCoupon.mutate({ id: editCoupon.id, ...toPayload(editData) } as any, {
                onSuccess: () => { toast({ title: "Coupon updated" }); setEditCoupon(null); },
                onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
              });
            }} disabled={updateCoupon.isPending}>{updateCoupon.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Brands ────────────────────────────────────────────────────────────────────

export function AdminBrandsPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { data: brands = [] } = useBrands();
  const { data: products = [] } = useProducts();
  const createBrand = useCreateBrand();
  const deleteBrand = useDeleteBrand();
  const updateBrand = useUpdateBrand();
  const [addOpen, setAddOpen] = useState(false);
  const [newBrand, setNewBrand] = useState({ name: "", enTagline: "", arTagline: "", logo: "", accent: "#5c3d14" });
  const [editBrand, setEditBrand] = useState<(typeof brands)[0] | null>(null);
  const [editBrandData, setEditBrandData] = useState({ name: "", enTagline: "", arTagline: "", logo: "", accent: "#333333" });

  const handleDelete = (id: string) => {
    deleteBrand.mutate(id, {
      onSuccess: () => toast({ title: "Brand removed" }),
      onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("admin.brands")}</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 me-1.5" /> {t("common.add")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Brand</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={newBrand.name} onChange={(e) => setNewBrand((p) => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Tagline (EN)</Label><Input value={newBrand.enTagline} onChange={(e) => setNewBrand((p) => ({ ...p, enTagline: e.target.value }))} /></div>
              <div><Label>Tagline (AR)</Label><Input value={newBrand.arTagline} onChange={(e) => setNewBrand((p) => ({ ...p, arTagline: e.target.value }))} /></div>
              <ImageUploadField value={newBrand.logo} onChange={(v) => setNewBrand((p) => ({ ...p, logo: v }))} label="Brand Logo" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                if (!newBrand.name) return;
                createBrand.mutate(newBrand as any, {
                  onSuccess: () => { toast({ title: "Brand added" }); setAddOpen(false); setNewBrand({ name: "", enTagline: "", arTagline: "", logo: "", accent: "#5c3d14" }); },
                  onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
                });
              }} disabled={createBrand.isPending}>{createBrand.isPending ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {brands.map((b) => (
          <Card key={b.id}>
            <CardContent className="p-5 text-center space-y-3">
              <div className="w-20 h-20 mx-auto rounded-md flex items-center justify-center bg-white border border-border/60 shadow-sm p-2">
                {b.logo ? <img src={b.logo} alt={b.name} className="max-w-full max-h-full object-contain" /> : <div className="w-10 h-10 rounded-full" style={{ background: b.accent }} />}
              </div>
              <h3 className="font-bold">{b.name}</h3>
              <p className="text-xs text-muted-foreground">{language === "ar" ? b.arTagline : b.enTagline}</p>
              <p className="text-xs text-muted-foreground">{products.filter((p) => p.brandId === b.id).length} products</p>
              <div className="flex justify-center gap-1 pt-1">
                <Button variant="ghost" size="sm" onClick={() => { setEditBrand(b); setEditBrandData({ name: b.name, enTagline: b.enTagline || "", arTagline: b.arTagline || "", logo: b.logo || "", accent: b.accent || "#333333" }); }}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => handleDelete(b.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editBrand} onOpenChange={() => setEditBrand(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Brand</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={editBrandData.name} onChange={(e) => setEditBrandData((p) => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Tagline (EN)</Label><Input value={editBrandData.enTagline} onChange={(e) => setEditBrandData((p) => ({ ...p, enTagline: e.target.value }))} /></div>
            <div><Label>Tagline (AR)</Label><Input value={editBrandData.arTagline} onChange={(e) => setEditBrandData((p) => ({ ...p, arTagline: e.target.value }))} /></div>
            <ImageUploadField value={editBrandData.logo} onChange={(v) => setEditBrandData((p) => ({ ...p, logo: v }))} label="Brand Logo" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBrand(null)}>Cancel</Button>
            <Button onClick={() => {
              if (!editBrand) return;
              updateBrand.mutate({ id: editBrand.id, name: editBrandData.name, enTagline: editBrandData.enTagline, arTagline: editBrandData.arTagline, logo: editBrandData.logo, accent: editBrandData.accent } as any, {
                onSuccess: () => { toast({ title: "Brand updated" }); setEditBrand(null); },
                onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
              });
            }} disabled={updateBrand.isPending}>{updateBrand.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Business Types ─────────────────────────────────────────────────────────────

const BLANK_BT = { name: "", code: "", description: "", defaultDiscount: "0", minOrderValue: "0", creditAllowed: false, creditLimit: "", status: "active" as "active" | "inactive" };

function BTForm({ data, setData }: { data: typeof BLANK_BT; setData: (fn: (p: typeof BLANK_BT) => typeof BLANK_BT) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Business Type Name</Label><Input value={data.name} onChange={(e) => setData((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Restaurant" /></div>
        <div><Label>Code</Label><Input value={data.code} onChange={(e) => setData((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. REST" className="font-mono uppercase" /></div>
      </div>
      <div><Label>Description</Label><Input value={data.description} onChange={(e) => setData((p) => ({ ...p, description: e.target.value }))} placeholder="Short explanation…" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Default Discount %</Label><Input type="number" min="0" max="100" value={data.defaultDiscount} onChange={(e) => setData((p) => ({ ...p, defaultDiscount: e.target.value }))} /></div>
        <div><Label>Minimum Order Value (SAR)</Label><Input type="number" value={data.minOrderValue} onChange={(e) => setData((p) => ({ ...p, minOrderValue: e.target.value }))} /></div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={data.creditAllowed} onCheckedChange={(v) => setData((p) => ({ ...p, creditAllowed: v }))} id="bt-credit" />
        <Label htmlFor="bt-credit">Credit Allowed</Label>
      </div>
      {data.creditAllowed && <div><Label>Credit Limit (SAR)</Label><Input type="number" value={data.creditLimit} onChange={(e) => setData((p) => ({ ...p, creditLimit: e.target.value }))} /></div>}
      <div><Label>Status</Label>
        <select className="w-full h-9 px-3 border rounded-md bg-background" value={data.status} onChange={(e) => setData((p) => ({ ...p, status: e.target.value as any }))}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>
  );
}

export function AdminBusinessTypesPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { data: businessTypes = [], isLoading } = useBusinessTypes();
  const createBT = useCreateBusinessType();
  const updateBT = useUpdateBusinessType();
  const deleteBT = useDeleteBusinessType();
  const [addOpen, setAddOpen] = useState(false);
  const [newBT, setNewBT] = useState(BLANK_BT);
  const [editBT, setEditBT] = useState<BusinessType | null>(null);
  const [editData, setEditData] = useState(BLANK_BT);

  const openEdit = (bt: BusinessType) => {
    setEditBT(bt);
    setEditData({ name: bt.name, code: bt.code, description: bt.description ?? "", defaultDiscount: String(bt.defaultDiscount), minOrderValue: String(bt.minOrderValue), creditAllowed: bt.creditAllowed, creditLimit: bt.creditLimit != null ? String(bt.creditLimit) : "", status: bt.status });
  };

  const toPayload = (d: typeof BLANK_BT) => ({
    name: d.name, code: d.code, description: d.description || null,
    defaultDiscount: Number(d.defaultDiscount), minOrderValue: Number(d.minOrderValue),
    creditAllowed: d.creditAllowed, creditLimit: d.creditAllowed && d.creditLimit ? Number(d.creditLimit) : null,
    status: d.status,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Business Types</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 me-1.5" /> Add Type</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Business Type</DialogTitle></DialogHeader>
            <BTForm data={newBT} setData={setNewBT} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                createBT.mutate(toPayload(newBT) as any, {
                  onSuccess: () => { toast({ title: "Business type added" }); setAddOpen(false); setNewBT(BLANK_BT); },
                  onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
                });
              }} disabled={createBT.isPending}>{createBT.isPending ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-5">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Min Order</TableHead>
                <TableHead>Credit</TableHead>
                <TableHead>Credit Limit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {businessTypes.map((bt) => (
                  <TableRow key={bt.id}>
                    <TableCell className="font-semibold">{bt.name}</TableCell>
                    <TableCell><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{bt.code}</code></TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">{bt.description ?? "—"}</TableCell>
                    <TableCell>{bt.defaultDiscount > 0 ? <Badge variant="secondary">{bt.defaultDiscount}%</Badge> : "—"}</TableCell>
                    <TableCell className="text-sm">{bt.minOrderValue > 0 ? <PriceTag amount={bt.minOrderValue} size="sm" /> : "—"}</TableCell>
                    <TableCell><Badge variant={bt.creditAllowed ? "default" : "outline"} className={bt.creditAllowed ? "bg-emerald-100 text-emerald-700 border-emerald-200" : ""}>{bt.creditAllowed ? "Yes" : "No"}</Badge></TableCell>
                    <TableCell className="text-sm">{bt.creditLimit != null ? <PriceTag amount={bt.creditLimit} size="sm" /> : "—"}</TableCell>
                    <TableCell><Badge variant={bt.status === "active" ? "default" : "outline"} className={bt.status === "active" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : ""}>{bt.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(bt)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => {
                          if (!confirm(`Remove "${bt.name}"?`)) return;
                          deleteBT.mutate(bt.id, {
                            onSuccess: () => toast({ title: "Removed" }),
                            onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
                          });
                        }}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editBT} onOpenChange={() => setEditBT(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Business Type</DialogTitle></DialogHeader>
          <BTForm data={editData} setData={setEditData} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBT(null)}>Cancel</Button>
            <Button onClick={() => {
              if (!editBT) return;
              updateBT.mutate({ id: editBT.id, ...toPayload(editData) } as any, {
                onSuccess: () => { toast({ title: "Updated" }); setEditBT(null); },
                onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
              });
            }} disabled={updateBT.isPending}>{updateBT.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Reports ───────────────────────────────────────────────────────────────────

export function AdminReportsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { data: products = [] } = useProducts();
  const { data: orders = [] } = useOrders();
  const { data: customers = [] } = useCustomers();
  const { data: salespersons = [] } = useSalespersons();

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlySales = useMemo(() => MONTHS.map((month, i) => {
    const monthOrders = orders.filter((o) => new Date(o.placedAt).getMonth() === i);
    const b2c = monthOrders.filter((o) => o.customerType === "b2c").reduce((s, o) => s + o.total, 0);
    const b2b = monthOrders.filter((o) => o.customerType === "b2b").reduce((s, o) => s + o.total, 0);
    return { month, b2c, b2b };
  }), [orders]);

  const topProducts = useMemo(() => [...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 6).map((p) => ({ name: p.enName.substring(0, 18), sales: p.reviewCount * 12 })), [products]);

  const b2cCount = customers.filter((c) => c.type === "b2c").length;
  const b2bCount = customers.filter((c) => c.type === "b2b").length;
  const customerSplit = [{ name: "B2C", value: b2cCount || 1 }, { name: "B2B", value: b2bCount || 1 }];
  const spPerf = salespersons.map((s) => ({ name: s.name.split(" ")[0], sales: s.monthlySales, target: s.monthlyTarget }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("admin.reports")}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast({ title: t("common.export_csv"), description: "Coming soon" })}><Download className="w-4 h-4 me-1.5" /> {t("common.export_csv")}</Button>
          <Button variant="outline" onClick={() => toast({ title: t("common.export_pdf"), description: "Coming soon" })}><FileText className="w-4 h-4 me-1.5" /> {t("common.export_pdf")}</Button>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <h2 className="font-bold mb-4">{t("admin.report.sales")}</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="b2c" fill={SECONDARY} name="B2C" />
                  <Bar dataKey="b2b" fill={PRIMARY} name="B2B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h2 className="font-bold mb-4">{t("admin.report.top_products")}</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="sales" fill={PRIMARY} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h2 className="font-bold mb-4">B2C vs B2B Revenue</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={customerSplit} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} label>
                    <Cell fill={SECONDARY} /><Cell fill={PRIMARY} />
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h2 className="font-bold mb-4">Salesperson Performance (Target vs Achieved)</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spPerf}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill={PRIMARY} name="Sales" />
                  <Bar dataKey="target" fill={SECONDARY} name="Target" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Settings ──────────────────────────────────────────────────────────────────

export function AdminSettingsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [pwForm, setPwForm] = useState({ email: "", currentPassword: "", newPassword: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!pwForm.email || !pwForm.currentPassword || !pwForm.newPassword) {
      toast({ title: "All fields required", variant: "destructive" }); return;
    }
    if (pwForm.newPassword !== pwForm.confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" }); return;
    }
    if (pwForm.newPassword.length < 8) {
      toast({ title: "New password must be at least 8 characters", variant: "destructive" }); return;
    }
    setPwLoading(true);
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pwForm.email, currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      toast({ title: "Password updated successfully" });
      setPwForm({ email: "", currentPassword: "", newPassword: "", confirm: "" });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-3xl font-bold">{t("admin.settings")}</h1>
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-semibold">{t("admin.settings.store")}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>{t("brand.name")}</Label><Input defaultValue="Venture Supply" /></div>
            <div><Label>{t("common.email")}</Label><Input defaultValue="info@venturesupply.sa" /></div>
            <div><Label>{t("common.phone")}</Label><Input defaultValue="+966 14 826 9000" /></div>
            <div><Label>{t("common.address")}</Label><Input defaultValue={t("footer.address")} /></div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-semibold">{t("admin.settings.vat")}</h2>
          <div className="max-w-xs"><Label>{t("admin.settings.vat")}</Label><Input defaultValue="15" type="number" /></div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-semibold">{t("admin.settings.delivery")}</h2>
          <Table>
            <TableHeader><TableRow><TableHead>Zone</TableHead><TableHead>Charge</TableHead><TableHead>Free above</TableHead></TableRow></TableHeader>
            <TableBody>
              {[{ z: "Riyadh", c: 25, f: 200 }, { z: "Jeddah", c: 30, f: 250 }, { z: "Madinah", c: 25, f: 200 }, { z: "Dammam", c: 30, f: 250 }, { z: "Other", c: 50, f: 400 }].map((d) => (
                <TableRow key={d.z}><TableCell>{d.z}</TableCell><TableCell><PriceTag amount={d.c} size="sm" /></TableCell><TableCell><PriceTag amount={d.f} size="sm" /></TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5 space-y-3">
          <h2 className="font-semibold">{t("admin.settings.payments")}</h2>
          {["Cash on Delivery", "Card", "Bank Transfer", "Credit (B2B Net 30)"].map((p) => (
            <div key={p} className="flex items-center justify-between p-3 border rounded-md">
              <span className="font-medium text-sm">{p}</span>
              <Switch defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>
      <Button onClick={() => toast({ title: t("common.save"), description: "Coming soon" })} className="bg-primary hover:bg-primary/90">{t("common.save")}</Button>
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-semibold">Change Account Password</h2>
          <p className="text-sm text-muted-foreground">Enter your email and current password to set a new one.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><Label>Email</Label><Input type="email" placeholder="Your login email" value={pwForm.email} onChange={(e) => setPwForm((p) => ({ ...p, email: e.target.value }))} /></div>
            <div><Label>Current Password</Label><Input type="password" placeholder="••••••••" value={pwForm.currentPassword} onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))} /></div>
            <div></div>
            <div><Label>New Password</Label><Input type="password" placeholder="Min. 8 characters" value={pwForm.newPassword} onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))} /></div>
            <div><Label>Confirm New Password</Label><Input type="password" placeholder="Repeat new password" value={pwForm.confirm} onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))} /></div>
          </div>
          <Button onClick={handleChangePassword} disabled={pwLoading} className="bg-primary hover:bg-primary/90">{pwLoading ? "Saving…" : "Update Password"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
