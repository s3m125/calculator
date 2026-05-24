import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExportButton } from "@/components/ExportButton";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AssignmentsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("asset_assignments")
    .select(
      "id, assigned_date, due_date, returned_date, status, notes, assets:asset_id(id, asset_id, name), user:assigned_to(id, full_name), project:project_id(name), location:location_id(name)",
    )
    .order("assigned_date", { ascending: false })
    .limit(500);

  const rows = (data ?? []).map((a) => {
    const asset = a.assets as unknown as { id: string; asset_id: string; name: string } | null;
    const user = a.user as unknown as { full_name: string } | null;
    const project = a.project as unknown as { name: string } | null;
    const loc = a.location as unknown as { name: string } | null;
    return {
      id: a.id,
      asset_id: asset?.asset_id ?? "-",
      asset_name: asset?.name ?? "-",
      asset_uuid: asset?.id ?? null,
      assigned_to: user?.full_name ?? project?.name ?? loc?.name ?? "—",
      assigned_date: a.assigned_date,
      due_date: a.due_date,
      returned_date: a.returned_date,
      status: a.status,
      notes: a.notes,
    };
  });

  return (
    <>
      <PageHeader
        title="Asset Assignments"
        description={`${rows.length} record${rows.length === 1 ? "" : "s"}.`}
      >
        <ExportButton
          rows={rows}
          filename="assignments"
          fields={[
            ["asset_id", "Asset ID"],
            ["asset_name", "Asset"],
            ["assigned_to", "Assigned To"],
            ["assigned_date", "Assigned Date"],
            ["due_date", "Due Date"],
            ["returned_date", "Returned Date"],
            ["status", "Status"],
            ["notes", "Notes"],
          ]}
        />
        <Link href="/assignments/new" className="btn-primary">
          <Plus className="h-4 w-4" /> New Assignment
        </Link>
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState
          title="No assignments yet"
          description="Assign an asset to an employee, project, or location."
          action={
            <Link href="/assignments/new" className="btn-primary">
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
                <th>Assigned To</th>
                <th>Date</th>
                <th>Due</th>
                <th>Returned</th>
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
                  <td>{r.assigned_to}</td>
                  <td className="text-xs">{formatDate(r.assigned_date)}</td>
                  <td className="text-xs">{formatDate(r.due_date)}</td>
                  <td className="text-xs">{formatDate(r.returned_date)}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    <Link
                      href={`/assignments/${r.id}`}
                      className="text-xs text-brand-600 hover:underline"
                    >
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
