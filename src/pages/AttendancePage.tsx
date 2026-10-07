import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardCheck,
  Calendar,
  CheckCircle2,
  Users,
  Compass,
  FileSpreadsheet,
  Check,
  Clock,
  Filter,
  Eye,
  Trash2,
  Printer,
  Sparkles,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { AttendanceRecord, AttendanceItem, AttendanceStatus, Schedule } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';
import { cleanDigits } from '../utils/syncUtils';

interface AttendancePageProps {
  initialSchedule?: Schedule | null;
}

export const AttendancePage: React.FC<AttendancePageProps> = ({ initialSchedule }) => {
  const { isWakaOrAdmin, isPembina, currentUser } = useAuth();
  const { toast } = useToast();
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const {
    attendance,
    members,
    extracurriculars,
    teachers,
    addAttendanceRecord,
    deleteAttendanceRecord,
    activeAcademicYear
  } = useSchool();

  // Mode: 'input' (Active Session Presensi) or 'history' (Riwayat)
  const [activeTab, setActiveTab] = useState<'input' | 'history'>('input');

  // Find teacher's assigned extracurriculars based on currentUser profile or name in teachers list
  const userTeacher = useMemo(() => {
    if (!currentUser) return null;
    return teachers.find(
      t =>
        (currentUser.nip && t.nip && t.nip !== '-' && cleanDigits(t.nip) === cleanDigits(currentUser.nip)) ||
        (currentUser.uid && (t.id === currentUser.uid || `user_${t.id}` === currentUser.uid || t.id === currentUser.uid.replace('user_', ''))) ||
        t.fullName.toLowerCase() === currentUser.displayName.toLowerCase() ||
        (currentUser.displayName && (t.fullName.toLowerCase().includes(currentUser.displayName.toLowerCase()) || currentUser.displayName.toLowerCase().includes(t.fullName.toLowerCase()))) ||
        (currentUser.email && t.email && t.email.toLowerCase() === currentUser.email.toLowerCase())
    );
  }, [currentUser, teachers]);

  // Determine assigned extracurriculars for the user/teacher
  const assignedExtracurriculars = useMemo(() => {
    // 1. Check currentUser.extracurricularIds
    if (currentUser?.extracurricularIds && currentUser.extracurricularIds.length > 0) {
      const matched = extracurriculars.filter(e => currentUser.extracurricularIds!.includes(e.id));
      if (matched.length > 0) return matched;
    }

    // 2. Check userTeacher assignedExtracurriculars or extracurricularName
    if (userTeacher) {
      const assignedNames = [
        ...(userTeacher.assignedExtracurriculars || []),
        ...(userTeacher.extracurricularName ? [userTeacher.extracurricularName] : [])
      ].map(n => n.toLowerCase().trim());

      const matched = extracurriculars.filter(
        e =>
          e.coachId === userTeacher.id ||
          e.coachName.toLowerCase().includes(userTeacher.fullName.toLowerCase()) ||
          userTeacher.fullName.toLowerCase().includes(e.coachName.toLowerCase()) ||
          assignedNames.some(name => e.name.toLowerCase().includes(name) || name.includes(e.name.toLowerCase()))
      );
      if (matched.length > 0) return matched;
    }

    // 3. Match by currentUser displayName in coachName of extracurricular
    if (currentUser?.displayName) {
      const matched = extracurriculars.filter(
        e =>
          e.coachName.toLowerCase().includes(currentUser.displayName.toLowerCase()) ||
          currentUser.displayName.toLowerCase().includes(e.coachName.toLowerCase())
      );
      if (matched.length > 0) return matched;
    }

    // Fallback: If waka/admin, default to full list; otherwise empty or first
    return extracurriculars;
  }, [currentUser, userTeacher, extracurriculars]);

  // Primary active extracurricular automatically selected based on assignment
  const activeEkskul = useMemo(() => {
    if (initialSchedule?.extracurricularId) {
      const found = extracurriculars.find(e => e.id === initialSchedule.extracurricularId);
      if (found) return found;
    }
    // Pick the first assigned extracurricular
    return assignedExtracurriculars[0] || extracurriculars[0] || null;
  }, [initialSchedule, assignedExtracurriculars, extracurriculars]);

  // Input Form State
  const [selectedEkskulId, setSelectedEkskulId] = useState<string>(
    activeEkskul?.id || ''
  );

  // Sync selectedEkskulId whenever activeEkskul updates (e.g. data loaded)
  React.useEffect(() => {
    if (activeEkskul && (!selectedEkskulId || !extracurriculars.some(e => e.id === selectedEkskulId))) {
      setSelectedEkskulId(activeEkskul.id);
    }
  }, [activeEkskul, extracurriculars, selectedEkskulId]);

  const currentEkskul = useMemo(() => {
    return extracurriculars.find(e => e.id === selectedEkskulId) || activeEkskul;
  }, [extracurriculars, selectedEkskulId, activeEkskul]);

  const [sessionDate, setSessionDate] = useState<string>(
    initialSchedule?.date || new Date().toISOString().split('T')[0]
  );
  const [meetingTopic, setMeetingTopic] = useState<string>(
    initialSchedule?.title || 'Latihan Rutin & Evaluasi Teknik'
  );
  const [coachName, setCoachName] = useState<string>(
    initialSchedule?.coachName || currentEkskul?.coachName || currentUser?.displayName || 'Guru Pembina'
  );

  // Sync coachName when currentEkskul changes
  React.useEffect(() => {
    if (currentEkskul?.coachName) {
      setCoachName(currentEkskul.coachName);
    }
  }, [currentEkskul]);

  // Active members for chosen ekskul (Sorted Alphabetically by Student Name)
  const isPembinaOnly = isPembina && !isWakaOrAdmin;
  const historyData = useMemo(() => {
    if (!isPembinaOnly) return attendance;
    const assignedIds = new Set(assignedExtracurriculars.map(e => e.id));
    const assignedNames = new Set(assignedExtracurriculars.map(e => e.name.toLowerCase().trim()));
    return attendance.filter(r => 
      assignedIds.has(r.extracurricularId) || 
      assignedNames.has((r.extracurricularName || '').toLowerCase().trim())
    );
  }, [attendance, isPembinaOnly, assignedExtracurriculars]);

  // Active members for chosen ekskul (Sorted Alphabetically by Student Name)
  const activeEkskulMembers = useMemo(() => {
    return members
      .filter(m => m.extracurricularId === selectedEkskulId && m.status === 'Aktif')
      .sort((a, b) => (a.studentName || '').localeCompare(b.studentName || '', 'id', { sensitivity: 'base' }));
  }, [members, selectedEkskulId]);

  // Attendance Map: studentId -> { status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa', notes: string }
  const [attendanceState, setAttendanceState] = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});

  // Initialize or reset attendance state when ekskul or member list changes
  React.useEffect(() => {
    const initialState: Record<string, { status: AttendanceStatus; notes: string }> = {};
    activeEkskulMembers.forEach(m => {
      initialState[m.studentId] = { status: 'Hadir', notes: '' };
    });
    setAttendanceState(initialState);
  }, [selectedEkskulId, activeEkskulMembers]);

  // Summary counts
  const summary = useMemo(() => {
    let hadir = 0;
    let izin = 0;
    let sakit = 0;
    let alpa = 0;

    (Object.values(attendanceState) as Array<{ status: AttendanceStatus; notes: string }>).forEach(item => {
      if (item.status === 'Hadir') hadir++;
      else if (item.status === 'Izin') izin++;
      else if (item.status === 'Sakit') sakit++;
      else if (item.status === 'Alpa') alpa++;
    });

    const total = activeEkskulMembers.length;
    const rate = total > 0 ? Math.round((hadir / total) * 100) : 0;

    return { hadir, izin, sakit, alpa, total, rate };
  }, [attendanceState, activeEkskulMembers]);

  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleSetNotes = (studentId: string, notes: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes
      }
    }));
  };

  const handleSetAllHadir = () => {
    const updated: Record<string, { status: AttendanceStatus; notes: string }> = {};
    activeEkskulMembers.forEach(m => {
      updated[m.studentId] = {
        status: 'Hadir',
        notes: attendanceState[m.studentId]?.notes || ''
      };
    });
    setAttendanceState(updated);
  };

  const handleSaveAttendance = async () => {
    if (activeEkskulMembers.length === 0) {
      toast.warning('Tidak ada anggota aktif pada ekstrakurikuler ini.');
      return;
    }

    setIsSavingAttendance(true);
    try {
      const currentEkskul = extracurriculars.find(e => e.id === selectedEkskulId);

      const items: AttendanceItem[] = activeEkskulMembers.map(m => ({
        studentId: m.studentId,
        studentName: m.studentName,
        studentClass: m.studentClass,
        studentNis: m.studentNis,
        status: attendanceState[m.studentId]?.status || 'Hadir',
        notes: attendanceState[m.studentId]?.notes || ''
      }));

      await addAttendanceRecord({
        extracurricularId: selectedEkskulId,
        extracurricularName: currentEkskul?.name || 'Ekstrakurikuler',
        date: sessionDate,
        meetingTopic: meetingTopic || 'Latihan Rutin',
        coachName: coachName,
        totalMembers: activeEkskulMembers.length,
        presentCount: summary.hadir,
        permissionCount: summary.izin,
        sickCount: summary.sakit,
        absentCount: summary.alpa,
        academicYear: activeAcademicYear,
        items
      });

      toast.success('Presensi pertemuan berhasil disimpan!');
      setActiveTab('history');
    } catch (err: any) {
      console.error('Error saving attendance:', err);
      toast.error('Gagal menyimpan presensi: ' + (err?.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsSavingAttendance(false);
    }
  };

  // History & Detail View
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const historyColumns: Column<AttendanceRecord>[] = [
    {
      header: 'Tanggal & Sesi Pertemuan',
      accessorKey: 'date',
      sortable: true,
      cell: r => (
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100">{r.meetingTopic}</p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">📅 {r.date} • {r.extracurricularName}</p>
        </div>
      )
    },
    {
      header: 'Pembina',
      accessorKey: 'coachName',
      cell: r => <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">👤 {r.coachName}</span>
    },
    {
      header: 'Kehadiran (H / I / S / A)',
      cell: r => (
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            H: {r.presentCount}
          </span>
          <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
            I: {r.permissionCount}
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
            S: {r.sickCount}
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
            A: {r.absentCount}
          </span>
        </div>
      )
    },
    {
      header: 'Tingkat Partisipasi',
      cell: r => {
        const rate = r.totalMembers > 0 ? Math.round((r.presentCount / r.totalMembers) * 100) : 0;
        return (
          <span className={`text-xs font-extrabold ${rate >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {rate}% ({r.presentCount}/{r.totalMembers})
          </span>
        );
      }
    },
    {
      header: 'Aksi',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => {
              setSelectedRecord(r);
              setIsDetailOpen(true);
            }}
            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-400 transition-colors"
            title="Lihat Lembar Presensi"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedRecord(r);
              setIsDetailOpen(true);
              setTimeout(() => window.print(), 300);
            }}
            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-400 transition-colors"
            title="Cetak Lembar Presensi"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedRecord(r);
              setIsDeleteOpen(true);
            }}
            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-400 transition-colors"
            title="Hapus Rekap Presensi"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Presensi & Kehadiran Ekstrakurikuler
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Lembar pencatatan presensi digital per pertemuan latihan, rekapitulasi kehadiran, dan tingkat keaktifan siswa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('input')}
              className={`relative px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'input' ? 'text-white font-semibold' : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-bold'
              }`}
            >
              {activeTab === 'input' && (
                <motion.div
                  layoutId="activeAttendanceTabIndicator"
                  className="absolute inset-0 bg-indigo-600 rounded-lg shadow-xs z-0"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4" />
                <span>Input Presensi Sesi</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`relative px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'history' ? 'text-white font-semibold' : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-bold'
              }`}
            >
              {activeTab === 'history' && (
                <motion.div
                  layoutId="activeAttendanceTabIndicator"
                  className="absolute inset-0 bg-indigo-600 rounded-lg shadow-xs z-0"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Riwayat Rekap ({attendance.length})</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* =========================================================================
            TAB 1: LIVE PRESENSI INPUT
        ========================================================================= */}
        {activeTab === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="space-y-6"
          >
            {/* Sesi Configuration Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-500" />
              <span>Parameter Sesi Latihan</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Ekstrakurikuler
                  </label>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    {assignedExtracurriculars.length > 1 ? `Multi-Binaan (${assignedExtracurriculars.length})` : 'Otomatis Sesuai Binaan'}
                  </span>
                </div>
                
                {assignedExtracurriculars.length > 1 || isWakaOrAdmin ? (
                  <select
                    value={selectedEkskulId}
                    onChange={e => setSelectedEkskulId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-indigo-300 dark:border-indigo-700 font-bold text-xs text-slate-900 dark:text-slate-100 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {(isWakaOrAdmin ? extracurriculars : assignedExtracurriculars).map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.category} - Hari {e.day})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
                      <div className="truncate">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs truncate block">
                          {currentEkskul?.name || 'Ekstrakurikuler Binaan'}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-medium">
                          Kategori: {currentEkskul?.category || 'Umum'} • Hari {currentEkskul?.day || 'Rutin'}
                        </span>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 ml-2" />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Pertemuan *
                </label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={e => setSessionDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Guru Pembina / Pelatih
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Auto-Fill</span>
                </div>
                <input
                  type="text"
                  value={coachName}
                  onChange={e => setCoachName(e.target.value)}
                  placeholder="Nama Pembina..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Materi / Agenda Sesi
                </label>
                <input
                  type="text"
                  value={meetingTopic}
                  onChange={e => setMeetingTopic(e.target.value)}
                  placeholder="Contoh: Drill Fisik & Taktik Bertahan"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            {/* Live Counters & Quick Action */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                <span className="text-slate-500">Rekap Real-time:</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Hadir: {summary.hadir}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  Izin: {summary.izin}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Sakit: {summary.sakit}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  Alpa: {summary.alpa}
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  Tingkat: <strong className="text-indigo-600">{summary.rate}%</strong> ({summary.hadir}/{summary.total})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSetAllHadir}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  ✓ Set Semua Hadir
                </button>
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={activeEkskulMembers.length === 0 || isSavingAttendance}
                  className="px-5 py-2 text-xs font-extrabold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5 transition-all hover:scale-105 disabled:cursor-not-allowed"
                >
                  {isSavingAttendance ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan Presensi...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Presensi Pertemuan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Members Attendance Sheet Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Lembar Presensi Anggota Aktif ({activeEkskulMembers.length} Siswa)
              </h4>
            </div>

            {activeEkskulMembers.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Belum ada anggota terdaftar</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Daftarkan siswa terlebih dahulu di menu "Anggota Ekskul".</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px] font-semibold">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4">Nama Siswa & NIS</th>
                      <th className="py-3 px-4">Kelas</th>
                      <th className="py-3 px-4 text-center">Status Kehadiran</th>
                      <th className="py-3 px-4">Keterangan / Alasan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeEkskulMembers.map((member, idx) => {
                      const currentStatus = attendanceState[member.studentId]?.status || 'Hadir';
                      const currentNotes = attendanceState[member.studentId]?.notes || '';

                      return (
                        <tr key={member.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400 font-semibold">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900 dark:text-slate-100">{member.studentName}</p>
                            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">NIS: {member.studentNis}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-slate-600 dark:text-slate-300">
                              {member.studentClass}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {(['Hadir', 'Izin', 'Sakit', 'Alpa'] as AttendanceStatus[]).map(st => {
                                const isSelected = currentStatus === st;
                                const colors = {
                                  Hadir: isSelected ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold',
                                  Izin: isSelected ? 'bg-sky-600 text-white font-bold shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-700 dark:hover:text-sky-300 font-bold',
                                  Sakit: isSelected ? 'bg-amber-600 text-white font-bold shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-300 font-bold',
                                  Alpa: isSelected ? 'bg-rose-600 text-white font-bold shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 font-bold'
                                }[st];

                                return (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => handleSetStatus(member.studentId, st)}
                                    className={`px-3 py-1.5 rounded-xl text-xs transition-all ${colors}`}
                                  >
                                    {st.charAt(0)}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={currentNotes}
                              onChange={e => handleSetNotes(member.studentId, e.target.value)}
                              placeholder="Keterangan..."
                              className="w-full px-2.5 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* =========================================================================
          TAB 2: RIWAYAT REKAPITULASI
      ========================================================================= */}
      {activeTab === 'history' && (
        <motion.div
          key="history"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="space-y-4"
        >
          <DataTable
            id="attendance-history-table"
            data={historyData}
            columns={historyColumns}
            searchPlaceholder="Cari sesi pertemuan atau nama ekstrakurikuler..."
            searchableKeys={['meetingTopic', 'extracurricularName', 'coachName', 'date']}
            emptyTitle="Belum Ada Rekap Presensi"
            emptySubtitle="Sesi presensi yang Anda simpan akan tersimpan dan dapat dicetak di sini."
          />
        </motion.div>
      )}
      </AnimatePresence>

      {/* Detail Modal for Past Attendance Record */}
      {selectedRecord && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Lembar Presensi: ${selectedRecord.meetingTopic}`}
          subtitle={`${selectedRecord.extracurricularName} • Tanggal: ${selectedRecord.date} • Pembina: ${selectedRecord.coachName}`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembar Presensi</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors"
              >
                Tutup
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Header Stat Pills */}
            <div className="flex flex-wrap gap-2 text-xs font-bold p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800">Hadir: {selectedRecord.presentCount}</span>
              <span className="px-2.5 py-1 rounded bg-sky-100 text-sky-800">Izin: {selectedRecord.permissionCount}</span>
              <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800">Sakit: {selectedRecord.sickCount}</span>
              <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-800">Alpa: {selectedRecord.absentCount}</span>
            </div>

            <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
              {selectedRecord.items.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{item.studentName}</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Kelas: {item.studentClass} {item.notes && `• Ket: ${item.notes}`}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={async () => {
          if (selectedRecord) {
            await deleteAttendanceRecord(selectedRecord.id);
            setIsDeleteOpen(false);
            setSelectedRecord(null);
          }
        }}
        title="Hapus Rekap Presensi"
        message={`Apakah Anda yakin ingin menghapus catatan presensi tanggal ${selectedRecord?.date} (${selectedRecord?.meetingTopic})?`}
        confirmText="Hapus Presensi"
      />
    </div>
  );
};
