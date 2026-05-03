# Venture Supply — Supabase schema

Production-ready schema for the Venture Supply storefront and admin API.
This directory is the source of truth for what should exist in the Supabase
`public` schema.

## Files

| File | Purpose |
| --- | --- |
| `schema.sql` | Idempotent DDL: tables, constraints, indexes, RLS policies, grants. Run this first. |
| `purge_demo.sql` | Removes the rows inserted by `POST /api/admin/seed`. Run before going live. |

## How to apply

1. Open the Supabase SQL Editor for the project.
2. Paste the contents of `schema.sql` and run it. The script is safe to
   re-run; every `create`/`alter`/`policy` is guarded.
3. Optionally run `purge_demo.sql` to delete the demo seed rows. The script
   only matches the well-known demo IDs, so production rows (which use
   base36 timestamp suffixes) are untouched.

## Tables

| Table | Purpose |
| --- | --- |
| `categories` | Product categories (rice, oils, …). Public read. |
| `brands` | Brand metadata used on the storefront. Public read. |
| `products` | Catalog. Public read; staff write. |
| `salespersons` | Sales reps with quotas and KPIs. |
| `customers` | B2C and B2B customers, with embedded `business` and `addresses` JSON. |
| `orders` | One row per order; line items live in the `items` JSON column. |
| `coupons` | Promo codes. Validated at checkout. |
| `business_types` | Reference list used by the B2B signup form. |
| `staff` | Login credentials for admin / sales / customer accounts. |

### Why some columns are `jsonb`

`products.packs`, `customers.business`, `customers.addresses`,
`orders.items`, and `orders.history` are all denormalised into JSON because
the API returns them as nested objects and they are never queried by their
inner fields. If we ever need to filter on one of those fields we can add a
GIN index on the relevant JSON path or extract it into its own table.

## Indexes

Every column that the API server filters or sorts on has an index:

| Table | Index | Used by |
| --- | --- | --- |
| products | `category_id`, `brand_id` | `GET /api/products?category=…&brand=…` |
| products | `(featured desc, created_at desc)` | default listing order |
| products | `stock_status` | dashboard low-stock counter |
| products | `en_name gin_trgm_ops` | `?search=` ILIKE substring search |
| orders | `customer_id`, `salesperson_id`, `status` | scoped order lists |
| orders | `placed_at desc` | order history + dashboard date filter |
| orders | `tracking_id` | public tracking page lookup |
| customers | `type`, `created_at desc`, `assigned_salesperson_id` | admin filters + dashboard |
| customers | `lower(email)` | login + duplicate-email check |
| salespersons | `monthly_sales desc` | leaderboard |
| coupons | `lower(code)`, `created_at desc` | code validation + admin list |
| staff | `lower(email)` | login lookup |
| business_types | `name` | alphabetical list |

`pg_trgm` is enabled for the substring search on `products.en_name`.

## Foreign keys & integrity

* `products.brand_id` → `brands(id)` `ON DELETE SET NULL`
* `products.category_id` → `categories(id)` `ON DELETE SET NULL`
* `customers.assigned_salesperson_id` → `salespersons(id)` `ON DELETE SET NULL`
* `orders.customer_id` → `customers(id)` `ON DELETE SET NULL`
* `orders.salesperson_id` → `salespersons(id)` `ON DELETE SET NULL`
* `staff.salesperson_id` → `salespersons(id)` `ON DELETE SET NULL`

`SET NULL` is used everywhere instead of `CASCADE` so that historical orders
and audit trails are never silently destroyed when a parent row is removed.

`CHECK` constraints pin enum-like columns (`audience`, `status`,
`order_type`, `payment_method`, `customer_type`, coupon `type`, staff
`role`) so a typo in the API can never poison the table.

## Row-level security

RLS is **enabled on every table**. Application roles are read from the JWT
claim `app_metadata.role` (preferred) with a fallback to a top-level `role`
claim. Two helper functions wrap the JWT lookups:

```sql
public.app_role()           -- 'admin' | 'sales' | 'b2c' | 'b2b' | 'anon'
public.is_staff()           -- app_role() in ('admin','sales')
public.jwt_email()          -- auth.jwt() ->> 'email'
public.jwt_salesperson_id() -- auth.jwt() ->> 'salesperson_id'
```

### Policy summary

| Table | anon | b2c / b2b | sales | admin |
| --- | --- | --- | --- | --- |
| categories | read | read | read+write | read+write |
| brands | read | read | read+write | read+write |
| products | read | read | read+write | read+write |
| business_types | read | read | read | read+write |
| coupons | – | read | read | read+write |
| customers | – | read+update **own** | read+write all | read+write all |
| orders | – | read **own**; insert **own** | read **assigned**; update | full |
| salespersons | – | – | read **own** only | read+write |
| staff | – | – | – | read+write |

“Own” for a customer is matched on `customers.email = jwt_email()`. “Own”
for a salesperson is matched on `salespersons.id = jwt_salesperson_id()`.

### How the API server connects

The Express API in `artifacts/api-server/` (see
`src/lib/supabase.ts`) now prefers the **service-role key**
(`SUPABASE_SERVICE_ROLE_KEY`), with the anon key as a fallback:

```ts
const key =
  process.env["SUPABASE_SERVICE_ROLE_KEY"] ??
  process.env["SUPABASE_ANON_KEY"];
```

The service-role key bypasses RLS by design and is the standard pattern
for trusted backends, so server-side reads/writes for orders, customers,
staff, etc. continue to work after RLS is enabled. **Set
`SUPABASE_SERVICE_ROLE_KEY` in the API server's environment in
production.** The key must **never** be exposed to a browser/mobile
client — it only lives on the server.

If only the anon key is configured, the server logs a warning and most
non-catalog routes will return empty results under production RLS.

End-user clients (storefront, staff dashboard) that talk to Supabase
directly (for example the realtime channel in `routes/realtime.ts`)
should connect with the anon key plus a signed-in user's JWT — RLS will
then scope the data correctly.

## Schema-level conveniences

* `staff.id` has a generated default
  (`'staff-' || gen_random_uuid()::text` with hyphens stripped), so
  inserts that omit `id` (e.g. `POST /api/auth/register`) succeed.
* `pgcrypto` and `pg_trgm` extensions are enabled by the script; both are
  available on Supabase by default.

## Known gaps to address before launch

1. **Hashed passwords.** `staff.password` is `text` and the demo seed and
   `/api/auth/login` route compare it in plain text. Replace with a hash
   (bcrypt/argon2) or migrate authentication to Supabase Auth before any
   real customer credentials are stored.
2. **Set `SUPABASE_SERVICE_ROLE_KEY`** on the API server. The client now
   prefers it over the anon key (see above); without it, RLS will hide
   most rows from the server.
3. **Run `purge_demo.sql`** in the production project before opening it
   to real customers, then rotate the demo `admin@example.com` /
   `sales@example.com` credentials.
4. **Realtime publication.** Supabase realtime requires the `orders`
   table to be in the `supabase_realtime` publication. If it isn't
   already, add it from the Supabase dashboard (Database → Replication).
