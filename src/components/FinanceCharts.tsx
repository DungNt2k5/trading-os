"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DailyBalance {
  id: string;
  date: string;
  total: number;
  profileName?: string | null;
  note?: string | null;
}

interface EmailEvent {
  id: string;
  email: string;
  exchange: string;
  eventCode: string;
  eventName?: string | null;
  amount?: number | null;
  status: string;
  eventDate?: string | null;
}

// ── Color Palette ─────────────────────────────────────────────────────────────

const NEON = {
  cyan: "#22d3ee",
  purple: "#a855f7",
  pink: "#f472b6",
  green: "#34d399",
  red: "#f87171",
  yellow: "#fbbf24",
  orange: "#fb923c",
};

const EXCHANGE_COLORS: Record<string, string> = {
  APEX: NEON.cyan,
  XT: NEON.purple,
  BINGX: NEON.pink,
  MEXC: NEON.green,
  OKX: NEON.yellow,
  BINANCE: NEON.orange,
};

function exchangeColor(name: string): string {
  const upper = name.toUpperCase();
  for (const [key, color] of Object.entries(EXCHANGE_COLORS)) {
    if (upper.includes(key)) return color;
  }
  // Hash-based fallback
  const palette = Object.values(NEON);
  let h = 0;
  for (let i = 0; i < name.length; i++)
    h = (h * 31 + name.charCodeAt(i)) % palette.length;
  return palette[h];
}

function fmtMoney(n: number) {
  if (Math.abs(n) >= 1_000_000)
    return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (Math.abs(n) >= 1_000)
    return (n / 1_000).toFixed(1).replace(/\.?0+$/, "") + "K";
  return n.toLocaleString("vi-VN");
}

function fmtDateShort(d: string) {
  const [, m, dd] = d.split("-");
  return `${dd}/${m}`;
}

// ── Shared: Neon Tooltip ──────────────────────────────────────────────────────

function NeonTooltip({
  active,
  payload,
  label,
  accentColor = NEON.cyan,
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

// ── Shared: Chart Section Header ──────────────────────────────────────────────

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

// ── Shared: Wrapper ────────────────────────────────────────────────────────────

function ChartBox({
  children,
  glowColor = NEON.cyan,
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
      {/* Corner accent */}
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

// ── Animated Counter ──────────────────────────────────────────────────────────

function AnimatedNumber({
  value,
  color,
  duration = 900,
}: {
  value: number;
  color: string;
  duration?: number;
}) {
  const [displayed, setDisplayed] = useState(0);
  const startRef = useRef(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = startRef.current;
    const diff = value - start;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(start + diff * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
      else startRef.current = value;
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return (
    <span
      style={{
        fontFamily: "monospace",
        fontWeight: 700,
        color,
        fontSize: "inherit",
      }}
    >
      {fmtMoney(displayed)}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1: BALANCE CHARTS
// ══════════════════════════════════════════════════════════════════════════════

export function BalanceCharts({ balances }: { balances: DailyBalance[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Sort chronologically
  const sorted = useMemo(
    () => [...balances].sort((a, b) => a.date.localeCompare(b.date)),
    [balances],
  );

  // Equity curve data
  const equityData = useMemo(
    () =>
      sorted.map((b, i) => ({
        date: fmtDateShort(b.date),
        total: b.total,
        pnl: i > 0 ? b.total - sorted[i - 1].total : 0,
      })),
    [sorted],
  );

  // PnL bar data (last 14 entries)
  const pnlData = equityData.slice(-14).map((d) => ({
    ...d,
    gain: d.pnl > 0 ? d.pnl : 0,
    loss: d.pnl < 0 ? d.pnl : 0,
  }));

  const totalSum = balances.reduce((s, b) => s + b.total, 0);
  const lastPnl =
    equityData.length > 1 ? equityData[equityData.length - 1].pnl : 0;
  const winDays = equityData.filter((d) => d.pnl > 0).length;
  const lossDays = equityData.filter((d) => d.pnl < 0).length;
  const winRate =
    equityData.length > 1
      ? Math.round((winDays / (equityData.length - 1)) * 100)
      : 0;

  if (balances.length === 0) return null;

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
      {/* ── KPI Strip ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 10,
        }}
      >
        {[
          {
            label: "Equity hiện tại",
            value: sorted.at(-1)?.total ?? 0,
            color: NEON.cyan,
            sub: "Số dư cuối",
          },
          {
            label: "PnL hôm nay",
            value: lastPnl,
            color: lastPnl >= 0 ? NEON.green : NEON.red,
            sub: lastPnl >= 0 ? "↑ Lãi" : "↓ Lỗ",
          },
          {
            label: "Win rate",
            value: winRate,
            color: NEON.purple,
            sub: `${winDays}W / ${lossDays}L`,
            isPercent: true,
          },
          {
            label: "Tổng cộng",
            value: totalSum,
            color: NEON.yellow,
            sub: `${balances.length} ngày ghi`,
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
              transition: "border-color 0.2s",
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
            <div style={{ fontSize: 18, lineHeight: 1 }}>
              {(kpi as { isPercent?: boolean }).isPercent ? (
                <span
                  style={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: kpi.color,
                  }}
                >
                  {winRate}%
                </span>
              ) : (
                <AnimatedNumber value={kpi.value} color={kpi.color} />
              )}
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
            {/* Glow dot */}
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

      {/* ── Equity Curve ── */}
      <ChartBox glowColor={NEON.cyan}>
        <ChartHeader
          title="EQUITY CURVE"
          subtitle="Đường vốn theo thời gian"
          color={NEON.cyan}
        />
        <div style={{ height: 200, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart
              data={equityData}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={NEON.cyan} stopOpacity={0.35} />
                  <stop
                    offset="60%"
                    stopColor={NEON.purple}
                    stopOpacity={0.08}
                  />
                  <stop offset="100%" stopColor={NEON.cyan} stopOpacity={0} />
                </linearGradient>
                <filter id="glowCyan">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
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
              <Tooltip content={<NeonTooltip accentColor={NEON.cyan} />} />
              <Area
                type="monotone"
                dataKey="total"
                name="Equity"
                stroke={NEON.cyan}
                strokeWidth={2}
                fill="url(#equityGrad)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: NEON.cyan,
                  strokeWidth: 0,
                  filter: "url(#glowCyan)",
                }}
                style={{ filter: "drop-shadow(0 0 4px rgba(34,211,238,0.6))" }}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartBox>

      {/* ── PnL Bar Chart ── */}
      <ChartBox glowColor={NEON.green}>
        <ChartHeader
          title="PNL HÀNG NGÀY"
          subtitle={`${pnlData.length} ngày gần nhất`}
          color={NEON.green}
        />
        <div style={{ height: 180, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
              data={pnlData}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              style={{ cursor: "default" }}
            >
              <defs>
                <linearGradient id="gainGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={NEON.green} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={NEON.cyan} stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="lossGrad" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor={NEON.red} stopOpacity={0.9} />
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
                content={<NeonTooltip accentColor={NEON.green} />}
                cursor={{ fill: "rgba(255,255,255,0.03)", stroke: "none" }}
              />
              <Bar
                dataKey="gain"
                name="Lãi"
                fill="url(#gainGrad)"
                radius={[3, 3, 0, 0]}
                style={{ filter: "drop-shadow(0 0 4px rgba(52,211,153,0.5))" }}
                animationDuration={1000}
                animationEasing="ease-out"
                background={false}
                activeBar={{
                  fill: "url(#gainGrad)",
                  fillOpacity: 1,
                  stroke: "none",
                  filter: "drop-shadow(0 0 6px rgba(52,211,153,0.8))",
                }}
              />
              <Bar
                dataKey="loss"
                name="Lỗ"
                fill="url(#lossGrad)"
                radius={[0, 0, 3, 3]}
                style={{ filter: "drop-shadow(0 0 4px rgba(248,113,113,0.5))" }}
                animationDuration={1000}
                animationEasing="ease-out"
                background={false}
                activeBar={{
                  fill: "url(#lossGrad)",
                  fillOpacity: 1,
                  stroke: "none",
                  filter: "drop-shadow(0 0 6px rgba(248,113,113,0.8))",
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartBox>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2: EVENTS CHARTS
// ══════════════════════════════════════════════════════════════════════════════

// Custom animated Donut label
function DonutLabel({
  cx,
  cy,
  total,
  color,
}: {
  cx: number;
  cy: number;
  total: number;
  color: string;
}) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan
        x={cx}
        dy="-8"
        fontSize={20}
        fontWeight={700}
        fontFamily="monospace"
        fill={color}
      >
        {total}
      </tspan>
      <tspan x={cx} dy={20} fontSize={10} fill="rgba(255,255,255,0.3)">
        total
      </tspan>
    </text>
  );
}

export function EventCharts({
  events,
}: {
  events: {
    id: string;
    email: string;
    exchange: string;
    eventCode: string;
    eventName?: string | null;
    amount?: number | null;
    status: string;
    eventDate?: string | null;
  }[];
}) {
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Status donut data
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((e) => {
      counts[e.status] = (counts[e.status] ?? 0) + 1;
    });
    const CFG: Record<string, { label: string; color: string }> = {
      pending: { label: "Pending", color: NEON.yellow },
      confirmed: { label: "Confirmed", color: NEON.green },
      cancelled: { label: "Cancelled", color: NEON.red },
    };
    return Object.entries(counts).map(([status, count]) => ({
      name: CFG[status]?.label ?? status,
      value: count,
      color: CFG[status]?.color ?? NEON.purple,
    }));
  }, [events]);

  // Exchange bar data
  const exchangeData = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    events.forEach((e) => {
      // Split multi-exchange like "BINGX,MEXC,XT"
      const exs = e.exchange
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      exs.forEach((ex) => {
        if (!map[ex]) map[ex] = { count: 0, total: 0 };
        map[ex].count++;
        map[ex].total += e.amount ?? 0;
      });
    });
    return Object.entries(map)
      .map(([name, { count, total }]) => ({
        name,
        count,
        total,
        color: exchangeColor(name),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [events]);

  // Amount timeline
  const timelineData = useMemo(() => {
    const confirmed = events
      .filter((e) => e.amount && e.amount > 0)
      .sort((a, b) => (a.eventDate ?? a.id).localeCompare(b.eventDate ?? b.id))
      .slice(-14)
      .map((e) => ({
        date: e.eventDate ? fmtDateShort(e.eventDate) : e.eventCode,
        amount: e.amount ?? 0,
        color: exchangeColor(e.exchange.split(",")[0]),
      }));
    return confirmed;
  }, [events]);

  // KPIs
  const totalAmount = events.reduce((s, e) => s + (e.amount ?? 0), 0);
  const confirmedCount = events.filter((e) => e.status === "confirmed").length;
  const pendingCount = events.filter((e) => e.status === "pending").length;
  const cancelledCount = events.filter((e) => e.status === "cancelled").length;
  const confirmRate =
    events.length > 0 ? Math.round((confirmedCount / events.length) * 100) : 0;

  if (events.length === 0) return null;

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
      {/* ── KPI Strip ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 10,
        }}
      >
        {[
          {
            label: "Tổng sự kiện",
            value: events.length,
            color: NEON.purple,
            sub: "Tất cả status",
            isCount: true,
          },
          {
            label: "Confirmed",
            value: confirmedCount,
            color: NEON.green,
            sub: `Tỉ lệ ${confirmRate}%`,
            isCount: true,
          },
          {
            label: "Pending",
            value: pendingCount,
            color: NEON.yellow,
            sub: "Chờ xử lý",
            isCount: true,
          },
          {
            label: "Tổng tiền",
            value: totalAmount,
            color: NEON.cyan,
            sub: "Đã xác nhận",
            isCount: false,
          },
        ].map((kpi, i) => (
          <div
            key={i}
            style={{
              background: `linear-gradient(135deg, ${kpi.color}08, transparent)`,
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
            <div style={{ fontSize: 20, lineHeight: 1 }}>
              {kpi.isCount ? (
                <span
                  style={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: kpi.color,
                  }}
                >
                  {kpi.value}
                </span>
              ) : (
                <AnimatedNumber value={kpi.value} color={kpi.color} />
              )}
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

      {/* ── Row: Donut + Exchange Bar ── */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 14 }}
      >
        {/* Donut - Status */}
        <ChartBox glowColor={NEON.purple}>
          <ChartHeader
            title="PHÂN BỔ STATUS"
            subtitle="Tỉ lệ trạng thái sự kiện"
            color={NEON.purple}
          />
          <div style={{ height: 200, position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <defs>
                  {statusData.map((d, i) => (
                    <filter key={i} id={`glow-${i}`}>
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  ))}
                </defs>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={3}
                  dataKey="value"
                  animationBegin={200}
                  animationDuration={1000}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.color}
                      opacity={
                        activeIndex === null || activeIndex === index ? 1 : 0.4
                      }
                      style={{
                        filter:
                          activeIndex === index
                            ? `drop-shadow(0 0 8px ${entry.color})`
                            : "none",
                        transition: "opacity 0.2s, filter 0.2s",
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0];
                    return (
                      <div
                        style={{
                          background: "rgba(5,5,12,0.97)",
                          border: `0.5px solid ${(d.payload as { color: string }).color}40`,
                          borderRadius: 8,
                          padding: "8px 12px",
                          boxShadow: `0 0 16px ${(d.payload as { color: string }).color}20`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: (d.payload as { color: string }).color,
                          }}
                        >
                          {d.name}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontFamily: "monospace",
                            color: "#fff",
                            marginTop: 2,
                          }}
                        >
                          {d.value} sự kiện
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "rgba(255,255,255,0.3)",
                            marginTop: 2,
                          }}
                        >
                          {Math.round(
                            ((d.value as number) / events.length) * 100,
                          )}
                          %
                        </div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center label overlay */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                textAlign: "center",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  fontFamily: "monospace",
                  color: NEON.purple,
                }}
              >
                {events.length}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: "rgba(255,255,255,0.3)",
                  marginTop: 2,
                }}
              >
                TOTAL
              </div>
            </div>
          </div>

          {/* Legend */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 5,
              marginTop: 8,
            }}
          >
            {statusData.map((d, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: d.color,
                    flexShrink: 0,
                    boxShadow: `0 0 6px ${d.color}80`,
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.5)",
                    flex: 1,
                  }}
                >
                  {d.name}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "monospace",
                    fontWeight: 600,
                    color: d.color,
                  }}
                >
                  {d.value}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.25)",
                    minWidth: 32,
                    textAlign: "right",
                  }}
                >
                  {Math.round((d.value / events.length) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </ChartBox>

        {/* Bar - Exchange */}
        <ChartBox glowColor={NEON.cyan}>
          <ChartHeader
            title="TỔNG TIỀN THEO SÀN"
            subtitle="Top sàn giao dịch"
            color={NEON.cyan}
          />
          <div style={{ height: 260, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={exchangeData}
                layout="vertical"
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                style={{ cursor: "default" }}
              >
                <defs>
                  {exchangeData.map((d, i) => (
                    <linearGradient
                      key={i}
                      id={`exGrad-${i}`}
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor={d.color} stopOpacity={0.9} />
                      <stop
                        offset="100%"
                        stopColor={d.color}
                        stopOpacity={0.3}
                      />
                    </linearGradient>
                  ))}
                </defs>
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
                  width={48}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.03)", stroke: "none" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as {
                      name: string;
                      count: number;
                      total: number;
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
                            fontSize: 11,
                            color: "rgba(255,255,255,0.5)",
                          }}
                        >
                          Số SK:{" "}
                          <span
                            style={{ color: "#fff", fontFamily: "monospace" }}
                          >
                            {d.count}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.5)",
                          }}
                        >
                          Tổng:{" "}
                          <span
                            style={{
                              color: d.color,
                              fontFamily: "monospace",
                              fontWeight: 700,
                            }}
                          >
                            {fmtMoney(d.total)}
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="total"
                  name="Tổng tiền"
                  radius={[0, 4, 4, 0]}
                  animationDuration={1200}
                  animationEasing="ease-out"
                  background={false}
                  activeBar={{ fillOpacity: 1, stroke: "none" }}
                >
                  {exchangeData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={`url(#exGrad-${index})`}
                      style={{
                        filter: `drop-shadow(0 0 3px ${entry.color}60)`,
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartBox>
      </div>

      {/* ── Amount Timeline ── */}
      {timelineData.length > 0 && (
        <ChartBox glowColor={NEON.pink}>
          <ChartHeader
            title="TIMELINE SỐ TIỀN"
            subtitle="Các sự kiện có số tiền theo thời gian"
            color={NEON.pink}
          />
          <div style={{ height: 170, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart
                data={timelineData}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="amtGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={NEON.pink} stopOpacity={0.4} />
                    <stop
                      offset="100%"
                      stopColor={NEON.purple}
                      stopOpacity={0}
                    />
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
                <Tooltip content={<NeonTooltip accentColor={NEON.pink} />} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  name="Số tiền"
                  stroke={NEON.pink}
                  strokeWidth={2}
                  fill="url(#amtGrad)"
                  dot={{ r: 3, fill: NEON.pink, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: NEON.pink, strokeWidth: 0 }}
                  style={{
                    filter: "drop-shadow(0 0 4px rgba(244,114,182,0.6))",
                  }}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartBox>
      )}
    </div>
  );
}
