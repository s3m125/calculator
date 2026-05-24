"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  capability?: string;
}

const NAV: NavItem[] = [
  { href: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
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
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ capabilities, open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const caps = new Set(capabilities);

  const items = NAV.filter((n) => !n.capability || caps.has(n.capability));

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
          "fixed lg:sticky top-0 z-40 h-screen w-64 shrink-0 bg-white border-r border-slate-200 transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-16 px-5 flex items-center gap-2.5 border-b border-slate-200">
          <div className="h-9 w-9 rounded-lg bg-brand-600 text-white flex items-center justify-center">
            <Boxes className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-slate-900">GSI Asset</div>
            <div className="text-[11px] text-slate-500 -mt-0.5">Control System</div>
          </div>
        </div>
        <nav className="p-3 space-y-0.5 overflow-y-auto h-[calc(100vh-4rem)]">
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
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
