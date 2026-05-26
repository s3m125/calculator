import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import {
  getCategoriesFull,
  getLocations,
  getDepartments,
  getProjects,
  getSuppliers,
} from "@/lib/lookups";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createClient();
  const profile = await getProfile();

  // Parallel: cached lookups + (uncached) users join.
  const [cats, locs, deps, projs, sups, usersResp] = await Promise.all([
    getCategoriesFull(),
    getLocations(),
    getDepartments(),
    getProjects(),
    getSuppliers(),
    supabase
      .from("users")
      .select("full_name, email, status, role:role_id(name), department:department_id(name)")
      .order("full_name"),
  ]);
  const users = usersResp.data ?? [];

  return (
    <>
      <PageHeader title="Settings" description={`Logged in as ${profile?.full_name} (${profile?.role?.name})`} />

      <div className="grid gap-4 md:grid-cols-2">
        <Table title="Categories" headers={["Code", "Name", "Prefix", "Useful Life"]} rows={cats.map((c) => [c.code, c.name, c.prefix, `${c.useful_life_years}y`])} />
        <Table title="Locations" headers={["Code", "Name", "Type", "PIC"]} rows={locs.map((l) => [l.code, l.name, l.type, l.pic_name ?? "-"])} />
        <Table title="Departments" headers={["Code", "Name", "Manager"]} rows={deps.map((d) => [d.code, d.name, d.manager_name ?? "-"])} />
        <Table title="Projects" headers={["Code", "Name", "Client", "Status"]} rows={projs.map((p) => [p.code, p.name, p.client_name ?? "-", p.status])} />
        <Table title="Suppliers" headers={["Code", "Name", "Contact", "Phone"]} rows={sups.map((s) => [s.code, s.name, s.contact_name ?? "-", s.phone ?? "-"])} />
        <Table
          title="Users"
          headers={["Name", "Email", "Role", "Department", "Status"]}
          rows={users.map((u) => {
            const role = u.role as unknown as { name: string } | null;
            const dept = u.department as unknown as { name: string } | null;
            return [u.full_name, u.email, role?.name ?? "-", dept?.name ?? "-", u.status];
          })}
        />
      </div>
    </>
  );
}

function Table({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: (string | number | null)[][];
}) {
  return (
    <section className="card overflow-hidden">
      <h3 className="px-5 pt-4 pb-2 font-semibold">{title}</h3>
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead className="bg-slate-50">
            <tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={headers.length} className="text-center text-slate-500 py-6">No records</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => <td key={j}>{c ?? "-"}</td>)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
