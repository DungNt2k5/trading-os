// src/app/api/finance/events/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sectionId = searchParams.get("sectionId");
  if (!sectionId) return NextResponse.json([]);

  const events = await prisma.emailEvent.findMany({
    where: { sectionId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const body = await req.json();

  const event = await prisma.emailEvent.create({
    data: {
      sectionId: body.sectionId,
      email: body.email,
      exchange: body.exchange,
      eventCode: body.eventCode,
      eventName: body.eventName ?? null,
      amount: body.amount ? parseFloat(body.amount) : null,
      status: body.status ?? "pending",
      eventDate: body.eventDate ?? null,
      note: body.note ?? null,
    },
  });
  return NextResponse.json(event, { status: 201 });
}
