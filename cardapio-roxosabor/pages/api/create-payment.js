import mercadopago from "mercadopago";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const { cart, total, note } = req.body;
  const baseUrl = process.env.BASE_URL;

  mercadopago.configure({
    access_token: process.env.MP_ACCESS_TOKEN,
  });

  try {
    const preference = {
      items: cart.map((item) => ({
        title: item.name,
        quantity: 1,
        currency_id: "BRL",
        unit_price: Number(item.subtotal || item.price),
      })),
      back_urls: {
        success: `${baseUrl}/?pago=sucesso`,
        failure: `${baseUrl}/?pago=erro`,
      },
      notification_url: `${baseUrl}/api/mp-webhook?secret=${process.env.MP_NOTIFICATION_SECRET}`,
      metadata: { note },
    };

    const response = await mercadopago.preferences.create(preference);
    res.status(200).json({ url: response.body.init_point });
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
}
