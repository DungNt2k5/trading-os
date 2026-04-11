"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore, Page, parseMeta } from "@/store/useAppStore";
import { applyFilters, FilterGroup } from "@/components/filters/FilterBuilder";
import FilterBuilder from "@/components/filters/FilterBuilder";
import {
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Trash2,
  MoreHorizontal,
  Tag,
  Calendar,
  Hash,
  DollarSign,
  AlignLeft,
  Circle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type SortDir = "asc" | "desc" | null;

interface ColDef {
  id: string;
  label: string;
  icon: React.ReactNode;
  width: number;
  field: keyof Page | "tags";
  visible: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  active: "#00ff9f",
  archived: "#555",
  done: "#60a5fa",
  draft: "#a78bfa",
  "in-progress": "#fbbf24",
};

function fmt(val: unknown, field: string): React.ReactNode {
  if (val === null || val === undefined || val === "")
    return <span style={{ color: "rgba(255,255,255,0.1)" }}>—</span>;

  if (field === "status") {
    const c = STATUS_COLOR[String(val)] ?? "#888";
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: 11,
          color: c,
          background: c + "18",
          border: `0.5px solid ${c}40`,
          borderRadius: 5,
          padding: "2px 8px",
          fontWeight: 600,
        }}
      >
        <Circle size={5} style={{ fill: c }} />
        {String(val)}
      </span>
    );
  }
  if (field === "pnl") {
    const n = parseFloat(String(val));
    const c = n > 0 ? "#34d399" : n < 0 ? "#f87171" : "#666";
    return (
      <span
        style={{
          color: c,
          fontFamily: "monospace",
          fontWeight: 700,
          fontSize: 12,
        }}
      >
        {n > 0 ? "+" : ""}
        {n.toFixed(2)}
      </span>
    );
  }
  if (field === "amount") {
    return (
      <span style={{ color: "#f472b6", fontFamily: "monospace", fontSize: 12 }}>
        ${parseFloat(String(val)).toFixed(2)}
      </span>
    );
  }
  if (field === "createdAt" || field === "updatedAt") {
    return (
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
        {new Date(String(val)).toLocaleDateString("vi-VN")}
      </span>
    );
  }
  return (
    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
      {String(val)}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function TableView() {
  const {
    pages,
    sections,
    activeSectionId,
    activePageId,
    setActivePageId,
    updatePage,
    removePage,
  } = useAppStore();
  const activeSection = sections.find((s) => s.id === activeSectionId);
  const sectionType = activeSection?.type ?? "general";
  const sectionPages = pages.filter((p) => p.sectionId === activeSectionId);

  // ── Column config ─────────────────────────────────────────────────────────

  const defaultCols: ColDef[] = [
    {
      id: "title",
      label: "Tên",
      icon: <AlignLeft size={11} />,
      width: 260,
      field: "title",
      visible: true,
    },
    {
      id: "status",
      label: "Trạng thái",
      icon: <Circle size={11} />,
      width: 130,
      field: "status",
      visible: true,
    },
    {
      id: "tags",
      label: "Tags",
      icon: <Tag size={11} />,
      width: 160,
      field: "tags",
      visible: true,
    },
    {
      id: "category",
      label: "Category",
      icon: <Hash size={11} />,
      width: 130,
      field: "category",
      visible: true,
    },
    ...(sectionType === "trading"
      ? [
          {
            id: "pnl",
            label: "PnL",
            icon: <DollarSign size={11} />,
            width: 110,
            field: "pnl" as keyof Page,
            visible: true,
          },
        ]
      : []),
    ...(sectionType === "expense"
      ? [
          {
            id: "amount",
            label: "Số tiền",
            icon: <DollarSign size={11} />,
            width: 120,
            field: "amount" as keyof Page,
            visible: true,
          },
        ]
      : []),
    {
      id: "createdAt",
      label: "Ngày tạo",
      icon: <Calendar size={11} />,
      width: 120,
      field: "createdAt",
      visible: true,
    },
  ];

  const [cols] = useState<ColDef[]>(defaultCols);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [filterGroup, setFilterGroup] = useState<FilterGroup>({
    logic: "AND",
    rules: [],
  });
  const [showFilter, setShowFilter] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [editCell, setEditCell] = useState<{
    pageId: string;
    field: string;
  } | null>(null);
  const [editVal, setEditVal] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuId]);

  // ── Sort + filter ─────────────────────────────────────────────────────────

  let displayed = applyFilters(sectionPages, filterGroup);
  if (sortField && sortDir) {
    displayed = [...displayed].sort((a, b) => {
      const av = a[sortField as keyof Page] ?? "";
      const bv = b[sortField as keyof Page] ?? "";
      const cmp = String(av).localeCompare(String(bv), undefined, {
        numeric: true,
      });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }

  const handleSort = (field: string) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDir("asc");
      return;
    }
    if (sortDir === "asc") {
      setSortDir("desc");
      return;
    }
    setSortField(null);
    setSortDir(null);
  };

  // ── Inline edit ───────────────────────────────────────────────────────────

  const startEdit = (pageId: string, field: string, currentVal: unknown) => {
    if (field === "tags" || field === "createdAt" || field === "updatedAt")
      return;
    setEditCell({ pageId, field });
    setEditVal(
      currentVal !== null && currentVal !== undefined ? String(currentVal) : "",
    );
  };

  const commitEdit = async () => {
    if (!editCell) return;
    const { pageId, field } = editCell;
    const numFields = ["pnl", "amount"];
    const val = numFields.includes(field)
      ? editVal === ""
        ? null
        : parseFloat(editVal)
      : editVal || null;
    const res = await fetch(`/api/pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: val }),
    });
    const updated = await res.json();
    updatePage(pageId, updated);
    setEditCell(null);
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    setMenuId(null);
    if (!confirm("Xóa page này?")) return;
    await fetch(`/api/pages/${id}`, { method: "DELETE" });
    removePage(id);
    if (activePageId === id) setActivePageId(null);
  };

  // ── Create ────────────────────────────────────────────────────────────────

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
    useAppStore.getState().addPage(newPage);
    setActivePageId(newPage.id);
  };

  const visibleCols = cols.filter((c) => c.visible);
  const activeFilter = filterGroup.rules.length > 0;

  return (
    /* FIX: wrapper chiếm full width + full height của container cha */
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* ── Toolbar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 20px",
          borderBottom: "0.5px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.2)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.3)",
            marginRight: "auto",
          }}
        >
          {displayed.length} / {sectionPages.length} bản ghi
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
          <Plus size={12} /> Thêm
        </button>
      </div>

      {/* ── Filter panel ── */}
      {showFilter && (
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "0.5px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
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

      {/* ── Table wrapper — FIX: flex:1 + minHeight:0 + overflow:auto ── */}
      <div
        style={{ flex: 1, minHeight: 0, overflowX: "auto", overflowY: "auto" }}
      >
        <table
          style={{
            /* FIX: width:100% trước, chỉ dùng min-width để tránh bị bóp khi cột nhiều */
            width: "100%",
            minWidth: 700,
            borderCollapse: "collapse",
            tableLayout: "auto",
          }}
        >
          {/* ── Head ── */}
          <thead>
            <tr
              style={{
                borderBottom: "0.5px solid rgba(255,255,255,0.08)",
                position: "sticky",
                top: 0,
                zIndex: 10,
                background: "rgba(8,8,14,0.97)",
              }}
            >
              {visibleCols.map((col) => {
                const isSort = sortField === col.field;
                return (
                  <th
                    key={col.id}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      fontSize: 11,
                      color: isSort
                        ? "rgba(34,211,238,0.8)"
                        : "rgba(255,255,255,0.3)",
                      fontWeight: 500,
                      cursor: "pointer",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                    }}
                    onClick={() => handleSort(String(col.field))}
                  >
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 5 }}
                    >
                      <span style={{ opacity: 0.6 }}>{col.icon}</span>
                      {col.label}
                      {isSort ? (
                        sortDir === "asc" ? (
                          <ArrowUp size={10} />
                        ) : (
                          <ArrowDown size={10} />
                        )
                      ) : (
                        <ArrowUpDown size={10} style={{ opacity: 0.3 }} />
                      )}
                    </span>
                  </th>
                );
              })}
              <th style={{ width: 40 }} />
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody>
            {displayed.length === 0 && (
              <tr>
                <td
                  colSpan={visibleCols.length + 1}
                  style={{
                    textAlign: "center",
                    padding: "48px",
                    color: "rgba(255,255,255,0.15)",
                    fontSize: 13,
                  }}
                >
                  Không có dữ liệu
                </td>
              </tr>
            )}

            {displayed.map((page) => {
              const isActive = activePageId === page.id;
              return (
                <tr
                  key={page.id}
                  onClick={() => setActivePageId(page.id)}
                  style={{
                    borderBottom: "0.5px solid rgba(255,255,255,0.04)",
                    background: isActive
                      ? "rgba(34,211,238,0.05)"
                      : "transparent",
                    cursor: "pointer",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(255,255,255,0.025)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                  }}
                >
                  {visibleCols.map((col) => {
                    const field = String(col.field);
                    const isEditing =
                      editCell?.pageId === page.id && editCell.field === field;
                    const rawVal =
                      field === "tags"
                        ? page.tags?.map((pt) => pt.tag.name).join(", ")
                        : page[col.field as keyof Page];

                    return (
                      <td
                        key={col.id}
                        style={{
                          padding: "0 12px",
                          height: 38,
                          overflow: "hidden",
                          maxWidth: col.width,
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          startEdit(page.id, field, rawVal);
                        }}
                      >
                        {/* Tags */}
                        {field === "tags" && !isEditing && (
                          <div
                            style={{
                              display: "flex",
                              gap: 4,
                              flexWrap: "wrap",
                            }}
                          >
                            {page.tags?.slice(0, 3).map((pt) => (
                              <span
                                key={pt.tagId}
                                style={{
                                  fontSize: 10,
                                  padding: "1px 7px",
                                  borderRadius: 10,
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

                        {/* Editable cell */}
                        {field !== "tags" && isEditing && (
                          <input
                            autoFocus
                            value={editVal}
                            onChange={(e) => setEditVal(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEdit();
                              if (e.key === "Escape") setEditCell(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              width: "100%",
                              background: "rgba(34,211,238,0.08)",
                              border: "0.5px solid rgba(34,211,238,0.4)",
                              borderRadius: 5,
                              color: "#22d3ee",
                              fontSize: 13,
                              padding: "3px 7px",
                              outline: "none",
                            }}
                          />
                        )}

                        {/* Display */}
                        {field !== "tags" && !isEditing && fmt(rawVal, field)}
                      </td>
                    );
                  })}

                  {/* Actions */}
                  <td style={{ padding: "0 6px", textAlign: "right" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuId(page.id);
                        setMenuPos({ x: e.clientX, y: e.clientY });
                      }}
                      className="row-menu-btn"
                      style={{
                        color: "rgba(255,255,255,0.2)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 4,
                        opacity: 0,
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.opacity = "1")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.opacity = "0")
                      }
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Context menu ── */}
      {menuId && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: menuPos.y,
            left: menuPos.x,
            zIndex: 999,
            background: "rgba(10,10,15,0.97)",
            border: "0.5px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: "4px 0",
            minWidth: 150,
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
          }}
        >
          <button
            onClick={() => {
              setActivePageId(menuId);
              setMenuId(null);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "7px 14px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              color: "rgba(255,255,255,0.65)",
            }}
          >
            Mở
          </button>
          <button
            onClick={() => handleDelete(menuId)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "7px 14px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              color: "rgba(239,68,68,0.7)",
            }}
          >
            <Trash2 size={12} /> Xóa
          </button>
        </div>
      )}

      <style>{`.row-menu-btn { opacity: 0 } tr:hover .row-menu-btn { opacity: 1 }`}</style>
    </div>
  );
}
