import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatIDR } from "@/lib/utils";
import { MaintenanceStatusButtons } from "@/components/maintenance/MaintenanceStatusButtons";

export const dynamic = "force-dynamic";

export default async function MaintenanceDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: m } = await supabase
    .from("asset_maintenance")
    .select(
      "id, maintenance_type, description, status, schedule_date, completed_date, cost, vendor_name, spareparts_used, notes, assets:asset_id(id, asset_id, name)",
    )
    .eq("id", params.id)
    .maybeSingle();
  if (!m) notFound();
  const asset = m.assets as unknown as { id: string; asset_id: string; name: string } | null;

  return (
    <>
      <Link href="/maintenance" className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-2">
        <ArrowLeft className="h-4 w-4" /> Back to Maintenance
      </Link>
      <PageHeader title={asset?.name ?? "Maintenance"} description={asset?.asset_id ?? ""}>
        <StatusBadge status={m.status} />
      </PageHeader>

      <section className="card p-5 max-w-3xl">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Row label="Type" capitalize>{m.maintenance_type}</Row>
          <Row label="Vendor">{m.vendor_name ?? "-"}</Row>
          <Row label="Scheduled">{formatDate(m.schedule_date)}</Row>
          <Row label="Completed">{formatDate(m.completed_date)}</Row>
          <Row label="Cost">{formatIDR(m.cost)}</Row>
          <Row label="Spareparts">{m.spareparts_used ?? "-"}</Row>
          <Row label="Description" wide>{m.description}</Row>
          <Row label="Notes" wide>{m.notes ?? "-"}</Row>
        </dl>

        <div className="mt-6">
          <MaintenanceStatusButtons
            id={m.id as string}
            status={m.status as string}
            assetId={asset?.id ?? null}
          />
        </div>
      </section>
    </>
  );
}

function Row({
  label,
  children,
  wide,
  capitalize,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-medium text-slate-500 uppercase">{label}</dt>
      <dd className={"mt-0.5 " + (capitalize ? "capitalize" : "")}>{children}</dd>
    </div>
  );
}
