
// CONFIGURAÇÃO DOS CÓDIGOS DE RASPADINHA
const RASPADINHA_CODES: Record<string, any> = {
  "ROXO10": { type: "percent", value: 10, label: "10% de desconto aplicado!" },
  "FRETEGRATIS": { type: "freeShipping", label: "Frete grátis nesta compra!" },
  "ADICIONAL": { type: "msg", label: "Ganhou um adicional grátis no próximo açaí!" }
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { code } = req.body;
  const upperCode = code?.toUpperCase();
  const coupon = RASPADINHA_CODES[upperCode];

  if (coupon) {
    return res.status(200).json({ ok: true, coupon });
  } else {
    return res.status(404).json({ ok: false, message: "Código inválido ou expirado." });
  }
}
