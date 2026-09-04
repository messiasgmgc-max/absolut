'use client';

import React, { useState } from 'react';
import { X, Check, Edit, Save, AlertCircle } from 'lucide-react';
import { Sale } from '@/lib/types';

interface EditSaleModalProps {
  sale: Sale;
  onClose: () => void;
  onSave: (updatedSale: Sale) => void;
}

export default function EditSaleModal({ sale, onClose, onSave }: EditSaleModalProps) {
  const [customerName, setCustomerName] = useState(sale.customer_name);
  const [customerPhone, setCustomerPhone] = useState(sale.customer_phone || '');
  const [paymentMethod, setPaymentMethod] = useState(sale.payment_method);
  const [status, setStatus] = useState<Sale['status']>(sale.status);
  const [notes, setNotes] = useState(sale.notes || '');
  const [sellerName, setSellerName] = useState(sale.seller_name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const updated: Sale = {
      ...sale,
      customer_name: customerName.trim() || 'Cliente Balcão',
      customer_phone: customerPhone.trim(),
      payment_method: paymentMethod,
      status: status,
      notes: notes.trim(),
      seller_name: sellerName.trim() || 'Vendedor',
    };

    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400">
              <Edit className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Editar Pedido {sale.code}</h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                Total: R$ {sale.total.toFixed(2)} • {sale.items.length} item(s)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Nome do Cliente
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-100 focus:border-gold-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-100 focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-xs text-zinc-100 focus:border-gold-500 focus:outline-none"
              >
                <option value="PIX">PIX</option>
                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                <option value="CARTAO_DEBITO">Cartão de Débito</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Status da Venda
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-xs text-zinc-100 focus:border-gold-500 focus:outline-none"
              >
                <option value="CONCLUIDA">Concluída</option>
                <option value="PENDENTE">Pendente</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Vendedor Responsável
            </label>
            <input
              type="text"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-100 focus:border-gold-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Observações do Pedido
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações internas, entrega, embalagem de presente..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-xs text-zinc-100 focus:border-gold-500 focus:outline-none"
            />
          </div>

          {/* Perfumes no pedido (Apenas visualização) */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 space-y-1">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Itens do Pedido:</span>
            <div className="max-h-24 overflow-y-auto space-y-1 text-xs text-zinc-300 divide-y divide-zinc-850">
              {sale.items.map((it, idx) => (
                <div key={idx} className="pt-1 flex justify-between">
                  <span>{it.quantity}x {it.product_name}</span>
                  <span className="font-mono text-gold-400">R$ {(it.quantity * it.unit_price).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-gold-500 px-5 py-2.5 text-xs font-bold text-zinc-950 shadow-md shadow-gold-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <Save className="h-4 w-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
