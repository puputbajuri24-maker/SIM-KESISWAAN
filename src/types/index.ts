export type UserRole = 'super_admin' | 'waka_kesiswaan' | 'guru_bk' | 'pembina_osim' | 'pembina_ekskul' | 'pembina' | 'pengurus_osim';

export type OsimRoleType = 'ketua' | 'wakil' | 'sekretaris' | 'bendahara' | 'sekbid';

export interface UserProfile {
  uid: string;
  email: string;
  username?: string;
  password?: string;
  displayName: string;
  role: UserRole;
  extracurricularIds?: string[]; // If pembina, club IDs they manage
  osimDepartmentId?: string; // ID of department/sekbid managed by this account, e.g. 'dept_sekbid_1' or 'dept_bph'
  osimDepartmentCode?: string; // e.g. 'SEKBID-1' or 'BPH'
  osimDepartmentName?: string; // e.g. 'Sekbid 1: Keimanan, Ketaqwaan & Moderasi Beragama'
  osimRole?: OsimRoleType; // Model A: 'ketua' | 'wakil' | 'sekretaris' | 'bendahara' | 'sekbid'
  osimPosition?: string; // e.g. "Ketua Umum OSIM", "Wakil Ketua 1", "Sekretaris Umum", "Bendahara Umum"
  studentNis?: string; // NIS siswa koordinator yang ditugaskan
  studentClass?: string; // Kelas siswa penanggung jawab
  phone?: string;
  photoURL?: string;
  nip?: string;
  counselorSpecialization?: string; // e.g. "Bimbingan Karir & Psikologi Remaja"
  isCashManager?: boolean; // Delegasi Hak Kelola Kas / Bendahara Amanah
  cashFundScopes?: string[]; // Daftar ID akun kas yang diamanahkan, e.g. ['all'] or ['kas_utama_kesiswaan', 'kas_bk', 'kas_osim']
  cashManagerTitle?: string; // Jabatan amanah kas, e.g. "Bendahara Kesiswaan", "Bendahara OSIM", "Bendahara BK"
  status?: 'Aktif' | 'Nonaktif';
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SchoolSetting {
  id: string;
  name: string;
  npsn: string;
  address: string;
  centralInstitution?: string; // Instansi Pusat (e.g. KEMENTERIAN AGAMA REPUBLIK INDONESIA)
  regionalInstitution?: string; // Instansi Kabupaten / Provinsi (e.g. KANTOR KEMENTERIAN AGAMA KABUPATEN BOGOR)
  postalCode?: string; // Kode Pos
  principalName: string;
  principalNip?: string;
  wakaName: string;
  wakaNip?: string;
  wakaKesiswaanName?: string;
  pembinaOsim?: string;
  pembinaOsimNip?: string;
  phone: string;
  email: string;
  website?: string;
  logoUrl?: string; // legacy fallback
  logoLeftUrl?: string; // Logo Kiri Kop Surat (Instansi Pembina / Kemenag / Pemda)
  logoRightUrl?: string; // Logo Kanan Kop Surat (Sekolah / Madrasah / Lembaga)
  currentAcademicYear: string;
  currentSemester: 'Ganjil' | 'Genap';
}

export type SchoolInfo = SchoolSetting;

export interface AcademicYear {
  id: string;
  year: string; // e.g. "2026/2027"
  name?: string; // alias e.g. "2026/2027"
  semester?: 'Ganjil' | 'Genap';
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export interface SchoolClass {
  id: string;
  name: string; // e.g. "X RPL 1"
  grade: 'X' | 'XI' | 'XII';
  major: string; // e.g. "Rekayasa Perangkat Lunak"
  homeroomTeacher: string;
  studentCount?: number;
}

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  fullName: string;
  gender: 'L' | 'P';
  birthPlace: string;
  birthDate: string;
  classId: string;
  className: string;
  major: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  address: string;
  status: 'Aktif' | 'Alumni' | 'Pindah' | 'Keluar';
  photoUrl?: string;
  violationPoints?: number;
  achievementPoints?: number;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Teacher {
  id: string;
  nip: string;
  fullName: string;
  gender?: 'L' | 'P';
  subject?: string;
  phone: string;
  email: string;
  role: string;
  isPembina?: boolean;
  photoUrl?: string;
  photoURL?: string;
  extracurricularName?: string;
  assignedExtracurriculars?: string[];
  isActive?: boolean;
  isCashManager?: boolean;
  cashManagerTitle?: string;
}

export type ExtracurricularCategory = 
  | 'Olahraga'
  | 'Seni'
  | 'Keagamaan'
  | 'Akademik'
  | 'Kepemimpinan'
  | 'Sosial'
  | 'Bela Negara'
  | 'Teknologi';

export interface Extracurricular {
  id: string;
  name: string;
  category: ExtracurricularCategory;
  description: string;
  coachId: string;
  coachName: string;
  assistantCoachName?: string;
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';
  startTime: string; // "15:30"
  endTime: string;   // "17:00"
  location: string;
  quota: number;
  memberCount: number;
  status: 'Aktif' | 'Nonaktif';
  logoUrl?: string;
  vision: string;
  mission: string;
  target: string;
  academicYear: string;
  color?: string;
}

export interface ExtracurricularMember {
  id: string;
  extracurricularId: string;
  extracurricularName?: string;
  studentId: string;
  studentNis: string;
  studentName: string;
  studentClass: string;
  gender: 'L' | 'P';
  joinDate: string;
  memberNumber?: string;
  status: 'Aktif' | 'Nonaktif';
  notes?: string;
  academicYear?: string;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  extracurricularId: string;
  extracurricularName: string;
  coachId?: string;
  coachName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location: string;
  type?: 'Latihan Rutin' | 'Pertandingan' | 'Event' | 'Rapat' | 'Ujian Kenaikan Tingkat';
  notes?: string;
  status: 'Dijadwalkan' | 'Berlangsung' | 'Selesai' | 'Dibatalkan';
  academicYear: string;
}

export type Schedule = ScheduleEvent;
export type ScheduleType = 'Latihan Rutin' | 'Pertandingan' | 'Event' | 'Rapat' | 'Ujian Kenaikan Tingkat';

export type AttendanceStatus = 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';

export interface AttendanceRecordItem {
  studentId: string;
  studentNis: string;
  studentName: string;
  studentClass: string;
  status: AttendanceStatus;
  notes?: string;
}

export type AttendanceItem = AttendanceRecordItem;

export interface AttendanceSession {
  id: string;
  scheduleId?: string;
  extracurricularId: string;
  extracurricularName: string;
  coachId?: string;
  coachName: string;
  date: string;
  topic?: string;
  meetingTopic?: string;
  academicYear: string;
  totalMembers: number;
  presentCount: number;
  permitCount?: number;
  permissionCount?: number;
  sickCount: number;
  absentCount: number;
  records?: AttendanceRecordItem[];
  items?: AttendanceRecordItem[];
  notes?: string;
  createdAt?: string;
}

export type AttendanceRecord = AttendanceSession;

export type ActivityType = 
  | 'Latihan Rutin'
  | 'Lomba/Kompetisi'
  | 'Pentas/Pameran'
  | 'Bakti Sosial'
  | 'Rapat'
  | 'Pelatihan'
  | 'Event'
  | 'Intrakurikuler OSIM'
  | 'Lainnya';

export type ActivityStatus = 
  | 'Draft'
  | 'Rencana'
  | 'Diajukan'
  | 'Disetujui'
  | 'Berjalan'
  | 'Berlangsung'
  | 'Selesai'
  | 'Dibatalkan'
  | 'Ditolak';

export interface SchoolActivity {
  id: string;
  title: string;
  type?: ActivityType;
  extracurricularId?: string;
  extracurricularName?: string;
  coachId?: string;
  personInCharge?: string;
  organizer?: string;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location: string;
  targetParticipants?: string;
  participantCount?: number;
  actualParticipants?: number;
  objective?: string;
  description: string;
  results?: string;
  evaluation?: string;
  status: ActivityStatus;
  budget?: number;
  budgetEstimated?: number;
  documentationUrls?: string[];
  createdAt?: string;
}

export type Activity = SchoolActivity;

export type ReportStatus = 'Draft' | 'Diajukan' | 'Disetujui' | 'Revisi' | 'Ditolak';

export interface ActivityReport {
  id: string;
  activityId?: string;
  activityTitle: string;
  extracurricularId: string;
  extracurricularName: string;
  coachId?: string;
  coachName: string;
  date: string;
  time?: string;
  location?: string;
  objective?: string;
  summary?: string;
  participantsSummary?: string;
  attendanceCount?: number;
  totalBudgetSpent?: number;
  executionNotes?: string;
  results?: string;
  achievements?: string;
  obstacles?: string;
  challenges?: string;
  evaluation?: string;
  followUp?: string;
  status: ReportStatus;
  feedback?: string;
  feedbackNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  academicYear?: string;
  documentationUrls?: string[];
  createdAt?: string;
}

export type ViolationCategory = 'Ringan' | 'Sedang' | 'Berat' | 'Sangat Berat';
export type ViolationStatus = 'Tercatat' | 'Diproses' | 'Dalam Proses' | 'Dalam Pembinaan' | 'Selesai';

export interface StudentViolation {
  id: string;
  studentId: string;
  studentNis: string;
  studentName: string;
  studentClass: string;
  date: string;
  category: ViolationCategory;
  violationType: string;
  points: number;
  chronology?: string;
  description?: string;
  location?: string;
  witness?: string;
  actionTaken: string;
  officerName: string;
  status: ViolationStatus;
  followUpNotes?: string;
  academicYear?: string;
  createdAt?: string;
}

export type Violation = StudentViolation;

export type CounselingServiceField = 'Pribadi' | 'Sosial' | 'Belajar' | 'Karir';
export type CounselingType = 'Individu' | 'Kelompok' | 'Klasikal' | 'Konferensi Kasus' | 'Home Visit' | 'Alih Tangan Kasus';
export type CounselingUrgency = 'Rendah' | 'Sedang' | 'Tinggi' | 'Darurat / Butuh Panggilan Wali';

export interface StudentCounseling {
  id: string;
  studentId: string;
  studentNis?: string;
  studentName: string;
  studentClass: string;
  violationId?: string;
  date: string;
  counselorName: string;
  counselorId?: string;
  serviceField?: CounselingServiceField; // Pribadi, Sosial, Belajar, Karir
  counselingType?: CounselingType; // Individu, Kelompok, dll.
  urgencyLevel?: CounselingUrgency;
  counselingApproach?: string; // e.g. "Konseling Realitas", "Cognitive Behavioral Therapy (CBT)", "Solution-Focused"
  topic?: string;
  notes?: string;
  reason?: string;
  issuesIdentified?: string;
  solution?: string;
  counselingResult?: string;
  agreements?: string;
  followUpPlan: string;
  parentInvolved?: boolean;
  status: 'Terbuka' | 'Dijadwalkan' | 'Berlangsung' | 'Dalam Pembinaan' | 'Selesai' | 'Perlu Tindak Lanjut';
  nextSessionDate?: string;
  academicYear?: string;
  attachmentUrl?: string;
  createdAt?: string;
}

export type CounselingSession = StudentCounseling;

// ==========================================
// BK SUB-MODUL: KUNJUNGAN RUMAH (HOME VISIT)
// ==========================================
export interface HomeVisitRecord {
  id: string;
  studentId: string;
  studentNis: string;
  studentName: string;
  studentClass: string;
  date: string;
  address: string;
  counselorName: string;
  companionName?: string; // Wali Kelas / Guru Pendamping
  visitedPerson: string; // Orang Tua / Wali (e.g. "Bpk. Suherman & Ibu Siti")
  relationship: 'Ayah' | 'Ibu' | 'Wali' | 'Keluarga Lainnya';
  phone?: string;
  purpose: string; // Alasan Kunjungan Rumah
  familyConditions: string; // Kondisi Lingkungan Keluarga & Ekonomi
  studentStudyEnvironment: string; // Kondisi Fasilitas & Suasana Belajar di Rumah
  findings: string; // Temuan & Dinamika Masalah
  agreements: string; // Kesepakatan Solusi Bersama Orang Tua
  followUpPlan: string;
  status: 'Terjadwal' | 'Terlaksana' | 'Perlu Kunjungan Lanjut' | 'Dibatalkan';
  academicYear: string;
  createdAt?: string;
}

// ==========================================
// BK SUB-MODUL: SURAT PANGGILAN ORANG TUA / WALI
// ==========================================
export type CallLetterStatus = 'Draft' | 'Diterbitkan' | 'Terkirim' | 'Hadir' | 'Tidak Hadir' | 'Selesai';

export interface ParentCallLetter {
  id: string;
  letterNumber: string; // e.g. "421.3 / BK-084 / 2026"
  studentId: string;
  studentNis: string;
  studentName: string;
  studentClass: string;
  parentName: string;
  callNumber: 1 | 2 | 3; // Panggilan Ke-1, Ke-2, Ke-3
  callDate: string; // Hari / Tanggal Menghadap
  callTime: string; // Pukul 08:30 WIB
  location: string; // Ruang Bimbingan Konseling (BK)
  reason: string; // Keperluan Panggilan
  counselorName: string;
  counselorNip?: string;
  wakaName?: string;
  status: CallLetterStatus;
  notes?: string;
  attendanceNotes?: string;
  academicYear: string;
  createdAt?: string;
}

// ==========================================
// BK SUB-MODUL: BIMBINGAN KARIR & STUDI LANJUT
// ==========================================
export interface CareerGuidanceRecord {
  id: string;
  studentId: string;
  studentNis: string;
  studentName: string;
  studentClass: string;
  careerInterest: string; // Minat Karir / Cita-cita
  targetPath: 'PTN (SNBP/SNBT)' | 'PTS' | 'Kedinasan / Militer' | 'Politeknik / Vokasi' | 'Kerja / Industri' | 'Wirausaha';
  targetInstitution?: string; // e.g. "Institut Teknologi Bandung / UI"
  targetMajor?: string; // e.g. "Teknik Informatika / Kedokteran"
  psychologicalTestScore?: string; // Hasil Asesmen / Tes Bakat Minat / IQ
  strengths: string; // Keunggulan & Potensi
  obstacles: string; // Kendala & Kebutuhan Pendampingan
  counselorRecommendation: string;
  counselorName: string;
  status: 'Dalam Eksplorasi' | 'Sudah Terarah' | 'Siap Pendaftaran' | 'Lolos Seleksi';
  academicYear: string;
  createdAt?: string;
}

export type AchievementCategory = 'Akademik' | 'Olahraga' | 'Seni' | 'Keagamaan' | 'Kepemimpinan' | 'Teknologi' | 'Sosial' | 'Lainnya';
export type AchievementLevel = 'Sekolah' | 'Kecamatan' | 'Kabupaten/Kota' | 'Kota/Kabupaten' | 'Provinsi' | 'Nasional' | 'Internasional';
export type AchievementRank = 'Juara 1' | 'Juara 2' | 'Juara 3' | 'Harapan 1' | 'Harapan 2' | 'Finalis' | 'Peserta Terbaik' | string;

export interface StudentAchievement {
  id: string;
  studentId: string;
  studentNis: string;
  studentName: string;
  studentClass: string;
  title: string;
  category: AchievementCategory;
  level: AchievementLevel;
  rank: AchievementRank;
  date: string;
  organizer: string;
  description: string;
  certificateUrl?: string;
  pointsAwarded: number;
  extracurricularId?: string;
  extracurricularName?: string;
  academicYear: string;
  createdAt?: string;
}

export type Achievement = StudentAchievement;

export type PermissionType = 'Izin' | 'Sakit' | 'Dispensasi Lomba' | 'Dispensasi Kegiatan Sekolah' | 'Dispensasi Kegiatan' | 'Lainnya';
export type PermissionStatus = 'Menunggu' | 'Diajukan' | 'Disetujui' | 'Ditolak' | 'Selesai';

export interface StudentPermission {
  id: string;
  studentId: string;
  studentNis: string;
  studentName: string;
  studentClass: string;
  type: PermissionType;
  reason: string;
  activityName?: string;
  startDate: string;
  endDate: string;
  approvedBy?: string;
  status: PermissionStatus;
  notes?: string;
  attachmentUrl?: string;
  academicYear?: string;
  createdAt?: string;
}

export interface NeedsRequest {
  id: string;
  extracurricularId: string;
  extracurricularName: string;
  coachId: string;
  coachName: string;
  itemName: string;
  quantity: number;
  unit: string; // "Pcs", "Set", "Paket", "Dus"
  estimatedCost: number;
  reason: string;
  priority: 'Rendah' | 'Sedang' | 'Tinggi' | 'Mendesak';
  dateNeeded: string;
  status: 'Diajukan' | 'Disetujui' | 'Ditolak' | 'Revisi';
  adminNotes?: string;
  approvedBudget?: number;
  createdAt?: string;
}

export type AnnouncementTargetType =
  | 'all'
  | 'all_bk'
  | 'specific_bk'
  | 'all_pembina'
  | 'specific_ekskul'
  | 'all_osim'
  | 'waka_admin'
  | 'specific_users';

export type AnnouncementTargetRole =
  | 'Semua'
  | 'Guru Pembina'
  | 'Guru BK'
  | 'Waka & Admin'
  | 'Pembina'
  | 'Admin'
  | 'Waka'
  | 'Guru BK Tertentu'
  | 'Pembina Ekstra Tertentu'
  | 'Pengguna Spesifik';

export type AnnouncementPriority = 'Biasa' | 'Penting' | 'Mendesak';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetType?: AnnouncementTargetType;
  targetRole: AnnouncementTargetRole | string;
  targetUserIds?: string[]; // Specific user UIDs (e.g. specific guru BK or specific pembina)
  targetUserNames?: string[]; // Display names of targeted users
  targetExtracurricularIds?: string[]; // Specific extracurricular IDs (e.g. Pramuka, PMR)
  targetExtracurricularNames?: string[]; // Display names of targeted extracurriculars
  targetExtracurricularId?: string;
  publishDate: string;
  expiryDate?: string;
  priority: AnnouncementPriority;
  authorName: string;
  authorRole?: string;
  isActive?: boolean;
  isPinned?: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
  readByUsers?: Record<string, string>; // uid -> ISO timestamp when read
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  targetRole?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  link?: string;
  isRead: boolean;
  createdAt?: string;
}

export interface AuditLogItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
}

// ==========================================
// INTRAKURIKULER & OSIM (ORGANISASI SISWA INTRA MADRASAH)
// ==========================================

export interface OsimDepartment {
  id: string;
  name: string;
  code?: string;
  description?: string;
  coordinatorName?: string;
  sortOrder?: number;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_OSIM_DEPARTMENTS: OsimDepartment[] = [
  {
    id: 'dept_bph',
    name: 'BPH (Badan Pengurus Harian)',
    code: 'BPH',
    description: 'Pimpinan inti organisasi: Ketua Umum, Wakil Ketua, Sekretaris, dan Bendahara Umum.',
    sortOrder: 0,
    color: '#3b82f6'
  },
  {
    id: 'dept_sekbid_1',
    name: 'Sekbid 1: Keimanan, Ketaqwaan & Moderasi Beragama',
    code: 'SEKBID-1',
    description: 'Pembinaan akhlak mulia, kegiatan PHBI, tadarus, keputrian, dan moderasi beragama.',
    sortOrder: 1,
    color: '#10b981'
  },
  {
    id: 'dept_sekbid_2',
    name: 'Sekbid 2: Wawasan Kebangsaan, Bela Negara & Kedisiplinan',
    code: 'SEKBID-2',
    description: 'Kedisiplinan upacara, tata tertib siswa, jiwa nasionalisme, dan bela negara.',
    sortOrder: 2,
    color: '#ef4444'
  },
  {
    id: 'dept_sekbid_3',
    name: 'Sekbid 3: Akademik, Sains, Riset & Literasi',
    code: 'SEKBID-3',
    description: 'Pengembangan minat bakat akademik, literasi madrasah, olimpiade, dan karya ilmiah.',
    sortOrder: 3,
    color: '#8b5cf6'
  },
  {
    id: 'dept_sekbid_4',
    name: 'Sekbid 4: Demokrasi, HAM, Kepemimpinan & Politik Pelajar',
    code: 'SEKBID-4',
    description: 'Pendidikan kepemimpinan, pemilu raya ketua OSIM (Pilketos), dan musyawarah perwakilan kelas.',
    sortOrder: 4,
    color: '#f59e0b'
  },
  {
    id: 'dept_sekbid_5',
    name: 'Sekbid 5: Keterampilan, Kewirausahaan & Koperasi Siswa',
    code: 'SEKBID-5',
    description: 'Kreativitas usaha mandiri, pengelolaan kantin/koperasi siswa, dan bazar amal.',
    sortOrder: 5,
    color: '#14b8a6'
  },
  {
    id: 'dept_sekbid_6',
    name: 'Sekbid 6: Kesehatan Jasmani, Olahraga & Lingkungan Hidup',
    code: 'SEKBID-6',
    description: 'Kesehatan jasmani, pekan olahraga madrasah (Class Meeting), UKS, dan adiwiyata kebersihan.',
    sortOrder: 6,
    color: '#06b6d4'
  },
  {
    id: 'dept_sekbid_7',
    name: 'Sekbid 7: Sastra, Seni, Budaya & Bahasa',
    code: 'SEKBID-7',
    description: 'Apresiasi seni budaya, pentas kreasi, bulan bahasa, dan pameran karya siswa.',
    sortOrder: 7,
    color: '#ec4899'
  },
  {
    id: 'dept_sekbid_8',
    name: 'Sekbid 8: Teknologi Informasi, Multimedia & Komunikasi',
    code: 'SEKBID-8',
    description: 'Pengelolaan media sosial OSIM, publikasi dokumentasi, konten grafis & video, dan jurnalistik digital.',
    sortOrder: 8,
    color: '#6366f1'
  }
];

export type OsimSekbid = string;

export type OsimPosition =
  | 'Ketua Umum OSIM'
  | 'Wakil Ketua 1'
  | 'Wakil Ketua 2'
  | 'Sekretaris Umum'
  | 'Wakil Sekretaris'
  | 'Bendahara Umum'
  | 'Wakil Bendahara'
  | 'Ketua Sekbid'
  | 'Anggota Sekbid'
  | 'Pembina OSIM';

export interface OsimMember {
  id: string;
  studentId?: string;
  studentNis: string;
  fullName: string;
  className: string;
  position: OsimPosition;
  sekbid: OsimSekbid;
  phone: string;
  email?: string;
  photoUrl?: string;
  status: 'Aktif' | 'Demisioner' | 'Nonaktif';
  vision?: string;
  flagshipProgram?: string;
  period: string; // e.g. "2026/2027"
  createdAt?: string;
}

export type OsimProgramStatus =
  | 'Draft'
  | 'Diajukan'
  | 'Revisi'
  | 'Disetujui'
  | 'Berlangsung'
  | 'Menunggu Verifikasi LPJ'
  | 'Selesai & Sah'
  | 'Selesai'
  | 'Dibatalkan';

export interface OsimWorkProgram {
  id: string;
  title: string;
  sekbid: OsimSekbid;
  personInCharge: string; // e.g. "Ahmad Zaki (Ketua Sekbid 1)"
  startDate: string;
  endDate?: string;
  location: string;
  budgetEstimated: number;
  budgetRealized?: number;
  targetParticipants: string;
  participantCount?: number;
  successIndicator: string;
  progressPercentage: number; // 0 - 100
  status: OsimProgramStatus;
  description: string;
  documentationUrls?: string[];
  photos?: string[]; // Foto dokumentasi kegiatan (base64 atau URL)
  lpjNotes?: string; // Catatan ringkasan evaluasi & hasil pelaksanaan dari siswa bidang
  lpjFileUrl?: string; // Tautan dokumen LPJ / Google Drive laporan kegiatan
  lpjSubmittedAt?: string; // Tanggal siswa mengirim draft LPJ ke pembina
  guidanceNotes?: string; // Catatan bimbingan & arahan pembina OSIM
  guidanceDate?: string; // Tanggal catatan bimbingan atau persetujuan
  verifiedBy?: string; // Pembina OSIM / Waka yang memverifikasi / memberikan bimbingan
  finalApprovedAt?: string; // Tanggal pengesahan akhir & penguncian arsip
  finalApprovedBy?: string; // Pembina OSIM / Waka / Admin App yang mengesahkan akhir
  isArchivedForYearEndReport?: boolean; // Apakah otomatis terakumulasi dalam rekap tahunan kesiswaan untuk laporan kepala madrasah
  vetoedBy?: string; // Nama otoritas pembina / waka / admin app yang memberlakukan hak veto
  vetoedAt?: string; // Waktu hak veto dieksekusi
  vetoReason?: string; // Alasan tertulis penggunaan hak veto kesiswaan
  academicYear: string;
  createdAt?: string;
}

export type OsimAspirationCategory =
  | 'Fasilitas & Sarpras'
  | 'Kegiatan & Acara'
  | 'Akademik & Pembelajaran'
  | 'Kedisiplinan & Tata Tertib'
  | 'Ekstrakurikuler'
  | 'Kesejahteraan Santri/Siswa'
  | 'Lainnya';

export type OsimAspirationStatus = 'Ditampung' | 'Sedang Dibahas' | 'Direalisasikan' | 'Ditolak';

export interface OsimAspiration {
  id: string;
  studentName: string; // or "Anonim / Siswa X RPL 1"
  studentClass: string;
  date: string;
  title: string;
  content: string;
  category: OsimAspirationCategory;
  upvotes: number;
  status: OsimAspirationStatus;
  responseNote?: string;
  respondedBy?: string;
  respondedAt?: string;
  academicYear: string;
  createdAt?: string;
}

export type OsimMeetingType = 'Rapat Pleno Pengurus' | 'Rapat BPH' | 'Rapat Koordinasi Pembina' | 'Sidang Musyawarah Kerja (MUKER)' | 'Rapat Evaluasi Bulanan';

export interface OsimMeeting {
  id: string;
  title: string;
  type: OsimMeetingType;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  leader: string;
  secretary: string;
  attendeesCount: number;
  agenda: string;
  decisionNotes: string;
  wakaNotes?: string;
  academicYear: string;
  createdAt?: string;
}

// ==========================================
// NERACA KAS & KEUANGAN KESISWAAN (TRANSPARANSI KAS)
// ==========================================

export type CashAccountCategory =
  | 'Kesiswaan'
  | 'OSIM'
  | 'BK'
  | 'Ekstrakurikuler'
  | 'Sosial & Infaq'
  | 'Lainnya';

export interface CashAccount {
  id: string;
  name: string; // e.g. "Kas Utama Kesiswaan", "Kas OSIM & Intrakurikuler", "Kas Peduli BK / Sosial Siswa", "Kas Pramuka"
  code: string; // e.g. "KAS-KSW", "KAS-OSIM", "KAS-BK", "KAS-PRA"
  category: CashAccountCategory;
  description: string;
  assignedManagerUserIds: string[]; // List of user UIDs who have amanah/rights to manage this cash
  assignedManagerNames?: string[];
  initialBalance: number;
  currentBalance?: number; // Calculated dynamic balance
  targetEkskulId?: string; // If tied to specific extracurricular
  academicYear: string;
  isActive: boolean;
  color?: string; // UI theme badge color
  createdAt?: string;
  updatedAt?: string;
}

export type CashTransactionType = 'MASUK' | 'KELUAR';

export type CashTransactionStatus = 'VERIFIED' | 'PENDING' | 'DRAFT';

export interface CashTransaction {
  id: string;
  accountId: string; // ID of CashAccount
  accountName: string;
  accountCode?: string;
  type: CashTransactionType; // 'MASUK' (Debit) | 'KELUAR' (Kredit)
  category: string; // e.g., 'Iuran Kas Rutin', 'Dana BOS/BOM Kesiswaan', 'Infaq / Shadaqah Peduli BK', 'Sponsorship / Donatur', 'Honor Pelatih', 'Konsumsi & Logistik', 'Peralatan & Perlengkapan', 'Transportasi Lomba / Event', 'Santunan Siswa Kurang Mampu', 'Hadiah / Medali / Piagam', 'Lain-lain'
  amount: number;
  date: string; // YYYY-MM-DD
  title: string; // Ringkasan transaksi
  description?: string; // Rincian / Uraian lengkap
  recipientOrPayer: string; // Penyetor (bila Masuk) atau Penerima / Toko / Vendor (bila Keluar)
  referenceNumber: string; // No. Kwitansi / Bukti Kas (e.g. BKM-202608-001 / BKK-202608-001)
  receiptUrl?: string; // Foto Kwitansi / Nota / Bukti Pembayaran
  receiptName?: string;
  status: CashTransactionStatus;
  recordedByUid: string;
  recordedByName: string;
  recordedByRole: string;
  academicYear: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// BUKU TATA TERTIB & KODE ETIK SISWA (HANDBOOK)
// ==========================================
export type RuleSeverity = 'Ringan' | 'Sedang' | 'Berat' | 'Sangat Berat' | 'Apresiasi';

export type RuleCategoryChapter = 
  | 'Bab I: Ketentuan Umum & Kehadiran'
  | 'Bab II: Pakaian, Seragam & Kerapian'
  | 'Bab III: Etika, Perilaku & Sopan Santun'
  | 'Bab IV: Larangan Keras & Ketertiban Umum'
  | 'Bab V: Penggunaan Perangkat Elektronik & Medsos'
  | 'Bab VI: Kegiatan Ekstrakurikuler & Organisasi'
  | 'Bab VII: Apresiasi, Prestasi & Pemulihan Disiplin';

export interface SchoolRuleArticle {
  id: string;
  chapter: RuleCategoryChapter;
  articleNumber: string; // e.g. "Pasal 3 Ayat 1"
  title: string; // e.g. "Keterlambatan Masuk Sekolah"
  description: string; // Uraian bunyi aturan
  points: number; // Bobot poin (5-100 untuk pelanggaran, atau positif untuk apresiasi)
  severity: RuleSeverity;
  consequence: string; // Sanksi / Tindakan Pembinaan Edukatif
  authorizedOfficer: string; // Pihak berwenang menindak
  sopSteps?: string[];
  isMandatory?: boolean;
  academicYear?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface SchoolHandbookMeta {
  decreeNumber: string;
  decreeTitle: string;
  effectiveDate: string;
  academicYear: string;
  totalPoinMax: number;
  thresholdSp1: number;
  thresholdSp2: number;
  thresholdSp3: number;
  thresholdDrop: number;
  signedBy: string; // Mengetahui Kepala Madrasah / Sekolah
  signedNip?: string;
  wakaName?: string; // Yang menandatangani / Waka Kesiswaan
  wakaNip?: string;
  issuedPlace?: string; // Tempat Penetapan / Cetak
  issuedDate?: string; // Tanggal Cetak / Penetapan
  lastUpdated?: string;
}


