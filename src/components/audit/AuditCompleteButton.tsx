"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2 } from "lucide-react";

export function AuditCompleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function complete() {
    if (!confirm("Close this audit? You won't be able to add more scans.")) return;
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("asset_audits")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", id);
    router.refresh();
    setLoading(false);
  }
  return (
    <button onClick={complete} disabled={loading} className="btn-primary">
      <CheckCircle2 className="h-4 w-4" />
      {loading ? "Closing..." : "Close Audit"}
    </button>
  );
}
