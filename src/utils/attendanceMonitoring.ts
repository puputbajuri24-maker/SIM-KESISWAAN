import { SchoolClass, Student, AttendanceSession, StudentPermission, StudentCounseling, HomeVisitRecord, ParentCallLetter } from '../types';
import { isStudentInClass } from './classResolver';

export interface AbsenceIncident {
  date: string;
  status: 'Izin' | 'Sakit' | 'Alpa';
  sessionName?: string;
  notes?: string;
}

export interface StudentAttendanceStats {
  studentId: string;
  studentName: string;
  studentNis: string;
  studentClass: string;
  classId?: string;
  gender?: 'L' | 'P';
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  address?: string;
  totalSessions: number;
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  rate: number; // 0 - 100 %
  riskLevel: 'critical' | 'warning' | 'safe';
  riskLabel: string;
  recentAbsences: AbsenceIncident[];
  counselingCount: number;
  homeVisitCount: number;
  parentCallCount: number;
}

export interface ClassAttendanceSummary {
  classId: string;
  className: string;
  grade?: string;
  major?: string;
  homeroomTeacher?: string;
  totalStudents: number;
  avgAttendanceRate: number;
  totalAlpa: number;
  totalIzin: number;
  totalSakit: number;
  criticalCount: number; // Sering absen / alpa >= 2 atau rate < 80%
  warningCount: number;  // Perlu perhatian: alpa = 1 atau sakit/izin tinggi
  safeCount: number;     // Kehadiran prima
  isAssignedToCurrentUser?: boolean;
}

const LOCAL_STORAGE_BK_CLASSES_PREFIX = 'sim_bk_assigned_classes_';

/**
 * Mendapatkan daftar ID atau Nama Kelas binaan Guru BK dari localStorage
 */
export const getGuruBkAssignedClasses = (userUid?: string): string[] => {
  const key = `${LOCAL_STORAGE_BK_CLASSES_PREFIX}${userUid || 'default'}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse assigned BK classes from storage:', e);
  }
  return [];
};

/**
 * Menyimpan daftar ID Kelas binaan Guru BK ke localStorage
 */
export const saveGuruBkAssignedClasses = (userUid: string | undefined, classIds: string[]): void => {
  const key = `${LOCAL_STORAGE_BK_CLASSES_PREFIX}${userUid || 'default'}`;
  try {
    localStorage.setItem(key, JSON.stringify(classIds));
  } catch (e) {
    console.warn('Failed to save assigned BK classes to storage:', e);
  }
};

/**
 * Menghitung statistik kehadiran per siswa secara mendalam
 */
export const calculateStudentAttendanceStats = (
  students: Student[],
  attendanceSessions: AttendanceSession[],
  permissions: StudentPermission[] = [],
  counselings: StudentCounseling[] = [],
  homeVisits: HomeVisitRecord[] = [],
  parentCalls: ParentCallLetter[] = [],
  dateRange?: { startDate?: string; endDate?: string }
): StudentAttendanceStats[] => {
  const safeStudents = students || [];
  let safeSessions = attendanceSessions || [];
  let safePermissions = permissions || [];
  const safeCounselings = counselings || [];
  const safeHomeVisits = homeVisits || [];
  const safeParentCalls = parentCalls || [];

  // Filter sessions and permissions if dateRange is provided
  if (dateRange?.startDate || dateRange?.endDate) {
    const { startDate, endDate } = dateRange;
    if (startDate) {
      safeSessions = safeSessions.filter(s => !s.date || s.date >= startDate);
      safePermissions = safePermissions.filter(p => {
        const pDate = (p.startDate || p.createdAt || '').slice(0, 10);
        return !pDate || pDate >= startDate;
      });
    }
    if (endDate) {
      safeSessions = safeSessions.filter(s => !s.date || s.date <= endDate);
      safePermissions = safePermissions.filter(p => {
        const pDate = (p.startDate || p.createdAt || '').slice(0, 10);
        return !pDate || pDate <= endDate;
      });
    }
  }

  return safeStudents.map(student => {
    let hadir = 0;
    let izin = 0;
    let sakit = 0;
    let alpa = 0;
    const absences: AbsenceIncident[] = [];

    // 1. Agregasi dari Sesi Presensi
    safeSessions.forEach(session => {
      const records = session.records || session.items || [];
      const studentRecord = records.find(
        r =>
          (r.studentId && r.studentId === student.id) ||
          (r.studentNis && student.nis && r.studentNis.trim() === student.nis.trim()) ||
          (r.studentName && student.fullName && r.studentName.trim().toLowerCase() === student.fullName.trim().toLowerCase())
      );

      if (studentRecord) {
        if (studentRecord.status === 'Hadir') {
          hadir++;
        } else if (studentRecord.status === 'Izin') {
          izin++;
          absences.push({
            date: session.date || '',
            status: 'Izin',
            sessionName: session.extracurricularName || session.topic || 'Presensi Harian',
            notes: studentRecord.notes || session.notes
          });
        } else if (studentRecord.status === 'Sakit') {
          sakit++;
          absences.push({
            date: session.date || '',
            status: 'Sakit',
            sessionName: session.extracurricularName || session.topic || 'Presensi Harian',
            notes: studentRecord.notes || session.notes
          });
        } else if (studentRecord.status === 'Alpa') {
          alpa++;
          absences.push({
            date: session.date || '',
            status: 'Alpa',
            sessionName: session.extracurricularName || session.topic || 'Presensi Harian',
            notes: studentRecord.notes || 'Tanpa Keterangan'
          });
        }
      }
    });

    // 2. Agregasi dari Dispensasi / Surat Izin Resmi Sekolah yang telah disetujui
    safePermissions.forEach(perm => {
      const match =
        (perm.studentId && perm.studentId === student.id) ||
        (perm.studentNis && student.nis && perm.studentNis.trim() === student.nis.trim()) ||
        (perm.studentName && student.fullName && perm.studentName.trim().toLowerCase() === student.fullName.trim().toLowerCase());

      if (match && (perm.status === 'Disetujui' || perm.status === 'Selesai')) {
        if (perm.type === 'Sakit') {
          sakit++;
          absences.push({
            date: perm.startDate || perm.createdAt || '',
            status: 'Sakit',
            sessionName: 'Surat Keterangan Sakit Resmi',
            notes: perm.reason || 'Izin Sakit Terverifikasi'
          });
        } else {
          izin++;
          absences.push({
            date: perm.startDate || perm.createdAt || '',
            status: 'Izin',
            sessionName: perm.activityName ? `Dispensasi: ${perm.activityName}` : 'Izin Resmi Sekolah',
            notes: perm.reason || 'Izin Resmi'
          });
        }
      }
    });

    const totalRecorded = hadir + izin + sakit + alpa;
    // Jika belum ada sesi presensi terdata sama sekali, rate dianggap 100% (belum ada catatan mangkir)
    const rate = totalRecorded > 0 ? Math.round((hadir / totalRecorded) * 100) : 100;

    // Tingkat Risiko Ketidakhadiran (Early Warning System BK)
    let riskLevel: 'critical' | 'warning' | 'safe' = 'safe';
    let riskLabel = 'Kehadiran Baik';

    if (alpa >= 2 || (totalRecorded >= 4 && rate < 75)) {
      riskLevel = 'critical';
      riskLabel = 'Kritis (Perlu Intervensi Segera)';
    } else if (alpa >= 1 || (izin + sakit) >= 3 || (totalRecorded >= 3 && rate < 85)) {
      riskLevel = 'warning';
      riskLabel = 'Perlu Perhatian';
    }

    // Hitung intervensi BK yang sudah pernah dilakukan untuk siswa ini
    const studentCounselings = safeCounselings.filter(c => c.studentId === student.id || c.studentNis === student.nis);
    const studentHomeVisits = safeHomeVisits.filter(h => h.studentId === student.id || h.studentNis === student.nis);
    const studentParentCalls = safeParentCalls.filter(p => p.studentId === student.id || p.studentNis === student.nis);

    // Urutkan absensi dari yang terbaru
    absences.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    return {
      studentId: student.id,
      studentName: student.fullName || (student as any).name || 'Siswa',
      studentNis: student.nis || '-',
      studentClass: student.className || '',
      classId: student.classId,
      gender: student.gender,
      phone: student.phone,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      address: student.address,
      totalSessions: totalRecorded,
      hadir,
      izin,
      sakit,
      alpa,
      rate,
      riskLevel,
      riskLabel,
      recentAbsences: absences,
      counselingCount: studentCounselings.length,
      homeVisitCount: studentHomeVisits.length,
      parentCallCount: studentParentCalls.length
    };
  });
};

/**
 * Menghitung ringkasan kehadiran untuk setiap kelas (Grid Kelas)
 */
export const calculateClassAttendanceSummaries = (
  classes: SchoolClass[],
  students: Student[],
  studentStats: StudentAttendanceStats[],
  assignedClassIds: string[] = []
): ClassAttendanceSummary[] => {
  const safeClasses = classes || [];

  return safeClasses.map(cls => {
    // Siswa di dalam kelas ini
    const classStudents = students.filter(s => isStudentInClass(s, cls.name, safeClasses) || s.classId === cls.id);
    const classStats = studentStats.filter(st => {
      const matchedStudent = classStudents.find(cs => cs.id === st.studentId);
      return Boolean(matchedStudent || isStudentInClass({ studentClass: st.studentClass }, cls.name, safeClasses));
    });

    const totalStudents = classStudents.length;
    let sumRates = 0;
    let totalAlpa = 0;
    let totalIzin = 0;
    let totalSakit = 0;
    let criticalCount = 0;
    let warningCount = 0;
    let safeCount = 0;

    classStats.forEach(stat => {
      sumRates += stat.rate;
      totalAlpa += stat.alpa;
      totalIzin += stat.izin;
      totalSakit += stat.sakit;

      if (stat.riskLevel === 'critical') criticalCount++;
      else if (stat.riskLevel === 'warning') warningCount++;
      else safeCount++;
    });

    const avgAttendanceRate = classStats.length > 0 ? Math.round(sumRates / classStats.length) : 100;
    const isAssigned = assignedClassIds.length === 0 || assignedClassIds.includes(cls.id) || assignedClassIds.includes(cls.name);

    return {
      classId: cls.id,
      className: cls.name,
      grade: cls.grade,
      major: cls.major,
      homeroomTeacher: cls.homeroomTeacherName || cls.homeroomTeacher || 'Belum Ditetapkan',
      totalStudents,
      avgAttendanceRate,
      totalAlpa,
      totalIzin,
      totalSakit,
      criticalCount,
      warningCount,
      safeCount,
      isAssignedToCurrentUser: isAssigned
    };
  });
};
