// pages/admin.js
import React, { useEffect, useMemo, useState } from "react";

/** =========================
 *  CONFIG
 * ========================= */
const LS_KEY = "ilumo_cfg_v1"; // onde salvamos no navegador
const PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "";

// modelo base (fallback)
const defaultConfig = {
  store: {
    name: "Roxo Sabor",
    whatsapp: "31984853327",
    instagram: "@roxosaboroficial",
    bannerUrl: "",
    logoUrl: "",
    deliveryHours: "Todos os dias, 14h às 23h",
    closedNote: "",
    raspadinhaCopy: "Raspou, achou, ganhou! Digite o código para validar.",
    theme: "light", // light / dark (futuro)
    primary: "#6D28D9",
  },
  categories: [
    { id: "promos", name: "Promoções" },
    { id: "acai", name: "Açaí" },
  ],
  addons: [
    { id: "granola", name: "Granola", price: 2 },
    { id: "nutella", name: "Nutella", price: 4.5 },
  ],
  products: [
    {
      id: "acai-330",
      category: "acai",
      name: "Açaí 330 ml",
      desc: "Cremoso, perfeito para o dia.",
      price: 14.9,
      img: "",
      tags: ["popular"],
      sizes: [
        { code: "330", label: "330 ml", price: 14.9 },
        { code: "500", label: "500 ml", price: 19.9 },
      ],
    },
  ],
  coupons: {
    ROXO10: { type: "percent", value: 10, label: "10% OFF aplicado" },
  },
};

/** utils */
const clone = (x) => JSON.parse(JSON.stringify(x));

/** =========================
 *  PÁGINA
 * ========================= */
export default function Admin() {
  // gate simples com PIN
  const [ok, setOk] = useState(false);
  const [pinInput, setPinInput] = useState("");

  useEffect(() => {
    if (localStorage.getItem("ilumo_admin_ok") === "1") setOk(true);
  }, []);

  function enter(e) {
    e.preventDefault();
    if (!PIN) {
      alert("Defina NEXT_PUBLIC_ADMIN_PIN no .env do Railway.");
      return;
    }
    if (pinInput === PIN) {
      localStorage.setItem("ilumo_admin_ok", "1");
      setOk(true);
    } else {
      alert("PIN inválido");
    }
  }

  if (!ok) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#f7f7fb]">
        <form onSubmit={enter} className="w-full max-w-sm bg-white p-6 rounded-2xl border border-[#e5e7eb]">
          <h1 className="text-xl font-semibold">Painel Ilumo</h1>
          <p className="text-sm text-[#64748b]">Digite o PIN para continuar</p>
          <input
            className="input mt-4"
            placeholder="PIN"
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
          />
          <button className="btn-primary w-full mt-3">Entrar</button>
          <a href="/" className="block text-center text-sm text-[#64748b] mt-3 underline">voltar</a>
          <Style />
        </form>
      </div>
    );
  }

  // estado do painel
  const [cfg, setCfg] = useState(defaultConfig);
  const [tab, setTab] = useState("loja");

  // carrega se existir
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        setCfg({ ...clone(defaultConfig), ...JSON.parse(raw) });
      } catch {
        // se quebrar, ignora e segue com default
      }
    }
  }, []);

  function save() {
    localStorage.setItem(LS_KEY, JSON.stringify(cfg));
    alert("✅ Salvo!");
  }
  function exportJson() {
    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ilumo-config.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  function importJson(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const next = JSON.parse(String(r.result));
        setCfg({ ...clone(defaultConfig), ...next });
        alert("Config importada (lembre de salvar)!");
      } catch {
        alert("Arquivo inválido");
      }
    };
    r.readAsText(f);
  }
  function clearAll() {
    if (!confirm("Limpar TUDO?")) return;
    localStorage.removeItem(LS_KEY);
    setCfg(clone(defaultConfig));
  }

  // helpers mutação
  const up = (path, updater) =>
    setCfg((prev) => {
      const next = clone(prev);
      const ref = path.split(".").reduce((acc, key) => acc[key], next);
      updater(ref);
      return next;
    });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      {/* topo */}
      <header className="sticky top-0 bg-white/90 backdrop-blur border-b border-[#e5e7eb]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2">
          <a href="/" className="btn">← voltar</a>
          <div className="mx-auto text-center">
            <div className="font-medium">Painel Ilumo</div>
            <div className="text-xs text-[#64748b]">edite loja, cardápio e cupons</div>
          </div>
          <div className="flex gap-2">
            <button className="btn" onClick={exportJson}>Exportar</button>
            <label className="btn cursor-pointer">
              Importar
              <input className="hidden" type="file" accept="application/json" onChange={importJson} />
            </label>
            <button className="btn-primary" onClick={save}>Salvar</button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-3 flex gap-2 flex-wrap">
          {[
            ["loja", "Loja"],
            ["imagens", "Imagens"],
            ["categorias", "Categorias"],
            ["produtos", "Produtos"],
            ["adicionais", "Adicionais"],
            ["cupons", "Cupons"],
            ["backup", "Backup"],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-3 py-1.5 rounded-xl border ${
                tab === k ? "bg-[#ede9fe] border-[#d9d6fe]" : "bg-white border-[#e5e7eb]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* conteúdo */}
      <main className="max-w-6xl mx-auto p-4 grid gap-6">
        {tab === "loja" && (
          <Card title="Informações da loja">
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Nome da loja">
                <input
                  className="input"
                  value={cfg.store.name}
                  onChange={(e) => setCfg({ ...cfg, store: { ...cfg.store, name: e.target.value } })}
                />
              </Field>
              <Field label="WhatsApp">
                <input
                  className="input"
                  value={cfg.store.whatsapp}
                  onChange={(e) => setCfg({ ...cfg, store: { ...cfg.store, whatsapp: e.target.value } })}
                />
              </Field>
              <Field label="Instagram">
                <input
                  className="input"
                  value={cfg.store.instagram}
                  onChange={(e) => setCfg({ ...cfg, store: { ...cfg.store, instagram: e.target.value } })}
                />
              </Field>
              <Field label="Horário de atendimento">
                <input
                  className="input"
                  value={cfg.store.deliveryHours}
                  onChange={(e) => setCfg({ ...cfg, store: { ...cfg.store, deliveryHours: e.target.value } })}
                />
              </Field>
              <Field label="Tema (somente visual)">
                <select
                  className="input"
                  value={cfg.store.theme}
                  onChange={(e) => setCfg({ ...cfg, store: { ...cfg.store, theme: e.target.value } })}
                >
                  <option value="light">Claro</option>
                  <option value="dark">Escuro</option>
                </select>
              </Field>
              <Field label="Cor primária">
                <input
                  type="color"
                  className="input"
                  value={cfg.store.primary}
                  onChange={(e) => setCfg({ ...cfg, store: { ...cfg.store, primary: e.target.value } })}
                />
              </Field>
              <Field label="Aviso de loja fechada (opcional)">
                <input
                  className="input"
                  value={cfg.store.closedNote}
                  onChange={(e) => setCfg({ ...cfg, store: { ...cfg.store, closedNote: e.target.value } })}
                />
              </Field>
              <Field label="Texto da raspadinha">
                <input
                  className="input"
                  value={cfg.store.raspadinhaCopy}
                  onChange={(e) => setCfg({ ...cfg, store: { ...cfg.store, raspadinhaCopy: e.target.value } })}
                />
              </Field>
            </div>
          </Card>
        )}

        {tab === "imagens" && (
          <Card title="Imagens">
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="URL do Banner (ou DataURL)">
                <input
                  className="input"
                  value={cfg.store.bannerUrl}
                  onChange={(e) => setCfg({ ...cfg, store: { ...cfg.store, bannerUrl: e.target.value } })}
                />
              </Field>
              <Field label="URL da Logo (ou DataURL)">
                <input
                  className="input"
                  value={cfg.store.logoUrl}
                  onChange={(e) => setCfg({ ...cfg, store: { ...cfg.store, logoUrl: e.target.value } })}
                />
              </Field>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-3">
              <ImgPreview url={cfg.store.bannerUrl} label="Prévia Banner" />
              <ImgPreview url={cfg.store.logoUrl} label="Prévia Logo" />
            </div>
          </Card>
        )}

        {tab === "categorias" && (
          <Card title="Categorias">
            <div className="space-y-2">
              {cfg.categories.map((c, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                  <input
                    className="input"
                    placeholder="id"
                    value={c.id}
                    onChange={(e) => up("categories", (arr) => (arr[i].id = e.target.value))}
                  />
                  <input
                    className="input"
                    placeholder="Nome"
                    value={c.name}
                    onChange={(e) => up("categories", (arr) => (arr[i].name = e.target.value))}
                  />
                  <button className="btn" onClick={() => up("categories", (arr) => arr.splice(i, 1))}>
                    Remover
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <button className="btn-primary" onClick={() => up("categories", (arr) => arr.push({ id: "", name: "" }))}>
                + Adicionar categoria
              </button>
            </div>
          </Card>
        )}

        {tab === "adicionais" && (
          <Card title="Adicionais (complementos)">
            <div className="space-y-2">
              {cfg.addons.map((a, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                  <input
                    className="input"
                    placeholder="id"
                    value={a.id}
                    onChange={(e) => up("addons", (arr) => (arr[i].id = e.target.value))}
                  />
                  <input
                    className="input"
                    placeholder="Nome"
                    value={a.name}
                    onChange={(e) => up("addons", (arr) => (arr[i].name = e.target.value))}
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    placeholder="Preço"
                    value={a.price}
                    onChange={(e) => up("addons", (arr) => (arr[i].price = Number(e.target.value || 0)))}
                  />
                  <button className="btn" onClick={() => up("addons", (arr) => arr.splice(i, 1))}>
                    Remover
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <button
                className="btn-primary"
                onClick={() => up("addons", (arr) => arr.push({ id: "", name: "", price: 0 }))}
              >
                + Adicionar adicional
              </button>
            </div>
          </Card>
        )}

        {tab === "produtos" && (
          <Card title="Produtos">
            <div className="space-y-4">
              {cfg.products.map((p, i) => (
                <div key={i} className="p-3 rounded-xl border border-[#e5e7eb] bg-white">
                  <div className="grid md:grid-cols-2 gap-3">
                    <Field label="ID">
                      <input className="input" value={p.id} onChange={(e) => up("products", (arr) => (arr[i].id = e.target.value))} />
                    </Field>
                    <Field label="Categoria (id)">
                      <input
                        className="input"
                        value={p.category}
                        onChange={(e) => up("products", (arr) => (arr[i].category = e.target.value))}
                      />
                    </Field>
                    <Field label="Nome">
                      <input className="input" value={p.name} onChange={(e) => up("products", (arr) => (arr[i].name = e.target.value))} />
                    </Field>
                    <Field label="Preço base">
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        value={p.price}
                        onChange={(e) => up("products", (arr) => (arr[i].price = Number(e.target.value || 0)))}
                      />
                    </Field>
                    <Field label="Imagem (URL)">
                      <input className="input" value={p.img || ""} onChange={(e) => up("products", (arr) => (arr[i].img = e.target.value))} />
                    </Field>
                    <Field label="Tags (vírgula)">
                      <input
                        className="input"
                        value={(p.tags || []).join(",")}
                        onChange={(e) => up("products", (arr) => (arr[i].tags = e.target.value.split(",").map((s) => s.trim()).filter(Boolean)))}
                      />
                    </Field>
                    <Field label="Descrição" wide>
                      <textarea
                        rows={3}
                        className="input"
                        value={p.desc || ""}
                        onChange={(e) => up("products", (arr) => (arr[i].desc = e.target.value))}
                      />
                    </Field>
                  </div>

                  <div className="mt-3">
                    <div className="font-medium mb-1">Tamanhos (opcional)</div>
                    <div className="space-y-2">
                      {(p.sizes || []).map((s, si) => (
                        <div key={si} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                          <input
                            className="input"
                            placeholder="code"
                            value={s.code}
                            onChange={(e) => up("products", (arr) => (arr[i].sizes[si].code = e.target.value))}
                          />
                          <input
                            className="input"
                            placeholder="label"
                            value={s.label}
                            onChange={(e) => up("products", (arr) => (arr[i].sizes[si].label = e.target.value))}
                          />
                          <input
                            type="number"
                            step="0.01"
                            className="input"
                            placeholder="price"
                            value={s.price}
                            onChange={(e) => up("products", (arr) => (arr[i].sizes[si].price = Number(e.target.value || 0)))}
                          />
                          <button className="btn" onClick={() => up("products", (arr) => arr[i].sizes.splice(si, 1))}>
                            remover
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      className="btn mt-2"
                      onClick={() => up("products", (arr) => {
                        arr[i].sizes = arr[i].sizes || [];
                        arr[i].sizes.push({ code: "", label: "", price: 0 });
                      })}
                    >
                      + adicionar tamanho
                    </button>
                  </div>

                  <div className="mt-3 flex justify-between">
                    <button className="btn" onClick={() => up("products", (arr) => arr.splice(i, 1))}>
                      Remover produto
                    </button>
                    <ImgPreview url={p.img} label="Prévia" small />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <button
                className="btn-primary"
                onClick={() =>
                  up("products", (arr) =>
                    arr.push({ id: "", category: "", name: "", desc: "", price: 0, img: "", tags: [], sizes: [] })
                  )
                }
              >
                + Adicionar produto
              </button>
            </div>
          </Card>
        )}

        {tab === "cupons" && (
          <Card title="Cupons / Raspadinha">
            <CouponEditor cfg={cfg} setCfg={setCfg} />
          </Card>
        )}

        {tab === "backup" && (
          <Card title="Backup / Restauração">
            <div className="flex flex-wrap gap-2">
              <button className="btn" onClick={exportJson}>Exportar JSON</button>
              <label className="btn cursor-pointer">
                Importar JSON
                <input className="hidden" type="file" accept="application/json" onChange={importJson} />
              </label>
              <button className="btn" onClick={clearAll}>Limpar tudo</button>
              <button className="btn-primary" onClick={save}>Salvar alterações</button>
            </div>
            <p className="text-sm text-[#64748b] mt-2">
              O conteúdo é salvo somente no navegador (localStorage). O site público lê esses dados.
            </p>
          </Card>
        )}
      </main>

      <Style />
    </div>
  );
}

/** =========================
 *  SUB-COMPONENTES
 * ========================= */
function Card({ title, children }) {
  return (
    <section className="bg-white p-4 rounded-2xl border border-[#e5e7eb]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Field({ label, children, wide }) {
  return (
    <label className={`${wide ? "md:col-span-2" : ""}`}>
      <div className="text-sm text-[#475569] mb-1">{label}</div>
      {children}
    </label>
  );
}

function ImgPreview({ url, label, small }) {
  return (
    <div>
      <div className="text-sm text-[#475569] mb-1">{label}</div>
      <div
        className={`rounded-xl border border-[#e5e7eb] bg-white grid place-items-center overflow-hidden ${
          small ? "w-40 h-24" : "w-full h-40"
        }`}
      >
        {url ? <img src={url} alt="" className="object-cover w-full h-full" /> : <span className="text-xs text-[#94a3b8]">sem imagem</span>}
      </div>
    </div>
  );
}

function CouponEditor({ cfg, setCfg }) {
  const entries = useMemo(() => Object.entries(cfg.coupons || {}), [cfg.coupons]);

  const setField = (code, k, v) =>
    setCfg((prev) => {
      const next = clone(prev);
      if (!next.coupons) next.coupons = {};
      if (!next.coupons[code]) next.coupons[code] = {};
      next.coupons[code][k] = v;
      return next;
    });

  const removeCoupon = (code) =>
    setCfg((prev) => {
      const next = clone(prev);
      delete next.coupons[code];
      return next;
    });

  const addCoupon = () => {
    const code = prompt("Código (ex.: ROXO10)");
    if (!code) return;
    setCfg((prev) => {
      const next = clone(prev);
      next.coupons = next.coupons || {};
      next.coupons[code.toUpperCase()] = { type: "percent", value: 10, label: "10% OFF" };
      return next;
    });
  };

  return (
    <div>
      <div className="space-y-2">
        {entries.map(([code, c]) => (
          <div key={code} className="p-3 rounded-xl border border-[#e5e7eb] bg-[#fafafa]">
            <div className="font-semibold">{code}</div>
            <div className="grid md:grid-cols-3 gap-2 mt-2">
              <select className="input" value={c.type || "percent"} onChange={(e) => setField(code, "type", e.target.value)}>
                <option value="percent">percent</option>
                <option value="msg">msg</option>
              </select>
              <input
                className="input"
                type="number"
                step="0.01"
                value={c.value || 0}
                onChange={(e) => setField(code, "value", Number(e.target.value || 0))}
              />
              <input className="input" value={c.label || ""} onChange={(e) => setField(code, "label", e.target.value)} />
            </div>
            <button className="btn mt-2" onClick={() => removeCoupon(code)}>
              Remover
            </button>
          </div>
        ))}
      </div>
      <button className="btn-primary mt-3" onClick={addCoupon}>
        + Adicionar cupom
      </button>
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
      .btn {
        padding: 8px 12px;
        border-radius: 10px;
        border: 1px solid #e5e7eb;
        background: #fff;
      }
      .btn-primary {
        padding: 10px 14px;
        border-radius: 10px;
        background: #6D28D9;
        color: #fff;
      }
    `}</style>
  );
}