import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit3, QrCode, UserCheck, ArrowLeftRight, Wrench, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatDateTime, formatIDR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AssetDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const profile = await getProfile();
  const canEdit = ["super_admin", "asset_admin", "warehouse"].includes(profile?.role?.code ?? "");

  const { data: asset } = await supabase
    .from("v_asset_list")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!asset) notFound();

  const [{ data: assignments }, { data: transfers }, { data: maintenance }] = await Promise.all([
    supabase
      .from("asset_assignments")
      .select("id, assigned_date, due_date, returned_date, status, notes, user:assigned_to(full_name), project:project_id(name)")
      .eq("asset_id", params.id)
      .order("assigned_date", { ascending: false }),
    supabase
      .from("asset_transfers")
      .select("id, transfer_date, status, reason, from:from_location_id(name), to:to_location_id(name)")
      .eq("asset_id", params.id)
      .order("transfer_date", { ascending: false }),
    supabase
      .from("asset_maintenance")
      .select("id, maintenance_type, description, status, schedule_date, completed_date, cost, vendor_name")
      .eq("asset_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <Link href="/assets" className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-2">
        <ArrowLeft className="h-4 w-4" /> Back to Assets
      </Link>
      <PageHeader
        title={asset.name as string}
        description={`${asset.asset_id}${asset.serial_number ? " · S/N " + asset.serial_number : ""}`}
      >
        <Link href={`/assets/${asset.id}/qr`} className="btn-secondary">
          <QrCode className="h-4 w-4" /> QR Label
        </Link>
        {canEdit && (
          <Link href={`/assets/${asset.id}/edit`} className="btn-primary">
            <Edit3 className="h-4 w-4" /> Edit
          </Link>
        )}
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="font-semibold mb-4">Information</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Field label="Status"><StatusBadge status={asset.status} /></Field>
            <Field label="Condition">{asset.condition ?? "-"}</Field>
            <Field label="Category">{asset.category_name ?? "-"}</Field>
            <Field label="Brand / Model">{(asset.brand ?? "-") + " · " + (asset.model ?? "-")}</Field>
            <Field label="Specification">{asset.specification ?? "-"}</Field>
            <Field label="Notes">{asset.notes ?? "-"}</Field>
            <Field label="Location">{asset.location_name ?? "-"}</Field>
            <Field label="Department">{asset.department_name ?? "-"}</Field>
            <Field label="Project">{asset.project_name ?? "-"}</Field>
            <Field label="Assigned To">{asset.assigned_to_name ?? "—"}</Field>
            <Field label="Supplier">{asset.supplier_name ?? "-"}</Field>
            <Field label="Purchase Date">{formatDate(asset.purchase_date)}</Field>
            <Field label="Purchase Price">{formatIDR(asset.purchase_price)}</Field>
            <Field label="Book Value">{formatIDR(asset.book_value)}</Field>
            <Field label="Warranty">{formatDate(asset.warranty_start)} → {formatDate(asset.warranty_end)}</Field>
            <Field label="Created">{formatDateTime(asset.created_at)}</Field>
          </dl>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={`/assignments/new?asset=${asset.id}`} className="btn-secondary">
              <UserCheck className="h-4 w-4" /> Assign
            </Link>
            <Link href={`/transfers/new?asset=${asset.id}`} className="btn-secondary">
              <ArrowLeftRight className="h-4 w-4" /> Transfer
            </Link>
            <Link href={`/maintenance/new?asset=${asset.id}`} className="btn-secondary">
              <Wrench className="h-4 w-4" /> Maintenance
            </Link>
            <Link href={`/disposals/new?asset=${asset.id}`} className="btn-secondary">
              <Trash2 className="h-4 w-4" /> Dispose
            </Link>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold mb-3">QR Code</h2>
          <p className="text-xs text-slate-500 mb-3 font-mono">{asset.qr_code}</p>
          <Link href={`/assets/${asset.id}/qr`} className="btn-secondary w-full">
            <QrCode className="h-4 w-4" /> Print Label
          </Link>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mt-4">
        <HistoryCard title="Assignment History" emptyText="No assignments yet.">
          {(assignments ?? []).map((a) => {
            const user = a.user as unknown as { full_name: string } | null;
            const project = a.project as unknown as { name: string } | null;
            return (
              <li key={a.id} className="border-l-2 border-brand-200 pl-3 py-1.5">
                <p className="text-sm font-medium">{user?.full_name ?? project?.name ?? "Unassigned"}</p>
                <p className="text-xs text-slate-500">
                  {formatDate(a.assigned_date)}
                  {a.due_date ? ` → due ${formatDate(a.due_date)}` : ""}
                  {a.returned_date ? ` · returned ${formatDate(a.returned_date)}` : ""}
                </p>
                <div className="mt-1"><StatusBadge status={a.status} /></div>
              </li>
            );
          })}
        </HistoryCard>

        <HistoryCard title="Transfer History" emptyText="No transfers yet.">
          {(transfers ?? []).map((t) => {
            const from = t.from as unknown as { name: string } | null;
            const to = t.to as unknown as { name: string } | null;
            return (
              <li key={t.id} className="border-l-2 border-amber-200 pl-3 py-1.5">
                <p className="text-sm">
                  <span className="text-slate-500">{from?.name ?? "-"}</span>
                  {" → "}
                  <span className="font-medium">{to?.name ?? "-"}</span>
                </p>
                <p className="text-xs text-slate-500">{formatDate(t.transfer_date)} · {t.reason ?? ""}</p>
                <div className="mt-1"><StatusBadge status={t.status} /></div>
              </li>
            );
          })}
        </HistoryCard>

        <HistoryCard title="Maintenance History" emptyText="No maintenance records.">
          {(maintenance ?? []).map((m) => (
            <li key={m.id} className="border-l-2 border-rose-200 pl-3 py-1.5">
              <p className="text-sm font-medium">{m.description}</p>
              <p className="text-xs text-slate-500">
                {m.maintenance_type} · {m.vendor_name ?? "internal"} · {formatIDR(m.cost)}
              </p>
              <div className="mt-1"><StatusBadge status={m.status} /></div>
            </li>
          ))}
        </HistoryCard>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500 uppercase">{label}</dt>
      <dd className="mt-0.5 text-slate-900 break-words">{children}</dd>
    </div>
  );
}

function HistoryCard({
  title,
  emptyText,
  children,
}: {
  title: string;
  emptyText: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  const hasContent = items.some((c) => c);
  return (
    <section className="card p-5">
      <h3 className="font-semibold mb-3">{title}</h3>
      {hasContent ? <ul className="space-y-2">{children}</ul> : <p className="text-sm text-slate-500">{emptyText}</p>}
    </section>
  );
}
