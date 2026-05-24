import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { AssignmentForm } from "@/components/assignments/AssignmentForm";

export const dynamic = "force-dynamic";

export default async function NewAssignmentPage({
  searchParams,
}: {
  searchParams: { asset?: string };
}) {
  const supabase = createClient();
  const [{ data: assets }, { data: users }, { data: projects }, { data: locations }] =
    await Promise.all([
      supabase
        .from("v_asset_list")
        .select("id, asset_id, name, status")
        .neq("status", "disposed")
        .order("name"),
      supabase.from("users").select("id, full_name").eq("status", "active").order("full_name"),
      supabase.from("projects").select("id, name").eq("status", "active").order("name"),
      supabase.from("asset_locations").select("id, name").order("name"),
    ]);

  return (
    <>
      <PageHeader title="New Assignment" description="Assign an asset to an employee, project, or location." />
      <AssignmentForm
        assets={assets ?? []}
        users={(users ?? []).map((u) => ({ id: u.id, name: u.full_name }))}
        projects={projects ?? []}
        locations={locations ?? []}
        preselectAsset={searchParams.asset}
      />
    </>
  );
}
