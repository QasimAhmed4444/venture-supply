# Replit Agent — Round 5

Multiple fixes from owner. Same rules: no DB changes (DB already updated by me), one commit per fix, verify before commit.

---

## DB STATE (already done — do NOT touch)

- `regions` table dropped entirely
- `salespersons.region` column dropped
- All other DB pieces from rounds 1-4 still in place (RPCs, triggers, junction table, audit_log, views)

---

# THE FIXES (Usama's words, scoped per fix)

## R5-1 — Logout button placement for sales/admin

**What Usama said:**
> i want logoout button for sales person and admin right below where my left side navbar buttin ends not at the very end of page

**Files:** wherever the admin/sales sidebar layout lives — likely `artifacts/venture-supply/src/layouts/AdminLayout.tsx` and any sales equivalent.

**Fix:**
- Find the left sidebar navigation
- Logout button must appear **immediately after the last nav item** — not at the bottom of the page, not floating somewhere else
- Same component placement for both admin and sales layouts

**Verify:**
- Log in as admin → sidebar shows nav items → logout button right below the last nav item, no gap
- Same for sales

---

## R5-2 — Logout redirects to admin login, not home

**What Usama said:**
> when i logout to any salesperson/admin it should get me here not on home page
> https://venture-supply-srs--venturesupplu.replit.app/admin/login

**Fix:**
- When admin logs out → redirect to `/admin/login`
- When sales logs out → redirect to `/admin/login`
- Customer (b2c/b2b) logout flow stays as-is (probably home or `/login`)

Find the logout handler. Branch by role before redirect.

**Verify:**
- Login as admin → click logout → URL becomes `/admin/login`
- Login as sales → click logout → URL becomes `/admin/login`
- Login as b2c → click logout → existing behavior unchanged

---

## R5-3 — B2B credit dashboard still shows pending after admin approves

**What Usama said:**
> Im still not understanding even i set the limit of the credit of b2b customer still in his dashboard it says pending

**Root cause:** customer's `approvalStatus` is on the customer record. After admin approves via `PUT /customers/:id/credit`, the B2B customer's session/UI still reads stale data (probably from localStorage `vs.customer` set at login).

**Fix:**
1. Backend: ensure the B2B customer's GET `/customers/:id` (self) returns the freshest `business` JSONB including `approvalStatus`, `creditLimit`, `allowCredit`, `approvedAt`
2. Frontend: when B2B customer lands on dashboard or checkout, refetch their own customer record (don't rely solely on login-time localStorage). Use a query like:
   ```
   GET /customers/<my-id>
   ```
   and update local state with the fresh `business` field
3. The B2B dashboard "Credit Status" card must read from this fresh data, not localStorage

**Verify:**
- Admin sets allowCredit=on, approvalStatus=approved, limit=10000 → save
- B2B customer (already logged in) refreshes their dashboard
- Status shows "Approved" with limit, not "Pending"

---

## R5-4 — B2B customer dashboard must show remaining credit

**What Usama said:**
> in b2b customer i need the remaining credit as how much remaining is there coz this is needed

**Fix:**
- B2B customer dashboard adds a "Credit Status" section
- Shows three numbers: **Limit**, **Outstanding** (in-flight credit orders), **Remaining** (limit − outstanding)
- Data source: hit `GET /customers/:id/credit` from frontend (this endpoint already exists from R4 and uses `customer_outstanding_credit()` DB function — works for the customer's own ID since requireRole is `admin, sales` currently — **change it to allow self-access too**)

**Backend change:** in `routes/customers.ts`, the `GET /customers/:id/credit` handler currently is `requireRole("admin", "sales")`. Change to `requireAuth` and inside the handler:

```ts
const session = (req as any).session;
const isStaff = session.role === "admin" || session.role === "sales";
const isSelf = (session.role === "b2b") && /* check session.email matches the customer's email */;

if (!isStaff && !isSelf) {
  return res.status(403).json({ error: "Forbidden" });
}
```

Then customer can call this for their own ID.

**Frontend:** B2B dashboard fetches `/customers/<my-id>/credit` and displays:
- Limit: 10,000 SAR
- Outstanding: 3,250 SAR
- Remaining: 6,750 SAR

**Verify:**
- B2B with approved 10K limit places 2 credit orders totalling 3,250 SAR (status=new/preparing)
- Dashboard shows Remaining = 6,750 SAR
- After one order is delivered, Remaining changes accordingly (DB function excludes delivered)

---

## R5-5 — B2B registration: multiple business types

**What Usama said:**
> during registration b2b customer can select multiple duisness type also make this fucntionaltity

**Files:** registration page (frontend) + `routes/auth.ts` register handler (backend).

**Fix:**
1. Frontend registration form: business type field becomes a **multi-select** instead of single dropdown. Use checkbox group or multi-select component. Submit as array: `businessTypeIds: ["bt-1", "bt-3"]`
2. Backend register handler: accept `businessTypeIds: string[]` instead of (or alongside) `businessTypeId: string`. Store in customer's `business` JSONB:
   ```
   business: {
     name, crNumber, vatNumber,
     businessTypeIds: ["bt-1", "bt-3"],   // array now
     businessTypeNames: ["Restaurant", "Cafe"]   // for display
   }
   ```
3. Keep backward compatibility: if `businessTypeId` (singular) is sent, treat as `[businessTypeId]`

Same on `PUT /customers/:id` admin path — accept the array.

Same on admin `POST /customers` — accept the array.

**Verify:**
- Register new B2B → tick Restaurant + Cafe → submit
- DB row's `business->>'businessTypeIds'` is `["bt-restaurant", "bt-cafe"]`
- Admin opens customer detail → both types visible

---

## R5-6 — Remove region from entire site

**What Usama said:**
> remove region from my enite site coz we are only in one region madina no neeed to now menion that

**Files:** any frontend page or backend endpoint referencing regions.

**Fix:**
1. Backend: delete `routes/regions.ts` entirely. Remove its mount from `routes/index.ts`. Remove any `region` field from salesperson POST/PUT/GET (DB column is already dropped).
2. Frontend:
   - Remove "Region" filter from any list/search page
   - Remove "Region" column from any table
   - Remove "Region" input from any form (salesperson create/edit, customer registration, etc.)
   - Remove region selector from sales dashboard / admin dashboard if present
   - Remove any `useRegions` hook + `regions` query
3. Anywhere "region" was a required field, remove the validation

**Verify:**
- `git grep -i "region"` in frontend `src/` → only matches in unrelated context (e.g. AWS region in comments). No UI reference, no API call to /regions
- Salesperson create form: no Region field
- Customer registration: no Region field
- Sales dashboard: no Region filter

---

## R5-7 — Sales person main table layout

**What Usama said:**
> now let me share tou what i want in the table and then a view more button or say detailed view button inside i need all information
> Main view()
> Name only ( right now under there its their phone number)
> Email
> Customers count
> Monthly target
> Monthly achieved target
> Status
> Date of joining
> and then 3 funtions edit delete and a view detailed button or eye toggle

**File:** `artifacts/venture-supply/src/pages/AdminPages.tsx` → `AdminSalespersonsPage` function.

**Fix the main table to show only these columns in this exact order:**

| Name | Email | Customers Count | Monthly Target | Monthly Achieved | Status | Date of Joining | Actions |
|---|---|---|---|---|---|---|---|

- **Name column:** display name only. Remove the phone number subtext that's currently under name
- **Customers Count:** read from `customers_count` field OR compute from `customer_assignments` junction table for accuracy
- **Monthly Target:** read from `monthly_target`
- **Monthly Achieved:** read from `v_salesperson_performance` view's `sales_this_month` column. Fetch this view from a new endpoint (see backend below) or join in salesperson list query
- **Status:** read from `status` column
- **Date of Joining:** read from `joined_date` (or `created_at`)
- **Actions column:** three icons in this order — Edit (pencil), Delete (trash), Detailed View (eye)

**Backend support:** sales list endpoint must include `monthly_achieved` and accurate `customers_count`. Easiest: query the `v_salesperson_performance` view as the source for the list:
```ts
router.get("/salespersons", requireRole("admin"), async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.json([]);
  const { data, error } = await sb.from("v_salesperson_performance").select("*");
  if (error) return res.status(500).json({ error: error.message });
  // join with salespersons table for fields not in the view (status, joined_date, email, etc.)
  // OR add those fields to the view
  return res.json(data ?? []);
});
```

If the view doesn't have all needed fields, either extend the SELECT or do a join with the `salespersons` table.

**Verify:**
- Admin → Salespersons → table shows exactly 7 columns + Actions
- Name column has no phone subtext
- Monthly Achieved updates when a sales rep gets a new order

---

## R5-8 — Sales person detailed view (eye icon)

**What Usama said:**
> sales person on which customer he is assigned can me multiple so list all there and more analytics like this sales person serving which categoryes/products and business type

**File:** `AdminPages.tsx` → new component `SalespersonDetailView` at module scope (NOT inside the parent — same rule as CouponForm).

**Triggered by:** clicking the eye icon in the sales table → opens modal or navigates to `/admin/salespersons/:id`.

**Sections in detailed view:**

### 1. Header
- Name, email, phone, status, monthly target, joined date

### 2. Performance Stats
- Monthly target / monthly achieved / % of target hit
- Pending orders count
- Total orders this month

### 3. Assigned Customers
- List ALL customers assigned to this salesperson (junction table — there can be multiple)
- Columns: customer name, type (b2c/b2b), business name (if b2b), is_primary, commission_split
- Data source: `GET /salespersons/:id/customers` (new endpoint — see backend below)

### 4. Categories Served
- List of unique product categories from this rep's orders
- Computed from `order_items` joined with `products` joined with `categories`
- Show category name + count of orders + total revenue from that category

### 5. Products Sold
- Top 10 products this rep has sold (qty × revenue)
- From `order_items` filtered by orders where salesperson_id = this rep

### 6. Business Types Served
- Unique business types across this rep's B2B customers
- From `customers.business->>'businessTypeIds'` (array per R5-5) for all customers in junction table for this rep

**Backend — new endpoints in `routes/salespersons.ts`:**

```ts
// Detailed analytics for a salesperson
router.get("/salespersons/:id/detail", requireRole("admin", "sales"), async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: "db unavailable" });

  const id = req.params.id;

  // 1. base info from salespersons + performance view
  const { data: rep } = await sb.from("salespersons").select("*").eq("id", id).single();
  if (!rep) return res.status(404).json({ error: "not found" });

  const { data: perf } = await sb.from("v_salesperson_performance").select("*").eq("salesperson_id", id).maybeSingle();

  // 2. assigned customers via junction
  const { data: assigned } = await sb
    .from("v_customer_salespersons")
    .select("*")
    .eq("salesperson_id", id);

  // 3. categories served — from order_items joined with products and categories
  const { data: categoryStats } = await sb.rpc("salesperson_category_stats", { p_salesperson_id: id });

  // 4. top products
  const { data: topProducts } = await sb.rpc("salesperson_top_products", { p_salesperson_id: id, p_limit: 10 });

  // 5. business types served
  const { data: bizTypes } = await sb.rpc("salesperson_business_types", { p_salesperson_id: id });

  return res.json({
    salesperson: rep,
    performance: perf,
    assignedCustomers: assigned ?? [],
    categoriesServed: categoryStats ?? [],
    topProducts: topProducts ?? [],
    businessTypesServed: bizTypes ?? [],
  });
});
```

**IMPORTANT:** the three RPCs (`salesperson_category_stats`, `salesperson_top_products`, `salesperson_business_types`) **do not exist yet**. Ask Usama to confirm before calling these — Claude will create them at the DB level when this fix lands. For now, you can fetch the raw data via JS aggregation as a temporary fallback:

```ts
// Temporary: aggregate in JS until RPCs are created
const { data: orderItems } = await sb
  .from("order_items")
  .select("product_id, product_name, category_id, quantity, line_total, orders!inner(salesperson_id)")
  .eq("orders.salesperson_id", id);
// reduce in JS for top products + categories
```

**Frontend — `SalespersonDetailView` component:**

Module-scope component. Fetches `/salespersons/:id/detail`. Renders 6 sections above. Each section is a Card.

Wire up the eye icon to either open a modal containing this component or navigate to a dedicated page.

**Verify:**
- Click eye on sales rep → detail view opens
- Shows all 6 sections
- Assigned customers list reflects junction table (multiple if assigned)
- Categories/products/business types all show meaningful data

---

## R5-9 — Remove "B2B Credit" navbar item from admin

**What Usama said:**
> you have already created the credit limit fucntion under customer on eye view why need to make the seprate button called on nabvbar under admin B2B Credit remove it i dont want that

**File:** wherever the admin sidebar nav items are defined (likely `AdminLayout.tsx` or a config file).

**Fix:**
- Remove the "B2B Credit" link from admin sidebar
- Delete the route entry for `/admin/b2b-credit` in the router
- Delete the `AdminB2BCreditPage` component export (the standalone page) from `AdminPages.tsx`
- **Keep** the `B2BCreditPanel` component itself — it's used inside customer detail view
- The customer detail view (eye icon on customer table) already shows B2BCreditPanel for B2B customers — that's where credit management lives now

**Verify:**
- Admin sidebar: no "B2B Credit" item
- Visiting `/admin/b2b-credit` directly → 404 or redirect
- Customer eye icon on a B2B customer → still shows credit management panel

---

# SUPPORT FOR R5-8 — DB QUERIES (for Usama to run manually if RPC fallback used)

Usama will run these in Supabase SQL editor when ready:

```sql
-- RPC: category stats per salesperson
create or replace function salesperson_category_stats(p_salesperson_id text)
returns table(category_id text, category_name text, order_count bigint, total_revenue numeric)
language sql stable
set search_path = public, pg_temp
as $$
  select
    c.id as category_id,
    c.en_name as category_name,
    count(distinct oi.order_id) as order_count,
    sum(oi.line_total) as total_revenue
  from order_items oi
  join orders o on o.id = oi.order_id
  left join categories c on c.id = oi.category_id
  where o.salesperson_id = p_salesperson_id
    and o.status != 'cancelled'
  group by c.id, c.en_name
  order by total_revenue desc nulls last;
$$;

-- RPC: top products per salesperson
create or replace function salesperson_top_products(p_salesperson_id text, p_limit int default 10)
returns table(product_id text, product_name text, units_sold bigint, total_revenue numeric)
language sql stable
set search_path = public, pg_temp
as $$
  select
    oi.product_id,
    oi.product_name,
    sum(oi.quantity)::bigint as units_sold,
    sum(oi.line_total) as total_revenue
  from order_items oi
  join orders o on o.id = oi.order_id
  where o.salesperson_id = p_salesperson_id
    and o.status != 'cancelled'
  group by oi.product_id, oi.product_name
  order by total_revenue desc nulls last
  limit p_limit;
$$;

-- RPC: business types served by a salesperson
create or replace function salesperson_business_types(p_salesperson_id text)
returns table(business_type_id text, customer_count bigint)
language sql stable
set search_path = public, pg_temp
as $$
  select
    bt_id::text as business_type_id,
    count(distinct ca.customer_id) as customer_count
  from customer_assignments ca
  join customers c on c.id = ca.customer_id
  cross join lateral jsonb_array_elements_text(
    case
      when jsonb_typeof(c.business->'businessTypeIds') = 'array' then c.business->'businessTypeIds'
      when (c.business->>'businessTypeId') is not null then jsonb_build_array(c.business->>'businessTypeId')
      else '[]'::jsonb
    end
  ) as bt_id
  where ca.salesperson_id = p_salesperson_id
  group by bt_id;
$$;
```

Tell Usama: "Run these 3 functions in Supabase SQL editor when R5-8 is done. They power the detailed view's category / products / business-types sections."

---

# FINAL CHECKLIST

After all 9 fixes done. Report PASS/FAIL each:

- [ ] R5-1: logout button right below last nav item in admin + sales sidebars
- [ ] R5-2: admin/sales logout redirects to `/admin/login`
- [ ] R5-3: B2B customer dashboard refreshes after admin approves credit (no more stale "pending")
- [ ] R5-4: B2B dashboard shows Limit / Outstanding / Remaining
- [ ] R5-5: B2B registration accepts multiple business types
- [ ] R5-6: zero region UI/API/code references in frontend or backend
- [ ] R5-7: sales table shows exactly the 7 columns + Actions
- [ ] R5-8: sales detail view (eye icon) shows all 6 sections
- [ ] R5-9: B2B Credit navbar item removed; credit panel only inside customer detail

Push to GitHub. Reply with 9 commit hashes + checklist results.

# END OF PROMPT
