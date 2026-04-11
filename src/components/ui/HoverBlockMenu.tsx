"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Editor } from "@tiptap/react";
import {
  Plus,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Minus,
  Type,
  AlertCircle,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";

// ── Block definitions ────────────────────────────────────────────────────────

const BLOCK_GROUPS = [
  {
    group: "Text",
    items: [
      {
        title: "Paragraph",
        icon: Type,
        command: (editor: Editor) =>
          editor.chain().focus().setParagraph().run(),
      },
      {
        title: "Heading 1",
        icon: Heading1,
        command: (editor: Editor) =>
          editor.chain().focus().setHeading({ level: 1 }).run(),
      },
      {
        title: "Heading 2",
        icon: Heading2,
        command: (editor: Editor) =>
          editor.chain().focus().setHeading({ level: 2 }).run(),
      },
      {
        title: "Heading 3",
        icon: Heading3,
        command: (editor: Editor) =>
          editor.chain().focus().setHeading({ level: 3 }).run(),
      },
    ],
  },
  {
    group: "Lists",
    items: [
      {
        title: "Bullet list",
        icon: List,
        command: (editor: Editor) =>
          editor.chain().focus().toggleBulletList().run(),
      },
      {
        title: "Numbered list",
        icon: ListOrdered,
        command: (editor: Editor) =>
          editor.chain().focus().toggleOrderedList().run(),
      },
      {
        title: "Task list",
        icon: CheckSquare,
        command: (editor: Editor) =>
          editor.chain().focus().toggleTaskList().run(),
      },
    ],
  },
  {
    group: "Blocks",
    items: [
      {
        title: "Code block",
        icon: Code,
        command: (editor: Editor) =>
          editor.chain().focus().toggleCodeBlock().run(),
      },
      {
        title: "Quote",
        icon: Quote,
        command: (editor: Editor) =>
          editor.chain().focus().toggleBlockquote().run(),
      },
      {
        title: "Divider",
        icon: Minus,
        command: (editor: Editor) =>
          editor.chain().focus().setHorizontalRule().run(),
      },
    ],
  },
  {
    group: "Callouts",
    items: [
      {
        title: "Info",
        icon: AlertCircle,
        command: (editor: Editor) =>
          editor
            .chain()
            .focus()
            .insertContent({
              type: "callout",
              attrs: { type: "info" },
              content: [{ type: "paragraph" }],
            })
            .run(),
      },
      {
        title: "Tip",
        icon: Lightbulb,
        command: (editor: Editor) =>
          editor
            .chain()
            .focus()
            .insertContent({
              type: "callout",
              attrs: { type: "tip" },
              content: [{ type: "paragraph" }],
            })
            .run(),
      },
      {
        title: "Warning",
        icon: AlertTriangle,
        command: (editor: Editor) =>
          editor
            .chain()
            .focus()
            .insertContent({
              type: "callout",
              attrs: { type: "warning" },
              content: [{ type: "paragraph" }],
            })
            .run(),
      },
    ],
  },
];

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  editor: Editor;
  editorContainerRef: React.RefObject<HTMLDivElement | null>;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function HoverBlockMenu({ editor, editorContainerRef }: Props) {
  const [btnTop, setBtnTop] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTop, setMenuTop] = useState(0);
  const [menuLeft, setMenuLeft] = useState(0);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<NodeJS.Timeout | null>(null);
  const currentLineTop = useRef<number | null>(null);
  const hideButton = useCallback(() => {
    currentLineTop.current = null;
    setBtnTop(null);
  }, []);
  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const scheduleHide = useCallback(
    (delay = 250) => {
      if (menuOpen) return;
      clearHideTimer();
      hideTimer.current = setTimeout(hideButton, delay);
    },
    [menuOpen, clearHideTimer, hideButton],
  );

  // ── Track mouse over editor → find hovered line → position + button ───────

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!editorContainerRef.current) return;
      if (menuOpen) return; // keep button frozen while menu is open

      const editorEl = editorContainerRef.current.querySelector(
        ".ProseMirror",
      ) as HTMLElement | null;
      if (!editorEl) return;

      // Find the block element under the cursor
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (!target) return;

      // Walk up to find a direct child of ProseMirror
      let node: HTMLElement | null = target as HTMLElement;
      while (node && node.parentElement !== editorEl) {
        node = node.parentElement;
      }
      if (!node || node.parentElement !== editorEl) {
        // Mouse not over a block — start hide timer
        scheduleHide(220);
        return;
      }

      clearHideTimer();

      const rect = node.getBoundingClientRect();
      const containerRect = editorContainerRef.current.getBoundingClientRect();
      const top =
        rect.top - containerRect.top + editorContainerRef.current.scrollTop;

      if (top !== currentLineTop.current) {
        currentLineTop.current = top;
        setBtnTop(top + rect.height / 2 - 10); // vertically center the 20px button
      }
    },
    [menuOpen, editorContainerRef, clearHideTimer, scheduleHide],
  );

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (menuOpen) return;
    const nextTarget = e.relatedTarget as Node | null;
    if (nextTarget) {
      if (btnRef.current?.contains(nextTarget)) return;
      if (menuRef.current?.contains(nextTarget)) return;
    }
    scheduleHide(320);
  }, [menuOpen, scheduleHide]);

  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container) return;
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave, editorContainerRef]);

  useEffect(() => {
    return () => clearHideTimer();
  }, [clearHideTimer]);

  // ── Close menu on outside click ───────────────────────────────────────────

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
        hideButton();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen, hideButton]);

  // ── Open menu positioned near the + button ────────────────────────────────

  const openMenu = () => {
    if (!btnRef.current || !editorContainerRef.current) return;
    const btnRect = btnRef.current.getBoundingClientRect();
    const containerRect = editorContainerRef.current.getBoundingClientRect();
    setMenuTop(
      btnRect.top - containerRect.top + editorContainerRef.current.scrollTop,
    );
    setMenuLeft(40); // fixed left inside container
    setMenuOpen(true);
  };

  // ── Run block command ─────────────────────────────────────────────────────

  const runCommand = (command: (editor: Editor) => void) => {
    setMenuOpen(false);
    hideButton();
    // Focus editor at cursor position first, then run command
    editor.chain().focus().run();
    setTimeout(() => command(editor), 10);
  };

  if (btnTop === null) return null;

  return (
    <>
      {/* ── + Button ──────────────────────────────────────────────────────── */}
      <button
        ref={btnRef}
        onClick={openMenu}
        style={{
          position: "absolute",
          left: -32,
          top: btnTop,
          width: 22,
          height: 22,
          borderRadius: 6,
          border: "0.5px solid rgba(255,255,255,0.12)",
          background: menuOpen
            ? "rgba(6,182,212,0.15)"
            : "rgba(255,255,255,0.05)",
          color: menuOpen ? "#22d3ee" : "rgba(255,255,255,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.15s",
          zIndex: 20,
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          clearHideTimer();
          if (!menuOpen) {
            (e.currentTarget as HTMLElement).style.background =
              "rgba(6,182,212,0.12)";
            (e.currentTarget as HTMLElement).style.color = "#22d3ee";
            (e.currentTarget as HTMLElement).style.borderColor =
              "rgba(6,182,212,0.3)";
          }
        }}
        onMouseLeave={(e) => {
          if (!menuOpen) {
            (e.currentTarget as HTMLElement).style.background =
              "rgba(255,255,255,0.05)";
            (e.currentTarget as HTMLElement).style.color =
              "rgba(255,255,255,0.3)";
            (e.currentTarget as HTMLElement).style.borderColor =
              "rgba(255,255,255,0.12)";
          }
          scheduleHide(260);
        }}
        title="Add block"
      >
        <Plus size={13} strokeWidth={2.5} />
      </button>

      {/* ── Block menu ────────────────────────────────────────────────────── */}
      {menuOpen && (
        <div
          ref={menuRef}
          onMouseEnter={() => clearHideTimer()}
          onMouseLeave={() => scheduleHide(300)}
          style={{
            position: "absolute",
            top: menuTop + 28,
            left: menuLeft,
            zIndex: 50,
            background: "rgba(10,10,15,0.97)",
            border: "0.5px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: "6px 0",
            minWidth: 220,
            maxHeight: 340,
            overflowY: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
            backdropFilter: "blur(12px)",
          }}
        >
          {BLOCK_GROUPS.map((group) => (
            <div key={group.group}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.22)",
                  letterSpacing: "0.1em",
                  padding: "8px 12px 4px",
                  textTransform: "uppercase",
                }}
              >
                {group.group}
              </div>

              {group.items.map((item) => {
                const Icon = item.icon;
                const isHovered =
                  hoveredItem === `${group.group}-${item.title}`;
                return (
                  <button
                    key={item.title}
                    onMouseEnter={() =>
                      setHoveredItem(`${group.group}-${item.title}`)
                    }
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={() => runCommand(item.command)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      padding: "6px 12px",
                      background: isHovered
                        ? "rgba(6,182,212,0.08)"
                        : "transparent",
                      border: "none",
                      borderLeft: isHovered
                        ? "2px solid rgba(6,182,212,0.5)"
                        : "2px solid transparent",
                      cursor: "pointer",
                      transition: "all 0.1s",
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        background: isHovered
                          ? "rgba(6,182,212,0.15)"
                          : "rgba(255,255,255,0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "background 0.1s",
                      }}
                    >
                      <Icon
                        size={13}
                        color={isHovered ? "#22d3ee" : "rgba(255,255,255,0.45)"}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        color: isHovered ? "#22d3ee" : "rgba(255,255,255,0.7)",
                        fontWeight: isHovered ? 500 : 400,
                        transition: "color 0.1s",
                      }}
                    >
                      {item.title}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
