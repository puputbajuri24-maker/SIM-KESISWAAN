import { useState, useEffect } from 'react';
import { UserRole, UserProfile } from '../types';
import { normalizeUserRole } from '../permissions';
import {
  canRoleInputModule,
  canRoleViewModule,
  getActiveRbacMatrix,
  RoleKey,
  ModulePermissionRow,
  initGlobalRbacSync
} from '../services/rbacService';

export type CrudTarget = 'teachers' | 'pembina_intra' | 'pembina_ekstra' | 'guru_bk' | 'members' | 'password_reset';

export const CRUD_MODULE_MAP: Record<CrudTarget, { moduleId: string; label: string; description: string }> = {
  teachers: {
    moduleId: 'crud_teachers',
    label: 'CRUD Master Dewan Guru',
    description: 'Penambahan, pengeditan, dan penghapusan data Guru di modul Dewan Guru.'
  },
  pembina_intra: {
    moduleId: 'crud_pembina_intra',
    label: 'CRUD Pembina Intra (OSIM)',
    description: 'Penetapan, pergantian, dan penghapusan Pembina OSIM di modul OSIM.'
  },
  pembina_ekstra: {
    moduleId: 'crud_pembina_ekstra',
    label: 'CRUD Pembina Ekstrakurikuler',
    description: 'Penambahan cabang ekskul, edit pembina, dan hapus ekskul di modul Ekstrakurikuler.'
  },
  guru_bk: {
    moduleId: 'crud_guru_bk',
    label: 'CRUD Personel Guru BK',
    description: 'Penetapan, pergantian, dan penghapusan penugasan Guru BK di modul Konseling.'
  },
  members: {
    moduleId: 'crud_members',
    label: 'CRUD Anggota (Ekskul & OSIM)',
    description: 'Pendaftaran dan penghapusan anggota ekskul serta pengurus/anggota OSIM di modul masing-masing.'
  },
  password_reset: {
    moduleId: 'crud_password_reset',
    label: 'Reset Sandi Pengguna (Helpdesk Delegasi)',
    description: 'Wewenang mereset kata sandi akun Siswa / Pengurus OSIM yang lupa sandi tanpa akses cPanel penuh.'
  }
};

/**
 * Evaluates whether a role is authorized to perform CRUD operations on a given target.
 * Rule: Outside cPanel, CRUD is restricted UNLESS explicitly granted
 * by Super Admin in the RBAC permission matrix checklist.
 */
export const canPerformCrud = (
  role: UserRole | string | undefined,
  target: CrudTarget,
  user?: UserProfile | null
): boolean => {
  if (!role) return false;
  const canonical = normalizeUserRole(role);
  // Super admin always has unrestricted root authorization
  if (canonical === 'super_admin' || role === 'super_admin' || role === 'admin') {
    return true;
  }

  const mapping = CRUD_MODULE_MAP[target];
  if (!mapping) return false;

  return canRoleInputModule(role, mapping.moduleId, user);
};

/**
 * React hook that reactively listens to global changes in the RBAC matrix
 * (via Firestore onSnapshot, custom events, or storage) so that all active modules
 * update immediately across tabs and devices without needing a page reload.
 */
export const useCrudPermission = (
  target: CrudTarget,
  userRole: UserRole | string | undefined,
  user?: UserProfile | null
): boolean => {
  // Ensure sync listener is active
  useEffect(() => {
    initGlobalRbacSync();
  }, []);

  const [hasPermission, setHasPermission] = useState<boolean>(() =>
    canPerformCrud(userRole, target, user)
  );

  useEffect(() => {
    const check = () => {
      setHasPermission(canPerformCrud(userRole, target, user));
    };

    check();

    const handleUpdate = () => {
      check();
    };

    window.addEventListener('rbac-matrix-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('rbac-matrix-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [target, userRole, user]);

  return hasPermission;
};

/**
 * Strict hierarchy safety guard for password reset.
 * - Super admin can reset any account.
 * - Delegated roles (e.g. Waka, Pembina) with active 'password_reset' permission in matrix can reset student/OSIM accounts.
 * - Non-super-admins can NEVER reset Super Admin or management accounts.
 */
export const canResetUserPassword = (
  actor: UserProfile | null | undefined,
  targetUser: UserProfile | null | undefined
): { allowed: boolean; reason?: string } => {
  if (!actor || !targetUser) return { allowed: false, reason: 'Pengguna tidak valid.' };

  const canonicalActor = normalizeUserRole(actor.role);

  // Super Admin has unrestricted authority
  if (canonicalActor === 'super_admin' || actor.role === 'super_admin') {
    return { allowed: true };
  }

  // Strict check: Pembina Ekstrakurikuler has NO authority to reset any password
  const isActorPembinaEkstra =
    canonicalActor === 'coach_ekstrakurikuler' ||
    actor.role === 'coach_ekstrakurikuler' ||
    actor.role === 'pembina_ekstrakurikuler' ||
    actor.role === 'pembina_ekskul' ||
    actor.role === 'pembina_ekstra' ||
    actor.role === 'pembina';

  if (isActorPembinaEkstra) {
    return {
      allowed: false,
      reason: 'Kebijakan Sistem: Akun Pembina Ekstrakurikuler tidak memiliki wewenang untuk mereset kata sandi akun pengguna manapun.'
    };
  }

  // Check if actor's role has permission for password reset in active dynamic matrix
  const hasPerm = canPerformCrud(actor.role, 'password_reset', actor);
  if (!hasPerm) {
    return {
      allowed: false,
      reason: 'Peran Anda belum diberikan checklist izin "Reset Sandi Pengguna (Helpdesk Delegasi)" pada Matriks Hak Akses Peran.'
    };
  }

  // Super Admin target is ALWAYS protected
  const canonicalTarget = normalizeUserRole(targetUser.role);
  if (canonicalTarget === 'super_admin' || targetUser.role === 'super_admin') {
    return {
      allowed: false,
      reason: 'Proteksi Hirarki Kritis: Akun Super Admin tidak dapat direset oleh peran lain.'
    };
  }

  // Protection for Pembina Ekstrakurikuler target:
  // Pembina Ekstrakurikuler accounts can ONLY be reset centrally by Super Admin in cPanel
  const isTargetPembinaEkstra =
    canonicalTarget === 'coach_ekstrakurikuler' ||
    targetUser.role === 'coach_ekstrakurikuler' ||
    targetUser.role === 'pembina_ekstrakurikuler' ||
    targetUser.role === 'pembina_ekskul' ||
    targetUser.role === 'pembina_ekstra' ||
    targetUser.role === 'pembina';

  if (isTargetPembinaEkstra) {
    return {
      allowed: false,
      reason: 'Proteksi Institusional: Kata sandi akun Pembina Ekstrakurikuler hanya dapat direset secara terpusat oleh Super Admin melalui cPanel.'
    };
  }

  // Target is student or OSIM member
  const isTargetStudentOrOsim =
    canonicalTarget === 'anggota_osim' ||
    targetUser.role === 'pengurus_osim' ||
    targetUser.role === 'anggota_osim';

  if (canonicalActor === 'pembina_osim' || actor.role === 'pembina_osim') {
    if (isTargetStudentOrOsim) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Pembina OSIM hanya memiliki wewenang delegasi untuk mereset kata sandi akun Siswa Pengurus OSIM.'
    };
  }

  if (canonicalActor === 'waka_kesiswaan' || actor.role === 'waka_kesiswaan') {
    if (isTargetStudentOrOsim) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Waka Kesiswaan hanya didelegasikan untuk mereset kata sandi akun Siswa dan Pengurus OSIM.'
    };
  }

  // Generic delegated role fallback: only student/OSIM level
  if (isTargetStudentOrOsim) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Proteksi Hirarki: Anda tidak memiliki wewenang mereset akun sesama staf pengajar atau pimpinan.'
  };
};

export {
  canRoleInputModule,
  canRoleViewModule,
  getActiveRbacMatrix,
  initGlobalRbacSync
};
