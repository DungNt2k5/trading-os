"use client";
// src/modules/campaign/CampaignDashboard.tsx

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Campaign } from "./types";
import CampaignForm from "./CampaignForm";
import { Plus, Swords, TrendingUp, Users, BarChart2 } from "lucide-react";

// ── Matrix Rain (từ WelcomeScreen) ───────────────────────────────────────────
function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Dùng ký tự giả cổ tự Trung Quốc + số hex
    const chars = "一二三四五六七八九十百千萬億兆陰陽天地玄黃宇宙洪荒0123456789ABCDEF龍鳳虎鶴";
    const fontSize = 13;
    const cols = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(cols).fill(1);

    const draw = () => {
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        if (drops[i] * fontSize < canvas.height * 0.3) {
          ctx.fillStyle = "#c0392b";
          ctx.shadowColor = "#c0392b";
          ctx.shadowBlur = 8;
        } else {
          const alpha = Math.random() * 0.4 + 0.08;
          ctx.fillStyle = `rgba(192,57,43,${alpha})`;
          ctx.shadowColor = "rgba(192,57,43,0.2)";
          ctx.shadowBlur = 3;
        }

        ctx.font = `${fontSize}px monospace`;
        ctx.fillText(char, x, y);
        ctx.shadowBlur = 0;

        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 55);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: 0.09,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

// ── Scan Lines ────────────────────────────────────────────────────────────────
function ScanLine() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}

// ── Corner Decorations (phong cách cyberpunk + motif vuông TQ) ───────────────
function CornerDeco({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const flip = pos === "tr" || pos === "br";
  const flipV = pos === "bl" || pos === "br";
  return (
    <div
      style={{
        position: "absolute",
        width: 44,
        height: 44,
        ...(pos === "tl" ? { top: 16, left: 16 } : {}),
        ...(pos === "tr" ? { top: 16, right: 16 } : {}),
        ...(pos === "bl" ? { bottom: 16, left: 16 } : {}),
        ...(pos === "br" ? { bottom: 16, right: 16 } : {}),
        transform: `scaleX(${flip ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
        pointerEvents: "none",
      }}
    >
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <path d="M0 0 L24 0 L24 3 L3 3 L3 24 L0 24 Z" fill="#c0392b" opacity="0.7" />
        <path d="M0 0 L14 0 L14 2 L2 2 L2 14 L0 14 Z" fill="#f39c12" opacity="0.5" />
        <rect x="6" y="6" width="4" height="4" fill="none" stroke="#f39c12" strokeWidth="0.8" opacity="0.6" />
      </svg>
    </div>
  );
}

// ── Hex badge cho sàn giao dịch ───────────────────────────────────────────────
function ExchangeBadge({ name }: { name: string }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 38, height: 38,
      background: "rgba(192,57,43,0.12)",
      border: "1.5px solid rgba(192,57,43,0.45)",
      borderRadius: 6,
      fontSize: 11, fontWeight: 900, color: "#e74c3c",
      letterSpacing: "0.04em",
      flexShrink: 0,
      boxShadow: "inset 0 0 10px rgba(192,57,43,0.08), 0 0 14px rgba(192,57,43,0.12)",
      fontFamily: "monospace",
    }}>
      {name.slice(0, 3).toUpperCase()}
    </div>
  );
}

// ── Status chip ───────────────────────────────────────────────────────────────
function getStatus(c: Campaign, now: Date) {
  const start = new Date(c.startDate);
  const end = new Date(c.endDate);
  if (now < start) return { label: "Sắp tới", color: "#f39c12", bg: "rgba(243,156,18,0.1)", border: "rgba(243,156,18,0.3)" };
  if (now > end)   return { label: "Đã kết thúc", color: "#6b7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.25)" };
  return           { label: "Đang chạy", color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)" };
}

// ── Stat bar item ─────────────────────────────────────────────────────────────
function StatBar({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 6,
        background: `${color}18`,
        border: `1px solid ${color}35`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 900, color, lineHeight: 1, fontFamily: "monospace" }}>{value}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", letterSpacing: "0.08em", marginTop: 1 }}>{label}</div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function CampaignDashboard() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  async function fetchCampaigns() {
    try {
      const res = await fetch("/api/campaign");
      if (res.ok) setCampaigns(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCampaigns(); }, []);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const now = new Date();

  const totalAccounts = campaigns.reduce((s, c) => s + (c.accounts?.length ?? 0), 0);
  const activeCount = campaigns.filter(c => new Date(c.startDate) <= now && new Date(c.endDate) >= now).length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #06030a 0%, #0a0510 45%, #060310 100%)",
      position: "relative",
      overflowX: "hidden",
    }}>
      {/* Styles */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 0 0 rgba(192,57,43,0.4); }
          50%       { box-shadow: 0 0 0 6px rgba(192,57,43,0); }
        }
        .campaign-card {
          animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both;
        }
        .live-dot {
          animation: pulse-red 2s infinite;
        }
        /* Diagonal texture */
        .diag-bg::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: repeating-linear-gradient(
            135deg,
            transparent,
            transparent 38px,
            rgba(192,57,43,0.018) 38px,
            rgba(192,57,43,0.018) 39px
          );
          pointer-events: none;
          z-index: 0;
        }
      `}</style>

      <div className="diag-bg" />
      <MatrixRain />
      <ScanLine />

      {/* Top border accent */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 2, zIndex: 10,
        background: "linear-gradient(90deg, transparent 0%, #c0392b 30%, #f39c12 50%, #c0392b 70%, transparent 100%)",
      }} />

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div style={{
        position: "relative", zIndex: 5,
        padding: "28px 40px 22px",
        borderBottom: "1px solid rgba(192,57,43,0.18)",
        backdropFilter: "blur(2px)",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(-12px)",
        transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <CornerDeco pos="tl" />
        <CornerDeco pos="tr" />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
          {/* Title block */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Icon badge */}
            <div style={{
              width: 48, height: 48, borderRadius: 10,
              background: "linear-gradient(135deg, rgba(192,57,43,0.25), rgba(192,57,43,0.08))",
              border: "1px solid rgba(192,57,43,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(192,57,43,0.2), inset 0 0 12px rgba(192,57,43,0.05)",
              flexShrink: 0,
            }}>
              <Swords size={22} color="#e74c3c" />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <h1 style={{
                  fontSize: 24, fontWeight: 900, margin: 0, lineHeight: 1,
                  background: "linear-gradient(135deg, #e74c3c 0%, #f39c12 60%, #e74c3c 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "0.04em",
                }}>
                  MANAGER
                </h1>
                <span style={{
                  fontSize: 10, color: "rgba(192,57,43,0.5)",
                  letterSpacing: "0.25em", fontFamily: "monospace",
                  textTransform: "uppercase",
                }}>
                  CAMPAIGN MANAGER
                </span>
              </div>
              <p style={{ margin: "5px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.22)", letterSpacing: "0.06em" }}>
                Theo dõi kèo thưởng · Đa tài khoản · Đa sàn giao dịch
              </p>
            </div>
          </div>

          {/* Create button */}
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 22px", borderRadius: 8,
              background: "linear-gradient(135deg, rgba(192,57,43,0.85), rgba(231,76,60,0.75))",
              border: "1px solid rgba(231,76,60,0.55)",
              color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: "pointer", letterSpacing: "0.05em",
              boxShadow: "0 0 24px rgba(192,57,43,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
              transition: "all 0.2s ease",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 32px rgba(192,57,43,0.45), inset 0 1px 0 rgba(255,255,255,0.1)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 0 24px rgba(192,57,43,0.25), inset 0 1px 0 rgba(255,255,255,0.08)")}
          >
            <Plus size={14} />
            <span>Tạo chiến dịch mới</span>
          </button>
        </div>

        {/* Stats bar */}
        {!loading && campaigns.length > 0 && (
          <div style={{
            display: "flex", gap: 28, marginTop: 20,
            paddingTop: 16, borderTop: "1px solid rgba(192,57,43,0.1)",
            flexWrap: "wrap",
          }}>
            <StatBar icon={<BarChart2 size={15} />} label="Tổng chiến dịch" value={campaigns.length} color="#e74c3c" />
            <StatBar icon={<Swords size={15} />} label="Đang chạy" value={activeCount} color="#22c55e" />
            <StatBar icon={<Users size={15} />} label="Tổng tài khoản" value={totalAccounts} color="#f39c12" />
          </div>
        )}
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────────── */}
      <div style={{
        position: "relative", zIndex: 5,
        padding: "28px 40px 48px",
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.5s ease 0.15s",
      }}>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 0", gap: 16 }}>
            <div style={{
              width: 36, height: 36,
              border: "2px solid rgba(192,57,43,0.15)",
              borderTop: "2px solid #c0392b",
              borderRadius: "50%",
              animation: "spin 0.9s linear infinite",
            }} />
            <span style={{ fontSize: 11, color: "rgba(192,57,43,0.4)", letterSpacing: "0.2em", fontFamily: "monospace" }}>
              ĐANG TẢI...
            </span>
          </div>
        )}

        {/* Empty state */}
        {!loading && campaigns.length === 0 && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "100px 0", gap: 20, textAlign: "center",
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 16,
              border: "1.5px solid rgba(192,57,43,0.3)",
              background: "rgba(192,57,43,0.04)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 30px rgba(192,57,43,0.08)",
            }}>
              <Swords size={28} color="rgba(192,57,43,0.5)" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", margin: "0 0 6px", fontWeight: 600, letterSpacing: "0.05em" }}>
                Chưa có chiến dịch nào
              </h2>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", margin: 0 }}>
                Nhấn nút bên trên để tạo chiến dịch đầu tiên
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: "10px 28px", borderRadius: 8, fontSize: 13,
                background: "rgba(192,57,43,0.12)", border: "1px solid rgba(192,57,43,0.35)",
                color: "#e74c3c", cursor: "pointer", letterSpacing: "0.06em",
                fontFamily: "inherit", fontWeight: 600,
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <Plus size={14} />
              Tạo chiến dịch đầu tiên
            </button>
          </div>
        )}

        {/* Cards grid */}
        {!loading && campaigns.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}>
            {campaigns.map((c, idx) => {
              const status = getStatus(c, now);
              const accountCount = c.accounts?.length ?? 0;
              const tierCount = c.tiers?.length ?? 0;
              const isHov = hovered === c.id;
              const isLive = status.label === "Đang chạy";

              const startFmt = new Date(c.startDate).toLocaleDateString("vi-VN");
              const endFmt = new Date(c.endDate).toLocaleDateString("vi-VN");

              return (
                <div
                  key={c.id}
                  className="campaign-card"
                  onClick={() => router.push(`/campaign/${c.id}`)}
                  onMouseEnter={() => setHovered(c.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    animationDelay: `${idx * 60}ms`,
                    position: "relative", cursor: "pointer",
                    borderRadius: 10, overflow: "hidden",
                    border: `1px solid ${isHov ? "rgba(192,57,43,0.5)" : "rgba(192,57,43,0.15)"}`,
                    background: isHov
                      ? "linear-gradient(145deg, rgba(192,57,43,0.09), rgba(6,3,10,0.97))"
                      : "linear-gradient(145deg, rgba(192,57,43,0.04), rgba(6,3,10,0.94))",
                    boxShadow: isHov
                      ? "0 10px 36px rgba(192,57,43,0.2), inset 0 0 20px rgba(192,57,43,0.03)"
                      : "0 2px 14px rgba(0,0,0,0.45)",
                    transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)",
                    transform: isHov ? "translateY(-4px)" : "none",
                  }}
                >
                  {/* Top accent line */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 2,
                    background: isHov
                      ? "linear-gradient(90deg, transparent, #c0392b, #f39c12, #c0392b, transparent)"
                      : "linear-gradient(90deg, transparent, rgba(192,57,43,0.35), transparent)",
                    transition: "all 0.3s",
                  }} />

                  {/* Corner accent top-right */}
                  <div style={{ position: "absolute", top: 8, right: 8, opacity: isHov ? 0.45 : 0.15, transition: "opacity 0.25s" }}>
                    <svg width="18" height="18" viewBox="0 0 18 18">
                      <path d="M18 0 L18 8 L16 8 L16 2 L10 2 L10 0 Z" fill="#f39c12" />
                    </svg>
                  </div>

                  <div style={{ padding: "18px 20px 16px" }}>
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 13 }}>
                      <ExchangeBadge name={c.exchange} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Tags row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, flexWrap: "wrap" }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700,
                            color: "#e74c3c",
                            background: "rgba(192,57,43,0.1)",
                            border: "1px solid rgba(192,57,43,0.28)",
                            padding: "2px 8px", borderRadius: 4,
                            letterSpacing: "0.08em", fontFamily: "monospace",
                          }}>
                            {c.exchange}
                          </span>
                          <span style={{
                            fontSize: 10, color: status.color,
                            background: status.bg,
                            border: `1px solid ${status.border}`,
                            padding: "2px 8px", borderRadius: 4,
                            letterSpacing: "0.04em",
                            display: "flex", alignItems: "center", gap: 5,
                          }}>
                            {isLive && (
                              <span className="live-dot" style={{
                                display: "inline-block", width: 5, height: 5,
                                borderRadius: "50%", background: "#22c55e", flexShrink: 0,
                              }} />
                            )}
                            {status.label}
                          </span>
                        </div>

                        {/* Campaign name */}
                        <h3 style={{
                          fontSize: 14.5, fontWeight: 700,
                          color: isHov ? "#fff" : "rgba(255,255,255,0.82)",
                          margin: 0, lineHeight: 1.3,
                          letterSpacing: "0.03em",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          transition: "color 0.2s",
                        }}>
                          {c.name}
                        </h3>
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <div style={{ flex: 1, height: 1, background: "rgba(192,57,43,0.12)" }} />
                      <div style={{ width: 4, height: 4, background: "rgba(243,156,18,0.4)", transform: "rotate(45deg)" }} />
                      <div style={{ flex: 1, height: 1, background: "rgba(192,57,43,0.12)" }} />
                    </div>

                    {/* Date + meta */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{
                        fontSize: 10.5, color: "rgba(255,255,255,0.28)",
                        fontFamily: "monospace", letterSpacing: "0.04em",
                      }}>
                        {startFmt} → {endFmt}
                      </span>

                      <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "rgba(255,255,255,0.38)" }}>
                          <Users size={11} color="rgba(192,57,43,0.6)" />
                          <span>{accountCount} TK</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "rgba(255,255,255,0.38)" }}>
                          <TrendingUp size={11} color="rgba(243,156,18,0.6)" />
                          <span>{tierCount} mốc</span>
                        </div>
                      </div>
                    </div>

                    {c.description && (
                      <p style={{
                        margin: "9px 0 0", fontSize: 10.5,
                        color: "rgba(255,255,255,0.18)",
                        letterSpacing: "0.03em",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {c.description}
                      </p>
                    )}
                  </div>

                  {/* Bottom glow on hover */}
                  {isHov && (
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0, height: 48,
                      background: "linear-gradient(to top, rgba(192,57,43,0.07), transparent)",
                      pointerEvents: "none",
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Bottom corner decos ──────────────────────────────────────────────── */}
      <CornerDeco pos="bl" />
      <CornerDeco pos="br" />

      {/* Bottom border */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: 2, zIndex: 10,
        background: "linear-gradient(90deg, transparent, rgba(192,57,43,0.3), rgba(243,156,18,0.2), rgba(192,57,43,0.3), transparent)",
        pointerEvents: "none",
      }} />

      {showForm && (
        <CampaignForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={async (data) => {
            const res = await fetch("/api/campaign", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...data,
                tiers: data.tiers.map((t) => ({
                  ...t,
                  holdTime: t.holdTimeHours * 3600,
                })),
              }),
            });
            if (res.ok) {
              await fetchCampaigns();
              setShowForm(false);
            }
          }}
        />
      )}
    </div>
  );
}