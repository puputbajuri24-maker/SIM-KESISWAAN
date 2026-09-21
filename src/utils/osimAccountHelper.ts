import { OsimMember, UserProfile } from '../types';
import { getDefaultOsimPassword } from '../services/seedData';

/**
 * Extracts Sekbid number (1-8) from text or department name or code
 * e.g. "Sekbid 1: Keimanan...", "SEKBID-1", "Ketua Sekbid 1", "sekbid1" -> 1
 */
export const extractSekbidNumber = (text?: string): number | null => {
  if (!text) return null;
  const match = text.match(/sekbid\s*[-_]?\s*(\d+)/i);
  if (match) return parseInt(match[1], 10);
  return null;
};

/**
 * Checks if a member belongs to BPH (Ketua Umum, Wakil Ketua, Sekretaris, Bendahara)
 * and NOT a Sekbid
 */
export const isBphMember = (member: { position?: string; sekbid?: string }): boolean => {
  const sekbidNum = extractSekbidNumber(member.sekbid) || extractSekbidNumber(member.position);
  if (sekbidNum !== null) return false;
  const pos = (member.position || '').toLowerCase();
  const sek = (member.sekbid || '').toLowerCase();
  if (sek.includes('bph') || sek.includes('badan pengurus harian')) return true;
  if (pos.includes('ketua') && !pos.includes('sekbid')) return true;
  if (pos.includes('wakil')) return true;
  if (pos.includes('sekretaris')) return true;
  if (pos.includes('bendahara')) return true;
  return false;
};

/**
 * Robust matcher that links an OsimMember to their corresponding UserProfile in allUsers.
 * Guarantees that Sekbid members NEVER incorrectly match BPH Ketua (osim.ketua / ibubos123).
 */
export const findLinkedOsimAccount = (
  member: OsimMember | Partial<OsimMember>,
  accounts: UserProfile[]
): UserProfile | undefined => {
  if (!member || !accounts || accounts.length === 0) return undefined;

  const cleanName = (member.fullName || '').toLowerCase().trim();
  const cleanNis = (member.studentNis || '').trim();
  const pos = (member.position || '').toLowerCase();
  const sekbidNum = extractSekbidNumber(member.sekbid) || extractSekbidNumber(member.position);

  // 1. Direct NIS / NIP match if student NIS is available
  if (cleanNis) {
    const nisMatch = accounts.find(u => 
      (u.nip && u.nip.trim() === cleanNis) ||
      (u.studentNis && u.studentNis.trim() === cleanNis) ||
      (u.username && u.username.toLowerCase() === cleanNis.toLowerCase())
    );
    if (nisMatch) return nisMatch;
  }

  // 2. Full name matching
  if (cleanName) {
    const nameMatch = accounts.find(u => {
      const uName = (u.displayName || '').toLowerCase().trim();
      return uName === cleanName || (uName.length >= 6 && cleanName.length >= 6 && (uName.includes(cleanName) || cleanName.includes(uName)));
    });
    if (nameMatch) return nameMatch;
  }

  // 3. Direct ID or email match
  if (member.id) {
    const idMatch = accounts.find(u => u.uid === member.id || u.uid === `user_${member.id}`);
    if (idMatch) return idMatch;
  }
  if (member.email) {
    const emailMatch = accounts.find(u => u.email && u.email.toLowerCase() === member.email!.toLowerCase());
    if (emailMatch) return emailMatch;
  }

  // 4. SEKBID MATCHING (Sekbid 1 s.d. 8)
  if (sekbidNum !== null) {
    const targetCodeSimple = `sekbid${sekbidNum}`;
    const sekbidMatch = accounts.find(u => {
      // Must NOT be BPH Ketua/Wakil/Sekretaris/Bendahara
      if (u.osimRole === 'ketua' && (!u.osimDepartmentCode || u.osimDepartmentCode === 'BPH') && u.username === 'osim.ketua') return false;
      if (u.osimRole === 'wakil' && (!u.osimDepartmentCode || u.osimDepartmentCode === 'BPH') && u.username === 'osim.wakil') return false;
      if (u.osimRole === 'sekretaris' && (!u.osimDepartmentCode || u.osimDepartmentCode === 'BPH') && u.username === 'osim.sekretaris') return false;
      if (u.osimRole === 'bendahara' && (!u.osimDepartmentCode || u.osimDepartmentCode === 'BPH') && u.username === 'osim.bendahara') return false;

      const uSekbidNum = extractSekbidNumber(u.osimDepartmentCode) ||
        extractSekbidNumber(u.osimDepartmentName) ||
        extractSekbidNumber(u.osimPosition) ||
        extractSekbidNumber(u.username);
      if (uSekbidNum === sekbidNum) return true;

      if (u.osimDepartmentId === `dept_sekbid_${sekbidNum}`) return true;
      if (u.uid === `user_osim_dept_sekbid_${sekbidNum}`) return true;
      if (u.username?.toLowerCase() === `osim.sekbid${sekbidNum}` || u.username?.toLowerCase() === targetCodeSimple) return true;
      return false;
    });

    if (sekbidMatch) return sekbidMatch;
  }

  // 5. BPH Role match for generic system accounts only
  if (isBphMember(member)) {
    if (pos.includes('ketua') && !pos.includes('wakil') && !pos.includes('sekbid')) {
      const ketuaMatch = accounts.find(u => 
        u.uid === 'user_osim_ketua' ||
        u.username === 'osim.ketua'
      );
      if (ketuaMatch) return ketuaMatch;
    }
    if (pos.includes('wakil')) {
      const wakilMatch = accounts.find(u =>
        u.uid === 'user_osim_wakil' ||
        u.username === 'osim.wakil'
      );
      if (wakilMatch) return wakilMatch;
    }
    if (pos.includes('sekretaris')) {
      const sekretarisMatch = accounts.find(u =>
        u.uid === 'user_osim_sekretaris' ||
        u.username === 'osim.sekretaris'
      );
      if (sekretarisMatch) return sekretarisMatch;
    }
    if (pos.includes('bendahara')) {
      const bendaharaMatch = accounts.find(u =>
        u.uid === 'user_osim_bendahara' ||
        u.username === 'osim.bendahara'
      );
      if (bendaharaMatch) return bendaharaMatch;
    }
  }

  return undefined;
};

/**
 * Returns default username for a member based on role or sekbid
 */
export const getDefaultOsimUsername = (member: OsimMember | Partial<OsimMember>): string => {
  if (member.studentNis && member.studentNis.trim().length >= 4) {
    return member.studentNis.trim();
  }

  const cleanName = (member.fullName || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
  if (cleanName) {
    return `osim.${cleanName}`;
  }

  const sekbidNum = extractSekbidNumber(member.sekbid) || extractSekbidNumber(member.position);
  if (sekbidNum !== null) {
    return `osim.sekbid${sekbidNum}`;
  }

  const pos = (member.position || '').toLowerCase();
  if (pos.includes('ketua') && !pos.includes('wakil') && !pos.includes('sekbid')) {
    return 'osim.ketua';
  }
  if (pos.includes('wakil')) {
    return 'osim.wakil';
  }
  if (pos.includes('sekretaris')) {
    return 'osim.sekretaris';
  }
  if (pos.includes('bendahara')) {
    return 'osim.bendahara';
  }

  return 'osim.anggota';
};

/**
 * Returns default deterministic password for a member based on role or sekbid
 */
export const getDefaultOsimPasswordForMember = (member: OsimMember | Partial<OsimMember>): string => {
  const sekbidNum = extractSekbidNumber(member.sekbid) || extractSekbidNumber(member.position);
  if (sekbidNum !== null) {
    return getDefaultOsimPassword(`sekbid${sekbidNum}`);
  }

  const pos = (member.position || '').toLowerCase();
  if (pos.includes('ketua') && !pos.includes('wakil') && !pos.includes('sekbid')) {
    return getDefaultOsimPassword('ketua');
  }
  if (pos.includes('wakil')) {
    return getDefaultOsimPassword('wakil');
  }
  if (pos.includes('sekretaris')) {
    return getDefaultOsimPassword('sekretaris');
  }
  if (pos.includes('bendahara')) {
    return getDefaultOsimPassword('bendahara');
  }

  return getDefaultOsimPassword(member.sekbid || member.position || 'sekbid1');
};
