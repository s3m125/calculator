"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  UserCog,
  ArrowLeftRight,
  Wrench,
  ClipboardCheck,
  FileBarChart,
  Settings,
  QrCode,
  Receipt,
  Trash2,
  Inbox,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  capability?: string;
}

const NAV: NavItem[] = [
  { href: "/dashboard-v2", label: "Dashboard",    icon: LayoutDashboard },
  { href: "/assets",       label: "Assets",       icon: Package, capability: "asset.view" },
  { href: "/assignments",  label: "Assignments",  icon: UserCog, capability: "assignment.manage" },
  { href: "/transfers",    label: "Transfers",    icon: ArrowLeftRight, capability: "transfer.manage" },
  { href: "/maintenance",  label: "Maintenance",  icon: Wrench, capability: "maintenance.manage" },
  { href: "/audit",        label: "Audit",        icon: ClipboardCheck, capability: "audit.manage" },
  { href: "/scan",         label: "Scan QR",      icon: QrCode },
  { href: "/disposals",    label: "Disposal",     icon: Trash2 },
  { href: "/approvals",    label: "Approvals",    icon: Inbox },
  { href: "/depreciation", label: "Depreciation", icon: Receipt, capability: "finance.view" },
  { href: "/reports",      label: "Reports",      icon: FileBarChart, capability: "asset.export" },
  { href: "/settings",     label: "Settings",     icon: Settings },
];

interface SidebarProps {
  capabilities: string[];
  user: { name: string; roleLabel: string };
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ capabilities, user, open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const caps = new Set(capabilities);
  const items = NAV.filter((n) => !n.capability || caps.has(n.capability));

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-slate-900/50 lg:hidden transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed lg:sticky top-0 z-40 h-screen w-60 shrink-0 bg-white border-r border-slate-200/70 transition-transform lg:translate-x-0 flex flex-col",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <div className="h-20 px-5 pt-5 pb-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-sm">
            <span className="font-bold text-lg leading-none tracking-tight">GSi</span>
          </div>
          <div className="leading-tight">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em]">
              Asset
            </div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em] -mt-0.5">
              Control
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition",
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-indigo-600" : "text-slate-400")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile card */}
        <div className="m-3 mt-2">
          <div className="rounded-xl bg-slate-50 border border-slate-200/70 px-3 py-2.5 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-xs font-semibold shrink-0">
              {initials || "U"}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="text-sm font-semibold text-slate-900 truncate">{user.name}</div>
              <div className="text-[11px] text-slate-500 truncate">{user.roleLabel}</div>
            </div>
            <button
              onClick={signOut}
              title="Sign out"
              className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
