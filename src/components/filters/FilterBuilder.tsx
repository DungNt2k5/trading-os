"use client";

import { useState } from "react";
import { Plus, X, Filter, ChevronDown } from "lucide-react";
import { Page } from "@/store/useAppStore";

// ── Types ─────────────────────────────────────────────────────────────────────

export type FilterField =
  | "title"
  | "status"
  | "category"
  | "pnl"
  | "amount"
  | "tags"
  | "createdAt";

export type FilterOperator =
  | "contains"
  | "not_contains"
  | "equals"
  | "not_equals"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "is_empty"
  | "is_not_empty";

export interface FilterRule {
  id: string;
  field: FilterField;
  operator: FilterOperator;
  value: string;
}

export interface FilterGroup {
  logic: "AND" | "OR";
  rules: FilterRule[];
}

interface FilterBuilderProps {
  sectionType?: string;
  value: FilterGroup;
  onChange: (group: FilterGroup) => void;
  onClose?: () => void;
}

// ── Config ────────────────────────────────────────────────────────────────────

const FIELD_CONFIG: Record<
  FilterField,
  {
    label: string;
    type: "text" | "number" | "date" | "select";
    options?: string[];
  }
> = {
  title: { label: "Tên", type: "text" },
  status: {
    label: "Trạng thái",
    type: "select",
    options: ["active", "archived", "done", "draft", "in-progress"],
  },
  category: { label: "Category", type: "text" },
  pnl: { label: "PnL", type: "number" },
  amount: { label: "Số tiền", type: "number" },
  tags: { label: "Tags", type: "text" },
  createdAt: { label: "Ngày tạo", type: "date" },
};

const OPERATORS_FOR: Record<string, FilterOperator[]> = {
  text: [
    "contains",
    "not_contains",
    "equals",
    "not_equals",
    "is_empty",
    "is_not_empty",
  ],
  number: [
    "equals",
    "not_equals",
    "gt",
    "gte",
    "lt",
    "lte",
    "is_empty",
    "is_not_empty",
  ],
  date: ["equals", "gt", "gte", "lt", "lte"],
  select: ["equals", "not_equals", "is_empty", "is_not_empty"],
};

const OPERATOR_LABEL: Record<FilterOperator, string> = {
  contains: "chứa",
  not_contains: "không chứa",
  equals: "bằng",
  not_equals: "không bằng",
  gt: ">",
  lt: "<",
  gte: ">=",
  lte: "<=",
  is_empty: "trống",
  is_not_empty: "không trống",
};

const NO_VALUE_OPS: FilterOperator[] = ["is_empty", "is_not_empty"];

// ── Apply filter logic (exported for use in views) ────────────────────────────

export function applyFilters(pages: Page[], group: FilterGroup): Page[] {
  if (!group.rules.length) return pages;

  return pages.filter((page) => {
    const results = group.rules.map((rule) => matchRule(page, rule));
    return group.logic === "AND"
      ? results.every(Boolean)
      : results.some(Boolean);
  });
}

function matchRule(page: Page, rule: FilterRule): boolean {
  const { field, operator, value } = rule;

  // Get raw cell value
  let raw: unknown;
  if (field === "tags") {
    raw = page.tags?.map((pt) => pt.tag.name).join(", ") ?? "";
  } else {
    raw = page[field as keyof Page];
  }

  const strVal = String(raw ?? "").toLowerCase();
  const filterVal = value.toLowerCase().trim();
  const numRaw = parseFloat(String(raw ?? ""));
  const numFilter = parseFloat(filterVal);

  switch (operator) {
    case "is_empty":
      return raw === null || raw === undefined || strVal === "";
    case "is_not_empty":
      return raw !== null && raw !== undefined && strVal !== "";
    case "contains":
      return strVal.includes(filterVal);
    case "not_contains":
      return !strVal.includes(filterVal);
    case "equals":
      return strVal === filterVal;
    case "not_equals":
      return strVal !== filterVal;
    case "gt":
      return !isNaN(numRaw) && numRaw > numFilter;
    case "gte":
      return !isNaN(numRaw) && numRaw >= numFilter;
    case "lt":
      return !isNaN(numRaw) && numRaw < numFilter;
    case "lte":
      return !isNaN(numRaw) && numRaw <= numFilter;
    default:
      return true;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 8);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NeonSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: "none",
          background: "rgba(255,255,255,0.04)",
          border: "0.5px solid rgba(255,255,255,0.1)",
          borderRadius: 6,
          color: "rgba(255,255,255,0.7)",
          fontSize: 12,
          padding: "4px 24px 4px 8px",
          cursor: "pointer",
          outline: "none",
        }}
      >
        {options.map((o) => (
          <option
            key={o.value}
            value={o.value}
            style={{ background: "#0a0a0f" }}
          >
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={11}
        style={{
          position: "absolute",
          right: 6,
          color: "rgba(255,255,255,0.3)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function FilterBuilder({
  sectionType,
  value,
  onChange,
  onClose,
}: FilterBuilderProps) {
  const allFields = Object.keys(FIELD_CONFIG) as FilterField[];

  // Chỉ show pnl nếu trading, amount nếu expense
  const fields = allFields.filter((f) => {
    if (f === "pnl" && sectionType !== "trading") return false;
    if (f === "amount" && sectionType !== "expense") return false;
    return true;
  });

  const addRule = () => {
    const defaultField: FilterField = "title";
    onChange({
      ...value,
      rules: [
        ...value.rules,
        { id: uid(), field: defaultField, operator: "contains", value: "" },
      ],
    });
  };

  const removeRule = (id: string) => {
    onChange({ ...value, rules: value.rules.filter((r) => r.id !== id) });
  };

  const updateRule = (id: string, patch: Partial<FilterRule>) => {
    onChange({
      ...value,
      rules: value.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });
  };

  const clearAll = () => onChange({ ...value, rules: [] });

  return (
    <div
      style={{
        background: "rgba(10,10,18,0.97)",
        border: "0.5px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        padding: 16,
        minWidth: 480,
        maxWidth: 600,
        boxShadow:
          "0 16px 40px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(34,211,238,0.06)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Filter size={13} style={{ color: "rgba(34,211,238,0.6)" }} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            Bộ lọc
          </span>
          {value.rules.length > 0 && (
            <span
              style={{
                fontSize: 10,
                background: "rgba(34,211,238,0.15)",
                color: "#22d3ee",
                border: "0.5px solid rgba(34,211,238,0.3)",
                borderRadius: 10,
                padding: "1px 7px",
              }}
            >
              {value.rules.length}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* AND / OR toggle */}
          <div style={{ display: "flex", gap: 2 }}>
            {(["AND", "OR"] as const).map((l) => (
              <button
                key={l}
                onClick={() => onChange({ ...value, logic: l })}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "3px 9px",
                  borderRadius: 5,
                  border: "0.5px solid",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  borderColor:
                    value.logic === l
                      ? "rgba(34,211,238,0.4)"
                      : "rgba(255,255,255,0.08)",
                  background:
                    value.logic === l ? "rgba(34,211,238,0.12)" : "transparent",
                  color:
                    value.logic === l ? "#22d3ee" : "rgba(255,255,255,0.3)",
                  letterSpacing: "0.06em",
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {value.rules.length > 0 && (
            <button
              onClick={clearAll}
              style={{
                fontSize: 11,
                color: "rgba(239,68,68,0.5)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "2px 6px",
              }}
            >
              Xóa hết
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              style={{
                color: "rgba(255,255,255,0.3)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                padding: 2,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Rules */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {value.rules.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "20px 0",
              color: "rgba(255,255,255,0.2)",
              fontSize: 12,
            }}
          >
            Chưa có bộ lọc. Nhấn "+ Thêm điều kiện" để bắt đầu.
          </div>
        )}

        {value.rules.map((rule, idx) => {
          const fieldCfg = FIELD_CONFIG[rule.field];
          const ops = OPERATORS_FOR[fieldCfg.type];
          const noValue = NO_VALUE_OPS.includes(rule.operator);

          return (
            <div
              key={rule.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 10px",
                background: "rgba(255,255,255,0.03)",
                border: "0.5px solid rgba(255,255,255,0.07)",
                borderRadius: 8,
              }}
            >
              {/* Logic label */}
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.2)",
                  width: 24,
                  textAlign: "right",
                  flexShrink: 0,
                  letterSpacing: "0.06em",
                }}
              >
                {idx === 0 ? "KHI" : value.logic}
              </span>

              {/* Field */}
              <NeonSelect
                value={rule.field}
                onChange={(v) =>
                  updateRule(rule.id, {
                    field: v as FilterField,
                    operator: "contains",
                    value: "",
                  })
                }
                options={fields.map((f) => ({
                  value: f,
                  label: FIELD_CONFIG[f].label,
                }))}
              />

              {/* Operator */}
              <NeonSelect
                value={rule.operator}
                onChange={(v) =>
                  updateRule(rule.id, { operator: v as FilterOperator })
                }
                options={ops.map((o) => ({
                  value: o,
                  label: OPERATOR_LABEL[o],
                }))}
              />

              {/* Value */}
              {!noValue && (
                <>
                  {fieldCfg.type === "select" ? (
                    <NeonSelect
                      value={rule.value}
                      onChange={(v) => updateRule(rule.id, { value: v })}
                      options={[
                        { value: "", label: "Chọn..." },
                        ...(fieldCfg.options ?? []).map((o) => ({
                          value: o,
                          label: o,
                        })),
                      ]}
                    />
                  ) : (
                    <input
                      type={
                        fieldCfg.type === "number"
                          ? "number"
                          : fieldCfg.type === "date"
                            ? "date"
                            : "text"
                      }
                      value={rule.value}
                      onChange={(e) =>
                        updateRule(rule.id, { value: e.target.value })
                      }
                      placeholder="Giá trị..."
                      style={{
                        flex: 1,
                        background: "rgba(255,255,255,0.04)",
                        border: "0.5px solid rgba(255,255,255,0.1)",
                        borderRadius: 6,
                        color: "rgba(255,255,255,0.75)",
                        fontSize: 12,
                        padding: "4px 9px",
                        outline: "none",
                        minWidth: 0,
                      }}
                    />
                  )}
                </>
              )}

              {/* Remove */}
              <button
                onClick={() => removeRule(rule.id)}
                style={{
                  color: "rgba(255,255,255,0.2)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  flexShrink: 0,
                  padding: 2,
                  marginLeft: "auto",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color =
                    "rgba(239,68,68,0.7)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color =
                    "rgba(255,255,255,0.2)")
                }
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add rule */}
      <button
        onClick={addRule}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginTop: 10,
          fontSize: 12,
          color: "rgba(34,211,238,0.6)",
          background: "transparent",
          border: "0.5px dashed rgba(34,211,238,0.2)",
          borderRadius: 7,
          padding: "6px 12px",
          cursor: "pointer",
          width: "100%",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor =
            "rgba(34,211,238,0.5)";
          (e.currentTarget as HTMLElement).style.color = "#22d3ee";
          (e.currentTarget as HTMLElement).style.background =
            "rgba(34,211,238,0.05)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor =
            "rgba(34,211,238,0.2)";
          (e.currentTarget as HTMLElement).style.color = "rgba(34,211,238,0.6)";
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        <Plus size={13} />
        Thêm điều kiện
      </button>
    </div>
  );
}
