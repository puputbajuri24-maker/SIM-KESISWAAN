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

  let colorClasses = 'bg-zinc-800/60 text-zinc-300 border-zinc-700/60';
  let IconComponent: React.ElementType = Activity;

  // Mapping status to High-Density terminal palettes
  if (['Aktif', 'Disetujui', 'Hadir', 'Selesai', 'Juara 1'].includes(s)) {
    colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    IconComponent = CheckCircle;
  } else if (['Diajukan', 'Menunggu', 'Dalam Proses', 'Dalam Pembinaan', 'Terbuka', 'Sedang', 'Juara 2'].includes(s)) {
    colorClasses = 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    IconComponent = Clock;
  } else if (['Revisi', 'Izin', 'Sakit', 'Dijadwalkan', 'Berlangsung', 'Penting', 'Juara 3'].includes(s)) {
    colorClasses = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    IconComponent = AlertCircle;
  } else if (['Ditolak', 'Alpa', 'Nonaktif', 'Berat', 'Mendesak', 'Dibatalkan'].includes(s)) {
    colorClasses = 'bg-red-500/10 text-red-400 border-red-500/30';
    IconComponent = XCircle;
  } else if (['Draft', 'Tercatat', 'Biasa', 'Rendah', 'Ringan'].includes(s)) {
    colorClasses = 'bg-zinc-800/80 text-zinc-400 border-zinc-700/50';
    IconComponent = FileEdit;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border whitespace-nowrap tracking-tight transition-colors ${colorClasses} ${className}`}
    >
      {showIcon && <IconComponent className="w-3 h-3 shrink-0" />}
      <span>{status}</span>
    </span>
  );
};
