import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sectionId = searchParams.get("sectionId");
  const status = searchParams.get("status"); // filter by status
  const tag = searchParams.get("tag"); // filter by tag name

  const pages = await prisma.page.findMany({
    where: {
      ...(sectionId ? { sectionId } : {}),
      ...(status ? { status } : {}),
      ...(tag ? { tags: { some: { tag: { name: tag } } } } : {}),
    },
    include: {
      tags: { include: { tag: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(pages);
}

export async function POST(req: Request) {
  const body = await req.json();

  const page = await prisma.page.create({
    data: {
      title: body.title ?? "Untitled",
      content: body.content ?? "",
      sectionId: body.sectionId,
      status: body.status ?? "active",
      icon: body.icon ?? null,
      pnl: body.pnl ?? null,
      amount: body.amount ?? null,
      category: body.category ?? null,
      metadata: body.metadata ?? null,
    },
    include: {
      tags: { include: { tag: true } },
    },
  });

  return NextResponse.json(page, { status: 201 });
}
