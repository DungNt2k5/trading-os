"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Editor } from "@tiptap/react";
import {
  Trash2,
  ArrowLeft,
  ArrowRight,
  Plus,
  Pencil,
  Table2,
  MoreHorizontal,
  Copy,
  Star,
  Archive,
} from "lucide-react";

interface TableToolbarProps {
  editor: Editor;
}

// ─── Separator ────────────────────────────────────────────────────────────────
function Sep() {
  return (
    <div
      style={{
        height: "0.5px",
        width: 20,
        background: "rgba(255,255,255,0.08)",
        margin: "2px auto",
        flexShrink: 0,
      }}
    />
  );
}

// ─── Icon Button ──────────────────────────────────────────────────────────────
function Btn({
  icon,
  label,
  onClick,
  danger,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  active?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      title={label}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 26,
        height: 26,
        borderRadius: 6,
        border: `0.5px solid ${
          hov
            ? danger
              ? "rgba(239,68,68,0.3)"
              : active
                ? "rgba(34,211,238,0.4)"
                : "rgba(255,255,255,0.15)"
            : "transparent"
        }`,
        background: hov
          ? danger
            ? "rgba(239,68,68,0.1)"
            : active
              ? "rgba(34,211,238,0.12)"
              : "rgba(255,255,255,0.06)"
          : active
            ? "rgba(34,211,238,0.08)"
            : "transparent",
        color: danger
          ? hov
            ? "#f87171"
            : "rgba(248,113,113,0.55)"
          : active
            ? "#22d3ee"
            : hov
              ? "rgba(255,255,255,0.85)"
              : "rgba(255,255,255,0.4)",
        cursor: "pointer",
        transition: "all 0.12s",
        flexShrink: 0,
      }}
    >
      {icon}
    </button>
  );
}

// ─── Row Action Dropdown ───────────────────────────────────────────────────────
const ROW_ACTIONS = [
  {
    key: "edit",
    label: "Edit row",
    icon: Pencil,
    color: "rgba(255,255,255,0.7)",
    hoverColor: "#22d3ee",
    hoverBg: "rgba(34,211,238,0.07)",
  },
  {
    key: "duplicate",
    label: "Duplicate row",
    icon: Copy,
    color: "rgba(255,255,255,0.7)",
    hoverColor: "#a78bfa",
    hoverBg: "rgba(167,139,250,0.07)",
  },
  {
    key: "favourite",
    label: "Add to favourites",
    icon: Star,
    color: "rgba(255,255,255,0.7)",
    hoverColor: "#fbbf24",
    hoverBg: "rgba(251,191,36,0.07)",
  },
  {
    key: "archive",
    label: "Archive row",
    icon: Archive,
    color: "rgba(255,255,255,0.7)",
    hoverColor: "#60a5fa",
    hoverBg: "rgba(96,165,250,0.07)",
  },
  { key: "divider" },
  {
    key: "delete",
    label: "Delete row",
    icon: Trash2,
    color: "rgba(248,113,113,0.6)",
    hoverColor: "#f87171",
    hoverBg: "rgba(239,68,68,0.08)",
    danger: true,
  },
] as const;

function RowActionDropdown({
  onAction,
  onClose,
}: {
  onAction: (key: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovKey, setHovKey] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    // slight delay so the onMouseDown that opened this doesn't immediately close it
    const t = setTimeout(
      () => document.addEventListener("mousedown", handler),
      50,
    );
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: "100%",
        right: 0,
        marginTop: 4,
        zIndex: 9999,
        background: "rgba(8,8,14,0.98)",
        border: "0.5px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        padding: "4px 0",
        minWidth: 180,
        boxShadow: "0 8px 28px rgba(0,0,0,0.75), 0 0 0 1px rgba(0,0,0,0.5)",
        backdropFilter: "blur(16px)",
      }}
    >
      {ROW_ACTIONS.map((action, i) => {
        if (action.key === "divider") {
          return (
            <div
              key={i}
              style={{
                height: "0.5px",
                background: "rgba(255,255,255,0.07)",
                margin: "4px 0",
              }}
            />
          );
        }
        const isHov = hovKey === action.key;
        const Icon = action.icon!;
        return (
          <button
            key={action.key}
            onMouseEnter={() => setHovKey(action.key)}
            onMouseLeave={() => setHovKey(null)}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAction(action.key);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              width: "100%",
              padding: "7px 13px",
              background: isHov ? action.hoverBg : "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 12.5,
              color: isHov ? action.hoverColor : action.color,
              textAlign: "left",
              transition: "all 0.1s",
            }}
          >
            <Icon
              size={13}
              style={{ flexShrink: 0, opacity: isHov ? 1 : 0.7 }}
            />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Row Action Bar (float bottom khi select >= 1 hàng) ───────────────────────
function RowActionBar({
  count,
  onDelete,
  onClear,
}: {
  count: number;
  onDelete: () => void;
  onClear: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 36,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 16px",
        borderRadius: 12,
        background: "rgba(8,8,14,0.97)",
        border: "0.5px solid rgba(34,211,238,0.22)",
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.75), 0 0 0 1px rgba(0,0,0,0.6), inset 0 1px 0 rgba(34,211,238,0.1)",
        backdropFilter: "blur(16px)",
        userSelect: "none",
      }}
    >
      <span
        style={{ fontSize: 12, color: "rgba(34,211,238,0.8)", fontWeight: 600 }}
      >
        {count} hàng đã chọn
      </span>
      <div
        style={{
          width: "0.5px",
          height: 16,
          background: "rgba(255,255,255,0.1)",
          flexShrink: 0,
        }}
      />
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          onDelete();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 12px",
          borderRadius: 7,
          background: "rgba(239,68,68,0.1)",
          border: "0.5px solid rgba(239,68,68,0.28)",
          color: "#f87171",
          fontSize: 12,
          cursor: "pointer",
          fontWeight: 500,
          transition: "all 0.12s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(239,68,68,0.2)";
          e.currentTarget.style.borderColor = "rgba(239,68,68,0.45)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(239,68,68,0.1)";
          e.currentTarget.style.borderColor = "rgba(239,68,68,0.28)";
        }}
      >
        <Trash2 size={12} />
        Xóa {count} hàng
      </button>
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          onClear();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "5px 10px",
          borderRadius: 7,
          background: "transparent",
          border: "0.5px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.4)",
          fontSize: 12,
          cursor: "pointer",
          transition: "all 0.12s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          e.currentTarget.style.color = "rgba(255,255,255,0.7)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "rgba(255,255,255,0.4)";
        }}
      >
        Bỏ chọn
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TableToolbar({ editor }: TableToolbarProps) {
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });

  const [addColPos, setAddColPos] = useState({ top: 0, left: 0, height: 0 });
  const [addColVisible, setAddColVisible] = useState(false);
  const [hovAddCol, setHovAddCol] = useState(false);

  const [newRowPos, setNewRowPos] = useState({ top: 0, left: 0, width: 0 });
  const [newRowVisible, setNewRowVisible] = useState(false);
  const [hovNewRow, setHovNewRow] = useState(false);

  // ── Row selection ──────────────────────────────────────────────────────────
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // ── Dropdown open per row ──────────────────────────────────────────────────
  const [openDropdownRow, setOpenDropdownRow] = useState<number | null>(null);

  // ── Row overlays ───────────────────────────────────────────────────────────
  const [rowOverlays, setRowOverlays] = useState<
    Array<{ top: number; height: number; rowIndex: number; isHeader: boolean }>
  >([]);

  // ─── Get table element ─────────────────────────────────────────────────────
  const getTableEl = useCallback((): HTMLElement | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    let el: HTMLElement | null = sel.getRangeAt(0)
      .startContainer as HTMLElement;
    if (el.nodeType === Node.TEXT_NODE) el = el.parentElement;
    while (el && el.tagName !== "TABLE") el = el?.parentElement ?? null;
    return el;
  }, []);

  // ─── Update all positions ──────────────────────────────────────────────────
  const updatePositions = useCallback(
    (tableEl?: HTMLElement | null) => {
      if (!editor.isActive("table")) {
        setAddColVisible(false);
        setNewRowVisible(false);
        setToolbarVisible(false);
        setRowOverlays([]);
        return;
      }

      const tEl = tableEl ?? getTableEl();
      if (!tEl) return;
      const editorEl = tEl.closest(".tiptap-editor") as HTMLElement | null;
      if (!editorEl) return;

      const tRect = tEl.getBoundingClientRect();
      const eRect = editorEl.getBoundingClientRect();

      setAddColPos({
        top: tRect.top - eRect.top,
        left: tRect.right - eRect.left + 4,
        height: tRect.height,
      });
      setAddColVisible(true);

      setNewRowPos({
        top: tRect.bottom - eRect.top + 4,
        left: tRect.left - eRect.left,
        width: tRect.width,
      });
      setNewRowVisible(true);

      setToolbarPos({
        top: tRect.top - eRect.top,
        left: tRect.right - eRect.left + 30,
      });

      const rows = Array.from(
        tEl.querySelectorAll("tr"),
      ) as HTMLTableRowElement[];
      const overlays = rows.map((tr, idx) => {
        const rRect = tr.getBoundingClientRect();
        return {
          top: rRect.top - eRect.top,
          height: rRect.height,
          rowIndex: idx,
          isHeader:
            tr.querySelectorAll("th").length > 0 &&
            tr.querySelectorAll("td").length === 0,
        };
      });
      setRowOverlays(overlays);
    },
    [editor, getTableEl],
  );

  // ─── Click inside editor ───────────────────────────────────────────────────
  const handleEditorClick = useCallback(
    (e: MouseEvent) => {
      const cell = (e.target as HTMLElement).closest("td, th");
      if (!cell) {
        setToolbarVisible(false);
        return;
      }
      setTimeout(() => {
        if (!editor.isActive("table")) {
          setToolbarVisible(false);
          return;
        }
        const tableEl = (cell as HTMLElement).closest(
          "table",
        ) as HTMLElement | null;
        updatePositions(tableEl);
        setToolbarVisible(true);
      }, 10);
    },
    [editor, updatePositions],
  );

  useEffect(() => {
    editor.on("selectionUpdate", () => updatePositions());
    editor.on("transaction", () => updatePositions());
    return () => {
      editor.off("selectionUpdate", () => updatePositions());
      editor.off("transaction", () => updatePositions());
    };
  }, [editor, updatePositions]);

  useEffect(() => {
    const pm = document.querySelector(".tiptap-editor .ProseMirror");
    if (!pm) return;
    pm.addEventListener("click", handleEditorClick as EventListener);
    return () =>
      pm.removeEventListener("click", handleEditorClick as EventListener);
  }, [handleEditorClick]);

  // ─── Xóa các hàng đã chọn ─────────────────────────────────────────────────
  const deleteSelectedRows = useCallback(() => {
    const sorted = Array.from(selectedRows).sort((a, b) => b - a);
    const tableEl =
      getTableEl() ??
      (document.querySelector(".tiptap-editor table") as HTMLElement | null);
    if (!tableEl) return;

    for (const rowIdx of sorted) {
      const rows = tableEl.querySelectorAll("tr");
      const targetRow = rows[rowIdx];
      if (!targetRow) continue;
      const firstCell = targetRow.querySelector("td, th");
      if (!firstCell) continue;
      try {
        const pos = editor.view.posAtDOM(firstCell, 0);
        editor.chain().focus().setTextSelection(pos).deleteRow().run();
      } catch {
        /* already deleted */
      }
    }

    setSelectedRows(new Set());
  }, [selectedRows, editor, getTableEl]);

  // ─── Delete single row by index ────────────────────────────────────────────
  const deleteSingleRow = useCallback(
    (rowIndex: number) => {
      const tableEl =
        getTableEl() ??
        (document.querySelector(".tiptap-editor table") as HTMLElement | null);
      if (!tableEl) return;
      const rows = tableEl.querySelectorAll("tr");
      const targetRow = rows[rowIndex];
      if (!targetRow) return;
      const firstCell = targetRow.querySelector("td, th");
      if (!firstCell) return;
      try {
        const pos = editor.view.posAtDOM(firstCell, 0);
        editor.chain().focus().setTextSelection(pos).deleteRow().run();
      } catch {}
      setSelectedRows((prev) => {
        const next = new Set(prev);
        next.delete(rowIndex);
        return next;
      });
    },
    [editor, getTableEl],
  );

  // ─── Duplicate single row ──────────────────────────────────────────────────
  const duplicateSingleRow = useCallback(
    (rowIndex: number) => {
      const tableEl =
        getTableEl() ??
        (document.querySelector(".tiptap-editor table") as HTMLElement | null);
      if (!tableEl) return;
      const rows = tableEl.querySelectorAll("tr");
      const targetRow = rows[rowIndex];
      if (!targetRow) return;
      const firstCell = targetRow.querySelector("td, th");
      if (!firstCell) return;
      try {
        const pos = editor.view.posAtDOM(firstCell, 0);
        editor.chain().focus().setTextSelection(pos).addRowAfter().run();
      } catch {}
    },
    [editor, getTableEl],
  );

  // ─── Toggle select row ─────────────────────────────────────────────────────
  const toggleRow = useCallback((rowIndex: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) next.delete(rowIndex);
      else next.add(rowIndex);
      return next;
    });
  }, []);

  // ─── Handle row action from dropdown ──────────────────────────────────────
  const handleRowAction = useCallback(
    (key: string, rowIndex: number) => {
      setOpenDropdownRow(null);
      switch (key) {
        case "edit": {
          const tableEl =
            getTableEl() ??
            (document.querySelector(
              ".tiptap-editor table",
            ) as HTMLElement | null);
          if (!tableEl) return;
          const rows = tableEl.querySelectorAll("tr");
          const tr = rows[rowIndex];
          const firstCell = tr?.querySelector("td, th");
          if (!firstCell) return;
          try {
            const pos = editor.view.posAtDOM(firstCell, 0);
            editor.chain().focus().setTextSelection(pos).run();
          } catch {}
          break;
        }
        case "duplicate":
          duplicateSingleRow(rowIndex);
          break;
        case "favourite":
          // extend this hook if needed
          break;
        case "archive":
          // extend this hook if needed
          break;
        case "delete":
          deleteSingleRow(rowIndex);
          break;
      }
    },
    [editor, getTableEl, deleteSingleRow, duplicateSingleRow],
  );

  if (!editor.isActive("table")) return null;

  const selectedCount = selectedRows.size;

  return (
    <>
      {/* ══ 1. Toolbar dọc ══ */}
      {toolbarVisible && (
        <div
          style={{
            position: "absolute",
            top: toolbarPos.top,
            left: toolbarPos.left,
            zIndex: 60,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            padding: "5px 4px",
            borderRadius: 8,
            background: "rgba(8,8,14,0.96)",
            border: "0.5px solid rgba(34,211,238,0.18)",
            boxShadow:
              "0 2px 14px rgba(0,0,0,0.55), inset 0 1px 0 rgba(34,211,238,0.12)",
            backdropFilter: "blur(14px)",
            userSelect: "none",
          }}
        >
          <span
            style={{
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(34,211,238,0.35)",
              marginBottom: 2,
            }}
          >
            TBL
          </span>
          <Btn
            icon={<ArrowLeft size={12} />}
            label="Chèn cột bên trái"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
          />
          <Btn
            icon={<ArrowRight size={12} />}
            label="Chèn cột bên phải"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          />
          <Sep />
          <Btn
            icon={<Trash2 size={12} />}
            label="Xóa cột này"
            danger
            onClick={() => editor.chain().focus().deleteColumn().run()}
          />
          <Sep />
          <Btn
            icon={<Table2 size={12} />}
            label="Xóa bảng"
            danger
            onClick={() => editor.chain().focus().deleteTable().run()}
          />
        </div>
      )}

      {/* ══ 2. Row overlays: checkbox + edit icon + 3-dot menu ══ */}
      {rowOverlays.map((overlay) => {
        if (overlay.isHeader) return null;

        const isSelected = selectedRows.has(overlay.rowIndex);
        const isHov = hoveredRow === overlay.rowIndex;
        const showControls = isHov || isSelected;
        const dropdownOpen = openDropdownRow === overlay.rowIndex;

        return (
          <div
            key={overlay.rowIndex}
            onMouseEnter={() => setHoveredRow(overlay.rowIndex)}
            onMouseLeave={() => setHoveredRow(null)}
            style={{
              position: "absolute",
              top: overlay.top,
              left: -58,
              height: overlay.height,
              width: 56,
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 3,
              paddingRight: 4,
              pointerEvents: "all",
            }}
          >
            {/* ── 3-dot button ── */}
            {(showControls || dropdownOpen) && (
              <div style={{ position: "relative" }}>
                <button
                  title="Row actions"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenDropdownRow(dropdownOpen ? null : overlay.rowIndex);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    background: dropdownOpen
                      ? "rgba(34,211,238,0.12)"
                      : "rgba(255,255,255,0.05)",
                    border: `0.5px solid ${
                      dropdownOpen
                        ? "rgba(34,211,238,0.35)"
                        : "rgba(255,255,255,0.12)"
                    }`,
                    color: dropdownOpen ? "#22d3ee" : "rgba(255,255,255,0.4)",
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "all 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    if (!dropdownOpen) {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.1)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.75)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!dropdownOpen) {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.05)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                    }
                  }}
                >
                  <MoreHorizontal size={11} />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <RowActionDropdown
                    onAction={(key) => handleRowAction(key, overlay.rowIndex)}
                    onClose={() => setOpenDropdownRow(null)}
                  />
                )}
              </div>
            )}

            {/* ── Edit icon – hover only, no selection ── */}
            {isHov && !isSelected && (
              <button
                title="Focus vào hàng này"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const tableEl =
                    getTableEl() ??
                    (document.querySelector(
                      ".tiptap-editor table",
                    ) as HTMLElement | null);
                  if (!tableEl) return;
                  const rows = tableEl.querySelectorAll("tr");
                  const tr = rows[overlay.rowIndex];
                  const firstCell = tr?.querySelector("td, th");
                  if (!firstCell) return;
                  try {
                    const pos = editor.view.posAtDOM(firstCell, 0);
                    editor.chain().focus().setTextSelection(pos).run();
                  } catch {}
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  background: "rgba(255,255,255,0.05)",
                  border: "0.5px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all 0.12s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(34,211,238,0.12)";
                  e.currentTarget.style.color = "#22d3ee";
                  e.currentTarget.style.borderColor = "rgba(34,211,238,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                }}
              >
                <Pencil size={9} />
              </button>
            )}

            {/* ── Checkbox ── */}
            {showControls && (
              <button
                title={isSelected ? "Bỏ chọn hàng" : "Chọn hàng này"}
                onMouseDown={(e) => {
                  e.preventDefault();
                  toggleRow(overlay.rowIndex);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 15,
                  height: 15,
                  borderRadius: 3,
                  background: isSelected
                    ? "rgba(34,211,238,0.18)"
                    : "rgba(255,255,255,0.04)",
                  border: `1px solid ${
                    isSelected
                      ? "rgba(34,211,238,0.6)"
                      : "rgba(255,255,255,0.2)"
                  }`,
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all 0.12s",
                  position: "relative",
                }}
              >
                {isSelected && (
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 9 9"
                    fill="none"
                    style={{ position: "absolute" }}
                  >
                    <path
                      d="M1.5 4.5L3.5 6.5L7.5 2.5"
                      stroke="#22d3ee"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            )}
          </div>
        );
      })}

      {/* ══ 3. Row Action Bar – float bottom khi chọn >= 1 hàng ══ */}
      {selectedCount > 0 && (
        <RowActionBar
          count={selectedCount}
          onDelete={deleteSelectedRows}
          onClear={() => setSelectedRows(new Set())}
        />
      )}

      {/* ══ 4. Nút + bên phải table → thêm cột cuối ══ */}
      {addColVisible && (
        <button
          title="Thêm cột"
          onMouseEnter={() => setHovAddCol(true)}
          onMouseLeave={() => setHovAddCol(false)}
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().addColumnAfter().run();
          }}
          style={{
            position: "absolute",
            top: addColPos.top,
            left: addColPos.left,
            height: addColPos.height,
            width: hovAddCol ? 22 : 18,
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 5,
            background: hovAddCol
              ? "rgba(34,211,238,0.1)"
              : "rgba(255,255,255,0.03)",
            border: `0.5px solid ${
              hovAddCol ? "rgba(34,211,238,0.35)" : "rgba(255,255,255,0.07)"
            }`,
            color: hovAddCol ? "#22d3ee" : "rgba(255,255,255,0.2)",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          <Plus size={11} />
        </button>
      )}

      {/* ══ 5. New Row button bên dưới table ══ */}
      {newRowVisible && (
        <button
          title="Thêm hàng mới"
          onMouseEnter={() => setHovNewRow(true)}
          onMouseLeave={() => setHovNewRow(false)}
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().addRowAfter().run();
          }}
          style={{
            position: "absolute",
            top: newRowPos.top,
            left: newRowPos.left,
            width: newRowPos.width,
            height: 28,
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "0 10px",
            borderRadius: "0 0 6px 6px",
            background: hovNewRow ? "rgba(255,255,255,0.04)" : "transparent",
            borderTop: "none",
            borderLeft: `0.5px solid ${
              hovNewRow ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"
            }`,
            borderRight: `0.5px solid ${
              hovNewRow ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"
            }`,
            borderBottom: `0.5px solid ${
              hovNewRow ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"
            }`,
            color: hovNewRow
              ? "rgba(255,255,255,0.5)"
              : "rgba(255,255,255,0.2)",
            cursor: "pointer",
            transition: "all 0.15s",
            fontSize: 12,
          }}
        >
          <Plus
            size={11}
            style={{
              color: hovNewRow ? "#22d3ee" : "rgba(255,255,255,0.2)",
              transition: "color 0.15s",
            }}
          />
          <span>New Row</span>
        </button>
      )}
    </>
  );
}
