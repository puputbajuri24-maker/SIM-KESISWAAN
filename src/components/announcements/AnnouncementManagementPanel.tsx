import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Flame,
  AlertTriangle,
  Info,
  Calendar,
  UserCheck,
  Edit2,
  Trash2,
  Pin,
  CheckCircle2,
  XCircle,
  Eye,
  ExternalLink,
  Users,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Layers,
  Bell
} from 'lucide-react';
import { Announcement } from '../../types';
import { useSchool } from '../../contexts/SchoolContext';
import { useAuth } from '../../contexts/AuthContext';
import { AnnouncementModal } from './AnnouncementModal';
import { AnnouncementPopupModal } from './AnnouncementPopupModal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const AnnouncementManagementPanel: React.FC = () => {
  const {
    announcements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    toggleAnnouncementPin,
    toggleAnnouncementStatus
  } = useSchool();
  const { currentUser, isSuperAdmin, isWaka } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [targetFilter, setTargetFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPreviewPopupOpen, setIsPreviewPopupOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [previewList, setPreviewList] = useState<Announcement[]>([]);

  // Statistics
  const totalCount = announcements.length;
  const activeCount = announcements.filter(a => a.isActive !== false).length;
  const pembinaCount = announcements.filter(a => (a.targetRole || '').toLowerCase().includes('pembina') || a.targetRole === 'Semua').length;
  const bkCount = announcements.filter(a => (a.targetRole || '').toLowerCase().includes('bk') || a.targetRole === 'Semua').length;
  const urgentCount = announcements.filter(a => a.priority === 'Mendesak').length;

  const filteredAnnouncements = announcements.filter(ann => {
    if (targetFilter !== 'all' && ann.targetRole !== targetFilter) return false;
    if (priorityFilter !== 'all' && ann.priority !== priorityFilter) return false;
    if (statusFilter === 'active' && ann.isActive === false) return false;
    if (statusFilter === 'inactive' && ann.isActive !== false) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTitle = ann.title?.toLowerCase().includes(q);
      const matchContent = ann.content?.toLowerCase().includes(q);
      const matchAuthor = ann.authorName?.toLowerCase().includes(q);
      const matchRole = ann.targetRole?.toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchAuthor && !matchRole) return false;
    }
    return true;
  });

  const handleSaveAnnouncement = async (data: Omit<Announcement, 'id' | 'createdAt'>, id?: string) => {
    if (id) {
      await updateAnnouncement(id, data);
    } else {
      await addAnnouncement(data);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedAnnouncement) {
      await deleteAnnouncement(selectedAnnouncement.id);
      setIsDeleteModalOpen(false);
      setSelectedAnnouncement(null);
    }
  };

  const handleOpenPreview = (ann?: Announcement) => {
    if (ann) {
      setPreviewList([ann]);
    } else {
      const activeList = announcements.filter(a => a.isActive !== false);
      setPreviewList(activeList.length > 0 ? activeList : announcements.slice(0, 3));
    }
    setIsPreviewPopupOpen(true);
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
            BIASA
          </span>
        );
    }
  };

  const getTargetRoleBadge = (ann: Announcement) => {
    const role = ann.targetRole || 'Semua';
    if (role === 'Guru BK Tertentu') {
      const names = ann.targetUserNames && ann.targetUserNames.length > 0 ? ann.targetUserNames.join(', ') : `${ann.targetUserIds?.length || 1} Guru BK`;
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-200 border border-purple-500/40 text-[10px] font-medium font-mono" title={`Target: ${names}`}>
          <ShieldCheck className="w-3 h-3 text-purple-400" /> Guru BK: {names}
        </span>
      );
    }
    if (role === 'Pembina Ekstra Tertentu') {
      const ekskuls = ann.targetExtracurricularNames && ann.targetExtracurricularNames.length > 0 
        ? ann.targetExtracurricularNames.join(', ')
        : `${ann.targetExtracurricularIds?.length || 1} Ekskul`;
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 text-[10px] font-medium font-mono" title={`Target: ${ekskuls}`}>
          <Users className="w-3 h-3 text-emerald-400" /> Ekskul: {ekskuls}
        </span>
      );
    }
    if (role === 'Pengguna Spesifik') {
      const names = ann.targetUserNames && ann.targetUserNames.length > 0 ? ann.targetUserNames.join(', ') : `${ann.targetUserIds?.length || 1} Pengguna`;
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-200 border border-blue-500/40 text-[10px] font-medium font-mono" title={`Target: ${names}`}>
          <UserCheck className="w-3 h-3 text-blue-400" /> Khusus: {names}
        </span>
      );
    }
    if (role === 'Guru Pembina' || role === 'Pembina') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium font-mono">
          <Users className="w-3 h-3" /> Semua Pembina
        </span>
      );
    }
    if (role === 'Guru BK') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-medium font-mono">
          <ShieldCheck className="w-3 h-3" /> Semua Guru BK
        </span>
      );
    }
    if (role === 'Semua') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-medium font-mono">
          🌐 Semua Pengguna
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-medium font-mono">
        {role}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
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
                  PUSAT PENGUMUMAN & BROADCAST
                </span>
                <span className="text-[10px] font-mono text-zinc-400 bg-[#222228] px-2 py-0.5 rounded border border-[#2d2d34]">
                  SINKRON OTOMATIS
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-100 mt-1">
                Pemberitahuan & Instruksi Kesiswaan
              </h2>
              <p className="text-xs text-zinc-400 max-w-2xl mt-1 leading-relaxed">
                Buat dan kelola informasi resmi untuk Guru Pembina (OSIM/Ekskul) dan Guru Bimbingan Konseling (BK). Informasi yang diterbitkan akan <strong>secara otomatis muncul sebagai jendela popup</strong> saat mereka masuk ke sistem.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => handleOpenPreview()}
              className="px-3.5 py-2 rounded-xl bg-[#222228] hover:bg-[#2c2c34] border border-[#2e2e36] text-xs font-semibold text-zinc-200 transition-colors flex items-center space-x-1.5 shadow-sm"
              title="Pratinjau tampilan popup di akun Pembina / BK"
            >
              <Eye className="w-4 h-4 text-blue-400" />
              <span>Pratinjau Popup</span>
            </button>
            <button
              onClick={() => {
                setSelectedAnnouncement(null);
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all shadow-lg shadow-blue-600/30 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Pengumuman Baru</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-[#27272a]/60">
          <div className="bg-[#121215] p-3 rounded-xl border border-[#222226]">
            <div className="text-[10px] font-mono text-zinc-400 uppercase">Total Pengumuman</div>
            <div className="text-lg font-mono font-bold text-zinc-100 mt-0.5">{totalCount}</div>
          </div>
          <div className="bg-[#121215] p-3 rounded-xl border border-[#222226]">
            <div className="text-[10px] font-mono text-emerald-400 uppercase">Status Aktif</div>
            <div className="text-lg font-mono font-bold text-emerald-300 mt-0.5">{activeCount}</div>
          </div>
          <div className="bg-[#121215] p-3 rounded-xl border border-[#222226]">
            <div className="text-[10px] font-mono text-emerald-400 uppercase">Target Pembina</div>
            <div className="text-lg font-mono font-bold text-emerald-300 mt-0.5">{pembinaCount}</div>
          </div>
          <div className="bg-[#121215] p-3 rounded-xl border border-[#222226]">
            <div className="text-[10px] font-mono text-purple-400 uppercase">Target Guru BK</div>
            <div className="text-lg font-mono font-bold text-purple-300 mt-0.5">{bkCount}</div>
          </div>
          <div className="bg-[#121215] p-3 rounded-xl border border-[#222226]">
            <div className="text-[10px] font-mono text-red-400 uppercase">Prioritas Mendesak</div>
            <div className="text-lg font-mono font-bold text-red-300 mt-0.5">{urgentCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#141418] border border-[#27272a] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari judul, target, atau isi pengumuman..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-[#18181c] border border-[#2d2d34] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          <select
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#18181c] border border-[#2d2d34] text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="all">Semua Target</option>
            <option value="Semua">Semua Pengguna</option>
            <option value="Guru BK">Semua Guru BK</option>
            <option value="Guru BK Tertentu">Guru BK Tertentu</option>
            <option value="Guru Pembina">Semua Guru Pembina</option>
            <option value="Pembina Ekstra Tertentu">Pembina Ekstra Tertentu</option>
            <option value="Pengguna Spesifik">Pengguna Spesifik</option>
            <option value="Waka & Admin">Waka & Admin</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#18181c] border border-[#2d2d34] text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="all">Semua Prioritas</option>
            <option value="Mendesak">Mendesak</option>
            <option value="Penting">Penting</option>
            <option value="Biasa">Biasa</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#18181c] border border-[#2d2d34] text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif Saja</option>
            <option value="inactive">Nonaktif (Draft)</option>
          </select>
        </div>

        <div className="text-xs font-mono text-zinc-400">
          Menampilkan <strong className="text-zinc-200">{filteredAnnouncements.length}</strong> dari {totalCount} item
        </div>
      </div>

      {/* Announcements List / Cards */}
      <div className="space-y-3">
        {filteredAnnouncements.length === 0 ? (
          <div className="py-16 text-center bg-[#141418] border border-[#27272a] rounded-2xl p-6">
            <Megaphone className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
            <h3 className="text-sm font-bold text-zinc-300">Belum Ada Pengumuman Ditemukan</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
              Tidak ada pengumuman yang sesuai dengan filter atau kata kunci pencarian Anda.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setTargetFilter('all');
                setPriorityFilter('all');
                setStatusFilter('all');
              }}
              className="mt-4 px-3 py-1.5 rounded-lg bg-[#222228] text-xs text-blue-400 hover:text-blue-300"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          filteredAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                ann.isActive !== false
                  ? 'bg-[#16161a] border-[#27272a] hover:border-zinc-700 shadow-md'
                  : 'bg-[#121214] border-[#202024] opacity-70'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {ann.isPinned && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                        <Pin className="w-3 h-3" /> PINNED
                      </span>
                    )}
                    {getPriorityBadge(ann.priority)}
                    {getTargetRoleBadge(ann)}
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${
                        ann.isActive !== false
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                      }`}
                    >
                      {ann.isActive !== false ? '● TAYANG' : '○ NONAKTIF'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-zinc-100 tracking-tight leading-snug">
                    {ann.title}
                  </h3>

                  {/* Content snippet */}
                  <p className="text-xs text-zinc-300 mt-2 font-sans leading-relaxed whitespace-pre-line bg-[#111114] p-3 rounded-xl border border-[#222226]">
                    {ann.content}
                  </p>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-[11px] font-mono text-zinc-400">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Publikasi: <strong>{ann.publishDate}</strong></span>
                    </div>
                    {ann.expiryDate && (
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Kedaluwarsa: {ann.expiryDate}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span>Dibuat oleh: <strong className="text-zinc-200">{ann.authorName}</strong></span>
                    </div>
                    {ann.attachmentUrl && (
                      <a
                        href={ann.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-blue-400 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{ann.attachmentName || 'Lampiran Berkas'}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center space-x-1.5 shrink-0 self-end md:self-start pt-1">
                  <button
                    onClick={() => handleOpenPreview(ann)}
                    className="p-2 rounded-xl bg-[#202026] hover:bg-[#282830] text-zinc-300 hover:text-blue-400 border border-[#2c2c36] transition-colors"
                    title="Pratinjau Tampilan Popup"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleAnnouncementPin(ann.id)}
                    className={`p-2 rounded-xl border transition-colors ${
                      ann.isPinned
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-[#202026] hover:bg-[#282830] text-zinc-400 hover:text-amber-300 border-[#2c2c36]'
                    }`}
                    title={ann.isPinned ? 'Lepas Pin' : 'Sematkan di Teratas'}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleAnnouncementStatus(ann.id)}
                    className={`p-2 rounded-xl border transition-colors ${
                      ann.isActive !== false
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                    }`}
                    title={ann.isActive !== false ? 'Nonaktifkan Pengumuman' : 'Aktifkan Pengumuman'}
                  >
                    {ann.isActive !== false ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAnnouncement(ann);
                      setIsEditModalOpen(true);
                    }}
                    className="p-2 rounded-xl bg-[#202026] hover:bg-[#282830] text-zinc-300 hover:text-blue-400 border border-[#2c2c36] transition-colors"
                    title="Edit Pengumuman"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAnnouncement(ann);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-2 rounded-xl bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-500/30 transition-colors"
                    title="Hapus Pengumuman"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create Announcement */}
      {isCreateModalOpen && (
        <AnnouncementModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleSaveAnnouncement}
        />
      )}

      {/* Modal: Edit Announcement */}
      {isEditModalOpen && (
        <AnnouncementModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedAnnouncement(null);
          }}
          onSave={handleSaveAnnouncement}
          initialData={selectedAnnouncement}
        />
      )}

      {/* Modal: Popup Preview */}
      {isPreviewPopupOpen && (
        <AnnouncementPopupModal
          announcements={previewList}
          isOpen={isPreviewPopupOpen}
          onClose={() => setIsPreviewPopupOpen(false)}
          onMarkAsRead={() => setIsPreviewPopupOpen(false)}
          onMarkAllAsRead={() => setIsPreviewPopupOpen(false)}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        title="Hapus Pengumuman"
        message={`Apakah Anda yakin ingin menghapus pengumuman "${selectedAnnouncement?.title}"? Pengumuman ini tidak akan ditampilkan lagi kepada guru pembina atau BK.`}
        confirmText="Hapus Pengumuman"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setSelectedAnnouncement(null);
        }}
      />
    </div>
  );
};
