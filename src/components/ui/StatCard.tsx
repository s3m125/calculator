import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}

const TONES: Record<NonNullable<StatCardProps["tone"]>, { bg: string; fg: string }> = {
  default: { bg: "bg-slate-100", fg: "text-slate-700" },
  success: { bg: "bg-emerald-100", fg: "text-emerald-700" },
  warning: { bg: "bg-amber-100", fg: "text-amber-700" },
  danger:  { bg: "bg-rose-100",   fg: "text-rose-700" },
  info:    { bg: "bg-brand-100",  fg: "text-brand-700" },
};

export function StatCard({ label, value, helper, icon: Icon, tone = "default" }: StatCardProps) {
  const t = TONES[tone];
  return (
    <div className="card p-5 flex items-start gap-4">
      {Icon && (
        <div className={cn("h-11 w-11 rounded-lg flex items-center justify-center", t.bg, t.fg)}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1 truncate">{value}</p>
        {helper && <p className="text-xs text-slate-500 mt-1">{helper}</p>}
      </div>
    </div>
  );
}
