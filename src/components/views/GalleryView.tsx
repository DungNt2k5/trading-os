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
  Tag,
  Calendar,
  FileText,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  active: "#00ff9f",
  archived: "#555",
  done: "#60a5fa",
  draft: "#a78bfa",
  "in-progress": "#fbbf24",
};

/** Extract first image src from HTML content */
function extractCoverImage(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

/** Extract plain text preview from HTML */
function extractTextPreview(html: string, maxLen = 100): string {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}

/** Generate gradient cover based on section type + page id */
function generateGradient(type: string, id: string): string {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const gradients: Record<string, string[]> = {
    trading: [
      "linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(16,185,129,0.1) 100%)",
      "linear-gradient(135deg, rgba(34,211,238,0.15) 0%, rgba(168,85,247,0.15) 100%)",
      "linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(6,182,212,0.1) 100%)",
    ],
    expense: [
      "linear-gradient(135deg, rgba(236,72,153,0.2) 0%, rgba(168,85,247,0.1) 100%)",
      "linear-gradient(135deg, rgba(244,114,182,0.15) 0%, rgba(236,72,153,0.15) 100%)",
    ],
    general: [
      "linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(99,102,241,0.15) 100%)",
      "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.1) 100%)",
    ],
    custom: [
      "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(239,68,68,0.1) 100%)",
      "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(245,158,11,0.1) 100%)",
    ],
  };
  const pool = gradients[type] ?? gradients.general;
  return pool[hash % pool.length];
}

// ── Card ──────────────────────────────────────────────────────────────────────

function GalleryCard({
  page,
  sectionType,
  isActive,
  onClick,
}: {
  page: Page;
  sectionType: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  const meta = parseMeta(page.metadata);
  const coverImage = extractCoverImage(page.content ?? "");
  const preview = extractTextPreview(page.content ?? "");
  const statusColor = STATUS_COLOR[page.status] ?? "#888";

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: isActive
          ? "rgba(34,211,238,0.06)"
          : hov
            ? "rgba(255,255,255,0.04)"
            : "rgba(255,255,255,0.02)",
        border: `0.5px solid ${isActive ? "rgba(34,211,238,0.35)" : hov ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 12,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.2s",
        transform: hov ? "translateY(-2px)" : "none",
        boxShadow: hov ? "0 8px 24px rgba(0,0,0,0.4)" : "none",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Cover */}
      <div
        style={{
          height: 120,
          overflow: "hidden",
          position: "relative",
          background: coverImage
            ? "transparent"
            : generateGradient(sectionType, page.id),
          flexShrink: 0,
        }}
      >
        {coverImage ? (
          <img
            src={coverImage}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Decorative icon */}
            {sectionType === "trading" && (
              <div style={{ opacity: 0.25 }}>
                {meta.direction === "long" ? (
                  <TrendingUp size={32} color="#22d3ee" />
                ) : meta.direction === "short" ? (
                  <TrendingDown size={32} color="#f87171" />
                ) : (
                  <DollarSign size={32} color="#22d3ee" />
                )}
              </div>
            )}
            {sectionType === "expense" && (
              <DollarSign size={32} color="#f472b6" style={{ opacity: 0.25 }} />
            )}
            {(sectionType === "general" || sectionType === "custom") && (
              <FileText size={28} color="rgba(255,255,255,0.15)" />
            )}
          </div>
        )}

        {/* Status badge overlay */}
        <div style={{ position: "absolute", top: 8, right: 8 }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: 8,
              color: statusColor,
              background: statusColor + "20",
              border: `0.5px solid ${statusColor}40`,
              backdropFilter: "blur(4px)",
            }}
          >
            {page.status}
          </span>
        </div>

        {/* PnL overlay for trading */}
        {sectionType === "trading" &&
          page.pnl !== null &&
          page.pnl !== undefined && (
            <div style={{ position: "absolute", bottom: 8, left: 8 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "monospace",
                  color: page.pnl > 0 ? "#34d399" : "#f87171",
                  background: "rgba(0,0,0,0.6)",
                  backdropFilter: "blur(4px)",
                  border: `0.5px solid ${page.pnl > 0 ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
                  borderRadius: 6,
                  padding: "3px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <DollarSign size={9} />
                {page.pnl > 0 ? "+" : ""}
                {page.pnl.toFixed(2)}
              </span>
            </div>
          )}

        {/* Amount overlay for expense */}
        {sectionType === "expense" &&
          page.amount !== null &&
          page.amount !== undefined && (
            <div style={{ position: "absolute", bottom: 8, left: 8 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "monospace",
                  color: "#f472b6",
                  background: "rgba(0,0,0,0.6)",
                  backdropFilter: "blur(4px)",
                  border: "0.5px solid rgba(236,72,153,0.3)",
                  borderRadius: 6,
                  padding: "3px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <DollarSign size={9} />
                {page.amount.toFixed(2)}
              </span>
            </div>
          )}
      </div>

      {/* Content */}
      <div
        style={{
          padding: "12px 14px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "rgba(255,255,255,0.85)",
            lineHeight: 1.3,
          }}
        >
          {page.title || "Untitled"}
        </div>

        {/* Trading meta */}
        {sectionType === "trading" && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {meta.direction && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: meta.direction === "long" ? "#34d399" : "#f87171",
                  background:
                    meta.direction === "long"
                      ? "rgba(52,211,153,0.1)"
                      : "rgba(248,113,113,0.1)",
                  border: `0.5px solid ${meta.direction === "long" ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`,
                  borderRadius: 4,
                  padding: "1px 5px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                {meta.direction === "long" ? (
                  <TrendingUp size={7} />
                ) : (
                  <TrendingDown size={7} />
                )}
                {String(meta.direction)}
              </span>
            )}
            {page.category && (
              <span
                style={{
                  fontSize: 9,
                  color: "rgba(192,132,252,0.7)",
                  background: "rgba(168,85,247,0.08)",
                  border: "0.5px solid rgba(168,85,247,0.2)",
                  borderRadius: 4,
                  padding: "1px 5px",
                }}
              >
                {page.category}
              </span>
            )}
          </div>
        )}

        {/* Expense meta */}
        {sectionType === "expense" && page.category && (
          <span
            style={{
              fontSize: 10,
              color: "rgba(192,132,252,0.7)",
              background: "rgba(168,85,247,0.08)",
              border: "0.5px solid rgba(168,85,247,0.2)",
              borderRadius: 4,
              padding: "2px 7px",
              alignSelf: "flex-start",
            }}
          >
            {page.category}
          </span>
        )}

        {/* Text preview */}
        {preview && (
          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.3)",
              lineHeight: 1.5,
              flex: 1,
            }}
          >
            {preview}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 4,
          }}
        >
          {/* Tags */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {page.tags?.slice(0, 2).map((pt) => (
              <span
                key={pt.tagId}
                style={{
                  fontSize: 9,
                  padding: "1px 5px",
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

          <span
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Calendar size={8} />
            {new Date(page.updatedAt).toLocaleDateString("vi-VN")}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function GalleryView() {
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

  const [filterGroup, setFilterGroup] = useState<FilterGroup>({
    logic: "AND",
    rules: [],
  });
  const [showFilter, setShowFilter] = useState(false);
  const [cols, setCols] = useState<2 | 3 | 4>(3);

  const filtered = applyFilters(sectionPages, filterGroup);
  const activeFilter = filterGroup.rules.length > 0;

  const handleCreate = async () => {
    if (!activeSectionId) return;
    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Untitled",
        content: "",
        sectionId: activeSectionId,
      }),
    });
    const newPage = await res.json();
    addPage(newPage);
    setActivePageId(newPage.id);
  };

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

        {/* Column switcher */}
        <div style={{ display: "flex", gap: 2 }}>
          {([2, 3, 4] as const).map((n) => (
            <button
              key={n}
              onClick={() => setCols(n)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                cursor: "pointer",
                background:
                  cols === n ? "rgba(34,211,238,0.12)" : "transparent",
                border: `0.5px solid ${cols === n ? "rgba(34,211,238,0.35)" : "rgba(255,255,255,0.08)"}`,
                color: cols === n ? "#22d3ee" : "rgba(255,255,255,0.3)",
                fontSize: 11,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {n}
            </button>
          ))}
        </div>

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

        <button
          onClick={handleCreate}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            padding: "5px 12px",
            borderRadius: 7,
            border: "0.5px solid rgba(34,211,238,0.25)",
            background: "rgba(34,211,238,0.08)",
            color: "#22d3ee",
            cursor: "pointer",
          }}
        >
          <Plus size={12} />
          Thêm
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

      {/* Grid */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 14,
          alignContent: "start",
        }}
      >
        {filtered.map((page) => (
          <GalleryCard
            key={page.id}
            page={page}
            sectionType={sectionType}
            isActive={activePageId === page.id}
            onClick={() => setActivePageId(page.id)}
          />
        ))}

        {filtered.length === 0 && (
          <div
            style={{
              gridColumn: `1 / span ${cols}`,
              textAlign: "center",
              padding: "60px 0",
              color: "rgba(255,255,255,0.15)",
              fontSize: 13,
            }}
          >
            Không có dữ liệu
          </div>
        )}
      </div>
    </div>
  );
}
