import { PageHeader } from "@/components/ui/PageHeader";
import { AssetForm } from "@/components/assets/AssetForm";
import { getProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getCategoriesFull,
  getLocations,
  getDepartments,
  getProjects,
  getSuppliers,
} from "@/lib/lookups";

export const dynamic = "force-dynamic";

export default async function NewAssetPage() {
  const profile = await getProfile();
  if (!["super_admin", "asset_admin", "warehouse", "purchasing"].includes(profile?.role?.code ?? "")) {
    redirect("/assets");
  }

  // Parallel fetch of cached lookups — 5-minute revalidate means second
  // visits hit the cache and return instantly.
  const [cats, locs, deps, projs, sups] = await Promise.all([
    getCategoriesFull(),
    getLocations(),
    getDepartments(),
    getProjects(),
    getSuppliers(),
  ]);

  return (
    <>
      <PageHeader title="Add Asset" description="Register a new asset. Asset ID & QR code will be auto-generated." />
      <AssetForm
        categories={cats.map((c) => ({ id: c.id, name: c.name, prefix: c.prefix, useful_life_years: c.useful_life_years }))}
        locations={locs.map((l) => ({ id: l.id, name: l.name }))}
        departments={deps.map((d) => ({ id: d.id, name: d.name }))}
        projects={projs.filter((p) => p.status === "active").map((p) => ({ id: p.id, name: p.name, status: p.status }))}
        suppliers={sups.map((s) => ({ id: s.id, name: s.name }))}
      />
    </>
  );
}
