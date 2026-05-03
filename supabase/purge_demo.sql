-- ============================================================================
-- Purge demo / seed rows inserted by /api/admin/seed
-- ============================================================================
-- The demo seed uses fixed, recognisable IDs. Production-created rows use
-- base36 timestamp suffixes (e.g. c-mau5xz, p-1714680000000) and are not
-- matched by the explicit ID lists below, so this script is safe to run
-- after going live.
--
-- The IDs below MUST stay in sync with
-- artifacts/api-server/src/lib/seedData.ts. To preview what would be
-- deleted, replace the DELETE statements with SELECT before running.
--
-- Order matters: child rows first, then parents, so foreign keys do not
-- block the deletes.
-- ============================================================================

begin;

-- Demo orders (B2C: o-1xxx, B2B: o-2xxx).
delete from public.orders where id in (
  'o-1042','o-1031','o-1040','o-1037','o-1004','o-1029',
  'o-2018','o-2019','o-2017','o-2016','o-2015'
);

-- Demo staff credentials.
delete from public.staff where id in (
  'staff-admin-001','staff-sales-001'
);

-- Demo customers c-001..c-010.
delete from public.customers where id in (
  'c-001','c-002','c-003','c-004','c-005',
  'c-006','c-007','c-008','c-009','c-010'
);

-- Demo salespersons sp-001..sp-004.
delete from public.salespersons where id in (
  'sp-001','sp-002','sp-003','sp-004'
);

-- Demo products (15 SKUs from seedProducts).
delete from public.products where id in (
  'p-chef-1121-sella','p-chef-1121-creamy','p-chef-1121-golden',
  'p-chef-1509-sella','p-malka-cumin','p-malka-turmeric',
  'p-malka-biryani-mix','p-chef-red-lentils','p-chef-chickpeas',
  'p-chef-sunflower-oil','p-malka-pink-salt','p-vital-tea-green',
  'p-vital-tea-earl-grey','p-chef-tomato-sauce','p-malka-ghee'
);

-- Demo brands.
delete from public.brands where id in (
  'chef-flavor','malka','vital','almari','almarai',
  'nadec','nada','alyoum','sunbulah'
);

-- Demo categories.
delete from public.categories where id in (
  'rice','plain-spices','recipe-mix','pulses-lentils','oils',
  'pink-salt','beverages','sauces','specialty-items'
);

commit;
