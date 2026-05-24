-- GSI Asset Control System — Initial Schema
-- All 20 core tables, indexes, helper functions and RLS policies.
-- Apply via: supabase db push  (or paste into Supabase SQL Editor)

create extension if not exists "pgcrypto";

-- =========================================================================
-- 1. Reference / lookup tables
-- =========================================================================

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists permissions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  module text not null,
  created_at timestamptz default now()
);

create table if not exists role_permissions (
  role_id uuid references roles(id) on delete cascade,
  permission_id uuid references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  manager_name text,
  created_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  client_name text,
  location text,
  status text not null default 'active' check (status in ('active','completed','on_hold','cancelled')),
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  contact_name text,
  phone text,
  email text,
  address text,
  created_at timestamptz default now()
);

create table if not exists asset_categories (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  prefix text unique not null,            -- used in asset_id, e.g. LAP, PRT, CCTV
  useful_life_years int not null default 4,
  depreciation_method text not null default 'straight_line',
  description text,
  created_at timestamptz default now()
);

create table if not exists asset_locations (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  type text not null default 'office' check (type in ('office','warehouse','project_site','client_site','vehicle','other')),
  address text,
  pic_name text,
  created_at timestamptz default now()
);

-- =========================================================================
-- 2. Users (linked to auth.users)
-- =========================================================================

create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  employee_id text unique,
  full_name text not null,
  email text unique not null,
  phone text,
  role_id uuid references roles(id),
  department_id uuid references departments(id),
  position text,
  status text not null default 'active' check (status in ('active','inactive','suspended')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_users_role on users(role_id);
create index if not exists idx_users_department on users(department_id);

-- =========================================================================
-- 3. Assets (master table)
-- =========================================================================

create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  asset_id text unique not null,            -- e.g. LAP-2026-0001
  qr_code text unique,                       -- payload encoded into QR
  name text not null,
  category_id uuid references asset_categories(id),
  brand text,
  model text,
  serial_number text,
  specification text,
  photo_url text,
  -- purchase info
  purchase_date date,
  supplier_id uuid references suppliers(id),
  po_number text,
  invoice_number text,
  purchase_price numeric(18,2) default 0,
  -- finance
  useful_life_years int,
  depreciation_method text default 'straight_line',
  book_value numeric(18,2) default 0,
  accumulated_depreciation numeric(18,2) default 0,
  -- location / assignment
  location_id uuid references asset_locations(id),
  department_id uuid references departments(id),
  project_id uuid references projects(id),
  assigned_to uuid references users(id),
  -- status
  status text not null default 'available' check (status in (
    'available','assigned','borrowed','in_repair','lost','damaged','disposed'
  )),
  condition text default 'good' check (condition in ('new','good','fair','poor','broken')),
  -- warranty
  warranty_start date,
  warranty_end date,
  notes text,
  -- audit
  created_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_assets_status on assets(status);
create index if not exists idx_assets_category on assets(category_id);
create index if not exists idx_assets_location on assets(location_id);
create index if not exists idx_assets_assigned_to on assets(assigned_to);
create index if not exists idx_assets_department on assets(department_id);
create index if not exists idx_assets_project on assets(project_id);
create index if not exists idx_assets_asset_id on assets(asset_id);

-- Auto-generate asset_id like LAP-2026-0001
create or replace function generate_asset_id() returns trigger
language plpgsql as $$
declare
  v_prefix text;
  v_year text;
  v_seq int;
begin
  if new.asset_id is not null and new.asset_id <> '' then
    return new;
  end if;

  select prefix into v_prefix from asset_categories where id = new.category_id;
  v_prefix := coalesce(v_prefix, 'AST');
  v_year := to_char(coalesce(new.purchase_date, current_date), 'YYYY');

  select coalesce(max((regexp_match(asset_id, '\d+$'))[1]::int), 0) + 1
    into v_seq
    from assets
   where asset_id like v_prefix || '-' || v_year || '-%';

  new.asset_id := v_prefix || '-' || v_year || '-' || lpad(v_seq::text, 4, '0');
  if new.qr_code is null then
    new.qr_code := new.asset_id;
  end if;
  return new;
end $$;

drop trigger if exists trg_assets_generate_id on assets;
create trigger trg_assets_generate_id
  before insert on assets
  for each row execute function generate_asset_id();

-- Update updated_at automatically
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_assets_updated_at on assets;
create trigger trg_assets_updated_at
  before update on assets
  for each row execute function set_updated_at();

-- =========================================================================
-- 4. Assignments
-- =========================================================================

create table if not exists asset_assignments (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id) on delete cascade,
  assigned_to uuid references users(id),
  project_id uuid references projects(id),
  location_id uuid references asset_locations(id),
  assignment_type text not null default 'employee' check (assignment_type in ('employee','project','location')),
  assigned_date date not null default current_date,
  due_date date,
  returned_date date,
  notes text,
  handover_photo_url text,
  signature_url text,
  status text not null default 'active' check (status in ('active','returned','overdue','cancelled')),
  created_by uuid references users(id),
  created_at timestamptz default now()
);

create index if not exists idx_assignments_asset on asset_assignments(asset_id);
create index if not exists idx_assignments_user on asset_assignments(assigned_to);
create index if not exists idx_assignments_status on asset_assignments(status);

-- =========================================================================
-- 5. Transfers / mutations
-- =========================================================================

create table if not exists asset_transfers (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id) on delete cascade,
  from_location_id uuid references asset_locations(id),
  to_location_id uuid references asset_locations(id),
  from_department_id uuid references departments(id),
  to_department_id uuid references departments(id),
  from_user_id uuid references users(id),
  to_user_id uuid references users(id),
  from_project_id uuid references projects(id),
  to_project_id uuid references projects(id),
  transfer_date date not null default current_date,
  reason text,
  before_photo_url text,
  after_photo_url text,
  gps_note text,
  status text not null default 'pending' check (status in ('pending','approved','completed','rejected')),
  approved_by uuid references users(id),
  approved_at timestamptz,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

create index if not exists idx_transfers_asset on asset_transfers(asset_id);
create index if not exists idx_transfers_status on asset_transfers(status);

-- =========================================================================
-- 6. Maintenance
-- =========================================================================

create table if not exists asset_maintenance (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id) on delete cascade,
  maintenance_type text not null default 'preventive' check (maintenance_type in ('preventive','corrective')),
  request_date date not null default current_date,
  schedule_date date,
  completed_date date,
  description text not null,
  vendor_name text,
  cost numeric(18,2) default 0,
  spareparts_used text,
  before_photo_url text,
  after_photo_url text,
  status text not null default 'requested' check (status in ('requested','approved','in_progress','completed','rejected')),
  requested_by uuid references users(id),
  approved_by uuid references users(id),
  completed_by uuid references users(id),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_maintenance_asset on asset_maintenance(asset_id);
create index if not exists idx_maintenance_status on asset_maintenance(status);

-- =========================================================================
-- 7. Audit / Stock opname
-- =========================================================================

create table if not exists asset_audits (
  id uuid primary key default gen_random_uuid(),
  audit_code text unique not null,
  title text not null,
  location_id uuid references asset_locations(id),
  department_id uuid references departments(id),
  scheduled_date date,
  started_at timestamptz,
  completed_at timestamptz,
  status text not null default 'open' check (status in ('open','in_progress','completed','cancelled')),
  total_expected int default 0,
  total_found int default 0,
  total_not_found int default 0,
  total_different_location int default 0,
  total_damaged int default 0,
  notes text,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

create table if not exists asset_audit_items (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references asset_audits(id) on delete cascade,
  asset_id uuid references assets(id),
  scanned_at timestamptz default now(),
  result text not null default 'found' check (result in ('found','not_found','different_location','damaged','extra')),
  actual_location_id uuid references asset_locations(id),
  photo_url text,
  notes text,
  scanned_by uuid references users(id)
);

create index if not exists idx_audit_items_audit on asset_audit_items(audit_id);
create index if not exists idx_audit_items_asset on asset_audit_items(asset_id);

-- =========================================================================
-- 8. Depreciation snapshots (monthly)
-- =========================================================================

create table if not exists asset_depreciation (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id) on delete cascade,
  period date not null,
  monthly_depreciation numeric(18,2) not null default 0,
  accumulated_depreciation numeric(18,2) not null default 0,
  book_value numeric(18,2) not null default 0,
  posted boolean default false,
  created_at timestamptz default now(),
  unique (asset_id, period)
);

create index if not exists idx_depr_asset on asset_depreciation(asset_id);
create index if not exists idx_depr_period on asset_depreciation(period);

-- =========================================================================
-- 9. Disposal / write-off
-- =========================================================================

create table if not exists asset_disposals (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id) on delete cascade,
  reason text not null check (reason in ('damaged','lost','obsolete','sold','scrap','other')),
  disposal_date date,
  disposal_value numeric(18,2) default 0,
  buyer_name text,
  document_url text,
  notes text,
  status text not null default 'requested' check (status in ('requested','approved','completed','rejected')),
  requested_by uuid references users(id),
  approved_by uuid references users(id),
  created_at timestamptz default now()
);

-- =========================================================================
-- 10. Notifications, approvals, attachments
-- =========================================================================

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  body text,
  type text not null default 'info' check (type in ('info','warning','error','success')),
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_user_read on notifications(user_id, read);

create table if not exists approval_requests (
  id uuid primary key default gen_random_uuid(),
  module text not null check (module in ('purchase','assignment','transfer','maintenance','disposal')),
  reference_id uuid not null,
  title text not null,
  amount numeric(18,2) default 0,
  current_level int default 1,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  requested_by uuid references users(id),
  created_at timestamptz default now()
);

create table if not exists approval_logs (
  id uuid primary key default gen_random_uuid(),
  approval_id uuid not null references approval_requests(id) on delete cascade,
  level int not null,
  approver_id uuid references users(id),
  decision text not null check (decision in ('approved','rejected','forwarded')),
  notes text,
  created_at timestamptz default now()
);

create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  file_name text not null,
  file_url text not null,
  file_size int,
  mime_type text,
  uploaded_by uuid references users(id),
  created_at timestamptz default now()
);

create index if not exists idx_attachments_entity on attachments(entity_type, entity_id);

-- =========================================================================
-- Helper view: asset list with joins
-- =========================================================================

create or replace view v_asset_list as
select
  a.id,
  a.asset_id,
  a.qr_code,
  a.name,
  a.brand,
  a.model,
  a.serial_number,
  a.status,
  a.condition,
  a.purchase_date,
  a.purchase_price,
  a.book_value,
  a.warranty_end,
  c.name  as category_name,
  c.code  as category_code,
  l.name  as location_name,
  d.name  as department_name,
  p.name  as project_name,
  u.full_name as assigned_to_name,
  u.id    as assigned_to_id,
  s.name  as supplier_name,
  a.created_at,
  a.updated_at
from assets a
left join asset_categories c on c.id = a.category_id
left join asset_locations  l on l.id = a.location_id
left join departments      d on d.id = a.department_id
left join projects         p on p.id = a.project_id
left join users            u on u.id = a.assigned_to
left join suppliers        s on s.id = a.supplier_id;

-- =========================================================================
-- Row Level Security
-- =========================================================================
-- For MVP we keep policies permissive (any authenticated user can read; writes
-- are gated by the API layer + UI role-guards). Tighten later when integrating
-- granular permissions.

alter table users                enable row level security;
alter table roles                enable row level security;
alter table permissions          enable row level security;
alter table role_permissions     enable row level security;
alter table departments          enable row level security;
alter table projects             enable row level security;
alter table suppliers            enable row level security;
alter table asset_categories     enable row level security;
alter table asset_locations      enable row level security;
alter table assets               enable row level security;
alter table asset_assignments    enable row level security;
alter table asset_transfers      enable row level security;
alter table asset_maintenance    enable row level security;
alter table asset_audits         enable row level security;
alter table asset_audit_items    enable row level security;
alter table asset_depreciation   enable row level security;
alter table asset_disposals      enable row level security;
alter table notifications        enable row level security;
alter table approval_requests    enable row level security;
alter table approval_logs        enable row level security;
alter table attachments          enable row level security;

-- Generic "authenticated can read" + "authenticated can write" policies.
do $$
declare t text;
begin
  for t in select unnest(array[
    'users','roles','permissions','role_permissions','departments','projects',
    'suppliers','asset_categories','asset_locations','assets','asset_assignments',
    'asset_transfers','asset_maintenance','asset_audits','asset_audit_items',
    'asset_depreciation','asset_disposals','notifications','approval_requests',
    'approval_logs','attachments'
  ]) loop
    execute format('drop policy if exists %I_read on %I', t||'_read', t);
    execute format('drop policy if exists %I_write on %I', t||'_write', t);
    execute format(
      'create policy %I on %I for select using (auth.role() = ''authenticated'')',
      t||'_read', t);
    execute format(
      'create policy %I on %I for all using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'')',
      t||'_write', t);
  end loop;
end $$;
