// /lib/defaultConfig.js
const defaultConfig = {
  brand: {
    name: "Roxo Sabor",
    logoText: "ROXO SABOR",
    colors: {
      primary: "#6D28D9",
      primaryDark: "#4C1D95",
      accent: "#22C55E",
    },
  },
  store: {
    whatsapp: "+55 31 99999-9999",
    instagram: "@roxosaboroficial",
    deliveryHours: "Todos os dias, 14h às 23h",
    bannerUrl: "",
    logoUrl: "",
    closedNote: "",
    raspadinhaCopy:
      "Raspou, achou, ganhou! Digite seu código para validar seu prêmio.",
  },
  categories: [
    { id: "promos", name: "Promoções" },
    { id: "acai", name: "Açaí no Copo" },
    { id: "combos", name: "Combos" },
    { id: "adicionais", name: "Adicionais" },
    { id: "bebidas", name: "Bebidas" },
  ],
  addons: [
    { id: "leiteNinho", name: "Leite Ninho", price: 1.0 },
    { id: "nutella", name: "Nutella", price: 4.5 },
    { id: "morango", name: "Morango", price: 3.0 },
    { id: "banana", name: "Banana", price: 2.5 },
    { id: "granola", name: "Granola", price: 2.0 },
    { id: "leiteCondensado", name: "Leite Condensado", price: 2.5 },
  ],
  products: [
    {
      id: "promo-999",
      category: "promos",
      name: "PROMO • 330 ml por R$ 9,99",
      desc: "Açaí 330 ml com 1 adicional simples.",
      price: 0.99,
      img: "",
      tags: ["promo", "popular"],
    },
    {
      id: "acai-330",
      category: "acai",
      name: "Açaí 330 ml",
      desc: "Base cremosa de açaí. Escolha seus adicionais.",
      price: 14.9,
      sizes: [
        { code: "330", label: "330 ml", price: 14.9 },
        { code: "500", label: "500 ml", price: 19.9 },
        { code: "700", label: "700 ml", price: 26.9 },
      ],
      img: "",
      tags: ["popular"],
    },
    {
      id: "acai-gourmet",
      category: "acai",
      name: "Açaí Gourmet",
      desc: "Com Nutella, Ninho e morangos frescos.",
      price: 24.9,
      img: "",
      tags: ["gourmet"],
    },
  ],
  coupons: {
    ROXO10: { type: "percent", value: 10, label: "10% de desconto aplicado" },
  },
};

module.exports = { defaultConfig };
