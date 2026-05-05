"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Plus, UserPlus, RefreshCw, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Campaign, CampaignAccount, AccountFormData, CampaignFormData } from "./types";
import { getExchangeColor, fmtMoney } from "./campaignLogic";
import AccountTable from "./AccountTable";
import AccountForm from "./AccountForm";
import CampaignForm from "./CampaignForm";

interface Props {
  campaignId: string;
}

export default function CampaignDetail({ campaignId }: Props) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchCampaign = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/campaign/${campaignId}`);
      const data = await res.json();
      setCampaign(data);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign, refreshKey]);

  const handleAddAccount = async (data: AccountFormData) => {
    await fetch(`/api/campaign/${campaignId}/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, depositTime: data.depositTime || null }),
    });
    setRefreshKey((k) => k + 1);
  };

  const handleEditCampaign = async (data: CampaignFormData) => {
    await fetch(`/api/campaign/${campaignId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        tiers: data.tiers.map((t) => ({
          ...t,
          holdTime: Math.round(t.holdTimeHours * 3600), // hours → seconds
        })),
      }),
    });
    setRefreshKey((k) => k + 1);
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
        Đang tải...
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, height: "100%" }}>
        <div style={{ fontSize: 36, opacity: 0.1 }}>🎯</div>
        <p style={{ color: "rgba(255,255,255,0.2)" }}>Không tìm thấy campaign</p>
        <button onClick={() => router.push("/campaign")} style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(34,211,238,0.1)", border: "0.5px solid rgba(34,211,238,0.3)", color: "#22d3ee", cursor: "pointer", fontSize: 13 }}>
          ← Quay lại
        </button>
      </div>
    );
  }

  const exColor = getExchangeColor(campaign.exchange);
  const now = new Date();
  const endDate = new Date(campaign.endDate);
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / 86400_000);

  const campaignFormInitial: CampaignFormData = {
    name: campaign.name,
    exchange: campaign.exchange,
    description: campaign.description ?? "",
    startDate: campaign.startDate.slice(0, 10),
    endDate: campaign.endDate.slice(0, 10),
    tiers: campaign.tiers.map((t) => ({
      label: t.label ?? "",
      minDeposit: t.minDeposit,
      requiredVolume: t.requiredVolume,
      holdTimeHours: t.holdTime / 3600,
      bonus: t.bonus,
      maxSlots: t.maxSlots,
    })),
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px 16px", borderBottom: "0.5px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
          <button
            onClick={() => router.push("/campaign")}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: "4px 8px", display: "flex", alignItems: "center", gap: 5, fontSize: 12, borderRadius: 6 }}
          >
            <ArrowLeft size={13} /> Kèo
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: exColor, background: `${exColor}18`, border: `0.5px solid ${exColor}40`, borderRadius: 6, padding: "3px 10px" }}>
                {campaign.exchange}
              </span>
              <span style={{ fontSize: 11, color: daysLeft > 0 ? "#34d399" : "#f87171", background: daysLeft > 0 ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", border: `0.5px solid ${daysLeft > 0 ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`, borderRadius: 5, padding: "2px 8px" }}>
                {daysLeft > 0 ? `Còn ${daysLeft} ngày` : "Đã kết thúc"}
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "rgba(255,255,255,0.92)", margin: "0 0 4px", background: `linear-gradient(135deg,#fff,${exColor})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {campaign.name}
            </h1>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>
              {new Date(campaign.startDate).toLocaleDateString("vi-VN")} → {new Date(campaign.endDate).toLocaleDateString("vi-VN")}
              {campaign.description && ` · ${campaign.description}`}
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => setEditOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.55)", cursor: "pointer" }}
            >
              <Pencil size={12} /> Sửa kèo
            </button>
            <button
              onClick={() => setAddOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: `linear-gradient(135deg,${exColor}25,rgba(168,85,247,0.15))`, border: `0.5px solid ${exColor}50`, color: exColor, cursor: "pointer" }}
            >
              <UserPlus size={13} /> Thêm tài khoản
            </button>
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 8, fontSize: 12, background: "transparent", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}
            >
              <RefreshCw size={12} />
            </button>
          </div>
        </div>

        {/* Tier summary table */}
        {campaign.tiers.length > 0 && (
          <div style={{ marginTop: 16, borderRadius: 10, border: "0.5px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "rgba(0,0,0,0.3)" }}>
                  {["Label", "Min Deposit", "Volume yêu cầu", "Giữ (giờ)", "Bonus", "Max slots"].map((h) => (
                    <th key={h} style={{ padding: "7px 12px", textAlign: "left", fontWeight: 600, color: "rgba(255,255,255,0.3)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaign.tiers
                  .slice()
                  .sort((a, b) => a.minDeposit - b.minDeposit)
                  .map((tier, i) => (
                    <tr key={tier.id} style={{ borderTop: "0.5px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "7px 12px", color: "#fbbf24", fontWeight: 600 }}>
                        {tier.label ?? `Tier ${i + 1}`}
                      </td>
                      <td style={{ padding: "7px 12px", fontFamily: "monospace", color: "#22d3ee" }}>
                        ${fmtMoney(tier.minDeposit)}
                      </td>
                      <td style={{ padding: "7px 12px", fontFamily: "monospace", color: "rgba(255,255,255,0.6)" }}>
                        ${fmtMoney(tier.requiredVolume)}
                      </td>
                      <td style={{ padding: "7px 12px", color: "rgba(255,255,255,0.5)" }}>
                        {tier.holdTime / 3600}h
                      </td>
                      <td style={{ padding: "7px 12px", fontFamily: "monospace", fontWeight: 700, color: "#34d399" }}>
                        +${tier.bonus}
                      </td>
                      <td style={{ padding: "7px 12px", color: "rgba(255,255,255,0.3)" }}>
                        {tier.maxSlots ?? "∞"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Account table */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        <AccountTable
          campaign={campaign}
          accounts={campaign.accounts}
          tiers={campaign.tiers}
          onAccountsChange={() => setRefreshKey((k) => k + 1)}
        />
      </div>

      <AccountForm
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddAccount}
      />

      <CampaignForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditCampaign}
        initial={campaignFormInitial}
      />
    </div>
  );
}