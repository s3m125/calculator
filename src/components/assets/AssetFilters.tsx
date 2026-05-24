"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Filter, X } from "lucide-react";

const STATUSES = [
  "available", "assigned", "borrowed", "in_repair", "lost", "damaged", "disposed",
] as const;

interface Props {
  categories: { value: string; label: string }[];
  locations: string[];
  departments: string[];
  initial: Record<string, string | undefined>;
}

export function AssetFilters({ categories, locations, departments, initial }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(initial.q ?? "");

  function push(next: Record<string, string | undefined>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    router.push(`/assets?${sp.toString()}`);
  }

  function clearAll() {
    setQ("");
    router.push("/assets");
  }

  return (
    <div className="card p-3 flex flex-wrap items-center gap-2">
      <Filter className="h-4 w-4 text-slate-500 ml-1" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          push({ q });
        }}
        className="flex-1 min-w-[220px]"
      >
        <input
          className="input"
          placeholder="Search name, asset ID, serial, brand..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </form>
      <select
        className="select w-44"
        value={initial.category ?? ""}
        onChange={(e) => push({ category: e.target.value || undefined })}
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
      <select
        className="select w-40"
        value={initial.status ?? ""}
        onChange={(e) => push({ status: e.target.value || undefined })}
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s.replace("_", " ")}</option>
        ))}
      </select>
      <select
        className="select w-44"
        value={initial.location ?? ""}
        onChange={(e) => push({ location: e.target.value || undefined })}
      >
        <option value="">All locations</option>
        {locations.map((l) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>
      <select
        className="select w-44"
        value={initial.department ?? ""}
        onChange={(e) => push({ department: e.target.value || undefined })}
      >
        <option value="">All departments</option>
        {departments.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <button onClick={clearAll} className="btn-ghost" type="button">
        <X className="h-4 w-4" />
        Clear
      </button>
    </div>
  );
}
