/**
 * Generator dan Normalizer ID Standar Kesiswaan
 * - Guru: Format "Gxx-Inisial" (misal: G01-BS, G02-SN, G15-AF)
 * - Siswa: Format "SIS-Angkatan-Urut" (misal: SIS-2425-0001)
 */

// Daftar gelar umum yang disaring saat mengekstrak inisial nama asli guru
const ACADEMIC_TITLES = new Set([
  'dr', 'dra', 'drs', 'drg', 'prof', 'ir',
  'h', 'hj', 'kh', 'ustadz', 'ustadzah', 'habib', 'sayyid',
  'spd', 'mpd', 'sag', 'mag', 'skom', 'mkom', 'ssi', 'msi',
  'st', 'mt', 'se', 'mm', 'sh', 'mh', 'sos', 'msos',
  'psi', 'mpsi', 'gr', 'lc', 'ma', 'ba', 'bsc', 'msc', 'phd',
  'mhum', 'shum', 'spdi', 'mpdi', 'sn', 'msn', 'ip', 'mip'
]);

/**
 * Ekstrak 2 huruf inisial nama guru bersih dari gelar akademik / keagamaan
 * Contoh:
 * - "Drs. H. Bambang Sutrisno, M.Pd." -> "BS"
 * - "Siti Nurhaliza, S.Psi., M.A." -> "SN"
 * - "Ahmad Fauzi" -> "AF"
 * - "Supriyanto" -> "SU"
 */
export function extractCleanInitials(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') return 'XX';

  // Hapus tanda baca titik dan koma, pecah kata
  const words = fullName
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  // Saring kata yang merupakan gelar
  const cleanWords = words.filter(word => {
    const lower = word.toLowerCase().replace(/[^a-z]/g, '');
    return lower.length > 0 && !ACADEMIC_TITLES.has(lower);
  });

  const candidates = cleanWords.length > 0 ? cleanWords : words;

  if (candidates.length === 0) return 'XX';

  if (candidates.length === 1) {
    const single = candidates[0].toUpperCase().replace(/[^A-Z]/g, '');
    if (single.length >= 2) {
      return single.substring(0, 2);
    }
    return (single + 'X').substring(0, 2);
  }

  // Ambil huruf pertama kata pertama dan kata kedua
  const firstLetter = candidates[0].charAt(0).toUpperCase();
  const secondLetter = candidates[1].charAt(0).toUpperCase();

  const result = `${firstLetter}${secondLetter}`.replace(/[^A-Z]/g, '');
  return result.length === 2 ? result : (result + 'XX').substring(0, 2);
}

/**
 * Format kode guru standar: Gxx-YY (contoh: G01-BS, G12-AF)
 * @param indexUrut Angka urut 1, 2, 3...
 * @param fullName Nama lengkap guru untuk diekstrak inisialnya
 */
export function formatTeacherCode(indexUrut: number, fullName: string): string {
  const pad = String(indexUrut).padStart(2, '0');
  const initials = extractCleanInitials(fullName);
  return `G${pad}-${initials}`;
}

/**
 * Validasi apakah suatu string memenuhi format kode guru (misal G01-BS atau 01BS)
 */
export function isValidTeacherCode(code?: string): boolean {
  if (!code) return false;
  const clean = code.trim().toUpperCase();
  return /^G\d{2,3}-[A-Z]{2}$/.test(clean) || /^\d{2,3}[A-Z]{2}$/.test(clean);
}

/**
 * Normalisasi kode guru agar seragam menjadi "Gxx-YY"
 */
export function normalizeTeacherCode(rawCode: string | undefined, fallbackIndex: number, fullName: string): string {
  if (!rawCode || !rawCode.trim()) {
    return formatTeacherCode(fallbackIndex, fullName);
  }

  const clean = rawCode.trim().toUpperCase();
  // Jika sudah format G01-BS
  if (/^G\d{2,3}-[A-Z]{2}$/.test(clean)) {
    return clean;
  }
  // Jika format 01BS (tanpa G dan strip)
  const matchCompact = clean.match(/^(\d{2,3})([A-Z]{2})$/);
  if (matchCompact) {
    const num = matchCompact[1].padStart(2, '0');
    const init = matchCompact[2];
    return `G${num}-${init}`;
  }
  // Jika format G01BS (tanpa strip)
  const matchNoDash = clean.match(/^G(\d{2,3})([A-Z]{2})$/);
  if (matchNoDash) {
    const num = matchNoDash[1].padStart(2, '0');
    const init = matchNoDash[2];
    return `G${num}-${init}`;
  }

  // Jika input kode manual lainnya, rapikan
  return clean;
}

/**
 * Format ID siswa standar: SIS-Angkatan-NomorUrut (misal: SIS-2425-0001)
 * @param academicYear String tahun ajaran misal "2024/2025" atau "2425"
 * @param indexUrut Nomor urut siswa 1, 2, 3...
 */
export function formatStudentCode(academicYear: string | undefined, indexUrut: number): string {
  let batch = '2425';
  if (academicYear) {
    const digits = academicYear.replace(/\D/g, '');
    if (digits.length >= 8) {
      // 20242025 -> 2425
      batch = `${digits.substring(2, 4)}${digits.substring(6, 8)}`;
    } else if (digits.length === 4) {
      batch = digits;
    }
  }
  const pad = String(indexUrut).padStart(4, '0');
  return `SIS-${batch}-${pad}`;
}
