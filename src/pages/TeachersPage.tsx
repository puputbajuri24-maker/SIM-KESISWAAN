import React, { useState, useRef, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Check,
  Zap,
  Users,
  Compass,
  FileSpreadsheet,
  Award,
  Upload,
  Download,
  FileText,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Table,
  Wallet,
  Lock,
  Shield,
  HeartHandshake,
  Sparkles,
  Layers,
  CheckCheck,
  Key,
  EyeOff,
  ShieldCheck
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useCrudPermission, canResetUserPassword } from '../utils/rbacRules';
import { Teacher, UserProfile } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';
import * as XLSX from 'xlsx';
import {
  downloadTeacherTemplateXLSX,
  downloadTeacherTemplateCSV,
  parseTeacherRows,
  ParsedImportTeacher
} from '../utils/teacherTemplate';
import {
  getTeacherInitials,
  isGuruBKOrPembinaRole,
  getInitialsColorTheme
} from '../utils/initials';
import {
  getTeacherHierarchyClassification,
  sortTeachersByHierarchy,
  canonicalizeAssignedEkskulIds,
  isTeacherUserMatch
} from '../utils/syncUtils';

export const TeachersPage: React.FC = () => {
  const { isWakaOrAdmin, currentUser, allUsers, resetUserPassword, syncUsersFromTeachers } = useAuth();
  const { toast } = useToast();
  const [isSavingTeacher, setIsSavingTeacher] = useState(false);
  const canCrudTeachers = useCrudPermission('teachers', currentUser?.role, currentUser);
  const {
    teachers,
    extracurriculars,
    classes,
    schoolSetting,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    deleteTeachersBulk,
    clearAllTeachers,
    importTeachersBulk,
    harmonizeTeachersFirestore
  } = useSchool();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isClearAllTeachersOpen, setIsClearAllTeachersOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isHarmonizing, setIsHarmonizing] = useState(false);
  const [harmonizeResult, setHarmonizeResult] = useState<{ show: boolean; success: boolean; message: string } | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Bulk Selection State
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<string>>(new Set());
  const [isSyncingAccounts, setIsSyncingAccounts] = useState(false);

  // Role Pill Filter State ('all' | 'waka' | 'guru_bk' | 'pembina_osim' | 'pembina_ekskul' | 'wali_kelas' | 'dewan_guru')
  const [rolePillFilter, setRolePillFilter] = useState<'all' | 'waka' | 'guru_bk' | 'pembina_osim' | 'pembina_ekskul' | 'wali_kelas' | 'dewan_guru'>('all');

  // Import State
  const [previewTeachers, setPreviewTeachers] = useState<ParsedImportTeacher[]>([]);
  const [importFileName, setImportFileName] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('replace');
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Teacher>>({
    nip: '',
    fullName: '',
    role: 'Pembina Ekskul',
    subject: '',
    phone: '',
    email: '',
    assignedExtracurriculars: [],
    isActive: true,
    isCashManager: false,
    cashManagerTitle: 'Bendahara Kesiswaan'
  });

  // Helper: Penerjemah ID/Kode ekskul ke Nama yang mudah dibaca
  const getEkskulDisplayName = (
    item: string,
    teacherContext?: { extracurricularNames?: string[]; extracurricularName?: string } | null,
    idx?: number
  ) => {
    if (!item || /^\d+$/.test(item.trim())) return '';
    const found = extracurriculars.find(e => e.id === item || e.name.toLowerCase() === item.toLowerCase());
    if (found && !/^\d+$/.test(found.name)) return found.name;
    if (teacherContext?.extracurricularNames && idx !== undefined && teacherContext.extracurricularNames[idx]) {
      const name = teacherContext.extracurricularNames[idx];
      if (!/^\d+$/.test(name.trim())) return name;
    }
    if (teacherContext?.extracurricularName && !teacherContext.extracurricularName.startsWith('ekskul_')) {
      const name = teacherContext.extracurricularName.trim();
      if (!/^\d+$/.test(name)) return name;
    }
    if (item.startsWith('ekskul_')) {
      const clean = item.replace(/^ekskul_/, '').replace(/[_-]/g, ' ').trim();
      if (/^\d+$/.test(clean.replace(/\s+/g, ''))) {
        return '';
      }
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    }
    return '';
  };

  // Automatically open teacher detail if selected from Global Search or pending selection
  useEffect(() => {
    const processTeacherTarget = (detail: any) => {
      if (!detail) return;
      if (detail.category === 'teachers' || !detail.category || detail.tabId === 'teachers') {
        const targetId = detail.entityId || detail.rawId || detail.id;
        const targetTeacher = teachers.find(
          t =>
            t.id === targetId ||
            t.id === detail.rawId ||
            t.id === detail.id ||
            t.nip === targetId ||
            t.nip === detail.rawId ||
            (detail.title && t.fullName && t.fullName.toLowerCase().trim() === detail.title.toLowerCase().trim())
        );
        if (targetTeacher) {
          setSelectedTeacher(targetTeacher);
          setIsDetailOpen(true);
        }
      }
    };

    try {
      const pendingStr = sessionStorage.getItem('pending_search_select');
      if (pendingStr) {
        const pending = JSON.parse(pendingStr);
        if (pending && (pending.category === 'teachers' || pending.tabId === 'teachers')) {
          sessionStorage.removeItem('pending_search_select');
          setTimeout(() => {
            processTeacherTarget(pending);
          }, 50);
        }
      }
    } catch (e) {
      console.warn('Error reading pending_search_select in TeachersPage', e);
    }

    const handleSearchSelect = (event: Event) => {
      const customEvent = event as CustomEvent<{
        category: string;
        id: string;
        rawId: string;
        entityId?: string;
        title: string;
        tabId?: string;
      }>;
      const detail = customEvent.detail;
      if (detail) {
        processTeacherTarget(detail);
      }
    };

    window.addEventListener('app:search-select', handleSearchSelect);
    return () => window.removeEventListener('app:search-select', handleSearchSelect);
  }, [teachers]);

  const handleOpenAdd = () => {
    setSelectedTeacher(null);
    setFormData({
      nip: `1985${Math.floor(10000000 + Math.random() * 90000000)}`,
      fullName: '',
      role: 'Pembina Ekskul',
      subject: '',
      phone: '081234567890',
      email: '',
      assignedExtracurriculars: [],
      isActive: true,
      isCashManager: false,
      cashManagerTitle: 'Bendahara Kesiswaan'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (t: Teacher, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedTeacher(t);
    setFormData({
      ...t,
      subject: t.subject || '',
      assignedExtracurriculars: canonicalizeAssignedEkskulIds(t.assignedExtracurriculars, extracurriculars),
      isCashManager: !!t.isCashManager,
      cashManagerTitle: t.cashManagerTitle || 'Bendahara Kesiswaan'
    });
    setIsFormOpen(true);
  };

  const handleOpenDetail = (t: Teacher) => {
    setSelectedTeacher(t);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (t: Teacher, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedTeacher(t);
    setIsDeleteOpen(true);
  };

  // Toggle extracurricular assignment (stores strictly canonical ID with Set uniqueness)
  const handleToggleEkskul = (ekskulId: string) => {
    const targetEkskul = extracurriculars.find(e => e.id === ekskulId || e.name === ekskulId);
    const resolvedId = targetEkskul ? targetEkskul.id : ekskulId;
    const current = canonicalizeAssignedEkskulIds(formData.assignedExtracurriculars || [], extracurriculars);
    const isAlready = current.includes(resolvedId);
    const next = isAlready ? current.filter(id => id !== resolvedId) : [...current, resolvedId];
    setFormData({
      ...formData,
      assignedExtracurriculars: Array.from(new Set(next))
    });
  };

  // Template Download Handlers
  const handleDownloadTemplateXLSX = () => {
    downloadTeacherTemplateXLSX(extracurriculars, schoolSetting?.name);
  };

  const handleDownloadTemplateCSV = () => {
    downloadTeacherTemplateCSV(extracurriculars);
  };

  // Reset Import State
  const handleResetImport = () => {
    setPreviewTeachers([]);
    setImportFileName('');
    setImportError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // User Account Matching Helper (Read-only check for status badge)
  const findMatchingUserForTeacher = (t: Teacher): UserProfile | undefined => {
    return (allUsers || []).find(u => 
      isTeacherUserMatch(u, t) ||
      u.uid === t.id ||
      u.uid === `user_${t.id}` ||
      (t.email && u.email && u.email.toLowerCase() === t.email.toLowerCase()) ||
      (t.nip && u.nip && t.nip !== '-' && u.nip.replace(/\s+/g, '') === t.nip.replace(/\s+/g, ''))
    );
  };

  const handleQuickSyncAllTeacherAccounts = async () => {
    if (!syncUsersFromTeachers) return;
    setIsSyncingAccounts(true);
    try {
      const count = await syncUsersFromTeachers(teachers, extracurriculars);
      toast.success(`Berhasil menyinkronkan ${count} akun dewan guru ke cPanel & Firebase Auth!`);
    } catch (err: any) {
      toast.error('Gagal menyinkronkan akun guru: ' + (err?.message || 'Kesalahan sistem'));
    } finally {
      setIsSyncingAccounts(false);
    }
  };

  // Import Excel / CSV Handler with Live Preview
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = async evt => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawData = XLSX.utils.sheet_to_json(ws) as any[];

        if (!rawData || rawData.length === 0) {
          setImportError('File kosong atau tidak berisi baris data guru yang dapat dibaca.');
          setPreviewTeachers([]);
          return;
        }

        const parsed = parseTeacherRows(rawData, extracurriculars);
        setPreviewTeachers(parsed);
      } catch (err) {
        console.error('Error import excel guru:', err);
        setImportError('Gagal membaca format file. Pastikan file berformat Excel (.xlsx/.xls) atau CSV (.csv).');
        setPreviewTeachers([]);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Confirm and Bulk Save Teachers
  const handleConfirmImport = async () => {
    const validTeachers = previewTeachers.filter(t => t.isValid);
    if (validTeachers.length === 0) {
      toast.warning('Tidak ada baris data guru/pembina yang valid untuk diimpor. Periksa kembali nama lengkap dan jabatan.');
      return;
    }

    setIsImporting(true);
    try {
      const cleanTeachers = validTeachers.map(({ isValid, errors, ...rest }) => rest);
      const count = await importTeachersBulk(cleanTeachers, importMode);
      toast.success(`Berhasil mengimpor ${count} data guru & pembina ke database!`);
      handleResetImport();
      setIsImportOpen(false);
    } catch (e: any) {
      console.error('Error bulk saving teachers:', e);
      toast.error('Terjadi kendala saat menyimpan data guru. Silakan coba lagi.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.role) {
      toast.warning('Mohon lengkapi nama guru dan jabatan.');
      return;
    }

    setIsSavingTeacher(true);
    try {
      const cleanAssigned = canonicalizeAssignedEkskulIds(formData.assignedExtracurriculars, extracurriculars);
      if (selectedTeacher) {
        await updateTeacher(selectedTeacher.id, {
          ...formData,
          assignedExtracurriculars: cleanAssigned,
          isCashManager: formData.isCashManager,
          cashManagerTitle: formData.isCashManager ? (formData.cashManagerTitle || 'Bendahara Kesiswaan') : undefined
        });
        toast.success(`Data guru "${formData.fullName}" berhasil diperbarui!`);
      } else {
        await addTeacher({
          nip: formData.nip || '-',
          fullName: formData.fullName!,
          role: formData.role!,
          subject: formData.subject || '',
          phone: formData.phone || '',
          email: formData.email || '',
          assignedExtracurriculars: cleanAssigned,
          isActive: formData.isActive !== false,
          isCashManager: formData.isCashManager,
          cashManagerTitle: formData.isCashManager ? (formData.cashManagerTitle || 'Bendahara Kesiswaan') : undefined
        });
        toast.success(`Profil guru "${formData.fullName}" berhasil disimpan! Akun login berstatus belum aktif dan siap diaktifkan melalui menu CPanel.`);
      }
      setIsFormOpen(false);
      setSelectedTeacher(null);
    } catch (err: any) {
      console.error('Error saving teacher:', err);
      toast.error('Gagal menyimpan data guru: ' + (err?.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsSavingTeacher(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedTeacher) {
      try {
        await deleteTeacher(selectedTeacher.id);
      } catch (err) {
        console.error('Error deleting teacher:', err);
      } finally {
        setIsDeleteOpen(false);
        setSelectedTeacher(null);
      }
    }
  };

  const handleHarmonizeFirestore = async () => {
    setIsHarmonizing(true);
    try {
      const res = await harmonizeTeachersFirestore();
      setHarmonizeResult({ show: true, success: res.success, message: res.message });
      setTimeout(() => {
        setHarmonizeResult(null);
      }, 6000);
    } catch (err: any) {
      setHarmonizeResult({ show: true, success: false, message: err?.message || 'Gagal merapikan database' });
    } finally {
      setIsHarmonizing(false);
    }
  };

  // Bulk Selection Handlers
  const handleToggleSelectTeacher = (id: string) => {
    setSelectedTeacherIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAllTeachers = (items: Teacher[]) => {
    if (items.length === 0) {
      setSelectedTeacherIds(new Set());
      return;
    }
    const allSelected = items.every(t => selectedTeacherIds.has(t.id));
    if (allSelected) {
      setSelectedTeacherIds(prev => {
        const next = new Set(prev);
        items.forEach(t => next.delete(t.id));
        return next;
      });
    } else {
      setSelectedTeacherIds(prev => {
        const next = new Set(prev);
        items.forEach(t => next.add(t.id));
        return next;
      });
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedTeacherIds.size === 0) return;
    try {
      await deleteTeachersBulk(Array.from(selectedTeacherIds));
      setSelectedTeacherIds(new Set());
      setIsBulkDeleteOpen(false);
    } catch (err) {
      console.error('Error bulk deleting teachers:', err);
    }
  };

  // Role Counts for Pills
  const roleCounts = React.useMemo(() => {
    const counts = {
      all: teachers.length,
      waka: 0,
      guru_bk: 0,
      pembina_osim: 0,
      pembina_ekskul: 0,
      wali_kelas: 0,
      dewan_guru: 0
    };
    teachers.forEach(t => {
      const cls = getTeacherHierarchyClassification(t);
      if (counts[cls.categoryKey] !== undefined) {
        counts[cls.categoryKey]++;
      }
    });
    return counts;
  }, [teachers]);

  // Hierarchically sorted and filtered teachers list
  const filteredAndSortedTeachers = React.useMemo(() => {
    const sorted = sortTeachersByHierarchy(teachers);
    if (rolePillFilter === 'all') return sorted;
    return sorted.filter(t => {
      const cls = getTeacherHierarchyClassification(t);
      return cls.categoryKey === rolePillFilter;
    });
  }, [teachers, rolePillFilter]);

  const columns: Column<Teacher>[] = [
    {
      header: 'Nama Guru / Pembina',
      accessorKey: 'fullName',
      sortable: true,
      cell: t => {
        const isBKOrPembina = isGuruBKOrPembinaRole(t.role);
        const teacherInitials = getTeacherInitials(t.fullName);
        const theme = getInitialsColorTheme(t.role);
        const hierarchy = getTeacherHierarchyClassification(t);

        return (
          <div className="flex items-center gap-3">
            {isBKOrPembina ? (
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${theme.bgGradient} text-white font-black font-mono flex items-center justify-center text-[11px] shrink-0 shadow-xs border ${theme.borderColor}`}
                title={`Inisial Guru: ${teacherInitials}`}
              >
                {teacherInitials}
              </div>
            ) : (t.photoUrl || t.photoURL) ? (
              <img
                src={t.photoUrl || t.photoURL}
                alt={t.fullName}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover border border-indigo-400 dark:border-indigo-600 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold font-mono flex items-center justify-center text-[11px] shrink-0 border border-indigo-200 dark:border-indigo-800">
                {teacherInitials}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className="font-mono text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  title={`Hirarki Keanggotaan: Peringkat ${hierarchy.rank} (${hierarchy.categoryLabel})`}
                >
                  #{hierarchy.rank}
                </span>
                {t.id && (
                  <span
                    className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80"
                    title={`ID Dokumen Firestore Kolom 2: ${t.id}`}
                  >
                    {t.id}
                  </span>
                )}
                {t.code && (
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700">
                    {t.code}
                  </span>
                )}
                <p className="font-bold text-slate-900 dark:text-slate-100">{t.fullName}</p>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">NIP: {t.nip || '-'}</p>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Jabatan / Peran',
      accessorKey: 'role',
      sortable: true,
      cell: t => {
        const hierarchy = getTeacherHierarchyClassification(t);
        const getBadgeStyle = () => {
          switch (hierarchy.categoryKey) {
            case 'waka':
              return 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-200 border-blue-200 dark:border-blue-800';
            case 'guru_bk':
              return 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-200 border-purple-200 dark:border-purple-800';
            case 'pembina_osim':
              return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-200 border-amber-200 dark:border-amber-800';
            case 'pembina_ekskul':
              return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800';
            case 'wali_kelas':
              return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800';
            default:
              return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
          }
        };

        return (
          <div className="flex flex-col gap-1 items-start">
            <span className={`px-2.5 py-1 rounded-lg font-bold text-xs border ${getBadgeStyle()}`}>
              {t.role}
            </span>
            {t.isCashManager && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-300 dark:border-amber-800">
                <Wallet className="w-3 h-3 text-amber-500" />
                <span>★ {t.cashManagerTitle || 'Pengelola Kas'}</span>
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Kontak & WhatsApp',
      accessorKey: 'phone',
      cell: t => (
        <div className="text-xs">
          <p className="text-slate-800 dark:text-slate-200 font-semibold">📞 {t.phone || '-'}</p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">✉️ {t.email || '-'}</p>
        </div>
      )
    },
    {
      header: 'Binaan Ekstrakurikuler',
      cell: t => {
        const seenNames = new Set<string>();
        const uniqueEkskuls: string[] = [];
        if (t.assignedExtracurriculars && t.assignedExtracurriculars.length > 0) {
          t.assignedExtracurriculars.forEach((e, idx) => {
            const name = getEkskulDisplayName(e, t, idx);
            if (name) {
              const lower = name.toLowerCase().trim();
              if (
                !seenNames.has(lower) && 
                lower !== 'ekskul' && 
                !lower.includes('admin') && 
                lower !== 'ekskul_admin_super' && 
                lower !== 'ekskul_osim_mpk' &&
                lower !== 'pembina osim' &&
                lower !== 'pembina_osim'
              ) {
                seenNames.add(lower);
                uniqueEkskuls.push(name.trim());
              }
            }
          });
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {uniqueEkskuls.length > 0 ? (
              uniqueEkskuls.map((name, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold">
                  {name}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-slate-500 dark:text-slate-400">-</span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Akun Login (CPanel)',
      cell: t => {
        const matched = findMatchingUserForTeacher(t);
        const isLoginActive = Boolean(
          (t.isLoginActive === true || t.accountStatus === 'active') ||
          (matched && matched.isLoginActive !== false && matched.loginStatus !== 'pending_activation' && matched.status === 'Aktif')
        );

        return isLoginActive ? (
          <div className="flex flex-col gap-0.5">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-bold w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Akun Login Aktif</span>
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[130px]" title={matched?.email || matched?.username || t.email}>
              @{matched?.username || matched?.email?.split('@')[0] || t.email?.split('@')[0]}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[10px] font-bold w-fit" title="Akun login belum diaktifkan. Klik menu CPanel untuk mengaktifkan akun guru ini.">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Akun Belum Aktif</span>
            </span>
            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">Aktifkan di CPanel</span>
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      sortable: true,
      cell: t => (
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
          t.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
        }`}>
          {t.isActive ? 'Aktif' : 'Nonaktif'}
        </span>
      )
    },
    {
      header: 'Aksi',
      className: 'text-right',
      cell: t => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => handleOpenDetail(t)}
            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-400 transition-colors"
            title="Lihat Detail Profil & Binaan"
          >
            <Eye className="w-4 h-4" />
          </button>
          {canCrudTeachers && (
            <>
              <button
                onClick={e => handleOpenEdit(t, e)}
                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:hover:bg-amber-900 dark:text-amber-400 transition-colors"
                title="Edit Data Guru"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={e => handleOpenDelete(t, e)}
                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-400 transition-colors"
                title="Hapus Guru / Pembina"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Dewan Guru & Pembina Kesiswaan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Daftar guru pembina ekstrakurikuler, konselor BK, tim ketertiban, dan staf kesiswaan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportActions
            filename="daftar_guru_pembina"
            title="Daftar Guru Pembina Kesiswaan"
            data={filteredAndSortedTeachers}
            headers={[
              { header: 'Nama Guru', key: 'fullName' },
              { header: 'NIP', key: 'nip' },
              { header: 'Jabatan / Peran', key: 'role' },
              { header: 'Telepon', key: 'phone' },
              { header: 'Email', key: 'email' }
            ]}
          />

          {canCrudTeachers && (
            <>
              <button
                onClick={handleDownloadTemplateXLSX}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                title="Unduh Template Excel resmi untuk import data guru & pembina"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Template Excel</span>
              </button>

              <button
                onClick={() => {
                  handleResetImport();
                  setIsImportOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Import Excel</span>
              </button>

              {isWakaOrAdmin && teachers.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleQuickSyncAllTeacherAccounts}
                    disabled={isSyncingAccounts}
                    className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-700/80 hover:border-blue-400 text-blue-900 dark:text-blue-200 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
                    title="Fase 3: Sinkronkan seluruh akun dewan guru ke cPanel & Firebase Auth secara serentak"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${isSyncingAccounts ? 'animate-spin' : ''}`} />
                    <span>{isSyncingAccounts ? 'Menyinkronkan...' : 'Sinkron Akun Login'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleHarmonizeFirestore}
                    disabled={isHarmonizing}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-300 dark:border-amber-700/80 hover:border-amber-400 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
                    title="Tahap 3: Harmonisasi ID Dokumen Firestore (guru_01, guru_02...), merapikan seluruh field data, dan sinkronisasi ke koleksi users"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-amber-600 dark:text-amber-400 ${isHarmonizing ? 'animate-spin' : ''}`} />
                    <span>{isHarmonizing ? 'Merapikan...' : 'Harmonisasi Database'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsClearAllTeachersOpen(true)}
                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-800 transition-colors"
                    title="Kosongkan semua data guru master untuk upload data dewan guru fresh"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reset Guru</span>
                  </button>
                </>
              )}

              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Guru / Pembina</span>
              </button>
            </>
          )}
        </div>
      </div>

      {harmonizeResult && (
        <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-200 ${
          harmonizeResult.success 
            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' 
            : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="font-semibold">{harmonizeResult.message}</p>
          </div>
          <button 
            type="button"
            onClick={() => setHarmonizeResult(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            ✕ Tutup
          </button>
        </div>
      )}

      {!canCrudTeachers && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                CRUD Data Guru Pembina Terpusat di cPanel
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Operasi Tambah, Edit, Hapus, dan Import Guru dibatasi terpusat pada cPanel Kesiswaan, kecuali Admin memberikan izin pada Matriks Hak Akses Peran.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Role Filter Pills (Standard 6-Rank Classification) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <button
          type="button"
          onClick={() => setRolePillFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            rolePillFilter === 'all'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Semua Guru & Pembina (1-6)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${rolePillFilter === 'all' ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
            {roleCounts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setRolePillFilter('waka')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            rolePillFilter === 'waka'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
              : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>1. Waka Kesiswaan</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${rolePillFilter === 'waka' ? 'bg-blue-800 text-blue-100' : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'}`}>
            {roleCounts.waka}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setRolePillFilter('guru_bk')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            rolePillFilter === 'guru_bk'
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
              : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/60'
          }`}
        >
          <HeartHandshake className="w-3.5 h-3.5" />
          <span>2. Guru BK</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${rolePillFilter === 'guru_bk' ? 'bg-purple-800 text-purple-100' : 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300'}`}>
            {roleCounts.guru_bk}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setRolePillFilter('pembina_osim')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            rolePillFilter === 'pembina_osim'
              ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
              : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>3. Pembina OSIM</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${rolePillFilter === 'pembina_osim' ? 'bg-amber-800 text-amber-100' : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'}`}>
            {roleCounts.pembina_osim}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setRolePillFilter('pembina_ekskul')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            rolePillFilter === 'pembina_ekskul'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
              : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>4. Pembina Ekskul</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${rolePillFilter === 'pembina_ekskul' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'}`}>
            {roleCounts.pembina_ekskul}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setRolePillFilter('wali_kelas')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            rolePillFilter === 'wali_kelas'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>5. Wali Kelas</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${rolePillFilter === 'wali_kelas' ? 'bg-indigo-800 text-indigo-100' : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'}`}>
            {roleCounts.wali_kelas}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setRolePillFilter('dewan_guru')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            rolePillFilter === 'dewan_guru'
              ? 'bg-slate-700 text-white shadow-sm shadow-slate-700/30'
              : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>6. Guru & Staf</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${rolePillFilter === 'dewan_guru' ? 'bg-slate-900 text-slate-100' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
            {roleCounts.dewan_guru}
          </span>
        </button>
      </div>

      {teachers.length === 0 && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/60 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Database Dewan Guru & Pembina Belum Memiliki Data</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg mx-auto mt-1">
              Koleksi guru di Firestore saat ini kosong. Anda dapat menambahkan data guru baru atau mengimpor data master agar otomatis tersimpan permanen di Cloud Firestore.
            </p>
          </div>
          {canCrudTeachers && (
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Guru Pertama</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <DataTable
        id="teachers-table"
        data={filteredAndSortedTeachers}
        columns={columns}
        searchPlaceholder="Cari nama guru, NIP, atau ekstrakurikuler binaan..."
        searchableKeys={['fullName', 'nip', 'role', 'phone', 'email']}
        onRowClick={handleOpenDetail}
        selectable={canCrudTeachers}
        selectedIds={selectedTeacherIds}
        onToggleSelect={handleToggleSelectTeacher}
        onToggleSelectAll={handleToggleSelectAllTeachers}
        batchActions={canCrudTeachers ? (ids) => (
          <button
            type="button"
            onClick={() => setIsBulkDeleteOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus {ids.length} Guru Terpilih</span>
          </button>
        ) : undefined}
      />

      {/* Form Modal: Master Data Guru & Pembina (Tampilan Identik Tangkapan Layar tanpa Username & Password) */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedTeacher ? 'EDIT DATA GURU & PEMBINA' : 'TAMBAH GURU & PEMBINA BARU'}
        subtitle="Data Pokok Kepegawaian & Penugasan Kesiswaan (Tersinkronisasi Otomatis ke CPanel)"
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-amber-100 transition"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSavingTeacher}
              onClick={handleSave}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 flex items-center gap-2 transition-all hover:scale-105 ${
                isSavingTeacher ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isSavingTeacher ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{selectedTeacher ? 'Simpan Perubahan Guru' : 'Simpan & Daftarkan Guru'}</span>
                </>
              )}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-4 py-1 text-xs">
          {/* 1. Pilih Hak Akses / Peran Guru (Kartu Interaktif sesuai screenshot) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Pilih Hak Akses / Peran Akun *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                {
                  role: 'Guru BK',
                  title: 'Guru BK',
                  subtitle: 'Bimbingan & Konseling',
                  color: 'text-purple-600 dark:text-purple-400'
                },
                {
                  role: 'Pembina OSIM',
                  title: 'Pembina OSIM',
                  subtitle: 'Organisasi Siswa',
                  color: 'text-amber-600 dark:text-amber-400'
                },
                {
                  role: 'Pembina Ekskul',
                  title: 'Pembina Ekskul',
                  subtitle: 'Ekstrakurikuler',
                  color: 'text-emerald-600 dark:text-emerald-400'
                },
                {
                  role: 'Wali Kelas',
                  title: 'Wali Kelas',
                  subtitle: 'Pengampu Rombel',
                  color: 'text-cyan-600 dark:text-cyan-400'
                },
                {
                  role: 'Waka Kesiswaan',
                  title: 'Waka Kesiswaan',
                  subtitle: 'Pimpinan Madrasah',
                  color: 'text-blue-600 dark:text-blue-400'
                },
                {
                  role: 'Guru Mata Pelajaran',
                  title: 'Guru Mapel',
                  subtitle: 'Dewan Guru',
                  color: 'text-slate-700 dark:text-slate-300'
                }
              ].map(card => {
                const isSelected = formData.role === card.role;
                return (
                  <button
                    key={card.role}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: card.role })}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <h5 className={`font-bold text-xs ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : card.color}`}>
                      {card.title}
                    </h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {card.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Grid Biodata Guru (Nama & NIP) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Lengkap & Gelar *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Contoh: Dra. Hj. Siti Marwiyah, M.Pd."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                NIP / NUPTK / NIK
              </label>
              <input
                type="text"
                value={formData.nip}
                onChange={e => setFormData({ ...formData, nip: e.target.value })}
                placeholder="NIP untuk guru atau NIS untuk siswa"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 3. Grid Kontak (Email & WhatsApp) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Akun / Kontak *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="pembina@madrasah.sch.id"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                No. WhatsApp / HP
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08123456789"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 4. Mata Pelajaran / Bidang Keahlian */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Mata Pelajaran / Bidang Keahlian
            </label>
            <input
              type="text"
              value={formData.subject || ''}
              onChange={e => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Contoh: Matematika / Pembina Pramuka / Bahasa Arab"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* 5. Ekstrakurikuler Binaan Utama (Maks. 1 Unit Binaan) */}
          <div className="p-3.5 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                Ekstrakurikuler Binaan Utama *
              </label>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {formData.assignedExtracurriculars?.length ? `${formData.assignedExtracurriculars.length} Unit Dipilih` : 'Maks. Unit Binaan'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
              Pilih unit ekstrakurikuler binaan utama untuk guru pembina ini.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1 max-h-36 overflow-y-auto">
              {extracurriculars.map(ekskul => {
                const canonicalCurrent = canonicalizeAssignedEkskulIds(formData.assignedExtracurriculars, extracurriculars);
                const isSelected = canonicalCurrent.includes(ekskul.id);
                return (
                  <button
                    key={ekskul.id}
                    type="button"
                    onClick={() => handleToggleEkskul(ekskul.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                    }`}
                  >
                    <span>{ekskul.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Checkbox Otoritas Pengelola Kas (Neraca Keuangan) */}
          <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={!!formData.isCashManager}
                onChange={e => setFormData({ ...formData, isCashManager: e.target.checked })}
                className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
              />
              <Wallet className="w-3.5 h-3.5 text-amber-600" />
              <span>Beri Hak Otoritas Pengelola Uang Kas (Neraca Keuangan)</span>
            </label>
            {formData.isCashManager && (
              <div className="pt-1.5 pl-6">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Jabatan / Label Amanah Kas:
                </label>
                <input
                  type="text"
                  value={formData.cashManagerTitle || ''}
                  onChange={e => setFormData({ ...formData, cashManagerTitle: e.target.value })}
                  placeholder="Contoh: Bendahara Kesiswaan / Bendahara OSIM"
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-slate-800 dark:text-slate-100"
                />
              </div>
            )}
          </div>

          {/* 7. Checkbox Pembina Aktif Mengajar */}
          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              id="isActiveTeacher"
              checked={formData.isActive}
              onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <label htmlFor="isActiveTeacher" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Status Pembina Aktif Mengajar
            </label>
          </div>

          {/* 8. Notice: Arsitektur Satu Pintu & Hak Manajemen Login CPanel */}
          <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-blue-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Prinsip Satu Pintu (Master Data & Manajemen Akun Terpisah):</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-[10px] leading-relaxed">
              Formulir ini murni mencatat <strong>Data Pokok Profil Guru</strong>. Setelah guru disimpan, namanya akan otomatis tersinkron ke <strong>Menu CPanel</strong> sehingga Administrator dapat membuatkan Akun Login (Username & Password).
            </p>
          </div>
        </form>
      </Modal>

      {/* Enhanced Import Modal */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => {
          setIsImportOpen(false);
          handleResetImport();
        }}
        title="Import Data Guru & Pembina Massal"
        subtitle="Unduh template resmi, sesuaikan data, dan unggah file spreadsheet (.xlsx / .csv)"
        maxWidth="4xl"
        footer={
          previewTeachers.length > 0 ? (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={handleResetImport}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ← Ganti File Lain
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isImporting || previewTeachers.filter(t => t.isValid).length === 0}
                  onClick={handleConfirmImport}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-105"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan ke Database...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Simpan & Import ({previewTeachers.filter(t => t.isValid).length} Guru)
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : undefined
        }
      >
        <div className="space-y-5 py-2">
          {/* Mode Selector */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
              Pilihan Mode Penanganan Data Guru:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                importMode === 'replace'
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 text-indigo-950 dark:text-indigo-200 font-semibold shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="importTeacherMode"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-bold text-xs">Gantikan Seluruh Data Guru Lama (Clean Replace)</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    Menghapus data dewan guru dummy/lama dan menggantikannya 100% dengan data yang ada di file Excel ini.
                  </div>
                </div>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                importMode === 'append'
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 text-indigo-950 dark:text-indigo-200 font-semibold shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="importTeacherMode"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-bold text-xs">Tambahkan ke Data Guru yang Sudah Ada</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    Menggabungkan guru baru dari file tanpa menghapus data guru yang sudah terdaftar sebelumnya.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Top Step 1: Download Templates Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono text-[10px] font-bold">
                  LANGKAH 1
                </span>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Unduh Template Format Standar
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                Gunakan template resmi yang telah dilengkapi contoh data pembina, lembar petunjuk kolom, dan daftar unit ekstrakurikuler terdaftar.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadTemplateXLSX}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-105"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Download .XLSX (Excel)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTemplateCSV}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Download .CSV</span>
              </button>
            </div>
          </div>

          {/* Toggle Format Guidelines & Cheatsheet */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3 bg-slate-50 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-500" />
                <span>Petunjuk Struktur Kolom & Format Jabatan</span>
              </div>
              <span className="text-[11px] font-mono text-indigo-500">
                {showGuide ? 'Sembunyikan ▲' : 'Lihat Detail ▼'}
              </span>
            </button>

            {showGuide && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Kolom Wajib:</span>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600 dark:text-slate-300">
                      <li><strong>Nama Lengkap:</strong> Nama lengkap beserta gelar.</li>
                      <li><strong>Jabatan / Peran:</strong> Pembina Ekskul / Guru BK / Pembina OSIM / Waka Kesiswaan / Tim Ketertiban / Guru Mata Pelajaran.</li>
                    </ul>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">Kolom Opsional:</span>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600 dark:text-slate-300">
                      <li><strong>NIP / NUPTK:</strong> NIP resmi guru (bisa diisi tanda strip).</li>
                      <li><strong>Jenis Kelamin:</strong> <code>L</code> (Laki-Laki) atau <code>P</code> (Perempuan).</li>
                      <li><strong>Binaan Ekstrakurikuler:</strong> Nama ekskul (pisahkan dengan koma jika &gt; 1).</li>
                      <li><strong>No HP & Email:</strong> Kontak WhatsApp dan email aktif.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Upload or Preview */}
          {previewTeachers.length === 0 ? (
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-8 text-center transition-colors bg-white dark:bg-slate-900">
              <input
                ref={fileInputRef}
                type="file"
                id="teacher-import-input"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="teacher-import-input" className="cursor-pointer block">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Klik untuk Memilih File atau Drag & Drop ke Sini
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Mendukung file spreadsheet <strong>.xlsx</strong>, <strong>.xls</strong>, dan <strong>.csv</strong>
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                  <Table className="w-4 h-4" />
                  <span>Pilih File Excel / CSV Guru</span>
                </div>
              </label>

              {importError && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 max-w-md mx-auto">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Preview Header Summary */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate max-w-xs">
                      {importFileName || 'File Data Guru & Pembina'}
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Total baris: <strong>{previewTeachers.length} guru/pembina</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                    ✓ {previewTeachers.filter(t => t.isValid).length} Valid
                  </span>
                  {previewTeachers.filter(t => !t.isValid).length > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold">
                      ⚠ {previewTeachers.filter(t => !t.isValid).length} Bermasalah
                    </span>
                  )}
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/90 sticky top-0 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Kode</th>
                      <th className="py-2.5 px-3">NIP</th>
                      <th className="py-2.5 px-3">Nama Guru & Gelar</th>
                      <th className="py-2.5 px-3">L/P</th>
                      <th className="py-2.5 px-3">Jabatan / Mapel</th>
                      <th className="py-2.5 px-3">Ekskul Binaan</th>
                      <th className="py-2.5 px-3">Kontak & WA</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {previewTeachers.map((t, idx) => (
                      <tr
                        key={idx}
                        className={t.isValid ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40' : 'bg-rose-50/50 dark:bg-rose-950/20'}
                      >
                        <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400 font-semibold">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {t.code || '-'}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300">
                          {t.nip || '-'}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{t.fullName}</div>
                        </td>
                        <td className="py-2 px-3 font-mono">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            t.gender === 'L' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
                          }`}>
                            {t.gender || 'L'}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium text-[11px]">
                            {t.role}
                          </span>
                          {t.subject && <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">{t.subject}</div>}
                        </td>
                        <td className="py-2 px-3">
                          {t.assignedExtracurriculars && t.assignedExtracurriculars.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                              {t.assignedExtracurriculars.map((ekskul, eIdx) => (
                                <span key={eIdx} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] text-slate-700 dark:text-slate-300">
                                  {getEkskulDisplayName(ekskul, t, eIdx)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-[11px]">
                          <div className="text-slate-700 dark:text-slate-300">{t.phone || '-'}</div>
                          {t.email && <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium truncate max-w-[120px]">{t.email}</div>}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {t.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Siap</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600" title={t.errors.join(', ')}>
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>{t.errors[0]}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Detail Modal */}
      {selectedTeacher && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Profil Guru: ${selectedTeacher.fullName}`}
          subtitle={`NIP: ${selectedTeacher.nip}`}
          maxWidth="md"
          footer={
            <button
              onClick={() => setIsDetailOpen(false)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-white"
            >
              Tutup
            </button>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
              {(() => {
                const isBKOrPembina = isGuruBKOrPembinaRole(selectedTeacher.role);
                const teacherInitials = getTeacherInitials(selectedTeacher.fullName);
                const theme = getInitialsColorTheme(selectedTeacher.role);

                if (isBKOrPembina) {
                  return (
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${theme.bgGradient} text-white font-black font-mono text-xl flex flex-col items-center justify-center shrink-0 shadow-md border-2 ${theme.borderColor}`}>
                      <span>{teacherInitials}</span>
                      <span className="text-[7px] font-mono uppercase tracking-widest text-white/80">Inisial</span>
                    </div>
                  );
                }

                return (selectedTeacher.photoUrl || selectedTeacher.photoURL) ? (
                  <img
                    src={selectedTeacher.photoUrl || selectedTeacher.photoURL}
                    alt={selectedTeacher.fullName}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover border-2 border-indigo-500 shrink-0 shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold font-mono text-lg flex items-center justify-center shrink-0">
                    {teacherInitials}
                  </div>
                );
              })()}
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedTeacher.fullName}</h4>
                <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">NIP: {selectedTeacher.nip}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono font-bold text-[10px]">
                    #{getTeacherHierarchyClassification(selectedTeacher).rank} {getTeacherHierarchyClassification(selectedTeacher).categoryLabel}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold text-[10px]">
                    {selectedTeacher.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
              <p><strong>Jabatan Resmi:</strong> {selectedTeacher.role}</p>
              <p><strong>Klasifikasi Hirarki:</strong> Peringkat {getTeacherHierarchyClassification(selectedTeacher).rank} ({getTeacherHierarchyClassification(selectedTeacher).categoryLabel})</p>
              <p><strong>Nomor Telepon / WA:</strong> {selectedTeacher.phone || '-'}</p>
              <p><strong>Email:</strong> {selectedTeacher.email || '-'}</p>
              <p><strong>Status Akun:</strong> {selectedTeacher.isActive ? 'Aktif' : 'Nonaktif'}</p>
              <p><strong>Sinkronisasi Akun cPanel:</strong> <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Otomatis terhubung dengan kredensial login NIP/Email</span></p>

              {/* Kredensial & Akun Login Card */}
              {(() => {
                const matchedUser = findMatchingUserForTeacher(selectedTeacher);
                const loginUsername = matchedUser?.username || (selectedTeacher.nip && selectedTeacher.nip !== '-' ? selectedTeacher.nip : selectedTeacher.email?.split('@')[0] || '-');
                const loginEmail = matchedUser?.email || selectedTeacher.email || '-';
                return (
                  <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5 text-xs">
                        <Key className="w-3.5 h-3.5 text-blue-600" />
                        Status Akun Login (Dikelola di CPanel)
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        matchedUser
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                      }`}>
                        {matchedUser ? 'TERDAFTAR & AKTIF' : 'BELUM DIBUATKAN AKUN'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Username:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{loginUsername}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Email Login:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200 truncate block">{loginEmail}</span>
                      </div>
                    </div>
                    <div className="pt-1 border-t border-blue-100 dark:border-blue-900/40 text-[10px] text-slate-500 dark:text-slate-400">
                      ℹ️ <em>Hak manajemen akun, penentuan username, dan reset kata sandi dikelola secara terpusat oleh Super Admin melalui <strong>Menu CPanel</strong>.</em>
                    </div>
                  </div>
                );
              })()}

              <div className="mt-2">
                <p className="font-bold mb-1">Ekskul Binaan:</p>
                <div className="flex flex-wrap gap-1">
                  {(() => {
                    const seenNames = new Set<string>();
                    const uniqueNames: string[] = [];
                    selectedTeacher.assignedExtracurriculars?.forEach((e, idx) => {
                      const name = getEkskulDisplayName(e, selectedTeacher, idx);
                      if (name) {
                        const lower = name.toLowerCase().trim();
                        if (
                          !seenNames.has(lower) && 
                          lower !== 'ekskul' && 
                          !lower.includes('admin') && 
                          lower !== 'ekskul_admin_super' && 
                          lower !== 'ekskul_osim_mpk' &&
                          lower !== 'pembina osim' &&
                          lower !== 'pembina_osim'
                        ) {
                          seenNames.add(lower);
                          uniqueNames.push(name.trim());
                        }
                      }
                    });
                    if (uniqueNames.length === 0) return <span className="text-slate-400">-</span>;
                    return uniqueNames.map((name, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-semibold text-[11px]">
                        {name}
                      </span>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Data Guru / Pembina"
        message={`Apakah Anda yakin ingin menghapus data ${selectedTeacher?.fullName}?`}
        confirmText="Hapus Guru"
      />

      {/* Bulk Delete Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title={`Hapus ${selectedTeacherIds.size} Data Guru / Pembina Terpilih?`}
        message={`Apakah Anda yakin ingin menghapus ${selectedTeacherIds.size} data dewan guru terpilih? Tindakan ini akan menghapus data guru dari database lokal dan Firebase, serta mereset status pembina ekskul dan wali kelas terkait.`}
        confirmText={`Ya, Hapus ${selectedTeacherIds.size} Guru`}
        danger
      />

      {/* Clear All Teachers Dialog */}
      <ConfirmDialog
        isOpen={isClearAllTeachersOpen}
        onClose={() => setIsClearAllTeachersOpen(false)}
        onConfirm={async () => {
          await clearAllTeachers();
          setIsClearAllTeachersOpen(false);
        }}
        title="Reset & Kosongkan Seluruh Data Guru?"
        message={`Tindakan ini akan mengosongkan seluruh (${teachers.length}) data dewan guru & pembina dari sistem sehingga Anda dapat mengunggah file data guru baru yang benar-benar bersih.`}
        confirmText="Ya, Kosongkan Data Guru"
        danger
      />
    </div>
  );
};

