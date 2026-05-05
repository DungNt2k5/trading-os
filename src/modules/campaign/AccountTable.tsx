"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Pencil,
  Trash2,
  RefreshCw,
} from "lucide-react";
import type { Campaign, CampaignAccount, CampaignTier, AccountRow } from "./types";
import {
  getMatchedTier,
  getTimeLeft,
  getVolumeProgress,
  getAccountStatus,
  formatCountdown,
  fmtMoney,
  STATUS_CONFIG,
} from "./campaignLogic";
import AccountForm from "./AccountForm";
import type { AccountFormData } from "./types";

interface Props {
  campaign: Campaign;
  accounts: CampaignAccount[];
  tiers: CampaignTier[];
  onAccountsChange: () => void;
}

// ── Inline editable number cell ───────────────────────────────────────────────
function InlineNumber({
  value,
  onCommit,
  color = "#22d3ee",
}: {
  value: number;
  onCommit: (v: number) => void;
  color?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);
  useEffect(() => {
    if (!editing) setVal(String(value));
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    const n = parseFloat(val);
    if (!isNaN(n) && n !== value) onCommit(n);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setEditing(false); setVal(String(value)); }
        }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 80,
          background: `${color}12`,
          border: `0.5px solid ${color}50`,
          borderRadius: 5,
          color,
          fontSize: 12,
          padding: "2px 6px",
          outline: "none",
          fontFamily: "monospace",
        }}
      />
    );
  }

  return (
    <span
      onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
      title="Double-click để sửa"
      style={{
        fontFamily: "monospace",
        fontWeight: 600,
        fontSize: 12,
        color,
        cursor: "default",
        userSelect: "none",
        borderBottom: `1px dashed ${color}30`,
      }}
    >
      {fmtMoney(value)}
    </span>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          flex: 1,
          height: 5,
          borderRadius: 3,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 3,
            boxShadow: `0 0 6px ${color}80`,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", minWidth: 28 }}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: AccountRow["status"] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 10,
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        border: `0.5px solid ${cfg.border}`,
        borderRadius: 5,
        padding: "2px 8px",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: cfg.color,
          boxShadow: `0 0 5px ${cfg.color}`,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
}

// ── Live countdown cell (ticks every second) ─────────────────────────────────
function CountdownCell({ depositTime, holdTime }: { depositTime: string | null; holdTime: number | null }) {
  const [secs, setSecs] = useState(() =>
    (holdTime !== null && depositTime) ? getTimeLeft(depositTime, holdTime) : 0
  );

  useEffect(() => {
    if (holdTime === null || !depositTime) return;
    const tick = () => {
      if (depositTime && holdTime !== null) {
        setSecs(getTimeLeft(depositTime, holdTime));
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [depositTime, holdTime]);

  if (holdTime === null || !depositTime) {
    return <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>—</span>;
  }

  const color = secs <= 0 ? "#f87171" : secs < 3600 ? "#fbbf24" : "#34d399";
  return (
    <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 600, color }}>
      {formatCountdown(secs)}
    </span>
  );
}

// ── Main Table ────────────────────────────────────────────────────────────────
export default function AccountTable({ campaign, accounts, tiers, onAccountsChange }: Props) {
  const [editTarget, setEditTarget] = useState<CampaignAccount | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const computedRows: AccountRow[] = accounts.map((acc) => {
    const tier = getMatchedTier(acc, tiers);
    const timeLeft = (tier && acc.depositTime) ? getTimeLeft(acc.depositTime, tier.holdTime) : 0;
    const volumeProgress = tier ? getVolumeProgress(acc.volume, tier.requiredVolume) : 0;
    const status = getAccountStatus(acc, tiers, campaign);
    return { ...acc, matchedTier: tier, status, timeLeft, volumeProgress };
  });

  const patchAccount = useCallback(
    async (accountId: string, data: Partial<{ deposit: number; volume: number }>) => {
      await fetch(`/api/campaign/${campaign.id}/accounts/${accountId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      onAccountsChange();
    },
    [campaign.id, onAccountsChange]
  );

  const handleDelete = async (accountId: string) => {
    if (!confirm("Xóa account này?")) return;
    await fetch(`/api/campaign/${campaign.id}/accounts/${accountId}`, {
      method: "DELETE",
    });
    onAccountsChange();
  };

  const handleEdit = async (data: AccountFormData) => {
    if (!editTarget) return;
    await fetch(`/api/campaign/${campaign.id}/accounts/${editTarget.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        depositTime: data.depositTime || null,
      }),
    });
    onAccountsChange();
  };

  const thStyle: React.CSSProperties = {
    padding: "8px 10px",
    fontSize: 10,
    fontWeight: 600,
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    textAlign: "left",
    borderBottom: "0.5px solid rgba(255,255,255,0.08)",
    background: "rgba(8,8,14,0.97)",
    whiteSpace: "nowrap",
    position: "sticky",
    top: 0,
    zIndex: 5,
  };

  // Summary stats
  const statusCounts = computedRows.reduce(
    (acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; },
    {} as Record<string, number>
  );
  const totalDeposit = accounts.reduce((s, a) => s + a.deposit, 0);
  const totalBonus = computedRows.reduce(
    (s, r) => s + (r.matchedTier?.bonus ?? 0), 0
  );

  return (
    <div>
      {/* Summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Tổng accounts", value: String(accounts.length), color: "#a855f7" },
          { label: "Đủ ĐK", value: String(statusCounts.Eligible ?? 0), color: "#34d399" },
          { label: "Hoàn thành", value: String(statusCounts.Completed ?? 0), color: "#60a5fa" },
          { label: "Tổng deposit", value: fmtMoney(totalDeposit), color: "#22d3ee" },
          { label: "Bonus tiềm năng", value: fmtMoney(totalBonus), color: "#fbbf24" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: `${s.color}08`,
              border: `0.5px solid ${s.color}25`,
            }}
          >
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div
        style={{
          borderRadius: 12,
          border: "0.5px solid rgba(255,255,255,0.08)",
          overflow: "auto",
          maxHeight: "60vh",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 900 }}>
          <thead>
            <tr>
              {["#", "Email", "UID", "Wallet", "Deposit", "Tier phù hợp", "Volume", "Tiến độ", "Countdown", "Trạng thái", ""].map(
                (h, i) => (
                  <th key={i} style={{ ...thStyle, textAlign: i === 0 ? "center" : "left" }}>
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {computedRows.length === 0 && (
              <tr>
                <td
                  colSpan={11}
                  style={{
                    textAlign: "center",
                    padding: 48,
                    color: "rgba(255,255,255,0.15)",
                    fontSize: 13,
                  }}
                >
                  Chưa có account nào. Nhấn "Thêm tài khoản" để bắt đầu!
                </td>
              </tr>
            )}
            {computedRows.map((row, i) => (
              <tr
                key={row.id}
                style={{
                  borderBottom: "0.5px solid rgba(255,255,255,0.04)",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "transparent")
                }
              >
                {/* # */}
                <td style={{ padding: "8px 10px", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 11 }}>
                  {i + 1}
                </td>

                {/* Email */}
                <td style={{ padding: "8px 10px", color: "rgba(255,255,255,0.75)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row.email}
                </td>

                {/* UID */}
                <td style={{ padding: "8px 10px", color: "rgba(255,255,255,0.45)", fontFamily: "monospace", fontSize: 11 }}>
                  {row.uid}
                </td>

                {/* Wallet */}
                <td style={{ padding: "8px 10px", color: "rgba(255,255,255,0.3)", fontFamily: "monospace", fontSize: 10, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {row.wallet || "—"}
                </td>

                {/* Deposit — inline edit */}
                <td style={{ padding: "8px 10px" }}>
                  <InlineNumber
                    value={row.deposit}
                    color="#22d3ee"
                    onCommit={(v) => patchAccount(row.id, { deposit: v })}
                  />
                </td>

                {/* Matched tier */}
                <td style={{ padding: "8px 10px" }}>
                  {row.matchedTier ? (
                    <span style={{ fontSize: 11, color: "#fbbf24", background: "rgba(251,191,36,0.1)", border: "0.5px solid rgba(251,191,36,0.3)", borderRadius: 5, padding: "2px 8px", whiteSpace: "nowrap" }}>
                      {row.matchedTier.label ?? `${fmtMoney(row.matchedTier.bonus)}$ Bonus`}
                    </span>
                  ) : (
                    <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>
                  )}
                </td>

                {/* Volume — inline edit */}
                <td style={{ padding: "8px 10px" }}>
                  <InlineNumber
                    value={row.volume}
                    color="#a855f7"
                    onCommit={(v) => patchAccount(row.id, { volume: v })}
                  />
                  {row.matchedTier && (
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 1 }}>
                      / {fmtMoney(row.matchedTier.requiredVolume)}
                    </div>
                  )}
                </td>

                {/* Progress */}
                <td style={{ padding: "8px 10px", minWidth: 100 }}>
                  {row.matchedTier ? (
                    <ProgressBar
                      pct={row.volumeProgress}
                      color={
                        row.volumeProgress >= 100 ? "#34d399" :
                        row.volumeProgress >= 50 ? "#fbbf24" : "#f87171"
                      }
                    />
                  ) : (
                    <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 11 }}>—</span>
                  )}
                </td>

                {/* Countdown */}
                <td style={{ padding: "8px 10px" }}>
                  <CountdownCell
                    depositTime={row.depositTime}
                    holdTime={row.matchedTier?.holdTime ?? null}
                  />
                </td>

                {/* Status */}
                <td style={{ padding: "8px 10px" }}>
                  <StatusBadge status={row.status} />
                </td>

                {/* Actions */}
                <td style={{ padding: "8px 8px", whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", gap: 4, opacity: 0 }} className="row-acts">
                    <button
                      onClick={() => { setEditTarget(row); setFormOpen(true); }}
                      style={{ background: "rgba(34,211,238,0.08)", border: "0.5px solid rgba(34,211,238,0.2)", borderRadius: 6, color: "#22d3ee", cursor: "pointer", padding: "4px 8px", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}
                    >
                      <Pencil size={10} /> Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(row.id)}
                      style={{ background: "rgba(248,113,113,0.08)", border: "0.5px solid rgba(248,113,113,0.2)", borderRadius: 6, color: "#f87171", cursor: "pointer", padding: "4px 8px", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        tr:hover .row-acts { opacity: 1 !important; }
      `}</style>

      <AccountForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        onSubmit={handleEdit}
        initial={editTarget}
      />
    </div>
  );
}