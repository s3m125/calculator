// Edge-safe middleware: NO Supabase client, NO env var reads, NO network
// calls. Just a fast cookie check that redirects unauthenticated users to
// /login. Real auth validation happens server-side in (app)/layout.tsx via
// getProfile(), so an invalid/expired cookie is still rejected there.
//
// Why this is split:
// - createServerClient + auth.getUser() works in Node but is brittle in
//   Vercel's Edge runtime (MIDDLEWARE_INVOCATION_FAILED). Removing it
//   makes the middleware deterministic and dependency-free.
import { NextResponse, type NextRequest } from "next/server";

const LOCAL_SESSION_COOKIE = "gsi-session";

function hasAnySessionCookie(request: NextRequest): boolean {
  if (request.cookies.get(LOCAL_SESSION_COOKIE)?.value) return true;
  // Supabase-ssr stores its session as sb-<project-ref>-auth-token (and
  // sometimes split chunks like sb-<ref>-auth-token.0/.1).
  for (const c of request.cookies.getAll()) {
    if (c.name.startsWith("sb-") && c.name.includes("-auth-token") && c.value) {
      return true;
    }
  }
  return false;
}

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublic =
    path.startsWith("/login") ||
    path.startsWith("/scan") ||
    path.startsWith("/api/public") ||
    path.startsWith("/api/local") ||
    path.startsWith("/api/auth"); // future-proof for Supabase auth callbacks

  const hasSession = hasAnySessionCookie(request);

  if (!hasSession && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && path === "/login") {
    const home = request.nextUrl.clone();
    home.pathname = "/dashboard-v2";
    return NextResponse.redirect(home);
  }

  return NextResponse.next({ request });
}
