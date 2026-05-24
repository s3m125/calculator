import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { AssetForm } from "@/components/assets/AssetForm";
import { getProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EditAssetPage({ params }: { params: { id: string } }) {
  const profile = await getProfile();
  if (!["super_admin", "asset_admin", "warehouse"].includes(profile?.role?.code ?? "")) {
    redirect("/assets");
  }

  const supabase = createClient();
  const { data: asset } = await supabase.from("assets").select("*").eq("id", params.id).maybeSingle();
  if (!asset) notFound();

  const [cats, locs, deps, projs, sups] = await Promise.all([
    supabase.from("asset_categories").select("id, name, prefix, useful_life_years").order("name"),
    supabase.from("asset_locations").select("id, name").order("name"),
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("projects").select("id, name, status").order("name"),
    supabase.from("suppliers").select("id, name").order("name"),
  ]);

  return (
    <>
      <PageHeader title={`Edit ${asset.name}`} description={asset.asset_id} />
      <AssetForm
        existing={asset}
        categories={cats.data ?? []}
        locations={locs.data ?? []}
        departments={deps.data ?? []}
        projects={projs.data ?? []}
        suppliers={sups.data ?? []}
      />
    </>
  );
}
