import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { TransferForm } from "@/components/transfers/TransferForm";
import { getLocations, getDepartments, getProjects, getActiveUsers } from "@/lib/lookups";

export const dynamic = "force-dynamic";

export default async function NewTransferPage({
  searchParams,
}: {
  searchParams: { asset?: string };
}) {
  const supabase = createClient();
  const [{ data: assets }, locations, departments, projects, users] = await Promise.all([
    supabase
      .from("v_asset_list")
      .select("id, asset_id, name, location_id, department_id, project_id, assigned_to")
      .neq("status", "disposed")
      .order("name"),
    getLocations(),
    getDepartments(),
    getProjects(),
    getActiveUsers(),
  ]);

  return (
    <>
      <PageHeader title="New Transfer" description="Move an asset to a different location, department, project, or user." />
      <TransferForm
        assets={assets ?? []}
        locations={locations.map((l) => ({ id: l.id, name: l.name }))}
        departments={departments.map((d) => ({ id: d.id, name: d.name }))}
        projects={projects.filter((p) => p.status === "active").map((p) => ({ id: p.id, name: p.name }))}
        users={users.map((u) => ({ id: u.id, name: u.full_name }))}
        preselectAsset={searchParams.asset}
      />
    </>
  );
}
