import { cn, statusLabel } from "@/lib/utils";

const STYLES: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  assigned: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  borrowed: "bg-amber-50 text-amber-700 ring-amber-200",
  in_repair: "bg-orange-50 text-orange-700 ring-orange-200",
  lost: "bg-rose-50 text-rose-700 ring-rose-200",
  damaged: "bg-rose-50 text-rose-700 ring-rose-200",
  disposed: "bg-slate-100 text-slate-600 ring-slate-200",

  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  returned: "bg-slate-100 text-slate-600 ring-slate-200",
  overdue: "bg-rose-50 text-rose-700 ring-rose-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  requested: "bg-amber-50 text-amber-700 ring-amber-200",
  in_progress: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  open: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-200",

  found: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  not_found: "bg-rose-50 text-rose-700 ring-rose-200",
  different_location: "bg-amber-50 text-amber-700 ring-amber-200",
};

export function StatusBadge({ status, className }: { status?: string | null; className?: string }) {
  const style = (status && STYLES[status]) || "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-inset whitespace-nowrap",
        style,
        className,
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
