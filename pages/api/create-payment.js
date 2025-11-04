// /pages/api/mp-create.js (Next.js pages) ou /app/api/mp-create/route.js (App Router adaptando)
import { MercadoPagoConfig, Preference } from "mercadopago";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");
  try {
    const { cart = [], total, note = "", customer = {} } = req.body || {};

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });
    const preference = new Preference(client);

    const items = cart.map((i) => ({
      title: i.name,
      quantity: Number(i.qty || 1),
      unit_price: Number(i.subtotal ?? i.price ?? 0),
      currency_id: "BRL",
    }));

    // (Opcional) validar soma dos items com "total"
    // const sum = items.reduce((acc, it) => acc + it.unit_price * it.quantity, 0);
    // if (total && Math.abs(sum - Number(total)) > 0.01) {
    //   return res.status(400).json({ error: "Total divergente." });
    // }

    const pref = await preference.create({
      body: {
        items,
        payer: {
          name: customer?.name || "",
          phone: {
            area_code: customer?.areaCode || "31",
            number: String(customer?.phone || "")
          },
          address: { street_name: customer?.address || "" },
        },
        payment_methods: {
          excluded_payment_types: [{ id: "ticket" }], // sem boleto
          installments: 1,
          default_payment_method_id: "pix", // PIX como padrão
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
          note,
          loja: "Roxo Sabor",
          customer_name: customer?.name || "",
          customer_phone: String(customer?.phone || "")
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
