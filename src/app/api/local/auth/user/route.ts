import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserByToken, SESSION_COOKIE } from "@/lib/local-db/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = await getUserByToken(token);
  return NextResponse.json({ user });
}
