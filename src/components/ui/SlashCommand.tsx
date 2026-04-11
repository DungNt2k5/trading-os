"use client";

import { Extension } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import tippy, { Instance as TippyInstance } from "tippy.js";
import "tippy.js/dist/tippy.css";
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
  Image as ImageIcon,
} from "lucide-react";

// ── Command definitions ──────────────────────────────────────────────────────

export const SLASH_COMMANDS = [
  {
    group: "Text",
    items: [
      {
        title: "Paragraph",
        description: "Plain text block",
        icon: Type,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setParagraph().run();
        },
      },
      {
        title: "Heading 1",
        description: "Large section title",
        icon: Heading1,
        command: ({ editor, range }: any) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setHeading({ level: 1 })
            .run();
        },
      },
      {
        title: "Heading 2",
        description: "Medium section title",
        icon: Heading2,
        command: ({ editor, range }: any) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setHeading({ level: 2 })
            .run();
        },
      },
      {
        title: "Heading 3",
        description: "Small section title",
        icon: Heading3,
        command: ({ editor, range }: any) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setHeading({ level: 3 })
            .run();
        },
      },
    ],
  },
  {
    group: "Lists",
    items: [
      {
        title: "Bullet list",
        description: "Simple unordered list",
        icon: List,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
      },
      {
        title: "Numbered list",
        description: "Ordered list",
        icon: ListOrdered,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
      },
      {
        title: "Task list",
        description: "Checkboxes",
        icon: CheckSquare,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleTaskList().run();
        },
      },
    ],
  },
  {
    group: "Blocks",
    items: [
      {
        title: "Code block",
        description: "Syntax-highlighted code",
        icon: Code,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
        },
      },
      {
        title: "Quote",
        description: "Blockquote",
        icon: Quote,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleBlockquote().run();
        },
      },
      {
        title: "Divider",
        description: "Horizontal rule",
        icon: Minus,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setHorizontalRule().run();
        },
      },
    ],
  },
  {
    group: "Callouts",
    items: [
      {
        title: "Info callout",
        description: "ℹ️ Blue note box",
        icon: AlertCircle,
        command: ({ editor, range }: any) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: "callout",
              attrs: { type: "info" },
              content: [{ type: "paragraph" }],
            })
            .run();
        },
      },
      {
        title: "Tip callout",
        description: "💡 Green tip box",
        icon: Lightbulb,
        command: ({ editor, range }: any) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: "callout",
              attrs: { type: "tip" },
              content: [{ type: "paragraph" }],
            })
            .run();
        },
      },
      {
        title: "Warning callout",
        description: "⚠️ Yellow warning box",
        icon: AlertTriangle,
        command: ({ editor, range }: any) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: "callout",
              attrs: { type: "warning" },
              content: [{ type: "paragraph" }],
            })
            .run();
        },
      },
    ],
  },
];

// ── Command list UI ──────────────────────────────────────────────────────────

interface CommandListProps {
  items: typeof SLASH_COMMANDS;
  command: (item: any) => void;
}

export const CommandList = forwardRef<any, CommandListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Flatten for keyboard nav
    const flatItems = items.flatMap((g) => g.items);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex(
            (i) => (i - 1 + flatItems.length) % flatItems.length,
          );
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((i) => (i + 1) % flatItems.length);
          return true;
        }
        if (event.key === "Enter") {
          const item = flatItems[selectedIndex];
          if (item) command(item);
          return true;
        }
        return false;
      },
    }));

    let flatIdx = 0;

    return (
      <div
        style={{
          background: "rgba(10,10,15,0.97)",
          border: "0.5px solid rgba(255,255,255,0.1)",
          borderRadius: 12,
          padding: "6px 0",
          minWidth: 260,
          maxHeight: 360,
          overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)",
        }}
      >
        {items.map((group) => (
          <div key={group.group}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "rgba(255,255,255,0.25)",
                letterSpacing: "0.1em",
                padding: "8px 14px 4px",
                textTransform: "uppercase",
              }}
            >
              {group.group}
            </div>
            {group.items.map((item) => {
              const currentIdx = flatIdx++;
              const isSelected = selectedIndex === currentIdx;
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  onClick={() => command(item)}
                  onMouseEnter={() => setSelectedIndex(currentIdx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "7px 14px",
                    background: isSelected
                      ? "rgba(6,182,212,0.1)"
                      : "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    borderLeft: isSelected
                      ? "2px solid rgba(6,182,212,0.6)"
                      : "2px solid transparent",
                    transition: "all 0.1s",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: isSelected
                        ? "rgba(6,182,212,0.15)"
                        : "rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon
                      size={14}
                      color={isSelected ? "#22d3ee" : "rgba(255,255,255,0.5)"}
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: isSelected ? "#22d3ee" : "rgba(255,255,255,0.8)",
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.3)",
                        marginTop: 1,
                      }}
                    >
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  },
);

CommandList.displayName = "CommandList";

// ── TipTap Extension ─────────────────────────────────────────────────────────

export const SlashCommand = Extension.create({
  name: "slashCommand",
  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({
          editor,
          range,
          props,
        }: {
          editor: any;
          range: any;
          props: any;
        }) => {
          props.command({ editor, range });
        },
      },
    };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => {
          const q = query.toLowerCase();
          if (!q) return SLASH_COMMANDS;
          return SLASH_COMMANDS.map((group) => ({
            ...group,
            items: group.items.filter(
              (item) =>
                item.title.toLowerCase().includes(q) ||
                item.description.toLowerCase().includes(q),
            ),
          })).filter((group) => group.items.length > 0);
        },
        render: () => {
          let component: ReactRenderer;
          let popup: TippyInstance[];

          return {
            onStart(props: any) {
              component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
              });
              popup = tippy("body", {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
                theme: "slash",
              });
            },
            onUpdate(props: any) {
              component.updateProps(props);
              popup[0].setProps({ getReferenceClientRect: props.clientRect });
            },
            onKeyDown(props: any) {
              if (props.event.key === "Escape") {
                popup[0].hide();
                return true;
              }
              return (component.ref as any)?.onKeyDown(props) ?? false;
            },
            onExit() {
              popup[0].destroy();
              component.destroy();
            },
          };
        },
      }),
    ];
  },
});
