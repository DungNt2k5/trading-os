"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  CandlestickChart,
  Landmark,
  StickyNote,
  LayoutGrid,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";

// ── Type config — old colors, new rail/activeClass fields ─────────────────────
const typeConfig: Record<
  string,
  {
    icon: React.ReactNode;
    dotColor: string;
    dotShadow: string;
    railColor: string;
    activeClass: string;
    glow: string;
    label: string;
    desc: string;
  }
> = {
  trading: {
    icon: <CandlestickChart size={14} className="text-cyan-400" />,
    dotColor: "bg-cyan-400",
    dotShadow: "shadow-[0_0_6px_2px_rgba(34,211,238,0.7)]",
    railColor: "bg-gradient-to-b from-transparent via-cyan-400 to-transparent",
    activeClass: "sidebar-item active active-trading",
    glow: "rgba(34,211,238,0.15)",
    label: "Trading",
    desc: "PnL, equity curve, trade log",
  },
  expense: {
    icon: <Landmark size={14} className="text-pink-400" />,
    dotColor: "bg-pink-400",
    dotShadow: "shadow-[0_0_6px_2px_rgba(244,114,182,0.7)]",
    railColor: "bg-gradient-to-b from-transparent via-pink-400 to-transparent",
    activeClass: "sidebar-item active active-expense",
    glow: "rgba(244,114,182,0.15)",
    label: "Expense",
    desc: "Chi tiêu, ngân sách",
  },
  general: {
    icon: <StickyNote size={14} className="text-purple-400" />,
    dotColor: "bg-purple-400",
    dotShadow: "shadow-[0_0_6px_2px_rgba(192,132,252,0.7)]",
    railColor:
      "bg-gradient-to-b from-transparent via-purple-400 to-transparent",
    activeClass: "sidebar-item active active-general",
    glow: "rgba(192,132,252,0.15)",
    label: "General",
    desc: "Ghi chú, tài liệu",
  },
  custom: {
    icon: <LayoutGrid size={14} className="text-yellow-400" />,
    dotColor: "bg-yellow-400",
    dotShadow: "shadow-[0_0_6px_2px_rgba(250,204,21,0.7)]",
    railColor:
      "bg-gradient-to-b from-transparent via-yellow-400 to-transparent",
    activeClass: "sidebar-item active active-custom",
    glow: "rgba(250,204,21,0.15)",
    label: "Custom",
    desc: "Tự định nghĩa",
  },
};

const fallback = typeConfig.general;

// ── GlowDot — new dual-ring version ──────────────────────────────────────────
function GlowDot({ cfg }: { cfg: (typeof typeConfig)[string] }) {
  // Derive border color from dotColor class name
  const ringColor = cfg.dotColor.includes("cyan")
    ? "rgba(34,211,238,0.6)"
    : cfg.dotColor.includes("pink")
      ? "rgba(244,114,182,0.6)"
      : cfg.dotColor.includes("purple")
        ? "rgba(192,132,252,0.6)"
        : "rgba(250,204,21,0.6)";

  return (
    <span
      className="glow-dot-wrap flex-shrink-0"
      style={{ position: "relative", width: 8, height: 8 }}
    >
      {/* Ring 1 */}
      <span
        className="glow-dot-ring absolute inset-0 rounded-full border border-current opacity-0"
        style={{ color: ringColor }}
      />
      {/* Ring 2 — delayed */}
      <span
        className="glow-dot-ring2 absolute inset-0 rounded-full border border-current opacity-0"
        style={{ color: ringColor }}
      />
      {/* Core dot */}
      <span
        className={cn(
          "glow-dot-core absolute rounded-full",
          cfg.dotColor,
          cfg.dotShadow,
        )}
        style={{ inset: 2 }}
      />
    </span>
  );
}

// ── Create Section Dialog — old layout, new dialog-panel / btn-neon-cyan ──────
function CreateSectionDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string, type: string) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("general");

  const handleConfirm = () => {
    if (!name.trim()) return;
    onConfirm(name.trim(), type);
    setName("");
    setType("general");
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Old size/padding, new dialog-panel class for glass effect */}
      <div className="w-[340px] rounded-2xl p-5 flex flex-col gap-4 dialog-panel">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white/90">
              Tạo Section mới
            </h3>
            <p className="text-[11px] text-white/30 mt-0.5">
              Nhập tên và chọn loại section
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/25 hover:text-white/60 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Name input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-white/30 uppercase tracking-widest font-medium">
            Tên section
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            placeholder="VD: BTC Trades, Chi tiêu tháng 4..."
            className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-[13px] text-white/80 placeholder-white/20 outline-none focus:border-cyan-500/40 transition-colors"
          />
        </div>

        {/* Type selector — old active style */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-white/30 uppercase tracking-widest font-medium">
            Loại section
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(typeConfig).map(([key, cfg]) => {
              const isActive = type === key;
              return (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  className={cn(
                    "flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all duration-150",
                    isActive
                      ? "border-cyan-500/40 bg-cyan-500/10"
                      : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15",
                  )}
                >
                  <span className="mt-0.5 flex-shrink-0">{cfg.icon}</span>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-[12px] font-medium leading-tight",
                        isActive ? "text-white/90" : "text-white/55",
                      )}
                    >
                      {cfg.label}
                    </p>
                    <p className="text-[10px] text-white/25 leading-tight mt-0.5">
                      {cfg.desc}
                    </p>
                  </div>
                  {isActive && (
                    <Check
                      size={11}
                      className="text-cyan-400 flex-shrink-0 ml-auto mt-0.5"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Buttons — new btn-neon-cyan on confirm */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-[13px] text-white/35 border border-white/8 hover:bg-white/5 hover:text-white/55 transition-all"
          >
            Huỷ
          </button>
          <button
            onClick={handleConfirm}
            disabled={!name.trim()}
            className={cn(
              "flex-1 py-2 rounded-xl text-[13px] font-medium transition-all",
              name.trim()
                ? "btn-neon-cyan"
                : "bg-white/5 border border-white/8 text-white/20 cursor-not-allowed",
            )}
          >
            Tạo Section
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────
export default function Sidebar() {
  const {
    sections,
    activeSectionId,
    setSections,
    setActiveSectionId,
    removeSection,
  } = useAppStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  // Old: localStorage collapse
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar_collapsed") === "true";
  });
  // Old: theme toggle
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("theme") as "dark" | "light") ?? "dark";
  });

  // New: track rendered ids for entrance stagger
  const [renderedIds, setRenderedIds] = useState<Set<string>>(new Set());

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // New: update renderedIds when sections load
  useEffect(() => {
    setRenderedIds((prev) => {
      const next = new Set(prev);
      sections.forEach((s) => next.add(s.id));
      return next;
    });
  }, [sections]);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar_collapsed", String(next));
      return next;
    });
  };

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  useEffect(() => {
    fetch("/api/sections")
      .then((r) => r.json())
      .then(setSections);
  }, []);

  useEffect(() => {
    const handler = () => setDialogOpen(true);
    window.addEventListener("open-create-section", handler);
    return () => window.removeEventListener("open-create-section", handler);
  }, []);

  const handleCreate = async (name: string, type: string) => {
    setDialogOpen(false);
    const res = await fetch("/api/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, order: sections.length }),
    });
    const newSection = await res.json();
    useAppStore.getState().addSection(newSection);
    setActiveSectionId(newSection.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa section này và toàn bộ pages bên trong?")) return;
    await fetch(`/api/sections/${id}`, { method: "DELETE" });
    removeSection(id);
    if (activeSectionId === id) setActiveSectionId(null);
  };

  return (
    <>
      <aside
        className={cn(
          // Old base background
          "relative h-screen flex flex-col bg-black/40 border-r border-white/10 backdrop-blur-xl transition-all duration-300 ease-in-out flex-shrink-0",
          collapsed ? "w-14" : "w-64",
        )}
      >
        {/* New: neon edge wire */}
        <span className="sidebar-edge-wire" aria-hidden />

        {/* ── Logo / Header — old layout, new logo-sigil box ── */}
        <div
          className={cn(
            "border-b border-white/10 flex items-center",
            collapsed
              ? "px-0 py-4 justify-center"
              : "px-5 py-4 justify-between",
          )}
        >
          {!collapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              {/* New: logo-sigil box */}
              <div className="logo-sigil">
                <span className="text-[16px] leading-none relative z-10">
                  ⚡
                </span>
              </div>
              {/* Old: gradient title text (no glitch animation) */}
              <div className="min-w-0">
                <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
                  Personal OS
                </h1>
                <p className="text-xs text-white/30 mt-0.5 truncate">
                  Offline Knowledge Dashboard
                </p>
              </div>
            </div>
          ) : (
            /* Collapsed: sigil only */
            <div className="logo-sigil w-8 h-8">
              <span className="text-[14px] leading-none relative z-10">⚡</span>
            </div>
          )}
        </div>

        {/* ── Collapse toggle — old style ── */}
        <button
          onClick={toggleCollapse}
          className={cn(
            "absolute -right-3 top-[52px] z-20 w-6 h-6 rounded-full flex items-center justify-center",
            "bg-[#0a0a0f] border border-white/15 text-white/40",
            "hover:text-cyan-400 hover:border-cyan-500/40 hover:shadow-[0_0_10px_rgba(34,211,238,0.25)]",
            "transition-all",
          )}
          title={collapsed ? "Mở rộng sidebar" : "Thu nhỏ sidebar"}
        >
          {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
        </button>

        {/* ── Sections nav ── */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-1 px-2">
          {sections.length === 0 && !collapsed && (
            <p className="text-[11px] text-white/20 text-center mt-8 px-4 leading-relaxed">
              Chưa có section nào.{"\n"}Nhấn + để tạo mới.
            </p>
          )}

          {sections.map((sec, i) => {
            const cfg = typeConfig[sec.type] ?? fallback;
            const isActive = activeSectionId === sec.id;
            const isNew = !renderedIds.has(sec.id);

            return (
              <div
                key={sec.id}
                onClick={() => setActiveSectionId(sec.id)}
                title={collapsed ? sec.name : undefined}
                className={cn(
                  "group flex items-center justify-between rounded-lg cursor-pointer transition-all duration-200 border",
                  collapsed ? "px-0 py-2 justify-center" : "px-3 py-2",
                  // New activeClass for fiber/rail effects; old fallback hover
                  isActive
                    ? cfg.activeClass
                    : "hover:bg-white/5 border-transparent",
                )}
                style={{
                  // Old: glow background on active
                  ...(isActive
                    ? {
                        background: cfg.glow,
                        boxShadow: `0 0 14px ${cfg.glow}, inset 0 0 8px ${cfg.glow}`,
                      }
                    : {}),
                  // New: stagger delay for entrance
                  animationDelay: isNew ? "0ms" : `${i * 50}ms`,
                }}
              >
                {/* New: neon rail bar (active, expanded only) */}
                {isActive && !collapsed && (
                  <span
                    className={cn("sidebar-rail", cfg.railColor)}
                    style={{
                      boxShadow: `0 0 8px ${cfg.glow}, 0 0 16px ${cfg.glow}`,
                    }}
                    aria-hidden
                  />
                )}

                {collapsed ? (
                  <span className="flex items-center justify-center w-8 h-8">
                    {cfg.icon}
                  </span>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* New: dual-ring GlowDot */}
                      <GlowDot cfg={cfg} />
                      {cfg.icon}
                      <span
                        className={cn(
                          "text-sm truncate transition-colors",
                          isActive ? "text-white font-medium" : "text-white/70",
                        )}
                      >
                        {sec.name}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(sec.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all ml-1 flex-shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Bottom actions — old layout ── */}
        <div className="border-t border-white/10 flex flex-col gap-1 p-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Chuyển Light mode" : "Chuyển Dark mode"}
            className={cn(
              "flex items-center gap-2.5 rounded-lg transition-all text-white/40 hover:text-yellow-400 hover:bg-yellow-400/10",
              collapsed ? "justify-center p-2" : "px-3 py-2",
            )}
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            {!collapsed && (
              <span className="text-sm">
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </span>
            )}
          </button>

          {/* Add section — old style, no scan sweep */}
          <button
            onClick={() => !collapsed && setDialogOpen(true)}
            title="Thêm Section"
            className={cn(
              "flex items-center gap-2 rounded-lg text-sm text-white/50",
              "hover:text-cyan-400 hover:bg-cyan-500/10",
              "border border-dashed border-white/10 hover:border-cyan-500/40",
              "transition-all",
              collapsed ? "justify-center p-2" : "px-3 py-2",
            )}
          >
            <Plus size={14} />
            {!collapsed && <span>Thêm Section</span>}
          </button>
        </div>
      </aside>

      <CreateSectionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleCreate}
      />
    </>
  );
}
