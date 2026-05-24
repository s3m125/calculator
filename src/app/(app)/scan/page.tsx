import { PageHeader } from "@/components/ui/PageHeader";
import { GeneralScannerPanel } from "@/components/audit/GeneralScannerPanel";

export const dynamic = "force-dynamic";

export default function ScanQrPage() {
  return (
    <>
      <PageHeader
        title="Scan QR"
        description="Scan an asset QR to open its detail and quickly take an action."
      />
      <div className="card p-5 max-w-md mx-auto">
        <GeneralScannerPanel />
      </div>
    </>
  );
}
