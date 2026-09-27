import { OFFICIAL_HANDBOOK_META, OFFICIAL_SCHOOL_RULES } from './officialRulesData';
import {
  UserProfile,
  SchoolSetting,
  AcademicYear,
  SchoolClass,
  Student,
  Teacher,
  Extracurricular,
  ExtracurricularMember,
  ScheduleEvent,
  AttendanceSession,
  SchoolActivity,
  ActivityReport,
  StudentViolation,
  StudentCounseling,
  HomeVisitRecord,
  ParentCallLetter,
  CareerGuidanceRecord,
  StudentAchievement,
  StudentPermission,
  NeedsRequest,
  Announcement,
  NotificationItem,
  AuditLogItem,
  OsimMember,
  OsimWorkProgram,
  OsimAspiration,
  OsimMeeting,
  OsimDepartment,
  DEFAULT_OSIM_DEPARTMENTS,
  CashAccount,
  CashTransaction,
  SchoolRuleArticle,
  SchoolHandbookMeta
} from '../types';
import { db } from './firebase';
import { doc, setDoc, writeBatch, collection, getDocs, deleteDoc } from 'firebase/firestore';

export const INITIAL_SCHOOL_SETTING: SchoolSetting = {
  id: 'main_school',
  name: 'MAN 2 SERAM BAGIAN TIMUR',
  centralInstitution: 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
  regionalInstitution: 'KANTOR KEMENTERIAN AGAMA KABUPATEN SERAM BAGIAN TIMUR',
  npsn: '60728491',
  address: 'Jl. Lintas Seram, Kec. Bula, Kab. Seram Bagian Timur, Maluku',
  postalCode: '97554',
  defaultCity: 'Bula',
  principalName: 'Zakaria, S. Pd.I., M. Pd',
  principalNip: '197808042003121008',
  wakaName: 'Puput Eka Bajuri, S. Pd., M. Or',
  wakaNip: '198810052020121003',
  wakaKesiswaanName: 'Puput Eka Bajuri, S. Pd., M. Or',
  pembinaOsim: 'Puput Eka Bajuri, S. Pd., M. Or',
  pembinaOsimNip: '198810052020121003',
  phone: '(0915) 21189',
  email: 'man2sbt@kemenag.go.id',
  website: 'https://man2serambagiantimur.sch.id',
  currentAcademicYear: '2026/2027',
  currentSemester: 'Ganjil',
  logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Logo_Kementerian_Agama.png/240px-Logo_Kementerian_Agama.png',
  logoLeftUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Logo_Kementerian_Agama.png/480px-Logo_Kementerian_Agama.png',
  logoRightUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Logo_Kementerian_Agama.png/240px-Logo_Kementerian_Agama.png',
  defaultSignaturesConfig: {
    city: 'Bula',
    defaultSlotsCount: 3,
    showNip: true,
    isLockedByUser: false,
    signatories: [
      {
        id: 'sig-left',
        order: 0,
        alignment: 'left',
        prefix: '',
        roleTitle: 'Koordinator Guru BK / Pembina',
        name: 'Guru BK / Pembina',
        nipOrIdentifier: 'Pamong Pembinaan',
        customSubtitle: 'Pamong Pembinaan',
        isActive: true
      },
      {
        id: 'sig-center',
        order: 1,
        alignment: 'center',
        prefix: 'Menyetujui,',
        roleTitle: 'Waka Bidang Kesiswaan',
        name: 'Puput Eka Bajuri, S. Pd., M. Or',
        nipOrIdentifier: '198810052020121003',
        customSubtitle: 'Pimpinan Kesiswaan',
        isActive: true
      },
      {
        id: 'sig-right',
        order: 2,
        alignment: 'right',
        prefix: 'Bula, 27 September 2026',
        roleTitle: 'Kepala Madrasah',
        name: 'Zakaria, S. Pd.I., M. Pd',
        nipOrIdentifier: '197808042003121008',
        customSubtitle: 'Penanggung Jawab Lembaga',
        isActive: true
      }
    ]
  }
};

export const INITIAL_ACADEMIC_YEARS: AcademicYear[] = [
  {
    id: 'ay_2026_ganjil',
    year: '2026/2027',
    semester: 'Ganjil',
    isActive: true,
    startDate: '2026-07-15',
    endDate: '2026-12-20'
  },
  {
    id: 'ay_2026_genap',
    year: '2026/2027',
    semester: 'Genap',
    isActive: false,
    startDate: '2027-01-05',
    endDate: '2027-06-20'
  },
  {
    id: 'ay_2025_genap',
    year: '2025/2026',
    semester: 'Genap',
    isActive: false,
    startDate: '2026-01-05',
    endDate: '2026-06-20'
  }
];

export const INITIAL_CLASSES: SchoolClass[] = [];

export const DEFAULT_SUPER_ADMIN: UserProfile = {
  uid: 'user_super_admin',
  email: 'admin@sekolah.sch.id',
  username: 'admin',
  password: 'password',
  displayName: 'Puput Eka Bajuri, S. Pd., M. Or., Gr',
  role: 'super_admin',
  phone: '082298836027',
  nip: '198810052020121003',
  status: 'Aktif'
};

export const getDefaultOsimPassword = (codeOrRole: string): string => {
  const clean = (codeOrRole || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.includes('ketua') && !clean.includes('wakil') && !clean.includes('sekbid')) return 'ketua@osim2026';
  if (clean.includes('wakil')) return 'wakil@osim2026';
  if (clean.includes('sekr')) return 'sekretaris@osim2026';
  if (clean.includes('bend')) return 'bendahara@osim2026';
  if (clean.startsWith('sekbid')) {
    const num = clean.replace(/[^0-9]/g, '');
    return num ? `sekbid${num}@2026` : `${clean}@2026`;
  }
  return `${clean || 'osim'}@2026`;
};

export const generateDefaultOsimAccounts = (departments: OsimDepartment[] = DEFAULT_OSIM_DEPARTMENTS): UserProfile[] => {
  // MODEL A: 4 Akun Fungsional Khusus Pengurus Inti OSIM (Badan Pengurus Harian / BPH)
  const bphDept = departments.find(d => d.id === 'dept_bph' || d.code === 'BPH');
  const bphId = bphDept?.id || 'dept_bph';
  const bphCode = bphDept?.code || 'BPH';
  const bphName = bphDept?.name || 'BPH (Badan Pengurus Harian)';

  const bphAccounts: UserProfile[] = [
    {
      uid: 'user_osim_ketua',
      email: 'osim.ketua@madrasah.sch.id',
      username: 'osim.ketua',
      password: getDefaultOsimPassword('ketua'),
      displayName: 'Ketua OSIM',
      role: 'pengurus_osim',
      osimRole: 'ketua',
      osimPosition: 'Ketua Umum OSIM',
      osimDepartmentId: bphId,
      osimDepartmentCode: bphCode,
      osimDepartmentName: bphName,
      status: 'Aktif',
      createdAt: '2026-07-15T08:00:00.000Z'
    },
    {
      uid: 'user_osim_wakil',
      email: 'osim.wakil@madrasah.sch.id',
      username: 'osim.wakil',
      password: getDefaultOsimPassword('wakil'),
      displayName: 'Wakil Ketua OSIM',
      role: 'pengurus_osim',
      osimRole: 'wakil',
      osimPosition: 'Wakil Ketua 1',
      osimDepartmentId: bphId,
      osimDepartmentCode: bphCode,
      osimDepartmentName: bphName,
      status: 'Aktif',
      createdAt: '2026-07-15T08:00:00.000Z'
    },
    {
      uid: 'user_osim_sekretaris',
      email: 'osim.sekretaris@madrasah.sch.id',
      username: 'osim.sekretaris',
      password: getDefaultOsimPassword('sekretaris'),
      displayName: 'Sekretaris OSIM',
      role: 'pengurus_osim',
      osimRole: 'sekretaris',
      osimPosition: 'Sekretaris Umum',
      osimDepartmentId: bphId,
      osimDepartmentCode: bphCode,
      osimDepartmentName: bphName,
      status: 'Aktif',
      createdAt: '2026-07-15T08:00:00.000Z'
    },
    {
      uid: 'user_osim_bendahara',
      email: 'osim.bendahara@madrasah.sch.id',
      username: 'osim.bendahara',
      password: getDefaultOsimPassword('bendahara'),
      displayName: 'Bendahara OSIM',
      role: 'pengurus_osim',
      osimRole: 'bendahara',
      osimPosition: 'Bendahara Umum',
      isCashManager: true,
      cashManagerTitle: 'Bendahara OSIM',
      cashFundScopes: ['kas_osim'],
      osimDepartmentId: bphId,
      osimDepartmentCode: bphCode,
      osimDepartmentName: bphName,
      status: 'Aktif',
      createdAt: '2026-07-15T08:00:00.000Z'
    }
  ];

  // Akun Fungsional Seksi Bidang (Sekbid 1 s.d. 8)
  const sekbidDepts = departments.filter(d => d.id !== 'dept_bph' && d.code !== 'BPH');
  const sekbidAccounts: UserProfile[] = sekbidDepts.map((dept, idx) => {
    const cleanCode = (dept.code || `sekbid${idx + 1}`).toLowerCase().replace(/[^a-z0-9]/g, '');
    const username = `osim.${cleanCode}`;

    return {
      uid: `user_osim_${dept.id}`,
      email: `${username}@madrasah.sch.id`,
      username,
      password: getDefaultOsimPassword(dept.code || `sekbid${idx + 1}`),
      displayName: `Pengurus OSIM - ${dept.name.split(':')[0].trim()}`,
      role: 'pengurus_osim',
      osimRole: 'sekbid',
      osimPosition: `Ketua ${dept.code}`,
      osimDepartmentId: dept.id,
      osimDepartmentCode: dept.code,
      osimDepartmentName: dept.name,
      status: 'Aktif',
      createdAt: '2026-07-15T08:00:00.000Z'
    };
  });

  return [...bphAccounts, ...sekbidAccounts];
};

export const DEFAULT_OSIM_ACCOUNTS: UserProfile[] = [];

export const DEMO_USERS: UserProfile[] = [
  DEFAULT_SUPER_ADMIN
];

export const INITIAL_TEACHERS: Teacher[] = [];

export const INITIAL_EXTRACURRICULARS: Extracurricular[] = [];

export const PURGED_DEMO_EKSKUL_IDS = [
  'ekskul_pramuka',
  'ekskul_paskibra',
  'ekskul_pmr',
  'ekskul_pks',
  'ekskul_futsal',
  'ekskul_basket',
  'ekskul_bulutangkis',
  'ekskul_silat',
  'ekskul_tahfidz',
  'ekskul_kir',
  'ekskul_robotik'
];

export const isPurgedExtracurricular = (nameOrId: string = ''): boolean => {
  const lower = (nameOrId || '').toLowerCase();
  return (
    lower.includes('fotografi') ||
    lower.includes('sinematografi') ||
    PURGED_DEMO_EKSKUL_IDS.includes(nameOrId)
  );
};

// Operational Collections initialized as CLEAN EMPTY ARRAYS ready for user upload
export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_MEMBERS: ExtracurricularMember[] = [];
export const INITIAL_SCHEDULES: ScheduleEvent[] = [];
export const INITIAL_ATTENDANCE: AttendanceSession[] = [];
export const INITIAL_ACTIVITIES: SchoolActivity[] = [];
export const INITIAL_REPORTS: ActivityReport[] = [];
export const INITIAL_VIOLATIONS: StudentViolation[] = [];
export const INITIAL_COUNSELING: StudentCounseling[] = [];
export const INITIAL_HOME_VISITS: HomeVisitRecord[] = [];
export const INITIAL_PARENT_CALL_LETTERS: ParentCallLetter[] = [];
export const INITIAL_CAREER_GUIDANCES: CareerGuidanceRecord[] = [];
export const INITIAL_ACHIEVEMENTS: StudentAchievement[] = [];
export const INITIAL_PERMISSIONS: StudentPermission[] = [];
export const INITIAL_NEEDS_REQUESTS: NeedsRequest[] = [];
export const INITIAL_OSIM_MEMBERS: OsimMember[] = [];
export const INITIAL_OSIM_PROGRAMS: OsimWorkProgram[] = [];
export const INITIAL_OSIM_ASPIRATIONS: OsimAspiration[] = [];
export const INITIAL_OSIM_MEETINGS: OsimMeeting[] = [];
export const INITIAL_OSIM_DEPARTMENTS: OsimDepartment[] = DEFAULT_OSIM_DEPARTMENTS;

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [];

export const INITIAL_CASH_ACCOUNTS: CashAccount[] = [];
export const INITIAL_CASH_TRANSACTIONS: CashTransaction[] = [];

// Helper to seed master structure to Firebase Firestore
export async function seedAllFirebaseData(): Promise<{ success: boolean; message: string }> {
  try {
    const allOperations: Array<{ collection: string; id: string; data: any }> = [];

    // School Settings
    allOperations.push({ collection: 'schools', id: INITIAL_SCHOOL_SETTING.id, data: INITIAL_SCHOOL_SETTING });

    // Academic Years
    for (const ay of INITIAL_ACADEMIC_YEARS) {
      allOperations.push({ collection: 'academic_years', id: ay.id, data: ay });
    }

    // Classes
    for (const c of INITIAL_CLASSES) {
      allOperations.push({ collection: 'classes', id: c.id, data: c });
    }

    // Users
    for (const u of DEMO_USERS) {
      allOperations.push({ collection: 'users', id: u.uid, data: u });
    }

    // Teachers
    for (const t of INITIAL_TEACHERS) {
      allOperations.push({ collection: 'teachers', id: t.id, data: t });
    }

    // Extracurriculars
    for (const e of INITIAL_EXTRACURRICULARS) {
      allOperations.push({ collection: 'extracurriculars', id: e.id, data: e });
    }

    // Announcements
    for (const ann of INITIAL_ANNOUNCEMENTS) {
      allOperations.push({ collection: 'announcements', id: ann.id, data: ann });
    }

    // Commit in chunks of 200
    const CHUNK_SIZE = 200;
    for (let i = 0; i < allOperations.length; i += CHUNK_SIZE) {
      const chunk = allOperations.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const op of chunk) {
        batch.set(doc(db, op.collection, op.id), op.data, { merge: true });
      }
      await batch.commit();
    }

    return { success: true, message: 'Data struktur sekolah & akun berhasil disinkronkan ke Firebase Firestore.' };
  } catch (error: any) {
    console.error('Error seeding data to Firebase:', error);
    return { success: false, message: error.message || 'Gagal melakukan seed data ke Firebase.' };
  }
}

export const PURGED_DEMO_UIDS = [
  'user_waka',
  'user_guru_bk',
  'user_pembina_osim',
  'user_pembina_pramuka',
  'user_pembina_basket',
  'user_pembina_pmr',
  'user_pembina_robotik',
  'user_waka_puput',
  'user_bk_nur_asiyah',
  'user_bk_ahmad_rusdi',
  'user_bk_siti_aminah',
  'user_pembina_osim_fauzi',
  'user_pembina_pramuka_rahmat',
  'user_pembina_paskibra_syarif',
  'user_pembina_pmr_fatimah',
  'user_pembina_pks_hasan',
  'user_pembina_futsal_ilham',
  'role_active_guru_bk',
  'role_active_pembina_osim',
  'role_active_pembina_ekskul',
  'role_active_waka_kesiswaan',
  // Generic OSIM accounts (purged permanently in favor of real student NIS accounts)
  'user_osim_dept_bph',
  'user_osim_ketua',
  'user_osim_wakil',
  'user_osim_sekretaris',
  'user_osim_bendahara',
  'user_osim_dept_sekbid_1',
  'user_osim_dept_sekbid_2',
  'user_osim_dept_sekbid_3',
  'user_osim_dept_sekbid_4',
  'user_osim_dept_sekbid_5',
  'user_osim_dept_sekbid_6',
  'user_osim_dept_sekbid_7',
  'user_osim_dept_sekbid_8'
];

export const PURGED_DEMO_TEACHER_IDS = [
  't1',
  't_bk',
  't_osim',
  't2',
  't3',
  't4',
  't5',
  't6',
  't7',
  't8',
  't9',
  't10'
];

export const PURGED_DEMO_EMAILS = [
  'waka@sekolah.sch.id',
  'guru.bk@sekolah.sch.id',
  'pembina.osim@sekolah.sch.id',
  'pembina.pramuka@sekolah.sch.id',
  'pembina.basket@sekolah.sch.id',
  'pembina.pmr@sekolah.sch.id',
  'pembina.robotik@sekolah.sch.id',
  'dewi.seni@sekolah.sch.id',
  'paskibra@sekolah.sch.id',
  'english.club@sekolah.sch.id',
  'futsal@sekolah.sch.id',
  'waka@man2sbt.sch.id',
  'nur.asiyah@man2sbt.sch.id',
  'ahmad.rusdi@man2sbt.sch.id',
  'siti.aminah@man2sbt.sch.id',
  'pembina.osim@man2sbt.sch.id',
  'pembina.pramuka@man2sbt.sch.id',
  'pembina.paskibra@man2sbt.sch.id',
  'pembina.pmr@man2sbt.sch.id',
  'pembina.pks@man2sbt.sch.id',
  'pembina.futsal@man2sbt.sch.id',
  // Generic OSIM account emails
  'osim.ketua@madrasah.sch.id',
  'osim.wakil@madrasah.sch.id',
  'osim.sekretaris@madrasah.sch.id',
  'osim.bendahara@madrasah.sch.id',
  'osim.sekbid1@madrasah.sch.id',
  'osim.sekbid2@madrasah.sch.id',
  'osim.sekbid3@madrasah.sch.id',
  'osim.sekbid4@madrasah.sch.id',
  'osim.sekbid5@madrasah.sch.id',
  'osim.sekbid6@madrasah.sch.id',
  'osim.sekbid7@madrasah.sch.id',
  'osim.sekbid8@madrasah.sch.id'
];

// =========================================================================
// BUKU TATA TERTIB & KODE ETIK SISWA RESMI (HANDBOOK & CODE OF CONDUCT)
// =========================================================================
export const INITIAL_HANDBOOK_META: SchoolHandbookMeta = OFFICIAL_HANDBOOK_META;
export const INITIAL_SCHOOL_RULES: SchoolRuleArticle[] = OFFICIAL_SCHOOL_RULES;

export const PURGED_DEMO_NAMES = [
  'ahmad wattimena',
  'endang sulastri',
  'nurul hidayati',
  'hendra wijaya',
  'ahmad fadhil',
  'siti rahmawati',
  'bayu prasetyo',
  'rina astuti',
  'dewi anggraini',
  'suryadi',
  'fitria ananda',
  'rizky pratama',
  'nur asiyah',
  'ahmad rusdi',
  'siti aminah',
  'ahmad fauzi',
  'rahmat hidayat',
  'syarifudin',
  'fatimah azzahra',
  'hasan basri',
  'ilham pratama',
  'abdul malik'
];

export function isBlacklistedDemoName(name?: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase().trim();
  if (lower.includes('(demo)') || lower.includes('(dummy)') || lower.includes('contoh user') || lower.includes('sample')) {
    return true;
  }
  return PURGED_DEMO_NAMES.some(n => lower === n);
}

// Helper to wipe all operational data collections in Firebase Firestore
export async function clearAllFirebaseOperationalData(): Promise<{ success: boolean; message: string }> {
  try {
    const collectionsToClear = [
      'students',
      'extracurriculars',
      'extracurricular_members',
      'schedules',
      'attendance',
      'activities',
      'activity_reports',
      'violations',
      'counseling',
      'home_visits',
      'parent_call_letters',
      'career_guidances',
      'achievements',
      'permissions',
      'needs_requests',
      'osim_members',
      'osim_programs',
      'osim_aspirations',
      'osim_meetings',
      'cash_accounts',
      'cash_transactions',
      'announcements'
    ];

    for (const colName of collectionsToClear) {
      try {
        const snap = await getDocs(collection(db, colName));
        const batch = writeBatch(db);
        snap.forEach(docSnap => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      } catch (colErr) {
        console.warn(`Note clearing collection ${colName}:`, colErr);
      }
    }

    // Clean any demo users from users collection, keeping only super admin
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const userBatch = writeBatch(db);
      usersSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (docSnap.id !== 'user_super_admin' && (PURGED_DEMO_UIDS.includes(docSnap.id) || isBlacklistedDemoName(data.displayName))) {
          userBatch.delete(docSnap.ref);
        }
      });
      await userBatch.commit();
    } catch (userErr) {
      console.warn('Note cleaning demo users:', userErr);
    }

    // Clean teachers collection if any demo teacher exists
    try {
      const teachersSnap = await getDocs(collection(db, 'teachers'));
      const teacherBatch = writeBatch(db);
      teachersSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (isBlacklistedDemoName(data.name || (data as any).fullName)) {
          teacherBatch.delete(docSnap.ref);
        }
      });
      await teacherBatch.commit();
    } catch (teacherErr) {
      console.warn('Note cleaning demo teachers:', teacherErr);
    }

    return { success: true, message: 'Seluruh data operasional & akun demo di Firestore berhasil dibersihkan.' };
  } catch (err: any) {
    console.error('Error clearing operational collections in Firebase:', err);
    return { success: false, message: err?.message || 'Gagal membersihkan data operasional Firestore.' };
  }
}

// Upload all active application state to Cloud Firestore in chunks
export async function uploadAllStateToFirebase(bundle: {
  schoolSetting?: any;
  academicYears?: any[];
  classes?: any[];
  teachers?: any[];
  students?: any[];
  extracurriculars?: any[];
  members?: any[];
  schedules?: any[];
  attendance?: any[];
  activities?: any[];
  activityReports?: any[];
  violations?: any[];
  counseling?: any[];
  homeVisits?: any[];
  parentCallLetters?: any[];
  careerGuidances?: any[];
  achievements?: any[];
  permissions?: any[];
  needsRequests?: any[];
  osimMembers?: any[];
  osimPrograms?: any[];
  osimAspirations?: any[];
  osimMeetings?: any[];
  osimDepartments?: any[];
  cashAccounts?: any[];
  cashTransactions?: any[];
  schoolRules?: any[];
  handbookMeta?: any;
  announcements?: any[];
  auditLogs?: any[];
}): Promise<{ success: boolean; message: string; count: number }> {
  try {
    const allOperations: Array<{ collection: string; id: string; data: any }> = [];

    // School Setting
    if (bundle.schoolSetting && bundle.schoolSetting.id) {
      allOperations.push({ collection: 'schools', id: bundle.schoolSetting.id, data: bundle.schoolSetting });
    }

    // Academic Years
    if (Array.isArray(bundle.academicYears)) {
      for (const ay of bundle.academicYears) {
        if (ay && ay.id) allOperations.push({ collection: 'academic_years', id: ay.id, data: ay });
      }
    }

    // Classes
    if (Array.isArray(bundle.classes)) {
      for (const c of bundle.classes) {
        if (c && c.id && !c.id.includes('rpl') && !c.id.includes('tkj') && !c.id.includes('dummy')) {
          allOperations.push({ collection: 'classes', id: c.id, data: c });
        }
      }
    }

    // Teachers
    if (Array.isArray(bundle.teachers)) {
      for (const t of bundle.teachers) {
        if (t && t.id && !isBlacklistedDemoName(t.fullName || (t as any).name)) {
          allOperations.push({ collection: 'teachers', id: t.id, data: t });
        }
      }
    }

    // Students
    if (Array.isArray(bundle.students)) {
      for (const s of bundle.students) {
        if (s && s.id && !isBlacklistedDemoName(s.fullName || (s as any).name)) {
          allOperations.push({ collection: 'students', id: s.id, data: s });
        }
      }
    }

    // Extracurriculars
    if (Array.isArray(bundle.extracurriculars)) {
      for (const e of bundle.extracurriculars) {
        if (e && e.id) allOperations.push({ collection: 'extracurriculars', id: e.id, data: e });
      }
    }

    // Extracurricular Members
    if (Array.isArray(bundle.members)) {
      for (const m of bundle.members) {
        if (m && m.id) allOperations.push({ collection: 'extracurricular_members', id: m.id, data: m });
      }
    }

    // Schedules
    if (Array.isArray(bundle.schedules)) {
      for (const sc of bundle.schedules) {
        if (sc && sc.id) allOperations.push({ collection: 'schedules', id: sc.id, data: sc });
      }
    }

    // Attendance
    if (Array.isArray(bundle.attendance)) {
      for (const att of bundle.attendance) {
        if (att && att.id) allOperations.push({ collection: 'attendance', id: att.id, data: att });
      }
    }

    // Activities
    if (Array.isArray(bundle.activities)) {
      for (const a of bundle.activities) {
        if (a && a.id) allOperations.push({ collection: 'activities', id: a.id, data: a });
      }
    }

    // Activity Reports
    if (Array.isArray(bundle.activityReports)) {
      for (const r of bundle.activityReports) {
        if (r && r.id) allOperations.push({ collection: 'activity_reports', id: r.id, data: r });
      }
    }

    // Violations
    if (Array.isArray(bundle.violations)) {
      for (const v of bundle.violations) {
        if (v && v.id) allOperations.push({ collection: 'violations', id: v.id, data: v });
      }
    }

    // Counseling
    if (Array.isArray(bundle.counseling)) {
      for (const cs of bundle.counseling) {
        if (cs && cs.id) allOperations.push({ collection: 'counseling', id: cs.id, data: cs });
      }
    }

    // Home Visits
    if (Array.isArray(bundle.homeVisits)) {
      for (const hv of bundle.homeVisits) {
        if (hv && hv.id) allOperations.push({ collection: 'home_visits', id: hv.id, data: hv });
      }
    }

    // Parent Call Letters
    if (Array.isArray(bundle.parentCallLetters)) {
      for (const pcl of bundle.parentCallLetters) {
        if (pcl && pcl.id) allOperations.push({ collection: 'parent_call_letters', id: pcl.id, data: pcl });
      }
    }

    // Career Guidances
    if (Array.isArray(bundle.careerGuidances)) {
      for (const cg of bundle.careerGuidances) {
        if (cg && cg.id) allOperations.push({ collection: 'career_guidances', id: cg.id, data: cg });
      }
    }

    // Achievements
    if (Array.isArray(bundle.achievements)) {
      for (const ach of bundle.achievements) {
        if (ach && ach.id) allOperations.push({ collection: 'achievements', id: ach.id, data: ach });
      }
    }

    // Permissions
    if (Array.isArray(bundle.permissions)) {
      for (const p of bundle.permissions) {
        if (p && p.id) allOperations.push({ collection: 'permissions', id: p.id, data: p });
      }
    }

    // Needs Requests
    if (Array.isArray(bundle.needsRequests)) {
      for (const nr of bundle.needsRequests) {
        if (nr && nr.id) allOperations.push({ collection: 'needs_requests', id: nr.id, data: nr });
      }
    }

    // OSIM Members
    if (Array.isArray(bundle.osimMembers)) {
      for (const om of bundle.osimMembers) {
        if (om && om.id) allOperations.push({ collection: 'osim_members', id: om.id, data: om });
      }
    }

    // OSIM Programs
    if (Array.isArray(bundle.osimPrograms)) {
      for (const op of bundle.osimPrograms) {
        if (op && op.id) allOperations.push({ collection: 'osim_programs', id: op.id, data: op });
      }
    }

    // OSIM Aspirations
    if (Array.isArray(bundle.osimAspirations)) {
      for (const oa of bundle.osimAspirations) {
        if (oa && oa.id) allOperations.push({ collection: 'osim_aspirations', id: oa.id, data: oa });
      }
    }

    // OSIM Meetings
    if (Array.isArray(bundle.osimMeetings)) {
      for (const om of bundle.osimMeetings) {
        if (om && om.id) allOperations.push({ collection: 'osim_meetings', id: om.id, data: om });
      }
    }

    // OSIM Departments
    if (Array.isArray(bundle.osimDepartments)) {
      for (const od of bundle.osimDepartments) {
        if (od && od.id) allOperations.push({ collection: 'osim_departments', id: od.id, data: od });
      }
    }

    // Cash Accounts
    if (Array.isArray(bundle.cashAccounts)) {
      for (const ca of bundle.cashAccounts) {
        if (ca && ca.id) allOperations.push({ collection: 'cash_accounts', id: ca.id, data: ca });
      }
    }

    // Cash Transactions
    if (Array.isArray(bundle.cashTransactions)) {
      for (const ct of bundle.cashTransactions) {
        if (ct && ct.id) allOperations.push({ collection: 'cash_transactions', id: ct.id, data: ct });
      }
    }

    // School Rules
    if (Array.isArray(bundle.schoolRules)) {
      for (const r of bundle.schoolRules) {
        if (r && r.id) allOperations.push({ collection: 'school_rules', id: r.id, data: r });
      }
    }

    // Handbook Meta
    if (bundle.handbookMeta) {
      allOperations.push({ collection: 'settings', id: 'handbook_meta', data: bundle.handbookMeta });
    }

    // Announcements
    if (Array.isArray(bundle.announcements)) {
      for (const ann of bundle.announcements) {
        if (ann && ann.id) allOperations.push({ collection: 'announcements', id: ann.id, data: ann });
      }
    }

    // Commit in chunks of 200
    const CHUNK_SIZE = 200;
    for (let i = 0; i < allOperations.length; i += CHUNK_SIZE) {
      const chunk = allOperations.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const op of chunk) {
        batch.set(doc(db, op.collection, op.id), op.data, { merge: true });
      }
      await batch.commit();
    }

    return {
      success: true,
      count: allOperations.length,
      message: `Berhasil mengunggah ${allOperations.length} dokumen data ke Cloud Firestore.`
    };
  } catch (error: any) {
    console.error('Error uploading state to Firebase:', error);
    return {
      success: false,
      count: 0,
      message: error.message || 'Gagal mengunggah data ke Cloud Firestore.'
    };
  }
}

