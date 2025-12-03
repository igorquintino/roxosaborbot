// pages/admin.js
import React, { useEffect, useMemo, useState } from "react";

/* ==============================
   Armazenamento e segurança
================================= */
const LS_KEY = "ilumo_cfg_v2";
const LS_KEY_CHUNKS = LS_KEY + ":chunks";
const ADMIN_OK_KEY = "rs_admin_ok";
const PIN_ENV = process.env.NEXT_PUBLIC_ADMIN_PIN || "";

/* Salva JSON grande em chunks para evitar limite do localStorage (5MB/item) */
function saveBigJSON(key, obj) {
  const str = JSON.stringify(obj);
  try {
    localStorage.setItem(key, str);          // tenta salvar normal
    localStorage.removeItem(LS_KEY_CHUNKS);  // limpa chunks antigos
    let i = 0;
    while (localStorage.getItem(`${key}:${i}`)) {
      localStorage.removeItem(`${key}:${i++}`);
    }
    return;
  } catch {
    // fallback: split em ~400k chars
    const CHUNK = 400000;
    const total = Math.ceil(str.length / CHUNK);
    localStorage.setItem(LS_KEY_CHUNKS, String(total));
    for (let i = 0; i < total; i++) {
      localStorage.setItem(`${key}:${i}`, str.slice(i * CHUNK, (i + 1) * CHUNK));
    }
  }
}

/* Lê JSON salvo em chunks (ou normal) */
function loadBigJSON(key) {
  const chunkCount = Number(localStorage.getItem(LS_KEY_CHUNKS) || 0);
  if (!chunkCount) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }
  let str = "";
  for (let i = 0; i < chunkCount; i++) {
    str += localStorage.getItem(`${key}:${i}`) || "";
  }
  return str ? JSON.parse(str) : null;
}

/* ==============================
   Helpers
================================= */
const jclone = (o) => JSON.parse(JSON.stringify(o ?? {}));

async function fileToDataURLCompressed(file, { maxW = 1000, maxKB = 280 } = {}) {
  const dataUrl = await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });

  // cria imagem
  const img = await new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = dataUrl;
  });

  // canvas scale
  const scale = Math.min(1, maxW / (img.width || maxW));
  const w = Math.max(1, Math.round((img.width || maxW) * scale));
  const h = Math.max(1, Math.round((img.height || maxW) * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);

  // qualidade adaptativa até atingir ~maxKB
  let q = 0.92;
  let out = canvas.toDataURL("image/jpeg", q);
  const maxBytes = maxKB * 1024;

  while (out.length > maxBytes * 1.37 && q > 0.4) { // 1.37 ≈ overhead base64
    q -= 0.08;
    out = canvas.toDataURL("image/jpeg", q);
  }
  return out;
}

/* ==============================
   Defaults (compatíveis com index)
================================= */
const DEFAULT_CFG = {
  brand: {
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
  },
  store: {
    whatsapp: "+55 31 993006358",
    instagram: "@roxosaboroficial",
    deliveryHours: "Todos os dias, 14h às 23h",
    raspadinhaCopy:
      "Raspou, achou, ganhou! Digite seu código para validar seu prêmio.",
    logoUrl: "",   // <-- novo
    bannerUrl: "", // <-- novo
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
      price: 9.99,
      img: "/prod-acai.jpg",
      tags: ["promo", "popular"],
      sizes: [],
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
  ],
  coupons: {
    ROXO10: { type: "percent", value: 10, label: "10% de desconto aplicado" },
    FRETEGRATIS: { type: "msg", label: "Frete grátis na próxima compra!" },
    ADICIONAL: { type: "msg", label: "Um adicional grátis no próximo açaí!" },
  },
};

/* Normaliza estrutura */
function normalize(raw) {
  const c = jclone(raw || {});
  c.brand = c.brand || DEFAULT_CFG.brand;
  c.store = { ...DEFAULT_CFG.store, ...(c.store || {}) };
  c.coupons = c.coupons || {};
  c.categories = Array.isArray(c.categories) ? c.categories : [];
  c.addons = Array.isArray(c.addons) ? c.addons : [];
  c.products = Array.isArray(c.products) ? c.products : [];

  c.categories = c.categories.map((x) => ({
    id: String(x?.id || ""),
    name: String(x?.name || ""),
  }));
  c.addons = c.addons.map((x) => ({
    id: String(x?.id || ""),
    name: String(x?.name || ""),
    price: Number(x?.price || 0),
  }));
  c.products = c.products.map((p) => ({
    id: String(p?.id || ""),
    category: String(p?.category || ""),
    name: String(p?.name || ""),
    desc: String(p?.desc || ""),
    price: Number(p?.price || 0),
    img: String(p?.img || ""),
    tags: Array.isArray(p?.tags) ? p.tags.filter(Boolean) : [],
    sizes: Array.isArray(p?.sizes)
      ? p.sizes.map((s) => ({
          code: String(s?.code || ""),
          label: String(s?.label || ""),
          price: Number(s?.price || 0),
        }))
      : [],
  }));
  return c;
}

/* ==============================
   Componente principal
================================= */
export default function Admin() {
  const [mounted, setMounted] = useState(false);
  const [ok, setOk] = useState(false);
  const [pin, setPin] = useState("");
  const [cfg, setCfg] = useState(null);

  useEffect(() => {
    setMounted(true);
    try {
      if (localStorage.getItem(ADMIN_OK_KEY) === "1") setOk(true);
    } catch {}
    try {
      const stored = loadBigJSON(LS_KEY) || DEFAULT_CFG;
      setCfg(normalize(stored));
    } catch {
      setCfg(normalize(DEFAULT_CFG));
    }
  }, []);

  function checkPin(e) {
    e.preventDefault();
    if (pin && PIN_ENV && pin === PIN_ENV) {
      localStorage.setItem(ADMIN_OK_KEY, "1");
      setOk(true);
    } else {
      alert("PIN incorreto.");
    }
  }

  function save() {
    try {
      saveBigJSON(LS_KEY, normalize(cfg));
      alert("✅ Salvo!");
    } catch {
      alert("Falha ao salvar.");
    }
  }

  function update(path, mutator) {
    setCfg((prev) => {
      const draft = jclone(prev);
      const ref = path.split(".").reduce((acc, k) => acc[k], draft);
      mutator(ref);
      return normalize(draft);
    });
  }

  // Uploads (logo/banner/produto)
  async function handleUpload(setField, opts) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const dataUrl = await fileToDataURLCompressed(f, opts);
      setField(dataUrl);
    };
    input.click();
  }

  if (!mounted) return null;

  if (!ok) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#f7f7fb] text-[#0f172a]">
        <form
          onSubmit={checkPin}
          className="rounded-2xl bg-white border border-[#e5e7eb] p-6 w-full max-w-sm shadow-sm"
        >
          <h1 className="text-xl font-semibold">Acesso ao Painel</h1>
          <p className="text-sm text-[#475569] mt-1">Digite o PIN</p>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full mt-4 px-3 py-2 rounded-xl border border-[#e5e7eb] outline-none bg-white"
            placeholder="PIN"
          />
          <button className="mt-3 w-full rounded-xl bg-[#6D28D9] text-white py-2.5 hover:opacity-90">
            Entrar
          </button>
          <a
            href="/"
            className="block mt-3 text-center text-sm text-[#475569] underline"
          >
            Voltar ao site
          </a>
        </form>
      </div>
    );
  }

  if (!cfg)
    return <div className="min-h-screen grid place-items-center">Carregando…</div>;

  return (
    <div className="min-h-screen bg-[#f7f7fb] text-[#0f172a]">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#e5e7eb]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2">
          <a
            href="/"
            className="px-3 py-1.5 rounded-xl border border-[#e5e7eb] bg-white hover:bg-[#f1f5f9]"
          >
            ← Voltar
          </a>
          <div className="mx-auto text-sm">
            Painel Ilumo • editar loja e cardápio
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const b = new Blob([JSON.stringify(cfg, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(b);
                const a = document.createElement("a");
                a.href = url;
                a.download = "ilumo_cfg_v2.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-1.5 rounded-xl border border-[#e5e7eb] bg-white hover:bg-[#f1f5f9]"
            >
              Exportar
            </button>
            <label className="px-3 py-1.5 rounded-xl border border-[#e5e7eb] bg-white hover:bg-[#f1f5f9] cursor-pointer">
              Importar
              <input
                type="file"
                accept="application/json"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const r = new FileReader();
                  r.onload = () => {
                    try {
                      setCfg(normalize(JSON.parse(String(r.result))));
                      alert("✅ Config carregada (salve para aplicar)!");
                    } catch {
                      alert("Arquivo inválido.");
                    }
                  };
                  r.readAsText(f);
                }}
                className="hidden"
              />
            </label>
            <button
              onClick={save}
              className="px-3 py-1.5 rounded-xl bg-[#6D28D9] text-white hover:opacity-90"
            >
              Salvar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 grid lg:grid-cols-2 gap-6">
        {/* Loja */}
        <section className="rounded-2xl bg-white border border-[#e5e7eb] p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Loja</h2>
          <div className="mt-3 grid gap-2">
            <label className="text-sm">Nome</label>
            <input
              className="input"
              value={cfg.brand.name}
              onChange={(e) =>
                setCfg({ ...cfg, brand: { ...cfg.brand, name: e.target.value } })
              }
            />

            <label className="text-sm">Logo (URL ou upload)</label>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input
                className="input"
                value={cfg.store.logoUrl || ""}
                onChange={(e) =>
                  setCfg({
                    ...cfg,
                    store: { ...cfg.store, logoUrl: e.target.value },
                  })
                }
              />
              <button
                className="btn"
                onClick={() =>
                  handleUpload(
                    (dataUrl) =>
                      setCfg((p) => ({
                        ...p,
                        store: { ...p.store, logoUrl: dataUrl },
                      })),
                    { maxW: 400, maxKB: 80 }
                  )
                }
              >
                Upload
              </button>
            </div>
            {cfg.store.logoUrl ? (
              <div className="flex items-center gap-3">
                <img
                  src={cfg.store.logoUrl}
                  alt="logo"
                  className="h-16 w-16 rounded-lg object-cover border border-[#e5e7eb]"
                />
                <button
                  className="btn"
                  onClick={() =>
                    setCfg((p) => ({
                      ...p,
                      store: { ...p.store, logoUrl: "" },
                    }))
                  }
                >
                  Remover
                </button>
              </div>
            ) : null}

            <label className="text-sm mt-2">Banner (URL ou upload)</label>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input
                className="input"
                value={cfg.store.bannerUrl || ""}
                onChange={(e) =>
                  setCfg({
                    ...cfg,
                    store: { ...cfg.store, bannerUrl: e.target.value },
                  })
                }
              />
              <button
                className="btn"
                onClick={() =>
                  handleUpload(
                    (dataUrl) =>
                      setCfg((p) => ({
                        ...p,
                        store: { ...p.store, bannerUrl: dataUrl },
                      })),
                    { maxW: 1400, maxKB: 220 }
                  )
                }
              >
                Upload
              </button>
            </div>
            {cfg.store.bannerUrl ? (
              <div className="mt-2">
                <img
                  src={cfg.store.bannerUrl}
                  alt="banner"
                  className="h-40 w-full object-cover rounded-xl border border-[#e5e7eb]"
                />
                <button
                  className="btn mt-2"
                  onClick={() =>
                    setCfg((p) => ({
                      ...p,
                      store: { ...p.store, bannerUrl: "" },
                    }))
                  }
                >
                  Remover
                </button>
              </div>
            ) : null}

            <label className="text-sm mt-2">WhatsApp</label>
            <input
              className="input"
              value={cfg.store.whatsapp}
              onChange={(e) =>
                setCfg({
                  ...cfg,
                  store: { ...cfg.store, whatsapp: e.target.value },
                })
              }
            />

            <label className="text-sm">Instagram</label>
            <input
              className="input"
              value={cfg.store.instagram}
              onChange={(e) =>
                setCfg({
                  ...cfg,
                  store: { ...cfg.store, instagram: e.target.value },
                })
              }
            />

            <label className="text-sm">Horário</label>
            <input
              className="input"
              value={cfg.store.deliveryHours}
              onChange={(e) =>
                setCfg({
                  ...cfg,
                  store: { ...cfg.store, deliveryHours: e.target.value },
                })
              }
            />

            <label className="text-sm">Texto raspadinha</label>
            <textarea
              className="input h-24"
              value={cfg.store.raspadinhaCopy}
              onChange={(e) =>
                setCfg({
                  ...cfg,
                  store: { ...cfg.store, raspadinhaCopy: e.target.value },
                })
              }
            />
          </div>
        </section>

        {/* Categorias */}
        <section className="rounded-2xl bg-white border border-[#e5e7eb] p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Categorias</h2>
          <div className="mt-3 space-y-2">
            {(cfg.categories || []).map((c, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center"
              >
                <input
                  className="input"
                  placeholder="id"
                  value={c.id}
                  onChange={(e) =>
                    update("categories", (arr) => {
                      arr[idx].id = e.target.value;
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="Nome"
                  value={c.name}
                  onChange={(e) =>
                    update("categories", (arr) => {
                      arr[idx].name = e.target.value;
                    })
                  }
                />
                <button
                  className="btn"
                  onClick={() =>
                    update("categories", (arr) => arr.splice(idx, 1))
                  }
                >
                  Excluir
                </button>
              </div>
            ))}
            <button
              className="btn-primary"
              onClick={() =>
                update("categories", (arr) => arr.push({ id: "", name: "" }))
              }
            >
              + Adicionar categoria
            </button>
          </div>
        </section>

        {/* Adicionais */}
        <section className="rounded-2xl bg-white border border-[#e5e7eb] p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Adicionais</h2>
          <div className="mt-3 space-y-2">
            {(cfg.addons || []).map((a, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center"
              >
                <input
                  className="input"
                  placeholder="id"
                  value={a.id}
                  onChange={(e) =>
                    update("addons", (arr) => {
                      arr[idx].id = e.target.value;
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="Nome"
                  value={a.name}
                  onChange={(e) =>
                    update("addons", (arr) => {
                      arr[idx].name = e.target.value;
                    })
                  }
                />
                <input
                  type="number"
                  className="input"
                  placeholder="Preço"
                  value={a.price}
                  onChange={(e) =>
                    update("addons", (arr) => {
                      arr[idx].price = Number(e.target.value || 0);
                    })
                  }
                />
                <button
                  className="btn"
                  onClick={() =>
                    update("addons", (arr) => arr.splice(idx, 1))
                  }
                >
                  Excluir
                </button>
              </div>
            ))}
            <button
              className="btn-primary"
              onClick={() =>
                update("addons", (arr) =>
                  arr.push({ id: "", name: "", price: 0 })
                )
              }
            >
              + Adicionar adicional
            </button>
          </div>
        </section>

        {/* Produtos */}
        <section className="rounded-2xl bg-white border border-[#e5e7eb] p-4 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold">Produtos</h2>
          <div className="mt-3 space-y-4">
            {(cfg.products || []).map((p, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#e5e7eb] p-3 bg-[#fafafa]"
              >
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <label className="text-sm">ID</label>
                    <input
                      className="input"
                      value={p.id}
                      onChange={(e) =>
                        update("products", (arr) => {
                          arr[idx].id = e.target.value;
                        })
                      }
                    />
                    <label className="text-sm">Categoria (id)</label>
                    <input
                      className="input"
                      value={p.category}
                      onChange={(e) =>
                        update("products", (arr) => {
                          arr[idx].category = e.target.value;
                        })
                      }
                    />
                    <label className="text-sm">Nome</label>
                    <input
                      className="input"
                      value={p.name}
                      onChange={(e) =>
                        update("products", (arr) => {
                          arr[idx].name = e.target.value;
                        })
                      }
                    />
                    <label className="text-sm">Descrição</label>
                    <textarea
                      className="input h-20"
                      value={p.desc || ""}
                      onChange={(e) =>
                        update("products", (arr) => {
                          arr[idx].desc = e.target.value;
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm">Preço base</label>
                    <input
                      type="number"
                      className="input"
                      value={p.price}
                      onChange={(e) =>
                        update("products", (arr) => {
                          arr[idx].price = Number(e.target.value || 0);
                        })
                      }
                    />
                    <label className="text-sm">Imagem (URL/DataURL)</label>
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <input
                        className="input"
                        value={p.img || ""}
                        onChange={(e) =>
                          update("products", (arr) => {
                            arr[idx].img = e.target.value;
                          })
                        }
                      />
                      <button
                        className="btn"
                        onClick={() =>
                          handleUpload(
                            (dataUrl) =>
                              setCfg((prev) => {
                                const draft = jclone(prev);
                                draft.products[idx].img = dataUrl;
                                return draft;
                              }),
                            { maxW: 1000, maxKB: 180 }
                          )
                        }
                      >
                        Upload
                      </button>
                    </div>
                    {p.img ? (
                      <img
                        src={p.img}
                        alt=""
                        className="h-28 w-28 rounded-xl object-cover border border-[#e5e7eb]"
                      />
                    ) : null}
                    <label className="text-sm">Tags (vírgula)</label>
                    <input
                      className="input"
                      value={(p.tags || []).join(",")}
                      onChange={(e) =>
                        update("products", (arr) => {
                          arr[idx].tags = e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                        })
                      }
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="font-medium">Tamanhos (opcional)</div>
                  <div className="mt-2 space-y-2">
                    {(p.sizes || []).map((s, sidx) => (
                      <div
                        key={sidx}
                        className="grid grid-cols-[1fr_2fr_1fr_auto] gap-2 items-center"
                      >
                        <input
                          className="input"
                          placeholder="code"
                          value={s.code}
                          onChange={(e) =>
                            update("products", (arr) => {
                              arr[idx].sizes[sidx].code = e.target.value;
                            })
                          }
                        />
                        <input
                          className="input"
                          placeholder="label"
                          value={s.label}
                          onChange={(e) =>
                            update("products", (arr) => {
                              arr[idx].sizes[sidx].label = e.target.value;
                            })
                          }
                        />
                        <input
                          type="number"
                          className="input"
                          placeholder="price"
                          value={s.price}
                          onChange={(e) =>
                            update("products", (arr) => {
                              arr[idx].sizes[sidx].price = Number(
                                e.target.value || 0
                              );
                            })
                          }
                        />
                        <button
                          className="btn"
                          onClick={() =>
                            update("products", (arr) =>
                              arr[idx].sizes.splice(sidx, 1)
                            )
                          }
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                    <button
                      className="btn"
                      onClick={() =>
                        update("products", (arr) => {
                          arr[idx].sizes = arr[idx].sizes || [];
                          arr[idx].sizes.push({
                            code: "",
                            label: "",
                            price: 0,
                          });
                        })
                      }
                    >
                      + Adicionar tamanho
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex justify-between">
                  <button
                    className="btn"
                    onClick={() =>
                      update("products", (arr) => arr.splice(idx, 1))
                    }
                  >
                    Excluir produto
                  </button>
                </div>
              </div>
            ))}
            <button
              className="btn-primary"
              onClick={() =>
                update("products", (arr) =>
                  arr.push({
                    id: "",
                    category: "",
                    name: "",
                    desc: "",
                    price: 0,
                    img: "",
                    tags: [],
                    sizes: [],
                  })
                )
              }
            >
              + Adicionar produto
            </button>
          </div>
        </section>

        {/* Cupons */}
        <section className="rounded-2xl bg-white border border-[#e5e7eb] p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Cupons / Raspadinha</h2>
          <CouponEditor cfg={cfg} setCfg={setCfg} />
          <div className="mt-4 flex gap-2">
            <button onClick={save} className="btn-primary">
              Salvar
            </button>
            <button
              onClick={() => {
                localStorage.removeItem(LS_KEY);
                localStorage.removeItem(LS_KEY_CHUNKS);
                location.reload();
              }}
              className="btn"
            >
              Limpar tudo
            </button>
          </div>
        </section>
      </main>

      <style jsx global>{`
        .input {
          width: 100%;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #fff;
          outline: none;
        }
        .btn {
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          background: #fff;
        }
        .btn-primary {
          padding: 8px 12px;
          border-radius: 10px;
          background: #6d28d9;
          color: #fff;
        }
      `}</style>
    </div>
  );
}

/* ==============================
   Editor de Cupons
================================= */
function CouponEditor({ cfg, setCfg }) {
  const entries = useMemo(
    () => Object.entries(cfg.coupons || {}),
    [cfg.coupons]
  );

  function setField(code, key, value) {
    setCfg((prev) => {
      const draft = jclone(prev);
      draft.coupons = draft.coupons || {};
      draft.coupons[code] = draft.coupons[code] || {};
      draft.coupons[code][key] = value;
      return normalize(draft);
    });
  }

  function addCoupon() {
    const code = prompt("Código do cupom (ex.: ROXO10)");
    if (!code) return;
    setCfg((prev) => {
      const draft = jclone(prev);
      draft.coupons = draft.coupons || {};
      draft.coupons[code.toUpperCase()] = {
        type: "percent",
        value: 10,
        label: "10% de desconto aplicado",
      };
      return normalize(draft);
    });
  }

  function removeCoupon(code) {
    setCfg((prev) => {
      const draft = jclone(prev);
      if (draft.coupons) delete draft.coupons[code];
      return normalize(draft);
    });
  }

  return (
    <div className="mt-3 space-y-3">
      {entries.map(([code, c]) => (
        <div
          key={code}
          className="rounded-xl border border-[#e5e7eb] p-3 bg-[#fafafa]"
        >
          <div className="font-semibold">{code}</div>
          <div className="grid md:grid-cols-3 gap-2 mt-2">
            <select
              className="input"
              value={c.type || "percent"}
              onChange={(e) => setField(code, "type", e.target.value)}
            >
              <option value="percent">percent</option>
              <option value="msg">msg</option>
            </select>
            <input
              className="input"
              type="number"
              placeholder="valor (%)"
              value={c.value ?? 0}
              onChange={(e) =>
                setField(code, "value", Number(e.target.value || 0))
              }
            />
            <input
              className="input"
              placeholder="label"
              value={c.label || ""}
              onChange={(e) => setField(code, "label", e.target.value)}
            />
          </div>
          <div className="mt-2">
            <button className="btn" onClick={() => removeCoupon(code)}>
              Remover cupom
            </button>
          </div>
        </div>
      ))}
      <button className="btn-primary" onClick={addCoupon}>
        + Adicionar cupom
      </button>
    </div>
  );
}
