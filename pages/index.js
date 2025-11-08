// pages/index.js
import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/router";

/**
 * ROXO SABOR — CARDÁPIO DIGITAL (Next.js + Tailwind)
 * -------------------------------------------------
 * ✔️ Tema claro/escuro (persistente)
 * ✔️ Cupom / Raspadinha digital
 * ✔️ Carrinho e checkout Mercado Pago
 * ✔️ Layout “estilo iFood” (header loja, lista com imagem à direita)
 * ✔️ Bottom sheet do item (até 3 opções) + observação + barra fixa
 */

// ====== CONFIGURAÇÕES DE MARCA E LOJA ======
const BRAND = {
  name: "Roxo Sabor",
  logoText: "ROXO SABOR",
  colors: {
    primary: "#6D28D9",
    primaryDark: "#4C1D95",
    accent: "#22C55E",
    lightBg: "#f9f9fb",
    lightFg: "#222",
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
};

// Códigos de raspadinha/cupom
const COUPONS = {
  ROXO10: { type: "percent", value: 10, label: "10% de desconto aplicado" },
  FRETEGRATIS: { type: "msg", label: "Frete grátis na próxima compra!" },
  ADICIONAL: { type: "msg", label: "Um adicional grátis no próximo açaí!" },
};

// ====== DADOS DO CARDÁPIO ======
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
  // PROMOÇÕES
  {
    id: "promo-999",
    category: "promos",
    name: "PROMO • 330 ml por R$ 9,99",
    desc: "Açaí 330 ml com 1 adicional simples.",
    price: 9.99,
    img: "/prod-acai.jpg", // troque para sua imagem
    tags: ["promo", "popular"],
  },
  // AÇAÍ
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
  // COMBOS
  {
    id: "combo-duo",
    category: "combos",
    name: "Combo DUO (2 x 500 ml)",
    desc: "2 copos de 500 ml + 2 adicionais cada.",
    price: 36.9,
    img: "/prod-acai2.jpg",
    tags: ["família"],
  },
  // ADICIONAIS COMO LISTA
  ...ADDONS.map((a) => ({
    id: `addon-${a.id}`,
    category: "adicionais",
    name: a.name,
    desc: "Adicional avulso",
    price: a.price,
    img: "/addon.jpg",
  })),
];

// ====== HELPERS ======
const currency = (n) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ====== COMPONENTE PRINCIPAL ======
export default function RoxoSaborMenu() {
  const router = useRouter();

  // Tema (persistência segura no client)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("themeRS") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("themeRS", theme);
    }
  }, [theme]);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("acai");
  const [cart, setCart] = useState([]);
  const [note, setNote] = useState("");

  // dados do cliente para o checkout
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
  });

  // Cupom
  const [couponCode, setCouponCode] = useState("");
  const [couponInfo, setCouponInfo] = useState(null);

  // Sheet do item
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetProduct, setSheetProduct] = useState(null);

  // Alerta de sucesso ao retornar do Mercado Pago
  useEffect(() => {
    if (router.query.pago === "sucesso") {
      alert("✅ Pedido confirmado! Você receberá o resumo no Telegram.");
    }
  }, [router.query.pago]);

  const filtered = useMemo(() => {
    return PRODUCTS.filter(
      (p) =>
        (category ? p.category === category : true) &&
        (query
          ? (p.name + " " + (p.desc || ""))
              .toLowerCase()
              .includes(query.toLowerCase())
          : true)
    );
  }, [category, query]);

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
    const found = COUPONS[code];
    if (found) setCouponInfo({ ...found, code });
    else setCouponInfo({ type: "msg", label: "Código inválido ou já utilizado." });
  }

  // ====== CHECKOUT MERCADO PAGO ======
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
        customer, // será lido pelo webhook como metadata
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

  // Abertura do sheet
  function openSheet(p) {
    setSheetProduct(p);
    setSheetOpen(true);
  }

  return (
    <div className="min-h-screen text-[15px] bg-[--bg] text-[--fg] transition-colors">
      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/20 border-b border-white/10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/10 hover:bg-white/20"
          >
            {theme === "dark" ? "🌞 Claro" : "🌙 Escuro"}
          </button>
          <div className="mx-auto text-center">
            <div className="text-sm opacity-80">{BRAND.name}</div>
            <div className="text-xs opacity-60">{STORE.deliveryHours}</div>
          </div>
          <a
            href="#carrinho"
            className="px-3 py-1.5 rounded-xl bg-[--primary] hover:opacity-90 transition"
          >
            Carrinho ({cart.length})
          </a>
        </div>
      </header>

      {/* HEADER DA LOJA (estilo iFood) */}
      <section className="max-w-md mx-auto">
        <div className="relative overflow-hidden">
          <img
            src="/hero.jpg"
            className="h-28 w-full object-cover filter grayscale"
            alt=""
          />
          <div className="mx-4 -mt-10 rounded-3xl bg-[--card] border border-white/10 p-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full grid place-items-center border bg-white text-xl">
                🫐
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-semibold">
                  Roxo Sabor - Bairro Progresso
                </h1>
                <div className="mt-0.5 text-sm opacity-70">
                  Entrega rastreável • 2.7 km • Min R$ 20,00
                </div>
                <div className="mt-1 text-sm">⭐ 5,0 (4 avaliações)</div>
              </div>
            </div>
            <div className="mt-3 rounded-xl bg-white/10 p-2 text-center text-sm">
              Loja fechada • Abre amanhã às 09:00
            </div>
          </div>
        </div>
      </section>

      {/* BUSCA + CATEGORIAS + CUPOM */}
      <section className="max-w-md mx-auto px-4 pt-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar no cardápio…"
          className="w-full px-4 py-3 rounded-2xl bg-black/30 border border-white/10 outline-none"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`px-3 py-1.5 rounded-full border transition text-sm ${
                category === c.id
                  ? "bg-white/10 border-white/20"
                  : "bg-transparent border-white/10 hover:bg-white/5"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="mt-4 text-sm rounded-2xl bg-purple-600/15 border border-purple-500/30 p-4">
          <div className="font-semibold">🎟️ Raspadinha Roxo Sabor</div>
          <p className="opacity-90">{STORE.raspadinhaCopy}</p>
          <div className="mt-3 flex gap-2">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Digite seu código"
              className="flex-1 px-3 py-2 rounded-xl bg-black/30 border border-white/10 outline-none"
            />
            <button
              onClick={applyCoupon}
              className="px-3 py-2 rounded-xl bg-[--primary] hover:opacity-90"
            >
              Validar
            </button>
          </div>
          {couponInfo && (
            <div className="mt-2 text-xs px-3 py-2 rounded-lg border border-white/10 bg-black/30">
              ✅ {couponInfo.label}
            </div>
          )}
        </div>
      </section>

      {/* LISTA DE PRODUTOS (estilo iFood: imagem à direita) */}
      <main className="max-w-md mx-auto px-2 pb-20">
        <h2 className="px-2 py-3 text-xl font-semibold">Monte Seu Açaí</h2>
        <div className="rounded-2xl bg-[--card] border border-white/10">
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

      {/* CARRINHO */}
      <section id="carrinho" className="max-w-md mx-auto px-4 pb-12">
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-[--card] shadow-2xl">
          <div className="grid md:grid-cols-[2fr_1fr] gap-0">
            {/* ITENS */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight">Seu pedido</h2>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-sm opacity-70 hover:opacity-100"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="py-8 text-sm opacity-70">
                  Seu carrinho está vazio. Adicione itens do cardápio para
                  finalizar o pedido.
                </div>
              ) : (
                <ul className="mt-3 divide-y divide-white/10">
                  {cart.map((i) => (
                    <li key={i.id} className="py-3 flex gap-3 items-start">
                      <div className="w-10 h-10 rounded-lg bg-black/30 grid place-items-center">
                        🍧
                      </div>
                      <div className="grow">
                        <div className="font-medium leading-tight">
                          {i.name}
                          {i.size ? (
                            <span className="opacity-70"> ({i.size.label})</span>
                          ) : null}
                          {i.qty ? <span className="opacity-70"> × {i.qty}</span> : null}
                        </div>
                        {i.addons?.length ? (
                          <div className="text-xs opacity-70">
                            Adicionais: {i.addons.map((a) => a.name).join(", ")}
                          </div>
                        ) : null}
                        {i.obs ? (
                          <div className="text-xs opacity-60">Obs: {i.obs}</div>
                        ) : null}
                        <div className="text-sm mt-1">{currency(i.subtotal)}</div>
                      </div>
                      <button
                        onClick={() => removeFromCart(i.id)}
                        className="px-2 py-1 rounded-lg border border-white/10 hover:bg-white/5 text-xs"
                      >
                        remover
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* RESUMO + CHECKOUT */}
            <CartSummary
              subtotal={subtotal}
              discount={discount}
              total={total}
              note={note}
              setNote={setNote}
              cart={cart}
              couponCode={couponInfo?.code}
              customer={customer}
              setCustomer={setCustomer}
              checkoutMP={checkoutMP}
            />
          </div>
        </div>
      </section>

      <footer className="py-10 text-center text-xs opacity-60">
        <div>
          {BRAND.name} • {STORE.deliveryHours}
        </div>
        <div>Feito com ❤️ para vender mais açaí</div>
      </footer>

      <style jsx global>{`
        :root {
          --primary: ${BRAND.colors.primary};
          --primaryDark: ${BRAND.colors.primaryDark};
          --accent: ${BRAND.colors.accent};
          --bg: ${BRAND.colors.darkBg};
          --fg: ${BRAND.colors.darkFg};
          --card: ${BRAND.colors.cardDark};
        }
        :root.light {
          --bg: ${BRAND.colors.lightBg};
          --fg: ${BRAND.colors.lightFg};
          --card: ${BRAND.colors.cardLight};
        }
        html.light,
        html.light body {
          background: var(--bg);
          color: var(--fg);
        }
        html.dark,
        html.dark body {
          background: var(--bg);
          color: var(--fg);
        }
      `}</style>

      {/* sincroniza classe html light/dark */}
      <ThemeBinder theme={theme} />

      {/* BOTTOM SHEET DO ITEM */}
      <ItemSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        product={sheetProduct}
        onConfirm={(payload) => {
          addToCart(sheetProduct, payload);
          setSheetOpen(false);
        }}
      />
    </div>
  );
}

function ThemeBinder({ theme }) {
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("light", "dark");
    html.classList.add(theme === "dark" ? "dark" : "light");
  }, [theme]);
  return null;
}

// ====== LINHA DO PRODUTO (imagem à direita) ======
function ProductRow({ product, onClick, first }) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-4 text-left block ${
        !first ? "border-t border-white/10" : ""
      }`}
    >
      {product.tags?.includes("popular") && (
        <span className="mb-2 inline-block rounded-full bg-amber-100/10 border border-amber-200/20 px-2 py-0.5 text-xs text-amber-200">
          O mais pedido
        </span>
      )}
      <div className="flex gap-3">
        <div className="flex-1">
          <h3 className="font-semibold leading-snug">{product.name}</h3>
          {product.desc && (
            <p className="mt-1 line-clamp-2 text-sm opacity-70">{product.desc}</p>
          )}
          <div className="mt-2 font-semibold">
            {currency(product.price)}
          </div>
        </div>
        <img
          src={product.img}
          className="h-24 w-24 rounded-2xl object-cover"
          alt={product.name}
        />
      </div>
    </button>
  );
}

// ====== BOTTOM SHEET ======
function ItemSheet({ open, onClose, product, onConfirm }) {
  const [qty, setQty] = useState(1);
  const [noteItem, setNoteItem] = useState("");
  const [selectedSize, setSelectedSize] = useState(null);
  const [picked, setPicked] = useState(new Set()); // até 3

  useEffect(() => {
    if (product?.sizes?.length) setSelectedSize(product.sizes[0]);
    setPicked(new Set());
    setQty(1);
    setNoteItem("");
  }, [product]);

  if (!open || !product) return null;

  const MAX = 3;
  const base = selectedSize ? selectedSize.price : product.price;
  const addons = ADDONS.filter((a) => picked.has(a.id));
  const addonsTotal = addons.reduce((s, a) => s + a.price, 0);
  const price = (base + addonsTotal) * qty;

  function toggle(optId) {
    setPicked((prev) => {
      const n = new Set(prev);
      if (n.has(optId)) n.delete(optId);
      else {
        if (n.size >= MAX) n.delete(n.values().next().value);
        n.add(optId);
      }
      return n;
    });
  }

  function confirm() {
    onConfirm({
      size: selectedSize,
      addons,
      qty,
      obs: noteItem,
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid grid-rows-[1fr_auto] bg-black/60" onClick={onClose}>
      <div className="mt-auto rounded-t-3xl bg-[--card] border border-white/10" onClick={(e)=>e.stopPropagation()}>
        <div className="h-40 w-full overflow-hidden rounded-t-3xl">
          <img src={product.img} className="h-full w-full object-cover" />
        </div>

        <div className="p-4">
          <h2 className="text-xl font-semibold">{product.name}</h2>
          <div className="mt-1 opacity-70">
            {product.desc || "Monte como preferir"}
          </div>

          {/* tamanhos */}
          {product.sizes?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s.code}
                  onClick={() => setSelectedSize(s)}
                  className={`px-3 py-1.5 rounded-xl border text-sm ${
                    selectedSize?.code === s.code
                      ? "bg-white/10 border-white/20"
                      : "bg-transparent border-white/10 hover:bg-white/5"
                  }`}
                >
                  {s.label} • {currency(s.price)}
                </button>
              ))}
            </div>
          ) : null}

          {/* grupo de opções */}
          <div className="mt-4">
            <div className="mb-2 text-base font-semibold">
              Turbine Seu Açaí{" "}
              <span className="opacity-70">• Escolha até {MAX} opções</span>
            </div>
            <div className="grid gap-2">
              {ADDONS.map((o) => {
                const selected = picked.has(o.id);
                const disabled = !selected && picked.size >= MAX;
                return (
                  <button
                    key={o.id}
                    disabled={disabled}
                    onClick={() => toggle(o.id)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3 text-left
                      ${selected ? "border-[--primary] bg-white/5" : "border-white/10"}
                      ${disabled ? "opacity-50" : ""}`}
                  >
                    <span>{o.name}</span>
                    <span className="opacity-70">{currency(o.price)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* observação */}
          <div className="mt-4">
            <div className="mb-2 text-base font-semibold">Alguma observação?</div>
            <textarea
              value={noteItem}
              onChange={(e)=>setNoteItem(e.target.value)}
              maxLength={140}
              placeholder="Ex: sem granola, pouco leite condensado"
              className="h-24 w-full rounded-2xl bg-black/30 border border-white/10 p-3 outline-none"
            />
          </div>
        </div>

        {/* barra fixa */}
        <div className="sticky bottom-0 flex items-center gap-3 border-t border-white/10 bg-[--card] p-4">
          <div className="flex items-center gap-3">
            <button onClick={()=>setQty(q=>Math.max(1,q-1))}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10">−</button>
            <div className="w-6 text-center font-semibold">{qty}</div>
            <button onClick={()=>setQty(q=>q+1)}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10">+</button>
          </div>
          <button
            className="flex-1 rounded-2xl bg-[--primary] py-3 text-center font-semibold hover:opacity-90"
            onClick={confirm}
          >
            Adicionar — {currency(price)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ====== CART SUMMARY ======
function CartSummary({
  subtotal,
  discount,
  total,
  note,
  setNote,
  cart,
  couponCode,
  customer,
  setCustomer,
  checkoutMP,
}) {
  return (
    <div className="p-4 border-t md:border-t-0 md:border-l border-white/10 bg-black/10">
      <div className="grid gap-3">
        <div className="grid gap-1 text-sm">
          <label className="opacity-80">Observações do pedido</label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex.: Sem granola, pouco leite condensado…"
            className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 outline-none"
          />
        </div>

        {/* DADOS DO CLIENTE */}
        <div className="grid gap-2 text-sm pt-2">
          <label className="opacity-80">Seus dados</label>
          <input
            className="px-3 py-2 rounded-xl bg-black/30 border border-white/10 outline-none"
            placeholder="Seu nome"
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
          />
          <input
            className="px-3 py-2 rounded-xl bg-black/30 border border-white/10 outline-none"
            placeholder="Telefone (WhatsApp)"
            value={customer.phone}
            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
          />
          <input
            className="px-3 py-2 rounded-xl bg-black/30 border border-white/10 outline-none"
            placeholder="Endereço (rua, número e bairro)"
            value={customer.address}
            onChange={(e) =>
              setCustomer({ ...customer, address: e.target.value })
            }
          />
        </div>

        <div className="flex items-center justify-between text-sm pt-2">
          <span>Subtotal</span>
          <span>{currency(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span>Desconto ({couponCode})</span>
            <span>- {currency(discount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-base font-semibold border-t border-white/10 pt-2">
          <span>Total</span>
          <span>{currency(total)}</span>
        </div>

        {/* BOTÃO PAGAR */}
        <button
          onClick={checkoutMP}
          disabled={!cart.length}
          className={`mt-2 px-4 py-3 rounded-2xl text-center font-medium ${
            cart.length === 0
              ? "pointer-events-none opacity-50 bg-white/10"
              : "bg-[--primary] hover:opacity-90"
          }`}
        >
          Pagar com PIX ou Cartão (Mercado Pago)
        </button>
      </div>
    </div>
  );
              }
