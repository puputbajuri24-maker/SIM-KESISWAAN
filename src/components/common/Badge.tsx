import React from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  FileEdit,
  ShieldAlert,
  Award,
  Calendar,
  Activity,
  Send
} from 'lucide-react';

export type BadgeVariant =
  | 'Aktif'
  | 'Nonaktif'
  | 'Hadir'
  | 'Izin'
  | 'Sakit'
  | 'Alpa'
  | 'Draft'
  | 'Diajukan'
  | 'Disetujui'
  | 'Revisi'
  | 'Ditolak'
  | 'Berlangsung'
  | 'Selesai'
  | 'Dijadwalkan'
  | 'Dibatalkan'
  | 'Tercatat'
  | 'Dalam Proses'
  | 'Dalam Pembinaan'
  | 'Terbuka'
  | 'Menunggu'
  | 'Ringan'
  | 'Sedang'
  | 'Berat'
  | 'Tinggi'
  | 'Rendah'
  | 'Mendesak'
  | 'Penting'
  | 'Biasa'
  | 'Juara 1'
  | 'Juara 2'
  | 'Juara 3';

interface BadgeProps {
  status: string;
  variant?: BadgeVariant;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, className = '', showIcon = true }) => {
  const s = status.trim();

  let colorClasses = 'bg-slate-100 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-300 border-slate-300 dark:border-zinc-700/60';
  let IconComponent: React.ElementType = Activity;

  // Mapping status to High-Contrast palettes
  if (['Aktif', 'Disetujui', 'Hadir', 'Selesai', 'Juara 1'].includes(s)) {
    colorClasses = 'bg-emerald-100/90 dark:bg-emerald-500/15 text-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30';
    IconComponent = CheckCircle;
  } else if (['Diajukan', 'Menunggu', 'Dalam Proses', 'Dalam Pembinaan', 'Terbuka', 'Sedang', 'Juara 2'].includes(s)) {
    colorClasses = 'bg-amber-100/90 dark:bg-orange-500/15 text-amber-950 dark:text-orange-300 border-amber-300 dark:border-orange-500/30';
    IconComponent = Clock;
  } else if (['Revisi', 'Izin', 'Sakit', 'Dijadwalkan', 'Berlangsung', 'Penting', 'Juara 3'].includes(s)) {
    colorClasses = 'bg-blue-100/90 dark:bg-blue-500/15 text-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-500/30';
    IconComponent = AlertCircle;
  } else if (['Ditolak', 'Alpa', 'Nonaktif', 'Berat', 'Mendesak', 'Dibatalkan'].includes(s)) {
    colorClasses = 'bg-red-100/90 dark:bg-red-500/15 text-red-950 dark:text-red-300 border-red-300 dark:border-red-500/30';
    IconComponent = XCircle;
  } else if (['Draft', 'Tercatat', 'Biasa', 'Rendah', 'Ringan'].includes(s)) {
    colorClasses = 'bg-slate-200/90 dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-300 border-slate-300 dark:border-zinc-700/60';
    IconComponent = FileEdit;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border whitespace-nowrap tracking-tight transition-colors ${colorClasses} ${className}`}
    >
      {showIcon && <IconComponent className="w-3 h-3 shrink-0" />}
      <span>{status}</span>
    </span>
  );
};
