import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'gold' | 'emerald' | 'amber' | 'zinc';
  trend?: string;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'zinc',
  trend,
}: MetricCardProps) {
  const variantStyles = {
    gold: 'border-gold-500/30 bg-gradient-to-b from-zinc-900 to-zinc-950 text-gold-400',
    emerald: 'border-emerald-500/30 bg-gradient-to-b from-zinc-900 to-zinc-950 text-emerald-400',
    amber: 'border-amber-500/30 bg-gradient-to-b from-zinc-900 to-zinc-950 text-amber-400',
    zinc: 'border-zinc-800 bg-zinc-900/80 text-zinc-400',
  };

  const iconBg = {
    gold: 'bg-gold-500/10 text-gold-400 ring-1 ring-gold-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30',
    zinc: 'bg-zinc-800 text-zinc-300 ring-1 ring-zinc-700',
  };

  return (
    <div className={`rounded-xl border p-4 shadow-lg transition-all hover:translate-y-[-2px] ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {title}
        </span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-2">
        <span className="text-2xl font-black tracking-tight text-zinc-100">
          {value}
        </span>
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-800/80 pt-2">
          <span>{subtitle}</span>
          {trend && <span className="font-semibold text-emerald-400">{trend}</span>}
        </div>
      )}
    </div>
  );
}
