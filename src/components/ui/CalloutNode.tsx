"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
} from "@tiptap/react";

// ── Callout styles by type ───────────────────────────────────────────────────

const CALLOUT_STYLES = {
  info: {
    bg: "rgba(6,182,212,0.06)",
    border: "rgba(6,182,212,0.25)",
    icon: "ℹ️",
    labelColor: "rgba(6,182,212,0.8)",
  },
  tip: {
    bg: "rgba(34,197,94,0.06)",
    border: "rgba(34,197,94,0.25)",
    icon: "💡",
    labelColor: "rgba(34,197,94,0.8)",
  },
  warning: {
    bg: "rgba(251,191,36,0.06)",
    border: "rgba(251,191,36,0.25)",
    icon: "⚠️",
    labelColor: "rgba(251,191,36,0.8)",
  },
  danger: {
    bg: "rgba(239,68,68,0.06)",
    border: "rgba(239,68,68,0.25)",
    icon: "🚨",
    labelColor: "rgba(239,68,68,0.8)",
  },
} as const;

type CalloutType = keyof typeof CALLOUT_STYLES;

// ── React component rendered inside the node view ────────────────────────────

function CalloutView({ node, updateAttributes }: any) {
  const type: CalloutType = node.attrs.type ?? "info";
  const s = CALLOUT_STYLES[type] ?? CALLOUT_STYLES.info;

  return (
    <NodeViewWrapper>
      <div
        style={{
          background: s.bg,
          border: `0.5px solid ${s.border}`,
          borderLeft: `3px solid ${s.border}`,
          borderRadius: 10,
          padding: "12px 16px",
          margin: "12px 0",
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        {/* Type selector */}
        <button
          contentEditable={false}
          onClick={() => {
            const types: CalloutType[] = ["info", "tip", "warning", "danger"];
            const next = types[(types.indexOf(type) + 1) % types.length];
            updateAttributes({ type: next });
          }}
          title="Click to cycle type"
          style={{
            fontSize: 16,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            flexShrink: 0,
            marginTop: 2,
            lineHeight: 1,
          }}
        >
          {s.icon}
        </button>

        {/* Editable content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <NodeViewContent
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: 14,
              lineHeight: 1.7,
              outline: "none",
            }}
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
}

// ── TipTap Node definition ────────────────────────────────────────────────────

export const CalloutNode = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      type: {
        default: "info",
        parseHTML: (el) => el.getAttribute("data-type") ?? "info",
        renderHTML: (attrs) => ({ "data-type": attrs.type }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-callout": true }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },
});
