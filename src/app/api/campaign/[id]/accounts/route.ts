import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const accounts = await prisma.campaignAccount.findMany({
    where: { campaignId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(accounts);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const account = await prisma.campaignAccount.create({
    data: {
      campaignId: id,
      email: body.email,
      uid: body.uid,
      wallet: body.wallet,
      deposit: body.deposit ? parseFloat(body.deposit) : 0,
      depositTime: body.depositTime ? new Date(body.depositTime) : null,
      volume: body.volume ? parseFloat(body.volume) : 0,
      note: body.note ?? null,
    },
  });
  return NextResponse.json(account, { status: 201 });
}