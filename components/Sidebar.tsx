'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Sparkles, 
  FileSpreadsheet, 
  Boxes, 
  ReceiptText, 
  Percent, 
  Users, 
  FileText,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

const MENU_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pdv', label: 'Frente de Caixa (PDV)', icon: ShoppingCart, highlight: true },
  { href: '/produtos', label: 'Catálogo de Perfumes', icon: Sparkles },
  { href: '/produtos/importar', label: 'Importar Planilhas', icon: FileSpreadsheet },
  { href: '/estoque', label: 'Controle de Estoque', icon: Boxes },
  { href: '/vendas', label: 'Histórico de Vendas', icon: ReceiptText },
  { href: '/taxas', label: 'Simulador de Taxas', icon: Percent },
  { href: '/clientes', label: 'Clientes & CRM', icon: Users },
  { href: '/notas-fiscais', label: 'Emissão Fiscal / NF-e', icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="no-print flex h-full w-64 flex-col border-r border-zinc-800/80 bg-zinc-950/60 p-4 backdrop-blur-md">
      {/* Lista de Navegação Principal */}
      <div className="space-y-1">
        <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Módulos Comerciais
        </p>

        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-gold-500/20 to-gold-500/5 text-gold-300 font-semibold border-l-2 border-gold-400'
                  : item.highlight
                  ? 'text-gold-400 hover:bg-gold-500/10'
                  : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-gold-400' : item.highlight ? 'text-gold-400' : 'text-zinc-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Cartão de Marca Absolut Parfum no rodapé */}
      <div className="mt-auto space-y-3 pt-6">
        <div className="rounded-xl border border-gold-500/20 bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 p-3.5 shadow-inner">
          <div className="flex items-center gap-2 text-gold-400 mb-1">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-bold tracking-wider">ABSOLUT PARFUM</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Perfumaria de Luxo & Fracionados. Next.js + Supabase + Vercel.
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-zinc-800/80 pt-2 text-[10px] text-zinc-500">
            <span>Versão 1.0 Pro</span>
            <span className="text-emerald-400">● Sistema Pronto</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
