import React, { useState } from 'react';
import {
  ShieldAlert,
  Plus,
  AlertTriangle,
  HeartHandshake,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Filter,
  User
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { Violation, ViolationCategory, ViolationStatus } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';

interface ViolationsPageProps {
  onReferToCounseling?: (violation: Violation) => void;
}

export const ViolationsPage: React.FC<ViolationsPageProps> = ({ onReferToCounseling }) => {
  const { isWakaOrAdmin, currentUser } = useAuth();
  const {
    violations,
    students,
    teachers,
    addViolation,
    updateViolation,
    deleteViolation,
    activeAcademicYear
  } = useSchool();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);

  const [formData, setFormData] = useState<Partial<Violation>>({
    studentId: '',
    studentName: '',
    studentNis: '',
    studentClass: '',
    violationType: '',
    category: 'Ringan',
    points: 5,
    date: new Date().toISOString().split('T')[0],
    description: '',
    actionTaken: 'Teguran lisan dan pencatatan dalam buku saku kedisiplinan',
    officerName: currentUser?.displayName || 'Guru Piket',
    status: 'Diproses'
  });

  const filteredViolations = violations.filter(v => {
    if (selectedCategory !== 'all' && v.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && v.status !== selectedStatus) return false;
    return true;
  });

  const handleOpenAdd = () => {
    setSelectedViolation(null);
    const defaultStudent = students[0];
    setFormData({
      studentId: defaultStudent?.id || '',
      studentName: defaultStudent?.fullName || '',
      studentNis: defaultStudent?.nis || '',
      studentClass: defaultStudent?.className || '',
      violationType: 'Keterlambatan Masuk Sekolah (>15 Menit)',
      category: 'Ringan',
      points: 5,
      date: new Date().toISOString().split('T')[0],
      description: 'Terlambat hadir di sekolah tanpa surat keterangan resmi.',
      actionTaken: 'Teguran lisan dan pembinaan oleh tim piket.',
      officerName: currentUser?.displayName || 'Tim Ketertiban Kesiswaan',
      status: 'Diproses'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (v: Violation, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedViolation(v);
    setFormData(v);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (v: Violation) => {
    setSelectedViolation(v);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (v: Violation, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedViolation(v);
    setIsDeleteOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.violationType) {
      alert('Mohon pilih siswa dan jenis pelanggaran.');
      return;
    }

    const student = students.find(s => s.id === formData.studentId);

    if (selectedViolation) {
      await updateViolation(selectedViolation.id, {
        ...formData,
        studentName: student?.fullName || formData.studentName,
        studentNis: student?.nis || formData.studentNis,
        studentClass: student?.className || formData.studentClass
      });
    } else {
      await addViolation({
        studentId: formData.studentId!,
        studentName: student?.fullName || 'Siswa',
        studentNis: student?.nis || '',
        studentClass: student?.className || '',
        violationType: formData.violationType!,
        category: formData.category as ViolationCategory,
        points: Number(formData.points) || 5,
        date: formData.date!,
        description: formData.description || '',
        actionTaken: formData.actionTaken || 'Teguran',
        officerName: formData.officerName || currentUser?.displayName || 'Guru Piket',
        status: (formData.status as ViolationStatus) || 'Diproses',
        academicYear: activeAcademicYear
      });
    }
    setIsFormOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (selectedViolation) {
      await deleteViolation(selectedViolation.id);
      setIsDeleteOpen(false);
      setSelectedViolation(null);
    }
  };

  const columns: Column<Violation>[] = [
    {
      header: 'Nama Siswa & NIS',
      accessorKey: 'studentName',
      sortable: true,
      cell: v => (
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100">{v.studentName}</p>
          <p className="text-[11px] text-slate-400">NIS: {v.studentNis} • Kelas: {v.studentClass}</p>
        </div>
      )
    },
    {
      header: 'Bentuk Pelanggaran',
      accessorKey: 'violationType',
      sortable: true,
      cell: v => (
        <div>
          <span className="font-bold text-xs text-rose-600 dark:text-rose-400">{v.violationType}</span>
          <p className="text-[11px] text-slate-500 line-clamp-1">{v.description}</p>
        </div>
      )
    },
    {
      header: 'Kategori & Poin',
      accessorKey: 'points',
      sortable: true,
      cell: v => (
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-extrabold text-xs border border-rose-200 dark:border-rose-800">
            +{v.points} Poin
          </span>
          <span className="text-[11px] text-slate-500 font-medium">({v.category})</span>
        </div>
      )
    },
    {
      header: 'Tindakan & Petugas',
      accessorKey: 'actionTaken',
      cell: v => (
        <div className="text-xs">
          <p className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[200px]">{v.actionTaken}</p>
          <p className="text-[10px] text-slate-400">Dicatat: {v.officerName} • {v.date}</p>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: v => <StatusBadge status={v.status} />
    },
    {
      header: 'Aksi',
      className: 'text-right',
      cell: v => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          {onReferToCounseling && v.status !== 'Selesai' && (
            <button
              onClick={() => onReferToCounseling(v)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 flex items-center gap-1"
              title="Rujuk ke Bimbingan Konseling"
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Rujuk BK</span>
            </button>
          )}
          <button
            onClick={() => handleOpenDetail(v)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800"
          >
            <Eye className="w-4 h-4" />
          </button>
          {isWakaOrAdmin && (
            <>
              <button
                onClick={e => handleOpenEdit(v, e)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={e => handleOpenDelete(v, e)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
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
            Pelanggaran Siswa & Buku Poin Kedisiplinan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sistem akumulasi poin pelanggaran tata tertib, pemantauan kedisiplinan, dan integrasi rujukan BK.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportActions
            filename="buku_pelanggaran_siswa"
            title="Laporan Pelanggaran Kedisiplinan Siswa"
            data={filteredViolations}
            headers={[
              { header: 'Nama Siswa', key: 'studentName' },
              { header: 'NIS', key: 'studentNis' },
              { header: 'Kelas', key: 'studentClass' },
              { header: 'Bentuk Pelanggaran', key: 'violationType' },
              { header: 'Kategori', key: 'category' },
              { header: 'Poin', key: 'points' },
              { header: 'Tanggal', key: 'date' },
              { header: 'Tindakan', key: 'actionTaken' },
              { header: 'Petugas', key: 'officerName' },
              { header: 'Status', key: 'status' }
            ]}
          />

          {isWakaOrAdmin && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>+ Catat Pelanggaran</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500 font-semibold">
          <Filter className="w-4 h-4" />
          <span>Filter Pelanggaran:</span>
        </div>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium"
        >
          <option value="all">Semua Kategori Pelanggaran</option>
          <option value="Ringan">Ringan (5-10 Poin)</option>
          <option value="Sedang">Sedang (15-25 Poin)</option>
          <option value="Berat">Berat (30-50 Poin)</option>
          <option value="Sangat Berat">Sangat Berat (&gt;50 Poin)</option>
        </select>

        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium"
        >
          <option value="all">Semua Status Tindak Lanjut</option>
          <option value="Diproses">Diproses</option>
          <option value="Dalam Pembinaan">Dalam Pembinaan BK</option>
          <option value="Selesai">Selesai</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        id="violations-table"
        data={filteredViolations}
        columns={columns}
        searchPlaceholder="Cari nama siswa, jenis pelanggaran, atau petugas..."
        searchableKeys={['studentName', 'studentNis', 'violationType', 'description', 'officerName']}
        onRowClick={handleOpenDetail}
        emptyTitle="Tidak Ada Catatan Pelanggaran"
        emptySubtitle="Semua siswa mematuhi tata tertib sekolah."
      />

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedViolation ? 'Edit Catatan Pelanggaran' : 'Catat Pelanggaran Tata Tertib'}
        subtitle="Masukkan rincian pelanggaran dan tetapkan bobot poin sesuai tata tertib resmi"
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
              className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20"
            >
              Simpan Pelanggaran
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pilih Siswa *
            </label>
            <select
              value={formData.studentId}
              onChange={e => {
                const s = students.find(st => st.id === e.target.value);
                setFormData({
                  ...formData,
                  studentId: e.target.value,
                  studentName: s?.fullName || '',
                  studentNis: s?.nis || '',
                  studentClass: s?.className || ''
                });
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.fullName} (NIS: {s.nis} • {s.className})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bentuk / Jenis Pelanggaran *
            </label>
            <input
              type="text"
              required
              value={formData.violationType}
              onChange={e => setFormData({ ...formData, violationType: e.target.value })}
              placeholder="Contoh: Merokok / Membolos Jam Pelajaran / Seragam Tidak Rapi"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori
              </label>
              <select
                value={formData.category}
                onChange={e => {
                  const cat = e.target.value as ViolationCategory;
                  const pts = cat === 'Ringan' ? 5 : cat === 'Sedang' ? 15 : cat === 'Berat' ? 30 : 75;
                  setFormData({ ...formData, category: cat, points: pts });
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="Ringan">Ringan</option>
                <option value="Sedang">Sedang</option>
                <option value="Berat">Berat</option>
                <option value="Sangat Berat">Sangat Berat</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bobot Poin (+)*
              </label>
              <input
                type="number"
                required
                value={formData.points}
                onChange={e => setFormData({ ...formData, points: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-rose-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Kejadian
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kronologi / Deskripsi Kejadian
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Jelaskan kronologi kejadian pelanggaran..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tindakan Langsung / Sanksi
              </label>
              <input
                type="text"
                value={formData.actionTaken}
                onChange={e => setFormData({ ...formData, actionTaken: e.target.value })}
                placeholder="Contoh: Pemanggilan wali kelas & surat peringatan"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status Penanganan
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="Diproses">Diproses</option>
                <option value="Dalam Pembinaan">Dalam Pembinaan BK</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {selectedViolation && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Catatan Pelanggaran: ${selectedViolation.studentName}`}
          subtitle={`NIS: ${selectedViolation.studentNis} • Kelas: ${selectedViolation.studentClass}`}
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
                <span className="font-bold text-rose-600">+{selectedViolation.points} Poin ({selectedViolation.category})</span>
                <StatusBadge status={selectedViolation.status} />
              </div>
              <p><strong>Bentuk Pelanggaran:</strong> {selectedViolation.violationType}</p>
              <p><strong>Tanggal Kejadian:</strong> {selectedViolation.date}</p>
              <p><strong>Petugas Pencatat:</strong> {selectedViolation.officerName}</p>
              <p><strong>Tindakan Diberikan:</strong> {selectedViolation.actionTaken}</p>
              <p className="mt-2"><strong>Kronologi:</strong> {selectedViolation.description || '-'}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Catatan Pelanggaran"
        message={`Apakah Anda yakin ingin menghapus pelanggaran siswa ${selectedViolation?.studentName}? Poin disiplin siswa akan dikurangi kembali.`}
        confirmText="Hapus Pelanggaran"
      />
    </div>
  );
};
