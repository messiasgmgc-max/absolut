'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ReceiptText, 
  Search, 
  Download, 
  Eye, 
  ShoppingCart, 
  DollarSign, 
  Calendar, 
  Clock, 
  CreditCard, 
  Sparkles,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { Sale, StoreSettings } from '@/lib/types';
import { getSales, getStoreSettings } from '@/lib/store';
import { exportSalesToExcel } from '@/lib/export-excel';
import ReceiptModal from '@/components/ReceiptModal';

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState('TODOS');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [sList, sSet] = await Promise.all([
        getSales(),
        getStoreSettings(),
      ]);
      setSales(sList);
      setSettings(sSet);
      setLoading(false);
    }
    load();
  }, []);

  const filteredSales = sales.filter(s => {
    const term = search.toLowerCase();
    const matchesSearch = 
      s.code.toLowerCase().includes(term) ||
      s.customer_name.toLowerCase().includes(term) ||
      (s.customer_phone && s.customer_phone.includes(term)) ||
      s.items.some(i => i.product_name.toLowerCase().includes(term));

    const matchesPayment = filterPayment === 'TODOS' || s.payment_method === filterPayment;

    return matchesSearch && matchesPayment;
  });

  const totalGross = sales.reduce((acc, s) => acc + s.total, 0);
  const totalNet = sales.reduce((acc, s) => acc + s.net_received, 0);
  const averageTicket = sales.length > 0 ? totalGross / sales.length : 0;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-gold-400">
            <ReceiptText className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Gestão de Pedidos</span>
          </div>
          <h1 className="text-2xl font-black text-zinc-100">
            Histórico de Vendas & Comprovantes
          </h1>
          <p className="text-xs text-zinc-400">
            {sales.length} vendas registradas no sistema Absolut Parfum
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => exportSalesToExcel(sales)}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs font-semibold text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 transition-all"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            <span>Exportar Relatório Excel</span>
          </button>

          <Link
            href="/pdv"
            className="flex items-center gap-2 rounded-xl bg-gold-500 px-4 py-2.5 text-xs font-bold text-zinc-950 shadow-md shadow-gold-500/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Nova Venda</span>
          </Link>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
          <span className="text-xs font-semibold text-zinc-400 uppercase">Faturamento Bruto</span>
          <div className="mt-1 text-2xl font-black text-gold-400 font-mono">
            R$ {totalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">{sales.length} pedidos efetuados</p>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-zinc-900/80 p-4">
          <span className="text-xs font-semibold text-emerald-400 uppercase">Recebimento Líquido</span>
          <div className="mt-1 text-2xl font-black text-emerald-400 font-mono">
            R$ {totalNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Após retenção de taxas de cartões</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
          <span className="text-xs font-semibold text-zinc-400 uppercase">Ticket Médio</span>
          <div className="mt-1 text-2xl font-black text-zinc-100 font-mono">
            R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Gasto médio por cliente</p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 md:grid-cols-4">
        <div className="relative md:col-span-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código do pedido (ABS-...), cliente, telefone ou perfume vendido..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2 pl-10 pr-4 text-xs text-zinc-100 placeholder-zinc-500 focus:border-gold-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2 px-3 text-xs text-zinc-300 focus:border-gold-500 focus:outline-none"
          >
            <option value="TODOS">Todos os Pagamentos</option>
            <option value="PIX">PIX</option>
            <option value="CARTAO_CREDITO">Cartão de Crédito</option>
            <option value="CARTAO_DEBITO">Cartão de Débito</option>
            <option value="DINHEIRO">Dinheiro</option>
          </select>
        </div>
      </div>

      {/* Tabela de Vendas */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="py-3 px-4">Pedido / Data</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Fragrâncias Vendidas</th>
                <th className="py-3 px-4">Pagamento</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Líquido</th>
                <th className="py-3 px-4 text-center">Comprovante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    Carregando vendas...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    Nenhuma venda encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-zinc-100">{sale.code}</span>
                      <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(sale.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-zinc-200">{sale.customer_name}</span>
                      {sale.customer_phone && (
                        <div className="text-[10px] text-zinc-400">{sale.customer_phone}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="space-y-0.5">
                        {sale.items.map((it, idx) => (
                          <div key={idx} className="text-[11px] text-zinc-300 truncate">
                            <span className="font-bold text-gold-400">{it.quantity}x</span> {it.product_name}
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                        {sale.payment_method} {sale.installments > 1 ? `(${sale.installments}x)` : ''}
                      </span>
                      {sale.card_machine && (
                        <div className="text-[10px] text-zinc-500 mt-0.5">{sale.card_machine}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-gold-400">
                      R$ {sale.total.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-medium text-emerald-400">
                      R$ {sale.net_received.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedSale(sale)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-gold-500/50 hover:text-gold-300 transition-all"
                      >
                        <Eye className="h-3.5 w-3.5 text-gold-400" />
                        <span>Comprovante</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Comprovante */}
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
