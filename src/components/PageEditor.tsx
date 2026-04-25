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
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
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
import CharacterCount from "@tiptap/extension-character-count";
import { createLowlight, common } from "lowlight";
import { SlashCommand } from "./ui/SlashCommand";
import { CalloutNode } from "./ui/CalloutNode";
import BubbleToolbar from "./ui/BubbleToolbar";
import TableToolbar from "./ui/TableToolbar";
import HoverBlockMenu from "./ui/HoverBlockMenu";
import {
  ChevronLeft,
  DollarSign,
  Tag,
  CheckCircle2,
  Loader2,
  FileText,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  BarChart2,
  Clock,
  Layers,
  CreditCard,
  Store,
  StickyNote,
  Hash,
  Circle,
  X,
} from "lucide-react";

const lowlight = createLowlight(common);

// ── Status: ĐỦ 5 trạng thái ──────────────────────────────────────────────────

export const STATUS_LIST = [
  "active",
  "in-progress",
  "done",
  "draft",
  "archived",
] as const;
export type PageStatus = (typeof STATUS_LIST)[number];

const STATUS_CONFIG: Record<
  PageStatus,
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

export const STATUS_COLOR: Record<string, string> = {
  active: "#00ff9f",
  "in-progress": "#fbbf24",
  done: "#60a5fa",
  draft: "#a78bfa",
  archived: "#555",
};

// ── Editor styles ─────────────────────────────────────────────────────────────

const EDITOR_STYLES = `
.tiptap-editor .ProseMirror {
  outline:none; min-height:55vh; padding-left:8px;
  color:rgba(255,255,255,0.75); font-size:15px; line-height:1.8; caret-color:#22d3ee;
}
.tiptap-editor .ProseMirror > * + * { margin-top:0.6em; }
.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
  content:attr(data-placeholder); color:rgba(255,255,255,0.12); pointer-events:none; float:left; height:0;
}
.tiptap-editor .ProseMirror h1 {
  font-size:2em; font-weight:700; margin:1.2em 0 0.4em; line-height:1.2;
  background:linear-gradient(135deg,#fff 0%,rgba(34,211,238,0.8) 100%);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
}
.tiptap-editor .ProseMirror h2 { font-size:1.4em; font-weight:600; color:rgba(255,255,255,0.88); margin:1em 0 0.35em; }
.tiptap-editor .ProseMirror h3 { font-size:1.15em; font-weight:600; color:rgba(255,255,255,0.82); margin:0.8em 0 0.3em; }
.tiptap-editor .ProseMirror ul,.tiptap-editor .ProseMirror ol { padding-left:1.4em; }
.tiptap-editor .ProseMirror ul li { list-style:disc; }
.tiptap-editor .ProseMirror ol li { list-style:decimal; }
.tiptap-editor .ProseMirror li { margin:0.25em 0; }
.tiptap-editor .ProseMirror ul[data-type="taskList"] { list-style:none; padding-left:0; }
.tiptap-editor .ProseMirror ul[data-type="taskList"] li { display:flex; align-items:flex-start; gap:8px; }
.tiptap-editor .ProseMirror ul[data-type="taskList"] li>label { flex-shrink:0; margin-top:3px; }
.tiptap-editor .ProseMirror ul[data-type="taskList"] li>label input[type="checkbox"] { width:15px; height:15px; cursor:pointer; accent-color:#22d3ee; }
.tiptap-editor .ProseMirror ul[data-type="taskList"] li[data-checked="true"]>div { color:rgba(255,255,255,0.3); text-decoration:line-through; }
.tiptap-editor .ProseMirror ul[data-type="taskList"] li>div { flex:1; }
.tiptap-editor .ProseMirror code { background:rgba(6,182,212,0.1); border:0.5px solid rgba(6,182,212,0.2); border-radius:4px; padding:1px 5px; font-family:'Fira Code',monospace; font-size:0.88em; color:#22d3ee; }
.tiptap-editor .ProseMirror pre { background:rgba(0,0,0,0.5); border:0.5px solid rgba(255,255,255,0.08); border-radius:10px; padding:16px 20px; overflow-x:auto; margin:1em 0; }
.tiptap-editor .ProseMirror pre code { background:none; border:none; padding:0; color:rgba(255,255,255,0.75); font-size:0.88em; }
.tiptap-editor .ProseMirror blockquote { border-left:3px solid rgba(6,182,212,0.4); padding:4px 0 4px 16px; color:rgba(255,255,255,0.5); font-style:italic; margin:1em 0; }
.tiptap-editor .ProseMirror hr { border:none; border-top:0.5px solid rgba(255,255,255,0.1); margin:2em 0; }
.tiptap-editor .ProseMirror a { color:#22d3ee; text-decoration:underline; text-underline-offset:3px; cursor:pointer; }
.tiptap-editor .ProseMirror mark { background:rgba(251,191,36,0.25); color:rgba(255,255,255,0.85); border-radius:3px; padding:0 2px; }
.tiptap-editor .ProseMirror img { max-width:100%; border-radius:10px; border:0.5px solid rgba(255,255,255,0.08); margin:1em 0; }
.tiptap-editor .ProseMirror table { border-collapse:collapse; width:100%; table-layout:auto; font-size:13px; margin:1em 0; }
.tiptap-editor .ProseMirror table th,.tiptap-editor .ProseMirror table td { border:0.5px solid rgba(255,255,255,0.06); padding:0 12px; height:38px; min-width:80px; color:rgba(255,255,255,0.7); position:relative; vertical-align:middle; }
.tiptap-editor .ProseMirror table th { background:rgba(8,8,14,0.97); color:rgba(255,255,255,0.3); font-weight:500; font-size:11px; border-bottom:0.5px solid rgba(255,255,255,0.08); }
.tiptap-editor .ProseMirror table .selectedCell { background:rgba(34,211,238,0.07)!important; border-color:rgba(34,211,238,0.35)!important; }
.tippy-box { background:none!important; box-shadow:none!important; }
.tippy-content { padding:0!important; }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcRR(entry: string, sl: string, tp: string): string {
  const e = parseFloat(entry),
    s = parseFloat(sl),
    t = parseFloat(tp);
  if (!e || !s || !t || e === s) return "";
  const rr = Math.abs(t - e) / Math.abs(e - s);
  return isNaN(rr) ? "" : rr.toFixed(2);
}

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
        const color = dir === "long" ? "#34d399" : "#f87171";
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
              border: `0.5px solid ${isActive ? color + "60" : "rgba(255,255,255,0.1)"}`,
              background: isActive ? color + "15" : "transparent",
              color: isActive ? color : "rgba(255,255,255,0.3)",
              fontSize: 11,
              fontWeight: 600,
              transition: "all 0.15s",
              textTransform: "uppercase",
            }}
          >
            {dir === "long" ? (
              <TrendingUp size={11} />
            ) : (
              <TrendingDown size={11} />
            )}
            {dir}
          </button>
        );
      })}
    </div>
  );
}

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

// ── Status Select - ĐỦ 5 ─────────────────────────────────────────────────────

function StatusSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const normalized = STATUS_LIST.includes(value as PageStatus)
    ? (value as PageStatus)
    : "active";
  const cfg = STATUS_CONFIG[normalized];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "3px 10px 3px 8px",
          borderRadius: 6,
          border: `0.5px solid ${cfg.border}`,
          background: cfg.bg,
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          color: cfg.color,
          transition: "all 0.15s",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: cfg.color,
            boxShadow: `0 0 6px ${cfg.color}`,
            flexShrink: 0,
          }}
        />
        {normalized}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          style={{ opacity: 0.5, marginLeft: 2 }}
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
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 999,
            background: "rgba(8,8,14,0.97)",
            border: "0.5px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: "4px 0",
            minWidth: 145,
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            backdropFilter: "blur(12px)",
          }}
        >
          {STATUS_LIST.map((s) => {
            const sc = STATUS_CONFIG[s];
            const isActive = s === normalized;
            return (
              <button
                key={s}
                onClick={() => {
                  onChange(s);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "7px 14px",
                  background: isActive ? sc.bg : "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? sc.color : "rgba(255,255,255,0.6)",
                  textAlign: "left",
                  transition: "all 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: sc.color,
                    boxShadow: isActive ? `0 0 6px ${sc.color}` : "none",
                    flexShrink: 0,
                  }}
                />
                {s}
                {isActive && (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    style={{ marginLeft: "auto", color: sc.color }}
                  >
                    <path
                      d="M2 5L4.5 7.5L8.5 3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tag Chip Input ────────────────────────────────────────────────────────────

function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const TAG_COLORS = [
    "#22d3ee",
    "#a855f7",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#f97316",
    "#84cc16",
  ];
  const colorFor = (tag: string) =>
    TAG_COLORS[tag.charCodeAt(0) % TAG_COLORS.length];
  const addTag = (val: string) => {
    const t = val.trim().toLowerCase();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput("");
  };
  const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag));

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 5,
        padding: "4px 8px",
        borderRadius: 8,
        background: "rgba(168,85,247,0.05)",
        border: "0.5px solid rgba(168,85,247,0.2)",
        minHeight: 34,
      }}
    >
      <Tag size={11} style={{ color: "rgba(168,85,247,0.5)", flexShrink: 0 }} />
      {tags.map((tag) => {
        const c = colorFor(tag);
        return (
          <span
            key={tag}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              padding: "2px 8px 2px 7px",
              borderRadius: 10,
              color: c,
              background: c + "18",
              border: `0.5px solid ${c}40`,
            }}
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: c,
                display: "flex",
                padding: 0,
                opacity: 0.6,
              }}
            >
              <X size={9} />
            </button>
          </span>
        );
      })}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag(input);
          }
          if (e.key === "Backspace" && !input && tags.length)
            removeTag(tags[tags.length - 1]);
        }}
        onBlur={() => {
          if (input.trim()) addTag(input);
        }}
        placeholder={
          tags.length === 0 ? "Thêm tag... (Enter hoặc dấu phẩy)" : ""
        }
        style={{
          background: "transparent",
          border: "none",
          outline: "none",
          fontSize: 12,
          color: "rgba(255,255,255,0.5)",
          minWidth: 120,
          flex: 1,
        }}
      />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

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

  const [title, setTitle] = useState("");
  const [pageStatus, setPageStatus] = useState<string>("active");
  const [pnl, setPnl] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [wordCount, setWordCount] = useState(0);

  const [direction, setDirection] = useState<"long" | "short" | "">("");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [size, setSize] = useState("");
  const [session, setSession] = useState("");
  const [setup, setSetup] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [merchant, setMerchant] = useState("");
  const [expenseNote, setExpenseNote] = useState("");

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const stylesInjected = useRef(false);

  useEffect(() => {
    if (stylesInjected.current) return;
    const style = document.createElement("style");
    style.textContent = EDITOR_STYLES;
    document.head.appendChild(style);
    stylesInjected.current = true;
  }, []);

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
            ? "Setup, lý do vào lệnh... (gõ / để chèn block)"
            : isExpense
              ? "Ghi chú chi tiêu... (gõ / để chèn block)"
              : "Bắt đầu viết... (gõ / để chèn block)";
        },
      }),
      Typography,
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
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: page?.content || "",
    editorProps: { attributes: { class: "ProseMirror", spellcheck: "false" } },
    onUpdate: ({ editor }) => {
      setWordCount(editor.storage.characterCount.words());
      triggerAutoSave({ content: editor.getHTML() });
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!page) return;
    setTitle(page.title);
    // Giữ nguyên status từ DB, không normalize
    setPageStatus(page.status ?? "active");
    setPnl(page.pnl?.toString() ?? "");
    setAmount(page.amount?.toString() ?? "");
    setCategory(page.category ?? "");
    setTags(page.tags?.map((pt) => pt.tag.name) ?? []);
    setLastSaved(null);
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
    if (editor && editor.getHTML() !== page.content)
      editor.commands.setContent(page.content || "", { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePageId]);

  useEffect(
    () => () => {
      editor?.destroy();
    },
    [editor],
  );

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
    async (overrides: Record<string, unknown> = {}) => {
      if (!activePageId) return;
      setSaving(true);
      const body: Record<string, unknown> = {
        title: overrides.title ?? title,
        content: overrides.content ?? editor?.getHTML() ?? "",
        status: overrides.status ?? pageStatus,
        category: (overrides.category as string) ?? category ?? null,
        metadata: buildMetadata(
          overrides as Record<string, string | undefined>,
        ),
        tags: overrides.tags !== undefined ? overrides.tags : tags,
      };
      if (isTrading)
        body.pnl =
          overrides.pnl !== undefined
            ? overrides.pnl
              ? parseFloat(overrides.pnl as string)
              : null
            : pnl
              ? parseFloat(pnl)
              : null;
      if (isExpense)
        body.amount =
          overrides.amount !== undefined
            ? overrides.amount
              ? parseFloat(overrides.amount as string)
              : null
            : amount
              ? parseFloat(amount)
              : null;

      const res = await fetch(`/api/pages/${activePageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      updatePage(activePageId, await res.json());
      setSaving(false);
      setLastSaved(new Date());
    },
    [
      activePageId,
      title,
      pageStatus,
      pnl,
      amount,
      category,
      tags,
      editor,
      isTrading,
      isExpense,
      buildMetadata,
      updatePage,
    ],
  );

  const triggerAutoSave = useCallback(
    (overrides: Record<string, unknown> = {}) => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => save(overrides), 800);
    },
    [save],
  );

  const autoRR = calcRR(entryPrice, stopLoss, takeProfit);

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

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Toolbar */}
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-10 py-10 max-w-3xl w-full mx-auto">
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              triggerAutoSave({ title: e.target.value });
            }}
            placeholder="Tiêu đề..."
            className="w-full text-4xl font-bold bg-transparent text-white/90 placeholder-white/15 outline-none mb-3 leading-tight"
          />

          {/* Status + breadcrumb */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <span className="text-[11px] text-white/20">
              {activeSection?.name}
            </span>
            <span className="text-[11px] text-white/10">·</span>
            <span className="text-[11px] text-white/20">
              {new Date(page.createdAt ?? Date.now()).toLocaleDateString(
                "vi-VN",
              )}
            </span>
            <span className="text-[11px] text-white/10">·</span>
            <StatusSelect
              value={pageStatus}
              onChange={(v) => {
                setPageStatus(v);
                triggerAutoSave({ status: v });
              }}
            />
          </div>

          {/* Tags */}
          <div style={{ marginBottom: 24 }}>
            <TagInput
              tags={tags}
              onChange={(newTags) => {
                setTags(newTags);
                triggerAutoSave({ tags: newTags });
              }}
            />
          </div>

          {/* Trading metadata */}
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
                <RRBadge rr={autoRR} />
              </MetaSection>
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

          {/* Expense metadata */}
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

          <div className="h-px bg-white/5 mb-8" />

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

          <div
            ref={editorContainerRef}
            className="tiptap-editor"
            style={{ position: "relative" }}
          >
            {editor && <BubbleToolbar editor={editor} />}
            {editor && <TableToolbar editor={editor} />}
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
