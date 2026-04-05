import type { Config } from "@netlify/functions";

export const config: Config = {
  path: "/api/telegram-notify",
};

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(req),
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders(req, "application/json"),
    });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN || (typeof Netlify !== 'undefined' && Netlify.env ? Netlify.env.get("TELEGRAM_BOT_TOKEN") : undefined);
  const chatId = process.env.TELEGRAM_CHAT_ID || (typeof Netlify !== 'undefined' && Netlify.env ? Netlify.env.get("TELEGRAM_CHAT_ID") : undefined);

  if (!botToken || !chatId) {
    console.error("[telegram-notify] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    return new Response(
      JSON.stringify({ error: "Telegram bot not configured" }),
      { status: 500, headers: corsHeaders(req, "application/json") }
    );
  }

  try {
    const body = await req.json();
    const { customerName, tryoutName, amount, reference, timestamp } = body;

    const message = [
      `<b>💰 PEMBAYARAN BARU</b>`,
      ``,
      `<b>👤 Nama:</b> ${escapeHtml(customerName || "N/A")}`,
      `<b>📝 Try Out:</b> ${escapeHtml(tryoutName || "N/A")}`,
      `<b>💵 Jumlah:</b> Rp ${Number(amount || 0).toLocaleString("id-ID")}`,
      `<b>🔖 Referensi:</b> <code>${escapeHtml(reference || "N/A")}</code>`,
      `<b>🕐 Waktu:</b> ${escapeHtml(timestamp || new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }))}`,
      ``,
      `<i>⏳ Menunggu konfirmasi admin...</i>`,
    ].join("\n");

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const telegramRes = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!telegramRes.ok) {
      const errData = await telegramRes.text();
      console.error("[telegram-notify] Telegram API error:", errData);
      return new Response(
        JSON.stringify({ error: "Failed to send Telegram notification", details: errData }),
        { status: 502, headers: corsHeaders(req, "application/json") }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders(req, "application/json"),
    });
  } catch (err: any) {
    console.error("[telegram-notify] Error:", err.message);
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: err.message }),
      { status: 500, headers: corsHeaders(req, "application/json") }
    );
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function corsHeaders(req?: Request, contentType?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  
  if (req) {
    const origin = req.headers.get("origin") || req.headers.get("Origin");
    const allowedOrigins = [
      "https://kelasasn.id",
      "https://www.kelasasn.id",
      "https://kelasasn.netlify.app",
      "http://localhost:5173"
    ];
    
    if (origin && allowedOrigins.includes(origin)) {
      headers["Access-Control-Allow-Origin"] = origin;
    } else {
      headers["Access-Control-Allow-Origin"] = "https://kelasasn.id";
    }
  } else {
    headers["Access-Control-Allow-Origin"] = "https://kelasasn.id";
  }

  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  return headers;
}
