import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { SchoolProvider } from './contexts/SchoolContext';
import { TimezoneProvider } from './contexts/TimezoneContext';
import { AppLayout, NavTab } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { CPanelPage } from './pages/CPanelPage';
import { OsimPage } from './pages/OsimPage';
import { StudentsPage } from './pages/StudentsPage';
import { ExtracurricularPage } from './pages/ExtracurricularPage';
import { ExtracurricularMembersPage } from './pages/ExtracurricularMembersPage';
import { SchedulesPage } from './pages/SchedulesPage';
import { AttendancePage } from './pages/AttendancePage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { ReportsPage } from './pages/ReportsPage';
import { ViolationsPage } from './pages/ViolationsPage';
import { CounselingPage } from './pages/CounselingPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { PermissionsPage } from './pages/PermissionsPage';
import { LettersPage } from './pages/LettersPage';
import { TeachersPage } from './pages/TeachersPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { CashLedgerPage } from './pages/CashLedgerPage';
import { TataTertibPage } from './pages/TataTertibPage';
import { LoginPage } from './pages/LoginPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Schedule, Violation } from './types';
import { ShieldAlert, ArrowLeft, Lock, Loader2, LogOut, RefreshCw, UserX, WifiOff } from 'lucide-react';

const BootstrapLoadingScreen: React.FC<{ state: string }> = ({ state }) => {
  const message = state === 'AUTH_LOADING'
    ? 'Memverifikasi identitas Firebase Authentication...'
    : state === 'PROFILE_LOADING'
    ? 'Memuat profil pengguna SIM-KESISWAAN dari Firestore...'
    : 'Menyiapkan data ruang kerja kesiswaan...';

  return (
    <div className="min-h-screen bg-[#082a1b] text-white flex flex-col items-center justify-center p-6 select-none font-sans">
      <div className="w-full max-w-md bg-[#041d13]/90 border border-emerald-500/40 rounded-3xl p-8 shadow-2xl text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 mb-5 shadow-lg">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <h2 className="text-xl font-black text-white tracking-wider uppercase mb-1">
          SIM-KESISWAAN
        </h2>
        <p className="text-xs font-bold text-amber-400 tracking-widest uppercase mb-4">
          MAN 2 SERAM BAGIAN TIMUR
        </p>
        <div className="w-48 h-1.5 bg-emerald-950 rounded-full overflow-hidden mb-4 border border-emerald-800">
          <div className="h-full bg-gradient-to-r from-emerald-400 to-amber-400 rounded-full animate-pulse w-3/4" />
        </div>
        <p className="text-xs text-emerald-100 font-medium leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );
};

const UnregisteredProfileScreen: React.FC<{ error: string | null; onLogout: () => void }> = ({ error, onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 select-none font-sans">
      <div className="w-full max-w-lg bg-slate-800 border border-amber-500/40 rounded-3xl p-8 shadow-2xl text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 mb-5 shadow-lg">
          <UserX className="w-8 h-8" />
        </div>
        <span className="text-[10px] font-bold text-amber-400 tracking-widest uppercase bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30 mb-3">
          Status Akun: Belum Terdaftar
        </span>
        <h2 className="text-lg font-bold text-white tracking-wide mb-2">
          Profil SIM-KESISWAAN Belum Ditemukan
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed mb-6">
          {error || 'Akun Firebase Anda berhasil diautentikasi, namun belum memiliki dokumen profil terdaftar di users/{uid}. Sesuai kebijakan keamanan, akun baru tidak otomatis diberikan hak akses.'}
        </p>
        <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-4 w-full text-left text-xs text-slate-300 space-y-2 mb-6">
          <p className="font-bold text-amber-400 flex items-center gap-1.5">
            <span>Petunjuk untuk Pengguna:</span>
          </p>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
            <li>Hubungi <strong>Administrator SIM-KESISWAAN / Proktor Madrasah</strong>.</li>
            <li>Sampaikan alamat email Firebase yang digunakan saat login.</li>
            <li>Admin akan mendaftarkan profil pengguna dan peran (role) resmi Anda di sistem.</li>
          </ul>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Cek Ulang Status</span>
          </button>
          <button
            onClick={onLogout}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-red-600/30"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar / Ganti Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const AuthErrorScreen: React.FC<{ error: string | null; onLogout: () => void }> = ({ error, onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 select-none font-sans">
      <div className="w-full max-w-md bg-slate-800 border border-red-500/40 rounded-3xl p-8 shadow-2xl text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-400/40 flex items-center justify-center text-red-400 mb-5 shadow-lg">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-white tracking-wide mb-2">
          Kendala Autentikasi Akun
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed mb-6">
          {error || 'Terjadi kesalahan saat memverifikasi identitas atau profil pengguna.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Muat Ulang</span>
          </button>
          <button
            onClick={onLogout}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const AuthOfflineScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 select-none font-sans">
      <div className="w-full max-w-md bg-slate-800 border border-amber-500/40 rounded-3xl p-8 shadow-2xl text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 mb-5 shadow-lg">
          <WifiOff className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-white tracking-wide mb-2">
          Status Jaringan Terputus (Offline)
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed mb-6">
          Tidak dapat terhubung ke server Firebase. Pastikan perangkat Anda terhubung ke internet dan muat ulang halaman.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Coba Hubungkan Kembali</span>
        </button>
      </div>
    </div>
  );
};

const VALID_TABS: NavTab[] = [
  'dashboard',
  'cpanel',
  'osim',
  'students',
  'extracurriculars',
  'members',
  'schedules',
  'attendance',
  'activities',
  'reports',
  'rules',
  'violations',
  'counseling',
  'achievements',
  'permissions',
  'letters',
  'teachers',
  'cash',
  'announcements',
  'settings',
  'profile'
];

const getInitialTab = (): NavTab => {
  try {
    // 1. Check URL hash first (e.g. #teachers, #cpanel, #students)
    const rawHash = window.location.hash.replace('#', '').trim();
    const cleanHash = rawHash.split('?')[0].split('&')[0].trim() as NavTab;
    if (cleanHash && VALID_TABS.includes(cleanHash)) {
      return cleanHash;
    }
    // 2. Check localStorage
    const saved = localStorage.getItem('simkesiswaan_active_tab') as NavTab;
    if (saved && VALID_TABS.includes(saved)) {
      return saved;
    }
  } catch (e) {
    // Ignore storage read errors
  }
  return 'dashboard';
};

const MainContent: React.FC = () => {
  const [activeTab, setActiveTabState] = useState<NavTab>(getInitialTab);
  const [targetScheduleForAttendance, setTargetScheduleForAttendance] = useState<Schedule | null>(null);
  const [counselingReferralViolation, setCounselingReferralViolation] = useState<Violation | null>(null);
  const {
    currentUser,
    userRole,
    canAccessTab,
    isPembinaOsim,
    isPembinaEkskul,
    isPengurusOsim,
    bootstrapState,
    bootstrapError,
    logout
  } = useAuth();

  // Custom setter that syncs with URL hash & localStorage
  const setActiveTab = (tab: NavTab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('simkesiswaan_active_tab', tab);
      if (window.location.hash !== `#${tab}`) {
        window.history.replaceState(null, '', `#${tab}`);
      }
    } catch (e) {
      // Ignore storage errors
    }
  };

  // Sync state if user changes URL hash directly or uses browser Back/Forward
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim() as NavTab;
      if (hash && VALID_TABS.includes(hash) && hash !== activeTab) {
        if (!currentUser || canAccessTab(hash)) {
          setActiveTabState(hash);
          try {
            localStorage.setItem('simkesiswaan_active_tab', hash);
          } catch (e) {}
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab, currentUser, canAccessTab]);

  // Ensure current active tab is saved in URL hash on mount / user change, and fallback if unauthorized
  useEffect(() => {
    if (currentUser && bootstrapState === 'READY') {
      const currentTabAuthorized = canAccessTab(activeTab);
      if (!currentTabAuthorized) {
        if (activeTab !== 'dashboard') {
          setActiveTab('dashboard');
        }
        return;
      }
      try {
        localStorage.setItem('simkesiswaan_active_tab', activeTab);
        if (window.location.hash !== `#${activeTab}`) {
          window.history.replaceState(null, '', `#${activeTab}`);
        }
      } catch (e) {}
    }
  }, [currentUser, activeTab, canAccessTab, bootstrapState]);

  // Clean URL hash ONLY if user explicitly has NO session AND bootstrap has fully confirmed (READY state)
  useEffect(() => {
    if (bootstrapState === 'READY' && !currentUser) {
      if (window.location.hash) {
        try {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch (e) {}
      }
    }
  }, [currentUser, bootstrapState]);

  // FASE 1: Verifikasi Bootstrap State Sebelum Memuat Antarmuka Pengguna
  if (bootstrapState === 'AUTH_LOADING' || bootstrapState === 'PROFILE_LOADING' || bootstrapState === 'DATA_LOADING') {
    return <BootstrapLoadingScreen state={bootstrapState} />;
  }

  if (bootstrapState === 'PROFILE_UNREGISTERED') {
    return <UnregisteredProfileScreen error={bootstrapError} onLogout={logout} />;
  }

  if (bootstrapState === 'ERROR') {
    return <AuthErrorScreen error={bootstrapError} onLogout={logout} />;
  }

  if (bootstrapState === 'OFFLINE') {
    return <AuthOfflineScreen />;
  }

  // If not logged in, show the official SIM Kesiswaan Login Page
  if (!currentUser) {
    return <LoginPage />;
  }

  const handleOpenAttendanceForSchedule = (schedule: Schedule) => {
    setTargetScheduleForAttendance(schedule);
    setActiveTab('attendance');
  };

  const handleReferViolationToCounseling = (violation: Violation) => {
    setCounselingReferralViolation(violation);
    setActiveTab('counseling');
  };

  const renderRestrictedAccess = () => {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <span className="text-[10px] font-bold text-red-500 tracking-widest uppercase bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 mb-2">
          403 Hak Akses Terbatas
        </span>
        <h2 className="text-base font-bold text-slate-800 dark:text-zinc-200 mt-1">
          Halaman Tidak Dapat Diakses Oleh Peran Ini
        </h2>
        <p className="text-slate-600 dark:text-zinc-400 text-xs max-w-md mt-2 font-sans leading-relaxed">
          Akun Anda saat ini (<strong>{currentUser?.displayName}</strong> — <span className="text-blue-500 dark:text-blue-400 font-semibold">{userRole.toUpperCase()}</span>) hanya memiliki izin akses pada modul kerja sesuai tugas dan fungsinya.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-blue-600/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </button>
          {(isPembinaOsim || isPengurusOsim) && (
            <button
              onClick={() => setActiveTab('osim')}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors"
            >
              Menu OSIM →
            </button>
          )}
          {isPembinaEkskul && (
            <button
              onClick={() => setActiveTab('extracurriculars')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
            >
              Menu Ekstrakurikuler →
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (!canAccessTab(activeTab)) {
      return renderRestrictedAccess();
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={setActiveTab} onOpenAttendance={handleOpenAttendanceForSchedule} />;
      case 'cpanel':
        return <CPanelPage />;
      case 'osim':
        return <OsimPage />;
      case 'students':
        return <StudentsPage />;
      case 'extracurriculars':
        return <ExtracurricularPage onNavigateToMembers={() => setActiveTab('members')} />;
      case 'members':
        return <ExtracurricularMembersPage onNavigate={setActiveTab} />;
      case 'schedules':
        return <SchedulesPage onStartAttendance={handleOpenAttendanceForSchedule} />;
      case 'attendance':
        return <AttendancePage initialSchedule={targetScheduleForAttendance} />;
      case 'activities':
        return <ActivitiesPage />;
      case 'reports':
        return <ReportsPage />;
      case 'rules':
        return <TataTertibPage />;
      case 'violations':
        return <ViolationsPage onReferToCounseling={handleReferViolationToCounseling} />;
      case 'counseling':
        return (
          <CounselingPage
            initialReferral={counselingReferralViolation}
            onClearReferral={() => setCounselingReferralViolation(null)}
          />
        );
      case 'achievements':
        return <AchievementsPage />;
      case 'permissions':
        return <PermissionsPage />;
      case 'letters':
        return <LettersPage />;
      case 'teachers':
        return <TeachersPage />;
      case 'cash':
        return <CashLedgerPage />;
      case 'announcements':
        return <AnnouncementsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'profile':
        return <ProfileSettingsPage />;
      default:
        return <DashboardPage onNavigate={setActiveTab} onOpenAttendance={handleOpenAttendanceForSchedule} />;
    }
  };

  return (
    <AppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <ErrorBoundary
        fallbackTitle={`Kendala Memuat Halaman ${activeTab.toUpperCase()}`}
        fallbackMessage="Terjadi kendala saat memuat modul ini. Anda dapat mencoba memulihkan modul atau beralih ke menu lain melalui sidebar."
        onReset={() => setActiveTab('dashboard')}
      >
        {renderContent()}
      </ErrorBoundary>
    </AppLayout>
  );
};

export default function App() {
  // Verifikasi mounted: Pastikan provider/komponen tidak memicu update paksa ke 'dark'
  // dan verifikasi apakah 'simkesiswaan_theme' di localStorage benar-benar ada sebelum mengizinkan mode tema
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('simkesiswaan_theme') || localStorage.getItem('simkesiswaan_theme_mode');
      if (!savedTheme) {
        // Jika belum ada preferensi tema di localStorage, jangan izinkan class 'dark' aktif tanpa izin
        const defaultMode = (document.documentElement.getAttribute('data-mode') as 'light' | 'dark') || 'light';
        if (defaultMode === 'light' && document.documentElement.classList.contains('dark')) {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
          document.documentElement.setAttribute('data-mode', 'light');
        }
      }
    } catch (e) {
      // Abaikan kendala akses storage
    }
  }, []);

  return (
    <ErrorBoundary
      fallbackTitle="Sistem SIM-KESISWAAN Terhenti Sementara"
      fallbackMessage="Aplikasi mendeteksi kendala pada inisialisasi modul. Silakan muat ulang halaman atau bersihkan sesi login untuk masuk kembali."
    >
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <TimezoneProvider>
              <SchoolProvider>
                <ErrorBoundary
                  fallbackTitle="Kendala Memuat Ruang Kerja Madrasah"
                  fallbackMessage="Terjadi gangguan saat memuat data sesi kerja. Klik tombol di bawah untuk menyegarkan tampilan."
                >
                  <MainContent />
                </ErrorBoundary>
              </SchoolProvider>
            </TimezoneProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
