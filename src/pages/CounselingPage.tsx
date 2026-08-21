import React, { useState } from 'react';
import {
  HeartHandshake,
  Plus,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Eye,
  Filter,
  UserCheck
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { CounselingSession } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';

export const CounselingPage: React.FC = () => {
  const { isWakaOrAdmin, currentUser } = useAuth();
  const {
    counseling,
    students,
    teachers,
    addCounselingSession,
    updateCounselingSession,
    deleteCounselingSession,
    activeAcademicYear
  } = useSchool();

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<CounselingSession | null>(null);

  const [formData, setFormData] = useState<Partial<CounselingSession>>({
    studentId: '',
    studentName: '',
    studentClass: '',
    date: new Date().toISOString().split('T')[0],
    counselorName: currentUser?.displayName || 'Guru BK',
    topic: '',
    notes: '',
    solution: '',
    parentInvolved: false,
    followUpPlan: '',
    status: 'Selesai'
  });

  const filteredSessions = counseling.filter(c => {
    if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;
    return true;
  });

  const handleOpenAdd = () => {
    setSelectedSession(null);
    const defaultStudent = students[0];
    setFormData({
      studentId: defaultStudent?.id || '',
      studentName: defaultStudent?.fullName || '',
      studentClass: defaultStudent?.className || '',
      date: new Date().toISOString().split('T')[0],
      counselorName: currentUser?.displayName || 'Guru Bimbingan Konseling',
      topic: 'Konseling Motivasi Belajar & Kehadiran',
      notes: 'Siswa menyampaikan kendala belajar dan manajemen waktu.',
      solution: 'Membuat jadwal harian terstruktur dan pendampingan wali kelas.',
      parentInvolved: false,
      followUpPlan: 'Evaluasi perkembangan 2 pekan mendatang.',
      status: 'Selesai'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (s: CounselingSession, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedSession(s);
    setFormData(s);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (s: CounselingSession) => {
    setSelectedSession(s);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (s: CounselingSession, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedSession(s);
    setIsDeleteOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.topic || !formData.notes) {
      alert('Mohon lengkapi nama siswa, topik pembinaan, dan catatan konseling.');
      return;
    }

    const student = students.find(st => st.id === formData.studentId);

    if (selectedSession) {
      await updateCounselingSession(selectedSession.id, {
        ...formData,
        studentName: student?.fullName || formData.studentName,
        studentClass: student?.className || formData.studentClass
      });
    } else {
      await addCounselingSession({
        studentId: formData.studentId!,
        studentName: student?.fullName || 'Siswa',
        studentClass: student?.className || '',
        date: formData.date!,
        counselorName: formData.counselorName || currentUser?.displayName || 'Guru BK',
        topic: formData.topic!,
        notes: formData.notes!,
        solution: formData.solution || '',
        parentInvolved: Boolean(formData.parentInvolved),
        followUpPlan: formData.followUpPlan || '',
        status: (formData.status as any) || 'Selesai',
        academicYear: activeAcademicYear
      });
    }
    setIsFormOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (selectedSession) {
      await deleteCounselingSession(selectedSession.id);
      setIsDeleteOpen(false);
      setSelectedSession(null);
    }
  };

  const columns: Column<CounselingSession>[] = [
    {
      header: 'Nama Siswa & Kelas',
      accessorKey: 'studentName',
      sortable: true,
      cell: c => (
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100">{c.studentName}</p>
          <p className="text-[11px] text-slate-400">Kelas: {c.studentClass}</p>
        </div>
      )
    },
    {
      header: 'Topik / Masalah Pembinaan',
      accessorKey: 'topic',
      sortable: true,
      cell: c => (
        <div>
          <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">{c.topic}</span>
          <p className="text-[11px] text-slate-500 line-clamp-1">{c.solution}</p>
        </div>
      )
    },
    {
      header: 'Tanggal & Konselor',
      accessorKey: 'date',
      sortable: true,
      cell: c => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800 dark:text-slate-200">📅 {c.date}</span>
          <p className="text-[11px] text-slate-400">Konselor: {c.counselorName}</p>
        </div>
      )
    },
    {
      header: 'Keterlibatan Orang Tua',
      accessorKey: 'parentInvolved',
      cell: c => (
        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
          c.parentInvolved ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-100 text-slate-500'
        }`}>
          {c.parentInvolved ? '✓ Bersama Ortu' : 'Siswa Saja'}
        </span>
      )
    },
    {
      header: 'Status Pembinaan',
      accessorKey: 'status',
      sortable: true,
      cell: c => <StatusBadge status={c.status} />
    },
    {
      header: 'Aksi',
      className: 'text-right',
      cell: c => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => handleOpenDetail(c)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={e => handleOpenEdit(c, e)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={e => handleOpenDelete(c, e)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
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
            Bimbingan Konseling & Pembinaan Siswa
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Layanan konseling individual, pembinaan kedisiplinan, mediasi wali murid, dan rencana tindak lanjut.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportActions
            filename="rekam_bimbingan_konseling"
            title="Laporan Bimbingan Konseling Siswa"
            data={filteredSessions}
            headers={[
              { header: 'Nama Siswa', key: 'studentName' },
              { header: 'Kelas', key: 'studentClass' },
              { header: 'Topik Konseling', key: 'topic' },
              { header: 'Tanggal', key: 'date' },
              { header: 'Konselor', key: 'counselorName' },
              { header: 'Hasil / Solusi', key: 'solution' },
              { header: 'Rencana Lanjut', key: 'followUpPlan' },
              { header: 'Status', key: 'status' }
            ]}
          />

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>+ Sesi Konseling</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500 font-semibold">
          <Filter className="w-4 h-4" />
          <span>Filter Status:</span>
        </div>

        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium"
        >
          <option value="all">Semua Status Sesi</option>
          <option value="Dijadwalkan">Dijadwalkan</option>
          <option value="Berlangsung">Sedang Berlangsung</option>
          <option value="Selesai">Selesai</option>
          <option value="Perlu Tindak Lanjut">Perlu Tindak Lanjut</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        id="counseling-table"
        data={filteredSessions}
        columns={columns}
        searchPlaceholder="Cari siswa, topik konseling, atau konselor..."
        searchableKeys={['studentName', 'topic', 'counselorName', 'solution']}
        onRowClick={handleOpenDetail}
      />

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedSession ? 'Edit Rekam Konseling' : 'Catat Sesi Bimbingan Konseling Baru'}
        subtitle="Dokumentasi layanan BK dan kesepakatan pembinaan siswa"
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
              Simpan Rekam Konseling
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pilih Siswa Terbimbing *
            </label>
            <select
              value={formData.studentId}
              onChange={e => {
                const st = students.find(s => s.id === e.target.value);
                setFormData({
                  ...formData,
                  studentId: e.target.value,
                  studentName: st?.fullName || '',
                  studentClass: st?.className || ''
                });
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.className})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Topik Pembahasan / Masalah *
            </label>
            <input
              type="text"
              required
              value={formData.topic}
              onChange={e => setFormData({ ...formData, topic: e.target.value })}
              placeholder="Contoh: Konseling Keterlambatan Berulang & Penurunan Nilai"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Sesi *
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
                Konselor / Guru BK
              </label>
              <input
                type="text"
                value={formData.counselorName}
                onChange={e => setFormData({ ...formData, counselorName: e.target.value })}
                placeholder="Nama Konselor"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status Sesi
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="Dijadwalkan">Dijadwalkan</option>
                <option value="Berlangsung">Sedang Berlangsung</option>
                <option value="Selesai">Selesai</option>
                <option value="Perlu Tindak Lanjut">Perlu Tindak Lanjut</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Dinamika Masalah & Penjelasan Siswa *
            </label>
            <textarea
              rows={3}
              required
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Catatan wawancara konseling..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kesepakatan / Solusi Pembinaan
              </label>
              <textarea
                rows={2}
                value={formData.solution}
                onChange={e => setFormData({ ...formData, solution: e.target.value })}
                placeholder="Rencana perbaikan sikap siswa..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rencana Tindak Lanjut (Follow-Up)
              </label>
              <textarea
                rows={2}
                value={formData.followUpPlan}
                onChange={e => setFormData({ ...formData, followUpPlan: e.target.value })}
                placeholder="Evaluasi berkala bersama wali kelas..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="parentInvolved"
              checked={formData.parentInvolved}
              onChange={e => setFormData({ ...formData, parentInvolved: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="parentInvolved" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Menghadirkan Orang Tua / Wali Murid dalam Sesi Ini
            </label>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {selectedSession && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Rekam Konseling: ${selectedSession.studentName}`}
          subtitle={`Kelas: ${selectedSession.studentClass} • Tanggal: ${selectedSession.date}`}
          maxWidth="md"
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
                <span className="font-bold text-indigo-600">{selectedSession.topic}</span>
                <StatusBadge status={selectedSession.status} />
              </div>
              <p><strong>Konselor:</strong> {selectedSession.counselorName}</p>
              <p><strong>Keterlibatan Ortu:</strong> {selectedSession.parentInvolved ? 'Ya (Hadir)' : 'Tidak'}</p>
              <p className="mt-2"><strong>Catatan Konseling:</strong> {selectedSession.notes}</p>
              <p><strong>Solusi & Komitmen:</strong> {selectedSession.solution || '-'}</p>
              <p><strong>Rencana Lanjut:</strong> {selectedSession.followUpPlan || '-'}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Rekam Konseling"
        message={`Apakah Anda yakin ingin menghapus catatan konseling siswa ${selectedSession?.studentName}?`}
        confirmText="Hapus Sesi"
      />
    </div>
  );
};
