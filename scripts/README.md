# Scripts

Utility scripts for the Venture Supply workspace.

## Database Setup

The database is managed through [Supabase](https://supabase.com). Schema migrations live in `supabase/migrations/` and are applied automatically by Supabase or manually via the Supabase CLI.

### Required Environment Variables

Set the following as environment secrets (never commit credentials to source control):

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server-side only) |
| `SUPABASE_DB_PASSWORD` | Direct database password (for migrations) |

### Seed Data

Test/seed credentials are stored as environment secrets (not in source files):

| Variable | Description |
|---|---|
| `SEED_ADMIN_EMAIL` | Seed admin account email |
| `SEED_ADMIN_PASSWORD` | Seed admin account password |
| `SEED_SALES_EMAIL` | Seed salesperson account email |
| `SEED_SALES_PASSWORD` | Seed salesperson account password |
| `SEED_B2C_PASSWORD` | Seed B2C customer account password |

To set these, use the Replit Secrets panel or the environment-secrets skill.

## Available Scripts

Add new scripts under `scripts/src/` and register them in `scripts/package.json`.
