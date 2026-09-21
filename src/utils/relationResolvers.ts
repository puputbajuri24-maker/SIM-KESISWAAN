import { Student, Teacher, StudentViolation, StudentCounseling, ExtracurricularMember, OsimMember, Extracurricular } from '../types';
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
 * and warns of any orphan foreign keys.
 */
export interface RelationalHealthReport {
  totalStudents: number;
  totalTeachers: number;
  totalExtracurriculars: number;
  totalViolations: number;
  totalCounselings: number;
  totalEkskulMembers: number;
  totalOsimMembers: number;
  orphanViolations: number;
  orphanCounselings: number;
  orphanEkskulMembers: number;
  orphanCoaches: number;
  isHealthy: boolean;
}

export const auditRelationalIntegrity = (
  students: Student[],
  teachers: Teacher[],
  extracurriculars: Extracurricular[],
  violations: StudentViolation[],
  counselings: StudentCounseling[],
  members: ExtracurricularMember[],
  osimMembers: OsimMember[]
): RelationalHealthReport => {
  let orphanViolations = 0;
  let orphanCounselings = 0;
  let orphanEkskulMembers = 0;
  let orphanCoaches = 0;

  violations.forEach(v => {
    const student = resolveStudent(students, { id: v.studentId, code: v.studentCode, nis: v.studentNis, name: v.studentName });
    if (!student) orphanViolations++;
  });

  counselings.forEach(c => {
    const student = resolveStudent(students, { id: c.studentId, code: c.studentCode, nis: c.studentNis, name: c.studentName });
    if (!student) orphanCounselings++;
  });

  members.forEach(m => {
    const student = resolveStudent(students, { id: m.studentId, code: m.studentCode, nis: m.studentNis, name: m.studentName });
    if (!student) orphanEkskulMembers++;
  });

  extracurriculars.forEach(e => {
    if (e.coachId) {
      const teacher = resolveTeacher(teachers, { id: e.coachId, code: e.coachCode, name: e.coachName });
      if (!teacher) orphanCoaches++;
    }
  });

  const isHealthy = orphanViolations === 0 && orphanCounselings === 0 && orphanEkskulMembers === 0 && orphanCoaches === 0;

  return {
    totalStudents: students.length,
    totalTeachers: teachers.length,
    totalExtracurriculars: extracurriculars.length,
    totalViolations: violations.length,
    totalCounselings: counselings.length,
    totalEkskulMembers: members.length,
    totalOsimMembers: osimMembers.length,
    orphanViolations,
    orphanCounselings,
    orphanEkskulMembers,
    orphanCoaches,
    isHealthy
  };
};
