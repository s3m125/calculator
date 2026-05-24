import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const SESSION_COOKIE = "gsi-session";

function isLocalMode() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return !url || url.includes("placeholder") || url.includes("localhost-local");
}

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublic =
    path.startsWith("/login") ||
    path.startsWith("/scan") ||
    path.startsWith("/api/public") ||
    path.startsWith("/api/local"); // local auth endpoints must be reachable while logged out

  // Local mode: check our own session cookie
  if (isLocalMode()) {
    const hasSession = !!request.cookies.get(SESSION_COOKIE)?.value;
    if (!hasSession && !isPublic) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", path);
      return NextResponse.redirect(loginUrl);
    }
    if (hasSession && path === "/login") {
      const home = request.nextUrl.clone();
      home.pathname = "/dashboard";
      return NextResponse.redirect(home);
    }
    return NextResponse.next({ request });
  }

  // Real Supabase mode
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }
  if (user && path === "/login") {
    const home = request.nextUrl.clone();
    home.pathname = "/dashboard";
    return NextResponse.redirect(home);
  }
  return response;
}
