import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.type !== undefined) data.type = body.type;
    if (body.icon !== undefined) data.icon = body.icon;
    if (body.order !== undefined) data.order = body.order;

    const section = await prisma.section.update({
      where: { id },
      data,
    });
    return NextResponse.json(section);
  } catch (err) {
    console.error("PATCH /api/sections/[id] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.section.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/sections/[id] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
