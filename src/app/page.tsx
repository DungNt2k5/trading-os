"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import PageEditor from "@/components/PageEditor";
import TradingDashboard from "@/components/TradingDashboard";
import ExpenseDashboard from "@/components/ExpenseDashboard";
import TableView from "@/components/views/TableView";
import KanbanView from "@/components/views/KanbanView";
import CalendarView from "@/components/views/CalendarView";
import GalleryView from "@/components/views/GalleryView";
import FinanceDashboard from "@/components/FinanceDashboard";

import {
  Zap,
  CandlestickChart,
  StickyNote,
  LayoutGrid,
  Table2,
  Kanban,
  Calendar,
  Image,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ViewMode = "dashboard" | "table" | "kanban" | "calendar" | "gallery";

// ── View switcher bar ─────────────────────────────────────────────────────────

const VIEW_TABS: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutGrid size={13} /> },
  { id: "table", label: "Table", icon: <Table2 size={13} /> },
  { id: "kanban", label: "Kanban", icon: <Kanban size={13} /> },
  { id: "calendar", label: "Calendar", icon: <Calendar size={13} /> },
  { id: "gallery", label: "Gallery", icon: <Image size={13} /> },
];

// Sections that have a meaningful "dashboard" view
const HAS_DASHBOARD = ["trading", "expense", "finance"];

function ViewSwitcher({
  active,
  onChange,
  sectionType,
}: {
  active: ViewMode;
  onChange: (v: ViewMode) => void;
  sectionType: string;
}) {
  const tabs = VIEW_TABS.filter((t) => {
    // Hide dashboard tab for general/custom sections
    if (t.id === "dashboard" && !HAS_DASHBOARD.includes(sectionType))
      return false;
    return true;
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: "8px 20px",
        borderBottom: "0.5px solid rgba(255,255,255,0.07)",
        background: "rgba(0,0,0,0.15)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 7,
              fontSize: 12,
              fontWeight: isActive ? 600 : 400,
              cursor: "pointer",
              border: `0.5px solid ${isActive ? "rgba(34,211,238,0.35)" : "transparent"}`,
              background: isActive ? "rgba(34,211,238,0.1)" : "transparent",
              color: isActive ? "#22d3ee" : "rgba(255,255,255,0.38)",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!isActive)
                (e.currentTarget as HTMLElement).style.color =
                  "rgba(255,255,255,0.65)";
            }}
            onMouseLeave={(e) => {
              if (!isActive)
                (e.currentTarget as HTMLElement).style.color =
                  "rgba(255,255,255,0.38)";
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Welcome screen ────────────────────────────────────────────────────────────

function WelcomeScreen() {
  return (
    <div className="flex-1 flex items-center justify-center h-full">
      <div className="text-center space-y-5 max-w-sm px-6">
        <div
          className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center
          bg-gradient-to-br from-cyan-500/20 to-purple-500/20
          border border-white/10"
        >
          <Zap size={26} className="text-cyan-400" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Chào mừng đến Personal OS
          </h2>
          <p className="text-white/30 text-sm leading-relaxed">
            Chọn hoặc tạo section ở sidebar để bắt đầu
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {[
            {
              icon: <CandlestickChart size={13} />,
              color: "text-cyan-400",
              text: "Trading — theo dõi PnL, equity curve",
            },
            {
              icon: <StickyNote size={13} />,
              color: "text-purple-400",
              text: "Notes — ghi chú kiểu Notion",
            },
          ].map((hint, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]"
            >
              <span className={hint.color}>{hint.icon}</span>
              <span className="text-xs text-white/35">{hint.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const { activeSectionId, sections, activePageId } = useAppStore();
  const active = sections.find((s) => s.id === activeSectionId);
  const sectionType = active?.type ?? "general";

  // Default view: dashboard for trading/expense, table for others
  const defaultView: ViewMode = HAS_DASHBOARD.includes(sectionType)
    ? "dashboard"
    : "table";

  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);

  // Reset view when section changes to a sensible default
  // (track via key on outer wrapper)

  // No section selected
  if (!activeSectionId || !active) {
    return <WelcomeScreen />;
  }

  // Page open → always show editor
  if (activePageId) {
    return <PageEditor />;
  }

  const renderView = () => {
    switch (viewMode) {
      case "dashboard":
        if (sectionType === "trading") return <TradingDashboard />;
        if (sectionType === "expense") return <ExpenseDashboard />;
        if (sectionType === "finance")
          return <FinanceDashboard sectionId={activeSectionId!} />;
        return <TableView />;
      case "table":
        return <TableView />;
      case "kanban":
        return <KanbanView />;
      case "calendar":
        return <CalendarView />;
      case "gallery":
        return <GalleryView />;
      default:
        return <TableView />;
    }
  };

  return (
    // key={activeSectionId} resets local state (viewMode) when section changes
    <div
      key={activeSectionId}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <ViewSwitcher
        active={viewMode}
        onChange={setViewMode}
        sectionType={sectionType}
      />
      {renderView()}
    </div>
  );
}
