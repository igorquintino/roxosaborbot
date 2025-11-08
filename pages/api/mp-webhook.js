// /pages/api/mp-webhook.js
// Envia um WhatsApp para o ADMIN quando o pagamento for aprovado, com todos os detalhes
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const secret = req.query?.secret;
    if (process.env.MP_NOTIFICATION_SECRET && secret !== process.env.MP_NOTIFICATION_SECRET) {
      return res.status(401).send("Unauthorized");
    }

    const { type, data } = req.body || {};
    if (type !== "payment" || !data?.id) {
      return res.status(200).send("ignored");
    }

    // 1) Busca o pagamento no MP
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      cache: "no-store"
    });
    const p = await r.json();

    // Sugestão: log útil no Railway
    console.log("MP PAYMENT:", { id: p.id, status: p.status, status_detail: p.status_detail });

    // 2) Só avisa quando aprovado
    if (p.status !== "approved") {
      return res.status(200).send("ok");
    }

    // ====== COLETA DOS DADOS ======
    // Do Mercado Pago
    const pmType = p.payment_type_id || "";              // e.g. "credit_card", "pix"
    const pmId   = p.payment_method?.id || "";           // e.g. "master", "pix"
    const installments = p.installments || 1;
    const total = (p.transaction_amount ?? 0).toFixed(2);
    const payerName = [p.payer?.first_name, p.payer?.last_name].filter(Boolean).join(" ").trim();
    const payerEmail = p.payer?.email || "";
    const payerPhone = p.payer?.phone?.number || "";     // pode vir vazio
    // Itens (se você enviou additional_info.items)
    const itens = Array.isArray(p.additional_info?.items)
      ? p.additional_info.items.map(i => `${i.title}${i.quantity ? ` (${i.quantity}x)` : ""}`).join(", ")
      : "";

    // Do metadata que você envia na criação da preferência
    const md = p.metadata || {};
    const metaName    = md.customer_name || "";
    const metaPhone   = (md.customer_phone || "").toString();
    const metaAddress = md.customer_address || md.address || "";
    const metaNote    = md.note || md.customer_note || "";

    // Fallbacks inteligentes
    const clienteNome   = metaName || payerName || "Cliente";
    const clienteFone   = metaPhone || payerPhone || "";
    const observacao    = metaNote || (p.description ?? "");
    const endereco      = metaAddress || p.additional_info?.payer?.address?.street_name || "";

    // Forma de pagamento legível
    const formaPgto =
      pmType === "credit_card" ? `Cartão (${installments}x, bandeira: ${pmId || "—"})` :
      pmType === "pix"         ? "PIX" :
      pmType === "debit_card"  ? "Débito" :
      pmType === "ticket"      ? "Boleto" :
      pmId ? pmId : "Não informado";

    // 3) Monta a mensagem para o ADMIN
    const linhas = [
      "🍇 *Roxo Sabor*",
      "🟣 *Novo pedido APROVADO!* ✅",
      "",
      `👤 *Cliente:* ${clienteNome}`,
      clienteFone ? `📞 *WhatsApp:* +55 ${clienteFone.replace(/^(\+?55)?/, "")}` : "",
      payerEmail ? `✉️ *Email:* ${payerEmail}` : "",
      endereco ? `📍 *Endereço:* ${endereco}` : "",
      observacao ? `📝 *Observação:* ${observacao}` : "",
      itens ? `📦 *Itens:* ${itens}` : "",
      `💳 *Pagamento:* ${formaPgto}`,
      `💰 *Total:* R$ ${total}`,
      "",
      `🧾 *MP id:* ${p.id}`,
    ].filter(Boolean);

    const msg = linhas.join("\n");

    // 4) Envia no WhatsApp para o ADMIN
    const phoneId = process.env.WHATSAPP_PHONE_ID; // 793947943810171
    const token   = process.env.WHATSAPP_TOKEN;    // EAAT...
    const toAdmin = (process.env.WHATSAPP_ADMIN_TO || process.env.TEST_WHATSAPP_TO || "").toString();

    if (!phoneId || !token || !toAdmin) {
      console.error("Faltando WHATSAPP_PHONE_ID / WHATSAPP_TOKEN / WHATSAPP_ADMIN_TO");
    } else {
      const wr = await fetch(`https://graph.facebook.com/v22.0/${phoneId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: toAdmin.startsWith("+") ? toAdmin : `+${toAdmin}`, // garante +55...
          type: "text",
          text: { body: msg }
        })
      });
      const wj = await wr.json();
      if (!wr.ok) {
        console.error("Erro ao enviar WhatsApp admin:", wj);
      } else {
        console.log("WhatsApp admin OK:", wj);
      }
    }

    return res.status(200).send("ok");
  } catch (e) {
    console.error("Webhook error:", e);
    return res.status(500).send("error");
  }
}
