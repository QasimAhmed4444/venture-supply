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

### Row-Level Security (Supabase)
- RLS is **enabled** on: `staff`, `orders`, `customers`, `coupons`, `salespersons`
- Anon key access is **denied** on all these tables via `deny_anon_*` policies
- Authenticated role (used by server) has full access
- Service role key bypasses RLS — stored in `SUPABASE_SERVICE_ROLE_KEY` env var
- All staff passwords are bcrypt-hashed ($2a$ / $2b$ format)

### API Authentication
- `GET /orders`, `POST /orders`, `GET /orders/:id` — `requireAuth` (any role)
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
