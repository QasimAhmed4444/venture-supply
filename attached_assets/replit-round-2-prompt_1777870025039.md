# Round 2 — Replit Agent Fixes

Paste this entire file to Replit. 14 fixes. Role-gated where needed. Same rules as round 1: no DB changes, one commit per fix, verify before commit.

---

# RULES

1. DO NOT modify database. RPC functions exist with these EXACT signatures:
   - `increment_coupon_uses(p_code text)` returns boolean
   - `decrement_coupon_uses(p_code text)` returns void
   - `delete_staff_safely(p_id text)` returns boolean
2. DO NOT add new dependencies.
3. ONE COMMIT per fix. Format: `fix(R2-NB-X): description`.
4. Verify before committing. If verification fails, fix and retry.
5. Stop and ask if any fix touches >3 files or feels ambiguous.

---

# THE FIXES

## R2-NB-6 — Fix coupon increment RPC param name

**File:** `artifacts/api-server/src/routes/orders.ts` (POST /orders, ~line 199)

**Problem:** RPC called with wrong param name. Silently fails. Coupon `uses_count` never increments.

**Find:**
```ts
await sb.rpc("increment_coupon_uses", { coupon_code: row.coupon_code as string });
```

**Replace with:**
```ts
await sb.rpc("increment_coupon_uses", { p_code: row.coupon_code as string });
```

**Verify:** place test order with coupon `WELCOME15`. Check Supabase Editor: `SELECT code, uses_count FROM coupons WHERE code='WELCOME15';` — count should increment by 1.

---

## R2-NB-19 — Fix delete_staff RPC param name

**File:** `artifacts/api-server/src/routes/staff.ts` (DELETE /staff/:id, ~line 107)

**Problem:** RPC called with `staff_id`, function expects `p_id`. Admin deletion broken.

**Find:**
```ts
const { error } = await sb.rpc("delete_staff_safely", { staff_id: req.params.id });
```

**Replace with:**
```ts
const session = (req as any).session;
if (req.params.id === session?.sub) {
  return res.status(400).json({ error: "Cannot delete your own account" });
}
const { data, error } = await sb.rpc("delete_staff_safely", { p_id: req.params.id });
if (data === false) {
  return res.status(409).json({ error: "Cannot delete the last admin" });
}
```

Keep the existing error handling below. Adjust so success returns 204.

**Verify:**
- Delete a sales staff → 204 success. Confirm row gone in DB.
- Try to delete the only admin → 409.
- Try to delete yourself → 400.

---

## R2-NB-18 — Forgot-password account takeover (CRITICAL)

**File:** `artifacts/api-server/src/routes/auth.ts` (forgot-password handler, ~line 215)

**Problem:** server returns reset token in HTTP response. Anyone hits endpoint with admin email → gets working reset token → owns admin account in 30 seconds.

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
const resetUrl = `${process.env.APP_URL ?? ""}/reset-password?token=${token}`;
console.log(`[RESET] Password reset link for ${lower}: ${resetUrl}`);
// TODO: wire to email provider (Resend/SendGrid). Token is logged to server console for now.
return res.json({ ok: true, message: "If that address is registered, a reset link has been sent." });
```

Also change the "no user" path to return identical message (already does — verify):
```ts
if (!staff) {
  return res.json({ ok: true, message: "If that address is registered, a reset link has been sent." });
}
```

**Verify:**
- POST `/api/auth/forgot-password { email: "admin@venturesupply.sa" }` → response contains NO `token` field.
- Check server logs for the reset URL line.
- Use that URL → reset works → log in with new password.

---

## R2-NB-9 — Sanitize order ID input (PostgREST filter injection)

**File:** `artifacts/api-server/src/routes/orders.ts` (GET /orders/:id, ~line 78)

**Problem:** `req.params.id` interpolated raw into PostgREST `or` filter.

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

**Verify:**
- `curl http://localhost:5000/api/orders/o-something` → 200 or 404
- `curl http://localhost:5000/api/orders/abc,placed_at.gte.2020-01-01` → 400

---

## R2-NB-10 — CORS allowlist

**File:** `artifacts/api-server/src/app.ts` (~line 67)

**Find:**
```ts
app.use(cors());
```

**Replace with:**
```ts
const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true); // dev fallback
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS: origin not allowed"));
  },
  credentials: false,
}));
```

Tell user to add `CORS_ORIGINS` to Replit Secrets when ready for prod.

**Verify:** dev still works with no env var. With `CORS_ORIGINS=https://example.com`, requests from other origins blocked.

---

## R2-NB-1+2+3+4+5 — Role-gate body fields on order POST

**File:** `artifacts/api-server/src/routes/orders.ts` (POST /orders, ~line 110)

**Problem:** customer can override `customerType`, `salespersonId`, `status`, `history`, `placedAt`, `id`, `trackingId` via request body. Admin/sales legitimately need to set these, customers don't.

**Logic to apply:**

In the POST /orders handler, after fetching `customerId` and BEFORE the pricing logic, add role-gating block:

```ts
const isStaff = session.role === "admin" || session.role === "sales";

// Customer type: staff can specify, customer derives from session
const customerType = isStaff
  ? ((body.customerType as string | undefined) ?? "b2c")
  : (session.role === "b2b" ? "b2b" : "b2c");
const isB2B = customerType === "b2b";

// Salesperson: staff can specify, customer auto-assigned from their record
let salespersonId: string | null = null;
if (isStaff) {
  salespersonId = (body.salespersonId as string | undefined) ?? null;
} else {
  // customer or guest — auto-assign from customer record only
  if (autoSalespersonId) salespersonId = autoSalespersonId;
}

// Status: staff can override (e.g. confirmed orders), customer always 'new'
const status = isStaff ? ((body.status as string | undefined) ?? "new") : "new";

// History: staff can supply (backfill imports), customer always system-generated
const history = isStaff && Array.isArray(body.history)
  ? body.history
  : [{ status, at: new Date().toISOString(), by: isStaff ? session.sub : "system" }];

// Order ID and tracking ID: server always generates (no body override)
const orderId = `o-${crypto.randomUUID()}`;
const trackingId = `VS-O-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

// placed_at: staff can backdate, customer always now
const placedAt = isStaff && body.placedAt
  ? body.placedAt
  : new Date().toISOString();
```

Add at top of file:
```ts
import { randomBytes, randomUUID } from "node:crypto";
```

Replace these in the existing pricing logic and insert row:

In pricing logic, find:
```ts
const customerType = (body.customerType as string | undefined) ?? (session.role === "b2b" || session.role === "sales" ? "b2b" : "b2c");
```
Remove (replaced by block above).

In the insert row, find and replace:
```ts
id: b.id,                              // → id: orderId,
tracking_id: b.trackingId,              // → tracking_id: trackingId,
customer_type: customerType,            // unchanged
salesperson_id: b.salespersonId ?? null,// → salesperson_id: salespersonId,
status: b.status ?? "new",              // → status,
placed_at: b.placedAt ?? new Date()...  // → placed_at: placedAt,
history: b.history ?? [...]             // → history,
```

**Verify:**
- B2C customer POST `/orders { customerType: "b2b", salespersonId: "sp-rival", status: "delivered", history: [fake] }` → server ignores all 4, uses session-derived values.
- Admin POST same payload → values from body accepted.

---

## R2-NB-7+8+14 — Stock check, audience check, items cap

**File:** `artifacts/api-server/src/routes/orders.ts` (POST /orders, in the pricing items loop ~line 130)

**Problem:** no stock validation, no audience validation, no items length cap. F-API-2 spec required all three.

In the rawItems loop, expand the product fetch to include stock + audience:

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

In the items map, before `unitPrice` calc, add:
```ts
if (prod) {
  const qty = Number(it.qty ?? 0);
  if (qty <= 0) {
    throw new Error(`Invalid quantity for ${prod.en_name ?? it.productId}`);
  }
  if (prod.stock_status === "out-of-stock") {
    throw new Error(`${prod.en_name} is out of stock`);
  }
  if (qty > Number(prod.stock_qty ?? 0)) {
    throw new Error(`Only ${prod.stock_qty} of ${prod.en_name} available`);
  }
  // Audience check — customer cant buy off-audience products. Staff can place mixed orders.
  if (!isStaff) {
    if (customerType === "b2c" && prod.audience === "b2b") {
      throw new Error(`${prod.en_name} is B2B-only`);
    }
    if (customerType === "b2b" && prod.audience === "b2c") {
      throw new Error(`${prod.en_name} is B2C-only`);
    }
  }
}
```

Wrap the existing `pricedItems = rawItems.map(...)` in a try/catch:
```ts
try {
  pricedItems = rawItems.map((it) => {
    // ... existing logic + new validation block above
  });
} catch (err: any) {
  return res.status(400).json({ error: err?.message ?? "Validation failed" });
}
```

**Verify:**
- B2C user orders product with `audience='b2b'` → 400 "B2B-only".
- Order 1000 of a product with stock_qty=5 → 400 "Only 5 available".
- Order with 51 items → 400 "max 50".

---

## R2-NB-11 — Products GET audience filter

**File:** `artifacts/api-server/src/routes/products.ts` (GET /products, ~line 53)

**Problem:** B2C user sees B2B-only products in catalog.

Make GET optionally authenticated to read session role. The route stays public (guests see "both" only).

**Find:**
```ts
router.get("/products", async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.json([]);
  try {
    let query = sb.from("products").select("*").order("featured", { ascending: false }).order("created_at");
    if (req.query.category) query = query.eq("category_id", req.query.category as string);
```

**Replace with:**
```ts
import { verifySessionToken } from "../lib/sessionToken.js";
// (add to imports at top of file if not present)

router.get("/products", async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.json([]);

  // Optional auth — read role if token present, default to public
  const auth = req.headers["authorization"];
  let role: string | null = null;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    const session = verifySessionToken(auth.slice(7).trim());
    if (session) role = session.role;
  }

  try {
    let query = sb.from("products").select("*").order("featured", { ascending: false }).order("created_at");

    // Audience filter: guests + b2c see b2c|both; b2b sees b2b|both; staff sees all
    if (role === "b2b") query = query.in("audience", ["b2b", "both"]);
    else if (role === "admin" || role === "sales") {
      // staff sees everything — no filter
    } else {
      // guest or b2c
      query = query.in("audience", ["b2c", "both"]);
    }

    if (req.query.category) query = query.eq("category_id", req.query.category as string);
```

(rest of handler unchanged)

**Verify:**
- GET /products as anonymous → no b2b-only products in response.
- GET /products with b2b token → no b2c-only products.
- GET /products with admin token → all products.

---

## R2-NB-21 — Remove hardcoded fallback coupons

**File:** `artifacts/api-server/src/routes/coupons.ts` (~line 9)

**Problem:** 5 coupon codes hardcoded as fallback. If admin deletes them in DB, they still work forever.

**Delete entire `FALLBACK_COUPONS` array.**

**Find inside `/coupons/validate` handler:**
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

**Verify:** `GET /api/coupons/validate?code=FREESHIP` → 404 (not in DB). Only `WELCOME15` and `B2B500` work because those are real DB rows.

---

## R2-NB-20 — Password min length 8 (was 6)

**File:** `artifacts/api-server/src/routes/auth.ts`

3 locations use `< 6`. All should be `< 8`.

**Find and replace 3 times:**
```ts
if (password.length < 6) {
  return res.status(400).json({ error: "Password must be at least 6 characters" });
}
```
**To:**
```ts
if (password.length < 8) {
  return res.status(400).json({ error: "Password must be at least 8 characters" });
}
```

In `/auth/reset-password` find:
```ts
if (newPassword.length < 6) {
  return res.status(400).json({ error: "Password must be at least 6 characters" });
}
```
**To:**
```ts
if (newPassword.length < 8) {
  return res.status(400).json({ error: "Password must be at least 8 characters" });
}
```

In `/auth/change-password` find:
```ts
if (newPassword.length < 6) {
  return res.status(400).json({ error: "Password must be at least 6 characters" });
}
```
**To:**
```ts
if (newPassword.length < 8) {
  return res.status(400).json({ error: "Password must be at least 8 characters" });
}
```

**Verify:** register with 7-char password → 400. With 8-char → success.

---

## R2-NB-26 — Lowercase email in admin customer update

**File:** `artifacts/api-server/src/routes/customers.ts` (PUT /customers/:id, ~line 119)

**Find:**
```ts
} else {
  // Admin / sales — full update
  if (b.name !== undefined) payload.name = b.name;
  if (b.email !== undefined) payload.email = b.email;
```

**Replace with:**
```ts
} else {
  // Admin / sales — full update
  if (b.name !== undefined) payload.name = b.name;
  if (b.email !== undefined) payload.email = String(b.email).toLowerCase().trim();
```

**Verify:** admin updates customer email to "FOO@bar.com" → DB stores "foo@bar.com".

---

## R2-NB-22 — Coupon validate stops computing discount

**File:** `artifacts/api-server/src/routes/coupons.ts` (`/coupons/validate` handler, ~line 80)

**Problem:** server returns `discount` based on client-supplied `total`. UI shows wrong preview if client lies. Real order placement re-validates anyway. Just don't return the misleading number.

**Find:**
```ts
const orderTotal = Number(total ?? 0);
if (coupon.minOrder && orderTotal < coupon.minOrder) {
  return res.status(400).json({ error: `Minimum order SAR ${coupon.minOrder} required` });
}

if (coupon.audience !== "both" && coupon.audience !== audience) {
  return res.status(400).json({ error: "Coupon not valid for your account type" });
}

let discount = 0;
if (coupon.type === "percent") discount = +(orderTotal * coupon.value / 100).toFixed(2);
else if (coupon.type === "fixed") discount = Math.min(coupon.value, orderTotal);
else if (coupon.type === "free_delivery") discount = 0;

return res.json({ ...coupon, discount, freeDelivery: coupon.type === "free_delivery" });
```

**Replace with:**
```ts
// minOrder check still useful as a UX hint, but accept missing total
const orderTotal = Number(total ?? 0);
if (coupon.minOrder && orderTotal > 0 && orderTotal < coupon.minOrder) {
  return res.status(400).json({ error: `Minimum order SAR ${coupon.minOrder} required` });
}

if (coupon.audience !== "both" && coupon.audience !== audience) {
  return res.status(400).json({ error: "Coupon not valid for your account type" });
}

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

Frontend may need a small update: instead of "X SAR off" preview, show "Coupon applied — final discount calculated at checkout".

**Verify:** apply coupon, response has no `discount` field. Place order, response includes computed `discount` from server.

---

## R2-NB-25 — Bootstrap token timing leak

**File:** `artifacts/api-server/src/routes/auth.ts` (`/auth/bootstrap-admin`, ~line 285)

**Find:**
```ts
const provided = req.headers["x-bootstrap-token"];
if (typeof provided !== "string" || provided.length !== expectedToken.length) {
  return res.status(401).json({ error: "Invalid bootstrap token" });
}
const a = Buffer.from(provided);
const b = Buffer.from(expectedToken);
let diff = 0;
for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
if (diff !== 0) {
  return res.status(401).json({ error: "Invalid bootstrap token" });
}
```

**Replace with:**
```ts
const provided = req.headers["x-bootstrap-token"];
if (typeof provided !== "string") {
  return res.status(401).json({ error: "Invalid bootstrap token" });
}
const PAD = 64;
const aBuf = Buffer.from(provided.padEnd(PAD, "\0").slice(0, PAD));
const bBuf = Buffer.from(expectedToken.padEnd(PAD, "\0").slice(0, PAD));
let diff = provided.length !== expectedToken.length ? 1 : 0;
for (let i = 0; i < PAD; i++) diff |= aBuf[i]! ^ bBuf[i]!;
if (diff !== 0) {
  return res.status(401).json({ error: "Invalid bootstrap token" });
}
```

**Verify:** bootstrap still works with the right token. Mismatched token → 401.

---

## R2-NB-29 — Sales cant create B2B with credit (admin-only)

**File:** `artifacts/api-server/src/routes/customers.ts` (POST /customers, ~line 56)

**Problem:** sales user can `POST /customers { allowCredit: true, creditLimit: 99999 }`. Should be admin-only.

**Find:**
```ts
router.post("/customers", requireRole("admin", "sales"), async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });
  const b = req.body;
```

**Add after `const b = req.body;`:**
```ts
const session = (req as any).session;
if ((b.allowCredit || b.creditLimit) && session.role !== "admin") {
  return res.status(403).json({ error: "Credit settings can only be set by admin" });
}
```

**Verify:** sales POST with `allowCredit: true` → 403. Admin POST same → 201.

---

# FINAL CHECKLIST

After all 14 fixes done. Run this and report PASS/FAIL each:

- [ ] R2-NB-6: order with WELCOME15 increments uses_count by 1 in DB
- [ ] R2-NB-19: admin can delete sales staff (returns 204), self-delete returns 400
- [ ] R2-NB-18: forgot-password response has NO `token` field
- [ ] R2-NB-9: GET /orders/abc,placed_at.gte.X returns 400
- [ ] R2-NB-10: CORS allowlist active when CORS_ORIGINS env set
- [ ] R2-NB-1+: B2C user POST order with body customerType/salespersonId/status → server ignores, uses session-derived
- [ ] R2-NB-7+: order with stock>available returns 400
- [ ] R2-NB-8: B2C cant order B2B-only product
- [ ] R2-NB-11: GET /products as anon returns no B2B-only items
- [ ] R2-NB-21: GET /coupons/validate?code=FREESHIP → 404 (not in DB anymore)
- [ ] R2-NB-20: register with 7-char password → 400
- [ ] R2-NB-26: admin updates customer email "FOO@x" → DB stores "foo@x"
- [ ] R2-NB-22: coupon validate response has no `discount` field
- [ ] R2-NB-25: bootstrap with wrong-length token → 401 (and timing-safe)
- [ ] R2-NB-29: sales POST customer with allowCredit → 403

Push to GitHub. Reply with 14 commit hashes + checklist results.

# END OF PROMPT
