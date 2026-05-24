"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Opt { id: string; name: string }

export function NewAuditForm({ locations, departments }: { locations: Opt[]; departments: Opt[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const location_id = (f.get("location_id") as string) || null;
    const department_id = (f.get("department_id") as string) || null;

    try {
      const supabase = createClient();
      // Count expected assets
      let q = supabase.from("assets").select("id", { count: "exact", head: true }).neq("status", "disposed");
      if (location_id) q = q.eq("location_id", location_id);
      if (department_id) q = q.eq("department_id", department_id);
      const { count: expected } = await q;

      // Generate audit code
      const year = new Date().getFullYear();
      const { count: existing } = await supabase
        .from("asset_audits")
        .select("id", { count: "exact", head: true })
        .like("audit_code", `AUD-${year}-%`);
      const code = `AUD-${year}-${String((existing ?? 0) + 1).padStart(3, "0")}`;

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error: insErr } = await supabase
        .from("asset_audits")
        .insert({
          audit_code: code,
          title: f.get("title"),
          location_id,
          department_id,
          scheduled_date: f.get("scheduled_date") || null,
          status: "open",
          total_expected: expected ?? 0,
          created_by: user?.id ?? null,
        })
        .select("id")
        .single();
      if (insErr) throw insErr;
      router.push(`/audit/${data.id}`);
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
        <label className="label">Audit Title *</label>
        <input
          name="title"
          required
          placeholder="e.g. Stock Opname Q2 - Warehouse Jakarta"
          className="input mt-1"
        />
      </div>
      <div>
        <label className="label">Location</label>
        <select name="location_id" className="select mt-1">
          <option value="">— all —</option>
          {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Department</label>
        <select name="department_id" className="select mt-1">
          <option value="">— all —</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Scheduled Date</label>
        <input name="scheduled_date" type="date" className="input mt-1" />
      </div>
      <div className="sm:col-span-2 flex justify-end gap-2">
        <button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Creating..." : "Create Audit"}
        </button>
      </div>
    </form>
  );
}
