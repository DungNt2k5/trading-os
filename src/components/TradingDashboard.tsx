"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  ArrowUpDown,
} from "lucide-react";
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

interface TradeData {
  id: string;
  title: string;
  pnl: number | null;
  createdAt: string;
  metadata?: string | null;
  category?: string | null;
}

type SortDir = "asc" | "desc";
type TradeFilter = "all" | "win" | "loss";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yy = dt.getFullYear();
  return `${dd}/${mm}/${yy}`;
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

// ── Neon Tooltip (same as FinanceCharts) ─────────────────────────────────────

function NeonTooltip({
  active,
  payload,
  label,
  accentColor = "#22d3ee",
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

// ── Chart Header (same as FinanceCharts) ─────────────────────────────────────

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

// ── Chart Box (same as FinanceCharts) ────────────────────────────────────────

function ChartBox({
  children,
  glowColor = "#22d3ee",
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

// ── PnL Badge ─────────────────────────────────────────────────────────────────

function PnlBadge({ value }: { value: number }) {
  const isUp = value > 0;
  const isFlat = value === 0;
  const color = isFlat ? "#888" : isUp ? "#34d399" : "#f87171";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: "monospace",
        color,
        border: `0.5px solid ${color}40`,
        borderRadius: 5,
        padding: "2px 6px",
        background: isFlat
          ? "rgba(136,136,136,0.1)"
          : isUp
            ? "rgba(52,211,153,0.1)"
            : "rgba(248,113,113,0.1)",
      }}
    >
      {isFlat ? (
        <Minus size={9} />
      ) : isUp ? (
        <TrendingUp size={9} />
      ) : (
        <TrendingDown size={9} />
      )}
      {isUp ? "+" : ""}
      {fmtMoney(value)}
    </span>
  );
}

// ── Trading Charts ────────────────────────────────────────────────────────────

function TradingCharts({
  equityData,
  pnlBarData,
  totalPnl,
  winratePct,
  trades,
}: {
  equityData: { date: string; equity: number; pnl: number }[];
  pnlBarData: { date: string; gain: number; loss: number }[];
  totalPnl: number;
  winratePct: number;
  trades: TradeData[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const wins = trades.filter((t) => (t.pnl ?? 0) > 0).length;
  const losses = trades.filter((t) => (t.pnl ?? 0) < 0).length;
  const avgPnl = trades.length > 0 ? totalPnl / trades.length : 0;
  const lastPnl =
    equityData.length > 0 ? equityData[equityData.length - 1].pnl : 0;

  if (trades.length === 0) return null;

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
            label: "Total PnL",
            value: totalPnl,
            color: totalPnl >= 0 ? "#34d399" : "#f87171",
            sub: totalPnl >= 0 ? "↑ Lãi" : "↓ Lỗ",
          },
          {
            label: "Last Trade",
            value: lastPnl,
            color: lastPnl >= 0 ? "#22d3ee" : "#f87171",
            sub: "Trade gần nhất",
          },
          {
            label: "Win Rate",
            value: winratePct,
            color: "#a855f7",
            sub: `${wins}W / ${losses}L`,
            isPercent: true,
          },
          {
            label: "Avg PnL",
            value: avgPnl,
            color: "#fbbf24",
            sub: `${trades.length} trades`,
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
              {(kpi as { isPercent?: boolean }).isPercent
                ? `${winratePct.toFixed(1)}%`
                : `${kpi.value >= 0 ? "+" : ""}${fmtMoney(kpi.value)}`}
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

      {/* Equity Curve */}
      <ChartBox glowColor="#22d3ee">
        <ChartHeader
          title="EQUITY CURVE"
          subtitle="Đường vốn tích lũy theo thứ tự trade"
          color="#22d3ee"
        />
        <div style={{ height: 200, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart
              data={equityData}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="tdEquityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                  <stop offset="60%" stopColor="#a855f7" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
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
                interval={Math.max(0, Math.floor(equityData.length / 6) - 1)}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)" }}
                axisLine={false}
                tickLine={false}
                width={50}
                tickFormatter={(v) => fmtMoney(v)}
              />
              <Tooltip content={<NeonTooltip accentColor="#22d3ee" />} />
              <Area
                type="monotone"
                dataKey="equity"
                name="Equity"
                stroke="#22d3ee"
                strokeWidth={2}
                fill="url(#tdEquityGrad)"
                dot={false}
                activeDot={{ r: 5, fill: "#22d3ee", strokeWidth: 0 }}
                style={{ filter: "drop-shadow(0 0 4px rgba(34,211,238,0.6))" }}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartBox>

      {/* PnL Bar Chart */}
      <ChartBox glowColor="#34d399">
        <ChartHeader
          title="PNL TỪNG TRADE"
          subtitle={`${pnlBarData.length} trade gần nhất`}
          color="#34d399"
        />
        <div style={{ height: 180, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
              data={pnlBarData}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="tdGainGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="tdLossGrad" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#f87171" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#f87171" stopOpacity={0.4} />
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
              />
              <YAxis
                tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)" }}
                axisLine={false}
                tickLine={false}
                width={50}
                tickFormatter={(v) => fmtMoney(v)}
              />
              <Tooltip
                content={<NeonTooltip accentColor="#34d399" />}
                cursor={{ fill: "rgba(255,255,255,0.03)", stroke: "none" }}
              />
              <Bar
                dataKey="gain"
                name="Win"
                fill="url(#tdGainGrad)"
                radius={[3, 3, 0, 0]}
                style={{ filter: "drop-shadow(0 0 4px rgba(52,211,153,0.5))" }}
                animationDuration={1000}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="loss"
                name="Loss"
                fill="url(#tdLossGrad)"
                radius={[0, 0, 3, 3]}
                style={{ filter: "drop-shadow(0 0 4px rgba(248,113,113,0.5))" }}
                animationDuration={1000}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartBox>
    </div>
  );
}

// ── Trade Table ───────────────────────────────────────────────────────────────

function TradeTable({
  trades,
  sectionId,
}: {
  trades: TradeData[];
  sectionId: string;
}) {
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filter, setFilter] = useState<TradeFilter>("all");

  const sorted = [...trades].sort((a, b) => {
    const da = new Date(a.createdAt).getTime();
    const db = new Date(b.createdAt).getTime();
    return sortDir === "desc" ? db - da : da - db;
  });

  const filtered = sorted.filter((t) => {
    if (filter === "all") return true;
    if (filter === "win") return (t.pnl ?? 0) > 0;
    return (t.pnl ?? 0) < 0;
  });

  const handleExport = () => {
    const header = ["Trade", "Ngày", "PnL", "Kết quả"];
    const rows = filtered.map((t) => [
      t.title,
      fmtDate(t.createdAt),
      t.pnl ?? 0,
      (t.pnl ?? 0) > 0 ? "Win" : (t.pnl ?? 0) < 0 ? "Loss" : "Flat",
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${v}"`).join(","))
      .join("\n");
    downloadCSV(
      csv,
      `trades_${sectionId}_${new Date().toISOString().slice(0, 10)}.csv`,
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
        {(["all", "win", "loss"] as TradeFilter[]).map((f) => {
          const labels: Record<TradeFilter, string> = {
            all: "Tất cả",
            win: "Win",
            loss: "Loss",
          };
          const colors: Record<TradeFilter, string> = {
            all: "#888",
            win: "#34d399",
            loss: "#f87171",
          };
          const isActive = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: isActive ? 600 : 400,
                border: `0.5px solid ${isActive ? colors[f] + "50" : "rgba(255,255,255,0.1)"}`,
                background: isActive ? colors[f] + "15" : "transparent",
                color: isActive ? colors[f] : "rgba(255,255,255,0.4)",
                cursor: "pointer",
              }}
            >
              {labels[f]}
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
            disabled={filtered.length === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 11px",
              borderRadius: 7,
              fontSize: 12,
              border: `0.5px solid ${filtered.length > 0 ? "rgba(34,211,238,0.35)" : "rgba(255,255,255,0.1)"}`,
              background:
                filtered.length > 0 ? "rgba(34,211,238,0.08)" : "transparent",
              color: filtered.length > 0 ? "#22d3ee" : "rgba(255,255,255,0.2)",
              cursor: filtered.length > 0 ? "pointer" : "not-allowed",
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
          {
            label: "Tổng trades",
            value: String(trades.length),
            color: "#22d3ee",
          },
          {
            label: "Win",
            value: String(trades.filter((t) => (t.pnl ?? 0) > 0).length),
            color: "#34d399",
          },
          {
            label: "Loss",
            value: String(trades.filter((t) => (t.pnl ?? 0) < 0).length),
            color: "#f87171",
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
              <th style={thStyle}>Trade</th>
              <th style={thStyle}>Ngày</th>
              <th style={{ ...thStyle, textAlign: "right" }}>PnL</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Kết quả</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
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
            {filtered.map((t, i) => {
              const pnl = t.pnl ?? 0;
              const win = pnl > 0;
              const flat = pnl === 0;
              const resultColor = flat ? "#888" : win ? "#34d399" : "#f87171";
              return (
                <tr
                  key={t.id}
                  style={{
                    borderBottom:
                      i < filtered.length - 1
                        ? "0.5px solid rgba(255,255,255,0.05)"
                        : "none",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "rgba(255,255,255,0.02)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "transparent")
                  }
                >
                  <td
                    style={{
                      padding: "8px 12px",
                      color: "rgba(255,255,255,0.7)",
                      maxWidth: 200,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.title}
                  </td>
                  <td
                    style={{
                      padding: "8px 12px",
                      color: "rgba(255,255,255,0.35)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fmtDate(t.createdAt)}
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "right" }}>
                    <PnlBadge value={pnl} />
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "center" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        color: resultColor,
                        background: resultColor + "15",
                        border: `0.5px solid ${resultColor}40`,
                        borderRadius: 5,
                        padding: "2px 8px",
                      }}
                    >
                      {flat ? (
                        <Minus size={9} />
                      ) : win ? (
                        <TrendingUp size={9} />
                      ) : (
                        <TrendingDown size={9} />
                      )}
                      {flat ? "Flat" : win ? "Win" : "Loss"}
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

export default function TradingDashboard() {
  const { activeSectionId, pages } = useAppStore();
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeSectionId) return;
    setLoading(true);
    fetch(`/api/pages?sectionId=${activeSectionId}`)
      .then((r) => r.json())
      .then((data) => {
        const filtered = (data as TradeData[])
          .filter((p) => p.pnl !== null)
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
        setTrades(filtered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeSectionId, pages]);

  // Equity curve — sort by createdAt asc (đã sort ở trên)
  let cumulative = 0;
  const equityData = trades.map((t) => {
    cumulative += t.pnl ?? 0;
    return {
      date: fmtDateShort(t.createdAt),
      pnl: t.pnl ?? 0,
      equity: parseFloat(cumulative.toFixed(2)),
    };
  });

  // PnL bar — last 20 trades
  const pnlBarData = equityData.slice(-20).map((d) => ({
    date: d.date,
    gain: d.pnl > 0 ? d.pnl : 0,
    loss: d.pnl < 0 ? d.pnl : 0,
  }));

  const totalPnl = trades.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const wins = trades.filter((t) => (t.pnl ?? 0) > 0).length;
  const winratePct = trades.length > 0 ? (wins / trades.length) * 100 : 0;

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
            background: "linear-gradient(135deg,#22d3ee,#a855f7,#f472b6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 4,
          }}
        >
          Trading Dashboard
        </h2>
        <p
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.3)",
            marginBottom: 16,
          }}
        >
          Phân tích hiệu suất giao dịch
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
        ) : trades.length === 0 ? (
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
            <div style={{ fontSize: 36, opacity: 0.1 }}>📈</div>
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
              Chưa có trade nào. Tạo page với trường PnL để bắt đầu!
            </p>
          </div>
        ) : (
          <>
            <TradingCharts
              equityData={equityData}
              pnlBarData={pnlBarData}
              totalPnl={totalPnl}
              winratePct={winratePct}
              trades={trades}
            />
            <TradeTable trades={trades} sectionId={activeSectionId ?? ""} />
          </>
        )}
      </div>

      <style>{`
        @keyframes slideUp { from { transform:translateY(12px); opacity:0; } to { transform:translateY(0); opacity:1; } }
      `}</style>
    </div>
  );
}
