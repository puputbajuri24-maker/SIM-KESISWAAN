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
  Table,
  ArrowUpDown,
  Layers,
  ChevronDown,
  ChevronUp,
  Printer,
  Scale,
  BookOpenCheck,
  Crown,
  Check
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Student } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';
import { ClassGridFilter } from '../components/common/ClassGridFilter';
import { ClassManagementModal } from '../components/common/ClassManagementModal';
import { SchoolLetterhead } from '../components/common/SchoolLetterhead';
import { OFFICIAL_DISCIPLINE_TIERS, getDisciplineTier } from '../services/officialRulesData';
import { StudentsListTab, StudentsHomeroomTab } from './students/tabs';
import * as XLSX from 'xlsx';
import {
  downloadStudentTemplateXLSX,
  downloadStudentTemplateCSV,
  parseStudentRows,
  ParsedImportStudent
} from '../utils/studentTemplate';
import {
  calculateStudentCountsByClass,
  isStudentInClass,
  sortStudentsCustom,
  StudentSortOrder,
  groupStudentsByClass
} from '../utils/classResolver';

export const StudentsPage: React.FC = () => {
  const { isWakaOrAdmin } = useAuth();
  const { toast } = useToast();
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [isSavingHomeroom, setIsSavingHomeroom] = useState(false);
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
    extracurriculars,
    members,
    addMember,
    removeMember,
    updateMemberStatus,
    osimMembers,
    addOsimMember,
    deleteOsimMember,
    updateOsimMember,
    osimDepartments,
    violations,
    counseling,
    achievements,
    attendance,
    activeAcademicYear,
    schoolSetting,
    parentCallLetters
  } = useSchool();

  // Disciplinary Card Print State
  const [isPrintDisciplineCardOpen, setIsPrintDisciplineCardOpen] = useState(false);

  // Master Tab
  const [mainTab, setMainTab] = useState<'students' | 'homeroom'>('students');

  // Filters for Students
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [studentSortOrder, setStudentSortOrder] = useState<StudentSortOrder>('class-alphabetical');
  const [viewMode, setViewMode] = useState<'table' | 'grouped'>('table');
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(new Set());

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
  const [detailTab, setDetailTab] = useState<'profile' | 'ekskul' | 'osim' | 'prestasi' | 'pelanggaran' | 'presensi'>('profile');

  // Form states for multi-extracurricular and OSIM selection
  const [formEkskulIds, setFormEkskulIds] = useState<string[]>([]);
  const [formIsOsim, setFormIsOsim] = useState(false);
  const [formOsimPosition, setFormOsimPosition] = useState<string>('Anggota');
  const [formOsimSekbid, setFormOsimSekbid] = useState<string>('BPH (Badan Pengurus Harian)');

  // Detail Modal inline management states
  const [isManagingStudentEkskuls, setIsManagingStudentEkskuls] = useState(false);
  const [manageEkskulSelectedIds, setManageEkskulSelectedIds] = useState<string[]>([]);
  const [isAddingStudentToOsim, setIsAddingStudentToOsim] = useState(false);
  const [quickOsimPosition, setQuickOsimPosition] = useState<string>('Anggota');
  const [quickOsimSekbid, setQuickOsimSekbid] = useState<string>('BPH (Badan Pengurus Harian)');

  // Import State
  const [previewStudents, setPreviewStudents] = useState<ParsedImportStudent[]>([]);
  const [importFileName, setImportFileName] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('replace');
  const [importPreviewFilter, setImportPreviewFilter] = useState<'all' | 'valid' | 'invalid'>('all');
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

  // Automatically open student profile if navigated from Global Search or pending selection
  useEffect(() => {
    const processStudentTarget = (detail: any) => {
      if (!detail) return;
      if (detail.category === 'students' || !detail.category || detail.tabId === 'students') {
        const targetId = detail.entityId || detail.rawId || detail.id;
        const targetStudent = students.find(
          s =>
            s.id === targetId ||
            s.id === detail.rawId ||
            s.id === detail.id ||
            s.nis === targetId ||
            s.nis === detail.rawId ||
            (detail.title && s.fullName && s.fullName.toLowerCase().trim() === detail.title.toLowerCase().trim())
        );
        if (targetStudent) {
          // Reset table filters so the selected student isn't masked out
          setSelectedClass('all');
          setSelectedStatus('all');
          setSelectedGender('all');
          setSelectedStudent(targetStudent);
          setIsDetailOpen(true);
        }
      }
    };

    // 1. Check pending target from sessionStorage on mount / student list updates
    try {
      const pendingStr = sessionStorage.getItem('pending_search_select');
      if (pendingStr) {
        const pending = JSON.parse(pendingStr);
        if (pending && (pending.category === 'students' || pending.tabId === 'students')) {
          sessionStorage.removeItem('pending_search_select');
          setTimeout(() => {
            processStudentTarget(pending);
          }, 50);
        }
      }
    } catch (e) {
      console.warn('Error reading pending_search_select', e);
    }

    // 2. Event listener for real-time selection when StudentsPage is already mounted
    const handleSearchSelect = (event: Event) => {
      const customEvent = event as CustomEvent<{
        category: string;
        id: string;
        rawId: string;
        entityId?: string;
        title: string;
        tabId?: string;
      }>;
      const detail = customEvent.detail;
      if (detail) {
        processStudentTarget(detail);
      }
    };

    window.addEventListener('app:search-select', handleSearchSelect);
    return () => window.removeEventListener('app:search-select', handleSearchSelect);
  }, [students]);

  // Student count map per class (Accurately resolves by class ID & Name)
  const studentCountsByClassId = useMemo(() => {
    return calculateStudentCountsByClass(students, classes);
  }, [students, classes]);

  // Per-class alphabetical ranking map (Nomor Urut Absen Kelas: 1, 2, 3... per rombel kelas)
  const studentClassRankMap = useMemo(() => {
    const map = new Map<string, { index: number; total: number }>();
    const groups = groupStudentsByClass(students, classes);
    groups.forEach(grp => {
      grp.students.forEach((st, idx) => {
        map.set(st.id, { index: idx + 1, total: grp.students.length });
      });
    });
    return map;
  }, [students, classes]);

  // Filtered Students (Sorted strictly per chosen Sort Order, defaulting to Per Kelas -> Abjad A-Z)
  const filteredStudents = useMemo(() => {
    const filtered = students.filter(s => {
      if (selectedClass !== 'all') {
        if (!isStudentInClass(s, selectedClass, classes)) return false;
      }
      if (selectedStatus !== 'all' && s.status !== selectedStatus) return false;
      if (selectedGender !== 'all' && s.gender !== selectedGender) return false;
      return true;
    });

    return sortStudentsCustom(filtered, classes, studentSortOrder);
  }, [students, selectedClass, selectedStatus, selectedGender, classes, studentSortOrder]);

  // Grouped students per class for the Sekat Per Kelas (Grouped View)
  const groupedStudents = useMemo(() => {
    if (selectedClass !== 'all') {
      const activeCls = classes.find(c => c.id === selectedClass || c.name === selectedClass);
      if (activeCls) {
        return groupStudentsByClass(filteredStudents, [activeCls]);
      }
    }
    return groupStudentsByClass(filteredStudents, classes);
  }, [filteredStudents, classes, selectedClass]);

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
    setFormEkskulIds([]);
    setFormIsOsim(false);
    setFormOsimPosition('Anggota');
    setFormOsimSekbid('BPH (Badan Pengurus Harian)');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (student: Student, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedStudent(student);
    setFormData(student);

    // Populate active enrolled extracurriculars
    const existingEkskuls = members
      .filter(m => m.studentId === student.id && m.status === 'Aktif')
      .map(m => m.extracurricularId);
    setFormEkskulIds(existingEkskuls);

    // Check OSIM membership
    const existingOsim = osimMembers.find(o => 
      (o.studentId && o.studentId === student.id) ||
      (o.studentNis && o.studentNis === student.nis) ||
      (o.fullName && o.fullName.toLowerCase() === student.fullName.toLowerCase())
    );
    if (existingOsim) {
      setFormIsOsim(true);
      setFormOsimPosition(existingOsim.position || 'Anggota');
      setFormOsimSekbid(existingOsim.sekbid || 'BPH (Badan Pengurus Harian)');
    } else {
      setFormIsOsim(false);
      setFormOsimPosition('Anggota');
      setFormOsimSekbid('BPH (Badan Pengurus Harian)');
    }

    setIsFormOpen(true);
  };

  const handleOpenDetail = (student: Student) => {
    setSelectedStudent(student);
    setDetailTab('profile');
    setIsManagingStudentEkskuls(false);
    setIsAddingStudentToOsim(false);
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
      toast.warning('Mohon lengkapi NIS, Nama Siswa, dan Kelas.');
      return;
    }

    setIsSavingStudent(true);
    try {
      const targetClass = classes.find(c => c.id === formData.classId);
      let targetStudentId = selectedStudent?.id;
      const studentName = formData.fullName.trim();
      const studentNis = formData.nis.trim();
      const studentClass = targetClass?.name || formData.className || 'X';
      const studentGender = (formData.gender as 'L' | 'P') || 'L';

      if (selectedStudent) {
        await updateStudent(selectedStudent.id, {
          ...formData,
          className: targetClass?.name || formData.className,
          major: targetClass?.major || formData.major
        });
        toast.success(`Data siswa "${studentName}" berhasil diperbarui!`);
      } else {
        const created = await addStudent({
          nis: studentNis,
          nisn: formData.nisn || '',
          fullName: studentName,
          gender: studentGender,
          birthPlace: formData.birthPlace || '',
          birthDate: formData.birthDate || '',
          classId: formData.classId!,
          className: studentClass,
          major: targetClass?.major || 'Umum',
          phone: formData.phone || '',
          parentName: formData.parentName || '',
          parentPhone: formData.parentPhone || '',
          address: formData.address || '',
          status: (formData.status as any) || 'Aktif'
        });
        if (created) {
          targetStudentId = created.id;
        }
        toast.success(`Data siswa baru "${studentName}" berhasil ditambahkan!`);
      }

      // Handle multi-extracurricular enrollment
      if (targetStudentId) {
        const currentActiveMemberships = members.filter(
          m => m.studentId === targetStudentId && m.status === 'Aktif'
        );
        const currentActiveEkskulIds = currentActiveMemberships.map(m => m.extracurricularId);

        // Remove unselected extracurriculars
        for (const mem of currentActiveMemberships) {
          if (!formEkskulIds.includes(mem.extracurricularId)) {
            await removeMember(mem.id);
          }
        }

        // Add newly selected extracurriculars
        for (const ekskulId of formEkskulIds) {
          if (!currentActiveEkskulIds.includes(ekskulId)) {
            const ekskul = extracurriculars.find(e => e.id === ekskulId);
            if (ekskul) {
              await addMember({
                extracurricularId: ekskul.id,
                extracurricularName: ekskul.name,
                studentId: targetStudentId,
                studentName: studentName,
                studentNis: studentNis,
                studentClass: studentClass,
                gender: studentGender,
                role: 'Anggota',
                joinDate: new Date().toISOString().split('T')[0],
                status: 'Aktif',
                academicYear: activeAcademicYear
              });
            }
          }
        }

        // Handle OSIM Membership synchronization
        const existingOsim = osimMembers.find(o => 
          (o.studentId && o.studentId === targetStudentId) ||
          (o.studentNis && o.studentNis === studentNis) ||
          (o.fullName && o.fullName.toLowerCase() === studentName.toLowerCase())
        );

        if (formIsOsim) {
          if (existingOsim) {
            await updateOsimMember(existingOsim.id, {
              position: formOsimPosition as any,
              sekbid: formOsimSekbid as any,
              status: 'Aktif',
              className: studentClass,
              studentNis: studentNis
            });
          } else {
            await addOsimMember({
              studentId: targetStudentId,
              fullName: studentName,
              studentNis: studentNis,
              className: studentClass,
              position: formOsimPosition as any,
              sekbid: formOsimSekbid as any,
              phone: formData.phone || '-',
              photoUrl: '',
              status: 'Aktif',
              period: activeAcademicYear
            });
          }
        } else if (existingOsim) {
          await deleteOsimMember(existingOsim.id);
        }
      }
    } catch (err: any) {
      console.error('Error saving student:', err);
      toast.error('Gagal menyimpan data siswa: ' + (err?.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsSavingStudent(false);
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
      toast.warning('Pilih kelas terlebih dahulu.');
      return;
    }

    setIsSavingHomeroom(true);
    try {
      let finalTeacherName = '';
      let finalTeacherId: string | undefined = undefined;

      if (homeroomFormData.mode === 'new') {
        if (!homeroomFormData.newFullName.trim()) {
          toast.warning('Nama Guru Baru wajib diisi.');
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
          toast.warning('Pilih guru yang tersedia.');
          return;
        }
        finalTeacherName = found.fullName;
        finalTeacherId = found.id;
      }

      await assignHomeroomTeacher(homeroomFormData.classId, finalTeacherName, finalTeacherId);
      toast.success(`Wali kelas "${finalTeacherName}" berhasil ditetapkan!`);
      setIsAddHomeroomModalOpen(false);
    } catch (err: any) {
      toast.error('Gagal menetapkan wali kelas: ' + (err?.message || 'Terjadi kesalahan'));
    } finally {
      setIsSavingHomeroom(false);
    }
  };

  const handleQuickAssignHomeroom = async (classId: string, teacherName: string) => {
    try {
      const foundTeacher = teachers.find(t => t.fullName === teacherName);
      await assignHomeroomTeacher(classId, teacherName, foundTeacher?.id);
      toast.success(`Wali kelas berhasil diubah ke ${teacherName}`);
    } catch (err: any) {
      toast.error('Gagal mengubah wali kelas: ' + (err?.message || 'Terjadi kesalahan'));
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

        const parsed = parseStudentRows(rawData, classes, activeAcademicYear, students.map(s => s.nis));
        setPreviewStudents(parsed);
        setImportPreviewFilter('all');
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
      toast.warning('Tidak ada baris data siswa yang valid untuk diimpor. Periksa kembali NIS dan Nama Siswa.');
      return;
    }

    setIsImporting(true);
    try {
      const cleanStudents = validStudents.map(({ isValid, errors, ...rest }) => rest);
      const count = await importStudentsBulk(cleanStudents, importMode);
      toast.success(`Berhasil mengimpor ${count} data siswa ke database kesiswaan!`);
      handleResetImport();
      setIsImportOpen(false);
    } catch (e: any) {
      console.error('Error bulk saving students:', e);
      toast.error('Terjadi kendala saat menyimpan data siswa. Silakan coba lagi.');
    } finally {
      setIsImporting(false);
    }
  };

  // Student specific relations
  const studentMemberships = selectedStudent ? members.filter(m => m.studentId === selectedStudent.id) : [];
  const studentOsimMembership = selectedStudent ? osimMembers.find(o => 
    (o.studentId && o.studentId === selectedStudent.id) ||
    (o.studentNis && o.studentNis === selectedStudent.nis) ||
    (o.fullName && o.fullName.toLowerCase() === selectedStudent.fullName.toLowerCase())
  ) : null;
  const studentAchievements = selectedStudent ? achievements.filter(a => a.studentId === selectedStudent.id) : [];
  const studentViolations = selectedStudent ? violations.filter(v => v.studentId === selectedStudent.id && !v.isDeleted) : [];
  const studentCounselings = selectedStudent ? counseling.filter(c => c.studentId === selectedStudent.id) : [];
  const studentParentCalls = selectedStudent ? parentCallLetters.filter(p => p.studentId === selectedStudent.id) : [];

  const studentTotalPoints = studentViolations.reduce((acc, v) => acc + (Number(v.points) || 0), 0);
  const studentTier = getDisciplineTier(studentTotalPoints);

  const columns: Column<Student>[] = [
    {
      header: 'No.',
      className: 'w-14 text-center',
      cell: s => {
        const rank = studentClassRankMap.get(s.id);
        return (
          <div className="flex flex-col items-center justify-center">
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 font-black text-xs text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800 shadow-2xs"
              title={rank ? `Nomor Urut Absen ke-${rank.index} di rombel ${s.className}` : 'Nomor Absen'}
            >
              {rank ? rank.index : '-'}
            </span>
          </div>
        );
      }
    },
    {
      header: 'NIS / NISN',
      accessorKey: 'nis',
      sortable: true,
      cell: s => (
        <div>
          {s.code && (
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 block w-fit mb-0.5">
              {s.code}
            </span>
          )}
          <span className="font-bold text-slate-900 dark:text-slate-100">{s.nis}</span>
          {s.nisn && <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">NISN: {s.nisn}</p>}
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
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
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
      cell: s => {
        const rank = studentClassRankMap.get(s.id);
        return (
          <div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-800 dark:text-slate-200">
                {s.className}
              </span>
              {rank && (
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold hidden sm:inline" title={`Urutan absen ke-${rank.index} dari total ${rank.total} siswa di kelas ${s.className}`}>
                  (Absen #{rank.index})
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate max-w-[150px]">{s.major}</p>
          </div>
        );
      }
    },
    {
      header: 'Kegiatan (OSIM & Ekskul)',
      className: 'min-w-[170px]',
      cell: s => {
        const studentEkskuls = (members || []).filter(m => m.studentId === s.id && m.status === 'Aktif');
        const osimEntry = (osimMembers || []).find(o => 
          (o.studentId && o.studentId === s.id) ||
          (o.studentNis && o.studentNis === s.nis) ||
          (o.fullName && o.fullName.toLowerCase() === s.fullName.toLowerCase())
        );

        if (!osimEntry && studentEkskuls.length === 0) {
          return <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium italic">Belum terdaftar</span>;
        }

        return (
          <div className="flex flex-col gap-1 text-[11px]">
            {osimEntry && (
              <span className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 px-2 py-0.5 rounded-md w-fit text-[10px]">
                <Crown className="w-3 h-3 text-amber-500" />
                <span>OSIM ({osimEntry.position || 'Pengurus'})</span>
              </span>
            )}
            {studentEkskuls.length > 0 && (
              <span
                className="inline-flex items-center gap-1 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 px-2 py-0.5 rounded-md w-fit text-[10px]"
                title={studentEkskuls.map(e => e.extracurricularName).join(', ')}
              >
                <span>🎯 {studentEkskuls.length} Ekskul</span>
                <span className="text-indigo-500 dark:text-indigo-400 max-w-[120px] truncate">
                  ({studentEkskuls.map(e => e.extracurricularName).join(', ')})
                </span>
              </span>
            )}
          </div>
        );
      }
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
        <StudentsListTab
          classes={classes}
          selectedClass={selectedClass}
          setSelectedClass={setSelectedClass}
          studentCountsByClassId={studentCountsByClassId}
          totalStudentCount={students.length}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedGender={selectedGender}
          setSelectedGender={setSelectedGender}
          studentSortOrder={studentSortOrder}
          setStudentSortOrder={setStudentSortOrder}
          viewMode={viewMode}
          setViewMode={setViewMode}
          collapsedGroupIds={collapsedGroupIds}
          setCollapsedGroupIds={setCollapsedGroupIds}
          filteredStudents={filteredStudents}
          columns={columns}
          handleOpenDetail={handleOpenDetail}
          selectedStudentIds={selectedStudentIds}
          handleToggleSelectStudent={handleToggleSelectStudent}
          handleToggleSelectAllStudents={handleToggleSelectAllStudents}
          setIsBulkDeleteOpen={setIsBulkDeleteOpen}
          groupedStudents={groupedStudents}
          handleOpenEdit={handleOpenEdit}
          handleOpenDelete={handleOpenDelete}
        />
      ) : (
        <StudentsHomeroomTab
          homeroomStats={homeroomStats}
          teachers={teachers}
          homeroomGradeFilter={homeroomGradeFilter}
          setHomeroomGradeFilter={setHomeroomGradeFilter}
          homeroomSearchQuery={homeroomSearchQuery}
          setHomeroomSearchQuery={setHomeroomSearchQuery}
          handleOpenAddHomeroom={handleOpenAddHomeroom}
          filteredHomeroomClasses={filteredHomeroomClasses}
          studentCountsByClassId={studentCountsByClassId}
          handleQuickAssignHomeroom={handleQuickAssignHomeroom}
        />
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
              disabled={isSavingStudent}
              onClick={handleSaveStudent}
              className={`px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all ${
                isSavingStudent ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isSavingStudent ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Data Siswa</span>
              )}
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

          {/* Pilihan Ekstrakurikuler yang Diminati (Bebas Pilih Lebih dari 1) */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-600" />
                Ekstrakurikuler yang Diikuti / Diminati (Bisa &gt; 1):
              </label>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                {formEkskulIds.length} dipilih
              </span>
            </div>
            {extracurriculars.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">Belum ada data ekstrakurikuler terdaftar di sistem.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60">
                {extracurriculars.map(ekskul => {
                  const isSelected = formEkskulIds.includes(ekskul.id);
                  return (
                    <button
                      key={ekskul.id}
                      type="button"
                      onClick={() => {
                        setFormEkskulIds(prev => 
                          prev.includes(ekskul.id) ? prev.filter(id => id !== ekskul.id) : [...prev, ekskul.id]
                        );
                      }}
                      className={`p-2 rounded-lg border text-left text-xs transition flex items-center justify-between gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 font-bold'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <span className="truncate">{ekskul.name}</span>
                      <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white font-bold' : 'border border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && '✓'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] text-slate-400">Centang ekskul yang digemari siswa. Siswa dapat mengikuti lebih dari 1 ekstrakurikuler sekaligus.</p>
          </div>

          {/* Pilihan Kepengurusan OSIM */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formIsOsim}
                onChange={e => setFormIsOsim(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500/20"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                Daftarkan Juga Sebagai Pengurus OSIM
              </span>
            </label>

            {formIsOsim && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/80 dark:border-amber-900/40">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jabatan Pengurus:
                  </label>
                  <select
                    value={formOsimPosition}
                    onChange={e => setFormOsimPosition(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="Ketua Umum">Ketua Umum</option>
                    <option value="Wakil Ketua">Wakil Ketua</option>
                    <option value="Sekretaris 1">Sekretaris 1</option>
                    <option value="Sekretaris 2">Sekretaris 2</option>
                    <option value="Bendahara 1">Bendahara 1</option>
                    <option value="Bendahara 2">Bendahara 2</option>
                    <option value="Koordinator Sekbid">Koordinator Sekbid</option>
                    <option value="Anggota Sekbid">Anggota Sekbid</option>
                    <option value="Anggota">Anggota</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Seksi Bidang (Sekbid):
                  </label>
                  <select
                    value={formOsimSekbid}
                    onChange={e => setFormOsimSekbid(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="BPH (Badan Pengurus Harian)">BPH (Badan Pengurus Harian)</option>
                    <option value="Sekbid 1: Keimanan & Ketaqwaan">Sekbid 1: Keimanan & Ketaqwaan</option>
                    <option value="Sekbid 2: Budi Pekerti & Karakter">Sekbid 2: Budi Pekerti & Karakter</option>
                    <option value="Sekbid 3: Kepribadian Unggul & Wawasan Kebangsaan">Sekbid 3: Kepribadian Unggul & Wawasan Kebangsaan</option>
                    <option value="Sekbid 4: Prestasi Akademik, Seni & Olahraga">Sekbid 4: Prestasi Akademik, Seni & Olahraga</option>
                    <option value="Sekbid 5: Demokrasi, HAM & Lingkungan Hidup">Sekbid 5: Demokrasi, HAM & Lingkungan Hidup</option>
                    <option value="Sekbid 6: Kreativitas, Keterampilan & Kewirausahaan">Sekbid 6: Kreativitas, Keterampilan & Kewirausahaan</option>
                    <option value="Sekbid 7: Kualitas Jasmani, Kesehatan & Gizi">Sekbid 7: Kualitas Jasmani, Kesehatan & Gizi</option>
                    <option value="Sekbid 8: Sastra, Budaya & Moderasi Beragama">Sekbid 8: Sastra, Budaya & Moderasi Beragama</option>
                    <option value="Sekbid 9: Teknologi Informasi & Komunikasi">Sekbid 9: Teknologi Informasi & Komunikasi</option>
                    <option value="Sekbid 10: Komunikasi Bahasa Asing & Kehumasan">Sekbid 10: Komunikasi Bahasa Asing & Kehumasan</option>
                  </select>
                </div>
              </div>
            )}
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
              onClick={() => setDetailTab('osim')}
              className={`px-3 py-2 rounded-t-xl transition-colors flex items-center gap-1.5 ${
                detailTab === 'osim' ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 border-b-2 border-amber-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>OSIM</span>
              {studentOsimMembership && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100">
                  Pengurus
                </span>
              )}
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
              className={`px-3 py-2 rounded-t-xl transition-colors flex items-center gap-1.5 ${
                detailTab === 'pelanggaran' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Buku Kedisiplinan SK B-380</span>
              {studentViolations.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  studentTotalPoints >= 41 ? 'bg-rose-600 text-white' :
                  studentTotalPoints >= 10 ? 'bg-amber-600 text-white' :
                  'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}>
                  {studentTotalPoints} P
                </span>
              )}
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
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                <div>
                  <h4 className="font-bold text-xs text-indigo-950 dark:text-indigo-200">
                    Ekstrakurikuler Terdaftar ({studentMemberships.length})
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Siswa berhak mendaftar dan aktif di lebih dari 1 ekstrakurikuler yang digemarinya.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setManageEkskulSelectedIds(
                      studentMemberships.filter(m => m.status === 'Aktif').map(m => m.extracurricularId)
                    );
                    setIsManagingStudentEkskuls(!isManagingStudentEkskuls);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isManagingStudentEkskuls ? 'Tutup Pilihan Ekskul' : '+ Tambah / Kelola Ekskul'}</span>
                </button>
              </div>

              {/* Multi-selection picker for extracurriculars */}
              {isManagingStudentEkskuls && (
                <div className="p-4 rounded-xl border-2 border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-900 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      Centang Ekstrakurikuler untuk Siswa Ini:
                    </span>
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                      {manageEkskulSelectedIds.length} ekstrakurikuler dipilih
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
                    {extracurriculars.map(ekskul => {
                      const isSelected = manageEkskulSelectedIds.includes(ekskul.id);
                      return (
                        <button
                          key={ekskul.id}
                          type="button"
                          onClick={() => {
                            setManageEkskulSelectedIds(prev => 
                              prev.includes(ekskul.id) ? prev.filter(id => id !== ekskul.id) : [...prev, ekskul.id]
                            );
                          }}
                          className={`p-2.5 rounded-xl border text-left flex items-start justify-between gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-950 dark:text-indigo-100 shadow-2xs'
                              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <p className="font-bold text-xs">{ekskul.name}</p>
                            <p className="text-[10px] text-slate-400">{ekskul.category || 'Kesiswaan'}</p>
                          </div>
                          <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-indigo-600 text-white font-bold' : 'border border-slate-300 dark:border-slate-600'
                          }`}>
                            {isSelected && '✓'}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsManagingStudentEkskuls(false)}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!selectedStudent) return;
                        try {
                          const currentActive = studentMemberships.filter(m => m.status === 'Aktif');
                          const currentActiveIds = currentActive.map(m => m.extracurricularId);

                          // Add newly checked
                          for (const ekskulId of manageEkskulSelectedIds) {
                            if (!currentActiveIds.includes(ekskulId)) {
                              const eks = extracurriculars.find(e => e.id === ekskulId);
                              if (eks) {
                                await addMember({
                                  extracurricularId: eks.id,
                                  extracurricularName: eks.name,
                                  studentId: selectedStudent.id,
                                  studentName: selectedStudent.fullName,
                                  studentNis: selectedStudent.nis,
                                  studentClass: selectedStudent.className,
                                  gender: selectedStudent.gender,
                                  role: 'Anggota',
                                  joinDate: new Date().toISOString().split('T')[0],
                                  status: 'Aktif',
                                  academicYear: activeAcademicYear
                                });
                              }
                            }
                          }

                          // Remove unchecked
                          for (const m of currentActive) {
                            if (!manageEkskulSelectedIds.includes(m.extracurricularId)) {
                              await removeMember(m.id);
                            }
                          }
                        } catch (e) {
                          console.error(e);
                        } finally {
                          setIsManagingStudentEkskuls(false);
                        }
                      }}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 cursor-pointer"
                    >
                      Simpan Perubahan Ekstrakurikuler
                    </button>
                  </div>
                </div>
              )}

              {/* Memberships list */}
              {studentMemberships.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Compass className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Siswa belum terdaftar pada ekstrakurikuler manapun.</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Klik tombol "+ Tambah / Kelola Ekskul" di atas untuk mendaftarkan siswa ke ekstrakurikuler yang digemarinya.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {studentMemberships.map(m => (
                    <div key={m.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{m.extracurricularName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                            {m.role || 'Anggota'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          No Anggota: {m.memberNumber || '-'} • Bergabung: {m.joinDate || '-'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={m.status} />
                        <button
                          type="button"
                          onClick={() => updateMemberStatus(m.id, m.status === 'Aktif' ? 'Nonaktif' : 'Aktif')}
                          className="px-2 py-1 rounded-lg border text-[11px] font-medium border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                        >
                          {m.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeMember(m.id)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title="Hapus dari Ekskul Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: OSIM */}
          {detailTab === 'osim' && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <div>
                  <h4 className="font-bold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-500" />
                    Status Organisasi Siswa Intra Madrasah (OSIM)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Siswa dapat menjabat di kepengurusan OSIM sekaligus aktif di berbagai ekstrakurikuler madrasah.
                  </p>
                </div>
              </div>

              {studentOsimMembership ? (
                <div className="p-4 rounded-2xl border border-amber-300 dark:border-amber-800 bg-gradient-to-br from-amber-50/60 to-orange-50/40 dark:from-amber-950/20 dark:to-orange-950/10 space-y-3 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 font-bold text-xl shadow-2xs">
                        👑
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                          Pengurus OSIM {studentOsimMembership.period || activeAcademicYear}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">
                          {studentOsimMembership.position}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {studentOsimMembership.sekbid || 'BPH (Badan Pengurus Harian)'}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={(studentOsimMembership.status as any) || 'Aktif'} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-amber-200/60 dark:border-amber-900/40 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Nama Terdaftar di OSIM:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{studentOsimMembership.fullName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Akun Login Pengurus:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">
                        {studentOsimMembership.loginUsername || studentOsimMembership.username || 'Belum diaktifkan'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm(`Lepaskan ${studentOsimMembership.fullName} dari kepengurusan OSIM?`)) {
                          await deleteOsimMember(studentOsimMembership.id);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Lepas dari OSIM</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {!isAddingStudentToOsim ? (
                    <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      <Crown className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Siswa ini belum terdaftar di Kepengurusan OSIM
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                        Anda dapat menetapkan siswa ini sebagai BPH atau Koordinator/Anggota Sekbid OSIM madrasah.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsAddingStudentToOsim(true)}
                        className="mt-4 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition shadow-md shadow-amber-600/20 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Tetapkan Sebagai Pengurus OSIM</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                          <Crown className="w-4 h-4 text-amber-500" />
                          Penetapan Jabatan OSIM:
                        </h5>
                        <button
                          type="button"
                          onClick={() => setIsAddingStudentToOsim(false)}
                          className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Jabatan Pengurus:
                          </label>
                          <select
                            value={quickOsimPosition}
                            onChange={e => setQuickOsimPosition(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                          >
                            <option value="Ketua Umum">Ketua Umum</option>
                            <option value="Wakil Ketua">Wakil Ketua</option>
                            <option value="Sekretaris 1">Sekretaris 1</option>
                            <option value="Sekretaris 2">Sekretaris 2</option>
                            <option value="Bendahara 1">Bendahara 1</option>
                            <option value="Bendahara 2">Bendahara 2</option>
                            <option value="Koordinator Sekbid">Koordinator Sekbid</option>
                            <option value="Anggota Sekbid">Anggota Sekbid</option>
                            <option value="Anggota">Anggota</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Seksi Bidang (Sekbid) / Divisi:
                          </label>
                          <select
                            value={quickOsimSekbid}
                            onChange={e => setQuickOsimSekbid(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                          >
                            <option value="BPH (Badan Pengurus Harian)">BPH (Badan Pengurus Harian)</option>
                            <option value="Sekbid 1: Keimanan & Ketaqwaan">Sekbid 1: Keimanan & Ketaqwaan</option>
                            <option value="Sekbid 2: Budi Pekerti & Karakter">Sekbid 2: Budi Pekerti & Karakter</option>
                            <option value="Sekbid 3: Kepribadian Unggul & Wawasan Kebangsaan">Sekbid 3: Kepribadian Unggul & Wawasan Kebangsaan</option>
                            <option value="Sekbid 4: Prestasi Akademik, Seni & Olahraga">Sekbid 4: Prestasi Akademik, Seni & Olahraga</option>
                            <option value="Sekbid 5: Demokrasi, HAM & Lingkungan Hidup">Sekbid 5: Demokrasi, HAM & Lingkungan Hidup</option>
                            <option value="Sekbid 6: Kreativitas, Keterampilan & Kewirausahaan">Sekbid 6: Kreativitas, Keterampilan & Kewirausahaan</option>
                            <option value="Sekbid 7: Kualitas Jasmani, Kesehatan & Gizi">Sekbid 7: Kualitas Jasmani, Kesehatan & Gizi</option>
                            <option value="Sekbid 8: Sastra, Budaya & Moderasi Beragama">Sekbid 8: Sastra, Budaya & Moderasi Beragama</option>
                            <option value="Sekbid 9: Teknologi Informasi & Komunikasi">Sekbid 9: Teknologi Informasi & Komunikasi</option>
                            <option value="Sekbid 10: Komunikasi Bahasa Asing & Kehumasan">Sekbid 10: Komunikasi Bahasa Asing & Kehumasan</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingStudentToOsim(false)}
                          className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!selectedStudent) return;
                            await addOsimMember({
                              studentId: selectedStudent.id,
                              fullName: selectedStudent.fullName,
                              studentNis: selectedStudent.nis,
                              className: selectedStudent.className,
                              position: quickOsimPosition as any,
                              sekbid: quickOsimSekbid as any,
                              phone: selectedStudent.phone || '-',
                              photoUrl: '',
                              status: 'Aktif',
                              period: activeAcademicYear
                            });
                            setIsAddingStudentToOsim(false);
                          }}
                          className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 cursor-pointer"
                        >
                          Simpan Sebagai Pengurus OSIM
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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

          {/* Tab 4: Buku Kedisiplinan & SK B-380 */}
          {detailTab === 'pelanggaran' && (
            <div className="space-y-4 pt-2">
              {/* Disciplinary Summary Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 text-white shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg border ${
                      studentTotalPoints >= 100 ? 'bg-red-500/20 text-red-400 border-red-500/40' :
                      studentTotalPoints >= 41 ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                      studentTotalPoints >= 10 ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                      'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}>
                      {studentTotalPoints}P
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">
                          {studentTier ? studentTier.name : 'STATUS: TERTIB & NORMAL'}
                        </span>
                        {studentTier && (
                          <span className="text-[10px] px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                            Tahap {studentTier.tier}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {studentTier ? studentTier.actionRequired : 'Tidak ada tindakan sanksi aktif (<10 poin)'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsPrintDisciplineCardOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all self-start sm:self-auto"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Kartu Kendali (Buku Saku)</span>
                  </button>
                </div>

                {/* Point progression meter towards 5 tiers */}
                <div className="pt-3">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                    <span>Progres Akumulasi Poin Sanksi SK B-380:</span>
                    <span className="font-mono text-slate-300 font-bold">{studentTotalPoints} / 100 P</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all ${
                        studentTotalPoints >= 100 ? 'bg-red-500' :
                        studentTotalPoints >= 76 ? 'bg-purple-500' :
                        studentTotalPoints >= 41 ? 'bg-rose-500' :
                        studentTotalPoints >= 21 ? 'bg-orange-500' :
                        studentTotalPoints >= 10 ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(4, (studentTotalPoints / 100) * 100))}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-5 gap-1 text-[9px] text-slate-400 mt-1 font-mono text-center">
                    <span>10p Lisan</span>
                    <span>21p SP1</span>
                    <span>41p SP2</span>
                    <span>76p SP3</span>
                    <span>100p Drop</span>
                  </div>
                </div>
              </div>

              {/* Riwayat Surat Panggilan Orang Tua (SP) */}
              {studentParentCalls.length > 0 && (
                <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 text-xs space-y-2">
                  <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5 text-xs">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Riwayat Surat Peringatan & Panggilan Orang Tua ({studentParentCalls.length} Surat)
                  </span>
                  <div className="space-y-1.5">
                    {studentParentCalls.map(p => (
                      <div key={p.id} className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800/60 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-blue-700 dark:text-blue-300">
                            Surat Peringatan / Panggilan Ke-{p.callNumber}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">Tanggal Panggilan: {p.callDate} • Pukul: {p.callTime || '09:00 WIT'}</p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">Yth. {p.parentName || 'Orang Tua / Wali'}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-300 font-bold border border-blue-500/20">
                          {p.status || 'Diterbitkan'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rincian Kasus Pelanggaran Individual */}
              <div className="space-y-2">
                <span className="font-bold text-xs text-slate-700 dark:text-slate-300 block">
                  Catatan Kasus Pelanggaran ({studentViolations.length})
                </span>

                {studentViolations.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center text-emerald-600 font-semibold bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                    ✨ Bersih dari catatan pelanggaran tata tertib madrasah.
                  </p>
                ) : (
                  studentViolations.map(v => (
                    <div key={v.id} className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-800 dark:text-rose-300">{v.violationType}</span>
                        <span className="font-bold text-rose-600">+{v.points} Poin ({v.category})</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">Tindakan: {v.actionTaken || 'Pembinaan guru piket/wali kelas'}</p>
                      <p className="text-[10px] text-slate-400">Dicatat oleh: {v.officerName} • Tanggal: {v.date}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Modal Cetak Kartu Kendali Kedisiplinan Siswa (Format Buku Saku SK B-380) */}
      {isPrintDisciplineCardOpen && selectedStudent && (
        <Modal
          isOpen={isPrintDisciplineCardOpen}
          onClose={() => setIsPrintDisciplineCardOpen(false)}
          title="Kartu Kendali Kedisiplinan Siswa (Buku Saku SK B-380)"
          subtitle={`Dokumen rekam jejak karakter & kedisiplinan: ${selectedStudent.fullName}`}
          maxWidth="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-400">
                Format Berita Acara Buku Kendali Pelanggaran Siswa
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPrintDisciplineCardOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  Tutup
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Kartu Sekarang (A4)</span>
                </button>
              </div>
            </div>
          }
        >
          <div className="bg-white text-slate-900 p-6 rounded-lg font-serif text-[11px] leading-relaxed select-text shadow-sm border border-slate-300">
            <SchoolLetterhead schoolInfo={schoolSetting} compact={true} />

            <div className="text-center my-4 border-b pb-3 border-slate-400">
              <h3 className="font-extrabold text-sm uppercase underline tracking-wide">
                KARTU KENDALI KEDISIPLINAN PESERTA DIDIK
              </h3>
              <p className="text-[11px] font-sans font-semibold text-slate-800 mt-1">
                BERDASARKAN TATA TERTIB RESMI SK NOMOR: B-380/Ma.25.06/PP.00.6/07/2024
              </p>
              <p className="text-[10px] font-sans text-slate-600 mt-0.5">
                Tahun Pelajaran: {activeAcademicYear}
              </p>
            </div>

            {/* Biodata Siswa */}
            <table className="w-full font-sans text-[10.5px] mb-4 border border-slate-300">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="p-1.5 bg-slate-100 font-bold w-36">Nama Peserta Didik</td>
                  <td className="p-1.5 font-bold uppercase">{selectedStudent.fullName}</td>
                  <td className="p-1.5 bg-slate-100 font-bold w-28">Kelas / Rombel</td>
                  <td className="p-1.5 font-bold">{selectedStudent.className}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-1.5 bg-slate-100 font-bold">NIS / NISN</td>
                  <td className="p-1.5 font-mono">{selectedStudent.nis} / {selectedStudent.nisn || '-'}</td>
                  <td className="p-1.5 bg-slate-100 font-bold">Jenis Kelamin</td>
                  <td className="p-1.5">{selectedStudent.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-1.5 bg-slate-100 font-bold">Nama Orang Tua / Wali</td>
                  <td className="p-1.5">{selectedStudent.parentName || '-'}</td>
                  <td className="p-1.5 bg-slate-100 font-bold">No. HP Wali</td>
                  <td className="p-1.5 font-mono">{selectedStudent.parentPhone || '-'}</td>
                </tr>
                <tr>
                  <td className="p-1.5 bg-slate-100 font-bold">Total Akumulasi Poin</td>
                  <td className="p-1.5 font-bold font-mono text-rose-700">
                    {studentTotalPoints} Poin
                  </td>
                  <td className="p-1.5 bg-slate-100 font-bold">Jenjang Sanksi</td>
                  <td className="p-1.5 font-bold text-slate-800">
                    {studentTier ? studentTier.name : 'Tertib & Normal (<10 P)'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Riwayat Pelanggaran */}
            <div className="mb-4">
              <h4 className="font-sans font-bold text-xs uppercase mb-1 text-slate-800">
                A. Catatan Pelanggaran Tata Tertib:
              </h4>
              <table className="w-full font-sans text-[10px] border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="border border-slate-400 p-1 text-center w-7">No</th>
                    <th className="border border-slate-400 p-1 text-center w-20">Tanggal</th>
                    <th className="border border-slate-400 p-1.5 text-left">Bentuk Pelanggaran</th>
                    <th className="border border-slate-400 p-1 text-center w-14">Kategori</th>
                    <th className="border border-slate-400 p-1 text-center w-12">Poin</th>
                    <th className="border border-slate-400 p-1.5 text-left">Tindakan / Sanksi</th>
                    <th className="border border-slate-400 p-1 text-left w-24">Pencatat</th>
                  </tr>
                </thead>
                <tbody>
                  {studentViolations.map((v, idx) => (
                    <tr key={v.id} className="border-b border-slate-300">
                      <td className="border border-slate-300 p-1 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 p-1 text-center font-mono">{v.date}</td>
                      <td className="border border-slate-300 p-1.5 font-semibold">{v.violationType}</td>
                      <td className="border border-slate-300 p-1 text-center">{v.category}</td>
                      <td className="border border-slate-300 p-1 text-center font-bold text-rose-700">+{v.points}</td>
                      <td className="border border-slate-300 p-1.5">{v.actionTaken || '-'}</td>
                      <td className="border border-slate-300 p-1 text-[9px]">{v.officerName}</td>
                    </tr>
                  ))}
                  {studentViolations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-3 text-center text-slate-500 italic">
                        Tidak ada catatan pelanggaran tata tertib (Siswa berstatus tertib).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Riwayat Surat Panggilan */}
            {studentParentCalls.length > 0 && (
              <div className="mb-4 font-sans">
                <h4 className="font-bold text-xs uppercase mb-1 text-slate-800">
                  B. Riwayat Surat Peringatan & Panggilan Orang Tua:
                </h4>
                <div className="space-y-1">
                  {studentParentCalls.map(p => (
                    <div key={p.id} className="p-1.5 border border-slate-300 rounded text-[9.5px] bg-slate-50 flex items-center justify-between">
                      <span><strong>SP Ke-{p.callNumber}</strong> — Tanggal: {p.callDate} ({p.callTime || '09:00 WIT'})</span>
                      <span>Yth. {p.parentName || 'Orang Tua / Wali'}</span>
                      <span className="font-bold text-blue-800">{p.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lembar Tanda Tangan */}
            <div className="pt-4 border-t border-slate-300 font-sans text-xs">
              <p className="text-center italic text-[10px] text-slate-600 mb-3">
                Kartu ini merupakan dokumen resmi catatan kepatuhan tata tertib madrasah untuk keperluan pembinaan karakter dan evaluasi kenaikan kelas/kelulusan.
              </p>

              <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                <div>
                  <p>Peserta Didik,</p>
                  <div className="h-14"></div>
                  <p className="font-bold underline">{selectedStudent.fullName}</p>
                  <p className="text-[9px] text-slate-600">Siswa Bersangkutan</p>
                </div>

                <div>
                  <p>Orang Tua / Wali,</p>
                  <div className="h-14"></div>
                  <p className="font-bold underline">{selectedStudent.parentName || '..........................'}</p>
                  <p className="text-[9px] text-slate-600">Wali Murid</p>
                </div>

                <div>
                  <p>Wali Kelas {selectedStudent.className},</p>
                  <div className="h-14"></div>
                  <p className="font-bold underline">
                    {classes.find(c => c.name === selectedStudent.className)?.homeroomTeacher || 'Wali Kelas'}
                  </p>
                  <p className="text-[9px] text-slate-600">Pembina Kelas</p>
                </div>

                <div>
                  <p>Koordinator BK,</p>
                  <div className="h-14"></div>
                  <p className="font-bold underline">Guru BK / Konselor</p>
                  <p className="text-[9px] text-slate-600">Pamong Karakter</p>
                </div>
              </div>

              <div className="text-center pt-4 mt-2 border-t border-dashed border-slate-300">
                <p className="text-[10px]">Mengetahui,</p>
                <p className="font-bold text-[10.5px]">Waka Kesiswaan MAN 2 Seram Bagian Timur</p>
                <div className="h-12"></div>
                <p className="font-bold underline text-[10.5px]">
                  {schoolSetting?.wakaName || schoolSetting?.wakaKesiswaanName || 'Puput Eka Bajuri, S.Pd., M.Or'}
                </p>
                <p className="text-[9px] text-slate-600">NIP. {schoolSetting?.wakaNip || '198806082023211020'}</p>
              </div>
            </div>
          </div>
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

                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setImportPreviewFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      importPreviewFilter === 'all'
                        ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-xs'
                        : 'bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Semua ({previewStudents.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportPreviewFilter('valid')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      importPreviewFilter === 'valid'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                    }`}
                  >
                    ✓ {previewStudents.filter(s => s.isValid).length} Valid
                  </button>
                  {previewStudents.filter(s => !s.isValid).length > 0 && (
                    <button
                      type="button"
                      onClick={() => setImportPreviewFilter('invalid')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        importPreviewFilter === 'invalid'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                      }`}
                    >
                      ⚠ {previewStudents.filter(s => !s.isValid).length} Bermasalah
                    </button>
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
                    {previewStudents
                      .filter(s => {
                        if (importPreviewFilter === 'valid') return s.isValid;
                        if (importPreviewFilter === 'invalid') return !s.isValid;
                        return true;
                      })
                      .map((s, idx) => (
                      <tr
                        key={idx}
                        className={s.isValid ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40' : 'bg-rose-50/50 dark:bg-rose-950/20'}
                      >
                        <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400 font-semibold">{idx + 1}</td>
                        <td className="py-2 px-3">
                          {s.code && (
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 block w-fit mb-0.5">
                              {s.code}
                            </span>
                          )}
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{s.nis || '-'}</span>
                          {s.nisn && <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">NISN: {s.nisn}</div>}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{s.fullName}</div>
                          {s.birthPlace && (
                            <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
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
                          {s.parentName && <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">Wali: {s.parentName}</div>}
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
              disabled={isSavingHomeroom}
              onClick={handleSaveHomeroom}
              className={`px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all ${
                isSavingHomeroom ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isSavingHomeroom ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan & Tetapkan Wali Kelas</span>
              )}
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
