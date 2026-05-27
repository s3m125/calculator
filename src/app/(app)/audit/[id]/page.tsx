import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ExportButton } from "@/components/ExportButton";
import { AuditScanner } from "@/components/audit/AuditScanner";
import { AuditCompleteButton } from "@/components/audit/AuditCompleteButton";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AuditDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: audit } = await supabase
    .from("asset_audits")
    .select(
      "id, audit_code, title, status, scheduled_date, completed_at, total_expected, total_found, total_not_found, total_different_location, total_damaged, location:location_id(id, name), department:department_id(id, name)",
    )
    .eq("id", params.id)
    .maybeSingle();
  if (!audit) notFound();
  const loc = audit.location as unknown as { id: string; name: string } | null;
  const dept = audit.department as unknown as { id: string; name: string } | null;

  const { data: items } = await supabase
    .from("asset_audit_items")
    .select(
      "id, scanned_at, result, notes, assets:asset_id(asset_id, name), actualLoc:actual_location_id(name), scanned_by:scanned_by(full_name)",
    )
    .eq("audit_id", params.id)
    .order("scanned_at", { ascending: false });

  const itemRows = (items ?? []).map((i) => {
    const asset = i.assets as unknown as { asset_id: string; name: string } | null;
    const actualLoc = i.actualLoc as unknown as { name: string } | null;
    const scanner = i.scanned_by as unknown as { full_name: string } | null;
    return {
      id: i.id,
      scanned_at: i.scanned_at,
      asset_id: asset?.asset_id ?? "-",
      asset_name: asset?.name ?? "-",
      result: i.result,
      actual_location: actualLoc?.name ?? "-",
      scanned_by: scanner?.full_name ?? "-",
      notes: i.notes ?? "",
    };
  });

  const scannedSet = new Set(itemRows.map((r) => r.asset_id).filter((x) => x !== "-"));

  // expected assets in scope
  let expectedQ = supabase
    .from("v_asset_list")
    .select("id, asset_id, name")
    .neq("status", "disposed");
  if (loc?.id) expectedQ = expectedQ.eq("location_id", loc.id);
  if (dept?.id) expectedQ = expectedQ.eq("department_id", dept.id);
  const { data: expectedAssets } = await expectedQ;
  const notYetScanned = (expectedAssets ?? []).filter((a) => !scannedSet.has(a.asset_id));

  return (
    <>
      <Link href="/audit" className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-2">
        <ArrowLeft className="h-4 w-4" /> Back to Audits
      </Link>
      <PageHeader title={audit.title as string} description={`${audit.audit_code} · ${loc?.name ?? ""} ${dept?.name ?? ""}`}>
        <StatusBadge status={audit.status} />
        <ExportButton
          rows={itemRows}
          filename={`audit_${audit.audit_code}`}
          fields={[
            ["scanned_at", "Time"],
            ["asset_id", "Asset ID"],
            ["asset_name", "Asset"],
            ["result", "Result"],
            ["actual_location", "Actual Location"],
            ["scanned_by", "Scanned By"],
            ["notes", "Notes"],
          ]}
        />
        {audit.status !== "completed" && (
          <AuditCompleteButton
            id={audit.id as string}
            unscannedCount={notYetScanned.length}
            scope={{ locationId: loc?.id ?? null, departmentId: dept?.id ?? null }}
          />
        )}
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <Stat label="Expected" value={audit.total_expected ?? 0} tone="bg-slate-100 text-slate-700" />
        <Stat label="Found" value={audit.total_found ?? 0} tone="bg-emerald-100 text-emerald-700" />
        <Stat label="Not Found" value={audit.total_not_found ?? 0} tone="bg-rose-100 text-rose-700" />
        <Stat
          label="Different Location"
          value={audit.total_different_location ?? 0}
          tone="bg-amber-100 text-amber-700"
        />
        <Stat label="Damaged" value={audit.total_damaged ?? 0} tone="bg-orange-100 text-orange-700" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="card p-5">
          <h2 className="font-semibold mb-3">Scan to Audit</h2>
          {audit.status === "completed" ? (
            <p className="text-sm text-slate-500">This audit is closed.</p>
          ) : (
            <AuditScanner auditId={audit.id as string} expectedLocationId={loc?.id ?? null} />
          )}
        </section>

        <section className="card p-5">
          <h2 className="font-semibold mb-3">Not yet scanned ({notYetScanned.length})</h2>
          {notYetScanned.length === 0 ? (
            <p className="text-sm text-slate-500">All expected assets accounted for.</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {notYetScanned.slice(0, 80).map((a) => (
                <li key={a.id} className="py-2 text-sm flex items-center justify-between">
                  <span className="min-w-0 truncate">{a.name}</span>
                  <span className="font-mono text-xs text-slate-500 ml-3 shrink-0">{a.asset_id}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="card overflow-x-auto mt-4">
        <table className="table w-full min-w-[800px]">
          <thead className="bg-slate-50">
            <tr>
              <th>Time</th>
              <th>Asset</th>
              <th>Result</th>
              <th>Actual Location</th>
              <th>Scanned By</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {itemRows.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-slate-500 py-8">No scans yet.</td></tr>
            ) : (
              itemRows.map((r) => (
                <tr key={r.id}>
                  <td className="text-xs">{formatDateTime(r.scanned_at)}</td>
                  <td>{r.asset_name}<div className="text-xs text-slate-500 font-mono">{r.asset_id}</div></td>
                  <td><StatusBadge status={r.result} /></td>
                  <td>{r.actual_location}</td>
                  <td>{r.scanned_by}</td>
                  <td>{r.notes}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="card p-3">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={"text-2xl font-bold mt-1 inline-flex px-2 rounded " + tone}>{value}</p>
    </div>
  );
}
