"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore, parseMeta } from "@/store/useAppStore";
import {
  Plus,
  FileText,
  Trash2,
  StickyNote,
  CandlestickChart,
  Landmark,
  LayoutGrid,
  Copy,
  Pencil,
  ChevronDown,
  Circle,
  CheckCircle,
  Archive,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_ICON: Record<string, React.ReactNode> = {
  trading: <CandlestickChart size={12} className="text-cyan-400/60 shrink-0" />,
  expense: <Landmark size={12} className="text-pink-400/60 shrink-0" />,
  general: <StickyNote size={12} className="text-purple-400/60 shrink-0" />,
  custom: <LayoutGrid size={12} className="text-yellow-400/60 shrink-0" />,
  // ✅ FIX: Thêm finance icon
  finance: <TrendingUp size={12} className="text-emerald-400/60 shrink-0" />,
};

const ACTIVE_STYLE: Record<
  string,
  {
    border: string;
    bg: string;
    dot: string;
    glow: string;
    fiberClass: string;
    headerGlow: string;
  }
> = {
  trading: {
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/10",
    dot: "bg-cyan-400 shadow-[0_0_5px_2px_rgba(34,211,238,0.6)]",
    glow: "rgba(34,211,238,0.12)",
    fiberClass: "fiber-trading",
    headerGlow: "rgba(34,211,238,0.08)",
  },
  expense: {
    border: "border-pink-500/30",
    bg: "bg-pink-500/10",
    dot: "bg-pink-400 shadow-[0_0_5px_2px_rgba(244,114,182,0.6)]",
    glow: "rgba(244,114,182,0.12)",
    fiberClass: "fiber-expense",
    headerGlow: "rgba(244,114,182,0.08)",
  },
  general: {
    border: "border-purple-500/30",
    bg: "bg-purple-500/10",
    dot: "bg-purple-400 shadow-[0_0_5px_2px_rgba(192,132,252,0.6)]",
    glow: "rgba(192,132,252,0.12)",
    fiberClass: "fiber-general",
    headerGlow: "rgba(192,132,252,0.08)",
  },
  custom: {
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/10",
    dot: "bg-yellow-400 shadow-[0_0_5px_2px_rgba(250,204,21,0.6)]",
    glow: "rgba(250,204,21,0.12)",
    fiberClass: "fiber-general",
    headerGlow: "rgba(250,204,21,0.06)",
  },
  // ✅ FIX: Thêm finance style — emerald/green như Sidebar
  finance: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    dot: "bg-emerald-400 shadow-[0_0_5px_2px_rgba(52,211,153,0.6)]",
    glow: "rgba(52,211,153,0.12)",
    fiberClass: "fiber-finance",
    headerGlow: "rgba(52,211,153,0.08)",
  },
};

// ── Status Badge: ĐỦ 5 trạng thái ────────────────────────────────────────────

const STATUS_BADGE: Record<
  string,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  active: {
    label: "Active",
    cls: "text-emerald-400/70 bg-emerald-500/10 border-emerald-500/20 badge-crystal",
    icon: <Circle size={7} className="fill-emerald-400" />,
  },
  "in-progress": {
    label: "In Progress",
    cls: "text-amber-400/80 bg-amber-500/10 border-amber-500/25 badge-crystal",
    icon: <Circle size={7} className="fill-amber-400" />,
  },
  done: {
    label: "Done",
    cls: "text-cyan-400/70 bg-cyan-500/10 border-cyan-500/20 badge-crystal",
    icon: <CheckCircle size={7} />,
  },
  draft: {
    label: "Draft",
    cls: "text-purple-400/70 bg-purple-500/10 border-purple-500/20 badge-crystal",
    icon: <Circle size={7} className="fill-purple-400" />,
  },
  archived: {
    label: "Archived",
    cls: "text-white/25 bg-white/5 border-white/10 badge-crystal",
    icon: <Archive size={7} />,
  },
};

const STATUS_ORDER = ["active", "in-progress", "done", "draft", "archived"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0)
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function formatMoney(n: number, prefix = "") {
  if (Math.abs(n) >= 1000) return `${prefix}${(n / 1000).toFixed(1)}k`;
  return `${prefix}${n % 1 === 0 ? n : n.toFixed(2)}`;
}

// ── Trading preview ───────────────────────────────────────────────────────────

function TradingPreview({
  page,
}: {
  page: ReturnType<typeof useAppStore.getState>["pages"][0];
}) {
  const meta = parseMeta(page.metadata);
  const hasPnl = page.pnl !== null && page.pnl !== undefined;
  const pnl = page.pnl ?? 0;
  const isWin = pnl > 0;
  const isLoss = pnl < 0;
  const dir = meta.direction as "long" | "short" | "" | undefined;

  return (
    <div className="flex items-center gap-2 mt-1.5 ml-4 flex-wrap min-w-0">
      {dir && (
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            padding: "2px 6px",
            borderRadius: 4,
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            color: dir === "long" ? "#34d399" : "#f87171",
            background:
              dir === "long" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
            border: `0.5px solid ${dir === "long" ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`,
          }}
        >
          {dir === "long" ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
          {dir}
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
            padding: "2px 6px",
            fontWeight: 600,
          }}
        >
          {page.category}
        </span>
      )}
      {hasPnl && (
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            fontFamily: "monospace",
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            color: isWin
              ? "#34d399"
              : isLoss
                ? "#f87171"
                : "rgba(255,255,255,0.3)",
            background: isWin
              ? "rgba(52,211,153,0.08)"
              : isLoss
                ? "rgba(248,113,113,0.08)"
                : "rgba(255,255,255,0.04)",
            border: `0.5px solid ${isWin ? "rgba(52,211,153,0.2)" : isLoss ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.08)"}`,
            borderRadius: 4,
            padding: "2px 6px",
          }}
        >
          <DollarSign size={7} />
          {isWin ? "+" : ""}
          {formatMoney(pnl)}
        </span>
      )}
      {meta.setup && (
        <span
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.25)",
            fontStyle: "italic",
          }}
        >
          {String(meta.setup)}
        </span>
      )}
      <span
        style={{
          fontSize: 9,
          color: "rgba(255,255,255,0.2)",
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        <Calendar size={8} />
        {formatDate(page.updatedAt)}
      </span>
    </div>
  );
}

// ── Expense preview ───────────────────────────────────────────────────────────

function ExpensePreview({
  page,
}: {
  page: ReturnType<typeof useAppStore.getState>["pages"][0];
}) {
  const meta = parseMeta(page.metadata);
  const hasAmount = page.amount !== null && page.amount !== undefined;

  return (
    <div className="flex items-center gap-2 mt-1.5 ml-4 flex-wrap min-w-0">
      {hasAmount && (
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            fontFamily: "monospace",
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            color: "#f472b6",
            background: "rgba(236,72,153,0.08)",
            border: "0.5px solid rgba(236,72,153,0.2)",
            borderRadius: 4,
            padding: "2px 6px",
          }}
        >
          <DollarSign size={7} />
          {formatMoney(page.amount!)}
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
            padding: "2px 6px",
          }}
        >
          {page.category}
        </span>
      )}
      {(meta as { paymentMethod?: string }).paymentMethod && (
        <span style={{ fontSize: 9, color: "rgba(34,211,238,0.5)" }}>
          {String((meta as { paymentMethod?: string }).paymentMethod)}
        </span>
      )}
      {(meta as { merchant?: string }).merchant && (
        <span
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.25)",
            fontStyle: "italic",
          }}
        >
          {String((meta as { merchant?: string }).merchant)}
        </span>
      )}
      <span
        style={{
          fontSize: 9,
          color: "rgba(255,255,255,0.2)",
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        <Calendar size={8} />
        {formatDate(page.updatedAt)}
      </span>
    </div>
  );
}

// ── General / Finance preview ─────────────────────────────────────────────────

function GeneralPreview({
  page,
}: {
  page: ReturnType<typeof useAppStore.getState>["pages"][0];
}) {
  return (
    <div className="flex items-center gap-2 mt-1.5 ml-4 min-w-0">
      {page.tags?.slice(0, 2).map((pt) => (
        <span
          key={pt.tagId}
          className="text-[9px] px-1.5 py-0.5 rounded-full border"
          style={{
            color: pt.tag.color,
            borderColor: pt.tag.color + "40",
            background: pt.tag.color + "15",
          }}
        >
          {pt.tag.name}
        </span>
      ))}
      <span
        style={{
          fontSize: 9,
          color: "rgba(255,255,255,0.2)",
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        <Calendar size={8} />
        {formatDate(page.updatedAt)}
      </span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function PageList() {
  const {
    activeSectionId,
    sections,
    pages,
    setPages,
    addPage,
    removePage,
    updatePage,
    activePageId,
    setActivePageId,
  } = useAppStore();

  const activeSection = sections.find((s) => s.id === activeSectionId);
  const type = activeSection?.type ?? "general";
  // ✅ FIX: finance giờ có trong ACTIVE_STYLE nên không fallback về general nữa
  const style = ACTIVE_STYLE[type] ?? ACTIVE_STYLE.general;

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const renameRef = useRef<HTMLInputElement>(null);

  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const [seenIds] = useState<Set<string>>(new Set());

  // ── Load pages ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!activeSectionId) return;
    const alreadyLoaded = pages.some((p) => p.sectionId === activeSectionId);
    if (alreadyLoaded) return;
    fetch(`/api/pages?sectionId=${activeSectionId}`)
      .then((r) => r.json())
      .then((fetched) => {
        setPages([
          ...useAppStore
            .getState()
            .pages.filter((p) => p.sectionId !== activeSectionId),
          ...fetched,
        ]);
      });
  }, [activeSectionId]);

  useEffect(() => {
    if (!menuId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuId]);

  useEffect(() => {
    if (renamingId) setTimeout(() => renameRef.current?.focus(), 50);
  }, [renamingId]);

  // ── Actions ───────────────────────────────────────────────────────────────

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
    setRenamingId(newPage.id);
    setRenameVal("Untitled");
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
    const copy = await res.json();
    addPage(copy);
    setActivePageId(copy.id);
  };

  const startRename = (id: string, currentTitle: string) => {
    setMenuId(null);
    setRenamingId(id);
    setRenameVal(currentTitle);
  };

  const commitRename = async (id: string) => {
    if (!renameVal.trim()) {
      setRenamingId(null);
      return;
    }
    const res = await fetch(`/api/pages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: renameVal.trim() }),
    });
    const updated = await res.json();
    updatePage(id, { title: updated.title });
    setRenamingId(null);
  };

  const handleStatusCycle = async (
    id: string,
    current: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    const next =
      STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length];
    const res = await fetch(`/api/pages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const updated = await res.json();
    updatePage(id, { status: updated.status });
  };

  const openMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuId(id);
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const sectionPages = pages.filter((p) => p.sectionId === activeSectionId);
  if (!activeSectionId) return null;

  return (
    <div className="w-64 h-screen flex flex-col border-r border-white/10 bg-black/20">
      {/* Header */}
      <div
        className="px-4 py-3 border-b border-white/10 flex items-center justify-between"
        style={{ boxShadow: `0 1px 0 ${style.headerGlow}` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="relative flex-shrink-0"
            style={{ width: 6, height: 6 }}
          >
            <span
              className={cn(
                "absolute inset-0 rounded-full animate-halo-ring",
                style.dot.split(" ")[0],
              )}
              aria-hidden
            />
            <span className={cn("absolute inset-0 rounded-full", style.dot)} />
          </span>
          <span className="text-[10px] font-semibold text-white/35 uppercase tracking-widest truncate">
            {activeSection?.name ?? "Pages"}
          </span>
          <span className="text-[9px] text-white/15 font-mono">
            {sectionPages.length}
          </span>
        </div>
        <button
          onClick={handleCreate}
          className="text-white/30 hover:text-cyan-400 transition-colors p-0.5 rounded"
          title="Tạo page mới"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {sectionPages.length === 0 && (
          <div className="flex flex-col items-center gap-2 mt-12 px-4">
            <FileText size={24} className="text-white/10" />
            <p className="text-[11px] text-white/20 text-center leading-relaxed">
              Chưa có page nào.
              <br />
              Nhấn <span className="text-white/35">+</span> để tạo mới.
            </p>
          </div>
        )}

        {sectionPages.map((page, i) => {
          const isActive = activePageId === page.id;
          const isRenaming = renamingId === page.id;
          const statusKey = STATUS_BADGE[page.status] ? page.status : "active";
          const statusBadge = STATUS_BADGE[statusKey];
          const isNew = !seenIds.has(page.id);
          seenIds.add(page.id);

          return (
            <div
              key={page.id}
              onClick={() => !isRenaming && setActivePageId(page.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                openMenu(page.id, e);
              }}
              className={cn(
                "group relative flex flex-col px-2.5 py-2 rounded-md cursor-pointer transition-all duration-150 border",
                isActive
                  ? cn(style.border, style.bg)
                  : "hover:bg-white/[0.04] border-transparent",
              )}
              style={{
                boxShadow: isActive
                  ? `inset 0 0 10px ${style.glow}`
                  : undefined,
                animationName: isNew ? "fragmentIn" : "none",
                animationDuration: "0.32s",
                animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                animationFillMode: "both",
                animationDelay: isNew ? `${i * 45}ms` : "0ms",
              }}
            >
              {isActive && (
                <span
                  className={cn("page-fiber-bar", style.fiberClass)}
                  style={{ top: "12%", height: "76%" }}
                  aria-hidden
                />
              )}

              {/* Row 1: icon + title + menu */}
              <div className="flex items-center gap-2 min-w-0">
                {isActive ? (
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full flex-shrink-0",
                      style.dot,
                    )}
                  />
                ) : page.icon ? (
                  <span className="text-base leading-none flex-shrink-0">
                    {page.icon}
                  </span>
                ) : (
                  // ✅ FIX: finance giờ có PAGE_ICON riêng
                  (PAGE_ICON[type] ?? PAGE_ICON.general)
                )}

                {isRenaming ? (
                  <input
                    ref={renameRef}
                    value={renameVal}
                    onChange={(e) => setRenameVal(e.target.value)}
                    onBlur={() => commitRename(page.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(page.id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-transparent text-white/90 text-[13px] outline-none border-b border-cyan-400/50 min-w-0"
                  />
                ) : (
                  <span
                    className={cn(
                      "flex-1 text-[13px] truncate transition-colors",
                      isActive ? "text-white/90 font-medium" : "text-white/55",
                    )}
                  >
                    {page.title || "Untitled"}
                  </span>
                )}

                {!isRenaming && (
                  <button
                    onClick={(e) => openMenu(page.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-white/25 hover:text-white/60 transition-all flex-shrink-0 ml-0.5"
                  >
                    <ChevronDown size={11} />
                  </button>
                )}
              </div>

              {/* Row 2: Status badge */}
              <div className="flex items-center gap-1.5 mt-1 ml-4 min-w-0">
                <button
                  onClick={(e) => handleStatusCycle(page.id, page.status, e)}
                  className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border flex-shrink-0",
                    statusBadge.cls,
                  )}
                  title="Click để đổi trạng thái (5 bước)"
                >
                  {statusBadge.icon}
                  {statusBadge.label}
                </button>
              </div>

              {/* Row 3: Preview strip theo loại section */}
              {type === "trading" && <TradingPreview page={page} />}
              {type === "expense" && <ExpensePreview page={page} />}
              {/* ✅ FIX: finance dùng GeneralPreview (tags + date) */}
              {(type === "general" ||
                type === "custom" ||
                type === "finance") && <GeneralPreview page={page} />}
            </div>
          );
        })}
      </div>

      {/* Context menu */}
      {menuId && (
        <div
          ref={menuRef}
          className="ctx-menu"
          style={{
            position: "fixed",
            top: menuPos.y,
            left: menuPos.x,
            zIndex: 999,
            borderRadius: 10,
            padding: "4px",
            minWidth: 160,
          }}
        >
          {[
            {
              icon: <Pencil size={12} />,
              label: "Đổi tên",
              danger: false,
              action: () => {
                const p = pages.find((p) => p.id === menuId);
                if (p) startRename(p.id, p.title);
              },
            },
            {
              icon: <Copy size={12} />,
              label: "Duplicate",
              danger: false,
              action: () => handleDuplicate(menuId),
            },
            null,
            {
              icon: <Trash2 size={12} />,
              label: "Xóa",
              danger: true,
              action: () => handleDelete(menuId),
            },
          ].map((item, idx) => {
            if (!item)
              return (
                <div
                  key={`sep-${idx}`}
                  style={{
                    height: 1,
                    background: "rgba(255,255,255,0.06)",
                    margin: "3px 4px",
                  }}
                />
              );
            return (
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
                  borderRadius: 7,
                  color: item.danger
                    ? "rgba(239,68,68,0.8)"
                    : "rgba(255,255,255,0.65)",
                  transition: "background 0.1s, padding-left 0.14s, color 0.1s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    item.danger
                      ? "rgba(239,68,68,0.08)"
                      : "rgba(255,255,255,0.06)";
                  (e.currentTarget as HTMLElement).style.paddingLeft = "20px";
                  (e.currentTarget as HTMLElement).style.color = item.danger
                    ? "#ef4444"
                    : "rgba(255,255,255,0.88)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLElement).style.paddingLeft = "14px";
                  (e.currentTarget as HTMLElement).style.color = item.danger
                    ? "rgba(239,68,68,0.8)"
                    : "rgba(255,255,255,0.65)";
                }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
