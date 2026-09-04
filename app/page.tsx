'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  AlertTriangle, 
  ArrowUpRight, 
  FileSpreadsheet, 
  PlusCircle, 
  Calculator,
  Eye,
  CheckCircle2,
  Clock
} from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import ReceiptModal from '@/components/ReceiptModal';
import { getDashboardMetrics, getStoreSettings } from '@/lib/store';
import { Sale, StoreSettings } from '@/lib/types';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [m, s] = await Promise.all([
        getDashboardMetrics(),
        getStoreSettings(),
      ]);
      setMetrics(m);
      setSettings(s);
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold-500 border-t-transparent" />
          <p className="text-xs uppercase tracking-widest text-gold-400">Carregando dados da Absolut Parfum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Banner de Boas-Vindas */}
      <div className="relative overflow-hidden rounded-2xl border border-gold-500/30 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-4 sm:p-6 md:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-gold-400">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Painel Executivo</span>
            </div>
            <h1 className="mt-1 text-2xl md:text-3xl font-black tracking-tight text-zinc-100">
              Absolut Parfum <span className="gold-gradient-text">Privilege</span>
            </h1>
            <p className="mt-1 text-xs md:text-sm text-zinc-400 max-w-xl">
              Gestão de fragrâncias de alto padrão, fracionados exclusivos, frente de caixa rápida, controle de estoque e simulação de margem.
            </p>
          </div>

          {/* Botões Rápidos de Ação */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/pdv"
              className="flex items-center gap-2 rounded-xl bg-gold-500 px-4 py-2.5 text-xs font-bold text-zinc-950 shadow-lg shadow-gold-500/25 hover:brightness-110 active:scale-95 transition-all"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Nova Venda (PDV)</span>
            </Link>

            <Link
              href="/produtos/importar"
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 hover:border-gold-500/50 hover:text-gold-300 transition-all"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>Importar Excel/CSV</span>
            </Link>

            <Link
              href="/taxas"
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 hover:border-gold-500/50 hover:text-gold-300 transition-all"
            >
              <Calculator className="h-4 w-4 text-gold-400" />
              <span>Simular Taxas</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid de Métricas Financeiras e de Estoque */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Faturamento Bruto"
          value={`R$ ${metrics.grossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={`${metrics.completedSalesCount} vendas concluídas`}
          icon={DollarSign}
          variant="gold"
          trend="+ Margem Alta"
        />

        <MetricCard
          title="Lucro Líquido Estimado"
          value={`R$ ${metrics.estimatedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="Após custos de mercadoria e taxas"
          icon={TrendingUp}
          variant="emerald"
        />

        <MetricCard
          title="Estoque em Mercadoria"
          value={`R$ ${metrics.totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={`${metrics.totalStockItems} frascos e decants`}
          icon={Package}
          variant="zinc"
        />

        <MetricCard
          title="Alertas de Estoque"
          value={metrics.lowStockCount}
          subtitle={metrics.lowStockCount > 0 ? "Produtos no nível mínimo" : "Estoque regularizado"}
          icon={AlertTriangle}
          variant={metrics.lowStockCount > 0 ? "amber" : "zinc"}
        />
      </div>

      {/* Seção Central Dividida: Vendas Recentes & Alertas de Reposição */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Coluna Esquerda: Vendas Recentes (2 colunas no desktop) */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-gold-400" />
                <span>Últimas Vendas Realizadas</span>
              </h2>
              <p className="text-xs text-zinc-400">Histórico imediato com emissão de comprovantes</p>
            </div>

            <Link
              href="/vendas"
              className="flex items-center gap-1 text-xs font-semibold text-gold-400 hover:text-gold-300 transition-colors"
            >
              <span>Ver todas</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {metrics.recentSales.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500">
              <p className="text-xs">Nenhuma venda registrada ainda.</p>
              <Link href="/pdv" className="mt-2 inline-block text-xs font-bold text-gold-400 hover:underline">
                Abrir PDV para registrar a primeira venda
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="border-b border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="pb-2.5">Código / Data</th>
                    <th className="pb-2.5">Cliente</th>
                    <th className="pb-2.5">Pagamento</th>
                    <th className="pb-2.5 text-right">Total</th>
                    <th className="pb-2.5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {metrics.recentSales.map((sale: Sale) => (
                    <tr key={sale.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 font-mono">
                        <span className="font-bold text-zinc-100">{sale.code}</span>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(sale.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="font-semibold text-zinc-200">{sale.customer_name}</span>
                        <div className="text-[10px] text-zinc-400">
                          {sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="inline-block rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                          {sale.payment_method} {sale.installments > 1 ? `(${sale.installments}x)` : ''}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-gold-400">
                        R$ {sale.total.toFixed(2)}
                      </td>
                      <td className="py-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedSale(sale)}
                          className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 text-[11px] font-medium text-zinc-200 hover:border-gold-500/60 hover:text-gold-300 transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Comprovante</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Coluna Direita: Alerta de Reposição de Estoque */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>Reposição Crítica</span>
              </h2>
              <Link
                href="/estoque"
                className="text-xs font-semibold text-amber-400 hover:underline"
              >
                Gerenciar
              </Link>
            </div>

            {metrics.lowStockProducts.length === 0 ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400 mb-1" />
                <p className="text-xs font-bold text-emerald-300">Estoque 100% em dia!</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Nenhum perfume está abaixo do estoque de segurança.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.lowStockProducts.map((prod: any) => (
                  <div 
                    key={prod.id} 
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 hover:border-zinc-700 transition-colors"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">{prod.name}</h4>
                      <p className="text-[10px] text-zinc-400">{prod.brand} • {prod.volume_ml}ml</p>
                    </div>
                    <div className="text-right">
                      <span className="rounded bg-rose-950/80 border border-rose-600/40 px-2 py-0.5 text-xs font-bold text-rose-300">
                        {prod.stock_quantity} un
                      </span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Mínimo: {prod.min_stock}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-gold-500/20 bg-gold-500/5 p-3.5">
            <h4 className="text-xs font-bold text-gold-400 mb-1">Ticket Médio</h4>
            <div className="text-xl font-black text-zinc-100">
              R$ {metrics.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5">Média por pedido na Absolut Parfum</p>
          </div>
        </div>

      </div>

      {/* Modal de Impressão de Comprovante Térmico / A4 */}
      {selectedSale && settings && (
        <ReceiptModal
          sale={selectedSale}
          settings={settings}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
}
