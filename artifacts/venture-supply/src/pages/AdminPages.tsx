import { useMemo, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, ShoppingBag, Users as UsersIcon, AlertTriangle, TrendingUp, Wallet, Eye, Pencil, Search, Download, FileText } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { categories } from "@/data/categories";
import { brands } from "@/data/brands";
import { products } from "@/data/products";
import { customers } from "@/data/customers";
import { salespersons } from "@/data/salespersons";
import { orders, ORDER_STATUSES, type OrderStatus } from "@/data/orders";
import { promotions } from "@/data/promotions";
import { StatusBadge } from "@/components/StatusBadge";
import { PriceTag } from "@/components/PriceTag";

const PRIMARY = "hsl(25, 47%, 24%)";
const SECONDARY = "hsl(42, 82%, 50%)";

export function AdminDashboardPage() {
  const { t, language } = useLanguage();
  const todayOrders = orders.filter((o) => new Date(o.placedAt).toDateString() === new Date(2026, 3, 27).toDateString()).length || 6;
  const revenueToday = orders.slice(0, 6).reduce((s, o) => s + o.total, 0);
  const newCustomers = 8;
  const pendingOrders = orders.filter((o) => ["new", "confirmed", "preparing", "packed"].includes(o.status)).length;
  const lowStock = products.filter((p) => p.stockStatus === "low-stock").length;

  const revenueData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    revenue: 8000 + Math.round(Math.sin(i / 3) * 2500 + Math.random() * 3000 + i * 200),
  }));

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
        <p className="text-sm text-muted-foreground mt-1">{t("common.today")} · {new Date(2026, 3, 27).toLocaleDateString(language === "ar" ? "ar-SA" : "en-GB")}</p>
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

function ComingSoonAction({ label }: { label: string }) {
  const { toast } = useToast();
  return (
    <Button variant="ghost" size="sm" onClick={() => toast({ title: label, description: "Coming soon" })}>
      <Pencil className="w-3.5 h-3.5" />
    </Button>
  );
}

export function AdminCategoriesPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("admin.categories")}</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 me-1.5" />{t("admin.add_category")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("admin.add_category")}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>{t("common.name")} (EN)</Label><Input /></div>
              <div><Label>{t("common.name")} (AR)</Label><Input /></div>
              <div><Label>{t("common.image")} URL</Label><Input /></div>
            </div>
            <DialogFooter><Button onClick={() => toast({ title: t("common.create"), description: "Coming soon" })}>{t("common.create")}</Button></DialogFooter>
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
                  <TableCell className="text-end space-x-1"><ComingSoonAction label={t("common.edit")} /><Button variant="ghost" size="sm" className="text-rose-600" onClick={() => toast({ title: t("common.delete"), description: "Coming soon" })}><Trash2 className="w-3.5 h-3.5" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminProductsPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [brand, setBrand] = useState("all");

  const filtered = products.filter((p) => {
    const name = language === "ar" ? p.arName : p.enName;
    return (search === "" || name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
      && (cat === "all" || p.categoryId === cat)
      && (brand === "all" || p.brandId === brand);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold">{t("admin.products")}</h1>
        <Dialog>
          <DialogTrigger asChild><Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 me-1.5" />{t("admin.add_product")}</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{t("admin.add_product")}</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t("common.name")} (EN)</Label><Input /></div>
                <div><Label>{t("common.name")} (AR)</Label><Input /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t("admin.b2c_price")}</Label><Input type="number" /></div>
                <div><Label>{t("admin.b2b_price")}</Label><Input type="number" /></div>
              </div>
              <div><Label>{t("product.category")}</Label><select className="w-full h-9 px-3 border rounded-md bg-background">{categories.map((c) => <option key={c.id}>{t(`category.${c.id}`)}</option>)}</select></div>
              <div><Label>{t("product.brand")}</Label><select className="w-full h-9 px-3 border rounded-md bg-background">{brands.map((b) => <option key={b.id}>{b.name}</option>)}</select></div>
            </div>
            <DialogFooter><Button onClick={() => toast({ title: t("common.create"), description: "Coming soon" })}>{t("common.create")}</Button></DialogFooter>
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
                  <TableCell className="text-end space-x-1"><ComingSoonAction label={t("common.edit")} /><Button variant="ghost" size="sm" className="text-rose-600" onClick={() => toast({ title: t("common.delete"), description: "Coming soon" })}><Trash2 className="w-3.5 h-3.5" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminInventoryPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
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
                  <TableCell><span className={`font-bold ${p.stockStatus === "low-stock" ? "text-amber-700" : p.stockStatus === "out-of-stock" ? "text-rose-700" : "text-emerald-700"}`}>{p.stockQty}</span></TableCell>
                  <TableCell><Badge variant={p.stockStatus === "in-stock" ? "default" : p.stockStatus === "low-stock" ? "secondary" : "destructive"}>{t(`product.${p.stockStatus.replace("-", "_")}`)}</Badge></TableCell>
                  <TableCell className="text-end"><Button size="sm" variant="outline" onClick={() => toast({ title: t("admin.adjust_stock"), description: "Coming soon" })}>{t("admin.adjust_stock")}</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminOrdersPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const filtered = statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);
  const [selected, setSelected] = useState<typeof orders[0] | null>(null);

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
                  <TableCell className="font-mono text-xs">{o.trackingId}</TableCell>
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
                <Select value={selected.status} onValueChange={() => toast({ title: t("admin.update_status"), description: "Coming soon" })}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>{ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">{language === "ar" ? "العميل" : "Customer"}:</span> <span className="font-medium">{selected.customerName}</span></p>
                <p><span className="text-muted-foreground">{t("common.address")}:</span> {selected.deliveryAddress}, {selected.city}</p>
                <p><span className="text-muted-foreground">{t("order.payment_method")}:</span> {t(`checkout.payment.${selected.paymentMethod}`)}</p>
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
  const list = tab === "all" ? customers : customers.filter((c) => c.type === tab);
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

export function AdminSalespersonsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("admin.salespersons")}</h1>
        <Button className="bg-primary hover:bg-primary/90" onClick={() => toast({ title: t("common.add"), description: "Coming soon" })}><Plus className="w-4 h-4 me-1.5" /> {t("common.add")}</Button>
      </div>
      <Card>
        <CardContent className="p-5">
          <Table>
            <TableHeader><TableRow><TableHead>{t("common.name")}</TableHead><TableHead>{t("common.email")}</TableHead><TableHead>Region</TableHead><TableHead>{t("sales.kpi.customers")}</TableHead><TableHead>{t("sales.kpi.sales")}</TableHead><TableHead>{t("sales.target")}</TableHead><TableHead>{t("common.actions")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {salespersons.map((s) => {
                const pct = Math.round((s.monthlySales / s.monthlyTarget) * 100);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium text-sm">{s.name}</TableCell>
                    <TableCell className="text-sm">{s.email}</TableCell>
                    <TableCell className="text-xs">{s.region}</TableCell>
                    <TableCell>{s.customersCount}</TableCell>
                    <TableCell><PriceTag amount={s.monthlySales} size="sm" /></TableCell>
                    <TableCell><div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${Math.min(pct, 100)}%` }} /></div><span className="text-xs font-semibold">{pct}%</span></div></TableCell>
                    <TableCell><Button size="sm" variant="ghost"><Eye className="w-3.5 h-3.5" /></Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminPromotionsPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("admin.promotions")}</h1>
        <Button className="bg-primary hover:bg-primary/90" onClick={() => toast({ title: t("admin.add_promotion"), description: "Coming soon" })}><Plus className="w-4 h-4 me-1.5" /> {t("admin.add_promotion")}</Button>
      </div>
      <Card>
        <CardContent className="p-5">
          <Table>
            <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>{t("common.name")}</TableHead><TableHead>Type</TableHead><TableHead>Audience</TableHead><TableHead>Period</TableHead><TableHead>{t("common.status")}</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {promotions.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs font-bold">{p.code}</TableCell>
                  <TableCell className="text-sm">{language === "ar" ? p.arTitle : p.enTitle}</TableCell>
                  <TableCell><Badge variant="outline">{p.type === "percent" ? `${p.value}%` : p.type === "amount" ? `SAR ${p.value}` : "Free shipping"}</Badge></TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{p.audience.toUpperCase()}</Badge></TableCell>
                  <TableCell className="text-xs">{new Date(p.startsAt).toLocaleDateString()} → {new Date(p.endsAt).toLocaleDateString()}</TableCell>
                  <TableCell><Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">{p.status}</Badge></TableCell>
                  <TableCell className="text-end space-x-1"><ComingSoonAction label={t("common.edit")} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminBrandsPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("admin.brands")}</h1>
        <Button className="bg-primary hover:bg-primary/90" onClick={() => toast({ title: t("admin.add_brand"), description: "Coming soon" })}><Plus className="w-4 h-4 me-1.5" /> {t("admin.add_brand")}</Button>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {brands.map((b) => (
          <Card key={b.id}>
            <CardContent className="p-5 text-center space-y-3">
              <div className="w-20 h-20 mx-auto rounded-md flex items-center justify-center bg-white border border-border/60 shadow-sm p-2">
                <img src={b.logo} alt={b.name} className="max-w-full max-h-full object-contain" />
              </div>
              <h3 className="font-bold">{b.name}</h3>
              <p className="text-xs text-muted-foreground">{language === "ar" ? b.arTagline : b.enTagline}</p>
              <p className="text-xs text-muted-foreground">{products.filter((p) => p.brandId === b.id).length} {t("admin.product_count").toLowerCase()}</p>
              <div className="flex justify-center gap-1 pt-1"><ComingSoonAction label={t("common.edit")} /></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AdminReportsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const monthlySales = Array.from({ length: 12 }, (_, i) => ({ month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i], b2c: 28000 + Math.round(Math.random() * 12000), b2b: 75000 + Math.round(Math.random() * 30000) }));
  const topProducts = [...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 6).map((p) => ({ name: p.enName.substring(0, 18), sales: p.reviewCount * 12 }));
  const customerSplit = [{ name: "B2C", value: 32 }, { name: "B2B", value: 68 }];
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
