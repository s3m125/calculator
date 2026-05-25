import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExportButton } from "@/components/ExportButton";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TransfersPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("asset_transfers")
    .select(
      "id, transfer_date, reason, status, assets:asset_id(id, asset_id, name), from:from_location_id(name), to:to_location_id(name)",
    )
    .order("transfer_date", { ascending: false })
    .limit(500);

  const rows = (data ?? []).map((t) => {
    const asset = t.assets as unknown as { id: string; asset_id: string; name: string } | null;
    const from = t.from as unknown as { name: string } | null;
    const to = t.to as unknown as { name: string } | null;
    return {
      id: t.id,
      asset_id: asset?.asset_id ?? "-",
      asset_name: asset?.name ?? "-",
      asset_uuid: asset?.id,
      from: from?.name ?? "-",
      to: to?.name ?? "-",
      transfer_date: t.transfer_date,
      reason: t.reason,
      status: t.status,
    };
  });

  return (
    <>
      <PageHeader
        title="Asset Transfers"
        description={`${rows.length} record${rows.length === 1 ? "" : "s"}.`}
      >
        <ExportButton
          rows={rows}
          filename="transfers"
          fields={[
            ["asset_id", "Asset ID"],
            ["asset_name", "Asset"],
            ["from", "From"],
            ["to", "To"],
            ["transfer_date", "Date"],
            ["reason", "Reason"],
            ["status", "Status"],
          ]}
        />
        <Link href="/transfers/new" className="btn-primary">
          <Plus className="h-4 w-4" /> New Transfer
        </Link>
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState
          title="No transfers yet"
          description="Move assets between locations, departments, or projects."
          action={<Link href="/transfers/new" className="btn-primary"><Plus className="h-4 w-4" /> Create</Link>}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table w-full min-w-[900px]">
            <thead className="bg-slate-50">
              <tr>
                <th>Asset</th>
                <th>From</th>
                <th>To</th>
                <th>Date</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.asset_uuid ? (
                      <Link href={`/assets/${r.asset_uuid}`} className="font-medium hover:text-indigo-600">
                        {r.asset_name}
                      </Link>
                    ) : (
                      r.asset_name
                    )}
                    <div className="text-xs text-slate-500 font-mono">{r.asset_id}</div>
                  </td>
                  <td>{r.from}</td>
                  <td>{r.to}</td>
                  <td className="text-xs">{formatDate(r.transfer_date)}</td>
                  <td>{r.reason ?? "-"}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
