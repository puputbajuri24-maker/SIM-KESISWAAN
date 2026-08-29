import React, { useState } from 'react';
import {
  Compass,
  Plus,
  Users,
  Calendar,
  Clock,
  MapPin,
  Eye,
  Edit2,
  Trash2,
  Target,
  Sparkles,
  ArrowRight,
  Filter,
  Zap,
  CheckCircle2,
  FileSpreadsheet,
  Award
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { Extracurricular, ExtracurricularCategory } from '../types';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';
import {
  EXTRACURRICULAR_PRESETS,
  ExtracurricularPreset,
  findMatchingTeacherForEkskul
} from '../utils/extracurricularPresets';

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
  const [activeTemplateFeedback, setActiveTemplateFeedback] = useState<string | null>(null);

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

  // Extract all extracurricular names found in uploaded / registered teachers data
  const teacherAssignedEkskulNames = Array.from(
    new Set(
      teachers.flatMap(t => [
        ...(t.assignedExtracurriculars || []),
        ...(t.extracurricularName ? [t.extracurricularName] : [])
      ]).filter(Boolean)
    )
  );

  const isPembinaOnly = isPembina && !isWakaOrAdmin;
  const myAssignedIds = currentUser?.extracurricularIds || [];

  const filteredEkskul = extracurriculars.filter(e => {
    if (isPembinaOnly) {
      const isAssigned = myAssignedIds.includes(e.id) || 
        e.coachId === currentUser?.uid || 
        (currentUser?.displayName && e.coachName?.toLowerCase().includes(currentUser.displayName.toLowerCase().split(' ')[0]));
      if (!isAssigned) return false;
    }
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
    return true;
  });

  // Handle auto-populating form when a preset / template is selected
  const handleSelectPreset = (presetName: string) => {
    setActiveTemplateFeedback(null);
    if (!presetName) return;

    // 1. Check in standard presets library
    const matchedPreset = EXTRACURRICULAR_PRESETS.find(
      p => p.name.toLowerCase() === presetName.toLowerCase() ||
           p.id.toLowerCase() === presetName.toLowerCase() ||
           p.name.toLowerCase().includes(presetName.toLowerCase())
    );

    // 2. Find matching teacher from database / uploaded teachers
    const matchedTeacher = findMatchingTeacherForEkskul(presetName, teachers);

    if (matchedPreset) {
      setFormData(prev => ({
        ...prev,
        name: matchedPreset.name,
        category: matchedPreset.category,
        description: matchedPreset.description,
        day: matchedPreset.defaultDay,
        startTime: matchedPreset.defaultStartTime,
        endTime: matchedPreset.defaultEndTime,
        location: matchedPreset.defaultLocation,
        quota: matchedPreset.defaultQuota,
        vision: matchedPreset.vision,
        mission: matchedPreset.mission,
        target: matchedPreset.target,
        coachId: matchedTeacher?.id || prev.coachId || (teachers[0]?.id || ''),
        coachName: matchedTeacher?.fullName || prev.coachName || (teachers[0]?.fullName || '')
      }));

      setActiveTemplateFeedback(
        `Template "${matchedPreset.name}" diterapkan!` +
        (matchedTeacher ? ` Guru Pembina otomatis dipilih: ${matchedTeacher.fullName}` : '')
      );
    } else {
      // If from custom uploaded teacher assigned string
      setFormData(prev => ({
        ...prev,
        name: presetName,
        coachId: matchedTeacher?.id || prev.coachId || (teachers[0]?.id || ''),
        coachName: matchedTeacher?.fullName || prev.coachName || (teachers[0]?.fullName || '')
      }));

      setActiveTemplateFeedback(
        `Ekstrakurikuler "${presetName}" dipilih.` +
        (matchedTeacher ? ` Guru Pembina otomatis dipilih: ${matchedTeacher.fullName}` : '')
      );
    }
  };

  const handleOpenAdd = () => {
    setSelectedEkskul(null);
    setActiveTemplateFeedback(null);

    // Pre-populate with first preset by default for instant ease
    const defaultPreset = EXTRACURRICULAR_PRESETS[0];
    const defaultTeacher = findMatchingTeacherForEkskul(defaultPreset.name, teachers) || teachers[0];

    setFormData({
      name: defaultPreset?.name || 'Pramuka (Gugus Depan)',
      category: defaultPreset?.category || 'Kepemimpinan',
      description: defaultPreset?.description || '',
      coachId: defaultTeacher?.id || '',
      coachName: defaultTeacher?.fullName || '',
      assistantCoachName: '',
      day: defaultPreset?.defaultDay || 'Jumat',
      startTime: defaultPreset?.defaultStartTime || '15:30',
      endTime: defaultPreset?.defaultEndTime || '17:30',
      location: defaultPreset?.defaultLocation || 'Lapangan Utama',
      quota: defaultPreset?.defaultQuota || 50,
      status: 'Aktif',
      vision: defaultPreset?.vision || 'Membentuk karakter disiplin dan berprestasi.',
      mission: defaultPreset?.mission || '1. Latihan rutin berkala. 2. Partisipasi kompetisi resmi.',
      target: defaultPreset?.target || 'Meraih juara di tingkat Kota dan Provinsi.',
      academicYear: '2026/2027'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (ekskul: Extracurricular, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedEkskul(ekskul);
    setActiveTemplateFeedback(null);
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

    try {
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
    } catch (err) {
      console.error('Error saving extracurricular:', err);
    } finally {
      setIsFormOpen(false);
      setSelectedEkskul(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedEkskul) {
      try {
        await deleteExtracurricular(selectedEkskul.id);
      } catch (err) {
        console.error('Error deleting extracurricular:', err);
      } finally {
        setIsDeleteOpen(false);
        setSelectedEkskul(null);
      }
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

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Ekskul</span>
          </button>
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

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenDetail(ekskul)}
                    className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-400 transition-colors"
                    title="Lihat Detail Profil & Anggota"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={e => handleOpenEdit(ekskul, e)}
                    className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:hover:bg-amber-900 dark:text-amber-400 transition-colors"
                    title="Edit Ekskul"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={e => handleOpenDelete(ekskul, e)}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-400 transition-colors"
                    title="Hapus Ekskul"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
        subtitle="Pilih dari template resmi atau sesuaikan parameter pembinaan, visi misi, dan jadwal"
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
          {/* Preset & Template Selector Section */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-slate-50 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900/40 border border-indigo-200/80 dark:border-indigo-800/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Pilih Jenis Ekstrakurikuler dari Template
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Langsung pilih jenis ekstrakurikuler & guru pembina tanpa perlu mengetik manual
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                Auto-Fill Aktif
              </span>
            </div>

            {/* Template Dropdown with Optgroups */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Katalog Template Resmi & Binaan Upload:
              </label>
              <select
                onChange={e => handleSelectPreset(e.target.value)}
                value={EXTRACURRICULAR_PRESETS.some(p => p.name === formData.name) ? formData.name : ''}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/80 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="">-- Pilih Template Ekstrakurikuler Sesuai Standar --</option>

                {/* 1. Ekstrakurikuler from Uploaded Teachers */}
                {teacherAssignedEkskulNames.length > 0 && (
                  <optgroup label="📥 Ekstrakurikuler Binaan Guru (Dari File Excel / Upload Guru)">
                    {teacherAssignedEkskulNames.map(name => (
                      <option key={`teacher_${name}`} value={name}>
                        ⭐ {name} (Tercatat di Data Guru)
                      </option>
                    ))}
                  </optgroup>
                )}

                {/* 2. Bela Negara & Kepemimpinan */}
                <optgroup label="🛡️ Bela Negara & Kepemimpinan">
                  {EXTRACURRICULAR_PRESETS.filter(p => p.category === 'Kepemimpinan' || p.category === 'Bela Negara' || p.category === 'Sosial').map(p => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </optgroup>

                {/* 3. Olahraga */}
                <optgroup label="⚽ Olahraga & Bela Diri">
                  {EXTRACURRICULAR_PRESETS.filter(p => p.category === 'Olahraga').map(p => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>

                {/* 4. Keagamaan */}
                <optgroup label="🕌 Keagamaan & Karakter">
                  {EXTRACURRICULAR_PRESETS.filter(p => p.category === 'Keagamaan').map(p => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>

                {/* 5. Akademik */}
                <optgroup label="🔬 Akademik & Bahasa">
                  {EXTRACURRICULAR_PRESETS.filter(p => p.category === 'Akademik').map(p => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>

                {/* 6. Teknologi */}
                <optgroup label="💻 Teknologi & Media">
                  {EXTRACURRICULAR_PRESETS.filter(p => p.category === 'Teknologi').map(p => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>

                {/* 7. Seni & Budaya */}
                <optgroup label="🎨 Seni & Budaya">
                  {EXTRACURRICULAR_PRESETS.filter(p => p.category === 'Seni').map(p => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Quick Preset Badges */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                Pilihan Cepat (1-Klik):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-0.5">
                {EXTRACURRICULAR_PRESETS.slice(0, 10).map(p => {
                  const isCurrent = formData.name?.toLowerCase().includes(p.name.toLowerCase().split(' ')[0]);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p.name)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 border ${
                        isCurrent
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30'
                      }`}
                    >
                      <span>{p.name.split('(')[0].trim()}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feedback Alert if template applied */}
            {activeTemplateFeedback && (
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>{activeTemplateFeedback}</span>
              </div>
            )}
          </div>

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
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Guru Pembina Utama *
                </label>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  (Pilih Langsung)
                </span>
              </div>
              <select
                value={formData.coachName}
                onChange={e => {
                  const targetTeacher = teachers.find(t => t.fullName === e.target.value);
                  setFormData({
                    ...formData,
                    coachName: e.target.value,
                    coachId: targetTeacher?.id || ''
                  });
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
              >
                <option value="">-- Pilih Guru Pembina dari Dewan Guru --</option>
                {teachers.map(t => {
                  const isAssigned = (t.assignedExtracurriculars || []).some(
                    item => item.toLowerCase() === formData.name?.toLowerCase()
                  );
                  return (
                    <option key={t.id} value={t.fullName}>
                      {t.fullName} {t.role ? `• ${t.role}` : ''} {t.subject ? `(${t.subject})` : ''} {isAssigned ? '⭐ [Ditugaskan]' : ''}
                    </option>
                  );
                })}
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
