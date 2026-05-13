import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Package, Users, TrendingUp, Eye, ShoppingCart, CheckCircle2, RefreshCw, MapPin,
  ShoppingBag, Loader2, KeyRound,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOrders } from "@/hooks/useOrders";
import { useCustomers } from "@/hooks/useCustomers";
import { StatusBadge } from "@/components/StatusBadge";
import { PriceTag } from "@/components/PriceTag";
import { useRole } from "@/contexts/RoleContext";
import { API_BASE, SESSION_TOKEN_KEY, apiFetch } from "@/lib/api";
import type { Order } from "@/data/orders";

// suppress unused import lint
void Eye;

function SalesLoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

export function SalesDashboardPage() {
  const { currentSalespersonId } = useRole();
  const { data: allOrders = [], isLoading: ordersLoading } = useOrders();
  const { data: allCustomers = [], isLoading: customersLoading } = useCustomers();

  if (ordersLoading || customersLoading) return <SalesLoadingSpinner />;

  const myCustomers = currentSalespersonId
    ? allCustomers.filter((c) => c.assignedSalespersonId === currentSalespersonId)
    : allCustomers;
  const myCustomerIds = new Set(myCustomers.map((c) => c.id));
  const myOrders = allOrders.filter((o) => myCustomerIds.has(o.customerId));

  const totalRevenue = myOrders
    .filter((o) => o.status === "delivered")
    .reduce((s, o) => s + o.total, 0);
  const activeOrders = myOrders.filter(
    (o) => !["delivered", "cancelled"].includes(o.status)
  ).length;

  const recentOrders = [...myOrders]
    .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "My Customers", value: myCustomers.length, color: "text-blue-600" },
          { icon: Package, label: "Total Orders", value: myOrders.length, color: "text-violet-600" },
          { icon: TrendingUp, label: "Revenue (Delivered)", value: `SAR ${totalRevenue.toFixed(0)}`, color: "text-emerald-600" },
          { icon: ShoppingCart, label: "Active Orders", value: activeOrders, color: "text-amber-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.color} shrink-0`} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold mb-3">Recent Orders</h2>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((o) => {
                  const cust = allCustomers.find((c) => c.id === o.customerId);
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.id}</TableCell>
                      <TableCell>{cust?.name ?? o.customerId}</TableCell>
                      <TableCell><PriceTag amount={o.total} /></TableCell>
                      <TableCell><StatusBadge status={o.status} /></TableCell>
                      <TableCell className="text-muted-foreground text-xs">{new Date(o.placedAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function SalesMyCustomersPage() {
  const { currentSalespersonId } = useRole();
  const { data: allCustomers = [], isLoading } = useCustomers();
  if (isLoading) return <SalesLoadingSpinner />;
  const myCustomers = currentSalespersonId
    ? allCustomers.filter((c) => c.assignedSalespersonId === currentSalespersonId)
    : allCustomers;
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">My Customers</h1>
      {myCustomers.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">No customers assigned yet.</CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myCustomers.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 space-y-1">
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-muted-foreground">{c.email}</p>
                <p className="text-sm text-muted-foreground">{c.phone}</p>
                <Badge className="text-xs mt-1">{c.type.toUpperCase()}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function SalesMyOrdersPage() {
  const { currentSalespersonId } = useRole();
  const { data: allOrders = [], isLoading: ordersLoading } = useOrders();
  const { data: allCustomers = [], isLoading: customersLoading } = useCustomers();
  const [statusFilter, setStatusFilter] = useState("all");

  if (ordersLoading || customersLoading) return <SalesLoadingSpinner />;

  const myCustomers = currentSalespersonId
    ? allCustomers.filter((c) => c.assignedSalespersonId === currentSalespersonId)
    : allCustomers;
  const myCustomerIds = new Set(myCustomers.map((c) => c.id));
  const myOrders = allOrders
    .filter((o) => myCustomerIds.has(o.customerId))
    .filter((o) => statusFilter === "all" || o.status === statusFilter)
    .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());

  const STATUS_ICON: Record<string, typeof ShoppingCart> = {
    new: ShoppingCart,
    confirmed: CheckCircle2,
    preparing: Package,
    packed: Package,
    "out-for-delivery": ShoppingBag,
    "ready-for-pickup": MapPin,
    delivered: CheckCircle2,
    cancelled: RefreshCw,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["all", "new", "confirmed", "preparing", "packed", "out-for-delivery", "ready-for-pickup", "delivered", "cancelled"].map((s) => (
              <SelectItem key={s} value={s}>{s === "all" ? "All statuses" : s.replace(/-/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {myOrders.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">No orders found.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {myOrders.map((o: Order) => {
            const cust = allCustomers.find((c) => c.id === o.customerId);
            const Icon = STATUS_ICON[o.status] ?? ShoppingCart;
            return (
              <Card key={o.id}>
                <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                  <Icon className="w-8 h-8 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">{o.id}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="font-semibold">{cust?.name ?? o.customerId}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.placedAt).toLocaleDateString()}</p>
                  </div>
                  <PriceTag amount={o.total} className="text-lg font-bold" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SalesCreateOrderPage() {
  const { currentSalespersonId } = useRole();
  const { data: allCustomers = [], isLoading } = useCustomers();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const myCustomers = currentSalespersonId
    ? allCustomers.filter((c) => c.assignedSalespersonId === currentSalespersonId)
    : allCustomers;

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [items, setItems] = useState<{ productId: string; qty: number; price: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addItem = () => setItems((prev) => [...prev, { productId: "", qty: 1, price: 0 }]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string | number) =>
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const total = items.reduce((s, it) => s + it.qty * it.price, 0);
  const selectedCustomer = allCustomers.find((c) => c.id === selectedCustomerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast({ title: "Select a customer", variant: "destructive" }); return;
    }
    if (items.length === 0 || items.some((it) => !it.productId || it.qty < 1 || it.price <= 0)) {
      toast({ title: "Fill in all item details correctly", variant: "destructive" }); return;
    }
    setIsSubmitting(true);
    try {
      await apiFetch("/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          customerType: selectedCustomer?.type ?? "b2c",
          salespersonId: currentSalespersonId ?? null,
          items,
          total,
          status: "new",
          paymentMethod: "bank",
          notes: `Created by salesperson ${currentSalespersonId ?? "unknown"}`,
        }),
      });
      toast({ title: "Order created successfully" });
      setLocation("/sales/orders");
    } catch (err: any) {
      toast({ title: "Failed to create order", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <SalesLoadingSpinner />;

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold">Create Order</h1>
      <Card>
        <CardContent className="p-5">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <Label>Customer</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer..." />
                </SelectTrigger>
                <SelectContent>
                  {myCustomers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} - {c.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Order items</Label>
                <Button type="button" size="sm" variant="outline" onClick={addItem}>+ Add item</Button>
              </div>
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground">No items added yet. Click "Add item" to start.</p>
              )}
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_100px_auto] gap-2 mb-2 items-center">
                  <Input value={item.productId} onChange={(e) => updateItem(i, "productId", e.target.value)} />
                  <Input type="number" min={1} value={item.qty} onChange={(e) => updateItem(i, "qty", Number(e.target.value))} />
                  <Input type="number" min={0} step="0.01" value={item.price} onChange={(e) => updateItem(i, "price", Number(e.target.value))} />
                  <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => removeItem(i)}>x</Button>
                </div>
              ))}
            </div>

            {items.length > 0 && (
              <div className="text-right font-semibold">Total: SAR {total.toFixed(2)}</div>
            )}

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 me-2 animate-spin" /> Creating...</> : "Create Order"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function SalesSettingsPage() {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword || !confirm) {
      toast({ title: "All fields required", variant: "destructive" }); return;
    }
    if (newPassword !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" }); return;
    }
    if (newPassword.length < 8) {
      toast({ title: "New password must be at least 8 characters", variant: "destructive" }); return;
    }
    setPwLoading(true);
    try {
      const token = localStorage.getItem(SESSION_TOKEN_KEY) ?? "";
      const res = await fetch(`${API_BASE}/api/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error((err as any).error ?? "Failed");
      }
      toast({ title: "Password updated successfully" });
      setNewPassword("");
      setConfirm("");
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
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">Change Password</h2>
          </div>
          <div>
            <Label>New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
            />
          </div>
          <div>
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
            />
          </div>
          <Button onClick={handleChangePassword} disabled={pwLoading} className="bg-primary hover:bg-primary/90">
            {pwLoading ? "Saving..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
