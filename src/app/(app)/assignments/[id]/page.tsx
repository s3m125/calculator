import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils";
import { ReturnAssignmentButton } from "@/components/assignments/ReturnAssignmentButton";

export const dynamic = "force-dynamic";

export default async function AssignmentDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: a } = await supabase
    .from("asset_assignments")
    .select(
      "id, assigned_date, due_date, returned_date, status, notes, assets:asset_id(id, asset_id, name), user:assigned_to(full_name, email), project:project_id(name), location:location_id(name)",
    )
    .eq("id", params.id)
    .maybeSingle();
  if (!a) notFound();
  const asset = a.assets as unknown as { id: string; asset_id: string; name: string } | null;
  const user = a.user as unknown as { full_name: string; email: string } | null;
  const project = a.project as unknown as { name: string } | null;
  const loc = a.location as unknown as { name: string } | null;

  return (
    <>
      <Link href="/assignments" className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-2">
        <ArrowLeft className="h-4 w-4" /> Back to Assignments
      </Link>
      <PageHeader title={asset?.name ?? "Assignment"} description={asset?.asset_id ?? ""}>
        <StatusBadge status={a.status} />
      </PageHeader>

      <section className="card p-5 max-w-2xl">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Row label="Assigned To">{user?.full_name ?? project?.name ?? loc?.name ?? "—"}</Row>
          <Row label="Assigned Date">{formatDate(a.assigned_date)}</Row>
          <Row label="Due Date">{formatDate(a.due_date)}</Row>
          <Row label="Returned Date">{formatDate(a.returned_date)}</Row>
          <Row label="Notes" wide>{a.notes ?? "—"}</Row>
        </dl>

        {a.status === "active" && asset?.id && (
          <div className="mt-6 flex justify-end">
            <ReturnAssignmentButton assignmentId={a.id as string} assetId={asset.id} />
          </div>
        )}
      </section>
    </>
  );
}

function Row({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-medium text-slate-500 uppercase">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
