// /pages/api/test-order.js (versão para hello_world)
export default async function handler(req, res) {
  try {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const to = req.body?.to || process.env.TEST_WHATSAPP_TO;
    if (!token || !phoneId) return res.status(500).json({ error: "Token/PhoneId ausentes" });
    if (!to) return res.status(400).json({ error: "Informe 'to' em +55DDDNUMERO" });

    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: "hello_world",
        language: { code: "en_US" } // <- obrigatoriamente en_US
      }
    };

    const r = await fetch(`https://graph.facebook.com/v22.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    return res.status(r.ok ? 200 : 500).json(r.ok ? { ok: true, data } : { error: "Falha", details: data });
  } catch (e) {
    return res.status(500).json({ error: "Erro interno" });
  }
}
