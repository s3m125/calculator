"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { QrScannerBox } from "./QrScannerBox";
import { Check } from "lucide-react";

interface Props {
  auditId: string;
  expectedLocationId: string | null;
}

const RESULTS = [
  { value: "found", label: "Found", tone: "bg-emerald-100 text-emerald-800" },
  { value: "different_location", label: "Different Location", tone: "bg-amber-100 text-amber-800" },
  { value: "damaged", label: "Damaged", tone: "bg-orange-100 text-orange-800" },
  { value: "not_found", label: "Not Found", tone: "bg-rose-100 text-rose-800" },
];

export function AuditScanner({ auditId, expectedLocationId }: Props) {
  const router = useRouter();
  const [result, setResult] = useState<string>("found");
  const [notes, setNotes] = useState("");
  const [lastScan, setLastScan] = useState<{ asset_id: string; name: string; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function extractCode(raw: string) {
    try {
      const u = new URL(raw);
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("scan");
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    } catch {
      /* not a URL — treat as raw code */
    }
    return raw.trim();
  }

  async function onScan(raw: string) {
    setError(null);
    const code = extractCode(raw);
    setBusy(true);

    try {
      const supabase = createClient();
      const { data: asset } = await supabase
        .from("v_asset_list")
        .select("id, asset_id, name, status, location_id")
        .or(`qr_code.eq.${code},asset_id.eq.${code}`)
        .maybeSingle();
      if (!asset) {
        setError(`Asset not found: ${code}`);
        setBusy(false);
        return;
      }

      // auto-detect different location
      let finalResult = result;
      if (
        finalResult === "found" &&
        expectedLocationId &&
        asset.location_id &&
        asset.location_id !== expectedLocationId
      ) {
        finalResult = "different_location";
      }

      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from("asset_audit_items").insert({
        audit_id: auditId,
        asset_id: asset.id,
        result: finalResult,
        actual_location_id: asset.location_id,
        notes: notes || null,
        scanned_by: user?.id ?? null,
      });

      // Update audit totals
      const field =
        finalResult === "found"
          ? "total_found"
          : finalResult === "not_found"
            ? "total_not_found"
            : finalResult === "different_location"
              ? "total_different_location"
              : "total_damaged";

      const { data: audit } = await supabase
        .from("asset_audits")
        .select("total_found, total_not_found, total_different_location, total_damaged, status")
        .eq("id", auditId)
        .single();
      if (audit) {
        const update: Record<string, unknown> = {
          [field]: (audit as Record<string, unknown>)[field] as number + 1,
        };
        if (audit.status === "open") {
          update.status = "in_progress";
          update.started_at = new Date().toISOString();
        }
        await supabase.from("asset_audits").update(update).eq("id", auditId);
      }

      setLastScan({ asset_id: asset.asset_id as string, name: asset.name as string, status: finalResult });
      setNotes("");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record scan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Mark scans as</label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {RESULTS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setResult(r.value)}
              className={
                "px-3 py-2 rounded-lg text-sm font-medium border " +
                (result === r.value
                  ? "border-brand-500 ring-2 ring-brand-200 " + r.tone
                  : "border-slate-200 bg-white hover:bg-slate-50")
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Notes (optional)</label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input mt-1"
          placeholder="e.g. small dent on case"
        />
      </div>

      <QrScannerBox onResult={onScan} paused={busy} />

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      {lastScan && !error && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg px-3 py-2 flex items-center gap-2">
          <Check className="h-4 w-4" />
          Recorded <strong>{lastScan.asset_id}</strong> — {lastScan.name} ({lastScan.status})
        </div>
      )}
    </div>
  );
}
