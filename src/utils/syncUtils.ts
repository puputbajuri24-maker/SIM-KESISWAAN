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
 * Tombstone tracking for deleted user accounts so stale local caches or
 * un-purged default demo sets never resurrect deleted accounts.
 */
export const getDeletedUids = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_UIDS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (e) {}
  return new Set();
};

export const addDeletedUid = (uid: string) => {
  if (!uid) return;
  try {
    const set = getDeletedUids();
    set.add(uid);
    // Also add related prefix variations if applicable
    if (uid.startsWith('user_')) {
      set.add(uid.replace(/^user_/, ''));
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
  const rawU = u.uid.replace(/^user_/, '');
  const rawT = t.id.replace(/^t_/, '').replace(/^teacher_/, '');
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
 * Deduplicate Teachers array to guarantee strictly ONE record per teacher.
 * Merges entries where IDs are 't_...' vs 'user_t_...' or where NIP/name matches.
 */
export const deduplicateTeachersList = (teachers: Teacher[]): Teacher[] => {
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
        assignedExtracurriculars: Array.from(new Set([...(existing.assignedExtracurriculars || []), ...(t.assignedExtracurriculars || [])]))
      };
      result[duplicateIdx] = merged;
    } else {
      seenIds.add(t.id);
      if (cleanNip && cleanNip.length >= 6) seenNips.add(cleanNip);
      if (email) seenEmails.add(email);
      if (normName && normName.length >= 6) seenNormNames.add(normName);
      result.push(t);
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

  const isBph = sek.includes('bph') || 
    pos.includes('ketua umum') || 
    pos.includes('wakil ketua') || 
    pos.includes('sekretaris') || 
    pos.includes('bendahara');

  if (!isBph) return null;

  if (pos.includes('wakil')) return 'bph_wakil_ketua';
  if (pos.includes('ketua') && !pos.includes('sekbid')) return 'bph_ketua_umum';
  if (pos.includes('sekretaris 1') || pos.includes('sekretaris umum') || pos === 'sekretaris') return 'bph_sekretaris_1';
  if (pos.includes('sekretaris 2') || pos.includes('wakil sekretaris')) return 'bph_sekretaris_2';
  if (pos.includes('bendahara 1') || pos.includes('bendahara umum') || pos === 'bendahara') return 'bph_bendahara_1';
  if (pos.includes('bendahara 2') || pos.includes('wakil bendahara')) return 'bph_bendahara_2';

  return null;
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

  // 5. Pembina Ekstrakurikuler
  if (u.role === 'pembina_ekskul' || u.role === 'pembina') {
    return { rank: 5, categoryLabel: 'Pembina Ekstrakurikuler', orderWeight: 500, subOrder: 1 };
  }

  // 6 & 7. OSIM Student Accounts (BPH & Sekbid 1-8)
  if (u.role === 'pengurus_osim' || (u as any).role === 'anggota_osim') {
    const pos = (u.osimPosition || '').toLowerCase();
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

