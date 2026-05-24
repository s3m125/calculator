"use client";

import { Download } from "lucide-react";
import { utils, writeFile } from "xlsx";

interface ExportButtonProps<T extends Record<string, unknown>> {
  rows: T[];
  filename: string;
  fields: [keyof T, string][];
  label?: string;
}

export function ExportButton<T extends Record<string, unknown>>({
  rows,
  filename,
  fields,
  label = "Export Excel",
}: ExportButtonProps<T>) {
  function onClick() {
    const data = rows.map((row) => {
      const out: Record<string, unknown> = {};
      for (const [key, header] of fields) {
        const val = row[key];
        out[header] = val == null ? "" : val;
      }
      return out;
    });
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Sheet1");
    const stamp = new Date().toISOString().slice(0, 10);
    writeFile(wb, `${filename}_${stamp}.xlsx`);
  }

  return (
    <button onClick={onClick} className="btn-secondary" type="button">
      <Download className="h-4 w-4" />
      {label}
    </button>
  );
}
