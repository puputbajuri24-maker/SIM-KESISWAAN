import React, { useState, useMemo } from 'react';
import {
  Server,
  Users,
  ShieldCheck,
  ShieldAlert,
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
  BookOpen,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSchool } from '../contexts/SchoolContext';
import { AnnouncementManagementPanel } from '../components/announcements/AnnouncementManagementPanel';
import { UserProfile, UserRole, CanonicalUserRole, SchoolSetting, Teacher, Student, SchoolClass, OsimMember } from '../types';
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
import { getUserHierarchyClassification, sortUsersByHierarchy, canonicalizeAssignedEkskulIds, cleanDigits, isTeacherUserMatch, isOsimMemberUserMatch, isPlaceholderNis, extractSekbidNumber } from '../utils/syncUtils';
import { canResetUserPassword } from '../utils/rbacRules';
import { normalizeUserRole } from '../permissions';
import { getNextTeacherDocId } from '../utils/idGenerator';

export const CPanelPage: React.FC = () => {
  const { allUsers, currentUser, isSuperAdmin, addUser, updateUser, deleteUser, resetUserPassword, syncUsersFromTeachers, syncUsersFromOsim, loginWithUser, loginWithDemoRole, migrateAllUsersToTidyUids, activateTeacherAccount, activateOsimAccount } = useAuth();
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
    addTeacher,
    classes,
    auditLogs,
    syncUserFromCPanel,
    syncDeleteUserFromCPanel,
    syncAllCPanelUsers,
    osimDepartments,
    osimMembers,
    checkDatabaseRelationalHealth,
    runFullDatabaseHarmonization,
    autoHealOrphanRecords,
    createDisasterRecoverySnapshot,
    restoreFromDisasterSnapshot,
    getDisasterRecoverySnapshots,
    deleteDisasterRecoverySnapshot,
    verifyCloudDataIntegrity
  } = useSchool();

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'crud_center' | 'announcements' | 'school' | 'matrix' | 'sync' | 'logs' | 'tahap5' | 'fase7' | 'fase8'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // View Mode for user list (Tabel vs Kartu Grid) - same as Pembina Ekstra & OSIM
  const [userViewMode, setUserViewMode] = useState<'table' | 'cards'>('table');
  const [rolePillFilter, setRolePillFilter] = useState<string>('all');

  // Source Mode for Add User Modal: Database Dewan Guru vs Pengurus OSIM vs Database Siswa vs Input Manual
  const [accountSourceType, setAccountSourceType] = useState<'teacher' | 'osim' | 'student' | 'manual'>('teacher');
  const [selectedTeacherForAccount, setSelectedTeacherForAccount] = useState<Teacher | null>(null);
  const [addTeacherSearchTerm, setAddTeacherSearchTerm] = useState('');
  const [teacherFilterCategory, setTeacherFilterCategory] = useState<'all' | 'unregistered' | 'bk' | 'pembina'>('all');
  const [isChangingTeacherForAccount, setIsChangingTeacherForAccount] = useState(false);

  // OSIM Member selection for OSIM account activation in Add User Modal
  const [selectedOsimMemberForAccount, setSelectedOsimMemberForAccount] = useState<OsimMember | null>(null);
  const [addOsimMemberSearchTerm, setAddOsimMemberSearchTerm] = useState('');
  const [isChangingOsimMemberForAccount, setIsChangingOsimMemberForAccount] = useState(false);

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
  const pembinaEkskulUsers = useMemo(
    () => allUsers.filter(u => u.role === 'coach_ekstrakurikuler' || u.role === 'pembina_ekskul' || u.role === 'pembina' || (u.role as string) === 'pembina_ekstrakurikuler'),
    [allUsers]
  );
  const pembinaOsimUsers = useMemo(() => allUsers.filter(u => u.role === 'pembina_osim'), [allUsers]);
  const osimPengurusUsers = useMemo(
    () => allUsers.filter(u => u.role === 'anggota_osim' || u.role === 'pengurus_osim'),
    [allUsers]
  );
  const wakaUsers = useMemo(() => allUsers.filter(u => u.role === 'waka_kesiswaan' || (u.role as string) === 'waka'), [allUsers]);
  const adminUsers = useMemo(() => allUsers.filter(u => u.role === 'super_admin'), [allUsers]);

  const [selectedBkUserId, setSelectedBkUserId] = useState<string>('');
  const [selectedPembinaUserId, setSelectedPembinaUserId] = useState<string>('');
  const [selectedOsimUserId, setSelectedOsimUserId] = useState<string>('');
  const [isSyncingOsim, setIsSyncingOsim] = useState(false);

  const getPembinaEkskulName = (u: UserProfile) => {
    // 1. Ekstrakurikuler ID match
    if (u.extracurricularIds && u.extracurricularIds.length > 0) {
      for (const eid of u.extracurricularIds) {
        if (!eid || typeof eid !== 'string' || /^\d+$/.test(eid.trim())) continue;
        const normEid = eid.trim().toLowerCase();
        const found = extracurriculars.find(e => 
          (e.id && typeof e.id === 'string' && e.id.toLowerCase() === normEid) || 
          (e.name && typeof e.name === 'string' && e.name.toLowerCase() === normEid) ||
          (normEid.startsWith('ekskul_') && e.id && typeof e.id === 'string' && e.id.toLowerCase() === normEid)
        );
        if (found && found.name && !/^\d+$/.test(found.name)) {
          return found.name;
        }
      }
    }

    // 2. Ekstrakurikuler Names match
    if (u.extracurricularNames && u.extracurricularNames.length > 0) {
      for (const n of u.extracurricularNames) {
        if (!n || typeof n !== 'string' || /^\d+$/.test(n.trim())) continue;
        const normName = n.trim().toLowerCase();
        const found = extracurriculars.find(e => 
          (e.name && typeof e.name === 'string' && e.name.toLowerCase() === normName) || 
          (e.id && typeof e.id === 'string' && e.id.toLowerCase() === normName)
        );
        if (found && found.name && !/^\d+$/.test(found.name)) {
          return found.name;
        }
      }
    }

    // 3. String name fallback
    if (u.extracurricularName && typeof u.extracurricularName === 'string' && !u.extracurricularName.startsWith('ekskul_') && !/^\d+$/.test(u.extracurricularName.trim())) {
      const parts = u.extracurricularName.split(',');
      for (const p of parts) {
        const clean = p.trim();
        if (!clean || /^\d+$/.test(clean)) continue;
        const norm = clean.toLowerCase();
        const found = extracurriculars.find(e => 
          (e.name && typeof e.name === 'string' && e.name.toLowerCase() === norm) || 
          (e.id && typeof e.id === 'string' && e.id.toLowerCase() === norm)
        );
        if (found && found.name && !/^\d+$/.test(found.name)) {
          return found.name;
        }
      }
    }

    return 'Ekstrakurikuler';
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
    uid?: string;
    displayName: string;
    nip: string;
    email: string;
    username: string;
    password?: string;
    role: UserRole;
    phone: string;
    counselorSpecialization: string;
    extracurricularIds: string[];
    extracurricularNames?: string[];
    extracurricularName?: string;
    status: 'Aktif' | 'Nonaktif';
    isCashManager: boolean;
    cashManagerTitle: string;
  }>({
    uid: '',
    displayName: '',
    nip: '',
    email: '',
    username: '',
    password: 'guru12345',
    role: 'coach_ekstrakurikuler',
    phone: '',
    counselorSpecialization: 'Bimbingan Konseling Siswa & Karir',
    extracurricularIds: [],
    extracurricularNames: [],
    extracurricularName: '',
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
  const [isSubmittingAddUser, setIsSubmittingAddUser] = useState(false);
  const [isSubmittingEditUser, setIsSubmittingEditUser] = useState(false);
  const [isSubmittingResetPassword, setIsSubmittingResetPassword] = useState(false);
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
    const teacherName = (t.fullName || '').toLowerCase().trim();
    return !allUsers.some(u => 
      u.uid === t.id ||
      u.uid === `user_${t.id}` ||
      (cleanNip && u.nip && u.nip.replace(/\s+/g, '').replace(/[^0-9]/g, '') === cleanNip) ||
      (cleanEmail && u.email && u.email.toLowerCase().trim() === cleanEmail) ||
      (teacherName && u.displayName && u.displayName.toLowerCase().trim() === teacherName)
    );
  });

  // Find OSIM departments that don't have synchronized accounts yet
  const unregisteredOsimCount = useMemo(() => {
    let count = 0;
    for (const d of osimDepartments) {
      if (d.code === 'BPH' || (d.name && d.name.startsWith('BPH'))) continue;
      const code = (d.code || '').toLowerCase();
      const deptName = (d.name || '').toLowerCase();
      const coordName = (d.coordinatorName || '').toLowerCase().trim();
      const hasAcc = allUsers.some(u => 
        (u.role === 'pengurus_osim' || u.role === 'anggota_osim') && 
        (
          (code && u.osimDepartmentCode && u.osimDepartmentCode.toLowerCase() === code) ||
          (code && u.username && u.username.toLowerCase() === code) ||
          (deptName && u.osimDepartmentName && u.osimDepartmentName.toLowerCase() === deptName) ||
          (coordName && u.displayName && u.displayName.toLowerCase().trim() === coordName)
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
    const roleStr = String(u.role || 'user');
    const isOsim = u.role === 'anggota_osim' || u.role === 'pengurus_osim' || Boolean(u.uid && u.uid.startsWith('user_osim_'));
    const defaultPwd = isOsim ? (u.password || 'osim12345') : (u.password || 'Dikelola oleh Firebase Auth');
    const jabatanStr = u.osimPosition || u.osimDepartmentName || roleStr.toUpperCase().replace(/_/g, ' ');

    const text = `INFORMASI AKUN RESMI SIM KESISWAAN
Nama Pengguna : ${u.displayName || u.username || '-'}
Jabatan/Peran : ${jabatanStr}
NIP / NIS     : ${u.nip || '-'}
Username      : ${u.username || '-'}
Password Awal : ${defaultPwd}
Email Akun    : ${u.email || '-'}
Alamat Sistem : ${window.location.origin}
--------------------------------------------------
*Penting: Pada akun pengurus OSIM, halaman profil hanya dapat memperbarui nomor WhatsApp. Nama, NIS, dan kata sandi dikelola secara terpusat oleh Administrator Kesiswaan.*`;

    navigator.clipboard.writeText(text);
    showToast(`Informasi akun login "${u.displayName || u.username}" berhasil disalin ke clipboard!`);
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

  const handleMigrateTidyUids = async () => {
    setIsSyncingAll(true);
    try {
      const res = await migrateAllUsersToTidyUids();
      showToast(`Tahap 4 Selesai: ${res.migratedCount} akun dimigrasikan ke UID rapi, ${res.deletedArtifactsCount} akun ganda/artefak acak dibersihkan dari Firestore!`);
    } catch (e: any) {
      showToast('Gagal merapikan ID akun: ' + e?.message, 'error');
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleSyncAllModules = async () => {
    setIsSyncingAll(true);
    try {
      await migrateAllUsersToTidyUids();
      await syncAllCPanelUsers(allUsers);
      showToast('Seluruh data akun cPanel berhasil dirapikan dan disinkronkan ke Dewan Guru, Ekstrakurikuler, dan modul Kesiswaan!');
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
      const isAlreadyRegistered = allUsers.some(u => {
        if (u.nip && t.nip && u.nip.trim() && t.nip.trim() && u.nip.trim() === t.nip.trim()) return true;
        if (u.displayName && t.fullName && u.displayName.toLowerCase().trim() === t.fullName.toLowerCase().trim()) return true;
        return false;
      });
      if (teacherFilterCategory === 'unregistered' && isAlreadyRegistered) return false;
      const tRole = (t.role || '').toLowerCase();
      const tSub = (t.subject || '').toLowerCase();
      const tName = (t.fullName || '').toLowerCase();
      if (teacherFilterCategory === 'bk' && !tRole.includes('bk') && !tSub.includes('bk') && !tName.includes('bk')) return false;
      if (teacherFilterCategory === 'pembina' && !t.isPembina && (!t.assignedExtracurriculars || t.assignedExtracurriculars.length === 0)) return false;

      if (!teacherSearchTerm) return true;
      const q = teacherSearchTerm.toLowerCase();
      return (
        (t.fullName && t.fullName.toLowerCase().includes(q)) ||
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
    const rawRole = (teacher.role || '').toLowerCase();
    const rawSubject = (teacher.subject || '').toLowerCase();
    const rawName = (teacher.fullName || '').toLowerCase();
    const isBK = rawRole.includes('bk') || rawRole.includes('bimbingan') || rawRole.includes('konselor') || rawSubject.includes('bk') || rawName.includes('bk');
    const isWaka = rawRole.includes('waka') || rawName.includes('waka');
    const isOsim = rawRole.includes('osim') || rawRole.includes('osis') || (teacher.extracurricularName && teacher.extracurricularName.toLowerCase().includes('osim'));
    const isWali = rawRole.includes('wali') || rawRole.includes('homeroom');

    if (isBK) role = 'guru_bk';
    else if (isWaka) role = 'waka_kesiswaan';
    else if (isOsim) role = 'pembina_osim';
    else if (isWali) role = 'wali_kelas';
    else if (teacher.isPembina || (teacher.assignedExtracurriculars && teacher.assignedExtracurriculars.length > 0)) role = 'pembina_ekskul';
    else if (rawRole.includes('guru') || rawRole.includes('mapel') || rawRole.includes('piket') || rawRole.includes('staff')) role = 'guru';

    // Auto-match extracurriculars (dukungan rangkap tugas untuk semua guru)
    let matchedEkskulIds: string[] = [];
    if (teacher.assignedExtracurriculars && teacher.assignedExtracurriculars.length > 0) {
      matchedEkskulIds = canonicalizeAssignedEkskulIds(teacher.assignedExtracurriculars, extracurriculars);
    } else if (teacher.extracurricularName) {
      matchedEkskulIds = canonicalizeAssignedEkskulIds([teacher.extracurricularName], extracurriculars);
    }

    const tName = teacher.fullName || '';
    const cleanDigitsNip = cleanDigits(teacher.nip);
    const cleanUsername = (cleanDigitsNip && cleanDigitsNip.length >= 4)
      ? `guru_${cleanDigitsNip}`
      : (teacher.email && teacher.email.includes('@')
        ? teacher.email.split('@')[0]
        : (teacher.code ? teacher.code.toLowerCase().replace(/[^a-z0-9]/g, '') : `guru_${teacher.id.replace(/^guru_/, '')}`));
    const cleanEmail = teacher.email || (cleanDigitsNip && cleanDigitsNip.length >= 4 ? `guru.${cleanDigitsNip}@madrasah.sch.id` : `${cleanUsername}@madrasah.sch.id`);

    setFormData({
      displayName: tName,
      nip: teacher.nip || '',
      email: cleanEmail,
      username: cleanUsername,
      role: role,
      phone: teacher.phone || '',
      counselorSpecialization: role === 'guru_bk' ? 'Bimbingan Konseling Siswa & Karir' : '',
      extracurricularIds: matchedEkskulIds,
      extracurricularNames: matchedEkskulIds.map(id => extracurriculars.find(e => (e.id && e.id === id) || (e.name && typeof e.name === 'string' && typeof id === 'string' && e.name.toLowerCase() === id.toLowerCase()))?.name || id).filter(Boolean),
      extracurricularName: matchedEkskulIds.map(id => extracurriculars.find(e => (e.id && e.id === id) || (e.name && typeof e.name === 'string' && typeof id === 'string' && e.name.toLowerCase() === id.toLowerCase()))?.name || id).filter(Boolean).join(', '),
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
      role: 'pengurus_osim',
      phone: student.phone || '',
      counselorSpecialization: '',
      extracurricularIds: [],
      status: 'Aktif',
      isCashManager: false,
      cashManagerTitle: 'Bendahara OSIM'
    });
  };

  const handleSelectOsimMemberForAccount = (m: OsimMember) => {
    setSelectedOsimMemberForAccount(m);
    setIsChangingOsimMemberForAccount(false);
    const cleanNis = cleanDigits(m.studentNis);
    const autoUsername = cleanNis && cleanNis.length >= 4 ? `osim_${cleanNis}` : (m.email ? m.email.split('@')[0] : `osim_${m.id}`);
    setFormData({
      displayName: m.fullName,
      nip: m.studentNis || '',
      email: m.email || '',
      username: autoUsername,
      password: 'osim12345',
      role: 'anggota_osim',
      phone: m.phone && m.phone !== '-' ? m.phone : '',
      counselorSpecialization: undefined,
      extracurricularIds: [],
      status: 'Aktif',
      isCashManager: (m.position || '').toLowerCase().includes('bendahara'),
      cashManagerTitle: (m.position || '').toLowerCase().includes('bendahara') ? 'Bendahara OSIM' : undefined
    });
  };

  const handleApplyRolePreset = (presetRole: UserRole) => {
    setFormData(prev => ({
      ...prev,
      role: presetRole,
      counselorSpecialization: presetRole === 'guru_bk' ? (prev.counselorSpecialization || 'Bimbingan Konseling Siswa & Karir') : prev.counselorSpecialization,
      cashManagerTitle: prev.isCashManager ? (prev.cashManagerTitle || (presetRole === 'pengurus_osim' ? 'Bendahara OSIM' : 'Bendahara Kesiswaan')) : prev.cashManagerTitle
    }));
  };

  // Daftar guru yang baru diinput di Menu Guru & Pembina dan belum diaktifkan akun loginnya
  const pendingTeachers = useMemo(() => {
    return teachers.filter(t => {
      if (t.isLoginActive === true || t.accountStatus === 'active') return false;
      const matched = allUsers.find(u =>
        u.uid === t.id ||
        u.uid === `user_${t.id}` ||
        (t.email && u.email && u.email.trim().toLowerCase() === t.email.trim().toLowerCase()) ||
        isTeacherUserMatch(u, t)
      );
      if (matched && matched.isLoginActive !== false && matched.loginStatus !== 'pending_activation' && matched.status === 'Aktif') {
        return false;
      }
      return true;
    });
  }, [teachers, allUsers]);

  // Daftar pengurus OSIM (BPH & Sekbid) yang belum diaktifkan akun loginnya
  const pendingOsimMembers = useMemo(() => {
    return osimMembers.filter(m => {
      if (m.isLoginActive === true || m.accountStatus === 'active') return false;
      const cleanNis = cleanDigits(m.studentNis);
      const matched = allUsers.find(u =>
        u.uid === m.id ||
        u.uid === `user_${m.id}` ||
        u.uid === `user_osim_${cleanNis}` ||
        (m.email && u.email && u.email.trim().toLowerCase() === m.email.trim().toLowerCase()) ||
        (cleanNis && cleanDigits(u.nip) === cleanNis) ||
        isOsimMemberUserMatch(u, m)
      );
      if (matched && matched.isLoginActive !== false && matched.loginStatus !== 'pending_activation' && matched.status === 'Aktif') {
        return false;
      }
      return true;
    });
  }, [osimMembers, allUsers]);

  const filteredOsimMembersForAdd = useMemo(() => {
    let list = pendingOsimMembers.length > 0 ? pendingOsimMembers : osimMembers;
    if (addOsimMemberSearchTerm.trim()) {
      const q = addOsimMemberSearchTerm.toLowerCase();
      list = list.filter(m =>
        (m.fullName && m.fullName.toLowerCase().includes(q)) ||
        (m.studentNis && m.studentNis.includes(q)) ||
        (m.position && m.position.toLowerCase().includes(q)) ||
        (m.sekbid && m.sekbid.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q))
      );
    }
    return list;
  }, [pendingOsimMembers, osimMembers, addOsimMemberSearchTerm]);

  const handleOpenActivateModal = (target?: UserProfile | Teacher | OsimMember) => {
    setShowPasswordInModal(false);

    if (target) {
      // 1. Target adalah Profil Pengurus OSIM dari Menu OSIM
      if ('studentNis' in target && !('displayName' in target)) {
        const m = target as OsimMember;
        setAccountSourceType('osim');
        handleSelectOsimMemberForAccount(m);
      }
      // 2. Target adalah Profil Guru dari Menu Guru & Pembina
      else if ('fullName' in target && !('displayName' in target)) {
        const t = target as Teacher;
        setAccountSourceType('teacher');
        setSelectedTeacherForAccount(t);
        setIsChangingTeacherForAccount(false);
        const cleanNip = cleanDigits(t.nip);
        const autoUsername = cleanNip && cleanNip.length >= 4 ? `guru_${cleanNip}` : (t.email ? t.email.split('@')[0] : `guru_${t.id}`);
        setFormData({
          displayName: t.fullName,
          nip: t.nip && t.nip !== '-' ? t.nip : '',
          email: t.email || '',
          username: autoUsername,
          password: 'guru12345',
          role: normalizeUserRole(t.role) || 'guru',
          phone: t.phone || '',
          counselorSpecialization: t.role.toLowerCase().includes('bk') ? (t.subject || 'Bimbingan Konseling Siswa & Karir') : undefined,
          extracurricularIds: t.assignedExtracurriculars || [],
          status: 'Aktif',
          isCashManager: !!t.isCashManager,
          cashManagerTitle: t.cashManagerTitle || 'Bendahara Kesiswaan'
        });
      }
      // 3. Target adalah UserProfile yang sudah ada (Pengurus OSIM)
      else if ('displayName' in target && (target.role === 'anggota_osim' || target.role === 'pengurus_osim')) {
        const u = target as UserProfile;
        setAccountSourceType('osim');
        const matchedOsim = osimMembers.find(m =>
          (u.nip && cleanDigits(m.studentNis) === cleanDigits(u.nip)) ||
          (u.email && m.email && m.email.trim().toLowerCase() === u.email.trim().toLowerCase()) ||
          m.fullName.toLowerCase() === u.displayName.toLowerCase() ||
          m.id === u.uid ||
          (m as any).userUid === u.uid
        );
        if (matchedOsim) {
          setSelectedOsimMemberForAccount(matchedOsim);
          setIsChangingOsimMemberForAccount(false);
        } else {
          setSelectedOsimMemberForAccount(null);
        }
        setFormData({
          displayName: u.displayName || '',
          nip: u.nip || '',
          email: u.email || '',
          username: u.username || (u.email ? u.email.split('@')[0] : ''),
          password: u.password && u.password !== 'password' ? u.password : 'osim12345',
          role: 'anggota_osim',
          phone: u.phone || '',
          counselorSpecialization: undefined,
          extracurricularIds: [],
          status: 'Aktif',
          isCashManager: !!u.isCashManager,
          cashManagerTitle: u.cashManagerTitle || 'Bendahara OSIM'
        });
      }
      // 4. Target adalah UserProfile yang sudah ada (Guru / Petugas)
      else {
        const u = target as UserProfile;
        setAccountSourceType('teacher');
        const matchedT = teachers.find(t => isTeacherUserMatch(u, t));
        if (matchedT) {
          setSelectedTeacherForAccount(matchedT);
        }
        setIsChangingTeacherForAccount(false);
        setFormData({
          displayName: u.displayName || '',
          nip: u.nip || '',
          email: u.email || '',
          username: u.username || (u.email ? u.email.split('@')[0] : ''),
          password: u.password && u.password !== 'password' ? u.password : 'guru12345',
          role: u.role || 'guru',
          phone: u.phone || '',
          counselorSpecialization: u.counselorSpecialization || 'Bimbingan Konseling Siswa & Karir',
          extracurricularIds: u.extracurricularIds || [],
          status: 'Aktif',
          isCashManager: !!u.isCashManager,
          cashManagerTitle: u.cashManagerTitle || 'Bendahara Kesiswaan'
        });
      }
    } else {
      setAccountSourceType('teacher');
      const firstPending = pendingTeachers[0];
      if (firstPending) {
        setSelectedTeacherForAccount(firstPending);
        setIsChangingTeacherForAccount(false);
        const cleanNip = cleanDigits(firstPending.nip);
        const autoUsername = cleanNip && cleanNip.length >= 4 ? `guru_${cleanNip}` : (firstPending.email ? firstPending.email.split('@')[0] : `guru_${firstPending.id}`);
        setFormData({
          displayName: firstPending.fullName,
          nip: firstPending.nip && firstPending.nip !== '-' ? firstPending.nip : '',
          email: firstPending.email || '',
          username: autoUsername,
          password: 'guru12345',
          role: normalizeUserRole(firstPending.role) || 'guru',
          phone: firstPending.phone || '',
          counselorSpecialization: firstPending.role.toLowerCase().includes('bk') ? (firstPending.subject || 'Bimbingan Konseling Siswa & Karir') : undefined,
          extracurricularIds: firstPending.assignedExtracurriculars || [],
          status: 'Aktif',
          isCashManager: !!firstPending.isCashManager,
          cashManagerTitle: firstPending.cashManagerTitle || 'Bendahara Kesiswaan'
        });
      } else {
        setSelectedTeacherForAccount(null);
        setIsChangingTeacherForAccount(true);
        setFormData({
          displayName: '',
          nip: '',
          email: '',
          username: '',
          password: 'guru12345',
          role: 'guru',
          phone: '',
          counselorSpecialization: 'Bimbingan Konseling Siswa & Karir',
          extracurricularIds: [],
          status: 'Aktif',
          isCashManager: false,
          cashManagerTitle: 'Bendahara Kesiswaan'
        });
      }
    }
    setIsAddModalOpen(true);
  };

  const handleOpenAddModal = handleOpenActivateModal;

  const handleOpenEditModal = (u: UserProfile) => {
    setSelectedUserForAction(u);
    setShowPasswordInModal(false);
    setFormData({
      displayName: u.displayName || '',
      nip: u.nip || '',
      email: u.email || '',
      username: u.username || '',
      password: u.password || '',
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

    if (accountSourceType === 'student' && !selectedStudentForAccount) {
      showToast('Harap pilih salah satu Siswa dari Grid Database Siswa di bawah.', 'error');
      return;
    }

    if (accountSourceType === 'osim' && !selectedOsimMemberForAccount && pendingOsimMembers.length > 0 && !formData.displayName.trim()) {
      showToast('Harap pilih salah satu Pengurus OSIM dari daftar di bawah.', 'error');
      return;
    }

    const cleanNip = cleanDigits(formData.nip);
    const canonicalRole = normalizeUserRole(formData.role) || formData.role;

    // Pembakuan Format UID Rapi dan Permanen (Bebas dari string acak / Date.now)
    let resolvedUid = '';
    let cleanUsername = formData.username.trim();

    if (accountSourceType === 'teacher') {
      if (!selectedTeacherForAccount) {
        showToast('Harap pilih salah satu Guru dari Grid Database Guru di bawah.', 'error');
        return;
      }
      resolvedUid = selectedTeacherForAccount.id.startsWith('user_')
        ? selectedTeacherForAccount.id
        : `user_${selectedTeacherForAccount.id}`;
      if (!cleanUsername) {
        cleanUsername = cleanNip && cleanNip.length >= 4
          ? `guru_${cleanNip}`
          : (selectedTeacherForAccount.code ? selectedTeacherForAccount.code.toLowerCase().replace(/[^a-z0-9]/g, '') : `guru_${selectedTeacherForAccount.id.replace(/^guru_/, '')}`);
      }
    } else if (accountSourceType === 'osim') {
      const cleanOsimNis = cleanNip || (selectedOsimMemberForAccount ? cleanDigits(selectedOsimMemberForAccount.studentNis) : '');
      const osimRefId = selectedOsimMemberForAccount ? selectedOsimMemberForAccount.id : '';
      resolvedUid = cleanOsimNis && cleanOsimNis.length >= 4
        ? `user_osim_${cleanOsimNis}`
        : (osimRefId ? `user_osim_${osimRefId}` : `user_${formData.email.split('@')[0]}`);
      if (!cleanUsername) {
        cleanUsername = cleanOsimNis && cleanOsimNis.length >= 4 ? `osim_${cleanOsimNis}` : formData.email.split('@')[0];
      }
    } else if (accountSourceType === 'student' && selectedStudentForAccount) {
      resolvedUid = selectedStudentForAccount.id.startsWith('user_')
        ? selectedStudentForAccount.id
        : `user_${selectedStudentForAccount.id}`;
      if (!cleanUsername) {
        cleanUsername = selectedStudentForAccount.nis ? `siswa_${selectedStudentForAccount.nis}` : `user_${selectedStudentForAccount.id}`;
      }
    } else {
      // Akun Petugas Sistem (Super Admin / Admin Kesiswaan / Waka Kesiswaan)
      if (canonicalRole === 'super_admin') {
        resolvedUid = 'user_super_admin';
        if (!cleanUsername) cleanUsername = 'superadmin';
      } else if (canonicalRole === 'admin_kesiswaan' || (canonicalRole as string) === 'admin') {
        resolvedUid = 'user_admin_kesiswaan';
        if (!cleanUsername) cleanUsername = 'adminkesiswaan';
      } else if (canonicalRole === 'waka_kesiswaan') {
        resolvedUid = 'user_waka_kesiswaan';
        if (!cleanUsername) cleanUsername = 'wakakesiswaan';
      } else {
        // Fallback akun sistem rapi
        const safeBase = formData.displayName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 15);
        resolvedUid = `user_${canonicalRole}_${safeBase}`;
        if (!cleanUsername) cleanUsername = safeBase;
      }
    }

    const selectedEkskuls = (canonicalRole === 'coach_ekstrakurikuler' || (formData.extracurricularIds && formData.extracurricularIds.length > 0))
      ? (formData.extracurricularIds || []).filter(id => id && !/^\d+$/.test(id.trim()))
      : [];

    const hasEkskulAssignment = selectedEkskuls.length > 0;
    const resolvedEkskulNames = hasEkskulAssignment
      ? selectedEkskuls
          .map(id => extracurriculars.find(e => (e.id && e.id === id) || (e.name && typeof e.name === 'string' && typeof id === 'string' && e.name.toLowerCase() === id.toLowerCase()))?.name)
          .filter((name): name is string => Boolean(name && !/^\d{1,2}$/.test(name.trim()) && !/^ekskul_[1-9]$/.test(name.trim())))
      : undefined;

    const newUser: UserProfile = {
      uid: resolvedUid,
      displayName: formData.displayName.trim(),
      nip: formData.nip.trim() || undefined,
      email: formData.email.trim(),
      username: cleanUsername,
      password: (formData.password || 'guru12345').trim(),
      role: canonicalRole,
      phone: formData.phone.trim() || undefined,
      counselorSpecialization: canonicalRole === 'guru_bk' ? formData.counselorSpecialization : undefined,
      assignedExtracurricularIds: hasEkskulAssignment ? selectedEkskuls : undefined,
      extracurricularIds: hasEkskulAssignment ? selectedEkskuls : undefined,
      extracurricularNames: resolvedEkskulNames,
      extracurricularName: resolvedEkskulNames ? resolvedEkskulNames.join(', ') : undefined,
      status: formData.status,
      isCashManager: formData.isCashManager,
      cashManagerTitle: formData.isCashManager ? (formData.cashManagerTitle.trim() || 'Bendahara') : undefined
    };

    setIsSubmittingAddUser(true);
    try {
      if (accountSourceType === 'teacher' && selectedTeacherForAccount) {
        const res = await activateTeacherAccount({
          teacherId: selectedTeacherForAccount.id,
          email: formData.email.trim(),
          username: cleanUsername,
          password: (formData.password || 'guru12345').trim(),
          fullName: formData.displayName.trim(),
          nip: formData.nip.trim() || undefined,
          role: canonicalRole,
          phone: formData.phone.trim() || undefined,
          extracurricularIds: selectedEkskuls,
          extracurricularNames: resolvedEkskulNames,
          counselorSpecialization: canonicalRole === 'guru_bk' ? formData.counselorSpecialization : undefined,
          isCashManager: formData.isCashManager,
          cashManagerTitle: formData.isCashManager ? (formData.cashManagerTitle.trim() || 'Bendahara') : undefined
        });

        if (res.success && res.user) {
          const activatedUser = res.user;
          setIsAddModalOpen(false);
          showToast(`Akun login untuk "${activatedUser.displayName}" berhasil diaktifkan dan terhubung ke Firebase Authentication!`);
          handlePrintAccountSlip(activatedUser);
          syncUserFromCPanel(activatedUser).catch(err => console.warn('Background sync note:', err));
        } else {
          showToast(res.error || 'Gagal mengaktifkan akun login.', 'error');
        }
        return;
      }

      if (accountSourceType === 'osim' || accountSourceType === 'student' || canonicalRole === 'anggota_osim' || canonicalRole === 'pengurus_osim') {
        const cleanStudentNis = formData.nip.trim() || selectedOsimMemberForAccount?.studentNis || selectedStudentForAccount?.nis || '';
        const matchedOsimMember = selectedOsimMemberForAccount || osimMembers.find(m =>
          (cleanStudentNis && !isPlaceholderNis(cleanStudentNis) && cleanDigits(m.studentNis) === cleanDigits(cleanStudentNis)) ||
          (selectedStudentForAccount && selectedStudentForAccount.nis && !isPlaceholderNis(selectedStudentForAccount.nis) && cleanDigits(m.studentNis) === cleanDigits(selectedStudentForAccount.nis)) ||
          (m.fullName.toLowerCase().trim() === formData.displayName.toLowerCase().trim())
        );

        const sekbidStr = selectedOsimMemberForAccount?.sekbid || matchedOsimMember?.sekbid || (formData as any).osimDepartmentName;
        const sekbidNum = extractSekbidNumber(sekbidStr) || extractSekbidNumber(selectedOsimMemberForAccount?.position || matchedOsimMember?.position);
        const targetMemberId = selectedOsimMemberForAccount?.id || matchedOsimMember?.id;
        const posText = (selectedOsimMemberForAccount?.position || matchedOsimMember?.position || '').toLowerCase();
        const bphRole = (sekbidStr === 'BPH' || (sekbidStr && sekbidStr.includes('BPH')) || !sekbidNum) ? (
          posText.includes('wakil') ? 'user_osim_wakil'
          : posText.includes('sekretaris') ? 'user_osim_sekretaris'
          : posText.includes('bendahara') ? 'user_osim_bendahara'
          : posText.includes('ketua') ? 'user_osim_ketua'
          : undefined
        ) : undefined;

        const targetUserUid = bphRole
          || (sekbidNum ? `user_osim_sekbid${sekbidNum}` : undefined)
          || (cleanStudentNis && cleanStudentNis.length >= 4 && !isPlaceholderNis(cleanStudentNis)
            ? `user_osim_${cleanStudentNis}`
            : (targetMemberId ? `user_osim_${targetMemberId}` : (resolvedUid || undefined)));

        const res = await activateOsimAccount({
          memberId: targetMemberId,
          uid: targetUserUid,
          email: formData.email.trim(),
          username: cleanUsername,
          password: (formData.password || 'osim12345').trim(),
          fullName: formData.displayName.trim(),
          studentNis: cleanStudentNis,
          className: selectedOsimMemberForAccount?.className || selectedStudentForAccount?.className || matchedOsimMember?.className,
          position: selectedOsimMemberForAccount?.position || matchedOsimMember?.position || 'Pengurus OSIM',
          sekbid: selectedOsimMemberForAccount?.sekbid || matchedOsimMember?.sekbid,
          phone: formData.phone.trim() || undefined,
          isCashManager: formData.isCashManager,
          cashManagerTitle: formData.isCashManager ? (formData.cashManagerTitle.trim() || 'Bendahara OSIM') : undefined
        });

        if (res.success && res.user) {
          const activatedUser = res.user;
          setIsAddModalOpen(false);
          showToast(`Akun login OSIM untuk "${activatedUser.displayName}" berhasil diaktifkan dan terhubung ke Firebase Authentication!`);
          handlePrintAccountSlip(activatedUser);
          syncUserFromCPanel(activatedUser).catch(err => console.warn('Background sync note:', err));
        } else {
          showToast(res.error || 'Gagal mengaktifkan akun login OSIM.', 'error');
        }
        return;
      }

      const res = await addUser(newUser);
      if (res.success) {
        setIsAddModalOpen(false);
        showToast(`Akun ${newUser.displayName} (${newUser.role}) berhasil disimpan dan data otomatis sinkron ke seluruh menu!`);
        handlePrintAccountSlip(newUser);
        syncUserFromCPanel(newUser).catch(err => console.warn('Background sync note:', err));
      } else {
        showToast(res.error || 'Gagal menambahkan akun.', 'error');
      }
    } catch (err: any) {
      console.error('Error in handleSaveAddUser:', err);
      showToast(err?.message || 'Terjadi kesalahan sistem saat menyimpan akun.', 'error');
    } finally {
      setIsSubmittingAddUser(false);
    }
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAction) return;

    const canonicalRole = normalizeUserRole(formData.role) || formData.role;
    const selectedEkskuls = (formData.extracurricularIds || []).filter(id => id && !/^\d+$/.test(id.trim()));
    const hasEkskulAssignment = selectedEkskuls.length > 0;
    const resolvedEkskulNames = hasEkskulAssignment
      ? selectedEkskuls
          .map(id => extracurriculars.find(e => (e.id && e.id === id) || (e.name && typeof e.name === 'string' && typeof id === 'string' && e.name.toLowerCase() === id.toLowerCase()))?.name)
          .filter((name): name is string => Boolean(name && !/^\d{1,2}$/.test(name.trim()) && !/^ekskul_[1-9]$/.test(name.trim())))
      : undefined;

    const updatedData: Partial<UserProfile> = {
      displayName: formData.displayName.trim(),
      nip: formData.nip.trim() || undefined,
      email: formData.email.trim(),
      username: formData.username.trim() || undefined,
      role: canonicalRole,
      phone: formData.phone.trim() || undefined,
      counselorSpecialization: canonicalRole === 'guru_bk' ? formData.counselorSpecialization : undefined,
      assignedExtracurricularIds: hasEkskulAssignment ? selectedEkskuls : undefined,
      extracurricularIds: hasEkskulAssignment ? selectedEkskuls : undefined,
      extracurricularNames: resolvedEkskulNames,
      extracurricularName: resolvedEkskulNames ? resolvedEkskulNames.join(', ') : undefined,
      status: formData.status,
      isCashManager: formData.isCashManager,
      cashManagerTitle: formData.isCashManager ? (formData.cashManagerTitle.trim() || 'Bendahara') : undefined
    };

    if (formData.password && formData.password.trim()) {
      updatedData.password = formData.password.trim();
    }

    setIsSubmittingEditUser(true);
    try {
      const res = await updateUser(selectedUserForAction.uid, updatedData);

      if (res.success) {
        const mergedUser: UserProfile = { ...selectedUserForAction, ...updatedData };
        setIsEditModalOpen(false);
        showToast(`Perubahan data akun ${formData.displayName} berhasil disimpan & disinkronkan ke seluruh menu terkait!`);
        syncUserFromCPanel(mergedUser, selectedUserForAction).catch(err => console.warn('Background sync note:', err));
      } else {
        showToast(res.error || 'Gagal memperbarui akun.', 'error');
      }
    } catch (err: any) {
      console.error('Error in handleSaveEditUser:', err);
      showToast(err?.message || 'Terjadi kesalahan sistem saat memperbarui akun.', 'error');
    } finally {
      setIsSubmittingEditUser(false);
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
    const check = canResetUserPassword(currentUser, u);
    if (!check.allowed) {
      showToast(check.reason || 'Anda tidak memiliki wewenang untuk mereset kata sandi akun ini.', 'error');
      return;
    }
    setSelectedUserForAction(u);
    setCustomResetPassword('guru12345');
    setShowResetPasswordText(false);
    setIsResetModalOpen(true);
  };

  const handleConfirmResetPassword = async () => {
    if (!selectedUserForAction) return;
    const u = selectedUserForAction;
    const check = canResetUserPassword(currentUser, u);
    if (!check.allowed) {
      showToast(check.reason || 'Anda tidak memiliki wewenang untuk mereset kata sandi akun ini.', 'error');
      setIsResetModalOpen(false);
      return;
    }
    const newPass = customResetPassword.trim();
    setIsSubmittingResetPassword(true);
    try {
      if (newPass) {
        const res = await resetUserPassword(u.uid, newPass);
        if (res.success) {
          showToast(`Kata sandi akun ${u.displayName} berhasil diubah menjadi "${newPass}" dan disinkronkan ke Firebase Auth & profil!`);
          setIsResetModalOpen(false);
        } else {
          showToast(res.error || 'Gagal mengubah kata sandi.', 'error');
        }
      } else {
        const res = await resetUserPassword(u.uid);
        if (res.success) {
          showToast(`Instruksi pemulihan kata sandi Firebase Auth berhasil dikirimkan ke email ${u.displayName} (${u.email || '-'})!`);
          setIsResetModalOpen(false);
        } else {
          showToast(res.error || 'Gagal mengirim instruksi reset kata sandi Firebase Auth.', 'error');
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Terjadi kesalahan saat mereset kata sandi.', 'error');
    } finally {
      setIsSubmittingResetPassword(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!selectedUserForAction) return;
    const u = selectedUserForAction;
    const res = await resetUserPassword(u.uid);
    if (res.success) {
      showToast(`Instruksi pemulihan kata sandi Firebase Auth berhasil dikirimkan ke email ${u.displayName} (${u.email || '-'})!`);
      setIsResetModalOpen(false);
    } else {
      showToast(res.error || 'Gagal mengirim instruksi reset kata sandi Firebase Auth.', 'error');
    }
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
            <div class="info-row">
              <span class="info-label">Kata Sandi Awal:</span>
              <span class="info-val" style="color: #b45309; font-size: 12px;">${cred.password || 'osim12345'}</span>
            </div>
            <div class="highlight" style="${(cred.role === 'anggota_osim' || cred.role === 'pengurus_osim') ? 'background: #fffbeb; border-color: #fde68a;' : ''}">
              <div style="font-size: 10px; color: ${(cred.role === 'anggota_osim' || cred.role === 'pengurus_osim') ? '#92400e' : '#065f46'}; font-weight: bold;">
                ${(cred.role === 'anggota_osim' || cred.role === 'pengurus_osim') ? 'KETENTUAN PENGURUS OSIM:' : 'METODE AUTENTIKASI:'}
              </div>
              <div style="font-size: 11px; font-family: monospace; margin-top: 2px; color: ${(cred.role === 'anggota_osim' || cred.role === 'pengurus_osim') ? '#78350f' : '#065f46'};">
                ${(cred.role === 'anggota_osim' || cred.role === 'pengurus_osim') ? 'Halaman profil hanya dapat mengubah nomor WhatsApp. Nama, NIS & Password dikelola terpusat oleh Admin.' : 'Firebase Authentication (Cloud Identity)'}
              </div>
            </div>
            <div class="footer">
              Tahun Ajaran: ${activeAcademicYear || '2026/2027'} • Autentikasi aman melalui Google Firebase Authentication.
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
          <span style="font-size: 10px; color: #065f46; font-weight: bold;">AUTENTIKASI:</span>
          <span style="font-size: 11px; font-family: monospace; font-weight: bold; color: #065f46;"> Firebase Auth</span>
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
          <div style="font-size: 10px; color: #065f46; font-weight: bold;">AUTENTIKASI AKUN:</div>
          <div style="font-size: 11px; font-family: monospace; font-weight: bold; color: #047857;">
            Firebase Authentication (Cloud)
          </div>
        </div>
        <div class="footer">
          Tahun Ajaran: ${activeAcademicYear || '2026/2027'} • Autentikasi aman melalui Google Firebase Authentication.
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
      if (u.role === 'wali_kelas' || (u.role as string) === 'homeroom_teacher') {
        return { label: 'WALI KELAS', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      }
      if (u.role === 'guru' || (u.role as string) === 'teacher' || (u.role as string) === 'guru_mapel') {
        return { label: 'GURU MAPEL', color: 'bg-teal-500/10 text-teal-400 border-teal-500/30' };
      }
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
      case 'coach_ekstrakurikuler':
      case 'pembina_ekskul':
      case 'pembina':
        return { label: '5. PEMBINA EKSKUL', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'wali_kelas':
      case 'homeroom_teacher' as any:
        return { label: 'WALI KELAS', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'guru':
      case 'teacher' as any:
      case 'guru_mapel' as any:
        return { label: 'GURU MAPEL', color: 'bg-teal-500/10 text-teal-400 border-teal-500/30' };
      case 'anggota_osim':
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
          if (u.role !== 'super_admin' && u.role !== 'waka_kesiswaan' && (u.role as string) !== 'waka') return false;
        } else if (rolePillFilter === 'bph_osim') {
          const h = getUserHierarchyClassification(u);
          if (h.rank !== 6) return false;
        } else if (rolePillFilter === 'sekbid_osim') {
          const h = getUserHierarchyClassification(u);
          if (h.rank !== 7) return false;
        } else if (rolePillFilter === 'coach_ekstrakurikuler' || rolePillFilter === 'pembina_ekskul') {
          if (
            u.role !== 'coach_ekstrakurikuler' &&
            u.role !== 'pembina_ekskul' &&
            u.role !== 'pembina' &&
            (u.role as string) !== 'pembina_ekstrakurikuler'
          ) return false;
        } else if (rolePillFilter === 'wali_kelas') {
          if (u.role !== 'wali_kelas' && (u.role as string) !== 'homeroom_teacher') return false;
        } else if (rolePillFilter === 'guru' || rolePillFilter === 'guru_mapel') {
          if (u.role !== 'guru' && (u.role as string) !== 'teacher' && (u.role as string) !== 'guru_mapel') return false;
        } else if (rolePillFilter === 'anggota_osim' || rolePillFilter === 'pengurus_osim') {
          if (u.role !== 'anggota_osim' && u.role !== 'pengurus_osim') return false;
        } else if (u.role !== rolePillFilter) {
          return false;
        }
      }

      // Dropdown Filter
      if (roleFilter !== 'all') {
        if (roleFilter === 'coach_ekstrakurikuler' || roleFilter === 'pembina_ekskul') {
          if (
            u.role !== 'coach_ekstrakurikuler' &&
            u.role !== 'pembina_ekskul' &&
            u.role !== 'pembina' &&
            (u.role as string) !== 'pembina_ekstrakurikuler'
          ) return false;
        } else if (roleFilter === 'anggota_osim' || roleFilter === 'pengurus_osim') {
          if (u.role !== 'anggota_osim' && u.role !== 'pengurus_osim') return false;
        } else if (roleFilter === 'wali_kelas') {
          if (u.role !== 'wali_kelas' && (u.role as string) !== 'homeroom_teacher') return false;
        } else if (roleFilter === 'guru' || roleFilter === 'guru_mapel') {
          if (u.role !== 'guru' && (u.role as string) !== 'teacher' && (u.role as string) !== 'guru_mapel') return false;
        } else if (u.role !== roleFilter) {
          return false;
        }
      }

      // Search
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        (u.displayName && typeof u.displayName === 'string' && u.displayName.toLowerCase().includes(q)) ||
        (u.email && typeof u.email === 'string' && u.email.toLowerCase().includes(q)) ||
        (u.nip && typeof u.nip === 'string' && u.nip.includes(q)) ||
        (u.username && typeof u.username === 'string' && u.username.toLowerCase().includes(q)) ||
        (u.phone && typeof u.phone === 'string' && u.phone.includes(q)) ||
        (u.osimPosition && typeof u.osimPosition === 'string' && u.osimPosition.toLowerCase().includes(q)) ||
        (u.osimDepartmentName && typeof u.osimDepartmentName === 'string' && u.osimDepartmentName.toLowerCase().includes(q)) ||
        (u.extracurricularName && typeof u.extracurricularName === 'string' && u.extracurricularName.toLowerCase().includes(q)) ||
        (Array.isArray(u.extracurricularNames) && u.extracurricularNames.some(en => typeof en === 'string' && en.toLowerCase().includes(q))) ||
        (Array.isArray(u.extracurricularIds) && u.extracurricularIds.some(eid => {
          if (!eid || typeof eid !== 'string') return false;
          const ek = extracurriculars.find(e => (e.id && e.id === eid) || (e.name && typeof e.name === 'string' && e.name.toLowerCase() === eid.toLowerCase()));
          return !!(ek && ek.name && typeof ek.name === 'string' && ek.name.toLowerCase().includes(q));
        }))
      );
    });

    return sortUsersByHierarchy(rawFiltered);
  }, [allUsers, roleFilter, rolePillFilter, searchTerm]);

  const roleCounts = useMemo(() => {
    return {
      all: allUsers.length,
      super_admin: allUsers.filter(u => u.role === 'super_admin').length,
      waka_kesiswaan: allUsers.filter(u => u.role === 'waka_kesiswaan' || (u.role as string) === 'waka').length,
      guru_bk: allUsers.filter(u => u.role === 'guru_bk').length,
      pembina_osim: allUsers.filter(u => u.role === 'pembina_osim').length,
      pembina_ekskul: allUsers.filter(
        u => u.role === 'coach_ekstrakurikuler' || u.role === 'pembina_ekskul' || u.role === 'pembina' || (u.role as string) === 'pembina_ekstrakurikuler'
      ).length,
      bph_osim: allUsers.filter(u => getUserHierarchyClassification(u).rank === 6).length,
      sekbid_osim: allUsers.filter(u => getUserHierarchyClassification(u).rank === 7).length,
      pengurus_osim: allUsers.filter(u => u.role === 'anggota_osim' || u.role === 'pengurus_osim').length,
      wali_kelas: allUsers.filter(u => u.role === 'wali_kelas' || (u.role as string) === 'homeroom_teacher').length,
      guru: allUsers.filter(u => u.role === 'guru' || (u.role as string) === 'teacher' || (u.role as string) === 'guru_mapel').length,
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
            onClick={handleMigrateTidyUids}
            disabled={isSyncingAll}
            className="px-3 py-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-xs font-bold text-amber-300 flex items-center space-x-2 transition-colors disabled:opacity-50"
            title="Rapikan ID dokumen acak (seperti CdAcdt...) di Firestore Console menjadi ID rapi (user_super_admin, user_guru_xx, dll.)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Rapikan ID Firestore</span>
          </button>
          <button
            onClick={() => handleOpenPrintModal('all')}
            className="px-3 py-2 rounded-lg bg-[#222226] hover:bg-[#2b2b30] border border-[#37373f] text-xs font-semibold text-zinc-100 flex items-center space-x-2 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-300" />
            <span>Cetak Semua Slip Akun</span>
          </button>
          <button
            onClick={() => handleOpenActivateModal()}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center space-x-2 transition-colors shadow-lg shadow-emerald-950/40"
            title="Aktivasi Akun Login Guru & Pembina (Hubungkan ke Firebase Authentication)"
          >
            <Key className="w-4 h-4 text-emerald-200" />
            <span>Aktivasi Akun Login</span>
            {pendingTeachers.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-zinc-950 shadow-sm animate-pulse">
                {pendingTeachers.length} Belum Aktif
              </span>
            )}
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
        <button
          onClick={() => setActiveSubTab('tahap5')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'tahap5'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-zinc-300 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4 text-amber-400" />
          <span>Tahap 5: 4 Skenario Uji</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
            TAHAP 5
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('fase7')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'fase7'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-zinc-300 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>Fase 7: Schema Shield</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-300 font-mono font-bold border border-rose-500/30">
            FASE 7
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('fase8')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'fase8'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-300 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4 text-emerald-400" />
          <span>Fase 8: Kesiapan Produksi</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
            FINAL
          </span>
        </button>
      </div>

      {/* TAB 1: USERS MANAGEMENT */}
      {activeSubTab === 'users' && (
        <CPanelUserTab
          handleOpenActivateModal={handleOpenActivateModal}
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
          loginWithUser={loginWithUser}
          loginWithDemoRole={loginWithDemoRole}
          isSuperAdmin={isSuperAdmin}
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
            showToast(`Uji peran (${role}) diverifikasi langsung melalui Firebase Authentication resmi.`, 'success');
          }}
        />
      )}

      {/* TAB 3: SYNC & SERVER / TAHAP 5 / FASE 7 / FASE 8 */}
      {(activeSubTab === 'sync' || activeSubTab === 'tahap5' || activeSubTab === 'fase7' || activeSubTab === 'fase8') && (
        <CPanelBackupRestoreTab
          initialSection={activeSubTab === 'fase8' ? 'fase8' : activeSubTab === 'fase7' ? 'fase7' : activeSubTab === 'tahap5' ? 'tahap5' : 'all'}
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
          checkDatabaseRelationalHealth={checkDatabaseRelationalHealth}
          runFullDatabaseHarmonization={runFullDatabaseHarmonization}
          autoHealOrphanRecords={autoHealOrphanRecords}
          createDisasterRecoverySnapshot={createDisasterRecoverySnapshot}
          restoreFromDisasterSnapshot={restoreFromDisasterSnapshot}
          getDisasterRecoverySnapshots={getDisasterRecoverySnapshots}
          deleteDisasterRecoverySnapshot={deleteDisasterRecoverySnapshot}
          verifyCloudDataIntegrity={verifyCloudDataIntegrity}
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

      {/* MODAL: ADD / ACTIVATE USER (SATU PINTU: INPUT GURU DI MENU GURU & PEMBINA, AKTIVASI DI CPANEL) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Aktivasi Akun Login Pengguna (CPanel SIM-KESISWAAN)"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSaveAddUser} className="space-y-4 text-xs">
          {/* Source Picker Tabs: Guru, Pengurus OSIM, Siswa Umum, or Manual */}
          <div className="bg-[#18181d] border border-[#27272a] rounded-xl p-1.5 flex flex-wrap sm:flex-nowrap items-center gap-1">
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
              <span>1. Guru & Pembina {pendingTeachers.length > 0 ? `(${pendingTeachers.length} Belum Aktif)` : `(${teachers.length})`}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAccountSourceType('osim');
                handleApplyRolePreset('pengurus_osim');
              }}
              className={`flex-1 py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                accountSourceType === 'osim'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#202026]'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>2. Pengurus OSIM {pendingOsimMembers.length > 0 ? `(${pendingOsimMembers.length} Belum Aktif)` : `(${osimMembers.length})`}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAccountSourceType('student');
                handleApplyRolePreset('pengurus_osim');
              }}
              className={`flex-1 py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                accountSourceType === 'student'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#202026]'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>3. Siswa Umum ({students.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAccountSourceType('manual');
                handleApplyRolePreset('super_admin');
              }}
              className={`flex-1 py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                accountSourceType === 'manual'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#202026]'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>4. Akun Sistem</span>
            </button>
          </div>

          {accountSourceType === 'manual' && (
            <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl text-amber-200 text-xs">
              <span className="font-bold">Prinsip Arsitektur 1-Arah:</span> Tab ini khusus untuk akun administratif sistem (Super Admin / Admin Kesiswaan / Waka Kesiswaan). Untuk seluruh akun Guru, BK, Wali Kelas, dan Pembina Ekskul, profil diinput melalui menu <strong className="text-emerald-300">Guru & Pembina</strong>, dan CPanel bertugas mengaktifkan akun loginnya.
            </div>
          )}

          {/* GRID SELECTION FOR TEACHERS OR DIRECT NEW TEACHER INPUT */}
          {accountSourceType === 'teacher' && (
            <div className="bg-[#141417] border border-[#27272a] rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  Pilih Guru untuk Diaktifkan Akun Loginnya (Satu Pintu: Menu Guru & Pembina)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {selectedTeacherForAccount ? '1 Guru Terpilih' : `${filteredTeachersForAdd.length} Guru Tersedia`}
                  </span>
                </div>
              </div>

              {pendingTeachers.length > 0 && !selectedTeacherForAccount && (
                <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-xs font-bold text-amber-300">
                      Terdapat {pendingTeachers.length} data guru yang baru diinput di Menu Guru & Pembina dan menunggu aktivasi akun login.
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium">Pilih guru di bawah</span>
                </div>
              )}

              {teachers.length === 0 ? (
                <div className="p-4 bg-emerald-950/20 border border-emerald-600/40 rounded-xl space-y-2 text-center">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mx-auto">
                    <Users className="w-5 h-5" />
                  </div>
                  <h5 className="text-xs font-bold text-emerald-300">Belum Ada Data di Master Guru & Pembina</h5>
                  <p className="text-[11px] text-zinc-300 max-w-md mx-auto leading-relaxed">
                    Sesuai prinsip <strong>Satu Pintu & Satu Arah</strong>, data pokok guru diinput melalui menu <strong>Guru & Pembina</strong>. Setelah guru didaftarkan di sana, namanya akan langsung tersinkronisasi otomatis ke CPanel ini untuk dibuatkan akun login.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      window.location.hash = '#teachers';
                    }}
                    className="mt-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition inline-flex items-center gap-2 shadow-md"
                  >
                    <Users className="w-4 h-4" />
                    <span>Buka Menu Guru & Pembina</span>
                  </button>
                </div>
              ) : selectedTeacherForAccount && !isChangingTeacherForAccount ? (
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
                    {filteredTeachersForAdd.length === 0 ? (
                      <div className="col-span-full p-4 text-center text-zinc-400 space-y-2">
                        <Users className="w-7 h-7 mx-auto text-zinc-600" />
                        <p className="text-xs text-zinc-400">Tidak ada guru yang cocok dengan pencarian.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddModalOpen(false);
                            window.location.hash = '#teachers';
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition inline-flex items-center gap-1.5"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Input Guru Baru di Menu Guru & Pembina</span>
                        </button>
                      </div>
                    ) : (
                      filteredTeachersForAdd.map(t => {
                        const isSelected = selectedTeacherForAccount?.id === t.id;
                        const initials = getTeacherInitials(t.fullName || t.name || '');
                        const existingUser = allUsers.find(u =>
                          (u.nip && t.nip && u.nip !== '-' && t.nip !== '-' && cleanDigits(u.nip) === cleanDigits(t.nip) && cleanDigits(u.nip).length >= 4) ||
                          (u.displayName && t.fullName && u.displayName.toLowerCase().trim() === t.fullName.toLowerCase().trim()) ||
                          u.uid === `user_${t.id}` ||
                          u.uid === t.id
                        );
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
                              {existingUser ? (
                                <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span>Sudah Ada Akun (@{existingUser.username || existingUser.email.split('@')[0]})</span>
                                </span>
                              ) : (
                                <span className="text-[9px] text-cyan-400 font-medium mt-0.5 block">
                                  + Klik untuk buatkan akun
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GRID SELECTION FOR OSIM MEMBERS (SATU PINTU: MENU PENGURUS & PROKER OSIM) */}
          {accountSourceType === 'osim' && (
            <div className="bg-[#141417] border border-[#27272a] rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  Pilih Pengurus OSIM untuk Diaktifkan Akun Loginnya (Satu Pintu: Menu OSIM)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {selectedOsimMemberForAccount ? '1 Pengurus Terpilih' : `${filteredOsimMembersForAdd.length} Pengurus Tersedia`}
                  </span>
                </div>
              </div>

              {pendingOsimMembers.length > 0 && !selectedOsimMemberForAccount && (
                <div className="p-3 bg-cyan-500/15 border border-cyan-500/40 rounded-xl flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-xs font-bold text-cyan-300">
                      Terdapat {pendingOsimMembers.length} data pengurus OSIM (BPH & Ketua Sekbid) yang baru diinput di Menu OSIM dan menunggu aktivasi akun login.
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium">Pilih pengurus di bawah</span>
                </div>
              )}

              {osimMembers.length === 0 ? (
                <div className="p-4 bg-cyan-950/20 border border-cyan-600/40 rounded-xl space-y-2 text-center">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center mx-auto">
                    <Award className="w-5 h-5" />
                  </div>
                  <h5 className="text-xs font-bold text-cyan-300">Belum Ada Data di Pengurus & Proker OSIM</h5>
                  <p className="text-[11px] text-zinc-300 max-w-md mx-auto leading-relaxed">
                    Sesuai prinsip <strong>Satu Pintu & Satu Arah</strong>, profil pengurus OSIM (BPH & Ketua Sekbid) diinput melalui menu <strong>Pengurus & Proker OSIM</strong>. Data otomatis tersinkronisasi ke CPanel ini untuk diaktifkan akun loginnya.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      window.location.hash = '#osim';
                    }}
                    className="mt-1 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition inline-flex items-center gap-2 shadow-md"
                  >
                    <Award className="w-4 h-4" />
                    <span>Buka Menu Pengurus & Proker OSIM</span>
                  </button>
                </div>
              ) : selectedOsimMemberForAccount && !isChangingOsimMemberForAccount ? (
                /* Card Pengurus OSIM Terpilih */
                <div className="bg-cyan-950/30 border border-cyan-500/50 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-800 text-white font-black text-sm font-mono flex items-center justify-center shrink-0 border border-cyan-400/40 shadow-xs">
                      {selectedOsimMemberForAccount.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3 text-cyan-400" />
                          Pengurus OSIM Terpilih
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-300 bg-zinc-800 border border-zinc-700">
                          {selectedOsimMemberForAccount.position}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/60">
                          {selectedOsimMemberForAccount.sekbid}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white mt-1 truncate">{selectedOsimMemberForAccount.fullName}</h4>
                      <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        NIS: {selectedOsimMemberForAccount.studentNis || '-'} • Email: {selectedOsimMemberForAccount.email || '-'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsChangingOsimMemberForAccount(true)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 shrink-0 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                    Ganti Pengurus Lain
                  </button>
                </div>
              ) : (
                /* Search and OSIM Member Cards Grid */
                <div className="space-y-2.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Cari nama pengurus OSIM, jabatan, sekbid, atau email..."
                      value={addOsimMemberSearchTerm}
                      onChange={e => setAddOsimMemberSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-8 py-1.5 bg-[#1c1c20] border border-[#323238] rounded-lg text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-cyan-500"
                    />
                    {addOsimMemberSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setAddOsimMemberSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-52 overflow-y-auto p-1 bg-[#101013] rounded-xl border border-[#222226]">
                    {filteredOsimMembersForAdd.length === 0 ? (
                      <div className="col-span-full p-4 text-center text-zinc-400 space-y-2">
                        <Award className="w-7 h-7 mx-auto text-zinc-600" />
                        <p className="text-xs text-zinc-400">Tidak ada pengurus OSIM yang cocok dengan pencarian.</p>
                      </div>
                    ) : (
                      filteredOsimMembersForAdd.map(m => {
                        const isSelected = selectedOsimMemberForAccount?.id === m.id;
                        const cleanNis = cleanDigits(m.studentNis);
                        const existingUser = allUsers.find(u =>
                          u.uid === m.id ||
                          u.uid === `user_osim_${cleanNis}` ||
                          (m.email && u.email && u.email.trim().toLowerCase() === m.email.trim().toLowerCase()) ||
                          (cleanNis && cleanDigits(u.nip) === cleanNis) ||
                          isOsimMemberUserMatch(u, m)
                        );
                        const isAlreadyActive = (existingUser && existingUser.isLoginActive !== false && existingUser.loginStatus !== 'pending_activation') || m.isLoginActive === true || m.accountStatus === 'active';

                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleSelectOsimMemberForAccount(m)}
                            className={`p-2.5 rounded-lg text-left transition flex items-start gap-2.5 border ${
                              isSelected
                                ? 'bg-cyan-950/40 border-cyan-500 text-white ring-1 ring-cyan-500'
                                : 'bg-[#18181c] hover:bg-[#202026] border-[#292930] text-zinc-200'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-cyan-300 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                              {m.fullName.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="font-bold text-xs truncate text-white">{m.fullName}</h5>
                              <p className="text-[10px] text-cyan-400 font-medium truncate">{m.position} • {m.sekbid}</p>
                              <p className="text-[9px] text-zinc-400 font-mono truncate">Email: {m.email || '-'}</p>
                              {isAlreadyActive ? (
                                <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span>Akun Aktif</span>
                                </span>
                              ) : (
                                <span className="text-[9px] text-amber-400 font-medium mt-0.5 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                  <span>+ Klik untuk aktifkan</span>
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
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

          {/* KATA SANDI AWAL PENGGUNA (SOLUSI A: TERKELOLA LANGSUNG DI APP) */}
          <div className="bg-[#18181d] border border-emerald-500/30 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <label className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                <span>Kata Sandi Akun (Password Login) *</span>
              </label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, password: 'guru' + Math.floor(1000 + Math.random() * 9000) })}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline"
              >
                Hasilkan Sandi Acak
              </button>
            </div>
            <div className="relative">
              <input
                type={showPasswordInModal ? "text" : "password"}
                required
                value={formData.password || ''}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="Contoh: guru12345"
                className="w-full px-3 py-2 pr-10 rounded-lg bg-[#1c1c20] border border-[#323238] text-white font-mono focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPasswordInModal(!showPasswordInModal)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                {showPasswordInModal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Kata sandi akan otomatis disinkronkan ke <strong>Firebase Authentication</strong> dan profil database. Guru dapat langsung login menggunakan email/username dan sandi ini.
            </p>
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

          {(formData.role === 'coach_ekstrakurikuler' || formData.role === 'pembina_ekskul' || formData.role === 'wali_kelas' || formData.role === 'guru' || formData.role === 'guru_bk') && (
            <div className="bg-[#18181d] border border-emerald-500/30 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-emerald-300 font-bold">
                  {formData.role === 'coach_ekstrakurikuler' || formData.role === 'pembina_ekskul' ? 'Ekstrakurikuler Binaan Utama *' : 'Rangkap Tugas: Binaan Ekstrakurikuler (Opsional)'}
                </label>
                <span className="text-[10px] text-zinc-400">Maks. 1 Unit Binaan</span>
              </div>
              <p className="text-[10px] text-zinc-400 italic">
                {formData.role === 'coach_ekstrakurikuler' || formData.role === 'pembina_ekskul'
                  ? 'Pilih 1 unit ekstrakurikuler binaan utama untuk guru pembina ini.'
                  : 'Centang jika guru/wali kelas ini merangkap tugas sebagai pembina salah satu cabang ekskul.'}
              </p>
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
                          const next = ev.target.checked ? [e.id] : [];
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
              disabled={isSubmittingAddUser}
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-2 rounded-lg bg-[#222226] text-zinc-300 hover:text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmittingAddUser}
              className={`px-5 py-2 rounded-lg font-bold transition-all duration-200 shadow-lg flex items-center gap-2 ${
                isSubmittingAddUser
                  ? 'bg-emerald-600/70 text-emerald-100 opacity-60 cursor-wait shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 active:scale-[0.98]'
              }`}
            >
              {isSubmittingAddUser ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>
                    {accountSourceType === 'teacher' || accountSourceType === 'osim' || accountSourceType === 'student'
                      ? 'Mengaktifkan Akun...'
                      : 'Menyimpan Akun...'}
                  </span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{accountSourceType === 'teacher' || accountSourceType === 'osim' || accountSourceType === 'student' ? 'Konfirmasi & Aktifkan Akun Login' : 'Simpan & Buat Akun'}</span>
                </>
              )}
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
                <option value="wali_kelas">Wali Kelas</option>
                <option value="guru">Guru Mata Pelajaran</option>
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

          {/* UBAH KATA SANDI (SOLUSI A: TERKELOLA LANGSUNG DI APP) */}
          <div className="bg-[#18181d] border border-blue-500/30 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <label className="text-blue-400 font-bold flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                <span>Ubah Kata Sandi Baru (Opsional)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, password: 'guru12345' })}
                  className="text-[11px] text-zinc-400 hover:text-blue-300 underline"
                >
                  Sandi 'guru12345'
                </button>
                <span className="text-zinc-600">•</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, password: 'guru' + Math.floor(1000 + Math.random() * 9000) })}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold underline"
                >
                  Acak
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                type={showPasswordInModal ? "text" : "password"}
                value={formData.password || ''}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="Kosongkan jika tidak ingin mengubah kata sandi lama"
                className="w-full px-3 py-2 pr-10 rounded-lg bg-[#1c1c20] border border-[#323238] text-white font-mono focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPasswordInModal(!showPasswordInModal)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                {showPasswordInModal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Jika diisi, kata sandi baru otomatis disinkronkan ke <strong>Firebase Auth</strong> & Firestore tanpa perlu membuka konsol database manual.
            </p>
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

          {(formData.role === 'coach_ekstrakurikuler' || formData.role === 'pembina_ekskul' || formData.role === 'wali_kelas' || formData.role === 'guru' || formData.role === 'guru_bk') && (
            <div className="bg-[#18181d] border border-emerald-500/30 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-emerald-300 font-bold">
                  {formData.role === 'coach_ekstrakurikuler' || formData.role === 'pembina_ekskul' ? 'Ekstrakurikuler Binaan Utama *' : 'Rangkap Tugas: Binaan Ekstrakurikuler (Opsional)'}
                </label>
                <span className="text-[10px] text-zinc-400">Maks. 1 Unit Binaan</span>
              </div>
              <p className="text-[10px] text-zinc-400 italic">
                {formData.role === 'coach_ekstrakurikuler' || formData.role === 'pembina_ekskul'
                  ? 'Pilih 1 unit ekstrakurikuler binaan utama untuk guru pembina ini.'
                  : 'Centang jika guru/wali kelas ini merangkap tugas sebagai pembina salah satu cabang ekskul.'}
              </p>
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
                          const next = ev.target.checked ? [e.id] : [];
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
              disabled={isSubmittingEditUser}
              onClick={() => setIsEditModalOpen(false)}
              className="px-3.5 py-2 rounded-lg bg-[#222226] text-zinc-300 hover:text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmittingEditUser}
              className={`px-5 py-2 rounded-lg font-bold transition-all duration-200 shadow-lg flex items-center gap-2 ${
                isSubmittingEditUser
                  ? 'bg-blue-600/70 text-blue-100 opacity-60 cursor-wait shadow-none'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950/40 active:scale-[0.98]'
              }`}
            >
              {isSubmittingEditUser ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Menyimpan Perubahan...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
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
                : allUsers.filter(u => u && u.role === printFilterRole)
              )
              .filter(Boolean)
              .slice(0, 6).map((u, pIdx) => {
                const cred = getUserSlipCredentials(u, osimMembers);
                const badge = getRoleBadge(u);
                return (
                  <div
                    key={u?.uid ? `slip-preview-${u.uid}-${pIdx}` : `slip-preview-idx-${pIdx}`}
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
                        <span className="text-[10px] text-zinc-500 block">AUTENTIKASI:</span>
                        <strong className="text-emerald-700 text-[11px]">
                          Firebase Auth
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
              {(() => {
                const userEkskuls: { id: string; name: string }[] = [];
                const seen = new Set<string>();
                const rawItems = (selectedUserForAction.extracurricularIds && selectedUserForAction.extracurricularIds.length > 0)
                  ? selectedUserForAction.extracurricularIds
                  : (selectedUserForAction.extracurricularNames || (selectedUserForAction.extracurricularName ? selectedUserForAction.extracurricularName.split(',') : []));

                rawItems.forEach((item, idx) => {
                  if (!item || typeof item !== 'string') return;
                  const ek = extracurriculars.find(e => (e.id && e.id === item) || (e.name && typeof e.name === 'string' && e.name.toLowerCase() === item.toLowerCase()));
                  const ekName = ek?.name || 
                    selectedUserForAction.extracurricularNames?.[idx] || 
                    (selectedUserForAction.extracurricularName && !selectedUserForAction.extracurricularName.startsWith('ekskul_') ? selectedUserForAction.extracurricularName : null) ||
                    (item.startsWith('ekskul_') ? item.replace(/^ekskul_/, '').replace(/[_-]/g, ' ') : item);
                  if (ekName) {
                    const clean = ekName.trim();
                    const norm = clean.toLowerCase();
                    if (!seen.has(norm) && !norm.includes('admin') && norm !== 'ekskul_admin_super' && norm !== 'ekskul_osim_mpk' && norm !== 'pembina osim' && norm !== 'pembina_osim') {
                      seen.add(norm);
                      userEkskuls.push({ id: ek?.id || item, name: clean });
                    }
                  }
                });

                if (userEkskuls.length === 0) return null;

                return (
                  <div className="py-1">
                    <span className="text-emerald-300 font-bold block mb-1">EKSKUL BINAAN:</span>
                    <div className="flex flex-wrap gap-1">
                      {userEkskuls.map((ekItem, idx) => (
                        <span key={`cpanel-user-ek-${ekItem.id}-${idx}`} className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-sans font-semibold">
                          {ekItem.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
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
                  <span>@{selectedUserForAction.username || (selectedUserForAction.email && selectedUserForAction.email.includes('@') ? selectedUserForAction.email.split('@')[0] : selectedUserForAction.uid || 'user')}</span>
                  <span>•</span>
                  <span className="text-amber-400 uppercase font-semibold">{selectedUserForAction.role}</span>
                </div>
              </div>
            </div>

            {(selectedUserForAction.role === 'pembina_ekstrakurikuler' || selectedUserForAction.role === 'pembina_ekskul' || selectedUserForAction.role === 'pembina_ekstra' || selectedUserForAction.role === 'pembina') && (
              <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-sky-400 mt-0.5" />
                <div>
                  <p className="font-bold">Akun Pembina Ekstrakurikuler Terkelola Terpusat</p>
                  <p className="text-zinc-300 mt-0.5 leading-relaxed">
                    Akun ini dikunci dari pergantian sandi mandiri di halaman profil pengguna. Seluruh pembaruan kredensial dilakukan eksklusif oleh Super Admin melalui cPanel ini.
                  </p>
                </div>
              </div>
            )}

            {/* SOLUSI A: SETEL KATA SANDI BARU SECARA LANGSUNG DARI APP */}
            <div className="p-3.5 rounded-xl bg-[#18181d] border border-amber-500/30 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Key className="w-4 h-4 shrink-0" />
                  <span>Setel Kata Sandi Baru Langsung</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomResetPassword('guru12345')}
                    className="text-[11px] text-zinc-400 hover:text-amber-300 underline"
                  >
                    guru12345
                  </button>
                  <span className="text-zinc-600">•</span>
                  <button
                    type="button"
                    onClick={() => setCustomResetPassword('guru' + Math.floor(1000 + Math.random() * 9000))}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline"
                  >
                    Acak
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type={showResetPasswordText ? "text" : "password"}
                  value={customResetPassword}
                  onChange={e => setCustomResetPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru..."
                  className="w-full px-3 py-2 pr-10 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPasswordText(!showResetPasswordText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showResetPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const identifier = selectedUserForAction.username || selectedUserForAction.email;
                    const text = `Akun SIM Kesiswaan:\nNama: ${selectedUserForAction.displayName}\nUsername/Email: ${identifier}\nKata Sandi: ${customResetPassword}`;
                    navigator.clipboard.writeText(text);
                    showToast('Kredensial login berhasil disalin ke clipboard!');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold flex items-center gap-1.5 border border-zinc-700"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Salin Kredensial</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmittingResetPassword}
                  onClick={handleConfirmResetPassword}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-all duration-200 ${
                    isSubmittingResetPassword
                      ? 'bg-amber-600/70 text-amber-100 opacity-60 cursor-wait shadow-none'
                      : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40 active:scale-[0.98]'
                  }`}
                >
                  {isSubmittingResetPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Menyimpan Sandi...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Terapkan Sandi Baru</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-zinc-400 text-[11px] leading-relaxed pt-1 border-t border-zinc-800/80">
                Sandi akan tersimpan di profil dan disinkronkan ke <strong>Firebase Auth</strong>. Guru dapat langsung menggunakannya untuk login.
              </p>
            </div>

            {/* OPSI CADANGAN: KIRIM EMAIL RESET */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-[11px] font-medium">Opsi Kirim Email Pemulihan:</span>
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={!selectedUserForAction.email}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-semibold flex items-center gap-1.5 border border-zinc-700 disabled:opacity-40"
                >
                  <Key className="w-3 h-3 text-zinc-400" />
                  <span>Kirim Tautan ke Email</span>
                </button>
              </div>
              <p className="text-zinc-400 text-[10px]">
                Target: <span className="font-mono text-zinc-300">{selectedUserForAction.email || 'Belum ada email'}</span>
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#27272a]">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-semibold"
              >
                Tutup
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
        message={`Apakah Anda yakin ingin menghapus akun "${selectedUserForAction?.displayName}" (${selectedUserForAction?.email}) dari cPanel Kesiswaan? Tindakan ini hanya menghapus hak akses akun login. Data siswa di kelas maupun Buku Induk Siswa tetap tersimpan aman dan tidak akan terhapus.`}
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
