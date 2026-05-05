import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; accountId: string }> }
) {
  const { accountId } = await params;
  const body = await req.json();

  const account = await prisma.campaignAccount.update({
    where: { id: accountId },
    data: {
      email: body.email,
      uid: body.uid,
      wallet: body.wallet,
      deposit: body.deposit !== undefined ? parseFloat(body.deposit) : undefined,
      depositTime: body.depositTime
        ? new Date(body.depositTime)
        : body.depositTime === null
        ? null
        : undefined,
      volume: body.volume !== undefined ? parseFloat(body.volume) : undefined,
      note: body.note ?? null,
    },
  });
  return NextResponse.json(account);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; accountId: string }> }
) {
  const { accountId } = await params;
  await prisma.campaignAccount.delete({ where: { id: accountId } });
  return NextResponse.json({ ok: true });
}