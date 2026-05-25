"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4",
  "#84cc16", "#ec4899", "#14b8a6", "#f97316", "#3b82f6", "#10b981",
  "#eab308", "#a855f7",
];

export function CategoryDonut({ data }: { data: { name: string; value: number }[] }) {
  const filtered = data.filter((d) => d.value > 0);
  const total = filtered.reduce((s, d) => s + d.value, 0);

  if (filtered.length === 0) {
    return <p className="text-sm text-slate-500">No data</p>;
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-44 w-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filtered}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={2}
              stroke="none"
            >
              {filtered.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number, name: string) => [v, name]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900 leading-none">{total}</span>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 mt-1">
            Total Assets
          </span>
        </div>
      </div>
      <ul className="mt-4 w-full grid grid-cols-2 gap-x-3 gap-y-1.5 max-h-32 overflow-y-auto">
        {filtered.slice(0, 8).map((d, i) => (
          <li key={d.name} className="flex items-center justify-between text-[12px]">
            <span className="flex items-center gap-1.5 min-w-0">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="truncate text-slate-600">{d.name}</span>
            </span>
            <span className="text-slate-400 ml-1.5 tabular-nums">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
