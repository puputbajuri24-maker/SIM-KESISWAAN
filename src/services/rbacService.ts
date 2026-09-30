import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreErrors';
import { UserRole, UserProfile } from '../types';
import { normalizeUserRole, normalizeOsimPosition } from '../permissions';

export type RoleKey = 'sa' | 'waka' | 'bk' | 'pembina_osim' | 'pembina_ekskul' | 'bph' | 'sekbid';

export interface RoleModulePermission {
  canInput: boolean; // Hak akses input / edit / tambah data / eksekusi
  canView: boolean;  // Hak akses melihat / membaca / monitoring
  note?: string;     // Keterangan khusus kebijakan
}

export interface ModulePermissionRow {
  id: string;
  category: 'Manajemen & Sistem' | 'Kedisiplinan & BK' | 'Organisasi & Kegiatan' | 'Keuangan & Pelaporan' | 'Hak CRUD Terpusat (Di Luar cPanel)';
  module: string;
  desc: string;
  isCriticalSecurity?: boolean;
  isConfidential?: boolean;
  permissions: Record<RoleKey, RoleModulePermission>;
}

export const STORAGE_KEY = 'simkesiswaan_rbac_custom_matrix';
const LEGACY_STORAGE_KEY = 'simkesiswaan_rbac_matrix';

export const ROLE_COLUMNS: { key: RoleKey; label: string; subLabel: string; color: string; border: string }[] = [
  { key: 'sa', label: '1. Super Admin', subLabel: 'IT & Master Data', color: 'text-rose-400', border: 'border-rose-500/30' },
  { key: 'waka', label: '2. Waka Kesiswaan', subLabel: 'Top Policy / Kebijakan', color: 'text-blue-400', border: 'border-blue-500/30' },
  { key: 'bk', label: '3. Guru BK', subLabel: 'Bimbingan Konseling', color: 'text-purple-400', border: 'border-purple-500/30' },
  { key: 'pembina_osim', label: '4. Pembina OSIM', subLabel: 'Verifikator Intra OSIM', color: 'text-emerald-400', border: 'border-emerald-500/30' },
  { key: 'pembina_ekskul', label: '5. Pembina Ekskul', subLabel: 'Pelatih & Pembina Ekstra', color: 'text-cyan-400', border: 'border-cyan-500/30' },
  { key: 'bph', label: '6. OSIM BPH', subLabel: 'Manajer Inti OSIM', color: 'text-amber-400', border: 'border-amber-500/30' },
  { key: 'sekbid', label: '7. OSIM Sekbid', subLabel: 'Pelaksana Program', color: 'text-teal-400', border: 'border-teal-500/30' }
];

// Konfigurasi Standar / Default Rekomendasi RBAC Madrasah
export const DEFAULT_RBAC_MATRIX: ModulePermissionRow[] = [
  // 0. ATURAN MUTLAK: HAK CRUD TERPUSAT (DI LUAR CPANEL)
  {
    id: 'crud_teachers',
    category: 'Hak CRUD Terpusat (Di Luar cPanel)',
    module: 'CRUD Master Dewan Guru & Tendik',
    desc: 'Hak Tambah, Edit, Hapus, dan Import Guru di modul Dewan Guru. Standar: Terpusat di cPanel',
    isCriticalSecurity: true,
    permissions: {
      sa: { canInput: true, canView: true, note: 'Akses penuh cPanel' },
      waka: { canInput: false, canView: true, note: 'Terkunci (Terpusat di cPanel kecuali checklist dibuka)' },
      bk: { canInput: false, canView: true, note: 'Terkunci di cPanel' },
      pembina_osim: { canInput: false, canView: true, note: 'Terkunci di cPanel' },
      pembina_ekskul: { canInput: false, canView: true, note: 'Terkunci di cPanel' },
      bph: { canInput: false, canView: false, note: 'Tertutup' },
      sekbid: { canInput: false, canView: false, note: 'Tertutup' }
    }
  },
  {
    id: 'crud_pembina_intra',
    category: 'Hak CRUD Terpusat (Di Luar cPanel)',
    module: 'CRUD Pembina Organisasi Intra (OSIM)',
    desc: 'Hak Menetapkan, Mengubah, dan Mencopot Pembina OSIM di modul OSIM. Standar: Terpusat di cPanel',
    isCriticalSecurity: true,
    permissions: {
      sa: { canInput: true, canView: true, note: 'Akses penuh cPanel' },
      waka: { canInput: false, canView: true, note: 'Terkunci (Terpusat di cPanel kecuali checklist dibuka)' },
      bk: { canInput: false, canView: true, note: 'Terkunci di cPanel' },
      pembina_osim: { canInput: false, canView: true, note: 'Terkunci di cPanel' },
      pembina_ekskul: { canInput: false, canView: false, note: 'Tertutup' },
      bph: { canInput: false, canView: false, note: 'Tertutup' },
      sekbid: { canInput: false, canView: false, note: 'Tertutup' }
    }
  },
  {
    id: 'crud_pembina_ekstra',
    category: 'Hak CRUD Terpusat (Di Luar cPanel)',
    module: 'CRUD Pembina & Pelatih Ekstrakurikuler',
    desc: 'Hak Tambah Ekskul, Edit Pembina, dan Hapus Ekskul di modul Ekstrakurikuler. Standar: Terpusat di cPanel',
    isCriticalSecurity: true,
    permissions: {
      sa: { canInput: true, canView: true, note: 'Akses penuh cPanel' },
      waka: { canInput: false, canView: true, note: 'Terkunci (Terpusat di cPanel kecuali checklist dibuka)' },
      bk: { canInput: false, canView: true, note: 'Terkunci di cPanel' },
      pembina_osim: { canInput: false, canView: false, note: 'Tertutup' },
      pembina_ekskul: { canInput: false, canView: true, note: 'Terkunci di cPanel' },
      bph: { canInput: false, canView: false, note: 'Tertutup' },
      sekbid: { canInput: false, canView: false, note: 'Tertutup' }
    }
  },
  {
    id: 'crud_guru_bk',
    category: 'Hak CRUD Terpusat (Di Luar cPanel)',
    module: 'CRUD Personel Guru BK (Konselor)',
    desc: 'Hak Menetapkan, Mengubah, dan Mencopot Personel Guru BK di modul Konseling. Standar: Terpusat di cPanel',
    isCriticalSecurity: true,
    permissions: {
      sa: { canInput: true, canView: true, note: 'Akses penuh cPanel' },
      waka: { canInput: false, canView: true, note: 'Terkunci (Terpusat di cPanel kecuali checklist dibuka)' },
      bk: { canInput: false, canView: true, note: 'Terkunci di cPanel' },
      pembina_osim: { canInput: false, canView: false, note: 'Tertutup' },
      pembina_ekskul: { canInput: false, canView: false, note: 'Tertutup' },
      bph: { canInput: false, canView: false, note: 'Tertutup' },
      sekbid: { canInput: false, canView: false, note: 'Tertutup' }
    }
  },
  {
    id: 'crud_members',
    category: 'Hak CRUD Terpusat (Di Luar cPanel)',
    module: 'CRUD Anggota (Ekskul & Kabinet OSIM)',
    desc: 'Hak Pendaftaran dan Penghapusan Anggota Ekskul & Anggota/Pengurus OSIM di modul masing-masing. Standar: Terpusat di cPanel',
    isCriticalSecurity: true,
    permissions: {
      sa: { canInput: true, canView: true, note: 'Akses penuh cPanel' },
      waka: { canInput: false, canView: true, note: 'Terkunci (Terpusat di cPanel kecuali checklist dibuka)' },
      bk: { canInput: false, canView: true, note: 'Terkunci di cPanel' },
      pembina_osim: { canInput: false, canView: true, note: 'Kelola anggota OSIM via cPanel' },
      pembina_ekskul: { canInput: false, canView: true, note: 'Kelola anggota ekskul via cPanel' },
      bph: { canInput: false, canView: true, note: 'Terkunci' },
      sekbid: { canInput: false, canView: false, note: 'Tertutup' }
    }
  },
  {
    id: 'crud_password_reset',
    category: 'Hak CRUD Terpusat (Di Luar cPanel)',
    module: 'Reset Sandi Pengguna (Helpdesk Delegasi)',
    desc: 'Wewenang mereset kata sandi akun Siswa / Pengurus OSIM yang lupa sandi tanpa akses penuh cPanel. Proteksi hirarki: tidak dapat mereset akun pimpinan/admin.',
    isCriticalSecurity: true,
    permissions: {
      sa: { canInput: true, canView: true, note: 'Akses penuh seluruh akun' },
      waka: { canInput: false, canView: true, note: 'Delegasi reset sandi siswa/ekskul (Opsional)' },
      bk: { canInput: false, canView: false, note: 'Dibatasi sistem' },
      pembina_osim: { canInput: false, canView: true, note: 'Delegasi reset sandi pengurus OSIM (Opsional)' },
      pembina_ekskul: { canInput: false, canView: false, note: 'Dibatasi sistem' },
      bph: { canInput: false, canView: false, note: 'Tertutup' },
      sekbid: { canInput: false, canView: false, note: 'Tertutup' }
    }
  },

  // 1. MANAJEMEN & SISTEM
  {
    id: 'dashboard_analytics',
    category: 'Manajemen & Sistem',
    module: 'Dashboard Command Center & Analitik',
    desc: 'Ringkasan visual KPI kesiswaan, grafik & statistik',
    permissions: {
      sa: { canInput: true, canView: true, note: 'Akses penuh metrik sistem' },
      waka: { canInput: true, canView: true, note: 'Overview grafik kesiswaan & OSIM' },
      bk: { canInput: true, canView: true, note: 'Fokus rekam disiplin & pembinaan' },
      pembina_osim: { canInput: true, canView: true, note: 'Statistik OSIM & kegiatan intra' },
      pembina_ekskul: { canInput: true, canView: true, note: 'Statistik ekskul binaan' },
      bph: { canInput: false, canView: true, note: 'Progress proker & kas OSIM' },
      sekbid: { canInput: false, canView: true, note: 'Kegiatan bidang sendiri' }
    }
  },
  {
    id: 'cpanel_users',
    category: 'Manajemen & Sistem',
    module: 'cPanel & Manajemen Akun Pengguna',
    desc: 'Pembuatan, reset password & kelola akun Guru/Siswa',
    isCriticalSecurity: true,
    permissions: {
      sa: { canInput: true, canView: true, note: 'Otoritas mutlak seluruh akun' },
      waka: { canInput: false, canView: false, note: 'Bukan domain waka' },
      bk: { canInput: false, canView: false, note: 'Dibatasi sistem' },
      pembina_osim: { canInput: false, canView: false, note: 'Dibatasi sistem' },
      pembina_ekskul: { canInput: false, canView: false, note: 'Dibatasi sistem' },
      bph: { canInput: false, canView: false, note: 'Dibatasi sistem' },
      sekbid: { canInput: false, canView: false, note: 'Dibatasi sistem' }
    }
  },
  {
    id: 'config_master',
    category: 'Manajemen & Sistem',
    module: 'Konfigurasi Dasar & Data Master',
    desc: 'Tahun ajaran, database kelas, sinkronisasi Dapodik',
    permissions: {
      sa: { canInput: true, canView: true, note: 'Konfigurasi dasar aplikasi' },
      waka: { canInput: true, canView: true, note: 'Memilih tahun aktif & kelas' },
      bk: { canInput: false, canView: true, note: 'Menggunakan basis kelas' },
      pembina_osim: { canInput: false, canView: true, note: 'Menggunakan basis kelas' },
      pembina_ekskul: { canInput: false, canView: true, note: 'Menggunakan basis kelas' },
      bph: { canInput: false, canView: false, note: 'Dibatasi sistem' },
      sekbid: { canInput: false, canView: false, note: 'Dibatasi sistem' }
    }
  },
  {
    id: 'backup_restore',
    category: 'Manajemen & Sistem',
    module: 'Backup & Restore Database Sistem',
    desc: 'Cadangkan data JSON & pemulihan darurat',
    isCriticalSecurity: true,
    permissions: {
      sa: { canInput: true, canView: true, note: 'Eksekusi backup & restore' },
      waka: { canInput: false, canView: false, note: 'Dibatasi sistem' },
      bk: { canInput: false, canView: false, note: 'Dibatasi sistem' },
      pembina_osim: { canInput: false, canView: false, note: 'Dibatasi sistem' },
      pembina_ekskul: { canInput: false, canView: false, note: 'Dibatasi sistem' },
      bph: { canInput: false, canView: false, note: 'Dibatasi sistem' },
      sekbid: { canInput: false, canView: false, note: 'Dibatasi sistem' }
    }
  },
  {
    id: 'audit_logs',
    category: 'Manajemen & Sistem',
    module: 'Audit Trail & Log Aktivitas Keamanan',
    desc: 'Pemantauan rekam jejak pengguna demi keamanan',
    isCriticalSecurity: true,
    permissions: {
      sa: { canInput: true, canView: true, note: 'Pantau semua log pengguna' },
      waka: { canInput: false, canView: true, note: 'Log operasional kebijakan' },
      bk: { canInput: false, canView: false, note: 'Dibatasi sistem' },
      pembina_osim: { canInput: false, canView: false, note: 'Dibatasi sistem' },
      pembina_ekskul: { canInput: false, canView: false, note: 'Dibatasi sistem' },
      bph: { canInput: false, canView: false, note: 'Dibatasi sistem' },
      sekbid: { canInput: false, canView: false, note: 'Dibatasi sistem' }
    }
  },
  {
    id: 'announcements_hub',
    category: 'Manajemen & Sistem',
    module: 'Pusat Pengumuman & Surat Edaran',
    desc: 'Penerbitan pengumuman resmi kesiswaan madrasah',
    permissions: {
      sa: { canInput: true, canView: true, note: 'Kelola semua pengumuman' },
      waka: { canInput: true, canView: true, note: 'Terbitkan pengumuman resmi' },
      bk: { canInput: true, canView: true, note: 'Info bimbingan & sosialisasi' },
      pembina_osim: { canInput: true, canView: true, note: 'Info kegiatan siswa/OSIM' },
      pembina_ekskul: { canInput: true, canView: true, note: 'Info jadwal ekskul/latihan' },
      bph: { canInput: true, canView: true, note: 'Info kegiatan siswa/OSIM' },
      sekbid: { canInput: false, canView: true, note: 'Hanya membaca pengumuman' }
    }
  },

  // 2. KEDISIPLINAN & BK
  {
    id: 'violations_discipline',
    category: 'Kedisiplinan & BK',
    module: 'Pencatatan Pelanggaran Siswa & Disiplin',
    desc: 'Input pelanggaran, akumulasi poin & rujukan sanksi',
    permissions: {
      sa: { canInput: true, canView: true, note: 'Audit data & supervisi' },
      waka: { canInput: true, canView: true, note: 'Disposisi & tindakan pimpinan' },
      bk: { canInput: true, canView: true, note: 'Kelola penuh poin disiplin' },
      pembina_osim: { canInput: false, canView: false, note: 'Dibatasi privasi siswa' },
      pembina_ekskul: { canInput: false, canView: false, note: 'Dibatasi privasi siswa' },
      bph: { canInput: false, canView: false, note: 'Tertutup total (Shield)' },
      sekbid: { canInput: false, canView: false, note: 'Tertutup total (Shield)' }
    }
  },
  {
    id: 'counseling_confidential',
    category: 'Kedisiplinan & BK',
    module: 'Catatan Konseling Rahasia (Confidential)',
    desc: 'Rekam medis bimbingan konseling dan dinamika kepribadian',
    isConfidential: true,
    permissions: {
      sa: { canInput: false, canView: true, note: 'Audit keamanan sistem' },
      waka: { canInput: true, canView: true, note: 'Dapat membaca catatan rahasia' },
      bk: { canInput: true, canView: true, note: 'Input & baca catatan rahasia BK' },
      pembina_osim: { canInput: false, canView: false, note: 'Dilindungi kode etik BK' },
      pembina_ekskul: { canInput: false, canView: false, note: 'Dilindungi kode etik BK' },
      bph: { canInput: false, canView: false, note: 'Tertutup total (Shield)' },
      sekbid: { canInput: false, canView: false, note: 'Tertutup total (Shield)' }
    }
  },
  {
    id: 'parent_calls_homevisit',
    category: 'Kedisiplinan & BK',
    module: 'Panggilan Orang Tua (SP 1, 2, 3) & Home Visit',
    desc: 'Surat panggilan ortu, berita acara kunjungan rumah siswa',
    permissions: {
      sa: { canInput: false, canView: true, note: 'Arsip dokumen dinas' },
      waka: { canInput: true, canView: true, note: 'Verifikasi & disposisi SP' },
      bk: { canInput: true, canView: true, note: 'Terbitkan SP & Home Visit' },
      pembina_osim: { canInput: false, canView: false, note: 'Dibatasi sistem' },
      pembina_ekskul: { canInput: false, canView: false, note: 'Dibatasi sistem' },
      bph: { canInput: false, canView: false, note: 'Tertutup total' },
      sekbid: { canInput: false, canView: false, note: 'Tertutup total' }
    }
  },
  {
    id: 'rules_tatib',
    category: 'Kedisiplinan & BK',
    module: 'Bobot Poin Pelanggaran & Tata Tertib',
    desc: 'Penetapan poin sanksi, kategori pelanggaran & reward',
    permissions: {
      sa: { canInput: true, canView: true, note: 'Konfigurasi master' },
      waka: { canInput: true, canView: true, note: 'Menentukan bobot poin & aturan' },
      bk: { canInput: true, canView: true, note: 'Konsultasi kriteria sanksi' },
      pembina_osim: { canInput: false, canView: true, note: 'Pedoman tata tertib' },
      pembina_ekskul: { canInput: false, canView: true, note: 'Pedoman tata tertib' },
      bph: { canInput: false, canView: true, note: 'Pedoman tata tertib' },
      sekbid: { canInput: false, canView: true, note: 'Pedoman tata tertib' }
    }
  },

  // 3. ORGANISASI & KEGIATAN
  {
    id: 'proposal_lpj',
    category: 'Organisasi & Kegiatan',
    module: 'Persetujuan Proposal & LPJ Kegiatan',
    desc: 'Verifikasi, revisi, dan pengesahan anggaran kegiatan',
    permissions: {
      sa: { canInput: true, canView: true, note: 'Akses darurat/supervisi' },
      waka: { canInput: true, canView: true, note: 'Otoritas tertinggi ACC proposal/LPJ' },
      bk: { canInput: false, canView: false, note: 'Dibatasi sistem' },
      pembina_osim: { canInput: true, canView: true, note: 'Verifikasi & koreksi usulan OSIM' },
      pembina_ekskul: { canInput: true, canView: true, note: 'Verifikasi proposal/LPJ ekskul' },
      bph: { canInput: true, canView: true, note: 'Membuat & ajukan proposal resmi' },
      sekbid: { canInput: true, canView: true, note: 'Ajukan lewat Sekbid sendiri' }
    }
  },
  {
    id: 'sekbid_draft',
    category: 'Organisasi & Kegiatan',
    module: 'Draf Proposal Mandiri Sekbid',
    desc: 'Penyusunan usulan kegiatan per seksi bidang OSIM',
    permissions: {
      sa: { canInput: true, canView: true, note: 'Pantau semua draf' },
      waka: { canInput: true, canView: true, note: 'Setelah diajukan pembina' },
      bk: { canInput: false, canView: false, note: 'Bukan domain BK' },
      pembina_osim: { canInput: true, canView: true, note: 'Review & bimbingan proposal sekbid' },
      pembina_ekskul: { canInput: false, canView: false, note: 'Khusus intra OSIM' },
      bph: { canInput: true, canView: true, note: 'Koordinasi lintas sekbid' },
      sekbid: { canInput: true, canView: true, note: 'Khusus bidang sendiri (terisolasi)' }
    }
  },
  {
    id: 'extracurricular_grading',
    category: 'Organisasi & Kegiatan',
    module: 'Penilaian Ekstrakurikuler & Piagam Prestasi',
    desc: 'Input nilai rapor ekskul & pencatatan piagam prestasi',
    permissions: {
      sa: { canInput: true, canView: true, note: 'Audit nilai & piagam' },
      waka: { canInput: true, canView: true, note: 'Pengesahan nilai & prestasi' },
      bk: { canInput: false, canView: true, note: 'Dukungan karir / SNBP' },
      pembina_osim: { canInput: false, canView: true, note: 'Lihat prestasi siswa' },
      pembina_ekskul: { canInput: true, canView: true, note: 'Input nilai rapor ekskul binaan' },
      bph: { canInput: true, canView: true, note: 'Catat piagam lomba OSIM' },
      sekbid: { canInput: false, canView: false, note: 'Tertutup dari nilai rapor' }
    }
  },
  {
    id: 'osim_calendar',
    category: 'Organisasi & Kegiatan',
    module: 'Kalender & Timeline Kegiatan OSIM/Madrasah',
    desc: 'Penjadwalan agenda, rapat, dan timeline event madrasah',
    permissions: {
      sa: { canInput: true, canView: true, note: 'Pemantauan sistem' },
      waka: { canInput: true, canView: true, note: 'Persetujuan kalender sekolah' },
      bk: { canInput: false, canView: true, note: 'Sinkronisasi layanan' },
      pembina_osim: { canInput: true, canView: true, note: 'Kelola jadwal & agenda OSIM' },
      pembina_ekskul: { canInput: false, canView: true, note: 'Pantau jadwal kegiatan' },
      bph: { canInput: true, canView: true, note: 'Kelola timeline kalender OSIM' },
      sekbid: { canInput: false, canView: true, note: 'Jadwal bidang sendiri' }
    }
  },
  {
    id: 'osim_structure',
    category: 'Organisasi & Kegiatan',
    module: 'Struktur Kabinet & Bidang OSIM',
    desc: 'SK Kepengurusan, penambahan/perubahan pengurus kabinet & seksi bidang',
    permissions: {
      sa: { canInput: true, canView: true, note: 'Supervisi & audit sistem' },
      waka: { canInput: true, canView: true, note: 'Pengesahan SK & struktur' },
      bk: { canInput: false, canView: true, note: 'Lihat struktur pengurus' },
      pembina_osim: { canInput: true, canView: true, note: 'Kelola & CRUD pengurus kabinet OSIM' },
      pembina_ekskul: { canInput: false, canView: true, note: 'Lihat struktur OSIM' },
      bph: { canInput: false, canView: true, note: 'Hanya melihat (Read-Only)' },
      sekbid: { canInput: false, canView: true, note: 'Hanya melihat (Read-Only)' }
    }
  },
  {
    id: 'attendance_documentation',
    category: 'Organisasi & Kegiatan',
    module: 'Presensi Digital Acara & Dokumentasi',
    desc: 'Absensi panitia/peserta kegiatan & unggah dokumentasi',
    permissions: {
      sa: { canInput: true, canView: true, note: 'Audit presensi' },
      waka: { canInput: true, canView: true, note: 'Rekap kehadiran peserta' },
      bk: { canInput: false, canView: false, note: 'Dibatasi sistem' },
      pembina_osim: { canInput: true, canView: true, note: 'Pengawasan acara & rapat OSIM' },
      pembina_ekskul: { canInput: true, canView: true, note: 'Input presensi latihan ekskul' },
      bph: { canInput: true, canView: true, note: 'Evaluasi keterlibatan' },
      sekbid: { canInput: true, canView: true, note: 'Absensi panitia & mini report' }
    }
  },
  {
    id: 'dispensation_letters',
    category: 'Organisasi & Kegiatan',
    module: 'Dispensasi & Surat Izin Resmi Siswa',
    desc: 'Penerbitan dispensasi lomba, izin dispensasi dinas madrasah',
    permissions: {
      sa: { canInput: true, canView: true, note: 'Arsip surat izin' },
      waka: { canInput: true, canView: true, note: 'Persetujuan & TTD dispensasi' },
      bk: { canInput: true, canView: true, note: 'Buat izin rujukan konseling' },
      pembina_osim: { canInput: true, canView: true, note: 'Ajukan dispensasi panitia/delegasi OSIM' },
      pembina_ekskul: { canInput: true, canView: true, note: 'Ajukan dispensasi atlet lomba ekskul' },
      bph: { canInput: true, canView: true, note: 'Ajukan izin panitia acara' },
      sekbid: { canInput: false, canView: false, note: 'Dibatasi sistem' }
    }
  },

  // 4. KEUANGAN & PELAPORAN
  {
    id: 'cash_osim',
    category: 'Keuangan & Pelaporan',
    module: 'Kas Besar OSIM & Anggaran Organisasi',
    desc: 'Pencatatan kas masuk/keluar, saldo & transparansi keuangan',
    permissions: {
      sa: { canInput: true, canView: true, note: 'Supervisi kas' },
      waka: { canInput: true, canView: true, note: 'Validasi realisasi anggaran' },
      bk: { canInput: false, canView: true, note: 'Audit transparansi umum' },
      pembina_osim: { canInput: true, canView: true, note: 'Pengawasan dana kas OSIM' },
      pembina_ekskul: { canInput: false, canView: true, note: 'Audit transparansi umum' },
      bph: { canInput: true, canView: true, note: 'Catat kas besar OSIM (Bendahara)' },
      sekbid: { canInput: true, canView: true, note: 'Laporan dana kegiatan sendiri' }
    }
  },
  {
    id: 'reports_rekap',
    category: 'Keuangan & Pelaporan',
    module: 'Rekapitulasi Laporan Bulanan / Semester',
    desc: 'Download rekap data kesiswaan untuk rapat dinas',
    permissions: {
      sa: { canInput: true, canView: true, note: 'Ekspor database lengkap' },
      waka: { canInput: true, canView: true, note: 'Rekap kesiswaan resmi untuk rapat' },
      bk: { canInput: true, canView: true, note: 'Laporan bimbingan siswa' },
      pembina_osim: { canInput: true, canView: true, note: 'Laporan kinerja kabinet OSIM' },
      pembina_ekskul: { canInput: true, canView: true, note: 'Laporan presensi & nilai ekskul' },
      bph: { canInput: true, canView: true, note: 'LPJ performa sekbid' },
      sekbid: { canInput: false, canView: false, note: 'Dibatasi sistem' }
    }
  }
];

// Helper to migrate legacy matrix data with single 'pembina' role key to separate 'pembina_osim' & 'pembina_ekskul'
export const migrateLegacyMatrixRows = (rows: any[]): ModulePermissionRow[] => {
  return rows.map(r => {
    const defaultRow = DEFAULT_RBAC_MATRIX.find(d => d.id === r.id);
    const permissions = { ...(r.permissions || {}) };

    // If legacy 'pembina' exists and either pembina_osim or pembina_ekskul is missing
    if (permissions.pembina && (!permissions.pembina_osim || !permissions.pembina_ekskul)) {
      if (!permissions.pembina_osim) {
        permissions.pembina_osim = defaultRow?.permissions.pembina_osim || { ...permissions.pembina };
      }
      if (!permissions.pembina_ekskul) {
        permissions.pembina_ekskul = defaultRow?.permissions.pembina_ekskul || { ...permissions.pembina };
      }
      delete permissions.pembina;
    }

    // Ensure all current RoleKey values are present
    for (const col of ROLE_COLUMNS) {
      if (!permissions[col.key]) {
        permissions[col.key] = defaultRow?.permissions[col.key] || { canInput: false, canView: false };
      }
    }

    return {
      ...r,
      permissions
    };
  });
};

/**
 * Normalizes raw matrix data against canonical DEFAULT_RBAC_MATRIX to guarantee
 * all modules and column keys exist safely without runtime undefined exceptions.
 */
export const normalizeMatrixData = (rawList: any[]): ModulePermissionRow[] => {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return DEFAULT_RBAC_MATRIX;
  }
  const migrated = migrateLegacyMatrixRows(rawList);
  const existingIds = new Set(migrated.map((p: any) => p.id));
  const missingRows = DEFAULT_RBAC_MATRIX.filter(d => !existingIds.has(d.id));
  return missingRows.length > 0 ? [...missingRows, ...migrated] : migrated;
};

// -------------------------------------------------------------
// Global In-Memory Reactive Cache & Real-Time Sync
// -------------------------------------------------------------
let cachedRbacMatrix: ModulePermissionRow[] | null = null;
let isFirestoreListenerActive = false;
let globalUnsubscribe: (() => void) | null = null;

/**
 * Reads the latest matrix from local storage synchronously.
 */
const readMatrixFromLocalStorage = (): ModulePermissionRow[] | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizeMatrixData(parsed);
      }
    }
  } catch (e) {
    // Ignore storage parse error
  }
  return null;
};

/**
 * Initializes real-time synchronization with Firestore document 'settings/rbac_matrix'.
 * Guarantees cross-device, cross-user, and cross-tab dynamic permission updates.
 */
let authUnsubscribe: (() => void) | null = null;

export const initGlobalRbacSync = (): () => void => {
  // 1. Synchronous hydration from local storage if memory cache is empty
  if (!cachedRbacMatrix) {
    const local = readMatrixFromLocalStorage();
    cachedRbacMatrix = local || DEFAULT_RBAC_MATRIX;
  }

  if (isFirestoreListenerActive) {
    return globalUnsubscribe || (() => {});
  }
  isFirestoreListenerActive = true;

  // 2. Real-time Firestore document listener attached only when authenticated
  authUnsubscribe = onAuthStateChanged(auth, (user) => {
    if (!user) {
      if (globalUnsubscribe) {
        globalUnsubscribe();
        globalUnsubscribe = null;
      }
      return;
    }

    if (globalUnsubscribe) {
      return;
    }

    try {
      const docRef = doc(db, 'settings', 'rbac_matrix');
      const unsub = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && Array.isArray(data.matrix) && data.matrix.length > 0) {
              const normalized = normalizeMatrixData(data.matrix);
              cachedRbacMatrix = normalized;
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
              } catch (e) {}
              window.dispatchEvent(new CustomEvent('rbac-matrix-updated', { detail: normalized }));
            }
          } else {
            // Document does not exist in Firestore yet: seed it with DEFAULT_RBAC_MATRIX
            setDoc(
              docRef,
              {
                matrix: DEFAULT_RBAC_MATRIX,
                updatedAt: new Date().toISOString(),
                updatedBy: 'System Seed'
              },
              { merge: true }
            ).catch((e) => {
              console.warn('RBAC Matrix initial Firestore seed note:', e);
            });
          }
        },
        (err) => {
          handleFirestoreError(err, OperationType.GET, 'settings/rbac_matrix');
        }
      );

      globalUnsubscribe = () => {
        unsub();
        globalUnsubscribe = null;
      };
    } catch (err) {
      console.warn('Failed to attach Firestore RBAC onSnapshot listener:', err);
    }
  });

  return () => {
    if (authUnsubscribe) {
      authUnsubscribe();
      authUnsubscribe = null;
    }
    if (globalUnsubscribe) {
      globalUnsubscribe();
      globalUnsubscribe = null;
    }
    isFirestoreListenerActive = false;
  };
};

// Auto-trigger sync on module load
if (typeof window !== 'undefined') {
  initGlobalRbacSync();
}

/**
 * Retrieves the currently active RBAC Matrix.
 * Prefers in-memory cache, falls back to local storage, then to canonical default.
 */
export const getActiveRbacMatrix = (): ModulePermissionRow[] => {
  if (cachedRbacMatrix && cachedRbacMatrix.length > 0) {
    return cachedRbacMatrix;
  }
  const local = readMatrixFromLocalStorage();
  if (local) {
    cachedRbacMatrix = local;
    return local;
  }
  cachedRbacMatrix = DEFAULT_RBAC_MATRIX;
  return DEFAULT_RBAC_MATRIX;
};

/**
 * Resolves a UserRole or UserProfile into the corresponding RBAC matrix column key.
 * Enforces canonical normalization and deny-by-default for unknown roles.
 */
export const resolveRoleKey = (role?: UserRole | string, user?: UserProfile | null): RoleKey | null => {
  if (!role) return null;
  const canonical = normalizeUserRole(role);
  if (!canonical) return null;

  if (canonical === 'super_admin') return 'sa';
  if (canonical === 'waka_kesiswaan') return 'waka';
  if (canonical === 'guru_bk') return 'bk';
  if (canonical === 'pembina_osim') return 'pembina_osim';
  if (canonical === 'coach_ekstrakurikuler') return 'pembina_ekskul';
  if (canonical === 'anggota_osim') {
    const pos = normalizeOsimPosition(user || ({ role: 'anggota_osim' } as any));
    if (
      pos === 'ketua_osim' ||
      pos === 'wakil_ketua_osim' ||
      pos === 'sekretaris_osim' ||
      pos === 'sekretaris' ||
      pos === 'bendahara_osim' ||
      pos === 'bendahara'
    ) {
      return 'bph';
    }
    return 'sekbid';
  }
  return null;
};

/**
 * Checks whether the specified role has Input permission on a given module.
 * Super Admin always has root bypass.
 */
export const canRoleInputModule = (
  role: UserRole | string | undefined,
  moduleId: string,
  user?: UserProfile | null
): boolean => {
  if (!role) return false;
  const canonical = normalizeUserRole(role);
  if (canonical === 'super_admin' || role === 'super_admin' || role === 'admin') return true;

  const roleKey = resolveRoleKey(role, user);
  if (!roleKey) return false;

  const matrix = getActiveRbacMatrix();
  const found = matrix.find((m) => m.id === moduleId);
  if (!found) return false;

  const perm = found.permissions[roleKey] || (found.permissions as any)?.pembina;
  return Boolean(perm?.canInput);
};

/**
 * Checks whether the specified role has View permission on a given module.
 * Super Admin always has root bypass.
 */
export const canRoleViewModule = (
  role: UserRole | string | undefined,
  moduleId: string,
  user?: UserProfile | null
): boolean => {
  if (!role) return false;
  const canonical = normalizeUserRole(role);
  if (canonical === 'super_admin' || role === 'super_admin' || role === 'admin') return true;

  const roleKey = resolveRoleKey(role, user);
  if (!roleKey) return false;

  const matrix = getActiveRbacMatrix();
  const found = matrix.find((m) => m.id === moduleId);
  if (!found) return false;

  const perm = found.permissions[roleKey] || (found.permissions as any)?.pembina;
  return Boolean(perm?.canView);
};

/**
 * Persists an updated RBAC Matrix to Cloud Firestore and local storage,
 * and immediately broadcasts the change to all reactive listeners.
 */
export const saveRbacMatrixToFirestore = async (
  matrix: ModulePermissionRow[],
  updatedBy: string
): Promise<void> => {
  const normalized = normalizeMatrixData(matrix);
  cachedRbacMatrix = normalized;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch (e) {}

  // Write to Cloud Firestore document settings/rbac_matrix
  try {
    await setDoc(doc(db, 'settings', 'rbac_matrix'), {
      matrix: normalized,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || 'Super Admin'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/rbac_matrix');
  }

  // Broadcast real-time permission update across app modules
  window.dispatchEvent(new CustomEvent('rbac-matrix-updated', { detail: normalized }));
};

/**
 * Resets the RBAC Matrix to the canonical default in Firestore and local storage.
 */
export const resetRbacMatrixToDefaultInFirestore = async (updatedBy: string): Promise<void> => {
  await saveRbacMatrixToFirestore(DEFAULT_RBAC_MATRIX, updatedBy);
};
