
import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const {
      cart = [],
      subtotal = 0,
      discount = 0,
      deliveryFee = 0,
      customer = {},
      couponCode = "",
      note = ""
    } = req.body || {};

    // Normaliza os valores numéricos
    const safeSubtotal = Number(subtotal) || 0;
    const safeDiscount = Number(discount) || 0;
    const safeDeliveryFee = Number(deliveryFee) || 0;

    // TOTAL FINAL = produtos - desconto + frete
    const finalTotal = Math.max(0, safeSubtotal - safeDiscount + safeDeliveryFee);

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN || '',
    });

    const preference = new Preference(client);

    // Enviamos UM item com o valor total consolidado
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
          email: "cliente@roxosabor.com.br",
          phone: {
            area_code: "31",
            number: String(customer?.whatsapp || "").replace(/\D/g, ""),
          },
          address: { 
            street_name: `${customer?.street || ""}, ${customer?.number || ""}`,
            zip_code: "36400000"
          },
        },

        payment_methods: {
          excluded_payment_types: [
            { id: "ticket" }, // boleto
            { id: "atm" },    // transferência
            { id: "pix" },    // pix
          ],
        },

        binary_mode: true,

        back_urls: {
          success: `${process.env.URL_BASE}/?status=success`,
          failure: `${process.env.URL_BASE}/?status=failure`,
          pending: `${process.env.URL_BASE}/?status=pending`,
        },

        auto_return: "approved",

        notification_url: `${process.env.URL_BASE}/api/mp-webhook?secret=${process.env.MP_NOTIFICATION_SECRET}`,

        external_reference: `pedido_${Date.now()}`,

        metadata: {
          subtotal: safeSubtotal,
          discount: safeDiscount,
          deliveryFee: safeDeliveryFee,
          total: finalTotal,
          note: note || "Sem observações",
          customer_name: customer?.name || "",
          customer_phone: String(customer?.whatsapp || ""),
          full_address: `${customer?.street || ""}, ${customer?.number || ""} - ${customer?.neighborhood || ""}`,
          coupon_code: couponCode || "NENHUM",
          order_summary: cart.map((i: any) => `${i.quantity}x ${i.name}`).join(", ")
        },

        statement_descriptor: "ROXOSABOR",
      },
    });

    return res.status(200).json({ url: pref.init_point });
  } catch (error: any) {
    console.error("Erro ao criar pagamento:", error?.message || error);
    return res.status(500).json({ error: "Erro ao iniciar pagamento." });
  }
}
