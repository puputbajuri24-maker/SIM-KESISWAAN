import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SchoolSetting,
  SchoolInfo,
  AcademicYear,
  SchoolClass,
  Student,
  Teacher,
  Extracurricular,
  ExtracurricularMember,
  ScheduleEvent,
  Schedule,
  AttendanceSession,
  AttendanceRecord,
  SchoolActivity,
  Activity,
  ActivityReport,
  StudentViolation,
  Violation,
  StudentCounseling,
  CounselingSession,
  StudentAchievement,
  Achievement,
  StudentPermission,
  NeedsRequest,
  Announcement,
  NotificationItem,
  AuditLogItem,
  OsimMember,
  OsimWorkProgram,
  OsimAspiration,
  OsimMeeting
} from '../types';
import {
  INITIAL_SCHOOL_SETTING,
  INITIAL_ACADEMIC_YEARS,
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  INITIAL_TEACHERS,
  INITIAL_EXTRACURRICULARS,
  INITIAL_MEMBERS,
  INITIAL_SCHEDULES,
  INITIAL_ATTENDANCE,
  INITIAL_ACTIVITIES,
  INITIAL_REPORTS,
  INITIAL_VIOLATIONS,
  INITIAL_COUNSELING,
  INITIAL_ACHIEVEMENTS,
  INITIAL_PERMISSIONS,
  INITIAL_NEEDS_REQUESTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_OSIM_MEMBERS,
  INITIAL_OSIM_PROGRAMS,
  INITIAL_OSIM_ASPIRATIONS,
  INITIAL_OSIM_MEETINGS,
  seedAllFirebaseData
} from '../services/seedData';
import { db } from '../services/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

interface SchoolContextType {
  schoolSetting: SchoolSetting;
  schoolInfo: SchoolSetting;
  updateSchoolSetting: (data: Partial<SchoolSetting>) => Promise<void>;
  updateSchoolInfo: (data: Partial<SchoolSetting>) => Promise<void>;
  academicYears: AcademicYear[];
  activeAcademicYear: string;
  activeSemester: 'Ganjil' | 'Genap';
  setActiveAcademicYear: (year: string, semester?: 'Ganjil' | 'Genap') => void;
  classes: SchoolClass[];
  teachers: Teacher[];
  students: Student[];
  extracurriculars: Extracurricular[];
  members: ExtracurricularMember[];
  schedules: ScheduleEvent[];
  attendance: AttendanceSession[];
  activities: SchoolActivity[];
  activityReports: ActivityReport[];
  violations: StudentViolation[];
  counseling: StudentCounseling[];
  achievements: StudentAchievement[];
  permissions: StudentPermission[];
  needsRequests: NeedsRequest[];
  announcements: Announcement[];
  notifications: NotificationItem[];
  auditLogs: AuditLogItem[];
  
  // Student operations
  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => Promise<void>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  importStudentsBulk: (students: Omit<Student, 'id' | 'createdAt'>[]) => Promise<number>;

  // Teacher operations
  addTeacher: (data: Omit<Teacher, 'id'>) => Promise<void>;
  updateTeacher: (id: string, data: Partial<Teacher>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;

  // Extracurricular operations
  addExtracurricular: (data: Omit<Extracurricular, 'id'>) => Promise<void>;
  updateExtracurricular: (id: string, data: Partial<Extracurricular>) => Promise<void>;
  deleteExtracurricular: (id: string) => Promise<void>;

  // Member operations
  addMember: (data: Omit<ExtracurricularMember, 'id'>) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  updateMember: (id: string, data: Partial<ExtracurricularMember>) => Promise<void>;
  updateMemberStatus: (id: string, status: 'Aktif' | 'Nonaktif') => Promise<void>;

  // Schedule operations
  addSchedule: (data: Omit<ScheduleEvent, 'id'>) => Promise<{ success: boolean; conflict?: string }>;
  updateSchedule: (id: string, data: Partial<ScheduleEvent>) => Promise<{ success: boolean; conflict?: string }>;
  deleteSchedule: (id: string) => Promise<void>;

  // Attendance operations
  saveAttendanceSession: (data: Omit<AttendanceSession, 'id' | 'createdAt'>) => Promise<void>;
  addAttendanceRecord: (data: Omit<AttendanceSession, 'id' | 'createdAt'>) => Promise<void>;
  deleteAttendanceRecord: (id: string) => Promise<void>;

  // Activity operations
  addActivity: (data: Omit<SchoolActivity, 'id' | 'createdAt'>) => Promise<void>;
  updateActivity: (id: string, data: Partial<SchoolActivity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;

  // Report operations
  addReport: (data: Omit<ActivityReport, 'id' | 'createdAt'>) => Promise<void>;
  updateReport: (id: string, data: Partial<ActivityReport>) => Promise<void>;
  addActivityReport: (data: Omit<ActivityReport, 'id' | 'createdAt'>) => Promise<void>;
  updateActivityReport: (id: string, data: Partial<ActivityReport>) => Promise<void>;
  deleteActivityReport: (id: string) => Promise<void>;
  reviewReport: (id: string, status: 'Disetujui' | 'Revisi' | 'Ditolak', feedback?: string) => Promise<void>;

  // Violations & Counseling
  addViolation: (data: Omit<StudentViolation, 'id' | 'createdAt'>) => Promise<void>;
  updateViolation: (id: string, data: Partial<StudentViolation>) => Promise<void>;
  deleteViolation: (id: string) => Promise<void>;

  addCounseling: (data: Omit<StudentCounseling, 'id' | 'createdAt'>) => Promise<void>;
  updateCounseling: (id: string, data: Partial<StudentCounseling>) => Promise<void>;
  addCounselingSession: (data: Omit<StudentCounseling, 'id' | 'createdAt'>) => Promise<void>;
  updateCounselingSession: (id: string, data: Partial<StudentCounseling>) => Promise<void>;
  deleteCounselingSession: (id: string) => Promise<void>;

  // Achievements
  addAchievement: (data: Omit<StudentAchievement, 'id' | 'createdAt'>) => Promise<void>;
  updateAchievement: (id: string, data: Partial<StudentAchievement>) => Promise<void>;
  deleteAchievement: (id: string, arg2?: any, arg3?: any) => Promise<void>;

  // Permissions
  addPermission: (data: Omit<StudentPermission, 'id' | 'createdAt'>) => Promise<void>;
  updatePermission: (id: string, data: Partial<StudentPermission>) => Promise<void>;
  deletePermission: (id: string) => Promise<void>;
  updatePermissionStatus: (id: string, status: 'Menunggu' | 'Disetujui' | 'Ditolak' | 'Selesai') => Promise<void>;

  // Needs Requests
  addNeedsRequest: (data: Omit<NeedsRequest, 'id' | 'createdAt'>) => Promise<void>;
  reviewNeedsRequest: (id: string, status: 'Disetujui' | 'Ditolak' | 'Revisi', adminNotes?: string, approvedBudget?: number) => Promise<void>;

  // OSIM & Intrakurikuler Operations
  osimMembers: OsimMember[];
  osimPrograms: OsimWorkProgram[];
  osimAspirations: OsimAspiration[];
  osimMeetings: OsimMeeting[];
  addOsimMember: (data: Omit<OsimMember, 'id' | 'createdAt'>) => Promise<void>;
  updateOsimMember: (id: string, data: Partial<OsimMember>) => Promise<void>;
  deleteOsimMember: (id: string) => Promise<void>;
  addOsimProgram: (data: Omit<OsimWorkProgram, 'id' | 'createdAt'>) => Promise<void>;
  updateOsimProgram: (id: string, data: Partial<OsimWorkProgram>) => Promise<void>;
  deleteOsimProgram: (id: string) => Promise<void>;
  addOsimAspiration: (data: Omit<OsimAspiration, 'id' | 'createdAt'>) => Promise<void>;
  updateOsimAspiration: (id: string, data: Partial<OsimAspiration>) => Promise<void>;
  deleteOsimAspiration: (id: string) => Promise<void>;
  addOsimMeeting: (data: Omit<OsimMeeting, 'id' | 'createdAt'>) => Promise<void>;
  updateOsimMeeting: (id: string, data: Partial<OsimMeeting>) => Promise<void>;
  deleteOsimMeeting: (id: string) => Promise<void>;

  // Announcements & Notifications
  addAnnouncement: (data: Omit<Announcement, 'id' | 'createdAt'>) => Promise<void>;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Logging & Database Reset / Seed
  logAction: (action: string, module: string, details: string) => Promise<void>;
  syncWithFirebase: () => Promise<void>;
  seedFirebaseDatabase: () => Promise<{ success: boolean; message: string }>;
  isSyncing: boolean;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // States initialized with rich defaults and synced with localStorage / Firestore
  const [schoolSetting, setSchoolSetting] = useState<SchoolSetting>(() => {
    const saved = localStorage.getItem('sim_school_setting');
    return saved ? JSON.parse(saved) : INITIAL_SCHOOL_SETTING;
  });

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(INITIAL_ACADEMIC_YEARS);
  const [activeAcademicYear, setActiveAcademicYearState] = useState<string>('2026/2027');
  const [activeSemester, setActiveSemesterState] = useState<'Ganjil' | 'Genap'>('Ganjil');

  const [classes, setClasses] = useState<SchoolClass[]>(INITIAL_CLASSES);
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('sim_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [extracurriculars, setExtracurriculars] = useState<Extracurricular[]>(() => {
    const saved = localStorage.getItem('sim_extracurriculars');
    return saved ? JSON.parse(saved) : INITIAL_EXTRACURRICULARS;
  });

  const [members, setMembers] = useState<ExtracurricularMember[]>(() => {
    const saved = localStorage.getItem('sim_members');
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });

  const [schedules, setSchedules] = useState<ScheduleEvent[]>(() => {
    const saved = localStorage.getItem('sim_schedules');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULES;
  });

  const [attendance, setAttendance] = useState<AttendanceSession[]>(() => {
    const saved = localStorage.getItem('sim_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [activities, setActivities] = useState<SchoolActivity[]>(() => {
    const saved = localStorage.getItem('sim_activities');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  const [activityReports, setActivityReports] = useState<ActivityReport[]>(() => {
    const saved = localStorage.getItem('sim_reports');
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });

  const [violations, setViolations] = useState<StudentViolation[]>(() => {
    const saved = localStorage.getItem('sim_violations');
    return saved ? JSON.parse(saved) : INITIAL_VIOLATIONS;
  });

  const [counseling, setCounseling] = useState<StudentCounseling[]>(() => {
    const saved = localStorage.getItem('sim_counseling');
    return saved ? JSON.parse(saved) : INITIAL_COUNSELING;
  });

  const [achievements, setAchievements] = useState<StudentAchievement[]>(() => {
    const saved = localStorage.getItem('sim_achievements');
    return saved ? JSON.parse(saved) : INITIAL_ACHIEVEMENTS;
  });

  const [permissions, setPermissions] = useState<StudentPermission[]>(() => {
    const saved = localStorage.getItem('sim_permissions');
    return saved ? JSON.parse(saved) : INITIAL_PERMISSIONS;
  });

  const [needsRequests, setNeedsRequests] = useState<NeedsRequest[]>(() => {
    const saved = localStorage.getItem('sim_needs');
    return saved ? JSON.parse(saved) : INITIAL_NEEDS_REQUESTS;
  });

  const [osimMembers, setOsimMembers] = useState<OsimMember[]>(() => {
    const saved = localStorage.getItem('sim_osim_members');
    return saved ? JSON.parse(saved) : INITIAL_OSIM_MEMBERS;
  });

  const [osimPrograms, setOsimPrograms] = useState<OsimWorkProgram[]>(() => {
    const saved = localStorage.getItem('sim_osim_programs');
    return saved ? JSON.parse(saved) : INITIAL_OSIM_PROGRAMS;
  });

  const [osimAspirations, setOsimAspirations] = useState<OsimAspiration[]>(() => {
    const saved = localStorage.getItem('sim_osim_aspirations');
    return saved ? JSON.parse(saved) : INITIAL_OSIM_ASPIRATIONS;
  });

  const [osimMeetings, setOsimMeetings] = useState<OsimMeeting[]>(() => {
    const saved = localStorage.getItem('sim_osim_meetings');
    return saved ? JSON.parse(saved) : INITIAL_OSIM_MEETINGS;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);

  // Persistence to local state
  useEffect(() => {
    localStorage.setItem('sim_school_setting', JSON.stringify(schoolSetting));
    localStorage.setItem('sim_students', JSON.stringify(students));
    localStorage.setItem('sim_extracurriculars', JSON.stringify(extracurriculars));
    localStorage.setItem('sim_members', JSON.stringify(members));
    localStorage.setItem('sim_schedules', JSON.stringify(schedules));
    localStorage.setItem('sim_attendance', JSON.stringify(attendance));
    localStorage.setItem('sim_activities', JSON.stringify(activities));
    localStorage.setItem('sim_reports', JSON.stringify(activityReports));
    localStorage.setItem('sim_violations', JSON.stringify(violations));
    localStorage.setItem('sim_counseling', JSON.stringify(counseling));
    localStorage.setItem('sim_achievements', JSON.stringify(achievements));
    localStorage.setItem('sim_permissions', JSON.stringify(permissions));
    localStorage.setItem('sim_needs', JSON.stringify(needsRequests));
    localStorage.setItem('sim_osim_members', JSON.stringify(osimMembers));
    localStorage.setItem('sim_osim_programs', JSON.stringify(osimPrograms));
    localStorage.setItem('sim_osim_aspirations', JSON.stringify(osimAspirations));
    localStorage.setItem('sim_osim_meetings', JSON.stringify(osimMeetings));
  }, [
    schoolSetting,
    students,
    extracurriculars,
    members,
    schedules,
    attendance,
    activities,
    activityReports,
    violations,
    counseling,
    achievements,
    permissions,
    needsRequests,
    osimMembers,
    osimPrograms,
    osimAspirations,
    osimMeetings
  ]);

  // Sync with Firestore if collections exist
  const syncWithFirebase = async () => {
    setIsSyncing(true);
    try {
      // School Settings Sync
      const schoolSnap = await getDocs(collection(db, 'schools'));
      if (!schoolSnap.empty) {
        const loadedSchool = schoolSnap.docs[0].data() as SchoolSetting;
        if (loadedSchool && loadedSchool.name) {
          setSchoolSetting(prev => ({ ...prev, ...loadedSchool }));
          if (loadedSchool.currentAcademicYear) {
            setActiveAcademicYearState(loadedSchool.currentAcademicYear);
          }
          if (loadedSchool.currentSemester) {
            setActiveSemesterState(loadedSchool.currentSemester);
          }
        }
      }

      const studentSnap = await getDocs(collection(db, 'students'));
      if (!studentSnap.empty) {
        const loadedStudents: Student[] = [];
        studentSnap.forEach(doc => loadedStudents.push({ id: doc.id, ...doc.data() } as Student));
        setStudents(loadedStudents);
      }

      const ekskulSnap = await getDocs(collection(db, 'extracurriculars'));
      if (!ekskulSnap.empty) {
        const loadedEkskul: Extracurricular[] = [];
        ekskulSnap.forEach(doc => loadedEkskul.push({ id: doc.id, ...doc.data() } as Extracurricular));
        setExtracurriculars(loadedEkskul);
      }

      const memberSnap = await getDocs(collection(db, 'extracurricular_members'));
      if (!memberSnap.empty) {
        const loadedMembers: ExtracurricularMember[] = [];
        memberSnap.forEach(doc => loadedMembers.push({ id: doc.id, ...doc.data() } as ExtracurricularMember));
        setMembers(loadedMembers);
      }

      const schedSnap = await getDocs(collection(db, 'schedules'));
      if (!schedSnap.empty) {
        const loadedSched: ScheduleEvent[] = [];
        schedSnap.forEach(doc => loadedSched.push({ id: doc.id, ...doc.data() } as ScheduleEvent));
        setSchedules(loadedSched);
      }

      const attSnap = await getDocs(collection(db, 'attendance'));
      if (!attSnap.empty) {
        const loadedAtt: AttendanceSession[] = [];
        attSnap.forEach(doc => loadedAtt.push({ id: doc.id, ...doc.data() } as AttendanceSession));
        setAttendance(loadedAtt);
      }

      const actSnap = await getDocs(collection(db, 'activities'));
      if (!actSnap.empty) {
        const loadedAct: SchoolActivity[] = [];
        actSnap.forEach(doc => loadedAct.push({ id: doc.id, ...doc.data() } as SchoolActivity));
        setActivities(loadedAct);
      }

      const repSnap = await getDocs(collection(db, 'activity_reports'));
      if (!repSnap.empty) {
        const loadedRep: ActivityReport[] = [];
        repSnap.forEach(doc => loadedRep.push({ id: doc.id, ...doc.data() } as ActivityReport));
        setActivityReports(loadedRep);
      }

      const violSnap = await getDocs(collection(db, 'violations'));
      if (!violSnap.empty) {
        const loadedViol: StudentViolation[] = [];
        violSnap.forEach(doc => loadedViol.push({ id: doc.id, ...doc.data() } as StudentViolation));
        setViolations(loadedViol);
      }

      const achSnap = await getDocs(collection(db, 'achievements'));
      if (!achSnap.empty) {
        const loadedAch: StudentAchievement[] = [];
        achSnap.forEach(doc => loadedAch.push({ id: doc.id, ...doc.data() } as StudentAchievement));
        setAchievements(loadedAch);
      }

      // OSIM Collections Sync
      const osimMemSnap = await getDocs(collection(db, 'osim_members'));
      if (!osimMemSnap.empty) {
        const loadedOsimMem: OsimMember[] = [];
        osimMemSnap.forEach(doc => loadedOsimMem.push({ id: doc.id, ...doc.data() } as OsimMember));
        setOsimMembers(loadedOsimMem);
      }

      const osimProgSnap = await getDocs(collection(db, 'osim_programs'));
      if (!osimProgSnap.empty) {
        const loadedOsimProg: OsimWorkProgram[] = [];
        osimProgSnap.forEach(doc => loadedOsimProg.push({ id: doc.id, ...doc.data() } as OsimWorkProgram));
        setOsimPrograms(loadedOsimProg);
      }

      const osimAspSnap = await getDocs(collection(db, 'osim_aspirations'));
      if (!osimAspSnap.empty) {
        const loadedOsimAsp: OsimAspiration[] = [];
        osimAspSnap.forEach(doc => loadedOsimAsp.push({ id: doc.id, ...doc.data() } as OsimAspiration));
        setOsimAspirations(loadedOsimAsp);
      }

      const osimMeetSnap = await getDocs(collection(db, 'osim_meetings'));
      if (!osimMeetSnap.empty) {
        const loadedOsimMeet: OsimMeeting[] = [];
        osimMeetSnap.forEach(doc => loadedOsimMeet.push({ id: doc.id, ...doc.data() } as OsimMeeting));
        setOsimMeetings(loadedOsimMeet);
      }
    } catch (e) {
      console.warn('Firestore sync note (using local cache):', e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    syncWithFirebase();
  }, []);

  const seedFirebaseDatabase = async () => {
    setIsSyncing(true);
    const res = await seedAllFirebaseData();
    if (res.success) {
      await syncWithFirebase();
      await logAction('SEED_DATABASE', 'Pengaturan Sistem', 'Inisialisasi data master sekolah ke Firebase Firestore');
    }
    setIsSyncing(false);
    return res;
  };

  const logAction = async (action: string, module: string, details: string) => {
    const newLog: AuditLogItem = {
      id: `log_${Date.now()}`,
      userId: currentUser?.uid || 'system',
      userEmail: currentUser?.email || 'system@sekolah.sch.id',
      userName: currentUser?.displayName || 'Sistem SIM-KESISWAAN',
      userRole: currentUser?.role || 'admin',
      action,
      module,
      details,
      timestamp: new Date().toLocaleString('id-ID')
    };
    setAuditLogs(prev => [newLog, ...prev]);
    try {
      await setDoc(doc(db, 'audit_logs', newLog.id), newLog);
    } catch (e) {
      // Local fallback
    }
  };

  const setActiveAcademicYear = (year: string, semester: 'Ganjil' | 'Genap' = 'Ganjil') => {
    setActiveAcademicYearState(year);
    setActiveSemesterState(semester);
    setSchoolSetting(prev => ({ ...prev, currentAcademicYear: year, currentSemester: semester }));
    logAction('CHANGE_ACADEMIC_YEAR', 'Tahun Ajaran', `Mengubah periode aktif ke ${year} (${semester})`);
  };

  const updateSchoolSetting = async (data: Partial<SchoolSetting>) => {
    const targetId = data.id || schoolSetting.id || 'main_school';
    const updated: SchoolSetting = {
      ...schoolSetting,
      ...data,
      id: targetId,
      wakaName: data.wakaName || data.wakaKesiswaanName || schoolSetting.wakaName || schoolSetting.wakaKesiswaanName || '',
      wakaKesiswaanName: data.wakaKesiswaanName || data.wakaName || schoolSetting.wakaKesiswaanName || schoolSetting.wakaName || ''
    };
    setSchoolSetting(updated);
    try {
      localStorage.setItem('sim_school_setting', JSON.stringify(updated));
      await setDoc(doc(db, 'schools', targetId), updated, { merge: true });
    } catch (e) {
      console.warn('Firestore update school notice (saved locally):', e);
    }
    await logAction('UPDATE_SCHOOL_INFO', 'Pengaturan Sekolah', `Memperbarui profil dan identitas sekolah: ${updated.name}`);
  };

  // Student Operations
  const addStudent = async (data: Omit<Student, 'id' | 'createdAt'>) => {
    const newStudent: Student = {
      id: `s_${Date.now()}`,
      ...data,
      violationPoints: 0,
      achievementPoints: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setStudents(prev => [newStudent, ...prev]);
    try {
      await setDoc(doc(db, 'students', newStudent.id), newStudent);
    } catch (e) {}
    logAction('CREATE_STUDENT', 'Data Siswa', `Menambahkan data siswa baru: ${newStudent.fullName} (${newStudent.nis})`);
  };

  const updateStudent = async (id: string, data: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s));
    try {
      await updateDoc(doc(db, 'students', id), data);
    } catch (e) {}
    logAction('UPDATE_STUDENT', 'Data Siswa', `Memperbarui data siswa ID: ${id}`);
  };

  const deleteStudent = async (id: string) => {
    const target = students.find(s => s.id === id);
    setStudents(prev => prev.filter(s => s.id !== id));
    try {
      await deleteDoc(doc(db, 'students', id));
    } catch (e) {}
    logAction('DELETE_STUDENT', 'Data Siswa', `Menghapus data siswa: ${target?.fullName || id}`);
  };

  const importStudentsBulk = async (importedList: Omit<Student, 'id' | 'createdAt'>[]) => {
    const newStudents: Student[] = importedList.map((s, idx) => ({
      id: `s_imp_${Date.now()}_${idx}`,
      ...s,
      violationPoints: s.violationPoints || 0,
      achievementPoints: s.achievementPoints || 0,
      createdAt: new Date().toISOString().split('T')[0]
    }));
    setStudents(prev => [...newStudents, ...prev]);
    logAction('IMPORT_STUDENTS', 'Data Siswa', `Mengimpor ${newStudents.length} data siswa dari file Excel/CSV`);
    return newStudents.length;
  };

  // Teachers
  const addTeacher = async (data: Omit<Teacher, 'id'>) => {
    const newT: Teacher = {
      id: `t_${Date.now()}`,
      ...data
    };
    setTeachers(prev => [newT, ...prev]);
    logAction('ADD_TEACHER', 'Dewan Guru', `Menambahkan data guru: ${newT.fullName}`);
  };

  const updateTeacher = async (id: string, data: Partial<Teacher>) => {
    setTeachers(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  };

  const deleteTeacher = async (id: string) => {
    setTeachers(prev => prev.filter(t => t.id !== id));
  };

  // Extracurricular Operations
  const addExtracurricular = async (data: Omit<Extracurricular, 'id'>) => {
    const newEkskul: Extracurricular = {
      id: `ekskul_${Date.now()}`,
      ...data
    };
    setExtracurriculars(prev => [newEkskul, ...prev]);
    try {
      await setDoc(doc(db, 'extracurriculars', newEkskul.id), newEkskul);
    } catch (e) {}
    logAction('CREATE_EXTRACURRICULAR', 'Ekstrakurikuler', `Menambahkan ekstrakurikuler baru: ${newEkskul.name}`);
  };

  const updateExtracurricular = async (id: string, data: Partial<Extracurricular>) => {
    setExtracurriculars(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    try {
      await updateDoc(doc(db, 'extracurriculars', id), data);
    } catch (e) {}
    logAction('UPDATE_EXTRACURRICULAR', 'Ekstrakurikuler', `Memperbarui profil ekstrakurikuler ID: ${id}`);
  };

  const deleteExtracurricular = async (id: string) => {
    const target = extracurriculars.find(e => e.id === id);
    setExtracurriculars(prev => prev.filter(e => e.id !== id));
    try {
      await deleteDoc(doc(db, 'extracurriculars', id));
    } catch (e) {}
    logAction('DELETE_EXTRACURRICULAR', 'Ekstrakurikuler', `Menghapus ekstrakurikuler: ${target?.name || id}`);
  };

  // Member Operations
  const addMember = async (data: Omit<ExtracurricularMember, 'id'>) => {
    const newMember: ExtracurricularMember = {
      id: `m_${Date.now()}`,
      ...data
    };
    setMembers(prev => [newMember, ...prev]);
    // update count in ekskul
    setExtracurriculars(prev => prev.map(e => {
      if (e.id === data.extracurricularId) {
        return { ...e, memberCount: (e.memberCount || 0) + 1 };
      }
      return e;
    }));
    try {
      await setDoc(doc(db, 'extracurricular_members', newMember.id), newMember);
    } catch (e) {}
    logAction('ADD_MEMBER', 'Anggota Ekstrakurikuler', `Menambahkan anggota: ${data.studentName} ke ${data.extracurricularName || data.extracurricularId}`);
  };

  const removeMember = async (id: string) => {
    const target = members.find(m => m.id === id);
    setMembers(prev => prev.filter(m => m.id !== id));
    if (target) {
      setExtracurriculars(prev => prev.map(e => {
        if (e.id === target.extracurricularId) {
          return { ...e, memberCount: Math.max(0, (e.memberCount || 1) - 1) };
        }
        return e;
      }));
    }
    try {
      await deleteDoc(doc(db, 'extracurricular_members', id));
    } catch (e) {}
    logAction('REMOVE_MEMBER', 'Anggota Ekstrakurikuler', `Menghapus anggota: ${target?.studentName || id}`);
  };

  const updateMember = async (id: string, data: Partial<ExtracurricularMember>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
    try {
      await updateDoc(doc(db, 'extracurricular_members', id), data);
    } catch (e) {}
  };

  const updateMemberStatus = async (id: string, status: 'Aktif' | 'Nonaktif') => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    try {
      await updateDoc(doc(db, 'extracurricular_members', id), { status });
    } catch (e) {}
  };

  // Schedules & Conflict Prevention
  const addSchedule = async (data: Omit<ScheduleEvent, 'id'>) => {
    // Conflict detection: Same date, overlapping time, and same location OR same extracurricular
    const hasConflict = schedules.some(s => {
      if (s.date !== data.date || s.status === 'Dibatalkan') return false;
      const sStart = s.startTime;
      const sEnd = s.endTime;
      const dStart = data.startTime;
      const dEnd = data.endTime;
      const isOverlap = (dStart >= sStart && dStart < sEnd) || (dEnd > sStart && dEnd <= sEnd) || (dStart <= sStart && dEnd >= sEnd);
      
      if (isOverlap) {
        if (s.location.toLowerCase() === data.location.toLowerCase()) {
          return true;
        }
      }
      return false;
    });

    if (hasConflict) {
      return {
        success: false,
        conflict: 'Jadwal bentrok dengan kegiatan lain di lokasi dan jam yang sama! Silakan pilih jam atau lokasi lain.'
      };
    }

    const newEvent: ScheduleEvent = {
      id: `sch_${Date.now()}`,
      ...data
    };
    setSchedules(prev => [newEvent, ...prev]);
    try {
      await setDoc(doc(db, 'schedules', newEvent.id), newEvent);
    } catch (e) {}
    logAction('CREATE_SCHEDULE', 'Jadwal', `Membuat jadwal kegiatan: ${newEvent.title} pada ${newEvent.date}`);
    return { success: true };
  };

  const updateSchedule = async (id: string, data: Partial<ScheduleEvent>) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    try {
      await updateDoc(doc(db, 'schedules', id), data);
    } catch (e) {}
    return { success: true };
  };

  const deleteSchedule = async (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    try {
      await deleteDoc(doc(db, 'schedules', id));
    } catch (e) {}
  };

  // Attendance Session
  const saveAttendanceSession = async (data: Omit<AttendanceSession, 'id' | 'createdAt'>) => {
    const newSession: AttendanceSession = {
      id: `att_${Date.now()}`,
      ...data,
      createdAt: new Date().toLocaleString('id-ID')
    };
    setAttendance(prev => [newSession, ...prev]);
    try {
      await setDoc(doc(db, 'attendance', newSession.id), newSession);
    } catch (e) {}
    logAction('SUBMIT_ATTENDANCE', 'Presensi', `Menyimpan presensi ${data.extracurricularName} tanggal ${data.date} (Hadir: ${data.presentCount}/${data.totalMembers})`);
  };

  const deleteAttendanceRecord = async (id: string) => {
    setAttendance(prev => prev.filter(a => a.id !== id));
  };

  // Activity Operations
  const addActivity = async (data: Omit<SchoolActivity, 'id' | 'createdAt'>) => {
    const newAct: SchoolActivity = {
      id: `act_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setActivities(prev => [newAct, ...prev]);
    try {
      await setDoc(doc(db, 'activities', newAct.id), newAct);
    } catch (e) {}
    logAction('CREATE_ACTIVITY', 'Kegiatan Siswa', `Mendaftarkan agenda kegiatan: ${newAct.title}`);
  };

  const updateActivity = async (id: string, data: Partial<SchoolActivity>) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
    try {
      await updateDoc(doc(db, 'activities', id), data);
    } catch (e) {}
    logAction('UPDATE_ACTIVITY', 'Kegiatan Siswa', `Memperbarui status/data kegiatan ID: ${id}`);
  };

  const deleteActivity = async (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
    try {
      await deleteDoc(doc(db, 'activities', id));
    } catch (e) {}
  };

  // Reports
  const addReport = async (data: Omit<ActivityReport, 'id' | 'createdAt'>) => {
    const newRep: ActivityReport = {
      id: `rep_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setActivityReports(prev => [newRep, ...prev]);
    try {
      await setDoc(doc(db, 'activity_reports', newRep.id), newRep);
    } catch (e) {}
    logAction('CREATE_REPORT', 'Laporan Kegiatan', `Mengajukan laporan kegiatan: ${newRep.activityTitle}`);
  };

  const updateReport = async (id: string, data: Partial<ActivityReport>) => {
    setActivityReports(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    try {
      await updateDoc(doc(db, 'activity_reports', id), data);
    } catch (e) {}
  };

  const deleteActivityReport = async (id: string) => {
    setActivityReports(prev => prev.filter(r => r.id !== id));
    try {
      await deleteDoc(doc(db, 'activity_reports', id));
    } catch (e) {}
  };

  const reviewReport = async (id: string, status: 'Disetujui' | 'Revisi' | 'Ditolak', feedback?: string) => {
    setActivityReports(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status,
          feedback: feedback || r.feedback,
          approvedBy: currentUser?.displayName || 'Waka Kesiswaan',
          approvedAt: new Date().toISOString().split('T')[0]
        };
      }
      return r;
    }));
    try {
      await updateDoc(doc(db, 'activity_reports', id), {
        status,
        feedback,
        approvedBy: currentUser?.displayName || 'Waka Kesiswaan',
        approvedAt: new Date().toISOString().split('T')[0]
      });
    } catch (e) {}
    logAction('REVIEW_REPORT', 'Laporan Kegiatan', `Verifikasi laporan ID ${id} menjadi [${status}]`);
  };

  // Violations & Points
  const addViolation = async (data: Omit<StudentViolation, 'id' | 'createdAt'>) => {
    const newViol: StudentViolation = {
      id: `v_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setViolations(prev => [newViol, ...prev]);
    // Accumulate points to student
    setStudents(prev => prev.map(s => {
      if (s.id === data.studentId) {
        return { ...s, violationPoints: (s.violationPoints || 0) + (data.points || 0) };
      }
      return s;
    }));
    try {
      await setDoc(doc(db, 'violations', newViol.id), newViol);
    } catch (e) {}
    logAction('RECORD_VIOLATION', 'Pelanggaran Siswa', `Mencatat pelanggaran siswa: ${data.studentName} (+${data.points} poin)`);
  };

  const updateViolation = async (id: string, data: Partial<StudentViolation>) => {
    setViolations(prev => prev.map(v => v.id === id ? { ...v, ...data } : v));
    try {
      await updateDoc(doc(db, 'violations', id), data);
    } catch (e) {}
  };

  const deleteViolation = async (id: string) => {
    setViolations(prev => prev.filter(v => v.id !== id));
    try {
      await deleteDoc(doc(db, 'violations', id));
    } catch (e) {}
  };

  // Counseling
  const addCounseling = async (data: Omit<StudentCounseling, 'id' | 'createdAt'>) => {
    const newCs: StudentCounseling = {
      id: `cs_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setCounseling(prev => [newCs, ...prev]);
    try {
      await setDoc(doc(db, 'counseling', newCs.id), newCs);
    } catch (e) {}
    logAction('RECORD_COUNSELING', 'Pembinaan & BK', `Mencatat sesi pembinaan siswa: ${data.studentName}`);
  };

  const updateCounseling = async (id: string, data: Partial<StudentCounseling>) => {
    setCounseling(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    try {
      await updateDoc(doc(db, 'counseling', id), data);
    } catch (e) {}
  };

  const deleteCounselingSession = async (id: string) => {
    setCounseling(prev => prev.filter(c => c.id !== id));
  };

  // Achievements
  const addAchievement = async (data: Omit<StudentAchievement, 'id' | 'createdAt'>) => {
    const newAch: StudentAchievement = {
      id: `ach_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setAchievements(prev => [newAch, ...prev]);
    // add achievement points
    setStudents(prev => prev.map(s => {
      if (s.id === data.studentId) {
        return { ...s, achievementPoints: (s.achievementPoints || 0) + (data.pointsAwarded || 0) };
      }
      return s;
    }));
    try {
      await setDoc(doc(db, 'achievements', newAch.id), newAch);
    } catch (e) {}
    logAction('RECORD_ACHIEVEMENT', 'Prestasi Siswa', `Mencatat prestasi: ${data.title} oleh ${data.studentName}`);
  };

  const updateAchievement = async (id: string, data: Partial<StudentAchievement>) => {
    setAchievements(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
    try {
      await updateDoc(doc(db, 'achievements', id), data);
    } catch (e) {}
  };

  const deleteAchievement = async (id: string, _arg2?: any, _arg3?: any) => {
    setAchievements(prev => prev.filter(a => a.id !== id));
    try {
      await deleteDoc(doc(db, 'achievements', id));
    } catch (e) {}
  };

  // Permissions
  const addPermission = async (data: Omit<StudentPermission, 'id' | 'createdAt'>) => {
    const newPerm: StudentPermission = {
      id: `perm_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setPermissions(prev => [newPerm, ...prev]);
    try {
      await setDoc(doc(db, 'permissions', newPerm.id), newPerm);
    } catch (e) {}
    logAction('RECORD_PERMISSION', 'Perizinan Siswa', `Mengajukan perizinan siswa: ${data.studentName} (${data.type})`);
  };

  const updatePermission = async (id: string, data: Partial<StudentPermission>) => {
    setPermissions(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    try {
      await updateDoc(doc(db, 'permissions', id), data);
    } catch (e) {}
  };

  const deletePermission = async (id: string) => {
    setPermissions(prev => prev.filter(p => p.id !== id));
    try {
      await deleteDoc(doc(db, 'permissions', id));
    } catch (e) {}
  };

  const updatePermissionStatus = async (id: string, status: 'Menunggu' | 'Disetujui' | 'Ditolak' | 'Selesai') => {
    setPermissions(prev => prev.map(p => p.id === id ? { ...p, status, approvedBy: currentUser?.displayName } : p));
    try {
      await updateDoc(doc(db, 'permissions', id), { status, approvedBy: currentUser?.displayName });
    } catch (e) {}
  };

  // Needs Requests
  const addNeedsRequest = async (data: Omit<NeedsRequest, 'id' | 'createdAt'>) => {
    const newNeed: NeedsRequest = {
      id: `need_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setNeedsRequests(prev => [newNeed, ...prev]);
    try {
      await setDoc(doc(db, 'needs_requests', newNeed.id), newNeed);
    } catch (e) {}
    logAction('SUBMIT_NEEDS_REQUEST', 'Kebutuhan Ekstrakurikuler', `Mengajukan kebutuhan: ${data.itemName} (${data.extracurricularName})`);
  };

  const reviewNeedsRequest = async (id: string, status: 'Disetujui' | 'Ditolak' | 'Revisi', adminNotes?: string, approvedBudget?: number) => {
    setNeedsRequests(prev => prev.map(n => n.id === id ? { ...n, status, adminNotes, approvedBudget: approvedBudget ?? n.approvedBudget } : n));
    try {
      await updateDoc(doc(db, 'needs_requests', id), { status, adminNotes, approvedBudget });
    } catch (e) {}
    logAction('REVIEW_NEEDS_REQUEST', 'Kebutuhan Ekstrakurikuler', `Verifikasi kebutuhan ID ${id} menjadi [${status}]`);
  };

  // Announcements
  const addAnnouncement = async (data: Omit<Announcement, 'id' | 'createdAt'>) => {
    const newAnn: Announcement = {
      id: `ann_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    try {
      await setDoc(doc(db, 'announcements', newAnn.id), newAnn);
    } catch (e) {}
    logAction('CREATE_ANNOUNCEMENT', 'Pengumuman', `Membuat pengumuman: ${newAnn.title}`);
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // ==========================================
  // OSIM & INTRAKURIKULER HANDLERS
  // ==========================================

  // OSIM Members
  const addOsimMember = async (data: Omit<OsimMember, 'id' | 'createdAt'>) => {
    const newMember: OsimMember = {
      id: `osim_m_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setOsimMembers(prev => [newMember, ...prev]);
    try {
      await setDoc(doc(db, 'osim_members', newMember.id), newMember);
    } catch (e) {}
    logAction('ADD_OSIM_MEMBER', 'Intrakurikuler & OSIM', `Menambahkan pengurus OSIM: ${newMember.fullName} (${newMember.position})`);
  };

  const updateOsimMember = async (id: string, data: Partial<OsimMember>) => {
    setOsimMembers(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
    try {
      await updateDoc(doc(db, 'osim_members', id), data);
    } catch (e) {}
    logAction('UPDATE_OSIM_MEMBER', 'Intrakurikuler & OSIM', `Memperbarui data pengurus OSIM ID ${id}`);
  };

  const deleteOsimMember = async (id: string) => {
    setOsimMembers(prev => prev.filter(m => m.id !== id));
    try {
      await deleteDoc(doc(db, 'osim_members', id));
    } catch (e) {}
    logAction('DELETE_OSIM_MEMBER', 'Intrakurikuler & OSIM', `Menghapus data pengurus OSIM ID ${id}`);
  };

  // OSIM Work Programs
  const addOsimProgram = async (data: Omit<OsimWorkProgram, 'id' | 'createdAt'>) => {
    const newProg: OsimWorkProgram = {
      id: `proker_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setOsimPrograms(prev => [newProg, ...prev]);
    try {
      await setDoc(doc(db, 'osim_programs', newProg.id), newProg);
    } catch (e) {}
    logAction('ADD_OSIM_PROGRAM', 'Intrakurikuler & OSIM', `Membuat program kerja OSIM: ${newProg.title}`);
  };

  const updateOsimProgram = async (id: string, data: Partial<OsimWorkProgram>) => {
    setOsimPrograms(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    try {
      await updateDoc(doc(db, 'osim_programs', id), data);
    } catch (e) {}
    logAction('UPDATE_OSIM_PROGRAM', 'Intrakurikuler & OSIM', `Memperbarui program kerja OSIM: ${data.title || id}`);
  };

  const deleteOsimProgram = async (id: string) => {
    setOsimPrograms(prev => prev.filter(p => p.id !== id));
    try {
      await deleteDoc(doc(db, 'osim_programs', id));
    } catch (e) {}
    logAction('DELETE_OSIM_PROGRAM', 'Intrakurikuler & OSIM', `Menghapus program kerja OSIM ID ${id}`);
  };

  // OSIM Aspirations
  const addOsimAspiration = async (data: Omit<OsimAspiration, 'id' | 'createdAt'>) => {
    const newAsp: OsimAspiration = {
      id: `asp_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setOsimAspirations(prev => [newAsp, ...prev]);
    try {
      await setDoc(doc(db, 'osim_aspirations', newAsp.id), newAsp);
    } catch (e) {}
    logAction('ADD_OSIM_ASPIRATION', 'Intrakurikuler & OSIM', `Mengirim aspirasi siswa: ${newAsp.title}`);
  };

  const updateOsimAspiration = async (id: string, data: Partial<OsimAspiration>) => {
    setOsimAspirations(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
    try {
      await updateDoc(doc(db, 'osim_aspirations', id), data);
    } catch (e) {}
    logAction('UPDATE_OSIM_ASPIRATION', 'Intrakurikuler & OSIM', `Memperbarui respon aspirasi ID ${id}`);
  };

  const deleteOsimAspiration = async (id: string) => {
    setOsimAspirations(prev => prev.filter(a => a.id !== id));
    try {
      await deleteDoc(doc(db, 'osim_aspirations', id));
    } catch (e) {}
    logAction('DELETE_OSIM_ASPIRATION', 'Intrakurikuler & OSIM', `Menghapus aspirasi siswa ID ${id}`);
  };

  // OSIM Meetings
  const addOsimMeeting = async (data: Omit<OsimMeeting, 'id' | 'createdAt'>) => {
    const newMeet: OsimMeeting = {
      id: `meet_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setOsimMeetings(prev => [newMeet, ...prev]);
    try {
      await setDoc(doc(db, 'osim_meetings', newMeet.id), newMeet);
    } catch (e) {}
    logAction('ADD_OSIM_MEETING', 'Intrakurikuler & OSIM', `Mencatat notulensi rapat OSIM: ${newMeet.title}`);
  };

  const updateOsimMeeting = async (id: string, data: Partial<OsimMeeting>) => {
    setOsimMeetings(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
    try {
      await updateDoc(doc(db, 'osim_meetings', id), data);
    } catch (e) {}
    logAction('UPDATE_OSIM_MEETING', 'Intrakurikuler & OSIM', `Memperbarui notulensi rapat OSIM: ${data.title || id}`);
  };

  const deleteOsimMeeting = async (id: string) => {
    setOsimMeetings(prev => prev.filter(m => m.id !== id));
    try {
      await deleteDoc(doc(db, 'osim_meetings', id));
    } catch (e) {}
    logAction('DELETE_OSIM_MEETING', 'Intrakurikuler & OSIM', `Menghapus notulensi rapat OSIM ID ${id}`);
  };

  return (
    <SchoolContext.Provider
      value={{
        schoolSetting,
        schoolInfo: schoolSetting,
        updateSchoolSetting,
        updateSchoolInfo: updateSchoolSetting,
        academicYears,
        activeAcademicYear,
        activeSemester,
        setActiveAcademicYear,
        classes,
        teachers,
        students,
        extracurriculars,
        members,
        schedules,
        attendance,
        activities,
        activityReports,
        violations,
        counseling,
        achievements,
        permissions,
        needsRequests,
        announcements,
        notifications,
        auditLogs,
        osimMembers,
        osimPrograms,
        osimAspirations,
        osimMeetings,
        addStudent,
        updateStudent,
        deleteStudent,
        importStudentsBulk,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        addExtracurricular,
        updateExtracurricular,
        deleteExtracurricular,
        addMember,
        removeMember,
        deleteMember: removeMember,
        updateMember,
        updateMemberStatus,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        saveAttendanceSession,
        addAttendanceRecord: saveAttendanceSession,
        deleteAttendanceRecord,
        addActivity,
        updateActivity,
        deleteActivity,
        addReport,
        updateReport,
        addActivityReport: addReport,
        updateActivityReport: updateReport,
        deleteActivityReport,
        reviewReport,
        addViolation,
        updateViolation,
        deleteViolation,
        addCounseling,
        updateCounseling,
        addCounselingSession: addCounseling,
        updateCounselingSession: updateCounseling,
        deleteCounselingSession,
        addAchievement,
        updateAchievement,
        deleteAchievement,
        addPermission,
        updatePermission,
        deletePermission,
        updatePermissionStatus,
        addNeedsRequest,
        reviewNeedsRequest,
        addOsimMember,
        updateOsimMember,
        deleteOsimMember,
        addOsimProgram,
        updateOsimProgram,
        deleteOsimProgram,
        addOsimAspiration,
        updateOsimAspiration,
        deleteOsimAspiration,
        addOsimMeeting,
        updateOsimMeeting,
        deleteOsimMeeting,
        addAnnouncement,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        logAction,
        syncWithFirebase,
        seedFirebaseDatabase,
        isSyncing
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = (): SchoolContextType => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
};
