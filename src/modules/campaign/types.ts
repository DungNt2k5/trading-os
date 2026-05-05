export interface CampaignTier {
  id: string;
  campaignId: string;
  label: string | null;
  minDeposit: number;
  requiredVolume: number;
  holdTime: number; // seconds stored in DB
  bonus: number;
  maxSlots: number | null;
}

export interface CampaignAccount {
  id: string;
  campaignId: string;
  email: string;
  uid: string;
  wallet: string;
  deposit: number;
  depositTime: string | null; // ISO string
  volume: number;
  note: string | null;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  exchange: string;
  description: string | null;
  startDate: string; // ISO string
  endDate: string;
  createdAt: string;
  tiers: CampaignTier[];
  accounts: CampaignAccount[];
}

export type AccountStatus =
  | "NoTier"
  | "Pending"
  | "Eligible"
  | "Completed"
  | "Failed";

export interface AccountRow extends CampaignAccount {
  matchedTier: CampaignTier | null;
  status: AccountStatus;
  timeLeft: number; // seconds
  volumeProgress: number; // 0–100
}

// For form use — holdTime in hours (UI), not seconds (DB)
export interface TierFormData {
  label: string;
  minDeposit: number;
  requiredVolume: number;
  holdTimeHours: number;
  bonus: number;
  maxSlots: number | null;
}

export interface CampaignFormData {
  name: string;
  exchange: string;
  description: string;
  startDate: string;
  endDate: string;
  tiers: TierFormData[];
}

export interface AccountFormData {
  email: string;
  uid: string;
  wallet: string;
  deposit: number;
  depositTime: string;
  volume: number;
  note: string;
}