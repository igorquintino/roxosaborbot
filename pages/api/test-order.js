// /pages/api/test-order.js
export default async function handler(req, res) {
  try {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const to = req.body?.to || process.env.TEST_WHATSAPP_TO;

    if (!token || !phoneId) {
      return res.status(500).json({ error: "Token ou Phone ID ausente" });
    }

    if (!to) {
      return res.status(400).json({ error: "Informe o número em +55DDDNUMERO" });
    }

    const customer = req.body?.customer || "Igor";
    const itens = req.body?.itens || "Açaí 330ml + morango";
    const total = req.body?.total || "19,90";

    // payload do template
    const body = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: "hello_world", // use "pedido_confirmado" se o seu template já foi aprovado
        language: { code: "pt_BR" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: customer },
              { type: "text", text: itens },
              { type: "text", text: total }
            ]
          }
        ]
      }
    };

    const r = await fetch(`https://graph.facebook.com/v22.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body)
    });

    const data = await r.json();
    if (!r.ok) {
      console.error("Erro no envio:", data);
      return res.status(500).json({ error: "Falha ao enviar mensagem", details: data });
    }

    console.log("Mensagem enviada com sucesso:", data);
    return res.status(200).json({ ok: true, data });
  } catch (err) {
    console.error("Erro interno:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
