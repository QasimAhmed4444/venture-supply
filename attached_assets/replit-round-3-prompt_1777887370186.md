# Replit Agent — Round 3 (Security + DB Integration)

Paste this entire file to Replit Agent. Combines 14 security fixes from round 2 + 6 new DB-integration fixes.

---

# RULES

1. DO NOT modify the database. Schema, RPCs, triggers, views all already exist with these EXACT names + signatures:

**RPC functions** (all accept dual param names — both work):
- `increment_coupon_uses(p_code text, coupon_code text)` → boolean
- `decrement_coupon_uses(p_code text, coupon_code text)` → void
- `delete_staff_safely(p_id text, staff_id text)` → boolean
- `dashboard_stats(p_salesperson_id text)` → jsonb
- `customer_outstanding_credit(p_customer_id text)` → numeric

**Tables** (already created):
- `audit_log` (id, at, actor_id, actor_role, action, entity, entity_id, before, after, meta, ip, user_agent)
- `customer_assignments` (customer_id, salesperson_id, is_primary, commission_split, assigned_at, assigned_by, notes)
- `order_items` (id, order_id, product_id, product_name, pack_size, quantity, unit_price, line_total, category_id, brand_id, created_at)

**Views** (read-only):
- `v_top_products`, `v_b2b_credit_status`, `v_customer_salespersons`, `v_salesperson_performance`

**Trigger** (auto-blocks bad status transitions at DB level):
- `enforce_order_status_transition` on orders table — blocks delivered→anything, cancelled→anything, skipping steps, backwards moves. **You don't need to add transition logic in code; DB enforces it. Just handle the resulting error gracefully.**

2. DO NOT add new dependencies.
3. ONE COMMIT per fix. Format: `fix(R3-NB-X): description`.
4. Verify each fix before committing. If verification fails, fix and retry.
5. Stop and ask if a fix touches >3 files unexpectedly.

---

# PART A — SECURITY FIXES (14)

## R3-NB-6 — Coupon RPC param works either way

**File:** `artifacts/api-server/src/routes/orders.ts` (~line 199)

DB now accepts both `coupon_code` and `p_code`. No code change needed BUT clean it up to use the correct name:

**Find:**
```ts
await sb.rpc("increment_coupon_uses", { coupon_code: row.coupon_code as string });
```

**Replace with:**
```ts
await sb.rpc("increment_coupon_uses", { p_code: row.coupon_code as string });
```

**Verify:** place test order with coupon WELCOME15. SELECT uses_count from coupons WHERE code='WELCOME15' increments by 1.

---

## R3-NB-19 — Fix delete_staff RPC + self-delete guard

**File:** `artifacts/api-server/src/routes/staff.ts` (DELETE handler, ~line 107)

**Replace entire DELETE handler with:**
```ts
router.delete("/staff/:id", async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });

  const session = (req as any).session;
  if (req.params.id === session?.sub) {
    return res.status(400).json({ error: "Cannot delete your own account" });
  }

  const { data, error } = await sb.rpc("delete_staff_safely", { p_id: req.params.id });
  if (error) return res.status(400).json({ error: error.message });
  if (data === false) return res.status(409).json({ error: "Cannot remove the last admin or staff not found" });
  return res.status(204).send();
});
```

**Verify:** delete sales staff → 204. Self-delete → 400. Last admin → 409.

---

## R3-NB-18 — Forgot-password leak fix (CRITICAL)

**File:** `artifacts/api-server/src/routes/auth.ts` (~line 215)

**Find:**
```ts
return res.json({
  ok: true,
  token,
  message: "Reset token issued. Use it within 1 hour.",
});
```

**Replace with:**
```ts
const resetUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
console.log(`[RESET] Password reset link for ${lower}: ${resetUrl}`);
// TODO: wire to email provider (Resend/SendGrid). Token logged to server console for now.
return res.json({ ok: true, message: "If that address is registered, a reset link has been sent." });
```

**Verify:** POST /auth/forgot-password → response has NO `token` field. Server console logs the URL.

---

## R3-NB-9 — Sanitize order ID input

**File:** `artifacts/api-server/src/routes/orders.ts` (GET /orders/:id, ~line 78)

**Find:**
```ts
const { data } = await sb
  .from("orders")
  .select("*")
  .or(`id.eq.${req.params.id},tracking_id.eq.${req.params.id}`)
  .maybeSingle();
```

**Replace with:**
```ts
const raw = String(req.params.id ?? "");
if (!/^[A-Za-z0-9_-]{1,80}$/.test(raw)) {
  return res.status(400).json({ error: "Invalid order ID" });
}
let { data } = await sb.from("orders").select("*").eq("id", raw).maybeSingle();
if (!data) {
  ({ data } = await sb.from("orders").select("*").eq("tracking_id", raw).maybeSingle());
}
```

**Verify:** GET /orders/abc,placed_at.gte.X → 400.

---

## R3-NB-10 — CORS allowlist

**File:** `artifacts/api-server/src/app.ts` (~line 67)

**Find:** `app.use(cors());`

**Replace with:**
```ts
const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS: origin not allowed"));
  },
  credentials: false,
}));
```

Tell user to add `CORS_ORIGINS` to Replit Secrets when ready.

**Verify:** dev (no env) still works. With CORS_ORIGINS set, other origins blocked.

---

## R3-NB-1to5 — Role-gate body fields on order POST

**File:** `artifacts/api-server/src/routes/orders.ts` (POST /orders, ~line 110)

Add at top of file:
```ts
import { randomBytes, randomUUID } from "node:crypto";
```

In POST handler, AFTER fetching customerId/autoSalespersonId and BEFORE pricing logic, add:
```ts
const isStaff = session.role === "admin" || session.role === "sales";

const customerType = isStaff
  ? ((body.customerType as string | undefined) ?? "b2c")
  : (session.role === "b2b" ? "b2b" : "b2c");
const isB2B = customerType === "b2b";

let salespersonId: string | null = null;
if (isStaff) {
  salespersonId = (body.salespersonId as string | undefined) ?? null;
} else if (autoSalespersonId) {
  salespersonId = autoSalespersonId;
}

const status = isStaff ? ((body.status as string | undefined) ?? "new") : "new";

const history = isStaff && Array.isArray(body.history)
  ? body.history
  : [{ status, at: new Date().toISOString(), by: isStaff ? session.sub : "system" }];

const orderId = `o-${randomUUID()}`;
const trackingId = `VS-O-${randomBytes(4).toString("hex").toUpperCase()}`;
const placedAt = isStaff && body.placedAt ? body.placedAt : new Date().toISOString();
```

In existing pricing logic, find:
```ts
const customerType = (body.customerType as string | undefined) ?? (session.role === "b2b" || session.role === "sales" ? "b2b" : "b2c");
const isB2B = customerType === "b2b";
```
DELETE these (already declared above).

In the insert row, replace these fields:
```ts
id: orderId,                           // was: b.id
tracking_id: trackingId,                // was: b.trackingId
customer_type: customerType,            // unchanged
salesperson_id: salespersonId,          // was: b.salespersonId ?? null
status,                                 // was: b.status ?? "new"
placed_at: placedAt,                    // was: b.placedAt ?? new Date().toISOString()
history,                                // was: b.history ?? [{...}]
```

**Verify:** B2C POST with body customerType/salespersonId/status → server ignores, uses session-derived. Admin POST → values from body accepted.

---

## R3-NB-7+8+14 — Stock + audience + items cap validation

**File:** `artifacts/api-server/src/routes/orders.ts` (in pricing items loop)

**Find:**
```ts
const { data: products } = await sb.from("products").select("id, b2c_price, b2b_price, packs").in("id", productIds);
```

**Replace with:**
```ts
if (rawItems.length > 50) {
  return res.status(400).json({ error: "Too many items (max 50 per order)" });
}
const { data: products } = await sb.from("products").select("id, en_name, b2c_price, b2b_price, packs, stock_qty, stock_status, audience").in("id", productIds);
```

In the `pricedItems = rawItems.map(...)` block, wrap in try/catch. Inside the map, before unitPrice calc:
```ts
if (prod) {
  const qty = Number(it.qty ?? 0);
  if (qty <= 0) throw new Error(`Invalid quantity for ${prod.en_name ?? it.productId}`);
  if (prod.stock_status === "out-of-stock") throw new Error(`${prod.en_name} is out of stock`);
  if (qty > Number(prod.stock_qty ?? 0)) throw new Error(`Only ${prod.stock_qty} of ${prod.en_name} available`);
  if (!isStaff) {
    if (customerType === "b2c" && prod.audience === "b2b") throw new Error(`${prod.en_name} is B2B-only`);
    if (customerType === "b2b" && prod.audience === "b2c") throw new Error(`${prod.en_name} is B2C-only`);
  }
}
```

Wrap the map block:
```ts
try {
  pricedItems = rawItems.map((it) => { /* existing + new validation */ });
} catch (err: any) {
  return res.status(400).json({ error: err?.message ?? "Validation failed" });
}
```

**Verify:** order 1000 of stock-5 product → 400. B2C orders B2B-only → 400. 51 items → 400.

---

## R3-NB-11 — Products GET audience filter

**File:** `artifacts/api-server/src/routes/products.ts` (GET /products, ~line 53)

Add to imports:
```ts
import { verifySessionToken } from "../lib/sessionToken.js";
```

Replace handler start:
```ts
router.get("/products", async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.json([]);

  const auth = req.headers["authorization"];
  let role: string | null = null;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    const session = verifySessionToken(auth.slice(7).trim());
    if (session) role = session.role;
  }

  try {
    let query = sb.from("products").select("*").order("featured", { ascending: false }).order("created_at");

    if (role === "b2b") query = query.in("audience", ["b2b", "both"]);
    else if (role === "admin" || role === "sales") {
      // staff sees all
    } else {
      query = query.in("audience", ["b2c", "both"]);
    }

    if (req.query.category) query = query.eq("category_id", req.query.category as string);
    // ... rest of existing handler unchanged
```

**Verify:** anon GET /products → no B2B-only items. B2B token → no B2C-only. Admin → all.

---

## R3-NB-21 — Remove fallback coupons

**File:** `artifacts/api-server/src/routes/coupons.ts` (~line 9)

DELETE the entire `FALLBACK_COUPONS` array.

In `/coupons/validate`, find:
```ts
const raw = data ?? FALLBACK_COUPONS.find((c) => c.code === code.toUpperCase()) ?? null;
if (error && !raw) return res.status(404).json({ error: "Coupon not found" });
if (!raw) return res.status(404).json({ error: "Coupon not found" });
```

**Replace with:**
```ts
if (error || !data) return res.status(404).json({ error: "Coupon not found" });
const raw = data;
```

**Verify:** GET /coupons/validate?code=FREESHIP → 404 (no longer in DB).

---

## R3-NB-20 — Password min length 8

**File:** `artifacts/api-server/src/routes/auth.ts`

3 places use `< 6`. Find each and replace with `< 8` and update the error message to "at least 8 characters". Locations:
- Register handler
- Change-password handler
- Reset-password handler

**Verify:** register with 7-char password → 400.

---

## R3-NB-26 — Lowercase email in customer admin update

**File:** `artifacts/api-server/src/routes/customers.ts` (PUT, admin branch, ~line 119)

**Find:** `if (b.email !== undefined) payload.email = b.email;`
**Replace:** `if (b.email !== undefined) payload.email = String(b.email).toLowerCase().trim();`

---

## R3-NB-22 — Coupon validate stops returning discount

**File:** `artifacts/api-server/src/routes/coupons.ts` (`/coupons/validate`, ~line 80)

**Find:**
```ts
let discount = 0;
if (coupon.type === "percent") discount = +(orderTotal * coupon.value / 100).toFixed(2);
else if (coupon.type === "fixed") discount = Math.min(coupon.value, orderTotal);
else if (coupon.type === "free_delivery") discount = 0;

return res.json({ ...coupon, discount, freeDelivery: coupon.type === "free_delivery" });
```

**Replace with:**
```ts
return res.json({
  valid: true,
  code: coupon.code,
  type: coupon.type,
  value: coupon.value,
  minOrder: coupon.minOrder,
  enTitle: coupon.enTitle,
  arTitle: coupon.arTitle,
  freeDelivery: coupon.type === "free_delivery",
});
```

**Frontend impact (CheckoutPage.tsx + CartPage.tsx):** wherever the validate response's `discount` field is read, change to show "Coupon applied — discount calculated at checkout". The actual discount appears in the order POST response.

**Verify:** validate response has no discount field. Order POST response includes server-computed discount.

---

## R3-NB-25 — Bootstrap timing fix

**File:** `artifacts/api-server/src/routes/auth.ts` (`/auth/bootstrap-admin`, ~line 285)

**Find:**
```ts
if (typeof provided !== "string" || provided.length !== expectedToken.length) {
  return res.status(401).json({ error: "Invalid bootstrap token" });
}
const a = Buffer.from(provided);
const b = Buffer.from(expectedToken);
let diff = 0;
for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
```

**Replace with:**
```ts
if (typeof provided !== "string") {
  return res.status(401).json({ error: "Invalid bootstrap token" });
}
const PAD = 64;
const aBuf = Buffer.from(provided.padEnd(PAD, "\0").slice(0, PAD));
const bBuf = Buffer.from(expectedToken.padEnd(PAD, "\0").slice(0, PAD));
let diff = provided.length !== expectedToken.length ? 1 : 0;
for (let i = 0; i < PAD; i++) diff |= aBuf[i]! ^ bBuf[i]!;
```

---

## R3-NB-29 — Sales cant create credit-enabled customers

**File:** `artifacts/api-server/src/routes/customers.ts` (POST, ~line 56)

After `const b = req.body;` add:
```ts
const session = (req as any).session;
if ((b.allowCredit || b.creditLimit) && session.role !== "admin") {
  return res.status(403).json({ error: "Credit settings can only be set by admin" });
}
```

---

# PART B — DB INTEGRATION FIXES (6)

These hook your backend up to new DB features I built today.

## R3-DB-1 — Use dashboard_stats RPC instead of JS reduce

**File:** `artifacts/api-server/src/routes/dashboard.ts`

**Replace the entire GET /dashboard/stats handler with:**
```ts
router.get("/dashboard/stats", requireAuth, async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });

  const session = (req as any).session;
  // Sales reps see only their numbers, admin sees global
  const salespersonId = session.role === "sales"
    ? (await sb.from("staff").select("salesperson_id").eq("id", session.sub).maybeSingle()).data?.salesperson_id ?? null
    : null;

  const { data, error } = await sb.rpc("dashboard_stats", { p_salesperson_id: salespersonId });
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data ?? {});
});
```

Delete the JS `.reduce()` aggregation logic — it's now O(1) at the DB.

**Verify:** GET /dashboard/stats as admin → returns global numbers. As sales → scoped to their orders only.

---

## R3-DB-2 — Order POST writes to order_items table

**File:** `artifacts/api-server/src/routes/orders.ts` (POST, after order insert succeeds)

After the orders.insert succeeds and BEFORE the coupon increment, add:
```ts
// Mirror items into flat order_items table for analytics
if (data && pricedItems.length > 0) {
  const flatItems = pricedItems.map((it: any) => ({
    order_id: data.id,
    product_id: it.productId,
    product_name: it.enName ?? it.productName ?? null,
    pack_size: it.packSize ?? null,
    quantity: Number(it.qty ?? it.quantity ?? 1),
    unit_price: Number(it.unitPrice ?? 0),
  }));
  await sb.from("order_items").insert(flatItems);
}
```

Don't fail the order if this insert fails — it's a denormalization, not source of truth. Wrap in try/catch.

**Verify:** place order. SELECT * FROM order_items WHERE order_id = '<new-id>' shows rows.

---

## R3-DB-3 — Status transition error handling

**File:** `artifacts/api-server/src/routes/orders.ts` (PUT /orders/:id)

DB trigger now blocks illegal transitions (delivered→anything, skipping steps, backwards). Backend needs to surface friendly errors.

**Find the existing PUT handler and wrap the update:**
```ts
const { data, error } = await sb.from("orders").update(updates).eq("id", req.params.id).select().single();
if (error) {
  // DB trigger sends raise exception with errcode 23514
  if (error.code === "23514" || error.message?.includes("Illegal status transition") || error.message?.includes("terminal state")) {
    return res.status(409).json({ error: error.message });
  }
  return res.status(400).json({ error: error.message });
}
```

**Verify:**
- Try to set delivered order back to preparing → 409 "terminal state".
- Try new → delivered direct → 409 "Illegal transition".
- Valid new → confirmed → 200.

---

## R3-DB-4 — B2B credit check via DB function

**File:** `artifacts/api-server/src/routes/orders.ts` (POST, before order insert)

When `paymentMethod === 'credit'`, replace the existing JS-based credit math with the DB function.

Find any existing credit-limit logic and replace with:
```ts
if (body.paymentMethod === "credit") {
  if (customerType !== "b2b") return res.status(403).json({ error: "Credit only for B2B" });
  if (!customerId) return res.status(401).json({ error: "Login required for credit orders" });

  // Get credit status from view (single source of truth)
  const { data: creditStatus } = await sb
    .from("v_b2b_credit_status")
    .select("*")
    .eq("customer_id", customerId)
    .maybeSingle();

  if (!creditStatus || !creditStatus.allow_credit) {
    return res.status(403).json({ error: "Credit not approved for this account" });
  }
  if (Number(creditStatus.outstanding ?? 0) + total > Number(creditStatus.credit_limit ?? 0)) {
    const available = Number(creditStatus.credit_limit ?? 0) - Number(creditStatus.outstanding ?? 0);
    return res.status(402).json({ error: `Credit limit exceeded. Available: ${available.toFixed(2)} SAR` });
  }
}
```

**Verify:** B2B customer with 500 limit, 400 outstanding, places 200 order → 402.

---

## R3-DB-5 — Audit log middleware

**New file:** `artifacts/api-server/src/middlewares/auditLog.ts`
```ts
import type { Request, Response, NextFunction } from "express";
import { getSupabase } from "../lib/supabase.js";

export function auditLog(action: string, entity: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const session = (req as any).session;
    res.on("finish", () => {
      if (res.statusCode < 200 || res.statusCode >= 300) return;
      const sb = getSupabase();
      if (!sb) return;
      sb.from("audit_log").insert({
        actor_id: session?.sub ?? null,
        actor_role: session?.role ?? null,
        action,
        entity,
        entity_id: req.params.id ?? (res as any).locals?.createdId ?? null,
        before: (res as any).locals?.before ?? null,
        after: req.body ?? null,
        ip: req.ip,
        user_agent: req.headers["user-agent"] as string | undefined,
      }).then(({ error }) => {
        if (error) console.error("audit_log insert failed:", error.message);
      });
    });
    next();
  };
}
```

**Apply to mutating routes:**

In `routes/orders.ts`:
```ts
import { auditLog } from "../middlewares/auditLog.js";
router.post("/orders", requireAuth, auditLog("create", "order"), async (req, res) => { ... });
router.put("/orders/:id", requireRole("admin","sales"), auditLog("update", "order"), async (req, res) => { ... });
router.delete("/orders/:id", requireAdmin, auditLog("delete", "order"), async (req, res) => { ... });
```

Same for `staff.ts`, `customers.ts`, `coupons.ts`, `products.ts` — wrap POST/PUT/DELETE handlers with appropriate `auditLog("...", "...")` call.

**Verify:** create a product as admin → SELECT * FROM audit_log WHERE entity='product' ORDER BY at DESC LIMIT 1 shows the action.

---

## R3-DB-6 — Customer assignments junction table integration

**File:** `artifacts/api-server/src/routes/customers.ts`

**New endpoints:**
```ts
// GET assignments for a customer
router.get("/customers/:id/salespersons", requireAuth, async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  const { data, error } = await sb
    .from("v_customer_salespersons")
    .select("*")
    .eq("customer_id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data ?? []);
});

// POST assign a salesperson to customer (admin only)
router.post("/customers/:id/salespersons", requireAdmin, async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  const session = (req as any).session;
  const { salespersonId, isPrimary, commissionSplit, notes } = req.body;
  if (!salespersonId) return res.status(400).json({ error: "salespersonId required" });

  // If new primary, demote existing primaries
  if (isPrimary) {
    await sb.from("customer_assignments")
      .update({ is_primary: false })
      .eq("customer_id", req.params.id);
  }

  const { data, error } = await sb.from("customer_assignments").insert({
    customer_id: req.params.id,
    salesperson_id: salespersonId,
    is_primary: !!isPrimary,
    commission_split: Number(commissionSplit ?? 100),
    assigned_by: session.sub,
    notes: notes ?? null,
  }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json(data);
});

// DELETE remove assignment (admin only)
router.delete("/customers/:id/salespersons/:salespersonId", requireAdmin, async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  const { error } = await sb.from("customer_assignments")
    .delete()
    .eq("customer_id", req.params.id)
    .eq("salesperson_id", req.params.salespersonId);
  if (error) return res.status(400).json({ error: error.message });
  return res.status(204).send();
});
```

**Update the sales `GET /customers` scope** to use junction table instead of `assigned_salesperson_id`. Find:
```ts
if (session.role === "sales") {
  const { data: staff } = await sb.from("staff").select("salesperson_id").eq("id", session.sub).maybeSingle();
  const spId = (staff?.salesperson_id as string | null) ?? null;
  if (!spId) return res.json([]);
  q = q.eq("assigned_salesperson_id", spId);
}
```

**Replace with:**
```ts
if (session.role === "sales") {
  const { data: staff } = await sb.from("staff").select("salesperson_id").eq("id", session.sub).maybeSingle();
  const spId = (staff?.salesperson_id as string | null) ?? null;
  if (!spId) return res.json([]);
  // Get customer IDs assigned to this rep via junction table
  const { data: assignments } = await sb
    .from("customer_assignments")
    .select("customer_id")
    .eq("salesperson_id", spId);
  const customerIds = (assignments ?? []).map(a => a.customer_id);
  if (customerIds.length === 0) return res.json([]);
  q = q.in("id", customerIds);
}
```

**Verify:** assign 2 reps to a customer via POST endpoint. Both reps see the customer in their /customers list.

---

# FINAL CHECKLIST

After all 20 fixes done. Report PASS/FAIL each:

**Security (14):**
- [ ] R3-NB-6: order with WELCOME15 increments uses_count by 1
- [ ] R3-NB-19: admin can delete sales staff (204), self-delete returns 400, last admin returns 409
- [ ] R3-NB-18: forgot-password response has NO `token` field
- [ ] R3-NB-9: GET /orders/abc,placed_at.gte.X returns 400
- [ ] R3-NB-10: CORS allowlist active when CORS_ORIGINS env set
- [ ] R3-NB-1to5: B2C body customerType/salespersonId/status overrides ignored
- [ ] R3-NB-7+8+14: stock/audience/items-cap validations work
- [ ] R3-NB-11: anon GET /products returns no B2B-only items
- [ ] R3-NB-21: GET /coupons/validate?code=FREESHIP → 404
- [ ] R3-NB-20: register with 7-char password → 400
- [ ] R3-NB-26: admin updates customer email FOO@x → DB stores foo@x
- [ ] R3-NB-22: coupon validate response has no discount field
- [ ] R3-NB-25: bootstrap with wrong-length token → 401 (timing-safe)
- [ ] R3-NB-29: sales POST customer with allowCredit → 403

**DB integration (6):**
- [ ] R3-DB-1: GET /dashboard/stats as admin returns rich object from RPC
- [ ] R3-DB-2: order POST creates rows in order_items table
- [ ] R3-DB-3: PUT /orders/:id setting delivered→preparing returns 409
- [ ] R3-DB-4: B2B credit order over limit returns 402 with available SAR
- [ ] R3-DB-5: audit_log gets a row when admin creates a product
- [ ] R3-DB-6: GET /customers/:id/salespersons returns array, sales sees junction-assigned customers

Push to GitHub. Reply with 20 commit hashes + checklist results.

# END OF PROMPT
