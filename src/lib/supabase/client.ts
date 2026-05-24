"use client";

import { createBrowserClient } from "@supabase/ssr";
import { createBrowserLocalClient } from "@/lib/local-db/browser-client";

function isLocalModeClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return !url || url.includes("placeholder") || url.includes("localhost-local");
}

export function createClient() {
  if (isLocalModeClient()) {
    return createBrowserLocalClient() as unknown as ReturnType<typeof createBrowserClient>;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createBrowserClient(url, key);
}
