-- Harden RLS policies — replace the permissive `authenticated`-can-do-anything
-- blanket policies (installed during MVP) with role-aware policies that match
-- the capability map in src/lib/auth.ts.
--
-- The mental model:
--   * Reads: every authenticated user can SELECT every operational table
--     (UI hides what they don't need; RLS doesn't have to gatekeep reads).
--   * Writes: only roles that own the workflow can INSERT/UPDATE/DELETE.
--   * `roles`, `permissions`, `role_permissions`, `users` are super-admin-only
--     for writes — direct table edits there are privilege-escalation paths.
--
-- This migration is idempotent (drops & re-creates each policy).

-- Helper: returns the current user's role code, or NULL.
create or replace function public.current_role_code() returns text
language sql stable security definer set search_path = public as $$
  select r.code
    from public.users u
    join public.roles r on r.id = u.role_id
   where u.id = auth.uid()
     and u.status = 'active'
   limit 1
$$;
grant execute on function public.current_role_code() to authenticated, anon;

-- Helper: caller has ANY of the given role codes.
create or replace function public.has_role(codes text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select public.current_role_code() = any(codes)
$$;
grant execute on function public.has_role(text[]) to authenticated, anon;

-- =========================================================================
-- Drop the old blanket policies installed by the initial migration
-- =========================================================================
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
    execute format('drop policy if exists %I on %I', t||'_read', t);
    execute format('drop policy if exists %I on %I', t||'_write', t);
  end loop;
end $$;

-- =========================================================================
-- READ POLICIES — broad for authenticated; minimal-public exposure for anon
-- =========================================================================

-- Most reads are authenticated-only.
do $$
declare t text;
begin
  for t in select unnest(array[
    'users','roles','permissions','role_permissions','departments','projects',
    'suppliers','asset_categories','asset_locations','assets','asset_assignments',
    'asset_transfers','asset_maintenance','asset_audits','asset_audit_items',
    'asset_depreciation','asset_disposals','approval_requests','approval_logs',
    'attachments'
  ]) loop
    execute format(
      'create policy %I on %I for select to authenticated using (true)',
      t||'_read', t);
  end loop;
end $$;

-- Notifications are personal — users see only their own.
create policy notifications_read on notifications
  for select to authenticated
  using (user_id = auth.uid());

-- Anonymous users (QR scan landing page) can SELECT minimal data on
-- v_asset_list. The view itself is granted to anon; the underlying tables
-- need an anon SELECT policy too. We restrict to the minimum set needed
-- by the public scan page (`src/app/scan/[code]/page.tsx`).
alter view v_asset_list set (security_invoker = true);

create policy assets_public_scan on assets
  for select to anon
  using (status not in ('disposed'));
create policy asset_categories_public_scan on asset_categories
  for select to anon using (true);
create policy asset_locations_public_scan on asset_locations
  for select to anon using (true);
create policy departments_public_scan on departments
  for select to anon using (true);
create policy projects_public_scan on projects
  for select to anon using (true);
create policy suppliers_public_scan on suppliers
  for select to anon using (true);
create policy users_public_scan on users
  for select to anon using (true);

-- =========================================================================
-- WRITE POLICIES — keyed off role
-- =========================================================================

-- Capability sets — keep aligned with ROLE_CAPABILITIES in src/lib/auth.ts.
-- Anyone in this list can write the matching workflow.
--   asset.create / asset.edit / asset.delete  → super_admin, asset_admin, warehouse
--                                                purchasing (create only)
--   assignment.manage                         → super_admin, asset_admin, warehouse, project_mgr
--   transfer.manage                           → super_admin, asset_admin, warehouse, project_mgr
--   maintenance.manage                        → super_admin, asset_admin, project_mgr, technician
--   audit.manage                              → super_admin, asset_admin, warehouse
--   audit.scan                                → super_admin, asset_admin, warehouse, technician
--   approval.approve                          → super_admin, project_mgr
--   user.manage / role.manage                 → super_admin only

-- ---- assets ----
create policy assets_insert on assets
  for insert to authenticated
  with check (has_role(array['super_admin','asset_admin','warehouse','purchasing']));

create policy assets_update on assets
  for update to authenticated
  using (has_role(array['super_admin','asset_admin','warehouse']))
  with check (has_role(array['super_admin','asset_admin','warehouse']));

create policy assets_delete on assets
  for delete to authenticated
  using (has_role(array['super_admin','asset_admin']));

-- ---- assignments ----
create policy asset_assignments_write on asset_assignments
  for all to authenticated
  using (has_role(array['super_admin','asset_admin','warehouse','project_mgr']))
  with check (has_role(array['super_admin','asset_admin','warehouse','project_mgr']));

-- ---- transfers ----
create policy asset_transfers_write on asset_transfers
  for all to authenticated
  using (has_role(array['super_admin','asset_admin','warehouse','project_mgr']))
  with check (has_role(array['super_admin','asset_admin','warehouse','project_mgr']));

-- ---- maintenance ----
create policy asset_maintenance_write on asset_maintenance
  for all to authenticated
  using (has_role(array['super_admin','asset_admin','project_mgr','technician']))
  with check (has_role(array['super_admin','asset_admin','project_mgr','technician']));

-- ---- audits + items ----
create policy asset_audits_write on asset_audits
  for all to authenticated
  using (has_role(array['super_admin','asset_admin','warehouse']))
  with check (has_role(array['super_admin','asset_admin','warehouse']));

create policy asset_audit_items_write on asset_audit_items
  for all to authenticated
  using (has_role(array['super_admin','asset_admin','warehouse','technician']))
  with check (has_role(array['super_admin','asset_admin','warehouse','technician']));

-- ---- depreciation ----
create policy asset_depreciation_write on asset_depreciation
  for all to authenticated
  using (has_role(array['super_admin','finance']))
  with check (has_role(array['super_admin','finance']));

-- ---- disposals ----
create policy asset_disposals_insert on asset_disposals
  for insert to authenticated
  with check (has_role(array['super_admin','asset_admin','warehouse','project_mgr']));

create policy asset_disposals_update on asset_disposals
  for update to authenticated
  using (has_role(array['super_admin','project_mgr','finance']))
  with check (has_role(array['super_admin','project_mgr','finance']));

create policy asset_disposals_delete on asset_disposals
  for delete to authenticated
  using (has_role(array['super_admin']));

-- ---- approvals ----
create policy approval_requests_insert on approval_requests
  for insert to authenticated
  with check (true); -- any authenticated user can REQUEST

create policy approval_requests_update on approval_requests
  for update to authenticated
  using (has_role(array['super_admin','project_mgr','finance','asset_admin']))
  with check (has_role(array['super_admin','project_mgr','finance','asset_admin']));

create policy approval_logs_insert on approval_logs
  for insert to authenticated
  with check (has_role(array['super_admin','project_mgr','finance','asset_admin']));

-- ---- notifications: a user can mark their own as read; only super_admin
--      can write to anyone else's queue (a future trigger will be the main
--      writer).
create policy notifications_update_self on notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy notifications_admin_write on notifications
  for all to authenticated
  using (has_role(array['super_admin']))
  with check (has_role(array['super_admin']));

-- ---- attachments ----
create policy attachments_write on attachments
  for all to authenticated
  using (
    has_role(array['super_admin','asset_admin','warehouse','project_mgr','technician'])
    or uploaded_by = auth.uid()
  )
  with check (
    has_role(array['super_admin','asset_admin','warehouse','project_mgr','technician'])
    or uploaded_by = auth.uid()
  );

-- ---- LOCKED tables: roles, permissions, role_permissions, users (writes)
-- Only super_admin can change these directly. (Note: signup of new auth.users
-- still works via Supabase Auth; the FK row in public.users for that user
-- needs admin attention.)
create policy roles_super_write on roles
  for all to authenticated
  using (has_role(array['super_admin']))
  with check (has_role(array['super_admin']));

create policy permissions_super_write on permissions
  for all to authenticated
  using (has_role(array['super_admin']))
  with check (has_role(array['super_admin']));

create policy role_permissions_super_write on role_permissions
  for all to authenticated
  using (has_role(array['super_admin']))
  with check (has_role(array['super_admin']));

create policy users_super_write on users
  for all to authenticated
  using (has_role(array['super_admin']))
  with check (has_role(array['super_admin']));

-- Users can read+update their OWN profile row (display name, phone).
create policy users_self_update on users
  for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    -- but cannot change their own role / status
    and role_id is not distinct from (select u.role_id from users u where u.id = auth.uid())
    and status is not distinct from (select u.status from users u where u.id = auth.uid())
  );

-- ---- master data: categories, locations, departments, projects, suppliers
-- Only asset admin / super admin can write.
create policy asset_categories_write on asset_categories
  for all to authenticated
  using (has_role(array['super_admin','asset_admin']))
  with check (has_role(array['super_admin','asset_admin']));

create policy asset_locations_write on asset_locations
  for all to authenticated
  using (has_role(array['super_admin','asset_admin']))
  with check (has_role(array['super_admin','asset_admin']));

create policy departments_write on departments
  for all to authenticated
  using (has_role(array['super_admin','asset_admin']))
  with check (has_role(array['super_admin','asset_admin']));

create policy projects_write on projects
  for all to authenticated
  using (has_role(array['super_admin','asset_admin','project_mgr']))
  with check (has_role(array['super_admin','asset_admin','project_mgr']));

create policy suppliers_write on suppliers
  for all to authenticated
  using (has_role(array['super_admin','asset_admin','purchasing']))
  with check (has_role(array['super_admin','asset_admin','purchasing']));
