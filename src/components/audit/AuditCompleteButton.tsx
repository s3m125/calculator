"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2 } from "lucide-react";

interface Props {
  id: string;
  unscannedCount?: number;
  scope?: { locationId?: string | null; departmentId?: string | null };
}

export function AuditCompleteButton({ id, unscannedCount = 0, scope }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function complete() {
    const warn = unscannedCount > 0
      ? `Close this audit?\n\n${unscannedCount} expected asset${unscannedCount === 1 ? " is" : "s are"} still unscanned — they will be recorded as NOT FOUND. This action cannot be undone.`
      : "Close this audit? You won't be able to add more scans.";
    if (!confirm(warn)) return;

    setLoading(true);
    const supabase = createClient();

    // Auto-record unscanned items as not_found so the variance report is
    // honest. Done before the status flip so the row is still mutable.
    if (unscannedCount > 0 && scope) {
      let q = supabase
        .from("v_asset_list")
        .select("id")
        .neq("status", "disposed");
      if (scope.locationId) q = q.eq("location_id", scope.locationId);
      if (scope.departmentId) q = q.eq("department_id", scope.departmentId);
      const { data: expected } = await q;
      const { data: alreadyScanned } = await supabase
        .from("asset_audit_items")
        .select("asset_id")
        .eq("audit_id", id);
      const scannedIds = new Set((alreadyScanned ?? []).map((r) => r.asset_id));
      const missing = (expected ?? []).filter((a) => !scannedIds.has(a.id));

      if (missing.length > 0) {
        await supabase.from("asset_audit_items").insert(
          missing.map((m) => ({
            audit_id: id,
            asset_id: m.id,
            result: "not_found" as const,
          })),
        );
        await supabase
          .from("asset_audits")
          .update({ total_not_found: missing.length })
          .eq("id", id);
      }
    }

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
