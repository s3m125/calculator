"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ORDER = ["requested", "approved", "in_progress", "completed"];

export function MaintenanceStatusButtons({
  id,
  status,
  assetId,
}: {
  id: string;
  status: string;
  assetId: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function setStatus(next: string) {
    setLoading(next);
    const supabase = createClient();
    const update: Record<string, unknown> = { status: next };
    if (next === "completed") update.completed_date = new Date().toISOString().slice(0, 10);
    await supabase.from("asset_maintenance").update(update).eq("id", id);

    if (assetId) {
      if (next === "in_progress") {
        await supabase.from("assets").update({ status: "in_repair" }).eq("id", assetId);
      } else if (next === "completed") {
        await supabase.from("assets").update({ status: "available" }).eq("id", assetId);
      }
    }
    router.refresh();
    setLoading(null);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ORDER.map((s) => {
        const idx = ORDER.indexOf(status);
        const sIdx = ORDER.indexOf(s);
        const isCurrent = s === status;
        // Only allow advancing to the NEXT step (or staying), never skip
        // ahead and never go back. Past states are visibly muted.
        const inPast = sIdx < idx;
        const tooFarAhead = sIdx > idx + 1;
        const disabled = isCurrent || loading !== null || inPast || tooFarAhead;
        return (
          <button
            key={s}
            onClick={() => setStatus(s)}
            disabled={disabled}
            className={
              "px-3 py-1.5 rounded-lg text-sm font-medium transition " +
              (isCurrent
                ? "bg-indigo-600 text-white"
                : inPast
                  ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                  : tooFarAhead
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200")
            }
          >
            {loading === s ? "..." : s.replace("_", " ")}
          </button>
        );
      })}
      <button
        onClick={() => setStatus("rejected")}
        disabled={status === "rejected" || status === "completed" || loading !== null}
        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-rose-50 text-rose-700 hover:bg-rose-100"
      >
        Reject
      </button>
    </div>
  );
}
