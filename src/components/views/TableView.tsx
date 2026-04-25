"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore, Page } from "@/store/useAppStore";
import { applyFilters, FilterGroup } from "@/components/filters/FilterBuilder";
import FilterBuilder from "@/components/filters/FilterBuilder";
import {
  STATUS_LIST,
  STATUS_COLOR,
  type PageStatus,
} from "@/components/PageEditor";
import {
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Trash2,
  Copy,
  MoreHorizontal,
  Tag,
  Calendar,
  Hash,
  DollarSign,
  AlignLeft,
  Circle,
  ExternalLink,
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
  editable: boolean;
}

interface MenuPos {
  x: number;
  y: number;
  alignRight: boolean; // true = render sang trái từ điểm click
  alignTop: boolean; // true = render lên trên từ điểm click
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<
  string,
  { color: string; bg: string; border: string }
> = {
  active: {
    color: "#00ff9f",
    bg: "rgba(0,255,159,0.1)",
    border: "rgba(0,255,159,0.25)",
  },
  "in-progress": {
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.1)",
    border: "rgba(251,191,36,0.25)",
  },
  done: {
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.1)",
    border: "rgba(96,165,250,0.25)",
  },
  draft: {
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.1)",
    border: "rgba(167,139,250,0.25)",
  },
  archived: {
    color: "#666",
    bg: "rgba(100,100,100,0.1)",
    border: "rgba(100,100,100,0.25)",
  },
};

// Đủ 5 trạng thái
const STATUS_CYCLE = ["active", "in-progress", "done", "draft", "archived"];
function cycleStatus(current: string): string {
  const idx = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

// ── Cell renderer ─────────────────────────────────────────────────────────────

function fmt(val: unknown, field: string): React.ReactNode {
  if (val === null || val === undefined || val === "")
    return <span style={{ color: "rgba(255,255,255,0.1)" }}>—</span>;

  if (field === "status") {
    const cfg = STATUS_CFG[String(val)] ?? STATUS_CFG.active;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: 11,
          color: cfg.color,
          background: cfg.bg,
          border: `0.5px solid ${cfg.border}`,
          borderRadius: 5,
          padding: "2px 8px",
          fontWeight: 600,
        }}
      >
        <Circle size={5} style={{ fill: cfg.color }} />
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

// ── Inline edit cell ──────────────────────────────────────────────────────────

function InlineCell({
  value,
  field,
  onCommit,
  onClick,
}: {
  value: unknown;
  field: string;
  onCommit: (v: string) => void;
  onClick?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(value ?? ""));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);
  useEffect(() => {
    if (!editing) setVal(String(value ?? ""));
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    if (val !== String(value ?? "")) onCommit(val);
  };

  // Status: click để cycle
  if (field === "status") {
    const cfg = STATUS_CFG[String(value)] ?? STATUS_CFG.active;
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCommit(cycleStatus(String(value)));
        }}
        title="Click để đổi trạng thái"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: 11,
          color: cfg.color,
          background: cfg.bg,
          border: `0.5px solid ${cfg.border}`,
          borderRadius: 5,
          padding: "2px 8px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.12s",
        }}
      >
        <Circle size={5} style={{ fill: cfg.color }} />
        {String(value || "active")}
      </button>
    );
  }

  // Non-editable
  if (field === "createdAt" || field === "updatedAt" || field === "tags") {
    return <>{fmt(value, field)}</>;
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={field === "pnl" || field === "amount" ? "number" : "text"}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setVal(String(value ?? ""));
            setEditing(false);
          }
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
    );
  }

  return (
    <span
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      title={
        field === "title"
          ? "Click để mở · Double-click để sửa"
          : "Double-click để sửa"
      }
      style={{ display: "block", cursor: "default", userSelect: "none" }}
    >
      {fmt(value, field)}
    </span>
  );
}

// ── Smart menu position ───────────────────────────────────────────────────────

const MENU_W = 170; // minWidth của menu
const MENU_H = 130; // ước tính chiều cao menu (3 items)

function calcMenuPos(clientX: number, clientY: number): MenuPos {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    x: clientX,
    y: clientY,
    alignRight: clientX + MENU_W > vw - 12, // gần mép phải → render sang trái
    alignTop: clientY + MENU_H > vh - 12, // gần mép dưới → render lên trên
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

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

  const defaultCols: ColDef[] = [
    {
      id: "title",
      label: "Tên",
      icon: <AlignLeft size={11} />,
      width: 260,
      field: "title",
      visible: true,
      editable: true,
    },
    {
      id: "status",
      label: "Trạng thái",
      icon: <Circle size={11} />,
      width: 130,
      field: "status",
      visible: true,
      editable: true,
    },
    {
      id: "tags",
      label: "Tags",
      icon: <Tag size={11} />,
      width: 160,
      field: "tags",
      visible: true,
      editable: false,
    },
    {
      id: "category",
      label: "Category",
      icon: <Hash size={11} />,
      width: 130,
      field: "category",
      visible: true,
      editable: true,
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
            editable: true,
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
            editable: true,
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
      editable: false,
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
  const [menuPos, setMenuPos] = useState<MenuPos>({
    x: 0,
    y: 0,
    alignRight: false,
    alignTop: false,
  });
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

  // Sort + filter
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

  const commitField = async (pageId: string, field: string, rawVal: string) => {
    const numFields = ["pnl", "amount"];
    const val = numFields.includes(field)
      ? rawVal === ""
        ? null
        : parseFloat(rawVal)
      : rawVal || null;
    const res = await fetch(`/api/pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: val }),
    });
    updatePage(pageId, await res.json());
  };

  const handleDelete = async (id: string) => {
    setMenuId(null);
    if (!confirm("Xóa page này?")) return;
    await fetch(`/api/pages/${id}`, { method: "DELETE" });
    removePage(id);
    if (activePageId === id) setActivePageId(null);
  };

  const handleDuplicate = async (id: string) => {
    setMenuId(null);
    const res = await fetch(`/api/pages/${id}?action=duplicate`, {
      method: "POST",
    });
    if (!res.ok) return;
    const copy = await res.json();
    useAppStore.getState().addPage(copy);
    setActivePageId(copy.id);
  };

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

  // ── Open context menu với smart positioning ───────────────────────────────
  const openMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMenuId(id);
    setMenuPos(calcMenuPos(e.clientX, e.clientY));
  };

  const visibleCols = cols.filter((c) => c.visible);
  const activeFilter = filterGroup.rules.length > 0;

  return (
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
      {/* Toolbar */}
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
        <span
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.15)",
            marginRight: 6,
          }}
        >
          Double-click ô để sửa trực tiếp
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

      {/* Table */}
      <div
        style={{ flex: 1, minHeight: 0, overflowX: "auto", overflowY: "auto" }}
      >
        <table
          style={{
            width: "100%",
            minWidth: 700,
            borderCollapse: "collapse",
            tableLayout: "auto",
          }}
        >
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
                    onClick={() => handleSort(String(col.field))}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      fontSize: 11,
                      userSelect: "none",
                      whiteSpace: "nowrap",
                      color: isSort
                        ? "rgba(34,211,238,0.8)"
                        : "rgba(255,255,255,0.3)",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
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
              <th style={{ width: 60, padding: "8px 6px" }}>
                <span
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.2)",
                    fontWeight: 400,
                  }}
                >
                  Thao tác
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 && (
              <tr>
                <td
                  colSpan={visibleCols.length + 1}
                  style={{
                    textAlign: "center",
                    padding: 48,
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
                  style={{
                    borderBottom: "0.5px solid rgba(255,255,255,0.04)",
                    background: isActive
                      ? "rgba(34,211,238,0.05)"
                      : "transparent",
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
                      >
                        {field === "tags" ? (
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
                            {page.tags && page.tags.length > 3 && (
                              <span
                                style={{
                                  fontSize: 10,
                                  color: "rgba(255,255,255,0.3)",
                                }}
                              >
                                +{page.tags.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <InlineCell
                            value={rawVal}
                            field={field}
                            onCommit={(val) => commitField(page.id, field, val)}
                            onClick={
                              field === "title"
                                ? () => setActivePageId(page.id)
                                : undefined
                            }
                          />
                        )}
                      </td>
                    );
                  })}

                  {/* Actions */}
                  <td style={{ padding: "0 6px", textAlign: "right" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: 2,
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePageId(page.id);
                        }}
                        className="row-action-btn"
                        title="Mở editor"
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "rgba(34,211,238,0.4)",
                          padding: 4,
                          borderRadius: 5,
                          display: "flex",
                          opacity: 0,
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.color =
                            "#22d3ee";
                          (e.currentTarget as HTMLElement).style.background =
                            "rgba(34,211,238,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.color =
                            "rgba(34,211,238,0.4)";
                          (e.currentTarget as HTMLElement).style.background =
                            "transparent";
                        }}
                      >
                        <ExternalLink size={12} />
                      </button>
                      <button
                        onClick={(e) => openMenu(e, page.id)}
                        className="row-action-btn"
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "rgba(255,255,255,0.2)",
                          padding: 4,
                          borderRadius: 5,
                          display: "flex",
                          opacity: 0,
                        }}
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Context menu với smart positioning ── */}
      {menuId && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            // Nếu gần mép phải: dịch trái MENU_W px; ngược lại render bình thường
            left: menuPos.alignRight ? menuPos.x - MENU_W : menuPos.x,
            // Nếu gần mép dưới: dịch lên MENU_H px; ngược lại render bình thường
            top: menuPos.alignTop ? menuPos.y - MENU_H : menuPos.y,
            zIndex: 9999,
            background: "rgba(10,10,15,0.97)",
            border: "0.5px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: "4px 0",
            minWidth: MENU_W,
            boxShadow: "0 8px 24px rgba(0,0,0,0.7)",
            backdropFilter: "blur(12px)",
          }}
        >
          {[
            {
              label: "Mở editor",
              icon: <ExternalLink size={12} />,
              color: "rgba(255,255,255,0.65)",
              action: () => {
                setActivePageId(menuId);
                setMenuId(null);
              },
            },
            {
              label: "Duplicate",
              icon: <Copy size={12} />,
              color: "rgba(255,255,255,0.65)",
              action: () => handleDuplicate(menuId),
            },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
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
                color: item.color,
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background =
                  "rgba(255,255,255,0.05)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background =
                  "transparent")
              }
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <div
            style={{
              height: "0.5px",
              background: "rgba(255,255,255,0.06)",
              margin: "3px 0",
            }}
          />
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
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background =
                "rgba(239,68,68,0.06)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background =
                "transparent")
            }
          >
            <Trash2 size={12} /> Xóa
          </button>
        </div>
      )}

      <style>{`
        tr:hover .row-action-btn { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
