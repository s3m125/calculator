import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default function ApprovalsPage() {
  return (
    <>
      <PageHeader
        title="Approvals"
        description="Pending approvals for purchase, assignment, transfer, maintenance, and disposal."
      />
      <EmptyState
        title="Approval workflow coming in Phase 2"
        description="Schema is ready (approval_requests + approval_logs). UI to claim/approve will land in Phase 2."
      />
    </>
  );
}
