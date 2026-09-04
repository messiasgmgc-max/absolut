'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Search, 
  Plus, 
  FileSpreadsheet, 
  Download, 
  Edit3, 
  Trash2, 
  AlertTriangle,
  Check,
  X,
  SlidersHorizontal,
  PackageCheck,
  Tag,
  ChevronDown
} from 'lucide-react';
import { Product, ConcentrationType, GenderType } from '@/lib/types';
import { getProducts, saveProduct, deleteProduct } from '@/lib/store';
import { exportProductsToExcel } from '@/lib/export-excel';

const POPULAR_BRANDS = [
  'Todas as Grifes',
  'Lattafa',
  'Azzaro',
  'Carolina Herrera',
  'Armaf',
  'Paco Rabanne',
  'Chanel',
  'Dior',
  'Afnan',
  'Al Wataniah',
  'Yves Saint Laurent',
  'Prada',
  'Orientica',
];

const CONCENTRATIONS = [
  'Todas',
  'Parfum / Extrait',
  'Eau de Parfum (EDP)',
  'Eau de Toilette (EDT)',
  'Decant / Fração (10ml)',
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('Todas as Grifes');
  const [selectedConc, setSelectedConc] = useState('Todas');
  const [visibleCount, setVisibleCount] = useState(24);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const list = await getProducts();
    setProducts(list);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = products.filter((p) => {
    const term = search.toLowerCase();
    const matchesSearch = 
      p.name.toLowerCase().includes(term) ||
      p.brand.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      (p.barcode && p.barcode.includes(term));

    const matchesBrand = 
      selectedBrand === 'Todas as Grifes' || 
      p.brand.toLowerCase() === selectedBrand.toLowerCase();

    const matchesConc = 
      selectedConc === 'Todas' || 
      p.concentration === selectedConc;

    return matchesSearch && matchesBrand && matchesConc;
  });

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  const handleOpenCreate = () => {
    setEditingProduct({
      name: '',
      brand: 'Absolut Parfum',
      concentration: 'Eau de Parfum (EDP)',
      volume_ml: 100,
      olfactory_family: 'Fragrância Fina',
      gender: 'Compartilhável',
      sku: '',
      barcode: '',
      cost_price: 200,
      sale_price: 399.90,
      stock_quantity: 5,
      min_stock: 2,
      image_url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600',
      description: '',
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name) return;

    await saveProduct(editingProduct);
    setIsModalOpen(false);
    setEditingProduct(null);
    await loadData();
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Deseja realmente remover a fragrância "${name}" do catálogo?`)) {
      await deleteProduct(id);
      await loadData();
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-gold-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-[11px] font-bold uppercase tracking-widest">Catálogo Absolut</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-zinc-100">
            Fragrâncias & Produtos
          </h1>
          <p className="text-xs text-zinc-400">
            {filteredProducts.length} de {products.length} perfumes encontrados no catálogo
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportProductsToExcel(products)}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-zinc-100 transition-all"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          <Link
            href="/produtos/importar"
            className="flex items-center gap-1.5 rounded-xl border border-gold-500/40 bg-gold-500/10 px-3 py-2 text-xs font-semibold text-gold-300 hover:bg-gold-500/20 transition-all"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-gold-400" />
            <span>Importar</span>
          </Link>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-xl bg-gold-500 px-3.5 py-2 text-xs font-bold text-zinc-950 shadow-md shadow-gold-500/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Novo Perfume</span>
          </button>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 md:p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por Asad, Sauvage, Azzaro, Good Girl, Bleu, 9PM..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-2.5 pl-10 pr-4 text-xs text-zinc-100 placeholder-zinc-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          />
        </div>

        {/* Filtros em Pílulas / Scroll Horizontal para Mobile (iPhone 16 Pro Max / S24 Ultra) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {POPULAR_BRANDS.map((brand) => {
            const isSelected = selectedBrand === brand;
            return (
              <button
                key={brand}
                type="button"
                onClick={() => setSelectedBrand(brand)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-gold-500 text-zinc-950 font-bold shadow-md shadow-gold-500/20'
                    : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                {brand}
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODO MOBILE: CARDS RESPONSIVOS (iPhone 16 Pro Max / S24) */}
      {/* ======================================================== */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="py-12 text-center text-zinc-500 text-xs">Carregando fragrâncias...</div>
        ) : visibleProducts.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">Nenhum perfume encontrado.</div>
        ) : (
          visibleProducts.map((p) => {
            const margin = p.cost_price > 0 
              ? (((p.sale_price - p.cost_price) / p.cost_price) * 100).toFixed(0)
              : '100';
            const isLowStock = p.stock_quantity <= p.min_stock;

            return (
              <div 
                key={p.id}
                className="flex gap-3 rounded-2xl border border-zinc-800/90 bg-zinc-900/80 p-3 shadow-lg"
              >
                {/* Imagem do Perfume */}
                <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-950 border border-zinc-800/80">
                  <img
                    src={p.image_url || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600'}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-1 left-1">
                    <span className="rounded bg-zinc-950/80 px-1.5 py-0.5 text-[9px] font-bold text-zinc-300 backdrop-blur-sm">
                      {p.volume_ml}ml
                    </span>
                  </div>
                </div>

                {/* Detalhes do Perfume */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gold-400">
                        {p.brand}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="rounded p-1 text-zinc-400 hover:text-gold-300"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id, p.name)}
                          className="rounded p-1 text-zinc-500 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-zinc-100 line-clamp-2 mt-0.5 leading-snug">
                      {p.name}
                    </h4>

                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      {p.concentration}
                    </div>
                  </div>

                  {/* Preços e Estoque */}
                  <div className="mt-2 flex items-end justify-between border-t border-zinc-800/80 pt-1.5">
                    <div>
                      <div className="text-[10px] text-zinc-500">
                        Custo: R$ {p.cost_price.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-gold-400 font-mono">
                          R$ {p.sale_price.toFixed(2)}
                        </span>
                        <span className="rounded bg-emerald-950/80 border border-emerald-500/30 px-1 py-0.2 text-[9px] font-bold text-emerald-400">
                          +{margin}%
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isLowStock 
                          ? 'bg-rose-950/80 border border-rose-600/40 text-rose-300' 
                          : 'bg-zinc-800 text-zinc-200'
                      }`}>
                        {p.stock_quantity} un
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ======================================================== */}
      {/* MODO DESKTOP: TABELA COMPLETA (Telas Médias e Grandes)     */}
      {/* ======================================================== */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="py-3 px-4">Fragrância / Grife</th>
                <th className="py-3 px-4">Tipo & Volume</th>
                <th className="py-3 px-4 text-right">Preço Custo</th>
                <th className="py-3 px-4 text-right">Preço Venda</th>
                <th className="py-3 px-4 text-center">Margem</th>
                <th className="py-3 px-4 text-center">Estoque</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    Carregando catálogo...
                  </td>
                </tr>
              ) : visibleProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    Nenhum produto encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                visibleProducts.map((p) => {
                  const margin = p.cost_price > 0 
                    ? (((p.sale_price - p.cost_price) / p.cost_price) * 100).toFixed(0)
                    : '100';
                  const isLowStock = p.stock_quantity <= p.min_stock;

                  return (
                    <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image_url || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600'}
                            alt={p.name}
                            className="h-11 w-11 rounded-lg object-cover border border-zinc-800 bg-zinc-950"
                            loading="lazy"
                          />
                          <div className="max-w-md">
                            <div className="font-bold text-zinc-100 line-clamp-1">{p.name}</div>
                            <div className="text-[11px] text-gold-400 font-semibold">{p.brand}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">SKU: {p.sku}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-block rounded bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                          {p.concentration}
                        </span>
                        <div className="text-[10px] text-zinc-400 mt-1">
                          {p.volume_ml}ml • {p.gender}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-zinc-400">
                        R$ {p.cost_price.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-gold-400 text-sm">
                        R$ {p.sale_price.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="rounded-full bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                          +{margin}%
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                            isLowStock 
                              ? 'bg-rose-950/80 border border-rose-600/40 text-rose-300' 
                              : 'bg-zinc-800 text-zinc-200'
                          }`}>
                            {p.stock_quantity} un
                          </span>
                          {isLowStock && (
                            <span title="Estoque abaixo do mínimo!">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-zinc-500 mt-0.5">mín: {p.min_stock}</div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-gold-300 transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.name)}
                            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-rose-400 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Botão "Carregar Mais" quando houver mais produtos */}
      {visibleCount < filteredProducts.length && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setVisibleCount(prev => prev + 24)}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-2.5 text-xs font-bold text-zinc-200 hover:border-gold-500/50 hover:text-gold-400 transition-all shadow-md active:scale-95"
          >
            <span>Carregar Mais Perfumes ({filteredProducts.length - visibleCount} restantes)</span>
            <ChevronDown className="h-4 w-4 text-gold-400" />
          </button>
        </div>
      )}

      {/* Modal de Cadastro / Edição de Produto */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm">
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900 p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-zinc-100">
                {editingProduct.id ? 'Editar Fragrância' : 'Cadastrar Nova Fragrância'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Nome do Perfume *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 text-zinc-100 focus:border-gold-500 focus:outline-none"
                    placeholder="Ex: Asad, Sauvage Elixir, 9PM"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Marca / Grife *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.brand || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 text-zinc-100 focus:border-gold-500 focus:outline-none"
                    placeholder="Ex: Lattafa, Dior, Azzaro, Armaf"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Concentração</label>
                  <select
                    value={editingProduct.concentration || 'Eau de Parfum (EDP)'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, concentration: e.target.value })}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 text-zinc-100 focus:border-gold-500 focus:outline-none"
                  >
                    {CONCENTRATIONS.filter(c => c !== 'Todas').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Volumetria (ml) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editingProduct.volume_ml || 100}
                    onChange={(e) => setEditingProduct({ ...editingProduct, volume_ml: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 text-zinc-100 focus:border-gold-500 focus:outline-none"
                    placeholder="Ex: 100, 50, 10"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Preço de Custo (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editingProduct.cost_price || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, cost_price: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 text-zinc-100 focus:border-gold-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Preço de Venda (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editingProduct.sale_price || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sale_price: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 text-gold-400 font-bold focus:border-gold-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Estoque Atual *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingProduct.stock_quantity ?? 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock_quantity: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 text-zinc-100 focus:border-gold-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.min_stock ?? 2}
                    onChange={(e) => setEditingProduct({ ...editingProduct, min_stock: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 text-zinc-100 focus:border-gold-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">URL da Imagem do Frasco</label>
                <input
                  type="url"
                  value={editingProduct.image_url || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 text-zinc-100 focus:border-gold-500 focus:outline-none"
                  placeholder="https://firebasestorage..."
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-zinc-800 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gold-500 px-6 py-2 text-xs font-bold text-zinc-950 shadow-md shadow-gold-500/20 hover:brightness-110"
                >
                  Salvar Perfume
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
