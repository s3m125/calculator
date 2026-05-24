"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, Menu, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps {
  userName: string;
  roleName: string;
  onOpenSidebar: () => void;
}

export function Header({ userName, roleName, onOpenSidebar }: HeaderProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/assets?q=${encodeURIComponent(q)}`);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200">
      <div className="h-16 px-4 lg:px-6 flex items-center gap-4">
        <button
          className="lg:hidden p-2 rounded-md text-slate-700 hover:bg-slate-100"
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <form onSubmit={onSubmit} className="flex-1 max-w-lg relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assets, serial number, project..."
            className="input pl-9"
          />
        </form>

        <div className="hidden sm:flex items-center gap-2">
          <button className="p-2 rounded-md text-slate-600 hover:bg-slate-100 relative">
            <Bell className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="text-right hidden sm:block leading-tight">
            <div className="text-sm font-semibold">{userName}</div>
            <div className="text-xs text-slate-500">{roleName}</div>
          </div>
          <div className="h-9 w-9 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-semibold">
            {initials || "U"}
          </div>
          <button
            onClick={signOut}
            className="p-2 rounded-md text-slate-500 hover:bg-slate-100"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
