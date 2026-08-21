import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Users,
  Compass,
  FileSpreadsheet,
  Award
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { Teacher } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';

export const TeachersPage: React.FC = () => {
  const { isWakaOrAdmin } = useAuth();
  const { teachers, extracurriculars, addTeacher, updateTeacher, deleteTeacher } = useSchool();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  const [formData, setFormData] = useState<Partial<Teacher>>({
    nip: '',
    fullName: '',
    role: 'Pembina Ekskul',
    phone: '',
    email: '',
    assignedExtracurriculars: [],
    isActive: true
  });

  const handleOpenAdd = () => {
    setSelectedTeacher(null);
    setFormData({
      nip: `1985${Math.floor(10000000 + Math.random() * 90000000)}`,
      fullName: '',
      role: 'Pembina Ekskul',
      phone: '081234567890',
      email: '',
      assignedExtracurriculars: [],
      isActive: true
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (t: Teacher, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedTeacher(t);
    setFormData(t);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (t: Teacher) => {
    setSelectedTeacher(t);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (t: Teacher, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedTeacher(t);
    setIsDeleteOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.role) {
      alert('Mohon lengkapi nama guru dan jabatan.');
      return;
    }

    if (selectedTeacher) {
      await updateTeacher(selectedTeacher.id, formData);
    } else {
      await addTeacher({
        nip: formData.nip || '-',
        fullName: formData.fullName!,
        role: formData.role!,
        phone: formData.phone || '',
        email: formData.email || '',
        assignedExtracurriculars: formData.assignedExtracurriculars || [],
        isActive: formData.isActive !== false
      });
    }
    setIsFormOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (selectedTeacher) {
      await deleteTeacher(selectedTeacher.id);
      setIsDeleteOpen(false);
      setSelectedTeacher(null);
    }
  };

  const columns: Column<Teacher>[] = [
    {
      header: 'Nama Guru / Pembina',
      accessorKey: 'fullName',
      sortable: true,
      cell: t => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
            {t.fullName.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100">{t.fullName}</p>
            <p className="text-[11px] text-slate-400">NIP: {t.nip}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Jabatan / Peran',
      accessorKey: 'role',
      sortable: true,
      cell: t => (
        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300">
          {t.role}
        </span>
      )
    },
    {
      header: 'Kontak & WhatsApp',
      accessorKey: 'phone',
      cell: t => (
        <div className="text-xs">
          <p className="text-slate-800 dark:text-slate-200 font-semibold">📞 {t.phone || '-'}</p>
          <p className="text-[11px] text-slate-400">✉️ {t.email || '-'}</p>
        </div>
      )
    },
    {
      header: 'Binaan Ekstrakurikuler',
      cell: t => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {t.assignedExtracurriculars && t.assignedExtracurriculars.length > 0 ? (
            t.assignedExtracurriculars.map((e, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold">
                {e}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-slate-400">-</span>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      sortable: true,
      cell: t => (
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
          t.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
        }`}>
          {t.isActive ? 'Aktif' : 'Nonaktif'}
        </span>
      )
    },
    {
      header: 'Aksi',
      className: 'text-right',
      cell: t => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => handleOpenDetail(t)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800"
          >
            <Eye className="w-4 h-4" />
          </button>
          {isWakaOrAdmin && (
            <>
              <button
                onClick={e => handleOpenEdit(t, e)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={e => handleOpenDelete(t, e)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
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
            Dewan Guru & Pembina Kesiswaan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Daftar guru pembina ekstrakurikuler, konselor BK, tim ketertiban, dan staf kesiswaan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportActions
            filename="daftar_guru_pembina"
            title="Daftar Guru Pembina Kesiswaan"
            data={teachers}
            headers={[
              { header: 'Nama Guru', key: 'fullName' },
              { header: 'NIP', key: 'nip' },
              { header: 'Jabatan / Peran', key: 'role' },
              { header: 'Telepon', key: 'phone' },
              { header: 'Email', key: 'email' }
            ]}
          />

          {isWakaOrAdmin && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Guru / Pembina</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <DataTable
        id="teachers-table"
        data={teachers}
        columns={columns}
        searchPlaceholder="Cari nama guru, NIP, atau ekstrakurikuler binaan..."
        searchableKeys={['fullName', 'nip', 'role', 'phone', 'email']}
        onRowClick={handleOpenDetail}
      />

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedTeacher ? 'Edit Data Guru / Pembina' : 'Tambah Guru / Pembina Baru'}
        subtitle="Data profil pembina dan penetapan unit ekstrakurikuler binaan"
        maxWidth="md"
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
              Simpan Data
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Lengkap & Gelar *
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Contoh: Drs. Bambang Sutrisno, M.Pd"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                NIP / NUPTK
              </label>
              <input
                type="text"
                value={formData.nip}
                onChange={e => setFormData({ ...formData, nip: e.target.value })}
                placeholder="19820415..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jabatan Kesiswaan *
              </label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              >
                <option value="Waka Kesiswaan">Waka Kesiswaan</option>
                <option value="Staff Kesiswaan">Staff Kesiswaan</option>
                <option value="Pembina Ekskul">Pembina Ekskul</option>
                <option value="Guru BK">Guru Bimbingan Konseling (BK)</option>
                <option value="Wali Kelas">Wali Kelas</option>
                <option value="Guru Piket">Guru Piket Ketertiban</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nomor WhatsApp
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08123456789"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="guru@sekolah.sch.id"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActiveTeacher"
              checked={formData.isActive}
              onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isActiveTeacher" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Status Pembina Aktif Mengajar
            </label>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {selectedTeacher && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Profil Guru: ${selectedTeacher.fullName}`}
          subtitle={`NIP: ${selectedTeacher.nip}`}
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
              <p><strong>Jabatan:</strong> {selectedTeacher.role}</p>
              <p><strong>Nomor Telepon / WA:</strong> {selectedTeacher.phone || '-'}</p>
              <p><strong>Email:</strong> {selectedTeacher.email || '-'}</p>
              <p><strong>Status:</strong> {selectedTeacher.isActive ? 'Aktif' : 'Nonaktif'}</p>
              <div className="mt-2">
                <p className="font-bold mb-1">Ekskul Binaan:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedTeacher.assignedExtracurriculars?.map((e, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-semibold text-[11px]">
                      {e}
                    </span>
                  )) || <span className="text-slate-400">-</span>}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Data Guru / Pembina"
        message={`Apakah Anda yakin ingin menghapus data ${selectedTeacher?.fullName}?`}
        confirmText="Hapus Guru"
      />
    </div>
  );
};
