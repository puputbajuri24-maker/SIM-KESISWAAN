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
  OsimMeeting
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
  principalName: 'Drs. H. M. Nur Latarissa, M.Pd.I.',
  principalNip: '19700412 199803 1 003',
  wakaName: '',
  wakaNip: '',
  wakaKesiswaanName: '',
  phone: '(0915) 21189',
  email: 'man2sbt@kemenag.go.id',
  website: 'https://man2serambagiantimur.sch.id',
  currentAcademicYear: '2026/2027',
  currentSemester: 'Ganjil',
  logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Logo_Kementerian_Agama.png/240px-Logo_Kementerian_Agama.png',
  logoLeftUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Logo_Kementerian_Agama.png/480px-Logo_Kementerian_Agama.png',
  logoRightUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Logo_Kementerian_Agama.png/240px-Logo_Kementerian_Agama.png'
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

export const INITIAL_CLASSES: SchoolClass[] = [
  { id: 'c_x_mia1', name: 'X MIA 1', grade: 'X', major: 'MIPA (Matematika & IPA)', homeroomTeacher: '', studentCount: 0 },
  { id: 'c_x_mia2', name: 'X MIA 2', grade: 'X', major: 'MIPA (Matematika & IPA)', homeroomTeacher: '', studentCount: 0 },
  { id: 'c_x_iis1', name: 'X IIS 1', grade: 'X', major: 'IPS (Ilmu-Ilmu Sosial)', homeroomTeacher: '', studentCount: 0 },
  { id: 'c_x_iis2', name: 'X IIS 2', grade: 'X', major: 'IPS (Ilmu-Ilmu Sosial)', homeroomTeacher: '', studentCount: 0 },
  { id: 'c_x_keagamaan', name: 'X Keagamaan', grade: 'X', major: 'Ilmu Keagamaan Islam (IIK)', homeroomTeacher: '', studentCount: 0 },
  { id: 'c_xi_mia1', name: 'XI MIA 1', grade: 'XI', major: 'MIPA (Matematika & IPA)', homeroomTeacher: '', studentCount: 0 },
  { id: 'c_xi_iis1', name: 'XI IIS 1', grade: 'XI', major: 'IPS (Ilmu-Ilmu Sosial)', homeroomTeacher: '', studentCount: 0 },
  { id: 'c_xi_keagamaan', name: 'XI Keagamaan', grade: 'XI', major: 'Ilmu Keagamaan Islam (IIK)', homeroomTeacher: '', studentCount: 0 },
  { id: 'c_xii_mia1', name: 'XII MIA 1', grade: 'XII', major: 'MIPA (Matematika & IPA)', homeroomTeacher: '', studentCount: 0 },
  { id: 'c_xii_iis1', name: 'XII IIS 1', grade: 'XII', major: 'IPS (Ilmu-Ilmu Sosial)', homeroomTeacher: '', studentCount: 0 },
  { id: 'c_xii_keagamaan', name: 'XII Keagamaan', grade: 'XII', major: 'Ilmu Keagamaan Islam (IIK)', homeroomTeacher: '', studentCount: 0 }
];

export const DEMO_USERS: UserProfile[] = [
  {
    uid: 'user_super_admin',
    email: 'admin@sekolah.sch.id',
    username: 'admin',
    password: 'password',
    displayName: 'Super Administrator / Proktor SIM Kesiswaan',
    role: 'super_admin',
    phone: '081234567890',
    nip: '19850101 201001 1 009',
    status: 'Aktif'
  }
];

export const INITIAL_TEACHERS: Teacher[] = [];

export const INITIAL_EXTRACURRICULARS: Extracurricular[] = [
  {
    id: 'ekskul_pramuka',
    name: 'Pramuka Gugus Depan MAN 2 SBT',
    category: 'Kepemimpinan',
    description: 'Pendidikan kepanduan, kedisiplinan, kemandirian, dan cinta alam tanah air.',
    coachId: '',
    coachName: 'Belum Ditentukan',
    assistantCoachName: '',
    day: 'Jumat',
    startTime: '15:30',
    endTime: '17:30',
    location: 'Lapangan Utama & Sanggar Pramuka',
    quota: 80,
    memberCount: 0,
    status: 'Aktif',
    vision: 'Membentuk tunas bangsa yang berkarakter tangguh, religius, berjiwa korsa, dan berwawasan lingkungan.',
    mission: '1. Menyelenggarakan latihan kepramukaan berjenjang. 2. Mengembangkan kemampuan survival dan leadership. 3. Melaksanakan bakti sosial masyarakat.',
    target: 'Meraih Prestasi Lomba Tingkat Penegak Se-Kabupaten SBT & Maluku.',
    academicYear: '2026/2027',
    logoUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'ekskul_basket',
    name: 'Basket Club Patriot (Putra & Putri)',
    category: 'Olahraga',
    description: 'Pengembangan bakat bola basket, strategi permainan, fisik, dan sportivitas kompetisi.',
    coachId: '',
    coachName: 'Belum Ditentukan',
    assistantCoachName: '',
    day: 'Selasa',
    startTime: '15:45',
    endTime: '17:45',
    location: 'Gelanggang Olahraga / Hall Basket',
    quota: 40,
    memberCount: 0,
    status: 'Aktif',
    vision: 'Menjadi tim basket pelajar unggulan yang berprestasi di tingkat regional dengan sportivitas tinggi.',
    mission: '1. Pelatihan teknik dasar dan taktik modern. 2. Penguatan ketahanan fisik.',
    target: 'Lolos Turnamen Antar Pelajar Se-Kabupaten Seram Bagian Timur.',
    academicYear: '2026/2027',
    logoUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'ekskul_pmr',
    name: 'Palang Merah Remaja (PMR) Wira',
    category: 'Sosial',
    description: 'Pelatihan pertolongan pertama, donor darah, penanggulangan bencana, dan bakti kemanusiaan.',
    coachId: '',
    coachName: 'Belum Ditentukan',
    assistantCoachName: '',
    day: 'Rabu',
    startTime: '15:30',
    endTime: '17:15',
    location: 'Ruang UKS & Aula Kesiswaan',
    quota: 50,
    memberCount: 0,
    status: 'Aktif',
    vision: 'Mewujudkan relawan muda yang sigap, tanggap bencana, dan berjiwa sosial kemanusiaan tinggi.',
    mission: '1. Pelatihan PPGD dan sanitasi kesehatan. 2. Bakti sosial berkala.',
    target: 'Juara Umum Jumpa Bakti Gembira (JUMBARA) PMR Kabupaten SBT.',
    academicYear: '2026/2027',
    logoUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'ekskul_robotik',
    name: 'Robotik & Cyber Technology',
    category: 'Teknologi',
    description: 'Desain mikrokontroler Arduino/ESP32, pemrograman robot, IoT cerdas, dan perakitan mekanik.',
    coachId: '',
    coachName: 'Belum Ditentukan',
    assistantCoachName: '',
    day: 'Senin',
    startTime: '15:30',
    endTime: '17:30',
    location: 'Laboratorium Komputer & STEM',
    quota: 30,
    memberCount: 0,
    status: 'Aktif',
    vision: 'Mencetak inovator muda bidang rekayasa teknologi cerdas berbasis nilai Islam.',
    mission: '1. Pembelajaran dasar logika pemograman robot. 2. Proyek inovasi teknologi tepat guna.',
    target: 'Mengikuti Olimpiade Robotik Madrasah Nasional Kemenag RI.',
    academicYear: '2026/2027',
    logoUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'ekskul_paskibra',
    name: 'Paskibra Pasukan Pengibar Bendera',
    category: 'Kepemimpinan',
    description: 'Pelatihan baris-berbaris formal, formasi pengibaran bendera pusaka, fisik militer terukur, dan etika.',
    coachId: '',
    coachName: 'Belum Ditentukan',
    assistantCoachName: '',
    day: 'Sabtu',
    startTime: '07:30',
    endTime: '10:00',
    location: 'Lapangan Utama',
    quota: 40,
    memberCount: 0,
    status: 'Aktif',
    vision: 'Mencetak generasi penerus bangsa yang disiplin, berjiwa patriotik, dan menjunjung kehormatan Sang Merah Putih.',
    mission: '1. Penguasaan Peraturan Baris Berbaris baku. 2. Latihan fisik dan mental kepemimpinan.',
    target: 'Mengirimkan minimal 2 anggota lolos seleksi Paskibraka Tingkat Kabupaten/Provinsi.',
    academicYear: '2026/2027',
    logoUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'ekskul_futsal',
    name: 'Futsal Garuda Muda MAN 2 SBT',
    category: 'Olahraga',
    description: 'Pembinaan olahraga futsal, taktik passing intersep, stamina, dan liga futsal pelajar.',
    coachId: '',
    coachName: 'Belum Ditentukan',
    assistantCoachName: '',
    day: 'Sabtu',
    startTime: '08:00',
    endTime: '10:30',
    location: 'Lapangan Futsal Terbuka',
    quota: 40,
    memberCount: 0,
    status: 'Aktif',
    vision: 'Menjadi tim futsal yang tangkas, disiplin, berprestasi, dan menjunjung persaudaraan.',
    mission: '1. Latihan fisik intensif dan taktik small-sided games. 2. Uji tanding rutin antar sekolah.',
    target: 'Juara 1 Turnamen Futsal Pelajar MAN/SMA Cup.',
    academicYear: '2026/2027',
    logoUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=150&auto=format&fit=crop&q=80'
  }
];

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

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_pembina_lpj',
    title: 'Batas Pengumpulan Laporan Pertanggungjawaban (LPJ) Kegiatan Ekstrakurikuler',
    content: 'Diberitahukan kepada seluruh Guru Pembina Ekstrakurikuler & OSIM bahwa pengunggahan LPJ kegiatan, presensi kehadiran anggota semester berjalan, dan rekap prestasi wajib diselesaikan sebelum akhir bulan ini melalui menu Verifikasi LPJ Kegiatan.',
    targetRole: 'Guru Pembina',
    publishDate: new Date().toISOString().split('T')[0],
    expiryDate: '2026-12-31',
    priority: 'Mendesak',
    authorName: 'Waka Kesiswaan',
    authorRole: 'Waka Kesiswaan',
    isActive: true,
    isPinned: true,
    createdAt: new Date().toISOString().split('T')[0]
  },
  {
    id: 'ann_bk_coordination',
    title: 'Koordinasi Penanganan Siswa Akumulasi Poin Pelanggaran & Panggilan Orang Tua',
    content: 'Mohon kepada Tim Guru Bimbingan Konseling (BK) untuk melakukan rekapitulasi data siswa dengan poin pelanggaran kedisiplinan di atas 30 poin dan segera menerbitkan Surat Panggilan Orang Tua / Home Visit terjadwal.',
    targetRole: 'Guru BK',
    publishDate: new Date().toISOString().split('T')[0],
    expiryDate: '2026-12-31',
    priority: 'Penting',
    authorName: 'Waka Kesiswaan',
    authorRole: 'Waka Kesiswaan',
    isActive: true,
    isPinned: false,
    createdAt: new Date().toISOString().split('T')[0]
  },
  {
    id: 'ann_welcome',
    title: 'Selamat Datang di SIM-KESISWAAN Terpadu',
    content: 'Sistem Informasi Manajemen Kesiswaan aktif melayani pencatatan data siswa, kedisiplinan & konseling BK, presensi digital ekstrakurikuler, dan kegiatan OSIM.',
    targetRole: 'Semua',
    publishDate: new Date().toISOString().split('T')[0],
    expiryDate: '2026-12-31',
    priority: 'Biasa',
    authorName: 'Administrator Sistem',
    authorRole: 'Super Admin',
    isActive: true,
    isPinned: false,
    createdAt: new Date().toISOString().split('T')[0]
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [];

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
  'user_pembina_robotik'
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
  'futsal@sekolah.sch.id'
];

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
  'rizky pratama'
];

export function isBlacklistedDemoName(name?: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return PURGED_DEMO_NAMES.some(n => lower.includes(n));
}

// Helper to wipe all operational data collections in Firebase Firestore
export async function clearAllFirebaseOperationalData(): Promise<{ success: boolean; message: string }> {
  try {
    const collectionsToClear = [
      'students',
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
      'osim_meetings'
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

    return { success: true, message: 'Seluruh data operasional di Firestore berhasil dibersihkan.' };
  } catch (err: any) {
    console.error('Error clearing operational collections in Firebase:', err);
    return { success: false, message: err?.message || 'Gagal membersihkan data operasional Firestore.' };
  }
}
