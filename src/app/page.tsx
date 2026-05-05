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
import { WelcomeScreen } from "@/components/WelcomeScreen";

import { LayoutGrid, Table2, Kanban, Calendar, Image } from "lucide-react";

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

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const { activeSectionId, sections, activePageId } = useAppStore();
  const active = sections.find((s) => s.id === activeSectionId);
  const sectionType = active?.type ?? "general";

  const defaultView: ViewMode = HAS_DASHBOARD.includes(sectionType)
    ? "dashboard"
    : "table";

  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);

  // No section selected → cyberpunk welcome
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
