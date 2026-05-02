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
import { Plus, Trash2, ShoppingBag, Users as UsersIcon, AlertTriangle, TrendingUp, Wallet, Eye, Pencil, Search, Download, FileText } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/useCategories";
import { useBrands } from "@/hooks/useBrands";
import { useProducts } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useCustomers";
import { useOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import { useDashboard } from "@/hooks/useDashboard";
import {
  useCreateProduct, useDeleteProduct, useUpdateProduct,
  useCreateCategory, useDeleteCategory, useUpdateCategory,
  useCreateBrand, useDeleteBrand, useUpdateBrand,
} from "@/hooks/useMutations";
import { useCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon, type Coupon } from "@/hooks/useCoupons";
import { ORDER_STATUSES, type Order, type OrderStatus } from "@/data/orders";
import { useSalespersons, useCreateSalesperson, useUpdateSalesperson, useDeleteSalesperson, type Salesperson } from "@/hooks/useSalespersons";
import { StatusBadge } from "@/components/StatusBadge";
import { PriceTag } from "@/components/PriceTag";

const PRIMARY = "hsl(25, 47%, 24%)";
const SECONDARY = "hsl(42, 82%, 50%)";

export function AdminDashboardPage() {
  const { t, language } = useLanguage();
  const { data: stats } = useDashboard();
  const { data: products = [] } = useProducts();
  const { data: orders = [] } = useOrders();

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = stats?.ordersToday ?? orders.filter((o) => o.placedAt.slice(0, 10) === todayStr).length;
  const revenueToday = stats?.revenueToday ?? orders.filter((o) => o.placedAt.slice(0, 10) === todayStr).reduce((s, o) => s + o.total, 0);
  const newCustomers = stats?.newCustomers ?? 0;
  const pendingOrders = stats?.pendingOrders ?? orders.filter((o) => ["new", "confirmed", "preparing", "packed"].includes(o.status)).length;
  const lowStock = stats?.lowStock ?? products.filter((p) => p.stockStatus === "low-stock").length;

  const now = new Date();
  const revenueData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now.getTime() - (29 - i) * 86_400_000);
    const dayStr = d.toISOString().slice(0, 10);
    const dayRevenue = orders.filter((o) => o.placedAt.slice(0, 10) === dayStr).reduce((s, o) => s + o.total, 0);
    return { day: `${d.getMonth() + 1}/${d.getDate()}`, revenue: dayRevenue };
  });

  const statusData = ORDER_STATUSES.slice(0, 6).map((s) => ({
    name: t(`status.${s}`),
    value: orders.filter((o) => o.status === s).length || 1,
  }));

  const COLORS = [PRIMARY, SECONDARY, "hsl(155 40% 30%)", "hsl(0 65% 45%)", "hsl(220 50% 45%)", "hsl(280 40% 45%)"];
  const topProducts = [...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("admin.dashboard")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("common.today")} · {new Date().toLocaleDateString(language === "ar" ? "ar-SA" : "en-GB")}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard icon={ShoppingBag} label={t("admin.kpi.orders_today")} value={String(todayOrders)} accent="bg-blue-100 text-blue-700" />
        <KpiCard icon={Wallet} label={t("admin.kpi.revenue_today")} value={<PriceTag amount={revenueToday} size="md" />} accent="bg-emerald-100 text-emerald-700" />
        <KpiCard icon={UsersIcon} label={t("admin.kpi.new_customers")} value={String(newCustomers)} accent="bg-violet-100 text-violet-700" />
        <KpiCard icon={TrendingUp} label={t("admin.kpi.pending_orders")} value={String(pendingOrders)} accent="bg-amber-100 text-amber-700" />
        <KpiCard icon={AlertTriangle} label={t("admin.kpi.low_stock")} value={String(lowStock)} accent="bg-rose-100 text-rose-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <h2 className="font-bold mb-4">{t("admin.chart.revenue")}</h2>
            <div className="h-72">
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
            <h2 className="font-bold mb-4">{t("admin.chart.orders_by_status")}</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => e.name}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

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
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-md ${accent} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xl font-bold leading-tight truncate">{value}</div>
          <div className="text-xs text-muted-foreground truncate">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

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

  const handleDelete = (id: string) => {
    deleteCategory.mutate(id, {
      onSuccess: () => toast({ title: t("common.delete"), description: "Category removed" }),
      onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("admin.categories")}</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 me-1.5" />{t("admin.add_category")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("admin.add_category")}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>{t("common.name")} (EN)</Label><Input value={newCat.enName} onChange={(e) => setNewCat((p) => ({ ...p, enName: e.target.value }))} /></div>
              <div><Label>{t("common.image")} URL</Label><Input value={newCat.image} onChange={(e) => setNewCat((p) => ({ ...p, image: e.target.value }))} placeholder="https://..." /></div>
            </div>
            <DialogFooter><Button onClick={handleCreate} disabled={createCategory.isPending}>{createCategory.isPending ? "Saving…" : t("common.create")}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-5">
          <Table>
            <TableHeader><TableRow><TableHead>{t("common.image")}</TableHead><TableHead>{t("common.name")}</TableHead><TableHead>{t("admin.product_count")}</TableHead><TableHead className="text-end">{t("common.actions")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell><img src={c.image} alt={t(`category.${c.id}`)} className="w-12 h-12 rounded object-cover" /></TableCell>
                  <TableCell className="font-medium">{t(`category.${c.id}`)}</TableCell>
                  <TableCell><Badge variant="secondary">{c.productCount}</Badge></TableCell>
                  <TableCell className="text-end space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditCat(c); setEditCatImage(c.image || ""); }}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => handleDelete(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editCat} onOpenChange={() => setEditCat(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{language === "ar" ? "تعديل الفئة" : "Edit Category"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{t("common.image")} URL</Label><Input value={editCatImage} onChange={(e) => setEditCatImage(e.target.value)} placeholder="https://..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCat(null)}>{language === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => {
              if (!editCat) return;
              updateCategory.mutate({ id: editCat.id, image: editCatImage }, {
                onSuccess: () => { toast({ title: language === "ar" ? "تم التحديث" : "Updated" }); setEditCat(null); },
                onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
              });
            }} disabled={updateCategory.isPending}>{updateCategory.isPending ? "Saving…" : t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();
  const [newProd, setNewProd] = useState({ enName: "", arName: "", sku: "", b2cPrice: "", b2bPrice: "", categoryId: "", brandId: "", image: "", stockQty: "100" });
  const [editProd, setEditProd] = useState<(typeof products)[0] | null>(null);
  const [editProdData, setEditProdData] = useState({ enName: "", arName: "", b2cPrice: "", b2bPrice: "", image: "", stockQty: "", stockStatus: "in-stock", featured: false });

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
        setNewProd({ enName: "", arName: "", sku: "", b2cPrice: "", b2bPrice: "", categoryId: "", brandId: "", image: "", stockQty: "100" });
      },
      onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
    });
  };

  const handleDelete = (id: string) => {
    deleteProduct.mutate(id, {
      onSuccess: () => toast({ title: t("common.delete"), description: "Product removed" }),
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
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t("common.name")} (EN)</Label><Input value={newProd.enName} onChange={(e) => setNewProd((p) => ({ ...p, enName: e.target.value }))} /></div>
                <div><Label>{t("common.name")} (AR)</Label><Input value={newProd.arName} onChange={(e) => setNewProd((p) => ({ ...p, arName: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t("admin.b2c_price")}</Label><Input type="number" value={newProd.b2cPrice} onChange={(e) => setNewProd((p) => ({ ...p, b2cPrice: e.target.value }))} /></div>
                <div><Label>{t("admin.b2b_price")}</Label><Input type="number" value={newProd.b2bPrice} onChange={(e) => setNewProd((p) => ({ ...p, b2bPrice: e.target.value }))} /></div>
              </div>
              <div><Label>SKU</Label><Input value={newProd.sku} onChange={(e) => setNewProd((p) => ({ ...p, sku: e.target.value }))} /></div>
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
              <div><Label>{t("common.image")} URL</Label><Input value={newProd.image} onChange={(e) => setNewProd((p) => ({ ...p, image: e.target.value }))} placeholder="https://..." /></div>
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
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="SKU or name" className="ps-10" data-testid="input-admin-product-search" />
            </div>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")} {t("product.category").toLowerCase()}</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{t(`category.${c.id}`)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")} {t("product.brand").toLowerCase()}</SelectItem>
                {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>{t("product.sku")}</TableHead><TableHead>{t("common.name")}</TableHead><TableHead>{t("product.category")}</TableHead><TableHead>{t("admin.b2c_price")}</TableHead><TableHead>{t("admin.b2b_price")}</TableHead><TableHead>{t("common.status")}</TableHead><TableHead className="text-end">{t("common.actions")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.slice(0, 30).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                  <TableCell><div className="flex items-center gap-2"><img src={p.image} alt={p.enName} className="w-8 h-8 rounded object-cover" /><span className="font-medium text-sm">{language === "ar" ? p.arName : p.enName}</span></div></TableCell>
                  <TableCell className="text-xs">{t(`category.${p.categoryId}`)}</TableCell>
                  <TableCell>{p.b2cPrice > 0 ? <PriceTag amount={p.b2cPrice} size="sm" /> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                  <TableCell>{p.b2bPrice > 0 ? <PriceTag amount={p.b2bPrice} size="sm" /> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                  <TableCell><Badge variant={p.stockStatus === "in-stock" ? "default" : p.stockStatus === "low-stock" ? "secondary" : "destructive"}>{t(`product.${p.stockStatus.replace("-", "_")}`)}</Badge></TableCell>
                  <TableCell className="text-end space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditProd(p); setEditProdData({ enName: p.enName, arName: p.arName, b2cPrice: String(p.b2cPrice), b2bPrice: String(p.b2bPrice), image: p.image || "", stockQty: String(p.stockQty), stockStatus: p.stockStatus, featured: p.featured ?? false }); }}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => handleDelete(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t("common.name")} (EN)</Label><Input value={editProdData.enName} onChange={(e) => setEditProdData((p) => ({ ...p, enName: e.target.value }))} /></div>
              <div><Label>{t("common.name")} (AR)</Label><Input value={editProdData.arName} onChange={(e) => setEditProdData((p) => ({ ...p, arName: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t("admin.b2c_price")}</Label><Input type="number" value={editProdData.b2cPrice} onChange={(e) => setEditProdData((p) => ({ ...p, b2cPrice: e.target.value }))} /></div>
              <div><Label>{t("admin.b2b_price")}</Label><Input type="number" value={editProdData.b2bPrice} onChange={(e) => setEditProdData((p) => ({ ...p, b2bPrice: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{language === "ar" ? "الكمية" : "Stock Qty"}</Label><Input type="number" value={editProdData.stockQty} onChange={(e) => setEditProdData((p) => ({ ...p, stockQty: e.target.value }))} /></div>
              <div><Label>{t("common.status")}</Label>
                <select className="w-full h-9 px-3 border rounded-md bg-background" value={editProdData.stockStatus} onChange={(e) => setEditProdData((p) => ({ ...p, stockStatus: e.target.value }))}>
                  <option value="in-stock">In Stock</option>
                  <option value="low-stock">Low Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>
              </div>
            </div>
            <div><Label>{t("common.image")} URL</Label><Input value={editProdData.image} onChange={(e) => setEditProdData((p) => ({ ...p, image: e.target.value }))} placeholder="https://..." /></div>
            <div className="flex items-center gap-2">
              <Switch checked={editProdData.featured} onCheckedChange={(v) => setEditProdData((p) => ({ ...p, featured: v }))} id="edit-featured" />
              <Label htmlFor="edit-featured">{language === "ar" ? "مميز" : "Featured"}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProd(null)}>{language === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => {
              if (!editProd) return;
              updateProduct.mutate({ id: editProd.id, enName: editProdData.enName, arName: editProdData.arName, b2cPrice: Number(editProdData.b2cPrice), b2bPrice: Number(editProdData.b2bPrice), image: editProdData.image, stockQty: Number(editProdData.stockQty), stockStatus: editProdData.stockStatus as any, featured: editProdData.featured }, {
                onSuccess: () => { toast({ title: language === "ar" ? "تم التحديث" : "Product updated" }); setEditProd(null); },
                onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
              });
            }} disabled={updateProduct.isPending}>{updateProduct.isPending ? "Saving…" : t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AdminInventoryPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { data: products = [] } = useProducts();
  const updateProduct = useUpdateProduct();
  const [adjustProd, setAdjustProd] = useState<(typeof products)[0] | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustStatus, setAdjustStatus] = useState("in-stock");

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">{t("admin.inventory")}</h1>
      <Card>
        <CardContent className="p-5">
          <Table>
            <TableHeader><TableRow><TableHead>{t("product.sku")}</TableHead><TableHead>{t("common.name")}</TableHead><TableHead>{language === "ar" ? "الكمية" : "Qty"}</TableHead><TableHead>{t("common.status")}</TableHead><TableHead className="text-end">{t("admin.adjust_stock")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {products.slice(0, 25).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                  <TableCell className="font-medium text-sm">{language === "ar" ? p.arName : p.enName}</TableCell>
                  <TableCell><span className={`font-bold ${p.stockStatus === "low-stock" ? "text-amber-700" : p.stockStatus === "out-of-stock" ? "text-rose-700" : "text-emerald-700"}`}>{p.stockQty ?? "—"}</span></TableCell>
                  <TableCell><Badge variant={p.stockStatus === "in-stock" ? "default" : p.stockStatus === "low-stock" ? "secondary" : "destructive"}>{t(`product.${p.stockStatus.replace("-", "_")}`)}</Badge></TableCell>
                  <TableCell className="text-end"><Button size="sm" variant="outline" onClick={() => { setAdjustProd(p); setAdjustQty(String(p.stockQty ?? 0)); setAdjustStatus(p.stockStatus); }}>{t("admin.adjust_stock")}</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!adjustProd} onOpenChange={() => setAdjustProd(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{language === "ar" ? "تعديل المخزون" : "Adjust Stock"} — {adjustProd ? (language === "ar" ? adjustProd.arName : adjustProd.enName) : ""}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{language === "ar" ? "الكمية الجديدة" : "New Quantity"}</Label><Input type="number" min="0" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} /></div>
            <div><Label>{t("common.status")}</Label>
              <select className="w-full h-9 px-3 border rounded-md bg-background" value={adjustStatus} onChange={(e) => setAdjustStatus(e.target.value)}>
                <option value="in-stock">{language === "ar" ? "متوفر" : "In Stock"}</option>
                <option value="low-stock">{language === "ar" ? "مخزون منخفض" : "Low Stock"}</option>
                <option value="out-of-stock">{language === "ar" ? "غير متوفر" : "Out of Stock"}</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustProd(null)}>{language === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => {
              if (!adjustProd) return;
              updateProduct.mutate({ id: adjustProd.id, stockQty: Number(adjustQty), stockStatus: adjustStatus as any }, {
                onSuccess: () => { toast({ title: language === "ar" ? "تم تحديث المخزون" : "Stock updated" }); setAdjustProd(null); },
                onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
              });
            }} disabled={updateProduct.isPending}>{updateProduct.isPending ? "Saving…" : t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AdminOrdersPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const { data: allOrders = [] } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const filtered = statusFilter === "all" ? allOrders : allOrders.filter((o) => o.status === statusFilter);
  const [selected, setSelected] = useState<Order | null>(null);

  const handleStatusChange = (newStatus: string) => {
    if (!selected) return;
    const history = [...(selected.history ?? []), { status: newStatus as OrderStatus, at: new Date().toISOString() }];
    updateStatus.mutate({ id: selected.id, status: newStatus as OrderStatus, history }, {
      onSuccess: (updated: any) => {
        setSelected({ ...selected, status: newStatus as OrderStatus, history });
        toast({ title: t("admin.update_status"), description: t(`status.${newStatus}`) });
      },
      onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold">{t("admin.orders")}</h1>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => toast({ title: t("common.export_csv"), description: "Coming soon" })}><Download className="w-4 h-4 me-1.5" /> {t("common.export_csv")}</Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-5">
          <Table>
            <TableHeader><TableRow><TableHead>{t("order.tracking_id")}</TableHead><TableHead>{language === "ar" ? "العميل" : "Customer"}</TableHead><TableHead>{language === "ar" ? "النوع" : "Type"}</TableHead><TableHead>{t("order.placed_on")}</TableHead><TableHead>{t("common.total")}</TableHead><TableHead>{t("common.status")}</TableHead><TableHead className="text-end">{t("common.actions")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link href={`/track/${o.trackingId}`} onClick={(e) => e.stopPropagation()} className="font-mono text-xs font-semibold text-primary hover:underline">
                      {o.trackingId}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{o.customerName}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{o.customerType.toUpperCase()}</Badge></TableCell>
                  <TableCell className="text-xs">{new Date(o.placedAt).toLocaleDateString(language === "ar" ? "ar-SA" : "en-GB")}</TableCell>
                  <TableCell><PriceTag amount={o.total} size="sm" /></TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                  <TableCell className="text-end"><Button size="sm" variant="outline" onClick={() => setSelected(o)}><Eye className="w-3.5 h-3.5 me-1" /> {t("common.view")}</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selected?.trackingId}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{t("admin.update_status")}:</span>
                <Select value={selected.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>{ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">{language === "ar" ? "العميل" : "Customer"}:</span> <span className="font-medium">{selected.customerName}</span></p>
                <p><span className="text-muted-foreground">{t("common.address")}:</span> {selected.deliveryAddress}, {selected.city}</p>
                <p><span className="text-muted-foreground">{t("order.payment_method")}:</span> {t(`checkout.payment.${selected.paymentMethod}`)}</p>
                {selected.notes && (
                  <div className="mt-1.5 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
                    <p className="text-xs font-semibold text-amber-700 mb-0.5">{language === "ar" ? "ملاحظات التسليم" : "Delivery notes"}</p>
                    <p className="text-amber-900">{selected.notes}</p>
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

export function AdminCustomersPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<"all" | "b2c" | "b2b">("all");
  const { data: allCustomers = [] } = useCustomers();
  const list = tab === "all" ? allCustomers : allCustomers.filter((c) => c.type === tab);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">{t("admin.customers")}</h1>
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList><TabsTrigger value="all">{t("common.all")}</TabsTrigger><TabsTrigger value="b2c">{t("admin.b2c")}</TabsTrigger><TabsTrigger value="b2b">{t("admin.b2b")}</TabsTrigger></TabsList>
      </Tabs>
      <Card>
        <CardContent className="p-5">
          <Table>
            <TableHeader><TableRow><TableHead>{t("common.name")}</TableHead><TableHead>{t("common.email")}</TableHead><TableHead>{t("common.city")}</TableHead><TableHead>{t("account.total_orders")}</TableHead><TableHead>{t("admin.lifetime_value")}</TableHead><TableHead>{t("common.actions")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {list.map((c) => (
                <TableRow key={c.id}>
                  <TableCell><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{c.name[0]}</div><div><p className="font-medium text-sm">{c.name}</p><Badge variant="outline" className="text-xs mt-0.5">{c.type.toUpperCase()}</Badge></div></div></TableCell>
                  <TableCell className="text-sm">{c.email}</TableCell>
                  <TableCell className="text-sm">{c.city}</TableCell>
                  <TableCell>{c.totalOrders}</TableCell>
                  <TableCell><PriceTag amount={c.lifetimeValue} size="sm" /></TableCell>
                  <TableCell><Button size="sm" variant="ghost"><Eye className="w-3.5 h-3.5" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

const BLANK_SP = { name: "", email: "", phone: "", region: "", monthlyTarget: "80000", monthlySales: "0", customersCount: "0", ordersThisMonth: "0", pendingOrders: "0", status: "active" as "active" | "inactive", joinedDate: "" };

export function AdminSalespersonsPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { data: salespersons = [], isLoading } = useSalespersons();
  const createSP = useCreateSalesperson();
  const updateSP = useUpdateSalesperson();
  const deleteSP = useDeleteSalesperson();

  const [addOpen, setAddOpen] = useState(false);
  const [newSP, setNewSP] = useState(BLANK_SP);
  const [editSP, setEditSP] = useState<Salesperson | null>(null);
  const [editData, setEditData] = useState(BLANK_SP);

  const openEdit = (s: Salesperson) => {
    setEditSP(s);
    setEditData({ name: s.name, email: s.email, phone: s.phone ?? "", region: s.region ?? "", monthlyTarget: String(s.monthlyTarget), monthlySales: String(s.monthlySales), customersCount: String(s.customersCount), ordersThisMonth: String(s.ordersThisMonth), pendingOrders: String(s.pendingOrders), status: s.status, joinedDate: s.joinedDate ? s.joinedDate.slice(0, 10) : "" });
  };

  const toPayload = (d: typeof BLANK_SP) => ({
    name: d.name, email: d.email, phone: d.phone, region: d.region,
    monthlyTarget: Number(d.monthlyTarget), monthlySales: Number(d.monthlySales),
    customersCount: Number(d.customersCount), ordersThisMonth: Number(d.ordersThisMonth),
    pendingOrders: Number(d.pendingOrders), status: d.status,
    joinedDate: d.joinedDate || undefined,
  });

  const SPForm = ({ data, setData }: { data: typeof BLANK_SP; setData: (fn: (p: typeof BLANK_SP) => typeof BLANK_SP) => void }) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>{t("common.name")}</Label><Input value={data.name} onChange={(e) => setData((p) => ({ ...p, name: e.target.value }))} /></div>
        <div><Label>{t("common.email")}</Label><Input type="email" value={data.email} onChange={(e) => setData((p) => ({ ...p, email: e.target.value }))} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>{t("common.phone")}</Label><Input value={data.phone} onChange={(e) => setData((p) => ({ ...p, phone: e.target.value }))} /></div>
        <div><Label>Region</Label><Input value={data.region} onChange={(e) => setData((p) => ({ ...p, region: e.target.value }))} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Monthly Target (SAR)</Label><Input type="number" value={data.monthlyTarget} onChange={(e) => setData((p) => ({ ...p, monthlyTarget: e.target.value }))} /></div>
        <div><Label>Monthly Sales (SAR)</Label><Input type="number" value={data.monthlySales} onChange={(e) => setData((p) => ({ ...p, monthlySales: e.target.value }))} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Customers</Label><Input type="number" value={data.customersCount} onChange={(e) => setData((p) => ({ ...p, customersCount: e.target.value }))} /></div>
        <div><Label>Orders / Month</Label><Input type="number" value={data.ordersThisMonth} onChange={(e) => setData((p) => ({ ...p, ordersThisMonth: e.target.value }))} /></div>
        <div><Label>Pending</Label><Input type="number" value={data.pendingOrders} onChange={(e) => setData((p) => ({ ...p, pendingOrders: e.target.value }))} /></div>
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
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("admin.salespersons")}</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 me-1.5" /> {t("common.add")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{language === "ar" ? "إضافة مندوب" : "Add Salesperson"}</DialogTitle></DialogHeader>
            <SPForm data={newSP} setData={setNewSP} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>{language === "ar" ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={() => {
                createSP.mutate(toPayload(newSP) as any, {
                  onSuccess: () => { toast({ title: language === "ar" ? "تمت الإضافة" : "Salesperson added" }); setAddOpen(false); setNewSP(BLANK_SP); },
                  onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
                });
              }} disabled={createSP.isPending}>{createSP.isPending ? "Saving…" : t("common.save")}</Button>
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
                <TableHead>{t("common.name")}</TableHead>
                <TableHead>{t("common.email")}</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>{t("sales.kpi.customers")}</TableHead>
                <TableHead>{t("sales.kpi.sales")}</TableHead>
                <TableHead>{t("sales.target")}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>{t("common.actions")}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {salespersons.map((s) => {
                  const pct = s.monthlyTarget > 0 ? Math.round((s.monthlySales / s.monthlyTarget) * 100) : 0;
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.phone}</p>
                        </div>
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
                          <span className="text-xs font-semibold tabular-nums">{pct}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">of <span className="font-medium">SAR {s.monthlyTarget.toLocaleString()}</span></p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.status === "active" ? "default" : "outline"} className={s.status === "active" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : ""}>
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => {
                            if (!confirm(`Remove ${s.name}?`)) return;
                            deleteSP.mutate(s.id, {
                              onSuccess: () => toast({ title: language === "ar" ? "تم الحذف" : "Removed" }),
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
          <DialogHeader><DialogTitle>{language === "ar" ? "تعديل المندوب" : "Edit Salesperson"}</DialogTitle></DialogHeader>
          <SPForm data={editData} setData={setEditData} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSP(null)}>{language === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => {
              if (!editSP) return;
              updateSP.mutate({ id: editSP.id, ...toPayload(editData) } as any, {
                onSuccess: () => { toast({ title: language === "ar" ? "تم التحديث" : "Updated" }); setEditSP(null); },
                onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
              });
            }} disabled={updateSP.isPending}>{updateSP.isPending ? "Saving…" : t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const BLANK_COUPON = { code: "", enTitle: "", arTitle: "", type: "percent" as const, value: "0", minOrder: "0", audience: "both" as const, maxUses: "", startsAt: "", endsAt: "", isActive: true };

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

  const CouponForm = ({ data, setData }: { data: typeof BLANK_COUPON; setData: (fn: (p: typeof BLANK_COUPON) => typeof BLANK_COUPON) => void }) => (
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
        <Label>{language === "ar" ? "نشط" : "Active"}</Label>
      </div>
    </div>
  );

  const toPayload = (d: typeof BLANK_COUPON) => ({
    code: d.code,
    enTitle: d.enTitle || null,
    arTitle: d.arTitle || null,
    type: d.type,
    value: Number(d.value),
    minOrder: Number(d.minOrder),
    audience: d.audience,
    maxUses: d.maxUses ? Number(d.maxUses) : null,
    startsAt: d.startsAt || null,
    endsAt: d.endsAt || null,
    isActive: d.isActive,
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
            <DialogHeader><DialogTitle>{t("admin.add_promotion")}</DialogTitle></DialogHeader>
            <CouponForm data={newCoupon} setData={setNewCoupon} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>{language === "ar" ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={() => {
                if (!newCoupon.code) return;
                createCoupon.mutate(toPayload(newCoupon) as any, {
                  onSuccess: () => { toast({ title: language === "ar" ? "تمت الإضافة" : "Coupon created" }); setAddOpen(false); setNewCoupon(BLANK_COUPON); },
                  onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
                });
              }} disabled={createCoupon.isPending}>{createCoupon.isPending ? "Saving…" : t("common.create")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-5">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading…</div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>{t("common.name")}</TableHead><TableHead>Type</TableHead><TableHead>Audience</TableHead><TableHead>Uses</TableHead><TableHead>{t("common.status")}</TableHead><TableHead className="text-end">{t("common.actions")}</TableHead></TableRow></TableHeader>
              <TableBody>
                {coupons.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs font-bold">{c.code}</TableCell>
                    <TableCell className="text-sm">{language === "ar" ? (c.arTitle || c.code) : (c.enTitle || c.code)}</TableCell>
                    <TableCell><Badge variant="outline">{typeLabel(c)}</Badge></TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{c.audience.toUpperCase()}</Badge></TableCell>
                    <TableCell className="text-xs">{c.usesCount}{c.maxUses != null ? ` / ${c.maxUses}` : ""}</TableCell>
                    <TableCell><Badge className={c.isActive ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-muted text-muted-foreground"}>{c.isActive ? (language === "ar" ? "نشط" : "Active") : (language === "ar" ? "معطّل" : "Inactive")}</Badge></TableCell>
                    <TableCell className="text-end space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => deleteCoupon.mutate(c.id, { onSuccess: () => toast({ title: language === "ar" ? "تم الحذف" : "Deleted" }), onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }) })}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {coupons.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{language === "ar" ? "لا توجد كوبونات بعد" : "No coupons yet"}</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editCoupon} onOpenChange={() => setEditCoupon(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{language === "ar" ? "تعديل الكوبون" : "Edit Coupon"}</DialogTitle></DialogHeader>
          <CouponForm data={editData} setData={setEditData as any} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCoupon(null)}>{language === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => {
              if (!editCoupon) return;
              updateCoupon.mutate({ id: editCoupon.id, ...toPayload(editData) } as any, {
                onSuccess: () => { toast({ title: language === "ar" ? "تم التحديث" : "Updated" }); setEditCoupon(null); },
                onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
              });
            }} disabled={updateCoupon.isPending}>{updateCoupon.isPending ? "Saving…" : t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AdminBrandsPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { data: brands = [] } = useBrands();
  const { data: products = [] } = useProducts();
  const createBrand = useCreateBrand();
  const deleteBrand = useDeleteBrand();
  const updateBrand = useUpdateBrand();
  const [addOpen, setAddOpen] = useState(false);
  const [newBrand, setNewBrand] = useState({ name: "", enTagline: "", arTagline: "", accent: "#333333", logo: "" });
  const [editBrand, setEditBrand] = useState<(typeof brands)[0] | null>(null);
  const [editBrandData, setEditBrandData] = useState({ name: "", enTagline: "", arTagline: "", logo: "", accent: "#333333" });

  const handleCreate = () => {
    if (!newBrand.name) return;
    createBrand.mutate(newBrand, {
      onSuccess: () => {
        toast({ title: t("common.create"), description: `"${newBrand.name}" added` });
        setAddOpen(false);
        setNewBrand({ name: "", enTagline: "", arTagline: "", accent: "#333333", logo: "" });
      },
      onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
    });
  };

  const handleDelete = (id: string) => {
    deleteBrand.mutate(id, {
      onSuccess: () => toast({ title: t("common.delete"), description: "Brand removed" }),
      onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("admin.brands")}</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 me-1.5" /> {t("admin.add_brand")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("admin.add_brand")}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>{t("common.name")}</Label><Input value={newBrand.name} onChange={(e) => setNewBrand((p) => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Tagline (EN)</Label><Input value={newBrand.enTagline} onChange={(e) => setNewBrand((p) => ({ ...p, enTagline: e.target.value }))} /></div>
              <div><Label>Tagline (AR)</Label><Input value={newBrand.arTagline} onChange={(e) => setNewBrand((p) => ({ ...p, arTagline: e.target.value }))} /></div>
              <div><Label>Logo URL</Label><Input value={newBrand.logo} onChange={(e) => setNewBrand((p) => ({ ...p, logo: e.target.value }))} placeholder="https://..." /></div>
            </div>
            <DialogFooter><Button onClick={handleCreate} disabled={createBrand.isPending}>{createBrand.isPending ? "Saving…" : t("common.create")}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {brands.map((b) => (
          <Card key={b.id}>
            <CardContent className="p-5 text-center space-y-3">
              <div className="w-20 h-20 mx-auto rounded-md flex items-center justify-center bg-white border border-border/60 shadow-sm p-2">
                {b.logo ? <img src={b.logo} alt={b.name} className="max-w-full max-h-full object-contain" /> : <div className="w-10 h-10 rounded-full" style={{ background: b.accent }} />}
              </div>
              <h3 className="font-bold">{b.name}</h3>
              <p className="text-xs text-muted-foreground">{language === "ar" ? b.arTagline : b.enTagline}</p>
              <p className="text-xs text-muted-foreground">{products.filter((p) => p.brandId === b.id).length} {t("admin.product_count").toLowerCase()}</p>
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
          <DialogHeader><DialogTitle>{language === "ar" ? "تعديل العلامة التجارية" : "Edit Brand"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{t("common.name")}</Label><Input value={editBrandData.name} onChange={(e) => setEditBrandData((p) => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Tagline (EN)</Label><Input value={editBrandData.enTagline} onChange={(e) => setEditBrandData((p) => ({ ...p, enTagline: e.target.value }))} /></div>
            <div><Label>Tagline (AR)</Label><Input value={editBrandData.arTagline} onChange={(e) => setEditBrandData((p) => ({ ...p, arTagline: e.target.value }))} /></div>
            <div><Label>Logo URL</Label><Input value={editBrandData.logo} onChange={(e) => setEditBrandData((p) => ({ ...p, logo: e.target.value }))} placeholder="https://..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBrand(null)}>{language === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => {
              if (!editBrand) return;
              updateBrand.mutate({ id: editBrand.id, name: editBrandData.name, enTagline: editBrandData.enTagline, arTagline: editBrandData.arTagline, logo: editBrandData.logo, accent: editBrandData.accent } as any, {
                onSuccess: () => { toast({ title: language === "ar" ? "تم التحديث" : "Brand updated" }); setEditBrand(null); },
                onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
              });
            }} disabled={updateBrand.isPending}>{updateBrand.isPending ? "Saving…" : t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
            <h2 className="font-bold mb-4">{t("admin.report.customer_split")}</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={customerSplit} dataKey="value" cx="50%" cy="50%" outerRadius={90} label>
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
            <h2 className="font-bold mb-4">{t("admin.report.salesperson")}</h2>
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

export function AdminSettingsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();

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
    </div>
  );
}
