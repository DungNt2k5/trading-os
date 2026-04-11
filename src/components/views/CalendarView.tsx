"use client";

import { useState } from "react";
import { useAppStore, Page } from "@/store/useAppStore";
import { ChevronLeft, ChevronRight, Plus, DollarSign } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTH_NAMES = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

// ── Day Cell ──────────────────────────────────────────────────────────────────

function DayCell({
  day,
  year,
  month,
  dayPages,
  isToday,
  isOtherMonth,
  sectionType,
  activePageId,
  onPageClick,
  onCreatePage,
}: {
  day: number;
  year: number;
  month: number;
  dayPages: Page[];
  isToday: boolean;
  isOtherMonth: boolean;
  sectionType: string;
  activePageId: string | null;
  onPageClick: (id: string) => void;
  onCreatePage: (date: string) => void;
}) {
  const [hov, setHov] = useState(false);
  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        minHeight: 90,
        padding: "6px 8px",
        background: isToday
          ? "rgba(34,211,238,0.04)"
          : hov
            ? "rgba(255,255,255,0.02)"
            : "transparent",
        border: `0.5px solid ${isToday ? "rgba(34,211,238,0.2)" : "rgba(255,255,255,0.05)"}`,
        borderRadius: 8,
        position: "relative",
        transition: "background 0.15s",
      }}
    >
      {/* Day number */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: isToday ? 700 : 400,
            color: isToday
              ? "#22d3ee"
              : isOtherMonth
                ? "rgba(255,255,255,0.15)"
                : "rgba(255,255,255,0.5)",
            width: 22,
            height: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: isToday ? "rgba(34,211,238,0.15)" : "transparent",
          }}
        >
          {day}
        </span>

        {hov && (
          <button
            onClick={() => onCreatePage(dateStr)}
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(34,211,238,0.15)",
              border: "0.5px solid rgba(34,211,238,0.3)",
              color: "#22d3ee",
              cursor: "pointer",
            }}
          >
            <Plus size={10} />
          </button>
        )}
      </div>

      {/* Page chips */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {dayPages.slice(0, 3).map((page) => {
          const isActive = activePageId === page.id;
          let chipColor = "rgba(168,85,247,0.6)";
          let chipBg = "rgba(168,85,247,0.1)";

          if (
            sectionType === "trading" &&
            page.pnl !== null &&
            page.pnl !== undefined
          ) {
            chipColor =
              page.pnl > 0 ? "rgba(52,211,153,0.8)" : "rgba(248,113,113,0.8)";
            chipBg =
              page.pnl > 0 ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)";
          } else if (sectionType === "expense") {
            chipColor = "rgba(244,114,182,0.8)";
            chipBg = "rgba(236,72,153,0.1)";
          }

          return (
            <div
              key={page.id}
              onClick={() => onPageClick(page.id)}
              style={{
                fontSize: 10,
                padding: "2px 6px",
                borderRadius: 5,
                background: isActive ? "rgba(34,211,238,0.15)" : chipBg,
                border: `0.5px solid ${isActive ? "rgba(34,211,238,0.4)" : chipColor + "40"}`,
                color: isActive ? "#22d3ee" : chipColor,
                cursor: "pointer",
                /* FIX: bỏ truncate:"ellipsis" (không hợp lệ), dùng 3 property đúng */
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {sectionType === "trading" &&
                page.pnl !== null &&
                page.pnl !== undefined && <DollarSign size={7} />}
              {page.title || "Untitled"}
            </div>
          );
        })}

        {dayPages.length > 3 && (
          <span
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.25)",
              paddingLeft: 4,
            }}
          >
            +{dayPages.length - 3} khác
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function CalendarView() {
  const {
    pages,
    sections,
    activeSectionId,
    activePageId,
    setActivePageId,
    addPage,
  } = useAppStore();
  const activeSection = sections.find((s) => s.id === activeSectionId);
  const sectionType = activeSection?.type ?? "general";
  const sectionPages = pages.filter((p) => p.sectionId === activeSectionId);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };
  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  // Group pages by date
  const pagesByDate: Record<string, Page[]> = {};
  sectionPages.forEach((page) => {
    const d = new Date(page.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!pagesByDate[key]) pagesByDate[key] = [];
    pagesByDate[key].push(page);
  });

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  // Build 42-cell grid
  const cells: Array<{
    day: number;
    month: number;
    year: number;
    isOtherMonth: boolean;
  }> = [];

  const prevMonthDays = getDaysInMonth(year, month === 0 ? 11 : month - 1);
  for (let i = firstDay - 1; i >= 0; i--) {
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    cells.push({
      day: prevMonthDays - i,
      month: m,
      year: y,
      isOtherMonth: true,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month, year, isOtherMonth: false });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    cells.push({ day: d, month: m, year: y, isOtherMonth: true });
  }

  const handleCreatePage = async (dateStr: string) => {
    if (!activeSectionId) return;
    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: dateStr,
        content: "",
        sectionId: activeSectionId,
      }),
    });
    const newPage = await res.json();
    addPage(newPage);
    setActivePageId(newPage.id);
  };

  // Stats
  const monthPages = sectionPages.filter((p) => {
    const d = new Date(p.createdAt);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const totalPnl =
    sectionType === "trading"
      ? monthPages.reduce((s, p) => s + (p.pnl ?? 0), 0)
      : null;
  const totalAmount =
    sectionType === "expense"
      ? monthPages.reduce((s, p) => s + (p.amount ?? 0), 0)
      : null;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        /* FIX: chiếm toàn bộ chiều cao còn lại, không bị cắt */
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "12px 20px",
          borderBottom: "0.5px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.2)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={prevMonth}
          style={{
            color: "rgba(255,255,255,0.4)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            padding: 4,
          }}
        >
          <ChevronLeft size={16} />
        </button>

        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "rgba(255,255,255,0.85)",
            minWidth: 120,
            textAlign: "center",
          }}
        >
          {MONTH_NAMES[month]} {year}
        </span>

        <button
          onClick={nextMonth}
          style={{
            color: "rgba(255,255,255,0.4)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            padding: 4,
          }}
        >
          <ChevronRight size={16} />
        </button>

        <button
          onClick={goToday}
          style={{
            fontSize: 11,
            padding: "4px 10px",
            borderRadius: 6,
            border: "0.5px solid rgba(255,255,255,0.1)",
            background: "transparent",
            color: "rgba(255,255,255,0.4)",
            cursor: "pointer",
          }}
        >
          Hôm nay
        </button>

        <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
            {monthPages.length} entries
          </span>
          {totalPnl !== null && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "monospace",
                color: totalPnl >= 0 ? "#34d399" : "#f87171",
              }}
            >
              {totalPnl >= 0 ? "+" : ""}
              {totalPnl.toFixed(2)} PnL
            </span>
          )}
          {totalAmount !== null && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "monospace",
                color: "#f472b6",
              }}
            >
              ${totalAmount.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* ── Weekday headers ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          padding: "6px 16px 0",
          borderBottom: "0.5px solid rgba(255,255,255,0.05)",
          flexShrink: 0,
        }}
      >
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: 10,
              fontWeight: 600,
              padding: "4px 0",
              letterSpacing: "0.08em",
              color:
                i === 0
                  ? "rgba(248,113,113,0.5)"
                  : i === 6
                    ? "rgba(34,211,238,0.4)"
                    : "rgba(255,255,255,0.25)",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── Grid ── FIX: flex:1 + minHeight:0 để chiếm hết phần còn lại */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "8px 16px 16px",
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gridTemplateRows: "repeat(6, 1fr)",
          gap: 4,
        }}
      >
        {cells.map((cell, idx) => {
          const dateStr = `${cell.year}-${String(cell.month + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
          const dayPages = pagesByDate[dateStr] ?? [];
          const isToday =
            cell.day === today.getDate() &&
            cell.month === today.getMonth() &&
            cell.year === today.getFullYear();

          return (
            <DayCell
              key={idx}
              day={cell.day}
              year={cell.year}
              month={cell.month}
              dayPages={dayPages}
              isToday={isToday}
              isOtherMonth={cell.isOtherMonth}
              sectionType={sectionType}
              activePageId={activePageId}
              onPageClick={setActivePageId}
              onCreatePage={handleCreatePage}
            />
          );
        })}
      </div>
    </div>
  );
}
