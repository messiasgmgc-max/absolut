'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Printer, 
  Search, 
  CheckSquare, 
  Square, 
  SlidersHorizontal, 
  ShoppingCart, 
  Boxes, 
  Scan, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Tag, 
  AlertCircle,
  Eye,
  Settings2,
  PackageCheck,
  Zap,
  CheckCircle2,
  X
} from 'lucide-react';
import { Product } from '@/lib/types';
import { getProducts, addInventoryMovement } from '@/lib/store';

interface LabelItem {
  product: Product;
  copies: number;
  qrDataUrl: string;
}

export default function LabelsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [copiesMap, setCopiesMap] = useState<Record<string, number>>({});
  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  // Configurações da Etiqueta
  const [showPrice, setShowPrice] = useState(true);
  const [showBrand, setShowBrand] = useState(true);
  const [showSku, setShowSku] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [customSubtitle, setCustomSubtitle] = useState('ABSOLUT PARFUM');
  
  // Scanner / Batedor de Estoque / Verificador rápido
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [stockActionType, setStockActionType] = useState<'ENTRADA' | 'SAIDA' | 'CONFERENCIA'>('CONFERENCIA');
  const [stockActionQty, setStockActionQty] = useState(1);
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Carregar produtos
  useEffect(() => {
    async function load() {
      try {
        const list = await getProducts();
        setProducts(list);
        
        // Inicializar 1 cópia para cada produto
        const initialCopies: Record<string, number> = {};
        list.forEach(p => {
          initialCopies[p.id] = 1;
        });
        setCopiesMap(initialCopies);

        // Selecionar os primeiros 12 produtos por padrão
        const initialSelected = new Set(list.slice(0, 12).map(p => p.id));
        setSelectedProductIds(initialSelected);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Gerar QR Codes para os produtos selecionados
  useEffect(() => {
    async function generateQRCodes() {
      const selected = products.filter(p => selectedProductIds.has(p.id));
      const newQrMap: Record<string, string> = { ...qrMap };

      for (const prod of selected) {
        if (!newQrMap[prod.id]) {
          try {
            // Formato estruturado legível por qualquer leitor / câmera ou leitor de código de barras:
            // Permite busca imediata por SKU ou código no PDV e estoque
            const qrPayload = `ABSOLUT|ID:${prod.id}|SKU:${prod.sku || prod.id}|VALOR:${prod.sale_price.toFixed(2)}`;
            const dataUrl = await QRCode.toDataURL(qrPayload, {
              width: 140,
              margin: 1,
              color: {
                dark: '#000000',
                light: '#ffffff',
              },
            });
            newQrMap[prod.id] = dataUrl;
          } catch (e) {
            console.error('Erro ao gerar QR Code para', prod.name, e);
          }
        }
      }
      setQrMap(newQrMap);
    }

    if (products.length > 0 && selectedProductIds.size > 0) {
      generateQRCodes();
    }
  }, [selectedProductIds, products]);

  // Filtro de busca
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  // Selecionar todos os filtrados
  const handleSelectAllFiltered = () => {
    const next = new Set(selectedProductIds);
    filteredProducts.forEach(p => next.add(p.id));
    setSelectedProductIds(next);
  };

  // Desmarcar todos os filtrados
  const handleDeselectAllFiltered = () => {
    const next = new Set(selectedProductIds);
    filteredProducts.forEach(p => next.delete(p.id));
    setSelectedProductIds(next);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedProductIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedProductIds(next);
  };

  const setCopiesForProduct = (id: string, count: number) => {
    setCopiesMap(prev => ({
      ...prev,
      [id]: Math.max(1, count),
    }));
  };

  // Disparar comando de impressão do navegador configurado para LT42D
  const handlePrint = () => {
    window.print();
  };

  // Construir a lista final de etiquetas a serem impressas (com repetição de cópias)
  const labelsToPrint: LabelItem[] = [];
  products.forEach(p => {
    if (selectedProductIds.has(p.id)) {
      const copies = copiesMap[p.id] || 1;
      const qr = qrMap[p.id] || '';
      for (let i = 0; i < copies; i++) {
        labelsToPrint.push({
          product: p,
          copies,
          qrDataUrl: qr,
        });
      }
    }
  });

  // Função do Batedor de Estoque / Verificador
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = scanInput.trim();
    if (!query) return;

    // Tentar extrair do payload do QR Code ou buscar direto por SKU / ID / Nome
    let targetSkuOrId = query;
    if (query.includes('SKU:')) {
      const match = query.match(/SKU:([^|]+)/);
      if (match && match[1]) targetSkuOrId = match[1];
    } else if (query.includes('ID:')) {
      const match = query.match(/ID:([^|]+)/);
      if (match && match[1]) targetSkuOrId = match[1];
    }

    const found = products.find(p => 
      p.id === targetSkuOrId ||
      (p.sku && p.sku.toLowerCase() === targetSkuOrId.toLowerCase()) ||
      p.barcode === targetSkuOrId ||
      p.name.toLowerCase().includes(targetSkuOrId.toLowerCase())
    );

    if (found) {
      setScannedProduct(found);
      setScanMessage({ text: `Produto identificado com sucesso: ${found.name}`, type: 'success' });
    } else {
      setScannedProduct(null);
      setScanMessage({ text: `Nenhum perfume encontrado com o código "${query}"`, type: 'error' });
    }
  };

  // Salvar ação de estoque a partir da leitura da etiqueta
  const handleApplyStockFromScan = async () => {
    if (!scannedProduct) return;
    try {
      if (stockActionType === 'ENTRADA') {
        await addInventoryMovement({
          product_id: scannedProduct.id,
          type: 'ENTRADA',
          quantity: stockActionQty,
          reason: 'Entrada via leitor de etiqueta QR Code',
          user_name: 'Lucas Imports (Leitor)',
        });
        setScanMessage({ text: `Estoque de ${scannedProduct.name} aumentado em +${stockActionQty} un!`, type: 'success' });
      } else if (stockActionType === 'SAIDA') {
        await addInventoryMovement({
          product_id: scannedProduct.id,
          type: 'SAIDA',
          quantity: stockActionQty,
          reason: 'Baixa avulsa via leitor de etiqueta QR Code',
          user_name: 'Lucas Imports (Leitor)',
        });
        setScanMessage({ text: `Baixa de -${stockActionQty} un registrada em ${scannedProduct.name}!`, type: 'success' });
      }
      // Atualizar lista de produtos
      const updatedList = await getProducts();
      setProducts(updatedList);
      const updatedProd = updatedList.find(p => p.id === scannedProduct.id);
      if (updatedProd) setScannedProduct(updatedProd);
    } catch (err) {
      console.error(err);
      setScanMessage({ text: 'Falha ao salvar movimentação no banco de dados.', type: 'error' });
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* VISUALIZAÇÃO DE TELA (NÃO IMPRESSA)                                       */}
      {/* ========================================================================= */}
      <div className="no-print space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-gold-400">
              <QrCode className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Impressora Térmica LT42D • 3 Colunas
              </span>
            </div>
            <h1 className="text-2xl font-black text-zinc-100">
              Emissor de Etiquetas & QR Code Absolut Parfum
            </h1>
            <p className="text-xs text-zinc-400">
              Gere e imprima rolos de etiquetas de 3 colunas para identificação de frascos, caixas e decants. 
              Compatível com conferência, contagem de estoque e frente de caixa (PDV).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Botão de abrir Conferência / Batedor de Estoque */}
            <button
              type="button"
              onClick={() => {
                setScannerOpen(true);
                setTimeout(() => scanInputRef.current?.focus(), 150);
              }}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs font-bold text-zinc-200 hover:border-gold-500/60 hover:text-gold-300 transition-all"
            >
              <Scan className="h-4 w-4 text-gold-400" />
              <span>Bater Estoque / Conferir QR</span>
            </button>

            {/* Botão Imprimir Etiquetas */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={labelsToPrint.length === 0}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-amber-500 px-5 py-2.5 text-xs font-bold text-zinc-950 shadow-lg shadow-gold-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir {labelsToPrint.length} Etiqueta(s) (LT42D)</span>
            </button>
          </div>
        </div>

        {/* Barra de Customização do Formato da Etiqueta */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-gold-400" />
              <span>Configuração da Etiqueta LT42D (Largura do Rolo: 104mm • 3 Colunas)</span>
            </h3>
            <span className="text-[11px] font-mono text-gold-400 font-semibold">
              {selectedProductIds.size} perfume(s) selecionado(s) • Total: {labelsToPrint.length} etiquetas
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showPrice} 
                onChange={(e) => setShowPrice(e.target.checked)} 
                className="rounded accent-gold-500" 
              />
              <span>Exibir Preço (R$)</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showBrand} 
                onChange={(e) => setShowBrand(e.target.checked)} 
                className="rounded accent-gold-500" 
              />
              <span>Exibir Marca / Grife</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showSku} 
                onChange={(e) => setShowSku(e.target.checked)} 
                className="rounded accent-gold-500" 
              />
              <span>Exibir SKU / Código</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showVolume} 
                onChange={(e) => setShowVolume(e.target.checked)} 
                className="rounded accent-gold-500" 
              />
              <span>Exibir Volumetria (ml)</span>
            </label>

            <div className="col-span-2 sm:col-span-1">
              <input
                type="text"
                value={customSubtitle}
                onChange={(e) => setCustomSubtitle(e.target.value)}
                placeholder="Cabeçalho da Etiqueta"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-200 focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Prévia das Etiquetas no Formato Real de 3 Colunas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Eye className="h-4 w-4 text-gold-400" />
              <span>Pré-Visualização Real em 3 Colunas (Impressora LT42D)</span>
            </h3>
            <span className="text-[11px] text-zinc-500">
              Dispostas exatamente como sairão no rolo térmico da LT42D
            </span>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 overflow-x-auto shadow-inner">
            {labelsToPrint.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 space-y-2">
                <Tag className="h-8 w-8 mx-auto text-zinc-600" />
                <p className="text-xs">Nenhum perfume selecionado para impressão de etiquetas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto">
                {labelsToPrint.slice(0, 9).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-lg border border-zinc-700 bg-white p-2 text-zinc-950 shadow-sm transition-transform hover:scale-[1.02]"
                    style={{ minHeight: '120px' }}
                  >
                    {/* Topo da Etiqueta */}
                    <div className="text-center border-b border-zinc-200 pb-1">
                      <span className="block text-[9px] font-black tracking-widest text-zinc-800 uppercase leading-none">
                        {customSubtitle || 'ABSOLUT PARFUM'}
                      </span>
                    </div>

                    {/* Centro da Etiqueta (Nome + QR Code) */}
                    <div className="flex items-center gap-2 py-1">
                      {item.qrDataUrl && (
                        <img 
                          src={item.qrDataUrl} 
                          alt="QR Code" 
                          className="h-14 w-14 shrink-0 rounded border border-zinc-300 p-0.5" 
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[10px] font-bold text-zinc-900 leading-tight line-clamp-2">
                          {item.product.name}
                        </h4>
                        {showBrand && (
                          <span className="block text-[9px] font-semibold text-zinc-600 truncate mt-0.5">
                            {item.product.brand} {showVolume && `• ${item.product.volume_ml}ml`}
                          </span>
                        )}
                        {showSku && (
                          <span className="block text-[8px] font-mono text-zinc-500 truncate">
                            SKU: {item.product.sku || item.product.id.slice(0, 10)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rodapé da Etiqueta (Preço e Chave Rápida) */}
                    <div className="flex items-center justify-between border-t border-zinc-200 pt-1 text-[9px]">
                      <span className="font-mono text-[8px] text-zinc-500">
                        ORIGINAL
                      </span>
                      {showPrice && (
                        <span className="font-black text-xs text-zinc-950 font-mono">
                          R$ {item.product.sale_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {labelsToPrint.length > 9 && (
              <p className="mt-4 text-center text-xs text-zinc-500">
                + {labelsToPrint.length - 9} etiqueta(s) a mais serão impressas no rolo térmico da LT42D.
              </p>
            )}
          </div>
        </div>

        {/* Tabela de Seleção e Quantidade de Cópias por Perfume */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar perfume por nome, marca ou SKU para imprimir etiquetas..."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-2 pl-10 pr-4 text-xs text-zinc-100 placeholder-zinc-500 focus:border-gold-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-zinc-100 hover:border-zinc-500 transition-all"
              >
                <CheckSquare className="h-3.5 w-3.5 text-gold-400" />
                <span>Selecionar Filtrados</span>
              </button>
              <button
                type="button"
                onClick={handleDeselectAllFiltered}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-all"
              >
                <Square className="h-3.5 w-3.5" />
                <span>Limpar Seleção</span>
              </button>
            </div>
          </div>

          {/* Tabela */}
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Sel.</th>
                    <th className="py-3 px-4">Perfume / Fragrância</th>
                    <th className="py-3 px-4">Marca</th>
                    <th className="py-3 px-4 text-center">Vol (ml)</th>
                    <th className="py-3 px-4 text-center">SKU</th>
                    <th className="py-3 px-4 text-right">Preço</th>
                    <th className="py-3 px-4 text-center">Estoque Atual</th>
                    <th className="py-3 px-4 text-center w-36">Qtd Etiquetas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-zinc-500">
                        Carregando catálogo de perfumes...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-zinc-500">
                        Nenhum produto encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((prod) => {
                      const isSelected = selectedProductIds.has(prod.id);
                      const copies = copiesMap[prod.id] || 1;

                      return (
                        <tr 
                          key={prod.id} 
                          className={`hover:bg-zinc-800/40 transition-colors ${isSelected ? 'bg-gold-500/5' : ''}`}
                        >
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(prod.id)}
                              className="rounded accent-gold-500 h-4 w-4 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4 font-semibold text-zinc-100">
                            {prod.name}
                          </td>
                          <td className="py-3 px-4 text-gold-400">
                            {prod.brand}
                          </td>
                          <td className="py-3 px-4 text-center font-mono">
                            {prod.volume_ml}ml
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-[11px] text-zinc-400">
                            {prod.sku || '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-gold-400">
                            R$ {prod.sale_price.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center font-mono">
                            <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold ${
                              prod.stock_quantity <= prod.min_stock 
                                ? 'bg-rose-950 text-rose-400 border border-rose-800' 
                                : 'bg-zinc-800 text-zinc-200'
                            }`}>
                              {prod.stock_quantity} un
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setCopiesForProduct(prod.id, copies - 1)}
                                className="h-7 w-7 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={999}
                                value={copies}
                                onChange={(e) => setCopiesForProduct(prod.id, parseInt(e.target.value) || 1)}
                                className="w-14 rounded-lg border border-zinc-700 bg-zinc-950 py-1 text-center font-mono text-xs text-zinc-100 focus:border-gold-500 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => setCopiesForProduct(prod.id, copies + 1)}
                                className="h-7 w-7 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                              >
                                +
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: BATEDOR DE ESTOQUE / CONFERÊNCIA POR QR CODE                       */}
      {/* ========================================================================= */}
      {scannerOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden space-y-4">
            {/* Header do Modal */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-950/60">
              <div className="flex items-center gap-2 text-gold-400">
                <Scan className="h-5 w-5" />
                <h3 className="text-sm font-bold text-zinc-100">Batedor de Estoque & Verificador QR Code</h3>
              </div>
              <button
                type="button"
                onClick={() => setScannerOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Campo do Leitor */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Aproxime o leitor de código de barras / QR Code ou digite o código/SKU:
                </label>
                <form onSubmit={handleScanSubmit} className="flex gap-2">
                  <input
                    ref={scanInputRef}
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder="Bipe a etiqueta com o leitor ou cole o QR Code..."
                    className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-gold-500 focus:outline-none font-mono"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-gold-500 px-4 py-2 text-xs font-bold text-zinc-950 shadow hover:brightness-110"
                  >
                    Identificar
                  </button>
                </form>
              </div>

              {/* Mensagem de Feedback */}
              {scanMessage && (
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  scanMessage.type === 'success' 
                    ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300' 
                    : 'border-rose-500/30 bg-rose-950/30 text-rose-300'
                }`}>
                  {scanMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                  <span>{scanMessage.text}</span>
                </div>
              )}

              {/* Card do Produto Identificado */}
              {scannedProduct && (
                <div className="rounded-2xl border border-gold-500/40 bg-zinc-950 p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-gold-400 uppercase tracking-wider">
                        {scannedProduct.brand} • {scannedProduct.volume_ml}ml
                      </span>
                      <h4 className="text-sm font-bold text-zinc-100">
                        {scannedProduct.name}
                      </h4>
                      <span className="text-xs font-mono text-zinc-400">
                        SKU: {scannedProduct.sku || '-'}
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-sm font-black text-gold-400">
                        R$ {scannedProduct.sale_price.toFixed(2)}
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        Estoque: <b>{scannedProduct.stock_quantity} un</b>
                      </span>
                    </div>
                  </div>

                  {/* Ações Rápidas: Abrir Venda ou Bater Estoque */}
                  <div className="border-t border-zinc-800 pt-3 space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      O que deseja fazer com este perfume?
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/pdv?addSku=${encodeURIComponent(scannedProduct.sku || scannedProduct.id)}`}
                        className="flex items-center justify-center gap-2 rounded-xl bg-gold-500 py-2.5 text-xs font-bold text-zinc-950 shadow hover:brightness-110"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>Lançar no PDV</span>
                      </Link>

                      <Link
                        href="/estoque"
                        className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
                      >
                        <Boxes className="h-4 w-4" />
                        <span>Ver no Almoxarifado</span>
                      </Link>
                    </div>

                    {/* Ajuste Direto de Estoque */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 space-y-2">
                      <span className="text-[11px] font-semibold text-zinc-300">
                        Bater saldo de estoque rápido:
                      </span>
                      <div className="flex items-center gap-2">
                        <select
                          value={stockActionType}
                          onChange={(e) => setStockActionType(e.target.value as any)}
                          className="rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-gold-500 focus:outline-none"
                        >
                          <option value="CONFERENCIA">Apenas Conferência</option>
                          <option value="ENTRADA">+ Entrada de Estoque</option>
                          <option value="SAIDA">- Baixa de Estoque</option>
                        </select>

                        {stockActionType !== 'CONFERENCIA' && (
                          <input
                            type="number"
                            min={1}
                            value={stockActionQty}
                            onChange={(e) => setStockActionQty(parseInt(e.target.value) || 1)}
                            className="w-16 rounded-lg border border-zinc-700 bg-zinc-950 py-1.5 text-center text-xs font-mono text-zinc-100"
                          />
                        )}

                        {stockActionType !== 'CONFERENCIA' && (
                          <button
                            type="button"
                            onClick={handleApplyStockFromScan}
                            className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
                          >
                            Confirmar Ajuste
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO IMPRESSA: ROLO TÉRMICO LT42D (104MM DE LARGURA • 3 COLUNAS)          */}
      {/* ========================================================================= */}
      <div className="printable-labels">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: 104mm auto;
              margin: 2mm 1mm;
            }
            body {
              background: white !important;
              color: black !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .label-grid-lt42d {
              display: grid !important;
              grid-template-columns: repeat(3, 33mm) !important;
              column-gap: 2.5mm !important;
              row-gap: 3mm !important;
              width: 104mm !important;
              margin: 0 auto !important;
            }
            .label-item-lt42d {
              width: 33mm !important;
              height: 25mm !important;
              max-height: 25mm !important;
              box-sizing: border-box !important;
              border: 0.5pt solid #ddd !important;
              padding: 1mm 1.5mm !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              overflow: hidden !important;
              background: white !important;
              color: black !important;
              page-break-inside: avoid !important;
            }
          }
        `}} />

        <div className="label-grid-lt42d">
          {labelsToPrint.map((item, idx) => (
            <div key={idx} className="label-item-lt42d">
              {/* Cabeçalho */}
              <div style={{ textAlign: 'center', lineHeight: '1.1', borderBottom: '0.5pt solid #ccc', paddingBottom: '0.5mm' }}>
                <span style={{ fontSize: '7pt', fontWeight: '900', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  {customSubtitle || 'ABSOLUT PARFUM'}
                </span>
              </div>

              {/* Meio: QR Code + Dados do Perfume */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5mm', margin: '0.5mm 0' }}>
                {item.qrDataUrl && (
                  <img 
                    src={item.qrDataUrl} 
                    alt="QR" 
                    style={{ width: '13mm', height: '13mm', display: 'block', flexShrink: 0 }} 
                  />
                )}
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ 
                    fontSize: '6.5pt', 
                    fontWeight: 'bold', 
                    lineHeight: '1.1', 
                    maxHeight: '7mm', 
                    overflow: 'hidden', 
                    wordBreak: 'break-word' 
                  }}>
                    {item.product.name}
                  </div>
                  {showBrand && (
                    <div style={{ fontSize: '5.5pt', color: '#444', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                      {item.product.brand} {showVolume && `• ${item.product.volume_ml}ml`}
                    </div>
                  )}
                  {showSku && (
                    <div style={{ fontSize: '5pt', fontFamily: 'monospace', color: '#666', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                      {item.product.sku || item.product.id.slice(0, 10)}
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé: Originalidade e Preço */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '0.5pt solid #ccc', paddingTop: '0.5mm' }}>
                <span style={{ fontSize: '5.5pt', fontWeight: 'bold' }}>
                  ORIGINAL
                </span>
                {showPrice && (
                  <span style={{ fontSize: '7.5pt', fontWeight: '900', fontFamily: 'monospace' }}>
                    R$ {item.product.sale_price.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
