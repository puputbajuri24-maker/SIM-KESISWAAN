import React, { useState } from 'react';
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
  School
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

export const SettingsPage: React.FC = () => {
  const { currentUser, switchRole, userRole } = useAuth();
  const {
    schoolInfo,
    updateSchoolInfo,
    activeAcademicYear,
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

  const [formData, setFormData] = useState(schoolInfo);
  const [academicYear, setAcademicYear] = useState(activeAcademicYear);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSchoolInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateSchoolInfo(formData);
    setActiveAcademicYear(academicYear);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
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

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Pengaturan Sistem & Profil Sekolah
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Kelola profil identitas sekolah, tahun ajaran aktif, simulasi hak akses peran (RBAC), serta manajemen sinkronisasi database.
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

      {/* 2. Form Identitas Sekolah & Tahun Ajaran */}
      <form onSubmit={handleSaveSchoolInfo} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Profil Identitas Sekolah
              </h3>
              <p className="text-xs text-slate-500">
                Informasi ini digunakan otomatis pada Kop Surat Dispensasi Resmi dan Laporan PDF.
              </p>
            </div>
          </div>

          {saveSuccess && (
            <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Tersimpan!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Resmi Sekolah *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nomor Pokok Sekolah Nasional (NPSN) *
            </label>
            <input
              type="text"
              required
              value={formData.npsn}
              onChange={e => setFormData({ ...formData, npsn: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Alamat Lengkap Sekolah *
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Kepala Sekolah & Gelar *
            </label>
            <input
              type="text"
              required
              value={formData.principalName}
              onChange={e => setFormData({ ...formData, principalName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Waka Bidang Kesiswaan *
            </label>
            <input
              type="text"
              required
              value={formData.wakaKesiswaanName}
              onChange={e => setFormData({ ...formData, wakaKesiswaanName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nomor Telepon / Fax
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Resmi Sekolah
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tahun Ajaran & Semester Aktif
            </label>
            <select
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-indigo-600"
            >
              <option value="2025/2026 Ganjil">2025/2026 Ganjil</option>
              <option value="2025/2026 Genap">2025/2026 Genap</option>
              <option value="2026/2027 Ganjil">2026/2027 Ganjil</option>
              <option value="2026/2027 Genap">2026/2027 Genap</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Website Resmi
            </label>
            <input
              type="text"
              value={formData.website}
              onChange={e => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Profil Sekolah'}</span>
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
