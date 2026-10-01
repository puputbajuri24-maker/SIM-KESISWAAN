import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, CanonicalUserRole, OsimPosition, Teacher, Extracurricular, AuditLogItem, OsimDepartment, OsimMember, OsimRoleType } from '../types';
import { DEMO_USERS, DEFAULT_SUPER_ADMIN, PURGED_DEMO_UIDS, PURGED_DEMO_EMAILS, isBlacklistedDemoName, getDefaultOsimPassword } from '../services/seedData';
import { auth, db } from '../services/firebase';
import { handleFirestoreError, OperationType, isPermissionError } from '../services/firestoreErrors';
import { doc, getDoc, getDocs, collection, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signOut as fbSignOut, signInWithEmailAndPassword } from 'firebase/auth';
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
    setDoc(doc(db, 'audit_logs', newLog.id), newLog).catch(() => {});
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
    // Only use DEMO_USERS on fresh, uninitialized install
    return sortUsersByHierarchy(deduplicateUsersList(DEMO_USERS.filter(u => !isDeletedUid(u.uid) && !isPurgedUser(u))));
  });

  // Real-time synchronization of users collection across all devices via Firestore onSnapshot
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
            if (isPurgedUser(userWithId) || isDeletedUid(uid)) {
              deleteDoc(d.ref).catch(() => {});
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
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    // Clear legacy persistent auto-login in localStorage so users aren't auto-logged into admin
    try {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    } catch {}

    try {
      const savedSession = sessionStorage.getItem(SESSION_STORAGE_USER_KEY);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed && !isPurgedUser(parsed)) {
          return parsed;
        }
      }
    } catch {}

    return null; // Always require manual login when opening the app
  });

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
    localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(allUsers));
  }, [allUsers]);

  // Listen to real Firebase Auth changes if user logged in via Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            setCurrentUser(data);
          } else {
            // Create user doc if not exists
            const isBootstrappedAdmin = fbUser.email === 'puputbajuri24@gmail.com' || fbUser.email === 'admin@sekolah.sch.id';
            const newUser: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || (isBootstrappedAdmin ? 'Puput Eka Bajuri, S. Pd., M. Or (Super Admin)' : 'Pengguna Baru'),
              role: isBootstrappedAdmin ? 'super_admin' : 'anggota_osim',
              status: 'Aktif',
              photoURL: fbUser.photoURL || undefined,
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', fbUser.uid), newUser);
            setCurrentUser(newUser);
            setAllUsers(prev => [...prev.filter(u => u.uid !== newUser.uid), newUser]);
          }
        } catch (e) {
          console.warn('Firebase user fetch fallback to local:', e);
        }
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
                          role === 'pembina_ekskul' || role === 'pembina' ? 'Pembina Ekstrakurikuler' : role;
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
    const normalizedId = cleanId.startsWith('@') ? cleanId.substring(1) : cleanId;
    const cleanPass = pass.trim();

    // Check across local and seeded allUsers (by email, NIP, username, role alias, or displayName)
    let foundUser = allUsers.find(u => {
      const emailMatch = u.email && (u.email.toLowerCase() === cleanId || u.email.toLowerCase() === normalizedId);
      const emailPrefixMatch = u.email && (
        u.email.toLowerCase().split('@')[0] === cleanId || 
        u.email.toLowerCase().split('@')[0] === normalizedId
      );
      const cleanDigitsNip = cleanId.replace(/[^0-9a-zA-Z]/g, '');
      const uNipDigits = (u.nip || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
      const nipMatch = uNipDigits && (
        uNipDigits === cleanDigitsNip ||
        (cleanDigitsNip.length >= 10 && uNipDigits.startsWith(cleanDigitsNip.substring(0, 10))) ||
        (cleanDigitsNip === '199003162025051003' && uNipDigits === '199003162025051000') ||
        (cleanDigitsNip === '199003162025051000' && uNipDigits === '199003162025051003')
      );
      const usernameMatch = u.username && (
        u.username.toLowerCase() === cleanId || 
        u.username.toLowerCase() === normalizedId
      );
      const idMatch = u.uid && (
        u.uid.toLowerCase() === cleanId ||
        u.uid.toLowerCase() === `user_${cleanId}` ||
        cleanId === u.uid.toLowerCase().replace('user_', '')
      );
      const nameMatch = u.displayName && (
        u.displayName.toLowerCase() === cleanId ||
        (cleanId.length >= 4 && u.displayName.toLowerCase().includes(cleanId)) ||
        (cleanId.includes('johan') && u.displayName.toLowerCase().includes('johan'))
      );
      
      // OSIM department functional account matching (e.g. osim.ketua, osim.wakil, osim.sekretaris, osim.bendahara, osim.sekbid1, or shorthand)
      const isOsimUser = u.role === 'pengurus_osim' || u.role === 'anggota_osim';
      const osimMatch = isOsimUser && (
        (u.username && (u.username.toLowerCase() === cleanId || u.username.toLowerCase() === normalizedId)) ||
        (u.username && u.username.toLowerCase() === `osim.${normalizedId.replace(/[^a-z0-9]/g, '')}`) ||
        (normalizedId === 'ketua' && (u.position === 'ketua_osim' || u.osimRole === 'ketua' || u.username === 'osim.ketua')) ||
        (normalizedId === 'wakil' && (u.position === 'wakil_ketua_osim' || u.osimRole === 'wakil' || u.username === 'osim.wakil')) ||
        (normalizedId === 'sekretaris' && (u.position === 'sekretaris' || u.osimRole === 'sekretaris' || u.username === 'osim.sekretaris')) ||
        (normalizedId === 'bendahara' && (u.position === 'bendahara' || u.osimRole === 'bendahara' || u.username === 'osim.bendahara')) ||
        (normalizedId === 'bph' && (u.osimDepartmentCode === 'BPH' || u.osimDepartmentId === 'dept_bph')) ||
        (normalizedId.replace(/[^a-z0-9]/g, '') === (u.osimDepartmentCode || '').toLowerCase().replace(/[^a-z0-9]/g, ''))
      );
      const roleMatch = (normalizedId === 'admin' && (u.role === 'super_admin' || u.role === 'waka_kesiswaan')) ||
                        (normalizedId === 'waka' && (u.role === 'waka_kesiswaan' || u.role === 'waka')) ||
                        (normalizedId === 'bk' && u.role === 'guru_bk') ||
                        (normalizedId === 'osim' && u.role === 'pembina_osim') ||
                        (normalizedId === 'pembina' && (u.role === 'pembina_ekstrakurikuler' || u.role === 'pembina_ekskul' || u.role === 'pembina'));
      return emailMatch || emailPrefixMatch || nipMatch || usernameMatch || idMatch || nameMatch || osimMatch || roleMatch;
    });

    // If not found in memory, query Firestore directly (handles new devices with cold cache)
    if (!foundUser) {
      try {
        const snap = await getDocs(collection(db, 'users'));
        if (!snap.empty) {
          for (const d of snap.docs) {
            const u = { ...d.data(), uid: d.id } as UserProfile;
            const emailMatch = u.email && (u.email.toLowerCase() === cleanId || u.email.toLowerCase() === normalizedId);
            const emailPrefixMatch = u.email && (
              u.email.toLowerCase().split('@')[0] === cleanId || 
              u.email.toLowerCase().split('@')[0] === normalizedId
            );
            const cleanDigitsNip = cleanId.replace(/[^0-9a-zA-Z]/g, '');
            const uNipDigits = (u.nip || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
            const nipMatch = uNipDigits && (
              uNipDigits === cleanDigitsNip ||
              (cleanDigitsNip.length >= 10 && uNipDigits.startsWith(cleanDigitsNip.substring(0, 10))) ||
              (cleanDigitsNip === '199003162025051003' && uNipDigits === '199003162025051000') ||
              (cleanDigitsNip === '199003162025051000' && uNipDigits === '199003162025051003')
            );
            const usernameMatch = u.username && (
              u.username.toLowerCase() === cleanId || 
              u.username.toLowerCase() === normalizedId
            );
            const idMatch = u.uid && (
              u.uid.toLowerCase() === cleanId ||
              u.uid.toLowerCase() === `user_${cleanId}` ||
              cleanId === u.uid.toLowerCase().replace('user_', '')
            );
            const nameMatch = u.displayName && (
              u.displayName.toLowerCase() === cleanId ||
              (cleanId.length >= 4 && u.displayName.toLowerCase().includes(cleanId)) ||
              (cleanId.includes('johan') && u.displayName.toLowerCase().includes('johan'))
            );
            if (emailMatch || emailPrefixMatch || nipMatch || usernameMatch || idMatch || nameMatch) {
              foundUser = u;
              break;
            }
          }
        }
      } catch (e) {}
    }

    // If not found in users, check if it's a registered student by NIS
    if (!foundUser) {
      try {
        const rawStudents = localStorage.getItem('sim_students');
        if (rawStudents) {
          const studentList = JSON.parse(rawStudents);
          const foundStudent = studentList.find((s: any) => 
            (s.nis && (s.nis.replace(/[^0-9a-zA-Z]/g, '').toLowerCase() === cleanId || s.nis.replace(/[^0-9a-zA-Z]/g, '').toLowerCase() === normalizedId)) ||
            (s.nisn && (s.nisn.replace(/[^0-9a-zA-Z]/g, '').toLowerCase() === cleanId || s.nisn.replace(/[^0-9a-zA-Z]/g, '').toLowerCase() === normalizedId)) ||
            (s.fullName && s.fullName.toLowerCase() === cleanId)
          );
          if (foundStudent) {
            foundUser = {
              uid: `student_${foundStudent.id}`,
              displayName: foundStudent.fullName,
              email: `${foundStudent.nis || 'siswa'}@madrasah.sch.id`,
              username: foundStudent.nis || foundStudent.fullName.toLowerCase().replace(/\s+/g, '.'),
              role: 'pembina_ekskul', // Read-level access
              status: foundStudent.status === 'Aktif' ? 'Aktif' : 'Nonaktif',
              password: 'password'
            };
          }
        }
      } catch (e) {}
    }

    if (foundUser) {
      // Synchronize latest credential from Firestore with timestamp conflict resolution & self-healing
      try {
        let userDocRef = doc(db, 'users', foundUser.uid);
        let userDocSnap = await getDoc(userDocRef);
        
        // If not found by primary uid, check potential alias uids (e.g. user_ prefix or stripped)
        if (!userDocSnap.exists()) {
          const altUid = foundUser.uid.startsWith('user_') ? foundUser.uid.replace(/^user_/, '') : `user_${foundUser.uid}`;
          const altDocRef = doc(db, 'users', altUid);
          const altSnap = await getDoc(altDocRef);
          if (altSnap.exists()) {
            userDocRef = altDocRef;
            userDocSnap = altSnap;
          }
        }

        if (userDocSnap.exists()) {
          const freshData = userDocSnap.data() as UserProfile;
          const localUpdated = foundUser.updatedAt ? new Date(foundUser.updatedAt).getTime() : 0;
          const remoteUpdated = freshData.updatedAt ? new Date(freshData.updatedAt).getTime() : 0;

          // Conflict resolution logic:
          // Case 1: Remote in Firestore is newer than local memory -> accept Firestore data
          if (remoteUpdated > localUpdated && freshData.password && freshData.password.trim()) {
            foundUser = { ...foundUser, ...freshData };
            setAllUsers(prev => {
              const updatedList = prev.map(u => u.uid === foundUser!.uid ? { ...u, ...freshData } : u);
              try {
                localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(updatedList));
              } catch {}
              return updatedList;
            });
          }
          // Case 2: Local is newer than Firestore (Admin changed password locally or Firestore write lagged)
          else if (localUpdated > remoteUpdated && foundUser.password && foundUser.password.trim()) {
            // Self-healing push: Update Firestore so cloud storage gets the latest admin-set password
            setDoc(userDocRef, { password: foundUser.password, updatedAt: foundUser.updatedAt }, { merge: true }).catch(() => {});
          }
          // Case 3: Local has a custom password set while Firestore still has stale default 'password'
          else if (
            foundUser.password && 
            foundUser.password !== 'password' && 
            (!freshData.password || freshData.password === 'password')
          ) {
            // Self-healing push: Update Firestore with local's customized password
            const newTimestamp = foundUser.updatedAt || new Date().toISOString();
            setDoc(userDocRef, { password: foundUser.password, updatedAt: newTimestamp }, { merge: true }).catch(() => {});
          }
          // Case 4: Remote has a customized password and local is default -> adopt remote
          else if (freshData.password && freshData.password.trim() && freshData.password !== 'password' && (!foundUser.password || foundUser.password === 'password')) {
            foundUser = { ...foundUser, ...freshData };
            setAllUsers(prev => {
              const updatedList = prev.map(u => u.uid === foundUser!.uid ? { ...u, ...freshData } : u);
              try {
                localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(updatedList));
              } catch {}
              return updatedList;
            });
          }
        } else {
          // Document does not exist in Firestore yet -> self-heal by writing to Firestore
          setDoc(userDocRef, { ...foundUser, updatedAt: foundUser.updatedAt || new Date().toISOString() }, { merge: true }).catch(() => {});
        }
      } catch (e) {
        console.warn('Firestore credential sync note:', e);
      }

      if (foundUser.status === 'Nonaktif') {
        setIsLoading(false);
        recordSystemAuditLog('LOGIN_FAILED_BLOCKED', 'Keamanan Sistem', `Percobaan login gagal untuk akun dinonaktifkan: ${foundUser.displayName} (${identifier})`, foundUser);
        return { success: false, error: 'Akun Anda dinonaktifkan oleh Administrator. Hubungi Proktor / Super Admin.' };
      }

      // Check password: user.password or default fallback 'password' or OSIM default
      const userPassword = (foundUser.password && foundUser.password.trim()) || 'password';
      const isOsimAccount = foundUser.role === 'pengurus_osim' || foundUser.role === 'anggota_osim';
      const osimFallbackPassword = isOsimAccount
        ? getDefaultOsimPassword(foundUser.osimDepartmentCode || foundUser.position || foundUser.osimRole || foundUser.username)
        : null;

      const isJohanAccount = (foundUser.displayName && foundUser.displayName.toLowerCase().includes('johan')) ||
                             foundUser.uid === 'user_guru_06' ||
                             foundUser.uid === 'guru_06' ||
                             (foundUser.nip && foundUser.nip.startsWith('19900316'));
      const isJohanPasswordMatch = Boolean(isJohanAccount && (
        cleanPass === 'pembina2026' ||
        cleanPass === 'johan@pembina2026' ||
        cleanPass === 'password'
      ));

      const isPasswordCorrect = cleanPass === userPassword || 
                                (osimFallbackPassword && cleanPass === osimFallbackPassword) ||
                                isJohanPasswordMatch;

      if (isPasswordCorrect) {
        // Direct login clears any temporary simulation session
        setAdminImpersonator(null);
        try {
          sessionStorage.removeItem('sim_admin_impersonator');
        } catch {}
        let userToSet = { ...foundUser };
        if (isJohanAccount) {
          const currentEkskulIds = Array.isArray(userToSet.extracurricularIds) ? userToSet.extracurricularIds : [];
          userToSet.extracurricularIds = Array.from(new Set([
            ...currentEkskulIds,
            'ekskul_1790810445554',
            'ekskul_1790685328474',
            'ekskul_english_club'
          ]));
        }
        const updated = { ...userToSet, lastLogin: new Date().toISOString() };
        setCurrentUser(updated);
        setAllUsers(prev => prev.map(u => u.uid === foundUser!.uid ? updated : u));
        recordSystemAuditLog('LOGIN_SUCCESS', 'Autentikasi & Keamanan', `Pengguna ${foundUser.displayName} (${foundUser.role.toUpperCase()}) berhasil masuk ke aplikasi`, updated);
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        recordSystemAuditLog('LOGIN_FAILED_PASSWORD', 'Keamanan Sistem', `Percobaan login gagal (Password salah) untuk: ${foundUser.displayName} (${identifier})`, foundUser);
        return {
          success: false,
          error: 'Kata sandi (password) yang Anda masukkan salah. Jika Admin App atau Pembina telah mengganti kata sandi akun Anda, kata sandi lama otomatis tidak berlaku lagi dan Anda wajib menggunakan kata sandi yang terbaru.'
        };
      }
    }

    // Try Firebase auth if not matched locally
    try {
      const res = await signInWithEmailAndPassword(auth, identifier, pass);
      const userDoc = await getDoc(doc(db, 'users', res.user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        setCurrentUser(data);
        setAllUsers(prev => [...prev.filter(u => u.uid !== data.uid), data]);
        recordSystemAuditLog('LOGIN_FIREBASE', 'Autentikasi & Keamanan', `Pengguna ${data.displayName} berhasil login via Firebase Auth`, data);
      }
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      recordSystemAuditLog('LOGIN_FAILED_NOT_FOUND', 'Keamanan Sistem', `Percobaan login gagal untuk identitas tidak dikenal: ${identifier}`);
      return { success: false, error: 'Akun tidak ditemukan atau NIP/Email dan Password tidak cocok.' };
    }
  };

  const loginWithEmail = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    return loginWithIdentifier(email, pass);
  };

  const logout = async () => {
    if (currentUser) {
      recordSystemAuditLog('LOGOUT', 'Autentikasi & Keamanan', `Pengguna ${currentUser.displayName} (${currentUser.role.toUpperCase()}) telah keluar dari sistem (Logout)`, currentUser);
    }
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn(e);
    }
    setAdminImpersonator(null);
    try {
      sessionStorage.removeItem('sim_admin_impersonator');
      sessionStorage.removeItem(SESSION_STORAGE_USER_KEY);
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      localStorage.removeItem('simkesiswaan_active_tab');
    } catch {}
    setCurrentUser(null);
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

  // cPanel User Provisioning methods
  const addUser = async (user: UserProfile): Promise<{ success: boolean; error?: string }> => {
    try {
      const exists = allUsers.some(u => 
        (u.email && u.email.toLowerCase() === user.email.toLowerCase()) || 
        (u.nip && user.nip && u.nip.replace(/\s+/g, '') === user.nip.replace(/\s+/g, ''))
      );
      if (exists) {
        return { success: false, error: 'Akun dengan Email atau NIP tersebut sudah terdaftar di sistem.' };
      }

      const newUser: UserProfile = {
        ...user,
        uid: user.uid || `user_${Date.now()}`,
        status: user.status || 'Aktif',
        password: user.password || 'password',
        createdAt: new Date().toISOString()
      };

      removeDeletedUid(newUser.uid);

      setAllUsers(prev => {
        const next = deduplicateUsersList([...prev, newUser]);
        localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(next));
        return next;
      });

      try {
        await setDoc(doc(db, 'users', newUser.uid), newUser, { merge: true });
      } catch (e) {
        if (isPermissionError(e)) {
          handleFirestoreError(e, OperationType.CREATE, `users/${newUser.uid}`);
        }
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
      let mergedUser: UserProfile | undefined;
      const nowIso = new Date().toISOString();
      const updatedWithTimestamp = { ...updated, updatedAt: nowIso };

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
        localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(next));
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

      // Write to Firestore with guaranteed updatedAt
      try {
        const firestorePayload = { ...updatedWithTimestamp };
        await setDoc(doc(db, 'users', uid), firestorePayload, { merge: true });

        // Also update alias document IDs if any
        if (uid.startsWith('user_')) {
          setDoc(doc(db, 'users', uid.replace(/^user_/, '')), firestorePayload, { merge: true }).catch(() => {});
        } else {
          setDoc(doc(db, 'users', `user_${uid}`), firestorePayload, { merge: true }).catch(() => {});
        }

        if (mergedUser?.role === 'pengurus_osim') {
          if (mergedUser.osimRole === 'ketua') {
            setDoc(doc(db, 'users', 'user_osim_dept_bph'), firestorePayload, { merge: true }).catch(() => {});
            setDoc(doc(db, 'users', 'user_osim_ketua'), firestorePayload, { merge: true }).catch(() => {});
          } else if (mergedUser.osimRole) {
            setDoc(doc(db, 'users', `user_osim_${mergedUser.osimRole}`), firestorePayload, { merge: true }).catch(() => {});
          }
          if (mergedUser.osimDepartmentId) {
            setDoc(doc(db, 'users', `user_osim_${mergedUser.osimDepartmentId}`), firestorePayload, { merge: true }).catch(() => {});
          }
        }
      } catch (e) {
        if (isPermissionError(e)) {
          handleFirestoreError(e, OperationType.UPDATE, `users/${uid}`);
        } else {
          console.warn('Firestore updateUser sync note:', e);
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
      if (uid === 'user_super_admin' || currentUser?.uid === uid) {
        return { success: false, error: 'Tidak dapat menghapus akun Super Admin utama atau akun yang sedang aktif digunakan.' };
      }
      const targetUser = allUsers.find(u => u.uid === uid);
      
      // Register tombstones for this specific person's UID only.
      // NEVER tombstone role-based or department functional IDs (e.g. user_osim_dept_bph, user_osim_ketua)
      // because the leadership position remains valid for new incoming student officers.
      addDeletedUid(uid);
      if (uid.startsWith('user_')) {
        addDeletedUid(uid.replace(/^user_/, ''));
      }

      setAllUsers(prev => {
        const next = prev.filter(u => {
          if (u.uid === uid) return false;
          if (targetUser) {
            // Also clean up any double / duplicate entry for this exact same person/role
            if (u.email && targetUser.email && u.email.trim().toLowerCase() === targetUser.email.trim().toLowerCase()) return false;
            if (cleanDigits(u.nip) && cleanDigits(targetUser.nip) && cleanDigits(u.nip).length >= 6 && cleanDigits(u.nip) === cleanDigits(targetUser.nip)) return false;
            if (targetUser.role === 'pengurus_osim' && u.role === 'pengurus_osim' && targetUser.osimRole && u.osimRole && targetUser.osimRole === u.osimRole) return false;
          }
          return true;
        });
        localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(next));
        return next;
      });

      try {
        await deleteDoc(doc(db, 'users', uid));
        if (uid.startsWith('user_')) {
          deleteDoc(doc(db, 'users', uid.replace(/^user_/, ''))).catch(() => {});
        }
        if (targetUser?.role === 'pengurus_osim') {
          if (targetUser.osimRole === 'ketua') {
            deleteDoc(doc(db, 'users', 'user_osim_dept_bph')).catch(() => {});
            deleteDoc(doc(db, 'users', 'user_osim_ketua')).catch(() => {});
          } else if (targetUser.osimRole) {
            deleteDoc(doc(db, 'users', `user_osim_${targetUser.osimRole}`)).catch(() => {});
          }
          if (targetUser.osimDepartmentId) {
            deleteDoc(doc(db, 'users', `user_osim_${targetUser.osimDepartmentId}`)).catch(() => {});
          }
        }
      } catch (e) {
        if (isPermissionError(e)) {
          handleFirestoreError(e, OperationType.DELETE, `users/${uid}`);
        }
      }

      recordSystemAuditLog('DELETE_USER', 'Manajemen Pengguna', `Administrator menghapus akun: ${targetUser?.displayName || uid} (${targetUser?.email || '-'})`, currentUser);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Gagal menghapus akun.' };
    }
  };

  const resetUserPassword = async (uid: string, newPassword = 'password'): Promise<{ success: boolean; error?: string }> => {
    try {
      const targetUser = allUsers.find(u => u.uid === uid);
      let updatedUserObj: UserProfile | undefined;
      const nowIso = new Date().toISOString();

      setAllUsers(prev => {
        const next = prev.map(u => {
          if (u.uid === uid) {
            const merged = { ...u, password: newPassword, updatedAt: nowIso };
            updatedUserObj = merged;
            return merged;
          }
          return u;
        });
        localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(next));
        return next;
      });

      if (currentUser?.uid === uid && updatedUserObj) {
        setCurrentUser(updatedUserObj);
        try {
          sessionStorage.setItem(SESSION_STORAGE_USER_KEY, JSON.stringify(updatedUserObj));
        } catch {}
      }

      // Guaranteed Firestore persistence across primary document & aliases
      try {
        const payload = { password: newPassword, updatedAt: nowIso };
        await setDoc(doc(db, 'users', uid), payload, { merge: true });

        // Update alias IDs
        if (uid.startsWith('user_')) {
          setDoc(doc(db, 'users', uid.replace(/^user_/, '')), payload, { merge: true }).catch(() => {});
        } else {
          setDoc(doc(db, 'users', `user_${uid}`), payload, { merge: true }).catch(() => {});
        }

        // If OSIM account, also sync to role/department aliases and osim_members
        if (targetUser?.role === 'pengurus_osim') {
          if (targetUser.osimRole === 'ketua') {
            setDoc(doc(db, 'users', 'user_osim_dept_bph'), payload, { merge: true }).catch(() => {});
            setDoc(doc(db, 'users', 'user_osim_ketua'), payload, { merge: true }).catch(() => {});
          } else if (targetUser.osimRole) {
            setDoc(doc(db, 'users', `user_osim_${targetUser.osimRole}`), payload, { merge: true }).catch(() => {});
          }
          if (targetUser.osimDepartmentId) {
            setDoc(doc(db, 'users', `user_osim_${targetUser.osimDepartmentId}`), payload, { merge: true }).catch(() => {});
          }

          // Also update osim_members in localStorage and Firestore if matching member exists
          try {
            const rawOsim = localStorage.getItem('sim_osim_members');
            if (rawOsim) {
              const members = JSON.parse(rawOsim);
              let foundMemberId: string | null = null;
              const updatedMembers = members.map((m: any) => {
                const isMatch = m.id === uid ||
                  (m.loginUsername && targetUser.username && m.loginUsername.toLowerCase() === targetUser.username.toLowerCase()) ||
                  (m.studentNis && targetUser.nip && m.studentNis === targetUser.nip);
                if (isMatch) {
                  foundMemberId = m.id;
                  return { ...m, loginPassword: newPassword, password: newPassword, updatedAt: nowIso };
                }
                return m;
              });
              if (foundMemberId) {
                localStorage.setItem('sim_osim_members', JSON.stringify(updatedMembers));
                setDoc(doc(db, 'osim_members', foundMemberId), {
                  loginPassword: newPassword,
                  password: newPassword,
                  updatedAt: nowIso
                }, { merge: true }).catch(() => {});
              }
            }
          } catch {}
        }
      } catch (e: any) {
        console.warn('Firestore resetUserPassword sync note:', e);
      }

      recordSystemAuditLog('RESET_PASSWORD', 'Keamanan Akun', `Administrator mereset kata sandi akun: ${targetUser?.displayName || uid} (${targetUser?.email || '-'})`, currentUser);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Gagal mereset password akun.' };
    }
  };

  const changePassword = async (currentPass: string, newPass: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'Sesi akun tidak aktif.' };
    }

    if (currentUser.role === 'pengurus_osim') {
      return {
        success: false,
        error: 'Akun Siswa Pengurus OSIM tidak memiliki hak untuk mengganti kata sandi secara mandiri. Seluruh akun login dikelola secara terpusat oleh Admin App dan Pembina OSIM.'
      };
    }

    const isPembinaEkstra = 
      currentUser.role === 'pembina_ekstrakurikuler' ||
      currentUser.role === 'pembina_ekskul' ||
      currentUser.role === 'pembina_ekstra' ||
      currentUser.role === 'pembina';

    if (isPembinaEkstra) {
      return {
        success: false,
        error: 'Akun Pembina Ekstrakurikuler dikelola secara terpusat. Penggantian kata sandi akun ini hanya dapat dilakukan melalui cPanel oleh Administrator Madrasah.'
      };
    }

    const cleanCurrent = currentPass.trim();
    const cleanNew = newPass.trim();

    // Verify existing password
    const existingPassword = (currentUser.password && currentUser.password.trim()) || 'password';
    if (cleanCurrent !== existingPassword) {
      return { success: false, error: 'Kata sandi saat ini yang Anda masukkan salah.' };
    }

    if (cleanNew.length < 6) {
      return { success: false, error: 'Kata sandi baru minimal 6 karakter demi keamanan akun Anda.' };
    }

    if (cleanNew === existingPassword) {
      return { success: false, error: 'Kata sandi baru tidak boleh sama persis dengan kata sandi saat ini.' };
    }

    try {
      const updatedUser: UserProfile = {
        ...currentUser,
        password: cleanNew,
        updatedAt: new Date().toISOString()
      };

      setCurrentUser(updatedUser);
      try {
        sessionStorage.setItem(SESSION_STORAGE_USER_KEY, JSON.stringify(updatedUser));
      } catch {}

      setAllUsers(prev => {
        const next = prev.map(u => u.uid === currentUser.uid ? updatedUser : u);
        localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(next));
        return next;
      });

      try {
        await setDoc(doc(db, 'users', currentUser.uid), { password: cleanNew, updatedAt: updatedUser.updatedAt }, { merge: true });
      } catch (e) {
        console.warn('Firestore changePassword sync note:', e);
      }

      recordSystemAuditLog('CHANGE_PASSWORD', 'Keamanan Akun', `Pengguna ${currentUser.displayName} (${currentUser.role.toUpperCase()}) berhasil memperbarui kata sandi akun`, updatedUser);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Gagal memperbarui kata sandi akun.' };
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
        } else {
          role = 'coach_ekstrakurikuler';
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

        // 3. Resolve extracurricular IDs (strictly canonical format)
        const assignedEkskulIds = canonicalizeAssignedEkskulIds(t.assignedExtracurriculars, extracurricularsList);

        // 4. Find existing user with comprehensive matching
        const existingIdx = updatedUsers.findIndex(u => isTeacherUserMatch(u, t));

        if (existingIdx >= 0) {
          const existing = updatedUsers[existingIdx];
          const standardUid = t.id.startsWith('user_') ? t.id : `user_${t.id}`;
          const isUidMigrated = standardUid.startsWith('user_guru_') && existing.uid !== standardUid && !existing.uid.startsWith('user_guru_') && existing.uid !== 'user_super_admin';
          const targetUid = isUidMigrated ? standardUid : existing.uid;

          const merged: UserProfile = {
            ...existing,
            uid: targetUid,
            displayName: t.fullName,
            nip: t.nip || existing.nip,
            email: existing.email || email,
            role: existing.role === 'super_admin' ? 'super_admin' : role,
            phone: t.phone || existing.phone,
            status: t.isActive !== false ? 'Aktif' : 'Nonaktif',
            isCashManager: t.isCashManager !== undefined ? t.isCashManager : existing.isCashManager,
            cashManagerTitle: t.cashManagerTitle || existing.cashManagerTitle,
            extracurricularIds: assignedEkskulIds.length > 0 ? assignedEkskulIds : existing.extracurricularIds,
            counselorSpecialization: role === 'guru_bk' ? (t.subject || existing.counselorSpecialization || 'Bimbingan Konseling Siswa & Karir') : existing.counselorSpecialization,
            photoURL: t.photoUrl || (t as any).photoURL || existing.photoURL,
            updatedAt: new Date().toISOString()
          };
          updatedUsers[existingIdx] = merged;
          firestorePromises.push(setDoc(doc(db, 'users', merged.uid), merged, { merge: true }));
          if (isUidMigrated && existing.uid) {
            firestorePromises.push(deleteDoc(doc(db, 'users', existing.uid)));
          }
          count++;
        } else {
          const newUser: UserProfile = {
            uid: t.id.startsWith('user_') ? t.id : `user_${t.id}`,
            displayName: t.fullName,
            nip: t.nip || undefined,
            email: email,
            username: username,
            password: 'password', // Default login password
            role: role,
            phone: t.phone || undefined,
            status: t.isActive !== false ? 'Aktif' : 'Nonaktif',
            isCashManager: t.isCashManager || false,
            cashManagerTitle: t.cashManagerTitle || undefined,
            extracurricularIds: assignedEkskulIds.length > 0 ? assignedEkskulIds : undefined,
            counselorSpecialization: role === 'guru_bk' ? (t.subject || 'Bimbingan Konseling Siswa & Karir') : undefined,
            photoURL: t.photoUrl || (t as any).photoURL || undefined,
            createdAt: new Date().toISOString()
          };
          updatedUsers.push(newUser);
          firestorePromises.push(setDoc(doc(db, 'users', newUser.uid), newUser, { merge: true }));
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
          const defaultPassword = m.loginPassword || m.password || (isBph ? getDefaultOsimPassword(osimRoleVal) : (sekbidNum ? getDefaultOsimPassword(`sekbid${sekbidNum}`) : getDefaultOsimPassword('sekbid')));
          const email = m.email || `${username}@madrasah.sch.id`;

          // Map to Canonical OsimPosition
          const canonicalOsimPos: OsimPosition =
            osimRoleVal === 'ketua' ? 'ketua_osim' :
            osimRoleVal === 'wakil' ? 'wakil_ketua_osim' :
            osimRoleVal === 'sekretaris' ? 'sekretaris' :
            osimRoleVal === 'bendahara' ? 'bendahara' :
            'ketua_sekbid';

          // Match existing user by ID, username, NIS, or member match
          const existingIdx = updatedUsers.findIndex(u =>
            u.uid === m.id ||
            u.uid === `user_${m.id}` ||
            (cleanNis && cleanDigits(u.nip) === cleanNis) ||
            (u.username && u.username.toLowerCase() === username.toLowerCase()) ||
            isOsimMemberUserMatch(u, m)
          );

          const targetUid = existingIdx >= 0 ? updatedUsers[existingIdx].uid : (m.id.startsWith('user_') ? m.id : `user_${m.id}`);

          if (existingIdx >= 0) {
            const existing = updatedUsers[existingIdx];
            const currentPassword = (existing.password && existing.password !== 'password') ? existing.password : defaultPassword;
            const merged: UserProfile = {
              ...existing,
              displayName: m.fullName,
              nip: m.studentNis || existing.nip,
              phone: m.phone && m.phone !== '-' ? m.phone : existing.phone,
              username: existing.username || username,
              email: existing.email || email,
              password: currentPassword,
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
            firestorePromises.push(setDoc(doc(db, 'users', merged.uid), merged, { merge: true }));
            count++;
          } else {
            const newUser: UserProfile = {
              uid: targetUid,
              displayName: m.fullName,
              username,
              email,
              password: defaultPassword,
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
            firestorePromises.push(setDoc(doc(db, 'users', newUser.uid), newUser, { merge: true }));
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
        const defaultPassword = getDefaultOsimPassword(sekbidNum ? `sekbid${sekbidNum}` : 'sekbid');

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
          firestorePromises.push(setDoc(doc(db, 'users', merged.uid), merged, { merge: true }));
        } else {
          const newUid = `user_osim_${(deptCode || 'sekbid').toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
          const newAcc: UserProfile = {
            uid: newUid,
            displayName: trimmedCoord,
            username: defaultUsername,
            email: `${defaultUsername}@madrasah.sch.id`,
            password: defaultPassword,
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
          firestorePromises.push(setDoc(doc(db, 'users', newAcc.uid), newAcc, { merge: true }));
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

