import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { TransferForm } from "@/components/transfers/TransferForm";

export const dynamic = "force-dynamic";

export default async function NewTransferPage({
  searchParams,
}: {
  searchParams: { asset?: string };
}) {
  const supabase = createClient();
  const [assets, locations, departments, projects, users] = await Promise.all([
    supabase.from("v_asset_list").select("id, asset_id, name, location_id, department_id, project_id, assigned_to").neq("status", "disposed").order("name"),
    supabase.from("asset_locations").select("id, name").order("name"),
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("projects").select("id, name").eq("status", "active").order("name"),
    supabase.from("users").select("id, full_name").eq("status", "active").order("full_name"),
  ]);

  return (
    <>
      <PageHeader title="New Transfer" description="Move an asset to a different location, department, project, or user." />
      <TransferForm
        assets={assets.data ?? []}
        locations={locations.data ?? []}
        departments={departments.data ?? []}
        projects={projects.data ?? []}
        users={(users.data ?? []).map((u) => ({ id: u.id, name: u.full_name }))}
        preselectAsset={searchParams.asset}
      />
    </>
  );
}
