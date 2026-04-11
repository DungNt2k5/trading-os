"use client";

import { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { useCallback, useState } from "react";

interface Props {
  editor: Editor;
}

export default function BubbleToolbar({ editor }: Props) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  const setLink = useCallback(() => {
    if (!linkUrl) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl, target: "_blank" })
        .run();
    }
    setShowLinkInput(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  const ToolBtn = ({
    active,
    onClick,
    children,
    title,
  }: {
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 6,
        border: "none",
        background: active ? "rgba(6,182,212,0.2)" : "transparent",
        color: active ? "#22d3ee" : "rgba(255,255,255,0.65)",
        cursor: "pointer",
        transition: "all 0.1s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!active)
          (e.currentTarget as HTMLElement).style.background =
            "rgba(255,255,255,0.08)";
      }}
      onMouseLeave={(e) => {
        if (!active)
          (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {children}
    </button>
  );

  const Divider = () => (
    <div
      style={{
        width: 1,
        height: 18,
        background: "rgba(255,255,255,0.12)",
        margin: "0 4px",
        flexShrink: 0,
      }}
    />
  );

  return (
    <BubbleMenu
      editor={editor}
      options={{
        placement: "top",
      }}
      shouldShow={({ from, to }) => from !== to}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          padding: "4px 8px",
          background: "rgba(10,10,15,0.97)",
          border: "0.5px solid rgba(255,255,255,0.1)",
          borderRadius: 10,
          boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Text style */}
        <ToolBtn
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
        >
          <Bold size={13} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
        >
          <Italic size={13} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
        >
          <Underline size={13} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <Strikethrough size={13} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline code"
        >
          <Code size={13} />
        </ToolBtn>

        <Divider />

        {/* Highlight */}
        <ToolBtn
          active={editor.isActive("highlight")}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          title="Highlight"
        >
          <Highlighter size={13} />
        </ToolBtn>

        <Divider />

        {/* Alignment */}
        <ToolBtn
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="Align left"
        >
          <AlignLeft size={13} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="Align center"
        >
          <AlignCenter size={13} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="Align right"
        >
          <AlignRight size={13} />
        </ToolBtn>

        <Divider />

        {/* Link */}
        {showLinkInput ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input
              autoFocus
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setLink();
                if (e.key === "Escape") setShowLinkInput(false);
              }}
              placeholder="https://..."
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "0.5px solid rgba(255,255,255,0.2)",
                borderRadius: 6,
                padding: "3px 8px",
                color: "rgba(255,255,255,0.8)",
                fontSize: 12,
                outline: "none",
                width: 160,
              }}
            />
            <button
              onClick={setLink}
              style={{
                fontSize: 11,
                padding: "3px 8px",
                background: "rgba(6,182,212,0.2)",
                border: "0.5px solid rgba(6,182,212,0.4)",
                borderRadius: 6,
                color: "#22d3ee",
                cursor: "pointer",
              }}
            >
              Set
            </button>
            <button
              onClick={() => setShowLinkInput(false)}
              style={{
                fontSize: 11,
                padding: "3px 8px",
                background: "transparent",
                border: "0.5px solid rgba(255,255,255,0.15)",
                borderRadius: 6,
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <ToolBtn
            active={editor.isActive("link")}
            onClick={() => setShowLinkInput(true)}
            title="Insert link"
          >
            <Link size={13} />
          </ToolBtn>
        )}
      </div>
    </BubbleMenu>
  );
}
