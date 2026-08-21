import React, { useState } from 'react';
import {
  Users,
  Compass,
  Award,
  ShieldAlert,
  Calendar,
  ClipboardCheck,
  FileText,
  Package,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Database,
  Activity,
  Radio,
  TrendingUp,
  Cpu,
  Layers,
  Terminal,
  Crown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSchool } from '../contexts/SchoolContext';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/Badge';

interface DashboardPageProps {
  onNavigate: (tabId: string) => void;
  onOpenAttendance?: (schedule: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onOpenAttendance }) => {
  const { currentUser, isWakaOrAdmin, isPembina } = useAuth();
  const {
    students,
    extracurriculars,
    teachers,
    activities,
    schedules,
    attendance,
    violations,
    achievements,
    activityReports,
    needsRequests,
    announcements,
    osimPrograms,
    osimMembers,
    activeAcademicYear,
    activeSemester,
    seedFirebaseDatabase,
    isSyncing
  } = useSchool();

  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  // Statistics calculation
  const totalStudents = students.filter(s => s.status === 'Aktif').length;
  const totalEkskul = extracurriculars.filter(e => e.status === 'Aktif').length;
  const totalTeachers = teachers.length;
  const totalAchievements = achievements.length;
  const pendingViolations = violations.filter(v => v.status !== 'Selesai').length;
  const pendingReports = activityReports.filter(r => r.status === 'Diajukan').length;
  const pendingNeeds = needsRequests.filter(n => n.status === 'Diajukan').length;

  // Average attendance rate
  const totalAttendanceRecords = attendance.reduce((acc, curr) => acc + (curr.totalMembers || 0), 0);
  const totalPresentRecords = attendance.reduce((acc, curr) => acc + (curr.presentCount || 0), 0);
  const avgAttendanceRate = totalAttendanceRecords > 0 ? Math.round((totalPresentRecords / totalAttendanceRecords) * 100) : 94;

  // Coach-specific data (if logged in as Pembina)
  const myEkskul = isPembina
    ? extracurriculars.find(e => currentUser?.extracurricularIds?.includes(e.id) || e.coachId === currentUser?.uid) || extracurriculars[0]
    : null;

  const mySchedules = isPembina && myEkskul
    ? schedules.filter(s => s.extracurricularId === myEkskul.id)
    : schedules;

  const myReports = isPembina && myEkskul
    ? activityReports.filter(r => r.extracurricularId === myEkskul.id)
    : activityReports;

  const handleSeedDatabase = async () => {
    const res = await seedFirebaseDatabase();
    setSeedMsg(res.message);
    setTimeout(() => setSeedMsg(null), 5000);
  };

  return (
    <div className="space-y-3 font-sans text-xs select-none">
      {/* 1. Top High Density Header Banner */}
      <div className="p-3 bg-[#0d0d0f] border border-[#27272a] rounded flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600/20 border border-blue-500/40 rounded flex items-center justify-center text-blue-400 font-mono font-bold text-sm shrink-0">
            HQ
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                OPS_TERMINAL / {isWakaOrAdmin ? 'WAKA_KESISWAAN' : 'PEMBINA_UNIT'}
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-1.5 py-0.2 rounded border border-emerald-500/20 font-mono">
                {activeAcademicYear} ({activeSemester})
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-100 mt-0.5">
              {currentUser?.displayName} — {isWakaOrAdmin ? 'Pusat Komando Kesiswaan' : myEkskul?.name}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 font-mono">
          {isWakaOrAdmin ? (
            <>
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
              <button
                onClick={handleSeedDatabase}
                disabled={isSyncing}
                className="px-2.5 py-1 rounded bg-[#161618] border border-[#27272a] hover:border-blue-500/40 text-zinc-300 font-medium text-[11px] flex items-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>{isSyncing ? 'SYNCING...' : 'SYNC_DB'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate('attendance')}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] flex items-center space-x-1.5 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>+ PRESENSI_SESI</span>
              </button>
              <button
                onClick={() => onNavigate('reports')}
                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] flex items-center space-x-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>+ BUAT_LPJ</span>
              </button>
            </>
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

      {/* 3. Telemetry & Analytics Grid (High Density Ops Layout) */}
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
                {/* Tooltip on hover */}
                <div className="absolute -top-7 hidden group-hover:flex px-1.5 py-0.5 bg-[#161618] border border-[#27272a] rounded text-[9px] font-mono text-blue-300 z-10 whitespace-nowrap">
                  {bar.label}: {bar.pct}% ({bar.count} Org)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 4 Cols: Active Threat & Discipline Alerts */}
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

      {/* 4. Schedules Timeline & Protocol Analytics (Dense 3-column split) */}
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
              <span className="truncate">User {currentUser?.displayName.split(' ')[0]} authenticated</span>
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

        {/* Right 4 Cols: Distribution & Quota Stats */}
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
