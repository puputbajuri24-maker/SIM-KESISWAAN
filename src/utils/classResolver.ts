import { SchoolClass, Student } from '../types';

/**
 * Normalizes class strings to facilitate resilient comparison between:
 * - Roman vs Arabic numerals (X vs 10, XI vs 11, XII vs 12)
 * - Punctuation & spaces (10-A vs 10 A vs 10.A vs 10A vs Kelas 10-A)
 * - Standard Majors (MIPA vs MIA, IPS vs IIS)
 */
export const normalizeClassString = (str?: string): string => {
  if (!str) return '';
  let s = String(str).trim().toUpperCase();
  
  // Remove common prefixes
  s = s.replace(/^(KELAS|ROMBEL|RUANG|TINGKAT)\s*[:\-]?\s*/i, '');
  
  // Normalize Roman numerals at word boundaries to Arabic digits
  s = s.replace(/^XII(\b|[^\w]|_|-|\s)/, '12$1');
  s = s.replace(/^XI(\b|[^\w]|_|-|\s)/, '11$1');
  s = s.replace(/^X(\b|[^\w]|_|-|\s)/, '10$1');
  
  // If the entire string is just the Roman numeral
  if (s === 'XII') s = '12';
  else if (s === 'XI') s = '11';
  else if (s === 'X') s = '10';

  // Normalize Major synonyms
  s = s.replace(/MIPA/g, 'MIA');
  s = s.replace(/IPS/g, 'IIS');

  // Strip all non-alphanumeric characters
  s = s.replace(/[^A-Z0-9]/g, '');
  return s;
};

/**
 * Finds the corresponding SchoolClass from a list given any identifier or name string.
 */
export const findMatchingClass = (
  rawIdOrName?: string,
  classes: SchoolClass[] = []
): SchoolClass | undefined => {
  if (!rawIdOrName || !classes || classes.length === 0) return undefined;
  const target = String(rawIdOrName).trim();
  if (!target) return undefined;

  // 1. Direct ID match
  const byId = classes.find(c => c.id === target);
  if (byId) return byId;

  // 2. Direct Name match (case-insensitive)
  const byName = classes.find(c => c.name.trim().toLowerCase() === target.toLowerCase());
  if (byName) return byName;

  // 3. Normalized string match
  const normTarget = normalizeClassString(target);
  if (normTarget) {
    const byNormName = classes.find(c => normalizeClassString(c.name) === normTarget);
    if (byNormName) return byNormName;

    const byNormId = classes.find(c => normalizeClassString(c.id) === normTarget);
    if (byNormId) return byNormId;
  }

  // 4. Substring / Prefix match (e.g. "10-A" matching "10-A MIPA" or vice versa)
  if (target.length >= 2) {
    const bySub = classes.find(c => {
      const cNorm = normalizeClassString(c.name);
      return cNorm && normTarget && (cNorm.startsWith(normTarget) || normTarget.startsWith(cNorm));
    });
    if (bySub) return bySub;
  }

  return undefined;
};

/**
 * Resolves the SchoolClass for a student or record with class fields.
 */
export const resolveStudentClass = (
  record: { classId?: string; className?: string; studentClass?: string },
  classes: SchoolClass[] = []
): SchoolClass | undefined => {
  if (!record || !classes || classes.length === 0) return undefined;

  // 1. Check by classId first
  if (record.classId) {
    const matched = findMatchingClass(record.classId, classes);
    if (matched) return matched;
  }

  // 2. Check by className
  if (record.className) {
    const matched = findMatchingClass(record.className, classes);
    if (matched) return matched;
  }

  // 3. Check by studentClass (for violations, counseling, achievements, permissions, members)
  if (record.studentClass) {
    const matched = findMatchingClass(record.studentClass, classes);
    if (matched) return matched;
  }

  return undefined;
};

/**
 * Checks if a student or record belongs to the selected class (by ID or Name).
 */
export const isStudentInClass = (
  record: { classId?: string; className?: string; studentClass?: string },
  selectedClassIdOrName: string,
  classes: SchoolClass[] = []
): boolean => {
  if (!selectedClassIdOrName || selectedClassIdOrName === 'all') return true;

  const targetClass = findMatchingClass(selectedClassIdOrName, classes);
  const recordClass = resolveStudentClass(record, classes);

  if (targetClass && recordClass) {
    return targetClass.id === recordClass.id;
  }

  // Direct fallback checks
  const sClassId = record.classId || '';
  const sClassName = record.className || record.studentClass || '';

  if (sClassId === selectedClassIdOrName || sClassName === selectedClassIdOrName) return true;
  if (targetClass && (sClassId === targetClass.id || sClassName === targetClass.name)) return true;

  // Normalized fallback
  const normSelected = normalizeClassString(selectedClassIdOrName);
  if (normSelected) {
    if (normalizeClassString(sClassId) === normSelected) return true;
    if (normalizeClassString(sClassName) === normSelected) return true;
  }

  return false;
};

/**
 * Computes a resilient student count map per class ID and class Name.
 */
export const calculateStudentCountsByClass = (
  students: Student[],
  classes: SchoolClass[]
): Record<string, number> => {
  const map: Record<string, number> = {};

  // Initialize all classes with 0 for both ID and Name keys
  classes.forEach(c => {
    map[c.id] = 0;
    map[c.name] = 0;
  });

  students.forEach(s => {
    const matched = resolveStudentClass(s, classes);
    if (matched) {
      map[matched.id] = (map[matched.id] || 0) + 1;
      map[matched.name] = (map[matched.name] || 0) + 1;
    } else {
      if (s.classId) map[s.classId] = (map[s.classId] || 0) + 1;
      if (s.className) map[s.className] = (map[s.className] || 0) + 1;
    }
  });

  return map;
};

/**
 * Computes a resilient record count map for any entity having studentClass or studentId.
 */
export const calculateRecordCountsByClass = <T extends { studentClass?: string; studentId?: string }>(
  records: T[],
  classes: SchoolClass[],
  students?: Student[]
): Record<string, number> => {
  const map: Record<string, number> = {};

  classes.forEach(c => {
    map[c.id] = 0;
    map[c.name] = 0;
  });

  records.forEach(r => {
    let matched = findMatchingClass(r.studentClass, classes);
    if (!matched && r.studentId && students) {
      const student = students.find(s => s.id === r.studentId);
      if (student) {
        matched = resolveStudentClass(student, classes);
      }
    }

    if (matched) {
      map[matched.id] = (map[matched.id] || 0) + 1;
      map[matched.name] = (map[matched.name] || 0) + 1;
    } else if (r.studentClass) {
      map[r.studentClass] = (map[r.studentClass] || 0) + 1;
    }
  });

  return map;
};
