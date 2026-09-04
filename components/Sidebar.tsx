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
    <aside className="no-print hidden md:flex h-full w-64 flex-col border-r border-zinc-800/80 bg-zinc-950/60 p-4 backdrop-blur-md">
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
    </aside>
  );
}
