// src/app/api/finance/events/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const body = await req.json();

  const updated = await prisma.emailEvent.update({
    where: { id },
    data: {
      ...(body.email !== undefined ? { email: body.email } : {}),
      ...(body.exchange !== undefined ? { exchange: body.exchange } : {}),
      ...(body.eventCode !== undefined ? { eventCode: body.eventCode } : {}),
      ...(body.eventName !== undefined ? { eventName: body.eventName } : {}),
      ...(body.amount !== undefined
        ? { amount: body.amount ? parseFloat(body.amount) : null }
        : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.eventDate !== undefined ? { eventDate: body.eventDate } : {}),
      ...(body.note !== undefined ? { note: body.note } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  await prisma.emailEvent.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
