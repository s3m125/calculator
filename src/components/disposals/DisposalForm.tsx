"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  assets: { id: string; asset_id: string; name: string }[];
  preselectAsset?: string;
}

const REASONS = [
  { value: "damaged", label: "Damaged" },
  { value: "lost", label: "Lost" },
  { value: "obsolete", label: "Obsolete" },
  { value: "sold", label: "Sold" },
  { value: "scrap", label: "Scrap" },
  { value: "other", label: "Other" },
];

export function DisposalForm({ assets, preselectAsset }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {
      asset_id: f.get("asset_id"),
      reason: f.get("reason"),
      disposal_date: f.get("disposal_date") || null,
      disposal_value: Number(f.get("disposal_value") || 0),
      buyer_name: f.get("buyer_name") || null,
      notes: f.get("notes") || null,
      status: "requested",
    };
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) payload.requested_by = user.id;
      const { error: err } = await supabase.from("asset_disposals").insert(payload);
      if (err) throw err;
      router.push("/disposals");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {error && (
        <div className="sm:col-span-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      <div className="sm:col-span-2">
        <label className="label">Asset *</label>
        <select name="asset_id" required defaultValue={preselectAsset ?? ""} className="select mt-1">
          <option value="">— select —</option>
          {assets.map((a) => <option key={a.id} value={a.id}>{a.asset_id} — {a.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Reason *</label>
        <select name="reason" required className="select mt-1">
          {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Disposal Date</label>
        <input name="disposal_date" type="date" className="input mt-1" />
      </div>
      <div>
        <label className="label">Disposal Value (IDR)</label>
        <input name="disposal_value" type="number" min={0} step="any" className="input mt-1" />
      </div>
      <div>
        <label className="label">Buyer / Recipient</label>
        <input name="buyer_name" className="input mt-1" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Notes</label>
        <textarea name="notes" rows={2} className="textarea mt-1" />
      </div>
      <div className="sm:col-span-2 flex justify-end gap-2">
        <button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Saving..." : "Submit Request"}
        </button>
      </div>
    </form>
  );
}
