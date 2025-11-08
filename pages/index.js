// pages/index.js
import React, { useEffect, useMemo, useState } from "react";

const LS_KEY = "ilumo_cfg_v1";

// fallback se não houver nada salvo no painel ainda
const defaults = {
  store: {
    name: "Roxo Sabor",
    whatsapp: "31984853327",
    instagram: "@roxosaboroficial",
    bannerUrl: "",
    logoUrl: "",
    deliveryHours: "Todos os dias, 14h às 23h",
    closedNote: "",
    raspadinhaCopy: "Raspou, achou, ganhou! Digite o código para validar.",
    theme: "light",
    primary: "#6D28D9",
  },
  categories: [{ id: "acai", name: "Açaí" }],
  addons: [],
  products: [],
  coupons: {},
};

const BRL = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Site() {
  const [cfg, setCfg] = useState(defaults);
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setCfg({ ...defaults, ...JSON.parse(raw) });
    } catch {}
  }, []);

  useEffect(() => {
    if (!category && cfg.categories?.length) setCategory(cfg.categories[0].id);
  }, [cfg.categories, category]);

  const filtered = useMemo(() => {
    let list = cfg.products || [];
    if (category) list = list.filter((p) => p.category === category);
    if (query) list = list.filter((p) => (p.name + " " + (p.desc || "")).toLowerCase().includes(query.toLowerCase()));
    return list;
  }, [cfg.products, category, query]);

  function addToCart(p) {
    const subtotal = p.price;
    setCart((old) => [...old, { id: Date.now(), name: p.name, subtotal }]);
  }
  const subtotal = cart.reduce((s, i) => s + i.subtotal, 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      {/* Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur border-b border-[#e5e7eb]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: cfg.store.primary }}>
            🫐
          </div>
          <div className="mr-auto">
            <div className="font-semibold">{cfg.store.name}</div>
            <div className="text-xs text-[#64748b]">{cfg.store.deliveryHours}</div>
          </div>
          <a href="#carrinho" className="btn-primary">Carrinho ({cart.length})</a>
        </div>
      </header>

      {/* Banner */}
      {cfg.store.bannerUrl ? (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <img src={cfg.store.bannerUrl} alt="" className="w-full h-48 md:h-60 object-cover rounded-2xl border border-[#e5e7eb]" />
        </div>
      ) : null}

      {/* Filtros */}
      <section className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex flex-wrap gap-2">
          {(cfg.categories || []).map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl border ${
                c.id === category ? "bg-[#ede9fe] border-[#d9d6fe]" : "bg-white border-[#e5e7eb]"
              }`}
            >
              {c.name}
            </button>
          ))}
          <input
            className="input ml-auto"
            placeholder="Buscar…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </section>

      {/* Produtos */}
      <main className="max-w-6xl mx-auto px-4 pb-20 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden flex flex-col">
            <div className="h-40 bg-[#f1f5f9] grid place-items-center">
              {p.img ? <img src={p.img} className="w-full h-full object-cover" alt="" /> : "🍧"}
            </div>
            <div className="p-4 grow flex flex-col">
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-[#64748b]">{p.desc}</div>
              <div className="mt-auto flex items-center justify-between">
                <div className="font-semibold">{BRL(p.price || 0)}</div>
                <button className="btn-primary" onClick={() => addToCart(p)}>Adicionar</button>
              </div>
            </div>
          </div>
        ))}
        {!filtered.length && (
          <div className="col-span-full text-center text-[#64748b]">Nada por aqui…</div>
        )}
      </main>

      {/* Carrinho */}
      <section id="carrinho" className="max-w-6xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-4">
          <h2 className="font-semibold">Seu pedido</h2>
          {cart.length === 0 ? (
            <div className="text-sm text-[#64748b] py-6">Use o cardápio para adicionar itens.</div>
          ) : (
            <>
              <ul className="divide-y divide-[#e5e7eb] my-3">
                {cart.map((i) => (
                  <li key={i.id} className="py-2 flex justify-between">
                    <span>{i.name}</span>
                    <span>{BRL(i.subtotal)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{BRL(subtotal)}</span>
              </div>
              <a className="btn-primary mt-3 inline-block" href={`https://wa.me/55${cfg.store.whatsapp}?text=Olá,%20quero%20finalizar%20um%20pedido!`}>
                Pedir no WhatsApp
              </a>
            </>
          )}
        </div>
      </section>

      <Style />
    </div>
  );
}

function Style() {
  return (
    <style jsx global>{`
      .input {
        width: 100%;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        background: #fff;
        outline: none;
      }
      .btn-primary {
        padding: 10px 14px;
        border-radius: 10px;
        background: #6D28D9;
        color: #fff !important;
      }
    `}</style>
  );
}