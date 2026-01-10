// /pages/api/test-auto-whatsapp.js
export default async function handler(req, res) {
  try {
    const to = process.env.TEST_WHATSAPP_TO || "+55DDDSEUNUMERO"; // opcional
    const payload = {
      to,
      customer_name: "Igor",
      pedido: "Açaí 500ml com granola e morango 🍓",
      total: 24.90
    };

    // monta a base automaticamente (Railway usa HTTPS)
    const host =
      req.headers["x-forwarded-host"] ||
      req.headers.host ||
      "roxosaborbot-production.up.railway.app";
    const baseUrl = process.env.URL_BASE || `https://${host}`;
    const url = `${baseUrl}/api/send-whatsapp`;

    console.log("🚀 Enviando mensagem fake para:", payload.to, "via", url);

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await r.json();
    if (!r.ok) {
      console.error("❌ Erro ao disparar mensagem:", data);
      return res.status(500).json({ error: "Falha ao enviar WhatsApp", details: data });
    }

    console.log("✅ Mensagem fake enviada:", data);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("❌ Erro no teste automático:", error);
    return res.status(500).json({ error: "Erro interno" });
  }
}
