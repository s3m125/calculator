-- Seed application users (profiles).
-- IMPORTANT: this assumes the matching auth.users rows have already been created
-- (see scripts/bootstrap-users.ts). Run AFTER the bootstrap script.

-- Map auth user emails to app users + roles + departments.
insert into users (id, employee_id, full_name, email, phone, role_id, department_id, position, status)
select au.id, x.employee_id, x.full_name, x.email, x.phone,
       (select id from roles where code = x.role_code),
       (select id from departments where code = x.dept_code),
       x.position, 'active'
  from auth.users au
  join (values
    ('superadmin@gsi.local', 'EMP-001', 'Super Admin',     '081200000001', 'super_admin', 'IT',    'System Administrator'),
    ('admin@gsi.local',      'EMP-002', 'Andi Pratama',    '081200000002', 'asset_admin', 'IT',    'IT Manager'),
    ('finance@gsi.local',    'EMP-003', 'Dewi Santoso',    '081200000003', 'finance',     'FIN',   'Finance Manager'),
    ('purchasing@gsi.local', 'EMP-004', 'Eka Ramadhan',    '081200000004', 'purchasing',  'OPS',   'Purchasing Lead'),
    ('warehouse@gsi.local',  'EMP-005', 'Gita Sari',       '081200000005', 'warehouse',   'WH',    'Warehouse Supervisor'),
    ('pm@gsi.local',         'EMP-006', 'Citra Wijaya',    '081200000006', 'project_mgr', 'PROJ',  'Project Manager'),
    ('tech1@gsi.local',      'EMP-007', 'Joko Susanto',    '081200000007', 'technician',  'PROJ',  'Senior Technician'),
    ('tech2@gsi.local',      'EMP-008', 'Lukman Hakim',    '081200000008', 'technician',  'PROJ',  'Technician'),
    ('employee@gsi.local',   'EMP-009', 'Maya Putri',      '081200000009', 'employee',    'SALES', 'Sales Executive'),
    ('ceo@gsi.local',        'EMP-010', 'Budi Hartono',    '081200000010', 'ceo_viewer',  'OPS',   'CEO')
  ) as x(email, employee_id, full_name, phone, role_code, dept_code, position)
    on au.email = x.email
on conflict (id) do update set
  full_name = excluded.full_name,
  role_id = excluded.role_id,
  department_id = excluded.department_id,
  position = excluded.position;
