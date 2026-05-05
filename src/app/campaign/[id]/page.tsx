import CampaignDetail from "@/modules/campaign/CampaignDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: Props) {
  const { id } = await params;
  return <CampaignDetail campaignId={id} />;
}