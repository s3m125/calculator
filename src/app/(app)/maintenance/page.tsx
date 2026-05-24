import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExportButton } from "@/components/ExportButton";
import { formatDate, formatIDR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("asset_maintenance")
    .select(
      "id, maintenance_type, description, status, schedule_date, completed_date, cost, vendor_name, assets:asset_id(id, asset_id, name)",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = (data ?? []).map((m) => {
    const a = m.assets as unknown as { id: string; asset_id: string; name: string } | null;
    return {
      id: m.id,
      asset_id: a?.asset_id ?? "-",
      asset_name: a?.name ?? "-",
      asset_uuid: a?.id,
      maintenance_type: m.maintenance_type,
      description: m.description,
      schedule_date: m.schedule_date,
      completed_date: m.completed_date,
      cost: m.cost,
      vendor_name: m.vendor_name,
      status: m.status,
    };
  });

  return (
    <>
      <PageHeader
        title="Asset Maintenance"
        description={`${rows.length} record${rows.length === 1 ? "" : "s"}.`}
      >
        <ExportButton
          rows={rows}
          filename="maintenance"
          fields={[
            ["asset_id", "Asset ID"],
            ["asset_name", "Asset"],
            ["maintenance_type", "Type"],
            ["description", "Description"],
            ["schedule_date", "Scheduled"],
            ["completed_date", "Completed"],
            ["cost", "Cost"],
            ["vendor_name", "Vendor"],
            ["status", "Status"],
          ]}
        />
        <Link href="/maintenance/new" className="btn-primary">
          <Plus className="h-4 w-4" /> New Request
        </Link>
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState
          title="No maintenance records yet"
          description="Request preventive or corrective maintenance for any asset."
          action={
            <Link href="/maintenance/new" className="btn-primary">
              <Plus className="h-4 w-4" /> Create
            </Link>
          }
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table w-full min-w-[1000px]">
            <thead className="bg-slate-50">
              <tr>
                <th>Asset</th>
                <th>Type</th>
                <th>Description</th>
                <th>Scheduled</th>
                <th>Vendor</th>
                <th className="text-right">Cost</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.asset_uuid ? (
                      <Link href={`/assets/${r.asset_uuid}`} className="font-medium hover:text-brand-600">
                        {r.asset_name}
                      </Link>
                    ) : (
                      r.asset_name
                    )}
                    <div className="text-xs text-slate-500 font-mono">{r.asset_id}</div>
                  </td>
                  <td className="capitalize">{r.maintenance_type}</td>
                  <td className="max-w-[260px] truncate">{r.description}</td>
                  <td className="text-xs">{formatDate(r.schedule_date)}</td>
                  <td>{r.vendor_name ?? "-"}</td>
                  <td className="text-right tabular-nums">{formatIDR(r.cost)}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    <Link href={`/maintenance/${r.id}`} className="text-xs text-brand-600 hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
