import { redirect } from "next/navigation";
import { getProfile, ROLE_CAPABILITIES } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const roleCode = profile.role?.code ?? "employee";
  const capabilities = Array.from(ROLE_CAPABILITIES[roleCode] ?? new Set<string>());

  return (
    <AppShell
      userName={profile.full_name}
      roleName={profile.role?.name ?? "Employee"}
      capabilities={capabilities}
    >
      {children}
    </AppShell>
  );
}
