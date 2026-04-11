"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Bot, X, Send, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "ai";
  content: string;
}

// ── Typing indicator (3 bouncing dots) ───────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-cyan-400/50"
          style={{
            animation: "typingBounce 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
          @keyframes typingBounce {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-5px); opacity: 1; }
          }
        `}</style>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {/* AI avatar dot */}
      {!isUser && (
        <div
          className="w-5 h-5 rounded-full flex-shrink-0 mb-0.5 flex items-center justify-center
            bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-cyan-500/20"
        >
          <Sparkles size={9} className="text-cyan-400" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[82%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed",
          isUser
            ? "bg-cyan-500/15 text-cyan-100 border border-cyan-500/25 rounded-br-sm"
            : "bg-white/[0.06] text-white/80 border border-white/[0.08] rounded-bl-sm",
        )}
      >
        {msg.content}
      </div>

      {/* User avatar dot */}
      {isUser && (
        <div
          className="w-5 h-5 rounded-full flex-shrink-0 mb-0.5 flex items-center justify-center
            bg-cyan-500/20 border border-cyan-500/30"
        >
          <User size={9} className="text-cyan-400" />
        </div>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function AIChatbox() {
  const { activeSectionId, addPage, addSection } = useAppStore();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content:
        "Xin chào! Tôi có thể giúp bạn tạo section, thêm trade, log expense. Hãy thử nhé!",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, sectionId: activeSectionId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages((m) => [
          ...m,
          {
            role: "ai",
            content:
              data?.message ?? data?.error ?? "AI đang bận, thử lại nhé.",
          },
        ]);
        return;
      }

      if (data.action === "create_page" && data.data) addPage(data.data);
      if (data.action === "create_section" && data.data) addSection(data.data);

      setMessages((m) => [
        ...m,
        { role: "ai", content: data.message ?? "Xong rồi!" },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "ai", content: "Có lỗi xảy ra, thử lại nhé." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
          "bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500",
          "hover:scale-110 hover:shadow-[0_0_24px_rgba(0,255,255,0.4)]",
          "shadow-[0_0_16px_rgba(99,102,241,0.4)]",
          open && "rotate-12 scale-95",
        )}
        title="AI Assistant"
      >
        <Bot size={20} className="text-white" />
      </button>

      {/* ── Chatbox ── */}
      {open && (
        <div
          className="fixed bottom-22 right-6 z-50 w-80 flex flex-col rounded-2xl border border-white/10 overflow-hidden"
          style={{
            height: 460,
            background: "rgba(7, 11, 20, 0.92)",
            backdropFilter: "blur(20px)",
            boxShadow:
              "0 0 40px rgba(0,255,255,0.08), 0 0 80px rgba(99,102,241,0.06)",
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 border-b border-white/10 flex items-center justify-between"
            style={{
              background:
                "linear-gradient(to right, rgba(0,255,255,0.06), rgba(99,102,241,0.06))",
            }}
          >
            <div className="flex items-center gap-2">
              {/* Live dot */}
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
              </span>
              <span className="text-sm font-semibold text-white/90">
                AI Assistant
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/25 hover:text-white/70 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg, i) => (
              <Bubble key={i} msg={msg} />
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-end gap-2 justify-start">
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0 mb-0.5 flex items-center justify-center
                    bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-cyan-500/20"
                >
                  <Sparkles size={9} className="text-cyan-400" />
                </div>
                <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl rounded-bl-sm">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-white/10 flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="tạo section trading..."
              className="flex-1 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-[13px] text-white/80 placeholder-white/20 outline-none focus:border-cyan-500/40 transition-colors"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="px-3 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/25 text-cyan-400
                  hover:bg-cyan-500/25 hover:border-cyan-500/50
                  disabled:opacity-25 disabled:cursor-not-allowed
                  transition-all"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
