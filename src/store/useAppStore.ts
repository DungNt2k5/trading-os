import { create } from "zustand";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Section {
  id: string;
  name: string;
  type: string;
  icon?: string | null;
  order: number;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface PageTag {
  pageId: string;
  tagId: string;
  tag: Tag;
}

/** Metadata lưu dưới dạng JSON string trong DB, parse ra object ở FE */
export interface TradingMeta {
  direction?: "long" | "short" | "";
  entryPrice?: number | string;
  exitPrice?: number | string;
  size?: number | string;
  riskReward?: number | string;
  stopLoss?: number | string;
  takeProfit?: number | string;
  session?: string;
  setup?: string;
  notes?: string;
}

export interface ExpenseMeta {
  paymentMethod?: string;
  merchant?: string;
  note?: string;
}

export type PageMeta = TradingMeta & ExpenseMeta & Record<string, unknown>;

export interface Page {
  id: string;
  title: string;
  content: string;
  status: string;
  icon?: string | null;
  pnl?: number | null;
  amount?: number | null;
  category?: string | null;
  metadata?: string | null; // raw JSON string from DB
  sectionId: string;
  createdAt: string;
  updatedAt: string;
  tags?: PageTag[];
}

interface AppStore {
  sections: Section[];
  activeSectionId: string | null;
  activePageId: string | null;
  pages: Page[];
  sidebarOpen: boolean;

  setSections: (sections: Section[]) => void;
  setActiveSectionId: (id: string | null) => void;
  setActivePageId: (id: string | null) => void;
  setPages: (pages: Page[]) => void;
  toggleSidebar: () => void;
  addSection: (section: Section) => void;
  removeSection: (id: string) => void;
  updateSection: (id: string, data: Partial<Section>) => void;
  updatePage: (id: string, data: Partial<Page>) => void;
  addPage: (page: Page) => void;
  removePage: (id: string) => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>((set) => ({
  sections: [],
  activeSectionId: null,
  activePageId: null,
  pages: [],
  sidebarOpen: true,

  setSections: (sections) => set({ sections }),
  setActiveSectionId: (id) => set({ activeSectionId: id }),
  setActivePageId: (id) => set({ activePageId: id }),
  setPages: (pages) => set({ pages }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  addSection: (section) => set((s) => ({ sections: [...s.sections, section] })),

  removeSection: (id) =>
    set((s) => ({ sections: s.sections.filter((sec) => sec.id !== id) })),

  updateSection: (id, data) =>
    set((s) => ({
      sections: s.sections.map((sec) =>
        sec.id === id ? { ...sec, ...data } : sec,
      ),
    })),

  updatePage: (id, data) =>
    set((s) => ({
      pages: s.pages.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),

  addPage: (page) => set((s) => ({ pages: [page, ...s.pages] })),

  removePage: (id) =>
    set((s) => ({ pages: s.pages.filter((p) => p.id !== id) })),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse metadata JSON string thành object, trả {} nếu lỗi */
export function parseMeta(raw?: string | null): PageMeta {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** Stringify metadata object thành JSON string */
export function stringifyMeta(meta: Partial<TradingMeta & ExpenseMeta>): string {
  return JSON.stringify(meta);
}
