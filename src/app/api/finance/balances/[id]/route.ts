// src/app/api/finance/balances/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const body = await req.json();

  const money1 =
    body.money1 !== undefined ? parseFloat(body.money1) : undefined;

  const money2 =
    body.money2 !== undefined ? parseFloat(body.money2) : undefined;

  // Fetch current record nếu chỉ update 1 trong 2
  let current = null;

  if (money1 === undefined || money2 === undefined) {
    current = await prisma.dailyBalance.findUnique({
      where: { id },
    });
  }

  const m1 = money1 ?? current?.money1 ?? 0;
  const m2 = money2 ?? current?.money2 ?? 0;

  const updated = await prisma.dailyBalance.update({
    where: { id },
    data: {
      ...(money1 !== undefined ? { money1: m1 } : {}),
      ...(money2 !== undefined ? { money2: m2 } : {}),
      total: m1 + m2,
      ...(body.note !== undefined ? { note: body.note } : {}),
      ...(body.date !== undefined ? { date: body.date } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  await prisma.dailyBalance.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
