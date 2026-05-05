"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Save } from "lucide-react";
import type { CampaignFormData, TierFormData } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CampaignFormData) => Promise<void>;
  initial?: CampaignFormData | null;
}

const APEX_PREFILL: CampaignFormData = {
  name: "Apex Tháng 4/2026",
  exchange: "APEX",
  description: "Kèo bonus deposit + volume Apex tháng 4",
  startDate: "2026-04-20",
  endDate: "2026-04-30",
  tiers: [
    { label: "Bonus 50$", minDeposit: 50, requiredVolume: 10000, holdTimeHours: 48, bonus: 50, maxSlots: null },
    { label: "Bonus 200$", minDeposit: 1000, requiredVolume: 10000, holdTimeHours: 48, bonus: 200, maxSlots: null },
  ],
};

const EMPTY: CampaignFormData = {
  name: "",
  exchange: "",
  description: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10),
  tiers: [{ label: "", minDeposit: 0, requiredVolume: 0, holdTimeHours: 48, bonus: 0, maxSlots: null }],
};

export default function CampaignForm({ open, onClose, onSubmit, initial }: Props) {
  const [form, setForm] = useState<CampaignFormData>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initial ?? APEX_PREFILL);
  }, [open, initial]);

  if (!open) return null;

  const setField = (k: keyof CampaignFormData, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const setTier = (i: number, k: keyof TierFormData, v: string | number | null) =>
    setForm((f) => {
      const tiers = [...f.tiers];
      tiers[i] = { ...tiers[i], [k]: v };
      return { ...f, tiers };
    });

  const addTier = () =>
    setForm((f) => ({
      ...f,
      tiers: [...f.tiers, { label: "", minDeposit: 0, requiredVolume: 0, holdTimeHours: 48, bonus: 0, maxSlots: null }],
    }));

  const removeTier = (i: number) =>
    setForm((f) => ({ ...f, tiers: f.tiers.filter((_, idx) => idx !== i) }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.exchange.trim()) return;
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "0.5px solid rgba(255,255,255,0.12)",
    borderRadius: 8,
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    padding: "8px 11px",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 4,
    display: "block",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "auto",
        padding: 24,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 620,
          background: "rgba(8,8,16,0.98)",
          border: "0.5px solid rgba(255,255,255,0.1)",
          borderRadius: 18,
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: 0 }}>
              {initial ? "Sửa kèo" : "🎯 Tạo kèo mới"}
            </h2>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "4px 0 0" }}>
              Điền thông tin chiến dịch và các mức thưởng
            </p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Quick fill note */}
        {!initial && (
          <div style={{ padding: "10px 14px", borderRadius: 9, background: "rgba(34,211,238,0.06)", border: "0.5px solid rgba(34,211,238,0.2)", fontSize: 11, color: "rgba(34,211,238,0.7)" }}>
            💡 Đã pre-fill thông tin kèo Apex tháng 4/2026. Thay đổi nếu cần!
          </div>
        )}

        {/* Campaign info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Tên kèo *</label>
            <input style={inputStyle} placeholder="VD: Apex Tháng 4/2026" value={form.name} onChange={(e) => setField("name", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Sàn giao dịch *</label>
            <input style={inputStyle} placeholder="APEX / XT / BITMART..." value={form.exchange} onChange={(e) => setField("exchange", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Mô tả</label>
            <input style={inputStyle} placeholder="Mô tả ngắn về kèo..." value={form.description} onChange={(e) => setField("description", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Ngày bắt đầu</label>
            <input type="date" style={{ ...inputStyle, colorScheme: "dark" }} value={form.startDate} onChange={(e) => setField("startDate", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Ngày kết thúc</label>
            <input type="date" style={{ ...inputStyle, colorScheme: "dark" }} value={form.endDate} onChange={(e) => setField("endDate", e.target.value)} />
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: "0.5px", background: "rgba(255,255,255,0.07)" }} />

        {/* Tiers */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Các mức thưởng (Tiers)</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginLeft: 8 }}>{form.tiers.length} tier</span>
            </div>
            <button
              onClick={addTier}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 11px", borderRadius: 7, fontSize: 11,
                background: "rgba(34,211,238,0.08)",
                border: "0.5px solid rgba(34,211,238,0.3)",
                color: "#22d3ee", cursor: "pointer",
              }}
            >
              <Plus size={11} /> Thêm tier
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {form.tiers.map((tier, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "0.5px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  padding: "14px 16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                    Tier {i + 1}
                    {tier.bonus > 0 && (
                      <span style={{ marginLeft: 8, color: "#fbbf24" }}>· +{tier.bonus} USDT</span>
                    )}
                  </span>
                  {form.tiers.length > 1 && (
                    <button
                      onClick={() => removeTier(i)}
                      style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(248,113,113,0.5)", padding: 2 }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Label</label>
                    <input style={inputStyle} placeholder="VD: Bonus 50$" value={tier.label ?? ""} onChange={(e) => setTier(i, "label", e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Min Deposit (USDT)</label>
                    <input type="number" style={inputStyle} value={tier.minDeposit} onChange={(e) => setTier(i, "minDeposit", parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Bonus (USDT)</label>
                    <input type="number" style={inputStyle} value={tier.bonus} onChange={(e) => setTier(i, "bonus", parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Volume yêu cầu (USDT)</label>
                    <input type="number" style={inputStyle} value={tier.requiredVolume} onChange={(e) => setTier(i, "requiredVolume", parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Thời gian giữ (giờ)</label>
                    <input type="number" style={inputStyle} placeholder="48" value={tier.holdTimeHours} onChange={(e) => setTier(i, "holdTimeHours", parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Max slots (trống = ∞)</label>
                    <input
                      type="number"
                      style={inputStyle}
                      placeholder="Không giới hạn"
                      value={tier.maxSlots ?? ""}
                      onChange={(e) => setTier(i, "maxSlots", e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 9, background: "transparent", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer" }}>
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.name.trim()}
            style={{
              flex: 2, padding: "10px 0", borderRadius: 9,
              background: form.name.trim() ? "linear-gradient(135deg,rgba(34,211,238,0.2),rgba(168,85,247,0.15))" : "rgba(255,255,255,0.04)",
              border: `0.5px solid ${form.name.trim() ? "rgba(34,211,238,0.4)" : "rgba(255,255,255,0.08)"}`,
              color: form.name.trim() ? "#22d3ee" : "rgba(255,255,255,0.2)",
              fontSize: 13, fontWeight: 600,
              cursor: form.name.trim() ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Save size={13} />
            {loading ? "Đang lưu..." : initial ? "Cập nhật kèo" : "Tạo kèo"}
          </button>
        </div>
      </div>
    </div>
  );
}