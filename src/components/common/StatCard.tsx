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
      bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400',
      icon: 'text-blue-600 dark:text-blue-400',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400',
      icon: 'text-emerald-600 dark:text-emerald-400',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400',
      icon: 'text-amber-600 dark:text-amber-400',
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-red-500/10 border-rose-200 dark:border-red-500/20 text-rose-700 dark:text-red-400',
      icon: 'text-rose-600 dark:text-red-400',
    },
    sky: {
      bg: 'bg-sky-50 dark:bg-cyan-500/10 border-sky-200 dark:border-cyan-500/20 text-sky-700 dark:text-cyan-400',
      icon: 'text-sky-600 dark:text-cyan-400',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-400',
      icon: 'text-purple-600 dark:text-purple-400',
    },
    slate: {
      bg: 'bg-slate-100 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20 text-slate-700 dark:text-slate-400',
      icon: 'text-slate-600 dark:text-slate-400',
    }
  };

  const currentTheme = colorMap[colorTheme] || colorMap.indigo;

  return (
    <div
      id={id}
      onClick={onClick}
      className={`relative p-4 bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1e293b] rounded-2xl transition-all shadow-xs ${
        onClick ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/80 dark:hover:bg-[#162035]' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-2">
          <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide truncate">
            {title.replace(/_/g, ' ')}
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
            {value}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded-md font-bold ${
                  trend.isPositive
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
            </div>
          )}
        </div>

        <div className={`p-3 rounded-xl border ${currentTheme.bg} shrink-0 shadow-xs`}>
          <Icon className={`w-5 h-5 ${currentTheme.icon}`} />
        </div>
      </div>
    </div>
  );
};
