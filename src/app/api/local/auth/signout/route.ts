import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { signOut, SESSION_COOKIE } from "@/lib/local-db/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  await signOut(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
