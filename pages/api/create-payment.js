// /pages/api/mp-create.js
import { MercadoPagoConfig, Preference } from "mercadopago";

// (opcional) se seu ambiente Node não tiver fetch global, descomente:
// import fetch from "node-fetch"; global.fetch = fetch;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  try {
    const { cart = [], total, note = "", customer = {} } = req.body || {};

    // validações básicas
    if (!process.env.MP_ACCESS_TOKEN) {
      return res.status(500).json({ error: "ACCESS_TOKEN ausente" });
    }
    if (!process.env.URL_BASE) {
      return res.status(500).json({ error: "URL_BASE ausente" });
    }
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio" });
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });
    const preference = new Preference(client);

    const items = cart.map((i) => ({
      title: i.name || "Item",
      quantity: Number(i.qty ?? 1),
      unit_price: Number(i.subtotal ?? i.price ?? 0),
      currency_id: "BRL",
    }));

    // (opcional) validar total
    // const sum = items.reduce((a, it) => a + it.unit_price * it.quantity, 0);
    // if (total && Math.abs(sum - Number(total)) > 0.01) {
    //   return res.status(400).json({ error: "Total divergente." });
    // }

    const body = {
      items,
      payer: {
        name: customer?.name || "",
        phone: {
          area_code: customer?.areaCode || "31",
          number: String(customer?.phone || ""),
        },
        address: { street_name: customer?.address || "" },
      },

      // sem payment_methods e sem binary_mode para não ocultar PIX
      back_urls: {
        success: `${process.env.URL_BASE}/?pago=sucesso`,
        failure: `${process.env.URL_BASE}/?pago=erro`,
        pending: `${process.env.URL_BASE}/?pago=pending`,
      },
      auto_return: "approved",

      notification_url: `${process.env.URL_BASE}/api/mp-webhook?secret=${process.env.MP_NOTIFICATION_SECRET}`,
      external_reference: `pedido_${Date.now()}`,
      statement_descriptor: "ROXO SABOR",

      // metadata sempre enxuta
      metadata: {
        note,
        loja: "Roxo Sabor",
        customer_name: customer?.name || "",
        customer_phone: String(customer?.phone || ""),
      },
    };

    const pref = await preference.create({ body });

    // Logs úteis no Railway
    console.log("PREFERENCE OK:", {
      id: pref.id,
      init_point: pref.init_point,
      sandbox_init_point: pref.sandbox_init_point,
    });

    // Retorne os dois links pra você testar o correto
    return res.status(200).json({
      url: pref.init_point,                // produção
      sandbox_url: pref.sandbox_init_point // sandbox
    });

  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    return res
      .status(500)
      .json({ error: error?.message || "Erro ao iniciar pagamento." });
  }
}
