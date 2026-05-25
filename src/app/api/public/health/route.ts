// Public health-check: reveals whether the Supabase env vars are set on the
// running deployment. Never returns the values themselves — only true/false +
// shape sanity (length / starts-with). Safe to expose publicly.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function describe(name: string) {
  const v = process.env[name];
  if (!v) return { set: false };
  return {
    set: true,
    length: v.length,
    prefix: v.slice(0, 8) + "...",
  };
}

export async function GET() {
  return NextResponse.json({
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    vercel_url: process.env.VERCEL_URL ?? null,
    NEXT_PUBLIC_SUPABASE_URL: describe("NEXT_PUBLIC_SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: describe("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    SUPABASE_SERVICE_ROLE_KEY: describe("SUPABASE_SERVICE_ROLE_KEY"),
    NEXT_PUBLIC_APP_URL: describe("NEXT_PUBLIC_APP_URL"),
  });
}
