# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Database

The Venture Supply API talks to a Supabase PostgreSQL project. The
production schema (tables, constraints, indexes, RLS policies, grants)
lives in `supabase/schema.sql`; design rationale and operational notes are
in `supabase/README.md`. Use `supabase/purge_demo.sql` to remove the demo
seed rows inserted by `POST /api/admin/seed` before going live.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Security Architecture

### Supabase Key — CRITICAL, READ FIRST

**Project ref:** `vmesyvbuygukqosjmssv`
**Supabase URL:** `https://vmesyvbuygukqosjmssv.supabase.co`

The server uses ONE secret: `SUPABASE_SERVICE_ROLE_KEY` (Replit Secret).
- **No `.env` file** — it was deleted. Do not recreate it.
- **No fallback keys** — `supabase.ts` reads only `process.env["SUPABASE_SERVICE_ROLE_KEY"]`.
- The correct key has `role: service_role` in its JWT payload and **exactly 2 dots**.
- `supabase.ts` auto-extracts the first valid JWT if the user accidentally pastes two keys together.
- On startup the server logs: `Supabase startup check passed — service role access confirmed`. If it instead logs `role='anon'`, the wrong key is set.
- The anon key is in `SUPABASE_ANON_KEY` (frontend/public use only — never use it as the server key).
- To find the service_role key: Supabase dashboard → Project Settings → Data API → "Project API keys" → **service_role row** (bottom one, hidden by default — click the eye icon to reveal).

### Database Changes — HOW TO APPLY
**The agent cannot connect directly to the Supabase DB from the Replit workspace (IPv6 blocked).**
Rule: agent computes the SQL (including any bcrypt hashes needed) and gives it to the user to paste into the [Supabase SQL Editor](https://supabase.com/dashboard/project/vmesyvbuygukqosjmssv/sql/new). Never attempt psql or programmatic connections.

### Admin Account
- **Email:** `admin@venturesupply.sa`
- **Password:** stored as bcrypt hash in `staff` table, role = `admin`
- To reset: generate bcrypt hash via `node -e "require('./artifacts/api-server/node_modules/bcryptjs').hash('newpwd',10).then(console.log)"`, then run `UPDATE public.staff SET password='<hash>', email='<email>' WHERE role='admin';` in Supabase SQL Editor.

### Row-Level Security (Supabase)
- RLS is **enabled** on: `staff`, `orders`, `customers`, `coupons`, `salespersons`
- Anon key access is **denied** on all these tables via `deny_anon_*` policies
- Authenticated role (used by server) has full access
- Service role key bypasses RLS — stored in `SUPABASE_SERVICE_ROLE_KEY` Replit Secret
- All staff passwords are bcrypt-hashed ($2a$ / $2b$ format)

### API Authentication
- `GET /orders` — `requireAuth` (any role)
- `GET /orders/:id` — **public** (no auth required — allows order tracking by shared link; customer-scoped orders still restricted if authenticated as b2c/b2b)
- `POST /orders` — `requireAuth` (any role)
- `PUT /orders/:id` — `requireRole("admin", "sales")`
- `DELETE /orders/:id` — `requireAdmin`
- `GET /customers`, `POST /customers` — `requireRole("admin", "sales")`
- `PUT /customers/:id` — `requireAuth` (B2C/B2B can only update own record)
- `DELETE /customers/:id` — `requireAdmin`
- `GET /customers/:id` — `requireAuth`
- `GET /dashboard/stats` — `requireAdmin`
- `GET /coupons` — `requireAdmin`
- `GET /coupons/validate` — `requireAuth`
- `POST/PUT/DELETE /coupons` — `requireAdmin`

### Frontend Route Guards
- `AdminLayout` — redirects to `/admin/login` if `role !== "admin"`
- `SalesLayout` — redirects to `/admin/login` if `role !== "sales"`
- `AccountLayout` — redirects to `/login` if `role !== "b2c" && role !== "b2b"`

### Order Scoping (by role)
- `admin`: sees all orders; can filter by customerId/salespersonId
- `sales`: scoped to orders for their assigned customers (via staff.salesperson_id)
- `b2c`/`b2b`: scoped to their own orders only (by email match)
