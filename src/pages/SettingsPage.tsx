import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Calendar,
  Database,
  ShieldCheck,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Save,
  UserCheck,
  School,
  Image as ImageIcon,
  Globe,
  Phone,
  Mail,
  Printer,
  FileText
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, SchoolSetting } from '../types';
import { LogoUploader } from '../components/common/LogoUploader';
import { SchoolLetterhead } from '../components/common/SchoolLetterhead';

// Preset logos for quick Indonesian official letterhead setup
const LEFT_LOGO_PRESETS = [
  {
    name: 'Kemenag RI (Ikhlas Beramal)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Logo_Kementerian_Agama.png/480px-Logo_Kementerian_Agama.png'
  },
  {
    name: 'Kemendikbud (Tut Wuri Handayani)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg/200px-Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg.png'
  },
  {
    name: 'Garuda Pancasila',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Coat_of_arms_of_Indonesia.svg/200px-Coat_of_arms_of_Indonesia.svg.png'
  },
  {
    name: 'Pemerintah Daerah (Pemprov DKI)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Coat_of_arms_of_Jakarta.svg/200px-Coat_of_arms_of_Jakarta.svg.png'
  }
];

const RIGHT_LOGO_PRESETS = [
  {
    name: 'Logo Sekolah Biru',
    url: 'https://images.unsplash.com/photo-1594608661623-aa0bd3a69d98?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Logo Madrasah Hijau',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Logo_Kementerian_Agama.png/240px-Logo_Kementerian_Agama.png'
  },
  {
    name: 'Logo OSIS / OSIM Nasional',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Logo_OSIS.svg/200px-Logo_OSIS.svg.png'
  },
  {
    name: 'Gerakan Pramuka Indonesia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Gerakan_Pramuka_Indonesia_Logo.png/200px-Gerakan_Pramuka_Indonesia_Logo.png'
  }
];

export const SettingsPage: React.FC = () => {
  const { currentUser, switchRole, userRole } = useAuth();
  const {
    schoolInfo,
    updateSchoolInfo,
    activeAcademicYear,
    activeSemester,
    setActiveAcademicYear,
    seedFirebaseDatabase,
    students,
    extracurriculars,
    schedules,
    violations,
    achievements,
    attendance,
    activityReports
  } = useSchool();

  const [formData, setFormData] = useState<SchoolSetting>({
    id: schoolInfo?.id || 'main_school',
    name: schoolInfo?.name || '',
    centralInstitution: schoolInfo?.centralInstitution || '',
    regionalInstitution: schoolInfo?.regionalInstitution || '',
    npsn: schoolInfo?.npsn || '',
    address: schoolInfo?.address || '',
    postalCode: schoolInfo?.postalCode || '',
    principalName: schoolInfo?.principalName || '',
    principalNip: schoolInfo?.principalNip || '',
    wakaName: schoolInfo?.wakaName || schoolInfo?.wakaKesiswaanName || '',
    wakaNip: schoolInfo?.wakaNip || '',
    wakaKesiswaanName: schoolInfo?.wakaKesiswaanName || schoolInfo?.wakaName || '',
    phone: schoolInfo?.phone || '',
    email: schoolInfo?.email || '',
    website: schoolInfo?.website || '',
    logoUrl: schoolInfo?.logoUrl || '',
    logoLeftUrl: schoolInfo?.logoLeftUrl || '',
    logoRightUrl: schoolInfo?.logoRightUrl || '',
    currentAcademicYear: schoolInfo?.currentAcademicYear || activeAcademicYear || '2026/2027',
    currentSemester: schoolInfo?.currentSemester || activeSemester || 'Ganjil'
  });

  const [selectedYear, setSelectedYear] = useState<string>(activeAcademicYear || '2026/2027');
  const [selectedSemester, setSelectedSemester] = useState<'Ganjil' | 'Genap'>(activeSemester || 'Ganjil');
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync form data when schoolInfo changes from Firestore or state
  useEffect(() => {
    if (schoolInfo) {
      setFormData({
        id: schoolInfo.id || 'main_school',
        name: schoolInfo.name || '',
        centralInstitution: schoolInfo.centralInstitution || '',
        regionalInstitution: schoolInfo.regionalInstitution || '',
        npsn: schoolInfo.npsn || '',
        address: schoolInfo.address || '',
        postalCode: schoolInfo.postalCode || '',
        principalName: schoolInfo.principalName || '',
        principalNip: schoolInfo.principalNip || '',
        wakaName: schoolInfo.wakaName || schoolInfo.wakaKesiswaanName || '',
        wakaNip: schoolInfo.wakaNip || '',
        wakaKesiswaanName: schoolInfo.wakaKesiswaanName || schoolInfo.wakaName || '',
        phone: schoolInfo.phone || '',
        email: schoolInfo.email || '',
        website: schoolInfo.website || '',
        logoUrl: schoolInfo.logoUrl || '',
        logoLeftUrl: schoolInfo.logoLeftUrl || '',
        logoRightUrl: schoolInfo.logoRightUrl || '',
        currentAcademicYear: schoolInfo.currentAcademicYear || activeAcademicYear || '2026/2027',
        currentSemester: schoolInfo.currentSemester || activeSemester || 'Ganjil'
      });
      if (schoolInfo.currentAcademicYear) {
        setSelectedYear(schoolInfo.currentAcademicYear);
      }
      if (schoolInfo.currentSemester) {
        setSelectedSemester(schoolInfo.currentSemester);
      }
    }
  }, [schoolInfo, activeAcademicYear, activeSemester]);

  const handleSaveSchoolInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const payload: SchoolSetting = {
        ...formData,
        id: formData.id || schoolInfo.id || 'main_school',
        name: formData.name.trim(),
        centralInstitution: formData.centralInstitution?.trim() || '',
        regionalInstitution: formData.regionalInstitution?.trim() || '',
        npsn: formData.npsn.trim(),
        address: formData.address.trim(),
        postalCode: formData.postalCode?.trim() || '',
        principalName: formData.principalName.trim(),
        principalNip: formData.principalNip?.trim() || '',
        wakaName: (formData.wakaKesiswaanName || formData.wakaName || '').trim(),
        wakaKesiswaanName: (formData.wakaKesiswaanName || formData.wakaName || '').trim(),
        wakaNip: formData.wakaNip?.trim() || '',
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        website: formData.website?.trim() || '',
        logoUrl: formData.logoRightUrl || formData.logoUrl || '',
        logoLeftUrl: formData.logoLeftUrl?.trim() || '',
        logoRightUrl: formData.logoRightUrl?.trim() || '',
        currentAcademicYear: selectedYear,
        currentSemester: selectedSemester
      };

      await updateSchoolInfo(payload);
      setActiveAcademicYear(selectedYear, selectedSemester);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      console.error('Gagal menyimpan profil sekolah:', err);
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem saat menyimpan profil sekolah.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeedDatabase = async () => {
    const confirmSeed = window.confirm(
      'Apakah Anda ingin mengisi database Firebase dengan data sampel lengkap (Siswa, Ekstrakurikuler, Jadwal, Prestasi, Pelanggaran, Presensi, dan Laporan)?'
    );
    if (!confirmSeed) return;

    setIsSeeding(true);
    setSeedSuccess(false);
    try {
      await seedFirebaseDatabase();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert('Gagal inisialisasi data: ' + err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleExportFullBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      schoolInfo,
      activeAcademicYear,
      data: {
        students,
        extracurriculars,
        schedules,
        violations,
        achievements,
        attendance,
        activityReports
      }
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SIM_KESISWAAN_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintTestKop = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pratinjau Kop Surat Resmi - ${formData.name || 'Sekolah'}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; padding: 30px; margin: 0; color: #111; }
            .header { display: flex; align-items: center; justify-content: space-between; gap: 15px; margin-bottom: 8px; }
            .logo { width: 80px; height: 80px; object-fit: contain; }
            .center-text { flex: 1; text-align: center; }
            .center-text h4 { font-size: 14px; margin: 0; text-transform: uppercase; font-weight: bold; }
            .center-text h5 { font-size: 13px; margin: 3px 0 0 0; text-transform: uppercase; font-weight: bold; }
            .center-text h2 { font-size: 18px; margin: 5px 0; text-transform: uppercase; font-weight: 900; }
            .center-text p { font-family: Arial, sans-serif; font-size: 11px; margin: 2px 0; color: #333; }
            .double-line { border-bottom: 3px solid #000; margin-bottom: 2px; }
            .single-line { border-bottom: 1px solid #000; margin-bottom: 25px; }
            .body-content { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.6; margin-top: 30px; }
            @media print { body { padding: 10px; } }
          </style>
        </head>
        <body>
          <div class="header">
            ${formData.logoLeftUrl ? `<img class="logo" src="${formData.logoLeftUrl}" alt="Logo Kiri" />` : '<div style="width:80px"></div>'}
            <div class="center-text">
              ${formData.centralInstitution ? `<h4>${formData.centralInstitution}</h4>` : ''}
              ${formData.regionalInstitution ? `<h5>${formData.regionalInstitution}</h5>` : ''}
              <h2>${formData.name || 'NAMA SEKOLAH / MADRASAH'}</h2>
              ${formData.address ? `<p>${formData.address}</p>` : ''}
            </div>
            ${formData.logoRightUrl ? `<img class="logo" src="${formData.logoRightUrl}" alt="Logo Kanan" />` : '<div style="width:80px"></div>'}
          </div>
          <div class="double-line"></div>
          <div class="single-line"></div>

          <div class="body-content">
            <h3 style="text-align: center; text-decoration: underline; text-transform: uppercase; margin-bottom: 5px;">
              SURAT PENGANTAR / KETERANGAN RESMI
            </h3>
            <p style="text-align: center; margin-top: 0; font-size: 11px; color: #555;">
              Nomor: 421.3 / 001 / SIM-KESISWAAN / ${new Date().getFullYear()}
            </p>
            <p style="margin-top: 25px;">
              Dokumen ini merupakan hasil cetak uji coba format Kop Surat Resmi Indonesia dengan Logo Kiri (Instansi Pusat / Pembina) dan Logo Kanan (Sekolah / Madrasah).
            </p>
            <div style="margin-top: 60px; display: flex; justify-content: space-between;">
              <div>
                <p>Mengetahui,</p>
                <p><strong>Kepala Sekolah</strong></p>
                <div style="height: 50px;"></div>
                <p><strong><u>${formData.principalName || 'Nama Kepala Sekolah'}</u></strong></p>
                <p style="font-size: 10px;">NIP. ${formData.principalNip || '-'}</p>
              </div>
              <div style="text-align: right;">
                <p>Diterbitkan pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p><strong>Waka Bidang Kesiswaan</strong></p>
                <div style="height: 50px;"></div>
                <p><strong><u>${formData.wakaKesiswaanName || formData.wakaName || 'Nama Waka Kesiswaan'}</u></strong></p>
                <p style="font-size: 10px;">NIP. ${formData.wakaNip || '-'}</p>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Pengaturan Sistem & Profil Lembaga Sekolah
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Kelola profil identitas instansi pusat, instansi kabupaten, logo kiri & kanan kop surat, tahun ajaran aktif, serta sinkronisasi database cloud.
        </p>
      </div>

      {/* 1. Simulasi Hak Akses Peran (RBAC Role Switcher) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Simulasi Peran Pengguna (Role-Based Access Control)
              </h3>
              <p className="text-xs text-slate-500">
                Uji coba aplikasi dari sudut pandang hak akses Waka, Admin Kesiswaan, Pembina Ekskul, atau Guru BK.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs rounded-full">
            Peran Aktif: {userRole.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {[
            {
              role: 'waka_kesiswaan' as UserRole,
              title: 'Waka Kesiswaan',
              desc: 'Akses penuh: verifikasi LPJ, dispensasi, tata tertib, hapus data.'
            },
            {
              role: 'admin_kesiswaan' as UserRole,
              title: 'Admin Kesiswaan',
              desc: 'Manajemen siswa, entri agenda kegiatan, input jadwal & data master.'
            },
            {
              role: 'pembina' as UserRole,
              title: 'Pembina Ekskul',
              desc: 'Terbatas: input presensi sesi, jadwal latihan, dan pengajuan LPJ.'
            },
            {
              role: 'super_admin' as UserRole,
              title: 'Super Admin',
              desc: 'Kontrol sistem, konfigurasi tahun ajaran, reset & seeding data.'
            }
          ].map(item => {
            const isSelected = userRole === item.role;
            return (
              <button
                key={item.role}
                type="button"
                onClick={() => switchRole(item.role)}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className={`font-bold text-xs ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
                      {item.title}
                    </p>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{item.desc}</p>
                </div>
                <span className={`text-[10px] font-bold mt-3 self-start ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {isSelected ? '● Sedang Digunakan' : 'Klik untuk Beralih'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Form Identitas Sekolah & Logo Kop Surat */}
      <form onSubmit={handleSaveSchoolInfo} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Profil Identitas Instansi & Sekolah / Madrasah
              </h3>
              <p className="text-xs text-slate-500">
                Data ini dicetak otomatis pada seluruh Kop Surat Resmi, Surat Dispensasi, Lembar Presensi, Berita Acara, dan LPJ.
              </p>
            </div>
          </div>

          {saveSuccess && (
            <span className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 animate-in fade-in shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Profil Berhasil Disimpan!
            </span>
          )}
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Pedoman Resmi Standar Kop Surat (4 Baris) */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              Pedoman Susunan Kop Surat (Baris 1 Sampai 4 Saja)
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 text-[11px]">
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80">
              <span className="font-bold text-indigo-600 block text-[10px] uppercase">Baris 1</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Instansi Pusat</p>
              <p className="text-slate-400 text-[10px] mt-0.5">Kementerian / Lembaga Pembina</p>
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80">
              <span className="font-bold text-indigo-600 block text-[10px] uppercase">Baris 2</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Instansi Wilayah</p>
              <p className="text-slate-400 text-[10px] mt-0.5">Kantor Wilayah / Kabupaten / Dinas</p>
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80">
              <span className="font-bold text-indigo-600 block text-[10px] uppercase">Baris 3</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Nama Sekolah / Madrasah</p>
              <p className="text-slate-400 text-[10px] mt-0.5">Teks utama paling tebal & ukuran terbesar</p>
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80">
              <span className="font-bold text-indigo-600 block text-[10px] uppercase">Baris 4 (Tanpa Baris 5)</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Kalimat Alamat / Kontak</p>
              <p className="text-slate-400 text-[10px] mt-0.5">Persis seperti kalimat yang ditulis user</p>
            </div>
          </div>
        </div>

        {/* Section A: Instansi Pembina (Pusat & Kabupaten) */}
        <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-indigo-600" />
              1. Instansi Pembina (Pedoman Kop Baris 1 & 2)
            </span>
            <span className="text-[10px] text-indigo-600 font-medium">Header Baris 1 & 2 Kop Surat</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Instansi Pusat (Kementerian / Lembaga) *
              </label>
              <input
                type="text"
                value={formData.centralInstitution || ''}
                onChange={e => setFormData({ ...formData, centralInstitution: e.target.value })}
                placeholder="Contoh: KEMENTERIAN AGAMA REPUBLIK INDONESIA"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold uppercase"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                <span className="text-[10px] text-slate-400 self-center">Pilihan Cepat:</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, centralInstitution: 'KEMENTERIAN AGAMA REPUBLIK INDONESIA' })}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-indigo-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Kemenag RI
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, centralInstitution: 'KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI' })}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-indigo-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Kemendikbudristek RI
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Instansi Wilayah / Kabupaten / Daerah *
              </label>
              <input
                type="text"
                value={formData.regionalInstitution || ''}
                onChange={e => setFormData({ ...formData, regionalInstitution: e.target.value })}
                placeholder="Contoh: KANTOR KEMENTERIAN AGAMA KABUPATEN BOGOR / DINAS PENDIDIKAN PROVINSI"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold uppercase"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Dicetak pada baris kedua kop surat di bawah instansi pusat.
              </p>
            </div>
          </div>
        </div>

        {/* Section B: Identitas Sekolah / Madrasah */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Resmi Sekolah / Madrasah *
            </label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: MAN 1 TELADAN NUSANTARA / SMA NEGERI 1 TELADAN"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold uppercase text-indigo-900 dark:text-indigo-200"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nomor Pokok Sekolah Nasional (NPSN) *
            </label>
            <input
              type="text"
              required
              value={formData.npsn || ''}
              onChange={e => setFormData({ ...formData, npsn: e.target.value })}
              placeholder="Contoh: 20108922"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-semibold"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Baris 4 Kop Surat: Alamat / Kontak / Website Lengkap *
            </label>
            <input
              type="text"
              required
              value={formData.address || ''}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="Contoh: Jl. Pemuda Pendidikan No. 45 Telp. (021) 7892345 Email: info@sman1teladan.sch.id"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Teks ini dicetak persis sebagai Baris 4 pada seluruh Kop Surat resmi.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kode Pos
            </label>
            <input
              type="text"
              value={formData.postalCode || ''}
              onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
              placeholder="Contoh: 12120"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Kepala Sekolah & Gelar *
            </label>
            <input
              type="text"
              required
              value={formData.principalName || ''}
              onChange={e => setFormData({ ...formData, principalName: e.target.value })}
              placeholder="Prof. Dr. H. Slamet Riyadi, M.Pd."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              NIP Kepala Sekolah
            </label>
            <input
              type="text"
              value={formData.principalNip || ''}
              onChange={e => setFormData({ ...formData, principalNip: e.target.value })}
              placeholder="19680315 199203 1 004"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-600 dark:text-slate-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Waka Bidang Kesiswaan *
            </label>
            <input
              type="text"
              required
              value={formData.wakaKesiswaanName || formData.wakaName || ''}
              onChange={e => setFormData({ ...formData, wakaKesiswaanName: e.target.value, wakaName: e.target.value })}
              placeholder="Drs. H. Bambang Suryono, M.Pd."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              NIP Waka Kesiswaan
            </label>
            <input
              type="text"
              value={formData.wakaNip || ''}
              onChange={e => setFormData({ ...formData, wakaNip: e.target.value })}
              placeholder="19740510 199903 1 002"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-600 dark:text-slate-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nomor Telepon / Fax Resmi
            </label>
            <input
              type="text"
              value={formData.phone || ''}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(021) 7892345"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Resmi Sekolah
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="info@sman1teladan.sch.id"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Website Resmi Sekolah
            </label>
            <input
              type="text"
              value={formData.website || ''}
              onChange={e => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://sman1teladan.sch.id"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tahun Ajaran Aktif *
            </label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-indigo-600 dark:text-indigo-400"
            >
              <option value="2024/2025">2024/2025</option>
              <option value="2025/2026">2025/2026</option>
              <option value="2026/2027">2026/2027</option>
              <option value="2027/2028">2027/2028</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Semester Aktif *
            </label>
            <select
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value as 'Ganjil' | 'Genap')}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-indigo-600 dark:text-indigo-400"
            >
              <option value="Ganjil">Semester Ganjil</option>
              <option value="Genap">Semester Genap</option>
            </select>
          </div>
        </div>

        {/* Section C: Fitur Upload Logo Kiri dan Logo Kanan */}
        <div className="pt-2 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <ImageIcon className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              2. Unggah Logo Kop Surat & Dokumen Cetak (Kiri & Kanan)
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Logo Kiri */}
            <LogoUploader
              label="Logo Kiri (Instansi / Kemenag / Pemda)"
              sublabel="Diposisikan di sebelah kiri Kop Surat (Instansi Pembina)"
              value={formData.logoLeftUrl || ''}
              onChange={(url) => setFormData({ ...formData, logoLeftUrl: url })}
              presets={LEFT_LOGO_PRESETS}
              position="left"
            />

            {/* Logo Kanan */}
            <LogoUploader
              label="Logo Kanan (Sekolah / Madrasah / OSIM)"
              sublabel="Diposisikan di sebelah kanan Kop Surat (Identitas Lembaga)"
              value={formData.logoRightUrl || ''}
              onChange={(url) => setFormData({ ...formData, logoRightUrl: url, logoUrl: url })}
              presets={RIGHT_LOGO_PRESETS}
              position="right"
            />
          </div>
        </div>

        {/* Section D: Live Preview Kop Surat Resmi */}
        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wide">
              <FileText className="w-4 h-4 text-indigo-600" />
              Pratinjau Kop Surat Resmi (Letterhead Preview)
            </span>

            <button
              type="button"
              onClick={handlePrintTestKop}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform hover:scale-105"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cetak Uji Coba Kop Surat (Print A4)</span>
            </button>
          </div>

          {/* Letterhead Paper Mockup */}
          <div className="p-6 rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-md">
            <SchoolLetterhead
              schoolInfo={{
                ...formData,
                name: formData.name || 'NAMA SEKOLAH / MADRASAH',
                centralInstitution: formData.centralInstitution || 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
                regionalInstitution: formData.regionalInstitution || 'KANTOR KEMENTERIAN AGAMA KABUPATEN',
                address: formData.address || 'Jl. Pendidikan No. 123',
                postalCode: formData.postalCode,
                phone: formData.phone,
                email: formData.email,
                website: formData.website,
                npsn: formData.npsn || '12345678',
                logoLeftUrl: formData.logoLeftUrl,
                logoRightUrl: formData.logoRightUrl
              }}
              documentTitle="SURAT KETERANGAN RESMI KESISWAAN"
              documentNumber={`421.3 / 001 / SIM-KES / ${new Date().getFullYear()}`}
            />
            <div className="text-center py-4 text-slate-400 text-xs italic font-sans border-t border-dashed border-slate-200 mt-4">
              [ Konten isi surat dispensasi, berita acara OSIM, atau lembar laporan kegiatan akan dicetak di bagian ini ]
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] text-slate-400">
            Tersinkronisasi otomatis ke basis data cloud Firestore dan penyimpanan lokal perangkat.
          </p>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan Pengaturan...' : 'Simpan Profil & Logo Kop Surat'}</span>
          </button>
        </div>
      </form>

      {/* 3. Manajemen Database & Seeding */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Sinkronisasi & Cadangan Database (Firestore)
            </h3>
            <p className="text-xs text-slate-500">
              Inisialisasi data sampel terpadu dan unduh berkas cadangan JSON seluruh modul kesiswaan.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <p className="text-slate-400 text-[11px]">Total Siswa Terdaftar</p>
            <p className="text-base font-extrabold text-slate-800 dark:text-slate-100">{students.length} Siswa</p>
          </div>
          <div>
            <p className="text-slate-400 text-[11px]">Unit Ekstrakurikuler</p>
            <p className="text-base font-extrabold text-indigo-600">{extracurriculars.length} Ekskul</p>
          </div>
          <div>
            <p className="text-slate-400 text-[11px]">Rekam Presensi Sesi</p>
            <p className="text-base font-extrabold text-emerald-600">{attendance.length} Sesi</p>
          </div>
          <div>
            <p className="text-slate-400 text-[11px]">Laporan LPJ Pembina</p>
            <p className="text-base font-extrabold text-amber-600">{activityReports.length} Laporan</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSeedDatabase}
            disabled={isSeeding}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>{isSeeding ? 'Mengisi Data Sample...' : 'Isi / Reset Data Sampel (Seeding)'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportFullBackup}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all hover:scale-105"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Cadangan JSON Penuh</span>
          </button>

          {seedSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              Database berhasil diisi dengan data sampel kesiswaan!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
