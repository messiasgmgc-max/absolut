'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Sparkles, 
  ShoppingCart, 
  Boxes, 
  Percent,
  ReceiptText
} from 'lucide-react';

export default function MobileNav() {
  const pathname = usePathname();

  const items = [
    { href: '/', label: 'Início', icon: LayoutDashboard },
    { href: '/produtos', label: 'Catálogo', icon: Sparkles },
    { href: '/pdv', label: 'PDV', icon: ShoppingCart, isPrimary: true },
    { href: '/estoque', label: 'Estoque', icon: Boxes },
    { href: '/taxas', label: 'Taxas', icon: Percent },
  ];

  return (
    <nav className="no-print fixed bottom-0 left-0 right-0 z-40 block md:hidden border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl pb-safe">
      <div className="flex h-16 items-center justify-around px-2">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative -top-3 flex flex-col items-center"
              >
                <div className={`flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-gold-600 via-gold-400 to-amber-300 p-3 text-zinc-950 shadow-lg shadow-gold-500/30 ring-4 ring-zinc-950 transition-transform active:scale-95 ${
                  isActive ? 'scale-105 brightness-110' : ''
                }`}>
                  <ShoppingCart className="h-6 w-6 font-bold" />
                </div>
                <span className="mt-0.5 text-[10px] font-bold text-gold-400">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
                isActive ? 'text-gold-400 font-semibold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? 'text-gold-400 scale-110' : ''} transition-transform`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-gold-400 shadow-sm shadow-gold-400" />
                )}
              </div>
              <span className="mt-1 text-[10px] tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
