"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CurrencyInput } from "@/components/ui/CurrencyInput";

type Option = { id: string; name: string };
type Category = Option & { prefix: string; useful_life_years: number };

interface AssetFormProps {
  existing?: Record<string, unknown> | null;
  categories: Category[];
  locations: Option[];
  departments: Option[];
  projects: (Option & { status: string })[];
  suppliers: Option[];
}

const STATUSES = [
  "available", "assigned", "borrowed", "in_repair", "lost", "damaged", "disposed",
] as const;
const CONDITIONS = ["new", "good", "fair", "poor", "broken"] as const;

export function AssetForm({
  existing,
  categories,
  locations,
  departments,
  projects,
  suppliers,
}: AssetFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function v(field: string) {
    return (existing?.[field] as string | number | null | undefined) ?? "";
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    // Cross-field date validation — warranty_end must be ≥ warranty_start.
    const ws = (form.get("warranty_start") as string) || "";
    const we = (form.get("warranty_end") as string) || "";
    if (ws && we && we < ws) {
      setError("Warranty End cannot be earlier than Warranty Start.");
      setSubmitting(false);
      return;
    }

    const payload: Record<string, unknown> = {
      name: form.get("name"),
      category_id: form.get("category_id") || null,
      brand: form.get("brand") || null,
      model: form.get("model") || null,
      serial_number: form.get("serial_number") || null,
      specification: form.get("specification") || null,
      purchase_date: form.get("purchase_date") || null,
      supplier_id: form.get("supplier_id") || null,
      po_number: form.get("po_number") || null,
      invoice_number: form.get("invoice_number") || null,
      purchase_price: Number(form.get("purchase_price") || 0),
      useful_life_years: Number(form.get("useful_life_years") || 0) || null,
      book_value: Number(form.get("book_value") || form.get("purchase_price") || 0),
      location_id: form.get("location_id") || null,
      department_id: form.get("department_id") || null,
      project_id: form.get("project_id") || null,
      status: form.get("status") || "available",
      condition: form.get("condition") || "good",
      warranty_start: form.get("warranty_start") || null,
      warranty_end: form.get("warranty_end") || null,
      notes: form.get("notes") || null,
    };

    try {
      const supabase = createClient();
      if (existing?.id) {
        const { error } = await supabase.from("assets").update(payload).eq("id", existing.id);
        if (error) throw error;
        router.push(`/assets/${existing.id}`);
      } else {
        const { data, error } = await supabase.from("assets").insert(payload).select("id").single();
        if (error) throw error;
        router.push(`/assets/${data.id}`);
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save asset");
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

      <Field label="Asset Name *" required>
        <input name="name" defaultValue={v("name") as string} required className="input" />
      </Field>
      <Field label="Category *" required>
        <select name="category_id" defaultValue={v("category_id") as string} className="select" required>
          <option value="">— select —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Brand">
        <input name="brand" defaultValue={v("brand") as string} className="input" />
      </Field>
      <Field label="Model">
        <input name="model" defaultValue={v("model") as string} className="input" />
      </Field>
      <Field label="Serial Number">
        <input name="serial_number" defaultValue={v("serial_number") as string} className="input" />
      </Field>
      <Field label="Status">
        <select name="status" defaultValue={(v("status") as string) || "available"} className="select">
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
      </Field>
      <Field label="Condition">
        <select name="condition" defaultValue={(v("condition") as string) || "good"} className="select">
          {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Useful Life (years)">
        <input
          name="useful_life_years"
          type="number"
          min={0}
          defaultValue={v("useful_life_years") as number}
          className="input"
        />
      </Field>
      <Field label="Specification" wide>
        <textarea
          name="specification"
          defaultValue={v("specification") as string}
          rows={2}
          className="textarea"
        />
      </Field>

      <Field label="Purchase Date">
        <input name="purchase_date" type="date" defaultValue={v("purchase_date") as string} className="input" />
      </Field>
      <Field label="Supplier">
        <select name="supplier_id" defaultValue={v("supplier_id") as string} className="select">
          <option value="">— optional —</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <Field label="PO Number">
        <input name="po_number" defaultValue={v("po_number") as string} className="input" />
      </Field>
      <Field label="Invoice Number">
        <input name="invoice_number" defaultValue={v("invoice_number") as string} className="input" />
      </Field>
      <Field label="Purchase Price (IDR)">
        <CurrencyInput name="purchase_price" defaultValue={v("purchase_price") as number} />
      </Field>
      <Field label="Book Value (IDR)">
        <CurrencyInput name="book_value" defaultValue={v("book_value") as number} />
      </Field>

      <Field label="Location">
        <select name="location_id" defaultValue={v("location_id") as string} className="select">
          <option value="">— optional —</option>
          {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </Field>
      <Field label="Department">
        <select name="department_id" defaultValue={v("department_id") as string} className="select">
          <option value="">— optional —</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </Field>
      <Field label="Project">
        <select name="project_id" defaultValue={v("project_id") as string} className="select">
          <option value="">— optional —</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <Field label="Warranty Start">
        <input name="warranty_start" type="date" defaultValue={v("warranty_start") as string} className="input" />
      </Field>
      <Field label="Warranty End">
        <input name="warranty_end" type="date" defaultValue={v("warranty_end") as string} className="input" />
      </Field>
      <Field label="Notes" wide>
        <textarea name="notes" defaultValue={v("notes") as string} rows={2} className="textarea" />
      </Field>

      <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
        <button type="button" onClick={() => router.back()} className="btn-ghost">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Saving..." : existing?.id ? "Save Changes" : "Create Asset"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
  required?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label className="label">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
