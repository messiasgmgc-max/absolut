'use client';

import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  FileText, 
  Share2, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck,
  Send
} from 'lucide-react';
import { Sale, StoreSettings } from '@/lib/types';

interface ReceiptModalProps {
  sale: Sale | null;
  settings: StoreSettings;
  onClose: () => void;
}

export default function ReceiptModal({ sale, settings, onClose }: ReceiptModalProps) {
  const [viewMode, setViewMode] = useState<'thermal' | 'a4'>('thermal');

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    const phone = (sale.customer_phone || '').replace(/\D/g, '');
    const itemsList = sale.items
      .map(i => `• *${i.product_name}* (${i.quantity}x) - R$ ${i.total_price.toFixed(2)}`)
      .join('\n');

    const message = `✨ *ABSOLUT PARFUM - COMPROVANTE DE VENDA* ✨
Pedido: *${sale.code}*
Data: ${new Date(sale.created_at).toLocaleString('pt-BR')}
Cliente: ${sale.customer_name}

*Itens Selecionados:*
${itemsList}

Subtotal: R$ ${sale.subtotal.toFixed(2)}
${sale.discount > 0 ? `Desconto: -R$ ${sale.discount.toFixed(2)}\n` : ''}*Total Final: R$ ${sale.total.toFixed(2)}*
Pagamento: *${sale.payment_method}* ${sale.installments > 1 ? `(${sale.installments}x)` : ''}

🛡️ *Garantia Absolut:* 100% Originalidade Comprovada.
Obrigado por sua compra!`;

    const encoded = encodeURIComponent(message);
    const url = phone ? `https://wa.me/55${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[95vh] w-full max-w-2xl flex-col rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
        
        {/* Cabeçalho da Modal (Não impresso) */}
        <div className="no-print flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/20 text-gold-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">
                Comprovante de Venda • {sale.code}
              </h3>
              <p className="text-xs text-zinc-400">
                Absolut Parfum - Perfumes de Luxo & Decants
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Seletor de Modelo: Térmico ou A4 */}
            <div className="flex rounded-lg bg-zinc-800/80 p-1 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('thermal')}
                className={`rounded px-3 py-1 font-medium transition-colors ${
                  viewMode === 'thermal' ? 'bg-gold-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Cupom 80mm
              </button>
              <button
                type="button"
                onClick={() => setViewMode('a4')}
                className={`rounded px-3 py-1 font-medium transition-colors ${
                  viewMode === 'a4' ? 'bg-gold-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Recibo A4
              </button>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Área Visual do Comprovante (Scrollável na tela, limpo na impressão) */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-950/50 flex justify-center">
          
          {/* ========================================== */}
          {/* MODO 1: CUPOM TÉRMICO (BOBINA 80mm / 58mm) */}
          {/* ========================================== */}
          {viewMode === 'thermal' && (
            <div className="printable-receipt w-full max-w-[340px] rounded-lg bg-white p-5 font-mono text-[11px] text-zinc-900 shadow-xl border border-zinc-300">
              <div className="text-center border-b border-dashed border-zinc-400 pb-3 mb-3">
                <p className="text-sm font-black tracking-widest uppercase">ABSOLUT PARFUM</p>
                <p className="text-[10px] text-zinc-600">{settings.brand_tagline}</p>
                <p className="text-[10px] mt-1">CNPJ: {settings.cnpj}</p>
                <p className="text-[10px]">Tel/WhatsApp: {settings.phone}</p>
                <p className="text-[10px]">{settings.address}</p>
              </div>

              <div className="border-b border-dashed border-zinc-400 pb-2 mb-2 text-[10px]">
                <div className="flex justify-between">
                  <span>PEDIDO: <b>{sale.code}</b></span>
                  <span>{new Date(sale.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex justify-between mt-0.5">
                  <span>CLIENTE: {sale.customer_name}</span>
                  <span>{new Date(sale.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {sale.customer_phone && <p>FONE: {sale.customer_phone}</p>}
                <p>VENDEDOR: {sale.seller_name}</p>
              </div>

              {/* Tabela de Produtos */}
              <div className="border-b border-dashed border-zinc-400 pb-3 mb-3">
                <div className="flex justify-between font-bold text-[10px] mb-1">
                  <span>ITEM / DESCRIÇÃO</span>
                  <span>TOTAL</span>
                </div>
                <div className="space-y-2">
                  {sale.items.map((item, idx) => (
                    <div key={idx} className="text-[10px] leading-tight">
                      <div className="font-semibold">{item.product_name}</div>
                      <div className="flex justify-between text-zinc-600 pl-1">
                        <span>{item.quantity} un x R$ {item.unit_price.toFixed(2)}</span>
                        <span className="font-bold text-zinc-900">R$ {item.total_price.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totais */}
              <div className="space-y-1 text-xs border-b border-dashed border-zinc-400 pb-3 mb-3">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal:</span>
                  <span>R$ {sale.subtotal.toFixed(2)}</span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Desconto Concedido:</span>
                    <span>- R$ {sale.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-1 border-t border-zinc-300">
                  <span>VALOR TOTAL:</span>
                  <span>R$ {sale.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Pagamento */}
              <div className="border-b border-dashed border-zinc-400 pb-3 mb-3 text-[10px]">
                <div className="flex justify-between">
                  <span>FORMA PAGTO:</span>
                  <span className="font-bold">{sale.payment_method}</span>
                </div>
                {sale.installments > 1 && (
                  <div className="flex justify-between text-zinc-600 mt-0.5">
                    <span>PARCELAMENTO:</span>
                    <span>{sale.installments}x de R$ {(sale.total / sale.installments).toFixed(2)}</span>
                  </div>
                )}
                {sale.card_machine && (
                  <div className="flex justify-between text-zinc-600">
                    <span>OPERADORA:</span>
                    <span>{sale.card_machine}</span>
                  </div>
                )}
              </div>

              {/* Mensagem Fiscal e Garantia */}
              <div className="text-center text-[9px] text-zinc-600 leading-tight space-y-1">
                <p className="font-bold text-zinc-800">*** CUPOM NÃO-FISCAL PARA SIMPLES CONFERÊNCIA ***</p>
                <p>{settings.receipt_footer_text}</p>
                <div className="pt-2 flex items-center justify-center gap-1 font-bold text-zinc-800">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Selo de Procedência e Autenticidade Garantida</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* MODO 2: RECIBO FORMATO A4 EXECUTIVO */}
          {/* ========================================== */}
          {viewMode === 'a4' && (
            <div className="printable-receipt w-full max-w-[550px] rounded-lg bg-white p-8 font-sans text-xs text-zinc-800 shadow-xl border border-zinc-300">
              <div className="flex items-center justify-between border-b-2 border-amber-600 pb-4 mb-4">
                <div>
                  <h1 className="text-xl font-bold tracking-wider text-amber-700">ABSOLUT PARFUM</h1>
                  <p className="text-xs text-zinc-500">{settings.brand_tagline}</p>
                  <p className="text-[10px] text-zinc-500 mt-1">CNPJ: {settings.cnpj} • Tel: {settings.phone}</p>
                  <p className="text-[10px] text-zinc-500">{settings.address}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">
                    RECIBO DE VENDA
                  </span>
                  <p className="text-xs font-mono font-bold mt-1 text-zinc-900">{sale.code}</p>
                  <p className="text-[10px] text-zinc-500">{new Date(sale.created_at).toLocaleString('pt-BR')}</p>
                </div>
              </div>

              {/* Dados do Cliente */}
              <div className="mb-4 rounded bg-zinc-50 p-3 border border-zinc-200">
                <h4 className="font-bold text-zinc-700 uppercase tracking-wider text-[10px] mb-1">DADOS DO CLIENTE</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-500">Nome:</span> <b>{sale.customer_name}</b>
                  </div>
                  <div>
                    <span className="text-zinc-500">Telefone:</span> {sale.customer_phone || 'Não informado'}
                  </div>
                  <div>
                    <span className="text-zinc-500">Atendente:</span> {sale.seller_name}
                  </div>
                  <div>
                    <span className="text-zinc-500">Situação:</span> <span className="text-emerald-700 font-bold">{sale.status}</span>
                  </div>
                </div>
              </div>

              {/* Tabela de Itens */}
              <table className="w-full text-left border-collapse mb-4">
                <thead>
                  <tr className="border-b border-zinc-300 bg-zinc-100 text-[10px] font-bold text-zinc-600 uppercase">
                    <th className="py-2 px-2">Item / Fragrância</th>
                    <th className="py-2 px-2">Marca</th>
                    <th className="py-2 px-2 text-center">Qtd</th>
                    <th className="py-2 px-2 text-right">Unitário</th>
                    <th className="py-2 px-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-zinc-200 text-xs">
                      <td className="py-2 px-2 font-medium">{item.product_name}</td>
                      <td className="py-2 px-2 text-zinc-600">{item.brand || '-'}</td>
                      <td className="py-2 px-2 text-center">{item.quantity}</td>
                      <td className="py-2 px-2 text-right">R$ {item.unit_price.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right font-bold">R$ {item.total_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Resumo Financeiro */}
              <div className="flex justify-end mb-6">
                <div className="w-56 space-y-1.5 text-xs">
                  <div className="flex justify-between text-zinc-600">
                    <span>Subtotal:</span>
                    <span>R$ {sale.subtotal.toFixed(2)}</span>
                  </div>
                  {sale.discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Desconto:</span>
                      <span>- R$ {sale.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t-2 border-zinc-800 pt-1 text-sm font-bold text-zinc-900">
                    <span>Total Líquido:</span>
                    <span>R$ {sale.total.toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 pt-1">
                    Forma de Pagamento: <b>{sale.payment_method}</b> {sale.installments > 1 ? `em ${sale.installments}x` : ''}
                  </div>
                </div>
              </div>

              {/* Termo de Garantia e Assinatura */}
              <div className="border-t border-zinc-300 pt-4 text-[10px] text-zinc-500">
                <p className="mb-6 leading-relaxed">
                  {settings.receipt_footer_text} Todas as nossas fragrâncias possuem procedência garantida e lote de fabricação verificado junto aos distribuidores oficiais.
                </p>
                <div className="flex justify-between gap-8 pt-8">
                  <div className="flex-1 border-t border-zinc-400 text-center pt-1">
                    <span>Absolut Parfum</span>
                  </div>
                  <div className="flex-1 border-t border-zinc-400 text-center pt-1">
                    <span>{sale.customer_name}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Barra de Ações do Rodapé (Não impressa) */}
        <div className="no-print flex items-center justify-between border-t border-zinc-800 bg-zinc-950 px-6 py-4">
          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-4 py-2.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-900/50 transition-colors"
          >
            <Send className="h-4 w-4" />
            <span>Enviar no WhatsApp</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-700 px-4 py-2.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg bg-gold-500 px-5 py-2.5 text-xs font-bold text-zinc-950 shadow-md shadow-gold-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir Comprovante</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
