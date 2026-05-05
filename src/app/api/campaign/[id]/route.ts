import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { tiers: true, accounts: { orderBy: { createdAt: "asc" } } },
  });
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(campaign);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  // Update campaign + replace tiers
  await prisma.campaignTier.deleteMany({ where: { campaignId: id } });

  const campaign = await prisma.campaign.update({
    where: { id },
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
          holdTime: t.holdTime,
          bonus: t.bonus,
          maxSlots: t.maxSlots ?? null,
        })),
      },
    },
    include: { tiers: true, accounts: true },
  });

  return NextResponse.json(campaign);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.campaign.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}