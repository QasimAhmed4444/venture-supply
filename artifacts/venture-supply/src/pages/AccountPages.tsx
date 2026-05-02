import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingBag, MapPin, Bell, Package, Eye, Plus, CheckCircle2, Building2, ShoppingCart, RefreshCw, Sparkles, UserCheck, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import { useOrders } from "@/hooks/useOrders";
import { useRealtimeOrders, type RealtimeNotification } from "@/hooks/useRealtimeOrders";
import { useProducts } from "@/hooks/useProducts";
import { useSalespersons } from "@/hooks/useSalespersons";
import { ProductCard } from "@/components/ProductCard";
import { StatusBadge } from "@/components/StatusBadge";
import { PriceTag } from "@/components/PriceTag";
import { useMemo, useState, useCallback, useRef } from "react";
import type { Order } from "@/data/orders";
import { useUpdateCustomer } from "@/hooks/useCustomerMutations";
import type { Customer } from "@/data/customers";

// ─── status → human-readable notification copy ───────────────────────────────
const STATUS_NOTIF: Record<string, { en: string; ar: string; enBody: string; arBody: string }> = {
  new:                { en: "Order placed successfully",         ar: "تم استلام طلبك",                enBody: "We've received your order and it's being reviewed.", arBody: "لقد استلمنا طلبك وهو قيد المراجعة." },
  confirmed:          { en: "Order confirmed",                   ar: "تم تأكيد طلبك",                 enBody: "Your order has been confirmed and is in the queue.",  arBody: "تم تأكيد طلبك وهو في قائمة الانتظار." },
  preparing:          { en: "Order is being prepared",           ar: "جارٍ تجهيز طلبك",               enBody: "Our team is packing your items.",                      arBody: "يقوم فريقنا بتعبئة عناصر طلبك." },
  packed:             { en: "Order packed",                      ar: "تم تعبئة طلبك",                  enBody: "Your order is packed and ready for dispatch.",         arBody: "تم تعبئة طلبك وهو جاهز للشحن." },
  "out-for-delivery": { en: "Out for delivery",                  ar: "طلبك في الطريق إليك",            enBody: "Estimated arrival within a few hours.",               arBody: "الوصول المتوقع خلال ساعات قليلة." },
  "ready-for-pickup": { en: "Ready for pickup",                  ar: "طلبك جاهز للاستلام",             enBody: "Visit our hub to collect your order.",                 arBody: "تفضل بزيارة مستودعنا لاستلام طلبك." },
  delivered:          { en: "Order delivered",                   ar: "تم تسليم طلبك",                 enBody: "We hope you enjoy your purchase!",                    arBody: "نتمنى أن تكون سعيدًا بطلبك!" },
  cancelled:          { en: "Order cancelled",                   ar: "تم إلغاء طلبك",                 enBody: "Your order has been cancelled.",                      arBody: "تم إلغاء طلبك." },
};

const STATUS_ICON: Record<string, typeof ShoppingCart> = {
  new:                ShoppingCart,
  confirmed:          CheckCircle2,
  preparing:          Package,
  packed:             Package,
  "out-for-delivery": ShoppingBag,
  "ready-for-pickup": MapPin,
  delivered:          CheckCircle2,
  cancelled:          RefreshCw,
};

const STATUS_COLOR: Record<string, string> = {
  new:                "bg-blue-100 text-blue-700",
  confirmed:          "bg-emerald-100 text-emerald-700",
  preparing:          "bg-amber-100 text-amber-700",
  packed:             "bg-sky-100 text-sky-700",
  "out-for-delivery": "bg-violet-100 text-violet-700",
  "ready-for-pickup": "bg-teal-100 text-teal-700",
  delivered:          "bg-emerald-100 text-emerald-700",
  cancelled:          "bg-red-100 text-red-700",
};

// Static non-order notifications appended at the bottom
const STATIC_ITEMS: FeedItem[] = [
  {
    id: "promo-ramadan",
    type: "promo",
    enTitle: "Ramadan 20% off Recipe Mix",
    arTitle: "خصم 20٪ على خلطات الوصفات في رمضان",
    enBody: "Use code RAMADAN20 at checkout.",
    arBody: "استخدم الكود RAMADAN20 عند إتمام الطلب.",
    at: new Date("2026-04-10T10:00:00Z").getTime(),
  },
  {
    id: "account-welcome",
    type: "account",
    enTitle: "Welcome to Venture Supply",
    arTitle: "أهلاً بك في فينتشر سبلاي",
    enBody: "Get started with our most-loved essentials.",
    arBody: "ابدأ مع أكثر منتجاتنا حبًا لدى عملائنا.",
    at: new Date("2026-01-01T08:00:00Z").getTime(),
  },
];

interface FeedItem {
  id: string;
  type: "order_status" | "promo" | "account" | "live";
  trackingId?: string;
  status?: string;
  enTitle: string;
  arTitle: string;
  enBody: string;
  arBody: string;
  at: number;
}

const LS_READ_KEY = "vs.notif.lastRead";

function getLastRead(): number {
  try { return Number(localStorage.getItem(LS_READ_KEY) ?? 0); } catch { return 0; }
}
function setLastRead(ts: number) {
  try { localStorage.setItem(LS_READ_KEY, String(ts)); } catch {}
}

// ─── AccountDashboardPage ─────────────────────────────────────────────────────
export function AccountDashboardPage() {
  const { t, language } = useLanguage();
  const { customer, role } = useRole();
  const { data: orders = [] } = useOrders({ customerId: customer?.id ?? "" });
  const { data: allProducts = [] } = useProducts();
  const { data: salespersons = [] } = useSalespersons();
  const [, setLocation] = useLocation();
  if (!customer) return null;

  const active = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const recommended = allProducts.slice(0, 4);
  const isB2B = role === "b2b";
  const sp = customer.assignedSalespersonId
    ? salespersons.find((s) => s.id === customer.assignedSalespersonId) ?? null
    : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{t("account.welcome")},</p>
        <h1 className="text-3xl font-bold">{customer.name}</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon={Package} label={t("account.active_orders")} value={active.length} />
        <KpiCard icon={ShoppingBag} label={t("account.total_orders")} value={orders.length} />
        <KpiCard icon={MapPin} label={t("account.saved_addresses")} value={customer.addresses.length} />
      </div>

      {isB2B && sp && (
        <Card className="bg-gradient-to-r from-secondary/10 to-secondary/5 border-secondary/30">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary/20 text-secondary flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("account.account_manager")}</p>
              <p className="font-semibold">{sp.name}</p>
              <p className="text-sm text-muted-foreground">{sp.email} · {sp.phone}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">{t("account.recent_orders")}</h2>
            <Link href="/account/orders"><Button variant="ghost" size="sm">{t("common.view_all")}</Button></Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t("account.empty_orders")}</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>{t("order.tracking_id")}</TableHead><TableHead>{t("order.placed_on")}</TableHead><TableHead>{t("common.total")}</TableHead><TableHead>{t("common.status")}</TableHead></TableRow></TableHeader>
              <TableBody>
                {orders.slice(0, 5).map((o) => (
                  <TableRow key={o.id} data-testid={`row-account-order-${o.id}`} className="cursor-pointer hover:bg-muted/60" onClick={() => setLocation(`/track/${o.trackingId}`)}>
                    <TableCell className="font-mono text-xs font-semibold text-primary">{o.trackingId}</TableCell>
                    <TableCell className="text-sm">{new Date(o.placedAt).toLocaleDateString(language === "ar" ? "ar-SA" : "en-GB")}</TableCell>
                    <TableCell><PriceTag amount={o.total} size="sm" /></TableCell>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="font-bold text-xl mb-4">{t("account.recommended")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {recommended.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── AccountOrdersPage ────────────────────────────────────────────────────────
export function AccountOrdersPage() {
  const { t, language } = useLanguage();
  const { customer } = useRole();
  const { data: orders = [], isLoading } = useOrders({ customerId: customer?.id ?? "" });
  const [, setLocation] = useLocation();
  if (!customer) return null;

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <h1 className="font-bold text-xl">{t("account.orders")}</h1>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">{t("account.empty_orders")}</p>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>{t("order.tracking_id")}</TableHead><TableHead>{t("order.placed_on")}</TableHead><TableHead>Items</TableHead><TableHead>{t("common.total")}</TableHead><TableHead>{t("common.status")}</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.trackingId}</TableCell>
                  <TableCell className="text-sm">{new Date(o.placedAt).toLocaleDateString(language === "ar" ? "ar-SA" : "en-GB")}</TableCell>
                  <TableCell className="text-sm">{o.items.length}</TableCell>
                  <TableCell><PriceTag amount={o.total} size="sm" /></TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                  <TableCell><Link href={`/track/${o.trackingId}`}><Button size="sm" variant="ghost"><Eye className="w-3.5 h-3.5 me-1" /> {t("common.view")}</Button></Link></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ─── AccountNotificationsPage ─────────────────────────────────────────────────
export function AccountNotificationsPage() {
  const { t, language } = useLanguage();
  const { customer } = useRole();
  const { toast } = useToast();

  const [lastRead, setLastReadState] = useState<number>(() => getLastRead());
  const [liveItems, setLiveItems] = useState<FeedItem[]>([]);

  const { data: orders = [], isLoading } = useOrders({ customerId: customer?.id ?? "" });

  // Receive SSE notifications scoped to this customer
  const customerFilter = useMemo(
    () =>
      customer
        ? (record: Record<string, unknown>) => record.customer_id === customer.id
        : undefined,
    [customer?.id]
  );

  const handleLive = useCallback((n: RealtimeNotification) => {
    setLiveItems((prev) => [
      {
        id: n.id,
        type: "live" as const,
        trackingId: n.trackingId,
        status: n.status,
        enTitle: n.type === "new_order" ? "Order placed successfully" : `Order updated → ${n.status}`,
        arTitle: n.type === "new_order" ? "تم استلام طلبك" : `تحديث الطلب → ${n.status}`,
        enBody: `${n.trackingId}`,
        arBody: `${n.trackingId}`,
        at: n.at,
      },
      ...prev,
    ].slice(0, 20));
  }, []);

  useRealtimeOrders(handleLive, customerFilter);

  // Build history feed from real orders
  const historyItems = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];
    orders.forEach((o: Order) => {
      const history = (o.history ?? []) as Array<{ status: string; at: string }>;
      history.forEach((entry) => {
        const copy = STATUS_NOTIF[entry.status];
        if (!copy) return;
        items.push({
          id: `${o.id}-${entry.status}-${entry.at}`,
          type: "order_status",
          trackingId: o.trackingId,
          status: entry.status,
          enTitle: copy.en,
          arTitle: copy.ar,
          enBody: `${copy.enBody} (${o.trackingId})`,
          arBody: `${copy.arBody} (${o.trackingId})`,
          at: new Date(entry.at).getTime(),
        });
      });
    });
    return items.sort((a, b) => b.at - a.at);
  }, [orders]);

  const allItems = useMemo<FeedItem[]>(() => {
    const combined = [...liveItems, ...historyItems, ...STATIC_ITEMS];
    return combined.sort((a, b) => b.at - a.at);
  }, [liveItems, historyItems]);

  if (!customer) return null;

  const unreadCount = allItems.filter((i) => i.at > lastRead).length;

  const markAllRead = () => {
    const now = Date.now();
    setLastReadState(now);
    setLastRead(now);
    toast({ title: language === "ar" ? "تم وضع علامة مقروء على الكل" : "All marked as read" });
  };

  const ar = language === "ar";

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-xl">{t("account.notifications")}</h1>
            {unreadCount > 0 && (
              <Badge className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5">
                {unreadCount} {ar ? "جديد" : "new"}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCircle2 className="w-4 h-4 me-1.5" />
              {ar ? "تحديد الكل مقروء" : "Mark all read"}
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{ar ? "جارٍ تحميل الإشعارات…" : "Loading notifications…"}</p>
          </div>
        ) : allItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Bell className="w-10 h-10 text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">{ar ? "لا توجد إشعارات بعد" : "No notifications yet"}</p>
            <p className="text-sm text-muted-foreground/60">{ar ? "ستظهر تحديثات طلباتك هنا" : "Your order updates will appear here"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {allItems.map((item) => {
              const isUnread = item.at > lastRead;
              const Icon =
                item.type === "promo"   ? Sparkles :
                item.type === "account" ? UserCheck :
                item.type === "live"    ? Bell :
                (STATUS_ICON[item.status ?? ""] ?? Bell);
              const colorClass =
                item.type === "promo"   ? "bg-secondary/10 text-secondary" :
                item.type === "account" ? "bg-primary/10 text-primary" :
                item.type === "live"    ? "bg-violet-100 text-violet-700" :
                (STATUS_COLOR[item.status ?? ""] ?? "bg-primary/10 text-primary");

              return (
                <div
                  key={item.id}
                  className={`border rounded-md p-4 flex gap-3 hover-elevate transition-colors ${
                    isUnread
                      ? "border-secondary/40 bg-secondary/5"
                      : "opacity-80"
                  } ${item.type === "live" ? "border-violet-200" : ""}`}
                >
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm leading-tight">
                        {ar ? item.arTitle : item.enTitle}
                      </p>
                      {item.type === "live" && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-violet-100 text-violet-700 border-violet-200 shrink-0">
                          {ar ? "مباشر" : "Live"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">
                      {ar ? item.arBody : item.enBody}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {item.trackingId && (
                        <Link href={`/track/${item.trackingId}`}>
                          <span className="text-xs font-mono text-primary hover:underline cursor-pointer">
                            {item.trackingId}
                          </span>
                        </Link>
                      )}
                      <span className="text-xs text-muted-foreground/60">
                        {new Date(item.at).toLocaleString(ar ? "ar-SA" : "en-GB", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </div>
                  </div>
                  {isUnread && <span className="w-2 h-2 rounded-full bg-secondary mt-2 shrink-0" />}
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && allItems.length > 0 && (
          <p className="text-xs text-center text-muted-foreground/50 pt-2">
            {ar
              ? `${allItems.length} إشعارًا · يتم التحديث تلقائيًا`
              : `${allItems.length} notifications · auto-updates in real time`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── AccountAddressesPage ──────────────────────────────────────────────────────
type Address = Customer["addresses"][number];

interface AddressFormState {
  label: string;
  fullAddress: string;
  city: string;
}

const EMPTY_ADDR: AddressFormState = { label: "", fullAddress: "", city: "" };

export function AccountAddressesPage() {
  const { t } = useLanguage();
  const { customer, setCustomer } = useRole();
  const { toast } = useToast();
  const update = useUpdateCustomer();

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<AddressFormState>(EMPTY_ADDR);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AddressFormState>(EMPTY_ADDR);

  if (!customer) return null;

  const saveAddresses = async (next: Address[], successMsg: string) => {
    try {
      const updated = await update.mutateAsync({ id: customer.id, addresses: next } as any);
      setCustomer(updated);
      toast({ title: successMsg });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.label || !addForm.fullAddress || !addForm.city) return;
    const isFirst = customer.addresses.length === 0;
    const next: Address[] = [
      ...customer.addresses,
      { id: `a-${Date.now().toString(36)}`, label: addForm.label, fullAddress: addForm.fullAddress, city: addForm.city, isDefault: isFirst },
    ];
    await saveAddresses(next, t("account.add_address"));
    setShowAddForm(false);
    setAddForm(EMPTY_ADDR);
  };

  const handleEdit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    const next = customer.addresses.map((a) =>
      a.id === id ? { ...a, label: editForm.label, fullAddress: editForm.fullAddress, city: editForm.city } : a
    );
    await saveAddresses(next, t("common.save"));
    setEditingId(null);
  };

  const handleSetDefault = async (id: string) => {
    const next = customer.addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    await saveAddresses(next, t("common.set_default"));
  };

  const handleDelete = async (id: string) => {
    const remaining = customer.addresses.filter((a) => a.id !== id);
    // If we removed the default and others remain, make the first one default
    const hasDefault = remaining.some((a) => a.isDefault);
    const next = !hasDefault && remaining.length > 0
      ? remaining.map((a, i) => ({ ...a, isDefault: i === 0 }))
      : remaining;
    await saveAddresses(next, "Address removed");
  };

  const startEdit = (a: Address) => {
    setEditingId(a.id);
    setEditForm({ label: a.label, fullAddress: a.fullAddress, city: a.city });
    setShowAddForm(false);
  };

  const isSaving = update.isPending;

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-xl">{t("account.addresses")}</h1>
          <Button
            onClick={() => { setShowAddForm(true); setEditingId(null); }}
            className="bg-primary hover:bg-primary/90"
            disabled={showAddForm}
          >
            <Plus className="w-4 h-4 me-1.5" /> {t("account.add_address")}
          </Button>
        </div>

        {/* Add-address inline form */}
        {showAddForm && (
          <form onSubmit={handleAdd} className="border rounded-md p-4 space-y-3 bg-muted/30">
            <p className="font-semibold text-sm">{t("account.add_address")}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Label (e.g. Home)</Label><Input value={addForm.label} onChange={(e) => setAddForm((f) => ({ ...f, label: e.target.value }))} placeholder="Home" required /></div>
              <div><Label>{t("common.city")}</Label><Input value={addForm.city} onChange={(e) => setAddForm((f) => ({ ...f, city: e.target.value }))} placeholder="Riyadh" required /></div>
              <div className="sm:col-span-2"><Label>Full address</Label><Input value={addForm.fullAddress} onChange={(e) => setAddForm((f) => ({ ...f, fullAddress: e.target.value }))} placeholder="Street, District, Building" required /></div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t("common.save")}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setShowAddForm(false); setAddForm(EMPTY_ADDR); }}>Cancel</Button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {customer.addresses.length === 0 && !showAddForm && (
            <p className="text-sm text-muted-foreground text-center py-6">No addresses yet. Add one to speed up checkout.</p>
          )}
          {customer.addresses.map((a) => (
            <div key={a.id} className="border rounded-md p-4 hover-elevate">
              {editingId === a.id ? (
                <form onSubmit={(e) => handleEdit(e, a.id)} className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><Label>Label</Label><Input value={editForm.label} onChange={(e) => setEditForm((f) => ({ ...f, label: e.target.value }))} required /></div>
                    <div><Label>{t("common.city")}</Label><Input value={editForm.city} onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))} required /></div>
                    <div className="sm:col-span-2"><Label>Full address</Label><Input value={editForm.fullAddress} onChange={(e) => setEditForm((f) => ({ ...f, fullAddress: e.target.value }))} required /></div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90" disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t("common.save")}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{a.label}</p>
                      {a.isDefault && <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300">{t("common.default")}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{a.fullAddress}, {a.city}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!a.isDefault && (
                      <Button size="sm" variant="outline" disabled={isSaving} onClick={() => handleSetDefault(a.id)}>
                        {t("common.set_default")}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => startEdit(a)}>{t("common.edit")}</Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={isSaving} onClick={() => handleDelete(a.id)}>
                      ✕
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── AccountProfilePage ────────────────────────────────────────────────────────
export function AccountProfilePage() {
  const { t } = useLanguage();
  const { customer, role, setCustomer } = useRole();
  const { toast } = useToast();
  const update = useUpdateCustomer();

  const [name, setName] = useState(customer?.name ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [city, setCity] = useState(customer?.city ?? "");
  const [bizName, setBizName] = useState(customer?.business?.name ?? "");
  const [crNumber, setCrNumber] = useState(customer?.business?.crNumber ?? "");
  const [vatNumber, setVatNumber] = useState(customer?.business?.vatNumber ?? "");

  if (!customer) return null;
  const isB2B = role === "b2b";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const business = isB2B && customer.business
        ? { ...customer.business, name: bizName, crNumber, vatNumber }
        : customer.business;
      const updated = await update.mutateAsync({
        id: customer.id,
        name,
        email,
        phone,
        city,
        ...(isB2B ? { business } : {}),
      } as any);
      setCustomer(updated);
      toast({ title: "Profile saved", description: "Your details have been updated." });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <h1 className="font-bold text-xl">{isB2B ? t("account.business_profile") : t("account.profile")}</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>{t("common.name")}</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div><Label>{t("common.email")}</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>{t("common.phone")}</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div><Label>{t("common.city")}</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
          </div>
          {isB2B && customer.business && (
            <>
              <Separator />
              <h2 className="font-semibold">{t("checkout.business_details")}</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>{t("checkout.business_name")}</Label><Input value={bizName} onChange={(e) => setBizName(e.target.value)} /></div>
                <div><Label>{t("checkout.business_type")}</Label><Input value={t(`checkout.business_type.${customer.business.type}`)} disabled /></div>
                <div><Label>{t("checkout.cr_number")}</Label><Input value={crNumber} onChange={(e) => setCrNumber(e.target.value)} /></div>
                <div><Label>{t("checkout.vat_number")}</Label><Input value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} /></div>
              </div>
            </>
          )}
          <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={update.isPending}>
            {update.isPending ? <><Loader2 className="w-4 h-4 me-2 animate-spin" /> Saving…</> : t("common.save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── AccountSettingsPage ───────────────────────────────────────────────────────
export function AccountSettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        <h1 className="font-bold text-xl">{t("account.settings")}</h1>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <p className="font-medium">{t("account.lang_pref")}</p>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "العربية" : "English"}</p>
            </div>
            <Button variant="outline" onClick={() => setLanguage(language === "ar" ? "en" : "ar")}>
              {language === "ar" ? "Switch to English" : "تغيير إلى العربية"}
            </Button>
          </div>
          {[
            { label: language === "ar" ? "إشعارات الطلبات" : "Order notifications" },
            { label: language === "ar" ? "إشعارات العروض" : "Promo notifications" },
            { label: language === "ar" ? "نشرة بريدية شهرية" : "Monthly newsletter" },
          ].map((s, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-md">
              <p className="font-medium">{s.label}</p>
              <Switch defaultChecked onCheckedChange={() => toast({ title: t("common.save"), description: t("common.feature_coming_soon") })} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
