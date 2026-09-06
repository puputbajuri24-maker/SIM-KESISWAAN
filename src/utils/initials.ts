/**
 * Utility to extract 2-letter uppercase initials for teachers, counselors (Guru BK), and Pembina.
 * Specifically handles Indonesian naming conventions, academic titles, and honorifics.
 */

export function getTeacherInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return 'GB';

  let cleaned = name.trim();

  // 1. Remove trailing titles after commas (e.g., "Nama, S.Pd., M.Pd.")
  if (cleaned.includes(',')) {
    cleaned = cleaned.split(',')[0].trim();
  }

  // 2. Remove common Indonesian academic and honorific prefixes
  const titlePrefixes = [
    /^(dr\.|drs\.|dra\.|prof\.|ir\.)\s+/i,
    /^(dr|drs|dra|prof|ir)\s+/i,
    /^(h\.|hj\.|kh\.|k\.h\.|ust\.|ustadz|kyai|gus|habib)\s+/i,
    /^(h|hj|kh)\s+/i
  ];

  let previous = '';
  while (cleaned !== previous) {
    previous = cleaned;
    for (const prefix of titlePrefixes) {
      cleaned = cleaned.replace(prefix, '').trim();
    }
  }

  // 3. Remove inline academic degree abbreviations if without comma (e.g., "S.Pd", "M.Pd", "S.Ag", "M.Si", "S.Kom")
  cleaned = cleaned
    .replace(/\b(s\.pd\.i|m\.pd\.i|s\.pd|m\.pd|s\.ag|m\.ag|s\.kom|m\.kom|s\.t|m\.t|s\.si|m\.si|s\.sos|s\.e|m\.m|ph\.d|gr\.)\b/gi, '')
    .trim();

  // 4. Split remaining string into alphanumeric words
  const words = cleaned
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0);

  if (words.length === 0) {
    // Fallback: extract any first 2 alphabet characters from raw name
    const rawAlpha = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
    return rawAlpha.length >= 2 ? rawAlpha.slice(0, 2) : (rawAlpha + 'K').padEnd(2, 'G').slice(0, 2);
  }

  if (words.length === 1) {
    const single = words[0];
    if (single.length >= 2) {
      return single.slice(0, 2).toUpperCase();
    }
    return (single + 'K').toUpperCase();
  }

  // 2 or more words: take first letter of first word and first letter of second word
  const firstLetter = words[0].charAt(0).toUpperCase();
  const secondLetter = words[1].charAt(0).toUpperCase();
  return `${firstLetter}${secondLetter}`;
}

/**
 * Checks if a user role is a Guru BK or Pembina (OSIM / Ekstrakurikuler)
 */
export function isGuruBKOrPembinaRole(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.toLowerCase().trim();
  return (
    normalized === 'guru_bk' ||
    normalized === 'pembina' ||
    normalized === 'pembina_osim' ||
    normalized === 'pembina_ekskul' ||
    normalized.includes('bk') ||
    normalized.includes('pembina') ||
    normalized.includes('konseling') ||
    normalized.includes('konselor')
  );
}

/**
 * Returns role-tailored gradient and background color classes for the initials avatar
 */
export function getInitialsColorTheme(role?: string | null): {
  bgGradient: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  label: string;
} {
  const normalized = (role || '').toLowerCase();

  if (normalized.includes('bk') || normalized.includes('konsel')) {
    return {
      bgGradient: 'from-purple-600 via-indigo-600 to-violet-800',
      badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      textColor: 'text-purple-300',
      borderColor: 'border-purple-500/40',
      label: 'Guru Bimbingan Konseling (BK)'
    };
  }

  if (normalized.includes('osim')) {
    return {
      bgGradient: 'from-amber-600 via-orange-600 to-amber-700',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      textColor: 'text-amber-300',
      borderColor: 'border-amber-500/40',
      label: 'Pembina OSIM & Intrakurikuler'
    };
  }

  if (normalized.includes('pembina') || normalized.includes('ekskul')) {
    return {
      bgGradient: 'from-emerald-600 via-teal-600 to-emerald-800',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      textColor: 'text-emerald-300',
      borderColor: 'border-emerald-500/40',
      label: 'Pembina Ekstrakurikuler'
    };
  }

  return {
    bgGradient: 'from-blue-600 via-indigo-600 to-slate-800',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-500/40',
    label: 'Dewan Guru'
  };
}
