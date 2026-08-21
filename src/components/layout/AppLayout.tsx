import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Award,
  Calendar,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  ShieldAlert,
  HeartHandshake,
  FileCheck,
  Package,
  Megaphone,
  Bell,
  Settings,
  History,
  UserCog,
  LogOut,
  Moon,
  Sun,
  Search,
  Menu,
  X,
  Compass,
  Sparkles,
  ChevronDown,
  Building,
  School,
  Activity,
  Terminal,
  Cpu,
  Radio,
  HardDrive,
  Crown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { GlobalSearch } from '../common/GlobalSearch';
import { DEMO_USERS } from '../../services/seedData';
import { UserRole } from '../../types';

export type NavTab =
  | 'dashboard'
  | 'osim'
  | 'students'
  | 'extracurriculars'
  | 'members'
  | 'schedules'
  | 'attendance'
  | 'activities'
  | 'reports'
  | 'violations'
  | 'counseling'
  | 'achievements'
  | 'permissions'
  | 'teachers'
  | 'settings';

export interface AppLayoutProps {
  activeTab: NavTab | string;
  setActiveTab: (tab: any) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const { currentUser, userRole, isWakaOrAdmin, isPembina, isSuperAdmin, logout, loginWithDemoRole } = useAuth();
  const { schoolSetting, activeAcademicYear, activeSemester, notifications, markAllNotificationsAsRead, isSyncing } = useSchool();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [uptimeSeconds, setUptimeSeconds] = useState(51240);

  useEffect(() => {
    const timer = setInterval(() => setUptimeSeconds(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const unreadNotifs = notifications.filter(n => !n.isRead);

  // Grouped Navigation Items for High Density Layout
  const navSections = isWakaOrAdmin
    ? [
        {
          title: 'CORE_OPS',
          items: [
            { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard, tag: 'LIVE' },
            { id: 'osim', label: 'Intrakurikuler & OSIM', icon: Crown, tag: 'NEW' },
            { id: 'students', label: 'Master Data Siswa', icon: Users, count: '1.2k' },
            { id: 'teachers', label: 'Dewan Guru & Pembina', icon: UserCog }
          ]
        },
        {
          title: 'EXTRACURRICULAR_MGMT',
          items: [
            { id: 'extracurriculars', label: 'Unit Ekstrakurikuler', icon: Compass, tag: '12' },
            { id: 'members', label: 'Data Anggota & Reg', icon: Users },
            { id: 'schedules', label: 'Jadwal & Kalender', icon: Calendar },
            { id: 'attendance', label: 'Sesi Presensi Digital', icon: ClipboardCheck, tag: 'AUTO' }
          ]
        },
        {
          title: 'STUDENT_DISCIPLINE_BK',
          items: [
            { id: 'violations', label: 'Pelanggaran & Poin', icon: ShieldAlert, alert: true },
            { id: 'counseling', label: 'Bimbingan Konseling (BK)', icon: HeartHandshake },
            { id: 'achievements', label: 'Prestasi & Penghargaan', icon: Award, tag: 'NEW' }
          ]
        },
        {
          title: 'ADMIN_REPORTS_PERMITS',
          items: [
            { id: 'activities', label: 'Agenda & Proposal', icon: FileSpreadsheet },
            { id: 'reports', label: 'Verifikasi LPJ Kegiatan', icon: FileText },
            { id: 'permissions', label: 'Dispensasi & Izin', icon: FileCheck },
            { id: 'settings', label: 'Konfigurasi Sistem', icon: Settings }
          ]
        }
      ]
    : [
        {
          title: 'PEMBINA_WORKSPACE',
          items: [
            { id: 'dashboard', label: 'Dashboard Pembina', icon: LayoutDashboard, tag: 'LIVE' },
            { id: 'osim', label: 'Intrakurikuler & OSIM', icon: Crown, tag: 'NEW' },
            { id: 'extracurriculars', label: 'Profil Ekskul Saya', icon: Compass },
            { id: 'members', label: 'Daftar Anggota', icon: Users },
            { id: 'schedules', label: 'Jadwal Latihan', icon: Calendar },
            { id: 'attendance', label: 'Input Presensi', icon: ClipboardCheck }
          ]
        },
        {
          title: 'PROPOSAL_LPJ_PRESTASI',
          items: [
            { id: 'activities', label: 'Agenda Kegiatan', icon: FileSpreadsheet },
            { id: 'reports', label: 'Laporan Pertanggungjawaban', icon: FileText },
            { id: 'achievements', label: 'Prestasi Ekskul', icon: Award },
            { id: 'permissions', label: 'Dispensasi Siswa', icon: FileCheck },
            { id: 'settings', label: 'Pengaturan Akun', icon: Settings }
          ]
        }
      ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="h-screen w-screen bg-[#09090b] text-[#e4e4e7] flex flex-col overflow-hidden font-sans select-none">
      {/* 1. Header (High Density Telemetry Topbar) */}
      <header className="h-12 border-b border-[#27272a] bg-[#09090b] flex items-center justify-between px-3 sm:px-4 z-20 shrink-0">
        {/* Left: Branding & Module Scope */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1 rounded bg-[#161618] border border-[#27272a] text-zinc-400 hover:text-zinc-200"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div
            className="flex items-center space-x-2.5 cursor-pointer"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center font-bold text-xs text-white shadow-[0_0_8px_rgba(37,99,235,0.5)]">
              S
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-xs sm:text-sm tracking-tight text-zinc-100 uppercase">
                SIM_KESISWAAN / OPS_CENTER
              </span>
              <span className="hidden sm:inline-flex bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded border border-blue-500/20 font-mono">
                LIVE_DASH
              </span>
            </div>
          </div>
        </div>

        {/* Center: Command Bar Quick Search */}
        <div className="hidden md:flex items-center flex-1 max-w-sm mx-4">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] bg-[#161618] border border-[#27272a] rounded text-zinc-400 hover:border-zinc-700 hover:text-zinc-300 transition-colors font-mono"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="truncate text-zinc-500">QUERY: Siswa, Ekskul, Jadwal, LPJ...</span>
            </div>
            <kbd className="px-1.5 py-0.2 text-[9px] font-mono text-zinc-500 bg-[#0d0d0f] rounded border border-[#27272a]">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: High-Density Telemetry & Account Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3 text-[11px] font-mono text-zinc-400">
          {/* Uptime & Node State */}
          <div className="hidden xl:flex items-center space-x-4 border-r border-[#27272a] pr-3 text-zinc-500 text-[10px]">
            <span>Uptime: <strong className="text-zinc-300 font-mono">{formatUptime(uptimeSeconds)}</strong></span>
            <span>TA: <strong className="text-blue-400">{activeAcademicYear}</strong></span>
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-emerald-400">{isSyncing ? 'SYNCING...' : 'ONLINE'}</span>
            </div>
          </div>

          {/* Quick Search Mobile */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden p-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-400 hover:text-zinc-200"
            title="Cari"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Notification Button */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-400 hover:text-zinc-200 relative transition-colors"
              title="Notifikasi"
            >
              <Bell className="w-3.5 h-3.5" />
              {unreadNotifs.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_6px_#ef4444]" />
              )}
            </button>

            {isNotifOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsNotifOpen(false)} />
                <div className="absolute right-0 mt-1 w-80 rounded bg-[#0d0d0f] border border-[#27272a] shadow-2xl z-40 p-0 overflow-hidden font-sans text-xs">
                  <div className="p-2.5 border-b border-[#27272a] flex items-center justify-between bg-[#161618]">
                    <div className="flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-blue-400" />
                      <span className="font-mono text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                        TELEMETRY_LOG / NOTIFS ({unreadNotifs.length})
                      </span>
                    </div>
                    {unreadNotifs.length > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-[10px] text-blue-400 hover:underline font-mono"
                      >
                        ACK_ALL
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#27272a] p-1">
                    {notifications.length === 0 ? (
                      <div className="py-4 text-center text-zinc-500 font-mono text-[11px]">NO ACTIVE ALERTS</div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-2 rounded transition-colors text-[11px] ${
                            n.isRead ? 'opacity-60 hover:bg-[#161618]' : 'bg-blue-950/20 border border-blue-500/20'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-semibold text-zinc-200">{n.title}</span>
                            <span className="text-[9px] font-mono text-zinc-500">{n.createdAt}</span>
                          </div>
                          <p className="text-zinc-400 text-[10px] leading-tight">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
              className="flex items-center space-x-2 px-2 py-1 rounded bg-[#161618] border border-[#27272a] hover:border-zinc-700 transition-colors"
            >
              <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center font-mono font-bold text-[9px] text-white">
                {currentUser?.role === 'pembina' ? 'P' : currentUser?.role === 'super_admin' ? 'SA' : 'WK'}
              </div>
              <span className="text-[11px] font-mono text-zinc-300 hidden sm:inline-block truncate max-w-[100px]">
                {currentUser?.displayName.split(' ')[0]}
              </span>
              <span className="bg-blue-500/10 text-blue-400 text-[9px] px-1 py-0.2 rounded border border-blue-500/20 font-mono hidden md:inline-block">
                {currentUser?.role.toUpperCase()}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>

            {isRoleMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsRoleMenuOpen(false)} />
                <div className="absolute right-0 mt-1 w-64 rounded bg-[#0d0d0f] border border-[#27272a] shadow-2xl z-40 p-1 font-sans text-xs">
                  <div className="p-2 border-b border-[#27272a] bg-[#161618] rounded-t">
                    <p className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">SWITCH ROLE PROFILE</p>
                    <p className="text-zinc-300 font-semibold text-[11px] mt-0.5">{schoolSetting.name}</p>
                  </div>
                  <div className="py-1 space-y-0.5">
                    {DEMO_USERS.map(u => (
                      <button
                        key={u.uid}
                        onClick={() => {
                          loginWithDemoRole(u.role, u.uid);
                          setIsRoleMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between font-mono text-[11px] transition-colors ${
                          currentUser?.uid === u.uid
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                            : 'text-zinc-300 hover:bg-[#161618]'
                        }`}
                      >
                        <div>
                          <p className="font-sans font-medium text-zinc-200">{u.displayName}</p>
                          <p className="text-[9px] text-zinc-500">{u.role.toUpperCase()}</p>
                        </div>
                        {currentUser?.uid === u.uid && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="pt-1 border-t border-[#27272a]">
                    <button
                      onClick={() => {
                        logout();
                        setIsRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1 rounded text-red-400 hover:bg-red-500/10 font-mono text-[10px] flex items-center space-x-1.5"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>TERMINATE_SESSION</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop High Density Sidebar */}
        <aside className="hidden lg:flex flex-col w-56 bg-[#09090b] border-r border-[#27272a] shrink-0 overflow-y-auto select-none">
          {/* Active Mode Header */}
          <div className="p-2.5 border-b border-[#27272a] bg-[#0d0d0f] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-mono text-[10px] font-bold text-zinc-300 uppercase tracking-tight">
                {isWakaOrAdmin ? 'WAKA / ADMIN_OPS' : 'PEMBINA_MODE'}
              </span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          {/* Navigation Sections */}
          <div className="flex-1 p-2 space-y-3">
            {navSections.map(sec => (
              <div key={sec.title} className="space-y-0.5">
                <div className="px-2 py-0.5 text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                  {sec.title}
                </div>
                {sec.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[11px] font-sans transition-all ${
                        isActive
                          ? 'bg-blue-600/20 border border-blue-500/40 text-blue-400 font-semibold shadow-[inset_0_0_8px_rgba(59,130,246,0.15)]'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#161618] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-zinc-500'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.tag && (
                        <span
                          className={`text-[9px] font-mono px-1 py-0.2 rounded border ${
                            isActive
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60'
                          }`}
                        >
                          {item.tag}
                        </span>
                      )}

                      {item.alert && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_4px_#ef4444]" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Quick System Telemetry Footer */}
          <div className="p-2 border-t border-[#27272a] bg-[#0d0d0f] text-[9px] font-mono text-zinc-500 space-y-1">
            <div className="flex justify-between items-center">
              <span>DB_STATUS</span>
              <span className="text-emerald-400 font-bold">CONNECTED</span>
            </div>
            <div className="flex justify-between items-center">
              <span>CLUSTER_MEM</span>
              <span className="text-zinc-300">42% / 1024MB</span>
            </div>
            <div className="h-1 w-full bg-[#161618] rounded-full overflow-hidden border border-zinc-800">
              <div className="h-full bg-blue-500 w-[42%]"></div>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-4/5 max-w-xs bg-[#09090b] border-r border-[#27272a] h-full p-3 overflow-y-auto flex flex-col shadow-2xl z-10">
              <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center font-bold text-[10px] text-white">
                    S
                  </div>
                  <span className="font-mono font-bold text-xs text-zinc-200">SIM_KESISWAAN</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded bg-[#161618] text-zinc-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 py-3 space-y-3">
                {navSections.map(sec => (
                  <div key={sec.title} className="space-y-1">
                    <div className="px-1 text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                      {sec.title}
                    </div>
                    {sec.items.map(item => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors ${
                            isActive
                              ? 'bg-blue-600/20 border border-blue-500/40 text-blue-400 font-semibold'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#161618]'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <Icon className="w-3.5 h-3.5" />
                            <span>{item.label}</span>
                          </div>
                          {item.tag && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-800 text-zinc-400">
                              {item.tag}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#27272a]">
                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded bg-red-500/10 text-red-400 font-mono text-[11px]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>LOGOUT_SESSION</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Main Workspace Container */}
        <main className="flex-1 bg-[#09090b] overflow-y-auto p-2 sm:p-3 md:p-4 space-y-3">
          {children}
        </main>
      </div>

      {/* 4. Telemetry Footer / Status Line */}
      <footer className="h-7 bg-[#0d0d0f] border-t border-[#27272a] flex items-center px-3 sm:px-4 justify-between shrink-0 font-mono text-[9px] text-zinc-500 uppercase tracking-tight">
        <div className="flex items-center space-x-4">
          <span className="hidden sm:inline">CLUSTER-01 :: <strong className="text-zinc-300">STABLE</strong></span>
          <span className="hidden md:inline">PROJECT: <span className="text-zinc-300">AI-STUDIO-KESISWAAN</span></span>
          <span className="text-blue-400">ENCRYPTION: AES-256-GCM / TLS_1.3</span>
          <span className="hidden lg:inline text-zinc-600">NPSN: {schoolSetting.npsn}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
          <span className="text-emerald-400 font-bold">SYSTEM NOMINAL</span>
        </div>
      </footer>

      {/* Global Command Palette */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={tabId => handleNavClick(tabId)}
      />
    </div>
  );
};
