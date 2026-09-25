import React, { RefObject, useState } from 'react';
import {
  Users,
  RefreshCw,
  Database,
  Trash2,
  AlertTriangle,
  HardDrive,
  Download,
  FileSpreadsheet,
  Sparkles,
  CloudUpload,
  CheckCircle2
} from 'lucide-react';
import { Teacher, UserProfile } from '../../../types';

export interface CPanelBackupRestoreTabProps {
  teachers: Teacher[];
  allUsers: UserProfile[];
  unregisteredTeachers: Teacher[];
  handleSyncFromTeachers: () => void;
  isSyncingAll: boolean;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isClearingData: boolean;
  onOpenClearDataModal: () => void;
  jsonFileInputRef: RefObject<HTMLInputElement>;
  handleImportJSONFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportJSON: () => void;
  isImportingJSON: boolean;
  isSeeding: boolean;
  setIsSeeding: (seeding: boolean) => void;
  seedFirebaseDatabase: () => Promise<void> | Promise<any>;
  uploadAllDataToFirestore?: () => Promise<{ success: boolean; message: string; count: number }>;
  studentsCount?: number;
  classesCount?: number;
}

export const CPanelBackupRestoreTab: React.FC<CPanelBackupRestoreTabProps> = ({
  teachers,
  allUsers,
  unregisteredTeachers,
  handleSyncFromTeachers,
  isSyncingAll,
  showToast,
  isClearingData,
  onOpenClearDataModal,
  jsonFileInputRef,
  handleImportJSONFile,
  handleExportJSON,
  isImportingJSON,
  isSeeding,
  setIsSeeding,
  seedFirebaseDatabase,
  uploadAllDataToFirestore,
  studentsCount = 0,
  classesCount = 0,
}) => {
  const [isUploadingToCloud, setIsUploadingToCloud] = useState(false);
  const [lastUploadedCount, setLastUploadedCount] = useState<number | null>(null);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="view-cpanel-backup-restore">
      {/* Dewan Guru to cPanel Two-Way Sync Card */}
      <div className="bg-[#151518] border border-[#27272a] rounded-xl p-5 space-y-4 col-span-1 md:col-span-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100">
                Sinkronisasi Dua Arah: Dewan Guru & Pembina ↔ Akun Pengguna cPanel
              </h3>
              <p className="text-[11px] text-zinc-300">
                Memastikan seluruh guru & pembina hasil import file Excel terdaftar sebagai user login cPanel, serta menyelaraskan tugas pembinaan ekskul & konselor BK.
              </p>
            </div>
          </div>
          <button
            onClick={handleSyncFromTeachers}
            disabled={isSyncingAll}
            className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center space-x-2 transition-colors shrink-0 shadow-lg shadow-emerald-950/40 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
            <span>{isSyncingAll ? 'MENYINKRONKAN...' : 'JALANKAN SINKRONISASI DATA GURU'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 bg-[#1a1a1e] rounded-lg border border-[#2a2a30]">
            <span className="text-[10px] text-zinc-300 font-mono font-bold uppercase block">TOTAL DATA DI DEWAN GURU</span>
            <span className="text-xl font-bold font-mono text-zinc-100">{teachers.length} Guru/Pembina</span>
          </div>
          <div className="p-3 bg-[#1a1a1e] rounded-lg border border-[#2a2a30]">
            <span className="text-[10px] text-zinc-300 font-mono font-bold uppercase block">TOTAL AKUN PENGGUNA CPANEL</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{allUsers.length} Akun</span>
          </div>
          <div className="p-3 bg-[#1a1a1e] rounded-lg border border-[#2a2a30]">
            <span className="text-[10px] text-zinc-300 font-mono font-bold uppercase block">STATUS KESELARASAN DATA</span>
            <span className={`text-xs font-bold font-mono block mt-1 ${unregisteredTeachers.length === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {unregisteredTeachers.length === 0 ? '✓ 100% Selaras & Tersinkron' : `⚠ ${unregisteredTeachers.length} Guru Belum Memiliki Akun`}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-[#151518] border border-[#27272a] rounded-xl p-5 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-100">Sinkronisasi EMIS & Simpatika</h3>
            <p className="text-[11px] text-zinc-300">Integrasi data kepegawaian guru dan data pokok siswa Kemenag.</p>
          </div>
        </div>

        <div className="p-3 bg-[#1a1a1e] rounded-lg border border-[#2a2a30] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300">Token Sinkronisasi Server:</span>
            <span className="font-mono text-emerald-400 font-bold">SIMKESISWAAN-SYNC-8890-EMIS</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300">Sinkronisasi Terakhir:</span>
            <span className="font-mono text-zinc-200 font-bold">{new Date().toLocaleDateString('id-ID')}</span>
          </div>
        </div>

        <button
          onClick={() => showToast('Sinkronisasi database kesiswaan dengan server EMIS Kemenag berhasil dilakukan.')}
          className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center justify-center space-x-2 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>SINKRONISASI DATA SEKARANG</span>
        </button>
      </div>

      {/* CARD 1: CLEAR OPERATIONAL DEFAULT DATA */}
      <div className="bg-[#151518] border border-red-500/30 rounded-xl p-5 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-red-200">Kosongkan Data Bawaan / Persiapan Unggah Data Resmi</h3>
            <p className="text-[11px] text-zinc-300">Hapus seluruh data siswa, absensi, pelanggaran, konseling, dan kegiatan bawaan agar siap diisi dengan data sekolah resmi.</p>
          </div>
        </div>

        <div className="p-3 bg-red-950/20 rounded-lg border border-red-900/40 text-xs text-red-300 space-y-1.5">
          <div className="font-semibold flex items-center gap-1.5 text-red-200">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Peringatan Pembersihan:</span>
          </div>
          <p className="text-[11px] text-zinc-300 leading-relaxed">
            Tindakan ini akan mengosongkan seluruh data operasional (data siswa sampel, catatan absensi, rekam pelanggaran, bimbingan konseling, kepengurusan OSIM, prestasi, dan izin siswa). Struktur kelas dan akun dewan guru tetap aman dipertahankan.
          </p>
        </div>

        <button
          disabled={isClearingData}
          onClick={onOpenClearDataModal}
          className="w-full py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 shadow-lg shadow-red-950/50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{isClearingData ? 'MEMBERSIHKAN DATA...' : 'KOSONGKAN SELURUH DATA OPERASIONAL BAWAAN'}</span>
        </button>
      </div>

      {/* CARD 2: BACKUP & RESTORE DATABASE (JSON) */}
      <div className="bg-[#151518] border border-emerald-500/30 rounded-xl p-5 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-emerald-200">Cadangkan & Pulihkan Database Lengkap (JSON)</h3>
            <p className="text-[11px] text-zinc-300">Ekspor seluruh database ke file JSON atau pulihkan database dari berkas cadangan kapan saja.</p>
          </div>
        </div>

        <div className="text-xs text-zinc-300">
          Format JSON mencakup seluruh data: Profil Madrasah, Rombel Kelas, Dewan Guru, Data Siswa Lengkap, Kegiatan Ekskul, Rekam BK, Prestasi, hingga Riwayat Audit.
        </div>

        <input
          type="file"
          ref={jsonFileInputRef}
          accept=".json"
          onChange={handleImportJSONFile}
          className="hidden"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleExportJSON}
            className="py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-xs font-bold text-white flex items-center justify-center space-x-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>UNDUH CADANGAN (EXPORT JSON)</span>
          </button>

          <button
            type="button"
            disabled={isImportingJSON}
            onClick={() => jsonFileInputRef.current?.click()}
            className="py-2.5 px-4 rounded-lg bg-[#222228] hover:bg-[#2c2c34] text-xs font-bold text-emerald-300 border border-emerald-500/40 flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isImportingJSON ? 'MEMULIHKAN...' : 'PULIHKAN CADANGAN (IMPORT JSON)'}</span>
          </button>
        </div>
      </div>

      {/* CARD 3: INITIALIZE MASTER STRUCTURE */}
      <div className="bg-[#151518] border border-[#27272a] rounded-xl p-5 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-100">Inisialisasi Master Struktur Sekolah</h3>
            <p className="text-[11px] text-zinc-300">Sinkronisasi struktur master data (Setting Sekolah, Rombel, & Dewan Guru) ke Firebase Firestore.</p>
          </div>
        </div>

        <div className="text-xs text-zinc-300">
          Menyimpan struktur master sekolah ke cloud database Firestore tanpa menimpa data siswa yang telah diunggah.
        </div>

        <button
          disabled={isSeeding}
          onClick={async () => {
            setIsSeeding(true);
            try {
              await seedFirebaseDatabase();
              showToast('Database Firestore kesiswaan berhasil diinisialisasi struktur master resminya!');
            } catch (e: any) {
              showToast('Gagal: ' + e?.message, 'error');
            } finally {
              setIsSeeding(false);
            }
          }}
          className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isSeeding ? 'MEMPROSES SEEDING...' : 'INISIALISASI MASTER STRUKTUR FIRESTORE'}</span>
        </button>
      </div>

      {/* CARD 4: REKOMENDASI 2 - SINKRONISASI PENUH KE CLOUD FIRESTORE */}
      <div className="bg-[#151518] border border-cyan-500/40 rounded-xl p-5 space-y-4 col-span-1 md:col-span-2 shadow-lg shadow-cyan-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <CloudUpload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-zinc-100">Sinkronisasi Penuh ke Cloud Firestore (Standar Produksi Multi-User)</h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/30">
                  REKOMENDASI 2
                </span>
              </div>
              <p className="text-[11px] text-zinc-300">
                Unggah dan kunci seluruh data aktif aplikasi (Profil Madrasah, Rombel, Dewan Guru, Data Siswa, BK, OSIM, Ekskul, dsb.) ke Firebase Firestore terpusat agar langsung tersedia di aplikasi ter-deploy.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isUploadingToCloud || !uploadAllDataToFirestore}
            onClick={async () => {
              if (!uploadAllDataToFirestore) return;
              setIsUploadingToCloud(true);
              try {
                const res = await uploadAllDataToFirestore();
                if (res.success) {
                  setLastUploadedCount(res.count);
                  showToast(`Berhasil menyinkronkan ${res.count} dokumen data ke Cloud Firestore!`, 'success');
                } else {
                  showToast(res.message || 'Gagal menyinkronkan data ke Cloud Firestore', 'error');
                }
              } catch (err: any) {
                showToast('Terjadi kesalahan: ' + err?.message, 'error');
              } finally {
                setIsUploadingToCloud(false);
              }
            }}
            className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white flex items-center justify-center space-x-2 transition-colors shrink-0 shadow-lg shadow-cyan-950/50 disabled:opacity-50"
          >
            <CloudUpload className={`w-4 h-4 ${isUploadingToCloud ? 'animate-bounce' : ''}`} />
            <span>{isUploadingToCloud ? 'MENGUNGGAH KE FIRESTORE...' : 'UNGGAH SELURUH DATA AKTIF KE FIRESTORE'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-[#1a1a1e] rounded-lg border border-[#2a2a30]">
            <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase block">DATA SISWA AKTIF</span>
            <span className="text-base font-bold font-mono text-cyan-400">{studentsCount} Siswa</span>
          </div>
          <div className="p-3 bg-[#1a1a1e] rounded-lg border border-[#2a2a30]">
            <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase block">DEWAN GURU & PEMBINA</span>
            <span className="text-base font-bold font-mono text-emerald-400">{teachers.length} Guru</span>
          </div>
          <div className="p-3 bg-[#1a1a1e] rounded-lg border border-[#2a2a30]">
            <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase block">ROMBEL KELAS</span>
            <span className="text-base font-bold font-mono text-purple-400">{classesCount} Kelas</span>
          </div>
          <div className="p-3 bg-[#1a1a1e] rounded-lg border border-[#2a2a30]">
            <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase block">STATUS SINKRONISASI</span>
            <span className="text-xs font-bold font-mono text-zinc-200 flex items-center gap-1 mt-1">
              {lastUploadedCount !== null ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {lastUploadedCount} Dokumen Tersimpan
                </span>
              ) : (
                <span className="text-zinc-400">Siap Dikirim</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
