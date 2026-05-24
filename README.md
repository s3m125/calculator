# GSI Asset Control System

Web-based asset management system for **GSI Group** (and similar project-based companies). Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind**, and **Supabase** (PostgreSQL + Auth + RLS + Storage).

> ✅ MVP Phase 1 is fully implemented and ready to demo.
> 🧱 Database schema covers **all 20 tables** so Phase 2 features (full approval workflow, WhatsApp notifications, Odoo/Accurate integration, etc.) only need UI wiring.

## What's inside

| Module                       | Status   | Notes |
| ---------------------------- | -------- | ----- |
| Login + role-based access    | ✅ ready | Supabase Auth (email + password). Role-aware sidebar & UI guards. |
| Master Asset (CRUD + QR)     | ✅ ready | Auto-generated Asset ID & QR. List, filters, detail, edit, print label, scan landing. |
| Assignments                  | ✅ ready | Assign to employee / project / location, due date, return action. |
| Transfers                    | ✅ ready | Location, department, project, user changes — full history. |
| Maintenance                  | ✅ ready | Preventive + corrective, status workflow (requested → completed). |
| Audit (Stock Opname) via QR  | ✅ ready | Phone-friendly scanner (camera or manual). Found / Not Found / Different Location / Damaged. |
| Disposal request             | ✅ ready | Reason, value, status. |
| Dashboard                    | ✅ ready | Stat cards, donut, status chart, recent activity, upcoming warranty, overdue returns, quick actions. |
| Depreciation                 | ✅ ready | Straight-line, monthly, accumulated, book value. Excel export. |
| Reports                      | ✅ ready | Excel export of asset register, assignments, transfers, maintenance, depreciation, disposal, audit. |
| Approvals                    | 🧱 Phase 2 stub (schema ready) |
| WhatsApp / Odoo / Accurate   | 🧱 Phase 2 (API surface ready) |

## Tech

- **Next.js 14** (App Router, TypeScript, Tailwind)
- **Supabase**: PostgreSQL + Auth + RLS + Storage
- `@supabase/ssr` for server/client cookie-aware session management
- `qrcode` for QR generation, `html5-qrcode` for the in-browser scanner
- `xlsx` (SheetJS) for Excel export
- `recharts` for charts

## Project Layout

```
src/
  app/
    (app)/                ← authenticated app shell
      dashboard/
      assets/[id]/qr/     ← printable QR label
      assignments/
      transfers/
      maintenance/
      audit/[id]/         ← scan-driven stock opname
      reports/
      depreciation/
      disposals/
      settings/
    login/
    scan/[code]/          ← public asset lookup landing (QR target)
  components/
  lib/
    supabase/             ← server + browser clients + middleware
    auth.ts               ← role/capability helpers
    queries.ts            ← dashboard data fetcher
    utils.ts              ← formatting helpers
  middleware.ts           ← redirect to /login when not authenticated
supabase/
  migrations/             ← schema (1 file, 20 tables, RLS, triggers, view)
  seed.sql                ← lookups (categories, departments, suppliers, ...)
  seed_assets.sql         ← ~40 sample assets across GSI categories
  seed_users.sql          ← maps demo auth.users → app users
scripts/
  bootstrap-users.mjs     ← creates the 10 demo auth users via service role
```

## Setting Up Supabase

### Option A — Supabase Cloud (recommended for demo)

1. Create a project at <https://app.supabase.com>.
2. Open **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`
3. Copy `.env.example` to `.env.local` and paste those three values.
4. Apply migrations and seeds:

   The simplest path is the **SQL Editor** in the Supabase dashboard. Run, in order:

   ```text
   supabase/migrations/20260101000000_initial_schema.sql
   supabase/seed.sql
   supabase/seed_assets.sql
   ```

   Or, with the Supabase CLI:

   ```bash
   supabase link --project-ref <YOUR-PROJECT-REF>
   supabase db push
   psql "$DATABASE_URL" -f supabase/seed.sql
   psql "$DATABASE_URL" -f supabase/seed_assets.sql
   ```

5. Create demo auth users (10 accounts, one per role):

   ```bash
   node --env-file=.env.local scripts/bootstrap-users.mjs
   ```

6. Link those auth users to the `users` table:

   ```text
   supabase/seed_users.sql   ← paste into SQL Editor
   ```

### Option B — Local Supabase (with Docker)

```bash
supabase start
supabase db reset            # applies migrations
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2)" -f supabase/seed.sql
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2)" -f supabase/seed_assets.sql
node --env-file=.env.local scripts/bootstrap-users.mjs
```

`supabase status` prints the local anon / service role keys to paste into `.env.local`.

## Run

```bash
npm install
npm run dev
# → http://localhost:3000
```

`npm run build` produces a production build. `npm run typecheck` and `npm run lint` for static checks.

## Demo Accounts

All accounts share the password: `Gsi#Demo2026`

| Email                  | Role            | What they can see |
| ---------------------- | --------------- | ----------------- |
| `superadmin@gsi.local` | Super Admin     | Everything        |
| `admin@gsi.local`      | Asset Admin     | Asset CRUD, assignments, transfers, maintenance, audit |
| `finance@gsi.local`    | Finance         | Asset view, depreciation, export |
| `purchasing@gsi.local` | Purchasing      | Asset create, view |
| `warehouse@gsi.local`  | Warehouse       | Assets, transfers, audit scan |
| `pm@gsi.local`         | Project Manager | Assignments, transfers, maintenance, approvals |
| `tech1@gsi.local`      | Technician      | Maintenance, audit scan |
| `tech2@gsi.local`      | Technician      | Maintenance, audit scan |
| `employee@gsi.local`   | Employee        | View only |
| `ceo@gsi.local`        | CEO / Viewer    | Dashboard, finance view, export |

## Acceptance criteria — self-audit

| # | Criterion | Result |
| - | --------- | ------ |
| 1 | Admin can add asset and QR auto-generates | ✅ `assets/new` + DB trigger `generate_asset_id()` populates Asset ID and QR payload. |
| 2 | QR scanned from a phone opens asset detail | ✅ `scan/[code]` is in the middleware public allowlist. Logged-in users get a button to deep-link into the app. |
| 3 | Asset assignable to user / project / location | ✅ `assignments/new` switches between the 3 modes; asset `status` and `assigned_to` are updated. |
| 4 | All mutations are historized | ✅ Asset detail page shows full Assignment / Transfer / Maintenance history. |
| 5 | Maintenance request + tracking | ✅ Submit, then advance status (requested → approved → in_progress → completed) with one click. |
| 6 | Audit via QR scan | ✅ `audit/[id]` includes camera scanner + manual fallback; auto-detects "different location"; variance counters update live. |
| 7 | Real-time dashboard | ✅ `force-dynamic` server-rendered dashboard reads from `v_asset_list` and totals. |
| 8 | Finance can see asset value & depreciation | ✅ `depreciation` page calculates straight-line on the fly with totals and Excel export. |
| 9 | Excel export everywhere | ✅ Reports page covers 7 datasets; every list view also has its own ExportButton. |
| 10 | Role-based permissions | ✅ Sidebar items, page redirects, and action buttons gated by `ROLE_CAPABILITIES`. RLS is enabled on all tables (currently authenticated-only; tighten further in Phase 2). |

## Notes / things to know

- **Storage of photos/signatures**: schema has `photo_url` / `signature_url` columns ready. Wire to a Supabase Storage bucket called `assets` in Phase 2 (UI form fields are already structured for it).
- **RLS**: current policies are `authenticated`-scope (any signed-in user can read/write). The `users` / `roles` / `permissions` tables are already in place to migrate to true row-level permissions per role in Phase 2.
- **QR payload**: encodes `${NEXT_PUBLIC_APP_URL}/scan/<asset_id>`. If you change the deployed URL, update `NEXT_PUBLIC_APP_URL` so printed labels still resolve.
- **No secrets in git**: `.env*.local` and `.env` are git-ignored; only `.env.example` is checked in.
