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
  StudentAchievement,
  StudentPermission,
  NeedsRequest,
  Announcement,
  NotificationItem,
  AuditLogItem
} from '../types';
import { db } from './firebase';
import { doc, setDoc, writeBatch, collection, getDocs } from 'firebase/firestore';

export const INITIAL_SCHOOL_SETTING: SchoolSetting = {
  id: 'main_school',
  name: 'SMA NEGERI 1 TELADAN NUSANTARA',
  npsn: '20108922',
  address: 'Jl. Pemuda Pendidikan No. 45, Kebayoran Baru, Jakarta Selatan',
  principalName: 'Prof. Dr. H. Slamet Riyadi, M.Pd.',
  principalNip: '19680315 199203 1 004',
  wakaName: 'Drs. H. Bambang Suryono, M.Pd.',
  wakaNip: '19740510 199903 1 002',
  phone: '(021) 7892345',
  email: 'info@sman1teladan.sch.id',
  currentAcademicYear: '2026/2027',
  currentSemester: 'Ganjil',
  logoUrl: 'https://images.unsplash.com/photo-1594608661623-aa0bd3a69d98?w=150&auto=format&fit=crop&q=80'
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
  { id: 'c_x_rpl1', name: 'X RPL 1', grade: 'X', major: 'Rekayasa Perangkat Lunak', homeroomTeacher: 'Siti Aminah, S.Kom.', studentCount: 36 },
  { id: 'c_x_rpl2', name: 'X RPL 2', grade: 'X', major: 'Rekayasa Perangkat Lunak', homeroomTeacher: 'Hendra Wijaya, S.Pd.', studentCount: 35 },
  { id: 'c_x_tkj1', name: 'X TKJ 1', grade: 'X', major: 'Teknik Komputer & Jaringan', homeroomTeacher: 'Bayu Prasetyo, M.T.', studentCount: 36 },
  { id: 'c_xi_rpl1', name: 'XI RPL 1', grade: 'XI', major: 'Rekayasa Perangkat Lunak', homeroomTeacher: 'Rina Astuti, S.Kom.', studentCount: 34 },
  { id: 'c_xi_rpl2', name: 'XI RPL 2', grade: 'XI', major: 'Rekayasa Perangkat Lunak', homeroomTeacher: 'Ahmad Fadhil, S.Or.', studentCount: 35 },
  { id: 'c_xi_tkj1', name: 'XI TKJ 1', grade: 'XI', major: 'Teknik Komputer & Jaringan', homeroomTeacher: 'Nurul Hidayah, M.Pd.', studentCount: 36 },
  { id: 'c_xii_rpl1', name: 'XII RPL 1', grade: 'XII', major: 'Rekayasa Perangkat Lunak', homeroomTeacher: 'Budi Santoso, S.Pd.', studentCount: 32 },
  { id: 'c_xii_tkj1', name: 'XII TKJ 1', grade: 'XII', major: 'Teknik Komputer & Jaringan', homeroomTeacher: 'Dewi Lestari, S.Si.', studentCount: 33 }
];

export const DEMO_USERS: UserProfile[] = [
  {
    uid: 'user_super_admin',
    email: 'admin@sekolah.sch.id',
    displayName: 'Super Administrator',
    role: 'super_admin',
    phone: '081234567890',
    nip: '19850101 201001 1 009'
  },
  {
    uid: 'user_waka',
    email: 'waka@sekolah.sch.id',
    displayName: 'Drs. H. Bambang Suryono, M.Pd. (Waka Kesiswaan)',
    role: 'waka_kesiswaan',
    phone: '081298765432',
    nip: '19740510 199903 1 002'
  },
  {
    uid: 'user_admin_kesiswaan',
    email: 'adminkesiswaan@sekolah.sch.id',
    displayName: 'Rina Astuti, S.Kom. (Staf Kesiswaan)',
    role: 'admin_kesiswaan',
    phone: '081345678901',
    nip: '19890420 201502 2 003'
  },
  {
    uid: 'user_pembina_pramuka',
    email: 'pembina.pramuka@sekolah.sch.id',
    displayName: 'Kak Hendra Wijaya, S.Pd. (Pembina Pramuka)',
    role: 'pembina',
    extracurricularIds: ['ekskul_pramuka'],
    phone: '081567890123',
    nip: '19880812 201403 1 005'
  },
  {
    uid: 'user_pembina_basket',
    email: 'pembina.basket@sekolah.sch.id',
    displayName: 'Coach Ahmad Fadhil, S.Or. (Pembina Basket)',
    role: 'pembina',
    extracurricularIds: ['ekskul_basket'],
    phone: '081789012345',
    nip: '19910214 201801 1 007'
  },
  {
    uid: 'user_pembina_pmr',
    email: 'pembina.pmr@sekolah.sch.id',
    displayName: 'Siti Rahmawati, S.Kep. (Pembina PMR Wira)',
    role: 'pembina',
    extracurricularIds: ['ekskul_pmr'],
    phone: '081901234567',
    nip: '19930725 201903 2 006'
  },
  {
    uid: 'user_pembina_robotik',
    email: 'pembina.robotik@sekolah.sch.id',
    displayName: 'Ir. Bayu Prasetyo, M.T. (Pembina Robotik)',
    role: 'pembina',
    extracurricularIds: ['ekskul_robotik'],
    phone: '081234123456',
    nip: '19870918 201201 1 008'
  }
];

export const INITIAL_TEACHERS: Teacher[] = [
  { id: 't1', nip: '19740510 199903 1 002', fullName: 'Drs. H. Bambang Suryono, M.Pd.', gender: 'L', subject: 'Pendidikan Pancasila & Kewarganegaraan', phone: '081298765432', email: 'waka@sekolah.sch.id', role: 'Waka Kesiswaan', isPembina: false },
  { id: 't2', nip: '19890420 201502 2 003', fullName: 'Rina Astuti, S.Kom.', gender: 'P', subject: 'Informatika & Pemrograman Web', phone: '081345678901', email: 'adminkesiswaan@sekolah.sch.id', role: 'Admin Kesiswaan', isPembina: false },
  { id: 't3', nip: '19880812 201403 1 005', fullName: 'Hendra Wijaya, S.Pd.', gender: 'L', subject: 'Bahasa Indonesia', phone: '081567890123', email: 'pembina.pramuka@sekolah.sch.id', role: 'Guru / Pembina', isPembina: true, extracurricularName: 'Pramuka' },
  { id: 't4', nip: '19910214 201801 1 007', fullName: 'Ahmad Fadhil, S.Or.', gender: 'L', subject: 'Pendidikan Jasmani & Olahraga', phone: '081789012345', email: 'pembina.basket@sekolah.sch.id', role: 'Guru / Pembina', isPembina: true, extracurricularName: 'Basket' },
  { id: 't5', nip: '19930725 201903 2 006', fullName: 'Siti Rahmawati, S.Kep.', gender: 'P', subject: 'Biologi & Kesehatan', phone: '081901234567', email: 'pembina.pmr@sekolah.sch.id', role: 'Guru / Pembina', isPembina: true, extracurricularName: 'PMR Wira' },
  { id: 't6', nip: '19870918 201201 1 008', fullName: 'Ir. Bayu Prasetyo, M.T.', gender: 'L', subject: 'Sistem Komputer & Jaringan', phone: '081234123456', email: 'pembina.robotik@sekolah.sch.id', role: 'Guru / Pembina', isPembina: true, extracurricularName: 'Robotik & IoT' },
  { id: 't7', nip: '19900311 201602 2 004', fullName: 'Dewi Anggraini, S.Sn.', gender: 'P', subject: 'Seni Musik & Budaya', phone: '081823456789', email: 'dewi.seni@sekolah.sch.id', role: 'Guru / Pembina', isPembina: true, extracurricularName: 'Paduan Suara & Musik' },
  { id: 't8', nip: '19860621 201101 1 003', fullName: 'Kapten (Purn) Suryadi', gender: 'L', subject: 'Bela Negara & Kedisiplinan', phone: '081398761234', email: 'paskibra@sekolah.sch.id', role: 'Pelatih Luar / Pembina', isPembina: true, extracurricularName: 'Paskibra' },
  { id: 't9', nip: '19940115 202001 2 009', fullName: 'Fitria Ananda, M.Hum.', gender: 'P', subject: 'Bahasa Inggris', phone: '081512349876', email: 'english.club@sekolah.sch.id', role: 'Guru / Pembina', isPembina: true, extracurricularName: 'English Debate & Club' },
  { id: 't10', nip: '19920508 201701 1 002', fullName: 'Rizky Pratama, S.Pd.', gender: 'L', subject: 'Pendidikan Jasmani', phone: '081987654321', email: 'futsal@sekolah.sch.id', role: 'Guru / Pembina', isPembina: true, extracurricularName: 'Futsal Garuda' }
];

export const INITIAL_EXTRACURRICULARS: Extracurricular[] = [
  {
    id: 'ekskul_pramuka',
    name: 'Pramuka Gugus Depan 01-145',
    category: 'Kepemimpinan',
    description: 'Pendidikan kepanduan, kedisiplinan, kemandirian, dan cinta alam tanah air.',
    coachId: 'user_pembina_pramuka',
    coachName: 'Kak Hendra Wijaya, S.Pd.',
    assistantCoachName: 'Kak Dedi Kurniawan',
    day: 'Jumat',
    startTime: '15:30',
    endTime: '17:30',
    location: 'Lapangan Utama & Sanggar Pramuka',
    quota: 80,
    memberCount: 45,
    status: 'Aktif',
    vision: 'Membentuk tunas bangsa yang berkarakter tangguh, religius, berjiwa korsa, dan berwawasan lingkungan.',
    mission: '1. Menyelenggarakan latihan kepramukaan berjenjang. 2. Mengembangkan kemampuan survival dan leadership. 3. Melaksanakan bakti sosial masyarakat.',
    target: 'Meraih Juara Umum Lomba Tingkat Penegak Se-DKI Jakarta & Mengirimkan 4 Kontingen Jambore Nasional.',
    academicYear: '2026/2027',
    logoUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'ekskul_basket',
    name: 'Basket Club Patriot (Putra & Putri)',
    category: 'Olahraga',
    description: 'Pengembangan bakat bola basket, strategi permainan, fisik, dan sportivitas kompetisi.',
    coachId: 'user_pembina_basket',
    coachName: 'Coach Ahmad Fadhil, S.Or.',
    assistantCoachName: 'Dimas Wicaksono',
    day: 'Selasa',
    startTime: '15:45',
    endTime: '17:45',
    location: 'Gelanggang Olahraga / Hall Basket',
    quota: 40,
    memberCount: 32,
    status: 'Aktif',
    vision: 'Menjadi tim basket pelajar unggulan yang berprestasi di tingkat regional dan nasional dengan menjunjung tinggi sportivitas.',
    mission: '1. Pelatihan teknik dasar dan taktik modern. 2. Penguatan ketahanan fisik. 3. Mengikuti turnamen DBL dan Piala Walikota.',
    target: 'Lolos Babak Final DBL Jakarta Series 2026 & Juara 1 Turnamen Antar SMA.',
    academicYear: '2026/2027',
    logoUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'ekskul_pmr',
    name: 'Palang Merah Remaja (PMR) Wira',
    category: 'Sosial',
    description: 'Pelayanan kesehatan pertolongan pertama, donor darah, edukasi sanitasi, dan aksi kemanusiaan.',
    coachId: 'user_pembina_pmr',
    coachName: 'Siti Rahmawati, S.Kep.',
    assistantCoachName: 'Nurlaila Zahra, Amd.Keb.',
    day: 'Kamis',
    startTime: '15:30',
    endTime: '17:00',
    location: 'Ruang UKS & Aula Kemanusiaan',
    quota: 50,
    memberCount: 28,
    status: 'Aktif',
    vision: 'Mewujudkan relawan muda PMI yang cekatan, tanggap darurat, dan berhati mulia.',
    mission: '1. Menguasai 7 Prinsip Palang Merah & PP. 2. Mengelola posko kesehatan upacara dan event sekolah. 3. Bakti donor darah berkala.',
    target: 'Mempertahankan Akreditasi Madya PMR Wira & Juara 1 Lomba Cepat Tepat Pertolongan Pertama.',
    academicYear: '2026/2027',
    logoUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'ekskul_robotik',
    name: 'Robotik & Cyber Technology',
    category: 'Teknologi',
    description: 'Riset Internet of Things (IoT), robotika mikrokontroler Arduino/ESP32, dan AI software.',
    coachId: 'user_pembina_robotik',
    coachName: 'Ir. Bayu Prasetyo, M.T.',
    assistantCoachName: 'Fajar Nugraha',
    day: 'Rabu',
    startTime: '15:30',
    endTime: '17:30',
    location: 'Laboratorium IoT & Komputer 3',
    quota: 30,
    memberCount: 24,
    status: 'Aktif',
    vision: 'Melahirkan inovator muda teknologi yang siap bersaing dalam revolusi industri 4.0 dan kompetisi internasional.',
    mission: '1. Pemrograman robotika otomatis & line follower. 2. Proyek IoT cerdas ramah lingkungan. 3. Partisipasi di World Robot Games.',
    target: 'Medali Emas Kontes Robot Nusantara & 2 Karya Inovasi Terdaftar HaKI Pelajar.',
    academicYear: '2026/2027',
    logoUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'ekskul_paskibra',
    name: 'Paskibra Satya Bhakti Nusantara',
    category: 'Bela Negara',
    description: 'Pendidikan baris berbaris (PBB), formasi pengibaran bendera, etika, dan disiplin korsa.',
    coachId: 'user_waka',
    coachName: 'Kapten (Purn) Suryadi',
    day: 'Senin',
    startTime: '15:30',
    endTime: '17:30',
    location: 'Lapangan Utama',
    quota: 40,
    memberCount: 30,
    status: 'Aktif',
    vision: 'Mencetak generasi penerus bangsa yang disiplin, berjiwa patriotik, dan menjunjung kehormatan Sang Merah Putih.',
    mission: '1. Penguasaan Peraturan Baris Berbaris baku TNI/Polri. 2. Latihan fisik dan mental kepemimpinan. 3. Menyiapkan tim upacara kenegaraan.',
    target: 'Mengirimkan minimal 2 anggota lolos seleksi Paskibraka Tingkat Provinsi DKI Jakarta.',
    academicYear: '2026/2027',
    logoUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'ekskul_padus',
    name: 'Paduan Suara & Ansambel Nada Gita',
    category: 'Seni',
    description: 'Olah vokal paduan suara, pembacaan partitur, paduan instrumen, dan aransemen lagu daerah/modern.',
    coachId: 'user_admin_kesiswaan',
    coachName: 'Dewi Anggraini, S.Sn.',
    day: 'Kamis',
    startTime: '15:45',
    endTime: '17:30',
    location: 'Ruang Musik & Akustik',
    quota: 45,
    memberCount: 26,
    status: 'Aktif',
    vision: 'Mengembangkan apresiasi seni suara dan harmonisasi nada berkarakter budaya nusantara.',
    mission: '1. Olah teknik vocal breathing, solfeggio, dan harmoni. 2. Mengisi acara formal kenegaraan dan konser tahunan.',
    target: 'Gold Diploma Festival Paduan Suara Pelajar Nasional 2026.',
    academicYear: '2026/2027',
    logoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'ekskul_english',
    name: 'English Debate & Speech Society',
    category: 'Akademik',
    description: 'Debat parlementer bahasa Inggris, pidato publik, story telling, dan persiapan TOEFL pelajar.',
    coachId: 'user_admin_kesiswaan',
    coachName: 'Fitria Ananda, M.Hum.',
    day: 'Rabu',
    startTime: '15:30',
    endTime: '17:00',
    location: 'Language Center & Perpustakaan',
    quota: 35,
    memberCount: 20,
    status: 'Aktif',
    vision: 'Membangun generasi muda yang fasih, kritis, dan percaya diri berbicara di panggung global.',
    mission: '1. Latihan Asian Parliamentary Debate format. 2. Workshop critical thinking & global affairs.',
    target: 'Top 5 National Schools Debating Championship (NSDC) Tingkat Provinsi.',
    academicYear: '2026/2027',
    logoUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'ekskul_futsal',
    name: 'Futsal Garuda Muda',
    category: 'Olahraga',
    description: 'Pembinaan olahraga futsal, taktik passing intersep, stamina, dan liga futsal pelajar.',
    coachId: 'user_pembina_basket',
    coachName: 'Rizky Pratama, S.Pd.',
    day: 'Sabtu',
    startTime: '08:00',
    endTime: '10:30',
    location: 'Lapangan Futsal Terbuka',
    quota: 40,
    memberCount: 34,
    status: 'Aktif',
    vision: 'Menjadi tim futsal yang tangkas, disiplin, berprestasi, dan menjunjung persaudaraan.',
    mission: '1. Latihan fisik intensif dan taktik small-sided games. 2. Uji tanding rutin antar sekolah.',
    target: 'Juara 1 Liga Futsal Pelajar Walikota Cup 2026.',
    academicYear: '2026/2027',
    logoUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=150&auto=format&fit=crop&q=80'
  }
];

// Generate 50 realistic Indonesian students
export const INITIAL_STUDENTS: Student[] = [
  { id: 's01', nis: '24251001', nisn: '0081234501', fullName: 'Aditya Pratama Nugraha', gender: 'L', birthPlace: 'Jakarta', birthDate: '2008-04-12', classId: 'c_x_rpl1', className: 'X RPL 1', major: 'Rekayasa Perangkat Lunak', phone: '081234560001', parentName: 'Bambang Nugraha', parentPhone: '081234560101', address: 'Jl. Melati No. 12, Tebet, Jakarta Selatan', status: 'Aktif', violationPoints: 0, achievementPoints: 35, createdAt: '2026-07-16' },
  { id: 's02', nis: '24251002', nisn: '0081234502', fullName: 'Aisyah Putri Azzahra', gender: 'P', birthPlace: 'Bandung', birthDate: '2008-09-21', classId: 'c_x_rpl1', className: 'X RPL 1', major: 'Rekayasa Perangkat Lunak', phone: '081234560002', parentName: 'Ahmad Syafiq', parentPhone: '081234560102', address: 'Jl. Mawar No. 45, Kebayoran, Jakarta Selatan', status: 'Aktif', violationPoints: 0, achievementPoints: 20, createdAt: '2026-07-16' },
  { id: 's03', nis: '24251003', nisn: '0081234503', fullName: 'Alif Kurnia Ramadhan', gender: 'L', birthPlace: 'Bogor', birthDate: '2008-10-05', classId: 'c_x_rpl1', className: 'X RPL 1', major: 'Rekayasa Perangkat Lunak', phone: '081234560003', parentName: 'Dedi Ramadhan', parentPhone: '081234560103', address: 'Jl. Kenanga No. 8, Cilandak, Jakarta Selatan', status: 'Aktif', violationPoints: 5, achievementPoints: 0, createdAt: '2026-07-16' },
  { id: 's04', nis: '24251004', nisn: '0081234504', fullName: 'Amanda Clarissa Dewi', gender: 'P', birthPlace: 'Surabaya', birthDate: '2008-03-18', classId: 'c_x_rpl1', className: 'X RPL 1', major: 'Rekayasa Perangkat Lunak', phone: '081234560004', parentName: 'Hendra Gunawan', parentPhone: '081234560104', address: 'Jl. Anggrek No. 19, Pancoran, Jakarta Selatan', status: 'Aktif', violationPoints: 0, achievementPoints: 50, createdAt: '2026-07-16' },
  { id: 's05', nis: '24251005', nisn: '0081234505', fullName: 'Bagas Satria Wibowo', gender: 'L', birthPlace: 'Semarang', birthDate: '2008-06-30', classId: 'c_x_rpl1', className: 'X RPL 1', major: 'Rekayasa Perangkat Lunak', phone: '081234560005', parentName: 'Wibowo Santoso', parentPhone: '081234560105', address: 'Jl. Dahlia No. 3, Pasar Minggu, Jakarta Selatan', status: 'Aktif', violationPoints: 10, achievementPoints: 15, createdAt: '2026-07-16' },
  { id: 's06', nis: '24251006', nisn: '0081234506', fullName: 'Bella Safitri Ningsih', gender: 'P', birthPlace: 'Jakarta', birthDate: '2008-11-14', classId: 'c_x_rpl2', className: 'X RPL 2', major: 'Rekayasa Perangkat Lunak', phone: '081234560006', parentName: 'Surya Ningsih', parentPhone: '081234560106', address: 'Jl. Cempaka No. 27, Jagakarsa, Jakarta Selatan', status: 'Aktif', violationPoints: 0, achievementPoints: 0, createdAt: '2026-07-16' },
  { id: 's07', nis: '24251007', nisn: '0081234507', fullName: 'Bima Sakti Yudhistira', gender: 'L', birthPlace: 'Yogyakarta', birthDate: '2008-01-25', classId: 'c_x_rpl2', className: 'X RPL 2', major: 'Rekayasa Perangkat Lunak', phone: '081234560007', parentName: 'Yudhistira H.', parentPhone: '081234560107', address: 'Jl. Garuda No. 88, Kemang, Jakarta Selatan', status: 'Aktif', violationPoints: 0, achievementPoints: 40, createdAt: '2026-07-16' },
  { id: 's08', nis: '24251008', nisn: '0081234508', fullName: 'Cantika Ayu Lestari', gender: 'P', birthPlace: 'Malang', birthDate: '2008-08-19', classId: 'c_x_rpl2', className: 'X RPL 2', major: 'Rekayasa Perangkat Lunak', phone: '081234560008', parentName: 'Lestari Budi', parentPhone: '081234560108', address: 'Jl. Kemuning No. 15, Ragunan, Jakarta Selatan', status: 'Aktif', violationPoints: 0, achievementPoints: 25, createdAt: '2026-07-16' },
  { id: 's09', nis: '24251009', nisn: '0081234509', fullName: 'Daffa Raihan Anugrah', gender: 'L', birthPlace: 'Jakarta', birthDate: '2008-05-02', classId: 'c_x_tkj1', className: 'X TKJ 1', major: 'Teknik Komputer & Jaringan', phone: '081234560009', parentName: 'Anugrah Saputra', parentPhone: '081234560109', address: 'Jl. Teratai No. 4, Gandaria, Jakarta Selatan', status: 'Aktif', violationPoints: 15, achievementPoints: 0, createdAt: '2026-07-16' },
  { id: 's10', nis: '24251010', nisn: '0081234510', fullName: 'Danendra Arya Putra', gender: 'L', birthPlace: 'Solo', birthDate: '2008-07-11', classId: 'c_x_tkj1', className: 'X TKJ 1', major: 'Teknik Komputer & Jaringan', phone: '081234560010', parentName: 'Arya Wirawan', parentPhone: '081234560110', address: 'Jl. Palm Raya No. 9, Fatmawati, Jakarta Selatan', status: 'Aktif', violationPoints: 0, achievementPoints: 30, createdAt: '2026-07-16' },
  { id: 's11', nis: '23241011', nisn: '0071234511', fullName: 'Dinda Kirana Maharani', gender: 'P', birthPlace: 'Jakarta', birthDate: '2007-02-14', classId: 'c_xi_rpl1', className: 'XI RPL 1', major: 'Rekayasa Perangkat Lunak', phone: '081234560011', parentName: 'Maharani S.', parentPhone: '081234560111', address: 'Jl. Flamboyan No. 22, Pejaten, Jakarta Selatan', status: 'Aktif', violationPoints: 0, achievementPoints: 60, createdAt: '2025-07-15' },
  { id: 's12', nis: '23241012', nisn: '0071234512', fullName: 'Fadhil Ihsan Nurrohim', gender: 'L', birthPlace: 'Tangerang', birthDate: '2007-09-08', classId: 'c_xi_rpl1', className: 'XI RPL 1', major: 'Rekayasa Perangkat Lunak', phone: '081234560012', parentName: 'Nurrohim Hasan', parentPhone: '081234560112', address: 'Jl. Bugenvil No. 31, Pasar Minggu, Jakarta Selatan', status: 'Aktif', violationPoints: 5, achievementPoints: 20, createdAt: '2025-07-15' },
  { id: 's13', nis: '23241013', nisn: '0071234513', fullName: 'Farras Farhan Maulana', gender: 'L', birthPlace: 'Bekasi', birthDate: '2007-12-01', classId: 'c_xi_rpl1', className: 'XI RPL 1', major: 'Rekayasa Perangkat Lunak', phone: '081234560013', parentName: 'Maulana Malik', parentPhone: '081234560113', address: 'Jl. Wijaya Kusuma No. 7, Kebayoran Baru, Jakarta Selatan', status: 'Aktif', violationPoints: 0, achievementPoints: 45, createdAt: '2025-07-15' },
  { id: 's14', nis: '23241014', nisn: '0071234514', fullName: 'Gabriela Evelyn Susanto', gender: 'P', birthPlace: 'Jakarta', birthDate: '2007-06-15', classId: 'c_xi_rpl2', className: 'XI RPL 2', major: 'Rekayasa Perangkat Lunak', phone: '081234560014', parentName: 'Susanto Wijaya', parentPhone: '081234560114', address: 'Jl. Pondok Indah No. 55, Kebayoran Lama, Jakarta Selatan', status: 'Aktif', violationPoints: 0, achievementPoints: 35, createdAt: '2025-07-15' },
  { id: 's15', nis: '23241015', nisn: '0071234515', fullName: 'Hafizh Ilham Rabbani', gender: 'L', birthPlace: 'Depok', birthDate: '2007-04-20', classId: 'c_xi_rpl2', className: 'XI RPL 2', major: 'Rekayasa Perangkat Lunak', phone: '081234560015', parentName: 'Rabbani Idris', parentPhone: '081234560115', address: 'Jl. Margonda No. 101, Depok', status: 'Aktif', violationPoints: 0, achievementPoints: 10, createdAt: '2025-07-15' },
  { id: 's16', nis: '23241016', nisn: '0071234516', fullName: 'Indah Permata Sari', gender: 'P', birthPlace: 'Jakarta', birthDate: '2007-10-30', classId: 'c_xi_tkj1', className: 'XI TKJ 1', major: 'Teknik Komputer & Jaringan', phone: '081234560016', parentName: 'Sari Iskandar', parentPhone: '081234560116', address: 'Jl. Radio Dalam No. 18, Gandaria, Jakarta Selatan', status: 'Aktif', violationPoints: 0, achievementPoints: 25, createdAt: '2025-07-15' },
  { id: 's17', nis: '23241017', nisn: '0071234517', fullName: 'Jonathan Christian Lee', gender: 'L', birthPlace: 'Medan', birthDate: '2007-08-04', classId: 'c_xi_tkj1', className: 'XI TKJ 1', major: 'Teknik Komputer & Jaringan', phone: '081234560017', parentName: 'Lee Guan Hong', parentPhone: '081234560117', address: 'Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan', status: 'Aktif', violationPoints: 0, achievementPoints: 75, createdAt: '2025-07-15' },
  { id: 's18', nis: '22231018', nisn: '0061234518', fullName: 'Kaila Nur Fadillah', gender: 'P', birthPlace: 'Jakarta', birthDate: '2006-05-19', classId: 'c_xii_rpl1', className: 'XII RPL 1', major: 'Rekayasa Perangkat Lunak', phone: '081234560018', parentName: 'Fadillah Umar', parentPhone: '081234560118', address: 'Jl. Bangka Raya No. 6, Mampang, Jakarta Selatan', status: 'Aktif', violationPoints: 0, achievementPoints: 80, createdAt: '2024-07-15' },
  { id: 's19', nis: '22231019', nisn: '0061234519', fullName: 'Lutfi Zaidan Al-Farisi', gender: 'L', birthPlace: 'Cirebon', birthDate: '2006-11-10', classId: 'c_xii_rpl1', className: 'XII RPL 1', major: 'Rekayasa Perangkat Lunak', phone: '081234560019', parentName: 'Al-Farisi Mansyur', parentPhone: '081234560119', address: 'Jl. Ampera Raya No. 14, Pasar Minggu, Jakarta Selatan', status: 'Aktif', violationPoints: 0, achievementPoints: 40, createdAt: '2024-07-15' },
  { id: 's20', nis: '22231020', nisn: '0061234520', fullName: 'Maulana Yusuf Hakim', gender: 'L', birthPlace: 'Jakarta', birthDate: '2006-07-28', classId: 'c_xii_tkj1', className: 'XII TKJ 1', major: 'Teknik Komputer & Jaringan', phone: '081234560020', parentName: 'Hakim Abdullah', parentPhone: '081234560120', address: 'Jl. Fatmawati No. 77, Cilandak, Jakarta Selatan', status: 'Aktif', violationPoints: 20, achievementPoints: 15, createdAt: '2024-07-15' }
];

export const INITIAL_MEMBERS: ExtracurricularMember[] = [
  { id: 'm1', extracurricularId: 'ekskul_pramuka', extracurricularName: 'Pramuka Gugus Depan 01-145', studentId: 's01', studentNis: '24251001', studentName: 'Aditya Pratama Nugraha', studentClass: 'X RPL 1', gender: 'L', joinDate: '2026-07-20', memberNumber: 'PRM-001', status: 'Aktif', notes: 'Pradana Putra' },
  { id: 'm2', extracurricularId: 'ekskul_pramuka', extracurricularName: 'Pramuka Gugus Depan 01-145', studentId: 's02', studentNis: '24251002', studentName: 'Aisyah Putri Azzahra', studentClass: 'X RPL 1', gender: 'P', joinDate: '2026-07-20', memberNumber: 'PRM-002', status: 'Aktif', notes: 'Pradana Putri' },
  { id: 'm3', extracurricularId: 'ekskul_pramuka', extracurricularName: 'Pramuka Gugus Depan 01-145', studentId: 's05', studentNis: '24251005', studentName: 'Bagas Satria Wibowo', studentClass: 'X RPL 1', gender: 'L', joinDate: '2026-07-20', memberNumber: 'PRM-003', status: 'Aktif' },
  { id: 'm4', extracurricularId: 'ekskul_pramuka', extracurricularName: 'Pramuka Gugus Depan 01-145', studentId: 's11', studentNis: '23241011', studentName: 'Dinda Kirana Maharani', studentClass: 'XI RPL 1', gender: 'P', joinDate: '2025-07-20', memberNumber: 'PRM-004', status: 'Aktif', notes: 'Dewan Ambalan' },
  { id: 'm5', extracurricularId: 'ekskul_pramuka', extracurricularName: 'Pramuka Gugus Depan 01-145', studentId: 's12', studentNis: '23241012', studentName: 'Fadhil Ihsan Nurrohim', studentClass: 'XI RPL 1', gender: 'L', joinDate: '2025-07-20', memberNumber: 'PRM-005', status: 'Aktif' },
  { id: 'm6', extracurricularId: 'ekskul_basket', extracurricularName: 'Basket Club Patriot', studentId: 's07', studentNis: '24251007', studentName: 'Bima Sakti Yudhistira', studentClass: 'X RPL 2', gender: 'L', joinDate: '2026-07-22', memberNumber: 'BSK-001', status: 'Aktif', notes: 'Point Guard' },
  { id: 'm7', extracurricularId: 'ekskul_basket', extracurricularName: 'Basket Club Patriot', studentId: 's08', studentNis: '24251008', studentName: 'Cantika Ayu Lestari', studentClass: 'X RPL 2', gender: 'P', joinDate: '2026-07-22', memberNumber: 'BSK-002', status: 'Aktif', notes: 'Shooting Guard' },
  { id: 'm8', extracurricularId: 'ekskul_basket', extracurricularName: 'Basket Club Patriot', studentId: 's13', studentNis: '23241013', studentName: 'Farras Farhan Maulana', studentClass: 'XI RPL 1', gender: 'L', joinDate: '2025-07-22', memberNumber: 'BSK-003', status: 'Aktif', notes: 'Kapten Putra' },
  { id: 'm9', extracurricularId: 'ekskul_pmr', extracurricularName: 'Palang Merah Remaja (PMR) Wira', studentId: 's04', studentNis: '24251004', studentName: 'Amanda Clarissa Dewi', studentClass: 'X RPL 1', gender: 'P', joinDate: '2026-07-25', memberNumber: 'PMR-001', status: 'Aktif', notes: 'Ketua PMR' },
  { id: 'm10', extracurricularId: 'ekskul_pmr', extracurricularName: 'Palang Merah Remaja (PMR) Wira', studentId: 's06', studentNis: '24251006', studentName: 'Bella Safitri Ningsih', studentClass: 'X RPL 2', gender: 'P', joinDate: '2026-07-25', memberNumber: 'PMR-002', status: 'Aktif' },
  { id: 'm11', extracurricularId: 'ekskul_robotik', extracurricularName: 'Robotik & Cyber Technology', studentId: 's17', studentNis: '23241017', studentName: 'Jonathan Christian Lee', studentClass: 'XI TKJ 1', gender: 'L', joinDate: '2025-07-28', memberNumber: 'RBT-001', status: 'Aktif', notes: 'Ketua Divisi Hardware' },
  { id: 'm12', extracurricularId: 'ekskul_robotik', extracurricularName: 'Robotik & Cyber Technology', studentId: 's10', studentNis: '24251010', studentName: 'Danendra Arya Putra', studentClass: 'X TKJ 1', gender: 'L', joinDate: '2026-07-28', memberNumber: 'RBT-002', status: 'Aktif' }
];

export const INITIAL_SCHEDULES: ScheduleEvent[] = [
  {
    id: 'sch_1',
    title: 'Latihan Rutin Pramuka: Pionering & Semaphore',
    extracurricularId: 'ekskul_pramuka',
    extracurricularName: 'Pramuka Gugus Depan 01-145',
    coachId: 'user_pembina_pramuka',
    coachName: 'Kak Hendra Wijaya, S.Pd.',
    date: '2026-08-22',
    startTime: '15:30',
    endTime: '17:30',
    location: 'Lapangan Utama & Sanggar Pramuka',
    notes: 'Bawa tongkat pramuka dan tali kur per sangga.',
    status: 'Dijadwalkan',
    academicYear: '2026/2027'
  },
  {
    id: 'sch_2',
    title: 'Latihan Fisik & Taktik Defense Basket',
    extracurricularId: 'ekskul_basket',
    extracurricularName: 'Basket Club Patriot',
    coachId: 'user_pembina_basket',
    coachName: 'Coach Ahmad Fadhil, S.Or.',
    date: '2026-08-25',
    startTime: '15:45',
    endTime: '17:45',
    location: 'Hall Basket Utama',
    notes: 'Persiapan uji tanding lawan SMA 3.',
    status: 'Dijadwalkan',
    academicYear: '2026/2027'
  },
  {
    id: 'sch_3',
    title: 'Simulasi Pertolongan Pertama Gawat Darurat (PPGD)',
    extracurricularId: 'ekskul_pmr',
    extracurricularName: 'Palang Merah Remaja (PMR) Wira',
    coachId: 'user_pembina_pmr',
    coachName: 'Siti Rahmawati, S.Kep.',
    date: '2026-08-27',
    startTime: '15:30',
    endTime: '17:00',
    location: 'Ruang UKS & Aula Kemanusiaan',
    notes: 'Materi pembidaian fraktur dan evakuasi tandu.',
    status: 'Dijadwalkan',
    academicYear: '2026/2027'
  },
  {
    id: 'sch_4',
    title: 'Workshop Pemrograman Mikrokontroler ESP32 & IoT',
    extracurricularId: 'ekskul_robotik',
    extracurricularName: 'Robotik & Cyber Technology',
    coachId: 'user_pembina_robotik',
    coachName: 'Ir. Bayu Prasetyo, M.T.',
    date: '2026-08-26',
    startTime: '15:30',
    endTime: '17:30',
    location: 'Lab IoT',
    notes: 'Bawa laptop dan modul sensor masing-masing kelompok.',
    status: 'Dijadwalkan',
    academicYear: '2026/2027'
  }
];

export const INITIAL_ATTENDANCE: AttendanceSession[] = [
  {
    id: 'att_pramuka_1',
    scheduleId: 'sch_1',
    extracurricularId: 'ekskul_pramuka',
    extracurricularName: 'Pramuka Gugus Depan 01-145',
    coachId: 'user_pembina_pramuka',
    coachName: 'Kak Hendra Wijaya, S.Pd.',
    date: '2026-08-15',
    topic: 'Materi Tali Temali dan Pendirian Tenda Darurat',
    academicYear: '2026/2027',
    totalMembers: 5,
    presentCount: 4,
    permitCount: 1,
    sickCount: 0,
    absentCount: 0,
    records: [
      { studentId: 's01', studentNis: '24251001', studentName: 'Aditya Pratama Nugraha', studentClass: 'X RPL 1', status: 'Hadir' },
      { studentId: 's02', studentNis: '24251002', studentName: 'Aisyah Putri Azzahra', studentClass: 'X RPL 1', status: 'Hadir' },
      { studentId: 's05', studentNis: '24251005', studentName: 'Bagas Satria Wibowo', studentClass: 'X RPL 1', status: 'Izin', notes: 'Ada urusan keluarga' },
      { studentId: 's11', studentNis: '23241011', studentName: 'Dinda Kirana Maharani', studentClass: 'XI RPL 1', status: 'Hadir' },
      { studentId: 's12', studentNis: '23241012', studentName: 'Fadhil Ihsan Nurrohim', studentClass: 'XI RPL 1', status: 'Hadir' }
    ],
    notes: 'Latihan berjalan lancar dan tertib, 4 sangga berhasil menyelesaikan simpul.',
    createdAt: '2026-08-15 17:35:00'
  },
  {
    id: 'att_basket_1',
    scheduleId: 'sch_2',
    extracurricularId: 'ekskul_basket',
    extracurricularName: 'Basket Club Patriot',
    coachId: 'user_pembina_basket',
    coachName: 'Coach Ahmad Fadhil, S.Or.',
    date: '2026-08-18',
    topic: 'Drill Free Throw & Fastbreak Offense',
    academicYear: '2026/2027',
    totalMembers: 3,
    presentCount: 3,
    permitCount: 0,
    sickCount: 0,
    absentCount: 0,
    records: [
      { studentId: 's07', studentNis: '24251007', studentName: 'Bima Sakti Yudhistira', studentClass: 'X RPL 2', status: 'Hadir' },
      { studentId: 's08', studentNis: '24251008', studentName: 'Cantika Ayu Lestari', studentClass: 'X RPL 2', status: 'Hadir' },
      { studentId: 's13', studentNis: '23241013', studentName: 'Farras Farhan Maulana', studentClass: 'XI RPL 1', status: 'Hadir' }
    ],
    notes: 'Seluruh pemain hadir tepat waktu dengan stamina prima.',
    createdAt: '2026-08-18 17:50:00'
  }
];

export const INITIAL_ACTIVITIES: SchoolActivity[] = [
  {
    id: 'act_1',
    title: 'Perkemahan Pelantikan Penegak Bantara & Bakti Desa 2026',
    type: 'Latihan Rutin',
    extracurricularId: 'ekskul_pramuka',
    extracurricularName: 'Pramuka Gugus Depan 01-145',
    coachId: 'user_pembina_pramuka',
    personInCharge: 'Kak Hendra Wijaya, S.Pd.',
    date: '2026-09-12',
    startTime: '07:00',
    endTime: '16:00',
    location: 'Bumi Perkemahan Cibubur & Desa Cikidang',
    targetParticipants: '45 Anggota Pramuka & 10 Panitia',
    actualParticipants: 52,
    objective: 'Melantik calon penegak bantara, memupuk kepedulian sosial melalui penanaman 200 bibit pohon, dan survival alam.',
    description: 'Kegiatan perkemahan 2 hari 1 malam meliputi lintas alam, api unggun korsa, bakti sosial, dan uji SKU penegak bantara.',
    status: 'Disetujui',
    budgetEstimated: 8500000,
    createdAt: '2026-08-10'
  },
  {
    id: 'act_2',
    title: 'Kejuaraan Bola Basket DBL Jakarta Series 2026',
    type: 'Lomba/Kompetisi',
    extracurricularId: 'ekskul_basket',
    extracurricularName: 'Basket Club Patriot',
    coachId: 'user_pembina_basket',
    personInCharge: 'Coach Ahmad Fadhil, S.Or.',
    date: '2026-09-20',
    startTime: '13:00',
    endTime: '18:00',
    location: 'GOR Soemantri Brodjonegoro Kuningan',
    targetParticipants: '24 Atlet (Tim Putra & Putri)',
    actualParticipants: 24,
    objective: 'Mengukir prestasi olahraga sekolah dan membawa trofi juara di ajang kompetisi basket pelajar paling bergengsi.',
    description: 'Partisipasi resmi tim basket sekolah dalam babak penyisihan dan utama kompetisi DBL tingkat SMA Se-DKI Jakarta.',
    status: 'Diajukan',
    budgetEstimated: 12000000,
    createdAt: '2026-08-14'
  }
];

export const INITIAL_REPORTS: ActivityReport[] = [
  {
    id: 'rep_1',
    activityId: 'act_1',
    activityTitle: 'Latihan Gabungan Palang Merah Remaja Se-Jakarta Selatan',
    extracurricularId: 'ekskul_pmr',
    extracurricularName: 'Palang Merah Remaja (PMR) Wira',
    coachId: 'user_pembina_pmr',
    coachName: 'Siti Rahmawati, S.Kep.',
    date: '2026-08-10',
    time: '08:00 - 15:00 WIB',
    location: 'Aula Kemanusiaan SMA Negeri 1 Teladan',
    objective: 'Meningkatkan kompetensi pertolongan pertama pada korban henti jantung dan fraktur massal.',
    participantsSummary: 'Diikuti oleh 28 anggota PMR Wira sekolah dan 45 delegasi dari 6 SMA mitra.',
    executionNotes: 'Materi disampaikan oleh instruktur bersertifikasi PMI Cabang Jakarta Selatan dengan metode studi kasus dan simulasi langsung.',
    results: 'Seluruh peserta lulus uji kompetensi dasar RJP (Resusitasi Jantung Paru) dan evakuasi darurat dengan rata-rata nilai 88.5.',
    obstacles: 'Ketersediaan manikin RJP terbatas sehingga sesi praktik dibagi menjadi 4 gelombang.',
    evaluation: 'Waktu pelaksanaan sangat disiplin, antusiasme siswa tinggi, perlu penambahan manikin latihan untuk kegiatan mendatang.',
    followUp: 'Mengajukan pengadaan 2 unit manikin CPR melalui proposal kebutuhan ekstrakurikuler.',
    status: 'Disetujui',
    feedback: 'Laporan sangat lengkap dan kegiatan bernilai positif untuk kemanusiaan. Pengajuan manikin akan dipertimbangkan dalam anggaran semester.',
    approvedBy: 'Drs. H. Bambang Suryono, M.Pd. (Waka Kesiswaan)',
    approvedAt: '2026-08-12',
    createdAt: '2026-08-11'
  }
];

export const INITIAL_VIOLATIONS: StudentViolation[] = [
  {
    id: 'v_1',
    studentId: 's09',
    studentNis: '24251009',
    studentName: 'Daffa Raihan Anugrah',
    studentClass: 'X TKJ 1',
    date: '2026-08-14',
    category: 'Sedang',
    violationType: 'Terlambat Masuk Sekolah Lebih dari 3 Kali & Tidak Memakai Atribut Lengkap',
    points: 15,
    chronology: 'Siswa tiba di gerbang pukul 07.25 WIB tanpa dasi dan ikat pinggang seragam.',
    location: 'Gerbang Utama Sekolah',
    witness: 'Pak Joko (Petugas Keamanan) & Guru Piket',
    actionTaken: 'Diberikan teguran lisan, pembersihan area perpustakaan 30 menit, dan surat perjanjian disiplin.',
    officerName: 'Rina Astuti, S.Kom.',
    status: 'Dalam Proses',
    followUpNotes: 'Dijadwalkan konseling pembinaan bersama Guru BK.',
    createdAt: '2026-08-14'
  },
  {
    id: 'v_2',
    studentId: 's20',
    studentNis: '22231020',
    studentName: 'Maulana Yusuf Hakim',
    studentClass: 'XII TKJ 1',
    date: '2026-08-08',
    category: 'Sedang',
    violationType: 'Meninggalkan Lingkungan Sekolah Tanpa Izin Pada Jam Pelajaran (Bolos)',
    points: 20,
    chronology: 'Siswa kedapatan berada di warung luar sekolah saat jam pelajaran Informatika ke-4.',
    location: 'Luar Pagar Belakang Sekolah',
    witness: 'Drs. H. Bambang Suryono, M.Pd.',
    actionTaken: 'Pemanggilan orang tua wali dan surat peringatan pertama (SP 1).',
    officerName: 'Drs. H. Bambang Suryono, M.Pd.',
    status: 'Dalam Proses',
    followUpNotes: 'Orang tua sudah hadir dan berkomitmen mengawasi jam berangkat sekolah.',
    createdAt: '2026-08-08'
  }
];

export const INITIAL_COUNSELING: StudentCounseling[] = [
  {
    id: 'cs_1',
    studentId: 's09',
    studentNis: '24251009',
    studentName: 'Daffa Raihan Anugrah',
    studentClass: 'X TKJ 1',
    violationId: 'v_1',
    date: '2026-08-16',
    counselorName: 'Dra. Endang Sulastri, M.Si. (Guru BK)',
    reason: 'Pembinaan kedisiplinan waktu dan kepatuhan atribut seragam.',
    issuesIdentified: 'Siswa sering tidur larut malam bermain game online sehingga kesulitan bangun pagi.',
    counselingResult: 'Siswa menyadari kesalahannya, berjanji membuat jadwal tidur teratur maksimal pukul 22.00 dan menyiapkan seragam malam hari.',
    followUpPlan: 'Pemantauan presensi harian oleh wali kelas dan lapor mandiri ke BK setiap Senin pagi.',
    status: 'Dalam Pembinaan',
    nextSessionDate: '2026-08-30',
    createdAt: '2026-08-16'
  }
];

export const INITIAL_ACHIEVEMENTS: StudentAchievement[] = [
  {
    id: 'ach_1',
    studentId: 's17',
    studentNis: '23241017',
    studentName: 'Jonathan Christian Lee',
    studentClass: 'XI TKJ 1',
    title: 'Medali Emas Lomba Inovasi Internet of Things & AI Nusantara 2026',
    category: 'Teknologi',
    level: 'Nasional',
    rank: 'Juara 1',
    date: '2026-08-05',
    organizer: 'Kementerian Komunikasi dan Informatika & ITB',
    description: 'Merancang sistem pendeteksi kebocoran gas otomatis cerdas berbasis ESP32 dan LoRaWAN.',
    pointsAwarded: 75,
    extracurricularId: 'ekskul_robotik',
    extracurricularName: 'Robotik & Cyber Technology',
    academicYear: '2026/2027',
    certificateUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=200&auto=format&fit=crop&q=80',
    createdAt: '2026-08-06'
  },
  {
    id: 'ach_2',
    studentId: 's18',
    studentNis: '22231018',
    studentName: 'Kaila Nur Fadillah',
    studentClass: 'XII RPL 1',
    title: 'Juara 1 National Schools Debating Championship (NSDC) Tingkat Provinsi',
    category: 'Akademik',
    level: 'Provinsi',
    rank: 'Juara 1',
    date: '2026-07-28',
    organizer: 'Dinas Pendidikan Provinsi DKI Jakarta',
    description: 'Menjadi Best Speaker dan memenangkan babak final debat bertema Digital Economy Ethics.',
    pointsAwarded: 80,
    extracurricularId: 'ekskul_english',
    extracurricularName: 'English Debate & Speech Society',
    academicYear: '2026/2027',
    createdAt: '2026-07-30'
  },
  {
    id: 'ach_3',
    studentId: 's04',
    studentNis: '24251004',
    studentName: 'Amanda Clarissa Dewi',
    studentClass: 'X RPL 1',
    title: 'Juara 2 Lomba Pertolongan Pertama PMI Jakarta Selatan',
    category: 'Sosial',
    level: 'Kabupaten/Kota',
    rank: 'Juara 2',
    date: '2026-08-11',
    organizer: 'PMI Kota Administrasi Jakarta Selatan',
    description: 'Penilaian kecekatan pembidaian dan evakuasi tandu darurat.',
    pointsAwarded: 50,
    extracurricularId: 'ekskul_pmr',
    extracurricularName: 'Palang Merah Remaja (PMR) Wira',
    academicYear: '2026/2027',
    createdAt: '2026-08-12'
  }
];

export const INITIAL_PERMISSIONS: StudentPermission[] = [
  {
    id: 'perm_1',
    studentId: 's07',
    studentNis: '24251007',
    studentName: 'Bima Sakti Yudhistira',
    studentClass: 'X RPL 2',
    type: 'Dispensasi Kegiatan',
    reason: 'Mengikuti Pelatda Bola Basket Remaja Persiapan PON',
    startDate: '2026-08-28',
    endDate: '2026-08-30',
    approvedBy: 'Drs. H. Bambang Suryono, M.Pd. (Waka Kesiswaan)',
    status: 'Disetujui',
    notes: 'Surat rekomendasi Perbasi terlampir.',
    createdAt: '2026-08-20'
  }
];

export const INITIAL_NEEDS_REQUESTS: NeedsRequest[] = [
  {
    id: 'need_1',
    extracurricularId: 'ekskul_basket',
    extracurricularName: 'Basket Club Patriot',
    coachId: 'user_pembina_basket',
    coachName: 'Coach Ahmad Fadhil, S.Or.',
    itemName: 'Bola Basket Molten GG7X Original & Rompi Latihan',
    quantity: 6,
    unit: 'Pcs & Set',
    estimatedCost: 3500000,
    reason: 'Bola lama sudah aus dan licin, diperlukan untuk persiapan intensif turnamen DBL.',
    priority: 'Tinggi',
    dateNeeded: '2026-09-01',
    status: 'Diajukan',
    createdAt: '2026-08-17'
  },
  {
    id: 'need_2',
    extracurricularId: 'ekskul_pmr',
    extracurricularName: 'Palang Merah Remaja (PMR) Wira',
    coachId: 'user_pembina_pmr',
    coachName: 'Siti Rahmawati, S.Kep.',
    itemName: 'Manikin CPR Half Body & Tandu Lipat Aluminium',
    quantity: 2,
    unit: 'Unit',
    estimatedCost: 4200000,
    reason: 'Penguatan alat praktik simulasi pertolongan henti napas.',
    priority: 'Sedang',
    dateNeeded: '2026-09-10',
    status: 'Diajukan',
    createdAt: '2026-08-16'
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_1',
    title: 'Instruksi Pengisian Rekap Presensi & Administrasi Laporan Ekstrakurikuler Bulan Agustus 2026',
    content: 'Diberitahukan kepada seluruh Bapak/Ibu Pembina Ekstrakurikuler agar segera melengkapi data anggota, jurnal presensi mingguan, dan pengajuan rencana kegiatan semester ganjil melalui sistem SIM-KESISWAAN sebelum tanggal 31 Agustus 2026.',
    targetRole: 'Semua',
    publishDate: '2026-08-15',
    expiryDate: '2026-09-05',
    priority: 'Penting',
    authorName: 'Drs. H. Bambang Suryono, M.Pd.',
    createdAt: '2026-08-15'
  },
  {
    id: 'ann_2',
    title: 'Verifikasi Data Prestasi Siswa Untuk Beasiswa Bakat Kesiswaan',
    content: 'Admin Kesiswaan membuka pendaftaran sertifikat kejuaraan tingkat Kota, Provinsi, dan Nasional untuk verifikasi poin prestasi semester ini.',
    targetRole: 'Pembina',
    publishDate: '2026-08-18',
    expiryDate: '2026-09-15',
    priority: 'Biasa',
    authorName: 'Rina Astuti, S.Kom.',
    createdAt: '2026-08-18'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    title: 'Pengajuan Kebutuhan Baru',
    message: 'Pembina Basket mengajukan kebutuhan alat olahraga Bola Basket Molten GG7X.',
    type: 'info',
    isRead: false,
    createdAt: '2026-08-17 10:15:00'
  },
  {
    id: 'notif_2',
    title: 'Prestasi Siswa Terverifikasi',
    message: 'Jonathan Christian Lee meraih Medali Emas Lomba IoT Nasional.',
    type: 'success',
    isRead: false,
    createdAt: '2026-08-06 09:00:00'
  },
  {
    id: 'notif_3',
    title: 'Peringatan Pelanggaran Siswa',
    message: 'Tercatat pelanggaran kedisiplinan atas nama Daffa Raihan Anugrah (Poin: 15).',
    type: 'warning',
    isRead: true,
    createdAt: '2026-08-14 08:30:00'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log_1',
    userId: 'user_waka',
    userEmail: 'waka@sekolah.sch.id',
    userName: 'Drs. H. Bambang Suryono, M.Pd.',
    userRole: 'waka_kesiswaan',
    action: 'APPROVE_REPORT',
    module: 'Laporan Kegiatan',
    details: 'Menyetujui Laporan Kegiatan PMR Wira (Latihan Gabungan Se-Jakarta Selatan)',
    timestamp: '2026-08-12 14:20:00'
  },
  {
    id: 'log_2',
    userId: 'user_pembina_basket',
    userEmail: 'pembina.basket@sekolah.sch.id',
    userName: 'Coach Ahmad Fadhil, S.Or.',
    userRole: 'pembina',
    action: 'SUBMIT_ATTENDANCE',
    module: 'Presensi',
    details: 'Menginput presensi pertemuan ke-3 Basket Club Patriot (3 Siswa)',
    timestamp: '2026-08-18 17:50:00'
  }
];

// Helper to seed all data into Firebase Firestore
export async function seedAllFirebaseData(): Promise<{ success: boolean; message: string }> {
  try {
    const batch = writeBatch(db);

    // School Settings
    batch.set(doc(db, 'schools', INITIAL_SCHOOL_SETTING.id), INITIAL_SCHOOL_SETTING);

    // Academic Years
    for (const ay of INITIAL_ACADEMIC_YEARS) {
      batch.set(doc(db, 'academic_years', ay.id), ay);
    }

    // Classes
    for (const c of INITIAL_CLASSES) {
      batch.set(doc(db, 'classes', c.id), c);
    }

    // Users
    for (const u of DEMO_USERS) {
      batch.set(doc(db, 'users', u.uid), u);
    }

    // Teachers
    for (const t of INITIAL_TEACHERS) {
      batch.set(doc(db, 'teachers', t.id), t);
    }

    // Extracurriculars
    for (const e of INITIAL_EXTRACURRICULARS) {
      batch.set(doc(db, 'extracurriculars', e.id), e);
    }

    // Students
    for (const s of INITIAL_STUDENTS) {
      batch.set(doc(db, 'students', s.id), s);
    }

    // Members
    for (const m of INITIAL_MEMBERS) {
      batch.set(doc(db, 'extracurricular_members', m.id), m);
    }

    // Schedules
    for (const sch of INITIAL_SCHEDULES) {
      batch.set(doc(db, 'schedules', sch.id), sch);
    }

    // Attendance
    for (const att of INITIAL_ATTENDANCE) {
      batch.set(doc(db, 'attendance', att.id), att);
    }

    // Activities
    for (const act of INITIAL_ACTIVITIES) {
      batch.set(doc(db, 'activities', act.id), act);
    }

    // Reports
    for (const rep of INITIAL_REPORTS) {
      batch.set(doc(db, 'activity_reports', rep.id), rep);
    }

    // Violations
    for (const v of INITIAL_VIOLATIONS) {
      batch.set(doc(db, 'violations', v.id), v);
    }

    // Counseling
    for (const cs of INITIAL_COUNSELING) {
      batch.set(doc(db, 'counseling', cs.id), cs);
    }

    // Achievements
    for (const ach of INITIAL_ACHIEVEMENTS) {
      batch.set(doc(db, 'achievements', ach.id), ach);
    }

    // Permissions
    for (const perm of INITIAL_PERMISSIONS) {
      batch.set(doc(db, 'permissions', perm.id), perm);
    }

    // Needs
    for (const need of INITIAL_NEEDS_REQUESTS) {
      batch.set(doc(db, 'needs_requests', need.id), need);
    }

    // Announcements
    for (const ann of INITIAL_ANNOUNCEMENTS) {
      batch.set(doc(db, 'announcements', ann.id), ann);
    }

    // Notifications
    for (const notif of INITIAL_NOTIFICATIONS) {
      batch.set(doc(db, 'notifications', notif.id), notif);
    }

    // Audit logs
    for (const log of INITIAL_AUDIT_LOGS) {
      batch.set(doc(db, 'audit_logs', log.id), log);
    }

    await batch.commit();
    return { success: true, message: 'Seluruh data master, kesiswaan, dan ekstrakurikuler berhasil di-seed ke Firebase Firestore!' };
  } catch (error: any) {
    console.error('Error seeding data to Firebase:', error);
    return { success: false, message: error.message || 'Gagal melakukan seed data ke Firebase.' };
  }
}
