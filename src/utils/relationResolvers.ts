import { Student, Teacher, StudentViolation, StudentCounseling, ExtracurricularMember, OsimMember, Extracurricular, CashAccount, CashTransaction } from '../types';
import { cleanDigits, normalizeName } from './syncUtils';

/**
 * Safely resolves a Student record by matching ID, Code (SIS-YY-XXXX), NIS, NISN, or Name.
 */
export const resolveStudent = (
  students: Student[],
  identifier?: { id?: string; code?: string; nis?: string; nisn?: string; name?: string }
): Student | undefined => {
  if (!identifier || !students || students.length === 0) return undefined;

  // 1. Match by exact Firestore ID
  if (identifier.id) {
    const byId = students.find(s => s.id === identifier.id);
    if (byId) return byId;
  }

  // 2. Match by standardized Code (e.g. SIS-2425-0001)
  if (identifier.code) {
    const cleanCode = identifier.code.trim().toUpperCase();
    const byCode = students.find(s => s.code && s.code.trim().toUpperCase() === cleanCode);
    if (byCode) return byCode;
  }

  // 3. Match by Clean NISN (if at least 8 digits)
  const queryNisn = cleanDigits(identifier.nisn);
  if (queryNisn && queryNisn.length >= 8) {
    const byNisn = students.find(s => s.nisn && cleanDigits(s.nisn) === queryNisn);
    if (byNisn) return byNisn;
  }

  // 4. Match by Clean NIS (if at least 3 digits)
  const queryNis = cleanDigits(identifier.nis);
  if (queryNis && queryNis.length >= 3) {
    const byNis = students.find(s => s.nis && cleanDigits(s.nis) === queryNis);
    if (byNis) return byNis;
  }

  // 5. Match by Normalized Name (if provided)
  if (identifier.name) {
    const normName = normalizeName(identifier.name);
    if (normName) {
      const byName = students.find(s => normalizeName(s.fullName) === normName);
      if (byName) return byName;
    }
  }

  return undefined;
};

/**
 * Safely resolves a Teacher record by matching ID, Code (Gxx-YY), NIP, or Name.
 */
export const resolveTeacher = (
  teachers: Teacher[],
  identifier?: { id?: string; code?: string; nip?: string; name?: string }
): Teacher | undefined => {
  if (!identifier || !teachers || teachers.length === 0) return undefined;

  // 1. Match by exact ID
  if (identifier.id) {
    const byId = teachers.find(t => t.id === identifier.id);
    if (byId) return byId;
  }

  // 2. Match by standardized Code (e.g. G01-BS)
  if (identifier.code) {
    const cleanCode = identifier.code.trim().toUpperCase();
    const byCode = teachers.find(t => t.code && t.code.trim().toUpperCase() === cleanCode);
    if (byCode) return byCode;
  }

  // 3. Match by Clean NIP (if at least 6 digits)
  const queryNip = cleanDigits(identifier.nip);
  if (queryNip && queryNip.length >= 6) {
    const byNip = teachers.find(t => t.nip && cleanDigits(t.nip) === queryNip);
    if (byNip) return byNip;
  }

  // 4. Match by Normalized Name
  if (identifier.name) {
    const normName = normalizeName(identifier.name);
    if (normName) {
      const byName = teachers.find(t => normalizeName(t.fullName) === normName);
      if (byName) return byName;
    }
  }

  return undefined;
};

/**
 * Relational integrity check: returns summary of connected relations
 * and warns of any orphan foreign keys or ledger balance drifts.
 */
export interface RelationalHealthReport {
  totalStudents: number;
  totalTeachers: number;
  totalExtracurriculars: number;
  totalViolations: number;
  totalCounselings: number;
  totalEkskulMembers: number;
  totalOsimMembers: number;
  totalCashAccounts: number;
  totalCashTransactions: number;
  orphanViolations: number;
  orphanCounselings: number;
  orphanEkskulMembers: number;
  orphanClubMembers?: number;
  orphanCoaches: number;
  orphanCashTransactions: number;
  studentPointDiscrepancies: number;
  cashBalanceDiscrepancies: number;
  ekskulCountDiscrepancies?: number;
  isHealthy: boolean;
}

export const auditRelationalIntegrity = (
  students: Student[],
  teachers: Teacher[],
  extracurriculars: Extracurricular[],
  violations: StudentViolation[],
  counselings: StudentCounseling[],
  members: ExtracurricularMember[],
  osimMembers: OsimMember[],
  cashAccounts: CashAccount[] = [],
  cashTransactions: CashTransaction[] = []
): RelationalHealthReport => {
  let orphanViolations = 0;
  let orphanCounselings = 0;
  let orphanEkskulMembers = 0;
  let orphanClubMembers = 0;
  let orphanCoaches = 0;
  let orphanCashTransactions = 0;
  let studentPointDiscrepancies = 0;
  let cashBalanceDiscrepancies = 0;
  let ekskulCountDiscrepancies = 0;

  // 1. Audit Student links on Violations
  const activeViolations = violations.filter(v => !v.isDeleted && v.status !== 'Dibatalkan');
  const pointsMap = new Map<string, number>();

  violations.forEach(v => {
    const student = resolveStudent(students, { id: v.studentId, code: v.studentCode, nis: v.studentNis, name: v.studentName });
    if (!student) orphanViolations++;
  });

  activeViolations.forEach(v => {
    const curr = pointsMap.get(v.studentId) || 0;
    pointsMap.set(v.studentId, curr + (Number(v.points) || 0));
  });

  // 2. Audit Student Points Discrepancies
  students.forEach(s => {
    const calculatedPoints = pointsMap.get(s.id) || 0;
    if ((s.violationPoints || 0) !== calculatedPoints) {
      studentPointDiscrepancies++;
    }
  });

  // 3. Audit Counseling student links
  counselings.forEach(c => {
    const student = resolveStudent(students, { id: c.studentId, code: c.studentCode, nis: c.studentNis, name: c.studentName });
    if (!student) orphanCounselings++;
  });

  // 4. Audit Extracurricular Member links (Student & Club existence)
  const ekskulIdMap = new Set(extracurriculars.map(e => e.id));
  const memberCountPerEkskul: Record<string, number> = {};

  members.forEach(m => {
    const student = resolveStudent(students, { id: m.studentId, code: m.studentCode, nis: m.studentNis, name: m.studentName });
    if (!student) orphanEkskulMembers++;

    if (m.extracurricularId && !ekskulIdMap.has(m.extracurricularId)) {
      orphanClubMembers++;
    }

    if (m.status === 'Aktif' && m.extracurricularId) {
      memberCountPerEkskul[m.extracurricularId] = (memberCountPerEkskul[m.extracurricularId] || 0) + 1;
    }
  });

  // Check ekskul member count discrepancies
  extracurriculars.forEach(e => {
    const realCount = memberCountPerEkskul[e.id] || 0;
    if ((e.memberCount || 0) !== realCount) {
      ekskulCountDiscrepancies++;
    }
  });

  // 5. Audit Extracurricular Coaches
  extracurriculars.forEach(e => {
    if (e.coachId) {
      const teacher = resolveTeacher(teachers, { id: e.coachId, code: e.coachCode, name: e.coachName });
      if (!teacher) orphanCoaches++;
    }
  });

  // 6. Audit Cash Transactions & Balance Consistency
  const accountMap = new Map<string, CashAccount>();
  cashAccounts.forEach(acc => accountMap.set(acc.id, acc));

  const accountNetSum = new Map<string, number>();
  cashTransactions.forEach(trx => {
    if (!accountMap.has(trx.accountId)) {
      orphanCashTransactions++;
    } else {
      const delta = trx.type === 'MASUK' ? Number(trx.amount) : -Number(trx.amount);
      const curr = accountNetSum.get(trx.accountId) || 0;
      accountNetSum.set(trx.accountId, curr + delta);
    }
  });

  cashAccounts.forEach(acc => {
    const expected = (Number(acc.initialBalance) || 0) + (accountNetSum.get(acc.id) || 0);
    if ((Number(acc.balance) || 0) !== expected) {
      cashBalanceDiscrepancies++;
    }
  });

  const isHealthy = orphanViolations === 0 && 
    orphanCounselings === 0 && 
    orphanEkskulMembers === 0 && 
    orphanClubMembers === 0 &&
    orphanCoaches === 0 &&
    orphanCashTransactions === 0 &&
    studentPointDiscrepancies === 0 &&
    cashBalanceDiscrepancies === 0 &&
    ekskulCountDiscrepancies === 0;

  return {
    totalStudents: students.length,
    totalTeachers: teachers.length,
    totalExtracurriculars: extracurriculars.length,
    totalViolations: violations.length,
    totalCounselings: counselings.length,
    totalEkskulMembers: members.length,
    totalOsimMembers: osimMembers.length,
    totalCashAccounts: cashAccounts.length,
    totalCashTransactions: cashTransactions.length,
    orphanViolations,
    orphanCounselings,
    orphanEkskulMembers,
    orphanClubMembers,
    orphanCoaches,
    orphanCashTransactions,
    studentPointDiscrepancies,
    cashBalanceDiscrepancies,
    ekskulCountDiscrepancies,
    isHealthy
  };
};
