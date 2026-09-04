import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Check,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useSchool } from '../../contexts/SchoolContext';
import { AcademicYear } from '../../types';
import { Modal } from './Modal';
import { ConfirmDialog } from './ConfirmDialog';

interface AcademicYearManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AcademicYearManagementModal: React.FC<AcademicYearManagementModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    academicYears,
    activeAcademicYear,
    activeSemester,
    setActiveAcademicYear,
    addAcademicYear,
    updateAcademicYear,
    deleteAcademicYear
  } = useSchool();

  // Mode: 'list' | 'add' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formIsActive, setFormIsActive] = useState(false);

  // Delete State
  const [yearToDelete, setYearToDelete] = useState<AcademicYear | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback State
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Helper to suggest next year
  const getNextYearSuggestion = () => {
    if (!academicYears || academicYears.length === 0) return '2026/2027';
    const sorted = [...academicYears].sort((a, b) => {
      const nameA = a.year || a.name || '';
      const nameB = b.year || b.name || '';
      return nameB.localeCompare(nameA);
    });
    const latest = sorted[0]?.year || sorted[0]?.name || '2026/2027';
    const parts = latest.split('/');
    if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
      const nextStart = Number(parts[0]) + 1;
      const nextEnd = Number(parts[1]) + 1;
      return `${nextStart}/${nextEnd}`;
    }
    return '2027/2028';
  };

  const handleOpenAdd = () => {
    const suggested = getNextYearSuggestion();
    const startYear = suggested.split('/')[0] || '2027';
    const endYear = suggested.split('/')[1] || '2028';

    setFormName(suggested);
    setFormStartDate(`${startYear}-07-01`);
    setFormEndDate(`${endYear}-06-30`);
    setFormIsActive(false);
    setEditingYear(null);
    setViewMode('add');
  };

  const handleOpenEdit = (ay: AcademicYear) => {
    const yearLabel = ay.year || ay.name || '';
    setEditingYear(ay);
    setFormName(yearLabel);
    setFormStartDate(ay.startDate || '');
    setFormEndDate(ay.endDate || '');
    setFormIsActive(ay.isActive || yearLabel === activeAcademicYear);
    setViewMode('edit');
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Nama tahun pelajaran wajib diisi.', 'error');
      return;
    }

    // Check duplicate
    const exists = academicYears.some(
      ay => (ay.year || ay.name || '').trim().toLowerCase() === formName.trim().toLowerCase()
    );
    if (exists) {
      showToast(`Tahun pelajaran "${formName}" sudah terdaftar dalam sistem.`, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await addAcademicYear({
        year: formName.trim(),
        name: formName.trim(),
        startDate: formStartDate || undefined,
        endDate: formEndDate || undefined,
        isActive: formIsActive
      });

      showToast(`Tahun pelajaran ${formName} berhasil ditambahkan!`);
      setViewMode('list');
    } catch (err: any) {
      showToast(err?.message || 'Gagal menambahkan tahun pelajaran.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingYear) return;
    if (!formName.trim()) {
      showToast('Nama tahun pelajaran wajib diisi.', 'error');
      return;
    }

    const currentLabel = editingYear.year || editingYear.name || '';
    // Check duplicate if name changed
    if (formName.trim().toLowerCase() !== currentLabel.trim().toLowerCase()) {
      const exists = academicYears.some(
        ay => ay.id !== editingYear.id && (ay.year || ay.name || '').trim().toLowerCase() === formName.trim().toLowerCase()
      );
      if (exists) {
        showToast(`Tahun pelajaran "${formName}" sudah digunakan.`, 'error');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await updateAcademicYear(editingYear.id, {
        year: formName.trim(),
        name: formName.trim(),
        startDate: formStartDate || undefined,
        endDate: formEndDate || undefined,
        isActive: formIsActive
      });

      showToast(`Tahun pelajaran ${formName} berhasil diperbarui!`);
      setViewMode('list');
    } catch (err: any) {
      showToast(err?.message || 'Gagal memperbarui tahun pelajaran.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickActivate = async (ay: AcademicYear) => {
    const yearLabel = ay.year || ay.name || '';
    try {
      setActiveAcademicYear(yearLabel, activeSemester);
      await updateAcademicYear(ay.id, { isActive: true });
      showToast(`Tahun pelajaran aktif dialihkan ke ${yearLabel} (${activeSemester})`);
    } catch (err: any) {
      showToast('Gagal mengubah tahun pelajaran aktif.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!yearToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAcademicYear(yearToDelete.id);
      showToast(`Tahun pelajaran ${yearToDelete.name} berhasil dihapus.`);
      setYearToDelete(null);
    } catch (err: any) {
      showToast(err?.message || 'Gagal menghapus tahun pelajaran.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Kelola Tahun Ajaran / Pelajaran"
        size="lg"
      >
        <div className="space-y-4 text-xs">
          {/* Header Info */}
          <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5 shadow-sm">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-indigo-950 dark:text-indigo-200 text-sm">
                  Master Periode Tahun Ajaran
                </p>
                <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80 mt-0.5 leading-relaxed">
                  Tambah, edit, kurangi/hapus, atau tentukan tahun ajaran aktif yang digunakan untuk rekam presensi, mutasi poin pelanggaran, SK tata tertib, dan buku induk kesiswaan.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block">
                Tahun Aktif Saat Ini
              </span>
              <span className="inline-flex items-center gap-1 font-mono font-bold text-xs text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 shadow-sm mt-0.5">
                <Check className="w-3 h-3 text-emerald-500" />
                {activeAcademicYear} ({activeSemester})
              </span>
            </div>
          </div>

          {/* Toast Notification */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span className="font-medium">{feedback.text}</span>
            </div>
          )}

          {/* VIEW: LIST MODE */}
          {viewMode === 'list' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  Daftar Tahun Ajaran Terdaftar ({academicYears.length})
                </span>
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Tahun Ajaran Baru</span>
                </button>
              </div>

              {/* Table / List Cards */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
                {academicYears.map((ay, idx) => {
                  const yearLabel = ay.year || ay.name || '';
                  const isActive = yearLabel === activeAcademicYear || ay.isActive;
                  return (
                    <div
                      key={ay.id || idx}
                      className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        isActive
                          ? 'bg-indigo-50/40 dark:bg-indigo-950/20'
                          : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold font-mono text-xs ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 font-mono">
                              {yearLabel}
                            </span>
                            {isActive ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Aktif Berjalan
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                Arsip / Standby
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              Periode: {ay.startDate || '01 Juli'} s/d {ay.endDate || '30 Juni'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => handleQuickActivate(ay)}
                            title="Aktifkan tahun ajaran ini ke seluruh sistem"
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold flex items-center gap-1 transition-all"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Jadikan Aktif</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(ay)}
                          title="Edit nama dan rentang tanggal"
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={academicYears.length <= 1}
                          onClick={() => setYearToDelete(ay)}
                          title={
                            academicYears.length <= 1
                              ? 'Minimal harus ada 1 tahun ajaran'
                              : 'Hapus / Kurangi tahun ajaran ini'
                          }
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/60 text-slate-400 hover:text-red-600 border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: ADD / EDIT MODE */}
          {(viewMode === 'add' || viewMode === 'edit') && (
            <form onSubmit={viewMode === 'add' ? handleSaveAdd : handleSaveEdit} className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
                <p className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  {viewMode === 'add' ? 'Tambah Tahun Ajaran Baru' : `Edit Tahun Ajaran: ${editingYear?.year || editingYear?.name || ''}`}
                </p>
                <p className="text-[11px] text-slate-500">
                  Gunakan format standar tahun ajaran (contoh: 2026/2027, 2027/2028).
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Tahun Pelajaran *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 2027/2028"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Mulai Periode
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={e => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Selesai Periode
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={e => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 rounded-xl">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={e => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                      Jadikan sebagai Tahun Pelajaran Aktif Sekarang
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Sistem akan langsung menerapkan tahun ini untuk seluruh pencatatan kegiatan, dispensasi, dan presensi.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Tahun Ajaran'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Footer Controls */}
          {viewMode === 'list' && (
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-500">
                Total {academicYears.length} tahun ajaran terdaftar • Tersinkronisasi otomatis
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!yearToDelete}
        onClose={() => setYearToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Hapus Tahun Ajaran: ${yearToDelete?.year || yearToDelete?.name}?`}
        message={`Apakah Anda yakin ingin menghapus / mengurangi data Tahun Ajaran ${yearToDelete?.year || yearToDelete?.name}? Tindakan ini akan menghapus periode ini dari daftar pilihan master.`}
        confirmText={isDeleting ? 'Menghapus...' : 'Ya, Hapus Tahun Ajaran'}
        cancelText="Batal"
        type="danger"
      />
    </>
  );
};
