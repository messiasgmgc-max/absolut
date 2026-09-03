'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  CreditCard, 
  Send, 
  Copy, 
  Check, 
  ArrowRight, 
  Info,
  DollarSign,
  TrendingDown
} from 'lucide-react';
import { CardMachineRate } from '@/lib/types';
import { getCardMachines } from '@/lib/store';

interface CardRateCalculatorProps {
  initialAmount?: number;
  onApplyToSale?: (data: { installments: number; totalToCharge: number; rate: number; machine: string }) => void;
}

export default function CardRateCalculator({ initialAmount = 1000, onApplyToSale }: CardRateCalculatorProps) {
  const [machines, setMachines] = useState<CardMachineRate[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [amount, setAmount] = useState<number>(initialAmount);
  const [mode, setMode] = useState<'pass_to_customer' | 'absorb'>('pass_to_customer');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getCardMachines().then(list => {
      setMachines(list);
      if (list.length > 0) {
        const defaultMach = list.find(m => m.is_default) || list[0];
        setSelectedMachineId(defaultMach.id);
      }
    });
  }, []);

  const currentMachine = machines.find(m => m.id === selectedMachineId) || machines[0];

  const getRatesArray = () => {
    if (!currentMachine) return [];
    return [
      { name: 'Débito à Vista', installments: 1, rate: currentMachine.debit_rate, isDebit: true },
      { name: 'Crédito 1x (à vista)', installments: 1, rate: currentMachine.credit_1x, isDebit: false },
      { name: 'Crédito 2x', installments: 2, rate: currentMachine.credit_2x, isDebit: false },
      { name: 'Crédito 3x', installments: 3, rate: currentMachine.credit_3x, isDebit: false },
      { name: 'Crédito 4x', installments: 4, rate: currentMachine.credit_4x, isDebit: false },
      { name: 'Crédito 5x', installments: 5, rate: currentMachine.credit_5x, isDebit: false },
      { name: 'Crédito 6x', installments: 6, rate: currentMachine.credit_6x, isDebit: false },
      { name: 'Crédito 7x', installments: 7, rate: currentMachine.credit_7x, isDebit: false },
      { name: 'Crédito 8x', installments: 8, rate: currentMachine.credit_8x, isDebit: false },
      { name: 'Crédito 9x', installments: 9, rate: currentMachine.credit_9x, isDebit: false },
      { name: 'Crédito 10x', installments: 10, rate: currentMachine.credit_10x, isDebit: false },
      { name: 'Crédito 11x', installments: 11, rate: currentMachine.credit_11x, isDebit: false },
      { name: 'Crédito 12x', installments: 12, rate: currentMachine.credit_12x, isDebit: false },
    ];
  };

  const calculateRow = (row: { name: string; installments: number; rate: number; isDebit: boolean }) => {
    const base = amount > 0 ? amount : 0;
    let totalCobrado = 0;
    let taxaRetida = 0;
    let valorLiquido = 0;
    let valorParcela = 0;

    if (mode === 'pass_to_customer') {
      // Repasse da taxa: Cobrar a mais para receber exatamente o valor líquido base
      // Fórmula de antecipação: Total = Base / (1 - (rate / 100))
      totalCobrado = base / (1 - (row.rate / 100));
      taxaRetida = totalCobrado - base;
      valorLiquido = base;
      valorParcela = totalCobrado / row.installments;
    } else {
      // Absorver taxa: O total cobrado do cliente é o valor base, a taxa desconta do lojista
      totalCobrado = base;
      taxaRetida = base * (row.rate / 100);
      valorLiquido = base - taxaRetida;
      valorParcela = totalCobrado / row.installments;
    }

    return {
      ...row,
      totalCobrado,
      taxaRetida,
      valorLiquido,
      valorParcela,
    };
  };

  const rows = getRatesArray().map(calculateRow);

  const handleCopySummary = () => {
    const lines = rows
      .filter(r => !r.isDebit)
      .map(r => `${r.installments}x de R$ ${r.valorParcela.toFixed(2)} (Total: R$ ${r.totalCobrado.toFixed(2)})`);

    const text = `💳 *Simulação de Parcelamento - Absolut Parfum*
Valor Base: R$ ${amount.toFixed(2)}
Operadora: ${currentMachine?.name}
Modalidade: ${mode === 'pass_to_customer' ? 'Taxa repassada ao cliente' : 'Taxa sem acréscimo (Lojista)'}

${lines.join('\n')}

✨ Perfumaria de Luxo & Decants 100% Originais`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const lines = rows
      .filter(r => !r.isDebit)
      .map(r => `• *${r.installments}x* de *R$ ${r.valorParcela.toFixed(2)}*`);

    const text = `💎 *ABSOLUT PARFUM - Opções de Parcelamento no Cartão*
Valor: *R$ ${amount.toFixed(2)}*

${lines.join('\n')}

_Valores válidos para pagamento no cartão de crédito._`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Controles do Simulador */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Campo de Valor */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Valor da Venda (R$)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gold-400">R$</span>
            <input
              type="number"
              min="1"
              step="0.50"
              value={amount || ''}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2.5 pl-10 pr-4 text-lg font-bold text-zinc-100 placeholder-zinc-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
              placeholder="0,00"
            />
          </div>
        </div>

        {/* Escolha da Maquininha */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Operadora / Maquininha
          </label>
          <select
            value={selectedMachineId}
            onChange={(e) => setSelectedMachineId(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2.5 px-3 text-sm font-semibold text-zinc-100 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          >
            {machines.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} {m.is_default ? '(Padrão)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Modo de Repasse da Taxa */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Quem Paga a Taxa?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('pass_to_customer')}
              className={`rounded-lg py-2 px-2 text-xs font-bold transition-all text-center ${
                mode === 'pass_to_customer'
                  ? 'bg-gold-500 text-zinc-950 shadow-md shadow-gold-500/20'
                  : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
              }`}
            >
              Cliente Paga
              <span className="block text-[10px] font-normal opacity-80">(Repassa Taxa)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('absorb')}
              className={`rounded-lg py-2 px-2 text-xs font-bold transition-all text-center ${
                mode === 'absorb'
                  ? 'bg-gold-500 text-zinc-950 shadow-md shadow-gold-500/20'
                  : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
              }`}
            >
              Lojista Paga
              <span className="block text-[10px] font-normal opacity-80">(Sem Acréscimo)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Destaque Informativo do Modo Selecionado */}
      <div className={`rounded-xl p-3.5 text-xs flex items-center justify-between border ${
        mode === 'pass_to_customer'
          ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
          : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
      }`}>
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0" />
          <span>
            {mode === 'pass_to_customer' ? (
              <b>Modo Repasse:</b>
            ) : (
              <b>Modo Absorção:</b>
            )}
            {' '}
            {mode === 'pass_to_customer'
              ? 'O valor cobrado na máquina é ajustado para que você receba líquido exatamente R$ ' + amount.toFixed(2)
              : 'O cliente paga o valor original de R$ ' + amount.toFixed(2) + ' e o custo da máquina é abatido do seu lucro líquido.'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopySummary}
            className="flex items-center gap-1 rounded bg-zinc-900 border border-zinc-700 px-2.5 py-1 text-xs text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1 rounded bg-emerald-700/80 hover:bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Tabela Detalhada 1x a 12x */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-lg">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="py-3 px-4">Parcelamento</th>
              <th className="py-3 px-4 text-center">Taxa (%)</th>
              <th className="py-3 px-4 text-right">Parcela do Cliente</th>
              <th className="py-3 px-4 text-right">Total a Cobrar</th>
              <th className="py-3 px-4 text-right">Taxa da Máquina</th>
              <th className="py-3 px-4 text-right text-emerald-400">Você Recebe Líquido</th>
              {onApplyToSale && <th className="py-3 px-4 text-center">Ação</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850">
            {rows.map((r, idx) => (
              <tr 
                key={idx} 
                className={`hover:bg-zinc-800/40 transition-colors ${
                  r.isDebit ? 'bg-zinc-900/30' : ''
                }`}
              >
                <td className="py-3 px-4 font-semibold text-zinc-100 flex items-center gap-2">
                  <CreditCard className={`h-3.5 w-3.5 ${r.isDebit ? 'text-cyan-400' : 'text-gold-400'}`} />
                  <span>{r.name}</span>
                </td>
                <td className="py-3 px-4 text-center font-mono font-medium text-amber-400">
                  {r.rate.toFixed(2)}%
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-zinc-100">
                  R$ {r.valorParcela.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-zinc-300 font-semibold">
                  R$ {r.totalCobrado.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-rose-400">
                  - R$ {r.taxaRetida.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-black text-emerald-400">
                  R$ {r.valorLiquido.toFixed(2)}
                </td>
                {onApplyToSale && (
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onApplyToSale({
                        installments: r.installments,
                        totalToCharge: r.totalCobrado,
                        rate: r.rate,
                        machine: currentMachine.name,
                      })}
                      className="rounded bg-gold-500/20 hover:bg-gold-500 hover:text-zinc-950 text-gold-400 px-2.5 py-1 font-bold text-[11px] transition-all"
                    >
                      Aplicar no PDV
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
