export default async function handler(req, res) {
  const secret = req.query.secret;
  if (secret !== process.env.MP_NOTIFICATION_SECRET)
    return res.status(403).json({ error: "Segredo inválido" });

  const body = req.body;

  // Verifica se é um pagamento aprovado
  if (body.action === "payment.updated" && body.data && body.data.id) {
    const paymentId = body.data.id;
    console.log("Pagamento confirmado:", paymentId);

    // Envia mensagem pro WhatsApp do lojista
    try {
      await fetch(`${process.env.BASE_URL}/api/send-whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "✅ Pedido confirmado! Pagamento aprovado via Mercado Pago.",
        }),
      });
    } catch (err) {
      console.error("Erro ao enviar mensagem WhatsApp:", err);
    }
  }

  res.status(200).json({ received: true });
}
