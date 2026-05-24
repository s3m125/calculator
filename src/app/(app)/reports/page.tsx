import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { ReportsClient } from "@/components/reports/ReportsClient";
import type { AssetListRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const supabase = createClient();
  const [assets, assignments, transfers, maintenance, depr, disp, audits] = await Promise.all([
    supabase.from("v_asset_list").select("*").order("created_at", { ascending: false }),
    supabase
      .from("asset_assignments")
      .select("assigned_date, due_date, returned_date, status, notes, assets:asset_id(asset_id, name), user:assigned_to(full_name), project:project_id(name)"),
    supabase
      .from("asset_transfers")
      .select("transfer_date, reason, status, assets:asset_id(asset_id, name), from:from_location_id(name), to:to_location_id(name)"),
    supabase
      .from("asset_maintenance")
      .select("maintenance_type, description, schedule_date, completed_date, cost, vendor_name, status, assets:asset_id(asset_id, name)"),
    supabase
      .from("asset_depreciation")
      .select("period, monthly_depreciation, accumulated_depreciation, book_value, assets:asset_id(asset_id, name)"),
    supabase
      .from("asset_disposals")
      .select("reason, disposal_date, disposal_value, status, buyer_name, assets:asset_id(asset_id, name)"),
    supabase
      .from("asset_audits")
      .select("audit_code, title, scheduled_date, completed_at, status, total_expected, total_found, total_not_found, total_different_location, total_damaged"),
  ]);

  return (
    <>
      <PageHeader title="Reports" description="Excel exports of every operational table." />
      <ReportsClient
        assets={(assets.data ?? []) as unknown as AssetListRow[]}
        assignments={(assignments.data ?? []).map(flatten)}
        transfers={(transfers.data ?? []).map(flatten)}
        maintenance={(maintenance.data ?? []).map(flatten)}
        depreciation={(depr.data ?? []).map(flatten)}
        disposals={(disp.data ?? []).map(flatten)}
        audits={audits.data ?? []}
      />
    </>
  );
}

function flatten(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const [nk, nv] of Object.entries(v as Record<string, unknown>)) {
        out[`${k}_${nk}`] = nv;
      }
    } else {
      out[k] = v;
    }
  }
  return out;
}
