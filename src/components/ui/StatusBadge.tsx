import { cn, STATUS_STYLES, statusLabel } from "@/lib/utils";

export function StatusBadge({ status, className }: { status?: string | null; className?: string }) {
  const style = (status && STATUS_STYLES[status]) || "bg-slate-100 text-slate-700";
  return <span className={cn("badge", style, className)}>{statusLabel(status)}</span>;
}
