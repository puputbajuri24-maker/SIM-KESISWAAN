import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  Eye,
  Edit2,
  Trash2,
  Send,
  MessageSquare
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { ActivityReport, ReportStatus } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';

export const ReportsPage: React.FC = () => {
  const { isWakaOrAdmin, isPembina, currentUser } = useAuth();
  const {
    activityReports,
    extracurriculars,
    addActivityReport,
    updateActivityReport,
    deleteActivityReport,
    activeAcademicYear
  } = useSchool();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ActivityReport | null>(null);

  // Review state
  const [reviewStatus, setReviewStatus] = useState<ReportStatus>('Disetujui');
  const [reviewNotes, setReviewNotes] = useState<string>('');

  const [formData, setFormData] = useState<Partial<ActivityReport>>({
    activityTitle: '',
    extracurricularId: '',
    extracurricularName: '',
    coachName: currentUser?.displayName || '',
    date: new Date().toISOString().split('T')[0],
    summary: '',
    attendanceCount: 30,
    totalBudgetSpent: 0,
    achievements: '',
    challenges: '',
    status: 'Diajukan'
  });

  const handleOpenAdd = () => {
    setSelectedReport(null);
    const defaultEkskul = extracurriculars[0];
    setFormData({
      activityTitle: '',
      extracurricularId: defaultEkskul?.id || '',
      extracurricularName: defaultEkskul?.name || '',
      coachName: defaultEkskul?.coachName || currentUser?.displayName || 'Guru Pembina',
      date: new Date().toISOString().split('T')[0],
      summary: '',
      attendanceCount: 25,
      totalBudgetSpent: 500000,
      achievements: 'Semua target materi dan latihan terlaksana dengan baik.',
      challenges: 'Tidak ada kendala yang berarti.',
      status: 'Diajukan'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (report: ActivityReport, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedReport(report);
    setFormData(report);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (report: ActivityReport) => {
    setSelectedReport(report);
    setIsDetailOpen(true);
  };

  const handleOpenReview = (report: ActivityReport, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedReport(report);
    setReviewStatus('Disetujui');
    setReviewNotes(report.feedbackNotes || 'Laporan telah diverifikasi dan disetujui oleh Waka Kesiswaan.');
    setIsReviewOpen(true);
  };

  const handleOpenDelete = (report: ActivityReport, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedReport(report);
    setIsDeleteOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.activityTitle || !formData.extracurricularId || !formData.summary) {
      alert('Mohon isi judul kegiatan, ekstrakurikuler, dan ringkasan pelaksanaan.');
      return;
    }

    const ekskul = extracurriculars.find(e => e.id === formData.extracurricularId);

    if (selectedReport) {
      await updateActivityReport(selectedReport.id, {
        ...formData,
        extracurricularName: ekskul?.name || formData.extracurricularName
      });
    } else {
      await addActivityReport({
        activityTitle: formData.activityTitle!,
        extracurricularId: formData.extracurricularId!,
        extracurricularName: ekskul?.name || 'Ekstrakurikuler',
        coachName: formData.coachName || currentUser?.displayName || 'Pembina',
        date: formData.date!,
        summary: formData.summary!,
        attendanceCount: Number(formData.attendanceCount) || 0,
        totalBudgetSpent: Number(formData.totalBudgetSpent) || 0,
        achievements: formData.achievements || '',
        challenges: formData.challenges || '',
        status: 'Diajukan',
        academicYear: activeAcademicYear
      });
    }
    setIsFormOpen(false);
  };

  const handleSaveReview = async () => {
    if (!selectedReport) return;
    await updateActivityReport(selectedReport.id, {
      status: reviewStatus,
      feedbackNotes: reviewNotes,
      approvedBy: currentUser?.displayName || 'Waka Kesiswaan'
    });
    setIsReviewOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (selectedReport) {
      await deleteActivityReport(selectedReport.id);
      setIsDeleteOpen(false);
      setSelectedReport(null);
    }
  };

  const columns: Column<ActivityReport>[] = [
    {
      header: 'Judul Laporan & Ekskul',
      accessorKey: 'activityTitle',
      sortable: true,
      cell: r => (
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100">{r.activityTitle}</p>
          <p className="text-[11px] text-slate-400">
            {r.extracurricularName} • Pembina: {r.coachName}
          </p>
        </div>
      )
    },
    {
      header: 'Tanggal & Kehadiran',
      accessorKey: 'date',
      sortable: true,
      cell: r => (
        <div>
          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">{r.date}</span>
          <p className="text-[11px] text-slate-400">👥 {r.attendanceCount} Siswa Hadir</p>
        </div>
      )
    },
    {
      header: 'Realisasi Anggaran',
      accessorKey: 'totalBudgetSpent',
      cell: r => (
        <span className="text-xs font-semibold text-emerald-600">
          Rp {(r.totalBudgetSpent || 0).toLocaleString('id-ID')}
        </span>
      )
    },
    {
      header: 'Status Verifikasi Waka',
      accessorKey: 'status',
      sortable: true,
      cell: r => <StatusBadge status={r.status} />
    },
    {
      header: 'Aksi',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          {isWakaOrAdmin && (
            <button
              onClick={e => handleOpenReview(r, e)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 flex items-center gap-1 transition-colors"
              title="Review & Verifikasi Laporan"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Verifikasi</span>
            </button>
          )}
          <button
            onClick={() => handleOpenDetail(r)}
            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-400 transition-colors"
            title="Lihat Detail LPJ"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={e => handleOpenEdit(r, e)}
            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:hover:bg-amber-900 dark:text-amber-400 transition-colors"
            title="Edit Laporan"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={e => handleOpenDelete(r, e)}
            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-400 transition-colors"
            title="Hapus Laporan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Laporan Kegiatan & LPJ Pembina
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pertanggungjawaban kegiatan ekstrakurikuler, evaluasi pembinaan, realisasi dana, dan persetujuan Waka Kesiswaan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportActions
            filename="laporan_kegiatan_pembina"
            title="Daftar Laporan Kegiatan Ekstrakurikuler"
            data={activityReports}
            headers={[
              { header: 'Kegiatan', key: 'activityTitle' },
              { header: 'Ekstrakurikuler', key: 'extracurricularName' },
              { header: 'Pembina', key: 'coachName' },
              { header: 'Tanggal', key: 'date' },
              { header: 'Jumlah Kehadiran', key: 'attendanceCount' },
              { header: 'Anggaran Terpakai (Rp)', key: 'totalBudgetSpent' },
              { header: 'Status', key: 'status' }
            ]}
          />

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Laporan LPJ</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        id="reports-table"
        data={activityReports}
        columns={columns}
        searchPlaceholder="Cari judul laporan, ekstrakurikuler, atau nama pembina..."
        searchableKeys={['activityTitle', 'extracurricularName', 'coachName', 'summary']}
        onRowClick={handleOpenDetail}
      />

      {/* Form Modal (Add/Edit) */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedReport ? 'Edit Laporan Kegiatan' : 'Buat Laporan Kegiatan Baru (LPJ)'}
        subtitle="Laporkan hasil kegiatan latihan, event, kejuaraan, atau kemah"
        maxWidth="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
            >
              Kirimkan Laporan
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pilih Ekstrakurikuler *
            </label>
            <select
              value={formData.extracurricularId}
              onChange={e => {
                const eks = extracurriculars.find(ek => ek.id === e.target.value);
                setFormData({
                  ...formData,
                  extracurricularId: e.target.value,
                  extracurricularName: eks?.name || '',
                  coachName: eks?.coachName || formData.coachName
                });
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            >
              {extracurriculars.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Judul Kegiatan Yang Dilaporkan *
            </label>
            <input
              type="text"
              required
              value={formData.activityTitle}
              onChange={e => setFormData({ ...formData, activityTitle: e.target.value })}
              placeholder="Contoh: Laporan Evaluasi Turnamen Futsal Cup 2026"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Pelaksanaan *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jumlah Kehadiran Siswa
              </label>
              <input
                type="number"
                value={formData.attendanceCount}
                onChange={e => setFormData({ ...formData, attendanceCount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Realisasi Dana (Rp)
              </label>
              <input
                type="number"
                value={formData.totalBudgetSpent}
                onChange={e => setFormData({ ...formData, totalBudgetSpent: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ringkasan Jalannya Kegiatan & Hasil *
            </label>
            <textarea
              rows={3}
              required
              value={formData.summary}
              onChange={e => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Jelaskan jalannya acara, keikutsertaan siswa, dan capaian target..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Prestasi / Output Yang Dicapai
              </label>
              <textarea
                rows={2}
                value={formData.achievements}
                onChange={e => setFormData({ ...formData, achievements: e.target.value })}
                placeholder="Pencapaian atau hasil positif..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kendala & Catatan Evaluasi
              </label>
              <textarea
                rows={2}
                value={formData.challenges}
                onChange={e => setFormData({ ...formData, challenges: e.target.value })}
                placeholder="Kendala yang dihadapi dan saran perbaikan..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Review Modal (For Waka Kesiswaan / Admin) */}
      <Modal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        title="Verifikasi & Persetujuan Laporan (Waka)"
        subtitle={`Laporan: ${selectedReport?.activityTitle} (${selectedReport?.extracurricularName})`}
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsReviewOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveReview}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
            >
              Simpan Keputusan Verifikasi
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Keputusan Status *
            </label>
            <select
              value={reviewStatus}
              onChange={e => setReviewStatus(e.target.value as ReportStatus)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            >
              <option value="Disetujui">Disetujui (ACC)</option>
              <option value="Revisi">Perlu Revisi</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Pembinaan / Feedback Waka Kesiswaan
            </label>
            <textarea
              rows={3}
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
              placeholder="Berikan catatan perbaikan atau apresiasi kepada pembina..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      {selectedReport && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Detail LPJ: ${selectedReport.activityTitle}`}
          subtitle={`${selectedReport.extracurricularName} • Pembina: ${selectedReport.coachName}`}
          maxWidth="lg"
          footer={
            <button
              onClick={() => setIsDetailOpen(false)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-white"
            >
              Tutup
            </button>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500">Status Verifikasi:</span>
                <StatusBadge status={selectedReport.status} />
              </div>
              <p><strong>Tanggal Kegiatan:</strong> {selectedReport.date}</p>
              <p><strong>Jumlah Siswa Hadir:</strong> {selectedReport.attendanceCount} Orang</p>
              <p><strong>Dana Digunakan:</strong> Rp {(selectedReport.totalBudgetSpent || 0).toLocaleString('id-ID')}</p>
              <p className="mt-2"><strong>Ringkasan:</strong> {selectedReport.summary}</p>
              <p><strong>Capaian / Prestasi:</strong> {selectedReport.achievements || '-'}</p>
              <p><strong>Kendala:</strong> {selectedReport.challenges || '-'}</p>
              {selectedReport.feedbackNotes && (
                <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
                  <p className="font-bold text-amber-800 dark:text-amber-300">Catatan Waka:</p>
                  <p className="text-amber-900 dark:text-amber-200">{selectedReport.feedbackNotes}</p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Laporan Kegiatan"
        message={`Apakah Anda yakin ingin menghapus laporan "${selectedReport?.activityTitle}"?`}
        confirmText="Hapus Laporan"
      />
    </div>
  );
};
