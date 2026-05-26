import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { AssignmentForm } from "@/components/assignments/AssignmentForm";
import { getLocations, getProjects, getActiveUsers } from "@/lib/lookups";

export const dynamic = "force-dynamic";

export default async function NewAssignmentPage({
  searchParams,
}: {
  searchParams: { asset?: string };
}) {
  const supabase = createClient();

  // Assets list must be live (status changes frequently) — only that one
  // hits Supabase on every visit. Users/projects/locations are cached.
  const [{ data: assets }, users, projects, locations] = await Promise.all([
    supabase
      .from("v_asset_list")
      .select("id, asset_id, name, status")
      .neq("status", "disposed")
      .order("name"),
    getActiveUsers(),
    getProjects(),
    getLocations(),
  ]);

  return (
    <>
      <PageHeader title="New Assignment" description="Assign an asset to an employee, project, or location." />
      <AssignmentForm
        assets={assets ?? []}
        users={users.map((u) => ({ id: u.id, name: u.full_name }))}
        projects={projects.filter((p) => p.status === "active").map((p) => ({ id: p.id, name: p.name }))}
        locations={locations.map((l) => ({ id: l.id, name: l.name }))}
        preselectAsset={searchParams.asset}
      />
    </>
  );
}
