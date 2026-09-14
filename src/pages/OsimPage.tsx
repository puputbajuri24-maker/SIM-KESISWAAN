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
  const canManageOsim = isSupervisoryVetoAuthorized || isPengurusOsim;
  const canManageOsimAccounts = isPembinaOsim || isWakaOrAdmin;
  const isOsimTeacher = isSupervisoryVetoAuthorized;
  const hasSupervisionVeto = isSupervisoryVetoAuthorized;

  // Kebijakan Khusus RBAC Kesiswaan:
  // Seluruh akun anggota OSIM (baik BPH maupun Sekbid) TIDAK memiliki akses untuk CRUD (Create, Read, Update, Delete)
  // pada tab menu "Struktur Kabinet & Bidang", hanya diizinkan untuk melihat saja (Read-Only).
  // Hak akses CRUD struktur kabinet & bidang eksklusif dimiliki oleh Pembina OSIM, Waka Kesiswaan, dan Super Admin.
  const isOsimMemberAccount = Boolean(isPengurusOsim || currentUser?.role === 'pengurus_osim');
  const canManageCabinetStructure = !isOsimMemberAccount && Boolean(isSupervisoryVetoAuthorized || isPembinaOsim || isWakaOrAdmin);

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
    return allUsers.filter(u => u.role === 'pengurus_osim');
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

      const memberToSave: OsimMember = {
        ...memberForm,
        loginUsername: cleanUsername || undefined,
        loginPassword: passToSet,
        username: cleanUsername || undefined,
        password: passToSet
      } as OsimMember;

      if (selectedMember) {
        await updateOsimMember(selectedMember.id, memberToSave);
      } else {
        await addOsimMember({
          fullName: memberForm.fullName!,
          studentNis: memberForm.studentNis || '24251000',
          className: memberForm.className || 'X RPL 1',
          position: memberForm.position as any,
          sekbid: memberForm.sekbid as OsimSekbid,
          phone: memberForm.phone || '-',
          email: memberForm.email || '',
          photoUrl: memberForm.photoUrl || '',
          status: (memberForm.status as any) || 'Aktif',
          vision: memberForm.vision || '',
          flagshipProgram: memberForm.flagshipProgram || '',
          period: memberForm.period || activeAcademicYear,
          loginUsername: cleanUsername || undefined,
          loginPassword: passToSet,
          username: cleanUsername || undefined,
          password: passToSet
        });
      }

      // If Pembina OSIM or Admin changed or verified login credentials, synchronize with user accounts
      if (canManageOsimAccounts && cleanUsername) {
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

        if (existingAccount) {
          const updatedUserObj: UserProfile = {
            ...existingAccount,
            displayName: memberForm.fullName || existingAccount.displayName,
            username: cleanUsername,
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
          const newUid = `user_osim_${sekbidNum ? `dept_sekbid_${sekbidNum}` : Date.now()}`;
          const newUserObj: UserProfile = {
            uid: newUid,
            displayName: memberForm.fullName!,
            username: cleanUsername,
            email: memberForm.email || `${cleanUsername}@madrasah.sch.id`,
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
      const count = await syncUsersFromOsim(osimDepartments, osimMembers);
      alert(`Sinkronisasi selesai! Berhasil memperbarui & menyinkronkan ${count} data akun pengurus & sekbid OSIM dengan password spesifik per bidang ke cPanel Admin.`);
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

  const handleExecutePrintSlips = (targetAccs: UserProfile[]) => {
    const schoolName = schoolSetting?.name || 'MADRASAH ALIYAH NEGERI';
    const schoolAddress = schoolSetting?.address || 'Kementerian Agama Republik Indonesia';
    const schoolAcademic = activeAcademicYear || '2026/2027';

    const cardsHtml = targetAccs.map(acc => {
      const linkedMem = osimMembers.find(m =>
        m.id === acc.uid ||
        (m.loginUsername && acc.username && m.loginUsername.toLowerCase() === acc.username.toLowerCase()) ||
        (m.username && acc.username && m.username.toLowerCase() === acc.username.toLowerCase()) ||
        (m.studentNis && acc.nip && m.studentNis === acc.nip) ||
        (m.fullName.toLowerCase().trim() === acc.displayName.toLowerCase().replace(/\s*\(.*\)$/, '').trim())
      );
      const studentClass = linkedMem?.className || acc.studentClass || '-';
      const studentNis = linkedMem?.studentNis || acc.nip || '-';
      const position = linkedMem?.position || acc.osimPosition || 'Pengurus OSIM';
      const department = linkedMem?.sekbid || acc.osimDepartmentName || (acc.osimRole === 'ketua' || acc.osimRole === 'wakil' || acc.osimRole === 'sekretaris' || acc.osimRole === 'bendahara' ? 'BPH (Badan Pengurus Harian)' : 'Seksi Bidang OSIM');

      return `
        <div class="osim-card">
          <div class="card-header">
            <div class="brand-left">
              <div class="osim-badge">OSIM</div>
              <div class="school-titles">
                <h3>${schoolName}</h3>
                <p class="sub-title">KARTU AKSES LOGIN RESMI PENGURUS OSIM</p>
                <p class="academic-year">Tahun Ajaran ${schoolAcademic}</p>
              </div>
            </div>
            <div class="role-pill">${(acc.osimRole || 'SEKBID').toUpperCase()}</div>
          </div>

          <div class="student-info-grid">
            <div class="info-item full">
              <span class="label">Nama Pengurus:</span>
              <span class="value-name">${acc.displayName}</span>
            </div>
            <div class="info-item">
              <span class="label">NIS / NISN:</span>
              <span class="value font-mono">${studentNis}</span>
            </div>
            <div class="info-item">
              <span class="label">Kelas:</span>
              <span class="value font-mono">${studentClass}</span>
            </div>
            <div class="info-item full">
              <span class="label">Jabatan Kabinet:</span>
              <span class="value-pos">${position}</span>
            </div>
            <div class="info-item full">
              <span class="label">Seksi Bidang:</span>
              <span class="value-dept">${department}</span>
            </div>
          </div>

          <div class="login-box">
            <div class="login-box-header">
              <span>PORTAL SIM KESISWAAN</span>
              <span>HAK AKSES RESMI</span>
            </div>
            <div class="credentials-row">
              <div class="cred-col">
                <span class="cred-label">USERNAME LOGIN</span>
                <span class="cred-val username">@${acc.username}</span>
              </div>
              <div class="cred-col">
                <span class="cred-label">KATA SANDI (PASSWORD)</span>
                <span class="cred-val password">${acc.password || 'password'}</span>
              </div>
            </div>
            <div class="login-notice">Wewenang: Program Kerja, Agenda & Buku Kas OSIM</div>
          </div>

          <div class="rules-section">
            <div class="rules-title">Ketentuan Keamanan:</div>
            <ol>
              <li>Rahasiakan username dan kata sandi dari pihak lain.</li>
              <li>Perubahan kata sandi hanya dapat dilakukan oleh Pembina OSIM / Admin.</li>
              <li>Segera lapor Pembina jika terjadi kendala login atau akses akun.</li>
            </ol>
          </div>

          <div class="signature-section">
            <div class="sig-col">
              <div class="sig-title">Mengetahui,</div>
              <div class="sig-role">Waka Kesiswaan</div>
              <div class="sig-name" style="margin-top: 38px; font-weight: bold; text-decoration: underline;">${schoolSetting?.wakaKesiswaanName || schoolSetting?.wakaName || '...........................................'}</div>
              <div class="sig-nip">${schoolSetting?.wakaNip ? 'NIP. ' + schoolSetting.wakaNip : 'NIP. ............................'}</div>
            </div>
            <div class="sig-stamp">
              <div class="stamp-circle">CAP RESMI<br/>MADRASAH</div>
            </div>
            <div class="sig-col">
              <div class="sig-title">${(schoolSetting as any)?.city || (schoolSetting?.address ? schoolSetting.address.split(',')[0] : 'Madrasah')}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div class="sig-role">Pembina OSIM</div>
              <div class="sig-name" style="margin-top: 38px; font-weight: bold; text-decoration: underline;">${schoolSetting?.pembinaOsim || '...........................................'}</div>
              <div class="sig-nip">${schoolSetting?.pembinaOsimNip ? 'NIP. ' + schoolSetting.pembinaOsimNip : 'NIP. ............................'}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Kartu Akses Login Pengurus OSIM - ${schoolName}</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 8mm 8mm;
              }
              * { box-sizing: border-box; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 0;
                background: #ffffff;
                color: #111827;
              }
              .cards-sheet {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 6mm;
                padding: 4mm;
              }
              .osim-card {
                border: 2px solid #b45309;
                border-radius: 8px;
                padding: 10px 12px;
                background: #ffffff;
                page-break-inside: avoid;
                position: relative;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
              }
              .card-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 2px solid #d97706;
                padding-bottom: 6px;
                margin-bottom: 8px;
              }
              .brand-left {
                display: flex;
                align-items: center;
                gap: 8px;
              }
              .osim-badge {
                width: 28px;
                height: 28px;
                background: #b45309;
                color: #ffffff;
                font-weight: 900;
                font-size: 11px;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                letter-spacing: 0.5px;
              }
              .school-titles h3 {
                margin: 0;
                font-size: 11px;
                font-weight: 800;
                text-transform: uppercase;
                color: #92400e;
                line-height: 1.2;
              }
              .sub-title {
                margin: 1px 0 0 0;
                font-size: 8.5px;
                font-weight: 700;
                letter-spacing: 0.4px;
                color: #374151;
              }
              .academic-year {
                margin: 0;
                font-size: 8px;
                color: #6b7280;
              }
              .role-pill {
                padding: 3px 6px;
                background: #fef3c7;
                border: 1px solid #f59e0b;
                color: #92400e;
                font-size: 8.5px;
                font-weight: 800;
                border-radius: 4px;
                letter-spacing: 0.3px;
              }
              .student-info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 4px 8px;
                font-size: 10px;
                margin-bottom: 8px;
              }
              .info-item {
                display: flex;
                flex-direction: column;
              }
              .info-item.full {
                grid-column: span 2;
              }
              .label {
                font-size: 8px;
                text-transform: uppercase;
                color: #6b7280;
                font-weight: 600;
              }
              .value-name {
                font-size: 11px;
                font-weight: 800;
                color: #111827;
              }
              .value-pos {
                font-size: 10px;
                font-weight: 700;
                color: #b45309;
              }
              .value-dept {
                font-size: 9.5px;
                color: #374151;
              }
              .value {
                font-size: 10px;
                color: #111827;
                font-weight: 600;
              }
              .font-mono {
                font-family: ui-monospace, monospace;
              }
              .login-box {
                background: #fffbeb;
                border: 1.5px solid #fcd34d;
                border-radius: 6px;
                padding: 6px 8px;
                margin-bottom: 8px;
              }
              .login-box-header {
                display: flex;
                justify-content: space-between;
                font-size: 7.5px;
                font-weight: 800;
                color: #b45309;
                letter-spacing: 0.5px;
                border-bottom: 1px solid #fef3c7;
                padding-bottom: 2px;
                margin-bottom: 4px;
              }
              .credentials-row {
                display: flex;
                justify-content: space-between;
                gap: 8px;
              }
              .cred-col {
                flex: 1;
              }
              .cred-label {
                display: block;
                font-size: 7.5px;
                color: #78350f;
                font-weight: 700;
              }
              .cred-val {
                font-family: ui-monospace, monospace;
                font-size: 12px;
                font-weight: 800;
                display: inline-block;
                padding: 1px 4px;
                border-radius: 3px;
              }
              .cred-val.username {
                color: #1e3a8a;
                background: #eff6ff;
                border: 1px solid #bfdbfe;
              }
              .cred-val.password {
                color: #991b1b;
                background: #fef2f2;
                border: 1px solid #fecaca;
              }
              .login-notice {
                font-size: 8px;
                color: #92400e;
                margin-top: 3px;
                font-style: italic;
              }
              .rules-section {
                font-size: 8px;
                color: #4b5563;
                margin-bottom: 8px;
                line-height: 1.3;
              }
              .rules-title {
                font-weight: 700;
                color: #374151;
              }
              .rules-section ol {
                margin: 1px 0 0 0;
                padding-left: 14px;
              }
              .signature-section {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                font-size: 8px;
                border-top: 1px dashed #d1d5db;
                padding-top: 6px;
                margin-top: auto;
              }
              .sig-col {
                text-align: center;
                width: 38%;
              }
              .sig-title {
                font-size: 7.5px;
                color: #6b7280;
              }
              .sig-role {
                font-weight: 700;
                color: #111827;
                margin-bottom: 24px;
              }
              .sig-line {
                border-bottom: 1px solid #111827;
                margin-bottom: 1px;
              }
              .sig-nip {
                font-size: 7px;
                color: #6b7280;
              }
              .sig-stamp {
                text-align: center;
                width: 24%;
              }
              .stamp-circle {
                border: 1.5px dashed #9ca3af;
                border-radius: 50%;
                width: 36px;
                height: 36px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 6px;
                color: #9ca3af;
                font-weight: 700;
                text-align: center;
                line-height: 1.1;
              }
            </style>
          </head>
          <body>
            <div class="cards-sheet">
              ${cardsHtml}
            </div>
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      window.print();
    }
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
        <div className="space-y-4" id="view-proker-osim">
          {/* Notification banner for Supervisi & Hak Veto (Pembina OSIM, Waka Kesiswaan & Admin App) */}
          {hasSupervisionVeto && (pendingVerificationCount > 0 || pendingLpjCount > 0) && (
            <div className="bg-amber-950/25 border border-amber-500/40 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-zinc-200">
                  <strong className="text-amber-400">Supervisi & Hak Veto Kesiswaan:</strong> Terdapat{' '}
                  {pendingVerificationCount > 0 && (
                    <span className="font-semibold text-amber-300 underline underline-offset-2">
                      {pendingVerificationCount} pengajuan usulan baru
                    </span>
                  )}
                  {pendingVerificationCount > 0 && pendingLpjCount > 0 && ' dan '}
                  {pendingLpjCount > 0 && (
                    <span className="font-semibold text-purple-300 underline underline-offset-2">
                      {pendingLpjCount} draft LPJ kegiatan
                    </span>
                  )}{' '}
                  yang menunggu verifikasi atau validasi Anda.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {pendingVerificationCount > 0 && (
                  <button
                    onClick={() => setFilterStatus('Diajukan')}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium text-[11px] shadow-sm transition"
                  >
                    Tinjau Usulan ({pendingVerificationCount})
                  </button>
                )}
                {pendingLpjCount > 0 && (
                  <button
                    onClick={() => setFilterStatus('Menunggu Verifikasi LPJ')}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium text-[11px] shadow-sm transition"
                  >
                    Validasi LPJ ({pendingLpjCount})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Model A: Banner Komando Pengurus Inti (BPH: Ketua, Wakil, Sekretaris, Bendahara) */}
          {isOsimBph && (
            <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Crown className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-emerald-300">Model A: Akun Fungsional Pengurus Inti OSIM (BPH)</strong>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {currentUser?.osimPosition || (isOsimKetua ? 'Ketua OSIM' : isOsimWakil ? 'Wakil Ketua' : isOsimSekretaris ? 'Sekretaris' : isOsimBendahara ? 'Bendahara' : 'BPH')}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-[11px] mt-0.5">
                    Sebagai Pengurus Inti, Anda memiliki wewenang lintas Sekbid untuk memantau proposal, menyusun proker, dan mendampingi pelaksanaan kegiatan bersama Pembina OSIM.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Banner Anggota OSIM - Seksi Bidang (Sekbid) */}
          {isPengurusOsim && !isOsimBph && (
            <div className="bg-sky-950/20 border border-sky-500/40 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-md bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-sky-300">Akun Fungsional Seksi Bidang (Sekbid) OSIM</strong>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {currentUser?.osimDepartmentName || currentUser?.osimPosition || 'Seksi Bidang OSIM'}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-[11px] mt-0.5">
                    Sebagai pelaksana program spesifik, Anda dapat menginput draf proposal kegiatan khusus untuk bidang Anda, absensi kegiatan, dan dokumentasi/laporan keuangan mini. Sesuai batasan keamanan RBAC, akses ke data nilai, pelanggaran, atau catatan BK siswa lain tertutup total.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121214] border border-zinc-800 p-3 rounded">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Cari program kerja intrakurikuler, penanggung jawab, atau sekbid..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={filterSekbid}
                onChange={e => setFilterSekbid(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="all">Semua Sekbid & BPH</option>
                {sekbidList.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="all">Semua Status Proker</option>
                <option value="Draft">Draft (Usulan Awal)</option>
                <option value="Diajukan">Diajukan ke Pembina</option>
                <option value="Revisi">Perlu Revisi</option>
                <option value="Disetujui">Disetujui Pembina</option>
                <option value="Berlangsung">Sedang Berlangsung</option>
                <option value="Menunggu Verifikasi LPJ">Menunggu Verifikasi LPJ</option>
                <option value="Selesai & Sah">Selesai & Sah (Terarsip)</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>

              {canManageOsim && (
                <button
                  onClick={handleOpenAddProker}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Baru
                </button>
              )}
            </div>
          </div>

          {/* Proker Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPrograms.map(proker => (
              <div
                key={proker.id}
                onClick={() => handleOpenDetailProker(proker)}
                className="bg-[#121214] border border-zinc-800 hover:border-amber-500/40 rounded-lg p-4 transition cursor-pointer flex flex-col justify-between group shadow-sm relative"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 line-clamp-1">
                      {proker.sekbid.split(':')[0]}
                    </span>
                    {getStatusBadge(proker.status)}
                  </div>

                  <h3 className="font-bold text-sm text-zinc-100 group-hover:text-amber-400 transition leading-snug">
                    {proker.title}
                  </h3>

                  <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {proker.description || proker.successIndicator}
                  </p>

                  {/* Catatan Pembina banner if exists */}
                  {proker.guidanceNotes && (
                    <div className="mt-2.5 p-2 bg-amber-950/20 border border-amber-500/30 rounded text-[11px] text-amber-300/90 leading-relaxed">
                      <div className="font-semibold text-amber-400 flex items-center gap-1 text-[10px] uppercase">
                        <MessageSquare className="w-3 h-3" />
                        Catatan Bimbingan ({proker.verifiedBy || 'Pembina'}):
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-zinc-300">{proker.guidanceNotes}</p>
                    </div>
                  )}

                  {/* Intervensi Hak Veto banner if vetoed */}
                  {proker.vetoedBy && (
                    <div className="mt-2.5 p-2 bg-rose-950/30 border border-rose-500/40 rounded text-[11px] text-rose-300 leading-relaxed">
                      <div className="font-bold text-rose-400 flex items-center gap-1 text-[10px] uppercase">
                        <ShieldAlert className="w-3 h-3 text-rose-400" />
                        Intervensi Hak Veto ({proker.vetoedBy}):
                      </div>
                      <p className="mt-0.5 text-zinc-300 text-[10px]">
                        {proker.vetoReason || 'Keputusan hak veto diberlakukan oleh otoritas kesiswaan/admin.'}
                      </p>
                    </div>
                  )}

                  {/* Pengesahan stamp if Selesai & Sah */}
                  {proker.status === 'Selesai & Sah' && (
                    <div className="mt-2.5 p-2 bg-emerald-950/20 border border-emerald-500/30 rounded text-[11px] text-emerald-300 leading-relaxed flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-[10px] text-zinc-300 font-mono">
                        Disahkan: {proker.finalApprovedAt || '-'} • Masuk Rekap Tahunan
                      </span>
                    </div>
                  )}

                  <div className="mt-3 space-y-1.5 text-[11px] text-zinc-400 border-t border-zinc-800/80 pt-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">PJ / Pelaksana:</span>
                      <span className="text-zinc-200 font-medium truncate max-w-[170px]">{proker.personInCharge}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Waktu & Lokasi:</span>
                      <span className="text-zinc-300 font-mono text-[10px] truncate max-w-[170px]">{proker.startDate} • {proker.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">RAB / Realisasi:</span>
                      <div className="text-right font-mono text-[11px]">
                        <span className="text-amber-400 font-semibold">Rp {proker.budgetEstimated.toLocaleString('id-ID')}</span>
                        {proker.budgetRealized > 0 && (
                          <span className="text-zinc-400 ml-1">/ <strong className="text-emerald-400">Rp {proker.budgetRealized.toLocaleString('id-ID')}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress bar & Contextual Actions */}
                <div className="mt-3 pt-2.5 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
                    <span>Progress Ketercapaian</span>
                    <span className="font-bold text-zinc-200">{proker.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        proker.progressPercentage >= 100
                          ? 'bg-emerald-500'
                          : proker.progressPercentage >= 50
                          ? 'bg-sky-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${proker.progressPercentage}%` }}
                    ></div>
                  </div>

                  {/* Contextual Workflow Action Buttons */}
                  <div className="mt-3 pt-2 border-t border-zinc-800/40 flex items-center justify-between gap-1" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Siswa Action: Ajukan ke Pembina if Draft or Revisi */}
                      {(proker.status === 'Draft' || proker.status === 'Revisi') && canManageOsim && (
                        <button
                          onClick={e => handleAjukanKePembina(proker, e)}
                          className="flex items-center gap-1 px-2 py-0.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 rounded text-[10px] font-semibold transition"
                          title="Ajukan Usulan Proker ke Pembina OSIM"
                        >
                          <Send className="w-3 h-3" />
                          Ajukan ke Pembina
                        </button>
                      )}

                      {/* Supervisi Action: Verifikasi & Bimbingan */}
                      {hasSupervisionVeto && (proker.status === 'Diajukan' || proker.status === 'Draft' || proker.status === 'Revisi') && (
                        <button
                          onClick={e => handleOpenGuidanceModal(proker, e)}
                          className="flex items-center gap-1 px-2 py-0.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded text-[10px] font-semibold transition"
                          title="Bimbingan & Verifikasi Usulan (Pembina, Waka & Admin)"
                        >
                          <FileCheck className="w-3 h-3" />
                          Bimbingan
                        </button>
                      )}

                      {/* Siswa Action: Pelaksanaan & Kirim LPJ */}
                      {(proker.status === 'Disetujui' || proker.status === 'Berlangsung') && canManageOsim && (
                        <button
                          onClick={e => handleOpenLpjModal(proker, e)}
                          className="flex items-center gap-1 px-2 py-0.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 rounded text-[10px] font-semibold transition"
                          title="Isi LPJ, Realisasi Biaya & Upload Foto"
                        >
                          <Upload className="w-3 h-3" />
                          Pelaporan LPJ
                        </button>
                      )}

                      {/* Supervisi Action: Validasi LPJ & Kunci Sah */}
                      {hasSupervisionVeto && (proker.status === 'Menunggu Verifikasi LPJ' || proker.status === 'Berlangsung') && (
                        <button
                          onClick={e => handleOpenLockAndArchiveModal(proker, e)}
                          className="flex items-center gap-1 px-2 py-0.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded text-[10px] font-semibold transition"
                          title="Validasi LPJ dan Kunci Sah (Pembina, Waka & Admin)"
                        >
                          <Lock className="w-3 h-3" />
                          Validasi Sah
                        </button>
                      )}

                      {/* Supervisi Action: Hak Veto Resmi */}
                      {hasSupervisionVeto && proker.status !== 'Draft' && (
                        <button
                          onClick={e => handleOpenVetoModal(proker, e)}
                          className="flex items-center gap-1 px-2 py-0.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded text-[10px] font-semibold transition"
                          title="Pemberlakuan Hak Veto Kesiswaan (Revisi Darurat / Pembatalan)"
                        >
                          <ShieldAlert className="w-3 h-3 text-rose-400" />
                          Hak Veto
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {(hasSupervisionVeto || isOsimBph) && (
                        <button
                          onClick={e => handleOpenEditProker(proker, e)}
                          className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 transition"
                          title="Edit Proker"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {hasSupervisionVeto && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedProker(proker);
                            setIsProkerDeleteOpen(true);
                          }}
                          className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-rose-400 transition"
                          title="Hapus Proker"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPrograms.length === 0 && (
            <div className="text-center py-12 bg-[#121214] border border-zinc-800 rounded-lg p-6">
              <Target className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-300">Tidak ada program kerja intrakurikuler yang sesuai.</p>
              <p className="text-xs text-zinc-500 mt-1">Coba sesuaikan kata kunci pencarian atau ganti filter seksi bidang.</p>
              {canManageOsim && (
                <button
                  onClick={handleOpenAddProker}
                  className="mt-4 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold"
                >
                  Tambah Program Kerja Baru
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* SUB-TAB 2: STRUKTUR KABINET & SEKBID OSIM */}
      {/* ========================================================== */}
      {activeSubTab === 'struktur' && (
        <div className="space-y-5" id="view-struktur-osim">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#121214] border border-zinc-800 p-3 rounded">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Cari pengurus OSIM berdasarkan nama, NIS, kelas, atau jabatan..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterSekbid}
                onChange={e => setFilterSekbid(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="all">Semua Bidang & BPH</option>
                {sekbidList.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {canManageCabinetStructure && (
                <>
                  <button
                    onClick={handleOpenAddDept}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded text-xs font-semibold transition"
                    title="Tambah Bidang / Sekbid Baru sesuai kebijakan sekolah"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Bidang
                  </button>
                  <button
                    onClick={handleOpenAddMember}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Pengurus
                  </button>
                </>
              )}

              {canManageCabinetStructure && canManageOsimAccounts && (
                <button
                  onClick={() => setActiveSubTab('akun_pengurus')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded text-xs font-semibold transition whitespace-nowrap shadow-xs"
                  title="Kelola Akun & Kata Sandi Login Anggota OSIM"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Kelola Akun & Password
                </button>
              )}
            </div>
          </div>

          {/* Banner Informasi Akses Read-Only untuk Akun Anggota OSIM */}
          {isOsimMemberAccount && (
            <div className="bg-[#121214] border border-sky-500/30 rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-2.5 text-sky-300">
                <div className="p-2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sky-200">Hak Akses Anggota OSIM: Lihat Struktur Kabinet (Read-Only)</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Seluruh akun anggota OSIM hanya memiliki hak akses melihat profil, kontak, dan tupoksi struktur kabinet & bidang. Penambahan, pengeditan, atau penghapusan pengurus/bidang merupakan hak prerogatif Pembina OSIM & Waka Kesiswaan.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-sky-500/15 border border-sky-500/30 text-[10px] font-mono font-bold text-sky-300 shrink-0">
                HANYA LIHAT (READ-ONLY)
              </span>
            </div>
          )}

          {/* Dewan Pembina & Penasihat Intrakurikuler (Synced with Dewan Guru & School Settings) */}
          <div className="bg-[#121214] border border-indigo-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-indigo-400">
                  DEWAN PEMBINA & PENASIHAT INTRAKURIKULER (OSIM)
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                ⚡ Tersinkronisasi Otomatis dari Dewan Guru
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Penanggung Jawab / Kepala Madrasah */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                  PENANGGUNG JAWAB UTAMA
                </span>
                <h4 className="font-bold text-xs text-zinc-100 mt-2">{schoolSetting?.principalName || 'Kepala Madrasah'}</h4>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">NIP: {schoolSetting?.principalNip || '-'}</p>
                <p className="text-[10px] text-zinc-500 mt-1">Kepala Madrasah Aliyah</p>
              </div>

              {/* Pengarah / Waka Kesiswaan */}
              <div className="bg-zinc-900/90 border border-amber-500/30 rounded-lg p-3">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  SUPERVISI & HAK VETO
                </span>
                <h4 className="font-bold text-xs text-zinc-100 mt-2">{schoolSetting?.wakaKesiswaanName || schoolSetting?.wakaName || 'Waka Kesiswaan'}</h4>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">NIP: {schoolSetting?.wakaNip || '-'}</p>
                <p className="text-[10px] text-amber-400 mt-1">Waka Bidang Kesiswaan</p>
              </div>

              {/* Pembina Resmi OSIM */}
              <div className="bg-zinc-900/90 border border-indigo-500/30 rounded-lg p-3">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  PEMBINA & BIMBINGAN HARIAN
                </span>
                {(() => {
                  const pembinaName = schoolSetting?.pembinaOsim || teachers.find(t => t.role?.toLowerCase().includes('osim'))?.fullName || 'Belum Ditetapkan';
                  const initials = getTeacherInitials(pembinaName);

                  return (
                    <div className="flex items-center gap-2.5 mt-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 border border-indigo-400 text-white font-black font-mono text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-zinc-100 truncate">{pembinaName}</h4>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          NIP: {schoolSetting?.pembinaOsimNip || teachers.find(t => t.role?.toLowerCase().includes('osim'))?.nip || '-'}
                        </p>
                      </div>
                    </div>
                  );
                })()}
                <p className="text-[10px] text-indigo-400 mt-2">Pembina Harian Organisasi Siswa</p>
              </div>

              {/* Admin App (Super Admin) */}
              <div className="bg-zinc-900/90 border border-rose-500/30 rounded-lg p-3">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  ADMIN APP • SUPERVISI & VETO
                </span>
                <div className="flex items-center gap-2.5 mt-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-amber-600 border border-rose-400 text-white font-black font-mono text-xs flex items-center justify-center shrink-0 shadow-xs">
                    ADM
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs text-zinc-100 truncate">Administrator Aplikasi</h4>
                    <p className="text-[10px] text-zinc-400 font-mono">Super Admin Madrasah</p>
                  </div>
                </div>
                <p className="text-[10px] text-rose-400 mt-2">Hak Veto, Intervensi & Audit Sistem</p>
              </div>
            </div>
          </div>

          {/* Badan Pengurus Harian (BPH) Highlight Section */}
          <div className="bg-[#121214] border border-amber-500/30 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-amber-400">
                  BADAN PENGURUS HARIAN (BPH OSIM)
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-zinc-400">Ketua Umum, Wakil, Sekretaris & Bendahara</span>
                {canManageCabinetStructure && (
                  <button
                    onClick={handleOpenAddBph}
                    className="px-2.5 py-1 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition"
                    title="Tambah Pengurus Badan Pengurus Harian (BPH)"
                  >
                    <Plus className="w-3 h-3" />
                    Tambah BPH
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {osimMembers
                .filter(m => m.sekbid === 'BPH (Badan Pengurus Harian)' || m.position.toLowerCase().includes('ketua') || m.position.toLowerCase().includes('sekretaris') || m.position.toLowerCase().includes('bendahara'))
                .map(bph => (
                  <div
                    key={bph.id}
                    onClick={() => handleOpenDetailMember(bph)}
                    className="bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 rounded-lg p-3.5 transition flex flex-col justify-between cursor-pointer group shadow-sm"
                  >
                    <div>
                      <div className="flex items-start gap-3 mb-2">
                        {bph.photoUrl ? (
                          <img
                            src={bph.photoUrl}
                            alt={bph.fullName}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-full object-cover border border-amber-500/40 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30 shrink-0 text-sm">
                            {bph.fullName.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            {bph.position}
                          </span>
                          <h4 className="font-bold text-xs text-zinc-100 group-hover:text-amber-400 mt-1 truncate transition">{bph.fullName}</h4>
                          <p className="text-[10px] text-zinc-400 font-mono">{bph.className} • NIS {bph.studentNis}</p>
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-400 italic mt-2 line-clamp-2 border-t border-zinc-800 pt-2">
                        "{bph.vision || 'Mewujudkan visi madrasah berprestasi'}"
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                      <span className="text-zinc-500 font-mono">📱 {bph.phone}</span>
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={e => handleOpenDetailMember(bph, e)}
                          className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition"
                          title="Lihat Detail Pengurus"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        {canManageCabinetStructure && (
                          <>
                            {canManageOsimAccounts && (
                              <button
                                onClick={e => handleOpenManageAccountForMember(bph, e)}
                                className="p-1 rounded bg-zinc-800 text-amber-400 hover:bg-amber-500/20 transition"
                                title="Kelola Akun & Kata Sandi Siswa"
                              >
                                <Key className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={e => handleOpenEditMember(bph, e)}
                              className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-amber-400 transition"
                              title="Edit Pengurus"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedMember(bph);
                                setIsMemberDeleteOpen(true);
                              }}
                              className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-rose-400 transition"
                              title="Hapus Pengurus"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Dynamic Cabinet Structure & Fields / Divisions Management */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-mono font-bold uppercase text-zinc-200 tracking-wider">
                    STRUKTUR BIDANG & DEWAN SEKSI BIDANG ({sortedDepartments.length} Bidang Terdaftar)
                  </h3>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Struktur bidang dapat disesuaikan, ditambah, diubah, atau dihapus secara dinamis oleh Pembina OSIM sesuai kebijakan sekolah.
                </p>
              </div>

              {canManageCabinetStructure && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsDeptResetOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-mono transition"
                    title="Kembalikan struktur bidang ke standar (8 Sekbid)"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset 8 Sekbid
                  </button>
                  <button
                    onClick={handleOpenAddDept}
                    className="flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Bidang Baru
                  </button>
                </div>
              )}
            </div>

            {/* Department Accordions / Cards */}
            <div className="space-y-4">
              {sortedDepartments
                .filter(dept => filterSekbid === 'all' || dept.name === filterSekbid)
                .map(dept => {
                  const deptMembers = filteredMembers.filter(m => m.sekbid === dept.name);
                  const deptPrograms = osimPrograms.filter(p => p.sekbid === dept.name);

                  return (
                    <div
                      key={dept.id}
                      className="bg-[#121214] border border-zinc-800 rounded-lg overflow-hidden shadow-sm hover:border-zinc-700 transition"
                    >
                      {/* Department Header */}
                      <div className="p-3.5 bg-zinc-900/70 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs shrink-0">
                            {dept.code}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-zinc-100">{dept.name}</h4>
                            {dept.description && (
                              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{dept.description}</p>
                            )}
                            <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400 mt-1.5">
                              {dept.coordinatorName && (
                                <span>Koordinator: <strong className="text-zinc-200">{dept.coordinatorName}</strong></span>
                              )}
                              <span>• {deptMembers.length} Pengurus</span>
                              <span>• {deptPrograms.length} Proker</span>
                            </div>
                          </div>
                        </div>

                        {canManageCabinetStructure && (
                          <div className="flex items-center gap-1.5 self-end md:self-center">
                            <button
                              onClick={() => handleOpenAddDeptMember(dept.name)}
                              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 text-xs font-semibold flex items-center gap-1 transition"
                              title="Tambah pengurus ke bidang ini"
                            >
                              <Plus className="w-3 h-3" />
                              Tambah Pengurus
                            </button>
                            <button
                              onClick={(e) => handleOpenEditDept(dept, e)}
                              className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-amber-400 transition"
                              title="Edit Nama / Data Bidang"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleOpenDeleteDept(dept, e)}
                              className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-rose-400 transition"
                              title="Hapus Bidang Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Department Members List */}
                      <div className="p-3.5">
                        {deptMembers.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {deptMembers.map(member => (
                              <div
                                key={member.id}
                                onClick={() => handleOpenDetailMember(member)}
                                className="bg-zinc-900/90 border border-zinc-800/90 hover:border-zinc-700 rounded-lg p-3 transition flex flex-col justify-between cursor-pointer group shadow-sm"
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                      {member.position}
                                    </span>
                                    <span className="text-[9px] font-mono text-zinc-500">
                                      NIS {member.studentNis}
                                    </span>
                                  </div>

                                  <h5 className="font-bold text-xs text-zinc-100 group-hover:text-amber-400 transition">
                                    {member.fullName}
                                  </h5>
                                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                    {member.className}
                                  </p>

                                  {member.flagshipProgram && (
                                    <div className="mt-2 bg-zinc-900 border border-zinc-800 rounded p-1.5 text-[10px]">
                                      <span className="text-amber-400 font-semibold block text-[9px]">Program Kerja:</span>
                                      <span className="text-zinc-300 line-clamp-1">{member.flagshipProgram}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                                  <span className="text-zinc-500 font-mono">{member.phone}</span>
                                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                    <button
                                      onClick={e => handleOpenDetailMember(member, e)}
                                      className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition"
                                      title="Lihat Detail Pengurus"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </button>
                                    {canManageCabinetStructure && (
                                      <>
                                        {canManageOsimAccounts && (
                                          <button
                                            onClick={e => handleOpenManageAccountForMember(member, e)}
                                            className="p-1 rounded bg-zinc-800 text-amber-400 hover:bg-amber-500/20 transition"
                                            title="Kelola Akun & Kata Sandi Siswa"
                                          >
                                            <Key className="w-3 h-3" />
                                          </button>
                                        )}
                                        <button
                                          onClick={e => handleOpenEditMember(member, e)}
                                          className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-amber-400 transition"
                                          title="Edit"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={e => {
                                            e.stopPropagation();
                                            setSelectedMember(member);
                                            setIsMemberDeleteOpen(true);
                                          }}
                                          className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-rose-400 transition"
                                          title="Hapus"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 border border-dashed border-zinc-800 rounded-lg">
                            <p className="text-xs text-zinc-500">Belum ada pengurus yang terdaftar di bidang ini.</p>
                            {canManageCabinetStructure && (
                              <button
                                onClick={() => handleOpenAddDeptMember(dept.name)}
                                className="mt-2 text-xs text-amber-400 hover:underline font-semibold inline-flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Tambah Pengurus Pertama untuk Bidang Ini
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
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
        <div className="space-y-4" id="view-akun-pengurus-osim">
          {/* Policy & Authority Banner */}
          <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900/90 to-zinc-900 border border-amber-500/40 p-4 rounded-lg shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shrink-0 mt-0.5">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                      Pusat Manajemen Akun & Kata Sandi Login Pengurus OSIM
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      HAK AKSES PEMBINA & ADMIN
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed">
                    Sesuai kebijakan madrasah: Siswa pengurus OSIM <strong>dilarang dan ditiadakan fitur ganti password mandiri</strong>. Pembina OSIM dan Admin App memegang kendali penuh atas akun dan kata sandi login anggota OSIM. Setiap perubahan kata sandi langsung aktif secara <em>real-time</em> dan password lama otomatis tidak berlaku lagi.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
                <button
                  type="button"
                  onClick={handleSyncAccountsFromStructure}
                  disabled={isSyncingAccounts}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition disabled:opacity-50"
                  title="Otomatis buatkan akun bagi pengurus yang belum memiliki kredensial"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAccounts ? 'animate-spin text-amber-400' : 'text-zinc-400'}`} />
                  Sinkronisasi dari Anggota ({osimMembers.length})
                </button>

                <button
                  type="button"
                  onClick={() => handlePrintSlips('all')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition"
                  title="Cetak kartu slip login resmi untuk dibagikan ke siswa pengurus"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-400" />
                  Cetak Kartu Login
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddOsimAccount}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Tambah Akun Pengurus
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
            <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded">
              <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Total Akun Login OSIM</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold text-zinc-100">{osimAccounts.length}</span>
                <span className="text-[10px] text-amber-400 font-sans">Terdaftar</span>
              </div>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded">
              <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Akun BPH (Inti)</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold text-amber-400">
                  {osimAccounts.filter(u => u.osimRole === 'ketua' || u.osimRole === 'wakil' || u.osimRole === 'sekretaris' || u.osimRole === 'bendahara').length}
                </span>
                <span className="text-[10px] text-zinc-400 font-sans">Ketua, Sekr, Bend</span>
              </div>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded">
              <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Akun Sekbid / Koord</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold text-sky-400">
                  {osimAccounts.filter(u => u.osimRole === 'sekbid').length}
                </span>
                <span className="text-[10px] text-zinc-400 font-sans">Bidang</span>
              </div>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded">
              <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Status Akun Aktif</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold text-emerald-400">
                  {osimAccounts.filter(u => (u.status || 'Aktif') === 'Aktif').length}
                </span>
                <span className="text-[10px] text-emerald-400 font-sans">Bisa Login</span>
              </div>
            </div>
          </div>

          {/* Banner Status Sinkronisasi Struktur Kabinet */}
          {unlinkedKabinetMembers.length > 0 ? (
            <div className="bg-amber-950/30 border border-amber-500/40 p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <RefreshCw className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-300">Sinkronisasi Struktur Kabinet Belum Lengkap</h4>
                  <p className="text-[11px] text-zinc-300 mt-0.5">
                    Terdapat <strong className="text-amber-400">{unlinkedKabinetMembers.length} anggota</strong> di sub-menu <strong>Struktur Kabinet</strong> yang belum memiliki akun login resmi.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSyncAccountsFromStructure}
                disabled={isSyncingAccounts}
                className="px-3.5 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shrink-0 shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAccounts ? 'animate-spin' : ''}`} />
                <span>Sinkronkan {unlinkedKabinetMembers.length} Akun Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="bg-emerald-950/20 border border-emerald-500/30 px-3.5 py-2.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Seluruh anggota di <strong>Struktur Kabinet OSIM</strong> telah 100% tersinkron dengan sub-menu <strong>Kelola Akun</strong> dan cPanel Admin.</span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-emerald-400 shrink-0">
                ✓ Sinkronisasi Optimal
              </span>
            </div>
          )}

          {/* Search, Filter & Show Password Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#121214] border border-zinc-800 p-3 rounded">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Cari akun berdasarkan nama, username, jabatan atau seksi bidang..."
                value={accountSearchQuery}
                onChange={e => setAccountSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded p-0.5">
                <button
                  type="button"
                  onClick={() => setAccountRoleFilter('all')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    accountRoleFilter === 'all'
                      ? 'bg-amber-500 text-zinc-950 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Semua ({osimAccounts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAccountRoleFilter('bph')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    accountRoleFilter === 'bph'
                      ? 'bg-amber-500 text-zinc-950 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  BPH
                </button>
                <button
                  type="button"
                  onClick={() => setAccountRoleFilter('sekbid')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    accountRoleFilter === 'sekbid'
                      ? 'bg-amber-500 text-zinc-950 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Sekbid
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowAccountPasswords(!showAccountPasswords)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-semibold transition ${
                  showAccountPasswords
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
                title="Tampilkan kata sandi teks terbuka untuk pengawasan pembina"
              >
                {showAccountPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showAccountPasswords ? 'Tutup Password' : 'Lihat Password'}</span>
              </button>
            </div>
          </div>

          {/* Accounts List / Table */}
          {filteredOsimAccounts.length === 0 ? (
            <div className="bg-[#121214] border border-dashed border-zinc-800 rounded-lg p-10 text-center">
              <Key className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-400 font-medium">Tidak ada akun pengurus OSIM yang cocok dengan pencarian.</p>
              <p className="text-xs text-zinc-500 mt-1">Gunakan tombol "Sinkronisasi dari Anggota" untuk membuatkan akun otomatis dari daftar anggota yang ada.</p>
            </div>
          ) : (
            <div className="bg-[#121214] border border-zinc-800 rounded-lg overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 uppercase font-mono text-[10px]">
                      <th className="py-2.5 px-3">Nama & Jabatan Pengurus</th>
                      <th className="py-2.5 px-3">Username Login</th>
                      <th className="py-2.5 px-3">Kata Sandi Login</th>
                      <th className="py-2.5 px-3">Seksi Bidang</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Aksi Pembina</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredOsimAccounts.map(u => {
                      const isBph = u.osimRole === 'ketua' || u.osimRole === 'wakil' || u.osimRole === 'sekretaris' || u.osimRole === 'bendahara';
                      const linkedMem = osimMembers.find(m =>
                        m.id === u.uid ||
                        (m.loginUsername && u.username && m.loginUsername.toLowerCase() === u.username.toLowerCase()) ||
                        (m.username && u.username && m.username.toLowerCase() === u.username.toLowerCase()) ||
                        (m.studentNis && u.nip && m.studentNis === u.nip) ||
                        (m.fullName.toLowerCase().trim() === u.displayName.toLowerCase().replace(/\s*\(.*\)$/, '').trim())
                      );

                      return (
                        <tr key={u.uid} className="hover:bg-zinc-900/40 transition">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isBph
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                              }`}>
                                {u.displayName.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-zinc-100 truncate">{u.displayName}</div>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                                    isBph
                                      ? 'bg-amber-500/15 text-amber-300 font-bold'
                                      : 'bg-zinc-800 text-zinc-400'
                                  }`}>
                                    {u.osimPosition || (isBph ? 'BPH OSIM' : 'Pengurus Sekbid')}
                                  </span>
                                  {linkedMem ? (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                                      ✓ Kabinet: {linkedMem.className} (NIS: {linkedMem.studentNis || '-'})
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-zinc-800 text-zinc-400 font-mono">
                                      {u.studentClass ? `Kelas ${u.studentClass}` : 'Data Mandiri'}
                                    </span>
                                  )}
                                  {u.isCashManager && (
                                    <span className="px-1 py-0.2 rounded text-[9px] bg-emerald-500/15 text-emerald-400 font-mono font-bold">
                                      KAS
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-mono text-zinc-200 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                              @{u.username}
                            </span>
                            <div className="text-[10px] text-zinc-500 mt-1 font-mono truncate max-w-[150px]">
                              {u.email}
                            </div>
                          </td>

                          <td className="py-3 px-3 font-mono">
                            <div className="flex items-center gap-2">
                              {showAccountPasswords ? (
                                <span className="text-emerald-400 font-bold bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/30">
                                  {u.password || 'password'}
                                </span>
                              ) : (
                                <span className="text-zinc-500">••••••••</span>
                              )}
                              <button
                                type="button"
                                onClick={() => handlePromptQuickResetOsimPassword(u)}
                                className="p-1 rounded hover:bg-zinc-800 text-amber-400 transition"
                                title="Ganti Kata Sandi Siswa"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-zinc-300">
                            <span className="line-clamp-1 max-w-[200px]" title={u.osimDepartmentName || '-'}>
                              {u.osimDepartmentName || (isBph ? 'Badan Pengurus Harian' : '-')}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              (u.status || 'Aktif') === 'Aktif'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {u.status || 'Aktif'}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handlePrintSlips(u)}
                                className="px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold flex items-center gap-1 transition"
                                title="Cetak Kartu Login Siswa Ini"
                              >
                                <Printer className="w-3 h-3 text-indigo-400" />
                                <span>Cetak</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handlePromptQuickResetOsimPassword(u)}
                                className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1 transition"
                                title="Ganti Password"
                              >
                                <Key className="w-3 h-3" />
                                <span>Password</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditOsimAccount(u)}
                                className="p-1.5 rounded bg-zinc-800 text-zinc-300 hover:text-white transition"
                                title="Edit Akun & Wewenang"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handlePromptDeleteOsimAccount(u)}
                                className="p-1.5 rounded bg-zinc-800 text-rose-400 hover:text-rose-300 transition"
                                title="Hapus Akun"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Tambah / Edit Proker */}
      <Modal
        isOpen={isProkerModalOpen}
        onClose={() => setIsProkerModalOpen(false)}
        title={selectedProker ? 'Ubah Program Kerja OSIM' : 'Tambah Program Kerja Intrakurikuler Baru'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveProker} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1">Nama Program Kerja / Kegiatan *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Latihan Dasar Kepemimpinan Santri (LDKS 2026)"
                value={prokerForm.title}
                onChange={e => setProkerForm({ ...prokerForm, title: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-zinc-300">Seksi Bidang Penanggung Jawab *</label>
                {isPengurusOsim && !isOsimBph && (
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                    🔒 Terkunci (Bidang Sendiri)
                  </span>
                )}
              </div>
              <select
                value={prokerForm.sekbid}
                disabled={isPengurusOsim && !isOsimBph}
                onChange={e => setProkerForm({ ...prokerForm, sekbid: e.target.value as OsimSekbid })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {sekbidList.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {isPengurusOsim && !isOsimBph && (
                <p className="text-[10px] text-zinc-400 mt-1">
                  Sesuai matriks privilege RBAC, pengurus Sekbid menginput draf kegiatan khusus untuk bidangnya sendiri.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Penanggung Jawab (PJ) Pelaksana</label>
              <input
                type="text"
                placeholder="Nama Ketua Panitia / Sekbid"
                value={prokerForm.personInCharge}
                onChange={e => setProkerForm({ ...prokerForm, personInCharge: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Tanggal Mulai Pelaksanaan *</label>
              <input
                type="date"
                required
                value={prokerForm.startDate}
                onChange={e => setProkerForm({ ...prokerForm, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Tanggal Selesai (Opsional)</label>
              <input
                type="date"
                value={prokerForm.endDate || ''}
                onChange={e => setProkerForm({ ...prokerForm, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Lokasi Pelaksanaan *</label>
              <input
                type="text"
                required
                placeholder="Aula Utama / Lapangan / Wisma"
                value={prokerForm.location}
                onChange={e => setProkerForm({ ...prokerForm, location: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Estimasi Anggaran (RAB Rp) *</label>
              <input
                type="number"
                required
                min={0}
                value={prokerForm.budgetEstimated}
                onChange={e => setProkerForm({ ...prokerForm, budgetEstimated: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Status Program Kerja</label>
              <select
                value={prokerForm.status}
                onChange={e => setProkerForm({ ...prokerForm, status: e.target.value as OsimProgramStatus })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Draft">Draft</option>
                <option value="Diajukan">Diajukan</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Berlangsung">Berlangsung</option>
                <option value="Selesai">Selesai</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Progress Ketercapaian ({prokerForm.progressPercentage}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={prokerForm.progressPercentage || 0}
                onChange={e => setProkerForm({ ...prokerForm, progressPercentage: Number(e.target.value) })}
                className="w-full accent-amber-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1">Indikator Keberhasilan (KPI Target)</label>
              <input
                type="text"
                placeholder="Target capaian kuantitatif/kualitatif kegiatan"
                value={prokerForm.successIndicator}
                onChange={e => setProkerForm({ ...prokerForm, successIndicator: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1">Deskripsi & Rincian Teknis Kegiatan</label>
              <textarea
                rows={3}
                placeholder="Penjelasan latar belakang, konsep acara, dan tahapan eksekusi..."
                value={prokerForm.description}
                onChange={e => setProkerForm({ ...prokerForm, description: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Bagian LPJ & Evaluasi Mandiri Siswa */}
            <div className="md:col-span-2 pt-3 border-t border-zinc-800">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs font-bold text-cyan-400">Laporan Pertanggungjawaban (LPJ) & Evaluasi Mandiri Siswa</span>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono">
                  Belajar Mandiri
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mb-3">
                Ruang mandiri bagi pengurus seksi bidang untuk mencatat realisasi dana, evaluasi ketercapaian, dan mengunggah dokumen LPJ kegiatan.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Realisasi Anggaran Terpakai (Rp)</label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={prokerForm.budgetRealized || 0}
                onChange={e => setProkerForm({ ...prokerForm, budgetRealized: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Tautan Berkas LPJ / Google Drive (Link)</label>
              <input
                type="url"
                placeholder="https://drive.google.com/... atau link dokumen"
                value={prokerForm.lpjFileUrl || ''}
                onChange={e => setProkerForm({ ...prokerForm, lpjFileUrl: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1">Catatan Evaluasi & Hasil Pelaksanaan (LPJ Ringkas)</label>
              <textarea
                rows={3}
                placeholder="Tuliskan evaluasi pelaksanaan: capaian jumlah peserta, kendala di lapangan, solusi yang diambil, serta saran untuk kepengurusan berikutnya..."
                value={prokerForm.lpjNotes || ''}
                onChange={e => setProkerForm({ ...prokerForm, lpjNotes: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsProkerModalOpen(false)}
              className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
            >
              Batal
            </button>

            <div className="flex items-center gap-2">
              {(!selectedProker || selectedProker.status === 'Draft' || selectedProker.status === 'Revisi') ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => handleSaveProker(e, false)}
                    className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
                  >
                    Simpan Sebagai Draft
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSaveProker(e, true)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Simpan & Ajukan ke Pembina
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
                >
                  Simpan Perubahan
                </button>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Detail Proker */}
      <Modal
        isOpen={isProkerDetailOpen}
        onClose={() => setIsProkerDetailOpen(false)}
        title="Detail Program Kerja Intrakurikuler OSIM"
        maxWidth="max-w-2xl"
      >
        {selectedProker && (
          <div className="space-y-4 text-xs">
            <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
                  {selectedProker.sekbid}
                </span>
                <h3 className="text-base font-bold text-zinc-100 mt-1">{selectedProker.title}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Penanggung Jawab: <strong className="text-zinc-200">{selectedProker.personInCharge}</strong></p>
              </div>
              {getStatusBadge(selectedProker.status)}
            </div>

            {/* Catatan Bimbingan Pembina OSIM */}
            {selectedProker.guidanceNotes && (
              <div className="p-3 bg-amber-950/25 border border-amber-500/40 rounded-lg space-y-1 text-xs">
                <div className="flex items-center justify-between text-amber-400 font-bold text-[11px] uppercase font-mono">
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" />
                    Catatan Bimbingan Pembina OSIM
                  </span>
                  <span className="text-zinc-400 text-[10px] font-sans">
                    {selectedProker.verifiedBy || 'Pembina'} • {selectedProker.guidanceDate || '-'}
                  </span>
                </div>
                <p className="text-zinc-200 leading-relaxed whitespace-pre-line text-[11px] bg-black/40 p-2.5 rounded border border-amber-500/20">
                  {selectedProker.guidanceNotes}
                </p>
              </div>
            )}

            {/* Pengesahan Akhir & Rekap Tahunan Seal */}
            {selectedProker.status === 'Selesai & Sah' && (
              <div className="p-3 bg-emerald-950/25 border border-emerald-500/40 rounded-lg space-y-1 text-xs">
                <div className="flex items-center justify-between text-emerald-400 font-bold text-[11px] uppercase font-mono">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Status Dokumen: Selesai & Sah (Terarsip)
                  </span>
                  <span className="text-zinc-400 text-[10px] font-sans">
                    Sah: {selectedProker.finalApprovedAt || '-'}
                  </span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  Program kerja dan LPJ ini telah divalidasi oleh <strong className="text-emerald-300">{selectedProker.finalApprovedBy || 'Pembina OSIM & Waka Kesiswaan'}</strong>. Seluruh data realisasi anggaran, evaluasi, dan bukti foto secara otomatis terakumulasi dalam <strong>Rekapitulasi Tahunan Kesiswaan</strong> untuk Laporan Kepala Madrasah / Sekolah.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 bg-zinc-900/80 p-3 rounded border border-zinc-800 font-mono">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block font-sans">Waktu & Tempat</span>
                <p className="text-zinc-200 mt-0.5">{selectedProker.startDate} {selectedProker.endDate && `s/d ${selectedProker.endDate}`}</p>
                <p className="text-zinc-400 text-[11px]">📍 {selectedProker.location}</p>
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 uppercase block font-sans">Alokasi Anggaran (RAB)</span>
                <p className="text-amber-400 font-bold text-sm mt-0.5">Rp {selectedProker.budgetEstimated.toLocaleString('id-ID')}</p>
                <p className="text-zinc-400 text-[11px]">
                  Realisasi: <strong className="text-emerald-400">Rp {(selectedProker.budgetRealized || 0).toLocaleString('id-ID')}</strong>
                </p>
              </div>
            </div>

            <div>
              <span className="text-zinc-400 font-semibold block mb-1">Target Peserta & Realisasi:</span>
              <p className="text-zinc-200 bg-zinc-900 p-2.5 rounded border border-zinc-800">
                {selectedProker.targetParticipants} (Estimasi: {selectedProker.participantCount || 0} Santri)
              </p>
            </div>

            <div>
              <span className="text-zinc-400 font-semibold block mb-1">Indikator Keberhasilan:</span>
              <p className="text-zinc-200 bg-zinc-900 p-2.5 rounded border border-zinc-800">{selectedProker.successIndicator}</p>
            </div>

            <div>
              <span className="text-zinc-400 font-semibold block mb-1">Deskripsi Kegiatan:</span>
              <p className="text-zinc-300 bg-zinc-900 p-2.5 rounded border border-zinc-800 leading-relaxed whitespace-pre-line">
                {selectedProker.description || 'Tidak ada deskripsi tambahan.'}
              </p>
            </div>

            {/* Laporan Pertanggungjawaban (LPJ) & Evaluasi Mandiri Siswa */}
            {(selectedProker.lpjNotes || selectedProker.lpjFileUrl || selectedProker.budgetRealized > 0 || (selectedProker.photos && selectedProker.photos.length > 0)) && (
              <div className="bg-cyan-950/20 border border-cyan-500/30 p-3 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                      Laporan Pertanggungjawaban (LPJ) & Evaluasi Mandiri Siswa
                    </span>
                  </div>
                  {selectedProker.lpjFileUrl && (
                    <a
                      href={selectedProker.lpjFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Buka Dokumen LPJ (Drive/PDF)</span>
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-black/40 p-2.5 rounded border border-cyan-500/20">
                  <div>
                    <span className="text-zinc-400 block font-sans text-[10px]">Realisasi Kas vs RAB:</span>
                    <span className="text-emerald-400 font-bold">
                      Rp {(selectedProker.budgetRealized || 0).toLocaleString('id-ID')}
                    </span>
                    <span className="text-zinc-500 text-[10px] ml-1">
                      (RAB: Rp {selectedProker.budgetEstimated.toLocaleString('id-ID')})
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block font-sans text-[10px]">Efisiensi Anggaran:</span>
                    <span className={`font-bold ${((selectedProker.budgetEstimated || 0) - (selectedProker.budgetRealized || 0)) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      Rp {((selectedProker.budgetEstimated || 0) - (selectedProker.budgetRealized || 0)).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {selectedProker.lpjNotes && (
                  <div>
                    <span className="text-zinc-400 text-[10px] uppercase font-semibold block mb-1">
                      Ringkasan Evaluasi Pelaksanaan:
                    </span>
                    <div className="p-2.5 bg-black/40 rounded border border-cyan-500/20 text-zinc-300 text-xs whitespace-pre-line leading-relaxed">
                      {selectedProker.lpjNotes}
                    </div>
                  </div>
                )}

                {/* Dokumentasi Foto Kegiatan */}
                {selectedProker.photos && selectedProker.photos.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-zinc-300 font-semibold text-[11px] flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                        Dokumentasi Foto Kegiatan ({selectedProker.photos.length} Foto):
                      </span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {selectedProker.photos.map((photo, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() => setSelectedPhotoPreview(photo)}
                          className="aspect-video bg-zinc-900 rounded overflow-hidden border border-zinc-800 hover:border-cyan-400 cursor-pointer relative group transition"
                        >
                          <img
                            src={photo}
                            alt={`Dokumentasi ${pIdx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-semibold transition">
                            Perbesar
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions based on Role & Workflow Stage */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-zinc-800">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Siswa: Ajukan ke Pembina if Draft or Revisi */}
                {(selectedProker.status === 'Draft' || selectedProker.status === 'Revisi') && canManageOsim && (
                  <button
                    onClick={() => {
                      handleAjukanKePembina(selectedProker);
                      setIsProkerDetailOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Ajukan ke Pembina OSIM
                  </button>
                )}

                {/* Supervisi: Bimbingan & Verifikasi (Pembina, Waka, Admin) */}
                {hasSupervisionVeto && (selectedProker.status === 'Diajukan' || selectedProker.status === 'Draft' || selectedProker.status === 'Revisi') && (
                  <button
                    onClick={() => {
                      setIsProkerDetailOpen(false);
                      handleOpenGuidanceModal(selectedProker);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold transition shadow-sm"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    Bimbingan & Verifikasi
                  </button>
                )}

                {/* Siswa: Lapor LPJ */}
                {(selectedProker.status === 'Disetujui' || selectedProker.status === 'Berlangsung') && canManageOsim && (
                  <button
                    onClick={() => {
                      setIsProkerDetailOpen(false);
                      handleOpenLpjModal(selectedProker);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold transition shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Pelaporan & Unggah LPJ
                  </button>
                )}

                {/* Supervisi: Validasi Akhir LPJ (Pembina, Waka, Admin) */}
                {hasSupervisionVeto && (selectedProker.status === 'Menunggu Verifikasi LPJ' || selectedProker.status === 'Berlangsung') && (
                  <button
                    onClick={() => {
                      setIsProkerDetailOpen(false);
                      handleOpenLockAndArchiveModal(selectedProker);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold transition shadow-sm"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Validasi & Kunci Sah LPJ
                  </button>
                )}

                {/* Supervisi: Hak Veto Resmi (Pembina, Waka, Admin) */}
                {hasSupervisionVeto && selectedProker.status !== 'Draft' && (
                  <button
                    onClick={() => {
                      setIsProkerDetailOpen(false);
                      handleOpenVetoModal(selectedProker);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold transition shadow-sm"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Hak Veto
                  </button>
                )}

                {/* Jump to Rekap if Selesai & Sah */}
                {selectedProker.status === 'Selesai & Sah' && (
                  <button
                    onClick={() => {
                      setIsProkerDetailOpen(false);
                      setActiveSubTab('rekap_tahunan');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded text-xs font-semibold transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Buka di Rekap Tahunan
                  </button>
                )}
              </div>

              <button
                onClick={() => setIsProkerDetailOpen(false)}
                className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded text-xs hover:bg-zinc-700 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================== */}
      {/* MODAL 1: VERIFIKASI & BIMBINGAN (PEMBINA OSIM) */}
      {/* ========================================================== */}
      <Modal
        isOpen={isGuidanceModalOpen}
        onClose={() => setIsGuidanceModalOpen(false)}
        title="Verifikasi & Bimbingan Usulan Program Kerja"
        maxWidth="max-w-lg"
      >
        {selectedProker && (
          <form onSubmit={handleSaveGuidance} className="space-y-4 text-xs">
            <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
                {selectedProker.sekbid}
              </span>
              <h4 className="font-bold text-sm text-zinc-100 mt-1">{selectedProker.title}</h4>
              <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400 mt-1">
                <span>PJ: <strong className="text-zinc-200">{selectedProker.personInCharge}</strong></span>
                <span>• RAB: <strong className="text-amber-400">Rp {selectedProker.budgetEstimated.toLocaleString('id-ID')}</strong></span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Keputusan Verifikasi Pembina *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGuidanceForm({ ...guidanceForm, statusDecision: 'Disetujui' })}
                  className={`p-2.5 rounded border text-center transition flex flex-col items-center gap-1 ${
                    guidanceForm.statusDecision === 'Disetujui'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold text-xs">Setujui Usulan</span>
                  <span className="text-[10px] text-zinc-400">Lanjut ke tahap pelaksanaan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGuidanceForm({ ...guidanceForm, statusDecision: 'Revisi' })}
                  className={`p-2.5 rounded border text-center transition flex flex-col items-center gap-1 ${
                    guidanceForm.statusDecision === 'Revisi'
                      ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span className="font-bold text-xs">Minta Revisi</span>
                  <span className="text-[10px] text-zinc-400">Perlu perbaikan oleh siswa</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Catatan Bimbingan & Arahan Pembina *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Tuliskan catatan arahan bimbingan teknis, koreksi rincian anggaran, penyesuaian jadwal, atau pesan pembinaan bagi siswa bidang..."
                value={guidanceForm.guidanceNotes}
                onChange={e => setGuidanceForm({ ...guidanceForm, guidanceNotes: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Catatan ini akan langsung tampil di laman proker siswa bidang dan memicu notifikasi sistem.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsGuidanceModalOpen(false)}
                className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                Simpan & Terbitkan Bimbingan
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================== */}
      {/* MODAL 2: PELAKSANAAN & PELAPORAN LPJ (SISWA BIDANG) */}
      {/* ========================================================== */}
      <Modal
        isOpen={isLpjModalOpen}
        onClose={() => setIsLpjModalOpen(false)}
        title="Pelaporan LPJ & Evaluasi Mandiri Kegiatan (Siswa Bidang)"
        maxWidth="max-w-xl"
      >
        {selectedProker && (
          <form onSubmit={handleSubmitDraftLpj} className="space-y-4 text-xs">
            <div className="bg-zinc-900 p-3 rounded border border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-cyan-400 border border-zinc-700">
                  {selectedProker.sekbid}
                </span>
                <span className="text-[11px] font-mono text-amber-400 font-semibold">
                  RAB: Rp {selectedProker.budgetEstimated.toLocaleString('id-ID')}
                </span>
              </div>
              <h4 className="font-bold text-sm text-zinc-100 mt-1">{selectedProker.title}</h4>
              <p className="text-xs text-zinc-400 mt-0.5">PJ: {selectedProker.personInCharge}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Realisasi Biaya Kas (Rp) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  placeholder="0"
                  value={lpjForm.budgetRealized}
                  onChange={e => setLpjForm({ ...lpjForm, budgetRealized: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-zinc-500 mt-0.5 block">
                  Selisih: Rp {((selectedProker.budgetEstimated || 0) - (lpjForm.budgetRealized || 0)).toLocaleString('id-ID')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Jumlah Peserta Hadir (Orang) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="150"
                  value={lpjForm.participantCount}
                  onChange={e => setLpjForm({ ...lpjForm, participantCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Tautan Berkas LPJ / Google Drive (Link PDF)
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/file/d/.../view"
                value={lpjForm.lpjFileUrl}
                onChange={e => setLpjForm({ ...lpjForm, lpjFileUrl: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Ringkasan Evaluasi Pelaksanaan & Pembelajaran Mandiri *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Jelaskan capaian kegiatan, dinamika lapangan, kendala teknis, dan rekomendasi penyempurnaan..."
                value={lpjForm.lpjNotes}
                onChange={e => setLpjForm({ ...lpjForm, lpjNotes: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-cyan-500 leading-relaxed"
              />
            </div>

            {/* Unggah Foto Kegiatan */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  Foto Dokumentasi Kegiatan
                </label>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {lpjForm.photos?.length || 0} Foto Terlampir
                </span>
              </div>

              <div className="border-2 border-dashed border-zinc-800 rounded-lg p-3 text-center hover:border-cyan-500/50 transition">
                <input
                  type="file"
                  id="photo-upload-input"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <label
                  htmlFor="photo-upload-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-cyan-400 transition"
                >
                  <Upload className="w-5 h-5 text-cyan-500" />
                  <span className="text-xs font-semibold">Pilih atau Seret Foto Dokumentasi</span>
                  <span className="text-[10px] text-zinc-500">Mendukung file JPG, PNG, WebP (Maks 2MB per foto)</span>
                </label>
              </div>

              {/* Previews */}
              {lpjForm.photos && lpjForm.photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {lpjForm.photos.map((p, idx) => (
                    <div key={idx} className="aspect-video bg-zinc-900 rounded overflow-hidden relative group border border-zinc-800">
                      <img src={p} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full text-[10px] transition"
                        title="Hapus foto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-2.5 bg-purple-950/20 border border-purple-500/30 rounded text-[11px] text-purple-300">
              💡 <strong>Alur Lanjutan:</strong> Setelah draft LPJ dikirim, status kegiatan akan berubah menjadi <strong>"Menunggu Verifikasi LPJ"</strong> dan notifikasi otomatis diteruskan ke Pembina OSIM & Waka Kesiswaan untuk pengesahan akhir.
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsLpjModalOpen(false)}
                className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
              >
                <Send className="w-3.5 h-3.5" />
                Kirim Draft LPJ ke Pembina
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================== */}
      {/* MODAL 3: VALIDASI AKHIR & KUNCI SAH (PEMBINA & WAKA) */}
      {/* ========================================================== */}
      <Modal
        isOpen={isValidatingLpjOpen}
        onClose={() => setIsValidatingLpjOpen(false)}
        title="Validasi Akhir & Penguncian LPJ (Selesai & Sah)"
        maxWidth="max-w-lg"
      >
        {selectedProker && (
          <div className="space-y-4 text-xs">
            <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-purple-400 border border-zinc-700">
                  {selectedProker.sekbid}
                </span>
                <span className="text-xs font-bold text-zinc-300 font-mono">
                  Diajukan: {selectedProker.personInCharge}
                </span>
              </div>
              <h4 className="font-bold text-sm text-zinc-100">{selectedProker.title}</h4>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-zinc-800">
                <div>
                  <span className="text-zinc-500 block font-sans text-[10px]">Rencana Anggaran (RAB):</span>
                  <span className="text-amber-400 font-semibold">Rp {selectedProker.budgetEstimated.toLocaleString('id-ID')}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block font-sans text-[10px]">Realisasi Pengeluaran Kas:</span>
                  <span className="text-emerald-400 font-semibold">Rp {(selectedProker.budgetRealized || 0).toLocaleString('id-ID')}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block font-sans text-[10px]">Efisiensi Dana:</span>
                  <span className="text-zinc-200 font-semibold">
                    Rp {((selectedProker.budgetEstimated || 0) - (selectedProker.budgetRealized || 0)).toLocaleString('id-ID')}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block font-sans text-[10px]">Peserta Hadir:</span>
                  <span className="text-indigo-400 font-semibold">{selectedProker.participantCount || 0} Santri</span>
                </div>
              </div>
            </div>

            {/* Ringkasan Evaluasi Siswa */}
            {selectedProker.lpjNotes && (
              <div>
                <span className="text-zinc-400 font-medium block mb-1">Evaluasi yang Disampaikan Pengurus:</span>
                <div className="p-2.5 bg-black/40 rounded border border-zinc-800 text-zinc-300 text-xs leading-relaxed">
                  {selectedProker.lpjNotes}
                </div>
              </div>
            )}

            {/* Foto preview */}
            {selectedProker.photos && selectedProker.photos.length > 0 && (
              <div>
                <span className="text-zinc-400 font-medium block mb-1">Bukti Dokumentasi Visual ({selectedProker.photos.length} Foto):</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {selectedProker.photos.slice(0, 4).map((p, idx) => (
                    <div key={idx} className="aspect-video rounded overflow-hidden border border-zinc-800">
                      <img src={p} alt="bukti" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Catatan Pengesahan Pembina & Waka Kesiswaan (Opsional)
              </label>
              <textarea
                rows={2}
                placeholder="Tuliskan catatan apresiasi atau evaluasi pembinaan sebelum dikunci..."
                value={validationRemarks}
                onChange={e => setValidationRemarks(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-3 bg-emerald-950/25 border border-emerald-500/40 rounded-lg text-emerald-300 text-[11px] leading-relaxed">
              🔒 <strong>Peringatan Penguncian Sah:</strong> Dengan mengklik tombol di bawah, status program kerja akan dikunci menjadi <strong>"Selesai & Sah"</strong> dan secara permanen tercatat ke dalam Rekapitulasi Tahunan Kesiswaan untuk Laporan Resmi Kepala Madrasah.
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleRejectLpj}
                className="px-3 py-1.5 rounded bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-500/30 text-xs font-medium transition"
              >
                Kembalikan (Perlu Revisi)
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsValidatingLpjOpen(false)}
                  className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLockAndArchive}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Kunci Status: Selesai & Sah
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================== */}
      {/* MODAL: SUPERVISI & HAK VETO KESISWAAN (PEMBINA, WAKA, ADMIN) */}
      {/* ========================================================== */}
      <Modal
        isOpen={isVetoModalOpen}
        onClose={() => setIsVetoModalOpen(false)}
        title="Pemberlakuan Hak Veto Kesiswaan & Otoritas Supervisi"
        maxWidth="max-w-lg"
      >
        {selectedProker && (
          <div className="space-y-4 text-xs">
            {/* Header info */}
            <div className="bg-rose-950/20 p-3 rounded-lg border border-rose-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-500/40">
                  {selectedProker.sekbid}
                </span>
                <span className="text-[11px] font-mono text-zinc-300 font-bold">
                  Status Saat Ini: <span className="text-amber-400">{selectedProker.status}</span>
                </span>
              </div>
              <h4 className="font-bold text-sm text-zinc-100">{selectedProker.title}</h4>
              <div className="text-[11px] text-zinc-400 font-mono">
                PJ: <strong className="text-zinc-200">{selectedProker.personInCharge}</strong> • RAB: <strong className="text-amber-400">Rp {selectedProker.budgetEstimated.toLocaleString('id-ID')}</strong>
              </div>
            </div>

            {/* Otoritas Pelaksana Hak Veto */}
            <div className="p-2.5 bg-zinc-900 rounded border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <span className="text-zinc-400 block text-[10px]">Otoritas Eksekutor Hak Veto:</span>
                  <span className="font-bold text-zinc-200 text-xs">
                    {currentUser?.displayName || 'Pejabat Kesiswaan'} (
                    {isSuperAdmin ? 'Admin App / Super Admin' : isWaka ? 'Waka Kesiswaan' : 'Pembina OSIM'}
                    )
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                Hak Veto Sah
              </span>
            </div>

            {/* Pilihan Arah Veto */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Pilih Tindakan / Keputusan Hak Veto *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setVetoTargetStatus('Revisi')}
                  className={`p-2.5 rounded border text-center transition flex flex-col items-center gap-1 ${
                    vetoTargetStatus === 'Revisi'
                      ? 'bg-amber-600/25 border-amber-500 text-amber-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-xs">Veto ke Revisi</span>
                  <span className="text-[9px] text-zinc-400 leading-tight">Perbaikan mendesak</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVetoTargetStatus('Draft')}
                  className={`p-2.5 rounded border text-center transition flex flex-col items-center gap-1 ${
                    vetoTargetStatus === 'Draft'
                      ? 'bg-sky-600/25 border-sky-500 text-sky-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <RotateCcw className="w-4 h-4 text-sky-400" />
                  <span className="font-bold text-xs">Turunkan ke Draft</span>
                  <span className="text-[9px] text-zinc-400 leading-tight">Perombakan total</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVetoTargetStatus('Dibatalkan')}
                  className={`p-2.5 rounded border text-center transition flex flex-col items-center gap-1 ${
                    vetoTargetStatus === 'Dibatalkan'
                      ? 'bg-rose-600/25 border-rose-500 text-rose-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span className="font-bold text-xs">Batalkan Proker</span>
                  <span className="text-[9px] text-zinc-400 leading-tight">Kegiatan dihentikan</span>
                </button>
              </div>
            </div>

            {/* Alasan Veto Tertulis */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Alasan Tertulis & Berita Acara Intervensi Veto *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Tuliskan pertimbangan yuridis/kebijakan kesiswaan secara tegas (misal: bentrok jadwal asesmen madrasah, efisiensi anggaran kas, atau pertimbangan ketertiban)..."
                value={vetoReason}
                onChange={e => setVetoReason(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-rose-500 leading-relaxed"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Catatan ini akan tersimpan permanen dalam audit trail pengawasan kesiswaan dan dikirimkan sebagai notifikasi resmi kepada Pengurus Inti OSIM.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsVetoModalOpen(false)}
                className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmVeto}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition shadow-sm"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Terapkan Hak Veto Kesiswaan
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================== */}
      {/* MODAL 4: CETAK LEMBAR LAPORAN TAHUNAN KESISWAAN (KAMAD) */}
      {/* ========================================================== */}
      <Modal
        isOpen={isAnnualReportPrintOpen}
        onClose={() => setIsAnnualReportPrintOpen(false)}
        title="Dokumen Resmi Laporan Rekapitulasi Tahunan Kesiswaan"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs text-zinc-400">
              Pratinjau Lembar Pengesahan Resmi untuk Kepala Madrasah / Sekolah
            </span>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Cetak Dokumen Sekarang (PDF)
            </button>
          </div>

          {/* Printable Report Canvas */}
          <div className="bg-white text-zinc-900 p-8 rounded-lg shadow-inner font-sans print:p-0 print:shadow-none text-xs space-y-5">
            {/* Madrasah Kop Surat */}
            <div className="text-center border-b-2 border-zinc-900 pb-4">
              <h4 className="text-[11px] font-bold tracking-wider uppercase text-zinc-700">
                {schoolSetting?.centralInstitution || 'KEMENTERIAN AGAMA REPUBLIK INDONESIA'}
              </h4>
              <h2 className="text-base font-extrabold uppercase tracking-wide text-zinc-950">
                {schoolSetting?.name || 'MADRASAH ALIYAH NEGERI 2 SERAM BAGIAN TIMUR'}
              </h2>
              <p className="text-[10px] text-zinc-600">
                {schoolSetting?.address || 'Jl. Ksatria No. 04, Bula, Kabupaten Seram Bagian Timur, Maluku'} • Email: info@man2sbt.sch.id
              </p>
            </div>

            {/* Document Title */}
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold uppercase underline underline-offset-4">
                REKAPITULASI LAPORAN PERTANGGUNGJAWABAN (LPJ) & REALISASI PROGRAM KERJA OSIM
              </h3>
              <p className="text-[11px] font-medium text-zinc-700">
                Tahun Ajaran {activeAcademicYear} • Periode Kepengurusan OSIM Terverifikasi
              </p>
            </div>

            {/* Telemetry Summary */}
            <div className="grid grid-cols-4 gap-2 border border-zinc-300 p-2.5 rounded bg-zinc-50 font-mono text-[11px]">
              <div>
                <span className="text-[9px] uppercase text-zinc-500 font-sans block">Total Program Sah</span>
                <strong className="text-zinc-900">{sahPrograms.length} Kegiatan</strong>
              </div>
              <div>
                <span className="text-[9px] uppercase text-zinc-500 font-sans block">Total Rencana (RAB)</span>
                <strong className="text-zinc-900">Rp {rekapTotalRab.toLocaleString('id-ID')}</strong>
              </div>
              <div>
                <span className="text-[9px] uppercase text-zinc-500 font-sans block">Total Realisasi Kas</span>
                <strong className="text-zinc-900">Rp {rekapTotalRealized.toLocaleString('id-ID')}</strong>
              </div>
              <div>
                <span className="text-[9px] uppercase text-zinc-500 font-sans block">Efisiensi Kas Anggaran</span>
                <strong className={rekapTotalRab >= rekapTotalRealized ? 'text-emerald-700' : 'text-rose-700'}>
                  Rp {(rekapTotalRab - rekapTotalRealized).toLocaleString('id-ID')}
                </strong>
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-left border-collapse border border-zinc-300 text-[10px]">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-300 text-zinc-800 font-bold">
                  <th className="p-2 border-r border-zinc-300 w-8 text-center">No</th>
                  <th className="p-2 border-r border-zinc-300">Seksi Bidang</th>
                  <th className="p-2 border-r border-zinc-300">Nama Program Kerja</th>
                  <th className="p-2 border-r border-zinc-300">PJ / Pelaksana</th>
                  <th className="p-2 border-r border-zinc-300 text-right">RAB (Rp)</th>
                  <th className="p-2 border-r border-zinc-300 text-right">Realisasi (Rp)</th>
                  <th className="p-2 border-r border-zinc-300 text-center">Peserta</th>
                  <th className="p-2 text-center">Tgl Sah</th>
                </tr>
              </thead>
              <tbody>
                {sahPrograms.map((p, idx) => (
                  <tr key={p.id} className="border-b border-zinc-200">
                    <td className="p-2 border-r border-zinc-300 text-center font-mono">{idx + 1}</td>
                    <td className="p-2 border-r border-zinc-300 font-semibold">{p.sekbid.split(':')[0]}</td>
                    <td className="p-2 border-r border-zinc-300 font-bold">{p.title}</td>
                    <td className="p-2 border-r border-zinc-300">{p.personInCharge}</td>
                    <td className="p-2 border-r border-zinc-300 text-right font-mono">
                      {p.budgetEstimated.toLocaleString('id-ID')}
                    </td>
                    <td className="p-2 border-r border-zinc-300 text-right font-mono">
                      {(p.budgetRealized || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="p-2 border-r border-zinc-300 text-center font-mono">
                      {p.participantCount || 0}
                    </td>
                    <td className="p-2 text-center font-mono text-[9px]">
                      {p.finalApprovedAt || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Three Signatures */}
            <div className="pt-8 grid grid-cols-3 gap-4 text-center text-[10px] text-zinc-900 font-medium">
              <div>
                <p className="text-zinc-600">Mengetahui,</p>
                <p className="font-bold">Ketua OSIM Terpilih</p>
                <div className="h-16 flex items-end justify-center">
                  <span className="font-bold underline uppercase">( {osimMembers[0]?.fullName || 'Ketua Umum OSIM'} )</span>
                </div>
                <p className="text-[9px] text-zinc-500">NIS: {osimMembers[0]?.studentNis || '24251001'}</p>
              </div>

              <div>
                <p className="text-zinc-600">Diverifikasi & Dibimbing Oleh,</p>
                <p className="font-bold">Pembina OSIM</p>
                <div className="h-16 flex items-end justify-center">
                  <span className="font-bold underline uppercase">( Ust. Pembina OSIM, S.Pd )</span>
                </div>
                <p className="text-[9px] text-zinc-500">NIP. 19850412 201101 1 008</p>
              </div>

              <div>
                <p className="text-zinc-600">Disahkan Oleh,</p>
                <p className="font-bold">Kepala Madrasah / Waka Kesiswaan</p>
                <div className="h-16 flex items-end justify-center">
                  <span className="font-bold underline uppercase">( {schoolSetting?.principalName || 'Drs. H. Kepala Madrasah, M.Pd'} )</span>
                </div>
                <p className="text-[9px] text-zinc-500">NIP. {schoolSetting?.principalNip || '19730815 199903 1 002'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              onClick={() => setIsAnnualReportPrintOpen(false)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded transition"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      </Modal>

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
      <Modal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        title={selectedMember ? 'Ubah Data Pengurus OSIM' : 'Tambah Pengurus / BPH / Sekbid OSIM'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveMember} className="space-y-3">
          {/* Header Mode Seleksi Siswa */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-900/90 border border-zinc-800 p-1.5 rounded-lg gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setMemberSelectionMode('db');
                  setIsChangingSelectedStudent(false);
                }}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                  memberSelectionMode === 'db'
                    ? 'bg-amber-500 text-zinc-950 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Pilih dari Data Siswa Madrasah
              </button>
              <button
                type="button"
                onClick={() => setMemberSelectionMode('manual')}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                  memberSelectionMode === 'manual'
                    ? 'bg-amber-500 text-zinc-950 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                Input Manual
              </button>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono px-2">
              {memberSelectionMode === 'db' ? 'Filter Kelas Grid Aktif' : 'Pengetikan Manual'}
            </span>
          </div>

          {/* Mode Database: Siswa Picker dengan Filter Kelas Grid */}
          {memberSelectionMode === 'db' && (
            <>
              {memberForm.fullName && !isChangingSelectedStudent ? (
                /* Card Siswa yang Sedang Terpilih */
                <div className="bg-amber-950/20 border border-amber-500/40 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {memberForm.photoUrl ? (
                      <img
                        src={memberForm.photoUrl}
                        alt={memberForm.fullName}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover border-2 border-amber-500/50 shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/40 shrink-0 text-base">
                        {memberForm.fullName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          Siswa Terpilih dari Database
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300">
                          {memberForm.className}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-zinc-100 mt-1 truncate">{memberForm.fullName}</h4>
                      <p className="text-[11px] text-zinc-400 font-mono">NIS: {memberForm.studentNis || '-'} • Kontak: {memberForm.phone || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => setIsChangingSelectedStudent(true)}
                      className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Ganti Siswa Lain
                    </button>
                  </div>
                </div>
              ) : (
                /* Pemilih Siswa dengan Grid Filter Kelas */
                <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      Filter Kelas (Pilih Kelas):
                    </label>
                    <span className="text-[10px] text-amber-400/90 font-mono">
                      {filteredStudentsForOsim.length} siswa ditemukan
                    </span>
                  </div>

                  {/* Filter Kelas dalam Bentuk Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 max-h-32 overflow-y-auto p-1 bg-zinc-900/80 rounded border border-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => setSelectedClassFilter('all')}
                      className={`px-2 py-1.5 rounded text-[11px] font-medium transition flex items-center justify-between gap-1 ${
                        selectedClassFilter === 'all'
                          ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
                          : 'bg-zinc-800/90 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/60'
                      }`}
                      title="Tampilkan semua siswa dari semua kelas"
                    >
                      <span className="truncate">Semua</span>
                      <span className={`text-[9px] px-1 rounded ${
                        selectedClassFilter === 'all' ? 'bg-amber-600/40 text-zinc-950 font-black' : 'bg-zinc-900 text-zinc-400'
                      }`}>
                        {classesWithCounts.totalCount}
                      </span>
                    </button>

                    {classesWithCounts.classList.map(cls => {
                      const isSelected = selectedClassFilter === cls.id || selectedClassFilter === cls.name;
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => setSelectedClassFilter(cls.name || cls.id)}
                          className={`px-2 py-1.5 rounded text-[11px] font-medium transition flex items-center justify-between gap-1 ${
                            isSelected
                              ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
                              : 'bg-zinc-800/90 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/60'
                          }`}
                          title={`Filter kelas ${cls.name}`}
                        >
                          <span className="truncate">{cls.name}</span>
                          <span className={`text-[9px] px-1 rounded ${
                            isSelected ? 'bg-amber-600/40 text-zinc-950 font-black' : 'bg-zinc-900 text-zinc-400'
                          }`}>
                            {cls.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Pencarian Cepat Nama / NIS */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Cari siswa berdasarkan nama lengkap atau NIS..."
                      value={studentSearchTerm}
                      onChange={e => setStudentSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-8 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                    {studentSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setStudentSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Grid Kartu Siswa */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                    {filteredStudentsForOsim.length > 0 ? (
                      filteredStudentsForOsim.map(student => {
                        const isSelected = memberForm.studentNis === student.nis && memberForm.fullName === student.fullName;
                        const existingOsim = osimMembers.find(
                          m => (m.studentNis && m.studentNis === student.nis) ||
                               m.fullName.toLowerCase() === student.fullName.toLowerCase()
                        );

                        return (
                          <div
                            key={student.id}
                            onClick={() => handleSelectStudentForMember(student)}
                            className={`p-2 rounded-lg border transition cursor-pointer flex items-center justify-between gap-2 text-left ${
                              isSelected
                                ? 'bg-amber-500/20 border-amber-500 text-amber-200 ring-1 ring-amber-500'
                                : 'bg-zinc-900/90 border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800/80 text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {student.photoUrl ? (
                                <img
                                  src={student.photoUrl}
                                  alt={student.fullName}
                                  referrerPolicy="no-referrer"
                                  className="w-8 h-8 rounded-full object-cover border border-zinc-700 shrink-0"
                                />
                              ) : (
                                <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                                  student.gender === 'P'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                }`}>
                                  {student.fullName.charAt(0)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h5 className="font-bold text-xs text-zinc-100 truncate">{student.fullName}</h5>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono mt-0.5">
                                  <span className="px-1 py-0.2 bg-zinc-800 rounded text-zinc-300 font-semibold">{student.className}</span>
                                  <span>• NIS {student.nis || '-'}</span>
                                </div>
                                {existingOsim && (
                                  <div className="mt-0.5">
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-medium truncate inline-block max-w-[170px]">
                                      {existingOsim.position} ({existingOsim.sekbid?.startsWith('BPH') ? 'BPH' : 'Sekbid'})
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectStudentForMember(student);
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-semibold shrink-0 transition ${
                                isSelected
                                  ? 'bg-amber-500 text-zinc-950'
                                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                              }`}
                            >
                              {isSelected ? 'Terpilih' : 'Pilih'}
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-1 sm:col-span-2 text-center py-6 border border-dashed border-zinc-800 rounded-lg">
                        <p className="text-xs text-zinc-400">Tidak ada siswa yang sesuai pencarian atau kelas ini.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClassFilter('all');
                            setStudentSearchTerm('');
                          }}
                          className="mt-1.5 text-xs text-amber-400 hover:underline"
                        >
                          Reset filter kelas & pencarian
                        </button>
                      </div>
                    )}
                  </div>

                  {isChangingSelectedStudent && memberForm.fullName && (
                    <div className="pt-1 text-right">
                      <button
                        type="button"
                        onClick={() => setIsChangingSelectedStudent(false)}
                        className="text-xs text-zinc-400 hover:text-zinc-200 underline"
                      >
                        Batal ganti, tetap gunakan {memberForm.fullName}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Mode Manual: Input Nama, NIS, dan Kelas Manual */}
          {memberSelectionMode === 'manual' && (
            <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-3 space-y-2.5">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Al-Fatih"
                  value={memberForm.fullName}
                  onChange={e => setMemberForm({ ...memberForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">NIS Siswa</label>
                  <input
                    type="text"
                    placeholder="24251001"
                    value={memberForm.studentNis}
                    onChange={e => setMemberForm({ ...memberForm, studentNis: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Kelas</label>
                  <input
                    type="text"
                    placeholder="XI RPL 1"
                    value={memberForm.className}
                    onChange={e => setMemberForm({ ...memberForm, className: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Penugasan Jabatan & Struktur OSIM */}
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-3 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2">
              <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                Struktur Penugasan OSIM:
              </label>
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded border border-zinc-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setMemberCategoryTab('bph');
                    setMemberForm(prev => ({
                      ...prev,
                      sekbid: 'BPH (Badan Pengurus Harian)',
                      position: prev.position?.includes('Ketua') || prev.position?.includes('Sekretaris') || prev.position?.includes('Bendahara')
                        ? prev.position
                        : 'Ketua Umum OSIM'
                    }));
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    memberCategoryTab === 'bph'
                      ? 'bg-amber-500 text-zinc-950 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Badan Pengurus Harian (BPH)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMemberCategoryTab('sekbid');
                    setMemberForm(prev => ({
                      ...prev,
                      sekbid: (prev.sekbid && prev.sekbid !== 'BPH (Badan Pengurus Harian)')
                        ? prev.sekbid
                        : ((sekbidList.find(s => !s.startsWith('BPH')) || 'Sekbid 1: Keimanan, Ketaqwaan & Moderasi Beragama') as OsimSekbid),
                      position: prev.position === 'Ketua Umum OSIM' ? 'Ketua Sekbid' : (prev.position || 'Anggota Sekbid')
                    }));
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    memberCategoryTab === 'sekbid'
                      ? 'bg-amber-500 text-zinc-950 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Seksi Bidang (Sekbid)
                </button>
              </div>
            </div>

            {memberCategoryTab === 'bph' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Jabatan BPH *</label>
                  <select
                    value={memberForm.position}
                    onChange={e => setMemberForm({ ...memberForm, position: e.target.value as any })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Ketua Umum OSIM">Ketua Umum OSIM</option>
                    <option value="Wakil Ketua 1">Wakil Ketua 1 (Bidang Internal)</option>
                    <option value="Wakil Ketua 2">Wakil Ketua 2 (Bidang Eksternal)</option>
                    <option value="Sekretaris Umum">Sekretaris Umum</option>
                    <option value="Wakil Sekretaris">Wakil Sekretaris</option>
                    <option value="Bendahara Umum">Bendahara Umum</option>
                    <option value="Wakil Bendahara">Wakil Bendahara</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Entitas Kepengurusan</label>
                  <input
                    type="text"
                    disabled
                    value="BPH (Badan Pengurus Harian)"
                    className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded text-xs text-amber-400 font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Pilih Seksi Bidang (Sekbid) *</label>
                  <select
                    value={memberForm.sekbid}
                    onChange={e => setMemberForm({ ...memberForm, sekbid: e.target.value as OsimSekbid })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    {sekbidList.filter(s => !s.startsWith('BPH')).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Posisi dalam Sekbid *</label>
                  <select
                    value={memberForm.position}
                    onChange={e => setMemberForm({ ...memberForm, position: e.target.value as any })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Ketua Sekbid">Ketua Sekbid (Koordinator)</option>
                    <option value="Wakil Ketua Sekbid">Wakil Ketua Sekbid</option>
                    <option value="Sekretaris Bidang">Sekretaris Bidang</option>
                    <option value="Bendahara Bidang">Bendahara Bidang</option>
                    <option value="Anggota Sekbid">Anggota Sekbid</option>
                    <option value="Koordinator Divisi">Koordinator Divisi</option>
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">No. WhatsApp / HP</label>
                <input
                  type="text"
                  placeholder="081234567890"
                  value={memberForm.phone}
                  onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Status Keaktifan</label>
                <select
                  value={memberForm.status || 'Aktif'}
                  onChange={e => setMemberForm({ ...memberForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Aktif">Aktif Menjabat</option>
                  <option value="Demisioner">Demisioner / Purna Tugas</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Program Unggulan / Amanah yang Diusung</label>
              <input
                type="text"
                placeholder="Contoh: Digitalisasi E-Voting & Madrasah Hijau Ramah Lingkungan"
                value={memberForm.flagshipProgram}
                onChange={e => setMemberForm({ ...memberForm, flagshipProgram: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Visi Singkat / Komitmen Pengurus</label>
              <textarea
                rows={2}
                placeholder="Tuliskan motivasi, komitmen atau visi pengurus..."
                value={memberForm.vision}
                onChange={e => setMemberForm({ ...memberForm, vision: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Otorisasi Pembina OSIM: Manajemen Akun & Kata Sandi Siswa */}
            {canManageOsimAccounts && (
              <div className="bg-amber-950/20 border border-amber-500/40 rounded-lg p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
                    <Key className="w-3.5 h-3.5" />
                    <span>Akun & Kata Sandi Login Pengurus (Hak Akses Pembina)</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                    KENDALI PENUH
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Pembina OSIM memiliki wewenang penuh mengatur akses login anggota OSIM. Jika Anda merubah kata sandi di bawah ini, password lama siswa akan otomatis langsung tergantikan.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1">Username Login Siswa</label>
                    <input
                      type="text"
                      placeholder="Contoh: 24251001 atau osim.ketua"
                      value={memberLoginUsername}
                      onChange={e => setMemberLoginUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1">Kata Sandi Login</label>
                    <div className="relative">
                      <input
                        type={showMemberLoginPassword ? 'text' : 'password'}
                        placeholder="Masukkan password baru"
                        value={memberLoginPassword}
                        onChange={e => setMemberLoginPassword(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowMemberLoginPassword(!showMemberLoginPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                      >
                        {showMemberLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-zinc-800">
            <div className="text-xs text-zinc-400">
              {!memberForm.fullName ? (
                <span className="text-amber-400 font-medium">* Silakan pilih siswa dari daftar kelas di atas</span>
              ) : (
                <span className="text-emerald-400 font-medium">✓ Data {memberForm.fullName} ({memberForm.className}) siap disimpan</span>
              )}
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setIsMemberModalOpen(false)}
                className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!memberForm.fullName}
                className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Check className="w-3.5 h-3.5" />
                Simpan Pengurus
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Kirim Aspirasi Siswa */}
      <Modal
        isOpen={isAspirationModalOpen}
        onClose={() => setIsAspirationModalOpen(false)}
        title="Sampaikan Aspirasi / Ide untuk OSIM & Madrasah"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveAspiration} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Nama Siswa / Pengirim</label>
            <input
              type="text"
              value={aspirationForm.studentName}
              onChange={e => setAspirationForm({ ...aspirationForm, studentName: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Kategori Usulan *</label>
            <select
              value={aspirationForm.category}
              onChange={e => setAspirationForm({ ...aspirationForm, category: e.target.value as any })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              <option value="Fasilitas & Sarpras">Fasilitas & Sarpras</option>
              <option value="Kegiatan & Acara">Kegiatan & Acara</option>
              <option value="Akademik & Pembelajaran">Akademik & Pembelajaran</option>
              <option value="Kedisiplinan & Tata Tertib">Kedisiplinan & Tata Tertib</option>
              <option value="Ekstrakurikuler">Ekstrakurikuler</option>
              <option value="Kesejahteraan Santri/Siswa">Kesejahteraan Santri/Siswa</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Judul Aspirasi *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Penambahan Stop Kontak di Gazebo Belajar"
              value={aspirationForm.title}
              onChange={e => setAspirationForm({ ...aspirationForm, title: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Isi Aspirasi / Usulan Detail *</label>
            <textarea
              required
              rows={4}
              placeholder="Jelaskan alasan dan manfaat usulan ini bagi santri madrasah..."
              value={aspirationForm.content}
              onChange={e => setAspirationForm({ ...aspirationForm, content: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsAspirationModalOpen(false)}
              className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
            >
              Kirim Aspirasi
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Respon Aspirasi */}
      <Modal
        isOpen={isAspirationResponseOpen}
        onClose={() => setIsAspirationResponseOpen(false)}
        title="Tanggapan Resmi Pengurus OSIM & Kesiswaan"
        maxWidth="max-w-md"
      >
        {selectedAspiration && (
          <div className="space-y-3 text-xs">
            <div className="bg-zinc-900 p-3 rounded border border-zinc-800">
              <h4 className="font-bold text-zinc-100">{selectedAspiration.title}</h4>
              <p className="text-zinc-400 mt-1 text-[11px]">{selectedAspiration.content}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Status Tindak Lanjut</label>
              <select
                value={responseStatus}
                onChange={e => setResponseStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Ditampung">Ditampung</option>
                <option value="Sedang Dibahas">Sedang Dibahas</option>
                <option value="Direalisasikan">Direalisasikan</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Isi Tanggapan / Keterangan Resmi</label>
              <textarea
                rows={4}
                placeholder="Tuliskan tindakan yang telah atau akan diambil oleh OSIM/Kesiswaan..."
                value={responseNoteText}
                onChange={e => setResponseNoteText(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsAspirationResponseOpen(false)}
                className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveResponse}
                className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
              >
                Simpan Tanggapan
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Notulensi Rapat */}
      <Modal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        title="Catat Notulensi Sidang Pleno / Rapat OSIM"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveMeeting} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Judul / Acara Rapat *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Rapat Evaluasi Bulanan Program Kerja OSIM"
              value={meetingForm.title}
              onChange={e => setMeetingForm({ ...meetingForm, title: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Jenis Pertemuan</label>
              <select
                value={meetingForm.type}
                onChange={e => setMeetingForm({ ...meetingForm, type: e.target.value as any })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Rapat Pleno Pengurus">Rapat Pleno Pengurus</option>
                <option value="Rapat BPH">Rapat BPH</option>
                <option value="Rapat Koordinasi Pembina">Rapat Koordinasi Pembina</option>
                <option value="Sidang Musyawarah Kerja (MUKER)">Sidang Musyawarah Kerja (MUKER)</option>
                <option value="Rapat Evaluasi Bulanan">Rapat Evaluasi Bulanan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Tanggal</label>
              <input
                type="date"
                value={meetingForm.date}
                onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Agenda Pembahasan *</label>
            <textarea
              required
              rows={2}
              placeholder="Rincian poin agenda yang dibahas..."
              value={meetingForm.agenda}
              onChange={e => setMeetingForm({ ...meetingForm, agenda: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Hasil Keputusan & Mufakat *</label>
            <textarea
              required
              rows={3}
              placeholder="Keputusan rapat, pembagian tugas, deadline..."
              value={meetingForm.decisionNotes}
              onChange={e => setMeetingForm({ ...meetingForm, decisionNotes: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsMeetingModalOpen(false)}
              className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
            >
              Simpan Notulensi
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail Pengurus OSIM */}
      <Modal
        isOpen={isMemberDetailOpen}
        onClose={() => setIsMemberDetailOpen(false)}
        title="Detail Profil Pengurus OSIM"
        maxWidth="max-w-lg"
      >
        {selectedMember && (
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3 bg-zinc-900/90 border border-zinc-800 p-3 rounded-lg">
              {selectedMember.photoUrl ? (
                <img
                  src={selectedMember.photoUrl}
                  alt={selectedMember.fullName}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full object-cover border border-amber-500/40 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30 shrink-0 text-xl">
                  {selectedMember.fullName.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {selectedMember.position}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {selectedMember.status}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-zinc-100 mt-1">{selectedMember.fullName}</h3>
                <p className="text-zinc-400 font-mono text-[11px] mt-0.5">
                  NIS: {selectedMember.studentNis} • Kelas: {selectedMember.className}
                </p>
                <p className="text-zinc-500 text-[10px] font-mono mt-0.5">
                  Masa Bakti: {selectedMember.period || activeAcademicYear}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
              <div>
                <span className="text-[10px] text-zinc-500 block font-mono">Seksi Bidang:</span>
                <span className="text-zinc-200 font-semibold">{selectedMember.sekbid}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block font-mono">No. Telepon / WA:</span>
                <span className="text-zinc-200 font-mono">{selectedMember.phone || '-'}</span>
              </div>
              {selectedMember.email && (
                <div className="col-span-2">
                  <span className="text-[10px] text-zinc-500 block font-mono">Email:</span>
                  <span className="text-zinc-300 font-mono">{selectedMember.email}</span>
                </div>
              )}
            </div>

            {selectedMember.vision && (
              <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
                <span className="text-[10px] text-amber-400 font-mono font-bold uppercase block mb-1">
                  Visi & Komitmen:
                </span>
                <p className="text-zinc-300 leading-relaxed italic">"{selectedMember.vision}"</p>
              </div>
            )}

            {selectedMember.flagshipProgram && (
              <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
                <span className="text-[10px] text-sky-400 font-mono font-bold uppercase block mb-1">
                  Program Unggulan yang Diusung:
                </span>
                <p className="text-zinc-200 font-medium">{selectedMember.flagshipProgram}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsMemberDetailOpen(false)}
                className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
              >
                Tutup
              </button>
              {canManageCabinetStructure && (
                <div className="flex items-center gap-2">
                  {canManageOsimAccounts && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMemberDetailOpen(false);
                        handleOpenManageAccountForMember(selectedMember);
                      }}
                      className="px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                      title="Kelola Akun & Password Login Siswa"
                    >
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      Akun & Password
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMemberDetailOpen(false);
                      handleOpenEditMember(selectedMember);
                    }}
                    className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Profil
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMemberDetailOpen(false);
                      setIsMemberDeleteOpen(true);
                    }}
                    className="px-3 py-1.5 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Detail Notulensi Sidang Pleno */}
      <Modal
        isOpen={isMeetingDetailOpen}
        onClose={() => setIsMeetingDetailOpen(false)}
        title="Detail Notulensi Sidang & Rapat OSIM"
        maxWidth="max-w-2xl"
      >
        {selectedMeeting && (
          <div className="space-y-4 text-xs">
            <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-lg">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {selectedMeeting.type}
                </span>
                <span className="text-zinc-400 font-mono text-[11px]">
                  📅 {selectedMeeting.date} ({selectedMeeting.startTime} - {selectedMeeting.endTime} WIB)
                </span>
              </div>
              <h3 className="font-bold text-base text-zinc-100">{selectedMeeting.title}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-zinc-800 text-[11px] font-mono text-zinc-400">
                <div>
                  <span className="text-zinc-500 block text-[10px]">Lokasi:</span>
                  <strong className="text-zinc-200">{selectedMeeting.location}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Kehadiran:</span>
                  <strong className="text-zinc-200">{selectedMeeting.attendeesCount} Orang</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Pimpinan Rapat:</span>
                  <strong className="text-zinc-200">{selectedMeeting.leader}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Notulis:</span>
                  <strong className="text-zinc-200">{selectedMeeting.secretary}</strong>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3.5">
              <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-1.5">
                AGENDA PEMBAHASAN:
              </span>
              <p className="text-zinc-200 leading-relaxed whitespace-pre-line">{selectedMeeting.agenda}</p>
            </div>

            <div className="bg-zinc-900/60 border border-emerald-500/20 rounded-lg p-3.5">
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 block mb-1.5">
                HASIL KEPUTUSAN & MUFAKAT SIDANG:
              </span>
              <p className="text-zinc-200 leading-relaxed whitespace-pre-line">{selectedMeeting.decisionNotes}</p>
            </div>

            {selectedMeeting.wakaNotes && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3.5">
                <span className="text-[10px] font-mono font-bold uppercase text-amber-400 block mb-1">
                  Catatan Waka Kesiswaan / Pembina:
                </span>
                <p className="text-zinc-200 italic">{selectedMeeting.wakaNotes}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsMeetingDetailOpen(false)}
                className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
              >
                Tutup
              </button>
              {canManageOsim && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMeetingDetailOpen(false);
                      handleOpenEditMeeting(selectedMeeting);
                    }}
                    className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Notulensi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMeetingDetailOpen(false);
                      handleOpenDeleteMeeting(selectedMeeting);
                    }}
                    className="px-3 py-1.5 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Detail Aspirasi Santri */}
      <Modal
        isOpen={isAspirationDetailOpen}
        onClose={() => setIsAspirationDetailOpen(false)}
        title="Detail Aspirasi & Suara Santri"
        maxWidth="max-w-lg"
      >
        {selectedAspiration && (
          <div className="space-y-4 text-xs">
            <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-lg">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {selectedAspiration.category}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    selectedAspiration.status === 'Direalisasikan'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : selectedAspiration.status === 'Sedang Dibahas'
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {selectedAspiration.status}
                </span>
              </div>
              <h3 className="font-bold text-base text-zinc-100">{selectedAspiration.title}</h3>
              <p className="text-zinc-400 font-mono text-[11px] mt-1">
                Pengirim: <strong className="text-zinc-200">{selectedAspiration.studentName}</strong> ({selectedAspiration.studentClass}) • Tanggal: {selectedAspiration.date}
              </p>
              <div className="mt-2 text-amber-400 font-mono text-[11px] flex items-center gap-1">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{selectedAspiration.upvotes || 1} Santri Mendukung Aspirasi Ini</span>
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3.5">
              <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-1.5">
                ISI LENGKAP ASPIRASI:
              </span>
              <p className="text-zinc-200 leading-relaxed whitespace-pre-line">{selectedAspiration.content}</p>
            </div>

            {selectedAspiration.responseNote && (
              <div className="bg-zinc-900/90 border border-emerald-500/30 rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-400">
                    TANGGAPAN RESMI PENGURUS:
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">{selectedAspiration.respondedAt}</span>
                </div>
                <p className="text-zinc-200 leading-relaxed">{selectedAspiration.responseNote}</p>
                <span className="text-[10px] font-mono text-zinc-500 block mt-2">
                  Ditanggapi oleh: {selectedAspiration.respondedBy || 'Pengurus OSIM'}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsAspirationDetailOpen(false)}
                className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
              >
                Tutup
              </button>
              {canManageOsim && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAspirationDetailOpen(false);
                      handleOpenResponseAspiration(selectedAspiration);
                    }}
                    className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
                  >
                    Beri Respon
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAspirationDetailOpen(false);
                      handleOpenDeleteAspiration(selectedAspiration);
                    }}
                    className="px-3 py-1.5 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

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

      {/* ========================================================== */}
      {/* MODAL KELOLA / UBAH AKUN & PASSWORD PENGURUS OSIM (PEMBINA) */}
      {/* ========================================================== */}
      <Modal
        isOpen={isOsimAccountModalOpen}
        onClose={() => setIsOsimAccountModalOpen(false)}
        title={isAddingOsimAccount ? 'Tambah Akun Login Pengurus OSIM' : `Edit Akun & Password: ${selectedOsimAccount?.displayName || ''}`}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveOsimAccount} className="space-y-4 text-xs">
          <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-lg flex items-start gap-2.5">
            <Key className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-zinc-300 text-[11px] leading-relaxed">
              Hak Akses Pembina: Setiap akun pengurus OSIM otomatis tersinkronisasi dengan <strong>Struktur Kabinet</strong> dan <strong>cPanel Admin</strong>. Password lama otomatis tidak dapat digunakan lagi.
            </p>
          </div>

          {/* PILIHAN DATA SISWA & KELAS DALAM BENTUK GRID (KHUSUS TAMBAH AKUN) */}
          {isAddingOsimAccount && (
            <div className="space-y-3 bg-zinc-950/60 border border-zinc-800 p-3.5 rounded-lg">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" />
                  Pilih Data Siswa & Kelas (Grid Selection) *
                </label>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {selectedStudentForAccount ? '1 Siswa Terpilih' : `${filteredStudentsForAccount.length} Siswa Tersedia`}
                </span>
              </div>

              {selectedStudentForAccount && !isChangingStudentForAccount ? (
                /* Card Siswa Terpilih */
                <div className="bg-amber-950/30 border border-amber-500/50 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {selectedStudentForAccount.photoUrl ? (
                      <img
                        src={selectedStudentForAccount.photoUrl}
                        alt={selectedStudentForAccount.fullName}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover border-2 border-amber-500/60 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center border border-amber-500/40 shrink-0 text-base">
                        {selectedStudentForAccount.fullName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          Siswa Terpilih dari Database
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-200 border border-zinc-700">
                          Kelas {selectedStudentForAccount.className}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-zinc-100 mt-1 truncate">{selectedStudentForAccount.fullName}</h4>
                      <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        NIS: {selectedStudentForAccount.nis || '-'} • Kontak: {selectedStudentForAccount.phone || '-'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsChangingStudentForAccount(true)}
                    className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 shrink-0 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    Ganti Siswa Lain
                  </button>
                </div>
              ) : (
                /* Grid Filter Kelas & Grid Siswa */
                <div className="space-y-2.5">
                  {/* Grid Filter Kelas */}
                  <div>
                    <span className="text-[11px] text-zinc-400 font-medium block mb-1.5">
                      1. Pilih Kelas Siswa:
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 max-h-28 overflow-y-auto p-1 bg-zinc-900/90 rounded border border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setAccountSelectedClassFilter('all')}
                        className={`px-2 py-1.5 rounded text-[11px] font-medium transition flex items-center justify-between gap-1 ${
                          accountSelectedClassFilter === 'all'
                            ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60'
                        }`}
                        title="Tampilkan semua siswa dari semua kelas"
                      >
                        <span className="truncate">Semua</span>
                        <span className={`text-[9px] px-1 rounded ${
                          accountSelectedClassFilter === 'all' ? 'bg-amber-600/40 text-zinc-950 font-black' : 'bg-zinc-900 text-zinc-400'
                        }`}>
                          {classesWithCounts.totalCount}
                        </span>
                      </button>

                      {classesWithCounts.classList.map(cls => {
                        const isSelected = accountSelectedClassFilter === cls.id || accountSelectedClassFilter === cls.name;
                        return (
                          <button
                            key={cls.id}
                            type="button"
                            onClick={() => setAccountSelectedClassFilter(cls.name || cls.id)}
                            className={`px-2 py-1.5 rounded text-[11px] font-medium transition flex items-center justify-between gap-1 ${
                              isSelected
                                ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60'
                            }`}
                            title={`Filter kelas ${cls.name}`}
                          >
                            <span className="truncate">{cls.name}</span>
                            <span className={`text-[9px] px-1 rounded ${
                              isSelected ? 'bg-amber-600/40 text-zinc-950 font-black' : 'bg-zinc-900 text-zinc-400'
                            }`}>
                              {cls.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Input Cari Siswa */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Cari siswa berdasarkan nama lengkap atau NIS..."
                      value={accountStudentSearchTerm}
                      onChange={e => setAccountStudentSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-8 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                    {accountStudentSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setAccountStudentSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Grid Pilihan Siswa */}
                  <div>
                    <span className="text-[11px] text-zinc-400 font-medium block mb-1">
                      2. Klik Siswa untuk Memilih:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {filteredStudentsForAccount.length > 0 ? (
                        filteredStudentsForAccount.map(student => {
                          const isSelected = selectedStudentForAccount?.id === student.id || osimAccountForm.displayName === student.fullName;
                          const hasExistingAccount = osimAccounts.some(
                            u => (u.nip && u.nip === student.nis) || (u.displayName.toLowerCase() === student.fullName.toLowerCase())
                          );

                          return (
                            <div
                              key={student.id}
                              onClick={() => handleSelectStudentForAccount(student)}
                              className={`p-2 rounded-lg border transition cursor-pointer flex items-center justify-between gap-2 text-left ${
                                isSelected
                                  ? 'bg-amber-500/20 border-amber-500 text-amber-200 ring-1 ring-amber-500'
                                  : 'bg-zinc-900/90 border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800/80 text-zinc-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {student.photoUrl ? (
                                  <img
                                    src={student.photoUrl}
                                    alt={student.fullName}
                                    referrerPolicy="no-referrer"
                                    className="w-8 h-8 rounded-full object-cover border border-zinc-700 shrink-0"
                                  />
                                ) : (
                                  <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                                    student.gender === 'P'
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                  }`}>
                                    {student.fullName.charAt(0)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="font-semibold text-xs text-zinc-100 truncate">{student.fullName}</div>
                                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
                                    <span>NIS: {student.nis}</span>
                                    <span>•</span>
                                    <span className="text-amber-400/90">{student.className}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center gap-1">
                                {hasExistingAccount && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                    Ada Akun
                                  </span>
                                )}
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                                  isSelected ? 'bg-amber-500 border-amber-500 text-zinc-950' : 'border-zinc-700 text-transparent'
                                }`}>
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-2 p-6 text-center text-zinc-500 bg-zinc-900/60 rounded border border-zinc-800">
                          Tidak ada siswa yang sesuai dengan filter kelas & pencarian ini.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1">Nama Lengkap Siswa *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Muhammad Farhan Al-Fatih"
                value={osimAccountForm.displayName}
                onChange={e => setOsimAccountForm({ ...osimAccountForm, displayName: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Username Login *</label>
              <input
                type="text"
                required
                placeholder="Contoh: 24251001 atau osim.ketua"
                value={osimAccountForm.username}
                onChange={e => setOsimAccountForm({ ...osimAccountForm, username: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Email Kredensial *</label>
              <input
                type="email"
                required
                placeholder="email@madrasah.sch.id"
                value={osimAccountForm.email}
                onChange={e => setOsimAccountForm({ ...osimAccountForm, email: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Kategori Kepengurusan *</label>
              <select
                value={osimAccountForm.osimRole}
                onChange={e => {
                  const newRole = e.target.value as any;
                  const defaultP = getDefaultOsimPassword(newRole);
                  const isBph = newRole !== 'sekbid';
                  setOsimAccountForm(prev => ({
                    ...prev,
                    osimRole: newRole,
                    password: defaultP,
                    osimPosition: newRole === 'ketua' ? 'Ketua Umum OSIM' :
                                  newRole === 'wakil' ? 'Wakil Ketua OSIM' :
                                  newRole === 'sekretaris' ? 'Sekretaris OSIM' :
                                  newRole === 'bendahara' ? 'Bendahara OSIM' : 'Anggota Sekbid',
                    osimDepartmentName: isBph ? 'BPH (Badan Pengurus Harian)' : prev.osimDepartmentName,
                    isCashManager: newRole === 'bendahara'
                  }));
                }}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="ketua">Ketua Umum OSIM</option>
                <option value="wakil">Wakil Ketua OSIM</option>
                <option value="sekretaris">Sekretaris OSIM</option>
                <option value="bendahara">Bendahara OSIM</option>
                <option value="sekbid">Pengurus / Sekbid OSIM</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Jabatan Spesifik</label>
              <input
                type="text"
                placeholder="Contoh: Koordinator Sekbid Keagamaan"
                value={osimAccountForm.osimPosition}
                onChange={e => setOsimAccountForm({ ...osimAccountForm, osimPosition: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1">Seksi Bidang / Departemen</label>
              <div className="flex gap-2">
                <select
                  value={osimDepartments.some(d => d.name === osimAccountForm.osimDepartmentName) ? osimAccountForm.osimDepartmentName : 'custom'}
                  onChange={e => {
                    if (e.target.value !== 'custom') {
                      setOsimAccountForm({ ...osimAccountForm, osimDepartmentName: e.target.value });
                    }
                  }}
                  className="w-1/2 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="BPH (Badan Pengurus Harian)">BPH (Badan Pengurus Harian)</option>
                  {osimDepartments.map(d => (
                    <option key={d.id} value={d.name}>
                      {d.code}: {d.name}
                    </option>
                  ))}
                  <option value="custom">Ketik Nama Manual...</option>
                </select>
                <input
                  type="text"
                  placeholder="Nama Seksi Bidang / Departemen"
                  value={osimAccountForm.osimDepartmentName}
                  onChange={e => setOsimAccountForm({ ...osimAccountForm, osimDepartmentName: e.target.value })}
                  className="w-1/2 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Status Akun Login</label>
              <select
                value={osimAccountForm.status}
                onChange={e => setOsimAccountForm({ ...osimAccountForm, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Aktif">Aktif (Dapat Login)</option>
                <option value="Nonaktif">Nonaktif (Diblokir/Purna)</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={osimAccountForm.isCashManager}
                  onChange={e => setOsimAccountForm({ ...osimAccountForm, isCashManager: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <span className="text-xs text-zinc-300 font-medium">Beri Hak Kelola Buku Kas OSIM</span>
              </label>
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-zinc-800">
              <label className="block text-xs font-semibold text-amber-400 mb-1">
                {isAddingOsimAccount ? 'Kata Sandi Awal *' : 'Ganti Kata Sandi (Kosongkan jika tidak ingin merubah)'}
              </label>
              <div className="relative">
                <input
                  type={showFormPassword ? 'text' : 'password'}
                  placeholder={isAddingOsimAccount ? 'Masukkan password awal' : 'Ketik kata sandi baru untuk merubah'}
                  value={osimAccountForm.password}
                  onChange={e => setOsimAccountForm({ ...osimAccountForm, password: e.target.value })}
                  className="w-full pl-3 pr-9 py-2 bg-zinc-900 border border-amber-500/40 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowFormPassword(!showFormPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  {showFormPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Kata sandi akan otomatis disinkronkan ke <strong>cPanel Admin</strong> dan <strong>Struktur Kabinet</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsOsimAccountModalOpen(false)}
              className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              Simpan & Sinkronkan Akun
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================== */}
      {/* MODAL CEPAT GANTI PASSWORD OSIM (PEMBINA) */}
      {/* ========================================================== */}
      <Modal
        isOpen={isOsimAccountResetModalOpen}
        onClose={() => setIsOsimAccountResetModalOpen(false)}
        title={`Ubah Kata Sandi: ${selectedOsimAccount?.displayName || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmQuickResetOsimPassword} className="space-y-4 text-xs">
          <div className="bg-amber-950/20 border border-amber-500/40 p-3 rounded-lg flex items-start gap-2.5">
            <Key className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-zinc-200 font-semibold text-xs">
                Otorisasi Khusus Pembina OSIM
              </p>
              <p className="text-zinc-400 text-[11px] mt-0.5 leading-relaxed">
                Anda sedang mengubah kata sandi login untuk siswa <strong>{selectedOsimAccount?.displayName}</strong> (@{selectedOsimAccount?.username}). Password lama otomatis digantikan dan tidak berlaku lagi.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Kata Sandi Baru *
            </label>
            <div className="relative">
              <input
                type={showQuickResetText ? 'text' : 'password'}
                required
                value={quickResetPasswordText}
                onChange={e => setQuickResetPasswordText(e.target.value)}
                placeholder="Masukkan kata sandi baru"
                className="w-full pl-3 pr-9 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowQuickResetText(!showQuickResetText)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                {showQuickResetText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedOsimAccount && (
              <button
                type="button"
                onClick={() => {
                  const defaultP = getDefaultOsimPassword(selectedOsimAccount.osimDepartmentCode || selectedOsimAccount.osimRole || selectedOsimAccount.username);
                  setQuickResetPasswordText(defaultP);
                }}
                className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-mono border border-amber-500/40 transition flex items-center gap-1"
              >
                <Key className="w-3 h-3 text-amber-400" />
                <span>Set Standar Sekbid ({getDefaultOsimPassword(selectedOsimAccount.osimDepartmentCode || selectedOsimAccount.osimRole || selectedOsimAccount.username)})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setQuickResetPasswordText(`osim${new Date().getFullYear()}`)}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono border border-zinc-700 transition"
            >
              Set ke "osim{new Date().getFullYear()}"
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsOsimAccountResetModalOpen(false)}
              className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              Simpan Kata Sandi Baru
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================== */}
      {/* MODAL CETAK SLIP KARTU LOGIN PENGURUS OSIM */}
      {/* ========================================================== */}
      <Modal
        isOpen={isOsimPrintSlipsModalOpen}
        onClose={() => setIsOsimPrintSlipsModalOpen(false)}
        title="Cetak Kartu Akses Login Pengurus OSIM"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          {/* Header Kontrol Cetak */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-lg gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-zinc-100">Format Resmi Madrasah:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  A4 Landscape (2 Kolom)
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Kartu berisi NIS, Kelas, Jabatan Kabinet, Username, Password default, dan lembar legalitas madrasah.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const targets = printSlipTarget === 'all' ? osimAccounts : [printSlipTarget];
                  handleExecutePrintSlips(targets);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition shadow-sm"
                title="Buka lembar cetak dokumen bersih dan siap diprint ke PDF"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Dokumen Resmi (PDF)</span>
              </button>
            </div>
          </div>

          {/* Selector Target Pengurus */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-zinc-950/60 p-2.5 rounded border border-zinc-800/80">
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-300 font-medium">Pilih Sasaran Cetak:</label>
              <select
                value={printSlipTarget === 'all' ? 'all' : printSlipTarget.uid}
                onChange={e => {
                  if (e.target.value === 'all') {
                    setPrintSlipTarget('all');
                  } else {
                    const acc = osimAccounts.find(u => u.uid === e.target.value);
                    if (acc) setPrintSlipTarget(acc);
                  }
                }}
                className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="all">Cetak Semua Pengurus ({osimAccounts.length} Siswa)</option>
                {osimAccounts.map(acc => (
                  <option key={acc.uid} value={acc.uid}>
                    {acc.displayName} (@{acc.username}) - {acc.osimPosition || 'Pengurus'}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-[11px] text-amber-400 font-mono">
              Total: {printSlipTarget === 'all' ? osimAccounts.length : 1} Kartu Siap Dicetak
            </span>
          </div>

          {/* Pratinjau Lembar Kartu (Printable Canvas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-1 bg-zinc-950/40 rounded-lg border border-zinc-800/60">
            {(printSlipTarget === 'all' ? osimAccounts : [printSlipTarget]).map(acc => {
              const linkedMem = osimMembers.find(m =>
                m.id === acc.uid ||
                (m.loginUsername && acc.username && m.loginUsername.toLowerCase() === acc.username.toLowerCase()) ||
                (m.username && acc.username && m.username.toLowerCase() === acc.username.toLowerCase()) ||
                (m.studentNis && acc.nip && m.studentNis === acc.nip) ||
                (m.fullName.toLowerCase().trim() === acc.displayName.toLowerCase().replace(/\s*\(.*\)$/, '').trim())
              );
              const studentClass = linkedMem?.className || acc.studentClass || '-';
              const studentNis = linkedMem?.studentNis || acc.nip || '-';
              const position = linkedMem?.position || acc.osimPosition || 'Pengurus OSIM';
              const department = linkedMem?.sekbid || acc.osimDepartmentName || (acc.osimRole === 'ketua' || acc.osimRole === 'wakil' || acc.osimRole === 'sekretaris' || acc.osimRole === 'bendahara' ? 'BPH (Badan Pengurus Harian)' : 'Seksi Bidang OSIM');

              return (
                <div key={acc.uid} className="bg-white text-zinc-900 border-2 border-amber-600 rounded-lg p-3.5 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-amber-600 text-white font-extrabold flex items-center justify-center text-[10px] shadow-xs">
                        OS
                      </div>
                      <div>
                        <h4 className="font-bold text-xs leading-none text-zinc-900">{schoolSetting?.name || 'MADRASAH ALIYAH'}</h4>
                        <p className="text-[8px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">KARTU AKSES LOGIN RESMI PENGURUS OSIM</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                      {acc.osimRole || 'SEKBID'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="col-span-2">
                      <span className="text-zinc-500 text-[10px] block">Nama Lengkap Siswa:</span>
                      <span className="font-bold text-zinc-950 text-xs">{acc.displayName}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] block">NIS / NISN:</span>
                      <span className="font-semibold text-zinc-900 font-mono">{studentNis}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] block">Kelas Siswa:</span>
                      <span className="font-semibold text-zinc-900 font-mono">{studentClass}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] block">Jabatan Kabinet:</span>
                      <span className="font-semibold text-zinc-900">{position}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] block">Seksi Bidang:</span>
                      <span className="font-semibold text-zinc-900 truncate block">{department}</span>
                    </div>

                    <div className="col-span-2 bg-amber-50/90 border border-amber-300 rounded p-2.5 mt-1">
                      <div className="flex items-center justify-between text-[9px] font-bold text-amber-950 uppercase border-b border-amber-200/80 pb-1 mb-1.5">
                        <span>PORTAL SIM KESISWAAN</span>
                        <span>HAK AKSES RESMI</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 font-mono">
                        <div>
                          <span className="text-zinc-600 text-[9px] block uppercase font-sans">Username Login:</span>
                          <span className="font-bold text-zinc-950 text-xs">@{acc.username}</span>
                        </div>
                        <div>
                          <span className="text-zinc-600 text-[9px] block uppercase font-sans">Kata Sandi (Password):</span>
                          <span className="font-bold text-amber-900 text-xs">{acc.password || 'password'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-dashed border-zinc-300 flex items-center justify-between text-[9px] text-zinc-500">
                    <span>Simpan kerahasiaan akun. Perubahan kata sandi hanya melalui Pembina OSIM.</span>
                    <span className="font-mono font-semibold">{activeAcademicYear}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
            <span className="text-[11px] text-zinc-400">
              Tips: Gunakan tombol <strong>Cetak Dokumen Resmi (PDF)</strong> untuk membuka halaman cetak bersih tanpa elemen antarmuka website.
            </span>
            <button
              type="button"
              onClick={() => setIsOsimPrintSlipsModalOpen(false)}
              className="px-4 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>

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
