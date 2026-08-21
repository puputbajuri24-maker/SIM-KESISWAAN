import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { DEMO_USERS } from '../services/seedData';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut as fbSignOut, signInWithEmailAndPassword } from 'firebase/auth';

interface AuthContextType {
  currentUser: UserProfile | null;
  userRole: UserRole;
  isSuperAdmin: boolean;
  isWakaOrAdmin: boolean;
  isPembina: boolean;
  isLoading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithDemoRole: (role: UserRole, customUid?: string) => void;
  switchRole: (role: UserRole) => void;
  logout: () => Promise<void>;
  updateProfileState: (updated: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'sim_kesiswaan_active_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Waka Kesiswaan for immediate deep command center inspection
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEMO_USERS[1]; // Waka Kesiswaan
      }
    }
    return DEMO_USERS[1]; // Default to Waka Kesiswaan
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }
  }, [currentUser]);

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
              role: 'pembina',
              photoURL: fbUser.photoURL || undefined,
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', fbUser.uid), newUser);
            setCurrentUser(newUser);
          }
        } catch (e) {
          console.warn('Firebase user fetch fallback to local:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithDemoRole = (role: UserRole, customUid?: string) => {
    setIsLoading(true);
    let target = DEMO_USERS.find(u => customUid ? u.uid === customUid : u.role === role);
    if (!target) {
      target = DEMO_USERS.find(u => u.role === role) || DEMO_USERS[0];
    }
    setCurrentUser(target);
    setIsLoading(false);
  };

  const loginWithEmail = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      // Check if demo email first
      const demoFound = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (demoFound) {
        setCurrentUser(demoFound);
        setIsLoading(false);
        return { success: true };
      }

      // Try Firebase real auth
      const res = await signInWithEmailAndPassword(auth, email, pass);
      const userDoc = await getDoc(doc(db, 'users', res.user.uid));
      if (userDoc.exists()) {
        setCurrentUser(userDoc.data() as UserProfile);
      }
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Login gagal. Silakan periksa kembali email dan password.' };
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn(e);
    }
    // Set to null or default demo
    setCurrentUser(null);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  };

  const updateProfileState = (updated: Partial<UserProfile>) => {
    if (!currentUser) return;
    const next = { ...currentUser, ...updated };
    setCurrentUser(next);
  };

  const role = currentUser?.role || 'waka_kesiswaan';
  const isSuperAdmin = role === 'super_admin';
  const isWakaOrAdmin = role === 'super_admin' || role === 'waka_kesiswaan' || role === 'admin_kesiswaan';
  const isPembina = role === 'pembina';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userRole: role,
        isSuperAdmin,
        isWakaOrAdmin,
        isPembina,
        isLoading,
        loginWithEmail,
        loginWithDemoRole,
        switchRole: loginWithDemoRole,
        logout,
        updateProfileState
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
