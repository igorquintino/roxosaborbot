import { MercadoPagoConfig, Preference } from "mercadopago";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  try {
    const {
      cart = [],
      subtotal = 0,
      discount = 0,
      deliveryFee = 0,
      total = 0,
      note = "",
      customer = {},
    } = req.body || {};

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });

    const preference = new Preference(client);

    // 🟣 ENVIA UM ÚNICO ITEM COM O VALOR FINAL (total)
    const items = [
      {
        id: "pedido-roxo-sabor",
        title: "Pedido Roxo Sabor",
        quantity: 1,
        unit_price: Number(Number(total).toFixed(2)),
        currency_id: "BRL",
      },
    ];

    const pref = await preference.create({
      body: {
        items,

        payer: {
          name: customer?.name || "",
          phone: {
            area_code: "31",
            number: String(customer?.phone || ""),
          },
          address: { street_name: customer?.address || "" },
        },

        binary_mode: true,

        back_urls: {
          success: `${process.env.URL_BASE}/?pago=sucesso`,
          failure: `${process.env.URL_BASE}/?pago=erro`,
          pending: `${process.env.URL_BASE}/?pago=pending`,
        },

        auto_return: "approved",

        notification_url: `${process.env.URL_BASE}/api/mp-webhook?secret=${process.env.MP_NOTIFICATION_SECRET}`,

        external_reference: `pedido_${Date.now()}`,

        // 🔥 AQUI GUARDAMOS TUDO PARA O WEBHOOK/PAINEL
        metadata: {
          cart,
          subtotal: Number(subtotal),
          discount: Number(discount),
          deliveryFee: Number(deliveryFee),
          total: Number(total),
          note,
          loja: "Roxo Sabor",
          customer_name: customer?.name || "",
          customer_phone: String(customer?.phone || ""),
          full_address: customer?.address || "",
        },

        statement_descriptor: "ROXO SABOR",
      },
    });

    return res.status(200).json({ url: pref.init_point });
  } catch (error) {
    console.error("Erro ao criar pagamento:", error?.message || error);
    return res.status(500).json({ error: "Erro ao iniciar pagamento." });
  }
}
