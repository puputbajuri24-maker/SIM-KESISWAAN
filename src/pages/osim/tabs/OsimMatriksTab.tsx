import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { OsimWorkProgram } from '../../../types';

export interface OsimMatriksTabProps {
  osimPrograms: OsimWorkProgram[];
  activeAcademicYear: string;
  getStatusBadge: (status: any) => React.ReactNode;
  onOpenDetailProker?: (proker: OsimWorkProgram) => void;
}

export const OsimMatriksTab: React.FC<OsimMatriksTabProps> = ({
  osimPrograms,
  activeAcademicYear,
  getStatusBadge,
  onOpenDetailProker
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSekbid, setFilterSekbid] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Extract unique sekbids
  const uniqueSekbids = useMemo(() => {
    const set = new Set<string>();
    osimPrograms.forEach(p => {
      if (p.sekbid) set.add(p.sekbid);
    });
    return Array.from(set).sort();
  }, [osimPrograms]);

  // Filter programs based on search, sekbid, and status
  const filteredPrograms = useMemo(() => {
    return osimPrograms.filter(p => {
      if (filterSekbid !== 'all' && p.sekbid !== filterSekbid) {
        return false;
      }
      if (filterStatus !== 'all' && p.status !== filterStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (p.title || '').toLowerCase().includes(q);
        const matchPj = (p.personInCharge || '').toLowerCase().includes(q);
        const matchSekbid = (p.sekbid || '').toLowerCase().includes(q);
        if (!matchTitle && !matchPj && !matchSekbid) {
          return false;
        }
      }
      return true;
    });
  }, [osimPrograms, filterSekbid, filterStatus, searchQuery]);

  // Financial and KPI calculations
  const totalRAB = useMemo(() => {
    return filteredPrograms.reduce((acc, p) => acc + (Number(p.budgetEstimated) || 0), 0);
  }, [filteredPrograms]);

  const totalRealisasi = useMemo(() => {
    return filteredPrograms.reduce((acc, p) => acc + (Number(p.budgetRealized) || 0), 0);
  }, [filteredPrograms]);

  const avgProgress = useMemo(() => {
    if (filteredPrograms.length === 0) return 0;
    const totalProg = filteredPrograms.reduce((acc, p) => acc + (Number(p.progressPercentage) || 0), 0);
    return Math.round(totalProg / filteredPrograms.length);
  }, [filteredPrograms]);

  const completedProgramsCount = useMemo(() => {
    return filteredPrograms.filter(p => p.status === 'Selesai & Sah' || p.status === 'Selesai').length;
  }, [filteredPrograms]);

  return (
    <div className="space-y-4" id="view-matriks-osim">
      {/* Header Banner */}
      <div className="bg-[#121214] border border-zinc-800 p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold uppercase text-zinc-100 tracking-wider">
              MATRIKS ALOKASI ANGGARAN & STATUS PELAKSANAAN PROKER
            </h3>
            <p className="text-[11px] text-zinc-400">
              Evaluasi ketercapaian target indikator kinerja 8 Seksi Bidang OSIM Tahun Ajaran {activeAcademicYear}.
            </p>
          </div>
        </div>

        {/* Quick KPI Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4 pt-3 border-t border-zinc-800/80 font-mono">
          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded">
            <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Program Terdata</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold text-zinc-100">{filteredPrograms.length}</span>
              <span className="text-[10px] text-amber-400 font-sans">{completedProgramsCount} Selesai</span>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded">
            <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Alokasi RAB</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xs sm:text-sm font-bold text-amber-400 truncate">
                Rp {totalRAB.toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] text-zinc-400">Rencana</span>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded">
            <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Realisasi Kas</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xs sm:text-sm font-bold text-zinc-200 truncate">
                Rp {totalRealisasi.toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] text-emerald-400">Terpakai</span>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded">
            <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Efisiensi / Sisa</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className={`text-xs sm:text-sm font-bold truncate ${totalRAB >= totalRealisasi ? 'text-emerald-400' : 'text-rose-400'}`}>
                Rp {(totalRAB - totalRealisasi).toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] text-zinc-400 font-sans">
                {totalRAB >= totalRealisasi ? 'Hemat' : 'Over'}
              </span>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Rata-rata Progres</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold text-indigo-400">{avgProgress}%</span>
              <span className="text-[10px] text-zinc-400 font-sans">Target Tercapai</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[#121214] border border-zinc-800 p-3 rounded">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Cari program kerja atau penanggung jawab..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterSekbid}
            onChange={e => setFilterSekbid(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Semua Bidang & BPH</option>
            {uniqueSekbids.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Semua Status Proker</option>
            <option value="Draft">Draft</option>
            <option value="Diajukan">Diajukan</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Dalam Pelaksanaan">Dalam Pelaksanaan</option>
            <option value="Menunggu Verifikasi LPJ">Menunggu LPJ</option>
            <option value="Selesai & Sah">Selesai & Sah</option>
            <option value="Revisi">Revisi</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>

          {(searchQuery || filterSekbid !== 'all' || filterStatus !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterSekbid('all');
                setFilterStatus('all');
              }}
              className="px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-mono transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Matriks Table */}
      <div className="bg-[#121214] border border-zinc-800 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/70">
                <th className="p-3">No</th>
                <th className="p-3">Seksi Bidang</th>
                <th className="p-3">Program Kerja</th>
                <th className="p-3">PJ Pelaksana</th>
                <th className="p-3 text-right">Estimasi Biaya</th>
                <th className="p-3 text-right">Realisasi Kas</th>
                <th className="p-3 text-center">Progres</th>
                <th className="p-3">Status</th>
                {onOpenDetailProker && <th className="p-3 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {filteredPrograms.length > 0 ? (
                filteredPrograms.map((p, idx) => (
                  <tr
                    key={p.id}
                    onClick={() => onOpenDetailProker && onOpenDetailProker(p)}
                    className="hover:bg-zinc-900/50 transition cursor-pointer group"
                  >
                    <td className="p-3 font-mono text-zinc-500">{idx + 1}</td>
                    <td className="p-3 text-[11px] font-mono text-zinc-400">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {p.sekbid.split(':')[0]}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-zinc-200 group-hover:text-amber-400 transition">
                      {p.title}
                    </td>
                    <td className="p-3 text-xs text-zinc-400">{p.personInCharge}</td>
                    <td className="p-3 text-xs font-mono text-amber-400 font-semibold text-right">
                      Rp {(p.budgetEstimated || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-xs font-mono text-zinc-300 text-right">
                      Rp {(p.budgetRealized || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-xs font-mono text-emerald-400 font-bold mb-1">
                          {p.progressPercentage || 0}%
                        </span>
                        <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(100, p.progressPercentage || 0)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{getStatusBadge(p.status)}</td>
                    {onOpenDetailProker && (
                      <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onOpenDetailProker(p)}
                          className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-cyan-400 transition"
                          title="Lihat Detail Program Kerja"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={onOpenDetailProker ? 9 : 8} className="p-8 text-center text-zinc-500">
                    Tidak ada program kerja yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
