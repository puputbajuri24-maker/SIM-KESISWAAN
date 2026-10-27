import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  HeartHandshake,
  Home,
  Mail,
  Calendar,
  Eye,
  Star,
  Settings,
  X,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  TrendingDown,
  Info,
  Clock,
  Sparkles,
  ClipboardCheck,
  Check,
  Download,
  CalendarDays,
  FileText,
  RotateCcw,
  Lock,
  ArrowRight,
  Save,
  CheckCheck
} from 'lucide-react';
import {
  SchoolClass,
  Student,
  AttendanceSession,
  StudentPermission,
  StudentCounseling,
  HomeVisitRecord,
  ParentCallLetter,
  AttendanceStatus,
  AttendanceRecordItem
} from '../../types';
import {
  calculateStudentAttendanceStats,
  calculateClassAttendanceSummaries,
  getGuruBkAssignedClasses,
  saveGuruBkAssignedClasses,
  StudentAttendanceStats,
  ClassAttendanceSummary
} from '../../utils/attendanceMonitoring';
import { isStudentInClass } from '../../utils/classResolver';
import { StatusBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { SchoolLetterhead } from '../common/SchoolLetterhead';
import { useSchool } from '../../contexts/SchoolContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface BkAttendanceMonitoringTabProps {
  students: Student[];
  classes: SchoolClass[];
  attendance: AttendanceSession[];
  permissions: StudentPermission[];
  counseling?: StudentCounseling[];
  counselings?: StudentCounseling[];
  homeVisits: HomeVisitRecord[];
  parentCallLetters: ParentCallLetter[];
  activeAcademicYear: string;
  onInitiateCounseling: (student: StudentAttendanceStats) => void;
  onInitiateHomeVisit: (student: StudentAttendanceStats) => void;
  onInitiateParentCall: (student: StudentAttendanceStats) => void;
}

type ViewMode = 'rekap' | 'input_harian';
type DatePreset = 'all' | 'today' | '7days' | 'this_month' | 'custom';

interface DailyStudentRow {
  studentId: string;
  studentNis: string;
  studentName: string;
  gender?: 'L' | 'P';
  status: AttendanceStatus;
  notes: string;
}

export const BkAttendanceMonitoringTab: React.FC<BkAttendanceMonitoringTabProps> = ({
  students,
  classes,
  attendance,
  permissions,
  counseling: propCounseling,
  counselings: propCounselings,
  homeVisits,
  parentCallLetters,
  activeAcademicYear,
  onInitiateCounseling,
  onInitiateHomeVisit,
  onInitiateParentCall
}) => {
  const counseling = propCounseling || propCounselings || [];
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { addAttendanceRecord, schoolSetting, activeSemester } = useSchool();

  // Mode View: Rekap & EWS vs Input Presensi Harian
  const [viewMode, setViewMode] = useState<ViewMode>('rekap');

  // Assigned BK Classes (saved per Guru BK user)
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>(() => {
    return getGuruBkAssignedClasses(currentUser?.uid);
  });

  // Selected class in Grid: 'all' | classId
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [onlyMyClasses, setOnlyMyClasses] = useState<boolean>(false);
  const [gradeFilter, setGradeFilter] = useState<'all' | 'X' | 'XI' | 'XII'>('all');
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'critical' | 'warning' | 'safe' | 'alpa'>('all');

  // Filter Rentang Tanggal Rekap
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Modals
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [detailStudent, setDetailStudent] = useState<StudentAttendanceStats | null>(null);
  const [tempAssignedIds, setTempAssignedIds] = useState<string[]>(assignedClassIds);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);

  // --- STATE KHUSUS INPUT PRESENSI HARIAN ---
  // Mandatory: Guru BK WAJIB memilih tanggal presensi dahulu sebelum presensi
  const [attendanceDate, setAttendanceDate] = useState<string>('');
  const [dailyTargetClassId, setDailyTargetClassId] = useState<string>('');
  const [dailyStudentRows, setDailyStudentRows] = useState<DailyStudentRow[]>([]);
  const [existingSessionFound, setExistingSessionFound] = useState<AttendanceSession | null>(null);
  const [isSavingDaily, setIsSavingDaily] = useState<boolean>(false);
  const [isDirtyDaily, setIsDirtyDaily] = useState<boolean>(false);

  // Auto initialize dailyTargetClassId if not set
  useEffect(() => {
    if (!dailyTargetClassId && classes.length > 0) {
      if (selectedClassId !== 'all') {
        setDailyTargetClassId(selectedClassId);
      } else if (assignedClassIds.length > 0) {
        setDailyTargetClassId(assignedClassIds[0]);
      } else {
        setDailyTargetClassId(classes[0].id);
      }
    }
  }, [dailyTargetClassId, selectedClassId, assignedClassIds, classes]);

  // Compute effective date range for recap filter
  const effectiveDateRange = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    if (datePreset === 'all') return undefined;
    if (datePreset === 'today') return { startDate: today, endDate: today };
    if (datePreset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return { startDate: d.toISOString().split('T')[0], endDate: today };
    }
    if (datePreset === 'this_month') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      return { startDate: firstDay, endDate: lastDay };
    }
    if (datePreset === 'custom') {
      return {
        startDate: customStartDate || undefined,
        endDate: customEndDate || undefined
      };
    }
    return undefined;
  }, [datePreset, customStartDate, customEndDate]);

  // Compute stats per student (with date range support)
  const allStudentStats = useMemo(() => {
    return calculateStudentAttendanceStats(
      students,
      attendance,
      permissions,
      counseling,
      homeVisits,
      parentCallLetters,
      effectiveDateRange
    );
  }, [students, attendance, permissions, counseling, homeVisits, parentCallLetters, effectiveDateRange]);

  // Compute class summaries for Grid
  const classSummaries = useMemo(() => {
    return calculateClassAttendanceSummaries(classes, students, allStudentStats, assignedClassIds);
  }, [classes, students, allStudentStats, assignedClassIds]);

  // Filtered classes for Grid display
  const displayedClasses = useMemo(() => {
    return classSummaries.filter(cls => {
      if (gradeFilter !== 'all' && cls.grade !== gradeFilter) return false;
      if (onlyMyClasses && assignedClassIds.length > 0) {
        return assignedClassIds.includes(cls.classId) || assignedClassIds.includes(cls.className);
      }
      return true;
    });
  }, [classSummaries, gradeFilter, onlyMyClasses, assignedClassIds]);

  // Filtered Students for the Table
  const filteredStudents = useMemo(() => {
    return allStudentStats.filter(st => {
      // 1. Class filter from selection
      if (selectedClassId !== 'all') {
        const targetClass = classes.find(c => c.id === selectedClassId || c.name === selectedClassId);
        if (targetClass) {
          const inClass = isStudentInClass({ studentClass: st.studentClass }, targetClass.name, classes) || st.classId === targetClass.id;
          if (!inClass) return false;
        }
      } else if (onlyMyClasses && assignedClassIds.length > 0) {
        const inAnyAssigned = assignedClassIds.some(cId => {
          const target = classes.find(c => c.id === cId || c.name === cId);
          return target && (isStudentInClass({ studentClass: st.studentClass }, target.name, classes) || st.classId === target.id);
        });
        if (!inAnyAssigned) return false;
      }

      // 2. Risk filter
      if (riskFilter === 'critical' && st.riskLevel !== 'critical') return false;
      if (riskFilter === 'warning' && st.riskLevel !== 'warning') return false;
      if (riskFilter === 'safe' && st.riskLevel !== 'safe') return false;
      if (riskFilter === 'alpa' && st.alpa === 0) return false;

      // 3. Search query
      if (searchStudent.trim()) {
        const q = searchStudent.toLowerCase().trim();
        const matchName = st.studentName.toLowerCase().includes(q);
        const matchNis = st.studentNis.toLowerCase().includes(q);
        const matchClass = st.studentClass.toLowerCase().includes(q);
        if (!matchName && !matchNis && !matchClass) return false;
      }

      return true;
    }).sort((a, b) => {
      // Prioritize critical students first
      if (b.alpa !== a.alpa) return b.alpa - a.alpa;
      if (a.rate !== b.rate) return a.rate - b.rate;
      return a.studentName.localeCompare(b.studentName);
    });
  }, [allStudentStats, selectedClassId, onlyMyClasses, assignedClassIds, riskFilter, searchStudent, classes]);

  // Active selected class object (if single class selected)
  const activeClassObj = useMemo(() => {
    if (selectedClassId === 'all') return null;
    return classes.find(c => c.id === selectedClassId || c.name === selectedClassId) || null;
  }, [selectedClassId, classes]);

  // Active target class object for Daily Input
  const dailyClassObj = useMemo(() => {
    if (!dailyTargetClassId) return classes[0] || null;
    return classes.find(c => c.id === dailyTargetClassId || c.name === dailyTargetClassId) || null;
  }, [dailyTargetClassId, classes]);

  // Active class summary
  const activeClassSummary = useMemo(() => {
    if (selectedClassId === 'all') return null;
    return classSummaries.find(cs => cs.classId === selectedClassId || cs.className === selectedClassId) || null;
  }, [selectedClassId, classSummaries]);

  // Overview stats across all currently filtered students
  const overviewMetrics = useMemo(() => {
    let total = filteredStudents.length;
    let criticalCount = 0;
    let warningCount = 0;
    let totalAlpa = 0;
    let totalIzin = 0;
    let totalSakit = 0;
    let sumRate = 0;

    filteredStudents.forEach(st => {
      if (st.riskLevel === 'critical') criticalCount++;
      else if (st.riskLevel === 'warning') warningCount++;
      totalAlpa += st.alpa;
      totalIzin += st.izin;
      totalSakit += st.sakit;
      sumRate += st.rate;
    });

    const avgRate = total > 0 ? Math.round(sumRate / total) : 100;
    return { total, criticalCount, warningCount, totalAlpa, totalIzin, totalSakit, avgRate };
  }, [filteredStudents]);

  // Populate or reload daily student rows when dailyClassObj or attendanceDate changes
  useEffect(() => {
    if (!dailyClassObj) return;

    // Get all students in this class
    const classStudents = students.filter(
      s => isStudentInClass(s, dailyClassObj.name, classes) || s.classId === dailyClassObj.id
    );

    if (!attendanceDate) {
      // If date is not selected yet, student rows are kept unpopulated or uneditable
      setDailyStudentRows([]);
      setExistingSessionFound(null);
      return;
    }

    // Check if an existing attendance session exists for this class on this date
    const foundSession = attendance.find(a => {
      const matchDate = a.date === attendanceDate;
      const matchClass =
        a.extracurricularId === `class_att_${dailyClassObj.id}` ||
        a.extracurricularName?.includes(dailyClassObj.name) ||
        a.topic?.includes(dailyClassObj.name) ||
        a.notes?.includes(dailyClassObj.name);
      return matchDate && matchClass;
    });

    setExistingSessionFound(foundSession || null);

    const rows: DailyStudentRow[] = classStudents.map(st => {
      let status: AttendanceStatus = 'Hadir';
      let notes = '';

      if (foundSession) {
        const records = foundSession.records || foundSession.items || [];
        const rec = records.find(
          r =>
            (r.studentId && r.studentId === st.id) ||
            (r.studentNis && st.nis && r.studentNis.trim() === st.nis.trim()) ||
            (r.studentName && st.fullName && r.studentName.trim().toLowerCase() === st.fullName.trim().toLowerCase())
        );
        if (rec) {
          status = rec.status;
          notes = rec.notes || '';
        }
      }

      return {
        studentId: st.id,
        studentNis: st.nis || '-',
        studentName: st.fullName,
        gender: st.gender,
        status,
        notes
      };
    });

    setDailyStudentRows(rows);
    setIsDirtyDaily(false);
  }, [attendanceDate, dailyClassObj, attendance, students, classes]);

  // Change individual student attendance status in Daily Input
  const handleToggleStudentStatus = (studentId: string, newStatus: AttendanceStatus) => {
    if (!attendanceDate) {
      toast.warning('Pilih tanggal presensi terlebih dahulu sebelum menandai kehadiran!');
      return;
    }

    setDailyStudentRows(prev =>
      prev.map(row => (row.studentId === studentId ? { ...row, status: newStatus } : row))
    );
    setIsDirtyDaily(true);
  };

  // Change individual student attendance note in Daily Input
  const handleStudentNoteChange = (studentId: string, notes: string) => {
    setDailyStudentRows(prev =>
      prev.map(row => (row.studentId === studentId ? { ...row, notes } : row))
    );
    setIsDirtyDaily(true);
  };

  // Batch mark all students as Hadir
  const handleMarkAllHadir = () => {
    if (!attendanceDate) {
      toast.warning('Pilih tanggal presensi terlebih dahulu!');
      return;
    }
    setDailyStudentRows(prev => prev.map(r => ({ ...r, status: 'Hadir' })));
    setIsDirtyDaily(true);
    toast.info('Semua siswa ditandai Hadir (H)');
  };

  // Save Daily Attendance Record
  const handleSaveDailyAttendance = async () => {
    if (!attendanceDate) {
      toast.error('Wajib memilih tanggal presensi terlebih dahulu!');
      return;
    }
    if (!dailyClassObj) {
      toast.error('Pilih kelas binaan terlebih dahulu!');
      return;
    }
    if (dailyStudentRows.length === 0) {
      toast.warning('Tidak ada siswa di dalam kelas ini untuk dicatat presensinya.');
      return;
    }

    setIsSavingDaily(true);
    try {
      const items: AttendanceRecordItem[] = dailyStudentRows.map(row => ({
        studentId: row.studentId,
        studentNis: row.studentNis,
        studentName: row.studentName,
        studentClass: dailyClassObj.name,
        status: row.status,
        notes: row.notes || ''
      }));

      const presentCount = items.filter(i => i.status === 'Hadir').length;
      const permitCount = items.filter(i => i.status === 'Izin').length;
      const sickCount = items.filter(i => i.status === 'Sakit').length;
      const absentCount = items.filter(i => i.status === 'Alpa').length;

      await addAttendanceRecord({
        extracurricularId: `class_att_${dailyClassObj.id}`,
        extracurricularName: `Presensi Harian ${dailyClassObj.name}`,
        coachId: currentUser?.uid || 'user_bk',
        coachName: currentUser?.displayName || 'Guru BK',
        date: attendanceDate,
        topic: `Presensi Pembinaan Kedisiplinan ${dailyClassObj.name}`,
        meetingTopic: `Presensi Pembinaan Kedisiplinan ${dailyClassObj.name}`,
        academicYear: activeAcademicYear,
        totalMembers: items.length,
        presentCount,
        permissionCount: permitCount,
        permitCount,
        sickCount,
        absentCount,
        records: items,
        items,
        notes: `Presensi kelas binaan dicatat oleh Guru BK: ${currentUser?.displayName || 'Guru BK'}`
      });

      toast.success(`Presensi ${dailyClassObj.name} tanggal ${attendanceDate} berhasil disimpan!`);
      setIsDirtyDaily(false);
    } catch (err: any) {
      console.error('Error saving daily attendance:', err);
      toast.error('Gagal menyimpan presensi: ' + (err?.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsSavingDaily(false);
    }
  };

  // Export recap to Excel (CSV with UTF-8 BOM)
  const handleExportExcel = () => {
    if (filteredStudents.length === 0) {
      toast.warning('Tidak ada data siswa untuk diekspor.');
      return;
    }

    const classNameStr =
      selectedClassId === 'all' ? 'Semua_Kelas' : (activeClassObj?.name.replace(/\s+/g, '_') || 'Kelas');
    const dateRangeStr = effectiveDateRange?.startDate
      ? `${effectiveDateRange.startDate}_sd_${effectiveDateRange.endDate || 'sekarang'}`
      : 'Semua_Periode';

    const headers = [
      'No',
      'NIS',
      'Nama Siswa',
      'L/P',
      'Kelas',
      'Hadir (H)',
      'Izin (I)',
      'Sakit (S)',
      'Alpa (A)',
      'Total Sesi',
      'Persentase Kehadiran (%)',
      'Tingkat Risiko BK',
      'Status Disiplin'
    ];

    const rows = filteredStudents.map((st, idx) => [
      idx + 1,
      `"${st.studentNis}"`,
      `"${st.studentName.replace(/"/g, '""')}"`,
      st.gender || '-',
      `"${st.studentClass}"`,
      st.hadir,
      st.izin,
      st.sakit,
      st.alpa,
      st.totalSessions,
      `${st.rate}%`,
      st.riskLevel === 'critical' ? 'Kritis (Perlu Intervensi)' : st.riskLevel === 'warning' ? 'Perlu Perhatian' : 'Kehadiran Baik',
      `"${st.riskLabel}"`
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekap_Kehadiran_BK_${classNameStr}_${dateRangeStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Rekap kehadiran berhasil diekspor ke Excel (CSV)!');
  };

  // Save assigned classes configuration
  const handleSaveAssignedClasses = () => {
    setAssignedClassIds(tempAssignedIds);
    saveGuruBkAssignedClasses(currentUser?.uid, tempAssignedIds);
    setIsConfigModalOpen(false);
    toast.success('Daftar kelas binaan Anda berhasil disimpan!');
  };

  // Toggle class selection in configuration modal
  const handleToggleAssignClass = (classId: string) => {
    setTempAssignedIds(prev =>
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  // Generate baseline sample attendance data for quick testing if database is empty
  const handleGenerateSampleAttendance = async () => {
    if (classes.length === 0 || students.length === 0) {
      toast.warning('Data kelas atau siswa belum tersedia untuk membuat sesi presensi sampel.');
      return;
    }

    setIsGeneratingSample(true);
    try {
      const targetClasses = classes.slice(0, 3);
      const today = new Date();

      for (let dayOffset = 0; dayOffset < 4; dayOffset++) {
        const d = new Date(today);
        d.setDate(d.getDate() - (dayOffset * 2 + 1));
        const dateStr = d.toISOString().split('T')[0];

        for (const cls of targetClasses) {
          const classStudents = students.filter(
            s => isStudentInClass(s, cls.name, classes) || s.classId === cls.id
          );
          if (classStudents.length === 0) continue;

          const items = classStudents.map((st, idx) => {
            let status: AttendanceStatus = 'Hadir';
            let notes = '';

            if (idx === 0) {
              status = 'Alpa';
              notes = 'Tidak masuk tanpa keterangan';
            } else if (idx === 1 && dayOffset >= 2) {
              status = 'Alpa';
              notes = 'Bolos saat jam pelajaran ke-3';
            } else if (idx === 2) {
              status = 'Sakit';
              notes = 'Surat keterangan demam/flu';
            } else if (idx === 3 && dayOffset === 1) {
              status = 'Izin';
              notes = 'Ada urusan keluarga penting';
            }

            return {
              studentId: st.id,
              studentNis: st.nis || '-',
              studentName: st.fullName,
              studentClass: cls.name,
              status,
              notes
            };
          });

          const presentCount = items.filter(i => i.status === 'Hadir').length;
          const permitCount = items.filter(i => i.status === 'Izin').length;
          const sickCount = items.filter(i => i.status === 'Sakit').length;
          const absentCount = items.filter(i => i.status === 'Alpa').length;

          await addAttendanceRecord({
            extracurricularId: `class_att_${cls.id}`,
            extracurricularName: `Presensi Harian ${cls.name}`,
            coachId: currentUser?.uid || 'user_bk',
            coachName: currentUser?.displayName || 'Guru BK / Wali Kelas',
            date: dateStr,
            topic: `Presensi Pembinaan Kedisiplinan ${cls.name}`,
            meetingTopic: `Presensi Pembinaan Kedisiplinan ${cls.name}`,
            academicYear: activeAcademicYear,
            totalMembers: items.length,
            presentCount,
            permissionCount: permitCount,
            permitCount,
            sickCount,
            absentCount,
            records: items,
            items,
            notes: `Rekam kehadiran harian rombel ${cls.name}`
          });
        }
      }
      toast.success('Contoh data presensi kelas berhasil dibuat! Rekap kehadiran siap ditinjau.');
    } catch (err: any) {
      console.error('Error generating sample attendance:', err);
      toast.error('Gagal membuat data presensi sampel: ' + (err?.message || 'Terjadi kesalahan'));
    } finally {
      setIsGeneratingSample(false);
    }
  };

  // Helper counters for Daily Input form
  const dailySummary = useMemo(() => {
    let hadir = 0;
    let izin = 0;
    let sakit = 0;
    let alpa = 0;
    dailyStudentRows.forEach(r => {
      if (r.status === 'Hadir') hadir++;
      else if (r.status === 'Izin') izin++;
      else if (r.status === 'Sakit') sakit++;
      else if (r.status === 'Alpa') alpa++;
    });
    return { total: dailyStudentRows.length, hadir, izin, sakit, alpa };
  }, [dailyStudentRows]);

  return (
    <div className="space-y-4 font-sans text-xs select-none">
      {/* 1. Header Information & Mode Switcher Toolbar */}
      <div className="p-3.5 bg-white dark:bg-[#0d0d0f] border border-slate-200 dark:border-[#27272a] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-widest bg-pink-50 dark:bg-pink-500/10 px-2 py-0.5 rounded border border-pink-200 dark:border-pink-500/20">
                PRESENSI_&_KONTROL_BK
              </span>
              <span className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[10px] px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700 font-bold">
                TA {activeAcademicYear} ({activeSemester || 'Ganjil'})
              </span>
              {assignedClassIds.length > 0 && (
                <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20 font-bold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                  <span>{assignedClassIds.length} Kelas Binaan</span>
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100 mt-1">
              Manajemen Presensi Kelas Binaan & Deteksi Dini Kehadiran Siswa
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Main View Mode Switcher: Rekap vs Input Harian */}
          <div className="flex items-center bg-slate-100 dark:bg-[#161618] p-1 rounded-xl border border-slate-300 dark:border-[#27272a]">
            <button
              onClick={() => setViewMode('rekap')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                viewMode === 'rekap'
                  ? 'bg-white dark:bg-zinc-800 text-pink-600 dark:text-pink-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Rekap Kehadiran & EWS</span>
            </button>
            <button
              onClick={() => {
                setViewMode('input_harian');
                if (selectedClassId !== 'all') {
                  setDailyTargetClassId(selectedClassId);
                }
              }}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                viewMode === 'input_harian'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Input Presensi Harian (H/I/S/A)</span>
            </button>
          </div>

          <button
            onClick={() => {
              setTempAssignedIds(assignedClassIds);
              setIsConfigModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#161618] dark:hover:bg-[#202024] border border-slate-300 dark:border-[#27272a] text-slate-800 dark:text-zinc-200 font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-xs"
            title="Tentukan kelas-kelas yang menjadi binaan Guru BK"
          >
            <Settings className="w-3.5 h-3.5 text-pink-500" />
            <span>Atur Kelas Binaan</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: INPUT PRESENSI HARIAN (H, I, S, A) DENGAN PEMILIHAN TANGGAL WAJIB */}
      {/* ========================================================================= */}
      {viewMode === 'input_harian' && (
        <div className="space-y-4">
          {/* Card Form Pengisian Presensi Harian */}
          <div className="bg-white dark:bg-[#0d0d0f] border-2 border-pink-500/30 rounded-2xl p-4 space-y-4 shadow-sm">
            {/* Header Box Input Presensi */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#27272a]">
              <div>
                <span className="font-mono text-[10px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-widest bg-pink-50 dark:bg-pink-500/10 px-2 py-0.5 rounded border border-pink-200 dark:border-pink-500/20">
                  FORMULIR_PRESENSI_HARIAN_BK
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                  <span>Input Presensi Harian Siswa Binaan BK</span>
                  {dailyClassObj && (
                    <span className="text-pink-600 dark:text-pink-400 font-black">
                      — {dailyClassObj.name}
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Tandai kehadiran (H, I, S, A) per siswa. Data langsung tersinkronisasi ke rekapitulasi kehadiran madrasah.
                </p>
              </div>

              {/* Class Selector Dropdown / Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-400">Pilih Kelas:</span>
                <select
                  value={dailyTargetClassId}
                  onChange={e => setDailyTargetClassId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#161618] border border-slate-300 dark:border-[#27272a] text-slate-900 dark:text-white text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                >
                  {classes.map(c => {
                    const isAssigned = assignedClassIds.includes(c.id) || assignedClassIds.includes(c.name);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} {isAssigned ? '★ (Binaan Saya)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* SYARAT MUTLAK: WAJIB MEMILIH TANGGAL PRESENSI DAHULU SEBELUM MELAKUKAN PRESENSI */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              !attendanceDate
                ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/80 text-amber-950 dark:text-amber-200'
                : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CalendarDays className={`w-4 h-4 ${!attendanceDate ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                    <span className="font-bold text-xs uppercase tracking-wider">
                      1. PILIH TANGGAL PRESENSI (WAJIB DIPILIH SEBELUM MELAKUKAN PRESENSI):
                    </span>
                  </div>
                  {!attendanceDate ? (
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                      ⚠️ PERHATIAN: Guru BK wajib memilih tanggal presensi terlebih dahulu sebelum tombol kehadiran (H, I, S, A) dapat ditekan.
                    </p>
                  ) : (
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        Tanggal presensi aktif: <strong>{attendanceDate}</strong>
                        {existingSessionFound ? ' (Data presensi tanggal ini ditemukan di sistem - Mode Edit)' : ' (Presensi baru siap diinput)'}
                      </span>
                    </p>
                  )}
                </div>

                {/* Date Picker Input & Quick Presets */}
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={e => setAttendanceDate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#161618] border-2 border-pink-500 font-bold text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-pink-500 shadow-xs"
                    title="Pilih tanggal presensi"
                  />
                  <button
                    type="button"
                    onClick={() => setAttendanceDate(new Date().toISOString().split('T')[0])}
                    className="px-2.5 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-[11px] transition-all shadow-xs"
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 1);
                      setAttendanceDate(d.toISOString().split('T')[0]);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-[11px] transition-all shadow-xs"
                  >
                    Kemarin
                  </button>
                  {attendanceDate && (
                    <button
                      type="button"
                      onClick={() => setAttendanceDate('')}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
                      title="Reset pemilihan tanggal"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions & Live Counters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleMarkAllHadir}
                  disabled={!attendanceDate}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs ${
                    attendanceDate
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                      : 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed'
                  }`}
                  title={!attendanceDate ? 'Pilih tanggal presensi dahulu' : 'Tandai semua siswa hadir'}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Tandai Semua Hadir (H)</span>
                </button>

                {isDirtyDaily && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Perubahan belum disimpan</span>
                  </span>
                )}
              </div>

              {/* Counters Badges */}
              <div className="flex items-center gap-1.5 flex-wrap font-mono text-[11px] font-bold">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                  Total: {dailySummary.total} Siswa
                </span>
                <span className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  H: {dailySummary.hadir}
                </span>
                <span className="px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                  I: {dailySummary.izin}
                </span>
                <span className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  S: {dailySummary.sakit}
                </span>
                <span className="px-2 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                  A: {dailySummary.alpa}
                </span>
              </div>
            </div>

            {/* Table Siswa untuk Presensi Harian */}
            <div className="border border-slate-200 dark:border-[#27272a] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-[#161618] border-b border-slate-200 dark:border-[#27272a] text-[10px] font-mono text-slate-600 dark:text-zinc-400 uppercase">
                    <th className="py-2.5 px-3 w-10 text-center font-bold">No</th>
                    <th className="py-2.5 px-3 font-bold">Nama Siswa & NIS</th>
                    <th className="py-2.5 px-2 text-center font-bold w-12">L/P</th>
                    <th className="py-2.5 px-3 text-center font-bold w-64">
                      Opsi Presensi (H / I / S / A)
                    </th>
                    <th className="py-2.5 px-3 font-bold">Keterangan / Catatan Alasan (Opsional)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-[#27272a]">
                  {!attendanceDate ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-zinc-400">
                        <div className="max-w-md mx-auto space-y-2.5 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
                          <Lock className="w-8 h-8 text-amber-500 mx-auto" />
                          <h5 className="font-bold text-amber-950 dark:text-amber-200 text-sm">
                            PILIH TANGGAL PRESENSI TERLEBIH DAHULU
                          </h5>
                          <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                            Sesuai SOP Administrasi BK, Guru BK wajib menentukan tanggal kehadiran terlebih dahulu sebelum dapat menandai presensi siswa kelas binaan.
                          </p>
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => setAttendanceDate(new Date().toISOString().split('T')[0])}
                              className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-xs"
                            >
                              Gunakan Tanggal Hari Ini ({new Date().toISOString().split('T')[0]})
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : dailyStudentRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500 dark:text-zinc-400 font-mono">
                        Tidak ada siswa terdaftar di dalam kelas {dailyClassObj?.name || 'ini'}.
                      </td>
                    </tr>
                  ) : (
                    dailyStudentRows.map((row, idx) => {
                      const isH = row.status === 'Hadir';
                      const isI = row.status === 'Izin';
                      const isS = row.status === 'Sakit';
                      const isA = row.status === 'Alpa';

                      return (
                        <tr
                          key={row.studentId}
                          className={`transition-colors ${
                            isA
                              ? 'bg-rose-50/50 dark:bg-rose-950/20'
                              : isS
                              ? 'bg-amber-50/30 dark:bg-amber-950/10'
                              : isI
                              ? 'bg-blue-50/30 dark:bg-blue-950/10'
                              : 'hover:bg-slate-50 dark:hover:bg-[#161618]'
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500 dark:text-zinc-400">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {row.studentName}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                              NIS: {row.studentNis}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-600 dark:text-zinc-300">
                            {row.gender || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {/* 4 Interactive Pills (H, I, S, A) */}
                            <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200 dark:border-zinc-700">
                              {/* H - Hadir */}
                              <button
                                type="button"
                                onClick={() => handleToggleStudentStatus(row.studentId, 'Hadir')}
                                className={`px-2.5 py-1 rounded-lg font-black text-xs transition-all ${
                                  isH
                                    ? 'bg-emerald-600 text-white shadow-xs scale-105 ring-2 ring-emerald-500/40'
                                    : 'text-slate-600 dark:text-zinc-400 hover:text-emerald-700 hover:bg-slate-200 dark:hover:bg-zinc-700'
                                }`}
                                title="Hadir"
                              >
                                H
                              </button>

                              {/* I - Izin */}
                              <button
                                type="button"
                                onClick={() => handleToggleStudentStatus(row.studentId, 'Izin')}
                                className={`px-2.5 py-1 rounded-lg font-black text-xs transition-all ${
                                  isI
                                    ? 'bg-blue-600 text-white shadow-xs scale-105 ring-2 ring-blue-500/40'
                                    : 'text-slate-600 dark:text-zinc-400 hover:text-blue-700 hover:bg-slate-200 dark:hover:bg-zinc-700'
                                }`}
                                title="Izin"
                              >
                                I
                              </button>

                              {/* S - Sakit */}
                              <button
                                type="button"
                                onClick={() => handleToggleStudentStatus(row.studentId, 'Sakit')}
                                className={`px-2.5 py-1 rounded-lg font-black text-xs transition-all ${
                                  isS
                                    ? 'bg-amber-600 text-white shadow-xs scale-105 ring-2 ring-amber-500/40'
                                    : 'text-slate-600 dark:text-zinc-400 hover:text-amber-700 hover:bg-slate-200 dark:hover:bg-zinc-700'
                                }`}
                                title="Sakit"
                              >
                                S
                              </button>

                              {/* A - Alpa */}
                              <button
                                type="button"
                                onClick={() => handleToggleStudentStatus(row.studentId, 'Alpa')}
                                className={`px-2.5 py-1 rounded-lg font-black text-xs transition-all ${
                                  isA
                                    ? 'bg-rose-600 text-white shadow-xs scale-105 ring-2 ring-rose-500/40'
                                    : 'text-slate-600 dark:text-zinc-400 hover:text-rose-700 hover:bg-slate-200 dark:hover:bg-zinc-700'
                                }`}
                                title="Alpa (Tanpa Keterangan)"
                              >
                                A
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={row.notes}
                              onChange={e => handleStudentNoteChange(row.studentId, e.target.value)}
                              placeholder={
                                isA
                                  ? 'Catatan alpa/mangkir...'
                                  : isS
                                  ? 'Keterangan sakit/gejala...'
                                  : isI
                                  ? 'Alasan izin/kegiatan...'
                                  : 'Catatan tambahan...'
                              }
                              className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-[#161618] border border-slate-300 dark:border-[#27272a] text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-pink-500"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Save Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="text-slate-500 dark:text-zinc-400 text-[11px]">
                {attendanceDate ? (
                  <span>
                    Tanggal Presensi: <strong>{attendanceDate}</strong> | Rombel: <strong>{dailyClassObj?.name}</strong>
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    ⚠️ Wajib memilih tanggal presensi terlebih dahulu sebelum menyimpan.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('rekap')}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
                >
                  Kembali ke Rekap
                </button>
                <button
                  type="button"
                  onClick={handleSaveDailyAttendance}
                  disabled={!attendanceDate || isSavingDaily}
                  className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
                    attendanceDate && !isSavingDaily
                      ? 'bg-pink-600 hover:bg-pink-700 text-white cursor-pointer ring-2 ring-pink-500/20'
                      : 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingDaily ? 'Menyimpan Presensi...' : `Simpan Presensi Tanggal ${attendanceDate || '...'}`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: REKAPITULASI KEHADIRAN SISWA & DETEKSI DINI (EARLY WARNING SYSTEM)*/}
      {/* ========================================================================= */}
      {viewMode === 'rekap' && (
        <div className="space-y-4">
          {/* 2. Kelas Binaan Selector Grid (Grid Pemilihan Kelas) */}
          <div className="bg-white dark:bg-[#0d0d0f] border border-slate-200 dark:border-[#27272a] rounded-2xl p-3.5 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200 dark:border-[#27272a]">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>PILIH KELAS BINAAN (GRID KELAS)</span>
                  <span className="text-[10px] font-normal text-slate-500 dark:text-zinc-400 lowercase">
                    — klik pada salah satu kartu kelas untuk memfilter rekap siswa
                  </span>
                </h4>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Filter by Grade */}
                <div className="flex items-center bg-slate-100 dark:bg-[#161618] rounded-xl p-0.5 border border-slate-200 dark:border-[#27272a] text-[10px] font-bold">
                  {(['all', 'X', 'XI', 'XII'] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => setGradeFilter(g)}
                      className={`px-2 py-1 rounded-lg transition-all ${
                        gradeFilter === g
                          ? 'bg-pink-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {g === 'all' ? 'Semua Tingkat' : `Kelas ${g}`}
                    </button>
                  ))}
                </div>

                {/* Toggle Only My Classes */}
                {assignedClassIds.length > 0 && (
                  <button
                    onClick={() => setOnlyMyClasses(!onlyMyClasses)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1 transition-all ${
                      onlyMyClasses
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-600'
                        : 'bg-slate-50 dark:bg-[#161618] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-[#27272a]'
                    }`}
                  >
                    <Star className={`w-3 h-3 ${onlyMyClasses ? 'fill-emerald-500 text-emerald-500' : ''}`} />
                    <span>Hanya Binaan Saya ({assignedClassIds.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* The Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {/* Card: Semua Kelas Binaan (Overview) */}
              <div
                onClick={() => setSelectedClassId('all')}
                className={`cursor-pointer p-3 rounded-xl border-2 transition-all flex flex-col justify-between ${
                  selectedClassId === 'all'
                    ? 'bg-pink-50/70 dark:bg-pink-950/40 border-pink-500 shadow-md ring-2 ring-pink-500/20'
                    : 'bg-slate-50 hover:bg-white dark:bg-[#161618] dark:hover:bg-[#1a1a1e] border-slate-200 dark:border-[#27272a]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-zinc-400 uppercase">
                      SEMUA KELAS
                    </span>
                    {selectedClassId === 'all' && (
                      <CheckCircle2 className="w-4 h-4 text-pink-500 shrink-0" />
                    )}
                  </div>
                  <div className="text-sm font-black text-slate-900 dark:text-white mt-1">
                    Semua Siswa {onlyMyClasses ? 'Binaan' : 'Madrasah'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    {classSummaries.length} Rombongan Belajar
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-[#27272a] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-600 dark:text-zinc-400">Total: {students.length} Siswa</span>
                  <span className="font-bold text-pink-600 dark:text-pink-400">Tampilkan Semua →</span>
                </div>
              </div>

              {/* Individual Class Cards */}
              {displayedClasses.map(cls => {
                const isSelected = selectedClassId === cls.classId;
                const isAssigned = assignedClassIds.includes(cls.classId) || assignedClassIds.includes(cls.className);

                return (
                  <div
                    key={cls.classId}
                    onClick={() => setSelectedClassId(cls.classId)}
                    className={`cursor-pointer p-3 rounded-xl border-2 transition-all flex flex-col justify-between relative group ${
                      isSelected
                        ? 'bg-pink-50/70 dark:bg-pink-950/40 border-pink-500 shadow-md ring-2 ring-pink-500/20 scale-[1.01]'
                        : 'bg-slate-50 hover:bg-white dark:bg-[#161618] dark:hover:bg-[#1a1a1e] border-slate-200 dark:border-[#27272a] hover:border-pink-400/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                          Tingkat {cls.grade || '-'}
                        </span>
                        <div className="flex items-center gap-1">
                          {isAssigned && (
                            <span title="Kelas Binaan Anda">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            </span>
                          )}
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-pink-500 shrink-0" />
                          )}
                        </div>
                      </div>

                      <div className="text-sm font-black text-slate-900 dark:text-white mt-1.5 truncate">
                        {cls.className}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate mt-0.5" title={`Wali Kelas: ${cls.homeroomTeacher}`}>
                        Wali: <span className="font-medium text-slate-700 dark:text-zinc-300">{cls.homeroomTeacher}</span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/70 dark:border-[#27272a] space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 dark:text-zinc-400">Kehadiran:</span>
                        <span className={`font-mono font-bold ${
                          cls.avgAttendanceRate >= 90 ? 'text-emerald-700 dark:text-emerald-400' :
                          cls.avgAttendanceRate >= 80 ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'
                        }`}>
                          {cls.avgAttendanceRate}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1 text-[9px] font-mono">
                        <span className="text-slate-600 dark:text-zinc-400 font-medium">
                          {cls.totalStudents} Siswa
                        </span>
                        <div className="flex items-center gap-1">
                          {cls.totalAlpa > 0 ? (
                            <span className="px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-900">
                              {cls.totalAlpa}A
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">0A</span>
                          )}
                          {cls.criticalCount > 0 && (
                            <span className="px-1 py-0.2 rounded bg-red-600 text-white font-extrabold text-[8px]" title={`${cls.criticalCount} Siswa Perlu Intervensi Segera`}>
                              !
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Class Summary KPI Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <div className="p-3 bg-white dark:bg-[#0d0d0f] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-xs">
              <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-zinc-400 uppercase block">
                SISWA TERPILIH
              </span>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {overviewMetrics.total}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 truncate block">
                {selectedClassId === 'all' ? 'Semua Kelas' : activeClassObj?.name}
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-[#0d0d0f] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-xs">
              <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-zinc-400 uppercase block">
                RATA-RATA KEHADIRAN
              </span>
              <div className={`text-lg font-black mt-0.5 ${
                overviewMetrics.avgRate >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                overviewMetrics.avgRate >= 80 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {overviewMetrics.avgRate}%
              </div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400">Tingkat Disiplin</span>
            </div>

            <div className="p-3 bg-white dark:bg-[#0d0d0f] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-xs">
              <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 uppercase block flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>SISWA KRITIS</span>
              </span>
              <div className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">
                {overviewMetrics.criticalCount}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400">Alpa ≥ 2 atau &lt;75%</span>
            </div>

            <div className="p-3 bg-white dark:bg-[#0d0d0f] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-xs">
              <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase block">
                PERLU PERHATIAN
              </span>
              <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                {overviewMetrics.warningCount}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400">Alpa 1x / Sering Izin</span>
            </div>

            <div className="p-3 bg-white dark:bg-[#0d0d0f] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-xs">
              <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400 uppercase block">
                TOTAL ALPA (A)
              </span>
              <div className="text-lg font-black text-red-600 dark:text-red-400 mt-0.5">
                {overviewMetrics.totalAlpa}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400">Tanpa Keterangan</span>
            </div>

            <div className="p-3 bg-white dark:bg-[#0d0d0f] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-xs">
              <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase block">
                IZIN & SAKIT
              </span>
              <div className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">
                {overviewMetrics.totalIzin + overviewMetrics.totalSakit}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 truncate block">
                {overviewMetrics.totalIzin} Izin • {overviewMetrics.totalSakit} Sakit
              </span>
            </div>
          </div>

          {/* 4. Student Attendance Table with Quick Intervention Actions & Date Range Toolbar */}
          <div className="bg-white dark:bg-[#0d0d0f] border border-slate-200 dark:border-[#27272a] rounded-2xl shadow-xs overflow-hidden">
            {/* Filter Rentang Tanggal & Tombol Ekspor/Cetak */}
            <div className="p-3 bg-slate-50/90 dark:bg-[#121214] border-b border-slate-200 dark:border-[#27272a] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Filter Rentang Tanggal */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-zinc-400 uppercase flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-pink-500" />
                  <span>Periode:</span>
                </span>

                <div className="flex items-center bg-white dark:bg-[#161618] rounded-xl p-0.5 border border-slate-300 dark:border-[#27272a] text-[10px] font-bold">
                  <button
                    onClick={() => setDatePreset('all')}
                    className={`px-2 py-1 rounded-lg transition-all ${
                      datePreset === 'all'
                        ? 'bg-pink-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Semua Riwayat
                  </button>
                  <button
                    onClick={() => setDatePreset('today')}
                    className={`px-2 py-1 rounded-lg transition-all ${
                      datePreset === 'today'
                        ? 'bg-pink-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Hari Ini
                  </button>
                  <button
                    onClick={() => setDatePreset('7days')}
                    className={`px-2 py-1 rounded-lg transition-all ${
                      datePreset === '7days'
                        ? 'bg-pink-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    7 Hari Terakhir
                  </button>
                  <button
                    onClick={() => setDatePreset('this_month')}
                    className={`px-2 py-1 rounded-lg transition-all ${
                      datePreset === 'this_month'
                        ? 'bg-pink-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Bulan Ini
                  </button>
                  <button
                    onClick={() => setDatePreset('custom')}
                    className={`px-2 py-1 rounded-lg transition-all ${
                      datePreset === 'custom'
                        ? 'bg-pink-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Kustom
                  </button>
                </div>

                {datePreset === 'custom' && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={e => setCustomStartDate(e.target.value)}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-[#161618] border border-slate-300 dark:border-[#27272a] text-[10px] text-slate-800 dark:text-white font-mono"
                      title="Tanggal Mulai"
                    />
                    <span className="text-[10px] text-slate-400">s/d</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={e => setCustomEndDate(e.target.value)}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-[#161618] border border-slate-300 dark:border-[#27272a] text-[10px] text-slate-800 dark:text-white font-mono"
                      title="Tanggal Akhir"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons: Ekspor Excel (.csv) & Cetak PDF */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold text-[11px] flex items-center gap-1.5 shadow-2xs transition-all"
                  title="Unduh laporan rekapitulasi kehadiran dalam format Excel (.csv)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Ekspor Excel (.csv)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 font-bold text-[11px] flex items-center gap-1.5 shadow-2xs transition-all"
                  title="Buka pratinjau cetak resmi rekapitulasi kehadiran siswa binaan BK"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Cetak Laporan / PDF</span>
                </button>
              </div>
            </div>

            {/* Table Filters & Search */}
            <div className="p-3 bg-white dark:bg-[#0d0d0f] border-b border-slate-200 dark:border-[#27272a] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative min-w-[220px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama siswa, NIS, atau kelas..."
                    value={searchStudent}
                    onChange={e => setSearchStudent(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#161618] border border-slate-300 dark:border-[#27272a] text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-pink-500"
                  />
                  {searchStudent && (
                    <button
                      onClick={() => setSearchStudent('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Quick Status / Risk Pills */}
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    onClick={() => setRiskFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      riskFilter === 'all'
                        ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                        : 'bg-white dark:bg-[#161618] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-[#27272a] hover:bg-slate-100'
                    }`}
                  >
                    Semua Siswa ({filteredStudents.length})
                  </button>
                  <button
                    onClick={() => setRiskFilter('critical')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                      riskFilter === 'critical'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-[#161618] text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>Kritis / Sering Absen</span>
                  </button>
                  <button
                    onClick={() => setRiskFilter('alpa')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      riskFilter === 'alpa'
                        ? 'bg-red-700 text-white shadow-2xs'
                        : 'bg-white dark:bg-[#161618] text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 hover:bg-red-50'
                    }`}
                  >
                    Ada Catatan Alpa (A)
                  </button>
                  <button
                    onClick={() => setRiskFilter('warning')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      riskFilter === 'warning'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-[#161618] text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 hover:bg-amber-50'
                    }`}
                  >
                    Perlu Perhatian
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
                <span>Menampilkan <strong>{filteredStudents.length}</strong> siswa</span>
              </div>
            </div>

            {/* The Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-[#161618] border-b border-slate-200 dark:border-[#27272a] text-[10px] font-mono text-slate-600 dark:text-zinc-400 uppercase">
                    <th className="py-2.5 px-3 font-bold">Siswa & NIS</th>
                    <th className="py-2.5 px-3 font-bold">Kelas</th>
                    <th className="py-2.5 px-2.5 text-center font-bold text-emerald-700 dark:text-emerald-400">Hadir</th>
                    <th className="py-2.5 px-2.5 text-center font-bold text-blue-700 dark:text-blue-400">Izin</th>
                    <th className="py-2.5 px-2.5 text-center font-bold text-amber-700 dark:text-amber-400">Sakit</th>
                    <th className="py-2.5 px-2.5 text-center font-bold text-rose-700 dark:text-rose-400">Alpa</th>
                    <th className="py-2.5 px-3 text-center font-bold">% Kehadiran</th>
                    <th className="py-2.5 px-3 font-bold">Status Kedisiplinan</th>
                    <th className="py-2.5 px-3 font-bold">Intervensi Sebelumnya</th>
                    <th className="py-2.5 px-3 text-right font-bold">Aksi Intervensi BK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-[#27272a]">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500 dark:text-zinc-400 font-mono">
                        <div className="max-w-xs mx-auto space-y-2">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                          <p className="font-bold text-slate-800 dark:text-white">Tidak ada data siswa yang cocok</p>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                            Tidak ada siswa dengan kriteria filter yang Anda tentukan pada kelas ini.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(st => {
                      const hasCriticalRisk = st.riskLevel === 'critical';
                      const hasWarningRisk = st.riskLevel === 'warning';

                      return (
                        <tr
                          key={st.studentId}
                          className={`transition-colors hover:bg-slate-50 dark:hover:bg-[#161618] ${
                            hasCriticalRisk
                              ? 'bg-rose-50/40 dark:bg-rose-950/20'
                              : hasWarningRisk
                              ? 'bg-amber-50/30 dark:bg-amber-950/10'
                              : ''
                          }`}
                        >
                          {/* Siswa & NIS */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                                hasCriticalRisk
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                                  : 'bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200'
                              }`}>
                                {(st.studentName || 'S').toString().trim().charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{st.studentName}</span>
                                  {st.gender && (
                                    <span className="text-[9px] font-mono text-slate-400">
                                      ({st.gender})
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                                  NIS: {st.studentNis}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Kelas */}
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-800 dark:text-zinc-200">
                              {st.studentClass || '-'}
                            </span>
                          </td>

                          {/* Hadir */}
                          <td className="py-2.5 px-2.5 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {st.hadir}
                          </td>

                          {/* Izin */}
                          <td className="py-2.5 px-2.5 text-center font-mono font-bold text-blue-700 dark:text-blue-400">
                            {st.izin}
                          </td>

                          {/* Sakit */}
                          <td className="py-2.5 px-2.5 text-center font-mono font-bold text-amber-700 dark:text-amber-400">
                            {st.sakit}
                          </td>

                          {/* Alpa */}
                          <td className="py-2.5 px-2.5 text-center font-mono font-bold">
                            {st.alpa > 0 ? (
                              <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-extrabold text-xs shadow-2xs">
                                {st.alpa}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>

                          {/* % Kehadiran */}
                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className={`font-mono font-extrabold text-xs ${
                                st.rate >= 90 ? 'text-emerald-700 dark:text-emerald-400' :
                                st.rate >= 80 ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'
                              }`}>
                                {st.rate}%
                              </span>
                              <div className="w-16 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden mt-1">
                                <div
                                  className={`h-full rounded-full ${
                                    st.rate >= 90 ? 'bg-emerald-500' :
                                    st.rate >= 80 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${Math.max(5, st.rate)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Status Kedisiplinan */}
                          <td className="py-2.5 px-3">
                            {hasCriticalRisk ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                <AlertTriangle className="w-3 h-3 text-rose-500" />
                                <span>Kritis (Butuh Intervensi)</span>
                              </span>
                            ) : hasWarningRisk ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                <span>Perlu Perhatian</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span>Kehadiran Baik</span>
                              </span>
                            )}
                          </td>

                          {/* Intervensi Sebelumnya */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5 text-[10px] font-mono flex-wrap">
                              {st.counselingCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800" title={`${st.counselingCount} sesi konseling`}>
                                  {st.counselingCount} Konseling
                                </span>
                              )}
                              {st.homeVisitCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800" title={`${st.homeVisitCount} kunjungan rumah`}>
                                  {st.homeVisitCount} Home Visit
                                </span>
                              )}
                              {st.parentCallCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800" title={`${st.parentCallCount} surat panggilan`}>
                                  {st.parentCallCount} Panggilan
                                </span>
                              )}
                              {st.counselingCount === 0 && st.homeVisitCount === 0 && st.parentCallCount === 0 && (
                                <span className="text-slate-400 dark:text-zinc-500 italic">Belum ada</span>
                              )}
                            </div>
                          </td>

                          {/* Aksi Intervensi BK */}
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1 flex-wrap">
                              {/* Detail Riwayat */}
                              <button
                                onClick={() => setDetailStudent(st)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800"
                                title="Lihat Rincian Riwayat Ketidakhadiran"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Tindak Lanjut: Konseling */}
                              <button
                                onClick={() => onInitiateCounseling(st)}
                                className="px-2 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/60 dark:hover:bg-pink-900/80 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800 text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-all"
                                title="Buka Sesi Konseling untuk Siswa ini"
                              >
                                <HeartHandshake className="w-3 h-3 text-pink-600 dark:text-pink-400" />
                                <span>+ Konseling</span>
                              </button>

                              {/* Tindak Lanjut: Home Visit */}
                              <button
                                onClick={() => onInitiateHomeVisit(st)}
                                className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-all"
                                title="Buka Berita Acara Kunjungan Rumah (Home Visit)"
                              >
                                <Home className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                <span>+ Home Visit</span>
                              </button>

                              {/* Tindak Lanjut: Panggilan Ortu */}
                              <button
                                onClick={() => onInitiateParentCall(st)}
                                className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-all"
                                title="Terbitkan Surat Panggilan Orang Tua"
                              >
                                <Mail className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                <span>+ Panggilan</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: ATUR KELAS BINAAN SAYA */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Pengaturan Kelas Binaan Guru BK"
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-900/40 rounded-xl text-pink-900 dark:text-pink-200 text-xs">
            <p className="font-bold flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-pink-500 text-pink-500" />
              <span>Tentukan Rombel / Kelas Binaan Anda</span>
            </p>
            <p className="mt-1 text-[11px] opacity-90 leading-relaxed">
              Pilih kelas-kelas yang menjadi tanggung jawab binaan Anda. Sistem akan menyimpan preferensi ini sehingga Anda dapat memantau kehadiran siswa binaan Anda secara cepat dan fokus.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[350px] overflow-y-auto p-1">
            {classes.map(cls => {
              const isChecked = tempAssignedIds.includes(cls.id) || tempAssignedIds.includes(cls.name);
              return (
                <div
                  key={cls.id}
                  onClick={() => handleToggleAssignClass(cls.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-2 ${
                    isChecked
                      ? 'bg-pink-50 dark:bg-pink-950/60 border-pink-500 ring-1 ring-pink-500/40 text-pink-950 dark:text-pink-100'
                      : 'bg-white dark:bg-[#161618] border-slate-200 dark:border-[#27272a] text-slate-800 dark:text-zinc-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                      Tingkat {cls.grade}
                    </span>
                    <div className="font-black text-sm mt-1">{cls.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                      {cls.homeroomTeacher || 'Wali -'}
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 shrink-0 mt-0.5 cursor-pointer"
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-[#27272a]">
            <div className="text-xs text-slate-500 dark:text-zinc-400">
              Terpilih: <strong>{tempAssignedIds.length}</strong> kelas binaan
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveAssignedClasses}
                className="px-4 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-xs"
              >
                Simpan Kelas Binaan
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 6. MODAL: CETAK LAPORAN REKAPITULASI PRESENSI BK (PRINT PREVIEW / PDF)    */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Cetak Laporan Rekapitulasi Kehadiran Siswa BK"
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-[#161618] border border-slate-200 dark:border-[#27272a] rounded-xl">
            <span className="text-xs text-slate-600 dark:text-zinc-400">
              Dokumen siap cetak dalam standar format resmi madrasah lengkap dengan kop dan kolom tanda tangan.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Sekarang (Print / Save as PDF)</span>
              </button>
            </div>
          </div>

          {/* Printable Container */}
          <div className="bg-white text-slate-900 p-6 rounded-xl border border-slate-300 font-serif space-y-4 max-h-[500px] overflow-y-auto">
            {/* Kop Surat Madrasah */}
            <SchoolLetterhead schoolInfo={schoolSetting} showDoubleLine={true} />

            {/* Judul Dokumen */}
            <div className="text-center space-y-1">
              <h3 className="text-sm sm:text-base font-bold uppercase tracking-wide underline">
                LAPORAN REKAPITULASI KEHADIRAN SISWA & KONTROL KEDISIPLINAN BK
              </h3>
              <p className="text-xs font-sans text-slate-600">
                Tahun Ajaran {activeAcademicYear} — Semester {activeSemester || 'Ganjil'}
              </p>
            </div>

            {/* Metadata Laporan */}
            <div className="grid grid-cols-2 gap-2 text-xs font-sans border p-2.5 rounded-lg bg-slate-50">
              <div>
                <span className="text-slate-500">Kelas / Rombel:</span>{' '}
                <strong>{selectedClassId === 'all' ? 'Seluruh Kelas Terpilih' : activeClassObj?.name}</strong>
              </div>
              <div>
                <span className="text-slate-500">Wali Kelas:</span>{' '}
                <strong>{activeClassSummary?.homeroomTeacher || '-'}</strong>
              </div>
              <div>
                <span className="text-slate-500">Guru Bimbingan Konseling (BK):</span>{' '}
                <strong>{currentUser?.displayName || 'Guru BK'}</strong>
              </div>
              <div>
                <span className="text-slate-500">Periode Rekap:</span>{' '}
                <strong>
                  {effectiveDateRange?.startDate
                    ? `${effectiveDateRange.startDate} s/d ${effectiveDateRange.endDate || 'Sekarang'}`
                    : 'Semua Riwayat'}
                </strong>
              </div>
            </div>

            {/* Ringkasan Angka Disiplin */}
            <div className="grid grid-cols-5 gap-2 text-center font-sans text-xs">
              <div className="border p-2 rounded">
                <span className="text-slate-500 text-[10px] block">TOTAL SISWA</span>
                <span className="text-sm font-bold font-mono">{overviewMetrics.total}</span>
              </div>
              <div className="border p-2 rounded">
                <span className="text-slate-500 text-[10px] block">RATA-RATA HADIR</span>
                <span className="text-sm font-bold font-mono text-emerald-700">{overviewMetrics.avgRate}%</span>
              </div>
              <div className="border p-2 rounded">
                <span className="text-slate-500 text-[10px] block">TOTAL ALPA</span>
                <span className="text-sm font-bold font-mono text-rose-700">{overviewMetrics.totalAlpa}</span>
              </div>
              <div className="border p-2 rounded">
                <span className="text-slate-500 text-[10px] block">IZIN & SAKIT</span>
                <span className="text-sm font-bold font-mono text-blue-700">{overviewMetrics.totalIzin + overviewMetrics.totalSakit}</span>
              </div>
              <div className="border p-2 rounded">
                <span className="text-slate-500 text-[10px] block">SISWA BUTUH INTERVENSI</span>
                <span className="text-sm font-bold font-mono text-red-700">{overviewMetrics.criticalCount}</span>
              </div>
            </div>

            {/* Tabel Rekapitulasi untuk Cetak */}
            <table className="w-full text-xs font-sans border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-[10px] uppercase font-bold text-slate-700">
                  <th className="border border-slate-300 p-1.5 text-center w-8">No</th>
                  <th className="border border-slate-300 p-1.5 text-center w-24">NIS</th>
                  <th className="border border-slate-300 p-1.5">Nama Siswa</th>
                  <th className="border border-slate-300 p-1.5 text-center w-10">L/P</th>
                  <th className="border border-slate-300 p-1.5 text-center w-12">H</th>
                  <th className="border border-slate-300 p-1.5 text-center w-12">I</th>
                  <th className="border border-slate-300 p-1.5 text-center w-12">S</th>
                  <th className="border border-slate-300 p-1.5 text-center w-12">A</th>
                  <th className="border border-slate-300 p-1.5 text-center w-14">% Hadir</th>
                  <th className="border border-slate-300 p-1.5">Status Kedisiplinan</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((st, idx) => (
                  <tr key={st.studentId} className="border-b border-slate-200">
                    <td className="border border-slate-300 p-1 text-center font-mono">{idx + 1}</td>
                    <td className="border border-slate-300 p-1 text-center font-mono">{st.studentNis}</td>
                    <td className="border border-slate-300 p-1 font-semibold">{st.studentName}</td>
                    <td className="border border-slate-300 p-1 text-center font-mono">{st.gender || '-'}</td>
                    <td className="border border-slate-300 p-1 text-center font-mono">{st.hadir}</td>
                    <td className="border border-slate-300 p-1 text-center font-mono">{st.izin}</td>
                    <td className="border border-slate-300 p-1 text-center font-mono">{st.sakit}</td>
                    <td className="border border-slate-300 p-1 text-center font-mono font-bold text-rose-700">{st.alpa}</td>
                    <td className="border border-slate-300 p-1 text-center font-mono font-bold">{st.rate}%</td>
                    <td className="border border-slate-300 p-1 text-[11px]">{st.riskLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Kolom Tanda Tangan */}
            <div className="pt-6 grid grid-cols-3 gap-4 text-center font-sans text-xs">
              <div>
                <p>Mengetahui,</p>
                <p className="font-bold">Kepala Madrasah / Waka</p>
                <div className="h-16" />
                <p className="font-bold underline">{schoolSetting?.principalName || 'Kepala Madrasah'}</p>
                <p className="text-[10px] text-slate-500">NIP. {schoolSetting?.principalNip || '-'}</p>
              </div>

              <div>
                <p>&nbsp;</p>
                <p className="font-bold">Wali Kelas</p>
                <div className="h-16" />
                <p className="font-bold underline">{activeClassSummary?.homeroomTeacher || '( .......................................... )'}</p>
                <p className="text-[10px] text-slate-500">NIP. -</p>
              </div>

              <div>
                <p>Bula, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="font-bold">Guru Bimbingan Konseling</p>
                <div className="h-16" />
                <p className="font-bold underline">{currentUser?.displayName || 'Guru BK'}</p>
                <p className="text-[10px] text-slate-500">NIP. {currentUser?.nip || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 7. MODAL: DETAIL RIWAYAT ABSENSI SISWA                                    */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(detailStudent)}
        onClose={() => setDetailStudent(null)}
        title={detailStudent ? `Riwayat Kehadiran: ${detailStudent.studentName}` : 'Detail Kehadiran'}
        size="lg"
      >
        {detailStudent && (
          <div className="space-y-4">
            {/* Header Profil Singkat Siswa */}
            <div className="p-3.5 bg-slate-50 dark:bg-[#161618] border border-slate-200 dark:border-[#27272a] rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                  detailStudent.riskLevel === 'critical'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-white'
                }`}>
                  {(detailStudent.studentName || 'S').toString().trim().charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {detailStudent.studentName}
                  </h4>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                    <span>Kelas: <strong>{detailStudent.studentClass}</strong></span>
                    <span>•</span>
                    <span>NIS: <strong>{detailStudent.studentNis}</strong></span>
                    {detailStudent.parentName && (
                      <>
                        <span>•</span>
                        <span>Ortu: <strong>{detailStudent.parentName}</strong></span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
                  {detailStudent.rate}%
                </div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                  Total Rekam: {detailStudent.totalSessions} Sesi
                </div>
              </div>
            </div>

            {/* Statistik Ringkas */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">Hadir (H)</div>
                <div className="text-base font-black text-emerald-800 dark:text-emerald-300 font-mono">{detailStudent.hadir}</div>
              </div>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                <div className="text-[10px] text-blue-700 dark:text-blue-400 font-bold">Izin (I)</div>
                <div className="text-base font-black text-blue-800 dark:text-blue-300 font-mono">{detailStudent.izin}</div>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">Sakit (S)</div>
                <div className="text-base font-black text-amber-800 dark:text-amber-300 font-mono">{detailStudent.sakit}</div>
              </div>
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                <div className="text-[10px] text-rose-700 dark:text-rose-400 font-bold">Alpa (A)</div>
                <div className="text-base font-black text-rose-800 dark:text-rose-300 font-mono">{detailStudent.alpa}</div>
              </div>
            </div>

            {/* Riwayat Absen / Catatan Khusus */}
            <div className="space-y-2">
              <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                Catatan Ketidakhadiran ({detailStudent.recentAbsences.length} Kejadian)
              </h5>

              {detailStudent.recentAbsences.length === 0 ? (
                <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-[#161618] border border-slate-200 dark:border-[#27272a] text-slate-500 text-xs">
                  Siswa memiliki rekam kehadiran 100% disiplin tanpa ada catatan absen.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                  {detailStudent.recentAbsences.map((inc, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-[#27272a] bg-slate-50/50 dark:bg-[#161618] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                            inc.status === 'Alpa' ? 'bg-rose-600 text-white' :
                            inc.status === 'Sakit' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}>
                            {inc.status}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-zinc-200">
                            {inc.sessionName}
                          </span>
                        </div>
                        {inc.notes && (
                          <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5 italic">
                            "{inc.notes}"
                          </p>
                        )}
                      </div>

                      <div className="text-right text-[10px] font-mono text-slate-500 dark:text-zinc-400 shrink-0">
                        {inc.date}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Action Footer inside Modal */}
            <div className="pt-3 border-t border-slate-200 dark:border-[#27272a] flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                Pilih intervensi untuk siswa ini:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const st = detailStudent;
                    setDetailStudent(null);
                    onInitiateCounseling(st);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center gap-1"
                >
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>+ Sesi Konseling</span>
                </button>
                <button
                  onClick={() => {
                    const st = detailStudent;
                    setDetailStudent(null);
                    onInitiateHomeVisit(st);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>+ Home Visit</span>
                </button>
                <button
                  onClick={() => {
                    const st = detailStudent;
                    setDetailStudent(null);
                    onInitiateParentCall(st);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>+ Panggilan Ortu</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
