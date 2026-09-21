import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  Eye,
  Edit2,
  Trash2,
  Send,
  MessageSquare,
  Printer,
  ShieldAlert,
  HeartHandshake,
  Award,
  Filter,
  Calendar,
  Layers
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { ActivityReport, ReportStatus, StudentViolation, StudentCounseling } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';
import { SchoolLetterhead } from '../components/common/SchoolLetterhead';

type ReportTab = 'lpj' | 'violations' | 'counseling' | 'ekskul';

export const ReportsPage: React.FC = () => {
  const { isWakaOrAdmin, isGuruBK, isPembina, currentUser } = useAuth();
  const {
    activityReports,
    extracurriculars,
    violations,
    counseling,
    members,
    students,
    teachers,
    schoolSetting,
    activeAcademicYear,
    addActivityReport,
    updateActivityReport,
    deleteActivityReport
  } = useSchool();

  // Active tab selection
  const [activeTab, setActiveTab] = useState<ReportTab>(() => {
    if (isGuruBK) return 'counseling';
    if (isPembina) return 'lpj';
    return 'lpj';
  });

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ActivityReport | null>(null);

  // Print Preview Modals
  const [isPrintLpjOpen, setIsPrintLpjOpen] = useState(false);
  const [isPrintViolationsOpen, setIsPrintViolationsOpen] = useState(false);
  const [isPrintCounselingOpen, setIsPrintCounselingOpen] = useState(false);

  // Review state
  const [reviewStatus, setReviewStatus] = useState<ReportStatus>('Disetujui');
  const [reviewNotes, setReviewNotes] = useState<string>('');

  // LPJ Form State
  const [formData, setFormData] = useState<Partial<ActivityReport>>({
    activityTitle: '',
    extracurricularId: '',
    extracurricularName: '',
    coachName: currentUser?.displayName || '',
    date: new Date().toISOString().split('T')[0],
    summary: '',
    attendanceCount: 30,
    totalBudgetSpent: 0,
    achievements: '',
    challenges: '',
    status: 'Diajukan'
  });

  // Filter state for violations/counseling recap
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [dateFilterStart, setDateFilterStart] = useState<string>('');
  const [dateFilterEnd, setDateFilterEnd] = useState<string>('');

  const classList = useMemo(() => {
    const classes = new Set<string>();
    students.forEach(s => {
      if (s.className) classes.add(s.className);
    });
    return Array.from(classes).sort();
  }, [students]);

  // Filtered Violations for Recap
  const filteredViolations = useMemo(() => {
    return violations.filter(v => {
      if (selectedClassFilter !== 'all' && v.studentClass !== selectedClassFilter) return false;
      if (dateFilterStart && v.date < dateFilterStart) return false;
      if (dateFilterEnd && v.date > dateFilterEnd) return false;
      return true;
    });
  }, [violations, selectedClassFilter, dateFilterStart, dateFilterEnd]);

  // Filtered Counseling for Recap
  const filteredCounseling = useMemo(() => {
    return counseling.filter(c => {
      if (selectedClassFilter !== 'all' && c.studentClass !== selectedClassFilter) return false;
      if (dateFilterStart && c.date < dateFilterStart) return false;
      if (dateFilterEnd && c.date > dateFilterEnd) return false;
      return true;
    });
  }, [counseling, selectedClassFilter, dateFilterStart, dateFilterEnd]);

  // Handlers for LPJ
  const handleOpenAdd = () => {
    setSelectedReport(null);
    const defaultEkskul = extracurriculars[0];
    setFormData({
      activityTitle: '',
      extracurricularId: defaultEkskul?.id || '',
      extracurricularName: defaultEkskul?.name || '',
      coachName: defaultEkskul?.coachName || currentUser?.displayName || 'Guru Pembina',
      date: new Date().toISOString().split('T')[0],
      summary: '',
      attendanceCount: 25,
      totalBudgetSpent: 500000,
      achievements: 'Semua target materi dan latihan terlaksana dengan baik.',
      challenges: 'Tidak ada kendala yang berarti.',
      status: 'Diajukan'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (report: ActivityReport, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedReport(report);
    setFormData(report);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (report: ActivityReport) => {
    setSelectedReport(report);
    setIsDetailOpen(true);
  };

  const handleOpenReview = (report: ActivityReport, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedReport(report);
    setReviewStatus('Disetujui');
    setReviewNotes(report.feedbackNotes || 'Laporan telah diverifikasi dan disetujui oleh Waka Kesiswaan.');
    setIsReviewOpen(true);
  };

  const handleOpenDelete = (report: ActivityReport, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedReport(report);
    setIsDeleteOpen(true);
  };

  const handlePrintLpj = (report: ActivityReport) => {
    setSelectedReport(report);
    setIsPrintLpjOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.activityTitle || !formData.extracurricularId || !formData.summary) {
      alert('Mohon lengkapi judul kegiatan, ekstrakurikuler, dan ringkasan pelaksanaan.');
      return;
    }

    const ekskul = extracurriculars.find(e => e.id === formData.extracurricularId);

    if (selectedReport) {
      await updateActivityReport(selectedReport.id, {
        ...formData,
        extracurricularName: ekskul?.name || formData.extracurricularName
      });
    } else {
      await addActivityReport({
        activityTitle: formData.activityTitle!,
        extracurricularId: formData.extracurricularId!,
        extracurricularName: ekskul?.name || 'Ekstrakurikuler',
        coachName: formData.coachName || currentUser?.displayName || 'Pembina',
        date: formData.date!,
        summary: formData.summary!,
        attendanceCount: Number(formData.attendanceCount) || 0,
        totalBudgetSpent: Number(formData.totalBudgetSpent) || 0,
        achievements: formData.achievements || '',
        challenges: formData.challenges || '',
        status: 'Diajukan',
        academicYear: activeAcademicYear
      });
    }
    setIsFormOpen(false);
  };

  const handleSaveReview = async () => {
    if (!selectedReport) return;
    await updateActivityReport(selectedReport.id, {
      status: reviewStatus,
      feedbackNotes: reviewNotes,
      approvedBy: currentUser?.displayName || 'Waka Kesiswaan'
    });
    setIsReviewOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (selectedReport) {
      await deleteActivityReport(selectedReport.id);
      setIsDeleteOpen(false);
      setSelectedReport(null);
    }
  };

  const executeBrowserPrint = () => {
    window.print();
  };

  // Columns for LPJ Table
  const lpjColumns: Column<ActivityReport>[] = [
    {
      header: 'Judul Laporan & Ekskul',
      accessorKey: 'activityTitle',
      sortable: true,
      cell: r => (
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100">{r.activityTitle}</p>
          <p className="text-[11px] text-slate-400">
            {r.extracurricularName} • Pembina: {r.coachName}
          </p>
        </div>
      )
    },
    {
      header: 'Tanggal & Kehadiran',
      accessorKey: 'date',
      sortable: true,
      cell: r => (
        <div>
          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">{r.date}</span>
          <p className="text-[11px] text-slate-400">👥 {r.attendanceCount} Siswa Hadir</p>
        </div>
      )
    },
    {
      header: 'Realisasi Anggaran',
      accessorKey: 'totalBudgetSpent',
      cell: r => (
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          Rp {(r.totalBudgetSpent || 0).toLocaleString('id-ID')}
        </span>
      )
    },
    {
      header: 'Status Verifikasi Waka',
      accessorKey: 'status',
      sortable: true,
      cell: r => <StatusBadge status={r.status} />
    },
    {
      header: 'Aksi',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => handlePrintLpj(r)}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 transition-colors"
            title="Cetak Berkas LPJ Resmi Ber-Kop Surat"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak LPJ</span>
          </button>
          {isWakaOrAdmin && (
            <button
              onClick={e => handleOpenReview(r, e)}
              className="px-2 py-1 text-xs font-bold rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 flex items-center gap-1 transition-colors"
              title="Review & Verifikasi Laporan"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Verifikasi</span>
            </button>
          )}
          <button
            onClick={() => handleOpenDetail(r)}
            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-400 transition-colors"
            title="Lihat Detail LPJ"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={e => handleOpenEdit(r, e)}
            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:hover:bg-amber-900 dark:text-amber-400 transition-colors"
            title="Edit Laporan"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={e => handleOpenDelete(r, e)}
            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-400 transition-colors"
            title="Hapus Laporan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  // Columns for Violations Recap
  const violationColumns: Column<StudentViolation>[] = [
    {
      header: 'Identitas Siswa',
      accessorKey: 'studentName',
      sortable: true,
      cell: v => (
        <div>
          <div className="flex items-center gap-1.5">
            {v.studentCode && (
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {v.studentCode}
              </span>
            )}
            <p className="font-bold text-slate-900 dark:text-slate-100">{v.studentName}</p>
          </div>
          <p className="text-[11px] text-slate-400">NIS: {v.studentNis} • Kelas: {v.studentClass}</p>
        </div>
      )
    },
    {
      header: 'Tanggal & Kategori',
      accessorKey: 'date',
      sortable: true,
      cell: v => (
        <div>
          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">{v.date}</span>
          <p className="text-[11px] text-slate-400">{v.category}</p>
        </div>
      )
    },
    {
      header: 'Bentuk Pelanggaran',
      accessorKey: 'violationType',
      cell: v => <span className="text-xs text-slate-700 dark:text-slate-300">{v.violationType}</span>
    },
    {
      header: 'Poin',
      accessorKey: 'points',
      sortable: true,
      cell: v => (
        <span className="font-bold text-xs px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
          +{v.points} Poin
        </span>
      )
    },
    {
      header: 'Tindakan / Sanksi',
      accessorKey: 'actionTaken',
      cell: v => <span className="text-xs text-slate-600 dark:text-slate-400">{v.actionTaken || '-'}</span>
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: v => <StatusBadge status={v.status} />
    }
  ];

  // Columns for Counseling Recap
  const counselingColumns: Column<StudentCounseling>[] = [
    {
      header: 'Nama Siswa & Kelas',
      accessorKey: 'studentName',
      sortable: true,
      cell: c => (
        <div>
          <div className="flex items-center gap-1.5">
            {c.studentCode && (
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {c.studentCode}
              </span>
            )}
            <p className="font-bold text-slate-900 dark:text-slate-100">{c.studentName}</p>
          </div>
          <p className="text-[11px] text-slate-400">Kelas: {c.studentClass}</p>
        </div>
      )
    },
    {
      header: 'Tanggal & Konselor',
      accessorKey: 'date',
      sortable: true,
      cell: c => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800 dark:text-slate-200">{c.date}</span>
          <div className="flex items-center gap-1 mt-0.5">
            {c.counselorCode && (
              <span className="font-mono text-[9px] font-bold px-1 rounded bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                {c.counselorCode}
              </span>
            )}
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Guru: {c.counselorName}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Bidang & Urgensi',
      accessorKey: 'serviceField',
      cell: c => (
        <div>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{c.serviceField || 'Pribadi'}</span>
          <p className="text-[10px] text-slate-400">{c.urgencyLevel || 'Sedang'}</p>
        </div>
      )
    },
    {
      header: 'Topik / Masalah',
      accessorKey: 'topic',
      cell: c => <span className="text-xs text-slate-700 dark:text-slate-300">{c.topic || c.reason || '-'}</span>
    },
    {
      header: 'Hasil / Kesepakatan',
      accessorKey: 'solution',
      cell: c => <span className="text-xs text-slate-600 dark:text-slate-400">{c.solution || c.counselingResult || '-'}</span>
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            <span>Pusat Laporan & Rekapitulasi Kesiswaan</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Rekapitulasi resmi LPJ kegiatan, kedisiplinan poin siswa, layanan bimbingan konseling, dan cetak dokumen kedinasan.
          </p>
        </div>

        {/* Tab Navigasi Laporan */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('lpj')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'lpj'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>LPJ Kegiatan</span>
          </button>
          <button
            onClick={() => setActiveTab('violations')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'violations'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Rekap Pelanggaran</span>
          </button>
          <button
            onClick={() => setActiveTab('counseling')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'counseling'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Rekap Layanan BK</span>
          </button>
          <button
            onClick={() => setActiveTab('ekskul')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'ekskul'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Rekap Ekskul</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: LPJ KEGIATAN & PEMBINA */}
      {/* ========================================================= */}
      {activeTab === 'lpj' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Laporan Pertanggungjawaban (LPJ) Ekstrakurikuler & OSIM
              </h3>
              <p className="text-xs text-slate-500">
                Tahun Pelajaran: <span className="font-bold text-indigo-600">{activeAcademicYear}</span> • Total {activityReports.length} Berkas LPJ
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ExportActions
                filename={`rekap_lpj_kegiatan_${activeAcademicYear?.replace('/', '_')}`}
                title="Daftar Laporan Pertanggungjawaban Kegiatan"
                data={activityReports}
                headers={[
                  { header: 'Kegiatan', key: 'activityTitle' },
                  { header: 'Ekstrakurikuler', key: 'extracurricularName' },
                  { header: 'Pembina', key: 'coachName' },
                  { header: 'Tanggal', key: 'date' },
                  { header: 'Kehadiran Siswa', key: 'attendanceCount' },
                  { header: 'Dana Terpakai (Rp)', key: 'totalBudgetSpent' },
                  { header: 'Status Verifikasi', key: 'status' }
                ]}
              />
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Laporan LPJ</span>
              </button>
            </div>
          </div>

          <DataTable
            id="reports-lpj-table"
            data={activityReports}
            columns={lpjColumns}
            searchPlaceholder="Cari judul kegiatan, nama ekskul, atau pembina..."
            searchableKeys={['activityTitle', 'extracurricularName', 'coachName', 'summary']}
            onRowClick={handleOpenDetail}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: REKAPITULASI PELANGGARAN & DISIPLIN BK */}
      {/* ========================================================= */}
      {activeTab === 'violations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Rekapitulasi Catatan Pelanggaran Kedisiplinan Siswa
              </h3>
              <p className="text-xs text-slate-500">
                Data resmi kesiswaan untuk pemantauan poin sanksi dan tindak lanjut BK
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPrintViolationsOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Rekap Pelanggaran Resmi</span>
              </button>
              <ExportActions
                filename={`rekap_pelanggaran_siswa_${activeAcademicYear?.replace('/', '_')}`}
                title="Rekapitulasi Pelanggaran Kedisiplinan Siswa"
                data={filteredViolations}
                headers={[
                  { header: 'Kode Siswa', key: 'studentCode' },
                  { header: 'Nama Siswa', key: 'studentName' },
                  { header: 'NIS', key: 'studentNis' },
                  { header: 'Kelas', key: 'studentClass' },
                  { header: 'Tanggal', key: 'date' },
                  { header: 'Kategori', key: 'category' },
                  { header: 'Bentuk Pelanggaran', key: 'violationType' },
                  { header: 'Poin', key: 'points' },
                  { header: 'Tindakan', key: 'actionTaken' },
                  { header: 'Status', key: 'status' }
                ]}
              />
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
              <Filter className="w-3.5 h-3.5 text-indigo-500" />
              <span>Filter Kelas:</span>
            </div>
            <select
              value={selectedClassFilter}
              onChange={e => setSelectedClassFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
            >
              <option value="all">Semua Rombel Kelas</option>
              {classList.map(cls => (
                <option key={cls} value={cls}>Kelas {cls}</option>
              ))}
            </select>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-slate-400">Rentang:</span>
              <input
                type="date"
                value={dateFilterStart}
                onChange={e => setDateFilterStart(e.target.value)}
                className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
              <span className="text-slate-400">s/d</span>
              <input
                type="date"
                value={dateFilterEnd}
                onChange={e => setDateFilterEnd(e.target.value)}
                className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
              {(selectedClassFilter !== 'all' || dateFilterStart || dateFilterEnd) && (
                <button
                  onClick={() => {
                    setSelectedClassFilter('all');
                    setDateFilterStart('');
                    setDateFilterEnd('');
                  }}
                  className="text-indigo-600 dark:text-indigo-400 underline font-semibold ml-2"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <DataTable
            id="reports-violations-table"
            data={filteredViolations}
            columns={violationColumns}
            searchPlaceholder="Cari siswa, NIS, bentuk pelanggaran, atau sanksi..."
            searchableKeys={['studentName', 'studentNis', 'studentClass', 'violationType', 'category', 'actionTaken']}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: REKAPITULASI LAYANAN BK */}
      {/* ========================================================= */}
      {activeTab === 'counseling' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Rekapitulasi Layanan Bimbingan & Konseling (BK)
              </h3>
              <p className="text-xs text-slate-500">
                Dokumentasi pembinaan bidang pribadi, sosial, belajar, dan karir peserta didik
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPrintCounselingOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Rekap Layanan BK</span>
              </button>
              <ExportActions
                filename={`rekap_layanan_bk_${activeAcademicYear?.replace('/', '_')}`}
                title="Rekapitulasi Layanan Bimbingan Konseling"
                data={filteredCounseling}
                headers={[
                  { header: 'Kode Siswa', key: 'studentCode' },
                  { header: 'Nama Siswa', key: 'studentName' },
                  { header: 'Kelas', key: 'studentClass' },
                  { header: 'Tanggal', key: 'date' },
                  { header: 'Guru Konselor', key: 'counselorName' },
                  { header: 'Bidang Layanan', key: 'serviceField' },
                  { header: 'Topik Konseling', key: 'topic' },
                  { header: 'Hasil & Solusi', key: 'solution' }
                ]}
              />
            </div>
          </div>

          <DataTable
            id="reports-counseling-table"
            data={filteredCounseling}
            columns={counselingColumns}
            searchPlaceholder="Cari nama siswa, kelas, konselor, topik, atau solusi..."
            searchableKeys={['studentName', 'studentClass', 'counselorName', 'topic', 'solution', 'serviceField']}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: REKAPITULASI EKSKUL & KEANGGOTAAN */}
      {/* ========================================================= */}
      {activeTab === 'ekskul' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Rekapitulasi Cabang Ekstrakurikuler & Keanggotaan
              </h3>
              <p className="text-xs text-slate-500">
                Daftar lengkap cabang bakat minat, guru pembina, dan kuota anggota terdaftar
              </p>
            </div>
            <ExportActions
              filename={`rekap_ekstrakurikuler_${activeAcademicYear?.replace('/', '_')}`}
              title="Rekapitulasi Ekstrakurikuler & Pembina"
              data={extracurriculars}
              headers={[
                { header: 'Kode Ekskul', key: 'id' },
                { header: 'Nama Ekstrakurikuler', key: 'name' },
                { header: 'Kategori', key: 'category' },
                { header: 'Kode Pembina', key: 'coachCode' },
                { header: 'Guru Pembina', key: 'coachName' },
                { header: 'Jadwal Hari', key: 'day' },
                { header: 'Waktu', key: 'startTime' },
                { header: 'Tempat', key: 'location' },
                { header: 'Jumlah Anggota', key: 'memberCount' }
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {extracurriculars.map(ekskul => {
              const activeMembers = members.filter(m => m.extracurricularId === ekskul.id && m.status === 'Aktif');
              return (
                <div
                  key={ekskul.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase">
                        {ekskul.category || 'Pilihan'}
                      </span>
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100 mt-1">
                        {ekskul.name}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-indigo-600">{activeMembers.length}</span>
                      <p className="text-[10px] text-slate-400 font-semibold">Anggota</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <p className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Pembina:</span>
                      {ekskul.coachCode && (
                        <span className="font-mono text-[10px] font-bold px-1 rounded bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                          {ekskul.coachCode}
                        </span>
                      )}
                      <span>{ekskul.coachName}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Jadwal:</span>
                      <span>{ekskul.day}, {ekskul.startTime} - {ekskul.endTime || 'Selesai'}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Lokasi:</span>
                      <span>{ekskul.location}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL PRINT RESMI: LEMBAR LPJ KEGIATAN BER-KOP SURAT */}
      {/* ========================================================= */}
      {isPrintLpjOpen && selectedReport && (
        <Modal
          isOpen={isPrintLpjOpen}
          onClose={() => setIsPrintLpjOpen(false)}
          title="Pratinjau Berkas Cetak LPJ Resmi"
          subtitle="Format cetak standar A4 lengkap dengan Kop Madrasah dan Kolom Tanda Tangan"
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-400">Format Lembar Pertanggungjawaban (A4)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPrintLpjOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  Tutup
                </button>
                <button
                  onClick={executeBrowserPrint}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Dokumen Sekarang</span>
                </button>
              </div>
            </div>
          }
        >
          <div className="bg-white text-slate-900 p-6 rounded-lg font-serif text-[12px] leading-relaxed select-text shadow-sm border border-slate-300">
            {/* Kop Surat Madrasah */}
            <SchoolLetterhead schoolInfo={schoolSetting} compact={true} />

            {/* Judul Dokumen */}
            <div className="text-center my-4">
              <h3 className="font-extrabold text-sm uppercase underline tracking-wide">
                LAPORAN PERTANGGUNGJAWABAN (LPJ) KEGIATAN
              </h3>
              <p className="text-[11px] font-sans font-semibold text-slate-700 mt-0.5">
                Nomor: {selectedReport.id.toUpperCase()}/LPJ-KESISWAAN/{activeAcademicYear?.replace('/', '-') || '2024-2025'}
              </p>
            </div>

            {/* Tabel Identitas Kegiatan */}
            <table className="w-full font-sans text-xs border border-slate-300 mb-4">
              <tbody>
                <tr className="border-b border-slate-300 bg-slate-50">
                  <td className="p-2 font-bold w-1/3">Nama Kegiatan / Agenda</td>
                  <td className="p-2 font-semibold text-indigo-900">{selectedReport.activityTitle}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-2 font-bold">Cabang Ekstrakurikuler / OSIM</td>
                  <td className="p-2">{selectedReport.extracurricularName}</td>
                </tr>
                <tr className="border-b border-slate-300 bg-slate-50">
                  <td className="p-2 font-bold">Guru Pembina / Penanggung Jawab</td>
                  <td className="p-2">{selectedReport.coachName}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-2 font-bold">Waktu & Tanggal Pelaksanaan</td>
                  <td className="p-2">{selectedReport.date}</td>
                </tr>
                <tr className="border-b border-slate-300 bg-slate-50">
                  <td className="p-2 font-bold">Jumlah Kehadiran Anggota</td>
                  <td className="p-2">{selectedReport.attendanceCount} Peserta Didik</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-2 font-bold">Realisasi Dana Terpakai</td>
                  <td className="p-2 font-bold text-emerald-800">
                    Rp {(selectedReport.totalBudgetSpent || 0).toLocaleString('id-ID')}
                  </td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-2 font-bold">Status Persetujuan Waka</td>
                  <td className="p-2 font-bold text-slate-800">{selectedReport.status}</td>
                </tr>
              </tbody>
            </table>

            {/* Narasi Ringkasan */}
            <div className="space-y-3 font-sans text-xs mb-6 text-justify">
              <div>
                <p className="font-bold text-slate-900">A. Ringkasan Jalannya Kegiatan:</p>
                <p className="mt-1 text-slate-800 leading-relaxed pl-3">{selectedReport.summary}</p>
              </div>
              <div>
                <p className="font-bold text-slate-900">B. Capaian & Prestasi Yang Diraih:</p>
                <p className="mt-1 text-slate-800 leading-relaxed pl-3">{selectedReport.achievements || '-'}</p>
              </div>
              <div>
                <p className="font-bold text-slate-900">C. Kendala Pelaksanaan & Solusi Evaluasi:</p>
                <p className="mt-1 text-slate-800 leading-relaxed pl-3">{selectedReport.challenges || '-'}</p>
              </div>
              {selectedReport.feedbackNotes && (
                <div className="p-2.5 rounded bg-slate-100 border border-slate-300">
                  <p className="font-bold text-slate-900">Catatan Verifikasi Waka Kesiswaan:</p>
                  <p className="text-slate-800 italic mt-0.5">{selectedReport.feedbackNotes}</p>
                </div>
              )}
            </div>

            {/* Kolom Tanda Tangan */}
            <div className="flex justify-between items-end pt-4 font-sans text-center text-xs">
              <div>
                <p>Mengetahui,</p>
                <p className="font-bold">Waka Kesiswaan</p>
                <div className="h-16"></div>
                <p className="font-bold underline">{selectedReport.approvedBy || schoolSetting?.wakaName || schoolSetting?.wakaKesiswaanName || 'Waka Kesiswaan'}</p>
                <p className="text-[10px] text-slate-600">NIP. {schoolSetting?.wakaNip || '198205142008011012'}</p>
              </div>

              <div>
                <p>Bula, {selectedReport.date}</p>
                <p className="font-bold">Guru Pembina Kegiatan</p>
                <div className="h-16"></div>
                <p className="font-bold underline">{selectedReport.coachName}</p>
                <p className="text-[10px] text-slate-600">Penanggung Jawab Acara</p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL PRINT RESMI: REKAP PELANGGARAN SISWA */}
      {/* ========================================================= */}
      {isPrintViolationsOpen && (
        <Modal
          isOpen={isPrintViolationsOpen}
          onClose={() => setIsPrintViolationsOpen(false)}
          title="Pratinjau Rekapitulasi Pelanggaran Kedisiplinan"
          subtitle="Dokumen resmi laporan berkala kesiswaan dan bimbingan konseling"
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-400">Total {filteredViolations.length} Catatan Pelanggaran</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPrintViolationsOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  Tutup
                </button>
                <button
                  onClick={executeBrowserPrint}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Rekap Sekarang</span>
                </button>
              </div>
            </div>
          }
        >
          <div className="bg-white text-slate-900 p-6 rounded-lg font-serif text-[11px] leading-relaxed select-text shadow-sm border border-slate-300">
            <SchoolLetterhead schoolInfo={schoolSetting} compact={true} />

            <div className="text-center my-4">
              <h3 className="font-extrabold text-sm uppercase underline tracking-wide">
                REKAPITULASI PELANGGARAN KEDISIPLINAN PESERTA DIDIK
              </h3>
              <p className="text-[11px] font-sans text-slate-700 mt-0.5">
                Tahun Pelajaran: {activeAcademicYear} {selectedClassFilter !== 'all' ? `• Kelas: ${selectedClassFilter}` : ''}
              </p>
            </div>

            <table className="w-full font-sans text-[10px] border-collapse border border-slate-400 mb-6">
              <thead>
                <tr className="bg-slate-100 text-slate-800">
                  <th className="border border-slate-400 p-1.5 text-center w-8">No</th>
                  <th className="border border-slate-400 p-1.5 text-left">Nama Siswa</th>
                  <th className="border border-slate-400 p-1.5 text-center">Kelas</th>
                  <th className="border border-slate-400 p-1.5 text-center">Tanggal</th>
                  <th className="border border-slate-400 p-1.5 text-left">Bentuk Pelanggaran</th>
                  <th className="border border-slate-400 p-1.5 text-center">Poin</th>
                  <th className="border border-slate-400 p-1.5 text-left">Tindakan / Sanksi</th>
                  <th className="border border-slate-400 p-1.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredViolations.slice(0, 30).map((v, idx) => (
                  <tr key={v.id} className="border-b border-slate-300 hover:bg-slate-50">
                    <td className="border border-slate-300 p-1.5 text-center">{idx + 1}</td>
                    <td className="border border-slate-300 p-1.5 font-bold">
                      {v.studentName}
                      <span className="block text-[9px] text-slate-500 font-normal">NIS: {v.studentNis}</span>
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center">{v.studentClass}</td>
                    <td className="border border-slate-300 p-1.5 text-center">{v.date}</td>
                    <td className="border border-slate-300 p-1.5">{v.violationType}</td>
                    <td className="border border-slate-300 p-1.5 text-center font-bold text-rose-700">+{v.points}</td>
                    <td className="border border-slate-300 p-1.5">{v.actionTaken || '-'}</td>
                    <td className="border border-slate-300 p-1.5 text-center">{v.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-end pt-4 font-sans text-center text-xs">
              <div>
                <p>Mengetahui,</p>
                <p className="font-bold">Kepala Madrasah</p>
                <div className="h-16"></div>
                <p className="font-bold underline">{schoolSetting?.principalName || 'Kepala Madrasah'}</p>
                <p className="text-[10px] text-slate-600">NIP. {schoolSetting?.principalNip || '-'}</p>
              </div>

              <div>
                <p>Bula, {new Date().toLocaleDateString('id-ID')}</p>
                <p className="font-bold">Koordinator Guru BK</p>
                <div className="h-16"></div>
                <p className="font-bold underline">{currentUser?.displayName || 'Guru BK'}</p>
                <p className="text-[10px] text-slate-600">Pamong Kedisiplinan</p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL PRINT RESMI: REKAP LAYANAN BK */}
      {/* ========================================================= */}
      {isPrintCounselingOpen && (
        <Modal
          isOpen={isPrintCounselingOpen}
          onClose={() => setIsPrintCounselingOpen(false)}
          title="Pratinjau Rekapitulasi Layanan Bimbingan Konseling"
          subtitle="Format resmi laporan pembinaan siswa untuk arsip madrasah"
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-400">Total {filteredCounseling.length} Sesi Konseling</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPrintCounselingOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  Tutup
                </button>
                <button
                  onClick={executeBrowserPrint}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Rekap Sekarang</span>
                </button>
              </div>
            </div>
          }
        >
          <div className="bg-white text-slate-900 p-6 rounded-lg font-serif text-[11px] leading-relaxed select-text shadow-sm border border-slate-300">
            <SchoolLetterhead schoolInfo={schoolSetting} compact={true} />

            <div className="text-center my-4">
              <h3 className="font-extrabold text-sm uppercase underline tracking-wide">
                REKAPITULASI LAYANAN BIMBINGAN & KONSELING (BK)
              </h3>
              <p className="text-[11px] font-sans text-slate-700 mt-0.5">
                Tahun Pelajaran: {activeAcademicYear}
              </p>
            </div>

            <table className="w-full font-sans text-[10px] border-collapse border border-slate-400 mb-6">
              <thead>
                <tr className="bg-slate-100 text-slate-800">
                  <th className="border border-slate-400 p-1.5 text-center w-8">No</th>
                  <th className="border border-slate-400 p-1.5 text-left">Nama Siswa</th>
                  <th className="border border-slate-400 p-1.5 text-center">Kelas</th>
                  <th className="border border-slate-400 p-1.5 text-center">Tanggal</th>
                  <th className="border border-slate-400 p-1.5 text-left">Bidang</th>
                  <th className="border border-slate-400 p-1.5 text-left">Topik / Kasus</th>
                  <th className="border border-slate-400 p-1.5 text-left">Hasil / Kesepakatan</th>
                  <th className="border border-slate-400 p-1.5 text-left">Guru Konselor</th>
                </tr>
              </thead>
              <tbody>
                {filteredCounseling.slice(0, 30).map((c, idx) => (
                  <tr key={c.id} className="border-b border-slate-300 hover:bg-slate-50">
                    <td className="border border-slate-300 p-1.5 text-center">{idx + 1}</td>
                    <td className="border border-slate-300 p-1.5 font-bold">{c.studentName}</td>
                    <td className="border border-slate-300 p-1.5 text-center">{c.studentClass}</td>
                    <td className="border border-slate-300 p-1.5 text-center">{c.date}</td>
                    <td className="border border-slate-300 p-1.5 font-semibold text-indigo-800">{c.serviceField || 'Pribadi'}</td>
                    <td className="border border-slate-300 p-1.5">{c.topic || c.reason || '-'}</td>
                    <td className="border border-slate-300 p-1.5">{c.solution || c.counselingResult || '-'}</td>
                    <td className="border border-slate-300 p-1.5">{c.counselorName}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-end pt-4 font-sans text-center text-xs">
              <div>
                <p>Mengetahui,</p>
                <p className="font-bold">Waka Kesiswaan</p>
                <div className="h-16"></div>
                <p className="font-bold underline">{schoolSetting?.wakaName || schoolSetting?.wakaKesiswaanName || 'Waka Kesiswaan'}</p>
                <p className="text-[10px] text-slate-600">NIP. {schoolSetting?.wakaNip || '-'}</p>
              </div>

              <div>
                <p>Bula, {new Date().toLocaleDateString('id-ID')}</p>
                <p className="font-bold">Guru Bimbingan Konseling</p>
                <div className="h-16"></div>
                <p className="font-bold underline">{currentUser?.displayName || 'Guru BK'}</p>
                <p className="text-[10px] text-slate-600">Konselor Madrasah</p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* FORM MODAL LPJ (ADD / EDIT) */}
      {/* ========================================================= */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedReport ? 'Edit Laporan Kegiatan' : 'Buat Laporan Kegiatan Baru (LPJ)'}
        subtitle="Laporkan hasil kegiatan latihan, event, kejuaraan, atau program kerja"
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
              type="submit"
              form="report-form"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
            >
              Simpan & Ajukan LPJ
            </button>
          </>
        }
      >
        <form id="report-form" onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Judul Kegiatan / Agenda *
            </label>
            <input
              type="text"
              required
              value={formData.activityTitle}
              onChange={e => setFormData({ ...formData, activityTitle: e.target.value })}
              placeholder="Contoh: Latihan Gabungan PMR & Simulasi Tanggap Bencana"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cabang Ekstrakurikuler / OSIM *
              </label>
              <select
                required
                value={formData.extracurricularId}
                onChange={e => {
                  const sel = extracurriculars.find(item => item.id === e.target.value);
                  setFormData({
                    ...formData,
                    extracurricularId: e.target.value,
                    extracurricularName: sel?.name || '',
                    coachName: sel?.coachName || formData.coachName
                  });
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="">Pilih Ekstrakurikuler...</option>
                {extracurriculars.map(ekskul => (
                  <option key={ekskul.id} value={ekskul.id}>
                    {ekskul.name} (Pembina: {ekskul.coachName})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Guru Pembina / Pelapor *
              </label>
              <input
                type="text"
                required
                value={formData.coachName}
                onChange={e => setFormData({ ...formData, coachName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Pelaksanaan *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jumlah Kehadiran Siswa
              </label>
              <input
                type="number"
                value={formData.attendanceCount}
                onChange={e => setFormData({ ...formData, attendanceCount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Realisasi Dana (Rp)
              </label>
              <input
                type="number"
                value={formData.totalBudgetSpent}
                onChange={e => setFormData({ ...formData, totalBudgetSpent: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ringkasan Jalannya Kegiatan & Hasil *
            </label>
            <textarea
              rows={3}
              required
              value={formData.summary}
              onChange={e => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Jelaskan jalannya acara, keikutsertaan siswa, dan capaian target..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Prestasi / Output Yang Dicapai
              </label>
              <textarea
                rows={2}
                value={formData.achievements}
                onChange={e => setFormData({ ...formData, achievements: e.target.value })}
                placeholder="Pencapaian atau hasil positif..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kendala & Catatan Evaluasi
              </label>
              <textarea
                rows={2}
                value={formData.challenges}
                onChange={e => setFormData({ ...formData, challenges: e.target.value })}
                placeholder="Kendala yang dihadapi dan saran perbaikan..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* REVIEW MODAL (WAKA KESISWAAN) */}
      <Modal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        title="Verifikasi & Persetujuan Laporan (Waka)"
        subtitle={`Laporan: ${selectedReport?.activityTitle} (${selectedReport?.extracurricularName})`}
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsReviewOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveReview}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
            >
              Simpan Keputusan Verifikasi
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Keputusan Status *
            </label>
            <select
              value={reviewStatus}
              onChange={e => setReviewStatus(e.target.value as ReportStatus)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            >
              <option value="Disetujui">Disetujui (ACC)</option>
              <option value="Revisi">Perlu Revisi</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Pembinaan / Feedback Waka Kesiswaan
            </label>
            <textarea
              rows={3}
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
              placeholder="Berikan catatan perbaikan atau apresiasi kepada pembina..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>
      </Modal>

      {/* DETAIL MODAL */}
      {selectedReport && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Detail LPJ: ${selectedReport.activityTitle}`}
          subtitle={`${selectedReport.extracurricularName} • Pembina: ${selectedReport.coachName}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                onClick={() => {
                  setIsDetailOpen(false);
                  setIsPrintLpjOpen(true);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Pratinjau Cetak LPJ</span>
              </button>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-white"
              >
                Tutup
              </button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500">Status Verifikasi:</span>
                <StatusBadge status={selectedReport.status} />
              </div>
              <p><strong>Tanggal Kegiatan:</strong> {selectedReport.date}</p>
              <p><strong>Jumlah Siswa Hadir:</strong> {selectedReport.attendanceCount} Orang</p>
              <p><strong>Dana Digunakan:</strong> Rp {(selectedReport.totalBudgetSpent || 0).toLocaleString('id-ID')}</p>
              <p className="mt-2"><strong>Ringkasan:</strong> {selectedReport.summary}</p>
              <p><strong>Capaian / Prestasi:</strong> {selectedReport.achievements || '-'}</p>
              <p><strong>Kendala:</strong> {selectedReport.challenges || '-'}</p>
              {selectedReport.feedbackNotes && (
                <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
                  <p className="font-bold text-amber-800 dark:text-amber-300">Catatan Waka:</p>
                  <p className="text-amber-900 dark:text-amber-200">{selectedReport.feedbackNotes}</p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Laporan Kegiatan"
        message={`Apakah Anda yakin ingin menghapus laporan "${selectedReport?.activityTitle}"?`}
        confirmText="Hapus Laporan"
      />
    </div>
  );
};
