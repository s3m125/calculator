import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("asset_audits")
    .select(
      "id, audit_code, title, scheduled_date, started_at, completed_at, status, total_expected, total_found, total_not_found, total_different_location, total_damaged, location:location_id(name)",
    )
    .order("created_at", { ascending: false });

  const rows = (data ?? []).map((r) => {
    const loc = r.location as unknown as { name: string } | null;
    return { ...r, location_name: loc?.name ?? "-" };
  });

  return (
    <>
      <PageHeader title="Asset Audits" description="Stock opname / variance reports">
        <Link href="/audit/new" className="btn-primary">
          <Plus className="h-4 w-4" /> New Audit
        </Link>
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState
          title="No audits yet"
          description="Schedule a stock opname for a location or department."
          action={
            <Link href="/audit/new" className="btn-primary">
              <Plus className="h-4 w-4" /> New Audit
            </Link>
          }
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table w-full min-w-[900px]">
            <thead className="bg-slate-50">
              <tr>
                <th>Code</th>
                <th>Title</th>
                <th>Location</th>
                <th>Scheduled</th>
                <th className="text-right">Expected</th>
                <th className="text-right">Found</th>
                <th className="text-right">Issues</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const issues =
                  (r.total_not_found ?? 0) +
                  (r.total_different_location ?? 0) +
                  (r.total_damaged ?? 0);
                return (
                  <tr key={r.id}>
                    <td className="font-mono text-xs">{r.audit_code}</td>
                    <td className="font-medium">{r.title}</td>
                    <td>{r.location_name}</td>
                    <td className="text-xs">{formatDate(r.scheduled_date)}</td>
                    <td className="text-right tabular-nums">{r.total_expected ?? 0}</td>
                    <td className="text-right tabular-nums text-emerald-700">{r.total_found ?? 0}</td>
                    <td className="text-right tabular-nums text-rose-700">{issues}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      <Link href={`/audit/${r.id}`} className="text-xs text-brand-600 hover:underline">
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
