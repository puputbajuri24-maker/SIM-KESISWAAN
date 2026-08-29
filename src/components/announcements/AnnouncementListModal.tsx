import React, { useState } from 'react';
import {
  Megaphone,
  Search,
  Filter,
  Flame,
  AlertTriangle,
  Info,
  Calendar,
  UserCheck,
  CheckCircle2,
  ExternalLink,
  X,
  Pin,
  Clock,
  Eye
} from 'lucide-react';
import { Announcement } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface AnnouncementListModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcements: Announcement[];
  readAnnouncementIds: string[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export const AnnouncementListModal: React.FC<AnnouncementListModalProps> = ({
  isOpen,
  onClose,
  announcements,
  readAnnouncementIds,
  onMarkAsRead,
  onMarkAllAsRead
}) => {
  const { currentUser, userRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  if (!isOpen) return null;

  // Filter announcements for current role
  const isRelevantForUser = (ann: Announcement) => {
    if (ann.isActive === false) return false;
    const target = (ann.targetRole || '').toLowerCase();
    if (target.includes('semua')) return true;

    if (userRole === 'pembina' || userRole === 'pembina_osim' || userRole === 'pembina_ekskul') {
      return target.includes('pembina') || target.includes('osim') || target.includes('ekskul');
    }
    if (userRole === 'guru_bk') {
      return target.includes('bk') || target.includes('konseling');
    }
    if (userRole === 'super_admin' || userRole === 'waka_kesiswaan') {
      return true;
    }
    return true;
  };

  const filtered = announcements.filter(ann => {
    if (!isRelevantForUser(ann)) return false;
    if (selectedPriority !== 'all' && ann.priority !== selectedPriority) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTitle = ann.title?.toLowerCase().includes(q);
      const matchContent = ann.content?.toLowerCase().includes(q);
      const matchAuthor = ann.authorName?.toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchAuthor) return false;
    }
    return true;
  });

  const unreadCount = filtered.filter(a => !readAnnouncementIds.includes(a.id)).length;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Mendesak':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold font-mono animate-pulse">
            <Flame className="w-3 h-3 text-red-400" />
            MENDESAK
          </span>
        );
      case 'Penting':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold font-mono">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            PENTING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold font-mono">
            <Info className="w-3 h-3 text-blue-400" />
            INFO
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#111114] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden font-sans my-6 flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#27272a] bg-[#16161a] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold text-zinc-100">
                  Pusat Pengumuman & Pemberitahuan
                </h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
                    {unreadCount} Belum Dibaca
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400">
                Informasi dan arahan resmi dari Pimpinan Kesiswaan & Administrator Sekolah.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-[#27272a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-3 sm:p-4 border-b border-[#27272a] bg-[#141418] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari judul atau isi pengumuman..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#1a1a1f] border border-[#2d2d34] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#1a1a1f] border border-[#2d2d34] text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">Semua Prioritas</option>
              <option value="Mendesak">Mendesak</option>
              <option value="Penting">Penting</option>
              <option value="Biasa">Biasa</option>
            </select>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="px-3 py-1.5 rounded-lg bg-[#222228] hover:bg-[#2c2c34] border border-[#2e2e36] text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Tandai Semua Telah Dibaca</span>
            </button>
          )}
        </div>

        {/* Content Area: Split View or List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 font-mono text-xs">
              <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-30 text-zinc-400" />
              <p>Tidak ada pengumuman yang sesuai kriteria pencarian.</p>
            </div>
          ) : (
            filtered.map((ann) => {
              const isRead = readAnnouncementIds.includes(ann.id);
              const isSelected = selectedAnnouncement?.id === ann.id;

              return (
                <div
                  key={ann.id}
                  className={`p-4 rounded-xl border transition-all ${
                    !isRead
                      ? 'bg-blue-950/20 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.08)]'
                      : 'bg-[#18181c] border-[#27272a] hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        {ann.isPinned && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold">
                            <Pin className="w-3 h-3" /> PINNED
                          </span>
                        )}
                        {getPriorityBadge(ann.priority)}
                        <span className="px-2 py-0.5 rounded bg-[#202026] text-zinc-400 border border-[#2b2b34] text-[10px] font-mono">
                          Target: {ann.targetRole}
                        </span>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-zinc-100 leading-snug">
                        {ann.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] font-mono text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          {ann.publishDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-zinc-500" />
                          {ann.authorName} ({ann.authorRole || 'Kesiswaan'})
                        </span>
                      </div>

                      <div className="mt-2.5 text-xs text-zinc-300 font-sans leading-relaxed whitespace-pre-line bg-[#131316] p-3 rounded-lg border border-[#222228]">
                        {ann.content}
                      </div>

                      {ann.attachmentUrl && (
                        <div className="mt-2.5">
                          <a
                            href={ann.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 hover:bg-blue-500/25 text-xs font-semibold transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>{ann.attachmentName || 'Buka Lampiran Tautan'}</span>
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 pt-1">
                      {!isRead ? (
                        <button
                          onClick={() => onMarkAsRead(ann.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-colors flex items-center space-x-1"
                          title="Tandai Telah Dibaca"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Tandai Dibaca</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-zinc-500 px-2 py-1 bg-[#131316] rounded border border-[#222226]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Sudah Dibaca</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#27272a] bg-[#16161a] flex items-center justify-between shrink-0">
          <span className="text-xs text-zinc-400 font-mono">
            Total {filtered.length} pengumuman terdaftar
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
