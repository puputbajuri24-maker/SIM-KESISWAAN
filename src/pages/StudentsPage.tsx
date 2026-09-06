import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Users,
  Plus,
  FileSpreadsheet,
  Upload,
  UserCheck,
  Eye,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Calendar,
  Award,
  ShieldAlert,
  Compass,
  CheckCircle2,
  Filter,
  Download,
  FileText,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Table
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { Student } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';
import { ClassGridFilter } from '../components/common/ClassGridFilter';
import { ClassManagementModal } from '../components/common/ClassManagementModal';
import * as XLSX from 'xlsx';
import {
  downloadStudentTemplateXLSX,
  downloadStudentTemplateCSV,
  parseStudentRows,
  ParsedImportStudent
} from '../utils/studentTemplate';
import {
  calculateStudentCountsByClass,
  isStudentInClass
} from '../utils/classResolver';

export const StudentsPage: React.FC = () => {
  const { isWakaOrAdmin } = useAuth();
  const {
    students,
    classes,
    teachers,
    addStudent,
    updateStudent,
    deleteStudent,
    deleteStudentsBulk,
    importStudentsBulk,
    clearAllStudents,
    assignHomeroomTeacher,
    addTeacher,
    members,
    violations,
    counseling,
    achievements,
    attendance,
    schoolSetting
  } = useSchool();

  // Master Tab
  const [mainTab, setMainTab] = useState<'students' | 'homeroom'>('students');

  // Filters for Students
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');

  // Multi-Selection State for Students
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Homeroom Assignment Modal & Filter State
  const [isAddHomeroomModalOpen, setIsAddHomeroomModalOpen] = useState(false);
  const [homeroomGradeFilter, setHomeroomGradeFilter] = useState<'all' | 'X' | 'XI' | 'XII'>('all');
  const [homeroomSearchQuery, setHomeroomSearchQuery] = useState('');
  const [homeroomFormData, setHomeroomFormData] = useState<{
    classId: string;
    mode: 'existing' | 'new';
    teacherId: string;
    teacherName: string;
    newNip: string;
    newFullName: string;
    newPhone: string;
    newSubject: string;
  }>({
    classId: '',
    mode: 'existing',
    teacherId: '',
    teacherName: '',
    newNip: '',
    newFullName: '',
    newPhone: '',
    newSubject: ''
  });

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isClassManageOpen, setIsClassManageOpen] = useState(false);
  const [isClearAllStudentsOpen, setIsClearAllStudentsOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailTab, setDetailTab] = useState<'profile' | 'ekskul' | 'prestasi' | 'pelanggaran' | 'presensi'>('profile');

  // Import State
  const [previewStudents, setPreviewStudents] = useState<ParsedImportStudent[]>([]);
  const [importFileName, setImportFileName] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('replace');
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({
    nis: '',
    nisn: '',
    fullName: '',
    gender: 'L',
    birthPlace: '',
    birthDate: '',
    classId: '',
    className: '',
    major: '',
    phone: '',
    parentName: '',
    parentPhone: '',
    address: '',
    status: 'Aktif'
  });

  // Automatically open student profile if navigated from Global Search
  useEffect(() => {
    const handleSearchSelect = (event: Event) => {
      const customEvent = event as CustomEvent<{
        category: string;
        id: string;
        rawId: string;
        title: string;
      }>;
      const detail = customEvent.detail;
      if (!detail) return;

      if (detail.category === 'students') {
        const targetStudent = students.find(
          s =>
            s.id === detail.rawId ||
            s.id === detail.id ||
            s.nis === detail.rawId ||
            (s.fullName && s.fullName.toLowerCase().trim() === detail.title.toLowerCase().trim())
        );
        if (targetStudent) {
          setSelectedStudent(targetStudent);
          setIsDetailOpen(true);
        }
      }
    };

    window.addEventListener('app:search-select', handleSearchSelect);
    return () => window.removeEventListener('app:search-select', handleSearchSelect);
  }, [students]);

  // Student count map per class (Accurately resolves by class ID & Name)
  const studentCountsByClassId = useMemo(() => {
    return calculateStudentCountsByClass(students, classes);
  }, [students, classes]);

  // Filtered Students (Sorted Alphabetically by Name)
  const filteredStudents = useMemo(() => {
    return students
      .filter(s => {
        if (selectedClass !== 'all') {
          if (!isStudentInClass(s, selectedClass, classes)) return false;
        }
        if (selectedStatus !== 'all' && s.status !== selectedStatus) return false;
        if (selectedGender !== 'all' && s.gender !== selectedGender) return false;
        return true;
      })
      .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'id', { sensitivity: 'base' }));
  }, [students, selectedClass, selectedStatus, selectedGender, classes]);

  const handleOpenAdd = () => {
    setSelectedStudent(null);
    setFormData({
      nis: '',
      nisn: '',
      fullName: '',
      gender: 'L',
      birthPlace: 'Jakarta',
      birthDate: '2008-01-01',
      classId: classes[0]?.id || '',
      className: classes[0]?.name || '',
      major: classes[0]?.major || '',
      phone: '',
      parentName: '',
      parentPhone: '',
      address: '',
      status: 'Aktif'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (student: Student, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedStudent(student);
    setFormData(student);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (student: Student) => {
    setSelectedStudent(student);
    setDetailTab('profile');
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (student: Student, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedStudent(student);
    setIsDeleteOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nis || !formData.fullName || !formData.classId) {
      alert('Mohon lengkapi NIS, Nama Siswa, dan Kelas.');
      return;
    }

    try {
      const targetClass = classes.find(c => c.id === formData.classId);

      if (selectedStudent) {
        await updateStudent(selectedStudent.id, {
          ...formData,
          className: targetClass?.name || formData.className,
          major: targetClass?.major || formData.major
        });
      } else {
        await addStudent({
          nis: formData.nis!,
          nisn: formData.nisn || '',
          fullName: formData.fullName!,
          gender: formData.gender as 'L' | 'P',
          birthPlace: formData.birthPlace || '',
          birthDate: formData.birthDate || '',
          classId: formData.classId!,
          className: targetClass?.name || 'X RPL 1',
          major: targetClass?.major || 'Rekayasa Perangkat Lunak',
          phone: formData.phone || '',
          parentName: formData.parentName || '',
          parentPhone: formData.parentPhone || '',
          address: formData.address || '',
          status: (formData.status as any) || 'Aktif'
        });
      }
    } catch (err) {
      console.error('Error saving student:', err);
    } finally {
      setIsFormOpen(false);
      setSelectedStudent(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedStudent) {
      try {
        await deleteStudent(selectedStudent.id);
      } catch (err) {
        console.error('Error deleting student:', err);
      } finally {
        setIsDeleteOpen(false);
        setSelectedStudent(null);
      }
    }
  };

  // Bulk Selection Handlers for Students
  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAllStudents = (items: Student[]) => {
    if (items.length === 0) {
      setSelectedStudentIds(new Set());
      return;
    }
    const allSelected = items.every(s => selectedStudentIds.has(s.id));
    if (allSelected) {
      setSelectedStudentIds(prev => {
        const next = new Set(prev);
        items.forEach(s => next.delete(s.id));
        return next;
      });
    } else {
      setSelectedStudentIds(prev => {
        const next = new Set(prev);
        items.forEach(s => next.add(s.id));
        return next;
      });
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedStudentIds.size === 0) return;
    try {
      await deleteStudentsBulk(Array.from(selectedStudentIds));
      setSelectedStudentIds(new Set());
      setIsBulkDeleteOpen(false);
    } catch (err) {
      console.error('Error bulk deleting students:', err);
    }
  };

  // Homeroom Assignment Handlers
  const handleOpenAddHomeroom = (targetClassId?: string) => {
    const defaultClassId = targetClassId || classes[0]?.id || '';
    const targetClass = classes.find(c => c.id === defaultClassId);
    const existingTeacher = teachers.find(t => t.fullName === targetClass?.homeroomTeacher);

    setHomeroomFormData({
      classId: defaultClassId,
      mode: 'existing',
      teacherId: existingTeacher?.id || (teachers[0]?.id || ''),
      teacherName: existingTeacher?.fullName || (teachers[0]?.fullName || ''),
      newNip: `1985${Math.floor(10000000 + Math.random() * 90000000)}`,
      newFullName: '',
      newPhone: '081234567890',
      newSubject: 'Wali Kelas'
    });
    setIsAddHomeroomModalOpen(true);
  };

  const handleSaveHomeroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeroomFormData.classId) {
      alert('Pilih kelas terlebih dahulu.');
      return;
    }

    try {
      let finalTeacherName = '';
      let finalTeacherId: string | undefined = undefined;

      if (homeroomFormData.mode === 'new') {
        if (!homeroomFormData.newFullName.trim()) {
          alert('Nama Guru Baru wajib diisi.');
          return;
        }
        finalTeacherName = homeroomFormData.newFullName.trim();
        // Create teacher in database
        await addTeacher({
          nip: homeroomFormData.newNip || `1985${Math.floor(10000000 + Math.random() * 90000000)}`,
          fullName: finalTeacherName,
          role: 'Wali Kelas',
          subject: homeroomFormData.newSubject || 'Wali Kelas',
          phone: homeroomFormData.newPhone || '',
          email: '',
          assignedExtracurriculars: [],
          isActive: true
        });
      } else {
        const found = teachers.find(t => t.id === homeroomFormData.teacherId || t.fullName === homeroomFormData.teacherName);
        if (!found) {
          alert('Pilih guru yang tersedia.');
          return;
        }
        finalTeacherName = found.fullName;
        finalTeacherId = found.id;
      }

      await assignHomeroomTeacher(homeroomFormData.classId, finalTeacherName, finalTeacherId);
      setIsAddHomeroomModalOpen(false);
    } catch (err: any) {
      alert('Gagal menetapkan wali kelas: ' + err?.message);
    }
  };

  const handleQuickAssignHomeroom = async (classId: string, teacherName: string) => {
    try {
      const foundTeacher = teachers.find(t => t.fullName === teacherName);
      await assignHomeroomTeacher(classId, teacherName, foundTeacher?.id);
    } catch (err: any) {
      alert('Gagal mengubah wali kelas: ' + err?.message);
    }
  };

  // Filtered Homeroom Classes
  const filteredHomeroomClasses = useMemo(() => {
    return classes.filter(c => {
      if (homeroomGradeFilter !== 'all' && c.grade !== homeroomGradeFilter) return false;
      if (homeroomSearchQuery.trim()) {
        const q = homeroomSearchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.major.toLowerCase().includes(q) ||
          (c.homeroomTeacher || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [classes, homeroomGradeFilter, homeroomSearchQuery]);

  // Template Download Handlers
  const handleDownloadTemplateXLSX = () => {
    downloadStudentTemplateXLSX(classes, schoolSetting?.name);
  };

  const handleDownloadTemplateCSV = () => {
    downloadStudentTemplateCSV(classes);
  };

  // Reset Import State
  const handleResetImport = () => {
    setPreviewStudents([]);
    setImportFileName('');
    setImportError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Import Excel / CSV Handler with Live Preview
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
          setImportError('File kosong atau tidak berisi baris data yang dapat dibaca.');
          setPreviewStudents([]);
          return;
        }

        const parsed = parseStudentRows(rawData, classes);
        setPreviewStudents(parsed);
      } catch (err) {
        console.error('Error import excel:', err);
        setImportError('Gagal membaca format file. Pastikan file berformat Excel (.xlsx/.xls) atau CSV (.csv).');
        setPreviewStudents([]);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Confirm and Bulk Save
  const handleConfirmImport = async () => {
    const validStudents = previewStudents.filter(s => s.isValid);
    if (validStudents.length === 0) {
      alert('Tidak ada baris data siswa yang valid untuk diimpor. Periksa kembali NIS dan Nama Siswa.');
      return;
    }

    setIsImporting(true);
    try {
      const cleanStudents = validStudents.map(({ isValid, errors, ...rest }) => rest);
      const count = await importStudentsBulk(cleanStudents, importMode);
      alert(`Berhasil mengimpor ${count} data siswa ke database kesiswaan!`);
      handleResetImport();
      setIsImportOpen(false);
    } catch (e) {
      console.error('Error bulk saving students:', e);
      alert('Terjadi kendala saat menyimpan data siswa. Silakan coba lagi.');
    } finally {
      setIsImporting(false);
    }
  };

  // Student specific relations
  const studentMemberships = selectedStudent ? members.filter(m => m.studentId === selectedStudent.id) : [];
  const studentAchievements = selectedStudent ? achievements.filter(a => a.studentId === selectedStudent.id) : [];
  const studentViolations = selectedStudent ? violations.filter(v => v.studentId === selectedStudent.id) : [];
  const studentCounselings = selectedStudent ? counseling.filter(c => c.studentId === selectedStudent.id) : [];

  const columns: Column<Student>[] = [
    {
      header: 'NIS / NISN',
      accessorKey: 'nis',
      sortable: true,
      cell: s => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100">{s.nis}</span>
          {s.nisn && <p className="text-[11px] text-slate-400">NISN: {s.nisn}</p>}
        </div>
      )
    },
    {
      header: 'Nama Lengkap Siswa',
      accessorKey: 'fullName',
      sortable: true,
      cell: s => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
            {s.fullName.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{s.fullName}</p>
            <p className="text-[11px] text-slate-400">
              {s.gender === 'L' ? 'Laki-Laki' : 'Perempuan'} • {s.phone || 'Tanpa HP'}
            </p>
          </div>
        </div>
      )
    },
    {
      header: 'Kelas & Jurusan',
      accessorKey: 'className',
      sortable: true,
      cell: s => (
        <div>
          <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold text-xs text-slate-700 dark:text-slate-300">
            {s.className}
          </span>
          <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{s.major}</p>
        </div>
      )
    },
    {
      header: 'Poin Disiplin / Prestasi',
      cell: s => (
        <div className="flex items-center gap-2 text-xs">
          <span className={`px-2 py-0.5 rounded-lg font-bold ${
            (s.violationPoints || 0) > 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-slate-100 text-slate-500'
          }`}>
            ⚠️ {s.violationPoints || 0} Poin
          </span>
          <span className={`px-2 py-0.5 rounded-lg font-bold ${
            (s.achievementPoints || 0) > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-100 text-slate-500'
          }`}>
            🏆 {s.achievementPoints || 0}
          </span>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: s => <StatusBadge status={s.status} />
    },
    {
      header: 'Aksi',
      className: 'text-right',
      cell: s => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => handleOpenDetail(s)}
            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-400 transition-colors"
            title="Lihat Detail Profil & Rekap"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={e => handleOpenEdit(s, e)}
            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:hover:bg-amber-900 dark:text-amber-400 transition-colors"
            title="Edit Data Siswa"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={e => handleOpenDelete(s, e)}
            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-400 transition-colors"
            title="Hapus Siswa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  // Homeroom Statistics
  const homeroomStats = useMemo(() => {
    const totalClasses = classes.length;
    const filled = classes.filter(c => !!c.homeroomTeacher && c.homeroomTeacher.trim() !== '' && c.homeroomTeacher !== '-').length;
    const empty = totalClasses - filled;
    return { totalClasses, filled, empty };
  }, [classes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Data Siswa & Wali Kelas
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Database lengkap kesiswaan, penetapan wali kelas rombel, presensi, pelanggaran, dan prestasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportActions
            filename="data_siswa_sekolah"
            title="Daftar Siswa Sekolah"
            data={filteredStudents}
            headers={[
              { header: 'NIS', key: 'nis' },
              { header: 'NISN', key: 'nisn' },
              { header: 'Nama Lengkap', key: 'fullName' },
              { header: 'L/P', key: 'gender' },
              { header: 'Kelas', key: 'className' },
              { header: 'Jurusan', key: 'major' },
              { header: 'No HP', key: 'phone' },
              { header: 'Orang Tua / Wali', key: 'parentName' },
              { header: 'Poin Pelanggaran', key: 'violationPoints' },
              { header: 'Poin Prestasi', key: 'achievementPoints' },
              { header: 'Status', key: 'status' }
            ]}
          />

          <div className="relative group">
            <button
              onClick={handleDownloadTemplateXLSX}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              title="Unduh Template Excel resmi untuk import data siswa"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Template Excel</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsClassManageOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-300 dark:border-purple-800/80 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-200 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            title="Kelola Master Rombel Kelas, Tingkat, Jurusan, dan Wali Kelas"
          >
            <Table className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Kelola Rombel ({classes.length})</span>
          </button>

          {/* Dedicated Tab Button to Add / Set Homeroom Teacher */}
          <button
            type="button"
            onClick={() => handleOpenAddHomeroom()}
            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:hover:bg-amber-900 dark:text-amber-200 text-xs font-bold border border-amber-300 dark:border-amber-700/80 flex items-center gap-1.5 shadow-xs transition-colors"
            title="Tambah atau Tetapkan Guru sebagai Wali Kelas Rombel"
          >
            <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>+ Tambah Wali Kelas</span>
          </button>

          <button
            onClick={() => {
              handleResetImport();
              setIsImportOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Import Excel/CSV</span>
          </button>

          {isWakaOrAdmin && students.length > 0 && (
            <button
              type="button"
              onClick={() => setIsClearAllStudentsOpen(true)}
              className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-800 transition-colors"
              title="Kosongkan semua data siswa master untuk upload data fresh"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Siswa</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setMainTab('students')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            mainTab === 'students'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Daftar Siswa</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            mainTab === 'students' ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}>
            {students.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('homeroom')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            mainTab === 'homeroom'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Kelola & Penetapan Wali Kelas</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            mainTab === 'homeroom' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold'
          }`}>
            {homeroomStats.filled}/{homeroomStats.totalClasses} Terisi
          </span>
        </button>
      </div>

      {mainTab === 'students' ? (
        <>
          {/* Class Grid Filter Component */}
          <ClassGridFilter
            classes={classes}
            selectedClassId={selectedClass}
            onSelectClass={setSelectedClass}
            countsByClassId={studentCountsByClassId}
            totalCount={students.length}
            label="Filter Rombongan Belajar (Rombel / Kelas)"
            itemUnit="Siswa"
            colorScheme="indigo"
          />

          {/* Secondary Filter Bar */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500 font-semibold">
              <Filter className="w-4 h-4" />
              <span>Filter Lanjutan:</span>
            </div>

            {/* Filter Status */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 font-medium"
            >
              <option value="all">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Alumni">Alumni</option>
              <option value="Pindah">Pindah</option>
              <option value="Keluar">Keluar</option>
            </select>

            {/* Filter Gender */}
            <select
              value={selectedGender}
              onChange={e => setSelectedGender(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 font-medium"
            >
              <option value="all">Semua Gender</option>
              <option value="L">Laki-Laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>

            {(selectedClass !== 'all' || selectedStatus !== 'all' || selectedGender !== 'all') && (
              <button
                onClick={() => {
                  setSelectedClass('all');
                  setSelectedStatus('all');
                  setSelectedGender('all');
                }}
                className="text-xs text-rose-600 hover:underline font-semibold ml-auto"
              >
                Reset Semua Filter
              </button>
            )}
          </div>

          {/* Main Table with Batch Selection */}
          <DataTable
            id="students-table"
            data={filteredStudents}
            columns={columns}
            searchPlaceholder="Cari siswa berdasarkan NIS, Nama, atau Kelas..."
            searchableKeys={['nis', 'nisn', 'fullName', 'className', 'parentName']}
            onRowClick={handleOpenDetail}
            selectable={true}
            selectedIds={selectedStudentIds}
            onToggleSelect={handleToggleSelectStudent}
            onToggleSelectAll={handleToggleSelectAllStudents}
            batchActions={(ids) => (
              <button
                type="button"
                onClick={() => setIsBulkDeleteOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus {ids.length} Siswa Terpilih</span>
              </button>
            )}
            emptyTitle="Tidak Ada Siswa"
            emptySubtitle="Tidak ditemukan data siswa yang sesuai dengan filter pencarian."
          />
        </>
      ) : (
        /* Homeroom Management Tab View */
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold">Total Rombel Kelas</span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{homeroomStats.totalClasses}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Tingkat X, XI, dan XII</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 shadow-xs">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Wali Kelas Terisi</span>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{homeroomStats.filled}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Sudah memiliki wali kelas aktif</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 shadow-xs">
              <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">Belum Terisi</span>
              <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{homeroomStats.empty}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Perlu penetapan wali kelas</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50 shadow-xs">
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">Dewan Guru Terdaftar</span>
              <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">{teachers.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Guru & pembina di database</p>
            </div>
          </div>

          {/* Filter and Search Bar for Homeroom */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 mr-1">Tingkat:</span>
              {(['all', 'X', 'XI', 'XII'] as const).map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setHomeroomGradeFilter(g)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    homeroomGradeFilter === g
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {g === 'all' ? 'Semua Tingkat' : `Kelas ${g}`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={homeroomSearchQuery}
                onChange={e => setHomeroomSearchQuery(e.target.value)}
                placeholder="Cari rombel atau wali kelas..."
                className="px-3.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 w-full sm:w-64"
              />
              <button
                type="button"
                onClick={() => handleOpenAddHomeroom()}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tetapkan Wali Kelas</span>
              </button>
            </div>
          </div>

          {/* Classes Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredHomeroomClasses.map(c => {
              const studentCount = studentCountsByClassId[c.id] || 0;
              const hasHomeroom = !!c.homeroomTeacher && c.homeroomTeacher.trim() !== '' && c.homeroomTeacher !== '-';

              return (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                            {c.grade}
                          </span>
                          <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                            {c.name}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                          {c.major}
                        </p>
                      </div>

                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs shrink-0">
                        {studentCount} Siswa
                      </span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Wali Kelas Saat Ini:
                      </span>
                      {hasHomeroom ? (
                        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/50">
                          <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {c.homeroomTeacher?.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-amber-950 dark:text-amber-200 truncate">
                              {c.homeroomTeacher}
                            </p>
                            <span className="inline-block text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                              ✓ Wali Kelas Resmi
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                          <span>Belum Ditentukan</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={c.homeroomTeacher || ''}
                        onChange={e => handleQuickAssignHomeroom(c.id, e.target.value)}
                        className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500/20"
                      >
                        <option value="">-- Pilih Cepat dari Dewan Guru --</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.fullName}>
                            {t.fullName} ({t.role || 'Guru'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenAddHomeroom(c.id)}
                      className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Atur / Tambah Guru Baru</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredHomeroomClasses.length === 0 && (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">Tidak Ada Rombel Kelas</h3>
              <p className="text-xs text-slate-400 mt-1">Tidak ditemukan rombel kelas yang sesuai dengan filter pencarian.</p>
            </div>
          )}
        </div>
      )}

      {/* Form Modal (Add / Edit) */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
        subtitle="Lengkapi data kesiswaan sesuai dokumen resmi sekolah"
        maxWidth="2xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveStudent}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
            >
              Simpan Data Siswa
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                NIS (Nomor Induk Siswa) *
              </label>
              <input
                type="text"
                required
                value={formData.nis}
                onChange={e => setFormData({ ...formData, nis: e.target.value })}
                placeholder="Contoh: 24251001"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                NISN (Nasional)
              </label>
              <input
                type="text"
                value={formData.nisn}
                onChange={e => setFormData({ ...formData, nisn: e.target.value })}
                placeholder="Contoh: 0081234501"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Lengkap Siswa *
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Contoh: Aditya Pratama Nugraha"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jenis Kelamin *
              </label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="L">Laki-Laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tempat Lahir
              </label>
              <input
                type="text"
                value={formData.birthPlace}
                onChange={e => setFormData({ ...formData, birthPlace: e.target.value })}
                placeholder="Jakarta"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Lahir
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rombel Kelas *
              </label>
              <select
                value={formData.classId}
                onChange={e => {
                  const targetClass = classes.find(c => c.id === e.target.value);
                  setFormData({
                    ...formData,
                    classId: e.target.value,
                    className: targetClass?.name || '',
                    major: targetClass?.major || ''
                  });
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.major}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status Siswa
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Aktif">Aktif</option>
                <option value="Alumni">Alumni</option>
                <option value="Pindah">Pindah</option>
                <option value="Keluar">Keluar</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                No HP / WhatsApp Siswa
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="081234567890"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Orang Tua / Wali
              </label>
              <input
                type="text"
                value={formData.parentName}
                onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                placeholder="Nama Ayah/Ibu/Wali"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Alamat Domisili
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="Alamat lengkap tempat tinggal siswa..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {selectedStudent && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Profil Siswa: ${selectedStudent.fullName}`}
          subtitle={`NIS: ${selectedStudent.nis} | Kelas: ${selectedStudent.className}`}
          maxWidth="3xl"
          footer={
            <button
              onClick={() => setIsDetailOpen(false)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
            >
              Tutup
            </button>
          }
        >
          {/* Navigation Tabs in Detail */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-1 text-xs font-bold">
            <button
              onClick={() => setDetailTab('profile')}
              className={`px-3 py-2 rounded-t-xl transition-colors ${
                detailTab === 'profile' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Biodata Lengkap
            </button>
            <button
              onClick={() => setDetailTab('ekskul')}
              className={`px-3 py-2 rounded-t-xl transition-colors ${
                detailTab === 'ekskul' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Ekstrakurikuler ({studentMemberships.length})
            </button>
            <button
              onClick={() => setDetailTab('prestasi')}
              className={`px-3 py-2 rounded-t-xl transition-colors ${
                detailTab === 'prestasi' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Prestasi ({studentAchievements.length})
            </button>
            <button
              onClick={() => setDetailTab('pelanggaran')}
              className={`px-3 py-2 rounded-t-xl transition-colors ${
                detailTab === 'pelanggaran' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pelanggaran ({studentViolations.length})
            </button>
          </div>

          {/* Tab 1: Profile */}
          {detailTab === 'profile' && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
                  <p className="font-bold text-slate-500 uppercase tracking-wider">Identitas Pribadi</p>
                  <p><strong>Nama Lengkap:</strong> {selectedStudent.fullName}</p>
                  <p><strong>NIS / NISN:</strong> {selectedStudent.nis} / {selectedStudent.nisn || '-'}</p>
                  <p><strong>Jenis Kelamin:</strong> {selectedStudent.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}</p>
                  <p><strong>Tempat, Tgl Lahir:</strong> {selectedStudent.birthPlace}, {selectedStudent.birthDate}</p>
                  <p><strong>Status Siswa:</strong> <StatusBadge status={selectedStudent.status} /></p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
                  <p className="font-bold text-slate-500 uppercase tracking-wider">Akademik & Kontak</p>
                  <p><strong>Kelas:</strong> {selectedStudent.className}</p>
                  <p><strong>Jurusan:</strong> {selectedStudent.major}</p>
                  <p><strong>No HP Siswa:</strong> {selectedStudent.phone || '-'}</p>
                  <p><strong>Orang Tua / Wali:</strong> {selectedStudent.parentName || '-'}</p>
                  <p><strong>No HP Wali:</strong> {selectedStudent.parentPhone || '-'}</p>
                  <p><strong>Alamat:</strong> {selectedStudent.address || '-'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Ekskul */}
          {detailTab === 'ekskul' && (
            <div className="space-y-3 pt-2">
              {studentMemberships.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Siswa belum terdaftar pada ekstrakurikuler manapun.</p>
              ) : (
                studentMemberships.map(m => (
                  <div key={m.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{m.extracurricularName}</p>
                      <p className="text-slate-400">No Anggota: {m.memberNumber || '-'} • Bergabung: {m.joinDate}</p>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Prestasi */}
          {detailTab === 'prestasi' && (
            <div className="space-y-3 pt-2">
              {studentAchievements.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Belum ada catatan prestasi terverifikasi.</p>
              ) : (
                studentAchievements.map(ach => (
                  <div key={ach.id} className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{ach.title}</span>
                      <span className="font-bold text-amber-700 dark:text-amber-300">+{ach.pointsAwarded} Poin</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{ach.rank} ({ach.level}) • Penyelenggara: {ach.organizer}</p>
                    <p className="text-[10px] text-slate-400">Tanggal: {ach.date}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 4: Pelanggaran */}
          {detailTab === 'pelanggaran' && (
            <div className="space-y-3 pt-2">
              {studentViolations.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center text-emerald-600 font-semibold">
                  ✨ Bersih dari catatan pelanggaran tata tertib sekolah.
                </p>
              ) : (
                studentViolations.map(v => (
                  <div key={v.id} className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-800 dark:text-rose-300">{v.violationType}</span>
                      <span className="font-bold text-rose-600">+{v.points} Poin ({v.category})</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">Tindakan: {v.actionTaken}</p>
                    <p className="text-[10px] text-slate-400">Dicatat oleh: {v.officerName} • {v.date}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </Modal>
      )}

      {/* Enhanced Import Modal */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => {
          setIsImportOpen(false);
          handleResetImport();
        }}
        title="Import Data Siswa Massal"
        subtitle="Unduh template resmi, sesuaikan data, dan unggah file spreadsheet (.xlsx / .csv)"
        maxWidth="4xl"
        footer={
          previewStudents.length > 0 ? (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={handleResetImport}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ← Ganti File Lain
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isImporting || previewStudents.filter(s => s.isValid).length === 0}
                  onClick={handleConfirmImport}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-105"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan ke Database...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Simpan & Import ({previewStudents.filter(s => s.isValid).length} Siswa)
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : undefined
        }
      >
        <div className="space-y-5 py-2">
          {/* Mode Selector */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
              Pilihan Mode Penanganan Data Siswa:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                importMode === 'replace'
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 text-indigo-950 dark:text-indigo-200 font-semibold shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="importStudentMode"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-bold text-xs">Gantikan Seluruh Data Siswa Lama (Clean Replace)</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    Menghapus data siswa dummy/lama dan menggantikannya 100% dengan data yang ada di file Excel ini.
                  </div>
                </div>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                importMode === 'append'
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 text-indigo-950 dark:text-indigo-200 font-semibold shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="importStudentMode"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-bold text-xs">Tambahkan ke Data Siswa yang Sudah Ada</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    Menggabungkan siswa baru dari file tanpa menghapus data siswa yang sudah terdaftar sebelumnya.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Top Step 1: Download Templates Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono text-[10px] font-bold">
                  LANGKAH 1
                </span>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Unduh Template Format Standar
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                Gunakan template resmi yang telah dilengkapi contoh format data, lembar petunjuk kolom, dan daftar kelas yang terdaftar di sekolah.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadTemplateXLSX}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-105"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Download .XLSX (Excel)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTemplateCSV}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Download .CSV</span>
              </button>
            </div>
          </div>

          {/* Toggle Format Guidelines & Cheatsheet */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3 bg-slate-50 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-500" />
                <span>Petunjuk Struktur Kolom & Format Nilai</span>
              </div>
              <span className="text-[11px] font-mono text-indigo-500">
                {showGuide ? 'Sembunyikan ▲' : 'Lihat Detail ▼'}
              </span>
            </button>

            {showGuide && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Kolom Wajib:</span>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600 dark:text-slate-300">
                      <li><strong>NIS:</strong> Nomor Induk Siswa (harus unik).</li>
                      <li><strong>Nama Lengkap:</strong> Nama lengkap siswa.</li>
                      <li><strong>Jenis Kelamin:</strong> <code>L</code> (Laki-Laki) atau <code>P</code> (Perempuan).</li>
                      <li><strong>Kelas:</strong> Nama kelas (misal: <code>{classes[0]?.name || 'X MIPA 1'}</code>).</li>
                    </ul>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">Kolom Opsional:</span>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600 dark:text-slate-300">
                      <li><strong>NISN:</strong> 10 digit nomor nasional.</li>
                      <li><strong>Tempat & Tanggal Lahir:</strong> Format <code>YYYY-MM-DD</code> (contoh: 2008-04-12).</li>
                      <li><strong>No HP Siswa & Orang Tua:</strong> Format nomor WA aktif.</li>
                      <li><strong>Alamat & Status:</strong> Aktif / Alumni / Pindah / Keluar.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Upload or Preview */}
          {previewStudents.length === 0 ? (
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-8 text-center transition-colors bg-white dark:bg-slate-900">
              <input
                ref={fileInputRef}
                type="file"
                id="student-import-input"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="student-import-input" className="cursor-pointer block">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Klik untuk Memilih File atau Drag & Drop ke Sini
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Mendukung file spreadsheet <strong>.xlsx</strong>, <strong>.xls</strong>, dan <strong>.csv</strong>
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                  <Table className="w-4 h-4" />
                  <span>Pilih File Excel / CSV</span>
                </div>
              </label>

              {importError && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 max-w-md mx-auto">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Preview Header Summary */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate max-w-xs">
                      {importFileName || 'File Data Siswa'}
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Total baris: <strong>{previewStudents.length} siswa</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                    ✓ {previewStudents.filter(s => s.isValid).length} Valid
                  </span>
                  {previewStudents.filter(s => !s.isValid).length > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold">
                      ⚠ {previewStudents.filter(s => !s.isValid).length} Bermasalah
                    </span>
                  )}
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/90 sticky top-0 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">NIS / NISN</th>
                      <th className="py-2.5 px-3">Nama Siswa</th>
                      <th className="py-2.5 px-3">L/P</th>
                      <th className="py-2.5 px-3">Kelas</th>
                      <th className="py-2.5 px-3">HP & Wali</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {previewStudents.map((s, idx) => (
                      <tr
                        key={idx}
                        className={s.isValid ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40' : 'bg-rose-50/50 dark:bg-rose-950/20'}
                      >
                        <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{s.nis || '-'}</span>
                          {s.nisn && <div className="text-[10px] text-slate-400 font-mono">NISN: {s.nisn}</div>}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{s.fullName}</div>
                          {s.birthPlace && (
                            <div className="text-[10px] text-slate-400">
                              {s.birthPlace}, {s.birthDate}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            s.gender === 'L' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
                          }`}>
                            {s.gender}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium text-[11px] text-slate-700 dark:text-slate-300">
                            {s.className}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[11px]">
                          <div className="text-slate-700 dark:text-slate-300">{s.phone || '-'}</div>
                          {s.parentName && <div className="text-[10px] text-slate-400">Wali: {s.parentName}</div>}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {s.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Siap</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600" title={s.errors.join(', ')}>
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>{s.errors[0]}</span>
                            </span>
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Data Siswa"
        message={`Apakah Anda yakin ingin menghapus data siswa ${selectedStudent?.fullName} (NIS: ${selectedStudent?.nis})? Data historis terkait akan dihapus.`}
        confirmText="Hapus Siswa"
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title={`Hapus ${selectedStudentIds.size} Data Siswa Terpilih?`}
        message={`Apakah Anda yakin ingin menghapus ${selectedStudentIds.size} siswa terpilih secara permanen? Data historis siswa tersebut (pelanggaran, bimbingan konseling, presensi, dll.) akan dibersihkan dari database lokal dan Firebase Firestore.`}
        confirmText={`Ya, Hapus ${selectedStudentIds.size} Siswa`}
        danger
      />

      {/* Clear All Students Dialog */}
      <ConfirmDialog
        isOpen={isClearAllStudentsOpen}
        onClose={() => setIsClearAllStudentsOpen(false)}
        onConfirm={async () => {
          await clearAllStudents();
          setIsClearAllStudentsOpen(false);
        }}
        title="Reset & Kosongkan Seluruh Data Siswa?"
        message={`Tindakan ini akan mengosongkan seluruh (${students.length}) data siswa master dari sistem sehingga Anda dapat mengunggah file data siswa baru yang benar-benar bersih.`}
        confirmText="Ya, Kosongkan Data Siswa"
        danger
      />

      {/* Class Management Modal */}
      <ClassManagementModal
        isOpen={isClassManageOpen}
        onClose={() => setIsClassManageOpen(false)}
      />

      {/* Add / Assign Homeroom Teacher Modal */}
      <Modal
        isOpen={isAddHomeroomModalOpen}
        onClose={() => setIsAddHomeroomModalOpen(false)}
        title="Tetapkan / Tambah Wali Kelas"
        subtitle="Tetapkan guru pembina atau tambah data wali kelas baru untuk rombongan belajar"
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsAddHomeroomModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveHomeroom}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20"
            >
              Simpan & Tetapkan Wali Kelas
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveHomeroom} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Pilih Rombel / Kelas Target *
            </label>
            <select
              value={homeroomFormData.classId}
              onChange={e => setHomeroomFormData({ ...homeroomFormData, classId: e.target.value })}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20"
              required
            >
              <option value="">-- Pilih Kelas Target --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.major}) - Wali saat ini: {c.homeroomTeacher || 'Belum ada'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Metode Penetapan Guru:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHomeroomFormData({ ...homeroomFormData, mode: 'existing' })}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                  homeroomFormData.mode === 'existing'
                    ? 'bg-amber-50 border-amber-400 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Pilih Guru Terdaftar</span>
              </button>
              <button
                type="button"
                onClick={() => setHomeroomFormData({ ...homeroomFormData, mode: 'new' })}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                  homeroomFormData.mode === 'new'
                    ? 'bg-amber-50 border-amber-400 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Guru Baru</span>
              </button>
            </div>
          </div>

          {homeroomFormData.mode === 'existing' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pilih Dewan Guru / Pembina *
              </label>
              <select
                value={homeroomFormData.teacherId}
                onChange={e => {
                  const teacherId = e.target.value;
                  const selected = teachers.find(t => t.id === teacherId);
                  setHomeroomFormData({
                    ...homeroomFormData,
                    teacherId,
                    teacherName: selected?.fullName || ''
                  });
                }}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20"
                required
              >
                <option value="">-- Pilih Guru --</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} (NIP: {t.nip}) - {t.role || 'Guru'}
                  </option>
                ))}
              </select>
              {teachers.length === 0 && (
                <p className="text-[11px] text-rose-500 mt-1">
                  Belum ada dewan guru di sistem. Pilih opsi "+ Guru Baru" di atas.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block">
                Formulir Pendaftaran Guru & Wali Kelas Baru:
              </span>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Guru (dengan Gelar) *
                </label>
                <input
                  type="text"
                  required
                  value={homeroomFormData.newFullName}
                  onChange={e => setHomeroomFormData({ ...homeroomFormData, newFullName: e.target.value })}
                  placeholder="Contoh: Dra. Hj. Siti Aminah, M.Pd"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NIP Guru
                  </label>
                  <input
                    type="text"
                    value={homeroomFormData.newNip}
                    onChange={e => setHomeroomFormData({ ...homeroomFormData, newNip: e.target.value })}
                    placeholder="198501012010012001"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    No Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={homeroomFormData.newPhone}
                    onChange={e => setHomeroomFormData({ ...homeroomFormData, newPhone: e.target.value })}
                    placeholder="081234567890"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mata Pelajaran yang Diampu
                </label>
                <input
                  type="text"
                  value={homeroomFormData.newSubject}
                  onChange={e => setHomeroomFormData({ ...homeroomFormData, newSubject: e.target.value })}
                  placeholder="Contoh: Matematika / Bahasa Indonesia"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};
