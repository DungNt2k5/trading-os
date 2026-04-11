"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  useAppStore,
  parseMeta,
  stringifyMeta,
  TradingMeta,
  ExpenseMeta,
} from "@/store/useAppStore";
import { useEditor, EditorContent } from "@tiptap/react";

// TipTap extensions
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import CharacterCount from "@tiptap/extension-character-count";
import { createLowlight, common } from "lowlight";

// Local extensions
import { SlashCommand } from "./ui/SlashCommand";
import { CalloutNode } from "./ui/CalloutNode";
import BubbleToolbar from "./ui/BubbleToolbar";
import HoverBlockMenu from "./ui/HoverBlockMenu";

// Icons
import {
  ChevronLeft,
  DollarSign,
  Tag,
  CheckCircle2,
  Loader2,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  ShieldAlert,
  BarChart2,
  Clock,
  Layers,
  CreditCard,
  Store,
  StickyNote,
  Hash,
} from "lucide-react";

// ── Lowlight setup ────────────────────────────────────────────────────────────

const lowlight = createLowlight(common);

// ── Tiptap global styles ──────────────────────────────────────────────────────

const EDITOR_STYLES = `
    .tiptap-editor .ProseMirror {
      outline: none;
      min-height: 55vh;
      padding-left: 8px;
      color: rgba(255,255,255,0.75);
      font-size: 15px;
      line-height: 1.8;
      caret-color: #22d3ee;
    }
    .tiptap-editor .ProseMirror > * + * { margin-top: 0.6em; }
    .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      color: rgba(255,255,255,0.12);
      pointer-events: none;
      float: left;
      height: 0;
    }
    .tiptap-editor .ProseMirror h1 {
      font-size: 2em; font-weight: 700; color: rgba(255,255,255,0.92);
      margin: 1.2em 0 0.4em; line-height: 1.2;
      background: linear-gradient(135deg, #fff 0%, rgba(34,211,238,0.8) 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .tiptap-editor .ProseMirror h2 {
      font-size: 1.4em; font-weight: 600; color: rgba(255,255,255,0.88);
      margin: 1em 0 0.35em; line-height: 1.3;
    }
    .tiptap-editor .ProseMirror h3 {
      font-size: 1.15em; font-weight: 600; color: rgba(255,255,255,0.82);
      margin: 0.8em 0 0.3em;
    }
    .tiptap-editor .ProseMirror ul,
    .tiptap-editor .ProseMirror ol { padding-left: 1.4em; }
    .tiptap-editor .ProseMirror ul li { list-style: disc; }
    .tiptap-editor .ProseMirror ol li { list-style: decimal; }
    .tiptap-editor .ProseMirror li { margin: 0.25em 0; }
    .tiptap-editor .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0; }
    .tiptap-editor .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 8px; }
    .tiptap-editor .ProseMirror ul[data-type="taskList"] li > label { flex-shrink: 0; margin-top: 3px; }
    .tiptap-editor .ProseMirror ul[data-type="taskList"] li > label input[type="checkbox"] { width: 15px; height: 15px; cursor: pointer; accent-color: #22d3ee; }
    .tiptap-editor .ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div { color: rgba(255,255,255,0.3); text-decoration: line-through; }
    .tiptap-editor .ProseMirror ul[data-type="taskList"] li > div { flex: 1; }
    .tiptap-editor .ProseMirror code {
      background: rgba(6,182,212,0.1);
      border: 0.5px solid rgba(6,182,212,0.2);
      border-radius: 4px; padding: 1px 5px;
      font-family: 'Fira Code', 'Cascadia Code', monospace;
      font-size: 0.88em; color: #22d3ee;
    }
    .tiptap-editor .ProseMirror pre {
      background: rgba(0,0,0,0.5);
      border: 0.5px solid rgba(255,255,255,0.08);
      border-radius: 10px; padding: 16px 20px; overflow-x: auto; margin: 1em 0;
    }
    .tiptap-editor .ProseMirror pre code { background: none; border: none; padding: 0; color: rgba(255,255,255,0.75); font-size: 0.88em; }
    .tiptap-editor .ProseMirror blockquote {
      border-left: 3px solid rgba(6,182,212,0.4);
      padding: 4px 0 4px 16px; color: rgba(255,255,255,0.5); font-style: italic; margin: 1em 0;
    }
    .tiptap-editor .ProseMirror hr { border: none; border-top: 0.5px solid rgba(255,255,255,0.1); margin: 2em 0; }
    .tiptap-editor .ProseMirror a { color: #22d3ee; text-decoration: underline; text-underline-offset: 3px; text-decoration-color: rgba(34,211,238,0.4); cursor: pointer; }
    .tiptap-editor .ProseMirror a:hover { text-decoration-color: rgba(34,211,238,0.9); }
    .tiptap-editor .ProseMirror mark { background: rgba(251,191,36,0.25); color: rgba(255,255,255,0.85); border-radius: 3px; padding: 0 2px; }
    .tiptap-editor .ProseMirror img { max-width: 100%; border-radius: 10px; border: 0.5px solid rgba(255,255,255,0.08); margin: 1em 0; }
    .tiptap-editor .ProseMirror img.ProseMirror-selectednode { outline: 2px solid rgba(6,182,212,0.6); }
    .tiptap-editor .hljs-keyword { color: #c792ea; }
    .tiptap-editor .hljs-string  { color: #c3e88d; }
    .tiptap-editor .hljs-comment { color: rgba(255,255,255,0.3); font-style: italic; }
    .tiptap-editor .hljs-number  { color: #f78c6c; }
    .tiptap-editor .hljs-function { color: #82aaff; }
    .tiptap-editor .hljs-title   { color: #82aaff; }
    .tiptap-editor .hljs-built_in { color: #ffcb6b; }
    .tiptap-editor .hljs-type    { color: #ffcb6b; }
    .tiptap-editor .hljs-attr    { color: #89ddff; }
    .tiptap-editor .hljs-variable { color: #f07178; }
    .tiptap-editor .hljs-operator { color: #89ddff; }
    .tiptap-editor .hljs-params  { color: rgba(255,255,255,0.65); }
    .tiptap-editor .ProseMirror ::selection { background: rgba(6,182,212,0.2); }
    .tippy-box { background: none !important; box-shadow: none !important; }
    .tippy-content { padding: 0 !important; }
  `;

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcRR(entry: string, sl: string, tp: string, dir: string): string {
  const e = parseFloat(entry);
  const s = parseFloat(sl);
  const t = parseFloat(tp);
  if (!e || !s || !t || e === s) return "";
  const risk = Math.abs(e - s);
  const reward = Math.abs(t - e);
  const rr = reward / risk;
  return isNaN(rr) ? "" : rr.toFixed(2);
}

// ── Sub-components ────────────────────────────────────────────────────────────

const ACCENT: Record<
  string,
  { bg: string; border: string; hover: string; label: string; text: string }
> = {
  cyan: {
    bg: "rgba(6,182,212,0.05)",
    border: "rgba(6,182,212,0.2)",
    hover: "rgba(6,182,212,0.35)",
    label: "rgba(6,182,212,0.5)",
    text: "#22d3ee",
  },
  purple: {
    bg: "rgba(168,85,247,0.05)",
    border: "rgba(168,85,247,0.2)",
    hover: "rgba(168,85,247,0.35)",
    label: "rgba(168,85,247,0.5)",
    text: "#c084fc",
  },
  pink: {
    bg: "rgba(236,72,153,0.05)",
    border: "rgba(236,72,153,0.2)",
    hover: "rgba(236,72,153,0.35)",
    label: "rgba(236,72,153,0.5)",
    text: "#f472b6",
  },
  amber: {
    bg: "rgba(245,158,11,0.05)",
    border: "rgba(245,158,11,0.2)",
    hover: "rgba(245,158,11,0.35)",
    label: "rgba(245,158,11,0.5)",
    text: "#fbbf24",
  },
  emerald: {
    bg: "rgba(16,185,129,0.05)",
    border: "rgba(16,185,129,0.2)",
    hover: "rgba(16,185,129,0.35)",
    label: "rgba(16,185,129,0.5)",
    text: "#34d399",
  },
  red: {
    bg: "rgba(239,68,68,0.05)",
    border: "rgba(239,68,68,0.2)",
    hover: "rgba(239,68,68,0.35)",
    label: "rgba(239,68,68,0.5)",
    text: "#f87171",
  },
};

function MetaField({
  icon,
  label,
  accent = "cyan",
  children,
}: {
  icon: React.ReactNode;
  label: string;
  accent?: string;
  children: React.ReactNode;
}) {
  const c = ACCENT[accent] ?? ACCENT.cyan;
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "5px 11px",
        borderRadius: 8,
        background: c.bg,
        border: `0.5px solid ${hov ? c.hover : c.border}`,
        transition: "border-color 0.15s",
      }}
    >
      <span
        style={{
          color: hov ? c.text : c.label,
          transition: "color 0.15s",
          display: "flex",
        }}
      >
        {icon}
      </span>
      <span
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.28)",
          marginRight: 2,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function MetaInput({
  value,
  onChange,
  placeholder,
  type = "text",
  width = 80,
  accent = "cyan",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  width?: number;
  accent?: string;
}) {
  const c = ACCENT[accent] ?? ACCENT.cyan;
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width,
        background: "transparent",
        border: "none",
        outline: "none",
        color: c.text,
        fontSize: 13,
        fontFamily: type === "number" ? "monospace" : undefined,
        textAlign: type === "number" ? "right" : undefined,
      }}
    />
  );
}

// ── Direction toggle ──────────────────────────────────────────────────────────

function DirectionToggle({
  value,
  onChange,
}: {
  value: "long" | "short" | "";
  onChange: (v: "long" | "short" | "") => void;
}) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {(["long", "short"] as const).map((dir) => {
        const isActive = value === dir;
        const isLong = dir === "long";
        const activeColor = isLong ? "#34d399" : "#f87171";
        return (
          <button
            key={dir}
            onClick={() => onChange(isActive ? "" : dir)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              borderRadius: 6,
              cursor: "pointer",
              border: `0.5px solid ${isActive ? activeColor + "60" : "rgba(255,255,255,0.1)"}`,
              background: isActive ? activeColor + "15" : "transparent",
              color: isActive ? activeColor : "rgba(255,255,255,0.3)",
              fontSize: 11,
              fontWeight: 600,
              transition: "all 0.15s",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {isLong ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {dir}
          </button>
        );
      })}
    </div>
  );
}

// ── RR Display badge ──────────────────────────────────────────────────────────

function RRBadge({ rr }: { rr: string }) {
  if (!rr) return null;
  const val = parseFloat(rr);
  const color = val >= 2 ? "#34d399" : val >= 1 ? "#fbbf24" : "#f87171";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 11px",
        borderRadius: 8,
        background: color + "10",
        border: `0.5px solid ${color}40`,
      }}
    >
      <BarChart2 size={12} style={{ color: color + "90" }} />
      <span
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.28)",
          marginRight: 2,
        }}
      >
        R:R
      </span>
      <span
        style={{
          fontSize: 13,
          color,
          fontWeight: 700,
          fontFamily: "monospace",
        }}
      >
        1 : {rr}
      </span>
    </div>
  );
}

// ── Section divider ───────────────────────────────────────────────────────────

function MetaSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          fontSize: 9,
          color: "rgba(255,255,255,0.2)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PageEditor() {
  const {
    activePageId,
    pages,
    updatePage,
    setActivePageId,
    sections,
    activeSectionId,
  } = useAppStore();

  const page = pages.find((p) => p.id === activePageId);
  const activeSection = sections.find((s) => s.id === activeSectionId);
  const isTrading = activeSection?.type === "trading";
  const isExpense = activeSection?.type === "expense";

  // ── Core fields ───────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [pnl, setPnl] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [wordCount, setWordCount] = useState(0);

  // ── Trading metadata ──────────────────────────────────────────────────────
  const [direction, setDirection] = useState<"long" | "short" | "">("");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [size, setSize] = useState("");
  const [session, setSession] = useState("");
  const [setup, setSetup] = useState("");

  // ── Expense metadata ──────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState("");
  const [merchant, setMerchant] = useState("");
  const [expenseNote, setExpenseNote] = useState("");

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const stylesInjected = useRef(false);

  // Inject global CSS once
  useEffect(() => {
    if (stylesInjected.current) return;
    const style = document.createElement("style");
    style.textContent = EDITOR_STYLES;
    document.head.appendChild(style);
    stylesInjected.current = true;
  }, []);

  // ── TipTap ────────────────────────────────────────────────────────────────

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") return "Heading...";
          return isTrading
            ? "Setup, lý do vào lệnh, cảm nhận, bài học... (gõ / để chèn block)"
            : isExpense
              ? "Ghi chú chi tiêu... (gõ / để chèn block)"
              : "Bắt đầu viết... (gõ / để chèn block)";
        },
      }),
      Typography,
      Underline,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({ inline: false, allowBase64: true }),
      CharacterCount,
      CalloutNode,
      SlashCommand,
    ],
    content: page?.content || "",
    editorProps: { attributes: { class: "ProseMirror", spellcheck: "false" } },
    onUpdate: ({ editor }) => {
      setWordCount(editor.storage.characterCount.words());
      triggerAutoSave({ content: editor.getHTML() });
    },
    immediatelyRender: false,
  });

  // ── Sync when switching pages ─────────────────────────────────────────────

  useEffect(() => {
    if (!page) return;

    setTitle(page.title);
    setPnl(page.pnl?.toString() ?? "");
    setAmount(page.amount?.toString() ?? "");
    setCategory(page.category ?? "");
    setLastSaved(null);

    // Parse metadata
    const meta = parseMeta(page.metadata);

    if (isTrading) {
      setDirection((meta.direction as "long" | "short" | "") ?? "");
      setEntryPrice(meta.entryPrice?.toString() ?? "");
      setExitPrice(meta.exitPrice?.toString() ?? "");
      setStopLoss(meta.stopLoss?.toString() ?? "");
      setTakeProfit(meta.takeProfit?.toString() ?? "");
      setSize(meta.size?.toString() ?? "");
      setSession(meta.session ?? "");
      setSetup(meta.setup ?? "");
    }

    if (isExpense) {
      setPaymentMethod((meta as ExpenseMeta).paymentMethod ?? "");
      setMerchant((meta as ExpenseMeta).merchant ?? "");
      setExpenseNote((meta as ExpenseMeta).note ?? "");
    }

    if (editor && editor.getHTML() !== page.content) {
      editor.commands.setContent(page.content || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePageId]);

  useEffect(
    () => () => {
      editor?.destroy();
    },
    [editor],
  );

  // ── Save ──────────────────────────────────────────────────────────────────

  const buildMetadata = useCallback(
    (overrides: Record<string, string | undefined> = {}): string | null => {
      if (isTrading) {
        const meta: TradingMeta = {
          direction:
            (overrides.direction as "long" | "short" | "") ?? direction,
          entryPrice: overrides.entryPrice ?? entryPrice,
          exitPrice: overrides.exitPrice ?? exitPrice,
          stopLoss: overrides.stopLoss ?? stopLoss,
          takeProfit: overrides.takeProfit ?? takeProfit,
          size: overrides.size ?? size,
          session: overrides.session ?? session,
          setup: overrides.setup ?? setup,
        };
        return stringifyMeta(meta);
      }
      if (isExpense) {
        const meta: ExpenseMeta = {
          paymentMethod: overrides.paymentMethod ?? paymentMethod,
          merchant: overrides.merchant ?? merchant,
          note: overrides.expenseNote ?? expenseNote,
        };
        return stringifyMeta(meta);
      }
      return null;
    },
    [
      isTrading,
      isExpense,
      direction,
      entryPrice,
      exitPrice,
      stopLoss,
      takeProfit,
      size,
      session,
      setup,
      paymentMethod,
      merchant,
      expenseNote,
    ],
  );

  const save = useCallback(
    async (overrides: Record<string, string | undefined> = {}) => {
      if (!activePageId) return;
      setSaving(true);

      const body: Record<string, unknown> = {
        title: overrides.title ?? title,
        content: overrides.content ?? editor?.getHTML() ?? "",
      };

      const rawPnl = overrides.pnl ?? pnl;
      const rawAmount = overrides.amount ?? amount;
      const rawCategory = overrides.category ?? category;

      if (isTrading) body.pnl = rawPnl ? parseFloat(rawPnl) : null;
      if (isExpense) body.amount = rawAmount ? parseFloat(rawAmount) : null;
      body.category = rawCategory || null;
      body.metadata = buildMetadata(overrides);

      const res = await fetch(`/api/pages/${activePageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const updated = await res.json();
      updatePage(activePageId, updated);
      setSaving(false);
      setLastSaved(new Date());
    },
    [
      activePageId,
      title,
      pnl,
      amount,
      category,
      editor,
      isTrading,
      isExpense,
      buildMetadata,
      updatePage,
    ],
  );

  const triggerAutoSave = useCallback(
    (overrides: Record<string, string | undefined> = {}) => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => save(overrides), 800);
    },
    [save],
  );

  // ── Computed ──────────────────────────────────────────────────────────────

  const autoRR = calcRR(entryPrice, stopLoss, takeProfit, direction);

  // ── Empty state ───────────────────────────────────────────────────────────

  if (!activePageId || !page) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <FileText size={40} className="text-white/10 mx-auto" />
          <p className="text-white/30 text-sm">
            Chọn hoặc tạo page để bắt đầu viết
          </p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between bg-black/20 backdrop-blur-sm">
        <button
          onClick={() => setActivePageId(null)}
          className="flex items-center gap-1.5 text-xs text-white/30 hover:text-cyan-400 transition-colors"
        >
          <ChevronLeft size={14} />
          <span>Quay lại</span>
        </button>

        <div className="flex items-center gap-4">
          <span className="text-[11px] text-white/20 tabular-nums">
            {wordCount} words
          </span>
          {saving ? (
            <span className="flex items-center gap-1.5 text-xs text-cyan-400/70">
              <Loader2 size={11} className="animate-spin" />
              Đang lưu...
            </span>
          ) : lastSaved ? (
            <span className="flex items-center gap-1.5 text-xs text-white/25">
              <CheckCircle2 size={11} className="text-emerald-500/70" />
              {lastSaved.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          ) : null}
        </div>
      </div>

      {/* ── Scrollable content ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-10 py-10 max-w-3xl w-full mx-auto">
          {/* Title */}
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              triggerAutoSave({ title: e.target.value });
            }}
            placeholder="Tiêu đề..."
            className="w-full text-4xl font-bold bg-transparent text-white/90 placeholder-white/15 outline-none mb-4 leading-tight"
          />

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8">
            <span className="text-[11px] text-white/20">
              {activeSection?.name}
            </span>
            <span className="text-[11px] text-white/10">·</span>
            <span className="text-[11px] text-white/20">
              {new Date(page.createdAt ?? Date.now()).toLocaleDateString(
                "vi-VN",
              )}
            </span>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
                TRADING METADATA
            ══════════════════════════════════════════════════════════════════ */}
          {isTrading && (
            <div
              style={{
                background: "rgba(6,182,212,0.03)",
                border: "0.5px solid rgba(6,182,212,0.12)",
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 28,
              }}
            >
              {/* Header */}
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(34,211,238,0.4)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  marginBottom: 14,
                }}
              >
                Trade Details
              </div>

              {/* Row 1: Direction + PnL + Pair */}
              <MetaSection label="Position">
                <DirectionToggle
                  value={direction}
                  onChange={(v) => {
                    setDirection(v);
                    triggerAutoSave({ direction: v });
                  }}
                />

                <MetaField
                  icon={<DollarSign size={12} />}
                  label="PnL"
                  accent={
                    pnl && parseFloat(pnl) >= 0
                      ? "emerald"
                      : pnl
                        ? "red"
                        : "cyan"
                  }
                >
                  <MetaInput
                    type="number"
                    value={pnl}
                    placeholder="0.00"
                    width={70}
                    accent={
                      pnl && parseFloat(pnl) >= 0
                        ? "emerald"
                        : pnl
                          ? "red"
                          : "cyan"
                    }
                    onChange={(v) => {
                      setPnl(v);
                      triggerAutoSave({ pnl: v });
                    }}
                  />
                </MetaField>

                <MetaField
                  icon={<Tag size={12} />}
                  label="Pair"
                  accent="purple"
                >
                  <MetaInput
                    value={category}
                    placeholder="BTC, ETH..."
                    width={80}
                    accent="purple"
                    onChange={(v) => {
                      setCategory(v);
                      triggerAutoSave({ category: v });
                    }}
                  />
                </MetaField>

                <MetaField
                  icon={<Layers size={12} />}
                  label="Size"
                  accent="amber"
                >
                  <MetaInput
                    type="number"
                    value={size}
                    placeholder="0.00"
                    width={60}
                    accent="amber"
                    onChange={(v) => {
                      setSize(v);
                      triggerAutoSave({ size: v });
                    }}
                  />
                </MetaField>
              </MetaSection>

              {/* Row 2: Entry / Exit / SL / TP */}
              <MetaSection label="Price Levels">
                <MetaField
                  icon={<Target size={12} />}
                  label="Entry"
                  accent="cyan"
                >
                  <MetaInput
                    type="number"
                    value={entryPrice}
                    placeholder="0.00"
                    width={80}
                    accent="cyan"
                    onChange={(v) => {
                      setEntryPrice(v);
                      triggerAutoSave({ entryPrice: v });
                    }}
                  />
                </MetaField>

                <MetaField
                  icon={<Target size={12} />}
                  label="Exit"
                  accent="purple"
                >
                  <MetaInput
                    type="number"
                    value={exitPrice}
                    placeholder="0.00"
                    width={80}
                    accent="purple"
                    onChange={(v) => {
                      setExitPrice(v);
                      triggerAutoSave({ exitPrice: v });
                    }}
                  />
                </MetaField>

                <MetaField
                  icon={<ShieldAlert size={12} />}
                  label="Stop Loss"
                  accent="red"
                >
                  <MetaInput
                    type="number"
                    value={stopLoss}
                    placeholder="0.00"
                    width={80}
                    accent="red"
                    onChange={(v) => {
                      setStopLoss(v);
                      triggerAutoSave({ stopLoss: v });
                    }}
                  />
                </MetaField>

                <MetaField
                  icon={<TrendingUp size={12} />}
                  label="Take Profit"
                  accent="emerald"
                >
                  <MetaInput
                    type="number"
                    value={takeProfit}
                    placeholder="0.00"
                    width={80}
                    accent="emerald"
                    onChange={(v) => {
                      setTakeProfit(v);
                      triggerAutoSave({ takeProfit: v });
                    }}
                  />
                </MetaField>

                {/* Auto-computed R:R */}
                <RRBadge rr={autoRR} />
              </MetaSection>

              {/* Row 3: Session + Setup */}
              <MetaSection label="Context">
                <MetaField
                  icon={<Clock size={12} />}
                  label="Session"
                  accent="purple"
                >
                  <MetaInput
                    value={session}
                    placeholder="London, NY, Asia..."
                    width={100}
                    accent="purple"
                    onChange={(v) => {
                      setSession(v);
                      triggerAutoSave({ session: v });
                    }}
                  />
                </MetaField>

                <MetaField
                  icon={<Hash size={12} />}
                  label="Setup"
                  accent="amber"
                >
                  <MetaInput
                    value={setup}
                    placeholder="Breakout, Reversal..."
                    width={120}
                    accent="amber"
                    onChange={(v) => {
                      setSetup(v);
                      triggerAutoSave({ setup: v });
                    }}
                  />
                </MetaField>
              </MetaSection>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
                EXPENSE METADATA
            ══════════════════════════════════════════════════════════════════ */}
          {isExpense && (
            <div
              style={{
                background: "rgba(236,72,153,0.03)",
                border: "0.5px solid rgba(236,72,153,0.12)",
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(244,114,182,0.4)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  marginBottom: 14,
                }}
              >
                Expense Details
              </div>

              <MetaSection label="Amount & Category">
                <MetaField
                  icon={<DollarSign size={12} />}
                  label="Amount"
                  accent="pink"
                >
                  <MetaInput
                    type="number"
                    value={amount}
                    placeholder="0.00"
                    width={80}
                    accent="pink"
                    onChange={(v) => {
                      setAmount(v);
                      triggerAutoSave({ amount: v });
                    }}
                  />
                </MetaField>

                <MetaField
                  icon={<Tag size={12} />}
                  label="Category"
                  accent="purple"
                >
                  <MetaInput
                    value={category}
                    placeholder="Food, Transport..."
                    width={110}
                    accent="purple"
                    onChange={(v) => {
                      setCategory(v);
                      triggerAutoSave({ category: v });
                    }}
                  />
                </MetaField>
              </MetaSection>

              <MetaSection label="Payment Info">
                <MetaField
                  icon={<CreditCard size={12} />}
                  label="Method"
                  accent="cyan"
                >
                  <MetaInput
                    value={paymentMethod}
                    placeholder="Cash, Card, Momo..."
                    width={120}
                    accent="cyan"
                    onChange={(v) => {
                      setPaymentMethod(v);
                      triggerAutoSave({ paymentMethod: v });
                    }}
                  />
                </MetaField>

                <MetaField
                  icon={<Store size={12} />}
                  label="Merchant"
                  accent="amber"
                >
                  <MetaInput
                    value={merchant}
                    placeholder="Shopee, Circle K..."
                    width={120}
                    accent="amber"
                    onChange={(v) => {
                      setMerchant(v);
                      triggerAutoSave({ merchant: v });
                    }}
                  />
                </MetaField>

                <MetaField
                  icon={<StickyNote size={12} />}
                  label="Note"
                  accent="purple"
                >
                  <MetaInput
                    value={expenseNote}
                    placeholder="Ghi chú..."
                    width={140}
                    accent="purple"
                    onChange={(v) => {
                      setExpenseNote(v);
                      triggerAutoSave({ expenseNote: v });
                    }}
                  />
                </MetaField>
              </MetaSection>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-white/5 mb-8" />

          {/* Slash hint */}
          <div className="flex items-center gap-2 mb-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
            <kbd
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.25)",
                background: "rgba(255,255,255,0.05)",
                border: "0.5px solid rgba(255,255,255,0.1)",
                borderRadius: 4,
                padding: "1px 6px",
                fontFamily: "monospace",
              }}
            >
              /
            </kbd>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
              slash commands · select text for formatting
            </span>
          </div>

          {/* ── TipTap editor ───────────────────────────────────────────── */}
          <div
            ref={editorContainerRef}
            className="tiptap-editor"
            style={{ position: "relative" }}
          >
            {editor && <BubbleToolbar editor={editor} />}
            {editor && (
              <HoverBlockMenu
                editor={editor}
                editorContainerRef={editorContainerRef}
              />
            )}
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}
