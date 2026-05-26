import { createClient } from "@/lib/supabase/server";
import type { AssetListRow } from "@/lib/supabase/types";

export type DashboardData = {
  totals: {
    total: number;
    totalValue: number;
    bookValue: number;
    available: number;
    assigned: number;
    inRepair: number;
    lostDamaged: number;
    borrowed: number;
    disposed: number;
  };
  byCategory: { name: string; value: number }[];
  byStatus: { name: string; value: number }[];
  recentAssets: AssetListRow[];
  warrantyExpiring: AssetListRow[];
  overdueReturns: {
    id: string;
    asset_name: string;
    asset_id: string;
    user_name: string | null;
    due_date: string | null;
  }[];
  recentActivity: {
    id: string;
    title: string;
    detail: string;
    when: string;
  }[];
};

// Only the columns we actually display / aggregate. Down from 25+ cols on
// v_asset_list to 11 — meaningful payload reduction on the cross-region
// (Singapore → Singapore) hop.
const ASSET_COLS =
  "id, asset_id, name, status, category_name, location_name, purchase_price, book_value, warranty_end, created_at, qr_code, serial_number";

const todayIso = () => new Date().toISOString().slice(0, 10);

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = createClient();

  // Single Promise.all — all six queries fire in parallel. Previously this
  // was three sequential round-trips (assets+cats → overdue → activity x3),
  // which on a Singapore→Singapore link still costs ~150-300ms per await.
  const [
    { data: assets },
    { data: categories },
    { data: overdueAssignments },
    { data: assn },
    { data: tr },
    { data: mt },
  ] = await Promise.all([
    supabase
      .from("v_asset_list")
      .select(ASSET_COLS)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("asset_categories").select("id, name"),
    supabase
      .from("asset_assignments")
      .select("id, due_date, assets:asset_id(name, asset_id), user:assigned_to(full_name)")
      .eq("status", "active")
      .not("due_date", "is", null)
      .lt("due_date", todayIso())
      .order("due_date", { ascending: true })
      .limit(8),
    supabase
      .from("asset_assignments")
      .select("id, created_at, assets:asset_id(name), user:assigned_to(full_name)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("asset_transfers")
      .select("id, created_at, assets:asset_id(name), from:from_location_id(name), to:to_location_id(name)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("asset_maintenance")
      .select("id, created_at, description, assets:asset_id(name), status")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const rows: AssetListRow[] = (assets ?? []) as unknown as AssetListRow[];

  // Totals + byStatus in a single pass — was previously a reduce + a
  // separate filter-per-status loop.
  const totals = {
    total: 0, totalValue: 0, bookValue: 0,
    available: 0, assigned: 0, borrowed: 0, inRepair: 0,
    lostDamaged: 0, disposed: 0,
  };
  const statusCounts: Record<string, number> = {};
  const catCounts = new Map<string, number>();
  for (const a of rows) {
    totals.total += 1;
    totals.totalValue += Number(a.purchase_price ?? 0);
    totals.bookValue += Number(a.book_value ?? 0);
    statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;
    switch (a.status) {
      case "available":  totals.available  += 1; break;
      case "assigned":   totals.assigned   += 1; break;
      case "borrowed":   totals.borrowed   += 1; break;
      case "in_repair":  totals.inRepair   += 1; break;
      case "lost":
      case "damaged":    totals.lostDamaged += 1; break;
      case "disposed":   totals.disposed   += 1; break;
    }
    const key = a.category_name ?? "Uncategorized";
    catCounts.set(key, (catCounts.get(key) ?? 0) + 1);
  }

  // Ensure every category surface in the donut even with 0 assets.
  for (const c of categories ?? []) {
    if (!catCounts.has(c.name)) catCounts.set(c.name, 0);
  }
  const byCategory = Array.from(catCounts, ([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const byStatus = (
    ["available", "assigned", "borrowed", "in_repair", "damaged", "lost", "disposed"] as const
  ).map((s) => ({ name: s.replace("_", " "), value: statusCounts[s] ?? 0 }));

  const recentAssets = rows.slice(0, 8);

  const now = Date.now();
  const warrantyExpiring = rows
    .filter((a) => {
      if (!a.warranty_end) return false;
      const diff = (new Date(a.warranty_end).getTime() - now) / 86400000;
      return diff > -7 && diff <= 60;
    })
    .sort(
      (a, b) => new Date(a.warranty_end ?? 0).getTime() - new Date(b.warranty_end ?? 0).getTime(),
    )
    .slice(0, 6);

  const overdueReturns =
    (overdueAssignments ?? []).map((a) => {
      const asset = a.assets as unknown as { name: string; asset_id: string } | null;
      const user = a.user as unknown as { full_name: string } | null;
      return {
        id: a.id as string,
        asset_name: asset?.name ?? "Asset",
        asset_id: asset?.asset_id ?? "-",
        user_name: user?.full_name ?? null,
        due_date: a.due_date as string | null,
      };
    });

  type AssetRel = { name: string } | null;
  const activity: DashboardData["recentActivity"] = [];
  for (const a of assn ?? []) {
    const asset = a.assets as unknown as AssetRel;
    const user = a.user as unknown as { full_name: string } | null;
    activity.push({
      id: `as-${a.id}`,
      title: "Asset assigned",
      detail: `${asset?.name ?? "Asset"} → ${user?.full_name ?? "Unassigned"}`,
      when: a.created_at as string,
    });
  }
  for (const a of tr ?? []) {
    const asset = a.assets as unknown as AssetRel;
    const from = a.from as unknown as AssetRel;
    const to = a.to as unknown as AssetRel;
    activity.push({
      id: `tr-${a.id}`,
      title: "Asset transferred",
      detail: `${asset?.name ?? "Asset"} • ${from?.name ?? "-"} → ${to?.name ?? "-"}`,
      when: a.created_at as string,
    });
  }
  for (const a of mt ?? []) {
    const asset = a.assets as unknown as AssetRel;
    activity.push({
      id: `mt-${a.id}`,
      title: `Maintenance ${a.status}`,
      detail: `${asset?.name ?? "Asset"} — ${a.description ?? ""}`,
      when: a.created_at as string,
    });
  }
  activity.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

  return {
    totals, byCategory, byStatus,
    recentAssets, warrantyExpiring, overdueReturns,
    recentActivity: activity.slice(0, 10),
  };
}
