'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Split, 
  User, 
  Sparkles,
  Calculator,
  Percent,
  Receipt,
  X,
  Copy,
  Check
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Product, Customer, StoreSettings, PaymentMethod, Sale, SaleItem } from '@/lib/types';
import { getProducts, getCustomers, getStoreSettings, getCardMachines, createSale } from '@/lib/store';
import ReceiptModal from '@/components/ReceiptModal';
import CardRateCalculator from '@/components/CardRateCalculator';

interface CartItem extends SaleItem {
  maxStock: number;
}

export default function PDVPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-400">Carregando Frente de Caixa...</div>}>
      <PDVContent />
    </React.Suspense>
  );
}

function PDVContent() {
  const searchParams = useSearchParams();
  const addSkuParam = searchParams.get('addSku');
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [search, setSearch] = useState('');
  
  // Carrinho
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('Cliente Balcão');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Pagamento
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [installments, setInstallments] = useState<number>(1);
  const [selectedMachine, setSelectedMachine] = useState('InfinitePay (Smart)');
  const [cardRateApplied, setCardRateApplied] = useState(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [sellerName, setSellerName] = useState('Lucas Imports');
  const [saleNotes, setSaleNotes] = useState('');

  // Modais
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);

  const loadData = async () => {
    const [pList, cList, sSet, machines] = await Promise.all([
      getProducts(),
      getCustomers(),
      getStoreSettings(),
      getCardMachines(),
    ]);
    const activeProds = pList.filter(p => p.active);
    setProducts(activeProds);
    setCustomers(cList);
    setSettings(sSet);
    if (machines.length > 0) {
      setSelectedMachine(machines[0].name);
    }

    // Se houver addSku na URL vindo das Etiquetas / QR Code, adiciona direto
    if (addSkuParam) {
      const target = activeProds.find(p => (p.sku && p.sku.toLowerCase() === addSkuParam.toLowerCase()) || p.id === addSkuParam);
      if (target) {
        addToCart(target);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [addSkuParam]);

  // Adicionar item ao carrinho
  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      alert(`O perfume ${product.name} está esgotado no momento!`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          alert(`Estoque máximo disponível atingido (${product.stock_quantity} unidades).`);
          return prev;
        }
        return prev.map(item => 
          item.product_id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total_price: (item.quantity + 1) * item.unit_price,
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            id: 'item-' + Date.now(),
            product_id: product.id,
            product_name: `${product.name} (${product.brand} - ${product.volume_ml}ml)`,
            brand: product.brand,
            volume_ml: product.volume_ml,
            unit_cost: product.cost_price,
            unit_price: product.sale_price,
            quantity: 1,
            total_price: product.sale_price,
            maxStock: product.stock_quantity,
          }
        ];
      }
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => 
      prev
        .map(item => {
          if (item.product_id === productId) {
            const nextQtd = item.quantity + delta;
            if (nextQtd <= 0) return null;
            if (nextQtd > item.maxStock) {
              alert(`Limite de estoque atingido (${item.maxStock} un).`);
              return item;
            }
            return {
              ...item,
              quantity: nextQtd,
              total_price: nextQtd * item.unit_price,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  // Cálculos do Carrinho
  const subtotal = cart.reduce((acc, item) => acc + item.total_price, 0);
  const total = Math.max(0, subtotal - discountAmount);
  const changeAmount = paymentMethod === 'DINHEIRO' && cashReceived > total ? cashReceived - total : 0;

  // Seleção de cliente cadastrado
  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    const found = customers.find(c => c.id === id);
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone);
    } else {
      setCustomerName('Cliente Balcão');
      setCustomerPhone('');
    }
  };

  // Finalizar Venda
  const handleFinalizeSale = async () => {
    if (cart.length === 0) {
      alert('Adicione pelo menos um perfume ao carrinho antes de finalizar.');
      return;
    }

    if (paymentMethod === 'DINHEIRO' && cashReceived < total && cashReceived > 0) {
      alert(`Valor em dinheiro recebido (R$ ${cashReceived.toFixed(2)}) é inferior ao total da venda (R$ ${total.toFixed(2)}).`);
      return;
    }

    let netReceived = total;
    if (paymentMethod === 'CARTAO_CREDITO' || paymentMethod === 'CARTAO_DEBITO') {
      const deduction = total * (cardRateApplied / 100);
      netReceived = total - deduction;
    }

    const sale = await createSale({
      customer_id: selectedCustomerId || undefined,
      customer_name: customerName,
      customer_phone: customerPhone || undefined,
      subtotal,
      discount: discountAmount,
      total,
      payment_method: paymentMethod,
      installments,
      card_machine: (paymentMethod === 'CARTAO_CREDITO' || paymentMethod === 'CARTAO_DEBITO') ? selectedMachine : undefined,
      card_rate_applied: cardRateApplied,
      net_received: netReceived,
      status: 'CONCLUIDA',
      invoice_status: 'NAO_EMITIDA',
      seller_name: sellerName,
      notes: saleNotes || undefined,
      items: cart.map(({ maxStock, ...it }) => it),
    });

    // Abrir comprovante de venda imediatamente!
    setCompletedSale(sale);
    // Limpar carrinho
    setCart([]);
    setDiscountAmount(0);
    setCashReceived(0);
    setSaleNotes('');
    // Recarregar dados de produtos para atualizar estoque em tela
    await loadData();
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search))
  );

  return (
    <div className="space-y-4">
      {/* Cabeçalho do PDV */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-gold-400">
            <ShoppingCart className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Frente de Caixa & Balcão</span>
          </div>
          <h1 className="text-2xl font-black text-zinc-100">
            PDV Absolut Parfum
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowSimulatorModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-gold-500/40 bg-zinc-900 px-3.5 py-2 text-xs font-bold text-gold-300 hover:bg-gold-500/10 transition-all"
          >
            <Calculator className="h-4 w-4 text-gold-400" />
            <span>Simulador de Taxas</span>
          </button>
        </div>
      </div>

      {/* Grid Principal: 2 Colunas (Produtos na Esquerda, Caixa/Carrinho na Direita) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* =================================================== */}
        {/* COLUNA ESQUERDA: CATÁLOGO DE FRAGRÂNCIAS (7 colunas) */}
        {/* =================================================== */}
        <div className="space-y-4 lg:col-span-7">
          {/* Campo de Busca Rápida / Código de Barras */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Digite o perfume, grife (Dior, Creed...), SKU ou bip o código de barras..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 py-3 pl-10 pr-4 text-xs font-medium text-zinc-100 placeholder-zinc-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 shadow-lg"
              autoFocus
            />
          </div>

          {/* Grid de Cards de Perfumes */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
            {filteredProducts.map((prod) => {
              const inCart = cart.find(item => item.product_id === prod.id);
              const isOutOfStock = prod.stock_quantity <= 0;

              return (
                <div
                  key={prod.id}
                  onClick={() => !isOutOfStock && addToCart(prod)}
                  className={`group relative flex cursor-pointer gap-3 rounded-xl border p-3 transition-all ${
                    isOutOfStock
                      ? 'border-zinc-800/40 bg-zinc-950/40 opacity-50 cursor-not-allowed'
                      : inCart
                      ? 'border-gold-500/60 bg-zinc-900/90 shadow-md shadow-gold-500/10'
                      : 'border-zinc-800/80 bg-zinc-900/60 hover:border-gold-500/40 hover:bg-zinc-850'
                  }`}
                >
                  <img
                    src={prod.image_url || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600'}
                    alt={prod.name}
                    className="h-20 w-16 rounded-lg object-cover bg-zinc-950 border border-zinc-800 group-hover:scale-105 transition-transform"
                  />

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gold-400">
                        {prod.brand}
                      </div>
                      <h4 className="text-xs font-bold text-zinc-100 line-clamp-1">
                        {prod.name}
                      </h4>
                      <p className="text-[10px] text-zinc-400">
                        {prod.volume_ml}ml • {prod.concentration}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                      <div>
                        <span className="text-xs font-black text-gold-400 font-mono">
                          R$ {prod.sale_price.toFixed(2)}
                        </span>
                      </div>

                      <div className="text-right">
                        {isOutOfStock ? (
                          <span className="text-[9px] font-bold text-rose-400">Esgotado</span>
                        ) : (
                          <span className="text-[10px] font-mono text-zinc-400">
                            {prod.stock_quantity} un
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {inCart && (
                    <div className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-[10px] font-black text-zinc-950 shadow-md">
                      {inCart.quantity}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* =================================================== */}
        {/* COLUNA DIREITA: CARRINHO & CHECKOUT (5 colunas) */}
        {/* =================================================== */}
        <div id="checkout-panel" className="space-y-4 lg:col-span-5">
          <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-2xl overflow-hidden">
            
            {/* Topo do Carrinho */}
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 p-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-gold-400" />
                <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                  Itens da Venda ({cart.reduce((a, b) => a + b.quantity, 0)})
                </h3>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-[10px] font-semibold text-rose-400 hover:underline"
                >
                  Limpar Carrinho
                </button>
              )}
            </div>

            {/* Identificação do Cliente */}
            <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-zinc-400 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-gold-400" />
                  <span>Cliente:</span>
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleSelectCustomer(e.target.value)}
                  className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-gold-500 focus:outline-none"
                >
                  <option value="">Cliente Avulso / Balcão</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {!selectedCustomerId && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nome do cliente"
                    className="rounded border border-zinc-800 bg-zinc-950 p-1.5 text-zinc-200 placeholder-zinc-600 focus:border-gold-500"
                  />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="WhatsApp (ex: 11999999999)"
                    className="rounded border border-zinc-800 bg-zinc-950 p-1.5 text-zinc-200 placeholder-zinc-600 focus:border-gold-500"
                  />
                </div>
              )}
            </div>

            {/* Lista de Itens no Carrinho */}
            <div className="max-h-56 overflow-y-auto p-4 divide-y divide-zinc-850">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs">
                  <ShoppingCart className="mx-auto h-8 w-8 text-zinc-700 mb-2 opacity-50" />
                  <p>Carrinho vazio.</p>
                  <p className="text-[10px] text-zinc-600">Clique em qualquer fragrância para adicionar.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product_id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                    <div className="flex-1">
                      <div className="font-bold text-zinc-200 line-clamp-1">{item.product_name}</div>
                      <div className="text-[10px] text-gold-400 font-mono">
                        R$ {item.unit_price.toFixed(2)} un
                      </div>
                    </div>

                    {/* Controles de Quantidade */}
                    <div className="flex items-center gap-1.5 bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product_id, -1)}
                        className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center font-mono font-bold text-zinc-100">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product_id, 1)}
                        className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="w-20 text-right font-mono font-bold text-zinc-100">
                      R$ {item.total_price.toFixed(2)}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.product_id)}
                      className="p-1 text-zinc-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Configuração de Pagamento & Desconto */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 space-y-3 text-xs">
              
              {/* Botões de Forma de Pagamento */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PIX')}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border font-semibold transition-all ${
                      paymentMethod === 'PIX'
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <QrCode className="h-4 w-4 mb-1 text-emerald-400" />
                    <span className="text-[10px]">PIX</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARTAO_CREDITO')}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border font-semibold transition-all ${
                      paymentMethod === 'CARTAO_CREDITO'
                        ? 'border-gold-500 bg-gold-950/40 text-gold-300'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <CreditCard className="h-4 w-4 mb-1 text-gold-400" />
                    <span className="text-[10px]">Crédito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARTAO_DEBITO')}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border font-semibold transition-all ${
                      paymentMethod === 'CARTAO_DEBITO'
                        ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <CreditCard className="h-4 w-4 mb-1 text-cyan-400" />
                    <span className="text-[10px]">Débito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('DINHEIRO')}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border font-semibold transition-all ${
                      paymentMethod === 'DINHEIRO'
                        ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Banknote className="h-4 w-4 mb-1 text-amber-400" />
                    <span className="text-[10px]">Dinheiro</span>
                  </button>
                </div>
              </div>

              {/* Detalhes específicos de cada pagamento */}
              {paymentMethod === 'PIX' && settings && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Chave PIX da Absolut:</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(settings.pix_key);
                        setPixCopied(true);
                        setTimeout(() => setPixCopied(false), 2000);
                      }}
                      className="flex items-center gap-1 text-emerald-400 font-bold hover:underline"
                    >
                      {pixCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{pixCopied ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                  <div className="font-mono font-bold text-zinc-200 text-[11px] break-all">
                    {settings.pix_key}
                  </div>
                </div>
              )}

              {paymentMethod === 'DINHEIRO' && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Valor Entregue pelo Cliente (R$):</span>
                    <input
                      type="number"
                      step="0.50"
                      value={cashReceived || ''}
                      onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
                      className="w-28 rounded border border-zinc-700 bg-zinc-900 p-1 text-right font-mono font-bold text-zinc-100"
                    />
                  </div>
                  {cashReceived > total && (
                    <div className="flex items-center justify-between border-t border-zinc-800 pt-1 text-xs">
                      <span className="font-bold text-emerald-400">Troco a Devolver:</span>
                      <span className="font-mono font-black text-sm text-emerald-400">
                        R$ {changeAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'CARTAO_CREDITO' && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Parcelas no Cartão:</span>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(parseInt(e.target.value))}
                      className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono font-bold text-zinc-200"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                        <option key={n} value={n}>
                          {n}x de R$ {(total / n).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Desconto */}
              <div className="flex items-center justify-between border-t border-zinc-800/80 pt-2 text-xs">
                <span className="text-zinc-400">Desconto Concedido (R$):</span>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0,00"
                  className="w-24 rounded border border-zinc-700 bg-zinc-900 p-1 text-right font-mono font-bold text-zinc-200"
                />
              </div>

              {/* Resumo Final */}
              <div className="space-y-1 border-t border-zinc-800 pt-3">
                <div className="flex justify-between text-zinc-400 text-xs">
                  <span>Subtotal:</span>
                  <span className="font-mono">R$ {subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 text-xs">
                    <span>Desconto:</span>
                    <span className="font-mono">- R$ {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-zinc-100 border-t border-zinc-800 pt-2">
                  <span>VALOR TOTAL:</span>
                  <span className="font-mono text-gold-400 text-lg">
                    R$ {total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botão Concluir Venda */}
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={handleFinalizeSale}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-amber-500 p-3 text-sm font-black text-zinc-950 shadow-lg shadow-gold-500/25 hover:brightness-110 active:scale-98 disabled:opacity-50 transition-all"
              >
                <Receipt className="h-5 w-5" />
                <span>Finalizar Venda & Emitir Comprovante</span>
              </button>

            </div>
          </div>
        </div>

      </div>

      {/* Barra Flutuante Mobile de Carrinho para iPhone 16 Pro Max e S24 Ultra */}
      {cart.length > 0 && (
        <div className="fixed bottom-20 left-3 right-3 z-30 block lg:hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
          <button
            type="button"
            onClick={() => {
              document.getElementById('checkout-panel')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full flex items-center justify-between rounded-2xl bg-gradient-to-r from-gold-500 via-gold-400 to-amber-500 p-3.5 text-zinc-950 shadow-2xl shadow-gold-500/40 ring-2 ring-gold-300/60 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-950 text-gold-400 font-black text-xs">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </div>
              <div className="text-left">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-900 leading-tight">
                  Carrinho Aberto
                </span>
                <span className="block text-sm font-black font-mono leading-tight">
                  R$ {total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-black uppercase tracking-wider bg-zinc-950/15 px-3 py-1.5 rounded-xl">
              <span>Finalizar</span>
              <span>➔</span>
            </div>
          </button>
        </div>
      )}

      {/* Modal de Simulação de Taxas (quando acionado pelo botão no PDV) */}
      {showSimulatorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Calculator className="h-4 w-4 text-gold-400" />
                <span>Simulador de Taxas de Cartão para o PDV</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSimulatorModal(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <CardRateCalculator
              initialAmount={total > 0 ? total : 1000}
              onApplyToSale={({ installments: inst, rate, machine }) => {
                setPaymentMethod('CARTAO_CREDITO');
                setInstallments(inst);
                setSelectedMachine(machine);
                setCardRateApplied(rate);
                setShowSimulatorModal(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal de Comprovante de Venda (Abre logo após finalizar a venda!) */}
      {completedSale && settings && (
        <ReceiptModal
          sale={completedSale}
          settings={settings}
          onClose={() => setCompletedSale(null)}
        />
      )}
    </div>
  );
}
