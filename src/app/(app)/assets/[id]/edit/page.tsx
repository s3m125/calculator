import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { AssetForm } from "@/components/assets/AssetForm";
import { getProfile } from "@/lib/auth";
import {
  getCategoriesFull,
  getLocations,
  getDepartments,
  getProjects,
  getSuppliers,
} from "@/lib/lookups";

export const dynamic = "force-dynamic";

export default async function EditAssetPage({ params }: { params: { id: string } }) {
  const profile = await getProfile();
  if (!["super_admin", "asset_admin", "warehouse"].includes(profile?.role?.code ?? "")) {
    redirect("/assets");
  }

  const supabase = createClient();

  // Fire asset detail + cached lookups in parallel. Lookups hit the cache
  // on warm visits; only the asset query goes to Supabase.
  const [{ data: asset }, cats, locs, deps, projs, sups] = await Promise.all([
    supabase.from("assets").select("*").eq("id", params.id).maybeSingle(),
    getCategoriesFull(),
    getLocations(),
    getDepartments(),
    getProjects(),
    getSuppliers(),
  ]);
  if (!asset) notFound();

  return (
    <>
      <PageHeader title={`Edit ${asset.name}`} description={asset.asset_id} />
      <AssetForm
        existing={asset}
        categories={cats.map((c) => ({ id: c.id, name: c.name, prefix: c.prefix, useful_life_years: c.useful_life_years }))}
        locations={locs.map((l) => ({ id: l.id, name: l.name }))}
        departments={deps.map((d) => ({ id: d.id, name: d.name }))}
        projects={projs.map((p) => ({ id: p.id, name: p.name, status: p.status }))}
        suppliers={sups.map((s) => ({ id: s.id, name: s.name }))}
      />
    </>
  );
}
