import React, { useState } from 'react';
import {
  Megaphone,
  BellRing,
  Calendar,
  UserCheck,
  ExternalLink,
  Flame,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Compass,
  Search,
  Filter,
  Eye,
  CheckCheck,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSchool } from '../contexts/SchoolContext';
import { AnnouncementManagementPanel } from '../components/announcements/AnnouncementManagementPanel';
import { AnnouncementPopupModal } from '../components/announcements/AnnouncementPopupModal';
import { Announcement } from '../types';

export const AnnouncementsPage: React.FC = () => {
  const { currentUser, isWaka, isSuperAdmin, isGuruBK, isPembina, isPembinaOsim, isPembinaEkskul } = useAuth();
  const { announcements, markAnnouncementAsRead, markAllAnnouncementsAsReadForUser, extracurriculars } = useSchool();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterReadStatus, setFilterReadStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isPopupPreviewOpen, setIsPopupPreviewOpen] = useState(false);
  const [previewList, setPreviewList] = useState<Announcement[]>([]);

  const isManagementAdmin = isSuperAdmin || isWaka;

  // If the user is Super Admin or Waka Kesiswaan, render the full management panel
  if (isManagementAdmin) {
    return <AnnouncementManagementPanel />;
  }

  // Determine user-specific assigned extracurricular IDs if any
  const userEkskulIds = currentUser?.extracurricularIds || [];

  // Filter announcements that apply to this user
  const myAnnouncements = (announcements || []).filter(ann => {
    if (ann.isActive === false) return false;

    // 1. Specific User Target
    if (ann.targetType === 'specific_users' || ann.targetRole === 'Pengguna Spesifik') {
      return (
        ann.targetUserIds?.includes(currentUser?.uid || '') ||
        (currentUser?.displayName && ann.targetUserNames?.includes(currentUser.displayName))
      );
    }

    // 2. Specific BK Target
    if (ann.targetType === 'specific_bk' || ann.targetRole === 'Guru BK Tertentu') {
      if (!isGuruBK) return false;
      return (
        ann.targetUserIds?.includes(currentUser?.uid || '') ||
        (currentUser?.displayName && ann.targetUserNames?.includes(currentUser.displayName))
      );
    }

    // 3. All BK Target
    if (ann.targetType === 'all_bk' || ann.targetRole === 'Guru BK') {
      return isGuruBK;
    }

    // 4. Specific Ekskul Target
    if (ann.targetType === 'specific_ekskul' || ann.targetRole === 'Pembina Ekstra Tertentu') {
      if (!isPembina && !isPembinaEkskul) return false;
      const targetEkskulIds = ann.targetExtracurricularIds || (ann.targetExtracurricularId ? [ann.targetExtracurricularId] : []);
      // Match by assigned ID or coach name
      const matchesEkskul = extracurriculars.some(e => 
        targetEkskulIds.includes(e.id) &&
        (userEkskulIds.includes(e.id) || e.coachName?.toLowerCase() === currentUser?.displayName?.toLowerCase() || !e.coachName)
      );
      return matchesEkskul || (ann.targetUserIds?.includes(currentUser?.uid || ''));
    }

    // 5. All Pembina Target
    if (ann.targetType === 'all_pembina' || ann.targetRole === 'Guru Pembina' || ann.targetRole === 'Pembina') {
      return isPembina || isPembinaOsim || isPembinaEkskul;
    }

    // 6. All users / general broadcast
    if (ann.targetType === 'all' || ann.targetRole === 'Semua') {
      return true;
    }

    return false;
  });

  const isReadByUser = (ann: Announcement) => {
    const uid = currentUser?.uid || 'guest';
    if (ann.readByUsers && ann.readByUsers[uid]) return true;
    try {
      const saved = localStorage.getItem(`sim_read_announcements_${uid}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.includes(ann.id)) return true;
      }
    } catch {}
    return false;
  };

  const filteredList = myAnnouncements.filter(ann => {
    const isRead = isReadByUser(ann);
    if (filterReadStatus === 'unread' && isRead) return false;
    if (filterReadStatus === 'read' && !isRead) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTitle = ann.title?.toLowerCase().includes(q);
      const matchContent = ann.content?.toLowerCase().includes(q);
      const matchAuthor = ann.authorName?.toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchAuthor) return false;
    }
    return true;
  });

  const unreadCount = myAnnouncements.filter(a => !isReadByUser(a)).length;

  const handleMarkAsRead = async (annId: string) => {
    await markAnnouncementAsRead(annId, currentUser?.uid);
    try {
      const uid = currentUser?.uid || 'guest';
      const storageKey = `sim_read_announcements_${uid}`;
      const saved = localStorage.getItem(storageKey);
      const list = saved ? JSON.parse(saved) : [];
      if (!list.includes(annId)) {
        list.push(annId);
        localStorage.setItem(storageKey, JSON.stringify(list));
      }
    } catch {}
  };

  const handleMarkAllAsRead = async () => {
    const allIds = myAnnouncements.map(a => a.id);
    await markAllAnnouncementsAsReadForUser(allIds, currentUser?.uid);
    try {
      const uid = currentUser?.uid || 'guest';
      const storageKey = `sim_read_announcements_${uid}`;
      const saved = localStorage.getItem(storageKey);
      const list = saved ? JSON.parse(saved) : [];
      const merged = Array.from(new Set([...list, ...allIds]));
      localStorage.setItem(storageKey, JSON.stringify(merged));
    } catch {}
  };

  const openPopupModal = (ann?: Announcement) => {
    if (ann) {
      setPreviewList([ann]);
    } else {
      const unreadList = myAnnouncements.filter(a => !isReadByUser(a));
      setPreviewList(unreadList.length > 0 ? unreadList : myAnnouncements.slice(0, 3));
    }
    setIsPopupPreviewOpen(true);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Mendesak':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-bold font-mono animate-pulse">
            <Flame className="w-3 h-3 text-red-400" />
            MENDESAK
          </span>
        );
      case 'Penting':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold font-mono">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            PENTING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold font-mono">
            <Info className="w-3 h-3 text-blue-400" />
            INFORMASI RESMI
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#18181c] via-[#151518] to-[#121215] border border-[#27272a] rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <Megaphone className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                  ARSIP PENGUMUMAN & INSTRUKSI
                </span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
                    {unreadCount} BELUM DIBACA
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-100 mt-1">
                Pusat Pengumuman & Pemberitahuan Resmi
              </h2>
              <p className="text-xs text-zinc-400 max-w-2xl mt-1 leading-relaxed">
                Seluruh arahan resmi, instruksi LPJ, jadwal kegiatan, dan surat edaran dari Pimpinan Kesiswaan tersimpan rapi di sini dan dapat diakses kembali kapan saja.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-xs font-semibold text-emerald-300 transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                <span>Tandai Semua Sudah Dibaca</span>
              </button>
            )}
            <button
              onClick={() => openPopupModal()}
              className="px-3.5 py-2 rounded-xl bg-[#222228] hover:bg-[#2c2c34] border border-[#2e2e36] text-xs font-semibold text-zinc-200 transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <Eye className="w-4 h-4 text-blue-400" />
              <span>Buka Tampilan Popup</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Status Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-[#27272a]/60">
          <div
            onClick={() => setFilterReadStatus('all')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              filterReadStatus === 'all'
                ? 'bg-blue-950/20 border-blue-500/40 text-blue-200'
                : 'bg-[#121215] border-[#222226] text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <div className="text-[10px] font-mono uppercase">Semua Pengumuman</div>
            <div className="text-base font-mono font-bold text-zinc-100 mt-0.5">{myAnnouncements.length}</div>
          </div>

          <div
            onClick={() => setFilterReadStatus('unread')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              filterReadStatus === 'unread'
                ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                : 'bg-[#121215] border-[#222226] text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <div className="text-[10px] font-mono text-amber-400 uppercase">Belum Dibaca</div>
            <div className="text-base font-mono font-bold text-amber-300 mt-0.5">{unreadCount}</div>
          </div>

          <div
            onClick={() => setFilterReadStatus('read')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              filterReadStatus === 'read'
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                : 'bg-[#121215] border-[#222226] text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <div className="text-[10px] font-mono text-emerald-400 uppercase">Sudah Dibaca</div>
            <div className="text-base font-mono font-bold text-emerald-300 mt-0.5">
              {myAnnouncements.length - unreadCount}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-[#141418] border border-[#27272a] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kata kunci instruksi, judul, atau pembuat pengumuman..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-[#18181c] border border-[#2d2d34] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-sans"
          />
        </div>

        <div className="text-xs font-mono text-zinc-400">
          Menampilkan <strong className="text-zinc-200">{filteredList.length}</strong> pengumuman
        </div>
      </div>

      {/* Announcements Stream */}
      <div className="space-y-4">
        {filteredList.length === 0 ? (
          <div className="py-16 text-center bg-[#141418] border border-[#27272a] rounded-2xl p-6">
            <Megaphone className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
            <h3 className="text-sm font-bold text-zinc-300">Tidak Ada Pengumuman</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
              {filterReadStatus === 'unread'
                ? 'Semua pengumuman resmi telah Anda baca.'
                : 'Belum ada pengumuman yang sesuai dengan filter pencarian.'}
            </p>
          </div>
        ) : (
          filteredList.map((ann) => {
            const isRead = isReadByUser(ann);
            const readTimestamp = ann.readByUsers?.[currentUser?.uid || ''];

            return (
              <div
                key={ann.id}
                className={`p-5 rounded-2xl border transition-all ${
                  !isRead
                    ? 'bg-[#18181f] border-blue-500/40 shadow-lg shadow-blue-500/5'
                    : 'bg-[#141418] border-[#25252a] hover:border-zinc-700'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                      {!isRead ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold font-mono animate-pulse">
                          ● BARU / BELUM DIBACA
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> SUDAH DIBACA
                        </span>
                      )}
                      {getPriorityBadge(ann.priority)}
                      <span className="px-2 py-0.5 rounded-md bg-[#222228] text-zinc-300 border border-[#2d2d34] text-[10px] font-mono">
                        Target: {ann.targetRole}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-zinc-100 tracking-tight leading-snug">
                      {ann.title}
                    </h3>

                    {/* Content */}
                    <div className="text-xs text-zinc-200 mt-2.5 font-sans leading-relaxed whitespace-pre-line bg-[#101013] p-3.5 rounded-xl border border-[#202025]">
                      {ann.content}
                    </div>

                    {/* Attachment Link if any */}
                    {ann.attachmentUrl && (
                      <div className="mt-3 inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-blue-950/30 border border-blue-500/30 text-xs text-blue-300">
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span className="font-medium">{ann.attachmentName || 'Berkas Lampiran'}</span>
                        <a
                          href={ann.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline font-bold flex items-center space-x-0.5 ml-2"
                        >
                          <span>Buka</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-[11px] font-mono text-zinc-400">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Tanggal: <strong>{ann.publishDate}</strong></span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                        <span>Oleh: <strong className="text-zinc-300">{ann.authorName}</strong> ({ann.authorRole})</span>
                      </div>
                      {readTimestamp && (
                        <div className="flex items-center space-x-1.5 text-emerald-400/80">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Dibaca pada: {readTimestamp.split('T')[0]}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0 self-end md:self-start pt-1">
                    <button
                      onClick={() => openPopupModal(ann)}
                      className="px-3 py-2 rounded-xl bg-[#202026] hover:bg-[#282830] text-zinc-300 hover:text-blue-400 border border-[#2c2c36] text-xs font-semibold transition-colors flex items-center space-x-1.5"
                      title="Buka tampilan popup"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat Detail</span>
                    </button>
                    {!isRead && (
                      <button
                        onClick={() => handleMarkAsRead(ann.id)}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center space-x-1.5"
                        title="Tandai telah dibaca agar popup tidak muncul lagi"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tandai Sudah Dibaca</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Popup Preview Modal */}
      {isPopupPreviewOpen && (
        <AnnouncementPopupModal
          announcements={previewList}
          isOpen={isPopupPreviewOpen}
          onClose={() => setIsPopupPreviewOpen(false)}
          onMarkAsRead={(id) => {
            handleMarkAsRead(id);
          }}
          onMarkAllAsRead={() => {
            handleMarkAllAsRead();
            setIsPopupPreviewOpen(false);
          }}
        />
      )}
    </div>
  );
};
