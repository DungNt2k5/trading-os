"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Command } from "cmdk";
import { useAppStore, type Page } from "@/store/useAppStore";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Clock3,
  Search,
  Zap,
} from "lucide-react";

const RECENT_KEY = "command_palette_recent_pages";

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeRecent(ids: string[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, 8)));
  }
}

export default function CommandPalette() {
  const {
    sections,
    activeSectionId,
    activePageId,
    setPages,
    setActiveSectionId,
    setActivePageId,
    addPage,
    updatePage,
    removePage,
  } = useAppStore();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [apiPages, setApiPages] = useState<Page[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const pushRecent = useCallback((id: string) => {
    setRecentIds((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, 8);
      writeRecent(next);
      return next;
    });
  }, []);

  const fetchPagesFromApi = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pages");
      const data: Page[] = await res.json();
      setApiPages(data);
      setPages(data);
    } finally {
      setLoading(false);
    }
  }, [setPages]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") close();
    };
    const onOpenByEvent = () => setOpen(true);
    window.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("open-command-palette", onOpenByEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      window.removeEventListener("open-command-palette", onOpenByEvent);
    };
  }, [close]);

  useEffect(() => {
    if (!open) return;
    setRecentIds(readRecent());
    void fetchPagesFromApi();
  }, [open, fetchPagesFromApi]);

  const recentPages = useMemo(() => {
    const map = new Map(apiPages.map((p) => [p.id, p]));
    return recentIds
      .map((id) => map.get(id))
      .filter((p): p is Page => Boolean(p));
  }, [apiPages, recentIds]);

  const activePage = useMemo(
    () => apiPages.find((p) => p.id === activePageId) ?? null,
    [apiPages, activePageId],
  );

  const gotoPage = useCallback(
    (page: Page) => {
      setActiveSectionId(page.sectionId);
      setActivePageId(page.id);
      pushRecent(page.id);
      close();
    },
    [close, pushRecent, setActivePageId, setActiveSectionId],
  );

  const createPage = useCallback(async () => {
    if (!activeSectionId) return;
    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled", content: "", sectionId: activeSectionId }),
    });
    const page: Page = await res.json();
    addPage(page);
    setApiPages((prev) => [page, ...prev]);
    gotoPage(page);
  }, [activeSectionId, addPage, gotoPage]);

  const renamePage = useCallback(
    async (page: Page) => {
      const nextTitle = window.prompt("Rename page", page.title || "Untitled");
      if (!nextTitle?.trim()) return;
      const res = await fetch(`/api/pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: nextTitle.trim() }),
      });
      const updated: Page = await res.json();
      updatePage(page.id, { title: updated.title });
      setApiPages((prev) => prev.map((p) => (p.id === page.id ? updated : p)));
      close();
    },
    [close, updatePage],
  );

  const deletePage = useCallback(
    async (page: Page) => {
      if (!window.confirm(`Delete page "${page.title || "Untitled"}"?`)) return;
      await fetch(`/api/pages/${page.id}`, { method: "DELETE" });
      removePage(page.id);
      setApiPages((prev) => prev.filter((p) => p.id !== page.id));
      setRecentIds((prev) => {
        const next = prev.filter((id) => id !== page.id);
        writeRecent(next);
        return next;
      });
      if (activePageId === page.id) setActivePageId(null);
      close();
    },
    [activePageId, close, removePage, setActivePageId],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[14vh]"
      style={{ background: "rgba(0,0,0,0.62)", backdropFilter: "blur(5px)" }}
      onMouseDown={(e) => e.currentTarget === e.target && close()}
    >
      <Command
        label="Command palette"
        className="glass-panel w-full max-w-[640px] mx-4 overflow-hidden rounded-2xl border border-white/10 text-white shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <Search size={15} className="text-white/35" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Search pages from API, recent, actions..."
            className="w-full bg-transparent text-sm text-white/85 outline-none placeholder:text-white/30"
          />
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto py-2">
          <Command.Empty className="px-4 py-8 text-center text-sm text-white/35">
            {loading ? "Loading..." : "No results"}
          </Command.Empty>

          <Command.Group heading="Actions" className="px-2 text-white/40">
            <Command.Item
              value="action-new-page"
              keywords={["new", "create", "page"]}
              onSelect={() => void createPage()}
              className="mx-1 flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm data-[selected=true]:bg-white/10"
            >
              <Plus size={14} className="text-cyan-400" />
              <span>New page</span>
            </Command.Item>

            {activePage && (
              <>
                <Command.Item
                  value={`action-rename-${activePage.id}`}
                  keywords={["rename", "page"]}
                  onSelect={() => void renamePage(activePage)}
                  className="mx-1 flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm data-[selected=true]:bg-white/10"
                >
                  <Pencil size={14} className="text-amber-400" />
                  <span>Rename current page</span>
                </Command.Item>
                <Command.Item
                  value={`action-delete-${activePage.id}`}
                  keywords={["delete", "remove", "page"]}
                  onSelect={() => void deletePage(activePage)}
                  className="mx-1 flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm data-[selected=true]:bg-white/10"
                >
                  <Trash2 size={14} className="text-rose-400" />
                  <span>Delete current page</span>
                </Command.Item>
              </>
            )}

            <Command.Item
              value="action-new-section"
              keywords={["new", "section"]}
              onSelect={() => {
                close();
                window.dispatchEvent(new CustomEvent("open-create-section"));
              }}
              className="mx-1 flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm data-[selected=true]:bg-white/10"
            >
              <Zap size={14} className="text-yellow-400" />
              <span>New section</span>
            </Command.Item>
          </Command.Group>

          {recentPages.length > 0 && (
            <Command.Group heading="Recent pages" className="px-2 text-white/40">
              {recentPages.map((page) => {
                const sectionName =
                  sections.find((s) => s.id === page.sectionId)?.name ?? "Unknown section";
                return (
                  <Command.Item
                    key={`recent-${page.id}`}
                    value={`recent-${page.title}-${sectionName}`}
                    keywords={["recent", page.title, sectionName]}
                    onSelect={() => gotoPage(page)}
                    className="mx-1 flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm data-[selected=true]:bg-white/10"
                  >
                    <Clock3 size={13} className="text-white/40" />
                    <span className="truncate">{page.title || "Untitled"}</span>
                    <span className="ml-auto truncate text-xs text-white/35">{sectionName}</span>
                  </Command.Item>
                );
              })}
            </Command.Group>
          )}

          <Command.Group heading="Pages (API)" className="px-2 text-white/40">
            {apiPages.map((page) => {
              const sectionName =
                sections.find((s) => s.id === page.sectionId)?.name ?? "Unknown section";
              return (
                <Command.Item
                  key={page.id}
                  value={`${page.title}-${sectionName}`}
                  keywords={[page.title, sectionName, page.status]}
                  onSelect={() => gotoPage(page)}
                  className="mx-1 flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm data-[selected=true]:bg-white/10"
                >
                  <FileText size={13} className="text-white/45" />
                  <span className="truncate">{page.title || "Untitled"}</span>
                  <span className="ml-auto truncate text-xs text-white/35">{sectionName}</span>
                </Command.Item>
              );
            })}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
