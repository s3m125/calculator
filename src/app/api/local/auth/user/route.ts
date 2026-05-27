import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserByToken, SESSION_COOKIE } from "@/lib/local-db/auth";
import { isLocalMode } from "@/lib/local-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!isLocalMode()) {
    return NextResponse.json({ user: null });
  }
  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = await getUserByToken(token);
  return NextResponse.json({ user });
}
