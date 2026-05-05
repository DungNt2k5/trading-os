// src/modules/campaign/campaignLogic.ts
import type { Campaign, CampaignAccount, CampaignTier, AccountStatus } from "./types";

/** Find highest tier the account qualifies for (sort by minDeposit DESC) */
export function getMatchedTier(
  account: CampaignAccount,
  tiers: CampaignTier[]
): CampaignTier | null {
  const sorted = [...tiers].sort((a, b) => b.minDeposit - a.minDeposit);
  return sorted.find((t) => account.deposit >= t.minDeposit) ?? null;
}

/** Time remaining in seconds */
export function getTimeLeft(depositTime: Date | string, holdTime: number): number {
  const dt = typeof depositTime === "string" ? new Date(depositTime) : depositTime;
  const expiry = dt.getTime() + holdTime * 1000;
  return Math.floor((expiry - Date.now()) / 1000);
}

/** Volume progress percentage (0-100) */
export function getVolumeProgress(volume: number, requiredVolume: number): number {
  if (requiredVolume <= 0) return 100;
  return Math.min(100, Math.max(0, (volume / requiredVolume) * 100));
}

/** Account status */
export function getAccountStatus(
  account: CampaignAccount,
  tiers: CampaignTier[],
  _campaign: Campaign
): AccountStatus {
  const tier = getMatchedTier(account, tiers);

  if (!tier) return "NoTier";
  if (!account.depositTime) return "Pending";

  const timeLeft = getTimeLeft(account.depositTime, tier.holdTime);
  const volumeOk = account.volume >= tier.requiredVolume;

  if (volumeOk && timeLeft > 0) return "Eligible";
  if (volumeOk && timeLeft <= 0) return "Completed";
  if (timeLeft < 0 && !volumeOk) return "Failed";

  // timeLeft >= 0 but volume not enough yet → still Pending
  return "Pending";
}

/** Format countdown to HH:MM:SS or "Hết hạn" */
export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "Hết hạn";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

/** Format hold time (seconds) → human readable */
export function formatHoldTime(seconds: number): string {
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

/** Format money */
export function fmtMoney(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1).replace(/\.?0+$/, "") + "K";
  return n.toLocaleString("vi-VN");
}

/** Format date string to DD/MM/YYYY */
export function fmtDate(d: string): string {
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Exchange color mapping */
export function getExchangeColor(exchange: string): string {
  const map: Record<string, string> = {
    APEX: "#22d3ee",
    XT: "#a78bfa",
    BITMART: "#34d399",
    BYBIT: "#f59e0b",
    BINANCE: "#fbbf24",
    OKX: "#60a5fa",
    GATE: "#f472b6",
  };
  return map[exchange?.toUpperCase()] ?? "#94a3b8";
}

/** Status display config */
export const STATUS_CONFIG = {
  NoTier:    { label: "Chưa đủ ĐK", color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" },
  Pending:   { label: "Chờ deposit", color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.2)"  },
  Eligible:  { label: "Đủ điều kiện", color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.2)" },
  Completed: { label: "Hoàn thành",  color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  border: "rgba(96,165,250,0.2)" },
  Failed:    { label: "Thất bại",    color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.2)" },
} as const;