import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatIDR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DisposalsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("asset_disposals")
    .select(
      "id, reason, disposal_date, disposal_value, buyer_name, status, assets:asset_id(id, asset_id, name)",
    )
    .order("created_at", { ascending: false });
  const rows = data ?? [];

  return (
    <>
      <PageHeader title="Asset Disposals" description="Write-off, sold, scrap requests.">
        <Link href="/disposals/new" className="btn-primary">
          <Plus className="h-4 w-4" /> New Request
        </Link>
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState
          title="No disposal records"
          description="When an asset is broken, lost, or obsolete, request a disposal here."
          action={
            <Link href="/disposals/new" className="btn-primary">
              <Plus className="h-4 w-4" /> Create
            </Link>
          }
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table w-full min-w-[900px]">
            <thead className="bg-slate-50">
              <tr>
                <th>Asset</th>
                <th>Reason</th>
                <th>Date</th>
                <th>Buyer</th>
                <th className="text-right">Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const a = r.assets as unknown as { id: string; asset_id: string; name: string } | null;
                return (
                  <tr key={r.id}>
                    <td>
                      {a?.id ? (
                        <Link href={`/assets/${a.id}`} className="font-medium hover:text-indigo-600">
                          {a.name}
                        </Link>
                      ) : (
                        a?.name ?? "-"
                      )}
                      <div className="text-xs text-slate-500 font-mono">{a?.asset_id ?? "-"}</div>
                    </td>
                    <td className="capitalize">{r.reason}</td>
                    <td className="text-xs">{formatDate(r.disposal_date)}</td>
                    <td>{r.buyer_name ?? "-"}</td>
                    <td className="text-right tabular-nums">{formatIDR(r.disposal_value)}</td>
                    <td><StatusBadge status={r.status} /></td>
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
