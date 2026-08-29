import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  AlertTriangle,
  Info,
  Flame,
  Calendar,
  Pin,
  Link,
  Users,
  CheckCircle2,
  X,
  FileText,
  HeartHandshake,
  Compass,
  CheckSquare,
  Square,
  Shield,
  UserCheck
} from 'lucide-react';
import { Announcement, AnnouncementPriority, AnnouncementTargetRole, AnnouncementTargetType } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Announcement, 'id' | 'createdAt'>, id?: string) => Promise<void>;
  initialData?: Announcement | null;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const { currentUser, allUsers } = useAuth();
  const { extracurriculars } = useSchool();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState<AnnouncementTargetRole>('Semua');
  const [targetType, setTargetType] = useState<AnnouncementTargetType>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedEkskulIds, setSelectedEkskulIds] = useState<string[]>([]);
  const [priority, setPriority] = useState<AnnouncementPriority>('Biasa');
  const [publishDate, setPublishDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('2026-12-31');
  const [isPinned, setIsPinned] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtered users for specific selections
  const bkUsers = allUsers.filter(u => u.role === 'guru_bk');
  const otherStaffUsers = allUsers.filter(u => u.role !== 'super_admin');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      const tRole = (initialData.targetRole as AnnouncementTargetRole) || 'Semua';
      setTargetRole(tRole);
      setTargetType(initialData.targetType || (
        tRole === 'Guru BK Tertentu' ? 'specific_bk' :
        tRole === 'Pembina Ekstra Tertentu' ? 'specific_ekskul' :
        tRole === 'Pengguna Spesifik' ? 'specific_users' :
        tRole === 'Guru BK' ? 'all_bk' :
        tRole === 'Guru Pembina' ? 'all_pembina' :
        tRole === 'Waka & Admin' ? 'waka_admin' : 'all'
      ));
      setSelectedUserIds(initialData.targetUserIds || []);
      setSelectedEkskulIds(initialData.targetExtracurricularIds || (initialData.targetExtracurricularId ? [initialData.targetExtracurricularId] : []));
      setPriority(initialData.priority || 'Biasa');
      setPublishDate(initialData.publishDate || new Date().toISOString().split('T')[0]);
      setExpiryDate(initialData.expiryDate || '2026-12-31');
      setIsPinned(Boolean(initialData.isPinned));
      setIsActive(initialData.isActive !== false);
      setAttachmentUrl(initialData.attachmentUrl || '');
      setAttachmentName(initialData.attachmentName || '');
    } else {
      setTitle('');
      setContent('');
      setTargetRole('Semua');
      setTargetType('all');
      setSelectedUserIds([]);
      setSelectedEkskulIds([]);
      setPriority('Penting');
      setPublishDate(new Date().toISOString().split('T')[0]);
      setExpiryDate('2026-12-31');
      setIsPinned(false);
      setIsActive(true);
      setAttachmentUrl('');
      setAttachmentName('');
    }
    setErrorMsg(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleTargetChange = (val: AnnouncementTargetRole) => {
    setTargetRole(val);
    if (val === 'Semua') {
      setTargetType('all');
      setSelectedUserIds([]);
      setSelectedEkskulIds([]);
    } else if (val === 'Guru BK') {
      setTargetType('all_bk');
      setSelectedUserIds([]);
      setSelectedEkskulIds([]);
    } else if (val === 'Guru BK Tertentu') {
      setTargetType('specific_bk');
      if (selectedUserIds.length === 0 && bkUsers.length > 0) {
        setSelectedUserIds([bkUsers[0].uid]);
      }
    } else if (val === 'Guru Pembina') {
      setTargetType('all_pembina');
      setSelectedUserIds([]);
      setSelectedEkskulIds([]);
    } else if (val === 'Pembina Ekstra Tertentu') {
      setTargetType('specific_ekskul');
      if (selectedEkskulIds.length === 0 && extracurriculars.length > 0) {
        setSelectedEkskulIds([extracurriculars[0].id]);
      }
    } else if (val === 'Pengguna Spesifik') {
      setTargetType('specific_users');
    } else if (val === 'Waka & Admin') {
      setTargetType('waka_admin');
      setSelectedUserIds([]);
      setSelectedEkskulIds([]);
    }
  };

  const toggleUserId = (uid: string) => {
    setSelectedUserIds(prev => 
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const toggleEkskulId = (ekskulId: string) => {
    setSelectedEkskulIds(prev =>
      prev.includes(ekskulId) ? prev.filter(id => id !== ekskulId) : [...prev, ekskulId]
    );
  };

  const selectAllBK = () => {
    setSelectedUserIds(bkUsers.map(u => u.uid));
  };

  const selectAllEkskuls = () => {
    setSelectedEkskulIds(extracurriculars.map(e => e.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Judul pengumuman wajib diisi');
      return;
    }
    if (!content.trim()) {
      setErrorMsg('Isi pengumuman wajib diisi');
      return;
    }

    if (targetRole === 'Guru BK Tertentu' && selectedUserIds.length === 0) {
      setErrorMsg('Pilih minimal 1 Guru BK penerima pengumuman');
      return;
    }

    if (targetRole === 'Pembina Ekstra Tertentu' && selectedEkskulIds.length === 0) {
      setErrorMsg('Pilih minimal 1 Unit Ekstrakurikuler penerima pengumuman');
      return;
    }

    if (targetRole === 'Pengguna Spesifik' && selectedUserIds.length === 0) {
      setErrorMsg('Pilih minimal 1 akun pengguna penerima pengumuman');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Resolve names for display tags
      let targetUserNames: string[] | undefined = undefined;
      if (selectedUserIds.length > 0) {
        targetUserNames = selectedUserIds
          .map(uid => allUsers.find(u => u.uid === uid)?.displayName)
          .filter(Boolean) as string[];
      }

      let targetExtracurricularNames: string[] | undefined = undefined;
      if (selectedEkskulIds.length > 0) {
        targetExtracurricularNames = selectedEkskulIds
          .map(id => extracurriculars.find(e => e.id === id)?.name)
          .filter(Boolean) as string[];
      }

      const payload: Omit<Announcement, 'id' | 'createdAt'> = {
        title: title.trim(),
        content: content.trim(),
        targetRole,
        targetType,
        targetUserIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
        targetUserNames,
        targetExtracurricularIds: selectedEkskulIds.length > 0 ? selectedEkskulIds : undefined,
        targetExtracurricularNames,
        targetExtracurricularId: selectedEkskulIds[0] || undefined,
        priority,
        publishDate,
        expiryDate: expiryDate || undefined,
        isPinned,
        isActive,
        authorName: initialData?.authorName || currentUser?.displayName || 'Waka Kesiswaan',
        authorRole: initialData?.authorRole || (currentUser?.role === 'super_admin' ? 'Super Admin' : 'Waka Kesiswaan'),
        attachmentUrl: attachmentUrl.trim() || undefined,
        attachmentName: attachmentName.trim() || undefined
      };

      await onSave(payload, initialData?.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menyimpan pengumuman');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#111114] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden font-sans my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272a] bg-[#16161a]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                {initialData ? 'Edit Pengumuman & Broadcast' : 'Buat Pengumuman & Broadcast Baru'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                Informasi akan diteruskan sesuai target dan muncul sebagai popup saat penerima login.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-[#27272a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-950/30 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Judul Pengumuman */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Judul Pengumuman <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Batas Akhir Pengumpulan LPJ Semester Ganjil 2026/2027"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181c] border border-[#2d2d34] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          {/* Target Role & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Penerima */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Target Penerima Informasi</span>
              </label>
              <select
                value={targetRole}
                onChange={(e) => handleTargetChange(e.target.value as AnnouncementTargetRole)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#18181c] border border-[#2d2d34] text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="Semua">🌐 Semua Pengguna (Semua Guru & Staf)</option>
                <option value="Guru BK">🎯 Semua Guru BK (Bimbingan Konseling)</option>
                <option value="Guru BK Tertentu">👤 Guru BK Tertentu (Pilih Guru BK)</option>
                <option value="Guru Pembina">🎯 Semua Guru Pembina (OSIM & Ekskul)</option>
                <option value="Pembina Ekstra Tertentu">🏆 Pembina Ekstrakurikuler Tertentu</option>
                <option value="Pengguna Spesifik">👥 Pengguna / Akun Spesifik</option>
                <option value="Waka & Admin">🛡️ Waka Kesiswaan & Admin</option>
              </select>
            </div>

            {/* Tingkat Prioritas */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Tingkat Prioritas</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPriority('Biasa')}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-0.5 ${
                    priority === 'Biasa'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                      : 'bg-[#18181c] border-[#2d2d34] text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <Info className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Biasa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('Penting')}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-0.5 ${
                    priority === 'Penting'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                      : 'bg-[#18181c] border-[#2d2d34] text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Penting</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('Mendesak')}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-0.5 ${
                    priority === 'Mendesak'
                      ? 'bg-red-500/20 border-red-500 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.3)] animate-pulse'
                      : 'bg-[#18181c] border-[#2d2d34] text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Mendesak</span>
                </button>
              </div>
            </div>
          </div>

          {/* DETAIL PILIHAN: Guru BK Tertentu */}
          {targetRole === 'Guru BK Tertentu' && (
            <div className="p-3.5 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-purple-300">
                  <HeartHandshake className="w-4 h-4 text-purple-400" />
                  <span>Pilih Guru Bimbingan Konseling (BK) Penerima:</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={selectAllBK}
                    className="text-[10px] text-purple-300 hover:underline font-mono"
                  >
                    Pilih Semua ({bkUsers.length})
                  </button>
                  <span className="text-zinc-600">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedUserIds([])}
                    className="text-[10px] text-zinc-400 hover:text-zinc-200 font-mono"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                {bkUsers.length > 0 ? (
                  bkUsers.map(user => {
                    const isChecked = selectedUserIds.includes(user.uid);
                    return (
                      <div
                        key={user.uid}
                        onClick={() => toggleUserId(user.uid)}
                        className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                          isChecked
                            ? 'bg-purple-900/30 border-purple-500/60 text-purple-200'
                            : 'bg-[#18181c] border-[#2a2a30] text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-purple-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-500 shrink-0" />
                          )}
                          <div className="truncate">
                            <p className="text-xs font-semibold truncate text-zinc-200">{user.displayName}</p>
                            <p className="text-[10px] text-zinc-400 truncate">{user.counselorSpecialization || user.email}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-zinc-500 col-span-2 py-2 text-center">
                    Belum ada akun Guru BK yang terdaftar.
                  </p>
                )}
              </div>
              <p className="text-[10px] text-purple-400/80 font-mono">
                {selectedUserIds.length} Guru BK terpilih. Popup pengumuman hanya akan muncul pada akun mereka.
              </p>
            </div>
          )}

          {/* DETAIL PILIHAN: Pembina Ekstrakurikuler Tertentu */}
          {targetRole === 'Pembina Ekstra Tertentu' && (
            <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-300">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span>Pilih Unit Ekstrakurikuler Penerima:</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={selectAllEkskuls}
                    className="text-[10px] text-emerald-300 hover:underline font-mono"
                  >
                    Pilih Semua ({extracurriculars.length})
                  </button>
                  <span className="text-zinc-600">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedEkskulIds([])}
                    className="text-[10px] text-zinc-400 hover:text-zinc-200 font-mono"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {extracurriculars.length > 0 ? (
                  extracurriculars.map(ekskul => {
                    const isChecked = selectedEkskulIds.includes(ekskul.id);
                    return (
                      <div
                        key={ekskul.id}
                        onClick={() => toggleEkskulId(ekskul.id)}
                        className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                          isChecked
                            ? 'bg-emerald-900/30 border-emerald-500/60 text-emerald-200'
                            : 'bg-[#18181c] border-[#2a2a30] text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-500 shrink-0" />
                          )}
                          <div className="truncate">
                            <p className="text-xs font-semibold truncate text-zinc-200">{ekskul.name}</p>
                            <p className="text-[10px] text-emerald-400/80 truncate">Pembina: {ekskul.coachName || 'Semua Pembina'}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-zinc-500 col-span-2 py-2 text-center">
                    Belum ada unit ekstrakurikuler terdaftar.
                  </p>
                )}
              </div>
              <p className="text-[10px] text-emerald-400/80 font-mono">
                {selectedEkskulIds.length} Unit Ekskul terpilih. Popup pengumuman hanya akan muncul pada akun Pembina ekskul tersebut.
              </p>
            </div>
          )}

          {/* DETAIL PILIHAN: Pengguna Spesifik */}
          {targetRole === 'Pengguna Spesifik' && (
            <div className="p-3.5 bg-blue-950/20 border border-blue-500/30 rounded-xl space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-blue-300">
                  <UserCheck className="w-4 h-4 text-blue-400" />
                  <span>Pilih Akun Guru / Staf Spesifik:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUserIds([])}
                  className="text-[10px] text-zinc-400 hover:text-zinc-200 font-mono"
                >
                  Reset Pilihan
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {otherStaffUsers.map(user => {
                  const isChecked = selectedUserIds.includes(user.uid);
                  const roleLabel =
                    user.role === 'guru_bk' ? 'Guru BK' :
                    user.role === 'pembina_osim' ? 'Pembina OSIM' :
                    user.role === 'waka_kesiswaan' ? 'Waka Kesiswaan' :
                    'Guru Pembina Ekskul';
                  return (
                    <div
                      key={user.uid}
                      onClick={() => toggleUserId(user.uid)}
                      className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                        isChecked
                          ? 'bg-blue-900/30 border-blue-500/60 text-blue-200'
                          : 'bg-[#18181c] border-[#2a2a30] text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-blue-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-500 shrink-0" />
                        )}
                        <div className="truncate">
                          <p className="text-xs font-semibold truncate text-zinc-200">{user.displayName}</p>
                          <p className="text-[10px] text-zinc-400 truncate">{roleLabel}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-blue-400/80 font-mono">
                {selectedUserIds.length} Pengguna terpilih.
              </p>
            </div>
          )}

          {/* Isi Pesan Pengumuman */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Isi Pengumuman & Detail Informasi <span className="text-red-400">*</span>
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">
                {content.length} karakter
              </span>
            </div>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tuliskan pesan instruksi, pemberitahuan, deadline, atau instruksi kerja secara lengkap..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181c] border border-[#2d2d34] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors leading-relaxed"
              required
            />
          </div>

          {/* Jadwal Publikasi & Kedaluwarsa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Tanggal Publikasi</span>
              </label>
              <input
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#18181c] border border-[#2d2d34] text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Berlaku Hingga (Opsional)</span>
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#18181c] border border-[#2d2d34] text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Tautan Lampiran (Opsional) */}
          <div className="p-3.5 bg-[#18181c] border border-[#2d2d34] rounded-xl space-y-2.5">
            <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-300">
              <Link className="w-3.5 h-3.5 text-blue-400" />
              <span>Tautan / Link Berkas Terkait (Opsional)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                placeholder="Label Link (cth: Template LPJ.pdf / Link Drive)"
                className="px-3 py-2 rounded-lg bg-[#111114] border border-[#27272a] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
              <input
                type="url"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="px-3 py-2 rounded-lg bg-[#111114] border border-[#27272a] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Opsi Tambahan: Pin & Status Aktif */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#27272a]">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="rounded bg-[#18181c] border-[#2d2d34] text-blue-600 focus:ring-0 w-4 h-4"
              />
              <div className="flex items-center space-x-1.5 text-xs text-zinc-300">
                <Pin className="w-3.5 h-3.5 text-amber-400" />
                <span>Sematkan / Pin di Posisi Teratas</span>
              </div>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded bg-[#18181c] border-[#2d2d34] text-emerald-600 focus:ring-0 w-4 h-4"
              />
              <span className="text-xs text-zinc-300">
                Status: <strong className={isActive ? 'text-emerald-400' : 'text-zinc-500'}>{isActive ? 'Aktif (Ditampilkan)' : 'Nonaktif (Draft)'}</strong>
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#27272a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#1c1c20] hover:bg-[#27272a] text-xs font-semibold text-zinc-300 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all shadow-lg shadow-blue-600/30 flex items-center space-x-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : initialData ? 'Simpan Perubahan' : 'Siarkan Pengumuman'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
