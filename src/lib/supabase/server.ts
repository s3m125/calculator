import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { isLocalMode } from "@/lib/local-db";
import { from as localFrom } from "@/lib/local-db/query-builder";
import { getUserByToken, signIn, signOut as localSignOut, SESSION_COOKIE } from "@/lib/local-db/auth";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

// Minimal interface that matches the parts of the supabase-js client our
// code actually uses. Both the real client and the local shim satisfy this.
export interface AppClient {
  from(table: string): ReturnType<typeof localFrom>;
  auth: {
    getUser(): Promise<{ data: { user: { id: string; email?: string } | null } }>;
    signInWithPassword(args: { email: string; password: string }): Promise<{ data: unknown; error: { message: string } | null }>;
    signOut(): Promise<void>;
  };
}

function realClient(): AppClient {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  // The real supabase-js client satisfies AppClient (structurally).
  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch { /* ignore */ }
      },
    },
  }) as unknown as AppClient;
}

function localClient(): AppClient {
  const cookieStore = cookies();
  return {
    from(table: string) { return localFrom(table); },
    auth: {
      async getUser() {
        const token = cookieStore.get(SESSION_COOKIE)?.value;
        const u = await getUserByToken(token);
        return { data: { user: u ? { id: u.id, email: u.email } : null } };
      },
      async signInWithPassword({ email, password }) {
        const r = await signIn(email, password);
        if ("error" in r) return { data: null, error: { message: r.error } };
        try { cookieStore.set(SESSION_COOKIE, r.token, { httpOnly: true, path: "/", sameSite: "lax", maxAge: 12 * 3600 }); } catch { /* ignore */ }
        return { data: { user: r.user }, error: null };
      },
      async signOut() {
        const token = cookieStore.get(SESSION_COOKIE)?.value;
        await localSignOut(token);
        try { cookieStore.delete(SESSION_COOKIE); } catch { /* ignore */ }
      },
    },
  };
}

export function createClient(): AppClient {
  return isLocalMode() ? localClient() : realClient();
}

export function createServiceClient(): AppClient {
  // In local mode no separate service key is needed.
  return createClient();
}
