// /pages/api/mp-webhook.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");
  try {
    // (opcional) checagem de secret
    const secret = req.query?.secret;
    if (process.env.MP_NOTIFICATION_SECRET && secret !== process.env.MP_NOTIFICATION_SECRET) {
      return res.status(401).send("Unauthorized");
    }

    const { type, data } = req.body || {};
    if (type !== "payment" || !data?.id) return res.status(200).send("ignored");

    // busca o pagamento
    const pr = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      cache: "no-store"
    });
    const p = await pr.json();
    console.log("MP PAYMENT:", { id: p.id, status: p.status, status_detail: p.status_detail });

    if (p.status !== "approved") return res.status(200).send("ok");

    // coleta dados do MP + metadata
    const md = p.metadata || {};
    const nome   = md.customer_name || [p.payer?.first_name, p.payer?.last_name].filter(Boolean).join(" ") || "Cliente";
    const fone   = md.customer_phone || p.payer?.phone?.number || "";
    const endereco = md.customer_address || p.additional_info?.payer?.address?.street_name || "";
    const obs    = md.note || p.description || "";
    const total  = (p.transaction_amount ?? 0).toFixed(2);
    const pmType = p.payment_type_id || p.payment_method?.id || "—";
    const installments = p.installments || 1;
    const forma = pmType === "credit_card" ? `Cartão (${installments}x)` :
                  pmType === "pix" ? "PIX" :
                  pmType === "debit_card" ? "Débito" :
                  pmType === "ticket" ? "Boleto" : pmType;

    // itens
    const itens = Array.isArray(p.additional_info?.items)
      ? p.additional_info.items.map(i => `${i.title}${i.quantity ? ` (${i.quantity}x)` : ""}`).join(", ")
      : (Array.isArray(md.items) ? md.items.map(i => `${i.title}${i.qty ? ` (${i.qty}x)` : ""}`).join(", ") : "");

    const text =
      `<b>🍇 Roxo Sabor</b>\n` +
      `<b>🟣 Novo pedido APROVADO!</b> ✅\n\n` +
      `<b>👤 Cliente:</b> ${nome}\n` +
      (fone ? `<b>📞 WhatsApp:</b> +55 ${String(fone).replace(/^(\+?55)?/, "")}\n` : "") +
      (endereco ? `<b>📍 Endereço:</b> ${endereco}\n` : "") +
      (obs ? `<b>📝 Observação:</b> ${obs}\n` : "") +
      (itens ? `<b>📦 Itens:</b> ${itens}\n` : "") +
      `<b>💳 Pagamento:</b> ${forma}\n` +
      `<b>💰 Total:</b> R$ ${total}\n\n` +
      `<b>🧾 MP id:</b> ${p.id}`;

    // dispara para o Telegram
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const base = process.env.URL_BASE || `https://${host}`;
    await fetch(`${base}/api/send-telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })   // usa TELEGRAM_CHAT_ID padrão
    });

    return res.status(200).send("ok");
  } catch (e) {
    console.error("Webhook error:", e);
    return res.status(500).send("error");
  }
}
