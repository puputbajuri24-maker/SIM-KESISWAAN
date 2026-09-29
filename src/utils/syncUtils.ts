import { UserProfile, Teacher, Student, OsimMember } from '../types';

/**
 * Normalizes Indonesian personal names by stripping common academic/honorific titles,
 * removing punctuation, lowercasing, and collapsing spaces.
 */
export const normalizeName = (name?: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, ' ') // Remove parentheses like (Ketua OSIM)
    .replace(/\b(drs|dra|dr|prof|h|hj|kh|ustadz|ustadzah|s\.pd|s\.pd\.i|m\.pd|m\.pd\.i|s\.ag|m\.ag|s\.or|m\.or|s\.kom|m\.kom|s\.e|s\.si|m\.si|ph\.d|lc|b\.a|m\.a)\b/gi, '')
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
  'user_guru_bk',
  'user_pembina_osim',
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
  'user_osim_dept_sekbid_1',
  'user_osim_dept_sekbid_2',
  'user_osim_dept_sekbid_3',
  'user_osim_dept_sekbid_4',
  'user_osim_dept_sekbid_5',
  'user_osim_dept_sekbid_6',
  'user_osim_dept_sekbid_7',
  'user_osim_dept_sekbid_8'
]);

export const isProtectedFunctionalUid = (uid?: string): boolean => {
  if (!uid) return false;
  const clean = uid.toLowerCase().trim();
  if (PROTECTED_FUNCTIONAL_UIDS.has(clean)) return true;
  if (/^user_osim_dept_sekbid_\d+$/.test(clean)) return true;
  if (/^osim\.sekbid\d+$/.test(clean)) return true;
  if (/^user_osim_(ketua|wakil|sekretaris|bendahara|sekbid)$/.test(clean)) return true;
  if (/^user_osim_dept_/.test(clean)) return true;
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
        // Filter out any protected functional UIDs and student NIS numbers (numeric <= 10 digits)
        const valid = arr.filter(id => {
          if (!id) return false;
          if (isProtectedFunctionalUid(id)) return false;
          // Never tombstone student NIS numbers (pure digits <= 10 digits, e.g. 24251001)
          if (/^\d{4,10}$/.test(id)) return false;
          if (/^user_\d{4,10}$/.test(id)) return false;
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
  // Never tombstone student NIS numbers (pure numeric <= 10 digits) or empty / root prefixes
  const cleanTrimmed = uid.trim();
  if (
    !cleanTrimmed ||
    cleanTrimmed === '-' ||
    cleanTrimmed === 'user_' ||
    cleanTrimmed === 'guru_' ||
    /^\d{4,10}$/.test(cleanTrimmed) ||
    /^user_\d{4,10}$/.test(cleanTrimmed)
  ) return;

  try {
    const set = getDeletedUids();
    set.add(uid);
    // Also add related prefix variations if applicable
    if (uid.startsWith('user_')) {
      const clean = uid.replace(/^user_/, '');
      if (!isProtectedFunctionalUid(clean) && clean !== 'guru_' && !/^\d{4,10}$/.test(clean)) {
        set.add(clean);
      }
    }
    localStorage.setItem(DELETED_UIDS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {}
};

export const removeDeletedUid = (uid: string) => {
  if (!uid) return;
  try {
    const set = getDeletedUids();
    set.delete(uid);
    set.delete(`user_${uid}`);
    set.delete(uid.replace(/^user_/, ''));
    localStorage.setItem(DELETED_UIDS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {}
};

export const isDeletedUid = (uid?: string): boolean => {
  if (!uid) return false;
  const clean = uid.trim();
  if (!clean || clean === '-' || clean === 'user_' || clean === 'guru_') return false;
  const set = getDeletedUids();
  return set.has(uid) || set.has(`user_${uid}`) || set.has(uid.replace(/^user_/, ''));
};

/**
 * Check if a UserProfile and Teacher represent the exact same individual.
 */
export const isTeacherUserMatch = (u: UserProfile, t: Teacher): boolean => {
  if (!u || !t) return false;

  // 1. Direct ID match or prefix match
  if (u.uid === t.id) return true;
  if (u.uid === `user_${t.id}`) return true;
  if (t.id === `user_${u.uid}`) return true;
  const rawU = u.uid.replace(/^user_/, '').replace(/^guru_/, '');
  const rawT = t.id.replace(/^t_/, '').replace(/^teacher_/, '').replace(/^guru_/, '');
  if (rawU && rawT && rawU === rawT) return true;

  // 2. NIP match (ignoring spaces & non-digits, at least 6 digits)
  const uNip = cleanDigits(u.nip);
  const tNip = cleanDigits(t.nip);
  if (uNip && tNip && uNip.length >= 6 && uNip === tNip) return true;

  // 3. Institutional or personal email match
  if (u.email && t.email && u.email.trim().toLowerCase() === t.email.trim().toLowerCase()) return true;

  // 4. Normalized Name match
  const normU = normalizeName(u.displayName);
  const normT = normalizeName(t.fullName);
  if (normU && normT && normU === normT) {
    // If names match, check if role, subject, or phone confirms they are the same
    if (u.role === 'guru_bk' || u.role === 'pembina_osim' || u.role === 'pembina_ekskul' || u.role === 'waka_kesiswaan') {
      return true;
    }
    if (t.phone && u.phone && cleanDigits(t.phone) === cleanDigits(u.phone)) {
      return true;
    }
    // High probability match if name is reasonably unique (length >= 5)
    if (normU.length >= 5) return true;
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
 * Check if a UserProfile and OsimMember represent the exact same individual or position.
 */
export const isOsimMemberUserMatch = (u: UserProfile, m: OsimMember): boolean => {
  if (!u || !m) return false;

  // 1. Direct ID match
  if (u.uid === m.id || u.uid === `user_${m.id}`) return true;

  // 2. Login username match
  if (u.username && m.loginUsername && u.username.toLowerCase() === m.loginUsername.toLowerCase()) return true;
  if (u.username && m.username && u.username.toLowerCase() === m.username.toLowerCase()) return true;

  // 3. NIS match
  const uNis = cleanDigits(u.nip);
  const mNis = cleanDigits(m.studentNis);
  if (uNis && mNis && uNis.length >= 4 && uNis === mNis) return true;

  // 4. Specific Position match for OSIM accounts (strict match, never match whole department)
  if (u.role === 'pengurus_osim') {
    const posU = (u.osimPosition || u.osimRole || '').toLowerCase().trim();
    const posM = (m.position || '').toLowerCase().trim();
    if (posU && posM && (posU === posM || (posU.includes('ketua umum') && posM.includes('ketua umum')) || (posU.includes('sekretaris umum') && posM.includes('sekretaris umum')) || (posU.includes('bendahara umum') && posM.includes('bendahara umum')))) {
      // Also ensure names or NIS align or match when possible to prevent cross-person collision
      const normU = normalizeName(u.displayName);
      const normM = normalizeName(m.fullName);
      if (!normU || !normM || normU === normM) return true;
    }
  }

  // 5. Normalized Name match
  const normU = normalizeName(u.displayName);
  const normM = normalizeName(m.fullName);
  if (normU && normM && normU.length >= 5 && normU === normM) return true;

  return false;
};

/**
 * Deduplicate UserProfile array to guarantee strictly ONE record per person/role.
 * Resolves duplicate IDs such as 'user_osim_dept_bph' vs 'user_osim_ketua', or
 * 't_...' vs 'user_t_...'.
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

    const email = u.email ? u.email.trim().toLowerCase() : '';
    const username = u.username ? u.username.trim().toLowerCase() : '';
    const cleanNip = cleanDigits(u.nip);
    const normName = normalizeName(u.displayName);

    // OSIM role key and BPH position key
    let osimKey = '';
    let bphKey: string | null = null;
    if (u.role === 'pengurus_osim') {
      const dCode = (u.osimDepartmentCode || u.osimDepartmentId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const oRole = (u.osimRole || '').toLowerCase();
      if (dCode || oRole) {
        osimKey = `${dCode}_${oRole}`;
      }
      bphKey = getCanonicalBphPositionKey(u.osimPosition || u.osimRole, u.osimDepartmentName || u.osimDepartmentCode);
    }

    // Check if already matched
    let duplicateIdx = -1;

    if (seenUids.has(u.uid)) {
      duplicateIdx = result.findIndex(r => r.uid === u.uid);
    } else if (email && seenEmails.has(email)) {
      duplicateIdx = result.findIndex(r => r.email && r.email.trim().toLowerCase() === email);
    } else if (username && seenUsernames.has(username)) {
      duplicateIdx = result.findIndex(r => r.username && r.username.trim().toLowerCase() === username);
    } else if (cleanNip && cleanNip.length >= 4 && seenNips.has(cleanNip)) {
      duplicateIdx = result.findIndex(r => cleanDigits(r.nip) === cleanNip);
    } else if (bphKey && seenOsimRoles.has(bphKey)) {
      duplicateIdx = result.findIndex(r => {
        if (r.role !== 'pengurus_osim') return false;
        return getCanonicalBphPositionKey(r.osimPosition || r.osimRole, r.osimDepartmentName || r.osimDepartmentCode) === bphKey;
      });
    } else if (osimKey && seenOsimRoles.has(osimKey)) {
      duplicateIdx = result.findIndex(r => {
        if (r.role !== 'pengurus_osim') return false;
        const rd = (r.osimDepartmentCode || r.osimDepartmentId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const rr = (r.osimRole || '').toLowerCase();
        return `${rd}_${rr}` === osimKey;
      });
    } else if (normName && normName.length >= 4 && (u.role === 'pengurus_osim' || normName.length >= 6) && seenNormNames.has(`${normName}_${u.role}`)) {
      duplicateIdx = result.findIndex(r => r.role === u.role && normalizeName(r.displayName) === normName);
    }

    if (duplicateIdx >= 0) {
      // Merge best fields into existing
      const existing = result[duplicateIdx];
      const merged: UserProfile = {
        ...existing,
        ...u,
        uid: existing.uid, // Keep primary existing UID
        password: (existing.password && existing.password !== 'password') ? existing.password : (u.password || existing.password),
        phone: existing.phone || u.phone,
        nip: existing.nip || u.nip,
        extracurricularIds: Array.from(new Set([...(existing.extracurricularIds || []), ...(u.extracurricularIds || [])]))
      };
      result[duplicateIdx] = merged;
    } else {
      // First time seeing this user
      seenUids.add(u.uid);
      if (email) seenEmails.add(email);
      if (username) seenUsernames.add(username);
      if (cleanNip && cleanNip.length >= 4) seenNips.add(cleanNip);
      if (bphKey) seenOsimRoles.add(bphKey);
      if (osimKey) seenOsimRoles.add(osimKey);
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

    // 1. If an extracurricular list is provided, match against it
    if (allEkskuls && allEkskuls.length > 0) {
      const matchedById = allEkskuls.find(e => e.id.toLowerCase() === cleanItem.toLowerCase());
      if (matchedById) {
        canonicalIds.push(matchedById.id);
        continue;
      }
      const matchedByName = allEkskuls.find(e => 
        e.name.toLowerCase().trim() === cleanItem.toLowerCase() ||
        cleanItem.toLowerCase().startsWith(e.name.toLowerCase().trim()) ||
        e.name.toLowerCase().includes(cleanItem.toLowerCase())
      );
      if (matchedByName) {
        canonicalIds.push(matchedByName.id);
        continue;
      }
    }

    // 2. Direct ID check
    if (cleanItem.startsWith('ekskul_')) {
      canonicalIds.push(cleanItem);
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
      canonicalIds.push(`ekskul_${slug}`);
    }
  }

  // Deduplicate and filter empty
  return Array.from(new Set(canonicalIds.filter(Boolean)));
};

/**
 * Deduplicate Teachers array to guarantee strictly ONE record per teacher.
 * Merges entries where IDs are 't_...' vs 'user_t_...' or where NIP/name matches.
 */
export const deduplicateTeachersList = (teachers: Teacher[], allEkskuls?: Array<{ id: string; name: string }>): Teacher[] => {
  if (!Array.isArray(teachers) || teachers.length <= 1) {
    if (Array.isArray(teachers) && teachers.length === 1) {
      return [{
        ...teachers[0],
        assignedExtracurriculars: canonicalizeAssignedEkskulIds(teachers[0].assignedExtracurriculars, allEkskuls)
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

    let duplicateIdx = -1;

    if (seenIds.has(t.id)) {
      duplicateIdx = result.findIndex(r => r.id === t.id);
    } else if (cleanNip && cleanNip.length >= 6 && seenNips.has(cleanNip)) {
      duplicateIdx = result.findIndex(r => cleanDigits(r.nip) === cleanNip);
    } else if (email && seenEmails.has(email)) {
      duplicateIdx = result.findIndex(r => r.email && r.email.trim().toLowerCase() === email);
    } else if (normName && normName.length >= 6 && seenNormNames.has(normName)) {
      duplicateIdx = result.findIndex(r => normalizeName(r.fullName) === normName);
    }

    if (duplicateIdx >= 0) {
      const existing = result[duplicateIdx];
      const merged: Teacher = {
        ...existing,
        ...t,
        id: existing.id,
        phone: existing.phone || t.phone,
        email: existing.email || t.email,
        nip: existing.nip && existing.nip !== '-' ? existing.nip : t.nip,
        assignedExtracurriculars: canonicalizeAssignedEkskulIds([
          ...(existing.assignedExtracurriculars || []),
          ...(t.assignedExtracurriculars || [])
        ], allEkskuls)
      };
      result[duplicateIdx] = merged;
    } else {
      seenIds.add(t.id);
      if (cleanNip && cleanNip.length >= 6) seenNips.add(cleanNip);
      if (email) seenEmails.add(email);
      if (normName && normName.length >= 6) seenNormNames.add(normName);
      result.push({
        ...t,
        assignedExtracurriculars: canonicalizeAssignedEkskulIds(t.assignedExtracurriculars, allEkskuls)
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
    // 2. Match by Student NIS
    else if (effectiveCleanNis && effectiveCleanNis.length >= 4 && seenNis.has(effectiveCleanNis)) {
      duplicateIdx = result.findIndex(r => cleanDigits(r.studentNis) === effectiveCleanNis);
    }
    // 3. Match by Normalized Student Name
    else if (effectiveNormName && effectiveNormName.length >= 4 && seenNormNames.has(effectiveNormName)) {
      duplicateIdx = result.findIndex(r => normalizeName(r.fullName) === effectiveNormName);
    }
    // 4. Enforce strict single-holder constraint for BPH positions (e.g. only 1 Wakil Ketua)
    else if (bphKey && seenBphPositions.has(bphKey)) {
      duplicateIdx = result.findIndex(r => getCanonicalBphPositionKey(r.position, r.sekbid) === bphKey);
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
        loginUsername: refreshedMember.loginUsername || existing.loginUsername,
        loginPassword: (refreshedMember.loginPassword && refreshedMember.loginPassword !== 'password') ? refreshedMember.loginPassword : (existing.loginPassword || refreshedMember.loginPassword)
      };
      result[duplicateIdx] = merged;
    } else {
      seenIds.add(m.id);
      if (effectiveCleanNis && effectiveCleanNis.length >= 4) seenNis.add(effectiveCleanNis);
      if (effectiveNormName && effectiveNormName.length >= 4) seenNormNames.add(effectiveNormName);
      if (bphKey) seenBphPositions.add(bphKey);
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

  // 6 & 7. OSIM Student Accounts (BPH & Sekbid 1-8) (Canonical: anggota_osim, Legacy: pengurus_osim)
  if (u.role === 'anggota_osim' || u.role === 'pengurus_osim') {
    const pos = (u.osimPosition || u.position || '').toLowerCase();
    const role = (u.osimRole || '').toLowerCase();
    const dName = (u.osimDepartmentName || '').toLowerCase();
    const dCode = (u.osimDepartmentCode || '').toLowerCase();
    const usr = (u.username || '').toLowerCase();

    // 6. Anggota BPH (Ketua, Wakil, Sekretaris, Bendahara)
    const isKetua = pos.includes('ketua umum') || (!pos.includes('wakil') && !pos.includes('sekbid') && (pos.includes('ketua') || role === 'ketua'));
    const isWakil = pos.includes('wakil') || role === 'wakil';
    const isSekretaris = pos.includes('sekretaris') || role === 'sekretaris';
    const isBendahara = pos.includes('bendahara') || role === 'bendahara' || u.isCashManager;

    if (isKetua) {
      return { rank: 6, categoryLabel: 'BPH OSIM - Ketua Umum', orderWeight: 600, subOrder: 1 };
    }
    if (isWakil) {
      return { rank: 6, categoryLabel: 'BPH OSIM - Wakil Ketua', orderWeight: 600, subOrder: 2 };
    }
    if (isSekretaris) {
      return { rank: 6, categoryLabel: 'BPH OSIM - Sekretaris Umum', orderWeight: 600, subOrder: 3 };
    }
    if (isBendahara) {
      return { rank: 6, categoryLabel: 'BPH OSIM - Bendahara Umum', orderWeight: 600, subOrder: 4 };
    }

    // 7. Seksi Bidang 1 s.d. 8
    const sekbidMatch = (dCode + ' ' + dName + ' ' + pos + ' ' + usr).match(/sekbid\s*[-_]?\s*(\d+)/i) ||
                         (dCode + ' ' + dName + ' ' + pos).match(/bidang\s*[-_]?\s*(\d+)/i);
    const sekbidNum = sekbidMatch ? parseInt(sekbidMatch[1], 10) : 99;

    return {
      rank: 7,
      categoryLabel: sekbidNum <= 8 ? `Seksi Bidang (Sekbid ${sekbidNum})` : 'Seksi Bidang OSIM',
      orderWeight: 700,
      subOrder: sekbidNum
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
  categoryKey: 'all' | 'waka' | 'guru_bk' | 'pembina_osim' | 'pembina_ekskul' | 'wali_kelas' | 'dewan_guru';
}

export const getTeacherHierarchyClassification = (t: Teacher): TeacherHierarchyClassification => {
  if (!t) {
    return { rank: 6, categoryLabel: 'Dewan Guru & Staf', orderWeight: 600, categoryKey: 'dewan_guru' };
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

  // 6. Dewan Guru & Staf Lainnya
  return { rank: 6, categoryLabel: 'Dewan Guru & Staf', orderWeight: 600, categoryKey: 'dewan_guru' };
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

export const isPurgedClassId = (classId?: string): boolean => {
  if (!classId) return false;
  const clean = classId.toLowerCase().trim();
  if (PURGED_DEMO_CLASS_IDS.includes(clean)) return true;
  if (
    clean.includes('rpl') ||
    clean.includes('tkj') ||
    clean.includes('dummy') ||
    clean.includes('c_x_iis') ||
    clean.includes('c_xi_iis') ||
    clean.includes('c_xii_iis') ||
    clean.includes('c_x_mia') ||
    clean.includes('c_xi_mia') ||
    clean.includes('c_xii_mia') ||
    clean.includes('c_x_keagamaan') ||
    clean.includes('c_xi_keagamaan') ||
    clean.includes('c_xii_keagamaan')
  ) {
    return true;
  }
  const normalizedName = clean.replace(/[^a-z0-9]/g, '');
  if (
    normalizedName.startsWith('xiis') ||
    normalizedName.startsWith('xmia') ||
    normalizedName.startsWith('xkeagamaan') ||
    normalizedName.startsWith('xiiis') ||
    normalizedName.startsWith('ximia') ||
    normalizedName.startsWith('xikeagamaan') ||
    normalizedName.startsWith('xiiiis') ||
    normalizedName.startsWith('xiimia') ||
    normalizedName.startsWith('xiikeagamaan')
  ) {
    return true;
  }
  return isDeletedClassId(classId);
};

export const getDeletedClassIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_CLASS_IDS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr);
      }
    }
  } catch (e) {}
  return new Set();
};

export const addDeletedClassId = (classId: string) => {
  if (!classId) return;
  try {
    const set = getDeletedClassIds();
    set.add(classId);
    set.add(classId.toLowerCase().trim());
    localStorage.setItem(DELETED_CLASS_IDS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {}
};

export const removeDeletedClassId = (classId: string) => {
  if (!classId) return;
  try {
    const set = getDeletedClassIds();
    set.delete(classId);
    set.delete(classId.toLowerCase().trim());
    localStorage.setItem(DELETED_CLASS_IDS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {}
};

export const isDeletedClassId = (classId?: string): boolean => {
  if (!classId) return false;
  const clean = classId.toLowerCase().trim();
  const set = getDeletedClassIds();
  return set.has(classId) || set.has(clean) || PURGED_DEMO_CLASS_IDS.includes(clean);
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

