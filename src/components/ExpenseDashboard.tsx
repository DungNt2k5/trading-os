"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  Wallet,
  TrendingDown,
  LayoutList,
  Tag,
  ShoppingBag,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ExpensePage {
  id: string;
  title: string;
  amount: number | null;
  category: string | null;
  createdAt: string;
}

// ── Neon colours ──────────────────────────────────────────────────────────────
const BAR_COLORS = [
  "#a855f7",
  "#22d3ee",
  "#f472b6",
  "#fbbf24",
  "#34d399",
  "#818cf8",
  "#fb923c",
  "#2dd4bf",
];

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (active && payload?.length) {
    return (
      <div
        style={{
          background: "rgba(5,5,12,0.97)",
          border: "0.5px solid rgba(244,114,182,0.3)",
          borderRadius: 10,
          padding: "8px 14px",
          boxShadow:
            "0 0 20px rgba(244,114,182,0.15), 0 8px 32px rgba(0,0,0,0.8)",
          backdropFilter: "blur(12px)",
          minWidth: 120,
        }}
      >
        {label && (
          <p
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.35)",
              marginBottom: 4,
              letterSpacing: "0.06em",
            }}
          >
            {label}
          </p>
        )}
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "monospace",
            color: "#f472b6",
          }}
        >
          ${Number(payload[0]?.value ?? 0).toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
}

// ── Category Tooltip ──────────────────────────────────────────────────────────
function CategoryTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; payload: { color?: string } }[];
  label?: string;
}) {
  if (active && payload?.length) {
    const color = payload[0]?.payload?.color ?? "#a855f7";
    return (
      <div
        style={{
          background: "rgba(5,5,12,0.97)",
          border: `0.5px solid ${color}40`,
          borderRadius: 10,
          padding: "8px 14px",
          boxShadow: `0 0 20px ${color}20, 0 8px 32px rgba(0,0,0,0.8)`,
          backdropFilter: "blur(12px)",
        }}
      >
        {label && (
          <p
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.35)",
              marginBottom: 4,
            }}
          >
            {label}
          </p>
        )}
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "monospace",
            color,
          }}
        >
          ${Number(payload[0]?.value ?? 0).toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  border,
  text,
  glow,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  border: string;
  text: string;
  glow: string;
}) {
  return (
    <div
      className={`p-4 rounded-xl border bg-black/40 backdrop-blur-sm flex items-center gap-3 ${border}`}
      style={{ boxShadow: `0 0 18px ${glow}` }}
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${text} bg-white/5`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-white/40 mb-0.5">{label}</p>
        <p className={`text-xl font-bold ${text}`}>{value}</p>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ExpenseDashboard() {
  const { activeSectionId, pages } = useAppStore();
  const [expenses, setExpenses] = useState<ExpensePage[]>([]);

  useEffect(() => {
    if (!activeSectionId) return;
    fetch(`/api/pages?sectionId=${activeSectionId}`)
      .then((r) => r.json())
      .then((data) =>
        setExpenses(data.filter((p: ExpensePage) => p.amount !== null)),
      );
  }, [activeSectionId, pages]);

  const total = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);
  const avg = expenses.length > 0 ? total / expenses.length : 0;

  // Group by category
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    const cat = e.category ?? "Other";
    acc[cat] = (acc[cat] ?? 0) + (e.amount ?? 0);
    return acc;
  }, {});
  const categoryData = Object.entries(byCategory)
    .map(([name, value], i) => ({
      name,
      value,
      color: BAR_COLORS[i % BAR_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  // Group by day
  const byDay = expenses.reduce<Record<string, number>>((acc, e) => {
    const day = new Date(e.createdAt).toLocaleDateString("vi-VN");
    acc[day] = (acc[day] ?? 0) + (e.amount ?? 0);
    return acc;
  }, {});
  const dayData = Object.entries(byDay).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Expense Dashboard
        </h2>
        <p className="text-white/30 text-sm mt-1">Quản lý chi tiêu cá nhân</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Tổng chi tiêu"
          value={`$${total.toFixed(2)}`}
          icon={<Wallet size={18} />}
          border="border-pink-500/30"
          text="text-pink-400"
          glow="rgba(244,114,182,0.08)"
        />
        <StatCard
          label="Số khoản chi"
          value={expenses.length}
          icon={<LayoutList size={18} />}
          border="border-purple-500/30"
          text="text-purple-400"
          glow="rgba(168,85,247,0.08)"
        />
        <StatCard
          label="Trung bình / khoản"
          value={`$${avg.toFixed(2)}`}
          icon={<TrendingDown size={18} />}
          border="border-cyan-500/30"
          text="text-cyan-400"
          glow="rgba(34,211,238,0.08)"
        />
      </div>

      {expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <ShoppingBag size={40} className="text-white/10" />
          <p className="text-white/30 text-sm">
            Chưa có khoản chi nào. Tạo page với trường Amount!
          </p>
        </div>
      ) : (
        <>
          {/* ── Chi tiêu theo ngày ── */}
          <div className="p-5 rounded-xl border border-pink-500/20 bg-black/40 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-pink-400 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.8)]" />
              Chi tiêu theo ngày
            </h3>
            <div style={{ height: 200, minWidth: 0 }}>
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                debounce={50}
              >
                <BarChart data={dayData} style={{ cursor: "default" }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(255,255,255,0.03)", stroke: "none" }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                    fill="#ec4899"
                    style={{
                      filter: "drop-shadow(0 0 4px rgba(244,114,182,0.5))",
                    }}
                    background={false}
                    activeBar={{
                      fill: "#ec4899",
                      fillOpacity: 1,
                      stroke: "none",
                      filter: "drop-shadow(0 0 8px rgba(244,114,182,0.85))",
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Chi tiêu theo danh mục ── */}
          <div className="p-5 rounded-xl border border-purple-500/20 bg-black/40 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-purple-400 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              Chi tiêu theo danh mục
            </h3>
            <div
              style={{
                height: Math.max(180, categoryData.length * 40),
                minWidth: 0,
              }}
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                debounce={50}
              >
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  style={{ cursor: "default" }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                    width={72}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<CategoryTooltip />}
                    cursor={{ fill: "rgba(255,255,255,0.03)", stroke: "none" }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 4, 4, 0]}
                    background={false}
                    activeBar={{ fillOpacity: 1, stroke: "none" }}
                  >
                    {categoryData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.color}
                        style={{
                          filter: `drop-shadow(0 0 4px ${entry.color}80)`,
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Recent expenses — glass table ── */}
          <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
              <Tag size={13} className="text-white/30" />
              <h3 className="text-sm font-semibold text-white/50">
                Recent Expenses
              </h3>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                  <th className="px-5 py-2.5 text-left text-[10px] uppercase tracking-wide text-white/30 font-medium">
                    Mô tả
                  </th>
                  <th className="px-5 py-2.5 text-left text-[10px] uppercase tracking-wide text-white/30 font-medium">
                    Danh mục
                  </th>
                  <th className="px-5 py-2.5 text-left text-[10px] uppercase tracking-wide text-white/30 font-medium">
                    Ngày
                  </th>
                  <th className="px-5 py-2.5 text-right text-[10px] uppercase tracking-wide text-white/30 font-medium">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenses
                  .slice(-10)
                  .reverse()
                  .map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3 text-white/70">{e.title}</td>
                      <td className="px-5 py-3">
                        {e.category ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            {e.category}
                          </span>
                        ) : (
                          <span className="text-white/25">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-white/30">
                        {new Date(e.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums text-pink-400">
                        ${(e.amount ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
