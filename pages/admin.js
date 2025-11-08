import React, { useEffect, useState, useMemo } from "react";

const LS_KEY = "rs_config_v1";
const PIN_ENV = process.env.NEXT_PUBLIC_ADMIN_PIN || "";

// Fallback seguro (sem structuredClone)
const clone = (obj) => JSON.parse(JSON.stringify(obj || {}));

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [ok, setOk] = useState(false);
  const [pin, setPin] = useState("");
  const [cfg, setCfg] = useState(null);

  // Evita SSR acessar localStorage
  useEffect(() => {
    setMounted(true);

    try {
      const localOk = localStorage.getItem("rs_admin_ok");
      if (localOk === "1") setOk(true);

      const saved = localStorage.getItem(LS_KEY);
      if (saved) setCfg(JSON.parse(saved));
      else
        setCfg({
          brand: {
            name: "",
            logoText: "",
            colors: {
              primary: "#6D28D9",
              primaryDark: "#4C1D95",
              accent: "#22C55E",
            },
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
    } catch {
      setCfg(null);
    }
  }, []);

  function checkPin(e) {
    e.preventDefault();
    if (pin === PIN_ENV && pin) {
      localStorage.setItem("rs_admin_ok", "1");
      setOk(true);
    } else {
      alert("PIN incorreto.");
    }
  }

  function save() {
    localStorage.setItem(LS_KEY, JSON.stringify(cfg));
    alert("✅ Salvo com sucesso!");
  }

  if (!mounted) return null;

  if (!ok) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#f7f7fb] text-[#0f172a]">
        <form
          onSubmit={checkPin}
          className="rounded-2xl bg-white border border-[#e5e7eb] p-6 w-full max-w-sm shadow-sm"
        >
          <h1 className="text-xl font-semibold">Painel Ilumo</h1>
          <p className="text-sm text-[#475569] mt-1">Digite o PIN de acesso</p>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full mt-4 px-3 py-2 rounded-xl border border-[#e5e7eb] outline-none"
            placeholder="PIN"
          />
          <button className="mt-3 w-full rounded-xl bg-[#6D28D9] text-white py-2 hover:opacity-90">
            Entrar
          </button>
        </form>
      </div>
    );
  }

  if (!cfg)
    return (
      <div className="min-h-screen grid place-items-center text-center">
        <p>Carregando painel...</p>
      </div>
    );

  // Editor simples só pra testar sem crash
  return (
    <div className="min-h-screen bg-[#f7f7fb] text-[#0f172a]">
      <header className="p-4 bg-white shadow-sm border-b border-[#e5e7eb] flex justify-between items-center">
        <h1 className="font-semibold text-lg">Painel Ilumo</h1>
        <button
          onClick={save}
          className="px-4 py-2 rounded-xl bg-[#6D28D9] text-white hover:opacity-90"
        >
          Salvar
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <h2 className="text-lg font-medium">Nome da loja</h2>
        <input
          className="w-full mt-2 p-2 border rounded-xl"
          value={cfg.brand.name}
          onChange={(e) =>
            setCfg((prev) => ({
              ...prev,
              brand: { ...prev.brand, name: e.target.value },
            }))
          }
        />

        <h2 className="text-lg font-medium mt-6">WhatsApp</h2>
        <input
          className="w-full mt-2 p-2 border rounded-xl"
          value={cfg.store.whatsapp}
          onChange={(e) =>
            setCfg((prev) => ({
              ...prev,
              store: { ...prev.store, whatsapp: e.target.value },
            }))
          }
        />

        <button
          onClick={save}
          className="mt-6 px-6 py-2 rounded-xl bg-[#6D28D9] text-white"
        >
          Salvar Alterações
        </button>
      </main>
    </div>
  );
}