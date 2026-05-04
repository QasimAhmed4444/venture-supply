# Replit Agent — Round 4

Two new fixes. Same rules: no DB changes, one commit per fix, verify before commit.

DB already has everything you need: `v_b2b_credit_status` view, `customer_outstanding_credit()` function, `customers.business` JSONB with `allowCredit`/`creditLimit`/`approvalStatus`/`creditUsed` fields.

---

## R4-FIX-1 — Invoice / order detail privacy

**Problem:** Order tracking link is shareable. Recipient sees full invoice with prices, address, payment method, items. Should only see status + ETA + tracking ID unless logged in as the customer who placed the order.

### Backend changes

**File:** `artifacts/api-server/src/routes/orders.ts`

Find the `GET /orders/:id` handler. Change the response based on whether the requester is the order owner:

```ts
router.get("/orders/:id", async (req, res) => {
  const session = (req as any).session as VerifiedSession | undefined;
  const sb = getSupabase();

  if (!sb) return res.status(404).json({ error: "not found" });

  const raw = String(req.params.id ?? "");
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(raw)) {
    return res.status(400).json({ error: "Invalid order ID" });
  }

  try {
    let { data } = await sb.from("orders").select("*").eq("id", raw).maybeSingle();
    if (!data) {
      ({ data } = await sb.from("orders").select("*").eq("tracking_id", raw).maybeSingle());
    }
    if (!data) return res.status(404).json({ error: "not found" });

    const order = toCamel(data as Record<string, unknown>);

    // Determine viewer permission level
    let isOwner = false;
    let isStaff = false;

    if (session?.role === "admin") {
      isStaff = true;
      isOwner = true;
    } else if (session?.role === "sales") {
      const { data: staff } = await sb.from("staff").select("salesperson_id").eq("id", session.sub).maybeSingle();
      const spId = staff?.salesperson_id as string | null;
      if (spId && order.salespersonId === spId) {
        isStaff = true;
        isOwner = true;
      }
    } else if (session?.role === "b2c" || session?.role === "b2b") {
      const { data: cust } = await sb.from("customers").select("id").eq("email", session.email).maybeSingle();
      if (cust && cust.id === order.customerId) {
        isOwner = true;
      }
    }

    // Public view (anyone with the tracking link) — minimal fields only
    if (!isOwner && !isStaff) {
      return res.json({
        trackingId: order.trackingId,
        status: order.status,
        orderType: order.orderType,
        placedAt: order.placedAt,
        estimatedAt: order.estimatedAt,
        history: order.history,
        // Item count only, not detail
        itemCount: Array.isArray(order.items) ? order.items.length : 0,
        // No prices, no address, no payment, no customer name
        isPublicView: true,
      });
    }

    // Owner/staff view — full order
    return res.json({ ...order, isPublicView: false });
  } catch {
    return res.status(500).json({ error: "internal" });
  }
});
```

### Frontend changes

**File:** `artifacts/venture-supply/src/pages/OrderTrackingPage.tsx`

Find where the order is rendered. Add a guard based on `order.isPublicView`:

1. **Hide invoice/print/reorder buttons in public view:**
```tsx
{!order.isPublicView && (
  <>
    <Button onClick={printInvoice}>Print Invoice</Button>
    <Button onClick={handleReorder}>Reorder</Button>
  </>
)}
```

2. **Hide pricing breakdown in public view:**
```tsx
{!order.isPublicView && (
  <Card>
    <CardHeader>Pricing</CardHeader>
    <CardContent>
      <div>Subtotal: SAR {order.subtotal}</div>
      <div>VAT: SAR {order.vat}</div>
      <div>Delivery: SAR {order.deliveryCharge}</div>
      <div>Total: SAR {order.total}</div>
    </CardContent>
  </Card>
)}
```

3. **Hide customer name + address in public view:**
```tsx
{!order.isPublicView && (
  <div>
    <div>Customer: {order.customerName}</div>
    <div>Address: {order.deliveryAddress}, {order.city}</div>
  </div>
)}
```

4. **Show items count only in public view, not item detail:**
```tsx
{order.isPublicView ? (
  <div className="text-sm text-muted-foreground">
    {order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
  </div>
) : (
  <ItemsTable items={order.items} />
)}
```

5. **Show login prompt in public view:**
```tsx
{order.isPublicView && (
  <Alert>
    <AlertDescription>
      Log in to view full order details, prices, and download invoice.
    </AlertDescription>
  </Alert>
)}
```

### Verify

- Place order as B2C user. Copy tracking link. Open in incognito → see only status timeline + ETA + item count. No prices, no address, no print button.
- Log in as same user, refresh tracking page → full invoice + print + reorder visible.
- Different user logs in, opens link → public view (since they're not the owner).
- Admin opens link → full view.

---

## R4-FIX-2 — B2B credit management for admin

**Problem:** B2B credit limit fields exist on customer.business but there's no admin UI to set them. Customers register → stuck in "pending approval" forever.

### Backend changes

**File:** `artifacts/api-server/src/routes/customers.ts`

Add a dedicated credit-management endpoint (admin-only). Doing it via a separate endpoint instead of reusing PUT /customers/:id makes audit logging cleaner and prevents accidentally clobbering business name/CR/VAT.

Add after the existing customer routes:

```ts
// PUT /customers/:id/credit — admin only, B2B credit management
router.put("/customers/:id/credit", requireAdmin, auditLog("update", "customer_credit"), async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });

  const { allowCredit, creditLimit, approvalStatus, approvalNotes } = req.body as {
    allowCredit?: boolean;
    creditLimit?: number;
    approvalStatus?: "pending" | "approved" | "rejected";
    approvalNotes?: string;
  };

  // Validate
  if (approvalStatus && !["pending", "approved", "rejected"].includes(approvalStatus)) {
    return res.status(400).json({ error: "Invalid approval status" });
  }
  if (creditLimit !== undefined && (Number(creditLimit) < 0 || Number(creditLimit) > 10_000_000)) {
    return res.status(400).json({ error: "Credit limit out of range (0 - 10,000,000)" });
  }

  // Fetch existing customer
  const { data: cust } = await sb.from("customers").select("type, business").eq("id", req.params.id).maybeSingle();
  if (!cust) return res.status(404).json({ error: "Customer not found" });
  if (cust.type !== "b2b") return res.status(400).json({ error: "Credit only available for B2B customers" });

  const session = (req as any).session;
  const existingBiz = (cust.business as Record<string, unknown> | null) ?? {};

  const updatedBiz = {
    ...existingBiz,
    allowCredit: allowCredit ?? existingBiz.allowCredit ?? false,
    creditLimit: creditLimit !== undefined ? Number(creditLimit) : existingBiz.creditLimit ?? 0,
    approvalStatus: approvalStatus ?? existingBiz.approvalStatus ?? "pending",
    approvalNotes: approvalNotes ?? existingBiz.approvalNotes ?? null,
    approvedBy: approvalStatus === "approved" ? session.sub : (existingBiz.approvedBy ?? null),
    approvedAt: approvalStatus === "approved" ? new Date().toISOString() : (existingBiz.approvedAt ?? null),
  };

  const { data, error } = await sb.from("customers")
    .update({ business: updatedBiz })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  // Return the credit status from the view for consistency
  const { data: status } = await sb
    .from("v_b2b_credit_status")
    .select("*")
    .eq("customer_id", req.params.id)
    .maybeSingle();

  return res.json({
    customer: data,
    creditStatus: status ?? null,
  });
});

// GET /customers/:id/credit — admin/sales view of customer's credit status
router.get("/customers/:id/credit", requireRole("admin", "sales"), async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });

  const { data: cust } = await sb.from("customers")
    .select("id, name, type, business")
    .eq("id", req.params.id)
    .maybeSingle();
  if (!cust) return res.status(404).json({ error: "Customer not found" });
  if (cust.type !== "b2b") return res.status(400).json({ error: "Credit only available for B2B customers" });

  // Get current outstanding credit from DB function
  const { data: outstanding } = await sb.rpc("customer_outstanding_credit", { p_customer_id: req.params.id });

  const biz = (cust.business as any) ?? {};
  const limit = Number(biz.creditLimit ?? 0);
  const out = Number(outstanding ?? 0);

  return res.json({
    customerId: cust.id,
    customerName: cust.name,
    allowCredit: biz.allowCredit ?? false,
    creditLimit: limit,
    approvalStatus: biz.approvalStatus ?? "pending",
    approvalNotes: biz.approvalNotes ?? null,
    approvedBy: biz.approvedBy ?? null,
    approvedAt: biz.approvedAt ?? null,
    outstanding: out,
    available: Math.max(0, limit - out),
  });
});
```

Imports needed (verify already present):
```ts
import { requireRole, requireAdmin, requireAuth } from "../middlewares/requireAuth.js";
import { auditLog } from "../middlewares/auditLog.js";
```

### Frontend changes

**File:** `artifacts/venture-supply/src/pages/AdminPages.tsx`

In the `AdminCustomersPage` component, find the customer detail view (the modal or expanded row when admin clicks a customer). For B2B customers, add a "Credit Management" section.

Add a new component at module scope (NOT inside AdminCustomersPage — same rule as CouponForm):

```tsx
function B2BCreditPanel({ customerId }: { customerId: string }) {
  const [credit, setCredit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    apiFetch<any>(`/customers/${customerId}/credit`)
      .then((d) => { if (!cancelled) setCredit(d); })
      .catch((e) => { if (!cancelled) toast({ title: "Failed to load credit", description: e.message, variant: "destructive" }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [customerId, toast]);

  if (loading) return <div className="p-4 text-sm text-muted-foreground">Loading credit info…</div>;
  if (!credit) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await apiFetch<any>(`/customers/${customerId}/credit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowCredit: credit.allowCredit,
          creditLimit: Number(credit.creditLimit),
          approvalStatus: credit.approvalStatus,
          approvalNotes: credit.approvalNotes,
        }),
      });
      setCredit({ ...credit, ...updated.creditStatus });
      toast({ title: "Credit settings updated" });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>B2B Credit Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Allow Credit</Label>
            <Switch
              checked={credit.allowCredit}
              onCheckedChange={(v: boolean) => setCredit({ ...credit, allowCredit: v })}
            />
          </div>
          <div>
            <Label>Approval Status</Label>
            <Select
              value={credit.approvalStatus}
              onValueChange={(v: string) => setCredit({ ...credit, approvalStatus: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Credit Limit (SAR)</Label>
          <Input
            type="number"
            value={credit.creditLimit}
            onChange={(e) => setCredit({ ...credit, creditLimit: e.target.value })}
            disabled={!credit.allowCredit}
          />
        </div>

        <div>
          <Label>Approval Notes</Label>
          <Textarea
            value={credit.approvalNotes ?? ""}
            onChange={(e) => setCredit({ ...credit, approvalNotes: e.target.value })}
            placeholder="Internal notes about this approval"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 p-3 bg-muted rounded-md text-sm">
          <div>
            <div className="text-muted-foreground">Outstanding</div>
            <div className="font-semibold">SAR {Number(credit.outstanding).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Available</div>
            <div className="font-semibold text-green-700">SAR {Number(credit.available).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Limit</div>
            <div className="font-semibold">SAR {Number(credit.creditLimit).toFixed(2)}</div>
          </div>
        </div>

        {credit.approvedAt && (
          <div className="text-xs text-muted-foreground">
            Last approved: {new Date(credit.approvedAt).toLocaleString()}
          </div>
        )}

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Credit Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
```

In `AdminCustomersPage`, when displaying a customer's detail view, render the panel for B2B only:
```tsx
{customer.type === "b2b" && <B2BCreditPanel customerId={customer.id} />}
```

### Optional: dedicated "B2B Credit" page in admin sidebar

Create new export in same file:
```tsx
export function AdminB2BCreditPage() {
  const { data: customers, isLoading } = useQuery({
    queryKey: ["b2b-credit-customers"],
    queryFn: () => apiFetch<any[]>("/customers?type=b2b"),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">B2B Credit Management</h1>
      {isLoading ? (
        <div>Loading…</div>
      ) : (
        <div className="space-y-4">
          {(customers ?? []).map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle>{c.name}</CardTitle>
                <div className="text-sm text-muted-foreground">{c.business?.name}</div>
              </CardHeader>
              <CardContent>
                <B2BCreditPanel customerId={c.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

Wire into router (likely `App.tsx` or admin route file):
```tsx
<Route path="/admin/b2b-credit" component={AdminB2BCreditPage} />
```

Add to admin sidebar nav (wherever AdminLayout's nav items are defined):
```tsx
{ to: "/admin/b2b-credit", label: "B2B Credit", icon: Banknote }
```

### Verify

1. Register B2B customer → admin opens customer detail → "B2B Credit Management" panel visible.
2. Toggle Allow Credit on → set limit to 5000 → status=approved → Save → success toast.
3. Customer logs in → checkout shows "Approved (5000 SAR available)".
4. Place 2000 SAR credit order → succeeds.
5. Refresh credit panel → outstanding=2000, available=3000.
6. Try to place 4000 SAR credit order → 402 "Credit limit exceeded. Available: 3000".
7. Admin sets approvalStatus=rejected → save → next checkout shows "Credit not approved".
8. Audit log: `select * from audit_log where entity = 'customer_credit'` shows the changes.

---

# FINAL CHECKLIST

After both fixes done:

**R4-FIX-1 invoice privacy:**
- [ ] Anon GET /api/orders/o-xxx returns minimal data (status + ETA + item count, no prices)
- [ ] Logged-in owner GET same → full data
- [ ] Different user logged in → minimal data
- [ ] Admin → full data
- [ ] Frontend hides print/reorder/prices/address when isPublicView=true

**R4-FIX-2 B2B credit:**
- [ ] PUT /customers/:id/credit as admin → updates business JSONB
- [ ] PUT as sales → 403
- [ ] GET /customers/:id/credit returns outstanding/available from DB
- [ ] B2BCreditPanel renders for B2B customers only
- [ ] Setting approvalStatus=approved + saving → audit_log row created
- [ ] Credit-payment order respects new limit

Push to GitHub. Reply with 2 commit hashes + checklist.

# END OF PROMPT
