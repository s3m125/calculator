"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  available: "#22c55e",
  assigned: "#6366f1",
  borrowed: "#f59e0b",
  in_repair: "#f97316",
  damaged: "#ef4444",
  lost: "#dc2626",
  disposed: "#94a3b8",
};

export function StatusBarChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barCategoryGap={18}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(s: string) => s.replace(/_/g, " ")}
        />
        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: "#f1f5f9" }}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
          labelFormatter={(s: string) => s.replace(/_/g, " ")}
        />
        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={STATUS_COLORS[d.name.replace(/ /g, "_")] ?? "#6366f1"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
