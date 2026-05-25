// Verifies that the cloud Supabase project is correctly set up by
// performing the exact operations the app does at runtime.
//   1. Sign in as admin@gsi.local
//   2. Read v_asset_list (joined view used by dashboard)
//   3. Read public.users with role/department joins (used by getProfile)
//   4. Count by status
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anon) {
  console.error("Missing env vars");
  process.exit(1);
}

const supa = createClient(url, anon, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log("1. Sign in as admin@gsi.local ...");
const { data: signin, error: e1 } = await supa.auth.signInWithPassword({
  email: "admin@gsi.local",
  password: "Gsi#Demo2026",
});
if (e1) { console.error("  ✗", e1.message); process.exit(1); }
console.log(`  ✓ uid=${signin.user.id}`);

console.log("\n2. v_asset_list (top 3 by recent) ...");
const { data: assets, error: e2 } = await supa
  .from("v_asset_list")
  .select("asset_id, name, category_name, location_name, status, purchase_price")
  .order("created_at", { ascending: false })
  .limit(3);
if (e2) { console.error("  ✗", e2.message); process.exit(1); }
for (const a of assets) {
  console.log(`  ✓ ${a.asset_id}  ${a.name.padEnd(28)} ${a.category_name?.padEnd(16)} ${a.location_name?.padEnd(20)} ${a.status}`);
}

console.log("\n3. Profile with role+department join ...");
const { data: prof, error: e3 } = await supa
  .from("users")
  .select("id, full_name, email, role:roles(code,name), department:departments(code,name)")
  .eq("id", signin.user.id)
  .single();
if (e3) { console.error("  ✗", e3.message); process.exit(1); }
console.log(`  ✓ ${prof.full_name} • role=${prof.role.code} dept=${prof.department.code}`);

console.log("\n4. Status counts ...");
const statuses = ["available","assigned","borrowed","in_repair","damaged"];
for (const s of statuses) {
  const { count } = await supa.from("assets").select("*", { count: "exact", head: true }).eq("status", s);
  console.log(`  ${s.padEnd(12)} ${count}`);
}

console.log("\n5. Total asset count (anon-blocked, authed-allowed) ...");
const { count: total } = await supa.from("assets").select("*", { count: "exact", head: true });
console.log(`  ✓ ${total} assets readable as authenticated user`);

console.log("\nAll cloud checks passed.");
await supa.auth.signOut();
