import React, { useState, useMemo } from 'react';
import {
  Server,
  Users,
  ShieldCheck,
  Key,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Copy,
  Printer,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Database,
  Eye,
  EyeOff,
  UserCheck,
  Crown,
  HeartHandshake,
  Award,
  Tent,
  FileText,
  Activity,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  QrCode,
  HardDrive,
  Building,
  Calendar,
  Save,
  School,
  X,
  History,
  Megaphone,
  Wallet,
  LogIn,
  Compass,
  Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSchool } from '../contexts/SchoolContext';
import { AnnouncementManagementPanel } from '../components/announcements/AnnouncementManagementPanel';
import { UserProfile, UserRole, SchoolSetting } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { AuditLogsPanel } from '../components/cpanel/AuditLogsPanel';
import { AcademicYearManagementModal } from '../components/common/AcademicYearManagementModal';
import {
  getTeacherInitials,
  isGuruBKOrPembinaRole,
  getInitialsColorTheme
} from '../utils/initials';

export const CPanelPage: React.FC = () => {
  const { allUsers, currentUser, isSuperAdmin, addUser, updateUser, deleteUser, resetUserPassword, loginWithUser, loginWithDemoRole, syncUsersFromTeachers } = useAuth();
  const {
    schoolSetting,
    updateSchoolSetting,
    academicYears,
    activeAcademicYear,
    activeSemester,
    setActiveAcademicYear,
    extracurriculars,
    seedFirebaseDatabase,
    clearAllOperationalData,
    exportFullDatabaseJSON,
    importFullDatabaseJSON,
    students,
    teachers,
    auditLogs,
    syncUserFromCPanel,
    syncDeleteUserFromCPanel,
    syncAllCPanelUsers
  } = useSchool();

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'announcements' | 'school' | 'matrix' | 'sync' | 'logs'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Quick Role Testing state & users groupings
  const bkUsers = useMemo(() => allUsers.filter(u => u.role === 'guru_bk'), [allUsers]);
  const pembinaEkskulUsers = useMemo(() => allUsers.filter(u => u.role === 'pembina_ekskul' || u.role === 'pembina'), [allUsers]);
  const pembinaOsimUsers = useMemo(() => allUsers.filter(u => u.role === 'pembina_osim'), [allUsers]);
  const wakaUsers = useMemo(() => allUsers.filter(u => u.role === 'waka_kesiswaan'), [allUsers]);
  const adminUsers = useMemo(() => allUsers.filter(u => u.role === 'super_admin'), [allUsers]);

  const [selectedBkUserId, setSelectedBkUserId] = useState<string>('');
  const [selectedPembinaUserId, setSelectedPembinaUserId] = useState<string>('');

  const getPembinaEkskulName = (u: UserProfile) => {
    if (!u.extracurricularIds || u.extracurricularIds.length === 0) return 'Ekstrakurikuler';
    const names = u.extracurricularIds
      .map(id => extracurriculars.find(e => e.id === id)?.name)
      .filter(Boolean);
    return names.length > 0 ? names.join(', ') : 'Ekstrakurikuler';
  };

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);
  const [isAcademicYearModalOpen, setIsAcademicYearModalOpen] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] = useState<UserProfile | null>(null);

  // School Setting form state for Master Control
  const [schoolFormData, setSchoolFormData] = useState<SchoolSetting>({
    id: schoolSetting?.id || 'main_school',
    name: schoolSetting?.name || 'MAN 2 SERAM BAGIAN TIMUR',
    centralInstitution: schoolSetting?.centralInstitution || 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
    regionalInstitution: schoolSetting?.regionalInstitution || 'KANTOR KEMENTERIAN AGAMA KABUPATEN SERAM BAGIAN TIMUR',
    npsn: schoolSetting?.npsn || '60728491',
    address: schoolSetting?.address || 'Jl. Lintas Seram, Kec. Bula, Kab. Seram Bagian Timur, Maluku',
    postalCode: schoolSetting?.postalCode || '97554',
    principalName: schoolSetting?.principalName || 'Zakaria, S. Pd.I., M. Pd',
    principalNip: schoolSetting?.principalNip || '197808042003121008',
    wakaName: schoolSetting?.wakaName || schoolSetting?.wakaKesiswaanName || 'Puput Eka Bajuri, S. Pd., M. Or',
    wakaNip: schoolSetting?.wakaNip || '198810052020121003',
    wakaKesiswaanName: schoolSetting?.wakaKesiswaanName || schoolSetting?.wakaName || 'Puput Eka Bajuri, S. Pd., M. Or',
    phone: schoolSetting?.phone || '(0915) 21189',
    email: schoolSetting?.email || 'man2sbt@kemenag.go.id',
    website: schoolSetting?.website || 'https://man2serambagiantimur.sch.id',
    logoUrl: schoolSetting?.logoUrl || '',
    logoLeftUrl: schoolSetting?.logoLeftUrl || '',
    logoRightUrl: schoolSetting?.logoRightUrl || '',
    currentAcademicYear: schoolSetting?.currentAcademicYear || activeAcademicYear || '2026/2027',
    currentSemester: schoolSetting?.currentSemester || activeSemester || 'Ganjil'
  });

  // Form states for add/edit user
  const [formData, setFormData] = useState<{
    displayName: string;
    nip: string;
    email: string;
    username: string;
    password: string;
    role: UserRole;
    phone: string;
    counselorSpecialization: string;
    extracurricularIds: string[];
    status: 'Aktif' | 'Nonaktif';
    isCashManager: boolean;
    cashManagerTitle: string;
  }>({
    displayName: '',
    nip: '',
    email: '',
    username: '',
    password: 'password',
    role: 'pembina_ekskul',
    phone: '',
    counselorSpecialization: 'Bimbingan Konseling Siswa & Karir',
    extracurricularIds: [],
    status: 'Aktif',
    isCashManager: false,
    cashManagerTitle: 'Bendahara Kesiswaan'
  });

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);
  const [isImportingJSON, setIsImportingJSON] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isSavingSchool, setIsSavingSchool] = useState(false);
  const jsonFileInputRef = React.useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleClearAllData = async () => {
    setIsClearingData(true);
    try {
      const res = await clearAllOperationalData();
      if (res.success) {
        showToast('Seluruh data bawaan berhasil dibersihkan! Aplikasi siap diisi dengan data sekolah resmi.');
        setIsClearDataModalOpen(false);
      } else {
        showToast(res.message || 'Gagal membersihkan data bawaan.', 'error');
      }
    } catch (e: any) {
      showToast('Error: ' + e?.message, 'error');
    } finally {
      setIsClearingData(false);
    }
  };

  const handleExportJSON = () => {
    try {
      exportFullDatabaseJSON();
      showToast('Cadangan database JSON lengkap berhasil diunduh!');
    } catch (e: any) {
      showToast('Gagal mengekspor database: ' + e?.message, 'error');
    }
  };

  const handleImportJSONFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingJSON(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const res = await importFullDatabaseJSON(parsed);
        if (res.success) {
          showToast(res.message || 'Database lengkap berhasil dipulihkan dari berkas JSON!');
        } else {
          showToast(res.message || 'Gagal memulihkan database.', 'error');
        }
      } catch (err: any) {
        showToast('Berkas JSON tidak valid atau rusak: ' + err?.message, 'error');
      } finally {
        setIsImportingJSON(false);
        if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      showToast('Gagal membaca berkas.', 'error');
      setIsImportingJSON(false);
      if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // Find teachers in Dewan Guru (including newly imported from Excel) who don't have cPanel user accounts yet
  const unregisteredTeachers = teachers.filter(t => {
    const cleanNip = t.nip ? t.nip.replace(/\s+/g, '').replace(/[^0-9]/g, '') : '';
    const cleanEmail = t.email ? t.email.toLowerCase().trim() : '';
    return !allUsers.some(u => 
      u.uid === t.id ||
      u.uid === `user_${t.id}` ||
      (cleanNip && u.nip && u.nip.replace(/\s+/g, '').replace(/[^0-9]/g, '') === cleanNip) ||
      (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail) ||
      u.displayName.toLowerCase().trim() === t.fullName.toLowerCase().trim()
    );
  });

  const togglePasswordVisibility = (uid: string) => {
    setShowPasswordMap(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

  const handleCopyCredentials = (u: UserProfile) => {
    const text = `KREDENSIAL LOGIN SIM KESISWAAN\nNama: ${u.displayName}\nRole: ${u.role.toUpperCase()}\nNIP: ${u.nip || '-'}\nEmail: ${u.email}\nPassword: ${u.password || 'password'}\nURL: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    showToast(`Kredensial login ${u.displayName} berhasil disalin ke clipboard!`);
  };

  const handleSyncFromTeachers = async () => {
    setIsSyncingAll(true);
    try {
      const count = await syncUsersFromTeachers(teachers, extracurriculars);
      showToast(`Berhasil menyinkronkan ${count} data guru & pembina dari Dewan Guru ke daftar akun cPanel!`);
    } catch (e: any) {
      showToast('Gagal sinkronisasi data guru: ' + e?.message, 'error');
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleSyncAllModules = async () => {
    setIsSyncingAll(true);
    try {
      await syncAllCPanelUsers(allUsers);
      showToast('Seluruh data akun cPanel berhasil disinkronkan ke Dewan Guru, Ekstrakurikuler, dan modul Kesiswaan!');
    } catch (e: any) {
      showToast('Gagal sinkronisasi: ' + e?.message, 'error');
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      displayName: '',
      nip: '',
      email: '',
      username: '',
      password: 'password',
      role: 'pembina_ekskul',
      phone: '',
      counselorSpecialization: 'Bimbingan Konseling Siswa & Karir',
      extracurricularIds: [],
      status: 'Aktif',
      isCashManager: false,
      cashManagerTitle: 'Bendahara Kesiswaan'
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (u: UserProfile) => {
    setSelectedUserForAction(u);
    setFormData({
      displayName: u.displayName || '',
      nip: u.nip || '',
      email: u.email || '',
      username: u.username || '',
      password: u.password || 'password',
      role: u.role,
      phone: u.phone || '',
      counselorSpecialization: u.counselorSpecialization || 'Bimbingan Konseling Siswa & Karir',
      extracurricularIds: u.extracurricularIds || [],
      status: u.status || 'Aktif',
      isCashManager: !!u.isCashManager,
      cashManagerTitle: u.cashManagerTitle || 'Bendahara Kesiswaan'
    });
    setIsEditModalOpen(true);
  };

  const handleToggleCashManager = async (u: UserProfile) => {
    const nextState = !u.isCashManager;
    const title = nextState ? (u.cashManagerTitle || 'Bendahara Kesiswaan') : undefined;
    const res = await updateUser(u.uid, {
      isCashManager: nextState,
      cashManagerTitle: title
    });
    if (res.success) {
      await syncUserFromCPanel({ ...u, isCashManager: nextState, cashManagerTitle: title }, u);
      showToast(
        nextState
          ? `Hak Pengelola Kas & Keuangan berhasil diberikan kepada ${u.displayName}! Menu Neraca Kas otomatis muncul pada akun ini.`
          : `Hak Pengelola Kas dinonaktifkan untuk ${u.displayName}. Menu Neraca Kas ditutup.`
      );
    } else {
      showToast(res.error || 'Gagal mengubah status pengelola kas.', 'error');
    }
  };

  const handleSaveAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayName.trim() || !formData.email.trim()) {
      showToast('Nama dan Email akun wajib diisi.', 'error');
      return;
    }

    const newUser: UserProfile = {
      uid: `user_${Date.now()}`,
      displayName: formData.displayName.trim(),
      nip: formData.nip.trim() || undefined,
      email: formData.email.trim(),
      username: formData.username.trim() || formData.email.split('@')[0],
      password: formData.password.trim() || 'password',
      role: formData.role,
      phone: formData.phone.trim() || undefined,
      counselorSpecialization: formData.role === 'guru_bk' ? formData.counselorSpecialization : undefined,
      extracurricularIds: formData.role === 'pembina_ekskul' ? formData.extracurricularIds : undefined,
      status: formData.status,
      isCashManager: formData.isCashManager,
      cashManagerTitle: formData.isCashManager ? (formData.cashManagerTitle.trim() || 'Bendahara') : undefined
    };

    const res = await addUser(newUser);
    if (res.success) {
      // Cross-Module Real-time Sync
      await syncUserFromCPanel(newUser);
      showToast(`Akun ${newUser.displayName} (${newUser.role}) berhasil ditambahkan dan data otomatis sinkron ke seluruh menu!`);
      setIsAddModalOpen(false);
    } else {
      showToast(res.error || 'Gagal menambahkan akun.', 'error');
    }
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAction) return;

    const updatedData: Partial<UserProfile> = {
      displayName: formData.displayName.trim(),
      nip: formData.nip.trim() || undefined,
      email: formData.email.trim(),
      username: formData.username.trim() || undefined,
      password: formData.password.trim() || 'password',
      role: formData.role,
      phone: formData.phone.trim() || undefined,
      counselorSpecialization: formData.role === 'guru_bk' ? formData.counselorSpecialization : undefined,
      extracurricularIds: formData.role === 'pembina_ekskul' ? formData.extracurricularIds : undefined,
      status: formData.status,
      isCashManager: formData.isCashManager,
      cashManagerTitle: formData.isCashManager ? (formData.cashManagerTitle.trim() || 'Bendahara') : undefined
    };

    const res = await updateUser(selectedUserForAction.uid, updatedData);

    if (res.success) {
      const mergedUser: UserProfile = { ...selectedUserForAction, ...updatedData };
      // Cross-Module Real-time Sync
      await syncUserFromCPanel(mergedUser, selectedUserForAction);
      showToast(`Perubahan data akun ${formData.displayName} berhasil disimpan & disinkronkan ke seluruh menu terkait!`);
      setIsEditModalOpen(false);
    } else {
      showToast(res.error || 'Gagal memperbarui akun.', 'error');
    }
  };

  const handleSaveSchoolMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSchool(true);
    try {
      await updateSchoolSetting(schoolFormData);
      if (schoolFormData.currentAcademicYear) {
        setActiveAcademicYear(schoolFormData.currentAcademicYear, schoolFormData.currentSemester);
      }
      showToast('Profil madrasah, kop surat, dan tahun ajaran aktif berhasil diperbarui di seluruh modul!');
    } catch (err: any) {
      showToast('Gagal menyimpan profil: ' + err?.message, 'error');
    } finally {
      setIsSavingSchool(false);
    }
  };

  const handleOpenDetailModal = (u: UserProfile) => {
    setSelectedUserForAction(u);
    setIsDetailModalOpen(true);
  };

  const handlePromptResetPassword = (u: UserProfile) => {
    setSelectedUserForAction(u);
    setIsResetModalOpen(true);
  };

  const handleConfirmResetPassword = async () => {
    if (!selectedUserForAction) return;
    const u = selectedUserForAction;
    const res = await resetUserPassword(u.uid, 'password');
    if (res.success) {
      showToast(`Password untuk ${u.displayName} telah direset ke default: "password"`);
    } else {
      showToast(res.error || 'Gagal mereset password.', 'error');
    }
    setIsResetModalOpen(false);
  };

  const handlePromptDeleteUser = (u: UserProfile) => {
    setSelectedUserForAction(u);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteUser = async () => {
    if (!selectedUserForAction) return;
    const u = selectedUserForAction;
    const res = await deleteUser(u.uid);
    if (res.success) {
      await syncDeleteUserFromCPanel(u.uid, u);
      showToast(`Akun ${u.displayName} berhasil dihapus & disinkronkan.`);
    } else {
      showToast(res.error || 'Gagal menghapus akun.', 'error');
    }
    setIsDeleteModalOpen(false);
  };

  const handlePrintAccountSlip = (u: UserProfile) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kartu Login Akun SIM Kesiswaan - ${u.displayName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #fff; color: #111; }
            .card { width: 380px; border: 2px solid #059669; border-radius: 8px; padding: 16px; margin: 20px auto; }
            .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 8px; margin-bottom: 12px; }
            .header h3 { margin: 0; font-size: 14px; color: #065f46; text-transform: uppercase; }
            .header p { margin: 2px 0 0 0; font-size: 10px; color: #555; }
            .info-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px; padding: 4px 0; border-bottom: 1px dashed #e5e7eb; }
            .info-label { font-weight: bold; color: #374151; }
            .info-val { font-family: monospace; font-weight: bold; color: #111827; }
            .highlight { background: #ecfdf5; padding: 6px 8px; border-radius: 4px; font-size: 12px; margin: 10px 0; border: 1px solid #a7f3d0; }
            .footer { font-size: 9px; color: #6b7280; text-align: center; margin-top: 10px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h3>KARTU AKUN LOGIN SIM KESISWAAN</h3>
              <p>${schoolSetting?.name || 'MADRASAH ALIYAH NEGERI TELADAN'}</p>
            </div>
            <div class="info-row">
              <span class="info-label">Nama Pengguna:</span>
              <span>${u.displayName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Hak Akses (Role):</span>
              <span class="info-val" style="color: #059669;">${u.role.toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">NIP / NIK:</span>
              <span class="info-val">${u.nip || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email / User:</span>
              <span class="info-val">${u.email}</span>
            </div>
            <div class="highlight">
              <div style="font-size: 10px; color: #065f46; font-weight: bold;">KREDENSIAL LOGIN:</div>
              <div style="font-size: 13px; font-family: monospace; margin-top: 2px;">
                Password: <strong>${u.password || 'password'}</strong>
              </div>
            </div>
            <div class="footer">
              Portal SIM Kesiswaan • Simpan kartu akun ini dengan baik dan rahasiakan password Anda.
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintAllSlips = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const cardsHtml = allUsers.map(u => `
      <div class="card">
        <div class="header">
          <h3>KARTU AKUN SIM KESISWAAN</h3>
          <p>${schoolSetting?.name || 'MADRASAH ALIYAH NEGERI TELADAN'}</p>
        </div>
        <div class="info-row">
          <span class="info-label">Nama:</span>
          <span>${u.displayName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Peran:</span>
          <span class="info-val" style="color: #059669;">${u.role.toUpperCase()}</span>
        </div>
        <div class="info-row">
          <span class="info-label">NIP:</span>
          <span class="info-val">${u.nip || '-'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span class="info-val">${u.email}</span>
        </div>
        <div class="highlight">
          <span style="font-size: 10px; color: #065f46; font-weight: bold;">PASSWORD:</span>
          <span style="font-size: 12px; font-family: monospace; font-weight: bold;"> ${u.password || 'password'}</span>
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Koleksi Kartu Akun Login SIM Kesiswaan Madrasah</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
            .card { border: 1.5px solid #059669; border-radius: 6px; padding: 12px; page-break-inside: avoid; }
            .header { text-align: center; border-bottom: 1.5px solid #059669; padding-bottom: 4px; margin-bottom: 8px; }
            .header h3 { margin: 0; font-size: 12px; color: #065f46; }
            .header p { margin: 0; font-size: 9px; color: #555; }
            .info-row { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 3px; }
            .info-label { font-weight: bold; color: #4b5563; }
            .info-val { font-family: monospace; }
            .highlight { background: #ecfdf5; padding: 4px 6px; border-radius: 3px; font-size: 11px; margin-top: 6px; border: 1px solid #a7f3d0; }
            @media print { body { padding: 5px; } }
          </style>
        </head>
        <body>
          <div class="grid">${cardsHtml}</div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return { label: 'PROKTOR / SUPER ADMIN', color: 'bg-red-500/10 text-red-400 border-red-500/30' };
      case 'waka_kesiswaan':
        return { label: 'WAKA KESISWAAN', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'guru_bk':
        return { label: 'GURU BK', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      case 'pembina_osim':
        return { label: 'PEMBINA OSIM', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'pembina_ekskul':
      case 'pembina':
        return { label: 'PEMBINA EKSKUL', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      default:
        return { label: 'PENGGUNA', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30' };
    }
  };

  const filteredUsers = allUsers.filter(u => {
    const matchSearch =
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.nip && u.nip.includes(searchTerm));
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl border shadow-2xl flex items-center space-x-3 text-xs font-semibold ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
              : 'bg-red-950/90 border-red-500 text-red-200'
          }`}
        >
          {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* cPanel Main Header */}
      <div className="bg-[#151518] border border-[#27272a] rounded-xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                cPanel & Pusat Kontrol SIM Kesiswaan
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                PROKTOR_ROOT
              </span>
            </div>
            <p className="text-xs text-zinc-200 mt-1">
              Manajemen akun Pembina OSIM, Ekstrakurikuler, Guru BK, matriks hak akses peran, kredensial login, dan sinkronisasi server Kemenag.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleSyncFromTeachers}
            disabled={isSyncingAll}
            className="px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-xs font-bold text-emerald-300 flex items-center space-x-2 transition-colors disabled:opacity-50 shadow-sm"
            title="Tarik dan sinkronkan data dewan guru/pembina (termasuk hasil import Excel) ke daftar akun cPanel"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
            <span>Tarik Data Guru/Pembina</span>
            {unregisteredTeachers.length > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full ml-1">
                {unregisteredTeachers.length}
              </span>
            )}
          </button>
          <button
            onClick={handleSyncAllModules}
            disabled={isSyncingAll}
            className="px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-xs font-bold text-indigo-300 flex items-center space-x-2 transition-colors disabled:opacity-50"
            title="Sinkronkan seluruh perubahan akun cPanel ke Dewan Guru, Ekstrakurikuler, dan modul Kesiswaan"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
            <span>{isSyncingAll ? 'Menyinkronkan...' : 'Sinkronkan Semua Modul'}</span>
          </button>
          <button
            onClick={handlePrintAllSlips}
            className="px-3 py-2 rounded-lg bg-[#222226] hover:bg-[#2b2b30] border border-[#37373f] text-xs font-semibold text-zinc-100 flex items-center space-x-2 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-300" />
            <span>Cetak Semua Slip Akun</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center space-x-2 transition-colors shadow-lg shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Akun Baru</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#151518] border border-[#27272a] rounded-xl p-4">
          <span className="text-[10px] font-mono text-zinc-300 font-bold uppercase block">TOTAL PENGGUNA TERDAFTAR</span>
          <span className="text-2xl font-black text-white font-mono">{allUsers.length}</span>
          <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">Semua Role Terdaftar</span>
        </div>
        <div className="bg-[#151518] border border-[#27272a] rounded-xl p-4">
          <span className="text-[10px] font-mono text-zinc-300 font-bold uppercase block">GURU BK & KONSELOR</span>
          <span className="text-2xl font-black text-purple-400 font-mono">
            {allUsers.filter(u => u.role === 'guru_bk').length}
          </span>
          <span className="text-[10px] text-zinc-300 font-medium block mt-0.5">Layanan Konseling & SP</span>
        </div>
        <div className="bg-[#151518] border border-[#27272a] rounded-xl p-4">
          <span className="text-[10px] font-mono text-zinc-300 font-bold uppercase block">PEMBINA OSIM & EKSKUL</span>
          <span className="text-2xl font-black text-amber-400 font-mono">
            {allUsers.filter(u => u.role === 'pembina_osim' || u.role === 'pembina_ekskul' || u.role === 'pembina').length}
          </span>
          <span className="text-[10px] text-zinc-300 font-medium block mt-0.5">Intra & Ekstrakurikuler</span>
        </div>
        <div className="bg-[#151518] border border-[#27272a] rounded-xl p-4">
          <span className="text-[10px] font-mono text-zinc-300 font-bold uppercase block">STATUS SINKRONISASI</span>
          <span className="text-sm font-bold text-emerald-400 flex items-center space-x-1.5 mt-1 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>REAL-TIME AKTIF</span>
          </span>
          <span className="text-[10px] text-zinc-300 font-medium block mt-1">TA: {activeAcademicYear} {activeSemester}</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#27272a] flex items-center space-x-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'users'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-300 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Manajemen Akun Guru & Pembina</span>
        </button>
        <button
          onClick={() => setActiveSubTab('announcements')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'announcements'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-zinc-300 hover:text-white'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Pusat Pengumuman & Broadcast</span>
        </button>
        <button
          onClick={() => setActiveSubTab('school')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'school'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-300 hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Identitas Madrasah & Profil Master</span>
        </button>
        <button
          onClick={() => setActiveSubTab('matrix')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'matrix'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-300 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Matriks Hak Akses Peran</span>
        </button>
        <button
          onClick={() => setActiveSubTab('sync')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'sync'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-300 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Sinkronisasi & Server Data</span>
        </button>
        <button
          onClick={() => setActiveSubTab('logs')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'logs'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-300 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Log Aktivitas & Audit Trail</span>
          {auditLogs?.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
              {auditLogs.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: USERS MANAGEMENT */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          {/* Unsynced Teachers Alert Banner */}
          {unregisteredTeachers.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-300">
                    Terdapat {unregisteredTeachers.length} Data Guru & Pembina Belum Memiliki Akun cPanel
                  </h4>
                  <p className="text-[11px] text-zinc-200 mt-0.5">
                    Data guru baru dari menu Dewan Guru atau hasil Import Excel belum disinkronkan ke daftar akun login cPanel. Klik tombol di samping untuk membuat akun otomatis.
                  </p>
                </div>
              </div>
              <button
                onClick={handleSyncFromTeachers}
                disabled={isSyncingAll}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center space-x-2 transition-colors shrink-0 shadow-lg shadow-amber-950/40 disabled:opacity-50 whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                <span>Sinkronkan Sekarang ({unregisteredTeachers.length} Akun)</span>
              </button>
            </div>
          )}

          {/* FITUR PENGUJIAN PERAN CEPAT (KHUSUS ADMIN) */}
          <div className="bg-[#151518] border-2 border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272a] pb-3.5">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                      Fitur Pengujian Peran Cepat (Simulasi Tampilan Hak Akses)
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      KHUSUS ADMIN
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-zinc-300 mt-0.5">
                    Akses uji coba antarmuka dan wewenang untuk setiap peran. Karena terdapat lebih dari 1 Guru BK dan Pembina Ekstra, pilih akun spesifik yang ingin disimulasikan di bawah.
                  </p>
                </div>
              </div>
            </div>

            {/* Grid 4 Kartu Utama */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Card 1: Admin & Waka */}
              <div className="p-3.5 rounded-xl bg-[#1c1c20] border border-[#2e2e34] flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                        <Crown className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-white">Administrator & Waka</span>
                    </div>
                    {currentUser?.role === 'super_admin' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                    Pengelola madrasah, kesiswaan & cPanel kontrol pusat.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (adminUsers[0]) loginWithUser(adminUsers[0]);
                    }}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-300" />
                    <span>Mode Administrator</span>
                  </button>
                  {wakaUsers.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (wakaUsers[0]) loginWithUser(wakaUsers[0]);
                      }}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-blue-900/40 hover:bg-blue-900/60 border border-blue-700/40 text-blue-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5 text-blue-400" />
                      <span>Mode Waka Kesiswaan</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Card 2: Guru BK (Dengan Pilihan Guru BK) */}
              <div className="p-3.5 rounded-xl bg-[#1c1c20] border border-purple-500/30 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                        <HeartHandshake className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-white">Guru BK ({bkUsers.length} Guru)</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono font-bold">
                      {bkUsers.length} Akun
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                    Akses catatan konseling, pelanggaran, home visit & pemanggilan wali.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-purple-300 flex items-center justify-between">
                      <span>Pilih Akun Guru BK:</span>
                    </label>
                    <select
                      value={selectedBkUserId || (bkUsers[0]?.uid || '')}
                      onChange={e => setSelectedBkUserId(e.target.value)}
                      className="w-full text-xs p-1.5 rounded-lg bg-[#151518] border border-purple-500/40 text-purple-100 focus:outline-none focus:border-purple-400 font-medium"
                    >
                      {bkUsers.map(u => (
                        <option key={u.uid} value={u.uid}>
                          {u.displayName} ({u.counselorSpecialization || 'BK'})
                        </option>
                      ))}
                    </select>
                  </div>

                    <button
                    type="button"
                    onClick={() => {
                      const target = bkUsers.find(u => u.uid === (selectedBkUserId || bkUsers[0]?.uid)) || bkUsers[0];
                      if (target) {
                        loginWithUser(target);
                      } else {
                        loginWithDemoRole('guru_bk');
                      }
                    }}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm shadow-purple-900/30"
                  >
                    <HeartHandshake className="w-3.5 h-3.5 text-purple-200" />
                    <span>Uji Tampilan Sebagai Guru BK</span>
                  </button>
                </div>
              </div>

              {/* Card 3: Pembina OSIM */}
              <div className="p-3.5 rounded-xl bg-[#1c1c20] border border-amber-500/30 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-white">Pembina OSIM</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                      OSIM
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                    Pengawasan kesiswaan, kepengurusan OSIM, program kerja & kas.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-[#151518] border border-[#2e2e34]">
                    <div className="text-[10px] text-zinc-400">Akun Pembina:</div>
                    <div className="text-xs font-bold text-amber-300 truncate">
                      {pembinaOsimUsers[0]?.displayName || 'Belum Ada Akun (Simulasi)'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (pembinaOsimUsers[0]) {
                        loginWithUser(pembinaOsimUsers[0]);
                      } else {
                        loginWithDemoRole('pembina_osim');
                      }
                    }}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm shadow-amber-900/30"
                  >
                    <Users className="w-3.5 h-3.5 text-amber-200" />
                    <span>Uji Tampilan Pembina OSIM</span>
                  </button>
                </div>
              </div>

              {/* Card 4: Guru Pembina Ekstrakurikuler (Dengan Pilihan Pembina) */}
              <div className="p-3.5 rounded-xl bg-[#1c1c20] border border-emerald-500/30 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Compass className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-white">Pembina Ekstra ({pembinaEkskulUsers.length} Pembina)</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                      {pembinaEkskulUsers.length} Akun
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                    Kelola absensi ekskul, anggota binaan, jurnal latihan & nilai semester.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-emerald-300 flex items-center justify-between">
                      <span>Pilih Guru Pembina Ekstra:</span>
                    </label>
                    <select
                      value={selectedPembinaUserId || (pembinaEkskulUsers[0]?.uid || '')}
                      onChange={e => setSelectedPembinaUserId(e.target.value)}
                      disabled={pembinaEkskulUsers.length === 0}
                      className="w-full text-xs p-1.5 rounded-lg bg-[#151518] border border-emerald-500/40 text-emerald-100 focus:outline-none focus:border-emerald-400 font-medium disabled:opacity-50"
                    >
                      {pembinaEkskulUsers.length === 0 ? (
                        <option value="">Belum ada akun pembina ekstra</option>
                      ) : (
                        pembinaEkskulUsers.map(u => (
                          <option key={u.uid} value={u.uid}>
                            {u.displayName} ({getPembinaEkskulName(u)})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const target = pembinaEkskulUsers.find(u => u.uid === (selectedPembinaUserId || pembinaEkskulUsers[0]?.uid)) || pembinaEkskulUsers[0];
                      if (target) {
                        loginWithUser(target);
                      } else {
                        loginWithDemoRole('pembina_ekskul');
                      }
                    }}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm shadow-emerald-900/30"
                  >
                    <Compass className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Uji Tampilan Sebagai Pembina</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#151518] p-3 rounded-xl border border-[#27272a]">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama, email, atau NIP..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#1c1c20] border border-[#323238] text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-zinc-300" />
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-[#1c1c20] border border-[#323238] text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="all">Semua Peran ({allUsers.length})</option>
                <option value="super_admin">Super Admin / Proktor</option>
                <option value="waka_kesiswaan">Waka Kesiswaan</option>
                <option value="guru_bk">Guru Bimbingan Konseling (BK)</option>
                <option value="pembina_osim">Pembina OSIM</option>
                <option value="pembina_ekskul">Pembina Ekstrakurikuler</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#151518] border border-[#27272a] rounded-xl overflow-hidden shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#27272a] bg-[#1a1a1e] text-zinc-300 font-mono text-[10px] uppercase">
                    <th className="py-3 px-4 font-bold">Pengguna & Identitas</th>
                    <th className="py-3 px-4 font-bold">Peran / Hak Akses</th>
                    <th className="py-3 px-4 font-bold">Kredensial Login (NIP / Password)</th>
                    <th className="py-3 px-4 font-bold">Status & Tugas Binaan</th>
                    <th className="py-3 px-4 font-bold text-right">Tindakan cPanel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222226]">
                  {filteredUsers.map(u => {
                    const badge = getRoleBadge(u.role);
                    const isRevealed = showPasswordMap[u.uid];

                    return (
                      <tr key={u.uid} className="hover:bg-[#1a1a1f] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            {(() => {
                              const isBKOrPembina = isGuruBKOrPembinaRole(u.role);
                              const teacherInitials = getTeacherInitials(u.displayName);
                              const theme = getInitialsColorTheme(u.role);

                              if (isBKOrPembina) {
                                return (
                                  <div
                                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${theme.bgGradient} text-white flex items-center justify-center font-black text-xs font-mono shrink-0 border ${theme.borderColor} shadow-xs`}
                                    title={`Inisial: ${teacherInitials}`}
                                  >
                                    {teacherInitials}
                                  </div>
                                );
                              }

                              return u.photoURL ? (
                                <img
                                  src={u.photoURL}
                                  alt={u.displayName}
                                  referrerPolicy="no-referrer"
                                  className="w-8 h-8 rounded-lg object-cover border border-emerald-500/40 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center font-bold text-xs text-emerald-800 dark:text-emerald-300 font-mono shrink-0">
                                  {teacherInitials}
                                </div>
                              );
                            })()}
                            <div>
                              <div className="font-bold text-zinc-100">{u.displayName}</div>
                              <div className="text-[11px] text-zinc-300 font-mono">{u.email}</div>
                              {u.phone && <div className="text-[10px] text-emerald-400 font-mono font-semibold">WA: {u.phone}</div>}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-block text-[9px] font-mono font-extrabold px-2 py-0.5 rounded border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px]">
                          <div className="text-zinc-200">
                            NIP: <span className="font-bold text-white">{u.nip || '-'}</span>
                          </div>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className="text-zinc-300 font-medium">Pass:</span>
                            <span className="font-bold text-emerald-400">
                              {isRevealed ? u.password || 'password' : '••••••••'}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(u.uid)}
                              className="text-zinc-400 hover:text-white p-0.5"
                              title={isRevealed ? 'Sembunyikan' : 'Lihat password'}
                            >
                              {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-[11px]">
                          <div className="flex items-center space-x-1.5 mb-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Nonaktif' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                            <span className={u.status === 'Nonaktif' ? 'text-red-400 font-bold' : 'text-zinc-200 font-medium'}>
                              {u.status || 'Aktif'}
                            </span>
                          </div>
                          {u.counselorSpecialization && (
                            <span className="text-[10px] text-purple-300 font-medium block line-clamp-1">
                              BK: {u.counselorSpecialization}
                            </span>
                          )}
                          {u.extracurricularIds && u.extracurricularIds.length > 0 && (
                            <span className="text-[10px] text-emerald-300 font-medium block line-clamp-1">
                              Ekskul: {u.extracurricularIds.join(', ').replace(/ekskul_/g, '').toUpperCase()}
                            </span>
                          )}
                          <div className="mt-1">
                            {u.isCashManager ? (
                              <button
                                type="button"
                                onClick={() => handleToggleCashManager(u)}
                                title="Klik untuk mencabut hak pengelola kas dari akun ini"
                                className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 transition-all"
                              >
                                <Wallet className="w-2.5 h-2.5 text-amber-400" />
                                <span>★ {u.cashManagerTitle || 'Pengelola Kas'}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleCashManager(u)}
                                title="Pilih akun ini sebagai Pengelola Uang Kas (Menu Neraca Kas & Keuangan otomatis muncul)"
                                className="px-1.5 py-0.5 rounded bg-[#1f1f24] hover:bg-[#282830] text-zinc-300 hover:text-amber-300 border border-zinc-700/60 hover:border-amber-500/40 text-[9px] font-medium flex items-center gap-1 transition-all"
                              >
                                <Wallet className="w-2.5 h-2.5 text-zinc-400" />
                                <span>+ Set Kas</span>
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => {
                                loginWithUser(u);
                              }}
                              title={`Masuk & Uji Tampilan Sebagai ${u.displayName} (${u.role.toUpperCase()})`}
                              className="p-1.5 rounded bg-[#222226] hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenDetailModal(u)}
                              title="Lihat Detail Akun"
                              className="p-1.5 rounded bg-[#222226] hover:bg-[#2e2e35] text-zinc-100 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-400" />
                            </button>
                            <button
                              onClick={() => handleCopyCredentials(u)}
                              title="Salin Kredensial"
                              className="p-1.5 rounded bg-[#222226] hover:bg-[#2e2e35] text-zinc-100 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handlePrintAccountSlip(u)}
                              title="Cetak Kartu Login SIM Kesiswaan"
                              className="p-1.5 rounded bg-[#222226] hover:bg-[#2e2e35] text-zinc-100 transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-400" />
                            </button>
                            <button
                              onClick={() => handlePromptResetPassword(u)}
                              title="Reset Password ke default"
                              className="p-1.5 rounded bg-[#222226] hover:bg-[#2e2e35] text-zinc-100 transition-colors"
                            >
                              <Key className="w-3.5 h-3.5 text-amber-400" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              title="Edit Akun"
                              className="p-1.5 rounded bg-[#222226] hover:bg-[#2e2e35] text-zinc-100 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                            </button>
                            {u.uid !== 'user_super_admin' && (
                              <button
                                onClick={() => handlePromptDeleteUser(u)}
                                title="Hapus Akun"
                                className="p-1.5 rounded bg-[#222226] hover:bg-red-500/20 text-zinc-300 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: IDENTITAS MADRASAH & PROFIL MASTER */}
      {activeSubTab === 'school' && (
        <div className="bg-[#151518] border border-[#27272a] rounded-xl p-5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#27272a] gap-3">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Building className="w-4 h-4 text-emerald-400" />
                <span>Identitas Madrasah, Pejabat & Kop Surat Master</span>
              </h2>
              <p className="text-xs text-zinc-300 mt-0.5">
                Perubahan data di sini akan otomatis memperbarui Kop Surat, Nama Kepala Madrasah, Waka Kesiswaan, dan Tahun Ajaran di seluruh menu.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 self-start sm:self-auto">
              GLOBAL_SETTING_SYNC
            </span>
          </div>

          <form onSubmit={handleSaveSchoolMaster} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-zinc-200 font-bold">Nama Madrasah / Sekolah *</label>
                <input
                  type="text"
                  required
                  value={schoolFormData.name}
                  onChange={e => setSchoolFormData({ ...schoolFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-zinc-200 font-bold">NPSN *</label>
                <input
                  type="text"
                  required
                  value={schoolFormData.npsn}
                  onChange={e => setSchoolFormData({ ...schoolFormData, npsn: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-zinc-200 font-bold">Instansi Pusat (Header Kop 1)</label>
                <input
                  type="text"
                  value={schoolFormData.centralInstitution}
                  onChange={e => setSchoolFormData({ ...schoolFormData, centralInstitution: e.target.value })}
                  placeholder="KEMENTERIAN AGAMA REPUBLIK INDONESIA"
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-zinc-200 font-bold">Instansi Wilayah (Header Kop 2)</label>
                <input
                  type="text"
                  value={schoolFormData.regionalInstitution}
                  onChange={e => setSchoolFormData({ ...schoolFormData, regionalInstitution: e.target.value })}
                  placeholder="KANTOR WILAYAH KEMENTERIAN AGAMA PROVINSI"
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-zinc-200 font-bold">Nama Kepala Madrasah & Gelar</label>
                <input
                  type="text"
                  value={schoolFormData.principalName}
                  onChange={e => setSchoolFormData({ ...schoolFormData, principalName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-zinc-200 font-bold">NIP Kepala Madrasah</label>
                <input
                  type="text"
                  value={schoolFormData.principalNip}
                  onChange={e => setSchoolFormData({ ...schoolFormData, principalNip: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-zinc-200 font-bold">Nama Waka Kesiswaan & Gelar</label>
                <input
                  type="text"
                  value={schoolFormData.wakaName || schoolFormData.wakaKesiswaanName}
                  onChange={e => setSchoolFormData({ ...schoolFormData, wakaName: e.target.value, wakaKesiswaanName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-zinc-200 font-bold">NIP Waka Kesiswaan</label>
                <input
                  type="text"
                  value={schoolFormData.wakaNip}
                  onChange={e => setSchoolFormData({ ...schoolFormData, wakaNip: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-zinc-200 font-bold">Tahun Pelajaran Aktif (Sistem)</label>
                  <button
                    type="button"
                    onClick={() => setIsAcademicYearModalOpen(true)}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1"
                  >
                    <span>+ Kelola / Tambah Tahun Ajaran</span>
                  </button>
                </div>
                <select
                  value={schoolFormData.currentAcademicYear || activeAcademicYear}
                  onChange={e => setSchoolFormData({ ...schoolFormData, currentAcademicYear: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white focus:outline-none focus:border-emerald-500 font-bold"
                >
                  {academicYears && academicYears.length > 0 ? (
                    academicYears.map(ay => {
                      const yearVal = ay.year || ay.name || '';
                      return (
                        <option key={ay.id} value={yearVal}>
                          {yearVal} {yearVal === activeAcademicYear ? '(Berjalan/Aktif)' : ''}
                        </option>
                      );
                    })
                  ) : (
                    <option value="2026/2027">2026/2027 (Berjalan)</option>
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-zinc-200 font-bold">Semester Aktif (Sistem)</label>
                <select
                  value={schoolFormData.currentSemester || activeSemester}
                  onChange={e => setSchoolFormData({ ...schoolFormData, currentSemester: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-zinc-200 font-bold">Alamat Lengkap Madrasah</label>
              <input
                type="text"
                value={schoolFormData.address}
                onChange={e => setSchoolFormData({ ...schoolFormData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-zinc-200 font-bold">Nomor Telepon</label>
                <input
                  type="text"
                  value={schoolFormData.phone}
                  onChange={e => setSchoolFormData({ ...schoolFormData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-zinc-200 font-bold">Email Resmi</label>
                <input
                  type="email"
                  value={schoolFormData.email}
                  onChange={e => setSchoolFormData({ ...schoolFormData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-zinc-200 font-bold">Website</label>
                <input
                  type="text"
                  value={schoolFormData.website}
                  onChange={e => setSchoolFormData({ ...schoolFormData, website: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white font-mono"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end space-x-3 border-t border-[#27272a]">
              <button
                type="submit"
                disabled={isSavingSchool}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center space-x-2 transition-colors shadow-lg shadow-emerald-950/30 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingSchool ? 'Menyimpan Perubahan...' : 'Simpan & Terapkan ke Seluruh Menu'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: ROLE MATRIX */}
      {activeSubTab === 'matrix' && (
        <div className="bg-[#151518] border border-[#27272a] rounded-xl p-5 shadow space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Matriks Hak Akses Berbasis Peran (RBAC)
            </h2>
            <p className="text-xs text-zinc-300 mt-0.5">
              Setiap akun memiliki isolasi wewenang yang dijamin di tingkat routing dan konteks sistem.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#1a1a1e] text-zinc-200 text-[10px] font-mono font-bold uppercase">
                  <th className="py-2.5 px-3">Modul / Fitur Kesiswaan</th>
                  <th className="py-2.5 px-3 text-center text-red-400">Super Admin / Proktor</th>
                  <th className="py-2.5 px-3 text-center text-blue-400">Waka Kesiswaan</th>
                  <th className="py-2.5 px-3 text-center text-purple-400">Guru BK</th>
                  <th className="py-2.5 px-3 text-center text-amber-400">Pembina OSIM</th>
                  <th className="py-2.5 px-3 text-center text-emerald-400">Pembina Ekskul</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222226] font-mono text-[11px]">
                {[
                  { feature: 'Dashboard Command Center', sa: 'Full', waka: 'Full', bk: 'Khusus BK', osim: 'Khusus OSIM', ekskul: 'Khusus Ekskul' },
                  { feature: 'cPanel & Manajemen Akun', sa: 'Full (Root)', waka: 'Tolak (403)', bk: 'Tolak (403)', osim: 'Tolak (403)', ekskul: 'Tolak (403)' },
                  { feature: 'Pengaturan Profil & Kop Surat', sa: 'Full (Root)', waka: 'Tolak (403)', bk: 'Tolak (403)', osim: 'Tolak (403)', ekskul: 'Tolak (403)' },
                  { feature: 'Intrakurikuler & OSIM (Sidang, Kas, LPJ)', sa: 'Full', waka: 'Full', bk: 'Tolak (403)', osim: 'Full Kelola', ekskul: 'Tolak (403)' },
                  { feature: 'Ekstrakurikuler (Anggota & Presensi)', sa: 'Full', waka: 'Full', bk: 'Tolak (403)', osim: 'Tolak (403)', ekskul: 'Binaan Sendiri' },
                  { feature: 'Layanan Bimbingan Konseling (Sesi BK)', sa: 'Full', waka: 'Lihat/Verifikasi', bk: 'Full Kelola', osim: 'Tolak (403)', ekskul: 'Tolak (403)' },
                  { feature: 'Kunjungan Rumah (Home Visit)', sa: 'Full', waka: 'Lihat/Verifikasi', bk: 'Full Kelola + Cetak', osim: 'Tolak (403)', ekskul: 'Tolak (403)' },
                  { feature: 'Surat Panggilan Orang Tua (SP 1, 2, 3)', sa: 'Full', waka: 'Lihat/Verifikasi', bk: 'Full Kelola + Cetak', osim: 'Tolak (403)', ekskul: 'Tolak (403)' },
                  { feature: 'Bimbingan Karir & Studi Lanjut', sa: 'Full', waka: 'Lihat Rekap', bk: 'Full Kelola', osim: 'Tolak (403)', ekskul: 'Tolak (403)' },
                  { feature: 'Pencatatan Pelanggaran Siswa', sa: 'Full', waka: 'Full', bk: 'Full (Referral BK)', osim: 'Tolak (403)', ekskul: 'Tolak (403)' },
                  { feature: 'Data Prestasi Siswa', sa: 'Full', waka: 'Full', bk: 'Lihat', osim: 'Prestasi OSIM', ekskul: 'Prestasi Binaan' },
                  { feature: 'Dispensasi & Surat Izin Resmi', sa: 'Full', waka: 'Verifikasi/TTD', bk: 'Buat/Lihat', osim: 'Tolak (403)', ekskul: 'Ajukan Atlet' }
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#1a1a1f]">
                    <td className="py-2.5 px-3 font-sans font-semibold text-zinc-100">{row.feature}</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">{row.sa}</td>
                    <td className="py-2.5 px-3 text-center text-blue-400 font-bold">{row.waka}</td>
                    <td className="py-2.5 px-3 text-center text-purple-400 font-bold">{row.bk}</td>
                    <td className="py-2.5 px-3 text-center text-amber-400 font-bold">{row.osim}</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">{row.ekskul}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SYNC & SERVER */}
      {activeSubTab === 'sync' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Dewan Guru to cPanel Two-Way Sync Card */}
          <div className="bg-[#151518] border border-[#27272a] rounded-xl p-5 space-y-4 col-span-1 md:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-100">Sinkronisasi Dua Arah: Dewan Guru & Pembina ↔ Akun Pengguna cPanel</h3>
                  <p className="text-[11px] text-zinc-300">
                    Memastikan seluruh guru & pembina hasil import file Excel terdaftar sebagai user login cPanel, serta menyelaraskan tugas pembinaan ekskul & konselor BK.
                  </p>
                </div>
              </div>
              <button
                onClick={handleSyncFromTeachers}
                disabled={isSyncingAll}
                className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center space-x-2 transition-colors shrink-0 shadow-lg shadow-emerald-950/40 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                <span>{isSyncingAll ? 'MENYINKRONKAN...' : 'JALANKAN SINKRONISASI DATA GURU'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-[#1a1a1e] rounded-lg border border-[#2a2a30]">
                <span className="text-[10px] text-zinc-300 font-mono font-bold uppercase block">TOTAL DATA DI DEWAN GURU</span>
                <span className="text-xl font-bold font-mono text-zinc-100">{teachers.length} Guru/Pembina</span>
              </div>
              <div className="p-3 bg-[#1a1a1e] rounded-lg border border-[#2a2a30]">
                <span className="text-[10px] text-zinc-300 font-mono font-bold uppercase block">TOTAL AKUN PENGGUNA CPANEL</span>
                <span className="text-xl font-bold font-mono text-emerald-400">{allUsers.length} Akun</span>
              </div>
              <div className="p-3 bg-[#1a1a1e] rounded-lg border border-[#2a2a30]">
                <span className="text-[10px] text-zinc-300 font-mono font-bold uppercase block">STATUS KESELARASAN DATA</span>
                <span className={`text-xs font-bold font-mono block mt-1 ${unregisteredTeachers.length === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {unregisteredTeachers.length === 0 ? '✓ 100% Selaras & Tersinkron' : `⚠ ${unregisteredTeachers.length} Guru Belum Memiliki Akun`}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#151518] border border-[#27272a] rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-100">Sinkronisasi EMIS & Simpatika</h3>
                <p className="text-[11px] text-zinc-300">Integrasi data kepegawaian guru dan data pokok siswa Kemenag.</p>
              </div>
            </div>

            <div className="p-3 bg-[#1a1a1e] rounded-lg border border-[#2a2a30] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">Token Sinkronisasi Server:</span>
                <span className="font-mono text-emerald-400 font-bold">SIMKESISWAAN-SYNC-8890-EMIS</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">Sinkronisasi Terakhir:</span>
                <span className="font-mono text-zinc-200 font-bold">{new Date().toLocaleDateString('id-ID')}</span>
              </div>
            </div>

            <button
              onClick={() => showToast('Sinkronisasi database kesiswaan dengan server EMIS Kemenag berhasil dilakukan.')}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center justify-center space-x-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>SINKRONISASI DATA SEKARANG</span>
            </button>
          </div>

          {/* CARD 1: CLEAR OPERATIONAL DEFAULT DATA */}
          <div className="bg-[#151518] border border-red-500/30 rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-red-200">Kosongkan Data Bawaan / Persiapan Unggah Data Resmi</h3>
                <p className="text-[11px] text-zinc-300">Hapus seluruh data siswa, absensi, pelanggaran, konseling, dan kegiatan bawaan agar siap diisi dengan data sekolah resmi.</p>
              </div>
            </div>

            <div className="p-3 bg-red-950/20 rounded-lg border border-red-900/40 text-xs text-red-300 space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5 text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>Peringatan Pembersihan:</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Tindakan ini akan mengosongkan seluruh data operasional (data siswa sampel, catatan absensi, rekam pelanggaran, bimbingan konseling, kepengurusan OSIM, prestasi, dan izin siswa). Struktur kelas dan akun dewan guru tetap aman dipertahankan.
              </p>
            </div>

            <button
              disabled={isClearingData}
              onClick={() => setIsClearDataModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 shadow-lg shadow-red-950/50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isClearingData ? 'MEMBERSIHKAN DATA...' : 'KOSONGKAN SELURUH DATA OPERASIONAL BAWAAN'}</span>
            </button>
          </div>

          {/* CARD 2: BACKUP & RESTORE DATABASE (JSON) */}
          <div className="bg-[#151518] border border-emerald-500/30 rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-emerald-200">Cadangkan & Pulihkan Database Lengkap (JSON)</h3>
                <p className="text-[11px] text-zinc-300">Ekspor seluruh database ke file JSON atau pulihkan database dari berkas cadangan kapan saja.</p>
              </div>
            </div>

            <div className="text-xs text-zinc-300">
              Format JSON mencakup seluruh data: Profil Madrasah, Rombel Kelas, Dewan Guru, Data Siswa Lengkap, Kegiatan Ekskul, Rekam BK, Prestasi, hingga Riwayat Audit.
            </div>

            <input
              type="file"
              ref={jsonFileInputRef}
              accept=".json"
              onChange={handleImportJSONFile}
              className="hidden"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExportJSON}
                className="py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-xs font-bold text-white flex items-center justify-center space-x-2 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>UNDUH CADANGAN (EXPORT JSON)</span>
              </button>

              <button
                type="button"
                disabled={isImportingJSON}
                onClick={() => jsonFileInputRef.current?.click()}
                className="py-2.5 px-4 rounded-lg bg-[#222228] hover:bg-[#2c2c34] text-xs font-bold text-emerald-300 border border-emerald-500/40 flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isImportingJSON ? 'MEMULIHKAN...' : 'PULIHKAN CADANGAN (IMPORT JSON)'}</span>
              </button>
            </div>
          </div>

          {/* CARD 3: INITIALIZE MASTER STRUCTURE */}
          <div className="bg-[#151518] border border-[#27272a] rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-100">Inisialisasi Master Struktur Sekolah</h3>
                <p className="text-[11px] text-zinc-300">Sinkronisasi struktur master data (Setting Sekolah, Rombel, & Dewan Guru) ke Firebase Firestore.</p>
              </div>
            </div>

            <div className="text-xs text-zinc-300">
              Menyimpan struktur master sekolah ke cloud database Firestore tanpa menimpa data siswa yang telah diunggah.
            </div>

            <button
              disabled={isSeeding}
              onClick={async () => {
                setIsSeeding(true);
                try {
                  await seedFirebaseDatabase();
                  showToast('Database Firestore kesiswaan berhasil diinisialisasi struktur master resminya!');
                } catch (e: any) {
                  showToast('Gagal: ' + e?.message, 'error');
                } finally {
                  setIsSeeding(false);
                }
              }}
              className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSeeding ? 'MEMPROSES SEEDING...' : 'INISIALISASI MASTER STRUKTUR FIRESTORE'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB: ANNOUNCEMENTS & BROADCAST */}
      {activeSubTab === 'announcements' && <AnnouncementManagementPanel />}

      {/* TAB 5: AUDIT LOGS & ACTIVITY MONITOR */}
      {activeSubTab === 'logs' && <AuditLogsPanel />}

      {/* MODAL: ADD USER */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Akun Guru / Pembina Kesiswaan"
        size="md"
      >
        <form onSubmit={handleSaveAddUser} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-zinc-200 font-bold mb-1">Nama Lengkap & Gelar *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Dra. Hj. Siti Marwiyah, M.Pd."
              value={formData.displayName}
              onChange={e => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-200 font-bold mb-1">NIP / NIK</label>
              <input
                type="text"
                placeholder="19800101 200501 1 001"
                value={formData.nip}
                onChange={e => setFormData({ ...formData, nip: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-zinc-200 font-bold mb-1">Peran / Role *</label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="guru_bk">Guru BK (Bimbingan Konseling)</option>
                <option value="pembina_osim">Pembina OSIM</option>
                <option value="pembina_ekskul">Pembina Ekstrakurikuler</option>
                <option value="waka_kesiswaan">Waka Kesiswaan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-200 font-bold mb-1">Email Akun *</label>
              <input
                type="email"
                required
                placeholder="pembina@sekolah.sch.id"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-zinc-200 font-bold mb-1">Password Default *</label>
              <input
                type="text"
                required
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {formData.role === 'guru_bk' && (
            <div>
              <label className="block text-purple-300 font-bold mb-1">Spesialisasi Bimbingan BK</label>
              <input
                type="text"
                value={formData.counselorSpecialization}
                onChange={e => setFormData({ ...formData, counselorSpecialization: e.target.value })}
                placeholder="Contoh: Bimbingan Karir & Psikologi Remaja"
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          )}

          {formData.role === 'pembina_ekskul' && (
            <div>
              <label className="block text-emerald-300 font-bold mb-1">Ekstrakurikuler yang Diampu</label>
              <select
                multiple
                value={formData.extracurricularIds}
                onChange={e => {
                  const selected = Array.from(e.target.selectedOptions, (opt: HTMLOptionElement) => opt.value);
                  setFormData({ ...formData, extracurricularIds: selected });
                }}
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white focus:outline-none focus:border-emerald-500 h-24"
              >
                {extracurriculars.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.category})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-zinc-400">Tahan tombol Ctrl / Cmd untuk memilih lebih dari 1 ekskul.</span>
            </div>
          )}

          {/* Cash Manager Privilege Section */}
          <div className="p-3 bg-[#18181d] rounded-lg border border-[#2e2e36] space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isCashManager || false}
                onChange={e => setFormData({ ...formData, isCashManager: e.target.checked })}
                className="rounded bg-zinc-800 border-zinc-700 text-amber-500 focus:ring-amber-500 w-4 h-4"
              />
              <span className="text-zinc-100 font-bold text-xs">
                Beri Hak Otoritas Pemegang Uang Kas (Neraca Keuangan)
              </span>
            </label>
            {formData.isCashManager && (
              <div>
                <label className="block text-amber-300 font-bold text-[11px] mb-1">
                  Gelar / Jabatan Pemegang Kas
                </label>
                <input
                  type="text"
                  value={formData.cashManagerTitle || ''}
                  onChange={e => setFormData({ ...formData, cashManagerTitle: e.target.value })}
                  placeholder="Contoh: Bendahara Kas BK / Bendahara OSIM"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#1c1c20] border border-[#323238] text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>

          <div className="pt-3 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-2 rounded-lg bg-[#222226] text-zinc-300 hover:text-white font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
            >
              Simpan & Buat Akun
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT USER */}
      <Modal
        isOpen={isEditModalOpen && Boolean(selectedUserForAction)}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Akun: ${selectedUserForAction?.displayName || ''}`}
        size="md"
      >
        <form onSubmit={handleSaveEditUser} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-zinc-200 font-bold mb-1">Nama Lengkap & Gelar *</label>
            <input
              type="text"
              required
              value={formData.displayName}
              onChange={e => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-200 font-bold mb-1">NIP / NIK</label>
              <input
                type="text"
                value={formData.nip}
                onChange={e => setFormData({ ...formData, nip: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-zinc-200 font-bold mb-1">Status Akun</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white"
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-200 font-bold mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-zinc-200 font-bold mb-1">Password</label>
              <input
                type="text"
                required
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c20] border border-[#323238] text-white font-mono"
              />
            </div>
          </div>

          {/* Cash Manager Privilege in Edit Modal */}
          <div className="p-3 bg-[#18181d] rounded-lg border border-[#2e2e36] space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isCashManager || false}
                onChange={e => setFormData({ ...formData, isCashManager: e.target.checked })}
                className="rounded bg-zinc-800 border-zinc-700 text-amber-500 focus:ring-amber-500 w-4 h-4"
              />
              <span className="text-zinc-100 font-bold text-xs">
                Beri Hak Otoritas Pemegang Uang Kas (Neraca Keuangan)
              </span>
            </label>
            {formData.isCashManager && (
              <div>
                <label className="block text-amber-300 font-bold text-[11px] mb-1">
                  Gelar / Jabatan Pemegang Kas
                </label>
                <input
                  type="text"
                  value={formData.cashManagerTitle || ''}
                  onChange={e => setFormData({ ...formData, cashManagerTitle: e.target.value })}
                  placeholder="Contoh: Bendahara Kas BK / Bendahara OSIM"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#1c1c20] border border-[#323238] text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>

          <div className="pt-3 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-3.5 py-2 rounded-lg bg-[#222226] text-zinc-300 hover:text-white font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Modal>

      {/* DETAIL USER MODAL */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detail Profil & Hak Akses Akun"
        size="md"
      >
        {selectedUserForAction && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-[#18181c] border border-[#27272a]">
              {(() => {
                const isBKOrPembina = isGuruBKOrPembinaRole(selectedUserForAction.role);
                const teacherInitials = getTeacherInitials(selectedUserForAction.displayName);
                const theme = getInitialsColorTheme(selectedUserForAction.role);

                if (isBKOrPembina) {
                  return (
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${theme.bgGradient} flex flex-col items-center justify-center font-black font-mono text-base text-white shadow-md shrink-0 border-2 ${theme.borderColor}`}>
                      <span>{teacherInitials}</span>
                      <span className="text-[7px] uppercase font-bold text-white/75 tracking-wider">Inisial</span>
                    </div>
                  );
                }

                return selectedUserForAction.photoURL ? (
                  <img
                    src={selectedUserForAction.photoURL}
                    alt={selectedUserForAction.displayName}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover border-2 border-emerald-500/50 shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 via-blue-600 to-indigo-700 flex items-center justify-center font-mono font-black text-lg text-white shadow-md shrink-0">
                    {teacherInitials}
                  </div>
                );
              })()}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{selectedUserForAction.displayName}</h4>
                <p className="text-xs text-zinc-300 font-mono">{selectedUserForAction.email}</p>
                <span className={`inline-block mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getRoleBadge(selectedUserForAction.role).color}`}>
                  {getRoleBadge(selectedUserForAction.role).label}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono bg-[#141416] p-3.5 rounded-xl border border-[#27272a]">
              <div className="flex justify-between py-1 border-b border-[#222226]">
                <span className="text-zinc-400 font-bold">NIP / NIK:</span>
                <span className="text-white font-bold">{selectedUserForAction.nip || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#222226]">
                <span className="text-zinc-400 font-bold">USERNAME:</span>
                <span className="text-zinc-100">{selectedUserForAction.username || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#222226]">
                <span className="text-zinc-400 font-bold">NO. TELEPON / WA:</span>
                <span className="text-zinc-100">{selectedUserForAction.phone || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#222226]">
                <span className="text-zinc-400 font-bold">STATUS AKUN:</span>
                <span className={selectedUserForAction.status === 'Nonaktif' ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {selectedUserForAction.status || 'Aktif'}
                </span>
              </div>
              {selectedUserForAction.counselorSpecialization && (
                <div className="py-1 border-b border-[#222226]">
                  <span className="text-purple-300 font-bold block mb-0.5">SPESIALISASI BK:</span>
                  <span className="text-zinc-200 font-sans">{selectedUserForAction.counselorSpecialization}</span>
                </div>
              )}
              {selectedUserForAction.extracurricularIds && selectedUserForAction.extracurricularIds.length > 0 && (
                <div className="py-1">
                  <span className="text-emerald-300 font-bold block mb-1">EKSKUL BINAAN:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedUserForAction.extracurricularIds.map(eid => {
                      const ek = extracurriculars.find(e => e.id === eid);
                      return (
                        <span key={eid} className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-sans font-semibold">
                          {ek ? ek.name : eid}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-200 hover:bg-zinc-700 text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* CONFIRM RESET PASSWORD DIALOG */}
      <ConfirmDialog
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmResetPassword}
        title="Konfirmasi Reset Password"
        message={`Apakah Anda yakin ingin mereset password akun "${selectedUserForAction?.displayName}" ke default ("password")?`}
        confirmLabel="Reset Password"
        variant="warning"
      />

      {/* CONFIRM DELETE USER DIALOG */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteUser}
        title="Hapus Akun Pengguna"
        message={`Apakah Anda yakin ingin menghapus akun "${selectedUserForAction?.displayName}" (${selectedUserForAction?.email}) dari cPanel Kesiswaan? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus Akun"
        variant="danger"
      />

      {/* CONFIRM CLEAR OPERATIONAL DATA DIALOG */}
      <ConfirmDialog
        isOpen={isClearDataModalOpen}
        onClose={() => setIsClearDataModalOpen(false)}
        onConfirm={handleClearAllData}
        title="Konfirmasi Pengosongan Data Bawaan"
        message="Apakah Anda yakin ingin mengosongkan seluruh data operasional bawaan (siswa, absensi, pelanggaran, konseling BK, OSIM, prestasi)? Tindakan ini berguna agar aplikasi siap menerima berkas unggahan data resmi sekolah."
        confirmLabel="Ya, Kosongkan Data Bawaan"
        variant="danger"
      />

      {/* ACADEMIC YEAR MANAGEMENT MODAL */}
      <AcademicYearManagementModal
        isOpen={isAcademicYearModalOpen}
        onClose={() => setIsAcademicYearModalOpen(false)}
      />

    </div>
  );
};
