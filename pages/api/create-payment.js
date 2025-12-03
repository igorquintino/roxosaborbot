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

    // Envia apenas o valor total (produtos + frete)
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

        // 🔥 DESATIVAMOS O PIX AQUI
        payment_methods: {
          excluded_payment_types: [
            { id: "ticket" }, // remove boleto (se quiser)
            { id: "atm" },    // remove transferência
            { id: "pix" }     // 🔥 remove PIX
          ]
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

        metadata: {
          cart,
          subtotal,
          discount,
          deliveryFee,
          total,
          note,
          loja: "Roxo Sabor",
          customer_name: customer?.name || "",
          customer_phone: String(customer?.phone || ""),
          full_address: customer?.address || "",
        },

        statement_descriptor: "RSABOR",
      },
    });

    return res.status(200).json({ url: pref.init_point });
  } catch (error) {
    console.error("Erro ao criar pagamento:", error?.message || error);
    return res.status(500).json({ error: "Erro ao iniciar pagamento." });
  }
}
