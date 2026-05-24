import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { NewAuditForm } from "@/components/audit/NewAuditForm";

export const dynamic = "force-dynamic";

export default async function NewAuditPage() {
  const supabase = createClient();
  const [locs, deps] = await Promise.all([
    supabase.from("asset_locations").select("id, name").order("name"),
    supabase.from("departments").select("id, name").order("name"),
  ]);
  return (
    <>
      <PageHeader title="New Audit" description="Create a stock opname session." />
      <NewAuditForm locations={locs.data ?? []} departments={deps.data ?? []} />
    </>
  );
}
