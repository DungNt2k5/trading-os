import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── Types ─────────────────────────────────────────────────────────────────────

type AIAction =
  | { action: "reply"; message: string }
  | { action: "create_section"; name: string; type: string; icon?: string }
  | {
      action: "create_page";
      title: string;
      content?: string;
      pnl?: number | null;
      amount?: number | null;
      category?: string | null;
      sectionId?: string;
    }
  | {
      action: "create_balance";
      sectionId: string;
      date: string;
      money1: number;
      money2: number;
      note?: string;
    }
  | {
      action: "create_event";
      sectionId: string;
      email: string;
      exchange: string;
      eventCode: string;
      eventName?: string;
      amount?: number;
      status?: string;
      eventDate?: string;
      note?: string;
    };

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(sectionId: string | null): string {
  return `Bạn là AI assistant trong Personal OS — một app quản lý trading, tài chính và ghi chú cá nhân.

Nhiệm vụ: Hiểu ý định người dùng và trả về JSON để thực hiện hành động, hoặc trả lời bằng text.

## Schema JSON hợp lệ (chọn đúng 1 trong các dạng sau):

### Chỉ trả lời:
{ "action": "reply", "message": "nội dung trả lời tự nhiên bằng tiếng Việt" }

### Tạo section mới:
{ "action": "create_section", "name": "Tên section", "type": "trading|expense|finance|general", "icon": "emoji tùy chọn" }

### Tạo page / trade / expense:
{ "action": "create_page", "title": "Tiêu đề", "content": "Nội dung", "pnl": số_hoặc_null, "amount": số_hoặc_null, "category": "danh_mục_hoặc_null", "sectionId": "${sectionId ?? ""}" }

### Thêm số dư tài chính (DailyBalance):
{ "action": "create_balance", "sectionId": "${sectionId ?? ""}", "date": "YYYY-MM-DD", "money1": số, "money2": số, "note": "ghi chú tùy chọn" }

### Thêm sự kiện email/exchange (EmailEvent):
{ "action": "create_event", "sectionId": "${sectionId ?? ""}", "email": "email@example.com", "exchange": "tên_sàn", "eventCode": "mã_sự_kiện", "eventName": "tên tùy chọn", "amount": số_tùy_chọn, "status": "pending|completed|cancelled", "eventDate": "YYYY-MM-DD tùy chọn", "note": "ghi chú tùy chọn" }

## Quy tắc bắt buộc:
- Chỉ trả về JSON thuần, không markdown, không backtick, không giải thích thêm
- Nếu không đủ thông tin để thực hiện action, dùng "reply" để hỏi lại
- Luôn trả lời bằng tiếng Việt trong field "message"
- sectionId hiện tại: ${sectionId ?? "chưa chọn section"}`;
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { message, sectionId } = await req.json();

    // MỚI — dùng Groq
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { action: "reply", message: "⚠️ Chưa cấu hình GROQ_API_KEY." },
        { status: 500 },
      );
    }

    const aiRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          max_tokens: 512,
          messages: [
            { role: "system", content: buildSystemPrompt(sectionId ?? null) },
            { role: "user", content: message },
          ],
        }),
      },
    );

    if (!aiRes.ok) {
      const err = await aiRes.json().catch(() => ({}));
      console.error("Anthropic API error:", err);
      return NextResponse.json({
        action: "reply",
        message: "⚠️ AI tạm thời không khả dụng, thử lại sau.",
      });
    }

    const aiData = await aiRes.json();
    const raw = (aiData?.choices?.[0]?.message?.content ?? "").trim();

    // ── Parse JSON response ──
    let parsed: AIAction;
    try {
      const clean = raw
        .replace(/^```json\s*/i, "")
        .replace(/```$/i, "")
        .trim();
      parsed = JSON.parse(clean) as AIAction;
    } catch {
      // Không parse được JSON → treat as plain reply
      return NextResponse.json({ action: "reply", message: raw });
    }

    // ── Execute actions ──

    if (parsed.action === "reply") {
      return NextResponse.json({ action: "reply", message: parsed.message });
    }

    if (parsed.action === "create_section") {
      const count = await prisma.section.count();
      const section = await prisma.section.create({
        data: {
          name: parsed.name ?? "New Section",
          type: parsed.type ?? "general",
          icon: parsed.icon ?? null,
          order: count,
        },
      });
      return NextResponse.json({
        action: "create_section",
        message: `✅ Đã tạo section **${section.name}**`,
        data: section,
      });
    }

    if (parsed.action === "create_page") {
      const targetSectionId = parsed.sectionId ?? sectionId;
      if (!targetSectionId) {
        return NextResponse.json({
          action: "reply",
          message:
            "Bạn chưa chọn section. Hãy chọn section trước hoặc nói tên section muốn tạo page vào.",
        });
      }
      const page = await prisma.page.create({
        data: {
          title: parsed.title ?? "Untitled",
          content: parsed.content ?? "",
          sectionId: targetSectionId,
          pnl: parsed.pnl ?? null,
          amount: parsed.amount ?? null,
          category: parsed.category ?? null,
        },
      });
      const extra = [
        page.pnl != null ? `PnL: $${page.pnl}` : null,
        page.amount != null ? `Amount: $${page.amount}` : null,
        page.category ? `Category: ${page.category}` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      return NextResponse.json({
        action: "create_page",
        message: `✅ Đã tạo **${page.title}**${extra ? ` — ${extra}` : ""}`,
        data: page,
      });
    }

    if (parsed.action === "create_balance") {
      const targetSectionId = parsed.sectionId ?? sectionId;
      if (!targetSectionId) {
        return NextResponse.json({
          action: "reply",
          message: "Cần chọn section finance trước khi thêm số dư.",
        });
      }
      const money1 = Number(parsed.money1 ?? 0);
      const money2 = Number(parsed.money2 ?? 0);
      const balance = await prisma.dailyBalance.create({
        data: {
          sectionId: targetSectionId,
          date: parsed.date ?? new Date().toISOString().slice(0, 10),
          money1,
          money2,
          total: money1 + money2,
          note: parsed.note ?? null,
        },
      });
      return NextResponse.json({
        action: "create_balance",
        message: `✅ Đã thêm số dư ngày **${balance.date}** — Total: $${balance.total.toLocaleString()}`,
        data: balance,
      });
    }

    if (parsed.action === "create_event") {
      const targetSectionId = parsed.sectionId ?? sectionId;
      if (!targetSectionId) {
        return NextResponse.json({
          action: "reply",
          message: "Cần chọn section finance trước khi thêm sự kiện.",
        });
      }
      const event = await prisma.emailEvent.create({
        data: {
          sectionId: targetSectionId,
          email: parsed.email ?? "",
          exchange: parsed.exchange ?? "",
          eventCode: parsed.eventCode ?? "",
          eventName: parsed.eventName ?? null,
          amount: parsed.amount ? Number(parsed.amount) : null,
          status: parsed.status ?? "pending",
          eventDate: parsed.eventDate ?? null,
          note: parsed.note ?? null,
        },
      });
      return NextResponse.json({
        action: "create_event",
        message: `✅ Đã thêm sự kiện **${event.eventCode}** (${event.exchange})${event.amount ? ` — $${event.amount}` : ""}`,
        data: event,
      });
    }

    // Fallback
    return NextResponse.json({ action: "reply", message: raw });
  } catch (err) {
    console.error("AI route error:", err);
    return NextResponse.json(
      { action: "reply", message: "Có lỗi xảy ra, thử lại sau nhé." },
      { status: 500 },
    );
  }
}
