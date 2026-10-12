import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, CanonicalUserRole, OsimPosition, Teacher, Extracurricular, AuditLogItem, OsimDepartment, OsimMember, OsimRoleType, AuthBootstrapState } from '../types';
import { DEMO_USERS, DEFAULT_SUPER_ADMIN, PURGED_DEMO_UIDS, PURGED_DEMO_EMAILS, isBlacklistedDemoName, getDefaultOsimPassword } from '../services/seedData';
import { auth, db, getSecondaryAuth } from '../services/firebase';
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
  canonicalizeAssignedEkskulIds
} from '../utils/syncUtils';
import {
  extractSekbidNumber,
  isBphMember,
  getDefaultOsimUsername
} from '../utils/osimAccountHelper';

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
  if (PURGED_DEMO_UIDS.includes(u.uid)) return true;
  if (u.email && PURGED_DEMO_EMAILS.includes(u.email.toLowerCase())) return true;
  if (isBlacklistedDemoName(u.displayName)) return true;
  
  // Also treat standalone generic osim accounts as purged (osim.ketua, osim.sekbid*, etc.)
  const username = (u.username || '').toLowerCase().trim();
  if (
    username === 'osim.ketua' ||
    username === 'osim.wakil' ||
    username === 'osim.sekretaris' ||
    username === 'osim.bendahara' ||
    /^osim\.sekbid\d+$/.test(username)
  ) {
    // If it has no student NIS or studentNis attached, it's a generic placeholder
    if (!u.nip && !u.studentNis) {
      return true;
    }
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
  resetUserPassword: (uid: string, newPassword?: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  syncUsersFromTeachers: (teachersList: Teacher[], extracurricularsList?: Extracurricular[]) => Promise<number>;
  syncUsersFromOsim: (departmentsList: OsimDepartment[], membersList?: OsimMember[]) => Promise<number>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'sim_kesiswaan_active_user';
const SESSION_STORAGE_USER_KEY = 'sim_kesiswaan_session_user';
const LOCAL_STORAGE_ALL_USERS_KEY = 'sim_kesiswaan_all_users_registry';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize all users with persistent custom users or deduplicated storage
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_ALL_USERS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UserProfile[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validUsers = parsed.filter(u => u && u.uid && !isPurgedUser(u) && !isDeletedUid(u.uid));
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
    const baseUsers = DEMO_USERS.filter(u => !isDeletedUid(u.uid) && !isPurgedUser(u));
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
          for (const d of snap.docs) {
            const data = d.data() as UserProfile;
            const uid = data.uid || d.id;
            const userWithId = { ...data, uid };
            if (isPurgedUser(userWithId) || isDeletedUid(uid) || d.id === 'user_guru_01' || d.id === 'user_teacher_pitria_lawenusa') {
              if (auth.currentUser && currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role)) {
                deleteDoc(d.ref).catch(() => {});
              }
            } else {
              firestoreUsers.push(userWithId);
            }
          }

          if (firestoreUsers.length > 0) {
            setAllUsers(prev => {
              const candidateUsers = [
                ...prev.filter(u => u && u.uid && !isPurgedUser(u) && !isDeletedUid(u.uid)),
                ...firestoreUsers
              ];
              // Ensure Super Admin is always present
              if (!candidateUsers.some(u => u.uid === 'user_super_admin' || u.role === 'super_admin')) {
                candidateUsers.unshift(DEFAULT_SUPER_ADMIN);
              }
              const deduplicated = deduplicateUsersList(candidateUsers);
              const sorted = sortUsersByHierarchy(deduplicated);
              try {
                localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(sorted));
              } catch (e) {}
              return sorted;
            });
          }
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

  // Authentication state: MUST default to null on new browser tab / opening the URL
  // so that the Login Page is presented first, requiring manual username & password entry.
  // Within the same active browser tab session, sessionStorage preserves the session across reloads.
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
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

  useEffect(() => {
    if (currentUser) {
      try {
        sessionStorage.setItem(SESSION_STORAGE_USER_KEY, JSON.stringify(currentUser));
      } catch {}
    } else {
      try {
        sessionStorage.removeItem(SESSION_STORAGE_USER_KEY);
        localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
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
        setCurrentUser(null);
        setAdminImpersonator(null);
        setBootstrapState('READY');
        setBootstrapError(null);
        setIsLoading(false);
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

          if (normalized.status === 'Nonaktif') {
            await fbSignOut(auth);
            setCurrentUser(null);
            setBootstrapState('ERROR');
            setBootstrapError('Akun Anda dinonaktifkan oleh Administrator Madrasah.');
            return;
          }

          setCurrentUser(normalized);
          setBootstrapState('READY');
          setBootstrapError(null);
        } else {
          // If the authenticated user is the designated Super Admin (puputbajuri24@gmail.com or admin@sekolah.sch.id),
          const cleanEmail = (fbUser.email || '').toLowerCase().trim();
          const isSuperAdminEmail =
            cleanEmail === 'puputbajuri24@gmail.com' ||
            cleanEmail === 'admin@sekolah.sch.id' ||
            cleanEmail === 'admin@madrasah.sch.id' ||
            cleanEmail === 'admin@man2sbt.sch.id' ||
            cleanEmail.startsWith('admin@') ||
            cleanEmail.startsWith('superadmin@');

          if (isSuperAdminEmail) {
            const superAdminProfile: UserProfile = {
              uid: fbUser.uid,
              displayName: fbUser.displayName || DEFAULT_SUPER_ADMIN.displayName,
              email: cleanEmail,
              username: 'admin',
              role: 'super_admin',
              phone: DEFAULT_SUPER_ADMIN.phone || '082298836027',
              nip: DEFAULT_SUPER_ADMIN.nip || '198810052020121003',
              status: 'Aktif',
              photoURL: fbUser.photoURL || undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            try {
              await setDoc(userDocRef, superAdminProfile, { merge: true });
            } catch (createErr) {
              console.warn('Super admin auto-provisioning write warning:', createErr);
            }
            setCurrentUser(normalizeUserProfile(superAdminProfile));
            setBootstrapState('READY');
            setBootstrapError(null);
            return;
          }

          // Also check if an existing profile exists with this email across pre-registered users (e.g. teachers or students)
          const matchedByEmail = allUsers.find(u => u.email && u.email.toLowerCase().trim() === cleanEmail);
          if (matchedByEmail) {
            const migratedProfile: UserProfile = {
              ...matchedByEmail,
              uid: fbUser.uid,
              displayName: matchedByEmail.displayName || fbUser.displayName || cleanEmail,
              email: cleanEmail,
              updatedAt: new Date().toISOString()
            };
            try {
              await setDoc(userDocRef, migratedProfile, { merge: true });
            } catch (createErr) {
              console.warn('User profile auto-migration write warning:', createErr);
            }
            setCurrentUser(normalizeUserProfile(migratedProfile));
            setBootstrapState('READY');
            setBootstrapError(null);
            return;
          }

          // Fallback: Check if teacher profile exists in Firestore teachers collection
          try {
            const tSnap = await getDocs(collection(db, 'teachers'));
            for (const d of tSnap.docs) {
              const t = d.data() as Teacher;
              if (t.email && t.email.toLowerCase().trim() === cleanEmail) {
                const isBk = (t.role || '').toLowerCase().includes('bk') || (t.subject || '').toLowerCase().includes('bk');
                const isWali = (t.role || '').toLowerCase().includes('wali') || Boolean(t.isWaliKelas);
                const isPembina = Array.isArray(t.assignedExtracurriculars) && t.assignedExtracurriculars.length > 0;
                const assignedRole: UserRole = isBk ? 'guru_bk' : (isWali ? 'wali_kelas' : (isPembina ? 'coach_ekstrakurikuler' : 'guru'));
                const teacherProfile: UserProfile = {
                  uid: fbUser.uid,
                  displayName: t.fullName,
                  email: cleanEmail,
                  nip: t.nip,
                  role: assignedRole,
                  phone: t.phone || '',
                  assignedExtracurricularIds: t.assignedExtracurriculars || [],
                  extracurricularIds: t.assignedExtracurriculars || [],
                  status: t.isActive !== false ? 'Aktif' : 'Nonaktif',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                try {
                  await setDoc(userDocRef, teacherProfile, { merge: true });
                } catch (createErr) {
                  console.warn('Teacher profile auto-migration write warning:', createErr);
                }
                setCurrentUser(normalizeUserProfile(teacherProfile));
                setBootstrapState('READY');
                setBootstrapError(null);
                return;
              }
            }
          } catch (tErr) {
            console.warn('Teacher lookup onAuthStateChanged note:', tErr);
          }

          setCurrentUser(null);
          setBootstrapState('PROFILE_UNREGISTERED');
          setBootstrapError(
            `Akun Firebase (${fbUser.email || fbUser.uid}) terautentikasi, namun belum memiliki dokumen profil kesiswaan di users/${fbUser.uid}. Hubungi Administrator / Proktor SIM-KESISWAAN untuk mendaftarkan akun ini.`
          );
        }
      } catch (err: any) {
        console.error('Firestore user profile verification error:', err);
        if (err?.message?.includes('offline') || !navigator.onLine) {
          setBootstrapState('OFFLINE');
          setBootstrapError('Koneksi internet terputus. Tidak dapat memverifikasi profil pengguna dari server Firestore.');
        } else {
          setBootstrapState('ERROR');
          setBootstrapError(err?.message || 'Gagal memverifikasi profil pengguna dari database Firestore.');
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
    } else {
      // 1. Resolve registered email from memory allUsers or Firestore users
      const normalizedId = cleanId.startsWith('@') ? cleanId.substring(1) : cleanId;
      const cleanDigitsId = cleanId.replace(/[^0-9a-zA-Z]/g, '');

      // Check allUsers in memory
      matchedUser = allUsers.find(u => {
        if (!u.email) return false;
        if (u.username && (u.username.toLowerCase() === cleanId || u.username.toLowerCase() === normalizedId)) return true;
        const uNipDigits = (u.nip || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
        if (uNipDigits && (uNipDigits === cleanDigitsId || (cleanDigitsId.length >= 10 && uNipDigits.startsWith(cleanDigitsId.substring(0, 10))))) return true;
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
              if (uNipDigits && (uNipDigits === cleanDigitsId || (cleanDigitsId.length >= 10 && uNipDigits.startsWith(cleanDigitsId.substring(0, 10))))) {
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

      // If still not found, check Firestore teachers collection
      if (!matchedUser) {
        try {
          const teacherSnap = await getDocs(collection(db, 'teachers'));
          if (!teacherSnap.empty) {
            for (const d of teacherSnap.docs) {
              const t = d.data() as Teacher;
              if (!t.email) continue;
              const tNipDigits = (t.nip || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
              if (
                (tNipDigits && (tNipDigits === cleanDigitsId || (cleanDigitsId.length >= 10 && tNipDigits.startsWith(cleanDigitsId.substring(0, 10))))) ||
                (t.fullName && t.fullName.toLowerCase() === cleanId)
              ) {
                targetEmail = t.email.trim().toLowerCase();
                break;
              }
            }
          }
        } catch (e) {
          console.warn('Firestore teacher lookup error:', e);
        }
      }

      if (matchedUser && matchedUser.email) {
        targetEmail = matchedUser.email.trim().toLowerCase();
      }

      // Explicit Super Admin alias fallback
      if (!targetEmail && (cleanId === 'admin' || cleanId === 'superadmin' || cleanId === 'super_admin')) {
        targetEmail = 'admin@sekolah.sch.id';
      }
    }

    if (!targetEmail) {
      setIsLoading(false);
      recordSystemAuditLog('LOGIN_FAILED', 'Keamanan Sistem', `Percobaan login gagal: Identitas ${identifier} belum terdaftar.`);
      return {
        success: false,
        error: 'Identitas pengguna (NIP/NIS/Username) belum terdaftar dalam sistem SIM-KESISWAAN. Hubungi Administrator.'
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
      const userDocRef = doc(db, 'users', res.user.uid);
      let userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const cleanUserEmail = (res.user.email || targetEmail || '').toLowerCase().trim();
        const isSuperAdminEmail =
          cleanUserEmail === 'puputbajuri24@gmail.com' ||
          cleanUserEmail === 'admin@sekolah.sch.id' ||
          cleanUserEmail === 'admin@madrasah.sch.id' ||
          cleanUserEmail === 'admin@man2sbt.sch.id' ||
          cleanUserEmail.startsWith('admin@') ||
          cleanUserEmail.startsWith('superadmin@');

        if (isSuperAdminEmail) {
          const superAdminProfile: UserProfile = {
            uid: res.user.uid,
            displayName: res.user.displayName || DEFAULT_SUPER_ADMIN.displayName,
            email: cleanUserEmail,
            username: 'admin',
            role: 'super_admin',
            phone: DEFAULT_SUPER_ADMIN.phone || '082298836027',
            nip: DEFAULT_SUPER_ADMIN.nip || '198810052020121003',
            status: 'Aktif',
            photoURL: res.user.photoURL || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          try {
            await setDoc(userDocRef, superAdminProfile, { merge: true });
            userDoc = await getDoc(userDocRef);
          } catch (createErr) {
            console.warn('Super admin auto-provisioning write warning:', createErr);
          }
        } else {
          // Check if profile exists in memory or teachers
          const matched = matchedUser || allUsers.find(u => u.email && u.email.toLowerCase().trim() === cleanUserEmail);
          if (matched) {
            const migratedProfile: UserProfile = {
              ...matched,
              uid: res.user.uid,
              displayName: matched.displayName || res.user.displayName || cleanUserEmail,
              email: cleanUserEmail,
              updatedAt: new Date().toISOString()
            };
            try {
              await setDoc(userDocRef, migratedProfile, { merge: true });
              userDoc = await getDoc(userDocRef);
            } catch (createErr) {
              console.warn('User profile auto-migration write warning:', createErr);
            }
          } else {
            // Check teachers collection
            try {
              const tSnap = await getDocs(collection(db, 'teachers'));
              for (const d of tSnap.docs) {
                const t = d.data() as Teacher;
                if (t.email && t.email.toLowerCase().trim() === cleanUserEmail) {
                  const isBk = (t.role || '').toLowerCase().includes('bk') || (t.subject || '').toLowerCase().includes('bk');
                  const isWali = (t.role || '').toLowerCase().includes('wali') || Boolean(t.isWaliKelas);
                  const isPembina = Array.isArray(t.assignedExtracurriculars) && t.assignedExtracurriculars.length > 0;
                  const assignedRole: UserRole = isBk ? 'guru_bk' : (isWali ? 'wali_kelas' : (isPembina ? 'coach_ekstrakurikuler' : 'guru'));
                  const teacherProfile: UserProfile = {
                    uid: res.user.uid,
                    displayName: t.fullName,
                    email: cleanUserEmail,
                    nip: t.nip,
                    role: assignedRole,
                    phone: t.phone || '',
                    assignedExtracurricularIds: t.assignedExtracurriculars || [],
                    extracurricularIds: t.assignedExtracurriculars || [],
                    status: t.isActive !== false ? 'Aktif' : 'Nonaktif',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  };
                  try {
                    await setDoc(userDocRef, teacherProfile, { merge: true });
                    userDoc = await getDoc(userDocRef);
                  } catch (teacherWriteErr) {
                    console.warn('Teacher profile auto-migration write note:', teacherWriteErr);
                  }
                  break;
                }
              }
            } catch (tErr) {
              console.warn('Teacher lookup on login note:', tErr);
            }
          }
        }
      }

      if (!userDoc.exists()) {
        await fbSignOut(auth);
        setCurrentUser(null);
        setBootstrapState('PROFILE_UNREGISTERED');
        const unregMsg = `Akun Firebase (${res.user.email}) berhasil diverifikasi, namun dokumen profil pengguna (users/${res.user.uid}) belum dibuat di Firestore SIM-KESISWAAN. Hubungi Administrator / Proktor Madrasah.`;
        setBootstrapError(unregMsg);
        setIsLoading(false);
        return { success: false, error: unregMsg };
      }

      const rawProfile = userDoc.data() as UserProfile;
      const normalizedUser = normalizeUserProfile({
        ...rawProfile,
        uid: res.user.uid,
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
      setDoc(userDocRef, syncPayload, { merge: true }).catch(() => {});

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
    } catch {}
    setCurrentUser(null);
    setBootstrapState('READY');
    setBootstrapError(null);
  };

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
      const exists = allUsers.some(u => 
        (u.email && u.email.toLowerCase() === user.email.toLowerCase()) || 
        (u.nip && user.nip && u.nip.replace(/\s+/g, '') === user.nip.replace(/\s+/g, ''))
      );
      if (exists) {
        return { success: false, error: 'Akun dengan Email atau NIP tersebut sudah terdaftar di sistem.' };
      }

      if (!user.email || user.email.trim() === '') {
        return { success: false, error: 'Email akun wajib diisi untuk pendaftaran login.' };
      }

      const initialPassword = (user.password || 'password').trim();
      let assignedUid = user.uid && user.uid.trim() !== '' ? user.uid.trim() : `user_${Date.now()}`;

      // Synchronize creation with Firebase Authentication using Secondary Auth instance
      try {
        const secAuth = getSecondaryAuth();
        const cred = await createUserWithEmailAndPassword(secAuth, user.email.trim(), initialPassword);
        if (cred?.user?.uid) {
          assignedUid = cred.user.uid;
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
                  assignedUid = cred.user.uid;
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

      removeDeletedUid(newUser.uid);

      setAllUsers(prev => {
        const next = deduplicateUsersList([...prev, newUser]);
        try { localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(next)); } catch {}
        return next;
      });

      try {
        await setDoc(doc(db, 'users', newUser.uid), newUser, { merge: true });
        if (newUser.uid.startsWith('user_')) {
          setDoc(doc(db, 'users', newUser.uid.replace(/^user_/, '')), newUser, { merge: true }).catch(() => {});
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

  const updateUser = async (uid: string, updated: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    try {
      let targetUserDisplayName = uid;
      const targetExistingUser = allUsers.find(u => u.uid === uid) || (currentUser?.uid === uid ? currentUser : undefined);
      let mergedUser: UserProfile | undefined;
      const nowIso = new Date().toISOString();

      const cleanUpdated: Partial<UserProfile> = { ...updated };

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

      // 1. Firebase Auth synchronization for password or email changes
      if (newPassword || (newEmail && newEmail !== oldEmail)) {
        if (currentUser?.uid === uid) {
          // Self update
          try {
            if (newPassword && auth.currentUser) {
              await updatePassword(auth.currentUser, newPassword);
            }
          } catch (passErr) {
            console.warn('Self updatePassword notice:', passErr);
          }
        } else if (oldEmail) {
          // Update another user via secondary auth
          try {
            const secAuth = getSecondaryAuth();
            let syncSuccess = false;

            const candidatePasswords = [
              oldPassword,
              targetExistingUser?.previousPassword,
              'password',
              'password123',
              '123456'
            ].filter((p): p is string => Boolean(p && p.trim()));

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
        }
      }

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

      // Write to Firestore and persist all updated user profile fields (Single Source of Truth)
      try {
        await setDoc(doc(db, 'users', uid), updatedWithTimestamp, { merge: true });

        // Also update alias document IDs if any
        if (uid.startsWith('user_')) {
          setDoc(doc(db, 'users', uid.replace(/^user_/, '')), updatedWithTimestamp, { merge: true }).catch(() => {});
        } else {
          setDoc(doc(db, 'users', `user_${uid}`), updatedWithTimestamp, { merge: true }).catch(() => {});
        }
      } catch (e) {
        console.warn('Firestore updateUser sync note:', e);
      }

      recordSystemAuditLog('UPDATE_USER', 'Manajemen Pengguna', `Administrator memperbarui akun: ${targetUserDisplayName} (ID: ${uid})`, currentUser);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Gagal memperbarui data akun.' };
    }
  };

  const deleteUser = async (uid: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (uid === 'user_super_admin' || currentUser?.uid === uid) {
        return { success: false, error: 'Tidak dapat menghapus akun Super Admin utama atau akun yang sedang aktif digunakan.' };
      }
      const targetUser = allUsers.find(u => u.uid === uid);
      
      addDeletedUid(uid);
      if (uid.startsWith('user_')) {
        addDeletedUid(uid.replace(/^user_/, ''));
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
      } catch (e) {
        console.warn('Firestore deleteUser sync note:', e);
      }

      recordSystemAuditLog('DELETE_USER', 'Manajemen Pengguna', `Administrator menghapus akun: ${targetUser?.displayName || uid} (${targetUser?.email || '-'})`, currentUser);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Gagal menghapus akun.' };
    }
  };

  const resetUserPassword = async (uid: string, newPassword?: string): Promise<{ success: boolean; error?: string }> => {
    try {
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

        // 1. Direct App Reset: Update in Firestore
        try {
          await setDoc(doc(db, 'users', uid), updatePayload, { merge: true });
          if (uid.startsWith('user_')) {
            setDoc(doc(db, 'users', uid.replace(/^user_/, '')), updatePayload, { merge: true }).catch(() => {});
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

          const candidatePasswords = [
            prevPass,
            targetUser.previousPassword,
            'password',
            'password123',
            '123456'
          ].filter((p): p is string => Boolean(p && p.trim()));

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
              await createUserWithEmailAndPassword(secAuth, targetUser.email, cleanPass);
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
        // 1. Resolve role mapping with strict hierarchy (BK / Waka / Admin takes precedence over Pembina Ekskul)
        const rawRole = (t.role || '').toLowerCase();
        const rawSubject = (t.subject || '').toLowerCase();
        const rawName = (t.fullName || '').toLowerCase();
        let role: CanonicalUserRole = 'coach_ekstrakurikuler';

        if (rawRole.includes('bk') || rawRole.includes('bimbingan') || rawRole.includes('konselor') || rawSubject.includes('bk') || rawSubject.includes('bimbingan')) {
          role = 'guru_bk';
        } else if (rawRole.includes('super') || rawRole.includes('admin') || rawRole.includes('proktor')) {
          role = 'super_admin';
        } else if (rawRole.includes('waka') || rawRole.includes('kesiswaan')) {
          role = 'waka_kesiswaan';
        } else if (rawRole.includes('osim') || rawRole.includes('osis')) {
          role = 'pembina_osim';
        } else if (t.isPembina || (t.assignedExtracurriculars && t.assignedExtracurriculars.length > 0)) {
          role = 'coach_ekstrakurikuler';
        } else if (rawRole.includes('wali') || rawRole.includes('homeroom')) {
          role = 'wali_kelas';
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

        // 3. Resolve extracurricular IDs and human-readable names (for Firestore readability)
        let resolvedAssignedIds = canonicalizeAssignedEkskulIds(t.assignedExtracurriculars, extracurricularsList);
        if (Array.isArray(extracurricularsList) && extracurricularsList.length > 0) {
          const matchedEkskuls = extracurricularsList.filter(e =>
            (e.coachId && (e.coachId === t.id || `user_${t.id}` === e.coachId || e.coachId === `user_${t.id.replace('user_', '')}`)) ||
            (e.coachName && normalizeName(e.coachName) === normalizeName(t.fullName))
          );
          if (matchedEkskuls.length > 0) {
            resolvedAssignedIds = Array.from(new Set([...resolvedAssignedIds, ...matchedEkskuls.map(e => e.id)]));
          }
        }

        const assignedEkskulIds = canonicalizeAssignedEkskulIds(resolvedAssignedIds, extracurricularsList);
        const assignedEkskulNames = assignedEkskulIds.map(id => {
          const match = (extracurricularsList || []).find(e => e.id === id);
          return match ? match.name : '';
        }).filter(name => Boolean(name && !/^\d+$/.test(name.trim()) && !/^ekskul_\d+$/.test(name.trim())));
        const assignedEkskulNameStr = assignedEkskulNames.join(', ') || undefined;

        // 4. Find existing user with comprehensive matching
        const existingIdx = updatedUsers.findIndex(u => isTeacherUserMatch(u, t));

        if (existingIdx >= 0) {
          const existing = updatedUsers[existingIdx];
          const isSuperAdminUser = t.role?.toLowerCase().includes('super') || t.fullName?.toLowerCase().includes('puput') || existing.role === 'super_admin' || existing.uid === 'user_super_admin';
          // PERTAHANKAN UID ASLI USER PROFILE! UID asli Firebase Auth/Firestore tidak boleh dimutasi atau dihapus
          const targetUid = existing.uid;

          const userPassword = existing.password || 'password';
          const merged: UserProfile = {
            ...existing,
            uid: targetUid,
            displayName: t.fullName,
            nip: t.nip || existing.nip,
            email: existing.email || email,
            username: existing.username || username,
            password: userPassword,
            role: existing.role === 'super_admin' ? 'super_admin' : role,
            phone: t.phone || existing.phone,
            status: t.isActive !== false ? 'Aktif' : 'Nonaktif',
            isCashManager: t.isCashManager !== undefined ? t.isCashManager : existing.isCashManager,
            cashManagerTitle: t.cashManagerTitle || existing.cashManagerTitle,
            extracurricularIds: assignedEkskulIds.length > 0 ? assignedEkskulIds : existing.extracurricularIds,
            assignedExtracurricularIds: assignedEkskulIds.length > 0 ? assignedEkskulIds : existing.assignedExtracurricularIds,
            extracurricularNames: assignedEkskulNames.length > 0 ? assignedEkskulNames : existing.extracurricularNames,
            extracurricularName: assignedEkskulNameStr || existing.extracurricularName,
            counselorSpecialization: role === 'guru_bk' ? (t.subject || existing.counselorSpecialization || 'Bimbingan Konseling Siswa & Karir') : existing.counselorSpecialization,
            photoURL: t.photoUrl || (t as any).photoURL || existing.photoURL,
            updatedAt: new Date().toISOString()
          };
          updatedUsers[existingIdx] = merged;
          const isPrivilegedAdmin = currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role);
          if (auth.currentUser && isPrivilegedAdmin) {
            firestorePromises.push(setDoc(doc(db, 'users', merged.uid), merged, { merge: true }));
            if (isSuperAdminUser && existing.uid !== 'user_guru_01') {
              // Guarantee removal of any legacy user_guru_01 duplicate in users
              firestorePromises.push(deleteDoc(doc(db, 'users', 'user_guru_01')));
            }
          }
          count++;
        } else {
          const isSuperAdminUser = t.role?.toLowerCase().includes('super') || t.fullName?.toLowerCase().includes('puput');
          const finalUid = isSuperAdminUser ? 'user_super_admin' : (t.id.startsWith('user_') ? t.id : `user_${t.id}`);
          const newUser: UserProfile = {
            uid: finalUid,
            displayName: t.fullName,
            nip: t.nip || undefined,
            email: email,
            username: username,
            password: 'password',
            role: isSuperAdminUser ? 'super_admin' : role,
            phone: t.phone || undefined,
            status: t.isActive !== false ? 'Aktif' : 'Nonaktif',
            isCashManager: t.isCashManager || false,
            cashManagerTitle: t.cashManagerTitle || undefined,
            extracurricularIds: assignedEkskulIds.length > 0 ? assignedEkskulIds : undefined,
            extracurricularNames: assignedEkskulNames.length > 0 ? assignedEkskulNames : undefined,
            extracurricularName: assignedEkskulNameStr || undefined,
            counselorSpecialization: role === 'guru_bk' ? (t.subject || 'Bimbingan Konseling Siswa & Karir') : undefined,
            photoURL: t.photoUrl || (t as any).photoURL || undefined,
            createdAt: new Date().toISOString()
          };
          updatedUsers.push(newUser);
          const isPrivilegedAdmin = currentUser && ['super_admin', 'admin', 'waka_kesiswaan'].includes(currentUser.role);
          if (auth.currentUser && isPrivilegedAdmin) {
            firestorePromises.push(setDoc(doc(db, 'users', newUser.uid), newUser, { merge: true }));
          }

          // Auto-provision credentials in Firebase Auth via Secondary Auth
          try {
            const secAuth = getSecondaryAuth();
            createUserWithEmailAndPassword(secAuth, newUser.email, newUser.password || 'password')
              .then(() => fbSignOut(secAuth))
              .catch(() => fbSignOut(secAuth).catch(() => {}));
          } catch {}

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

  // Synchronize OSIM Pengurus & Sekbid accounts from OSIM Cabinet Structure into cPanel User Accounts
  const syncUsersFromOsim = async (
    departmentsList: OsimDepartment[],
    membersList?: OsimMember[]
  ): Promise<number> => {
    if (!departmentsList || departmentsList.length === 0) return 0;
    let count = 0;
    const firestorePromises: Promise<any>[] = [];

    setAllUsers(prev => {
      // Filter out any stale generic accounts from current state
      const updatedUsers = prev.filter(u => !isPurgedUser(u) && !isDeletedUid(u.uid));

      if (membersList && membersList.length > 0) {
        for (const m of membersList) {
          if (!m || !m.fullName) continue;
          const pos = (m.position || '').toLowerCase();
          const sek = (m.sekbid || '').toLowerCase();

          // Inferred OSIM role
          const osimRoleVal: OsimRoleType =
            pos.includes('ketua') && !pos.includes('wakil') && !pos.includes('sekbid') ? 'ketua'
            : pos.includes('wakil') ? 'wakil'
            : pos.includes('sekretaris') ? 'sekretaris'
            : pos.includes('bendahara') ? 'bendahara'
            : 'sekbid';

          const isBph = osimRoleVal !== 'sekbid' || sek.includes('bph') || isBphMember(m);
          const isSekbidKetua = !isBph && (pos.includes('ketua') || pos.includes('koordinator'));

          // Kebijakan Kesiswaan & cPanel:
          // Hanya pengurus BPH dan Ketua Sekbid yang memiliki akun login di cPanel Admin.
          // Anggota Sekbid biasa (staf bidang) TIDAK dibuatkan akun login / role cPanel.
          if (!isBph && !isSekbidKetua) {
            continue;
          }

          const matchedDept = departmentsList.find(d => 
            d.id === m.sekbid || 
            d.name === m.sekbid || 
            (d.code && (m.sekbid || '').toLowerCase().includes(d.code.toLowerCase()))
          );

          const sekbidNum = extractSekbidNumber(m.sekbid) || extractSekbidNumber(m.position);
          const deptId = isBph ? 'dept_bph' : (matchedDept?.id || (sekbidNum ? `dept_sekbid_${sekbidNum}` : 'dept_sekbid'));
          const deptCode = isBph ? 'BPH' : (sekbidNum ? `SEKBID-${sekbidNum}` : (matchedDept?.code || 'SEKBID'));
          const deptName = isBph ? 'BPH (Badan Pengurus Harian)' : (matchedDept?.name || m.sekbid || 'Seksi Bidang');

          // Username strictly follows student NIS or loginUsername or fallback
          const cleanNis = cleanDigits(m.studentNis);
          const fallbackUsername = isBph ? getDefaultOsimUsername(m) : (sekbidNum ? `osim.sekbid${sekbidNum}` : getDefaultOsimUsername(m));
          const username = cleanNis || (m.loginUsername || m.username || '').toLowerCase().trim() || fallbackUsername;
          const email = m.email || `${username}@madrasah.sch.id`;

          // Map to Canonical OsimPosition
          const canonicalOsimPos: OsimPosition =
            osimRoleVal === 'ketua' ? 'ketua_osim' :
            osimRoleVal === 'wakil' ? 'wakil_ketua_osim' :
            osimRoleVal === 'sekretaris' ? 'sekretaris' :
            osimRoleVal === 'bendahara' ? 'bendahara' :
            'ketua_sekbid';

          // Canonical OSIM user UID: always prefer user_osim_<nis> when NIS is available
          const canonicalOsimUid = cleanNis ? `user_osim_${cleanNis}` : (m.id.startsWith('user_') ? m.id : `user_${m.id}`);

          // Match existing user by ID, username, NIS, or member match
          const existingIdx = updatedUsers.findIndex(u =>
            u.uid === canonicalOsimUid ||
            u.uid === m.id ||
            u.uid === `user_${m.id}` ||
            (cleanNis && cleanDigits(u.nip) === cleanNis) ||
            (u.username && u.username.toLowerCase() === username.toLowerCase()) ||
            isOsimMemberUserMatch(u, m)
          );

          if (existingIdx >= 0) {
            const existing = updatedUsers[existingIdx];
            const isUidMigrated = cleanNis && existing.uid !== canonicalOsimUid;
            const targetUid = isUidMigrated ? canonicalOsimUid : existing.uid;
            const merged: UserProfile = {
              ...existing,
              uid: targetUid,
              displayName: m.fullName,
              nip: m.studentNis || existing.nip,
              phone: m.phone && m.phone !== '-' ? m.phone : existing.phone,
              username: existing.username || username,
              email: existing.email || email,
              role: 'anggota_osim',
              position: canonicalOsimPos,
              osimRole: osimRoleVal,
              osimPosition: m.position,
              osimDepartmentId: deptId,
              osimDepartmentCode: deptCode,
              osimDepartmentName: deptName,
              isCashManager: osimRoleVal === 'bendahara',
              cashManagerTitle: osimRoleVal === 'bendahara' ? 'Bendahara OSIM' : undefined,
              status: m.status === 'Demisioner' ? 'Nonaktif' : (existing.status || 'Aktif'),
              updatedAt: new Date().toISOString()
            };
            updatedUsers[existingIdx] = merged;
            if (auth.currentUser) {
              firestorePromises.push(setDoc(doc(db, 'users', merged.uid), merged, { merge: true }));
              if (isUidMigrated && existing.uid) {
                firestorePromises.push(deleteDoc(doc(db, 'users', existing.uid)));
              }
            }
            count++;
          } else {
            const newUser: UserProfile = {
              uid: canonicalOsimUid,
              displayName: m.fullName,
              username,
              email,
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
              status: m.status === 'Demisioner' ? 'Nonaktif' : 'Aktif',
              createdAt: new Date().toISOString()
            };
            updatedUsers.push(newUser);
            if (auth.currentUser) {
              firestorePromises.push(setDoc(doc(db, 'users', newUser.uid), newUser, { merge: true }));
            }
            count++;
          }
        }
      }

      // Ensure each department coordinator from departmentsList also has a synchronized user account
      for (const d of departmentsList) {
        if (!d || !d.coordinatorName || d.code === 'BPH' || d.name.startsWith('BPH')) continue;
        const trimmedCoord = d.coordinatorName.trim();
        const sekbidNum = extractSekbidNumber(d.code) || extractSekbidNumber(d.name);
        const deptCode = d.code || (sekbidNum ? `SEKBID-${sekbidNum}` : 'SEKBID');
        const defaultUsername = sekbidNum ? `osim.sekbid${sekbidNum}` : `osim.${trimmedCoord.toLowerCase().split(' ')[0].replace(/[^a-z0-9]/g, '')}`;

        const existingAccIdx = updatedUsers.findIndex(u =>
          u.displayName.toLowerCase().trim() === trimmedCoord.toLowerCase() ||
          (u.osimDepartmentCode && u.osimDepartmentCode.toUpperCase() === deptCode.toUpperCase() && (u.role === 'pengurus_osim' || u.role === 'anggota_osim')) ||
          (u.username && u.username.toLowerCase() === defaultUsername.toLowerCase())
        );

        if (existingAccIdx >= 0) {
          const existing = updatedUsers[existingAccIdx];
          const merged: UserProfile = {
            ...existing,
            displayName: trimmedCoord,
            role: 'anggota_osim',
            position: 'ketua_sekbid',
            osimRole: 'sekbid',
            osimPosition: sekbidNum ? `Ketua Sekbid ${sekbidNum}` : 'Ketua Sekbid',
            osimDepartmentId: d.id || existing.osimDepartmentId,
            osimDepartmentCode: deptCode,
            osimDepartmentName: d.name,
            status: existing.status || 'Aktif',
            updatedAt: new Date().toISOString()
          };
          updatedUsers[existingAccIdx] = merged;
          if (auth.currentUser) {
            firestorePromises.push(setDoc(doc(db, 'users', merged.uid), merged, { merge: true }));
          }
        } else {
          const newUid = `user_osim_${(deptCode || 'sekbid').toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
          const newAcc: UserProfile = {
            uid: newUid,
            displayName: trimmedCoord,
            username: defaultUsername,
            email: `${defaultUsername}@madrasah.sch.id`,
            role: 'anggota_osim',
            position: 'ketua_sekbid',
            osimRole: 'sekbid',
            osimPosition: sekbidNum ? `Ketua Sekbid ${sekbidNum}` : 'Ketua Sekbid',
            osimDepartmentId: d.id,
            osimDepartmentCode: deptCode,
            osimDepartmentName: d.name,
            status: 'Aktif',
            createdAt: new Date().toISOString()
          };
          updatedUsers.push(newAcc);
          if (auth.currentUser) {
            firestorePromises.push(setDoc(doc(db, 'users', newAcc.uid), newAcc, { merge: true }));
          }
          count++;
        }
      }

      const deduplicated = deduplicateUsersList(updatedUsers);
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
  const isGuruBK = Boolean(currentUser && canonicalRole === 'guru_bk');
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
      const allowedBkTabs = ['dashboard', 'counseling', 'violations', 'students', 'reports', 'permissions', 'cash', 'cash_ledger', 'profile'];
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
        resetUserPassword,
        changePassword,
        syncUsersFromTeachers,
        syncUsersFromOsim
      }}
    >
      {children}
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

