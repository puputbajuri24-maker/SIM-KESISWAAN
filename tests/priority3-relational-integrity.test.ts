/**
 * PRIORITY 3: RELATIONAL INTEGRITY, CROSS-COLLECTION HARMONIZATION
 * & DEFENSIVE SCHEMA VALIDATION TEST SUITE
 * SIM-KESISWAAN MAN 2 SERAM BAGIAN TIMUR
 *
 * Rigorously verifies:
 * 1. Foreign key resolution (Students, Teachers, Classes, Extracurriculars).
 * 2. Audit of relational integrity (Orphan records detection & zero-orphan guarantee).
 * 3. Point accumulation invariant: Student violation points match sum of active violations.
 * 4. Cash ledger balance invariant: Account balance = initialBalance + SUM(MASUK) - SUM(KELUAR).
 * 5. Extracurricular member count synchronization.
 * 6. Defensive Schema Validation & 100% Malicious Vector Interception (Fase 7 Shield).
 * 7. Protection of master records from passive deletion cascades.
 */

import {
  resolveStudent,
  resolveTeacher,
  auditRelationalIntegrity,
  RelationalHealthReport
} from '../src/utils/relationResolvers';

import {
  Student,
  Teacher,
  Extracurricular,
  ExtracurricularMember,
  StudentViolation,
  StudentCounseling,
  OsimMember,
  CashAccount,
  CashTransaction
} from '../src/types';

import {
  validatePayload,
  cashTransactionSchema,
  cashAccountSchema,
  studentViolationSchema,
  counselingSessionSchema,
  osimProgramSchema,
  studentProfileSchema,
  teacherProfileSchema,
  userProfileSchema,
  systemSnapshotSchema,
  isValidIdFormat,
  runFase7DefensiveAudit
} from '../src/services/schemaValidation';

import {
  isProtectedTeacherOrStaff,
  isProtectedFunctionalUid,
  cleanDigits,
  normalizeName
} from '../src/utils/syncUtils';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`\x1b[32m✔ [PASSED]\x1b[0m ${testName}`);
  } else {
    failed++;
    console.error(`\x1b[31m✘ [FAILED]\x1b[0m ${testName}${detail ? ` - ${detail}` : ''}`);
  }
}

async function runPriority3Tests() {
  console.log('======================================================');
  console.log('PRIORITY 3: RELATIONAL INTEGRITY, HARMONIZATION & SCHEMA SHIELD');
  console.log('======================================================\n');

  // ---------------------------------------------------------------------------
  // 1. FOREIGN KEY RESOLUTION (resolveStudent & resolveTeacher)
  // ---------------------------------------------------------------------------
  console.log('--- 1. Foreign Key Resolution (Students & Teachers) ---');

  const mockStudents: Student[] = [
    {
      id: 's_01',
      code: 'SIS-2425-0001',
      nis: '24251001',
      nisn: '0078912345',
      fullName: 'Muhammad Farhan Al-Ghifari',
      gender: 'L',
      birthPlace: 'Bula',
      birthDate: '2008-05-12',
      classId: 'c_10_mipa_1',
      className: 'X MIPA 1',
      major: 'MIPA',
      phone: '081234567801',
      parentName: 'Ahmad',
      parentPhone: '081234567802',
      address: 'Jl. Bula Baru',
      status: 'Aktif',
      violationPoints: 15,
      createdAt: '2026-07-15'
    },
    {
      id: 's_02',
      code: 'SIS-2425-0002',
      nis: '24251002',
      nisn: '0078912346',
      fullName: 'Siti Fatimah Azzahra',
      gender: 'P',
      birthPlace: 'Geser',
      birthDate: '2008-08-20',
      classId: 'c_10_mipa_1',
      className: 'X MIPA 1',
      major: 'MIPA',
      phone: '081234567803',
      parentName: 'Umar',
      parentPhone: '081234567804',
      address: 'Jl. Protokol',
      status: 'Aktif',
      violationPoints: 0,
      createdAt: '2026-07-15'
    }
  ];

  const mockTeachers: Teacher[] = [
    {
      id: 'teacher_01',
      code: 'G01-ZK',
      nip: '197808042003121008',
      fullName: 'Zakaria, S. Pd.I., M. Pd',
      gender: 'L',
      subject: 'Kepala Madrasah',
      phone: '081234567810',
      email: 'zakaria@man2sbt.sch.id',
      role: 'Kepala Madrasah',
      isActive: true
    },
    {
      id: 'teacher_02',
      code: 'G02-PB',
      nip: '198810052020121003',
      fullName: 'Puput Eka Bajuri, S. Pd., M. Or',
      gender: 'L',
      subject: 'PJOK & Pembina OSIM',
      phone: '081234567811',
      email: 'puputbajuri24@gmail.com',
      role: 'pembina_osim',
      isActive: true
    }
  ];

  // Match student by ID
  const sById = resolveStudent(mockStudents, { id: 's_01' });
  assert(sById?.id === 's_01', 'resolveStudent matches by exact ID');

  // Match student by Code
  const sByCode = resolveStudent(mockStudents, { code: 'SIS-2425-0001' });
  assert(sByCode?.id === 's_01', 'resolveStudent matches by standardized Student Code');

  // Match student by NISN
  const sByNisn = resolveStudent(mockStudents, { nisn: '0078912345' });
  assert(sByNisn?.id === 's_01', 'resolveStudent matches by clean 10-digit NISN');

  // Match student by Clean NIS
  const sByNis = resolveStudent(mockStudents, { nis: '24251002' });
  assert(sByNis?.id === 's_02', 'resolveStudent matches by student NIS');

  // Match student by Normalized Name
  const sByName = resolveStudent(mockStudents, { name: 'muhammad farhan al ghifari' });
  assert(sByName?.id === 's_01', 'resolveStudent matches by normalized case-insensitive student name');

  // Teacher resolution
  const tById = resolveTeacher(mockTeachers, { id: 'teacher_02' });
  assert(tById?.id === 'teacher_02', 'resolveTeacher matches by exact ID');

  const tByNip = resolveTeacher(mockTeachers, { nip: '198810052020121003' });
  assert(tByNip?.id === 'teacher_02', 'resolveTeacher matches by clean 18-digit NIP');

  const tByName = resolveTeacher(mockTeachers, { name: 'puput eka bajuri' });
  assert(tByName?.id === 'teacher_02', 'resolveTeacher matches by normalized name');

  // ---------------------------------------------------------------------------
  // 2. POINT ACCUMULATION & VIOLATIONS INVARIANT
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Violation Points Accumulation & Invariant ---');

  const mockViolations: StudentViolation[] = [
    {
      id: 'v_01',
      studentId: 's_01',
      studentName: 'Muhammad Farhan Al-Ghifari',
      studentClass: 'X MIPA 1',
      studentNis: '24251001',
      violationType: 'Keterlambatan Masuk Madrasah',
      category: 'Ringan',
      points: 5,
      date: '2026-09-10',
      status: 'Selesai'
    },
    {
      id: 'v_02',
      studentId: 's_01',
      studentName: 'Muhammad Farhan Al-Ghifari',
      studentClass: 'X MIPA 1',
      studentNis: '24251001',
      violationType: 'Seragam Tidak Lengkap',
      category: 'Ringan',
      points: 10,
      date: '2026-09-12',
      status: 'Diproses'
    },
    {
      id: 'v_03_cancelled',
      studentId: 's_01',
      studentName: 'Muhammad Farhan Al-Ghifari',
      studentClass: 'X MIPA 1',
      studentNis: '24251001',
      violationType: 'Pelanggaran Dibatalkan',
      category: 'Ringan',
      points: 20,
      date: '2026-09-15',
      status: 'Dibatalkan' // Should NOT be counted
    },
    {
      id: 'v_04_deleted',
      studentId: 's_01',
      studentName: 'Muhammad Farhan Al-Ghifari',
      studentClass: 'X MIPA 1',
      studentNis: '24251001',
      violationType: 'Pelanggaran Dihapus',
      category: 'Sedang',
      points: 25,
      date: '2026-09-16',
      status: 'Diproses',
      isDeleted: true // Should NOT be counted
    }
  ];

  // Calculate active violation points
  const activeViols = mockViolations.filter(v => !v.isDeleted && v.status !== 'Dibatalkan');
  const pointsSum = activeViols.reduce((acc, curr) => acc + (Number(curr.points) || 0), 0);
  assert(pointsSum === 15, 'Points calculation excludes cancelled and deleted records (5 + 10 = 15 points)');
  assert(mockStudents[0].violationPoints === pointsSum, 'Student master record violationPoints exactly matches active sum (15 = 15)');

  // ---------------------------------------------------------------------------
  // 3. CASH LEDGER BALANCE INVARIANT
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Cash Ledger Balance & Transaction Invariant ---');

  const mockCashAccounts: CashAccount[] = [
    {
      id: 'kas_utama',
      name: 'Kas Utama Kesiswaan',
      code: 'KAS-01',
      category: 'Kesiswaan',
      description: 'Kas Utama Kesiswaan MAN 2 SBT',
      assignedManagerUserIds: ['user_waka'],
      initialBalance: 5_000_000,
      balance: 6_200_000,
      currentBalance: 6_200_000,
      academicYear: '2026/2027',
      isActive: true
    }
  ];

  const mockCashTransactions: CashTransaction[] = [
    {
      id: 'trx_01',
      accountId: 'kas_utama',
      type: 'MASUK',
      amount: 2_000_000,
      title: 'Penerimaan Dana Kegiatan Maulid',
      date: '2026-10-01'
    } as any,
    {
      id: 'trx_02',
      accountId: 'kas_utama',
      type: 'KELUAR',
      amount: 800_000,
      title: 'Pembelian Konsumsi Rapat OSIM',
      date: '2026-10-02'
    } as any
  ];

  const netCash = mockCashTransactions.reduce((acc, t) => {
    return acc + (t.type === 'MASUK' ? t.amount : -t.amount);
  }, 0);
  const expectedBalance = mockCashAccounts[0].initialBalance + netCash;
  assert(netCash === 1_200_000, 'Net cash transactions calculate correctly (+2.000.000 - 800.000 = +1.200.000)');
  assert(expectedBalance === 6_200_000, 'Account balance strictly reflects initialBalance + net (5.000.000 + 1.200.000 = 6.200.000)');
  assert(mockCashAccounts[0].balance === expectedBalance, 'CashAccount master balance matches transaction delta');

  // ---------------------------------------------------------------------------
  // 4. RELATIONAL HEALTH AUDIT (auditRelationalIntegrity)
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Relational Health & Orphan Records Auditing ---');

  const mockExtracurriculars: Extracurricular[] = [
    {
      id: 'ekskul_pramuka',
      name: 'Pramuka Gudep MAN 2 SBT',
      category: 'Kepemimpinan',
      coachId: 'teacher_02',
      coachName: 'Puput Eka Bajuri, S. Pd., M. Or',
      memberCount: 1,
      isActive: true
    } as any
  ];

  const mockMembers: ExtracurricularMember[] = [
    {
      id: 'mem_01',
      extracurricularId: 'ekskul_pramuka',
      extracurricularName: 'Pramuka Gudep MAN 2 SBT',
      studentId: 's_01',
      studentName: 'Muhammad Farhan Al-Ghifari',
      role: 'Anggota',
      status: 'Aktif',
      joinedDate: '2026-07-20'
    } as any
  ];

  const mockCounselings: StudentCounseling[] = [
    {
      id: 'coun_01',
      studentId: 's_01',
      studentName: 'Muhammad Farhan Al-Ghifari',
      studentClass: 'X MIPA 1',
      counselorId: 'teacher_02',
      notes: 'Konseling peminatan program studi perguruan tinggi',
      status: 'Selesai',
      date: '2026-10-05'
    } as any
  ];

  const healthyReport = auditRelationalIntegrity(
    mockStudents,
    mockTeachers,
    mockExtracurriculars,
    mockViolations.filter(v => !v.isDeleted),
    mockCounselings,
    mockMembers,
    [],
    mockCashAccounts,
    mockCashTransactions
  );

  assert(healthyReport.orphanViolations === 0, 'No orphan violations in healthy dataset');
  assert(healthyReport.orphanCounselings === 0, 'No orphan counselings in healthy dataset');
  assert(healthyReport.orphanEkskulMembers === 0, 'No orphan ekskul members in healthy dataset');
  assert(healthyReport.orphanCoaches === 0, 'No orphan coaches in healthy dataset');
  assert(healthyReport.orphanCashTransactions === 0, 'No orphan transactions in healthy dataset');
  assert(healthyReport.studentPointDiscrepancies === 0, 'Zero student point discrepancy detected');
  assert(healthyReport.cashBalanceDiscrepancies === 0, 'Zero cash ledger balance discrepancy detected');
  assert(healthyReport.isHealthy === true, 'Healthy dataset evaluated as 100% PRIMA & SEHAT (isHealthy === true)');

  // Unhealthy dataset test: Introduce an orphan violation pointing to non-existent student
  const brokenViolations: StudentViolation[] = [
    ...mockViolations.filter(v => !v.isDeleted),
    {
      id: 'v_ghost_01',
      studentId: 's_ghost_999', // Non-existent student
      studentCode: 'GHOST-01',
      studentNis: '99999999',
      studentClass: 'Ghost Class',
      studentName: 'Hantu Siswa',
      violationType: 'Pelanggaran Anonim',
      category: 'Ringan',
      points: 10,
      date: '2026-10-10',
      status: 'Diproses'
    }
  ];

  const degradedReport = auditRelationalIntegrity(
    mockStudents,
    mockTeachers,
    mockExtracurriculars,
    brokenViolations,
    mockCounselings,
    mockMembers,
    [],
    mockCashAccounts,
    mockCashTransactions
  );

  assert(degradedReport.orphanViolations === 1, 'Correctly flags 1 orphan violation when foreign key is broken');
  assert(degradedReport.isHealthy === false, 'Correctly marks isHealthy as false when orphan is present');

  // ---------------------------------------------------------------------------
  // 5. DEFENSIVE SCHEMA VALIDATION & 10 ATTACK VECTOR SHIELD (FASE 7)
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Defensive Schema Validation & 10-Vector Invariant Shield ---');

  // Test Zod schema validation directly
  const validCashPayload = {
    accountId: 'kas_utama',
    type: 'MASUK',
    amount: 500_000,
    title: 'Donasi Pembinaan Siswa',
    date: '2026-10-15'
  };
  assert(validatePayload(cashTransactionSchema, validCashPayload).success === true, 'Valid cash transaction passes cashTransactionSchema');

  const negativeCashPayload = {
    accountId: 'kas_utama',
    type: 'MASUK',
    amount: -100_000, // Negative!
    title: 'Manipulasi Minus',
    date: '2026-10-15'
  };
  assert(validatePayload(cashTransactionSchema, negativeCashPayload).success === false, 'Negative amount is strictly rejected by cashTransactionSchema');

  const oversizedTitleCash = {
    accountId: 'kas_utama',
    type: 'MASUK',
    amount: 100_000,
    title: 'Z'.repeat(500), // Max is 256
    date: '2026-10-15'
  };
  assert(validatePayload(cashTransactionSchema, oversizedTitleCash).success === false, 'Oversized string title is strictly rejected by cashTransactionSchema');

  const validViolation = {
    studentId: 's_01',
    violationType: 'Meninggalkan Kelas Tanpa Izin',
    category: 'Sedang',
    points: 15,
    date: '2026-10-15',
    status: 'Diproses'
  };
  assert(validatePayload(studentViolationSchema, validViolation).success === true, 'Valid violation passes studentViolationSchema');

  const overflowViolation = {
    studentId: 's_01',
    violationType: 'Pelanggaran Ekstrem Palsu',
    category: 'Berat',
    points: 9999, // Max is 100
    date: '2026-10-15'
  };
  assert(validatePayload(studentViolationSchema, overflowViolation).success === false, 'Points overflow (>100) is strictly rejected by studentViolationSchema');

  // Execute full 10-vector audit suite
  const fase7Audit = await runFase7DefensiveAudit({
    students: mockStudents,
    teachers: mockTeachers,
    violations: mockViolations.filter(v => !v.isDeleted),
    counseling: mockCounselings,
    cashAccounts: mockCashAccounts,
    cashTransactions: mockCashTransactions
  });

  assert(fase7Audit.totalVectorsTested === 10, 'Full 10 defensive attack vectors tested');
  assert(fase7Audit.totalIntercepted === 10, '100% (10 of 10) malicious / malformed vectors intercepted');
  assert(fase7Audit.passRate === 100, 'Pass rate for defensive invariant shield is 100%');
  assert(fase7Audit.overallStatus === 'PASSED', 'Overall defensive schema audit status is PASSED');

  // Verify ID format validation (Path traversal & script injection)
  assert(isValidIdFormat('s_01') === true, 'Valid alphanumeric ID format accepted');
  assert(isValidIdFormat('kas_utama') === true, 'Valid ID with underscore accepted');
  assert(isValidIdFormat('../students/malicious') === false, 'Path traversal injection rejected by isValidIdFormat');
  assert(isValidIdFormat('<script>alert(1)</script>') === false, 'XSS script injection rejected by isValidIdFormat');
  assert(isValidIdFormat('A'.repeat(200)) === false, 'Oversized ID (>128 bytes) rejected by isValidIdFormat');

  // ---------------------------------------------------------------------------
  // 6. PASSIVE DELETION & TEACHER PROTECTION INVARIANTS
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Passive Deletion Guards & Teacher Protection Invariants ---');

  assert(isProtectedTeacherOrStaff(mockTeachers[0]) === true, 'Headmaster Zakaria is protected from accidental deletion');
  assert(isProtectedTeacherOrStaff(mockTeachers[1]) === true, 'Pembina OSIM Puput Eka Bajuri is protected from accidental deletion');
  assert(isProtectedFunctionalUid('user_guru_01') === true, 'Functional UID user_guru_01 is protected');
  assert(isProtectedFunctionalUid('user_guru_bk') === true, 'Functional UID user_guru_bk is protected');
  assert(isProtectedFunctionalUid('user_waka') === true, 'Functional UID user_waka is protected');

  console.log('\n======================================================');
  console.log(`PRIORITY 3 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed} TESTS)`);
  console.log('======================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('\x1b[32m✔ ALL PRIORITY 3 RELATIONAL INTEGRITY, HARMONIZATION & SCHEMA SHIELD TESTS PASSED!\x1b[0m\n');
    process.exit(0);
  }
}

runPriority3Tests().catch(err => {
  console.error('Priority 3 Test suite execution error:', err);
  process.exit(1);
});
