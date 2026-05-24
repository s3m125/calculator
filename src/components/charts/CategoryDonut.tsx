"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "#3079ff", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4",
  "#84cc16", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#10b981",
  "#eab308", "#a855f7",
];

export function CategoryDonut({ data }: { data: { name: string; value: number }[] }) {
  const filtered = data.filter((d) => d.value > 0);
  const total = filtered.reduce((s, d) => s + d.value, 0);

  if (filtered.length === 0) {
    return <p className="text-sm text-slate-500">No data</p>;
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filtered}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              stroke="none"
            >
              {filtered.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number) => [v, "Assets"]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">{total}</span>
          <span className="text-[11px] text-slate-500">Total</span>
        </div>
      </div>
      <ul className="flex-1 space-y-1.5 max-h-44 overflow-y-auto pr-1">
        {filtered.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="truncate">{d.name}</span>
            </span>
            <span className="text-slate-500 ml-2">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
