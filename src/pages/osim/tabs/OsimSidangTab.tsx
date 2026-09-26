import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  Users,
  Printer,
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import { OsimMeeting } from '../../../types';

export interface OsimSidangTabProps {
  osimMeetings: OsimMeeting[];
  canManageOsim: boolean;
  onOpenAddMeeting: () => void;
  onOpenDetailMeeting: (meeting: OsimMeeting, e?: React.MouseEvent) => void;
  onOpenEditMeeting: (meeting: OsimMeeting, e: React.MouseEvent) => void;
  onDeleteMeeting: (meeting: OsimMeeting) => void;
  onPrintMeeting?: (meeting: OsimMeeting) => void;
}

export const OsimSidangTab: React.FC<OsimSidangTabProps> = ({
  osimMeetings,
  canManageOsim,
  onOpenAddMeeting,
  onOpenDetailMeeting,
  onOpenEditMeeting,
  onDeleteMeeting,
  onPrintMeeting
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Filter meetings based on search query and type filter
  const filteredMeetings = useMemo(() => {
    return osimMeetings.filter(meet => {
      if (filterType !== 'all' && meet.type !== filterType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (meet.title || '').toLowerCase().includes(q);
        const matchAgenda = (meet.agenda || '').toLowerCase().includes(q);
        const matchDecisions = (meet.decisionNotes || '').toLowerCase().includes(q);
        const matchLeader = (meet.leader || '').toLowerCase().includes(q);
        const matchSecretary = (meet.secretary || '').toLowerCase().includes(q);
        const matchLocation = (meet.location || '').toLowerCase().includes(q);
        if (!matchTitle && !matchAgenda && !matchDecisions && !matchLeader && !matchSecretary && !matchLocation) {
          return false;
        }
      }
      return true;
    });
  }, [osimMeetings, filterType, searchQuery]);

  // Aggregate statistics
  const totalAttendees = useMemo(() => {
    return osimMeetings.reduce((sum, m) => sum + (Number(m.attendeesCount) || 0), 0);
  }, [osimMeetings]);

  const meetingTypes = [
    'Rapat Pleno Pengurus',
    'Rapat Koordinasi BPH',
    'Rapat Seksi Bidang',
    'Musyawarah Kerja (MUKER)',
    'Rapat Evaluasi & LPJ'
  ];

  return (
    <div className="space-y-4" id="view-sidang-osim">
      {/* Header & Controls Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#121214] border border-zinc-800 p-4 rounded-lg shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold uppercase text-zinc-100 tracking-wider">
                ARSIP SIDANG PLENO & NOTULENSI RAPAT OSIM
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Dokumentasi Berita Acara, Keputusan Mufakat MUKER, dan Pengesahan Program Kerja Kesiswaan.
              </p>
            </div>
          </div>
        </div>

        {canManageOsim && (
          <button
            type="button"
            onClick={onOpenAddMeeting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition shrink-0 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Catat Notulensi Baru
          </button>
        )}
      </div>

      {/* Quick Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
        <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded">
          <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Total Sidang & Rapat</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-zinc-100">{osimMeetings.length}</span>
            <span className="text-[10px] text-amber-400 font-sans">Tercatat</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded">
          <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Total Kehadiran</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-indigo-400">{totalAttendees}</span>
            <span className="text-[10px] text-zinc-400 font-sans">Peserta</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded">
          <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Rapat Terfilter</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-emerald-400">{filteredMeetings.length}</span>
            <span className="text-[10px] text-zinc-400 font-sans">Ditampilkan</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded">
          <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Musyawarah Kerja</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-purple-400">
              {osimMeetings.filter(m => m.type.toLowerCase().includes('muker') || m.type.toLowerCase().includes('musyawarah')).length}
            </span>
            <span className="text-[10px] text-zinc-400 font-sans">MUKER</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[#121214] border border-zinc-800 p-3 rounded">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Cari notulensi berdasarkan judul, agenda, pimpinan, atau notulis..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Semua Tipe Rapat & Sidang</option>
            {meetingTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {(searchQuery || filterType !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
              }}
              className="px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-mono transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Meetings List */}
      <div className="space-y-3">
        {filteredMeetings.length > 0 ? (
          filteredMeetings.map(meet => (
            <div
              key={meet.id}
              onClick={() => onOpenDetailMeeting(meet)}
              className="bg-[#121214] border border-zinc-800 rounded-lg p-4 hover:border-amber-500/40 transition cursor-pointer group shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {meet.type}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      {meet.date}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      {meet.startTime} - {meet.endTime} WIB
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-zinc-100 group-hover:text-amber-400 mt-1.5 transition">
                    {meet.title}
                  </h3>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-zinc-500" />
                    {meet.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-zinc-500" />
                    {meet.attendeesCount} Peserta
                  </span>

                  <div className="flex items-center gap-1 ml-2" onClick={e => e.stopPropagation()}>
                    {onPrintMeeting && (
                      <button
                        type="button"
                        onClick={() => onPrintMeeting(meet)}
                        className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-emerald-400 transition"
                        title="Cetak Berita Acara Rapat"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={e => onOpenDetailMeeting(meet, e)}
                      className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition"
                      title="Lihat Detail Notulensi"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {canManageOsim && (
                      <>
                        <button
                          type="button"
                          onClick={e => onOpenEditMeeting(meet, e)}
                          className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-amber-400 transition"
                          title="Edit Notulensi"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            onDeleteMeeting(meet);
                          }}
                          className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-rose-400 transition"
                          title="Hapus Notulensi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Officers & Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs text-zinc-400">
                <div className="bg-zinc-900/60 rounded p-2 border border-zinc-850">
                  <span className="text-[10px] font-mono text-zinc-500 block">Pimpinan Rapat:</span>
                  <span className="text-zinc-200 font-semibold">{meet.leader}</span>
                </div>
                <div className="bg-zinc-900/60 rounded p-2 border border-zinc-850">
                  <span className="text-[10px] font-mono text-zinc-500 block">Notulis / Pencatat:</span>
                  <span className="text-zinc-200 font-semibold">{meet.secretary}</span>
                </div>
              </div>

              {/* Agenda Preview */}
              <div className="mt-2 text-xs text-zinc-300">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-0.5">Agenda Pembahasan:</span>
                <p className="line-clamp-2 text-zinc-400 leading-relaxed text-[11px]">{meet.agenda}</p>
              </div>

              {/* Decision Notes Preview */}
              {meet.decisionNotes && (
                <div className="mt-2.5 bg-zinc-900/80 border border-emerald-500/20 rounded p-2 text-xs text-emerald-300">
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 block mb-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Keputusan / Mufakat Rapat:
                  </span>
                  <p className="line-clamp-2 text-zinc-300 text-[11px] leading-relaxed">{meet.decisionNotes}</p>
                </div>
              )}

              {/* Waka / Pembina Notes Preview */}
              {meet.wakaNotes && (
                <div className="mt-2 bg-amber-500/10 border border-amber-500/20 rounded p-2 text-xs text-amber-300">
                  <span className="text-[10px] font-mono font-bold uppercase text-amber-400 block mb-0.5">
                    Catatan Pembina / Waka Kesiswaan:
                  </span>
                  <p className="line-clamp-1 text-zinc-300 text-[11px] italic">{meet.wakaNotes}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-10 border border-dashed border-zinc-800 rounded-lg p-6 bg-[#121214]/50">
            <FileSpreadsheet className="w-9 h-9 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-zinc-300">Tidak ada notulensi sidang yang ditemukan.</p>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-md mx-auto">
              {searchQuery || filterType !== 'all'
                ? 'Coba ubah kata kunci pencarian atau bersihkan filter tipe rapat.'
                : 'Mulai dokumentasikan sidang pleno, koordinasi sekbid, atau rapat MUKER madrasah.'}
            </p>
            {canManageOsim && (
              <button
                type="button"
                onClick={onOpenAddMeeting}
                className="mt-3 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition"
              >
                Catat Notulensi Pertama
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
