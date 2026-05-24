import Link from "next/link";
import {
  Boxes,
  CircleCheckBig,
  UserCheck,
  Wrench,
  ShieldAlert,
  AlertTriangle,
  Plus,
  QrCode,
  ArrowLeftRight,
  ClipboardCheck,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CategoryDonut } from "@/components/charts/CategoryDonut";
import { StatusBarChart } from "@/components/charts/StatusBarChart";
import { getDashboardData } from "@/lib/queries";
import { formatDate, formatDateTime, formatIDR } from "@/lib/utils";

export const dynamic = "force-dynamic";

const QUICK_ACTIONS = [
  { href: "/assets/new",       icon: Plus,            label: "Add Asset" },
  { href: "/scan",             icon: QrCode,          label: "Scan QR" },
  { href: "/assignments/new",  icon: UserCheck,       label: "Assign" },
  { href: "/transfers/new",    icon: ArrowLeftRight,  label: "Transfer" },
  { href: "/maintenance/new",  icon: Wrench,          label: "Maintenance" },
  { href: "/audit/new",        icon: ClipboardCheck,  label: "New Audit" },
];

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Real-time overview of GSI Group's asset portfolio."
      />

      {/* Stat cards row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-6">
        <StatCard
          label="Total Assets"
          value={data.totals.total}
          helper={formatIDR(data.totals.totalValue) + " purchase value"}
          icon={Boxes}
          tone="info"
        />
        <StatCard
          label="Available"
          value={data.totals.available}
          icon={CircleCheckBig}
          tone="success"
        />
        <StatCard
          label="Assigned"
          value={data.totals.assigned}
          helper={`${data.totals.borrowed} borrowed`}
          icon={UserCheck}
          tone="info"
        />
        <StatCard
          label="In Repair"
          value={data.totals.inRepair}
          icon={Wrench}
          tone="warning"
        />
        <StatCard
          label="Lost / Damaged"
          value={data.totals.lostDamaged}
          icon={ShieldAlert}
          tone="danger"
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* LEFT: recent assets table */}
        <section className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Recent Assets</h2>
            <Link href="/assets" className="text-sm text-brand-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto -mx-2">
            <table className="table w-full min-w-[640px]">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th className="text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                {data.recentAssets.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link href={`/assets/${a.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                        {a.name}
                      </Link>
                      <div className="text-xs text-slate-500 font-mono">{a.asset_id}</div>
                    </td>
                    <td>{a.category_name ?? "-"}</td>
                    <td>{a.location_name ?? "-"}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td className="text-right tabular-nums">{formatIDR(a.purchase_price)}</td>
                  </tr>
                ))}
                {data.recentAssets.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-slate-500 py-8">
                      No assets yet. Add your first asset to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* RIGHT: donut */}
        <section className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Assets by Category</h2>
          <CategoryDonut data={data.byCategory} />
        </section>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3 mt-4">
        {/* Upcoming */}
        <section className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Upcoming</h2>
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Warranty Expiring (≤60 days)
          </h3>
          {data.warrantyExpiring.length === 0 ? (
            <p className="text-sm text-slate-500 mb-4">No warranties expiring soon.</p>
          ) : (
            <ul className="space-y-2 mb-4">
              {data.warrantyExpiring.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <Link href={`/assets/${a.id}`} className="font-medium hover:text-brand-600 truncate block">
                      {a.name}
                    </Link>
                    <span className="text-xs text-slate-500 font-mono">{a.asset_id}</span>
                  </div>
                  <span className="text-xs text-amber-700 ml-3 shrink-0">
                    {formatDate(a.warranty_end)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Overdue Returns
          </h3>
          {data.overdueReturns.length === 0 ? (
            <p className="text-sm text-slate-500">No overdue items.</p>
          ) : (
            <ul className="space-y-2">
              {data.overdueReturns.map((o) => (
                <li key={o.id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <span className="font-medium truncate block">{o.asset_name}</span>
                    <span className="text-xs text-slate-500">{o.user_name ?? "Unknown"}</span>
                  </div>
                  <span className="text-xs text-rose-700 ml-3 shrink-0 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {formatDate(o.due_date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Activity */}
        <section className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Recent Activity</h2>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.recentActivity.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <div className="h-2 w-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">{a.title}</p>
                    <p className="text-xs text-slate-500 truncate">{a.detail}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{formatDateTime(a.when)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Status bar chart + quick actions */}
        <section className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Asset Status Overview</h2>
          <StatusBarChart data={data.byStatus} />

          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 mt-5">
            Quick Actions
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_ACTIONS.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs text-slate-700 font-medium text-center"
              >
                <Icon className="h-5 w-5 text-brand-600" />
                {label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
