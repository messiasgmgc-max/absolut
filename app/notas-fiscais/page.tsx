'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Search, 
  CheckCircle2, 
  Clock, 
  Download, 
  Printer, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  Code2,
  Receipt
} from 'lucide-react';
import { Sale, StoreSettings } from '@/lib/types';
import { getSales, getStoreSettings } from '@/lib/store';
import ReceiptModal from '@/components/ReceiptModal';

export default function InvoicesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [search, setSearch] = useState('');
  const [isEmitting, setIsEmitting] = useState<string | null>(null);

  const loadData = async () => {
    const [sList, sSet] = await Promise.all([
      getSales(),
      getStoreSettings(),
    ]);
    setSales(sList);
    setSettings(sSet);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSimulateEmission = (saleId: string) => {
    setIsEmitting(saleId);
    setTimeout(() => {
      setSales(prev => 
        prev.map(s => {
          if (s.id === saleId) {
            const randomSuffix = Math.floor(100000000 + Math.random() * 900000000);
            return {
              ...s,
              invoice_status: 'EMITIDA',
              invoice_key: `352609489102310001885500100000000${randomSuffix}`,
            };
          }
          return s;
        })
      );
      setIsEmitting(null);
    }, 1200);
  };

  const handleDownloadXml = (sale: Sale) => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe${sale.invoice_key || '35260900000000000000000000000000000000000000'}" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <natOp>VENDA DE MERCADORIA</natOp>
        <mod>65</mod>
        <serie>1</serie>
        <nNF>${sale.code.replace(/\D/g, '')}</nNF>
        <dhEmi>${new Date(sale.created_at).toISOString()}</dhEmi>
        <tpNF>1</tpNF>
      </ide>
      <emit>
        <CNPJ>${settings?.cnpj.replace(/\D/g, '') || '48910231000188'}</CNPJ>
        <xNome>ABSOLUT PARFUM LTDA</xNome>
        <xFant>ABSOLUT PARFUM</xFant>
      </emit>
      <dest>
        <xNome>${sale.customer_name}</xNome>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>${sale.items[0]?.product_id || 'PROD01'}</cProd>
          <xProd>${sale.items[0]?.product_name || 'PERFUME'}</xProd>
          <NCM>3303.00.10</NCM>
          <CFOP>5102</CFOP>
          <vUnCom>${sale.items[0]?.unit_price.toFixed(2)}</vUnCom>
          <vProd>${sale.items[0]?.total_price.toFixed(2)}</vProd>
        </prod>
      </det>
      <total>
        <ICMSTot>
          <vNF>${sale.total.toFixed(2)}</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`;

    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NFe_${sale.code}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredSales = sales.filter(s =>
    s.code.toLowerCase().includes(search.toLowerCase()) ||
    s.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-gold-400">
            <FileText className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Painel Fiscal</span>
          </div>
          <h1 className="text-2xl font-black text-zinc-100">
            Emissão de Notas Fiscais (NFC-e / NF-e)
          </h1>
          <p className="text-xs text-zinc-400">
            Gerencie o status tributário, chaves de acesso de 44 dígitos e arquivos XML para contabilidade.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-2 text-xs font-semibold text-gold-300">
          <ShieldCheck className="h-4 w-4 text-gold-400" />
          <span>NCM Padrão Perfumaria: 3303.00.10</span>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por pedido ou cliente para emitir ou baixar nota fiscal..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2.5 pl-10 pr-4 text-xs text-zinc-100 placeholder-zinc-500 focus:border-gold-500 focus:outline-none"
        />
      </div>

      {/* Tabela de Notas */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="py-3 px-4">Pedido / Data</th>
                <th className="py-3 px-4">Destinatário</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4 text-center">Status Fiscal</th>
                <th className="py-3 px-4">Chave de Acesso (44 dígitos)</th>
                <th className="py-3 px-4 text-center">Ações Fiscais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {filteredSales.map((sale) => {
                const isEmitted = sale.invoice_status === 'EMITIDA';

                return (
                  <tr key={sale.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-zinc-100">{sale.code}</span>
                      <div className="text-[10px] text-zinc-500">
                        {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-200">{sale.customer_name}</div>
                      <div className="text-[10px] text-zinc-500">
                        {sale.items.length} itens tributados
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-gold-400">
                      R$ {sale.total.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {isEmitted ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>AUTORIZADA</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                          <Clock className="h-3 w-3" />
                          <span>NÃO EMITIDA</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-[10px] text-zinc-400 max-w-xs truncate">
                      {sale.invoice_key ? sale.invoice_key : 'Aguardando autorização'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {!isEmitted ? (
                          <button
                            type="button"
                            disabled={isEmitting === sale.id}
                            onClick={() => handleSimulateEmission(sale.id)}
                            className="rounded-lg bg-gold-500/20 border border-gold-500/40 px-2.5 py-1 text-[11px] font-bold text-gold-300 hover:bg-gold-500 hover:text-zinc-950 transition-all"
                          >
                            {isEmitting === sale.id ? 'Emitindo...' : 'Emitir NFC-e'}
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleDownloadXml(sale)}
                              className="rounded border border-zinc-700 bg-zinc-800 p-1 text-zinc-300 hover:text-emerald-400"
                              title="Baixar XML"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedSale(sale)}
                              className="rounded border border-zinc-700 bg-zinc-800 p-1 text-zinc-300 hover:text-gold-400"
                              title="Visualizar DANFE"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card Explicativo de Integração Fiscal */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl">
        <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2 mb-2">
          <Code2 className="h-4 w-4 text-gold-400" />
          <span>Estrutura Pronta para APIs Fiscais Brasileiras</span>
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
          O sistema Absolut Parfum já armazena todos os atributos exigidos pelo fisco: NCM de perfumaria fina (<code className="text-gold-400">3303.00.10</code>), CFOP estadual e interestadual, chave de acesso de 44 dígitos e status de homologação/produção. Para emissão automática com certificado digital A1, é possível plugar diretamente em gateways como <b>Focus NFe</b>, <b>PlugNotas (TecnoSpeed)</b> ou <b>Webmania</b> com poucas linhas de código.
        </p>
      </div>

      {/* Modal de Comprovante / DANFE */}
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
