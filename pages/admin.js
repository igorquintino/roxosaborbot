import React, { useEffect, useMemo, useState } from "react";

const LS_KEY = "ilumo_cfg_v1";
const ADMIN_OK_KEY = "rs_admin_ok";
const PIN_ENV = process.env.NEXT_PUBLIC_ADMIN_PIN || "";

// Clone compatível com qualquer browser
const jclone = (o) => JSON.parse(JSON.stringify(o ?? {}));

// Defaults bem simples (não quebram se lidos “crus”)
const DEFAULT_CFG = {
  store: {
    name: "Roxo Sabor",
    whatsapp: "",
    instagram: "@roxosaboroficial",
    deliveryHours: "Todos os dias, 14h às 23h",
    bannerUrl: "",
    logoUrl: "",
    closedNote: "",
    raspadinhaCopy:
      "Raspou, achou, ganhou! Digite seu código para validar seu prêmio.",
  },
  categories: [{ id: "acai", name: "Açaí no Copo" }],
  addons: [{ id: "granola", name: "Granola", price: 2 }],
  products: [
    {
      id: "acai-330",
      category: "acai",
      name: "Açaí 330 ml",
      desc: "Base cremosa de açaí. Escolha seus adicionais.",
      price: 14.9,
      img: "",
      tags: ["popular"],
      sizes: [{ code: "330", label: "330 ml", price: 14.9 }],
    },
  ],
  coupons: { ROXO10: { type: "percent", value: 10, label: "10% de desconto" } },
};

// Normaliza sem exigir APIs novas
function normalize(raw) {
  const c = jclone(raw);
  c.store = c.store || {};
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

export default function AdminPage() {
  // Evita SSR acessar window/localStorage
  const [mounted, setMounted] = useState(false);

  // Gate do PIN
  const [ok, setOk] = useState(false);
  const [pin, setPin] = useState("");

  // Config carregada
  const [cfg, setCfg] = useState(null);

  useEffect(() => {
    setMounted(true);

    try {
      // util para limpar localStorage corrompido: /admin?clear=1
      const url = new URL(window.location.href);
      if (url.searchParams.get("clear") === "1") {
        localStorage.removeItem(LS_KEY);
        localStorage.removeItem(ADMIN_OK_KEY);
        url.searchParams.delete("clear");
        window.location.replace(url.toString());
        return;
      }
    } catch {}

    try {
      const okFlag = localStorage.getItem(ADMIN_OK_KEY);
      if (okFlag === "1") setOk(true);
    } catch {}

    try {
      const raw = localStorage.getItem(LS_KEY);
      const base = raw ? JSON.parse(raw) : DEFAULT_CFG;
      setCfg(normalize(base));
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
      localStorage.setItem(LS_KEY, JSON.stringify(cfg));
      alert("✅ Salvo com sucesso!");
    } catch {
      alert("Falha ao salvar (localStorage indisponível).");
    }
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(cfg, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ilumo_cfg_v1.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function uploadJson(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        setCfg(normalize(parsed));
        alert("✅ Config carregada (salve para aplicar)!");
      } catch {
        alert("Arquivo inválido.");
      }
    };
    reader.readAsText(f);
  }

  function update(path, mutator) {
    setCfg((prev) => {
      const draft = jclone(prev);
      const ref = path.split(".").reduce((acc, k) => acc[k], draft);
      mutator(ref);
      return normalize(draft);
    });
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
          <p className="text-sm text-[#475569] mt-1">Digite o PIN para entrar</p>
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

  if (!cfg) {
    return (
      <div className="min-h-screen grid place-items-center">
        Carregando painel…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7fb] text-[#0f172a]">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#e5e7eb]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <a
            href="/"
            className="px-3 py-1.5 rounded-xl border border-[#e5e7eb] bg-white hover:bg-[#f1f5f9]"
          >
            ← Voltar
          </a>
          <div className="mx-auto text-center">
            <div className="text-sm">Painel • Ilumo</div>
            <div className="text-xs text-[#475569]">Edite a loja e o cardápio</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadJson}
              className="px-3 py-1.5 rounded-xl border border-[#e5e7eb] bg-white hover:bg-[#f1f5f9]"
            >
              Exportar
            </button>
            <label className="px-3 py-1.5 rounded-xl border border-[#e5e7eb] bg-white hover:bg-[#f1f5f9] cursor-pointer">
              Importar
              <input
                type="file"
                accept="application/json"
                onChange={uploadJson}
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
              value={cfg.store.name || ""}
              onChange={(e) =>
                setCfg({ ...cfg, store: { ...cfg.store, name: e.target.value } })
              }
            />

            <label className="text-sm">WhatsApp (somente dígitos)</label>
            <input
              className="input"
              value={cfg.store.whatsapp || ""}
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
              value={cfg.store.instagram || ""}
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
              value={cfg.store.deliveryHours || ""}
              onChange={(e) =>
                setCfg({
                  ...cfg,
                  store: { ...cfg.store, deliveryHours: e.target.value },
                })
              }
            />

            <label className="text-sm">Banner (URL/DataURL)</label>
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

            <label className="text-sm">Logo (URL/DataURL)</label>
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
                  onClick={() => update("categories", (arr) => arr.splice(idx, 1))}
                >
                  Excluir
                </button>
              </div>
            ))}
            <button
              className="btn-primary"
              onClick={() => update("categories", (arr) => arr.push({ id: "", name: "" }))}
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
                  onClick={() => update("addons", (arr) => arr.splice(idx, 1))}
                >
                  Excluir
                </button>
              </div>
            ))}
            <button
              className="btn-primary"
              onClick={() =>
                update("addons", (arr) => arr.push({ id: "", name: "", price: 0 }))
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
              <div key={idx} className="rounded-xl border border-[#e5e7eb] p-3 bg-[#fafafa]">
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <label className="text-sm">ID</label>
                    <input
                      className="input"
                      value={p.id}
                      onChange={(e) =>
                        update("products", (arr) => { arr[idx].id = e.target.value; })
                      }
                    />
                    <label className="text-sm">Categoria (id)</label>
                    <input
                      className="input"
                      value={p.category}
                      onChange={(e) =>
                        update("products", (arr) => { arr[idx].category = e.target.value; })
                      }
                    />
                    <label className="text-sm">Nome</label>
                    <input
                      className="input"
                      value={p.name}
                      onChange={(e) =>
                        update("products", (arr) => { arr[idx].name = e.target.value; })
                      }
                    />
                    <label className="text-sm">Descrição</label>
                    <textarea
                      className="input h-20"
                      value={p.desc || ""}
                      onChange={(e) =>
                        update("products", (arr) => { arr[idx].desc = e.target.value; })
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
                        update("products", (arr) => { arr[idx].price = Number(e.target.value || 0); })
                      }
                    />
                    <label className="text-sm">Imagem (URL/DataURL)</label>
                    <input
                      className="input"
                      value={p.img}
                      onChange={(e) =>
                        update("products", (arr) => { arr[idx].img = e.target.value; })
                      }
                    />
                    <label className="text-sm">Tags (vírgula)</label>
                    <input
                      className="input"
                      value={(p.tags || []).join(",")}
                      onChange={(e) =>
                        update("products", (arr) => {
                          arr[idx].tags = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                        })
                      }
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="font-medium">Tamanhos (opcional)</div>
                  <div className="mt-2 space-y-2">
                    {(p.sizes || []).map((s, sidx) => (
                      <div key={sidx} className="grid grid-cols-[1fr_2fr_1fr_auto] gap-2 items-center">
                        <input
                          className="input"
                          placeholder="code"
                          value={s.code}
                          onChange={(e) =>
                            update("products", (arr) => { arr[idx].sizes[sidx].code = e.target.value; })
                          }
                        />
                        <input
                          className="input"
                          placeholder="label"
                          value={s.label}
                          onChange={(e) =>
                            update("products", (arr) => { arr[idx].sizes[sidx].label = e.target.value; })
                          }
                        />
                        <input
                          type="number"
                          className="input"
                          placeholder="price"
                          value={s.price}
                          onChange={(e) =>
                            update("products", (arr) => { arr[idx].sizes[sidx].price = Number(e.target.value || 0); })
                          }
                        />
                        <button
                          className="btn"
                          onClick={() =>
                            update("products", (arr) => { arr[idx].sizes.splice(sidx, 1); })
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
                          arr[idx].sizes.push({ code: "", label: "", price: 0 });
                        })
                      }
                    >
                      + Adicionar tamanho
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex justify-between">
                  <button className="btn" onClick={() => update("products", (arr) => arr.splice(idx, 1))}>
                    Excluir produto
                  </button>
                </div>
              </div>
            ))}
            <button
              className="btn-primary"
              onClick={() =>
                update("products", (arr) =>
                  arr.push({ id: "", category: "", name: "", desc: "", price: 0, img: "", tags: [], sizes: [] })
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
            <button onClick={save} className="btn-primary">Salvar</button>
            <button onClick={() => { localStorage.removeItem(LS_KEY); location.reload(); }} className="btn">
              Limpar tudo
            </button>
          </div>
        </section>
      </main>

      <style jsx global>{`
        .input { width:100%; padding:10px 12px; border-radius:12px; border:1px solid #e5e7eb; background:#fff; outline:none; }
        .btn { padding:8px 12px; border-radius:10px; border:1px solid #e5e7eb; background:#fff; }
        .btn-primary { padding:8px 12px; border-radius:10px; background:#6D28D9; color:#fff; }
      `}</style>
    </div>
  );
}

function CouponEditor({ cfg, setCfg }) {
  const entries = useMemo(() => Object.entries(cfg.coupons || {}), [cfg.coupons]);

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
      draft.coupons[code.toUpperCase()] = { type: "percent", value: 10, label: "10% de desconto aplicado" };
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
        <div key={code} className="rounded-xl border border-[#e5e7eb] p-3 bg-[#fafafa]">
          <div className="font-semibold">{code}</div>
          <div className="grid md:grid-cols-3 gap-2 mt-2">
            <select className="input" value={c.type || "percent"} onChange={(e) => setField(code, "type", e.target.value)}>
              <option value="percent">percent</option>
              <option value="msg">msg</option>
            </select>
            <input className="input" type="number" placeholder="valor (%)" value={c.value ?? 0}
                   onChange={(e) => setField(code, "value", Number(e.target.value || 0))} />
            <input className="input" placeholder="label" value={c.label || ""}
                   onChange={(e) => setField(code, "label", e.target.value)} />
          </div>
          <div className="mt-2">
            <button className="btn" onClick={() => removeCoupon(code)}>Remover cupom</button>
          </div>
        </div>
      ))}
      <button className="btn-primary" onClick={addCoupon}>+ Adicionar cupom</button>
    </div>
  );
}