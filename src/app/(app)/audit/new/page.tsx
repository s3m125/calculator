import { PageHeader } from "@/components/ui/PageHeader";
import { NewAuditForm } from "@/components/audit/NewAuditForm";
import { getLocations, getDepartments } from "@/lib/lookups";

export const dynamic = "force-dynamic";

export default async function NewAuditPage() {
  const [locs, deps] = await Promise.all([getLocations(), getDepartments()]);
  return (
    <>
      <PageHeader title="New Audit" description="Create a stock opname session." />
      <NewAuditForm
        locations={locs.map((l) => ({ id: l.id, name: l.name }))}
        departments={deps.map((d) => ({ id: d.id, name: d.name }))}
      />
    </>
  );
}
