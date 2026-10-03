import { z } from 'zod';

/**
 * SIM-KESISWAAN MAN 2 SERAM BAGIAN TIMUR
 * Centralized Schema Validation & Anti-Corruption Layer
 * 
 * Guarantees zero malformed payloads or data corruption reaching Firestore or local state.
 */

// 1. Cash Ledger Schemas
export const cashTransactionSchema = z.object({
  accountId: z.string().min(1, 'ID Akun Kas wajib diisi').max(128),
  accountName: z.string().max(128).optional(),
  accountCode: z.string().max(32).optional(),
  type: z.enum(['MASUK', 'KELUAR'], {
    message: 'Jenis transaksi harus MASUK atau KELUAR'
  }),
  amount: z.number().positive('Nominal transaksi harus lebih besar dari Rp 0').max(10_000_000_000, 'Nominal melebihi batas maksimum'),
  title: z.string().min(2, 'Judul transaksi minimal 2 karakter').max(256, 'Judul transaksi maksimal 256 karakter'),
  description: z.string().max(2048).optional(),
  category: z.string().max(64).optional(),
  recipientOrPayer: z.string().max(128).optional(),
  receiptUrl: z.string().max(2048).optional(),
  referenceNumber: z.string().max(64).optional(),
  recordedByUid: z.string().max(128).optional(),
  recordedByName: z.string().max(128).optional(),
  recordedByRole: z.string().max(128).optional(),
  status: z.enum(['VERIFIED', 'PENDING', 'REJECTED']).optional(),
  academicYear: z.string().max(32).optional(),
  date: z.string().min(4, 'Tanggal transaksi wajib diisi').max(32)
});

export type ValidatedCashTransaction = z.infer<typeof cashTransactionSchema>;

export const cashAccountSchema = z.object({
  id: z.string().max(128).optional(),
  name: z.string().min(2, 'Nama rekening / pos kas minimal 2 karakter').max(128),
  code: z.string().min(2, 'Kode akun kas minimal 2 karakter').max(32),
  category: z.string().max(64),
  initialBalance: z.number().min(0, 'Saldo awal tidak boleh negatif').default(0),
  description: z.string().max(1024).optional()
});

export type ValidatedCashAccount = z.infer<typeof cashAccountSchema>;

// 2. Student Disciplinary Infraction Schema
export const studentViolationSchema = z.object({
  studentId: z.string().min(1, 'Siswa pelanggar wajib dipilih').max(128),
  studentName: z.string().max(128).optional(),
  studentCode: z.string().max(64).optional(),
  studentNis: z.string().max(64).optional(),
  studentClass: z.string().max(64).optional(),
  violationType: z.string().min(3, 'Deskripsi pelanggaran minimal 3 karakter').max(256),
  category: z.enum(['Ringan', 'Sedang', 'Berat'], {
    message: 'Kategori harus Ringan, Sedang, atau Berat'
  }),
  points: z.number().int('Poin harus bilangan bulat').min(1, 'Poin minimal 1').max(100, 'Poin maksimal 100'),
  actionTaken: z.string().max(1024).optional(),
  sanction: z.string().max(1024).optional(),
  reporterName: z.string().max(128).optional(),
  reporterRole: z.string().max(128).optional(),
  date: z.string().min(4, 'Tanggal pelanggaran wajib diisi').max(32),
  status: z.enum(['Baru', 'Ditindak', 'Selesai', 'Dirujuk ke BK', 'Dibatalkan']).default('Baru')
});

export type ValidatedStudentViolation = z.infer<typeof studentViolationSchema>;

// 3. Counseling Session Schema (Guru BK Confidentiality)
export const counselingSessionSchema = z.object({
  studentId: z.string().min(1, 'Siswa konseling wajib dipilih').max(128),
  studentName: z.string().max(128).optional(),
  studentCode: z.string().max(64).optional(),
  studentClass: z.string().max(64).optional(),
  counselorId: z.string().min(1, 'Guru BK konselor wajib teridentifikasi').max(128),
  counselorName: z.string().max(128).optional(),
  problemSummary: z.string().min(3, 'Uraian masalah minimal 3 karakter').max(4096),
  actionPlan: z.string().max(4096).optional(),
  followUp: z.string().max(4096).optional(),
  status: z.enum(['Dijadwalkan', 'Berlangsung', 'Selesai', 'Tindak Lanjut', 'Dirujuk']).default('Selesai'),
  date: z.string().min(4, 'Tanggal sesi konseling wajib diisi').max(32)
});

export type ValidatedCounselingSession = z.infer<typeof counselingSessionSchema>;

// 4. OSIM Work Program Schema
export const osimProgramSchema = z.object({
  title: z.string().min(3, 'Nama program kerja minimal 3 karakter').max(256),
  sekbid: z.string().max(64).optional(),
  departmentId: z.string().max(128).optional(),
  departmentCode: z.string().max(32).optional(),
  picName: z.string().max(128).optional(),
  budget: z.number().min(0, 'Anggaran dana tidak boleh negatif').default(0),
  status: z.enum([
    'Draft',
    'Diajukan',
    'Revisi',
    'Disetujui',
    'Berlangsung',
    'Menunggu Verifikasi LPJ',
    'Selesai & Disahkan',
    'Dibatalkan'
  ]).default('Draft'),
  progressPercentage: z.number().min(0).max(100).default(0),
  startDate: z.string().max(32).optional(),
  endDate: z.string().max(32).optional()
});

export type ValidatedOsimProgram = z.infer<typeof osimProgramSchema>;

// 5. Student Profile Schema
export const studentProfileSchema = z.object({
  name: z.string().min(2, 'Nama siswa minimal 2 karakter').max(128),
  fullName: z.string().max(128).optional(),
  nis: z.string().min(3, 'NIS minimal 3 karakter').max(64),
  nisn: z.string().max(64).optional(),
  className: z.string().max(64).optional(),
  gender: z.enum(['L', 'P']),
  phone: z.string().max(32).optional(),
  email: z.string().email('Format email tidak valid').max(128).optional().or(z.literal('')),
  totalViolationPoints: z.number().default(0),
  status: z.string().max(32).default('Aktif')
});

export type ValidatedStudentProfile = z.infer<typeof studentProfileSchema>;

// 6. Teacher Profile Schema
export const teacherProfileSchema = z.object({
  id: z.string().max(64).optional(),
  code: z.string().max(32).optional(),
  fullName: z.string().min(2, 'Nama dewan guru minimal 2 karakter').max(128),
  nip: z.string().max(64).optional(),
  gender: z.enum(['L', 'P']).optional(),
  role: z.string().min(2, 'Jabatan / Peran wajib ditentukan').max(128),
  subject: z.string().max(128).optional(),
  phone: z.string().max(32).optional(),
  email: z.string().email('Format email tidak valid').max(128).optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  assignedExtracurriculars: z.array(z.string().max(128)).optional()
});

export type ValidatedTeacherProfile = z.infer<typeof teacherProfileSchema>;

// 7. System Snapshot Schema (Fase 4 Disaster Recovery)
export const systemSnapshotSchema = z.object({
  id: z.string().min(1, 'ID snapshot wajib diisi').max(128),
  label: z.string().min(2, 'Label snapshot minimal 2 karakter').max(256),
  timestamp: z.string().min(4).max(64),
  createdBy: z.string().max(128).optional(),
  counts: z.record(z.string(), z.number()).optional(),
  data: z.record(z.string(), z.any()).optional()
});

export type ValidatedSystemSnapshot = z.infer<typeof systemSnapshotSchema>;

// 8. User Profile Schema (Fase 5-8 Defensive Payload & Invariant)
export const userProfileSchema = z.object({
  uid: z.string().min(1).max(128),
  email: z.string().email().max(256),
  displayName: z.string().max(128).optional(),
  role: z.enum([
    'super_admin',
    'waka_kesiswaan',
    'guru_bk',
    'coach_ekstrakurikuler',
    'pembina_osim',
    'anggota_osim',
    'siswa',
    'admin_kesiswaan',
    'pembina',
    'pembina_ekskul',
    'pengurus_osim'
  ]),
  status: z.enum(['Aktif', 'Nonaktif', 'Pending']).optional(),
  photoURL: z.string().max(1024).optional(),
  osimPosition: z.string().max(64).optional(),
  osimDepartmentCode: z.string().max(32).optional(),
  isCashManager: z.boolean().optional(),
  cashManagerTitle: z.string().max(128).optional()
});

export type ValidatedUserProfile = z.infer<typeof userProfileSchema>;

export type ValidationResult<T> =
  | { success: true; data: T; errors?: undefined }
  | { success: false; errors: string[]; data?: undefined };

// Validation Helpers with Clean Error Formatting
export function validatePayload<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorList = (result.error as any).issues || (result.error as any).errors || [];
  const errors = errorList.map((err: any) => `${(err.path || []).join('.')}: ${err.message}`);
  return { success: false, errors };
}
