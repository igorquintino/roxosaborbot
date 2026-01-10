
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  try {
    // Checagem de secret opcional para evitar chamadas fakes
    const secret = req.query?.secret;
    if (process.env.MP_NOTIFICATION_SECRET && secret !== process.env.MP_NOTIFICATION_SECRET) {
      return res.status(401).send("Unauthorized");
    }

    const { type, data } = req.body || {};
    
    // MP envia notificações de vários tipos, nos interessa apenas 'payment'
    if (type !== "payment" || !data?.id) return res.status(200).send("ignored");

    // Busca os detalhes do pagamento diretamente na API do Mercado Pago
    const pr = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      cache: "no-store"
    });
    
    if (!pr.ok) return res.status(200).send("MP API error or payment not found");
    
    const p = await pr.json();
    console.log("MP PAYMENT RECEIVED:", { id: p.id, status: p.status });

    // Só processamos se o pagamento estiver APROVADO
    if (p.status !== "approved") return res.status(200).send("ok");

    // Coleta dados do metadata que enviamos no create-payment
    const md = p.metadata || {};
    const nome = md.customer_name || [p.payer?.first_name, p.payer?.last_name].filter(Boolean).join(" ") || "Cliente";
    const fone = md.customer_phone || p.payer?.phone?.number || "";
    const endereco = md.full_address || "";
    const obs = md.note || "";
    const total = (p.transaction_amount ?? 0).toFixed(2);
    const orderItems = md.order_summary || "";
    
    const pmType = p.payment_type_id || p.payment_method?.id || "—";
    const installments = p.installments || 1;
    const forma = pmType === "credit_card" ? `Cartão (${installments}x)` :
                  pmType === "debit_card" ? "Débito" : pmType;

    const text = `
<b>🍇 Roxo Sabor</b>
<b>🟣 Novo pedido APROVADO!</b> ✅

<b>👤 Cliente:</b> ${nome}
${fone ? `<b>📞 WhatsApp:</b> +55 ${String(fone).replace(/^(\+?55)?/, "")}` : ""}
<b>📍 Endereço:</b> ${endereco}
${obs ? `<b>📝 Obs:</b> ${obs}` : ""}

<b>📦 Itens:</b>
${orderItems}

<b>💳 Pagamento:</b> ${forma}
<b>💰 Total:</b> R$ ${total}

<b>🧾 MP id:</b> <code>${p.id}</code>
<b>🎟️ Cupom:</b> ${md.coupon_code || "Nenhum"}
`;

    // Dispara a notificação para o Telegram usando o endpoint interno
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const base = process.env.URL_BASE || `https://${host}`;
    
    await fetch(`${base}/api/send-telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }) 
    });

    return res.status(200).send("ok");
  } catch (e) {
    console.error("Webhook error:", e);
    return res.status(500).send("error");
  }
}
