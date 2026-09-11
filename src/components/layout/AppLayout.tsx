import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  ShieldCheck,
  CheckCircle2,
  Tent,
  User,
  Clock,
  Globe,
  Smartphone,
  Wallet,
  Home,
  Flame,
  AlertTriangle,
  Pin,
  ExternalLink,
  CheckCheck,
  Palette,
  BookOpenCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useAppTimezone } from '../../contexts/TimezoneContext';
import { useTheme } from '../../contexts/ThemeContext';
import { GlobalSearch } from '../common/GlobalSearch';
import { AnnouncementPopupModal } from '../announcements/AnnouncementPopupModal';
import { AnnouncementListModal } from '../announcements/AnnouncementListModal';
import { TimezoneSelectorModal } from '../common/TimezoneSelectorModal';
import { ThemeSelectorModal } from '../common/ThemeSelectorModal';
import { UserRole } from '../../types';
import {
  getTeacherInitials,
  isGuruBKOrPembinaRole,
  getInitialsColorTheme
} from '../../utils/initials';

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
  | 'rules'
  | 'violations'
  | 'counseling'
  | 'achievements'
  | 'permissions'
  | 'teachers'
  | 'cash'
  | 'announcements'
  | 'settings'
  | 'profile';

export interface AppLayoutProps {
  activeTab: NavTab | string;
  setActiveTab: (tab: any) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const { currentUser, allUsers, userRole, isWakaOrAdmin, isWaka, isSuperAdmin, isGuruBK, isPembinaOsim, isPembinaEkskul, isPembina, isPengurusOsim, isSimulatedFromAdmin, returnToAdminSession, logout, loginWithDemoRole, loginWithUser } = useAuth();
  const { schoolSetting, activeAcademicYear, activeSemester, notifications, markNotificationAsRead, markAllNotificationsAsRead, isSyncing, extracurriculars, announcements, markAnnouncementAsRead, markAllAnnouncementsAsReadForUser } = useSchool();
  const { timezoneMode, resolvedTimezone, timezoneAbbr, utcOffsetString, formattedTime, formattedDate } = useAppTimezone();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAnnouncementPopupOpen, setIsAnnouncementPopupOpen] = useState(false);
  const [isAnnouncementListOpen, setIsAnnouncementListOpen] = useState(false);
  const [isTimezoneModalOpen, setIsTimezoneModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [hasPromptedPopup, setHasPromptedPopup] = useState(false);

  const bkUsers = useMemo(() => allUsers.filter(u => u.role === 'guru_bk'), [allUsers]);
  const pembinaEkskulUsers = useMemo(() => allUsers.filter(u => u.role === 'pembina_ekskul' || u.role === 'pembina'), [allUsers]);
  const wakaUsers = useMemo(() => allUsers.filter(u => u.role === 'waka_kesiswaan'), [allUsers]);

  const { mode, resolvedMode, toggleMode, palette, currentPaletteInfo } = useTheme();

  // Detect platform for keyboard shortcut display
  const isMac = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  }, []);

  // Global keyboard shortcut for search command palette (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const mainScrollRef = useRef<HTMLElement>(null);

  // Smooth reset scroll position to top when switching pages
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeTab]);

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

  const relevantNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (n.userId && n.userId === currentUser?.uid) return true;
      if (!n.targetRole) return true;
      if (n.targetRole === 'pembina_osim' && (isPembinaOsim || isWakaOrAdmin)) return true;
      if (n.targetRole === 'waka_kesiswaan' && isWakaOrAdmin) return true;
      if (n.targetRole === 'pengurus_osim' && (isPengurusOsim || isPembinaOsim || isWakaOrAdmin)) return true;
      if (n.targetRole === 'admin' && isWakaOrAdmin) return true;
      return false;
    });
  }, [notifications, currentUser, isPembinaOsim, isWakaOrAdmin, isPengurusOsim]);

  const unreadNotifs = relevantNotifications.filter(n => !n.isRead);
  const totalUnreadCount = unreadAnnouncements.length + unreadNotifs.length;
  const [notifTab, setNotifTab] = useState<'all' | 'announcements' | 'system'>('all');

  const handleMarkEverythingAsRead = async () => {
    markAllNotificationsAsRead();
    await handleMarkAllAnnouncementsAsRead();
  };

  const getNavTagClass = (tag: string, isActive: boolean) => {
    if (isActive) {
      return 'bg-white/20 text-white border border-white/30';
    }
    switch (tag) {
      case 'LIVE':
        return 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800/60';
      case 'AUTO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/60';
      case 'KAS':
      case 'BENDAHARA':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/60';
      case 'BARU':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800/60';
      case 'UTAMA':
      case 'PROKER':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800/60';
      case 'TATIB':
        return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800/70 font-black';
      case 'TRANSPARANSI':
      case 'DOC':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/60';
      default:
        return 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
    }
  };

  // Grouped Navigation Items for Modern Navy Dashboard matching Screenshot
  const navSections = isSuperAdmin
    ? [
        {
          title: 'DASHBOARD',
          items: [
            { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard, tag: 'LIVE' }
          ]
        },
        {
          title: 'MANAJEMEN UTAMA',
          items: [
            { id: 'announcements', label: 'Pusat Pengumuman', icon: Megaphone, count: unreadAnnouncements.length ? `${unreadAnnouncements.length}` : undefined },
            { id: 'students', label: 'Data Siswa', icon: Users },
            { id: 'teachers', label: 'Guru & Pembina', icon: UserCog },
            { id: 'osim', label: 'Pengurus & Proker OSIM', icon: Crown, tag: 'OSIM' },
            { id: 'extracurriculars', label: 'Ekstrakurikuler', icon: Compass },
            { id: 'schedules', label: 'Jadwal & Kalender', icon: Calendar }
          ]
        },
        {
          title: 'PRESENSI & AKTIVITAS',
          items: [
            { id: 'attendance', label: 'Presensi Digital', icon: ClipboardCheck, tag: 'AUTO' },
            { id: 'activities', label: 'Aktivitas Harian', icon: FileSpreadsheet },
            { id: 'reports', label: 'Laporan Kegiatan', icon: FileText }
          ]
        },
        {
          title: 'LAYANAN BK & KEUANGAN',
          items: [
            { id: 'cash', label: 'Neraca Kas & Keuangan', icon: Wallet, tag: 'KAS' },
            { id: 'rules', label: 'Buku Tata Tertib Siswa', icon: BookOpenCheck, tag: 'TATIB' },
            { id: 'violations', label: 'Pelanggaran & Disiplin', icon: ShieldAlert, alert: true },
            { id: 'counseling', label: 'Bimbingan Konseling (BK)', icon: HeartHandshake },
            { id: 'achievements', label: 'Prestasi & Penghargaan', icon: Award, tag: 'BARU' },
            { id: 'permissions', label: 'Dispensasi & Izin', icon: FileCheck }
          ]
        },
        {
          title: 'PENGATURAN SISTEM',
          items: [
            { id: 'settings', label: 'Konfigurasi Sistem', icon: Settings },
            { id: 'cpanel', label: 'cPanel & Akses Akun', icon: Shield },
            { id: 'profile', label: 'Profil Saya', icon: UserCog }
          ]
        }
      ]
    : isWaka
    ? [
        {
          title: 'DASHBOARD',
          items: [
            { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard, tag: 'LIVE' }
          ]
        },
        {
          title: 'MANAJEMEN UTAMA',
          items: [
            { id: 'announcements', label: 'Pusat Pengumuman', icon: Megaphone, count: unreadAnnouncements.length ? `${unreadAnnouncements.length}` : undefined },
            { id: 'students', label: 'Data Siswa', icon: Users },
            { id: 'teachers', label: 'Guru & Pembina', icon: UserCog },
            { id: 'osim', label: 'Pengurus & Proker OSIM', icon: Crown, tag: 'OSIM' },
            { id: 'extracurriculars', label: 'Ekstrakurikuler', icon: Compass },
            { id: 'schedules', label: 'Jadwal & Kalender', icon: Calendar }
          ]
        },
        {
          title: 'PRESENSI & AKTIVITAS',
          items: [
            { id: 'attendance', label: 'Presensi Digital', icon: ClipboardCheck, tag: 'AUTO' },
            { id: 'activities', label: 'Aktivitas Harian', icon: FileSpreadsheet },
            { id: 'reports', label: 'Laporan Kegiatan', icon: FileText }
          ]
        },
        {
          title: 'LAYANAN BK & KEUANGAN',
          items: [
            { id: 'cash', label: 'Neraca Kas & Keuangan', icon: Wallet, tag: 'KAS' },
            { id: 'rules', label: 'Buku Tata Tertib Siswa', icon: BookOpenCheck, tag: 'TATIB' },
            { id: 'violations', label: 'Pelanggaran & Disiplin', icon: ShieldAlert, alert: true },
            { id: 'counseling', label: 'Bimbingan Konseling (BK)', icon: HeartHandshake },
            { id: 'achievements', label: 'Prestasi & Penghargaan', icon: Award },
            { id: 'permissions', label: 'Dispensasi & Izin', icon: FileCheck }
          ]
        },
        {
          title: 'PENGATURAN SISTEM',
          items: [
            { id: 'settings', label: 'Konfigurasi Sistem', icon: Settings },
            { id: 'profile', label: 'Pengaturan Profil Saya', icon: UserCog }
          ]
        }
      ]
    : isGuruBK
    ? [
        {
          title: 'DASHBOARD',
          items: [
            { id: 'dashboard', label: 'Beranda BK', icon: Home },
            { id: 'counseling', label: 'Layanan Bimbingan Konseling', icon: HeartHandshake, tag: 'UTAMA' }
          ]
        },
        {
          title: 'MANAJEMEN BK & KESISWAAN',
          items: [
            { id: 'announcements', label: 'Pusat Pengumuman', icon: Megaphone, count: unreadAnnouncements.length ? `${unreadAnnouncements.length}` : undefined },
            { id: 'rules', label: 'Buku Tata Tertib Siswa', icon: BookOpenCheck, tag: 'TATIB' },
            { id: 'violations', label: 'Pelanggaran & Disiplin', icon: ShieldAlert, alert: true },
            { id: 'students', label: 'Data & Riwayat Siswa', icon: Users },
            { id: 'permissions', label: 'Dispensasi & Izin', icon: FileCheck }
          ]
        },
        {
          title: 'TRANSPARANSI & LAPORAN',
          items: [
            { id: 'cash', label: 'Neraca Kas & Keuangan', icon: Wallet, tag: currentUser?.isCashManager ? (currentUser?.cashManagerTitle || 'BENDAHARA') : 'TRANSPARANSI' },
            { id: 'reports', label: 'Laporan & Rekap BK', icon: FileText, tag: 'DOC' }
          ]
        },
        {
          title: 'PENGATURAN SISTEM',
          items: [
            { id: 'profile', label: 'Pengaturan Profil Saya', icon: UserCog }
          ]
        }
      ]
    : isPembinaOsim
    ? [
        {
          title: 'DASHBOARD',
          items: [
            { id: 'dashboard', label: 'Beranda OSIM', icon: Home },
            { id: 'osim', label: 'Pengurus & Proker OSIM', icon: Crown, tag: 'PROKER' }
          ]
        },
        {
          title: 'PROGRAM & AKTIVITAS',
          items: [
            { id: 'announcements', label: 'Pusat Pengumuman', icon: Megaphone, count: unreadAnnouncements.length ? `${unreadAnnouncements.length}` : undefined },
            { id: 'rules', label: 'Buku Tata Tertib Siswa', icon: BookOpenCheck, tag: 'TATIB' },
            { id: 'activities', label: 'Agenda & Sidang OSIM', icon: FileSpreadsheet },
            { id: 'reports', label: 'LPJ Kegiatan OSIM', icon: FileText }
          ]
        },
        {
          title: 'TRANSPARANSI & KEUANGAN',
          items: [
            { id: 'cash', label: 'Neraca Kas & Keuangan', icon: Wallet, tag: currentUser?.isCashManager ? (currentUser?.cashManagerTitle || 'BENDAHARA') : 'TRANSPARANSI' }
          ]
        },
        {
          title: 'PENGATURAN SISTEM',
          items: [
            { id: 'profile', label: 'Pengaturan Profil', icon: UserCog }
          ]
        }
      ]
    : isPengurusOsim
    ? [
        {
          title: 'PORTAL BIDANG OSIM',
          items: [
            { id: 'dashboard', label: 'Beranda Kemandirian', icon: Home },
            { id: 'osim', label: 'Proker & Mandat Bidang', icon: Crown, tag: currentUser?.osimDepartmentCode || 'BIDANG' }
          ]
        },
        {
          title: 'INFORMASI & REGULASI',
          items: [
            { id: 'announcements', label: 'Pusat Pengumuman', icon: Megaphone, count: unreadAnnouncements.length ? `${unreadAnnouncements.length}` : undefined },
            { id: 'rules', label: 'Buku Tata Tertib Siswa', icon: BookOpenCheck, tag: 'TATIB' }
          ]
        },
        {
          title: 'AKUN PENGURUS',
          items: [
            { id: 'profile', label: 'Profil Akun Bidang', icon: UserCog }
          ]
        }
      ]
    : [
        {
          title: 'DASHBOARD',
          items: [
            { id: 'dashboard', label: 'Beranda Pembina', icon: Home },
            { id: 'extracurriculars', label: 'Profil Ekskul Saya', icon: Compass }
          ]
        },
        {
          title: 'MANAJEMEN EKSKUL',
          items: [
            { id: 'announcements', label: 'Pusat Pengumuman', icon: Megaphone, count: unreadAnnouncements.length ? `${unreadAnnouncements.length}` : undefined },
            { id: 'rules', label: 'Buku Tata Tertib Siswa', icon: BookOpenCheck, tag: 'TATIB' },
            { id: 'members', label: 'Daftar Anggota', icon: Users },
            { id: 'schedules', label: 'Jadwal & Kalender Latihan', icon: Calendar },
            { id: 'attendance', label: 'Presensi Digital', icon: ClipboardCheck, tag: 'AUTO' }
          ]
        },
        {
          title: 'PROPOSAL, LPJ & PRESTASI',
          items: [
            { id: 'cash', label: 'Neraca Kas & Keuangan', icon: Wallet, tag: currentUser?.isCashManager ? (currentUser?.cashManagerTitle || 'BENDAHARA') : 'TRANSPARANSI' },
            { id: 'activities', label: 'Agenda & Lomba', icon: FileSpreadsheet },
            { id: 'reports', label: 'Laporan Pertanggungjawaban', icon: FileText },
            { id: 'achievements', label: 'Prestasi Siswa Ekskul', icon: Award }
          ]
        },
        {
          title: 'PENGATURAN SISTEM',
          items: [
            { id: 'profile', label: 'Pengaturan Profil', icon: UserCog }
          ]
        }
      ];

  const currentNavItem = useMemo(() => {
    for (const section of navSections) {
      const found = section.items.find(item => item.id === activeTab);
      if (found) return found;
    }
    return {
      id: activeTab,
      label: activeTab === 'dashboard' ? 'Command Center' : String(activeTab).toUpperCase(),
      icon: LayoutDashboard
    };
  }, [navSections, activeTab]);
  const CurrentNavIcon = currentNavItem.icon;

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="h-screen w-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex overflow-hidden font-sans select-none transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] shrink-0 select-none justify-between h-full transition-colors duration-200">
        {/* Brand Header */}
        <div className="p-4 pb-3 border-b border-[#1e293b]">
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setActiveTab('dashboard')}
          >
            {schoolSetting?.logoRightUrl || schoolSetting?.logoUrl ? (
              <img
                src={schoolSetting.logoRightUrl || schoolSetting.logoUrl}
                alt="Logo Sekolah"
                className="w-10 h-10 object-contain rounded-xl p-1 bg-white/5 border border-white/10 shrink-0 shadow-sm"
                referrerPolicy="no-referrer"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]">
                M
              </div>
            )}
            <div className="min-w-0">
              <div className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight leading-tight uppercase truncate">
                MAN 2 SERAM
              </div>
              <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 tracking-wider uppercase">
                BAGIAN TIMUR
              </div>
            </div>
          </div>

          {/* SIM-KESISWAAN Pill Badge */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className="w-full mt-3 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-xs tracking-wider uppercase text-center shadow-md shadow-indigo-500/20 hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>SIM-KESISWAAN</span>
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 px-3 py-3 space-y-4 overflow-y-auto custom-scrollbar">
          {navSections.map(sec => (
            <div key={sec.title} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {sec.title}
              </div>
              <div className="space-y-0.5">
                {sec.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <motion.button
                      key={`${sec.title}-${item.id}`}
                      onClick={() => handleNavClick(item.id)}
                      whileTap={{ scale: 0.98 }}
                      className={`relative w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors duration-150 ${
                        isActive
                          ? 'text-white font-bold'
                          : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-[#131c2e]/60'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeSidebarIndicator"
                          className="absolute inset-0 bg-blue-600 rounded-xl shadow-md shadow-blue-600/25 z-0"
                          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        />
                      )}
                      <div className="relative z-10 flex items-center space-x-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 transition-colors duration-150 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.tag && (
                        <span
                          className={`relative z-10 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-md border tracking-wider uppercase transition-colors duration-150 ${getNavTagClass(
                            item.tag,
                            isActive
                          )}`}
                        >
                          {item.tag}
                        </span>
                      )}

                      {item.alert && (
                        <span className="relative z-10 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Sidebar Card: Sistem Terhubung */}
        <div className="p-3 border-t border-[#1e293b] bg-[#0a0f1d]">
          <div className="p-3 rounded-2xl bg-[#131b2e] border border-[#1e293b] space-y-2 shadow-xs">
            <div className="flex items-start space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-sm shrink-0">
                🏆
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white leading-tight">Sistem Terhubung</div>
                <div className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">
                  Semua sistem berjalan normal
                </div>
              </div>
            </div>
            <div className="space-y-1 pt-1">
              <div className="h-1.5 w-full bg-[#080c16] rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full w-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              </div>
              <div className="flex justify-end">
                <span className="text-[10px] font-mono font-bold text-blue-400">100%</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header Navbar */}
        <header className="h-16 border-b border-[var(--border-color)] bg-[var(--bg-header)] flex items-center justify-between px-4 sm:px-6 z-20 shrink-0 gap-3 transition-colors duration-200">
          {/* Left: Mobile Toggle & Quick Search */}
          <div className="flex items-center space-x-3 flex-1 max-w-xl min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-100/80 dark:bg-[#131b2e] border border-slate-200 dark:border-[#1e293b] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 shrink-0"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Active Tab Page Badge with Animated Transition */}
            <div className="hidden sm:flex items-center shrink-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.94, y: -2 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 2 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-[#131b2e] border border-blue-200 dark:border-blue-500/30 text-xs font-semibold shadow-xs"
                >
                  <CurrentNavIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate max-w-[130px] md:max-w-[170px] lg:max-w-[210px] text-blue-950 dark:text-blue-200 font-bold">
                    {currentNavItem.label}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Pill-shaped Search Bar */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2 text-xs bg-slate-100/90 dark:bg-[#131b2e] border border-slate-200 dark:border-[#1e293b] rounded-xl text-slate-500 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500/60 hover:bg-slate-200/50 dark:hover:bg-[#18233a] hover:text-slate-800 dark:hover:text-slate-200 transition-all shadow-xs min-w-0 cursor-pointer text-left"
              title={`Buka Pencarian Cepat (${isMac ? '⌘K' : 'Ctrl+K'})`}
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate text-slate-600 dark:text-slate-300 font-medium">Cari siswa, guru, kegiatan, menu...</span>
              </div>
              <kbd className="px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-[#080c16] rounded-md border border-slate-300 dark:border-[#1e293b] shadow-2xs shrink-0 ml-2">
                {isMac ? '⌘K' : 'Ctrl K'}
              </kbd>
            </button>
          </div>

          {/* Right: Live Telemetry, Status, Mode/Theme Toggle, Notification & Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
            {/* Quick Dark/Light Mode Switcher */}
            <button
              onClick={toggleMode}
              className="p-2 rounded-xl bg-slate-100/80 dark:bg-[#131b2e] border border-slate-200 dark:border-[#1e293b] text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-slate-200/60 dark:hover:bg-[#1a253d] transition-all shadow-xs flex items-center gap-1.5"
              title={`Mode Saat Ini: ${resolvedMode === 'dark' ? 'Mode Gelap' : 'Mode Terang'} (Klik untuk beralih)`}
            >
              {resolvedMode === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
              <span className="hidden xl:inline text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {resolvedMode === 'dark' ? 'Gelap' : 'Terang'}
              </span>
            </button>

            {/* Quick Theme Palette Modal Opener */}
            <button
              onClick={() => setIsThemeModalOpen(true)}
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-[#131b2e] border border-slate-200 dark:border-[#1e293b] hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-slate-200/60 dark:hover:bg-[#1a253d] transition-all text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs"
              title={`Tema Warna: ${currentPaletteInfo.name}`}
            >
              <Palette className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden md:inline font-bold capitalize text-slate-800 dark:text-slate-200">{palette}</span>
            </button>

            {/* Live Clock Pill */}
            <button
              onClick={() => setIsTimezoneModalOpen(true)}
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-[#131b2e] border border-slate-200 dark:border-[#1e293b] hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-slate-200/60 dark:hover:bg-[#1a253d] transition-all text-xs font-mono shadow-xs"
              title={`Zona Waktu: ${resolvedTimezone} (${utcOffsetString})`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-blue-700 dark:text-blue-300">{formattedTime}</span>
            </button>

            {/* Academic Year Dropdown Pill */}
            <div className="hidden lg:flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-[#131b2e] border border-slate-200 dark:border-[#1e293b] text-slate-700 dark:text-slate-300 text-xs font-medium">
              <span className="text-slate-500 dark:text-slate-400">TA:</span>
              <span className="text-blue-700 dark:text-blue-400 font-bold">{activeAcademicYear || '2026/2027'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </div>

            {/* Status Online Pill */}
            <div className="hidden xl:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ONLINE</span>
            </div>

            {/* Notification & Broadcast Integrated Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 rounded-xl bg-slate-100/80 dark:bg-[#131b2e] border border-slate-200 dark:border-[#1e293b] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 relative transition-colors hover:border-blue-400 dark:hover:border-blue-500/40"
                title="Pusat Notifikasi & Broadcast"
              >
                <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse">
                    {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1e293b] shadow-2xl z-40 p-0 overflow-hidden font-sans text-xs flex flex-col">
                    {/* Header */}
                    <div className="p-3 border-b border-slate-200 dark:border-[#1e293b] flex items-center justify-between bg-slate-50 dark:bg-[#131b2e]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <Megaphone className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-200 text-xs">Notifikasi & Broadcast</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {totalUnreadCount > 0 ? `${totalUnreadCount} pesan belum dibaca` : 'Semua telah dibaca'}
                          </div>
                        </div>
                      </div>
                      {totalUnreadCount > 0 && (
                        <button
                          onClick={handleMarkEverythingAsRead}
                          className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20"
                        >
                          <CheckCheck className="w-3 h-3" />
                          <span>Tandai Semua</span>
                        </button>
                      )}
                    </div>

                    {/* Filter Segmented Tabs */}
                    <div className="flex border-b border-slate-200 dark:border-[#1e293b] bg-slate-100 dark:bg-[#0e1422] p-1 gap-1">
                      <button
                        onClick={() => setNotifTab('all')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                          notifTab === 'all'
                            ? 'bg-white text-slate-900 shadow-xs dark:bg-[#1e293b] dark:text-white'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                      >
                        <span>Semua</span>
                        {totalUnreadCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-blue-500 text-white text-[9px] font-bold">
                            {totalUnreadCount}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => setNotifTab('announcements')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                          notifTab === 'announcements'
                            ? 'bg-white text-slate-900 shadow-xs dark:bg-[#1e293b] dark:text-white'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                      >
                        <Megaphone className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                        <span>Broadcast</span>
                        {unreadAnnouncements.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[9px] font-bold">
                            {unreadAnnouncements.length}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => setNotifTab('system')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                          notifTab === 'system'
                            ? 'bg-white text-slate-900 shadow-xs dark:bg-[#1e293b] dark:text-white'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                      >
                        <Bell className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                        <span>Sistem</span>
                        {unreadNotifs.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[9px] font-bold">
                            {unreadNotifs.length}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Notification List Container */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-[#1e293b] p-1.5 space-y-1">
                      {/* Tab 1: All or Announcements View */}
                      {(notifTab === 'all' || notifTab === 'announcements') &&
                        relevantAnnouncements.slice(0, 5).map(ann => {
                          const isRead = isAnnouncementRead(ann);
                          return (
                            <div
                              key={`ann_${ann.id}`}
                              onClick={() => {
                                handleMarkAnnouncementAsRead(ann.id);
                                setIsNotifOpen(false);
                                setIsAnnouncementListOpen(true);
                              }}
                              className={`p-2.5 rounded-xl transition-all cursor-pointer text-xs relative ${
                                isRead
                                  ? 'bg-slate-50 dark:bg-[#131b2e]/60 opacity-80 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-[#162035] border border-slate-200/60 dark:border-transparent'
                                  : 'bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 hover:border-amber-300 dark:hover:border-amber-500/50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1.5 mb-1">
                                <div className="flex items-center space-x-1.5 truncate">
                                  {ann.priority === 'Mendesak' ? (
                                    <span className="px-1.5 py-0.2 rounded bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-[9px] font-bold flex items-center gap-0.5 shrink-0">
                                      <Flame className="w-2.5 h-2.5 text-red-500 dark:text-red-400" />
                                      MENDESAK
                                    </span>
                                  ) : ann.priority === 'Penting' ? (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[9px] font-bold flex items-center gap-0.5 shrink-0">
                                      <AlertTriangle className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400" />
                                      PENTING
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.2 rounded bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[9px] font-bold shrink-0">
                                      PENGUMUMAN
                                    </span>
                                  )}
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{ann.title}</span>
                                </div>
                                <div className="flex items-center space-x-1 shrink-0">
                                  {ann.isPinned && <Pin className="w-3 h-3 text-amber-500 dark:text-amber-400 shrink-0" />}
                                  {!isRead && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />}
                                </div>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-tight line-clamp-2 mb-1.5">
                                {ann.content}
                              </p>
                              <div className="flex items-center justify-between text-[10px] text-slate-500">
                                <span className="truncate">Oleh: {ann.authorName || 'Kesiswaan'}</span>
                                <span>{ann.publishDate || ann.createdAt?.slice(0, 10)}</span>
                              </div>
                            </div>
                          );
                        })}

                      {/* Tab 2: System Notifications */}
                      {(notifTab === 'all' || notifTab === 'system') &&
                        relevantNotifications.map(n => (
                          <div
                            key={`notif_${n.id}`}
                            onClick={() => {
                              markNotificationAsRead(n.id);
                              if (n.link) {
                                handleNavClick(n.link.replace('#', ''));
                                setIsNotifOpen(false);
                              }
                            }}
                            className={`p-2.5 rounded-xl transition-all cursor-pointer text-xs ${
                              n.isRead
                                ? 'bg-slate-50 dark:bg-[#131b2e]/40 opacity-80 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-[#162035] border border-slate-200/60 dark:border-transparent'
                                : 'bg-blue-50/80 dark:bg-blue-950/25 border border-blue-200 dark:border-blue-500/30 hover:border-blue-300 dark:hover:border-blue-500/50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <div className="flex items-center space-x-1.5 truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{n.title}</span>
                              </div>
                              <div className="flex items-center space-x-1.5 shrink-0 ml-1">
                                <span className="text-[10px] text-slate-500">{n.createdAt}</span>
                                {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                              </div>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-tight">{n.message}</p>
                          </div>
                        ))}

                      {/* Empty state */}
                      {((notifTab === 'announcements' && relevantAnnouncements.length === 0) ||
                        (notifTab === 'system' && relevantNotifications.length === 0) ||
                        (notifTab === 'all' && relevantAnnouncements.length === 0 && relevantNotifications.length === 0)) && (
                        <div className="py-8 text-center text-slate-500 text-xs">
                          <Megaphone className="w-6 h-6 mx-auto mb-2 text-slate-400 opacity-50" />
                          <span>Tidak ada pesan atau notifikasi baru</span>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-2 border-t border-slate-200 dark:border-[#1e293b] bg-slate-50 dark:bg-[#131b2e] flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setIsNotifOpen(false);
                          setIsAnnouncementListOpen(true);
                        }}
                        className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-amber-500/10"
                      >
                        <Megaphone className="w-3.5 h-3.5" />
                        <span>Pusat Broadcast</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsNotifOpen(false);
                          handleNavClick('announcements');
                        }}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-blue-500/10"
                      >
                        <span>Kelola Pengumuman</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Avatar Pill */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setIsProfileModalOpen(!isProfileModalOpen)}
                  className="flex items-center space-x-2.5 px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-[#131b2e] border border-slate-200 dark:border-[#1e293b] hover:border-blue-400 dark:hover:border-slate-600 transition-colors shadow-xs"
                  title="Profil Pengguna"
                >
                  {isGuruBKOrPembinaRole(currentUser.role) ? (
                    <div
                      className={`w-7 h-7 rounded-lg bg-gradient-to-br ${getInitialsColorTheme(currentUser.role).bgGradient} flex items-center justify-center font-black font-mono text-[10px] text-white shadow-xs border ${getInitialsColorTheme(currentUser.role).borderColor}`}
                      title={`Inisial: ${getTeacherInitials(currentUser.displayName)}`}
                    >
                      {getTeacherInitials(currentUser.displayName)}
                    </div>
                  ) : currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover border border-blue-500/40"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center font-bold font-mono text-[11px] text-white shadow-inner">
                      {getTeacherInitials(currentUser.displayName)}
                    </div>
                  )}
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[120px] leading-tight">
                      {currentUser.displayName ? currentUser.displayName.split(' ')[0] : 'Puput'}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight font-medium">
                      {currentUser.role === 'super_admin'
                        ? 'Super Admin'
                        : currentUser.role === 'waka_kesiswaan'
                        ? 'Waka Kesiswaan'
                        : currentUser.role === 'guru_bk'
                        ? 'Guru BK'
                        : currentUser.role === 'pembina_osim'
                        ? 'Pembina OSIM'
                        : currentUser.role === 'pengurus_osim'
                        ? (currentUser.osimDepartmentCode || 'Pengurus OSIM')
                        : 'Pembina Ekskul'}
                    </div>
                  </div>
                </button>

                {isProfileModalOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsProfileModalOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1e293b] shadow-2xl z-40 p-4 font-sans text-xs">
                      {/* User Header Profile */}
                      <div className="p-3 bg-slate-50 dark:bg-[#131b2e] border border-slate-200 dark:border-[#1e293b] rounded-xl mb-3">
                        <div className="flex items-center space-x-3">
                          {isGuruBKOrPembinaRole(currentUser.role) ? (
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getInitialsColorTheme(currentUser.role).bgGradient} flex flex-col items-center justify-center font-black font-mono text-sm text-white shadow-md shrink-0 border-2 ${getInitialsColorTheme(currentUser.role).borderColor}`}>
                              <span>{getTeacherInitials(currentUser.displayName)}</span>
                              <span className="text-[7px] uppercase font-bold text-white/75 tracking-wider">Inisial</span>
                            </div>
                          ) : currentUser.photoURL ? (
                            <img
                              src={currentUser.photoURL}
                              alt={currentUser.displayName}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-xl object-cover border-2 border-blue-500/50 shadow-md shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-base text-white shadow-md shrink-0">
                              {getTeacherInitials(currentUser.displayName)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                ONLINE
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5" title={currentUser.displayName}>
                              {currentUser.displayName}
                            </h4>
                            <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20">
                              {currentUser.role === 'super_admin'
                                ? 'Super Admin'
                                : currentUser.role === 'waka_kesiswaan'
                                ? 'Waka Kesiswaan'
                                : currentUser.role === 'guru_bk'
                                ? 'Guru BK'
                                : currentUser.role === 'pembina_osim'
                                ? 'Pembina OSIM'
                                : currentUser.role === 'pengurus_osim'
                                ? `Pengurus OSIM (${currentUser.osimDepartmentCode || 'Bidang'})`
                                : 'Pembina Ekstrakurikuler'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Metadata Fields */}
                      <div className="space-y-2 bg-slate-50 dark:bg-[#0d121f] p-3 rounded-xl border border-slate-200 dark:border-[#1e293b] text-xs mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">NIP:</span>
                          <span className="text-slate-800 dark:text-slate-200 font-mono font-medium">{currentUser.nip || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">EMAIL:</span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[170px]" title={currentUser.email}>
                            {currentUser.email}
                          </span>
                        </div>
                      </div>

                      {/* Simulasi & Uji Coba Peran Sistem - KHUSUS ROLE ADMIN SAJA */}
                      {isSuperAdmin && (
                        <div className="mb-2.5 p-2.5 bg-slate-50 dark:bg-[#0d121f] rounded-xl border border-slate-200 dark:border-[#1e293b] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-500" />
                              <span>Uji Coba Tampilan Peran (Khusus Admin):</span>
                            </span>
                          </div>

                          {/* Tombol Cepat Admin, Waka, OSIM */}
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                loginWithDemoRole('super_admin');
                                setIsProfileModalOpen(false);
                                setActiveTab('dashboard');
                              }}
                              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                                currentUser.role === 'super_admin'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-white dark:bg-[#151c2c] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <Crown className="w-3 h-3 text-amber-400" />
                              <span>Admin</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const waka = wakaUsers[0];
                                if (waka) {
                                  loginWithUser(waka);
                                } else {
                                  loginWithDemoRole('waka_kesiswaan');
                                }
                                setIsProfileModalOpen(false);
                                setActiveTab('dashboard');
                              }}
                              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                                currentUser.role === 'waka_kesiswaan'
                                  ? 'bg-blue-700 text-white shadow-xs'
                                  : 'bg-white dark:bg-[#151c2c] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <Shield className="w-3 h-3 text-blue-400" />
                              <span>Waka</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                loginWithDemoRole('pembina_osim');
                                setIsProfileModalOpen(false);
                                setActiveTab('dashboard');
                              }}
                              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                                currentUser.role === 'pembina_osim'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-white dark:bg-[#151c2c] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <Users className="w-3 h-3 text-amber-400" />
                              <span>OSIM</span>
                            </button>
                          </div>

                          {/* Pilihan Guru BK (Lebih dari 1) */}
                          <div className="pt-0.5">
                            <label className="text-[10px] text-purple-700 dark:text-purple-300 font-bold flex items-center justify-between mb-1">
                              <span className="flex items-center gap-1">
                                <HeartHandshake className="w-3 h-3 text-purple-500" />
                                <span>Pilihan Guru BK ({bkUsers.length}):</span>
                              </span>
                            </label>
                            <select
                              value={currentUser.role === 'guru_bk' ? currentUser.uid : ''}
                              onChange={(e) => {
                                const target = allUsers.find(u => u.uid === e.target.value);
                                if (target) {
                                  loginWithUser(target);
                                  setIsProfileModalOpen(false);
                                  setActiveTab('dashboard');
                                }
                              }}
                              className="w-full text-[11px] p-1.5 rounded-lg bg-white dark:bg-[#151c2c] border border-purple-200 dark:border-purple-900/60 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
                            >
                              <option value="" disabled>-- Pilih Akun Guru BK --</option>
                              {bkUsers.map(u => (
                                <option key={u.uid} value={u.uid}>
                                  {u.displayName} ({u.counselorSpecialization || 'BK'})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Pilihan Pembina Ekstra (Lebih dari 1) */}
                          <div className="pt-0.5">
                            <label className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-between mb-1">
                              <span className="flex items-center gap-1">
                                <Compass className="w-3 h-3 text-emerald-500" />
                                <span>Pilihan Pembina Ekstra ({pembinaEkskulUsers.length}):</span>
                              </span>
                            </label>
                            <select
                              value={(currentUser.role === 'pembina_ekskul' || currentUser.role === 'pembina') ? currentUser.uid : ''}
                              onChange={(e) => {
                                const target = allUsers.find(u => u.uid === e.target.value);
                                if (target) {
                                  loginWithUser(target);
                                  setIsProfileModalOpen(false);
                                  setActiveTab('dashboard');
                                }
                              }}
                              className="w-full text-[11px] p-1.5 rounded-lg bg-white dark:bg-[#151c2c] border border-emerald-200 dark:border-emerald-900/60 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                              <option value="" disabled>-- Pilih Akun Pembina Ekstra --</option>
                              {pembinaEkskulUsers.map(u => {
                                const matchedEkskul = extracurriculars.find(e => u.extracurricularIds?.includes(e.id));
                                const label = matchedEkskul ? matchedEkskul.name : 'Ekskul';
                                return (
                                  <option key={u.uid} value={u.uid}>
                                    {u.displayName} ({label})
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Tombol Kembali ke Administrator - KHUSUS Admin yang sedang uji coba simulasi peran */}
                      {isSimulatedFromAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            returnToAdminSession();
                            setIsProfileModalOpen(false);
                            setActiveTab('dashboard');
                          }}
                          className="w-full mb-2 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-between transition-colors shadow-sm shadow-amber-600/20"
                        >
                          <div className="flex items-center space-x-2">
                            <Crown className="w-4 h-4 text-amber-200" />
                            <span>Kembali ke Sesi Administrator</span>
                          </div>
                          <span>→</span>
                        </button>
                      )}

                      {/* Button: Pengaturan Profil Saya */}
                      <button
                        onClick={() => {
                          setActiveTab('profile');
                          setIsProfileModalOpen(false);
                        }}
                        className="w-full mb-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-between transition-colors shadow-md shadow-blue-600/20"
                      >
                        <div className="flex items-center space-x-2">
                          <UserCog className="w-4 h-4" />
                          <span>Pengaturan Profil Saya</span>
                        </div>
                        <span>→</span>
                      </button>

                      {/* Logout Button */}
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileModalOpen(false);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/40 dark:border-red-500/30 dark:hover:bg-red-900/50 dark:text-red-300 text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-sm"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>KELUAR DARI APLIKASI</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Workspace Content Body */}
        <main
          ref={mainScrollRef}
          className="relative flex-1 overflow-y-auto bg-[#080c16] light:bg-[#f1f5f9] p-4 sm:p-6 custom-scrollbar transition-colors duration-200"
        >
          {/* Subtle Top Loading / Transition Accent Glow Bar */}
          <div className="sticky -top-4 sm:-top-6 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 z-10 pointer-events-none h-0.5 overflow-hidden">
            <motion.div
              key={activeTab}
              initial={{ scaleX: 0, opacity: 1, originX: 0 }}
              animate={{ scaleX: [0, 1, 1], opacity: [1, 1, 0] }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
            />
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{
                duration: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="max-w-7xl mx-auto space-y-6"
            >
              {/* Role Simulation Indicator - KHUSUS jika sesi simulasi diinisiasi oleh Admin. Untuk semua Guru Pembina & Guru BK, fitur ini ditiadakan */}
              {isSimulatedFromAdmin && currentUser && (
                <div className="p-3 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-900/50 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
                  <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    <span>
                      Mode Uji Tampilan Admin: Menguji peran <strong>{currentUser.displayName}</strong> ({currentUser.role.toUpperCase()})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        returnToAdminSession();
                        setActiveTab('dashboard');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs shadow-amber-600/20"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-200" />
                      <span>Kembali ke Administrator</span>
                    </button>
                  </div>
                </div>
              )}

              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-4/5 max-w-xs bg-[#0a0f1d] light:bg-white border-r border-[#1e293b] light:border-slate-200 h-full p-4 overflow-y-auto flex flex-col shadow-2xl z-10 justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#1e293b] light:border-slate-200">
                  <div className="flex items-center space-x-2.5">
                    {schoolSetting?.logoRightUrl || schoolSetting?.logoUrl ? (
                      <img
                        src={schoolSetting.logoRightUrl || schoolSetting.logoUrl}
                        alt="Logo Sekolah"
                        className="w-8 h-8 object-contain rounded-lg p-0.5 bg-white/10 light:bg-slate-100 shrink-0 border border-slate-200 dark:border-transparent"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-xs text-white">
                        M
                      </div>
                    )}
                    <div>
                      <div className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-tight">MAN 2 SERAM</div>
                      <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">BAGIAN TIMUR</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg bg-[#131b2e] light:bg-slate-100 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Mobile Quick Theme Switcher */}
                <div className="py-3 px-1 flex items-center justify-between border-b border-[#1e293b] light:border-slate-200">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-300 tracking-wide">TEMA & MODE</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleMode}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-[#131b2e] border border-slate-300 dark:border-[#1e293b] text-amber-500 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-[#1a253d] transition-all shadow-xs"
                      title="Ganti Mode Gelap / Terang"
                    >
                      {resolvedMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                    </button>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsThemeModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-[#131b2e] border border-slate-300 dark:border-[#1e293b] text-blue-600 dark:text-blue-400 hover:bg-slate-200 dark:hover:bg-[#1a253d] transition-all shadow-xs"
                      title="Buka Pusat Tema"
                    >
                      <Palette className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="py-3 space-y-4">
                  {navSections.map(sec => (
                    <div key={sec.title} className="space-y-1">
                      <div className="px-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {sec.title}
                      </div>
                      <div className="space-y-0.5">
                        {sec.items.map(item => {
                          const Icon = item.icon;
                          const isActive = activeTab === item.id;
                          return (
                            <motion.button
                              key={`${sec.title}-${item.id}`}
                              onClick={() => handleNavClick(item.id)}
                              whileTap={{ scale: 0.98 }}
                              className={`relative w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors duration-150 ${
                                isActive
                                  ? 'text-white font-bold'
                                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#131c2e]'
                              }`}
                            >
                              {isActive && (
                                <motion.div
                                  layoutId="activeMobileNavIndicator"
                                  className="absolute inset-0 bg-blue-600 rounded-xl shadow-md z-0"
                                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                                />
                              )}
                              <div className="relative z-10 flex items-center space-x-2.5 truncate">
                                <Icon className={`w-4 h-4 shrink-0 transition-colors duration-150 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                                <span className="truncate">{item.label}</span>
                              </div>
                              {item.tag && (
                                <span
                                  className={`relative z-10 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-md border tracking-wider uppercase transition-colors duration-150 ${getNavTagClass(
                                    item.tag,
                                    isActive
                                  )}`}
                                >
                                  {item.tag}
                                </span>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logout Mobile */}
              <div className="pt-3 border-t border-[#1e293b] light:border-slate-200">
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-red-950/40 light:bg-red-50 border border-red-500/30 light:border-red-200 text-red-300 light:text-red-700 text-xs font-bold flex items-center justify-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>KELUAR</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Modals */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={tabId => handleNavClick(tabId)}
      />

      <TimezoneSelectorModal
        isOpen={isTimezoneModalOpen}
        onClose={() => setIsTimezoneModalOpen(false)}
      />

      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {isAnnouncementListOpen && (
        <AnnouncementListModal
          isOpen={isAnnouncementListOpen}
          onClose={() => setIsAnnouncementListOpen(false)}
          announcements={announcements || []}
          readAnnouncementIds={readAnnouncementIds}
          onMarkAsRead={handleMarkAnnouncementAsRead}
          onMarkAllAsRead={handleMarkAllAnnouncementsAsRead}
        />
      )}

      {isAnnouncementPopupOpen && unreadAnnouncements.length > 0 && (
        <AnnouncementPopupModal
          isOpen={isAnnouncementPopupOpen}
          onClose={() => setIsAnnouncementPopupOpen(false)}
          announcements={unreadAnnouncements}
          onMarkAsRead={handleMarkAnnouncementAsRead}
          onMarkAllAsRead={handleMarkAllAnnouncementsAsRead}
        />
      )}
    </div>
  );
};
