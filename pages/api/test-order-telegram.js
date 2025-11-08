// /pages/api/test-order-telegram.js
export default async function handler(req, res) {
  try {
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const base = process.env.URL_BASE || `https://${host}`;

    // dados fake ou vindos do body
    const {
      customer_name = "Cliente Teste",
      customer_phone = "+55 31 98485-3327",
      address = "Rua das Acácias, 123 - Centro",
      note = "Sem granola, pouco leite condensado",
      items = "Açaí 500ml (1x), Morango (1x)",
      payment = "PIX",
      total = "24,90"
    } = req.body || {};

    const text =
      `<b>🍇 Roxo Sabor</b>\n` +
      `<b>🟣 Novo pedido APROVADO!</b> ✅\n\n` +
      `<b>👤 Cliente:</b> ${customer_name}\n` +
      `<b>📞 WhatsApp:</b> ${customer_phone}\n` +
      (address ? `<b>📍 Endereço:</b> ${address}\n` : "") +
      (note ? `<b>📝 Observação:</b> ${note}\n` : "") +
      `<b>📦 Itens:</b> ${items}\n` +
      `<b>💳 Pagamento:</b> ${payment}\n` +
      `<b>💰 Total:</b> R$ ${total}`;

    const r = await fetch(`${base}/api/send-telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const data = await r.json();
    return res.status(r.ok ? 200 : 500).json(data);
  } catch (e) {
    console.error("test-order-telegram error:", e);
    return res.status(500).json({ error: "Erro interno" });
  }
}
