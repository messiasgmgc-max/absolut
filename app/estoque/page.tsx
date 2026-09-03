'use client';

import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  ArrowDownRight, 
  ArrowUpRight, 
  RefreshCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Minus, 
  Search,
  History,
  Package,
  X
} from 'lucide-react';
import { Product, InventoryMovement } from '@/lib/types';
import { getProducts, getInventoryMovements, addInventoryMovement } from '@/lib/store';

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory');
  
  // Modal de movimentação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<'ENTRADA' | 'SAIDA' | 'AJUSTE'>('ENTRADA');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');

  const loadData = async () => {
    const [pList, mList] = await Promise.all([
      getProducts(),
      getInventoryMovements(),
    ]);
    setProducts(pList);
    setMovements(mList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openMovementModal = (product: Product, type: 'ENTRADA' | 'SAIDA' | 'AJUSTE') => {
    setSelectedProduct(product);
    setMovementType(type);
    setQuantity(1);
    setReason(type === 'ENTRADA' ? 'Compra com fornecedor' : type === 'SAIDA' ? 'Avaria / Tester' : 'Balanço periódico');
    setIsModalOpen(true);
  };

  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    await addInventoryMovement({
      product_id: selectedProduct.id,
      type: movementType,
      quantity: quantity,
      reason: reason,
      user_name: 'Lucas Imports',
    });

    setIsModalOpen(false);
    setSelectedProduct(null);
    await loadData();
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockProducts = products.filter(p => p.stock_quantity <= p.min_stock);
  const totalItems = products.reduce((acc, p) => acc + p.stock_quantity, 0);
  const totalCost = products.reduce((acc, p) => acc + (p.stock_quantity * p.cost_price), 0);
  const totalSaleValue = products.reduce((acc, p) => acc + (p.stock_quantity * p.sale_price), 0);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-gold-400">
            <Boxes className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Gestão de Almoxarifado</span>
          </div>
          <h1 className="text-2xl font-black text-zinc-100">
            Controle de Estoque & Movimentações
          </h1>
          <p className="text-xs text-zinc-400">
            Monitore níveis de estoque, entradas de fornecedores, perdas e auditoria de inventário.
          </p>
        </div>

        {/* Abas */}
        <div className="flex rounded-xl bg-zinc-900 border border-zinc-800 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition-all ${
              activeTab === 'inventory' ? 'bg-gold-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Saldos de Estoque</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition-all ${
              activeTab === 'history' ? 'bg-gold-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Histórico de Auditoria</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas do Estoque */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
          <span className="text-xs font-semibold text-zinc-400 uppercase">Total de Unidades</span>
          <div className="mt-1 text-2xl font-black text-zinc-100">{totalItems} frascos</div>
          <p className="text-[11px] text-zinc-500 mt-1">{products.length} itens distintos no catálogo</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
          <span className="text-xs font-semibold text-zinc-400 uppercase">Custo Imobilizado</span>
          <div className="mt-1 text-2xl font-black text-zinc-200 font-mono">
            R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Capital investido em mercadorias</p>
        </div>

        <div className="rounded-xl border border-gold-500/30 bg-zinc-900/80 p-4">
          <span className="text-xs font-semibold text-gold-400 uppercase">Potencial de Venda</span>
          <div className="mt-1 text-2xl font-black text-gold-400 font-mono">
            R$ {totalSaleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Lucro projetado: R$ {(totalSaleValue - totalCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className={`rounded-xl border p-4 ${
          lowStockProducts.length > 0 
            ? 'border-amber-500/40 bg-amber-950/20 text-amber-300' 
            : 'border-zinc-800 bg-zinc-900/80 text-zinc-400'
        }`}>
          <span className="text-xs font-semibold uppercase">Estoque Crítico</span>
          <div className="mt-1 text-2xl font-black">{lowStockProducts.length} produtos</div>
          <p className="text-[11px] mt-1 opacity-80">
            {lowStockProducts.length > 0 ? 'Exigem reposição urgente!' : 'Nenhum item em nível crítico'}
          </p>
        </div>
      </div>

      {/* ABA 1: SALDOS DE ESTOQUE */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar perfume por nome, marca ou SKU para dar entrada ou saída..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2.5 pl-10 pr-4 text-xs text-zinc-100 placeholder-zinc-500 focus:border-gold-500 focus:outline-none"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="py-3 px-4">Perfume / Grife</th>
                    <th className="py-3 px-4 text-center">Tipo & Vol</th>
                    <th className="py-3 px-4 text-right">Custo Un.</th>
                    <th className="py-3 px-4 text-center">Saldo Atual</th>
                    <th className="py-3 px-4 text-center">Mínimo</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Ações Rápidas de Estoque</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {filteredProducts.map((p) => {
                    const isLow = p.stock_quantity <= p.min_stock;

                    return (
                      <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-zinc-100">{p.name}</div>
                          <div className="text-[11px] text-gold-400 font-semibold">{p.brand}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">SKU: {p.sku}</div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="text-[11px] text-zinc-300 font-medium">
                            {p.volume_ml}ml
                          </span>
                          <div className="text-[10px] text-zinc-500">{p.concentration}</div>
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-zinc-400">
                          R$ {p.cost_price.toFixed(2)}
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-black text-sm">
                          <span className={`px-2 py-0.5 rounded ${
                            isLow ? 'bg-rose-950/80 border border-rose-600/40 text-rose-300' : 'text-zinc-100'
                          }`}>
                            {p.stock_quantity} un
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center font-mono text-zinc-400">
                          {p.min_stock} un
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Repor</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>OK</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openMovementModal(p, 'ENTRADA')}
                              className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-900/60 transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                              <span>Entrada</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openMovementModal(p, 'SAIDA')}
                              className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-950/40 px-2.5 py-1 text-[11px] font-semibold text-rose-400 hover:bg-rose-900/60 transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                              <span>Saída</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openMovementModal(p, 'AJUSTE')}
                              className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-700 transition-colors"
                            >
                              <RefreshCcw className="h-3 w-3" />
                              <span>Ajustar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: HISTÓRICO DE AUDITORIA DE MOVIMENTAÇÕES */}
      {activeTab === 'history' && (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-xl">
          <div className="p-4 border-b border-zinc-800 bg-zinc-950/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Auditoria de Entradas, Saídas e Vendas
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="border-b border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Perfume</th>
                  <th className="py-3 px-4 text-center">Qtd</th>
                  <th className="py-3 px-4 text-center">Antes → Depois</th>
                  <th className="py-3 px-4">Motivo / Referência</th>
                  <th className="py-3 px-4">Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-500">
                      Nenhuma movimentação manual registrada ainda. Vendas concluídas no PDV aparecerão aqui automaticamente.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="hover:bg-zinc-800/40">
                      <td className="py-2.5 px-4 font-mono text-[11px] text-zinc-400">
                        {new Date(m.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                          m.type === 'ENTRADA'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                            : m.type === 'SAIDA'
                            ? 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        }`}>
                          {m.type === 'ENTRADA' ? <ArrowUpRight className="h-3 w-3" /> : m.type === 'SAIDA' ? <ArrowDownRight className="h-3 w-3" /> : <RefreshCcw className="h-3 w-3" />}
                          <span>{m.type}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-zinc-200">
                        {m.product_name || 'Produto'}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold">
                        {m.type === 'ENTRADA' ? `+${m.quantity}` : m.type === 'SAIDA' ? `-${m.quantity}` : `${m.quantity}`} un
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono text-zinc-400 text-[11px]">
                        {m.previous_stock} un → <b className="text-zinc-100">{m.new_stock} un</b>
                      </td>
                      <td className="py-2.5 px-4 text-zinc-400">
                        {m.reason}
                      </td>
                      <td className="py-2.5 px-4 text-zinc-400 text-[11px]">
                        {m.user_name}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para Registrar Movimentação Manual */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-zinc-100">
                Registrar Movimento: {movementType}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 rounded-xl bg-zinc-950 p-3 border border-zinc-800">
              <p className="text-xs font-bold text-zinc-200">{selectedProduct.name}</p>
              <p className="text-[11px] text-gold-400">{selectedProduct.brand} • {selectedProduct.volume_ml}ml</p>
              <p className="text-xs text-zinc-400 mt-1 font-mono">
                Estoque atual: <b className="text-zinc-100">{selectedProduct.stock_quantity} unidades</b>
              </p>
            </div>

            <form onSubmit={handleSaveMovement} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  {movementType === 'AJUSTE' ? 'Novo Saldo Real (Inventário)' : 'Quantidade de Unidades'} *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 text-zinc-100 focus:border-gold-500 font-mono text-base font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Motivo / Observação *</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 text-zinc-100 focus:border-gold-500"
                  placeholder="Ex: Reposição lote #482, brinde cliente VIP, frasco danificado..."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-zinc-700 px-4 py-2 font-medium text-zinc-300 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gold-500 px-5 py-2 font-bold text-zinc-950 hover:brightness-110"
                >
                  Confirmar {movementType}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
