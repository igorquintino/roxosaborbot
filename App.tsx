
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShoppingCart, Search, Star, Clock, MapPin, ChevronLeft, 
  Trash2, Gift, CheckCircle2, Loader2, CreditCard, Zap
} from 'lucide-react';
import { Product, CartItem, Category, CustomerData, ShippingState } from './types';
import { STORE, CATEGORIES, PRODUCTS } from './constants';

const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[1].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartStep, setCartStep] = useState<'items' | 'checkout'>('items');
  const [animateCart, setAnimateCart] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [note, setNote] = useState('');

  // Estados do Cupom / Raspadinha
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState<{msg: string, type: 'success' | 'error' | null}>({msg: '', type: null});
  const [appliedDiscount, setAppliedDiscount] = useState<{type: string, value: number} | null>(null);

  const [customer, setCustomer] = useState<CustomerData>({
    name: '', whatsapp: '', city: 'Conselheiro Lafaiete - MG',
    neighborhood: '', street: '', number: '', complement: ''
  });

  const [shipping, setShipping] = useState<ShippingState>({
    fee: null, loading: false, calculated: false
  });

  const itemsTotal = useMemo(() => 
    cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  , [cart]);

  // Cálculo do Desconto
  const discountValue = useMemo(() => {
    if (!appliedDiscount) return 0;
    if (appliedDiscount.type === 'percent') return (itemsTotal * appliedDiscount.value) / 100;
    return 0;
  }, [itemsTotal, appliedDiscount]);

  // Regra de Frete Grátis via Cupom
  const deliveryFee = useMemo(() => {
    if (appliedDiscount?.type === 'freeShipping') return 0;
    return shipping.fee || 0;
  }, [shipping.fee, appliedDiscount]);

  const finalTotal = itemsTotal - discountValue + deliveryFee;

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setAnimateCart(true);
    setTimeout(() => setAnimateCart(false), 300);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleValidateCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.toUpperCase() })
      });
      const data = await res.json();
      if (data.ok) {
        setCouponStatus({ msg: `✅ ${data.coupon.label}`, type: 'success' });
        setAppliedDiscount({ type: data.coupon.type, value: data.coupon.value || 0 });
      } else {
        setCouponStatus({ msg: `❌ ${data.message}`, type: 'error' });
        setAppliedDiscount(null);
      }
    } catch (err) {
      setCouponStatus({ msg: 'Erro ao validar', type: 'error' });
    }
  };

  const handleCreatePayment = async () => {
    if (!customer.name || !customer.whatsapp || !shipping.calculated) {
      alert("Preencha todos os dados antes de pagar.");
      return;
    }
    setIsPaying(true);
    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart, subtotal: itemsTotal, discount: discountValue, deliveryFee, total: finalTotal, customer, note, couponCode: couponCode.toUpperCase()
        })
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      alert("Erro ao processar pagamento.");
    } finally {
      setIsPaying(false);
    }
  };

  const calculateShipping = async () => {
    if (!customer.neighborhood || !customer.street) {
      alert("Preencha o Bairro e Rua.");
      return;
    }
    setShipping(prev => ({ ...prev, loading: true }));
    try {
      const fullAddress = `${customer.street}, ${customer.number}, ${customer.neighborhood}, ${customer.city}`;
      const res = await fetch('/api/calculate-distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: fullAddress })
      });
      const data = await res.json();
      if (res.ok) setShipping({ fee: data.price, loading: false, calculated: true });
    } catch (err) {
      alert("Erro ao calcular frete");
    } finally {
      setShipping(prev => ({ ...prev, loading: false }));
    }
  };

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(p => 
      (p.category === activeCategory || searchQuery !== '') &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200 overflow-hidden">
                {STORE.logoUrl ? (
                  <img src={STORE.logoUrl} className="w-full h-full object-cover" />
                ) : (
                  <Zap className="text-white fill-white" size={20} />
                )}
             </div>
             <div className="flex flex-col">
                <h1 className="text-lg font-extrabold text-violet-950 leading-none">{STORE.name}</h1>
                <span className="text-[10px] uppercase tracking-widest text-violet-500 font-bold">Premium Delivery</span>
             </div>
          </div>
          <button 
            onClick={() => { setIsCartOpen(true); setCartStep('items'); }}
            className={`relative bg-violet-600 text-white px-5 py-2.5 rounded-2xl font-bold shadow-xl shadow-violet-200 transition-all flex items-center gap-2 ${animateCart ? 'animate-pop' : ''}`}
          >
            <ShoppingCart size={18} />
            <span className="text-sm">{cart.reduce((a, b) => a + b.quantity, 0)}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
        <section className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden group">
          <div className="relative h-56 sm:h-64 overflow-hidden">
            <img 
              src={STORE.bannerUrl} 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
              alt="Banner"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute top-4 right-4">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md ${STORE.status === 'open' ? 'bg-green-500/90 text-white' : 'bg-rose-500/90 text-white'}`}>
                {STORE.status === 'open' ? 'Aberto' : 'Fechado'}
              </span>
            </div>
            <div className="absolute bottom-6 left-6 text-white">
               <div className="flex items-center gap-2 mb-1 opacity-90">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold">{STORE.rating} ({STORE.reviewsCount} avaliações)</span>
               </div>
               <h2 className="text-3xl font-black tracking-tight">{STORE.tagline}</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Clock size={14} className="text-violet-500" /> {STORE.hours}</span>
              <span className="flex items-center gap-1.5"><MapPin size={14} className="text-violet-500" /> {STORE.distance}</span>
              <span className="flex items-center gap-1.5 text-violet-700 font-black">• Mín. R$ {STORE.minOrder.toFixed(2)}</span>
            </div>
          </div>
        </section>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="O que você deseja hoje?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-3xl py-5 pl-12 pr-4 text-slate-700 focus:outline-none focus:ring-4 focus:ring-violet-500/10 shadow-sm transition-all text-lg placeholder:text-slate-300"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-4 sticky top-[68px] z-30 bg-slate-50/90 backdrop-blur-md -mx-4 px-4 custom-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap px-8 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                activeCategory === cat.id 
                  ? 'bg-violet-600 text-white shadow-xl shadow-violet-200' 
                  : 'bg-white text-slate-500 hover:bg-slate-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white p-5 rounded-[32px] shadow-sm hover:shadow-xl border border-slate-100 flex gap-5 cursor-pointer group transition-all duration-300 active:scale-[0.98]" onClick={() => addToCart(product)}>
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  {product.isPopular && <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.2em] text-fuchsia-600 bg-fuchsia-50 px-3 py-1 rounded-full">Destaque</span>}
                  <h4 className="text-xl font-extrabold text-slate-900 leading-tight group-hover:text-violet-700 transition-colors">{product.name}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{product.description}</p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xl font-black text-violet-700">R$ {product.price.toFixed(2)}</span>
                  <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-all shadow-sm">
                    <ShoppingCart size={18} />
                  </div>
                </div>
              </div>
              <div className="w-28 h-28 sm:w-40 sm:h-40 rounded-[24px] overflow-hidden flex-shrink-0 bg-slate-50 shadow-inner group-hover:shadow-lg">
                <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.name} />
              </div>
            </div>
          ))}
        </div>
        
        <div className="pt-10 pb-24 text-center">
           <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">© 2024 • {STORE.name} Premium Delivery</p>
        </div>
      </main>

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-up sm:animate-none overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <button onClick={() => cartStep === 'checkout' ? setCartStep('items') : setIsCartOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-violet-600 transition-colors">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{cartStep === 'items' ? 'Carrinho' : 'Checkout'}</h2>
              <div className="w-10" />
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 grayscale">
                  <ShoppingCart size={60} className="mb-4 text-slate-300" />
                  <p className="font-extrabold text-slate-400 uppercase tracking-widest text-sm">Sua sacola está vazia</p>
                </div>
              ) : cartStep === 'items' ? (
                <>
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.id} className="flex gap-4 p-4 bg-slate-50 rounded-3xl">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white shadow-sm flex-shrink-0">
                          <img src={item.image} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between font-bold text-slate-900 mb-1">
                            <h4 className="truncate">{item.name}</h4>
                            <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-4 bg-white rounded-xl px-3 py-1.5 shadow-sm border border-slate-100">
                              <button onClick={() => updateQuantity(item.id, -1)} className="text-violet-600 font-black">-</button>
                              <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="text-violet-600 font-black">+</button>
                            </div>
                            <span className="text-base font-black text-violet-700">R$ {(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* RASPADINHA / CUPOM */}
                  <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 p-6 rounded-[32px] border border-violet-100 space-y-4 shadow-sm">
                    <div className="flex items-center gap-3 text-violet-800">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Gift size={20} className="text-violet-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-sm uppercase tracking-tight">Raspadinha Premiada</span>
                        <span className="text-[10px] font-bold text-violet-500">DIGITE SEU CÓDIGO</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={couponCode}
                        onChange={(e) => {setCouponCode(e.target.value); setCouponStatus({msg:'', type:null});}}
                        placeholder="CÓDIGO AQUI"
                        className="flex-1 bg-white border border-violet-200 rounded-2xl px-5 py-3 text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all uppercase"
                      />
                      <button onClick={handleValidateCoupon} className="bg-violet-600 text-white px-6 rounded-2xl text-sm font-black shadow-lg shadow-violet-200 active:scale-95 transition-all">
                        OK
                      </button>
                    </div>
                    {couponStatus.msg && (
                      <p className={`text-xs font-bold text-center ${couponStatus.type === 'success' ? 'text-green-600' : 'text-rose-600'}`}>
                        {couponStatus.msg}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Observações</label>
                    <textarea 
                      value={note} onChange={(e) => setNote(e.target.value)}
                      placeholder="Ex: Tirar morango..." 
                      className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-5 text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 min-h-[100px] resize-none" 
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-8">
                   <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Identificação</h3>
                    <div className="space-y-3">
                      <input type="text" placeholder="Nome" value={customer.name} onChange={(e) => setCustomer({...customer, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-slate-900 font-bold" />
                      <input type="text" placeholder="WhatsApp" value={customer.whatsapp} onChange={(e) => setCustomer({...customer, whatsapp: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-slate-900 font-bold" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Onde Entregar</h3>
                    <div className="space-y-3">
                      <input type="text" placeholder="Bairro" value={customer.neighborhood} onChange={(e) => setCustomer({...customer, neighborhood: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-slate-900 font-bold" />
                      <input type="text" placeholder="Rua / Avenida" value={customer.street} onChange={(e) => setCustomer({...customer, street: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-slate-900 font-bold" />
                      <div className="flex gap-3">
                        <input type="text" placeholder="Nº" value={customer.number} onChange={(e) => setCustomer({...customer, number: e.target.value})} className="w-1/3 bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-slate-900 font-bold" />
                        <input type="text" placeholder="Comp." value={customer.complement} onChange={(e) => setCustomer({...customer, complement: e.target.value})} className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-slate-900 font-bold" />
                      </div>
                    </div>
                    <button onClick={calculateShipping} disabled={shipping.loading} className="w-full bg-white border-2 border-violet-100 text-violet-600 py-4 rounded-[24px] font-black shadow-sm flex items-center justify-center gap-2 mt-4 hover:border-violet-600 transition-all">
                      {shipping.loading ? <Loader2 className="animate-spin" size={20} /> : <MapPin size={20} />}
                      {shipping.loading ? 'Calculando Rota...' : 'Calcular Frete'}
                    </button>
                  </div>
                  {shipping.calculated && (
                    <div className="bg-green-50 border border-green-100 p-5 rounded-3xl flex items-center justify-between text-green-800 animate-pop">
                      <span className="font-bold">Taxa de Entrega</span>
                      <span className="text-xl font-black">R$ {deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-8 bg-white border-t border-slate-100 space-y-6 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.1)]">
                <div className="space-y-2">
                   <div className="flex justify-between text-slate-400 text-xs font-bold uppercase tracking-widest">
                      <span>Subtotal</span>
                      <span>R$ {itemsTotal.toFixed(2)}</span>
                   </div>
                   {discountValue > 0 && (
                     <div className="flex justify-between text-rose-500 text-xs font-bold uppercase tracking-widest">
                        <span>Desconto</span>
                        <span>- R$ {discountValue.toFixed(2)}</span>
                     </div>
                   )}
                   <div className="flex justify-between text-slate-400 text-xs font-bold uppercase tracking-widest">
                      <span>Entrega</span>
                      <span>{deliveryFee === 0 && shipping.calculated ? 'GRÁTIS' : `R$ ${deliveryFee.toFixed(2)}`}</span>
                   </div>
                   <div className="flex justify-between text-3xl font-black text-slate-900 pt-2">
                      <span>Total</span>
                      <span className="text-violet-700">R$ {finalTotal.toFixed(2)}</span>
                   </div>
                </div>

                {cartStep === 'items' ? (
                  <button onClick={() => setCartStep('checkout')} className="w-full bg-violet-600 text-white py-5 rounded-[28px] font-black text-lg shadow-2xl shadow-violet-300 hover:bg-violet-700 transition-all">Finalizar Pedido</button>
                ) : (
                  <button disabled={!shipping.calculated || !customer.name || isPaying} onClick={handleCreatePayment} className="w-full bg-violet-600 text-white py-5 rounded-[28px] font-black text-lg shadow-2xl shadow-violet-300 flex items-center justify-center gap-3 disabled:opacity-50 transition-all">
                    {isPaying ? <Loader2 className="animate-spin" size={24} /> : <CreditCard size={24} />} Pagar Agora
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {!isCartOpen && cart.length > 0 && (
        <div className="fixed bottom-6 left-6 right-6 z-40 lg:hidden animate-slide-up">
          <button onClick={() => setIsCartOpen(true)} className="w-full bg-violet-600 text-white py-5 px-8 rounded-[28px] font-black shadow-2xl shadow-violet-400 flex items-center justify-between active:scale-95 transition-all">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><ShoppingCart size={20} /></div>
               <span className="text-sm">{cart.reduce((a, b) => a + b.quantity, 0)} Itens</span>
            </div>
            <span className="text-xl font-black">R$ {finalTotal.toFixed(2)}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
