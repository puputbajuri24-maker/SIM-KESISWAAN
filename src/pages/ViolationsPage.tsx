import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Plus,
  AlertTriangle,
  HeartHandshake,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Filter,
  User,
  RefreshCw,
  Scale,
  Sparkles
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { Violation, ViolationCategory, ViolationStatus } from '../types';
import { OFFICIAL_DISCIPLINE_TIERS, getDisciplineTier } from '../services/officialRulesData';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';
import { ClassGridFilter } from '../components/common/ClassGridFilter';
import { calculateRecordCountsByClass, isStudentInClass } from '../utils/classResolver';

interface ViolationsPageProps {
  onReferToCounseling?: (violation: Violation) => void;
}

export const ViolationsPage: React.FC<ViolationsPageProps> = ({ onReferToCounseling }) => {
  const { isWakaOrAdmin, isGuruBK, currentUser } = useAuth();
  const {
    violations,
    students,
    classes,
    teachers,
    schoolRules,
    addViolation,
    updateViolation,
    deleteViolation,
    reconcileAllStudentPoints,
    activeAcademicYear
  } = useSchool();

  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [isSyncingPoints, setIsSyncingPoints] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [autoReferToCounseling, setAutoReferToCounseling] = useState<boolean>(false);

  // Helper for cumulative violation points
  const getStudentTotalPoints = (studentId: string) => {
    return violations
      .filter(v => v.studentId === studentId && !v.isDeleted)
      .reduce((sum, v) => sum + (Number(v.points) || 0), 0);
  };

  // Real-time Disciplinary Metrics according to SK B-380
  const disciplineStats = useMemo(() => {
    const studentPointsMap: Record<string, number> = {};
    violations.forEach(v => {
      if (!v.isDeleted && v.studentId) {
        studentPointsMap[v.studentId] = (studentPointsMap[v.studentId] || 0) + (Number(v.points) || 0);
      }
    });

    let stage1Count = 0; // 10 - 20 (Lisan)
    let stage2Count = 0; // 21 - 40 (SP 1)
    let stage3Count = 0; // 41 - 75 (SP 2 & Skorsing)
    let stage4Count = 0; // 76 - 99 (SP 3)
    let stage5Count = 0; // >= 100 (Pengembalian)

    Object.values(studentPointsMap).forEach(pts => {
      if (pts >= 100) stage5Count++;
      else if (pts >= 76) stage4Count++;
      else if (pts >= 41) stage3Count++;
      else if (pts >= 21) stage2Count++;
      else if (pts >= 10) stage1Count++;
    });

    const activeSanctionStudents = Object.values(studentPointsMap).filter(pts => pts >= 10).length;

    return {
      totalRecords: violations.filter(v => !v.isDeleted).length,
      activeSanctionStudents,
      stage1Count,
      stage2Count,
      stage3Count,
      stage4Count,
      stage5Count
    };
  }, [violations]);

  const handleSyncPoints = async () => {
    if (!reconcileAllStudentPoints) return;
    setIsSyncingPoints(true);
    try {
      const res = await reconcileAllStudentPoints();
      setSyncNotice(`Sinkronisasi selesai! ${res.updatedCount} poin siswa telah diselaraskan dengan riwayat.`);
      setTimeout(() => setSyncNotice(null), 5000);
    } catch (e) {
      setSyncNotice('Gagal melakukan rekonsiliasi poin.');
      setTimeout(() => setSyncNotice(null), 4000);
    } finally {
      setIsSyncingPoints(false);
    }
  };

  // Count violations per class
  const violationCountsByClassId = useMemo(() => {
    return calculateRecordCountsByClass(violations, classes, students);
  }, [violations, classes, students]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);

  const [formData, setFormData] = useState<Partial<Violation>>({
    studentId: '',
    studentName: '',
    studentNis: '',
    studentClass: '',
    violationType: '',
    category: 'Ringan',
    points: 5,
    date: new Date().toISOString().split('T')[0],
    description: '',
    actionTaken: 'Teguran lisan dan pencatatan dalam buku saku kedisiplinan',
    officerName: currentUser?.displayName || 'Guru Piket',
    status: 'Diproses'
  });

  const filteredViolations = useMemo(() => {
    return violations.filter(v => {
      if (v.isDeleted) return false;
      if (selectedClass !== 'all') {
        const student = students.find(s => s.id === v.studentId);
        const match = isStudentInClass(v, selectedClass, classes) || (student && isStudentInClass(student, selectedClass, classes));
        if (!match) return false;
      }
      if (selectedCategory !== 'all' && v.category !== selectedCategory) return false;
      if (selectedStatus !== 'all' && v.status !== selectedStatus) return false;
      if (stageFilter !== 'all') {
        const currentPts = getStudentTotalPoints(v.studentId);
        const tier = getDisciplineTier(currentPts);
        const stgNum = tier ? String(tier.tier) : 'none';
        if (stageFilter !== stgNum) return false;
      }
      return true;
    });
  }, [violations, selectedClass, selectedCategory, selectedStatus, stageFilter, classes, students]);

  const handleOpenAdd = () => {
    setSelectedViolation(null);
    const defaultStudent = students[0];
    setFormData({
      studentId: defaultStudent?.id || '',
      studentName: defaultStudent?.fullName || '',
      studentNis: defaultStudent?.nis || '',
      studentClass: defaultStudent?.className || '',
      violationType: 'Keterlambatan Masuk Sekolah (>15 Menit)',
      category: 'Ringan',
      points: 5,
      date: new Date().toISOString().split('T')[0],
      description: 'Terlambat hadir di sekolah tanpa surat keterangan resmi.',
      actionTaken: 'Teguran lisan dan pembinaan oleh tim piket.',
      officerName: currentUser?.displayName || 'Tim Ketertiban Kesiswaan',
      status: 'Diproses'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (v: Violation, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedViolation(v);
    setFormData(v);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (v: Violation) => {
    setSelectedViolation(v);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (v: Violation, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedViolation(v);
    setIsDeleteOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.violationType) {
      alert('Mohon pilih siswa dan jenis pelanggaran.');
      return;
    }

    try {
      const student = students.find(s => s.id === formData.studentId);
      let violationForReferral: Violation | null = null;

      if (selectedViolation) {
        await updateViolation(selectedViolation.id, {
          ...formData,
          studentName: student?.fullName || formData.studentName,
          studentNis: student?.nis || formData.studentNis,
          studentClass: student?.className || formData.studentClass
        });
        violationForReferral = {
          ...selectedViolation,
          ...formData,
          studentName: student?.fullName || formData.studentName,
          studentNis: student?.nis || formData.studentNis,
          studentClass: student?.className || formData.studentClass
        } as Violation;
      } else {
        const payload: Violation = {
          id: 'v_' + Date.now(),
          studentId: formData.studentId!,
          studentName: student?.fullName || 'Siswa',
          studentNis: student?.nis || '',
          studentClass: student?.className || '',
          violationType: formData.violationType!,
          category: formData.category as ViolationCategory,
          points: Number(formData.points) || 5,
          date: formData.date!,
          description: formData.description || '',
          actionTaken: formData.actionTaken || 'Teguran',
          officerName: formData.officerName || currentUser?.displayName || 'Guru Piket',
          status: (formData.status as ViolationStatus) || 'Diproses',
          academicYear: activeAcademicYear
        };
        await addViolation(payload);
        violationForReferral = payload;
      }

      if (autoReferToCounseling && onReferToCounseling && violationForReferral) {
        setIsFormOpen(false);
        setSelectedViolation(null);
        setAutoReferToCounseling(false);
        onReferToCounseling(violationForReferral);
        return;
      }
    } catch (err) {
      console.error('Error saving violation:', err);
    } finally {
      setIsFormOpen(false);
      setSelectedViolation(null);
      setAutoReferToCounseling(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedViolation) {
      try {
        await deleteViolation(selectedViolation.id);
      } catch (err) {
        console.error('Error deleting violation:', err);
      } finally {
        setIsDeleteOpen(false);
        setSelectedViolation(null);
      }
    }
  };

  const columns: Column<Violation>[] = [
    {
      header: 'Nama Siswa & NIS',
      accessorKey: 'studentName',
      sortable: true,
      cell: v => {
        const studentPts = getStudentTotalPoints(v.studentId);
        const tier = getDisciplineTier(studentPts);

        return (
          <div>
            <div className="flex items-center gap-1.5">
              {v.studentCode && (
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {v.studentCode}
                </span>
              )}
              <p className="font-bold text-slate-900 dark:text-slate-100">{v.studentName}</p>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <p className="text-[11px] text-slate-400">NIS: {v.studentNis} • Kelas: {v.studentClass}</p>
              {studentPts >= 10 && tier && (
                <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${
                  tier.tier === 1 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                  tier.tier === 2 ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' :
                  tier.tier === 3 ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30' :
                  tier.tier === 4 ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30' :
                  'bg-red-950 text-red-300 border-red-800 animate-pulse'
                }`}>
                  {tier.name.split(':')[0]} ({studentPts}p)
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Bentuk Pelanggaran',
      accessorKey: 'violationType',
      sortable: true,
      cell: v => (
        <div>
          <span className="font-bold text-xs text-rose-600 dark:text-rose-400">{v.violationType}</span>
          <p className="text-[11px] text-slate-500 line-clamp-1">{v.description}</p>
        </div>
      )
    },
    {
      header: 'Kategori & Poin',
      accessorKey: 'points',
      sortable: true,
      cell: v => (
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-extrabold text-xs border border-rose-200 dark:border-rose-800">
            +{v.points} Poin
          </span>
          <span className="text-[11px] text-slate-500 font-medium">({v.category})</span>
        </div>
      )
    },
    {
      header: 'Tindakan & Petugas',
      accessorKey: 'actionTaken',
      cell: v => (
        <div className="text-xs">
          <p className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[200px]">{v.actionTaken}</p>
          <p className="text-[10px] text-slate-400">Dicatat: {v.officerName} • {v.date}</p>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: v => <StatusBadge status={v.status} />
    },
    {
      header: 'Aksi',
      className: 'text-right',
      cell: v => {
        const studentPts = getStudentTotalPoints(v.studentId);
        const tier = getDisciplineTier(studentPts);
        const hasCriticalSanction = studentPts >= 41;
        const hasWarning = studentPts >= 10;

        return (
          <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
            {onReferToCounseling && v.status !== 'Selesai' && (
              <button
                onClick={() => onReferToCounseling(v)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border flex items-center gap-1 transition-all ${
                  hasCriticalSanction
                    ? 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700 shadow-sm shadow-rose-600/30'
                    : hasWarning
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                    : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20'
                }`}
                title={hasWarning && tier ? `Rujuk ke Konseling & Terbitkan ${tier.name} (${studentPts} Poin)` : 'Rujuk ke Bimbingan Konseling'}
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>
                  {studentPts >= 76 ? 'SP 3 / Sidang' : studentPts >= 41 ? 'SP 2 / Skorsing' : studentPts >= 21 ? 'Terbitkan SP 1' : studentPts >= 10 ? 'Peringatan Lisan' : 'Rujuk BK'}
                </span>
              </button>
            )}
          <button
            onClick={() => handleOpenDetail(v)}
            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-400 transition-colors"
            title="Lihat Detail Pelanggaran"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={e => handleOpenEdit(v, e)}
            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:hover:bg-amber-900 dark:text-amber-400 transition-colors"
            title="Edit Pelanggaran Siswa"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={e => handleOpenDelete(v, e)}
            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-400 transition-colors"
            title="Hapus Catatan Pelanggaran"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      );
    }
  }
];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Pelanggaran Siswa & Buku Poin Kedisiplinan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sistem akumulasi poin pelanggaran tata tertib, pemantauan kedisiplinan, dan integrasi rujukan BK.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(isWakaOrAdmin || isGuruBK) && (
            <button
              onClick={handleSyncPoints}
              disabled={isSyncingPoints}
              className={`px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all ${
                isSyncingPoints ? 'opacity-50 cursor-wait' : ''
              }`}
              title="Audit dan samakan total poin di profil siswa dengan riwayat riil pelanggaran"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-500 ${isSyncingPoints ? 'animate-spin' : ''}`} />
              <span>{isSyncingPoints ? 'Menyelaraskan...' : 'Sinkron Poin'}</span>
            </button>
          )}

          <ExportActions
            filename="buku_pelanggaran_siswa"
            title="Laporan Pelanggaran Kedisiplinan Siswa"
            data={filteredViolations}
            headers={[
              { header: 'Nama Siswa', key: 'studentName' },
              { header: 'NIS', key: 'studentNis' },
              { header: 'Kelas', key: 'studentClass' },
              { header: 'Bentuk Pelanggaran', key: 'violationType' },
              { header: 'Kategori', key: 'category' },
              { header: 'Poin', key: 'points' },
              { header: 'Tanggal', key: 'date' },
              { header: 'Tindakan', key: 'actionTaken' },
              { header: 'Petugas', key: 'officerName' },
              { header: 'Status', key: 'status' }
            ]}
          />

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Pelanggaran</span>
          </button>
        </div>
      </div>

      {/* Sync Notification Banner */}
      {syncNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">{syncNotice}</span>
          </div>
          <button onClick={() => setSyncNotice(null)} className="text-emerald-600 hover:underline text-[11px]">
            Tutup
          </button>
        </div>
      )}

      {/* Disciplinary Intelligence Bar (SK B-380) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">TOTAL KASUS</span>
          <p className="text-lg font-black text-slate-800 dark:text-slate-100 mt-0.5">{disciplineStats.totalRecords}</p>
          <span className="text-[10px] text-slate-500 font-medium">Pelanggaran tercatat</span>
        </div>
        <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-sm">
          <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 block uppercase">AMBANG SANKSI</span>
          <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">{disciplineStats.activeSanctionStudents}</p>
          <span className="text-[10px] text-amber-600/80 font-medium">Siswa terakumulasi ≥10p</span>
        </div>
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-mono text-yellow-500 block uppercase">TAHAP 1 (LISAN)</span>
          <p className="text-lg font-black text-yellow-600 dark:text-yellow-400 mt-0.5">{disciplineStats.stage1Count}</p>
          <span className="text-[10px] text-slate-500 font-medium">10 - 20 Poin</span>
        </div>
        <div className="p-3 rounded-2xl bg-orange-500/5 border border-orange-500/20 shadow-sm">
          <span className="text-[10px] font-mono text-orange-600 dark:text-orange-400 block uppercase">TAHAP 2 (SP 1)</span>
          <p className="text-lg font-black text-orange-600 dark:text-orange-400 mt-0.5">{disciplineStats.stage2Count}</p>
          <span className="text-[10px] text-orange-600/80 font-medium">21 - 40 Poin</span>
        </div>
        <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20 shadow-sm">
          <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 block uppercase">TAHAP 3 (SP 2 & SKORS)</span>
          <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">{disciplineStats.stage3Count}</p>
          <span className="text-[10px] text-rose-600/80 font-medium">41 - 75 Poin</span>
        </div>
        <div className="p-3 rounded-2xl bg-red-950/20 border border-red-500/30 shadow-sm">
          <span className="text-[10px] font-mono text-red-500 block uppercase">TAHAP 4 & 5 (KRITIS)</span>
          <p className="text-lg font-black text-red-600 dark:text-red-400 mt-0.5">{disciplineStats.stage4Count + disciplineStats.stage5Count}</p>
          <span className="text-[10px] text-red-500 font-medium">≥76 Poin (Sidang/DO)</span>
        </div>
      </div>

      {/* Class Grid Filter */}
      <ClassGridFilter
        classes={classes}
        selectedClassId={selectedClass}
        onSelectClass={setSelectedClass}
        countsByClassId={violationCountsByClassId}
        totalCount={violations.length}
        label="Filter Pelanggaran Berdasarkan Rombel Kelas"
        itemUnit="Kasus"
        colorScheme="rose"
      />

      {/* Secondary Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500 font-semibold">
          <Filter className="w-4 h-4" />
          <span>Filter Lanjutan:</span>
        </div>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium"
        >
          <option value="all">Semua Kategori Pelanggaran</option>
          <option value="Ringan">Ringan (5-10 Poin)</option>
          <option value="Sedang">Sedang (15-25 Poin)</option>
          <option value="Berat">Berat (30-50 Poin)</option>
          <option value="Sangat Berat">Sangat Berat (&gt;50 Poin)</option>
        </select>

        <select
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium"
        >
          <option value="all">Semua Ambang Sanksi (SK B-380)</option>
          <option value="1">Tahap 1: Peringatan Lisan (10-20 Poin)</option>
          <option value="2">Tahap 2: SP 1 & Panggilan Ortu I (21-40 Poin)</option>
          <option value="3">Tahap 3: SP 2 & Skorsing 3 Hari (41-75 Poin)</option>
          <option value="4">Tahap 4: SP 3 Terakhir (76-99 Poin)</option>
          <option value="5">Tahap 5: Pengembalian Siswa (≥100 Poin)</option>
        </select>

        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium"
        >
          <option value="all">Semua Status Tindak Lanjut</option>
          <option value="Diproses">Diproses</option>
          <option value="Dalam Pembinaan">Dalam Pembinaan BK</option>
          <option value="Selesai">Selesai</option>
        </select>

        {(selectedClass !== 'all' || selectedCategory !== 'all' || selectedStatus !== 'all' || stageFilter !== 'all') && (
          <button
            onClick={() => {
              setSelectedClass('all');
              setSelectedCategory('all');
              setSelectedStatus('all');
              setStageFilter('all');
            }}
            className="text-xs text-rose-600 hover:underline font-semibold ml-auto"
          >
            Reset Semua Filter
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable
        id="violations-table"
        data={filteredViolations}
        columns={columns}
        searchPlaceholder="Cari nama siswa, jenis pelanggaran, atau petugas..."
        searchableKeys={['studentName', 'studentNis', 'violationType', 'description', 'officerName']}
        onRowClick={handleOpenDetail}
        emptyTitle="Tidak Ada Catatan Pelanggaran"
        emptySubtitle="Semua siswa mematuhi tata tertib sekolah."
      />

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedViolation ? 'Edit Catatan Pelanggaran' : 'Catat Pelanggaran Tata Tertib'}
        subtitle="Masukkan rincian pelanggaran dan tetapkan bobot poin sesuai tata tertib resmi"
        maxWidth="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20"
            >
              Simpan Pelanggaran
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pilih Siswa *
            </label>
            <select
              value={formData.studentId}
              onChange={e => {
                const s = students.find(st => st.id === e.target.value);
                setFormData({
                  ...formData,
                  studentId: e.target.value,
                  studentName: s?.fullName || '',
                  studentNis: s?.nis || '',
                  studentClass: s?.className || ''
                });
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.fullName} (NIS: {s.nis} • {s.className})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Select from Official School Rules */}
          {schoolRules && schoolRules.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl">
              <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-300 mb-1 flex items-center justify-between">
                <span>📖 Rujukan Pasal Buku Tata Tertib (Otomatisasi)</span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-normal">Pilih untuk isi otomatis</span>
              </label>
              <select
                onChange={e => {
                  const rule = schoolRules.find(r => r.id === e.target.value);
                  if (rule) {
                    const catMap: Record<string, ViolationCategory> = {
                      'Ringan': 'Ringan',
                      'Sedang': 'Sedang',
                      'Berat': 'Berat',
                      'Sangat Berat': 'Sangat Berat',
                      'Apresiasi': 'Ringan'
                    };
                    setFormData({
                      ...formData,
                      violationType: `[${rule.articleNumber}] ${rule.title}`,
                      category: catMap[rule.severity] || 'Ringan',
                      points: rule.points,
                      description: rule.description,
                      actionTaken: rule.consequence,
                      officerName: rule.authorizedOfficer || (currentUser?.displayName || 'Guru Piket')
                    });
                  }
                }}
                defaultValue=""
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="">-- Pilih dari Daftar Pasal Tata Tertib Resmi ({schoolRules.length} Aturan) --</option>
                {schoolRules.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.code ? `[${r.code}] ` : ''}{r.articleNumber}: {r.title} ({r.points > 0 ? `+${r.points}` : r.points} Poin - {r.severity})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bentuk / Jenis Pelanggaran *
            </label>
            <input
              type="text"
              required
              value={formData.violationType}
              onChange={e => setFormData({ ...formData, violationType: e.target.value })}
              placeholder="Contoh: Merokok / Membolos Jam Pelajaran / Seragam Tidak Rapi"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori
              </label>
              <select
                value={formData.category}
                onChange={e => {
                  const cat = e.target.value as ViolationCategory;
                  const pts = cat === 'Ringan' ? 5 : cat === 'Sedang' ? 15 : cat === 'Berat' ? 30 : 75;
                  setFormData({ ...formData, category: cat, points: pts });
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="Ringan">Ringan</option>
                <option value="Sedang">Sedang</option>
                <option value="Berat">Berat</option>
                <option value="Sangat Berat">Sangat Berat</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bobot Poin (+)*
              </label>
              <input
                type="number"
                required
                value={formData.points}
                onChange={e => setFormData({ ...formData, points: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-rose-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Kejadian
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          {/* Real-time Disciplinary Simulation (SK B-380) */}
          {(() => {
            const currentStudentPts = formData.studentId ? getStudentTotalPoints(formData.studentId) : 0;
            const pointsToAdd = Number(formData.points) || 0;
            const projectedPts = currentStudentPts + pointsToAdd;
            const currentTier = getDisciplineTier(currentStudentPts);
            const projectedTier = getDisciplineTier(projectedPts);
            const isCrossingNewTier = projectedTier && (!currentTier || projectedTier.tier > currentTier.tier);

            return (
              <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900/90 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-amber-500" />
                    Simulasi Poin & Ambang Sanksi SK B-380
                  </span>
                  <div className="font-mono text-[11px] flex items-center gap-1.5">
                    <span className="text-slate-500">Saat ini: <strong>{currentStudentPts}p</strong></span>
                    <span>➔</span>
                    <span className={`font-bold ${projectedPts >= 41 ? 'text-red-500 font-extrabold' : projectedPts >= 10 ? 'text-amber-500' : 'text-slate-400'}`}>
                      Akumulasi: {projectedPts} Poin
                    </span>
                  </div>
                </div>

                {projectedTier ? (
                  <div className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                    projectedTier.tier >= 4 ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300' :
                    projectedTier.tier === 3 ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300' :
                    projectedTier.tier === 2 ? 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300' :
                    'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase tracking-wide flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {projectedTier.name} ({projectedTier.minPoints} - {projectedTier.maxPoints >= 999 ? '∞' : projectedTier.maxPoints} Poin)
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-bold">
                        {isCrossingNewTier ? '⚠️ AMBANG BARU TERCAPAI' : 'STATUS TERJAGA'}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      <strong>Tindakan Wajib SK:</strong> {projectedTier.actionRequired}
                    </p>
                    <p className="text-[10px] opacity-80">
                      Pejabat Berwenang: {projectedTier.responsibleOfficer}
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Akumulasi poin masih di bawah batas peringatan formal (&lt;10 Poin). Belum ada sanksi formal yang diterbitkan.
                  </p>
                )}

                {/* Direct Referral Checkbox */}
                {onReferToCounseling && projectedPts >= 10 && (
                  <label className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoReferToCounseling}
                      onChange={e => setAutoReferToCounseling(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <HeartHandshake className="w-4 h-4 text-indigo-500" />
                    <span>Langsung alihkan ke Bimbingan Konseling untuk menerbitkan {projectedTier?.name.split(':')[0] || 'Surat Panggilan / SP'}</span>
                  </label>
                )}
              </div>
            );
          })()}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kronologi / Deskripsi Kejadian
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Jelaskan kronologi kejadian pelanggaran..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tindakan Langsung / Sanksi
              </label>
              <input
                type="text"
                value={formData.actionTaken}
                onChange={e => setFormData({ ...formData, actionTaken: e.target.value })}
                placeholder="Contoh: Pemanggilan wali kelas & surat peringatan"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status Penanganan
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="Diproses">Diproses</option>
                <option value="Dalam Pembinaan">Dalam Pembinaan BK</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {selectedViolation && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Catatan Pelanggaran: ${selectedViolation.studentName}`}
          subtitle={`NIS: ${selectedViolation.studentNis} • Kelas: ${selectedViolation.studentClass}`}
          maxWidth="md"
          footer={
            <button
              onClick={() => setIsDetailOpen(false)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-white"
            >
              Tutup
            </button>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-600">+{selectedViolation.points} Poin ({selectedViolation.category})</span>
                <StatusBadge status={selectedViolation.status} />
              </div>
              <p><strong>Bentuk Pelanggaran:</strong> {selectedViolation.violationType}</p>
              <p><strong>Tanggal Kejadian:</strong> {selectedViolation.date}</p>
              <p><strong>Petugas Pencatat:</strong> {selectedViolation.officerName}</p>
              <p><strong>Tindakan Diberikan:</strong> {selectedViolation.actionTaken}</p>
              <p className="mt-2"><strong>Kronologi:</strong> {selectedViolation.description || '-'}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Catatan Pelanggaran"
        message={`Apakah Anda yakin ingin menghapus pelanggaran siswa ${selectedViolation?.studentName}? Poin disiplin siswa akan dikurangi kembali.`}
        confirmText="Hapus Pelanggaran"
      />
    </div>
  );
};
