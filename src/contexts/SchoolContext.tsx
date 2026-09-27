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
  HomeVisitRecord,
  ParentCallLetter,
  CareerGuidanceRecord,
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
  OsimMeeting,
  OsimDepartment,
  CashAccount,
  CashTransaction,
  UserProfile,
  UserRole,
  SchoolRuleArticle,
  SchoolHandbookMeta
} from '../types';
import {
  INITIAL_SCHOOL_SETTING,
  INITIAL_ACADEMIC_YEARS,
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  INITIAL_TEACHERS,
  INITIAL_EXTRACURRICULARS,
  PURGED_DEMO_EKSKUL_IDS,
  isPurgedExtracurricular,
  isBlacklistedDemoName,
  INITIAL_MEMBERS,
  INITIAL_SCHEDULES,
  INITIAL_ATTENDANCE,
  INITIAL_ACTIVITIES,
  INITIAL_REPORTS,
  INITIAL_VIOLATIONS,
  INITIAL_COUNSELING,
  INITIAL_HOME_VISITS,
  INITIAL_PARENT_CALL_LETTERS,
  INITIAL_CAREER_GUIDANCES,
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
  INITIAL_OSIM_DEPARTMENTS,
  INITIAL_CASH_ACCOUNTS,
  INITIAL_CASH_TRANSACTIONS,
  INITIAL_SCHOOL_RULES,
  INITIAL_HANDBOOK_META,
  seedAllFirebaseData,
  clearAllFirebaseOperationalData,
  uploadAllStateToFirebase
} from '../services/seedData';
import { db } from '../services/firebase';
import { collection, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, addDoc, writeBatch, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { findMatchingClass, resolveStudentClass, isStudentInClass } from '../utils/classResolver';
import { normalizeTeacherCode, formatTeacherCode, formatStudentCode } from '../utils/idGenerator';
import { resolveStudent, resolveTeacher } from '../utils/relationResolvers';

import { extractSekbidNumber, isBphMember, normalizeSekbidName } from '../utils/osimAccountHelper';
import {
  addDeletedUid,
  removeDeletedUid,
  isDeletedUid,
  isTeacherUserMatch,
  isStudentUserMatch,
  isOsimMemberUserMatch,
  deduplicateTeachersList,
  deduplicateOsimMembersList,
  deduplicateStudentsList,
  getDeletedClassIds,
  addDeletedClassId,
  removeDeletedClassId,
  isDeletedClassId,
  isPurgedClassId,
  PURGED_DEMO_CLASS_IDS,
  getCanonicalBphPositionKey,
  cleanDigits,
  normalizeName
} from '../utils/syncUtils';

interface SchoolContextType {
  schoolSetting: SchoolSetting;
  schoolInfo: SchoolSetting;
  updateSchoolSetting: (data: Partial<SchoolSetting>) => Promise<void>;
  updateSchoolInfo: (data: Partial<SchoolSetting>) => Promise<void>;
  academicYears: AcademicYear[];
  activeAcademicYear: string;
  activeSemester: 'Ganjil' | 'Genap';
  setActiveAcademicYear: (year: string, semester?: 'Ganjil' | 'Genap') => void;
  addAcademicYear: (data: Omit<AcademicYear, 'id'> | AcademicYear) => Promise<void>;
  updateAcademicYear: (id: string, data: Partial<AcademicYear>) => Promise<void>;
  deleteAcademicYear: (id: string) => Promise<void>;
  promoteAcademicYear: (params: {
    targetAcademicYear: string;
    targetSemester?: 'Ganjil' | 'Genap';
    resetViolationPoints?: boolean;
    demisionerOsim?: boolean;
  }) => Promise<{ graduatedCount: number; promotedCount: number }>;
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
  clearAuditLogs: () => Promise<void>;
  refreshAuditLogs: () => Promise<void>;
  
  // Student operations
  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => Promise<Student>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  deleteStudentsBulk: (ids: string[]) => Promise<number>;
  importStudentsBulk: (students: Omit<Student, 'id' | 'createdAt'>[], mode?: 'append' | 'replace') => Promise<number>;
  clearAllStudents: () => Promise<void>;

  // Class / Rombel operations
  addClass: (data: Omit<SchoolClass, 'id'>) => Promise<void>;
  updateClass: (id: string, data: Partial<SchoolClass>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  deleteClassesBulk: (ids: string[]) => Promise<number>;
  clearAllClasses: () => Promise<void>;
  importClassesBulk: (classList: SchoolClass[], mode?: 'append' | 'replace') => Promise<number>;
  assignHomeroomTeacher: (classId: string, teacherName: string, teacherId?: string) => Promise<void>;

  // Teacher operations
  addTeacher: (data: Omit<Teacher, 'id'>) => Promise<void>;
  updateTeacher: (id: string, data: Partial<Teacher>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
  deleteTeachersBulk: (ids: string[]) => Promise<number>;
  clearAllTeachers: () => Promise<void>;
  importTeachersBulk: (teachers: Omit<Teacher, 'id'>[], mode?: 'append' | 'replace') => Promise<number>;

  // Extracurricular operations
  addExtracurricular: (data: Omit<Extracurricular, 'id'>) => Promise<void>;
  updateExtracurricular: (id: string, data: Partial<Extracurricular>) => Promise<void>;
  deleteExtracurricular: (id: string) => Promise<void>;

  // Member operations
  addMember: (data: Omit<ExtracurricularMember, 'id'>) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  deleteMembersBulk: (ids: string[]) => Promise<number>;
  updateMember: (id: string, data: Partial<ExtracurricularMember>) => Promise<void>;
  updateMemberStatus: (id: string, status: 'Aktif' | 'Nonaktif' | 'Cuti' | 'Keluar') => Promise<void>;
  updateMembersStatusBulk: (ids: string[], status: 'Aktif' | 'Cuti' | 'Keluar') => Promise<number>;

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
  reconcileAllStudentPoints: () => Promise<{ updatedCount: number }>;

  homeVisits: HomeVisitRecord[];
  parentCallLetters: ParentCallLetter[];
  careerGuidances: CareerGuidanceRecord[];

  addCounseling: (data: Omit<StudentCounseling, 'id' | 'createdAt'>) => Promise<void>;
  updateCounseling: (id: string, data: Partial<StudentCounseling>) => Promise<void>;
  addCounselingSession: (data: Omit<StudentCounseling, 'id' | 'createdAt'>) => Promise<void>;
  updateCounselingSession: (id: string, data: Partial<StudentCounseling>) => Promise<void>;
  deleteCounselingSession: (id: string) => Promise<void>;

  addHomeVisit: (data: Omit<HomeVisitRecord, 'id' | 'createdAt'>) => Promise<void>;
  updateHomeVisit: (id: string, data: Partial<HomeVisitRecord>) => Promise<void>;
  deleteHomeVisit: (id: string) => Promise<void>;

  addParentCallLetter: (data: Omit<ParentCallLetter, 'id' | 'createdAt'>) => Promise<void>;
  updateParentCallLetter: (id: string, data: Partial<ParentCallLetter>) => Promise<void>;
  deleteParentCallLetter: (id: string) => Promise<void>;

  addCareerGuidance: (data: Omit<CareerGuidanceRecord, 'id' | 'createdAt'>) => Promise<void>;
  updateCareerGuidance: (id: string, data: Partial<CareerGuidanceRecord>) => Promise<void>;
  deleteCareerGuidance: (id: string) => Promise<void>;

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
  deleteNeedsRequest: (id: string) => Promise<void>;

  // OSIM & Intrakurikuler Operations
  osimMembers: OsimMember[];
  osimPrograms: OsimWorkProgram[];
  osimAspirations: OsimAspiration[];
  osimMeetings: OsimMeeting[];
  osimDepartments: OsimDepartment[];
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
  addOsimDepartment: (data: Omit<OsimDepartment, 'id' | 'createdAt'>) => Promise<void>;
  updateOsimDepartment: (id: string, data: Partial<OsimDepartment>) => Promise<void>;
  deleteOsimDepartment: (id: string) => Promise<void>;
  resetOsimDepartmentsToDefault: () => Promise<void>;
  reconcileOsimMembersWithMasterStudents: () => Promise<number>;

  // Neraca Kas & Transparansi Keuangan Kesiswaan
  cashAccounts: CashAccount[];
  cashTransactions: CashTransaction[];
  addCashAccount: (data: Omit<CashAccount, 'id' | 'createdAt'>) => Promise<void>;
  updateCashAccount: (id: string, data: Partial<CashAccount>) => Promise<void>;
  deleteCashAccount: (id: string) => Promise<void>;
  assignCashManager: (accountId: string, userIds: string[], userNames?: string[]) => Promise<void>;
  addCashTransaction: (data: Omit<CashTransaction, 'id' | 'createdAt'>) => Promise<void>;
  updateCashTransaction: (id: string, data: Partial<CashTransaction>) => Promise<void>;
  deleteCashTransaction: (id: string) => Promise<void>;

  // Buku Tata Tertib & Pedoman Disiplin Siswa
  schoolRules: SchoolRuleArticle[];
  handbookMeta: SchoolHandbookMeta;
  addSchoolRule: (data: Omit<SchoolRuleArticle, 'id'>) => Promise<void>;
  updateSchoolRule: (id: string, data: Partial<SchoolRuleArticle>) => Promise<void>;
  deleteSchoolRule: (id: string) => Promise<void>;
  resetSchoolRulesToDefault: () => Promise<void>;
  updateHandbookMeta: (meta: Partial<SchoolHandbookMeta>) => Promise<void>;

  // Announcements & Notifications
  addAnnouncement: (data: Omit<Announcement, 'id' | 'createdAt'>) => Promise<void>;
  updateAnnouncement: (id: string, data: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  toggleAnnouncementPin: (id: string) => Promise<void>;
  toggleAnnouncementStatus: (id: string) => Promise<void>;
  markAnnouncementAsRead: (id: string, uid?: string) => Promise<void>;
  markAllAnnouncementsAsReadForUser: (ids: string[], uid?: string) => Promise<void>;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (item: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>) => void;

  // cPanel Cross-Module Synchronization
  syncUserFromCPanel: (user: UserProfile, oldUser?: UserProfile) => Promise<void>;
  syncDeleteUserFromCPanel: (uid: string, user?: UserProfile) => Promise<void>;
  syncAllCPanelUsers: (users: UserProfile[]) => Promise<void>;

  // Logging, Full Data Management & Database Reset / Seed
  logAction: (action: string, module: string, details: string) => Promise<void>;
  syncWithFirebase: () => Promise<void>;
  uploadAllDataToFirestore: () => Promise<{ success: boolean; message: string; count: number }>;
  seedFirebaseDatabase: () => Promise<{ success: boolean; message: string }>;
  clearAllOperationalData: () => Promise<{ success: boolean; message: string }>;
  exportFullDatabaseJSON: () => void;
  importFullDatabaseJSON: (bundle: any) => Promise<{ success: boolean; message: string }>;
  isSyncing: boolean;
  isRealTimeConnected: boolean;
  syncLocalChangesToFirestore: () => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

// Helper to ensure students are always sorted alphabetically by name
export const sortStudentsAlphabetically = <T extends { fullName?: string; studentName?: string; name?: string }>(list: T[]): T[] => {
  return [...list].sort((a, b) => {
    const nameA = a.fullName || a.studentName || a.name || '';
    const nameB = b.fullName || b.studentName || b.name || '';
    return nameA.localeCompare(nameB, 'id', { sensitivity: 'base' });
  });
};

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, syncUsersFromTeachers, syncUsersFromOsim, deleteUser, allUsers } = useAuth();
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isRealTimeConnected, setIsRealTimeConnected] = useState<boolean>(true);

  // States initialized with clean defaults and synced with localStorage / Firestore
  const [schoolSetting, setSchoolSetting] = useState<SchoolSetting>(() => {
    const saved = localStorage.getItem('sim_school_setting');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_SCHOOL_SETTING,
          ...parsed,
          name: parsed.name?.trim() || INITIAL_SCHOOL_SETTING.name,
          address: parsed.address?.trim() || INITIAL_SCHOOL_SETTING.address,
          centralInstitution: parsed.centralInstitution?.trim() || INITIAL_SCHOOL_SETTING.centralInstitution,
          regionalInstitution: parsed.regionalInstitution?.trim() || INITIAL_SCHOOL_SETTING.regionalInstitution,
          defaultCity: parsed.defaultCity?.trim() || INITIAL_SCHOOL_SETTING.defaultCity || 'Bula',
          principalName: parsed.principalName?.trim() || INITIAL_SCHOOL_SETTING.principalName,
          principalNip: parsed.principalNip?.trim() || INITIAL_SCHOOL_SETTING.principalNip,
          wakaName: parsed.wakaName?.trim() || parsed.wakaKesiswaanName?.trim() || INITIAL_SCHOOL_SETTING.wakaName,
          wakaKesiswaanName: parsed.wakaKesiswaanName?.trim() || parsed.wakaName?.trim() || INITIAL_SCHOOL_SETTING.wakaKesiswaanName,
          wakaNip: parsed.wakaNip?.trim() || INITIAL_SCHOOL_SETTING.wakaNip,
          pembinaOsim: parsed.pembinaOsim?.trim() || INITIAL_SCHOOL_SETTING.pembinaOsim || 'Puput Eka Bajuri, S. Pd., M. Or',
          pembinaOsimNip: parsed.pembinaOsimNip?.trim() || INITIAL_SCHOOL_SETTING.pembinaOsimNip || '198810052020121003',
          phone: parsed.phone?.trim() || INITIAL_SCHOOL_SETTING.phone,
          email: parsed.email?.trim() || INITIAL_SCHOOL_SETTING.email,
          website: parsed.website?.trim() || INITIAL_SCHOOL_SETTING.website,
          logoLeftUrl: parsed.logoLeftUrl || parsed.logoUrl || INITIAL_SCHOOL_SETTING.logoLeftUrl || '',
          logoRightUrl: parsed.logoRightUrl || INITIAL_SCHOOL_SETTING.logoRightUrl || '',
          defaultSignaturesConfig: parsed.defaultSignaturesConfig || INITIAL_SCHOOL_SETTING.defaultSignaturesConfig,
          isSignatureLocked: parsed.isSignatureLocked ?? parsed.defaultSignaturesConfig?.isLockedByUser ?? false,
          signatureLockedAt: parsed.signatureLockedAt || parsed.defaultSignaturesConfig?.lockedAt,
          signatureLockedBy: parsed.signatureLockedBy || parsed.defaultSignaturesConfig?.lockedBy
        };
      } catch (e) {}
    }
    return INITIAL_SCHOOL_SETTING;
  });

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(() => {
    const saved = localStorage.getItem('sim_academic_years');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_ACADEMIC_YEARS;
  });

  const [activeAcademicYear, setActiveAcademicYearState] = useState<string>(() => {
    const saved = localStorage.getItem('sim_school_setting');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.currentAcademicYear) return parsed.currentAcademicYear;
      } catch (e) {}
    }
    return '2026/2027';
  });

  const [activeSemester, setActiveSemesterState] = useState<'Ganjil' | 'Genap'>(() => {
    const saved = localStorage.getItem('sim_school_setting');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.currentSemester) return parsed.currentSemester;
      } catch (e) {}
    }
    return 'Ganjil';
  });

  const [classes, setClasses] = useState<SchoolClass[]>(() => {
    // Proactively register all purged dummy class IDs to tombstone
    PURGED_DEMO_CLASS_IDS.forEach(id => addDeletedClassId(id));

    const saved = localStorage.getItem('sim_classes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(c => c && c.id && !isDeletedClassId(c.id) && !isPurgedClassId(c.id) && !isPurgedClassId(c.name));
          if (filtered.length !== parsed.length) {
            try {
              localStorage.setItem('sim_classes', JSON.stringify(filtered));
            } catch (e) {}
            parsed.forEach(c => {
              if (c && (isPurgedClassId(c.id) || isPurgedClassId(c.name))) {
                addDeletedClassId(c.id);
                if (c.name) addDeletedClassId(c.name);
              }
            });
          }
          return filtered;
        }
      } catch (e) {}
    }
    return (INITIAL_CLASSES || []).filter(c => c && c.id && !isDeletedClassId(c.id) && !isPurgedClassId(c.id) && !isPurgedClassId(c.name));
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const defaultPitria: Teacher = {
      id: 'teacher_pitria_lawenusa',
      nip: '199005122020122008',
      fullName: 'Pitria Lawenusa, S. Pd',
      role: 'Guru BK',
      subject: 'Bimbingan Konseling (BK)',
      phone: '081234567890',
      email: 'pitria.lawenusa@madrasah.sch.id',
      assignedExtracurriculars: [],
      isActive: true
    };

    const saved = localStorage.getItem('sim_teachers');
    if (saved) {
      try {
        const parsed: Teacher[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(t => 
            !isBlacklistedDemoName(t.fullName || (t as any).name) &&
            !isDeletedUid(t.id) &&
            !isDeletedUid(cleanDigits(t.nip))
          );
          const hasPitria = filtered.some(t =>
            (t.fullName || '').toLowerCase().includes('pitria') ||
            (t.fullName || '').toLowerCase().includes('lawenusa')
          );
          if (!hasPitria && !isDeletedUid('teacher_pitria_lawenusa') && !isDeletedUid('user_guru_bk')) {
            filtered.unshift(defaultPitria);
          }
          return deduplicateTeachersList(filtered);
        }
      } catch (e) {}
    }
    const fromInitial = (INITIAL_TEACHERS || []).filter(t => 
      !isBlacklistedDemoName(t.fullName || (t as any).name) &&
      !isDeletedUid(t.id) &&
      !isDeletedUid(cleanDigits(t.nip))
    );
    if (!fromInitial.some(t => (t.fullName || '').toLowerCase().includes('pitria') || (t.fullName || '').toLowerCase().includes('lawenusa'))) {
      if (!isDeletedUid('teacher_pitria_lawenusa') && !isDeletedUid('user_guru_bk')) {
        fromInitial.unshift(defaultPitria);
      }
    }
    return deduplicateTeachersList(fromInitial);
  });
  
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('sim_students');
    if (saved) {
      try {
        const parsed: Student[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const { deduplicated } = deduplicateStudentsList(parsed);
          return sortStudentsAlphabetically(deduplicated);
        }
      } catch (e) {}
    }
    const { deduplicated } = deduplicateStudentsList(INITIAL_STUDENTS || []);
    return sortStudentsAlphabetically(deduplicated);
  });

  const [extracurriculars, setExtracurriculars] = useState<Extracurricular[]>(() => {
    const saved = localStorage.getItem('sim_extracurriculars');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out default bawaan seed extracurriculars and fotografi/sinematografi
          const userOnly = parsed.filter(
            (e: any) => !isPurgedExtracurricular(e.name) && !isPurgedExtracurricular(e.id)
          );
          if (userOnly.length !== parsed.length) {
            try {
              localStorage.setItem('sim_extracurriculars', JSON.stringify(userOnly));
            } catch (e) {}
          }
          return userOnly;
        }
      } catch (e) {}
    }
    return INITIAL_EXTRACURRICULARS;
  });

  const [members, setMembers] = useState<ExtracurricularMember[]>(() => {
    const saved = localStorage.getItem('sim_members');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const userOnly = parsed.filter(
            (m: any) =>
              m.id !== 'm1' &&
              m.studentNis !== '24251001' &&
              !isPurgedExtracurricular(m.extracurricularId) &&
              !isPurgedExtracurricular(m.extracurricularName || '')
          );
          return userOnly;
        }
      } catch (e) {}
    }
    return INITIAL_MEMBERS;
  });

  const [schedules, setSchedules] = useState<ScheduleEvent[]>(() => {
    const saved = localStorage.getItem('sim_schedules');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const userOnly = parsed.filter(
            (s: any) =>
              s.id !== 'sch_1' &&
              !isPurgedExtracurricular(s.extracurricularId) &&
              !isPurgedExtracurricular(s.title || '')
          );
          return userOnly;
        }
      } catch (e) {}
    }
    return INITIAL_SCHEDULES;
  });

  const [attendance, setAttendance] = useState<AttendanceSession[]>(() => {
    const saved = localStorage.getItem('sim_attendance');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const userOnly = parsed.filter(
            (a: any) =>
              a.id !== 'att_1' &&
              !isPurgedExtracurricular(a.extracurricularId) &&
              !isPurgedExtracurricular(a.extracurricularName || '')
          );
          return userOnly;
        }
      } catch (e) {}
    }
    return INITIAL_ATTENDANCE;
  });

  const [activities, setActivities] = useState<SchoolActivity[]>(() => {
    const saved = localStorage.getItem('sim_activities');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((a: any) => a.id === 'act_1')) {
          return [];
        }
        return parsed;
      } catch (e) {}
    }
    return INITIAL_ACTIVITIES;
  });

  const [activityReports, setActivityReports] = useState<ActivityReport[]>(() => {
    const saved = localStorage.getItem('sim_reports');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((r: any) => r.id === 'rep_1')) {
          return [];
        }
        return parsed;
      } catch (e) {}
    }
    return INITIAL_REPORTS;
  });

  const [violations, setViolations] = useState<StudentViolation[]>(() => {
    const saved = localStorage.getItem('sim_violations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((v: any) => v.id === 'v1' || v.studentId === 's09')) {
          return [];
        }
        return parsed;
      } catch (e) {}
    }
    return INITIAL_VIOLATIONS;
  });

  const [counseling, setCounseling] = useState<StudentCounseling[]>(() => {
    const saved = localStorage.getItem('sim_counseling');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((c: any) => c.id === 'c1' || c.studentId === 's03')) {
          return [];
        }
        return parsed;
      } catch (e) {}
    }
    return INITIAL_COUNSELING;
  });

  const [homeVisits, setHomeVisits] = useState<HomeVisitRecord[]>(() => {
    const saved = localStorage.getItem('sim_home_visits');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((h: any) => h.id === 'hv1')) {
          return [];
        }
        return parsed;
      } catch (e) {}
    }
    return INITIAL_HOME_VISITS;
  });

  const [parentCallLetters, setParentCallLetters] = useState<ParentCallLetter[]>(() => {
    const saved = localStorage.getItem('sim_parent_call_letters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((p: any) => p.id === 'sp1')) {
          return [];
        }
        return parsed;
      } catch (e) {}
    }
    return INITIAL_PARENT_CALL_LETTERS;
  });

  const [careerGuidances, setCareerGuidances] = useState<CareerGuidanceRecord[]>(() => {
    const saved = localStorage.getItem('sim_career_guidances');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((cg: any) => cg.id === 'cg1')) {
          return [];
        }
        return parsed;
      } catch (e) {}
    }
    return INITIAL_CAREER_GUIDANCES;
  });

  const [achievements, setAchievements] = useState<StudentAchievement[]>(() => {
    const saved = localStorage.getItem('sim_achievements');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((ach: any) => ach.id === 'ach_1')) {
          return [];
        }
        return parsed;
      } catch (e) {}
    }
    return INITIAL_ACHIEVEMENTS;
  });

  const [permissions, setPermissions] = useState<StudentPermission[]>(() => {
    const saved = localStorage.getItem('sim_permissions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((p: any) => p.id === 'perm_1')) {
          return [];
        }
        return parsed;
      } catch (e) {}
    }
    return INITIAL_PERMISSIONS;
  });

  const [needsRequests, setNeedsRequests] = useState<NeedsRequest[]>(() => {
    const saved = localStorage.getItem('sim_needs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((n: any) => n.id === 'need_1')) {
          return [];
        }
        return parsed;
      } catch (e) {}
    }
    return INITIAL_NEEDS_REQUESTS;
  });

  const [osimMembers, setOsimMembers] = useState<OsimMember[]>(() => {
    const saved = localStorage.getItem('sim_osim_members');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((o: any) => o.id !== 'om1' && !o.isDeleted);
        }
      } catch (e) {}
    }
    return (INITIAL_OSIM_MEMBERS || []).filter((o: any) => o.id !== 'om1' && !o.isDeleted);
  });

  const [osimPrograms, setOsimPrograms] = useState<OsimWorkProgram[]>(() => {
    const saved = localStorage.getItem('sim_osim_programs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((op: any) => op.id === 'op1')) {
          return [];
        }
        return parsed;
      } catch (e) {}
    }
    return INITIAL_OSIM_PROGRAMS;
  });

  const [osimAspirations, setOsimAspirations] = useState<OsimAspiration[]>(() => {
    const saved = localStorage.getItem('sim_osim_aspirations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((oa: any) => oa.id === 'oa1')) {
          return [];
        }
        return parsed;
      } catch (e) {}
    }
    return INITIAL_OSIM_ASPIRATIONS;
  });

  const [osimMeetings, setOsimMeetings] = useState<OsimMeeting[]>(() => {
    const saved = localStorage.getItem('sim_osim_meetings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((om: any) => om.id === 'ome1')) {
          return [];
        }
        return parsed;
      } catch (e) {}
    }
    return INITIAL_OSIM_MEETINGS;
  });

  const [osimDepartments, setOsimDepartments] = useState<OsimDepartment[]>(() => {
    const saved = localStorage.getItem('sim_osim_departments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_OSIM_DEPARTMENTS;
  });

  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>(() => {
    const saved = localStorage.getItem('sim_cash_accounts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_CASH_ACCOUNTS;
  });

  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(() => {
    const saved = localStorage.getItem('sim_cash_transactions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_CASH_TRANSACTIONS;
  });

  const [schoolRules, setSchoolRules] = useState<SchoolRuleArticle[]>(() => {
    const saved = localStorage.getItem('sim_school_rules');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (parsed.some((r: any) => r.code?.startsWith('KH-'))) {
            return parsed;
          }
        }
      } catch (e) {}
    }
    return INITIAL_SCHOOL_RULES;
  });

  const [handbookMeta, setHandbookMeta] = useState<SchoolHandbookMeta>(() => {
    const saved = localStorage.getItem('sim_handbook_meta');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.decreeNumber === 'B-380/Ma.26.02/PP.00.6/09/2026') {
          return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_HANDBOOK_META;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const local = localStorage.getItem('sim_announcements');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_ANNOUNCEMENTS;
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    const local = localStorage.getItem('sim_audit_logs');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return INITIAL_AUDIT_LOGS;
  });

  // Persistence to local state
  useEffect(() => {
    localStorage.setItem('sim_school_setting', JSON.stringify(schoolSetting));
    localStorage.setItem('sim_academic_years', JSON.stringify(academicYears));
    localStorage.setItem('sim_classes', JSON.stringify(classes));
    localStorage.setItem('sim_teachers', JSON.stringify(teachers));
    localStorage.setItem('sim_students', JSON.stringify(students));
    localStorage.setItem('sim_extracurriculars', JSON.stringify(extracurriculars));
    localStorage.setItem('sim_members', JSON.stringify(members));
    localStorage.setItem('sim_schedules', JSON.stringify(schedules));
    localStorage.setItem('sim_attendance', JSON.stringify(attendance));
    localStorage.setItem('sim_activities', JSON.stringify(activities));
    localStorage.setItem('sim_reports', JSON.stringify(activityReports));
    localStorage.setItem('sim_violations', JSON.stringify(violations));
    localStorage.setItem('sim_counseling', JSON.stringify(counseling));
    localStorage.setItem('sim_home_visits', JSON.stringify(homeVisits));
    localStorage.setItem('sim_parent_call_letters', JSON.stringify(parentCallLetters));
    localStorage.setItem('sim_career_guidances', JSON.stringify(careerGuidances));
    localStorage.setItem('sim_achievements', JSON.stringify(achievements));
    localStorage.setItem('sim_permissions', JSON.stringify(permissions));
    localStorage.setItem('sim_needs', JSON.stringify(needsRequests));
    localStorage.setItem('sim_osim_members', JSON.stringify(osimMembers));
    localStorage.setItem('sim_osim_programs', JSON.stringify(osimPrograms));
    localStorage.setItem('sim_osim_aspirations', JSON.stringify(osimAspirations));
    localStorage.setItem('sim_osim_meetings', JSON.stringify(osimMeetings));
    localStorage.setItem('sim_osim_departments', JSON.stringify(osimDepartments));
    localStorage.setItem('sim_cash_accounts', JSON.stringify(cashAccounts));
    localStorage.setItem('sim_cash_transactions', JSON.stringify(cashTransactions));
    localStorage.setItem('sim_school_rules', JSON.stringify(schoolRules));
    localStorage.setItem('sim_handbook_meta', JSON.stringify(handbookMeta));
    localStorage.setItem('sim_announcements', JSON.stringify(announcements));
    localStorage.setItem('sim_audit_logs', JSON.stringify(auditLogs));
  }, [
    schoolSetting,
    academicYears,
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
    homeVisits,
    parentCallLetters,
    careerGuidances,
    achievements,
    permissions,
    needsRequests,
    osimMembers,
    osimPrograms,
    osimAspirations,
    osimMeetings,
    osimDepartments,
    cashAccounts,
    cashTransactions,
    announcements,
    auditLogs
  ]);

  // Resilient automatic reconciliation between students and classes
  useEffect(() => {
    if (!classes || classes.length === 0 || !students || students.length === 0) return;

    let hasChanges = false;
    const reconciled = students.map(s => {
      const matched = resolveStudentClass(s, classes);
      if (matched) {
        if (s.classId !== matched.id || s.className !== matched.name) {
          hasChanges = true;
          return {
            ...s,
            classId: matched.id,
            className: matched.name,
            major: s.major || matched.major
          };
        }
      }
      return s;
    });

    if (hasChanges) {
      setStudents(reconciled);
      try {
        localStorage.setItem('sim_students', JSON.stringify(reconciled));
      } catch (e) {}
    }
  }, [classes, students.length]);

  // Automatic purge of legacy default seed extracurriculars and fotografi/sinematografi from local state and Firestore
  useEffect(() => {
    setExtracurriculars(prev => {
      const filtered = prev.filter(e => !isPurgedExtracurricular(e.name) && !isPurgedExtracurricular(e.id));
      if (filtered.length !== prev.length) {
        try {
          localStorage.setItem('sim_extracurriculars', JSON.stringify(filtered));
        } catch (e) {}
        // Also delete removed documents from Firestore
        const removed = prev.filter(e => isPurgedExtracurricular(e.name) || isPurgedExtracurricular(e.id));
        removed.forEach(e => {
          deleteDoc(doc(db, 'extracurriculars', e.id)).catch(() => {});
        });
        return filtered;
      }
      return prev;
    });

    try {
      PURGED_DEMO_EKSKUL_IDS.forEach(id => {
        deleteDoc(doc(db, 'extracurriculars', id)).catch(() => {});
      });
    } catch (e) {}
  }, []);

  // Automatic purge of legacy dummy classes (e.g., c_x_rpl1, dummy classes) from local state and Firestore
  useEffect(() => {
    setClasses(prev => {
      const filtered = prev.filter(c => !isPurgedClassId(c.id) && !isDeletedClassId(c.id));
      if (filtered.length !== prev.length) {
        try {
          localStorage.setItem('sim_classes', JSON.stringify(filtered));
        } catch (e) {}
        const removed = prev.filter(c => isPurgedClassId(c.id) || isDeletedClassId(c.id));
        removed.forEach(c => {
          addDeletedClassId(c.id);
          deleteDoc(doc(db, 'classes', c.id)).catch(() => {});
        });
        return filtered;
      }
      return prev;
    });

    try {
      PURGED_DEMO_CLASS_IDS.forEach(id => {
        deleteDoc(doc(db, 'classes', id)).catch(() => {});
      });
    } catch (e) {}
  }, []);

  // Sync with Firestore if collections exist with timeout resilience
  const syncWithFirebase = async () => {
    setIsSyncing(true);
    try {
      // Execute sync with a graceful 3.5-second timeout so offline mode works instantly
      const syncPromise = (async () => {
        // School Settings Sync
        const schoolSnap = await getDocs(collection(db, 'schools'));
        const isDbInitialized = !schoolSnap.empty;

        if (isDbInitialized) {
          const mainDoc = schoolSnap.docs.find(d => d.id === 'main_school') || schoolSnap.docs[0];
          const loadedSchool = mainDoc.data() as SchoolSetting;
          if (loadedSchool && (loadedSchool.name || loadedSchool.address)) {
            setSchoolSetting(prev => {
              const merged: SchoolSetting = {
                ...INITIAL_SCHOOL_SETTING,
                ...prev,
                ...loadedSchool,
                name: loadedSchool.name?.trim() || prev.name || INITIAL_SCHOOL_SETTING.name,
                address: loadedSchool.address?.trim() || prev.address || INITIAL_SCHOOL_SETTING.address,
                defaultCity: loadedSchool.defaultCity?.trim() || prev.defaultCity || 'Bula',
                principalName: loadedSchool.principalName?.trim() || prev.principalName || INITIAL_SCHOOL_SETTING.principalName,
                principalNip: loadedSchool.principalNip?.trim() || prev.principalNip || INITIAL_SCHOOL_SETTING.principalNip,
                wakaName: loadedSchool.wakaName?.trim() || loadedSchool.wakaKesiswaanName?.trim() || prev.wakaName || INITIAL_SCHOOL_SETTING.wakaName,
                wakaKesiswaanName: loadedSchool.wakaKesiswaanName?.trim() || loadedSchool.wakaName?.trim() || prev.wakaKesiswaanName || INITIAL_SCHOOL_SETTING.wakaKesiswaanName,
                wakaNip: loadedSchool.wakaNip?.trim() || prev.wakaNip || INITIAL_SCHOOL_SETTING.wakaNip,
                pembinaOsim: loadedSchool.pembinaOsim?.trim() || prev.pembinaOsim || INITIAL_SCHOOL_SETTING.pembinaOsim || 'Puput Eka Bajuri, S. Pd., M. Or',
                pembinaOsimNip: loadedSchool.pembinaOsimNip?.trim() || prev.pembinaOsimNip || INITIAL_SCHOOL_SETTING.pembinaOsimNip || '198810052020121003',
                phone: loadedSchool.phone?.trim() || prev.phone || INITIAL_SCHOOL_SETTING.phone,
                email: loadedSchool.email?.trim() || prev.email || INITIAL_SCHOOL_SETTING.email,
                website: loadedSchool.website?.trim() || prev.website || INITIAL_SCHOOL_SETTING.website,
                logoLeftUrl: loadedSchool.logoLeftUrl || prev.logoLeftUrl || '',
                logoRightUrl: loadedSchool.logoRightUrl || prev.logoRightUrl || '',
                defaultSignaturesConfig: loadedSchool.defaultSignaturesConfig || prev.defaultSignaturesConfig || INITIAL_SCHOOL_SETTING.defaultSignaturesConfig,
                isSignatureLocked: loadedSchool.isSignatureLocked ?? loadedSchool.defaultSignaturesConfig?.isLockedByUser ?? prev.isSignatureLocked ?? false,
                signatureLockedAt: loadedSchool.signatureLockedAt || loadedSchool.defaultSignaturesConfig?.lockedAt || prev.signatureLockedAt,
                signatureLockedBy: loadedSchool.signatureLockedBy || loadedSchool.defaultSignaturesConfig?.lockedBy || prev.signatureLockedBy
              };
              try {
                localStorage.setItem('sim_school_setting', JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
            if (loadedSchool.currentAcademicYear) {
              setActiveAcademicYearState(loadedSchool.currentAcademicYear);
            }
            if (loadedSchool.currentSemester) {
              setActiveSemesterState(loadedSchool.currentSemester);
            }
          }
          const classSnap = await getDocs(collection(db, 'classes'));
          const loadedClasses: SchoolClass[] = [];
          const deletedClassSet = getDeletedClassIds();
          classSnap.forEach(docSnap => {
            const id = docSnap.id;
            const data = docSnap.data() as SchoolClass;
            if (deletedClassSet.has(id) || isPurgedClassId(id) || isPurgedClassId(data?.name)) {
              deleteDoc(docSnap.ref).catch(() => {});
              return;
            }
            loadedClasses.push({ id, ...data });
          });
          setClasses(loadedClasses);
          try {
            localStorage.setItem('sim_classes', JSON.stringify(loadedClasses));
          } catch (e) {}

          // Students Sync
          const studentSnap = await getDocs(collection(db, 'students'));
          const rawStudents: Student[] = [];
          studentSnap.forEach(doc => {
            const data = doc.data() as Student;
            const id = doc.id;
            if (data.isDeleted) {
              // Deleted soft-state, skip
              return;
            }
            // Safely clear any accidental blacklist on real active students
            removeDeletedUid(id);
            if (data.nis) removeDeletedUid(cleanDigits(data.nis));
            rawStudents.push({ id, ...data });
          });
          const { deduplicated: cleanStudents, duplicateIds } = deduplicateStudentsList(rawStudents);
          const sortedStudents = sortStudentsAlphabetically(cleanStudents);
          setStudents(sortedStudents);
          try {
            localStorage.setItem('sim_students', JSON.stringify(sortedStudents));
          } catch (e) {}

          if (duplicateIds.length > 0) {
            duplicateIds.forEach(dupId => {
              deleteDoc(doc(db, 'students', dupId)).catch(() => {});
            });
          }

          // Teachers Sync
          const teacherSnap = await getDocs(collection(db, 'teachers'));
          const rawLoadedTeachers: Teacher[] = [];
          teacherSnap.forEach(docSnap => {
            const data = docSnap.data() as Teacher;
            const id = docSnap.id;
            if (
              isBlacklistedDemoName(data.fullName || (data as any).name) ||
              isDeletedUid(id) ||
              isDeletedUid(cleanDigits(data.nip))
            ) {
              deleteDoc(docSnap.ref).catch(() => {});
            } else {
              rawLoadedTeachers.push({ id, ...data });
            }
          });

          const loadedTeachers = deduplicateTeachersList(rawLoadedTeachers);

          const hasPitria = loadedTeachers.some(t =>
            (t.fullName || '').toLowerCase().includes('pitria') ||
            (t.fullName || '').toLowerCase().includes('lawenusa')
          );
          if (!hasPitria && !isDeletedUid('teacher_pitria_lawenusa') && !isDeletedUid('user_guru_bk')) {
            const pitriaTeacher: Teacher = {
              id: 'teacher_pitria_lawenusa',
              nip: '199005122020122008',
              fullName: 'Pitria Lawenusa, S. Pd',
              role: 'Guru BK',
              subject: 'Bimbingan Konseling (BK)',
              phone: '081234567890',
              email: 'pitria.lawenusa@madrasah.sch.id',
              assignedExtracurriculars: [],
              isActive: true
            };
            loadedTeachers.unshift(pitriaTeacher);
            setDoc(doc(db, 'teachers', pitriaTeacher.id), pitriaTeacher).catch(() => {});
            if (syncUsersFromTeachers) {
              syncUsersFromTeachers([pitriaTeacher]);
            }
          }

          setTeachers(loadedTeachers);
          try {
            localStorage.setItem('sim_teachers', JSON.stringify(loadedTeachers));
          } catch (e) {}

          // Extracurriculars Sync
          const ekskulSnap = await getDocs(collection(db, 'extracurriculars'));
          const loadedEkskul: Extracurricular[] = [];
          ekskulSnap.forEach(docSnap => {
            const data = docSnap.data() as Extracurricular;
            if (
              PURGED_DEMO_EKSKUL_IDS.includes(docSnap.id) ||
              isPurgedExtracurricular(data?.name) ||
              isPurgedExtracurricular(docSnap.id)
            ) {
              deleteDoc(doc(db, 'extracurriculars', docSnap.id)).catch(() => {});
            } else {
              loadedEkskul.push({ id: docSnap.id, ...data });
            }
          });
          setExtracurriculars(loadedEkskul);
          try {
            localStorage.setItem('sim_extracurriculars', JSON.stringify(loadedEkskul));
          } catch (e) {}

          // Members Sync
          const memberSnap = await getDocs(collection(db, 'extracurricular_members'));
          const loadedMembers: ExtracurricularMember[] = [];
          memberSnap.forEach(docSnap => {
            const data = docSnap.data() as ExtracurricularMember;
            if (
              PURGED_DEMO_EKSKUL_IDS.includes(data.extracurricularId) ||
              isPurgedExtracurricular(data.extracurricularId) ||
              isPurgedExtracurricular(data.extracurricularName || '')
            ) {
              deleteDoc(doc(db, 'extracurricular_members', docSnap.id)).catch(() => {});
            } else {
              loadedMembers.push({ id: docSnap.id, ...data });
            }
          });
          setMembers(loadedMembers);
          try {
            localStorage.setItem('sim_members', JSON.stringify(loadedMembers));
          } catch (e) {}

          // Schedules Sync
          const schedSnap = await getDocs(collection(db, 'schedules'));
          const loadedSched: ScheduleEvent[] = [];
          schedSnap.forEach(docSnap => {
            const data = docSnap.data() as ScheduleEvent;
            if (
              PURGED_DEMO_EKSKUL_IDS.includes(data.extracurricularId) ||
              isPurgedExtracurricular(data.extracurricularId) ||
              isPurgedExtracurricular(data.title || '')
            ) {
              deleteDoc(doc(db, 'schedules', docSnap.id)).catch(() => {});
            } else {
              loadedSched.push({ id: docSnap.id, ...data });
            }
          });
          setSchedules(loadedSched);
          try {
            localStorage.setItem('sim_schedules', JSON.stringify(loadedSched));
          } catch (e) {}

          // Attendance Sync
          const attSnap = await getDocs(collection(db, 'attendance'));
          const loadedAtt: AttendanceSession[] = [];
          attSnap.forEach(docSnap => {
            const data = docSnap.data() as AttendanceSession;
            if (
              PURGED_DEMO_EKSKUL_IDS.includes(data.extracurricularId) ||
              isPurgedExtracurricular(data.extracurricularId) ||
              isPurgedExtracurricular(data.extracurricularName || '')
            ) {
              deleteDoc(doc(db, 'attendance', docSnap.id)).catch(() => {});
            } else {
              loadedAtt.push({ id: docSnap.id, ...data });
            }
          });
          setAttendance(loadedAtt);
          try {
            localStorage.setItem('sim_attendance', JSON.stringify(loadedAtt));
          } catch (e) {}

          // Activities Sync
          const actSnap = await getDocs(collection(db, 'activities'));
          const loadedAct: SchoolActivity[] = [];
          actSnap.forEach(doc => loadedAct.push({ id: doc.id, ...doc.data() } as SchoolActivity));
          setActivities(loadedAct);
          try {
            localStorage.setItem('sim_activities', JSON.stringify(loadedAct));
          } catch (e) {}

          // Activity Reports Sync
          const repSnap = await getDocs(collection(db, 'activity_reports'));
          const loadedRep: ActivityReport[] = [];
          repSnap.forEach(doc => loadedRep.push({ id: doc.id, ...doc.data() } as ActivityReport));
          setActivityReports(loadedRep);
          try {
            localStorage.setItem('sim_reports', JSON.stringify(loadedRep));
          } catch (e) {}

          // Violations Sync
          const violSnap = await getDocs(collection(db, 'violations'));
          const loadedViol: StudentViolation[] = [];
          violSnap.forEach(doc => loadedViol.push({ id: doc.id, ...doc.data() } as StudentViolation));
          setViolations(loadedViol);
          try {
            localStorage.setItem('sim_violations', JSON.stringify(loadedViol));
          } catch (e) {}

          // Achievements Sync
          const achSnap = await getDocs(collection(db, 'achievements'));
          const loadedAch: StudentAchievement[] = [];
          achSnap.forEach(doc => loadedAch.push({ id: doc.id, ...doc.data() } as StudentAchievement));
          setAchievements(loadedAch);
          try {
            localStorage.setItem('sim_achievements', JSON.stringify(loadedAch));
          } catch (e) {}

          // BK Collections Sync
          const csSnap = await getDocs(collection(db, 'counseling'));
          const loadedCs: StudentCounseling[] = [];
          csSnap.forEach(doc => loadedCs.push({ id: doc.id, ...doc.data() } as StudentCounseling));
          setCounseling(loadedCs);
          try {
            localStorage.setItem('sim_counseling', JSON.stringify(loadedCs));
          } catch (e) {}

          const hvSnap = await getDocs(collection(db, 'home_visits'));
          const loadedHv: HomeVisitRecord[] = [];
          hvSnap.forEach(doc => loadedHv.push({ id: doc.id, ...doc.data() } as HomeVisitRecord));
          setHomeVisits(loadedHv);
          try {
            localStorage.setItem('sim_home_visits', JSON.stringify(loadedHv));
          } catch (e) {}

          const pclSnap = await getDocs(collection(db, 'parent_call_letters'));
          const loadedPcl: ParentCallLetter[] = [];
          pclSnap.forEach(doc => loadedPcl.push({ id: doc.id, ...doc.data() } as ParentCallLetter));
          setParentCallLetters(loadedPcl);
          try {
            localStorage.setItem('sim_parent_call_letters', JSON.stringify(loadedPcl));
          } catch (e) {}

          const cgSnap = await getDocs(collection(db, 'career_guidances'));
          const loadedCg: CareerGuidanceRecord[] = [];
          cgSnap.forEach(doc => loadedCg.push({ id: doc.id, ...doc.data() } as CareerGuidanceRecord));
          setCareerGuidances(loadedCg);
          try {
            localStorage.setItem('sim_career_guidances', JSON.stringify(loadedCg));
          } catch (e) {}

          // Permissions Sync
          const permSnap = await getDocs(collection(db, 'permissions'));
          const loadedPerm: StudentPermission[] = [];
          permSnap.forEach(doc => loadedPerm.push({ id: doc.id, ...doc.data() } as StudentPermission));
          setPermissions(loadedPerm);
          try {
            localStorage.setItem('sim_permissions', JSON.stringify(loadedPerm));
          } catch (e) {}

          // Needs Requests Sync
          const needSnap = await getDocs(collection(db, 'needs_requests'));
          const loadedNeed: NeedsRequest[] = [];
          needSnap.forEach(doc => loadedNeed.push({ id: doc.id, ...doc.data() } as NeedsRequest));
          setNeedsRequests(loadedNeed);
          try {
            localStorage.setItem('sim_needs', JSON.stringify(loadedNeed));
          } catch (e) {}

          // OSIM Collections Sync
          const osimMemSnap = await getDocs(collection(db, 'osim_members'));
          const rawOsimMem: OsimMember[] = [];
          osimMemSnap.forEach(docSnap => {
            const data = docSnap.data() as OsimMember;
            const id = docSnap.id;
            if (data.id === 'om1' || (data as any).isDeleted) {
              deleteDoc(docSnap.ref).catch(() => {});
              return;
            }
            // Safely clear accidental blacklist for real members
            removeDeletedUid(id);
            if (data.studentNis) removeDeletedUid(cleanDigits(data.studentNis));
            if (data.loginUsername) removeDeletedUid(data.loginUsername);
            rawOsimMem.push({ id, ...data });
          });

          // Deduplicate and reconcile with sortedStudents to guarantee 0 stale duplicates
          const loadedOsimMem = deduplicateOsimMembersList(rawOsimMem, sortedStudents);
          setOsimMembers(loadedOsimMem);
          try {
            localStorage.setItem('sim_osim_members', JSON.stringify(loadedOsimMem));
          } catch (e) {}

          // Asynchronously purge obsolete duplicate documents from Firestore if duplicates existed
          if (rawOsimMem.length > loadedOsimMem.length) {
            const keptIds = new Set(loadedOsimMem.map(m => m.id));
            const obsoleteMembers = rawOsimMem.filter(m => !keptIds.has(m.id));
            obsoleteMembers.forEach(obs => {
              addDeletedUid(obs.id);
              addDeletedUid(`user_${obs.id}`);
              deleteDoc(doc(db, 'osim_members', obs.id)).catch(() => {});
              deleteDoc(doc(db, 'users', obs.id)).catch(() => {});
              deleteDoc(doc(db, 'users', `user_${obs.id}`)).catch(() => {});
            });
          }

          const osimProgSnap = await getDocs(collection(db, 'osim_programs'));
          const loadedOsimProg: OsimWorkProgram[] = [];
          osimProgSnap.forEach(doc => loadedOsimProg.push({ id: doc.id, ...doc.data() } as OsimWorkProgram));
          setOsimPrograms(loadedOsimProg);
          try {
            localStorage.setItem('sim_osim_programs', JSON.stringify(loadedOsimProg));
          } catch (e) {}

          const osimAspSnap = await getDocs(collection(db, 'osim_aspirations'));
          const loadedOsimAsp: OsimAspiration[] = [];
          osimAspSnap.forEach(doc => loadedOsimAsp.push({ id: doc.id, ...doc.data() } as OsimAspiration));
          setOsimAspirations(loadedOsimAsp);
          try {
            localStorage.setItem('sim_osim_aspirations', JSON.stringify(loadedOsimAsp));
          } catch (e) {}

          const osimMeetSnap = await getDocs(collection(db, 'osim_meetings'));
          const loadedOsimMeet: OsimMeeting[] = [];
          osimMeetSnap.forEach(doc => loadedOsimMeet.push({ id: doc.id, ...doc.data() } as OsimMeeting));
          setOsimMeetings(loadedOsimMeet);
          try {
            localStorage.setItem('sim_osim_meetings', JSON.stringify(loadedOsimMeet));
          } catch (e) {}

          const osimDeptSnap = await getDocs(collection(db, 'osim_departments'));
          if (!osimDeptSnap.empty) {
            const loadedOsimDept: OsimDepartment[] = [];
            osimDeptSnap.forEach(doc => loadedOsimDept.push({ id: doc.id, ...doc.data() } as OsimDepartment));
            loadedOsimDept.sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
            setOsimDepartments(loadedOsimDept);
            try {
              localStorage.setItem('sim_osim_departments', JSON.stringify(loadedOsimDept));
            } catch (e) {}
          }

          // Cash Ledger Sync
          const cashAccSnap = await getDocs(collection(db, 'cash_accounts'));
          if (!cashAccSnap.empty) {
            const loadedCashAcc: CashAccount[] = [];
            cashAccSnap.forEach(doc => loadedCashAcc.push({ id: doc.id, ...doc.data() } as CashAccount));
            setCashAccounts(loadedCashAcc);
            try {
              localStorage.setItem('sim_cash_accounts', JSON.stringify(loadedCashAcc));
            } catch (e) {}
          }

          const cashTrxSnap = await getDocs(collection(db, 'cash_transactions'));
          if (!cashTrxSnap.empty) {
            const loadedCashTrx: CashTransaction[] = [];
            cashTrxSnap.forEach(doc => loadedCashTrx.push({ id: doc.id, ...doc.data() } as CashTransaction));
            // Sort newest first
            loadedCashTrx.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : (b.id > a.id ? 1 : -1)));
            setCashTransactions(loadedCashTrx);
            try {
              localStorage.setItem('sim_cash_transactions', JSON.stringify(loadedCashTrx));
            } catch (e) {}
          }

          // School Rules Sync
          const rulesSnap = await getDocs(collection(db, 'school_rules'));
          if (!rulesSnap.empty) {
            const loadedRules: SchoolRuleArticle[] = [];
            rulesSnap.forEach(doc => loadedRules.push({ id: doc.id, ...doc.data() } as SchoolRuleArticle));
            if (loadedRules.some(r => r.code?.startsWith('KH-'))) {
              setSchoolRules(loadedRules);
              try {
                localStorage.setItem('sim_school_rules', JSON.stringify(loadedRules));
              } catch (e) {}
            } else {
              // Non-destructive update: seed official Decree B-380 rules
              for (const r of INITIAL_SCHOOL_RULES) {
                setDoc(doc(db, 'school_rules', r.id), r);
              }
              setSchoolRules(INITIAL_SCHOOL_RULES);
              try {
                localStorage.setItem('sim_school_rules', JSON.stringify(INITIAL_SCHOOL_RULES));
              } catch (e) {}
            }
          } else {
            // Seed official Decree B-380 rules
            for (const r of INITIAL_SCHOOL_RULES) {
              setDoc(doc(db, 'school_rules', r.id), r);
            }
            setSchoolRules(INITIAL_SCHOOL_RULES);
            try {
              localStorage.setItem('sim_school_rules', JSON.stringify(INITIAL_SCHOOL_RULES));
            } catch (e) {}
          }

          // Handbook Meta Sync
          const handbookSnap = await getDocs(collection(db, 'settings'));
          const handbookDoc = handbookSnap.docs.find(d => d.id === 'handbook_meta');
          if (handbookDoc) {
            const loadedMeta = handbookDoc.data() as SchoolHandbookMeta;
            if (loadedMeta.decreeNumber === 'B-380/Ma.26.02/PP.00.6/09/2026') {
              setHandbookMeta(loadedMeta);
              try {
                localStorage.setItem('sim_handbook_meta', JSON.stringify(loadedMeta));
              } catch (e) {}
            } else {
              setDoc(doc(db, 'settings', 'handbook_meta'), INITIAL_HANDBOOK_META);
              setHandbookMeta(INITIAL_HANDBOOK_META);
              try {
                localStorage.setItem('sim_handbook_meta', JSON.stringify(INITIAL_HANDBOOK_META));
              } catch (e) {}
            }
          } else {
            setDoc(doc(db, 'settings', 'handbook_meta'), INITIAL_HANDBOOK_META);
            setHandbookMeta(INITIAL_HANDBOOK_META);
            try {
              localStorage.setItem('sim_handbook_meta', JSON.stringify(INITIAL_HANDBOOK_META));
            } catch (e) {}
          }

          // Announcements Sync
          const annSnap = await getDocs(collection(db, 'announcements'));
          if (!annSnap.empty) {
            const loadedAnn: Announcement[] = [];
            annSnap.forEach(doc => loadedAnn.push({ id: doc.id, ...doc.data() } as Announcement));
            setAnnouncements(loadedAnn);
            try {
              localStorage.setItem('sim_announcements', JSON.stringify(loadedAnn));
            } catch (e) {}
          }

          // Audit Logs Sync from Firestore
          const auditSnap = await getDocs(collection(db, 'audit_logs'));
          if (!auditSnap.empty) {
            const loadedLogs: AuditLogItem[] = [];
            auditSnap.forEach(doc => loadedLogs.push({ id: doc.id, ...doc.data() } as AuditLogItem));
            // Sort newest first
            loadedLogs.sort((a, b) => (b.id > a.id ? 1 : -1));
            setAuditLogs(loadedLogs);
            try {
              localStorage.setItem('sim_audit_logs', JSON.stringify(loadedLogs));
            } catch (e) {}
          }
        } else {
          // Cloud database is empty: auto initialize master data to Firestore
          try {
            await seedAllFirebaseData();
          } catch (seedErr) {
            console.warn('Auto-init database note:', seedErr);
          }
        }
      })();

      await syncPromise;
    } catch (e) {
      console.warn('Firestore sync note (active offline local cache):', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Bidirectionally synchronize any local device data up to Firestore so that neither HP nor tablet data is lost
  const syncLocalChangesToFirestore = async () => {
    try {
      // 1. Sync students from local cache
      const savedStudents = localStorage.getItem('sim_students');
      if (savedStudents) {
        try {
          const parsed: Student[] = JSON.parse(savedStudents);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const { deduplicated } = deduplicateStudentsList(parsed);
            await Promise.allSettled(
              deduplicated.map(s => setDoc(doc(db, 'students', s.id), s, { merge: true }))
            );
          }
        } catch (e) {}
      }

      // 2. Sync extracurricular members from local cache
      const savedMembers = localStorage.getItem('sim_members');
      if (savedMembers) {
        try {
          const parsed: ExtracurricularMember[] = JSON.parse(savedMembers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const valid = parsed.filter(m => m && m.id && m.id !== 'm1' && !isPurgedExtracurricular(m.extracurricularId));
            await Promise.allSettled(
              valid.map(m => setDoc(doc(db, 'extracurricular_members', m.id), m, { merge: true }))
            );
          }
        } catch (e) {}
      }

      // 3. Sync extracurriculars from local cache
      const savedEkskuls = localStorage.getItem('sim_extracurriculars');
      if (savedEkskuls) {
        try {
          const parsed: Extracurricular[] = JSON.parse(savedEkskuls);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const valid = parsed.filter(e => e && e.id && !isPurgedExtracurricular(e.id) && !isPurgedExtracurricular(e.name));
            await Promise.allSettled(
              valid.map(e => setDoc(doc(db, 'extracurriculars', e.id), e, { merge: true }))
            );
          }
        } catch (e) {}
      }

      // 4. Sync classes from local cache
      const savedClasses = localStorage.getItem('sim_classes');
      if (savedClasses) {
        try {
          const parsed: SchoolClass[] = JSON.parse(savedClasses);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const valid = parsed.filter(c => c && c.id && !isDeletedClassId(c.id) && !isPurgedClassId(c.id));
            await Promise.allSettled(
              valid.map(c => setDoc(doc(db, 'classes', c.id), c, { merge: true }))
            );
          }
        } catch (e) {}
      }

      // 5. Sync teachers from local cache
      const savedTeachers = localStorage.getItem('sim_teachers');
      if (savedTeachers) {
        try {
          const parsed: Teacher[] = JSON.parse(savedTeachers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const valid = parsed.filter(t => t && t.id && !isDeletedUid(t.id));
            await Promise.allSettled(
              valid.map(t => setDoc(doc(db, 'teachers', t.id), t, { merge: true }))
            );
          }
        } catch (e) {}
      }

      // 6. Sync OSIM members from local cache
      const savedOsim = localStorage.getItem('sim_osim_members');
      if (savedOsim) {
        try {
          const parsed: OsimMember[] = JSON.parse(savedOsim);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const valid = parsed.filter(o => o && o.id && !isDeletedUid(o.id));
            await Promise.allSettled(
              valid.map(o => setDoc(doc(db, 'osim_members', o.id), o, { merge: true }))
            );
          }
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Sync local changes notice:', err);
    }
  };

  // Real-time synchronization across all devices via Firestore onSnapshot
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // Trigger initial load and ensure local device changes are reconciled to Firestore
    syncWithFirebase();
    syncLocalChangesToFirestore().catch(() => {});

    // 1. Real-time Students Listener
    try {
      const unsub = onSnapshot(collection(db, 'students'), (snapshot) => {
        if (!snapshot.empty) {
          const raw: Student[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as Student;
            const id = docSnap.id;
            if (data.isDeleted) return;
            removeDeletedUid(id);
            if (data.nis) removeDeletedUid(cleanDigits(data.nis));
            raw.push({ id, ...data });
          });
          const { deduplicated, duplicateIds } = deduplicateStudentsList(raw);
          const sorted = sortStudentsAlphabetically(deduplicated);
          setStudents(sorted);
          try {
            localStorage.setItem('sim_students', JSON.stringify(sorted));
          } catch (e) {}

          if (duplicateIds.length > 0) {
            duplicateIds.forEach(dupId => {
              deleteDoc(doc(db, 'students', dupId)).catch(() => {});
            });
          }
        }
      }, (err) => {
        console.warn('Real-time students listener notice:', err);
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 2. Real-time Extracurricular Members Listener
    try {
      const unsub = onSnapshot(collection(db, 'extracurricular_members'), (snapshot) => {
        const loaded: ExtracurricularMember[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as ExtracurricularMember;
          const id = docSnap.id;
          if (id === 'm1' || data.studentNis === '24251001') return;
          if (isPurgedExtracurricular(data.extracurricularId) || isPurgedExtracurricular(data.extracurricularName || '')) return;
          loaded.push({ id, ...data });
        });
        setMembers(loaded);
        try {
          localStorage.setItem('sim_members', JSON.stringify(loaded));
        } catch (e) {}

        // Keep extracurricular member counts synced
        setExtracurriculars(prev => prev.map(ekskul => {
          const count = loaded.filter(m => m.extracurricularId === ekskul.id && m.status !== 'Nonaktif' && m.status !== 'Keluar').length;
          return { ...ekskul, memberCount: count };
        }));
      }, (err) => {
        console.warn('Real-time members listener notice:', err);
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 3. Real-time Extracurriculars Listener
    try {
      const unsub = onSnapshot(collection(db, 'extracurriculars'), (snapshot) => {
        if (!snapshot.empty) {
          const loaded: Extracurricular[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as Extracurricular;
            const id = docSnap.id;
            if (isPurgedExtracurricular(data.name) || isPurgedExtracurricular(id)) return;
            loaded.push({ id, ...data });
          });
          setExtracurriculars(loaded);
          try {
            localStorage.setItem('sim_extracurriculars', JSON.stringify(loaded));
          } catch (e) {}
        }
      }, (err) => {
        console.warn('Real-time extracurriculars listener notice:', err);
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 4. Real-time Classes Listener
    try {
      const unsub = onSnapshot(collection(db, 'classes'), (snapshot) => {
        if (!snapshot.empty) {
          const loaded: SchoolClass[] = [];
          const deletedClassSet = getDeletedClassIds();
          snapshot.forEach(docSnap => {
            const id = docSnap.id;
            const data = docSnap.data() as SchoolClass;
            if (deletedClassSet.has(id) || isPurgedClassId(id) || isPurgedClassId(data?.name)) {
              deleteDoc(docSnap.ref).catch(() => {});
              return;
            }
            loaded.push({ id: docSnap.id, ...data });
          });
          setClasses(loaded);
          try {
            localStorage.setItem('sim_classes', JSON.stringify(loaded));
          } catch (e) {}
        }
      }, (err) => {
        console.warn('Real-time classes listener notice:', err);
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 5. Real-time Teachers Listener
    try {
      const unsub = onSnapshot(collection(db, 'teachers'), (snapshot) => {
        if (!snapshot.empty) {
          const raw: Teacher[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as Teacher;
            const id = docSnap.id;
            if (
              isBlacklistedDemoName(data.fullName || (data as any).name) ||
              isDeletedUid(id) ||
              isDeletedUid(cleanDigits(data.nip))
            ) {
              return;
            }
            raw.push({ id, ...data });
          });
          const loaded = deduplicateTeachersList(raw);
          setTeachers(loaded);
          try {
            localStorage.setItem('sim_teachers', JSON.stringify(loaded));
          } catch (e) {}
        }
      }, (err) => {
        console.warn('Real-time teachers listener notice:', err);
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 6. Real-time Schools (Settings) Listener
    try {
      const unsub = onSnapshot(collection(db, 'schools'), (snapshot) => {
        if (!snapshot.empty) {
          const mainDoc = snapshot.docs.find(d => d.id === 'main_school') || snapshot.docs[0];
          const loadedSchool = mainDoc.data() as SchoolSetting;
          if (loadedSchool && (loadedSchool.name || loadedSchool.address)) {
            setSchoolSetting(prev => {
              const merged: SchoolSetting = {
                ...INITIAL_SCHOOL_SETTING,
                ...prev,
                ...loadedSchool,
                name: loadedSchool.name?.trim() || prev.name || INITIAL_SCHOOL_SETTING.name,
                address: loadedSchool.address?.trim() || prev.address || INITIAL_SCHOOL_SETTING.address,
                defaultCity: loadedSchool.defaultCity?.trim() || prev.defaultCity || 'Bula',
                principalName: loadedSchool.principalName?.trim() || prev.principalName || INITIAL_SCHOOL_SETTING.principalName,
                principalNip: loadedSchool.principalNip?.trim() || prev.principalNip || INITIAL_SCHOOL_SETTING.principalNip,
                wakaName: loadedSchool.wakaName?.trim() || loadedSchool.wakaKesiswaanName?.trim() || prev.wakaName || INITIAL_SCHOOL_SETTING.wakaName,
                wakaKesiswaanName: loadedSchool.wakaKesiswaanName?.trim() || loadedSchool.wakaName?.trim() || prev.wakaKesiswaanName || INITIAL_SCHOOL_SETTING.wakaKesiswaanName,
                wakaNip: loadedSchool.wakaNip?.trim() || prev.wakaNip || INITIAL_SCHOOL_SETTING.wakaNip,
                pembinaOsim: loadedSchool.pembinaOsim?.trim() || prev.pembinaOsim || INITIAL_SCHOOL_SETTING.pembinaOsim || 'Puput Eka Bajuri, S. Pd., M. Or',
                pembinaOsimNip: loadedSchool.pembinaOsimNip?.trim() || prev.pembinaOsimNip || INITIAL_SCHOOL_SETTING.pembinaOsimNip || '198810052020121003',
                phone: loadedSchool.phone?.trim() || prev.phone || INITIAL_SCHOOL_SETTING.phone,
                email: loadedSchool.email?.trim() || prev.email || INITIAL_SCHOOL_SETTING.email,
                website: loadedSchool.website?.trim() || prev.website || INITIAL_SCHOOL_SETTING.website,
                logoLeftUrl: loadedSchool.logoLeftUrl || prev.logoLeftUrl || '',
                logoRightUrl: loadedSchool.logoRightUrl || prev.logoRightUrl || '',
                defaultSignaturesConfig: loadedSchool.defaultSignaturesConfig || prev.defaultSignaturesConfig || INITIAL_SCHOOL_SETTING.defaultSignaturesConfig,
                isSignatureLocked: loadedSchool.isSignatureLocked ?? loadedSchool.defaultSignaturesConfig?.isLockedByUser ?? prev.isSignatureLocked ?? false,
                signatureLockedAt: loadedSchool.signatureLockedAt || loadedSchool.defaultSignaturesConfig?.lockedAt || prev.signatureLockedAt,
                signatureLockedBy: loadedSchool.signatureLockedBy || loadedSchool.defaultSignaturesConfig?.lockedBy || prev.signatureLockedBy
              };
              try {
                localStorage.setItem('sim_school_setting', JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
            if (loadedSchool.currentAcademicYear) {
              setActiveAcademicYearState(loadedSchool.currentAcademicYear);
            }
            if (loadedSchool.currentSemester) {
              setActiveSemesterState(loadedSchool.currentSemester);
            }
          }
        }
      }, (err) => {
        console.warn('Real-time schools listener notice:', err);
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 7. Real-time Academic Years Listener
    try {
      const unsub = onSnapshot(collection(db, 'academic_years'), (snapshot) => {
        if (!snapshot.empty) {
          const loaded: AcademicYear[] = [];
          snapshot.forEach(docSnap => {
            loaded.push({ id: docSnap.id, ...docSnap.data() } as AcademicYear);
          });
          setAcademicYears(loaded);
          try {
            localStorage.setItem('sim_academic_years', JSON.stringify(loaded));
          } catch (e) {}
        }
      }, (err) => {
        console.warn('Real-time academic_years listener notice:', err);
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 8. Real-time Attendance Listener
    try {
      const unsub = onSnapshot(collection(db, 'attendance'), (snapshot) => {
        const loaded: AttendanceRecord[] = [];
        snapshot.forEach(docSnap => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as AttendanceRecord);
        });
        setAttendance(loaded);
        try {
          localStorage.setItem('sim_attendance', JSON.stringify(loaded));
        } catch (e) {}
      }, (err) => {
        console.warn('Real-time attendance listener notice:', err);
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 9. Real-time Activities Listener
    try {
      const unsub = onSnapshot(collection(db, 'activities'), (snapshot) => {
        const loaded: Activity[] = [];
        snapshot.forEach(docSnap => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as Activity);
        });
        setActivities(loaded);
        try {
          localStorage.setItem('sim_activities', JSON.stringify(loaded));
        } catch (e) {}
      }, (err) => {
        console.warn('Real-time activities listener notice:', err);
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 10. Real-time Activity Reports Listener
    try {
      const unsub = onSnapshot(collection(db, 'activity_reports'), (snapshot) => {
        const loaded: ActivityReport[] = [];
        snapshot.forEach(docSnap => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as ActivityReport);
        });
        setActivityReports(loaded);
        try {
          localStorage.setItem('sim_activity_reports', JSON.stringify(loaded));
        } catch (e) {}
      }, (err) => {
        console.warn('Real-time activity_reports listener notice:', err);
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 11. Real-time Schedules Listener
    try {
      const unsub = onSnapshot(collection(db, 'schedules'), (snapshot) => {
        const loaded: ScheduleEvent[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as ScheduleEvent;
          const id = docSnap.id;
          if (id === 'sch_1' || isPurgedExtracurricular(data.extracurricularId) || isPurgedExtracurricular(data.title || '')) return;
          loaded.push({ id, ...data });
        });
        setSchedules(loaded);
        try {
          localStorage.setItem('sim_schedules', JSON.stringify(loaded));
        } catch (e) {}
      }, (err) => {
        console.warn('Real-time schedules listener notice:', err);
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 12. Real-time Violations Listener
    try {
      const unsub = onSnapshot(collection(db, 'violations'), (snapshot) => {
        const loaded: Violation[] = [];
        snapshot.forEach(docSnap => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as Violation);
        });
        setViolations(loaded);
        try {
          localStorage.setItem('sim_violations', JSON.stringify(loaded));
        } catch (e) {}
      }, (err) => {
        console.warn('Real-time violations listener notice:', err);
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 13. Real-time Counseling Listener
    try {
      const unsub = onSnapshot(collection(db, 'counseling'), (snapshot) => {
        const loaded: CounselingSession[] = [];
        snapshot.forEach(docSnap => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as CounselingSession);
        });
        setCounseling(loaded);
        try {
          localStorage.setItem('sim_counseling', JSON.stringify(loaded));
        } catch (e) {}
      }, (err) => {
        console.warn('Real-time counseling listener notice:', err);
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 14. Real-time Achievements Listener
    try {
      const unsub = onSnapshot(collection(db, 'achievements'), (snapshot) => {
        const loaded: Achievement[] = [];
        snapshot.forEach(docSnap => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as Achievement);
        });
        setAchievements(loaded);
        try {
          localStorage.setItem('sim_achievements', JSON.stringify(loaded));
        } catch (e) {}
      }, (err) => {
        console.warn('Real-time achievements listener notice:', err);
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 15. Real-time Permissions Listener
    try {
      const unsub = onSnapshot(collection(db, 'permissions'), (snapshot) => {
        const loaded: StudentPermission[] = [];
        snapshot.forEach(docSnap => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as StudentPermission);
        });
        setPermissions(loaded);
        try {
          localStorage.setItem('sim_permissions', JSON.stringify(loaded));
        } catch (e) {}
      }, (err) => {
        console.warn('Real-time permissions listener notice:', err);
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 16. Real-time OSIM Members Listener
    try {
      const unsub = onSnapshot(collection(db, 'osim_members'), (snapshot) => {
        const raw: OsimMember[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as OsimMember;
          const id = docSnap.id;
          const memberNis = data.studentNis || (data as any).nis;
          if (isDeletedUid(id) || (memberNis && isDeletedUid(cleanDigits(memberNis)))) return;
          raw.push({ id, ...data });
        });
        const deduplicated = deduplicateOsimMembersList(raw);
        setOsimMembers(deduplicated);
        try {
          localStorage.setItem('sim_osim_members', JSON.stringify(deduplicated));
        } catch (e) {}
      }, (err) => {
        console.warn('Real-time osim_members listener notice:', err);
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 17. Real-time OSIM Programs Listener
    try {
      const unsub = onSnapshot(collection(db, 'osim_programs'), (snapshot) => {
        const loaded: OsimWorkProgram[] = [];
        snapshot.forEach(docSnap => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as OsimWorkProgram);
        });
        setOsimPrograms(loaded);
        try {
          localStorage.setItem('sim_osim_programs', JSON.stringify(loaded));
        } catch (e) {}
      }, (err) => {
        console.warn('Real-time osim_programs listener notice:', err);
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 18. Real-time Announcements Listener
    try {
      const unsub = onSnapshot(collection(db, 'announcements'), (snapshot) => {
        const loaded: Announcement[] = [];
        snapshot.forEach(docSnap => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as Announcement);
        });
        setAnnouncements(loaded);
        try {
          localStorage.setItem('sim_announcements', JSON.stringify(loaded));
        } catch (e) {}
      }, (err) => {
        console.warn('Real-time announcements listener notice:', err);
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    setIsRealTimeConnected(true);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
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

  const uploadAllDataToFirestore = async (): Promise<{ success: boolean; message: string; count: number }> => {
    setIsSyncing(true);
    try {
      const cleanStudents = deduplicateStudentsList(students.filter(s => !isBlacklistedDemoName(s.fullName))).deduplicated;
      const cleanOsim = deduplicateOsimMembersList(osimMembers.filter(m => !isBlacklistedDemoName(m.fullName)));
      const res = await uploadAllStateToFirebase({
        schoolSetting,
        academicYears,
        classes: classes.filter(c => !isPurgedClassId(c.id)),
        teachers: teachers.filter(t => !isBlacklistedDemoName(t.fullName)),
        students: cleanStudents,
        extracurriculars: extracurriculars.filter(e => !isPurgedExtracurricular(e.name) && !isPurgedExtracurricular(e.id)),
        members: members.filter(m => !isBlacklistedDemoName(m.studentName)),
        schedules,
        attendance,
        activities,
        activityReports,
        violations,
        counseling,
        homeVisits,
        parentCallLetters,
        careerGuidances,
        achievements,
        permissions,
        needsRequests,
        osimMembers: cleanOsim,
        osimPrograms,
        osimAspirations,
        osimMeetings,
        osimDepartments,
        cashAccounts,
        cashTransactions,
        schoolRules,
        handbookMeta,
        announcements,
        auditLogs
      });

      if (res.success) {
        await logAction('UPLOAD_ALL_TO_FIREBASE', 'Manajemen Database', `Mengunggah seluruh data aktif (${res.count} dokumen) ke Cloud Firestore`);
      }
      return res;
    } catch (err: any) {
      console.error('Error uploading all data to Firestore:', err);
      return { success: false, message: err?.message || 'Gagal mengunggah data ke Cloud Firestore', count: 0 };
    } finally {
      setIsSyncing(false);
    }
  };

  const clearAllOperationalData = async () => {
    setIsSyncing(true);
    try {
      setStudents([]);
      setMembers([]);
      setSchedules([]);
      setAttendance([]);
      setActivities([]);
      setActivityReports([]);
      setViolations([]);
      setCounseling([]);
      setHomeVisits([]);
      setParentCallLetters([]);
      setCareerGuidances([]);
      setAchievements([]);
      setPermissions([]);
      setNeedsRequests([]);
      setOsimMembers([]);
      setOsimPrograms([]);
      setOsimAspirations([]);
      setOsimMeetings([]);

      const keysToClear = [
        'sim_students',
        'sim_members',
        'sim_schedules',
        'sim_attendance',
        'sim_activities',
        'sim_reports',
        'sim_violations',
        'sim_counseling',
        'sim_home_visits',
        'sim_parent_call_letters',
        'sim_career_guidances',
        'sim_achievements',
        'sim_permissions',
        'sim_needs',
        'sim_osim_members',
        'sim_osim_programs',
        'sim_osim_aspirations',
        'sim_osim_meetings'
      ];
      keysToClear.forEach(k => {
        try {
          localStorage.setItem(k, JSON.stringify([]));
        } catch (e) {}
      });

      await clearAllFirebaseOperationalData();
      await logAction('CLEAR_ALL_DATA', 'Manajemen Database', 'Mengosongkan seluruh data operasional bawaan');
      return { success: true, message: 'Seluruh data bawaan berhasil dibersihkan. Database siap menerima unggahan data resmi sekolah.' };
    } catch (err: any) {
      console.error('Error in clearAllOperationalData:', err);
      return { success: false, message: err?.message || 'Gagal membersihkan data bawaan.' };
    } finally {
      setIsSyncing(false);
    }
  };

  const exportFullDatabaseJSON = () => {
    const exportBundle = {
      appVersion: '2.0-SIM-KESISWAAN',
      exportedAt: new Date().toISOString(),
      schoolSetting,
      academicYears,
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
      homeVisits,
      parentCallLetters,
      careerGuidances,
      achievements,
      permissions,
      needsRequests,
      osimMembers,
      osimPrograms,
      osimAspirations,
      osimMeetings
    };

    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SIM_KESISWAAN_DATABASE_${(schoolSetting.name || 'SEKOLAH').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importFullDatabaseJSON = async (bundle: any) => {
    if (!bundle || typeof bundle !== 'object') {
      return { success: false, message: 'Format berkas JSON cadangan tidak valid.' };
    }

    setIsSyncing(true);
    try {
      if (bundle.schoolSetting) setSchoolSetting(bundle.schoolSetting);
      if (Array.isArray(bundle.classes)) setClasses(bundle.classes);
      if (Array.isArray(bundle.teachers)) setTeachers(bundle.teachers);
      if (Array.isArray(bundle.students)) setStudents(sortStudentsAlphabetically(bundle.students));
      if (Array.isArray(bundle.extracurriculars)) setExtracurriculars(bundle.extracurriculars);
      if (Array.isArray(bundle.members)) setMembers(bundle.members);
      if (Array.isArray(bundle.schedules)) setSchedules(bundle.schedules);
      if (Array.isArray(bundle.attendance)) setAttendance(bundle.attendance);
      if (Array.isArray(bundle.activities)) setActivities(bundle.activities);
      if (Array.isArray(bundle.activityReports)) setActivityReports(bundle.activityReports);
      if (Array.isArray(bundle.violations)) setViolations(bundle.violations);
      if (Array.isArray(bundle.counseling)) setCounseling(bundle.counseling);
      if (Array.isArray(bundle.homeVisits)) setHomeVisits(bundle.homeVisits);
      if (Array.isArray(bundle.parentCallLetters)) setParentCallLetters(bundle.parentCallLetters);
      if (Array.isArray(bundle.careerGuidances)) setCareerGuidances(bundle.careerGuidances);
      if (Array.isArray(bundle.achievements)) setAchievements(bundle.achievements);
      if (Array.isArray(bundle.permissions)) setPermissions(bundle.permissions);
      if (Array.isArray(bundle.needsRequests)) setNeedsRequests(bundle.needsRequests);
      if (Array.isArray(bundle.osimMembers)) setOsimMembers(bundle.osimMembers);
      if (Array.isArray(bundle.osimPrograms)) setOsimPrograms(bundle.osimPrograms);
      if (Array.isArray(bundle.osimAspirations)) setOsimAspirations(bundle.osimAspirations);
      if (Array.isArray(bundle.osimMeetings)) setOsimMeetings(bundle.osimMeetings);

      await logAction('IMPORT_FULL_DATABASE', 'Manajemen Database', 'Memulihkan database lengkap dari berkas JSON');
      return { success: true, message: 'Database lengkap berhasil diimpor dan dipulihkan!' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal memulihkan database dari JSON.' };
    } finally {
      setIsSyncing(false);
    }
  };

  const logAction = async (action: string, module: string, details: string): Promise<void> => {
    const newLog: AuditLogItem = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser?.uid || 'system',
      userEmail: currentUser?.email || 'system@sekolah.sch.id',
      userName: currentUser?.displayName || 'Sistem SIM-KESISWAAN',
      userRole: currentUser?.role || 'super_admin',
      action,
      module,
      details,
      timestamp: new Date().toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };
    setAuditLogs(prev => {
      const next = [newLog, ...prev].slice(0, 1000);
      try {
        localStorage.setItem('sim_audit_logs', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    // Non-blocking write to Firestore
    setDoc(doc(db, 'audit_logs', newLog.id), newLog).catch(() => {});
  };

  const clearAuditLogs = async () => {
    setAuditLogs([]);
    try {
      localStorage.removeItem('sim_audit_logs');
    } catch (e) {}
    // Non-blocking batch clear in background
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'audit_logs'));
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      } catch (e) {
        console.warn('Batch clear audit logs note:', e);
      }
    })();
    logAction('CLEAR_LOGS', 'Audit Log & Keamanan', 'Administrator mengosongkan seluruh riwayat log aktivitas aplikasi');
  };

  const refreshAuditLogs = async () => {
    try {
      const snap = await getDocs(collection(db, 'audit_logs'));
      if (!snap.empty) {
        const loaded: AuditLogItem[] = [];
        snap.forEach(d => loaded.push({ id: d.id, ...d.data() } as AuditLogItem));
        loaded.sort((a, b) => (b.id > a.id ? 1 : -1));
        setAuditLogs(loaded);
        localStorage.setItem('sim_audit_logs', JSON.stringify(loaded));
      } else {
        const raw = localStorage.getItem('sim_audit_logs');
        if (raw) {
          setAuditLogs(JSON.parse(raw));
        }
      }
    } catch (e) {
      const raw = localStorage.getItem('sim_audit_logs');
      if (raw) {
        setAuditLogs(JSON.parse(raw));
      }
    }
  };

  const setActiveAcademicYear = (year: string, semester: 'Ganjil' | 'Genap' = 'Ganjil') => {
    setActiveAcademicYearState(year);
    setActiveSemesterState(semester);
    setSchoolSetting(prev => {
      const next = { ...prev, currentAcademicYear: year, currentSemester: semester };
      try {
        localStorage.setItem('sim_school_setting', JSON.stringify(next));
        setDoc(doc(db, 'schools', 'main_school'), { currentAcademicYear: year, currentSemester: semester }, { merge: true });
      } catch (e) {}
      return next;
    });
    // Update active status in academicYears array
    setAcademicYears(prev => {
      const updated = prev.map(ay => {
        const isTarget = ay.name === year || ay.year === year;
        if (isTarget) {
          try {
            setDoc(doc(db, 'academic_years', ay.id), { isActive: true }, { merge: true });
          } catch (e) {}
        } else if (ay.isActive) {
          try {
            setDoc(doc(db, 'academic_years', ay.id), { isActive: false }, { merge: true });
          } catch (e) {}
        }
        return {
          ...ay,
          isActive: isTarget
        };
      });
      try {
        localStorage.setItem('sim_academic_years', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    logAction('CHANGE_ACADEMIC_YEAR', 'Tahun Ajaran', `Mengubah periode aktif ke ${year} (${semester})`);
  };

  const addAcademicYear = async (data: Omit<AcademicYear, 'id'> | AcademicYear) => {
    const newId = 'id' in data && data.id ? data.id : `ay_${Date.now()}`;
    const yearString = (('year' in data && data.year) ? data.year : (data.name || '2026/2027')).trim();
    const newYear: AcademicYear = {
      id: newId,
      year: yearString,
      name: yearString,
      isActive: data.isActive || false,
      startDate: data.startDate || `${yearString.split('/')[0] || '2026'}-07-01`,
      endDate: data.endDate || `${yearString.split('/')[1] || '2027'}-06-30`,
    };

    setAcademicYears(prev => {
      let nextList = [...prev];
      if (newYear.isActive) {
        nextList = nextList.map(item => ({ ...item, isActive: false }));
        setActiveAcademicYearState(newYear.year);
        setSchoolSetting(s => ({ ...s, currentAcademicYear: newYear.year }));
      }
      nextList.push(newYear);
      try {
        localStorage.setItem('sim_academic_years', JSON.stringify(nextList));
      } catch (e) {}
      return nextList;
    });

    try {
      setDoc(doc(db, 'academic_years', newYear.id), newYear);
    } catch (e) {
      console.warn('Firestore addAcademicYear notice:', e);
    }
    logAction('ADD_ACADEMIC_YEAR', 'Tahun Ajaran', `Menambahkan tahun pelajaran baru: ${newYear.year}`);
  };

  const updateAcademicYear = async (id: string, data: Partial<AcademicYear>) => {
    let targetName = '';
    let shouldActivate = false;

    setAcademicYears(prev => {
      const nextList = prev.map(item => {
        if (item.id === id) {
          const yearVal = data.year || data.name || item.year || item.name || '';
          const updated: AcademicYear = {
            ...item,
            ...data,
            year: yearVal,
            name: yearVal
          };
          targetName = updated.year;
          if (data.isActive) shouldActivate = true;
          return updated;
        }
        if (data.isActive) {
          return { ...item, isActive: false };
        }
        return item;
      });

      if (shouldActivate && targetName) {
        setActiveAcademicYearState(targetName);
        setSchoolSetting(s => ({ ...s, currentAcademicYear: targetName }));
      }

      try {
        localStorage.setItem('sim_academic_years', JSON.stringify(nextList));
      } catch (e) {}
      return nextList;
    });

    try {
      setDoc(doc(db, 'academic_years', id), data, { merge: true });
    } catch (e) {
      console.warn('Firestore updateAcademicYear notice:', e);
    }
    logAction('UPDATE_ACADEMIC_YEAR', 'Tahun Ajaran', `Memperbarui data tahun pelajaran ID: ${id}`);
  };

  const deleteAcademicYear = async (id: string) => {
    const target = academicYears.find(a => a.id === id);
    if (!target) return;

    if (academicYears.length <= 1) {
      throw new Error('Minimal harus ada 1 tahun ajaran terdaftar.');
    }

    setAcademicYears(prev => {
      const nextList = prev.filter(item => item.id !== id);
      // If deleted year was active, activate the first available one
      if (target.isActive && nextList.length > 0) {
        nextList[0].isActive = true;
        setActiveAcademicYearState(nextList[0].name);
        setSchoolSetting(s => ({ ...s, currentAcademicYear: nextList[0].name }));
      }
      try {
        localStorage.setItem('sim_academic_years', JSON.stringify(nextList));
      } catch (e) {}
      return nextList;
    });

    try {
      deleteDoc(doc(db, 'academic_years', id));
    } catch (e) {
      console.warn('Firestore deleteAcademicYear notice:', e);
    }
    logAction('DELETE_ACADEMIC_YEAR', 'Tahun Ajaran', `Menghapus tahun pelajaran: ${target.name}`);
  };

  const promoteAcademicYear = async (params: {
    targetAcademicYear: string;
    targetSemester?: 'Ganjil' | 'Genap';
    resetViolationPoints?: boolean;
    demisionerOsim?: boolean;
  }): Promise<{ graduatedCount: number; promotedCount: number }> => {
    const {
      targetAcademicYear,
      targetSemester = 'Ganjil',
      resetViolationPoints = true,
      demisionerOsim = true
    } = params;

    let graduatedCount = 0;
    let promotedCount = 0;

    // 1. Process Students:
    // XII -> Alumni
    // XI -> XII
    // X -> XI
    const updatedStudents = students.map(student => {
      if (student.isDeleted || student.status !== 'Aktif') {
        return student;
      }

      const cls = classes.find(c => c.id === student.classId || c.name === student.className);
      const isGradeXII = cls?.grade === 'XII' || (student.className && student.className.startsWith('XII'));
      const isGradeXI = cls?.grade === 'XI' || (student.className && student.className.startsWith('XI'));
      const isGradeX = cls?.grade === 'X' || (student.className && student.className.startsWith('X'));

      if (isGradeXII) {
        graduatedCount++;
        return {
          ...student,
          status: 'Alumni' as const,
          violationPoints: resetViolationPoints ? 0 : (student.violationPoints || 0),
          updatedAt: new Date().toISOString()
        };
      }

      if (isGradeXI) {
        promotedCount++;
        const targetClass = classes.find(c => c.grade === 'XII' && (c.major === cls?.major || c.name.replace(/^XII/, '') === cls?.name?.replace(/^XI/, '')));
        const newClassName = targetClass?.name || (student.className ? student.className.replace(/^XI/, 'XII') : 'XII');
        const newClassId = targetClass?.id || student.classId;

        return {
          ...student,
          classId: newClassId,
          className: newClassName,
          violationPoints: resetViolationPoints ? 0 : (student.violationPoints || 0),
          updatedAt: new Date().toISOString()
        };
      }

      if (isGradeX) {
        promotedCount++;
        const targetClass = classes.find(c => c.grade === 'XI' && (c.major === cls?.major || c.name.replace(/^XI/, '') === cls?.name?.replace(/^X\b/, '')));
        const newClassName = targetClass?.name || (student.className ? student.className.replace(/^X\b/, 'XI') : 'XI');
        const newClassId = targetClass?.id || student.classId;

        return {
          ...student,
          classId: newClassId,
          className: newClassName,
          violationPoints: resetViolationPoints ? 0 : (student.violationPoints || 0),
          updatedAt: new Date().toISOString()
        };
      }

      return {
        ...student,
        violationPoints: resetViolationPoints ? 0 : (student.violationPoints || 0)
      };
    });

    setStudents(updatedStudents);
    try {
      localStorage.setItem('sim_students', JSON.stringify(updatedStudents));
    } catch (e) {}

    // Persist student promotions to Firestore
    try {
      const studentUpdates = updatedStudents
        .filter(s => s.status === 'Aktif' || s.status === 'Alumni')
        .map(s => updateDoc(doc(db, 'students', s.id), {
          status: s.status,
          classId: s.classId,
          className: s.className,
          violationPoints: s.violationPoints || 0,
          updatedAt: s.updatedAt || new Date().toISOString()
        }).catch(() => {}));
      await Promise.allSettled(studentUpdates);
    } catch (e) {
      console.warn('Firestore promote students notice:', e);
    }

    // 2. Demisioner OSIM if requested
    if (demisionerOsim) {
      setOsimMembers(prev => {
        const demisionered = prev.map(m => m.status === 'Aktif' ? { ...m, status: 'Demisioner' as const } : m);
        try {
          localStorage.setItem('sim_osim_members', JSON.stringify(demisionered));
        } catch (e) {}
        return demisionered;
      });
      try {
        const osimUpdates = osimMembers.filter(m => m.status === 'Aktif').map(m =>
          updateDoc(doc(db, 'osim_members', m.id), { status: 'Demisioner' }).catch(() => {})
        );
        await Promise.allSettled(osimUpdates);
      } catch (e) {}
    }

    // 3. Register & activate new Academic Year
    const exists = academicYears.find(ay => ay.name === targetAcademicYear || ay.year === targetAcademicYear);
    if (!exists) {
      const newAY: AcademicYear = {
        id: `ay_${Date.now()}`,
        name: targetAcademicYear,
        year: targetAcademicYear,
        semester: targetSemester,
        isActive: true,
        startDate: `${targetAcademicYear.split('/')[0]}-07-15`,
        endDate: `${targetAcademicYear.split('/')[1] || targetAcademicYear.split('/')[0]}-06-25`
      };
      setAcademicYears(prev => {
        const updated = [{ ...newAY }, ...prev.map(p => ({ ...p, isActive: false }))];
        try { localStorage.setItem('sim_academic_years', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
      try {
        setDoc(doc(db, 'academic_years', newAY.id), newAY);
      } catch (e) {}
    } else {
      setAcademicYears(prev => {
        const updated = prev.map(p => ({
          ...p,
          isActive: p.id === exists.id || p.name === targetAcademicYear
        }));
        try { localStorage.setItem('sim_academic_years', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    }

    // 4. Update school settings
    setActiveAcademicYearState(targetAcademicYear);
    setActiveSemesterState(targetSemester);
    const updatedSetting: SchoolSetting = {
      ...schoolSetting,
      currentAcademicYear: targetAcademicYear,
      currentSemester: targetSemester
    };
    setSchoolSetting(updatedSetting);
    try {
      localStorage.setItem('sim_school_setting', JSON.stringify(updatedSetting));
      setDoc(doc(db, 'schools', 'main_school'), updatedSetting, { merge: true });
    } catch (e) {}

    logAction(
      'ACADEMIC_YEAR_TRANSITION',
      'Tahun Ajaran',
      `Transisi Tahun Ajaran ${targetAcademicYear}: ${graduatedCount} siswa lulus (Alumni), ${promotedCount} siswa naik kelas.`
    );

    return { graduatedCount, promotedCount };
  };

  const updateSchoolSetting = async (data: Partial<SchoolSetting>) => {
    const targetId = 'main_school';
    const updated: SchoolSetting = {
      ...INITIAL_SCHOOL_SETTING,
      ...schoolSetting,
      ...data,
      id: targetId,
      name: (data.name !== undefined ? data.name : schoolSetting.name)?.trim() || INITIAL_SCHOOL_SETTING.name,
      address: (data.address !== undefined ? data.address : schoolSetting.address)?.trim() || INITIAL_SCHOOL_SETTING.address,
      centralInstitution: (data.centralInstitution !== undefined ? data.centralInstitution : schoolSetting.centralInstitution)?.trim() || INITIAL_SCHOOL_SETTING.centralInstitution,
      regionalInstitution: (data.regionalInstitution !== undefined ? data.regionalInstitution : schoolSetting.regionalInstitution)?.trim() || INITIAL_SCHOOL_SETTING.regionalInstitution,
      defaultCity: (data.defaultCity !== undefined ? data.defaultCity : schoolSetting.defaultCity)?.trim() || INITIAL_SCHOOL_SETTING.defaultCity || 'Bula',
      principalName: (data.principalName !== undefined ? data.principalName : schoolSetting.principalName)?.trim() || INITIAL_SCHOOL_SETTING.principalName,
      principalNip: (data.principalNip !== undefined ? data.principalNip : schoolSetting.principalNip)?.trim() || INITIAL_SCHOOL_SETTING.principalNip,
      wakaName: (data.wakaName || data.wakaKesiswaanName || schoolSetting.wakaName || schoolSetting.wakaKesiswaanName || INITIAL_SCHOOL_SETTING.wakaName).trim(),
      wakaKesiswaanName: (data.wakaKesiswaanName || data.wakaName || schoolSetting.wakaKesiswaanName || schoolSetting.wakaName || INITIAL_SCHOOL_SETTING.wakaKesiswaanName).trim(),
      wakaNip: (data.wakaNip !== undefined ? data.wakaNip : schoolSetting.wakaNip)?.trim() || INITIAL_SCHOOL_SETTING.wakaNip,
      pembinaOsim: (data.pembinaOsim !== undefined ? data.pembinaOsim : schoolSetting.pembinaOsim)?.trim() || INITIAL_SCHOOL_SETTING.pembinaOsim,
      pembinaOsimNip: (data.pembinaOsimNip !== undefined ? data.pembinaOsimNip : schoolSetting.pembinaOsimNip)?.trim() || INITIAL_SCHOOL_SETTING.pembinaOsimNip,
      phone: (data.phone !== undefined ? data.phone : schoolSetting.phone)?.trim() || INITIAL_SCHOOL_SETTING.phone,
      email: (data.email !== undefined ? data.email : schoolSetting.email)?.trim() || INITIAL_SCHOOL_SETTING.email,
      website: (data.website !== undefined ? data.website : schoolSetting.website)?.trim() || INITIAL_SCHOOL_SETTING.website,
      logoUrl: data.logoRightUrl || data.logoUrl || schoolSetting.logoRightUrl || schoolSetting.logoUrl || '',
      logoLeftUrl: (data.logoLeftUrl !== undefined ? data.logoLeftUrl : schoolSetting.logoLeftUrl) || '',
      logoRightUrl: (data.logoRightUrl !== undefined ? data.logoRightUrl : schoolSetting.logoRightUrl) || '',
      defaultSignaturesConfig: data.defaultSignaturesConfig !== undefined ? data.defaultSignaturesConfig : schoolSetting.defaultSignaturesConfig,
      isSignatureLocked: data.isSignatureLocked !== undefined ? data.isSignatureLocked : schoolSetting.isSignatureLocked,
      signatureLockedAt: data.signatureLockedAt !== undefined ? data.signatureLockedAt : schoolSetting.signatureLockedAt,
      signatureLockedBy: data.signatureLockedBy !== undefined ? data.signatureLockedBy : schoolSetting.signatureLockedBy
    };
    setSchoolSetting(updated);
    try {
      localStorage.setItem('sim_school_setting', JSON.stringify(updated));
      await setDoc(doc(db, 'schools', targetId), updated, { merge: true });
    } catch (e) {
      console.warn('Firestore update school notice (saved locally):', e);
    }
    logAction('UPDATE_SCHOOL_INFO', 'Pengaturan Sekolah', `Memperbarui profil dan identitas sekolah: ${updated.name}`);
  };

  // Student Operations
  const addStudent = async (data: Omit<Student, 'id' | 'createdAt'>): Promise<Student> => {
    const matchedClass = findMatchingClass(data.classId || data.className, classes);
    const newStudent: Student = {
      id: `s_${Date.now()}`,
      ...data,
      classId: matchedClass?.id || data.classId || (classes[0]?.id || 'c_default'),
      className: matchedClass?.name || data.className || (classes[0]?.name || 'X'),
      major: matchedClass?.major || data.major || 'Umum',
      violationPoints: 0,
      achievementPoints: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setStudents(prev => sortStudentsAlphabetically([newStudent, ...prev]));
    try {
      setDoc(doc(db, 'students', newStudent.id), newStudent);
    } catch (e) {}
    logAction('CREATE_STUDENT', 'Data Siswa', `Menambahkan data siswa baru: ${newStudent.fullName} (${newStudent.nis})`);
    return newStudent;
  };

  const updateStudent = async (id: string, data: Partial<Student>) => {
    const matchedClass = (data.classId || data.className) ? findMatchingClass(data.classId || data.className, classes) : undefined;
    const finalData = {
      ...data,
      ...(matchedClass ? {
        classId: matchedClass.id,
        className: matchedClass.name,
        major: data.major || matchedClass.major
      } : {})
    };
    setStudents(prev => sortStudentsAlphabetically(prev.map(s => s.id === id ? { ...s, ...finalData, updatedAt: new Date().toISOString() } : s)));
    try {
      updateDoc(doc(db, 'students', id), finalData);
    } catch (e) {}
    logAction('UPDATE_STUDENT', 'Data Siswa', `Memperbarui data siswa ID: ${id}`);
  };

  const deleteStudent = async (id: string) => {
    const target = students.find(s => s.id === id);

    // Tombstone
    addDeletedUid(id);
    addDeletedUid(`user_${id}`);
    if (target?.nis) {
      addDeletedUid(cleanDigits(target.nis));
      addDeletedUid(`user_${cleanDigits(target.nis)}`);
    }

    setStudents(prev => {
      const remaining = prev.filter(s => s.id !== id);
      try {
        localStorage.setItem('sim_students', JSON.stringify(remaining));
      } catch (e) {}
      return remaining;
    });

    try {
      await deleteDoc(doc(db, 'students', id)).catch(() => {});
      deleteDoc(doc(db, 'users', id)).catch(() => {});
      deleteDoc(doc(db, 'users', `user_${id}`)).catch(() => {});
      if (target?.nis) {
        deleteDoc(doc(db, 'users', cleanDigits(target.nis))).catch(() => {});
        deleteDoc(doc(db, 'users', `user_${cleanDigits(target.nis)}`)).catch(() => {});
      }
    } catch (e) {}

    // Cascade delete linked user account in cPanel if present
    if (target && deleteUser) {
      const matchedUser = allUsers.find(u =>
        isStudentUserMatch(u, target) ||
        u.uid === id ||
        u.uid === `user_${id}`
      );
      if (matchedUser) {
        try {
          await deleteUser(matchedUser.uid);
        } catch (e) {}
      }
    }

    logAction('DELETE_STUDENT', 'Data Siswa', `Mengarsipkan data siswa: ${target?.fullName || id}`);
  };

  const deleteStudentsBulk = async (ids: string[]) => {
    if (!ids || ids.length === 0) return 0;
    const idSet = new Set(ids);
    const targetStudents = students.filter(s => idSet.has(s.id));

    targetStudents.forEach(s => {
      addDeletedUid(s.id);
      addDeletedUid(`user_${s.id}`);
      if (s.nis) {
        addDeletedUid(cleanDigits(s.nis));
        addDeletedUid(`user_${cleanDigits(s.nis)}`);
      }
    });

    setStudents(prev => {
      const remaining = prev.filter(s => !idSet.has(s.id));
      try {
        localStorage.setItem('sim_students', JSON.stringify(remaining));
      } catch (e) {}
      return remaining;
    });

    // Remove active memberships in current extracurriculars
    setMembers(prev => {
      const remaining = prev.filter(m => !idSet.has(m.studentId));
      try { localStorage.setItem('sim_members', JSON.stringify(remaining)); } catch (e) {}
      return remaining;
    });

    // Permanently delete student records and linked user accounts from Firestore
    try {
      const deletePromises = ids.flatMap(id => [
        deleteDoc(doc(db, 'students', id)).catch(() => {}),
        deleteDoc(doc(db, 'users', id)).catch(() => {}),
        deleteDoc(doc(db, 'users', `user_${id}`)).catch(() => {})
      ]);
      targetStudents.forEach(s => {
        if (s.nis) {
          deletePromises.push(deleteDoc(doc(db, 'users', cleanDigits(s.nis))).catch(() => {}));
          deletePromises.push(deleteDoc(doc(db, 'users', `user_${cleanDigits(s.nis)}`)).catch(() => {}));
        }
      });
      await Promise.allSettled(deletePromises);
    } catch (e) {
      console.warn('Firestore bulk delete students error:', e);
    }

    // Cascade delete linked user accounts
    if (deleteUser) {
      for (const s of targetStudents) {
        const matchedUser = allUsers.find(u =>
          isStudentUserMatch(u, s) ||
          idSet.has(u.uid) ||
          idSet.has(u.uid.replace(/^user_/, ''))
        );
        if (matchedUser) {
          try {
            await deleteUser(matchedUser.uid);
          } catch (e) {}
        }
      }
    }

    logAction('BULK_DELETE_STUDENT', 'Data Siswa', `Mengarsipkan ${ids.length} siswa (Soft Delete)`);
    return ids.length;
  };

  const clearAllStudents = async () => {
    setStudents([]);
    try {
      localStorage.setItem('sim_students', JSON.stringify([]));
    } catch (e) {}
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'students'));
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      } catch (e) {
        console.warn('Firestore clear students note:', e);
      }
    })();
    logAction('CLEAR_STUDENTS', 'Data Siswa', 'Mengosongkan seluruh data siswa master');
  };

  const importStudentsBulk = async (
    importedList: Omit<Student, 'id' | 'createdAt'>[],
    mode: 'append' | 'replace' = 'append'
  ) => {
    // Auto-detect and register new classes from imported student class names if needed
    const existingClassNames = new Set(classes.map(c => c.name.trim().toLowerCase()));
    const newClassesToCreate: SchoolClass[] = [];

    importedList.forEach(s => {
      const cName = (s.className || '').trim();
      const existingMatch = findMatchingClass(cName, classes);
      if (cName && !existingMatch && !existingClassNames.has(cName.toLowerCase())) {
        existingClassNames.add(cName.toLowerCase());
        
        // Infer grade
        let grade: 'X' | 'XI' | 'XII' = 'X';
        const nameUpper = cName.toUpperCase();
        if (nameUpper.includes('XII') || nameUpper.startsWith('12')) {
          grade = 'XII';
        } else if (nameUpper.includes('XI') || nameUpper.startsWith('11')) {
          grade = 'XI';
        }

        // Infer major
        let major = s.major || 'Umum';
        if (!s.major) {
          if (nameUpper.includes('MIA') || nameUpper.includes('IPA')) major = 'MIPA (Matematika & IPA)';
          else if (nameUpper.includes('IIS') || nameUpper.includes('IPS')) major = 'IPS (Ilmu Sosial)';
          else if (nameUpper.includes('AGAMA') || nameUpper.includes('IIK')) major = 'Ilmu Keagamaan Islam';
          else if (nameUpper.includes('RPL') || nameUpper.includes('TKJ')) major = 'Teknik Komputer & Informatika';
        }

        newClassesToCreate.push({
          id: `c_auto_${Date.now()}_${newClassesToCreate.length}`,
          name: cName,
          grade,
          major,
          homeroomTeacher: 'Belum Ditentukan',
          studentCount: 0
        });
      }
    });

    const combinedClasses = [...newClassesToCreate, ...classes];
    const currentStudents = [...students];
    const activeYearStr = activeAcademicYear || schoolSetting?.currentAcademicYear || '2024/2025';

    // Smart Upsert: Cocokkan siswa berdasarkan NISN atau NIS
    const processedStudents: Student[] = [];

    importedList.forEach((s, idx) => {
      const matchedClass = findMatchingClass(s.classId || s.className, combinedClasses);
      const targetClassId = matchedClass?.id || s.classId || (combinedClasses[0]?.id || 'c_default');
      const targetClassName = matchedClass?.name || s.className || (combinedClasses[0]?.name || 'X');
      const targetMajor = matchedClass?.major || s.major || 'Umum';

      // Cari kecocokan di database yang sudah ada (NISN, NIS, Kode Siswa, atau Nama Lengkap yang dinormalisasi)
      const sNormName = normalizeName(s.fullName);
      const existing = currentStudents.find(curr => {
        if (curr.nisn && s.nisn && curr.nisn.trim() === s.nisn.trim()) return true;
        if (curr.nis && s.nis && curr.nis.trim() === s.nis.trim()) return true;
        if (curr.code && s.code && curr.code.trim().toUpperCase() === s.code.trim().toUpperCase()) return true;
        if (sNormName && sNormName.length >= 4 && normalizeName(curr.fullName) === sNormName) return true;
        return false;
      });

      const standardCode = s.code || existing?.code || formatStudentCode(activeYearStr, idx + 1);

      if (existing) {
        // UPDATE BIODATA (Pertahankan ID dan riwayat pelanggaran/prestasi)
        const updatedStudent: Student = {
          ...existing,
          ...s,
          id: existing.id,
          code: standardCode,
          classId: targetClassId,
          className: targetClassName,
          major: targetMajor,
          violationPoints: existing.violationPoints || 0,
          achievementPoints: existing.achievementPoints || 0,
          createdAt: existing.createdAt || new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString()
        };
        processedStudents.push(updatedStudent);
      } else {
        // INSERT BARU
        const newStudent: Student = {
          id: `s_${standardCode.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${idx}`,
          ...s,
          code: standardCode,
          classId: targetClassId,
          className: targetClassName,
          major: targetMajor,
          violationPoints: s.violationPoints || 0,
          achievementPoints: s.achievementPoints || 0,
          createdAt: new Date().toISOString().split('T')[0]
        };
        processedStudents.push(newStudent);
      }
    });

    if (newClassesToCreate.length > 0) {
      setClasses(prev => {
        const merged = [...prev, ...newClassesToCreate];
        try {
          localStorage.setItem('sim_classes', JSON.stringify(merged));
        } catch (e) {}
        return merged;
      });

      // Save new classes to Firestore
      try {
        const classPromises = newClassesToCreate.map(c => setDoc(doc(db, 'classes', c.id), c));
        await Promise.allSettled(classPromises);
      } catch (e) {}
    }

    let finalStudents: Student[] = [];
    if (mode === 'replace') {
      // Pada mode replace, data baru menggantikan total daftar siswa
      finalStudents = sortStudentsAlphabetically(processedStudents);

      // Hapus data siswa lama yang tidak ada dalam daftar baru dari Firestore secara permanen
      const newIds = new Set(finalStudents.map(s => s.id));
      const deletedOldStudents = currentStudents.filter(cs => !newIds.has(cs.id));
      if (deletedOldStudents.length > 0) {
        deletedOldStudents.forEach(oldS => {
          addDeletedUid(oldS.id);
          addDeletedUid(`user_${oldS.id}`);
          if (oldS.nis) {
            addDeletedUid(cleanDigits(oldS.nis));
            addDeletedUid(`user_${cleanDigits(oldS.nis)}`);
          }
          deleteDoc(doc(db, 'students', oldS.id)).catch(() => {});
          deleteDoc(doc(db, 'users', oldS.id)).catch(() => {});
          deleteDoc(doc(db, 'users', `user_${oldS.id}`)).catch(() => {});
        });
      }
    } else {
      // Pada mode append, gabungkan dengan siswa yang tidak tersentuh
      const processedIds = new Set(processedStudents.map(ps => ps.id));
      const untouchedStudents = currentStudents.filter(cs => !processedIds.has(cs.id));
      finalStudents = sortStudentsAlphabetically([...processedStudents, ...untouchedStudents]);
    }

    const { deduplicated: cleanFinalStudents, duplicateIds: importDupIds } = deduplicateStudentsList(finalStudents);
    const sortedFinal = sortStudentsAlphabetically(cleanFinalStudents);

    setStudents(sortedFinal);
    try {
      localStorage.setItem('sim_students', JSON.stringify(sortedFinal));
    } catch (e) {}

    if (importDupIds.length > 0) {
      importDupIds.forEach(dId => {
        deleteDoc(doc(db, 'students', dId)).catch(() => {});
      });
    }

    // Simpan / update ke Firestore tanpa menghapus relasi kunci
    try {
      const promises = finalStudents.map(student => 
        setDoc(doc(db, 'students', student.id), student, { merge: true })
      );
      await Promise.allSettled(promises);
    } catch (e) {
      console.warn('Firestore bulk upsert students note:', e);
    }

    // Auto-reconcile OSIM members with updated student records to prevent stale duplicate entries
    try {
      await reconcileOsimMembersWithMasterStudents(finalStudents);
    } catch (e) {
      console.warn('Auto-reconcile OSIM after student import note:', e);
    }

    logAction(
      'IMPORT_STUDENTS',
      'Data Siswa',
      `Mengimpor ${finalStudents.length} data siswa (Mode: ${mode === 'replace' ? 'Gantikan Total' : 'Tambahkan'})`
    );
    return finalStudents.length;
  };

  // Class / Rombel Operations
  const addClass = async (data: Omit<SchoolClass, 'id'>) => {
    const newClass: SchoolClass = {
      id: `c_${Date.now()}`,
      ...data
    };
    removeDeletedClassId(newClass.id);
    removeDeletedClassId(newClass.name);
    setClasses(prev => {
      const merged = [newClass, ...prev.filter(c => c.id !== newClass.id)];
      try {
        localStorage.setItem('sim_classes', JSON.stringify(merged));
      } catch (e) {}
      return merged;
    });
    try {
      setDoc(doc(db, 'classes', newClass.id), newClass);
    } catch (e) {}

    // Resiliently link existing students matching this class name
    setStudents(prev => {
      let hasChanges = false;
      const updated = prev.map(s => {
        if (isStudentInClass(s, newClass.name, [newClass]) && s.classId !== newClass.id) {
          hasChanges = true;
          return {
            ...s,
            classId: newClass.id,
            className: newClass.name,
            major: s.major || newClass.major
          };
        }
        return s;
      });
      if (hasChanges) {
        try { localStorage.setItem('sim_students', JSON.stringify(updated)); } catch (e) {}
        return updated;
      }
      return prev;
    });

    logAction('ADD_CLASS', 'Data Rombel', `Menambahkan rombel kelas baru: ${newClass.name} (${newClass.grade})`);
  };

  const updateClass = async (id: string, data: Partial<SchoolClass>) => {
    const oldClass = classes.find(c => c.id === id);
    setClasses(prev => {
      const merged = prev.map(c => c.id === id ? { ...c, ...data } : c);
      try {
        localStorage.setItem('sim_classes', JSON.stringify(merged));
      } catch (e) {}
      return merged;
    });
    try {
      updateDoc(doc(db, 'classes', id), data);
    } catch (e) {}

    // If class name changed, update students belonging to this class
    if (data.name && oldClass && data.name !== oldClass.name) {
      setStudents(prev => {
        const updated = prev.map(s => {
          if (s.classId === id || s.className === oldClass.name) {
            return {
              ...s,
              className: data.name!,
              classId: id,
              major: data.major || s.major
            };
          }
          return s;
        });
        try {
          localStorage.setItem('sim_students', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }

    logAction('UPDATE_CLASS', 'Data Rombel', `Memperbarui rombel kelas ID: ${id}`);
  };

  const deleteClass = async (id: string) => {
    addDeletedClassId(id);
    const target = classes.find(c => c.id === id);
    if (target?.name) {
      addDeletedClassId(target.name);
    }
    setClasses(prev => {
      const merged = prev.filter(c => c.id !== id);
      try {
        localStorage.setItem('sim_classes', JSON.stringify(merged));
      } catch (e) {}
      return merged;
    });
    try {
      deleteDoc(doc(db, 'classes', id));
    } catch (e) {}
    logAction('DELETE_CLASS', 'Data Rombel', `Menghapus rombel kelas: ${target?.name || id}`);
  };

  const deleteClassesBulk = async (ids: string[]) => {
    if (!ids || ids.length === 0) return 0;
    ids.forEach(id => {
      addDeletedClassId(id);
      const c = classes.find(item => item.id === id);
      if (c?.name) addDeletedClassId(c.name);
    });
    const idSet = new Set(ids);
    setClasses(prev => {
      const remaining = prev.filter(c => !idSet.has(c.id));
      try {
        localStorage.setItem('sim_classes', JSON.stringify(remaining));
      } catch (e) {}
      return remaining;
    });

    try {
      const promises = ids.map(id => deleteDoc(doc(db, 'classes', id)));
      await Promise.allSettled(promises);
    } catch (e) {
      console.warn('Firestore bulk delete classes error:', e);
    }

    logAction('DELETE_CLASSES_BULK', 'Data Rombel', `Menghapus massal ${ids.length} rombel kelas`);
    return ids.length;
  };

  const assignHomeroomTeacher = async (classId: string, teacherName: string, teacherId?: string) => {
    const targetClass = classes.find(c => c.id === classId);
    if (!targetClass) return;

    setClasses(prev => {
      const updated = prev.map(c => c.id === classId ? { ...c, homeroomTeacher: teacherName } : c);
      try {
        localStorage.setItem('sim_classes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      updateDoc(doc(db, 'classes', classId), { homeroomTeacher: teacherName });
    } catch (e) {}

    // If teacher exists, ensure teacher role or notes updated
    const matchedTeacher = teacherId 
      ? teachers.find(t => t.id === teacherId) 
      : teachers.find(t => t.fullName.toLowerCase() === teacherName.toLowerCase());
    
    if (matchedTeacher && matchedTeacher.role !== 'Wali Kelas' && matchedTeacher.role !== 'Waka Kesiswaan' && matchedTeacher.role !== 'Kepala Madrasah') {
      try {
        await updateTeacher(matchedTeacher.id, { role: 'Wali Kelas' });
      } catch (e) {}
    }

    logAction('ASSIGN_HOMEROOM_TEACHER', 'Data Rombel', `Menetapkan ${teacherName} sebagai Wali Kelas ${targetClass.name}`);
  };

  const clearAllClasses = async () => {
    classes.forEach(c => {
      addDeletedClassId(c.id);
      if (c.name) addDeletedClassId(c.name);
    });
    setClasses([]);
    try {
      localStorage.setItem('sim_classes', JSON.stringify([]));
    } catch (e) {}
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'classes'));
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      } catch (e) {
        console.warn('Firestore clear classes note:', e);
      }
    })();
    logAction('CLEAR_CLASSES', 'Data Rombel', 'Mengosongkan seluruh data rombel kelas');
  };

  const importClassesBulk = async (
    classList: SchoolClass[],
    mode: 'append' | 'replace' = 'append'
  ) => {
    // Un-tombstone newly imported classes
    classList.forEach(c => {
      removeDeletedClassId(c.id);
      if (c.name) removeDeletedClassId(c.name);
    });

    if (mode === 'replace') {
      const newClassIds = new Set(classList.map(c => c.id));
      classes.forEach(oldC => {
        if (!newClassIds.has(oldC.id)) {
          addDeletedClassId(oldC.id);
          if (oldC.name) addDeletedClassId(oldC.name);
        }
      });
      setClasses(classList);
      try {
        localStorage.setItem('sim_classes', JSON.stringify(classList));
        const oldSnap = await getDocs(collection(db, 'classes'));
        const deletePromises = oldSnap.docs.map(d => deleteDoc(doc(db, 'classes', d.id)));
        await Promise.allSettled(deletePromises);
        const insertPromises = classList.map(c => setDoc(doc(db, 'classes', c.id), c));
        await Promise.allSettled(insertPromises);
      } catch (e) {
        console.warn('Firestore import classes replace notice:', e);
      }
    } else {
      setClasses(prev => {
        const existingNames = new Set(prev.map(c => c.name.toLowerCase()));
        const uniqueNew = classList.filter(c => !existingNames.has(c.name.toLowerCase()));
        const merged = [...uniqueNew, ...prev];
        try {
          localStorage.setItem('sim_classes', JSON.stringify(merged));
        } catch (e) {}
        return merged;
      });

      try {
        const promises = classList.map(c => setDoc(doc(db, 'classes', c.id), c, { merge: true }));
        await Promise.allSettled(promises);
      } catch (e) {
        console.warn('Firestore import classes append notice:', e);
      }
    }

    logAction('IMPORT_CLASSES', 'Data Rombel', `Mengimpor ${classList.length} rombel kelas (${mode === 'replace' ? 'Gantikan Total' : 'Tambahkan'})`);
    return classList.length;
  };

  // Teachers Operations
  const addTeacher = async (data: Omit<Teacher, 'id'>) => {
    const assignedCode = normalizeTeacherCode(data.code, teachers.length + 1, data.fullName);
    const newT: Teacher = {
      id: `t_${assignedCode.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
      ...data,
      code: assignedCode
    };
    setTeachers(prev => {
      const merged = [newT, ...prev];
      try {
        localStorage.setItem('sim_teachers', JSON.stringify(merged));
      } catch (e) {}
      return merged;
    });
    try {
      await setDoc(doc(db, 'teachers', newT.id), newT);
    } catch (e) {
      console.warn('Firestore add teacher notice:', e);
    }

    // Auto-sync to Ekstrakurikuler & Intrakurikuler (OSIM, Wali Kelas, Activities, Settings)
    try {
      await syncTeacherToExtracurricularAndIntracurricular(newT);
    } catch (e) {
      console.warn('Sync teacher to ekskul/intra note:', e);
    }

    // Auto-sync to cPanel user accounts
    try {
      if (syncUsersFromTeachers) {
        await syncUsersFromTeachers([newT], extracurriculars);
      }
    } catch (e) {
      console.warn('Sync teacher to user account note:', e);
    }

    logAction('ADD_TEACHER', 'Dewan Guru & Manajemen', `Menambahkan data guru ${newT.fullName} dan menyinkronkan ke Ekstrakurikuler & Intrakurikuler`);
  };

  const updateTeacher = async (id: string, data: Partial<Teacher>) => {
    const oldTeacher = teachers.find(t => t.id === id);
    let updatedTeacher: Teacher | undefined;
    setTeachers(prev => {
      const merged = prev.map(t => {
        if (t.id === id) {
          updatedTeacher = { ...t, ...data };
          return updatedTeacher;
        }
        return t;
      });
      try {
        localStorage.setItem('sim_teachers', JSON.stringify(merged));
      } catch (e) {}
      return merged;
    });
    try {
      await updateDoc(doc(db, 'teachers', id), data);
    } catch (e) {
      console.warn('Firestore update teacher notice:', e);
    }

    if (updatedTeacher) {
      // Auto-sync to Ekstrakurikuler & Intrakurikuler
      try {
        await syncTeacherToExtracurricularAndIntracurricular(updatedTeacher, oldTeacher);
      } catch (e) {
        console.warn('Sync updated teacher to ekskul/intra note:', e);
      }

      // Auto-sync to cPanel user account
      if (syncUsersFromTeachers) {
        try {
          await syncUsersFromTeachers([updatedTeacher], extracurriculars);
        } catch (e) {}
      }
    }

    logAction('UPDATE_TEACHER', 'Dewan Guru & Manajemen', `Memperbarui data guru ID: ${id} dan menyinkronkan perubahan ke modul terkait`);
  };

  const deleteTeacher = async (id: string) => {
    const target = teachers.find(t => t.id === id);

    // Tombstone this teacher so sync won't recreate
    addDeletedUid(id);
    addDeletedUid(`user_${id}`);
    if (id.startsWith('user_')) addDeletedUid(id.replace(/^user_/, ''));
    if (target?.nip) {
      addDeletedUid(cleanDigits(target.nip));
      addDeletedUid(`user_${cleanDigits(target.nip)}`);
    }

    setTeachers(prev => {
      const merged = prev.filter(t => t.id !== id && (!target || !isTeacherUserMatch({ uid: t.id, displayName: t.fullName, nip: t.nip, email: t.email } as any, target)));
      try {
        localStorage.setItem('sim_teachers', JSON.stringify(merged));
      } catch (e) {}
      return merged;
    });

    try {
      await deleteDoc(doc(db, 'teachers', id)).catch(() => {});
      deleteDoc(doc(db, 'users', id)).catch(() => {});
      deleteDoc(doc(db, 'users', `user_${id}`)).catch(() => {});
      if (target?.nip) {
        deleteDoc(doc(db, 'users', cleanDigits(target.nip))).catch(() => {});
        deleteDoc(doc(db, 'users', `user_${cleanDigits(target.nip)}`)).catch(() => {});
      }
    } catch (e) {
      console.warn('Firestore delete teacher notice:', e);
    }

    // Cascade delete linked user account in cPanel
    if (target && deleteUser) {
      const matchedUser = allUsers.find(u =>
        isTeacherUserMatch(u, target) ||
        u.uid === id ||
        u.uid === `user_${id}` ||
        (target.email && u.email === target.email)
      );
      if (matchedUser) {
        try {
          await deleteUser(matchedUser.uid);
        } catch (e) {}
      }
    }

    // Auto-update any extracurricular that had this teacher as coach
    if (target) {
      setExtracurriculars(prev => {
        let changed = false;
        const updated = prev.map(ekskul => {
          if (ekskul.coachId === id || ekskul.coachName === target.fullName) {
            changed = true;
            return {
              ...ekskul,
              coachName: 'Belum Ditentukan',
              coachId: ''
            };
          }
          return ekskul;
        });
        if (changed) {
          try {
            localStorage.setItem('sim_extracurriculars', JSON.stringify(updated));
          } catch (e) {}
        }
        return updated;
      });
    }

    logAction('DELETE_TEACHER', 'Dewan Guru', `Menghapus data guru: ${target?.fullName || id}`);
  };

  const deleteTeachersBulk = async (ids: string[]) => {
    if (!ids || ids.length === 0) return 0;
    const idSet = new Set(ids);
    const targetTeachers = teachers.filter(t => idSet.has(t.id));
    const targetNames = new Set(targetTeachers.map(t => (t.fullName || '').trim().toLowerCase()));

    targetTeachers.forEach(t => {
      addDeletedUid(t.id);
      addDeletedUid(`user_${t.id}`);
      if (t.id.startsWith('user_')) addDeletedUid(t.id.replace(/^user_/, ''));
      if (t.nip) {
        addDeletedUid(cleanDigits(t.nip));
        addDeletedUid(`user_${cleanDigits(t.nip)}`);
      }
    });

    setTeachers(prev => {
      const remaining = prev.filter(t => !idSet.has(t.id));
      try {
        localStorage.setItem('sim_teachers', JSON.stringify(remaining));
      } catch (e) {}
      return remaining;
    });

    // Reset coach in extracurriculars
    setExtracurriculars(prev => {
      let changed = false;
      const updated = prev.map(ekskul => {
        if (idSet.has(ekskul.coachId) || targetNames.has((ekskul.coachName || '').trim().toLowerCase())) {
          changed = true;
          return { ...ekskul, coachName: 'Belum Ditentukan', coachId: '' };
        }
        return ekskul;
      });
      if (changed) {
        try { localStorage.setItem('sim_extracurriculars', JSON.stringify(updated)); } catch (e) {}
      }
      return updated;
    });

    // Reset homeroom teacher in classes
    setClasses(prev => {
      let changed = false;
      const updated = prev.map(cls => {
        if (targetNames.has((cls.homeroomTeacher || '').trim().toLowerCase())) {
          changed = true;
          return { ...cls, homeroomTeacher: 'Belum Ditentukan' };
        }
        return cls;
      });
      if (changed) {
        try { localStorage.setItem('sim_classes', JSON.stringify(updated)); } catch (e) {}
      }
      return updated;
    });

    try {
      const promises = ids.map(id => {
        deleteDoc(doc(db, 'teachers', id)).catch(() => {});
        deleteDoc(doc(db, 'users', id)).catch(() => {});
        deleteDoc(doc(db, 'users', `user_${id}`)).catch(() => {});
      });
      await Promise.allSettled(promises);
    } catch (e) {
      console.warn('Firestore bulk delete teachers error:', e);
    }

    // Cascade delete user accounts for all these teachers
    if (deleteUser) {
      for (const t of targetTeachers) {
        const matchedUser = allUsers.find(u =>
          isTeacherUserMatch(u, t) ||
          idSet.has(u.uid) ||
          idSet.has(u.uid.replace(/^user_/, '')) ||
          (t.email && u.email === t.email)
        );
        if (matchedUser) {
          try {
            await deleteUser(matchedUser.uid);
          } catch (e) {}
        }
      }
    }

    logAction('DELETE_TEACHERS_BULK', 'Dewan Guru', `Menghapus massal ${ids.length} data guru`);
    return ids.length;
  };

  const clearAllTeachers = async () => {
    setTeachers([]);
    try {
      localStorage.setItem('sim_teachers', JSON.stringify([]));
    } catch (e) {}
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'teachers'));
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      } catch (e) {
        console.warn('Firestore clear teachers note:', e);
      }
    })();
    logAction('CLEAR_TEACHERS', 'Dewan Guru', 'Mengosongkan seluruh data guru master');
  };

  const importTeachersBulk = async (
    importedList: Omit<Teacher, 'id'>[],
    mode: 'append' | 'replace' = 'append'
  ) => {
    // Smart Upsert: Cocokkan guru yang sudah ada berdasarkan Kode Guru, NIP, Email, atau Nama Lengkap
    const currentTeachers = [...teachers];
    const processedTeachers: Teacher[] = [];

    importedList.forEach((t, idx) => {
      const standardCode = normalizeTeacherCode(t.code, idx + 1, t.fullName);
      
      // Cari apakah guru ini sudah ada di database
      const existing = currentTeachers.find(curr => {
        if (curr.code && standardCode && curr.code.trim().toUpperCase() === standardCode.trim().toUpperCase()) return true;
        if (curr.nip && curr.nip !== '-' && t.nip && t.nip !== '-' && cleanDigits(curr.nip) === cleanDigits(t.nip)) return true;
        if (curr.email && t.email && curr.email.trim().toLowerCase() === t.email.trim().toLowerCase()) return true;
        if (curr.fullName && t.fullName && curr.fullName.trim().toLowerCase() === t.fullName.trim().toLowerCase()) return true;
        return false;
      });

      if (existing) {
        // UPDATE (Pertahankan ID dan relasi ekskul yang sudah ada)
        const updatedTeacher: Teacher = {
          ...existing,
          ...t,
          id: existing.id,
          code: standardCode,
          assignedExtracurriculars: (t.assignedExtracurriculars && t.assignedExtracurriculars.length > 0)
            ? t.assignedExtracurriculars
            : existing.assignedExtracurriculars,
          isActive: t.isActive !== false
        };
        processedTeachers.push(updatedTeacher);
      } else {
        // INSERT Baru dengan ID stabil
        const newTeacher: Teacher = {
          id: `t_${standardCode.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${idx}`,
          ...t,
          code: standardCode,
          isActive: t.isActive !== false
        };
        processedTeachers.push(newTeacher);
      }
    });

    let finalTeachers: Teacher[] = [];
    if (mode === 'replace') {
      // Pada mode replace, daftar baru menggantikan total daftar guru
      finalTeachers = deduplicateTeachersList(processedTeachers);

      // Hapus permanen data guru lama yang tidak ada di daftar baru dari Firestore & Akun Login
      const newIds = new Set(finalTeachers.map(t => t.id));
      const deletedOldTeachers = currentTeachers.filter(ct => !newIds.has(ct.id));
      if (deletedOldTeachers.length > 0) {
        deletedOldTeachers.forEach(oldT => {
          addDeletedUid(oldT.id);
          addDeletedUid(`user_${oldT.id}`);
          if (oldT.nip) {
            addDeletedUid(cleanDigits(oldT.nip));
            addDeletedUid(`user_${cleanDigits(oldT.nip)}`);
          }
          deleteDoc(doc(db, 'teachers', oldT.id)).catch(() => {});
          deleteDoc(doc(db, 'users', oldT.id)).catch(() => {});
          deleteDoc(doc(db, 'users', `user_${oldT.id}`)).catch(() => {});
        });
      }
    } else {
      // Pada mode append, gabungkan guru baru dengan sisa guru yang belum ada
      const processedIds = new Set(processedTeachers.map(pt => pt.id));
      const untouchedTeachers = currentTeachers.filter(ct => !processedIds.has(ct.id));
      finalTeachers = deduplicateTeachersList([...processedTeachers, ...untouchedTeachers]);
    }

    setTeachers(finalTeachers);
    try {
      localStorage.setItem('sim_teachers', JSON.stringify(finalTeachers));
    } catch (e) {}

    // Simpan/Perbarui record di Firestore tanpa menghapus relasi secara destruktif
    try {
      const upsertPromises = finalTeachers.map(teacher => 
        setDoc(doc(db, 'teachers', teacher.id), teacher, { merge: true })
      );
      await Promise.allSettled(upsertPromises);
    } catch (e) {
      console.warn('Firestore bulk upsert teachers note:', e);
    }

    // Auto-sync all imported teachers to Ekstrakurikuler & Intrakurikuler
    try {
      for (const t of finalTeachers) {
        await syncTeacherToExtracurricularAndIntracurricular(t);
      }
    } catch (err) {
      console.warn('Error syncing imported teachers to ekskul/intra:', err);
    }

    // Auto-sync imported teachers into cPanel user accounts
    try {
      if (syncUsersFromTeachers) {
        await syncUsersFromTeachers(finalTeachers, extracurriculars);
      }
    } catch (err) {
      console.warn('Error auto-syncing imported teachers to cPanel accounts:', err);
    }

    logAction(
      'IMPORT_TEACHERS',
      'Dewan Guru & Manajemen',
      `Mengimpor ${finalTeachers.length} data guru/pembina (Mode: ${mode === 'replace' ? 'Gantikan Total' : 'Tambahkan'})`
    );
    return finalTeachers.length;
  };

  // Synchronization Engine: Auto-sync Teacher & Pembina to Ekstrakurikuler & Intrakurikuler
  const syncTeacherToExtracurricularAndIntracurricular = async (
    teacher: Teacher,
    oldTeacher?: Teacher
  ) => {
    // 1. Ekstrakurikuler Synchronization
    const assigned = teacher.assignedExtracurriculars || [];
    const legacyName = teacher.extracurricularName ? [teacher.extracurricularName] : [];
    const allAssignedTargets = [...assigned, ...legacyName].map(s => s.trim().toLowerCase()).filter(Boolean);

    setExtracurriculars(prev => {
      let changed = false;
      const updated = prev.map(ekskul => {
        const isAssigned = allAssignedTargets.includes(ekskul.id.toLowerCase()) || 
                           allAssignedTargets.includes(ekskul.name.toLowerCase());

        // Case 1: Teacher is assigned to this ekskul
        if (isAssigned) {
          if (ekskul.coachId !== teacher.id || ekskul.coachName !== teacher.fullName) {
            changed = true;
            return {
              ...ekskul,
              coachId: teacher.id,
              coachName: teacher.fullName
            };
          }
        }
        // Case 2: Ekskul previously belonged to this teacher, and teacher's name/title changed
        else if (
          (ekskul.coachId === teacher.id || (oldTeacher && ekskul.coachName?.toLowerCase() === oldTeacher.fullName.toLowerCase())) &&
          ekskul.coachName !== teacher.fullName
        ) {
          if (teacher.isActive !== false) {
            changed = true;
            return {
              ...ekskul,
              coachId: teacher.id,
              coachName: teacher.fullName
            };
          }
        }
        // Case 3: Teacher was explicitly unassigned from this specific ekskul
        else if (
          oldTeacher && 
          (oldTeacher.assignedExtracurriculars || []).some(item => 
            item.toLowerCase() === ekskul.id.toLowerCase() || item.toLowerCase() === ekskul.name.toLowerCase()
          ) &&
          !isAssigned &&
          ekskul.coachId === teacher.id
        ) {
          changed = true;
          return {
            ...ekskul,
            coachName: 'Belum Ditentukan',
            coachId: ''
          };
        }

        return ekskul;
      });

      if (changed) {
        try {
          localStorage.setItem('sim_extracurriculars', JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });

    // 2. Intrakurikuler Synchronization (OSIM, Wali Kelas, Waka Kesiswaan, Activities, Counseling)
    const roleLower = (teacher.role || '').toLowerCase();

    // A. Pembina OSIM (Organisasi Siswa Intra Madrasah)
    if (roleLower.includes('osim') || roleLower.includes('pembina osim') || roleLower.includes('penasihat osim')) {
      setSchoolSetting(prev => {
        // If user has locked signatures, do NOT overwrite the signatures config
        const next: SchoolSetting = {
          ...prev,
          pembinaOsim: teacher.fullName,
          pembinaOsimNip: teacher.nip || prev.pembinaOsimNip || '-'
        };
        try {
          localStorage.setItem('sim_school_setting', JSON.stringify(next));
          setDoc(doc(db, 'schools', next.id || 'main_school'), next, { merge: true });
        } catch (e) {}
        return next;
      });
    }

    // B. Waka Kesiswaan
    if (roleLower.includes('waka') || roleLower.includes('kesiswaan')) {
      setSchoolSetting(prev => {
        // When Waka Kesiswaan is updated, keep the user's locked signatories intact if locked!
        const isLocked = prev.isSignatureLocked || prev.defaultSignaturesConfig?.isLockedByUser;
        
        // If not locked, we can adapt wakaName. If locked, keep the locked signatories intact.
        let updatedSignaturesConfig = prev.defaultSignaturesConfig;
        if (!isLocked && updatedSignaturesConfig?.signatories) {
          updatedSignaturesConfig = {
            ...updatedSignaturesConfig,
            signatories: updatedSignaturesConfig.signatories.map(s => {
              if (s.order === 1 || s.roleTitle.toLowerCase().includes('waka')) {
                return {
                  ...s,
                  name: teacher.fullName,
                  nipOrIdentifier: teacher.nip || s.nipOrIdentifier
                };
              }
              return s;
            })
          };
        }

        const next: SchoolSetting = {
          ...prev,
          wakaName: teacher.fullName,
          wakaKesiswaanName: teacher.fullName,
          wakaNip: teacher.nip || prev.wakaNip || '-',
          defaultSignaturesConfig: updatedSignaturesConfig
        };
        try {
          localStorage.setItem('sim_school_setting', JSON.stringify(next));
          setDoc(doc(db, 'schools', next.id || 'main_school'), next, { merge: true });
        } catch (e) {}
        return next;
      });
    }

    // C. Homeroom Teacher / Wali Kelas for Intracurricular Classes
    if (oldTeacher && oldTeacher.fullName !== teacher.fullName) {
      setClasses(prev => prev.map(c => {
        if (c.homeroomTeacher === oldTeacher.fullName) {
          return { ...c, homeroomTeacher: teacher.fullName };
        }
        return c;
      }));

      // D. Intracurricular / School Activities Organizer
      setActivities(prev => prev.map(act => {
        if (act.organizer === oldTeacher.fullName) {
          return { ...act, organizer: teacher.fullName };
        }
        return act;
      }));

      // E. Counseling & Home Visits
      setCounseling(prev => prev.map(c => {
        if (c.counselorName === oldTeacher.fullName) {
          return { ...c, counselorName: teacher.fullName };
        }
        return c;
      }));
      setHomeVisits(prev => prev.map(h => {
        if (h.counselorName === oldTeacher.fullName) {
          return { ...h, counselorName: teacher.fullName };
        }
        return h;
      }));
    }
  };

  const getRoleLabelFromUserRole = (role: UserRole): string => {
    switch (role) {
      case 'guru_bk':
        return 'Guru BK';
      case 'pembina_osim':
        return 'Pembina OSIM';
      case 'pembina_ekskul':
      case 'pembina':
        return 'Pembina Ekskul';
      case 'waka_kesiswaan':
        return 'Waka Kesiswaan';
      case 'super_admin':
        return 'Super Admin / Proktor';
      default:
        return 'Guru / Pembina';
    }
  };

  // cPanel Cross-Module Synchronization
  const syncUserFromCPanel = async (user: UserProfile, oldUser?: UserProfile) => {
    // If user was previously an OSIM officer and role changed to something else, remove from OSIM cabinet
    if (oldUser && oldUser.role === 'pengurus_osim' && user.role !== 'pengurus_osim') {
      setOsimMembers(prev => {
        const remaining = prev.filter(m => m.id !== user.uid && m.id !== oldUser.uid);
        try { localStorage.setItem('sim_osim_members', JSON.stringify(remaining)); } catch (e) {}
        return remaining;
      });
      deleteDoc(doc(db, 'osim_members', user.uid)).catch(() => {});
      if (oldUser.uid) deleteDoc(doc(db, 'osim_members', oldUser.uid)).catch(() => {});
    }

    // A. If this is an OSIM student account (pengurus_osim), sync to osimMembers, NOT teachers list
    if (user.role === 'pengurus_osim') {
      // Clean up from teachers list if previously was registered as teacher
      if (oldUser && oldUser.role !== 'pengurus_osim') {
        setTeachers(prev => {
          const filtered = prev.filter(t => t.id !== user.uid && t.id !== oldUser.uid);
          if (filtered.length !== prev.length) {
            try { localStorage.setItem('sim_teachers', JSON.stringify(filtered)); } catch (e) {}
            deleteDoc(doc(db, 'teachers', user.uid)).catch(() => {});
          }
          return filtered;
        });
      }

      setOsimMembers(prev => {
        const userSekbidNum = extractSekbidNumber(user.osimDepartmentCode) ||
          extractSekbidNumber(user.osimDepartmentName) ||
          extractSekbidNumber(user.osimPosition) ||
          extractSekbidNumber(user.username);

        const isUserBph = user.osimDepartmentCode === 'BPH' ||
          user.osimRole === 'ketua' ||
          user.osimRole === 'wakil' ||
          user.osimRole === 'sekretaris' ||
          user.osimRole === 'bendahara' ||
          user.username === 'osim.ketua' ||
          user.username === 'osim.wakil' ||
          user.username === 'osim.sekretaris' ||
          user.username === 'osim.bendahara';

        const idx = prev.findIndex(m => {
          if (m.id === user.uid) return true;
          if (user.nip && m.studentNis && m.studentNis.trim() === user.nip.trim()) return true;
          if (user.username && (m.loginUsername === user.username || m.username === user.username)) return true;

          // If user is a Sekbid account (1..8), match only the corresponding Sekbid
          if (userSekbidNum !== null) {
            const memberSekbidNum = extractSekbidNumber(m.sekbid) || extractSekbidNumber(m.position);
            if (memberSekbidNum === userSekbidNum) return true;
          }

          // If user is BPH (Ketua, Wakil, Sekretaris, Bendahara)
          if (isUserBph) {
            const memberIsBph = isBphMember(m);
            if (memberIsBph) {
              const pos = (m.position || '').toLowerCase();
              if (user.osimRole === 'ketua' || user.username === 'osim.ketua') {
                if (pos.includes('ketua') && !pos.includes('wakil') && !pos.includes('sekbid')) return true;
              }
              if (user.osimRole === 'wakil' || user.username === 'osim.wakil') {
                if (pos.includes('wakil')) return true;
              }
              if (user.osimRole === 'sekretaris' || user.username === 'osim.sekretaris') {
                if (pos.includes('sekretaris')) return true;
              }
              if (user.osimRole === 'bendahara' || user.username === 'osim.bendahara') {
                if (pos.includes('bendahara')) return true;
              }
            }
          }

          if (oldUser?.displayName && m.fullName.toLowerCase().trim() === oldUser.displayName.toLowerCase().trim()) return true;
          if (m.fullName.toLowerCase().trim() === user.displayName.toLowerCase().trim()) return true;
          if (user.osimDepartmentName && m.sekbid === user.osimDepartmentName) return true;
          return false;
        });

        const cleanName = user.displayName.replace(/\s*\(.*\)$/, '').trim() || user.displayName;
        if (idx >= 0) {
          const updated = [...prev];
          const updatedMember: OsimMember = {
            ...updated[idx],
            fullName: cleanName,
            studentNis: user.nip || updated[idx].studentNis,
            phone: user.phone || updated[idx].phone,
            email: user.email || updated[idx].email,
            status: user.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
            loginUsername: user.username,
            loginPassword: user.password,
            username: user.username,
            password: user.password,
            position: (user.osimPosition as any) || updated[idx].position,
            sekbid: isUserBph ? 'BPH (Badan Pengurus Harian)' : (normalizeSekbidName(user.osimDepartmentName) || updated[idx].sekbid),
            className: user.studentClass || updated[idx].className
          };
          updated[idx] = updatedMember;
          try {
            localStorage.setItem('sim_osim_members', JSON.stringify(updated));
            setDoc(doc(db, 'osim_members', updatedMember.id), updatedMember, { merge: true });
          } catch (e) {}
          return updated;
        } else {
          // If member does not exist in osimMembers yet, create it so Pembina can view and manage it
          const sekbidVal = isUserBph
            ? 'BPH (Badan Pengurus Harian)'
            : (normalizeSekbidName(user.osimDepartmentName) || (userSekbidNum ? `Sekbid ${userSekbidNum}` : 'Sekbid 1: Keimanan, Ketaqwaan & Moderasi Beragama'));
          const newMember: OsimMember = {
            id: user.uid,
            fullName: cleanName,
            studentNis: user.nip || '24251000',
            className: user.studentClass || 'XI MIPA 1',
            position: (user.osimPosition as any) || (isUserBph ? 'Pengurus BPH' : `Ketua ${user.osimDepartmentCode || 'Sekbid'}`),
            sekbid: sekbidVal,
            phone: user.phone || '-',
            email: user.email,
            status: user.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
            period: activeAcademicYear || '2026/2027',
            loginUsername: user.username,
            loginPassword: user.password,
            username: user.username,
            password: user.password,
            createdAt: new Date().toISOString()
          };
          const updated = [...prev, newMember];
          try {
            localStorage.setItem('sim_osim_members', JSON.stringify(updated));
            setDoc(doc(db, 'osim_members', newMember.id), newMember, { merge: true });
          } catch (e) {}
          return updated;
        }
      });
      return;
    }

    const roleLabel = getRoleLabelFromUserRole(user.role);
    const assignedIds = user.extracurricularIds || [];
    // Convert extracurricular IDs to human-readable names for teacher.assignedExtracurriculars
    const assignedNames = assignedIds.map(id => {
      const found = extracurriculars.find(e => e.id === id);
      return found ? found.name : id;
    });

    // 1. Sync Dewan Guru (teachers list)
    setTeachers(prev => {
      const idx = prev.findIndex(t => 
        t.id === user.uid ||
        (t.email && user.email && t.email.toLowerCase() === user.email.toLowerCase()) ||
        (t.nip && user.nip && t.nip.replace(/\s+/g, '') === user.nip.replace(/\s+/g, '')) ||
        (oldUser?.displayName && t.fullName.toLowerCase() === oldUser.displayName.toLowerCase()) ||
        t.fullName.toLowerCase() === user.displayName.toLowerCase()
      );

      if (idx >= 0) {
        const updated = [...prev];
        const updatedTeacher: Teacher = {
          ...updated[idx],
          fullName: user.displayName,
          nip: user.nip || updated[idx].nip || '-',
          email: user.email,
          phone: user.phone || updated[idx].phone || '-',
          role: roleLabel,
          assignedExtracurriculars: assignedNames,
          photoUrl: user.photoURL || (user as any).photoUrl || updated[idx].photoUrl,
          isActive: user.status !== 'Nonaktif'
        };
        updated[idx] = updatedTeacher;
        try {
          setDoc(doc(db, 'teachers', updatedTeacher.id), updatedTeacher, { merge: true });
        } catch (e) {}
        return updated;
      } else {
        const newTeacher: Teacher = {
          id: user.uid,
          fullName: user.displayName,
          nip: user.nip || '-',
          email: user.email,
          phone: user.phone || '-',
          role: roleLabel,
          assignedExtracurriculars: assignedNames,
          photoUrl: user.photoURL || (user as any).photoUrl,
          isActive: user.status !== 'Nonaktif'
        };
        try {
          setDoc(doc(db, 'teachers', newTeacher.id), newTeacher, { merge: true });
        } catch (e) {}
        return [newTeacher, ...prev];
      }
    });

    // 2. Sync Unit Ekstrakurikuler (advisor / coach)
    if (assignedIds.length > 0 || user.role === 'pembina_ekskul' || user.role === 'pembina') {
      setExtracurriculars(prev => prev.map(ekskul => {
        if (assignedIds.includes(ekskul.id)) {
          return {
            ...ekskul,
            coachId: user.uid,
            coachName: user.displayName
          };
        }
        if (oldUser && (ekskul.coachId === user.uid || ekskul.coachName === oldUser.displayName)) {
          return {
            ...ekskul,
            coachName: user.displayName
          };
        }
        return ekskul;
      }));
    } else if (oldUser && oldUser.displayName !== user.displayName) {
      setExtracurriculars(prev => prev.map(ekskul => {
        if (ekskul.coachId === user.uid || ekskul.coachName === oldUser.displayName) {
          return { ...ekskul, coachName: user.displayName };
        }
        return ekskul;
      }));
    }

    // 3. Sync Waka Kesiswaan in School Settings (Letterheads, Kop, Signatures)
    if (user.role === 'waka_kesiswaan') {
      setSchoolSetting(prev => {
        const nextSetting: SchoolSetting = {
          ...prev,
          wakaName: user.displayName,
          wakaKesiswaanName: user.displayName,
          wakaNip: user.nip || prev.wakaNip
        };
        localStorage.setItem('sim_school_setting', JSON.stringify(nextSetting));
        try {
          setDoc(doc(db, 'schools', nextSetting.id || 'main_school'), nextSetting, { merge: true });
        } catch (e) {}
        return nextSetting;
      });
    }

    // 4. Sync Guru BK in Counseling Sessions / Home Visits if name changed
    if (user.role === 'guru_bk' && oldUser && oldUser.displayName !== user.displayName) {
      setCounseling(prev => prev.map(c => {
        if (c.counselorName === oldUser.displayName) {
          return { ...c, counselorName: user.displayName };
        }
        return c;
      }));
      setHomeVisits(prev => prev.map(h => {
        if (h.counselorName === oldUser.displayName) {
          return { ...h, counselorName: user.displayName };
        }
        return h;
      }));
    }

    // 5. If this account is linked to a student (e.g. by NIS), sync phone without modifying student status or class
    if (user.nip && cleanDigits(user.nip).length >= 4) {
      const studentNis = cleanDigits(user.nip);
      setStudents(prev => {
        let changed = false;
        const updated = prev.map(s => {
          if (cleanDigits(s.nis) === studentNis) {
            if (user.phone && (!s.phone || s.phone === '-')) {
              changed = true;
              return { ...s, phone: user.phone };
            }
          }
          return s;
        });
        if (changed) {
          try { localStorage.setItem('sim_students', JSON.stringify(updated)); } catch (e) {}
        }
        return updated;
      });
    }

    logAction(
      'CPANEL_SYNC_USER',
      'cPanel Kesiswaan',
      `Sinkronisasi data akun ${user.displayName} (${roleLabel}) ke dewan guru, ekskul, dan modul terkait.`
    );
  };

  const syncDeleteUserFromCPanel = async (uid: string, user?: UserProfile) => {
    // 1. Record tombstones to ensure deleted users/entities are never resurrected
    addDeletedUid(uid);
    addDeletedUid(`user_${uid}`);
    if (uid.startsWith('user_')) addDeletedUid(uid.replace(/^user_/, ''));
    // Only tombstone NIP if it's a teacher/staff (never tombstone student NIS)
    if (user?.nip && user.role !== 'pengurus_osim' && !user.studentClass && user.nip.length >= 12) {
      addDeletedUid(cleanDigits(user.nip));
      addDeletedUid(`user_${cleanDigits(user.nip)}`);
    }
    if (user?.username && !user.username.startsWith('osim.') && !/^\d{4,}$/.test(user.username)) {
      addDeletedUid(user.username);
    }

    // 2. Identify and delete matching teacher record from state and Firestore
    let teacherDeletedId: string | null = null;
    const targetTeacher = teachers.find(t =>
      t.id === uid ||
      t.id === uid.replace(/^user_/, '') ||
      `user_${t.id}` === uid ||
      (user && isTeacherUserMatch(user, t))
    );

    if (targetTeacher) {
      teacherDeletedId = targetTeacher.id;
      addDeletedUid(targetTeacher.id);
      if (targetTeacher.nip) addDeletedUid(cleanDigits(targetTeacher.nip));
      try {
        await deleteDoc(doc(db, 'teachers', targetTeacher.id));
        deleteDoc(doc(db, 'teachers', `user_${targetTeacher.id}`)).catch(() => {});
      } catch (e) {}
    }

    setTeachers(prev => {
      const remaining = prev.filter(t => {
        if (t.id === uid || t.id === uid.replace(/^user_/, '') || `user_${t.id}` === uid) return false;
        if (teacherDeletedId && t.id === teacherDeletedId) return false;
        if (user && isTeacherUserMatch(user, t)) return false;
        return true;
      });
      try {
        localStorage.setItem('sim_teachers', JSON.stringify(remaining));
      } catch (e) {}
      return remaining;
    });

    // 3. User accounts in cPanel are for staff, teachers, and OSIM officers.
    // CRITICAL INTEGRITY RULE: Deleting a user account in cPanel MUST NEVER delete the student record from the master students database.
    // As explicitly required: "user hanya menghapusnya dari anggota bukan menghapusnya sebagai siswa. Jika user tidak menghapus siswa, maka siswa tidak akan terhapus."
    // Students can ONLY be deleted explicitly from the "Data Siswa" master management module.

    // 4. Reset extracurricular coach if assigned
    if (user || targetTeacher) {
      const coachName = user?.displayName || targetTeacher?.fullName;
      setExtracurriculars(prev => {
        const updated = prev.map(ekskul => {
          if (
            ekskul.coachId === uid ||
            (targetTeacher && ekskul.coachId === targetTeacher.id) ||
            (coachName && ekskul.coachName === coachName)
          ) {
            return { ...ekskul, coachName: 'Belum Ditentukan', coachId: '' };
          }
          return ekskul;
        });
        try { localStorage.setItem('sim_extracurriculars', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    }

    // 5. Delete matching OSIM member from state and Firestore
    const matchedOsimIds: string[] = [];
    osimMembers.forEach(m => {
      let isMatch = false;
      if (m.id === uid) isMatch = true;
      if (user) {
        if (isOsimMemberUserMatch(user, m)) isMatch = true;
        if (m.loginUsername && user.username && m.loginUsername.toLowerCase() === user.username.toLowerCase()) isMatch = true;
        if (m.username && user.username && m.username.toLowerCase() === user.username.toLowerCase()) isMatch = true;
        if (m.studentNis && user.nip && cleanDigits(m.studentNis) === cleanDigits(user.nip)) isMatch = true;
      }
      if (isMatch) {
        matchedOsimIds.push(m.id);
        addDeletedUid(m.id);
        // CRITICAL: Never tombstone m.studentNis! The student is an active student in the school.
        if (m.loginUsername && !m.loginUsername.startsWith('osim.') && !/^\d{4,}$/.test(m.loginUsername)) {
          addDeletedUid(m.loginUsername);
        }
      }
    });

    for (const osimId of matchedOsimIds) {
      try {
        await deleteDoc(doc(db, 'osim_members', osimId));
      } catch (e) {}
    }
    try {
      await deleteDoc(doc(db, 'osim_members', uid));
    } catch (e) {}

    setOsimMembers(prev => {
      const remaining = prev.filter(m => !matchedOsimIds.includes(m.id) && m.id !== uid);
      try {
        localStorage.setItem('sim_osim_members', JSON.stringify(remaining));
      } catch (e) {}
      return remaining;
    });

    logAction(
      'CPANEL_DELETE_SYNC',
      'cPanel Kesiswaan',
      `Sinkronisasi penghapusan akun ${user?.displayName || uid} pada seluruh modul (Guru, OSIM, Ekskul). Data pokok siswa di kelas tetap aman.`
    );
  };

  const syncAllCPanelUsers = async (users: UserProfile[]) => {
    for (const u of users) {
      await syncUserFromCPanel(u);
    }
    // Also perform reverse sync for teachers list to cPanel user accounts
    if (syncUsersFromTeachers && teachers.length > 0) {
      await syncUsersFromTeachers(teachers, extracurriculars);
    }
    // Also perform reverse sync for OSIM cabinet to cPanel user accounts
    if (syncUsersFromOsim && osimDepartments.length > 0) {
      await syncUsersFromOsim(osimDepartments, osimMembers);
    }
  };

  // Extracurricular Operations
  const addExtracurricular = async (data: Omit<Extracurricular, 'id'>) => {
    // Relational Integrity: Safely link with master Teacher
    const teacher = resolveTeacher(teachers, { id: data.coachId, code: data.coachCode, name: data.coachName });
    const targetCoachId = teacher?.id || data.coachId;
    const finalCoachCode = teacher?.code || data.coachCode;
    const finalCoachName = teacher?.fullName || data.coachName;

    const newEkskul: Extracurricular = {
      id: `ekskul_${Date.now()}`,
      ...data,
      coachId: targetCoachId,
      coachCode: finalCoachCode,
      coachName: finalCoachName
    };
    setExtracurriculars(prev => {
      const merged = [newEkskul, ...prev];
      try {
        localStorage.setItem('sim_extracurriculars', JSON.stringify(merged));
      } catch (e) {}
      return merged;
    });
    try {
      setDoc(doc(db, 'extracurriculars', newEkskul.id), newEkskul);
    } catch (e) {}

    // Reverse sync: assign this ekskul to the matching teacher in teachers state
    if (newEkskul.coachId || newEkskul.coachName) {
      setTeachers(prev => {
        let changed = false;
        const updated = prev.map(t => {
          if (t.id === newEkskul.coachId || t.fullName.toLowerCase() === newEkskul.coachName?.toLowerCase()) {
            const currentAssigned = t.assignedExtracurriculars || [];
            if (!currentAssigned.includes(newEkskul.name)) {
              changed = true;
              return {
                ...t,
                assignedExtracurriculars: [...currentAssigned, newEkskul.name]
              };
            }
          }
          return t;
        });
        if (changed) {
          try {
            localStorage.setItem('sim_teachers', JSON.stringify(updated));
          } catch (e) {}
        }
        return updated;
      });
    }

    logAction('CREATE_EXTRACURRICULAR', 'Ekstrakurikuler', `Menambahkan ekstrakurikuler baru: ${newEkskul.name}`);
  };

  const updateExtracurricular = async (id: string, data: Partial<Extracurricular>) => {
    const oldEkskul = extracurriculars.find(e => e.id === id);
    setExtracurriculars(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, ...data } : e);
      try {
        localStorage.setItem('sim_extracurriculars', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    try {
      updateDoc(doc(db, 'extracurriculars', id), data);
    } catch (e) {}

    // Reverse sync coach assignments to teachers list
    const newCoachId = data.coachId;
    const newCoachName = data.coachName;
    const ekskulName = data.name || oldEkskul?.name;

    if (ekskulName && (newCoachId !== undefined || newCoachName !== undefined)) {
      setTeachers(prev => {
        let changed = false;
        const updated = prev.map(t => {
          const isNewCoach = (newCoachId && t.id === newCoachId) || (newCoachName && t.fullName.toLowerCase() === newCoachName.toLowerCase());
          const isOldCoach = oldEkskul && ((oldEkskul.coachId && t.id === oldEkskul.coachId) || (oldEkskul.coachName && t.fullName.toLowerCase() === oldEkskul.coachName.toLowerCase()));

          if (isNewCoach) {
            const current = t.assignedExtracurriculars || [];
            if (!current.includes(ekskulName)) {
              changed = true;
              return { ...t, assignedExtracurriculars: [...current, ekskulName] };
            }
          } else if (isOldCoach && !isNewCoach) {
            const current = t.assignedExtracurriculars || [];
            if (current.includes(ekskulName)) {
              changed = true;
              return { ...t, assignedExtracurriculars: current.filter(item => item !== ekskulName) };
            }
          }
          return t;
        });
        if (changed) {
          try {
            localStorage.setItem('sim_teachers', JSON.stringify(updated));
          } catch (e) {}
        }
        return updated;
      });
    }

    logAction('UPDATE_EXTRACURRICULAR', 'Ekstrakurikuler', `Memperbarui profil ekstrakurikuler ID: ${id}`);
  };

  const deleteExtracurricular = async (id: string) => {
    const target = extracurriculars.find(e => e.id === id);
    setExtracurriculars(prev => {
      const filtered = prev.filter(e => e.id !== id);
      try {
        localStorage.setItem('sim_extracurriculars', JSON.stringify(filtered));
      } catch (e) {}
      return filtered;
    });
    try {
      deleteDoc(doc(db, 'extracurriculars', id));
    } catch (e) {}

    // Clean up member registrations for this deleted extracurricular, but NEVER touch master students or classes!
    setMembers(prev => {
      const remaining = prev.filter(m => m.extracurricularId !== id);
      try {
        localStorage.setItem('sim_members', JSON.stringify(remaining));
      } catch (e) {}
      return remaining;
    });
    try {
      const q = query(collection(db, 'extracurricular_members'), where('extracurricularId', '==', id));
      getDocs(q).then(snap => {
        snap.forEach(d => deleteDoc(d.ref).catch(() => {}));
      }).catch(() => {});
    } catch (e) {}

    if (target) {
      setTeachers(prev => {
        let changed = false;
        const updated = prev.map(t => {
          if (t.assignedExtracurriculars && t.assignedExtracurriculars.includes(target.name)) {
            changed = true;
            return {
              ...t,
              assignedExtracurriculars: t.assignedExtracurriculars.filter(item => item !== target.name)
            };
          }
          return t;
        });
        if (changed) {
          try {
            localStorage.setItem('sim_teachers', JSON.stringify(updated));
          } catch (e) {}
        }
        return updated;
      });
    }

    logAction('DELETE_EXTRACURRICULAR', 'Ekstrakurikuler', `Menghapus ekstrakurikuler: ${target?.name || id} (Data siswa di kelas tetap aman)`);
  };

  // Member Operations
  const addMember = async (data: Omit<ExtracurricularMember, 'id'>) => {
    // Relational Integrity: Safely link with master Student
    const student = resolveStudent(students, { id: data.studentId, code: data.studentCode, nis: data.studentNis, name: data.studentName });
    const targetStudentId = student?.id || data.studentId;
    const finalStudentCode = student?.code || data.studentCode;
    const finalStudentName = student?.fullName || data.studentName;
    const finalStudentClass = student?.className || data.studentClass;
    const finalStudentNis = student?.nis || data.studentNis;

    const newMember: ExtracurricularMember = {
      id: `m_${Date.now()}`,
      ...data,
      studentId: targetStudentId,
      studentCode: finalStudentCode,
      studentName: finalStudentName,
      studentClass: finalStudentClass,
      studentNis: finalStudentNis
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
      setDoc(doc(db, 'extracurricular_members', newMember.id), newMember);
    } catch (e) {}
    logAction('ADD_MEMBER', 'Anggota Ekstrakurikuler', `Menambahkan anggota: ${finalStudentName} ke ${data.extracurricularName || data.extracurricularId}`);
  };

  const removeMember = async (id: string) => {
    const target = members.find(m => m.id === id);
    setMembers(prev => {
      const remaining = prev.filter(m => m.id !== id);
      try {
        localStorage.setItem('sim_members', JSON.stringify(remaining));
      } catch (e) {}
      return remaining;
    });
    if (target) {
      setExtracurriculars(prev => {
        const updated = prev.map(e => {
          if (e.id === target.extracurricularId) {
            return { ...e, memberCount: Math.max(0, (e.memberCount || 1) - 1) };
          }
          return e;
        });
        try {
          localStorage.setItem('sim_extracurriculars', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }
    try {
      deleteDoc(doc(db, 'extracurricular_members', id));
    } catch (e) {}
    logAction('REMOVE_MEMBER', 'Anggota Ekstrakurikuler', `Menghapus keanggotaan ekstrakurikuler: ${target?.studentName || id} (Data siswa tetap aman di kelas)`);
  };

  const updateMember = async (id: string, data: Partial<ExtracurricularMember>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
    try {
      updateDoc(doc(db, 'extracurricular_members', id), data);
    } catch (e) {}
  };

  const updateMemberStatus = async (id: string, status: 'Aktif' | 'Nonaktif' | 'Cuti' | 'Keluar') => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    try {
      localStorage.setItem('sim_members', JSON.stringify(members.map(m => m.id === id ? { ...m, status } : m)));
      updateDoc(doc(db, 'extracurricular_members', id), { status });
    } catch (e) {}
  };

  const deleteMembersBulk = async (ids: string[]) => {
    if (!ids || ids.length === 0) return 0;
    const idSet = new Set(ids);
    const targetMembers = members.filter(m => idSet.has(m.id));

    const ekskulCountDec: Record<string, number> = {};
    targetMembers.forEach(m => {
      if (m.extracurricularId) {
        ekskulCountDec[m.extracurricularId] = (ekskulCountDec[m.extracurricularId] || 0) + 1;
      }
    });

    setMembers(prev => {
      const remaining = prev.filter(m => !idSet.has(m.id));
      try {
        localStorage.setItem('sim_members', JSON.stringify(remaining));
      } catch (e) {}
      return remaining;
    });

    setExtracurriculars(prev => {
      const updated = prev.map(e => {
        const dec = ekskulCountDec[e.id] || 0;
        if (dec > 0) {
          return { ...e, memberCount: Math.max(0, (e.memberCount || 0) - dec) };
        }
        return e;
      });
      try {
        localStorage.setItem('sim_extracurriculars', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      const promises = ids.map(id => deleteDoc(doc(db, 'extracurricular_members', id)));
      await Promise.allSettled(promises);
    } catch (e) {
      console.warn('Firestore bulk delete members error:', e);
    }

    logAction('DELETE_MEMBERS_BULK', 'Anggota Ekstrakurikuler', `Menghapus massal ${ids.length} data anggota ekstrakurikuler`);
    return ids.length;
  };

  const updateMembersStatusBulk = async (ids: string[], status: 'Aktif' | 'Cuti' | 'Keluar') => {
    if (!ids || ids.length === 0) return 0;
    const idSet = new Set(ids);

    setMembers(prev => {
      const updated = prev.map(m => idSet.has(m.id) ? { ...m, status } : m);
      try {
        localStorage.setItem('sim_members', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      const promises = ids.map(id => updateDoc(doc(db, 'extracurricular_members', id), { status }));
      await Promise.allSettled(promises);
    } catch (e) {
      console.warn('Firestore bulk update members status error:', e);
    }

    logAction('UPDATE_MEMBERS_STATUS_BULK', 'Anggota Ekstrakurikuler', `Memperbarui status massal ${ids.length} anggota menjadi ${status}`);
    return ids.length;
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
      setDoc(doc(db, 'schedules', newEvent.id), newEvent);
    } catch (e) {}
    logAction('CREATE_SCHEDULE', 'Jadwal', `Membuat jadwal kegiatan: ${newEvent.title} pada ${newEvent.date}`);
    return { success: true };
  };

  const updateSchedule = async (id: string, data: Partial<ScheduleEvent>) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    try {
      updateDoc(doc(db, 'schedules', id), data);
    } catch (e) {}
    return { success: true };
  };

  const deleteSchedule = async (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    try {
      deleteDoc(doc(db, 'schedules', id));
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
      setDoc(doc(db, 'attendance', newSession.id), newSession);
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
      setDoc(doc(db, 'activities', newAct.id), newAct);
    } catch (e) {}
    logAction('CREATE_ACTIVITY', 'Kegiatan Siswa', `Mendaftarkan agenda kegiatan: ${newAct.title}`);
  };

  const updateActivity = async (id: string, data: Partial<SchoolActivity>) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
    try {
      updateDoc(doc(db, 'activities', id), data);
    } catch (e) {}
    logAction('UPDATE_ACTIVITY', 'Kegiatan Siswa', `Memperbarui status/data kegiatan ID: ${id}`);
  };

  const deleteActivity = async (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
    try {
      deleteDoc(doc(db, 'activities', id));
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
      setDoc(doc(db, 'activity_reports', newRep.id), newRep);
    } catch (e) {}
    logAction('CREATE_REPORT', 'Laporan Kegiatan', `Mengajukan laporan kegiatan: ${newRep.activityTitle}`);
  };

  const updateReport = async (id: string, data: Partial<ActivityReport>) => {
    setActivityReports(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    try {
      updateDoc(doc(db, 'activity_reports', id), data);
    } catch (e) {}
  };

  const deleteActivityReport = async (id: string) => {
    setActivityReports(prev => prev.filter(r => r.id !== id));
    try {
      deleteDoc(doc(db, 'activity_reports', id));
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
      updateDoc(doc(db, 'activity_reports', id), {
        status,
        feedback,
        approvedBy: currentUser?.displayName || 'Waka Kesiswaan',
        approvedAt: new Date().toISOString().split('T')[0]
      });
    } catch (e) {}
    logAction('REVIEW_REPORT', 'Laporan Kegiatan', `Verifikasi laporan ID ${id} menjadi [${status}]`);
  };

  // Violations & Points
  const syncStudentViolationPoints = async (targetStudentId: string, currentViolationsList?: StudentViolation[]) => {
    if (!targetStudentId) return 0;
    const list = currentViolationsList || violations;
    const activeStudentViols = list.filter(v => 
      v.studentId === targetStudentId && 
      !v.isDeleted && 
      v.status !== 'Dibatalkan'
    );
    const calculatedPoints = activeStudentViols.reduce((sum, v) => sum + (Number(v.points) || 0), 0);

    // Update state in memory & localStorage
    setStudents(prev => {
      const updated = prev.map(s => s.id === targetStudentId ? { ...s, violationPoints: calculatedPoints } : s);
      try {
        localStorage.setItem('sim_students', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Update in Firestore
    try {
      await updateDoc(doc(db, 'students', targetStudentId), { violationPoints: calculatedPoints });
    } catch (e) {}

    return calculatedPoints;
  };

  const addViolation = async (data: Omit<StudentViolation, 'id' | 'createdAt'>) => {
    // Relational Integrity: Safely link with master Student
    const student = resolveStudent(students, { id: data.studentId, code: data.studentCode, nis: data.studentNis, name: data.studentName });
    const targetStudentId = student?.id || data.studentId;
    const finalStudentCode = student?.code || data.studentCode;
    const finalStudentName = student?.fullName || data.studentName;
    const finalStudentClass = student?.className || data.studentClass;
    const finalStudentNis = student?.nis || data.studentNis;

    const newViol: StudentViolation = {
      id: `v_${Date.now()}`,
      ...data,
      studentId: targetStudentId,
      studentCode: finalStudentCode,
      studentName: finalStudentName,
      studentClass: finalStudentClass,
      studentNis: finalStudentNis,
      isDeleted: false,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    const updatedViolations = [newViol, ...violations];
    setViolations(updatedViolations);
    
    // Atomically recalculate and sync student points
    await syncStudentViolationPoints(targetStudentId, updatedViolations);

    try {
      await setDoc(doc(db, 'violations', newViol.id), newViol);
    } catch (e) {}
    logAction('RECORD_VIOLATION', 'Pelanggaran Siswa', `Mencatat pelanggaran siswa: ${finalStudentName} (+${data.points} poin)`);
  };

  const updateViolation = async (id: string, data: Partial<StudentViolation>) => {
    let targetStudentId = '';
    const updatedViolations = violations.map(v => {
      if (v.id === id) {
        targetStudentId = v.studentId;
        return { ...v, ...data };
      }
      return v;
    });
    setViolations(updatedViolations);

    if (targetStudentId) {
      await syncStudentViolationPoints(targetStudentId, updatedViolations);
    }

    try {
      await updateDoc(doc(db, 'violations', id), data);
    } catch (e) {}
  };

  const deleteViolation = async (id: string) => {
    let targetStudentId = '';
    // Soft delete to protect relational history
    const updatedViolations = violations.map(v => {
      if (v.id === id) {
        targetStudentId = v.studentId;
        return { ...v, isDeleted: true, deletedAt: new Date().toISOString() };
      }
      return v;
    });

    // Keep only active violations in operational view
    setViolations(updatedViolations.filter(v => !v.isDeleted));

    if (targetStudentId) {
      await syncStudentViolationPoints(targetStudentId, updatedViolations);
    }

    try {
      await updateDoc(doc(db, 'violations', id), {
        isDeleted: true,
        deletedAt: new Date().toISOString()
      });
    } catch (e) {}
    logAction('DELETE_VIOLATION', 'Pelanggaran Siswa', `Mencabut/menghapus pelanggaran ID ${id}`);
  };

  const reconcileAllStudentPoints = async () => {
    let updatedCount = 0;
    const activeViolations = violations.filter(v => !v.isDeleted && v.status !== 'Dibatalkan');
    
    // Group active points by studentId
    const pointsMap = new Map<string, number>();
    for (const viol of activeViolations) {
      const current = pointsMap.get(viol.studentId) || 0;
      pointsMap.set(viol.studentId, current + (Number(viol.points) || 0));
    }

    const updatedStudents = students.map(s => {
      const realPoints = pointsMap.get(s.id) || 0;
      if ((s.violationPoints || 0) !== realPoints) {
        updatedCount++;
        try {
          updateDoc(doc(db, 'students', s.id), { violationPoints: realPoints });
        } catch (e) {}
        return { ...s, violationPoints: realPoints };
      }
      return s;
    });

    if (updatedCount > 0) {
      setStudents(updatedStudents);
      try {
        localStorage.setItem('sim_students', JSON.stringify(updatedStudents));
      } catch (e) {}
    }

    logAction('RECONCILE_POINTS', 'Integritas Data', `Rekonsiliasi poin selesai: ${updatedCount} siswa disinkronkan`);
    return { updatedCount };
  };

  // Counseling
  const addCounseling = async (data: Omit<StudentCounseling, 'id' | 'createdAt'>) => {
    // Relational Integrity: Safely link with master Student & Counselor
    const student = resolveStudent(students, { id: data.studentId, code: data.studentCode, nis: data.studentNis, name: data.studentName });
    const counselor = data.counselorId ? resolveTeacher(teachers, { id: data.counselorId, name: data.counselorName }) : undefined;

    const targetStudentId = student?.id || data.studentId;
    const finalStudentCode = student?.code || data.studentCode;
    const finalStudentName = student?.fullName || data.studentName;
    const finalStudentClass = student?.className || data.studentClass;
    const finalCounselorCode = counselor?.code || data.counselorCode;
    const finalCounselorName = counselor?.fullName || data.counselorName;

    const newCs: StudentCounseling = {
      id: `cs_${Date.now()}`,
      ...data,
      studentId: targetStudentId,
      studentCode: finalStudentCode,
      studentName: finalStudentName,
      studentClass: finalStudentClass,
      counselorCode: finalCounselorCode,
      counselorName: finalCounselorName,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setCounseling(prev => [newCs, ...prev]);
    try {
      setDoc(doc(db, 'counseling', newCs.id), newCs);
    } catch (e) {}
    logAction('RECORD_COUNSELING', 'Pembinaan & BK', `Mencatat sesi pembinaan siswa: ${finalStudentName}`);
  };

  const updateCounseling = async (id: string, data: Partial<StudentCounseling>) => {
    setCounseling(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    try {
      updateDoc(doc(db, 'counseling', id), data);
    } catch (e) {}
  };

  const deleteCounselingSession = async (id: string) => {
    setCounseling(prev => prev.filter(c => c.id !== id));
    try {
      deleteDoc(doc(db, 'counseling', id));
    } catch (e) {}
  };

  // Home Visit (Kunjungan Rumah BK)
  const addHomeVisit = async (data: Omit<HomeVisitRecord, 'id' | 'createdAt'>) => {
    const newHv: HomeVisitRecord = {
      id: `hv_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setHomeVisits(prev => [newHv, ...prev]);
    try {
      setDoc(doc(db, 'home_visits', newHv.id), newHv);
    } catch (e) {}
    logAction('RECORD_HOME_VISIT', 'Bimbingan Konseling', `Mencatat kunjungan rumah siswa: ${data.studentName}`);
  };

  const updateHomeVisit = async (id: string, data: Partial<HomeVisitRecord>) => {
    setHomeVisits(prev => prev.map(h => h.id === id ? { ...h, ...data } : h));
    try {
      updateDoc(doc(db, 'home_visits', id), data);
    } catch (e) {}
  };

  const deleteHomeVisit = async (id: string) => {
    setHomeVisits(prev => prev.filter(h => h.id !== id));
    try {
      deleteDoc(doc(db, 'home_visits', id));
    } catch (e) {}
  };

  // Surat Panggilan Orang Tua BK
  const addParentCallLetter = async (data: Omit<ParentCallLetter, 'id' | 'createdAt'>) => {
    const newLetter: ParentCallLetter = {
      id: `sp_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setParentCallLetters(prev => [newLetter, ...prev]);
    try {
      setDoc(doc(db, 'parent_call_letters', newLetter.id), newLetter);
    } catch (e) {}
    logAction('ISSUE_PARENT_CALL_LETTER', 'Bimbingan Konseling', `Menerbitkan surat panggilan orang tua No: ${data.letterNumber} untuk siswa ${data.studentName}`);
  };

  const updateParentCallLetter = async (id: string, data: Partial<ParentCallLetter>) => {
    setParentCallLetters(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
    try {
      updateDoc(doc(db, 'parent_call_letters', id), data);
    } catch (e) {}
  };

  const deleteParentCallLetter = async (id: string) => {
    setParentCallLetters(prev => prev.filter(l => l.id !== id));
    try {
      deleteDoc(doc(db, 'parent_call_letters', id));
    } catch (e) {}
  };

  // Bimbingan Karir BK
  const addCareerGuidance = async (data: Omit<CareerGuidanceRecord, 'id' | 'createdAt'>) => {
    const newCg: CareerGuidanceRecord = {
      id: `cg_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setCareerGuidances(prev => [newCg, ...prev]);
    try {
      setDoc(doc(db, 'career_guidances', newCg.id), newCg);
    } catch (e) {}
    logAction('RECORD_CAREER_GUIDANCE', 'Bimbingan Karir', `Mencatat asesmen peminatan karir siswa: ${data.studentName} (${data.careerInterest})`);
  };

  const updateCareerGuidance = async (id: string, data: Partial<CareerGuidanceRecord>) => {
    setCareerGuidances(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    try {
      updateDoc(doc(db, 'career_guidances', id), data);
    } catch (e) {}
  };

  const deleteCareerGuidance = async (id: string) => {
    setCareerGuidances(prev => prev.filter(c => c.id !== id));
    try {
      deleteDoc(doc(db, 'career_guidances', id));
    } catch (e) {}
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
      setDoc(doc(db, 'achievements', newAch.id), newAch);
    } catch (e) {}
    logAction('RECORD_ACHIEVEMENT', 'Prestasi Siswa', `Mencatat prestasi: ${data.title} oleh ${data.studentName}`);
  };

  const updateAchievement = async (id: string, data: Partial<StudentAchievement>) => {
    setAchievements(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
    try {
      updateDoc(doc(db, 'achievements', id), data);
    } catch (e) {}
  };

  const deleteAchievement = async (id: string, _arg2?: any, _arg3?: any) => {
    setAchievements(prev => prev.filter(a => a.id !== id));
    try {
      deleteDoc(doc(db, 'achievements', id));
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
      setDoc(doc(db, 'permissions', newPerm.id), newPerm);
    } catch (e) {}
    logAction('RECORD_PERMISSION', 'Perizinan Siswa', `Mengajukan perizinan siswa: ${data.studentName} (${data.type})`);
  };

  const updatePermission = async (id: string, data: Partial<StudentPermission>) => {
    setPermissions(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    try {
      updateDoc(doc(db, 'permissions', id), data);
    } catch (e) {}
  };

  const deletePermission = async (id: string) => {
    setPermissions(prev => prev.filter(p => p.id !== id));
    try {
      deleteDoc(doc(db, 'permissions', id));
    } catch (e) {}
  };

  const updatePermissionStatus = async (id: string, status: 'Menunggu' | 'Disetujui' | 'Ditolak' | 'Selesai') => {
    setPermissions(prev => prev.map(p => p.id === id ? { ...p, status, approvedBy: currentUser?.displayName } : p));
    try {
      updateDoc(doc(db, 'permissions', id), { status, approvedBy: currentUser?.displayName });
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
      setDoc(doc(db, 'needs_requests', newNeed.id), newNeed);
    } catch (e) {}
    logAction('SUBMIT_NEEDS_REQUEST', 'Kebutuhan Ekstrakurikuler', `Mengajukan kebutuhan: ${data.itemName} (${data.extracurricularName})`);
  };

  const reviewNeedsRequest = async (id: string, status: 'Disetujui' | 'Ditolak' | 'Revisi', adminNotes?: string, approvedBudget?: number) => {
    setNeedsRequests(prev => prev.map(n => n.id === id ? { ...n, status, adminNotes, approvedBudget: approvedBudget ?? n.approvedBudget } : n));
    try {
      updateDoc(doc(db, 'needs_requests', id), { status, adminNotes, approvedBudget });
    } catch (e) {}
    logAction('REVIEW_NEEDS_REQUEST', 'Kebutuhan Ekstrakurikuler', `Verifikasi kebutuhan ID ${id} menjadi [${status}]`);
  };

  const deleteNeedsRequest = async (id: string) => {
    setNeedsRequests(prev => prev.filter(n => n.id !== id));
    try {
      deleteDoc(doc(db, 'needs_requests', id));
    } catch (e) {}
    logAction('DELETE_NEEDS_REQUEST', 'Kebutuhan Ekstrakurikuler', `Menghapus pengajuan kebutuhan ID ${id}`);
  };

  // Announcements
  const addAnnouncement = async (data: Omit<Announcement, 'id' | 'createdAt'>) => {
    const newAnn: Announcement = {
      id: `ann_${Date.now()}`,
      isActive: data.isActive !== undefined ? data.isActive : true,
      isPinned: data.isPinned !== undefined ? data.isPinned : false,
      ...data,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    try {
      setDoc(doc(db, 'announcements', newAnn.id), newAnn);
    } catch (e) {}
    logAction('CREATE_ANNOUNCEMENT', 'Pengumuman', `Membuat pengumuman: ${newAnn.title} (${newAnn.targetRole})`);
  };

  const updateAnnouncement = async (id: string, data: Partial<Announcement>) => {
    const updated = { ...data, updatedAt: new Date().toISOString().split('T')[0] };
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
    try {
      setDoc(doc(db, 'announcements', id), updated, { merge: true });
    } catch (e) {}
    logAction('UPDATE_ANNOUNCEMENT', 'Pengumuman', `Memperbarui pengumuman ID ${id}`);
  };

  const deleteAnnouncement = async (id: string) => {
    const target = announcements.find(a => a.id === id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    try {
      deleteDoc(doc(db, 'announcements', id));
    } catch (e) {}
    logAction('DELETE_ANNOUNCEMENT', 'Pengumuman', `Menghapus pengumuman: ${target?.title || id}`);
  };

  const toggleAnnouncementPin = async (id: string) => {
    const target = announcements.find(a => a.id === id);
    if (!target) return;
    const newPinned = !target.isPinned;
    await updateAnnouncement(id, { isPinned: newPinned });
  };

  const toggleAnnouncementStatus = async (id: string) => {
    const target = announcements.find(a => a.id === id);
    if (!target) return;
    const newStatus = target.isActive === false ? true : false;
    await updateAnnouncement(id, { isActive: newStatus });
  };

  const markAnnouncementAsRead = async (id: string, uid?: string) => {
    if (!id) return;
    const userKey = uid || currentUser?.uid || 'guest';
    const nowIso = new Date().toISOString();

    setAnnouncements(prev => prev.map(a => {
      if (a.id === id) {
        const readBy = { ...(a.readByUsers || {}), [userKey]: nowIso };
        return { ...a, readByUsers: readBy };
      }
      return a;
    }));

    try {
      const targetDoc = doc(db, 'announcements', id);
      setDoc(targetDoc, {
        readByUsers: { [userKey]: nowIso }
      }, { merge: true });
    } catch (e) {}
  };

  const markAllAnnouncementsAsReadForUser = async (ids: string[], uid?: string) => {
    if (!ids || ids.length === 0) return;
    const userKey = uid || currentUser?.uid || 'guest';
    const nowIso = new Date().toISOString();

    setAnnouncements(prev => prev.map(a => {
      if (ids.includes(a.id)) {
        const readBy = { ...(a.readByUsers || {}), [userKey]: nowIso };
        return { ...a, readByUsers: readBy };
      }
      return a;
    }));

    for (const annId of ids) {
      try {
        setDoc(doc(db, 'announcements', annId), {
          readByUsers: { [userKey]: nowIso }
        }, { merge: true });
      } catch (e) {}
    }
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const addNotification = (item: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      ...item,
      isRead: false,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setNotifications(prev => [newNotif, ...prev]);
    try {
      setDoc(doc(db, 'notifications', newNotif.id), newNotif);
    } catch (e) {}
  };

  // ==========================================
  // OSIM & INTRAKURIKULER HANDLERS
  // ==========================================

  // OSIM Members
  const addOsimMember = async (data: Omit<OsimMember, 'id' | 'createdAt'>) => {
    // Relational Integrity: Safely link with master Student
    const student = resolveStudent(students, { id: data.studentId, code: data.studentCode, nis: data.studentNis, name: data.fullName });
    const targetStudentId = student?.id || data.studentId;
    const finalStudentCode = student?.code || data.studentCode;
    const finalFullName = student?.fullName || data.fullName;
    const finalClassName = student?.className || data.className;
    const finalStudentNis = student?.nis || data.studentNis;

    const isBph = isBphMember(data as any);
    const finalSekbid = isBph
      ? 'BPH (Badan Pengurus Harian)'
      : (data.sekbid ? normalizeSekbidName(data.sekbid) : 'Sekbid 1: Keimanan, Ketaqwaan & Moderasi Beragama');

    const newMember: OsimMember = {
      id: `osim_m_${Date.now()}`,
      ...data,
      studentId: targetStudentId,
      studentCode: finalStudentCode,
      fullName: finalFullName,
      className: finalClassName,
      studentNis: finalStudentNis,
      sekbid: finalSekbid as any,
      createdAt: new Date().toISOString().split('T')[0]
    };

    // Ensure member and student NIS are NOT blocked by any old deleted state
    removeDeletedUid(newMember.id);
    removeDeletedUid(`user_${newMember.id}`);
    if (finalStudentNis) removeDeletedUid(cleanDigits(finalStudentNis));
    if (targetStudentId) removeDeletedUid(targetStudentId);
    if (newMember.loginUsername) removeDeletedUid(newMember.loginUsername);

    setOsimMembers(prev => [newMember, ...prev]);
    try {
      setDoc(doc(db, 'osim_members', newMember.id), newMember);
    } catch (e) {}
    logAction('ADD_OSIM_MEMBER', 'Intrakurikuler & OSIM', `Menambahkan pengurus OSIM: ${finalFullName} (${newMember.position})`);
  };

  const updateOsimMember = async (id: string, data: Partial<OsimMember>) => {
    removeDeletedUid(id);
    removeDeletedUid(`user_${id}`);
    if (data.studentNis) removeDeletedUid(cleanDigits(data.studentNis));
    if (data.studentId) removeDeletedUid(data.studentId);
    if (data.loginUsername) removeDeletedUid(data.loginUsername);

    const isBph = isBphMember(data as any);
    const normalizedData = {
      ...data,
      ...(isBph
        ? { sekbid: 'BPH (Badan Pengurus Harian)' as any }
        : (data.sekbid ? { sekbid: normalizeSekbidName(data.sekbid) as any } : {}))
    };

    setOsimMembers(prev => prev.map(m => m.id === id ? { ...m, ...normalizedData } : m));
    try {
      updateDoc(doc(db, 'osim_members', id), normalizedData);
    } catch (e) {}
    logAction('UPDATE_OSIM_MEMBER', 'Intrakurikuler & OSIM', `Memperbarui data pengurus OSIM ID ${id}`);
  };

  const deleteOsimMember = async (id: string) => {
    const target = osimMembers.find(m => m.id === id);

    // Tombstone OSIM record ID only, never tombstone generic OSIM login usernames or student NIS
    addDeletedUid(id);
    addDeletedUid(`user_${id}`);
    if (target?.loginUsername && !target.loginUsername.startsWith('osim.') && !/^\d{4,}$/.test(target.loginUsername)) {
      addDeletedUid(target.loginUsername);
    }

    setOsimMembers(prev => {
      const remaining = prev.filter(m => m.id !== id);
      try {
        localStorage.setItem('sim_osim_members', JSON.stringify(remaining));
      } catch (e) {}
      return remaining;
    });

    try {
      await deleteDoc(doc(db, 'osim_members', id));
      deleteDoc(doc(db, 'users', id)).catch(() => {});
      deleteDoc(doc(db, 'users', `user_${id}`)).catch(() => {});
    } catch (e) {}

    // Cascade delete linked user account in cPanel if present
    if (target && deleteUser) {
      const matchedUser = allUsers.find(u =>
        isOsimMemberUserMatch(u, target) ||
        u.uid === id ||
        u.uid === `user_${id}` ||
        (target.loginUsername && u.username === target.loginUsername)
      );
      if (matchedUser) {
        try {
          await deleteUser(matchedUser.uid);
        } catch (e) {}
      }
    }

    logAction('DELETE_OSIM_MEMBER', 'Intrakurikuler & OSIM', `Menghapus data pengurus OSIM: ${target?.fullName || id}`);
  };

  /**
   * Scans all OSIM members against the current master student list.
   * 1. Eliminates duplicate records (same NIS or same student holding duplicate roles or duplicate BPH slots).
   * 2. Updates class name, NIS, and full name if changed in the student database.
   * 3. Purges stale duplicate documents from Firestore.
   */
  const reconcileOsimMembersWithMasterStudents = async (customStudents?: Student[]): Promise<number> => {
    const studentList = customStudents || students;
    const currentList = [...osimMembers];
    const deduplicated = deduplicateOsimMembersList(currentList, studentList);

    const keptIds = new Set(deduplicated.map(m => m.id));
    const removedMembers = currentList.filter(m => !keptIds.has(m.id));

    // Update state & storage
    setOsimMembers(deduplicated);
    try {
      localStorage.setItem('sim_osim_members', JSON.stringify(deduplicated));
    } catch (e) {}

    // Synchronize to Firestore
    try {
      const updatePromises = deduplicated.map(m => setDoc(doc(db, 'osim_members', m.id), m, { merge: true }));
      const deletePromises = removedMembers.map(m => {
        addDeletedUid(m.id);
        addDeletedUid(`user_${m.id}`);
        if (m.loginUsername && !/^\d{4,}$/.test(m.loginUsername)) {
          addDeletedUid(m.loginUsername);
        }
        return deleteDoc(doc(db, 'osim_members', m.id));
      });
      await Promise.allSettled([...updatePromises, ...deletePromises]);
    } catch (e) {
      console.warn('Reconcile OSIM Firestore sync note:', e);
    }

    if (removedMembers.length > 0) {
      logAction(
        'RECONCILE_OSIM_MEMBERS',
        'Intrakurikuler & OSIM',
        `Membersihkan ${removedMembers.length} data duplikat/usang pengurus OSIM dan menyelaraskan dengan biodata siswa terbaru.`
      );
    }

    return removedMembers.length;
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
      setDoc(doc(db, 'osim_programs', newProg.id), newProg);
    } catch (e) {}
    logAction('ADD_OSIM_PROGRAM', 'Intrakurikuler & OSIM', `Membuat program kerja OSIM: ${newProg.title}`);
  };

  const updateOsimProgram = async (id: string, data: Partial<OsimWorkProgram>) => {
    setOsimPrograms(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    try {
      updateDoc(doc(db, 'osim_programs', id), data);
    } catch (e) {}
    logAction('UPDATE_OSIM_PROGRAM', 'Intrakurikuler & OSIM', `Memperbarui program kerja OSIM: ${data.title || id}`);
  };

  const deleteOsimProgram = async (id: string) => {
    setOsimPrograms(prev => prev.filter(p => p.id !== id));
    try {
      deleteDoc(doc(db, 'osim_programs', id));
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
      setDoc(doc(db, 'osim_aspirations', newAsp.id), newAsp);
    } catch (e) {}
    logAction('ADD_OSIM_ASPIRATION', 'Intrakurikuler & OSIM', `Mengirim aspirasi siswa: ${newAsp.title}`);
  };

  const updateOsimAspiration = async (id: string, data: Partial<OsimAspiration>) => {
    setOsimAspirations(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
    try {
      updateDoc(doc(db, 'osim_aspirations', id), data);
    } catch (e) {}
    logAction('UPDATE_OSIM_ASPIRATION', 'Intrakurikuler & OSIM', `Memperbarui respon aspirasi ID ${id}`);
  };

  const deleteOsimAspiration = async (id: string) => {
    setOsimAspirations(prev => prev.filter(a => a.id !== id));
    try {
      deleteDoc(doc(db, 'osim_aspirations', id));
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
      setDoc(doc(db, 'osim_meetings', newMeet.id), newMeet);
    } catch (e) {}
    logAction('ADD_OSIM_MEETING', 'Intrakurikuler & OSIM', `Mencatat notulensi rapat OSIM: ${newMeet.title}`);
  };

  const updateOsimMeeting = async (id: string, data: Partial<OsimMeeting>) => {
    setOsimMeetings(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
    try {
      updateDoc(doc(db, 'osim_meetings', id), data);
    } catch (e) {}
    logAction('UPDATE_OSIM_MEETING', 'Intrakurikuler & OSIM', `Memperbarui notulensi rapat OSIM: ${data.title || id}`);
  };

  const deleteOsimMeeting = async (id: string) => {
    setOsimMeetings(prev => prev.filter(m => m.id !== id));
    try {
      deleteDoc(doc(db, 'osim_meetings', id));
    } catch (e) {}
    logAction('DELETE_OSIM_MEETING', 'Intrakurikuler & OSIM', `Menghapus notulensi rapat OSIM ID ${id}`);
  };

  // OSIM Departments / Sekbid Management
  const addOsimDepartment = async (data: Omit<OsimDepartment, 'id' | 'createdAt'>) => {
    const newDept: OsimDepartment = {
      id: `dept_${Date.now()}`,
      ...data,
      sortOrder: data.sortOrder ?? (osimDepartments.length + 1),
      createdAt: new Date().toISOString().split('T')[0]
    };
    const next = [...osimDepartments, newDept];
    setOsimDepartments(next);
    try {
      localStorage.setItem('sim_osim_departments', JSON.stringify(next));
      setDoc(doc(db, 'osim_departments', newDept.id), newDept);
    } catch (e) {}
    logAction('ADD_OSIM_DEPARTMENT', 'Intrakurikuler & OSIM', `Menambahkan bidang/sekbid baru: ${newDept.name}`);
  };

  const updateOsimDepartment = async (id: string, data: Partial<OsimDepartment>) => {
    const oldDept = osimDepartments.find(d => d.id === id);
    const updatedName = data.name;
    const isNameChanged = oldDept && updatedName && oldDept.name !== updatedName;

    const next = osimDepartments.map(d => (d.id === id ? { ...d, ...data, updatedAt: new Date().toISOString() } : d));
    setOsimDepartments(next);
    try {
      localStorage.setItem('sim_osim_departments', JSON.stringify(next));
      updateDoc(doc(db, 'osim_departments', id), { ...data, updatedAt: new Date().toISOString() });
    } catch (e) {}

    // Cascade rename to members & proker if name changed
    if (isNameChanged && oldDept && updatedName) {
      setOsimMembers(prev => {
        const updated = prev.map(m => m.sekbid === oldDept.name ? { ...m, sekbid: updatedName } : m);
        try { localStorage.setItem('sim_osim_members', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
      setOsimPrograms(prev => {
        const updated = prev.map(p => p.sekbid === oldDept.name ? { ...p, sekbid: updatedName } : p);
        try { localStorage.setItem('sim_osim_programs', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    }

    logAction('UPDATE_OSIM_DEPARTMENT', 'Intrakurikuler & OSIM', `Memperbarui data bidang/sekbid: ${data.name || id}`);
  };

  const deleteOsimDepartment = async (id: string) => {
    const target = osimDepartments.find(d => d.id === id);
    if (!target) return;

    const next = osimDepartments.filter(d => d.id !== id);
    setOsimDepartments(next);
    try {
      localStorage.setItem('sim_osim_departments', JSON.stringify(next));
      deleteDoc(doc(db, 'osim_departments', id));
    } catch (e) {}

    // Reassign any members and proker in deleted department to first available or BPH
    const fallbackDept = next[0]?.name || 'BPH (Badan Pengurus Harian)';
    setOsimMembers(prev => {
      const updated = prev.map(m => m.sekbid === target.name ? { ...m, sekbid: fallbackDept } : m);
      try { localStorage.setItem('sim_osim_members', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    setOsimPrograms(prev => {
      const updated = prev.map(p => p.sekbid === target.name ? { ...p, sekbid: fallbackDept } : p);
      try { localStorage.setItem('sim_osim_programs', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    logAction('DELETE_OSIM_DEPARTMENT', 'Intrakurikuler & OSIM', `Menghapus bidang/sekbid kabinet: ${target.name}`);
  };

  const resetOsimDepartmentsToDefault = async () => {
    setOsimDepartments(INITIAL_OSIM_DEPARTMENTS);
    try {
      localStorage.setItem('sim_osim_departments', JSON.stringify(INITIAL_OSIM_DEPARTMENTS));
      for (const d of INITIAL_OSIM_DEPARTMENTS) {
        setDoc(doc(db, 'osim_departments', d.id), d);
      }
    } catch (e) {}
    logAction('RESET_OSIM_DEPARTMENTS', 'Intrakurikuler & OSIM', 'Mereset struktur bidang kabinet OSIM ke 8 Sekbid standar');
  };

  // ==========================================
  // NERACA KAS & KEUANGAN KESISWAAN HANDLERS
  // ==========================================

  // Cash Accounts
  const addCashAccount = async (data: Omit<CashAccount, 'id' | 'createdAt'>) => {
    const newAcc: CashAccount = {
      id: `kas_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setCashAccounts(prev => [newAcc, ...prev]);
    try {
      setDoc(doc(db, 'cash_accounts', newAcc.id), newAcc);
    } catch (e) {}
    logAction('ADD_CASH_ACCOUNT', 'Neraca Kas', `Membuat akun kas baru: ${newAcc.name} (${newAcc.code})`);
  };

  const updateCashAccount = async (id: string, data: Partial<CashAccount>) => {
    setCashAccounts(prev => prev.map(a => a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a));
    try {
      updateDoc(doc(db, 'cash_accounts', id), { ...data, updatedAt: new Date().toISOString() });
    } catch (e) {}
    logAction('UPDATE_CASH_ACCOUNT', 'Neraca Kas', `Memperbarui akun kas: ${data.name || id}`);
  };

  const deleteCashAccount = async (id: string) => {
    const target = cashAccounts.find(a => a.id === id);
    setCashAccounts(prev => prev.filter(a => a.id !== id));
    // Also remove associated transactions
    setCashTransactions(prev => prev.filter(t => t.accountId !== id));
    try {
      deleteDoc(doc(db, 'cash_accounts', id));
    } catch (e) {}
    logAction('DELETE_CASH_ACCOUNT', 'Neraca Kas', `Menghapus akun kas: ${target?.name || id}`);
  };

  const assignCashManager = async (accountId: string, userIds: string[], userNames?: string[]) => {
    const targetAcc = cashAccounts.find(a => a.id === accountId);
    if (!targetAcc) return;

    const updatedAcc = {
      ...targetAcc,
      assignedManagerUserIds: userIds,
      assignedManagerNames: userNames || [],
      updatedAt: new Date().toISOString()
    };

    setCashAccounts(prev => prev.map(a => a.id === accountId ? updatedAcc : a));
    try {
      setDoc(doc(db, 'cash_accounts', accountId), updatedAcc, { merge: true });
    } catch (e) {}

    // Update users' cash manager flags in users collection / localStorage
    try {
      const allUsersRaw = localStorage.getItem('sim_kesiswaan_all_users_registry');
      if (allUsersRaw) {
        const parsedUsers: UserProfile[] = JSON.parse(allUsersRaw);
        const updatedUsers = parsedUsers.map(u => {
          if (userIds.includes(u.uid)) {
            const currentScopes = u.cashFundScopes || [];
            const newScopes = Array.from(new Set([...currentScopes, accountId]));
            return {
              ...u,
              isCashManager: true,
              cashFundScopes: newScopes,
              cashManagerTitle: u.cashManagerTitle || `Pemegang ${targetAcc.name}`,
              updatedAt: new Date().toISOString()
            };
          }
          return u;
        });
        localStorage.setItem('sim_kesiswaan_all_users_registry', JSON.stringify(updatedUsers));
      }
    } catch (e) {}

    logAction('ASSIGN_CASH_AMANAH', 'Neraca Kas', `Mengamanahkan pengelolaan kas ${targetAcc.name} kepada: ${(userNames || userIds).join(', ')}`);
  };

  // Cash Transactions
  const addCashTransaction = async (data: Omit<CashTransaction, 'id' | 'createdAt'>) => {
    const autoRef = data.referenceNumber || (
      data.type === 'MASUK'
        ? `BKM-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(Date.now()).slice(-4)}`
        : `BKK-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(Date.now()).slice(-4)}`
    );

    const newTrx: CashTransaction = {
      id: `trx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...data,
      referenceNumber: autoRef,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setCashTransactions(prev => [newTrx, ...prev]);
    try {
      setDoc(doc(db, 'cash_transactions', newTrx.id), newTrx);
    } catch (e) {}
    logAction(
      data.type === 'MASUK' ? 'CASH_INFLOW' : 'CASH_OUTFLOW',
      'Neraca Kas',
      `Mencatat uang ${data.type === 'MASUK' ? 'masuk' : 'keluar'}: Rp ${data.amount.toLocaleString('id-ID')} (${data.title}) pada ${data.accountName}`
    );
  };

  const updateCashTransaction = async (id: string, data: Partial<CashTransaction>) => {
    setCashTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t));
    try {
      updateDoc(doc(db, 'cash_transactions', id), { ...data, updatedAt: new Date().toISOString() });
    } catch (e) {}
    logAction('UPDATE_CASH_TRANSACTION', 'Neraca Kas', `Memperbarui transaksi kas ID ${id}`);
  };

  const deleteCashTransaction = async (id: string) => {
    const target = cashTransactions.find(t => t.id === id);
    setCashTransactions(prev => prev.filter(t => t.id !== id));
    try {
      deleteDoc(doc(db, 'cash_transactions', id));
    } catch (e) {}
    logAction('DELETE_CASH_TRANSACTION', 'Neraca Kas', `Menghapus transaksi kas: ${target?.title || id} (Rp ${target?.amount.toLocaleString('id-ID') || 0})`);
  };

  // ==========================================
  // Buku Tata Tertib & Pedoman Disiplin Siswa
  // ==========================================
  const addSchoolRule = async (data: Omit<SchoolRuleArticle, 'id'>) => {
    const newRule: SchoolRuleArticle = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...data,
      academicYear: activeAcademicYear,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.displayName || 'Admin Kesiswaan'
    };
    setSchoolRules(prev => [...prev, newRule]);
    try {
      setDoc(doc(db, 'school_rules', newRule.id), newRule);
    } catch (e) {}
    logAction('ADD_SCHOOL_RULE', 'Buku Tata Tertib', `Menambahkan pasal tata tertib: ${newRule.articleNumber} - ${newRule.title}`);
  };

  const updateSchoolRule = async (id: string, data: Partial<SchoolRuleArticle>) => {
    const updatedData = {
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.displayName || 'Admin Kesiswaan'
    };
    setSchoolRules(prev => prev.map(r => r.id === id ? { ...r, ...updatedData } : r));
    try {
      updateDoc(doc(db, 'school_rules', id), updatedData);
    } catch (e) {}
    logAction('UPDATE_SCHOOL_RULE', 'Buku Tata Tertib', `Memperbarui aturan tata tertib: ${data.articleNumber || ''} ${data.title || id}`);
  };

  const deleteSchoolRule = async (id: string) => {
    const target = schoolRules.find(r => r.id === id);
    setSchoolRules(prev => prev.filter(r => r.id !== id));
    try {
      deleteDoc(doc(db, 'school_rules', id));
    } catch (e) {}
    logAction('DELETE_SCHOOL_RULE', 'Buku Tata Tertib', `Menghapus pasal aturan: ${target?.articleNumber || ''} ${target?.title || id}`);
  };

  const resetSchoolRulesToDefault = async () => {
    setSchoolRules(INITIAL_SCHOOL_RULES);
    setHandbookMeta(INITIAL_HANDBOOK_META);
    try {
      for (const r of INITIAL_SCHOOL_RULES) {
        setDoc(doc(db, 'school_rules', r.id), r);
      }
      setDoc(doc(db, 'settings', 'handbook_meta'), INITIAL_HANDBOOK_META);
    } catch (e) {}
    logAction('RESET_SCHOOL_RULES', 'Buku Tata Tertib', 'Mereset pasal aturan tata tertib ke standar baku nasional');
  };

  const updateHandbookMeta = async (meta: Partial<SchoolHandbookMeta>) => {
    const updated: SchoolHandbookMeta = {
      ...handbookMeta,
      ...meta,
      lastUpdated: new Date().toISOString()
    };
    setHandbookMeta(updated);
    try {
      setDoc(doc(db, 'settings', 'handbook_meta'), updated);
    } catch (e) {}
    logAction('UPDATE_HANDBOOK_META', 'Buku Tata Tertib', `Memperbarui SK & Ambang Poin Tata Tertib (${updated.decreeNumber})`);
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
        addAcademicYear,
        updateAcademicYear,
        deleteAcademicYear,
        promoteAcademicYear,
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
        homeVisits,
        parentCallLetters,
        careerGuidances,
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
        osimDepartments,
        cashAccounts,
        cashTransactions,
        addCashAccount,
        updateCashAccount,
        deleteCashAccount,
        assignCashManager,
        addCashTransaction,
        updateCashTransaction,
        deleteCashTransaction,
        schoolRules,
        handbookMeta,
        addSchoolRule,
        updateSchoolRule,
        deleteSchoolRule,
        resetSchoolRulesToDefault,
        updateHandbookMeta,
        addStudent,
        updateStudent,
        deleteStudent,
        deleteStudentsBulk,
        importStudentsBulk,
        clearAllStudents,
        addClass,
        updateClass,
        deleteClass,
        deleteClassesBulk,
        clearAllClasses,
        assignHomeroomTeacher,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        deleteTeachersBulk,
        clearAllTeachers,
        importTeachersBulk,
        addExtracurricular,
        updateExtracurricular,
        deleteExtracurricular,
        addMember,
        removeMember,
        deleteMember: removeMember,
        deleteMembersBulk,
        updateMember,
        updateMemberStatus,
        updateMembersStatusBulk,
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
        reconcileAllStudentPoints,
        addCounseling,
        updateCounseling,
        addCounselingSession: addCounseling,
        updateCounselingSession: updateCounseling,
        deleteCounselingSession,
        addHomeVisit,
        updateHomeVisit,
        deleteHomeVisit,
        addParentCallLetter,
        updateParentCallLetter,
        deleteParentCallLetter,
        addCareerGuidance,
        updateCareerGuidance,
        deleteCareerGuidance,
        addAchievement,
        updateAchievement,
        deleteAchievement,
        addPermission,
        updatePermission,
        deletePermission,
        updatePermissionStatus,
        addNeedsRequest,
        reviewNeedsRequest,
        deleteNeedsRequest,
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
        addOsimDepartment,
        updateOsimDepartment,
        deleteOsimDepartment,
        resetOsimDepartmentsToDefault,
        reconcileOsimMembersWithMasterStudents,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        toggleAnnouncementPin,
        toggleAnnouncementStatus,
        markAnnouncementAsRead,
        markAllAnnouncementsAsReadForUser,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
        syncUserFromCPanel,
        syncDeleteUserFromCPanel,
        syncAllCPanelUsers,
        logAction,
        clearAuditLogs,
        refreshAuditLogs,
        syncWithFirebase,
        uploadAllDataToFirestore,
        seedFirebaseDatabase,
        clearAllOperationalData,
        exportFullDatabaseJSON,
        importFullDatabaseJSON,
        importClassesBulk,
        isSyncing,
        isRealTimeConnected,
        syncLocalChangesToFirestore
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
