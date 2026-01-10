// /pages/api/send-telegram.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const defaultChatId = process.env.TELEGRAM_CHAT_ID;
    const { text, chat_id, parse_mode = "HTML" } = req.body || {};

    if (!token) return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN ausente" });
    if (!(text && (chat_id || defaultChatId))) {
      return res.status(400).json({ error: "Envie { text } e tenha TELEGRAM_CHAT_ID configurado" });
    }

    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat_id || defaultChatId,
        text,
        parse_mode,                 // "HTML" é simples (evita problemas de escape)
        disable_web_page_preview: true
      })
    });

    const data = await r.json();
    if (!r.ok || !data.ok) {
      console.error("Telegram send error:", data);
      return res.status(500).json({ error: "Falha ao enviar Telegram", details: data });
    }
    return res.status(200).json({ ok: true, result: data.result });
  } catch (e) {
    console.error("send-telegram error:", e);
    return res.status(500).json({ error: "Erro interno" });
  }
}
