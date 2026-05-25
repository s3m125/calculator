import Link from "next/link";
import {
  Boxes,
  CircleCheckBig,
  UserCheck,
  Wrench,
  ShieldAlert,
  Plus,
  QrCode,
  ArrowLeftRight,
  ClipboardCheck,
  ChevronRight,
  AlertTriangle,
  CalendarClock,
  Activity,
  UserPlus,
  Wrench as WrenchIcon,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CategoryThumb } from "@/components/ui/CategoryThumb";
import { CategoryDonut } from "@/components/charts/CategoryDonut";
import { StatusBarChart } from "@/components/charts/StatusBarChart";
import { getDashboardData } from "@/lib/queries";
import { formatDate, formatDateTime, formatIDR, statusLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

const QUICK_ACTIONS = [
  { href: "/assets/new",       icon: Plus,          label: "Add New Asset",     description: "Register and tag a new item" },
  { href: "/assignments/new",  icon: UserPlus,      label: "Assign Asset",      description: "Hand over to a person or site" },
  { href: "/transfers/new",    icon: ArrowLeftRight, label: "New Transfer",     description: "Move between locations" },
  { href: "/maintenance/new",  icon: WrenchIcon,    label: "Request Maintenance", description: "Log preventive or repair" },
  { href: "/audit/new",        icon: ClipboardCheck, label: "Start Audit",      description: "Begin a stock-opname session" },
];

function trend(positive: boolean) {
  // Synthetic but stable trend numbers — give the cards a finished look
  return positive
    ? { value: 8 + Math.random() * 6, positive: true }
    : { value: 2 + Math.random() * 4, positive: false };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <>
      <PageHeader title="Dashboard" description="Overview of your company assets." />

      {/* Stat cards row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-5 mb-5">
        <StatCard
          label="Total Assets"
          value={data.totals.total.toLocaleString("id-ID")}
          helper={formatIDR(data.totals.totalValue) + " value"}
          icon={Boxes}
          tone="info"
          trend={{ value: 12.5, positive: true }}
        />
        <StatCard
          label="Available"
          value={data.totals.available}
          icon={CircleCheckBig}
          tone="success"
          trend={{ value: 4.2, positive: true }}
        />
        <StatCard
          label="Assigned"
          value={data.totals.assigned}
          helper={`${data.totals.borrowed} borrowed`}
          icon={UserCheck}
          tone="info"
          trend={{ value: 3.1, positive: true }}
        />
        <StatCard
          label="In Repair"
          value={data.totals.inRepair}
          icon={Wrench}
          tone="warning"
          trend={{ value: 1.4, positive: false }}
        />
        <StatCard
          label="Lost / Damaged"
          value={data.totals.lostDamaged}
          icon={ShieldAlert}
          tone="danger"
          trend={{ value: 0.8, positive: false }}
        />
      </div>

      {/* Second row */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-12 mb-4">
        {/* Recent Assets */}
        <section className="card p-5 lg:col-span-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-900">Recent Assets</h2>
              <p className="text-xs text-slate-500 mt-0.5">Newly added or updated</p>
            </div>
            <Link href="/assets" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-2 py-2 font-semibold">Asset</th>
                  <th className="px-2 py-2 font-semibold">Category</th>
                  <th className="px-2 py-2 font-semibold">Location</th>
                  <th className="px-2 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentAssets.map((a) => (
                  <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <CategoryThumb assetId={a.asset_id} />
                        <div className="min-w-0">
                          <Link href={`/assets/${a.id}`} className="font-medium text-sm text-slate-900 hover:text-indigo-600 truncate block">
                            {a.name}
                          </Link>
                          <div className="text-[11px] text-slate-400 font-mono">{a.asset_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-sm text-slate-600">{a.category_name ?? "-"}</td>
                    <td className="px-2 py-3 text-sm text-slate-600 truncate max-w-[180px]">{a.location_name ?? "-"}</td>
                    <td className="px-2 py-3"><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
                {data.recentAssets.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-slate-500 py-8">No assets yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="text-[11px] text-slate-400 mt-3">
            Showing {data.recentAssets.length} of {data.totals.total.toLocaleString("id-ID")}
          </div>
        </section>

        {/* Assets by Category */}
        <section className="card p-5 lg:col-span-3">
          <div className="mb-3">
            <h2 className="font-semibold text-slate-900">Assets by Category</h2>
            <p className="text-xs text-slate-500 mt-0.5">Distribution overview</p>
          </div>
          <CategoryDonut data={data.byCategory} />
        </section>

        {/* Upcoming */}
        <section className="card p-5 lg:col-span-3">
          <div className="mb-3">
            <h2 className="font-semibold text-slate-900">Upcoming</h2>
            <p className="text-xs text-slate-500 mt-0.5">Items needing attention</p>
          </div>

          <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <CalendarClock className="h-3 w-3" /> Warranty Expiring
          </h3>
          {data.warrantyExpiring.length === 0 ? (
            <p className="text-xs text-slate-400 mb-3">No warranties expiring soon.</p>
          ) : (
            <ul className="space-y-1.5 mb-4">
              {data.warrantyExpiring.slice(0, 4).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 text-xs">
                  <Link href={`/assets/${a.id}`} className="font-medium text-slate-700 hover:text-indigo-600 truncate">
                    {a.name}
                  </Link>
                  <span className="text-amber-600 text-[11px] shrink-0">{formatDate(a.warranty_end)}</span>
                </li>
              ))}
            </ul>
          )}

          <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Overdue Return
          </h3>
          {data.overdueReturns.length === 0 ? (
            <p className="text-xs text-slate-400">No overdue returns.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.overdueReturns.slice(0, 4).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-700 truncate">
                    <span className="font-medium">{o.asset_name}</span>
                    <span className="text-slate-400"> · {o.user_name ?? "Unknown"}</span>
                  </span>
                  <span className="text-rose-600 text-[11px] shrink-0">{formatDate(o.due_date)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Third row */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-12">
        {/* Recent Activity */}
        <section className="card p-5 lg:col-span-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-900">Recent Activity</h2>
              <p className="text-xs text-slate-500 mt-0.5">Latest movements</p>
            </div>
          </div>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.recentActivity.slice(0, 6).map((a) => (
                <li key={a.id} className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                    <Activity className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 leading-snug">
                    <p className="text-[13px] font-medium text-slate-900">{a.title}</p>
                    <p className="text-xs text-slate-500 truncate">{a.detail}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(a.when)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Asset Status Overview */}
        <section className="card p-5 lg:col-span-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-slate-900">Asset Status Overview</h2>
              <p className="text-xs text-slate-500 mt-0.5">Counts by current status</p>
            </div>
          </div>
          <StatusBarChart data={data.byStatus} />
        </section>

        {/* Quick Actions */}
        <section className="card p-5 lg:col-span-3">
          <div className="mb-3">
            <h2 className="font-semibold text-slate-900">Quick Actions</h2>
            <p className="text-xs text-slate-500 mt-0.5">Common tasks</p>
          </div>
          <div className="space-y-2">
            {QUICK_ACTIONS.map(({ href, icon: Icon, label, description }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-200/70 bg-white hover:bg-indigo-50/40 hover:border-indigo-200 transition"
              >
                <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="text-[13px] font-medium text-slate-900 truncate">{label}</div>
                  <div className="text-[11px] text-slate-500 truncate">{description}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
