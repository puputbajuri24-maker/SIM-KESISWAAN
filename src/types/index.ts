export type UserRole = 'super_admin' | 'waka_kesiswaan' | 'admin_kesiswaan' | 'pembina';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  extracurricularIds?: string[]; // If pembina, club IDs they manage
  phone?: string;
  photoURL?: string;
  nip?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SchoolSetting {
  id: string;
  name: string;
  npsn: string;
  address: string;
  principalName: string;
  principalNip?: string;
  wakaName: string;
  wakaNip?: string;
  wakaKesiswaanName?: string;
  phone: string;
  email: string;
  website?: string;
  logoUrl?: string;
  currentAcademicYear: string;
  currentSemester: 'Ganjil' | 'Genap';
}

export type SchoolInfo = SchoolSetting;

export interface AcademicYear {
  id: string;
  year: string; // e.g. "2026/2027"
  semester: 'Ganjil' | 'Genap';
  isActive: boolean;
  startDate: string;
  endDate: string;
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
  extracurricularName?: string;
  assignedExtracurriculars?: string[];
  isActive?: boolean;
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

export interface StudentCounseling {
  id: string;
  studentId: string;
  studentNis?: string;
  studentName: string;
  studentClass: string;
  violationId?: string;
  date: string;
  counselorName: string;
  topic?: string;
  notes?: string;
  reason?: string;
  issuesIdentified?: string;
  solution?: string;
  counselingResult?: string;
  followUpPlan: string;
  parentInvolved?: boolean;
  status: 'Terbuka' | 'Dijadwalkan' | 'Berlangsung' | 'Dalam Pembinaan' | 'Selesai' | 'Perlu Tindak Lanjut';
  nextSessionDate?: string;
  academicYear?: string;
  createdAt?: string;
}

export type CounselingSession = StudentCounseling;

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

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetRole: 'Semua' | 'Pembina' | 'Admin' | 'Waka';
  targetExtracurricularId?: string;
  publishDate: string;
  expiryDate: string;
  priority: 'Biasa' | 'Penting' | 'Mendesak';
  authorName: string;
  createdAt?: string;
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
