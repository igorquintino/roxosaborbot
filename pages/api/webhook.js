// /pages/api/webhook.js

export default async function handler(req, res) {
  // ✅ Etapa 1: Validação inicial do Webhook (usada pelo Meta)
  if (req.method === "GET") {
    const VERIFY_TOKEN = process.env.MP_NOTIFICATION_SECRET; // mesmo valor do painel do Meta
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ Webhook do WhatsApp verificado com sucesso!");
      return res.status(200).send(challenge);
    } else {
      console.warn("❌ Falha na verificação do Webhook do WhatsApp.");
      return res.sendStatus(403);
    }
  }

  // ✅ Etapa 2: Recebimento de mensagens reais do WhatsApp
  if (req.method === "POST") {
    try {
      const body = req.body;

      console.log("📩 Webhook recebido do WhatsApp:", JSON.stringify(body, null, 2));

      // Você pode futuramente adicionar aqui a lógica para responder mensagens automaticamente

      return res.status(200).send("EVENT_RECEIVED");
    } catch (error) {
      console.error("❌ Erro ao processar webhook do WhatsApp:", error);
      return res.status(500).send("error");
    }
  }

  // ✅ Etapa 3: Outros métodos HTTP
  return res.status(405).send("Method Not Allowed");
}
