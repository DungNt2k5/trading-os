"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Editor } from "@tiptap/react";
import {
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

// ── Block definitions ─────────────────────────────────────────────────────────
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

interface Props {
  editor: Editor;
  editorContainerRef: React.RefObject<HTMLDivElement | null>;
}

// ── Component ─────────────────────────────────────────────────────────────────
// Nút + đã bị ẩn. Component này chỉ giữ lại slash-command menu
// và logic track mouse để mở menu khi cần.
// Người dùng dùng "/" để trigger block menu thay vì nút +.
export default function HoverBlockMenu({ editor, editorContainerRef }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTop, setMenuTop] = useState(0);
  const [menuLeft, setMenuLeft] = useState(0);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Dùng ref để lưu vị trí nút ảo (không render ra DOM)
  const virtualBtnTop = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<NodeJS.Timeout | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    virtualBtnTop.current = null;
  }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    return () => clearHideTimer();
  }, [clearHideTimer]);

  // Run block command
  const runCommand = (command: (editor: Editor) => void) => {
    closeMenu();
    editor.chain().focus().run();
    setTimeout(() => command(editor), 10);
  };

  // Menu không mở nữa (nút + đã bị xóa).
  // Slash command vẫn hoạt động qua SlashCommand extension (gõ "/").
  if (!menuOpen) return null;

  return (
    <>
      {/* Block menu — chỉ hiện khi được trigger bởi code khác nếu cần */}
      {menuOpen && (
        <div
          ref={menuRef}
          onMouseEnter={() => clearHideTimer()}
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
