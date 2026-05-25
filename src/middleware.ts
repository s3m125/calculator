import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (err) {
    // Belt-and-suspenders: if middleware ever throws, let the request
    // continue. Page-level auth (in (app)/layout.tsx via getProfile())
    // will still redirect unauthenticated visitors to /login.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[middleware] error:", err);
    }
    return NextResponse.next({ request });
  }
}

export const config = {
  // Exclude Next internals, static images, and API routes. API routes
  // protect themselves where needed; running middleware over them is just
  // unnecessary overhead.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
