// pages/index.js
import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/router";

const LS_KEY = "ilumo_cfg_v2";

/* ===== DEFAULTS ===== */
const BRAND = {
  name: "Roxo Sabor",
  logoText: "ROXO SABOR",
  colors: {
    primary: "#6D28D9",
    primaryDark: "#4C1D95",
    accent: "#22C55E",
    lightBg: "#f7f7fb",
    lightFg: "#0f172a",
    darkBg: "#0b0b0b",
    darkFg: "#eaeaea",
    cardDark: "#121212",
    cardLight: "#ffffff",
  },
};

const STORE = {
  whatsapp: "+55 31 993006358",
  instagram: "@roxosaboroficial",
  deliveryHours: "Todos os dias, 14h às 23h",
  raspadinhaCopy:
    "Raspou, achou, ganhou! Digite seu código para validar seu prêmio.",
  logoUrl: "",
  bannerUrl: "",
};

const COUPONS = {
  ROXO10: { type: "percent", value: 10, label: "10% de desconto aplicado" },
  FRETEGRATIS: { type: "msg", label: "Frete grátis na próxima compra!" },
  ADICIONAL: { type: "msg", label: "Um adicional grátis no próximo açaí!" },
};

const CATEGORIES = [
  { id: "promos", name: "Promoções" },
  { id: "acai", name: "Açaí no Copo" },
  { id: "combos", name: "Combos" },
  { id: "adicionais", name: "Adicionais" },
  { id: "bebidas", name: "Bebidas" },
];

const ADDONS = [
  { id: "leiteNinho", name: "Leite Ninho", price: 1.0 },
  { id: "nutella", name: "Nutella", price: 4.5 },
  { id: "morango", name: "Morango", price: 3.0 },
  { id: "banana", name: "Banana", price: 2.5 },
  { id: "granola", name: "Granola", price: 2.0 },
  { id: "leiteCondensado", name: "Leite Condensado", price: 2.5 },
];

const PRODUCTS = [
  {
    id: "promo-999",
    category: "promos",
    name: "PROMO • 330 ml por R$ 9,99",
    desc: "Açaí 330 ml com 1 adicional simples.",
    price: 9.99,
    img: "/prod-acai.jpg",
    tags: ["promo", "popular"],
  },
  {
    id: "acai-330",
    category: "acai",
    name: "Açaí 330 ml + 3 complementos grátis",
    desc: "Escolha até 3 acompanhamentos grátis!",
    price: 24.99,
    sizes: [
      { code: "330", label: "330 ml", price: 24.99 },
      { code: "500", label: "500 ml", price: 25.99 },
      { code: "700", label: "700 ml", price: 32.99 },
    ],
    img: "/prod-acai.jpg",
    tags: ["popular"],
  },
  {
    id: "acai-gourmet",
    category: "acai",
    name: "Açaí Gourmet",
    desc: "Com Nutella, Ninho e morangos frescos.",
    price: 24.9,
    img: "/prod-acai2.jpg",
    tags: ["gourmet"],
  },
  {
    id: "combo-duo",
    category: "combos",
    name: "Combo DUO (2 x 500 ml)",
    desc: "2 copos de 500 ml + 2 adicionais cada.",
    price: 36.9,
    img: "/prod-acai2.jpg",
    tags: ["família"],
  },
  ...ADDONS.map((a) => ({
    id: `addon-${a.id}`,
    category: "adicionais",
    name: a.name,
    desc: "Adicional avulso",
    price: a.price,
    img: "/addon.jpg",
  })),
];

const currency = (n) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function RoxoSaborMenu() {
  const router = useRouter();

  const [ov, setOv] = useState(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setOv(JSON.parse(raw));
    } catch {}
  }, []);

  const _BRAND = ov?.brand ?? BRAND;
  const _STORE = ov?.store ? { ...STORE, ...ov.store } : STORE;
  const _CATEGORIES = ov?.categories ?? CATEGORIES;
  const _ADDONS = ov?.addons ?? ADDONS;
  const _PRODUCTS = ov?.products ?? PRODUCTS;
  const _COUPONS = ov?.coupons ?? COUPONS;

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("acai");
  const [cart, setCart] = useState([]);
  const [note, setNote] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [couponCode, setCouponCode] = useState("");
  const [couponInfo, setCouponInfo] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetProduct, setSheetProduct] = useState(null);

  useEffect(() => {
    if (router.query.pago === "sucesso") {
      alert("✅ Pedido confirmado! Você receberá o resumo no Telegram.");
    }
  }, [router.query.pago]);

  const filtered = useMemo(() => {
    return _PRODUCTS.filter(
      (p) =>
        (category ? p.category === category : true) &&
        (query
          ? (p.name + " " + (p.desc || ""))
              .toLowerCase()
              .includes(query.toLowerCase())
          : true)
    );
  }, [_PRODUCTS, category, query]);

  const subtotal = cart.reduce((s, i) => s + i.subtotal, 0);
  const discount =
    couponInfo?.type === "percent" ? (subtotal * couponInfo.value) / 100 : 0;
  const total = Math.max(0, subtotal - discount);

  function addToCart(product, { size, addons = [], qty = 1, obs = "" } = {}) {
    const basePrice = size ? size.price : product.price;
    const addonsTotal = addons.reduce((s, a) => s + a.price, 0);
    const subtotal = (basePrice + addonsTotal) * qty;
    setCart((old) => [
      ...old,
      {
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        size: size || null,
        addons,
        qty,
        obs,
        subtotal,
      },
    ]);
  }

  function removeFromCart(id) {
    setCart((old) => old.filter((i) => i.id !== id));
  }
  function clearCart() {
    setCart([]);
    setNote("");
  }
  function applyCoupon() {
    const code = couponCode.trim().toUpperCase();
    const found = _COUPONS[code];
    if (found) setCouponInfo({ ...found, code });
    else setCouponInfo({ type: "msg", label: "Código inválido ou já utilizado." });
  }

  async function checkoutMP() {
    try {
      if (!cart.length) return;
      if (!customer.name || !customer.phone || !customer.address) {
        alert("Preencha nome, telefone e endereço para continuar.");
        return;
      }
      const body = {
        cart,
        total: Number(subtotal.toFixed(2)),
        note,
        customer,
      };
      const r = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (data?.url) window.location.href = data.url;
      else alert("Não foi possível iniciar o pagamento.");
    } catch (e) {
      console.error(e);
      alert("Erro ao iniciar pagamento.");
    }
  }

  function openSheet(p) {
    setSheetProduct(p);
    setSheetOpen(true);
  }

  return (
    <div className="min-h-screen text-[15px] bg-[--bg] text-[--fg]">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[color:var(--line)]">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-center flex-1">
            <div className="text-sm text-[color:var(--muted)]">{_BRAND.name}</div>
            <div className="text-xs text-[color:var(--muted)]">
              {_STORE.deliveryHours}
            </div>
          </div>
          <a
            href="#carrinho"
            className="px-3 py-1.5 rounded-xl bg-[--primary] text-white hover:opacity-90 transition"
          >
            Carrinho ({cart.length})
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-md mx-auto px-4 pt-3">
        <div className="rounded-3xl bg-white shadow-md border border-[color:var(--line)] overflow-hidden">
          <div className="h-32 w-full">
            <img
              src={_STORE.bannerUrl || "/hero.jpg"}
              className="h-full w-full object-cover"
              alt="Banner"
              onError={(e) => (e.currentTarget.src = "/hero.jpg")}
            />
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <img
                src={_STORE.logoUrl || "/logo-roxo.png"}
                className="h-14 w-14 rounded-full border border-[color:var(--line)] object-cover bg-white"
                alt="Logo"
              />
              <div className="flex-1">
                <h1 className="text-lg font-semibold">
                  {_BRAND.name} - Bairro Progresso
                </h1>
                <div className="mt-0.5 text-sm text-[color:var(--muted)]">
                  Entrega rastreável • 2.7 km • Min R$ 20,00
                </div>
                <div className="mt-1 text-sm">⭐ 5,0 (4 avaliações)</div>
              </div>
            </div>
            <div className="mt-3 rounded-xl bg-[color:var(--chip)] p-2 text-center text-sm text-[color:var(--muted)]">
              Loja fechada • Abre amanhã às 09:00
            </div>
          </div>
        </div>
      </section>

      {/* BUSCA / CATEGORIAS */}
      <section className="max-w-md mx-auto px-4 pt-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar no cardápio…"
          className="w-full px-4 py-3 rounded-2xl bg-white border border-[color:var(--line)] outline-none shadow-sm"
        />
        <div className="mt-3 flex flex-wrap gap-8">
          {_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`px-0 py-1.5 border-b-2 -mb-px text-sm ${
                category === c.id
                  ? "border-[--primary] text-[--primary]"
                  : "border-transparent text-[color:var(--muted)] hover:text-[--primary]"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      {/* PRODUTOS */}
      <main className="max-w-md mx-auto px-2 pb-6">
        <h2 className="px-2 py-3 text-xl font-semibold">Monte Seu Açaí</h2>
        <div className="rounded-2xl bg-white border border-[color:var(--line)] shadow-sm">
          {filtered.map((p, idx) => (
            <ProductRow
              key={p.id}
              product={p}
              first={idx === 0}
              onClick={() => openSheet(p)}
            />
          ))}
        </div>
      </main>

      {/* RASPADINHA (agora logo após os produtos) */}
      <section className="max-w-md mx-auto px-4 pb-6">
        <div className="text-sm rounded-2xl bg-white border border-[color:var(--line)] p-4 shadow-sm">
          <div className="font-semibold">🎟️ Raspadinha Roxo Sabor</div>
          <p className="text-[color:var(--muted)]">{_STORE.raspadinhaCopy}</p>
          <div className="mt-3 flex gap-2">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Digite seu código"
              className="flex-1 px-3 py-2 rounded-xl bg-white border border-[color:var(--line)] outline-none"
            />
            <button
              onClick={applyCoupon}
              className="px-3 py-2 rounded-xl bg-[--primary] text-white hover:opacity-90"
            >
              Validar
            </button>
          </div>
          {couponInfo && (
            <div className="mt-2 text-xs px-3 py-2 rounded-lg border border-[color:var(--line)] bg-[color:var(--chip)]">
              ✅ {couponInfo.label}
            </div>
          )}
        </div>
      </section>

      {/* CARRINHO */}
      <section id="carrinho" className="max-w-md mx-auto px-4 pb-12">
        {/* ... código do carrinho igual ao anterior ... */}
      </section>

      <footer className="py-10 text-center text-xs text-[color:var(--muted)]">
        <div>
          {_BRAND.name} • {_STORE.deliveryHours}
        </div>
        <div>Feito com ❤️ para vender mais açaí</div>
      </footer>

      {/* THEME FIXO (claro) */}
      <style jsx global>{`
        :root {
          --primary: ${_BRAND.colors.primary};
          --primaryDark: ${_BRAND.colors.primaryDark};
          --accent: ${_BRAND.colors.accent};
          --bg: #f7f7fb;
          --fg: #0f172a;
          --muted: #475569;
          --line: #e5e7eb;
          --card: #ffffff;
          --chip: #f1f5f9;
        }
        html, body {
          background: var(--bg);
          color: var(--fg);
        }
      `}</style>
    </div>
  );
}

/* === Componentes auxiliares === */
function ProductRow({ product, onClick, first }) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-4 text-left block ${
        !first ? "border-t border-[color:var(--line)]" : ""
      }`}
    >
      <div className="flex gap-3">
        <div className="flex-1">
          <h3 className="font-semibold leading-snug">{product.name}</h3>
          {product.desc && (
            <p className="mt-1 line-clamp-2 text-sm text-[color:var(--muted)]">
              {product.desc}
            </p>
          )}
          <div className="mt-2 font-semibold">{currency(product.price)}</div>
        </div>
        <img
          src={product.img}
          className="h-24 w-24 rounded-2xl object-cover border border-[color:var(--line)]"
          alt={product.name}
        />
      </div>
    </button>
  );
}