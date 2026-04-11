import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(_: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const page = await prisma.page.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    });
    if (!page)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(page);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.content !== undefined) data.content = body.content;
    if (body.status !== undefined) data.status = body.status;
    if (body.icon !== undefined) data.icon = body.icon;
    if (body.pnl !== undefined) data.pnl = body.pnl;
    if (body.amount !== undefined) data.amount = body.amount;
    if (body.category !== undefined) data.category = body.category;
    if (body.metadata !== undefined) data.metadata = body.metadata;

    // ── Tag sync ──────────────────────────────────────────────────────────────
    // body.tags = string[] of tag names to set on this page (replaces all)
    if (Array.isArray(body.tags)) {
      // upsert each tag, then replace PageTag relations
      const tagRecords = await Promise.all(
        body.tags.map((name: string) =>
          prisma.tag.upsert({
            where: { name },
            update: {},
            create: { name, color: randomColor() },
          }),
        ),
      );

      // delete all existing PageTag for this page
      await prisma.pageTag.deleteMany({ where: { pageId: id } });

      // create new ones
      if (tagRecords.length > 0) {
        await prisma.pageTag.createMany({
          data: tagRecords.map((t) => ({ pageId: id, tagId: t.id })),
        });
      }
    }

    const page = await prisma.page.update({
      where: { id },
      data,
      include: { tags: { include: { tag: true } } },
    });

    return NextResponse.json(page);
  } catch (err) {
    console.error("PATCH /api/pages/[id]:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await prisma.page.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ── POST /api/pages/[id]?action=duplicate ─────────────────────────────────────
// (Next.js App Router: thêm action qua query param trên POST)

export async function POST(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);

    if (searchParams.get("action") === "duplicate") {
      const original = await prisma.page.findUnique({
        where: { id },
        include: { tags: { include: { tag: true } } },
      });
      if (!original)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

      const copy = await prisma.page.create({
        data: {
          title: original.title + " (copy)",
          content: original.content,
          sectionId: original.sectionId,
          status: original.status,
          icon: original.icon,
          pnl: original.pnl,
          amount: original.amount,
          category: original.category,
          metadata: original.metadata,
        },
        include: { tags: { include: { tag: true } } },
      });

      // copy tags
      if (original.tags.length > 0) {
        await prisma.pageTag.createMany({
          data: original.tags.map((pt) => ({
            pageId: copy.id,
            tagId: pt.tagId,
          })),
        });
      }

      return NextResponse.json(copy, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ── Util ──────────────────────────────────────────────────────────────────────

const TAG_COLORS = [
  "#22d3ee",
  "#a855f7",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#f97316",
  "#84cc16",
];
function randomColor() {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
}
