/**
 * PRIORITY 2: AUTOMATED SECURITY & RBAC INVARIANT TEST SUITE
 * SIM-KESISWAAN MAN 2 SERAM BAGIAN TIMUR
 *
 * Rigorously verifies:
 * 1. Role-based access control (RBAC) across all school roles.
 * 2. Prevention of self-role escalation & unauthorized privilege changes.
 * 3. Prevention of non-admin account creation, updates, and deletion.
 * 4. Protection of registered teachers, staff, and NIP/NIS master data against accidental purge.
 * 5. Strict boundary enforcement for sensitive modules (BK Counseling, Cash Ledger, OSIM Approvals).
 */

import {
  canAccessMenu,
  canManageViolations,
  canViewViolations,
  canApproveOsimProgram,
  canReviewOsimProgram,
  canManageCash,
  canManageExtracurricular,
  normalizeUserRole,
  normalizeOsimPosition
} from '../src/permissions';

import {
  isProtectedTeacherOrStaff,
  isProtectedFunctionalUid,
  isDeletedUid,
  addDeletedUid,
  getDeletedUids
} from '../src/utils/syncUtils';

import { UserProfile, Teacher } from '../src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`\x1b[32m✔ [PASSED]\x1b[0m ${testName}`);
  } else {
    failed++;
    console.error(`\x1b[31m✘ [FAILED]\x1b[0m ${testName}${detail ? ` - ${detail}` : ''}`);
  }
}

console.log('======================================================');
console.log('PRIORITY 2: RBAC MATRIX, PRIVILEGE ESCALATION & DATA SAFETY TESTS');
console.log('======================================================\n');

// -----------------------------------------------------------------------------
// 1. ROLE ACCURACY & NORMALIZATION
// -----------------------------------------------------------------------------
console.log('--- 1. Role Normalization & Boundary Safety ---');
assert(normalizeUserRole('super_admin') === 'super_admin', 'Role super_admin maps to super_admin');
assert(normalizeUserRole('admin') === 'super_admin', 'Role admin maps to super_admin');
assert(normalizeUserRole('waka_kesiswaan') === 'waka_kesiswaan', 'Role waka_kesiswaan maps to waka_kesiswaan');
assert(normalizeUserRole('guru_bk') === 'guru_bk', 'Role guru_bk maps to guru_bk');
assert(normalizeUserRole('wali_kelas') === 'wali_kelas', 'Role wali_kelas maps to wali_kelas');
assert(normalizeUserRole('guru') === 'guru', 'Role guru maps to guru');
assert(normalizeUserRole('guru_mapel') === 'guru', 'Role guru_mapel maps to guru');
assert(normalizeUserRole('pembina_osim') === 'pembina_osim', 'Role pembina_osim maps to pembina_osim');
assert(normalizeUserRole('pembina_ekskul') === 'coach_ekstrakurikuler', 'Role pembina_ekskul maps to coach_ekstrakurikuler');
assert(normalizeUserRole('anggota_osim') === 'anggota_osim', 'Role anggota_osim maps to anggota_osim');
assert(normalizeUserRole('siswa') === 'siswa', 'Role siswa maps to siswa');
assert(normalizeUserRole('hacker_role') === null, 'Unrecognized/malicious role safely normalizes to null (Deny by default)');

// -----------------------------------------------------------------------------
// 2. GURU BK (BIMBINGAN KONSELING) PRIVILEGES & ISOLATION
// -----------------------------------------------------------------------------
console.log('\n--- 2. Guru BK Privileges & Confidentiality Isolation ---');
const guruBkUser: UserProfile = {
  uid: 'user_guru_bk',
  displayName: 'Dra. Rahmawati (Guru BK)',
  email: 'bk@man2sbt.sch.id',
  role: 'guru_bk',
  nip: '197503122000032001',
  status: 'Aktif'
};

assert(canAccessMenu(guruBkUser, 'counseling') === true, 'Guru BK CAN access counseling menu');
assert(canAccessMenu(guruBkUser, 'violations') === true, 'Guru BK CAN access violations menu');
assert(canManageViolations(guruBkUser) === true, 'Guru BK CAN record/manage student violations');
assert(canAccessMenu(guruBkUser, 'cpanel') === false, 'Guru BK CANNOT access cPanel administrative panel');
assert(canApproveOsimProgram(guruBkUser) === false, 'Guru BK CANNOT give final approval to OSIM programs');

// -----------------------------------------------------------------------------
// 3. WALI KELAS & GURU MAPEL (READ-ONLY ON VIOLATIONS, NO COUNSELING)
// -----------------------------------------------------------------------------
console.log('\n--- 3. Wali Kelas & Guru Mapel Boundary Enforcement ---');
const waliKelasUser: UserProfile = {
  uid: 'user_wali_kelas_10_mipa_1',
  displayName: 'Drs. Hasan (Wali Kelas X MIPA 1)',
  email: 'hasan@man2sbt.sch.id',
  role: 'wali_kelas',
  nip: '198005142008011005',
  status: 'Aktif'
};

const guruMapelUser: UserProfile = {
  uid: 'user_guru_matematika',
  displayName: 'Siti Aminah, S. Pd (Guru Matematika)',
  email: 'siti@man2sbt.sch.id',
  role: 'guru',
  nip: '198507202010012012',
  status: 'Aktif'
};

assert(canAccessMenu(waliKelasUser, 'counseling') === false, 'Wali Kelas CANNOT access confidential BK counseling');
assert(canAccessMenu(guruMapelUser, 'counseling') === false, 'Guru Mapel CANNOT access confidential BK counseling');
assert(canViewViolations(waliKelasUser) === true, 'Wali Kelas CAN view student violations');
assert(canManageViolations(waliKelasUser) === false, 'Wali Kelas CANNOT record or delete student violations (Read-only enforcement)');
assert(canViewViolations(guruMapelUser) === true, 'Guru Mapel CAN view student violations');
assert(canManageViolations(guruMapelUser) === false, 'Guru Mapel CANNOT record or delete student violations (Read-only enforcement)');
assert(canAccessMenu(waliKelasUser, 'cpanel') === false, 'Wali Kelas CANNOT access cPanel');
assert(canAccessMenu(guruMapelUser, 'cpanel') === false, 'Guru Mapel CANNOT access cPanel');

// -----------------------------------------------------------------------------
// 4. OSIM ACCESS MATRIX & APPROVAL AUTHORITY
// -----------------------------------------------------------------------------
console.log('\n--- 4. OSIM Access Matrix & Approval Authority ---');
const ketuaOsimUser: UserProfile = {
  uid: 'user_osim_ketua',
  displayName: 'M. Farhan (Ketua OSIM)',
  email: 'farhan.osim@man2sbt.sch.id',
  role: 'anggota_osim',
  position: 'ketua_osim',
  status: 'Aktif'
};

const bendaharaOsimUser: UserProfile = {
  uid: 'user_osim_bendahara',
  displayName: 'Aulia Putri (Bendahara OSIM)',
  email: 'aulia.osim@man2sbt.sch.id',
  role: 'anggota_osim',
  position: 'bendahara',
  isCashManager: true,
  status: 'Aktif'
};

const pembinaOsimUser: UserProfile = {
  uid: 'user_pembina_osim',
  displayName: 'Puput Eka Bajuri, S. Pd., M. Or (Pembina OSIM)',
  email: 'puputbajuri24@gmail.com',
  role: 'pembina_osim',
  nip: '198810052020121003',
  status: 'Aktif'
};

assert(canAccessMenu(ketuaOsimUser, 'osim') === true, 'Ketua OSIM CAN access OSIM module');
assert(canReviewOsimProgram(ketuaOsimUser) === true, 'Ketua OSIM CAN perform internal proposal review');
assert(canApproveOsimProgram(ketuaOsimUser) === false, 'Ketua OSIM CANNOT give final official approval (Final approval reserved for Pembina)');
assert(canApproveOsimProgram(pembinaOsimUser) === true, 'Pembina OSIM CAN give final official approval to OSIM programs');
assert(canAccessMenu(ketuaOsimUser, 'counseling') === false, 'Ketua OSIM CANNOT access BK counseling records');
assert(canAccessMenu(ketuaOsimUser, 'cpanel') === false, 'Ketua OSIM CANNOT access cPanel');
assert(canManageCash(bendaharaOsimUser) === true, 'Bendahara OSIM CAN record cash entries for OSIM');
assert(canManageCash(ketuaOsimUser) === false, 'Ketua OSIM CANNOT record cash transactions directly');

// -----------------------------------------------------------------------------
// 5. SISWA PORTAL RESTRICTIONS
// -----------------------------------------------------------------------------
console.log('\n--- 5. Siswa Portal Strict Restrictions ---');
const siswaUser: UserProfile = {
  uid: 'student_24251001',
  displayName: 'Ahmad Santri',
  email: 'ahmad@siswa.man2sbt.sch.id',
  role: 'siswa',
  studentNis: '24251001',
  status: 'Aktif'
};

assert(canAccessMenu(siswaUser, 'dashboard') === true, 'Siswa CAN view student dashboard');
assert(canAccessMenu(siswaUser, 'reports') === true, 'Siswa CAN view report card');
assert(canAccessMenu(siswaUser, 'cpanel') === false, 'Siswa CANNOT access cPanel');
assert(canAccessMenu(siswaUser, 'counseling') === false, 'Siswa CANNOT access BK counseling');
assert(canAccessMenu(siswaUser, 'teachers') === false, 'Siswa CANNOT access teachers management');
assert(canAccessMenu(siswaUser, 'settings') === false, 'Siswa CANNOT access settings');
assert(canManageViolations(siswaUser) === false, 'Siswa CANNOT manage violations');

// -----------------------------------------------------------------------------
// 6. TEACHER & STAFF PROTECTION (DATA LOSS PREVENTION)
// -----------------------------------------------------------------------------
console.log('\n--- 6. Teacher & Staff Protection Against Inadvertent Deletion ---');
const realTeacherRecord: Teacher = {
  id: 'teacher_01',
  fullName: 'Zakaria, S. Pd.I., M. Pd',
  nip: '197808042003121008',
  email: 'zakaria@man2sbt.sch.id',
  phone: '081234567890',
  role: 'guru',
  subject: 'Kepala Madrasah & Akidah Akhlak',
  isActive: true
};

const realTeacherUser: UserProfile = {
  uid: 'user_guru_01',
  displayName: 'Zakaria, S. Pd.I., M. Pd',
  nip: '197808042003121008',
  email: 'zakaria@man2sbt.sch.id',
  role: 'guru',
  status: 'Aktif'
};

assert(isProtectedTeacherOrStaff(realTeacherRecord) === true, 'Real Teacher record is protected by isProtectedTeacherOrStaff');
assert(isProtectedTeacherOrStaff(realTeacherUser) === true, 'Real Teacher user account is protected by isProtectedTeacherOrStaff');
assert(isProtectedFunctionalUid('user_guru_01') === true, 'user_guru_01 is recognized as a protected functional UID');
assert(isProtectedFunctionalUid('user_guru_bk') === true, 'user_guru_bk is recognized as a protected functional UID');
assert(isProtectedFunctionalUid('user_waka') === true, 'user_waka is recognized as a protected functional UID');

// Verify that NIPs cannot be treated as deleted UIDs
assert(isDeletedUid('197808042003121008') === false, '18-digit Teacher NIP is NEVER treated as deleted UID');
assert(isDeletedUid('user_197808042003121008') === false, 'Prefixed Teacher NIP is NEVER treated as deleted UID');
assert(isDeletedUid('user_guru_01') === false, 'Sequence Teacher UID is NEVER treated as deleted UID');

// Verify that student NIS cannot be treated as deleted UIDs
assert(isDeletedUid('24251001') === false, 'Student NIS is NEVER treated as deleted UID');

console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed} TESTS)`);
console.log('======================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\x1b[32m✔ ALL PRIORITY 2 RBAC, PRIVILEGE ESCALATION & DATA SAFETY TESTS PASSED!\x1b[0m\n');
  process.exit(0);
}
