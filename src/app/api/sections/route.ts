import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sections = await prisma.section.findMany({
    orderBy: { order: "asc" },
  });
  return NextResponse.json(sections);
}

export async function POST(req: Request) {
  const body = await req.json();
  const section = await prisma.section.create({
    data: {
      name: body.name,
      type: body.type ?? "general",
      icon: body.icon,
      order: body.order ?? 0,
    },
  });
  return NextResponse.json(section);
}
