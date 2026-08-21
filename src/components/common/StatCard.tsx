import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  id?: string;
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorTheme?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'purple' | 'slate';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  colorTheme = 'indigo',
  onClick
}) => {
  const colorMap = {
    indigo: {
      bg: 'bg-blue-600/10 border-blue-500/30 text-blue-400',
      icon: 'text-blue-400',
      accent: 'border-l-2 border-l-blue-500'
    },
    emerald: {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      icon: 'text-emerald-400',
      accent: 'border-l-2 border-l-emerald-500'
    },
    amber: {
      bg: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
      icon: 'text-orange-400',
      accent: 'border-l-2 border-l-orange-500'
    },
    rose: {
      bg: 'bg-red-500/10 border-red-500/30 text-red-400',
      icon: 'text-red-400',
      accent: 'border-l-2 border-l-red-500'
    },
    sky: {
      bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
      icon: 'text-cyan-400',
      accent: 'border-l-2 border-l-cyan-500'
    },
    purple: {
      bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
      icon: 'text-purple-400',
      accent: 'border-l-2 border-l-purple-500'
    },
    slate: {
      bg: 'bg-zinc-800/40 border-zinc-700/50 text-zinc-400',
      icon: 'text-zinc-400',
      accent: 'border-l-2 border-l-zinc-600'
    }
  };

  const currentTheme = colorMap[colorTheme] || colorMap.indigo;

  return (
    <div
      id={id}
      onClick={onClick}
      className={`relative p-3 bg-[#0d0d0f] border border-[#27272a] rounded transition-colors ${
        onClick ? 'cursor-pointer hover:border-zinc-700 hover:bg-[#121215]' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-2">
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest truncate">
              {title}
            </span>
          </div>
          <div className="mt-1 text-xl sm:text-2xl font-mono font-bold text-zinc-100 tracking-tight">
            {value}
          </div>
          {subtitle && (
            <p className="mt-0.5 text-[10px] text-zinc-500 font-mono truncate">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-mono">
              <span
                className={`inline-flex items-center px-1 py-0.2 rounded border ${
                  trend.isPositive
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-zinc-500">MOM_SYNC</span>
            </div>
          )}
        </div>

        <div className={`p-2 rounded border ${currentTheme.bg}`}>
          <Icon className={`w-4 h-4 ${currentTheme.icon}`} />
        </div>
      </div>
    </div>
  );
};
