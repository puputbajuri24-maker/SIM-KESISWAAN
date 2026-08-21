import React, { useState } from 'react';
import {
  Award,
  Plus,
  Trophy,
  Calendar,
  Sparkles,
  Edit2,
  Trash2,
  Eye,
  Filter,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { Achievement, AchievementLevel, AchievementCategory } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';

export const AchievementsPage: React.FC = () => {
  const { isWakaOrAdmin, currentUser } = useAuth();
  const {
    achievements,
    students,
    extracurriculars,
    addAchievement,
    updateAchievement,
    deleteAchievement,
    activeAcademicYear
  } = useSchool();

  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const [formData, setFormData] = useState<Partial<Achievement>>({
    title: '',
    studentId: '',
    studentName: '',
    studentNis: '',
    studentClass: '',
    extracurricularId: '',
    extracurricularName: '',
    category: 'Olahraga',
    level: 'Kota/Kabupaten',
    rank: 'Juara 1',
    organizer: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    pointsAwarded: 20
  });

  const levels: AchievementLevel[] = [
    'Sekolah',
    'Kecamatan',
    'Kota/Kabupaten',
    'Provinsi',
    'Nasional',
    'Internasional'
  ];

  const filteredAchievements = achievements.filter(a => {
    if (selectedLevel !== 'all' && a.level !== selectedLevel) return false;
    if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
    return true;
  });

  const handleOpenAdd = () => {
    setSelectedAchievement(null);
    const defaultStudent = students[0];
    setFormData({
      title: '',
      studentId: defaultStudent?.id || '',
      studentName: defaultStudent?.fullName || '',
      studentNis: defaultStudent?.nis || '',
      studentClass: defaultStudent?.className || '',
      extracurricularId: extracurriculars[0]?.id || '',
      extracurricularName: extracurriculars[0]?.name || '',
      category: 'Olahraga',
      level: 'Kota/Kabupaten',
      rank: 'Juara 1',
      organizer: 'Dinas Pendidikan & Olahraga',
      date: new Date().toISOString().split('T')[0],
      description: 'Meraih medali emas setelah mengalahkan perwakilan sekolah lainnya.',
      pointsAwarded: 25
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (ach: Achievement, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedAchievement(ach);
    setFormData(ach);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (ach: Achievement) => {
    setSelectedAchievement(ach);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (ach: Achievement, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedAchievement(ach);
    setIsDeleteOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.studentId || !formData.organizer) {
      alert('Mohon isi nama prestasi/lomba, nama siswa, dan pihak penyelenggara.');
      return;
    }

    const student = students.find(s => s.id === formData.studentId);
    const ekskul = extracurriculars.find(e => e.id === formData.extracurricularId);

    if (selectedAchievement) {
      await updateAchievement(selectedAchievement.id, {
        ...formData,
        studentName: student?.fullName || formData.studentName,
        studentNis: student?.nis || formData.studentNis,
        studentClass: student?.className || formData.studentClass,
        extracurricularName: ekskul?.name || formData.extracurricularName
      });
    } else {
      await addAchievement({
        title: formData.title!,
        studentId: formData.studentId!,
        studentName: student?.fullName || 'Siswa',
        studentNis: student?.nis || '',
        studentClass: student?.className || '',
        extracurricularId: formData.extracurricularId || '',
        extracurricularName: ekskul?.name || 'Independen / Sekolah',
        category: formData.category as AchievementCategory,
        level: formData.level as AchievementLevel,
        rank: formData.rank!,
        organizer: formData.organizer!,
        date: formData.date!,
        description: formData.description || '',
        certificateUrl: formData.certificateUrl || '',
        pointsAwarded: Number(formData.pointsAwarded) || 20,
        academicYear: activeAcademicYear
      });
    }
    setIsFormOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (selectedAchievement) {
      await deleteAchievement(selectedAchievement.id, selectedAchievement.studentId, selectedAchievement.pointsAwarded);
      setIsDeleteOpen(false);
      setSelectedAchievement(null);
    }
  };

  const columns: Column<Achievement>[] = [
    {
      header: 'Prestasi & Kejuaraan',
      accessorKey: 'title',
      sortable: true,
      cell: a => (
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100">{a.title}</p>
          <p className="text-[11px] text-slate-400">
            {a.extracurricularName} • Penyelenggara: {a.organizer}
          </p>
        </div>
      )
    },
    {
      header: 'Peraih Prestasi (Siswa)',
      accessorKey: 'studentName',
      sortable: true,
      cell: a => (
        <div>
          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">{a.studentName}</span>
          <p className="text-[11px] text-slate-400">NIS: {a.studentNis} • Kelas: {a.studentClass}</p>
        </div>
      )
    },
    {
      header: 'Capaian & Tingkat',
      accessorKey: 'rank',
      sortable: true,
      cell: a => (
        <div className="text-xs">
          <span className="font-extrabold text-amber-600 dark:text-amber-400">🏆 {a.rank}</span>
          <p className="text-[11px] text-slate-500 font-medium">Tingkat {a.level}</p>
        </div>
      )
    },
    {
      header: 'Poin & Tanggal',
      accessorKey: 'pointsAwarded',
      sortable: true,
      cell: a => (
        <div className="text-xs">
          <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-900">
            +{a.pointsAwarded} Poin
          </span>
          <p className="text-[10px] text-slate-400 mt-1">📅 {a.date}</p>
        </div>
      )
    },
    {
      header: 'Aksi',
      className: 'text-right',
      cell: a => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => handleOpenDetail(a)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800"
          >
            <Eye className="w-4 h-4" />
          </button>
          {isWakaOrAdmin && (
            <>
              <button
                onClick={e => handleOpenEdit(a, e)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={e => handleOpenDelete(a, e)}
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
            Prestasi & Rekam Jejak Juara Siswa
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pendataan pencapaian kejuaraan akademik, festival seni, olahraga, dan penghargaan resmi kesiswaan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportActions
            filename="daftar_prestasi_siswa"
            title="Laporan Rekapitulasi Prestasi Siswa"
            data={filteredAchievements}
            headers={[
              { header: 'Nama Prestasi', key: 'title' },
              { header: 'Nama Siswa', key: 'studentName' },
              { header: 'NIS', key: 'studentNis' },
              { header: 'Kelas', key: 'studentClass' },
              { header: 'Peringkat', key: 'rank' },
              { header: 'Tingkat', key: 'level' },
              { header: 'Kategori', key: 'category' },
              { header: 'Penyelenggara', key: 'organizer' },
              { header: 'Tanggal', key: 'date' },
              { header: 'Poin Reward', key: 'pointsAwarded' }
            ]}
          />

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Prestasi</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500 font-semibold">
          <Filter className="w-4 h-4" />
          <span>Filter Prestasi:</span>
        </div>

        <select
          value={selectedLevel}
          onChange={e => setSelectedLevel(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium"
        >
          <option value="all">Semua Tingkat ({achievements.length})</option>
          {levels.map(lvl => (
            <option key={lvl} value={lvl}>
              Tingkat {lvl}
            </option>
          ))}
        </select>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium"
        >
          <option value="all">Semua Kategori</option>
          <option value="Akademik">Akademik</option>
          <option value="Olahraga">Olahraga</option>
          <option value="Seni">Seni & Budaya</option>
          <option value="Keagamaan">Keagamaan</option>
          <option value="Teknologi">Teknologi & Robotik</option>
          <option value="Kepemimpinan">Kepemimpinan</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        id="achievements-table"
        data={filteredAchievements}
        columns={columns}
        searchPlaceholder="Cari nama lomba, siswa, atau penyelenggara..."
        searchableKeys={['title', 'studentName', 'studentNis', 'organizer', 'rank']}
        onRowClick={handleOpenDetail}
      />

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedAchievement ? 'Edit Prestasi Siswa' : 'Catat Prestasi Baru'}
        subtitle="Data prestasi akan diverifikasi dan menambah poin penghargaan siswa"
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
              className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md"
            >
              Simpan Prestasi
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pilih Siswa Peraih Prestasi *
            </label>
            <select
              value={formData.studentId}
              onChange={e => {
                const st = students.find(s => s.id === e.target.value);
                setFormData({
                  ...formData,
                  studentId: e.target.value,
                  studentName: st?.fullName || '',
                  studentNis: st?.nis || '',
                  studentClass: st?.className || ''
                });
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.className} • NIS: {s.nis})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Lomba / Kejuaraan / Prestasi *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Juara 1 Olimpiade Sains Nasional (OSN) Bidang Informatika"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Peringkat Capaian *
              </label>
              <input
                type="text"
                required
                value={formData.rank}
                onChange={e => setFormData({ ...formData, rank: e.target.value })}
                placeholder="Juara 1 / Medali Emas"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tingkat Kejuaraan
              </label>
              <select
                value={formData.level}
                onChange={e => setFormData({ ...formData, level: e.target.value as AchievementLevel })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {levels.map(lvl => (
                  <option key={lvl} value={lvl}>
                    Tingkat {lvl}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as AchievementCategory })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="Akademik">Akademik</option>
                <option value="Olahraga">Olahraga</option>
                <option value="Seni">Seni & Budaya</option>
                <option value="Keagamaan">Keagamaan</option>
                <option value="Teknologi">Teknologi</option>
                <option value="Kepemimpinan">Kepemimpinan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pihak Penyelenggara *
              </label>
              <input
                type="text"
                required
                value={formData.organizer}
                onChange={e => setFormData({ ...formData, organizer: e.target.value })}
                placeholder="Kemendikbudristek / Pemprov"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Raihan
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
                Reward Poin Siswa (+)
              </label>
              <input
                type="number"
                value={formData.pointsAwarded}
                onChange={e => setFormData({ ...formData, pointsAwarded: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-amber-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kaitkan ke Ekstrakurikuler
            </label>
            <select
              value={formData.extracurricularId}
              onChange={e => {
                const eks = extracurriculars.find(ek => ek.id === e.target.value);
                setFormData({
                  ...formData,
                  extracurricularId: e.target.value,
                  extracurricularName: eks?.name || 'Independen / Sekolah'
                });
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="">Independen / Prestasi Sekolah</option>
              {extracurriculars.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan / Deskripsi Capaian
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi keikutsertaan lomba..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {selectedAchievement && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Detail Prestasi: ${selectedAchievement.title}`}
          subtitle={`${selectedAchievement.studentName} (${selectedAchievement.studentClass})`}
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
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-700 dark:text-amber-300 text-sm">
                  🏆 {selectedAchievement.rank} ({selectedAchievement.level})
                </span>
                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded font-bold">
                  +{selectedAchievement.pointsAwarded} Poin
                </span>
              </div>
              <p><strong>Kategori:</strong> {selectedAchievement.category}</p>
              <p><strong>Penyelenggara:</strong> {selectedAchievement.organizer}</p>
              <p><strong>Tanggal Raihan:</strong> {selectedAchievement.date}</p>
              <p><strong>Ekstrakurikuler Terkait:</strong> {selectedAchievement.extracurricularName}</p>
              <p className="mt-2"><strong>Deskripsi:</strong> {selectedAchievement.description || '-'}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Catatan Prestasi"
        message={`Apakah Anda yakin ingin menghapus catatan prestasi "${selectedAchievement?.title}"?`}
        confirmText="Hapus Prestasi"
      />
    </div>
  );
};
