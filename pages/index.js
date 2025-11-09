// pages/index.js
import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/router";

const LS_KEY = "ilumo_cfg_v2";

// ===== DEFAULTS (usados até o painel carregar) =====
const BRAND_FALLBACK = {
  name: "Roxo Sabor",
  logoText: "ROXO SABOR",
  colors: {
    primary: "#6D28D9",
    primaryDark: "#4C1D95",
    accent: "#22C55E",
    lightBg: "#f7f7fb",
    lightFg: "#0f172a",
    darkBg: "#0b0b0b",   // mantidos só para compatibilidade, não usamos tema escuro
    darkFg: "#eaeaea",
    cardDark: "#121212",
    cardLight: "#ffffff",
  },
};

const STORE_FALLBACK = {
  whatsapp: "+55 31 993006358",
  instagram: "@roxosaboroficial",
  deliveryHours: "Todos os dias, 14h às 23h",
  raspadinhaCopy:
    "Raspou, achou, ganhou! Digite seu código para validar seu prêmio.",
  logoUrl: "",    // preenchidos pelo painel
  bannerUrl: "",  // preenchidos pelo painel
};

const COUPONS_FALLBACK = {
  ROXO10: { type: "percent", value: 10, label: "10% de desconto aplicado" },
  FRETEGRATIS: { type: "msg", label: "Frete grátis na próxima compra!" },
  ADICIONAL: { type: "msg", label: "Um adicional grátis no próximo açaí!" },
};

const CATEGORIES_FALLBACK = [
  { id: "promos", name: "Promoções" },
  { id: "acai", name: "Açaí no Copo" },
  { id: "combos", name: "Combos" },
  { id: "adicionais", name: "Adicionais" },
  { id: "bebidas", name: "Bebidas" },
];

const ADDONS_FALLBACK = [
  { id: "leiteNinho", name: "Leite Ninho", price: 1.0 },
  { id: "nutella", name: "Nutella", price: 4.5 },
  { id: "morango", name: "Morango", price: 3.0 },
  { id: "banana", name: "Banana", price: 2.5 },
  { id: "granola", name: "Granola", price: 2.0 },
  { id: "leiteCondensado", name: "Leite Condensado", price: 2.5 },
];

const PRODUCTS_FALLBACK = [
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
  ...ADDONS_FALLBACK.map((a) => ({
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

  // ===== Lê overrides do painel (localStorage) =====
  const [ov, setOv] = useState(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setOv(JSON.parse(raw));
    } catch {}
  }, []);
  const BRAND = ov?.brand ?? BRAND_FALLBACK;
  const STORE = { ...STORE_FALLBACK, ...(ov?.store || {}) };
  const CATEGORIES = ov?.categories ?? CATEGORIES_FALLBACK;
  const ADDONS = ov?.addons ?? ADDONS_FALLBACK;
  const PRODUCTS = ov?.products ?? PRODUCTS_FALLBACK;
  const COUPONS = ov?.coupons ?? COUPONS_FALLBACK;

  // ===== Estados =====
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
    return PRODUCTS.filter(
      (p) =>
        (category ? p.category === category : true) &&
        (query
          ? (p.name + " " + (p.desc || ""))
              .toLowerCase()
              .includes(query.toLowerCase())
          : true)
    );
  }, [PRODUCTS, category, query]);

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
      {/* HEADER (sem botão de tema) */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[color:var(--line)]">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <div className="mx-auto text-center">
            <div className="text-sm text-[color:var(--muted)]">{BRAND.name}</div>
            <div className="text-xs text-[color:var(--muted)]">
              {STORE.deliveryHours}
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

      {/* HERO (usa banner/logo do painel se houver) */}
      <section className="max-w-md mx-auto">
        <div className="relative overflow-hidden">
          <img
            src={STORE.bannerUrl || "/hero.jpg"}
            className="h-28 w-full object-cover"
            alt=""
            onError={(e) => (e.currentTarget.src = "/hero.jpg")}
          />
          <div className="mx-4 -mt-10 rounded-3xl bg-white p-4 shadow-md border border-[color:var(--line)]">
            <div className="flex items-center gap-3">
              <img
                src={STORE.logoUrl || "/logo-roxo.png"}
                className="h-14 w-14 rounded-full border border-[color:var(--line)] object-cover bg-white"
                alt="Logo"
                onError={(e) => (e.currentTarget.src = "/logo-roxo.png")}
              />
              <div className="flex-1">
                <h1 className="text-lg font-semibold">
                  {BRAND.name} - Bairro Progresso
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

      {/* BUSCA / CATEGORIAS / CUPOM */}
      <section className="max-w-md mx-auto px-4 pt-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar no cardápio…"
          className="w-full px-4 py-3 rounded-2xl bg-white border border-[color:var(--line)] outline-none shadow-sm"
        />

        <div className="mt-3 flex flex-wrap gap-8">
          {CATEGORIES.map((c) => (
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

        <div className="mt-4 text-sm rounded-2xl bg-white border border-[color:var(--line)] p-4 shadow-sm">
          <div className="font-semibold">🎟️ Raspadinha Roxo Sabor</div>
          <p className="text-[color:var(--muted)]">{STORE.raspadinhaCopy}</p>
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

      {/* LISTA DE PRODUTOS */}
      <main className="max-w-md mx-auto px-2 pb-20">
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

      {/* CARRINHO */}
      <section id="carrinho" className="max-w-md mx-auto px-4 pb-12">
        <div className="rounded-2xl overflow-hidden border border-[color:var(--line)] bg-white shadow-lg">
          <div className="grid md:grid-cols-[2fr_1fr] gap-0">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight">Seu pedido</h2>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-sm text-[color:var(--muted)] hover:opacity-100"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="py-8 text-sm text-[color:var(--muted)]">
                  Seu carrinho está vazio. Adicione itens do cardápio para
                  finalizar o pedido.
                </div>
              ) : (
                <ul className="mt-3 divide-y divide-[color:var(--line)]">
                  {cart.map((i) => (
                    <li key={i.id} className="py-3 flex gap-3 items-start">
                      <div className="w-10 h-10 rounded-lg bg-[color:var(--chip)] grid place-items-center">
                        🍧
                      </div>
                      <div className="grow">
                        <div className="font-medium leading-tight">
                          {i.name}
                          {i.size ? (
                            <span className="text-[color:var(--muted)]">
                              {" "}
                              ({i.size.label})
                            </span>
                          ) : null}
                          {i.qty ? (
                            <span className="text-[color:var(--muted)]">
                              {" "}
                              × {i.qty}
                            </span>
                          ) : null}
                        </div>
                        {i.addons?.length ? (
                          <div className="text-xs text-[color:var(--muted)]">
                            Adicionais: {i.addons.map((a) => a.name).join(", ")}
                          </div>
                        ) : null}
                        {i.obs ? (
                          <div className="text-xs text-[color:var(--muted)]">
                            Obs: {i.obs}
                          </div>
                        ) : null}
                        <div className="text-sm mt-1">{currency(i.subtotal)}</div>
                      </div>
                      <button
                        onClick={() => removeFromCart(i.id)}
                        className="px-2 py-1 rounded-lg border border-[color:var(--line)] hover:bg-[color:var(--chip)] text-xs"
                      >
                        remover
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <CartSummary
              subtotal={subtotal}
              discount={discount}
              total={total}
              note={note}
              setNote={setNote}
              customer={customer}
              setCustomer={setCustomer}
              checkoutMP={checkoutMP}
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 text-center text-xs text-[color:var(--muted)]">
        <div>
          {BRAND.name} • {STORE.deliveryHours}
        </div>
        <div>Feito com ❤️ para vender mais açaí</div>
      </footer>

      {/* THEME (apenas claro) */}
      <style jsx global>{`
        :root {
          --primary: ${BRAND.colors.primary};
          --primaryDark: ${BRAND.colors.primaryDark};
          --accent: ${BRAND.colors.accent};
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

function ProductRow({ product, onClick, first }) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-4 text-left block ${
        !first ? "border-t border-[color:var(--line)]" : ""
      }`}
    >
      {product.tags?.includes("popular") && (
        <span className="mb-2 inline-block rounded-full bg-[color:var(--chip)] border border-[color:var(--line)] px-2 py-0.5 text-xs text-[color:var(--muted)]">
          O mais pedido
        </span>
      )}
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
          onError={(e) => (e.currentTarget.style.visibility = "hidden")}
        />
      </div>
    </button>
  );
}

function ItemSheet({ open, onClose, product, onConfirm, addonsList = [] }) {
  const [qty, setQty] = useState(1);
  const [noteItem, setNoteItem] = useState("");
  const [selectedSize, setSelectedSize] = useState(null);
  const [picked, setPicked] = useState(new Set());

  useEffect(() => {
    if (product?.sizes?.length) setSelectedSize(product.sizes[0]);
    else setSelectedSize(null);
    setPicked(new Set());
    setQty(1);
    setNoteItem("");
  }, [product]);

  if (!open || !product) return null;

  const MAX = 3;
  const base = selectedSize ? selectedSize.price : product.price;
  const addons = addonsList.filter((a) => picked.has(a.id));
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
    <div
      className="fixed inset-0 z-50 grid grid-rows-[1fr_auto] bg-black/30"
      onClick={onClose}
    >
      <div
        className="mt-auto rounded-t-3xl bg-white border border-[color:var(--line)] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-40 w-full overflow-hidden rounded-t-3xl">
          <img src={product.img} className="h-full w-full object-cover" />
        </div>

        <div className="p-4">
          <h2 className="text-xl font-semibold">{product.name}</h2>
          <div className="mt-1 text-[color:var(--muted)]">
            {product.desc || "Monte como preferir"}
          </div>

          {product.sizes?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s.code}
                  onClick={() => setSelectedSize(s)}
                  className={`px-3 py-1.5 rounded-xl border text-sm ${
                    selectedSize?.code === s.code
                      ? "border-[--primary] bg-[color:var(--chip)]"
                      : "border-[color:var(--line)] bg-white"
                  }`}
                >
                  {s.label} • {currency(s.price)}
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-4">
            <div className="mb-2 text-base font-semibold">
              Turbine Seu Açaí{" "}
              <span className="text-[color:var(--muted)]">
                • Escolha até 3 opções
              </span>
            </div>
            <div className="grid gap-2">
              {addonsList.map((o) => {
                const selected = picked.has(o.id);
                const disabled = !selected && picked.size >= 3;
                return (
                  <button
                    key={o.id}
                    disabled={disabled}
                    onClick={() => toggle(o.id)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3 text-left
                      ${
                        selected
                          ? "border-[--primary] bg-[color:var(--chip)]"
                          : "border-[color:var(--line)] bg-white"
                      }
                      ${disabled ? "opacity-50" : ""}`}
                  >
                    <span>{o.name}</span>
                    <span className="text-[color:var(--muted)]">
                      {currency(o.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-base font-semibold">
              Alguma observação?
            </div>
            <textarea
              value={noteItem}
              onChange={(e) => setNoteItem(e.target.value)}
              maxLength={140}
              placeholder="Ex: sem granola, pouco leite condensado"
              className="h-24 w-full rounded-2xl bg-white border border-[color:var(--line)] p-3 outline-none"
            />
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center gap-3 border-t border-[color:var(--line)] bg-white p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="grid h-9 w-9 place-items-center rounded-full border border-[color:var(--line)]"
            >
              −
            </button>
            <div className="w-6 text-center font-semibold">{qty}</div>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="grid h-9 w-9 place-items-center rounded-full border border-[color:var(--line)]"
            >
              +
            </button>
          </div>
          <button
            className="flex-1 rounded-2xl bg-[--primary] py-3 text-center font-semibold text-white hover:opacity-90"
            onClick={confirm}
          >
            Adicionar — {currency(price)}
          </button>
        </div>
      </div>
    </div>
  );
}

function CartSummary({
  subtotal,
  discount,
  total,
  note,
  setNote,
  customer,
  setCustomer,
  checkoutMP,
}) {
  return (
    <div className="p-4 border-t md:border-t-0 md:border-l border-[color:var(--line)] bg-white">
      <div className="grid gap-3">
        <div className="grid gap-1 text-sm">
          <label className="text-[color:var(--muted)]">Observações do pedido</label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex.: Sem granola, pouco leite condensado…"
            className="w-full px-3 py-2 rounded-xl bg-white border border-[color:var(--line)] outline-none"
          />
        </div>

        <div className="grid gap-2 text-sm pt-2">
          <label className="text-[color:var(--muted)]">Seus dados</label>
          <input
            className="px-3 py-2 rounded-xl bg-white border border-[color:var(--line)] outline-none"
            placeholder="Seu nome"
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
          />
        </div>
        <input
          className="px-3 py-2 rounded-xl bg-white border border-[color:var(--line)] outline-none"
          placeholder="Telefone (WhatsApp)"
          value={customer.phone}
          onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
        />
        <input
          className="px-3 py-2 rounded-xl bg-white border border-[color:var(--line)] outline-none"
          placeholder="Endereço (rua, número e bairro)"
          value={customer.address}
          onChange={(e) =>
            setCustomer({ ...customer, address: e.target.value })
          }
        />

        <div className="flex items-center justify-between text-sm pt-2">
          <span className="text-[color:var(--muted)]">Subtotal</span>
          <span>{currency(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-[color:var(--muted)]">Desconto</span>
            <span>- {currency(discount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-base font-semibold border-t border-[color:var(--line)] pt-2">
          <span>Total</span>
          <span>{currency(total)}</span>
        </div>

        <button
          onClick={checkoutMP}
          className="mt-2 px-4 py-3 rounded-2xl text-center font-medium bg-[--primary] text-white hover:opacity-90 disabled:opacity-50"
          disabled={subtotal <= 0}
        >
          Pagar com PIX ou Cartão (Mercado Pago)
        </button>
      </div>
    </div>
  );
}