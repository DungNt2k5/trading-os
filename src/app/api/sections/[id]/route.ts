import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(_: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const section = await prisma.section.findUnique({ where: { id } });
    if (!section)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(section);
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
    if (body.name !== undefined) data.name = body.name;
    if (body.type !== undefined) data.type = body.type;
    if (body.icon !== undefined) data.icon = body.icon;
    if (body.order !== undefined) data.order = body.order;

    const section = await prisma.section.update({ where: { id }, data });
    return NextResponse.json(section);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await prisma.section.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
