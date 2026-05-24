import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { DisposalForm } from "@/components/disposals/DisposalForm";

export const dynamic = "force-dynamic";

export default async function NewDisposalPage({ searchParams }: { searchParams: { asset?: string } }) {
  const supabase = createClient();
  const { data: assets } = await supabase
    .from("v_asset_list")
    .select("id, asset_id, name")
    .neq("status", "disposed")
    .order("name");

  return (
    <>
      <PageHeader title="New Disposal Request" />
      <DisposalForm assets={assets ?? []} preselectAsset={searchParams.asset} />
    </>
  );
}
