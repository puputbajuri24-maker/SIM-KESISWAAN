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
      bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      icon: 'text-blue-400',
    },
    emerald: {
      bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      icon: 'text-emerald-400',
    },
    amber: {
      bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      icon: 'text-amber-400',
    },
    rose: {
      bg: 'bg-red-500/10 border-red-500/20 text-red-400',
      icon: 'text-red-400',
    },
    sky: {
      bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
      icon: 'text-cyan-400',
    },
    purple: {
      bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      icon: 'text-purple-400',
    },
    slate: {
      bg: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
      icon: 'text-slate-400',
    }
  };

  const currentTheme = colorMap[colorTheme] || colorMap.indigo;

  return (
    <div
      id={id}
      onClick={onClick}
      className={`relative p-4 bg-[#111726] border border-[#1e293b] rounded-2xl transition-all shadow-sm ${
        onClick ? 'cursor-pointer hover:border-slate-600 hover:bg-[#162035]' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-2">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wide truncate">
            {title.replace(/_/g, ' ')}
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {value}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400 truncate">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded-md font-semibold ${
                  trend.isPositive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/15 text-red-400 border border-red-500/20'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
            </div>
          )}
        </div>

        <div className={`p-3 rounded-xl border ${currentTheme.bg} shrink-0`}>
          <Icon className={`w-5 h-5 ${currentTheme.icon}`} />
        </div>
      </div>
    </div>
  );
};
