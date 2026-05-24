"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  assets: { id: string; asset_id: string; name: string }[];
  preselectAsset?: string;
}

export function MaintenanceForm({ assets, preselectAsset }: Props) {
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
      maintenance_type: f.get("maintenance_type") || "corrective",
      description: f.get("description"),
      vendor_name: f.get("vendor_name") || null,
      cost: Number(f.get("cost") || 0),
      schedule_date: f.get("schedule_date") || null,
      spareparts_used: f.get("spareparts_used") || null,
      status: "requested",
    };
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) payload.requested_by = user.id;
      const { error: err } = await supabase.from("asset_maintenance").insert(payload);
      if (err) throw err;
      router.push("/maintenance");
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
          <option value="">— select asset —</option>
          {assets.map((a) => <option key={a.id} value={a.id}>{a.asset_id} — {a.name}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Type</label>
        <select name="maintenance_type" defaultValue="corrective" className="select mt-1">
          <option value="preventive">Preventive</option>
          <option value="corrective">Corrective</option>
        </select>
      </div>
      <div>
        <label className="label">Scheduled Date</label>
        <input name="schedule_date" type="date" className="input mt-1" />
      </div>

      <div className="sm:col-span-2">
        <label className="label">Description *</label>
        <textarea name="description" required rows={3} className="textarea mt-1" />
      </div>

      <div>
        <label className="label">Vendor</label>
        <input name="vendor_name" className="input mt-1" />
      </div>
      <div>
        <label className="label">Estimated Cost (IDR)</label>
        <input name="cost" type="number" min={0} step="any" className="input mt-1" />
      </div>

      <div className="sm:col-span-2">
        <label className="label">Spareparts Used</label>
        <input name="spareparts_used" className="input mt-1" />
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
