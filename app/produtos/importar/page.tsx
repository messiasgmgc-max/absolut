'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Sparkles,
  FileCheck,
  Check,
  PackagePlus,
  RefreshCw
} from 'lucide-react';
import { downloadProductTemplate, parseUploadedFile, exportCurrentCatalogForStockUpdate } from '@/lib/export-excel';
import { importProductsBatch, getProducts } from '@/lib/store';
import { Product } from '@/lib/types';

export default function ImportProductsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Partial<Product>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<{ inserted: number; updated: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportCurrentStock = async () => {
    setIsExporting(true);
    try {
      const prods = await getProducts();
      exportCurrentCatalogForStockUpdate(prods);
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao gerar planilha com produtos atuais.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (selectedFile: File) => {
    setErrorMsg(null);
    setResult(null);
    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const items = await parseUploadedFile(selectedFile);
      if (items.length === 0) {
        setErrorMsg('Nenhum produto com nome válido foi encontrado na planilha enviada.');
      } else {
        setParsedData(items);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro ao ler a planilha. Certifique-se de que é um arquivo Excel (.xlsx) ou CSV válido.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = async () => {
    if (parsedData.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await importProductsBatch(parsedData);
      setResult(res);
      setParsedData([]);
      setFile(null);
    } catch (err) {
      console.error(err);
      setErrorMsg('Falha ao gravar os produtos no banco de dados.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link
            href="/produtos"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-gold-400 transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao Catálogo</span>
          </Link>
          <div className="flex items-center gap-2 text-gold-400">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Importação & Atualização em Massa</span>
          </div>
          <h1 className="text-2xl font-black text-zinc-100">
            Importar & Atualizar Estoque via Planilha
          </h1>
          <p className="text-xs text-zinc-400">
            Exporte o catálogo atual para alterar as quantidades em lote, ou envie uma nova planilha de fornecedor.
          </p>
        </div>

        {/* Botão para Baixar Planilha Modelo */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => downloadProductTemplate('xlsx')}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 transition-all"
          >
            <Download className="h-4 w-4 text-zinc-400" />
            <span>Modelo Vazio (XLSX)</span>
          </button>
        </div>
      </div>

      {/* CARD DESTAQUE: EXPORTAR PLANILHA ATUAL PARA ALTERAR ESTOQUE */}
      <div className="rounded-2xl border border-gold-500/40 bg-gradient-to-r from-gold-950/20 via-zinc-900 to-zinc-900/90 p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-wider">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Atualização Rápida de Estoque</span>
            </div>
            <h2 className="text-base font-bold text-zinc-100">
              Exportar Planilha Atual dos Produtos para Ajustar Estoque
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl">
              Baixe a planilha com todos os <b>perfumes cadastrados atualmente</b> (SKU, Nome, Preços e Quantidades). Abra no Excel, altere a coluna <b>Estoque Inicial</b> com os novos valores e faça o upload abaixo. O sistema atualiza tudo automaticamente!
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCurrentStock}
            disabled={isExporting}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gold-500 px-5 py-3 text-xs font-bold text-zinc-950 shadow-md shadow-gold-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Gerando Arquivo...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Baixar Planilha de Produtos Atual (.xlsx)</span>
              </>
            )}
          </button>
        </div>
      </div>


      {/* Alerta de Sucesso após Importar */}
      {result && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-6 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-300">
              Importação Concluída com Sucesso!
            </h3>
            <p className="text-xs text-zinc-300 mt-1">
              Foram adicionados <b className="text-emerald-400">{result.inserted} novos perfumes</b> e atualizados <b className="text-emerald-400">{result.updated} perfumes existentes</b>.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/produtos"
              className="rounded-xl bg-gold-500 px-5 py-2.5 text-xs font-bold text-zinc-950 shadow-md shadow-gold-500/20 hover:brightness-110"
            >
              Ver Catálogo Atualizado
            </Link>
            <Link
              href="/pdv"
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
            >
              Ir para Frente de Caixa
            </Link>
          </div>
        </div>
      )}

      {/* Área de Upload / Arrastar e Soltar */}
      {!result && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/60 p-10 text-center transition-all hover:border-gold-500/60 hover:bg-zinc-900/90"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
          />

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/80 text-gold-400 group-hover:scale-110 transition-transform">
            <UploadCloud className="h-8 w-8" />
          </div>

          <h3 className="mt-4 text-base font-bold text-zinc-200">
            {file ? file.name : 'Arraste e solte sua planilha aqui'}
          </h3>
          <p className="mt-1 text-xs text-zinc-400">
            Suporta planilhas do Excel (.xlsx, .xls) ou arquivos separados por vírgula (.csv)
          </p>

          <button
            type="button"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 group-hover:bg-gold-500 group-hover:text-zinc-950 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Selecionar Arquivo do Computador</span>
          </button>
        </div>
      )}

      {/* Mensagem de Erro */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Pré-visualização dos Produtos Identificados */}
      {parsedData.length > 0 && (
        <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-400" />
                <span>Pré-visualização: {parsedData.length} produtos identificados</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Confira os dados mapeados antes de confirmar a gravação no banco de dados.
              </p>
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirmImport}
              className="flex items-center gap-2 rounded-xl bg-gold-500 px-5 py-2.5 text-xs font-bold text-zinc-950 shadow-lg shadow-gold-500/20 hover:brightness-110 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Importando...</span>
                </>
              ) : (
                <>
                  <PackagePlus className="h-4 w-4" />
                  <span>Confirmar e Importar {parsedData.length} Produtos</span>
                </>
              )}
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/60">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="sticky top-0 border-b border-zinc-800 bg-zinc-950 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="py-2.5 px-3">Perfume</th>
                  <th className="py-2.5 px-3">Marca</th>
                  <th className="py-2.5 px-3">Concentração</th>
                  <th className="py-2.5 px-3 text-center">Vol (ml)</th>
                  <th className="py-2.5 px-3 text-right">Preço Custo</th>
                  <th className="py-2.5 px-3 text-right">Preço Venda</th>
                  <th className="py-2.5 px-3 text-center">Estoque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {parsedData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/40">
                    <td className="py-2.5 px-3 font-semibold text-zinc-200">{item.name}</td>
                    <td className="py-2.5 px-3 text-gold-400">{item.brand}</td>
                    <td className="py-2.5 px-3 text-zinc-400">{item.concentration}</td>
                    <td className="py-2.5 px-3 text-center">{item.volume_ml}ml</td>
                    <td className="py-2.5 px-3 text-right font-mono">R$ {Number(item.cost_price || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-gold-400">R$ {Number(item.sale_price || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{item.stock_quantity || 0} un</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
