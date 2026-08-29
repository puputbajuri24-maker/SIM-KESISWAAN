import React, { useState, useMemo, useRef } from 'react';
import {
  School,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Download,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  X,
  UserCheck,
  GraduationCap,
  Sparkles,
  BookOpen,
  HelpCircle,
  Table,
  CheckSquare
} from 'lucide-react';
import { useSchool } from '../../contexts/SchoolContext';
import { useAuth } from '../../contexts/AuthContext';
import { SchoolClass, Teacher } from '../../types';
import { Modal } from './Modal';
import { ConfirmDialog } from './ConfirmDialog';
import * as XLSX from 'xlsx';
import {
  downloadClassTemplateXLSX,
  downloadClassTemplateCSV,
  parseClassRows,
  ParsedImportClass
} from '../../utils/classTemplate';
import { calculateStudentCountsByClass } from '../../utils/classResolver';

interface ClassManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAJOR_PRESETS = [
  'Umum (Kurikulum Merdeka / Fase E)',
  'MIPA (Matematika & Ilmu Alam)',
  'IPS (Ilmu-Ilmu Sosial)',
  'Ilmu Keagamaan Islam (IIK)',
  'Bahasa & Budaya',
  'Teknik Komputer & Informatika',
  'Akuntansi & Keuangan',
  'Otomotif & Permesinan'
];

export const ClassManagementModal: React.FC<ClassManagementModalProps> = ({ isOpen, onClose }) => {
  const { isSuperAdmin, isWakaOrAdmin } = useAuth();
  const {
    classes,
    teachers,
    students,
    addClass,
    updateClass,
    deleteClass,
    deleteClassesBulk,
    importClassesBulk,
    clearAllClasses,
    schoolSetting
  } = useSchool();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<'all' | 'X' | 'XI' | 'XII'>('all');

  // Multi-Selection State
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Form State for Add / Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [formData, setFormData] = useState<Omit<SchoolClass, 'id'>>({
    name: '',
    grade: 'X',
    major: 'Umum (Kurikulum Merdeka / Fase E)',
    homeroomTeacher: 'Belum Ditentukan',
    studentCount: 0
  });

  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<SchoolClass | null>(null);

  // Clear All State
  const [isClearAllOpen, setIsClearAllOpen] = useState(false);

  // Import State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('replace');
  const [previewClasses, setPreviewClasses] = useState<ParsedImportClass[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate live student count per class
  const studentCounts = useMemo(() => {
    return calculateStudentCountsByClass(students, classes);
  }, [students, classes]);

  // Filtered classes
  const filteredClasses = useMemo(() => {
    return classes.filter(c => {
      if (selectedGrade !== 'all' && c.grade !== selectedGrade) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.major.toLowerCase().includes(q) ||
          c.homeroomTeacher.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [classes, selectedGrade, searchQuery]);

  // Handlers for Add / Edit
  const handleOpenAdd = () => {
    setSelectedClass(null);
    setFormData({
      name: '',
      grade: 'X',
      major: 'Umum (Kurikulum Merdeka / Fase E)',
      homeroomTeacher: teachers[0]?.fullName || 'Belum Ditentukan',
      studentCount: 0
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c: SchoolClass, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClass(c);
    setFormData({
      name: c.name,
      grade: c.grade,
      major: c.major,
      homeroomTeacher: c.homeroomTeacher || 'Belum Ditentukan',
      studentCount: c.studentCount || 0
    });
    setIsFormOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Nama Rombel Kelas wajib diisi.');
      return;
    }

    try {
      if (selectedClass) {
        await updateClass(selectedClass.id, {
          name: formData.name.trim(),
          grade: formData.grade,
          major: formData.major.trim(),
          homeroomTeacher: formData.homeroomTeacher
        });
      } else {
        await addClass({
          name: formData.name.trim(),
          grade: formData.grade,
          major: formData.major.trim(),
          homeroomTeacher: formData.homeroomTeacher,
          studentCount: 0
        });
      }
      setIsFormOpen(false);
      setSelectedClass(null);
    } catch (err: any) {
      alert('Gagal menyimpan rombel kelas: ' + err?.message);
    }
  };

  // Handlers for Delete
  const handleOpenDelete = (c: SchoolClass, e: React.MouseEvent) => {
    e.stopPropagation();
    setClassToDelete(c);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!classToDelete) return;
    try {
      await deleteClass(classToDelete.id);
      setIsDeleteOpen(false);
      setClassToDelete(null);
    } catch (err: any) {
      alert('Gagal menghapus rombel kelas: ' + err?.message);
    }
  };

  // Bulk Delete Handlers
  const handleToggleSelectClass = (id: string) => {
    setSelectedClassIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAllClasses = () => {
    if (selectedClassIds.size === filteredClasses.length && filteredClasses.length > 0) {
      setSelectedClassIds(new Set());
    } else {
      setSelectedClassIds(new Set(filteredClasses.map(c => c.id)));
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedClassIds.size === 0) return;
    try {
      await deleteClassesBulk(Array.from(selectedClassIds));
      setSelectedClassIds(new Set());
      setIsBulkDeleteOpen(false);
    } catch (err: any) {
      alert('Gagal menghapus kelas terpilih: ' + err?.message);
    }
  };

  // Clear All Classes
  const handleClearAllConfirm = async () => {
    try {
      await clearAllClasses();
      setIsClearAllOpen(false);
    } catch (err: any) {
      alert('Gagal membersihkan data kelas: ' + err?.message);
    }
  };

  // Export Classes to Excel
  const handleExportExcel = () => {
    const exportData = classes.map((c, idx) => ({
      'No': idx + 1,
      'Nama Rombel': c.name,
      'Tingkat': c.grade,
      'Jurusan / Peminatan': c.major,
      'Wali Kelas': c.homeroomTeacher || 'Belum Ditentukan',
      'Jumlah Siswa Aktif': studentCounts[c.id] || studentCounts[c.name] || 0
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 20 },
      { wch: 12 },
      { wch: 35 },
      { wch: 35 },
      { wch: 20 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Rombel Kelas');
    XLSX.writeFile(wb, `Data_Rombel_Kelas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Import File Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = async evt => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawData = XLSX.utils.sheet_to_json(ws) as any[];

        if (!rawData || rawData.length === 0) {
          setImportError('File kosong atau tidak berisi baris data rombel kelas.');
          setPreviewClasses([]);
          return;
        }

        const parsed = parseClassRows(rawData, teachers);
        setPreviewClasses(parsed);
      } catch (err) {
        console.error('Error import excel rombel:', err);
        setImportError('Gagal membaca format file. Pastikan file berformat Excel (.xlsx/.xls) atau CSV (.csv).');
        setPreviewClasses([]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    const valid = previewClasses.filter(c => c.isValid);
    if (valid.length === 0) {
      alert('Tidak ada data rombel kelas yang valid untuk diimpor.');
      return;
    }

    setIsImporting(true);
    try {
      const cleanClasses: SchoolClass[] = valid.map((c, idx) => ({
        id: `c_${Date.now()}_${idx}`,
        name: c.name,
        grade: c.grade,
        major: c.major,
        homeroomTeacher: c.homeroomTeacher || 'Belum Ditentukan',
        studentCount: 0
      }));

      const count = await importClassesBulk(cleanClasses, importMode);
      alert(`Berhasil mengimpor ${count} rombel kelas ke database!`);
      setPreviewClasses([]);
      setImportFileName('');
      setIsImportOpen(false);
    } catch (err: any) {
      alert('Gagal mengimpor rombel kelas: ' + err?.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Manajemen Master Rombel Kelas"
        subtitle="Kelola rombel kelas aktif, tingkat (X/XI/XII), jurusan, dan penetapan wali kelas resmi"
        maxWidth="2xl"
      >
        <div className="space-y-5">
          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Rombel Kelas</span>
              </button>

              <button
                type="button"
                onClick={() => setIsImportOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>Import Excel / CSV</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-100 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
            </div>

            {classes.length > 0 && isSuperAdmin && (
              <button
                type="button"
                onClick={() => setIsClearAllOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-800 transition-colors"
                title="Hapus seluruh rombel kelas dummy"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Semua Rombel</span>
              </button>
            )}
          </div>

          {/* Search & Grade Filter Pills & Selection */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleToggleSelectAllClasses}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border ${
                  selectedClassIds.size > 0 && selectedClassIds.size === filteredClasses.length
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : selectedClassIds.size > 0
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
                title="Tandai semua rombel di filter ini"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>
                  {selectedClassIds.size === filteredClasses.length && filteredClasses.length > 0
                    ? 'Batal Pilih Semua'
                    : 'Tandai Semua'}
                </span>
              </button>

              {(['all', 'X', 'XI', 'XII'] as const).map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGrade(g)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    selectedGrade === g
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {g === 'all' ? 'Semua Tingkat' : `Tingkat ${g}`}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari rombel, wali, jurusan..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Batch Selection Banner */}
          {selectedClassIds.size > 0 && (
            <div className="p-3 rounded-2xl bg-indigo-900/40 border border-indigo-600/60 flex items-center justify-between gap-3 text-xs animate-in fade-in">
              <div className="flex items-center gap-2 text-indigo-200 font-bold">
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-xs">
                  {selectedClassIds.size}
                </span>
                <span>Rombel Kelas Terpilih</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedClassIds(new Set())}
                  className="px-2.5 py-1 text-xs text-indigo-300 hover:text-white underline cursor-pointer"
                >
                  Batal Pilih
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulkDeleteOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus {selectedClassIds.size} Rombel Terpilih</span>
                </button>
              </div>
            </div>
          )}

          {/* Class List Matrix */}
          <div className="max-h-[420px] overflow-y-auto pr-1 space-y-2.5">
            {filteredClasses.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
                <School className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Belum Ada Rombel Kelas</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Tambahkan rombel kelas baru atau gunakan tombol <strong>Import Excel / CSV</strong> di atas untuk mendaftarkan seluruh kelas sekolah Anda.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredClasses.map(c => {
                  const studentCount = studentCounts[c.id] || studentCounts[c.name] || 0;
                  const isSelected = selectedClassIds.has(c.id);

                  return (
                    <div
                      key={c.id}
                      onClick={() => handleToggleSelectClass(c.id)}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer select-none ${
                        isSelected
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/60 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectClass(c.id)}
                              onClick={e => e.stopPropagation()}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                            />
                            <span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800">
                              {c.grade}
                            </span>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                {c.name}
                              </h4>
                              <span className="text-[11px] text-slate-400 line-clamp-1">
                                {c.major}
                              </span>
                            </div>
                          </div>

                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold flex items-center gap-1 shrink-0">
                            <Users className="w-3.5 h-3.5" />
                            <span>{studentCount} Siswa</span>
                          </span>
                        </div>

                        {/* Homeroom Teacher */}
                        <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center gap-2 text-xs">
                          <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="truncate">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Wali Kelas:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                              {c.homeroomTeacher || 'Belum Ditentukan'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div
                        className="flex items-center justify-end gap-1.5 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={e => handleOpenEdit(c, e)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:hover:bg-amber-900 dark:text-amber-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={e => handleOpenDelete(c, e)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Add / Edit Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedClass ? `Edit Rombel: ${selectedClass.name}` : 'Tambah Rombel Kelas Baru'}
        subtitle="Tentukan nama rombel, tingkatan, jurusan, dan wali kelas resmi"
        maxWidth="md"
      >
        <form onSubmit={handleSaveClass} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nama Rombel Kelas <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: X-1, X MIA 1, Fase E-1, XI IPA 1"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tingkat / Tingkatan
              </label>
              <select
                value={formData.grade}
                onChange={e => setFormData({ ...formData, grade: e.target.value as 'X' | 'XI' | 'XII' })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value="X">Tingkat X (Kelas 10)</option>
                <option value="XI">Tingkat XI (Kelas 11)</option>
                <option value="XII">Tingkat XII (Kelas 12)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Wali Kelas Resmi
              </label>
              <select
                value={formData.homeroomTeacher}
                onChange={e => setFormData({ ...formData, homeroomTeacher: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="Belum Ditentukan">-- Belum Ditentukan --</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.fullName}>
                    {t.fullName} {t.role ? `(${t.role})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Jurusan / Peminatan
            </label>
            <div className="space-y-1.5">
              <select
                value={MAJOR_PRESETS.includes(formData.major) ? formData.major : 'custom'}
                onChange={e => {
                  if (e.target.value !== 'custom') {
                    setFormData({ ...formData, major: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {MAJOR_PRESETS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
                <option value="custom">-- Tulis Jurusan Kustom --</option>
              </select>

              {!MAJOR_PRESETS.includes(formData.major) && (
                <input
                  type="text"
                  placeholder="Ketik jurusan / program keahlian..."
                  value={formData.major}
                  onChange={e => setFormData({ ...formData, major: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm"
            >
              {selectedClass ? 'Simpan Perubahan' : 'Tambah Rombel'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      {classToDelete && (
        <ConfirmDialog
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDeleteConfirm}
          title={`Hapus Rombel ${classToDelete.name}?`}
          message={`Apakah Anda yakin ingin menghapus rombel kelas "${classToDelete.name}"? Siswa yang terdaftar di kelas ini akan tetap ada namun data kelasnya perlu disesuaikan.`}
          confirmText="Ya, Hapus Kelas"
          danger
        />
      )}

      {/* Clear All Confirmation */}
      <ConfirmDialog
        isOpen={isClearAllOpen}
        onClose={() => setIsClearAllOpen(false)}
        onConfirm={handleClearAllConfirm}
        title="Reset & Bersihkan Seluruh Rombel Kelas?"
        message="Tindakan ini akan menghapus semua daftar rombel kelas yang ada saat ini sehingga Anda dapat mengunggah struktur rombel baru yang 100% bersih."
        confirmText="Ya, Bersihkan Seluruh Rombel"
        danger
      />

      {/* Import Modal */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => {
          setIsImportOpen(false);
          setPreviewClasses([]);
          setImportFileName('');
          setImportError(null);
        }}
        title="Import Master Rombel Kelas (Excel / CSV)"
        subtitle="Unggah struktur rombel kelas sekaligus dari file spreadsheet"
        maxWidth="lg"
        footer={
          previewClasses.length > 0 ? (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => {
                  setPreviewClasses([]);
                  setImportFileName('');
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Ganti File
              </button>
              <button
                type="button"
                disabled={isImporting || previewClasses.filter(c => c.isValid).length === 0}
                onClick={handleConfirmImport}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Simpan {previewClasses.filter(c => c.isValid).length} Rombel ke Database</span>
              </button>
            </div>
          ) : undefined
        }
      >
        <div className="space-y-4 text-xs">
          {/* Mode Selector */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              Pilihan Mode Import:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className={`p-2.5 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                importMode === 'replace'
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="importClassMode"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-bold text-[11px]">Gantikan Seluruh Rombel Lama (Clean)</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    Hapus kelas dummy/lama dan simpan hanya rombel dari file ini.
                  </div>
                </div>
              </label>

              <label className={`p-2.5 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                importMode === 'append'
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="importClassMode"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-bold text-[11px]">Tambahkan ke Rombel yang Ada</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    Gabungkan rombel baru tanpa menghapus kelas sebelumnya.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Download Template */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold">Unduh Template Format Excel:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => downloadClassTemplateXLSX(teachers, schoolSetting?.name)}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] hover:bg-indigo-700 shadow-sm"
              >
                Template .XLSX
              </button>
              <button
                type="button"
                onClick={() => downloadClassTemplateCSV(teachers)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px] border border-indigo-200 dark:border-indigo-800"
              >
                Template .CSV
              </button>
            </div>
          </div>

          {/* File Upload Zone */}
          {previewClasses.length === 0 ? (
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-indigo-500 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                id="class-import-input"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="class-import-input" className="cursor-pointer block">
                <Upload className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  Klik untuk Memilih File Spreadsheet Rombel
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Mendukung .xlsx, .xls, dan .csv
                </p>
              </label>
              {importError && (
                <div className="mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-700 text-xs">
                  {importError}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold text-[11px]">
                <span>Pratinjau File: <strong>{importFileName}</strong></span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  ✓ {previewClasses.filter(c => c.isValid).length} Siap Diimpor
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="p-2">No</th>
                      <th className="p-2">Nama Rombel</th>
                      <th className="p-2">Tingkat</th>
                      <th className="p-2">Jurusan</th>
                      <th className="p-2">Wali Kelas</th>
                      <th className="p-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {previewClasses.map((c, idx) => (
                      <tr key={idx} className={c.isValid ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40' : 'bg-rose-50/50'}>
                        <td className="p-2 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-bold text-slate-900 dark:text-slate-100">{c.name}</td>
                        <td className="p-2 font-bold">{c.grade}</td>
                        <td className="p-2 text-slate-500">{c.major}</td>
                        <td className="p-2 text-slate-700 dark:text-slate-300">{c.homeroomTeacher || '-'}</td>
                        <td className="p-2 text-right">
                          {c.isValid ? (
                            <span className="text-emerald-600 font-bold text-[11px]">✓ Valid</span>
                          ) : (
                            <span className="text-rose-600 font-bold text-[10px]">{c.errors[0]}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Bulk Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title={`Hapus ${selectedClassIds.size} Rombel Kelas Terpilih?`}
        message={`Tindakan ini akan menghapus ${selectedClassIds.size} rombel kelas secara permanen dari database lokal dan Firebase Firestore. Data siswa di kelas tersebut akan dipertahankan namun asosiasi kelasnya akan dinonaktifkan.`}
        confirmText={`Ya, Hapus ${selectedClassIds.size} Rombel`}
        cancelText="Batal"
        type="danger"
      />
    </>
  );
};
