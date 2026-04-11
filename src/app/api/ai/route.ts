import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { message, sectionId } = await req.json();

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const token = process.env.CLOUDFLARE_AI_TOKEN;

    if (!accountId || !token) {
      return NextResponse.json(
        { error: "Thiếu CLOUDFLARE_ACCOUNT_ID hoặc CLOUDFLARE_AI_TOKEN." },
        { status: 500 },
      );
    }

    const systemPrompt = `Bạn là AI assistant trong Personal OS app.
Bạn có thể thực hiện các hành động sau bằng cách trả về JSON:
- Tạo section: { "action": "create_section", "name": "...", "type": "trading|expense|general|custom" }
- Tạo page: { "action": "create_page", "title": "...", "content": "...", "pnl": number|null, "amount": number|null, "category": "...|null", "sectionId": "..." }
- Chỉ trả lời: { "action": "reply", "message": "..." }

Nếu user nói "tạo section trading" → create_section type trading.
Nếu user nói "thêm trade BTC pnl 50" → create_page với pnl=50 category="BTC".
Nếu user nói "log expense 100 food" → create_page amount=100 category="food".
Luôn trả về JSON hợp lệ, không có markdown hay backtick.
Current sectionId context: ${sectionId ?? "none"}`;

    const aiRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      },
    );

    const aiData = await aiRes.json();
    if (!aiRes.ok) {
      return NextResponse.json({
        action: "reply",
        message: `⚠️ Cloudflare AI lỗi: ${aiData?.errors?.[0]?.message ?? "Unknown error"}`,
      });
    }

    const raw = (aiData?.result?.response ?? "").trim();

    let parsed: Record<string, unknown>;
    try {
      const clean = raw.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json({ action: "reply", message: raw });
    }

    if (parsed.action === "create_section") {
      const sections = await prisma.section.findMany();
      const section = await prisma.section.create({
        data: {
          name: String(parsed.name ?? "New Section"),
          type: String(parsed.type ?? "general"),
          order: sections.length,
        },
      });
      return NextResponse.json({
        action: "create_section",
        message: `✅ Đã tạo section **${section.name}** (${section.type})`,
        data: section,
      });
    }

    if (parsed.action === "create_page") {
      const targetSectionId = String(parsed.sectionId ?? sectionId ?? "");
      if (!targetSectionId) {
        return NextResponse.json({
          action: "reply",
          message: "⚠️ Vui lòng chọn section trước khi tạo page.",
        });
      }
      const page = await prisma.page.create({
        data: {
          title: String(parsed.title ?? "Untitled"),
          content: String(parsed.content ?? ""),
          sectionId: targetSectionId,
          pnl: parsed.pnl != null ? Number(parsed.pnl) : null,
          amount: parsed.amount != null ? Number(parsed.amount) : null,
          category: parsed.category ? String(parsed.category) : null,
        },
      });
      return NextResponse.json({
        action: "create_page",
        message: `✅ Đã tạo page **${page.title}**${page.pnl != null ? ` | PnL: $${page.pnl}` : ""}${page.amount != null ? ` | Amount: $${page.amount}` : ""}`,
        data: page,
      });
    }

    return NextResponse.json({ action: "reply", message: raw });
  } catch (err) {
    console.error("AI route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
