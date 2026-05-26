import Link from "next/link";
import { Plus, QrCode } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CategoryThumb } from "@/components/ui/CategoryThumb";
import { AssetFilters } from "@/components/assets/AssetFilters";
import { ExportButton } from "@/components/ExportButton";
import { formatDate, formatIDR } from "@/lib/utils";
import { getCategoriesLite, getLocations, getDepartments } from "@/lib/lookups";
import type { AssetListRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  category?: string;
  location?: string;
  status?: string;
  department?: string;
}

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();
  const profile = await getProfile();
  const canCreate = ["super_admin", "asset_admin", "purchasing", "warehouse"].includes(
    profile?.role?.code ?? "",
  );

  // Trimmed list query (~12 cols) — used by the table & filters.
  let query = supabase
    .from("v_asset_list")
    .select(
      "id, asset_id, name, serial_number, brand, model, status, condition, " +
      "category_name, category_code, location_name, department_name, project_name, " +
      "assigned_to_name, supplier_name, purchase_price, book_value, warranty_end, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (searchParams.status)     query = query.eq("status", searchParams.status);
  if (searchParams.category)   query = query.eq("category_code", searchParams.category);

  // Run the list query in parallel with the cached filter-option lookups
  // so the round trip to Supabase is fully overlapped.
  const [{ data: raw }, cats, locs, deps] = await Promise.all([
    query,
    getCategoriesLite(),
    getLocations(),
    getDepartments(),
  ]);
  let rows = ((raw ?? []) as unknown as AssetListRow[]);

  if (searchParams.q) {
    const q = searchParams.q.toLowerCase();
    rows = rows.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.asset_id.toLowerCase().includes(q) ||
        (a.serial_number ?? "").toLowerCase().includes(q) ||
        (a.brand ?? "").toLowerCase().includes(q) ||
        (a.model ?? "").toLowerCase().includes(q),
    );
  }
  if (searchParams.location) rows = rows.filter((a) => a.location_name === searchParams.location);
  if (searchParams.department) rows = rows.filter((a) => a.department_name === searchParams.department);

  return (
    <>
      <PageHeader
        title="Assets"
        description={`${rows.length} asset${rows.length === 1 ? "" : "s"} in the system.`}
      >
        <ExportButton
          rows={rows as unknown as Record<string, unknown>[]}
          filename="asset_register"
          fields={[
            ["asset_id", "Asset ID"],
            ["name", "Name"],
            ["category_name", "Category"],
            ["brand", "Brand"],
            ["model", "Model"],
            ["serial_number", "Serial #"],
            ["status", "Status"],
            ["condition", "Condition"],
            ["location_name", "Location"],
            ["department_name", "Department"],
            ["project_name", "Project"],
            ["assigned_to_name", "Assigned To"],
            ["purchase_date", "Purchase Date"],
            ["purchase_price", "Purchase Price"],
            ["book_value", "Book Value"],
            ["warranty_end", "Warranty End"],
          ]}
        />
        {canCreate && (
          <Link href="/assets/new" className="btn-primary">
            <Plus className="h-4 w-4" />
            Add Asset
          </Link>
        )}
      </PageHeader>

      <AssetFilters
        categories={cats.map((c) => ({ value: c.code, label: c.name }))}
        locations={locs.map((l) => l.name)}
        departments={deps.map((d) => d.name)}
        initial={searchParams as Record<string, string | undefined>}
      />

      <div className="card overflow-x-auto mt-4">
        <table className="table w-full min-w-[1100px]">
          <thead className="bg-slate-50/70">
            <tr>
              <th>Asset</th>
              <th>Category</th>
              <th>Status</th>
              <th>Location</th>
              <th>Department</th>
              <th>Assigned To</th>
              <th>Warranty</th>
              <th className="text-right">Value</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center text-slate-500 py-10">
                  No assets match the filters.
                </td>
              </tr>
            )}
            {rows.map((a) => (
              <tr key={a.id}>
                <td>
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryThumb assetId={a.asset_id} />
                    <div className="min-w-0">
                      <Link
                        href={`/assets/${a.id}`}
                        className="font-medium text-slate-900 hover:text-indigo-600 truncate block"
                      >
                        {a.name}
                      </Link>
                      <div className="text-xs text-slate-400 font-mono truncate">
                        {a.asset_id}{a.serial_number ? ` · ${a.serial_number}` : ""}
                      </div>
                    </div>
                  </div>
                </td>
                <td>{a.category_name ?? "-"}</td>
                <td><StatusBadge status={a.status} /></td>
                <td>{a.location_name ?? "-"}</td>
                <td>{a.department_name ?? "-"}</td>
                <td>{a.assigned_to_name ?? <span className="text-slate-400">—</span>}</td>
                <td className="text-xs">{formatDate(a.warranty_end)}</td>
                <td className="text-right tabular-nums">{formatIDR(a.purchase_price)}</td>
                <td>
                  <Link
                    href={`/assets/${a.id}/qr`}
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                  >
                    <QrCode className="h-3.5 w-3.5" /> QR
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
