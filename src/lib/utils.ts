export function cn(...inputs: (string | false | null | undefined)[]) {
  return inputs.filter(Boolean).join(" ");
}

export function formatIDR(value: number | null | undefined) {
  if (value == null) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number | null | undefined) {
  if (value == null) return "0";
  return new Intl.NumberFormat("id-ID").format(value);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function daysBetween(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

export const STATUS_STYLES: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700",
  assigned: "bg-blue-100 text-blue-700",
  borrowed: "bg-amber-100 text-amber-700",
  in_repair: "bg-orange-100 text-orange-700",
  lost: "bg-rose-100 text-rose-700",
  damaged: "bg-red-100 text-red-700",
  disposed: "bg-zinc-200 text-zinc-700",
  active: "bg-emerald-100 text-emerald-700",
  returned: "bg-zinc-100 text-zinc-700",
  overdue: "bg-rose-100 text-rose-700",
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  completed: "bg-emerald-100 text-emerald-700",
  requested: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  open: "bg-blue-100 text-blue-700",
  cancelled: "bg-zinc-200 text-zinc-700",
};

export function statusLabel(status?: string | null) {
  if (!status) return "-";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
