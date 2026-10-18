import React, { useState, useMemo } from 'react';
import {
  FileText,
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
  CheckCircle2,
  Bookmark,
  FileCheck2,
  UserCheck,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { OsimMeeting } from '../../../types';

export interface OsimNotulenTabProps {
  osimMeetings: OsimMeeting[];
  isSekretarisOsim: boolean;
  canManageOsim: boolean;
  currentUserName?: string;
  onOpenAddMeeting: () => void;
  onOpenDetailMeeting: (meeting: OsimMeeting, e?: React.MouseEvent) => void;
  onOpenEditMeeting: (meeting: OsimMeeting, e: React.MouseEvent) => void;
  onDeleteMeeting: (meeting: OsimMeeting) => void;
  onPrintMeeting?: (meeting: OsimMeeting) => void;
}

export const OsimNotulenTab: React.FC<OsimNotulenTabProps> = ({
  osimMeetings,
  isSekretarisOsim,
  canManageOsim,
  currentUserName,
  onOpenAddMeeting,
  onOpenDetailMeeting,
  onOpenEditMeeting,
  onDeleteMeeting,
  onPrintMeeting
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const canEditNotulen = isSekretarisOsim || canManageOsim;

  // Filter notulen meetings based on search query, meeting type, and status
  const filteredNotulen = useMemo(() => {
    return osimMeetings.filter(meet => {
      if (filterType !== 'all' && meet.type !== filterType) {
        return false;
      }
      if (filterStatus !== 'all' && (meet.status || 'Draft') !== filterStatus) {
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
        const matchNumber = (meet.meetingNumber || '').toLowerCase().includes(q);
        if (!matchTitle && !matchAgenda && !matchDecisions && !matchLeader && !matchSecretary && !matchLocation && !matchNumber) {
          return false;
        }
      }
      return true;
    });
  }, [osimMeetings, filterType, filterStatus, searchQuery]);

  // Aggregate statistics
  const stats = useMemo(() => {
    const total = osimMeetings.length;
    const verified = osimMeetings.filter(m => m.status === 'Disahkan Pembina').length;
    const draft = osimMeetings.filter(m => !m.status || m.status === 'Draft' || m.status === 'Diajukan').length;
    const totalAttendees = osimMeetings.reduce((sum, m) => sum + (Number(m.attendeesCount) || 0), 0);
    return { total, verified, draft, totalAttendees };
  }, [osimMeetings]);

  const meetingTypes = [
    'Rapat Pleno Pengurus',
    'Rapat BPH',
    'Rapat Koordinasi Pembina',
    'Sidang Musyawarah Kerja (MUKER)',
    'Rapat Evaluasi Bulanan',
    'Rapat Koordinasi Sekbid',
    'Rapat Luar Biasa'
  ];

  return (
    <div className="space-y-4" id="view-notulen-osim">
      {/* Sekretaris Header & Summary Banner */}
      <div className="bg-linear-to-r from-sky-950/40 via-zinc-900 to-zinc-900 border border-sky-800/40 p-4 rounded-xl shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-zinc-100 tracking-wide">
                  NOTULENSI RAPAT & BERITA ACARA OSIM
                </h3>
                {isSekretarisOsim && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                    <Sparkles className="w-3 h-3 text-sky-400" />
                    NOTULIS RESMI (SEKRETARIS)
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Pencatatan resmi agenda musyawarah, risalah pembahasan sidang pleno, daftar kehadiran pengurus, serta keputusan mufakat organisasi.
              </p>
              {isSekretarisOsim && currentUserName && (
                <p className="text-[11px] text-sky-400/90 mt-1 flex items-center gap-1 font-medium">
                  <UserCheck className="w-3 h-3" />
                  Anda bertindak sebagai Sekretaris OSIM ({currentUserName}). Notulensi yang dicatat akan tersimpan permanen dan dapat dicetak resmi.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canEditNotulen && (
              <button
                type="button"
                onClick={onOpenAddMeeting}
                className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-xs transition"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Catat Notulen Rapat Baru
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-zinc-800/80">
          <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-lg">
            <span className="text-[11px] text-zinc-400 block">Total Notulensi</span>
            <span className="text-lg font-bold font-mono text-zinc-100">{stats.total}</span>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-lg">
            <span className="text-[11px] text-zinc-400 block">Disahkan Pembina</span>
            <span className="text-lg font-bold font-mono text-emerald-400">{stats.verified}</span>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-lg">
            <span className="text-[11px] text-zinc-400 block">Draft / Dalam Proses</span>
            <span className="text-lg font-bold font-mono text-amber-400">{stats.draft}</span>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-lg">
            <span className="text-[11px] text-zinc-400 block">Total Kehadiran Pengurus</span>
            <span className="text-lg font-bold font-mono text-sky-400">{stats.totalAttendees} <span className="text-xs text-zinc-500 font-normal">orang</span></span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between bg-zinc-900/90 border border-zinc-800 p-2.5 rounded-lg">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari notulen berdasarkan judul rapat, agenda, keputusan, atau notulis..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-700/80 rounded-md text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-700/80 rounded-md text-xs text-zinc-200 focus:outline-none focus:border-sky-500"
          >
            <option value="all">Semua Jenis Rapat</option>
            {meetingTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-700/80 rounded-md text-xs text-zinc-200 focus:outline-none focus:border-sky-500"
          >
            <option value="all">Semua Status</option>
            <option value="Draft">Draft Notulen</option>
            <option value="Diajukan">Diajukan ke Pembina</option>
            <option value="Disahkan Pembina">Disahkan Pembina</option>
          </select>
        </div>
      </div>

      {/* Notulen List */}
      {filteredNotulen.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-8 text-center">
          <FileText className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-zinc-300">Belum Ada Notulensi Rapat</h4>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            {searchQuery || filterType !== 'all' || filterStatus !== 'all'
              ? 'Tidak ditemukan notulensi yang cocok dengan filter pencarian Anda.'
              : isSekretarisOsim
              ? 'Sebagai Sekretaris OSIM, Anda dapat mulai mencatat notulen rapat perdana dengan klik tombol "Catat Notulen Rapat Baru".'
              : 'Belum ada data notulensi rapat yang tersimpan dalam sistem.'}
          </p>
          {canEditNotulen && (
            <button
              type="button"
              onClick={onOpenAddMeeting}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30 text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Mulai Catat Notulen Baru
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredNotulen.map((m) => {
            const isVerified = m.status === 'Disahkan Pembina';
            return (
              <div
                key={m.id}
                className="bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700/90 rounded-xl p-4 flex flex-col justify-between transition group shadow-xs"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-sky-400 border border-zinc-700">
                      {m.type || 'Rapat OSIM'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                        isVerified
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {isVerified ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          DISAHKAN PEMBINA
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          DRAFT / NOTULEN
                        </>
                      )}
                    </span>
                  </div>

                  {/* Title */}
                  <h4
                    onClick={() => onOpenDetailMeeting(m)}
                    className="text-sm font-bold text-zinc-100 hover:text-sky-400 cursor-pointer transition line-clamp-2"
                  >
                    {m.title}
                  </h4>

                  {/* Meta info (Date, Time, Location) */}
                  <div className="grid grid-cols-2 gap-y-1 gap-x-2 mt-2.5 text-[11px] text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span>{m.date || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span>{m.startTime || '15:30'} - {m.endTime || 'Selesai'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate">{m.location || 'Ruang Rapat OSIM'}</span>
                    </div>
                  </div>

                  {/* Roles: Leader & Secretary */}
                  <div className="mt-3 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="text-zinc-500 text-[10px] block">Pemimpin Rapat:</span>
                      <span className="font-semibold text-zinc-200">{m.leader || 'Ketua Umum OSIM'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-500 text-[10px] block">Notulis (Sekretaris):</span>
                      <span className="font-semibold text-sky-400">{m.secretary || 'Sekretaris OSIM'}</span>
                    </div>
                  </div>

                  {/* Agenda snippet */}
                  {m.agenda && (
                    <div className="mt-2.5">
                      <span className="text-[10px] uppercase font-mono font-bold text-zinc-500">Agenda:</span>
                      <p className="text-xs text-zinc-300 line-clamp-2 mt-0.5">{m.agenda}</p>
                    </div>
                  )}

                  {/* Keputusan / Notulen snippet */}
                  {m.decisionNotes && (
                    <div className="mt-2 p-2 rounded-md bg-sky-950/20 border border-sky-900/30">
                      <span className="text-[10px] uppercase font-mono font-bold text-sky-400 flex items-center gap-1">
                        <FileCheck2 className="w-3 h-3" />
                        Keputusan / Notulensi:
                      </span>
                      <p className="text-xs text-zinc-300 line-clamp-2 mt-0.5">{m.decisionNotes}</p>
                    </div>
                  )}
                </div>

                {/* Bottom Actions Bar */}
                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                    <Users className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{m.attendeesCount || 0} Hadir</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenDetailMeeting(m)}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1 transition"
                      title="Lihat Notulen Lengkap"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Detail
                    </button>

                    {onPrintMeeting && (
                      <button
                        type="button"
                        onClick={() => onPrintMeeting(m)}
                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-sky-300 text-xs font-medium flex items-center gap-1 transition"
                        title="Cetak Berita Acara Notulensi Resmi"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Cetak
                      </button>
                    )}

                    {canEditNotulen && (
                      <button
                        type="button"
                        onClick={(e) => onOpenEditMeeting(m, e)}
                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-medium flex items-center gap-1 transition"
                        title="Edit Notulensi Rapat"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    )}

                    {canManageOsim && (
                      <button
                        type="button"
                        onClick={() => onDeleteMeeting(m)}
                        className="p-1 rounded hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition"
                        title="Hapus Notulen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
