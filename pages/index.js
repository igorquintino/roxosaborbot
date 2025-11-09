// pages/index.js
import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/router";

const LS_KEY = "ilumo_cfg_v2";

/** === DEFAULTS (iguais aos seus) === */
const BRAND = { name: "Roxo Sabor", logoText: "ROXO SABOR", colors: {
  primary:"#6D28D9", primaryDark:"#4C1D95", accent:"#22C55E",
  lightBg:"#f7f7fb", lightFg:"#0f172a", darkBg:"#0b0b0b", darkFg:"#eaeaea",
  cardDark:"#121212", cardLight:"#ffffff",
}};
const STORE = {
  whatsapp: "+55 31 993006358", instagram: "@roxosaboroficial",
  deliveryHours:"Todos os dias, 14h às 23h",
  raspadinhaCopy:"Raspou, achou, ganhou! Digite seu código para validar seu prêmio.",
};
const COUPONS = {
  ROXO10:{type:"percent",value:10,label:"10% de desconto aplicado"},
  FRETEGRATIS:{type:"msg",label:"Frete grátis na próxima compra!"},
  ADICIONAL:{type:"msg",label:"Um adicional grátis no próximo açaí!"},
};
const CATEGORIES = [
  { id:"promos", name:"Promoções" },{ id:"acai", name:"Açaí no Copo" },
  { id:"combos", name:"Combos" },{ id:"adicionais", name:"Adicionais" },
  { id:"bebidas", name:"Bebidas" },
];
const ADDONS = [
  { id:"leiteNinho", name:"Leite Ninho", price:1.0 },
  { id:"nutella", name:"Nutella", price:4.5 },
  { id:"morango", name:"Morango", price:3.0 },
  { id:"banana", name:"Banana", price:2.5 },
  { id:"granola", name:"Granola", price:2.0 },
  { id:"leiteCondensado", name:"Leite Condensado", price:2.5 },
];
const PRODUCTS = [
  { id:"promo-999", category:"promos", name:"PROMO • 330 ml por R$ 9,99",
    desc:"Açaí 330 ml com 1 adicional simples.", price:9.99, img:"/prod-acai.jpg", tags:["promo","popular"] },
  { id:"acai-330", category:"acai", name:"Açaí 330 ml + 3 complementos grátis",
    desc:"Escolha até 3 acompanhamentos grátis!", price:24.99,
    sizes:[{code:"330",label:"330 ml",price:24.99},{code:"500",label:"500 ml",price:25.99},{code:"700",label:"700 ml",price:32.99}],
    img:"/prod-acai.jpg", tags:["popular"] },
  { id:"acai-gourmet", category:"acai", name:"Açaí Gourmet",
    desc:"Com Nutella, Ninho e morangos frescos.", price:24.9, img:"/prod-acai2.jpg", tags:["gourmet"] },
  { id:"combo-duo", category:"combos", name:"Combo DUO (2 x 500 ml)",
    desc:"2 copos de 500 ml + 2 adicionais cada.", price:36.9, img:"/prod-acai2.jpg", tags:["família"] },
  ...ADDONS.map((a)=>({ id:`addon-${a.id}`, category:"adicionais", name:a.name, desc:"Adicional avulso", price:a.price, img:"/addon.jpg" })),
];

const currency = (n) => n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

export default function RoxoSaborMenu() {
  const router = useRouter();

  /** ======= NOVO: carrega overrides do painel ======= */
  const [ov, setOv] = useState(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setOv(JSON.parse(raw));
    } catch {}
  }, []);
  const _BRAND = ov?.brand ?? BRAND;
  const _STORE = ov?.store ?? STORE;
  const _CATEGORIES = ov?.categories ?? CATEGORIES;
  const _ADDONS = ov?.addons ?? ADDONS;
  const _PRODUCTS = ov?.products ?? PRODUCTS;
  const _COUPONS = ov?.coupons ?? COUPONS;

  /** ======= resto do seu componente, apenas trocando BRAND-> _BRAND etc ======= */
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("themeRS") || "light";
    return "light";
  });
  useEffect(()=>{ if(typeof window!=="undefined") localStorage.setItem("themeRS",theme); },[theme]);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("acai");
  const [cart, setCart] = useState([]);
  const [note, setNote] = useState("");
  const [customer, setCustomer] = useState({ name:"", phone:"", address:"" });
  const [couponCode, setCouponCode] = useState("");
  const [couponInfo, setCouponInfo] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetProduct, setSheetProduct] = useState(null);

  useEffect(()=>{ if(router.query.pago==="sucesso") alert("✅ Pedido confirmado! Você receberá o resumo no Telegram."); },[router.query.pago]);

  const filtered = useMemo(()=> _PRODUCTS.filter(
    (p)=> (category ? p.category===category : true) &&
      (query ? (p.name+" "+(p.desc||"")).toLowerCase().includes(query.toLowerCase()) : true)
  ),[_PRODUCTS, category, query]);

  const subtotal = cart.reduce((s,i)=>s+i.subtotal,0);
  const discount = couponInfo?.type==="percent" ? (subtotal*couponInfo.value)/100 : 0;
  const total = Math.max(0, subtotal - discount);

  function addToCart(product,{size,addons=[],qty=1,obs=""}={}) {
    const basePrice = size ? size.price : product.price;
    const addonsTotal = addons.reduce((s,a)=>s+a.price,0);
    const subtotal = (basePrice + addonsTotal) * qty;
    setCart((old)=>[...old,{ id:`${product.id}-${Date.now()}`, productId:product.id, name:product.name, size:size||null, addons, qty, obs, subtotal }]);
  }
  function removeFromCart(id){ setCart((old)=>old.filter((i)=>i.id!==id)); }
  function clearCart(){ setCart([]); setNote(""); }
  function applyCoupon(){ const code=couponCode.trim().toUpperCase(); const found=_COUPONS[code]; setCouponInfo(found ? {...found, code} : {type:"msg", label:"Código inválido ou já utilizado."}); }
  async function checkoutMP(){ /* seu código inalterado */ }

  function openSheet(p){ setSheetProduct(p); setSheetOpen(true); }

  return (
    <div className="min-h-screen text-[15px] bg-[--bg] text-[--fg]">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[color:var(--line)]">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={()=>setTheme(theme==="dark"?"light":"dark")} className="px-3 py-1.5 rounded-xl border border-[color:var(--line)] bg-white hover:bg-[color:var(--chip)]">{theme==="dark"?"🌞 Claro":"🌙 Escuro"}</button>
          <div className="mx-auto text-center">
            <div className="text-sm text-[color:var(--muted)]">{_BRAND.name}</div>
            <div className="text-xs text-[color:var(--muted)]">{_STORE.deliveryHours}</div>
          </div>
          <a href="#carrinho" className="px-3 py-1.5 rounded-xl bg-[--primary] text-white hover:opacity-90 transition">Carrinho ({cart.length})</a>
        </div>
      </header>

      {/* ... (todo o restante do seu JSX fica igual) ... */}
      {/* Onde aparecer BRAND/STORE/CATEGORIES/ADDONS/PRODUCTS/COUPONS, use _BRAND/_STORE/_CATEGORIES/_ADDONS/_PRODUCTS/_COUPONS */}

      <style jsx global>{`
        :root{
          --primary:${_BRAND.colors.primary}; --primaryDark:${_BRAND.colors.primaryDark}; --accent:${_BRAND.colors.accent};
          --bg:#f7f7fb; --fg:#0f172a; --muted:#475569; --line:#e5e7eb; --card:#ffffff; --chip:#f1f5f9;
        }
        :root.dark{ --bg:${_BRAND.colors.darkBg}; --fg:${_BRAND.colors.darkFg}; --card:${_BRAND.colors.cardDark}; --line:rgba(255,255,255,.1); --chip:rgba(255,255,255,.06); }
        html,body{background:var(--bg);color:var(--fg);}
      `}</style>

      {/* seus componentes ThemeBinder, ItemSheet, CartSummary permanecem iguais,
          mas troque ADDONS por _ADDONS dentro do ItemSheet */}
    </div>
  );
}