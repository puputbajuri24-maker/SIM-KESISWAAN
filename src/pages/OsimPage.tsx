import React, { useState, useMemo } from 'react';
import {
  Crown,
  Calendar,
  Users,
  Target,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Award,
  MessageSquare,
  Sparkles,
  Edit2,
  Trash2,
  ChevronRight,
  Send,
  Building,
  Vote,
  Compass,
  FileText,
  ThumbsUp,
  SlidersHorizontal,
  FolderOpen,
  Eye,
  UserCheck,
  ShieldCheck,
  GraduationCap,
  RotateCcw,
  Layers,
  Settings2,
  Upload,
  Image as ImageIcon,
  FileCheck,
  Lock,
  Printer,
  Paperclip,
  ExternalLink,
  XCircle,
  MessageCircle,
  ShieldAlert,
  UserPlus,
  Check,
  Key,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { useCrudPermission } from '../utils/rbacRules';
import {
  OsimMember,
  OsimWorkProgram,
  OsimAspiration,
  OsimMeeting,
  OsimSekbid,
  OsimProgramStatus,
  OsimDepartment,
  Student,
  UserProfile
} from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';
import { StatusBadge } from '../components/common/Badge';
import { getTeacherInitials } from '../utils/initials';
import { getDefaultOsimPassword } from '../services/seedData';
import { OsimPrintSlipsModal } from './osim/modals/OsimPrintSlipsModal';
import { OsimMemberDetailModal } from './osim/modals/OsimMemberDetailModal';
import { OsimMeetingDetailModal } from './osim/modals/OsimMeetingDetailModal';
import { OsimAspirationDetailModal } from './osim/modals/OsimAspirationDetailModal';
import { OsimAccountModal, OsimQuickResetPasswordModal } from './osim/modals/OsimAccountModal';
import { OsimMeetingModal } from './osim/modals/OsimMeetingModal';
import { OsimAspirationModal, OsimAspirationResponseModal } from './osim/modals/OsimAspirationModal';
import { OsimMemberModal } from './osim/modals/OsimMemberModal';
import {
  OsimGuidanceModal,
  OsimLpjModal,
  OsimValidateLpjModal,
  OsimVetoModal,
  OsimAnnualReportPrintModal
} from './osim/modals/OsimSupervisionModals';
import { OsimProkerModal, OsimProkerDetailModal } from './osim/modals/OsimProkerModal';
import { OsimProkerTab, OsimStrukturTab, OsimAkunPengurusTab } from './osim/tabs';
import {
  extractSekbidNumber,
  isBphMember,
  findLinkedOsimAccount,
  getDefaultOsimUsername,
  getDefaultOsimPasswordForMember
} from '../utils/osimAccountHelper';

export const OsimPage: React.FC = () => {
  const {
    isWakaOrAdmin,
    isPembinaOsim,
    isPengurusOsim,
    isSuperAdmin,
    isWaka,
    isOsimKetua,
    isOsimWakil,
    isOsimSekretaris,
    isOsimBendahara,
    isOsimBph,
    isSupervisoryVetoAuthorized,
    currentUser,
    allUsers,
    updateUser,
    resetUserPassword,
    addUser,
    deleteUser,
    syncUsersFromOsim
  } = useAuth();
  const canCrudMembers = useCrudPermission('members', currentUser?.role);
  const canCrudPembinaIntra = useCrudPermission('pembina_intra', currentUser?.role);

  const canManageOsim = isSupervisoryVetoAuthorized || isPengurusOsim;
  const canManageOsimAccounts = (isPembinaOsim || isWakaOrAdmin) && canCrudMembers;
  const isOsimTeacher = isSupervisoryVetoAuthorized;
  const hasSupervisionVeto = isSupervisoryVetoAuthorized;

  // Kebijakan Khusus RBAC Kesiswaan:
  // Seluruh akun anggota OSIM (baik BPH maupun Sekbid) TIDAK memiliki akses untuk CRUD (Create, Read, Update, Delete)
  // pada tab menu "Struktur Kabinet & Bidang", hanya diizinkan untuk melihat saja (Read-Only).
  // Hak akses CRUD struktur kabinet & bidang eksklusif dikendalikan terpusat di cPanel Kesiswaan.
  const isOsimMemberAccount = Boolean(isPengurusOsim || currentUser?.role === 'pengurus_osim' || currentUser?.role === 'anggota_osim');
  const canManageCabinetStructure = !isOsimMemberAccount && Boolean(isSupervisoryVetoAuthorized || isPembinaOsim || isWakaOrAdmin) && canCrudMembers;

  const {
    osimMembers,
    osimPrograms,
    osimAspirations,
    osimMeetings,
    osimDepartments,
    teachers,
    students,
    classes,
    addOsimMember,
    updateOsimMember,
    deleteOsimMember,
    addOsimProgram,
    updateOsimProgram,
    deleteOsimProgram,
    addOsimAspiration,
    updateOsimAspiration,
    deleteOsimAspiration,
    addOsimMeeting,
    updateOsimMeeting,
    deleteOsimMeeting,
    addOsimDepartment,
    updateOsimDepartment,
    deleteOsimDepartment,
    resetOsimDepartmentsToDefault,
    reconcileOsimMembersWithMasterStudents,
    addNotification,
    activeAcademicYear,
    schoolSetting,
    syncUserFromCPanel,
    syncDeleteUserFromCPanel
  } = useSchool();

  // Active view tab
  const [activeSubTab, setActiveSubTab] = useState<
    'proker' | 'struktur' | 'sidang' | 'aspirasi' | 'matriks' | 'rekap_tahunan' | 'akun_pengurus'
  >('proker');

  // OSIM Accounts state for Pembina OSIM & Admin management
  const osimAccounts = useMemo(() => {
    return allUsers.filter(u => u.role === 'pengurus_osim' || u.role === 'anggota_osim');
  }, [allUsers]);

  const [selectedOsimAccount, setSelectedOsimAccount] = useState<UserProfile | null>(null);
  const [isOsimAccountModalOpen, setIsOsimAccountModalOpen] = useState(false);
  const [isOsimAccountResetModalOpen, setIsOsimAccountResetModalOpen] = useState(false);
  const [isOsimAccountDeleteModalOpen, setIsOsimAccountDeleteModalOpen] = useState(false);
  const [isOsimPrintSlipsModalOpen, setIsOsimPrintSlipsModalOpen] = useState(false);
  const [printSlipTarget, setPrintSlipTarget] = useState<'all' | UserProfile>('all');
  const [isAddingOsimAccount, setIsAddingOsimAccount] = useState(false);
  const [showAccountPasswords, setShowAccountPasswords] = useState(false);
  const [accountSearchQuery, setAccountSearchQuery] = useState('');
  const [accountRoleFilter, setAccountRoleFilter] = useState<'all' | 'bph' | 'sekbid'>('all');
  const [isSyncingAccounts, setIsSyncingAccounts] = useState(false);

  // Student & Class grid selection for OSIM account creation
  const [accountSelectedClassFilter, setAccountSelectedClassFilter] = useState<string>('all');
  const [accountStudentSearchTerm, setAccountStudentSearchTerm] = useState<string>('');
  const [selectedStudentForAccount, setSelectedStudentForAccount] = useState<Student | null>(null);
  const [isChangingStudentForAccount, setIsChangingStudentForAccount] = useState<boolean>(false);

  const filteredStudentsForAccount = useMemo(() => {
    const activeStudents = (students || []).filter(s => s.status !== 'Keluar' && s.status !== 'Pindah' && !s.isDeleted);
    return activeStudents.filter(student => {
      if (accountSelectedClassFilter !== 'all') {
        const matchClass = student.classId === accountSelectedClassFilter || student.className === accountSelectedClassFilter;
        if (!matchClass) return false;
      }
      if (accountStudentSearchTerm.trim()) {
        const query = accountStudentSearchTerm.toLowerCase();
        const matchName = (student.fullName || '').toLowerCase().includes(query);
        const matchNis = (student.nis || '').toLowerCase().includes(query);
        const matchClass = (student.className || '').toLowerCase().includes(query);
        if (!matchName && !matchNis && !matchClass) return false;
      }
      return true;
    });
  }, [students, accountSelectedClassFilter, accountStudentSearchTerm]);

  const filteredOsimAccounts = useMemo(() => {
    return osimAccounts.filter(u => {
      if (accountRoleFilter === 'bph') {
        const isBph = u.osimRole === 'ketua' || u.osimRole === 'wakil' || u.osimRole === 'sekretaris' || u.osimRole === 'bendahara';
        if (!isBph) return false;
      } else if (accountRoleFilter === 'sekbid') {
        if (u.osimRole !== 'sekbid') return false;
      }
      if (!accountSearchQuery.trim()) return true;
      const q = accountSearchQuery.toLowerCase();
      return (
        u.displayName.toLowerCase().includes(q) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.osimPosition && u.osimPosition.toLowerCase().includes(q)) ||
        (u.osimDepartmentName && u.osimDepartmentName.toLowerCase().includes(q))
      );
    });
  }, [osimAccounts, accountRoleFilter, accountSearchQuery]);

  // Anggota Struktur Kabinet yang belum memiliki akun di Kelola Akun / cPanel
  const unlinkedKabinetMembers = useMemo(() => {
    return osimMembers.filter(m => !osimAccounts.some(u =>
      u.uid === m.id ||
      (u.username && m.loginUsername && u.username.toLowerCase() === m.loginUsername.toLowerCase()) ||
      (u.username && m.username && u.username.toLowerCase() === m.username.toLowerCase()) ||
      (u.nip && m.studentNis && u.nip === m.studentNis) ||
      (u.displayName.toLowerCase().replace(/\s*\(.*\)$/, '').trim() === m.fullName.toLowerCase().trim())
    ));
  }, [osimMembers, osimAccounts]);

  // Form for OSIM account
  const [osimAccountForm, setOsimAccountForm] = useState({
    displayName: '',
    username: '',
    email: '',
    password: 'password',
    osimRole: 'sekbid' as 'ketua' | 'wakil' | 'sekretaris' | 'bendahara' | 'sekbid',
    osimPosition: 'Pengurus OSIM',
    osimDepartmentName: 'BPH (Badan Pengurus Harian)',
    status: 'Aktif' as 'Aktif' | 'Nonaktif',
    isCashManager: false
  });
  const [showFormPassword, setShowFormPassword] = useState(false);

  // Quick reset password modal form
  const [quickResetPasswordText, setQuickResetPasswordText] = useState('password');
  const [showQuickResetText, setShowQuickResetText] = useState(false);

  // Member credential inline fields for member modal
  const [memberLoginUsername, setMemberLoginUsername] = useState('');
  const [memberLoginPassword, setMemberLoginPassword] = useState('password');
  const [showMemberLoginPassword, setShowMemberLoginPassword] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSekbid, setFilterSekbid] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals state
  const [isProkerModalOpen, setIsProkerModalOpen] = useState(false);
  const [isProkerDetailOpen, setIsProkerDetailOpen] = useState(false);
  const [selectedProker, setSelectedProker] = useState<OsimWorkProgram | null>(null);
  const [isProkerDeleteOpen, setIsProkerDeleteOpen] = useState(false);

  // Verifikasi & Bimbingan (Pembina OSIM)
  const [isGuidanceModalOpen, setIsGuidanceModalOpen] = useState(false);
  const [guidanceForm, setGuidanceForm] = useState<{
    guidanceNotes: string;
    statusDecision: 'Disetujui' | 'Revisi';
  }>({
    guidanceNotes: '',
    statusDecision: 'Disetujui'
  });

  // Pelaksanaan & Pelaporan LPJ (Siswa Bidang)
  const [isLpjModalOpen, setIsLpjModalOpen] = useState(false);
  const [lpjForm, setLpjForm] = useState<{
    budgetRealized: number;
    participantCount: number;
    lpjNotes: string;
    lpjFileUrl: string;
    photos: string[];
  }>({
    budgetRealized: 0,
    participantCount: 0,
    lpjNotes: '',
    lpjFileUrl: '',
    photos: []
  });

  // Validasi Akhir & Arsip Sah (Pembina & Waka)
  const [isValidatingLpjOpen, setIsValidatingLpjOpen] = useState(false);
  const [validationRemarks, setValidationRemarks] = useState('');

  // Supervisi & Hak Veto Kesiswaan (Pembina OSIM, Waka Kesiswaan & Admin App)
  const [isVetoModalOpen, setIsVetoModalOpen] = useState(false);
  const [vetoReason, setVetoReason] = useState('');
  const [vetoTargetStatus, setVetoTargetStatus] = useState<'Dibatalkan' | 'Revisi' | 'Draft'>('Revisi');

  // Laporan Tahunan Kesiswaan Cetak Resmi
  const [isAnnualReportPrintOpen, setIsAnnualReportPrintOpen] = useState(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isMemberDetailOpen, setIsMemberDetailOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OsimMember | null>(null);
  const [isMemberDeleteOpen, setIsMemberDeleteOpen] = useState(false);

  const [isAspirationModalOpen, setIsAspirationModalOpen] = useState(false);
  const [isAspirationDetailOpen, setIsAspirationDetailOpen] = useState(false);
  const [isAspirationResponseOpen, setIsAspirationResponseOpen] = useState(false);
  const [selectedAspiration, setSelectedAspiration] = useState<OsimAspiration | null>(null);
  const [isAspirationDeleteOpen, setIsAspirationDeleteOpen] = useState(false);

  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isMeetingDetailOpen, setIsMeetingDetailOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<OsimMeeting | null>(null);
  const [isMeetingDeleteOpen, setIsMeetingDeleteOpen] = useState(false);

  // Department (Bidang/Sekbid) modal states
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<OsimDepartment | null>(null);
  const [isDeptDeleteOpen, setIsDeptDeleteOpen] = useState(false);
  const [isDeptResetOpen, setIsDeptResetOpen] = useState(false);
  const [deptForm, setDeptForm] = useState<Partial<OsimDepartment>>({
    name: '',
    code: '',
    description: '',
    coordinatorName: '',
    sortOrder: 1
  });

  // Forms data
  const [prokerForm, setProkerForm] = useState<Partial<OsimWorkProgram>>({
    title: '',
    sekbid: 'Sekbid 1: Keimanan, Ketaqwaan & Moderasi Beragama',
    personInCharge: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    location: 'Lingkungan Sekolah / Kampus Madrasah',
    budgetEstimated: 5000000,
    budgetRealized: 0,
    targetParticipants: 'Seluruh Siswa & Pengurus',
    participantCount: 100,
    successIndicator: '',
    progressPercentage: 0,
    status: 'Diajukan',
    description: '',
    academicYear: activeAcademicYear
  });

  // State Pilihan Siswa & Filter Kelas Grid untuk Pengurus OSIM
  const [memberSelectionMode, setMemberSelectionMode] = useState<'db' | 'manual'>('db');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');
  const [memberCategoryTab, setMemberCategoryTab] = useState<'bph' | 'sekbid'>('sekbid');
  const [isChangingSelectedStudent, setIsChangingSelectedStudent] = useState<boolean>(false);

  const [memberForm, setMemberForm] = useState<Partial<OsimMember>>({
    fullName: '',
    studentNis: '',
    className: 'XI RPL 1',
    position: 'Ketua Sekbid',
    sekbid: 'Sekbid 1: Keimanan, Ketaqwaan & Moderasi Beragama',
    phone: '081234567890',
    email: '',
    status: 'Aktif',
    vision: '',
    flagshipProgram: '',
    period: activeAcademicYear
  });

  const [aspirationForm, setAspirationForm] = useState<Partial<OsimAspiration>>({
    studentName: currentUser?.displayName || 'Siswa Madrasah',
    studentClass: 'X RPL 1',
    date: new Date().toISOString().split('T')[0],
    title: '',
    content: '',
    category: 'Kegiatan & Acara',
    upvotes: 1,
    status: 'Ditampung',
    academicYear: activeAcademicYear
  });

  const [responseNoteText, setResponseNoteText] = useState('');
  const [responseStatus, setResponseStatus] = useState<'Ditampung' | 'Sedang Dibahas' | 'Direalisasikan' | 'Ditolak'>('Direalisasikan');

  const [meetingForm, setMeetingForm] = useState<Partial<OsimMeeting>>({
    title: '',
    type: 'Rapat Pleno Pengurus',
    date: new Date().toISOString().split('T')[0],
    startTime: '15:30',
    endTime: '17:00',
    location: 'Ruang Rapat OSIM & Kesiswaan',
    leader: 'Ketua Umum OSIM',
    secretary: 'Sekretaris Umum',
    attendeesCount: 25,
    agenda: '',
    decisionNotes: '',
    wakaNotes: '',
    academicYear: activeAcademicYear
  });

  const sortedDepartments = useMemo(() => {
    if (!osimDepartments || osimDepartments.length === 0) return [];
    return [...osimDepartments].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [osimDepartments]);

  const sekbidList: string[] = useMemo(() => {
    if (sortedDepartments.length > 0) {
      return sortedDepartments.map(d => d.name);
    }
    return [
      'BPH (Badan Pengurus Harian)',
      'Sekbid 1: Keimanan, Ketaqwaan & Moderasi Beragama',
      'Sekbid 2: Wawasan Kebangsaan, Bela Negara & Kedisiplinan',
      'Sekbid 3: Akademik, Sains, Riset & Literasi',
      'Sekbid 4: Demokrasi, HAM, Kepemimpinan & Politik Pelajar',
      'Sekbid 5: Keterampilan, Kewirausahaan & Koperasi Siswa',
      'Sekbid 6: Kesehatan Jasmani, Olahraga & Lingkungan Hidup',
      'Sekbid 7: Sastra, Seni, Budaya & Bahasa',
      'Sekbid 8: Teknologi Informasi, Multimedia & Komunikasi'
    ];
  }, [sortedDepartments]);

  // Calculations & KPIs
  const totalBudgetEst = useMemo(() => {
    return osimPrograms.reduce((acc, p) => acc + (p.budgetEstimated || 0), 0);
  }, [osimPrograms]);

  const totalBudgetReal = useMemo(() => {
    return osimPrograms.reduce((acc, p) => acc + (p.budgetRealized || 0), 0);
  }, [osimPrograms]);

  const avgProgress = useMemo(() => {
    if (osimPrograms.length === 0) return 0;
    const sum = osimPrograms.reduce((acc, p) => acc + (p.progressPercentage || 0), 0);
    return Math.round(sum / osimPrograms.length);
  }, [osimPrograms]);

  const completedProgramsCount = useMemo(() => {
    return osimPrograms.filter(p => p.status === 'Selesai').length;
  }, [osimPrograms]);

  const activeProgramsCount = useMemo(() => {
    return osimPrograms.filter(p => p.status === 'Berlangsung' || p.status === 'Disetujui').length;
  }, [osimPrograms]);

  // Filtered Programs
  const filteredPrograms = useMemo(() => {
    return osimPrograms.filter(p => {
      // Kebijakan RBAC Sekbid: Menginput draf proposal kegiatan khusus untuk bidang mereka sendiri (tidak bisa melihat draf sekbid lain)
      if (isPengurusOsim && !isOsimBph) {
        if (p.status === 'Draft') {
          const userDept = (currentUser?.osimDepartmentName || '').toLowerCase();
          const userPos = (currentUser?.osimPosition || '').toLowerCase();
          const pSekbid = (p.sekbid || '').toLowerCase();
          const isOwnSekbid = 
            (userDept && (pSekbid.includes(userDept) || userDept.includes(pSekbid))) ||
            (userPos && (pSekbid.includes(userPos) || userPos.includes(pSekbid)));
          if (!isOwnSekbid) {
            return false; // Sembunyikan draf sekbid lain
          }
        }
      }

      const matchQuery =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sekbid.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.personInCharge.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSekbid = filterSekbid === 'all' || p.sekbid === filterSekbid;
      const matchStatus = filterStatus === 'all' || p.status === filterStatus;
      return matchQuery && matchSekbid && matchStatus;
    });
  }, [osimPrograms, searchQuery, filterSekbid, filterStatus, isPengurusOsim, isOsimBph, currentUser]);

  // Filtered Members
  const filteredMembers = useMemo(() => {
    return osimMembers.filter(m => {
      const matchQuery =
        m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.studentNis.includes(searchQuery) ||
        m.className.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSekbid = filterSekbid === 'all' || m.sekbid === filterSekbid;
      return matchQuery && matchSekbid;
    });
  }, [osimMembers, searchQuery, filterSekbid]);

  // List of classes with student counts for Grid Filter
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
      const uniqueClassNames = Array.from(new Set(activeStudents.map(s => s.className).filter(Boolean)));
      classList = uniqueClassNames.map(name => ({
        id: name,
        name,
        count: activeStudents.filter(s => s.className === name).length
      }));
    }

    // Sort classes naturally (X, XI, XII)
    classList.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    return {
      totalCount,
      classList
    };
  }, [classes, students]);

  // Filtered students for OSIM member selection
  const filteredStudentsForOsim = useMemo(() => {
    const activeStudents = (students || []).filter(s => s.status !== 'Keluar' && s.status !== 'Pindah' && !s.isDeleted);

    return activeStudents.filter(student => {
      // Class filter
      if (selectedClassFilter !== 'all') {
        const matchClass = student.classId === selectedClassFilter || student.className === selectedClassFilter;
        if (!matchClass) return false;
      }

      // Search term filter
      if (studentSearchTerm.trim()) {
        const query = studentSearchTerm.toLowerCase();
        const matchName = (student.fullName || '').toLowerCase().includes(query);
        const matchNis = (student.nis || '').toLowerCase().includes(query);
        const matchClass = (student.className || '').toLowerCase().includes(query);
        if (!matchName && !matchNis && !matchClass) return false;
      }

      return true;
    });
  }, [students, selectedClassFilter, studentSearchTerm]);

  // Sah programs for Annual Report
  const sahPrograms = useMemo(() => {
    return osimPrograms.filter(p =>
      p.status === 'Selesai & Sah' ||
      p.status === 'Selesai' ||
      p.isArchivedForYearEndReport === true
    );
  }, [osimPrograms]);

  const rekapTotalRab = useMemo(() => {
    return sahPrograms.reduce((acc, p) => acc + (p.budgetEstimated || 0), 0);
  }, [sahPrograms]);

  const rekapTotalRealized = useMemo(() => {
    return sahPrograms.reduce((acc, p) => acc + (p.budgetRealized || p.budgetEstimated || 0), 0);
  }, [sahPrograms]);

  const rekapTotalParticipants = useMemo(() => {
    return sahPrograms.reduce((acc, p) => acc + (p.participantCount || 0), 0);
  }, [sahPrograms]);

  const pendingVerificationCount = useMemo(() => {
    return osimPrograms.filter(p => p.status === 'Diajukan').length;
  }, [osimPrograms]);

  const pendingLpjCount = useMemo(() => {
    return osimPrograms.filter(p => p.status === 'Menunggu Verifikasi LPJ').length;
  }, [osimPrograms]);

  // Proker Handlers
  const handleOpenAddProker = () => {
    setSelectedProker(null);
    const initialSekbid = (currentUser?.osimDepartmentName as OsimSekbid) || 'Sekbid 1: Keimanan, Ketaqwaan & Moderasi Beragama';
    setProkerForm({
      title: '',
      sekbid: initialSekbid,
      personInCharge: currentUser?.displayName || 'Pengurus Sekbid',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      location: 'Lingkungan Madrasah',
      budgetEstimated: 3500000,
      budgetRealized: 0,
      targetParticipants: 'Seluruh Siswa Madrasah',
      participantCount: 150,
      successIndicator: 'Terlaksananya kegiatan dengan partisipasi aktif dan zero insiden.',
      progressPercentage: 0,
      status: 'Draft',
      description: '',
      lpjNotes: '',
      lpjFileUrl: '',
      academicYear: activeAcademicYear
    });
    setIsProkerModalOpen(true);
  };

  const handleOpenEditProker = (p: OsimWorkProgram, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedProker(p);
    setProkerForm(p);
    setIsProkerModalOpen(true);
  };

  const handleOpenDetailProker = (p: OsimWorkProgram) => {
    setSelectedProker(p);
    setIsProkerDetailOpen(true);
  };

  const handleSaveProker = async (e: React.FormEvent, submitDirectly: boolean = false) => {
    e.preventDefault();
    if (!prokerForm.title || !prokerForm.sekbid) {
      alert('Mohon lengkapi judul program kerja dan seksi bidang penanggung jawab.');
      return;
    }

    try {
      const targetStatus: OsimProgramStatus = submitDirectly ? 'Diajukan' : (prokerForm.status as OsimProgramStatus) || 'Draft';

      if (selectedProker) {
        await updateOsimProgram(selectedProker.id, {
          ...prokerForm,
          budgetEstimated: Number(prokerForm.budgetEstimated) || 0,
          budgetRealized: Number(prokerForm.budgetRealized) || 0,
          participantCount: Number(prokerForm.participantCount) || 0,
          progressPercentage: Number(prokerForm.progressPercentage) || 0,
          status: targetStatus,
          lpjNotes: prokerForm.lpjNotes || '',
          lpjFileUrl: prokerForm.lpjFileUrl || ''
        });

        if (submitDirectly) {
          addNotification({
            title: 'Pengajuan Program Kerja OSIM Baru',
            message: `${prokerForm.personInCharge} (${prokerForm.sekbid?.split(':')[0]}) mengajukan proker "${prokerForm.title}" (RAB: Rp ${Number(prokerForm.budgetEstimated).toLocaleString('id-ID')}) untuk diverifikasi & dibimbing Pembina OSIM.`,
            type: 'info',
            targetRole: 'pembina_osim',
            link: '#osim'
          });
        }
      } else {
        await addOsimProgram({
          title: prokerForm.title!,
          sekbid: prokerForm.sekbid as OsimSekbid,
          personInCharge: prokerForm.personInCharge || 'Pengurus OSIM',
          startDate: prokerForm.startDate || new Date().toISOString().split('T')[0],
          endDate: prokerForm.endDate || '',
          location: prokerForm.location || 'Sekolah',
          budgetEstimated: Number(prokerForm.budgetEstimated) || 0,
          budgetRealized: Number(prokerForm.budgetRealized) || 0,
          targetParticipants: prokerForm.targetParticipants || 'Seluruh Siswa',
          participantCount: Number(prokerForm.participantCount) || 0,
          successIndicator: prokerForm.successIndicator || 'Kegiatan terlaksana sesuai target.',
          progressPercentage: Number(prokerForm.progressPercentage) || 0,
          status: targetStatus,
          description: prokerForm.description || '',
          lpjNotes: prokerForm.lpjNotes || '',
          lpjFileUrl: prokerForm.lpjFileUrl || '',
          academicYear: prokerForm.academicYear || activeAcademicYear
        });

        if (submitDirectly) {
          addNotification({
            title: 'Pengajuan Program Kerja OSIM Baru',
            message: `${prokerForm.personInCharge} (${prokerForm.sekbid?.split(':')[0]}) mengajukan proker "${prokerForm.title}" (RAB: Rp ${Number(prokerForm.budgetEstimated).toLocaleString('id-ID')}) untuk diverifikasi & dibimbing Pembina OSIM.`,
            type: 'info',
            targetRole: 'pembina_osim',
            link: '#osim'
          });
        }
      }
    } catch (err) {
      console.error('Error saving proker:', err);
    } finally {
      setIsProkerModalOpen(false);
      setSelectedProker(null);
    }
  };

  // Workflow Handlers
  const handleAjukanKePembina = async (p: OsimWorkProgram, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await updateOsimProgram(p.id, {
        status: 'Diajukan'
      });
      if (selectedProker && selectedProker.id === p.id) {
        setSelectedProker({ ...selectedProker, status: 'Diajukan' });
      }
      addNotification({
        title: 'Pengajuan Program Kerja OSIM Baru',
        message: `${p.personInCharge} (${p.sekbid.split(':')[0]}) mengajukan usulan proker "${p.title}" (RAB: Rp ${p.budgetEstimated.toLocaleString('id-ID')}) untuk diverifikasi & dibimbing oleh Pembina OSIM.`,
        type: 'info',
        targetRole: 'pembina_osim',
        link: '#osim'
      });
      alert(`Program kerja "${p.title}" berhasil diajukan ke Pembina OSIM untuk proses verifikasi dan bimbingan!`);
    } catch (err) {
      console.error('Error submitting proker to pembina:', err);
    }
  };

  const handleOpenGuidanceModal = (p: OsimWorkProgram, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedProker(p);
    setGuidanceForm({
      guidanceNotes: p.guidanceNotes || '',
      statusDecision: (p.status === 'Revisi' ? 'Revisi' : 'Disetujui') as 'Disetujui' | 'Revisi'
    });
    setIsGuidanceModalOpen(true);
  };

  const handleSaveGuidance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProker) return;
    try {
      const isApproved = guidanceForm.statusDecision === 'Disetujui';
      const updatedStatus: OsimProgramStatus = guidanceForm.statusDecision;
      const today = new Date().toISOString().split('T')[0];
      const authorityLabel = isSuperAdmin
        ? 'Admin App (Super Admin)'
        : isWaka
        ? 'Waka Kesiswaan'
        : 'Pembina OSIM';
      const verifier = currentUser?.displayName ? `${currentUser.displayName} (${authorityLabel})` : authorityLabel;

      await updateOsimProgram(selectedProker.id, {
        status: updatedStatus,
        guidanceNotes: guidanceForm.guidanceNotes,
        guidanceDate: today,
        verifiedBy: verifier,
        progressPercentage: isApproved ? Math.max(selectedProker.progressPercentage || 0, 25) : selectedProker.progressPercentage
      });

      if (selectedProker) {
        setSelectedProker({
          ...selectedProker,
          status: updatedStatus,
          guidanceNotes: guidanceForm.guidanceNotes,
          guidanceDate: today,
          verifiedBy: verifier
        });
      }

      addNotification({
        title: isApproved ? `Proker OSIM Disetujui (${authorityLabel})` : `Catatan Bimbingan / Revisi (${authorityLabel})`,
        message: `Program kerja "${selectedProker.title}" telah ${isApproved ? `disetujui oleh ${authorityLabel} untuk dilaksanakan.` : `diberikan catatan bimbingan/revisi oleh ${authorityLabel}.`} Catatan: "${guidanceForm.guidanceNotes || 'Silakan cek detail di halaman OSIM.'}"`,
        type: isApproved ? 'success' : 'warning',
        targetRole: 'pengurus_osim',
        link: '#osim'
      });

      setIsGuidanceModalOpen(false);
      alert(isApproved ? `Program kerja "${selectedProker.title}" telah disetujui (${authorityLabel})!` : `Catatan bimbingan/revisi telah dikirimkan ke pengurus!`);
    } catch (err) {
      console.error('Error saving guidance:', err);
    }
  };

  const handleOpenLpjModal = (p: OsimWorkProgram, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedProker(p);
    setLpjForm({
      budgetRealized: p.budgetRealized || p.budgetEstimated || 0,
      participantCount: p.participantCount || 100,
      lpjNotes: p.lpjNotes || '',
      lpjFileUrl: p.lpjFileUrl || '',
      photos: p.photos || []
    });
    setIsLpjModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      if (file.size > 2 * 1024 * 1024) {
        alert(`Foto "${file.name}" berukuran > 2MB. Disarankan foto yang lebih ringan agar loading cepat.`);
      }
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result as string;
        if (result) {
          setLpjForm(prev => ({
            ...prev,
            photos: [...(prev.photos || []), result]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemovePhoto = (idxToRemove: number) => {
    setLpjForm(prev => ({
      ...prev,
      photos: (prev.photos || []).filter((_, idx) => idx !== idxToRemove)
    }));
  };

  const handleSubmitDraftLpj = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProker) return;
    try {
      const nowIso = new Date().toISOString();
      const updatedData: Partial<OsimWorkProgram> = {
        budgetRealized: Number(lpjForm.budgetRealized) || 0,
        participantCount: Number(lpjForm.participantCount) || 0,
        lpjNotes: lpjForm.lpjNotes || '',
        lpjFileUrl: lpjForm.lpjFileUrl || '',
        photos: lpjForm.photos || [],
        status: 'Menunggu Verifikasi LPJ',
        progressPercentage: 100,
        lpjSubmittedAt: nowIso
      };

      await updateOsimProgram(selectedProker.id, updatedData);

      if (selectedProker) {
        setSelectedProker({
          ...selectedProker,
          ...updatedData
        });
      }

      addNotification({
        title: 'Draft LPJ Masuk Menunggu Pengesahan',
        message: `Pengurus ${selectedProker.sekbid.split(':')[0]} telah mengirim draft LPJ & dokumentasi untuk "${selectedProker.title}". Realisasi: Rp ${Number(lpjForm.budgetRealized).toLocaleString('id-ID')}. Mohon validasi & pengesahan Pembina/Waka.`,
        type: 'info',
        targetRole: 'pembina_osim',
        link: '#osim'
      });

      setIsLpjModalOpen(false);
      alert('Draft LPJ berhasil dikirim ke Pembina OSIM untuk proses validasi akhir!');
    } catch (err) {
      console.error('Error submitting draft LPJ:', err);
    }
  };

  const handleOpenLockAndArchiveModal = (p: OsimWorkProgram, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedProker(p);
    setValidationRemarks(p.guidanceNotes || '');
    setIsValidatingLpjOpen(true);
  };

  const handleConfirmLockAndArchive = async () => {
    if (!selectedProker) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const authorityLabel = isSuperAdmin
        ? 'Admin App (Super Admin)'
        : isWaka
        ? 'Waka Kesiswaan'
        : 'Pembina OSIM';
      const approver = currentUser?.displayName ? `${currentUser.displayName} (${authorityLabel})` : authorityLabel;
      const updatedData: Partial<OsimWorkProgram> = {
        status: 'Selesai & Sah',
        isArchivedForYearEndReport: true,
        finalApprovedAt: today,
        finalApprovedBy: approver,
        progressPercentage: 100,
        guidanceNotes: validationRemarks || selectedProker.guidanceNotes
      };

      await updateOsimProgram(selectedProker.id, updatedData);

      if (selectedProker) {
        setSelectedProker({
          ...selectedProker,
          ...updatedData
        });
      }

      addNotification({
        title: `LPJ Resmi Disahkan & Diarsipkan (${authorityLabel})!`,
        message: `Program kerja "${selectedProker.title}" telah divalidasi akhir dan disahkan oleh ${approver} ke dalam Rekap Tahunan Kesiswaan untuk Laporan Kepala Madrasah.`,
        type: 'success',
        targetRole: 'pengurus_osim',
        link: '#osim'
      });

      setIsValidatingLpjOpen(false);
      alert(`Program kerja "${selectedProker.title}" telah berstatus "Selesai & Sah" dan resmi terakumulasi dalam Rekap Tahunan Kesiswaan (${authorityLabel})!`);
    } catch (err) {
      console.error('Error locking and archiving proker:', err);
    }
  };

  const handleRejectLpj = async () => {
    if (!selectedProker) return;
    try {
      const reason = prompt('Tuliskan catatan evaluasi perbaikan untuk LPJ ini:', 'Mohon lengkapi kwitansi nota dan dokumentasi foto kegiatan.');
      if (!reason) return;

      const authorityLabel = isSuperAdmin
        ? 'Admin App (Super Admin)'
        : isWaka
        ? 'Waka Kesiswaan'
        : 'Pembina OSIM';
      const verifier = currentUser?.displayName ? `${currentUser.displayName} (${authorityLabel})` : authorityLabel;

      const updatedData: Partial<OsimWorkProgram> = {
        status: 'Berlangsung',
        guidanceNotes: `Revisi LPJ [${authorityLabel}]: ${reason}`
      };

      await updateOsimProgram(selectedProker.id, updatedData);

      if (selectedProker) {
        setSelectedProker({
          ...selectedProker,
          ...updatedData
        });
      }

      addNotification({
        title: `Draft LPJ Perlu Perbaikan (${authorityLabel})`,
        message: `${verifier} meminta perbaikan untuk LPJ "${selectedProker.title}": "${reason}"`,
        type: 'warning',
        targetRole: 'pengurus_osim',
        link: '#osim'
      });

      setIsValidatingLpjOpen(false);
      alert(`Draft LPJ telah dikembalikan ke pengurus dengan catatan perbaikan dari ${authorityLabel}.`);
    } catch (err) {
      console.error('Error rejecting LPJ:', err);
    }
  };

  // ==========================================================
  // SUPERVISI & HAK VETO KEWENANGAN: PEMBINA OSIM, WAKA & ADMIN APP
  // ==========================================================
  const handleOpenVetoModal = (p: OsimWorkProgram, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedProker(p);
    setVetoReason(p.vetoReason || '');
    setVetoTargetStatus('Revisi');
    setIsVetoModalOpen(true);
  };

  const handleConfirmVeto = async () => {
    if (!selectedProker) return;
    if (!vetoReason.trim()) {
      alert('Mohon tuliskan alasan pertimbangan resmi pemberlakuan hak veto kesiswaan.');
      return;
    }

    try {
      const nowIso = new Date().toISOString();
      const authorityLabel = isSuperAdmin
        ? 'Admin App (Super Admin)'
        : isWaka
        ? 'Waka Kesiswaan'
        : 'Pembina OSIM';
      const actorName = currentUser?.displayName ? `${currentUser.displayName} (${authorityLabel})` : authorityLabel;

      const updatedData: Partial<OsimWorkProgram> = {
        status: vetoTargetStatus,
        vetoedBy: actorName,
        vetoedAt: nowIso,
        vetoReason: vetoReason.trim(),
        guidanceNotes: `[HAK VETO ${authorityLabel.toUpperCase()}]: ${vetoReason.trim()}`,
        // Jika dibatalkan atau dikembalikan ke revisi/draft, lepas dari arsip rekap sah
        isArchivedForYearEndReport: false
      };

      await updateOsimProgram(selectedProker.id, updatedData);

      if (selectedProker) {
        setSelectedProker({
          ...selectedProker,
          ...updatedData
        });
      }

      addNotification({
        title: `HAK VETO KESISWAAN DITERAPKAN (${authorityLabel.toUpperCase()})`,
        message: `${actorName} telah memberlakukan hak veto pada program kerja "${selectedProker.title}". Status dialihkan menjadi "${vetoTargetStatus}". Alasan: "${vetoReason.trim()}".`,
        type: 'warning',
        targetRole: 'pengurus_osim',
        link: '#osim'
      });

      setIsVetoModalOpen(false);
      alert(`Hak Veto berhasil diberlakukan oleh ${authorityLabel}!\nStatus proker "${selectedProker.title}" dialihkan menjadi "${vetoTargetStatus}".`);
    } catch (err) {
      console.error('Error applying veto:', err);
    }
  };

  const handleDeleteProkerConfirm = async () => {
    if (selectedProker) {
      try {
        await deleteOsimProgram(selectedProker.id);
      } catch (err) {
        console.error('Error deleting proker:', err);
      } finally {
        setIsProkerDeleteOpen(false);
        setSelectedProker(null);
      }
    }
  };

  // Member Handlers
  const handleOpenDetailMember = (m: OsimMember, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedMember(m);
    setIsMemberDetailOpen(true);
  };

  const handleOpenAddMember = () => {
    if (!canManageCabinetStructure) {
      alert('Akses Dibatasi: Akun anggota OSIM hanya memiliki hak akses melihat (Read-Only) pada Struktur Kabinet & Bidang.');
      return;
    }
    setSelectedMember(null);
    setMemberSelectionMode('db');
    setSelectedClassFilter('all');
    setStudentSearchTerm('');
    setIsChangingSelectedStudent(false);
    setMemberCategoryTab('sekbid');
    setMemberForm({
      fullName: '',
      studentNis: '',
      className: '',
      position: 'Anggota Sekbid',
      sekbid: (sekbidList.find(s => !s.startsWith('BPH')) || 'Sekbid 1: Keimanan, Ketaqwaan & Moderasi Beragama') as OsimSekbid,
      phone: '',
      email: '',
      status: 'Aktif',
      vision: 'Mendedikasikan diri untuk kemajuan organisasi dan akhlak santri.',
      flagshipProgram: '',
      period: activeAcademicYear
    });
    setIsMemberModalOpen(true);
  };

  const handleOpenAddBph = () => {
    if (!canManageCabinetStructure) {
      alert('Akses Dibatasi: Akun anggota OSIM hanya memiliki hak akses melihat (Read-Only) pada Struktur Kabinet & Bidang.');
      return;
    }
    setSelectedMember(null);
    setMemberSelectionMode('db');
    setSelectedClassFilter('all');
    setStudentSearchTerm('');
    setIsChangingSelectedStudent(false);
    setMemberCategoryTab('bph');
    setMemberForm({
      fullName: '',
      studentNis: '',
      className: '',
      position: 'Ketua Umum OSIM',
      sekbid: 'BPH (Badan Pengurus Harian)',
      phone: '',
      email: '',
      status: 'Aktif',
      vision: 'Mendedikasikan diri untuk kemajuan organisasi dan akhlak santri.',
      flagshipProgram: '',
      period: activeAcademicYear
    });
    setMemberLoginUsername('');
    setMemberLoginPassword('password');
    setIsMemberModalOpen(true);
  };

  const handleOpenAddDeptMember = (deptName: string) => {
    if (!canManageCabinetStructure) {
      alert('Akses Dibatasi: Akun anggota OSIM hanya memiliki hak akses melihat (Read-Only) pada Struktur Kabinet & Bidang.');
      return;
    }
    setSelectedMember(null);
    setMemberSelectionMode('db');
    setSelectedClassFilter('all');
    setStudentSearchTerm('');
    setIsChangingSelectedStudent(false);
    setMemberCategoryTab('sekbid');
    setMemberForm({
      fullName: '',
      studentNis: '',
      className: '',
      position: 'Anggota Sekbid',
      sekbid: deptName as OsimSekbid,
      phone: '',
      email: '',
      status: 'Aktif',
      vision: 'Mendedikasikan diri untuk kemajuan organisasi dan akhlak santri.',
      flagshipProgram: '',
      period: activeAcademicYear
    });
    setMemberLoginUsername('');
    setMemberLoginPassword('password');
    setIsMemberModalOpen(true);
  };

  const handleSelectStudentForMember = (student: Student) => {
    setMemberForm(prev => ({
      ...prev,
      fullName: student.fullName,
      studentNis: student.nis || '',
      className: student.className || '',
      phone: student.phone && student.phone !== '-' ? student.phone : (prev.phone || ''),
      photoUrl: student.photoUrl || prev.photoUrl || ''
    }));
    if (student.nis) {
      setMemberLoginUsername(student.nis.trim());
    }
    setIsChangingSelectedStudent(false);
  };

  const handleOpenEditMember = (m: OsimMember, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!canManageCabinetStructure) {
      alert('Akses Dibatasi: Akun anggota OSIM hanya memiliki hak akses melihat (Read-Only) pada Struktur Kabinet & Bidang.');
      return;
    }
    setSelectedMember(m);
    setMemberForm(m);
    setMemberSelectionMode('db');
    setSelectedClassFilter('all');
    setStudentSearchTerm('');
    setIsChangingSelectedStudent(false);
    const isBph = isBphMember(m);
    setMemberCategoryTab(isBph ? 'bph' : 'sekbid');

    // Find linked login user account using our robust matcher (guaranteed not to confuse Sekbid with Ketua Umum)
    const matched = findLinkedOsimAccount(m, osimAccounts);
    const fallbackPassword = getDefaultOsimPasswordForMember(m);
    if (matched) {
      setMemberLoginUsername(matched.username || getDefaultOsimUsername(m));
      const validPass = (matched.password && matched.password !== 'password') ? matched.password : (m.loginPassword || fallbackPassword);
      setMemberLoginPassword(validPass);
    } else {
      const defaultUsername = m.loginUsername || getDefaultOsimUsername(m);
      const defaultPass = m.loginPassword || fallbackPassword;
      setMemberLoginUsername(defaultUsername);
      setMemberLoginPassword(defaultPass);
    }
    setShowMemberLoginPassword(false);
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageCabinetStructure) {
      alert('Akses Dibatasi: Anda tidak memiliki wewenang untuk menambah atau mengubah pengurus kabinet.');
      return;
    }
    if (!memberForm.fullName || !memberForm.position) {
      alert('Mohon isi nama lengkap dan posisi/jabatan pengurus.');
      return;
    }

    try {
      const cleanUsername = memberLoginUsername.trim().toLowerCase();
      const passToSet = memberLoginPassword.trim() || 'password';

      const effectiveUsername = cleanUsername || (memberForm.studentNis ? memberForm.studentNis.trim() : '');
      const defaultClassFallback = classes && classes.length > 0 ? classes[0].name : '10-A';

      const memberToSave: OsimMember = {
        ...memberForm,
        className: memberForm.className || defaultClassFallback,
        loginUsername: effectiveUsername || undefined,
        loginPassword: passToSet,
        username: effectiveUsername || undefined,
        password: passToSet
      } as OsimMember;

      if (selectedMember) {
        await updateOsimMember(selectedMember.id, memberToSave);
      } else {
        await addOsimMember({
          fullName: memberForm.fullName!,
          studentNis: memberForm.studentNis || '',
          className: memberForm.className || defaultClassFallback,
          position: memberForm.position as any,
          sekbid: memberForm.sekbid as OsimSekbid,
          phone: memberForm.phone || '-',
          email: memberForm.email || '',
          photoUrl: memberForm.photoUrl || '',
          status: (memberForm.status as any) || 'Aktif',
          vision: memberForm.vision || '',
          flagshipProgram: memberForm.flagshipProgram || '',
          period: memberForm.period || activeAcademicYear,
          loginUsername: effectiveUsername || undefined,
          loginPassword: passToSet,
          username: effectiveUsername || undefined,
          password: passToSet
        });
      }

      // If Pembina OSIM or Admin changed or verified login credentials, synchronize with user accounts
      if (canManageOsimAccounts && effectiveUsername) {
        const existingAccount = findLinkedOsimAccount(memberForm, osimAccounts);

        const pos = (memberForm.position || '').toLowerCase();
        const osimRoleVal: 'ketua' | 'wakil' | 'sekretaris' | 'bendahara' | 'sekbid' =
          pos.includes('ketua') && !pos.includes('wakil') && !pos.includes('sekbid') ? 'ketua'
          : pos.includes('wakil') ? 'wakil'
          : pos.includes('sekretaris') ? 'sekretaris'
          : pos.includes('bendahara') ? 'bendahara'
          : 'sekbid';

        const isBph = isBphMember(memberForm);
        const sekbidNum = extractSekbidNumber(memberForm.sekbid) || extractSekbidNumber(memberForm.position);

        // Only update existing account if it matches this person or is an unassigned generic account
        const isSamePerson = existingAccount && (
          existingAccount.username.toLowerCase() === effectiveUsername.toLowerCase() ||
          existingAccount.displayName.toLowerCase().trim() === (memberForm.fullName || '').toLowerCase().trim() ||
          existingAccount.uid === selectedMember?.id ||
          existingAccount.username.startsWith('osim.')
        );

        if (existingAccount && isSamePerson) {
          const updatedUserObj: UserProfile = {
            ...existingAccount,
            displayName: memberForm.fullName || existingAccount.displayName,
            username: effectiveUsername,
            password: passToSet,
            status: memberForm.status || 'Aktif',
            osimRole: osimRoleVal,
            osimPosition: memberForm.position,
            osimDepartmentName: memberForm.sekbid,
            isCashManager: pos.includes('bendahara'),
            cashManagerTitle: pos.includes('bendahara') ? 'Bendahara OSIM' : undefined
          };
          await updateUser(existingAccount.uid, updatedUserObj);
          if (syncUserFromCPanel) {
            try {
              await syncUserFromCPanel(updatedUserObj, existingAccount);
            } catch (e) {}
          }
        } else {
          const newUid = `user_osim_${memberForm.studentNis ? memberForm.studentNis.replace(/[^a-zA-Z0-9]/g, '') : Date.now()}`;
          const newUserObj: UserProfile = {
            uid: newUid,
            displayName: memberForm.fullName!,
            username: effectiveUsername,
            email: memberForm.email || `${effectiveUsername}@madrasah.sch.id`,
            password: passToSet,
            role: 'pengurus_osim',
            osimRole: osimRoleVal,
            osimPosition: memberForm.position,
            osimDepartmentName: memberForm.sekbid,
            osimDepartmentCode: sekbidNum ? `SEKBID-${sekbidNum}` : (isBph ? 'BPH' : undefined),
            status: memberForm.status || 'Aktif',
            isCashManager: pos.includes('bendahara'),
            cashManagerTitle: pos.includes('bendahara') ? 'Bendahara OSIM' : undefined,
            createdAt: new Date().toISOString()
          };
          await addUser(newUserObj);
          if (syncUserFromCPanel) {
            try {
              await syncUserFromCPanel(newUserObj);
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.error('Error saving member:', err);
    } finally {
      setIsMemberModalOpen(false);
      setSelectedMember(null);
    }
  };

  // Open modal to manage account for a specific member from card or table
  const handleOpenManageAccountForMember = (m: OsimMember, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const matched = findLinkedOsimAccount(m, osimAccounts);
    const fallbackPassword = getDefaultOsimPasswordForMember(m);
    const pos = (m.position || '').toLowerCase();

    if (matched) {
      setSelectedOsimAccount(matched);
      setIsAddingOsimAccount(false);
      const validPass = (matched.password && matched.password !== 'password') ? matched.password : (m.loginPassword || fallbackPassword);
      setOsimAccountForm({
        displayName: matched.displayName,
        username: matched.username || getDefaultOsimUsername(m),
        email: matched.email || '',
        password: validPass,
        osimRole: matched.osimRole || 'sekbid',
        osimPosition: matched.osimPosition || m.position,
        osimDepartmentName: matched.osimDepartmentName || m.sekbid,
        status: matched.status || 'Aktif',
        isCashManager: !!matched.isCashManager
      });
      setShowFormPassword(false);
      setIsOsimAccountModalOpen(true);
    } else {
      const defaultUsername = m.loginUsername || getDefaultOsimUsername(m);
      const defaultPass = m.loginPassword || fallbackPassword;

      const inferredRole: 'ketua' | 'wakil' | 'sekretaris' | 'bendahara' | 'sekbid' = 
        pos.includes('ketua') && !pos.includes('wakil') && !pos.includes('sekbid') ? 'ketua'
        : pos.includes('wakil') ? 'wakil'
        : pos.includes('sekretaris') ? 'sekretaris'
        : pos.includes('bendahara') ? 'bendahara'
        : 'sekbid';

      setSelectedOsimAccount(null);
      setIsAddingOsimAccount(true);
      setOsimAccountForm({
        displayName: m.fullName,
        username: defaultUsername,
        email: m.email || `${defaultUsername}@madrasah.sch.id`,
        password: defaultPass,
        osimRole: inferredRole,
        osimPosition: m.position,
        osimDepartmentName: m.sekbid,
        status: 'Aktif',
        isCashManager: pos.includes('bendahara')
      });
      setShowFormPassword(true);
      setIsOsimAccountModalOpen(true);
    }
  };

  const handleSelectStudentForAccount = (student: Student) => {
    setSelectedStudentForAccount(student);
    setIsChangingStudentForAccount(false);
    const firstName = student.fullName.toLowerCase().split(' ')[0].replace(/[^a-z0-9]/g, '');
    const cleanUsername = student.nis || `osim.${firstName}`;
    const cleanEmail = (student as any).email || `${student.nis || 'osim'}@madrasah.sch.id`;
    const defaultPassword = getDefaultOsimPassword(osimAccountForm.osimRole);
    setOsimAccountForm(prev => ({
      ...prev,
      displayName: student.fullName,
      username: cleanUsername,
      email: cleanEmail,
      password: defaultPassword
    }));
  };

  const handleOpenAddOsimAccount = () => {
    setSelectedOsimAccount(null);
    setIsAddingOsimAccount(true);
    setSelectedStudentForAccount(null);
    setIsChangingStudentForAccount(false);
    setAccountSelectedClassFilter('all');
    setAccountStudentSearchTerm('');
    const defaultPassword = getDefaultOsimPassword('sekbid1');
    setOsimAccountForm({
      displayName: '',
      username: '',
      email: '',
      password: defaultPassword,
      osimRole: 'sekbid',
      osimPosition: 'Anggota Sekbid',
      osimDepartmentName: 'Sekbid 1: Keimanan, Ketaqwaan & Moderasi Beragama',
      status: 'Aktif',
      isCashManager: false
    });
    setShowFormPassword(true);
    setIsOsimAccountModalOpen(true);
  };

  const handleOpenEditOsimAccount = (u: UserProfile) => {
    setSelectedOsimAccount(u);
    setIsAddingOsimAccount(false);
    setSelectedStudentForAccount(null);
    setIsChangingStudentForAccount(false);
    const validPass = (u.password && u.password !== 'password') 
      ? u.password 
      : getDefaultOsimPassword(u.osimDepartmentCode || u.osimRole || u.username);
    setOsimAccountForm({
      displayName: u.displayName,
      username: u.username || '',
      email: u.email || '',
      password: validPass,
      osimRole: u.osimRole || 'sekbid',
      osimPosition: u.osimPosition || 'Pengurus OSIM',
      osimDepartmentName: u.osimDepartmentName || 'BPH (Badan Pengurus Harian)',
      status: u.status || 'Aktif',
      isCashManager: !!u.isCashManager
    });
    setShowFormPassword(false);
    setIsOsimAccountModalOpen(true);
  };

  const handleSaveOsimAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!osimAccountForm.displayName.trim() || !osimAccountForm.username.trim()) {
      alert('Nama lengkap dan Username login akun wajib diisi.');
      return;
    }

    try {
      const cleanUsername = osimAccountForm.username.trim().toLowerCase();
      const cleanEmail = osimAccountForm.email.trim() || `${cleanUsername}@madrasah.sch.id`;
      const passToSet = osimAccountForm.password.trim() || 'password';

      if (isAddingOsimAccount) {
        const newUid = `user_osim_${Date.now()}`;
        const newAcc: UserProfile = {
          uid: newUid,
          displayName: osimAccountForm.displayName.trim(),
          username: cleanUsername,
          email: cleanEmail,
          password: passToSet,
          role: 'pengurus_osim',
          osimRole: osimAccountForm.osimRole,
          osimPosition: osimAccountForm.osimPosition,
          osimDepartmentName: osimAccountForm.osimDepartmentName,
          nip: selectedStudentForAccount?.nis || undefined,
          studentClass: selectedStudentForAccount?.className || undefined,
          phone: selectedStudentForAccount?.phone || undefined,
          status: osimAccountForm.status,
          isCashManager: osimAccountForm.isCashManager,
          cashManagerTitle: osimAccountForm.isCashManager ? 'Bendahara OSIM' : undefined,
          createdAt: new Date().toISOString()
        };
        const res = await addUser(newAcc);
        if (res.success) {
          // ALSO add to osimMembers in Struktur Kabinet so both sub-menus stay 100% in sync
          const sekbidNum = extractSekbidNumber(osimAccountForm.osimDepartmentName) || extractSekbidNumber(osimAccountForm.osimPosition);
          const isBph = osimAccountForm.osimRole !== 'sekbid';
          try {
            await addOsimMember({
              fullName: newAcc.displayName,
              studentNis: selectedStudentForAccount?.nis || '24251000',
              className: selectedStudentForAccount?.className || 'XI',
              position: newAcc.osimPosition as any,
              sekbid: (newAcc.osimDepartmentName as any) || (isBph ? 'BPH (Badan Pengurus Harian)' : (sekbidNum ? `Sekbid ${sekbidNum}` : 'Sekbid 1: Keimanan, Ketaqwaan & Moderasi Beragama')),
              phone: selectedStudentForAccount?.phone || '-',
              email: newAcc.email,
              photoUrl: selectedStudentForAccount?.photoUrl || '',
              status: newAcc.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
              period: activeAcademicYear,
              loginUsername: newAcc.username,
              loginPassword: newAcc.password,
              username: newAcc.username,
              password: newAcc.password
            });
          } catch (e) {
            console.warn('Note on addOsimMember sync:', e);
          }

          if (syncUserFromCPanel) {
            try {
              await syncUserFromCPanel(newAcc);
            } catch (e) {}
          }
          alert(`Akun login untuk ${newAcc.displayName} (@${newAcc.username}) berhasil ditambahkan dan disinkronkan ke Struktur Kabinet!\nPassword baru: "${newAcc.password}". Siswa dapat langsung login.`);
          setIsOsimAccountModalOpen(false);
        } else {
          alert(res.error || 'Gagal menambahkan akun OSIM.');
        }
      } else if (selectedOsimAccount) {
        const updatedData: Partial<UserProfile> = {
          displayName: osimAccountForm.displayName.trim(),
          username: cleanUsername,
          email: cleanEmail,
          password: passToSet,
          osimRole: osimAccountForm.osimRole,
          osimPosition: osimAccountForm.osimPosition,
          osimDepartmentName: osimAccountForm.osimDepartmentName,
          status: osimAccountForm.status,
          isCashManager: osimAccountForm.isCashManager,
          cashManagerTitle: osimAccountForm.isCashManager ? 'Bendahara OSIM' : undefined
        };
        const res = await updateUser(selectedOsimAccount.uid, updatedData);
        if (res.success) {
          const mergedAccount = { ...selectedOsimAccount, ...updatedData } as UserProfile;
          // Synchronize with osimMembers in Struktur Kabinet
          const linkedMember = osimMembers.find(m =>
            m.id === selectedOsimAccount.uid ||
            (m.loginUsername && selectedOsimAccount.username && m.loginUsername.toLowerCase() === selectedOsimAccount.username.toLowerCase()) ||
            (m.studentNis && selectedOsimAccount.nip && m.studentNis === selectedOsimAccount.nip) ||
            (m.fullName.toLowerCase().trim() === selectedOsimAccount.displayName.toLowerCase().replace(/\s*\(.*\)$/, '').trim())
          );
          if (linkedMember) {
            try {
              await updateOsimMember(linkedMember.id, {
                fullName: mergedAccount.displayName,
                position: mergedAccount.osimPosition as any,
                sekbid: (mergedAccount.osimDepartmentName as any) || linkedMember.sekbid,
                status: mergedAccount.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
                loginUsername: mergedAccount.username,
                loginPassword: mergedAccount.password,
                username: mergedAccount.username,
                password: mergedAccount.password
              });
            } catch (e) {
              console.warn('Note on updateOsimMember sync:', e);
            }
          }
          if (syncUserFromCPanel) {
            try {
              await syncUserFromCPanel(mergedAccount, selectedOsimAccount);
            } catch (e) {}
          }
          alert(`Akun & kata sandi untuk ${osimAccountForm.displayName} berhasil diperbarui dan disinkronkan ke Struktur Kabinet!\nKata sandi baru: "${passToSet}".`);
          setIsOsimAccountModalOpen(false);
        } else {
          alert(res.error || 'Gagal memperbarui akun OSIM.');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat menyimpan akun OSIM.');
    }
  };

  const handlePromptQuickResetOsimPassword = (u: UserProfile) => {
    setSelectedOsimAccount(u);
    setQuickResetPasswordText(u.password || 'password');
    setShowQuickResetText(false);
    setIsOsimAccountResetModalOpen(true);
  };

  const handleConfirmQuickResetOsimPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedOsimAccount) return;
    const u = selectedOsimAccount;
    const passToSet = quickResetPasswordText.trim() || 'password';
    const res = await resetUserPassword(u.uid, passToSet);
    if (res.success) {
      // Synchronize with osimMembers in Struktur Kabinet
      const linkedMember = osimMembers.find(m =>
        m.id === u.uid ||
        (m.loginUsername && u.username && m.loginUsername.toLowerCase() === u.username.toLowerCase()) ||
        (m.studentNis && u.nip && m.studentNis === u.nip) ||
        (m.fullName.toLowerCase().trim() === u.displayName.toLowerCase().replace(/\s*\(.*\)$/, '').trim())
      );
      if (linkedMember) {
        try {
          await updateOsimMember(linkedMember.id, {
            loginPassword: passToSet,
            password: passToSet
          });
        } catch (e) {}
      }

      if (syncUserFromCPanel) {
        try {
          await syncUserFromCPanel({ ...u, password: passToSet }, u);
        } catch (e) {}
      }
      alert(`Kata sandi akun ${u.displayName} (@${u.username}) berhasil diganti menjadi "${passToSet}"!\nPassword lama otomatis tergantikan.`);
      setIsOsimAccountResetModalOpen(false);
    } else {
      alert(res.error || 'Gagal mereset kata sandi.');
    }
  };

  const handlePromptDeleteOsimAccount = (u: UserProfile) => {
    setSelectedOsimAccount(u);
    setIsOsimAccountDeleteModalOpen(true);
  };

  const handleConfirmDeleteOsimAccount = async () => {
    if (!selectedOsimAccount) return;
    const u = selectedOsimAccount;
    const res = await deleteUser(u.uid);
    if (res.success) {
      if (syncDeleteUserFromCPanel) {
        try {
          await syncDeleteUserFromCPanel(u.uid, u);
        } catch (e) {}
      }
      // Also delete from osimMembers in Struktur Kabinet
      const linkedMember = osimMembers.find(m =>
        m.id === u.uid ||
        (m.loginUsername && u.username && m.loginUsername.toLowerCase() === u.username.toLowerCase()) ||
        (m.username && u.username && m.username.toLowerCase() === u.username.toLowerCase()) ||
        (m.studentNis && u.nip && m.studentNis === u.nip) ||
        (m.fullName.toLowerCase().trim() === u.displayName.toLowerCase().replace(/\s*\(.*\)$/, '').trim())
      );
      if (linkedMember) {
        try {
          await deleteOsimMember(linkedMember.id);
        } catch (e) {}
      }
      alert(`Akun ${u.displayName} telah dihapus dari sistem autentikasi dan disinkronkan ke Struktur Kabinet.`);
    } else {
      alert(res.error || 'Gagal menghapus akun.');
    }
    setIsOsimAccountDeleteModalOpen(false);
  };

  // Sync / Auto-generate accounts for members and departments with unique deterministic passwords
  const handleSyncAccountsFromStructure = async () => {
    setIsSyncingAccounts(true);
    try {
      // 1. Reconcile OSIM members with master students database to purge any stale duplicate records
      await reconcileOsimMembersWithMasterStudents();

      // 2. Sync to cPanel user accounts
      const count = await syncUsersFromOsim(osimDepartments, osimMembers);
      alert(`Sinkronisasi selesai! Berhasil membersihkan duplikat serta memperbarui & menyinkronkan ${count} data akun pengurus & sekbid OSIM ke cPanel Admin.`);
    } catch (err: any) {
      alert(`Gagal menyinkronkan akun: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSyncingAccounts(false);
    }
  };

  const handlePrintSlips = (target: 'all' | UserProfile) => {
    setPrintSlipTarget(target);
    setIsOsimPrintSlipsModalOpen(true);
  };

  const handleDeleteMemberConfirm = async () => {
    if (!canManageCabinetStructure) {
      alert('Akses Dibatasi: Anda tidak memiliki wewenang untuk menghapus pengurus kabinet.');
      setIsMemberDeleteOpen(false);
      return;
    }
    if (selectedMember) {
      try {
        const mem = selectedMember;
        await deleteOsimMember(mem.id);
        const linkedAccount = findLinkedOsimAccount(mem, allUsers) || osimAccounts.find(u =>
          u.uid === mem.id ||
          (u.username && mem.loginUsername && u.username.toLowerCase() === mem.loginUsername.toLowerCase()) ||
          (u.username && mem.username && u.username.toLowerCase() === mem.username.toLowerCase()) ||
          (u.nip && mem.studentNis && u.nip === mem.studentNis) ||
          (u.displayName.toLowerCase().replace(/\s*\(.*\)$/, '').trim() === mem.fullName.toLowerCase().trim())
        );
        if (linkedAccount) {
          await deleteUser(linkedAccount.uid);
          if (syncDeleteUserFromCPanel) {
            try {
              await syncDeleteUserFromCPanel(linkedAccount.uid, linkedAccount);
            } catch (e) {}
          }
        }
      } catch (err) {
        console.error('Error deleting member:', err);
      } finally {
        setIsMemberDeleteOpen(false);
        setSelectedMember(null);
      }
    }
  };

  // Department (Bidang / Sekbid) Handlers
  const handleOpenAddDept = () => {
    if (!canManageCabinetStructure) {
      alert('Akses Dibatasi: Akun anggota OSIM tidak memiliki akses untuk menambah bidang baru.');
      return;
    }
    setSelectedDept(null);
    const nextOrder = (osimDepartments?.length || 0) + 1;
    setDeptForm({
      name: `Sekbid ${nextOrder}: `,
      code: `SEKBID-${nextOrder}`,
      description: '',
      coordinatorName: '',
      sortOrder: nextOrder
    });
    setIsDeptModalOpen(true);
  };

  const handleOpenEditDept = (dept: OsimDepartment, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!canManageCabinetStructure) {
      alert('Akses Dibatasi: Akun anggota OSIM tidak memiliki akses untuk mengubah data bidang.');
      return;
    }
    setSelectedDept(dept);
    setDeptForm(dept);
    setIsDeptModalOpen(true);
  };

  const handleOpenDeleteDept = (dept: OsimDepartment, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!canManageCabinetStructure) {
      alert('Akses Dibatasi: Akun anggota OSIM tidak memiliki akses untuk menghapus bidang.');
      return;
    }
    setSelectedDept(dept);
    setIsDeptDeleteOpen(true);
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageCabinetStructure) {
      alert('Akses Dibatasi: Anda tidak memiliki wewenang untuk menyimpan perubahan bidang.');
      return;
    }
    if (!deptForm.name?.trim()) {
      alert('Mohon masukkan nama bidang / sekbid OSIM.');
      return;
    }
    try {
      if (selectedDept) {
        await updateOsimDepartment(selectedDept.id, {
          name: deptForm.name.trim(),
          code: deptForm.code?.trim() || selectedDept.code,
          description: deptForm.description?.trim() || '',
          coordinatorName: deptForm.coordinatorName?.trim() || '',
          sortOrder: Number(deptForm.sortOrder) || selectedDept.sortOrder
        });
      } else {
        await addOsimDepartment({
          name: deptForm.name.trim(),
          code: deptForm.code?.trim() || `SEKBID-${Date.now()}`,
          description: deptForm.description?.trim() || '',
          coordinatorName: deptForm.coordinatorName?.trim() || '',
          sortOrder: Number(deptForm.sortOrder) || ((osimDepartments?.length || 0) + 1)
        });
      }
    } catch (err) {
      console.error('Error saving department:', err);
    } finally {
      setIsDeptModalOpen(false);
      setSelectedDept(null);
    }
  };

  const handleDeleteDeptConfirm = async () => {
    if (!canManageCabinetStructure) {
      setIsDeptDeleteOpen(false);
      return;
    }
    if (selectedDept) {
      try {
        await deleteOsimDepartment(selectedDept.id);
      } catch (err) {
        console.error('Error deleting department:', err);
      } finally {
        setIsDeptDeleteOpen(false);
        setSelectedDept(null);
      }
    }
  };

  const handleResetDeptConfirm = async () => {
    if (!canManageCabinetStructure) {
      setIsDeptResetOpen(false);
      return;
    }
    try {
      await resetOsimDepartmentsToDefault();
    } catch (err) {
      console.error('Error resetting departments:', err);
    } finally {
      setIsDeptResetOpen(false);
    }
  };

  // Aspiration Handlers
  const handleOpenDetailAspiration = (asp: OsimAspiration, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedAspiration(asp);
    setIsAspirationDetailOpen(true);
  };

  const handleOpenDeleteAspiration = (asp: OsimAspiration, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedAspiration(asp);
    setIsAspirationDeleteOpen(true);
  };

  const handleDeleteAspirationConfirm = async () => {
    if (selectedAspiration) {
      try {
        await deleteOsimAspiration(selectedAspiration.id);
      } catch (err) {
        console.error('Error deleting aspiration:', err);
      } finally {
        setIsAspirationDeleteOpen(false);
        setSelectedAspiration(null);
      }
    }
  };

  const handleOpenAddAspiration = () => {
    setAspirationForm({
      studentName: currentUser?.displayName || 'Siswa Madrasah',
      studentClass: 'X RPL 1',
      date: new Date().toISOString().split('T')[0],
      title: '',
      content: '',
      category: 'Kegiatan & Acara',
      upvotes: 1,
      status: 'Ditampung',
      academicYear: activeAcademicYear
    });
    setIsAspirationModalOpen(true);
  };

  const handleSaveAspiration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aspirationForm.title || !aspirationForm.content) {
      alert('Mohon lengkapi judul aspirasi dan isi pesan.');
      return;
    }

    try {
      await addOsimAspiration({
        studentName: aspirationForm.studentName || 'Anonim / Siswa Madrasah',
        studentClass: aspirationForm.studentClass || 'Umum',
        date: aspirationForm.date || new Date().toISOString().split('T')[0],
        title: aspirationForm.title!,
        content: aspirationForm.content!,
        category: aspirationForm.category as any,
        upvotes: 1,
        status: 'Ditampung',
        academicYear: aspirationForm.academicYear || activeAcademicYear
      });
    } catch (err) {
      console.error('Error saving aspiration:', err);
    } finally {
      setIsAspirationModalOpen(false);
    }
  };

  const handleOpenResponseAspiration = (asp: OsimAspiration, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedAspiration(asp);
    setResponseNoteText(asp.responseNote || '');
    setResponseStatus(asp.status);
    setIsAspirationResponseOpen(true);
  };

  const handleSaveResponse = async () => {
    if (!selectedAspiration) return;
    try {
      await updateOsimAspiration(selectedAspiration.id, {
        status: responseStatus,
        responseNote: responseNoteText,
        respondedBy: currentUser?.displayName || 'Waka Kesiswaan / BPH OSIM',
        respondedAt: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error('Error saving response:', err);
    } finally {
      setIsAspirationResponseOpen(false);
      setSelectedAspiration(null);
    }
  };

  const handleUpvoteAspiration = async (asp: OsimAspiration, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateOsimAspiration(asp.id, {
      upvotes: (asp.upvotes || 0) + 1
    });
  };

  // Meeting Handlers
  const handleOpenDetailMeeting = (meet: OsimMeeting, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedMeeting(meet);
    setIsMeetingDetailOpen(true);
  };

  const handleOpenEditMeeting = (meet: OsimMeeting, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedMeeting(meet);
    setMeetingForm(meet);
    setIsMeetingModalOpen(true);
  };

  const handleOpenDeleteMeeting = (meet: OsimMeeting, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedMeeting(meet);
    setIsMeetingDeleteOpen(true);
  };

  const handleDeleteMeetingConfirm = async () => {
    if (selectedMeeting) {
      try {
        await deleteOsimMeeting(selectedMeeting.id);
      } catch (err) {
        console.error('Error deleting meeting:', err);
      } finally {
        setIsMeetingDeleteOpen(false);
        setSelectedMeeting(null);
      }
    }
  };

  const handleOpenAddMeeting = () => {
    setSelectedMeeting(null);
    setMeetingForm({
      title: '',
      type: 'Rapat Pleno Pengurus',
      date: new Date().toISOString().split('T')[0],
      startTime: '15:30',
      endTime: '17:00',
      location: 'Ruang Rapat OSIM & Kesiswaan',
      leader: 'Ketua Umum OSIM',
      secretary: 'Sekretaris Umum',
      attendeesCount: 25,
      agenda: '',
      decisionNotes: '',
      wakaNotes: '',
      academicYear: activeAcademicYear
    });
    setIsMeetingModalOpen(true);
  };

  const handleSaveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingForm.title || !meetingForm.agenda) {
      alert('Mohon isi nama pertemuan dan agenda rapat.');
      return;
    }

    try {
      if (selectedMeeting) {
        await updateOsimMeeting(selectedMeeting.id, meetingForm);
      } else {
        await addOsimMeeting({
          title: meetingForm.title!,
          type: meetingForm.type as any,
          date: meetingForm.date || new Date().toISOString().split('T')[0],
          startTime: meetingForm.startTime || '15:30',
          endTime: meetingForm.endTime || '17:00',
          location: meetingForm.location || 'Ruang Rapat OSIM',
          leader: meetingForm.leader || 'Ketua Umum OSIM',
          secretary: meetingForm.secretary || 'Sekretaris Umum',
          attendeesCount: Number(meetingForm.attendeesCount) || 20,
          agenda: meetingForm.agenda!,
          decisionNotes: meetingForm.decisionNotes || 'Rapat mufakat disetujui.',
          wakaNotes: meetingForm.wakaNotes || '',
          academicYear: meetingForm.academicYear || activeAcademicYear
        });
      }
    } catch (err) {
      console.error('Error saving meeting:', err);
    } finally {
      setIsMeetingModalOpen(false);
      setSelectedMeeting(null);
    }
  };

  // Helper status color
  const getStatusBadge = (status: OsimProgramStatus) => {
    switch (status) {
      case 'Selesai & Sah':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            SELESAI & SAH
          </span>
        );
      case 'Selesai':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            SELESAI
          </span>
        );
      case 'Menunggu Verifikasi LPJ':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 animate-pulse">
            <FileCheck className="w-3 h-3 text-purple-300" />
            MENUNGGU VERIFIKASI LPJ
          </span>
        );
      case 'Berlangsung':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 animate-pulse">
            <Clock className="w-3 h-3 text-sky-400" />
            BERLANGSUNG
          </span>
        );
      case 'Disetujui':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <CheckCircle2 className="w-3 h-3 text-indigo-400" />
            DISETUJUI PEMBINA
          </span>
        );
      case 'Revisi':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            PERLU REVISI
          </span>
        );
      case 'Diajukan':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Send className="w-3 h-3 text-amber-400" />
            DIAJUKAN KE PEMBINA
          </span>
        );
      case 'Draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
            <FileText className="w-3 h-3 text-zinc-400" />
            DRAFT
          </span>
        );
      case 'Dibatalkan':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3 text-rose-400" />
            DIBATALKAN
          </span>
        );
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-500/10 text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-5" id="osim-page-root">
      {/* Top Banner / Header Telemetry */}
      <div className="bg-[#121214] border border-zinc-800 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-wider text-zinc-100 uppercase">
                  Organisasi Siswa Intra Madrasah (OSIM)
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
                  INTRAKURIKULER
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-800 rounded">
                  T.A. {activeAcademicYear}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
                Pusat Komando Manajemen Organisasi Pelajar, Perencanaan Program Kerja Intrakurikuler, Struktur Kabinet OSIM, Sidang Pleno, dan Kanal Aspirasi Suara Santri.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ExportActions
              data={osimPrograms}
              filename={`Laporan_Program_Kerja_OSIM_${activeAcademicYear}`}
              title="Ekspor Proker"
            />
            {canManageOsim && (
              <button
                id="btn-add-proker-top"
                onClick={handleOpenAddProker}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold tracking-wide transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Tambah Proker OSIM
              </button>
            )}
          </div>
        </div>

        {/* Telemetry Metric Widgets */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-4 pt-3 border-t border-zinc-800/80 font-mono">
          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded">
            <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Total Proker OSIM</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold text-zinc-100">{osimPrograms.length}</span>
              <span className="text-[10px] text-amber-400">{completedProgramsCount} Selesai</span>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded">
            <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Proker Berjalan</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold text-sky-400">{activeProgramsCount}</span>
              <span className="text-[10px] text-zinc-400">Aktif</span>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded">
            <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Ketercapaian Progres</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold text-emerald-400">{avgProgress}%</span>
              <div className="w-12 bg-zinc-800 h-1.5 rounded-full overflow-hidden self-center">
                <div className="bg-emerald-500 h-full" style={{ width: `${avgProgress}%` }}></div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded">
            <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Total Anggaran (RAB)</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-bold text-zinc-200">Rp {(totalBudgetEst / 1000000).toFixed(1)}Jt</span>
              <span className="text-[10px] text-zinc-400">Total</span>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded">
            <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Pengurus Kabinet</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold text-indigo-400">{osimMembers.length}</span>
              <span className="text-[10px] text-zinc-400">{sortedDepartments.length || 8} Bidang</span>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded">
            <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Aspirasi Santri</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold text-amber-400">{osimAspirations.length}</span>
              <span className="text-[10px] text-emerald-400 font-sans">Kotak Suara</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-0.5">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            id="tab-osim-proker"
            onClick={() => setActiveSubTab('proker')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeSubTab === 'proker'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            Program Kerja Intrakurikuler ({osimPrograms.length})
          </button>

          <button
            id="tab-osim-struktur"
            onClick={() => setActiveSubTab('struktur')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeSubTab === 'struktur'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Struktur Kabinet & Bidang ({osimMembers.length})
          </button>

          <button
            id="tab-osim-sidang"
            onClick={() => setActiveSubTab('sidang')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeSubTab === 'sidang'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Sidang Pleno & Notulensi ({osimMeetings.length})
          </button>

          <button
            id="tab-osim-aspirasi"
            onClick={() => setActiveSubTab('aspirasi')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeSubTab === 'aspirasi'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Kotak Aspirasi Santri ({osimAspirations.length})
          </button>

          <button
            id="tab-osim-matriks"
            onClick={() => setActiveSubTab('matriks')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeSubTab === 'matriks'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Matriks Evaluasi & Anggaran
          </button>

          <button
            id="tab-osim-rekap-tahunan"
            onClick={() => setActiveSubTab('rekap_tahunan')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeSubTab === 'rekap_tahunan'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Rekap Tahunan Kesiswaan (Laporan Kamad) ({sahPrograms.length})
          </button>

          {canManageOsimAccounts && (
            <button
              id="tab-osim-akun-pengurus"
              onClick={() => setActiveSubTab('akun_pengurus')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                activeSubTab === 'akun_pengurus'
                  ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Kelola Akun & Password OSIM ({osimAccounts.length})</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold">
                PEMBINA
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================== */}
      {/* SUB-TAB 1: PROGRAM KERJA INTRAKURIKULER OSIM */}
      {/* ========================================================== */}
      {activeSubTab === 'proker' && (
        <OsimProkerTab
          hasSupervisionVeto={hasSupervisionVeto}
          pendingVerificationCount={pendingVerificationCount}
          pendingLpjCount={pendingLpjCount}
          setFilterStatus={setFilterStatus}
          isOsimBph={isOsimBph}
          currentUser={currentUser}
          isOsimKetua={isOsimKetua}
          isOsimWakil={isOsimWakil}
          isOsimSekretaris={isOsimSekretaris}
          isOsimBendahara={isOsimBendahara}
          isPengurusOsim={isPengurusOsim}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterSekbid={filterSekbid}
          setFilterSekbid={setFilterSekbid}
          filterStatus={filterStatus}
          sekbidList={sekbidList}
          canManageOsim={canManageOsim}
          onOpenAddProker={handleOpenAddProker}
          filteredPrograms={filteredPrograms}
          onOpenDetailProker={handleOpenDetailProker}
          getStatusBadge={getStatusBadge}
          onAjukanKePembina={handleAjukanKePembina}
          onOpenGuidanceModal={handleOpenGuidanceModal}
          onOpenLpjModal={handleOpenLpjModal}
          onOpenLockAndArchiveModal={handleOpenLockAndArchiveModal}
          onOpenVetoModal={handleOpenVetoModal}
          onOpenEditProker={handleOpenEditProker}
          onDeleteProker={(proker) => {
            setSelectedProker(proker);
            setIsProkerDeleteOpen(true);
          }}
        />
      )}

      {/* ========================================================== */}
      {/* SUB-TAB 2: STRUKTUR KABINET & SEKBID OSIM */}
      {/* ========================================================== */}
      {activeSubTab === 'struktur' && (
        <OsimStrukturTab
          canCrudMembers={canCrudMembers}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterSekbid={filterSekbid}
          setFilterSekbid={setFilterSekbid}
          sekbidList={sekbidList}
          canManageCabinetStructure={canManageCabinetStructure}
          onReconcileMembers={async () => {
            try {
              const count = await reconcileOsimMembersWithMasterStudents();
              alert(
                `Pembersihan tuntas! ${
                  count > 0
                    ? `${count} data pengurus usang/duplikat telah dibersihkan dan dihapus secara permanen.`
                    : 'Semua data pengurus OSIM telah sinkron sempurna dengan buku induk siswa (tidak ada duplikat).'
                }`
              );
            } catch (err: any) {
              alert(`Gagal rekonsiliasi: ${err?.message || 'Terjadi kesalahan'}`);
            }
          }}
          onOpenAddDept={handleOpenAddDept}
          onOpenAddMember={handleOpenAddMember}
          canManageOsimAccounts={canManageOsimAccounts}
          onNavigateToAccountsTab={() => setActiveSubTab('akun_pengurus')}
          isOsimMemberAccount={isOsimMemberAccount}
          schoolSetting={schoolSetting}
          teachers={teachers}
          getTeacherInitials={getTeacherInitials}
          osimMembers={osimMembers}
          onOpenAddBph={handleOpenAddBph}
          onOpenDetailMember={handleOpenDetailMember}
          onOpenManageAccountForMember={handleOpenManageAccountForMember}
          onOpenEditMember={handleOpenEditMember}
          onDeleteMember={(member) => {
            setSelectedMember(member);
            setIsMemberDeleteOpen(true);
          }}
          sortedDepartments={sortedDepartments}
          filteredMembers={filteredMembers}
          osimPrograms={osimPrograms}
          onResetDepartments={() => setIsDeptResetOpen(true)}
          onOpenAddDeptMember={handleOpenAddDeptMember}
          onOpenEditDept={handleOpenEditDept}
          onOpenDeleteDept={handleOpenDeleteDept}
        />
      )}

      {/* ========================================================== */}
      {/* SUB-TAB 3: SIDANG PLENO, MUKER & NOTULENSI */}
      {/* ========================================================== */}
      {activeSubTab === 'sidang' && (
        <div className="space-y-4" id="view-sidang-osim">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121214] border border-zinc-800 p-3 rounded">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase text-zinc-200">
                ARSIP SIDANG PLENO & NOTULENSI RAPAT OSIM
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Dokumentasi Berita Acara, Keputusan Mufakat MUKER, dan Pengesahan Program Kerja Kesiswaan.
              </p>
            </div>

            {canManageOsim && (
              <button
                onClick={handleOpenAddMeeting}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Catat Notulensi Baru
              </button>
            )}
          </div>

          <div className="space-y-3">
            {osimMeetings.map(meet => (
              <div
                key={meet.id}
                onClick={() => handleOpenDetailMeeting(meet)}
                className="bg-[#121214] border border-zinc-800 rounded-lg p-4 hover:border-amber-500/40 transition cursor-pointer group shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {meet.type}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">
                        📅 {meet.date} ({meet.startTime} - {meet.endTime} WIB)
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-zinc-100 group-hover:text-amber-400 mt-1.5 transition">{meet.title}</h3>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono">
                    <span>📍 {meet.location}</span>
                    <span>👥 {meet.attendeesCount} Peserta Hadir</span>
                    <div className="flex items-center gap-1 ml-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={e => handleOpenDetailMeeting(meet, e)}
                        className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition"
                        title="Lihat Detail Notulensi"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {canManageOsim && (
                        <>
                          <button
                            onClick={e => handleOpenEditMeeting(meet, e)}
                            className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-amber-400 transition"
                            title="Edit Notulensi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={e => handleOpenDeleteMeeting(meet, e)}
                            className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-rose-400 transition"
                            title="Hapus Notulensi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
                  <div className="bg-zinc-900/80 border border-zinc-800/80 rounded p-3">
                    <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-1">
                      AGENDA PEMBAHASAN:
                    </span>
                    <p className="text-zinc-300 leading-relaxed whitespace-pre-line line-clamp-3">{meet.agenda}</p>
                    <div className="mt-3 pt-2 border-t border-zinc-800 text-[11px] text-zinc-400">
                      Pimpinan Rapat: <strong className="text-zinc-200">{meet.leader}</strong> • Notulis: <strong className="text-zinc-200">{meet.secretary}</strong>
                    </div>
                  </div>

                  <div className="bg-zinc-900/80 border border-zinc-800/80 rounded p-3">
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 block mb-1">
                      HASIL KEPUTUSAN & MUFAKAT:
                    </span>
                    <p className="text-zinc-300 leading-relaxed whitespace-pre-line line-clamp-3">{meet.decisionNotes}</p>
                    {meet.wakaNotes && (
                      <div className="mt-3 pt-2 border-t border-zinc-800 text-[11px] text-amber-400/90 line-clamp-1">
                        Catatan Waka Kesiswaan: <em>"{meet.wakaNotes}"</em>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* SUB-TAB 4: KOTAK ASPIRASI SANTRI / SUARA SISWA */}
      {/* ========================================================== */}
      {activeSubTab === 'aspirasi' && (
        <div className="space-y-4" id="view-aspirasi-osim">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121214] border border-zinc-800 p-3 rounded">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase text-zinc-200">
                KOTAK SUARA & ASPIRASI SANTRI (OSIM DIGIVOICE)
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Kanal transparan penampungan ide kreatif, usulan sarpras, kritik membangun, dan gagasan kegiatan dari santri untuk OSIM & Madrasah.
              </p>
            </div>

            <button
              onClick={handleOpenAddAspiration}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition"
            >
              <Send className="w-3.5 h-3.5" />
              Kirim Aspirasi Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {osimAspirations.map(asp => (
              <div
                key={asp.id}
                onClick={() => handleOpenDetailAspiration(asp)}
                className="bg-[#121214] border border-zinc-800 rounded-lg p-4 flex flex-col justify-between hover:border-amber-500/40 transition cursor-pointer group shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {asp.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        asp.status === 'Direalisasikan'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : asp.status === 'Sedang Dibahas'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {asp.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-zinc-100 group-hover:text-amber-400 transition">{asp.title}</h4>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed line-clamp-3">{asp.content}</p>

                  <div className="mt-2 text-[10px] font-mono text-zinc-500">
                    Oleh: <span className="text-zinc-300">{asp.studentName}</span> ({asp.studentClass}) • {asp.date}
                  </div>

                  {asp.responseNote && (
                    <div className="mt-3 bg-zinc-900/90 border border-emerald-500/20 rounded p-2.5 text-xs text-emerald-300">
                      <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 block mb-0.5">
                        Tanggapan Resmi ({asp.respondedBy}):
                      </span>
                      <p className="text-zinc-300 text-[11px] leading-snug line-clamp-2">{asp.responseNote}</p>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={e => handleUpvoteAspiration(asp, e)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-zinc-800 text-xs font-mono transition"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Dukungan ({asp.upvotes || 1})</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={e => handleOpenDetailAspiration(asp, e)}
                      className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition"
                      title="Lihat Detail Aspirasi"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {canManageOsim && (
                      <>
                        <button
                          onClick={e => handleOpenResponseAspiration(asp, e)}
                          className="px-2.5 py-1 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 text-xs font-semibold transition"
                        >
                          Beri Respon
                        </button>
                        <button
                          onClick={e => handleOpenDeleteAspiration(asp, e)}
                          className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-rose-400 transition"
                          title="Hapus Aspirasi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* SUB-TAB 5: MATRIKS EVALUASI & ANGGARAN */}
      {/* ========================================================== */}
      {activeSubTab === 'matriks' && (
        <div className="space-y-4" id="view-matriks-osim">
          <div className="bg-[#121214] border border-zinc-800 p-4 rounded-lg">
            <h3 className="text-xs font-mono font-bold uppercase text-zinc-200 mb-1">
              MATRIKS ALOKASI ANGGARAN & STATUS PELAKSANAAN PROKER
            </h3>
            <p className="text-[11px] text-zinc-400">
              Evaluasi ketercapaian target indikator kinerja 8 Seksi Bidang OSIM Tahun Ajaran {activeAcademicYear}.
            </p>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/50">
                    <th className="p-2.5">Seksi Bidang</th>
                    <th className="p-2.5">Program Kerja</th>
                    <th className="p-2.5">PJ Pelaksana</th>
                    <th className="p-2.5">Estimasi Biaya</th>
                    <th className="p-2.5">Realisasi</th>
                    <th className="p-2.5">Progres</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-sans">
                  {osimPrograms.map(p => (
                    <tr key={p.id} className="hover:bg-zinc-900/40 transition">
                      <td className="p-2.5 text-[11px] font-mono text-zinc-400">{p.sekbid.split(':')[0]}</td>
                      <td className="p-2.5 font-bold text-zinc-200">{p.title}</td>
                      <td className="p-2.5 text-xs text-zinc-400">{p.personInCharge}</td>
                      <td className="p-2.5 text-xs font-mono text-amber-400">Rp {p.budgetEstimated.toLocaleString('id-ID')}</td>
                      <td className="p-2.5 text-xs font-mono text-zinc-300">Rp {(p.budgetRealized || 0).toLocaleString('id-ID')}</td>
                      <td className="p-2.5 text-xs font-mono text-emerald-400">{p.progressPercentage}%</td>
                      <td className="p-2.5">{getStatusBadge(p.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* SUB-TAB 6: REKAP TAHUNAN KESISWAAN (LAPORAN RESMI KAMAD) */}
      {/* ========================================================== */}
      {activeSubTab === 'rekap_tahunan' && (
        <div className="space-y-4" id="view-rekap-tahunan-osim">
          {/* Header Banner */}
          <div className="bg-[#121214] border border-emerald-500/30 rounded-lg p-4 shadow-sm relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold tracking-wide text-zinc-100 uppercase">
                      Rekapitulasi Tahunan Dokumen LPJ & Proker OSIM
                    </h2>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                      TERVALIDASI SAH
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
                    Arsip resmi seluruh program kerja OSIM yang telah tuntas dilaksanakan, ber-LPJ sah, dan divalidasi oleh Pembina OSIM & Waka Kesiswaan untuk Laporan Pertanggungjawaban kepada Kepala Madrasah / Sekolah Tahun Ajaran {activeAcademicYear}.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ExportActions
                  data={sahPrograms}
                  filename={`Rekap_Tahunan_LPJ_OSIM_${activeAcademicYear}`}
                  title="Ekspor Rekap"
                />
                <button
                  id="btn-print-rekap-kamad"
                  onClick={() => setIsAnnualReportPrintOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold tracking-wide transition shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Lembar Pengesahan Kamad
                </button>
              </div>
            </div>

            {/* Telemetry Metric Widgets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 mt-4 pt-3 border-t border-zinc-800/80 font-mono">
              <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded">
                <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Program Kerja Sah</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-emerald-400">{sahPrograms.length}</span>
                  <span className="text-[10px] text-zinc-400">dari {osimPrograms.length} ({Math.round((sahPrograms.length / (osimPrograms.length || 1)) * 100)}%)</span>
                </div>
              </div>

              <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded">
                <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Total Anggaran (RAB)</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-sm font-bold text-amber-400">Rp {rekapTotalRab.toLocaleString('id-ID')}</span>
                  <span className="text-[10px] text-zinc-400">Rencana</span>
                </div>
              </div>

              <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded">
                <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Total Realisasi Kas</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-sm font-bold text-zinc-100">Rp {rekapTotalRealized.toLocaleString('id-ID')}</span>
                  <span className="text-[10px] text-emerald-400">Terpakai</span>
                </div>
              </div>

              <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded">
                <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Efisiensi / Deviasi</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className={`text-sm font-bold ${rekapTotalRab >= rekapTotalRealized ? 'text-emerald-400' : 'text-rose-400'}`}>
                    Rp {(rekapTotalRab - rekapTotalRealized).toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {rekapTotalRab >= rekapTotalRealized ? 'Hemat' : 'Defisit'}
                  </span>
                </div>
              </div>

              <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded col-span-2 sm:col-span-4 lg:col-span-1">
                <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Total Partisipasi Santri</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-indigo-400">{rekapTotalParticipants}</span>
                  <span className="text-[10px] text-zinc-400">Peserta Hadir</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table of Certified & Archived Programs */}
          <div className="bg-[#121214] border border-zinc-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase text-zinc-200">
                  Daftar Program Kerja Berstatus "Selesai & Sah"
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Dokumen terarsip yang telah memenuhi seluruh syarat akuntabilitas LPJ, kwitansi biaya, dan bukti visual.
                </p>
              </div>
              <span className="text-xs text-zinc-400 font-mono">
                Menampilkan <strong className="text-emerald-400">{sahPrograms.length}</strong> dokumen sah
              </span>
            </div>

            {sahPrograms.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/60">
                      <th className="p-2.5">No</th>
                      <th className="p-2.5">Bidang OSIM</th>
                      <th className="p-2.5">Nama Program Kerja</th>
                      <th className="p-2.5">PJ / Pelaksana</th>
                      <th className="p-2.5 text-right">RAB (Rp)</th>
                      <th className="p-2.5 text-right">Realisasi (Rp)</th>
                      <th className="p-2.5 text-right">Efisiensi</th>
                      <th className="p-2.5 text-center">Partisipan</th>
                      <th className="p-2.5">Tanggal Sah</th>
                      <th className="p-2.5 text-center">Berkas & Bukti</th>
                      <th className="p-2.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-sans">
                    {sahPrograms.map((p, idx) => {
                      const est = p.budgetEstimated || 0;
                      const real = p.budgetRealized || 0;
                      const diff = est - real;
                      return (
                        <tr key={p.id} className="hover:bg-zinc-900/40 transition">
                          <td className="p-2.5 font-mono text-zinc-400">{idx + 1}</td>
                          <td className="p-2.5 text-[11px] font-mono text-zinc-300 font-semibold">
                            {p.sekbid.split(':')[0]}
                          </td>
                          <td className="p-2.5 font-bold text-zinc-100">
                            {p.title}
                          </td>
                          <td className="p-2.5 text-xs text-zinc-400">{p.personInCharge}</td>
                          <td className="p-2.5 text-right font-mono text-amber-400 font-semibold">
                            Rp {est.toLocaleString('id-ID')}
                          </td>
                          <td className="p-2.5 text-right font-mono text-zinc-200">
                            Rp {real.toLocaleString('id-ID')}
                          </td>
                          <td className={`p-2.5 text-right font-mono font-semibold ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            Rp {diff.toLocaleString('id-ID')}
                          </td>
                          <td className="p-2.5 text-center font-mono text-indigo-400">
                            {p.participantCount || 0} Siswa
                          </td>
                          <td className="p-2.5 text-xs font-mono text-zinc-400">
                            {p.finalApprovedAt || p.endDate || '-'}
                          </td>
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {p.lpjFileUrl ? (
                                <a
                                  href={p.lpjFileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-cyan-400 hover:text-cyan-300 transition"
                                  title="Lihat Berkas LPJ"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              ) : (
                                <span className="text-[10px] text-zinc-500 font-mono">-</span>
                              )}
                              {p.photos && p.photos.length > 0 && (
                                <span
                                  onClick={() => handleOpenDetailProker(p)}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-zinc-800 text-[10px] text-emerald-400 rounded cursor-pointer hover:bg-zinc-700 font-mono"
                                  title={`${p.photos.length} Foto Dokumentasi`}
                                >
                                  <ImageIcon className="w-3 h-3" />
                                  {p.photos.length}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => handleOpenDetailProker(p)}
                              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-emerald-400 rounded text-xs transition"
                            >
                              Detail LPJ
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-zinc-800 rounded p-6">
                <ShieldCheck className="w-9 h-9 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-zinc-300">Belum ada program kerja yang berstatus "Selesai & Sah".</p>
                <p className="text-[11px] text-zinc-500 mt-1 max-w-md mx-auto">
                  Setelah kegiatan selesai, siswa bidang mengisi LPJ & realisasi biaya. Pembina OSIM atau Waka Kesiswaan kemudian melakukan validasi akhir dan mengunci status program menjadi "Selesai & Sah".
                </p>
                <button
                  onClick={() => setActiveSubTab('proker')}
                  className="mt-3 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 rounded text-xs font-semibold transition"
                >
                  Buka Daftar Program Kerja
                </button>
              </div>
            )}
          </div>

          {/* Educational Workflow Card */}
          <div className="bg-[#121214] border border-zinc-800 p-4 rounded-lg">
            <h3 className="text-xs font-mono font-bold uppercase text-zinc-200 mb-3 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-400" />
              SOP Alur Akuntabilitas & Bimbingan Program Kerja OSIM
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded bg-zinc-900/60 border border-zinc-800/80">
                <div className="flex items-center gap-2 mb-1.5 text-amber-400 font-bold">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] font-mono border border-amber-500/40">1</span>
                  <span>Pengajuan Usulan (Siswa)</span>
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Pengurus bidang membuat proposal/rencana kegiatan dengan status awal <strong>Draft</strong>, menyusun estimasi RAB & indikator keberhasilan, lalu klik <strong>Ajukan ke Pembina</strong>.
                </p>
              </div>

              <div className="p-3 rounded bg-zinc-900/60 border border-zinc-800/80">
                <div className="flex items-center gap-2 mb-1.5 text-indigo-400 font-bold">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-mono border border-indigo-500/40">2</span>
                  <span>Bimbingan & Verifikasi (Pembina)</span>
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Pembina OSIM menerima notifikasi, memeriksa kelayakan rencana anggaran, memberikan catatan arahan/bimbingan, dan mengesahkan status menjadi <strong>Disetujui</strong>.
                </p>
              </div>

              <div className="p-3 rounded bg-zinc-900/60 border border-zinc-800/80">
                <div className="flex items-center gap-2 mb-1.5 text-emerald-400 font-bold">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-mono border border-emerald-500/40">3</span>
                  <span>Pelaporan LPJ & Arsip Sah (Kamad)</span>
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Siswa mengunggah foto, kwitansi realisasi, serta evaluasi. Pembina & Waka Kesiswaan mengunci status menjadi <strong>Selesai & Sah</strong> yang otomatis terakumulasi dalam Laporan Tahunan Kamad.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* SUB-TAB 7: MANAJEMEN AKUN & KATA SANDI LOGIN PENGURUS OSIM */}
      {/* ========================================================== */}
      {canManageOsimAccounts && activeSubTab === 'akun_pengurus' && (
        <OsimAkunPengurusTab
          osimMembers={osimMembers}
          osimAccounts={osimAccounts}
          filteredOsimAccounts={filteredOsimAccounts}
          unlinkedKabinetMembers={unlinkedKabinetMembers}
          isSyncingAccounts={isSyncingAccounts}
          onSyncAccountsFromStructure={handleSyncAccountsFromStructure}
          onPrintSlips={handlePrintSlips}
          onOpenAddOsimAccount={handleOpenAddOsimAccount}
          accountSearchQuery={accountSearchQuery}
          setAccountSearchQuery={setAccountSearchQuery}
          accountRoleFilter={accountRoleFilter}
          setAccountRoleFilter={setAccountRoleFilter}
          showAccountPasswords={showAccountPasswords}
          setShowAccountPasswords={setShowAccountPasswords}
          onPromptQuickResetOsimPassword={handlePromptQuickResetOsimPassword}
          onOpenEditOsimAccount={handleOpenEditOsimAccount}
          onPromptDeleteOsimAccount={handlePromptDeleteOsimAccount}
        />
      )}

      {/* Modal Tambah / Edit Proker */}
      <OsimProkerModal
        isOpen={isProkerModalOpen}
        onClose={() => setIsProkerModalOpen(false)}
        selectedProker={selectedProker}
        prokerForm={prokerForm}
        setProkerForm={setProkerForm}
        onSaveProker={handleSaveProker}
        isPengurusOsim={isPengurusOsim}
        isOsimBph={isOsimBph}
        sekbidList={sekbidList}
      />

      {/* Modal Detail Proker */}
      <OsimProkerDetailModal
        isOpen={isProkerDetailOpen}
        onClose={() => setIsProkerDetailOpen(false)}
        selectedProker={selectedProker}
        getStatusBadge={getStatusBadge}
        setSelectedPhotoPreview={setSelectedPhotoPreview}
        canManageOsim={canManageOsim}
        hasSupervisionVeto={hasSupervisionVeto}
        onAjukanKePembina={handleAjukanKePembina}
        onOpenGuidanceModal={handleOpenGuidanceModal}
        onOpenLpjModal={handleOpenLpjModal}
        onOpenLockAndArchiveModal={handleOpenLockAndArchiveModal}
        onOpenVetoModal={handleOpenVetoModal}
        onJumpToRekap={() => setActiveSubTab('rekap_tahunan')}
      />

      {/* MODAL 1: VERIFIKASI & BIMBINGAN (PEMBINA OSIM) */}
      <OsimGuidanceModal
        isOpen={isGuidanceModalOpen}
        onClose={() => setIsGuidanceModalOpen(false)}
        selectedProker={selectedProker}
        guidanceForm={guidanceForm}
        setGuidanceForm={setGuidanceForm}
        onSaveGuidance={handleSaveGuidance}
      />

      {/* MODAL 2: LAPORAN PERTANGGUNGJAWABAN (LPJ) & EVALUASI MANDIRI (SISWA) */}
      <OsimLpjModal
        isOpen={isLpjModalOpen}
        onClose={() => setIsLpjModalOpen(false)}
        selectedProker={selectedProker}
        lpjForm={lpjForm}
        setLpjForm={setLpjForm}
        onSubmitDraftLpj={handleSubmitDraftLpj}
        onPhotoUpload={handlePhotoUpload}
        onRemovePhoto={handleRemovePhoto}
      />

      {/* MODAL 3: PENGESAHAN AKHIR & PENGUNCIAN LPJ (PEMBINA & WAKA) */}
      <OsimValidateLpjModal
        isOpen={isValidatingLpjOpen}
        onClose={() => setIsValidatingLpjOpen(false)}
        selectedProker={selectedProker}
        validationRemarks={validationRemarks}
        setValidationRemarks={setValidationRemarks}
        onRejectLpj={handleRejectLpj}
        onConfirmLockAndArchive={handleConfirmLockAndArchive}
      />

      {/* MODAL 4: HAK VETO KESISWAAN (PEMBINA & WAKA & ADMIN) */}
      <OsimVetoModal
        isOpen={isVetoModalOpen}
        onClose={() => setIsVetoModalOpen(false)}
        selectedProker={selectedProker}
        vetoTargetStatus={vetoTargetStatus}
        setVetoTargetStatus={setVetoTargetStatus}
        vetoReason={vetoReason}
        setVetoReason={setVetoReason}
        onConfirmVeto={handleConfirmVeto}
        currentUser={currentUser}
        isSuperAdmin={isSuperAdmin}
        isWaka={isWaka}
      />

      {/* MODAL 5: CETAK LEMBAR PENGESAHAN LAPORAN TAHUNAN KESISWAAN (RESMI) */}
      <OsimAnnualReportPrintModal
        isOpen={isAnnualReportPrintOpen}
        onClose={() => setIsAnnualReportPrintOpen(false)}
        schoolSetting={schoolSetting}
        activeAcademicYear={activeAcademicYear}
        sahPrograms={sahPrograms}
        rekapTotalRab={rekapTotalRab}
        rekapTotalRealized={rekapTotalRealized}
      />

      {/* Lightbox Foto Preview */}
      {selectedPhotoPreview && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedPhotoPreview(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-zinc-950 p-2 rounded-lg border border-zinc-800" onClick={e => e.stopPropagation()}>
            <img src={selectedPhotoPreview} alt="Preview Dokumentasi" className="max-w-full max-h-[80vh] object-contain rounded" />
            <div className="flex items-center justify-between pt-2 px-1 text-xs text-zinc-400">
              <span>Dokumentasi Pelaksanaan Program Kerja OSIM</span>
              <button
                onClick={() => setSelectedPhotoPreview(null)}
                className="px-2.5 py-1 bg-zinc-800 text-zinc-200 rounded text-xs hover:bg-zinc-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Pengurus OSIM */}
      <OsimMemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        selectedMember={selectedMember}
        onSaveMember={handleSaveMember}
        memberSelectionMode={memberSelectionMode}
        setMemberSelectionMode={setMemberSelectionMode}
        isChangingSelectedStudent={isChangingSelectedStudent}
        setIsChangingSelectedStudent={setIsChangingSelectedStudent}
        memberForm={memberForm}
        setMemberForm={setMemberForm}
        selectedClassFilter={selectedClassFilter}
        setSelectedClassFilter={setSelectedClassFilter}
        studentSearchTerm={studentSearchTerm}
        setStudentSearchTerm={setStudentSearchTerm}
        filteredStudentsForOsim={filteredStudentsForOsim}
        classesWithCounts={classesWithCounts}
        osimMembers={osimMembers}
        onSelectStudentForMember={handleSelectStudentForMember}
        memberCategoryTab={memberCategoryTab}
        setMemberCategoryTab={setMemberCategoryTab}
        sekbidList={sekbidList}
        canManageOsimAccounts={canManageOsimAccounts}
        memberLoginUsername={memberLoginUsername}
        setMemberLoginUsername={setMemberLoginUsername}
        memberLoginPassword={memberLoginPassword}
        setMemberLoginPassword={setMemberLoginPassword}
        showMemberLoginPassword={showMemberLoginPassword}
        setShowMemberLoginPassword={setShowMemberLoginPassword}
      />

      {/* Modal Kirim Aspirasi Siswa */}
      <OsimAspirationModal
        isOpen={isAspirationModalOpen}
        onClose={() => setIsAspirationModalOpen(false)}
        aspirationForm={aspirationForm}
        setAspirationForm={setAspirationForm}
        onSaveAspiration={handleSaveAspiration}
      />

      {/* Modal Respon Aspirasi */}
      <OsimAspirationResponseModal
        isOpen={isAspirationResponseOpen}
        onClose={() => setIsAspirationResponseOpen(false)}
        selectedAspiration={selectedAspiration}
        responseStatus={responseStatus}
        setResponseStatus={setResponseStatus}
        responseNoteText={responseNoteText}
        setResponseNoteText={setResponseNoteText}
        onSaveResponse={handleSaveResponse}
      />

      {/* Modal Notulensi Rapat */}
      <OsimMeetingModal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        meetingForm={meetingForm}
        setMeetingForm={setMeetingForm}
        onSaveMeeting={handleSaveMeeting}
        isEditing={false}
      />

      {/* Modal Detail Pengurus OSIM */}
      <OsimMemberDetailModal
        isOpen={isMemberDetailOpen}
        onClose={() => setIsMemberDetailOpen(false)}
        selectedMember={selectedMember}
        activeAcademicYear={activeAcademicYear}
        canManageCabinetStructure={canManageCabinetStructure}
        canManageOsimAccounts={canManageOsimAccounts}
        onManageAccount={handleOpenManageAccountForMember}
        onEditMember={handleOpenEditMember}
        onDeleteMember={() => setIsMemberDeleteOpen(true)}
      />

      {/* Modal Detail Notulensi Sidang Pleno */}
      <OsimMeetingDetailModal
        isOpen={isMeetingDetailOpen}
        onClose={() => setIsMeetingDetailOpen(false)}
        selectedMeeting={selectedMeeting}
        canManageOsim={canManageOsim}
        onEditMeeting={handleOpenEditMeeting}
        onDeleteMeeting={handleOpenDeleteMeeting}
      />

      {/* Modal Detail Aspirasi Santri */}
      <OsimAspirationDetailModal
        isOpen={isAspirationDetailOpen}
        onClose={() => setIsAspirationDetailOpen(false)}
        selectedAspiration={selectedAspiration}
        canManageOsim={canManageOsim}
        onResponseAspiration={handleOpenResponseAspiration}
        onDeleteAspiration={handleOpenDeleteAspiration}
      />

      {/* Dialog Konfirmasi Hapus Proker */}
      <ConfirmDialog
        isOpen={isProkerDeleteOpen}
        onClose={() => setIsProkerDeleteOpen(false)}
        onConfirm={handleDeleteProkerConfirm}
        title="Hapus Program Kerja OSIM?"
        message={`Apakah Anda yakin ingin menghapus program kerja "${selectedProker?.title}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Proker"
        type="danger"
      />

      {/* Dialog Konfirmasi Hapus Pengurus */}
      <ConfirmDialog
        isOpen={isMemberDeleteOpen}
        onClose={() => setIsMemberDeleteOpen(false)}
        onConfirm={handleDeleteMemberConfirm}
        title="Hapus Pengurus OSIM?"
        message={`Apakah Anda yakin ingin menghapus "${selectedMember?.fullName}" dari struktur pengurus OSIM?`}
        confirmText="Hapus Pengurus"
        type="danger"
      />

      {/* Dialog Konfirmasi Hapus Notulensi Sidang */}
      <ConfirmDialog
        isOpen={isMeetingDeleteOpen}
        onClose={() => setIsMeetingDeleteOpen(false)}
        onConfirm={handleDeleteMeetingConfirm}
        title="Hapus Notulensi Sidang / Rapat?"
        message={`Apakah Anda yakin ingin menghapus arsip notulensi "${selectedMeeting?.title}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Notulensi"
        type="danger"
      />

      {/* Dialog Konfirmasi Hapus Aspirasi */}
      <ConfirmDialog
        isOpen={isAspirationDeleteOpen}
        onClose={() => setIsAspirationDeleteOpen(false)}
        onConfirm={handleDeleteAspirationConfirm}
        title="Hapus Aspirasi Santri?"
        message={`Apakah Anda yakin ingin menghapus aspirasi "${selectedAspiration?.title}"?`}
        confirmText="Hapus Aspirasi"
        type="danger"
      />

      {/* MODAL KELOLA / UBAH AKUN & PASSWORD PENGURUS OSIM (PEMBINA) */}
      <OsimAccountModal
        isOpen={isOsimAccountModalOpen}
        onClose={() => setIsOsimAccountModalOpen(false)}
        isAddingOsimAccount={isAddingOsimAccount}
        selectedOsimAccount={selectedOsimAccount}
        osimAccountForm={osimAccountForm}
        setOsimAccountForm={setOsimAccountForm}
        onSaveOsimAccount={handleSaveOsimAccount}
        showFormPassword={showFormPassword}
        setShowFormPassword={setShowFormPassword}
        osimDepartments={osimDepartments}
        osimAccounts={osimAccounts}
        selectedStudentForAccount={selectedStudentForAccount}
        isChangingStudentForAccount={isChangingStudentForAccount}
        setIsChangingStudentForAccount={setIsChangingStudentForAccount}
        filteredStudentsForAccount={filteredStudentsForAccount}
        classesWithCounts={classesWithCounts}
        accountSelectedClassFilter={accountSelectedClassFilter}
        setAccountSelectedClassFilter={setAccountSelectedClassFilter}
        accountStudentSearchTerm={accountStudentSearchTerm}
        setAccountStudentSearchTerm={setAccountStudentSearchTerm}
        onSelectStudentForAccount={handleSelectStudentForAccount}
      />

      {/* MODAL QUICK RESET PASSWORD OSIM */}
      <OsimQuickResetPasswordModal
        isOpen={isOsimAccountResetModalOpen}
        onClose={() => setIsOsimAccountResetModalOpen(false)}
        selectedOsimAccount={selectedOsimAccount}
        quickResetPasswordText={quickResetPasswordText}
        setQuickResetPasswordText={setQuickResetPasswordText}
        showQuickResetText={showQuickResetText}
        setShowQuickResetText={setShowQuickResetText}
        onConfirmReset={handleConfirmQuickResetOsimPassword}
      />

      {/* MODAL CETAK KARTU SLIP LOGIN AKUN PENGURUS OSIM (PDF / PRINT RESMI) */}
      <OsimPrintSlipsModal
        isOpen={isOsimPrintSlipsModalOpen}
        onClose={() => setIsOsimPrintSlipsModalOpen(false)}
        printSlipTarget={printSlipTarget}
        setPrintSlipTarget={setPrintSlipTarget}
        osimAccounts={osimAccounts}
        osimMembers={osimMembers}
        schoolSetting={schoolSetting}
        activeAcademicYear={activeAcademicYear}
      />

      {/* Dialog Konfirmasi Hapus Akun OSIM */}
      <ConfirmDialog
        isOpen={isOsimAccountDeleteModalOpen}
        onClose={() => setIsOsimAccountDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteOsimAccount}
        title="Hapus Akun Login Pengurus OSIM?"
        message={`Apakah Anda yakin ingin menghapus akun login untuk "${selectedOsimAccount?.displayName}" (@${selectedOsimAccount?.username})? Siswa tidak akan bisa login lagi dengan akun ini.`}
        confirmText="Hapus Akun"
        type="danger"
      />
    </div>
  );
};
