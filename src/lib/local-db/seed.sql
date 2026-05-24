-- Seed data for local pglite mode.

insert into roles (code, name, description) values
  ('super_admin',   'Super Admin',     'Full system access'),
  ('asset_admin',   'Asset Admin',     'Manage all asset master data'),
  ('finance',       'Finance',         'Finance / accounting / depreciation'),
  ('purchasing',    'Purchasing',      'Purchase requests & PO'),
  ('warehouse',     'Warehouse',       'Receive, store, ship assets'),
  ('project_mgr',   'Project Manager', 'Manage project-site assets'),
  ('technician',    'Technician',      'Field technician, scan/maintain'),
  ('employee',      'Employee',        'Standard employee'),
  ('ceo_viewer',    'CEO / Viewer',    'Read-only management view')
on conflict (code) do nothing;

insert into permissions (code, name, module) values
  ('asset.view','View assets','asset'),
  ('asset.create','Create assets','asset'),
  ('asset.edit','Edit assets','asset'),
  ('asset.delete','Delete assets','asset'),
  ('asset.export','Export assets','asset'),
  ('assignment.manage','Manage assignments','assignment'),
  ('transfer.manage','Manage transfers','transfer'),
  ('maintenance.manage','Manage maintenance','maintenance'),
  ('audit.manage','Manage audits','audit'),
  ('audit.scan','Scan QR for audit','audit'),
  ('approval.approve','Approve requests','approval'),
  ('finance.view','View finance','finance'),
  ('user.manage','Manage users','user')
on conflict (code) do nothing;

insert into departments (code, name, manager_name) values
  ('IT',    'Information Technology',   'Andi Pratama'),
  ('OPS',   'Operations',                'Budi Hartono'),
  ('PROJ',  'Project Delivery',          'Citra Wijaya'),
  ('FIN',   'Finance & Accounting',      'Dewi Santoso'),
  ('HR',    'Human Resources & GA',      'Eka Ramadhan'),
  ('SALES', 'Sales & Marketing',         'Fajar Nugraha'),
  ('WH',    'Warehouse & Logistics',     'Gita Sari')
on conflict (code) do nothing;

insert into projects (code, name, client_name, location, status, start_date, end_date) values
  ('PRJ-2025-001','CCTV Tower Jakarta',         'PT Menara Sentral',         'Jakarta Pusat', 'active',    '2025-03-01','2026-06-30'),
  ('PRJ-2025-002','Videotron Mall Surabaya',    'Surabaya Town Square',      'Surabaya',      'active',    '2025-08-01','2026-02-28'),
  ('PRJ-2025-003','Smart Building Bandung',     'Telkom Indonesia',          'Bandung',       'active',    '2025-10-01','2026-12-31'),
  ('PRJ-2024-007','LED Stadium Bali',           'GBK Bali',                  'Denpasar',      'completed', '2024-06-01','2025-04-30'),
  ('PRJ-2026-001','Demo Unit Tour Q1',          'Internal',                  'Multi-city',    'active',    '2026-01-15','2026-04-30')
on conflict (code) do nothing;

insert into suppliers (code, name, contact_name, phone, email, address) values
  ('SUP-001','PT Hikvision Indonesia',         'Hendra',  '021-5550111','sales@hikvision.id',    'Jakarta'),
  ('SUP-002','PT Dahua Solusi Nusantara',      'Lina',    '021-5550222','info@dahua.co.id',      'Jakarta'),
  ('SUP-003','CV Sumber LED Sejahtera',        'Rio',     '031-5550333','rio@sumberled.com',     'Surabaya'),
  ('SUP-004','PT Lenovo Indonesia',            'Maya',    '021-5550444','b2b@lenovo.id',         'Jakarta'),
  ('SUP-005','PT Epson Indonesia',             'Tono',    '021-5550555','sales@epson.id',        'Jakarta'),
  ('SUP-006','Toko Bangun Tools Mandiri',      'Joko',    '022-5550666','jokotools@gmail.com',   'Bandung'),
  ('SUP-007','PT Honda Prospect Motor',        'Sari',    '021-5550777','fleet@honda.id',        'Jakarta'),
  ('SUP-008','PT Krisbow Sejahtera',           'Bagus',   '021-5550888','order@krisbow.id',      'Jakarta'),
  ('SUP-009','CV Genset Indo Power',           'Indra',   '021-5550999','indra@gensetindo.id',   'Bekasi'),
  ('SUP-010','PT Mikrotik Distribusi',         'Vera',    '021-5550100','sales@mikrotik.id',     'Jakarta')
on conflict (code) do nothing;

insert into asset_categories (code, name, prefix, useful_life_years, description) values
  ('LAPTOP',    'Laptop / PC',         'LAP',  4, 'Laptops, desktops, workstations'),
  ('PRINTER',   'Printer',              'PRT',  5, 'Printers & multifunction'),
  ('CCTV_DEMO', 'CCTV Demo Unit',      'CCTV', 5, 'CCTV cameras for client demo'),
  ('NVR_DEMO',  'NVR/DVR Demo Unit',   'NVR',  5, 'Recorders for demo'),
  ('VIDEOTRON', 'Videotron Module',    'VTM',  7, 'LED videotron modules'),
  ('LED_PROC',  'LED Processor',       'LPR',  6, 'Video processors for LED walls'),
  ('TOOLS',     'Tools Teknisi',       'TLS',  3, 'Hand & power tools for technicians'),
  ('VEHICLE',   'Kendaraan',           'VHC',  8, 'Cars, motorbikes, vans'),
  ('FURNITURE', 'Furniture',           'FRN', 10, 'Office furniture'),
  ('OFFICE',    'Office Equipment',    'OFE',  5, 'AC, dispenser, projector etc.'),
  ('PRJ_EQ',    'Project Equipment',   'PJE',  5, 'Field project equipment'),
  ('WH_EQ',     'Warehouse Equipment', 'WHE',  6, 'Forklift, trolley, racks'),
  ('NETWORK',   'Network Device',      'NET',  5, 'Routers, switches, AP'),
  ('GENSET',    'Genset / Power',      'GEN',  8, 'Generators & UPS')
on conflict (code) do nothing;

insert into asset_locations (code, name, type, address, pic_name) values
  ('HQ',           'GSI HQ Jakarta',        'office',       'Jl. Gatot Subroto Kav. 12, Jakarta', 'Andi Pratama'),
  ('WH-JKT',       'Warehouse Jakarta',     'warehouse',    'Pergudangan Pulogadung, Jakarta',    'Gita Sari'),
  ('WH-SBY',       'Warehouse Surabaya',    'warehouse',    'Pergudangan Margomulyo, Surabaya',   'Hartono'),
  ('OFC-BDG',      'Branch Office Bandung', 'office',       'Jl. Asia Afrika, Bandung',           'Indra'),
  ('SITE-JKT-CCTV','Site Tower Jakarta',    'project_site', 'Menara Sentral, Jakarta Pusat',      'Joko'),
  ('SITE-SBY-VT',  'Site Mall Surabaya',    'project_site', 'Surabaya Town Square, Surabaya',     'Kurnia'),
  ('SITE-BDG-SB',  'Site Smart Building',   'project_site', 'Telkom Tower, Bandung',              'Lukman'),
  ('DEMO-ROOM',    'Demo Room HQ',          'office',       'Lt. 3 HQ Jakarta',                   'Maya')
on conflict (code) do nothing;
