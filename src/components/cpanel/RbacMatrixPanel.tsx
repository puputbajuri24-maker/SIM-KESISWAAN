import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Shield,
  Crown,
  HeartHandshake,
  Award,
  Compass,
  Users,
  Sparkles,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  Check,
  X,
  Cpu,
  Save,
  RotateCcw,
  Search,
  SlidersHorizontal,
  CheckSquare,
  Square,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  Eye,
  Edit3,
  RefreshCw
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { UserRole, UserProfile } from '../../types';
import {
  RoleKey,
  RoleModulePermission,
  ModulePermissionRow,
  STORAGE_KEY,
  ROLE_COLUMNS,
  DEFAULT_RBAC_MATRIX,
  migrateLegacyMatrixRows,
  normalizeMatrixData,
  initGlobalRbacSync,
  getActiveRbacMatrix,
  resolveRoleKey,
  canRoleInputModule,
  canRoleViewModule,
  saveRbacMatrixToFirestore,
  resetRbacMatrixToDefaultInFirestore
} from '../../services/rbacService';

export type { RoleKey, RoleModulePermission, ModulePermissionRow };
export {
  STORAGE_KEY,
  ROLE_COLUMNS,
  DEFAULT_RBAC_MATRIX,
  migrateLegacyMatrixRows,
  normalizeMatrixData,
  initGlobalRbacSync,
  getActiveRbacMatrix,
  resolveRoleKey,
  canRoleInputModule,
  canRoleViewModule,
  saveRbacMatrixToFirestore,
  resetRbacMatrixToDefaultInFirestore
};

interface RbacMatrixPanelProps {
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  onSimulateRole: (role: UserRole, customUid?: string) => void;
  isSuperAdmin?: boolean;
}

export const RbacMatrixPanel: React.FC<RbacMatrixPanelProps> = ({
  currentUser,
  allUsers,
  onSimulateRole,
  isSuperAdmin: propIsSuperAdmin
}) => {
  const isSuperAdmin = propIsSuperAdmin ?? (currentUser?.role === 'super_admin');

  // State Matrix initialized from active cached/stored matrix
  const [matrixData, setMatrixData] = useState<ModulePermissionRow[]>(() => getActiveRbacMatrix());

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();

  // Filters & View Mode
  const [activeRoleView, setActiveRoleView] = useState<string>('all');
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [matrixViewMode, setMatrixViewMode] = useState<'input_focus' | 'dual_checkbox'>('input_focus');

  // Ensure global real-time Firestore sync is active and listen to updates
  useEffect(() => {
    initGlobalRbacSync();

    const handleUpdate = (e: any) => {
      if (e?.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setMatrixData(e.detail);
      } else {
        setMatrixData(getActiveRbacMatrix());
      }
    };

    window.addEventListener('rbac-matrix-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('rbac-matrix-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Save changes to Cloud Firestore and local cache with real-time broadcast
  const handleSaveMatrix = async () => {
    if (!isSuperAdmin) {
      toast.warning('Hanya Super Admin yang memiliki wewenang untuk menyimpan perubahan matriks hak akses.');
      return;
    }
    setIsSaving(true);
    try {
      await saveRbacMatrixToFirestore(
        matrixData,
        currentUser?.displayName || currentUser?.username || 'Super Admin'
      );
      setHasUnsavedChanges(false);
      const msg = 'Hak akses berhasil disesuaikan dan disinkronkan ke seluruh sistem secara real-time!';
      setSaveSuccessToast(msg);
      toast.success(msg);
      setTimeout(() => setSaveSuccessToast(null), 4000);
    } catch (e) {
      toast.error('Gagal menyimpan matriks hak akses ke server. Silakan periksa koneksi.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default standard recommendations
  const handleResetToDefault = async () => {
    if (!isSuperAdmin) {
      toast.warning('Hanya Super Admin yang berwenang mereset hak akses.');
      return;
    }
    if (window.confirm('Apakah Anda yakin ingin mengembalikan seluruh hak akses ke standar rekomendasi RBAC madrasah? Perubahan kustom yang belum disimpan akan direset.')) {
      setIsResetting(true);
      try {
        await resetRbacMatrixToDefaultInFirestore(
          currentUser?.displayName || currentUser?.username || 'Super Admin'
        );
        setMatrixData(DEFAULT_RBAC_MATRIX);
        setHasUnsavedChanges(false);
        const msg = 'Seluruh hak akses berhasil dikembalikan ke standar rekomendasi madrasah!';
        setSaveSuccessToast(msg);
        toast.success(msg);
        setTimeout(() => setSaveSuccessToast(null), 4000);
      } catch (e) {
        toast.error('Gagal mereset matriks hak akses.');
      } finally {
        setIsResetting(false);
      }
    }
  };

  // Toggle Input permission for a specific module & role
  const handleToggleInput = (moduleId: string, roleKey: RoleKey) => {
    if (!isSuperAdmin) {
      toast.warning('Hanya Super Admin yang berwenang mengubah kotak centang hak akses. Silakan masuk sebagai Super Admin.');
      return;
    }

    // Protect Super Admin from locking itself out of cPanel & backup
    if (roleKey === 'sa' && (moduleId === 'cpanel_users' || moduleId === 'backup_restore')) {
      toast.error('Keamanan Kritis: Hak akses input cPanel & Backup untuk Super Admin tidak boleh dinonaktifkan.');
      return;
    }

    // Protect password reset module: Pembina Ekskul, BK, Siswa OSIM are restricted by system policy
    if (moduleId === 'crud_password_reset' && (roleKey === 'pembina_ekskul' || roleKey === 'bk' || roleKey === 'bph' || roleKey === 'sekbid')) {
      toast.warning('Kebijakan Sistem: Peran Pembina Ekstrakurikuler, Guru BK, dan Siswa Pengurus OSIM dibatasi oleh sistem dan tidak dapat diberikan hak delegasi reset kata sandi.');
      return;
    }

    setMatrixData(prev =>
      prev.map(row => {
        if (row.id === moduleId) {
          const current = row.permissions[roleKey];
          const newCanInput = !current.canInput;
          return {
            ...row,
            permissions: {
              ...row.permissions,
              [roleKey]: {
                ...current,
                canInput: newCanInput,
                // Jika diberi akses input, otomatis berikan akses lihat juga
                canView: newCanInput ? true : current.canView
              }
            }
          };
        }
        return row;
      })
    );
    setHasUnsavedChanges(true);
  };

  // Toggle View permission for a specific module & role
  const handleToggleView = (moduleId: string, roleKey: RoleKey) => {
    if (!isSuperAdmin) {
      toast.warning('Hanya Super Admin yang berwenang mengubah kotak centang hak akses.');
      return;
    }

    if (roleKey === 'sa' && (moduleId === 'cpanel_users' || moduleId === 'backup_restore')) {
      toast.error('Keamanan Kritis: Hak akses melihat cPanel untuk Super Admin tidak boleh dinonaktifkan.');
      return;
    }

    if (moduleId === 'crud_password_reset' && (roleKey === 'pembina_ekskul' || roleKey === 'bk' || roleKey === 'bph' || roleKey === 'sekbid')) {
      toast.warning('Kebijakan Sistem: Modul Reset Kata Sandi dibatasi oleh sistem dan tidak dapat dibuka untuk peran Pembina Ekstrakurikuler, BK, maupun Siswa OSIM.');
      return;
    }

    setMatrixData(prev =>
      prev.map(row => {
        if (row.id === moduleId) {
          const current = row.permissions[roleKey];
          const newCanView = !current.canView;
          return {
            ...row,
            permissions: {
              ...row.permissions,
              [roleKey]: {
                ...current,
                canView: newCanView,
                // Jika akses lihat dicabut, maka akses input otomatis dicabut juga
                canInput: !newCanView ? false : current.canInput
              }
            }
          };
        }
        return row;
      })
    );
    setHasUnsavedChanges(true);
  };

  // Batch action for a whole role column
  const handleBatchToggleRole = (roleKey: RoleKey, allowAll: boolean) => {
    if (!isSuperAdmin) return;
    if (roleKey === 'sa' && !allowAll) {
      toast.error('Perlindungan Sistem: Kolom Super Admin tidak dapat dikosongkan seluruhnya.');
      return;
    }

    setMatrixData(prev =>
      prev.map(row => {
        // Jangan ubah modul keamanan kritis untuk super admin
        if (roleKey === 'sa' && (row.id === 'cpanel_users' || row.id === 'backup_restore')) {
          return row;
        }
        return {
          ...row,
          permissions: {
            ...row.permissions,
            [roleKey]: {
              ...row.permissions[roleKey],
              canInput: allowAll,
              canView: allowAll
            }
          }
        };
      })
    );
    setHasUnsavedChanges(true);
  };

  // Calculate statistics per role
  const roleStats = useMemo(() => {
    const stats: Record<RoleKey, { inputCount: number; viewCount: number; total: number }> = {
      sa: { inputCount: 0, viewCount: 0, total: matrixData.length },
      waka: { inputCount: 0, viewCount: 0, total: matrixData.length },
      bk: { inputCount: 0, viewCount: 0, total: matrixData.length },
      pembina_osim: { inputCount: 0, viewCount: 0, total: matrixData.length },
      pembina_ekskul: { inputCount: 0, viewCount: 0, total: matrixData.length },
      bph: { inputCount: 0, viewCount: 0, total: matrixData.length },
      sekbid: { inputCount: 0, viewCount: 0, total: matrixData.length }
    };

    matrixData.forEach(row => {
      ROLE_COLUMNS.forEach(col => {
        const perm = row.permissions[col.key];
        if (perm?.canInput) stats[col.key].inputCount++;
        if (perm?.canView) stats[col.key].viewCount++;
      });
    });

    return stats;
  }, [matrixData]);

  // Sample account finders for rapid simulation
  const saUser = allUsers.find(u => u.role === 'super_admin');
  const wakaUser = allUsers.find(u => u.role === 'waka_kesiswaan');
  const bkUser = allUsers.find(u => u.role === 'guru_bk');
  const pembinaOsimUser = allUsers.find(u => u.role === 'pembina_osim');
  const pembinaEkskulUser = allUsers.find(u => u.role === 'pembina_ekskul' || u.role === 'pembina');
  const osimBphUser = allUsers.find(u => u.role === 'pengurus_osim' && (u.osimDepartmentCode === 'BPH' || u.osimRole === 'ketua' || u.osimRole === 'sekretaris'));
  const osimSekbidUser = allUsers.find(u => u.role === 'pengurus_osim' && u.osimDepartmentCode !== 'BPH' && u.osimRole !== 'ketua' && u.osimRole !== 'sekretaris');

  const roleDefinitions = [
    {
      id: 'super_admin',
      roleKey: 'sa' as RoleKey,
      role: 'super_admin' as UserRole,
      title: '1. Super Admin',
      subtitle: 'IT / Pusat Data Sekolah',
      badge: 'KONTROL MUTLAK SISTEM',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      icon: Cpu,
      iconColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      mission: 'Memiliki kontrol mutlak atas aplikasi, kelola akun, data master, dan backup restore.',
      privileges: [
        'Membuat, mengedit, dan menghapus semua akun pengguna (Guru, Waka, Siswa, OSIM)',
        'Mengatur konfigurasi dasar aplikasi (tahun ajaran, database kelas, sinkronisasi Dapodik/Siswa)',
        'Melakukan backup dan restore database sistem kesiswaan secara berkala',
        'Memantau log audit aktivitas dan jejak rekam semua pengguna demi keamanan'
      ],
      boundaries: 'Fokus murni pada stabilitas infrastruktur data & server IT sekolah; tidak terlibat langsung dalam penilaian, sanksi pelanggaran, maupun konseling siswa.',
      sampleUser: saUser,
      testUid: saUser?.uid
    },
    {
      id: 'waka_kesiswaan',
      roleKey: 'waka' as RoleKey,
      role: 'waka_kesiswaan' as UserRole,
      title: '2. Waka Kesiswaan',
      subtitle: 'Top Management Kesiswaan',
      badge: 'OTORITAS TERTINGGI KEBIJAKAN',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      icon: Crown,
      iconColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      mission: 'Pemegang otoritas tertinggi untuk seluruh kebijakan kesiswaan di aplikasi madrasah.',
      privileges: [
        'Melihat dasbor ringkasan seluruh data kesiswaan (grafik pelanggaran, daftar prestasi, kegiatan OSIM & Ekstra)',
        'Menyetujui atau menolak proposal anggaran dan laporan pertanggungjawaban (LPJ)',
        'Menentukan bobot poin pelanggaran atau poin prestasi siswa dalam Buku Tata Tertib resmi',
        'Mengunduh laporan rekapitulasi kesiswaan bulanan/semesteran untuk rapat dinas madrasah'
      ],
      boundaries: 'Memiliki hak veto terhadap seluruh kegiatan siswa serta akses pengesahan surat resmi & rekapitulasi data sekolah.',
      sampleUser: wakaUser,
      testUid: wakaUser?.uid
    },
    {
      id: 'guru_bk',
      roleKey: 'bk' as RoleKey,
      role: 'guru_bk' as UserRole,
      title: '3. Guru BK',
      subtitle: 'Bimbingan Konseling',
      badge: 'REKAM MEDIS & PEMBINAAN',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      icon: HeartHandshake,
      iconColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      mission: 'Fokus pada rekam medis perilaku, pelanggaran, dan pembinaan kepribadian siswa.',
      privileges: [
        'Menginput, mengedit, dan menghapus data pelanggaran siswa serta poin kedisiplinan',
        'Menginput catatan konseling rahasia (hanya bisa dilihat oleh sesama Guru BK dan Waka Kesiswaan)',
        'Memanggil siswa melalui sistem (penerbitan surat panggilan orang tua / SP 1, 2, 3)',
        'Melihat rekam jejak perilaku siswa secara personal untuk analisis pembinaan mendalam'
      ],
      boundaries: 'Catatan konseling rahasia dilindungi enkripsi hak akses; tertutup total dari akses Pembina Ekskul maupun Siswa Pengurus OSIM.',
      sampleUser: bkUser,
      testUid: bkUser?.uid
    },
    {
      id: 'pembina_osim',
      roleKey: 'pembina_osim' as RoleKey,
      role: 'pembina_osim' as UserRole,
      title: '4. Pembina OSIM',
      subtitle: 'Verifikator Intra OSIM',
      badge: 'PEMBINA INTRA (OSIM)',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: Award,
      iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      mission: 'Bertindak sebagai verifikator, pembimbing, dan pengawas organisasi intra kesiswaan (OSIM & Sekbid).',
      privileges: [
        'Menyetujui, merevisi, atau mengesahkan program kerja, draf proposal, dan LPJ kegiatan OSIM',
        'Mengelola SK kepengurusan, struktur kabinet OSIM, dan pengurus per seksi bidang (Sekbid)',
        'Mengawasi arus kas besar OSIM dan realisasi anggaran kegiatan kesiswaan intra madrasah',
        'Memvalidasi absensi rapat dan kegiatan intra yang dilaporkan oleh BPH dan Sekbid OSIM'
      ],
      boundaries: 'Fokus pembinaan terarah pada organisasi intra kesiswaan (OSIM); tidak mengelola penilaian rapor ekstrakurikuler cabang olahraga/seni, dan tertutup dari catatan konseling rahasia BK.',
      sampleUser: pembinaOsimUser,
      testUid: pembinaOsimUser?.uid
    },
    {
      id: 'pembina_ekskul',
      roleKey: 'pembina_ekskul' as RoleKey,
      role: 'pembina_ekskul' as UserRole,
      title: '5. Pembina Ekskul',
      subtitle: 'Pelatih & Pembina Ekstra',
      badge: 'PEMBINA EKSTRAKURIKULER',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      icon: Compass,
      iconColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      mission: 'Membina bakat minat, menyelenggarakan latihan rutin, presensi anggota, dan menginput penilaian rapor ekskul siswa binaan.',
      privileges: [
        'Menginput dan menerbitkan nilai rapor ekstrakurikuler siswa binaan pada akhir semester',
        'Mencatat piagam penghargaan, piala kejuaraan prestasi, dan rekor siswa binaannya',
        'Menginput presensi digital kehadiran siswa dalam agenda latihan rutin ekstrakurikuler',
        'Mengajukan proposal pendanaan kejuaraan/lomba ekskul serta pengajuan dispensasi siswa bertanding'
      ],
      boundaries: 'Wewenang terbatas pada cabang ekstrakurikuler binaannya sendiri; tertutup dari struktur kabinet OSIM, kas besar OSIM, dan catatan bimbingan konseling rahasia BK.',
      sampleUser: pembinaEkskulUser,
      testUid: pembinaEkskulUser?.uid
    },
    {
      id: 'osim_bph',
      roleKey: 'bph' as RoleKey,
      role: 'pengurus_osim' as UserRole,
      title: '6. Anggota OSIM - BPH',
      subtitle: 'Badan Pengurus Harian (Ketua, Wakil, Sekr, Bend)',
      badge: 'MANAJER OPERASIONAL',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: Users,
      iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      mission: 'Ketua, Wakil, Sekretaris, dan Bendahara OSIM. Mereka adalah manajer operasional organisasi.',
      privileges: [
        'Membuat dan mengajukan proposal kegiatan serta LPJ langsung ke Pembina OSIM',
        'Mengelola timeline kalender kegiatan OSIM seluruh sekolah',
        'Mengajukan dan mencatat anggaran kas besar OSIM (Bendahara OSIM)',
        'Melihat laporan performa kegiatan dan evaluasi dari masing-masing Sekbid'
      ],
      boundaries: 'Wewenang koordinasi operasional seluruh Sekbid; tertutup total dari data nilai rapor, pelanggaran, atau catatan BK.',
      sampleUser: osimBphUser,
      testUid: osimBphUser?.uid
    },
    {
      id: 'osim_sekbid',
      roleKey: 'sekbid' as RoleKey,
      role: 'pengurus_osim' as UserRole,
      title: '7. Anggota OSIM - Masing-Masing Sekbid',
      subtitle: 'Seksi Bidang 1 s.d. 8 Pelaksana Program',
      badge: 'PELAKSANA PROGRAM SPESIFIK',
      badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
      icon: Sparkles,
      iconColor: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      mission: 'Ujung tombak pelaksana program kerja spesifik (contoh: Sekbid Keagamaan, Sekbid Olahraga, dll).',
      privileges: [
        'Menginput draf proposal kegiatan khusus untuk bidang mereka sendiri (tidak bisa melihat draf sekbid lain)',
        'Menginput absensi peserta atau panitia dalam acara yang mereka pelopori',
        'Mengunggah dokumentasi dan laporan keuangan mini setelah acara sekbid selesai'
      ],
      boundaries: 'Catatan Penting: Akses mereka tertutup total dari data nilai, pelanggaran, atau catatan BK siswa lain.',
      sampleUser: osimSekbidUser,
      testUid: osimSekbidUser?.uid
    }
  ];

  // Filtered Matrix Data
  const filteredMatrix = useMemo(() => {
    return matrixData.filter(item => {
      const matchQuery =
        filterQuery.trim() === '' ||
        item.module.toLowerCase().includes(filterQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(filterQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(filterQuery.toLowerCase());

      const matchCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      return matchQuery && matchCategory;
    });
  }, [matrixData, filterQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Save Success Toast */}
      {saveSuccessToast && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessToast}</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono">Tersimpan di Sistem</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#151518] border border-[#27272a] rounded-xl p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-zinc-100">
                Matriks Hak Akses Berbasis Peran (RBAC Kesiswaan)
              </h2>
            </div>
            <p className="text-xs text-zinc-300 max-w-3xl">
              Super Admin dapat memberikan atau mencabut hak akses input dan kelola data untuk masing-masing peran melalui kotak centang interaktif sesuai kebutuhan dan kondisi sekolah.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {isSuperAdmin ? (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>Mode Konfigurasi Super Admin Aktif</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>Mode Pratinjau (Hanya Super Admin Bisa Edit)</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 7 Role Cards Overview with Live Input Permissions Counters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
              Profil 7 Peran & Ringkasan Hak Akses Input Aktif
            </h3>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">
            Klik tab untuk filter atau uji coba antarmuka
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roleDefinitions.map(def => {
            const Icon = def.icon;
            const stats = roleStats[def.roleKey];
            const isSelected = activeRoleView === def.id;

            return (
              <div
                key={def.id}
                className={`bg-[#151518] border rounded-xl p-4 flex flex-col justify-between transition-all ${
                  isSelected ? 'border-emerald-500 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-950/20' : 'border-[#27272a] hover:border-[#3a3a44]'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Top */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-2 rounded-lg border ${def.iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-100">{def.title}</h4>
                        <p className="text-[10px] text-zinc-400">{def.subtitle}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${def.badgeColor}`}>
                      {def.badge}
                    </span>
                  </div>

                  {/* Input Permission Counter Pill */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#1a1a20] border border-[#27272f]">
                    <span className="text-[11px] text-zinc-300 flex items-center space-x-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Hak Akses Input:</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {stats?.inputCount || 0} <span className="text-zinc-500 text-[10px]">/ {stats?.total || 0} Modul</span>
                    </span>
                  </div>

                  {/* Mission */}
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    {def.mission}
                  </p>

                  {/* Boundaries Callout */}
                  <div className="p-2 rounded bg-amber-950/15 border border-amber-800/30 text-[10px] text-amber-300/90 leading-relaxed flex items-start space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{def.boundaries}</span>
                  </div>
                </div>

                {/* Simulation Action */}
                <div className="pt-3 mt-3 border-t border-[#222226]">
                  <button
                    onClick={() => onSimulateRole(def.role, def.testUid)}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-[#1e1e24] hover:bg-emerald-600 hover:text-white text-zinc-300 text-[11px] font-mono font-bold transition-colors flex items-center justify-center space-x-1.5 border border-[#2d2d36] hover:border-emerald-500"
                  >
                    <LogIn className="w-3 h-3" />
                    <span>Uji Antarmuka Akun Ini</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Save Action Bar when changes exist */}
      {hasUnsavedChanges && (
        <div className="sticky top-4 z-20 bg-emerald-950/90 border-2 border-emerald-500/70 backdrop-blur-md rounded-xl p-4 shadow-2xl shadow-emerald-950/50 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center space-x-2.5 text-emerald-200">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Terdapat penyesuaian kotak centang hak akses yang belum disimpan!
              </p>
              <p className="text-[11px] text-emerald-300/90">
                Klik tombol "Simpan Pengaturan Hak Akses" agar perubahan aktif dan diterapkan ke seluruh sistem.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setMatrixData(DEFAULT_RBAC_MATRIX);
                setHasUnsavedChanges(false);
              }}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
            >
              Batalkan
            </button>
            <button
              onClick={handleSaveMatrix}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Hak Akses'}</span>
            </button>
          </div>
        </div>
      )}

      {/* INTERACTIVE CHECKBOX MATRIX TABLE */}
      <div className="bg-[#151518] border border-[#27272a] rounded-xl p-5 shadow space-y-4">
        {/* Table Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#222226]">
          <div>
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                Matriks Kotak Centang (Checkbox) Hak Akses Modul Kesiswaan
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Centang kotak pada peran yang diinginkan untuk memberikan hak akses input dan kelola data sesuai kebijakan madrasah Anda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-[#1c1c22] p-1 rounded-lg border border-[#2a2a32] text-xs">
              <button
                onClick={() => setMatrixViewMode('input_focus')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center space-x-1.5 ${
                  matrixViewMode === 'input_focus'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span>Kotak Centang Input</span>
              </button>
              <button
                onClick={() => setMatrixViewMode('dual_checkbox')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center space-x-1.5 ${
                  matrixViewMode === 'dual_checkbox'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <CheckSquare className="w-3 h-3" />
                <span>Kotak Centang Ganda (Input + Lihat)</span>
              </button>
            </div>

            {/* Reset to Default Button */}
            {isSuperAdmin && (
              <button
                onClick={handleResetToDefault}
                disabled={isResetting || isSaving}
                className={`px-2.5 py-1.5 rounded-lg bg-[#202026] hover:bg-[#282832] border border-[#2f2f38] text-zinc-300 hover:text-white text-xs font-semibold transition-colors flex items-center space-x-1 ${
                  isResetting ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                title="Kembalikan semua centang ke standar rekomendasi RBAC"
              >
                {isResetting ? (
                  <RefreshCw className="w-3 h-3 text-zinc-400 animate-spin" />
                ) : (
                  <RotateCcw className="w-3 h-3 text-zinc-400" />
                )}
                <span>{isResetting ? 'Mereset...' : 'Reset Default'}</span>
              </button>
            )}

            {/* Save Button */}
            {isSuperAdmin && (
              <button
                onClick={handleSaveMatrix}
                disabled={isSaving || isResetting}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  isSaving ? 'opacity-70 cursor-not-allowed' : ''
                } ${
                  hasUnsavedChanges
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-500/20'
                    : 'bg-[#222228] hover:bg-[#2a2a32] text-zinc-300 border border-[#30303a]'
                }`}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3" />
                    <span>{hasUnsavedChanges ? 'Simpan Perubahan' : 'Tersimpan'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[11px] text-zinc-500 font-mono mr-1">Kategori:</span>
            {['all', 'Hak CRUD Terpusat (Di Luar cPanel)', 'Manajemen & Sistem', 'Kedisiplinan & BK', 'Organisasi & Kegiatan', 'Keuangan & Pelaporan'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-zinc-200 text-zinc-900 font-bold'
                    : 'bg-[#1c1c22] text-zinc-400 hover:text-zinc-200 border border-[#27272f]'
                }`}
              >
                {cat === 'all' ? 'Semua Modul' : cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Cari modul kesiswaan..."
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#1a1a1f] border border-[#2a2a30] rounded-lg text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                className="absolute right-2.5 top-2 text-zinc-500 hover:text-zinc-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Table Container with Horizontal Scroll */}
        <div className="overflow-x-auto rounded-lg border border-[#27272a]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#27272a] bg-[#1a1a1f] text-zinc-200 text-[10px] font-mono font-bold uppercase">
                <th className="py-3 px-3 min-w-[230px] bg-[#1a1a1f] sticky left-0 z-10">
                  Modul / Fitur Kesiswaan
                </th>
                {ROLE_COLUMNS.map(col => {
                  const stats = roleStats[col.key];
                  return (
                    <th key={col.key} className={`py-2.5 px-2 text-center min-w-[130px] ${col.color}`}>
                      <div className="flex flex-col items-center space-y-1">
                        <span className="font-bold">{col.label}</span>
                        <span className="text-[9px] text-zinc-400 font-normal">{col.subLabel}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#131317] border border-[#2a2a34] text-emerald-400">
                          {stats?.inputCount}/{stats?.total} Input
                        </span>

                        {/* Batch Action Buttons */}
                        {isSuperAdmin && (
                          <div className="flex items-center space-x-1 pt-1">
                            <button
                              onClick={() => handleBatchToggleRole(col.key, true)}
                              title={`Beri izin input semua modul untuk ${col.label}`}
                              className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-800/60 transition-colors"
                            >
                              Semua
                            </button>
                            <button
                              onClick={() => handleBatchToggleRole(col.key, false)}
                              title={`Kosongkan izin input untuk ${col.label}`}
                              className="px-1.5 py-0.5 rounded text-[8px] bg-zinc-900 text-zinc-400 border border-zinc-700 hover:bg-zinc-800 transition-colors"
                            >
                              Hapus
                            </button>
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222226] text-[11px]">
              {filteredMatrix.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500">
                    Tidak ditemukan modul yang sesuai dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredMatrix.map((row) => (
                  <tr key={row.id} className="hover:bg-[#1a1a20] transition-colors">
                    {/* Module Column */}
                    <td className="py-3 px-3 bg-[#151518] sticky left-0 z-10 border-r border-[#222226]">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-zinc-100">{row.module}</span>
                          {row.isCriticalSecurity && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[9px] font-mono font-bold shrink-0">
                              Root IT
                            </span>
                          )}
                          {row.isConfidential && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[9px] font-mono font-bold shrink-0">
                              Rahasia BK
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400">{row.desc}</p>
                        <span className="inline-block text-[9px] font-mono text-zinc-500 bg-[#1e1e24] px-1.5 py-0.5 rounded">
                          {row.category}
                        </span>
                      </div>
                    </td>

                    {/* 7 Role Checkbox Columns */}
                    {ROLE_COLUMNS.map(col => {
                      const perm = row.permissions[col.key];
                      const canInput = perm?.canInput ?? false;
                      const canView = perm?.canView ?? false;
                      const isPasswordResetRestricted = row.id === 'crud_password_reset' && (col.key === 'pembina_ekskul' || col.key === 'bk' || col.key === 'bph' || col.key === 'sekbid');
                      const inputDisabled = !isSuperAdmin || isPasswordResetRestricted;
                      const viewDisabled = !isSuperAdmin || isPasswordResetRestricted;

                      return (
                        <td key={`${row.id}-${col.key}`} className="py-2.5 px-2 text-center align-middle">
                          <div className="flex flex-col items-center justify-center space-y-1">
                            {/* Kotak Centang Utama: Hak Akses Input */}
                            <label
                              className={`group inline-flex items-center space-x-1.5 px-2 py-1.5 rounded-lg border transition-all select-none ${
                                !inputDisabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                              } ${
                                canInput
                                  ? 'bg-emerald-950/30 border-emerald-500/50 hover:border-emerald-400 text-emerald-300'
                                  : 'bg-[#18181c] border-[#292932] hover:border-[#383844] text-zinc-400'
                              }`}
                              title={
                                isPasswordResetRestricted
                                  ? 'Dibatasi Kebijakan Sistem: Peran ini tidak dapat diberikan wewenang delegasi reset kata sandi'
                                  : isSuperAdmin
                                    ? `Klik untuk ${canInput ? 'mencabut' : 'memberikan'} hak akses input bagi ${col.label}`
                                    : 'Hanya Super Admin yang dapat mengubah hak akses'
                              }
                            >
                              <input
                                type="checkbox"
                                checked={canInput}
                                disabled={inputDisabled}
                                onChange={() => handleToggleInput(row.id, col.key)}
                                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 transition-colors accent-emerald-500 cursor-pointer disabled:cursor-not-allowed"
                              />
                              <span className={`text-[10px] font-mono font-bold ${canInput ? 'text-emerald-300' : 'text-zinc-400'}`}>
                                {canInput ? 'Input Aktif' : isPasswordResetRestricted ? 'Dibatasi' : 'Terkunci (403)'}
                              </span>
                            </label>

                            {/* Kotak Centang Tambahan saat Mode Ganda Aktif */}
                            {matrixViewMode === 'dual_checkbox' && (
                              <label
                                className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-mono transition-all select-none ${
                                  !viewDisabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                                } ${
                                  canView
                                    ? 'text-sky-300 bg-sky-950/25 border border-sky-800/40'
                                    : 'text-zinc-500 bg-zinc-900 border border-zinc-800'
                                }`}
                                title={
                                  isPasswordResetRestricted
                                    ? 'Dibatasi Kebijakan Sistem: Modul ini tidak dibuka untuk peran ini'
                                    : isSuperAdmin
                                      ? `Klik untuk ${canView ? 'mencabut' : 'memberikan'} hak akses melihat data bagi ${col.label}`
                                      : 'Hanya Super Admin yang dapat mengubah hak akses'
                                }
                              >
                                <input
                                  type="checkbox"
                                  checked={canView}
                                  disabled={viewDisabled}
                                  onChange={() => handleToggleView(row.id, col.key)}
                                  className="w-3 h-3 rounded border-zinc-700 bg-zinc-900 text-sky-500 accent-sky-500 cursor-pointer disabled:cursor-not-allowed"
                                />
                                <span>{canView ? 'Bisa Lihat' : 'Tutup'}</span>
                              </label>
                            )}

                            {/* Contextual Note */}
                            {perm?.note && (
                              <span className="text-[9px] text-zinc-500 font-mono block max-w-[120px] truncate" title={perm.note}>
                                {perm.note}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Legend / Petunjuk Penggunaan */}
        <div className="pt-2 border-t border-[#222226] flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-400">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center space-x-1.5">
              <span className="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 text-[10px] font-bold">✓</span>
              <span><strong>Input Aktif</strong>: Peran dapat menambah, mengedit, dan mengelola modul ini.</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-3.5 h-3.5 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-500 text-[10px]">✕</span>
              <span><strong>Terkunci (403)</strong>: Akses ditolak demi keamanan & privasi siswa.</span>
            </span>
          </div>

          <span className="text-[10px] font-mono text-zinc-500">
            Kerahasiaan data bimbingan konseling dan privasi santri tetap diprioritaskan
          </span>
        </div>
      </div>

      {/* Security & Privacy Boundaries Card */}
      <div className="bg-gradient-to-r from-purple-950/20 via-zinc-900 to-emerald-950/20 border border-[#2e2e38] rounded-xl p-5 space-y-3">
        <div className="flex items-center space-x-2.5">
          <Shield className="w-5 h-5 text-indigo-400" />
          <h4 className="text-sm font-bold text-zinc-100">
            Tiga Batasan Keamanan & Privasi Data Kesiswaan (Guaranteed Isolation)
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-lg bg-[#141418] border border-purple-800/30 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-purple-300 font-bold text-xs">
              <Lock className="w-4 h-4 text-purple-400" />
              <span>1. Kerahasiaan Rekam Konseling</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Catatan sesi bimbingan psikologis siswa yang berstatus <em>Rahasia</em> hanya dapat dibuka oleh Guru BK dan Waka Kesiswaan. Pembina maupun Pengurus OSIM tidak dapat melihat isinya.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#141418] border border-rose-800/30 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-rose-300 font-bold text-xs">
              <Shield className="w-4 h-4 text-rose-400" />
              <span>2. Perisai Privasi Siswa dari OSIM</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Seluruh akun pengurus OSIM (baik BPH maupun Sekbid) tertutup total dari akses ke database nilai rapor, poin pelanggaran, atau catatan BK siswa lain demi privasi santri/siswa.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#141418] border border-teal-800/30 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-teal-300 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>3. Partisi Draf Mandiri Sekbid</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Pengurus Sekbid hanya dapat menyusun dan melihat draf kegiatan milik Sekbid-nya sendiri. Draf usulan bidang lain disembunyikan sampai kegiatan disahkan oleh Pembina OSIM.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

