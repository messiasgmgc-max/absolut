'use client';

import React, { useState, useEffect } from 'react';
import { 
  Percent, 
  CreditCard, 
  Settings, 
  Edit3, 
  Save, 
  Sparkles, 
  Check, 
  Plus,
  HelpCircle,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { CardMachineRate } from '@/lib/types';
import { getCardMachines, saveCardMachine } from '@/lib/store';
import CardRateCalculator from '@/components/CardRateCalculator';

export default function CardRatesPage() {
  const [machines, setMachines] = useState<CardMachineRate[]>([]);
  const [editingMachine, setEditingMachine] = useState<CardMachineRate | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadData = async () => {
    const list = await getCardMachines();
    setMachines(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (m: CardMachineRate) => {
    setEditingMachine({ ...m });
  };

  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMachine) return;

    await saveCardMachine(editingMachine);
    setEditingMachine(null);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    await loadData();
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <div className="flex items-center gap-2 text-gold-400">
          <Percent className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Simulador & Configurações de Maquininhas</span>
        </div>
        <h1 className="text-2xl font-black text-zinc-100">
          Simulador de Taxas de Cartão
        </h1>
        <p className="text-xs text-zinc-400 max-w-2xl">
          Simule exatamente quanto cobrar no cartão de crédito em até 12x para repassar as taxas ou saber sua margem líquida real.
        </p>
      </div>

      {/* Simulador Interativo */}
      <div className="rounded-2xl border border-gold-500/30 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur-sm">
        <h3 className="text-base font-bold text-zinc-100 mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-gold-400" />
          <span>Calculadora de Parcelamento Inteligente</span>
        </h3>

        <CardRateCalculator />
      </div>

      {/* Tabela de Configuração das Taxas das Maquininhas */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Settings className="h-4 w-4 text-gold-400" />
              <span>Taxas Cadastradas por Operadora</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Personalize as porcentagens de débito e crédito (1x até 12x) de acordo com o seu contrato com a maquininha.
            </p>
          </div>

          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-lg">
              <Check className="h-3.5 w-3.5" />
              <span>Taxas salvas com sucesso!</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {machines.map((m) => (
            <div 
              key={m.id}
              className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 flex flex-col justify-between hover:border-zinc-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-100 text-sm">{m.name}</span>
                  {m.is_default && (
                    <span className="rounded bg-gold-500/20 text-gold-400 text-[10px] font-bold px-2 py-0.5">
                      Padrão
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Débito:</span>
                    <span className="font-mono text-cyan-400 font-bold">{m.debit_rate}%</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Crédito 1x:</span>
                    <span className="font-mono text-gold-400 font-bold">{m.credit_1x}%</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Crédito 6x:</span>
                    <span className="font-mono text-amber-400 font-bold">{m.credit_6x}%</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Crédito 12x:</span>
                    <span className="font-mono text-rose-400 font-bold">{m.credit_12x}%</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleEdit(m)}
                className="mt-4 flex items-center justify-center gap-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-900 py-1.5 text-xs font-semibold text-zinc-300 hover:border-gold-500/50 hover:text-gold-300 transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Editar Taxas</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Edição de Taxas */}
      {editingMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-zinc-100 mb-1">
              Editar Taxas: {editingMachine.name}
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Digite as porcentagens acordadas com a adquirente para cada faixa de parcelamento.
            </p>

            <form onSubmit={handleSaveRates} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Débito (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingMachine.debit_rate}
                    onChange={(e) => setEditingMachine({ ...editingMachine, debit_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-zinc-100 font-mono focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Crédito 1x (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingMachine.credit_1x}
                    onChange={(e) => setEditingMachine({ ...editingMachine, credit_1x: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-zinc-100 font-mono focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Crédito 2x (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingMachine.credit_2x}
                    onChange={(e) => setEditingMachine({ ...editingMachine, credit_2x: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-zinc-100 font-mono focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Crédito 3x (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingMachine.credit_3x}
                    onChange={(e) => setEditingMachine({ ...editingMachine, credit_3x: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-zinc-100 font-mono focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Crédito 4x (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingMachine.credit_4x}
                    onChange={(e) => setEditingMachine({ ...editingMachine, credit_4x: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-zinc-100 font-mono focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Crédito 5x (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingMachine.credit_5x}
                    onChange={(e) => setEditingMachine({ ...editingMachine, credit_5x: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-zinc-100 font-mono focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Crédito 6x (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingMachine.credit_6x}
                    onChange={(e) => setEditingMachine({ ...editingMachine, credit_6x: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-zinc-100 font-mono focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Crédito 8x (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingMachine.credit_8x}
                    onChange={(e) => setEditingMachine({ ...editingMachine, credit_8x: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-zinc-100 font-mono focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Crédito 10x (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingMachine.credit_10x}
                    onChange={(e) => setEditingMachine({ ...editingMachine, credit_10x: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-zinc-100 font-mono focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Crédito 12x (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingMachine.credit_12x}
                    onChange={(e) => setEditingMachine({ ...editingMachine, credit_12x: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-zinc-100 font-mono focus:border-gold-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingMachine(null)}
                  className="rounded-lg border border-zinc-700 px-4 py-2 font-medium text-zinc-300 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gold-500 px-5 py-2 font-bold text-zinc-950 hover:brightness-110"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
