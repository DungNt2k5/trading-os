"use client";

import { useEffect, useState, useRef } from "react";
import { BalanceCharts, EventCharts } from "./FinanceCharts";
import {
  TrendingUp,
  Minus,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Mail,
  Landmark,
  CalendarDays,
  DollarSign,
  Zap,
  Filter,
  ArrowUpDown,
  Copy,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  User,
  Calculator,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DailyBalance {
  id: string;
  sectionId: string;
  date: string;
  money1: number;
  money2: number;
  total: number;
  note: string | null;
  profileName?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EmailEvent {
  id: string;
  sectionId: string;
  email: string;
  exchange: string;
  eventCode: string;
  eventName: string | null;
  amount: number | null;
  status: string;
  eventDate: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

type Tab = "balance" | "events";
type SortDir = "asc" | "desc";
type BalanceFilter = "all" | "up" | "down";
type EventSortField = "createdAt" | "eventDate" | "amount";

const STATUS_CFG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  pending: {
    label: "Pending",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.1)",
    border: "rgba(251,191,36,0.25)",
  },
  confirmed: {
    label: "Confirmed",
    color: "#34d399",
    bg: "rgba(52,211,153,0.1)",
    border: "rgba(52,211,153,0.25)",
  },
  cancelled: {
    label: "Cancelled",
    color: "#f87171",
    bg: "rgba(248,113,113,0.1)",
    border: "rgba(248,113,113,0.25)",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}
function fmtDate(d: string) {
  const [y, m, dd] = d.split("-");
  return `${dd}/${m}/${y}`;
}
function fmtMoney(n: number) {
  if (Math.abs(n) >= 1_000_000)
    return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (Math.abs(n) >= 1_000)
    return (n / 1_000).toFixed(1).replace(/\.?0+$/, "") + "K";
  return n.toLocaleString("vi-VN");
}

// Evaluate math expression safely: "100+200*3" → 700
function evalExpr(expr: string): number | null {
  try {
    const cleaned = expr.replace(/[^0-9+\-*/().\s]/g, "").trim();
    if (!cleaned) return null;
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${cleaned})`)();
    if (typeof result === "number" && isFinite(result)) return result;
    return null;
  } catch {
    return null;
  }
}

function inputCss(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: "var(--fd-input-bg, rgba(255,255,255,0.04))",
    border: "0.5px solid var(--fd-input-border, rgba(255,255,255,0.1))",
    borderRadius: 7,
    color: "var(--fd-input-color, rgba(255,255,255,0.8))",
    fontSize: 12,
    padding: "6px 9px",
    outline: "none",
    width: "100%",
    ...extra,
  };
}

// ── CSV utils ─────────────────────────────────────────────────────────────────

function escapeCSV(val: unknown): string {
  const s = val === null || val === undefined ? "" : String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n"))
    return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function toCSV(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((r) => r.map(escapeCSV).join(",")).join("\n");
}
function downloadCSV(content: string, filename: string) {
  const blob = new Blob(["\uFEFF" + content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = "",
    inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuote = !inQuote;
    } else if (ch === "," && !inQuote) {
      result.push(cur);
      cur = "";
    } else cur += ch;
  }
  result.push(cur);
  return result;
}
function parseCSV(text: string): string[][] {
  return text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map(parseCSVLine);
}
function normDate(d: string): string {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(d) ? d.split("/").reverse().join("-") : d;
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({
  msg,
  type,
  onClose,
}: {
  msg: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  const color = type === "success" ? "#34d399" : "#f87171";
  const Icon = type === "success" ? CheckCircle : XCircle;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: "var(--fd-toast-bg, rgba(10,10,15,0.97))",
        border: `0.5px solid ${color}40`,
        borderRadius: 10,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        boxShadow: `0 8px 24px rgba(0,0,0,0.7), 0 0 12px ${color}20`,
        minWidth: 240,
        animation: "slideUp 0.2s ease",
      }}
    >
      <Icon size={14} style={{ color, flexShrink: 0 }} />
      <span
        style={{
          fontSize: 13,
          color: "var(--fd-text, rgba(255,255,255,0.85))",
        }}
      >
        {msg}
      </span>
      <button
        onClick={onClose}
        style={{
          marginLeft: "auto",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--fd-muted, rgba(255,255,255,0.3))",
          fontSize: 14,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

// ── PnL Badge ─────────────────────────────────────────────────────────────────

function PnlBadge({ current, prev }: { current: number; prev: number | null }) {
  if (prev === null)
    return (
      <span
        style={{
          fontSize: 10,
          color: "var(--fd-muted, rgba(255,255,255,0.2))",
        }}
      >
        —
      </span>
    );
  const diff = current - prev;
  const pct = prev !== 0 ? (diff / Math.abs(prev)) * 100 : 0;
  const isUp = diff > 0;
  const isFlat = diff === 0;
  const color = isFlat ? "#888" : isUp ? "#34d399" : "#f87171";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: "monospace",
        color,
        border: `0.5px solid ${color}40`,
        borderRadius: 5,
        padding: "2px 6px",
        background: isFlat
          ? "rgba(136,136,136,0.1)"
          : isUp
            ? "rgba(52,211,153,0.1)"
            : "rgba(248,113,113,0.1)",
      }}
    >
      {isFlat ? (
        <Minus size={9} />
      ) : isUp ? (
        <ChevronUp size={9} />
      ) : (
        <ChevronDown size={9} />
      )}
      {isUp ? "+" : ""}
      {fmtMoney(diff)}
      <span style={{ opacity: 0.6, fontSize: 9 }}>
        ({isUp ? "+" : ""}
        {pct.toFixed(1)}%)
      </span>
    </span>
  );
}

// ── Editable Cell ─────────────────────────────────────────────────────────────

function EditableCell({
  value,
  type = "text",
  onSave,
  placeholder,
  align = "left",
}: {
  value: string | number | null;
  type?: string;
  onSave: (v: string) => void;
  placeholder?: string;
  align?: "left" | "right";
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
    if (val !== String(value ?? "")) onSave(val);
  };
  if (editing)
    return (
      <input
        ref={inputRef}
        type={type}
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
        style={{
          width: "100%",
          background: "rgba(34,211,238,0.07)",
          border: "0.5px solid rgba(34,211,238,0.4)",
          borderRadius: 5,
          color: "#22d3ee",
          fontSize: 12,
          padding: "3px 6px",
          outline: "none",
          textAlign: align,
        }}
      />
    );
  return (
    <span
      onDoubleClick={() => {
        setVal(String(value ?? ""));
        setEditing(true);
      }}
      title="Double-click để sửa"
      style={{
        display: "block",
        cursor: "default",
        fontSize: 12,
        userSelect: "none",
        padding: "3px 0",
        textAlign: align,
        color:
          value === null || value === ""
            ? "var(--fd-muted, rgba(255,255,255,0.15))"
            : "var(--fd-text-secondary, rgba(255,255,255,0.75))",
      }}
    >
      {value === null || value === "" ? (placeholder ?? "—") : String(value)}
    </span>
  );
}

// ── Math Input (tổng tiền với tính toán) ─────────────────────────────────────

function MathInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (raw: string, computed: number | null) => void;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  const computed = evalExpr(value);
  const hasExpr = value.trim() !== "" && /[+\-*/()]/.test(value);

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value, evalExpr(e.target.value))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder ?? "0 hoặc 100+200"}
        style={{
          ...inputCss({
            paddingRight: hasExpr ? 32 : 9,
            border: focused
              ? "0.5px solid rgba(34,211,238,0.5)"
              : "0.5px solid var(--fd-input-border, rgba(255,255,255,0.1))",
            fontFamily: hasExpr ? "monospace" : "inherit",
            color: hasExpr
              ? "#22d3ee"
              : "var(--fd-input-color, rgba(255,255,255,0.8))",
          }),
        }}
      />
      {hasExpr && (
        <span
          title="Nhấn Enter để tính"
          style={{
            position: "absolute",
            right: 7,
            top: "50%",
            transform: "translateY(-50%)",
            color: "rgba(34,211,238,0.5)",
            pointerEvents: "none",
          }}
        >
          <Calculator size={12} />
        </span>
      )}
      {hasExpr && computed !== null && focused && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "rgba(10,10,20,0.95)",
            border: "0.5px solid rgba(34,211,238,0.3)",
            borderRadius: 6,
            padding: "4px 9px",
            fontSize: 12,
            fontFamily: "monospace",
            color: "#22d3ee",
            zIndex: 100,
            pointerEvents: "none",
          }}
        >
          = {fmtMoney(computed)}
        </div>
      )}
    </div>
  );
}

// ── Dropdown Portal ───────────────────────────────────────────────────────────

function DropdownPortal({
  children,
  triggerRef,
  onClose,
}: {
  children: React.ReactNode;
  triggerRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left, width: r.width });
  }, [triggerRef]);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node))
        onClose();
    };
    const t = setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", h);
    };
  }, [onClose, triggerRef]);
  return (
    <div
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        minWidth: Math.max(pos.width, 150),
        zIndex: 9999,
        background: "var(--fd-dropdown-bg, rgba(10,10,15,0.97))",
        border: "0.5px solid var(--fd-border, rgba(255,255,255,0.1))",
        borderRadius: 10,
        padding: "4px 0",
        boxShadow: "0 8px 24px rgba(0,0,0,0.7)",
        backdropFilter: "blur(12px)",
      }}
    >
      {children}
    </div>
  );
}

function StatusSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = STATUS_CFG[value] ?? STATUS_CFG.pending;
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          padding: "6px 9px",
          borderRadius: 7,
          background: "var(--fd-input-bg, rgba(255,255,255,0.04))",
          border: `0.5px solid ${cfg.color}40`,
          color: cfg.color,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: cfg.color,
            flexShrink: 0,
          }}
        />
        {cfg.label}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          style={{ marginLeft: "auto", opacity: 0.5 }}
        >
          <path
            d="M2 3.5L5 6.5L8 3.5"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open && (
        <DropdownPortal triggerRef={ref} onClose={() => setOpen(false)}>
          {options.map((opt) => {
            const sc = STATUS_CFG[opt] ?? STATUS_CFG.pending;
            const isActive = opt === value;
            return (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "8px 14px",
                  background: isActive ? sc.color + "15" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive
                    ? sc.color
                    : "var(--fd-text-secondary, rgba(255,255,255,0.65))",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: sc.color,
                    flexShrink: 0,
                  }}
                />
                {sc.label}
              </button>
            );
          })}
        </DropdownPortal>
      )}
    </div>
  );
}

// ── Add Balance Form ──────────────────────────────────────────────────────────

function AddBalanceForm({
  sectionId,
  onAdded,
}: {
  sectionId: string;
  onAdded: (b: DailyBalance) => void;
}) {
  const [date, setDate] = useState(today());
  const [totalExpr, setTotalExpr] = useState("");
  const [profileName, setProfileName] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [exprError, setExprError] = useState(false);

  const computedTotal = evalExpr(totalExpr);
  const hasValue = totalExpr.trim() !== "";
  const canSubmit = !loading && hasValue && computedTotal !== null;

  const handleTotalChange = (raw: string, computed: number | null) => {
    setTotalExpr(raw);
    setExprError(raw.trim() !== "" && computed === null);
  };

  const handleSubmit = async () => {
    if (!canSubmit || computedTotal === null) return;
    setLoading(true);
    try {
      const res = await fetch("/api/finance/balances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId,
          date,
          money1: computedTotal,
          money2: 0,
          total: computedTotal,
          note: note || null,
          profileName: profileName || null,
        }),
      });
      onAdded(await res.json());
      setTotalExpr("");
      setProfileName("");
      setNote("");
      setDate(today());
    } finally {
      setLoading(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    color: "var(--fd-label, rgba(255,255,255,0.3))",
    marginBottom: 4,
  };

  return (
    <div
      style={{
        background: "var(--fd-form-bg, rgba(34,211,238,0.03))",
        border: "0.5px solid var(--fd-form-border, rgba(34,211,238,0.15))",
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "rgba(34,211,238,0.6)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 600,
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Plus size={11} />
        Nhập dữ liệu mới
      </div>

      {/* Row 1: date | profile | total | button */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "140px 1fr 1fr 120px",
          gap: 8,
          alignItems: "end",
        }}
      >
        <div>
          <div style={labelStyle}>Ngày</div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ ...inputCss({ colorScheme: "dark" }) }}
          />
        </div>

        <div>
          <div style={labelStyle}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <User size={9} />
              Tên Profile
            </span>
          </div>
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Ví dụ: Tài khoản chính..."
            style={inputCss()}
          />
        </div>

        <div>
          <div style={labelStyle}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Calculator size={9} />
              Tổng tiền (hỗ trợ tính toán)
            </span>
          </div>
          <div style={{ position: "relative" }}>
            <MathInput
              value={totalExpr}
              onChange={handleTotalChange}
              placeholder="100 hoặc 50+30*2"
            />
            {exprError && (
              <span
                style={{
                  fontSize: 10,
                  color: "#f87171",
                  marginTop: 2,
                  display: "block",
                }}
              >
                Biểu thức không hợp lệ
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 7,
            background: canSubmit
              ? "rgba(34,211,238,0.15)"
              : "rgba(255,255,255,0.05)",
            border: `0.5px solid ${canSubmit ? "rgba(34,211,238,0.35)" : "rgba(255,255,255,0.1)"}`,
            color: canSubmit
              ? "#22d3ee"
              : "var(--fd-muted, rgba(255,255,255,0.2))",
            fontSize: 13,
            fontWeight: 600,
            cursor: canSubmit ? "pointer" : "not-allowed",
            height: 33,
          }}
        >
          <Plus size={13} />
          Thêm
        </button>
      </div>

      {/* Preview tổng */}
      {computedTotal !== null && totalExpr.trim() && (
        <div
          style={{
            marginTop: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "var(--fd-muted, rgba(255,255,255,0.3))",
            }}
          >
            Kết quả:
          </span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "monospace",
              color: "#22d3ee",
              background: "rgba(34,211,238,0.06)",
              border: "0.5px solid rgba(34,211,238,0.2)",
              borderRadius: 6,
              padding: "2px 10px",
            }}
          >
            {fmtMoney(computedTotal)}
          </span>
          {/[+\-*/()]/.test(totalExpr) && (
            <span
              style={{
                fontSize: 10,
                color: "var(--fd-muted, rgba(255,255,255,0.3))",
                fontFamily: "monospace",
              }}
            >
              ({totalExpr})
            </span>
          )}
        </div>
      )}

      {/* Row 2: note */}
      <div style={{ marginTop: 8 }}>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ghi chú (tuỳ chọn)..."
          style={{ ...inputCss({ fontSize: 12 }) }}
        />
      </div>
    </div>
  );
}

// ── Balance Table ─────────────────────────────────────────────────────────────

function BalanceTable({
  sectionId,
  balances,
  onUpdate,
  onDelete,
  onBulkAdd,
}: {
  sectionId: string;
  balances: DailyBalance[];
  onUpdate: (id: string, data: Partial<DailyBalance>) => void;
  onDelete: (id: string) => void;
  onBulkAdd: (items: DailyBalance[]) => void;
}) {
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filter, setFilter] = useState<BalanceFilter>("all");
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const sorted = [...balances].sort((a, b) =>
    sortDir === "desc"
      ? b.date.localeCompare(a.date)
      : a.date.localeCompare(b.date),
  );
  const prevDay = (date: string) => {
    const e = balances
      .filter((b) => b.date < date)
      .sort((a, b) => b.date.localeCompare(a.date));
    return e.length > 0 ? e[0].total : null;
  };
  const annotated = sorted.map((b) => ({ ...b, prevTotal: prevDay(b.date) }));
  const filtered = annotated.filter((b) => {
    if (filter === "all") return true;
    if (b.prevTotal === null) return false;
    return filter === "up" ? b.total > b.prevTotal : b.total < b.prevTotal;
  });

  const patch = async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/finance/balances/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    onUpdate(id, await res.json());
  };

  const patchTotal = async (id: string, expr: string) => {
    const computed = evalExpr(expr);
    if (computed === null) return;
    patch(id, { total: computed, money1: computed, money2: 0 });
  };

  const del = async (id: string) => {
    if (!confirm("Xóa dòng này?")) return;
    await fetch(`/api/finance/balances/${id}`, { method: "DELETE" });
    onDelete(id);
  };

  const handleExport = () => {
    const rows = [...balances]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((b) => [b.date, b.profileName ?? "", b.total, b.note ?? ""]);
    downloadCSV(
      toCSV(["Ngày", "Profile", "Tổng tiền", "Ghi chú"], rows),
      `balance_${sectionId}_${today()}.csv`,
    );
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const rows = parseCSV(await file.text());
      if (rows.length < 2) {
        setToast({ msg: "File CSV rỗng", type: "error" });
        return;
      }
      const header = rows[0].map((h) => h.trim().toLowerCase());
      const iDate = header.findIndex((h) => h.includes("ngày") || h === "date");
      const iTotal = header.findIndex(
        (h) => h.includes("tổng") || h === "total" || h.includes("money"),
      );
      const iProfile = header.findIndex(
        (h) => h.includes("profile") || h.includes("tên"),
      );
      const iNote = header.findIndex((h) => h.includes("ghi") || h === "note");
      if (iDate < 0) {
        setToast({ msg: "Không tìm thấy cột Ngày", type: "error" });
        return;
      }
      let count = 0;
      const items: DailyBalance[] = [];
      for (const row of rows.slice(1)) {
        const date = normDate(row[iDate]?.trim());
        if (!date) continue;
        const total = parseFloat(iTotal >= 0 ? row[iTotal] : "0") || 0;
        const profileName =
          iProfile >= 0 ? row[iProfile]?.trim() || null : null;
        const note = iNote >= 0 ? row[iNote]?.trim() || null : null;
        try {
          const r = await fetch("/api/finance/balances", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sectionId,
              date,
              money1: total,
              money2: 0,
              total,
              note,
              profileName,
            }),
          });
          if (r.ok) {
            items.push(await r.json());
            count++;
          }
        } catch {}
      }
      onBulkAdd(items);
      setToast({ msg: `Import thành công ${count} dòng`, type: "success" });
    } catch {
      setToast({ msg: "Lỗi đọc file", type: "error" });
    }
  };

  const thStyle: React.CSSProperties = {
    padding: "8px 12px",
    fontSize: 10,
    fontWeight: 600,
    color: "var(--fd-th-color, rgba(255,255,255,0.3))",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    textAlign: "left",
    borderBottom: "0.5px solid var(--fd-border, rgba(255,255,255,0.08))",
    background: "var(--fd-th-bg, rgba(8,8,14,0.8))",
    whiteSpace: "nowrap",
  };

  const totalSum = balances.reduce((s, b) => s + b.total, 0);
  const avgTotal = balances.length > 0 ? totalSum / balances.length : 0;

  return (
    <div>
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <input
        ref={importRef}
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        onChange={handleImport}
      />

      {/* Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 10,
          marginBottom: 14,
        }}
      >
        {[
          {
            label: "Tổng cộng",
            value: fmtMoney(totalSum),
            color: "#22d3ee",
            icon: <DollarSign size={14} />,
          },
          {
            label: "Trung bình/ngày",
            value: fmtMoney(avgTotal),
            color: "#a855f7",
            icon: <CalendarDays size={14} />,
          },
          {
            label: "Số ngày ghi",
            value: String(balances.length),
            color: "#fbbf24",
            icon: <Zap size={14} />,
          },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              padding: "10px 14px",
              borderRadius: 9,
              background: "var(--fd-card-bg, rgba(0,0,0,0.3))",
              border: `0.5px solid ${card.color}25`,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ color: card.color, opacity: 0.7 }}>{card.icon}</span>
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--fd-label, rgba(255,255,255,0.3))",
                  marginBottom: 2,
                }}
              >
                {card.label}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: "monospace",
                  color: card.color,
                }}
              >
                {card.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter + sort + export/import */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "var(--fd-muted, rgba(255,255,255,0.25))",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Filter size={11} /> Lọc:
        </span>
        {(["all", "up", "down"] as BalanceFilter[]).map((f) => {
          const labels: Record<BalanceFilter, string> = {
            all: "Tất cả",
            up: "Tăng",
            down: "Giảm",
          };
          const colors: Record<BalanceFilter, string> = {
            all: "#888",
            up: "#34d399",
            down: "#f87171",
          };
          const isActive = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: isActive ? 600 : 400,
                border: `0.5px solid ${isActive ? colors[f] + "50" : "var(--fd-border, rgba(255,255,255,0.1))"}`,
                background: isActive ? colors[f] + "15" : "transparent",
                color: isActive
                  ? colors[f]
                  : "var(--fd-muted, rgba(255,255,255,0.4))",
                cursor: "pointer",
              }}
            >
              {labels[f]}
            </button>
          );
        })}
        <button
          onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 10px",
            borderRadius: 6,
            fontSize: 11,
            border: "0.5px solid var(--fd-border, rgba(255,255,255,0.1))",
            background: "transparent",
            color: "var(--fd-muted, rgba(255,255,255,0.4))",
            cursor: "pointer",
          }}
        >
          <ArrowUpDown size={10} />
          {sortDir === "desc" ? "Mới nhất" : "Cũ nhất"}
        </button>

        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button
            onClick={() => importRef.current?.click()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 11px",
              borderRadius: 7,
              fontSize: 12,
              border: "0.5px solid rgba(168,85,247,0.35)",
              background: "rgba(168,85,247,0.08)",
              color: "#a855f7",
              cursor: "pointer",
            }}
          >
            <Upload size={12} /> Import CSV
          </button>
          <button
            onClick={handleExport}
            disabled={balances.length === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 11px",
              borderRadius: 7,
              fontSize: 12,
              border: `0.5px solid ${balances.length > 0 ? "rgba(34,211,238,0.35)" : "var(--fd-border, rgba(255,255,255,0.1))"}`,
              background:
                balances.length > 0 ? "rgba(34,211,238,0.08)" : "transparent",
              color:
                balances.length > 0
                  ? "#22d3ee"
                  : "var(--fd-muted, rgba(255,255,255,0.2))",
              cursor: balances.length > 0 ? "pointer" : "not-allowed",
            }}
          >
            <Download size={12} /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          borderRadius: 10,
          border: "0.5px solid var(--fd-border, rgba(255,255,255,0.08))",
          overflow: "hidden",
        }}
      >
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
        >
          <thead>
            <tr>
              <th style={thStyle}>Ngày</th>
              <th style={thStyle}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <User size={10} /> Profile
                </span>
              </th>
              <th style={{ ...thStyle, textAlign: "right" }}>Tổng tiền</th>
              <th style={thStyle}>Lãi/Lỗ so hôm trước</th>
              <th style={thStyle}>Ghi chú</th>
              <th style={{ ...thStyle, width: 50, textAlign: "center" }}>
                Xóa
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    padding: 32,
                    color: "var(--fd-muted, rgba(255,255,255,0.15))",
                    fontSize: 13,
                  }}
                >
                  Không có dữ liệu
                </td>
              </tr>
            )}
            {filtered.map((row, i) => (
              <tr
                key={row.id}
                style={{
                  borderBottom:
                    i < filtered.length - 1
                      ? "0.5px solid var(--fd-border, rgba(255,255,255,0.05))"
                      : "none",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background =
                    "var(--fd-row-hover, rgba(255,255,255,0.02))")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background =
                    "transparent")
                }
              >
                <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--fd-text-secondary, rgba(255,255,255,0.6))",
                    }}
                  >
                    {fmtDate(row.date)}
                  </span>
                </td>

                {/* Profile name cell */}
                <td style={{ padding: "6px 12px", minWidth: 120 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <User
                      size={11}
                      style={{ color: "#a855f7", flexShrink: 0, opacity: 0.6 }}
                    />
                    <EditableCell
                      value={row.profileName ?? null}
                      placeholder="—"
                      onSave={(v) => patch(row.id, { profileName: v || null })}
                    />
                  </div>
                </td>

                {/* Total — editable with math */}
                <td style={{ padding: "6px 12px", textAlign: "right" }}>
                  <TotalEditCell
                    value={row.total}
                    onSave={(expr) => patchTotal(row.id, expr)}
                  />
                </td>

                <td style={{ padding: "8px 12px" }}>
                  <PnlBadge current={row.total} prev={row.prevTotal} />
                </td>

                <td style={{ padding: "6px 12px", minWidth: 120 }}>
                  <EditableCell
                    value={row.note}
                    placeholder="Ghi chú..."
                    onSave={(v) => patch(row.id, { note: v })}
                  />
                </td>

                <td style={{ padding: "6px 8px", textAlign: "center" }}>
                  <button
                    onClick={() => del(row.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "rgba(248,113,113,0.5)",
                      padding: 4,
                      borderRadius: 5,
                      display: "inline-flex",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "#f87171";
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(248,113,113,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color =
                        "rgba(248,113,113,0.5)";
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Total Edit Cell (inline math editing) ────────────────────────────────────

function TotalEditCell({
  value,
  onSave,
}: {
  value: number;
  onSave: (expr: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [expr, setExpr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const computed = evalExpr(expr);

  useEffect(() => {
    if (editing) {
      setExpr(String(value));
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [editing, value]);

  const commit = () => {
    setEditing(false);
    if (expr.trim() && computed !== null) onSave(expr);
  };

  if (editing) {
    return (
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          style={{
            width: "100%",
            background: "rgba(34,211,238,0.07)",
            border: "0.5px solid rgba(34,211,238,0.4)",
            borderRadius: 5,
            color: "#22d3ee",
            fontSize: 12,
            padding: "3px 6px",
            outline: "none",
            textAlign: "right",
            fontFamily: "monospace",
          }}
        />
        {computed !== null && expr !== String(value) && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 2px)",
              right: 0,
              fontSize: 11,
              color: "#22d3ee",
              background: "rgba(10,10,20,0.9)",
              border: "0.5px solid rgba(34,211,238,0.2)",
              borderRadius: 5,
              padding: "2px 7px",
              fontFamily: "monospace",
              whiteSpace: "nowrap",
              zIndex: 50,
            }}
          >
            = {fmtMoney(computed)}
          </div>
        )}
      </div>
    );
  }

  return (
    <span
      onDoubleClick={() => setEditing(true)}
      title="Double-click để sửa (hỗ trợ +/-/*//)"
      style={{
        display: "block",
        textAlign: "right",
        fontFamily: "monospace",
        fontWeight: 700,
        fontSize: 13,
        color: "#22d3ee",
        cursor: "default",
        padding: "3px 0",
        userSelect: "none",
      }}
    >
      {fmtMoney(value)}
    </span>
  );
}

// ── Add Event Form ────────────────────────────────────────────────────────────

function AddEventForm({
  sectionId,
  onAdded,
}: {
  sectionId: string;
  onAdded: (e: EmailEvent) => void;
}) {
  const blank = {
    email: "",
    exchange: "",
    eventCode: "",
    eventName: "",
    amount: "",
    status: "pending",
    eventDate: "",
    note: "",
  };
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const canSubmit =
    !loading && !!form.email && !!form.exchange && !!form.eventCode;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await fetch("/api/finance/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId, ...form }),
      });
      onAdded(await res.json());
      setForm(blank);
    } finally {
      setLoading(false);
    }
  };

  const L = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        fontSize: 10,
        color: "var(--fd-label, rgba(255,255,255,0.3))",
        marginBottom: 3,
      }}
    >
      {children}
    </div>
  );

  return (
    <div
      style={{
        background: "var(--fd-form-bg2, rgba(168,85,247,0.03))",
        border: "0.5px solid rgba(168,85,247,0.15)",
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "rgba(168,85,247,0.6)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 600,
          marginBottom: 12,
        }}
      >
        Thêm sự kiện / email
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <div>
          <L>Email *</L>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="user@example.com"
            style={inputCss()}
          />
        </div>
        <div>
          <L>Sàn giao dịch *</L>
          <input
            value={form.exchange}
            onChange={(e) => set("exchange", e.target.value)}
            placeholder="Binance, OKX..."
            style={inputCss()}
          />
        </div>
        <div>
          <L>Mã sự kiện *</L>
          <input
            value={form.eventCode}
            onChange={(e) => set("eventCode", e.target.value)}
            placeholder="ENCT-001"
            style={inputCss()}
          />
        </div>
        <div>
          <L>Tên sự kiện</L>
          <input
            value={form.eventName}
            onChange={(e) => set("eventName", e.target.value)}
            placeholder="Airdrop, Staking..."
            style={inputCss()}
          />
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 140px",
          gap: 8,
          alignItems: "end",
        }}
      >
        <div>
          <L>Số tiền</L>
          <input
            type="number"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            placeholder="0"
            style={inputCss()}
          />
        </div>
        <div>
          <L>Ngày sự kiện</L>
          <input
            type="date"
            value={form.eventDate}
            onChange={(e) => set("eventDate", e.target.value)}
            style={{ ...inputCss(), colorScheme: "dark" }}
          />
        </div>
        <div>
          <L>Trạng thái</L>
          <StatusSelect
            value={form.status}
            onChange={(v) => set("status", v)}
            options={["pending", "confirmed", "cancelled"]}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 7,
            background: canSubmit
              ? "rgba(168,85,247,0.15)"
              : "rgba(255,255,255,0.05)",
            border: `0.5px solid ${canSubmit ? "rgba(168,85,247,0.35)" : "rgba(255,255,255,0.1)"}`,
            color: canSubmit
              ? "#a855f7"
              : "var(--fd-muted, rgba(255,255,255,0.2))",
            fontSize: 13,
            fontWeight: 600,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          <Plus size={13} /> Thêm
        </button>
      </div>
      <div style={{ marginTop: 8 }}>
        <input
          type="text"
          value={form.note}
          onChange={(e) => set("note", e.target.value)}
          placeholder="Ghi chú..."
          style={{ ...inputCss({ fontSize: 12 }) }}
        />
      </div>
    </div>
  );
}

// ── Event Table ───────────────────────────────────────────────────────────────

function EventTable({
  sectionId,
  events,
  onUpdate,
  onDelete,
  onDuplicate,
  onBulkAdd,
}: {
  sectionId: string;
  events: EmailEvent[];
  onUpdate: (id: string, data: Partial<EmailEvent>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onBulkAdd: (items: EmailEvent[]) => void;
}) {
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<EventSortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const toggleSort = (f: EventSortField) => {
    if (sortField === f) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortField(f);
      setSortDir("desc");
    }
  };

  const displayed = [...events]
    .filter((e) => filterStatus === "all" || e.status === filterStatus)
    .filter(
      (e) =>
        !search ||
        [e.email, e.exchange, e.eventCode, e.eventName ?? ""].some((v) =>
          v.toLowerCase().includes(search.toLowerCase()),
        ),
    )
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "amount")
        cmp = (a.amount ?? -Infinity) - (b.amount ?? -Infinity);
      else
        cmp = String(a[sortField] ?? "").localeCompare(
          String(b[sortField] ?? ""),
        );
      return sortDir === "desc" ? -cmp : cmp;
    });

  const patch = async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/finance/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    onUpdate(id, await res.json());
  };
  const del = async (id: string) => {
    if (!confirm("Xóa dòng này?")) return;
    await fetch(`/api/finance/events/${id}`, { method: "DELETE" });
    onDelete(id);
  };
  const cycleStatus = async (id: string, current: string) => {
    const order = ["pending", "confirmed", "cancelled"];
    await patch(id, {
      status: order[(order.indexOf(current) + 1) % order.length],
    });
  };

  const handleExport = () => {
    const rows = events.map((e) => [
      e.email,
      e.exchange,
      e.eventCode,
      e.eventName ?? "",
      e.amount ?? 0,
      e.eventDate ?? "",
      e.status,
      e.note ?? "",
    ]);
    downloadCSV(
      toCSV(
        [
          "Email",
          "Sàn",
          "Mã ENCT",
          "Tên sự kiện",
          "Số tiền",
          "Ngày sự kiện",
          "Trạng thái",
          "Ghi chú",
        ],
        rows,
      ),
      `events_${sectionId}_${today()}.csv`,
    );
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const rows = parseCSV(await file.text());
      if (rows.length < 2) {
        setToast({ msg: "File CSV rỗng", type: "error" });
        return;
      }
      const hdr = rows[0].map((h) => h.trim().toLowerCase());
      const iEmail = hdr.findIndex((h) => h.includes("email"));
      const iExch = hdr.findIndex((h) => h.includes("sàn") || h === "exchange");
      const iCode = hdr.findIndex(
        (h) => h.includes("mã") || h.includes("enct") || h === "eventcode",
      );
      if (iEmail < 0 || iExch < 0 || iCode < 0) {
        setToast({ msg: "Thiếu cột Email, Sàn hoặc Mã ENCT", type: "error" });
        return;
      }
      let count = 0;
      const items: EmailEvent[] = [];
      for (const row of rows.slice(1)) {
        const email = row[iEmail]?.trim();
        if (!email) continue;
        try {
          const r = await fetch("/api/finance/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sectionId,
              email,
              exchange: row[iExch]?.trim(),
              eventCode: row[iCode]?.trim(),
              status: "pending",
            }),
          });
          if (r.ok) {
            items.push(await r.json());
            count++;
          }
        } catch {}
      }
      onBulkAdd(items);
      setToast({ msg: `Import thành công ${count} sự kiện`, type: "success" });
    } catch {
      setToast({ msg: "Lỗi đọc file", type: "error" });
    }
  };

  const thStyle: React.CSSProperties = {
    padding: "8px 12px",
    fontSize: 10,
    fontWeight: 600,
    color: "var(--fd-th-color, rgba(255,255,255,0.3))",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    textAlign: "left",
    borderBottom: "0.5px solid var(--fd-border, rgba(255,255,255,0.08))",
    background: "var(--fd-th-bg, rgba(8,8,14,0.8))",
    whiteSpace: "nowrap",
  };

  return (
    <div>
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <input
        ref={importRef}
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        onChange={handleImport}
      />

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm email, sàn, mã sự kiện..."
          style={{
            background: "var(--fd-input-bg, rgba(255,255,255,0.04))",
            border: "0.5px solid var(--fd-input-border, rgba(255,255,255,0.1))",
            borderRadius: 7,
            color: "var(--fd-input-color, rgba(255,255,255,0.75))",
            fontSize: 12,
            padding: "6px 10px",
            outline: "none",
            width: 220,
          }}
        />
        {(["createdAt", "eventDate", "amount"] as EventSortField[]).map((f) => {
          const labels: Record<EventSortField, string> = {
            createdAt: "Ngày tạo",
            eventDate: "Ngày SK",
            amount: "Số tiền",
          };
          const isActive = sortField === f;
          return (
            <button
              key={f}
              onClick={() => toggleSort(f)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 9px",
                borderRadius: 6,
                fontSize: 11,
                border: `0.5px solid ${isActive ? "rgba(34,211,238,0.4)" : "var(--fd-border, rgba(255,255,255,0.1))"}`,
                background: isActive ? "rgba(34,211,238,0.08)" : "transparent",
                color: isActive
                  ? "#22d3ee"
                  : "var(--fd-muted, rgba(255,255,255,0.4))",
                cursor: "pointer",
              }}
            >
              <ArrowUpDown size={10} /> {labels[f]}{" "}
              {isActive && (
                <span style={{ fontSize: 9 }}>
                  {sortDir === "desc" ? "↓" : "↑"}
                </span>
              )}
            </button>
          );
        })}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {["all", "pending", "confirmed", "cancelled"].map((s) => {
            const cfg = STATUS_CFG[s] ?? { label: "Tất cả", color: "#888" };
            const isActive = filterStatus === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 400,
                  border: `0.5px solid ${isActive ? cfg.color + "50" : "var(--fd-border, rgba(255,255,255,0.1))"}`,
                  background: isActive ? cfg.color + "15" : "transparent",
                  color: isActive
                    ? cfg.color
                    : "var(--fd-muted, rgba(255,255,255,0.4))",
                  cursor: "pointer",
                }}
              >
                {s === "all" ? "Tất cả" : cfg.label}
              </button>
            );
          })}
          <button
            onClick={() => importRef.current?.click()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 11px",
              borderRadius: 7,
              fontSize: 12,
              border: "0.5px solid rgba(168,85,247,0.35)",
              background: "rgba(168,85,247,0.08)",
              color: "#a855f7",
              cursor: "pointer",
            }}
          >
            <Upload size={12} /> Import CSV
          </button>
          <button
            onClick={handleExport}
            disabled={events.length === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 11px",
              borderRadius: 7,
              fontSize: 12,
              border: `0.5px solid ${events.length > 0 ? "rgba(34,211,238,0.35)" : "var(--fd-border, rgba(255,255,255,0.1))"}`,
              background:
                events.length > 0 ? "rgba(34,211,238,0.08)" : "transparent",
              color:
                events.length > 0
                  ? "#22d3ee"
                  : "var(--fd-muted, rgba(255,255,255,0.2))",
              cursor: events.length > 0 ? "pointer" : "not-allowed",
            }}
          >
            <Download size={12} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 10,
          marginBottom: 14,
        }}
      >
        {[
          {
            label: "Tổng sự kiện",
            value: String(events.length),
            color: "#a855f7",
          },
          {
            label: "Confirmed",
            value: String(
              events.filter((e) => e.status === "confirmed").length,
            ),
            color: "#34d399",
          },
          {
            label: "Tổng tiền",
            value: fmtMoney(events.reduce((s, e) => s + (e.amount ?? 0), 0)),
            color: "#22d3ee",
          },
        ].map((c) => (
          <div
            key={c.label}
            style={{
              padding: "10px 14px",
              borderRadius: 9,
              background: "var(--fd-card-bg, rgba(0,0,0,0.3))",
              border: `0.5px solid ${c.color}25`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "var(--fd-label, rgba(255,255,255,0.3))",
                marginBottom: 2,
              }}
            >
              {c.label}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily: "monospace",
                color: c.color,
              }}
            >
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div
        style={{
          borderRadius: 10,
          border: "0.5px solid var(--fd-border, rgba(255,255,255,0.08))",
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            minWidth: 900,
            borderCollapse: "collapse",
            fontSize: 12,
          }}
        >
          <thead>
            <tr>
              <th style={{ ...thStyle, minWidth: 180 }}>Email</th>
              <th style={thStyle}>Sàn</th>
              <th style={thStyle}>Mã ENCT</th>
              <th style={thStyle}>Tên sự kiện</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Số tiền</th>
              <th style={thStyle}>Ngày sự kiện</th>
              <th style={thStyle}>Trạng thái</th>
              <th style={thStyle}>Ghi chú</th>
              <th style={{ ...thStyle, width: 80, textAlign: "center" }}>
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    textAlign: "center",
                    padding: 32,
                    color: "var(--fd-muted, rgba(255,255,255,0.15))",
                    fontSize: 13,
                  }}
                >
                  Không có dữ liệu
                </td>
              </tr>
            )}
            {displayed.map((row, i) => {
              const sc = STATUS_CFG[row.status] ?? STATUS_CFG.pending;
              return (
                <tr
                  key={row.id}
                  style={{
                    borderBottom:
                      i < displayed.length - 1
                        ? "0.5px solid var(--fd-border, rgba(255,255,255,0.05))"
                        : "none",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "var(--fd-row-hover, rgba(255,255,255,0.02))")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "transparent")
                  }
                >
                  <td style={{ padding: "6px 12px", maxWidth: 200 }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 5 }}
                    >
                      <Mail
                        size={11}
                        style={{ color: "#a855f7", flexShrink: 0 }}
                      />
                      <EditableCell
                        value={row.email}
                        onSave={(v) => patch(row.id, { email: v })}
                      />
                    </div>
                  </td>
                  <td style={{ padding: "6px 12px" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 5 }}
                    >
                      <Landmark
                        size={11}
                        style={{ color: "#22d3ee", flexShrink: 0 }}
                      />
                      <EditableCell
                        value={row.exchange}
                        onSave={(v) => patch(row.id, { exchange: v })}
                      />
                    </div>
                  </td>
                  <td style={{ padding: "6px 12px" }}>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 11,
                        color: "#fbbf24",
                        background: "rgba(251,191,36,0.08)",
                        border: "0.5px solid rgba(251,191,36,0.2)",
                        borderRadius: 4,
                        padding: "2px 6px",
                      }}
                    >
                      {row.eventCode}
                    </span>
                  </td>
                  <td style={{ padding: "6px 12px" }}>
                    <EditableCell
                      value={row.eventName}
                      placeholder="—"
                      onSave={(v) => patch(row.id, { eventName: v })}
                    />
                  </td>
                  <td style={{ padding: "6px 12px", textAlign: "right" }}>
                    <EditableCell
                      value={row.amount}
                      type="number"
                      align="right"
                      placeholder="—"
                      onSave={(v) => patch(row.id, { amount: v })}
                    />
                  </td>
                  <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--fd-muted, rgba(255,255,255,0.45))",
                      }}
                    >
                      {row.eventDate ? fmtDate(row.eventDate) : "—"}
                    </span>
                  </td>
                  <td style={{ padding: "6px 12px" }}>
                    <button
                      onClick={() => cycleStatus(row.id, row.status)}
                      title="Click để đổi"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 10,
                        fontWeight: 600,
                        color: sc.color,
                        background: sc.bg,
                        border: `0.5px solid ${sc.border}`,
                        borderRadius: 5,
                        padding: "3px 8px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: sc.color,
                          flexShrink: 0,
                        }}
                      />
                      {sc.label}
                    </button>
                  </td>
                  <td style={{ padding: "6px 12px", minWidth: 120 }}>
                    <EditableCell
                      value={row.note}
                      placeholder="Ghi chú..."
                      onSave={(v) => patch(row.id, { note: v })}
                    />
                  </td>
                  <td style={{ padding: "6px 8px", textAlign: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                    >
                      <button
                        onClick={() => onDuplicate(row.id)}
                        title="Duplicate"
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "rgba(34,211,238,0.45)",
                          padding: "3px 4px",
                          borderRadius: 5,
                          display: "inline-flex",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.color =
                            "#22d3ee";
                          (e.currentTarget as HTMLElement).style.background =
                            "rgba(34,211,238,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.color =
                            "rgba(34,211,238,0.45)";
                          (e.currentTarget as HTMLElement).style.background =
                            "transparent";
                        }}
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        onClick={() => del(row.id)}
                        title="Xóa"
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "rgba(248,113,113,0.5)",
                          padding: "3px 4px",
                          borderRadius: 5,
                          display: "inline-flex",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.color =
                            "#f87171";
                          (e.currentTarget as HTMLElement).style.background =
                            "rgba(248,113,113,0.1)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.color =
                            "rgba(248,113,113,0.5)";
                          (e.currentTarget as HTMLElement).style.background =
                            "transparent";
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function FinanceDashboard({ sectionId }: { sectionId: string }) {
  const [tab, setTab] = useState<Tab>("balance");
  const [balances, setBalances] = useState<DailyBalance[]>([]);
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sectionId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/finance/balances?sectionId=${sectionId}`).then((r) =>
        r.json(),
      ),
      fetch(`/api/finance/events?sectionId=${sectionId}`).then((r) => r.json()),
    ]).then(([b, e]) => {
      setBalances(Array.isArray(b) ? b : []);
      setEvents(Array.isArray(e) ? e : []);
      setLoading(false);
    });
  }, [sectionId]);

  const addBalance = (b: DailyBalance) => setBalances((p) => [b, ...p]);
  const updateBalance = (id: string, d: Partial<DailyBalance>) =>
    setBalances((p) => p.map((b) => (b.id === id ? { ...b, ...d } : b)));
  const deleteBalance = (id: string) =>
    setBalances((p) => p.filter((b) => b.id !== id));
  const bulkAddBalances = (items: DailyBalance[]) =>
    setBalances((p) => [...items, ...p]);

  const addEvent = (e: EmailEvent) => setEvents((p) => [e, ...p]);
  const updateEvent = (id: string, d: Partial<EmailEvent>) =>
    setEvents((p) => p.map((e) => (e.id === id ? { ...e, ...d } : e)));
  const deleteEvent = (id: string) =>
    setEvents((p) => p.filter((e) => e.id !== id));
  const bulkAddEvents = (items: EmailEvent[]) =>
    setEvents((p) => [...items, ...p]);

  const duplicateEvent = async (id: string) => {
    const orig = events.find((e) => e.id === id);
    if (!orig) return;
    const res = await fetch("/api/finance/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...orig, eventCode: orig.eventCode + "-copy" }),
    });
    if (res.ok) addEvent(await res.json());
  };

  const TABS: {
    id: Tab;
    label: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      id: "balance",
      label: "Lãi/Lỗ hằng ngày",
      icon: <TrendingUp size={13} />,
      color: "#22d3ee",
    },
    {
      id: "events",
      label: "Email & Sự kiện",
      icon: <Mail size={13} />,
      color: "#a855f7",
    },
  ];

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
      {/* Header */}
      <div
        style={{
          padding: "20px 24px 0",
          borderBottom: "0.5px solid var(--fd-border, rgba(255,255,255,0.08))",
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            background: "linear-gradient(135deg,#22d3ee,#a855f7,#f472b6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 4,
          }}
        >
          Finance Manager
        </h2>
        <p
          style={{
            fontSize: 12,
            color: "var(--fd-muted, rgba(255,255,255,0.3))",
            marginBottom: 16,
          }}
        >
          Quản lý lãi lỗ hàng ngày & sự kiện email/sàn
        </p>
        <div style={{ display: "flex" }}>
          {TABS.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "9px 18px",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  background: "transparent",
                  border: "none",
                  borderBottom: `2px solid ${isActive ? t.color : "transparent"}`,
                  color: isActive
                    ? t.color
                    : "var(--fd-muted, rgba(255,255,255,0.4))",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  marginBottom: -1,
                }}
              >
                {t.icon} {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "visible",
          padding: "20px 24px",
        }}
      >
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 200,
              color: "var(--fd-muted, rgba(255,255,255,0.2))",
              fontSize: 13,
            }}
          >
            Đang tải...
          </div>
        ) : tab === "balance" ? (
          <>
            <BalanceCharts balances={balances} />
            <AddBalanceForm sectionId={sectionId} onAdded={addBalance} />
            <BalanceTable
              sectionId={sectionId}
              balances={balances}
              onUpdate={updateBalance}
              onDelete={deleteBalance}
              onBulkAdd={bulkAddBalances}
            />
          </>
        ) : (
          <>
            <EventCharts events={events} />
            <AddEventForm sectionId={sectionId} onAdded={addEvent} />
            <EventTable
              sectionId={sectionId}
              events={events}
              onUpdate={updateEvent}
              onDelete={deleteEvent}
              onDuplicate={duplicateEvent}
              onBulkAdd={bulkAddEvents}
            />
          </>
        )}
      </div>

      <style>{`
        @keyframes slideUp { from { transform:translateY(12px); opacity:0; } to { transform:translateY(0); opacity:1; } }

        /* ── Light theme overrides for FinanceDashboard ── */
        :root.light .fd-context,
        html.light .fd-context {
          --fd-input-bg: rgba(0,0,0,0.04);
          --fd-input-border: rgba(0,0,0,0.12);
          --fd-input-color: rgba(0,0,0,0.75);
          --fd-label: rgba(0,0,0,0.4);
          --fd-muted: rgba(0,0,0,0.3);
          --fd-text: rgba(0,0,0,0.85);
          --fd-text-secondary: rgba(0,0,0,0.65);
          --fd-border: rgba(0,0,0,0.08);
          --fd-card-bg: rgba(0,0,0,0.04);
          --fd-th-bg: rgba(240,240,245,0.9);
          --fd-th-color: rgba(0,0,0,0.4);
          --fd-row-hover: rgba(0,0,0,0.02);
          --fd-form-bg: rgba(34,211,238,0.05);
          --fd-form-bg2: rgba(168,85,247,0.05);
          --fd-form-border: rgba(34,211,238,0.2);
          --fd-toast-bg: rgba(255,255,255,0.97);
          --fd-dropdown-bg: rgba(255,255,255,0.97);
        }
      `}</style>
    </div>
  );
}
