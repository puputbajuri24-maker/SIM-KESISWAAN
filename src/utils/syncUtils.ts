import { UserProfile, Teacher, Student, OsimMember } from '../types';
import { isEligibleOsimAccount, isKetuaSekbid, isAnggotaSekbid } from './osimAccountHelper';

/**
 * Normalizes Indonesian personal names by stripping common academic/honorific titles,
 * removing punctuation, lowercasing, and collapsing spaces.
 */
export const normalizeName = (name?: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, ' ') // Remove parentheses like (Ketua OSIM)
    .replace(/\b(drs|dra|dr|prof|h|hj|kh|ustadz|ustadzah|s\.?\s*pd\.?\s*i?|m\.?\s*pd\.?\s*i?|s\.?\s*ag|m\.?\s*ag|s\.?\s*or|m\.?\s*or|s\.?\s*kom|m\.?\s*kom|s\.?\s*e|s\.?\s*si|m\.?\s*si|ph\.?d|lc|b\.?a|m\.?a)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

/**
 * Strips all non-digit characters from string for clean NIP / NIS / NISN comparison.
 */
export const cleanDigits = (val?: string): string => {
  if (!val) return '';
  return val.replace(/\D/g, '');
};

const DELETED_UIDS_KEY = 'sim_kesiswaan_deleted_user_uids';

/**
 * Functional OSIM & administrative role UIDs that must NEVER be permanently tombstoned.
 * When individual persons change or resign, the role/position slot itself remains available.
 */
export const PROTECTED_FUNCTIONAL_UIDS = new Set([
  'user_super_admin',
  'super_admin',
  'user_waka',
  'user_waka_kesiswaan',
  'waka_kesiswaan',
  'user_admin_kesiswaan',
  'admin_kesiswaan',
  'user_guru_bk',
  'guru_bk',
  'user_pembina_osim',
  'pembina_osim',
  'user_pembina_ekskul',
  'user_pembina',
  'pembina_ekskul',
  'pembina',
  'user_osim_dept_bph',
  'user_osim_ketua',
  'user_osim_wakil',
  'user_osim_sekretaris',
  'user_osim_bendahara',
  'osim.ketua',
  'osim.wakil',
  'osim.sekretaris',
  'osim.bendahara',
  'dept_bph',
  'user_osim_sekbid1',
  'user_osim_sekbid2',
  'user_osim_sekbid3',
  'user_osim_sekbid4',
  'user_osim_sekbid5',
  'user_osim_sekbid6',
  'user_osim_sekbid7',
  'user_osim_sekbid8',
  'user_osim_dept_sekbid_1',
  'user_osim_dept_sekbid_2',
  'user_osim_dept_sekbid_3',
  'user_osim_dept_sekbid_4',
  'user_osim_dept_sekbid_5',
  'user_osim_dept_sekbid_6',
  'user_osim_dept_sekbid_7',
  'user_osim_dept_sekbid_8',
  'user_staf_tu',
  'staf_tu',
  'user_tu',
  'tu'
]);

export const isProtectedFunctionalUid = (uid?: string): boolean => {
  if (!uid) return false;
  const clean = uid.toLowerCase().trim();
  if (PROTECTED_FUNCTIONAL_UIDS.has(clean)) return true;
  if (/^guru_\d+$/i.test(clean) || /^user_guru_\d+$/i.test(clean)) return true;
  if (/^teacher_\d+$/i.test(clean) || /^user_teacher_\d+$/i.test(clean) || /^t_\d+$/i.test(clean)) return true;
  if (/^user_tu/i.test(clean) || /^tu_/i.test(clean) || /^staf_tu/i.test(clean) || /^user_staf_tu/i.test(clean)) return true;
  if (/^user_guru_bk(_.*)?$/.test(clean) || /^guru_bk(_.*)?$/.test(clean)) return true;
  if (/^user_pembina_/.test(clean) || /^pembina_/.test(clean)) return true;
  if (/^user_osim_dept_sekbid_\d+$/.test(clean)) return true;
  if (/^osim\.sekbid\d+$/.test(clean)) return true;
  if (/^user_osim_(ketua|wakil|sekretaris|bendahara|sekbid)$/.test(clean)) return true;
  if (/^user_osim_dept_/.test(clean)) return true;
  if (/^user_osim_/i.test(clean)) return true;
  if (/^osim_m_/i.test(clean)) return true;
  if (/^osim\./i.test(clean)) return true;
  return false;
};

export const isProtectedTeacherOrStaff = (u: any): boolean => {
  if (!u) return false;
  const role = (u.role || '').toLowerCase().trim();
  const uid = (u.uid || u.id || '').toLowerCase().trim();
  const cleanNip = cleanDigits(u.nip || '');

  if ([
    'guru', 'guru_bk', 'wali_kelas', 'guru_mapel', 'pembina_ekskul', 'pembina_osim',
    'pembina', 'coach_ekstrakurikuler', 'kepala_madrasah', 'waka_kesiswaan', 'admin',
    'super_admin', 'staf_tu', 'tu', 'staf_tata_usaha', 'tata_usaha'
  ].includes(role)) {
    return true;
  }
  if (cleanNip.length >= 6) {
    return true;
  }
  if (
    uid.startsWith('user_guru_') || uid.startsWith('guru_') ||
    uid.startsWith('user_teacher_') || uid.startsWith('teacher_') || uid.startsWith('t_') ||
    uid.startsWith('user_tu') || uid.startsWith('tu_') || uid.startsWith('user_staf_tu') || uid.startsWith('staf_tu') ||
    uid === 'user_waka' || uid === 'user_guru_bk' || uid === 'user_super_admin'
  ) {
    return true;
  }
  return false;
};

/**
 * Tombstone tracking for deleted user accounts so stale local caches or
 * un-purged default demo sets never resurrect deleted accounts.
 */
export const getDeletedUids = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_UIDS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        // Filter out any protected functional UIDs, teacher accounts, OSIM members, emails, and student NIS / teacher NIP numbers (numeric 4 to 25 digits)
        const valid = arr.filter(id => {
          if (!id) return false;
          if (typeof id === 'string' && id.includes('@')) return false; // NEVER tombstone email addresses!
          if (isProtectedFunctionalUid(id)) return false;
          if (isProtectedTeacherOrStaff({ uid: id, id })) return false;
          if (/^guru_\d+$/i.test(id) || /^user_guru_\d+$/i.test(id)) return false;
          if (/^user_osim_/i.test(id) || /^osim_m_/i.test(id) || /^osim\./i.test(id)) return false;
          // Never tombstone student NIS numbers or teacher NIPs (4 to 25 digits)
          if (/^\d{4,25}$/.test(id)) return false;
          if (/^user_\d{4,25}$/.test(id)) return false;
          if (/^teacher_/i.test(id) || /^user_teacher_/i.test(id) || /^t_\d+/i.test(id)) return false;
          return true;
        });
        if (valid.length !== arr.length) {
          localStorage.setItem(DELETED_UIDS_KEY, JSON.stringify(valid));
        }
        return new Set(valid);
      }
    }
  } catch (e) {}
  return new Set();
};

export const addDeletedUid = (uid: string) => {
  if (!uid || isProtectedFunctionalUid(uid)) return;
  const cleanTrimmed = uid.trim();
  // Never tombstone emails, sequence teacher IDs, OSIM members, teacher NIPs, or student NIS numbers
  if (
    !cleanTrimmed ||
    cleanTrimmed === '-' ||
    cleanTrimmed.includes('@') || // NEVER tombstone emails!
    cleanTrimmed === 'user_' ||
    cleanTrimmed === 'guru_' ||
    cleanTrimmed === 'osim_' ||
    isProtectedTeacherOrStaff({ uid: cleanTrimmed, id: cleanTrimmed }) ||
    /^guru_\d+$/i.test(cleanTrimmed) ||
    /^user_guru_\d+$/i.test(cleanTrimmed) ||
    /^user_osim_/i.test(cleanTrimmed) ||
    /^osim_m_/i.test(cleanTrimmed) ||
    /^osim\./i.test(cleanTrimmed) ||
    /^\d{4,25}$/.test(cleanTrimmed) ||
    /^user_\d{4,25}$/.test(cleanTrimmed) ||
    /^teacher_/i.test(cleanTrimmed) ||
    /^user_teacher_/i.test(cleanTrimmed) ||
    /^t_\d+/i.test(cleanTrimmed) ||
    /^user_tu/i.test(cleanTrimmed) ||
    /^staf_tu/i.test(cleanTrimmed)
  ) return;

  try {
    const set = getDeletedUids();
    set.add(uid);
    set.add(cleanTrimmed.toLowerCase());
    // Also add related prefix variations if applicable
    if (uid.startsWith('user_')) {
      const clean = uid.replace(/^user_/, '');
      if (!isProtectedFunctionalUid(clean) && clean !== 'guru_' && !/^guru_\d+$/i.test(clean) && !/^user_osim_/i.test(clean) && !/^osim_m_/i.test(clean) && !/^\d{4,10}$/.test(clean)) {
        set.add(clean);
        set.add(clean.toLowerCase());
      }
    } else {
      set.add(`user_${uid}`);
      set.add(`user_${cleanTrimmed.toLowerCase()}`);
    }
    localStorage.setItem(DELETED_UIDS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {}
};

export const removeDeletedUid = (uid: string) => {
  if (!uid) return;
  const lower = uid.trim().toLowerCase();
  try {
    const set = getDeletedUids();
    set.delete(uid);
    set.delete(lower);
    set.delete(`user_${uid}`);
    set.delete(`user_${lower}`);
    set.delete(uid.replace(/^user_/, ''));
    set.delete(lower.replace(/^user_/, ''));
    localStorage.setItem(DELETED_UIDS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {}
};

export const isDeletedUid = (uid?: string): boolean => {
  if (!uid) return false;
  const clean = uid.trim().toLowerCase();
  if (clean === 'user_super_admin' || clean === 'super_admin' || clean === 'puputbajuri24@gmail.com') {
    return false;
  }
  // Emails must NEVER be considered deleted/tombstoned
  if (clean.includes('@')) {
    return false;
  }
  if (isProtectedFunctionalUid(clean)) {
    return false;
  }
  if (isProtectedTeacherOrStaff({ uid: clean, id: clean })) {
    return false;
  }
  if (/^guru_\d+$/i.test(clean) || /^user_guru_\d+$/i.test(clean)) {
    return false;
  }
  if (/^user_osim_/i.test(clean) || /^osim_m_/i.test(clean) || /^osim\./i.test(clean)) {
    return false;
  }
  if (/^\d{4,25}$/.test(clean) || /^user_\d{4,25}$/.test(clean)) {
    return false;
  }
  if (/^teacher_/i.test(clean) || /^user_teacher_/i.test(clean) || /^t_\d+/i.test(clean) || /^user_tu/i.test(clean) || /^staf_tu/i.test(clean)) {
    return false;
  }
  try {
    const set = getDeletedUids();
    if (set.has(uid) || set.has(clean)) return true;
    if (set.has(`user_${uid}`) || set.has(`user_${clean}`)) return true;
    if (uid.startsWith('user_') && (set.has(uid.replace(/^user_/, '')) || set.has(clean.replace(/^user_/, '')))) return true;
  } catch (e) {}
  return false;
};

/**
 * Check if a UserProfile and Teacher represent the exact same individual.
 */
export const isTeacherUserMatch = (u: UserProfile, t: Teacher): boolean => {
  if (!u || !t) return false;

  // 0. Strict Cross-Role Guard: An OSIM profile can NEVER match a Teacher
  if (
    u.role === 'anggota_osim' ||
    u.role === 'pengurus_osim' ||
    u.uid.startsWith('user_osim_') ||
    u.uid.startsWith('osim_') ||
    Boolean(u.osimRole)
  ) {
    return false;
  }

  // 1. Primary relational link: Explicit teacherId
  if (u.teacherId && t.id) {
    if (u.teacherId === t.id) return true;
    // If both have different explicit teacherIds, they CANNOT be the same person
    return false;
  }
  if ((t as any).userUid && u.uid && (t as any).userUid === u.uid) return true;

  // 2. Direct exact ID match
  if (u.uid === t.id) return true;
  if (u.uid === `user_${t.id}`) return true;
  if (t.id === `user_${u.uid}`) return true;

  // 3. NIP match (ignoring spaces & non-digits, at least 6 digits)
  const uNip = cleanDigits(u.nip);
  const tNip = cleanDigits(t.nip);
  if (uNip && tNip && uNip.length >= 6 && tNip.length >= 6) {
    if (uNip === tNip) return true;
    // If both have valid different NIPs, they are definitely different individuals
    return false;
  }

  // 4. Institutional or personal email match (must not be generic placeholder)
  if (u.email && t.email && !isGenericPlaceholderEmail(u.email) && !isGenericPlaceholderEmail(t.email)) {
    if (u.email.trim().toLowerCase() === t.email.trim().toLowerCase()) return true;
  }

  // 5. Phone number match if available and valid (at least 8 digits)
  if (u.phone && t.phone) {
    const cleanUPhone = cleanDigits(u.phone);
    const cleanTPhone = cleanDigits(t.phone);
    if (cleanUPhone.length >= 8 && cleanUPhone === cleanTPhone) return true;
  }

  // 6. Normalized Name match (must be supported by role or phone)
  const normU = normalizeName(u.displayName);
  const normT = normalizeName(t.fullName);
  if (normU && normT && normU === normT && normU.length >= 5) {
    // If names match, check if role confirms they are teacher/staff
    const teacherRoles = ['super_admin', 'admin', 'waka_kesiswaan', 'guru_bk', 'pembina_osim', 'pembina_ekskul', 'coach_ekstrakurikuler', 'wali_kelas', 'guru', 'guru_mapel', 'staf_tu'];
    if (teacherRoles.includes(u.role)) {
      return true;
    }
  }

  return false;
};

/**
 * Check if a UserProfile and Student represent the exact same individual.
 */
export const isStudentUserMatch = (u: UserProfile, s: Student): boolean => {
  if (!u || !s) return false;

  // 1. Direct ID match
  if (u.uid === s.id || u.uid === `user_${s.id}` || s.id === `user_${u.uid}`) return true;

  // 2. NIS match
  const uNis = cleanDigits(u.nip);
  const sNis = cleanDigits(s.nis);
  if (uNis && sNis && uNis.length >= 4 && uNis === sNis) return true;

  // 3. Username contains NIS
  if (u.username && s.nis && cleanDigits(u.username).includes(cleanDigits(s.nis))) return true;

  // 4. Email match
  if (u.email && (s as any).email && u.email.trim().toLowerCase() === (s as any).email.trim().toLowerCase()) return true;

  // 5. Normalized Name match
  const normU = normalizeName(u.displayName);
  const normS = normalizeName(s.fullName);
  if (normU && normS && normU.length >= 5 && normU === normS) return true;

  return false;
};

/**
 * Memeriksa apakah NIS merupakan nilai default placeholder atau tidak valid untuk deduplikasi.
 */
export const isPlaceholderNis = (nis?: string): boolean => {
  if (!nis) return true;
  const d = cleanDigits(nis);
  if (!d || d.length < 4) return true;
  if (
    d === '24251000' ||
    d === '123456' ||
    d === '12345' ||
    d === '000000' ||
    d === '999999' ||
    /^0+$/.test(d) ||
    /^1+$/.test(d)
  ) {
    return true;
  }
  return false;
};

/**
 * Ekstrak nomor sekbid (1 s.d. 8) dari string kode, nama, atau jabatan.
 */
export const extractSekbidNumber = (str?: string): number | null => {
  if (!str) return null;
  const match = str.match(/sekbid\s*[-_]?\s*(\d+)/i) || str.match(/bidang\s*[-_]?\s*(\d+)/i);
  if (match) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num) && num >= 1 && num <= 8) return num;
  }
  return null;
};

/**
 * Check if a UserProfile and OsimMember represent the exact same individual or position.
 */
export const isOsimMemberUserMatch = (u: UserProfile, m: OsimMember): boolean => {
  if (!u || !m) return false;

  // Guard: Jangan pernah mencocokkan jika berasal dari Sekbid yang berbeda
  const uSekbid = extractSekbidNumber(u.osimDepartmentCode) || extractSekbidNumber(u.osimDepartmentName) || extractSekbidNumber(u.osimPosition);
  const mSekbid = extractSekbidNumber(m.sekbid) || extractSekbidNumber(m.position);
  if (uSekbid !== null && mSekbid !== null && uSekbid !== mSekbid) return false;

  const uIsBph = u.osimDepartmentCode === 'BPH' || (u.osimDepartmentName && u.osimDepartmentName.includes('BPH')) || ['ketua', 'wakil', 'sekretaris', 'bendahara'].includes(u.osimRole || '') || ['user_osim_ketua', 'user_osim_wakil', 'user_osim_sekretaris', 'user_osim_bendahara'].includes(u.uid);
  const mPos = (m.position || '').toLowerCase();
  const mIsBph = Boolean((m.sekbid && m.sekbid.includes('BPH')) || (!mSekbid && (mPos.includes('umum') || mPos.includes('ketua') || mPos.includes('wakil') || mPos.includes('sekretaris') || mPos.includes('bendahara'))));
  if ((uSekbid !== null && mIsBph) || (uIsBph && mSekbid !== null)) return false;

  // 1. Direct ID or userUid match
  if (u.uid === m.id || u.uid === `user_${m.id}`) return true;
  if ((m as any).userUid && (u.uid === (m as any).userUid || (m as any).userUid === `user_${u.uid}`)) return true;

  // 2. Login username match
  if (u.username && m.loginUsername && u.username.toLowerCase() === m.loginUsername.toLowerCase()) return true;
  if (u.username && m.username && u.username.toLowerCase() === m.username.toLowerCase()) return true;

  // 3. NIS match and Canonical OSIM UID match (Strict pairwise equality only for genuine, non-placeholder NIS)
  const uNis = cleanDigits(u.nip);
  const mNis = cleanDigits(m.studentNis);
  if (uNis && mNis && !isPlaceholderNis(uNis) && !isPlaceholderNis(mNis) && uNis === mNis) return true;
  if (mNis && !isPlaceholderNis(mNis) && (u.uid === `user_osim_${mNis}` || cleanDigits(u.username) === mNis)) return true;
  if (uNis && !isPlaceholderNis(uNis) && (m.id === `user_osim_${uNis}` || cleanDigits(m.loginUsername || m.username || '') === uNis)) return true;

  // 4. Institutional or personal email match (must NOT be generic placeholder)
  if (u.email && m.email && !isGenericPlaceholderEmail(u.email) && !isGenericPlaceholderEmail(m.email) && u.email.trim().toLowerCase() === m.email.trim().toLowerCase()) return true;

  // 5. Normalized Name match - MUST match name exactly to prevent different students from colliding
  const normU = normalizeName(u.displayName);
  const normM = normalizeName(m.fullName);
  if (normU && normM && normU.length >= 4 && normU === normM) return true;

  return false;
};

/**
 * Check whether an email is a generic shared/placeholder email (e.g. guru@..., admin@...).
 */
export const isGenericPlaceholderEmail = (email?: string): boolean => {
  if (!email) return true;
  const em = email.trim().toLowerCase();
  return (
    em === '-' ||
    em === '' ||
    em.startsWith('guru@') ||
    em.startsWith('admin@') ||
    em.startsWith('info@') ||
    em.startsWith('user@') ||
    em.startsWith('osim@') ||
    em.startsWith('siswa@') ||
    em.includes('placeholder') ||
    em.includes('example.com') ||
    em === 'guru@sekolah.sch.id' ||
    em === 'guru@madrasah.sch.id' ||
    em === 'admin@sekolah.sch.id' ||
    em === 'admin@madrasah.sch.id'
  );
};

/**
 * Memeriksa apakah sebuah UID merupakan format standar rapi dan permanen
 */
export const isStandardTidyUid = (uid?: string): boolean => {
  if (!uid || typeof uid !== 'string') return false;
  return (
    uid === 'user_super_admin' ||
    uid === 'guru_super_admin' ||
    uid === 'user_admin_kesiswaan' ||
    uid === 'user_waka_kesiswaan' ||
    uid === 'user_guru_bk' ||
    /^user_guru_bk_\d+$/i.test(uid) ||
    uid === 'user_kepala_madrasah' ||
    uid === 'user_staf_tata_usaha' ||
    /^user_tu_\d+$/i.test(uid) ||
    /^user_guru_\d{1,3}$/i.test(uid) ||
    ['user_osim_ketua', 'user_osim_wakil', 'user_osim_sekretaris', 'user_osim_bendahara'].includes(uid) ||
    /^user_osim_sekbid[1-8]$/i.test(uid)
  );
};

/**
 * Memeriksa apakah sebuah UID merupakan artefak acak (misal timestamp Date.now, string acak Firebase Auth, atau ID campuran)
 */
export const isRandomOrLegacyArtifactUid = (uid?: string): boolean => {
  if (!uid || typeof uid !== 'string') return false;

  // 0. Deteksi artefak timestamp acak (misal user_osim_m_1790..., osim_m_1790..., user_osim_1790...)
  if (/^user_osim_m_\d{10,}/i.test(uid) || /^osim_m_\d{10,}/i.test(uid) || /^user_osim_\d{10,}/i.test(uid)) return true;
  if (/^user_guru_\d{10,}/i.test(uid) || /^user_t_\d{10,}/i.test(uid) || /^t_\d{10,}/i.test(uid)) return true;

  // IMMUNITY: Akun resmi OSIM, Guru, dan Administrator Sistem ber-ID rapi
  if (['user_super_admin', 'guru_super_admin', 'user_waka_kesiswaan', 'user_admin_kesiswaan', 'user_guru_bk'].includes(uid)) return false;
  if (/^user_guru_bk_\d+$/i.test(uid)) return false;
  if (/^user_tu_\d+$/i.test(uid)) return false;
  if (/^user_guru_\d{1,3}$/i.test(uid)) return false; // user_guru_01 s.d user_guru_999 (angka murni)
  if (['user_osim_ketua', 'user_osim_wakil', 'user_osim_sekretaris', 'user_osim_bendahara'].includes(uid)) return false;
  if (/^user_osim_sekbid[1-8]$/i.test(uid)) return false;
  
  // Format OSIM lama bertanda underscore / dept / nama yang harus dimigrasi: user_osim_sekbid_1..8, user_osim_dept_..., user_osim_2425...
  if (/^user_osim_/i.test(uid)) return true;
  if (/^osim_/i.test(uid)) return true;

  // 1. Timestamp acak 10+ digit: user_1712839...
  if (/^user_\d{10,}$/.test(uid)) return true;
  // 2. String kombinasi huruf dan angka acak 20-35 karakter tanpa garis bawah/strip (bawaan Firebase Auth UID)
  if (/^[a-zA-Z0-9]{20,35}$/.test(uid) && !uid.includes('_') && !uid.includes('-')) return true;
  // 3. UID guru bertipe kombinasi huruf & angka selain user_guru_XX (misal user_t_..., user_guru_andri, user_guru123)
  if (/^user_guru_/i.test(uid)) return true;
  if (/^user_t_/i.test(uid)) return true;
  // 4. Artefak demo ganda usang
  if (uid === 'user_teacher_pitria_lawenusa') return true;
  return false;
};

/**
 * Menyelesaikan UID rapi dan mudah dibaca manusia berdasarkan profil akun pengguna
 * Menjamin mutlak:
 * - OSIM: user_osim_ketua s.d. user_osim_sekbid8
 * - Guru: user_super_admin / guru_super_admin dan user_guru_XX (angka murni)
 */
export const resolveTidyUidForUser = (user: Partial<UserProfile>): string => {
  if (!user) return 'user_guru_01';
  const role = (user.role || '').toLowerCase();
  const username = (user.username || '').toLowerCase();
  const uid = user.uid || '';

  if (role === 'super_admin' || username === 'admin' || username === 'superadmin' || uid === 'user_super_admin' || uid === 'guru_super_admin') {
    return 'user_super_admin';
  }
  if (role === 'admin_kesiswaan') {
    return 'user_admin_kesiswaan';
  }
  if (role === 'waka_kesiswaan') {
    return 'user_waka_kesiswaan';
  }
  if (role === 'guru_bk') {
    return 'user_guru_bk';
  }

  if (role === 'staf_tu' || role === 'tata_usaha' || role === 'staff_tu') {
    if (uid && uid.startsWith('user_tu_')) return uid;
    const cleanNip = cleanDigits(user.nip);
    if (cleanNip && cleanNip.length >= 6) return `user_tu_${cleanNip}`;
    if ((user as any).teacherId) return `user_tu_${String((user as any).teacherId).replace(/^guru_/, '').replace(/^t_/, '')}`;
    return `user_tu_${username.replace(/^tu_?/, '') || 'staff'}`;
  }

  // OSIM: BPH dan Sekbid
  if (role === 'pengurus_osim' || role === 'anggota_osim' || uid.startsWith('user_osim_') || (user.username && user.username.startsWith('osim.'))) {
    const pos = (user.osimPosition || user.position || '').toLowerCase();
    const roleVal = (user.osimRole || '').toLowerCase();
    const dName = (user.osimDepartmentName || '').toLowerCase();
    const dCode = (user.osimDepartmentCode || '').toLowerCase();
    const usr = (user.username || '').toLowerCase();

    // 1. Check BPH first
    const isBph = dCode === 'bph' || dName.includes('bph') || (!dCode.includes('sekbid') && !pos.includes('sekbid') && (roleVal === 'ketua' || roleVal === 'wakil' || roleVal === 'sekretaris' || roleVal === 'bendahara'));
    if (isBph || uid === 'user_osim_ketua' || uid === 'user_osim_wakil' || uid === 'user_osim_sekretaris' || uid === 'user_osim_bendahara') {
      if (roleVal === 'ketua' || (pos.includes('ketua') && !pos.includes('wakil')) || uid === 'user_osim_ketua') return 'user_osim_ketua';
      if (roleVal === 'wakil' || pos.includes('wakil') || uid === 'user_osim_wakil') return 'user_osim_wakil';
      if (roleVal === 'sekretaris' || pos.includes('sekretaris') || uid === 'user_osim_sekretaris') return 'user_osim_sekretaris';
      if (roleVal === 'bendahara' || pos.includes('bendahara') || user.isCashManager || uid === 'user_osim_bendahara') return 'user_osim_bendahara';
    }

    // 2. Check Sekbid 1 s.d. 8 (Untuk Ketua / Koordinator Sekbid)
    const isKetuaOrKoordinator = pos.includes('ketua') || pos.includes('koordinator') || (user.position === 'ketua_sekbid');
    const sekbidMatch = (dCode + ' ' + dName + ' ' + pos + ' ' + usr + ' ' + uid).match(/sekbid\s*[-_]?\s*([1-8])/i) ||
                        (dCode + ' ' + dName + ' ' + pos).match(/bidang\s*[-_]?\s*([1-8])/i);
    if (sekbidMatch && isKetuaOrKoordinator) {
      return `user_osim_sekbid${sekbidMatch[1]}`;
    }

    if (/^user_osim_sekbid[1-8]$/i.test(uid)) {
      return uid.toLowerCase();
    }
    const legacySekbidMatch = uid.match(/^user_osim_(?:dept_)?sekbid_?([1-8])$/i);
    if (legacySekbidMatch) {
      return `user_osim_sekbid${legacySekbidMatch[1]}`;
    }

    // Untuk pengurus sekbid lainnya (anggota/sekretaris bidang), berikan UID unik berbasis NIS atau ID
    const cleanNis = cleanDigits(user.nip || (user as any).studentNis);
    if (cleanNis && cleanNis.length >= 4) {
      return `user_osim_${cleanNis}`;
    }
    if (uid && uid.startsWith('user_osim_') && !uid.includes('ineligible')) {
      return uid;
    }
    if ((user as any).id) {
      return `user_osim_${(user as any).id.replace(/^osim_/, '')}`;
    }
    return `user_osim_${username.replace(/^osim\./, '') || 'member'}`;
  }

  // GURU: Format wajib 'user_guru_XX' (angka murni 2 digit, misal user_guru_01 s.d user_guru_XX)
  const existingGuruMatch = uid.match(/^user_guru_(\d{1,3})$/i) || uid.match(/^guru_(\d{1,3})$/i);
  if (existingGuruMatch) {
    const num = parseInt(existingGuruMatch[1], 10);
    return `user_guru_${String(num).padStart(2, '0')}`;
  }

  // Cek jika username mengandung nomor guru (guru_01, guru1, dll)
  const userGuruMatch = username.match(/guru_?(\d{1,3})/i);
  if (userGuruMatch) {
    const num = parseInt(userGuruMatch[1], 10);
    return `user_guru_${String(num).padStart(2, '0')}`;
  }

  // Cek dari ID pendidik jika ada
  if ((user as any).teacherId) {
    const tIdMatch = String((user as any).teacherId).match(/(\d+)/);
    if (tIdMatch) {
      const num = parseInt(tIdMatch[1], 10);
      return `user_guru_${String(num).padStart(2, '0')}`;
    }
  }

  return 'user_guru_01';
};

/**
 * Deduplicate UserProfile array to guarantee strictly ONE record per person/role.
 * Resolves duplicate IDs such as 'user_osim_dept_bph' vs 'user_osim_ketua', or
 * 't_...' vs 'user_t_...'. Prioritizes neat standard UIDs over random artifacts.
 */
export const deduplicateUsersList = (users: UserProfile[]): UserProfile[] => {
  const result: UserProfile[] = [];
  const seenUids = new Set<string>();
  const seenEmails = new Set<string>();
  const seenUsernames = new Set<string>();
  const seenNips = new Set<string>();
  const seenOsimRoles = new Set<string>(); // 'bph_ketua', 'bph_wakil', 'sekbid_dept_1', etc.
  const seenNormNames = new Set<string>();

  for (const u of users) {
    if (!u || !u.uid) continue;
    if (isDeletedUid(u.uid)) continue;

    // Super Admin is always preserved
    if (u.uid === 'user_super_admin' || u.role === 'super_admin') {
      if (!seenUids.has('user_super_admin')) {
        seenUids.add('user_super_admin');
        seenUids.add(u.uid);
        result.push(u);
      }
      continue;
    }

    // ATURAN BAKU KESISWAAN: Anggota Sekbid biasa TIDAK memiliki akun login dan TIDAK masuk ke cPanel
    const isOsim = u.role === 'anggota_osim' || u.role === 'pengurus_osim';
    if (isOsim && isAnggotaSekbid(u as any)) {
      continue;
    }

    const email = u.email ? u.email.trim().toLowerCase() : '';
    const isGenericEmail = isGenericPlaceholderEmail(email);
    const username = u.username ? u.username.trim().toLowerCase() : '';
    const cleanNip = cleanDigits(u.nip);
    const normName = normalizeName(u.displayName);

    // Check if already matched (strictly matching unique identity: UID, distinct email, username, NIP/NIS, or identical full name)
    let duplicateIdx = -1;

    if (seenUids.has(u.uid)) {
      duplicateIdx = result.findIndex(r => r.uid === u.uid);
    } else if (email && !isGenericEmail && seenEmails.has(email)) {
      duplicateIdx = result.findIndex(r => r.email && r.email.trim().toLowerCase() === email);
    } else if (username && seenUsernames.has(username)) {
      duplicateIdx = result.findIndex(r => r.username && r.username.trim().toLowerCase() === username);
    } else if (cleanNip && !isPlaceholderNis(cleanNip) && cleanNip.length >= 4 && seenNips.has(cleanNip)) {
      duplicateIdx = result.findIndex(r => cleanDigits(r.nip) === cleanNip);
    } else if (normName && normName.length >= 4 && seenNormNames.has(`${normName}_${u.role}`)) {
      duplicateIdx = result.findIndex(r => r.role === u.role && normalizeName(r.displayName) === normName);
    }

    if (duplicateIdx >= 0) {
      const existing = result[duplicateIdx];

      // IDENTITY GUARD: Jangan pernah menggabungkan dua profil jika teacherId aslinya berbeda
      if (existing.teacherId && u.teacherId && existing.teacherId !== u.teacherId) {
        duplicateIdx = -1;
      }
      // IDENTITY GUARD: Jangan pernah menggabungkan jika keduanya memiliki NIP valid yang berbeda
      const exNip = cleanDigits(existing.nip);
      if (cleanNip && exNip && cleanNip.length >= 6 && exNip.length >= 6 && cleanNip !== exNip) {
        duplicateIdx = -1;
      }

      const uIsOsim = u.role === 'anggota_osim' || u.role === 'pengurus_osim';
      const exIsOsim = existing.role === 'anggota_osim' || existing.role === 'pengurus_osim';
      const uSekbid = extractSekbidNumber(u.osimDepartmentCode) || extractSekbidNumber(u.osimDepartmentName) || extractSekbidNumber(u.osimPosition);
      const exSekbid = extractSekbidNumber(existing.osimDepartmentCode) || extractSekbidNumber(existing.osimDepartmentName) || extractSekbidNumber(existing.osimPosition);

      const uIsBph = u.osimDepartmentCode === 'BPH' || (u.osimDepartmentName && u.osimDepartmentName.includes('BPH')) || ['ketua', 'wakil', 'sekretaris', 'bendahara'].includes(u.osimRole || '') || ['user_osim_ketua', 'user_osim_wakil', 'user_osim_sekretaris', 'user_osim_bendahara'].includes(u.uid);
      const exIsBph = existing.osimDepartmentCode === 'BPH' || (existing.osimDepartmentName && existing.osimDepartmentName.includes('BPH')) || ['ketua', 'wakil', 'sekretaris', 'bendahara'].includes(existing.osimRole || '') || ['user_osim_ketua', 'user_osim_wakil', 'user_osim_sekretaris', 'user_osim_bendahara'].includes(existing.uid);

      // IDENTITY GUARD: Jangan pernah menggabungkan Pendidik/Tenaga Kependidikan dengan Pengurus OSIM
      const isUTeacher = ['super_admin', 'admin', 'waka_kesiswaan', 'guru_bk', 'pembina_osim', 'pembina_ekskul', 'coach_ekstrakurikuler', 'wali_kelas', 'guru', 'guru_mapel', 'staf_tu'].includes(u.role);
      const isExTeacher = ['super_admin', 'admin', 'waka_kesiswaan', 'guru_bk', 'pembina_osim', 'pembina_ekskul', 'coach_ekstrakurikuler', 'wali_kelas', 'guru', 'guru_mapel', 'staf_tu'].includes(existing.role);
      if ((isUTeacher && exIsOsim) || (isExTeacher && uIsOsim)) {
        duplicateIdx = -1;
      }

      // GUARD: Jangan pernah menggabungkan dua pengurus OSIM dari Sekbid yang berbeda atau Sekbid dengan BPH
      if (uIsOsim && exIsOsim) {
        if (uSekbid !== null && exSekbid !== null && uSekbid !== exSekbid) {
          duplicateIdx = -1;
        } else if ((uSekbid !== null && exIsBph) || (exSekbid !== null && uIsBph)) {
          duplicateIdx = -1;
        }
      }
    }

    if (duplicateIdx >= 0) {
      // Merge best fields into existing, PRIORITIZING standard tidy UID
      const existing = result[duplicateIdx];
      const preferredUid = isStandardTidyUid(existing.uid)
        ? existing.uid
        : (isStandardTidyUid(u.uid) ? u.uid : (isRandomOrLegacyArtifactUid(existing.uid) ? u.uid : existing.uid));

      const isLoginActive = Boolean(existing.isLoginActive || u.isLoginActive || existing.loginStatus === 'active' || u.loginStatus === 'active');

      // If Sekbid slot: ALWAYS prioritize Ketua Sekbid over any member record
      const existingIsKetua = isKetuaSekbid(existing as any);
      const uIsKetua = isKetuaSekbid(u as any);
      const isOsimConflict = (existingIsKetua || uIsKetua);
      const leaderRecord = isOsimConflict ? ((existingIsKetua && !uIsKetua) ? existing : u) : u;

      const effectiveRole = isOsimConflict ? leaderRecord.role : (u.role || existing.role);

      const merged: UserProfile = {
        ...existing,
        ...u,
        ...leaderRecord,
        role: effectiveRole,
        uid: preferredUid,
        isLoginActive,
        loginStatus: isLoginActive ? 'active' : (existing.loginStatus || u.loginStatus || 'pending_activation'),
        accountStatus: isLoginActive ? 'active' : (existing.accountStatus || u.accountStatus || 'pending'),
        phone: u.phone || leaderRecord.phone || existing.phone,
        nip: u.nip || leaderRecord.nip || existing.nip,
        counselorSpecialization: effectiveRole === 'guru_bk' ? (u.counselorSpecialization || leaderRecord.counselorSpecialization || existing.counselorSpecialization) : undefined,
        extracurricularIds: (effectiveRole === 'staf_tu' || effectiveRole === 'wali_kelas' || effectiveRole === 'guru' || (effectiveRole as string) === 'guru_mapel')
          ? (u.assignedExtracurricularIds && u.assignedExtracurricularIds.length > 0 ? u.assignedExtracurricularIds : (leaderRecord.assignedExtracurricularIds && leaderRecord.assignedExtracurricularIds.length > 0 ? leaderRecord.assignedExtracurricularIds : []))
          : Array.from(new Set([...(existing.extracurricularIds || []), ...(u.extracurricularIds || [])])),
        extracurricularNames: (effectiveRole === 'staf_tu' || effectiveRole === 'wali_kelas' || effectiveRole === 'guru' || (effectiveRole as string) === 'guru_mapel')
          ? (u.assignedExtracurricularIds && u.assignedExtracurricularIds.length > 0 ? (u.extracurricularNames || []) : (leaderRecord.assignedExtracurricularIds && leaderRecord.assignedExtracurricularIds.length > 0 ? (leaderRecord.extracurricularNames || []) : []))
          : Array.from(new Set([...(existing.extracurricularNames || []), ...(u.extracurricularNames || [])])),
        extracurricularName: (effectiveRole === 'staf_tu' || effectiveRole === 'wali_kelas' || effectiveRole === 'guru' || (effectiveRole as string) === 'guru_mapel')
          ? (u.assignedExtracurricularIds && u.assignedExtracurricularIds.length > 0 ? (u.extracurricularName || leaderRecord.extracurricularName) : undefined)
          : (u.extracurricularName || existing.extracurricularName)
      };
      result[duplicateIdx] = merged;
    } else {
      // First time seeing this user
      seenUids.add(u.uid);
      if (email && !isGenericEmail) seenEmails.add(email);
      if (username) seenUsernames.add(username);
      if (cleanNip && !isPlaceholderNis(cleanNip) && cleanNip.length >= 4) seenNips.add(cleanNip);
      if (normName && (normName.length >= 4)) seenNormNames.add(`${normName}_${u.role}`);
      result.push(u);
    }
  }

  return result;
};

/**
 * Canonicalizes assigned extracurricular items to unique canonical IDs (e.g. ['ekskul_pramuka']).
 * Resolves legacy human-readable names to valid IDs, removes duplicates, and ensures an array is returned.
 */
export const canonicalizeAssignedEkskulIds = (
  items: string[] | undefined,
  allEkskuls?: Array<{ id: string; name: string }>
): string[] => {
  if (!items || !Array.isArray(items) || items.length === 0) return [];

  const canonicalIds: string[] = [];

  for (const item of items) {
    if (!item || typeof item !== 'string') continue;
    const cleanItem = item.trim();
    if (!cleanItem) continue;

    // Tolak string yang berupa angka murni (/^\d+$/) atau pola demo warisan statis (/^ekskul_[1-9]$/)
    if (/^\d{1,2}$/.test(cleanItem) || /^ekskul_[1-9]$/i.test(cleanItem) || /^e[1-9]$/i.test(cleanItem)) continue;

    // 1. If an extracurricular list is provided, match against it
    if (allEkskuls && allEkskuls.length > 0) {
      const matchedById = allEkskuls.find(e => e.id.toLowerCase() === cleanItem.toLowerCase());
      if (matchedById && !/^\d{1,2}$/.test(matchedById.name) && !/^ekskul_[1-9]$/i.test(matchedById.id)) {
        canonicalIds.push(matchedById.id);
        continue;
      }
      const cleanStripped = cleanItem.replace(/^ekskul_/, '').replace(/[_-]/g, ' ').toLowerCase();
      const matchedByName = allEkskuls.find(e => {
        const eLower = e.name.toLowerCase().trim();
        return (
          eLower === cleanItem.toLowerCase() ||
          eLower === cleanStripped ||
          eLower.includes(cleanStripped) ||
          cleanStripped.includes(eLower) ||
          ((cleanStripped.includes('inggris') || cleanStripped.includes('english')) && (eLower.includes('inggris') || eLower.includes('english') || eLower.includes('debate'))) ||
          ((cleanStripped.includes('pramuka')) && eLower.includes('pramuka')) ||
          ((cleanStripped.includes('tari') || cleanStripped.includes('seni')) && (eLower.includes('tari') || eLower.includes('seni'))) ||
          ((cleanStripped.includes('pmr') || cleanStripped.includes('uks')) && (eLower.includes('pmr') || eLower.includes('uks'))) ||
          ((cleanStripped.includes('tahfidz') || cleanStripped.includes('tahfiz') || cleanStripped.includes('qur')) && (eLower.includes('tahfidz') || eLower.includes('qur'))) ||
          ((cleanStripped.includes('multimedia') || cleanStripped.includes('tik')) && eLower.includes('multimedia')) ||
          ((cleanStripped.includes('arab')) && eLower.includes('arab')) ||
          ((cleanStripped.includes('talim') || cleanStripped.includes("ta'lim")) && (eLower.includes('talim') || eLower.includes("ta'lim")))
        );
      });
      if (matchedByName && !/^\d{1,2}$/.test(matchedByName.name) && !/^ekskul_[1-9]$/i.test(matchedByName.id)) {
        canonicalIds.push(matchedByName.id);
        continue;
      }
    }

    // 2. Direct ID check (valid ekskul document ID with alphabetic letters or timestamp)
    if (cleanItem.startsWith('ekskul_') && !/^ekskul_[1-9]$/i.test(cleanItem)) {
      if (!allEkskuls || allEkskuls.length === 0 || allEkskuls.some(e => e.id.toLowerCase() === cleanItem.toLowerCase())) {
        canonicalIds.push(cleanItem);
      }
      continue;
    }

    // 3. Fallback normalization for standard names
    const lower = cleanItem.toLowerCase();
    if (lower.includes('pramuka')) {
      canonicalIds.push('ekskul_pramuka');
    } else if (lower.includes('paskibra')) {
      canonicalIds.push('ekskul_paskibra');
    } else if (lower.includes('pmr') || lower.includes('palang merah')) {
      canonicalIds.push('ekskul_pmr');
    } else if (lower.includes('futsal')) {
      canonicalIds.push('ekskul_futsal');
    } else if (lower.includes('basket')) {
      canonicalIds.push('ekskul_basket');
    } else if (lower.includes('volly') || lower.includes('voli')) {
      canonicalIds.push('ekskul_voli');
    } else if (lower.includes('hadroh') || lower.includes('rebana')) {
      canonicalIds.push('ekskul_hadroh');
    } else if (lower.includes('tahfidz') || lower.includes('tahfiz')) {
      canonicalIds.push('ekskul_tahfidz');
    } else if (lower.includes('kir') || lower.includes('karya ilmiah')) {
      canonicalIds.push('ekskul_kir');
    } else if (lower.includes('english') || lower.includes('inggris')) {
      canonicalIds.push('ekskul_english_club');
    } else if (lower.includes('jurnalistik')) {
      canonicalIds.push('ekskul_jurnalistik');
    } else if (lower.includes('kaligrafi')) {
      canonicalIds.push('ekskul_kaligrafi');
    } else if (lower.includes('silat')) {
      canonicalIds.push('ekskul_pencak_silat');
    } else if (lower.includes('bulutangkis') || lower.includes('badminton')) {
      canonicalIds.push('ekskul_bulutangkis');
    } else {
      const slug = cleanItem.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      // Tolak slug yang murni angka
      if (slug && !/^\d+$/.test(slug) && /[a-z]/i.test(slug)) {
        canonicalIds.push(`ekskul_${slug}`);
      }
    }
  }

  // Deduplicate and filter empty
  return Array.from(new Set(canonicalIds.filter(Boolean)));
};

/**
 * Deduplicate Teachers array to guarantee strictly ONE record per teacher.
 * Merges duplicate entries while preserving ALL valid extracurricular assignments (no single-item truncation).
 */
export const deduplicateTeachersList = (teachers: Teacher[], allEkskuls?: Array<{ id: string; name: string }>): Teacher[] => {
  if (!Array.isArray(teachers) || teachers.length <= 1) {
    if (Array.isArray(teachers) && teachers.length === 1) {
      const cleanAssigned = canonicalizeAssignedEkskulIds(teachers[0].assignedExtracurriculars, allEkskuls);
      const cleanNames = cleanAssigned.map(id => {
        const match = (allEkskuls || []).find(e => e.id === id);
        return match ? match.name : id;
      }).filter(n => !/^\d+$/.test(n) && !/^ekskul_\d+$/.test(n));

      return [{
        ...teachers[0],
        assignedExtracurriculars: cleanAssigned,
        extracurricularNames: cleanNames,
        extracurricularName: cleanNames.join(', ') || undefined
      }];
    }
    return teachers || [];
  }

  const result: Teacher[] = [];
  const seenIds = new Set<string>();
  const seenNips = new Set<string>();
  const seenEmails = new Set<string>();
  const seenNormNames = new Set<string>();

  for (const t of teachers) {
    if (!t || !t.id) continue;
    if (isDeletedUid(t.id)) continue;

    const cleanNip = cleanDigits(t.nip);
    const email = t.email ? t.email.trim().toLowerCase() : '';
    const normName = normalizeName(t.fullName);
    const isGenericEmail = isGenericPlaceholderEmail(email);

    let duplicateIdx = -1;

    // 1. Pencocokan ID Persis
    if (seenIds.has(t.id)) {
      duplicateIdx = result.findIndex(r => r.id === t.id);
    } 
    // 2. Pencocokan NIP Resmi (minimal 8 digit agar tidak bentrok angka pendek/placeholder)
    else if (cleanNip && cleanNip.length >= 8 && seenNips.has(cleanNip)) {
      duplicateIdx = result.findIndex(r => cleanDigits(r.nip) === cleanNip);
    } 
    // 3. Pencocokan Email Pribadi Unik (HANYA jika bukan email generic dan NIP tidak bertentangan)
    else if (!isGenericEmail && seenEmails.has(email)) {
      duplicateIdx = result.findIndex(r => {
        if (!r.email || r.email.trim().toLowerCase() !== email) return false;
        const rNip = cleanDigits(r.nip);
        if (cleanNip && rNip && cleanNip.length >= 6 && rNip.length >= 6 && cleanNip !== rNip) {
          return false; // NIP berbeda = orang berbeda, jangan digabung!
        }
        return true;
      });
    } 
    // 4. Pencocokan Nama Ternormalisasi (HANYA jika nama panjang >= 8 karakter dan didukung NIP/No HP yang sama)
    else if (normName && normName.length >= 8 && seenNormNames.has(normName)) {
      duplicateIdx = result.findIndex(r => {
        if (normalizeName(r.fullName) !== normName) return false;
        const rNip = cleanDigits(r.nip);
        if (cleanNip && rNip && cleanNip.length >= 6 && rNip.length >= 6 && cleanNip !== rNip) {
          return false; // NIP berbeda = orang berbeda
        }
        // Jika salah satu atau keduanya belum memiliki NIP, periksa kecocokan No HP atau Subject
        if ((!cleanNip || cleanNip.length < 6) && (!rNip || rNip.length < 6)) {
          if (t.phone && r.phone && cleanDigits(t.phone) === cleanDigits(r.phone) && cleanDigits(t.phone).length >= 8) {
            return true;
          }
          // Jangan gabung hanya berdasarkan kesamaan nama tanpa data pendukung lain
          return false;
        }
        return true;
      });
    }

    if (duplicateIdx >= 0) {
      const existing = result[duplicateIdx];
      // Gabungkan seluruh tugas binaan ekstrakurikuler yang valid
      const combinedAssigned = Array.from(new Set([
        ...(Array.isArray(existing.assignedExtracurriculars) ? existing.assignedExtracurriculars : []),
        ...(Array.isArray(t.assignedExtracurriculars) ? t.assignedExtracurriculars : [])
      ]));

      const cleanAssigned = canonicalizeAssignedEkskulIds(combinedAssigned, allEkskuls);
      const cleanNames = cleanAssigned.map(id => {
        const match = (allEkskuls || []).find(e => e.id === id);
        return match ? match.name : id;
      }).filter(name => !/^\d+$/.test(name) && !/^ekskul_\d+$/.test(name));

      const merged: Teacher = {
        ...existing,
        ...t,
        id: existing.id,
        phone: existing.phone && existing.phone !== '-' ? existing.phone : t.phone,
        email: existing.email && !existing.email.includes('placeholder') ? existing.email : t.email,
        nip: existing.nip && existing.nip !== '-' ? existing.nip : t.nip,
        assignedExtracurriculars: cleanAssigned,
        extracurricularNames: cleanNames,
        extracurricularName: cleanNames.join(', ') || undefined
      };
      result[duplicateIdx] = merged;
    } else {
      seenIds.add(t.id);
      if (cleanNip && cleanNip.length >= 8) seenNips.add(cleanNip);
      if (!isGenericEmail) seenEmails.add(email);
      if (normName && normName.length >= 8) seenNormNames.add(normName);

      const cleanAssigned = canonicalizeAssignedEkskulIds(t.assignedExtracurriculars, allEkskuls);
      const cleanNames = cleanAssigned.map(id => {
        const match = (allEkskuls || []).find(e => e.id === id);
        return match ? match.name : id;
      }).filter(name => !/^\d+$/.test(name) && !/^ekskul_\d+$/.test(name));

      result.push({
        ...t,
        assignedExtracurriculars: cleanAssigned,
        extracurricularNames: cleanNames,
        extracurricularName: cleanNames.join(', ') || undefined
      });
    }
  }

  return result;
};

/**
 * Normalizes BPH OSIM positions to a canonical role key.
 * Used to enforce uniqueness for single-holder leadership positions (1 Ketua, 1 Wakil, 1 Sekretaris, 1 Bendahara).
 */
export const getCanonicalBphPositionKey = (position?: string, sekbid?: string): string | null => {
  if (!position) return null;
  const pos = position.toLowerCase().trim();
  const sek = (sekbid || '').toLowerCase().trim();

  // If it clearly belongs to a Sekbid (e.g. Ketua Sekbid, Sekretaris Bidang), it is not BPH
  const hasSekbid = (sek + ' ' + pos).match(/sekbid\s*[-_]?\s*(\d+)/i) || pos.includes('sekbid') || pos.includes('bidang');
  if (hasSekbid && !sek.includes('bph')) return null;

  const isBph = sek.includes('bph') || 
    sek.includes('badan pengurus harian') ||
    pos.includes('ketua umum') || 
    pos.includes('wakil ketua') || 
    pos.includes('sekretaris umum') || 
    pos.includes('bendahara umum') ||
    (!hasSekbid && (pos.includes('ketua') || pos.includes('wakil') || pos.includes('sekretaris') || pos.includes('bendahara')));

  if (!isBph) return null;

  if (pos.includes('wakil')) return 'bph_wakil_ketua';
  if (pos.includes('ketua') && !pos.includes('sekbid') && !pos.includes('bidang')) return 'bph_ketua_umum';
  if (pos.includes('sekretaris 1') || pos.includes('sekretaris umum') || pos === 'sekretaris') return 'bph_sekretaris_1';
  if (pos.includes('sekretaris 2') || pos.includes('wakil sekretaris')) return 'bph_sekretaris_2';
  if (pos.includes('bendahara 1') || pos.includes('bendahara umum') || pos === 'bendahara') return 'bph_bendahara_1';
  if (pos.includes('bendahara 2') || pos.includes('wakil bendahara')) return 'bph_bendahara_2';

  return 'bph_pengurus';
};

/**
 * Deduplicates OSIM members list ensuring strictly ONE record per person and
 * strictly ONE student assigned per BPH core position (e.g. only ONE Wakil Ketua OSIM).
 * Reconciles student attributes with master student database to prevent stale classes/NIS.
 */
export const deduplicateOsimMembersList = (members: OsimMember[], masterStudents: Student[] = []): OsimMember[] => {
  const result: OsimMember[] = [];
  const seenIds = new Set<string>();
  const seenNis = new Set<string>();
  const seenNormNames = new Set<string>();
  const seenBphPositions = new Set<string>();

  for (const m of members) {
    if (!m || !m.id) continue;
    if (m.id === 'om1' || (m as any).isDeleted) continue;
    if (isDeletedUid(m.id)) continue;

    // Resolve and sanitize against live student database
    const normName = normalizeName(m.fullName);
    const cleanNis = cleanDigits(m.studentNis);

    let matchedStudent: Student | undefined;
    if (masterStudents.length > 0) {
      matchedStudent = masterStudents.find(s => {
        if (s.isDeleted || s.status === 'Keluar' || s.status === 'Pindah') return false;
        if (cleanNis && s.nis && cleanDigits(s.nis) === cleanNis) return true;
        if (normName && normName.length >= 4 && normalizeName(s.fullName) === normName) return true;
        return false;
      });
    }

    // Refresh NIS, Class name, Phone, and Name with active student data if found
    const liveNis = matchedStudent?.nis || m.studentNis;
    const liveClassName = matchedStudent?.className || m.className;
    const liveFullName = matchedStudent?.fullName || m.fullName;
    const livePhone = (matchedStudent?.phone && matchedStudent.phone !== '-') ? matchedStudent.phone : m.phone;
    const liveStudentId = matchedStudent?.id || m.studentId;

    const refreshedMember: OsimMember = {
      ...m,
      studentId: liveStudentId,
      studentNis: liveNis,
      className: liveClassName,
      fullName: liveFullName,
      phone: livePhone
    };

    const effectiveCleanNis = cleanDigits(liveNis);
    const effectiveNormName = normalizeName(liveFullName);
    const bphKey = getCanonicalBphPositionKey(m.position, m.sekbid);

    let duplicateIdx = -1;

    // 1. Match by Member ID
    if (seenIds.has(m.id)) {
      duplicateIdx = result.findIndex(r => r.id === m.id);
    }
    // 2. Match by Student NIS (Genuine non-placeholder only)
    else if (effectiveCleanNis && !isPlaceholderNis(effectiveCleanNis) && effectiveCleanNis.length >= 4 && seenNis.has(effectiveCleanNis)) {
      duplicateIdx = result.findIndex(r => cleanDigits(r.studentNis) === effectiveCleanNis);
    }
    // 3. Match by Normalized Student Name
    else if (effectiveNormName && effectiveNormName.length >= 4 && seenNormNames.has(effectiveNormName)) {
      duplicateIdx = result.findIndex(r => normalizeName(r.fullName) === effectiveNormName);
    }

    if (duplicateIdx >= 0) {
      const existing = result[duplicateIdx];
      // GUARD 1: Jika nama berbeda, ini adalah dua siswa/pengurus berbeda, JANGAN PERNAH digabungkan!
      if (effectiveNormName !== normalizeName(existing.fullName)) {
        duplicateIdx = -1;
      }
      // GUARD 2: Jika ID berbeda dan posisi/sekbid berbeda, jangan digabungkan
      else if (existing.id && m.id && existing.id !== m.id) {
        const mSekbid = extractSekbidNumber(m.sekbid) || extractSekbidNumber(m.position);
        const exSekbid = extractSekbidNumber(existing.sekbid) || extractSekbidNumber(existing.position);
        if (mSekbid !== exSekbid || (m.position && existing.position && m.position !== existing.position)) {
          duplicateIdx = -1;
        }
      }
    }

    if (duplicateIdx >= 0) {
      // Merge best fields, prefer newer/more complete data with active student info
      const existing = result[duplicateIdx];
      const merged: OsimMember = {
        ...existing,
        ...refreshedMember,
        id: existing.id,
        studentId: refreshedMember.studentId || existing.studentId,
        studentNis: refreshedMember.studentNis || existing.studentNis,
        className: refreshedMember.className || existing.className,
        fullName: refreshedMember.fullName || existing.fullName,
        photoUrl: refreshedMember.photoUrl || existing.photoUrl,
        loginUsername: refreshedMember.loginUsername || existing.loginUsername
      };
      result[duplicateIdx] = merged;
    } else {
      seenIds.add(m.id);
      if (effectiveCleanNis && !isPlaceholderNis(effectiveCleanNis) && effectiveCleanNis.length >= 4) seenNis.add(effectiveCleanNis);
      if (effectiveNormName && effectiveNormName.length >= 4) seenNormNames.add(effectiveNormName);
      result.push(refreshedMember);
    }
  }

  return result;
};

/**
 * Returns hierarchical classification rank (1 to 7) and secondary sorting key
 * for structured presentation of school user accounts:
 * 1. Admin / Proktor
 * 2. Waka Kesiswaan
 * 3. Guru BK
 * 4. Pembina OSIM
 * 5. Pembina Ekstrakurikuler
 * 6. Anggota BPH (Ketua, Wakil, Sekretaris, Bendahara)
 * 7. Ketua / Anggota Seksi Bidang (Sekbid 1 s.d. 8)
 */
export interface UserHierarchyClassification {
  rank: number;
  categoryLabel: string;
  orderWeight: number;
  subOrder: number;
}

export const getUserHierarchyClassification = (u: UserProfile): UserHierarchyClassification => {
  if (!u) {
    return { rank: 8, categoryLabel: 'Lainnya', orderWeight: 800, subOrder: 99 };
  }

  // 1. Admin / Proktor
  if (u.role === 'super_admin' || u.uid === 'user_super_admin') {
    return { rank: 1, categoryLabel: 'Super Admin / Proktor', orderWeight: 100, subOrder: 1 };
  }

  // 2. Waka Kesiswaan
  if (u.role === 'waka_kesiswaan' || u.role === 'waka') {
    return { rank: 2, categoryLabel: 'Waka Kesiswaan', orderWeight: 200, subOrder: 1 };
  }

  // 3. Guru BK
  if (u.role === 'guru_bk') {
    return { rank: 3, categoryLabel: 'Guru Bimbingan Konseling (BK)', orderWeight: 300, subOrder: 1 };
  }

  // Staf TU (Tata Usaha - Administrasi & Persuratan)
  if (u.role === 'staf_tu' || (u.role as string) === 'tu') {
    return { rank: 4, categoryLabel: 'Staf Tata Usaha (TU)', orderWeight: 350, subOrder: 1 };
  }

  // 4. Pembina OSIM
  if (u.role === 'pembina_osim') {
    return { rank: 4, categoryLabel: 'Pembina OSIM', orderWeight: 400, subOrder: 1 };
  }

  // 5. Pembina Ekstrakurikuler (Canonical: coach_ekstrakurikuler, Legacy: pembina_ekskul, pembina, pembina_ekstrakurikuler)
  if (
    u.role === 'coach_ekstrakurikuler' ||
    u.role === 'pembina_ekskul' ||
    u.role === 'pembina' ||
    (u.role as string) === 'pembina_ekstrakurikuler' ||
    (u.role as string) === 'pembina_ekstra'
  ) {
    return { rank: 5, categoryLabel: 'Pembina / Coach Ekstrakurikuler', orderWeight: 500, subOrder: 1 };
  }

  // 6 & 7. OSIM Student Accounts (BPH & Sekbid) (Canonical: anggota_osim, Legacy: pengurus_osim)
  if (u.role === 'anggota_osim' || u.role === 'pengurus_osim') {
    const pos = (u.osimPosition || u.position || '').toLowerCase();
    const role = (u.osimRole || '').toLowerCase();
    const dName = (u.osimDepartmentName || '').toLowerCase();
    const dCode = (u.osimDepartmentCode || '').toLowerCase();
    const usr = (u.username || '').toLowerCase();

    // Cek apakah posisi atau departemen merupakan Sekbid (Seksi Bidang)
    const hasSekbidKeyword = pos.includes('sekbid') || pos.includes('bidang') || dName.includes('sekbid') || dName.includes('bidang') || dCode.startsWith('sekbid') || /^sekbid/i.test(dCode);

    // 6. Badan Pengurus Harian (BPH) OSIM:
    // Terdiri dari: Ketua Umum, Wakil Ketua, Sekretaris, Bendahara, serta Anggota BPH
    const isKetuaBph = !hasSekbidKeyword && (pos.includes('ketua umum') || (!pos.includes('wakil') && (pos.includes('ketua') || role === 'ketua')));
    const isWakilBph = !hasSekbidKeyword && (pos.includes('wakil') || role === 'wakil');
    const isSekretarisBph = !hasSekbidKeyword && (pos.includes('sekretaris') || role === 'sekretaris');
    const isBendaharaBph = !hasSekbidKeyword && (pos.includes('bendahara') || role === 'bendahara' || u.isCashManager);
    const isBphEntity = dCode === 'bph' || dName.includes('bph') || dName.includes('badan pengurus harian') || (!hasSekbidKeyword && (pos.includes('bph') || role === 'bph'));

    if (isKetuaBph) {
      return { rank: 6, categoryLabel: 'BPH OSIM - Ketua Umum', orderWeight: 600, subOrder: 1 };
    }
    if (isWakilBph) {
      return { rank: 6, categoryLabel: 'BPH OSIM - Wakil Ketua', orderWeight: 600, subOrder: 2 };
    }
    if (isSekretarisBph) {
      return { rank: 6, categoryLabel: 'BPH OSIM - Sekretaris Umum', orderWeight: 600, subOrder: 3 };
    }
    if (isBendaharaBph) {
      return { rank: 6, categoryLabel: 'BPH OSIM - Bendahara Umum', orderWeight: 600, subOrder: 4 };
    }
    if (isBphEntity) {
      return { rank: 6, categoryLabel: 'BPH OSIM - Pengurus Harian', orderWeight: 600, subOrder: 5 };
    }

    // 7. Seksi Bidang (Sekbid):
    // Terdiri dari beberapa bidang sesuai kebijakan madrasah/sekolah atau yang sudah dibentuk di aplikasi
    const sekbidMatch = (dCode + ' ' + dName + ' ' + pos + ' ' + usr).match(/sekbid\s*[-_]?\s*(\d+)/i) ||
                         (dCode + ' ' + dName + ' ' + pos).match(/bidang\s*[-_]?\s*(\d+)/i);
    const sekbidNum = sekbidMatch ? parseInt(sekbidMatch[1], 10) : null;

    let cleanSekbidLabel = 'Seksi Bidang OSIM';
    if (u.osimDepartmentName) {
      cleanSekbidLabel = (u.osimDepartmentName.toLowerCase().startsWith('sekbid') || u.osimDepartmentName.toLowerCase().startsWith('seksi'))
        ? u.osimDepartmentName
        : `Sekbid: ${u.osimDepartmentName}`;
    } else if (sekbidNum !== null) {
      cleanSekbidLabel = `Seksi Bidang (Sekbid ${sekbidNum})`;
    }

    return {
      rank: 7,
      categoryLabel: cleanSekbidLabel,
      orderWeight: 700,
      subOrder: sekbidNum !== null ? sekbidNum : 50
    };
  }

  return { rank: 8, categoryLabel: 'Pengguna Lainnya', orderWeight: 800, subOrder: 99 };
};

/**
 * Sorts array of UserProfile objects according to the 7-tier official classification
 */
export const sortUsersByHierarchy = (users: UserProfile[]): UserProfile[] => {
  return [...users].sort((a, b) => {
    const classA = getUserHierarchyClassification(a);
    const classB = getUserHierarchyClassification(b);

    if (classA.orderWeight !== classB.orderWeight) {
      return classA.orderWeight - classB.orderWeight;
    }

    if (classA.subOrder !== classB.subOrder) {
      return classA.subOrder - classB.subOrder;
    }

    return (a.displayName || '').localeCompare(b.displayName || '');
  });
};

/**
 * Returns hierarchical classification for teachers & advisors:
 * Rank 1: Waka Kesiswaan & Pimpinan
 * Rank 2: Guru BK / Konselor
 * Rank 3: Pembina OSIM (Intrakurikuler)
 * Rank 4: Pembina Ekstrakurikuler
 * Rank 5: Wali Kelas
 * Rank 6: Dewan Guru & Staf
 */
export interface TeacherHierarchyClassification {
  rank: number;
  categoryLabel: string;
  orderWeight: number;
  categoryKey: 'all' | 'waka' | 'guru_bk' | 'pembina_osim' | 'pembina_ekskul' | 'wali_kelas' | 'staf_tu' | 'dewan_guru';
}

export const getTeacherHierarchyClassification = (t: Teacher): TeacherHierarchyClassification => {
  if (!t) {
    return { rank: 7, categoryLabel: 'Dewan Guru', orderWeight: 700, categoryKey: 'dewan_guru' };
  }

  const roleLower = (t.role || '').toLowerCase();
  const subLower = (t.subject || '').toLowerCase();

  // 1. Waka Kesiswaan
  if (roleLower.includes('waka') || roleLower.includes('wakil kepala') || subLower.includes('waka kesiswaan')) {
    return { rank: 1, categoryLabel: 'Waka Kesiswaan', orderWeight: 100, categoryKey: 'waka' };
  }

  // 2. Guru BK / Konselor
  if (roleLower.includes('bk') || roleLower.includes('konseling') || roleLower.includes('konselor') || subLower.includes('bimbingan konseling')) {
    return { rank: 2, categoryLabel: 'Guru Bimbingan Konseling (BK)', orderWeight: 200, categoryKey: 'guru_bk' };
  }

  // 3. Pembina OSIM (Intrakurikuler)
  if (roleLower.includes('osim') || roleLower.includes('intra') || subLower.includes('osim')) {
    return { rank: 3, categoryLabel: 'Pembina OSIM', orderWeight: 300, categoryKey: 'pembina_osim' };
  }

  // 4. Pembina Ekstrakurikuler
  if (
    roleLower.includes('pembina') || 
    roleLower.includes('ekskul') || 
    roleLower.includes('ekstrakurikuler') ||
    (t.assignedExtracurriculars && t.assignedExtracurriculars.length > 0)
  ) {
    return { rank: 4, categoryLabel: 'Pembina Ekstrakurikuler', orderWeight: 400, categoryKey: 'pembina_ekskul' };
  }

  // 5. Wali Kelas
  if (roleLower.includes('wali') || roleLower.includes('wali kelas')) {
    return { rank: 5, categoryLabel: 'Wali Kelas', orderWeight: 500, categoryKey: 'wali_kelas' };
  }

  // 6. Staf Tata Usaha (TU)
  if (roleLower.includes('tu') || roleLower.includes('tata usaha') || subLower.includes('tata usaha')) {
    return { rank: 6, categoryLabel: 'Staf Tata Usaha (TU)', orderWeight: 600, categoryKey: 'staf_tu' };
  }

  // 7. Dewan Guru & Staf Lainnya
  return { rank: 7, categoryLabel: 'Dewan Guru', orderWeight: 700, categoryKey: 'dewan_guru' };
};

/**
 * Sorts array of Teacher objects according to the standardized hierarchy
 */
export const sortTeachersByHierarchy = (teachersList: Teacher[]): Teacher[] => {
  return [...teachersList].sort((a, b) => {
    const classA = getTeacherHierarchyClassification(a);
    const classB = getTeacherHierarchyClassification(b);

    if (classA.orderWeight !== classB.orderWeight) {
      return classA.orderWeight - classB.orderWeight;
    }

    return (a.fullName || '').localeCompare(b.fullName || '');
  });
};

// ==========================================
// CLASS TOMBSTONE & PERMANENT PURGE ENGINE
// ==========================================

const DELETED_CLASS_IDS_KEY = 'sim_kesiswaan_deleted_class_ids';

export const PURGED_DEMO_CLASS_IDS = [
  'c_x_rpl1',
  'c_x_rpl2',
  'c_xi_rpl1',
  'c_xi_rpl2',
  'c_xii_rpl1',
  'c_xii_rpl2',
  'c_x_tkj1',
  'c_x_tkj2',
  // Legacy MA demo classes (replaced by official Kurikulum Merdeka 10-A s/d 12-C)
  'c_x_iis1',
  'c_x_iis2',
  'c_x_keagamaan',
  'c_x_mia1',
  'c_x_mia2',
  'c_xi_iis1',
  'c_xi_keagamaan',
  'c_xi_mia1',
  'c_xii_iis1',
  'c_xii_keagamaan',
  'c_xii_mia1',
  // Names variants
  'x iis 1',
  'x iis 2',
  'x keagamaan',
  'x mia 1',
  'x mia 2',
  'xi iis 1',
  'xi keagamaan',
  'xi mia 1',
  'xii iis 1',
  'xii keagamaan',
  'xii mia 1',
  'unassigned',
  'c_dummy',
  'dummy_class'
];

export const isPurgedClassId = (_classId?: string): boolean => {
  if (!_classId) return false;
  const lower = _classId.toLowerCase().trim();
  if (lower.startsWith('c_auto_')) return true;
  return PURGED_DEMO_CLASS_IDS.includes(lower);
};

export const getDeletedClassIds = (): Set<string> => {
  return new Set();
};

export const addDeletedClassId = (_classId: string) => {};

export const removeDeletedClassId = (_classId: string) => {};

export const isDeletedClassId = (_classId?: string): boolean => {
  return false;
};

// ==========================================
// EXTRACURRICULAR MEMBERS DELETED TRACKING
// ==========================================
const DELETED_MEMBERS_STORAGE_KEY = 'simkesiswaan_deleted_member_ids';

export const getDeletedMemberIds = (): Set<string> => {
  try {
    const raw = sessionStorage.getItem(DELETED_MEMBERS_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
};

export const addDeletedMemberId = (memberId: string) => {
  if (!memberId) return;
  try {
    const set = getDeletedMemberIds();
    set.add(memberId);
    const serialized = JSON.stringify(Array.from(set));
    sessionStorage.setItem(DELETED_MEMBERS_STORAGE_KEY, serialized);
  } catch {}
};

export const removeDeletedMemberId = (memberId: string) => {
  if (!memberId) return;
  try {
    const set = getDeletedMemberIds();
    set.delete(memberId);
    const serialized = JSON.stringify(Array.from(set));
    sessionStorage.setItem(DELETED_MEMBERS_STORAGE_KEY, serialized);
  } catch {}
};

export const clearDeletedMemberIds = () => {
  try {
    sessionStorage.removeItem(DELETED_MEMBERS_STORAGE_KEY);
    localStorage.removeItem(DELETED_MEMBERS_STORAGE_KEY);
  } catch {}
};

// ==========================================
// STUDENT DEDUPLICATION & INTEGRITY ENGINE
// ==========================================

/**
 * Deduplicates the student list strictly by unique NIS, NISN, or Normalized Full Name + Class.
 * Filters out legacy demo/dummy student records (e.g., s01, placeholder names).
 * Returns the deduplicated list along with an array of stale duplicate document IDs for cloud purging.
 */
export const deduplicateStudentsList = (
  studentsList: Student[]
): { deduplicated: Student[]; duplicateIds: string[] } => {
  const seenNis = new Set<string>();
  const seenNisn = new Set<string>();
  const seenNameAndClass = new Set<string>();
  const seenIds = new Set<string>();
  const deduplicated: Student[] = [];
  const duplicateIds: string[] = [];

  const validCandidates = (studentsList || []).filter(s => {
    if (!s || !s.id) return false;
    const cleanId = s.id.toLowerCase().trim();
    // Exclude mock / demo IDs
    if (
      cleanId === 's01' ||
      cleanId === 's1' ||
      cleanId === 'dummy' ||
      cleanId.startsWith('dummy_') ||
      cleanId.includes('demo_student')
    ) {
      duplicateIds.push(s.id);
      return false;
    }
    // Exclude soft-deleted students
    if (s.isDeleted) {
      duplicateIds.push(s.id);
      return false;
    }
    return true;
  });

  for (const s of validCandidates) {
    if (seenIds.has(s.id)) {
      duplicateIds.push(s.id);
      continue;
    }

    const cleanNis = s.nis ? cleanDigits(s.nis) : '';
    const cleanNisn = s.nisn ? cleanDigits(s.nisn) : '';
    const normName = normalizeName(s.fullName || (s as any).name);
    const normClass = (s.className || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const nameClassKey = normName && normClass ? `${normName}__${normClass}` : '';

    let isDuplicate = false;

    // Check duplicate by NIS (at least 3 digits)
    if (cleanNis && cleanNis.length >= 3) {
      if (seenNis.has(cleanNis)) {
        isDuplicate = true;
      }
    }

    // Check duplicate by NISN (at least 8 digits)
    if (!isDuplicate && cleanNisn && cleanNisn.length >= 8) {
      if (seenNisn.has(cleanNisn)) {
        isDuplicate = true;
      }
    }

    // Check duplicate by normalized full name + class
    if (!isDuplicate && nameClassKey && normName.length >= 4) {
      if (seenNameAndClass.has(nameClassKey)) {
        isDuplicate = true;
      }
    }

    if (isDuplicate) {
      duplicateIds.push(s.id);
    } else {
      if (cleanNis && cleanNis.length >= 3) seenNis.add(cleanNis);
      if (cleanNisn && cleanNisn.length >= 8) seenNisn.add(cleanNisn);
      if (nameClassKey && normName.length >= 4) seenNameAndClass.add(nameClassKey);
      seenIds.add(s.id);
      deduplicated.push(s);
    }
  }

  return { deduplicated, duplicateIds };
};

