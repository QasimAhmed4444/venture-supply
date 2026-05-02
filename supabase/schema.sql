-- Venture Supply — Supabase Schema
-- Run this once in your Supabase SQL Editor before seeding.

create table if not exists categories (
  id          text primary key,
  slug        text unique not null,
  image       text,
  product_count integer default 0
);

create table if not exists brands (
  id          text primary key,
  name        text not null,
  en_tagline  text,
  ar_tagline  text,
  accent      text,
  logo_url    text,
  is_photo    boolean default false
);

create table if not exists products (
  id            text primary key,
  sku           text,
  slug          text unique not null,
  en_name       text not null,
  ar_name       text,
  en_description text,
  ar_description text,
  brand_id      text references brands(id),
  category_id   text references categories(id),
  audience      text default 'both',
  b2c_price     numeric(10,2) default 0,
  b2b_price     numeric(10,2) default 0,
  packs         jsonb default '[]',
  min_order_qty integer default 1,
  rating        numeric(3,1) default 4.5,
  review_count  integer default 0,
  stock_status  text default 'in-stock',
  stock_qty     integer default 100,
  image         text,
  featured      boolean default false,
  created_at    timestamptz default now()
);

-- Prototype: disable RLS. Add policies before going to production.
alter table categories disable row level security;
alter table brands     disable row level security;
alter table products   disable row level security;

grant select, insert, update, delete on categories to anon, authenticated;
grant select, insert, update, delete on brands     to anon, authenticated;
grant select, insert, update, delete on products   to anon, authenticated;
