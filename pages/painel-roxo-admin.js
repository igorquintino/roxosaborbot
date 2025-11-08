// /pages/admin.js
import React, { useEffect, useMemo, useState } from "react";

/** util seguro de clone (evita erro em navegadores sem structuredClone) */
function clone(obj) {
  try {
    // disponível na maioria dos navegadores modernos
    if (typeof structuredClone === "function") return structuredClone(obj);
  } catch {}
  // fallback universal
  return JSON.parse(JSON.stringify(obj ?? {}));
}

const LS_KEY = "rs_config_v1";
const LS_ADMIN = "rs_admin_ok";
/** será inline no build — se não setado, vira string vazia (não quebra) */
const PIN_ENV = process.env.NEXT_PUBLIC_ADMIN_PIN || "";

/** modelos */
const EMPTY_PRODUCT = {
  id: "",
  category: "",
  name: "",
  desc: "",
  price: 0,
  img: "",
  tags: [],
  sizes: [],
};
const EMPTY_ADDON = { id: "", name: "", price: 0 };
const EMPTY_CATEGORY = { id: "", name: "" };

export default function AdminPage() {
  const [ok, setOk] = useState(false);
  const [pin, setPin] = useState("");

  /** tenta restaurar sessão do painel */
  useEffect(() => {
    try {
      const cached = window.localStorage.getItem(LS_ADMIN);
      if (cached === "1") setOk(true);
    } catch {}
  }, []);

  function checkPin(e) {
    e.preventDefault();
    if (pin && PIN_ENV && pin === PIN_ENV) {
      try {
        window.localStorage.setItem(LS_ADMIN, "1");
      } catch {}
      setOk(true);
    } else {
      alert("PIN inválido.");
    }
  }

  if (!ok) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#f7f7fb] text-[#0f172a]">
        <form
          onSubmit={checkPin}
          className="rounded-2xl bg-white border border-[#e5e7eb] p-6 w-full max-w-sm shadow-sm"
        >
          <h1 className="text-xl font-semibold">Acesso ao Painel</h1>
          <p className="text-sm text-[#475569] mt-1">Digite o PIN para continuar</p>
          <input
            type="password"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full mt-4 px-3 py-2 rounded-xl border border-[#e5e7eb] outline-none bg-white"
            placeholder="PIN"
          />
          <button className="mt-3 w-full rounded-xl bg-[#6D28D9] text-white py-2.5 hover:opacity-90">
            Entrar
          </button>
          <a href="/" className="block mt-3 text-center text-sm text-[#475569] underline">
            Voltar ao site
          </a>
        </form>
      </div>
    );
  }

  /** estado principal do painel */
  const [cfg, setCfg] = useState({
    brand: {
      name: "",
      logoText: "",
      colors: { primary: "#6D28D9", primaryDark: "#4C1D95", accent: "#22C55E" },
    },
    store: {
      whatsapp: "",
      instagram: "",
      deliveryHours: "",
      bannerUrl: "",
      logoUrl: "",
      closedNote: "",
      raspadinhaCopy: "",
    },
    categories: [],
    addons: [],
    products: [],
    coupons: {},
  });

  /** carrega config salva */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (raw) setCfg(JSON.parse(raw));
    } catch {}
  }, []);

  /** salvar/limpar/importar/exportar */
  function save() {
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(cfg));
      alert("✅ Configurações salvas!");
    } catch {
      alert("Não foi possível salvar no navegador.");
    }
  }
  function clearAll() {
    if (!confirm("Tem certeza que deseja limpar TODA a configuração?")) return;
    try {
      window.localStorage.removeItem(LS_KEY);
    } catch {}
    location.reload();
  }
  function downloadJson() {
    const blob = new Blob([JSON.stringify(cfg, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rs_config_v1.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  function uploadJson(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setCfg(JSON.parse(String(reader.result)));
        alert("✅ Config carregada (salve para aplicar)!");
      } catch {
        alert("Arquivo inválido.");
      }
    };
    reader.readAsText(f);
  }

  /** helper para editar arrays profundamente sem quebrar */
  function updateArray(path, updater) {
    setCfg((prev) => {
      const next = clone(prev);
      const ref = path.split(".").reduce((acc, key) => acc[key], next);
      updater(ref);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-[#f7f7fb] text-[#0f172a]">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#e5e7eb]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <a
            href="/"
            className="px-3 py-1.5 rounded-xl border border-[#e5e7eb] bg-white hover:bg-[#f1f5f9]"
          >
            ← Voltar
          </a>
          <div className="mx-auto text-center">
            <div className="text-sm">Painel • Roxo Sabor</div>
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

      <main className="max-w-5xl mx-auto p-4 grid lg:grid-cols-2 gap-6">
        {/* LOJA */}
        <section className="rounded-2xl bg-white border border-[#e5e7eb] p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Loja</h2>
          <div className="mt-3 grid gap-2">
            <label className="text-sm">Nome</label>
            <input
              className="input"
              value={cfg.brand.name || ""}
              onChange={(e) =>
                setCfg({ ...cfg, brand: { ...cfg.brand, name: e.target.value } })
              }
            />
            <label className="text-sm">Logo Text</label>
            <input
              className="input"
              value={cfg.brand.logoText || ""}
              onChange={(e) =>
                setCfg({
                  ...cfg,
                  brand: { ...cfg.brand, logoText: e.target.value },
                })
              }
            />

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm">Cor primária</label>
                <input
                  type="color"
                  className="input"
                  value={cfg.brand.colors.primary}
                  onChange={(e) =>
                    setCfg({
                      ...cfg,
                      brand: {
                        ...cfg.brand,
                        colors: { ...cfg.brand.colors, primary: e.target.value },
                      },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm">Primária (dark)</label>
                <input
                  type="color"
                  className="input"
                  value={cfg.brand.colors.primaryDark}
                  onChange={(e) =>
                    setCfg({
                      ...cfg,
                      brand: {
                        ...cfg.brand,
                        colors: {
                          ...cfg.brand.colors,
                          primaryDark: e.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm">Accent</label>
                <input
                  type="color"
                  className="input"
                  value={cfg.brand.colors.accent}
                  onChange={(e) =>
                    setCfg({
                      ...cfg,
                      brand: {
                        ...cfg.brand,
                        colors: { ...cfg.brand.colors, accent: e.target.value },
                      },
                    })
                  }
                />
              </div>
            </div>

            <label className="text-sm">WhatsApp</label>
            <input
              className="input"
              value={cfg.store.whatsapp || ""}
              onChange={(e) =>
                setCfg({ ...cfg, store: { ...cfg.store, whatsapp: e.target.value } })
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
                setCfg({ ...cfg, store: { ...cfg.store, bannerUrl: e.target.value } })
              }
            />
            <label className="text-sm">Logo (URL/DataURL)</label>
            <input
              className="input"
              value={cfg.store.logoUrl || ""}
              onChange={(e) =>
                setCfg({ ...cfg, store: { ...cfg.store, logoUrl: e.target.value } })
              }
            />
            <label className="text-sm">Nota de loja fechada</label>
            <input
              className="input"
              value={cfg.store.closedNote || ""}
              onChange={(e) =>
                setCfg({
                  ...cfg,
                  store: { ...cfg.store, closedNote: e.target.value },
                })
              }
            />
            <label className="text-sm">Texto da raspadinha</label>
            <textarea
              className="input h-24"
              value={cfg.store.raspadinhaCopy || ""}
              onChange={(e) =>
                setCfg({
                  ...cfg,
                  store: { ...cfg.store, raspadinhaCopy: e.target.value },
                })
              }
            />
          </div>
        </section>

        {/* CATEGORIAS */}
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
                    updateArray("categories", (arr) => {
                      arr[idx].id = e.target.value;
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="Nome"
                  value={c.name}
                  onChange={(e) =>
                    updateArray("categories", (arr) => {
                      arr[idx].name = e.target.value;
                    })
                  }
                />
                <div className="flex gap-2">
                  <button
                    className="btn"
                    onClick={() =>
                      updateArray("categories", (arr) => arr.splice(idx, 1))
                    }
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
            <button
              className="btn-primary"
              onClick={() =>
                updateArray("categories", (arr) =>
                  arr.push(clone(EMPTY_CATEGORY))
                )
              }
            >
              + Adicionar categoria
            </button>
          </div>
        </section>

        {/* ADICIONAIS */}
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
                    updateArray("addons", (arr) => {
                      arr[idx].id = e.target.value;
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="Nome"
                  value={a.name}
                  onChange={(e) =>
                    updateArray("addons", (arr) => {
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
                    updateArray("addons", (arr) => {
                      arr[idx].price = Number(e.target.value || 0);
                    })
                  }
                />
                <button
                  className="btn"
                  onClick={() =>
                    updateArray("addons", (arr) => arr.splice(idx, 1))
                  }
                >
                  Excluir
                </button>
              </div>
            ))}
            <button
              className="btn-primary"
              onClick={() =>
                updateArray("addons", (arr) => arr.push(clone(EMPTY_ADDON)))
              }
            >
              + Adicionar adicional
            </button>
          </div>
        </section>

        {/* PRODUTOS */}
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
                        updateArray("products", (arr) => {
                          arr[idx].id = e.target.value;
                        })
                      }
                    />
                    <label className="text-sm">Categoria (id)</label>
                    <input
                      className="input"
                      value={p.category}
                      onChange={(e) =>
                        updateArray("products", (arr) => {
                          arr[idx].category = e.target.value;
                        })
                      }
                    />
                    <label className="text-sm">Nome</label>
                    <input
                      className="input"
                      value={p.name}
                      onChange={(e) =>
                        updateArray("products", (arr) => {
                          arr[idx].name = e.target.value;
                        })
                      }
                    />
                    <label className="text-sm">Descrição</label>
                    <textarea
                      className="input h-20"
                      value={p.desc || ""}
                      onChange={(e) =>
                        updateArray("products", (arr) => {
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
                        updateArray("products", (arr) => {
                          arr[idx].price = Number(e.target.value || 0);
                        })
                      }
                    />
                    <label className="text-sm">Imagem (URL/DataURL)</label>
                    <input
                      className="input"
                      value={p.img}
                      onChange={(e) =>
                        updateArray("products", (arr) => {
                          arr[idx].img = e.target.value;
                        })
                      }
                    />
                    <label className="text-sm">Tags (vírgula)</label>
                    <input
                      className="input"
                      value={(p.tags || []).join(",")}
                      onChange={(e) =>
                        updateArray("products", (arr) => {
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
                            updateArray("products", (arr) => {
                              arr[idx].sizes[sidx].code = e.target.value;
                            })
                          }
                        />
                        <input
                          className="input"
                          placeholder="label"
                          value={s.label}
                          onChange={(e) =>
                            updateArray("products", (arr) => {
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
                            updateArray("products", (arr) => {
                              arr[idx].sizes[sidx].price = Number(
                                e.target.value || 0
                              );
                            })
                          }
                        />
                        <button
                          className="btn"
                          onClick={() =>
                            updateArray("products", (arr) => {
                              arr[idx].sizes.splice(sidx, 1);
                            })
                          }
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                    <button
                      className="btn"
                      onClick={() =>
                        updateArray("products", (arr) => {
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
                  <button
                    className="btn"
                    onClick={() =>
                      updateArray("products", (arr) => arr.splice(idx, 1))
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
                updateArray("products", (arr) => arr.push(clone(EMPTY_PRODUCT)))
              }
            >
              + Adicionar produto
            </button>
          </div>
        </section>

        {/* CUPONS / RASPADINHA */}
        <section className="rounded-2xl bg-white border border-[#e5e7eb] p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Cupons / Raspadinha</h2>
          <CouponEditor cfg={cfg} setCfg={setCfg} />
          <div className="mt-4 flex gap-2">
            <button onClick={save} className="btn-primary">
              Salvar
            </button>
            <button onClick={clearAll} className="btn">
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
          background: #6D28D9;
          color: #fff;
        }
      `}</style>
    </div>
  );
}

function CouponEditor({ cfg, setCfg }) {
  const entries = useMemo(
    () => Object.entries(cfg.coupons || {}),
    [cfg.coupons]
  );

  function setField(code, key, value) {
    setCfg((prev) => {
      const next = clone(prev);
      if (!next.coupons) next.coupons = {};
      if (!next.coupons[code]) next.coupons[code] = {};
      next.coupons[code][key] = value;
      return next;
    });
  }

  function addCoupon() {
    const code = prompt("Código do cupom (ex.: ROXO10)");
    if (!code) return;
    setCfg((prev) => {
      const next = clone(prev);
      if (!next.coupons) next.coupons = {};
      next.coupons[code.toUpperCase()] = {
        type: "percent",
        value: 10,
        label: "10% de desconto aplicado",
      };
      return next;
    });
  }

  function removeCoupon(code) {
    setCfg((prev) => {
      const next = clone(prev);
      if (next.coupons) delete next.coupons[code];
      return next;
    });
  }

  return (
    <div className="mt-3 space-y-3">
      {entries.map(([code, c]) => (
        <div key={code} className="rounded-xl border border-[#e5e7eb] p-3 bg-[#fafafa]">
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
              value={c.value || 0}
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