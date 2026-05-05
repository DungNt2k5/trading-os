"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Download, ArrowUpDown } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExpensePage {
  id: string;
  title: string;
  amount: number | null;
  category: string | null;
  createdAt: string;
}

type SortDir = "asc" | "desc";

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
}

function fmtDateShort(d: string) {
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}`;
}

function fmtMoney(n: number) {
  if (Math.abs(n) >= 1_000_000)
    return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (Math.abs(n) >= 1_000)
    return (n / 1_000).toFixed(1).replace(/\.?0+$/, "") + "K";
  return n.toLocaleString("vi-VN");
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob(["\uFEFF" + content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Neon Tooltip ──────────────────────────────────────────────────────────────

function NeonTooltip({
  active,
  payload,
  label,
  accentColor = "#f472b6",
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  accentColor?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(5,5,12,0.97)",
        border: `0.5px solid ${accentColor}40`,
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: `0 0 20px ${accentColor}20, 0 8px 32px rgba(0,0,0,0.8)`,
        backdropFilter: "blur(12px)",
        minWidth: 130,
      }}
    >
      {label && (
        <div
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.35)",
            marginBottom: 6,
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </div>
      )}
      {payload.map((p, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginBottom: i < payload.length - 1 ? 4 : 0,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: p.color,
              flexShrink: 0,
              boxShadow: `0 0 6px ${p.color}`,
            }}
          />
          <span
            style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", flex: 1 }}
          >
            {p.name}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "monospace",
              color: p.color,
            }}
          >
            {fmtMoney(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Chart Header ──────────────────────────────────────────────────────────────

function ChartHeader({
  title,
  subtitle,
  color,
}: {
  title: string;
  subtitle?: string;
  color: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            display: "inline-block",
            width: 3,
            height: 16,
            borderRadius: 2,
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "rgba(255,255,255,0.8)",
            letterSpacing: "0.04em",
          }}
        >
          {title}
        </span>
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.25)",
            marginTop: 3,
            marginLeft: 11,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}

// ── Chart Box ─────────────────────────────────────────────────────────────────

function ChartBox({
  children,
  glowColor = "#f472b6",
}: {
  children: React.ReactNode;
  glowColor?: string;
}) {
  return (
    <div
      style={{
        background: "rgba(6,6,14,0.7)",
        border: `0.5px solid ${glowColor}20`,
        borderRadius: 14,
        padding: "18px 20px",
        position: "relative",
        overflow: "hidden",
        backdropFilter: "blur(8px)",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 40,
          height: 40,
          background: `radial-gradient(circle at 0% 0%, ${glowColor}15 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <span
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 60,
          height: 60,
          background: `radial-gradient(circle at 100% 100%, ${glowColor}08 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      {children}
    </div>
  );
}

// ── Expense Charts ────────────────────────────────────────────────────────────

function ExpenseCharts({ expenses }: { expenses: ExpensePage[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (expenses.length === 0) return null;

  const total = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);
  const avg = expenses.length > 0 ? total / expenses.length : 0;
  const maxExpense = Math.max(...expenses.map((e) => e.amount ?? 0));
  const topExpense = expenses.find((e) => e.amount === maxExpense);

  // Cumulative area chart (sorted by date asc)
  const sorted = [...expenses].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  let cumulative = 0;
  const cumulativeData = sorted.map((e) => {
    cumulative += e.amount ?? 0;
    return {
      date: fmtDateShort(e.createdAt),
      amount: e.amount ?? 0,
      total: parseFloat(cumulative.toFixed(2)),
    };
  });

  // Category bar chart
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
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div
      style={{
        display: "grid",
        gap: 14,
        marginBottom: 20,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(16px)",
        transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {/* KPI Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 10,
        }}
      >
        {[
          {
            label: "Tổng chi tiêu",
            value: total,
            color: "#f472b6",
            sub: `${expenses.length} khoản`,
          },
          {
            label: "Trung bình / khoản",
            value: avg,
            color: "#a855f7",
            sub: "Mỗi giao dịch",
          },
          {
            label: "Chi tiêu lớn nhất",
            value: maxExpense,
            color: "#fbbf24",
            sub: topExpense?.title?.slice(0, 16) ?? "—",
          },
          {
            label: "Danh mục",
            value: Object.keys(byCategory).length,
            color: "#22d3ee",
            sub: "Phân loại",
            isCount: true,
          },
        ].map((kpi, i) => (
          <div
            key={i}
            style={{
              background: `linear-gradient(135deg, ${kpi.color}08 0%, rgba(0,0,0,0) 60%)`,
              border: `0.5px solid ${kpi.color}25`,
              borderRadius: 12,
              padding: "12px 16px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 6,
              }}
            >
              {kpi.label}
            </div>
            <div
              style={{
                fontSize: 18,
                lineHeight: 1,
                fontFamily: "monospace",
                fontWeight: 700,
                color: kpi.color,
              }}
            >
              {(kpi as { isCount?: boolean }).isCount
                ? kpi.value
                : fmtMoney(kpi.value as number)}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.25)",
                marginTop: 4,
              }}
            >
              {kpi.sub}
            </div>
            <span
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: kpi.color,
                boxShadow: `0 0 8px ${kpi.color}, 0 0 16px ${kpi.color}60`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Cumulative Spending Curve */}
      <ChartBox glowColor="#f472b6">
        <ChartHeader
          title="CHI TIÊU TÍCH LŨY"
          subtitle="Tổng chi tiêu theo thời gian"
          color="#f472b6"
        />
        <div style={{ height: 200, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart
              data={cumulativeData}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="expCumGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f472b6" stopOpacity={0.35} />
                  <stop offset="60%" stopColor="#a855f7" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#f472b6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)" }}
                axisLine={false}
                tickLine={false}
                interval={Math.max(
                  0,
                  Math.floor(cumulativeData.length / 6) - 1,
                )}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)" }}
                axisLine={false}
                tickLine={false}
                width={50}
                tickFormatter={(v) => fmtMoney(v)}
              />
              <Tooltip content={<NeonTooltip accentColor="#f472b6" />} />
              <Area
                type="monotone"
                dataKey="total"
                name="Tổng"
                stroke="#f472b6"
                strokeWidth={2}
                fill="url(#expCumGrad)"
                dot={false}
                activeDot={{ r: 5, fill: "#f472b6", strokeWidth: 0 }}
                style={{ filter: "drop-shadow(0 0 4px rgba(244,114,182,0.6))" }}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartBox>

      {/* Category Bar Chart */}
      <ChartBox glowColor="#a855f7">
        <ChartHeader
          title="CHI TIÊU THEO DANH MỤC"
          subtitle="Top danh mục"
          color="#a855f7"
        />
        <div
          style={{
            height: Math.max(200, categoryData.length * 38),
            minWidth: 0,
          }}
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
              data={categoryData}
              layout="vertical"
              margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => fmtMoney(v)}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "rgba(255,255,255,0.55)" }}
                axisLine={false}
                tickLine={false}
                width={72}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.03)", stroke: "none" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as {
                    name: string;
                    value: number;
                    color: string;
                  };
                  return (
                    <div
                      style={{
                        background: "rgba(5,5,12,0.97)",
                        border: `0.5px solid ${d.color}40`,
                        borderRadius: 8,
                        padding: "8px 12px",
                        boxShadow: `0 0 16px ${d.color}20`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: d.color,
                          marginBottom: 4,
                        }}
                      >
                        {d.name}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontFamily: "monospace",
                          fontWeight: 700,
                          color: d.color,
                        }}
                      >
                        {fmtMoney(d.value)}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "rgba(255,255,255,0.3)",
                          marginTop: 2,
                        }}
                      >
                        {((d.value / total) * 100).toFixed(1)}%
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="value"
                name="Chi tiêu"
                radius={[0, 4, 4, 0]}
                animationDuration={1200}
                animationEasing="ease-out"
                background={false}
                activeBar={{ fillOpacity: 1, stroke: "none" }}
              >
                {categoryData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.color}
                    style={{ filter: `drop-shadow(0 0 3px ${entry.color}60)` }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartBox>
    </div>
  );
}

// ── Expense Table ─────────────────────────────────────────────────────────────

function ExpenseTable({
  expenses,
  sectionId,
}: {
  expenses: ExpensePage[];
  sectionId: string;
}) {
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterCat, setFilterCat] = useState("all");

  const categories = [
    "all",
    ...Array.from(new Set(expenses.map((e) => e.category ?? "Other"))),
  ];

  const sorted = [...expenses]
    .filter((e) => filterCat === "all" || (e.category ?? "Other") === filterCat)
    .sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortDir === "desc" ? db - da : da - db;
    });

  const handleExport = () => {
    const header = ["Mô tả", "Danh mục", "Ngày", "Số tiền"];
    const rows = sorted.map((e) => [
      e.title,
      e.category ?? "",
      fmtDate(e.createdAt),
      e.amount ?? 0,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${v}"`).join(","))
      .join("\n");
    downloadCSV(
      csv,
      `expenses_${sectionId}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
  };

  const thStyle: React.CSSProperties = {
    padding: "8px 12px",
    fontSize: 10,
    fontWeight: 600,
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    textAlign: "left",
    borderBottom: "0.5px solid rgba(255,255,255,0.08)",
    background: "rgba(8,8,14,0.8)",
    whiteSpace: "nowrap",
  };

  const total = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);
  const avgAmount = expenses.length > 0 ? total / expenses.length : 0;

  return (
    <div>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        {categories.slice(0, 6).map((cat) => {
          const isActive = filterCat === cat;
          return (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: isActive ? 600 : 400,
                border: `0.5px solid ${isActive ? "rgba(244,114,182,0.5)" : "rgba(255,255,255,0.1)"}`,
                background: isActive ? "rgba(244,114,182,0.15)" : "transparent",
                color: isActive ? "#f472b6" : "rgba(255,255,255,0.4)",
                cursor: "pointer",
              }}
            >
              {cat === "all" ? "Tất cả" : cat}
            </button>
          );
        })}

        <button
          onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 10px",
            borderRadius: 6,
            fontSize: 11,
            border: "0.5px solid rgba(255,255,255,0.1)",
            background: "transparent",
            color: "rgba(255,255,255,0.4)",
            cursor: "pointer",
          }}
        >
          <ArrowUpDown size={10} />
          {sortDir === "desc" ? "Mới nhất" : "Cũ nhất"}
        </button>

        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={handleExport}
            disabled={sorted.length === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 11px",
              borderRadius: 7,
              fontSize: 12,
              border: `0.5px solid ${sorted.length > 0 ? "rgba(244,114,182,0.35)" : "rgba(255,255,255,0.1)"}`,
              background:
                sorted.length > 0 ? "rgba(244,114,182,0.08)" : "transparent",
              color: sorted.length > 0 ? "#f472b6" : "rgba(255,255,255,0.2)",
              cursor: sorted.length > 0 ? "pointer" : "not-allowed",
            }}
          >
            <Download size={12} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 10,
          marginBottom: 14,
        }}
      >
        {[
          { label: "Tổng chi tiêu", value: fmtMoney(total), color: "#f472b6" },
          { label: "Trung bình", value: fmtMoney(avgAmount), color: "#a855f7" },
          {
            label: "Số khoản",
            value: String(expenses.length),
            color: "#22d3ee",
          },
        ].map((c) => (
          <div
            key={c.label}
            style={{
              padding: "10px 14px",
              borderRadius: 9,
              background: "rgba(0,0,0,0.3)",
              border: `0.5px solid ${c.color}25`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.3)",
                marginBottom: 2,
              }}
            >
              {c.label}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily: "monospace",
                color: c.color,
              }}
            >
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div
        style={{
          borderRadius: 10,
          border: "0.5px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
        >
          <thead>
            <tr>
              <th style={thStyle}>Mô tả</th>
              <th style={thStyle}>Danh mục</th>
              <th style={thStyle}>Ngày</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Số tiền</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    textAlign: "center",
                    padding: 32,
                    color: "rgba(255,255,255,0.15)",
                    fontSize: 13,
                  }}
                >
                  Không có dữ liệu
                </td>
              </tr>
            )}
            {sorted.map((e, i) => {
              const catColor =
                BAR_COLORS[
                  categories.indexOf(e.category ?? "Other") % BAR_COLORS.length
                ] ?? "#a855f7";
              return (
                <tr
                  key={e.id}
                  style={{
                    borderBottom:
                      i < sorted.length - 1
                        ? "0.5px solid rgba(255,255,255,0.05)"
                        : "none",
                  }}
                  onMouseEnter={(ev) =>
                    ((ev.currentTarget as HTMLElement).style.background =
                      "rgba(255,255,255,0.02)")
                  }
                  onMouseLeave={(ev) =>
                    ((ev.currentTarget as HTMLElement).style.background =
                      "transparent")
                  }
                >
                  <td
                    style={{
                      padding: "8px 12px",
                      color: "rgba(255,255,255,0.7)",
                      maxWidth: 240,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {e.title}
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    {e.category ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          fontSize: 10,
                          fontWeight: 600,
                          color: catColor,
                          background: catColor + "15",
                          border: `0.5px solid ${catColor}40`,
                          borderRadius: 5,
                          padding: "2px 8px",
                        }}
                      >
                        {e.category}
                      </span>
                    ) : (
                      <span
                        style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}
                      >
                        —
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "8px 12px",
                      color: "rgba(255,255,255,0.35)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fmtDate(e.createdAt)}
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "right" }}>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 700,
                        fontSize: 13,
                        color: "#f472b6",
                      }}
                    >
                      {fmtMoney(e.amount ?? 0)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ExpenseDashboard() {
  const { activeSectionId, pages } = useAppStore();
  const [expenses, setExpenses] = useState<ExpensePage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeSectionId) return;
    setLoading(true);
    fetch(`/api/pages?sectionId=${activeSectionId}`)
      .then((r) => r.json())
      .then((data) => {
        setExpenses((data as ExpensePage[]).filter((p) => p.amount !== null));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeSectionId, pages]);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 24px 0",
          borderBottom: "0.5px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            background: "linear-gradient(135deg,#f472b6,#a855f7,#22d3ee)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 4,
          }}
        >
          Expense Dashboard
        </h2>
        <p
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.3)",
            marginBottom: 16,
          }}
        >
          Quản lý chi tiêu cá nhân
        </p>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "visible",
          padding: "20px 24px",
        }}
      >
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 200,
              color: "rgba(255,255,255,0.2)",
              fontSize: 13,
            }}
          >
            Đang tải...
          </div>
        ) : expenses.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: 200,
              gap: 8,
            }}
          >
            <div style={{ fontSize: 36, opacity: 0.1 }}>🛍️</div>
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
              Chưa có khoản chi nào. Tạo page với trường Amount để bắt đầu!
            </p>
          </div>
        ) : (
          <>
            <ExpenseCharts expenses={expenses} />
            <ExpenseTable
              expenses={expenses}
              sectionId={activeSectionId ?? ""}
            />
          </>
        )}
      </div>

      <style>{`
        @keyframes slideUp { from { transform:translateY(12px); opacity:0; } to { transform:translateY(0); opacity:1; } }
      `}</style>
    </div>
  );
}
