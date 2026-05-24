"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CornerDownLeft } from "lucide-react";

export function ReturnAssignmentButton({
  assignmentId,
  assetId,
}: {
  assignmentId: string;
  assetId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onReturn() {
    if (!confirm("Mark this asset as returned?")) return;
    setLoading(true);
    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);
    await supabase
      .from("asset_assignments")
      .update({ status: "returned", returned_date: today })
      .eq("id", assignmentId);
    await supabase
      .from("assets")
      .update({ status: "available", assigned_to: null })
      .eq("id", assetId);
    router.refresh();
    setLoading(false);
  }

  return (
    <button onClick={onReturn} disabled={loading} className="btn-primary">
      <CornerDownLeft className="h-4 w-4" /> {loading ? "Updating..." : "Mark as Returned"}
    </button>
  );
}
