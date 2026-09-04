'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ShoppingCart, 
  Calculator, 
  Database, 
  PlusCircle, 
  Bell, 
  Store
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getProducts } from '@/lib/store';

export default function Header() {
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    getProducts().then(prods => {
      const low = prods.filter(p => p.stock_quantity <= p.min_stock).length;
      setLowStockCount(low);
    });
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/90 px-4 py-3 backdrop-blur-md md:px-8">
      {/* Esquerda: Logo / Branding Absolut Parfum */}
      <div className="flex items-center gap-3">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 text-zinc-950 shadow-lg shadow-gold-500/20 ring-1 ring-gold-300/40 transition-transform group-hover:scale-105">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xs font-semibold tracking-[0.25em] text-gold-400">
              ABSOLUT
            </span>
            <span className="block text-base font-bold tracking-wider text-zinc-100">
              PARFUM
            </span>
          </div>
        </Link>

      </div>

      {/* Direita: Ações Rápidas */}
      <div className="flex items-center gap-2.5">
        {/* Alerta de Estoque Baixo */}
        {lowStockCount > 0 && (
          <Link 
            href="/estoque" 
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-colors"
            title="Produtos com estoque crítico"
          >
            <Bell className="h-3.5 w-3.5 animate-pulse text-amber-400" />
            <span className="hidden sm:inline">Estoque Baixo:</span>
            <span className="rounded bg-amber-500/30 px-1.5 py-0.5 font-bold">{lowStockCount}</span>
          </Link>
        )}

        {/* Botão Simulador de Taxas */}
        <Link 
          href="/taxas" 
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-xs font-medium text-zinc-200 hover:border-gold-500/50 hover:bg-zinc-850 hover:text-gold-300 transition-all"
        >
          <Calculator className="h-4 w-4 text-gold-400" />
          <span className="hidden md:inline">Simular Taxas</span>
        </Link>

        {/* Botão Novo Produto */}
        <Link 
          href="/produtos" 
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition-all"
        >
          <PlusCircle className="h-4 w-4 text-zinc-400" />
          <span>Cadastrar Perfume</span>
        </Link>

        {/* Botão Principal: Abrir PDV / Venda */}
        <Link 
          href="/pdv" 
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-500 via-gold-400 to-amber-500 px-4 py-2 text-xs font-bold text-zinc-950 shadow-md shadow-gold-500/20 hover:brightness-110 active:scale-95 transition-all"
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Frente de Caixa (PDV)</span>
        </Link>
      </div>
    </header>
  );
}
