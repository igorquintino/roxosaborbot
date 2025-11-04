// /pages/api/mp-webhook.js
export default async function handler(req, res) {
  try {
    // 1) Valida método
    if (req.method !== "POST") return res.status(405).send("Method not allowed");

    // 2) Valida secret simples (querystring)
    const secret = req.query?.secret;
    if (secret !== process.env.MP_NOTIFICATION_SECRET) {
      return res.status(401).send("Unauthorized");
    }

    // 3) Mercado Pago envia algo como { type: "payment", data: { id: "123" } }
    const { type, data } = req.body || {};
    if (type !== "payment" || !data?.id) {
      return res.status(200).send("ignored");
    }

    // 4) Consulta pagamento para confirmar status
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      cache: "no-store"
    });
    const payment = await r.json();

    // 5) Idempotência: evite processar o mesmo id 2x (salve em DB e cheque antes)
    // const already = await db.find(payment.id); if (already) return res.status(200).send("ok");

    if (payment.status === "approved") {
      const ref = payment.external_reference; // "pedido_..."
      // TODO: marcar pedido (ref) como pago no seu DB
      // await db.markPaid(ref, payment.id, payment.payer?.email, payment.transaction_amount);
      console.log("✅ PAGO:", ref, payment.id);
    } else {
      console.log("ℹ️ Status:", payment.status, payment.id);
    }

    return res.status(200).send("ok");
  } catch (e) {
    console.error("Webhook error:", e);
    return res.status(500).send("error");
  }
}
