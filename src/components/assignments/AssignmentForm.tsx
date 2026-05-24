"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Opt { id: string; name: string }

interface Props {
  assets: { id: string; asset_id: string; name: string }[];
  users: Opt[];
  projects: Opt[];
  locations: Opt[];
  preselectAsset?: string;
}

export function AssignmentForm({ assets, users, projects, locations, preselectAsset }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<"employee" | "project" | "location">("employee");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const asset_id = f.get("asset_id") as string;
    const payload: Record<string, unknown> = {
      asset_id,
      assignment_type: type,
      assigned_to: type === "employee" ? f.get("assigned_to") || null : null,
      project_id: type === "project" ? f.get("project_id") || null : null,
      location_id: type === "location" ? f.get("location_id") || null : null,
      assigned_date: f.get("assigned_date") || new Date().toISOString().slice(0, 10),
      due_date: f.get("due_date") || null,
      notes: f.get("notes") || null,
      status: "active",
    };

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) payload.created_by = user.id;

      const { error: insErr } = await supabase.from("asset_assignments").insert(payload);
      if (insErr) throw insErr;

      // also update the asset's current state
      const update: Record<string, unknown> = { status: "assigned" };
      if (type === "employee") update.assigned_to = payload.assigned_to;
      if (type === "project")  update.project_id  = payload.project_id;
      if (type === "location") update.location_id = payload.location_id;
      const { error: upErr } = await supabase.from("assets").update(update).eq("id", asset_id);
      if (upErr) throw upErr;

      router.push("/assignments");
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
          {assets.map((a) => (
            <option key={a.id} value={a.id}>{a.asset_id} — {a.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Assign To</label>
        <div className="flex gap-2 mt-1">
          {(["employee", "project", "location"] as const).map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setType(t)}
              className={
                "px-3 py-1.5 rounded-lg text-sm font-medium " +
                (type === t ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")
              }
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Assigned Date</label>
        <input
          name="assigned_date"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="input mt-1"
        />
      </div>

      {type === "employee" && (
        <div className="sm:col-span-2">
          <label className="label">Employee *</label>
          <select name="assigned_to" required className="select mt-1">
            <option value="">— select user —</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      )}
      {type === "project" && (
        <div className="sm:col-span-2">
          <label className="label">Project *</label>
          <select name="project_id" required className="select mt-1">
            <option value="">— select project —</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}
      {type === "location" && (
        <div className="sm:col-span-2">
          <label className="label">Location *</label>
          <select name="location_id" required className="select mt-1">
            <option value="">— select location —</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="label">Due Date (Return)</label>
        <input name="due_date" type="date" className="input mt-1" />
      </div>

      <div className="sm:col-span-2">
        <label className="label">Notes</label>
        <textarea name="notes" rows={2} className="textarea mt-1" />
      </div>

      <div className="sm:col-span-2 flex justify-end gap-2">
        <button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Saving..." : "Create Assignment"}
        </button>
      </div>
    </form>
  );
}
