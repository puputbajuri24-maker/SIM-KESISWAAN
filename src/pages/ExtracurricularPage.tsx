import React, { useState } from 'react';
import {
  Compass,
  Plus,
  Users,
  Calendar,
  Clock,
  MapPin,
  Edit2,
  Trash2,
  Target,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { Extracurricular, ExtracurricularCategory } from '../types';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';

interface ExtracurricularPageProps {
  onNavigateToMembers?: (ekskulId: string) => void;
}

export const ExtracurricularPage: React.FC<ExtracurricularPageProps> = ({ onNavigateToMembers }) => {
  const { isWakaOrAdmin, isPembina, currentUser } = useAuth();
  const { extracurriculars, teachers, addExtracurricular, updateExtracurricular, deleteExtracurricular, members } = useSchool();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEkskul, setSelectedEkskul] = useState<Extracurricular | null>(null);

  const [formData, setFormData] = useState<Partial<Extracurricular>>({
    name: '',
    category: 'Olahraga',
    description: '',
    coachId: '',
    coachName: '',
    assistantCoachName: '',
    day: 'Senin',
    startTime: '15:30',
    endTime: '17:00',
    location: '',
    quota: 40,
    status: 'Aktif',
    vision: '',
    mission: '',
    target: '',
    academicYear: '2026/2027'
  });

  const categories: ExtracurricularCategory[] = [
    'Olahraga',
    'Seni',
    'Keagamaan',
    'Akademik',
    'Kepemimpinan',
    'Sosial',
    'Bela Negara',
    'Teknologi'
  ];

  const filteredEkskul = extracurriculars.filter(e => {
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
    return true;
  });

  const handleOpenAdd = () => {
    setSelectedEkskul(null);
    setFormData({
      name: '',
      category: 'Olahraga',
      description: '',
      coachId: teachers[0]?.id || '',
      coachName: teachers[0]?.fullName || '',
      assistantCoachName: '',
      day: 'Jumat',
      startTime: '15:30',
      endTime: '17:30',
      location: 'Lapangan Utama',
      quota: 40,
      status: 'Aktif',
      vision: 'Membentuk karakter disiplin dan berprestasi.',
      mission: '1. Latihan rutin berkala. 2. Partisipasi kompetisi resmi.',
      target: 'Meraih juara di tingkat Kota dan Provinsi.',
      academicYear: '2026/2027'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (ekskul: Extracurricular, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedEkskul(ekskul);
    setFormData(ekskul);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (ekskul: Extracurricular) => {
    setSelectedEkskul(ekskul);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (ekskul: Extracurricular, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedEkskul(ekskul);
    setIsDeleteOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      alert('Mohon isi nama dan kategori ekstrakurikuler.');
      return;
    }

    if (selectedEkskul) {
      await updateExtracurricular(selectedEkskul.id, formData);
    } else {
      await addExtracurricular({
        name: formData.name!,
        category: formData.category as ExtracurricularCategory,
        description: formData.description || '',
        coachId: formData.coachId || 'user_coach',
        coachName: formData.coachName || 'Pembina Terpilih',
        assistantCoachName: formData.assistantCoachName || '',
        day: (formData.day as any) || 'Jumat',
        startTime: formData.startTime || '15:30',
        endTime: formData.endTime || '17:00',
        location: formData.location || 'Sekolah',
        quota: Number(formData.quota) || 40,
        memberCount: 0,
        status: (formData.status as any) || 'Aktif',
        vision: formData.vision || '',
        mission: formData.mission || '',
        target: formData.target || '',
        academicYear: formData.academicYear || '2026/2027'
      });
    }
    setIsFormOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (selectedEkskul) {
      await deleteExtracurricular(selectedEkskul.id);
      setIsDeleteOpen(false);
      setSelectedEkskul(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Manajemen Ekstrakurikuler
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Daftar profil klub ekstrakurikuler, visi misi, target kegiatan, pembina, dan kuota anggota.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportActions
            filename="daftar_ekstrakurikuler"
            title="Daftar Ekstrakurikuler Sekolah"
            data={filteredEkskul}
            headers={[
              { header: 'Nama Ekstrakurikuler', key: 'name' },
              { header: 'Kategori', key: 'category' },
              { header: 'Guru Pembina', key: 'coachName' },
              { header: 'Hari', key: 'day' },
              { header: 'Jam Mulai', key: 'startTime' },
              { header: 'Jam Selesai', key: 'endTime' },
              { header: 'Lokasi', key: 'location' },
              { header: 'Jumlah Anggota', key: 'memberCount' },
              { header: 'Status', key: 'status' }
            ]}
          />

          {isWakaOrAdmin && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Ekskul</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-semibold">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-xl border transition-colors whitespace-nowrap ${
            selectedCategory === 'all'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          Semua Kategori ({extracurriculars.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl border transition-colors whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            {cat} ({extracurriculars.filter(e => e.category === cat).length})
          </button>
        ))}
      </div>

      {/* Grid of Extracurricular Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEkskul.map(ekskul => {
          const currentMembersCount = members.filter(m => m.extracurricularId === ekskul.id && m.status === 'Aktif').length;
          const quotaPercent = Math.min(100, Math.round((currentMembersCount / (ekskul.quota || 40)) * 100));

          return (
            <div
              key={ekskul.id}
              onClick={() => handleOpenDetail(ekskul)}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col cursor-pointer group"
            >
              {/* Card Header with Category Pill & Status */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-2 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/40 dark:to-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center font-extrabold text-lg text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
                    {ekskul.name.charAt(0)}
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {ekskul.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mt-1">
                      {ekskul.name}
                    </h3>
                  </div>
                </div>
                <StatusBadge status={ekskul.status} />
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 space-y-4 text-xs">
                <p className="text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {ekskul.description}
                </p>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-slate-400 font-medium">Pembina:</span>
                    <span className="font-bold">{ekskul.coachName}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-slate-400 font-medium">Jadwal:</span>
                    <span className="font-semibold">{ekskul.day}, {ekskul.startTime} - {ekskul.endTime}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-slate-400 font-medium">Lokasi:</span>
                    <span className="font-semibold truncate max-w-[150px]">{ekskul.location}</span>
                  </div>
                </div>

                {/* Quota Progress */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                    <span>Anggota Terdaftar</span>
                    <span>{currentMembersCount} / {ekskul.quota} Siswa ({quotaPercent}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        quotaPercent >= 90 ? 'bg-rose-500' : quotaPercent >= 50 ? 'bg-indigo-600' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${quotaPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => onNavigateToMembers && onNavigateToMembers(ekskul.id)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Users className="w-4 h-4" />
                  <span>Kelola Anggota ({currentMembersCount})</span>
                </button>

                {isWakaOrAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={e => handleOpenEdit(ekskul, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Ekskul"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={e => handleOpenDelete(ekskul, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                      title="Hapus Ekskul"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Modal (Add / Edit) */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedEkskul ? 'Edit Profil Ekstrakurikuler' : 'Tambah Ekstrakurikuler Baru'}
        subtitle="Kelola parameter pembinaan, visi misi, target capaian, dan jadwal"
        maxWidth="2xl"
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
              className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
            >
              Simpan Ekstrakurikuler
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Ekstrakurikuler *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Robotik & AI Club"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori *
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as ExtracurricularCategory })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Deskripsi Singkat
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi tujuan dan ruang lingkup kegiatan..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Guru Pembina Utama *
              </label>
              <select
                value={formData.coachName}
                onChange={e => {
                  const targetTeacher = teachers.find(t => t.fullName === e.target.value);
                  setFormData({
                    ...formData,
                    coachName: e.target.value,
                    coachId: targetTeacher?.id || 'coach_id'
                  });
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.fullName}>
                    {t.fullName} ({t.subject})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Wakil Pembina / Pelatih Luar
              </label>
              <input
                type="text"
                value={formData.assistantCoachName}
                onChange={e => setFormData({ ...formData, assistantCoachName: e.target.value })}
                placeholder="Nama Pelatih Teknis (opsional)"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hari Latihan
              </label>
              <select
                value={formData.day}
                onChange={e => setFormData({ ...formData, day: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Senin">Senin</option>
                <option value="Selasa">Selasa</option>
                <option value="Rabu">Rabu</option>
                <option value="Kamis">Kamis</option>
                <option value="Jumat">Jumat</option>
                <option value="Sabtu">Sabtu</option>
                <option value="Minggu">Minggu</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jam Mulai
              </label>
              <input
                type="text"
                value={formData.startTime}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                placeholder="15:30"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jam Selesai
              </label>
              <input
                type="text"
                value={formData.endTime}
                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                placeholder="17:00"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kuota Siswa
              </label>
              <input
                type="number"
                value={formData.quota}
                onChange={e => setFormData({ ...formData, quota: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Lokasi / Tempat Latihan
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="Contoh: Gelanggang Olahraga / Lab Komputer 3"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Capaian Kegiatan
            </label>
            <input
              type="text"
              value={formData.target}
              onChange={e => setFormData({ ...formData, target: e.target.value })}
              placeholder="Target prestasi atau capaian dalam tahun ajaran ini..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {selectedEkskul && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Profil Ekstrakurikuler: ${selectedEkskul.name}`}
          subtitle={`Kategori: ${selectedEkskul.category} | Pembina: ${selectedEkskul.coachName}`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                onClick={() => {
                  setIsDetailOpen(false);
                  if (onNavigateToMembers) onNavigateToMembers(selectedEkskul.id);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
              >
                <Users className="w-4 h-4" />
                <span>Lihat & Kelola Daftar Anggota</span>
              </button>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-white"
              >
                Tutup
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60">
              <p className="font-bold text-indigo-900 dark:text-indigo-200 mb-1">🎯 Target Capaian Tahun Ini:</p>
              <p className="text-indigo-800 dark:text-indigo-300 leading-relaxed font-medium">{selectedEkskul.target}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
                <p className="font-bold text-slate-500 uppercase tracking-wider">Informasi Operasional</p>
                <p><strong>Hari & Jam:</strong> {selectedEkskul.day}, {selectedEkskul.startTime} - {selectedEkskul.endTime}</p>
                <p><strong>Lokasi:</strong> {selectedEkskul.location}</p>
                <p><strong>Pembina Utama:</strong> {selectedEkskul.coachName}</p>
                <p><strong>Wakil Pembina:</strong> {selectedEkskul.assistantCoachName || '-'}</p>
                <p><strong>Kapasitas Kuota:</strong> {selectedEkskul.quota} Siswa</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
                <p className="font-bold text-slate-500 uppercase tracking-wider">Visi & Misi</p>
                <p><strong>Visi:</strong> {selectedEkskul.vision}</p>
                <p className="mt-2"><strong>Misi:</strong> {selectedEkskul.mission}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Ekstrakurikuler"
        message={`Apakah Anda yakin ingin menghapus ekstrakurikuler ${selectedEkskul?.name}? Data anggota dan jadwal terkait akan ikut disesuaikan.`}
        confirmText="Hapus Ekskul"
      />
    </div>
  );
};
