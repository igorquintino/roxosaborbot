// pages/api/calculate-distance.js

// COORDENADAS FIXAS DA ROXO SABOR (PEGA NO GOOGLE MAPS)
// Ex.: clique no seu ponto → copia "-20.xxxx, -43.xxxx"
const ORIGEM_LAT = -20.000000;  // <-- TROCAR
const ORIGEM_LON = -43.000000;  // <-- TROCAR

// Haversine: distância em km entre dois pontos (lat, lon)
function distanciaEmKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // raio da Terra em km
  const toRad = (v) => (v * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// TABELA DE PREÇO (baseado nas imagens que você mandou)
function calcularPreco(distanciaKm) {
  if (distanciaKm <= 1) return 4.99;      // 0.5–1 km
  if (distanciaKm <= 2) return 6.99;      // 1.5–2 km
  if (distanciaKm <= 3) return 7.99;      // 2.5–3 km
  if (distanciaKm <= 4) return 8.99;      // 3.5–4 km
  if (distanciaKm <= 5) return 10.99;     // 4.5–5 km
  if (distanciaKm <= 5.5) return 11.99;   // 5.5 km
  return 12.99;                           // 6 km ou mais
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: "Endereço é obrigatório" });
    }

    // Chamada GRATUITA ao Nominatim (OpenStreetMap)
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      address
    )}`;

    const resp = await fetch(url, {
      headers: {
        // recomendado pelo Nominatim (pode colocar seu e-mail)
        "User-Agent": "illumo-roxosabor/1.0 (contato@exemplo.com)",
      },
    });

    const data = await resp.json();

    if (!data || !data.length) {
      return res.status(404).json({ error: "Endereço não encontrado" });
    }

    const destinoLat = parseFloat(data[0].lat);
    const destinoLon = parseFloat(data[0].lon);

    const distanciaKm = distanciaEmKm(
      ORIGEM_LAT,
      ORIGEM_LON,
      destinoLat,
      destinoLon
    );

    const price = calcularPreco(distanciaKm);

    return res.status(200).json({
      distanciaKm: Number(distanciaKm.toFixed(2)),
      price,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao calcular distância" });
  }
}
