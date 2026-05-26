import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatIDR } from "@/lib/utils";
import { Boxes, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

// Public-ish QR landing page — reachable without login (middleware excludes /scan).
// Anonymous visitors see basic info; signed-in users see a link into the app.
export default async function PublicScanPage({ params }: { params: { code: string } }) {
  const supabase = createClient();
  const { data: asset } = await supabase
    .from("v_asset_list")
    // Trim: only the fields we actually render below.
    .select(
      "id, asset_id, name, status, category_name, location_name, assigned_to_name, " +
      "brand, model, serial_number, warranty_end, purchase_price",
    )
    .or(`qr_code.eq.${params.code},asset_id.eq.${params.code}`)
    .maybeSingle();

  if (!asset) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white p-4 flex items-center justify-center">
      <div className="w-full max-w-md card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-10 w-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">GSI Asset Control</p>
            <p className="font-bold">Asset Lookup</p>
          </div>
        </div>

        <h1 className="text-xl font-bold">{asset.name}</h1>
        <p className="text-sm text-slate-500 font-mono">{asset.asset_id}</p>

        <div className="mt-4 space-y-2 text-sm">
          <Row label="Status"><StatusBadge status={asset.status} /></Row>
          <Row label="Category">{asset.category_name ?? "-"}</Row>
          <Row label="Location">{asset.location_name ?? "-"}</Row>
          <Row label="Assigned To">{asset.assigned_to_name ?? "—"}</Row>
          <Row label="Brand / Model">{asset.brand} {asset.model}</Row>
          <Row label="Serial">{asset.serial_number ?? "-"}</Row>
          <Row label="Warranty">{formatDate(asset.warranty_end)}</Row>
          <Row label="Purchase Value">{formatIDR(asset.purchase_price)}</Row>
        </div>

        <Link
          href={`/assets/${asset.id}`}
          className="btn-primary w-full mt-6"
        >
          Open in App <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>
      <span className="text-slate-900 text-right">{children}</span>
    </div>
  );
}
