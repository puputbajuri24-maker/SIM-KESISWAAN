/**
 * Centralized Permission & Role Architecture
 * SIM-KESISWAAN MAN 2 SERAM BAGIAN TIMUR (MAN 2 SBT)
 *
 * Implements:
 * ROLE (Canonical 6 Roles)
 * + POSITION (OsimPosition)
 * + ASSIGNMENT / SCOPE (extracurricularIds, osimDepartmentId)
 * + PERMISSION (Granular capabilities)
 */

import { CanonicalUserRole, OsimPosition, UserProfile, UserRole } from '../types';
import { canRoleViewModule, canRoleInputModule } from '../services/rbacService';

export type Permission =
  // Dashboard
  | 'dashboard.view'
  // Siswa
  | 'students.view'
  | 'students.create'
  | 'students.update'
  | 'students.delete'
  // Guru / Pegawai
  | 'teachers.view'
  | 'teachers.manage'
  // OSIM
  | 'osim.view'
  | 'osim.manage'
  | 'osim.program.create'
  | 'osim.program.review'
  | 'osim.program.approve'
  | 'osim.report.verify'
  // Ekstrakurikuler
  | 'extracurricular.view'
  | 'extracurricular.manage'
  | 'extracurricular.attendance'
  | 'extracurricular.activity'
  | 'extracurricular.report'
  // Kas & Transaksi Keuangan
  | 'cash.view'
  | 'cash.create'
  | 'cash.update'
  | 'cash.void'
  // Tata Tertib & Pelanggaran
  | 'violations.view'
  | 'violations.manage'
  // Konseling / BK
  | 'counseling.view'
  | 'counseling.manage'
  // Dispensasi & Izin Santri/Siswa
  | 'dispensations.view'
  | 'dispensations.manage'
  // Laporan Terpadu
  | 'reports.view'
  | 'reports.create'
  // Administrasi Akun & Pengaturan Sistem
  | 'users.manage'
  | 'permissions.manage_system'
  | 'settings.manage';

export const CANONICAL_ROLES: CanonicalUserRole[] = [
  'super_admin',
  'waka_kesiswaan',
  'guru_bk',
  'pembina_osim',
  'coach_ekstrakurikuler',
  'anggota_osim'
];

export const OSIM_POSITIONS: OsimPosition[] = [
  'ketua_osim',
  'wakil_ketua_osim',
  'sekretaris_osim',
  'sekretaris',
  'bendahara_osim',
  'bendahara',
  'ketua_sekbid',
  'anggota_sekbid'
];

/**
 * Normalizes any legacy or custom role string to one of the 6 canonical roles.
 * CRITICAL SECURITY RULE: Returns null if the role is missing, unrecognized, or invalid.
 * Strictly prevents dangerous fallbacks (e.g. unknown role -> anggota_osim).
 */
export function normalizeUserRole(role: UserRole | string | undefined | null): CanonicalUserRole | null {
  if (!role) return null;
  const r = role.toLowerCase().trim();

  if (r === 'super_admin' || r === 'admin') return 'super_admin';
  if (r === 'waka' || r === 'waka_kesiswaan' || r === 'wakil_kepala') return 'waka_kesiswaan';
  if (r === 'guru_bk' || r === 'bk' || r === 'counselor') return 'guru_bk';
  if (r === 'pembina_osim') return 'pembina_osim';
  if (
    r === 'coach_ekstrakurikuler' ||
    r === 'pembina_ekstrakurikuler' ||
    r === 'pembina_ekstra' ||
    r === 'pembina_ekskul' ||
    r === 'pembina'
  ) {
    return 'coach_ekstrakurikuler';
  }
  if (r === 'pengurus_osim' || r === 'anggota_osim' || r === 'osim') {
    return 'anggota_osim';
  }

  // Deny-by-default for any unrecognized role string
  return null;
}

/**
 * Normalizes OSIM positions safely from canonical field or legacy fields.
 */
export function normalizeOsimPosition(
  user: Partial<UserProfile> | undefined | null
): OsimPosition | undefined {
  if (!user) return undefined;
  const canonicalRole = normalizeUserRole(user.role);
  if (canonicalRole !== 'anggota_osim') return undefined;

  // 1. Direct canonical position check
  if (user.position && OSIM_POSITIONS.includes(user.position)) {
    return user.position;
  }

  // 2. Legacy osimRole check
  const legacyRole = user.osimRole?.toLowerCase() || '';
  if (legacyRole === 'ketua') return 'ketua_osim';
  if (legacyRole === 'wakil') return 'wakil_ketua_osim';
  if (legacyRole === 'sekretaris') return 'sekretaris_osim';
  if (legacyRole === 'bendahara') return 'bendahara_osim';

  // 3. String position label check
  const posText = (user.osimPosition || user.position || '').toLowerCase();
  if (posText.includes('wakil')) return 'wakil_ketua_osim';
  if (posText.includes('ketua') && !posText.includes('sekbid') && !posText.includes('bidang')) {
    return 'ketua_osim';
  }
  if (posText.includes('sekretaris')) return 'sekretaris_osim';
  if (posText.includes('bendahara')) return 'bendahara_osim';
  if (posText.includes('ketua') || posText.includes('koordinator')) return 'ketua_sekbid';

  // 4. Department / Sekbid member
  if (user.osimDepartmentId || user.osimDepartmentCode || legacyRole === 'sekbid') {
    return 'anggota_sekbid';
  }

  return 'anggota_sekbid';
}

/**
 * Helper to check equivalence between OSIM positions, taking aliases into account.
 */
export function isSameOsimPosition(a?: OsimPosition, b?: OsimPosition): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  if ((a === 'sekretaris' || a === 'sekretaris_osim') && (b === 'sekretaris' || b === 'sekretaris_osim')) return true;
  if ((a === 'bendahara' || a === 'bendahara_osim') && (b === 'bendahara' || b === 'bendahara_osim')) return true;
  return false;
}

/**
 * Normalizes entire user object, ensuring canonical role and position are populated
 * without mutating or losing existing credentials or identity.
 */
export function normalizeUserProfile(user: UserProfile): UserProfile & {
  canonicalRole: CanonicalUserRole | null;
  canonicalPosition?: OsimPosition;
} {
  const canonicalRole = normalizeUserRole(user.role);
  const canonicalPosition = normalizeOsimPosition(user);

  return {
    ...user,
    role: canonicalRole || user.role,
    position: canonicalPosition || user.position,
    canonicalRole,
    canonicalPosition
  };
}

/**
 * Checks whether user has any of the specified canonical roles.
 */
export function hasRole(
  user: UserProfile | null | undefined,
  ...roles: CanonicalUserRole[]
): boolean {
  if (!user) return false;
  const normalized = normalizeUserRole(user.role);
  if (!normalized) return false;
  return roles.includes(normalized);
}

/**
 * Checks whether user has any of the specified OSIM positions.
 */
export function hasPosition(
  user: UserProfile | null | undefined,
  ...positions: OsimPosition[]
): boolean {
  if (!user) return false;
  const pos = normalizeOsimPosition(user);
  if (!pos) return false;
  return positions.some(p => isSameOsimPosition(pos, p));
}

/**
 * Checks whether user has scope over a given resource (extracurricular or OSIM department).
 */
export function hasScope(
  user: UserProfile | null | undefined,
  scopeType: 'extracurricular' | 'osim_department',
  targetId: string
): boolean {
  if (!user) return false;
  const canonical = normalizeUserRole(user.role);
  if (!canonical) return false;

  // Super admin & Waka have global scope over all resources
  if (canonical === 'super_admin' || canonical === 'waka_kesiswaan') {
    return true;
  }

  if (scopeType === 'extracurricular') {
    // Check direct extracurricularIds array
    if (user.extracurricularIds && user.extracurricularIds.includes(targetId)) {
      return true;
    }
    // Check assignments array
    if (
      user.assignments?.some(
        a => a.type === 'extracurricular' && (a.id === targetId || a.id === 'all')
      )
    ) {
      return true;
    }
    return false;
  }

  if (scopeType === 'osim_department') {
    // Pembina OSIM has global scope over all OSIM departments
    if (canonical === 'pembina_osim') return true;

    // BPH (Ketua & Wakil) have supervision scope over all departments
    const pos = normalizeOsimPosition(user);
    if (pos === 'ketua_osim' || pos === 'wakil_ketua_osim') return true;

    // Sekbid leaders/members have scope only over their own department
    return user.osimDepartmentId === targetId;
  }

  return false;
}

/**
 * Core Permission Matrix Evaluation.
 * Evaluates Role + Position + Scope to produce a boolean capability decision.
 */
export function hasPermission(
  user: UserProfile | null | undefined,
  permission: Permission
): boolean {
  if (!user) return false;
  const role = normalizeUserRole(user.role);
  if (!role) return false;
  const pos = normalizeOsimPosition(user);

  // 1. Super Admin has unrestricted permissions across all modules
  if (role === 'super_admin') {
    return true;
  }

  // 2. Waka Kesiswaan permissions
  if (role === 'waka_kesiswaan') {
    if (permission === 'settings.manage') {
      return canRoleInputModule(user.role, 'config_master', user);
    }
    if (permission === 'permissions.manage_system') {
      return canRoleInputModule(user.role, 'cpanel_users', user);
    }
    return true;
  }

  // 3. Guru BK permissions
  if (role === 'guru_bk') {
    switch (permission) {
      case 'dashboard.view':
      case 'students.view':
      case 'violations.view':
      case 'violations.manage':
      case 'counseling.view':
      case 'counseling.manage':
      case 'dispensations.view':
      case 'dispensations.manage':
      case 'reports.view':
      case 'reports.create':
        return true;
      // If Guru BK has extracurricular assignment, allow viewing/attendance
      case 'extracurricular.view':
      case 'extracurricular.attendance':
      case 'extracurricular.activity':
      case 'extracurricular.report':
        return (user.extracurricularIds && user.extracurricularIds.length > 0) ||
               (user.assignments?.some(a => a.type === 'extracurricular') ?? false);
      default:
        return false;
    }
  }

  // 4. Pembina OSIM permissions
  if (role === 'pembina_osim') {
    switch (permission) {
      case 'dashboard.view':
      case 'students.view':
      case 'osim.view':
      case 'osim.manage':
      case 'osim.program.review':
      case 'osim.program.approve': // ONLY Pembina OSIM has final approval
      case 'osim.report.verify':
      case 'cash.view': // Pembina OSIM can monitor OSIM cash
      case 'reports.view':
      case 'reports.create':
        return true;
      default:
        return false;
    }
  }

  // 5. Coach Ekstrakurikuler permissions
  if (role === 'coach_ekstrakurikuler' || (role as any) === 'pembina_ekstrakurikuler') {
    switch (permission) {
      case 'dashboard.view':
      case 'students.view':
      case 'extracurricular.view':
      case 'extracurricular.manage':
      case 'extracurricular.attendance':
      case 'extracurricular.activity':
      case 'extracurricular.report':
      case 'reports.view':
        return true;
      default:
        return false;
    }
  }

  // 6. Anggota OSIM permissions (Evaluated by Position)
  if (role === 'anggota_osim') {
    switch (permission) {
      case 'dashboard.view':
      case 'osim.view':
        return true;

      case 'osim.program.create':
        // All OSIM members (BPH & Sekbid) can draft and submit program proposals
        return true;

      case 'osim.program.review':
        // Ketua & Wakil perform internal review (not final approval)
        return pos === 'ketua_osim' || pos === 'wakil_ketua_osim';

      case 'osim.program.approve':
        // Ketua OSIM DOES NOT replace Pembina OSIM for final approval
        return false;

      case 'osim.manage':
        // Sekretaris & BPH manage administration, meetings, documentation
        return pos === 'ketua_osim' || pos === 'wakil_ketua_osim' || pos === 'sekretaris' || pos === 'sekretaris_osim';

      case 'cash.view':
      case 'cash.create':
      case 'cash.update':
        // Bendahara OSIM manages OSIM cash transactions
        return pos === 'bendahara' || pos === 'bendahara_osim';

      case 'cash.void':
        // Void requires supervisor audit trail; Bendahara cannot silently delete
        return false;

      case 'reports.view':
        return true;

      default:
        return false;
    }
  }

  return false;
}

/**
 * Capability Helper: Can the user manage Cash Ledger?
 */
export function canManageCash(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  const role = normalizeUserRole(user.role);
  if (!role) return false;
  const pos = normalizeOsimPosition(user);

  return (
    role === 'super_admin' ||
    role === 'waka_kesiswaan' ||
    (role === 'anggota_osim' && (pos === 'bendahara' || pos === 'bendahara_osim')) ||
    user.isCashManager === true // legacy backward compatibility flag
  );
}

/**
 * Capability Helper: Can the user review OSIM programs internally?
 */
export function canReviewOsimProgram(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  const role = normalizeUserRole(user.role);
  if (!role) return false;
  const pos = normalizeOsimPosition(user);

  return (
    role === 'super_admin' ||
    role === 'waka_kesiswaan' ||
    role === 'pembina_osim' ||
    pos === 'ketua_osim' ||
    pos === 'wakil_ketua_osim'
  );
}

/**
 * Capability Helper: Can the user give official final approval to OSIM programs?
 * CRITICAL RULE: Ketua OSIM is NOT a replacement for Pembina OSIM.
 */
export function canApproveOsimProgram(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  const role = normalizeUserRole(user.role);
  if (!role) return false;

  return (
    role === 'super_admin' ||
    role === 'waka_kesiswaan' ||
    role === 'pembina_osim'
  );
}

/**
 * Capability Helper: Can the user manage a specific Extracurricular club?
 */
export function canManageExtracurricular(
  user: UserProfile | null | undefined,
  ekskulId?: string
): boolean {
  if (!user) return false;
  const role = normalizeUserRole(user.role);
  if (!role) return false;

  if (role === 'super_admin' || role === 'waka_kesiswaan') {
    return true;
  }

  if (role === 'coach_ekstrakurikuler' || (role as any) === 'pembina_ekstrakurikuler') {
    if (!ekskulId) return true;
    return hasScope(user, 'extracurricular', ekskulId);
  }

  // Multi-assignment check (e.g. Guru BK assigned to Pramuka)
  if (ekskulId && user.assignments?.some(a => a.type === 'extracurricular' && a.id === ekskulId)) {
    return true;
  }

  return false;
}

/**
 * Capability Helper: Can the user access a specific application menu tab?
 */
export function canAccessMenu(
  user: UserProfile | null | undefined,
  menuId: string
): boolean {
  if (!user) return false;
  const role = normalizeUserRole(user.role);
  if (!role) return false;
  const pos = normalizeOsimPosition(user);

  if (role === 'super_admin') return true;

  switch (menuId) {
    case 'dashboard':
      return true;

    case 'students':
      return (
        role === 'waka_kesiswaan' ||
        role === 'guru_bk' ||
        role === 'pembina_osim' ||
        role === 'coach_ekstrakurikuler'
      );

    case 'teachers':
      return role === 'waka_kesiswaan' || canRoleViewModule(user.role, 'crud_teachers', user);

    case 'osim':
      return (
        role === 'waka_kesiswaan' ||
        role === 'pembina_osim' ||
        role === 'anggota_osim' ||
        canRoleViewModule(user.role, 'osim_structure', user) ||
        canRoleViewModule(user.role, 'proposal_lpj', user)
      );

    case 'extracurricular':
    case 'extracurriculars':
      return (
        role === 'waka_kesiswaan' ||
        role === 'coach_ekstrakurikuler' ||
        (user.extracurricularIds && user.extracurricularIds.length > 0) ||
        canRoleViewModule(user.role, 'extracurricular_grading', user) ||
        canRoleViewModule(user.role, 'crud_pembina_ekstra', user)
      );

    case 'members':
      return (
        role === 'waka_kesiswaan' ||
        role === 'coach_ekstrakurikuler' ||
        (user.extracurricularIds && user.extracurricularIds.length > 0) ||
        canRoleViewModule(user.role, 'crud_members', user)
      );

    case 'cash':
    case 'cash_ledger':
      return (
        role === 'waka_kesiswaan' ||
        role === 'guru_bk' ||
        role === 'pembina_osim' ||
        role === 'coach_ekstrakurikuler' ||
        pos === 'bendahara' ||
        pos === 'bendahara_osim' ||
        user.isCashManager === true ||
        canRoleViewModule(user.role, 'cash_osim', user)
      );

    case 'counseling':
      return role === 'waka_kesiswaan' || role === 'guru_bk' || canRoleViewModule(user.role, 'counseling_confidential', user);

    case 'violations':
      return role === 'waka_kesiswaan' || role === 'guru_bk' || canRoleViewModule(user.role, 'violations_discipline', user);

    case 'dispensations':
    case 'permissions':
      return (
        role === 'waka_kesiswaan' ||
        role === 'guru_bk' ||
        role === 'pembina_osim' ||
        role === 'coach_ekstrakurikuler' ||
        canRoleViewModule(user.role, 'dispensation_letters', user)
      );

    case 'reports':
      return true;

    case 'cpanel':
    case 'users':
      return canRoleViewModule(user.role, 'cpanel_users', user) || canRoleInputModule(user.role, 'cpanel_users', user);

    case 'settings':
      return role === 'waka_kesiswaan' || canRoleViewModule(user.role, 'config_master', user);

    default:
      return true;
  }
}
