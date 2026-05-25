"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, Menu, Calendar } from "lucide-react";

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

  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Friendly date range: last 7 days → today
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 7);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  const fmtY = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const range = `${fmt(start)} – ${fmtY(today)}`;

  return (
    <header className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200/60">
      <div className="h-16 px-4 lg:px-8 flex items-center gap-3">
        <button
          className="lg:hidden p-2 -ml-2 rounded-md text-slate-700 hover:bg-slate-100"
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <form onSubmit={onSubmit} className="flex-1 max-w-xl relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assets, IDs, categories..."
            className="w-full h-10 pl-10 pr-3 rounded-lg bg-white border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
          />
        </form>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:flex h-10 items-center gap-2 px-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-700">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-[13px] font-medium tabular-nums">{range}</span>
          </div>

          <button className="relative h-10 w-10 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center">
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500" />
          </button>

          <div className="flex items-center gap-2.5 pl-2 pr-1">
            <div className="text-right hidden sm:block leading-tight">
              <div className="text-sm font-semibold text-slate-900">{userName}</div>
              <div className="text-[11px] text-slate-500">{roleName}</div>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-xs font-semibold">
              {initials || "U"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
