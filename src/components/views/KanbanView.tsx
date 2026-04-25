"use client";

import { useState } from "react";
import { useAppStore, Page, parseMeta } from "@/store/useAppStore";
import { applyFilters, FilterGroup } from "@/components/filters/FilterBuilder";
import FilterBuilder from "@/components/filters/FilterBuilder";
import {
  Plus,
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

// ── Config: chỉ 3 trạng thái ─────────────────────────────────────────────────

const COLUMNS = [
  { id: "active", label: "Active", color: "#00ff9f" },
  { id: "in-progress", label: "In Progress", color: "#fbbf24" },
  { id: "done", label: "Done", color: "#60a5fa" },
  { id: "draft", label: "Draft", color: "#a78bfa" },
  { id: "archived", label: "Archived", color: "#555" },
];

// ── Card ──────────────────────────────────────────────────────────────────────

function KanbanCard({
  page,
  sectionType,
  isActive,
  onDragStart,
  onClick,
}: {
  page: Page;
  sectionType: string;
  isActive: boolean;
  onDragStart: () => void;
  onClick: () => void;
}) {
  const meta = parseMeta(page.metadata);
  const [hov, setHov] = useState(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: isActive
          ? "rgba(34,211,238,0.08)"
          : hov
            ? "rgba(255,255,255,0.05)"
            : "rgba(255,255,255,0.03)",
        border: `0.5px solid ${isActive ? "rgba(34,211,238,0.3)" : hov ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 10,
        padding: "10px 12px",
        cursor: "pointer",
        transition: "all 0.15s",
        userSelect: "none",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "rgba(255,255,255,0.82)",
          marginBottom: 8,
          lineHeight: 1.4,
        }}
      >
        {page.title || "Untitled"}
      </div>

      {sectionType === "trading" && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            marginBottom: page.tags?.length ? 8 : 0,
          }}
        >
          {meta.direction && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                padding: "2px 6px",
                borderRadius: 4,
                color: meta.direction === "long" ? "#34d399" : "#f87171",
                background:
                  meta.direction === "long"
                    ? "rgba(52,211,153,0.1)"
                    : "rgba(248,113,113,0.1)",
                border: `0.5px solid ${meta.direction === "long" ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`,
              }}
            >
              {meta.direction === "long" ? (
                <TrendingUp size={8} />
              ) : (
                <TrendingDown size={8} />
              )}
              {String(meta.direction)}
            </span>
          )}
          {page.category && (
            <span
              style={{
                fontSize: 9,
                padding: "2px 6px",
                borderRadius: 4,
                fontWeight: 600,
                color: "rgba(192,132,252,0.8)",
                background: "rgba(168,85,247,0.1)",
                border: "0.5px solid rgba(168,85,247,0.2)",
              }}
            >
              {page.category}
            </span>
          )}
          {page.pnl !== null && page.pnl !== undefined && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontSize: 9,
                fontWeight: 700,
                fontFamily: "monospace",
                color:
                  page.pnl > 0 ? "#34d399" : page.pnl < 0 ? "#f87171" : "#666",
                background:
                  page.pnl > 0
                    ? "rgba(52,211,153,0.08)"
                    : page.pnl < 0
                      ? "rgba(248,113,113,0.08)"
                      : "rgba(255,255,255,0.04)",
                border: `0.5px solid ${page.pnl > 0 ? "rgba(52,211,153,0.2)" : page.pnl < 0 ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 4,
                padding: "2px 6px",
              }}
            >
              <DollarSign size={7} />
              {page.pnl > 0 ? "+" : ""}
              {page.pnl.toFixed(2)}
            </span>
          )}
        </div>
      )}

      {sectionType === "expense" &&
        page.amount !== null &&
        page.amount !== undefined && (
          <div style={{ marginBottom: page.tags?.length ? 8 : 0 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontSize: 10,
                fontWeight: 700,
                fontFamily: "monospace",
                color: "#f472b6",
                background: "rgba(236,72,153,0.08)",
                border: "0.5px solid rgba(236,72,153,0.2)",
                borderRadius: 4,
                padding: "2px 7px",
              }}
            >
              <DollarSign size={8} />
              {page.amount.toFixed(2)}
            </span>
            {page.category && (
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(168,85,247,0.7)",
                  marginLeft: 6,
                }}
              >
                {page.category}
              </span>
            )}
          </div>
        )}

      {page.tags && page.tags.length > 0 && (
        <div
          style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}
        >
          {page.tags.slice(0, 3).map((pt) => (
            <span
              key={pt.tagId}
              style={{
                fontSize: 9,
                padding: "1px 6px",
                borderRadius: 8,
                color: pt.tag.color,
                background: pt.tag.color + "18",
                border: `0.5px solid ${pt.tag.color}40`,
              }}
            >
              {pt.tag.name}
            </span>
          ))}
        </div>
      )}

      <div
        style={{ marginTop: 6, fontSize: 9, color: "rgba(255,255,255,0.18)" }}
      >
        {new Date(page.updatedAt).toLocaleDateString("vi-VN")}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function KanbanView() {
  const {
    pages,
    sections,
    activeSectionId,
    activePageId,
    setActivePageId,
    updatePage,
    addPage,
  } = useAppStore();
  const activeSection = sections.find((s) => s.id === activeSectionId);
  const sectionType = activeSection?.type ?? "general";
  const sectionPages = pages.filter((p) => p.sectionId === activeSectionId);

  const [filterGroup, setFilterGroup] = useState<FilterGroup>({
    logic: "AND",
    rules: [],
  });
  const [showFilter, setShowFilter] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const filtered = applyFilters(sectionPages, filterGroup);

  const handleDrop = async (status: string) => {
    if (!dragging) return;
    setDragOver(null);
    const page = pages.find((p) => p.id === dragging);
    if (page?.status === status) {
      setDragging(null);
      return;
    }

    const res = await fetch(`/api/pages/${dragging}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const updated = await res.json();
    updatePage(dragging, updated);
    setDragging(null);
  };

  const handleCreate = async (status: string) => {
    if (!activeSectionId) return;
    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Untitled",
        content: "",
        sectionId: activeSectionId,
        status,
      }),
    });
    const newPage = await res.json();
    addPage(newPage);
    setActivePageId(newPage.id);
  };

  const activeFilter = filterGroup.rules.length > 0;

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
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 20px",
          borderBottom: "0.5px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.3)",
            marginRight: "auto",
          }}
        >
          {filtered.length} bản ghi
        </span>
        <button
          onClick={() => setShowFilter((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            padding: "5px 12px",
            borderRadius: 7,
            border: `0.5px solid ${activeFilter ? "rgba(34,211,238,0.4)" : "rgba(255,255,255,0.1)"}`,
            background: activeFilter ? "rgba(34,211,238,0.08)" : "transparent",
            color: activeFilter ? "#22d3ee" : "rgba(255,255,255,0.45)",
            cursor: "pointer",
          }}
        >
          <Filter size={12} />
          Lọc {activeFilter && `(${filterGroup.rules.length})`}
        </button>
      </div>

      {showFilter && (
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "0.5px solid rgba(255,255,255,0.06)",
          }}
        >
          <FilterBuilder
            sectionType={sectionType}
            value={filterGroup}
            onChange={setFilterGroup}
            onClose={() => setShowFilter(false)}
          />
        </div>
      )}

      {/* Board */}
      <div
        style={{
          flex: 1,
          display: "flex",
          gap: 14,
          padding: "16px 20px",
          overflowX: "auto",
          overflowY: "hidden",
        }}
      >
        {COLUMNS.map((col) => {
          const colPages = filtered.filter((p) => p.status === col.id);
          const isDragTarget = dragOver === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(col.id);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(col.id)}
              style={{
                width: 260,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                background: isDragTarget
                  ? "rgba(34,211,238,0.04)"
                  : "rgba(255,255,255,0.02)",
                border: `0.5px solid ${isDragTarget ? "rgba(34,211,238,0.25)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 12,
                overflow: "hidden",
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              {/* Column header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderBottom: `0.5px solid ${col.color}20`,
                  background: col.color + "08",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: col.color,
                      boxShadow: `0 0 6px ${col.color}80`,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{ fontSize: 12, fontWeight: 600, color: col.color }}
                  >
                    {col.label}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      background: col.color + "20",
                      color: col.color,
                      borderRadius: 10,
                      padding: "0 6px",
                      minWidth: 18,
                      textAlign: "center",
                    }}
                  >
                    {colPages.length}
                  </span>
                </div>
                <button
                  onClick={() => handleCreate(col.id)}
                  style={{
                    color: col.color + "80",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    padding: 2,
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = col.color)
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color =
                      col.color + "80")
                  }
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Cards */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {colPages.map((page) => (
                  <KanbanCard
                    key={page.id}
                    page={page}
                    sectionType={sectionType}
                    isActive={activePageId === page.id}
                    onDragStart={() => setDragging(page.id)}
                    onClick={() => setActivePageId(page.id)}
                  />
                ))}
                {colPages.length === 0 && (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "rgba(255,255,255,0.1)",
                      fontSize: 11,
                      textAlign: "center",
                      padding: "20px 0",
                    }}
                  >
                    Kéo thả card vào đây
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
