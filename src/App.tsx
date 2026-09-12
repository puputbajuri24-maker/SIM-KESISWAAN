import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
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
import { TeachersPage } from './pages/TeachersPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { CashLedgerPage } from './pages/CashLedgerPage';
import { TataTertibPage } from './pages/TataTertibPage';
import { LoginPage } from './pages/LoginPage';
import { Schedule, Violation } from './types';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

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
  'teachers',
  'cash',
  'announcements',
  'settings',
  'profile'
];

const getInitialTab = (): NavTab => {
  try {
    // 1. Check URL hash first (e.g. #students, #profile, #osim)
    const hash = window.location.hash.replace('#', '').trim() as NavTab;
    if (hash && VALID_TABS.includes(hash)) {
      return hash;
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
  const { currentUser, userRole, canAccessTab, isPembinaOsim, isPembinaEkskul } = useAuth();

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
        setActiveTabState(hash);
        try {
          localStorage.setItem('simkesiswaan_active_tab', hash);
        } catch (e) {}
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  // Ensure current active tab is saved in URL hash on mount, and fallback if unauthorized
  useEffect(() => {
    if (currentUser) {
      if (!canAccessTab(activeTab)) {
        setActiveTab('dashboard');
        return;
      }
      try {
        localStorage.setItem('simkesiswaan_active_tab', activeTab);
        if (window.location.hash !== `#${activeTab}`) {
          window.history.replaceState(null, '', `#${activeTab}`);
        }
      } catch (e) {}
    }
  }, [currentUser, activeTab, canAccessTab]);

  // Clean URL hash if visiting without an active session
  useEffect(() => {
    if (!currentUser) {
      if (window.location.hash) {
        try {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch (e) {}
      }
    }
  }, [currentUser]);

  // If not logged in, show the official SIM Kesiswaan Login Page
  if (!currentUser) {
    return <LoginPage />;
  }

  const handleOpenAttendanceForSchedule = (schedule: Schedule) => {
    setTargetScheduleForAttendance(schedule);
    setActiveTab('attendance');
  };

  const handleReferViolationToCounseling = (violation: Violation) => {
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
          {isPembinaOsim && (
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
        return <ExtracurricularMembersPage />;
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
        return <CounselingPage />;
      case 'achievements':
        return <AchievementsPage />;
      case 'permissions':
        return <PermissionsPage />;
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
      {renderContent()}
    </AppLayout>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TimezoneProvider>
          <SchoolProvider>
            <MainContent />
          </SchoolProvider>
        </TimezoneProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
