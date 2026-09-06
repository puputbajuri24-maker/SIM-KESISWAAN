import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, Teacher, Extracurricular, AuditLogItem } from '../types';
import { DEMO_USERS, PURGED_DEMO_UIDS, PURGED_DEMO_EMAILS, isBlacklistedDemoName } from '../services/seedData';
import { auth, db } from '../services/firebase';
import { doc, getDoc, getDocs, collection, setDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut as fbSignOut, signInWithEmailAndPassword } from 'firebase/auth';

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
  return false;
};

interface AuthContextType {
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  userRole: UserRole;
  isSuperAdmin: boolean;
  isWaka: boolean;
  isWakaOrAdmin: boolean;
  isGuruBK: boolean;
  isPembinaOsim: boolean;
  isPembinaEkskul: boolean;
  isPembina: boolean;
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
  syncUsersFromTeachers: (teachersList: Teacher[], extracurricularsList?: Extracurricular[]) => Promise<number>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'sim_kesiswaan_active_user';
const LOCAL_STORAGE_ALL_USERS_KEY = 'sim_kesiswaan_all_users_registry';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize all users with persistent custom users or DEMO_USERS
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_ALL_USERS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UserProfile[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, UserProfile>();
          DEMO_USERS.forEach(u => map.set(u.uid, u));
          parsed.filter(u => !isPurgedUser(u)).forEach(u => map.set(u.uid, { ...map.get(u.uid), ...u }));
          const res = Array.from(map.values()).filter(u => !isPurgedUser(u));
          return res.length > 0 ? res : DEMO_USERS;
        }
      } catch (e) {
        console.warn('Failed to parse all users:', e);
      }
    }
    return DEMO_USERS;
  });

  // Fetch Firestore users on mount to ensure fresh state & purge blacklisted demo users
  useEffect(() => {
    const fetchFirestoreUsers = async () => {
      try {
        // Permanently delete purged demo accounts from Firestore if present
        for (const purgedUid of PURGED_DEMO_UIDS) {
          try {
            await deleteDoc(doc(db, 'users', purgedUid));
          } catch (e) {}
        }

        const snap = await getDocs(collection(db, 'users'));
        if (!snap.empty) {
          const firestoreUsers: UserProfile[] = [];
          snap.forEach(d => {
            const data = d.data() as UserProfile;
            if (!isPurgedUser(data)) {
              firestoreUsers.push(data);
            } else {
              deleteDoc(d.ref).catch(() => {});
            }
          });
          if (firestoreUsers.length > 0) {
            setAllUsers(prev => {
              const map = new Map<string, UserProfile>();
              DEMO_USERS.forEach(u => map.set(u.uid, u));
              prev.filter(u => !isPurgedUser(u)).forEach(u => map.set(u.uid, { ...map.get(u.uid), ...u }));
              firestoreUsers.forEach(u => map.set(u.uid, { ...map.get(u.uid), ...u }));
              const merged = Array.from(map.values()).filter(u => !isPurgedUser(u));
              localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(merged));
              return merged;
            });
          }
        }
      } catch (e) {
        console.warn('Firestore users initial load fallback:', e);
      }
    };
    fetchFirestoreUsers();
  }, []);

  // Default to active saved user or DEMO_USERS[0] (Super Administrator)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && !isPurgedUser(parsed)) {
          return parsed;
        }
      } catch {
        return DEMO_USERS[0];
      }
    }
    return DEMO_USERS[0]; // Default Super Administrator
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
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
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
            const newUser: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || 'Pengguna Baru',
              role: 'pembina_ekskul',
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
    const isRestrictedRole = currentUser && ['guru_bk', 'pembina', 'pembina_ekskul', 'pembina_osim'].includes(currentUser.role);
    if (role === 'super_admin' && isRestrictedRole && !isSimulatedFromAdmin) {
      console.warn('Akses ditolak: Fitur kembali ke Administrator dinonaktifkan untuk peran Guru Pembina dan Guru BK.');
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
    const cleanPass = pass.trim();

    // Check across local and seeded allUsers (by email, NIP, username, or role alias)
    let foundUser = allUsers.find(u => {
      const emailMatch = u.email && u.email.toLowerCase() === cleanId;
      const emailPrefixMatch = u.email && u.email.toLowerCase().split('@')[0] === cleanId;
      const nipMatch = u.nip && u.nip.replace(/[^0-9a-zA-Z]/g, '').toLowerCase() === cleanId.replace(/[^0-9a-zA-Z]/g, '');
      const usernameMatch = u.username && u.username.toLowerCase() === cleanId;
      const roleMatch = (cleanId === 'admin' && (u.role === 'super_admin' || u.role === 'waka_kesiswaan')) ||
                        (cleanId === 'waka' && u.role === 'waka_kesiswaan') ||
                        (cleanId === 'bk' && u.role === 'guru_bk') ||
                        (cleanId === 'osim' && u.role === 'pembina_osim') ||
                        (cleanId === 'pembina' && (u.role === 'pembina_ekskul' || u.role === 'pembina'));
      return emailMatch || emailPrefixMatch || nipMatch || usernameMatch || roleMatch;
    });

    // If not found in users, check if it's a registered student by NIS
    if (!foundUser) {
      try {
        const rawStudents = localStorage.getItem('sim_students');
        if (rawStudents) {
          const studentList = JSON.parse(rawStudents);
          const foundStudent = studentList.find((s: any) => 
            (s.nis && s.nis.replace(/[^0-9a-zA-Z]/g, '').toLowerCase() === cleanId.replace(/[^0-9a-zA-Z]/g, '')) ||
            (s.nisn && s.nisn.replace(/[^0-9a-zA-Z]/g, '').toLowerCase() === cleanId.replace(/[^0-9a-zA-Z]/g, '')) ||
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
      if (foundUser.status === 'Nonaktif') {
        setIsLoading(false);
        recordSystemAuditLog('LOGIN_FAILED_BLOCKED', 'Keamanan Sistem', `Percobaan login gagal untuk akun dinonaktifkan: ${foundUser.displayName} (${identifier})`, foundUser);
        return { success: false, error: 'Akun Anda dinonaktifkan oleh Administrator. Hubungi Proktor / Super Admin.' };
      }

      // Check password: user.password or default fallback '123456' / 'password'
      const userPassword = foundUser.password || 'password';
      if (cleanPass === userPassword || cleanPass === 'password' || cleanPass === '123456') {
        // Direct login clears any temporary simulation session
        setAdminImpersonator(null);
        try {
          sessionStorage.removeItem('sim_admin_impersonator');
        } catch {}
        const updated = { ...foundUser, lastLogin: new Date().toISOString() };
        setCurrentUser(updated);
        setAllUsers(prev => prev.map(u => u.uid === foundUser.uid ? updated : u));
        recordSystemAuditLog('LOGIN_SUCCESS', 'Autentikasi & Keamanan', `Pengguna ${foundUser.displayName} (${foundUser.role.toUpperCase()}) berhasil masuk ke aplikasi`, updated);
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        recordSystemAuditLog('LOGIN_FAILED_PASSWORD', 'Keamanan Sistem', `Percobaan login gagal (Password salah) untuk: ${foundUser.displayName} (${identifier})`, foundUser);
        return { success: false, error: 'Password yang Anda masukkan salah. Default password: password atau hubungi Admin cPanel.' };
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
    } catch {}
    setCurrentUser(null);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  };

  const updateProfileState = (updated: Partial<UserProfile>) => {
    if (!currentUser) return;
    const next = { ...currentUser, ...updated, updatedAt: new Date().toISOString() };
    setCurrentUser(next);
    setAllUsers(prev => prev.map(u => u.uid === next.uid ? next : u));
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

      setAllUsers(prev => {
        const next = [...prev, newUser];
        localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(next));
        return next;
      });

      try {
        setDoc(doc(db, 'users', newUser.uid), newUser, { merge: true }).catch(() => {});
      } catch (e) {}

      recordSystemAuditLog('CREATE_USER', 'Manajemen Pengguna', `Administrator membuat akun baru: ${newUser.displayName} (${newUser.email || newUser.nip}) [${newUser.role.toUpperCase()}]`, currentUser);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Gagal menambahkan akun baru.' };
    }
  };

  const updateUser = async (uid: string, updated: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    try {
      let targetUserDisplayName = uid;
      setAllUsers(prev => {
        const next = prev.map(u => {
          if (u.uid === uid) {
            targetUserDisplayName = u.displayName;
            const merged = { ...u, ...updated, updatedAt: new Date().toISOString() };
            if (currentUser?.uid === uid) {
              setCurrentUser(merged);
            }
            return merged;
          }
          return u;
        });
        localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(next));
        return next;
      });

      try {
        setDoc(doc(db, 'users', uid), updated, { merge: true }).catch(() => {});
      } catch (e) {}

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
      setAllUsers(prev => {
        const next = prev.filter(u => u.uid !== uid);
        localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(next));
        return next;
      });

      try {
        deleteDoc(doc(db, 'users', uid)).catch(() => {});
      } catch (e) {}

      recordSystemAuditLog('DELETE_USER', 'Manajemen Pengguna', `Administrator menghapus akun: ${targetUser?.displayName || uid} (${targetUser?.email || '-'})`, currentUser);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Gagal menghapus akun.' };
    }
  };

  const resetUserPassword = async (uid: string, newPassword = 'password'): Promise<{ success: boolean; error?: string }> => {
    try {
      const targetUser = allUsers.find(u => u.uid === uid);
      setAllUsers(prev => {
        const next = prev.map(u => {
          if (u.uid === uid) {
            const merged = { ...u, password: newPassword, updatedAt: new Date().toISOString() };
            if (currentUser?.uid === uid) {
              setCurrentUser(merged);
            }
            return merged;
          }
          return u;
        });
        localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(next));
        return next;
      });

      try {
        setDoc(doc(db, 'users', uid), { password: newPassword, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      } catch (e) {}

      recordSystemAuditLog('RESET_PASSWORD', 'Keamanan Akun', `Administrator mereset kata sandi akun: ${targetUser?.displayName || uid}`, currentUser);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Gagal mereset password akun.' };
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
        // 1. Resolve role mapping
        const rawRole = (t.role || '').toLowerCase();
        let role: UserRole = 'pembina_ekskul';
        if (rawRole.includes('bk') || rawRole.includes('bimbingan') || rawRole.includes('konselor')) {
          role = 'guru_bk';
        } else if (rawRole.includes('osim') || rawRole.includes('osis')) {
          role = 'pembina_osim';
        } else if (rawRole.includes('waka') || rawRole.includes('kesiswaan')) {
          role = 'waka_kesiswaan';
        } else if (rawRole.includes('super') || rawRole.includes('admin') || rawRole.includes('proktor')) {
          role = 'super_admin';
        } else {
          role = 'pembina_ekskul';
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

        // 3. Resolve extracurricular IDs
        let assignedEkskulIds: string[] = [];
        if (t.assignedExtracurriculars && Array.isArray(t.assignedExtracurriculars)) {
          assignedEkskulIds = t.assignedExtracurriculars.map(item => {
            if (item.startsWith('ekskul_')) return item;
            if (extracurricularsList) {
              const found = extracurricularsList.find(e => 
                e.name.toLowerCase() === item.toLowerCase() || 
                e.id.toLowerCase() === item.toLowerCase()
              );
              if (found) return found.id;
            }
            return item;
          });
        }

        // 4. Find existing user
        const existingIdx = updatedUsers.findIndex(u => 
          u.uid === t.id ||
          u.uid === `user_${t.id}` ||
          (cleanNip && u.nip && u.nip.replace(/\s+/g, '') === cleanNip) ||
          (u.email && u.email.toLowerCase() === email) ||
          u.displayName.toLowerCase() === t.fullName.toLowerCase()
        );

        if (existingIdx >= 0) {
          const existing = updatedUsers[existingIdx];
          const merged: UserProfile = {
            ...existing,
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

      localStorage.setItem(LOCAL_STORAGE_ALL_USERS_KEY, JSON.stringify(updatedUsers));
      return updatedUsers;
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

  const role = currentUser?.role || 'waka_kesiswaan';
  const isSuperAdmin = role === 'super_admin';
  const isWaka = role === 'waka_kesiswaan';
  const isWakaOrAdmin = role === 'super_admin' || role === 'waka_kesiswaan';
  const isGuruBK = role === 'guru_bk';
  const isPembinaOsim = role === 'pembina_osim';
  const isPembinaEkskul = role === 'pembina_ekskul' || role === 'pembina';
  const isPembina = isPembinaEkskul || isPembinaOsim;

  const canAccessTab = (tabId: string): boolean => {
    // Profile, Announcements Center, and Buku Tata Tertib Siswa are accessible by all authenticated users
    if (tabId === 'profile' || tabId === 'announcements' || tabId === 'rules' || tabId === 'handbook' || tabId === 'tatib') return true;

    // Cash Ledger (Neraca Kas & Transparansi Keuangan) is viewable by all teachers & staff for total transparency
    if (tabId === 'cash' || tabId === 'cash_ledger') {
      return true;
    }

    // Super admin has unrestricted root access to all tabs including cpanel and root settings
    if (isSuperAdmin) return true;

    // Strict security rule: cpanel and settings configuration are exclusively for super_admin
    if (tabId === 'settings' || tabId === 'cpanel') return false;

    // Waka kesiswaan has access to all operational student affairs tabs
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
        'profile'
      ];
      return allowedWakaTabs.includes(tabId);
    }

    // Guru BK has access to counseling hub, discipline/violations, student directory, reports, permissions, cash (transparansi), profile
    if (isGuruBK) {
      const allowedBkTabs = ['dashboard', 'counseling', 'violations', 'students', 'reports', 'permissions', 'cash', 'profile'];
      return allowedBkTabs.includes(tabId);
    }

    // Pembina OSIM has access to OSIM / Intrakurikuler menus, reports, activities, cash (transparansi), profile
    if (isPembinaOsim) {
      const allowedOsimTabs = ['dashboard', 'osim', 'activities', 'reports', 'cash', 'profile'];
      return allowedOsimTabs.includes(tabId);
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
        'profile'
      ];
      return allowedEkskulTabs.includes(tabId);
    }

    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        userRole: role,
        isSuperAdmin,
        isWaka,
        isWakaOrAdmin,
        isGuruBK,
        isPembinaOsim,
        isPembinaEkskul,
        isPembina,
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
        syncUsersFromTeachers
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

