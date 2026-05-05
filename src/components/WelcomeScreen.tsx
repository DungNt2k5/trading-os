"use client";

import { useEffect, useRef, useState } from "react";

// ── Matrix Rain Canvas ────────────────────────────────────────────────────────

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

    const chars =
      "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF";
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
          ctx.fillStyle = "#22d3ee";
          ctx.shadowColor = "#22d3ee";
          ctx.shadowBlur = 8;
        } else {
          const alpha = Math.random() * 0.5 + 0.1;
          ctx.fillStyle = `rgba(0,255,159,${alpha})`;
          ctx.shadowColor = "rgba(0,255,159,0.3)";
          ctx.shadowBlur = 4;
        }

        ctx.font = `${fontSize}px monospace`;
        ctx.fillText(char, x, y);
        ctx.shadowBlur = 0;

        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 50);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: 0.12,
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}

// ── Glitch Text ───────────────────────────────────────────────────────────────

function GlitchText({ text }: { text: string }) {
  return (
    <span className="glitch-wrap" data-text={text}>
      {text}
      <style>{`
        .glitch-wrap {
          position: relative;
          display: inline-block;
          font-size: 52px;
          font-weight: 900;
          font-family: monospace;
          letter-spacing: 0.12em;
          background: linear-gradient(135deg, #22d3ee 0%, #a855f7 50%, #f472b6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .glitch-wrap::before,
        .glitch-wrap::after {
          content: attr(data-text);
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: linear-gradient(135deg, #22d3ee, #a855f7, #f472b6);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .glitch-wrap::before {
          left: 2px;
          animation: glitch1 3s infinite linear alternate-reverse;
        }
        .glitch-wrap::after {
          left: -2px;
          animation: glitch2 2.5s infinite linear alternate-reverse;
        }
        @keyframes glitch1 {
          0%   { clip: rect(10px,9999px,20px,0); transform: skew(0.3deg); }
          25%  { clip: rect(60px,9999px,80px,0); transform: skew(-0.1deg); }
          50%  { clip: rect(25px,9999px,35px,0); transform: skew(0.2deg); }
          75%  { clip: rect(70px,9999px,85px,0); transform: skew(-0.3deg); }
          100% { clip: rect(75px,9999px,90px,0); transform: skew(0deg); }
        }
        @keyframes glitch2 {
          0%   { clip: rect(65px,9999px,80px,0); transform: skew(-0.2deg); }
          25%  { clip: rect(20px,9999px,35px,0); transform: skew(0.4deg); }
          50%  { clip: rect(45px,9999px,60px,0); transform: skew(-0.5deg); }
          75%  { clip: rect(8px,9999px,22px,0);  transform: skew(0.3deg); }
          100% { clip: rect(12px,9999px,25px,0); transform: skew(0.2deg); }
        }
      `}</style>
    </span>
  );
}

// ── Scan Lines ────────────────────────────────────────────────────────────────

function ScanLine() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)",
        pointerEvents: "none",
        zIndex: 2,
      }}
    />
  );
}

// ── Corner Decorations ────────────────────────────────────────────────────────

function CornerDeco() {
  const c = (pos: React.CSSProperties): React.CSSProperties => ({
    position: "absolute",
    width: 40,
    height: 40,
    ...pos,
  });
  const h: React.CSSProperties = {
    position: "absolute",
    height: 1,
    width: 28,
    background: "#22d3ee",
    boxShadow: "0 0 8px #22d3ee",
  };
  const v: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 28,
    background: "#22d3ee",
    boxShadow: "0 0 8px #22d3ee",
  };
  return (
    <>
      <div style={c({ top: 20, left: 20 })}>
        <div style={{ ...h, top: 0, left: 0 }} />
        <div style={{ ...v, top: 0, left: 0 }} />
      </div>
      <div style={c({ top: 20, right: 20 })}>
        <div style={{ ...h, top: 0, right: 0 }} />
        <div style={{ ...v, top: 0, right: 0 }} />
      </div>
      <div style={c({ bottom: 20, left: 20 })}>
        <div style={{ ...h, bottom: 0, left: 0 }} />
        <div style={{ ...v, bottom: 0, left: 0 }} />
      </div>
      <div style={c({ bottom: 20, right: 20 })}>
        <div style={{ ...h, bottom: 0, right: 0 }} />
        <div style={{ ...v, bottom: 0, right: 0 }} />
      </div>
    </>
  );
}

// ── Typing Text ───────────────────────────────────────────────────────────────

function TypingText({ lines }: { lines: string[] }) {
  const [displayed, setDisplayed] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    if (lineIdx >= lines.length) {
      setDone(true);
      return;
    }
    const line = lines[lineIdx];
    if (charIdx < line.length) {
      const t = setTimeout(() => {
        setDisplayed((p) => p + line[charIdx]);
        setCharIdx((c) => c + 1);
      }, 35);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        if (lineIdx < lines.length - 1) setDisplayed((p) => p + "\n");
        setLineIdx((l) => l + 1);
        setCharIdx(0);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [charIdx, lineIdx, lines, done]);

  return (
    <pre
      style={{
        fontSize: 11,
        fontFamily: "monospace",
        color: "rgba(0,255,159,0.8)",
        textAlign: "left",
        lineHeight: 1.9,
        whiteSpace: "pre-wrap",
        minHeight: 72,
        margin: 0,
      }}
    >
      {displayed}
      {!done && (
        <span style={{ animation: "blink 1s infinite", color: "#22d3ee" }}>
          █
        </span>
      )}
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </pre>
  );
}

// ── Main WelcomeScreen ────────────────────────────────────────────────────────

export function WelcomeScreen() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const lines = [
    "個人オペレーティングシステム",
    "トレーディング・ノート・財務",
    "// SELECT SECTION TO INITIALIZE",
  ];

  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        overflow: "hidden",
        background: "#000",
      }}
    >
      {/* ── GIF background — đặt anime.gif vào /public/anime.gif ── */}
      <img
        src="/anime.jpg"
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.38,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.7) 100%)",
          pointerEvents: "none",
        }}
      />

      <MatrixRain />
      <ScanLine />
      <CornerDeco />

      {/* Center content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          textAlign: "center",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.3em",
            color: "rgba(34,211,238,0.6)",
            textTransform: "uppercase",
            marginBottom: 20,
            fontFamily: "monospace",
          }}
        >
          ◈ SYSTEM READY ◈
        </div>

        <GlitchText text="PERSONAL OS" />

        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.2em",
            marginBottom: 32,
            marginTop: 10,
            fontFamily: "monospace",
          }}
        >
          パーソナル・オペレーティング・システム
        </div>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 28,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 60,
              height: 1,
              background: "linear-gradient(to right, transparent, #22d3ee)",
            }}
          />
          <div
            style={{
              width: 6,
              height: 6,
              background: "#22d3ee",
              transform: "rotate(45deg)",
              boxShadow: "0 0 10px #22d3ee",
            }}
          />
          <div
            style={{
              width: 60,
              height: 1,
              background: "linear-gradient(to left, transparent, #22d3ee)",
            }}
          />
        </div>

        {/* Terminal */}
        <div
          style={{
            background: "rgba(0,0,0,0.75)",
            border: "0.5px solid rgba(34,211,238,0.25)",
            borderRadius: 8,
            padding: "14px 20px",
            minWidth: 320,
            backdropFilter: "blur(16px)",
            boxShadow:
              "0 0 40px rgba(34,211,238,0.06), inset 0 0 30px rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 10,
              paddingBottom: 8,
              borderBottom: "0.5px solid rgba(255,255,255,0.05)",
            }}
          >
            {["#f87171", "#fbbf24", "#34d399"].map((c) => (
              <div
                key={c}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: c,
                  opacity: 0.7,
                }}
              />
            ))}
            <span
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.2)",
                marginLeft: 4,
                fontFamily: "monospace",
              }}
            >
              terminal v2.0
            </span>
          </div>
          <TypingText lines={lines} />
        </div>

        <div
          style={{
            marginTop: 28,
            fontSize: 9,
            color: "rgba(255,255,255,0.15)",
            letterSpacing: "0.2em",
            fontFamily: "monospace",
          }}
        >
          ← SELECT SECTION TO BEGIN →
        </div>
      </div>
    </div>
  );
}
