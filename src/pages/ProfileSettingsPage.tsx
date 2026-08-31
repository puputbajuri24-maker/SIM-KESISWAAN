import React, { useState, useRef, useEffect } from 'react';
import {
  UserCheck,
  Camera,
  Upload,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Phone,
  CreditCard,
  User,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Info,
  Building,
  Crown,
  HeartHandshake,
  Compass,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSchool } from '../contexts/SchoolContext';
import { TimezoneSettingsCard } from '../components/common/TimezoneSettingsCard';
import { UserRole } from '../types';

export const ProfileSettingsPage: React.FC = () => {
  const { currentUser, updateUser } = useAuth();
  const { syncUserFromCPanel, logAction, extracurriculars } = useSchool();

  // Form state strictly covering the required 4 items:
  // 1. Nama Lengkap
  // 2. Nomor WhatsApp
  // 3. NIP / NUPTK
  // 4. Foto Profil (JPG, JPEG, PNG <= 500 KB)
  const [displayName, setDisplayName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [nip, setNip] = useState<string>('');
  const [photoURL, setPhotoURL] = useState<string>('');

  // Upload & validation feedback state
  const [photoFileName, setPhotoFileName] = useState<string>('');
  const [photoFileSizeKb, setPhotoFileSizeKb] = useState<number | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with current logged in user data
  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setPhone(currentUser.phone || '');
      setNip(currentUser.nip || '');
      setPhotoURL(currentUser.photoURL || (currentUser as any).photoUrl || '');
      setFileError(null);
    }
  }, [currentUser]);

  const getRoleBadgeInfo = (role?: UserRole) => {
    switch (role) {
      case 'pembina_osim':
        return {
          label: 'PEMBINA OSIM & INTRAKURIKULER',
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: Crown,
          desc: 'Pengampu Proker dan Organisasi Siswa Intra Madrasah (OSIM)'
        };
      case 'pembina_ekskul':
      case 'pembina':
        return {
          label: 'PEMBINA EKSTRAKURIKULER',
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: Compass,
          desc: 'Pengampu dan Pelatih Unit Ekstrakurikuler Madrasah'
        };
      case 'guru_bk':
        return {
          label: 'GURU BIMBINGAN KONSELING (BK)',
          color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          icon: HeartHandshake,
          desc: 'Layanan Konseling, Disiplin Siswa, dan Pengembangan Karir'
        };
      case 'waka_kesiswaan':
        return {
          label: 'WAKA KESISWAAN',
          color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          icon: Building,
          desc: 'Pimpinan & Koordinator Bidang Kesiswaan Madrasah'
        };
      case 'super_admin':
        return {
          label: 'SUPER ADMINISTRATOR / PROKTOR',
          color: 'bg-red-500/10 text-red-400 border-red-500/30',
          icon: ShieldCheck,
          desc: 'Akses Root Pengaturan Sistem & Manajemen Master Database'
        };
      default:
        return {
          label: 'GURU & PEMBINA MADRASAH',
          color: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/30',
          icon: User,
          desc: 'Akun Terdaftar SIM Kesiswaan'
        };
    }
  };

  const badgeInfo = getRoleBadgeInfo(currentUser?.role);
  const RoleIcon = badgeInfo.icon;

  // File validation and conversion (Strictly JPG, JPEG, PNG and Max 500 KB)
  const MAX_FILE_SIZE_BYTES = 500 * 1024; // 500 KB = 512,000 bytes

  const processFile = (file: File) => {
    setFileError(null);
    setSaveSuccessMsg(null);

    // 1. Validate File Type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    const isValidExt = extension === 'jpg' || extension === 'jpeg' || extension === 'png';

    if (!validTypes.includes(file.type) && !isValidExt) {
      setFileError('Format file tidak didukung. Harap pilih foto berformat JPG, JPEG, atau PNG.');
      return;
    }

    // 2. Validate File Size (Max 500 KB)
    const fileSizeKb = Math.round(file.size / 1024);
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`Ukuran file (${fileSizeKb} KB) melebihi batas maksimal 500 KB. Silakan kompres atau pilih foto yang lebih kecil.`);
      return;
    }

    // 3. Read and convert to Data URL (Base64) for real-time persistent synchronization
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setPhotoURL(result);
        setPhotoFileName(file.name);
        setPhotoFileSizeKb(fileSizeKb);
      }
    };
    reader.onerror = () => {
      setFileError('Terjadi kesalahan saat memproses file foto. Silakan coba lagi.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemovePhoto = () => {
    setPhotoURL('');
    setPhotoFileName('');
    setPhotoFileSizeKb(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!displayName.trim()) {
      setFileError('Nama lengkap wajib diisi.');
      return;
    }

    setIsSaving(true);
    setSaveSuccessMsg(null);
    setFileError(null);

    try {
      const oldUser = { ...currentUser };
      const updatedData = {
        displayName: displayName.trim(),
        phone: phone.trim(),
        nip: nip.trim(),
        photoURL: photoURL || undefined
      };

      // 1. Update user profile in AuthContext (persisted to localStorage & Firebase Auth / users collection)
      const res = await updateUser(currentUser.uid, updatedData);

      if (!res.success) {
        throw new Error(res.error || 'Gagal memperbarui profil di sistem otentikasi.');
      }

      // 2. Automatically sync changes to Super Admin & all dependent modules:
      // - Dewan Guru (Teachers table & directory)
      // - Ekstrakurikuler coach names
      // - Counseling counselor names
      // - School Master audit log
      const updatedFullProfile = {
        ...currentUser,
        ...updatedData
      };

      await syncUserFromCPanel(updatedFullProfile, oldUser);

      await logAction(
        'UPDATE_USER_PROFILE',
        'Pengaturan Profil',
        `${currentUser.displayName} (${badgeInfo.label}) memperbarui profil: Nama="${displayName}", WA="${phone}", NIP="${nip}", Foto=${photoURL ? 'Diperbarui' : 'Dikosongkan'}`
      );

      setSaveSuccessMsg('Profil Anda berhasil diperbarui! Perubahan nama, nomor WhatsApp, NIP/NUPTK, dan foto profil telah otomatis tersinkronisasi ke Administrator Super.');
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSaveSuccessMsg(null);
      }, 5000);
    } catch (err: any) {
      setFileError(err?.message || 'Terjadi kesalahan saat menyimpan perubahan profil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header & Synchronization Notice */}
      <div className="bg-[#151518] border border-[#27272a] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 via-blue-500/20 to-indigo-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <RoleIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Pengaturan Profil Pengguna
                </h1>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-xs text-zinc-200 mt-0.5">
                Kelola identitas diri Anda. Perubahan akan otomatis terhubung & tersinkronisasi ke akun Administrator Super dan data master madrasah.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-1 shrink-0">
            <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border ${badgeInfo.color}`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{badgeInfo.label}</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-300">
              UID: {currentUser?.uid || '-'}
            </span>
          </div>
        </div>

        {/* Real-time Sync Telemetry Banner */}
        <div className="mt-4 pt-3 border-t border-[#222226] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>SINKRONISASI OTOMATIS AKTIF (SUPER ADMIN SYNC: CONNECTED)</span>
          </div>
          <span className="text-zinc-300 text-[10px] font-medium">
            Format Foto: JPG, JPEG, PNG (Maksimal 500 KB)
          </span>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 text-xs flex items-start space-x-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-white">Perubahan Profil Berhasil Disimpan</p>
            <p className="mt-0.5 text-emerald-200 leading-relaxed">{saveSuccessMsg}</p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {fileError && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-200 text-xs flex items-start space-x-3 shadow-lg animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-white">Perhatian</p>
            <p className="mt-0.5 text-red-200">{fileError}</p>
          </div>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Photo Upload Section (JPG, JPEG, PNG <= 500 KB) */}
          <div className="md:col-span-5 bg-[#151518] border border-[#27272a] rounded-xl p-5 space-y-4 flex flex-col items-center text-center">
            <div className="w-full flex items-center justify-between pb-3 border-b border-[#27272a]">
              <span className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center space-x-1.5 font-mono">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Foto Profil</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-600 font-semibold">
                MAKS. 500 KB
              </span>
            </div>

            {/* Avatar Preview */}
            <div className="relative group my-2">
              <div className="w-36 h-36 rounded-2xl bg-[#1c1c20] border-2 border-[#323238] overflow-hidden flex items-center justify-center shadow-xl relative transition-all">
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt={displayName || 'Foto Profil'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-3 text-zinc-400">
                    <User className="w-16 h-16 text-zinc-400 mb-1" />
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Belum Ada Foto</span>
                  </div>
                )}
              </div>

              {/* Quick action overlay if photo exists */}
              {photoURL && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg transition-transform hover:scale-110"
                  title="Hapus foto saat ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-xs ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300'
                  : 'border-[#37373f] hover:border-emerald-500/50 bg-[#19191d] text-zinc-300 hover:text-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="w-5 h-5 text-emerald-400 mb-1.5" />
              <span className="font-semibold text-zinc-100">
                Pilih atau Tarik Foto ke Sini
              </span>
              <span className="text-[11px] text-zinc-300 mt-1">
                Format: <strong className="text-zinc-100">JPG, JPEG, PNG</strong>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono mt-0.5 font-bold">
                Batas Ukuran: Maksimal 500 KB
              </span>
            </div>

            {/* File info badge if uploaded */}
            {photoFileSizeKb && (
              <div className="w-full bg-[#1c1c20] p-2.5 rounded-lg border border-[#2e2e34] text-[11px] font-mono flex items-center justify-between text-zinc-200">
                <span className="truncate max-w-[170px]" title={photoFileName}>
                  {photoFileName || 'Foto Profil Terpilih'}
                </span>
                <span className={`font-bold ${photoFileSizeKb > 500 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {photoFileSizeKb} KB
                </span>
              </div>
            )}

            <p className="text-[11px] text-zinc-300 text-left leading-relaxed">
              Foto akan ditampilkan pada Header, Dewan Guru, cPanel Master Super Admin, dan Kartu Tanda Anggota/Pembina.
            </p>
          </div>

          {/* Right Column: Required Profile Fields (Nama, WhatsApp, NIP/NUPTK) */}
          <div className="md:col-span-7 bg-[#151518] border border-[#27272a] rounded-xl p-5 space-y-5">
            <div className="pb-3 border-b border-[#27272a] flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center space-x-1.5 font-mono">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Identitas & Informasi Kontak</span>
                </h2>
                <p className="text-[11px] text-zinc-300 mt-0.5">
                  Pengaturan ini meliputi Nama, Nomor WhatsApp, dan NIP/NUPTK.
                </p>
              </div>
            </div>

            {/* Field 1: Nama Lengkap & Gelar */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-100 flex items-center justify-between">
                <span>Nama Lengkap & Gelar *</span>
                <span className="text-[10px] font-medium text-emerald-400 font-mono">Wajib Diisi</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Contoh: Dra. Hj. Siti Marwiyah, M.Pd."
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#1c1c20] border border-[#323238] text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium transition-colors"
                />
              </div>
              <p className="text-[11px] text-zinc-300">
                Nama ini akan muncul pada seluruh laporan kegiatan, lembar presensi, SK pembina, dan catatan konseling.
              </p>
            </div>

            {/* Field 2: Nomor WhatsApp */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-100 flex items-center justify-between">
                <span>Nomor WhatsApp Aktif *</span>
                <span className="text-[10px] font-medium text-zinc-300 font-mono">Untuk Komunikasi & Notifikasi</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 081234567890 atau 6281234567890"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#1c1c20] border border-[#323238] text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono transition-colors"
                />
              </div>
              <p className="text-[11px] text-zinc-300">
                Nomor WhatsApp digunakan untuk koordinasi kegiatan kesiswaan, panggilan orang tua siswa, dan kontak darurat.
              </p>
            </div>

            {/* Field 3: NIP / NUPTK */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-100 flex items-center justify-between">
                <span>NIP / NUPTK / NIK *</span>
                <span className="text-[10px] font-medium text-zinc-300 font-mono">Identitas Resmi Guru/Pembina</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="Contoh: 19800101 200501 1 001 atau NUPTK"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#1c1c20] border border-[#323238] text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono transition-colors"
                />
              </div>
              <p className="text-[11px] text-zinc-300">
                NIP/NUPTK dapat digunakan sebagai identifier kredensial untuk masuk (login) ke aplikasi SIM Kesiswaan.
              </p>
            </div>

            {/* Additional Context Info (Read-only metadata) */}
            <div className="pt-3 border-t border-[#222226] space-y-2">
              <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                INFORMASI SISTEM & TUGAS BINAAN
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="bg-[#1c1c20] p-2 rounded-lg border border-[#27272a]">
                  <span className="text-zinc-400 block text-[9px] font-bold">EMAIL RESMI:</span>
                  <span className="text-zinc-100 font-medium truncate block mt-0.5" title={currentUser?.email}>
                    {currentUser?.email || '-'}
                  </span>
                </div>
                <div className="bg-[#1c1c20] p-2 rounded-lg border border-[#27272a]">
                  <span className="text-zinc-400 block text-[9px] font-bold">STATUS AKUN:</span>
                  <span className="text-emerald-400 font-bold flex items-center space-x-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{currentUser?.status || 'Aktif'}</span>
                  </span>
                </div>
              </div>

              {currentUser?.extracurricularIds && currentUser.extracurricularIds.length > 0 && (
                <div className="bg-[#1c1c20] p-2.5 rounded-lg border border-[#27272a] text-[11px]">
                  <span className="text-emerald-400 font-mono text-[10px] font-bold block mb-1">
                    EKSTRAKURIKULER YANG DIAMPU:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentUser.extracurricularIds.map(eid => {
                      const ek = extracurriculars.find(e => e.id === eid);
                      return (
                        <span key={eid} className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium">
                          {ek ? ek.name : eid}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Action Button */}
            <div className="pt-4 flex items-center justify-end space-x-3 border-t border-[#27272a]">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyinkronkan Perubahan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan & Sinkronkan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Timezone & Clock Preferences Card */}
      <TimezoneSettingsCard />
    </div>
  );
};
