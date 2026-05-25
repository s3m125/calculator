// Singleton pglite instance + first-run initialization.
// Runs server-side only. Only loaded when isLocalMode() is true — pglite is
// imported dynamically inside getDb() so cloud builds (Vercel) never pull in
// the WASM payload.
import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";

// PGlite is intentionally not imported statically. Use `any` to avoid a
// top-level type dependency that webpack would resolve at build time.
type PGliteDb = {
  waitReady: Promise<unknown>;
  query<T = unknown>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
  exec(sql: string): Promise<unknown>;
};

declare global {
  // eslint-disable-next-line no-var
  var __pglite__: PGliteDb | undefined;
  // eslint-disable-next-line no-var
  var __pgliteReady__: Promise<void> | undefined;
}

const DATA_DIR = path.resolve(process.cwd(), ".local-db");

export const DEMO_PASSWORD = "Gsi#Demo2026";

export interface DemoUser {
  email: string;
  full_name: string;
  employee_id: string;
  phone: string;
  role_code: string;
  dept_code: string;
  position: string;
}

export const DEMO_USERS: DemoUser[] = [
  { email: "superadmin@gsi.local", full_name: "Super Admin",   employee_id: "EMP-001", phone: "081200000001", role_code: "super_admin",   dept_code: "IT",    position: "System Administrator" },
  { email: "admin@gsi.local",      full_name: "Andi Pratama",  employee_id: "EMP-002", phone: "081200000002", role_code: "asset_admin",   dept_code: "IT",    position: "IT Manager" },
  { email: "finance@gsi.local",    full_name: "Dewi Santoso",  employee_id: "EMP-003", phone: "081200000003", role_code: "finance",       dept_code: "FIN",   position: "Finance Manager" },
  { email: "purchasing@gsi.local", full_name: "Eka Ramadhan",  employee_id: "EMP-004", phone: "081200000004", role_code: "purchasing",    dept_code: "OPS",   position: "Purchasing Lead" },
  { email: "warehouse@gsi.local",  full_name: "Gita Sari",     employee_id: "EMP-005", phone: "081200000005", role_code: "warehouse",     dept_code: "WH",    position: "Warehouse Supervisor" },
  { email: "pm@gsi.local",         full_name: "Citra Wijaya",  employee_id: "EMP-006", phone: "081200000006", role_code: "project_mgr",   dept_code: "PROJ",  position: "Project Manager" },
  { email: "tech1@gsi.local",      full_name: "Joko Susanto",  employee_id: "EMP-007", phone: "081200000007", role_code: "technician",    dept_code: "PROJ",  position: "Senior Technician" },
  { email: "tech2@gsi.local",      full_name: "Lukman Hakim",  employee_id: "EMP-008", phone: "081200000008", role_code: "technician",    dept_code: "PROJ",  position: "Technician" },
  { email: "employee@gsi.local",   full_name: "Maya Putri",    employee_id: "EMP-009", phone: "081200000009", role_code: "employee",      dept_code: "SALES", position: "Sales Executive" },
  { email: "ceo@gsi.local",        full_name: "Budi Hartono",  employee_id: "EMP-010", phone: "081200000010", role_code: "ceo_viewer",    dept_code: "OPS",   position: "CEO" },
];

async function readSqlFile(name: string): Promise<string> {
  const p = path.join(process.cwd(), "src", "lib", "local-db", name);
  return await fs.readFile(p, "utf-8");
}

async function bootstrap(db: PGliteDb) {
  // 1. Schema
  await db.exec(await readSqlFile("schema.sql"));

  // 2. Reference data (skip if already populated)
  const { rows: rowsCount } = await db.query<{ c: number }>(
    "select count(*)::int as c from asset_categories",
  );
  if ((rowsCount[0]?.c ?? 0) === 0) {
    await db.exec(await readSqlFile("seed.sql"));
    await db.exec(await readSqlFile("seed_assets.sql"));
  }

  // 3. Demo users with hashed password (skip if any user exists)
  const { rows: u } = await db.query<{ c: number }>(
    "select count(*)::int as c from users",
  );
  if ((u[0]?.c ?? 0) === 0) {
    const hash = await bcrypt.hash(DEMO_PASSWORD, 6);
    for (const du of DEMO_USERS) {
      await db.query(
        `insert into users (employee_id, full_name, email, password_hash, phone, role_id, department_id, position, status)
         values ($1,$2,$3,$4,$5,
           (select id from roles where code = $6),
           (select id from departments where code = $7),
           $8, 'active')`,
        [
          du.employee_id, du.full_name, du.email, hash, du.phone,
          du.role_code, du.dept_code, du.position,
        ],
      );
    }
  }
}

async function createDb(): Promise<PGliteDb> {
  // In-memory mode — seeds reload on every server restart. Avoids the
  // file:// URL-arg issue on newer Node versions while keeping iteration
  // fast. Data created during a dev session persists until restart.
  void DATA_DIR;
  // Dynamic import keeps pglite out of the cloud build.
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite() as unknown as PGliteDb;
  await db.waitReady;
  await bootstrap(db);
  return db;
}

export async function getDb(): Promise<PGliteDb> {
  if (globalThis.__pglite__) {
    if (globalThis.__pgliteReady__) await globalThis.__pgliteReady__;
    return globalThis.__pglite__;
  }
  globalThis.__pgliteReady__ = (async () => {
    globalThis.__pglite__ = await createDb();
  })();
  await globalThis.__pgliteReady__;
  return globalThis.__pglite__!;
}

export function isLocalMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return !url || url.includes("placeholder") || url.includes("localhost-local");
}
