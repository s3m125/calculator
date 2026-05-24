// Cookie-based auth backed by pglite. Mirrors the supabase-auth shape used
// in the codebase: { data: { user: { id, email } }, error }.
import "server-only";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { getDb } from "./index";

export const SESSION_COOKIE = "gsi-session";
const SESSION_TTL_HOURS = 12;

export interface LocalUser {
  id: string;
  email: string;
  full_name: string;
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ user: LocalUser; token: string } | { error: string }> {
  const db = await getDb();
  const { rows } = await db.query<{
    id: string;
    email: string;
    full_name: string;
    password_hash: string | null;
    status: string;
  }>(
    `SELECT id, email, full_name, password_hash, status FROM users WHERE lower(email) = lower($1) LIMIT 1`,
    [email],
  );
  const u = rows[0];
  if (!u) return { error: "Invalid email or password" };
  if (u.status !== "active") return { error: "Account is inactive" };
  if (!u.password_hash) return { error: "No password set for this account" };
  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) return { error: "Invalid email or password" };

  const token = randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000);
  await db.query(
    `INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)`,
    [token, u.id, expires.toISOString()],
  );
  return { user: { id: u.id, email: u.email, full_name: u.full_name }, token };
}

export async function getUserByToken(token: string | undefined): Promise<LocalUser | null> {
  if (!token) return null;
  const db = await getDb();
  const { rows } = await db.query<{
    id: string;
    email: string;
    full_name: string;
    expires_at: string;
  }>(
    `SELECT u.id, u.email, u.full_name, s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token = $1
      LIMIT 1`,
    [token],
  );
  const row = rows[0];
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await db.query(`DELETE FROM sessions WHERE token = $1`, [token]);
    return null;
  }
  return { id: row.id, email: row.email, full_name: row.full_name };
}

export async function signOut(token: string | undefined): Promise<void> {
  if (!token) return;
  const db = await getDb();
  await db.query(`DELETE FROM sessions WHERE token = $1`, [token]);
}
