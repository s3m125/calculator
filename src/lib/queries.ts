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

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = createClient();

  const [{ data: assets }, { data: categories }] = await Promise.all([
    supabase
      .from("v_asset_list")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("asset_categories").select("id, name"),
  ]);

  const rows: AssetListRow[] = (assets ?? []) as unknown as AssetListRow[];

  const totals = rows.reduce(
    (acc, a) => {
      acc.total += 1;
      acc.totalValue += Number(a.purchase_price ?? 0);
      acc.bookValue += Number(a.book_value ?? 0);
      switch (a.status) {
        case "available":
          acc.available += 1;
          break;
        case "assigned":
          acc.assigned += 1;
          break;
        case "borrowed":
          acc.borrowed += 1;
          break;
        case "in_repair":
          acc.inRepair += 1;
          break;
        case "lost":
        case "damaged":
          acc.lostDamaged += 1;
          break;
        case "disposed":
          acc.disposed += 1;
          break;
      }
      return acc;
    },
    {
      total: 0,
      totalValue: 0,
      bookValue: 0,
      available: 0,
      assigned: 0,
      borrowed: 0,
      inRepair: 0,
      lostDamaged: 0,
      disposed: 0,
    },
  );

  const catMap = new Map<string, number>();
  for (const a of rows) {
    const key = a.category_name ?? "Uncategorized";
    catMap.set(key, (catMap.get(key) ?? 0) + 1);
  }
  // Ensure every category is represented (even 0)
  for (const c of categories ?? []) {
    if (!catMap.has(c.name)) catMap.set(c.name, 0);
  }
  const byCategory = Array.from(catMap, ([name, value]) => ({ name, value })).sort(
    (a, b) => b.value - a.value,
  );

  const byStatus = (["available", "assigned", "borrowed", "in_repair", "damaged", "lost", "disposed"] as const).map(
    (s) => ({
      name: s.replace("_", " "),
      value: rows.filter((a) => a.status === s).length,
    }),
  );

  const recentAssets = rows.slice(0, 8);

  const now = Date.now();
  const warrantyExpiring = rows
    .filter((a) => {
      if (!a.warranty_end) return false;
      const diff = (new Date(a.warranty_end).getTime() - now) / 86400000;
      return diff > -7 && diff <= 60;
    })
    .sort(
      (a, b) =>
        new Date(a.warranty_end ?? 0).getTime() - new Date(b.warranty_end ?? 0).getTime(),
    )
    .slice(0, 6);

  const { data: overdueAssignments } = await supabase
    .from("asset_assignments")
    .select("id, due_date, assets:asset_id(name, asset_id), user:assigned_to(full_name)")
    .eq("status", "active")
    .not("due_date", "is", null)
    .lt("due_date", new Date().toISOString().slice(0, 10))
    .order("due_date", { ascending: true })
    .limit(8);

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
    }) ?? [];

  // Activity feed: most-recent assignments / transfers / maintenance
  const [{ data: assn }, { data: tr }, { data: mt }] = await Promise.all([
    supabase
      .from("asset_assignments")
      .select("id, created_at, assets:asset_id(name), user:assigned_to(full_name)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("asset_transfers")
      .select(
        "id, created_at, assets:asset_id(name), from:from_location_id(name), to:to_location_id(name)",
      )
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("asset_maintenance")
      .select("id, created_at, description, assets:asset_id(name), status")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

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
    totals,
    byCategory,
    byStatus,
    recentAssets,
    warrantyExpiring,
    overdueReturns,
    recentActivity: activity.slice(0, 10),
  };
}
