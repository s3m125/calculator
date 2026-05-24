"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Opt { id: string; name: string }

interface Props {
  assets: { id: string; asset_id: string; name: string; location_id: string | null; department_id: string | null; project_id: string | null; assigned_to: string | null }[];
  locations: Opt[];
  departments: Opt[];
  projects: Opt[];
  users: Opt[];
  preselectAsset?: string;
}

export function TransferForm({ assets, locations, departments, projects, users, preselectAsset }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assetId, setAssetId] = useState(preselectAsset ?? "");
  const current = assets.find((a) => a.id === assetId);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const f = new FormData(e.currentTarget);

    const to_location_id = (f.get("to_location_id") as string) || null;
    const to_department_id = (f.get("to_department_id") as string) || null;
    const to_project_id = (f.get("to_project_id") as string) || null;
    const to_user_id = (f.get("to_user_id") as string) || null;

    const payload: Record<string, unknown> = {
      asset_id: assetId,
      from_location_id: current?.location_id ?? null,
      from_department_id: current?.department_id ?? null,
      from_project_id: current?.project_id ?? null,
      from_user_id: current?.assigned_to ?? null,
      to_location_id,
      to_department_id,
      to_project_id,
      to_user_id,
      transfer_date: f.get("transfer_date") || new Date().toISOString().slice(0, 10),
      reason: f.get("reason") || null,
      gps_note: f.get("gps_note") || null,
      status: "completed",
    };

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        payload.created_by = user.id;
        payload.approved_by = user.id;
        payload.approved_at = new Date().toISOString();
      }

      const { error: tErr } = await supabase.from("asset_transfers").insert(payload);
      if (tErr) throw tErr;

      const update: Record<string, unknown> = {};
      if (to_location_id) update.location_id = to_location_id;
      if (to_department_id) update.department_id = to_department_id;
      if (to_project_id) update.project_id = to_project_id;
      if (to_user_id) {
        update.assigned_to = to_user_id;
        update.status = "assigned";
      }
      if (Object.keys(update).length > 0) {
        const { error: uErr } = await supabase.from("assets").update(update).eq("id", assetId);
        if (uErr) throw uErr;
      }

      router.push("/transfers");
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
        <select
          required
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
          className="select mt-1"
        >
          <option value="">— select asset —</option>
          {assets.map((a) => <option key={a.id} value={a.id}>{a.asset_id} — {a.name}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Transfer Date</label>
        <input
          name="transfer_date"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="input mt-1"
        />
      </div>
      <div>
        <label className="label">Reason</label>
        <input name="reason" placeholder="e.g. project rotation" className="input mt-1" />
      </div>

      <div>
        <label className="label">To Location</label>
        <select name="to_location_id" className="select mt-1">
          <option value="">— optional —</option>
          {locations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">To Department</label>
        <select name="to_department_id" className="select mt-1">
          <option value="">— optional —</option>
          {departments.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">To Project</label>
        <select name="to_project_id" className="select mt-1">
          <option value="">— optional —</option>
          {projects.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">To User</label>
        <select name="to_user_id" className="select mt-1">
          <option value="">— optional —</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      <div className="sm:col-span-2">
        <label className="label">GPS / Notes</label>
        <textarea name="gps_note" rows={2} className="textarea mt-1" placeholder="-6.2088,106.8456 or address" />
      </div>

      <div className="sm:col-span-2 flex justify-end gap-2">
        <button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Saving..." : "Save Transfer"}
        </button>
      </div>
    </form>
  );
}
