import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tiers: true,
      accounts: true,
    },
  });
  return NextResponse.json(campaigns);
}

export async function POST(req: Request) {
  const body = await req.json();

  const campaign = await prisma.campaign.create({
    data: {
      name: body.name,
      exchange: body.exchange,
      description: body.description ?? null,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      tiers: {
        create: (body.tiers ?? []).map((t: {
          label?: string;
          minDeposit: number;
          requiredVolume: number;
          holdTime: number;
          bonus: number;
          maxSlots?: number | null;
        }) => ({
          label: t.label ?? null,
          minDeposit: t.minDeposit,
          requiredVolume: t.requiredVolume,
          holdTime: t.holdTime, // seconds
          bonus: t.bonus,
          maxSlots: t.maxSlots ?? null,
        })),
      },
    },
    include: { tiers: true, accounts: true },
  });

  return NextResponse.json(campaign, { status: 201 });
}