"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart2,
  Activity,
  Minus,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface TradeData {
  id: string;
  title: string;
  pnl: number | null;
  createdAt: string;
}

// ── Winrate Ring (SVG) ────────────────────────────────────────────────────────
function WinrateRing({ value }: { value: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const filled = (value / 100) * circ;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="flex-shrink-0">
      {/* track */}
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="rgba(168,85,247,0.15)"
        strokeWidth="5"
      />
      {/* fill */}
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="#a855f7"
        strokeWidth="5"
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
        style={{ filter: "drop-shadow(0 0 4px #a855f7)" }}
      />
      <text
        x="36"
        y="40"
        textAnchor="middle"
        fill="#a855f7"
        fontSize="13"
        fontWeight="700"
      >
        {value.toFixed(0)}%
      </text>
    </svg>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  border: string; // tailwind border colour class
  text: string; // tailwind text colour class
  glow: string; // inline rgba string
  extra?: React.ReactNode;
}
function StatCard({
  label,
  value,
  icon,
  border,
  text,
  glow,
  extra,
}: StatCardProps) {
  return (
    <div
      className={`relative p-4 rounded-xl border bg-black/40 backdrop-blur-sm overflow-hidden flex items-center gap-3 ${border}`}
      style={{ boxShadow: `0 0 20px ${glow}` }}
    >
      {/* icon bubble */}
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${text} bg-white/5`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/40 mb-0.5">{label}</p>
        <p className={`text-xl font-bold ${text}`}>{value}</p>
      </div>
      {extra}
    </div>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload }: any) {
  if (active && payload?.length) {
    return (
      <div className="bg-black/80 border border-cyan-500/30 rounded-lg px-3 py-2 text-xs">
        <p className="text-cyan-400">
          {payload[0]?.name}:{" "}
          <span className="text-white font-semibold">{payload[0]?.value}</span>
        </p>
      </div>
    );
  }
  return null;
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function TradingDashboard() {
  const { activeSectionId, pages } = useAppStore();
  const [trades, setTrades] = useState<TradeData[]>([]);

  useEffect(() => {
    if (!activeSectionId) return;
    fetch(`/api/pages?sectionId=${activeSectionId}`)
      .then((r) => r.json())
      .then((data) => setTrades(data.filter((p: TradeData) => p.pnl !== null)));
  }, [activeSectionId, pages]);

  let cumulative = 0;
  const equityData = trades.map((t) => {
    cumulative += t.pnl ?? 0;
    return {
      name: t.title.slice(0, 12),
      pnl: t.pnl ?? 0,
      equity: parseFloat(cumulative.toFixed(2)),
      date: new Date(t.createdAt).toLocaleDateString("vi-VN"),
    };
  });

  const totalPnl = trades.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const wins = trades.filter((t) => (t.pnl ?? 0) > 0).length;
  const winratePct = trades.length > 0 ? (wins / trades.length) * 100 : 0;
  const avgPnl = trades.length > 0 ? totalPnl / trades.length : 0;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Trading Dashboard
        </h2>
        <p className="text-white/30 text-sm mt-1">
          Phân tích hiệu suất giao dịch
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total PnL"
          value={`${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`}
          icon={
            totalPnl >= 0 ? (
              <TrendingUp size={18} />
            ) : (
              <TrendingDown size={18} />
            )
          }
          border={totalPnl >= 0 ? "border-cyan-500/30" : "border-pink-500/30"}
          text={totalPnl >= 0 ? "text-cyan-400" : "text-pink-400"}
          glow={
            totalPnl >= 0 ? "rgba(0,255,255,0.07)" : "rgba(244,114,182,0.07)"
          }
        />
        <StatCard
          label="Winrate"
          value={`${winratePct.toFixed(1)}%`}
          icon={<Target size={18} />}
          border="border-purple-500/30"
          text="text-purple-400"
          glow="rgba(168,85,247,0.07)"
          extra={<WinrateRing value={winratePct} />}
        />
        <StatCard
          label="Total Trades"
          value={trades.length}
          icon={<BarChart2 size={18} />}
          border="border-blue-500/30"
          text="text-blue-400"
          glow="rgba(59,130,246,0.07)"
        />
        <StatCard
          label="Avg PnL"
          value={`${avgPnl >= 0 ? "+" : ""}$${avgPnl.toFixed(2)}`}
          icon={<Activity size={18} />}
          border="border-yellow-500/30"
          text="text-yellow-400"
          glow="rgba(234,179,8,0.07)"
        />
      </div>

      {trades.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Activity size={40} className="text-white/10" />
          <p className="text-white/30 text-sm">
            Chưa có trade nào. Tạo page với trường PnL để bắt đầu!
          </p>
        </div>
      ) : (
        <>
          {/* Equity Curve */}
          <div className="p-5 rounded-xl border border-cyan-500/20 bg-black/40 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-cyan-400 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_cyan]" />
              Equity Curve
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={equityData}>
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ffff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00ffff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="#00ffff"
                  strokeWidth={2}
                  fill="url(#equityGrad)"
                  filter="drop-shadow(0 0 6px cyan)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* PnL Per Trade */}
          <div className="p-5 rounded-xl border border-purple-500/20 bg-black/40 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-purple-400 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_purple]" />
              PnL Per Trade
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={equityData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="pnl"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={{
                    fill: "#a855f7",
                    r: 4,
                    filter: "drop-shadow(0 0 4px #a855f7)",
                  }}
                  filter="drop-shadow(0 0 6px #a855f7)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Trades — glass table */}
          <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-white/8 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white/30" />
              <h3 className="text-sm font-semibold text-white/50">
                Recent Trades
              </h3>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-5 py-2.5 text-left text-white/30 font-medium tracking-wide uppercase text-[10px]">
                    Trade
                  </th>
                  <th className="px-5 py-2.5 text-left text-white/30 font-medium tracking-wide uppercase text-[10px]">
                    Date
                  </th>
                  <th className="px-5 py-2.5 text-right text-white/30 font-medium tracking-wide uppercase text-[10px]">
                    PnL
                  </th>
                  <th className="px-5 py-2.5 text-center text-white/30 font-medium tracking-wide uppercase text-[10px]">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody>
                {trades
                  .slice(-10)
                  .reverse()
                  .map((t) => {
                    const win = (t.pnl ?? 0) > 0;
                    const flat = (t.pnl ?? 0) === 0;
                    return (
                      <tr
                        key={t.id}
                        className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="px-5 py-3 text-white/70">{t.title}</td>
                        <td className="px-5 py-3 text-white/30">
                          {new Date(t.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td
                          className={`px-5 py-3 text-right font-semibold tabular-nums ${win ? "text-cyan-400" : flat ? "text-white/40" : "text-pink-400"}`}
                        >
                          {(t.pnl ?? 0) > 0 ? "+" : ""}
                          {t.pnl}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {flat ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 text-white/30 border border-white/10">
                              <Minus size={9} /> Flat
                            </span>
                          ) : win ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                              style={{
                                boxShadow: "0 0 8px rgba(0,255,255,0.12)",
                              }}
                            >
                              <TrendingUp size={9} /> Win
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-pink-500/10 text-pink-400 border border-pink-500/20"
                              style={{
                                boxShadow: "0 0 8px rgba(244,114,182,0.12)",
                              }}
                            >
                              <TrendingDown size={9} /> Loss
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
