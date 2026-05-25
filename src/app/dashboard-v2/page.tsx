// New dashboard page mirroring the HTML reference at
// C:\Users\ThinkPad\Downloads\gsi-dashboard.html — Plus Jakarta Sans,
// solid-blue active sidebar, 5 stat cards, SVG donut, vertical timeline,
// y-axis bar chart, Quick Actions list. Real data from Supabase.
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import {
  Home,
  LayoutGrid,
  Users,
  ArrowLeftRight,
  Wrench,
  ClipboardList,
  BarChart3,
  Settings as Cog,
  Plus as PlusIcon,
  QrCode,
  UserCheck,
  Search,
  Calendar,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Lock,
  Laptop,
  Printer,
  Video,
  HardDrive,
  Monitor,
  Cpu,
  Car,
  Sofa,
  Tv,
  Package,
  Boxes,
  Network,
  Zap,
  Box,
} from "lucide-react";
import { getProfile, ROLE_CAPABILITIES } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries";
import { DashboardV2Shell } from "./DashboardV2Shell";
import styles from "./DashboardV2.module.css";
import { cn, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const NAV = [
  { href: "/dashboard-v2",  label: "Dashboard",    Icon: Home,           cap: undefined as string | undefined },
  { href: "/assets",        label: "Assets",       Icon: LayoutGrid,     cap: "asset.view" },
  { href: "/assignments",   label: "Assignments",  Icon: Users,          cap: "assignment.manage" },
  { href: "/transfers",     label: "Transfers",    Icon: ArrowLeftRight, cap: "transfer.manage" },
  { href: "/maintenance",   label: "Maintenance",  Icon: Wrench,         cap: "maintenance.manage" },
  { href: "/audit",         label: "Audit",        Icon: ClipboardList,  cap: "audit.manage" },
  { href: "/reports",       label: "Reports",      Icon: BarChart3,      cap: "asset.export" },
  { href: "/settings",      label: "Settings",     Icon: Cog,            cap: undefined },
];

const PREFIX_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  LAP: Laptop,
  PRT: Printer,
  CCTV: Video,
  NVR: HardDrive,
  VTM: Monitor,
  LPR: Cpu,
  TLS: Wrench,
  VHC: Car,
  FRN: Sofa,
  OFE: Tv,
  PJE: Package,
  WHE: Boxes,
  NET: Network,
  GEN: Zap,
};

function statusBadgeClass(status: string | null | undefined) {
  switch (status) {
    case "available": return styles.badgeAvailable;
    case "assigned":  return styles.badgeAssigned;
    case "in_repair":
    case "borrowed":  return styles.badgeMaintenance;
    case "lost":
    case "damaged":   return styles.badgeLost;
    default:          return styles.badgeAssigned;
  }
}

function statusLabel(status: string | null | undefined) {
  if (!status) return "—";
  if (status === "in_repair") return "Maintenance";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const DONUT_COLORS = ["#2563eb", "#16a34a", "#10b981", "#8b5cf6", "#f59e0b", "#cbd5e1"];

function computeDonut(rows: { name: string; value: number }[]) {
  const positive = rows.filter((r) => r.value > 0);
  if (positive.length === 0) return { segments: [], total: 0 };
  // Top 5 categories, lump the rest into "Others"
  const sorted = [...positive].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, 5);
  const restSum = sorted.slice(5).reduce((s, r) => s + r.value, 0);
  const final = restSum > 0 ? [...top, { name: "Others", value: restSum }] : top;
  const total = final.reduce((s, r) => s + r.value, 0);
  let cumulative = 0;
  const segments = final.map((r, i) => {
    const pct = (r.value / total) * 100;
    const offset = 25 - cumulative;
    cumulative += pct;
    return {
      name: r.name,
      value: r.value,
      pct: Math.round(pct * 10) / 10,
      offset: Math.round(offset * 10) / 10,
      color: DONUT_COLORS[i % DONUT_COLORS.length],
    };
  });
  return { segments, total };
}

function formatRangeNow() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return `${fmt(start)} - ${fmt(end)}`;
}

export default async function DashboardV2Page() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const data = await getDashboardData();

  const roleCode = profile.role?.code ?? "employee";
  const caps = ROLE_CAPABILITIES[roleCode] ?? new Set<string>();
  const nav = NAV.filter((n) => !n.cap || caps.has(n.cap));

  const initials = profile.full_name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const total = data.totals.total;
  const pct = (n: number) => (total ? ((n / total) * 100).toFixed(1) : "0.0") + "% of total";

  const { segments, total: donutTotal } = computeDonut(data.byCategory);

  // Bar chart: 4 status buckets
  const bars = [
    { label: "Available",    value: data.totals.available,    color: "#22c55e" },
    { label: "Assigned",     value: data.totals.assigned,     color: "#3b82f6" },
    { label: "Maintenance",  value: data.totals.inRepair,     color: "#f59e0b" },
    { label: "Lost / Damaged", value: data.totals.lostDamaged, color: "#ef4444" },
  ];
  const barMax = Math.max(...bars.map((b) => b.value), 200);
  // Round up to a nice step
  const niceStep = barMax <= 50 ? 10 : barMax <= 100 ? 25 : barMax <= 250 ? 50 : barMax <= 500 ? 100 : barMax <= 1000 ? 200 : 500;
  const niceMax = Math.ceil(barMax / niceStep) * niceStep;
  const ySteps = [niceMax, (niceMax * 3) / 4, niceMax / 2, niceMax / 4, 0];

  // Upcoming counts
  const warrantyCount = data.warrantyExpiring.length;
  const warrantyEarliest = data.warrantyExpiring[0]?.warranty_end ?? null;
  const overdueCount = data.overdueReturns.length;
  const overdueEarliest = data.overdueReturns[0]?.due_date ?? null;
  // "Maintenance Due" surfaces requested/in_progress maintenance count via byStatus
  const maintenanceDue = data.totals.inRepair;

  return (
    <div className={jakarta.className}>
      <DashboardV2Shell
        initials={initials}
        userName={profile.full_name}
        roleLabel={profile.role?.name ?? "User"}
        sidebar={
          <>
            <div className={styles.brand}>
              <span className={styles.brandLogo}>
                GS<span className={styles.brandLogoI}>i</span>
              </span>
              <span className={styles.brandSub}>
                ASSET<br />CONTROL
              </span>
              <span className={styles.brandCollapse}>
                <ChevronLeft />
              </span>
            </div>
            <nav className={styles.nav}>
              {nav.map((item) => {
                const Icon = item.Icon;
                const active = item.href === "/dashboard-v2";
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(styles.navLink, active && styles.navActive)}
                  >
                    <Icon />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </>
        }
        topbar={
          <div className={styles.search}>
            <Search />
            <input placeholder="Search assets, IDs, categories..." readOnly />
          </div>
        }
      >
        {/* Page head */}
        <div className={styles.pageHead}>
          <div>
            <h1>Dashboard</h1>
            <p>Overview of your company assets</p>
          </div>
          <div className={styles.daterange}>
            <Calendar />
            {formatRangeNow()}
            <span className="chev"><ChevronDown style={{ width: 15, height: 15 }} /></span>
          </div>
        </div>

        {/* STAT CARDS */}
        <section className={styles.stats}>
          <StatCard
            tone="blue"
            label="Total Assets"
            value={total.toLocaleString("id-ID")}
            footHref="/assets"
            footLabel="View all"
            Icon={Boxes}
          />
          <StatCard
            tone="green"
            label="Available"
            value={data.totals.available.toLocaleString("id-ID")}
            foot={pct(data.totals.available)}
            Icon={Check}
          />
          <StatCard
            tone="blue2"
            label="Assigned"
            value={data.totals.assigned.toLocaleString("id-ID")}
            foot={pct(data.totals.assigned)}
            Icon={UserCheck}
          />
          <StatCard
            tone="amber"
            label="In Maintenance"
            value={data.totals.inRepair.toLocaleString("id-ID")}
            foot={pct(data.totals.inRepair)}
            Icon={Wrench}
          />
          <StatCard
            tone="red"
            label="Lost / Damaged"
            value={data.totals.lostDamaged.toLocaleString("id-ID")}
            foot={pct(data.totals.lostDamaged)}
            Icon={AlertTriangle}
          />
        </section>

        {/* ROW 3 */}
        <section className={styles.row3}>
          {/* Recent Assets */}
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h3>Recent Assets</h3>
              <Link href="/assets" className="link">View all</Link>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentAssets.slice(0, 5).map((a) => {
                  const prefix = (a.asset_id ?? "").split("-")[0];
                  const Icon = PREFIX_ICON[prefix] ?? Box;
                  return (
                    <tr key={a.id}>
                      <td>
                        <div className={styles.assetCell}>
                          <span className={styles.assetThumb}>
                            <Icon />
                          </span>
                          <Link href={`/assets/${a.id}`} className={styles.aid}>
                            {a.asset_id}
                          </Link>
                        </div>
                      </td>
                      <td>{a.name}</td>
                      <td>{a.category_name ?? "-"}</td>
                      <td>{a.location_name ?? "-"}</td>
                      <td>
                        <span className={cn(styles.badge, statusBadgeClass(a.status))}>
                          {statusLabel(a.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {data.recentAssets.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)" }}>
                      No assets yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className={styles.tableFoot}>
              Showing {Math.min(5, data.recentAssets.length)} of {total.toLocaleString("id-ID")} assets
            </div>
          </div>

          {/* Donut */}
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h3>Assets by Category</h3>
            </div>
            <div className={styles.donutWrap}>
              <div className={styles.donut}>
                <svg viewBox="0 0 42 42" width="140" height="140">
                  <circle cx="21" cy="21" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth={6} />
                  {segments.map((s, i) => (
                    <circle
                      key={i}
                      cx="21"
                      cy="21"
                      r="15.9"
                      fill="none"
                      stroke={s.color}
                      strokeWidth={6}
                      strokeDasharray={`${s.pct} ${100 - s.pct}`}
                      strokeDashoffset={s.offset}
                    />
                  ))}
                </svg>
              </div>
              <div className={styles.legend}>
                {segments.map((s, i) => (
                  <div key={i} className={styles.legendLi}>
                    <span className={styles.legendDot} style={{ background: s.color }} />
                    <span className={styles.legendName}>{s.name}</span>
                    <span className={styles.legendPc}>
                      {s.pct}% ({s.value})
                    </span>
                  </div>
                ))}
                {segments.length === 0 && (
                  <p style={{ fontSize: 12, color: "var(--muted)" }}>No data</p>
                )}
              </div>
            </div>
            <div className={styles.donutTotal}>
              <div className={styles.donutTotalLabel}>Total</div>
              <div className={styles.donutTotalValue}>
                {donutTotal.toLocaleString("id-ID")} Assets
              </div>
            </div>
          </div>

          {/* Upcoming */}
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h3>Upcoming</h3>
            </div>
            <div className={styles.upItem}>
              <span className={styles.upIco} style={{ background: "#f3eefe", color: "#8b5cf6" }}>
                <Lock />
              </span>
              <div>
                <div className={styles.upName}>Warranty Expiring</div>
                <div className={styles.upSub}>
                  {warrantyCount} asset{warrantyCount === 1 ? "" : "s"}
                </div>
              </div>
              <div className={styles.upDate} style={{ color: "#8b5cf6" }}>
                {warrantyEarliest ? formatDate(warrantyEarliest) : "—"}
              </div>
            </div>
            <div className={styles.upItem}>
              <span className={styles.upIco} style={{ background: "#fef3e2", color: "#f59e0b" }}>
                <Wrench />
              </span>
              <div>
                <div className={styles.upName}>Maintenance Due</div>
                <div className={styles.upSub}>
                  {maintenanceDue} asset{maintenanceDue === 1 ? "" : "s"}
                </div>
              </div>
              <div className={styles.upDate} style={{ color: "#f59e0b" }}>
                Ongoing
              </div>
            </div>
            <div className={styles.upItem}>
              <span className={styles.upIco} style={{ background: "#eff4ff", color: "#2563eb" }}>
                <ClipboardList />
              </span>
              <div>
                <div className={styles.upName}>Overdue Return</div>
                <div className={styles.upSub}>
                  {overdueCount} asset{overdueCount === 1 ? "" : "s"}
                </div>
              </div>
              <div className={styles.upDate} style={{ color: "#ef4444" }}>
                {overdueEarliest ? formatDate(overdueEarliest) : "—"}
              </div>
            </div>
            <Link href="/assets" className={styles.btnGhost} style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
              View all upcoming
            </Link>
          </div>
        </section>

        {/* BOTTOM ROW */}
        <section className={styles.rowB}>
          {/* Recent Activity */}
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h3>Recent Activity</h3>
            </div>
            {data.recentActivity.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--muted)" }}>No activity yet.</p>
            ) : (
              data.recentActivity.slice(0, 4).map((a, i) => {
                const pinColor = i % 3 === 0 ? "#2563eb" : i % 3 === 1 ? "#f59e0b" : "#16a34a";
                return (
                  <div key={a.id} className={styles.act}>
                    <span className={styles.actPin} style={{ background: pinColor }} />
                    <div className={styles.actBody}>
                      <div className={styles.actTop}>
                        <span className={styles.actName}>{a.title}</span>
                        <span className={styles.actAgo}>{relativeTime(a.when)}</span>
                      </div>
                      <div className={styles.actBy}>{a.detail}</div>
                    </div>
                  </div>
                );
              })
            )}
            <Link href="/assets" className={styles.viewAll}>View all activity</Link>
          </div>

          {/* Bar chart */}
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h3>Asset Status Overview</h3>
            </div>
            <div className={styles.bars}>
              <div className={styles.yaxis}>
                {ySteps.map((y, i) => (
                  <span key={i}>{Math.round(y).toLocaleString("id-ID")}</span>
                ))}
              </div>
              {bars.map((b) => {
                const h = niceMax === 0 ? 0 : (b.value / niceMax) * 100;
                return (
                  <div key={b.label} className={styles.barCol}>
                    <span className={styles.barVal}>{b.value}</span>
                    <div
                      className={styles.bar}
                      style={{ height: `${Math.max(h, 1)}%`, background: b.color }}
                    />
                    <span className={styles.barLbl}>{b.label}</span>
                  </div>
                );
              })}
            </div>
            <select className={styles.select} defaultValue="This Month">
              <option>This Month</option>
              <option>Last Month</option>
              <option>This Year</option>
            </select>
          </div>

          {/* Quick Actions */}
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h3>Quick Actions</h3>
            </div>
            <QuickAction href="/assets/new" Icon={PlusIcon} label="Add New Asset" />
            <QuickAction href="/scan" Icon={QrCode} label="Scan QR Code" />
            <QuickAction href="/assignments/new" Icon={UserCheck} label="Assign Asset" />
            <QuickAction href="/maintenance/new" Icon={Wrench} label="Request Maintenance" />
            <QuickAction href="/audit/new" Icon={ClipboardList} label="Start Audit" />
          </div>
        </section>
      </DashboardV2Shell>
    </div>
  );
}

function StatCard({
  tone,
  label,
  value,
  foot,
  footHref,
  footLabel,
  Icon,
}: {
  tone: "blue" | "green" | "blue2" | "amber" | "red";
  label: string;
  value: React.ReactNode;
  foot?: string;
  footHref?: string;
  footLabel?: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  const toneCls = {
    blue: styles.icoBlue,
    green: styles.icoGreen,
    blue2: styles.icoBlue2,
    amber: styles.icoAmber,
    red: styles.icoRed,
  }[tone];
  return (
    <div className={styles.stat}>
      <div className={styles.statRow}>
        <div className={cn(styles.ico, toneCls)}>
          <Icon />
        </div>
        <div>
          <div className={styles.statLabel}>{label}</div>
          <div className={styles.statNum}>{value}</div>
        </div>
      </div>
      {footHref && footLabel ? (
        <div className={styles.statFoot}>
          <Link href={footHref} className={styles.statFootLink}>
            {footLabel} <ChevronRight />
          </Link>
        </div>
      ) : (
        <div className={styles.statFoot}>{foot}</div>
      )}
    </div>
  );
}

function QuickAction({
  href,
  Icon,
  label,
}: {
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link href={href} className={styles.qa}>
      <span className={styles.qaIco}>
        <Icon />
      </span>
      <span className={styles.qaName}>{label}</span>
      <span className={styles.qaArr}>
        <ChevronRight />
      </span>
    </Link>
  );
}

function relativeTime(iso: string) {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min${min === 1 ? "" : "s"} ago`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

// Tiny inline icons (kept here to avoid extra lucide imports)
function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function AlertTriangle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}
