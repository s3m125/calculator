import { NextResponse } from "next/server";
import { signIn, SESSION_COOKIE } from "@/lib/local-db/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }
  const result = await signIn(String(email), String(password));
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }
  const res = NextResponse.json({ user: result.user });
  res.cookies.set(SESSION_COOKIE, result.token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 12 * 3600,
  });
  return res;
}
