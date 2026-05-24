-- Seed sample assets (run AFTER seed.sql).
-- Asset IDs are generated automatically by the trigger.

with c as (select code, id, prefix, useful_life_years from asset_categories),
     s as (select code, id from suppliers),
     l as (select code, id from asset_locations),
     d as (select code, id from departments),
     p as (select code, id from projects)
insert into assets (
  name, category_id, brand, model, serial_number, specification,
  purchase_date, supplier_id, po_number, invoice_number, purchase_price,
  useful_life_years, depreciation_method, book_value,
  location_id, department_id, project_id, status, condition,
  warranty_start, warranty_end, notes
)
select v.* from (values
  -- LAPTOPS
  ('Laptop ThinkPad T14',         (select id from c where code='LAPTOP'),    'Lenovo','ThinkPad T14 Gen 3','LN-T14-001','i7-1260P, 16GB RAM, 512GB SSD',
    date '2024-02-10',(select id from s where code='SUP-004'),'PO-2024-021','INV-2024-101', 21500000,
    4,'straight_line',16125000,(select id from l where code='HQ'),(select id from d where code='IT'),null,'assigned','good',
    date '2024-02-10',date '2027-02-10','Allocated to IT manager'),
  ('Laptop ThinkPad E14',         (select id from c where code='LAPTOP'),    'Lenovo','ThinkPad E14','LN-E14-002','i5-1235U, 16GB, 512GB',
    date '2024-05-15',(select id from s where code='SUP-004'),'PO-2024-035','INV-2024-145', 14500000,
    4,'straight_line',12000000,(select id from l where code='HQ'),(select id from d where code='FIN'),null,'assigned','good',
    date '2024-05-15',date '2027-05-15',null),
  ('Laptop MacBook Pro 14"',      (select id from c where code='LAPTOP'),    'Apple','MacBook Pro 14 M3','MBP-M3-003','M3 Pro, 18GB, 512GB',
    date '2025-01-20',(select id from s where code='SUP-004'),'PO-2025-005','INV-2025-007', 32000000,
    4,'straight_line',29000000,(select id from l where code='HQ'),(select id from d where code='SALES'),null,'assigned','new',
    date '2025-01-20',date '2026-01-20',null),
  ('Laptop ROG Strix G16',        (select id from c where code='LAPTOP'),    'Asus','ROG Strix G16','ASUS-G16-004','i9, RTX 4060, 32GB',
    date '2025-03-12',(select id from s where code='SUP-004'),'PO-2025-018','INV-2025-022', 28000000,
    4,'straight_line',26000000,(select id from l where code='HQ'),(select id from d where code='PROJ'),null,'available','new',
    date '2025-03-12',date '2027-03-12','Spare for project use'),
  ('Desktop PC Workstation',      (select id from c where code='LAPTOP'),    'HP','Z2 G9 Tower','HP-Z2-005','i7-13700, 32GB, 1TB SSD',
    date '2024-09-04',(select id from s where code='SUP-004'),'PO-2024-061','INV-2024-220', 24500000,
    4,'straight_line',21000000,(select id from l where code='HQ'),(select id from d where code='IT'),null,'assigned','good',
    date '2024-09-04',date '2027-09-04',null),

  -- PRINTERS
  ('Printer Epson L3210',         (select id from c where code='PRINTER'),   'Epson','L3210','EP-L3210-101','EcoTank, A4 multi-fungsi',
    date '2024-04-22',(select id from s where code='SUP-005'),'PO-2024-030','INV-2024-130',  3200000,
    5,'straight_line',2600000,(select id from l where code='HQ'),(select id from d where code='HR'),null,'available','good',
    date '2024-04-22',date '2026-04-22',null),
  ('Printer Brother MFC-L2715DW', (select id from c where code='PRINTER'),   'Brother','MFC-L2715DW','BR-L2715-102','Mono laser MFP',
    date '2025-02-01',(select id from s where code='SUP-005'),'PO-2025-008','INV-2025-014',  5800000,
    5,'straight_line',5300000,(select id from l where code='OFC-BDG'),(select id from d where code='OPS'),null,'available','good',
    date '2025-02-01',date '2027-02-01',null),

  -- CCTV DEMO
  ('CCTV Camera Bullet 8MP',      (select id from c where code='CCTV_DEMO'), 'Hikvision','DS-2CD2T87G2','HIK-87G2-201','8MP AcuSense bullet',
    date '2024-08-15',(select id from s where code='SUP-001'),'PO-2024-052','INV-2024-198',  4200000,
    5,'straight_line',3500000,(select id from l where code='DEMO-ROOM'),(select id from d where code='SALES'),null,'available','new',
    date '2024-08-15',date '2026-08-15','Demo unit for sales'),
  ('CCTV Camera Dome 4MP',        (select id from c where code='CCTV_DEMO'), 'Dahua','IPC-HDBW3441E','DH-3441-202','4MP starlight dome',
    date '2025-01-08',(select id from s where code='SUP-002'),'PO-2025-002','INV-2025-003',  3100000,
    5,'straight_line',2900000,(select id from l where code='DEMO-ROOM'),(select id from d where code='SALES'),null,'borrowed','new',
    date '2025-01-08',date '2027-01-08','Borrowed for client demo'),
  ('CCTV Camera PTZ',             (select id from c where code='CCTV_DEMO'), 'Hikvision','DS-2DE4225IW','HIK-PTZ-203','2MP 25x zoom PTZ',
    date '2025-04-20',(select id from s where code='SUP-001'),'PO-2025-022','INV-2025-031', 12500000,
    5,'straight_line',11500000,(select id from l where code='SITE-JKT-CCTV'),(select id from d where code='PROJ'),
    (select id from p where code='PRJ-2025-001'),'assigned','good',
    date '2025-04-20',date '2027-04-20',null),
  ('CCTV Camera Thermal',         (select id from c where code='CCTV_DEMO'), 'Dahua','TPC-BF5421','DH-THM-204','Thermal bullet camera',
    date '2025-06-01',(select id from s where code='SUP-002'),'PO-2025-030','INV-2025-040', 28000000,
    5,'straight_line',26500000,(select id from l where code='DEMO-ROOM'),(select id from d where code='SALES'),null,'in_repair','fair',
    date '2025-06-01',date '2027-06-01','Lens damaged, sent to vendor'),

  -- NVR DEMO
  ('NVR 16 Channel',              (select id from c where code='NVR_DEMO'),  'Hikvision','DS-7616NI-K2','HIK-NVR16-301','16ch, 2 SATA',
    date '2024-08-15',(select id from s where code='SUP-001'),'PO-2024-052','INV-2024-198',  6800000,
    5,'straight_line',5800000,(select id from l where code='DEMO-ROOM'),(select id from d where code='SALES'),null,'available','good',
    date '2024-08-15',date '2026-08-15',null),
  ('NVR 32 Channel',              (select id from c where code='NVR_DEMO'),  'Dahua','NVR5232','DH-NVR32-302','32ch 4K NVR',
    date '2025-02-10',(select id from s where code='SUP-002'),'PO-2025-010','INV-2025-018',  9500000,
    5,'straight_line',8800000,(select id from l where code='SITE-JKT-CCTV'),(select id from d where code='PROJ'),
    (select id from p where code='PRJ-2025-001'),'assigned','good',
    date '2025-02-10',date '2027-02-10',null),

  -- VIDEOTRON
  ('Videotron Module P3 Indoor',  (select id from c where code='VIDEOTRON'), 'Absen','A3 Pro','ABS-A3-401','P3 indoor LED module 320x160mm',
    date '2024-11-05',(select id from s where code='SUP-003'),'PO-2024-070','INV-2024-260',  4500000,
    7,'straight_line',4100000,(select id from l where code='SITE-SBY-VT'),(select id from d where code='PROJ'),
    (select id from p where code='PRJ-2025-002'),'assigned','good',
    date '2024-11-05',date '2026-11-05',null),
  ('Videotron Module P4 Outdoor', (select id from c where code='VIDEOTRON'), 'Unilumin','Upad III','UNI-P4-402','P4 outdoor module 320x160mm',
    date '2025-03-22',(select id from s where code='SUP-003'),'PO-2025-019','INV-2025-027',  3800000,
    7,'straight_line',3600000,(select id from l where code='WH-SBY'),(select id from d where code='WH'),null,'available','new',
    date '2025-03-22',date '2027-03-22',null),
  ('Videotron Module P10 Outdoor',(select id from c where code='VIDEOTRON'), 'Linsn','TS802D','LIN-P10-403','P10 outdoor module',
    date '2023-05-10',(select id from s where code='SUP-003'),'PO-2023-040','INV-2023-150',  2500000,
    7,'straight_line', 700000,(select id from l where code='WH-SBY'),(select id from d where code='WH'),null,'damaged','poor',
    date '2023-05-10',date '2025-05-10','Decommissioned, scheduled disposal'),

  -- LED PROCESSOR
  ('LED Processor Novastar VX600',(select id from c where code='LED_PROC'),  'Novastar','VX600','NOV-VX600-501','All-in-one LED processor',
    date '2024-10-12',(select id from s where code='SUP-003'),'PO-2024-068','INV-2024-250', 18500000,
    6,'straight_line',17000000,(select id from l where code='SITE-SBY-VT'),(select id from d where code='PROJ'),
    (select id from p where code='PRJ-2025-002'),'assigned','good',
    date '2024-10-12',date '2026-10-12',null),
  ('LED Processor Magnimage',     (select id from c where code='LED_PROC'),  'Magnimage','MIG-S6','MAG-S6-502','LED video processor',
    date '2025-01-30',(select id from s where code='SUP-003'),'PO-2025-007','INV-2025-013', 12000000,
    6,'straight_line',11400000,(select id from l where code='DEMO-ROOM'),(select id from d where code='SALES'),null,'available','new',
    date '2025-01-30',date '2027-01-30',null),

  -- TOOLS
  ('Bor Tangan Makita HP1640',    (select id from c where code='TOOLS'),     'Makita','HP1640','MAK-HP1640-601','Impact drill 13mm',
    date '2024-03-18',(select id from s where code='SUP-008'),'PO-2024-025','INV-2024-115',  1200000,
    3,'straight_line',  600000,(select id from l where code='WH-JKT'),(select id from d where code='WH'),null,'available','good',
    date '2024-03-18',date '2025-03-18',null),
  ('Tang Crimping RJ45',          (select id from c where code='TOOLS'),     'Krisbow','KW0102','KW-CRIMP-602','UTP crimping tool',
    date '2024-06-22',(select id from s where code='SUP-008'),'PO-2024-040','INV-2024-170',   350000,
    3,'straight_line',  200000,(select id from l where code='WH-JKT'),(select id from d where code='WH'),null,'borrowed','good',
    date '2024-06-22',date '2025-06-22',null),
  ('Tangga Aluminium 3m',         (select id from c where code='TOOLS'),     'Krisbow','KW-LD3','KW-LD3-603','Lipat 3m aluminum',
    date '2023-08-01',(select id from s where code='SUP-008'),'PO-2023-055','INV-2023-200',  1800000,
    3,'straight_line',  400000,(select id from l where code='WH-JKT'),(select id from d where code='WH'),null,'available','fair',
    date '2023-08-01',date '2024-08-01',null),
  ('Multimeter Fluke 117',        (select id from c where code='TOOLS'),     'Fluke','117','FL-117-604','True RMS multimeter',
    date '2024-12-10',(select id from s where code='SUP-008'),'PO-2024-080','INV-2024-300',  3500000,
    3,'straight_line',3000000,(select id from l where code='WH-JKT'),(select id from d where code='WH'),null,'assigned','new',
    date '2024-12-10',date '2025-12-10',null),
  ('Hand Pallet 2 Ton',           (select id from c where code='TOOLS'),     'Krisbow','PJ-25','KW-PJ25-605','Hand pallet jack 2T',
    date '2023-11-14',(select id from s where code='SUP-008'),'PO-2023-068','INV-2023-260',  4500000,
    3,'straight_line',1500000,(select id from l where code='WH-SBY'),(select id from d where code='WH'),null,'available','fair',
    date '2023-11-14',date '2024-11-14',null),

  -- VEHICLES
  ('Mobil Operasional Avanza',    (select id from c where code='VEHICLE'),   'Toyota','Avanza Veloz','TYT-AVZ-701','B 1234 GSI - Hitam',
    date '2023-02-01',(select id from s where code='SUP-007'),'PO-2023-005','INV-2023-020',  235000000,
    8,'straight_line', 175000000,(select id from l where code='HQ'),(select id from d where code='OPS'),null,'available','good',
    date '2023-02-01',date '2026-02-01',null),
  ('Motor Operasional Vario',     (select id from c where code='VEHICLE'),   'Honda','Vario 160','HND-VAR-702','B 5678 GSI - Merah',
    date '2024-04-10',(select id from s where code='SUP-007'),'PO-2024-029','INV-2024-128',   31000000,
    8,'straight_line',  27000000,(select id from l where code='HQ'),(select id from d where code='OPS'),null,'assigned','good',
    date '2024-04-10',date '2026-04-10',null),
  ('Pickup L300 Box',             (select id from c where code='VEHICLE'),   'Mitsubishi','L300 Pickup','MTS-L300-703','B 9012 GSI - Putih',
    date '2022-07-20',(select id from s where code='SUP-007'),'PO-2022-045','INV-2022-170', 215000000,
    8,'straight_line', 130000000,(select id from l where code='WH-JKT'),(select id from d where code='WH'),null,'available','good',
    date '2022-07-20',date '2025-07-20',null),

  -- FURNITURE
  ('Meja Kerja L-Shape',          (select id from c where code='FURNITURE'), 'Olympic','LWS-160','OLY-LWS-801','L-shape 160cm',
    date '2022-09-15',null,'PO-2022-052','INV-2022-200',  2500000,
   10,'straight_line', 1700000,(select id from l where code='HQ'),(select id from d where code='IT'),null,'assigned','good',
    null, null, null),
  ('Kursi Ergonomic',             (select id from c where code='FURNITURE'), 'Ergohuman','V2','ERG-V2-802','Mesh ergonomic chair',
    date '2024-01-05',null,'PO-2024-002','INV-2024-008',  4500000,
   10,'straight_line', 4100000,(select id from l where code='HQ'),(select id from d where code='IT'),null,'assigned','new',
    null, null, null),
  ('Lemari Arsip Besi',           (select id from c where code='FURNITURE'), 'Brother','B304','BR-FC-803','4-drawer filing cabinet',
    date '2021-04-12',null,'PO-2021-018','INV-2021-070',  1800000,
   10,'straight_line',  900000,(select id from l where code='HQ'),(select id from d where code='FIN'),null,'available','good',
    null, null, null),

  -- OFFICE EQUIPMENT
  ('AC Split 1.5 PK',             (select id from c where code='OFFICE'),    'Daikin','FTV35','DKN-AC15-901','Inverter 1.5 PK',
    date '2024-05-30',null,'PO-2024-038','INV-2024-148',  6500000,
    5,'straight_line', 5500000,(select id from l where code='HQ'),(select id from d where code='HR'),null,'available','good',
    date '2024-05-30',date '2025-05-30',null),
  ('Projector Epson EB-X06',      (select id from c where code='OFFICE'),    'Epson','EB-X06','EP-EBX06-902','XGA 3600 lumens',
    date '2024-08-08',(select id from s where code='SUP-005'),'PO-2024-050','INV-2024-190',  8500000,
    5,'straight_line', 7400000,(select id from l where code='HQ'),(select id from d where code='SALES'),null,'borrowed','good',
    date '2024-08-08',date '2026-08-08',null),
  ('Smart TV 55"',                (select id from c where code='OFFICE'),    'Samsung','UA55AU8000','SMS-55-903','55 inch 4K',
    date '2024-02-15',null,'PO-2024-014','INV-2024-080',  9800000,
    5,'straight_line', 8200000,(select id from l where code='DEMO-ROOM'),(select id from d where code='SALES'),null,'available','good',
    date '2024-02-15',date '2026-02-15',null),

  -- PROJECT EQUIPMENT
  ('Toolbox Lapangan Set',        (select id from c where code='PRJ_EQ'),    'Stanley','STMT81243','STN-TB-1001','Toolbox 65pcs',
    date '2024-04-01',(select id from s where code='SUP-008'),'PO-2024-028','INV-2024-127',  2800000,
    5,'straight_line', 2300000,(select id from l where code='SITE-JKT-CCTV'),(select id from d where code='PROJ'),
    (select id from p where code='PRJ-2025-001'),'assigned','good',
    null, null, null),
  ('Walkie Talkie Set',           (select id from c where code='PRJ_EQ'),    'Motorola','XiR-P3688','MOT-WT-1002','VHF, 5 unit set',
    date '2024-06-15',null,'PO-2024-041','INV-2024-172',  6500000,
    5,'straight_line', 5400000,(select id from l where code='SITE-SBY-VT'),(select id from d where code='PROJ'),
    (select id from p where code='PRJ-2025-002'),'assigned','good',
    null, null, null),
  ('Safety Helmet Set 10pcs',     (select id from c where code='PRJ_EQ'),    'MSA','V-Gard','MSA-HLM-1003','Hard hat set 10pcs',
    date '2024-03-10',null,'PO-2024-022','INV-2024-110',  1500000,
    5,'straight_line', 1200000,(select id from l where code='SITE-BDG-SB'),(select id from d where code='PROJ'),
    (select id from p where code='PRJ-2025-003'),'assigned','good',
    null, null, null),

  -- WAREHOUSE EQUIPMENT
  ('Forklift Diesel 3 Ton',       (select id from c where code='WH_EQ'),     'Toyota','8FD30','TYT-FL-1101','3-ton diesel forklift',
    date '2022-08-15',null,'PO-2022-050','INV-2022-185', 285000000,
    6,'straight_line', 165000000,(select id from l where code='WH-JKT'),(select id from d where code='WH'),null,'available','good',
    null, null, null),
  ('Rak Gudang Heavy Duty',       (select id from c where code='WH_EQ'),     'Krisbow','RHD-200','KW-RHD-1102','Heavy-duty rack 4 tier',
    date '2023-11-22',(select id from s where code='SUP-008'),'PO-2023-070','INV-2023-270',  4500000,
    6,'straight_line', 3200000,(select id from l where code='WH-SBY'),(select id from d where code='WH'),null,'available','good',
    null, null, null),

  -- NETWORK
  ('Router Mikrotik CCR1009',     (select id from c where code='NETWORK'),   'Mikrotik','CCR1009-7G-1C','MK-CCR-1201','9-port router',
    date '2024-05-04',(select id from s where code='SUP-010'),'PO-2024-036','INV-2024-150', 12500000,
    5,'straight_line',10500000,(select id from l where code='HQ'),(select id from d where code='IT'),null,'assigned','good',
    date '2024-05-04',date '2026-05-04',null),
  ('Switch Cisco 24 Port',        (select id from c where code='NETWORK'),   'Cisco','SG350-28','CSC-SW-1202','Managed 28-port switch',
    date '2024-07-18',null,'PO-2024-045','INV-2024-180',  9500000,
    5,'straight_line', 8200000,(select id from l where code='HQ'),(select id from d where code='IT'),null,'assigned','good',
    date '2024-07-18',date '2027-07-18',null),
  ('Access Point Ubiquiti U6-Pro',(select id from c where code='NETWORK'),   'Ubiquiti','U6-Pro','UBI-AP-1203','WiFi 6 AP',
    date '2025-02-22',(select id from s where code='SUP-010'),'PO-2025-012','INV-2025-020',  3200000,
    5,'straight_line', 3000000,(select id from l where code='OFC-BDG'),(select id from d where code='IT'),null,'available','new',
    date '2025-02-22',date '2027-02-22',null),

  -- GENSET / POWER
  ('Genset Silent 10 KVA',        (select id from c where code='GENSET'),    'Honda','EM10000','HND-GEN10-1301','10 KVA silent diesel',
    date '2023-09-08',(select id from s where code='SUP-009'),'PO-2023-058','INV-2023-220',  78000000,
    8,'straight_line',  60000000,(select id from l where code='SITE-JKT-CCTV'),(select id from d where code='PROJ'),
    (select id from p where code='PRJ-2025-001'),'assigned','good',
    date '2023-09-08',date '2025-09-08',null),
  ('UPS APC 3000VA',              (select id from c where code='GENSET'),    'APC','SMT3000I','APC-UPS-1302','Smart-UPS 3000VA tower',
    date '2024-04-25',null,'PO-2024-032','INV-2024-138', 18500000,
    8,'straight_line', 17000000,(select id from l where code='HQ'),(select id from d where code='IT'),null,'assigned','good',
    date '2024-04-25',date '2026-04-25',null)
) as v(
  name, category_id, brand, model, serial_number, specification,
  purchase_date, supplier_id, po_number, invoice_number, purchase_price,
  useful_life_years, depreciation_method, book_value,
  location_id, department_id, project_id, status, condition,
  warranty_start, warranty_end, notes
);

-- =========================================================================
-- Sample maintenance + assignment + audit records
-- =========================================================================

-- A maintenance record for the damaged thermal camera
insert into asset_maintenance (asset_id, maintenance_type, description, vendor_name, cost, status, schedule_date)
select id, 'corrective', 'Lens damaged — needs replacement', 'PT Dahua Service Center', 2500000, 'in_progress', current_date + 5
  from assets where serial_number = 'DH-THM-204';

-- A maintenance record for the genset (preventive)
insert into asset_maintenance (asset_id, maintenance_type, description, vendor_name, cost, status, schedule_date)
select id, 'preventive', 'Service rutin 1000 jam — ganti oli & filter', 'CV Genset Indo Power', 1500000, 'requested', current_date + 14
  from assets where serial_number = 'HND-GEN10-1301';

-- Sample audit (open)
insert into asset_audits (audit_code, title, location_id, scheduled_date, status)
values (
  'AUD-2026-001',
  'Stock Opname Q2 - Warehouse Jakarta',
  (select id from asset_locations where code='WH-JKT'),
  current_date + 7,
  'open'
);
