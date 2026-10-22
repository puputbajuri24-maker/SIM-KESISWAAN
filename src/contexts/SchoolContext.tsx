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
  StudentReward,
  Reward,
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
  PURGED_DEMO_EMAILS,
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
import { db, auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { handleFirestoreError, OperationType, isPermissionError } from '../services/firestoreErrors';
import { collection, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, addDoc, writeBatch, onSnapshot, query, where, runTransaction } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { initGlobalRbacSync } from '../services/rbacService';
import { canManageViolations } from '../permissions';
import { findMatchingClass, resolveStudentClass, isStudentInClass, deduplicateClassesList, normalizeClassString } from '../utils/classResolver';
import { normalizeTeacherCode, formatTeacherCode, formatStudentCode, formatTeacherDocId, getNextTeacherDocId, isValidTeacherCode, generateExtracurricularId, formatOsimDocId, getNextOsimDocId } from '../utils/idGenerator';
import { resolveStudent, resolveTeacher, auditRelationalIntegrity, RelationalHealthReport } from '../utils/relationResolvers';
import {
  validatePayload,
  cashTransactionSchema,
  cashAccountSchema,
  studentViolationSchema,
  studentProfileSchema,
  teacherProfileSchema,
  counselingSessionSchema,
  osimProgramSchema,
  isValidIdFormat,
  runFase7DefensiveAudit,
  Fase7AuditReport
} from '../services/schemaValidation';

import { extractSekbidNumber, isBphMember, normalizeSekbidName } from '../utils/osimAccountHelper';
import {
  addDeletedUid,
  removeDeletedUid,
  isDeletedUid,
  isProtectedTeacherOrStaff,
  isProtectedFunctionalUid,
  isTeacherUserMatch,
  isStudentUserMatch,
  isOsimMemberUserMatch,
  deduplicateTeachersList,
  canonicalizeAssignedEkskulIds,
  deduplicateOsimMembersList,
  deduplicateStudentsList,
  getDeletedClassIds,
  addDeletedClassId,
  removeDeletedClassId,
  isDeletedClassId,
  isPurgedClassId,
  getDeletedMemberIds,
  addDeletedMemberId,
  removeDeletedMemberId,
  PURGED_DEMO_CLASS_IDS,
  getCanonicalBphPositionKey,
  cleanDigits,
  normalizeName,
  sortTeachersByHierarchy,
  isPlaceholderNis
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
  rewards: StudentReward[];
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
  harmonizeTeachersFirestore: () => Promise<{ success: boolean; migratedCount: number; message: string }>;

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
  reconcileAllStudentPoints: () => Promise<{ updatedCount: number; healedViolationsCount: number; cleanedOrphansCount: number }>;

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
  syncStudentAchievementPoints: (targetStudentId: string, currentAchievementsList?: StudentAchievement[]) => Promise<number>;

  // Rewards
  addReward: (data: Omit<StudentReward, 'id' | 'createdAt'>) => Promise<void>;
  updateReward: (id: string, data: Partial<StudentReward>) => Promise<void>;
  deleteReward: (id: string, studentId?: string, points?: number) => Promise<void>;
  syncStudentRewardPoints: (targetStudentId: string, currentRewardsList?: StudentReward[]) => Promise<number>;

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
  cloudStatus: 'synced' | 'saving' | 'offline' | 'error';
  verifyCloudDataIntegrity: () => Promise<{
    teachers: { firestore: number; react: number };
    students: { firestore: number; react: number };
    classes: { firestore: number; react: number };
    extracurriculars: { firestore: number; react: number };
    users: { firestore: number; react: number };
    violations?: { firestore: number; react: number };
    counseling?: { firestore: number; react: number };
    cash_transactions?: { firestore: number; react: number };
  }>;
  syncLocalChangesToFirestore: () => Promise<void>;

  // Fase 3: Cross-Collection Relational Audit & Auto-Harmonization
  reconcileAllCashBalances: () => Promise<{ updatedCount: number }>;
  checkDatabaseRelationalHealth: () => RelationalHealthReport;
  runFullDatabaseHarmonization: () => Promise<{
    success: boolean;
    message: string;
    details: { studentPointsFixed: number; cashBalancesFixed: number; teachersHarmonized: number };
  }>;

  // Fase 4: Disaster Recovery & Auto-Healing Resilience Engine
  autoHealOrphanRecords: () => Promise<{
    healedViolations: number;
    healedCounselings: number;
    healedMembers: number;
    healedCoaches: number;
    healedTransactions: number;
    healedStudents?: number;
    healedOsimMembers?: number;
    healedTeacherAccounts?: number;
    totalHealed: number;
  }>;
  createDisasterRecoverySnapshot: (customLabel?: string) => Promise<{
    id: string;
    label: string;
    timestamp: string;
    counts: Record<string, number>;
  }>;
  restoreFromDisasterSnapshot: (snapshotId: string) => Promise<{ success: boolean; message: string }>;
  getDisasterRecoverySnapshots: () => Array<{
    id: string;
    label: string;
    timestamp: string;
    counts: Record<string, number>;
    data?: any;
  }>;
  deleteDisasterRecoverySnapshot: (snapshotId: string) => void;
  // Fase 7: Defensive Schema Validation & Enterprise Health Shield
  executeFase7Audit: () => Promise<Fase7AuditReport>;
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
  const [cloudStatus, setCloudStatus] = useState<'synced' | 'saving' | 'offline' | 'error'>('synced');

  // States initialized with clean in-memory defaults (single source of truth: Cloud Firestore)
  const [schoolSetting, setSchoolSetting] = useState<SchoolSetting>(INITIAL_SCHOOL_SETTING);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(INITIAL_ACADEMIC_YEARS);
  const [activeAcademicYear, setActiveAcademicYearState] = useState<string>('2026/2027');
  const [activeSemester, setActiveSemesterState] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [classes, setClasses] = useState<SchoolClass[]>(() => {
    try {
      const raw = localStorage.getItem('sim_classes');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    try {
      const raw = localStorage.getItem('sim_teachers');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const raw = localStorage.getItem('sim_students');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  const [extracurriculars, setExtracurriculars] = useState<Extracurricular[]>(() => {
    try {
      const raw = localStorage.getItem('sim_extracurriculars');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  const [members, setMembers] = useState<ExtracurricularMember[]>(() => {
    try {
      const raw = localStorage.getItem('sim_members');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  // Generic helper for resilient offline cache hydration on initial load
  function loadCachedRecordState<T>(key: string, fallback: T): T {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(fallback)) {
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed as unknown as T;
          }
        } else if (parsed && typeof parsed === 'object') {
          return parsed as unknown as T;
        }
      }
    } catch (e) {}
    return fallback;
  }

  const [schedules, setSchedules] = useState<ScheduleEvent[]>(() => loadCachedRecordState('sim_schedules', INITIAL_SCHEDULES));
  const [attendance, setAttendance] = useState<AttendanceSession[]>(() => loadCachedRecordState('sim_attendance', INITIAL_ATTENDANCE));
  const [activities, setActivities] = useState<SchoolActivity[]>(() => loadCachedRecordState('sim_activities', INITIAL_ACTIVITIES));
  const [activityReports, setActivityReports] = useState<ActivityReport[]>(() => loadCachedRecordState('sim_activity_reports', INITIAL_REPORTS));
  const [violations, setViolations] = useState<StudentViolation[]>(() => loadCachedRecordState('sim_violations', INITIAL_VIOLATIONS));
  const [counseling, setCounseling] = useState<StudentCounseling[]>(() => loadCachedRecordState('sim_counseling', INITIAL_COUNSELING));
  const [homeVisits, setHomeVisits] = useState<HomeVisitRecord[]>(() => loadCachedRecordState('sim_home_visits', INITIAL_HOME_VISITS));
  const [parentCallLetters, setParentCallLetters] = useState<ParentCallLetter[]>(() => loadCachedRecordState('sim_parent_call_letters', INITIAL_PARENT_CALL_LETTERS));
  const [careerGuidances, setCareerGuidances] = useState<CareerGuidanceRecord[]>(() => loadCachedRecordState('sim_career_guidances', INITIAL_CAREER_GUIDANCES));
  const [achievements, setAchievements] = useState<StudentAchievement[]>(() => loadCachedRecordState('sim_achievements', INITIAL_ACHIEVEMENTS));
  const [rewards, setRewards] = useState<StudentReward[]>(() => loadCachedRecordState('sim_rewards', []));
  const [permissions, setPermissions] = useState<StudentPermission[]>(() => loadCachedRecordState('sim_permissions', INITIAL_PERMISSIONS));
  const [needsRequests, setNeedsRequests] = useState<NeedsRequest[]>(() => loadCachedRecordState('sim_needs_requests', INITIAL_NEEDS_REQUESTS));
  const [osimMembers, setOsimMembers] = useState<OsimMember[]>(() => {
    try {
      const saved = localStorage.getItem('sim_osim_members');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((o: any) => o.id !== 'om1' && !o.isDeleted);
        }
      }
    } catch (e) {}
    return (INITIAL_OSIM_MEMBERS || []).filter((o: any) => o.id !== 'om1' && !o.isDeleted);
  });
  const [osimPrograms, setOsimPrograms] = useState<OsimWorkProgram[]>(() => loadCachedRecordState('sim_osim_programs', INITIAL_OSIM_PROGRAMS));
  const [osimAspirations, setOsimAspirations] = useState<OsimAspiration[]>(() => loadCachedRecordState('sim_osim_aspirations', INITIAL_OSIM_ASPIRATIONS));
  const [osimMeetings, setOsimMeetings] = useState<OsimMeeting[]>(() => loadCachedRecordState('sim_osim_meetings', INITIAL_OSIM_MEETINGS));
  const [osimDepartments, setOsimDepartments] = useState<OsimDepartment[]>(() => loadCachedRecordState('sim_osim_departments', INITIAL_OSIM_DEPARTMENTS));
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>(() => loadCachedRecordState('sim_cash_accounts', INITIAL_CASH_ACCOUNTS));
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(() => loadCachedRecordState('sim_cash_transactions', INITIAL_CASH_TRANSACTIONS));
  const [schoolRules, setSchoolRules] = useState<SchoolRuleArticle[]>(() => loadCachedRecordState('sim_school_rules', INITIAL_SCHOOL_RULES));
  const [handbookMeta, setHandbookMeta] = useState<SchoolHandbookMeta>(() => loadCachedRecordState('sim_handbook_meta', INITIAL_HANDBOOK_META));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => loadCachedRecordState('sim_announcements', INITIAL_ANNOUNCEMENTS));
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => loadCachedRecordState('sim_notifications', INITIAL_NOTIFICATIONS));
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => loadCachedRecordState('sim_audit_logs', INITIAL_AUDIT_LOGS));

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

  // Automatic purge of legacy default seed extracurriculars and fotografi/sinematografi from local state
  useEffect(() => {
    setExtracurriculars(prev => {
      const filtered = prev.filter(e => !isPurgedExtracurricular(e.name) && !isPurgedExtracurricular(e.id));
      if (filtered.length !== prev.length) {
        // Also delete removed documents from Firestore if authenticated admin
        if (auth.currentUser && currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role)) {
          const removed = prev.filter(e => isPurgedExtracurricular(e.name) || isPurgedExtracurricular(e.id));
          removed.forEach(e => {
            deleteDoc(doc(db, 'extracurriculars', e.id)).catch(() => {});
          });
        }
        return filtered;
      }
      return prev;
    });

    if (auth.currentUser && currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role)) {
      try {
        PURGED_DEMO_EKSKUL_IDS.forEach(id => {
          deleteDoc(doc(db, 'extracurriculars', id)).catch(() => {});
        });
      } catch (e) {}
    }
  }, []);

  // Automatic purge of legacy dummy classes (e.g., c_x_rpl1, dummy classes) from local state
  useEffect(() => {
    setClasses(prev => {
      const filtered = prev.filter(c => !isPurgedClassId(c.id) && !isDeletedClassId(c.id));
      if (filtered.length !== prev.length) {
        if (auth.currentUser && currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role)) {
          const removed = prev.filter(c => isPurgedClassId(c.id) || isDeletedClassId(c.id));
          removed.forEach(c => {
            addDeletedClassId(c.id);
            deleteDoc(doc(db, 'classes', c.id)).catch(() => {});
          });
        }
        return filtered;
      }
      return prev;
    });

    if (auth.currentUser && currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role)) {
      try {
        PURGED_DEMO_CLASS_IDS.forEach(id => {
          deleteDoc(doc(db, 'classes', id)).catch(() => {});
        });
      } catch (e) {}
    }
  }, []);

  // Proactively fetch main school institutional identity on mount so any device (even unauthenticated) sees identical school branding
  useEffect(() => {
    const fetchPublicSchoolProfile = async () => {
      try {
        const snap = await getDoc(doc(db, 'schools', 'main_school'));
        if (snap.exists()) {
          const loadedSchool = snap.data() as SchoolSetting;
          if (loadedSchool && (loadedSchool.name || loadedSchool.address)) {
            setSchoolSetting(prev => {
              const merged = {
                ...INITIAL_SCHOOL_SETTING,
                ...prev,
                ...loadedSchool
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
      } catch (e) {
        // Silently fallback to local / default
      }
    };
    fetchPublicSchoolProfile();
  }, []);

  // Sync with Firestore if collections exist with timeout resilience
  const syncWithFirebase = async () => {
    // If not authenticated with Firebase Auth, do not query protected operational collections
    if (!auth.currentUser) {
      return;
    }
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
          // Students Sync First
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
          const { deduplicated: cleanStudents, duplicateIds: dupStudentIds } = deduplicateStudentsList(rawStudents);
          const sortedStudents = sortStudentsAlphabetically(cleanStudents);
          setStudents(sortedStudents);
          try {
            localStorage.setItem('sim_students', JSON.stringify(sortedStudents));
          } catch (e) {}
          if (dupStudentIds.length > 0 && auth.currentUser && currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role)) {
            dupStudentIds.forEach(dupId => {
              deleteDoc(doc(db, 'students', dupId)).catch(() => {});
            });
          }

          // Classes Sync
          const classSnap = await getDocs(collection(db, 'classes'));
          const loadedClasses: SchoolClass[] = [];
          const deletedClassSet = getDeletedClassIds();
          classSnap.forEach(docSnap => {
            const id = docSnap.id;
            const data = docSnap.data() as SchoolClass;
            if (deletedClassSet.has(id) || isPurgedClassId(id) || isPurgedClassId(data?.name)) {
              if (auth.currentUser && currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role)) {
                deleteDoc(docSnap.ref).catch(() => {});
              }
              return;
            }
            loadedClasses.push({ id: docSnap.id, ...data });
          });
          const { deduplicated: cleanClasses, duplicateIds: dupClassIds } = deduplicateClassesList(loadedClasses, cleanStudents);
          setClasses(cleanClasses);
          try {
            localStorage.setItem('sim_classes', JSON.stringify(cleanClasses));
          } catch (e) {}
          if (dupClassIds.length > 0 && auth.currentUser && currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role)) {
            dupClassIds.forEach(dupId => {
              deleteDoc(doc(db, 'classes', dupId)).catch(() => {});
            });
          }

          // Teachers Sync
          const teacherSnap = await getDocs(collection(db, 'teachers'));
          const rawLoadedTeachers: Teacher[] = [];
          teacherSnap.forEach(docSnap => {
            const data = docSnap.data() as Teacher;
            const id = docSnap.id;
            const cleanNip = cleanDigits(data.nip);
            const lowerEmail = (data.email || '').toLowerCase().trim();
            if (
              isBlacklistedDemoName(data.fullName || (data as any).name) ||
              isDeletedUid(id) ||
              (cleanNip.length >= 6 && isDeletedUid(cleanNip)) ||
              (lowerEmail && isDeletedUid(lowerEmail)) ||
              PURGED_DEMO_EMAILS.includes(lowerEmail) ||
              id === 'user_teacher_pitria_lawenusa' ||
              id === 'teacher_pitria_lawenusa' ||
              lowerEmail === 'admin@sekolah.sch.id' ||
              lowerEmail === 'pitria.lawenusa@madrasah.sch.id' ||
              lowerEmail === 'pitria.lawenusa@sekolah.sch.id'
            ) {
              if (auth.currentUser && currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role)) {
                deleteDoc(docSnap.ref).catch(() => {});
              }
            } else {
              rawLoadedTeachers.push({ id, ...data });
            }
          });

          let loadedTeachers = deduplicateTeachersList(rawLoadedTeachers, extracurriculars);

          // Auto-heal dirty assignedExtracurriculars and legacy IDs in Firestore on initial load
          const hasLegacyId = rawLoadedTeachers.some(t => !/^guru_\d{2,}$/.test(t.id));
          rawLoadedTeachers.forEach(t => {
            if (Array.isArray(t.assignedExtracurriculars)) {
              const cleaned = canonicalizeAssignedEkskulIds(t.assignedExtracurriculars, extracurriculars);
              const isDirty = t.assignedExtracurriculars.some(item => !item.startsWith('ekskul_')) ||
                t.assignedExtracurriculars.length !== cleaned.length;
              if (isDirty && auth.currentUser && currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role)) {
                setDoc(doc(db, 'teachers', t.id), { assignedExtracurriculars: cleaned }, { merge: true }).catch(() => {});
              }
            }
          });

          setTeachers(loadedTeachers);
          try {
            localStorage.setItem('sim_teachers', JSON.stringify(loadedTeachers));
          } catch (e) {}

          // Immediate hydration of teachers into user registry on cold boot
          if (syncUsersFromTeachers && loadedTeachers.length > 0 && currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role)) {
            syncUsersFromTeachers(loadedTeachers);
          }

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
              if (auth.currentUser && (currentUser?.role === 'super_admin' || (currentUser?.role as string) === 'admin' || currentUser?.role === 'waka_kesiswaan')) {
                deleteDoc(doc(db, 'extracurriculars', docSnap.id)).catch(() => {});
              }
            } else {
              loadedEkskul.push({ id: docSnap.id, ...data });
            }
          });
          setExtracurriculars(loadedEkskul);
          try {
            localStorage.setItem('sim_extracurriculars', JSON.stringify(loadedEkskul));
          } catch (e) {}

          // TAHAP 3: Rekonsiliasi & pembersihan kode angka assignedExtracurriculars guru terhadap ekskul fresh
          loadedTeachers.forEach(t => {
            if (Array.isArray(t.assignedExtracurriculars) && t.assignedExtracurriculars.length > 0) {
              const cleaned = canonicalizeAssignedEkskulIds(t.assignedExtracurriculars, loadedEkskul);
              const hasDirtyCodes = t.assignedExtracurriculars.some(item => /^\d+$/.test(item) || /^ekskul_\d+$/i.test(item) || !item.startsWith('ekskul_'));
              if (hasDirtyCodes || cleaned.length !== t.assignedExtracurriculars.length) {
                t.assignedExtracurriculars = cleaned;
                if (auth.currentUser && currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role)) {
                  setDoc(doc(db, 'teachers', t.id), { assignedExtracurriculars: cleaned }, { merge: true }).catch(() => {});
                }
              }
            }
          });

          // Members Sync (Resilient Two-Way Merge & Anti-Wipe)
          const memberSnap = await getDocs(collection(db, 'extracurricular_members'));
          const loadedMembers: ExtracurricularMember[] = [];
          memberSnap.forEach(docSnap => {
            const data = docSnap.data() as ExtracurricularMember;
            if (
              PURGED_DEMO_EKSKUL_IDS.includes(data.extracurricularId) ||
              isPurgedExtracurricular(data.extracurricularId) ||
              isPurgedExtracurricular(data.extracurricularName || '')
            ) {
              if (auth.currentUser && (currentUser?.role === 'super_admin' || (currentUser?.role as string) === 'admin' || currentUser?.role === 'waka_kesiswaan')) {
                deleteDoc(doc(db, 'extracurricular_members', docSnap.id)).catch(() => {});
              }
            } else {
              loadedMembers.push({ id: docSnap.id, ...data });
            }
          });

          setMembers(prevMembers => {
            const deletedSet = getDeletedMemberIds();
            const memberMap = new Map<string, ExtracurricularMember>();
            loadedMembers.forEach(m => {
              if (!deletedSet.has(m.id)) {
                memberMap.set(m.id, m);
              }
            });

            // Preserve local additions that haven't synced to Firestore yet
            let localCache: ExtracurricularMember[] = [];
            try {
              const rawCached = localStorage.getItem('sim_members');
              if (rawCached) localCache = JSON.parse(rawCached);
            } catch {}

            const candidates = [...prevMembers, ...localCache];
            candidates.forEach(localM => {
              if (localM && localM.id && !deletedSet.has(localM.id) && !memberMap.has(localM.id)) {
                const isDuplicate = Array.from(memberMap.values()).some(
                  m => m.extracurricularId === localM.extracurricularId && (m.studentId === localM.studentId || (m.studentNis && m.studentNis === localM.studentNis))
                );
                if (!isDuplicate) {
                  memberMap.set(localM.id, localM);
                  setDoc(doc(db, 'extracurricular_members', localM.id), localM).catch(() => {});
                }
              }
            });

            const mergedMembers = Array.from(memberMap.values());
            try {
              localStorage.setItem('sim_members', JSON.stringify(mergedMembers));
            } catch (e) {}
            return mergedMembers;
          });

          // Schedules Sync (Resilient merge)
          const schedSnap = await getDocs(collection(db, 'schedules'));
          if (!schedSnap.empty) {
            const loadedSched: ScheduleEvent[] = [];
            schedSnap.forEach(docSnap => {
              const data = docSnap.data() as ScheduleEvent;
              if (
                PURGED_DEMO_EKSKUL_IDS.includes(data.extracurricularId) ||
                isPurgedExtracurricular(data.extracurricularId) ||
                isPurgedExtracurricular(data.title || '')
              ) {
                if (auth.currentUser && currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role)) {
                  deleteDoc(doc(db, 'schedules', docSnap.id)).catch(() => {});
                }
              } else {
                loadedSched.push({ id: docSnap.id, ...data });
              }
            });
            setSchedules(prev => {
              const m = new Map<string, ScheduleEvent>();
              loadedSched.forEach(s => m.set(s.id, s));
              prev.forEach(p => { if (p && p.id && !m.has(p.id)) m.set(p.id, p); });
              const merged = Array.from(m.values());
              try { localStorage.setItem('sim_schedules', JSON.stringify(merged)); } catch (e) {}
              return merged;
            });
          }

          // Attendance Sync (Resilient merge)
          const attSnap = await getDocs(collection(db, 'attendance'));
          if (!attSnap.empty) {
            const loadedAtt: AttendanceSession[] = [];
            attSnap.forEach(docSnap => {
              const data = docSnap.data() as AttendanceSession;
              if (
                PURGED_DEMO_EKSKUL_IDS.includes(data.extracurricularId) ||
                isPurgedExtracurricular(data.extracurricularId) ||
                isPurgedExtracurricular(data.extracurricularName || '')
              ) {
                if (auth.currentUser && (currentUser?.role === 'super_admin' || (currentUser?.role as string) === 'admin' || currentUser?.role === 'waka_kesiswaan')) {
                  deleteDoc(doc(db, 'attendance', docSnap.id)).catch(() => {});
                }
              } else {
                loadedAtt.push({ id: docSnap.id, ...data });
              }
            });
            setAttendance(prev => {
              const m = new Map<string, AttendanceSession>();
              loadedAtt.forEach(a => m.set(a.id, a));
              prev.forEach(p => { if (p && p.id && !m.has(p.id)) m.set(p.id, p); });
              const merged = Array.from(m.values());
              try { localStorage.setItem('sim_attendance', JSON.stringify(merged)); } catch (e) {}
              return merged;
            });
          }

          // Activities Sync (Resilient merge)
          const actSnap = await getDocs(collection(db, 'activities'));
          if (!actSnap.empty) {
            const loadedAct: SchoolActivity[] = [];
            actSnap.forEach(doc => loadedAct.push({ id: doc.id, ...doc.data() } as SchoolActivity));
            setActivities(prev => {
              const m = new Map<string, SchoolActivity>();
              loadedAct.forEach(a => m.set(a.id, a));
              prev.forEach(p => { if (p && p.id && !m.has(p.id)) m.set(p.id, p); });
              const merged = Array.from(m.values());
              try { localStorage.setItem('sim_activities', JSON.stringify(merged)); } catch (e) {}
              return merged;
            });
          }

          // Activity Reports Sync (Resilient merge)
          const repSnap = await getDocs(collection(db, 'activity_reports'));
          if (!repSnap.empty) {
            const loadedRep: ActivityReport[] = [];
            repSnap.forEach(doc => loadedRep.push({ id: doc.id, ...doc.data() } as ActivityReport));
            setActivityReports(prev => {
              const m = new Map<string, ActivityReport>();
              loadedRep.forEach(r => m.set(r.id, r));
              prev.forEach(p => { if (p && p.id && !m.has(p.id)) m.set(p.id, p); });
              const merged = Array.from(m.values());
              try { localStorage.setItem('sim_reports', JSON.stringify(merged)); } catch (e) {}
              return merged;
            });
          }

          // Violations Sync (Purge orphan/zombie records like Nabila & Abdul Asri against active master students, with resilient merge)
          const violSnap = await getDocs(collection(db, 'violations'));
          if (!violSnap.empty) {
            const loadedViol: StudentViolation[] = [];
            const activeStudentIdSet = new Set(sortedStudents.map(s => s.id));
            const activeStudentNameSet = new Set(sortedStudents.map(s => normalizeName(s.fullName)).filter(Boolean));
            const canPurgeInDb = auth.currentUser && currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role);

            violSnap.forEach(docSnap => {
              const data = docSnap.data() as StudentViolation;
              if (data.isDeleted) return;

              const idMatch = data.studentId && activeStudentIdSet.has(data.studentId);
              const nameMatch = data.studentName && activeStudentNameSet.has(normalizeName(data.studentName));
              const isStudentActive = Boolean(idMatch || nameMatch);

              if (!isStudentActive) {
                // Tandai isDeleted di Firestore agar permanen tidak terbaca lagi
                if (canPurgeInDb) {
                  updateDoc(docSnap.ref, {
                    isDeleted: true,
                    deletedAt: new Date().toISOString()
                  }).catch(() => {});
                }
                return;
              }

              loadedViol.push({ id: docSnap.id, ...data });
            });
            setViolations(prev => {
              const m = new Map<string, StudentViolation>();
              loadedViol.forEach(v => m.set(v.id, v));
              prev.forEach(p => { if (p && p.id && !m.has(p.id)) m.set(p.id, p); });
              const merged = Array.from(m.values());
              try { localStorage.setItem('sim_violations', JSON.stringify(merged)); } catch (e) {}
              return merged;
            });
          }

          // Achievements Sync (Resilient merge)
          try {
            const achSnap = await getDocs(collection(db, 'achievements'));
            const loadedAch: StudentAchievement[] = [];
            achSnap.forEach(doc => loadedAch.push({ id: doc.id, ...doc.data() } as StudentAchievement));

            const achMap = new Map<string, StudentAchievement>();
            loadedAch.forEach(a => achMap.set(a.id, a));

            // Preserve local additions that haven't synced to Firestore yet
            try {
              const cachedRaw = localStorage.getItem('sim_achievements');
              if (cachedRaw) {
                const cachedAchs: StudentAchievement[] = JSON.parse(cachedRaw);
                if (Array.isArray(cachedAchs)) {
                  cachedAchs.forEach(ca => {
                    if (ca && ca.id && !achMap.has(ca.id)) {
                      achMap.set(ca.id, ca);
                      setDoc(doc(db, 'achievements', ca.id), ca).catch(() => {});
                    }
                  });
                }
              }
            } catch (e) {}

            const finalAchs = Array.from(achMap.values());
            setAchievements(finalAchs);
            try {
              localStorage.setItem('sim_achievements', JSON.stringify(finalAchs));
            } catch (e) {}
          } catch (achErr) {
            console.warn('[SchoolContext] Gagal sync achievements dari Firestore:', achErr);
          }

          // Rewards Sync (Dedicated Rewards Collection in Firestore)
          try {
            const rewSnap = await getDocs(collection(db, 'rewards'));
            const loadedRew: StudentReward[] = [];
            rewSnap.forEach(docSnap => loadedRew.push({ id: docSnap.id, ...docSnap.data() } as StudentReward));

            const rewMap = new Map<string, StudentReward>();
            loadedRew.forEach(r => rewMap.set(r.id, r));

            // Preserve local additions that haven't synced yet
            try {
              const cachedRaw = localStorage.getItem('sim_rewards');
              if (cachedRaw) {
                const cachedRews: StudentReward[] = JSON.parse(cachedRaw);
                if (Array.isArray(cachedRews)) {
                  cachedRews.forEach(cr => {
                    if (cr && cr.id && !rewMap.has(cr.id)) {
                      rewMap.set(cr.id, cr);
                      setDoc(doc(db, 'rewards', cr.id), cr).catch(() => {});
                    }
                  });
                }
              }
            } catch (e) {}

            // Auto-populate from achievements with points if rewards table is fresh
            if (loadedRew.length === 0) {
              const currentAchs = achievements.length > 0 ? achievements : INITIAL_ACHIEVEMENTS;
              currentAchs.forEach(a => {
                if (Number(a.pointsAwarded) > 0) {
                  const seedRew: StudentReward = {
                    id: `rew_${a.id.replace('ach_', '')}`,
                    studentId: a.studentId,
                    studentNis: a.studentNis,
                    studentName: a.studentName,
                    studentClass: a.studentClass,
                    rewardTitle: a.title,
                    category: (a.category as any) || 'Akademik',
                    points: Number(a.pointsAwarded) || 10,
                    date: a.date,
                    officerName: 'Penyelenggara / Tim Kesiswaan',
                    description: a.description || 'Pemberian apresiasi atas prestasi yang diraih siswa.',
                    actionTaken: 'Pencatatan Poin Prestasi & Piagam',
                    certificateUrl: a.certificateUrl,
                    academicYear: a.academicYear,
                    status: 'Diverifikasi',
                    achievementId: a.id,
                    createdAt: a.createdAt || new Date().toISOString().split('T')[0]
                  };
                  rewMap.set(seedRew.id, seedRew);
                  setDoc(doc(db, 'rewards', seedRew.id), seedRew).catch(() => {});
                }
              });
            }

            const finalRews = Array.from(rewMap.values());
            setRewards(finalRews);
            try {
              localStorage.setItem('sim_rewards', JSON.stringify(finalRews));
            } catch (e) {}
          } catch (rewErr) {
            console.warn('[SchoolContext] Gagal sync rewards dari Firestore:', rewErr);
          }

          // BK Collections Sync (Strictly Restricted to Guru BK and Waka/Admin with active Firebase Auth session)
          const isBkOrAdminUser = currentUser && ['super_admin', 'admin', 'waka_kesiswaan', 'waka', 'admin_kesiswaan', 'guru_bk', 'bk'].includes(currentUser.role);
          if (auth.currentUser && isBkOrAdminUser) {
            try {
              const csSnap = await getDocs(collection(db, 'counseling'));
              if (!csSnap.empty) {
                const loadedCs: StudentCounseling[] = [];
                csSnap.forEach(doc => loadedCs.push({ id: doc.id, ...doc.data() } as StudentCounseling));
                setCounseling(prev => {
                  const m = new Map<string, StudentCounseling>();
                  loadedCs.forEach(c => m.set(c.id, c));
                  prev.forEach(p => { if (p && p.id && !m.has(p.id)) m.set(p.id, p); });
                  const merged = Array.from(m.values());
                  try { localStorage.setItem('sim_counseling', JSON.stringify(merged)); } catch (e) {}
                  return merged;
                });
              }

              const hvSnap = await getDocs(collection(db, 'home_visits'));
              if (!hvSnap.empty) {
                const loadedHv: HomeVisitRecord[] = [];
                hvSnap.forEach(doc => loadedHv.push({ id: doc.id, ...doc.data() } as HomeVisitRecord));
                setHomeVisits(prev => {
                  const m = new Map<string, HomeVisitRecord>();
                  loadedHv.forEach(h => m.set(h.id, h));
                  prev.forEach(p => { if (p && p.id && !m.has(p.id)) m.set(p.id, p); });
                  const merged = Array.from(m.values());
                  try { localStorage.setItem('sim_home_visits', JSON.stringify(merged)); } catch (e) {}
                  return merged;
                });
              }

              const pclSnap = await getDocs(collection(db, 'parent_call_letters'));
              if (!pclSnap.empty) {
                const loadedPcl: ParentCallLetter[] = [];
                pclSnap.forEach(doc => loadedPcl.push({ id: doc.id, ...doc.data() } as ParentCallLetter));
                setParentCallLetters(prev => {
                  const m = new Map<string, ParentCallLetter>();
                  loadedPcl.forEach(l => m.set(l.id, l));
                  prev.forEach(p => { if (p && p.id && !m.has(p.id)) m.set(p.id, p); });
                  const merged = Array.from(m.values());
                  try { localStorage.setItem('sim_parent_call_letters', JSON.stringify(merged)); } catch (e) {}
                  return merged;
                });
              }

              const cgSnap = await getDocs(collection(db, 'career_guidances'));
              if (!cgSnap.empty) {
                const loadedCg: CareerGuidanceRecord[] = [];
                cgSnap.forEach(doc => loadedCg.push({ id: doc.id, ...doc.data() } as CareerGuidanceRecord));
                setCareerGuidances(prev => {
                  const m = new Map<string, CareerGuidanceRecord>();
                  loadedCg.forEach(g => m.set(g.id, g));
                  prev.forEach(p => { if (p && p.id && !m.has(p.id)) m.set(p.id, p); });
                  const merged = Array.from(m.values());
                  try { localStorage.setItem('sim_career_guidances', JSON.stringify(merged)); } catch (e) {}
                  return merged;
                });
              }
            } catch (bkErr) {
              // Unprivileged roles do not have read permission for BK confidential collections
            }
          }

          // Permissions Sync (Resilient merge)
          const permSnap = await getDocs(collection(db, 'permissions'));
          if (!permSnap.empty) {
            const loadedPerm: StudentPermission[] = [];
            permSnap.forEach(doc => loadedPerm.push({ id: doc.id, ...doc.data() } as StudentPermission));
            setPermissions(prev => {
              const m = new Map<string, StudentPermission>();
              loadedPerm.forEach(p => m.set(p.id, p));
              prev.forEach(p => { if (p && p.id && !m.has(p.id)) m.set(p.id, p); });
              const merged = Array.from(m.values());
              try { localStorage.setItem('sim_permissions', JSON.stringify(merged)); } catch (e) {}
              return merged;
            });
          }

          // Needs Requests Sync (Resilient merge)
          const needSnap = await getDocs(collection(db, 'needs_requests'));
          if (!needSnap.empty) {
            const loadedNeed: NeedsRequest[] = [];
            needSnap.forEach(doc => loadedNeed.push({ id: doc.id, ...doc.data() } as NeedsRequest));
            setNeedsRequests(prev => {
              const m = new Map<string, NeedsRequest>();
              loadedNeed.forEach(n => m.set(n.id, n));
              prev.forEach(p => { if (p && p.id && !m.has(p.id)) m.set(p.id, p); });
              const merged = Array.from(m.values());
              try { localStorage.setItem('sim_needs', JSON.stringify(merged)); } catch (e) {}
              return merged;
            });
          }

          // OSIM Collections Sync
          const osimMemSnap = await getDocs(collection(db, 'osim_members'));
          const rawOsimMem: OsimMember[] = [];
          osimMemSnap.forEach(docSnap => {
            const data = docSnap.data() as OsimMember;
            const id = docSnap.id;
            if (data.id === 'om1' || (data as any).isDeleted) {
              if (auth.currentUser && currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role)) {
                deleteDoc(docSnap.ref).catch(() => {});
              }
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
          if (rawOsimMem.length > loadedOsimMem.length && auth.currentUser && currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role)) {
            const keptIds = new Set(loadedOsimMem.map(m => m.id));
            const obsoleteMembers = rawOsimMem.filter(m => !keptIds.has(m.id));
            obsoleteMembers.forEach(obs => {
              if (isProtectedTeacherOrStaff({ id: obs.id, fullName: obs.fullName } as any) || isProtectedFunctionalUid(obs.id)) {
                return;
              }
              addDeletedUid(obs.id);
              addDeletedUid(`user_${obs.id}`);
              deleteDoc(doc(db, 'osim_members', obs.id)).catch(() => {});
              deleteDoc(doc(db, 'users', obs.id)).catch(() => {});
              deleteDoc(doc(db, 'users', `user_${obs.id}`)).catch(() => {});
            });
          }

          const osimProgSnap = await getDocs(collection(db, 'osim_programs'));
          if (!osimProgSnap.empty) {
            const loadedOsimProg: OsimWorkProgram[] = [];
            osimProgSnap.forEach(doc => loadedOsimProg.push({ id: doc.id, ...doc.data() } as OsimWorkProgram));
            setOsimPrograms(prev => {
              const m = new Map<string, OsimWorkProgram>();
              loadedOsimProg.forEach(p => m.set(p.id, p));
              prev.forEach(p => { if (p && p.id && !m.has(p.id)) m.set(p.id, p); });
              const merged = Array.from(m.values());
              try { localStorage.setItem('sim_osim_programs', JSON.stringify(merged)); } catch (e) {}
              return merged;
            });
          }

          const osimAspSnap = await getDocs(collection(db, 'osim_aspirations'));
          if (!osimAspSnap.empty) {
            const loadedOsimAsp: OsimAspiration[] = [];
            osimAspSnap.forEach(doc => loadedOsimAsp.push({ id: doc.id, ...doc.data() } as OsimAspiration));
            setOsimAspirations(prev => {
              const m = new Map<string, OsimAspiration>();
              loadedOsimAsp.forEach(a => m.set(a.id, a));
              prev.forEach(p => { if (p && p.id && !m.has(p.id)) m.set(p.id, p); });
              const merged = Array.from(m.values());
              try { localStorage.setItem('sim_osim_aspirations', JSON.stringify(merged)); } catch (e) {}
              return merged;
            });
          }

          const osimMeetSnap = await getDocs(collection(db, 'osim_meetings'));
          if (!osimMeetSnap.empty) {
            const loadedOsimMeet: OsimMeeting[] = [];
            osimMeetSnap.forEach(doc => loadedOsimMeet.push({ id: doc.id, ...doc.data() } as OsimMeeting));
            setOsimMeetings(prev => {
              const m = new Map<string, OsimMeeting>();
              loadedOsimMeet.forEach(meet => m.set(meet.id, meet));
              prev.forEach(p => { if (p && p.id && !m.has(p.id)) m.set(p.id, p); });
              const merged = Array.from(m.values());
              try { localStorage.setItem('sim_osim_meetings', JSON.stringify(merged)); } catch (e) {}
              return merged;
            });
          }

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

          // Cash Ledger Sync (Restricted to Cash Managers and Staff)
          const isCashStaff = currentUser && (
            currentUser.isCashManager ||
            ['super_admin', 'admin', 'waka_kesiswaan', 'waka', 'pembina_osim', 'pembina_ekskul', 'pembina_ekstrakurikuler'].includes(currentUser.role) ||
            currentUser.osimPosition === 'bendahara' ||
            currentUser.osimPosition === 'bendahara_osim'
          );
          if (auth.currentUser && isCashStaff) {
            try {
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
            } catch (cashErr) {}
          }

          // School Rules Sync (Resilient two-way merge & anti-wipe)
          try {
            const rulesSnap = await getDocs(collection(db, 'school_rules'));
            const loadedRules: SchoolRuleArticle[] = [];
            rulesSnap.forEach(doc => loadedRules.push({ id: doc.id, ...doc.data() } as SchoolRuleArticle));

            if (loadedRules.length > 0) {
              const mergedMap = new Map<string, SchoolRuleArticle>();
              // Base rules
              INITIAL_SCHOOL_RULES.forEach(r => mergedMap.set(r.id, r));
              // Overlay with Firestore rules (includes admin edits and custom rules)
              loadedRules.forEach(r => mergedMap.set(r.id, r));

              // Preserve any locally cached custom rules that have not reached Firestore yet
              try {
                const cachedRaw = localStorage.getItem('sim_school_rules');
                if (cachedRaw) {
                  const cachedRules: SchoolRuleArticle[] = JSON.parse(cachedRaw);
                  if (Array.isArray(cachedRules)) {
                    cachedRules.forEach(cr => {
                      if (cr && cr.id && !mergedMap.has(cr.id)) {
                        mergedMap.set(cr.id, cr);
                        setDoc(doc(db, 'school_rules', cr.id), cr).catch(() => {});
                      }
                    });
                  }
                }
              } catch (e) {}

              const finalRules = Array.from(mergedMap.values());
              setSchoolRules(finalRules);
              try {
                localStorage.setItem('sim_school_rules', JSON.stringify(finalRules));
              } catch (e) {}
            } else {
              // Firestore is completely empty. Seed official rules and preserve any local custom additions.
              let localCustom: SchoolRuleArticle[] = [];
              try {
                const cachedRaw = localStorage.getItem('sim_school_rules');
                if (cachedRaw) {
                  const parsed = JSON.parse(cachedRaw);
                  if (Array.isArray(parsed)) localCustom = parsed;
                }
              } catch (e) {}

              const mergedMap = new Map<string, SchoolRuleArticle>();
              INITIAL_SCHOOL_RULES.forEach(r => mergedMap.set(r.id, r));
              localCustom.forEach(r => mergedMap.set(r.id, r));
              const finalRules = Array.from(mergedMap.values());

              setSchoolRules(finalRules);
              try {
                localStorage.setItem('sim_school_rules', JSON.stringify(finalRules));
              } catch (e) {}

              // Seed Firestore so rules persist permanently
              for (const r of finalRules) {
                setDoc(doc(db, 'school_rules', r.id), r).catch(() => {});
              }
            }
          } catch (ruleErr) {
            console.warn('[SchoolContext] Gagal sync aturan dari Firestore, menggunakan cache lokal:', ruleErr);
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
              if (auth.currentUser && currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role)) {
                setDoc(doc(db, 'settings', 'handbook_meta'), INITIAL_HANDBOOK_META).catch(() => {});
              }
              setHandbookMeta(INITIAL_HANDBOOK_META);
              try {
                localStorage.setItem('sim_handbook_meta', JSON.stringify(INITIAL_HANDBOOK_META));
              } catch (e) {}
            }
          } else {
            if (auth.currentUser && currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role)) {
              setDoc(doc(db, 'settings', 'handbook_meta'), INITIAL_HANDBOOK_META).catch(() => {});
            }
            setHandbookMeta(INITIAL_HANDBOOK_META);
            try {
              localStorage.setItem('sim_handbook_meta', JSON.stringify(INITIAL_HANDBOOK_META));
            } catch (e) {}
          }

          // Announcements Sync (Resilient merge)
          const annSnap = await getDocs(collection(db, 'announcements'));
          if (!annSnap.empty) {
            const loadedAnn: Announcement[] = [];
            annSnap.forEach(doc => loadedAnn.push({ id: doc.id, ...doc.data() } as Announcement));
            setAnnouncements(prev => {
              const annMap = new Map<string, Announcement>();
              loadedAnn.forEach(a => annMap.set(a.id, a));
              prev.forEach(pa => {
                if (pa && pa.id && !annMap.has(pa.id)) {
                  annMap.set(pa.id, pa);
                  setDoc(doc(db, 'announcements', pa.id), pa).catch((err) => {
                    handleFirestoreError(err, OperationType.WRITE, 'announcements');
                  });
                }
              });
              const merged = Array.from(annMap.values());
              try {
                localStorage.setItem('sim_announcements', JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
          } else {
            // Firestore announcements is currently empty: initialize Firestore with current announcements
            setAnnouncements(prev => {
              const listToSeed = (prev && prev.length > 0) ? prev : (INITIAL_ANNOUNCEMENTS || []);
              listToSeed.forEach(a => {
                if (a && a.id) {
                  setDoc(doc(db, 'announcements', a.id), a).catch((err) => {
                    handleFirestoreError(err, OperationType.WRITE, 'announcements');
                  });
                }
              });
              try {
                localStorage.setItem('sim_announcements', JSON.stringify(listToSeed));
              } catch (e) {}
              return listToSeed;
            });
          }

          // Audit Logs Sync from Firestore (Restricted to Waka/Admin with active auth session)
          const isAuditStaff = currentUser && ['super_admin', 'admin', 'waka_kesiswaan', 'waka'].includes(currentUser.role);
          if (auth.currentUser && isAuditStaff) {
            try {
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
            } catch (auditErr) {
              // Unprivileged roles do not have read permission for audit logs
            }
          }
        } else {
          // Cloud database is uninitialized: unauthenticated or client visits do not auto-seed.
          // Super Administrator can explicitly seed initial structure via cPanel if desired.
        }
      })();

      await syncPromise;
    } catch (e) {
      console.warn('Firestore sync note (active offline local cache):', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Kebijakan Fase 0: Dilarang melakukan automatic push dari LocalStorage ke Firestore
  const syncLocalChangesToFirestore = async () => {
    // No-op: LocalStorage bukan sumber kebenaran data dan tidak boleh meng-overwrite Firestore
    return;
  };

  // 1. Real-time synchronization for public school data across all visitors & devices
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // 0. Real-time Global RBAC Matrix Listener (Firestore settings/rbac_matrix)
    try {
      const unsubRbac = initGlobalRbacSync();
      if (typeof unsubRbac === 'function') {
        unsubscribers.push(unsubRbac);
      }
    } catch (e) {
      console.warn('RBAC Global sync listener error:', e);
    }

    // 1. Real-time Extracurriculars Listener (Public Catalog)
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
        if (isPermissionError(err)) {
          console.warn('[Firestore] Izin baca ditolak untuk extracurriculars:', err);
        } else {
          handleFirestoreError(err, OperationType.GET, 'extracurriculars');
        }
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 2. Real-time Classes Listener (Public Catalog)
    try {
      const unsub = onSnapshot(collection(db, 'classes'), (snapshot) => {
        if (!snapshot.empty) {
          const loaded: SchoolClass[] = [];
          const deletedClassSet = getDeletedClassIds();
          snapshot.forEach(docSnap => {
            const id = docSnap.id;
            const data = docSnap.data() as SchoolClass;
            if (deletedClassSet.has(id) || isPurgedClassId(id) || isPurgedClassId(data?.name)) {
              if (auth.currentUser && currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role)) {
                deleteDoc(docSnap.ref).catch(() => {});
              }
              return;
            }
            loaded.push({ id: docSnap.id, ...data });
          });
          const { deduplicated: cleanClasses, duplicateIds } = deduplicateClassesList(loaded, students);
          setClasses(cleanClasses);
          try {
            localStorage.setItem('sim_classes', JSON.stringify(cleanClasses));
          } catch (e) {}
          if (duplicateIds.length > 0 && auth.currentUser && currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role)) {
            duplicateIds.forEach(dupId => {
              deleteDoc(doc(db, 'classes', dupId)).catch(() => {});
            });
          }
        }
      }, (err) => {
        if (isPermissionError(err)) {
          console.warn('[Firestore] Izin baca ditolak untuk classes:', err);
        } else {
          handleFirestoreError(err, OperationType.GET, 'classes');
        }
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 3. Real-time Schools (Settings) Listener (Public Branding)
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
        if (isPermissionError(err)) {
          console.warn('[Firestore] Izin baca ditolak untuk schools:', err);
        } else {
          handleFirestoreError(err, OperationType.GET, 'schools');
        }
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 4. Real-time Academic Years Listener (Public)
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
        if (isPermissionError(err)) {
          console.warn('[Firestore] Izin baca ditolak untuk academic_years:', err);
        } else {
          handleFirestoreError(err, OperationType.GET, 'academic_years');
        }
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 5. Real-time Attendance Listener (Public Overview)
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
        if (isPermissionError(err)) {
          console.warn('[Firestore] Izin baca ditolak untuk attendance:', err);
        } else {
          handleFirestoreError(err, OperationType.GET, 'attendance');
        }
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 6. Real-time Activities Listener (Public Events)
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
        if (isPermissionError(err)) {
          console.warn('[Firestore] Izin baca ditolak untuk activities:', err);
        } else {
          handleFirestoreError(err, OperationType.GET, 'activities');
        }
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 7. Real-time Activity Reports Listener (Public)
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
        if (isPermissionError(err)) {
          console.warn('[Firestore] Izin baca ditolak untuk activity_reports:', err);
        } else {
          handleFirestoreError(err, OperationType.GET, 'activity_reports');
        }
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 8. Real-time Schedules Listener (Public)
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
        if (isPermissionError(err)) {
          console.warn('[Firestore] Izin baca ditolak untuk schedules:', err);
        } else {
          handleFirestoreError(err, OperationType.GET, 'schedules');
        }
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 9. Real-time Achievements Listener (Public)
    try {
      const unsub = onSnapshot(collection(db, 'achievements'), (snapshot) => {
        const loaded: StudentAchievement[] = [];
        snapshot.forEach(docSnap => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as StudentAchievement);
        });
        setAchievements(prevAchs => {
          const achMap = new Map<string, StudentAchievement>();
          loaded.forEach(a => achMap.set(a.id, a));
          // Preserve local additions that haven't synced to Firestore yet
          prevAchs.forEach(pa => {
            if (pa && pa.id && !achMap.has(pa.id)) {
              achMap.set(pa.id, pa);
            }
          });
          const finalAchs = Array.from(achMap.values());
          try {
            localStorage.setItem('sim_achievements', JSON.stringify(finalAchs));
          } catch (e) {}
          return finalAchs;
        });
      }, (err) => {
        if (isPermissionError(err)) {
          console.warn('[Firestore] Izin baca ditolak untuk achievements:', err);
        } else {
          handleFirestoreError(err, OperationType.GET, 'achievements');
        }
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 9b. Real-time Rewards Listener (Public)
    try {
      const unsub = onSnapshot(collection(db, 'rewards'), (snapshot) => {
        const loaded: StudentReward[] = [];
        snapshot.forEach(docSnap => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as StudentReward);
        });
        setRewards(prevRews => {
          const rewMap = new Map<string, StudentReward>();
          loaded.forEach(r => rewMap.set(r.id, r));
          prevRews.forEach(pr => {
            if (pr && pr.id && !rewMap.has(pr.id)) {
              rewMap.set(pr.id, pr);
            }
          });
          const finalRews = Array.from(rewMap.values());
          try {
            localStorage.setItem('sim_rewards', JSON.stringify(finalRews));
          } catch (e) {}
          return finalRews;
        });
      }, (err) => {
        if (isPermissionError(err)) {
          console.warn('[Firestore] Izin baca ditolak untuk rewards:', err);
        } else {
          handleFirestoreError(err, OperationType.GET, 'rewards');
        }
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // 10. Real-time Announcements Listener (Public)
    try {
      const unsub = onSnapshot(collection(db, 'announcements'), (snapshot) => {
        const loaded: Announcement[] = [];
        snapshot.forEach(docSnap => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as Announcement);
        });
        setAnnouncements(prev => {
          const annMap = new Map<string, Announcement>();
          loaded.forEach(a => annMap.set(a.id, a));
          // Preserve local additions
          prev.forEach(pa => {
            if (pa && pa.id && !annMap.has(pa.id)) {
              annMap.set(pa.id, pa);
            }
          });
          const merged = Array.from(annMap.values());
          if (merged.length > 0) {
            try {
              localStorage.setItem('sim_announcements', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          }
          return prev;
        });
      }, (err) => {
        if (isPermissionError(err)) {
          console.warn('[Firestore] Izin baca ditolak untuk announcements:', err);
        } else {
          handleFirestoreError(err, OperationType.GET, 'announcements');
        }
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    setIsRealTimeConnected(true);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  // 2. Real-time synchronization for authenticated school operational records
  useEffect(() => {
    // Only subscribe to protected collections when user is actively authenticated
    if (!currentUser && !auth.currentUser) {
      return;
    }

    const unsubscribers: (() => void)[] = [];

    // Trigger initial load for authenticated user
    syncWithFirebase().catch(() => {});

    // Students Listener (requires authenticated user)
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

          if (duplicateIds.length > 0 && auth.currentUser && currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role)) {
            duplicateIds.forEach(dupId => {
              deleteDoc(doc(db, 'students', dupId)).catch(() => {});
            });
          }
        }
      }, (err) => {
        if (isPermissionError(err)) {
          console.warn('[Firestore] Izin baca ditolak untuk students:', err);
        } else {
          handleFirestoreError(err, OperationType.GET, 'students');
        }
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // Extracurricular Members Listener (Resilient Two-Way Merge & Anti-Wipe)
    try {
      const unsub = onSnapshot(collection(db, 'extracurricular_members'), (snapshot) => {
        const loaded: ExtracurricularMember[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as ExtracurricularMember;
          const id = docSnap.id;
          if (id === 'm1') return;
          if (isPurgedExtracurricular(data.extracurricularId) || isPurgedExtracurricular(data.extracurricularName || '')) return;
          loaded.push({ id, ...data });
        });

        setMembers(prevMembers => {
          const deletedSet = getDeletedMemberIds();
          const memberMap = new Map<string, ExtracurricularMember>();
          loaded.forEach(m => {
            if (!deletedSet.has(m.id)) {
              memberMap.set(m.id, m);
            }
          });

          // Preserve any local members that were newly added or not yet in snapshot
          prevMembers.forEach(localM => {
            if (localM && localM.id && !deletedSet.has(localM.id) && !memberMap.has(localM.id)) {
              const isDuplicate = Array.from(memberMap.values()).some(
                m => m.extracurricularId === localM.extracurricularId && (m.studentId === localM.studentId || (m.studentNis && m.studentNis === localM.studentNis))
              );
              if (!isDuplicate) {
                memberMap.set(localM.id, localM);
                // Background sync to ensure Firestore receives this local member
                setDoc(doc(db, 'extracurricular_members', localM.id), localM).catch(() => {});
              }
            }
          });

          const finalMembers = Array.from(memberMap.values());
          try {
            localStorage.setItem('sim_members', JSON.stringify(finalMembers));
          } catch (e) {}

          setExtracurriculars(prevEks => {
            const nextEks = prevEks.map(ekskul => {
              const count = finalMembers.filter(m => m.extracurricularId === ekskul.id && m.status !== 'Nonaktif' && m.status !== 'Keluar').length;
              return { ...ekskul, memberCount: count };
            });
            try {
              localStorage.setItem('sim_extracurriculars', JSON.stringify(nextEks));
            } catch (e) {}
            return nextEks;
          });

          return finalMembers;
        });
      }, (err) => {
        if (isPermissionError(err)) {
          console.warn('[Firestore] Izin baca ditolak untuk extracurricular_members:', err);
        } else {
          handleFirestoreError(err, OperationType.GET, 'extracurricular_members');
        }
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // Teachers Listener
    try {
      const unsub = onSnapshot(collection(db, 'teachers'), (snapshot) => {
        if (!snapshot.empty) {
          const raw: Teacher[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as Teacher;
            const id = docSnap.id;
            const cleanNip = cleanDigits(data.nip);
            const isProtectedTeacher = isProtectedTeacherOrStaff(data);
            if (
              !isProtectedTeacher && (
                id === 'user_super_admin' ||
                id === 'teacher_pitria_lawenusa' ||
                isBlacklistedDemoName(data.fullName || (data as any).name) ||
                isDeletedUid(id) ||
                (cleanNip.length >= 6 && isDeletedUid(cleanNip))
              )
            ) {
              return;
            }
            raw.push({ id, ...data });
          });
          const loaded = deduplicateTeachersList(raw, extracurriculars);
          setTeachers(loaded);
          try {
            localStorage.setItem('sim_teachers', JSON.stringify(loaded));
          } catch (e) {}

          if (extracurriculars && extracurriculars.length > 0) {
            raw.forEach(t => {
              if (Array.isArray(t.assignedExtracurriculars)) {
                const cleaned = canonicalizeAssignedEkskulIds(t.assignedExtracurriculars, extracurriculars);
                const cleanNames = cleaned.map(eid => {
                  const match = (extracurriculars || []).find(e => e.id === eid);
                  return match ? match.name : eid;
                });
                const isDirty = t.assignedExtracurriculars.some(item => !item.startsWith('ekskul_')) ||
                  t.assignedExtracurriculars.length !== cleaned.length ||
                  !t.extracurricularNames || t.extracurricularNames.length !== cleanNames.length;
                if (isDirty && auth.currentUser && currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role)) {
                  setDoc(doc(db, 'teachers', t.id), { 
                    assignedExtracurriculars: cleaned,
                    extracurricularNames: cleanNames,
                    extracurricularName: cleanNames.join(', ') || undefined
                  }, { merge: true }).catch(() => {});
                }
              }
            });
          }
        }
      }, (err) => {
        if (isPermissionError(err)) {
          console.warn('[Firestore] Izin baca ditolak untuk teachers:', err);
        } else {
          handleFirestoreError(err, OperationType.GET, 'teachers');
        }
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    const userRole = currentUser?.role;
    const isStaff = userRole && ['super_admin', 'admin', 'waka_kesiswaan', 'waka', 'admin_kesiswaan', 'guru_bk', 'bk', 'pembina_osim', 'pembina', 'pembina_ekstrakurikuler', 'pembina_ekskul', 'coach_ekstrakurikuler', 'wali_kelas', 'homeroom_teacher', 'guru', 'teacher', 'guru_mapel'].includes(userRole);
    const isBkOrAdmin = userRole && ['super_admin', 'admin', 'waka_kesiswaan', 'waka', 'admin_kesiswaan', 'guru_bk', 'bk'].includes(userRole);

    // Violations Listener (restricted to Staff & Admin, with resilient merge)
    if (isStaff) {
      try {
        const unsub = onSnapshot(collection(db, 'violations'), (snapshot) => {
          const loaded: Violation[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as Violation;
            if (!data.isDeleted) {
              loaded.push({ id: docSnap.id, ...data });
            }
          });
          setViolations(prev => {
            const m = new Map<string, StudentViolation>();
            loaded.forEach(v => m.set(v.id, v));
            prev.forEach(p => { if (p && p.id && !m.has(p.id)) m.set(p.id, p); });
            const merged = Array.from(m.values());
            try { localStorage.setItem('sim_violations', JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
        }, (err) => {
          if (isPermissionError(err)) {
            console.warn('[Firestore] Memerlukan otentikasi staf untuk pelanggaran:', err);
          } else {
            handleFirestoreError(err, OperationType.GET, 'violations');
          }
        });
        unsubscribers.push(unsub);
      } catch (e) {}
    }

    // Counseling Listener (strictly restricted to Guru BK and Waka / Admin, with resilient merge)
    if (isBkOrAdmin && auth.currentUser) {
      try {
        const unsub = onSnapshot(collection(db, 'counseling'), (snapshot) => {
          const loaded: CounselingSession[] = [];
          snapshot.forEach(docSnap => {
            loaded.push({ id: docSnap.id, ...docSnap.data() } as CounselingSession);
          });
          setCounseling(prev => {
            const m = new Map<string, StudentCounseling>();
            loaded.forEach(c => m.set(c.id, c));
            prev.forEach(p => { if (p && p.id && !m.has(p.id)) m.set(p.id, p); });
            const merged = Array.from(m.values());
            try { localStorage.setItem('sim_counseling', JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
        }, (err) => {
          if (isPermissionError(err)) {
            console.warn('[Firestore] Memerlukan otentikasi peran Guru BK untuk konseling:', err);
          } else {
            handleFirestoreError(err, OperationType.GET, 'counseling');
          }
        });
        unsubscribers.push(unsub);
      } catch (e) {}
    }

    // Permissions Listener (with resilient merge)
    try {
      const unsub = onSnapshot(collection(db, 'permissions'), (snapshot) => {
        const loaded: StudentPermission[] = [];
        snapshot.forEach(docSnap => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as StudentPermission);
        });
        setPermissions(prev => {
          const m = new Map<string, StudentPermission>();
          loaded.forEach(p => m.set(p.id, p));
          prev.forEach(p => { if (p && p.id && !m.has(p.id)) m.set(p.id, p); });
          const merged = Array.from(m.values());
          try { localStorage.setItem('sim_permissions', JSON.stringify(merged)); } catch (e) {}
          return merged;
        });
      }, (err) => {
        if (isPermissionError(err)) {
          console.warn('[Firestore] Izin baca ditolak untuk permissions:', err);
        } else {
          handleFirestoreError(err, OperationType.GET, 'permissions');
        }
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // OSIM Members Listener
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
        // Auto-sync BPH & Ketua Sekbid to cPanel users in real-time
        if (syncUsersFromOsim && osimDepartments.length > 0 && deduplicated.length > 0) {
          syncUsersFromOsim(osimDepartments, deduplicated).catch(e => console.warn('Auto sync on osim snapshot note:', e));
        }
      }, (err) => {
        if (isPermissionError(err)) {
          console.warn('[Firestore] Izin baca ditolak untuk osim_members:', err);
        } else {
          handleFirestoreError(err, OperationType.GET, 'osim_members');
        }
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // OSIM Programs Listener (with resilient merge)
    try {
      const unsub = onSnapshot(collection(db, 'osim_programs'), (snapshot) => {
        const loaded: OsimWorkProgram[] = [];
        snapshot.forEach(docSnap => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as OsimWorkProgram);
        });
        setOsimPrograms(prev => {
          const m = new Map<string, OsimWorkProgram>();
          loaded.forEach(p => m.set(p.id, p));
          prev.forEach(p => { if (p && p.id && !m.has(p.id)) m.set(p.id, p); });
          const merged = Array.from(m.values());
          try { localStorage.setItem('sim_osim_programs', JSON.stringify(merged)); } catch (e) {}
          return merged;
        });
      }, (err) => {
        if (isPermissionError(err)) {
          console.warn('[Firestore] Izin baca ditolak untuk osim_programs:', err);
        } else {
          handleFirestoreError(err, OperationType.GET, 'osim_programs');
        }
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // School Rules Listener
    try {
      const unsub = onSnapshot(collection(db, 'school_rules'), (snapshot) => {
        if (!snapshot.empty) {
          const loaded: SchoolRuleArticle[] = [];
          snapshot.forEach(docSnap => {
            loaded.push({ id: docSnap.id, ...docSnap.data() } as SchoolRuleArticle);
          });
          const mergedMap = new Map<string, SchoolRuleArticle>();
          INITIAL_SCHOOL_RULES.forEach(r => mergedMap.set(r.id, r));
          loaded.forEach(r => mergedMap.set(r.id, r));
          const finalRules = Array.from(mergedMap.values());
          setSchoolRules(finalRules);
          try {
            localStorage.setItem('sim_school_rules', JSON.stringify(finalRules));
          } catch (e) {}
        }
      }, (err) => {
        if (isPermissionError(err)) {
          console.warn('[Firestore] Izin baca ditolak untuk school_rules:', err);
        } else {
          handleFirestoreError(err, OperationType.GET, 'school_rules');
        }
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // Rewards Real-time Listener (mirroring violations structure)
    try {
      const unsub = onSnapshot(collection(db, 'rewards'), (snapshot) => {
        const loaded: StudentReward[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as StudentReward;
          if (!data.isDeleted) {
            loaded.push({
              id: docSnap.id,
              ...data,
              studentID: data.studentID || data.studentId,
              class: data.class || data.studentClass,
              rewardType: data.rewardType || data.rewardTitle
            });
          }
        });
        setRewards(prev => {
          const m = new Map<string, StudentReward>();
          loaded.forEach(r => m.set(r.id, r));
          prev.forEach(p => { if (p && p.id && !m.has(p.id)) m.set(p.id, p); });
          const merged = Array.from(m.values());
          try { localStorage.setItem('sim_rewards', JSON.stringify(merged)); } catch (e) {}
          return merged;
        });
      }, (err) => {
        if (isPermissionError(err)) {
          console.warn('[Firestore] Izin baca ditolak untuk rewards:', err);
        } else {
          handleFirestoreError(err, OperationType.GET, 'rewards');
        }
      });
      unsubscribers.push(unsub);
    } catch (e) {}

    // Auto-bootstrap rewards collection in Firestore if empty so it appears immediately in Firebase Console
    const ensureRewardsCollection = async () => {
      try {
        const snap = await getDocs(collection(db, 'rewards'));
        if (snap.empty) {
          const studentSnap = await getDocs(collection(db, 'students'));
          const targetStudent = studentSnap.docs[0]?.data();
          const sampleReward: StudentReward = {
            id: `rew_${Date.now()}`,
            studentId: targetStudent?.id || 's_sample_01',
            studentID: targetStudent?.id || 's_sample_01',
            studentName: targetStudent?.fullName || 'Siswa Berprestasi Teladan',
            studentNis: targetStudent?.nis || '202601001',
            studentClass: targetStudent?.className || '10-A',
            class: targetStudent?.className || '10-A',
            rewardType: '[RW-01] Menemukan dan mengembalikan barang berharga',
            rewardTitle: '[RW-01] Menemukan dan mengembalikan barang berharga',
            category: 'Kedisiplinan & Karakter',
            points: 10,
            date: new Date().toISOString().split('T')[0],
            description: 'Pemberian piagam penghargaan integritas kejujuran atas penyerahan barang temuan kepada madrasah.',
            actionTaken: 'Pemberian piagam penghargaan & penambahan 10 poin apresiasi',
            officerName: 'Wali Kelas & Guru BK',
            status: 'Diverifikasi',
            academicYear: activeAcademicYear || '2026/2027',
            isDeleted: false,
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'rewards', sampleReward.id), sampleReward);
        }
      } catch (err) {
        console.warn('[Firestore] Note initializing rewards collection:', err);
      }
    };
    ensureRewardsCollection();

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [currentUser?.uid, currentUser?.role]);

  // Automatic background synchronization of OSIM BPH and Ketua Sekbid into cPanel User Accounts
  useEffect(() => {
    if (!syncUsersFromOsim || osimDepartments.length === 0 || osimMembers.length === 0) return;
    const timer = setTimeout(() => {
      syncUsersFromOsim(osimDepartments, osimMembers).catch(e => console.warn('Periodic osim auto sync note:', e));
    }, 1200);
    return () => clearTimeout(timer);
  }, [osimDepartments.length, osimMembers.length]);

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
        rewards,
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

  const verifyCloudDataIntegrity = async () => {
    try {
      const isBkOrAdminUser = currentUser && ['super_admin', 'admin', 'waka_kesiswaan', 'waka', 'guru_bk', 'bk'].includes(currentUser.role);
      const isStaffUser = currentUser && ['super_admin', 'admin', 'waka_kesiswaan', 'waka', 'admin_kesiswaan', 'guru_bk', 'bk', 'pembina_osim', 'pembina', 'pembina_ekstrakurikuler', 'pembina_ekskul', 'coach_ekstrakurikuler', 'wali_kelas', 'homeroom_teacher', 'guru', 'teacher', 'guru_mapel'].includes(currentUser.role);

      const [tSnap, sSnap, cSnap, eSnap, uSnap, vSnap, rSnap, csSnap, ctSnap] = await Promise.all([
        getDocs(collection(db, 'teachers')).catch(() => null),
        getDocs(collection(db, 'students')).catch(() => null),
        getDocs(collection(db, 'classes')).catch(() => null),
        getDocs(collection(db, 'extracurriculars')).catch(() => null),
        getDocs(collection(db, 'users')).catch(() => null),
        (isStaffUser && auth.currentUser) ? getDocs(collection(db, 'violations')).catch(() => null) : Promise.resolve(null),
        getDocs(collection(db, 'rewards')).catch(() => null),
        (isBkOrAdminUser && auth.currentUser) ? getDocs(collection(db, 'counseling')).catch(() => null) : Promise.resolve(null),
        getDocs(collection(db, 'cash_transactions')).catch(() => null)
      ]);
      return {
        teachers: { firestore: tSnap ? tSnap.size : 0, react: teachers.length },
        students: { firestore: sSnap ? sSnap.size : 0, react: students.length },
        classes: { firestore: cSnap ? cSnap.size : 0, react: classes.length },
        extracurriculars: { firestore: eSnap ? eSnap.size : 0, react: extracurriculars.length },
        users: { firestore: uSnap ? uSnap.size : 0, react: allUsers.length },
        violations: { firestore: vSnap ? vSnap.size : 0, react: violations.length },
        rewards: { firestore: rSnap ? rSnap.size : 0, react: rewards.length },
        counseling: { firestore: csSnap ? csSnap.size : 0, react: counseling.length },
        cash_transactions: { firestore: ctSnap ? ctSnap.size : 0, react: cashTransactions.length }
      };
    } catch (e) {
      return {
        teachers: { firestore: 0, react: teachers.length },
        students: { firestore: 0, react: students.length },
        classes: { firestore: 0, react: classes.length },
        extracurriculars: { firestore: 0, react: extracurriculars.length },
        users: { firestore: 0, react: allUsers.length },
        violations: { firestore: 0, react: violations.length },
        counseling: { firestore: 0, react: counseling.length },
        cash_transactions: { firestore: 0, react: cashTransactions.length }
      };
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
      osimMeetings,
      cashAccounts,
      cashTransactions
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
      if (Array.isArray(bundle.cashAccounts)) {
        setCashAccounts(bundle.cashAccounts);
        try { localStorage.setItem('sim_cash_accounts', JSON.stringify(bundle.cashAccounts)); } catch (e) {}
      }
      if (Array.isArray(bundle.cashTransactions)) {
        setCashTransactions(bundle.cashTransactions);
        try { localStorage.setItem('sim_cash_transactions', JSON.stringify(bundle.cashTransactions)); } catch (e) {}
      }

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
    if (auth.currentUser) {
      setDoc(doc(db, 'audit_logs', newLog.id), newLog).catch(() => {});
    }
  };

  const clearAuditLogs = async () => {
    setAuditLogs([]);
    try {
      localStorage.removeItem('sim_audit_logs');
    } catch (e) {}
    // Invariant: Catatan audit_logs di Firestore bersifat mutlak/immutable (allow update, delete: if false)
    // Pembersihan hanya mereset tampilan lokal/memori dan mencatat aksi pembersihan ke log audit resmi
    logAction('CLEAR_LOGS', 'Audit Log & Keamanan', 'Administrator mengosongkan riwayat tampilan log aktivitas aplikasi');
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
        if (auth.currentUser) {
          setDoc(doc(db, 'schools', 'main_school'), { currentAcademicYear: year, currentSemester: semester }, { merge: true }).catch(() => {});
        }
      } catch (e) {}
      return next;
    });
    // Update active status in academicYears array
    setAcademicYears(prev => {
      const updated = prev.map(ay => {
        const isTarget = ay.name === year || ay.year === year;
        if (isTarget) {
          try {
            if (auth.currentUser) {
              setDoc(doc(db, 'academic_years', ay.id), { isActive: true }, { merge: true }).catch(() => {});
            }
          } catch (e) {}
        } else if (ay.isActive) {
          try {
            if (auth.currentUser) {
              setDoc(doc(db, 'academic_years', ay.id), { isActive: false }, { merge: true }).catch(() => {});
            }
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
    if (auth.currentUser) {
      logAction('CHANGE_ACADEMIC_YEAR', 'Tahun Ajaran', `Mengubah periode aktif ke ${year} (${semester})`);
    }
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
      if (auth.currentUser) {
        setDoc(doc(db, 'academic_years', newYear.id), newYear).catch(() => {});
      }
    } catch (e) {
      console.warn('Firestore addAcademicYear notice:', e);
    }
    if (auth.currentUser) {
      logAction('ADD_ACADEMIC_YEAR', 'Tahun Ajaran', `Menambahkan tahun pelajaran baru: ${newYear.year}`);
    }
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
      if (auth.currentUser) {
        setDoc(doc(db, 'academic_years', id), data, { merge: true }).catch(() => {});
      }
    } catch (e) {
      console.warn('Firestore updateAcademicYear notice:', e);
    }
    if (auth.currentUser) {
      logAction('UPDATE_ACADEMIC_YEAR', 'Tahun Ajaran', `Memperbarui data tahun pelajaran ID: ${id}`);
    }
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
      deleteDoc(doc(db, 'academic_years', id)).catch(() => {});
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
        if (auth.currentUser) {
          setDoc(doc(db, 'academic_years', newAY.id), newAY).catch(() => {});
        }
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
      if (auth.currentUser) {
        setDoc(doc(db, 'schools', 'main_school'), updatedSetting, { merge: true }).catch(() => {});
      }
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
    const valRes = validatePayload(studentProfileSchema, {
      name: data.fullName,
      fullName: data.fullName,
      nis: data.nis,
      nisn: data.nisn,
      className: data.className,
      gender: data.gender,
      email: (data as any).email || undefined,
      status: data.status || 'Aktif'
    });
    if (!valRes.success) {
      console.warn('[Schema Guard] Peringatan validasi profil siswa:', valRes.errors);
    }

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
      await setDoc(doc(db, 'students', newStudent.id), newStudent);
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
      await updateDoc(doc(db, 'students', id), finalData);
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

    // Cascade archive associated violations to prevent zombie records (e.g. Nabila & Abdul Asri)
    setViolations(prev => {
      const remaining = prev.filter(v => v.studentId !== id && (!target?.fullName || normalizeName(v.studentName) !== normalizeName(target.fullName)));
      try {
        localStorage.setItem('sim_violations', JSON.stringify(remaining));
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
      // Archive violations belonging to this student in Firestore
      const orphanViols = violations.filter(v => v.studentId === id || (target?.fullName && normalizeName(v.studentName) === normalizeName(target.fullName)));
      for (const ov of orphanViols) {
        updateDoc(doc(db, 'violations', ov.id), { isDeleted: true, deletedAt: new Date().toISOString() }).catch(() => {});
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

    // Cascade archive associated violations to prevent zombie records
    const targetNamesSet = new Set(targetStudents.map(s => normalizeName(s.fullName)).filter(Boolean));
    setViolations(prev => {
      const remaining = prev.filter(v => !idSet.has(v.studentId) && (!v.studentName || !targetNamesSet.has(normalizeName(v.studentName))));
      try {
        localStorage.setItem('sim_violations', JSON.stringify(remaining));
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
    // Ensure we have current official classes to prevent creating phantom duplicate classes
    let officialClasses = classes;
    if (!officialClasses || officialClasses.length === 0) {
      try {
        const cSnap = await getDocs(collection(db, 'classes'));
        const loaded: SchoolClass[] = [];
        cSnap.forEach(d => {
          if (!isPurgedClassId(d.id)) loaded.push({ id: d.id, ...(d.data() as SchoolClass) });
        });
        officialClasses = deduplicateClassesList(loaded).deduplicated;
      } catch (e) {}
    }

    // Auto-detect and register new classes from imported student class names if needed
    const existingClassNames = new Set(officialClasses.map(c => c.name.trim().toLowerCase()));
    const existingNormNames = new Set(officialClasses.map(c => normalizeClassString(c.name)));
    const newClassesToCreate: SchoolClass[] = [];

    importedList.forEach(s => {
      const cName = (s.className || '').trim();
      const existingMatch = findMatchingClass(cName, officialClasses);
      const norm = normalizeClassString(cName);
      if (cName && !existingMatch && !existingClassNames.has(cName.toLowerCase()) && !existingNormNames.has(norm)) {
        existingClassNames.add(cName.toLowerCase());
        existingNormNames.add(norm);
        
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
      setDoc(doc(db, 'classes', newClass.id), newClass).catch(() => {});
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
      updateDoc(doc(db, 'classes', id), data).catch(() => {});
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
      deleteDoc(doc(db, 'classes', id)).catch(() => {});
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
      updateDoc(doc(db, 'classes', classId), { homeroomTeacher: teacherName }).catch(() => {});
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
    const valRes = validatePayload(teacherProfileSchema, {
      fullName: data.fullName,
      nip: data.nip || undefined,
      gender: data.gender,
      role: data.role || 'Guru',
      subject: data.subject || undefined,
      email: data.email || undefined,
      isActive: data.isActive !== false
    });
    if (!valRes.success) {
      console.warn('[Schema Guard] Peringatan validasi profil guru:', valRes.errors);
    }

    const assignedCode = normalizeTeacherCode(data.code, teachers.length + 1, data.fullName);
    const newDocId = getNextTeacherDocId(teachers);
    const cleanAssigned = canonicalizeAssignedEkskulIds(data.assignedExtracurriculars, extracurriculars);
    const newT: Teacher = {
      id: newDocId,
      ...data,
      name: data.fullName,
      assignedExtracurriculars: cleanAssigned,
      code: assignedCode,
      isActive: data.isActive !== false,
      isLoginActive: false,
      accountStatus: 'pending'
    };

    // Bersihkan tombstone usang jika ID, NIP, atau Email ini pernah terhapus
    removeDeletedUid(newDocId);
    removeDeletedUid(`user_${newDocId}`);
    if (data.email) {
      removeDeletedUid(data.email.trim().toLowerCase());
    }
    const cleanNip = cleanDigits(data.nip);
    if (cleanNip && cleanNip.length >= 6) {
      removeDeletedUid(cleanNip);
      removeDeletedUid(`user_${cleanNip}`);
    }

    if (newT.assignedExtracurriculars !== undefined) {
      newT.assignedExtracurriculars = canonicalizeAssignedEkskulIds(newT.assignedExtracurriculars, extracurriculars);
      const cleanNames = newT.assignedExtracurriculars.map(eid => {
        const match = (extracurriculars || []).find(e => e.id === eid);
        return match ? match.name : eid;
      });
      newT.extracurricularNames = cleanNames;
      newT.extracurricularName = cleanNames.join(', ') || undefined;
    }

    setTeachers(prev => {
      const merged = [newT, ...prev.filter(t => t.id !== newDocId)];
      try {
        localStorage.setItem('sim_teachers', JSON.stringify(merged));
      } catch (e) {}
      return merged;
    });
    try {
      await setDoc(doc(db, 'teachers', newT.id), newT, { merge: true });
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

    logAction('ADD_TEACHER', 'Dewan Guru & Manajemen', `Menambahkan data guru ${newT.fullName} (ID: ${newT.id}) dan menyinkronkan ke Ekstrakurikuler & Intrakurikuler`);
  };

  const updateTeacher = async (id: string, data: Partial<Teacher>) => {
    const oldTeacher = teachers.find(t => t.id === id);
    const cleanData = { ...data };
    if (data.assignedExtracurriculars !== undefined) {
      cleanData.assignedExtracurriculars = canonicalizeAssignedEkskulIds(data.assignedExtracurriculars, extracurriculars);
      const cleanNames = cleanData.assignedExtracurriculars.map(eid => {
        const match = (extracurriculars || []).find(e => e.id === eid);
        return match ? match.name : eid;
      });
      cleanData.extracurricularNames = cleanNames;
      cleanData.extracurricularName = cleanNames.join(', ') || undefined;
    }
    let updatedTeacher: Teacher | undefined;
    setTeachers(prev => {
      const merged = prev.map(t => {
        if (t.id === id) {
          updatedTeacher = { ...t, ...cleanData };
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
      await setDoc(doc(db, 'teachers', id), cleanData, { merge: true });
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
    if (target?.email) {
      addDeletedUid(target.email.trim().toLowerCase());
    }
    const cleanNip = target?.nip ? cleanDigits(target.nip) : '';
    if (cleanNip && cleanNip.length >= 6) {
      addDeletedUid(cleanNip);
      addDeletedUid(`user_${cleanNip}`);
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
      if (t.email) {
        addDeletedUid(t.email.trim().toLowerCase());
      }
      const cleanNip = t.nip ? cleanDigits(t.nip) : '';
      if (cleanNip && cleanNip.length >= 6) {
        addDeletedUid(cleanNip);
        addDeletedUid(`user_${cleanNip}`);
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
          assignedExtracurriculars: canonicalizeAssignedEkskulIds(
            (t.assignedExtracurriculars && t.assignedExtracurriculars.length > 0)
              ? t.assignedExtracurriculars
              : existing.assignedExtracurriculars,
            extracurriculars
          ),
          isActive: t.isActive !== false
        };
        processedTeachers.push(updatedTeacher);
      } else {
        // INSERT Baru dengan ID standar dan urut (guru_01, guru_02...)
        const newDocId = getNextTeacherDocId([...currentTeachers, ...processedTeachers]);
        removeDeletedUid(newDocId);
        removeDeletedUid(`user_${newDocId}`);
        const cleanNip = t.nip ? cleanDigits(t.nip) : '';
        if (cleanNip && cleanNip.length >= 6) {
          removeDeletedUid(cleanNip);
          removeDeletedUid(`user_${cleanNip}`);
        }
        const cleanAssigned = canonicalizeAssignedEkskulIds(t.assignedExtracurriculars, extracurriculars);
        const cleanNames = cleanAssigned.map(id => {
          const match = (extracurriculars || []).find(e => e.id === id);
          return match ? match.name : id;
        });
        const newTeacher: Teacher = {
          id: newDocId,
          ...t,
          assignedExtracurriculars: cleanAssigned,
          extracurricularNames: cleanNames,
          extracurricularName: cleanNames.join(', ') || undefined,
          code: standardCode,
          isActive: t.isActive !== false
        };
        processedTeachers.push(newTeacher);
      }
    });

    let finalTeachers: Teacher[] = [];
    if (mode === 'replace') {
      // Pada mode replace, daftar baru menggantikan total daftar guru
      finalTeachers = deduplicateTeachersList(processedTeachers, extracurriculars);

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
      finalTeachers = deduplicateTeachersList([...processedTeachers, ...untouchedTeachers], extracurriculars);
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

  // Tahap 3: Database Auto-Harmonization & Cross-Collection Synchronization Engine
  const harmonizeTeachersFirestore = async (): Promise<{ success: boolean; migratedCount: number; message: string; teachers?: Teacher[] }> => {
    try {
      setIsSyncing(true);

      // TAHAP 3: 1. Ambil & bersihkan data Ekstrakurikuler di Firestore (Hapus dokumen sampah berkode angka)
      const ekskulSnap = await getDocs(collection(db, 'extracurriculars'));
      const freshEkskuls: Extracurricular[] = [];
      const dirtyEkskulIdsToDelete: string[] = [];

      ekskulSnap.forEach(d => {
        const dData = d.data() as Extracurricular;
        const id = d.id;
        if (/^\d{1,2}$/.test(id) || /^ekskul_[1-9]$/i.test(id) || /^e[1-9]$/i.test(id) || isPurgedExtracurricular(id) || isPurgedExtracurricular(dData?.name || '')) {
          dirtyEkskulIdsToDelete.push(id);
        } else {
          freshEkskuls.push({ id, ...dData });
        }
      });

      for (const dirtyId of dirtyEkskulIdsToDelete) {
        await deleteDoc(doc(db, 'extracurriculars', dirtyId)).catch(() => {});
      }

      // TAHAP 3: 2. Ambil data Guru dari Firestore
      const teacherSnap = await getDocs(collection(db, 'teachers'));
      const oldDocIdsToDelete: string[] = [];
      const rawList: Teacher[] = [];
      
      teacherSnap.forEach(d => {
        if (d.id === 'user_super_admin') {
          oldDocIdsToDelete.push(d.id);
        } else {
          rawList.push({ id: d.id, ...(d.data() as Teacher) });
        }
      });

      teachers.forEach(t => {
        if (t.id !== 'user_super_admin' && !rawList.some(r => r.id === t.id || (r.nip && t.nip && r.nip !== '-' && cleanDigits(r.nip) === cleanDigits(t.nip)))) {
          rawList.push(t);
        }
      });

      if (rawList.length === 0) {
        setIsSyncing(false);
        return { success: true, migratedCount: 0, message: 'Tidak ada data guru yang perlu diharmonisasi.', teachers: [] };
      }

      const activeEkskuls = freshEkskuls.length > 0 ? freshEkskuls : extracurriculars;

      // Deduplicate dewan guru dengan referensi ekskul bersih
      const deduplicated = deduplicateTeachersList(rawList, activeEkskuls);
      const sorted = sortTeachersByHierarchy(deduplicated);

      let migratedCount = 0;
      const updatedTeachers: Teacher[] = [];
      const ekskulToCoachMap = new Map<string, { id: string; name: string; code?: string }>();

      for (let i = 0; i < sorted.length; i++) {
        const item = sorted[i];
        
        // Pertahankan Primary Key / Doc ID Asli Guru
        const teacherDocId = item.id && item.id.trim() ? item.id : formatTeacherDocId(i + 1);
        
        const teacherCode = item.code && isValidTeacherCode(item.code)
          ? item.code.trim().toUpperCase()
          : formatTeacherCode(i + 1, item.fullName);

        // TAHAP 3: Pembersihan Kode Angka murni & penugasan ekskul bersih
        const directAssigned = Array.isArray(item.assignedExtracurriculars) && item.assignedExtracurriculars.length > 0
          ? item.assignedExtracurriculars
          : [];

        const cleanAssigned = canonicalizeAssignedEkskulIds(directAssigned, activeEkskuls);
        const cleanAssignedNames = cleanAssigned.map(id => {
          const match = activeEkskuls.find(e => e.id === id);
          return match ? match.name : id;
        }).filter(name => !/^\d+$/.test(name) && !/^ekskul_\d+$/i.test(name));
        const cleanAssignedNameStr = cleanAssignedNames.join(', ');

        const isPembinaRole = cleanAssigned.length > 0;
        const standardizedTeacher: Teacher = {
          ...item,
          id: teacherDocId,
          code: teacherCode,
          fullName: (item.fullName || (item as any).name || '').trim(),
          nip: item.nip && item.nip.trim() ? item.nip.trim() : '-',
          gender: item.gender || 'L',
          role: item.role || (isPembinaRole ? 'Pembina Ekskul' : 'Guru Mapel'),
          isPembina: isPembinaRole || !!item.isPembina,
          subject: item.subject && item.subject.trim() ? item.subject.trim() : '-',
          phone: item.phone && item.phone.trim() ? item.phone.trim() : '-',
          email: item.email ? item.email.trim() : '',
          assignedExtracurriculars: cleanAssigned,
          extracurricularNames: cleanAssignedNames,
          extracurricularName: cleanAssignedNameStr || undefined,
          isActive: item.isActive !== false,
          isCashManager: !!item.isCashManager,
          cashManagerTitle: item.isCashManager ? (item.cashManagerTitle || 'Bendahara Kesiswaan') : undefined
        };

        updatedTeachers.push(standardizedTeacher);

        // Catat pemetaan pembina ekskul
        for (const eid of cleanAssigned) {
          if (!ekskulToCoachMap.has(eid)) {
            ekskulToCoachMap.set(eid, {
              id: teacherDocId,
              name: standardizedTeacher.fullName,
              code: standardizedTeacher.code
            });
          }
        }

        // Tulis pembaruan standar ke dokumen guru yang bersangkutan di Firestore
        await setDoc(doc(db, 'teachers', teacherDocId), standardizedTeacher, { merge: true });
        migratedCount++;

        removeDeletedUid(teacherDocId);
        removeDeletedUid(`user_${teacherDocId}`);
      }

      // TAHAP 3: 3. Sinkronkan seluruh dokumen Ekstrakurikuler dua arah (Update pembina yang sesuai, reset jika tidak dibina guru)
      const reconciledEkskuls = activeEkskuls.map(ekskul => {
        const coach = ekskulToCoachMap.get(ekskul.id);
        if (coach) {
          return {
            ...ekskul,
            coachId: coach.id,
            coachName: coach.name,
            coachCode: coach.code || ''
          };
        } else if (ekskul.coachId && !updatedTeachers.some(t => t.id === ekskul.coachId && (t.assignedExtracurriculars || []).includes(ekskul.id))) {
          // Guru sebelumnya sudah tidak membina ekskul ini: reset ke Belum Ditentukan
          return {
            ...ekskul,
            coachId: '',
            coachName: 'Belum Ditentukan',
            coachCode: ''
          };
        }
        return ekskul;
      });

      for (const e of reconciledEkskuls) {
        await updateDoc(doc(db, 'extracurriculars', e.id), {
          coachId: e.coachId || '',
          coachName: e.coachName || 'Belum Ditentukan',
          coachCode: e.coachCode || ''
        }).catch(() => {});
      }

      setExtracurriculars(reconciledEkskuls);
      try {
        localStorage.setItem('sim_extracurriculars', JSON.stringify(reconciledEkskuls));
      } catch (e) {}

      // Hapus hanya dokumen sampah yang benar-benar bukan guru
      for (const oldId of oldDocIdsToDelete) {
        if (oldId && !updatedTeachers.some(t => t.id === oldId)) {
          try {
            await deleteDoc(doc(db, 'teachers', oldId));
          } catch (e) {}
        }
      }

      // Auto-sync into cPanel Users collection
      if (syncUsersFromTeachers) {
        try {
          await syncUsersFromTeachers(updatedTeachers, reconciledEkskuls);
          await deleteDoc(doc(db, 'users', 'user_teacher_pitria_lawenusa')).catch(() => {});
        } catch (e) {}
      }

      // Update state and local storage
      setTeachers(updatedTeachers);
      try {
        localStorage.setItem('sim_teachers', JSON.stringify(updatedTeachers));
      } catch (e) {}

      logAction('HARMONIZE_TEACHERS', 'Dewan Guru', `Mengharmonisasi ${updatedTeachers.length} data guru dengan menjaga integritas ID dokumen dan membersihkan kode angka ekskul`);
      setIsSyncing(false);

      return {
        success: true,
        migratedCount,
        message: `Berhasil merapikan dan menstandarisasi ${updatedTeachers.length} data guru tanpa mengubah ID dokumen asli sehingga relasi binaan dan riwayat data tetap aman.`,
        teachers: updatedTeachers
      };
    } catch (err: any) {
      setIsSyncing(false);
      console.error('Error harmonizing teachers Firestore:', err);
      return {
        success: false,
        migratedCount: 0,
        message: `Gagal melakukan harmonisasi: ${err?.message || 'Terjadi kesalahan sistem'}`
      };
    }
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
          oldTeacher &&
          (ekskul.coachId === teacher.id || (ekskul.coachName && normalizeName(ekskul.coachName) === normalizeName(oldTeacher.fullName))) &&
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
          setDoc(doc(db, 'schools', next.id || 'main_school'), next, { merge: true }).catch(() => {});
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
          setDoc(doc(db, 'schools', next.id || 'main_school'), next, { merge: true }).catch(() => {});
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
      case 'coach_ekstrakurikuler':
      case 'pembina_ekskul':
      case 'pembina':
        return 'Pembina Ekskul';
      case 'waka_kesiswaan':
        return 'Waka Kesiswaan';
      case 'super_admin':
        return 'Super Admin / Proktor';
      case 'anggota_osim':
      case 'pengurus_osim':
        return 'Pengurus OSIM';
      default:
        return 'Guru / Pembina';
    }
  };

  // cPanel Cross-Module Synchronization
  const syncUserFromCPanel = async (user: UserProfile, oldUser?: UserProfile) => {
    const isOldOsim = oldUser && (oldUser.role === 'pengurus_osim' || oldUser.role === 'anggota_osim');
    const isCurrentOsim = user.role === 'pengurus_osim' || user.role === 'anggota_osim';

    // If user was previously an OSIM officer and role changed to something else, remove from OSIM cabinet
    if (isOldOsim && !isCurrentOsim) {
      setOsimMembers(prev => {
        const remaining = prev.filter(m => m.id !== user.uid && m.id !== oldUser.uid);
        try { localStorage.setItem('sim_osim_members', JSON.stringify(remaining)); } catch (e) {}
        return remaining;
      });
      deleteDoc(doc(db, 'osim_members', user.uid)).catch(() => {});
      if (oldUser.uid) deleteDoc(doc(db, 'osim_members', oldUser.uid)).catch(() => {});
    }

    // A. If this is an OSIM student account (anggota_osim / pengurus_osim), sync to osimMembers, NOT teachers list
    if (isCurrentOsim) {
      // Clean up from teachers list if previously was registered as teacher
      if (oldUser && oldUser.role !== 'pengurus_osim' && oldUser.role !== 'anggota_osim') {
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

        const cleanUserEmail = (user.email || '').trim().toLowerCase();
        const cleanUserNis = user.nip ? cleanDigits(user.nip) : '';
        const normUserName = normalizeName(user.displayName);

        const idx = prev.findIndex(m => {
          const memberSekbidNum = extractSekbidNumber(m.sekbid) || extractSekbidNumber(m.position);
          // Guard: Jangan pernah mencocokkan jika berasal dari Sekbid yang berbeda
          if (userSekbidNum !== null && memberSekbidNum !== null && userSekbidNum !== memberSekbidNum) return false;
          // Guard: Jangan pernah mencocokkan Sekbid dengan BPH
          if ((userSekbidNum !== null && isBphMember(m)) || (isUserBph && memberSekbidNum !== null)) return false;

          // 0. Use dedicated relational isOsimMemberUserMatch
          if (isOsimMemberUserMatch(user, m)) return true;
          // 1. Direct ID / userUid match
          if (m.id === user.uid || (m as any).userUid === user.uid) return true;
          // 2. Exact email match
          if (cleanUserEmail && m.email && m.email.trim().toLowerCase() === cleanUserEmail) return true;
          // 3. NIS match (Hanya jika NIS valid dan bukan placeholder '24251000')
          if (cleanUserNis && !isPlaceholderNis(cleanUserNis) && cleanUserNis.length >= 4 && m.studentNis && cleanDigits(m.studentNis) === cleanUserNis) return true;
          // 4. Exact full name match
          if (normUserName && normUserName.length >= 4 && normalizeName(m.fullName) === normUserName) return true;
          if (user.username && (m.loginUsername === user.username || m.username === user.username)) return true;

          // 5. Fallback Sekbid matching (only if username or department code explicitly matches this sekbid)
          if (userSekbidNum !== null && (user.username?.includes(`sekbid${userSekbidNum}`) || user.osimDepartmentCode?.includes(`${userSekbidNum}`))) {
            if (memberSekbidNum === userSekbidNum) return true;
          }

          // 6. Fallback BPH matching (only for generic functional usernames like osim.ketua)
          if (isUserBph && (user.username === 'osim.ketua' || user.username === 'osim.wakil' || user.username === 'osim.sekretaris' || user.username === 'osim.bendahara')) {
            const memberIsBph = isBphMember(m);
            if (memberIsBph) {
              const pos = (m.position || '').toLowerCase();
              if (user.username === 'osim.ketua') {
                if (pos.includes('ketua') && !pos.includes('wakil') && !pos.includes('sekbid')) return true;
              }
              if (user.username === 'osim.wakil') {
                if (pos.includes('wakil')) return true;
              }
              if (user.username === 'osim.sekretaris') {
                if (pos.includes('sekretaris')) return true;
              }
              if (user.username === 'osim.bendahara') {
                if (pos.includes('bendahara')) return true;
              }
            }
          }

          if (oldUser?.displayName && m.fullName.toLowerCase().trim() === oldUser.displayName.toLowerCase().trim() && (userSekbidNum === null || memberSekbidNum === userSekbidNum)) return true;
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
            isLoginActive: true,
            accountStatus: 'active',
            loginStatus: 'active',
            userUid: user.uid,
            loginUsername: user.username,
            username: user.username,
            position: (user.osimPosition as any) || updated[idx].position,
            sekbid: isUserBph ? 'BPH (Badan Pengurus Harian)' : (normalizeSekbidName(user.osimDepartmentName) || updated[idx].sekbid),
            className: user.studentClass || updated[idx].className
          };
          updated[idx] = updatedMember;
          try {
            localStorage.setItem('sim_osim_members', JSON.stringify(updated));
            setDoc(doc(db, 'osim_members', updatedMember.id), updatedMember, { merge: true }).catch(() => {});
          } catch (e) {}
          return updated;
        } else {
          // Hanya buat anggota baru jika BUKAN nama dummy generik dan BUKAN UID yang sudah dihapus
          const isGenericPlaceholder = /^(ketua|wakil|sekretaris|bendahara|koordinator|pengurus|anggota)\s*(umum|osim|sekbid|\d)*$/i.test(cleanName) ||
            cleanName === 'Ketua Umum OSIM' || cleanName.startsWith('Ketua Sekbid');
          if (isGenericPlaceholder || isDeletedUid(user.uid) || isDeletedUid(`user_${user.uid}`)) {
            return prev;
          }

          const sekbidVal = isUserBph
            ? 'BPH (Badan Pengurus Harian)'
            : (normalizeSekbidName(user.osimDepartmentName) || (userSekbidNum ? `Sekbid ${userSekbidNum}` : 'Sekbid 1: Keimanan, Ketaqwaan & Moderasi Beragama'));
          const defaultClass = classes && classes.length > 0 ? classes[0].name : '';
          const newMember: OsimMember = {
            id: user.uid,
            fullName: cleanName,
            studentNis: user.nip || '',
            className: user.studentClass || defaultClass,
            position: (user.osimPosition as any) || (isUserBph ? 'Pengurus BPH' : `Ketua ${user.osimDepartmentCode || 'Sekbid'}`),
            sekbid: sekbidVal,
            phone: user.phone || '-',
            email: user.email,
            status: user.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
            period: activeAcademicYear || '2026/2027',
            loginUsername: user.username,
            username: user.username,
            createdAt: new Date().toISOString()
          };
          const updated = [...prev, newMember];
          try {
            localStorage.setItem('sim_osim_members', JSON.stringify(updated));
            setDoc(doc(db, 'osim_members', newMember.id), newMember, { merge: true }).catch(() => {});
          } catch (e) {}
          return updated;
        }
      });
      return;
    }

    const roleLabel = getRoleLabelFromUserRole(user.role);
    const assignedIds = canonicalizeAssignedEkskulIds(user.assignedExtracurricularIds || user.extracurricularIds || [], extracurriculars);

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
          assignedExtracurriculars: assignedIds,
          photoUrl: user.photoURL || (user as any).photoUrl || updated[idx].photoUrl,
          isActive: user.status !== 'Nonaktif'
        };
        updated[idx] = updatedTeacher;
        try {
          setDoc(doc(db, 'teachers', updatedTeacher.id), updatedTeacher, { merge: true }).catch(() => {});
        } catch (e) {}
        return updated;
      }
      // Modul Guru & Pembina: Jika user ber-peran pendidik/pembina dan belum ada di teachers, otomatis buatkan master data guru
      const isTeacherRole = [
        'guru', 'guru_bk', 'pembina_osim', 'coach_ekstrakurikuler',
        'pembina_ekskul', 'pembina', 'pembina_ekstrakurikuler', 'wali_kelas', 'homeroom_teacher', 'guru_mapel'
      ].includes(user.role);

      if (isTeacherRole) {
        const cleanDocId = user.uid.startsWith('user_guru_')
          ? user.uid.replace(/^user_/, '')
          : getNextTeacherDocId(prev);
        const assignedCode = normalizeTeacherCode(undefined, prev.length + 1, user.displayName);
        const newTeacher: Teacher = {
          id: cleanDocId,
          fullName: user.displayName,
          name: user.displayName,
          nip: user.nip || '-',
          email: user.email,
          phone: user.phone || '-',
          role: roleLabel || 'Guru Mata Pelajaran',
          subject: user.counselorSpecialization || 'Umum',
          code: assignedCode,
          assignedExtracurriculars: assignedIds,
          photoUrl: user.photoURL || (user as any).photoUrl || undefined,
          isActive: user.status !== 'Nonaktif',
          isCashManager: user.isCashManager || false,
          cashManagerTitle: user.cashManagerTitle || undefined
        };
        removeDeletedUid(cleanDocId);
        removeDeletedUid(`user_${cleanDocId}`);
        if (user.email) removeDeletedUid(user.email.toLowerCase().trim());
        const cleanN = cleanDigits(user.nip);
        if (cleanN && cleanN.length >= 6) {
          removeDeletedUid(cleanN);
          removeDeletedUid(`user_${cleanN}`);
        }
        try {
          setDoc(doc(db, 'teachers', newTeacher.id), newTeacher, { merge: true }).catch(() => {});
          localStorage.setItem('sim_teachers', JSON.stringify([...prev, newTeacher]));
        } catch (e) {}
        return [...prev, newTeacher];
      }
      return prev;
    });

    // 2. Sync Unit Ekstrakurikuler (advisor / coach)
    if (
      assignedIds.length > 0 ||
      user.role === 'coach_ekstrakurikuler' ||
      user.role === 'pembina_ekskul' ||
      user.role === 'pembina' ||
      (user.role as string) === 'pembina_ekstrakurikuler'
    ) {
      setExtracurriculars(prev => prev.map(ekskul => {
        if (assignedIds.includes(ekskul.id)) {
          return {
            ...ekskul,
            coachId: user.uid,
            coachName: user.displayName
          };
        }
        if (
          ekskul.coachId === user.uid ||
          (oldUser && ekskul.coachId === oldUser.uid) ||
          (oldUser && ekskul.coachName === oldUser.displayName) ||
          ekskul.coachName === user.displayName
        ) {
          return {
            ...ekskul,
            coachId: '',
            coachName: 'Belum Ditentukan'
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
          setDoc(doc(db, 'schools', nextSetting.id || 'main_school'), nextSetting, { merge: true }).catch(() => {});
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

    const generatedId = generateExtracurricularId(data.name, extracurriculars);

    const newEkskul: Extracurricular = {
      id: generatedId,
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
      setDoc(doc(db, 'extracurriculars', newEkskul.id), newEkskul).catch(() => {});
    } catch (e) {}

    // Reverse sync: assign this ekskul to the matching teacher in teachers state
    if (newEkskul.coachId || newEkskul.coachName) {
      setTeachers(prev => {
        let changed = false;
        const updated = prev.map(t => {
          if (t.id === newEkskul.coachId || t.fullName.toLowerCase() === newEkskul.coachName?.toLowerCase()) {
            const currentAssigned = canonicalizeAssignedEkskulIds(t.assignedExtracurriculars, extracurriculars);
            if (!currentAssigned.includes(newEkskul.id) || currentAssigned.length > 1) {
              changed = true;
              const nextAssigned = [newEkskul.id];
              setDoc(doc(db, 'teachers', t.id), { assignedExtracurriculars: nextAssigned }, { merge: true }).catch(() => {});
              return {
                ...t,
                assignedExtracurriculars: nextAssigned
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
      updateDoc(doc(db, 'extracurriculars', id), data).catch(() => {});
    } catch (e) {}

    // Reverse sync coach assignments to teachers list using canonical ID
    const newCoachId = data.coachId;
    const newCoachName = data.coachName;

    if (id && (newCoachId !== undefined || newCoachName !== undefined)) {
      setTeachers(prev => {
        let changed = false;
        const updated = prev.map(t => {
          const isNewCoach = (newCoachId && t.id === newCoachId) || (newCoachName && t.fullName.toLowerCase() === newCoachName.toLowerCase());
          const isOldCoach = oldEkskul && ((oldEkskul.coachId && t.id === oldEkskul.coachId) || (oldEkskul.coachName && t.fullName.toLowerCase() === oldEkskul.coachName.toLowerCase()));

          if (isNewCoach) {
            const current = canonicalizeAssignedEkskulIds(t.assignedExtracurriculars, extracurriculars);
            if (!current.includes(id) || current.length > 1) {
              changed = true;
              const nextAssigned = [id];
              setDoc(doc(db, 'teachers', t.id), { assignedExtracurriculars: nextAssigned }, { merge: true }).catch(() => {});
              return { ...t, assignedExtracurriculars: nextAssigned };
            }
          } else if (isOldCoach && !isNewCoach) {
            const current = canonicalizeAssignedEkskulIds(t.assignedExtracurriculars, extracurriculars);
            if (current.includes(id) || (oldEkskul && current.includes(oldEkskul.name))) {
              changed = true;
              const nextAssigned = current.filter(item => item !== id && (!oldEkskul || item !== oldEkskul.name));
              setDoc(doc(db, 'teachers', t.id), { assignedExtracurriculars: nextAssigned }, { merge: true }).catch(() => {});
              return { ...t, assignedExtracurriculars: nextAssigned };
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
      deleteDoc(doc(db, 'extracurriculars', id)).catch(() => {});
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
          const current = canonicalizeAssignedEkskulIds(t.assignedExtracurriculars, extracurriculars);
          if (current.includes(target.id) || current.includes(target.name)) {
            changed = true;
            const nextAssigned = current.filter(item => item !== target.id && item !== target.name);
            setDoc(doc(db, 'teachers', t.id), { assignedExtracurriculars: nextAssigned }, { merge: true }).catch(() => {});
            return {
              ...t,
              assignedExtracurriculars: nextAssigned
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
      id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...data,
      studentId: targetStudentId,
      studentCode: finalStudentCode,
      studentName: finalStudentName,
      studentClass: finalStudentClass,
      studentNis: finalStudentNis
    };

    removeDeletedMemberId(newMember.id);

    setMembers(prev => {
      const existsIndex = prev.findIndex(
        m => m.id === newMember.id || (m.extracurricularId === newMember.extracurricularId && m.studentId === newMember.studentId)
      );
      let next: ExtracurricularMember[];
      if (existsIndex >= 0) {
        next = [...prev];
        next[existsIndex] = newMember;
      } else {
        next = [newMember, ...prev];
      }
      try {
        localStorage.setItem('sim_members', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // Update count in ekskul and persist immediately to localStorage
    setExtracurriculars(prev => {
      const updated = prev.map(e => {
        if (e.id === data.extracurricularId) {
          return { ...e, memberCount: (e.memberCount || 0) + 1 };
        }
        return e;
      });
      try {
        localStorage.setItem('sim_extracurriculars', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      await setDoc(doc(db, 'extracurricular_members', newMember.id), newMember);
      const ekskulRef = doc(db, 'extracurriculars', data.extracurricularId);
      const curCount = (extracurriculars.find(e => e.id === data.extracurricularId)?.memberCount || 0) + 1;
      updateDoc(ekskulRef, { memberCount: curCount }).catch(() => {});
    } catch (e) {
      console.warn('[Firestore] Anggota disimpan secara lokal, penulisan cloud tertunda:', e);
    }
    logAction('ADD_MEMBER', 'Anggota Ekstrakurikuler', `Menambahkan anggota: ${finalStudentName} ke ${data.extracurricularName || data.extracurricularId}`);
  };

  const removeMember = async (id: string) => {
    addDeletedMemberId(id);
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
      try {
        const eksRef = doc(db, 'extracurriculars', target.extracurricularId);
        const curCount = Math.max(0, (extracurriculars.find(e => e.id === target.extracurricularId)?.memberCount || 1) - 1);
        updateDoc(eksRef, { memberCount: curCount }).catch(() => {});
      } catch (e) {}
    }
    try {
      await deleteDoc(doc(db, 'extracurricular_members', id));
    } catch (e) {}
    logAction('REMOVE_MEMBER', 'Anggota Ekstrakurikuler', `Menghapus keanggotaan ekstrakurikuler: ${target?.studentName || id} (Data siswa tetap aman di kelas)`);
  };

  const updateMember = async (id: string, data: Partial<ExtracurricularMember>) => {
    setMembers(prev => {
      const next = prev.map(m => m.id === id ? { ...m, ...data } : m);
      try {
        localStorage.setItem('sim_members', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    try {
      await updateDoc(doc(db, 'extracurricular_members', id), data);
    } catch (e) {}
  };

  const updateMemberStatus = async (id: string, status: 'Aktif' | 'Nonaktif' | 'Cuti' | 'Keluar') => {
    setMembers(prev => {
      const next = prev.map(m => m.id === id ? { ...m, status } : m);
      try {
        localStorage.setItem('sim_members', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    try {
      await updateDoc(doc(db, 'extracurricular_members', id), { status });
    } catch (e) {}
  };

  const deleteMembersBulk = async (ids: string[]) => {
    if (!ids || ids.length === 0) return 0;
    ids.forEach(id => addDeletedMemberId(id));
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
      if (auth.currentUser) {
        setDoc(doc(db, 'schedules', newEvent.id), newEvent).catch(() => {});
      }
    } catch (e) {}
    logAction('CREATE_SCHEDULE', 'Jadwal', `Membuat jadwal kegiatan: ${newEvent.title} pada ${newEvent.date}`);
    return { success: true };
  };

  const updateSchedule = async (id: string, data: Partial<ScheduleEvent>) => {
    setSchedules(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...data } : s);
      try { localStorage.setItem('sim_schedules', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        updateDoc(doc(db, 'schedules', id), data).catch(() => {});
      }
    } catch (e) {}
    return { success: true };
  };

  const deleteSchedule = async (id: string) => {
    setSchedules(prev => {
      const next = prev.filter(s => s.id !== id);
      try { localStorage.setItem('sim_schedules', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        deleteDoc(doc(db, 'schedules', id)).catch(() => {});
      }
    } catch (e) {}
  };

  // Attendance Session
  const saveAttendanceSession = async (data: Omit<AttendanceSession, 'id' | 'createdAt'>) => {
    const newSession: AttendanceSession = {
      id: `att_${Date.now()}`,
      ...data,
      createdAt: new Date().toLocaleString('id-ID')
    };
    setAttendance(prev => {
      const next = [newSession, ...prev];
      try { localStorage.setItem('sim_attendance', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        setDoc(doc(db, 'attendance', newSession.id), newSession).catch(() => {});
      }
    } catch (e) {}
    logAction('SUBMIT_ATTENDANCE', 'Presensi', `Menyimpan presensi ${data.extracurricularName} tanggal ${data.date} (Hadir: ${data.presentCount}/${data.totalMembers})`);
  };

  const deleteAttendanceRecord = async (id: string) => {
    setAttendance(prev => {
      const next = prev.filter(a => a.id !== id);
      try { localStorage.setItem('sim_attendance', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };

  // Activity Operations
  const addActivity = async (data: Omit<SchoolActivity, 'id' | 'createdAt'>) => {
    const newAct: SchoolActivity = {
      id: `act_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setActivities(prev => {
      const next = [newAct, ...prev];
      try { localStorage.setItem('sim_activities', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        setDoc(doc(db, 'activities', newAct.id), newAct).catch(() => {});
      }
    } catch (e) {}
    logAction('CREATE_ACTIVITY', 'Kegiatan Siswa', `Mendaftarkan agenda kegiatan: ${newAct.title}`);
  };

  const updateActivity = async (id: string, data: Partial<SchoolActivity>) => {
    setActivities(prev => {
      const next = prev.map(a => a.id === id ? { ...a, ...data } : a);
      try { localStorage.setItem('sim_activities', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        updateDoc(doc(db, 'activities', id), data).catch(() => {});
      }
    } catch (e) {}
    logAction('UPDATE_ACTIVITY', 'Kegiatan Siswa', `Memperbarui status/data kegiatan ID: ${id}`);
  };

  const deleteActivity = async (id: string) => {
    setActivities(prev => {
      const next = prev.filter(a => a.id !== id);
      try { localStorage.setItem('sim_activities', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        deleteDoc(doc(db, 'activities', id)).catch(() => {});
      }
    } catch (e) {}
  };

  // Reports
  const addReport = async (data: Omit<ActivityReport, 'id' | 'createdAt'>) => {
    const newRep: ActivityReport = {
      id: `rep_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setActivityReports(prev => {
      const next = [newRep, ...prev];
      try { localStorage.setItem('sim_activity_reports', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        setDoc(doc(db, 'activity_reports', newRep.id), newRep).catch(() => {});
      }
    } catch (e) {}
    logAction('CREATE_REPORT', 'Laporan Kegiatan', `Mengajukan laporan kegiatan: ${newRep.activityTitle}`);
  };

  const updateReport = async (id: string, data: Partial<ActivityReport>) => {
    setActivityReports(prev => {
      const next = prev.map(r => r.id === id ? { ...r, ...data } : r);
      try { localStorage.setItem('sim_activity_reports', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        updateDoc(doc(db, 'activity_reports', id), data).catch(() => {});
      }
    } catch (e) {}
  };

  const deleteActivityReport = async (id: string) => {
    setActivityReports(prev => {
      const next = prev.filter(r => r.id !== id);
      try { localStorage.setItem('sim_activity_reports', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        deleteDoc(doc(db, 'activity_reports', id)).catch(() => {});
      }
    } catch (e) {}
  };

  const reviewReport = async (id: string, status: 'Disetujui' | 'Revisi' | 'Ditolak', feedback?: string) => {
    setActivityReports(prev => {
      const next = prev.map(r => {
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
      });
      try { localStorage.setItem('sim_activity_reports', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      updateDoc(doc(db, 'activity_reports', id), {
        status,
        feedback,
        approvedBy: currentUser?.displayName || 'Waka Kesiswaan',
        approvedAt: new Date().toISOString().split('T')[0]
      }).catch(() => {});
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
    // Role-based Access Control Guard:
    // Wali Kelas & Guru Mapel hanya dapat melihat pelanggaran siswa (read-only).
    // Hak akses penuh mencatat/mengubah/menghapus pelanggaran adalah Super Admin, Waka Kesiswaan, dan Guru BK.
    const isPrivileged = currentUser && (
      canManageViolations(currentUser) ||
      ['super_admin', 'admin', 'waka_kesiswaan', 'waka', 'admin_kesiswaan', 'guru_bk', 'bk'].includes(currentUser.role) ||
      currentUser.role?.toLowerCase().includes('bk') ||
      currentUser.role?.toLowerCase().includes('konselor')
    );
    if (!isPrivileged) {
      const errMsg = 'Akses Ditolak: Hak akses mencatat pelanggaran hanya untuk Super Admin, Waka Kesiswaan, dan Guru BK.';
      console.warn('[SchoolContext] addViolation ditolak:', errMsg);
      throw new Error(errMsg);
    }

    // Validate payload against schema guard
    const validation = validatePayload(studentViolationSchema, data);
    if (!validation.success) {
      const errMsg = 'Validasi data pelanggaran gagal: ' + (validation.errors || []).join(', ');
      console.warn('Invalid violation payload:', validation.errors);
      throw new Error(errMsg);
    }

    const validData = validation.data;
    // Relational Integrity: Safely link with master Student
    const student = resolveStudent(students, { id: validData.studentId, code: validData.studentCode, nis: validData.studentNis, name: validData.studentName });
    const targetStudentId = student?.id || validData.studentId;
    const finalStudentCode = student?.code || validData.studentCode;
    const finalStudentName = student?.fullName || validData.studentName;
    const finalStudentClass = student?.className || validData.studentClass;
    const finalStudentNis = student?.nis || validData.studentNis;

    const newViol: StudentViolation = {
      id: `v_${Date.now()}`,
      officerName: currentUser?.displayName || 'Petugas Kesiswaan',
      actionTaken: 'Dicatat dan dibina',
      ...data,
      ...validData,
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
    try {
      localStorage.setItem('sim_violations', JSON.stringify(updatedViolations));
    } catch (e) {}
    
    // Atomically recalculate and sync student points
    await syncStudentViolationPoints(targetStudentId, updatedViolations);

    try {
      await setDoc(doc(db, 'violations', newViol.id), newViol);
    } catch (e) {}
    logAction('RECORD_VIOLATION', 'Pelanggaran Siswa', `Mencatat pelanggaran siswa: ${finalStudentName} (+${data.points} poin)`);
  };

  const updateViolation = async (id: string, data: Partial<StudentViolation>) => {
    const isPrivileged = currentUser && (
      canManageViolations(currentUser) ||
      ['super_admin', 'admin', 'waka_kesiswaan', 'waka', 'admin_kesiswaan', 'guru_bk', 'bk'].includes(currentUser.role) ||
      currentUser.role?.toLowerCase().includes('bk') ||
      currentUser.role?.toLowerCase().includes('konselor')
    );
    if (!isPrivileged) {
      const errMsg = 'Akses Ditolak: Hak akses mengubah pelanggaran hanya untuk Super Admin, Waka Kesiswaan, dan Guru BK.';
      console.warn('[SchoolContext] updateViolation ditolak:', errMsg);
      throw new Error(errMsg);
    }
    let targetStudentId = '';
    const updatedViolations = violations.map(v => {
      if (v.id === id) {
        targetStudentId = v.studentId;
        return { ...v, ...data };
      }
      return v;
    });
    setViolations(updatedViolations);
    try {
      localStorage.setItem('sim_violations', JSON.stringify(updatedViolations));
    } catch (e) {}

    if (targetStudentId) {
      await syncStudentViolationPoints(targetStudentId, updatedViolations);
    }

    try {
      await updateDoc(doc(db, 'violations', id), data);
    } catch (e) {}
  };

  const deleteViolation = async (id: string) => {
    const isPrivileged = currentUser && (
      canManageViolations(currentUser) ||
      ['super_admin', 'admin', 'waka_kesiswaan', 'waka', 'admin_kesiswaan', 'guru_bk', 'bk'].includes(currentUser.role) ||
      currentUser.role?.toLowerCase().includes('bk') ||
      currentUser.role?.toLowerCase().includes('konselor')
    );
    if (!isPrivileged) {
      const errMsg = 'Akses Ditolak: Hak akses menghapus pelanggaran hanya untuk Super Admin, Waka Kesiswaan, dan Guru BK.';
      console.warn('[SchoolContext] deleteViolation ditolak:', errMsg);
      throw new Error(errMsg);
    }
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
    const activeViolations = updatedViolations.filter(v => !v.isDeleted);
    setViolations(activeViolations);
    try {
      localStorage.setItem('sim_violations', JSON.stringify(activeViolations));
    } catch (e) {}

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

  const reconcileAllStudentPoints = async (): Promise<{ updatedCount: number; healedViolationsCount: number; cleanedOrphansCount: number }> => {
    if (!canManageViolations(currentUser)) {
      console.warn('[SchoolContext] reconcileAllStudentPoints ditolak: Dibatasi untuk Super Admin, Waka Kesiswaan, dan Guru BK.');
      return { updatedCount: 0, healedViolationsCount: 0, cleanedOrphansCount: 0 };
    }
    let updatedCount = 0;
    let healedViolationsCount = 0;
    let cleanedOrphansCount = 0;

    // 1. Audit & Heal active violations against master students collection
    const auditedViolations = violations.map(v => {
      if (v.isDeleted || v.status === 'Dibatalkan') return v;

      // Match against master student catalog
      const student = resolveStudent(students, {
        id: v.studentId,
        code: v.studentCode,
        nis: v.studentNis,
        name: v.studentName
      });

      if (student) {
        // Heal mismatched references (e.g. outdated class name, NIS, or ID)
        if (
          v.studentId !== student.id ||
          v.studentName !== student.fullName ||
          (student.className && v.studentClass !== student.className) ||
          (student.nis && v.studentNis !== student.nis)
        ) {
          healedViolationsCount++;
          const healed: StudentViolation = {
            ...v,
            studentId: student.id,
            studentCode: student.code || v.studentCode,
            studentName: student.fullName,
            studentClass: student.className || v.studentClass,
            studentNis: student.nis || v.studentNis
          };
          try {
            updateDoc(doc(db, 'violations', v.id), healed as any).catch(() => {});
          } catch (e) {}
          return healed;
        }
      } else {
        // Violation record has no matching active student (kasus zombie dari siswa yang sudah dihapus)
        cleanedOrphansCount++;
        try {
          updateDoc(doc(db, 'violations', v.id), {
            isDeleted: true,
            deletedAt: new Date().toISOString()
          }).catch(() => {});
        } catch (e) {}
        return {
          ...v,
          isDeleted: true
        };
      }
      return v;
    });

    const nonZombieViolations = auditedViolations.filter(v => !v.isDeleted);
    if (healedViolationsCount > 0 || cleanedOrphansCount > 0) {
      setViolations(nonZombieViolations);
      try {
        localStorage.setItem('sim_violations', JSON.stringify(nonZombieViolations));
      } catch (e) {}
    }

    // 2. Compute accurate active point summation
    const activeViolations = nonZombieViolations.filter(v => !v.isDeleted && v.status !== 'Dibatalkan');
    const pointsMap = new Map<string, number>();
    for (const viol of activeViolations) {
      const current = pointsMap.get(viol.studentId) || 0;
      pointsMap.set(viol.studentId, current + (Number(viol.points) || 0));
    }

    // 3. Atomically sync points on all master students
    const updatedStudents = students.map(s => {
      const realPoints = pointsMap.get(s.id) || 0;
      if ((s.violationPoints || 0) !== realPoints) {
        updatedCount++;
        try {
          updateDoc(doc(db, 'students', s.id), { violationPoints: realPoints }).catch(() => {});
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

    logAction('RECONCILE_POINTS', 'Integritas Data', `Rekonsiliasi poin selesai: ${updatedCount} siswa disinkronkan, ${healedViolationsCount} relasi dipulihkan`);
    return { updatedCount, healedViolationsCount, cleanedOrphansCount };
  };

  // Fase 3: Reconcile Cash Balances against all transactions
  const reconcileAllCashBalances = async (): Promise<{ updatedCount: number }> => {
    let updatedCount = 0;
    const accountNetSum = new Map<string, number>();
    cashTransactions.forEach(trx => {
      const delta = trx.type === 'MASUK' ? Number(trx.amount) : -Number(trx.amount);
      const curr = accountNetSum.get(trx.accountId) || 0;
      accountNetSum.set(trx.accountId, curr + delta);
    });

    const updatedAccounts = cashAccounts.map(acc => {
      const expectedBal = (Number(acc.initialBalance) || 0) + (accountNetSum.get(acc.id) || 0);
      const currentBal = Number(acc.currentBalance ?? acc.balance) || 0;
      if (currentBal !== expectedBal) {
        updatedCount++;
        if (auth.currentUser) {
          updateDoc(doc(db, 'cash_accounts', acc.id), {
            balance: expectedBal,
            currentBalance: expectedBal,
            updatedAt: new Date().toISOString()
          }).catch(() => {});
        }
        return { ...acc, balance: expectedBal, currentBalance: expectedBal };
      }
      return acc;
    });

    if (updatedCount > 0) {
      setCashAccounts(updatedAccounts);
      try {
        localStorage.setItem('sim_cash_accounts', JSON.stringify(updatedAccounts));
      } catch (e) {}
      logAction('RECONCILE_CASH', 'Neraca Kas', `Rekonsiliasi saldo kas selesai: ${updatedCount} akun kas disinkronkan`);
    }

    return { updatedCount };
  };

  // Fase 3: Check database relational health report
  const checkDatabaseRelationalHealth = (): RelationalHealthReport => {
    return auditRelationalIntegrity(
      students,
      teachers,
      extracurriculars,
      violations,
      counseling,
      members,
      osimMembers,
      cashAccounts,
      cashTransactions
    );
  };

  // Fase 3: Full automated cross-collection database harmonization
  const runFullDatabaseHarmonization = async (): Promise<{
    success: boolean;
    message: string;
    details: { studentPointsFixed: number; cashBalancesFixed: number; teachersHarmonized: number };
  }> => {
    try {
      setIsSyncing(true);
      // 1. Reconcile student violation points
      const { updatedCount: studentPointsFixed } = await reconcileAllStudentPoints();

      // 2. Reconcile cash ledger account balances
      const { updatedCount: cashBalancesFixed } = await reconcileAllCashBalances();

      // 3. Harmonize teachers document IDs and structure
      const teachRes = await harmonizeTeachersFirestore();
      const teachersHarmonized = teachRes.migratedCount || 0;
      const latestTeachers = teachRes.teachers && teachRes.teachers.length > 0 ? teachRes.teachers : teachers;

      // 4. Auto-heal orphan extracurricular members, coaches, and cross-collection references
      const healRes = await autoHealOrphanRecords(latestTeachers);
      const ekskulHealed = healRes.healedMembers + healRes.healedCoaches;

      // 5. Harmonize user accounts and authentication credentials
      let userAccountsSynced = 0;
      if (syncUsersFromTeachers) {
        try {
          userAccountsSynced = await syncUsersFromTeachers(latestTeachers, extracurriculars);
        } catch (e) {
          console.warn('Sync user accounts during harmonization note:', e);
        }
      }

      setIsSyncing(false);
      const msg = `Harmonisasi Basis Data Berhasil: ${studentPointsFixed} akumulasi poin siswa diperbaiki, ${cashBalancesFixed} saldo akun kas diselaraskan, ${teachersHarmonized} data guru distandarisasi, ${ekskulHealed} relasi ekstrakurikuler dipulihkan, dan ${userAccountsSynced} akun pengguna/guru disinkronkan ke Firebase Auth.`;
      logAction('FULL_HARMONIZATION', 'Basis Data', msg);
      return {
        success: true,
        message: msg,
        details: { studentPointsFixed, cashBalancesFixed, teachersHarmonized, userAccountsSynced } as any
      };
    } catch (err: any) {
      setIsSyncing(false);
      return {
        success: false,
        message: `Gagal menjalankan harmonisasi: ${err?.message || 'Terjadi kesalahan internal'}`,
        details: { studentPointsFixed: 0, cashBalancesFixed: 0, teachersHarmonized: 0 }
      };
    }
  };

  // =========================================================================
  // FASE 4: DISASTER RECOVERY, RESTORE POINTS & AUTO-HEALING ENGINE
  // =========================================================================

  const autoHealOrphanRecords = async (
    freshTeachers?: Teacher[],
    freshExtracurriculars?: Extracurricular[]
  ): Promise<{
    healedViolations: number;
    healedCounselings: number;
    healedMembers: number;
    healedCoaches: number;
    healedTransactions: number;
    healedStudents?: number;
    healedOsimMembers?: number;
    healedTeacherAccounts?: number;
    totalHealed: number;
  }> => {
    const targetTeachers = freshTeachers && freshTeachers.length > 0 ? freshTeachers : teachers;
    const targetExtracurriculars = freshExtracurriculars && freshExtracurriculars.length > 0 ? freshExtracurriculars : extracurriculars;

    let healedViolations = 0;
    let healedCounselings = 0;
    let healedMembers = 0;
    let healedCoaches = 0;
    let healedTransactions = 0;

    // 1. Heal Violations with missing or broken student pointers and purge zombie records
    const cleanedViolations: StudentViolation[] = [];
    violations.forEach(v => {
      const student = resolveStudent(students, { id: v.studentId, code: v.studentCode, nis: v.studentNis, name: v.studentName });
      if (!student) {
        // Orphan / zombie record of deleted student: mark isDeleted in Firestore
        try {
          updateDoc(doc(db, 'violations', v.id), { isDeleted: true, deletedAt: new Date().toISOString() }).catch(() => {});
        } catch (e) {}
        healedViolations++;
        return;
      }
      if (v.studentId !== student.id || v.studentName !== student.fullName || v.studentClass !== student.className) {
        healedViolations++;
        const healed = {
          ...v,
          studentId: student.id,
          studentCode: student.code || v.studentCode,
          studentName: student.fullName,
          studentClass: student.className,
          studentNis: student.nis || v.studentNis
        };
        try {
          updateDoc(doc(db, 'violations', v.id), healed).catch(() => {});
        } catch (e) {}
        cleanedViolations.push(healed);
      } else {
        cleanedViolations.push(v);
      }
    });

    if (healedViolations > 0) {
      setViolations(cleanedViolations);
      try {
        localStorage.setItem('sim_violations', JSON.stringify(cleanedViolations));
      } catch (e) {}
    }

    // 2. Heal Counselings with missing or broken student / counselor pointers
    const updatedCounseling = counseling.map(c => {
      const student = resolveStudent(students, { id: c.studentId, code: c.studentCode, nis: c.studentNis, name: c.studentName });
      const counselor = c.counselorId ? resolveTeacher(targetTeachers, { id: c.counselorId, name: c.counselorName }) : undefined;
      let changed = false;
      const healed = { ...c };

      if (student && (c.studentId !== student.id || c.studentName !== student.fullName)) {
        healed.studentId = student.id;
        healed.studentCode = student.code || c.studentCode;
        healed.studentName = student.fullName;
        healed.studentClass = student.className;
        changed = true;
      }
      if (counselor && (c.counselorId !== counselor.id || c.counselorName !== counselor.fullName)) {
        healed.counselorId = counselor.id;
        healed.counselorName = counselor.fullName;
        healed.counselorCode = counselor.code || c.counselorCode;
        changed = true;
      }

      if (changed) {
        healedCounselings++;
        try {
          if (auth.currentUser) {
            updateDoc(doc(db, 'counseling', c.id), healed).catch(() => {});
          }
        } catch (e) {}
        return healed;
      }
      return c;
    });

    if (healedCounselings > 0) {
      setCounseling(updatedCounseling);
      try {
        localStorage.setItem('sim_counseling', JSON.stringify(updatedCounseling));
      } catch (e) {}
    }

    // 3. Heal Extracurricular Members (Student & Club Relational Links)
    const updatedMembers = members.map(m => {
      const student = resolveStudent(students, { id: m.studentId, code: m.studentCode, nis: m.studentNis, name: m.studentName });
      const ekskul = targetExtracurriculars.find(e => e.id === m.extracurricularId || (m.extracurricularName && e.name.toLowerCase() === m.extracurricularName.toLowerCase()));
      let changed = false;
      const healed = { ...m };

      if (student && (m.studentId !== student.id || m.studentName !== student.fullName || m.studentClass !== student.className || (student.nis && m.studentNis !== student.nis))) {
        healed.studentId = student.id;
        healed.studentCode = student.code || m.studentCode;
        healed.studentName = student.fullName;
        healed.studentClass = student.className;
        healed.studentNis = student.nis || m.studentNis;
        changed = true;
      }

      if (ekskul && (m.extracurricularId !== ekskul.id || m.extracurricularName !== ekskul.name)) {
        healed.extracurricularId = ekskul.id;
        healed.extracurricularName = ekskul.name;
        changed = true;
      }

      if (changed) {
        healedMembers++;
        try {
          updateDoc(doc(db, 'extracurricular_members', m.id), healed).catch(() => {});
        } catch (e) {}
        return healed;
      }
      return m;
    });

    if (healedMembers > 0) {
      setMembers(updatedMembers);
      try {
        localStorage.setItem('sim_members', JSON.stringify(updatedMembers));
      } catch (e) {}
    }

    // 4. Heal Extracurricular Coaches & Reconcile Member Counts
    const activeMemberCounts: Record<string, number> = {};
    updatedMembers.forEach(m => {
      if (m.status === 'Aktif' && m.extracurricularId) {
        activeMemberCounts[m.extracurricularId] = (activeMemberCounts[m.extracurricularId] || 0) + 1;
      }
    });

    let countsReconciled = false;
    const updatedEkskuls = targetExtracurriculars.map(e => {
      let changed = false;
      let healed = { ...e };

      if (e.coachId || e.coachName) {
        const teacher = resolveTeacher(targetTeachers, { id: e.coachId, code: e.coachCode, name: e.coachName });
        if (teacher && (e.coachId !== teacher.id || e.coachName !== teacher.fullName || e.coachCode !== teacher.code)) {
          healedCoaches++;
          healed.coachId = teacher.id;
          healed.coachName = teacher.fullName;
          healed.coachCode = teacher.code;
          changed = true;
        }
      }

      const realActiveCount = activeMemberCounts[e.id] || 0;
      if (e.memberCount !== realActiveCount) {
        healed.memberCount = realActiveCount;
        changed = true;
        countsReconciled = true;
      }

      if (changed) {
        try {
          updateDoc(doc(db, 'extracurriculars', e.id), healed).catch(() => {});
        } catch (e) {}
        return healed;
      }
      return e;
    });

    if (healedCoaches > 0 || countsReconciled) {
      setExtracurriculars(updatedEkskuls);
      try {
        localStorage.setItem('sim_extracurriculars', JSON.stringify(updatedEkskuls));
      } catch (e) {}
    }

    // 5. Heal Cash Transactions (connect to valid account)
    const validAccountIds = new Set(cashAccounts.map(a => a.id));
    const fallbackAccountId = cashAccounts[0]?.id || 'acc_default';
    const fallbackAccountName = cashAccounts[0]?.name || 'Kas Utama Sekolah';

    const updatedTransactions = cashTransactions.map(t => {
      if (!validAccountIds.has(t.accountId)) {
        healedTransactions++;
        const healed = {
          ...t,
          accountId: fallbackAccountId,
          accountName: fallbackAccountName
        };
        try {
          updateDoc(doc(db, 'cash_transactions', t.id), healed).catch(() => {});
        } catch (e) {}
        return healed;
      }
      return t;
    });

    if (healedTransactions > 0) {
      setCashTransactions(updatedTransactions);
      try {
        localStorage.setItem('sim_cash_transactions', JSON.stringify(updatedTransactions));
      } catch (e) {}
    }

    // 6. Heal Students with missing or outdated class references
    let healedStudents = 0;
    const updatedStudents = students.map(s => {
      const cls = resolveStudentClass({ classId: s.classId, className: s.className }, classes);
      if (cls && (s.classId !== cls.id || s.className !== cls.name)) {
        healedStudents++;
        const healed = {
          ...s,
          classId: cls.id,
          className: cls.name
        };
        try {
          if (auth.currentUser) {
            updateDoc(doc(db, 'students', s.id), { classId: cls.id, className: cls.name }).catch(() => {});
          }
        } catch (e) {}
        return healed;
      }
      return s;
    });

    if (healedStudents > 0) {
      setStudents(updatedStudents);
      try {
        localStorage.setItem('sim_students', JSON.stringify(updatedStudents));
      } catch (e) {}
    }

    // 7. Heal OSIM Members with missing or broken student pointers
    let healedOsimMembers = 0;
    const updatedOsimMembers = osimMembers.map(m => {
      const student = resolveStudent(students, { id: m.studentId, code: m.studentCode, nis: m.studentNis, name: m.fullName });
      if (student && (m.studentId !== student.id || m.fullName !== student.fullName || m.className !== student.className)) {
        healedOsimMembers++;
        const healed: OsimMember = {
          ...m,
          studentId: student.id,
          studentCode: student.code || m.studentCode,
          fullName: student.fullName,
          className: student.className
        };
        try {
          if (auth.currentUser) {
            updateDoc(doc(db, 'osim_members', m.id), {
              studentId: student.id,
              studentCode: student.code || m.studentCode,
              fullName: student.fullName,
              className: student.className
            }).catch(() => {});
          }
        } catch (e) {}
        return healed;
      }
      return m;
    });

    if (healedOsimMembers > 0) {
      setOsimMembers(updatedOsimMembers);
      try {
        localStorage.setItem('sim_osim_members', JSON.stringify(updatedOsimMembers));
      } catch (e) {}
    }

    // 8. Heal Teacher User Accounts (ensure every teacher has a valid synchronized user profile)
    let healedTeacherAccounts = 0;
    if (syncUsersFromTeachers) {
      try {
        const count = await syncUsersFromTeachers(teachers, extracurriculars);
        if (count > 0) {
          healedTeacherAccounts = count;
        }
      } catch (e) {
        console.warn('Auto-heal teacher accounts note:', e);
      }
    }

    const totalHealed = healedViolations + healedCounselings + healedMembers + healedCoaches + healedTransactions + healedStudents + healedOsimMembers + healedTeacherAccounts;
    if (totalHealed > 0) {
      logAction('AUTO_HEAL', 'Ketahanan Data', `Auto-heal Fase 4 berhasil memulihkan ${totalHealed} anomali relasi.`);
    }

    return {
      healedViolations,
      healedCounselings,
      healedMembers,
      healedCoaches,
      healedTransactions,
      healedStudents,
      healedOsimMembers,
      healedTeacherAccounts,
      totalHealed
    };
  };

  const getDisasterRecoverySnapshots = (): Array<{
    id: string;
    label: string;
    timestamp: string;
    counts: Record<string, number>;
    data?: any;
  }> => {
    try {
      const raw = localStorage.getItem('sim_dr_snapshots');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  };

  const createDisasterRecoverySnapshot = async (customLabel?: string) => {
    const snapshotId = `snap_${Date.now()}`;
    const timestamp = new Date().toISOString();
    const label = customLabel?.trim() || `Titik Pemulihan Cadangan (${new Date().toLocaleString('id-ID')})`;
    
    const counts = {
      students: students.length,
      teachers: teachers.length,
      classes: classes.length,
      violations: violations.length,
      counseling: counseling.length,
      cashAccounts: cashAccounts.length,
      cashTransactions: cashTransactions.length,
      extracurriculars: extracurriculars.length,
      members: members.length,
      osimMembers: osimMembers.length,
      osimPrograms: osimPrograms.length,
      announcements: announcements.length,
      users: allUsers.length
    };

    const payload = {
      id: snapshotId,
      label,
      timestamp,
      counts,
      data: {
        students,
        teachers,
        classes,
        violations,
        counseling,
        cashAccounts,
        cashTransactions,
        extracurriculars,
        members,
        osimMembers,
        osimPrograms,
        announcements,
        schedules,
        attendance,
        activities,
        users: allUsers
      }
    };

    const existing = getDisasterRecoverySnapshots();
    const updated = [payload, ...existing].slice(0, 15);
    try {
      localStorage.setItem('sim_dr_snapshots', JSON.stringify(updated));
    } catch (e) {}

    try {
      if (auth.currentUser) {
        const firestoreSnapshotData: any = {
          id: snapshotId,
          label,
          timestamp,
          counts,
          createdBy: auth.currentUser.email || auth.currentUser.uid
        };
        try {
          firestoreSnapshotData.data = payload.data;
          await setDoc(doc(db, 'system_snapshots', snapshotId), firestoreSnapshotData);
        } catch {
          await setDoc(doc(db, 'system_snapshots', snapshotId), {
            id: snapshotId,
            label,
            timestamp,
            counts,
            createdBy: auth.currentUser.email || auth.currentUser.uid
          });
        }
      }
    } catch (e) {}

    logAction('CREATE_SNAPSHOT', 'Disaster Recovery', `Membuat titik pemulihan baru: "${label}" (${Object.values(counts).reduce((a, b) => a + b, 0)} entitas tersimpan)`);
    return { id: snapshotId, label, timestamp, counts };
  };

  const deleteDisasterRecoverySnapshot = (snapshotId: string) => {
    const existing = getDisasterRecoverySnapshots();
    const updated = existing.filter((s: any) => s.id !== snapshotId);
    try {
      localStorage.setItem('sim_dr_snapshots', JSON.stringify(updated));
    } catch (e) {}
    try {
      if (auth.currentUser) {
        deleteDoc(doc(db, 'system_snapshots', snapshotId)).catch(() => {});
      }
    } catch (e) {}
    logAction('DELETE_SNAPSHOT', 'Disaster Recovery', `Menghapus snapshot ID ${snapshotId}`);
  };

  // Fase 7: Defensive Schema Validation & Enterprise Health Shield
  const executeFase7Audit = async (): Promise<Fase7AuditReport> => {
    return runFase7DefensiveAudit({
      students,
      teachers,
      users: allUsers,
      violations,
      counseling,
      osimPrograms,
      cashAccounts,
      cashTransactions
    });
  };

  const restoreFromDisasterSnapshot = async (snapshotId: string): Promise<{ success: boolean; message: string }> => {
    const existing = getDisasterRecoverySnapshots();
    let target = existing.find((s: any) => s.id === snapshotId);
    if (!target || !target.data) {
      try {
        const snapDoc = await getDoc(doc(db, 'system_snapshots', snapshotId));
        if (snapDoc.exists() && snapDoc.data()?.data) {
          target = snapDoc.data() as any;
        }
      } catch (e) {}
    }

    if (!target || !target.data) {
      return { success: false, message: 'Snapshot tidak ditemukan atau data korup.' };
    }

    try {
      setIsSyncing(true);
      const d = target.data;
      if (d.students) setStudents(d.students);
      if (d.teachers) setTeachers(d.teachers);
      if (d.classes) setClasses(d.classes);
      if (d.violations) setViolations(d.violations);
      if (d.counseling) setCounseling(d.counseling);
      if (d.cashAccounts) setCashAccounts(d.cashAccounts);
      if (d.cashTransactions) setCashTransactions(d.cashTransactions);
      if (d.extracurriculars) setExtracurriculars(d.extracurriculars);
      if (d.members) setMembers(d.members);
      if (d.osimMembers) setOsimMembers(d.osimMembers);
      if (d.osimPrograms) setOsimPrograms(d.osimPrograms);
      if (d.schedules) setSchedules(d.schedules);
      if (d.attendance) setAttendance(d.attendance);
      if (d.activities) setActivities(d.activities);
      if (d.announcements) setAnnouncements(d.announcements);

      // Save to localStorage
      if (d.students) localStorage.setItem('sim_students', JSON.stringify(d.students));
      if (d.teachers) localStorage.setItem('sim_teachers', JSON.stringify(d.teachers));
      if (d.classes) localStorage.setItem('sim_classes', JSON.stringify(d.classes));
      if (d.violations) localStorage.setItem('sim_violations', JSON.stringify(d.violations));
      if (d.counseling) localStorage.setItem('sim_counseling', JSON.stringify(d.counseling));
      if (d.cashAccounts) localStorage.setItem('sim_cash_accounts', JSON.stringify(d.cashAccounts));
      if (d.cashTransactions) localStorage.setItem('sim_cash_transactions', JSON.stringify(d.cashTransactions));
      if (d.extracurriculars) localStorage.setItem('sim_extracurriculars', JSON.stringify(d.extracurriculars));
      if (d.members) localStorage.setItem('sim_members', JSON.stringify(d.members));
      if (d.osimMembers) localStorage.setItem('sim_osim_members', JSON.stringify(d.osimMembers));
      if (d.osimPrograms) localStorage.setItem('sim_osim_programs', JSON.stringify(d.osimPrograms));
      if (d.announcements) localStorage.setItem('sim_announcements', JSON.stringify(d.announcements));

      // Push restored extracurriculars, members, announcements & user accounts to Firestore to guarantee persistence
      if (auth.currentUser) {
        if (Array.isArray(d.extracurriculars)) {
          d.extracurriculars.forEach((e: any) => {
            if (e && e.id) setDoc(doc(db, 'extracurriculars', e.id), e).catch(() => {});
          });
        }
        if (Array.isArray(d.members)) {
          d.members.forEach((m: any) => {
            if (m && m.id) setDoc(doc(db, 'extracurricular_members', m.id), m).catch(() => {});
          });
        }
        if (Array.isArray(d.announcements)) {
          d.announcements.forEach((a: any) => {
            if (a && a.id) setDoc(doc(db, 'announcements', a.id), a).catch(() => {});
          });
        }
        if (Array.isArray(d.users)) {
          d.users.forEach((u: any) => {
            if (u && u.uid) setDoc(doc(db, 'users', u.uid), u, { merge: true }).catch(() => {});
          });
        }
      }

      setIsSyncing(false);
      const msg = `Berhasil memulihkan database dari titik "${target.label}" (${target.timestamp}). Seluruh entitas dan kredensial telah dikembalikan ke kondisi stabil.`;
      logAction('RESTORE_SNAPSHOT', 'Disaster Recovery', msg);
      return { success: true, message: msg };
    } catch (err: any) {
      setIsSyncing(false);
      return { success: false, message: `Gagal memulihkan dari snapshot: ${err?.message || 'Kesalahan internal'}` };
    }
  };

  // Counseling
  const addCounseling = async (data: Omit<StudentCounseling, 'id' | 'createdAt'>) => {
    // Validate payload against schema guard
    const validation = validatePayload(counselingSessionSchema, data);
    if (!validation.success) {
      console.warn('Invalid counseling payload:', validation.errors);
      return;
    }

    const validData = validation.data;
    // Relational Integrity: Safely link with master Student & Counselor
    const student = resolveStudent(students, { id: validData.studentId, code: (data as any).studentCode, nis: (data as any).studentNis, name: (data as any).studentName });
    const counselor = validData.counselorId ? resolveTeacher(teachers, { id: validData.counselorId, name: (data as any).counselorName }) : undefined;

    const targetStudentId = student?.id || validData.studentId;
    const finalStudentCode = student?.code || (data as any).studentCode;
    const finalStudentName = student?.fullName || (data as any).studentName;
    const finalStudentClass = student?.className || (data as any).studentClass;
    const finalCounselorCode = counselor?.code || (data as any).counselorCode;
    const finalCounselorName = counselor?.fullName || (data as any).counselorName;

    const newCs: StudentCounseling = {
      id: `cs_${Date.now()}`,
      followUpPlan: 'Pemantauan berkala',
      ...data,
      ...validData,
      studentId: targetStudentId,
      studentCode: finalStudentCode,
      studentName: finalStudentName,
      studentClass: finalStudentClass,
      counselorCode: finalCounselorCode,
      counselorName: finalCounselorName,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setCounseling(prev => {
      const next = [newCs, ...prev];
      try { localStorage.setItem('sim_counseling', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        setDoc(doc(db, 'counseling', newCs.id), newCs).catch(() => {});
      }
    } catch (e) {}
    logAction('RECORD_COUNSELING', 'Pembinaan & BK', `Mencatat sesi pembinaan siswa: ${finalStudentName}`);
  };

  const updateCounseling = async (id: string, data: Partial<StudentCounseling>) => {
    setCounseling(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...data } : c);
      try { localStorage.setItem('sim_counseling', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        updateDoc(doc(db, 'counseling', id), data).catch(() => {});
      }
    } catch (e) {}
  };

  const deleteCounselingSession = async (id: string) => {
    setCounseling(prev => {
      const next = prev.filter(c => c.id !== id);
      try { localStorage.setItem('sim_counseling', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        deleteDoc(doc(db, 'counseling', id)).catch(() => {});
      }
    } catch (e) {}
  };

  // Home Visit (Kunjungan Rumah BK)
  const addHomeVisit = async (data: Omit<HomeVisitRecord, 'id' | 'createdAt'>) => {
    const newHv: HomeVisitRecord = {
      id: `hv_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setHomeVisits(prev => {
      const next = [newHv, ...prev];
      try { localStorage.setItem('sim_home_visits', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        setDoc(doc(db, 'home_visits', newHv.id), newHv).catch(() => {});
      }
    } catch (e) {}
    logAction('RECORD_HOME_VISIT', 'Bimbingan Konseling', `Mencatat kunjungan rumah siswa: ${data.studentName}`);
  };

  const updateHomeVisit = async (id: string, data: Partial<HomeVisitRecord>) => {
    setHomeVisits(prev => {
      const next = prev.map(h => h.id === id ? { ...h, ...data } : h);
      try { localStorage.setItem('sim_home_visits', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        updateDoc(doc(db, 'home_visits', id), data).catch(() => {});
      }
    } catch (e) {}
  };

  const deleteHomeVisit = async (id: string) => {
    setHomeVisits(prev => {
      const next = prev.filter(h => h.id !== id);
      try { localStorage.setItem('sim_home_visits', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        deleteDoc(doc(db, 'home_visits', id)).catch(() => {});
      }
    } catch (e) {}
  };

  // Surat Panggilan Orang Tua BK
  const addParentCallLetter = async (data: Omit<ParentCallLetter, 'id' | 'createdAt'>) => {
    const newLetter: ParentCallLetter = {
      id: `sp_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setParentCallLetters(prev => {
      const next = [newLetter, ...prev];
      try { localStorage.setItem('sim_parent_call_letters', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        setDoc(doc(db, 'parent_call_letters', newLetter.id), newLetter).catch(() => {});
      }
    } catch (e) {}
    logAction('ISSUE_PARENT_CALL_LETTER', 'Bimbingan Konseling', `Menerbitkan surat panggilan orang tua No: ${data.letterNumber} untuk siswa ${data.studentName}`);
  };

  const updateParentCallLetter = async (id: string, data: Partial<ParentCallLetter>) => {
    setParentCallLetters(prev => {
      const next = prev.map(l => l.id === id ? { ...l, ...data } : l);
      try { localStorage.setItem('sim_parent_call_letters', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        updateDoc(doc(db, 'parent_call_letters', id), data).catch(() => {});
      }
    } catch (e) {}
  };

  const deleteParentCallLetter = async (id: string) => {
    setParentCallLetters(prev => {
      const next = prev.filter(l => l.id !== id);
      try { localStorage.setItem('sim_parent_call_letters', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        deleteDoc(doc(db, 'parent_call_letters', id)).catch(() => {});
      }
    } catch (e) {}
  };

  // Bimbingan Karir BK
  const addCareerGuidance = async (data: Omit<CareerGuidanceRecord, 'id' | 'createdAt'>) => {
    const newCg: CareerGuidanceRecord = {
      id: `cg_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setCareerGuidances(prev => {
      const next = [newCg, ...prev];
      try { localStorage.setItem('sim_career_guidances', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        setDoc(doc(db, 'career_guidances', newCg.id), newCg).catch(() => {});
      }
    } catch (e) {}
    logAction('RECORD_CAREER_GUIDANCE', 'Bimbingan Karir', `Mencatat asesmen peminatan karir siswa: ${data.studentName} (${data.careerInterest})`);
  };

  const updateCareerGuidance = async (id: string, data: Partial<CareerGuidanceRecord>) => {
    setCareerGuidances(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...data } : c);
      try { localStorage.setItem('sim_career_guidances', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        updateDoc(doc(db, 'career_guidances', id), data).catch(() => {});
      }
    } catch (e) {}
  };

  const deleteCareerGuidance = async (id: string) => {
    setCareerGuidances(prev => {
      const next = prev.filter(c => c.id !== id);
      try { localStorage.setItem('sim_career_guidances', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        deleteDoc(doc(db, 'career_guidances', id)).catch(() => {});
      }
    } catch (e) {}
  };

  // Achievements (Penghargaan / Prestasi Siswa)
  const syncStudentAchievementPoints = async (targetStudentId: string, currentAchievementsList?: StudentAchievement[]) => {
    if (!targetStudentId) return 0;
    const list = currentAchievementsList || achievements;
    const activeStudentAchs = list.filter(a => a.studentId === targetStudentId);
    const calculatedPoints = activeStudentAchs.reduce((sum, a) => sum + (Number(a.pointsAwarded) || 0), 0);

    // Update state in memory & localStorage
    setStudents(prev => {
      const updated = prev.map(s => s.id === targetStudentId ? { ...s, achievementPoints: calculatedPoints } : s);
      try {
        localStorage.setItem('sim_students', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Persist to Firestore
    try {
      await updateDoc(doc(db, 'students', targetStudentId), { achievementPoints: calculatedPoints });
    } catch (e) {
      try {
        await setDoc(doc(db, 'students', targetStudentId), { achievementPoints: calculatedPoints }, { merge: true });
      } catch (innerErr) {}
    }

    return calculatedPoints;
  };

  const addAchievement = async (data: Omit<StudentAchievement, 'id' | 'createdAt'>) => {
    const newAch: StudentAchievement = {
      id: `ach_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...data,
      pointsAwarded: Number(data.pointsAwarded) || 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    const updatedAchievements = [newAch, ...achievements];
    setAchievements(updatedAchievements);
    try {
      localStorage.setItem('sim_achievements', JSON.stringify(updatedAchievements));
    } catch (e) {}

    // Atomically recalculate and sync student achievement points
    if (data.studentId) {
      await syncStudentAchievementPoints(data.studentId, updatedAchievements);
    }

    try {
      await setDoc(doc(db, 'achievements', newAch.id), newAch);
    } catch (e) {
      console.warn('[SchoolContext] Gagal simpan achievement ke Firebase Firestore:', e);
    }

    // Mirror to dedicated rewards collection in Firestore and local state
    if (newAch.pointsAwarded > 0) {
      const mirrorReward: StudentReward = {
        id: `rew_${newAch.id.replace('ach_', '')}`,
        studentId: newAch.studentId,
        studentID: newAch.studentId,
        studentNis: newAch.studentNis,
        studentName: newAch.studentName,
        studentClass: newAch.studentClass,
        class: newAch.studentClass,
        rewardTitle: newAch.title,
        rewardType: newAch.title,
        category: (newAch.category as any) || 'Akademik',
        points: newAch.pointsAwarded,
        date: newAch.date,
        officerName: 'Penyelenggara / Tim Kesiswaan',
        description: newAch.description || 'Pemberian apresiasi atas prestasi yang diraih siswa.',
        actionTaken: 'Pencatatan Poin Prestasi & Piagam',
        certificateUrl: newAch.certificateUrl,
        academicYear: newAch.academicYear,
        status: 'Diverifikasi',
        achievementId: newAch.id,
        isDeleted: false,
        createdAt: newAch.createdAt,
        updatedAt: new Date().toISOString()
      };
      setRewards(prev => {
        const next = [mirrorReward, ...prev.filter(r => r.achievementId !== newAch.id && r.id !== mirrorReward.id)];
        try { localStorage.setItem('sim_rewards', JSON.stringify(next)); } catch (e) {}
        return next;
      });
      setDoc(doc(db, 'rewards', mirrorReward.id), mirrorReward).catch(() => {});
    }

    logAction('RECORD_ACHIEVEMENT', 'Prestasi Siswa', `Mencatat prestasi: ${data.title} oleh ${data.studentName} (+${newAch.pointsAwarded} poin)`);
  };

  const updateAchievement = async (id: string, data: Partial<StudentAchievement>) => {
    let targetStudentId = '';
    const updatedAchievements = achievements.map(a => {
      if (a.id === id) {
        targetStudentId = data.studentId || a.studentId;
        return {
          ...a,
          ...data,
          pointsAwarded: data.pointsAwarded !== undefined ? Number(data.pointsAwarded) : a.pointsAwarded
        };
      }
      return a;
    });
    setAchievements(updatedAchievements);
    try {
      localStorage.setItem('sim_achievements', JSON.stringify(updatedAchievements));
    } catch (e) {}

    if (targetStudentId) {
      await syncStudentAchievementPoints(targetStudentId, updatedAchievements);
    }

    try {
      await updateDoc(doc(db, 'achievements', id), data);
    } catch (e) {
      try {
        const full = updatedAchievements.find(a => a.id === id);
        if (full) {
          await setDoc(doc(db, 'achievements', id), full);
        }
      } catch (innerErr) {
        console.warn('[SchoolContext] Gagal update achievement di Firebase:', innerErr);
      }
    }
    logAction('UPDATE_ACHIEVEMENT', 'Prestasi Siswa', `Memperbarui prestasi ID ${id}`);
  };

  const deleteAchievement = async (id: string, _arg2?: any, _arg3?: any) => {
    const target = achievements.find(a => a.id === id);
    const targetStudentId = target?.studentId || _arg2;
    const updatedAchievements = achievements.filter(a => a.id !== id);
    setAchievements(updatedAchievements);
    try {
      localStorage.setItem('sim_achievements', JSON.stringify(updatedAchievements));
    } catch (e) {}

    if (targetStudentId) {
      await syncStudentAchievementPoints(targetStudentId, updatedAchievements);
    }

    try {
      await deleteDoc(doc(db, 'achievements', id));
    } catch (e) {
      console.warn('[SchoolContext] Gagal hapus achievement dari Firebase:', e);
    }

    // Also remove mirrored reward if present
    setRewards(prev => {
      const next = prev.filter(r => r.achievementId !== id && r.id !== `rew_${id.replace('ach_', '')}`);
      try { localStorage.setItem('sim_rewards', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    deleteDoc(doc(db, 'rewards', `rew_${id.replace('ach_', '')}`)).catch(() => {});

    logAction('DELETE_ACHIEVEMENT', 'Prestasi Siswa', `Menghapus data prestasi: ${target?.title || id}`);
  };

  // Rewards Operations (Dedicated Table in Firebase Firestore)
  const syncStudentRewardPoints = async (targetStudentId: string, currentRewardsList?: StudentReward[]) => {
    if (!targetStudentId) return 0;
    const list = currentRewardsList || rewards;
    const activeStudentRews = list.filter(r => r.studentId === targetStudentId);
    const calculatedPoints = activeStudentRews.reduce((sum, r) => sum + (Number(r.points) || 0), 0);

    // Update state in memory & localStorage
    setStudents(prev => {
      const updated = prev.map(s => s.id === targetStudentId ? { ...s, achievementPoints: calculatedPoints } : s);
      try {
        localStorage.setItem('sim_students', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Persist to Firestore
    try {
      await updateDoc(doc(db, 'students', targetStudentId), { achievementPoints: calculatedPoints });
    } catch (e) {
      try {
        await setDoc(doc(db, 'students', targetStudentId), { achievementPoints: calculatedPoints }, { merge: true });
      } catch (innerErr) {}
    }

    return calculatedPoints;
  };

  const addReward = async (data: Omit<StudentReward, 'id' | 'createdAt'>) => {
    // Relational Integrity: Safely resolve student
    const student = resolveStudent(students, {
      id: data.studentId || data.studentID,
      nis: data.studentNis,
      name: data.studentName
    });
    const targetStudentId = student?.id || data.studentId || data.studentID || '';
    const finalStudentName = student?.fullName || data.studentName || '';
    const finalStudentClass = student?.className || data.studentClass || data.class || '';
    const finalStudentNis = student?.nis || data.studentNis || '';
    const finalRewardType = data.rewardType || data.rewardTitle || 'Penghargaan Siswa';
    const nowIso = new Date().toISOString();
    const todayDate = data.date || nowIso.split('T')[0];

    const newRew: StudentReward = {
      id: `rew_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      officerName: currentUser?.displayName || data.officerName || 'Tim Kesiswaan',
      actionTaken: data.actionTaken || 'Pemberian Poin Penghargaan',
      ...data,
      studentId: targetStudentId,
      studentID: targetStudentId,
      studentName: finalStudentName,
      studentClass: finalStudentClass,
      class: finalStudentClass,
      studentNis: finalStudentNis,
      rewardTitle: finalRewardType,
      rewardType: finalRewardType,
      category: data.category || 'Kedisiplinan & Karakter',
      points: Number(data.points) || 0,
      date: todayDate,
      description: data.description || 'Pemberian poin apresiasi/penghargaan siswa.',
      status: data.status || 'Diverifikasi',
      academicYear: data.academicYear || activeAcademicYear || '',
      isDeleted: false,
      createdAt: (data as any).createdAt || todayDate,
      updatedAt: nowIso
    };
    const updatedRewards = [newRew, ...rewards];
    setRewards(updatedRewards);
    try {
      localStorage.setItem('sim_rewards', JSON.stringify(updatedRewards));
    } catch (e) {}

    // Atomically recalculate and sync student points
    if (targetStudentId) {
      await syncStudentRewardPoints(targetStudentId, updatedRewards);
    }

    try {
      await setDoc(doc(db, 'rewards', newRew.id), newRew);
    } catch (e) {
      console.warn('[SchoolContext] Gagal simpan reward ke Firebase Firestore:', e);
      handleFirestoreError(e, OperationType.WRITE, 'rewards');
    }
    logAction('RECORD_REWARD', 'Reward Siswa', `Mencatat apresiasi/reward: ${newRew.rewardTitle} untuk ${finalStudentName} (+${newRew.points} poin)`);
  };

  const updateReward = async (id: string, data: Partial<StudentReward>) => {
    let targetStudentId = '';
    const nowIso = new Date().toISOString();
    const updatedRewards = rewards.map(r => {
      if (r.id === id) {
        targetStudentId = data.studentId || data.studentID || r.studentId;
        const studentClass = data.studentClass || data.class || r.studentClass;
        const rewardType = data.rewardType || data.rewardTitle || r.rewardType;
        return {
          ...r,
          ...data,
          studentId: targetStudentId,
          studentID: targetStudentId,
          studentClass: studentClass,
          class: studentClass,
          rewardTitle: rewardType,
          rewardType: rewardType,
          points: data.points !== undefined ? Number(data.points) : r.points,
          updatedAt: nowIso
        };
      }
      return r;
    });
    setRewards(updatedRewards);
    try {
      localStorage.setItem('sim_rewards', JSON.stringify(updatedRewards));
    } catch (e) {}

    if (targetStudentId) {
      await syncStudentRewardPoints(targetStudentId, updatedRewards);
    }

    try {
      await updateDoc(doc(db, 'rewards', id), {
        ...data,
        updatedAt: nowIso
      });
    } catch (e) {
      try {
        const full = updatedRewards.find(r => r.id === id);
        if (full) {
          await setDoc(doc(db, 'rewards', id), full, { merge: true });
        }
      } catch (innerErr) {
        handleFirestoreError(innerErr, OperationType.WRITE, 'rewards');
      }
    }
    logAction('UPDATE_REWARD', 'Reward Siswa', `Memperbarui reward ID ${id}`);
  };

  const deleteReward = async (id: string, studentId?: string, _points?: number) => {
    const target = rewards.find(r => r.id === id);
    const targetStudentId = studentId || target?.studentId;
    const updatedRewards = rewards.filter(r => r.id !== id);
    setRewards(updatedRewards);
    try {
      localStorage.setItem('sim_rewards', JSON.stringify(updatedRewards));
    } catch (e) {}

    if (targetStudentId) {
      await syncStudentRewardPoints(targetStudentId, updatedRewards);
    }

    try {
      await deleteDoc(doc(db, 'rewards', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'rewards');
    }
    logAction('DELETE_REWARD', 'Reward Siswa', `Menghapus catatan reward: ${target?.rewardTitle || id}`);
  };

  // Permissions
  const addPermission = async (data: Omit<StudentPermission, 'id' | 'createdAt'>) => {
    const newPerm: StudentPermission = {
      id: `perm_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setPermissions(prev => {
      const next = [newPerm, ...prev];
      try { localStorage.setItem('sim_permissions', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        setDoc(doc(db, 'permissions', newPerm.id), newPerm).catch(() => {});
      }
    } catch (e) {}
    logAction('RECORD_PERMISSION', 'Perizinan Siswa', `Mengajukan perizinan siswa: ${data.studentName} (${data.type})`);
  };

  const updatePermission = async (id: string, data: Partial<StudentPermission>) => {
    setPermissions(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...data } : p);
      try { localStorage.setItem('sim_permissions', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        updateDoc(doc(db, 'permissions', id), data).catch(() => {});
      }
    } catch (e) {}
  };

  const deletePermission = async (id: string) => {
    setPermissions(prev => {
      const next = prev.filter(p => p.id !== id);
      try { localStorage.setItem('sim_permissions', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        deleteDoc(doc(db, 'permissions', id)).catch(() => {});
      }
    } catch (e) {}
  };

  const updatePermissionStatus = async (id: string, status: 'Menunggu' | 'Disetujui' | 'Ditolak' | 'Selesai') => {
    setPermissions(prev => {
      const next = prev.map(p => p.id === id ? { ...p, status, approvedBy: currentUser?.displayName } : p);
      try { localStorage.setItem('sim_permissions', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        updateDoc(doc(db, 'permissions', id), { status, approvedBy: currentUser?.displayName }).catch(() => {});
      }
    } catch (e) {}
  };

  // Needs Requests
  const addNeedsRequest = async (data: Omit<NeedsRequest, 'id' | 'createdAt'>) => {
    const newNeed: NeedsRequest = {
      id: `need_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setNeedsRequests(prev => {
      const next = [newNeed, ...prev];
      try { localStorage.setItem('sim_needs_requests', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        setDoc(doc(db, 'needs_requests', newNeed.id), newNeed).catch(() => {});
      }
    } catch (e) {}
    logAction('SUBMIT_NEEDS_REQUEST', 'Kebutuhan Ekstrakurikuler', `Mengajukan kebutuhan: ${data.itemName} (${data.extracurricularName})`);
  };

  const reviewNeedsRequest = async (id: string, status: 'Disetujui' | 'Ditolak' | 'Revisi', adminNotes?: string, approvedBudget?: number) => {
    setNeedsRequests(prev => {
      const next = prev.map(n => n.id === id ? { ...n, status, adminNotes, approvedBudget: approvedBudget ?? n.approvedBudget } : n);
      try { localStorage.setItem('sim_needs_requests', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        updateDoc(doc(db, 'needs_requests', id), { status, adminNotes, approvedBudget }).catch(() => {});
      }
    } catch (e) {}
    logAction('REVIEW_NEEDS_REQUEST', 'Kebutuhan Ekstrakurikuler', `Verifikasi kebutuhan ID ${id} menjadi [${status}]`);
  };

  const deleteNeedsRequest = async (id: string) => {
    setNeedsRequests(prev => {
      const next = prev.filter(n => n.id !== id);
      try { localStorage.setItem('sim_needs_requests', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        deleteDoc(doc(db, 'needs_requests', id)).catch(() => {});
      }
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
    setAnnouncements(prev => {
      const next = [newAnn, ...prev];
      try {
        localStorage.setItem('sim_announcements', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    try {
      await setDoc(doc(db, 'announcements', newAnn.id), newAnn);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'announcements');
    }
    logAction('CREATE_ANNOUNCEMENT', 'Pengumuman', `Membuat pengumuman: ${newAnn.title} (${newAnn.targetRole})`);
  };

  const updateAnnouncement = async (id: string, data: Partial<Announcement>) => {
    const updated = { ...data, updatedAt: new Date().toISOString().split('T')[0] };
    setAnnouncements(prev => {
      const next = prev.map(a => a.id === id ? { ...a, ...updated } : a);
      try {
        localStorage.setItem('sim_announcements', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    try {
      await setDoc(doc(db, 'announcements', id), updated, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'announcements');
    }
    logAction('UPDATE_ANNOUNCEMENT', 'Pengumuman', `Memperbarui pengumuman ID ${id}`);
  };

  const deleteAnnouncement = async (id: string) => {
    const target = announcements.find(a => a.id === id);
    setAnnouncements(prev => {
      const next = prev.filter(a => a.id !== id);
      try {
        localStorage.setItem('sim_announcements', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    try {
      await deleteDoc(doc(db, 'announcements', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'announcements');
    }
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

    setAnnouncements(prev => {
      const next = prev.map(a => {
        if (a.id === id) {
          const readBy = { ...(a.readByUsers || {}), [userKey]: nowIso };
          return { ...a, readByUsers: readBy };
        }
        return a;
      });
      try {
        localStorage.setItem('sim_announcements', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    try {
      const targetDoc = doc(db, 'announcements', id);
      await setDoc(targetDoc, {
        readByUsers: { [userKey]: nowIso }
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'announcements');
    }
  };

  const markAllAnnouncementsAsReadForUser = async (ids: string[], uid?: string) => {
    if (!ids || ids.length === 0) return;
    const userKey = uid || currentUser?.uid || 'guest';
    const nowIso = new Date().toISOString();

    setAnnouncements(prev => {
      const next = prev.map(a => {
        if (ids.includes(a.id)) {
          const readBy = { ...(a.readByUsers || {}), [userKey]: nowIso };
          return { ...a, readByUsers: readBy };
        }
        return a;
      });
      try {
        localStorage.setItem('sim_announcements', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    for (const annId of ids) {
      try {
        await setDoc(doc(db, 'announcements', annId), {
          readByUsers: { [userKey]: nowIso }
        }, { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'announcements');
      }
    }
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, isRead: true } : n);
      try { localStorage.setItem('sim_notifications', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, isRead: true }));
      try { localStorage.setItem('sim_notifications', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };

  const addNotification = (item: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      ...item,
      isRead: false,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setNotifications(prev => {
      const next = [newNotif, ...prev];
      try { localStorage.setItem('sim_notifications', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      setDoc(doc(db, 'notifications', newNotif.id), newNotif).catch(() => {});
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

    const newDocId = getNextOsimDocId(osimMembers);
    const newMember: OsimMember = {
      id: newDocId,
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

    setOsimMembers(prev => {
      const nextMembers = [newMember, ...prev.filter(m => m.id !== newDocId)];
      try {
        localStorage.setItem('sim_osim_members', JSON.stringify(nextMembers));
      } catch (e) {}
      const posLower = (newMember.position || '').toLowerCase();
      const isBphTarget = isBphMember(newMember);
      const isSekbidKetua = !isBphTarget && (posLower.includes('ketua') || posLower.includes('koordinator'));
      if ((isBphTarget || isSekbidKetua) && syncUsersFromOsim) {
        setTimeout(() => {
          syncUsersFromOsim(osimDepartments || [], nextMembers).catch(e => console.warn('Auto sync osim member to cpanel note:', e));
        }, 50);
      }
      return nextMembers;
    });
    try {
      setDoc(doc(db, 'osim_members', newMember.id), newMember).catch(() => {});
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

    setOsimMembers(prev => {
      const nextMembers = prev.map(m => m.id === id ? { ...m, ...normalizedData } : m);
      try {
        localStorage.setItem('sim_osim_members', JSON.stringify(nextMembers));
      } catch (e) {}
      const target = nextMembers.find(m => m.id === id);
      if (target) {
        const posLower = (target.position || '').toLowerCase();
        const isBphTarget = isBphMember(target);
        const isSekbidKetua = !isBphTarget && (posLower.includes('ketua') || posLower.includes('koordinator'));
        if ((isBphTarget || isSekbidKetua) && syncUsersFromOsim) {
          setTimeout(() => {
            syncUsersFromOsim(osimDepartments || [], nextMembers).catch(e => console.warn('Auto sync on osim update note:', e));
          }, 50);
        }
      }
      return nextMembers;
    });
    try {
      updateDoc(doc(db, 'osim_members', id), normalizedData).catch(() => {});
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
    // Validate payload against schema guard
    const validation = validatePayload(osimProgramSchema, data);
    if (!validation.success) {
      console.warn('Invalid osim program payload:', validation.errors);
      return;
    }

    const validData = validation.data;
    const newProg: OsimWorkProgram = {
      id: `proker_${Date.now()}`,
      ...data,
      ...validData,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setOsimPrograms(prev => {
      const next = [newProg, ...prev];
      try { localStorage.setItem('sim_osim_programs', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        setDoc(doc(db, 'osim_programs', newProg.id), newProg).catch(() => {});
      }
    } catch (e) {}
    logAction('ADD_OSIM_PROGRAM', 'Intrakurikuler & OSIM', `Membuat program kerja OSIM: ${newProg.title}`);
  };

  const updateOsimProgram = async (id: string, data: Partial<OsimWorkProgram>) => {
    setOsimPrograms(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...data } : p);
      try { localStorage.setItem('sim_osim_programs', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        updateDoc(doc(db, 'osim_programs', id), data).catch(() => {});
      }
    } catch (e) {}
    logAction('UPDATE_OSIM_PROGRAM', 'Intrakurikuler & OSIM', `Memperbarui program kerja OSIM: ${data.title || id}`);
  };

  const deleteOsimProgram = async (id: string) => {
    setOsimPrograms(prev => {
      const next = prev.filter(p => p.id !== id);
      try { localStorage.setItem('sim_osim_programs', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        deleteDoc(doc(db, 'osim_programs', id)).catch(() => {});
      }
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
    setOsimAspirations(prev => {
      const next = [newAsp, ...prev];
      try { localStorage.setItem('sim_osim_aspirations', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        setDoc(doc(db, 'osim_aspirations', newAsp.id), newAsp).catch(() => {});
      }
    } catch (e) {}
    logAction('ADD_OSIM_ASPIRATION', 'Intrakurikuler & OSIM', `Mengirim aspirasi siswa: ${newAsp.title}`);
  };

  const updateOsimAspiration = async (id: string, data: Partial<OsimAspiration>) => {
    setOsimAspirations(prev => {
      const next = prev.map(a => a.id === id ? { ...a, ...data } : a);
      try { localStorage.setItem('sim_osim_aspirations', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        updateDoc(doc(db, 'osim_aspirations', id), data).catch(() => {});
      }
    } catch (e) {}
    logAction('UPDATE_OSIM_ASPIRATION', 'Intrakurikuler & OSIM', `Memperbarui respon aspirasi ID ${id}`);
  };

  const deleteOsimAspiration = async (id: string) => {
    setOsimAspirations(prev => {
      const next = prev.filter(a => a.id !== id);
      try { localStorage.setItem('sim_osim_aspirations', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        deleteDoc(doc(db, 'osim_aspirations', id)).catch(() => {});
      }
    } catch (e) {}
    logAction('DELETE_OSIM_ASPIRATION', 'Intrakurikuler & OSIM', `Menghapus aspirasi siswa ID ${id}`);
  };

  // OSIM Meetings & Notulensi Rapat
  const addOsimMeeting = async (data: Omit<OsimMeeting, 'id' | 'createdAt'>) => {
    const pad = String(osimMeetings.length + 1).padStart(2, '0');
    const d = data.date ? new Date(data.date) : new Date();
    const year = isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear();
    const monthRoman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][
      isNaN(d.getMonth()) ? new Date().getMonth() : d.getMonth()
    ] || 'X';

    const autoNumber = `${pad}/BA-NOTULEN/OSIM/${monthRoman}/${year}`;

    const newMeet: OsimMeeting = {
      id: `meet_${Date.now()}`,
      meetingNumber: data.meetingNumber || autoNumber,
      status: data.status || 'Draft',
      ...data,
      createdAt: new Date().toISOString()
    };
    setOsimMeetings(prev => {
      const next = [newMeet, ...prev];
      try {
        localStorage.setItem('sim_osim_meetings', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        setDoc(doc(db, 'osim_meetings', newMeet.id), newMeet).catch(() => {});
      }
    } catch (e) {}
    logAction('ADD_OSIM_MEETING', 'Intrakurikuler & OSIM', `Mencatat notulensi rapat OSIM: ${newMeet.title}`);
  };

  const updateOsimMeeting = async (id: string, data: Partial<OsimMeeting>) => {
    setOsimMeetings(prev => {
      const next = prev.map(m => m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m);
      try {
        localStorage.setItem('sim_osim_meetings', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        updateDoc(doc(db, 'osim_meetings', id), {
          ...data,
          updatedAt: new Date().toISOString()
        }).catch(() => {});
      }
    } catch (e) {}
    logAction('UPDATE_OSIM_MEETING', 'Intrakurikuler & OSIM', `Memperbarui notulensi rapat OSIM: ${data.title || id}`);
  };

  const deleteOsimMeeting = async (id: string) => {
    setOsimMeetings(prev => {
      const next = prev.filter(m => m.id !== id);
      try {
        localStorage.setItem('sim_osim_meetings', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        deleteDoc(doc(db, 'osim_meetings', id)).catch(() => {});
      }
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
      if (auth.currentUser) {
        setDoc(doc(db, 'osim_departments', newDept.id), newDept).catch(() => {});
      }
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
      if (auth.currentUser) {
        updateDoc(doc(db, 'osim_departments', id), { ...data, updatedAt: new Date().toISOString() }).catch(() => {});
      }
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
      if (auth.currentUser) {
        deleteDoc(doc(db, 'osim_departments', id)).catch(() => {});
      }
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
      if (auth.currentUser) {
        for (const d of INITIAL_OSIM_DEPARTMENTS) {
          setDoc(doc(db, 'osim_departments', d.id), d).catch(() => {});
        }
      }
    } catch (e) {}
    logAction('RESET_OSIM_DEPARTMENTS', 'Intrakurikuler & OSIM', 'Mereset struktur bidang kabinet OSIM ke 8 Sekbid standar');
  };

  // ==========================================
  // NERACA KAS & KEUANGAN KESISWAAN HANDLERS
  // ==========================================

  // Cash Accounts
  const addCashAccount = async (data: Omit<CashAccount, 'id' | 'createdAt'>) => {
    const valRes = validatePayload(cashAccountSchema, data);
    if (!valRes.success) {
      console.warn('[Schema Guard] Peringatan validasi akun kas:', valRes.errors);
    }

    const newAcc: CashAccount = {
      id: `kas_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setCashAccounts(prev => {
      const next = [newAcc, ...prev];
      try { localStorage.setItem('sim_cash_accounts', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        setDoc(doc(db, 'cash_accounts', newAcc.id), newAcc).catch(() => {});
      }
    } catch (e) {}
    logAction('ADD_CASH_ACCOUNT', 'Neraca Kas', `Membuat akun kas baru: ${newAcc.name} (${newAcc.code})`);
  };

  const updateCashAccount = async (id: string, data: Partial<CashAccount>) => {
    setCashAccounts(prev => {
      const next = prev.map(a => a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a);
      try { localStorage.setItem('sim_cash_accounts', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        updateDoc(doc(db, 'cash_accounts', id), { ...data, updatedAt: new Date().toISOString() }).catch(() => {});
      }
    } catch (e) {}
    logAction('UPDATE_CASH_ACCOUNT', 'Neraca Kas', `Memperbarui akun kas: ${data.name || id}`);
  };

  const deleteCashAccount = async (id: string) => {
    const target = cashAccounts.find(a => a.id === id);
    setCashAccounts(prev => {
      const next = prev.filter(a => a.id !== id);
      try { localStorage.setItem('sim_cash_accounts', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    // Also remove associated transactions
    setCashTransactions(prev => {
      const next = prev.filter(t => t.accountId !== id);
      try { localStorage.setItem('sim_cash_transactions', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    try {
      if (auth.currentUser) {
        deleteDoc(doc(db, 'cash_accounts', id)).catch(() => {});
      }
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
      setDoc(doc(db, 'cash_accounts', accountId), updatedAcc, { merge: true }).catch(() => {});
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

  // Cash Transactions (Atomic Multi-Document Transaction with Account Balance Reconciliation)
  const addCashTransaction = async (data: Omit<CashTransaction, 'id' | 'createdAt'>) => {
    // Validate payload against schema guard
    const validation = validatePayload(cashTransactionSchema, data);
    if (!validation.success) {
      console.warn('Invalid cash transaction payload:', validation.errors);
      return;
    }

    const validData = validation.data;
    const autoRef = validData.referenceNumber || (
      validData.type === 'MASUK'
        ? `BKM-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(Date.now()).slice(-4)}`
        : `BKK-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(Date.now()).slice(-4)}`
    );

    const targetAccount = cashAccounts.find(a => a.id === validData.accountId);
    const resolvedAccountName = validData.accountName || targetAccount?.name || (data as any).accountName || 'Kas';

    const newTrx: CashTransaction = {
      id: `trx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...data,
      ...validData,
      accountName: resolvedAccountName,
      referenceNumber: autoRef,
      createdAt: new Date().toISOString().split('T')[0]
    };

    // Update transactions state
    setCashTransactions(prev => {
      const next = [newTrx, ...prev];
      try { localStorage.setItem('sim_cash_transactions', JSON.stringify(next)); } catch (e) {}
      return next;
    });

    // Atomically recalculate and update account balance in state
    setCashAccounts(prev => {
      const next = prev.map(acc => {
        if (acc.id === validData.accountId) {
          const delta = validData.type === 'MASUK' ? Number(validData.amount) : -Number(validData.amount);
          const nextBal = (Number(acc.balance) || 0) + delta;
          return { ...acc, balance: nextBal, updatedAt: new Date().toISOString() };
        }
        return acc;
      });
      try { localStorage.setItem('sim_cash_accounts', JSON.stringify(next)); } catch (e) {}
      return next;
    });

    // Atomically commit to Cloud Firestore using runTransaction
    if (auth.currentUser) {
      try {
        await runTransaction(db, async (t) => {
          const accRef = doc(db, 'cash_accounts', validData.accountId);
          const accSnap = await t.get(accRef);
          const currentBal = accSnap.exists() ? (Number(accSnap.data().balance) || 0) : 0;
          const delta = validData.type === 'MASUK' ? Number(validData.amount) : -Number(validData.amount);
          const newBal = currentBal + delta;

          const trxRef = doc(db, 'cash_transactions', newTrx.id);
          t.set(trxRef, newTrx);
          if (accSnap.exists()) {
            t.update(accRef, { balance: newBal, updatedAt: new Date().toISOString() });
          }
        });
      } catch (err) {
        console.warn('Atomic cash transaction sync warning:', err);
      }
    }

    logAction(
      validData.type === 'MASUK' ? 'CASH_INFLOW' : 'CASH_OUTFLOW',
      'Neraca Kas',
      `Mencatat uang ${validData.type === 'MASUK' ? 'masuk' : 'keluar'}: Rp ${validData.amount.toLocaleString('id-ID')} (${validData.title}) pada ${validData.accountName || validData.accountId}`
    );
  };

  const updateCashTransaction = async (id: string, data: Partial<CashTransaction>) => {
    const existing = cashTransactions.find(t => t.id === id);
    if (!existing) return;

    const merged = { ...existing, ...data, updatedAt: new Date().toISOString() };
    setCashTransactions(prev => {
      const next = prev.map(t => t.id === id ? merged : t);
      try { localStorage.setItem('sim_cash_transactions', JSON.stringify(next)); } catch (e) {}
      return next;
    });

    // If amount, type, or account changed, reconcile affected accounts
    const oldDelta = existing.type === 'MASUK' ? Number(existing.amount) : -Number(existing.amount);
    const newDelta = merged.type === 'MASUK' ? Number(merged.amount) : -Number(merged.amount);

    if (existing.accountId === merged.accountId) {
      const netChange = newDelta - oldDelta;
      setCashAccounts(prev => {
        const next = prev.map(acc => {
          if (acc.id === merged.accountId) {
            return { ...acc, balance: (Number(acc.balance) || 0) + netChange, updatedAt: new Date().toISOString() };
          }
          return acc;
        });
        try { localStorage.setItem('sim_cash_accounts', JSON.stringify(next)); } catch (e) {}
        return next;
      });
    } else {
      // Revert old account and add to new account
      setCashAccounts(prev => {
        const next = prev.map(acc => {
          if (acc.id === existing.accountId) {
            return { ...acc, balance: (Number(acc.balance) || 0) - oldDelta, updatedAt: new Date().toISOString() };
          }
          if (acc.id === merged.accountId) {
            return { ...acc, balance: (Number(acc.balance) || 0) + newDelta, updatedAt: new Date().toISOString() };
          }
          return acc;
        });
        try { localStorage.setItem('sim_cash_accounts', JSON.stringify(next)); } catch (e) {}
        return next;
      });
    }

    if (auth.currentUser) {
      try {
        await runTransaction(db, async (t) => {
          const trxRef = doc(db, 'cash_transactions', id);
          t.update(trxRef, { ...data, updatedAt: new Date().toISOString() });

          if (existing.accountId === merged.accountId) {
            const accRef = doc(db, 'cash_accounts', merged.accountId);
            const accSnap = await t.get(accRef);
            if (accSnap.exists()) {
              const curBal = Number(accSnap.data().balance) || 0;
              const netChange = newDelta - oldDelta;
              t.update(accRef, { balance: curBal + netChange, updatedAt: new Date().toISOString() });
            }
          } else {
            const oldAccRef = doc(db, 'cash_accounts', existing.accountId);
            const oldAccSnap = await t.get(oldAccRef);
            if (oldAccSnap.exists()) {
              const curBal = Number(oldAccSnap.data().balance) || 0;
              t.update(oldAccRef, { balance: curBal - oldDelta, updatedAt: new Date().toISOString() });
            }

            const newAccRef = doc(db, 'cash_accounts', merged.accountId);
            const newAccSnap = await t.get(newAccRef);
            if (newAccSnap.exists()) {
              const curBal = Number(newAccSnap.data().balance) || 0;
              t.update(newAccRef, { balance: curBal + newDelta, updatedAt: new Date().toISOString() });
            }
          }
        });
      } catch (e) {
        console.warn('Atomic update cash transaction warning:', e);
      }
    }
    logAction('UPDATE_CASH_TRANSACTION', 'Neraca Kas', `Memperbarui transaksi kas ID ${id}`);
  };

  const deleteCashTransaction = async (id: string) => {
    const target = cashTransactions.find(t => t.id === id);
    if (!target) return;

    setCashTransactions(prev => {
      const next = prev.filter(t => t.id !== id);
      try { localStorage.setItem('sim_cash_transactions', JSON.stringify(next)); } catch (e) {}
      return next;
    });

    // Revert balance in local state
    const deltaToRevert = target.type === 'MASUK' ? -Number(target.amount) : Number(target.amount);
    setCashAccounts(prev => {
      const next = prev.map(acc => {
        if (acc.id === target.accountId) {
          return { ...acc, balance: (Number(acc.balance) || 0) + deltaToRevert, updatedAt: new Date().toISOString() };
        }
        return acc;
      });
      try { localStorage.setItem('sim_cash_accounts', JSON.stringify(next)); } catch (e) {}
      return next;
    });

    if (auth.currentUser) {
      try {
        await runTransaction(db, async (t) => {
          const accRef = doc(db, 'cash_accounts', target.accountId);
          const accSnap = await t.get(accRef);
          if (accSnap.exists()) {
            const curBal = Number(accSnap.data().balance) || 0;
            t.update(accRef, { balance: curBal + deltaToRevert, updatedAt: new Date().toISOString() });
          }
          const trxRef = doc(db, 'cash_transactions', id);
          t.delete(trxRef);
        });
      } catch (e) {
        console.warn('Atomic delete cash transaction warning:', e);
      }
    }
    logAction('DELETE_CASH_TRANSACTION', 'Neraca Kas', `Menghapus transaksi kas: ${target.title || id} (Rp ${target.amount.toLocaleString('id-ID')})`);
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
    setSchoolRules(prev => {
      const updated = [...prev, newRule];
      try {
        localStorage.setItem('sim_school_rules', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    try {
      await setDoc(doc(db, 'school_rules', newRule.id), newRule);
    } catch (e) {
      console.warn('[SchoolContext] Gagal simpan pasal ke Firebase Firestore:', e);
    }
    logAction('ADD_SCHOOL_RULE', 'Buku Tata Tertib', `Menambahkan pasal tata tertib: ${newRule.articleNumber} - ${newRule.title}`);
  };

  const updateSchoolRule = async (id: string, data: Partial<SchoolRuleArticle>) => {
    const updatedData = {
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.displayName || 'Admin Kesiswaan'
    };
    setSchoolRules(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, ...updatedData } : r);
      try {
        localStorage.setItem('sim_school_rules', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    try {
      await updateDoc(doc(db, 'school_rules', id), updatedData);
    } catch (e) {
      try {
        const fullRule = schoolRules.find(r => r.id === id);
        if (fullRule) {
          await setDoc(doc(db, 'school_rules', id), { ...fullRule, ...updatedData });
        }
      } catch (innerErr) {
        console.warn('[SchoolContext] Gagal update pasal ke Firebase:', innerErr);
      }
    }
    logAction('UPDATE_SCHOOL_RULE', 'Buku Tata Tertib', `Memperbarui aturan tata tertib: ${data.articleNumber || ''} ${data.title || id}`);
  };

  const deleteSchoolRule = async (id: string) => {
    const target = schoolRules.find(r => r.id === id);
    setSchoolRules(prev => {
      const updated = prev.filter(r => r.id !== id);
      try {
        localStorage.setItem('sim_school_rules', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    try {
      await deleteDoc(doc(db, 'school_rules', id));
    } catch (e) {
      console.warn('[SchoolContext] Gagal hapus pasal dari Firebase:', e);
    }
    logAction('DELETE_SCHOOL_RULE', 'Buku Tata Tertib', `Menghapus pasal aturan: ${target?.articleNumber || ''} ${target?.title || id}`);
  };

  const resetSchoolRulesToDefault = async () => {
    setSchoolRules(INITIAL_SCHOOL_RULES);
    setHandbookMeta(INITIAL_HANDBOOK_META);
    try {
      localStorage.setItem('sim_school_rules', JSON.stringify(INITIAL_SCHOOL_RULES));
      localStorage.setItem('sim_handbook_meta', JSON.stringify(INITIAL_HANDBOOK_META));
    } catch (e) {}
    try {
      for (const r of INITIAL_SCHOOL_RULES) {
        setDoc(doc(db, 'school_rules', r.id), r).catch(() => {});
      }
      setDoc(doc(db, 'settings', 'handbook_meta'), INITIAL_HANDBOOK_META).catch(() => {});
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
      if (auth.currentUser) {
        setDoc(doc(db, 'settings', 'handbook_meta'), updated).catch(() => {});
      }
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
        rewards,
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
        harmonizeTeachersFirestore,
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
        syncStudentAchievementPoints,
        addReward,
        updateReward,
        deleteReward,
        syncStudentRewardPoints,
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
        cloudStatus,
        verifyCloudDataIntegrity,
        syncLocalChangesToFirestore,
        reconcileAllCashBalances,
        checkDatabaseRelationalHealth,
        runFullDatabaseHarmonization,
        autoHealOrphanRecords,
        createDisasterRecoverySnapshot,
        restoreFromDisasterSnapshot,
        getDisasterRecoverySnapshots,
        deleteDisasterRecoverySnapshot,
        executeFase7Audit
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
