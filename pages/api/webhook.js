export default function handler(req, res) {
  try {
    // ✅ Etapa 1: verificação (GET)
    if (req.method === "GET") {
      const VERIFY_TOKEN = process.env.MP_NOTIFICATION_SECRET || "um_seguro_qualquer";
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("✅ Webhook verificado com sucesso!");
        return res.status(200).send(challenge);
      } else {
        console.warn("❌ Falha na verificação: token inválido");
        return res.status(403).send("Token inválido");
      }
    }

    // ✅ Etapa 2: mensagens (POST)
    if (req.method === "POST") {
      console.log("📩 Webhook recebido:", JSON.stringify(req.body, null, 2));
      return res.status(200).send("EVENT_RECEIVED");
    }

    // ✅ Outros métodos
    return res.status(405).send("Method Not Allowed");
  } catch (err) {
    console.error("❌ Erro no webhook:", err);
    return res.status(500).send("Internal Server Error");
  }
}
