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

/**
 * Extracts a numeric weight for class grades to ensure correct progression:
 * Kelas 7 (7) -> Kelas 8 (8) -> Kelas 9 (9) -> Kelas X (10) -> Kelas XI (11) -> Kelas XII (12).
 */
export const getGradeWeight = (gradeOrName?: string): number => {
  if (!gradeOrName) return 999;
  const s = String(gradeOrName).trim().toUpperCase();

  // Explicit XII / 12
  if (/^(KELAS\s*)?XII(\b|[^I]|$)|^(KELAS\s*)?12(\b|$)/i.test(s)) return 12;
  // Explicit XI / 11
  if (/^(KELAS\s*)?XI(\b|[^I]|$)|^(KELAS\s*)?11(\b|$)/i.test(s)) return 11;
  // Explicit X / 10
  if (/^(KELAS\s*)?X(\b|[^I]|$)|^(KELAS\s*)?10(\b|$)/i.test(s)) return 10;
  // SMP/MTs Grades
  if (/^(KELAS\s*)?IX(\b|$)|^(KELAS\s*)?9(\b|$)/i.test(s)) return 9;
  if (/^(KELAS\s*)?VIII(\b|$)|^(KELAS\s*)?8(\b|$)/i.test(s)) return 8;
  if (/^(KELAS\s*)?VII(\b|$)|^(KELAS\s*)?7(\b|$)/i.test(s)) return 7;

  return 999;
};

/**
 * Compares two classes first by Grade Classification (X -> XI -> XII),
 * then within the same grade naturally alphabetically (e.g. X MIA 1 < X MIA 2 < X IIS 1).
 */
export const compareClassesByClassification = (a: SchoolClass, b: SchoolClass): number => {
  const weightA = getGradeWeight(a.grade || a.name);
  const weightB = getGradeWeight(b.grade || b.name);

  if (weightA !== weightB) {
    return weightA - weightB;
  }

  // Same grade: sort naturally alphabetically (numeric aware)
  return (a.name || '').localeCompare(b.name || '', 'id', { numeric: true, sensitivity: 'base' });
};

/**
 * Sorts classes with customizable criteria:
 * - 'classification': Tingkat (X -> XI -> XII) lalu Abjad Rombel (A-Z)
 * - 'name-asc': Abjad Kelas murni (A-Z)
 * - 'name-desc': Abjad Kelas terbalik (Z-A)
 * - 'count-desc': Jumlah siswa / entitas terbanyak
 */
export type ClassSortOrder = 'classification' | 'name-asc' | 'name-desc' | 'count-desc';

export const sortClasses = (
  classList: SchoolClass[],
  sortOrder: ClassSortOrder = 'classification',
  countsMap?: Record<string, number>
): SchoolClass[] => {
  const copy = [...classList];

  switch (sortOrder) {
    case 'name-asc':
      return copy.sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', 'id', { numeric: true, sensitivity: 'base' })
      );
    case 'name-desc':
      return copy.sort((a, b) =>
        (b.name || '').localeCompare(a.name || '', 'id', { numeric: true, sensitivity: 'base' })
      );
    case 'count-desc':
      return copy.sort((a, b) => {
        const countA = countsMap ? (countsMap[a.id] ?? countsMap[a.name] ?? 0) : 0;
        const countB = countsMap ? (countsMap[b.id] ?? countsMap[b.name] ?? 0) : 0;
        if (countA !== countB) return countB - countA;
        return compareClassesByClassification(a, b);
      });
    case 'classification':
    default:
      return copy.sort(compareClassesByClassification);
  }
};

/**
 * Sorts students strictly by Class Hierarchy first (Grade X -> XI -> XII, Class A-Z),
 * and within each class sorts students alphabetically by full name (A-Z).
 * This fulfills: "urut abjad akan tetapi per kelas".
 */
export type StudentSortOrder =
  | 'class-alphabetical' // Per kelas & abjad nama A-Z
  | 'name-asc'           // Nama A-Z global
  | 'name-desc'          // Nama Z-A global
  | 'nis-asc'            // Nomor Induk Siswa
  | 'status'             // Status aktif dulu
  | 'violations'         // Poin pelanggaran tertinggi
  | 'achievements';      // Poin prestasi tertinggi

export const sortStudentsCustom = (
  studentsList: Student[],
  classes: SchoolClass[] = [],
  sortOrder: StudentSortOrder = 'class-alphabetical'
): Student[] => {
  const copy = [...studentsList];

  // Helper map for class resolution to avoid re-resolving repeatedly in sort loop
  const classMap = new Map<string, { weight: number; className: string }>();

  const getClassInfo = (s: Student) => {
    const key = s.classId || s.className || '';
    if (classMap.has(key)) return classMap.get(key)!;

    const matched = resolveStudentClass(s, classes);
    const weight = matched ? getGradeWeight(matched.grade || matched.name) : getGradeWeight(s.className);
    const className = matched?.name || s.className || 'ZZZ_Unassigned';
    const info = { weight, className };
    classMap.set(key, info);
    return info;
  };

  switch (sortOrder) {
    case 'name-asc':
      return copy.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'id', { sensitivity: 'base' }));

    case 'name-desc':
      return copy.sort((a, b) => (b.fullName || '').localeCompare(a.fullName || '', 'id', { sensitivity: 'base' }));

    case 'nis-asc':
      return copy.sort((a, b) => (a.nis || '').localeCompare(b.nis || '', 'id', { numeric: true }));

    case 'status':
      const statusWeight: Record<string, number> = { 'Aktif': 1, 'Pindah': 2, 'Keluar': 3, 'Alumni': 4 };
      return copy.sort((a, b) => {
        const wA = statusWeight[a.status || 'Aktif'] || 9;
        const wB = statusWeight[b.status || 'Aktif'] || 9;
        if (wA !== wB) return wA - wB;
        return (a.fullName || '').localeCompare(b.fullName || '', 'id', { sensitivity: 'base' });
      });

    case 'violations':
      return copy.sort((a, b) => (b.violationPoints || 0) - (a.violationPoints || 0));

    case 'achievements':
      return copy.sort((a, b) => (b.achievementPoints || 0) - (a.achievementPoints || 0));

    case 'class-alphabetical':
    default:
      return copy.sort((a, b) => {
        const classA = getClassInfo(a);
        const classB = getClassInfo(b);

        // 1. Compare Class Grade Weight (X -> XI -> XII)
        if (classA.weight !== classB.weight) {
          return classA.weight - classB.weight;
        }

        // 2. Compare Class Name (A-Z natural)
        const classCmp = classA.className.localeCompare(classB.className, 'id', { numeric: true, sensitivity: 'base' });
        if (classCmp !== 0) {
          return classCmp;
        }

        // 3. Within the same class: strictly sorted alphabetically by Student Name (A-Z)
        return (a.fullName || '').localeCompare(b.fullName || '', 'id', { sensitivity: 'base' });
      });
  }
};

/**
 * Groups students by class, where both classes and students within each class
 * are sorted according to their classification and alphabetical order.
 */
export interface ClassStudentGroup {
  classObj: SchoolClass;
  students: Student[];
  studentCount: number;
  maleCount: number;
  femaleCount: number;
}

export const groupStudentsByClass = (
  studentsList: Student[],
  classes: SchoolClass[]
): ClassStudentGroup[] => {
  const sortedClasses = sortClasses(classes, 'classification');
  const groups: ClassStudentGroup[] = [];
  const assignedStudentIds = new Set<string>();

  sortedClasses.forEach(cls => {
    const classStudents = studentsList
      .filter(s => isStudentInClass(s, cls.id, classes))
      .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'id', { sensitivity: 'base' }));

    classStudents.forEach(s => assignedStudentIds.add(s.id));

    const maleCount = classStudents.filter(s => s.gender === 'L').length;
    const femaleCount = classStudents.filter(s => s.gender === 'P').length;

    groups.push({
      classObj: cls,
      students: classStudents,
      studentCount: classStudents.length,
      maleCount,
      femaleCount
    });
  });

  // Handle any unassigned or non-matching students
  const unassigned = studentsList
    .filter(s => !assignedStudentIds.has(s.id))
    .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'id', { sensitivity: 'base' }));

  if (unassigned.length > 0) {
    const dummyClass: SchoolClass = {
      id: 'unassigned',
      name: 'Rombel Lain / Belum Ditentukan',
      grade: 'X',
      major: 'Umum',
      homeroomTeacher: 'Belum Ditentukan',
      studentCount: unassigned.length
    };
    groups.push({
      classObj: dummyClass,
      students: unassigned,
      studentCount: unassigned.length,
      maleCount: unassigned.filter(s => s.gender === 'L').length,
      femaleCount: unassigned.filter(s => s.gender === 'P').length
    });
  }

  return groups;
};
