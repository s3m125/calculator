import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { MaintenanceForm } from "@/components/maintenance/MaintenanceForm";

export const dynamic = "force-dynamic";

export default async function NewMaintenancePage({
  searchParams,
}: {
  searchParams: { asset?: string };
}) {
  const supabase = createClient();
  const { data: assets } = await supabase
    .from("v_asset_list")
    .select("id, asset_id, name")
    .neq("status", "disposed")
    .order("name");

  return (
    <>
      <PageHeader
        title="New Maintenance Request"
        description="Preventive or corrective maintenance for an asset."
      />
      <MaintenanceForm assets={assets ?? []} preselectAsset={searchParams.asset} />
    </>
  );
}
