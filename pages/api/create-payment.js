import { MercadoPagoConfig, Preference } from "mercadopago";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      cart = [],
      subtotal = 0,
      discount = 0,
      deliveryFee = 0,
      note = "",
      customer = {},
      couponCode = "", // opcional, se quiser mandar do front
    } = req.body || {};

    // Normaliza os valores numéricos
    const safeSubtotal = Number(subtotal) || 0;
    const safeDiscount = Number(discount) || 0;
    const safeDeliveryFee = Number(deliveryFee) || 0;

    // 🔥 TOTAL FINAL = produtos - desconto + frete
    // (se frete grátis, o front deve mandar deliveryFee = 0)
    const finalTotal = Math.max(
      0,
      safeSubtotal - safeDiscount + safeDeliveryFee
    );

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });

    const preference = new Preference(client);

    // Enviamos UM item com o valor total (produtos + frete)
    const items = [
      {
        id: "pedido-roxo-sabor",
        title: "Pedido Roxo Sabor",
        quantity: 1,
        unit_price: Number(finalTotal.toFixed(2)),
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

        // 🔒 Só cartão e saldo na conta MP (sem PIX / boleto / etc)
        payment_methods: {
          excluded_payment_types: [
            { id: "ticket" }, // boleto
            { id: "atm" },    // transferência
            { id: "pix" },    // pix
          ],
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
          subtotal: safeSubtotal,
          discount: safeDiscount,
          deliveryFee: safeDeliveryFee,
          total: finalTotal,
          note,
          loja: "Roxo Sabor",
          customer_name: customer?.name || "",
          customer_phone: String(customer?.phone || ""),
          full_address: customer?.address || "",
          couponCode: couponCode || null,
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
