import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile, UserRole, CanonicalUserRole, OsimPosition, Teacher, Extracurricular, AuditLogItem, OsimDepartment, OsimMember, OsimRoleType, AuthBootstrapState } from '../types';
import { DEMO_USERS, DEFAULT_SUPER_ADMIN, PURGED_DEMO_UIDS, PURGED_DEMO_EMAILS, isBlacklistedDemoName, getDefaultOsimPassword } from '../services/seedData';
import { auth, db, getSecondaryAuth } from '../services/firebase';
import { SessionTimeoutModal } from '../components/common/SessionTimeoutModal';
import { handleFirestoreError, OperationType, isPermissionError } from '../services/firestoreErrors';
import { doc, getDoc, getDocs, collection, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import {
  onAuthStateChanged,
  signOut as fbSignOut,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  updateEmail,
  createUserWithEmailAndPassword,
  signInAnonymously,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import {
  normalizeUserRole,
  normalizeOsimPosition,
  normalizeUserProfile,
  hasRole,
  hasPosition,
  hasScope,
  hasPermission,
  canManageCash,
  canReviewOsimProgram,
  canApproveOsimProgram,
  canManageExtracurricular,
  canAccessMenu,
  Permission
} from '../permissions';
import { canRoleViewModule, canRoleInputModule } from '../services/rbacService';
import {
  addDeletedUid,
  isDeletedUid,
  removeDeletedUid,
  deduplicateUsersList,
  sortUsersByHierarchy,
  isTeacherUserMatch,
  isOsimMemberUserMatch,
  normalizeName,
  cleanDigits,
  canonicalizeAssignedEkskulIds,
  isRandomOrLegacyArtifactUid,
  isStandardTidyUid,
  resolveTidyUidForUser,
  isProtectedTeacherOrStaff,
  isGenericPlaceholderEmail,
  isPlaceholderNis
} from '../utils/syncUtils';
import {
  extractSekbidNumber,
  isBphMember,
  isEligibleOsimAccount,
  isKetuaSekbid,
  isAnggotaSekbid,
  getDefaultOsimUsername
} from '../utils/osimAccountHelper';
import { validatePayload, userProfileSchema } from '../services/schemaValidation';

export const recordSystemAuditLog = async (
  action: string,
  module: string,
  details: string,
  user?: UserProfile | null
): Promise<AuditLogItem> => {
  const newLog: AuditLogItem = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: user?.uid || 'system',
    userEmail: user?.email || 'system@sekolah.sch.id',
    userName: user?.displayName || 'Sistem SIM-KESISWAAN',
    userRole: user?.role || 'super_admin',
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

  try {
    const raw = localStorage.getItem('sim_audit_logs');
    const existing: AuditLogItem[] = raw ? JSON.parse(raw) : [];
    const updated = [newLog, ...existing].slice(0, 1000);
    localStorage.setItem('sim_audit_logs', JSON.stringify(updated));
  } catch (e) {}

  try {
    if (auth.currentUser) {
      setDoc(doc(db, 'audit_logs', newLog.id), newLog).catch(() => {});
    }
  } catch (e) {}

  return newLog;
};

const isPurgedUser = (u: any): boolean => {
  if (!u) return true;
  // Akun resmi Dewan Guru & Tenaga Kependidikan sah dilindungi mutlak
  if (isProtectedTeacherOrStaff(u)) return false;
  if (PURGED_DEMO_UIDS.includes(u.uid)) return true;
  if (u.email && PURGED_DEMO_EMAILS.includes(u.email.toLowerCase().trim())) return true;
  if (isBlacklistedDemoName(u.displayName)) return true;

  // Akun resmi OSIM yang sah (bukan email dummy yang dipurge) diizinkan
  const role = (u.role || '').toLowerCase();
  const uid = (u.uid || '').toLowerCase();
  const username = (u.username || '').toLowerCase().trim();
  if (role === 'anggota_osim' || role === 'pengurus_osim' || uid.startsWith('user_osim_') || username.startsWith('osim.')) {
    return false;
  }

  return false;
};

interface AuthContextType {
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  userRole: UserRole;
  canonicalRole: CanonicalUserRole | null;
  osimPosition?: OsimPosition;
  bootstrapState: AuthBootstrapState;
  bootstrapError: string | null;
  // Capability and Permission helpers
  hasRole: (...roles: CanonicalUserRole[]) => boolean;
  hasPosition: (...positions: OsimPosition[]) => boolean;
  hasScope: (scopeType: 'extracurricular' | 'osim_department', targetId: string) => boolean;
  hasPermission: (permission: Permission) => boolean;
  canManageCash: () => boolean;
  canReviewOsimProgram: () => boolean;
  canApproveOsimProgram: () => boolean;
  canManageExtracurricular: (ekskulId?: string) => boolean;
  // Legacy boolean compatibility flags
  isSuperAdmin: boolean;
  isWaka: boolean;
  isWakaOrAdmin: boolean;
  isGuruBK: boolean;
  isPembinaOsim: boolean;
  isPembinaEkskul: boolean;
  isAlsoPembinaEkskul: boolean;
  isPembina: boolean;
  isWaliKelas: boolean;
  isGuruMapel: boolean;
  isTeacher: boolean;
  isStaffTU: boolean;
  canManageLetters: boolean;
  isPengurusOsim: boolean;
  // Model A: Akun Fungsional Pengurus Inti OSIM (BPH)
  isOsimKetua: boolean;
  isOsimWakil: boolean;
  isOsimSekretaris: boolean;
  isOsimBendahara: boolean;
  isOsimBph: boolean;
  // Supervisi & Hak Veto Wewenang: Pembina OSIM, Waka Kesiswaan & Admin App
  isSupervisoryVetoAuthorized: boolean;
  osimDepartmentId?: string;
  osimDepartmentCode?: string;
  osimDepartmentName?: string;
  canAccessTab: (tabId: string) => boolean;
  isLoading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithIdentifier: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithUser: (user: UserProfile) => void;
  loginWithDemoRole: (role: UserRole, customUid?: string) => void;
  switchRole: (role: UserRole) => void;
  isSimulatedFromAdmin: boolean;
  returnToAdminSession: () => void;
  logout: () => Promise<void>;
  updateProfileState: (updated: Partial<UserProfile>) => void;
  // cPanel User Management methods
  addUser: (user: UserProfile) => Promise<{ success: boolean; error?: string }>;
  updateUser: (uid: string, updated: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (uid: string) => Promise<{ success: boolean; error?: string }>;
  deleteUsersBulk: (uids: string[]) => Promise<{ success: boolean; deletedCount: number; error?: string }>;
  resetUserPassword: (uid: string, newPassword?: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  syncUsersFromTeachers: (teachersList: Teacher[], extracurricularsList?: Extracurricular[]) => Promise<number>;
  syncUsersFromOsim: (departmentsList: OsimDepartment[], membersList?: OsimMember[]) => Promise<number>;
  migrateAllUsersToTidyUids: () => Promise<{ migratedCount: number; deletedArtifactsCount: number }>;
  activateTeacherAccount: (params: {
    teacherId?: string;
    uid?: string;
    email: string;
    username?: string;
    password?: string;
    fullName: string;
    nip?: string;
    role: CanonicalUserRole | UserRole;
    phone?: string;
    extracurricularIds?: string[];
    extracurricularNames?: string[];
    counselorSpecialization?: string;
    isCashManager?: boolean;
    cashManagerTitle?: string;
  }) => Promise<{ success: boolean; user?: UserProfile; error?: string }>;
  activateOsimAccount: (params: {
    memberId?: string;
    uid?: string;
    email: string;
    username?: string;
    password?: string;
    fullName: string;
    studentNis?: string;
    className?: string;
    position?: string;
    sekbid?: string;
    phone?: string;
    isCashManager?: boolean;
    cashManagerTitle?: string;
  }) => Promise<{ success: boolean; user?: UserProfile; error?: string }>;
  // Idle Session Management
  extendSession: () => void;
  isIdleWarningOpen: boolean;
  idleCountdownSeconds: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'sim_kesiswaan_active_user';
const SESSION_STORAGE_USER_KEY = 'sim_kesiswaan_session_user';
const LOCAL_STORAGE_ALL_USERS_KEY = 'sim_kesiswaan_all_users_registry';

// Konfigurasi Idle Timeout (30 menit inaktif, modal muncul 1 menit sebelum sesi berakhir)
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 Menit (1.800.000 ms)
const IDLE_WARNING_MS = 1 * 60 * 1000;  // 1 Menit (60.000 ms)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize all users with persistent custom users or deduplicated storage
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_ALL_USERS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UserProfile[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validUsers = parsed.filter(u =>
            u && u.uid &&
            !isPurgedUser(u) &&
            !isDeletedUid(u.uid) &&
            (!u.email || !isDeletedUid(u.email)) &&
            (!u.email || !PURGED_DEMO_EMAILS.includes(u.email.toLowerCase().trim()))
          );
          // Always ensure Super Admin is retained so admin is never locked out
          const hasAdmin = validUsers.some(u => u.uid === 'user_super_admin' || u.role === 'super_admin');
          const combined = hasAdmin ? validUsers : [DEFAULT_SUPER_ADMIN, ...validUsers];
          const deduplicated = deduplicateUsersList(combined);
          const sorted = sortUsersByHierarchy(deduplicated);
          return sorted.length > 0 ? sorted : [DEFAULT_SUPER_ADMIN];
        }
      } catch (e) {
        console.warn('Failed to parse all users:', e);
      }
    }
    // Only use DEMO_USERS on fresh, uninitialized install, always ensuring Super Admin is present
    const baseUsers = DEMO_USERS.filter(u =>
      !isDeletedUid(u.uid) &&
      !isPurgedUser(u) &&
      (!u.email || !isDeletedUid(u.email)) &&
      (!u.email || !PURGED_DEMO_EMAILS.includes(u.email.toLowerCase().trim()))
    );
    const withAdmin = baseUsers.some(u => u.uid === 'user_super_admin' || u.role === 'super_admin')
      ? baseUsers
      : [DEFAULT_SUPER_ADMIN, ...baseUsers];
    return sortUsersByHierarchy(deduplicateUsersList(withAdmin));
  });

  // Real-time synchronization of users collection across all devices via Firestore onSnapshot (Single Source of Truth)
  useEffect(() => {
    let unsub: (() => void) | null = null;
    try {
      unsub = onSnapshot(collection(db, 'users'), (snap) => {
        if (!snap.empty) {
          const firestoreUsers: UserProfile[] = [];
          const allDocIds = new Set(snap.docs.map(d => d.id));
          const seenCanonicalEmails = new Map<string, string>(); // lowerEmail -> primary doc ID

          for (const d of snap.docs) {
            const data = d.data() as UserProfile;
            const uid = data.uid || d.id;
            const userWithId = { ...data, uid };
            const lowerEmail = (data.email || '').toLowerCase().trim();

            // 1. Cek pembersihan akun terlarang / dihapus (Purged / Deleted)
            // Catatan Keamanan: Akun guru/staf sah dilindungi mutlak dan tidak boleh dipurge
            const isProtectedTeacher = isProtectedTeacherOrStaff(userWithId);
            const isTargetPurged = !isProtectedTeacher && (
              isPurgedUser(userWithId) ||
              isDeletedUid(uid) ||
              isDeletedUid(d.id) ||
              (lowerEmail && isDeletedUid(lowerEmail)) ||
              PURGED_DEMO_EMAILS.includes(lowerEmail) ||
              lowerEmail === 'admin@sekolah.sch.id' ||
              lowerEmail === 'pitria.lawenusa@madrasah.sch.id' ||
              lowerEmail === 'pitria.lawenusa@sekolah.sch.id' ||
              d.id === 'user_teacher_pitria_lawenusa' ||
              d.id === 'teacher_pitria_lawenusa'
            );

            if (isTargetPurged) {
              // Abaikan dokumen yang dipurge dari state in-memory (tanpa delete pasif)
              continue;
            }

            // 1b. Pertahankan seluruh akun pengurus OSIM yang terdaftar
            const isOsimUser = data.role === 'anggota_osim' || data.role === 'pengurus_osim';
            if (isOsimUser && data.uid && data.uid.includes('ineligible')) {
              continue;
            }

            // 2. Pembersihan In-Memory Dokumen Kembar / Alias Write Lama:
            // Kasus A: Dokumen d.id TIDAK berawalan 'user_', tetapi dokumen 'user_' + d.id juga ada di Firestore (misal 'waka_kesiswaan' kembar dengan 'user_waka_kesiswaan')
            if (!d.id.startsWith('user_') && allDocIds.has(`user_${d.id}`)) {
              continue;
            }

            // Kasus B: Dokumen ber-ID acak / Firebase Auth UID
            if (isRandomOrLegacyArtifactUid(d.id)) {
              const targetTidyUid = resolveTidyUidForUser(data);
              if (targetTidyUid === 'user_osim_ineligible_anggota') {
                continue;
              }
              // Jika dokumen ber-UID rapi sudah ada di Firestore, maka dokumen acak ini diabaikan in-memory
              if (allDocIds.has(targetTidyUid) && targetTidyUid !== d.id) {
                continue;
              } else if (targetTidyUid !== d.id) {
                // Tampilkan user dengan targetTidyUid yang rapi di in-memory
                const tidyUser: UserProfile = {
                  ...data,
                  uid: targetTidyUid,
                  authUid: d.id,
                  updatedAt: new Date().toISOString()
                };
                firestoreUsers.push(tidyUser);
                if (lowerEmail && !isGenericPlaceholderEmail(lowerEmail)) {
                  seenCanonicalEmails.set(lowerEmail, targetTidyUid);
                }
                continue;
              }
            }

            // Kasus C: Dokumen kembar dengan email unik yang sama persis
            if (lowerEmail && !isGenericPlaceholderEmail(lowerEmail)) {
              if (seenCanonicalEmails.has(lowerEmail)) {
                continue;
              } else {
                seenCanonicalEmails.set(lowerEmail, d.id);
              }
            }

            // Kasus D: Duplikat akun Super Admin
            const isSuperAdmin = lowerEmail === 'puputbajuri24@gmail.com' || (data.role === 'super_admin' && !data.username?.startsWith('demo'));
            if (isSuperAdmin) {
              if (d.id !== 'user_super_admin' && allDocIds.has('user_super_admin')) {
                continue;
              }
            }

            firestoreUsers.push(userWithId);
          }

          setAllUsers(() => {
            const candidateUsers = firestoreUsers.filter(u =>
              u && u.uid &&
              !isPurgedUser(u) &&
              !isDeletedUid(u.uid) &&
              (!u.email || !isDeletedUid(u.email)) &&
              (!u.email || !PURGED_DEMO_EMAILS.includes(u.email.toLowerCase().trim()))
            );
            // Ensure Super Admin is always present
            if (!candidateUsers.some(u => u.uid === 'user_super_admin' || u.role === 'super_admin')) {
              candidateUsers.unshift(DEFAULT_SUPER_ADMIN);
            }

            // Sanitize contaminated profiles (Lutfi & Siti Sara)
            const sanitizedUsers = candidateUsers.map(u => {
              const normName = normalizeName(u.displayName);
              if (normName.includes('lutfi') || u.role === 'staf_tu') {
                return {
                  ...u,
                  role: 'staf_tu' as UserRole,
                  counselorSpecialization: undefined,
                  extracurricularIds: [],
                  assignedExtracurricularIds: [],
                  extracurricularNames: [],
                  extracurricularName: undefined
                };
              }
              if (normName.includes('siti sara')) {
                const cleanEkskuls = (u.extracurricularIds || []).filter(id => !id.toLowerCase().includes('tari'));
                return {
                  ...u,
                  role: (u.role === 'pembina_ekskul' || u.role === 'coach_ekstrakurikuler') ? 'wali_kelas' as UserRole : u.role,
                  extracurricularIds: cleanEkskuls,
                  assignedExtracurricularIds: cleanEkskuls,
                  extracurricularNames: cleanEkskuls,
                  extracurricularName: cleanEkskuls.length > 0 ? u.extracurricularName : undefined
                };
              }
              return u;
            });

            const deduplicated = deduplicateUsersList(sanitizedUsers);
            const sorted = sortUsersByHierarchy(deduplicated);
            try {
              localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(sorted));
            } catch (e) {}
            return sorted;
          });
        }
      }, (err) => {
        console.warn('Users collection listener notice:', err);
      });
    } catch (e) {
      console.warn('Failed to attach users listener:', e);
    }

    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Authentication state: Preserves session across reloads within active browser session
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_USER_KEY) || localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.uid && !isDeletedUid(parsed.uid)) {
          return normalizeUserProfile(parsed);
        }
      }
    } catch {}
    return null;
  });
  const [bootstrapState, setBootstrapState] = useState<AuthBootstrapState>('AUTH_LOADING');
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Track if current session is an admin simulating another role (Uji Coba Tampilan Peran oleh Admin)
  const [adminImpersonator, setAdminImpersonator] = useState<UserProfile | null>(() => {
    try {
      const saved = sessionStorage.getItem('sim_admin_impersonator');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.role === 'super_admin') {
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  const isSimulatedFromAdmin = Boolean(adminImpersonator && adminImpersonator.role === 'super_admin');

  // Sync active user to sessionStorage and localStorage without wiping on initial render
  useEffect(() => {
    if (currentUser) {
      try {
        sessionStorage.setItem(SESSION_STORAGE_USER_KEY, JSON.stringify(currentUser));
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(currentUser));
      } catch {}
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(allUsers));
    } catch {}
  }, [allUsers]);

  // Firebase Authentication Single Source of Truth
  // Lifecycle: AUTH_LOADING -> PROFILE_LOADING -> READY / PROFILE_UNREGISTERED / ERROR / OFFLINE
  useEffect(() => {
    setBootstrapState('AUTH_LOADING');

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        // If Firebase Auth instance has no user yet, check if we have a valid logged in session user in storage
        let existingSessionUser: UserProfile | null = null;
        try {
          const saved = sessionStorage.getItem(SESSION_STORAGE_USER_KEY) || localStorage.getItem(LOCAL_STORAGE_USER_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.uid && !isDeletedUid(parsed.uid)) {
              existingSessionUser = normalizeUserProfile(parsed);
            }
          }
        } catch {}

        if (existingSessionUser) {
          setCurrentUser(existingSessionUser);
          setBootstrapState('READY');
          setBootstrapError(null);
          setIsLoading(false);
          if (!auth.currentUser) {
            signInAnonymously(auth).catch(() => {});
          }
          return;
        }

        setCurrentUser(null);
        setAdminImpersonator(null);
        setBootstrapState('READY');
        setBootstrapError(null);
        setIsLoading(false);
        if (!auth.currentUser) {
          signInAnonymously(auth).catch(() => {});
        }
        return;
      }

      setBootstrapState('PROFILE_LOADING');
      setBootstrapError(null);

      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const raw = userDoc.data() as UserProfile;
          const normalized = normalizeUserProfile({
            ...raw,
            uid: fbUser.uid,
            email: raw.email || fbUser.email || ''
          });

          if (!normalized.canonicalRole) {
            setCurrentUser(null);
            setBootstrapState('ERROR');
            setBootstrapError('Peran akun (role) tidak terdaftar secara sah dalam sistem SIM-KESISWAAN.');
            return;
          }

          const isSuperAdminAccount = normalized.role === 'super_admin' || normalized.uid === 'user_super_admin' || (normalized.email && normalized.email.toLowerCase() === 'puputbajuri24@gmail.com');
          const isAccountActive = isSuperAdminAccount || (
            normalized.status === 'Aktif' &&
            normalized.isLoginActive !== false &&
            normalized.loginStatus !== 'pending_activation' &&
            normalized.accountStatus !== 'pending'
          );

          if (!isAccountActive) {
            await fbSignOut(auth);
            setCurrentUser(null);
            setBootstrapState('ERROR');
            setBootstrapError('Akun login Anda belum aktif atau dinonaktifkan oleh Administrator Madrasah. Hanya akun yang aktif di cPanel yang dapat masuk ke sistem.');
            return;
          }

          setCurrentUser(normalized);
          setBootstrapState('READY');
          setBootstrapError(null);
        } else {
          // If the authenticated user is the designated Super Admin (puputbajuri24@gmail.com),
          const cleanEmail = (fbUser.email || '').toLowerCase().trim();
          const isSuperAdminEmail =
            cleanEmail === 'puputbajuri24@gmail.com' ||
            cleanEmail === 'admin@madrasah.sch.id' ||
            cleanEmail === 'admin@man2sbt.sch.id';

          if (isSuperAdminEmail) {
            const superAdminProfile: UserProfile = {
              ...DEFAULT_SUPER_ADMIN,
              uid: 'user_super_admin',
              displayName: fbUser.displayName || DEFAULT_SUPER_ADMIN.displayName,
              email: cleanEmail,
              authUid: fbUser.uid,
              status: 'Aktif',
              isLoginActive: true,
              loginStatus: 'active',
              accountStatus: 'active',
              photoURL: fbUser.photoURL || undefined,
              updatedAt: new Date().toISOString()
            };
            try {
              // Menimpa dokumen asli Super Admin (Single Source of Truth)
              await setDoc(doc(db, 'users', 'user_super_admin'), superAdminProfile, { merge: true });
              if (fbUser.uid !== 'user_super_admin') {
                await setDoc(userDocRef, superAdminProfile, { merge: true }).catch(() => {});
              }
            } catch (createErr) {
              console.warn('Super admin provisioning write warning:', createErr);
            }
            setCurrentUser(normalizeUserProfile(superAdminProfile));
            setBootstrapState('READY');
            setBootstrapError(null);
            return;
          }

          // Check if an existing profile exists with this email or authUid in cPanel users
          let matchedProfile: UserProfile | undefined = allUsers.find(u =>
            (u.email && u.email.toLowerCase().trim() === cleanEmail) ||
            (u.authUid && u.authUid === fbUser.uid)
          );

          if (!matchedProfile) {
            try {
              const uSnap = await getDocs(collection(db, 'users'));
              for (const d of uSnap.docs) {
                const u = { ...d.data(), uid: d.id } as UserProfile;
                if ((u.email && u.email.toLowerCase().trim() === cleanEmail) || u.authUid === fbUser.uid) {
                  matchedProfile = u;
                  break;
                }
              }
            } catch (uErr) {
              console.warn('Firestore lookup in onAuthStateChanged note:', uErr);
            }
          }

          if (matchedProfile) {
            const isSuperAcc = matchedProfile.role === 'super_admin' || matchedProfile.uid === 'user_super_admin';
            const isProfileActive = isSuperAcc || (
              matchedProfile.status === 'Aktif' &&
              matchedProfile.isLoginActive !== false &&
              matchedProfile.loginStatus !== 'pending_activation' &&
              matchedProfile.accountStatus !== 'pending'
            );

            if (!isProfileActive) {
              await fbSignOut(auth);
              setCurrentUser(null);
              setBootstrapState('ERROR');
              setBootstrapError('Akun login Anda belum aktif atau dinonaktifkan oleh Administrator. Hanya akun yang aktif di cPanel yang diizinkan masuk.');
              return;
            }

            const canonicalUid = matchedProfile.uid;
            const updatedProfile: UserProfile = {
              ...matchedProfile,
              uid: canonicalUid,
              displayName: matchedProfile.displayName || fbUser.displayName || cleanEmail,
              email: cleanEmail,
              authUid: fbUser.uid,
              updatedAt: new Date().toISOString()
            };
            try {
              // Menimpa dokumen asli yang sah di Firestore, BUKAN membuat dokumen ID baru
              await setDoc(doc(db, 'users', canonicalUid), updatedProfile, { merge: true });
              if (fbUser.uid !== canonicalUid) {
                await setDoc(userDocRef, updatedProfile, { merge: true }).catch(() => {});
              }
            } catch (createErr) {
              console.warn('User profile update write warning:', createErr);
            }
            setCurrentUser(normalizeUserProfile(updatedProfile));
            setBootstrapState('READY');
            setBootstrapError(null);
            return;
          }

          // TIDAK ADA AUTO-CREATION DARI TEACHERS!
          // Sesuai aturan sistem: ID hanya dibuat jika admin yang input data guru dan admin yang membuat akses untuk akun login di cPanel.
          await fbSignOut(auth);
          setCurrentUser(null);
          setBootstrapState('PROFILE_UNREGISTERED');
          setBootstrapError(
            `Akun (${fbUser.email || fbUser.uid}) belum diaktifkan oleh Administrator di cPanel SIM-KESISWAAN. Hanya akun yang telah dibuatkan akses dan diaktifkan di cPanel yang dapat masuk.`
          );
        }
      } catch (err: any) {
        if (isPermissionError(err)) {
          console.warn('[Firestore Profile Verification Notice]', err?.message || err);
        } else {
          console.error('Firestore user profile verification error:', err);
        }
        if (err?.message?.includes('offline') || !navigator.onLine) {
          setBootstrapState('OFFLINE');
          setBootstrapError('Koneksi internet terputus. Tidak dapat memverifikasi profil pengguna dari server Firestore.');
        } else {
          setBootstrapState('READY');
          setBootstrapError(null);
        }
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithUser = (user: UserProfile) => {
    setIsLoading(true);
    // Jika Administrator saat ini sedang membuka uji tampilan peran lain, simpan sesi aslinya
    if (currentUser?.role === 'super_admin' && user.role !== 'super_admin') {
      setAdminImpersonator(currentUser);
      try {
        sessionStorage.setItem('sim_admin_impersonator', JSON.stringify(currentUser));
      } catch {}
    }
    const updatedUser = { ...user, lastLogin: new Date().toISOString() };
    setCurrentUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.uid === user.uid ? updatedUser : u));
    recordSystemAuditLog('LOGIN_SWITCH', 'Autentikasi & Akun', `Beralih sesi aktif ke akun: ${user.displayName} (${user.role.toUpperCase()})`, user);
    setIsLoading(false);
  };

  const loginWithDemoRole = (role: UserRole, customUid?: string) => {
    // Pembatasan Ketat: Tiadakan fitur kembali ke administrator untuk semua guru pembina dan guru BK, kecuali admin
    const isRestrictedRole = currentUser && ['guru_bk', 'pembina', 'pembina_ekskul', 'pembina_osim', 'pengurus_osim'].includes(currentUser.role);
    if (role === 'super_admin' && isRestrictedRole && !isSimulatedFromAdmin) {
      console.warn('Akses ditolak: Fitur kembali ke Administrator dinonaktifkan untuk peran Guru Pembina, Guru BK, dan Pengurus OSIM.');
      return;
    }

    setIsLoading(true);

    // Jika Super Admin beralih ke peran lain untuk simulasi, simpan sesi admin
    if (currentUser?.role === 'super_admin' && role !== 'super_admin') {
      setAdminImpersonator(currentUser);
      try {
        sessionStorage.setItem('sim_admin_impersonator', JSON.stringify(currentUser));
      } catch {}
    }

    // Jika kembali ke Administrator dari sesi simulasi admin yang sah
    if (role === 'super_admin' && adminImpersonator) {
      const restoredAdmin = { ...adminImpersonator, lastLogin: new Date().toISOString() };
      setCurrentUser(restoredAdmin);
      setAdminImpersonator(null);
      try {
        sessionStorage.removeItem('sim_admin_impersonator');
      } catch {}
      recordSystemAuditLog('LOGIN_ROLE', 'Autentikasi & Akun', `Admin kembali ke sesi Administrator dari mode simulasi peran`, restoredAdmin);
      setIsLoading(false);
      return;
    }

    let target = allUsers.find(u => customUid ? u.uid === customUid : u.role === role);
    if (!target) {
      target = DEMO_USERS.find(u => customUid ? u.uid === customUid : u.role === role);
    }
    
    if (!target) {
      // If no dedicated account exists for this role yet, switch active session temporarily for UI simulation
      // without polluting allUsers or localStorage with fake accounts
      const simRoleName = role === 'super_admin' ? 'Administrator' :
                          role === 'waka_kesiswaan' ? 'Waka Kesiswaan' :
                          role === 'guru_bk' ? 'Guru BK' :
                          role === 'pembina_osim' ? 'Pembina OSIM' :
                          role === 'pembina_ekskul' || role === 'pembina' || role === 'coach_ekstrakurikuler' ? 'Pembina Ekstrakurikuler' :
                          role === 'wali_kelas' || (role as string) === 'homeroom_teacher' ? 'Wali Kelas' :
                          role === 'guru' || (role as string) === 'teacher' || (role as string) === 'guru_mapel' ? 'Guru Mata Pelajaran' : role;
      const simUser: UserProfile = {
        uid: `sim_${role}`,
        displayName: `Mode Uji Tampilan (${simRoleName})`,
        email: `${role}@sekolah.sch.id`,
        username: role,
        role: role,
        status: 'Aktif',
        lastLogin: new Date().toISOString()
      };
      setCurrentUser(simUser);
      recordSystemAuditLog('LOGIN_ROLE', 'Autentikasi & Akun', `Uji coba simulasi tampilan peran: ${role.toUpperCase()}`, simUser);
      setIsLoading(false);
      return;
    }

    const updatedUser = { ...target, lastLogin: new Date().toISOString() };
    setCurrentUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.uid === updatedUser.uid ? updatedUser : u));
    recordSystemAuditLog('LOGIN_ROLE', 'Autentikasi & Akun', `Masuk menggunakan peran: ${role.toUpperCase()} (${updatedUser.displayName})`, updatedUser);
    setIsLoading(false);
  };

  const returnToAdminSession = () => {
    if (!isSimulatedFromAdmin && currentUser?.role !== 'super_admin') {
      console.warn('Akses ditolak: Hanya sesi simulasi admin yang dapat kembali ke administrator.');
      return;
    }
    const targetAdmin = adminImpersonator || allUsers.find(u => u.role === 'super_admin') || DEMO_USERS[0];
    const restored = { ...targetAdmin, lastLogin: new Date().toISOString() };
    setCurrentUser(restored);
    setAdminImpersonator(null);
    try {
      sessionStorage.removeItem('sim_admin_impersonator');
    } catch {}
    recordSystemAuditLog('ADMIN_RETURN', 'Autentikasi & Akun', `Kembali ke sesi Administrator dari mode pengujian peran`, restored);
  };

  const loginWithIdentifier = async (identifier: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!cleanId) {
      setIsLoading(false);
      return { success: false, error: 'Silakan masukkan Email, Username, NIP, atau NIS.' };
    }
    if (!cleanPass) {
      setIsLoading(false);
      return { success: false, error: 'Silakan masukkan kata sandi akun Anda.' };
    }

    let targetEmail: string | null = null;
    let matchedUser: UserProfile | undefined = undefined;

    if (cleanId.includes('@')) {
      targetEmail = cleanId;
      matchedUser = allUsers.find(u => u.email && u.email.toLowerCase().trim() === cleanId);
      if (!matchedUser) {
        try {
          const snap = await getDocs(collection(db, 'users'));
          for (const d of snap.docs) {
            const u = { ...d.data(), uid: d.id } as UserProfile;
            if (u.email && u.email.toLowerCase().trim() === cleanId) {
              matchedUser = u;
              break;
            }
          }
        } catch (e) {
          console.warn('Firestore user lookup by email note:', e);
        }
      }
    } else {
      // 1. Cari identitas terdaftar di allUsers memori atau koleksi users Firestore
      const normalizedId = cleanId.startsWith('@') ? cleanId.substring(1) : cleanId;
      const cleanDigitsId = cleanId.replace(/[^0-9a-zA-Z]/g, '');

      // Check allUsers in memory
      matchedUser = allUsers.find(u => {
        if (!u.email) return false;
        if (u.username && (u.username.toLowerCase() === cleanId || u.username.toLowerCase() === normalizedId)) return true;
        const uNipDigits = (u.nip || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
        if (uNipDigits && (uNipDigits === cleanDigitsId || (cleanDigitsId.length >= 6 && uNipDigits.startsWith(cleanDigitsId.substring(0, 6))))) return true;
        if (u.studentNis && (u.studentNis.toLowerCase() === cleanId || u.studentNis.toLowerCase() === cleanDigitsId)) return true;
        if (u.displayName && u.displayName.toLowerCase() === cleanId) return true;
        if (cleanId === 'admin' && u.role === 'super_admin') return true;
        return false;
      });

      // If not found in memory, query Firestore users directly
      if (!matchedUser) {
        try {
          const snap = await getDocs(collection(db, 'users'));
          if (!snap.empty) {
            for (const d of snap.docs) {
              const u = { ...d.data(), uid: d.id } as UserProfile;
              if (!u.email) continue;
              if (u.username && (u.username.toLowerCase() === cleanId || u.username.toLowerCase() === normalizedId)) {
                matchedUser = u;
                break;
              }
              const uNipDigits = (u.nip || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
              if (uNipDigits && (uNipDigits === cleanDigitsId || (cleanDigitsId.length >= 6 && uNipDigits.startsWith(cleanDigitsId.substring(0, 6))))) {
                matchedUser = u;
                break;
              }
              if (u.studentNis && (u.studentNis.toLowerCase() === cleanId || u.studentNis.toLowerCase() === cleanDigitsId)) {
                matchedUser = u;
                break;
              }
              if (cleanId === 'admin' && u.role === 'super_admin') {
                matchedUser = u;
                break;
              }
            }
          }
        } catch (e) {
          console.warn('Firestore user lookup error:', e);
        }
      }

      if (matchedUser && matchedUser.email) {
        targetEmail = matchedUser.email.trim().toLowerCase();
      }

      // Explicit Super Admin alias fallback
      if (!targetEmail && (cleanId === 'admin' || cleanId === 'superadmin' || cleanId === 'super_admin')) {
        targetEmail = DEFAULT_SUPER_ADMIN.email || 'puputbajuri24@gmail.com';
      }
    }

    // STRICT CHECK 1: Identitas pengguna wajib terdaftar di cPanel
    const isSuperAdminAlias = cleanId === 'admin' || cleanId === 'superadmin' || cleanId === 'super_admin' || targetEmail === 'puputbajuri24@gmail.com';
    if (!matchedUser && !isSuperAdminAlias) {
      setIsLoading(false);
      recordSystemAuditLog('LOGIN_FAILED', 'Keamanan Sistem', `Percobaan login ditolak: Identitas "${identifier}" tidak terdaftar di cPanel.`);
      return {
        success: false,
        error: 'Identitas pengguna (Email/Username/NIP/NIS) belum terdaftar dalam sistem SIM-KESISWAAN. Akun login hanya dapat dibuat oleh Administrator melalui menu cPanel.'
      };
    }

    if (!targetEmail) {
      targetEmail = matchedUser?.email ? matchedUser.email.trim().toLowerCase() : (isSuperAdminAlias ? (DEFAULT_SUPER_ADMIN.email || 'puputbajuri24@gmail.com') : null);
    }

    if (!targetEmail) {
      setIsLoading(false);
      recordSystemAuditLog('LOGIN_FAILED', 'Keamanan Sistem', `Percobaan login gagal: Identitas ${identifier} belum memiliki email terdaftar.`);
      return {
        success: false,
        error: 'Identitas pengguna belum terdaftar dengan email valid dalam sistem SIM-KESISWAAN. Hubungi Administrator.'
      };
    }

    // STRICT CHECK 2: Hanya akun yang aktif di cPanel yang bisa login, selain itu ditolak!
    const isSuperAdminAccount = matchedUser?.role === 'super_admin' || matchedUser?.uid === 'user_super_admin' || targetEmail === 'puputbajuri24@gmail.com';
    const isAccountActiveInCPanel =
      isSuperAdminAccount || (
        matchedUser &&
        matchedUser.status === 'Aktif' &&
        matchedUser.isLoginActive !== false &&
        matchedUser.loginStatus !== 'pending_activation' &&
        matchedUser.accountStatus !== 'pending'
      );

    if (!isAccountActiveInCPanel) {
      setIsLoading(false);
      await fbSignOut(auth).catch(() => {});
      recordSystemAuditLog(
        'LOGIN_FAILED_BLOCKED',
        'Keamanan Sistem',
        `Percobaan login ditolak: Akun ${matchedUser?.displayName || identifier} (${targetEmail}) belum aktif di cPanel.`,
        matchedUser
      );
      return {
        success: false,
        error: 'Akun login Anda belum aktif atau dinonaktifkan oleh Administrator Madrasah. Sesuai kebijakan madrasah, hanya akun yang aktif di cPanel yang diizinkan masuk ke sistem.'
      };
    }

    // STRICT CHECK 3: Password check against latest data in cPanel (data lama ditimpa data terbaru)
    if (matchedUser && matchedUser.password && matchedUser.password.trim() && matchedUser.password.trim() !== cleanPass) {
      setIsLoading(false);
      recordSystemAuditLog(
        'LOGIN_FAILED_PASSWORD',
        'Keamanan Sistem',
        `Percobaan login gagal: Password salah untuk akun ${matchedUser.displayName} (${matchedUser.email})`,
        matchedUser
      );
      return {
        success: false,
        error: 'Kata sandi yang Anda masukkan salah. Gunakan kata sandi terbaru yang telah diatur oleh Administrator di cPanel.'
      };
    }

    // WAJIB 1: Pure Firebase Authentication Engine with Auto-Provisioning & Dual-Layer Resilience
    try {
      let res: any;
      try {
        res = await signInWithEmailAndPassword(auth, targetEmail, cleanPass);
      } catch (fbErr: any) {
        let authSuccess = false;
        // Handle case where user is not found in Firebase Auth yet, auto-provision
        if ((fbErr?.code === 'auth/user-not-found' || fbErr?.code === 'auth/invalid-credential') && (!matchedUser?.password || matchedUser.password === cleanPass)) {
          try {
            res = await createUserWithEmailAndPassword(auth, targetEmail, cleanPass);
            authSuccess = true;
          } catch (createErr: any) {
            // Already exists or creation restricted
          }
        }

        // If credentials match verified profile in database (updated by Admin in CPanel)
        if (!authSuccess && !res && matchedUser && matchedUser.password && matchedUser.password === cleanPass) {
          // Fase 2 Auto-Reconciliation: Attempt signing in with previous/default passwords and updating Firebase Auth
          const candidateOldPasswords = [
            matchedUser.previousPassword,
            'guru12345',
            'osim12345',
            'password',
            'password123',
            '123456',
            matchedUser.nip ? cleanDigits(matchedUser.nip) : undefined
          ].filter((p): p is string => Boolean(p && p.trim() && p !== cleanPass));

          for (const oldP of candidateOldPasswords) {
            try {
              const oldCred = await signInWithEmailAndPassword(auth, targetEmail, oldP);
              if (oldCred?.user) {
                try {
                  await updatePassword(oldCred.user, cleanPass);
                  console.info('Firebase Auth password berhasil direkonsiliasi otomatis ke password baru saat login.');
                } catch (updatePassErr) {
                  console.warn('Rekonsiliasi updatePassword note:', updatePassErr);
                }
                res = oldCred;
                authSuccess = true;
                break;
              }
            } catch {}
          }

          if (!authSuccess && !res) {
            try {
              const anonRes = await signInAnonymously(auth);
              res = { user: { ...anonRes.user, email: targetEmail, displayName: matchedUser.displayName } };
            } catch (anonErr) {
              // Direct verified user profile session
              const localSessionUser: UserProfile = {
                ...matchedUser,
                lastLogin: new Date().toISOString()
              };
              setCurrentUser(normalizeUserProfile(localSessionUser));
              setIsLoading(false);
              recordSystemAuditLog('LOGIN_SUCCESS', 'Autentikasi Akun', `Masuk berhasil menggunakan akun terkelola: ${matchedUser.displayName} (${matchedUser.email})`, localSessionUser);
              return { success: true };
            }
          }
        }

        if (!authSuccess && !res) {
          throw fbErr;
        }
      }

      // Resolusi UID rapi terstandar (Single Source of Truth, tidak pernah membuat ID acak)
      const cleanUserEmail = (res.user.email || targetEmail || '').toLowerCase().trim();
      const isSuperAdminEmail =
        cleanUserEmail === 'puputbajuri24@gmail.com' ||
        cleanUserEmail === 'admin@madrasah.sch.id' ||
        cleanUserEmail === 'admin@man2sbt.sch.id';

      const canonicalUid = isSuperAdminEmail
        ? 'user_super_admin'
        : (matchedUser?.uid && isStandardTidyUid(matchedUser.uid) && !isRandomOrLegacyArtifactUid(matchedUser.uid)
            ? matchedUser.uid
            : resolveTidyUidForUser(matchedUser || { email: cleanUserEmail }));

      const canonicalDocRef = doc(db, 'users', canonicalUid);
      let userDoc = await getDoc(canonicalDocRef);

      if (!userDoc.exists()) {
        if (isSuperAdminEmail) {
          const superAdminProfile: UserProfile = {
            ...DEFAULT_SUPER_ADMIN,
            uid: 'user_super_admin',
            displayName: res.user.displayName || DEFAULT_SUPER_ADMIN.displayName,
            email: cleanUserEmail,
            authUid: res.user.uid,
            status: 'Aktif',
            isLoginActive: true,
            loginStatus: 'active',
            accountStatus: 'active',
            photoURL: res.user.photoURL || undefined,
            updatedAt: new Date().toISOString()
          };
          try {
            await setDoc(doc(db, 'users', 'user_super_admin'), superAdminProfile, { merge: true });
            userDoc = await getDoc(doc(db, 'users', 'user_super_admin'));
            if (res.user.uid !== 'user_super_admin') {
              deleteDoc(doc(db, 'users', res.user.uid)).catch(() => {});
            }
          } catch (createErr) {
            console.warn('Super admin provisioning write warning:', createErr);
          }
        } else if (matchedUser) {
          const updatedProfile: UserProfile = {
            ...matchedUser,
            uid: canonicalUid,
            displayName: matchedUser.displayName || res.user.displayName || cleanUserEmail,
            email: cleanUserEmail,
            authUid: res.user.uid,
            status: 'Aktif',
            isLoginActive: true,
            loginStatus: 'active',
            accountStatus: 'active',
            updatedAt: new Date().toISOString()
          };
          try {
            await setDoc(canonicalDocRef, updatedProfile, { merge: true });
            userDoc = await getDoc(canonicalDocRef);
            if (res.user.uid !== canonicalUid) {
              deleteDoc(doc(db, 'users', res.user.uid)).catch(() => {});
            }
          } catch (createErr) {
            console.warn('User profile sync write warning:', createErr);
          }
        }
      } else {
        // Dokumen rapi sudah ada: perbarui authUid & lastLogin tanpa merusak UID rapi
        if (res?.user?.uid) {
          try {
            await setDoc(canonicalDocRef, {
              authUid: res.user.uid,
              lastLogin: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, { merge: true });
            if (res.user.uid !== canonicalUid) {
              deleteDoc(doc(db, 'users', res.user.uid)).catch(() => {});
            }
          } catch (updateErr) {
            console.warn('AuthUid sync note:', updateErr);
          }
        }
      }

      if (!userDoc.exists()) {
        await fbSignOut(auth);
        setCurrentUser(null);
        setBootstrapState('PROFILE_UNREGISTERED');
        const unregMsg = `Akun Anda belum memiliki dokumen profil aktif di SIM-KESISWAAN. Hubungi Administrator untuk mengaktifkan akun di menu cPanel.`;
        setBootstrapError(unregMsg);
        setIsLoading(false);
        return { success: false, error: unregMsg };
      }

      const rawProfile = userDoc.data() as UserProfile;
      const normalizedUser = normalizeUserProfile({
        ...rawProfile,
        uid: canonicalUid,
        email: rawProfile.email || res.user.email || targetEmail
      });

      if (!normalizedUser.canonicalRole) {
        await fbSignOut(auth);
        setCurrentUser(null);
        setBootstrapState('ERROR');
        setBootstrapError('Peran pengguna tidak valid dalam konfigurasi SIM-KESISWAAN.');
        setIsLoading(false);
        return { success: false, error: 'Peran akun tidak sah dalam konfigurasi SIM-KESISWAAN.' };
      }

      if (normalizedUser.status === 'Nonaktif') {
        await fbSignOut(auth);
        setCurrentUser(null);
        setIsLoading(false);
        recordSystemAuditLog('LOGIN_FAILED_BLOCKED', 'Keamanan Sistem', `Percobaan login akun dinonaktifkan: ${normalizedUser.displayName}`, normalizedUser);
        return { success: false, error: 'Akun Anda dinonaktifkan oleh Administrator. Hubungi Proktor / Super Admin.' };
      }

      setAdminImpersonator(null);
      try {
        sessionStorage.removeItem('sim_admin_impersonator');
      } catch {}

      const updated = { ...normalizedUser, lastLogin: new Date().toISOString() };
      setCurrentUser(updated);
      setBootstrapState('READY');
      setBootstrapError(null);
      setIsLoading(false);

      // Record update to lastLogin on Firestore and synchronize password
      const syncPayload: any = { lastLogin: updated.lastLogin };
      if (cleanPass) {
        syncPayload.password = cleanPass;
      }
      setDoc(canonicalDocRef, syncPayload, { merge: true }).catch(() => {});

      recordSystemAuditLog(
        'LOGIN_SUCCESS',
        'Autentikasi & Keamanan',
        `Pengguna ${updated.displayName} (${updated.role.toUpperCase()}) berhasil masuk via Firebase Authentication`,
        updated
      );

      return { success: true };
    } catch (fbErr: any) {
      setIsLoading(false);
      console.warn('Firebase signIn notice:', fbErr);

      let errorMsg = 'Identitas atau kata sandi yang Anda masukkan tidak cocok.';
      if (fbErr?.code === 'auth/wrong-password' || fbErr?.code === 'auth/invalid-credential') {
        errorMsg = 'Kata sandi atau identitas yang Anda masukkan salah.';
      } else if (fbErr?.code === 'auth/user-not-found') {
        errorMsg = 'Akun pengguna belum terdaftar di Firebase Authentication. Hubungi Administrator.';
      } else if (fbErr?.code === 'auth/user-disabled') {
        errorMsg = 'Akun telah dinonaktifkan di Firebase Authentication.';
      } else if (fbErr?.code === 'auth/too-many-requests') {
        errorMsg = 'Terlalu banyak percobaan masuk yang gagal. Silakan tunggu beberapa saat lagi.';
      } else if (fbErr?.code === 'auth/network-request-failed') {
        errorMsg = 'Gagal terhubung ke server Firebase. Periksa jaringan internet Anda.';
      }

      recordSystemAuditLog(
        'LOGIN_FAILED',
        'Keamanan Sistem',
        `Percobaan login gagal untuk identitas: ${identifier} (${fbErr?.code || 'auth_error'})`
      );

      return { success: false, error: errorMsg };
    }
  };

  const loginWithEmail = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    return loginWithIdentifier(email, pass);
  };

  const logout = async () => {
    if (currentUser) {
      recordSystemAuditLog(
        'LOGOUT',
        'Autentikasi & Keamanan',
        `Pengguna ${currentUser.displayName} (${currentUser.role.toUpperCase()}) telah keluar dari sistem (Logout)`,
        currentUser
      ).catch(() => {});
    }
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Firebase signOut error:', e);
    }
    setAdminImpersonator(null);
    try {
      sessionStorage.removeItem('sim_admin_impersonator');
      sessionStorage.removeItem(SESSION_STORAGE_USER_KEY);
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      localStorage.removeItem('simkesiswaan_active_tab');
      localStorage.removeItem('sim_last_activity');
    } catch {}
    setIsIdleWarningOpen(false);
    setCurrentUser(null);
    setBootstrapState('READY');
    setBootstrapError(null);
  };

  // =========================================================================
  // FITUR IDLE TIMEOUT & MODAL PERINGATAN (30 MENIT & 1 MENIT PERINGATAN)
  // =========================================================================
  const [isIdleWarningOpen, setIsIdleWarningOpen] = useState(false);
  const [idleCountdownSeconds, setIdleCountdownSeconds] = useState(60);
  const lastActivityRef = useRef<number>(Date.now());
  const lastThrottleRef = useRef<number>(0);
  const isIdleWarningOpenRef = useRef<boolean>(false);
  isIdleWarningOpenRef.current = isIdleWarningOpen;

  const extendSession = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIsIdleWarningOpen(false);
    setIdleCountdownSeconds(60);
    try {
      localStorage.setItem('sim_last_activity', String(Date.now()));
    } catch {}
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setIsIdleWarningOpen(false);
      return;
    }

    // Inisialisasi awal waktu aktivitas saat login / mount
    const initialTime = Date.now();
    lastActivityRef.current = initialTime;
    try {
      localStorage.setItem('sim_last_activity', String(initialTime));
    } catch {}

    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle minimal 1 detik untuk efisiensi performa browser
      if (now - lastThrottleRef.current > 1000) {
        lastThrottleRef.current = now;
        // Hanya reset otomatis jika modal peringatan belum muncul
        // Jika modal peringatan sudah muncul, pengguna harus klik tombol 'Perpanjang Sesi'
        if (!isIdleWarningOpenRef.current) {
          lastActivityRef.current = now;
          try {
            localStorage.setItem('sim_last_activity', String(now));
          } catch {}
        }
      }
    };

    // Events untuk mendeteksi interaksi pengguna: mousedown, keydown, touchstart, dan scroll
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach(evt => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Timer interval checker setiap 1 detik
    const timerInterval = setInterval(() => {
      // Sinkronisasi lintas tab browser via localStorage
      try {
        const stored = localStorage.getItem('sim_last_activity');
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed) && parsed > lastActivityRef.current) {
            lastActivityRef.current = parsed;
          }
        }
      } catch {}

      const now = Date.now();
      const elapsed = now - lastActivityRef.current;

      if (elapsed >= IDLE_TIMEOUT_MS) {
        // Durasi 30 menit penuh telah habis: lakukan auto logout
        setIsIdleWarningOpen(false);
        recordSystemAuditLog(
          'AUTO_LOGOUT_IDLE',
          'Keamanan & Sesi',
          `Sesi login ${currentUser.displayName} (${currentUser.role.toUpperCase()}) telah berakhir otomatis karena tidak aktif selama 30 menit (Idle Timeout)`,
          currentUser
        ).catch(() => {});
        logout();
      } else if (elapsed >= IDLE_TIMEOUT_MS - IDLE_WARNING_MS) {
        // Berada di rentang 1 menit terakhir (fase peringatan 60 detik)
        const remainingMs = IDLE_TIMEOUT_MS - elapsed;
        const remainingSec = Math.max(1, Math.ceil(remainingMs / 1000));
        setIdleCountdownSeconds(remainingSec);
        setIsIdleWarningOpen(true);
      } else {
        if (isIdleWarningOpenRef.current) {
          setIsIdleWarningOpen(false);
        }
      }
    }, 1000);

    return () => {
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, handleUserActivity);
      });
      clearInterval(timerInterval);
    };
  }, [currentUser]);

  const updateProfileState = (updated: Partial<UserProfile>) => {
    if (!currentUser) return;
    const next = { ...currentUser, ...updated, updatedAt: new Date().toISOString() };
    setCurrentUser(next);
    try {
      sessionStorage.setItem(SESSION_STORAGE_USER_KEY, JSON.stringify(next));
    } catch {}
    setAllUsers(prev => {
      const nextList = prev.map(u => u.uid === next.uid ? next : u);
      localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(nextList));
      return nextList;
    });
    try {
      setDoc(doc(db, 'users', next.uid), updated, { merge: true }).catch(() => {});
    } catch (e) {}
    recordSystemAuditLog('UPDATE_SELF_PROFILE', 'Profil Akun', `Pengguna ${next.displayName} memperbarui informasi profil mandiri`, next);
  };

  // cPanel User Provisioning methods (Solusi A: Terkelola Langsung dari App & Sinkronisasi Firebase Auth)
  const addUser = async (user: UserProfile): Promise<{ success: boolean; error?: string }> => {
    try {
      // 0. KEAMANAN & OTORISASI PEMBUATAN AKUN
      const isAdminActor = currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role);
      const isSuperAdminActor = currentUser && (currentUser.role === 'super_admin' || currentUser.uid === 'user_super_admin');

      if (!isAdminActor) {
        return {
          success: false,
          error: 'Akses ditolak: Hanya Administrator atau Waka Kesiswaan yang berhak membuat akun pengguna baru.'
        };
      }

      if (user.role === 'super_admin' && !isSuperAdminActor) {
        return {
          success: false,
          error: 'Akses ditolak: Hanya Super Admin utama yang berhak membuat akun dengan hak Super Admin.'
        };
      }

      const cleanNewNip = cleanDigits(user.nip);
      const cleanNewEmail = user.email ? user.email.trim().toLowerCase() : '';

      if (!user.email || user.email.trim() === '') {
        return { success: false, error: 'Email akun wajib diisi untuk pendaftaran login.' };
      }

      // Cek apakah sudah ada akun dengan email yang sama (DEDUPLICATION & REPLACE)
      // "jika terdapat email yang sama maka jangan buat id baru, cukup di timpa/replace dengan data yang terbaru"
      const existingUserByEmail = allUsers.find(u => cleanNewEmail && u.email && u.email.trim().toLowerCase() === cleanNewEmail);
      
      let assignedUid = user.uid && user.uid.trim() !== '' ? user.uid.trim() : (user.username ? `user_${user.username}` : `user_guru_${cleanDigits(user.nip || '') || '01'}`);
      if (existingUserByEmail) {
        // Gunakan UID yang sudah ada agar tidak terjadi penumpukan ID berbeda untuk email yang sama
        assignedUid = existingUserByEmail.uid;
      }

      const initialPassword = (user.password || 'password').trim();
      let firebaseAuthUid: string | undefined = existingUserByEmail?.authUid;

      // Synchronize creation with Firebase Authentication using Secondary Auth instance
      try {
        const secAuth = getSecondaryAuth();
        const cred = await createUserWithEmailAndPassword(secAuth, user.email.trim(), initialPassword);
        if (cred?.user?.uid) {
          firebaseAuthUid = cred.user.uid;
        }
        await fbSignOut(secAuth);
      } catch (authErr: any) {
        if (authErr?.code === 'auth/email-already-in-use') {
          console.log('Firebase Auth account already exists for this email, reconciling credentials.');
          try {
            const secAuth = getSecondaryAuth();
            for (const testP of ['password', 'password123', '123456']) {
              try {
                const cred = await signInWithEmailAndPassword(secAuth, user.email.trim(), testP);
                if (cred.user) {
                  await updatePassword(cred.user, initialPassword);
                  firebaseAuthUid = cred.user.uid;
                  break;
                }
              } catch {}
            }
            await fbSignOut(secAuth);
          } catch {}
        } else {
          console.warn('Firebase Auth user creation note:', authErr?.message || authErr);
        }
      }

      const canonicalRole = normalizeUserRole(user.role) || user.role;
      const canonicalEkskuls = canonicalizeAssignedEkskulIds(user.assignedExtracurricularIds || user.extracurricularIds);

      const newUser: UserProfile = {
        ...user,
        uid: assignedUid,
        password: initialPassword,
        role: canonicalRole,
        assignedExtracurricularIds: canonicalEkskuls,
        status: user.status || 'Aktif',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const valRes = validatePayload(userProfileSchema, newUser);
      if (!valRes.success) {
        console.warn('[Schema Guard] Peringatan validasi profil pengguna:', valRes.errors);
      }

      removeDeletedUid(newUser.uid);
      if (newUser.uid.startsWith('user_')) {
        removeDeletedUid(newUser.uid.replace(/^user_/, ''));
      }
      if (newUser.email) {
        removeDeletedUid(newUser.email.trim().toLowerCase());
      }
      if (newUser.nip) {
        const cleanNip = cleanDigits(newUser.nip);
        if (cleanNip.length >= 6) {
          removeDeletedUid(cleanNip);
          removeDeletedUid(`user_${cleanNip}`);
        }
      }

      setAllUsers(prev => {
        const next = deduplicateUsersList([...prev, newUser]);
        try { localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(next)); } catch {}
        return next;
      });

      try {
        await setDoc(doc(db, 'users', newUser.uid), newUser, { merge: true });
        const potentialAliasUid = newUser.uid.startsWith('user_') ? newUser.uid.replace(/^user_/, '') : `user_${newUser.uid}`;
        if (potentialAliasUid && potentialAliasUid !== newUser.uid) {
          deleteDoc(doc(db, 'users', potentialAliasUid)).catch(() => {});
        }
      } catch (e) {
        console.warn('Firestore addUser sync note:', e);
      }

      recordSystemAuditLog('CREATE_USER', 'Manajemen Pengguna', `Administrator membuat akun baru: ${newUser.displayName} (${newUser.email || newUser.nip}) [${newUser.role.toUpperCase()}]`, currentUser);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Gagal menambahkan akun baru.' };
    }
  };

  // Aktivasi Akun Guru & Pembina melalui cPanel (Solusi Satu Pintu & Anti Penumpukan Email)
  const activateTeacherAccount = async (params: {
    teacherId?: string;
    uid?: string;
    email: string;
    username?: string;
    password?: string;
    fullName: string;
    nip?: string;
    role: CanonicalUserRole | UserRole;
    phone?: string;
    extracurricularIds?: string[];
    extracurricularNames?: string[];
    counselorSpecialization?: string;
    isCashManager?: boolean;
    cashManagerTitle?: string;
  }): Promise<{ success: boolean; user?: UserProfile; error?: string }> => {
    try {
      // 0. KEAMANAN & OTORISASI AKTIVASI AKUN GURU
      const isAdminActor = currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role);
      if (!isAdminActor) {
        return {
          success: false,
          error: 'Akses ditolak: Hanya Administrator atau Waka Kesiswaan yang berhak mengaktifkan akun login guru.'
        };
      }

      const cleanEmail = (params.email || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { success: false, error: 'Email akun wajib diisi dan valid untuk aktivasi login.' };
      }

      const cleanPass = (params.password || 'guru12345').trim();
      const cleanNip = cleanDigits(params.nip);
      const canonicalRole = normalizeUserRole(params.role) || (params.role as CanonicalUserRole) || 'guru';

      // 1. CARI PENGGUNA YANG SUDAH ADA DENGAN EMAIL SAMA (DEDUPLICATION & REPLACE)
      // "dan jika terdapat email yang sama maka jangan buat id baru, cukup di timpa/replace dengan data yang terbaru"
      const existingUserByEmail = allUsers.find(u => u.email && u.email.trim().toLowerCase() === cleanEmail);
      const existingUserByUid = params.uid ? allUsers.find(u => u.uid === params.uid) : undefined;
      const existingUserByTeacherId = params.teacherId ? allUsers.find(u => u.uid === `user_${params.teacherId}` || u.uid === params.teacherId) : undefined;
      const existingRecord = existingUserByEmail || existingUserByUid || existingUserByTeacherId;

      // Standarisasi UID rapi: user_guru_XX (angka murni 2 digit)
      let teacherNumStr = '01';
      if (params.teacherId) {
        const idMatch = params.teacherId.match(/(\d+)/);
        if (idMatch) {
          teacherNumStr = String(parseInt(idMatch[1], 10)).padStart(2, '0');
        }
      } else if (existingRecord?.uid) {
        const numMatch = existingRecord.uid.match(/(\d+)/);
        if (numMatch) {
          teacherNumStr = String(parseInt(numMatch[1], 10)).padStart(2, '0');
        }
      }
      const canonicalTeacherUid = canonicalRole === 'guru_bk' ? 'user_guru_bk' : `user_guru_${teacherNumStr}`;

      const isExistingValidTidy = existingRecord ? isStandardTidyUid(existingRecord.uid) && !isRandomOrLegacyArtifactUid(existingRecord.uid) : false;
      const targetUid = isExistingValidTidy ? existingRecord!.uid : canonicalTeacherUid;

      let resolvedUsername = (params.username || existingRecord?.username || '').trim();
      if (!resolvedUsername) {
        resolvedUsername = cleanNip && cleanNip.length >= 4 ? `guru_${cleanNip}` : cleanEmail.split('@')[0];
      }

      // 2. FIREBASE AUTHENTICATION (SECONDARY AUTH TANPA LOGOUT SUPER ADMIN)
      let fbAuthUid: string | undefined = existingRecord?.authUid;
      try {
        const secAuth = getSecondaryAuth();
        try {
          const cred = await createUserWithEmailAndPassword(secAuth, cleanEmail, cleanPass);
          if (cred?.user?.uid) {
            fbAuthUid = cred.user.uid;
          }
        } catch (authErr: any) {
          if (authErr?.code === 'auth/email-already-in-use') {
            const testPasswords = Array.from(new Set([cleanPass, existingRecord?.password, 'guru12345'].filter((p): p is string => Boolean(p && p.trim()))));
            for (const testP of testPasswords) {
              try {
                const cred = await signInWithEmailAndPassword(secAuth, cleanEmail, testP);
                if (cred.user) {
                  if (testP !== cleanPass) {
                    await updatePassword(cred.user, cleanPass);
                  }
                  fbAuthUid = cred.user.uid;
                  break;
                }
              } catch {}
            }
          } else {
            console.warn('Firebase Auth note during activation:', authErr?.message || authErr);
          }
        } finally {
          await fbSignOut(secAuth).catch(() => {});
        }
      } catch (authWrapErr) {
        console.warn('Secondary auth activation note:', authWrapErr);
      }

      // 3. SUSUN PROFILE LENGKAP YANG SUDAH AKTIF
      const nowIso = new Date().toISOString();
      const updatedUser: UserProfile = {
        ...(existingRecord || {}),
        uid: targetUid,
        authUid: fbAuthUid || existingRecord?.authUid,
        displayName: params.fullName.trim(),
        nip: params.nip?.trim() || existingRecord?.nip,
        email: cleanEmail,
        username: resolvedUsername,
        password: cleanPass,
        role: canonicalRole,
        phone: params.phone?.trim() || existingRecord?.phone,
        status: 'Aktif',
        isLoginActive: true,
        loginStatus: 'active',
        accountStatus: 'active',
        loginActivatedAt: nowIso,
        extracurricularIds: params.extracurricularIds || existingRecord?.extracurricularIds,
        assignedExtracurricularIds: params.extracurricularIds || existingRecord?.assignedExtracurricularIds,
        extracurricularNames: params.extracurricularNames || existingRecord?.extracurricularNames,
        extracurricularName: params.extracurricularNames?.join(', ') || existingRecord?.extracurricularName,
        counselorSpecialization: canonicalRole === 'guru_bk' ? (params.counselorSpecialization || existingRecord?.counselorSpecialization || 'Bimbingan Konseling Siswa & Karir') : undefined,
        isCashManager: params.isCashManager !== undefined ? params.isCashManager : existingRecord?.isCashManager,
        cashManagerTitle: params.isCashManager ? (params.cashManagerTitle || existingRecord?.cashManagerTitle || 'Bendahara Kesiswaan') : undefined,
        updatedAt: nowIso
      };

      // 4. UPDATE STATE LOKAL ALLUSERS (DEDUPLIKASI KETAT BERDASARKAN EMAIL & UID)
      setAllUsers(prev => {
        const withoutTarget = prev.filter(u => u.uid !== targetUid && (!u.email || u.email.trim().toLowerCase() !== cleanEmail));
        const next = deduplicateUsersList([...withoutTarget, updatedUser]);
        try { localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(next)); } catch {}
        return next;
      });

      // 5. SIMPAN KE FIRESTORE USERS & UPDATE STATUS DI TEACHERS
      try {
        await setDoc(doc(db, 'users', targetUid), updatedUser, { merge: true });

        // Hapus duplikat ID lama jika UID berbeda dari targetUid
        if (existingRecord && existingRecord.uid !== targetUid) {
          deleteDoc(doc(db, 'users', existingRecord.uid)).catch(() => {});
        }
        if (params.teacherId) {
          const teacherDocUid = `user_${params.teacherId}`;
          if (teacherDocUid !== targetUid) {
            deleteDoc(doc(db, 'users', teacherDocUid)).catch(() => {});
          }
          // Update status akun login di koleksi teachers
          await setDoc(doc(db, 'teachers', params.teacherId), {
            isLoginActive: true,
            accountStatus: 'active',
            userUid: targetUid,
            updatedAt: nowIso
          }, { merge: true });
        }
      } catch (firestoreErr) {
        console.warn('Firestore write on activateTeacherAccount note:', firestoreErr);
      }

      recordSystemAuditLog(
        'ACTIVATE_USER',
        'Manajemen Akun',
        `Administrator mengaktifkan akun login: ${updatedUser.displayName} (${updatedUser.email}) [${updatedUser.role.toUpperCase()}]`,
        currentUser
      );

      return { success: true, user: updatedUser };
    } catch (err: any) {
      console.error('Error activating teacher account:', err);
      return { success: false, error: err?.message || 'Gagal mengaktifkan akun login.' };
    }
  };

  // Aktivasi Akun Pengurus OSIM melalui cPanel (Solusi Satu Pintu & Anti Penumpukan Email)
  const activateOsimAccount = async (params: {
    memberId?: string;
    uid?: string;
    email: string;
    username?: string;
    password?: string;
    fullName: string;
    studentNis?: string;
    className?: string;
    position?: string;
    sekbid?: string;
    phone?: string;
    isCashManager?: boolean;
    cashManagerTitle?: string;
  }): Promise<{ success: boolean; user?: UserProfile; error?: string }> => {
    try {
      // 0. KEAMANAN & OTORISASI AKTIVASI AKUN OSIM
      const isAdminActor = currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role);
      if (!isAdminActor) {
        return {
          success: false,
          error: 'Akses ditolak: Hanya Administrator atau Waka Kesiswaan yang berhak mengaktifkan akun login pengurus OSIM.'
        };
      }

      const cleanEmail = (params.email || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { success: false, error: 'Email akun wajib diisi dan valid untuk aktivasi login pengurus OSIM.' };
      }

      const cleanPass = (params.password || 'osim12345').trim();
      const cleanNis = cleanDigits(params.studentNis);
      const isBph = isBphMember({ position: params.position, sekbid: params.sekbid });
      const posLower = (params.position || '').toLowerCase();
      const isSekbidKetua = !isBph && (posLower.includes('ketua') || posLower.includes('koordinator') || params.position === 'ketua_sekbid');

      // ATURAN BAKU: Hanya BPH dan Ketua Sekbid yang memiliki akun login di cPanel!
      if (!isBph && !isSekbidKetua) {
        return {
          success: false,
          error: 'Sesuai aturan sistem, akun login OSIM di cPanel hanya diperuntukkan bagi BPH dan Ketua Sekbid. Anggota Sekbid tidak memiliki akun login.'
        };
      }

      const osimRoleVal: OsimRoleType =
        posLower.includes('ketua') && !posLower.includes('wakil') && !posLower.includes('sekbid') ? 'ketua'
        : posLower.includes('wakil') ? 'wakil'
        : posLower.includes('sekretaris') ? 'sekretaris'
        : posLower.includes('bendahara') ? 'bendahara'
        : 'sekbid';

      const canonicalPos: OsimPosition =
        osimRoleVal === 'ketua' ? 'ketua_osim'
        : osimRoleVal === 'wakil' ? 'wakil_ketua_osim'
        : osimRoleVal === 'sekretaris' ? 'sekretaris'
        : osimRoleVal === 'bendahara' ? 'bendahara'
        : 'ketua_sekbid';

      const sekbidNum = extractSekbidNumber(params.sekbid) || extractSekbidNumber(params.position);
      const deptCode = isBph ? 'BPH' : (sekbidNum ? `SEKBID-${sekbidNum}` : 'SEKBID');

      // 1. CARI PENGGUNA YANG SUDAH ADA DENGAN EMAIL SAMA (DEDUPLICATION & REPLACE)
      // "dan jika terdapat email yang sama maka jangan buat id baru, cukup di timpa/replace dengan data yang terbaru"
      const existingUserByEmail = allUsers.find(u => u.email && u.email.trim().toLowerCase() === cleanEmail);
      const existingUserByUid = params.uid ? allUsers.find(u => u.uid === params.uid) : undefined;
      const existingUserByNis = cleanNis.length >= 4 && !isPlaceholderNis(cleanNis) ? allUsers.find(u => cleanDigits(u.nip) === cleanNis) : undefined;
      const existingUserByMemberId = params.memberId ? allUsers.find(u => u.uid === `user_osim_${params.memberId}` || u.uid === params.memberId) : undefined;
      const existingUserByName = params.fullName ? allUsers.find(u => normalizeName(u.displayName) === normalizeName(params.fullName) && (u.role === 'anggota_osim' || u.role === 'pengurus_osim')) : undefined;

      const existingRecord = existingUserByUid || existingUserByEmail || existingUserByMemberId || existingUserByName || existingUserByNis;

      // Standarisasi UID rapi OSIM resmi:
      const bphUidMap: Record<string, string> = {
        ketua: 'user_osim_ketua',
        wakil: 'user_osim_wakil',
        sekretaris: 'user_osim_sekretaris',
        bendahara: 'user_osim_bendahara'
      };
      const canonicalBphUid = isBph && bphUidMap[osimRoleVal] ? bphUidMap[osimRoleVal] : undefined;
      const canonicalSekbidUid = sekbidNum ? `user_osim_sekbid${sekbidNum}` : undefined;
      // Sesuai kesepakatan: Slot OSIM mutlak hanya user_osim_ketua s.d. user_osim_sekbid8 (timpa data lama)
      const targetUid = canonicalBphUid || canonicalSekbidUid;
      if (!targetUid) {
        return {
          success: false,
          error: 'Gagal mengidentifikasi slot jabatan OSIM resmi (BPH atau Sekbid 1..8).'
        };
      }

      let resolvedUsername = (params.username || existingRecord?.username || '').trim().toLowerCase();
      if (!resolvedUsername) {
        resolvedUsername = cleanNis && cleanNis.length >= 4 && !isPlaceholderNis(cleanNis) ? `osim_${cleanNis}` : (sekbidNum ? `osim.sekbid${sekbidNum}` : cleanEmail.split('@')[0]);
      }

      // 2. FIREBASE AUTHENTICATION (SECONDARY AUTH TANPA LOGOUT SUPER ADMIN)
      let fbAuthUid: string | undefined = existingRecord?.authUid;
      try {
        const secAuth = getSecondaryAuth();
        try {
          const cred = await createUserWithEmailAndPassword(secAuth, cleanEmail, cleanPass);
          if (cred?.user?.uid) {
            fbAuthUid = cred.user.uid;
          }
        } catch (authErr: any) {
          if (authErr?.code === 'auth/email-already-in-use') {
            console.info(`Akun email ${cleanEmail} sudah ada di Firebase Authentication, merekonsiliasi kredensial tanpa membuat akun ganda.`);
            const testPasswords = Array.from(new Set([cleanPass, existingRecord?.password, 'osim12345'].filter((p): p is string => Boolean(p && p.trim()))));
            for (const testP of testPasswords) {
              try {
                const cred = await signInWithEmailAndPassword(secAuth, cleanEmail, testP);
                if (cred.user) {
                  if (testP !== cleanPass) {
                    await updatePassword(cred.user, cleanPass);
                  }
                  fbAuthUid = cred.user.uid;
                  break;
                }
              } catch {}
            }
          } else {
            console.warn('Firebase Auth note during OSIM activation:', authErr?.message || authErr);
          }
        } finally {
          await fbSignOut(secAuth).catch(() => {});
        }
      } catch (authWrapErr) {
        console.warn('Secondary auth activation note for OSIM:', authWrapErr);
      }

      // 3. SUSUN PROFILE LENGKAP YANG SUDAH AKTIF
      const nowIso = new Date().toISOString();
      const updatedUser: UserProfile = {
        ...(existingRecord || {}),
        uid: targetUid,
        authUid: fbAuthUid || existingRecord?.authUid,
        displayName: params.fullName.trim(),
        nip: cleanNis || existingRecord?.nip,
        email: cleanEmail,
        username: resolvedUsername,
        password: cleanPass,
        role: 'anggota_osim',
        position: canonicalPos,
        osimRole: osimRoleVal,
        osimPosition: params.position || existingRecord?.osimPosition || 'Pengurus OSIM',
        osimDepartmentCode: deptCode,
        osimDepartmentName: params.sekbid || existingRecord?.osimDepartmentName || (isBph ? 'BPH (Badan Pengurus Harian)' : 'Seksi Bidang'),
        phone: params.phone?.trim() || existingRecord?.phone,
        status: 'Aktif',
        isLoginActive: true,
        loginStatus: 'active',
        accountStatus: 'active',
        loginActivatedAt: nowIso,
        isCashManager: params.isCashManager !== undefined ? params.isCashManager : (posLower.includes('bendahara') || existingRecord?.isCashManager),
        cashManagerTitle: (params.isCashManager || posLower.includes('bendahara')) ? (params.cashManagerTitle || 'Bendahara OSIM') : undefined,
        updatedAt: nowIso
      };

      // 4. UPDATE STATE LOKAL ALLUSERS (DEDUPLIKASI KETAT BERDASARKAN EMAIL & UID)
      setAllUsers(prev => {
        const withoutTarget = prev.filter(u => u.uid !== targetUid && (!u.email || u.email.trim().toLowerCase() !== cleanEmail));
        const next = deduplicateUsersList([...withoutTarget, updatedUser]);
        try { localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(next)); } catch {}
        return next;
      });

      // 5. SIMPAN KE FIRESTORE USERS & UPDATE STATUS DI OSIM_MEMBERS
      try {
        await setDoc(doc(db, 'users', targetUid), updatedUser, { merge: true });

        // Hapus duplikat ID lama jika UID berbeda dari targetUid
        if (existingRecord && existingRecord.uid !== targetUid) {
          deleteDoc(doc(db, 'users', existingRecord.uid)).catch(() => {});
        }
        if (fbAuthUid && fbAuthUid !== targetUid) {
          deleteDoc(doc(db, 'users', fbAuthUid)).catch(() => {});
        }
        if (params.memberId) {
          const oldMemberUid = `user_osim_${params.memberId}`;
          if (oldMemberUid !== targetUid) {
            deleteDoc(doc(db, 'users', oldMemberUid)).catch(() => {});
          }
          deleteDoc(doc(db, 'users', params.memberId)).catch(() => {});
          await setDoc(doc(db, 'osim_members', params.memberId), {
            isLoginActive: true,
            loginStatus: 'active',
            accountStatus: 'active',
            userUid: targetUid,
            email: cleanEmail,
            loginUsername: resolvedUsername,
            updatedAt: nowIso
          }, { merge: true });
        }
      } catch (firestoreErr) {
        console.warn('Firestore write on activateOsimAccount note:', firestoreErr);
      }

      recordSystemAuditLog(
        'ACTIVATE_USER',
        'Manajemen Akun',
        `Administrator mengaktifkan akun login OSIM: ${updatedUser.displayName} (${updatedUser.email}) [OSIM - ${updatedUser.osimPosition}]`,
        currentUser
      );

      return { success: true, user: updatedUser };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Gagal mengaktifkan akun login OSIM.' };
    }
  };

  const updateUser = async (uid: string, updated: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    try {
      let targetUserDisplayName = uid;
      const targetExistingUser = allUsers.find(u => u.uid === uid) || (currentUser?.uid === uid ? currentUser : undefined);
      let mergedUser: UserProfile | undefined;
      const nowIso = new Date().toISOString();

      // 0. KEAMANAN & PENCEGAHAN ESKALASI HAK AKSES (PRIVILEGE ESCALATION PREVENTION)
      const isSelfUpdate = currentUser?.uid === uid;
      const isAdminActor = currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role);
      const isSuperAdminActor = currentUser && (currentUser.role === 'super_admin' || currentUser.uid === 'user_super_admin');

      // ATURAN 1: Pengguna non-admin TIDAK BISA memperbarui akun pengguna lain
      if (!isSelfUpdate && !isAdminActor) {
        return {
          success: false,
          error: 'Akses ditolak: Anda tidak memiliki wewenang untuk memperbarui profil pengguna lain.'
        };
      }

      // ATURAN 2: Pengguna TIDAK BISA mengubah role akunnya sendiri (Self Role Escalation Prevention)
      if (isSelfUpdate && updated.role !== undefined && updated.role !== currentUser.role) {
        if (!isSuperAdminActor) {
          return {
            success: false,
            error: 'Akses ditolak: Anda tidak diizinkan mengubah peran (role) akun Anda sendiri demi keamanan sistem.'
          };
        }
      }

      const cleanUpdated: Partial<UserProfile> = { ...updated };

      // ATURAN 3: Pengguna non-admin TIDAK BISA memberikan hak isCashManager atau mengubah role
      if (!isAdminActor) {
        delete cleanUpdated.role;
        delete cleanUpdated.isCashManager;
        delete cleanUpdated.cashManagerTitle;
        delete cleanUpdated.assignedExtracurricularIds;
      }

      // ATURAN 4: Hanya Super Admin sah yang berhak menaikkan role siapapun menjadi super_admin
      if (cleanUpdated.role === 'super_admin' && !isSuperAdminActor) {
        return {
          success: false,
          error: 'Akses ditolak: Hanya Super Admin utama yang berhak menetapkan hak akses Super Admin.'
        };
      }

      if (cleanUpdated.role) {
        cleanUpdated.role = normalizeUserRole(cleanUpdated.role) || cleanUpdated.role;
      }
      if (cleanUpdated.assignedExtracurricularIds || cleanUpdated.extracurricularIds) {
        cleanUpdated.assignedExtracurricularIds = canonicalizeAssignedEkskulIds(cleanUpdated.assignedExtracurricularIds || cleanUpdated.extracurricularIds);
      }

      const oldPassword = targetExistingUser?.password?.trim();
      const newPassword = cleanUpdated.password?.trim();
      const newEmail = cleanUpdated.email?.trim();
      const oldEmail = targetExistingUser?.email?.trim();

      const updatedWithTimestamp: any = { ...cleanUpdated, updatedAt: nowIso };
      if (newPassword && oldPassword && oldPassword !== newPassword) {
        updatedWithTimestamp.previousPassword = oldPassword;
      }

      // 1. UPDATE REACT STATE & LOCAL STORAGE SEGERA (OPTIMISTIC UPDATE)
      // Menghilangkan latency sehingga UI cPanel langsung merespon tanpa jeda detik
      setAllUsers(prev => {
        const next = prev.map(u => {
          if (u.uid === uid) {
            targetUserDisplayName = u.displayName;
            const merged = { ...u, ...updatedWithTimestamp };
            mergedUser = merged;
            return merged;
          }
          return u;
        });
        try { localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(next)); } catch {}
        return next;
      });

      // Synchronize active session if the edited user is currently logged in
      if ((currentUser?.uid === uid || (mergedUser && currentUser?.username && currentUser.username === mergedUser.username)) && mergedUser) {
        if (mergedUser.status === 'Nonaktif') {
          logout();
        } else {
          setCurrentUser(mergedUser);
          try {
            sessionStorage.setItem(SESSION_STORAGE_USER_KEY, JSON.stringify(mergedUser));
          } catch {}
        }
      }

      // 2. FIRESTORE PERSISTENCE (SINGLE SOURCE OF TRUTH)
      try {
        setDoc(doc(db, 'users', uid), updatedWithTimestamp, { merge: true }).catch(e => {
          console.warn('Firestore updateUser sync note:', e);
        });

        // Pembersihan otomatis jika pernah terlanjur ada dokumen alias kembar di Firestore:
        const potentialAliasUid = uid.startsWith('user_') ? uid.replace(/^user_/, '') : `user_${uid}`;
        if (potentialAliasUid && potentialAliasUid !== uid) {
          deleteDoc(doc(db, 'users', potentialAliasUid)).catch(() => {});
        }
        if (targetExistingUser?.authUid && targetExistingUser.authUid !== uid) {
          deleteDoc(doc(db, 'users', targetExistingUser.authUid)).catch(() => {});
        }
      } catch (e) {
        console.warn('Firestore updateUser sync note:', e);
      }

      // 3. FIREBASE AUTH ASYNCHRONOUS BACKGROUND SYNC (NON-BLOCKING)
      // Kredensial akun sekunder diselaraskan di background agar tombol Simpan Perubahan tidak freeze
      if (newPassword || (newEmail && newEmail !== oldEmail)) {
        if (currentUser?.uid === uid) {
          // Self update
          if (newPassword && auth.currentUser) {
            updatePassword(auth.currentUser, newPassword).catch(passErr => {
              console.warn('Self updatePassword notice:', passErr);
            });
          }
        } else if (oldEmail) {
          // Update another user via secondary auth in background
          (async () => {
            try {
              const secAuth = getSecondaryAuth();
              let syncSuccess = false;

              const candidatePasswords = Array.from(new Set([
                oldPassword,
                targetExistingUser?.previousPassword,
                newPassword
              ].filter((p): p is string => Boolean(p && p.trim()))));

              for (const tryPass of candidatePasswords) {
                try {
                  const cred = await signInWithEmailAndPassword(secAuth, oldEmail, tryPass);
                  if (cred.user) {
                    if (newPassword) {
                      await updatePassword(cred.user, newPassword);
                    }
                    if (newEmail && newEmail !== oldEmail) {
                      try {
                        await updateEmail(cred.user, newEmail);
                      } catch (eErr) {
                        console.warn('updateEmail notice:', eErr);
                      }
                    }
                    syncSuccess = true;
                    break;
                  }
                } catch (signErr: any) {
                  // Continue trying candidate passwords
                }
              }

              if (!syncSuccess && newPassword) {
                try {
                  await createUserWithEmailAndPassword(secAuth, newEmail || oldEmail, newPassword);
                  syncSuccess = true;
                } catch (createErr: any) {
                  // User already in Firebase Auth with unknown password; auto-reconciliation will handle on login
                }
              }
              await fbSignOut(secAuth);
            } catch (secErr) {
              console.warn('Secondary auth sync note:', secErr);
            }
          })().catch(() => {});
        }
      }

      recordSystemAuditLog('UPDATE_USER', 'Manajemen Pengguna', `Administrator memperbarui akun: ${targetUserDisplayName} (ID: ${uid})`, currentUser);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Gagal memperbarui data akun.' };
    }
  };

  const deleteUser = async (uid: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // 0. KEAMANAN & OTORISASI PENGHAPUSAN AKUN
      const isAdminActor = currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role);
      if (!isAdminActor) {
        return {
          success: false,
          error: 'Akses ditolak: Hanya Administrator atau Waka Kesiswaan yang berhak menghapus akun pengguna.'
        };
      }

      if (uid === 'user_super_admin' || currentUser?.uid === uid) {
        return { success: false, error: 'Tidak dapat menghapus akun Super Admin utama atau akun yang sedang aktif digunakan.' };
      }
      const targetUser = allUsers.find(u => u.uid === uid);
      const isTeacher = targetUser && isProtectedTeacherOrStaff(targetUser);

      addDeletedUid(uid);
      if (uid.startsWith('user_')) {
        addDeletedUid(uid.replace(/^user_/, ''));
      }
      if (targetUser?.email && !isTeacher) {
        addDeletedUid(targetUser.email.trim().toLowerCase());
      }
      // NIP guru madrasah TIDAK BOLEH diblacklist agar tidak merusak data master kepegawaian
      if (targetUser?.nip && !isTeacher) {
        const cleanNip = cleanDigits(targetUser.nip);
        if (cleanNip.length >= 6) {
          addDeletedUid(cleanNip);
          addDeletedUid(`user_${cleanNip}`);
        }
      }

      setAllUsers(prev => {
        const next = prev.filter(u => {
          if (u.uid === uid) return false;
          if (targetUser) {
            if (u.email && targetUser.email && u.email.trim().toLowerCase() === targetUser.email.trim().toLowerCase()) return false;
            if (cleanDigits(u.nip) && cleanDigits(targetUser.nip) && cleanDigits(u.nip).length >= 6 && cleanDigits(u.nip) === cleanDigits(targetUser.nip)) return false;
          }
          return true;
        });
        try { localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(next)); } catch {}
        return next;
      });

      try {
        await deleteDoc(doc(db, 'users', uid));
        if (uid.startsWith('user_')) {
          deleteDoc(doc(db, 'users', uid.replace(/^user_/, ''))).catch(() => {});
        }
        if (targetUser?.authUid) {
          deleteDoc(doc(db, 'users', targetUser.authUid)).catch(() => {});
        }
      } catch (e) {
        console.warn('Firestore deleteUser sync note:', e);
      }

      recordSystemAuditLog('DELETE_USER', 'Manajemen Pengguna', `Administrator menghapus akun: ${targetUser?.displayName || uid} (${targetUser?.email || '-'})`, currentUser);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Gagal menghapus akun.' };
    }
  };

  const deleteUsersBulk = async (uids: string[]): Promise<{ success: boolean; deletedCount: number; error?: string }> => {
    try {
      const isAdminActor = currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role);
      if (!isAdminActor) {
        return {
          success: false,
          deletedCount: 0,
          error: 'Akses ditolak: Hanya Administrator atau Waka Kesiswaan yang berhak menghapus akun pengguna.'
        };
      }

      // Filter akun yang dilindungi (Super Admin utama atau akun yang sedang aktif digunakan)
      const validUids = uids.filter(id => id !== 'user_super_admin' && currentUser?.uid !== id);
      if (validUids.length === 0) {
        return { success: false, deletedCount: 0, error: 'Tidak ada akun yang diizinkan untuk dihapus.' };
      }

      const uidSet = new Set(validUids);
      const targetUsers = allUsers.filter(u => uidSet.has(u.uid));

      targetUsers.forEach(targetUser => {
        const isTeacher = isProtectedTeacherOrStaff(targetUser);
        addDeletedUid(targetUser.uid);
        if (targetUser.uid.startsWith('user_')) {
          addDeletedUid(targetUser.uid.replace(/^user_/, ''));
        }
        if (targetUser.email && !isTeacher) {
          addDeletedUid(targetUser.email.trim().toLowerCase());
        }
      });

      // 1. UPDATE STATE & LOCAL STORAGE SEGERA (OPTIMISTIC UPDATE)
      setAllUsers(prev => {
        const next = prev.filter(u => !uidSet.has(u.uid));
        try { localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(next)); } catch {}
        return next;
      });

      // 2. FIRESTORE PERSISTENCE DI BACKGROUND
      (async () => {
        try {
          const deletePromises: Promise<any>[] = [];
          targetUsers.forEach(u => {
            deletePromises.push(deleteDoc(doc(db, 'users', u.uid)).catch(() => {}));
            if (u.uid.startsWith('user_')) {
              deletePromises.push(deleteDoc(doc(db, 'users', u.uid.replace(/^user_/, ''))).catch(() => {}));
            }
            if (u.authUid) {
              deletePromises.push(deleteDoc(doc(db, 'users', u.authUid)).catch(() => {}));
            }
          });
          await Promise.allSettled(deletePromises);
        } catch (e) {
          console.warn('Firestore bulk delete user notice:', e);
        }
      })();

      recordSystemAuditLog(
        'DELETE_USERS_BULK',
        'Manajemen Pengguna',
        `Administrator menghapus ${targetUsers.length} akun secara massal: ${targetUsers.map(u => u.displayName).join(', ')}`,
        currentUser
      );

      return { success: true, deletedCount: targetUsers.length };
    } catch (e: any) {
      return { success: false, deletedCount: 0, error: e?.message || 'Gagal menghapus akun secara massal.' };
    }
  };

  const resetUserPassword = async (uid: string, newPassword?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // 0. KEAMANAN & OTORISASI RESET PASSWORD
      const isSelf = currentUser?.uid === uid;
      const isAdminActor = currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role);
      if (!isSelf && !isAdminActor) {
        return {
          success: false,
          error: 'Akses ditolak: Anda hanya dapat mengatur ulang kata sandi akun Anda sendiri.'
        };
      }

      const targetUser = allUsers.find(u => u.uid === uid) || (currentUser?.uid === uid ? currentUser : null);
      if (!targetUser?.email) {
        return { success: false, error: 'Akun ini tidak memiliki alamat email untuk reset kata sandi.' };
      }

      if (newPassword && newPassword.trim()) {
        const cleanPass = newPassword.trim();
        const prevPass = targetUser.password?.trim();
        const updatePayload: any = { password: cleanPass, updatedAt: new Date().toISOString() };
        if (prevPass && prevPass !== cleanPass) {
          updatePayload.previousPassword = prevPass;
        }

        // 1. Direct App Reset: Update in Firestore (Single Source of Truth, Overwrite Dokumen Asli)
        try {
          await setDoc(doc(db, 'users', uid), updatePayload, { merge: true });

          // Pembersihan otomatis dokumen kembar/alias jika pernah terlanjur ada di Firestore:
          const potentialAliasUid = uid.startsWith('user_') ? uid.replace(/^user_/, '') : `user_${uid}`;
          if (potentialAliasUid && potentialAliasUid !== uid) {
            deleteDoc(doc(db, 'users', potentialAliasUid)).catch(() => {});
          }
          if (targetUser?.authUid && targetUser.authUid !== uid) {
            deleteDoc(doc(db, 'users', targetUser.authUid)).catch(() => {});
          }
        } catch (e) {
          console.warn('Firestore resetUserPassword sync note:', e);
        }

        // Update local memory state
        setAllUsers(prev => {
          const next = prev.map(u => u.uid === uid ? { ...u, password: cleanPass, ...(prevPass && prevPass !== cleanPass ? { previousPassword: prevPass } : {}) } : u);
          try { localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(next)); } catch {}
          return next;
        });

        // 2. Synchronize to Firebase Auth via secondary auth
        try {
          const secAuth = getSecondaryAuth();
          let syncSuccess = false;

          const candidatePasswords = Array.from(new Set([
            prevPass,
            targetUser.previousPassword
          ].filter((p): p is string => Boolean(p && p.trim()))));

          for (const tryPass of candidatePasswords) {
            try {
              const cred = await signInWithEmailAndPassword(secAuth, targetUser.email, tryPass);
              if (cred.user) {
                await updatePassword(cred.user, cleanPass);
                syncSuccess = true;
                break;
              }
            } catch (authSignErr) {
              // Try next
            }
          }

          if (!syncSuccess) {
            try {
              const newCred = await createUserWithEmailAndPassword(secAuth, targetUser.email, cleanPass);
              if (newCred?.user?.uid) {
                // Update authUid pada dokumen utama saja, jangan buat dokumen baru di users
                setDoc(doc(db, 'users', uid), { authUid: newCred.user.uid }, { merge: true }).catch(() => {});
                if (newCred.user.uid !== uid) {
                  deleteDoc(doc(db, 'users', newCred.user.uid)).catch(() => {});
                }
              }
              syncSuccess = true;
            } catch (createErr) {}
          }
          await fbSignOut(secAuth);
        } catch (secErr) {
          console.warn('Firebase Auth sync note:', secErr);
        }

        recordSystemAuditLog(
          'RESET_PASSWORD_DIRECT',
          'Keamanan Akun',
          `Administrator menetapkan kata sandi baru untuk akun: ${targetUser.email} (${targetUser.displayName})`,
          currentUser
        );

        return { success: true };
      }

      // Fallback: Kirim email instruksi reset resmi Firebase Auth
      await sendPasswordResetEmail(auth, targetUser.email);

      recordSystemAuditLog(
        'RESET_PASSWORD',
        'Keamanan Akun',
        `Administrator mengirim instruksi reset kata sandi Firebase Auth ke email: ${targetUser.email} (${targetUser.displayName})`,
        currentUser
      );

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Gagal mereset kata sandi akun.' };
    }
  };

  const changePassword = async (currentPass: string, newPass: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser || !auth.currentUser) {
      return { success: false, error: 'Sesi akun tidak aktif di Firebase Authentication.' };
    }

    const userEmail = auth.currentUser.email || currentUser.email;
    if (!userEmail) {
      return { success: false, error: 'Email akun tidak terdaftar di Firebase Authentication.' };
    }

    if (!newPass || newPass.length < 6) {
      return { success: false, error: 'Kata sandi baru minimal 6 karakter demi keamanan akun Anda.' };
    }

    try {
      // WAJIB 2: Password hanya dikelola Firebase Authentication via reauthenticate & updatePassword
      const credential = EmailAuthProvider.credential(userEmail, currentPass.trim());
      await reauthenticateWithCredential(auth.currentUser, credential);

      await updatePassword(auth.currentUser, newPass.trim());

      recordSystemAuditLog(
        'CHANGE_PASSWORD',
        'Keamanan Akun',
        `Pengguna ${currentUser.displayName} (${currentUser.role.toUpperCase()}) berhasil memperbarui kata sandi di Firebase Authentication`,
        currentUser
      );

      return { success: true };
    } catch (e: any) {
      let errorMsg = 'Gagal memperbarui kata sandi akun.';
      if (e?.code === 'auth/wrong-password' || e?.code === 'auth/invalid-credential') {
        errorMsg = 'Kata sandi saat ini yang Anda masukkan salah.';
      } else if (e?.code === 'auth/weak-password') {
        errorMsg = 'Kata sandi baru terlalu lemah (minimal 6 karakter).';
      } else if (e?.code === 'auth/requires-recent-login') {
        errorMsg = 'Demi keamanan akun, silakan keluar (logout) dan masuk kembali sebelum memperbarui kata sandi.';
      }
      return { success: false, error: errorMsg };
    }
  };

  // Synchronize users from Teacher list (imported or manual) into cPanel User Accounts
  const syncUsersFromTeachers = async (
    teachersList: Teacher[],
    extracurricularsList?: Extracurricular[]
  ): Promise<number> => {
    if (!teachersList || teachersList.length === 0) return 0;
    let count = 0;
    const firestorePromises: Promise<any>[] = [];

    setAllUsers(prev => {
      const updatedUsers = [...prev];

      for (const t of teachersList) {
        // 1. Authoritative Role Mapping: Master Teacher Data is SINGLE SOURCE OF TRUTH
        // DILARANG KERAS mengacak peran berdasarkan mata pelajaran atau penugasan pembinaan ekskul!
        const rawRole = (t.role || '').toLowerCase();
        let role: CanonicalUserRole = 'guru';

        if (rawRole.includes('super') || rawRole.includes('admin') || rawRole.includes('proktor')) {
          role = 'super_admin';
        } else if (rawRole.includes('waka') || rawRole.includes('kesiswaan')) {
          role = 'waka_kesiswaan';
        } else if (rawRole.includes('tu') || rawRole.includes('tata usaha') || rawRole.includes('staf tu')) {
          role = 'staf_tu';
        } else if (/\bbk\b/i.test(rawRole) || rawRole.includes('konselor') || rawRole.includes('bimbingan')) {
          role = 'guru_bk';
        } else if (rawRole.includes('wali') || rawRole.includes('homeroom')) {
          role = 'wali_kelas';
        } else if (rawRole.includes('osim') || rawRole.includes('osis')) {
          role = 'pembina_osim';
        } else if (rawRole.includes('pembina') || rawRole.includes('ekskul') || rawRole.includes('coach')) {
          role = 'coach_ekstrakurikuler';
        } else {
          role = 'guru';
        }

        // 2. Resolve clean institutional email and username
        const cleanName = t.fullName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const cleanNip = t.nip ? t.nip.replace(/\s+/g, '').replace(/[^0-9]/g, '') : '';
        
        const email = t.email && t.email.includes('@')
          ? t.email.trim().toLowerCase()
          : cleanNip && cleanNip.length > 5
          ? `guru.${cleanNip}@madrasah.sch.id`
          : `${cleanName || 'guru'}.${t.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4)}@madrasah.sch.id`;

        const username = cleanNip && cleanNip.length > 5 
          ? cleanNip 
          : email.split('@')[0];

        // 3. Modul Guru sebagai Data Pokok (Single Source of Truth):
        // Pembinaan ekskul dicatat sebagai tugas pendamping, TIDAK MENGUBAH peran utama guru
        const assignedEkskulIds = canonicalizeAssignedEkskulIds(t.assignedExtracurriculars, extracurricularsList);
        const assignedEkskulNames = assignedEkskulIds.map(id => {
          const match = (extracurricularsList || []).find(e => e.id === id);
          return match ? match.name : '';
        }).filter(name => Boolean(name && !/^\d+$/.test(name.trim()) && !/^ekskul_\d+$/i.test(name.trim())));
        const assignedEkskulNameStr = assignedEkskulNames.join(', ') || undefined;

        // 4. Generate UID Unik & Bebas Tabrakan untuk setiap Guru/Staf
        const isSuperAdminUser = t.role?.toLowerCase().includes('super') || t.fullName?.toLowerCase().includes('puput');
        const tNumMatch = t.id.match(/(\d+)/);
        const tNumPad = tNumMatch ? String(parseInt(tNumMatch[1], 10)).padStart(2, '0') : '';
        const uniqueUid = isSuperAdminUser
          ? 'user_super_admin'
          : (role === 'staf_tu'
              ? (tNumPad ? `user_tu_${tNumPad}` : `user_${t.id}`)
              : (role === 'guru_bk'
                  ? (tNumPad ? `user_guru_bk_${tNumPad}` : `user_${t.id}`)
                  : (tNumPad ? `user_guru_${tNumPad}` : (t.id.startsWith('user_') ? t.id : `user_${t.id}`))
                )
            );

        // 5. Cari user yang sudah ada dengan pencocokan relasional
        const existingIdx = updatedUsers.findIndex(u => isTeacherUserMatch(u, t));

        if (existingIdx >= 0) {
          const existing = updatedUsers[existingIdx];
          const targetUid = (role === 'staf_tu')
            ? (existing.uid.startsWith('user_tu_') ? existing.uid : uniqueUid)
            : ((existing.uid && isStandardTidyUid(existing.uid) && !isRandomOrLegacyArtifactUid(existing.uid))
                ? existing.uid
                : uniqueUid);

          const userPassword = existing.password || 'password';
          const merged: UserProfile = {
            ...existing,
            uid: targetUid,
            teacherId: t.id,
            displayName: t.fullName,
            nip: t.nip || existing.nip,
            email: existing.email || email,
            username: existing.username || username,
            password: userPassword,
            // Peran struktural data primer selalu diprioritaskan
            role: existing.role === 'super_admin' ? 'super_admin' : role,
            phone: t.phone || existing.phone,
            status: existing.status || (t.isActive !== false ? 'Aktif' : 'Nonaktif'),
            isLoginActive: existing.isLoginActive !== undefined ? existing.isLoginActive : (existing.status === 'Aktif'),
            loginStatus: existing.loginStatus || (existing.status === 'Aktif' ? 'active' : 'pending_activation'),
            accountStatus: existing.accountStatus || (existing.status === 'Aktif' ? 'active' : 'pending'),
            isCashManager: t.isCashManager !== undefined ? t.isCashManager : existing.isCashManager,
            cashManagerTitle: t.cashManagerTitle || existing.cashManagerTitle,
            extracurricularIds: assignedEkskulIds.length > 0 ? assignedEkskulIds : [],
            assignedExtracurricularIds: assignedEkskulIds.length > 0 ? assignedEkskulIds : [],
            extracurricularNames: assignedEkskulNames.length > 0 ? assignedEkskulNames : [],
            extracurricularName: assignedEkskulNameStr || undefined,
            counselorSpecialization: role === 'guru_bk' ? (t.subject || 'Bimbingan Konseling Siswa & Karir') : undefined,
            photoURL: t.photoUrl || (t as any).photoURL || existing.photoURL,
            updatedAt: new Date().toISOString()
          };
          updatedUsers[existingIdx] = merged;
          
          // PENULISAN LANGSUNG TANPA SYARAT KE FIRESTORE USERS
          firestorePromises.push(setDoc(doc(db, 'users', merged.uid), merged, { merge: true }).catch(err => console.warn('Firestore write user notice:', err)));
          if (existing.uid && existing.uid !== merged.uid) {
            firestorePromises.push(deleteDoc(doc(db, 'users', existing.uid)).catch(() => {}));
          }
          if (isSuperAdminUser && existing.uid !== 'user_guru_01') {
            firestorePromises.push(deleteDoc(doc(db, 'users', 'user_guru_01')).catch(() => {}));
          }
          count++;
        } else {
          const finalUid = uniqueUid;
          const isAlreadyActive = t.isLoginActive === true || t.accountStatus === 'active';
          const newUser: UserProfile = {
            uid: finalUid,
            teacherId: t.id,
            displayName: t.fullName,
            nip: t.nip || undefined,
            email: email,
            username: username,
            password: 'password',
            role: isSuperAdminUser ? 'super_admin' : role,
            phone: t.phone || undefined,
            status: (isSuperAdminUser || isAlreadyActive) ? 'Aktif' : 'Nonaktif',
            isLoginActive: isSuperAdminUser || isAlreadyActive,
            loginStatus: (isSuperAdminUser || isAlreadyActive) ? 'active' : 'pending_activation',
            accountStatus: (isSuperAdminUser || isAlreadyActive) ? 'active' : 'pending',
            isCashManager: t.isCashManager || false,
            cashManagerTitle: t.cashManagerTitle || undefined,
            extracurricularIds: assignedEkskulIds.length > 0 ? assignedEkskulIds : undefined,
            assignedExtracurricularIds: assignedEkskulIds.length > 0 ? assignedEkskulIds : undefined,
            extracurricularNames: assignedEkskulNames.length > 0 ? assignedEkskulNames : undefined,
            extracurricularName: assignedEkskulNameStr || undefined,
            counselorSpecialization: role === 'guru_bk' ? (t.subject || 'Bimbingan Konseling Siswa & Karir') : undefined,
            photoURL: t.photoUrl || (t as any).photoURL || undefined,
            createdAt: new Date().toISOString()
          };
          updatedUsers.push(newUser);

          // PENULISAN LANGSUNG TANPA SYARAT KE FIRESTORE USERS
          firestorePromises.push(setDoc(doc(db, 'users', newUser.uid), newUser, { merge: true }).catch(err => console.warn('Firestore write new user notice:', err)));

          // Kredensial Firebase Auth HANYA dibuat otomatis untuk Super Admin di sini.
          if (isSuperAdminUser) {
            try {
              const secAuth = getSecondaryAuth();
              createUserWithEmailAndPassword(secAuth, newUser.email, newUser.password || 'password')
                .then(() => fbSignOut(secAuth))
                .catch(() => fbSignOut(secAuth).catch(() => {}));
            } catch {}
          }

          count++;
        }
      }

      const deduplicated = deduplicateUsersList(updatedUsers);
      const sorted = sortUsersByHierarchy(deduplicated);
      return sorted;
    });

    if (firestorePromises.length > 0) {
      try {
        await Promise.allSettled(firestorePromises);
      } catch (e) {
        console.warn('Firestore sync users from teachers error:', e);
      }
    }

    return count;
  };

  const syncUsersFromOsim = async (
    departmentsList: OsimDepartment[] = [],
    membersList?: OsimMember[]
  ): Promise<number> => {
    const safeMembers = membersList && membersList.length > 0 ? membersList : [];
    if (safeMembers.length === 0) return 0;
    let count = 0;
    const firestorePromises: Promise<any>[] = [];

    setAllUsers(prev => {
      // Filter out any stale generic accounts from current state
      const updatedUsers = prev.filter(u => !isPurgedUser(u) && !isDeletedUid(u.uid));

      if (safeMembers.length > 0) {
        for (const m of safeMembers) {
          if (!m || !m.fullName) continue;
          const pos = (m.position || '').toLowerCase();
          const sek = (m.sekbid || '').toLowerCase();

          const sekbidNum = extractSekbidNumber(m.sekbid) || extractSekbidNumber(m.position);
          const hasSekbidContext = sekbidNum !== null || sek.includes('sekbid') || sek.includes('bidang') || pos.includes('sekbid') || pos.includes('bidang');

          // Inferred OSIM role: Check BPH only if NOT a Sekbid
          let osimRoleVal: OsimRoleType = 'sekbid';
          let isBph = false;

          if (!hasSekbidContext && (sek.includes('bph') || isBphMember(m) || pos.includes('umum') || (!pos.includes('sekbid') && !pos.includes('bidang')))) {
            if (pos.includes('ketua') && !pos.includes('wakil')) {
              osimRoleVal = 'ketua';
              isBph = true;
            } else if (pos.includes('wakil')) {
              osimRoleVal = 'wakil';
              isBph = true;
            } else if (pos.includes('sekretaris')) {
              osimRoleVal = 'sekretaris';
              isBph = true;
            } else if (pos.includes('bendahara')) {
              osimRoleVal = 'bendahara';
              isBph = true;
            }
          }

          const isSekbidKetua = !isBph && (pos.includes('ketua') || pos.includes('koordinator'));

          const matchedDept = departmentsList.find(d => 
            d.id === m.sekbid || 
            d.name === m.sekbid || 
            (d.code && (m.sekbid || '').toLowerCase().includes(d.code.toLowerCase()))
          );

          const deptId = isBph ? 'dept_bph' : (matchedDept?.id || (sekbidNum ? `dept_sekbid_${sekbidNum}` : 'dept_sekbid'));
          const deptCode = isBph ? 'BPH' : (sekbidNum ? `SEKBID-${sekbidNum}` : (matchedDept?.code || 'SEKBID'));
          const deptName = isBph ? 'BPH (Badan Pengurus Harian)' : (matchedDept?.name || m.sekbid || 'Seksi Bidang');

          // Username strictly follows student NIS or loginUsername or clean personal fallback
          const cleanNis = cleanDigits(m.studentNis);
          const cleanName = (m.fullName || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
          const fallbackUsername = cleanNis
            ? cleanNis
            : (cleanName ? `osim.${cleanName}` : (isBph ? getDefaultOsimUsername(m) : (sekbidNum ? `osim.sekbid${sekbidNum}` : `osim.${m.id || Date.now()}`)));
          const username = cleanNis || (m.loginUsername || m.username || '').toLowerCase().trim() || fallbackUsername;
          const email = m.email || `${username}@madrasah.sch.id`;

          // Map to Canonical OsimPosition
          const canonicalOsimPos: OsimPosition =
            osimRoleVal === 'ketua' ? 'ketua_osim' :
            osimRoleVal === 'wakil' ? 'wakil_ketua_osim' :
            osimRoleVal === 'sekretaris' ? 'sekretaris' :
            osimRoleVal === 'bendahara' ? 'bendahara' :
            (isSekbidKetua ? 'ketua_sekbid' : 'anggota_sekbid' as any);

          // Standarisasi UID unik per individu pengurus OSIM
          const bphUidMap: Record<string, string> = {
            ketua: 'user_osim_ketua',
            wakil: 'user_osim_wakil',
            sekretaris: 'user_osim_sekretaris',
            bendahara: 'user_osim_bendahara'
          };
          const canonicalBphUid = isBph && bphUidMap[osimRoleVal] ? bphUidMap[osimRoleVal] : undefined;
          const canonicalSekbidUid = isSekbidKetua && sekbidNum ? `user_osim_sekbid${sekbidNum}` : undefined;
          const memberUniqueUid = cleanNis
            ? `user_osim_${cleanNis}`
            : (m.id ? `user_osim_${m.id.replace(/^osim_/, '')}` : (cleanName ? `user_osim_${cleanName}` : `user_osim_${Date.now()}`));
          const canonicalOsimUid = canonicalBphUid || canonicalSekbidUid || memberUniqueUid;

          // Match existing user with strict Sekbid / BPH conflict prevention
          const existingIdx = updatedUsers.findIndex(u => {
            const uSekbid = extractSekbidNumber(u.osimDepartmentCode) || extractSekbidNumber(u.osimDepartmentName) || extractSekbidNumber(u.osimPosition);
            // Guard: Jangan pernah mencocokkan jika dari Sekbid berbeda
            if (sekbidNum !== null && uSekbid !== null && sekbidNum !== uSekbid) return false;
            // Guard: Jangan pernah mencocokkan Sekbid dengan BPH
            const uIsBph = u.osimDepartmentCode === 'BPH' || (u.osimDepartmentName && u.osimDepartmentName.includes('BPH')) || ['user_osim_ketua', 'user_osim_wakil', 'user_osim_sekretaris', 'user_osim_bendahara'].includes(u.uid);
            if ((sekbidNum !== null && uIsBph) || (isBph && uSekbid !== null)) return false;

            return (
              u.uid === canonicalOsimUid ||
              (m.id && (u.uid === m.id || u.uid === `user_${m.id}`)) ||
              (cleanNis && !isPlaceholderNis(cleanNis) && cleanDigits(u.nip) === cleanNis) ||
              (username && u.username && u.username.toLowerCase() === username.toLowerCase()) ||
              isOsimMemberUserMatch(u, m)
            );
          });

          // Email pengurus OSIM: Data manual yang diisi di menu Pengurus OSIM adalah yang TERBARU dan WAJIB menimpa data lama di cPanel!
          const officialEmail = (m.email && m.email.trim())
            ? m.email.trim()
            : (existingIdx >= 0 && updatedUsers[existingIdx]?.email && !isGenericPlaceholderEmail(updatedUsers[existingIdx].email) && !PURGED_DEMO_EMAILS.includes(updatedUsers[existingIdx].email.toLowerCase().trim())
              ? updatedUsers[existingIdx].email.trim()
              : (cleanNis ? `${cleanNis}@madrasah.sch.id` : email));

          if (existingIdx >= 0) {
            const existing = updatedUsers[existingIdx];
            const targetUid = canonicalOsimUid;
            const isNowActive = Boolean(m.isLoginActive || existing.isLoginActive || existing.loginStatus === 'active' || existing.accountStatus === 'active');
            const merged: UserProfile = {
              ...existing,
              uid: targetUid,
              displayName: m.fullName,
              nip: m.studentNis || existing.nip,
              phone: m.phone && m.phone !== '-' ? m.phone : existing.phone,
              username: existing.username || username,
              email: officialEmail,
              password: existing.password || 'osim12345',
              authUid: existing.authUid,
              role: 'anggota_osim',
              position: canonicalOsimPos,
              osimRole: osimRoleVal,
              osimPosition: m.position,
              osimDepartmentId: deptId,
              osimDepartmentCode: deptCode,
              osimDepartmentName: deptName,
              isCashManager: osimRoleVal === 'bendahara',
              cashManagerTitle: osimRoleVal === 'bendahara' ? 'Bendahara OSIM' : undefined,
              status: m.status === 'Demisioner' ? 'Nonaktif' : (existing.status || (isNowActive ? 'Aktif' : 'Nonaktif')),
              isLoginActive: isNowActive,
              loginStatus: isNowActive ? 'active' : (existing.loginStatus || 'pending_activation'),
              accountStatus: isNowActive ? 'active' : (existing.accountStatus || 'pending'),
              updatedAt: new Date().toISOString()
            };
            updatedUsers[existingIdx] = merged;
            firestorePromises.push(setDoc(doc(db, 'users', merged.uid), merged, { merge: true }));
            if (existing.uid && existing.uid !== merged.uid) {
              firestorePromises.push(deleteDoc(doc(db, 'users', existing.uid)));
            }
            if (sekbidNum && isSekbidKetua) {
              firestorePromises.push(deleteDoc(doc(db, 'users', `user_osim_sekbid_${sekbidNum}`)).catch(() => {}));
              firestorePromises.push(deleteDoc(doc(db, 'users', `user_osim_dept_sekbid_${sekbidNum}`)).catch(() => {}));
            }
            count++;
          } else {
            const isNowActive = Boolean(m.isLoginActive === true || m.accountStatus === 'active');
            const newUser: UserProfile = {
              uid: canonicalOsimUid,
              displayName: m.fullName,
              username,
              email: officialEmail,
              nip: m.studentNis,
              phone: m.phone && m.phone !== '-' ? m.phone : undefined,
              role: 'anggota_osim',
              position: canonicalOsimPos,
              osimRole: osimRoleVal,
              osimPosition: m.position,
              osimDepartmentId: deptId,
              osimDepartmentCode: deptCode,
              osimDepartmentName: deptName,
              isCashManager: osimRoleVal === 'bendahara',
              cashManagerTitle: osimRoleVal === 'bendahara' ? 'Bendahara OSIM' : undefined,
              status: m.status === 'Demisioner' ? 'Nonaktif' : (isNowActive ? 'Aktif' : 'Nonaktif'),
              isLoginActive: isNowActive,
              loginStatus: isNowActive ? 'active' : 'pending_activation',
              accountStatus: isNowActive ? 'active' : 'pending',
              createdAt: new Date().toISOString()
            };
            updatedUsers.push(newUser);
            firestorePromises.push(setDoc(doc(db, 'users', newUser.uid), newUser, { merge: true }));
            if (sekbidNum) {
              firestorePromises.push(deleteDoc(doc(db, 'users', `user_osim_sekbid_${sekbidNum}`)).catch(() => {}));
              firestorePromises.push(deleteDoc(doc(db, 'users', `user_osim_dept_sekbid_${sekbidNum}`)).catch(() => {}));
            }
            count++;
          }
        }
      }

      // Bersihkan dokumen usang dengan format UID lama bertanda underscore (user_osim_sekbid_1..8)
      for (let s = 1; s <= 8; s++) {
        const legacyUnderscoreUid = `user_osim_sekbid_${s}`;
        const legacyDeptUid = `user_osim_dept_sekbid_${s}`;
        const targetSekbidUid = `user_osim_sekbid${s}`;
        
        // Hapus akun lama dari Firestore jika duplikat
        firestorePromises.push(deleteDoc(doc(db, 'users', legacyUnderscoreUid)).catch(() => {}));
        firestorePromises.push(deleteDoc(doc(db, 'users', legacyDeptUid)).catch(() => {}));

        // Cari Ketua / Koordinator Sekbid sah dari membersList atau dari master departemen
        const matchedMemberKetua = (membersList || []).find(m => {
          if (!m || !m.fullName) return false;
          const pos = (m.position || '').toLowerCase();
          const isK = pos.includes('ketua') || pos.includes('koordinator');
          const num = extractSekbidNumber(m.sekbid) || extractSekbidNumber(m.position);
          return isK && num === s;
        });

        const matchedDept = departmentsList.find(d => extractSekbidNumber(d.code) === s || extractSekbidNumber(d.name) === s);
        const trimmedCoord = (matchedDept?.coordinatorName || '').trim();
        const ketuaName = matchedMemberKetua?.fullName?.trim() || trimmedCoord;
        const ketuaEmail = matchedMemberKetua?.email || (matchedMemberKetua?.studentNis ? `${cleanDigits(matchedMemberKetua.studentNis)}@madrasah.sch.id` : `osim.sekbid${s}@madrasah.sch.id`);
        const ketuaNis = matchedMemberKetua?.studentNis ? cleanDigits(matchedMemberKetua.studentNis) : undefined;
        const deptName = matchedDept?.name || `Seksi Bidang ${s}`;

        const sIdx = updatedUsers.findIndex(u =>
          u.uid === targetSekbidUid ||
          u.uid === legacyUnderscoreUid ||
          u.uid === legacyDeptUid ||
          (ketuaName && u.displayName && u.displayName.toLowerCase().trim() === ketuaName.toLowerCase())
        );

        if (sIdx >= 0) {
          const existing = updatedUsers[sIdx];
          // Pastikan akun sekbid ini memegang nama Ketua Sekbid sah, BUKAN Anggota Sekbid!
          const isExistingAnggota = isAnggotaSekbid(existing as any);
          const finalDisplayName = ketuaName || (isExistingAnggota ? (trimmedCoord || `Ketua Sekbid ${s}`) : (existing.displayName || `Ketua Sekbid ${s}`));
          const finalNis = ketuaNis || (isExistingAnggota ? undefined : existing.nip);
          const finalEmail = (isExistingAnggota || !existing.email || isGenericPlaceholderEmail(existing.email)) ? ketuaEmail : existing.email;
          const finalPosition = matchedMemberKetua?.position || `Ketua Sekbid ${s}`;

          const migrated: UserProfile = {
            ...existing,
            uid: targetSekbidUid,
            displayName: finalDisplayName,
            nip: finalNis,
            email: finalEmail,
            position: 'ketua_sekbid',
            osimRole: 'sekbid',
            osimPosition: finalPosition,
            osimDepartmentCode: `SEKBID-${s}`,
            osimDepartmentName: deptName,
            updatedAt: new Date().toISOString()
          };
          updatedUsers[sIdx] = migrated;
          firestorePromises.push(setDoc(doc(db, 'users', targetSekbidUid), migrated, { merge: true }));
          if (existing.uid !== targetSekbidUid) {
            firestorePromises.push(deleteDoc(doc(db, 'users', existing.uid)).catch(() => {}));
          }
        } else if (ketuaName) {
          // Buat akun Ketua Sekbid jika belum ada
          const newSekbidUser: UserProfile = {
            uid: targetSekbidUid,
            displayName: ketuaName,
            username: `osim.sekbid${s}`,
            email: ketuaEmail,
            nip: ketuaNis,
            password: 'osim12345',
            role: 'anggota_osim',
            position: 'ketua_sekbid',
            osimRole: 'sekbid',
            osimPosition: matchedMemberKetua?.position || `Ketua Sekbid ${s}`,
            osimDepartmentCode: `SEKBID-${s}`,
            osimDepartmentName: deptName,
            status: 'Aktif',
            isLoginActive: true,
            loginStatus: 'active',
            accountStatus: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          updatedUsers.push(newSekbidUser);
          firestorePromises.push(setDoc(doc(db, 'users', targetSekbidUid), newSekbidUser, { merge: true }));
          count++;
        }
      }

      // Purge akun OSIM liar / Anggota Sekbid yang tidak berhak punya akun login di cPanel
      const legitimateUsers = updatedUsers.filter(u => {
        if (u.role === 'anggota_osim' || u.role === 'pengurus_osim') {
          const isBphUid = ['user_osim_ketua', 'user_osim_wakil', 'user_osim_sekretaris', 'user_osim_bendahara'].includes(u.uid);
          const isSekbidUid = /^user_osim_sekbid[1-8]$/i.test(u.uid);
          
          if (!isBphUid && !isSekbidUid) {
            firestorePromises.push(deleteDoc(doc(db, 'users', u.uid)).catch(() => {}));
            return false;
          }
        }
        return true;
      });

      const deduplicated = deduplicateUsersList(legitimateUsers);
      const sorted = sortUsersByHierarchy(deduplicated);
      localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(sorted));
      return sorted;
    });

    if (firestorePromises.length > 0) {
      try {
        await Promise.allSettled(firestorePromises);
      } catch (e) {
        console.warn('Firestore sync users from OSIM error:', e);
      }
    }

    recordSystemAuditLog('SYNC_OSIM_ACCOUNTS', 'Sinkronisasi Data', `Sinkronisasi data akun login pengurus & sekbid OSIM berhasil (${count} akun)`, currentUser);

    return count;
  };

  /**
   * TAHAP 1: Migrasi massal dokumen Firestore users ber-ID acak ke ID rapi deskriptif
   * (Misal menyalin dokumen CdAcdt... ke user_super_admin, lalu menghapus dokumen acak)
   */
  const migrateAllUsersToTidyUids = async (): Promise<{ migratedCount: number; deletedArtifactsCount: number }> => {
    let migratedCount = 0;
    let deletedArtifactsCount = 0;
    try {
      const snap = await getDocs(collection(db, 'users'));
      const seenNeatUids = new Set<string>();
      const seenTeacherNips = new Map<string, string>(); // cleanNip -> docId
      const seenEmails = new Map<string, string>(); // cleanEmail -> docId
      const docsToMigrate: Array<{ docRef: any; id: string; data: UserProfile }> = [];

      // TAHAP 4: 1. Fase Pertama - Identifikasi dokumen rapi & hapus sampah/purged murni
      for (const d of snap.docs) {
        const data = d.data() as UserProfile;
        const uid = data.uid || d.id;
        const userWithId = { ...data, uid };

        if (isPurgedUser(userWithId) || isDeletedUid(uid) || d.id === 'user_teacher_pitria_lawenusa') {
          await deleteDoc(d.ref).catch(() => {});
          deletedArtifactsCount++;
          continue;
        }

        // Hapus akun OSIM Anggota Sekbid biasa dari Firestore users (Hanya BPH & Ketua Sekbid yang boleh ada)
        const isOsim = data.role === 'anggota_osim' || data.role === 'pengurus_osim';
        if (isOsim && isAnggotaSekbid(data as any)) {
          await deleteDoc(d.ref).catch(() => {});
          deletedArtifactsCount++;
          continue;
        }

        // Hapus dokumen kembar yang tidak berawalan 'user_' jika versi 'user_' sudah ada
        if (!d.id.startsWith('user_') && snap.docs.some(other => other.id === `user_${d.id}`)) {
          await deleteDoc(d.ref).catch(() => {});
          deletedArtifactsCount++;
          continue;
        }

        if (isRandomOrLegacyArtifactUid(d.id)) {
          docsToMigrate.push({ docRef: d.ref, id: d.id, data });
        } else {
          seenNeatUids.add(d.id);
          const cleanNip = data.nip ? cleanDigits(data.nip) : '';
          if (cleanNip.length >= 6) {
            seenTeacherNips.set(cleanNip, d.id);
          }
          if (data.email && !isGenericPlaceholderEmail(data.email)) {
            seenEmails.set(data.email.trim().toLowerCase(), d.id);
          }
        }
      }

      // TAHAP 4: 2. Fase Kedua - Proses dokumen ber-UID acak dan eliminasi akun ganda
      for (const item of docsToMigrate) {
        const { docRef, id, data } = item;
        const targetTidyUid = resolveTidyUidForUser(data);
        if (targetTidyUid === 'user_osim_ineligible_anggota') {
          await deleteDoc(docRef).catch(() => {});
          deletedArtifactsCount++;
          continue;
        }
        const cleanNip = data.nip ? cleanDigits(data.nip) : '';
        const cleanEmail = data.email && !isGenericPlaceholderEmail(data.email) ? data.email.trim().toLowerCase() : '';

        // Cek apakah akun ini adalah duplikat dari dokumen ber-UID rapi yang sudah ada
        const duplicateOfDocId =
          seenNeatUids.has(targetTidyUid) ? targetTidyUid :
          (cleanNip.length >= 6 && seenTeacherNips.has(cleanNip) ? seenTeacherNips.get(cleanNip) :
          (cleanEmail && seenEmails.has(cleanEmail) ? seenEmails.get(cleanEmail) : null));

        if (duplicateOfDocId) {
          // Dokumen rapi sudah ada: satukan field penting ke dokumen utama dan hapus dokumen ber-UID acak ganda
          await setDoc(doc(db, 'users', duplicateOfDocId), {
            phone: data.phone || undefined,
            authUid: id,
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(() => {});

          await deleteDoc(docRef).catch(() => {});
          deletedArtifactsCount++;
        } else {
          // Belum ada dokumen rapi: migrasikan ke targetTidyUid rapi dan hapus dokumen ber-UID acak
          const tidyUser: UserProfile = {
            ...data,
            uid: targetTidyUid,
            authUid: id,
            updatedAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'users', targetTidyUid), tidyUser, { merge: true });
          await deleteDoc(docRef).catch(() => {});
          seenNeatUids.add(targetTidyUid);
          if (cleanNip.length >= 6) seenTeacherNips.set(cleanNip, targetTidyUid);
          if (cleanEmail) seenEmails.set(cleanEmail, targetTidyUid);
          migratedCount++;
          deletedArtifactsCount++;
        }
      }
    } catch (e) {
      console.warn('Gagal migrasi massal UID user & pembersihan akun ganda:', e);
    }
    return { migratedCount, deletedArtifactsCount };
  };

  // Canonical Role and Position Evaluation (Zero Dangerous Fallbacks)
  const canonicalRole: CanonicalUserRole | null = currentUser ? normalizeUserRole(currentUser.role) : null;
  const osimPosition: OsimPosition | undefined = currentUser ? normalizeOsimPosition(currentUser) : undefined;

  // Centralized capability helpers bound to the active user
  const checkHasRole = (...roles: CanonicalUserRole[]): boolean => currentUser ? hasRole(currentUser, ...roles) : false;
  const checkHasPosition = (...positions: OsimPosition[]): boolean => currentUser ? hasPosition(currentUser, ...positions) : false;
  const checkHasScope = (scopeType: 'extracurricular' | 'osim_department', targetId: string): boolean =>
    currentUser ? hasScope(currentUser, scopeType, targetId) : false;
  const checkHasPermission = (permission: Permission): boolean => currentUser ? hasPermission(currentUser, permission) : false;
  const checkCanManageCash = (): boolean => currentUser ? canManageCash(currentUser) : false;
  const checkCanReviewOsimProgram = (): boolean => currentUser ? canReviewOsimProgram(currentUser) : false;
  const checkCanApproveOsimProgram = (): boolean => currentUser ? canApproveOsimProgram(currentUser) : false;
  const checkCanManageExtracurricular = (ekskulId?: string): boolean => currentUser ? canManageExtracurricular(currentUser, ekskulId) : false;

  // Legacy flags cleanly derived from canonical role & position (strictly requiring active currentUser and valid canonical role)
  const role: UserRole = (currentUser?.role || canonicalRole || 'anggota_osim') as UserRole;
  const isSuperAdmin = Boolean(currentUser && canonicalRole === 'super_admin');
  const isWaka = Boolean(currentUser && canonicalRole === 'waka_kesiswaan');
  const isWakaOrAdmin = Boolean(currentUser && (isSuperAdmin || isWaka));
  const isGuruBK = Boolean(
    currentUser && (
      canonicalRole === 'guru_bk' ||
      role === 'guru_bk' ||
      (currentUser.role && (currentUser.role.toLowerCase().includes('bk') || currentUser.role.toLowerCase().includes('konselor'))) ||
      Boolean(currentUser.counselorSpecialization)
    )
  );
  const isPembinaOsim = Boolean(currentUser && canonicalRole === 'pembina_osim');
  const isPembinaEkskul = Boolean(
    currentUser && (canonicalRole === 'coach_ekstrakurikuler' || (canonicalRole as any) === 'pembina_ekstrakurikuler')
  );
  const isPengurusOsim = Boolean(currentUser && canonicalRole === 'anggota_osim');
  const isWaliKelas = Boolean(currentUser && (canonicalRole === 'wali_kelas' || role === 'wali_kelas'));
  const isGuruMapel = Boolean(currentUser && (canonicalRole === 'guru' || role === 'guru' || (role as string) === 'guru_mapel'));

  // Dukungan Multi-Assignment / Rangkap Jabatan: Guru BK yang juga membina ekstrakurikuler
  const isAlsoPembinaEkskul = Boolean(
    currentUser && (
      isPembinaEkskul ||
      (currentUser?.extracurricularIds && currentUser.extracurricularIds.length > 0) ||
      (currentUser?.assignments?.some(a => a.type === 'extracurricular')) ||
      ((currentUser as any)?.assignedExtracurriculars && (currentUser as any).assignedExtracurriculars.length > 0)
    )
  );

  const isPembina = Boolean(currentUser && (isAlsoPembinaEkskul || isPembinaOsim));
  const isTeacher = Boolean(currentUser && (isWaliKelas || isGuruMapel || isGuruBK || isPembinaEkskul || isPembinaOsim));
  const isStaffTU = Boolean(currentUser && (canonicalRole === 'staf_tu' || role === 'staf_tu'));
  const canManageLetters = Boolean(currentUser && (isSuperAdmin || isWaka || isStaffTU));

  // OSIM BPH Positions derived from Canonical Position and position aliases
  const isOsimKetua = Boolean(isPengurusOsim && osimPosition === 'ketua_osim');
  const isOsimWakil = Boolean(isPengurusOsim && osimPosition === 'wakil_ketua_osim');
  const isOsimSekretaris = Boolean(isPengurusOsim && (osimPosition === 'sekretaris_osim' || osimPosition === 'sekretaris'));
  const isOsimBendahara = Boolean(isPengurusOsim && (osimPosition === 'bendahara_osim' || osimPosition === 'bendahara'));
  const isOsimBph = Boolean(
    isPengurusOsim && (
      isOsimKetua ||
      isOsimWakil ||
      isOsimSekretaris ||
      isOsimBendahara ||
      currentUser?.osimDepartmentCode === 'BPH' ||
      currentUser?.osimDepartmentId === 'dept_bph'
    )
  );

  // Supervisi & Hak Veto Wewenang: Pembina OSIM, Waka Kesiswaan & Super Admin
  const isSupervisoryVetoAuthorized = Boolean(currentUser && (isSuperAdmin || isWaka || isPembinaOsim));

  const canAccessTab = (tabId: string): boolean => {
    // Unauthenticated visitors or accounts with invalid/denied roles cannot access any protected tabs
    if (!currentUser || !canonicalRole) return false;

    // Dashboard, Profile, Announcements Center, and Buku Tata Tertib Siswa are accessible by all authenticated users
    if (
      tabId === 'dashboard' ||
      tabId === 'profile' ||
      tabId === 'announcements' ||
      tabId === 'rules' ||
      tabId === 'handbook' ||
      tabId === 'tatib'
    ) {
      return true;
    }

    // Super admin has unrestricted root access to all tabs including cpanel and root settings
    if (isSuperAdmin) return true;

    // System Settings: Allowed for Super Admin, Waka Kesiswaan (Master Config & Kelas), or roles granted config_master in RBAC
    if (tabId === 'settings') {
      return Boolean(isWaka || canRoleViewModule(currentUser.role, 'config_master', currentUser));
    }

    // cPanel User Provisioning: Allowed for Super Admin or roles granted cpanel_users in RBAC matrix
    if (tabId === 'cpanel') {
      return Boolean(
        canRoleViewModule(currentUser.role, 'cpanel_users', currentUser) ||
        canRoleInputModule(currentUser.role, 'cpanel_users', currentUser)
      );
    }

    // Staf TU (Tata Usaha) has access to correspondence/letters, dispensations, students, reports, profile
    if (isStaffTU) {
      const allowedTuTabs = ['dashboard', 'letters', 'permissions', 'students', 'reports', 'profile', 'announcements', 'rules', 'tatib'];
      if (allowedTuTabs.includes(tabId)) return true;
    }

    // Letters Tab: Accessible to Super Admin, Waka Kesiswaan, Staf TU, and Guru BK
    if (tabId === 'letters') {
      return Boolean(isSuperAdmin || isWaka || isStaffTU || isGuruBK);
    }

    // Waka kesiswaan has access to all operational student affairs tabs + settings
    if (isWaka) {
      const allowedWakaTabs = [
        'dashboard',
        'osim',
        'students',
        'teachers',
        'extracurriculars',
        'members',
        'schedules',
        'attendance',
        'violations',
        'counseling',
        'achievements',
        'activities',
        'reports',
        'permissions',
        'letters',
        'cash',
        'cash_ledger',
        'settings',
        'profile'
      ];
      if (allowedWakaTabs.includes(tabId)) return true;
    }

    // Guru BK has access to counseling hub, discipline/violations, student directory, reports, permissions, cash (transparansi), profile
    // Dan jika Guru BK merangkap pembina ekstrakurikuler, sertakan tab ekskul binaannya!
    if (isGuruBK) {
      const allowedBkTabs = ['dashboard', 'counseling', 'violations', 'students', 'reports', 'permissions', 'letters', 'cash', 'cash_ledger', 'profile'];
      if (isAlsoPembinaEkskul) {
        allowedBkTabs.push('extracurriculars', 'members', 'schedules', 'attendance', 'activities', 'achievements');
      }
      if (allowedBkTabs.includes(tabId)) return true;
    }

    // Pembina OSIM has access to OSIM / Intrakurikuler menus, reports, activities, cash (transparansi), profile
    if (isPembinaOsim) {
      const allowedOsimTabs = ['dashboard', 'osim', 'activities', 'reports', 'cash', 'cash_ledger', 'profile'];
      if (allowedOsimTabs.includes(tabId)) return true;
    }

    // Pembina Ekstrakurikuler has access to Extracurricular menus, reports, achievements, cash (transparansi), profile
    if (isPembinaEkskul) {
      const allowedEkskulTabs = [
        'dashboard',
        'extracurriculars',
        'members',
        'schedules',
        'attendance',
        'activities',
        'reports',
        'achievements',
        'permissions',
        'cash',
        'cash_ledger',
        'profile'
      ];
      if (allowedEkskulTabs.includes(tabId)) return true;
    }

    // Anggota OSIM (Akun Fungsional Bidang/Departemen Siswa dan Pengurus Inti BPH)
    if (isPengurusOsim) {
      const allowedPengurusTabs = ['dashboard', 'osim', 'announcements', 'rules', 'tatib', 'activities', 'reports', 'profile'];
      if (checkCanManageCash() || isOsimBendahara) {
        allowedPengurusTabs.push('cash', 'cash_ledger');
      }
      if (allowedPengurusTabs.includes(tabId)) return true;
    }

    // Wali Kelas & Guru Mapel workspace
    if (isWaliKelas || isGuruMapel) {
      const allowedTeacherTabs = [
        'dashboard',
        'students',
        'violations',
        'attendance',
        'permissions',
        'reports',
        'announcements',
        'rules',
        'tatib',
        'handbook',
        'profile'
      ];
      // Jika Wali Kelas / Guru Mapel juga merangkap sebagai Pembina Ekstrakurikuler:
      if (isAlsoPembinaEkskul) {
        allowedTeacherTabs.push('extracurriculars', 'members', 'schedules', 'activities', 'achievements', 'cash', 'cash_ledger');
      }
      if (allowedTeacherTabs.includes(tabId)) return true;
    }

    // Dynamic RBAC Matrix Module checks fallback
    if (tabId === 'teachers' && canRoleViewModule(currentUser.role, 'crud_teachers', currentUser)) return true;
    if (tabId === 'violations' && canRoleViewModule(currentUser.role, 'violations_discipline', currentUser)) return true;
    if (tabId === 'counseling' && canRoleViewModule(currentUser.role, 'counseling_confidential', currentUser)) return true;
    if ((tabId === 'cash' || tabId === 'cash_ledger') && (canRoleViewModule(currentUser.role, 'cash_osim', currentUser) || checkCanManageCash())) return true;
    if (tabId === 'permissions' && canRoleViewModule(currentUser.role, 'dispensation_letters', currentUser)) return true;
    if (tabId === 'reports' && canRoleViewModule(currentUser.role, 'reports_rekap', currentUser)) return true;
    if (tabId === 'osim' && (canRoleViewModule(currentUser.role, 'osim_structure', currentUser) || canRoleViewModule(currentUser.role, 'proposal_lpj', currentUser))) return true;
    if ((tabId === 'extracurriculars' || tabId === 'members') && (canRoleViewModule(currentUser.role, 'extracurricular_grading', currentUser) || canRoleViewModule(currentUser.role, 'crud_members', currentUser))) return true;

    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        userRole: role,
        canonicalRole,
        osimPosition,
        bootstrapState,
        bootstrapError,
        hasRole: checkHasRole,
        hasPosition: checkHasPosition,
        hasScope: checkHasScope,
        hasPermission: checkHasPermission,
        canManageCash: checkCanManageCash,
        canReviewOsimProgram: checkCanReviewOsimProgram,
        canApproveOsimProgram: checkCanApproveOsimProgram,
        canManageExtracurricular: checkCanManageExtracurricular,
        isSuperAdmin,
        isWaka,
        isWakaOrAdmin,
        isGuruBK,
        isPembinaOsim,
        isPembinaEkskul,
        isAlsoPembinaEkskul,
        isPembina,
        isWaliKelas,
        isGuruMapel,
        isTeacher,
        isStaffTU,
        canManageLetters,
        isPengurusOsim,
        isOsimKetua,
        isOsimWakil,
        isOsimSekretaris,
        isOsimBendahara,
        isOsimBph,
        isSupervisoryVetoAuthorized,
        osimDepartmentId: currentUser?.osimDepartmentId,
        osimDepartmentCode: currentUser?.osimDepartmentCode,
        osimDepartmentName: currentUser?.osimDepartmentName,
        canAccessTab,
        isLoading,
        loginWithEmail,
        loginWithIdentifier,
        loginWithUser,
        loginWithDemoRole,
        switchRole: loginWithDemoRole,
        isSimulatedFromAdmin,
        returnToAdminSession,
        logout,
        updateProfileState,
        addUser,
        updateUser,
        deleteUser,
        deleteUsersBulk,
        resetUserPassword,
        changePassword,
        syncUsersFromTeachers,
        syncUsersFromOsim,
        migrateAllUsersToTidyUids,
        activateTeacherAccount,
        activateOsimAccount,
        extendSession,
        isIdleWarningOpen,
        idleCountdownSeconds
      }}
    >
      {children}
      <SessionTimeoutModal
        isOpen={isIdleWarningOpen}
        remainingSeconds={idleCountdownSeconds}
        onExtend={extendSession}
        onLogout={logout}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

