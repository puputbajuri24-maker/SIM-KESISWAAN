import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  ThumbsUp,
  Eye,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Users
} from 'lucide-react';
import { OsimAspiration } from '../../../types';

export interface OsimAspirasiTabProps {
  osimAspirations: OsimAspiration[];
  canManageOsim: boolean;
  onOpenAddAspiration: () => void;
  onOpenDetailAspiration: (aspiration: OsimAspiration, e?: React.MouseEvent) => void;
  onOpenResponseAspiration: (aspiration: OsimAspiration, e: React.MouseEvent) => void;
  onOpenDeleteAspiration: (aspiration: OsimAspiration, e: React.MouseEvent) => void;
  onUpvoteAspiration: (aspiration: OsimAspiration, e: React.MouseEvent) => void;
}

export const OsimAspirasiTab: React.FC<OsimAspirasiTabProps> = ({
  osimAspirations,
  canManageOsim,
  onOpenAddAspiration,
  onOpenDetailAspiration,
  onOpenResponseAspiration,
  onOpenDeleteAspiration,
  onUpvoteAspiration
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filter aspirations based on search, category, and status
  const filteredAspirations = useMemo(() => {
    return osimAspirations.filter(asp => {
      if (filterCategory !== 'all' && asp.category !== filterCategory) {
        return false;
      }
      if (filterStatus !== 'all' && asp.status !== filterStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (asp.title || '').toLowerCase().includes(q);
        const matchContent = (asp.content || '').toLowerCase().includes(q);
        const matchStudent = (asp.studentName || '').toLowerCase().includes(q);
        const matchClass = (asp.studentClass || '').toLowerCase().includes(q);
        const matchResponse = (asp.responseNote || '').toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchStudent && !matchClass && !matchResponse) {
          return false;
        }
      }
      return true;
    });
  }, [osimAspirations, filterCategory, filterStatus, searchQuery]);

  // Aggregate Metrics
  const realizedCount = useMemo(() => {
    return osimAspirations.filter(a => a.status === 'Direalisasikan').length;
  }, [osimAspirations]);

  const inReviewCount = useMemo(() => {
    return osimAspirations.filter(a => a.status === 'Sedang Dibahas').length;
  }, [osimAspirations]);

  const pendingCount = useMemo(() => {
    return osimAspirations.filter(a => a.status === 'Ditampung').length;
  }, [osimAspirations]);

  const totalUpvotes = useMemo(() => {
    return osimAspirations.reduce((sum, a) => sum + (Number(a.upvotes) || 1), 0);
  }, [osimAspirations]);

  const categories = [
    'Kegiatan & Acara',
    'Sarana & Prasarana',
    'Akademik & Literasi',
    'Keagamaan & Karakter',
    'Ketertiban & Disiplin',
    'Umum'
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Direalisasikan':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Direalisasikan
          </span>
        );
      case 'Sedang Dibahas':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            Sedang Dibahas
          </span>
        );
      case 'Ditolak':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Ditolak
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Ditampung
          </span>
        );
    }
  };

  return (
    <div className="space-y-4" id="view-aspirasi-osim">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#121214] border border-zinc-800 p-4 rounded-lg shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold uppercase text-zinc-100 tracking-wider">
                KOTAK SUARA & ASPIRASI SANTRI (OSIM DIGIVOICE)
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Kanal transparan penampungan ide kreatif, usulan sarpras, kritik membangun, dan gagasan kegiatan dari santri untuk OSIM & Madrasah.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAddAspiration}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition shrink-0 shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          Kirim Aspirasi Baru
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono">
        <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded">
          <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Total Aspirasi Masuk</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-zinc-100">{osimAspirations.length}</span>
            <span className="text-[10px] text-amber-400 font-sans">Suara</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded">
          <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Direalisasikan</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-emerald-400">{realizedCount}</span>
            <span className="text-[10px] text-zinc-400 font-sans">Tuntas</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded">
          <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Sedang Dibahas</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-sky-400">{inReviewCount}</span>
            <span className="text-[10px] text-zinc-400 font-sans">Proses</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded">
          <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Ditampung</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-amber-400">{pendingCount}</span>
            <span className="text-[10px] text-zinc-400 font-sans">Antrean</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Total Dukungan</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-purple-400">{totalUpvotes}</span>
            <span className="text-[10px] text-zinc-400 font-sans">Upvotes</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[#121214] border border-zinc-800 p-3 rounded">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Cari aspirasi berdasarkan judul, isi gagasan, pengirim, atau kelas..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Semua Status</option>
            <option value="Ditampung">Ditampung</option>
            <option value="Sedang Dibahas">Sedang Dibahas</option>
            <option value="Direalisasikan">Direalisasikan</option>
            <option value="Ditolak">Ditolak</option>
          </select>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Semua Kategori</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {(searchQuery || filterStatus !== 'all' || filterCategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
                setFilterCategory('all');
              }}
              className="px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-mono transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Aspirations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredAspirations.length > 0 ? (
          filteredAspirations.map(asp => (
            <div
              key={asp.id}
              onClick={() => onOpenDetailAspiration(asp)}
              className="bg-[#121214] border border-zinc-800 rounded-lg p-4 flex flex-col justify-between hover:border-amber-500/40 transition cursor-pointer group shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {asp.category}
                  </span>
                  {getStatusBadge(asp.status)}
                </div>

                <h4 className="font-bold text-sm text-zinc-100 group-hover:text-amber-400 transition">
                  {asp.title}
                </h4>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed line-clamp-3">
                  {asp.content}
                </p>

                <div className="mt-2.5 text-[10px] font-mono text-zinc-500">
                  Oleh: <span className="text-zinc-300">{asp.studentName}</span> ({asp.studentClass}) • {asp.date}
                </div>

                {asp.responseNote && (
                  <div className="mt-3 bg-zinc-900/90 border border-emerald-500/20 rounded p-2.5 text-xs text-emerald-300">
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 block mb-0.5">
                      Tanggapan Resmi ({asp.respondedBy || 'Pengurus'}):
                    </span>
                    <p className="text-zinc-300 text-[11px] leading-snug line-clamp-2">
                      {asp.responseNote}
                    </p>
                  </div>
                )}
              </div>

              <div
                className="mt-3.5 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between"
                onClick={e => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={e => onUpvoteAspiration(asp, e)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-zinc-800 text-xs font-mono transition"
                  title="Berikan dukungan untuk aspirasi ini"
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dukungan ({asp.upvotes || 1})</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={e => onOpenDetailAspiration(asp, e)}
                    className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition"
                    title="Lihat Detail Aspirasi"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {canManageOsim && (
                    <>
                      <button
                        type="button"
                        onClick={e => onOpenResponseAspiration(asp, e)}
                        className="px-2.5 py-1 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 text-xs font-semibold transition"
                      >
                        Beri Respon
                      </button>
                      <button
                        type="button"
                        onClick={e => onOpenDeleteAspiration(asp, e)}
                        className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-rose-400 transition"
                        title="Hapus Aspirasi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-1 md:col-span-2 text-center py-10 border border-dashed border-zinc-800 rounded-lg p-6 bg-[#121214]/50">
            <MessageSquare className="w-9 h-9 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-zinc-300">Tidak ada aspirasi santri yang ditemukan.</p>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-md mx-auto">
              {searchQuery || filterStatus !== 'all' || filterCategory !== 'all'
                ? 'Coba sesuaikan kata kunci pencarian atau bersihkan filter status dan kategori.'
                : 'Sampaikan saran, ide perbaikan sarana, atau usulan kegiatan madrasah melalui tombol di bawah.'}
            </p>
            <button
              type="button"
              onClick={onOpenAddAspiration}
              className="mt-3 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition"
            >
              Kirim Aspirasi Pertama
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
