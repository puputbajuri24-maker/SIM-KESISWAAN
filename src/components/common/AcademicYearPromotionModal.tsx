import React, { useState, useMemo } from 'react';
import { 
  GraduationCap, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Calendar, 
  Users, 
  ShieldCheck, 
  HelpCircle,
  X
} from 'lucide-react';
import { useSchool } from '../../contexts/SchoolContext';
import { useToast } from '../../contexts/ToastContext';
import { Modal } from '../common/Modal';

interface AcademicYearPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AcademicYearPromotionModal: React.FC<AcademicYearPromotionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { 
    students, 
    classes, 
    activeAcademicYear, 
    activeSemester, 
    academicYears,
    promoteAcademicYear 
  } = useSchool();

  // Next academic year recommendation (e.g. 2024/2025 -> 2025/2026)
  const defaultNextYear = useMemo(() => {
    if (!activeAcademicYear) return '2026/2027';
    const parts = activeAcademicYear.split('/');
    if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
      return `${Number(parts[0]) + 1}/${Number(parts[1]) + 1}`;
    }
    return '2026/2027';
  }, [activeAcademicYear]);

  const [targetYear, setTargetYear] = useState<string>(defaultNextYear);
  const [resetPoints, setResetPoints] = useState<boolean>(true);
  const [demisionerOsim, setDemisionerOsim] = useState<boolean>(true);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  // Statistics calculation for preview
  const stats = useMemo(() => {
    const activeStudents = students.filter(s => s.status === 'Aktif' && !s.isDeleted);
    
    // Class XII Students (to become Alumni)
    const gradeXIIStudents = activeStudents.filter(s => {
      const cls = classes.find(c => c.id === s.classId || c.name === s.className);
      return cls?.grade === 'XII' || (s.className && s.className.startsWith('XII'));
    });

    // Class XI Students (to promote to XII)
    const gradeXIStudents = activeStudents.filter(s => {
      const cls = classes.find(c => c.id === s.classId || c.name === s.className);
      return cls?.grade === 'XI' || (s.className && s.className.startsWith('XI'));
    });

    // Class X Students (to promote to XI)
    const gradeXStudents = activeStudents.filter(s => {
      const cls = classes.find(c => c.id === s.classId || c.name === s.className);
      return cls?.grade === 'X' || (s.className && s.className.startsWith('X'));
    });

    return {
      totalActive: activeStudents.length,
      gradeXII: gradeXIIStudents.length,
      gradeXI: gradeXIStudents.length,
      gradeX: gradeXStudents.length,
      other: activeStudents.length - (gradeXIIStudents.length + gradeXIStudents.length + gradeXStudents.length)
    };
  }, [students, classes]);

  const { toast } = useToast();

  const handleExecutePromotion = async () => {
    if (!targetYear) {
      toast.warning('Silakan tentukan tahun ajaran baru tujuan.');
      return;
    }
    if (!isConfirmed) {
      toast.warning('Silakan centang persetujuan konfirmasi sebelum melanjutkan.');
      return;
    }

    setIsProcessing(true);
    try {
      if (promoteAcademicYear) {
        const res = await promoteAcademicYear({
          targetAcademicYear: targetYear,
          resetViolationPoints: resetPoints,
          demisionerOsim: demisionerOsim
        });
        const successMsg = `Proses transisi berhasil! ${res.graduatedCount} siswa lulus, ${res.promotedCount} siswa naik kelas, dan tahun ajaran kini aktif pada ${targetYear}.`;
        setResultMessage(successMsg);
        toast.success(successMsg);
        if (onSuccess) onSuccess();
      }
    } catch (e: any) {
      console.error('Error promoting academic year:', e);
      toast.error('Terjadi kesalahan saat memproses kenaikan kelas: ' + (e?.message || 'Gagal terhubung ke database.'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Wizard Kenaikan Kelas & Tutup Tahun Ajaran"
      subtitle="Otomatisasi pergantian tahun pelajaran, kelulusan, dan promosi rombel siswa"
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500">
            Tahun Ajaran Berjalan: <span className="font-bold text-slate-700 dark:text-slate-300">{activeAcademicYear} ({activeSemester})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              onClick={handleExecutePromotion}
              disabled={isProcessing || !isConfirmed || !targetYear}
              className={`px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center gap-2 ${
                isProcessing || !isConfirmed ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sedang Memproses...</span>
                </>
              ) : (
                <>
                  <GraduationCap className="w-4 h-4" />
                  <span>Jalankan Kenaikan Kelas</span>
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs select-text">
        {/* Success Notice */}
        {resultMessage && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2 font-bold mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Transisi Tahun Ajaran Tuntas!</span>
            </div>
            <p className="text-[11px] leading-relaxed">{resultMessage}</p>
          </div>
        )}

        {/* Info Banner */}
        <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl text-blue-900 dark:text-blue-300 leading-relaxed">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold">Perlindungan Integritas Data Madrasah:</span>
              <p className="text-[11px] text-blue-800 dark:text-blue-400 mt-0.5">
                Proses ini akan memperbarui rombel siswa aktif secara sistematis. Seluruh riwayat presensi, catatan poin pelanggaran lampau, serta rekap layanan BK tahun lalu <strong>tetap diarsipkan utuh secara permanen</strong> dan tidak akan hilang.
              </p>
            </div>
          </div>
        </div>

        {/* Target Academic Year Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tahun Ajaran Baru (Tujuan) *
            </label>
            <input
              type="text"
              value={targetYear}
              onChange={e => setTargetYear(e.target.value)}
              placeholder="contoh: 2025/2026"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-indigo-600 dark:text-indigo-400 font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Format baku: YYYY/YYYY (contoh: 2025/2026)</span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Semester Awal
            </label>
            <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400">
              Semester Ganjil (Otomatis)
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Tahun ajaran baru otomatis dimulai dari Semester Ganjil</span>
          </div>
        </div>

        {/* Projected Impact Preview */}
        <div>
          <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Simulasi Pergerakan Siswa ({stats.totalActive} Siswa Aktif)</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Box XII */}
            <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-amber-800 dark:text-amber-300 text-[11px]">Kelas XII (Tingkat Akhir)</span>
                <GraduationCap className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-extrabold text-amber-900 dark:text-amber-200 font-mono">{stats.gradeXII}</div>
              <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                <span>Otomatis diubah menjadi <strong>Alumni / Lulus</strong></span>
              </div>
            </div>

            {/* Box XI */}
            <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-blue-800 dark:text-blue-300 text-[11px]">Kelas XI (Madya)</span>
                <ArrowUpRight className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl font-extrabold text-blue-900 dark:text-blue-200 font-mono">{stats.gradeXI}</div>
              <div className="text-[10px] text-blue-700 dark:text-blue-400 mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                <span>Dipromosikan naik ke <strong>Kelas XII</strong></span>
              </div>
            </div>

            {/* Box X */}
            <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 text-[11px]">Kelas X (Pemula)</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-extrabold text-emerald-900 dark:text-emerald-200 font-mono">{stats.gradeX}</div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                <span>Dipromosikan naik ke <strong>Kelas XI</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Options & Reset Policy */}
        <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
          <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
            <input
              type="checkbox"
              checked={resetPoints}
              onChange={e => setResetPoints(e.target.checked)}
              className="mt-0.5 rounded text-indigo-600"
            />
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                Pemutihan Poin Kedisiplinan untuk Lembaran Tahun Baru (Rekomendasi Kemenag)
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Mereset akumulasi poin pelanggaran siswa aktif menjadi 0 untuk tahun ajaran baru. Dokumen dan riwayat kasus tahun lama tetap utuh dalam arsip buku pelanggaran.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
            <input
              type="checkbox"
              checked={demisionerOsim}
              onChange={e => setDemisionerOsim(e.target.checked)}
              className="mt-0.5 rounded text-indigo-600"
            />
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                Demisionerkan Kepengurusan OSIM Periode Lalu
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Mengalihkan masa jabatan pengurus OSIM aktif menjadi 'Demisioner' agar madrasah siap melakukan Pemilos / pembentukan pengurus baru.
              </p>
            </div>
          </label>
        </div>

        {/* Confirmation Agreement */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={e => setIsConfirmed(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span className="font-bold text-amber-900 dark:text-amber-300 text-xs">
              Saya telah memeriksa simulasi ini dan menyetujui eksekusi kenaikan kelas & transisi tahun ajaran baru.
            </span>
          </label>
        </div>
      </div>
    </Modal>
  );
};
