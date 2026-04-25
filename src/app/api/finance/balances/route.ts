// src/app/api/finance/balances/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sectionId = searchParams.get("sectionId");
  if (!sectionId) return NextResponse.json([]);

  const balances = await prisma.dailyBalance.findMany({
    where: { sectionId },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(balances);
}

export async function POST(req: Request) {
  const body = await req.json();
  const money1 = parseFloat(body.money1 ?? 0);
  const money2 = parseFloat(body.money2 ?? 0);

  const balance = await prisma.dailyBalance.create({
    data: {
      sectionId: body.sectionId,
      date: body.date, // "YYYY-MM-DD"
      money1,
      money2,
      total: money1 + money2,
      note: body.note ?? null,
    },
  });
  return NextResponse.json(balance, { status: 201 });
}
