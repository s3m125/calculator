"use client";

// Number input that shows an IDR-formatted preview underneath the field, so a
// stray extra zero (Rp 250 jt vs Rp 25 jt) is visible at a glance.
import { useState } from "react";

interface Props {
  name: string;
  defaultValue?: number | string | null;
  required?: boolean;
  min?: number;
}

function formatIDR(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function CurrencyInput({ name, defaultValue, required, min = 0 }: Props) {
  const initial = Number(defaultValue ?? 0);
  const [value, setValue] = useState<string>(initial > 0 ? String(initial) : "");

  const n = Number(value);
  return (
    <div>
      <input
        name={name}
        type="number"
        inputMode="decimal"
        min={min}
        step="any"
        required={required}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="input"
      />
      {value && Number.isFinite(n) && n > 0 && (
        <div className="mt-1 text-[11px] text-slate-500 tabular-nums">
          ≈ {formatIDR(n)}
        </div>
      )}
    </div>
  );
}
