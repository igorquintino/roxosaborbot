
import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingCart, Search, Star, Clock, MapPin, ChevronLeft, Trash2, Tag, Gift, CheckCircle2, Loader2, CreditCard, Send } from 'lucide-react';
import { Product, CartItem, Category, CustomerData, ShippingState } from './types';
import { STORE, CATEGORIES, PRODUCTS } from './constants';

const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[1].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartStep, setCartStep] = useState<'items' | 'checkout'>('items');
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState<{msg: string, type: 'success' | 'error' | null}>({msg: '', type: null});
  const [appliedDiscount, setAppliedDiscount] = useState<{type: string, value: number} | null>(null);
  const [animateCart, setAnimateCart] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [note, setNote] = useState('');

  const [customer, setCustomer] = useState<CustomerData>({
    name: '',
    whatsapp: '',
    city: 'Conselheiro Lafaiete - MG',
    neighborhood: '',
    street: '',
    number: '',
    complement: ''
  });

  const [shipping, setShipping] = useState<ShippingState>({
    fee: null,
    loading: false,
    calculated: false
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeCategory]);

  const itemsTotal = useMemo(() => 
    cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  , [cart]);

  const discountValue = useMemo(() => {
    if (!appliedDiscount) return 0;
    if (appliedDiscount.type === 'percent') return (itemsTotal * appliedDiscount.value) / 100;
    return 0;
  }, [itemsTotal, appliedDiscount]);

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
      setCouponStatus({ msg: 'Erro ao validar código', type: 'error' });
    }
  };

  const calculateShipping = async () => {
    if (!customer.neighborhood || !customer.street) {
      alert("Preencha o Bairro e Rua para calcular o frete.");
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
      if (res.ok) {
        setShipping({ fee: data.price, loading: false, calculated: true });
      } else {
        alert(data.message || "Erro ao calcular frete");
        setShipping({ fee: null, loading: false, calculated: false });
      }
    } catch (err) {
      alert("Erro de conexão ao calcular frete");
    }
  };

  const handleCreatePayment = async () => {
    if (!customer.name || !customer.whatsapp || !shipping.calculated) {
      alert("Preencha todos os dados e calcule o frete antes de pagar.");
      return;
    }
    setIsPaying(true);
    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart,
          subtotal: itemsTotal,
          discount: discountValue,
          deliveryFee: deliveryFee,
          total: finalTotal,
          customer,
          couponCode: couponCode.toUpperCase(),
          note
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erro ao gerar pagamento: " + (data.message || "Desconhecido"));
      }
    } catch (err) {
      alert("Erro ao processar pagamento.");
    } finally {
      setIsPaying(false);
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
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-violet-900 tracking-tight">Roxo Sabor</h1>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Clock size={12} className="text-slate-400" />
              {STORE.hours}
            </p>
          </div>
          <button 
            onClick={() => { setIsCartOpen(true); setCartStep('items'); }}
            className={`relative bg-violet-600 text-white px-4 py-2 rounded-full font-semibold shadow-lg shadow-violet-200 active:scale-95 transition-all flex items-center gap-2 ${animateCart ? 'animate-pop' : ''}`}
          >
            <ShoppingCart size={18} />
            <span className="text-sm">Carrinho ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden group">
          <div className="relative h-48 sm:h-56 overflow-hidden">
            <img src="https://picsum.photos/seed/acai-banner/800/400" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute top-4 right-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${STORE.status === 'open' ? 'bg-green-500 text-white' : 'bg-rose-500 text-white'}`}>
                {STORE.status === 'open' ? 'Aberto Agora' : 'Loja Fechada'}
              </span>
            </div>
          </div>
          <div className="p-6 relative">
            <div className="absolute -top-10 left-6">
              <div className="w-20 h-20 rounded-2xl bg-violet-600 p-1 shadow-xl">
                <div className="w-full h-full bg-white rounded-xl flex items-center justify-center overflow-hidden font-black text-violet-700 text-[10px] text-center px-1">ROXO<br/>SABOR</div>
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-extrabold text-slate-800">Roxo Sabor - Matriz</h2>
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                  <Star size={16} className="text-amber-400 fill-amber-400" />
                  <span className="text-sm font-bold text-amber-700">{STORE.rating}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                <span className="flex items-center gap-1"><MapPin size={14} /> {STORE.distance}</span>
                <span className="flex items-center gap-1">• Mín. R$ {STORE.minOrder.toFixed(2)}</span>
              </div>
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
            className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 sticky top-[68px] z-30 bg-slate-50/80 backdrop-blur-sm -mx-4 px-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeCategory === cat.id ? 'bg-violet-600 text-white shadow-lg' : 'bg-white text-slate-600'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex gap-4 cursor-pointer group active:scale-[0.98]" onClick={() => addToCart(product)}>
              <div className="flex-1 space-y-2">
                {product.isPopular && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full"><Tag size={10} /> O Mais Pedido</span>}
                <h4 className="font-bold text-slate-800 leading-tight group-hover:text-violet-700">{product.name}</h4>
                <p className="text-sm text-slate-500 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-lg font-bold text-violet-700">R$ {product.price.toFixed(2)}</span>
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-all">+</div>
                </div>
              </div>
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100 shadow-inner">
                <img src={product.image} className="w-full h-full object-cover" />
              </div>
            </div>
          ))}
        </div>
      </main>

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-up sm:animate-none">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <button onClick={() => cartStep === 'checkout' ? setCartStep('items') : setIsCartOpen(false)} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-xl font-bold text-slate-800">{cartStep === 'items' ? 'Seu Pedido' : 'Finalizar Pedido'}</h2>
              <div className="w-10" />
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-slate-400">
                  <ShoppingCart size={48} />
                  <p className="font-bold text-slate-800">Seu carrinho está vazio</p>
                </div>
              ) : cartStep === 'items' ? (
                <>
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.id} className="flex gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100"><img src={item.image} className="w-full h-full object-cover" /></div>
                        <div className="flex-1">
                          <div className="flex justify-between font-bold text-slate-800">
                            <h4 className="truncate">{item.name}</h4>
                            <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                              <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center font-bold">-</button>
                              <span className="text-xs font-bold">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center font-bold">+</button>
                            </div>
                            <span className="text-sm font-bold text-violet-700">R$ {(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Observações</label>
                    <textarea 
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ex: Sem granola..." 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none min-h-[80px] resize-none" 
                    />
                  </div>

                  <div className="bg-violet-50 p-4 rounded-3xl border border-violet-100 space-y-3">
                    <div className="flex items-center gap-2 text-violet-700">
                      <Gift size={20} className="animate-bounce" />
                      <span className="font-bold">Raspadinha Roxo Sabor</span>
                    </div>
                    <p className="text-xs text-violet-600/80 leading-relaxed font-medium">
                      Raspou, achou, ganhou! Digite seu código para validar seu prêmio acumulado.
                    </p>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={couponCode}
                        onChange={(e) => {setCouponCode(e.target.value); setCouponStatus({msg:'', type:null});}}
                        placeholder="Digite seu código"
                        className="flex-1 bg-white border border-violet-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                      />
                      <button onClick={handleValidateCoupon} className="bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-violet-200 active:scale-95 transition-transform">
                        Validar
                      </button>
                    </div>
                    {couponStatus.msg && (
                      <p className={`text-xs font-bold ${couponStatus.type === 'success' ? 'text-green-600' : 'text-rose-600'}`}>
                        {couponStatus.msg}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-700">Seus dados</h3>
                    <div className="space-y-3">
                      <input type="text" placeholder="Seu nome" value={customer.name} onChange={(e) => setCustomer({...customer, name: e.target.value})} className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-5 text-slate-700 focus:ring-2 focus:ring-violet-500/20" />
                      <input type="text" placeholder="Telefone (WhatsApp)" value={customer.whatsapp} onChange={(e) => setCustomer({...customer, whatsapp: e.target.value})} className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-5 text-slate-700 focus:ring-2 focus:ring-violet-500/20" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-700">Endereço para entrega</h3>
                    <div className="space-y-3">
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 text-slate-700 font-medium">{customer.city}</div>
                      <input type="text" placeholder="Bairro" value={customer.neighborhood} onChange={(e) => setCustomer({...customer, neighborhood: e.target.value})} className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-5 text-slate-700 focus:ring-2 focus:ring-violet-500/20" />
                      <input type="text" placeholder="Rua / Avenida" value={customer.street} onChange={(e) => setCustomer({...customer, street: e.target.value})} className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-5 text-slate-700 focus:ring-2 focus:ring-violet-500/20" />
                      <div className="flex gap-3">
                        <input type="text" placeholder="Número" value={customer.number} onChange={(e) => setCustomer({...customer, number: e.target.value})} className="w-1/3 bg-white border border-slate-200 rounded-2xl py-3 px-5 text-slate-700 focus:ring-2 focus:ring-violet-500/20" />
                        <input type="text" placeholder="Complemento (opc)" value={customer.complement} onChange={(e) => setCustomer({...customer, complement: e.target.value})} className="flex-1 bg-white border border-slate-200 rounded-2xl py-3 px-5 text-slate-700 focus:ring-2 focus:ring-violet-500/20" />
                      </div>
                    </div>
                    <button onClick={calculateShipping} disabled={shipping.loading} className="w-full bg-violet-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-violet-200 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2 disabled:bg-violet-400">
                      {shipping.loading ? <Loader2 className="animate-spin" size={20} /> : shipping.calculated ? <CheckCircle2 size={20} /> : null}
                      {shipping.loading ? 'Calculando...' : 'Calcular frete automaticamente'}
                    </button>
                  </div>

                  {shipping.calculated && (
                    <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex items-center justify-between text-green-800">
                      <span className="text-sm font-medium">Taxa de entrega calculada:</span>
                      <span className="font-bold">R$ {deliveryFee.toFixed(2)} {appliedDiscount?.type === 'freeShipping' && <span className="text-[10px] ml-1 opacity-60">(Grátis via Cupom)</span>}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 bg-white border-t border-slate-100 space-y-4 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-500 text-sm"><span>Subtotal</span><span>R$ {itemsTotal.toFixed(2)}</span></div>
                  {discountValue > 0 && <div className="flex justify-between text-rose-500 text-sm"><span>Desconto Cupom</span><span>- R$ {discountValue.toFixed(2)}</span></div>}
                  <div className="flex justify-between text-slate-500 text-sm"><span>Frete</span><span>{deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2)}`}</span></div>
                  <div className="flex justify-between text-xl font-black text-slate-800 pt-1"><span>Total</span><span className="text-violet-700">R$ {finalTotal.toFixed(2)}</span></div>
                </div>

                {cartStep === 'items' ? (
                  <button onClick={() => setCartStep('checkout')} className="w-full bg-violet-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-violet-200 flex items-center justify-center gap-2">Próximo passo</button>
                ) : (
                  <div className="space-y-2">
                    <button 
                      disabled={!shipping.calculated || !customer.name || !customer.whatsapp || isPaying} 
                      onClick={handleCreatePayment}
                      className="w-full bg-violet-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-violet-200 disabled:opacity-50 flex items-center justify-center gap-3 transition-all hover:bg-violet-700"
                    >
                      {isPaying ? <Loader2 className="animate-spin" size={20} /> : <CreditCard size={20} />}
                      Pagar com Cartão ou Saldo (Mercado Pago)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {!isCartOpen && cart.length > 0 && (
        <div className="fixed bottom-6 left-6 right-6 z-40 lg:hidden">
          <button onClick={() => setIsCartOpen(true)} className={`w-full bg-violet-600 text-white py-4 px-6 rounded-2xl font-bold shadow-2xl shadow-violet-300 flex items-center justify-between ${animateCart ? 'animate-pop' : 'animate-slide-up'}`}>
            <div className="flex items-center gap-3"><ShoppingCart size={20} /><span>Ver Carrinho ({cart.reduce((a, b) => a + b.quantity, 0)})</span></div>
            <span className="text-lg font-black">R$ {itemsTotal.toFixed(2)}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
