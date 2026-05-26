// Cached lookups for tables that change rarely (categories, locations,
// departments, projects, suppliers, roles). Each lookup is wrapped in
// unstable_cache with a 5-minute revalidate window so repeated visits to
// /assets/new, /assignments/new, /transfers/new etc. don't refetch.
//
// Note: unstable_cache hashes its arguments; we pass none.
import "server-only";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const FIVE_MIN = 300;

export const getCategoriesFull = unstable_cache(
  async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("asset_categories")
      .select("id, code, name, prefix, useful_life_years, description")
      .order("name");
    return data ?? [];
  },
  ["lookup:categories:full"],
  { revalidate: FIVE_MIN, tags: ["lookups", "categories"] },
);

export const getCategoriesLite = unstable_cache(
  async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("asset_categories")
      .select("id, code, name")
      .order("name");
    return data ?? [];
  },
  ["lookup:categories:lite"],
  { revalidate: FIVE_MIN, tags: ["lookups", "categories"] },
);

export const getLocations = unstable_cache(
  async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("asset_locations")
      .select("id, code, name, type, pic_name")
      .order("name");
    return data ?? [];
  },
  ["lookup:locations"],
  { revalidate: FIVE_MIN, tags: ["lookups", "locations"] },
);

export const getDepartments = unstable_cache(
  async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("departments")
      .select("id, code, name, manager_name")
      .order("name");
    return data ?? [];
  },
  ["lookup:departments"],
  { revalidate: FIVE_MIN, tags: ["lookups", "departments"] },
);

export const getProjects = unstable_cache(
  async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("projects")
      .select("id, code, name, client_name, status")
      .order("name");
    return data ?? [];
  },
  ["lookup:projects"],
  { revalidate: FIVE_MIN, tags: ["lookups", "projects"] },
);

export const getSuppliers = unstable_cache(
  async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("suppliers")
      .select("id, code, name, contact_name, phone, email")
      .order("name");
    return data ?? [];
  },
  ["lookup:suppliers"],
  { revalidate: FIVE_MIN, tags: ["lookups", "suppliers"] },
);

export const getActiveUsers = unstable_cache(
  async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("users")
      .select("id, full_name")
      .eq("status", "active")
      .order("full_name");
    return data ?? [];
  },
  ["lookup:active-users"],
  { revalidate: FIVE_MIN, tags: ["lookups", "users"] },
);
