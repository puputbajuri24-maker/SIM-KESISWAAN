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
  Crown,
  Server,
  Mail,
  Phone,
  Shield,
  CheckCircle2,
  Tent,
  User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { GlobalSearch } from '../common/GlobalSearch';
import { AnnouncementPopupModal } from '../announcements/AnnouncementPopupModal';
import { AnnouncementListModal } from '../announcements/AnnouncementListModal';
import { UserRole } from '../../types';

export type NavTab =
  | 'dashboard'
  | 'cpanel'
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
  | 'announcements'
  | 'settings'
  | 'profile';

export interface AppLayoutProps {
  activeTab: NavTab | string;
  setActiveTab: (tab: any) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const { currentUser, allUsers, userRole, isWakaOrAdmin, isWaka, isSuperAdmin, isGuruBK, isPembinaOsim, isPembinaEkskul, isPembina, logout, loginWithDemoRole, loginWithUser } = useAuth();
  const { schoolSetting, activeAcademicYear, activeSemester, notifications, markAllNotificationsAsRead, isSyncing, extracurriculars, announcements, markAnnouncementAsRead, markAllAnnouncementsAsReadForUser } = useSchool();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAnnouncementPopupOpen, setIsAnnouncementPopupOpen] = useState(false);
  const [isAnnouncementListOpen, setIsAnnouncementListOpen] = useState(false);
  const [hasPromptedPopup, setHasPromptedPopup] = useState(false);
  const [uptimeSeconds, setUptimeSeconds] = useState(51240);

  // Read announcements storage key
  const userKey = currentUser?.uid || 'guest';
  const userStorageKey = `sim_read_announcements_${userKey}`;
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(userStorageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Keep read state updated when user switches
  useEffect(() => {
    if (currentUser?.uid) {
      try {
        const saved = localStorage.getItem(`sim_read_announcements_${currentUser.uid}`);
        const parsed = saved ? JSON.parse(saved) : [];
        setReadAnnouncementIds(parsed);
        setHasPromptedPopup(false);
      } catch {
        setReadAnnouncementIds([]);
      }
    }
  }, [currentUser?.uid]);

  // Determine user's assigned extracurricular IDs if applicable
  const userEkskulIds = currentUser?.extracurricularIds || [];

  // Determine announcements targeted to current user
  const relevantAnnouncements = (announcements || []).filter(ann => {
    if (ann.isActive === false) return false;

    // 1. Specific User Target
    if (ann.targetType === 'specific_users' || ann.targetRole === 'Pengguna Spesifik') {
      return (
        ann.targetUserIds?.includes(currentUser?.uid || '') ||
        (currentUser?.displayName && ann.targetUserNames?.includes(currentUser.displayName))
      );
    }

    // 2. Specific BK Target
    if (ann.targetType === 'specific_bk' || ann.targetRole === 'Guru BK Tertentu') {
      if (!isGuruBK) return false;
      return (
        ann.targetUserIds?.includes(currentUser?.uid || '') ||
        (currentUser?.displayName && ann.targetUserNames?.includes(currentUser.displayName))
      );
    }

    // 3. All BK Target
    if (ann.targetType === 'all_bk' || ann.targetRole === 'Guru BK') {
      return isGuruBK;
    }

    // 4. Specific Ekskul Target
    if (ann.targetType === 'specific_ekskul' || ann.targetRole === 'Pembina Ekstra Tertentu') {
      if (!isPembina && !isPembinaEkskul) return false;
      const targetEkskulIds = ann.targetExtracurricularIds || (ann.targetExtracurricularId ? [ann.targetExtracurricularId] : []);
      const matchesEkskul = (extracurriculars || []).some(e =>
        targetEkskulIds.includes(e.id) &&
        (userEkskulIds.includes(e.id) || e.coachName?.toLowerCase() === currentUser?.displayName?.toLowerCase() || !e.coachName)
      );
      return matchesEkskul || (ann.targetUserIds?.includes(currentUser?.uid || ''));
    }

    // 5. All Pembina Target
    if (ann.targetType === 'all_pembina' || ann.targetRole === 'Guru Pembina' || ann.targetRole === 'Pembina') {
      return isPembina || isPembinaOsim || isPembinaEkskul;
    }

    // 6. Waka / Admin Target
    if (ann.targetType === 'waka_admin' || ann.targetRole === 'Waka & Admin') {
      return isWakaOrAdmin;
    }

    // 7. General Broadcast
    if (ann.targetType === 'all' || ann.targetRole === 'Semua') {
      return true;
    }

    return false;
  });

  // Check if announcement is read by either local state or doc readByUsers
  const isAnnouncementRead = (ann: (typeof announcements)[0]) => {
    if (readAnnouncementIds.includes(ann.id)) return true;
    if (ann.readByUsers && ann.readByUsers[userKey]) return true;
    return false;
  };

  const unreadAnnouncements = relevantAnnouncements.filter(a => !isAnnouncementRead(a));

  // Trigger popup when there are unread announcements for the user on load / login
  useEffect(() => {
    if (!hasPromptedPopup && unreadAnnouncements.length > 0) {
      const t = setTimeout(() => {
        setIsAnnouncementPopupOpen(true);
        setHasPromptedPopup(true);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [hasPromptedPopup, unreadAnnouncements.length]);

  const handleMarkAnnouncementAsRead = async (id: string) => {
    const next = Array.from(new Set([...readAnnouncementIds, id]));
    setReadAnnouncementIds(next);
    try {
      localStorage.setItem(userStorageKey, JSON.stringify(next));
    } catch {}
    await markAnnouncementAsRead(id, currentUser?.uid);
    const remaining = unreadAnnouncements.filter(a => a.id !== id);
    if (remaining.length === 0) {
      setIsAnnouncementPopupOpen(false);
    }
  };

  const handleMarkAllAnnouncementsAsRead = async () => {
    const allIds = relevantAnnouncements.map(a => a.id);
    const next = Array.from(new Set([...readAnnouncementIds, ...allIds]));
    setReadAnnouncementIds(next);
    try {
      localStorage.setItem(userStorageKey, JSON.stringify(next));
    } catch {}
    await markAllAnnouncementsAsReadForUser(allIds, currentUser?.uid);
    setIsAnnouncementPopupOpen(false);
  };

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

  // Grouped Navigation Items for High Density Layout tailored by Role
  const navSections = isSuperAdmin
    ? [
        {
          title: 'CPANEL_SERVER_ROOT',
          items: [
            { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard, tag: 'LIVE' },
            { id: 'announcements', label: 'Pusat Pengumuman', icon: Megaphone, count: unreadAnnouncements.length ? `${unreadAnnouncements.length}` : undefined },
            { id: 'cpanel', label: 'cPanel & Manajemen Akun', icon: Server, tag: 'ADMIN' },
            { id: 'settings', label: 'Konfigurasi Profil & Kop', icon: Settings },
            { id: 'profile', label: 'Pengaturan Profil Saya', icon: UserCog, tag: 'AKUN' }
          ]
        },
        {
          title: 'DATA_POKOK_MADRASAH',
          items: [
            { id: 'students', label: 'Master Data Siswa', icon: Users, count: '1.2k' },
            { id: 'teachers', label: 'Dewan Guru & Pembina', icon: UserCog },
            { id: 'osim', label: 'Intrakurikuler & OSIM', icon: Crown, tag: 'NEW' }
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
            { id: 'permissions', label: 'Dispensasi & Izin', icon: FileCheck }
          ]
        }
      ]
    : isWaka
    ? [
        {
          title: 'CORE_OPS',
          items: [
            { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard, tag: 'LIVE' },
            { id: 'announcements', label: 'Pusat Pengumuman', icon: Megaphone, count: unreadAnnouncements.length ? `${unreadAnnouncements.length}` : undefined },
            { id: 'osim', label: 'Intrakurikuler & OSIM', icon: Crown, tag: 'NEW' },
            { id: 'students', label: 'Master Data Siswa', icon: Users, count: '1.2k' },
            { id: 'teachers', label: 'Dewan Guru & Pembina', icon: UserCog },
            { id: 'profile', label: 'Pengaturan Profil Saya', icon: UserCog, tag: 'AKUN' }
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
            { id: 'permissions', label: 'Dispensasi & Izin', icon: FileCheck }
          ]
        }
      ]
    : isGuruBK
    ? [
        {
          title: 'BIMBINGAN_KONSELING_OPS',
          items: [
            { id: 'dashboard', label: 'Command Center BK', icon: LayoutDashboard, tag: 'BK' },
            { id: 'announcements', label: 'Pusat Pengumuman', icon: Megaphone, count: unreadAnnouncements.length ? `${unreadAnnouncements.length}` : undefined },
            { id: 'counseling', label: 'Bimbingan & Layanan BK', icon: HeartHandshake, tag: 'UTAMA' },
            { id: 'violations', label: 'Pelanggaran & Disiplin', icon: ShieldAlert, alert: true },
            { id: 'students', label: 'Data & Riwayat Siswa', icon: Users }
          ]
        },
        {
          title: 'LAYANAN_BK_REPORTS',
          items: [
            { id: 'reports', label: 'Laporan & Rekap BK', icon: FileText, tag: 'DOC' },
            { id: 'permissions', label: 'Dispensasi & Izin', icon: FileCheck }
          ]
        },
        {
          title: 'PENGATURAN_AKUN',
          items: [
            { id: 'profile', label: 'Pengaturan Profil', icon: UserCog, tag: 'PROFIL' }
          ]
        }
      ]
    : isPembinaOsim
    ? [
        {
          title: 'INTRAKURIKULER_OSIM',
          items: [
            { id: 'dashboard', label: 'Dashboard OSIM', icon: LayoutDashboard, tag: 'OSIM' },
            { id: 'announcements', label: 'Pusat Pengumuman', icon: Megaphone, count: unreadAnnouncements.length ? `${unreadAnnouncements.length}` : undefined },
            { id: 'osim', label: 'Pengurus & Proker OSIM', icon: Crown, tag: 'PROKER' }
          ]
        },
        {
          title: 'PROGRAM_LPJ_OSIM',
          items: [
            { id: 'activities', label: 'Agenda & Sidang OSIM', icon: FileSpreadsheet },
            { id: 'reports', label: 'LPJ Kegiatan OSIM', icon: FileText }
          ]
        },
        {
          title: 'PENGATURAN_AKUN',
          items: [
            { id: 'profile', label: 'Pengaturan Profil', icon: UserCog, tag: 'PROFIL' }
          ]
        }
      ]
    : [
        {
          title: 'EKSTRAKURIKULER_BINAAN',
          items: [
            { id: 'dashboard', label: 'Dashboard Pembina', icon: LayoutDashboard, tag: 'EKSKUL' },
            { id: 'announcements', label: 'Pusat Pengumuman', icon: Megaphone, count: unreadAnnouncements.length ? `${unreadAnnouncements.length}` : undefined },
            { id: 'extracurriculars', label: 'Profil Ekskul Saya', icon: Compass },
            { id: 'members', label: 'Daftar Anggota', icon: Users },
            { id: 'schedules', label: 'Jadwal Latihan', icon: Calendar },
            { id: 'attendance', label: 'Input Presensi Digital', icon: ClipboardCheck, tag: 'SESI' }
          ]
        },
        {
          title: 'PROPOSAL_LPJ_PRESTASI',
          items: [
            { id: 'activities', label: 'Agenda Kegiatan & Lomba', icon: FileSpreadsheet },
            { id: 'reports', label: 'Laporan Pertanggungjawaban', icon: FileText },
            { id: 'achievements', label: 'Prestasi Siswa Ekskul', icon: Award },
            { id: 'permissions', label: 'Dispensasi Siswa', icon: FileCheck }
          ]
        },
        {
          title: 'PENGATURAN_AKUN',
          items: [
            { id: 'profile', label: 'Pengaturan Profil', icon: UserCog, tag: 'PROFIL' }
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
            {schoolSetting?.logoRightUrl || schoolSetting?.logoUrl ? (
              <img
                src={schoolSetting.logoRightUrl || schoolSetting.logoUrl}
                alt="Logo Sekolah"
                className="w-7 h-7 object-contain rounded p-0.5 bg-white/10 border border-white/20 shrink-0"
                referrerPolicy="no-referrer"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center font-bold text-xs text-white shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                M
              </div>
            )}
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-xs sm:text-sm tracking-tight text-zinc-100 uppercase">
                {schoolSetting?.name || 'MAN 2 SERAM BAGIAN TIMUR'}
              </span>
              <span className="hidden sm:inline-flex bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                SIM-KESISWAAN
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

          {/* Pengumuman & Broadcast Button */}
          <button
            onClick={() => setIsAnnouncementListOpen(true)}
            className={`p-1.5 rounded border transition-all relative ${
              unreadAnnouncements.length > 0
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-400 hover:bg-blue-500/25 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                : 'bg-[#161618] border-[#27272a] text-zinc-400 hover:text-zinc-200'
            }`}
            title={`Pengumuman Kesiswaan (${unreadAnnouncements.length} belum dibaca)`}
          >
            <Megaphone className={`w-3.5 h-3.5 ${unreadAnnouncements.length > 0 ? 'animate-bounce' : ''}`} />
            {unreadAnnouncements.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 bg-red-500 text-white rounded-full text-[9px] font-mono font-bold flex items-center justify-center shadow-[0_0_6px_#ef4444]">
                {unreadAnnouncements.length}
              </span>
            )}
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

          {/* Profile Pill - Only shown when user is logged in, and only displays currently logged in user info */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setIsProfileModalOpen(!isProfileModalOpen)}
                className="flex items-center space-x-2 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#161618] border border-[#27272a] hover:border-zinc-600 transition-colors shadow-sm"
                title="Profil Pengguna"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName}
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover border border-emerald-500/40"
                  />
                ) : (
                  <div className="w-5 h-5 rounded bg-gradient-to-br from-emerald-600 to-blue-600 flex items-center justify-center font-mono font-bold text-[10px] text-white shadow-inner">
                    {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <div className="text-[11px] font-bold text-zinc-200 truncate max-w-[120px] leading-tight">
                    {currentUser.displayName.split(' ')[0]}
                  </div>
                  <div className="text-[9px] font-mono text-zinc-400">
                    {currentUser.role === 'super_admin'
                      ? 'SUPER ADMIN'
                      : currentUser.role === 'waka_kesiswaan'
                      ? 'WAKA KESISWAAN'
                      : currentUser.role === 'guru_bk'
                      ? 'GURU BK'
                      : currentUser.role === 'pembina_osim'
                      ? 'PEMBINA OSIM'
                      : 'PEMBINA EKSKUL'}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-zinc-500 ml-0.5" />
              </button>

              {isProfileModalOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsProfileModalOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 rounded-xl bg-[#111114] border border-[#2d2d34] shadow-2xl z-40 p-3 font-sans text-xs">
                    {/* User Header Profile */}
                    <div className="p-3 bg-[#18181c] border border-[#27272a] rounded-lg mb-3">
                      <div className="flex items-center space-x-3">
                        {currentUser.photoURL ? (
                          <img
                            src={currentUser.photoURL}
                            alt={currentUser.displayName}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-500/50 shadow-md shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-emerald-500 via-blue-600 to-indigo-700 flex items-center justify-center font-mono font-black text-base text-white shadow-md shrink-0">
                            {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                              AKUN AKTIF / ONLINE
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-white truncate mt-0.5" title={currentUser.displayName}>
                            {currentUser.displayName}
                          </h4>
                          <span className="inline-block mt-0.5 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            {currentUser.role === 'super_admin'
                              ? 'SUPER ADMINISTRATOR'
                              : currentUser.role === 'waka_kesiswaan'
                              ? 'WAKA KESISWAAN'
                              : currentUser.role === 'guru_bk'
                              ? 'GURU BK'
                              : currentUser.role === 'pembina_osim'
                              ? 'PEMBINA OSIM'
                              : 'PEMBINA EKSTRAKURIKULER'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Metadata Fields */}
                    <div className="space-y-1.5 bg-[#0e0e10] p-2.5 rounded-lg border border-[#222226] text-[11px] font-mono mb-3">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-zinc-500">NIP/NUPTK:</span>
                        <span className="text-zinc-200 font-medium">{currentUser.nip || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-zinc-500">WHATSAPP:</span>
                        <span className="text-emerald-400 font-medium">{currentUser.phone || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-zinc-500">EMAIL:</span>
                        <span className="text-zinc-200 font-medium truncate max-w-[170px]" title={currentUser.email}>
                          {currentUser.email}
                        </span>
                      </div>
                      {currentUser.username && (
                        <div className="flex items-center justify-between text-zinc-400">
                          <span className="text-zinc-500">USERNAME:</span>
                          <span className="text-zinc-200 font-medium">@{currentUser.username}</span>
                        </div>
                      )}
                      {currentUser.counselorSpecialization && (
                        <div className="pt-1 border-t border-[#222226] text-zinc-400">
                          <span className="text-purple-400 block text-[10px]">SPESIALISASI BK:</span>
                          <span className="text-zinc-300 text-[10px] font-sans font-medium">{currentUser.counselorSpecialization}</span>
                        </div>
                      )}
                      {currentUser.extracurricularIds && currentUser.extracurricularIds.length > 0 && (
                        <div className="pt-1 border-t border-[#222226] text-zinc-400">
                          <span className="text-emerald-400 block text-[10px]">EKSKUL BINAAN:</span>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {currentUser.extracurricularIds.map(eid => {
                              const ek = extracurriculars.find(e => e.id === eid);
                              return (
                                <span key={eid} className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-sans">
                                  {ek ? ek.name : eid}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Button: Pengaturan Profil Saya */}
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setIsProfileModalOpen(false);
                      }}
                      className="w-full mb-2 py-2 px-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 hover:bg-emerald-900/40 hover:border-emerald-500/60 text-emerald-300 font-mono text-[11px] font-bold flex items-center justify-between transition-colors shadow-sm"
                    >
                      <div className="flex items-center space-x-2">
                        <UserCog className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Pengaturan Profil Saya</span>
                      </div>
                      <span>→</span>
                    </button>

                    {/* Quick Link for Super Admin */}
                    {isSuperAdmin && (
                      <button
                        onClick={() => {
                          setActiveTab('cpanel');
                          setIsProfileModalOpen(false);
                        }}
                        className="w-full mb-2 py-1.5 px-3 rounded-lg bg-[#18181c] border border-[#27272a] hover:border-emerald-500/40 text-emerald-400 font-mono text-[11px] flex items-center justify-between transition-colors"
                      >
                        <span>Buka cPanel Kesiswaan</span>
                        <span>→</span>
                      </button>
                    )}

                    {/* Logout Button */}
                    <button
                      onClick={() => {
                        logout();
                        setIsProfileModalOpen(false);
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-red-950/40 border border-red-500/30 hover:bg-red-900/50 hover:border-red-500/60 text-red-300 font-mono text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-sm"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>KELUAR DARI APLIKASI</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
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
                {isSuperAdmin
                  ? 'ROOT / SUPER_ADMIN'
                  : isWaka
                  ? 'WAKA / OPS_CENTER'
                  : isGuruBK
                  ? 'GURU_BK_MODE'
                  : isPembinaOsim
                  ? 'PEMBINA_OSIM_MODE'
                  : 'PEMBINA_EKSKUL_MODE'}
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
                  {schoolSetting?.logoRightUrl || schoolSetting?.logoUrl ? (
                    <img
                      src={schoolSetting.logoRightUrl || schoolSetting.logoUrl}
                      alt="Logo Sekolah"
                      className="w-6 h-6 object-contain rounded p-0.5 bg-white/10 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-5 h-5 bg-emerald-600 rounded flex items-center justify-center font-bold text-[10px] text-white">
                      M
                    </div>
                  )}
                  <span className="font-mono font-bold text-xs text-zinc-200 truncate">MAN 2 SBT</span>
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

      {/* Automatic Login Popup for Targeted Roles (Guru Pembina & BK) */}
      <AnnouncementPopupModal
        announcements={unreadAnnouncements}
        isOpen={isAnnouncementPopupOpen}
        onClose={() => setIsAnnouncementPopupOpen(false)}
        onMarkAsRead={handleMarkAnnouncementAsRead}
        onMarkAllAsRead={handleMarkAllAnnouncementsAsRead}
      />

      {/* Announcement Center Drawer / Modal */}
      <AnnouncementListModal
        isOpen={isAnnouncementListOpen}
        onClose={() => setIsAnnouncementListOpen(false)}
        announcements={announcements || []}
        readAnnouncementIds={readAnnouncementIds}
        onMarkAsRead={handleMarkAnnouncementAsRead}
        onMarkAllAsRead={handleMarkAllAnnouncementsAsRead}
      />
    </div>
  );
};
