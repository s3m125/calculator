import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { QrLabel } from "@/components/assets/QrLabel";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AssetQrPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: asset } = await supabase
    .from("v_asset_list")
    .select("id, asset_id, name, category_name, qr_code, serial_number, location_name")
    .eq("id", params.id)
    .maybeSingle();
  if (!asset) notFound();

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof process.env.VERCEL_URL === "string" ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const qrPayload = `${baseUrl}/scan/${asset.qr_code ?? asset.asset_id}`;

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={`/assets/${params.id}`}
        className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-3 no-print"
      >
        <ArrowLeft className="h-4 w-4" /> Back to asset
      </Link>
      <QrLabel
        asset={{
          asset_id: asset.asset_id as string,
          name: asset.name as string,
          category_name: (asset.category_name as string) ?? "",
          location_name: (asset.location_name as string) ?? "",
          serial_number: (asset.serial_number as string) ?? "",
        }}
        payload={qrPayload}
      />
    </div>
  );
}
