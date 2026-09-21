import { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { canRoleInputModule } from '../components/cpanel/RbacMatrixPanel';

export type CrudTarget = 'teachers' | 'pembina_intra' | 'pembina_ekstra' | 'guru_bk' | 'members';

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
  }
};

/**
 * Evaluates whether a role is authorized to perform CRUD operations on a given target.
 * Rule: Outside cPanel, CRUD is strictly restricted/prohibited UNLESS explicitly granted
 * by Super Admin in the RBAC permission matrix checklist.
 */
export const canPerformCrud = (role: UserRole | string | undefined, target: CrudTarget): boolean => {
  if (!role) return false;
  // Super admin always has unrestricted root authorization
  if (role === 'super_admin') return true;

  const mapping = CRUD_MODULE_MAP[target];
  if (!mapping) return false;

  return canRoleInputModule(role, mapping.moduleId);
};

/**
 * React hook that reactively listens to changes in the RBAC matrix (via custom events or storage)
 * so that when the cPanel admin updates matrix checkboxes, all active modules update without reload.
 */
export const useCrudPermission = (target: CrudTarget, userRole: UserRole | string | undefined): boolean => {
  const [hasPermission, setHasPermission] = useState<boolean>(() => canPerformCrud(userRole, target));

  useEffect(() => {
    const check = () => {
      setHasPermission(canPerformCrud(userRole, target));
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
  }, [target, userRole]);

  return hasPermission;
};
