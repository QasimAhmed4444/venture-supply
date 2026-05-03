-- ============================================================================
-- Venture Supply — Supabase Production Schema
-- ============================================================================
-- Idempotent: safe to run on a fresh project or on top of the existing demo
-- schema. Creates all tables, constraints, indexes, and RLS policies needed
-- for production. See ./README.md for the design rationale and operational
-- notes (including how the API server should connect).
--
-- To apply:
--   1) Open the Supabase SQL Editor for your project
--   2) Paste this file and run it
--   3) Optionally run ./purge_demo.sql to remove demo/seed rows
-- ============================================================================

-- ---------- Extensions ----------
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ============================================================================
-- TABLES
-- ============================================================================

create table if not exists public.categories (
  id            text primary key,
  slug          text not null unique,
  image         text,
  product_count integer not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists public.brands (
  id          text primary key,
  name        text not null,
  en_tagline  text,
  ar_tagline  text,
  accent      text,
  logo_url    text,
  is_photo    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.products (
  id             text primary key,
  sku            text,
  slug           text not null unique,
  en_name        text not null,
  ar_name        text,
  en_description text,
  ar_description text,
  brand_id       text,
  category_id    text,
  audience       text not null default 'both',
  b2c_price      numeric(10,2) not null default 0,
  b2b_price      numeric(10,2) not null default 0,
  packs          jsonb not null default '[]'::jsonb,
  min_order_qty  integer not null default 1,
  rating         numeric(3,1) not null default 4.5,
  review_count   integer not null default 0,
  stock_status   text not null default 'in-stock',
  stock_qty      integer not null default 0,
  image          text,
  featured       boolean not null default false,
  created_at     timestamptz not null default now()
);

create table if not exists public.salespersons (
  id                text primary key,
  name              text not null,
  email             text not null unique,
  phone             text,
  region            text,
  monthly_target    numeric(12,2) not null default 0,
  monthly_sales     numeric(12,2) not null default 0,
  customers_count   integer not null default 0,
  orders_this_month integer not null default 0,
  pending_orders    integer not null default 0,
  status            text not null default 'active',
  joined_date       date,
  created_at        timestamptz not null default now()
);

create table if not exists public.business_types (
  id               text primary key,
  name             text not null,
  code             text not null unique,
  description      text,
  default_discount numeric(5,2) not null default 0,
  min_order_value  numeric(12,2) not null default 0,
  credit_allowed   boolean not null default false,
  credit_limit     numeric(12,2),
  status           text not null default 'active',
  created_at       timestamptz not null default now()
);

create table if not exists public.customers (
  id                       text primary key,
  name                     text not null,
  email                    text unique,
  phone                    text,
  city                     text,
  type                     text not null default 'b2c',
  total_orders             integer not null default 0,
  lifetime_value           numeric(14,2) not null default 0,
  assigned_salesperson_id  text,
  joined_date              date,
  business                 jsonb,
  addresses                jsonb not null default '[]'::jsonb,
  created_at               timestamptz not null default now()
);

create table if not exists public.orders (
  id                  text primary key,
  tracking_id         text not null unique,
  customer_id         text,
  customer_name       text,
  customer_type       text not null default 'b2c',
  salesperson_id      text,
  status              text not null default 'new',
  order_type          text not null default 'delivery',
  payment_method      text not null default 'cod',
  placed_at           timestamptz not null default now(),
  estimated_at        timestamptz,
  delivery_address    text,
  city                text,
  items               jsonb not null default '[]'::jsonb,
  subtotal            numeric(14,2) not null default 0,
  vat                 numeric(14,2) not null default 0,
  delivery_charge     numeric(14,2) not null default 0,
  discount            numeric(14,2),
  total               numeric(14,2) not null default 0,
  notes               text,
  coupon_code         text,
  cancellation_reason text,
  history             jsonb not null default '[]'::jsonb,
  created_at          timestamptz not null default now()
);

create table if not exists public.coupons (
  id          text primary key,
  code        text not null unique,
  en_title    text,
  ar_title    text,
  type        text not null default 'percent',
  value       numeric(10,2) not null default 0,
  min_order   numeric(12,2) not null default 0,
  audience    text not null default 'both',
  max_uses    integer,
  uses_count  integer not null default 0,
  starts_at   timestamptz,
  ends_at     timestamptz,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- WARNING: passwords are stored as plain text by the demo /api/auth/login
-- and /api/admin/seed paths. Before going live this column MUST be replaced
-- with a hash (bcrypt/argon2) or the auth flow migrated to Supabase Auth.
create table if not exists public.staff (
  id              text primary key default ('staff-' || replace(gen_random_uuid()::text, '-', '')),
  email           text not null unique,
  password        text not null,
  role            text not null,
  name            text not null,
  salesperson_id  text,
  created_at      timestamptz not null default now()
);
-- Make sure the default also exists on a pre-created staff table.
alter table public.staff
  alter column id set default ('staff-' || replace(gen_random_uuid()::text, '-', ''));

-- ============================================================================
-- BACKFILL + NOT NULL HARDENING
-- ============================================================================
-- The original demo schema created `categories`, `brands`, and `products`
-- without NOT NULL on most columns. Backfill any rogue NULLs to the
-- production default and then enforce NOT NULL. The remaining tables are
-- created above with NOT NULL in place; the ALTERs are still safe (no-op)
-- if a different ordering produced a looser definition.

-- categories
update public.categories set product_count = 0 where product_count is null;
update public.categories set created_at    = now() where created_at is null;
alter table public.categories
  alter column slug          set not null,
  alter column product_count set not null,
  alter column product_count set default 0,
  alter column created_at    set not null,
  alter column created_at    set default now();

-- brands
update public.brands set is_photo   = false where is_photo  is null;
update public.brands set created_at = now() where created_at is null;
alter table public.brands
  alter column name       set not null,
  alter column is_photo   set not null,
  alter column is_photo   set default false,
  alter column created_at set not null,
  alter column created_at set default now();

-- products
update public.products set audience      = 'both'      where audience      is null;
update public.products set b2c_price     = 0           where b2c_price     is null;
update public.products set b2b_price     = 0           where b2b_price     is null;
update public.products set packs         = '[]'::jsonb where packs         is null;
update public.products set min_order_qty = 1           where min_order_qty is null;
update public.products set rating        = 4.5         where rating        is null;
update public.products set review_count  = 0           where review_count  is null;
update public.products set stock_status  = 'in-stock'  where stock_status  is null;
update public.products set stock_qty     = 0           where stock_qty     is null;
update public.products set featured      = false       where featured      is null;
update public.products set created_at    = now()       where created_at    is null;
alter table public.products
  alter column slug          set not null,
  alter column en_name       set not null,
  alter column audience      set not null,
  alter column audience      set default 'both',
  alter column b2c_price     set not null,
  alter column b2c_price     set default 0,
  alter column b2b_price     set not null,
  alter column b2b_price     set default 0,
  alter column packs         set not null,
  alter column packs         set default '[]'::jsonb,
  alter column min_order_qty set not null,
  alter column min_order_qty set default 1,
  alter column rating        set not null,
  alter column rating        set default 4.5,
  alter column review_count  set not null,
  alter column review_count  set default 0,
  alter column stock_status  set not null,
  alter column stock_status  set default 'in-stock',
  alter column stock_qty     set not null,
  alter column stock_qty     set default 0,
  alter column featured      set not null,
  alter column featured      set default false,
  alter column created_at    set not null,
  alter column created_at    set default now();

-- salespersons
update public.salespersons set monthly_target    = 0       where monthly_target    is null;
update public.salespersons set monthly_sales     = 0       where monthly_sales     is null;
update public.salespersons set customers_count   = 0       where customers_count   is null;
update public.salespersons set orders_this_month = 0       where orders_this_month is null;
update public.salespersons set pending_orders    = 0       where pending_orders    is null;
update public.salespersons set status            = 'active' where status           is null;
update public.salespersons set created_at        = now()    where created_at       is null;
alter table public.salespersons
  alter column name              set not null,
  alter column email             set not null,
  alter column monthly_target    set not null, alter column monthly_target    set default 0,
  alter column monthly_sales     set not null, alter column monthly_sales     set default 0,
  alter column customers_count   set not null, alter column customers_count   set default 0,
  alter column orders_this_month set not null, alter column orders_this_month set default 0,
  alter column pending_orders    set not null, alter column pending_orders    set default 0,
  alter column status            set not null, alter column status            set default 'active',
  alter column created_at        set not null, alter column created_at        set default now();

-- business_types
update public.business_types set default_discount = 0        where default_discount is null;
update public.business_types set min_order_value  = 0        where min_order_value  is null;
update public.business_types set credit_allowed   = false    where credit_allowed   is null;
update public.business_types set status           = 'active' where status           is null;
update public.business_types set created_at       = now()    where created_at       is null;
alter table public.business_types
  alter column name             set not null,
  alter column code             set not null,
  alter column default_discount set not null, alter column default_discount set default 0,
  alter column min_order_value  set not null, alter column min_order_value  set default 0,
  alter column credit_allowed   set not null, alter column credit_allowed   set default false,
  alter column status           set not null, alter column status           set default 'active',
  alter column created_at       set not null, alter column created_at       set default now();

-- customers
update public.customers set type           = 'b2c'      where type           is null;
update public.customers set total_orders   = 0          where total_orders   is null;
update public.customers set lifetime_value = 0          where lifetime_value is null;
update public.customers set addresses      = '[]'::jsonb where addresses     is null;
update public.customers set created_at     = now()      where created_at     is null;
alter table public.customers
  alter column name           set not null,
  alter column type           set not null, alter column type           set default 'b2c',
  alter column total_orders   set not null, alter column total_orders   set default 0,
  alter column lifetime_value set not null, alter column lifetime_value set default 0,
  alter column addresses      set not null, alter column addresses      set default '[]'::jsonb,
  alter column created_at     set not null, alter column created_at     set default now();

-- orders
update public.orders set customer_type   = 'b2c'        where customer_type   is null;
update public.orders set status          = 'new'        where status          is null;
update public.orders set order_type      = 'delivery'   where order_type      is null;
update public.orders set payment_method  = 'cod'        where payment_method  is null;
update public.orders set placed_at       = now()        where placed_at       is null;
update public.orders set items           = '[]'::jsonb  where items           is null;
update public.orders set subtotal        = 0            where subtotal        is null;
update public.orders set vat             = 0            where vat             is null;
update public.orders set delivery_charge = 0            where delivery_charge is null;
update public.orders set total           = 0            where total           is null;
update public.orders set history         = '[]'::jsonb  where history         is null;
update public.orders set created_at      = now()        where created_at      is null;
alter table public.orders
  alter column tracking_id     set not null,
  alter column customer_type   set not null, alter column customer_type   set default 'b2c',
  alter column status          set not null, alter column status          set default 'new',
  alter column order_type      set not null, alter column order_type      set default 'delivery',
  alter column payment_method  set not null, alter column payment_method  set default 'cod',
  alter column placed_at       set not null, alter column placed_at       set default now(),
  alter column items           set not null, alter column items           set default '[]'::jsonb,
  alter column subtotal        set not null, alter column subtotal        set default 0,
  alter column vat             set not null, alter column vat             set default 0,
  alter column delivery_charge set not null, alter column delivery_charge set default 0,
  alter column total           set not null, alter column total           set default 0,
  alter column history         set not null, alter column history         set default '[]'::jsonb,
  alter column created_at      set not null, alter column created_at      set default now();

-- coupons
update public.coupons set type       = 'percent' where type       is null;
update public.coupons set value      = 0         where value      is null;
update public.coupons set min_order  = 0         where min_order  is null;
update public.coupons set audience   = 'both'    where audience   is null;
update public.coupons set uses_count = 0         where uses_count is null;
update public.coupons set is_active  = true      where is_active  is null;
update public.coupons set created_at = now()     where created_at is null;
alter table public.coupons
  alter column code       set not null,
  alter column type       set not null, alter column type       set default 'percent',
  alter column value      set not null, alter column value      set default 0,
  alter column min_order  set not null, alter column min_order  set default 0,
  alter column audience   set not null, alter column audience   set default 'both',
  alter column uses_count set not null, alter column uses_count set default 0,
  alter column is_active  set not null, alter column is_active  set default true,
  alter column created_at set not null, alter column created_at set default now();

-- staff
update public.staff set created_at = now() where created_at is null;
alter table public.staff
  alter column email      set not null,
  alter column password   set not null,
  alter column role       set not null,
  alter column name       set not null,
  alter column created_at set not null,
  alter column created_at set default now();

-- ============================================================================
-- CONSTRAINTS  (idempotent: only added if missing)
-- ============================================================================

do $$
begin
  -- products
  if not exists (select 1 from pg_constraint where conname = 'products_audience_chk') then
    alter table public.products add constraint products_audience_chk
      check (audience in ('b2c','b2b','both'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_stock_status_chk') then
    alter table public.products add constraint products_stock_status_chk
      check (stock_status in ('in-stock','low-stock','out-of-stock','discontinued'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_b2c_price_chk') then
    alter table public.products add constraint products_b2c_price_chk check (b2c_price >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_b2b_price_chk') then
    alter table public.products add constraint products_b2b_price_chk check (b2b_price >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_min_order_qty_chk') then
    alter table public.products add constraint products_min_order_qty_chk check (min_order_qty > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_rating_chk') then
    alter table public.products add constraint products_rating_chk check (rating >= 0 and rating <= 5);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_brand_fk') then
    alter table public.products add constraint products_brand_fk
      foreign key (brand_id) references public.brands(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_category_fk') then
    alter table public.products add constraint products_category_fk
      foreign key (category_id) references public.categories(id) on delete set null;
  end if;

  -- customers
  if not exists (select 1 from pg_constraint where conname = 'customers_type_chk') then
    alter table public.customers add constraint customers_type_chk
      check (type in ('b2c','b2b'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'customers_salesperson_fk') then
    alter table public.customers add constraint customers_salesperson_fk
      foreign key (assigned_salesperson_id) references public.salespersons(id) on delete set null;
  end if;

  -- orders
  if not exists (select 1 from pg_constraint where conname = 'orders_status_chk') then
    alter table public.orders add constraint orders_status_chk
      check (status in (
        'new','confirmed','preparing','packed',
        'out-for-delivery','ready-for-pickup',
        'delivered','cancelled'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_type_chk') then
    alter table public.orders add constraint orders_type_chk
      check (order_type in ('delivery','pickup'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_payment_chk') then
    alter table public.orders add constraint orders_payment_chk
      check (payment_method in ('cod','card','bank','credit'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_customer_type_chk') then
    alter table public.orders add constraint orders_customer_type_chk
      check (customer_type in ('b2c','b2b'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_total_chk') then
    alter table public.orders add constraint orders_total_chk check (total >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_customer_fk') then
    alter table public.orders add constraint orders_customer_fk
      foreign key (customer_id) references public.customers(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_salesperson_fk') then
    alter table public.orders add constraint orders_salesperson_fk
      foreign key (salesperson_id) references public.salespersons(id) on delete set null;
  end if;

  -- coupons
  if not exists (select 1 from pg_constraint where conname = 'coupons_audience_chk') then
    alter table public.coupons add constraint coupons_audience_chk
      check (audience in ('b2c','b2b','both'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coupons_type_chk') then
    alter table public.coupons add constraint coupons_type_chk
      check (type in ('percent','fixed','free_delivery'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coupons_value_chk') then
    alter table public.coupons add constraint coupons_value_chk check (value >= 0);
  end if;

  -- salespersons
  if not exists (select 1 from pg_constraint where conname = 'salespersons_status_chk') then
    alter table public.salespersons add constraint salespersons_status_chk
      check (status in ('active','inactive','on-leave'));
  end if;

  -- business_types
  if not exists (select 1 from pg_constraint where conname = 'business_types_status_chk') then
    alter table public.business_types add constraint business_types_status_chk
      check (status in ('active','inactive'));
  end if;

  -- staff
  if not exists (select 1 from pg_constraint where conname = 'staff_role_chk') then
    alter table public.staff add constraint staff_role_chk
      check (role in ('admin','sales','b2c','b2b'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'staff_salesperson_fk') then
    alter table public.staff add constraint staff_salesperson_fk
      foreign key (salesperson_id) references public.salespersons(id) on delete set null;
  end if;
end$$;

-- ============================================================================
-- INDEXES — covering hot WHERE / ORDER BY columns observed in api-server/
-- ============================================================================

-- products: filter by category/brand, list ordered by featured + created_at,
-- stock dashboards, ILIKE '%text%' search on en_name
create index if not exists products_category_id_idx   on public.products (category_id);
create index if not exists products_brand_id_idx      on public.products (brand_id);
create index if not exists products_featured_idx      on public.products (featured desc, created_at desc);
create index if not exists products_stock_status_idx  on public.products (stock_status);
create index if not exists products_en_name_trgm_idx  on public.products using gin (en_name gin_trgm_ops);

-- orders: scoped lookups + dashboard date ranges + tracking lookup
create index if not exists orders_customer_id_idx    on public.orders (customer_id);
create index if not exists orders_salesperson_id_idx on public.orders (salesperson_id);
create index if not exists orders_status_idx         on public.orders (status);
create index if not exists orders_placed_at_idx      on public.orders (placed_at desc);
create index if not exists orders_tracking_id_idx    on public.orders (tracking_id);

-- customers: list filter by type, dashboard date filter on created_at,
-- salesperson book of business, login lookup by lower(email)
create index if not exists customers_type_idx         on public.customers (type);
create index if not exists customers_created_at_idx   on public.customers (created_at desc);
create index if not exists customers_salesperson_idx  on public.customers (assigned_salesperson_id);
create index if not exists customers_email_lower_idx  on public.customers (lower(email));

-- salespersons: monthly leaderboard sort
create index if not exists salespersons_monthly_sales_idx
  on public.salespersons (monthly_sales desc);

-- coupons: created_at ordering + case-insensitive code lookup
create index if not exists coupons_created_at_idx  on public.coupons (created_at desc);
create index if not exists coupons_code_lower_idx  on public.coupons (lower(code));

-- staff: case-insensitive email lookup for login
create index if not exists staff_email_lower_idx on public.staff (lower(email));

-- business_types: alphabetical list
create index if not exists business_types_name_idx on public.business_types (name);

-- ============================================================================
-- RLS HELPER FUNCTIONS
-- ============================================================================
-- Application roles ('admin','sales','b2b','b2c') are read from the JWT
-- claim app_metadata.role (preferred) or top-level 'role'. The API server
-- (or auth provider) is responsible for setting that claim at sign-in.
-- The PostgREST 'service_role' key bypasses RLS entirely and is what the
-- backend should use for trusted server-side operations.

create or replace function public.app_role() returns text
language sql stable as $$
  select coalesce(
    nullif((select auth.jwt()) -> 'app_metadata' ->> 'role', ''),
    nullif((select auth.jwt()) ->> 'role', ''),
    'anon'
  )
$$;

create or replace function public.is_staff() returns boolean
language sql stable as $$
  select public.app_role() in ('admin','sales')
$$;

create or replace function public.jwt_email() returns text
language sql stable as $$
  select (select auth.jwt()) ->> 'email'
$$;

create or replace function public.jwt_salesperson_id() returns text
language sql stable as $$
  select (select auth.jwt()) ->> 'salesperson_id'
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- Trust model:
--   * anon                — public catalog read only (categories, brands,
--                            products, business_types).
--   * authenticated b2c/b2b — read catalog; read/update their own customer
--                              row; read/insert their own orders.
--   * authenticated sales — read assigned customers + their orders;
--                            read/write product/catalog metadata.
--   * authenticated admin — full read/write on every table.
--   * service_role        — bypasses RLS (used by the API server).

-- ---------- categories / brands / products: public read, staff write ----------
alter table public.categories enable row level security;
drop policy if exists categories_read_all   on public.categories;
drop policy if exists categories_write_staff on public.categories;
create policy categories_read_all    on public.categories for select using (true);
create policy categories_write_staff on public.categories for all
  using (public.is_staff()) with check (public.is_staff());

alter table public.brands enable row level security;
drop policy if exists brands_read_all    on public.brands;
drop policy if exists brands_write_staff on public.brands;
create policy brands_read_all    on public.brands for select using (true);
create policy brands_write_staff on public.brands for all
  using (public.is_staff()) with check (public.is_staff());

alter table public.products enable row level security;
drop policy if exists products_read_all    on public.products;
drop policy if exists products_write_staff on public.products;
create policy products_read_all    on public.products for select using (true);
create policy products_write_staff on public.products for all
  using (public.is_staff()) with check (public.is_staff());

-- ---------- business_types: public read (used by signup), admin write ----------
alter table public.business_types enable row level security;
drop policy if exists business_types_read_all   on public.business_types;
drop policy if exists business_types_write_admin on public.business_types;
create policy business_types_read_all    on public.business_types for select using (true);
create policy business_types_write_admin on public.business_types for all
  using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

-- ---------- coupons: any signed-in user can validate, only admin writes ----------
alter table public.coupons enable row level security;
drop policy if exists coupons_read_authn  on public.coupons;
drop policy if exists coupons_write_admin on public.coupons;
create policy coupons_read_authn  on public.coupons for select
  using (public.app_role() in ('b2c','b2b','sales','admin'));
create policy coupons_write_admin on public.coupons for all
  using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

-- ---------- customers: self read/update, staff full ----------
alter table public.customers enable row level security;
drop policy if exists customers_read_self_or_staff on public.customers;
drop policy if exists customers_update_self        on public.customers;
drop policy if exists customers_write_staff        on public.customers;
create policy customers_read_self_or_staff on public.customers for select
  using (
    public.is_staff()
    or (public.app_role() in ('b2c','b2b') and email = public.jwt_email())
  );
create policy customers_update_self on public.customers for update
  using (public.app_role() in ('b2c','b2b') and email = public.jwt_email())
  with check (public.app_role() in ('b2c','b2b') and email = public.jwt_email());
create policy customers_write_staff on public.customers for all
  using (public.is_staff()) with check (public.is_staff());

-- ---------- orders: customer sees own; sales sees assigned; admin sees all ----------
alter table public.orders enable row level security;
drop policy if exists orders_read_scoped   on public.orders;
drop policy if exists orders_insert_scoped on public.orders;
drop policy if exists orders_update_staff  on public.orders;
drop policy if exists orders_delete_admin  on public.orders;
create policy orders_read_scoped on public.orders for select
  using (
    public.app_role() = 'admin'
    or (public.app_role() = 'sales'
        and salesperson_id = public.jwt_salesperson_id())
    or (public.app_role() in ('b2c','b2b')
        and customer_id in (
          select id from public.customers where email = public.jwt_email()
        ))
  );
create policy orders_insert_scoped on public.orders for insert
  with check (
    public.is_staff()
    or (public.app_role() in ('b2c','b2b')
        and customer_id in (
          select id from public.customers where email = public.jwt_email()
        ))
  );
create policy orders_update_staff on public.orders for update
  using (public.is_staff()) with check (public.is_staff());
create policy orders_delete_admin on public.orders for delete
  using (public.app_role() = 'admin');

-- ---------- salespersons: admin full; each sales sees only own row ----------
alter table public.salespersons enable row level security;
drop policy if exists salespersons_read_scoped on public.salespersons;
drop policy if exists salespersons_write_admin on public.salespersons;
create policy salespersons_read_scoped on public.salespersons for select
  using (
    public.app_role() = 'admin'
    or (public.app_role() = 'sales' and id = public.jwt_salesperson_id())
  );
create policy salespersons_write_admin on public.salespersons for all
  using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

-- ---------- staff (credentials): admin only via RLS; backend uses service_role ----------
alter table public.staff enable row level security;
drop policy if exists staff_admin_only on public.staff;
create policy staff_admin_only on public.staff for all
  using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

-- ============================================================================
-- GRANTS
-- ============================================================================
-- PostgREST inspects table grants in addition to RLS. Granting broad CRUD to
-- anon + authenticated is safe because RLS scopes the actual visible rows.

grant usage on schema public to anon, authenticated;

grant select                         on public.categories      to anon, authenticated;
grant select                         on public.brands          to anon, authenticated;
grant select                         on public.products        to anon, authenticated;
grant select                         on public.business_types  to anon, authenticated;
grant insert, update, delete         on public.categories, public.brands, public.products, public.business_types
                                                              to authenticated;

-- Customer / order / catalog admin tables: grants must cover everything the
-- RLS policies above can permit. RLS still scopes the visible/affected rows
-- per role, so wider grants are safe.
grant select, insert, update, delete on public.customers      to authenticated;
grant select, insert, update, delete on public.orders         to authenticated;
grant select, insert, update, delete on public.salespersons   to authenticated;
grant select, insert, update, delete on public.coupons        to authenticated;

-- staff (credentials) is intentionally NOT granted to anon/authenticated;
-- the API server uses the service-role key (which bypasses RLS) for any
-- credential operations.
