import { SchoolHandbookMeta, SchoolRuleArticle } from '../types';

/**
 * =========================================================================
 * BUKU PEDOMAN DAN TATA TERTIB KESISWAAN
 * MAN 2 SERAM BAGIAN TIMUR
 * 
 * Keputusan Kepala Madrasah Nomor: B-380/Ma.26.02/PP.00.6/09/2026
 * Tahun Ajaran 2025/2026
 * =========================================================================
 */

export const OFFICIAL_HANDBOOK_META: SchoolHandbookMeta = {
  decreeNumber: 'B-380/Ma.26.02/PP.00.6/09/2026',
  decreeTitle: 'Dokumen Pedoman Hak, Kewajiban & Sistem Poin Kedisiplinan: Tata Tertib & Kode Etik Peserta Didik MAN 2 Seram Bagian Timur',
  effectiveDate: '2026-09-01',
  academicYear: '2025/2026',
  totalPoinMax: 100,
  thresholdTahap1: 10, // 10 - 20 Poin: Peringatan Lisan 1 & 2 (Wali Kelas)
  thresholdTahap2: 21, // 21 - 40 Poin: SP 1 & Panggilan Ortu 1 (Wali Kelas & Guru BK)
  thresholdTahap3: 41, // 41 - 75 Poin: SP 2 & Skorsing 3 Hari (Waka Kesiswaan & Guru BK)
  thresholdTahap4: 76, // 76 - 99 Poin: SP 3 Terakhir (Kepala Madrasah, Waka Kesiswaan & Guru BK)
  thresholdTahap5: 100, // >= 100 Poin: Dikembalikan Kepada Orang Tua (Kepala MAN 2 Seram Bagian Timur)
  thresholdSp1: 21,
  thresholdSp2: 41,
  thresholdSp3: 76,
  thresholdDrop: 100,
  mukadimah: 'Buku Pedoman Tata Tertib ini disusun sebagai landasan pembinaan akhlak mulia, kedisiplinan beribadah, ketertiban proses belajar mengajar, serta perlindungan hak rasa aman bagi seluruh warga MAN 2 Seram Bagian Timur. Seluruh ketentuan butir pelanggaran, akumulasi bobot poin, tahapan pemanggilan orang tua, hingga sanksi pemulihan wajib ditaati dan dipedomani secara konsisten.',
  signedBy: 'Zakaria, S. Pd.I., M. Pd',
  signedNip: '197808042003121008',
  wakaName: 'Puput Eka Bajuri, S. Pd., M. Or',
  wakaNip: '198810052020121003',
  issuedPlace: 'Seram Bagian Timur',
  issuedDate: '2026-09-23',
  lastUpdated: new Date().toISOString()
};

export interface DisciplineTier {
  tier: number;
  minPoints: number;
  maxPoints: number;
  name: string;
  subTitle: string;
  responsibleOfficer: string;
  actionRequired: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  badgeClass: string;
}

export const OFFICIAL_DISCIPLINE_TIERS: DisciplineTier[] = [
  {
    tier: 1,
    minPoints: 10,
    maxPoints: 20,
    name: 'Tahap 1: Peringatan Lisan 1 & 2',
    subTitle: 'Pembinaan Persuasif & Pencatatan Buku Kasus',
    responsibleOfficer: 'Wali Kelas',
    actionRequired: 'Peringatan lisan secara persuasif, pembinaan oleh Wali Kelas, dan pencatatan di Buku Kasus Siswa.',
    colorClass: 'text-amber-700 dark:text-amber-300',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    borderClass: 'border-amber-200 dark:border-amber-800',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
  },
  {
    tier: 2,
    minPoints: 21,
    maxPoints: 40,
    name: 'Tahap 2: Surat Peringatan 1 (SP 1) & Panggilan Ortu 1',
    subTitle: 'Penandatanganan SP 1 Bersama Wali Kelas & Guru BK',
    responsibleOfficer: 'Wali Kelas & Guru BK',
    actionRequired: 'Pemanggilan Orang Tua tahap 1, penandatanganan Surat Peringatan (SP 1) bersama Wali Kelas dan Guru BK.',
    colorClass: 'text-orange-700 dark:text-orange-300',
    bgClass: 'bg-orange-50 dark:bg-orange-950/40',
    borderClass: 'border-orange-200 dark:border-orange-800',
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200'
  },
  {
    tier: 3,
    minPoints: 41,
    maxPoints: 75,
    name: 'Tahap 3: Surat Peringatan 2 (SP 2) & Skorsing 3 Hari',
    subTitle: 'Pembinaan oleh Waka Kesiswaan & Skorsing Akademis',
    responsibleOfficer: 'Waka Kesiswaan & Guru BK',
    actionRequired: 'Pemanggilan Orang Tua tahap 2, penandatanganan SP 2, pembinaan oleh Waka Kesiswaan, dan skorsing akademis selama 3 hari.',
    colorClass: 'text-rose-700 dark:text-rose-300',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40',
    borderClass: 'border-rose-200 dark:border-rose-800',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
  },
  {
    tier: 4,
    minPoints: 76,
    maxPoints: 99,
    name: 'Tahap 4: Surat Peringatan 3 (SP 3 - Peringatan Terakhir)',
    subTitle: 'Peringatan Keras Sebelum Pemutusan Status oleh Kepala Madrasah',
    responsibleOfficer: 'Kepala Madrasah, Waka Kesiswaan & Guru BK',
    actionRequired: 'Pemanggilan Orang Tua tahap 3, Surat Peringatan Terakhir (SP 3), peringatan keras sebelum pemutusan status oleh Kepala Madrasah.',
    colorClass: 'text-red-700 dark:text-red-300',
    bgClass: 'bg-red-50 dark:bg-red-950/40',
    borderClass: 'border-red-300 dark:border-red-800',
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200'
  },
  {
    tier: 5,
    minPoints: 100,
    maxPoints: 999,
    name: 'Tahap 5: Dikembalikan Kepada Orang Tua (Dikeluarkan)',
    subTitle: 'Pemberhentian Status Peserta Didik MAN 2 SBT',
    responsibleOfficer: 'Kepala MAN 2 Seram Bagian Timur',
    actionRequired: 'Siswa dinyatakan GAGAL dalam pembinaan kedisiplinan dan dikembalikan kepada Orang Tua/Wali (Dikeluarkan dari MAN 2 Seram Bagian Timur).',
    colorClass: 'text-purple-800 dark:text-purple-300',
    bgClass: 'bg-purple-50 dark:bg-purple-950/40',
    borderClass: 'border-purple-300 dark:border-purple-800',
    badgeClass: 'bg-purple-100 text-purple-900 dark:bg-purple-900/60 dark:text-purple-200'
  }
];

export function getDisciplineTier(points: number): DisciplineTier | null {
  if (points < 10) return null;
  if (points >= 100) return OFFICIAL_DISCIPLINE_TIERS[4];
  if (points >= 76) return OFFICIAL_DISCIPLINE_TIERS[3];
  if (points >= 41) return OFFICIAL_DISCIPLINE_TIERS[2];
  if (points >= 21) return OFFICIAL_DISCIPLINE_TIERS[1];
  return OFFICIAL_DISCIPLINE_TIERS[0];
}

/**
 * 23 Butir Pelanggaran Aktif + 9 Butir Poin Pengurang (Reward)
 * Sesuai Dokumen Resmi Keputusan Kepala Madrasah B-380
 */
export const OFFICIAL_SCHOOL_RULES: SchoolRuleArticle[] = [
  // =========================================================================
  // A. KEDISIPLINAN KEHADIRAN, WAKTU & KERAPIAN PRIBADI (KODE: KH-01 s.d KH-09)
  // =========================================================================
  {
    id: 'rule_kh_01',
    code: 'KH-01',
    chapter: 'A. Kedisiplinan Kehadiran, Waktu & Kerapian Pribadi',
    articleNumber: 'Pasal 4',
    title: 'Terlambat datang ke madrasah < 15 menit',
    description: 'Siswa wajib hadir di madrasah selambat-lambatnya 10 menit sebelum jam pertama (Pasal 4 / Bel pukul 07.15 WIT).',
    points: 2,
    severity: 'Ringan',
    consequence: 'Melapor kepada Guru Piket, mengisi buku pelanggaran, dan diberikan pembinaan edukatif sebelum memasuki kelas.',
    authorizedOfficer: 'Guru Piket',
    sopSteps: ['Pencatatan jam kedatangan di pos piket', 'Pemberian kartu izin masuk', 'Pembinaan edukatif singkat'],
    isMandatory: true,
    type: 'pelanggaran',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_kh_02',
    code: 'KH-02',
    chapter: 'A. Kedisiplinan Kehadiran, Waktu & Kerapian Pribadi',
    articleNumber: 'Pasal 4',
    title: 'Terlambat masuk kelas setelah istirahat',
    description: 'Terlambat kembali ke ruang kelas setelah jam istirahat selesai saat KBM dimulai kembali.',
    points: 2,
    severity: 'Ringan',
    consequence: 'Teguran lisan dari guru mata pelajaran, pencatatan di buku kasus kelas, dan izin masuk belajar.',
    authorizedOfficer: 'Guru Mata Pelajaran / Guru Piket',
    sopSteps: ['Pemeriksaan alasan keterlambatan', 'Pencatatan waktu di jurnal kelas', 'Pembinaan disiplin waktu'],
    isMandatory: true,
    type: 'pelanggaran',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_kh_03',
    code: 'KH-03',
    chapter: 'A. Kedisiplinan Kehadiran, Waktu & Kerapian Pribadi',
    articleNumber: 'Pasal 6',
    title: 'Tidak berseragam sesuai ketentuan / atribut tidak lengkap',
    description: 'Atribut OSIS/Madrasah, dasi, topi, ikat pinggang, atau seragam harian tidak sesuai jadwal resmi (Pasal 6).',
    points: 2,
    severity: 'Ringan',
    consequence: 'Peringatan dan kewajiban melengkapi atribut resmi madrasah pada hari berikutnya.',
    authorizedOfficer: 'Guru Piket / Wali Kelas',
    sopSteps: ['Pemeriksaan kesesuaian seragam harian', 'Pencatatan pelanggaran atribut', 'Pemberian slip peringatan'],
    isMandatory: true,
    type: 'pelanggaran',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_kh_04',
    code: 'KH-04',
    chapter: 'A. Kedisiplinan Kehadiran, Waktu & Kerapian Pribadi',
    articleNumber: 'Pasal 4',
    title: 'Makan atau minum di dalam kelas saat KBM berlangsung',
    description: 'Mengonsumsi makanan/minuman tanpa izin guru pengajar saat jam pelajaran berlangsung.',
    points: 2,
    severity: 'Ringan',
    consequence: 'Teguran lisan, mengamankan makanan hingga jam istirahat, dan membersihkan meja/kelas.',
    authorizedOfficer: 'Guru Mata Pelajaran',
    sopSteps: ['Teguran langsung di kelas', 'Penghentian aktivitas makan/minum', 'Pencatatan dalam jurnal sikap siswa'],
    isMandatory: true,
    type: 'pelanggaran',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_kh_05',
    code: 'KH-05',
    chapter: 'A. Kedisiplinan Kehadiran, Waktu & Kerapian Pribadi',
    articleNumber: 'Pasal 4',
    title: 'Tidak membawa buku pelajaran sesuai jadwal',
    description: 'Tidak membawa perlengkapan belajar atau buku teks KBM hari itu tanpa alasan sah.',
    points: 2,
    severity: 'Ringan',
    consequence: 'Pembinaan mandiri, peminjaman buku ke perpustakaan madrasah, dan pencatatan kedisiplinan belajar.',
    authorizedOfficer: 'Guru Mata Pelajaran / Wali Kelas',
    sopSteps: ['Pemeriksaan buku/alat belajar', 'Peminjaman materi referensi', 'Teguran edukatif'],
    isMandatory: true,
    type: 'pelanggaran',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_kh_06',
    code: 'KH-06',
    chapter: 'A. Kedisiplinan Kehadiran, Waktu & Kerapian Pribadi',
    articleNumber: 'Pasal 6',
    title: 'Rambut panjang/tidak rapi (putra) atau jilbab tidak syar\'i (putri)',
    description: 'Rambut putra > 4 cm / menyentuh kerah / alis / telinga (standar potong 3-2-1). Jilbab putri tidak menutup dada / transparan (Pasal 6).',
    points: 5,
    severity: 'Ringan',
    consequence: 'Peringatan kerapian tertulis dan batas waktu maksimal 3 hari untuk merapikan potongan rambut atau memakai jilbab syar\'i.',
    authorizedOfficer: 'Guru Piket / Tim Disiplin Kesiswaan',
    sopSteps: ['Pengukuran panjang rambut putra / cek jilbab putri', 'Pemberian batas waktu pemotongan 3 hari', 'Verifikasi tindak lanjut'],
    isMandatory: true,
    type: 'pelanggaran',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_kh_07',
    code: 'KH-07',
    chapter: 'A. Kedisiplinan Kehadiran, Waktu & Kerapian Pribadi',
    articleNumber: 'Pasal 4',
    title: 'Alpa / Tidak masuk tanpa keterangan tertulis (per hari)',
    description: 'Tidak hadir ke madrasah tanpa surat izin orang tua/wali atau surat keterangan dokter paling lambat 1x24 jam (Pasal 4).',
    points: 5,
    severity: 'Ringan',
    consequence: 'Wali Kelas menghubungi orang tua/wali siswa dan pencatatan 5 poin alpa per hari.',
    authorizedOfficer: 'Wali Kelas',
    sopSteps: ['Verifikasi presensi harian', 'Konfirmasi ke orang tua siswa via telepon/WA', 'Pencatatan alpa di sistem'],
    isMandatory: true,
    type: 'pelanggaran',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_kh_08',
    code: 'KH-08',
    chapter: 'A. Kedisiplinan Kehadiran, Waktu & Kerapian Pribadi',
    articleNumber: 'Pasal 4',
    title: 'Meninggalkan lingkungan sekolah tanpa izin (Bolos)',
    description: 'Keluar gerbang madrasah atau melompati pagar saat jam sekolah masih berlangsung tanpa izin resmi guru piket/wali kelas.',
    points: 5,
    severity: 'Sedang',
    consequence: 'Pembinaan oleh Wali Kelas dan Guru BK, pembuatan surat komitmen disiplin, dan pemberitahuan orang tua.',
    authorizedOfficer: 'Wali Kelas & Guru BK',
    sopSteps: ['Pemeriksaan laporan guru piket/keamanan', 'Pemanggilan siswa oleh BK', 'Pemberitahuan kepada orang tua/wali'],
    isMandatory: true,
    type: 'pelanggaran',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_kh_09',
    code: 'KH-09',
    chapter: 'A. Kedisiplinan Kehadiran, Waktu & Kerapian Pribadi',
    articleNumber: 'Pasal 6',
    title: 'Celana pensil / pres / robek pada lutut (putra)',
    description: 'Lingkar kaki celana panjang putra wajib minimal 44 cm (dilarang model ketat/pensil/robek).',
    points: 5,
    severity: 'Ringan',
    consequence: 'Peringatan tertulis dan kewajiban mengganti celana berpotongan standar madrasah dalam batas waktu 3 hari.',
    authorizedOfficer: 'Tim Ketertiban Kesiswaan / Guru Piket',
    sopSteps: ['Pemeriksaan lingkar bawah celana', 'Pemberian teguran tertulis', 'Pengawasan penggantian seragam standar'],
    isMandatory: true,
    type: 'pelanggaran',
    academicYear: '2025/2026'
  },

  // =========================================================================
  // B. NILAI AKHLAKUL KARIMAH, IBADAH & KETERTIBAN BELAJAR (KODE: AK-01 s.d AK-06)
  // =========================================================================
  {
    id: 'rule_ak_01',
    code: 'AK-01',
    chapter: 'B. Nilai Akhlakul Karimah, Ibadah & Ketertiban Belajar',
    articleNumber: 'Pasal 2',
    title: 'Tidak mengikuti kegiatan shalat berjamaah tanpa alasan sah',
    description: 'Tidak shalat Dhuha/Dzuhur/Ashar berjamaah di musholla/masjid madrasah (kecuali siswi haid terverifikasi).',
    points: 2,
    severity: 'Ringan',
    consequence: 'Pembinaan keagamaan di musholla oleh guru PAI, tilawah Al-Qur\'an terbimbing, dan pencatatan presensi ibadah.',
    authorizedOfficer: 'Guru Pembina Keagamaan / Guru PAI',
    sopSteps: ['Pengecekan presensi shalat berjamaah', 'Pembinaan adab ibadah', 'Bimbingan tadarus mandiri'],
    isMandatory: true,
    type: 'pelanggaran',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_ak_02',
    code: 'AK-02',
    chapter: 'B. Nilai Akhlakul Karimah, Ibadah & Ketertiban Belajar',
    articleNumber: 'Pasal 3',
    title: 'Membuang sampah sembarangan / merusak fasilitas ringan',
    description: 'Mengotori lingkungan madrasah, membuang sampah sembarangan, atau merusak inventaris ringan kelas.',
    points: 5,
    severity: 'Ringan',
    consequence: 'Membersihkan area lingkungan yang dikotori dan/atau memperbaiki inventaris kelas yang dirusak.',
    authorizedOfficer: 'Wali Kelas / Tim Kebersihan & Adiwiyata',
    sopSteps: ['Teguran langsung di lokasi', 'Aksi kebersihan langsung oleh siswa', 'Pencatatan pelanggaran kebersihan'],
    isMandatory: true,
    type: 'pelanggaran',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_ak_03',
    code: 'AK-03',
    chapter: 'B. Nilai Akhlakul Karimah, Ibadah & Ketertiban Belajar',
    articleNumber: 'Pasal 8',
    title: 'Membawa/memainkan handphone (HP) saat KBM tanpa izin guru',
    description: 'Melanggar aturan Bab III/Pasal 8: Smartphone tidak disimpan dalam loker/tas dalam keadaan mati (silent/off) saat KBM reguler.',
    points: 5,
    severity: 'Ringan',
    consequence: 'Gawai diamankan sementara oleh guru pengajar, diserahkan ke loker penyimpanan kelas hingga jam pulang madrasah.',
    authorizedOfficer: 'Guru Mata Pelajaran / Guru Piket',
    sopSteps: ['Pengamanan gawai ke loker kelas', 'Pemberian teguran adab digital', 'Pengembalian gawai saat jam pulang'],
    isMandatory: true,
    type: 'pelanggaran',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_ak_04',
    code: 'AK-04',
    chapter: 'B. Nilai Akhlakul Karimah, Ibadah & Ketertiban Belajar',
    articleNumber: 'Pasal 7',
    title: 'Berpakaian ketat, membentuk tubuh, atau bersolek berlebihan',
    description: 'Menggunakan make-up mencolok, lipstik berlebih, atau pakaian ketat yang tidak Islami dan bertentangan dengan adab madrasah.',
    points: 5,
    severity: 'Ringan',
    consequence: 'Pembersihan riasan di tempat dan pembinaan adab berbusana muslimah oleh Guru Piket Putri / Guru BK.',
    authorizedOfficer: 'Guru Piket Putri / Guru BK',
    sopSteps: ['Pemeriksaan kerapian putri', 'Pembersihan riasan wajah', 'Bimbingan etika berbusana syar\'i'],
    isMandatory: true,
    type: 'pelanggaran',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_ak_05',
    code: 'AK-05',
    chapter: 'B. Nilai Akhlakul Karimah, Ibadah & Ketertiban Belajar',
    articleNumber: 'Pasal 3',
    title: 'Berduaan dengan lawan jenis yang bukan mahram (Khalwat)',
    description: 'Menyendiri/berduaan di tempat sepi atau pojok madrasah yang melanggar adab Islami dan nilai kesopanan.',
    points: 25,
    severity: 'Sedang',
    consequence: 'Konseling intensif oleh Guru BK, penandatanganan surat pernyataan komitmen, dan pemanggilan orang tua.',
    authorizedOfficer: 'Guru BK & Waka Kesiswaan',
    sopSteps: ['Penertiban oleh tim kesiswaan', 'Konseling individual & bimbingan akhlak di ruang BK', 'Pemanggilan orang tua tahap awal'],
    isMandatory: true,
    type: 'pelanggaran',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_ak_06',
    code: 'AK-06',
    chapter: 'B. Nilai Akhlakul Karimah, Ibadah & Ketertiban Belajar',
    articleNumber: 'Pasal 3',
    title: 'Melawan, membantah, atau bersikap tidak sopan kepada Guru/Karyawan',
    description: 'Mengucapkan kata kasar, membentak, atau bersikap membangkang kepada guru atau tenaga kependidikan madrasah.',
    points: 30,
    severity: 'Berat',
    consequence: 'Pembinaan khusus oleh Waka Kesiswaan & Guru BK, permintaan maaf tertulis di hadapan orang tua, dan surat peringatan.',
    authorizedOfficer: 'Waka Kesiswaan & Guru BK',
    sopSteps: ['Klarifikasi insiden bersama saksi', 'Mediasi pembinaan di ruang Kesiswaan', 'Penandatanganan surat komitmen etika'],
    isMandatory: true,
    type: 'pelanggaran',
    academicYear: '2025/2026'
  },

  // =========================================================================
  // C. PELANGGARAN BERAT, HUKUM, ASUSILA & PERLINDUNGAN MADRASAH (KODE: BR-01 s.d BR-08)
  // =========================================================================
  {
    id: 'rule_br_01',
    code: 'BR-01',
    chapter: 'C. Pelanggaran Berat, Hukum, Asusila & Perlindungan Madrasah',
    articleNumber: 'Pasal 3',
    title: 'Membawa, menyimpan, atau menghisap rokok / vape',
    description: 'Membawa rokok/vape di madrasah atau merokok saat berseragam madrasah baik di dalam maupun di luar lingkungan sekolah.',
    points: 50,
    severity: 'Berat',
    consequence: 'Penyitaan barang bukti, penerbitan Surat Peringatan 2 (SP 2), pemanggilan orang tua, dan skorsing akademis selama 3 hari.',
    authorizedOfficer: 'Waka Kesiswaan & Guru BK',
    sopSteps: ['Penyitaan dan pemusnahan barang bukti', 'Penerbitan SP 2', 'Skorsing 3 hari dengan penugasan mandiri di rumah'],
    isMandatory: true,
    type: 'pelanggaran',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_br_02',
    code: 'BR-02',
    chapter: 'C. Pelanggaran Berat, Hukum, Asusila & Perlindungan Madrasah',
    articleNumber: 'Pasal 3',
    title: 'Melakukan perundungan (Bullying), pemerasan, atau ancaman',
    description: 'Perundungan verbal, fisik, cyberbullying, pemalakan, atau tindakan intimidasi dan ancaman kepada sesama siswa.',
    points: 75,
    severity: 'Berat',
    consequence: 'Penerbitan SP 2 / SP 3, pembinaan psikologis oleh Guru BK, pengembalian uang pemerasan, dan skorsing akademis.',
    authorizedOfficer: 'Waka Kesiswaan, Guru BK & Kepala Madrasah',
    sopSteps: ['Investigasi dan pendampingan korban', 'Penetapan sanksi SP 2/3 pada pelaku', 'Mediasi bersama kedua pihak orang tua'],
    isMandatory: true,
    type: 'pelanggaran',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_br_03',
    code: 'BR-03',
    chapter: 'C. Pelanggaran Berat, Hukum, Asusila & Perlindungan Madrasah',
    articleNumber: 'Pasal 6',
    title: 'Membuat tato atau tindik palsu/asli',
    description: 'Membuat tato permanen/sementara atau tindik pada bagian tubuh yang dilarang bagi peserta didik.',
    points: 50,
    severity: 'Berat',
    consequence: 'Pemanggilan orang tua/wali, pembuatan surat perjanjian untuk menghapus tato/melepas tindik secara tuntas.',
    authorizedOfficer: 'Waka Kesiswaan & Guru BK',
    sopSteps: ['Pemeriksaan fisik oleh tim kesiswaan', 'Pemanggilan orang tua', 'Batas waktu pembersihan tato/tindik'],
    isMandatory: true,
    type: 'pelanggaran',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_br_04',
    code: 'BR-04',
    chapter: 'C. Pelanggaran Berat, Hukum, Asusila & Perlindungan Madrasah',
    articleNumber: 'Pasal 3',
    title: 'Membawa, menyimpan, atau mengedarkan minuman keras & Narkoba',
    description: 'Pelanggaran hukum pidana narkotika, zat adiktif terlarang, atau minuman beralkohol di lingkungan madrasah.',
    points: 100,
    severity: 'Sangat Berat',
    consequence: 'Konferensi kasus darurat pimpinan madrasah, koordinasi aparat penegak hukum, dan siswa dikembalikan kepada orang tua (dikeluarkan).',
    authorizedOfficer: 'Kepala MAN 2 Seram Bagian Timur',
    sopSteps: ['Pengamanan barang bukti', 'Rapat pleno dewan guru & pimpinan', 'Penerbitan SK pengembalian kepada orang tua'],
    isMandatory: true,
    type: 'pelanggaran',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_br_05',
    code: 'BR-05',
    chapter: 'C. Pelanggaran Berat, Hukum, Asusila & Perlindungan Madrasah',
    articleNumber: 'Pasal 3',
    title: 'Membawa senjata tajam atau barang berbahaya lainnya',
    description: 'Membawa pisau, gear motor, ketapel berbahaya, atau benda tajam tanpa izin resmi keperluan praktikum pembelajaran.',
    points: 50,
    severity: 'Berat',
    consequence: 'Penyitaan langsung senjata berbahaya, pemanggilan darurat orang tua/wali, dan penerbitan Surat Peringatan 2 (SP 2).',
    authorizedOfficer: 'Waka Kesiswaan & Guru BK',
    sopSteps: ['Penyitaan seketika di tempat', 'Pemanggilan orang tua dalam 1x24 jam', 'Penerbitan SP 2 dan skorsing'],
    isMandatory: true,
    type: 'pelanggaran',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_br_06',
    code: 'BR-06',
    chapter: 'C. Pelanggaran Berat, Hukum, Asusila & Perlindungan Madrasah',
    articleNumber: 'Pasal 3',
    title: 'Terlibat tawuran / perkelahian di dalam atau luar madrasah',
    description: 'Tawuran antarpelajar atau perkelahian massal yang membahayakan keselamatan dan mencemarkan nama baik madrasah.',
    points: 50,
    severity: 'Berat',
    consequence: 'Pemberian sanksi skorsing akademis 3 hari, pemanggilan orang tua, dan penandatanganan surat perjanjian bermaterai.',
    authorizedOfficer: 'Waka Kesiswaan & Guru BK',
    sopSteps: ['Pemeriksaan seluruh siswa yang terlibat', 'Penerbitan sanksi skorsing 3 hari', 'Penandatanganan pakta damai bermaterai'],
    isMandatory: true,
    type: 'pelanggaran',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_br_07',
    code: 'BR-07',
    chapter: 'C. Pelanggaran Berat, Hukum, Asusila & Perlindungan Madrasah',
    articleNumber: 'Pasal 3',
    title: 'Terlibat pergaulan bebas / asusila / pelecehan seksual / hamil / menghamili',
    description: 'Tindakan asusila berat, perzinaan, pelecehan seksual, pornografi terbukti, atau kondisi kehamilan di luar ikatan pernikahan sah.',
    points: 100,
    severity: 'Sangat Berat',
    consequence: 'Rapat pleno pimpinan madrasah bersama komite madrasah, pembinaan tertutup, dan siswa dikembalikan kepada orang tua/wali.',
    authorizedOfficer: 'Kepala MAN 2 Seram Bagian Timur',
    sopSteps: ['Investigasi komprehensif tertutup oleh pimpinan', 'Rapat pleno dewan guru', 'Pemberhentian status peserta didik secara resmi'],
    isMandatory: true,
    type: 'pelanggaran',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_br_08',
    code: 'BR-08',
    chapter: 'C. Pelanggaran Berat, Hukum, Asusila & Perlindungan Madrasah',
    articleNumber: 'Pasal 3',
    title: 'Mencemarkan nama baik MAN 2 Seram Bagian Timur secara langsung atau via media sosial',
    description: 'Unggahan provokatif, konten hoaks, ujaran kebencian, atau penghinaan terhadap institusi madrasah/guru di media sosial atau media publik.',
    points: 100,
    severity: 'Sangat Berat',
    consequence: 'Klarifikasi dan permohonan maaf terbuka, take down konten provokatif, dan sanksi tegas hingga pengembalian kepada orang tua.',
    authorizedOfficer: 'Kepala Madrasah & Tim Humas Kesiswaan',
    sopSteps: ['Dokumentasi bukti digital unggahan', 'Klarifikasi dan pemanggilan orang tua', 'Keputusan sanksi puncak oleh Kepala Madrasah'],
    isMandatory: true,
    type: 'pelanggaran',
    academicYear: '2025/2026'
  },

  // =========================================================================
  // D. BAB V • PENGHARGAAN / REWARD PRESTASI & PEMUTIHAN POIN (KODE: RW-01 s.d RW-09)
  // =========================================================================
  {
    id: 'rule_rw_01',
    code: 'RW-01',
    chapter: 'Bab V: Penghargaan / Reward Prestasi & Pemutihan Poin',
    articleNumber: 'Bab V',
    title: 'Menemukan dan mengembalikan barang berharga',
    description: 'Jujur mengembalikan uang atau barang berharga temuan kepada pihak madrasah/pemilik sah.',
    points: -10,
    severity: 'Apresiasi',
    consequence: 'Pemberian piagam penghargaan integritas kejujuran dan pengurangan (pemutihan) 10 poin pelanggaran.',
    authorizedOfficer: 'Wali Kelas & Guru BK',
    sopSteps: ['Verifikasi laporan penyerahan barang temuan', 'Pencatatan kredit poin prestasi di SIM Kesiswaan', 'Pengurangan poin akumulasi'],
    isMandatory: true,
    type: 'penghargaan',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_rw_02',
    code: 'RW-02',
    chapter: 'Bab V: Penghargaan / Reward Prestasi & Pemutihan Poin',
    articleNumber: 'Bab V',
    title: 'Kehadiran 100% (tanpa cacat) dalam satu semester',
    description: 'Hadir penuh di madrasah tanpa sakit, izin, atau alpa sepanjang satu semester berjalan.',
    points: -15,
    severity: 'Apresiasi',
    consequence: 'Piagam penghargaan siswa teladan kedisiplinan presensi dan pengurangan 15 poin pelanggaran.',
    authorizedOfficer: 'Wali Kelas & Waka Kesiswaan',
    sopSteps: ['Rekapitulasi presensi akhir semester', 'Penerbitan piagam kehadiran prima', 'Pembaruan catatan kedisiplinan'],
    isMandatory: true,
    type: 'penghargaan',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_rw_03',
    code: 'RW-03',
    chapter: 'Bab V: Penghargaan / Reward Prestasi & Pemutihan Poin',
    articleNumber: 'Bab V',
    title: 'Hafal Al-Quran (per 1 Juz, disetorkan ke tim tahfidz)',
    description: 'Telah menyetorkan hafalan Al-Qur\'an mutqin per 1 juz kepada guru pembina tahfidz/keagamaan madrasah.',
    points: -20,
    severity: 'Apresiasi',
    consequence: 'Pemberian Syahadah Tahfidz dan pengurangan (pemutihan) 20 poin pelanggaran per juz hafalan.',
    authorizedOfficer: 'Koordinator Keagamaan & Guru Pembina Tahfidz',
    sopSteps: ['Ujian tasmi\' hafalan 1 juz', 'Pengesahan syahadah oleh Kepala Madrasah', 'Pemutihan 20 poin di sistem BK'],
    isMandatory: true,
    type: 'penghargaan',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_rw_04',
    code: 'RW-04',
    chapter: 'Bab V: Penghargaan / Reward Prestasi & Pemutihan Poin',
    articleNumber: 'Bab V',
    title: 'Juara 1, 2, 3 Lomba Tingkat Kabupaten / Kota',
    description: 'Meraih gelar juara tingkat Kabupaten Seram Bagian Timur dalam bidang akademik, seni, riset, atau olahraga.',
    points: -20,
    severity: 'Apresiasi',
    consequence: 'Apresiasi resmi pada apel madrasah, piagam prestasi, dan pengurangan 20 poin pelanggaran.',
    authorizedOfficer: 'Waka Kesiswaan & Pembina Ekstrakurikuler',
    sopSteps: ['Penyerahan sertifikat kejuaraan', 'Pengumuman apresiasi saat upacara', 'Pencatatan kredit poin prestasi'],
    isMandatory: true,
    type: 'penghargaan',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_rw_05',
    code: 'RW-05',
    chapter: 'Bab V: Penghargaan / Reward Prestasi & Pemutihan Poin',
    articleNumber: 'Bab V',
    title: 'Juara 1, 2, 3 Lomba Tingkat Provinsi',
    description: 'Meraih kejuaraan di tingkat Provinsi Maluku dalam kompetisi resmi Kemenag, Kemdikbud, atau federasi resmi.',
    points: -30,
    severity: 'Apresiasi',
    consequence: 'Penghargaan piala madrasah, piagam kehormatan, dan pengurangan 30 poin pelanggaran.',
    authorizedOfficer: 'Waka Kesiswaan & Kepala Madrasah',
    sopSteps: ['Validasi piagam kejuaraan provinsi', 'Pemberian apresiasi pimpinan', 'Pemutihan 30 poin pelanggaran'],
    isMandatory: true,
    type: 'penghargaan',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_rw_06',
    code: 'RW-06',
    chapter: 'Bab V: Penghargaan / Reward Prestasi & Pemutihan Poin',
    articleNumber: 'Bab V',
    title: 'Juara 1, 2, 3 Lomba Tingkat Nasional / Internasional',
    description: 'Mengharumkan nama MAN 2 Seram Bagian Timur di ajang kompetisi tingkat Nasional (KSM/MYRES/O2SN/FLS2N) atau Internasional.',
    points: -50,
    severity: 'Apresiasi',
    consequence: 'Penghargaan kehormatan tertinggi Kepala Madrasah dan pemutihan 50 poin pelanggaran.',
    authorizedOfficer: 'Kepala MAN 2 Seram Bagian Timur',
    sopSteps: ['Penyambutan resmi kontingen', 'Pemberian beasiswa prestasi madrasah', 'Pencatatan rekor prestasi siswa'],
    isMandatory: true,
    type: 'penghargaan',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_rw_07',
    code: 'RW-07',
    chapter: 'Bab V: Penghargaan / Reward Prestasi & Pemutihan Poin',
    articleNumber: 'Bab V',
    title: 'Peringkat 1, 2, 3 Kelas pada akhir semester',
    description: 'Berprestasi akademik meraih peringkat 3 besar di kelasnya pada buku laporan hasil belajar (rapor).',
    points: -15,
    severity: 'Apresiasi',
    consequence: 'Piagam bintang pelajar berprestasi dan pengurangan 15 poin pelanggaran.',
    authorizedOfficer: 'Wali Kelas & Waka Kurikulum',
    sopSteps: ['Verifikasi nilai ledger rapor kelas', 'Pemberian piagam juara kelas', 'Pemutihan 15 poin kedisiplinan'],
    isMandatory: true,
    type: 'penghargaan',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_rw_08',
    code: 'RW-08',
    chapter: 'Bab V: Penghargaan / Reward Prestasi & Pemutihan Poin',
    articleNumber: 'Bab V',
    title: 'Terpilih menjadi Pengurus Inti OSIM / MPK',
    description: 'Dedikasi melayani madrasah sebagai pengurus inti organisasi siswa (Ketua, Wakil, Sekretaris, Bendahara, Sekbid).',
    points: -10,
    severity: 'Apresiasi',
    consequence: 'Penerbitan SK Kepengurusan Resmi Kepala Madrasah dan pengurangan 10 poin pelanggaran.',
    authorizedOfficer: 'Pembina OSIM & Waka Kesiswaan',
    sopSteps: ['Pelantikan resmi organisasi siswa', 'Penerbitan kartu pengurus OSIM', 'Kredit poin apresiasi organisasi'],
    isMandatory: true,
    type: 'penghargaan',
    academicYear: '2025/2026'
  },
  {
    id: 'rule_rw_09',
    code: 'RW-09',
    chapter: 'Bab V: Penghargaan / Reward Prestasi & Pemutihan Poin',
    articleNumber: 'Bab V',
    title: 'Menjadi inisiator kegiatan sosial positif di lingkungan madrasah',
    description: 'Menggerakkan bakti sosial, kepedulian lingkungan hidup, literasi kreatif, atau kegiatan keagamaan Islami inspiratif.',
    points: -15,
    severity: 'Apresiasi',
    consequence: 'Sertifikat pelopor sosial madrasah dan pengurangan 15 poin pelanggaran.',
    authorizedOfficer: 'Pembina OSIM & Waka Kesiswaan',
    sopSteps: ['Validasi proposal dan pelaksanaan kegiatan bakti sosial', 'Verifikasi dampak positif kegiatan', 'Pemberian kredit 15 poin pemutihan'],
    isMandatory: true,
    type: 'penghargaan',
    academicYear: '2025/2026'
  }
];
