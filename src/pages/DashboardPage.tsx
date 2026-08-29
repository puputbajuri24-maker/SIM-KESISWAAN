import React, { useState } from 'react';
import {
  Users,
  Compass,
  Award,
  ShieldAlert,
  Calendar,
  ClipboardCheck,
  FileText,
  Plus,
  CheckCircle2,
  Database,
  Crown,
  MessageSquareQuote,
  FileSpreadsheet,
  HeartHandshake,
  Home,
  Mail,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSchool } from '../contexts/SchoolContext';
import { StatCard } from '../components/common/StatCard';
import { AnnouncementDashboardWidget } from '../components/announcements/AnnouncementDashboardWidget';

interface DashboardPageProps {
  onNavigate: (tabId: string) => void;
  onOpenAttendance?: (schedule: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onOpenAttendance }) => {
  const { currentUser, isSuperAdmin, isWaka, isPembinaOsim, isPembinaEkskul, isPembina, isGuruBK } = useAuth();
  const {
    students,
    extracurriculars,
    teachers,
    members,
    schedules,
    attendance,
    violations,
    achievements,
    activityReports,
    osimPrograms,
    osimMembers,
    osimAspirations,
    osimMeetings,
    counseling,
    homeVisits,
    parentCallLetters,
    careerGuidances,
    activeAcademicYear,
    activeSemester,
    seedFirebaseDatabase,
    isSyncing
  } = useSchool();

  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  // Statistics calculation for School-wide
  const totalStudents = students.filter(s => s.status === 'Aktif').length;
  const totalEkskul = extracurriculars.filter(e => e.status === 'Aktif').length;
  const totalAchievements = achievements.length;
  const pendingViolations = violations.filter(v => v.status !== 'Selesai').length;

  // Average attendance rate
  const totalAttendanceRecords = attendance.reduce((acc, curr) => acc + (curr.totalMembers || 0), 0);
  const totalPresentRecords = attendance.reduce((acc, curr) => acc + (curr.presentCount || 0), 0);
  const avgAttendanceRate = totalAttendanceRecords > 0 ? Math.round((totalPresentRecords / totalAttendanceRecords) * 100) : 94;

  // Coach-specific data for Pembina Ekskul
  const myAssignedEkskuls = (isPembinaEkskul || isPembina)
    ? extracurriculars.filter(e => 
        currentUser?.extracurricularIds?.includes(e.id) || 
        e.coachId === currentUser?.uid || 
        (currentUser?.displayName && e.coachName?.toLowerCase().includes(currentUser.displayName.toLowerCase().split(' ')[0]))
      )
    : [];

  const [selectedPembinaEkskulId, setSelectedPembinaEkskulId] = useState<string>('');

  const activeEkskul = (isPembinaEkskul || isPembina)
    ? (myAssignedEkskuls.find(e => e.id === selectedPembinaEkskulId) || myAssignedEkskuls[0] || extracurriculars[0])
    : null;

  const mySchedules = (isPembinaEkskul || isPembina) && activeEkskul
    ? schedules.filter(s => s.extracurricularId === activeEkskul.id)
    : schedules;

  const myReports = (isPembinaEkskul || isPembina) && activeEkskul
    ? activityReports.filter(r => r.extracurricularId === activeEkskul.id)
    : activityReports;

  const myMembers = (isPembinaEkskul || isPembina) && activeEkskul
    ? members.filter(m => m.extracurricularId === activeEkskul.id && m.status === 'Aktif')
    : [];

  const myAchievements = (isPembinaEkskul || isPembina) && activeEkskul
    ? achievements.filter(a => a.extracurricularId === activeEkskul.id || (activeEkskul.name && a.extracurricularName?.toLowerCase().includes(activeEkskul.name.toLowerCase())))
    : achievements;

  const myAttendanceRecords = (isPembinaEkskul || isPembina) && activeEkskul
    ? attendance.filter(a => a.extracurricularId === activeEkskul.id)
    : [];

  const myTotalAttMembers = myAttendanceRecords.reduce((acc, curr) => acc + (curr.totalMembers || 0), 0);
  const myTotalPresentMembers = myAttendanceRecords.reduce((acc, curr) => acc + (curr.presentCount || 0), 0);
  const myAvgAttendanceRate = myTotalAttMembers > 0 ? Math.round((myTotalPresentMembers / myTotalAttMembers) * 100) : 95;

  const handleSeedDatabase = async () => {
    const res = await seedFirebaseDatabase();
    setSeedMsg(res.message);
    setTimeout(() => setSeedMsg(null), 5000);
  };

  // ==========================================
  // VIEW 1: PEMBINA OSIM DASHBOARD
  // ==========================================
  if (isPembinaOsim) {
    const completedProker = osimPrograms.filter(p => p.status === 'Selesai').length;
    const ongoingProker = osimPrograms.filter(p => p.status === 'Berlangsung' || p.status === 'Disetujui').length;
    const answeredAspirations = osimAspirations.filter(a => a.status === 'Direalisasikan' || a.status === 'Sedang Dibahas').length;

    return (
      <div className="space-y-3 font-sans text-xs select-none">
        {/* Active Official Announcements Banner */}
        <AnnouncementDashboardWidget onNavigate={onNavigate} />

        {/* Top Header Banner */}
        <div className="p-3 bg-[#0d0d0f] border border-[#27272a] rounded flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-amber-600/20 border border-amber-500/40 rounded flex items-center justify-center text-amber-400 font-mono font-bold text-sm shrink-0">
              OS
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                  OPS_TERMINAL / PEMBINA_OSIM_HQ
                </span>
                <span className="bg-amber-500/10 text-amber-400 text-[9px] px-1.5 py-0.2 rounded border border-amber-500/20 font-mono">
                  {activeAcademicYear} ({activeSemester})
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-100 mt-0.5">
                {currentUser?.displayName} — Intrakurikuler & OSIM
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 font-mono">
            <button
              onClick={() => onNavigate('osim')}
              className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium text-[11px] flex items-center space-x-1.5 transition-colors shadow-[0_0_10px_rgba(245,158,11,0.3)]"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>+ KELOLA_OSIM</span>
            </button>
            <button
              onClick={() => onNavigate('activities')}
              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] flex items-center space-x-1.5 transition-colors shadow-[0_0_10px_rgba(59,130,246,0.3)]"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>+ AGENDA_SIDANG</span>
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="px-2.5 py-1 rounded bg-[#161618] border border-[#27272a] hover:border-amber-500/40 text-zinc-300 font-medium text-[11px] flex items-center space-x-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>+ LPJ_OSIM</span>
            </button>
          </div>
        </div>

        {/* OSIM KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <StatCard
            id="kpi-osim-pengurus"
            title="PENGURUS_OSIM"
            value={osimMembers.length}
            icon={Crown}
            subtitle="STRUKTUR RESMI TERDATA"
            colorTheme="amber"
            onClick={() => onNavigate('osim')}
          />
          <StatCard
            id="kpi-osim-proker"
            title="PROGRAM_KERJA"
            value={osimPrograms.length}
            icon={Compass}
            subtitle={`${completedProker} SELESAI / ${ongoingProker} AKTIF`}
            colorTheme="indigo"
            onClick={() => onNavigate('osim')}
          />
          <StatCard
            id="kpi-osim-aspirasi"
            title="KOTAK_ASPIRASI"
            value={osimAspirations.length}
            icon={MessageSquareQuote}
            subtitle={`${answeredAspirations} DITINDAKLANJUTI`}
            colorTheme="sky"
            onClick={() => onNavigate('osim')}
          />
          <StatCard
            id="kpi-osim-sidang"
            title="NOTULENSI_SIDANG"
            value={osimMeetings.length}
            icon={Calendar}
            subtitle="DOKUMEN SIDANG & RAPAT"
            colorTheme="emerald"
            onClick={() => onNavigate('osim')}
          />
        </div>

        {/* OSIM Telemetry Grid */}
        <div className="grid grid-cols-12 gap-2">
          {/* Left 8 Cols: Program Kerja Progress Monitor */}
          <div className="col-span-12 lg:col-span-8 p-3 bg-[#0d0d0f] border border-[#27272a] rounded flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                ROADMAP_PROGRAM_KERJA / OSIM_{activeAcademicYear.replace('/', '_')}
              </h3>
              <button
                onClick={() => onNavigate('osim')}
                className="text-[10px] font-mono text-amber-400 hover:underline"
              >
                KELOLA_SEMUA →
              </button>
            </div>

            <div className="space-y-2 flex-1">
              {osimPrograms.slice(0, 4).map(prog => (
                <div
                  key={prog.id}
                  onClick={() => onNavigate('osim')}
                  className="p-2 bg-[#161618] border border-[#27272a] rounded hover:border-amber-500/40 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="font-bold text-zinc-200 truncate">{prog.title}</span>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-800 text-amber-400 truncate max-w-[150px]">
                        {prog.sekbid}
                      </span>
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      prog.status === 'Selesai' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      prog.status === 'Berlangsung' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>
                      {prog.status.toUpperCase()} ({prog.progressPercentage}%)
                    </span>
                  </div>
                  <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        prog.progressPercentage >= 100 ? 'bg-emerald-500' :
                        prog.progressPercentage >= 50 ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${prog.progressPercentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 4 Cols: Kotak Aspirasi Masuk */}
          <div className="col-span-12 lg:col-span-4 p-3 bg-[#0d0d0f] border border-[#27272a] rounded flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                ASPIRASI_SISWA / FEED
              </h3>
              <span className="text-[9px] font-mono text-sky-400 bg-sky-500/10 px-1 py-0.2 rounded border border-sky-500/20">
                {osimAspirations.length} TERKIRIM
              </span>
            </div>

            <div className="space-y-1.5 flex-1 overflow-hidden font-mono text-[10px]">
              {osimAspirations.slice(0, 3).map(asp => (
                <div
                  key={asp.id}
                  onClick={() => onNavigate('osim')}
                  className="p-1.5 bg-[#161618] border border-[#27272a] rounded cursor-pointer hover:border-zinc-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-200 truncate">{asp.category}</span>
                    <span className="text-[8px] text-zinc-500">{asp.date}</span>
                  </div>
                  <p className="text-zinc-400 text-[9px] font-sans line-clamp-2 mt-0.5">{asp.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom OSIM Row: Sidang Schedule & Scope Info */}
        <div className="grid grid-cols-12 gap-2 font-mono text-[10px]">
          <div className="col-span-12 lg:col-span-6 p-3 bg-[#0d0d0f] border border-[#27272a] rounded">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#27272a]">
              <h3 className="font-bold text-zinc-500 uppercase tracking-widest text-[10px]">
                AGENDA_SIDANG_&_RAPAT_PLENO
              </h3>
              <button onClick={() => onNavigate('osim')} className="text-amber-400 text-[10px] hover:underline">
                NOTULENSI →
              </button>
            </div>
            <div className="space-y-1.5">
              {osimMeetings.slice(0, 3).map(m => (
                <div key={m.id} className="p-1.5 rounded bg-[#161618] border border-[#27272a] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-zinc-200">{m.title}</div>
                    <div className="text-zinc-500 text-[9px]">{m.location} • {m.leader}</div>
                  </div>
                  <div className="text-right text-[9px]">
                    <span className="text-amber-400 font-bold block">{m.date}</span>
                    <span className="text-zinc-500">{m.attendeesCount} Hadir</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6 p-3 bg-[#0d0d0f] border border-[#27272a] rounded flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#27272a]">
                <h3 className="font-bold text-zinc-500 uppercase tracking-widest text-[10px]">
                  OTORISASI_RUANG_LINGKUP / PEMBINA_OSIM
                </h3>
                <span className="text-emerald-400 font-bold">TERBATAS / SECURE</span>
              </div>
              <p className="text-zinc-400 font-sans text-xs">
                Akun Pembina OSIM memiliki hak akses khusus untuk membimbing pengurus OSIM, memverifikasi program kerja intrakurikuler, menanggapi kotak aspirasi siswa, dan menyusun LPJ kegiatan OSIM.
              </p>
            </div>
            <div className="mt-3 flex items-center space-x-2">
              <button
                onClick={() => onNavigate('osim')}
                className="px-3 py-1 bg-amber-600/20 border border-amber-500/40 text-amber-400 rounded hover:bg-amber-600/30 transition-colors"
              >
                Buka Menu OSIM Utama
              </button>
              <button
                onClick={() => onNavigate('reports')}
                className="px-3 py-1 bg-[#161618] border border-[#27272a] text-zinc-300 rounded hover:border-zinc-700 transition-colors"
              >
                Laporan LPJ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: PEMBINA EKSTRAKURIKULER DASHBOARD
  // ==========================================
  if (isPembinaEkskul || isPembina) {
    const quotaPct = activeEkskul && activeEkskul.quota > 0 
      ? Math.min(100, Math.round((myMembers.length / activeEkskul.quota) * 100)) 
      : 0;

    return (
      <div className="space-y-3 font-sans text-xs select-none">
        {/* Active Official Announcements Banner */}
        <AnnouncementDashboardWidget onNavigate={onNavigate} />

        {/* Top Header Banner */}
        <div className="p-3.5 bg-[#0d0d0f] border border-[#27272a] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-600/20 border border-emerald-500/40 rounded-lg flex items-center justify-center text-emerald-400 font-mono font-bold text-sm shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              PB
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                  OPS_TERMINAL / PEMBINA_EKSKUL
                </span>
                <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono">
                  {activeAcademicYear} ({activeSemester})
                </span>
                {activeEkskul?.category && (
                  <span className="bg-blue-500/10 text-blue-400 text-[9px] px-1.5 py-0.5 rounded border border-blue-500/20 font-mono">
                    KATEGORI: {activeEkskul.category.toUpperCase()}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                <span>{currentUser?.displayName}</span>
                <span className="text-zinc-500 font-normal">|</span>
                <span className="text-emerald-400 font-semibold">{activeEkskul?.name || 'Ekstrakurikuler'}</span>
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono">
            <button
              onClick={() => onNavigate('attendance')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center space-x-1.5 shadow-[0_0_12px_rgba(16,185,129,0.35)] transition-all hover:scale-105"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>+ INPUT_PRESENSI</span>
            </button>
            <button
              onClick={() => onNavigate('schedules')}
              className="px-2.5 py-1.5 rounded-lg bg-[#161618] border border-[#27272a] hover:border-emerald-500/40 text-zinc-200 font-medium text-xs flex items-center space-x-1.5 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>+ JADWAL_SESI</span>
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="px-2.5 py-1.5 rounded-lg bg-[#161618] border border-[#27272a] hover:border-blue-500/40 text-zinc-200 font-medium text-xs flex items-center space-x-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>+ LPJ_KEGIATAN</span>
            </button>
            <button
              onClick={() => onNavigate('achievements')}
              className="px-2.5 py-1.5 rounded-lg bg-[#161618] border border-[#27272a] hover:border-amber-500/40 text-amber-400 font-medium text-xs flex items-center space-x-1.5 transition-colors"
            >
              <Award className="w-3.5 h-3.5" />
              <span>+ PRESTASI</span>
            </button>
          </div>
        </div>

        {/* Multi-Ekskul Switcher (if coach teaches more than 1 extracurricular) */}
        {myAssignedEkskuls.length > 1 && (
          <div className="p-2.5 bg-[#0d0d0f] border border-[#27272a] rounded-xl flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-mono text-zinc-500 uppercase px-2 shrink-0">
              PILIH_UNIT_BINAAN:
            </span>
            {myAssignedEkskuls.map(ek => (
              <button
                key={ek.id}
                onClick={() => setSelectedPembinaEkskulId(ek.id)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all shrink-0 ${
                  (activeEkskul?.id === ek.id)
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'bg-[#161618] text-zinc-400 border border-[#27272a] hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {ek.name} ({members.filter(m => m.extracurricularId === ek.id && m.status === 'Aktif').length} Siswa)
              </button>
            ))}
          </div>
        )}

        {/* Ekskul KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <StatCard
            id="kpi-ekskul-anggota"
            title="ANGGOTA_BINAAN"
            value={myMembers.length}
            icon={Users}
            subtitle={`KUOTA: ${myMembers.length}/${activeEkskul?.quota || 40} (${quotaPct}%)`}
            colorTheme="emerald"
            onClick={() => onNavigate('members')}
          />
          <StatCard
            id="kpi-ekskul-presensi"
            title="TINGKAT_KEHADIRAN"
            value={`${myAvgAttendanceRate}%`}
            icon={ClipboardCheck}
            subtitle={`${myAttendanceRecords.length} SESI TERLAKSANA`}
            colorTheme="sky"
            onClick={() => onNavigate('attendance')}
          />
          <StatCard
            id="kpi-ekskul-jadwal"
            title="JADWAL_LATIHAN"
            value={mySchedules.length}
            icon={Calendar}
            subtitle={`${activeEkskul?.day || 'Rutin'} • ${activeEkskul?.startTime || '15:30'}-${activeEkskul?.endTime || '17:30'}`}
            colorTheme="indigo"
            onClick={() => onNavigate('schedules')}
          />
          <StatCard
            id="kpi-ekskul-prestasi"
            title="PRESTASI_BINAAN"
            value={myAchievements.length}
            icon={Award}
            subtitle="MEDALI & KEJUARAAN"
            colorTheme="amber"
            onClick={() => onNavigate('achievements')}
          />
        </div>

        {/* Ekskul Schedule & Roster Grid */}
        <div className="grid grid-cols-12 gap-2">
          {/* Left 7 Cols: Sesi Latihan & Presensi Mendatang */}
          <div className="col-span-12 lg:col-span-7 p-3.5 bg-[#0d0d0f] border border-[#27272a] rounded-xl flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#27272a]">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h3 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                  SESI_LATIHAN & AGENDA / {activeEkskul?.name?.toUpperCase() || 'EKSKUL'}
                </h3>
              </div>
              <button
                onClick={() => onNavigate('schedules')}
                className="text-[10px] font-mono text-emerald-400 hover:underline"
              >
                KELOLA_JADWAL →
              </button>
            </div>

            <div className="space-y-2 flex-1">
              {mySchedules.slice(0, 4).map(sch => (
                <div
                  key={sch.id}
                  className="p-2.5 bg-[#161618] border border-[#27272a] rounded-lg hover:border-emerald-500/40 flex items-center justify-between transition-all"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-zinc-100 flex items-center gap-2">
                      <span>{sch.title}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                        sch.status === 'Selesai' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                        sch.status === 'Dijadwalkan' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                        'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {sch.status}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500">
                      📍 {sch.location} • ⏰ {sch.startTime} - {sch.endTime}
                    </div>
                  </div>
                  <div className="text-right font-mono flex items-center gap-2">
                    <div>
                      <span className="text-emerald-400 font-bold text-xs block">{sch.date}</span>
                    </div>
                    <button
                      onClick={() => onNavigate('attendance')}
                      className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-mono border border-emerald-500/30 transition-colors"
                    >
                      Presensi
                    </button>
                  </div>
                </div>
              ))}
              {mySchedules.length === 0 && (
                <div className="py-8 text-center text-zinc-500 font-mono bg-[#161618] rounded-lg border border-[#27272a]/60">
                  Belum ada sesi latihan terdaftar. Klik "+ JADWAL_SESI" untuk membuat jadwal latihan baru.
                </div>
              )}
            </div>
          </div>

          {/* Right 5 Cols: Anggota Binaan Terdaftar */}
          <div className="col-span-12 lg:col-span-5 p-3.5 bg-[#0d0d0f] border border-[#27272a] rounded-xl flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#27272a]">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <h3 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                  ROSTER_ANGGOTA_BINAAN ({myMembers.length})
                </h3>
              </div>
              <button
                onClick={() => onNavigate('members')}
                className="text-[10px] font-mono text-indigo-400 hover:underline"
              >
                LIHAT_SEMUA →
              </button>
            </div>

            <div className="space-y-1.5 flex-1 font-mono text-[11px] overflow-y-auto max-h-[220px]">
              {myMembers.slice(0, 5).map(m => (
                <div key={m.id} className="p-2 bg-[#161618] border border-[#27272a] rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0 border border-emerald-500/30">
                      {m.studentName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-zinc-200 truncate max-w-[130px] sm:max-w-[180px]">{m.studentName}</div>
                      <div className="text-[10px] text-zinc-500">NIS: {m.studentNis} • {m.studentClass}</div>
                    </div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {m.status}
                  </span>
                </div>
              ))}
              {myMembers.length === 0 && (
                <div className="py-8 text-center text-zinc-500 font-mono bg-[#161618] rounded-lg border border-[#27272a]/60">
                  Belum ada siswa terdaftar. Klik "+ KELOLA_ANGGOTA" untuk mendaftarkan siswa.
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigate('members')}
              className="mt-2 w-full py-1.5 rounded-lg bg-[#161618] hover:bg-[#202024] border border-[#27272a] text-zinc-300 text-xs font-mono text-center transition-colors"
            >
              + Daftarkan Anggota Baru
            </button>
          </div>
        </div>

        {/* Prestasi & LPJ Activities Row */}
        <div className="grid grid-cols-12 gap-2">
          {/* Left 6 Cols: Prestasi Unit Binaan */}
          <div className="col-span-12 lg:col-span-6 p-3.5 bg-[#0d0d0f] border border-[#27272a] rounded-xl flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#27272a]">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-400" />
                <h3 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                  PRESTASI & PENGHARGAAN ({myAchievements.length})
                </h3>
              </div>
              <button
                onClick={() => onNavigate('achievements')}
                className="text-[10px] font-mono text-amber-400 hover:underline"
              >
                + INPUT_PRESTASI →
              </button>
            </div>

            <div className="space-y-2 flex-1">
              {myAchievements.slice(0, 3).map(ach => (
                <div key={ach.id} className="p-2.5 bg-[#161618] border border-[#27272a] rounded-lg flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-zinc-100 flex items-center gap-1.5">
                      <span className="text-amber-400">🏆</span>
                      <span>{ach.title}</span>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500">
                      Oleh: {ach.studentName} ({ach.studentClass}) • Tingkat {ach.level}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold shrink-0">
                    {ach.date}
                  </span>
                </div>
              ))}
              {myAchievements.length === 0 && (
                <div className="py-6 text-center text-zinc-500 font-mono bg-[#161618] rounded-lg border border-[#27272a]/60">
                  Belum ada catatan medali/piala. Catat raihan kejuaraan ekskul ini!
                </div>
              )}
            </div>
          </div>

          {/* Right 6 Cols: LPJ & Proposal Anggaran */}
          <div className="col-span-12 lg:col-span-6 p-3.5 bg-[#0d0d0f] border border-[#27272a] rounded-xl flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#27272a]">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <h3 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                  PROPOSAL & LPJ KESISWAAN ({myReports.length})
                </h3>
              </div>
              <button
                onClick={() => onNavigate('reports')}
                className="text-[10px] font-mono text-blue-400 hover:underline"
              >
                + BUAT_LPJ →
              </button>
            </div>

            <div className="space-y-2 flex-1 font-mono text-[11px]">
              {myReports.slice(0, 3).map(rep => (
                <div key={rep.id} className="p-2.5 bg-[#161618] border border-[#27272a] rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-bold text-zinc-200">{rep.activityTitle}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      Pengeluaran: Rp {(rep.totalBudgetSpent || 0).toLocaleString('id-ID')} • {rep.date}
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                    rep.status === 'Disetujui' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                    rep.status === 'Diajukan' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                    'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}>
                    {rep.status}
                  </span>
                </div>
              ))}
              {myReports.length === 0 && (
                <div className="py-6 text-center text-zinc-500 font-mono bg-[#161618] rounded-lg border border-[#27272a]/60">
                  Belum ada proposal / LPJ yang diajukan untuk unit ekskul ini.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Unit Ekskul Banner */}
        {activeEkskul && (
          <div className="p-3.5 bg-[#0d0d0f] border border-[#27272a] rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase block font-bold">INFO_PEMBINA & LOKASI</span>
              <div className="text-zinc-200 font-semibold">{activeEkskul.coachName}</div>
              <div className="text-[11px] text-zinc-400">
                {activeEkskul.assistantCoachName ? `Asisten: ${activeEkskul.assistantCoachName}` : 'Pembina Tunggal'}
              </div>
              <div className="text-[11px] text-emerald-400">📍 Lokasi: {activeEkskul.location}</div>
            </div>
            <div className="space-y-1 md:col-span-2">
              <span className="text-[10px] text-zinc-500 uppercase block font-bold">TARGET & VISI CAPAIAN</span>
              <div className="text-zinc-300 text-[11px] italic">
                "{activeEkskul.target || activeEkskul.vision || 'Membina bakat minat dan mengukir prestasi siswa madrasah.'}"
              </div>
              <div className="text-[10px] text-zinc-500">
                Jadwal Rutin: Setiap hari <span className="text-zinc-300 font-bold">{activeEkskul.day}</span> pukul <span className="text-zinc-300 font-bold">{activeEkskul.startTime} - {activeEkskul.endTime} WIB</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 3: GURU BK DASHBOARD (COMMAND CENTER BK)
  // ==========================================
  if (isGuruBK) {
    const completedCounseling = counseling.filter(c => c.status === 'Selesai').length;
    const followUpNeeded = counseling.filter(c => c.status === 'Perlu Tindak Lanjut').length;
    const pendingHomeVisits = homeVisits.filter(h => h.status !== 'Terlaksana').length;
    const activeParentCalls = parentCallLetters.filter(p => p.status === 'Diterbitkan').length;

    return (
      <div className="space-y-3 font-sans text-xs select-none">
        {/* Active Official Announcements Banner */}
        <AnnouncementDashboardWidget onNavigate={onNavigate} />

        {/* 1. Header Banner */}
        <div className="p-3 bg-[#0d0d0f] border border-[#27272a] rounded flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-pink-600/20 border border-pink-500/40 rounded flex items-center justify-center text-pink-400 font-mono font-bold text-sm shrink-0">
              BK
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[10px] font-bold text-pink-500 uppercase tracking-widest">
                  OPS_TERMINAL / GURU_BK_HQ
                </span>
                <span className="bg-pink-500/10 text-pink-400 text-[9px] px-1.5 py-0.2 rounded border border-pink-500/20 font-mono">
                  {activeAcademicYear} ({activeSemester})
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-100 mt-0.5">
                {currentUser?.displayName} — Pusat Bimbingan, Konseling & Advokasi Siswa
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 font-mono">
            <button
              onClick={() => onNavigate('counseling')}
              className="px-2.5 py-1 rounded bg-pink-600 hover:bg-pink-500 text-white font-medium text-[11px] flex items-center space-x-1.5 shadow-[0_0_10px_rgba(236,72,153,0.3)] transition-colors"
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>+ SESI_KONSELING</span>
            </button>
            <button
              onClick={() => onNavigate('counseling')}
              className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium text-[11px] flex items-center space-x-1.5 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>+ HOME_VISIT</span>
            </button>
            <button
              onClick={() => onNavigate('counseling')}
              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] flex items-center space-x-1.5 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>+ SURAT_PANGGILAN</span>
            </button>
            <button
              onClick={() => onNavigate('violations')}
              className="px-2.5 py-1 rounded bg-[#161618] border border-[#27272a] hover:border-red-500/40 text-red-400 font-medium text-[11px] flex items-center space-x-1.5 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>PELANGGARAN</span>
            </button>
          </div>
        </div>

        {/* 2. BK Key Performance Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <StatCard
            id="kpi-bk-counseling"
            title="TOTAL_KONSELING"
            value={counseling.length}
            icon={HeartHandshake}
            subtitle={`${completedCounseling} Selesai • ${followUpNeeded} Pantau`}
            colorTheme="pink"
            onClick={() => onNavigate('counseling')}
          />
          <StatCard
            id="kpi-bk-homevisit"
            title="KUNJUNGAN_RUMAH"
            value={homeVisits.length}
            icon={Home}
            subtitle={pendingHomeVisits > 0 ? `${pendingHomeVisits} Perlu Tindak Lanjut` : 'Semua Berita Acara Rapi'}
            colorTheme="purple"
            onClick={() => onNavigate('counseling')}
          />
          <StatCard
            id="kpi-bk-parentcall"
            title="SURAT_PANGGILAN_ORTU"
            value={parentCallLetters.length}
            icon={Mail}
            subtitle={activeParentCalls > 0 ? `${activeParentCalls} Surat Aktif` : 'Selesai Dimediasi'}
            colorTheme="blue"
            onClick={() => onNavigate('counseling')}
          />
          <StatCard
            id="kpi-bk-career"
            title="ASESMEN_KARIR_PEMINATAN"
            value={careerGuidances.length}
            icon={GraduationCap}
            subtitle="Peminatan PTN & Profesi"
            colorTheme="emerald"
            onClick={() => onNavigate('counseling')}
          />
        </div>

        {/* 3. Operational Grid */}
        <div className="grid grid-cols-12 gap-2">
          {/* Left Column (8 cols): Sesi Konseling & Kunjungan Rumah Terkini */}
          <div className="col-span-12 lg:col-span-8 space-y-2">
            {/* Sesi Konseling Terkini */}
            <div className="p-3 bg-[#0d0d0f] border border-[#27272a] rounded">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                  SESI_KONSELING_TERKINI & ATENSI KHUSUS
                </h3>
                <button
                  onClick={() => onNavigate('counseling')}
                  className="text-[10px] font-mono text-pink-400 hover:underline"
                >
                  SEMUA_KONSELING →
                </button>
              </div>

              <div className="space-y-1.5">
                {counseling.slice(0, 4).map(c => (
                  <div
                    key={c.id}
                    onClick={() => onNavigate('counseling')}
                    className="p-2 bg-[#161618] border border-[#27272a] rounded hover:border-pink-500/40 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-200">{c.studentName}</span>
                        <span className="text-[10px] text-zinc-500">({c.studentClass})</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-pink-500/20 text-pink-300 border border-pink-500/30">
                          {c.serviceField || 'Belajar'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{c.topic}</p>
                    </div>

                    <div className="text-right font-mono text-[9px] shrink-0">
                      <span className="text-zinc-400 block">{c.date}</span>
                      <span className={`font-bold ${
                        c.status === 'Selesai' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))}
                {counseling.length === 0 && (
                  <div className="py-6 text-center text-zinc-600 font-mono text-xs">
                    Belum ada data sesi konseling terdata
                  </div>
                )}
              </div>
            </div>

            {/* Agenda Kunjungan Rumah */}
            <div className="p-3 bg-[#0d0d0f] border border-[#27272a] rounded">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                  AGENDA_KUNJUNGAN_RUMAH (HOME VISIT)
                </h3>
                <button
                  onClick={() => onNavigate('counseling')}
                  className="text-[10px] font-mono text-purple-400 hover:underline"
                >
                  LIHAT_BERITA_ACARA →
                </button>
              </div>

              <div className="space-y-1.5">
                {homeVisits.slice(0, 3).map(h => (
                  <div
                    key={h.id}
                    onClick={() => onNavigate('counseling')}
                    className="p-2 bg-[#161618] border border-[#27272a] rounded hover:border-purple-500/40 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-200">{h.studentName}</span>
                        <span className="text-[10px] text-zinc-500">Kelas: {h.studentClass}</span>
                      </div>
                      <p className="text-[11px] text-amber-400/90 line-clamp-1 mt-0.5">{h.purpose}</p>
                    </div>

                    <div className="text-right font-mono text-[9px] shrink-0">
                      <span className="text-purple-400 font-bold block">{h.date}</span>
                      <span className="text-zinc-500">{h.status}</span>
                    </div>
                  </div>
                ))}
                {homeVisits.length === 0 && (
                  <div className="py-4 text-center text-zinc-600 font-mono text-xs">
                    Belum ada agenda home visit
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Siswa Pelanggaran & Panggilan Ortu */}
          <div className="col-span-12 lg:col-span-4 space-y-2">
            {/* Siswa Prioritas Atensi BK */}
            <div className="p-3 bg-[#0d0d0f] border border-[#27272a] rounded">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                  SISWA_PERLU_ATENSI_BK
                </h3>
                <button
                  onClick={() => onNavigate('violations')}
                  className="text-[10px] font-mono text-red-400 hover:underline"
                >
                  PELANGGARAN →
                </button>
              </div>

              <div className="space-y-1.5">
                {students
                  .filter(s => (s.violationPoints || 0) > 0)
                  .sort((a, b) => (b.violationPoints || 0) - (a.violationPoints || 0))
                  .slice(0, 4)
                  .map(st => (
                    <div
                      key={st.id}
                      onClick={() => onNavigate('students')}
                      className="p-1.5 bg-[#161618] border border-[#27272a] rounded hover:border-red-500/40 flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-zinc-200">{st.fullName}</div>
                        <div className="text-[9px] text-zinc-500">Kelas: {st.className}</div>
                      </div>
                      <div className="text-right">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {st.violationPoints} P
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Status Surat Panggilan Ortu Terkini */}
            <div className="p-3 bg-[#0d0d0f] border border-[#27272a] rounded">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                  STATUS_SURAT_PANGGILAN_ORTU
                </h3>
                <button
                  onClick={() => onNavigate('counseling')}
                  className="text-[10px] font-mono text-blue-400 hover:underline"
                >
                  KELOLA_SP →
                </button>
              </div>

              <div className="space-y-1.5">
                {parentCallLetters.slice(0, 3).map(p => (
                  <div
                    key={p.id}
                    onClick={() => onNavigate('counseling')}
                    className="p-1.5 bg-[#161618] border border-[#27272a] rounded hover:border-blue-500/40 cursor-pointer"
                  >
                    <div className="flex items-center justify-between font-mono text-[9px]">
                      <span className="text-blue-400 font-bold">SP Ke-{p.callNumber}</span>
                      <span className="text-zinc-500">{p.callDate}</span>
                    </div>
                    <div className="font-semibold text-zinc-200 mt-0.5">{p.studentName} ({p.studentClass})</div>
                    <div className="text-[9px] text-zinc-400 truncate">Yth. {p.parentName}</div>
                  </div>
                ))}
                {parentCallLetters.length === 0 && (
                  <div className="py-4 text-center text-zinc-600 text-[10px]">
                    Belum ada surat panggilan diterbitkan
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 4: SUPER ADMIN & WAKA KESISWAAN (FULL COMMAND CENTER)
  // ==========================================
  return (
    <div className="space-y-3 font-sans text-xs select-none">
      {/* Active Official Announcements Banner */}
      <AnnouncementDashboardWidget onNavigate={onNavigate} />

      {/* 1. Top High Density Header Banner */}
      <div className="p-3 bg-[#0d0d0f] border border-[#27272a] rounded flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600/20 border border-blue-500/40 rounded flex items-center justify-center text-blue-400 font-mono font-bold text-sm shrink-0">
            HQ
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                OPS_TERMINAL / {isSuperAdmin ? 'ROOT_SUPER_ADMIN' : 'WAKA_KESISWAAN'}
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-1.5 py-0.2 rounded border border-emerald-500/20 font-mono">
                {activeAcademicYear} ({activeSemester})
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-100 mt-0.5">
              {currentUser?.displayName} — {isSuperAdmin ? 'Akses Penuh Seluruh Sistem Kesiswaan' : 'Pusat Komando Kesiswaan'}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 font-mono">
          <button
            onClick={() => onNavigate('osim')}
            className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium text-[11px] flex items-center space-x-1.5 transition-colors shadow-[0_0_10px_rgba(245,158,11,0.3)]"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>+ OSIM_PROKER</span>
          </button>
          <button
            onClick={() => onNavigate('activities')}
            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] flex items-center space-x-1.5 transition-colors shadow-[0_0_10px_rgba(59,130,246,0.3)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ AGENDA</span>
          </button>
          <button
            onClick={() => onNavigate('violations')}
            className="px-2.5 py-1 rounded bg-[#161618] border border-[#27272a] hover:border-red-500/40 text-red-400 font-medium text-[11px] flex items-center space-x-1.5 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>+ PELANGGARAN</span>
          </button>
          {isSuperAdmin && (
            <button
              onClick={handleSeedDatabase}
              disabled={isSyncing}
              className="px-2.5 py-1 rounded bg-[#161618] border border-[#27272a] hover:border-blue-500/40 text-zinc-300 font-medium text-[11px] flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>{isSyncing ? 'SYNCING...' : 'SYNC_DB'}</span>
            </button>
          )}
        </div>
      </div>

      {seedMsg && (
        <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{seedMsg}</span>
        </div>
      )}

      {/* 2. KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <StatCard
          id="kpi-siswa"
          title="TOTAL_SISWA_AKTIF"
          value={totalStudents}
          icon={Users}
          subtitle="8 ROMBEL TERDATA"
          trend={{ value: '100%', isPositive: true }}
          colorTheme="indigo"
          onClick={() => onNavigate('students')}
        />
        <StatCard
          id="kpi-ekskul"
          title="UNIT_EKSTRAKURIKULER"
          value={totalEkskul}
          icon={Compass}
          subtitle={`${teachers.filter(t => t.isPembina).length} GURU PEMBINA`}
          colorTheme="emerald"
          onClick={() => onNavigate('extracurriculars')}
        />
        <StatCard
          id="kpi-kehadiran"
          title="PRESENSI_INDEX"
          value={`${avgAttendanceRate}%`}
          icon={ClipboardCheck}
          subtitle="PARTISIPASI RATA-RATA"
          trend={{ value: '+3.2%', isPositive: true }}
          colorTheme="sky"
          onClick={() => onNavigate('attendance')}
        />
        <StatCard
          id="kpi-prestasi"
          title="PRESTASI_TERCATAT"
          value={totalAchievements}
          icon={Award}
          subtitle="KOTA S.D. NASIONAL"
          trend={{ value: '+4 BARU', isPositive: true }}
          colorTheme="amber"
          onClick={() => onNavigate('achievements')}
        />
      </div>

      {/* 3. Telemetry & Analytics Grid */}
      <div className="grid grid-cols-12 gap-2">
        {/* Left 8 Cols: Attendance Volume Visualizer */}
        <div className="col-span-12 lg:col-span-8 p-3 bg-[#0d0d0f] border border-[#27272a] rounded flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
              PRESENSI_VOLUME / 10_SESI_TERAKHIR
            </h3>
            <div className="flex space-x-3 text-[10px] font-mono">
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span>
                <span className="text-zinc-400">Hadir (%)</span>
              </div>
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 mr-1.5"></span>
                <span className="text-zinc-400">Target (90%)</span>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-[120px] flex items-end space-x-1.5 pb-1 border-b border-[#27272a]">
            {[
              { label: 'Pramuka', pct: 92, count: 48 },
              { label: 'PMR', pct: 96, count: 32 },
              { label: 'Paskibra', pct: 100, count: 30 },
              { label: 'Futsal', pct: 88, count: 28 },
              { label: 'Basket', pct: 90, count: 25 },
              { label: 'Robotik', pct: 95, count: 22 },
              { label: 'English', pct: 86, count: 24 },
              { label: 'Tari', pct: 94, count: 20 },
              { label: 'Rohis', pct: 98, count: 35 },
              { label: 'KIR', pct: 91, count: 18 }
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                <div
                  className={`w-full rounded-t transition-all ${
                    bar.pct >= 95
                      ? 'bg-blue-500/60 border-t border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                      : bar.pct >= 90
                      ? 'bg-blue-500/40 border-t border-blue-500/80'
                      : 'bg-blue-500/20 border-t border-blue-500/50'
                  }`}
                  style={{ height: `${bar.pct}%` }}
                />
                <span className="text-[8px] font-mono text-zinc-500 mt-1 truncate w-full text-center">
                  {bar.label.slice(0, 3).toUpperCase()}
                </span>
                <div className="absolute -top-7 hidden group-hover:flex px-1.5 py-0.5 bg-[#161618] border border-[#27272a] rounded text-[9px] font-mono text-blue-300 z-10 whitespace-nowrap">
                  {bar.label}: {bar.pct}% ({bar.count} Org)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 4 Cols: Discipline Alerts */}
        <div className="col-span-12 lg:col-span-4 p-3 bg-[#0d0d0f] border border-[#27272a] rounded flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
              DISCIPLINE_ALERTS / CASENOTES
            </h3>
            <span className="text-[9px] font-mono text-red-400 bg-red-500/10 px-1 py-0.2 rounded border border-red-500/20">
              {pendingViolations} ACTIVE
            </span>
          </div>

          <div className="space-y-1.5 flex-1 overflow-hidden font-mono text-[10px]">
            {violations.slice(0, 3).map(v => (
              <div
                key={v.id}
                onClick={() => onNavigate('violations')}
                className="p-1.5 bg-[#161618] border border-[#27272a] rounded flex items-center justify-between cursor-pointer hover:border-zinc-700"
              >
                <div className="flex items-center space-x-2 truncate">
                  <div
                    className={`w-1 h-6 rounded-full shrink-0 ${
                      v.category === 'Berat'
                        ? 'bg-red-500'
                        : v.category === 'Sedang'
                        ? 'bg-orange-500'
                        : 'bg-yellow-500'
                    }`}
                  />
                  <div className="truncate">
                    <div className="font-bold text-zinc-200 truncate">
                      {v.studentName} ({v.studentClass})
                    </div>
                    <div className="text-zinc-500 text-[9px] truncate">
                      {v.violationType} (+{v.points}pt)
                    </div>
                  </div>
                </div>
                <span className="text-[9px] text-zinc-600 shrink-0 ml-1">{v.date.slice(5)}</span>
              </div>
            ))}

            {violations.length === 0 && (
              <div className="py-4 text-center text-zinc-600 text-[10px]">NO ACTIVE DISCIPLINE VIOLATIONS</div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Schedules & Raw Audit Logs */}
      <div className="grid grid-cols-12 gap-2">
        {/* Left 4 Cols: Live Telemetry Raw Log Feed */}
        <div className="col-span-12 lg:col-span-4 p-3 bg-[#0d0d0f] border border-[#27272a] rounded flex flex-col font-mono text-[10px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#27272a]">
            <h3 className="font-bold text-zinc-500 uppercase tracking-widest text-[10px]">
              RAW_LOG_FEED / AUDIT
            </h3>
            <div className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-zinc-600 text-[9px]">STREAMING</span>
            </div>
          </div>

          <div className="space-y-1 text-zinc-400 max-h-48 overflow-y-auto">
            <div className="flex space-x-1.5">
              <span className="text-blue-500 shrink-0">[10:14:01]</span>
              <span className="text-zinc-500 italic shrink-0">AUTH:</span>
              <span className="truncate">User {currentUser?.displayName?.split(' ')[0]} authenticated</span>
            </div>
            <div className="flex space-x-1.5">
              <span className="text-blue-500 shrink-0">[10:14:02]</span>
              <span className="text-zinc-500 italic shrink-0">SYNC:</span>
              <span className="truncate">Firestore cluster connected :: OK</span>
            </div>
            <div className="flex space-x-1.5">
              <span className="text-emerald-500 shrink-0">[10:14:03]</span>
              <span className="text-zinc-300 shrink-0">ATTEND:</span>
              <span className="truncate">Sesi Pramuka updated (96% presence)</span>
            </div>
            <div className="flex space-x-1.5">
              <span className="text-orange-500 shrink-0">[10:14:05]</span>
              <span className="text-zinc-400 shrink-0">LPJ:</span>
              <span className="truncate">Proposal LDKS awaiting Waka verification</span>
            </div>
            <div className="flex space-x-1.5">
              <span className="text-blue-500 shrink-0">[10:14:08]</span>
              <span className="text-zinc-500 italic shrink-0">HEART:</span>
              <span className="truncate">Memory usage stable (42MB / 512MB)</span>
            </div>
          </div>
        </div>

        {/* Center 4 Cols: Upcoming Schedules Matrix */}
        <div className="col-span-12 lg:col-span-4 p-3 bg-[#0d0d0f] border border-[#27272a] rounded flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#27272a]">
            <h3 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
              SCHEDULE_QUEUE / AKTIVITAS
            </h3>
            <button
              onClick={() => onNavigate('schedules')}
              className="text-[10px] font-mono text-blue-400 hover:underline"
            >
              VIEW_ALL →
            </button>
          </div>

          <div className="space-y-1.5 flex-1">
            {schedules.slice(0, 3).map(sch => (
              <div
                key={sch.id}
                onClick={() => onNavigate('schedules')}
                className="p-1.5 rounded bg-[#161618] border border-[#27272a] hover:border-zinc-700 flex items-center justify-between cursor-pointer"
              >
                <div className="truncate">
                  <div className="font-semibold text-zinc-200 text-xs truncate">
                    {sch.title}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 truncate">
                    {sch.coachName} • {sch.location}
                  </div>
                </div>
                <div className="text-right font-mono text-[9px] shrink-0 ml-2">
                  <span className="text-blue-400 font-bold block">{sch.date}</span>
                  <span className="text-zinc-500">{sch.startTime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 4 Cols: Sector Distribution */}
        <div className="col-span-12 lg:col-span-4 p-3 bg-[#0d0d0f] border border-[#27272a] rounded flex flex-col font-mono text-[10px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#27272a]">
            <h3 className="font-bold text-zinc-500 uppercase tracking-widest text-[10px]">
              QUOTA_CAPACITY / SECTOR
            </h3>
            <span className="text-zinc-500">AVG: 82%</span>
          </div>

          <div className="space-y-2 flex-1">
            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-zinc-400">OLAHRAGA & BELADIRI</span>
                <span className="text-zinc-200">88%</span>
              </div>
              <div className="h-1 w-full bg-[#161618] rounded-full overflow-hidden border border-zinc-800">
                <div className="h-full bg-blue-500 w-[88%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-zinc-400">SENI & KULTUR</span>
                <span className="text-zinc-200">74%</span>
              </div>
              <div className="h-1 w-full bg-[#161618] rounded-full overflow-hidden border border-zinc-800">
                <div className="h-full bg-emerald-500 w-[74%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-zinc-400">SAINS & TEKNOLOGI</span>
                <span className="text-zinc-200">92%</span>
              </div>
              <div className="h-1 w-full bg-[#161618] rounded-full overflow-hidden border border-zinc-800">
                <div className="h-full bg-purple-500 w-[92%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-zinc-400">KEAGAMAAN & SOSIAL</span>
                <span className="text-zinc-200">80%</span>
              </div>
              <div className="h-1 w-full bg-[#161618] rounded-full overflow-hidden border border-zinc-800">
                <div className="h-full bg-amber-500 w-[80%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
