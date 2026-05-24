import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { UserProfile } from "@/lib/supabase/types";

export async function getSessionUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function getProfile(): Promise<UserProfile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("users")
    .select(
      "id, full_name, email, role_id, department_id, position, status, role:roles(code,name), department:departments(code,name)",
    )
    .eq("id", user.id)
    .maybeSingle();
  if (!data) {
    return {
      id: user.id,
      full_name: user.email ?? "User",
      email: user.email ?? "",
      role_id: null,
      department_id: null,
      position: null,
      status: "active",
      role: null,
      department: null,
    };
  }
  return data as unknown as UserProfile;
}

export async function requireProfile() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return profile;
}

// Coarse permission map per role for UI guards
export const ROLE_CAPABILITIES: Record<string, Set<string>> = {
  super_admin: new Set([
    "asset.view","asset.create","asset.edit","asset.delete","asset.export",
    "assignment.manage","transfer.manage","maintenance.manage",
    "audit.manage","audit.scan","approval.approve","finance.view","user.manage",
  ]),
  asset_admin: new Set([
    "asset.view","asset.create","asset.edit","asset.delete","asset.export",
    "assignment.manage","transfer.manage","maintenance.manage",
    "audit.manage","audit.scan",
  ]),
  finance: new Set(["asset.view","asset.export","finance.view"]),
  purchasing: new Set(["asset.view","asset.create","asset.export"]),
  warehouse: new Set([
    "asset.view","asset.edit","asset.export",
    "assignment.manage","transfer.manage","audit.scan","audit.manage",
  ]),
  project_mgr: new Set([
    "asset.view","asset.export","assignment.manage",
    "transfer.manage","maintenance.manage","approval.approve",
  ]),
  technician: new Set(["asset.view","maintenance.manage","audit.scan"]),
  employee: new Set(["asset.view"]),
  ceo_viewer: new Set(["asset.view","asset.export","finance.view"]),
};

export function can(roleCode: string | null | undefined, capability: string) {
  if (!roleCode) return false;
  return ROLE_CAPABILITIES[roleCode]?.has(capability) ?? false;
}
