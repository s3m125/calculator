import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate } from "@/lib/utils";
import { ExportButton } from "@/components/ExportButton";

export const dynamic = "force-dynamic";

interface Row {
  asset_id: string;
  name: string;
  category_name: string;
  purchase_date: string | null;
  purchase_price: number;
  useful_life_months: number;
  age_months: number;
  monthly_depreciation: number;
  accumulated_depreciation: number;
  book_value: number;
}

export default async function DepreciationPage() {
  const supabase = createClient();
  const { data: assets } = await supabase
    .from("v_asset_list")
    .select(
      "asset_id, name, category_name, purchase_date, purchase_price, book_value, status",
    )
    .neq("status", "disposed")
    .not("purchase_date", "is", null)
    .order("purchase_date", { ascending: false });

  const { data: cats } = await supabase
    .from("asset_categories")
    .select("name, useful_life_years");

  const ulMap = new Map<string, number>((cats ?? []).map((c) => [c.name, c.useful_life_years]));
  const now = new Date();

  const rows: Row[] = (assets ?? []).map((a) => {
    const price = Number(a.purchase_price ?? 0);
    const category = a.category_name ?? "";
    const ulYears = ulMap.get(category) ?? 4;
    const ulMonths = ulYears * 12;
    const pd = a.purchase_date ? new Date(a.purchase_date) : now;
    const ageMonths = Math.max(
      0,
      (now.getFullYear() - pd.getFullYear()) * 12 + (now.getMonth() - pd.getMonth()),
    );
    const monthly = ulMonths > 0 ? price / ulMonths : 0;
    const accumulated = Math.min(price, monthly * ageMonths);
    const bv = Math.max(0, price - accumulated);
    return {
      asset_id: a.asset_id as string,
      name: a.name as string,
      category_name: category,
      purchase_date: a.purchase_date as string | null,
      purchase_price: price,
      useful_life_months: ulMonths,
      age_months: ageMonths,
      monthly_depreciation: Math.round(monthly),
      accumulated_depreciation: Math.round(accumulated),
      book_value: Math.round(bv),
    };
  });

  const totals = rows.reduce(
    (acc, r) => {
      acc.purchase += r.purchase_price;
      acc.monthly += r.monthly_depreciation;
      acc.accumulated += r.accumulated_depreciation;
      acc.book += r.book_value;
      return acc;
    },
    { purchase: 0, monthly: 0, accumulated: 0, book: 0 },
  );

  return (
    <>
      <PageHeader
        title="Depreciation"
        description="Straight-line depreciation calculated from purchase date and useful life."
      >
        <ExportButton
          rows={rows as unknown as Record<string, unknown>[]}
          filename="depreciation"
          fields={[
            ["asset_id", "Asset ID"],
            ["name", "Asset"],
            ["category_name", "Category"],
            ["purchase_date", "Purchase Date"],
            ["purchase_price", "Purchase Price"],
            ["useful_life_months", "Useful Life (months)"],
            ["age_months", "Age (months)"],
            ["monthly_depreciation", "Monthly Depreciation"],
            ["accumulated_depreciation", "Accumulated"],
            ["book_value", "Book Value"],
          ]}
        />
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card label="Total Purchase Value" value={formatIDR(totals.purchase)} />
        <Card label="Monthly Depreciation" value={formatIDR(totals.monthly)} />
        <Card label="Accumulated" value={formatIDR(totals.accumulated)} />
        <Card label="Net Book Value" value={formatIDR(totals.book)} />
      </div>

      <div className="card overflow-x-auto">
        <table className="table w-full min-w-[1000px]">
          <thead className="bg-slate-50">
            <tr>
              <th>Asset</th>
              <th>Category</th>
              <th>Purchase</th>
              <th className="text-right">Purchase Price</th>
              <th className="text-right">Useful Life</th>
              <th className="text-right">Age</th>
              <th className="text-right">Monthly</th>
              <th className="text-right">Accumulated</th>
              <th className="text-right">Book Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.asset_id}>
                <td>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-slate-500 font-mono">{r.asset_id}</p>
                </td>
                <td>{r.category_name}</td>
                <td className="text-xs">{formatDate(r.purchase_date)}</td>
                <td className="text-right tabular-nums">{formatIDR(r.purchase_price)}</td>
                <td className="text-right tabular-nums">{(r.useful_life_months / 12).toFixed(0)}y</td>
                <td className="text-right tabular-nums">{r.age_months} mo</td>
                <td className="text-right tabular-nums">{formatIDR(r.monthly_depreciation)}</td>
                <td className="text-right tabular-nums">{formatIDR(r.accumulated_depreciation)}</td>
                <td className="text-right tabular-nums font-semibold">{formatIDR(r.book_value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
}
