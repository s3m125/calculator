import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  trend?: { value: number; positive?: boolean };
}

const TONES: Record<NonNullable<StatCardProps["tone"]>, { bg: string; fg: string }> = {
  default: { bg: "bg-slate-100",   fg: "text-slate-700" },
  success: { bg: "bg-emerald-50",  fg: "text-emerald-600" },
  warning: { bg: "bg-amber-50",    fg: "text-amber-600" },
  danger:  { bg: "bg-rose-50",     fg: "text-rose-600" },
  info:    { bg: "bg-indigo-50",   fg: "text-indigo-600" },
};

export function StatCard({ label, value, helper, icon: Icon, tone = "default", trend }: StatCardProps) {
  const t = TONES[tone];
  const positive = trend?.positive ?? (trend ? trend.value >= 0 : false);
  return (
    <div className="rounded-xl bg-white border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-5">
      <div className="flex items-center justify-between">
        {Icon && (
          <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", t.bg, t.fg)}>
            <Icon className="h-[18px] w-[18px]" />
          </div>
        )}
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-semibold",
              positive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600",
            )}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend.value).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-[13px] font-medium text-slate-500 mt-4">{label}</p>
      <p className="text-[28px] font-bold text-slate-900 mt-0.5 leading-none tabular-nums">{value}</p>
      {helper && <p className="text-[11px] text-slate-400 mt-2">{helper}</p>}
    </div>
  );
}
