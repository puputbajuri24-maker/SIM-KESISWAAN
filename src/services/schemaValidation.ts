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
  username: z.string().max(128).optional(),
  password: z.string().max(128).optional(),
  previousPassword: z.string().max(128).optional(),
  displayName: z.string().max(128).optional(),
  nip: z.string().max(64).optional(),
  phone: z.string().max(64).optional(),
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
  counselorSpecialization: z.string().max(128).optional(),
  assignedExtracurricularIds: z.array(z.string()).optional(),
  extracurricularIds: z.array(z.string()).optional(),
  extracurricularNames: z.array(z.string()).optional(),
  extracurricularName: z.string().max(256).optional(),
  studentClass: z.string().max(64).optional(),
  studentNis: z.string().max(64).optional(),
  isCashManager: z.boolean().optional(),
  cashManagerTitle: z.string().max(128).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  lastLogin: z.string().optional()
}).passthrough();

export type ValidatedUserProfile = z.infer<typeof userProfileSchema>;

// ID format validator compliant with firestore.rules isValidId()
export function isValidIdFormat(id: unknown): boolean {
  if (typeof id !== 'string') return false;
  return id.length > 0 && id.length <= 128 && /^[a-zA-Z0-9_\-\.\@\+]+$/.test(id);
}

// Defensive string sanitizer to prevent control characters and HTML/script injection
export function sanitizeString(val: unknown, maxLength: number = 256): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  // Strip null bytes and control chars
  const sanitized = str.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  return sanitized.length > maxLength ? sanitized.substring(0, maxLength) : sanitized;
}

// Defensive payload validator
export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: string[];
}

export function validatePayload<T extends z.ZodTypeAny>(schema: T, payload: unknown): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(payload);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = (result.error.issues || []).map(err => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
  return { success: false, errors };
}

// Fase 7 Audit & Invariant Engine Types
export interface Fase7VectorTestResult {
  id: number;
  name: string;
  category: 'SECURITY' | 'INTEGRITY' | 'BOUNDARY' | 'TERMINAL_STATE';
  targetSchema: string;
  payloadDescription: string;
  intercepted: boolean;
  expectedBehavior: string;
  auditLog: string[];
}

export interface Fase7AuditReport {
  executedAt: string;
  overallStatus: 'PASSED' | 'FAILED';
  totalVectorsTested: number;
  totalIntercepted: number;
  passRate: number;
  liveCollectionsAudited: {
    students: { total: number; valid: number; invalid: number };
    teachers: { total: number; valid: number; invalid: number };
    users: { total: number; valid: number; invalid: number };
    violations: { total: number; valid: number; invalid: number };
    counseling: { total: number; valid: number; invalid: number };
    osimPrograms: { total: number; valid: number; invalid: number };
    cashAccounts: { total: number; valid: number; invalid: number };
    cashTransactions: { total: number; valid: number; invalid: number };
  };
  vectors: Fase7VectorTestResult[];
}

/**
 * Fase 7: Run Full Defensive Schema Validation & Malicious Payload Audit
 * Tests 10 realistic dirty / malicious payloads against the schema validation layer
 * and audits active in-memory collections for strict schema compliance.
 */
export async function runFase7DefensiveAudit(contextData?: {
  students?: any[];
  teachers?: any[];
  users?: any[];
  violations?: any[];
  counseling?: any[];
  osimPrograms?: any[];
  cashAccounts?: any[];
  cashTransactions?: any[];
}): Promise<Fase7AuditReport> {
  const vectors: Fase7VectorTestResult[] = [];

  // VECTOR 1: Privilege Escalation Attempt in User Profile
  {
    const dirtyPayload = {
      uid: 'user_attacker_1',
      email: 'attacker@example.com',
      role: 'super_admin_hacker_bypass', // Invalid enum value
      displayName: 'Attacker'
    };
    const res = validatePayload(userProfileSchema, dirtyPayload);
    const intercepted = !res.success;
    vectors.push({
      id: 1,
      name: 'Privilege Escalation via Corrupted Role Enum',
      category: 'SECURITY',
      targetSchema: 'userProfileSchema',
      payloadDescription: 'Pendaftar mencoba menginjeksi peran di luar enum resmi ("super_admin_hacker_bypass")',
      intercepted,
      expectedBehavior: 'Ditolak: Schema membatasi role hanya pada CanonicalUserRole yang sah.',
      auditLog: [
        'Payload diuji: { role: "super_admin_hacker_bypass" }',
        `Hasil evaluasi: ${intercepted ? 'BERHASIL DICEGAH' : 'LOLOS (RENTAN)'}`,
        `Detail error: ${res.errors?.join(', ') || 'Nihil error'}`
      ]
    });
  }

  // VECTOR 2: Denial-of-Wallet Oversized String Injection in Cash Transaction
  {
    const giantString = 'A'.repeat(5000);
    const dirtyPayload = {
      accountId: 'acc_1',
      type: 'MASUK',
      amount: 100000,
      title: giantString, // Exceeds max 256
      date: '2026-10-10'
    };
    const res = validatePayload(cashTransactionSchema, dirtyPayload);
    const intercepted = !res.success;
    vectors.push({
      id: 2,
      name: 'Denial-of-Wallet Oversized String Payload Attack',
      category: 'BOUNDARY',
      targetSchema: 'cashTransactionSchema',
      payloadDescription: 'Injeksi judul transaksi 5.000 karakter untuk eksploitasi ukuran penyimpanan',
      intercepted,
      expectedBehavior: 'Ditolak: Schema membatasi title maksimal 256 karakter.',
      auditLog: [
        'Payload diuji: { title: "A".repeat(5000) }',
        `Hasil evaluasi: ${intercepted ? 'BERHASIL DICEGAH' : 'LOLOS (RENTAN)'}`,
        `Detail error: ${res.errors?.join(', ') || 'Nihil error'}`
      ]
    });
  }

  // VECTOR 3: Negative Mutation Amount in Cash Ledger
  {
    const dirtyPayload = {
      accountId: 'acc_1',
      type: 'MASUK',
      amount: -5000000, // Negative amount
      title: 'Mutasi Palsu Minus',
      date: '2026-10-10'
    };
    const res = validatePayload(cashTransactionSchema, dirtyPayload);
    const intercepted = !res.success;
    vectors.push({
      id: 3,
      name: 'Negative Mutation Amount in Cash Ledger',
      category: 'INTEGRITY',
      targetSchema: 'cashTransactionSchema',
      payloadDescription: 'Manipulasi nominal kas dengan nilai negatif (-Rp 5.000.000) untuk merusak neraca',
      intercepted,
      expectedBehavior: 'Ditolak: Schema mewajibkan amount bilangan positif (positive).',
      auditLog: [
        'Payload diuji: { amount: -5000000 }',
        `Hasil evaluasi: ${intercepted ? 'BERHASIL DICEGAH' : 'LOLOS (RENTAN)'}`,
        `Detail error: ${res.errors?.join(', ') || 'Nihil error'}`
      ]
    });
  }

  // VECTOR 4: Confidential BK Counseling Data Poisoning
  {
    const dirtyPayload = {
      studentId: '', // Empty studentId
      counselorId: '', // Empty counselorId
      problemSummary: 'X', // Under min length
      date: '2026-10-10'
    };
    const res = validatePayload(counselingSessionSchema, dirtyPayload);
    const intercepted = !res.success;
    vectors.push({
      id: 4,
      name: 'Confidential BK Counseling Data Poisoning',
      category: 'INTEGRITY',
      targetSchema: 'counselingSessionSchema',
      payloadDescription: 'Pencatatan sesi konseling tanpa siswa, tanpa konselor, dan ringkasan masalah <3 karakter',
      intercepted,
      expectedBehavior: 'Ditolak: Wajib mencantumkan studentId, counselorId, dan ringkasan masalah valid.',
      auditLog: [
        'Payload diuji: { studentId: "", counselorId: "", problemSummary: "X" }',
        `Hasil evaluasi: ${intercepted ? 'BERHASIL DICEGAH' : 'LOLOS (RENTAN)'}`,
        `Detail error: ${res.errors?.join(', ') || 'Nihil error'}`
      ]
    });
  }

  // VECTOR 5: Malformed OSIM Program Status Transition
  {
    const dirtyPayload = {
      title: 'Proker Uji Injeksi',
      status: 'HACKED_BYPASSED_STATUS', // Non-existent status
      budget: -2000000
    };
    const res = validatePayload(osimProgramSchema, dirtyPayload);
    const intercepted = !res.success;
    vectors.push({
      id: 5,
      name: 'Malformed OSIM Program Status & Negative Budget',
      category: 'SECURITY',
      targetSchema: 'osimProgramSchema',
      payloadDescription: 'Injeksi status program kerja palsu dan anggaran minus',
      intercepted,
      expectedBehavior: 'Ditolak: Status harus sesuai enum resmi OSIM dan budget minimal Rp 0.',
      auditLog: [
        'Payload diuji: { status: "HACKED_BYPASSED_STATUS", budget: -2000000 }',
        `Hasil evaluasi: ${intercepted ? 'BERHASIL DICEGAH' : 'LOLOS (RENTAN)'}`,
        `Detail error: ${res.errors?.join(', ') || 'Nihil error'}`
      ]
    });
  }

  // VECTOR 6: Student Disciplinary Points Overflow & Invariant Tamper
  {
    const dirtyPayload = {
      studentId: 'std_1',
      violationType: 'Pelanggaran Ringan',
      category: 'Ringan',
      points: 9999, // Exceeds max 100
      date: '2026-10-10'
    };
    const res = validatePayload(studentViolationSchema, dirtyPayload);
    const intercepted = !res.success;
    vectors.push({
      id: 6,
      name: 'Student Disciplinary Points Overflow Attack',
      category: 'BOUNDARY',
      targetSchema: 'studentViolationSchema',
      payloadDescription: 'Injeksi poin pelanggaran berlebihan (9999 poin) melampaui batas batas 100 poin',
      intercepted,
      expectedBehavior: 'Ditolak: Schema membatasi poin pelanggaran antara 1 sampai 100.',
      auditLog: [
        'Payload diuji: { points: 9999 }',
        `Hasil evaluasi: ${intercepted ? 'BERHASIL DICEGAH' : 'LOLOS (RENTAN)'}`,
        `Detail error: ${res.errors?.join(', ') || 'Nihil error'}`
      ]
    });
  }

  // VECTOR 7: ID Poisoning Attack with Illegal Path Traversal & Script Characters
  {
    const maliciousId = '../students/malicious_payload<script>alert(1)</script>';
    const isIdValid = isValidIdFormat(maliciousId);
    const intercepted = !isIdValid;
    vectors.push({
      id: 7,
      name: 'ID Poisoning with Path Traversal & Script Characters',
      category: 'SECURITY',
      targetSchema: 'isValidIdFormat',
      payloadDescription: 'Injeksi documentId dengan karakter path traversal "../" dan tag script',
      intercepted,
      expectedBehavior: 'Ditolak: ID harus sesuai regex ^[a-zA-Z0-9_\\-\\.\\@\\+]+$ dan ukuran <= 128 byte.',
      auditLog: [
        `ID diuji: "${maliciousId}"`,
        `Hasil evaluasi: ${intercepted ? 'BERHASIL DICEGAH' : 'LOLOS (RENTAN)'}`,
        'Sesuai invarian keamanan firestore.rules isValidId()'
      ]
    });
  }

  // VECTOR 8: Malformed Email in Student & Teacher Registration
  {
    const dirtyPayload = {
      name: 'Siswa Uji',
      nis: '99999',
      gender: 'L',
      email: 'bukan_alamat_email_resmi@@domain..com'
    };
    const res = validatePayload(studentProfileSchema, dirtyPayload);
    const intercepted = !res.success;
    vectors.push({
      id: 8,
      name: 'Malformed Email Structure in Student Registration',
      category: 'INTEGRITY',
      targetSchema: 'studentProfileSchema',
      payloadDescription: 'Injeksi alamat email tidak valid pada profil siswa',
      intercepted,
      expectedBehavior: 'Ditolak: Format email harus memenuhi standar RFC valid.',
      auditLog: [
        'Payload diuji: { email: "bukan_alamat_email_resmi@@domain..com" }',
        `Hasil evaluasi: ${intercepted ? 'BERHASIL DICEGAH' : 'LOLOS (RENTAN)'}`,
        `Detail error: ${res.errors?.join(', ') || 'Nihil error'}`
      ]
    });
  }

  // VECTOR 9: Cash Account Negative Initial Balance
  {
    const dirtyPayload = {
      name: 'Kas Uji Coba Cacat',
      code: 'KAS-CACAT',
      category: 'Operasional',
      initialBalance: -10000000
    };
    const res = validatePayload(cashAccountSchema, dirtyPayload);
    const intercepted = !res.success;
    vectors.push({
      id: 9,
      name: 'Cash Account Negative Initial Balance',
      category: 'INTEGRITY',
      targetSchema: 'cashAccountSchema',
      payloadDescription: 'Pembuatan akun kas baru dengan saldo awal minus (-Rp 10.000.000)',
      intercepted,
      expectedBehavior: 'Ditolak: Saldo awal akun kas tidak boleh negatif (min: 0).',
      auditLog: [
        'Payload diuji: { initialBalance: -10000000 }',
        `Hasil evaluasi: ${intercepted ? 'BERHASIL DICEGAH' : 'LOLOS (RENTAN)'}`,
        `Detail error: ${res.errors?.join(', ') || 'Nihil error'}`
      ]
    });
  }

  // VECTOR 10: Malformed System Snapshot with Empty Label & ID
  {
    const dirtyPayload = {
      id: '',
      label: 'A', // Under min length 2
      timestamp: ''
    };
    const res = validatePayload(systemSnapshotSchema, dirtyPayload);
    const intercepted = !res.success;
    vectors.push({
      id: 10,
      name: 'Malformed Disaster Recovery Snapshot Payload',
      category: 'INTEGRITY',
      targetSchema: 'systemSnapshotSchema',
      payloadDescription: 'Titik pemulihan dengan ID kosong, label 1 karakter, dan timestamp kosong',
      intercepted,
      expectedBehavior: 'Ditolak: Snapshot wajib memiliki ID valid, label min 2 karakter, dan timestamp sah.',
      auditLog: [
        'Payload diuji: { id: "", label: "A", timestamp: "" }',
        `Hasil evaluasi: ${intercepted ? 'BERHASIL DICEGAH' : 'LOLOS (RENTAN)'}`,
        `Detail error: ${res.errors?.join(', ') || 'Nihil error'}`
      ]
    });
  }

  // Live collections audit
  const liveAudit = {
    students: { total: 0, valid: 0, invalid: 0 },
    teachers: { total: 0, valid: 0, invalid: 0 },
    users: { total: 0, valid: 0, invalid: 0 },
    violations: { total: 0, valid: 0, invalid: 0 },
    counseling: { total: 0, valid: 0, invalid: 0 },
    osimPrograms: { total: 0, valid: 0, invalid: 0 },
    cashAccounts: { total: 0, valid: 0, invalid: 0 },
    cashTransactions: { total: 0, valid: 0, invalid: 0 }
  };

  if (contextData?.students) {
    liveAudit.students.total = contextData.students.length;
    contextData.students.forEach(s => {
      const res = validatePayload(studentProfileSchema, s);
      if (res.success) liveAudit.students.valid++;
      else liveAudit.students.invalid++;
    });
  }

  if (contextData?.teachers) {
    liveAudit.teachers.total = contextData.teachers.length;
    contextData.teachers.forEach(t => {
      const res = validatePayload(teacherProfileSchema, t);
      if (res.success) liveAudit.teachers.valid++;
      else liveAudit.teachers.invalid++;
    });
  }

  if (contextData?.users) {
    liveAudit.users.total = contextData.users.length;
    contextData.users.forEach(u => {
      const res = validatePayload(userProfileSchema, u);
      if (res.success) liveAudit.users.valid++;
      else liveAudit.users.invalid++;
    });
  }

  if (contextData?.violations) {
    liveAudit.violations.total = contextData.violations.length;
    contextData.violations.forEach(v => {
      const res = validatePayload(studentViolationSchema, v);
      if (res.success) liveAudit.violations.valid++;
      else liveAudit.violations.invalid++;
    });
  }

  if (contextData?.counseling) {
    liveAudit.counseling.total = contextData.counseling.length;
    contextData.counseling.forEach(c => {
      const res = validatePayload(counselingSessionSchema, c);
      if (res.success) liveAudit.counseling.valid++;
      else liveAudit.counseling.invalid++;
    });
  }

  if (contextData?.osimPrograms) {
    liveAudit.osimPrograms.total = contextData.osimPrograms.length;
    contextData.osimPrograms.forEach(p => {
      const res = validatePayload(osimProgramSchema, p);
      if (res.success) liveAudit.osimPrograms.valid++;
      else liveAudit.osimPrograms.invalid++;
    });
  }

  if (contextData?.cashAccounts) {
    liveAudit.cashAccounts.total = contextData.cashAccounts.length;
    contextData.cashAccounts.forEach(a => {
      const res = validatePayload(cashAccountSchema, a);
      if (res.success) liveAudit.cashAccounts.valid++;
      else liveAudit.cashAccounts.invalid++;
    });
  }

  if (contextData?.cashTransactions) {
    liveAudit.cashTransactions.total = contextData.cashTransactions.length;
    contextData.cashTransactions.forEach(t => {
      const res = validatePayload(cashTransactionSchema, t);
      if (res.success) liveAudit.cashTransactions.valid++;
      else liveAudit.cashTransactions.invalid++;
    });
  }

  const totalIntercepted = vectors.filter(v => v.intercepted).length;
  const passRate = (totalIntercepted / vectors.length) * 100;

  return {
    executedAt: new Date().toISOString(),
    overallStatus: passRate === 100 ? 'PASSED' : 'FAILED',
    totalVectorsTested: vectors.length,
    totalIntercepted,
    passRate,
    liveCollectionsAudited: liveAudit,
    vectors
  };
}
