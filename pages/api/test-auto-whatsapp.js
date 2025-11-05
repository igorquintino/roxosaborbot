// /pages/api/test-auto-whatsapp.js
export default async function handler(req, res) {
  try {
    // Simulação de um pedido "fake" só para teste do WhatsApp
    const pedidoFake = {
      to: process.env.MERCHANT_PHONE_E164 || "+5531984853327, // coloque seu número se quiser fixo
      customer_name: "Igor",
      pedido: "Açaí 500ml com granola e morango 🍓",
      total: 24.90
    };

    console.log("🚀 Enviando mensagem fake de pedido para:", pedidoFake.to);

    const r = await fetch(`${process.env.URL_BASE}/api/send-whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pedidoFake)
    });

    const data = await r.json();
    if (!r.ok) {
      console.error("❌ Erro ao disparar mensagem:", data);
      return res.status(500).json({ error: "Falha ao enviar WhatsApp", details: data });
    }

    console.log("✅ Mensagem fake enviada com sucesso:", data);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("❌ Erro no teste automático:", error);
    return res.status(500).json({ error: "Erro interno" });
  }
}
