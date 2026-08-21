import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { SchoolProvider } from './contexts/SchoolContext';
import { AppLayout, NavTab } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
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
import { Schedule, Violation } from './types';

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [targetScheduleForAttendance, setTargetScheduleForAttendance] = useState<Schedule | null>(null);

  const handleOpenAttendanceForSchedule = (schedule: Schedule) => {
    setTargetScheduleForAttendance(schedule);
    setActiveTab('attendance');
  };

  const handleReferViolationToCounseling = (violation: Violation) => {
    setActiveTab('counseling');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={setActiveTab} onOpenAttendance={handleOpenAttendanceForSchedule} />;
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
      case 'settings':
        return <SettingsPage />;
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
    <AuthProvider>
      <SchoolProvider>
        <MainContent />
      </SchoolProvider>
    </AuthProvider>
  );
}
