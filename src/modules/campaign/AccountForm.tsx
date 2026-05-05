"use client";

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import type { AccountFormData, CampaignAccount } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AccountFormData) => Promise<void>;
  initial?: CampaignAccount | null;
}

const EMPTY: AccountFormData = {
  email: "",
  uid: "",
  wallet: "",
  deposit: 0,
  depositTime: "",
  volume: 0,
  note: "",
};

export default function AccountForm({ open, onClose, onSubmit, initial }: Props) {
  const [form, setForm] = useState<AccountFormData>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        email: initial.email,
        uid: initial.uid,
        wallet: initial.wallet,
        deposit: initial.deposit,
        depositTime: initial.depositTime
          ? new Date(initial.depositTime).toISOString().slice(0, 16)
          : "",
        volume: initial.volume,
        note: initial.note ?? "",
      });
    } else {
      setForm(EMPTY);
    }
  }, [initial, open]);

  if (!open) return null;

  const set = (k: keyof AccountFormData, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.email.trim() || !form.uid.trim()) return;
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
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: 480,
          background: "rgba(8,8,16,0.97)",
          border: "0.5px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.9)", margin: 0 }}>
              {initial ? "Sửa tài khoản" : "Thêm tài khoản"}
            </h3>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "3px 0 0" }}>
              Điền thông tin account clone
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.3)",
              padding: 4,
              display: "flex",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Grid 2 cols */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Email *</label>
            <input
              style={inputStyle}
              placeholder="user@example.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>UID *</label>
            <input
              style={inputStyle}
              placeholder="123456789"
              value={form.uid}
              onChange={(e) => set("uid", e.target.value)}
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Wallet Address</label>
            <input
              style={inputStyle}
              placeholder="0x..."
              value={form.wallet}
              onChange={(e) => set("wallet", e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Deposit (USDT)</label>
            <input
              type="number"
              style={inputStyle}
              placeholder="0"
              value={form.deposit}
              onChange={(e) => set("deposit", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label style={labelStyle}>Thời điểm deposit</label>
            <input
              type="datetime-local"
              style={{ ...inputStyle, colorScheme: "dark" }}
              value={form.depositTime}
              onChange={(e) => set("depositTime", e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Volume đã trade (USDT)</label>
            <input
              type="number"
              style={inputStyle}
              placeholder="0"
              value={form.volume}
              onChange={(e) => set("volume", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label style={labelStyle}>Ghi chú</label>
            <input
              style={inputStyle}
              placeholder="VD: Sub acc 1..."
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 9,
              background: "transparent",
              border: "0.5px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.4)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.email.trim()}
            style={{
              flex: 2,
              padding: "9px 0",
              borderRadius: 9,
              background:
                form.email.trim()
                  ? "linear-gradient(135deg,rgba(34,211,238,0.2),rgba(168,85,247,0.15))"
                  : "rgba(255,255,255,0.04)",
              border: `0.5px solid ${form.email.trim() ? "rgba(34,211,238,0.4)" : "rgba(255,255,255,0.08)"}`,
              color: form.email.trim() ? "#22d3ee" : "rgba(255,255,255,0.2)",
              fontSize: 13,
              fontWeight: 600,
              cursor: form.email.trim() ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Save size={13} />
            {loading ? "Đang lưu..." : initial ? "Cập nhật" : "Thêm account"}
          </button>
        </div>
      </div>
    </div>
  );
}