import React, { useState, useMemo } from 'react';
import {
  Server,
  Users,
  ShieldCheck,
  Key,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Copy,
  Printer,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Database,
  Eye,
  EyeOff,
  UserCheck,
  Crown,
  HeartHandshake,
  Award,
  Tent,
  FileText,
  Activity,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  QrCode,
  HardDrive,
  Building,
  Calendar,
  Save,
  School,
  X,
  History,
  Megaphone,
  Wallet,
  LogIn,
  Compass,
  Shield,
  UserPlus,
  GraduationCap,
  Check,
  RotateCcw,
  LayoutGrid,
  List,
  Phone,
  Mail,
  ChevronRight,
  SlidersHorizontal,
  Info,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSchool } from '../contexts/SchoolContext';
import { AnnouncementManagementPanel } from '../components/announcements/AnnouncementManagementPanel';
import { UserProfile, UserRole, SchoolSetting, Teacher, Student, SchoolClass } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { AuditLogsPanel } from '../components/cpanel/AuditLogsPanel';
import { CPanelUserTab, CPanelBackupRestoreTab, CPanelLogsTab } from './cpanel/tabs';
import { RbacMatrixPanel } from '../components/cpanel/RbacMatrixPanel';
import { AcademicYearManagementModal } from '../components/common/AcademicYearManagementModal';
import { CentralizedCrudManager } from '../components/cpanel/CentralizedCrudManager';
import {
  getTeacherInitials,
  isGuruBKOrPembinaRole,
  getInitialsColorTheme
} from '../utils/initials';
import { getDefaultOsimPassword } from '../services/seedData';
import { getUserSlipCredentials } from '../utils/osimAccountHelper';
import { getEkskulTheme } from '../utils/ekskulColors';
import { getUserHierarchyClassification, sortUsersByHierarchy } from '../utils/syncUtils';

export const CPanelPage: React.FC = () => {
  const { allUsers, currentUser, isSuperAdmin, addUser, updateUser, deleteUser, resetUserPassword, loginWithUser, loginWithDemoRole, syncUsersFromTeachers, syncUsersFromOsim } = useAuth();
  const {
    schoolSetting,
    updateSchoolSetting,
    academicYears,
    activeAcademicYear,
    activeSemester,
    setActiveAcademicYear,
    extracurriculars,
    seedFirebaseDatabase,
    uploadAllDataToFirestore,
    clearAllOperationalData,
    exportFullDatabaseJSON,
    importFullDatabaseJSON,
    students,
    teachers,
    classes,
    auditLogs,
    syncUserFromCPanel,
    syncDeleteUserFromCPanel,
    syncAllCPanelUsers,
    osimDepartments,
    osimMembers
  } = useSchool();

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'crud_center' | 'announcements' | 'school' | 'matrix' | 'sync' | 'logs'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // View Mode for user list (Tabel vs Kartu Grid) - same as Pembina Ekstra & OSIM
  const [userViewMode, setUserViewMode] = useState<'table' | 'cards'>('table');
  const [rolePillFilter, setRolePillFilter] = useState<string>('all');

  // Source Mode for Add User Modal: Database Dewan Guru vs Database Siswa vs Input Manual
  const [accountSourceType, setAccountSourceType] = useState<'teacher' | 'student' | 'manual'>('teacher');
  const [selectedTeacherForAccount, setSelectedTeacherForAccount] = useState<Teacher | null>(null);
  const [addTeacherSearchTerm, setAddTeacherSearchTerm] = useState('');
  const [teacherFilterCategory, setTeacherFilterCategory] = useState<'all' | 'unregistered' | 'bk' | 'pembina'>('all');
  const [isChangingTeacherForAccount, setIsChangingTeacherForAccount] = useState(false);

  // Student selection for OSIM account creation in Add User Modal
  const [selectedStudentForAccount, setSelectedStudentForAccount] = useState<Student | null>(null);
  const [addStudentSearchTerm, setAddStudentSearchTerm] = useState('');
  const [addStudentClassFilter, setAddStudentClassFilter] = useState('all');
  const [isChangingStudentForAccount, setIsChangingStudentForAccount] = useState(false);

  // Backward compatibility alias for existing handler references
  const selectedTeacherForAdd = selectedTeacherForAccount;
  const setSelectedTeacherForAdd = setSelectedTeacherForAccount;
  const teacherSearchTerm = addTeacherSearchTerm;
  const setTeacherSearchTerm = setAddTeacherSearchTerm;
  const isChangingTeacherSelection = isChangingTeacherForAccount;
  const setIsChangingTeacherSelection = setIsChangingTeacherForAccount;

  const selectedStudentForAdd = selectedStudentForAccount;
  const setSelectedStudentForAdd = setSelectedStudentForAccount;
  const studentSearchTerm = addStudentSearchTerm;
  const setStudentSearchTerm = setAddStudentSearchTerm;
  const studentClassFilter = addStudentClassFilter;
  const setStudentClassFilter = setAddStudentClassFilter;
  const isChangingStudentSelection = isChangingStudentForAccount;
  const setIsChangingStudentSelection = setIsChangingStudentForAccount;

  // Print slip targets in Modal
  const [selectedUserForPrint, setSelectedUserForPrint] = useState<UserProfile | null>(null);
  const [printFilterRole, setPrintFilterRole] = useState<'all' | UserRole | string>('all');
  const [printIncludePassword, setPrintIncludePassword] = useState(true);
  const [printSlipTargetUser, setPrintSlipTargetUser] = useState<'all' | UserProfile>('all');
  const [printSlipRoleFilter, setPrintSlipRoleFilter] = useState<string>('all');

  // Interactive Ekskul selector search & filter for Add/Edit Modal
  const [ekskulSearchInModal, setEkskulSearchInModal] = useState('');

  // Quick Role Testing state & users groupings
  const bkUsers = useMemo(() => allUsers.filter(u => u.role === 'guru_bk'), [allUsers]);
  const pembinaEkskulUsers = useMemo(() => allUsers.filter(u => u.role === 'pembina_ekskul' || u.role === 'pembina'), [allUsers]);
  const pembinaOsimUsers = useMemo(() => allUsers.filter(u => u.role === 'pembina_osim'), [allUsers]);
  const osimPengurusUsers = useMemo(() => allUsers.filter(u => u.role === 'pengurus_osim'), [allUsers]);
  const wakaUsers = useMemo(() => allUsers.filter(u => u.role === 'waka_kesiswaan'), [allUsers]);
  const adminUsers = useMemo(() => allUsers.filter(u => u.role === 'super_admin'), [allUsers]);

  const [selectedBkUserId, setSelectedBkUserId] = useState<string>('');
  const [selectedPembinaUserId, setSelectedPembinaUserId] = useState<string>('');
  const [selectedOsimUserId, setSelectedOsimUserId] = useState<string>('');
  const [isSyncingOsim, setIsSyncingOsim] = useState(false);

  const getPembinaEkskulName = (u: UserProfile) => {
    if (!u.extracurricularIds || u.extracurricularIds.length === 0) return 'Ekstrakurikuler';
    const names = u.extracurricularIds
      .map(id => extracurriculars.find(e => e.id === id)?.name)
      .filter(Boolean);
    return names.length > 0 ? names.join(', ') : 'Ekstrakurikuler';
  };

  const getOsimPositionName = (u: UserProfile) => {
    return u.osimPosition || u.osimDepartmentName || u.osimDepartmentCode || (u.role === 'pengurus_osim' ? 'Pengurus OSIM' : 'Anggota OSIM');
  };

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [customResetPassword, setCustomResetPassword] = useState('password');
  const [showResetPasswordText, setShowResetPasswordText] = useState(false);
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);
  const [isAcademicYearModalOpen, setIsAcademicYearModalOpen] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] = useState<UserProfile | null>(null);
  const [showPasswordInModal, setShowPasswordInModal] = useState(false);

  // School Setting form state for Master Control
  const [schoolFormData, setSchoolFormData] = useState<SchoolSetting>({
    id: schoolSetting?.id || 'main_school',
    name: schoolSetting?.name || 'MAN 2 SERAM BAGIAN TIMUR',
    centralInstitution: schoolSetting?.centralInstitution || 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
    regionalInstitution: schoolSetting?.regionalInstitution || 'KANTOR KEMENTERIAN AGAMA KABUPATEN SERAM BAGIAN TIMUR',
    npsn: schoolSetting?.npsn || '60728491',
    address: schoolSetting?.address || 'Jl. Lintas Seram, Kec. Bula, Kab. Seram Bagian Timur, Maluku',
    postalCode: schoolSetting?.postalCode || '97554',
    principalName: schoolSetting?.principalName || 'Zakaria, S. Pd.I., M. Pd',
    principalNip: schoolSetting?.principalNip || '197808042003121008',
    wakaName: schoolSetting?.wakaName || schoolSetting?.wakaKesiswaanName || 'Puput Eka Bajuri, S. Pd., M. Or',
    wakaNip: schoolSetting?.wakaNip || '198810052020121003',
    wakaKesiswaanName: schoolSetting?.wakaKesiswaanName || schoolSetting?.wakaName || 'Puput Eka Bajuri, S. Pd., M. Or',
    phone: schoolSetting?.phone || '(0915) 21189',
    email: schoolSetting?.email || 'man2sbt@kemenag.go.id',
    website: schoolSetting?.website || 'https://man2serambagiantimur.sch.id',
    logoUrl: schoolSetting?.logoUrl || '',
    logoLeftUrl: schoolSetting?.logoLeftUrl || '',
    logoRightUrl: schoolSetting?.logoRightUrl || '',
    currentAcademicYear: schoolSetting?.currentAcademicYear || activeAcademicYear || '2026/2027',
    currentSemester: schoolSetting?.currentSemester || activeSemester || 'Ganjil'
  });

  // Form states for add/edit user
  const [formData, setFormData] = useState<{
    displayName: string;
    nip: string;
    email: string;
    username: string;
    password: string;
    role: UserRole;
    phone: string;
    counselorSpecialization: string;
    extracurricularIds: string[];
    status: 'Aktif' | 'Nonaktif';
    isCashManager: boolean;
    cashManagerTitle: string;
  }>({
    displayName: '',
    nip: '',
    email: '',
    username: '',
    password: 'password',
    role: 'pembina_ekskul',
    phone: '',
    counselorSpecialization: 'Bimbingan Konseling Siswa & Karir',
    extracurricularIds: [],
    status: 'Aktif',
    isCashManager: false,
    cashManagerTitle: 'Bendahara Kesiswaan'
  });

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);
  const [isImportingJSON, setIsImportingJSON] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isSavingSchool, setIsSavingSchool] = useState(false);
  const jsonFileInputRef = React.useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleClearAllData = async () => {
    setIsClearingData(true);
    try {
      const res = await clearAllOperationalData();
      if (res.success) {
        showToast('Seluruh data bawaan berhasil dibersihkan! Aplikasi siap diisi dengan data sekolah resmi.');
        setIsClearDataModalOpen(false);
      } else {
        showToast(res.message || 'Gagal membersihkan data bawaan.', 'error');
      }
    } catch (e: any) {
      showToast('Error: ' + e?.message, 'error');
    } finally {
      setIsClearingData(false);
    }
  };

  const handleExportJSON = () => {
    try {
      exportFullDatabaseJSON();
      showToast('Cadangan database JSON lengkap berhasil diunduh!');
    } catch (e: any) {
      showToast('Gagal mengekspor database: ' + e?.message, 'error');
    }
  };

  const handleImportJSONFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingJSON(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const res = await importFullDatabaseJSON(parsed);
        if (res.success) {
          showToast(res.message || 'Database lengkap berhasil dipulihkan dari berkas JSON!');
        } else {
          showToast(res.message || 'Gagal memulihkan database.', 'error');
        }
      } catch (err: any) {
        showToast('Berkas JSON tidak valid atau rusak: ' + err?.message, 'error');
      } finally {
        setIsImportingJSON(false);
        if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      showToast('Gagal membaca berkas.', 'error');
      setIsImportingJSON(false);
      if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // Find teachers in Dewan Guru (including newly imported from Excel) who don't have cPanel user accounts yet
  const unregisteredTeachers = teachers.filter(t => {
    const cleanNip = t.nip ? t.nip.replace(/\s+/g, '').replace(/[^0-9]/g, '') : '';
    const cleanEmail = t.email ? t.email.toLowerCase().trim() : '';
    return !allUsers.some(u => 
      u.uid === t.id ||
      u.uid === `user_${t.id}` ||
      (cleanNip && u.nip && u.nip.replace(/\s+/g, '').replace(/[^0-9]/g, '') === cleanNip) ||
      (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail) ||
      u.displayName.toLowerCase().trim() === t.fullName.toLowerCase().trim()
    );
  });

  // Find OSIM departments that don't have synchronized accounts yet
  const unregisteredOsimCount = useMemo(() => {
    let count = 0;
    for (const d of osimDepartments) {
      if (d.code === 'BPH' || d.name.startsWith('BPH')) continue;
      const code = (d.code || '').toLowerCase();
      const hasAcc = allUsers.some(u => 
        u.role === 'pengurus_osim' && 
        (
          (u.osimDepartmentCode && u.osimDepartmentCode.toLowerCase() === code) ||
          (u.username && u.username.toLowerCase() === code) ||
          (u.osimDepartmentName && u.osimDepartmentName.toLowerCase() === d.name.toLowerCase()) ||
          (d.coordinatorName && u.displayName.toLowerCase().trim() === d.coordinatorName.toLowerCase().trim())
        )
      );
      if (!hasAcc) count++;
    }
    return count;
  }, [osimDepartments, allUsers]);

  const togglePasswordVisibility = (uid: string) => {
    setShowPasswordMap(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

  const handleCopyCredentials = (u: UserProfile) => {
    const text = `KREDENSIAL LOGIN SIM KESISWAAN\nNama: ${u.displayName}\nRole: ${u.role.toUpperCase()}\nNIP: ${u.nip || '-'}\nEmail: ${u.email}\nPassword: ${u.password || 'password'}\nURL: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    showToast(`Kredensial login ${u.displayName} berhasil disalin ke clipboard!`);
  };

  const handleSyncFromTeachers = async () => {
    setIsSyncingAll(true);
    try {
      const count = await syncUsersFromTeachers(teachers, extracurriculars);
      showToast(`Berhasil menyinkronkan ${count} data guru & pembina dari Dewan Guru ke daftar akun cPanel!`);
    } catch (e: any) {
      showToast('Gagal sinkronisasi data guru: ' + e?.message, 'error');
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleSyncFromOsim = async () => {
    setIsSyncingOsim(true);
    try {
      const count = await syncUsersFromOsim(osimDepartments, osimMembers);
      showToast(`Berhasil menyinkronkan ${count} akun pengurus & sekbid OSIM ke cPanel dengan password unik per bidang!`);
    } catch (e: any) {
      showToast('Gagal sinkronisasi data OSIM: ' + e?.message, 'error');
    } finally {
      setIsSyncingOsim(false);
    }
  };

  const handleSyncAllModules = async () => {
    setIsSyncingAll(true);
    try {
      await syncAllCPanelUsers(allUsers);
      showToast('Seluruh data akun cPanel berhasil disinkronkan ke Dewan Guru, Ekstrakurikuler, dan modul Kesiswaan!');
    } catch (e: any) {
      showToast('Gagal sinkronisasi: ' + e?.message, 'error');
    } finally {
      setIsSyncingAll(false);
    }
  };

  // List of classes with student counts for Grid Filter (identical to OsimPage)
  const classesWithCounts = useMemo(() => {
    const activeStudents = (students || []).filter(s => s.status !== 'Keluar' && s.status !== 'Pindah' && !s.isDeleted);
    const totalCount = activeStudents.length;
    let classList: { id: string; name: string; count: number }[] = [];
    if (classes && classes.length > 0) {
      classList = classes.map(c => {
        const count = activeStudents.filter(s => s.classId === c.id || s.className === c.name).length;
        return {
          id: c.id,
          name: c.name,
          count
        };
      });
    } else {
      const distinctNames = Array.from(new Set(activeStudents.map(s => s.className).filter(Boolean)));
      classList = distinctNames.map(name => ({
        id: name,
        name,
        count: activeStudents.filter(s => s.className === name).length
      }));
    }
    return { totalCount, classList };
  }, [students, classes]);

  // Teachers for Database Picker in Add Modal
  const filteredTeachersForAdd = useMemo(() => {
    const list = teachers || [];
    return list.filter(t => {
      // Check if already registered
      const isAlreadyRegistered = allUsers.some(u =>
        (u.nip && t.nip && u.nip.trim() === t.nip.trim()) ||
        (u.displayName.toLowerCase().trim() === t.fullName.toLowerCase().trim())
      );
      if (teacherFilterCategory === 'unregistered' && isAlreadyRegistered) return false;
      if (teacherFilterCategory === 'bk' && !t.role?.toLowerCase().includes('bk') && !t.subject?.toLowerCase().includes('bk') && !t.fullName.toLowerCase().includes('bk')) return false;
      if (teacherFilterCategory === 'pembina' && !t.isPembina && (!t.assignedExtracurriculars || t.assignedExtracurriculars.length === 0)) return false;

      if (!teacherSearchTerm) return true;
      const q = teacherSearchTerm.toLowerCase();
      return (
        t.fullName.toLowerCase().includes(q) ||
        (t.nip && t.nip.includes(q)) ||
        (t.email && t.email.toLowerCase().includes(q)) ||
        (t.subject && t.subject.toLowerCase().includes(q)) ||
        (t.extracurricularName && t.extracurricularName.toLowerCase().includes(q))
      );
    });
  }, [teachers, allUsers, teacherFilterCategory, teacherSearchTerm]);

  // Students for Database Picker in Add Modal (e.g. for OSIM account creation)
  const filteredStudentsForAdd = useMemo(() => {
    const activeStudents = (students || []).filter(s => s.status !== 'Keluar' && s.status !== 'Pindah' && !s.isDeleted);
    return activeStudents.filter(s => {
      if (studentClassFilter !== 'all') {
        const matchClass = s.classId === studentClassFilter || s.className === studentClassFilter;
        if (!matchClass) return false;
      }
      if (!studentSearchTerm) return true;
      const q = studentSearchTerm.toLowerCase();
      return s.fullName.toLowerCase().includes(q) || s.nis.includes(q) || (s.nisn && s.nisn.includes(q));
    });
  }, [students, studentClassFilter, studentSearchTerm]);

  const generateSuggestedPassword = (role: UserRole) => {
    switch (role) {
      case 'guru_bk':
        return 'bk2026';
      case 'pembina_osim':
        return 'pembina2026';
      case 'pengurus_osim':
        return 'osim2026';
      case 'pembina_ekskul':
        return 'pembina2026';
      case 'waka_kesiswaan':
        return 'waka2026';
      case 'super_admin':
        return 'admin2026';
      default:
        return 'password2026';
    }
  };

  const handleSelectTeacherForAccount = (teacher: Teacher) => {
    setSelectedTeacherForAdd(teacher);
    setIsChangingTeacherSelection(false);

    // Auto-detect role
    let role: UserRole = 'pembina_ekskul';
    const isBK = teacher.role?.toLowerCase().includes('bk') || teacher.subject?.toLowerCase().includes('bk') || teacher.fullName.toLowerCase().includes('bk');
    const isWaka = teacher.role?.toLowerCase().includes('waka') || teacher.fullName.toLowerCase().includes('waka');
    const isOsim = teacher.role?.toLowerCase().includes('osim') || teacher.extracurricularName?.toLowerCase().includes('osim');

    if (isBK) role = 'guru_bk';
    else if (isWaka) role = 'waka_kesiswaan';
    else if (isOsim) role = 'pembina_osim';
    else if (teacher.isPembina || (teacher.assignedExtracurriculars && teacher.assignedExtracurriculars.length > 0)) role = 'pembina_ekskul';

    // Auto-match extracurriculars
    let matchedEkskulIds: string[] = [];
    if (teacher.assignedExtracurriculars && teacher.assignedExtracurriculars.length > 0) {
      matchedEkskulIds = teacher.assignedExtracurriculars.map(name => {
        const found = extracurriculars.find(e => e.name.toLowerCase().trim() === name.toLowerCase().trim() || e.id === name);
        return found ? found.id : name;
      });
    } else if (teacher.extracurricularName) {
      const found = extracurriculars.find(e => e.name.toLowerCase().trim() === teacher.extracurricularName?.toLowerCase().trim());
      if (found) matchedEkskulIds = [found.id];
    }

    const cleanUsername = teacher.email ? teacher.email.split('@')[0] : (teacher.nip ? `guru_${teacher.nip}` : teacher.fullName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 15));
    const cleanEmail = teacher.email || (teacher.nip ? `${teacher.nip}@kemenag.go.id` : `${cleanUsername}@sekolah.sch.id`);

    setFormData({
      displayName: teacher.fullName,
      nip: teacher.nip || '',
      email: cleanEmail,
      username: cleanUsername,
      password: generateSuggestedPassword(role),
      role: role,
      phone: teacher.phone || '',
      counselorSpecialization: role === 'guru_bk' ? 'Bimbingan Konseling Siswa & Karir' : '',
      extracurricularIds: matchedEkskulIds,
      status: 'Aktif',
      isCashManager: !!teacher.isCashManager,
      cashManagerTitle: teacher.cashManagerTitle || (teacher.isCashManager ? 'Bendahara Kesiswaan' : '')
    });
  };

  const handleSelectStudentForAccount = (student: Student) => {
    setSelectedStudentForAdd(student);
    setIsChangingStudentSelection(false);

    const cleanUsername = `siswa_${student.nis || student.id}`;
    const cleanEmail = (student as any).email || `${student.nis || student.id}@siswa.man2sbt.sch.id`;

    setFormData({
      displayName: student.fullName,
      nip: student.nis || '',
      email: cleanEmail,
      username: cleanUsername,
      password: 'osim2026',
      role: 'pengurus_osim',
      phone: student.phone || '',
      counselorSpecialization: '',
      extracurricularIds: [],
      status: 'Aktif',
      isCashManager: false,
      cashManagerTitle: 'Bendahara OSIM'
    });
  };

  const handleApplyRolePreset = (presetRole: UserRole) => {
    setFormData(prev => ({
      ...prev,
      role: presetRole,
      password: generateSuggestedPassword(presetRole),
      counselorSpecialization: presetRole === 'guru_bk' ? (prev.counselorSpecialization || 'Bimbingan Konseling Siswa & Karir') : prev.counselorSpecialization,
      cashManagerTitle: prev.isCashManager ? (prev.cashManagerTitle || (presetRole === 'pengurus_osim' ? 'Bendahara OSIM' : 'Bendahara Kesiswaan')) : prev.cashManagerTitle
    }));
  };

  const handleOpenAddModal = () => {
    setAccountSourceType('teacher');
    setSelectedTeacherForAdd(null);
    setIsChangingTeacherSelection(false);
    setSelectedStudentForAdd(null);
    setIsChangingStudentSelection(false);
    setTeacherSearchTerm('');
    setTeacherFilterCategory('all');
    setStudentSearchTerm('');
    setStudentClassFilter('all');
    setEkskulSearchInModal('');
    setFormData({
      displayName: '',
      nip: '',
      email: '',
      username: '',
      password: 'pembina2026',
      role: 'pembina_ekskul',
      phone: '',
      counselorSpecialization: 'Bimbingan Konseling Siswa & Karir',
      extracurricularIds: [],
      status: 'Aktif',
      isCashManager: false,
      cashManagerTitle: 'Bendahara Kesiswaan'
    });
    setShowPasswordInModal(false);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (u: UserProfile) => {
    setSelectedUserForAction(u);
    setShowPasswordInModal(false);
    setFormData({
      displayName: u.displayName || '',
      nip: u.nip || '',
      email: u.email || '',
      username: u.username || '',
      password: u.password || 'password',
      role: u.role,
      phone: u.phone || '',
      counselorSpecialization: u.counselorSpecialization || 'Bimbingan Konseling Siswa & Karir',
      extracurricularIds: u.extracurricularIds || [],
      status: u.status || 'Aktif',
      isCashManager: !!u.isCashManager,
      cashManagerTitle: u.cashManagerTitle || 'Bendahara Kesiswaan'
    });
    setIsEditModalOpen(true);
  };

  const handleToggleCashManager = async (u: UserProfile) => {
    const nextState = !u.isCashManager;
    const title = nextState ? (u.cashManagerTitle || 'Bendahara Kesiswaan') : undefined;
    const res = await updateUser(u.uid, {
      isCashManager: nextState,
      cashManagerTitle: title
    });
    if (res.success) {
      await syncUserFromCPanel({ ...u, isCashManager: nextState, cashManagerTitle: title }, u);
      showToast(
        nextState
          ? `Hak Pengelola Kas & Keuangan berhasil diberikan kepada ${u.displayName}! Menu Neraca Kas otomatis muncul pada akun ini.`
          : `Hak Pengelola Kas dinonaktifkan untuk ${u.displayName}. Menu Neraca Kas ditutup.`
      );
    } else {
      showToast(res.error || 'Gagal mengubah status pengelola kas.', 'error');
    }
  };

  const handleSaveAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayName.trim() || !formData.email.trim()) {
      showToast('Nama dan Email akun wajib diisi.', 'error');
      return;
    }

    const newUser: UserProfile = {
      uid: `user_${Date.now()}`,
      displayName: formData.displayName.trim(),
      nip: formData.nip.trim() || undefined,
      email: formData.email.trim(),
      username: formData.username.trim() || formData.email.split('@')[0],
      password: formData.password.trim() || 'password',
      role: formData.role,
      phone: formData.phone.trim() || undefined,
      counselorSpecialization: formData.role === 'guru_bk' ? formData.counselorSpecialization : undefined,
      extracurricularIds: formData.role === 'pembina_ekskul' ? formData.extracurricularIds : undefined,
      status: formData.status,
      isCashManager: formData.isCashManager,
      cashManagerTitle: formData.isCashManager ? (formData.cashManagerTitle.trim() || 'Bendahara') : undefined
    };

    const res = await addUser(newUser);
    if (res.success) {
      // Cross-Module Real-time Sync
      await syncUserFromCPanel(newUser);
      showToast(`Akun ${newUser.displayName} (${newUser.role}) berhasil ditambahkan dan data otomatis sinkron ke seluruh menu!`);
      setIsAddModalOpen(false);
    } else {
      showToast(res.error || 'Gagal menambahkan akun.', 'error');
    }
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAction) return;

    const updatedData: Partial<UserProfile> = {
      displayName: formData.displayName.trim(),
      nip: formData.nip.trim() || undefined,
      email: formData.email.trim(),
      username: formData.username.trim() || undefined,
      password: formData.password.trim() || 'password',
      role: formData.role,
      phone: formData.phone.trim() || undefined,
      counselorSpecialization: formData.role === 'guru_bk' ? formData.counselorSpecialization : undefined,
      extracurricularIds: formData.role === 'pembina_ekskul' ? formData.extracurricularIds : undefined,
      status: formData.status,
      isCashManager: formData.isCashManager,
      cashManagerTitle: formData.isCashManager ? (formData.cashManagerTitle.trim() || 'Bendahara') : undefined
    };

    const res = await updateUser(selectedUserForAction.uid, updatedData);

    if (res.success) {
      const mergedUser: UserProfile = { ...selectedUserForAction, ...updatedData };
      // Cross-Module Real-time Sync
      await syncUserFromCPanel(mergedUser, selectedUserForAction);
      showToast(`Perubahan data akun ${formData.displayName} berhasil disimpan & disinkronkan ke seluruh menu terkait!`);
      setIsEditModalOpen(false);
    } else {
      showToast(res.error || 'Gagal memperbarui akun.', 'error');
    }
  };

  const handleSaveSchoolMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSchool(true);
    try {
      await updateSchoolSetting(schoolFormData);
      if (schoolFormData.currentAcademicYear) {
        setActiveAcademicYear(schoolFormData.currentAcademicYear, schoolFormData.currentSemester);
      }
      showToast('Profil madrasah, kop surat, dan tahun ajaran aktif berhasil diperbarui di seluruh modul!');
    } catch (err: any) {
      showToast('Gagal menyimpan profil: ' + err?.message, 'error');
    } finally {
      setIsSavingSchool(false);
    }
  };

  const handleOpenDetailModal = (u: UserProfile) => {
    setSelectedUserForAction(u);
    setIsDetailModalOpen(true);
  };

  const handlePromptResetPassword = (u: UserProfile) => {
    setSelectedUserForAction(u);
    const defaultP = u.role === 'pengurus_osim'
      ? ((u.password && u.password !== 'password') ? u.password : getDefaultOsimPassword(u.osimDepartmentCode || u.osimRole || u.username))
      : (u.password || 'password');
    setCustomResetPassword(defaultP);
    setShowResetPasswordText(false);
    setIsResetModalOpen(true);
  };

  const handleConfirmResetPassword = async () => {
    if (!selectedUserForAction) return;
    const u = selectedUserForAction;
    const passToSet = customResetPassword.trim() || 'password';
    const res = await resetUserPassword(u.uid, passToSet);
    if (res.success) {
      try {
        await syncUserFromCPanel({ ...u, password: passToSet }, u);
      } catch (e) {}
      showToast(`Kata sandi akun ${u.displayName} (${u.role}) berhasil diperbarui menjadi "${passToSet}". Password lama otomatis tidak berlaku dan tergantikan!`);
    } else {
      showToast(res.error || 'Gagal mengubah password.', 'error');
    }
    setIsResetModalOpen(false);
  };

  const handlePromptDeleteUser = (u: UserProfile) => {
    setSelectedUserForAction(u);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteUser = async () => {
    if (!selectedUserForAction) return;
    const u = selectedUserForAction;
    const res = await deleteUser(u.uid);
    if (res.success) {
      await syncDeleteUserFromCPanel(u.uid, u);
      showToast(`Akun ${u.displayName} berhasil dihapus & disinkronkan.`);
    } else {
      showToast(res.error || 'Gagal menghapus akun.', 'error');
    }
    setIsDeleteModalOpen(false);
  };

  const handlePrintAccountSlip = (u: UserProfile) => {
    const cred = getUserSlipCredentials(u, osimMembers);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kartu Login Akun SIM Kesiswaan - ${cred.displayName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #fff; color: #111; }
            .card { width: 380px; border: 2px solid #059669; border-radius: 8px; padding: 16px; margin: 20px auto; }
            .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 8px; margin-bottom: 12px; }
            .header h3 { margin: 0; font-size: 14px; color: #065f46; text-transform: uppercase; font-weight: bold; }
            .header p { margin: 2px 0 0 0; font-size: 10px; color: #555; }
            .info-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px; padding: 4px 0; border-bottom: 1px dashed #e5e7eb; }
            .info-label { font-weight: bold; color: #374151; }
            .info-val { font-family: monospace; font-weight: bold; color: #111827; }
            .highlight { background: #ecfdf5; padding: 8px 10px; border-radius: 6px; font-size: 12px; margin: 12px 0; border: 1px solid #a7f3d0; }
            .footer { font-size: 9px; color: #6b7280; text-align: center; margin-top: 10px; border-top: 1px dashed #d1d5db; padding-top: 6px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h3>KARTU AKUN LOGIN SIM KESISWAAN</h3>
              <p>${schoolSetting?.name || 'MADRASAH ALIYAH NEGERI'}</p>
            </div>
            <div class="info-row">
              <span class="info-label">Nama Pengguna:</span>
              <span class="info-val">${cred.displayName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Hak Akses (Role):</span>
              <span class="info-val" style="color: #059669;">${cred.roleLabel}</span>
            </div>
            <div class="info-row">
              <span class="info-label">NIP / NIS:</span>
              <span class="info-val">${cred.nipOrNis}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email Akun:</span>
              <span class="info-val">${cred.email}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Username Login:</span>
              <span class="info-val" style="color: #047857; font-size: 12px;">${cred.loginUsername}</span>
            </div>
            <div class="highlight">
              <div style="font-size: 10px; color: #065f46; font-weight: bold;">PASSWORD RESMI:</div>
              <div style="font-size: 13px; font-family: monospace; margin-top: 2px; color: #065f46; font-weight: bold;">
                ${cred.password}
              </div>
            </div>
            <div class="footer">
              Tahun Ajaran: ${activeAcademicYear || '2026/2027'} • Simpan kartu akun ini dengan baik dan rahasiakan password Anda.
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintAllSlips = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const cardsHtml = allUsers.map(u => {
      const cred = getUserSlipCredentials(u, osimMembers);
      return `
      <div class="card">
        <div class="header">
          <h3>KARTU AKUN SIM KESISWAAN</h3>
          <p>${schoolSetting?.name || 'MADRASAH ALIYAH NEGERI'}</p>
        </div>
        <div class="info-row">
          <span class="info-label">Nama:</span>
          <span>${cred.displayName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Peran:</span>
          <span class="info-val" style="color: #059669;">${cred.roleLabel}</span>
        </div>
        <div class="info-row">
          <span class="info-label">NIP / NIS:</span>
          <span class="info-val">${cred.nipOrNis}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span class="info-val">${cred.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Username:</span>
          <span class="info-val" style="color: #047857;">${cred.loginUsername}</span>
        </div>
        <div class="highlight">
          <span style="font-size: 10px; color: #065f46; font-weight: bold;">PASSWORD:</span>
          <span style="font-size: 12px; font-family: monospace; font-weight: bold; color: #065f46;"> ${cred.password}</span>
        </div>
      </div>
    `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Koleksi Kartu Akun Login SIM Kesiswaan Madrasah</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
            .card { border: 1.5px solid #059669; border-radius: 6px; padding: 12px; page-break-inside: avoid; }
            .header { text-align: center; border-bottom: 1.5px solid #059669; padding-bottom: 4px; margin-bottom: 8px; }
            .header h3 { margin: 0; font-size: 12px; color: #065f46; }
            .header p { margin: 0; font-size: 9px; color: #555; }
            .info-row { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 3px; }
            .info-label { font-weight: bold; color: #4b5563; }
            .info-val { font-family: monospace; }
            .highlight { background: #ecfdf5; padding: 4px 6px; border-radius: 3px; font-size: 11px; margin-top: 6px; border: 1px solid #a7f3d0; }
            @media print { body { padding: 5px; } }
          </style>
        </head>
        <body>
          <div class="grid">${cardsHtml}</div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleOpenPrintModal = (target: 'all' | UserProfile = 'all') => {
    if (target === 'all') {
      setSelectedUserForPrint(null);
      setPrintFilterRole('all');
    } else {
      setSelectedUserForPrint(target);
      setPrintFilterRole(target.role);
    }
    setPrintSlipTargetUser(target);
    setPrintSlipRoleFilter(target === 'all' ? 'all' : target.role);
    setIsPrintModalOpen(true);
  };

  const handleExecutePrintSlips = (customTargetUsers?: UserProfile[] | React.MouseEvent) => {
    let targetUsers: UserProfile[] = [];
    if (Array.isArray(customTargetUsers) && customTargetUsers.length > 0) {
      targetUsers = customTargetUsers;
    } else if (selectedUserForPrint) {
      targetUsers = [selectedUserForPrint];
    } else if (printFilterRole === 'all') {
      targetUsers = allUsers;
    } else {
      targetUsers = allUsers.filter(u => u.role === printFilterRole);
    }

    if (targetUsers.length === 0) {
      showToast('Tidak ada akun pengguna yang dipilih untuk dicetak.', 'error');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const cardsHtml = targetUsers.map(u => {
      const cred = getUserSlipCredentials(u, osimMembers);
      return `
      <div class="card">
        <div class="header">
          <h3>KARTU AKUN LOGIN RESMI SIM KESISWAAN</h3>
          <p>${schoolSetting?.name || 'MADRASAH ALIYAH NEGERI'}</p>
        </div>
        <div class="info-row">
          <span class="info-label">Nama Pengguna:</span>
          <span class="info-val">${cred.displayName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Hak Akses (Role):</span>
          <span class="info-val" style="color: #059669;">${cred.roleLabel}</span>
        </div>
        <div class="info-row">
          <span class="info-label">NIP / NIS / NIK:</span>
          <span class="info-val">${cred.nipOrNis}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email Akun:</span>
          <span class="info-val">${cred.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Username Login:</span>
          <span class="info-val" style="color: #047857; font-size: 12px;">${cred.loginUsername}</span>
        </div>
        <div class="highlight">
          <div style="font-size: 10px; color: #065f46; font-weight: bold;">PASSWORD RESMI:</div>
          <div style="font-size: 13px; font-family: monospace; font-weight: bold; color: #047857;">
            ${printIncludePassword ? cred.password : '••••••••'}
          </div>
        </div>
        <div class="footer">
          Tahun Ajaran: ${activeAcademicYear || '2026/2027'} • Rahasiakan kata sandi Anda dan ganti secara berkala.
        </div>
      </div>
    `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Koleksi Kartu Akun Login SIM Kesiswaan - ${schoolSetting?.name || 'Madrasah'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f3f4f6; color: #111; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
            .card { border: 2px solid #059669; border-radius: 8px; padding: 14px; background: #fff; page-break-inside: avoid; }
            .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 6px; margin-bottom: 8px; }
            .header h3 { margin: 0; font-size: 12px; color: #065f46; text-transform: uppercase; font-weight: bold; }
            .header p { margin: 2px 0 0 0; font-size: 10px; color: #555; }
            .info-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; padding: 3px 0; border-bottom: 1px dashed #e5e7eb; }
            .info-label { font-weight: bold; color: #374151; }
            .info-val { font-family: monospace; font-weight: bold; color: #111827; }
            .highlight { background: #ecfdf5; padding: 6px 8px; border-radius: 4px; font-size: 11px; margin: 8px 0; border: 1px solid #a7f3d0; display: flex; justify-content: space-between; align-items: center; }
            .footer { font-size: 9px; color: #6b7280; text-align: center; margin-top: 6px; border-top: 1px dashed #d1d5db; padding-top: 4px; }
            @media print {
              body { padding: 0; background: #fff; }
              .grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
            }
          </style>
        </head>
        <body>
          <div class="grid">${cardsHtml}</div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const printSlipUsers = useMemo(() => {
    if (printSlipTargetUser !== 'all') {
      return [printSlipTargetUser];
    }
    const filtered = allUsers.filter(u => {
      if (printSlipRoleFilter === 'all') return true;
      return u.role === printSlipRoleFilter;
    });
    return sortUsersByHierarchy(filtered);
  }, [allUsers, printSlipTargetUser, printSlipRoleFilter]);

  const getRoleBadge = (userOrRole: UserRole | UserProfile) => {
    if (typeof userOrRole === 'object' && userOrRole) {
      const u = userOrRole;
      const h = getUserHierarchyClassification(u);
      switch (h.rank) {
        case 1:
          return { label: '1. PROKTOR / SUPER ADMIN', color: 'bg-red-500/10 text-red-400 border-red-500/30' };
        case 2:
          return { label: '2. WAKA KESISWAAN', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
        case 3:
          return { label: '3. GURU BK', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
        case 4:
          return { label: '4. PEMBINA OSIM', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
        case 5:
          return { label: '5. PEMBINA EKSKUL', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
        case 6:
          return { label: `6. ${h.categoryLabel.toUpperCase()}`, color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' };
        case 7:
          return { label: `7. ${h.categoryLabel.toUpperCase()}`, color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' };
        default:
          return { label: 'PENGGUNA', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30' };
      }
    }

    const role = userOrRole;
    switch (role) {
      case 'super_admin':
        return { label: '1. PROKTOR / SUPER ADMIN', color: 'bg-red-500/10 text-red-400 border-red-500/30' };
      case 'waka_kesiswaan':
        return { label: '2. WAKA KESISWAAN', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'guru_bk':
        return { label: '3. GURU BK', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      case 'pembina_osim':
        return { label: '4. PEMBINA OSIM', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'pembina_ekskul':
      case 'pembina':
        return { label: '5. PEMBINA EKSKUL', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'pengurus_osim':
        return { label: '6-7. PENGURUS OSIM', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
      default:
        return { label: 'PENGGUNA', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30' };
    }
  };

  const filteredUsers = useMemo(() => {
    const rawFiltered = allUsers.filter(u => {
      // Role Pill Filter
      if (rolePillFilter !== 'all') {
        if (rolePillFilter === 'cash_manager') {
          if (!u.isCashManager) return false;
        } else if (rolePillFilter === 'admin_waka') {
          if (u.role !== 'super_admin' && u.role !== 'waka_kesiswaan') return false;
        } else if (rolePillFilter === 'bph_osim') {
          const h = getUserHierarchyClassification(u);
          if (h.rank !== 6) return false;
        } else if (rolePillFilter === 'sekbid_osim') {
          const h = getUserHierarchyClassification(u);
          if (h.rank !== 7) return false;
        } else if (u.role !== rolePillFilter) {
          return false;
        }
      }

      // Dropdown Filter
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;

      // Search
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.nip && u.nip.includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q)) ||
        (u.osimPosition && u.osimPosition.toLowerCase().includes(q)) ||
        (u.osimDepartmentName && u.osimDepartmentName.toLowerCase().includes(q))
      );
    });

    return sortUsersByHierarchy(rawFiltered);
  }, [allUsers, roleFilter, rolePillFilter, searchTerm]);

  const roleCounts = useMemo(() => {
    return {
      all: allUsers.length,
      super_admin: allUsers.filter(u => u.role === 'super_admin').length,
      waka_kesiswaan: allUsers.filter(u => u.role === 'waka_kesiswaan').length,
      guru_bk: allUsers.filter(u => u.role === 'guru_bk').length,
      pembina_osim: allUsers.filter(u => u.role === 'pembina_osim').length,
      pembina_ekskul: allUsers.filter(u => u.role === 'pembina_ekskul' || u.role === 'pembina').length,
      bph_osim: allUsers.filter(u => getUserHierarchyClassification(u).rank === 6).length,
      sekbid_osim: allUsers.filter(u => getUserHierarchyClassification(u).rank === 7).length,
      pengurus_osim: allUsers.filter(u => u.role === 'pengurus_osim').length,
      cash_manager: allUsers.filter(u => u.isCashManager).length
    };
  }, [allUsers]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl border shadow-2xl flex items-center space-x-3 text-xs font-semibold ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
              : 'bg-red-950/90 border-red-500 text-red-200'
          }`}
        >
          {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* cPanel Main Header */}
      <div className="bg-[#151518] border border-[#27272a] rounded-xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                cPanel & Pusat Kontrol SIM Kesiswaan
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                PROKTOR_ROOT
              </span>
            </div>
            <p className="text-xs text-zinc-200 mt-1">
              Manajemen akun Pembina OSIM, Ekstrakurikuler, Guru BK, matriks hak akses peran, kredensial login, dan sinkronisasi server Kemenag.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleSyncFromTeachers}
            disabled={isSyncingAll}
            className="px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-xs font-bold text-emerald-300 flex items-center space-x-2 transition-colors disabled:opacity-50 shadow-sm"
            title="Tarik dan sinkronkan data dewan guru/pembina (termasuk hasil import Excel) ke daftar akun cPanel"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
            <span>Tarik Data Guru/Pembina</span>
            {unregisteredTeachers.length > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full ml-1">
                {unregisteredTeachers.length}
              </span>
            )}
          </button>
          <button
            onClick={handleSyncAllModules}
            disabled={isSyncingAll}
            className="px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-xs font-bold text-indigo-300 flex items-center space-x-2 transition-colors disabled:opacity-50"
            title="Sinkronkan seluruh perubahan akun cPanel ke Dewan Guru, Ekstrakurikuler, dan modul Kesiswaan"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
            <span>{isSyncingAll ? 'Menyinkronkan...' : 'Sinkronkan Semua Modul'}</span>
          </button>
          <button
            onClick={() => handleOpenPrintModal('all')}
            className="px-3 py-2 rounded-lg bg-[#222226] hover:bg-[#2b2b30] border border-[#37373f] text-xs font-semibold text-zinc-100 flex items-center space-x-2 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-300" />
            <span>Cetak Semua Slip Akun</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center space-x-2 transition-colors shadow-lg shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Akun Baru</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#151518] border border-[#27272a] rounded-xl p-4">
          <span className="text-[10px] font-mono text-zinc-300 font-bold uppercase block">TOTAL PENGGUNA TERDAFTAR</span>
          <span className="text-2xl font-black text-white font-mono">{allUsers.length}</span>
          <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">Semua Role Terdaftar</span>
        </div>
        <div className="bg-[#151518] border border-[#27272a] rounded-xl p-4">
          <span className="text-[10px] font-mono text-zinc-300 font-bold uppercase block">GURU BK & KONSELOR</span>
          <span className="text-2xl font-black text-purple-400 font-mono">
            {allUsers.filter(u => u.role === 'guru_bk').length}
          </span>
          <span className="text-[10px] text-zinc-300 font-medium block mt-0.5">Layanan Konseling & SP</span>
        </div>
        <div className="bg-[#151518] border border-[#27272a] rounded-xl p-4">
          <span className="text-[10px] font-mono text-zinc-300 font-bold uppercase block">PEMBINA OSIM & EKSKUL</span>
          <span className="text-2xl font-black text-amber-400 font-mono">
            {allUsers.filter(u => u.role === 'pembina_osim' || u.role === 'pembina_ekskul' || u.role === 'pembina').length}
          </span>
          <span className="text-[10px] text-zinc-300 font-medium block mt-0.5">Intra & Ekstrakurikuler</span>
        </div>
        <div className="bg-[#151518] border border-[#27272a] rounded-xl p-4">
          <span className="text-[10px] font-mono text-zinc-300 font-bold uppercase block">STATUS SINKRONISASI</span>
          <span className="text-sm font-bold text-emerald-400 flex items-center space-x-1.5 mt-1 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>REAL-TIME AKTIF</span>
          </span>
          <span className="text-[10px] text-zinc-300 font-medium block mt-1">TA: {activeAcademicYear} {activeSemester}</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#27272a] flex items-center space-x-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'users'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-300 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Manajemen Akun Guru & Pembina</span>
        </button>
        <button
          onClick={() => setActiveSubTab('crud_center')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'crud_center'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-zinc-300 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Pusat CRUD Data Master (Terpusat)</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Aturan Mutlak
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('announcements')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'announcements'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-zinc-300 hover:text-white'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Pusat Pengumuman & Broadcast</span>
        </button>
        <button
          onClick={() => setActiveSubTab('school')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'school'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-300 hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Identitas Madrasah & Profil Master</span>
        </button>
        <button
          onClick={() => setActiveSubTab('matrix')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'matrix'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-300 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Matriks Hak Akses Peran</span>
        </button>
        <button
          onClick={() => setActiveSubTab('sync')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'sync'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-300 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Sinkronisasi & Server Data</span>
        </button>
        <button
          onClick={() => setActiveSubTab('logs')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'logs'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-300 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Log Aktivitas & Audit Trail</span>
          {auditLogs?.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
              {auditLogs.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: USERS MANAGEMENT */}
      {activeSubTab === 'users' && (
        <CPanelUserTab
          unregisteredTeachers={unregisteredTeachers}
          handleSyncFromTeachers={handleSyncFromTeachers}
          isSyncingAll={isSyncingAll}
          unregisteredOsimCount={unregisteredOsimCount}
          handleSyncFromOsim={handleSyncFromOsim}
          isSyncingOsim={isSyncingOsim}
          currentUser={currentUser}
          adminUsers={adminUsers}
          wakaUsers={wakaUsers}
          bkUsers={bkUsers}
          pembinaOsimUsers={pembinaOsimUsers}
          pembinaEkskulUsers={pembinaEkskulUsers}
          osimPengurusUsers={osimPengurusUsers}
          selectedBkUserId={selectedBkUserId}
          setSelectedBkUserId={setSelectedBkUserId}
          selectedPembinaUserId={selectedPembinaUserId}
          setSelectedPembinaUserId={setSelectedPembinaUserId}
          selectedOsimUserId={selectedOsimUserId}
          setSelectedOsimUserId={setSelectedOsimUserId}
          loginWithUser={loginWithUser}
          loginWithDemoRole={loginWithDemoRole}
          getPembinaEkskulName={getPembinaEkskulName}
          getOsimPositionName={getOsimPositionName}
          rolePillFilter={rolePillFilter}
          setRolePillFilter={setRolePillFilter}
          roleCounts={roleCounts}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          userViewMode={userViewMode}
          setUserViewMode={setUserViewMode}
          allUsers={allUsers}
          filteredUsers={filteredUsers}
          handleOpenPrintModal={handleOpenPrintModal}
          getRoleBadge={getRoleBadge}
          showPasswordMap={showPasswordMap}
          togglePasswordVisibility={togglePasswordVisibility}
          getTeacherInitials={getTeacherInitials}
          getInitialsColorTheme={getInitialsColorTheme}
          handleOpenEditModal={handleOpenEditModal}
          handleOpenDetailModal={handleOpenDetailModal}
          handleCopyCredentials={handleCopyCredentials}
          handlePrintAccountSlip={handlePrintAccountSlip}
          handlePromptResetPassword={handlePromptResetPassword}
          handleToggleCashManager={handleToggleCashManager}
          handlePromptDeleteUser={handlePromptDeleteUser}
          extracurriculars={extracurriculars}
          getEkskulTheme={getEkskulTheme}
        />
      )}

      {/* TAB 2: IDENTITAS MADRASAH & PROFIL MASTER */}
      {activeSubTab === 'school' && (
        <div className="bg-[#151518] border border-[#27272a] rounded-xl p-5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#27272a] gap-3">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Building className="w-4 h-4 text-emerald-400" />
                <span>Identitas Madrasah, Pejabat & Kop Surat Master</span>
              </h2>
              <p className="text-xs text-zinc-300 mt-0.5">
                Perubahan data di sini akan otomatis memperbarui Kop Surat, Nama Kepala Madrasah, Waka Kesiswaan, dan Tahun Ajaran di seluruh menu.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 self-start sm:self-auto">
              GLOBAL_SETTING_SYNC
            </span>
          </div>

          <form onSubmit={handleSaveSchoolMaster} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-zinc-200 font-bold">Nama Madrasah / Sekolah *</label>
                <input
                  type="text"
                  required
                  value={schoolFormData.name}
                  onChange={e => setSchoolFormData({ ...schoolFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-zinc-200 font-bold">NPSN *</label>
                <input
                  type="text"
                  required
                  value={schoolFormData.npsn}
                  onChange={e => setSchoolFormData({ ...schoolFormData, npsn: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-zinc-200 font-bold">Instansi Pusat (Header Kop 1)</label>
                <input
                  type="text"
                  value={schoolFormData.centralInstitution}
                  onChange={e => setSchoolFormData({ ...schoolFormData, centralInstitution: e.target.value })}
                  placeholder="KEMENTERIAN AGAMA REPUBLIK INDONESIA"
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-zinc-200 font-bold">Instansi Wilayah (Header Kop 2)</label>
                <input
                  type="text"
                  value={schoolFormData.regionalInstitution}
                  onChange={e => setSchoolFormData({ ...schoolFormData, regionalInstitution: e.target.value })}
                  placeholder="KANTOR WILAYAH KEMENTERIAN AGAMA PROVINSI"
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-zinc-200 font-bold">Nama Kepala Madrasah & Gelar</label>
                <input
                  type="text"
                  value={schoolFormData.principalName}
                  onChange={e => setSchoolFormData({ ...schoolFormData, principalName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-zinc-200 font-bold">NIP Kepala Madrasah</label>
                <input
                  type="text"
                  value={schoolFormData.principalNip}
                  onChange={e => setSchoolFormData({ ...schoolFormData, principalNip: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-zinc-200 font-bold">Nama Waka Kesiswaan & Gelar</label>
                <input
                  type="text"
                  value={schoolFormData.wakaName || schoolFormData.wakaKesiswaanName}
                  onChange={e => setSchoolFormData({ ...schoolFormData, wakaName: e.target.value, wakaKesiswaanName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-zinc-200 font-bold">NIP Waka Kesiswaan</label>
                <input
                  type="text"
                  value={schoolFormData.wakaNip}
                  onChange={e => setSchoolFormData({ ...schoolFormData, wakaNip: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-zinc-200 font-bold">Tahun Pelajaran Aktif (Sistem)</label>
                  <button
                    type="button"
                    onClick={() => setIsAcademicYearModalOpen(true)}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1"
                  >
                    <span>+ Kelola / Tambah Tahun Ajaran</span>
                  </button>
                </div>
                <select
                  value={schoolFormData.currentAcademicYear || activeAcademicYear}
                  onChange={e => setSchoolFormData({ ...schoolFormData, currentAcademicYear: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white focus:outline-none focus:border-emerald-500 font-bold"
                >
                  {academicYears && academicYears.length > 0 ? (
                    academicYears.map((ay, idx) => {
                      const yearVal = ay.year || ay.name || '';
                      return (
                        <option key={ay.id ? `cpanel-ay-${ay.id}-${idx}` : `cpanel-ay-idx-${idx}`} value={yearVal}>
                          {yearVal} {yearVal === activeAcademicYear ? '(Berjalan/Aktif)' : ''}
                        </option>
                      );
                    })
                  ) : (
                    <option value="2026/2027">2026/2027 (Berjalan)</option>
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-zinc-200 font-bold">Semester Aktif (Sistem)</label>
                <select
                  value={schoolFormData.currentSemester || activeSemester}
                  onChange={e => setSchoolFormData({ ...schoolFormData, currentSemester: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-zinc-200 font-bold">Alamat Lengkap Madrasah</label>
              <input
                type="text"
                value={schoolFormData.address}
                onChange={e => setSchoolFormData({ ...schoolFormData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-zinc-200 font-bold">Nomor Telepon</label>
                <input
                  type="text"
                  value={schoolFormData.phone}
                  onChange={e => setSchoolFormData({ ...schoolFormData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-zinc-200 font-bold">Email Resmi</label>
                <input
                  type="email"
                  value={schoolFormData.email}
                  onChange={e => setSchoolFormData({ ...schoolFormData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-zinc-200 font-bold">Website</label>
                <input
                  type="text"
                  value={schoolFormData.website}
                  onChange={e => setSchoolFormData({ ...schoolFormData, website: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white font-mono"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end space-x-3 border-t border-[#27272a]">
              <button
                type="submit"
                disabled={isSavingSchool}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center space-x-2 transition-colors shadow-lg shadow-emerald-950/30 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingSchool ? 'Menyimpan Perubahan...' : 'Simpan & Terapkan ke Seluruh Menu'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: ROLE MATRIX */}
      {activeSubTab === 'matrix' && (
        <RbacMatrixPanel
          currentUser={currentUser}
          allUsers={allUsers}
          isSuperAdmin={isSuperAdmin}
          onSimulateRole={(role, customUid) => {
            if (customUid) {
              const target = allUsers.find(u => u.uid === customUid);
              if (target) {
                loginWithUser(target);
                return;
              }
            }
            const fallback = allUsers.find(u => u.role === role);
            if (fallback) {
              loginWithUser(fallback);
            } else {
              loginWithDemoRole(role);
            }
          }}
        />
      )}

      {/* TAB 3: SYNC & SERVER */}
      {activeSubTab === 'sync' && (
        <CPanelBackupRestoreTab
          teachers={teachers}
          allUsers={allUsers}
          unregisteredTeachers={unregisteredTeachers}
          handleSyncFromTeachers={handleSyncFromTeachers}
          isSyncingAll={isSyncingAll}
          showToast={showToast}
          isClearingData={isClearingData}
          onOpenClearDataModal={() => setIsClearDataModalOpen(true)}
          jsonFileInputRef={jsonFileInputRef}
          handleImportJSONFile={handleImportJSONFile}
          handleExportJSON={handleExportJSON}
          isImportingJSON={isImportingJSON}
          isSeeding={isSeeding}
          setIsSeeding={setIsSeeding}
          seedFirebaseDatabase={seedFirebaseDatabase}
          uploadAllDataToFirestore={uploadAllDataToFirestore}
          studentsCount={students.length}
          classesCount={classes.length}
        />
      )}

      {/* TAB: ANNOUNCEMENTS & BROADCAST */}
      {activeSubTab === 'announcements' && <AnnouncementManagementPanel />}

      {/* TAB: PUSAT CRUD DATA MASTER (TERPUSAT) */}
      {activeSubTab === 'crud_center' && (
        <CentralizedCrudManager
          currentUser={currentUser}
          allUsers={allUsers}
          onUpdateUserRole={async (uid, newRole) => {
            await updateUser(uid, { role: newRole });
          }}
          onOpenRbacMatrix={() => setActiveSubTab('matrix')}
        />
      )}

      {/* TAB 5: AUDIT LOGS & ACTIVITY MONITOR */}
      {activeSubTab === 'logs' && <CPanelLogsTab />}

      {/* MODAL: ADD USER (EXACT PATTERN OF OSIM & PEMBINA EKSTRA) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Akun Pengguna Baru SIM Kesiswaan"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSaveAddUser} className="space-y-4 text-xs">
          {/* Source Picker Tabs: Guru, Siswa (OSIM), or Manual */}
          <div className="bg-[#18181d] border border-[#27272a] rounded-xl p-1.5 flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setAccountSourceType('teacher');
                handleApplyRolePreset('guru_bk');
              }}
              className={`flex-1 py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                accountSourceType === 'teacher'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#202026]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>1. Dari Dewan Guru ({teachers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAccountSourceType('student');
                handleApplyRolePreset('pengurus_osim');
              }}
              className={`flex-1 py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                accountSourceType === 'student'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#202026]'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>2. Dari Siswa / OSIM ({students.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setAccountSourceType('manual')}
              className={`flex-1 py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                accountSourceType === 'manual'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#202026]'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>3. Entri Manual / Baru</span>
            </button>
          </div>

          {/* GRID SELECTION FOR TEACHERS */}
          {accountSourceType === 'teacher' && (
            <div className="bg-[#141417] border border-[#27272a] rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  Pilih Guru dari Database Sekolah (Grid Selection) *
                </label>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {selectedTeacherForAccount ? '1 Guru Terpilih' : `${filteredTeachersForAdd.length} Guru Tersedia`}
                </span>
              </div>

              {selectedTeacherForAccount && !isChangingTeacherForAccount ? (
                /* Card Guru Terpilih */
                <div className="bg-emerald-950/30 border border-emerald-500/50 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-black text-sm font-mono flex items-center justify-center shrink-0 border border-emerald-400/40 shadow-xs">
                      {getTeacherInitials(selectedTeacherForAccount.fullName || selectedTeacherForAccount.name || '')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          Guru Terpilih
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-300 bg-zinc-800 border border-zinc-700">
                          NIP: {selectedTeacherForAccount.nip || '-'}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white mt-1 truncate">{selectedTeacherForAccount.fullName || selectedTeacherForAccount.name}</h4>
                      <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        Email: {selectedTeacherForAccount.email || '-'} • Kontak: {selectedTeacherForAccount.phone || '-'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsChangingTeacherForAccount(true)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 shrink-0 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                    Ganti Guru Lain
                  </button>
                </div>
              ) : (
                /* Search and Teacher Cards Grid */
                <div className="space-y-2.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Cari nama guru, NIP, atau mata pelajaran..."
                      value={addTeacherSearchTerm}
                      onChange={e => setAddTeacherSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-8 py-1.5 bg-[#1c1c20] border border-[#323238] rounded-lg text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500"
                    />
                    {addTeacherSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setAddTeacherSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-52 overflow-y-auto p-1 bg-[#101013] rounded-xl border border-[#222226]">
                    {filteredTeachersForAdd.map(t => {
                      const isSelected = selectedTeacherForAccount?.id === t.id;
                      const initials = getTeacherInitials(t.fullName || t.name || '');
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleSelectTeacherForAccount(t)}
                          className={`p-2.5 rounded-lg text-left transition flex items-start gap-2.5 border ${
                            isSelected
                              ? 'bg-emerald-950/40 border-emerald-500 text-white ring-1 ring-emerald-500'
                              : 'bg-[#18181c] hover:bg-[#202026] border-[#292930] text-zinc-200'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-bold text-xs truncate text-white">{t.fullName || t.name}</h5>
                            <p className="text-[10px] text-zinc-400 font-mono truncate">NIP: {t.nip || '-'}</p>
                            <span className="text-[9px] text-emerald-400 font-medium">Klik untuk pilih</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GRID SELECTION FOR STUDENTS (OSIM) */}
          {accountSourceType === 'student' && (
            <div className="bg-[#141417] border border-[#27272a] rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" />
                  Pilih Data Siswa & Rombel (Grid Selection) *
                </label>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {selectedStudentForAccount ? '1 Siswa Terpilih' : `${filteredStudentsForAdd.length} Siswa Tersedia`}
                </span>
              </div>

              {selectedStudentForAccount && !isChangingStudentForAccount ? (
                /* Card Siswa Terpilih */
                <div className="bg-cyan-950/30 border border-cyan-500/50 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-800 text-white font-black text-sm font-mono flex items-center justify-center shrink-0 border border-cyan-400/40 shadow-xs">
                      {selectedStudentForAccount.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3 text-cyan-400" />
                          Siswa Terpilih
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-200 border border-zinc-700">
                          Kelas {selectedStudentForAccount.className}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white mt-1 truncate">{selectedStudentForAccount.fullName}</h4>
                      <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        NIS: {selectedStudentForAccount.nis || '-'} • Kontak: {selectedStudentForAccount.phone || '-'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsChangingStudentForAccount(true)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 shrink-0 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                    Ganti Siswa Lain
                  </button>
                </div>
              ) : (
                /* Class Pill Grid & Student Search/Cards */
                <div className="space-y-2.5">
                  <div>
                    <span className="text-[11px] text-zinc-400 font-medium block mb-1.5">
                      1. Filter Berdasarkan Rombel Kelas:
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 max-h-28 overflow-y-auto p-1 bg-[#101013] rounded-xl border border-[#222226]">
                      <button
                        type="button"
                        onClick={() => setAddStudentClassFilter('all')}
                        className={`px-2 py-1.5 rounded text-[11px] font-medium transition flex items-center justify-between gap-1 ${
                          addStudentClassFilter === 'all'
                            ? 'bg-cyan-500 text-black font-bold shadow-xs'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60'
                        }`}
                      >
                        <span className="truncate">Semua</span>
                        <span className={`text-[9px] px-1 rounded ${
                          addStudentClassFilter === 'all' ? 'bg-cyan-600/40 text-black font-black' : 'bg-zinc-900 text-zinc-400'
                        }`}>
                          {classesWithCounts.totalCount}
                        </span>
                      </button>
                      {classesWithCounts.classList.map(cls => {
                        const isSelected = addStudentClassFilter === cls.name || addStudentClassFilter === cls.id;
                        return (
                          <button
                            key={cls.id}
                            type="button"
                            onClick={() => setAddStudentClassFilter(cls.name || cls.id)}
                            className={`px-2 py-1.5 rounded text-[11px] font-medium transition flex items-center justify-between gap-1 ${
                              isSelected
                                ? 'bg-cyan-500 text-black font-bold shadow-xs'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60'
                            }`}
                          >
                            <span className="truncate">{cls.name}</span>
                            <span className={`text-[9px] px-1 rounded ${
                              isSelected ? 'bg-cyan-600/40 text-black font-black' : 'bg-zinc-900 text-zinc-400'
                            }`}>
                              {cls.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Cari siswa berdasarkan nama atau NIS..."
                      value={addStudentSearchTerm}
                      onChange={e => setAddStudentSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-8 py-1.5 bg-[#1c1c20] border border-[#323238] rounded-lg text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-cyan-500"
                    />
                    {addStudentSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setAddStudentSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-52 overflow-y-auto p-1 bg-[#101013] rounded-xl border border-[#222226]">
                    {filteredStudentsForAdd.map(s => {
                      const isSelected = selectedStudentForAccount?.id === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleSelectStudentForAccount(s)}
                          className={`p-2.5 rounded-lg text-left transition flex items-start gap-2.5 border ${
                            isSelected
                              ? 'bg-cyan-950/40 border-cyan-500 text-white ring-1 ring-cyan-500'
                              : 'bg-[#18181c] hover:bg-[#202026] border-[#292930] text-zinc-200'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                            {s.fullName.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-bold text-xs truncate text-white">{s.fullName}</h5>
                            <p className="text-[10px] text-zinc-400 font-mono truncate">
                              {s.className} • NIS: {s.nis || '-'}
                            </p>
                            <span className="text-[9px] text-cyan-400 font-medium">Klik untuk pilih</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* QUICK ROLE PRESETS (PILLS) */}
          <div className="space-y-1.5">
            <label className="block text-zinc-300 font-bold">Pilih Hak Akses / Peran Akun *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => handleApplyRolePreset('guru_bk')}
                className={`p-2 rounded-lg border text-left transition flex flex-col justify-between ${
                  formData.role === 'guru_bk'
                    ? 'bg-purple-950/40 border-purple-500 text-white ring-1 ring-purple-500'
                    : 'bg-[#18181c] hover:bg-[#202026] border-[#292930] text-zinc-300'
                }`}
              >
                <span className="font-bold text-xs text-purple-300">Guru BK</span>
                <span className="text-[10px] text-zinc-400 mt-0.5">Bimbingan & Konseling</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyRolePreset('pembina_osim')}
                className={`p-2 rounded-lg border text-left transition flex flex-col justify-between ${
                  formData.role === 'pembina_osim'
                    ? 'bg-amber-950/40 border-amber-500 text-white ring-1 ring-amber-500'
                    : 'bg-[#18181c] hover:bg-[#202026] border-[#292930] text-zinc-300'
                }`}
              >
                <span className="font-bold text-xs text-amber-300">Pembina OSIM</span>
                <span className="text-[10px] text-zinc-400 mt-0.5">Organisasi Siswa</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyRolePreset('pembina_ekskul')}
                className={`p-2 rounded-lg border text-left transition flex flex-col justify-between ${
                  formData.role === 'pembina_ekskul'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white ring-1 ring-emerald-500'
                    : 'bg-[#18181c] hover:bg-[#202026] border-[#292930] text-zinc-300'
                }`}
              >
                <span className="font-bold text-xs text-emerald-300">Pembina Ekskul</span>
                <span className="text-[10px] text-zinc-400 mt-0.5">Ekstrakurikuler</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyRolePreset('pengurus_osim')}
                className={`p-2 rounded-lg border text-left transition flex flex-col justify-between ${
                  formData.role === 'pengurus_osim'
                    ? 'bg-cyan-950/40 border-cyan-500 text-white ring-1 ring-cyan-500'
                    : 'bg-[#18181c] hover:bg-[#202026] border-[#292930] text-zinc-300'
                }`}
              >
                <span className="font-bold text-xs text-cyan-300">Pengurus OSIM</span>
                <span className="text-[10px] text-zinc-400 mt-0.5">Siswa Bidang/BPH</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyRolePreset('waka_kesiswaan')}
                className={`p-2 rounded-lg border text-left transition flex flex-col justify-between ${
                  formData.role === 'waka_kesiswaan'
                    ? 'bg-blue-950/40 border-blue-500 text-white ring-1 ring-blue-500'
                    : 'bg-[#18181c] hover:bg-[#202026] border-[#292930] text-zinc-300'
                }`}
              >
                <span className="font-bold text-xs text-blue-300">Waka Kesiswaan</span>
                <span className="text-[10px] text-zinc-400 mt-0.5">Pimpinan Madrasah</span>
              </button>
            </div>
          </div>

          {/* FORM FIELDS: IDENTITY & CREDENTIALS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-200 font-bold mb-1">Nama Lengkap & Gelar *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Dra. Hj. Siti Marwiyah, M.Pd."
                value={formData.displayName}
                onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-zinc-200 font-bold mb-1">NIP / NIK / NIS</label>
              <input
                type="text"
                placeholder="NIP untuk guru atau NIS untuk siswa"
                value={formData.nip}
                onChange={e => setFormData({ ...formData, nip: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-200 font-bold mb-1">Email Akun *</label>
              <input
                type="email"
                required
                placeholder="pembina@madrasah.sch.id"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-zinc-200 font-bold mb-1">Username Login</label>
              <input
                type="text"
                placeholder="Contoh: pembina.pramuka"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-zinc-200 font-bold mb-1">No. WhatsApp / HP</label>
              <input
                type="text"
                placeholder="08123456789"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* PASSWORD FIELD WITH GENERATOR */}
          <div className="bg-[#18181d] border border-[#27272a] rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-zinc-200 font-bold">Kata Sandi Default Akun *</label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, password: generateSuggestedPassword(formData.role) })}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-mono flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Buat Sandi Standar ({generateSuggestedPassword(formData.role)})</span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showPasswordInModal ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="Masukkan kata sandi awal akun"
                className="w-full px-3 py-2 pr-10 rounded-lg bg-[#1c1c20] border border-[#323238] text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPasswordInModal(!showPasswordInModal)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                title={showPasswordInModal ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPasswordInModal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* ROLE-SPECIFIC SECTIONS */}
          {formData.role === 'guru_bk' && (
            <div className="bg-[#18181d] border border-purple-500/30 rounded-xl p-3 space-y-1.5">
              <label className="block text-purple-300 font-bold">Spesialisasi Bimbingan Konseling (BK)</label>
              <input
                type="text"
                value={formData.counselorSpecialization}
                onChange={e => setFormData({ ...formData, counselorSpecialization: e.target.value })}
                placeholder="Contoh: Bimbingan Karir & Psikologi Remaja"
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          )}

          {formData.role === 'pembina_ekskul' && (
            <div className="bg-[#18181d] border border-emerald-500/30 rounded-xl p-3 space-y-2">
              <label className="block text-emerald-300 font-bold">Ekstrakurikuler yang Diampu (Pilih dari Daftar)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1 bg-[#121215] rounded-lg border border-[#27272a]">
                {extracurriculars.map((e, idx) => {
                  const isChecked = formData.extracurricularIds.includes(e.id);
                  const theme = getEkskulTheme(e.id, e.category);
                  return (
                    <label
                      key={e.id ? `modal-ek-${e.id}-${idx}` : `modal-ek-idx-${idx}`}
                      className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition ${
                        isChecked
                          ? `${theme.bgLight} ${theme.borderLight} text-white`
                          : 'bg-[#18181c] border-[#292930] text-zinc-300 hover:bg-[#202026]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={ev => {
                          const next = ev.target.checked
                            ? [...formData.extracurricularIds, e.id]
                            : formData.extracurricularIds.filter(id => id !== e.id);
                          setFormData({ ...formData, extracurricularIds: next });
                        }}
                        className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 w-3.5 h-3.5"
                      />
                      <span className="truncate text-xs font-semibold">{e.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* CASH MANAGER PRIVILEGE */}
          <div className="p-3 bg-[#18181d] rounded-xl border border-amber-500/30 space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isCashManager || false}
                onChange={e => setFormData({ ...formData, isCashManager: e.target.checked })}
                className="rounded bg-zinc-800 border-zinc-700 text-amber-500 focus:ring-amber-500 w-4 h-4"
              />
              <span className="text-zinc-100 font-bold text-xs flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-amber-400" />
                <span>Beri Hak Otoritas Pengelola Uang Kas (Neraca Keuangan)</span>
              </span>
            </label>
            {formData.isCashManager && (
              <div className="pt-1">
                <label className="block text-amber-300 font-bold text-[11px] mb-1">
                  Gelar / Jabatan Pengelola Kas
                </label>
                <input
                  type="text"
                  value={formData.cashManagerTitle || ''}
                  onChange={e => setFormData({ ...formData, cashManagerTitle: e.target.value })}
                  placeholder="Contoh: Bendahara Kas BK / Bendahara OSIM"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#1c1c20] border border-[#323238] text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-[#27272a]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-2 rounded-lg bg-[#222226] text-zinc-300 hover:text-white font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-lg shadow-emerald-950/40 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan & Buat Akun</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT USER (EXACT PATTERN OF OSIM & PEMBINA EKSTRA) */}
      <Modal
        isOpen={isEditModalOpen && Boolean(selectedUserForAction)}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Akun: ${selectedUserForAction?.displayName || ''}`}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
          {/* Header Card with User Avatar & Info */}
          {selectedUserForAction && (
            <div className="p-3 bg-[#18181d] border border-[#27272a] rounded-xl flex items-center gap-3">
              {(() => {
                const theme = getInitialsColorTheme(selectedUserForAction.role);
                const initials = getTeacherInitials(selectedUserForAction.displayName);
                return (
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.bgGradient} flex items-center justify-center font-black font-mono text-sm text-white shadow-xs shrink-0 border ${theme.borderColor}`}>
                    {initials}
                  </div>
                );
              })()}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white truncate">{selectedUserForAction.displayName}</h4>
                  <span className={`px-2 py-0.2 rounded text-[9px] font-mono font-bold border ${getRoleBadge(selectedUserForAction.role).color}`}>
                    {getRoleBadge(selectedUserForAction.role).label}
                  </span>
                </div>
                <p className="text-zinc-400 font-mono text-[11px] mt-0.5">{selectedUserForAction.email}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-200 font-bold mb-1">Nama Lengkap & Gelar *</label>
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-zinc-200 font-bold mb-1">NIP / NIK / NIS</label>
              <input
                type="text"
                value={formData.nip}
                onChange={e => setFormData({ ...formData, nip: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-200 font-bold mb-1">Peran / Role *</label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="guru_bk">Guru BK</option>
                <option value="pembina_osim">Pembina OSIM</option>
                <option value="pengurus_osim">Pengurus OSIM</option>
                <option value="pembina_ekskul">Pembina Ekstrakurikuler</option>
                <option value="waka_kesiswaan">Waka Kesiswaan</option>
                <option value="super_admin">Super Admin / Proktor</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-200 font-bold mb-1">Status Akun</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-200 font-bold mb-1">No. WhatsApp / HP</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-200 font-bold mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-zinc-200 font-bold mb-1">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Password Manager */}
          <div className="bg-[#18181d] border border-[#27272a] rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-zinc-200 font-bold">Kata Sandi Akun</label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, password: generateSuggestedPassword(formData.role) })}
                className="text-[11px] text-blue-400 hover:text-blue-300 underline font-mono flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Buat Sandi Standar ({generateSuggestedPassword(formData.role)})</span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showPasswordInModal ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="Masukkan kata sandi baru"
                className="w-full px-3 py-2 pr-10 rounded-lg bg-[#1c1c20] border border-[#323238] text-white font-mono focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPasswordInModal(!showPasswordInModal)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                title={showPasswordInModal ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPasswordInModal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role specific assignments in edit */}
          {formData.role === 'guru_bk' && (
            <div className="bg-[#18181d] border border-purple-500/30 rounded-xl p-3 space-y-1.5">
              <label className="block text-purple-300 font-bold">Spesialisasi Bimbingan Konseling (BK)</label>
              <input
                type="text"
                value={formData.counselorSpecialization}
                onChange={e => setFormData({ ...formData, counselorSpecialization: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          )}

          {formData.role === 'pembina_ekskul' && (
            <div className="bg-[#18181d] border border-emerald-500/30 rounded-xl p-3 space-y-2">
              <label className="block text-emerald-300 font-bold">Ekstrakurikuler yang Diampu</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1 bg-[#121215] rounded-lg border border-[#27272a]">
                {extracurriculars.map((e, idx) => {
                  const isChecked = formData.extracurricularIds.includes(e.id);
                  const theme = getEkskulTheme(e.id, e.category);
                  return (
                    <label
                      key={e.id ? `edit-ek-${e.id}-${idx}` : `edit-ek-idx-${idx}`}
                      className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition ${
                        isChecked
                          ? `${theme.bgLight} ${theme.borderLight} text-white`
                          : 'bg-[#18181c] border-[#292930] text-zinc-300 hover:bg-[#202026]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={ev => {
                          const next = ev.target.checked
                            ? [...formData.extracurricularIds, e.id]
                            : formData.extracurricularIds.filter(id => id !== e.id);
                          setFormData({ ...formData, extracurricularIds: next });
                        }}
                        className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 w-3.5 h-3.5"
                      />
                      <span className="truncate text-xs font-semibold">{e.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cash Manager Privilege in Edit Modal */}
          <div className="p-3 bg-[#18181d] rounded-xl border border-amber-500/30 space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isCashManager || false}
                onChange={e => setFormData({ ...formData, isCashManager: e.target.checked })}
                className="rounded bg-zinc-800 border-zinc-700 text-amber-500 focus:ring-amber-500 w-4 h-4"
              />
              <span className="text-zinc-100 font-bold text-xs flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-amber-400" />
                <span>Beri Hak Otoritas Pengelola Uang Kas (Neraca Keuangan)</span>
              </span>
            </label>
            {formData.isCashManager && (
              <div className="pt-1">
                <label className="block text-amber-300 font-bold text-[11px] mb-1">
                  Gelar / Jabatan Pengelola Kas
                </label>
                <input
                  type="text"
                  value={formData.cashManagerTitle || ''}
                  onChange={e => setFormData({ ...formData, cashManagerTitle: e.target.value })}
                  placeholder="Contoh: Bendahara Kas BK / Bendahara OSIM"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#1c1c20] border border-[#323238] text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>

          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-[#27272a]">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-3.5 py-2 rounded-lg bg-[#222226] text-zinc-300 hover:text-white font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CETAK SLIP KARTU LOGIN (PRINT SLIP DIALOG) */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Cetak Kartu Slip Akun Login SIM Kesiswaan"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-[#18181d] border border-[#27272a] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-zinc-400 font-semibold block">Pilih Cakupan Cetak:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserForPrint(null);
                    setPrintFilterRole('all');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    !selectedUserForPrint && printFilterRole === 'all'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  Semua Akun ({allUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserForPrint(null);
                    setPrintFilterRole('guru_bk');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    !selectedUserForPrint && printFilterRole === 'guru_bk'
                      ? 'bg-purple-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  Guru BK
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserForPrint(null);
                    setPrintFilterRole('pembina_osim');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    !selectedUserForPrint && printFilterRole === 'pembina_osim'
                      ? 'bg-amber-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  Pembina OSIM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserForPrint(null);
                    setPrintFilterRole('pembina_ekskul');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    !selectedUserForPrint && printFilterRole === 'pembina_ekskul'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  Pembina Ekskul
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserForPrint(null);
                    setPrintFilterRole('pengurus_osim');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    !selectedUserForPrint && printFilterRole === 'pengurus_osim'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  Pengurus OSIM
                </button>
              </div>
            </div>

            <label className="flex items-center space-x-2 cursor-pointer shrink-0 bg-[#121215] px-3 py-2 rounded-lg border border-[#27272a]">
              <input
                type="checkbox"
                checked={printIncludePassword}
                onChange={e => setPrintIncludePassword(e.target.checked)}
                className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 w-4 h-4"
              />
              <span className="text-zinc-200 font-bold text-xs">Cantumkan Kata Sandi</span>
            </label>
          </div>

          {/* Slip Preview Grid */}
          <div className="space-y-2">
            <span className="text-zinc-400 font-mono text-[11px] block">
              Pratinjau Format Slip ({selectedUserForPrint ? '1 Akun Spesifik' : printFilterRole === 'all' ? `${allUsers.length} Akun` : `${allUsers.filter(u => u.role === printFilterRole).length} Akun`}):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-2 bg-[#121215] rounded-xl border border-[#27272a]">
              {(selectedUserForPrint
                ? [selectedUserForPrint]
                : printFilterRole === 'all'
                ? allUsers
                : allUsers.filter(u => u.role === printFilterRole)
              ).slice(0, 6).map((u, pIdx) => {
                const cred = getUserSlipCredentials(u, osimMembers);
                const badge = getRoleBadge(u.role);
                return (
                  <div
                    key={u.uid ? `slip-preview-${u.uid}-${pIdx}` : `slip-preview-idx-${pIdx}`}
                    className="bg-white text-zinc-900 rounded-xl p-3.5 border-2 border-emerald-600 shadow-sm space-y-2"
                  >
                    <div className="border-b border-emerald-600 pb-1.5 flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-xs text-emerald-900 uppercase">KARTU LOGIN SIM KESISWAAN</h4>
                        <p className="text-[9px] text-zinc-600 font-semibold">{schoolSetting?.name || 'MADRASAH ALIYAH NEGERI'}</p>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        {badge.label}
                      </span>
                    </div>

                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between border-b border-dashed border-zinc-200 pb-0.5">
                        <span className="text-zinc-600 font-semibold">Nama:</span>
                        <span className="font-bold text-zinc-950 font-sans truncate max-w-[170px]">{cred.displayName}</span>
                      </div>
                      <div className="flex justify-between border-b border-dashed border-zinc-200 pb-0.5">
                        <span className="text-zinc-600 font-semibold">NIP / NIS:</span>
                        <span className="font-bold text-zinc-900">{cred.nipOrNis}</span>
                      </div>
                      <div className="flex justify-between border-b border-dashed border-zinc-200 pb-0.5">
                        <span className="text-zinc-600 font-semibold">Email:</span>
                        <span className="text-zinc-800 truncate max-w-[170px]">{cred.email}</span>
                      </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-2 font-mono text-xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">USERNAME:</span>
                        <strong className="text-emerald-950">{cred.loginUsername}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-500 block">PASSWORD:</span>
                        <strong className="text-emerald-700">
                          {printIncludePassword ? cred.password : '••••••••'}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {allUsers.length > 6 && !selectedUserForPrint && (
              <p className="text-[10px] text-zinc-500 font-mono text-center">
                * Menampilkan pratinjau 6 kartu pertama. Saat dicetak, seluruh {allUsers.length} kartu akan dicetak lengkap dalam tata letak A4/Folio.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#27272a]">
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(false)}
              className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={handleExecutePrintSlips}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Slip Sekarang</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* DETAIL USER MODAL */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detail Profil & Hak Akses Akun"
        size="md"
      >
        {selectedUserForAction && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-[#18181c] border border-[#27272a]">
              {(() => {
                const isBKOrPembina = isGuruBKOrPembinaRole(selectedUserForAction.role);
                const teacherInitials = getTeacherInitials(selectedUserForAction.displayName);
                const theme = getInitialsColorTheme(selectedUserForAction.role);

                if (isBKOrPembina) {
                  return (
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${theme.bgGradient} flex flex-col items-center justify-center font-black font-mono text-base text-white shadow-md shrink-0 border-2 ${theme.borderColor}`}>
                      <span>{teacherInitials}</span>
                      <span className="text-[7px] uppercase font-bold text-white/75 tracking-wider">Inisial</span>
                    </div>
                  );
                }

                return selectedUserForAction.photoURL ? (
                  <img
                    src={selectedUserForAction.photoURL}
                    alt={selectedUserForAction.displayName}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover border-2 border-emerald-500/50 shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 via-blue-600 to-indigo-700 flex items-center justify-center font-mono font-black text-lg text-white shadow-md shrink-0">
                    {teacherInitials}
                  </div>
                );
              })()}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{selectedUserForAction.displayName}</h4>
                <p className="text-xs text-zinc-300 font-mono">{selectedUserForAction.email}</p>
                <span className={`inline-block mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getRoleBadge(selectedUserForAction.role).color}`}>
                  {getRoleBadge(selectedUserForAction.role).label}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono bg-[#141416] p-3.5 rounded-xl border border-[#27272a]">
              <div className="flex justify-between py-1 border-b border-[#222226]">
                <span className="text-zinc-400 font-bold">NIP / NIK:</span>
                <span className="text-white font-bold">{selectedUserForAction.nip || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#222226]">
                <span className="text-zinc-400 font-bold">USERNAME:</span>
                <span className="text-zinc-100">{selectedUserForAction.username || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#222226]">
                <span className="text-zinc-400 font-bold">NO. TELEPON / WA:</span>
                <span className="text-zinc-100">{selectedUserForAction.phone || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#222226]">
                <span className="text-zinc-400 font-bold">STATUS AKUN:</span>
                <span className={selectedUserForAction.status === 'Nonaktif' ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {selectedUserForAction.status || 'Aktif'}
                </span>
              </div>
              {selectedUserForAction.counselorSpecialization && (
                <div className="py-1 border-b border-[#222226]">
                  <span className="text-purple-300 font-bold block mb-0.5">SPESIALISASI BK:</span>
                  <span className="text-zinc-200 font-sans">{selectedUserForAction.counselorSpecialization}</span>
                </div>
              )}
              {selectedUserForAction.extracurricularIds && selectedUserForAction.extracurricularIds.length > 0 && (
                <div className="py-1">
                  <span className="text-emerald-300 font-bold block mb-1">EKSKUL BINAAN:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedUserForAction.extracurricularIds.map((eid, idx) => {
                      const ek = extracurriculars.find(e => e.id === eid);
                      return (
                        <span key={eid ? `cpanel-user-ek-${eid}-${idx}` : `cpanel-user-ek-idx-${idx}`} className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-sans font-semibold">
                          {ek ? ek.name : eid}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-200 hover:bg-zinc-700 text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL GANTI / RESET KATA SANDI PENGGUNA (HAK ADMIN APP) */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Kelola & Ganti Kata Sandi Akun"
        maxWidth="max-w-md"
      >
        {selectedUserForAction && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white font-bold truncate text-sm">
                  {selectedUserForAction.displayName}
                </div>
                <div className="text-zinc-400 font-mono text-[11px] flex items-center gap-2">
                  <span>@{selectedUserForAction.username || selectedUserForAction.email.split('@')[0]}</span>
                  <span>•</span>
                  <span className="text-amber-400 uppercase font-semibold">{selectedUserForAction.role}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>Kata Sandi Baru</span>
                <button
                  type="button"
                  onClick={() => {
                    const defaultP = selectedUserForAction.role === 'pengurus_osim'
                      ? getDefaultOsimPassword(selectedUserForAction.osimDepartmentCode || selectedUserForAction.osimRole || selectedUserForAction.username)
                      : 'password';
                    setCustomResetPassword(defaultP);
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 underline font-mono"
                >
                  {selectedUserForAction.role === 'pengurus_osim'
                    ? `Set Sandi Sekbid (${getDefaultOsimPassword(selectedUserForAction.osimDepartmentCode || selectedUserForAction.osimRole || selectedUserForAction.username)})`
                    : 'Gunakan default ("password")'}
                </button>
              </label>
              <div className="relative">
                <input
                  type={showResetPasswordText ? 'text' : 'password'}
                  value={customResetPassword}
                  onChange={e => setCustomResetPassword(e.target.value)}
                  placeholder="Ketik password baru"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#18181b] border border-[#323238] text-white text-xs font-mono placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPasswordText(!showResetPasswordText)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-1 transition-colors"
                >
                  {showResetPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300/90 text-[11px] space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Siklus Otomatis Pergantian Kata Sandi:
              </p>
              <p className="text-zinc-300">
                Saat Anda menyimpan, kata sandi lama <strong>otomatis tidak berlaku</strong> lagi di seluruh sistem. Pengguna ({selectedUserForAction.displayName}) wajib memasukkan kata sandi baru ini pada login berikutnya.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#27272a]">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmResetPassword}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-amber-950/40"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Simpan Kata Sandi Baru</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* CONFIRM DELETE USER DIALOG */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteUser}
        title="Hapus Akun Pengguna"
        message={`Apakah Anda yakin ingin menghapus akun "${selectedUserForAction?.displayName}" (${selectedUserForAction?.email}) dari cPanel Kesiswaan? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus Akun"
        variant="danger"
      />

      {/* CONFIRM CLEAR OPERATIONAL DATA DIALOG */}
      <ConfirmDialog
        isOpen={isClearDataModalOpen}
        onClose={() => setIsClearDataModalOpen(false)}
        onConfirm={handleClearAllData}
        title="Konfirmasi Pengosongan Data Bawaan"
        message="Apakah Anda yakin ingin mengosongkan seluruh data operasional bawaan (siswa, absensi, pelanggaran, konseling BK, OSIM, prestasi)? Tindakan ini berguna agar aplikasi siap menerima berkas unggahan data resmi sekolah."
        confirmLabel="Ya, Kosongkan Data Bawaan"
        variant="danger"
      />

      {/* ACADEMIC YEAR MANAGEMENT MODAL */}
      <AcademicYearManagementModal
        isOpen={isAcademicYearModalOpen}
        onClose={() => setIsAcademicYearModalOpen(false)}
      />

    </div>
  );
};
