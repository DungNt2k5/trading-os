"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  Bot,
  X,
  Send,
  Sparkles,
  User,
  Minimize2,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "ai";
  content: string;
  ts?: number;
}

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-cyan-400/60"
          style={{
            animation: "aiDotBounce 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes aiDotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function Bubble({ msg, isNew }: { msg: Message; isNew?: boolean }) {
  const isUser = msg.role === "user";

  // Render markdown-ish bold (**text**)
  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="font-semibold text-white/95">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
  };

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isUser ? "justify-end" : "justify-start",
        isNew && "animate-[slideUp_0.2s_ease-out]",
      )}
      style={{ animationFillMode: "both" }}
    >
      {/* AI avatar */}
      {!isUser && (
        <div className="w-5 h-5 rounded-full flex-shrink-0 mb-0.5 flex items-center justify-center bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-cyan-500/20">
          <Sparkles size={8} className="text-cyan-400" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[84%] px-3 py-2 text-[12.5px] leading-relaxed",
          isUser
            ? "bg-cyan-500/12 text-cyan-100 border border-cyan-500/20 rounded-2xl rounded-br-sm"
            : "bg-white/[0.055] text-white/78 border border-white/[0.07] rounded-2xl rounded-bl-sm",
        )}
      >
        {renderContent(msg.content)}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-5 h-5 rounded-full flex-shrink-0 mb-0.5 flex items-center justify-center bg-cyan-500/15 border border-cyan-500/25">
          <User size={8} className="text-cyan-400" />
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Quick suggestions ─────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "Tạo section trading mới",
  "Thêm trade BTC pnl 100",
  "Log expense 50 ăn uống",
  "Thêm số dư hôm nay",
];

// ── Main component ────────────────────────────────────────────────────────────

export default function AIChatbox() {
  const { activeSectionId, addPage, addSection } = useAppStore();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [newMsgIndex, setNewMsgIndex] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content:
        "Xin chào! Tôi có thể giúp bạn tạo section, thêm trade, log expense, hoặc quản lý tài chính. Hãy thử nhé!",
      ts: Date.now(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  const clearChat = useCallback(() => {
    setMessages([
      {
        role: "ai",
        content: "Chat đã được xóa. Tôi có thể giúp gì cho bạn?",
        ts: Date.now(),
      },
    ]);
    setShowSuggestions(true);
  }, []);

  const send = useCallback(
    async (text?: string) => {
      const userMsg = (text ?? input).trim();
      if (!userMsg || loading) return;

      setInput("");
      setShowSuggestions(false);

      const userIndex = messages.length;
      setMessages((m) => [
        ...m,
        { role: "user", content: userMsg, ts: Date.now() },
      ]);
      setNewMsgIndex(userIndex);
      setLoading(true);

      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMsg,
            sectionId: activeSectionId,
          }),
        });

        const data = await res.json();

        // Execute side effects
        if (data.action === "create_page" && data.data) addPage(data.data);
        if (data.action === "create_section" && data.data)
          addSection(data.data);

        const aiIndex = messages.length + 1;
        setMessages((m) => [
          ...m,
          {
            role: "ai",
            content: data?.message ?? "Xong rồi!",
            ts: Date.now(),
          },
        ]);
        setNewMsgIndex(aiIndex);
      } catch {
        setMessages((m) => [
          ...m,
          {
            role: "ai",
            content: "Có lỗi xảy ra, thử lại nhé.",
            ts: Date.now(),
          },
        ]);
      } finally {
        setLoading(false);
        setNewMsgIndex(null);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [input, loading, messages.length, activeSectionId, addPage, addSection],
  );

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* ── FAB button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="AI Assistant"
        className={cn(
          "fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full",
          "flex items-center justify-center",
          "transition-all duration-300",
          "bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500",
          "shadow-[0_0_20px_rgba(34,211,238,0.35)]",
          "hover:scale-110 hover:shadow-[0_0_28px_rgba(34,211,238,0.55)]",
          open && "rotate-12 scale-95 opacity-90",
        )}
      >
        {open ? (
          <X size={17} className="text-white" />
        ) : (
          <Bot size={18} className="text-white" />
        )}
      </button>

      {/* ── Chat panel ── */}
      <div
        className={cn(
          "fixed bottom-20 right-6 z-50 w-[320px] flex flex-col rounded-2xl border border-white/[0.09] overflow-hidden",
          "transition-all duration-300 origin-bottom-right",
          open
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-2 pointer-events-none",
        )}
        style={{
          height: 480,
          background: "rgba(6, 9, 18, 0.94)",
          backdropFilter: "blur(24px)",
          boxShadow:
            "0 0 0 0.5px rgba(34,211,238,0.12), 0 8px 32px rgba(0,0,0,0.6), 0 0 60px rgba(34,211,238,0.06)",
        }}
      >
        {/* ── Header ── */}
        <div
          className="px-4 py-2.5 flex items-center justify-between flex-shrink-0"
          style={{
            background:
              "linear-gradient(to right, rgba(34,211,238,0.05), rgba(168,85,247,0.05))",
            borderBottom: "0.5px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex items-center gap-2.5">
            {/* Live dot */}
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.9)]" />
            </span>
            <div>
              <div className="text-[12px] font-semibold text-white/90 leading-none">
                AI Assistant
              </div>
              <div className="text-[9px] text-white/30 mt-0.5 font-mono">
                claude-haiku · online
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={clearChat}
              title="Xóa chat"
              className="w-6 h-6 rounded-lg flex items-center justify-center text-white/25 hover:text-white/60 hover:bg-white/05 transition-all"
            >
              <RotateCcw size={11} />
            </button>
            <button
              onClick={() => setOpen(false)}
              title="Thu nhỏ"
              className="w-6 h-6 rounded-lg flex items-center justify-center text-white/25 hover:text-white/60 hover:bg-white/05 transition-all"
            >
              <Minimize2 size={11} />
            </button>
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-2.5 scrollbar-thin">
          {messages.map((msg, i) => (
            <Bubble key={i} msg={msg} isNew={i === newMsgIndex} />
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex items-end gap-2 justify-start">
              <div className="w-5 h-5 rounded-full flex-shrink-0 mb-0.5 flex items-center justify-center bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-cyan-500/20">
                <Sparkles size={8} className="text-cyan-400" />
              </div>
              <div
                className="bg-white/[0.055] border border-white/[0.07] rounded-2xl rounded-bl-sm"
                style={{ animation: "slideUp 0.2s ease-out" }}
              >
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Quick suggestions ── */}
        {showSuggestions && !loading && (
          <div className="px-3.5 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="px-2.5 py-1 rounded-lg text-[10.5px] text-cyan-400/70 border border-cyan-500/15 bg-cyan-500/05 hover:bg-cyan-500/12 hover:text-cyan-300 hover:border-cyan-500/30 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* ── Input ── */}
        <div
          className="px-3 py-2.5 flex gap-2 flex-shrink-0"
          style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Nhập lệnh hoặc câu hỏi..."
            disabled={loading}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-xl text-[12.5px] text-white/80 placeholder-white/18 outline-none",
              "bg-white/[0.04] border border-white/[0.08]",
              "focus:border-cyan-500/35 focus:bg-white/[0.055]",
              "disabled:opacity-50",
              "transition-all duration-150",
            )}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
              "bg-cyan-500/12 border border-cyan-500/20 text-cyan-400",
              "hover:bg-cyan-500/22 hover:border-cyan-500/40",
              "disabled:opacity-20 disabled:cursor-not-allowed",
              "transition-all duration-150",
            )}
          >
            <Send size={12} />
          </button>
        </div>
      </div>
    </>
  );
}
