import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Users, ShoppingBag, Wallet, Target, Phone, Eye, Plus, Minus, Search, ShoppingCart, Loader2, CreditCard, Banknote, Building2, ArrowLeft, MapPin, Package } from "lucide-react";

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import { useCustomers } from "@/hooks/useCustomers";
import { useOrders, useCreateOrder } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { StatusBadge } from "@/components/StatusBadge";
import { PriceTag } from "@/components/PriceTag";
import { useLocation } from "wouter";

const PRIMARY = "hsl(25, 47%, 24%)";
const SECONDARY = "hsl(42, 82%, 50%)";

function SalesLoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-48 text-muted-foreground">
      <Loader2 className="w-6 h-6 animate-spin me-2" />
      <span className="text-sm">Loading…</span>
    </div>
  );
}

export function SalesDashboardPage() {
  const { t, language } = useLanguage();
  const { salesperson, isSalespersonLoading } = useRole();
  const { data: allCustomers = [] } = useCustomers();
  const { data: allOrders = [] } = useOrders();

  if (isSalespersonLoading) return <SalesLoadingSpinner />;
  if (!salesperson) return null;

  const myCustomers = allCustomers.filter((c) => c.assignedSalespersonId === salesperson.id);
  const myOrders = allOrders.filter((o) => myCustomers.some((c) => c.id === o.customerId));
  const monthlySales = salesperson.monthlySales;
  const target = salesperson.monthlyTarget;
  const pct = Math.round((monthlySales / target) * 100);

  const dailyAvg = Math.round(monthlySales / 30);
  const trend = Array.from({ length: 14 }, (_, i) => ({ day: i + 1, sales: Math.round(dailyAvg * (0.7 + Math.sin(i / 2) * 0.3 + (i % 3 === 0 ? 0.2 : 0))) }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{t("account.welcome")},</p>
        <h1 className="text-3xl font-bold">{salesperson.name}</h1>
        <p className="text-sm text-muted-foreground">{salesperson.region}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Users} label={t("sales.kpi.customers")} value={String(myCustomers.length)} accent="bg-blue-100 text-blue-700" />
        <KpiCard icon={ShoppingBag} label={t("sales.kpi.active_orders")} value={String(myOrders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length)} accent="bg-amber-100 text-amber-700" />
        <KpiCard icon={Wallet} label={t("sales.kpi.sales")} value={<PriceTag amount={monthlySales} size="md" />} accent="bg-emerald-100 text-emerald-700" />
        <KpiCard icon={Target} label={t("sales.target")} value={`${pct}%`} accent="bg-violet-100 text-violet-700" />
      </div>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">{t("sales.target")}</h2>
            <span className="text-sm text-muted-foreground"><PriceTag amount={monthlySales} size="sm" /> / <PriceTag amount={target} size="sm" /></span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-secondary to-primary transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5">
          <h2 className="font-bold mb-4">{t("admin.chart.revenue")}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                <Tooltip formatter={(v: number) => [`SAR ${v.toLocaleString()}`, "Sales"]} />
                <Line type="monotone" dataKey="sales" stroke={PRIMARY} strokeWidth={2.5} dot={{ r: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5">
          <h2 className="font-bold mb-4">{t("sales.recent_activity")}</h2>
          <div className="space-y-2">
            {myOrders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-2 py-2 border-b last:border-b-0">
                <div>
                  <p className="font-mono text-xs">{o.trackingId}</p>
                  <p className="text-sm font-medium">{o.customerName}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.placedAt).toLocaleDateString(language === "ar" ? "ar-SA" : "en-GB")}</p>
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
  );
}

function KpiCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: any; accent: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-md ${accent} flex items-center justify-center`}><Icon className="w-5 h-5" /></div>
        <div className="min-w-0"><div className="text-xl font-bold leading-tight truncate">{value}</div><div className="text-xs text-muted-foreground truncate">{label}</div></div>
      </CardContent>
    </Card>
  );
}

export function SalesMyCustomersPage() {
  const { t, language } = useLanguage();
  const { salesperson, isSalespersonLoading } = useRole();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { data: allCustomers = [] } = useCustomers();

  if (isSalespersonLoading) return <SalesLoadingSpinner />;
  if (!salesperson) return null;
  const myCustomers = allCustomers.filter((c) => c.assignedSalespersonId === salesperson.id);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">{t("sales.my_customers")}</h1>
      <Card>
        <CardContent className="p-5">
          <Table>
            <TableHeader><TableRow><TableHead>{t("common.name")}</TableHead><TableHead>{t("checkout.business_name")}</TableHead><TableHead>{t("common.city")}</TableHead><TableHead>{t("account.total_orders")}</TableHead><TableHead>{t("admin.lifetime_value")}</TableHead><TableHead>{t("common.actions")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {myCustomers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-sm">{c.name}</TableCell>
                  <TableCell className="text-sm">{c.business?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm">{c.city}</TableCell>
                  <TableCell>{c.totalOrders}</TableCell>
                  <TableCell><PriceTag amount={c.lifetimeValue} size="sm" /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => toast({ title: t("sales.contact"), description: c.phone })}><Phone className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="outline" onClick={() => setLocation(`/sales/orders/new?customerId=${c.id}`)}><Plus className="w-3.5 h-3.5 me-1" /> {t("sales.create_order")}</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function SalesMyOrdersPage() {
  const { t, language } = useLanguage();
  const { salesperson, isSalespersonLoading } = useRole();
  const { data: allCustomers = [] } = useCustomers();
  const { data: allOrders = [] } = useOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  if (isSalespersonLoading) return <SalesLoadingSpinner />;
  if (!salesperson) return null;
  const myCustomers = allCustomers.filter((c) => c.assignedSalespersonId === salesperson.id);
  const myOrders = allOrders.filter((o) => myCustomers.some((c) => c.id === o.customerId));
  const selectedOrder = myOrders.find((o) => o.id === selectedOrderId) ?? null;

  if (selectedOrder) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" className="gap-2 -ms-2 text-muted-foreground hover:text-foreground" onClick={() => setSelectedOrderId(null)}>
          <ArrowLeft className="w-4 h-4" /> {t("common.back")}
        </Button>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold font-mono">{selectedOrder.trackingId}</h1>
            <p className="text-sm text-muted-foreground">{selectedOrder.customerName} · {new Date(selectedOrder.placedAt).toLocaleDateString(language === "ar" ? "ar-SA" : "en-GB")}</p>
          </div>
          <StatusBadge status={selectedOrder.status} />
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardContent className="p-5 space-y-3">
              <h2 className="font-bold flex items-center gap-2"><Package className="w-4 h-4" /> Order Items</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Pack</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-end">Unit Price</TableHead>
                    <TableHead className="text-end">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder.items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm">{language === "ar" ? item.arName : item.enName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.packSize}</TableCell>
                      <TableCell className="text-center">{item.qty}</TableCell>
                      <TableCell className="text-end"><PriceTag amount={item.unitPrice} size="sm" /></TableCell>
                      <TableCell className="text-end"><PriceTag amount={item.unitPrice * item.qty} size="sm" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Separator />
              <div className="space-y-1.5 text-sm max-w-xs ms-auto">
                <div className="flex justify-between"><span className="text-muted-foreground">{t("common.subtotal")}</span><PriceTag amount={selectedOrder.subtotal} size="sm" /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("common.vat")} (15%)</span><PriceTag amount={selectedOrder.vat} size="sm" /></div>
                {selectedOrder.deliveryCharge > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><PriceTag amount={selectedOrder.deliveryCharge} size="sm" /></div>
                )}
                <Separator />
                <div className="flex justify-between font-bold"><span>{t("common.total")}</span><PriceTag amount={selectedOrder.total} size="md" /></div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-5 space-y-3">
                <h2 className="font-bold flex items-center gap-2"><MapPin className="w-4 h-4" /> Delivery</h2>
                <p className="text-sm">{selectedOrder.deliveryAddress}</p>
                <Separator />
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span className="capitalize font-medium">{selectedOrder.paymentMethod}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="capitalize font-medium">{selectedOrder.orderType}</span></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 space-y-3">
                <h2 className="font-bold">Status History</h2>
                <div className="space-y-2">
                  {[...(selectedOrder.history ?? [])].reverse().map((h, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${i === 0 ? "bg-primary" : "bg-muted-foreground/40"}`} />
                      <div>
                        <StatusBadge status={h.status} />
                        <p className="text-xs text-muted-foreground mt-0.5">{new Date(h.at).toLocaleString(language === "ar" ? "ar-SA" : "en-GB")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">{t("sales.my_orders")}</h1>
      <Card>
        <CardContent className="p-5">
          <Table>
            <TableHeader><TableRow><TableHead>{t("order.tracking_id")}</TableHead><TableHead>Customer</TableHead><TableHead>{t("order.placed_on")}</TableHead><TableHead>{t("common.total")}</TableHead><TableHead>{t("common.status")}</TableHead><TableHead className="text-end">{t("common.actions")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {myOrders.map((o) => (
                <TableRow key={o.id} className="cursor-pointer hover:bg-muted/60" onClick={() => setSelectedOrderId(o.id)}>
                  <TableCell className="font-mono text-xs font-semibold text-primary">{o.trackingId}</TableCell>
                  <TableCell className="text-sm font-medium">{o.customerName}</TableCell>
                  <TableCell className="text-xs">{new Date(o.placedAt).toLocaleDateString(language === "ar" ? "ar-SA" : "en-GB")}</TableCell>
                  <TableCell><PriceTag amount={o.total} size="sm" /></TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                  <TableCell className="text-end">
                    <Button size="sm" variant="ghost" className="text-primary hover:text-primary" onClick={(e) => { e.stopPropagation(); setSelectedOrderId(o.id); }}>
                      <Eye className="w-3.5 h-3.5 me-1" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function SalesCreateOrderPage() {
  const { t, language } = useLanguage();
  const { salesperson } = useRole();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const createOrder = useCreateOrder();

  const initialCustomerId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("customerId") ?? ""
      : "";

  const { data: allCustomers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();

  const myCustomers = allCustomers.filter((c) => c.assignedSalespersonId === salesperson?.id);
  const [customerId, setCustomerId] = useState(initialCustomerId || myCustomers[0]?.id || "");
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("credit");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<{
    productId: string; packSize: string; qty: number;
    unitPrice: number; enName: string; arName: string; image: string;
  }[]>([]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const name = language === "ar" ? p.arName : p.enName;
      return (cat === "all" || p.categoryId === cat)
        && (search === "" || name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
        && p.b2bPrice > 0;
    }).slice(0, 30);
  }, [products, search, cat, language]);

  const addToCart = (p: typeof products[0]) => {
    const pack = p.packs.find((pk: any) => pk.b2bPrice) ?? p.packs[0];
    setCart((c) => {
      const existing = c.find((it) => it.productId === p.id && it.packSize === pack?.size);
      if (existing) return c.map((it) => it === existing ? { ...it, qty: it.qty + 1 } : it);
      return [...c, {
        productId: p.id,
        packSize: pack?.size ?? "",
        qty: p.minOrderQty,
        unitPrice: pack?.b2bPrice ?? p.b2bPrice,
        enName: p.enName,
        arName: p.arName,
        image: p.image ?? "",
      }];
    });
  };

  const updateQty = (idx: number, delta: number) => {
    setCart((c) => c.map((it, i) => i === idx ? { ...it, qty: Math.max(1, it.qty + delta) } : it));
  };
  const removeItem = (idx: number) => setCart((c) => c.filter((_, i) => i !== idx));

  const subtotal = +cart.reduce((s, it) => s + it.unitPrice * it.qty, 0).toFixed(2);
  const vat = +(subtotal * 0.15).toFixed(2);
  const total = +(subtotal + vat).toFixed(2);

  const submit = () => {
    if (!customerId || cart.length === 0) {
      toast({ title: t("sales.create_order"), description: "Add a customer and items first", variant: "destructive" });
      return;
    }

    const selectedCustomer = myCustomers.find((c) => c.id === customerId);
    if (!selectedCustomer) return;

    const id = `o-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const trackingId = `VS-O-${Math.floor(1000 + Math.random() * 9000)}`;
    const placedAt = new Date().toISOString();
    const estimatedAt = new Date(Date.now() + 4 * 86_400_000).toISOString();
    const deliveryAddress =
      selectedCustomer.addresses?.[0]?.fullAddress ?? selectedCustomer.city ?? "TBD";

    createOrder.mutate(
      {
        id,
        trackingId,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.business?.name ?? selectedCustomer.name,
        customerType: "b2b",
        salespersonId: salesperson?.id ?? null,
        status: "new",
        orderType: "delivery",
        paymentMethod,
        placedAt,
        estimatedAt,
        deliveryAddress,
        city: selectedCustomer.city ?? "Riyadh",
        notes: notes.trim() || null,
        items: cart.map((it) => ({ ...it })),
        subtotal,
        vat,
        deliveryCharge: 0,
        total,
        history: [{ status: "new", at: placedAt }],
      },
      {
        onSuccess: (saved) => {
          toast({ title: t("sales.order_created"), description: saved.trackingId });
          setCart([]);
          setLocation("/sales/orders");
        },
        onError: (err: Error) => {
          toast({ title: "Order failed", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">{t("sales.create_order")}</h1>
      <div className="grid lg:grid-cols-[1fr_400px] gap-4">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <Label>{t("sales.create.customer_select")}</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger data-testid="select-customer"><SelectValue /></SelectTrigger>
                <SelectContent>{myCustomers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} {c.business ? `· ${c.business.name}` : ""}</SelectItem>)}</SelectContent>
              </Select>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 space-y-3">
              <h2 className="font-bold">{t("sales.create.items")}</h2>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("nav.search_placeholder")} className="ps-10" />
                </div>
                <Select value={cat} onValueChange={setCat}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{t(`category.${c.id}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 border rounded-md hover-elevate">
                    <img src={p.image} alt={p.enName} className="w-12 h-12 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight truncate">{language === "ar" ? p.arName : p.enName}</p>
                      <p className="text-xs text-muted-foreground">{p.sku} · {p.packs[0]?.size ?? ""}</p>
                    </div>
                    <PriceTag amount={p.b2bPrice} size="sm" />
                    <Button size="sm" onClick={() => addToCart(p)} className="bg-primary hover:bg-primary/90"><Plus className="w-3.5 h-3.5 me-1" /> {t("common.add")}</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <Card className="h-fit lg:sticky lg:top-32">
          <CardContent className="p-5 space-y-3">
            <h2 className="font-bold flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> {t("checkout.summary")}</h2>
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">{t("cart.empty")}</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {cart.map((it, i) => (
                  <div key={`${it.productId}-${it.packSize}`} className="text-sm border-b pb-2">
                    <p className="font-medium leading-tight">{language === "ar" ? it.arName : it.enName}</p>
                    <p className="text-xs text-muted-foreground">{it.packSize}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center border rounded">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(i, -1)}><Minus className="w-3 h-3" /></Button>
                        <span className="w-8 text-center font-medium">{it.qty}</span>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(i, 1)}><Plus className="w-3 h-3" /></Button>
                      </div>
                      <PriceTag amount={it.unitPrice * it.qty} size="sm" />
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-600" onClick={() => removeItem(i)}>×</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Separator />
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("common.subtotal")}</span><PriceTag amount={subtotal} size="sm" /></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("common.vat")}</span><PriceTag amount={vat} size="sm" /></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="text-emerald-600 font-medium text-xs">Free</span></div>
              <Separator className="my-1" />
              <div className="flex justify-between items-baseline"><span className="font-bold">{t("common.total")}</span><PriceTag amount={total} size="lg" /></div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Delivery notes</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Special handling, access instructions…"
                className="w-full text-sm border rounded-md px-3 py-2 resize-none bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Payment method</p>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: "credit", label: "Credit", Icon: CreditCard },
                  { value: "bank", label: "Bank", Icon: Building2 },
                  { value: "cod", label: "Cash", Icon: Banknote },
                ].map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentMethod(value)}
                    className={`flex flex-col items-center gap-1 border rounded-md py-2 text-xs font-medium transition-colors ${paymentMethod === value ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={submit}
              className="w-full bg-primary hover:bg-primary/90"
              disabled={cart.length === 0 || createOrder.isPending}
              data-testid="button-submit-sales-order"
            >
              {createOrder.isPending
                ? <><Loader2 className="w-4 h-4 me-2 animate-spin" />Placing order…</>
                : t("sales.submit_order")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function SalesSettingsPage() {
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
      const BASE = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
      const token = localStorage.getItem("vs.token") ?? "";
      const res = await fetch(`${BASE}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: pwForm.email, currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error((err as any).error ?? "Failed");
      }
      toast({ title: "Password updated successfully" });
      setPwForm({ email: "", currentPassword: "", newPassword: "", confirm: "" });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-3xl font-bold">Settings</h1>
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-semibold">Change Password</h2>
          <p className="text-sm text-muted-foreground">Enter your login email and current password to set a new one.</p>
          <div>
            <Label>Email</Label>
            <Input type="email" placeholder="Your login email" value={pwForm.email} onChange={(e) => setPwForm((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div>
            <Label>Current Password</Label>
            <Input type="password" placeholder="••••••••" value={pwForm.currentPassword} onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))} />
          </div>
          <div>
            <Label>New Password</Label>
            <Input type="password" placeholder="Min. 8 characters" value={pwForm.newPassword} onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))} />
          </div>
          <div>
            <Label>Confirm New Password</Label>
            <Input type="password" placeholder="Repeat new password" value={pwForm.confirm} onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))} />
          </div>
          <Button onClick={handleChangePassword} disabled={pwLoading} className="bg-primary hover:bg-primary/90">{pwLoading ? "Saving…" : "Update Password"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
