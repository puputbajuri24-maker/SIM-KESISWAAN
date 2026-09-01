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
    id: 'ekskul_paskibra',
    name: 'Paskibra Pasukan Pengibar Bendera',
    category: 'Bela Negara',
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
    id: 'ekskul_pks',
    name: 'Patroli Keamanan Sekolah (PKS)',
    category: 'Bela Negara',
    description: 'Penegakan ketertiban, pengaturan lalu lintas penyeberangan madrasah, dan patroli kedisiplinan.',
    coachId: '',
    coachName: 'Belum Ditentukan',
    assistantCoachName: '',
    day: 'Selasa',
    startTime: '15:30',
    endTime: '17:00',
    location: 'Gerbang Utama & Pos Keamanan',
    quota: 35,
    memberCount: 0,
    status: 'Aktif',
    vision: 'Mewujudkan lingkungan madrasah yang tertib, aman, kondusif, dan taat peraturan tata tertib.',
    mission: '1. Pelatihan 12 gerakan dasar pengaturan lalu lintas. 2. Pengawalan ketertiban upacara dan gerbang madrasah.',
    target: 'Menciptakan zero-incident ketertiban dan kedisiplinan di area madrasah.',
    academicYear: '2026/2027',
    logoUrl: 'https://images.unsplash.com/photo-1579208575657-c595a05383b7?w=150&auto=format&fit=crop&q=80'
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
    id: 'ekskul_bulutangkis',
    name: 'Bulutangkis (Badminton) Club',
    category: 'Olahraga',
    description: 'Pelatihan footwork, smash tajam, netting, stamina, dan taktik bermain tunggal maupun ganda.',
    coachId: '',
    coachName: 'Belum Ditentukan',
    assistantCoachName: '',
    day: 'Senin',
    startTime: '15:30',
    endTime: '17:30',
    location: 'Gedung Olahraga / Lapangan Indoor',
    quota: 30,
    memberCount: 0,
    status: 'Aktif',
    vision: 'Melahirkan atlet bulutangkis muda yang lincah, bermental juara, dan berprestasi tingkat daerah.',
    mission: '1. Latihan footwork dan endurance fisik. 2. Simulasi turnamen tunggal dan ganda.',
    target: 'Meraih medali O2SN Cabang Bulutangkis Tingkat Kabupaten SBT.',
    academicYear: '2026/2027',
    logoUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'ekskul_silat',
    name: 'Pencak Silat Seni & Tanding',
    category: 'Olahraga',
    description: 'Pelestarian seni bela diri nusantara, jurus baku IPSI, teknik tanding, dan pembentukan watak kesatria.',
    coachId: '',
    coachName: 'Belum Ditentukan',
    assistantCoachName: '',
    day: 'Sabtu',
    startTime: '08:00',
    endTime: '10:30',
    location: 'Aula Utama Madrasah',
    quota: 40,
    memberCount: 0,
    status: 'Aktif',
    vision: 'Mewadahi pembentukan pribadi beriman, berbudi pekerti luhur, dan berprestasi di arena silat.',
    mission: '1. Penguasaan jurus tunggal baku dan teknik tanding. 2. Pembinaan mental spiritual pesilat santun.',
    target: 'Meraih medali emas di Kejuaraan Pencak Silat Pelajar Se-Maluku.',
    academicYear: '2026/2027',
    logoUrl: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'ekskul_tahfidz',
    name: 'Tahfidz & Tilawatil Qur\'an',
    category: 'Keagamaan',
    description: 'Bimbingan menghafal Al-Qur\'an metode mutqin, perbaikan tajwid/makhorijul huruf, dan seni nagham tilawah.',
    coachId: '',
    coachName: 'Belum Ditentukan',
    assistantCoachName: '',
    day: 'Senin',
    startTime: '15:30',
    endTime: '17:00',
    location: 'Masjid / Musholla Utama MAN 2 SBT',
    quota: 60,
    memberCount: 0,
    status: 'Aktif',
    vision: 'Melahirkan generasi Qur\'ani yang hafal, paham, mengamalkan, dan melantunkan Al-Qur\'an dengan indah.',
    mission: '1. Setoran hafalan berkala terstruktur. 2. Bimbingan nagham tilawah MTQ.',
    target: 'Mencetak wisudawan tahfidz 3-5 juz dan juara MTQ Pelajar.',
    academicYear: '2026/2027',
    logoUrl: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'ekskul_kir',
    name: 'Karya Ilmiah Remaja (KIR) & Sains',
    category: 'Akademik',
    description: 'Riset metodologi ilmiah, penulisan esai, eksperimen laboratorium IPA terpadu, dan persiapan KSM/MYRES.',
    coachId: '',
    coachName: 'Belum Ditentukan',
    assistantCoachName: '',
    day: 'Selasa',
    startTime: '15:30',
    endTime: '17:00',
    location: 'Laboratorium IPA Terpadu',
    quota: 35,
    memberCount: 0,
    status: 'Aktif',
    vision: 'Melahirkan peneliti muda yang kritis, kreatif, objektif, dan solutif terhadap problematika sains.',
    mission: '1. Bimbingan penulisan karya tulis ilmiah (KTI). 2. Partisipasi kompetisi MYRES & KSM Kemenag.',
    target: 'Menjadi Finalis MYRES dan lolos seleksi KSM Nasional.',
    academicYear: '2026/2027',
    logoUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=150&auto=format&fit=crop&q=80'
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
export const INITIAL_OSIM_DEPARTMENTS: OsimDepartment[] = DEFAULT_OSIM_DEPARTMENTS;

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

export const INITIAL_CASH_ACCOUNTS: CashAccount[] = [
  {
    id: 'kas_utama_kesiswaan',
    name: 'Kas Utama Bidang Kesiswaan',
    code: 'KAS-KSW',
    category: 'Kesiswaan',
    description: 'Kas operasional kesiswaan madrasah, apresiasi kejuaraan siswa, reward prestasi, dan agenda akbar kesiswaan.',
    assignedManagerUserIds: ['user_super_admin'],
    assignedManagerNames: ['Super Administrator'],
    initialBalance: 5000000,
    academicYear: '2026/2027',
    isActive: true,
    color: '#3b82f6'
  },
  {
    id: 'kas_osim_intrakurikuler',
    name: 'Kas OSIM & Intrakurikuler',
    code: 'KAS-OSIM',
    category: 'OSIM',
    description: 'Dana operasional kegiatan organisasi siswa intra madrasah, peringatan PHBI/PHBN, dan proker sekbid OSIM.',
    assignedManagerUserIds: [],
    assignedManagerNames: [],
    initialBalance: 2500000,
    academicYear: '2026/2027',
    isActive: true,
    color: '#f59e0b'
  },
  {
    id: 'kas_peduli_bk',
    name: 'Kas Peduli Siswa & Sosial BK',
    code: 'KAS-BK',
    category: 'BK',
    description: 'Dana sosial santunan siswa yatim/dhuafa, bantuan darurat perlengkapan madrasah, dan konseling home visit.',
    assignedManagerUserIds: [],
    assignedManagerNames: [],
    initialBalance: 1850000,
    academicYear: '2026/2027',
    isActive: true,
    color: '#ec4899'
  },
  {
    id: 'kas_ekskul_pramuka',
    name: 'Kas Gugus Depan Pramuka',
    code: 'KAS-PRA',
    category: 'Ekstrakurikuler',
    targetEkskulId: 'ekskul_pramuka',
    description: 'Kas operasional latihan kepanduan, pemeliharaan tenda/sanggar, dan kontingen lomba penegak.',
    assignedManagerUserIds: [],
    assignedManagerNames: [],
    initialBalance: 1200000,
    academicYear: '2026/2027',
    isActive: true,
    color: '#10b981'
  },
  {
    id: 'kas_ekskul_pmr',
    name: 'Kas PMR Wira Kemanusiaan',
    code: 'KAS-PMR',
    category: 'Ekstrakurikuler',
    targetEkskulId: 'ekskul_pmr',
    description: 'Kas persediaan obat-obatan P3K, sarana UKS, latihan pertolongan pertama, dan kegiatan donor darah.',
    assignedManagerUserIds: [],
    assignedManagerNames: [],
    initialBalance: 950000,
    academicYear: '2026/2027',
    isActive: true,
    color: '#ef4444'
  }
];

export const INITIAL_CASH_TRANSACTIONS: CashTransaction[] = [
  {
    id: 'trx_001',
    accountId: 'kas_utama_kesiswaan',
    accountName: 'Kas Utama Bidang Kesiswaan',
    accountCode: 'KAS-KSW',
    type: 'MASUK',
    category: 'Dana BOS/BOM Kesiswaan',
    amount: 5000000,
    date: '2026-08-01',
    title: 'Saldo Awal Alokasi Anggaran Kesiswaan T.A. 2026/2027',
    description: 'Penerimaan alokasi dana operasional program pembinaan kesiswaan semester ganjil.',
    recipientOrPayer: 'Bendahara Madrasah / DIPA Kemenag',
    referenceNumber: 'BKM-202608-001',
    status: 'VERIFIED',
    recordedByUid: 'user_super_admin',
    recordedByName: 'Super Administrator',
    recordedByRole: 'Super Admin',
    academicYear: '2026/2027'
  },
  {
    id: 'trx_002',
    accountId: 'kas_peduli_bk',
    accountName: 'Kas Peduli Siswa & Sosial BK',
    accountCode: 'KAS-BK',
    type: 'MASUK',
    category: 'Infaq / Shadaqah Peduli BK',
    amount: 1850000,
    date: '2026-08-05',
    title: 'Infaq Jumat Berkah Guru & Karyawan Peduli Siswa',
    description: 'Penerimaan penggalangan infaq sukarela dewan guru untuk kas peduli siswa dhuafa & yatim.',
    recipientOrPayer: 'Koordinator Infaq Jumat Berkah',
    referenceNumber: 'BKM-202608-002',
    status: 'VERIFIED',
    recordedByUid: 'user_super_admin',
    recordedByName: 'Koordinator Guru BK',
    recordedByRole: 'Guru BK',
    academicYear: '2026/2027'
  },
  {
    id: 'trx_003',
    accountId: 'kas_osim_intrakurikuler',
    accountName: 'Kas OSIM & Intrakurikuler',
    accountCode: 'KAS-OSIM',
    type: 'MASUK',
    category: 'Dana Kegiatan OSIM',
    amount: 2500000,
    date: '2026-08-10',
    title: 'Dana Stimulus Program Kerja OSIM 2026/2027',
    description: 'Penyaluran dana stimulus awal kegiatan pengurus OSIM masa bakti 2026/2027.',
    recipientOrPayer: 'Waka Kesiswaan',
    referenceNumber: 'BKM-202608-003',
    status: 'VERIFIED',
    recordedByUid: 'user_super_admin',
    recordedByName: 'Pembina OSIM',
    recordedByRole: 'Pembina OSIM',
    academicYear: '2026/2027'
  },
  {
    id: 'trx_004',
    accountId: 'kas_peduli_bk',
    accountName: 'Kas Peduli Siswa & Sosial BK',
    accountCode: 'KAS-BK',
    type: 'KELUAR',
    category: 'Santunan Siswa Kurang Mampu',
    amount: 350000,
    date: '2026-08-15',
    title: 'Bantuan Perlengkapan Seragam & Sepatu Siswa Dhuafa (X MIA 1)',
    description: 'Pembelian sepasang sepatu sekolah dan seragam pramuka untuk siswa pasca penelusuran home visit BK.',
    recipientOrPayer: 'Toko Seragam Berkah Bula',
    referenceNumber: 'BKK-202608-001',
    status: 'VERIFIED',
    recordedByUid: 'user_super_admin',
    recordedByName: 'Guru BK',
    recordedByRole: 'Guru BK',
    academicYear: '2026/2027'
  },
  {
    id: 'trx_005',
    accountId: 'kas_utama_kesiswaan',
    accountName: 'Kas Utama Bidang Kesiswaan',
    accountCode: 'KAS-KSW',
    type: 'KELUAR',
    category: 'Hadiah / Medali / Piagam',
    amount: 750000,
    date: '2026-08-18',
    title: 'Pengadaan Trophy & Piagam Apresiasi Juara Kesiswaan',
    description: 'Pemesanan trophy kejuaraan dan sertifikat berbingkai untuk reward santri berprestasi lomba sains.',
    recipientOrPayer: 'Percetakan & Trophy Sentosa',
    referenceNumber: 'BKK-202608-002',
    status: 'VERIFIED',
    recordedByUid: 'user_super_admin',
    recordedByName: 'Super Administrator',
    recordedByRole: 'Super Admin',
    academicYear: '2026/2027'
  }
];

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

// =========================================================================
// BUKU TATA TERTIB & KODE ETIK SISWA RESMI (HANDBOOK & CODE OF CONDUCT)
// =========================================================================
export const INITIAL_HANDBOOK_META: SchoolHandbookMeta = {
  decreeNumber: 'SK/421.3/089/MAN-SBT/KESISWAAN/2026',
  decreeTitle: 'Surat Keputusan Kepala Madrasah tentang Tata Tertib, Kode Etik, dan Pedoman Disiplin Siswa',
  effectiveDate: '2026-07-15',
  academicYear: '2026/2027',
  totalPoinMax: 100,
  thresholdSp1: 25, // SP 1 & Pembinaan Wali Kelas / BK
  thresholdSp2: 50, // SP 2 & Panggilan Orang Tua
  thresholdSp3: 75, // SP 3 & Skorsing Edukatif
  thresholdDrop: 100, // Konferensi Pleno Kasus & Pengembalian ke Orang Tua
  signedBy: 'Drs. H. M. Nur Latarissa, M.Pd.I.',
  signedNip: '19700412 199803 1 003',
  wakaName: 'Abdul Malik Kelian, S.Pd.I.',
  wakaNip: '19820515 200901 1 012',
  issuedPlace: 'Bula',
  issuedDate: '2026-07-15',
  lastUpdated: new Date().toISOString()
};

export const INITIAL_SCHOOL_RULES: SchoolRuleArticle[] = [
  // BAB I: KETENTUAN UMUM & KEHADIRAN
  {
    id: 'rule_01',
    chapter: 'Bab I: Ketentuan Umum & Kehadiran',
    articleNumber: 'Pasal 1 Ayat 1',
    title: 'Keterlambatan Masuk Sekolah (>15 Menit)',
    description: 'Siswa hadir di madrasah/sekolah melebihi batas waktu bel masuk (pukul 07.15 WIT) tanpa alasan atau surat keterangan yang dapat dipertanggungjawabkan.',
    points: 5,
    severity: 'Ringan',
    consequence: 'Pencatatan di buku piket, pembinaan lisan oleh guru piket, dan pemberian surat izin masuk kelas setelah menyelesaikan tugas literasi/edukatif.',
    authorizedOfficer: 'Guru Piket / Tim Disiplin Kesiswaan',
    sopSteps: ['Pemeriksaan jam kedatangan di gerbang', 'Pencatatan identitas di SIM Kesiswaan', 'Pemberian slip izin masuk kelas'],
    isMandatory: true,
    academicYear: '2026/2027'
  },
  {
    id: 'rule_02',
    chapter: 'Bab I: Ketentuan Umum & Kehadiran',
    articleNumber: 'Pasal 1 Ayat 2',
    title: 'Meninggalkan Lingkungan Sekolah Tanpa Izin (Membolos)',
    description: 'Siswa meninggalkan area sekolah pada saat jam pelajaran berlangsung tanpa izin tertulis dari Guru Piket atau Wali Kelas.',
    points: 15,
    severity: 'Sedang',
    consequence: 'Pemanggilan oleh Wali Kelas, pembuatan surat komitmen disiplin, dan pemberitahuan langsung via WhatsApp/telepon kepada orang tua/wali.',
    authorizedOfficer: 'Wali Kelas & Guru BK',
    sopSteps: ['Verifikasi laporan guru mata pelajaran', 'Investigasi & konseling oleh BK', 'Pemberitahuan kepada orang tua siswa'],
    isMandatory: true,
    academicYear: '2026/2027'
  },
  {
    id: 'rule_03',
    chapter: 'Bab I: Ketentuan Umum & Kehadiran',
    articleNumber: 'Pasal 2 Ayat 1',
    title: 'Tidak Masuk Sekolah Tanpa Keterangan (Alpa)',
    description: 'Siswa tidak hadir di sekolah tanpa surat izin resmi dari orang tua atau surat keterangan sakit dari dokter/fasyankes.',
    points: 10,
    severity: 'Ringan',
    consequence: 'Konfirmasi kehadiran oleh wali kelas kepada orang tua/wali, serta penugasan mandiri materi pelajaran yang tertinggal.',
    authorizedOfficer: 'Wali Kelas',
    sopSteps: ['Wali kelas menghubungi orang tua', 'Pencatatan alpa pada presensi digital', 'Pembinaan kehadiran saat siswa masuk kembali'],
    isMandatory: true,
    academicYear: '2026/2027'
  },
  {
    id: 'rule_04',
    chapter: 'Bab I: Ketentuan Umum & Kehadiran',
    articleNumber: 'Pasal 2 Ayat 2',
    title: 'Tidak Mengikuti Upacara Bendera Hari Senin / PHBN',
    description: 'Siswa berada di lingkungan sekolah namun sengaja bersembunyi di kantin, kelas, atau toilet untuk menghindari upacara bendera.',
    points: 10,
    severity: 'Ringan',
    consequence: 'Pembinaan kedisiplinan dan rasa nasionalisme oleh pembina upacara serta penugasan resume amanat pembina upacara.',
    authorizedOfficer: 'Pembina OSIM & Guru Piket',
    sopSteps: ['Penertiban oleh pengurus OSIM & guru piket', 'Penyuluhan nilai kebangsaan', 'Pembuatan laporan ringkasan upacara'],
    isMandatory: true,
    academicYear: '2026/2027'
  },

  // BAB II: PAKAIAN, SERAGAM & KERAPIAN
  {
    id: 'rule_05',
    chapter: 'Bab II: Pakaian, Seragam & Kerapian',
    articleNumber: 'Pasal 3 Ayat 1',
    title: 'Pakaian Seragam Tidak Sesuai Ketentuan Hari / Tidak Rapi',
    description: 'Siswa memakai seragam yang tidak sesuai jadwal harian, baju tidak dimasukkan (bagi putra), atau celana/rok dimodifikasi ketat (model pensil/cutbrai tidak standar).',
    points: 5,
    severity: 'Ringan',
    consequence: 'Teguran lisan, merapikan seragam di tempat, dan peringatan untuk mengembalikan potongan seragam sesuai pola baku madrasah.',
    authorizedOfficer: 'Guru Piket / Wali Kelas',
    sopSteps: ['Pemeriksaan kerapian seragam', 'Peringatan pertama', 'Batas waktu 3 hari penyesuaian jika celana dirombak'],
    isMandatory: true,
    academicYear: '2026/2027'
  },
  {
    id: 'rule_06',
    chapter: 'Bab II: Pakaian, Seragam & Kerapian',
    articleNumber: 'Pasal 3 Ayat 2',
    title: 'Atribut Seragam Tidak Lengkap (Dasi, Topi, Bet, Papan Nama)',
    description: 'Siswa tidak memakai kelengkapan atribut seragam madrasah seperti bet lokasi, papan nama dada, dasi, atau kaos kaki berlogo.',
    points: 5,
    severity: 'Ringan',
    consequence: 'Pemberian peringatan dan siswa diwajibkan melengkapi atribut melalui koperasi sekolah atau pengadaan mandiri.',
    authorizedOfficer: 'Guru Piket / Pengurus OSIM',
    sopSteps: ['Pengecekan kelengkapan saat upacara/pintu masuk', 'Pencatatan poin pelanggaran atribut'],
    isMandatory: true,
    academicYear: '2026/2027'
  },
  {
    id: 'rule_07',
    chapter: 'Bab II: Pakaian, Seragam & Kerapian',
    articleNumber: 'Pasal 4 Ayat 1',
    title: 'Rambut Tidak Rapi / Panjang / Diwarnai (Cat Rambut)',
    description: 'Siswa putra memelihara rambut panjang (melebihi batas kerah/telinga, pola di luar 3-2-1), dicukur model ekstrim, atau siswa mewarnai rambut dengan cat bukan hitam alami.',
    points: 10,
    severity: 'Ringan',
    consequence: 'Pemberian tenggat waktu 2 (dua) hari untuk memotong/menghitamkan rambut secara mandiri; jika tidak diindahkan dilakukan perapian oleh tim kesiswaan.',
    authorizedOfficer: 'Tim Tatib Kesiswaan & Wali Kelas',
    sopSteps: ['Pemeriksaan panjang rambut', 'Pemberian surat peringatan kerapian', 'Verifikasi ulang setelah 2 hari'],
    isMandatory: true,
    academicYear: '2026/2027'
  },
  {
    id: 'rule_08',
    chapter: 'Bab II: Pakaian, Seragam & Kerapian',
    articleNumber: 'Pasal 4 Ayat 2',
    title: 'Penggunaan Make-up Berlebihan / Aksesoris Terlarang & Tindik',
    description: 'Siswa putri memakai riasan wajah berlebihan (lipstik mencolok, maskara, cat kuku) atau siswa putra bertindik, bertato, atau memakai kalung/gelang rantai.',
    points: 15,
    severity: 'Sedang',
    consequence: 'Pembersihan riasan di ruang BK, penyitaan aksesoris non-edukatif, dan pembinaan estetika kesopanan pelajar.',
    authorizedOfficer: 'Guru BK & Tim Kesiswaan Putri',
    sopSteps: ['Pemeriksaan di ruang konseling', 'Penyitaan aksesoris', 'Pencatatan rekaman bimbingan kepribadian'],
    isMandatory: true,
    academicYear: '2026/2027'
  },

  // BAB III: ETIKA, PERILAKU & SOPAN SANTUN
  {
    id: 'rule_09',
    chapter: 'Bab III: Etika, Perilaku & Sopan Santun',
    articleNumber: 'Pasal 5 Ayat 1',
    title: 'Bersikap Tidak Sopan / Melawan Instruksi Guru & Tenaga Kependidikan',
    description: 'Siswa bersikap membangkang, berkata kasar, berteriak, atau memperlihatkan gestur tidak hormat kepada guru, karyawan, atau tamu madrasah.',
    points: 25,
    severity: 'Sedang',
    consequence: 'Permintaan maaf secara tertulis dan lisan di hadapan pimpinan madrasah, konseling perilaku oleh BK, dan pembinaan adab.',
    authorizedOfficer: 'Guru BK & Waka Kesiswaan',
    sopSteps: ['Pengaduan guru/staf bersangkutan', 'Pemanggilan siswa ke ruang BK', 'Pembuatan surat pernyataan penyesalan & permohonan maaf'],
    isMandatory: true,
    academicYear: '2026/2027'
  },
  {
    id: 'rule_10',
    chapter: 'Bab III: Etika, Perilaku & Sopan Santun',
    articleNumber: 'Pasal 5 Ayat 2',
    title: 'Meninggalkan Sholat Berjamaah / Kegiatan Ibadah Wajib',
    description: 'Siswa bersembunyi atau menolak mengikuti sholat Dzuhur/Ashar berjamaah, tadarus pagi, atau ibadah keagamaan rutin madrasah.',
    points: 10,
    severity: 'Ringan',
    consequence: 'Bimbingan ibadah khusus, setoran bacaan sholat/Al-Qur\'an di hadapan guru PAI / pembina keagamaan.',
    authorizedOfficer: 'Pembina Keagamaan & Guru PAI',
    sopSteps: ['Penertiban masjid/musholla', 'Pencatatan presensi sholat', 'Bimbingan tahsin/fikih ibadah praktis'],
    isMandatory: true,
    academicYear: '2026/2027'
  },
  {
    id: 'rule_11',
    chapter: 'Bab III: Etika, Perilaku & Sopan Santun',
    articleNumber: 'Pasal 6 Ayat 1',
    title: 'Membuang Sampah Sembarangan / Merusak Fasilitas Madrasah',
    description: 'Siswa membuang bungkus makanan di laci meja/taman, mencoret-coret meja/dinding (vandalisme), atau merusak sarana prasarana sekolah.',
    points: 15,
    severity: 'Sedang',
    consequence: 'Kewajiban membersihkan/mengecat kembali fasilitas yang dirusak serta mengganti kerugian materiil sarana yang rusak.',
    authorizedOfficer: 'Wali Kelas & Urusan Sarana Prasarana',
    sopSteps: ['Identifikasi pelaku vandalisme', 'Kerja bakti pemulihan lingkungan', 'Pemberitahuan kepada wali murid terkait penggantian'],
    isMandatory: true,
    academicYear: '2026/2027'
  },

  // BAB IV: LARANGAN KERAS & KETERTIBAN UMUM
  {
    id: 'rule_12',
    chapter: 'Bab IV: Larangan Keras & Ketertiban Umum',
    articleNumber: 'Pasal 7 Ayat 1',
    title: 'Membawa, Menyimpan, Menghisap Rokok atau Vape (Rokok Elektrik)',
    description: 'Siswa kedapatan membawa, menyimpan, atau menghisap rokok konvensional / rokok elektrik (vape/pod) di lingkungan madrasah, radius 500m dari madrasah, atau saat mengenakan seragam.',
    points: 35,
    severity: 'Sedang',
    consequence: 'Penyitaan dan pemusnahan barang bukti, penerbitan Surat Peringatan I (SP 1), pemanggilan orang tua ke madrasah, dan konseling adiksi oleh BK.',
    authorizedOfficer: 'Tim Tatib Kesiswaan & Guru BK',
    sopSteps: ['Penyitaan barang bukti', 'Penerbitan surat panggilan orang tua', 'Penandatanganan pakta anti-rokok bersama orang tua'],
    isMandatory: true,
    academicYear: '2026/2027'
  },
  {
    id: 'rule_13',
    chapter: 'Bab IV: Larangan Keras & Ketertiban Umum',
    articleNumber: 'Pasal 7 Ayat 2',
    title: 'Melakukan Perundungan (Bullying) Fisik, Verbal, atau Siber',
    description: 'Siswa melakukan intimidasi, pemalakan, penghinaan fisik/sosial, pengucilan, atau kekerasan psikologis baik langsung maupun melalui media sosial kepada teman.',
    points: 50,
    severity: 'Berat',
    consequence: 'Penerbitan Surat Peringatan II (SP 2), mediasi restoratif bersama korban, skorsing edukatif 3 hari pembinaan orang tua di rumah, dan terapi empati BK.',
    authorizedOfficer: 'Tim Pencegahan & Penanganan Kekerasan (TPPK) / Guru BK',
    sopSteps: ['Penyelamatan & perlindungan korban', 'Konferensi kasus internal', 'Penjatuhan sanksi SP 2 & pendampingan psikososial'],
    isMandatory: true,
    academicYear: '2026/2027'
  },
  {
    id: 'rule_14',
    chapter: 'Bab IV: Larangan Keras & Ketertiban Umum',
    articleNumber: 'Pasal 8 Ayat 1',
    title: 'Berkelahi / Terlibat Tawuran Antar Siswa atau Antar Sekolah',
    description: 'Siswa terlibat dalam perkelahian fisik perorangan atau pengeroyokan/tawuran massal yang membahayakan keselamatan jiwa dan merusak nama baik lembaga.',
    points: 75,
    severity: 'Berat',
    consequence: 'Penerbitan Surat Peringatan III (SP 3/Peringatan Terakhir), skorsing belajar 7 hari kerja, penandatanganan komitmen bermaterai, dan pembebanan biaya pengobatan korban.',
    authorizedOfficer: 'Waka Kesiswaan & Kepala Madrasah',
    sopSteps: ['Pengamanan pelaku & saksi', 'Pertemuan pleno dengan kedua belah pihak orang tua', 'Penerbitan SK Skorsing dari Kepala Madrasah'],
    isMandatory: true,
    academicYear: '2026/2027'
  },
  {
    id: 'rule_15',
    chapter: 'Bab IV: Larangan Keras & Ketertiban Umum',
    articleNumber: 'Pasal 8 Ayat 2',
    title: 'Membawa Senjata Tajam, Senjata Api, atau Bahan Peledak',
    description: 'Siswa membawa benda tajam berbahaya tanpa kaitan dengan tugas KBM (misal: pisau komando, celurit, gir motor, petasan) ke lingkungan madrasah.',
    points: 85,
    severity: 'Sangat Berat',
    consequence: 'Penyitaan barang bukti, koordinasi dengan aparat keamanan / Polsek setempat, dan sidang dewan guru untuk penetapan status kelanjutan studi siswa.',
    authorizedOfficer: 'Kepala Madrasah & Tim Disiplin',
    sopSteps: ['Penyitaan & pengamanan darurat', 'Panggilan darurat orang tua', 'Sidang dewan guru'],
    isMandatory: true,
    academicYear: '2026/2027'
  },
  {
    id: 'rule_16',
    chapter: 'Bab IV: Larangan Keras & Ketertiban Umum',
    articleNumber: 'Pasal 9 Ayat 1',
    title: 'Membawa, Mengedarkan, atau Mengonsumsi Narkotika & Minuman Keras',
    description: 'Siswa terbukti positif atau membawa obat-obatan terlarang, psikotropika, miras, atau zat adiktif berbahaya di dalam maupun di luar madrasah.',
    points: 100,
    severity: 'Sangat Berat',
    consequence: 'Dikembalikan secara permanen kepada orang tua/wali murid, dilaporkan ke pihak berwajib untuk proses rehabilitasi hukum.',
    authorizedOfficer: 'Kepala Madrasah & Dewan Guru',
    sopSteps: ['Tes urine / pengamanan bukti', 'Rapat Pleno Dewan Guru', 'Penerbitan SK Pengembalian ke Orang Tua'],
    isMandatory: true,
    academicYear: '2026/2027'
  },
  {
    id: 'rule_17',
    chapter: 'Bab IV: Larangan Keras & Ketertiban Umum',
    articleNumber: 'Pasal 9 Ayat 2',
    title: 'Melakukan Tindak Pidana Pencurian, Perjudian, atau Pemerasan (Palak)',
    description: 'Siswa mengambil barang/uang milik orang lain, bermain judi online/offline, atau memaksa meminta uang dari siswa lain disertai ancaman.',
    points: 75,
    severity: 'Berat',
    consequence: 'Pengembalian barang bukti / ganti rugi 100%, penerbitan Surat Peringatan Keras, dan wajib lapor pembinaan harian selama 1 bulan.',
    authorizedOfficer: 'Guru BK & Waka Kesiswaan',
    sopSteps: ['Pemeriksaan saksi & barang bukti', 'Kompensasi restitusi ke korban', 'Pembinaan intensif BK'],
    isMandatory: true,
    academicYear: '2026/2027'
  },

  // BAB V: PENGGUNAAN PERANGKAT ELEKTRONIK & MEDSOS
  {
    id: 'rule_18',
    chapter: 'Bab V: Penggunaan Perangkat Elektronik & Medsos',
    articleNumber: 'Pasal 10 Ayat 1',
    title: 'Mengoperasikan HP / Smartphone Saat KBM Tanpa Izin Guru',
    description: 'Siswa bermain game, mengakses media sosial, menonton video, atau menggunakan ponsel saat proses belajar mengajar tanpa instruksi guru pengampu.',
    points: 10,
    severity: 'Ringan',
    consequence: 'Pengamanan smartphone di ruang piket kesiswaan dan hanya dapat diambil saat jam pulang sekolah atau oleh wali kelas.',
    authorizedOfficer: 'Guru Mata Pelajaran & Guru Piket',
    sopSteps: ['Penitipan HP di loker piket', 'Pencatatan pelanggaran KBM', 'Pengembalian pada akhir jam KBM'],
    isMandatory: true,
    academicYear: '2026/2027'
  },
  {
    id: 'rule_19',
    chapter: 'Bab V: Penggunaan Perangkat Elektronik & Medsos',
    articleNumber: 'Pasal 10 Ayat 2',
    title: 'Merekam / Menyebarkan Konten Asusila atau Pencemaran Nama Baik',
    description: 'Siswa menyimpan/menyebarkan video/gambar pornografi atau membuat unggahan di media sosial (TikTok, Instagram, WhatsApp) yang mencemarkan martabat guru/madrasah.',
    points: 80,
    severity: 'Sangat Berat',
    consequence: 'Pemberitahuan orang tua, penghapusan konten secara terverifikasi, pembuatan klarifikasi publik, dan sanksi skorsing belajar.',
    authorizedOfficer: 'Tim IT Kesiswaan & Waka Kesiswaan',
    sopSteps: ['Take down konten digital', 'Pemeriksaan forensik digital', 'Panggilan orang tua & sanksi hukum UU ITE jika diperlukan'],
    isMandatory: true,
    academicYear: '2026/2027'
  },

  // BAB VI: KEGIATAN EKSTRAKURIKULER & ORGANISASI
  {
    id: 'rule_20',
    chapter: 'Bab VI: Kegiatan Ekstrakurikuler & Organisasi',
    articleNumber: 'Pasal 11 Ayat 1',
    title: 'Mangkir dari Kegiatan Ekstrakurikuler Wajib (Pramuka/PBB)',
    description: 'Siswa tidak menghadiri latihan mingguan kegiatan ekstrakurikuler wajib tanpa izin resmi dari Pembina Ekskul.',
    points: 10,
    severity: 'Ringan',
    consequence: 'Penugasan materi kepramukaan / resume nilai kepemimpinan dan kompensasi jam latihan.',
    authorizedOfficer: 'Pembina Pramuka / Ekstrakurikuler',
    sopSteps: ['Pemeriksaan absensi ekskul', 'Penugasan pengganti'],
    isMandatory: true,
    academicYear: '2026/2027'
  },

  // BAB VII: APRESIASI, PRESTASI & PEMULIHAN DISIPLIN (RESTORATIVE JUSTICE)
  {
    id: 'rule_21',
    chapter: 'Bab VII: Apresiasi, Prestasi & Pemulihan Disiplin',
    articleNumber: 'Pasal 12 Ayat 1',
    title: 'Apresiasi: Juara Lomba Akademik / Non-Akademik Tingkat Kota s.d. Nasional',
    description: 'Siswa mengharumkan nama madrasah dengan meraih prestasi Juara 1, 2, atau 3 pada kejuaraan resmi tingkat kabupaten/kota, provinsi, maupun nasional.',
    points: 30, // Poin Positif / Pengurang Pelanggaran
    severity: 'Apresiasi',
    consequence: 'Pemberian piagam penghargaan resmi, pemutihan poin pelanggaran tercatat s.d. 30 poin, dan publikasi di papan prestasi madrasah.',
    authorizedOfficer: 'Waka Kesiswaan & Kepala Madrasah',
    sopSteps: ['Verifikasi sertifikat kejuaraan', 'Pencatatan prestasi pada SIM Kesiswaan', 'Pemotongan akumulasi poin pelanggaran'],
    isMandatory: true,
    academicYear: '2026/2027'
  },
  {
    id: 'rule_22',
    chapter: 'Bab VII: Apresiasi, Prestasi & Pemulihan Disiplin',
    articleNumber: 'Pasal 12 Ayat 2',
    title: 'Apresiasi: Pengurus Inti OSIM / MPK / Ketua Ekskul yang Berdedikasi',
    description: 'Siswa aktif menjalankan amanah kepemimpinan organisasi dengan dedikasi tinggi dan tidak memiliki catatan pelanggaran berat.',
    points: 15, // Poin Positif
    severity: 'Apresiasi',
    consequence: 'Surat keterangan keteladanan siswa dan pengurangan poin akumulasi pelanggaran ringan.',
    authorizedOfficer: 'Pembina OSIM & Waka Kesiswaan',
    sopSteps: ['Rekomendasi pembina organisasi', 'Pemberian kredit poin kebaikan'],
    isMandatory: true,
    academicYear: '2026/2027'
  },
  {
    id: 'rule_23',
    chapter: 'Bab VII: Apresiasi, Prestasi & Pemulihan Disiplin',
    articleNumber: 'Pasal 13 Ayat 1',
    title: 'Program Restitusi: Tahfidz Al-Qur\'an / Khatam Al-Qur\'an',
    description: 'Siswa yang memiliki catatan pelanggaran ringan/sedang bersedia menyelesaikan hafalan Juz 30 atau khatam Al-Qur\'an di bawah bimbingan guru PAI.',
    points: 20, // Pengurangan Poin Pelanggaran
    severity: 'Apresiasi',
    consequence: 'Pemutihan akumulasi poin pelanggaran sebesar 20 poin dan pencatatan perkembangan karakter positif.',
    authorizedOfficer: 'Guru BK & Pembina Keagamaan',
    sopSteps: ['Penyusunan kontrak pemulihan karakter', 'Setoran hafalan', 'Pengurangan poin di sistem'],
    isMandatory: true,
    academicYear: '2026/2027'
  },
  {
    id: 'rule_24',
    chapter: 'Bab VII: Apresiasi, Prestasi & Pemulihan Disiplin',
    articleNumber: 'Pasal 13 Ayat 2',
    title: 'Program Restitusi: Kerja Sosial Peduli Lingkungan & Kebersihan Terjadwal',
    description: 'Siswa secara konsisten dan sukarela merawat taman madrasah, membersihkan perpustakaan, atau mengelola bank sampah madrasah selama 2 pekan berturut-turut.',
    points: 15, // Pengurangan Poin Pelanggaran
    severity: 'Apresiasi',
    consequence: 'Pengurangan 15 poin pelanggaran dan pemberian sertifikat duta kebersihan madrasah.',
    authorizedOfficer: 'Guru BK & Koordinator Lingkungan Hidup',
    sopSteps: ['Pelaksanaan program kerja bakti mandiri', 'Validasi presensi kebersihan', 'Pembaruan data skor disiplin'],
    isMandatory: true,
    academicYear: '2026/2027'
  }
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
      'osim_meetings',
      'cash_accounts',
      'cash_transactions'
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
