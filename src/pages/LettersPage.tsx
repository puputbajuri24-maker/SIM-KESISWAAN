import React, { useState, useMemo, useRef } from 'react';
import {
  Mail,
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Archive,
  XCircle,
  Printer,
  Eye,
  Edit2,
  Trash2,
  Send,
  Building,
  User,
  Users,
  Settings,
  Calendar,
  Sparkles,
  ArrowRight,
  Check,
  X,
  FileCheck,
  AlertCircle,
  HelpCircle,
  Tag,
  Hash,
  Download,
  Share2,
  ChevronRight
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  SchoolLetter,
  SchoolLetterType,
  SchoolLetterCategory,
  SchoolLetterStatus,
  Student
} from '../types';
import { SchoolLetterhead } from '../components/common/SchoolLetterhead';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';
import { getTeacherInitials, getInitialsColorTheme } from '../utils/initials';

export const LettersPage: React.FC = () => {
  const { currentUser, isSuperAdmin, isWaka, isGuruBK, isStaffTU } = useAuth();
  const { toast } = useToast();
  const {
    letters,
    letterConfigs,
    students,
    classes,
    schoolSetting,
    schoolInfo,
    activeAcademicYear,
    addSchoolLetter,
    updateSchoolLetter,
    deleteSchoolLetter,
    assignLetterNumber,
    updateLetterNumberingConfig,
    generateNextLetterNumber
  } = useSchool();

  // Tab view: 'outgoing' (Surat Keluar) | 'incoming' (Surat Masuk) | 'queue' (Antrean TU) | 'config' (Pengaturan Format)
  const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming' | 'queue' | 'config'>(() => {
    return isStaffTU ? 'queue' : 'outgoing';
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<SchoolLetter | null>(null);
  const [letterToDelete, setLetterToDelete] = useState<SchoolLetter | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Creating / Editing Letter
  const [formData, setFormData] = useState<{
    letterType: SchoolLetterType;
    category: SchoolLetterCategory;
    title: string;
    subject: string;
    sender: string;
    recipient: string;
    date: string;
    receivedDate: string;
    description: string;
    contentBody: string;
    status: SchoolLetterStatus;
    selectedStudent: Student | null;
    includeStudent: boolean;
    attachmentUrl: string;
  }>({
    letterType: 'surat_keluar',
    category: 'dispensasi',
    title: '',
    subject: '',
    sender: 'MAN 2 Seram Bagian Timur',
    recipient: '',
    date: new Date().toISOString().split('T')[0],
    receivedDate: new Date().toISOString().split('T')[0],
    description: '',
    contentBody: '',
    status: isStaffTU || isSuperAdmin || isWaka ? 'terbit_bernomor' : 'draf_menunggu_nomor',
    selectedStudent: null,
    includeStudent: true,
    attachmentUrl: ''
  });

  // State for Student Grid Selector inside Modal
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('all');

  // Config State
  const activeConfig = letterConfigs.find(c => c.id === 'default_config') || letterConfigs[0];
  const [configForm, setConfigForm] = useState({
    prefix: activeConfig?.prefix || 'B',
    schoolCode: activeConfig?.schoolCode || 'Ma.26.06',
    formatPattern: activeConfig?.formatPattern || '{PREFIX}-{NO}/{KODE_SEKOLAH}/{KLASIFIKASI}/{BULAN}/{TAHUN}',
    lastCounter: activeConfig?.lastCounter || 102,
    counterResetPeriod: activeConfig?.counterResetPeriod || 'tahunan'
  });

  // Active user permissions
  const canManageTU = Boolean(isSuperAdmin || isStaffTU || isWaka);

  // Categories metadata
  const CATEGORY_LABELS: Record<SchoolLetterCategory, { label: string; code: string; color: string }> = {
    dispensasi: { label: 'Dispensasi Kegiatan/Lomba', code: 'PP.00.6', color: 'bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700 font-extrabold' },
    keterangan_aktif: { label: 'Keterangan Aktif Belajar', code: 'PP.01.1', color: 'bg-blue-100 text-blue-950 border border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700 font-extrabold' },
    panggilan_ortu: { label: 'Panggilan Orang Tua / BK', code: 'KS.01.2', color: 'bg-rose-100 text-rose-950 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700 font-extrabold' },
    surat_tugas: { label: 'Surat Tugas / Mandat', code: 'KP.01.2', color: 'bg-purple-100 text-purple-950 border border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-700 font-extrabold' },
    undangan: { label: 'Undangan Madrasah', code: 'HM.01', color: 'bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700 font-extrabold' },
    mutasi: { label: 'Mutasi Siswa', code: 'PP.05', color: 'bg-indigo-100 text-indigo-950 border border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-700 font-extrabold' },
    rekomendasi: { label: 'Rekomendasi', code: 'PP.00', color: 'bg-cyan-100 text-cyan-950 border border-cyan-300 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-700 font-extrabold' },
    lainnya: { label: 'Umum / Lainnya', code: 'PP.00', color: 'bg-slate-200 text-slate-950 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 font-extrabold' }
  };

  // Status metadata
  const STATUS_LABELS: Record<SchoolLetterStatus, { label: string; badge: string; icon: any }> = {
    terbit_bernomor: { label: 'Resmi Bernomor', badge: 'bg-emerald-100 text-emerald-950 border-emerald-400 dark:bg-emerald-950/90 dark:text-emerald-300 dark:border-emerald-700 font-black', icon: CheckCircle2 },
    draf_menunggu_nomor: { label: 'Draf Menunggu TU', badge: 'bg-amber-100 text-amber-950 border-amber-400 dark:bg-amber-950/90 dark:text-amber-300 dark:border-amber-700 font-black', icon: Clock },
    diarsipkan: { label: 'Diarsipkan', badge: 'bg-blue-100 text-blue-950 border-blue-400 dark:bg-blue-950/90 dark:text-blue-300 dark:border-blue-700 font-black', icon: Archive },
    ditolak: { label: 'Perlu Revisi / Ditolak', badge: 'bg-rose-100 text-rose-950 border-rose-400 dark:bg-rose-950/90 dark:text-rose-300 dark:border-rose-700 font-black', icon: XCircle }
  };

  // Filtered lists
  const outgoingLetters = useMemo(() => {
    return letters.filter(l => l.letterType === 'surat_keluar');
  }, [letters]);

  const incomingLetters = useMemo(() => {
    return letters.filter(l => l.letterType === 'surat_masuk');
  }, [letters]);

  const queueLetters = useMemo(() => {
    return letters.filter(l => l.letterType === 'surat_keluar' && l.status === 'draf_menunggu_nomor');
  }, [letters]);

  const displayedLetters = useMemo(() => {
    let baseList = activeTab === 'incoming'
      ? incomingLetters
      : activeTab === 'queue'
      ? queueLetters
      : outgoingLetters;

    return baseList.filter(l => {
      // Category filter
      if (selectedCategory !== 'all' && l.category !== selectedCategory) return false;
      // Status filter
      if (selectedStatus !== 'all' && l.status !== selectedStatus) return false;
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const num = (l.letterNumber || '').toLowerCase();
        const title = (l.title || '').toLowerCase();
        const rec = (l.recipient || '').toLowerCase();
        const snd = (l.sender || '').toLowerCase();
        const sName = (l.studentName || '').toLowerCase();
        const sNis = (l.studentNis || '').toLowerCase();
        return num.includes(query) || title.includes(query) || rec.includes(query) || snd.includes(query) || sName.includes(query) || sNis.includes(query);
      }
      return true;
    });
  }, [activeTab, incomingLetters, queueLetters, outgoingLetters, selectedCategory, selectedStatus, searchQuery]);

  // Export Data for Excel / CSV Buku Agenda Persuratan
  const exportData = useMemo(() => {
    return displayedLetters.map((l, idx) => ({
      noAgenda: idx + 1,
      letterNumber: l.letterNumber || '(Menunggu Nomor TU)',
      letterType: l.letterType === 'surat_masuk' ? 'Surat Masuk' : 'Surat Keluar',
      category: l.category,
      classificationCode: l.classificationCode || '-',
      title: l.title,
      subject: l.subject,
      sender: l.sender,
      recipient: l.recipient,
      date: l.date,
      receivedDate: l.receivedDate || '-',
      status: l.status === 'terbit_bernomor' ? 'Resmi Bernomor' : l.status === 'draf_menunggu_nomor' ? 'Menunggu TU' : l.status,
      studentName: l.studentName || '-',
      studentClass: l.studentClass || '-',
      studentNis: l.studentNis || '-',
      createdBy: l.createdBy || 'Tata Usaha'
    }));
  }, [displayedLetters]);

  // Filtered students for Responsive Grid Selector
  const availableStudentsForGrid = useMemo(() => {
    return (students || []).filter(s => {
      if (!s) return false;
      if (studentClassFilter !== 'all' && s.className !== studentClassFilter && s.classId !== studentClassFilter) {
        return false;
      }
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase().trim();
        const name = (s.fullName || (s as any).name || '').toLowerCase();
        const nis = (s.nis || '').toLowerCase();
        const cls = (s.className || '').toLowerCase();
        return name.includes(q) || nis.includes(q) || cls.includes(q);
      }
      return true;
    });
  }, [students, studentClassFilter, studentSearch]);

  // Distinct classes list for pill selector
  const classPillOptions = useMemo(() => {
    const list = Array.from(new Set(students.map(s => s.className).filter(Boolean)));
    list.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    return list;
  }, [students]);

  // Reset form when opening create modal
  const handleOpenCreateModal = (type: SchoolLetterType = 'surat_keluar') => {
    setFormData({
      letterType: type,
      category: 'dispensasi',
      title: '',
      subject: '',
      sender: type === 'surat_keluar' ? 'MAN 2 Seram Bagian Timur' : '',
      recipient: type === 'surat_keluar' ? '' : 'Kepala MAN 2 Seram Bagian Timur',
      date: new Date().toISOString().split('T')[0],
      receivedDate: new Date().toISOString().split('T')[0],
      description: '',
      contentBody: '',
      status: canManageTU ? 'terbit_bernomor' : 'draf_menunggu_nomor',
      selectedStudent: null,
      includeStudent: type === 'surat_keluar',
      attachmentUrl: ''
    });
    setStudentSearch('');
    setStudentClassFilter('all');
    setIsCreateModalOpen(true);
  };

  // Submit letter creation
  const handleSaveLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.warning('Silakan isi judul atau perihal surat resmi terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const letterData: Omit<SchoolLetter, 'id' | 'createdAt' | 'updatedAt'> = {
        letterNumber: '',
        letterType: formData.letterType,
        category: formData.category,
        title: formData.title.trim(),
        subject: formData.subject.trim() || formData.title.trim(),
        sender: formData.sender.trim() || (formData.letterType === 'surat_keluar' ? 'MAN 2 Seram Bagian Timur' : 'Instansi Luar'),
        recipient: formData.recipient.trim(),
        date: formData.date || new Date().toISOString().split('T')[0],
        receivedDate: formData.letterType === 'surat_masuk' ? formData.receivedDate : undefined,
        description: formData.description.trim(),
        contentBody: formData.contentBody.trim(),
        status: formData.status,
        studentId: formData.includeStudent && formData.selectedStudent ? formData.selectedStudent.id : undefined,
        studentID: formData.includeStudent && formData.selectedStudent ? formData.selectedStudent.id : undefined,
        studentName: formData.includeStudent && formData.selectedStudent ? formData.selectedStudent.fullName : undefined,
        studentClass: formData.includeStudent && formData.selectedStudent ? formData.selectedStudent.className : undefined,
        studentNis: formData.includeStudent && formData.selectedStudent ? formData.selectedStudent.nis : undefined,
        academicYear: activeAcademicYear || '2026/2027',
        attachmentUrl: formData.attachmentUrl.trim() || undefined
      };

      const newId = await addSchoolLetter(letterData);
      setIsCreateModalOpen(false);

      if (formData.status === 'terbit_bernomor') {
        toast.success('Nomor surat dinas resmi telah diterbitkan secara otomatis oleh sistem TU.');
      } else {
        toast.success('Draf surat telah masuk ke antrean Tata Usaha untuk diterbitkan nomor resmi.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kendala saat menyimpan berkas surat ke sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Action: Staf TU assigns official number to draft
  const handleAssignNumberQuick = async (letter: SchoolLetter) => {
    try {
      const fullNum = await assignLetterNumber(letter.id, currentUser?.displayName || 'Staf Tata Usaha');
      toast.success(`Nomor resmi ${fullNum} berhasil diterbitkan untuk perihal: "${letter.title}".`);
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kendala saat menerbitkan nomor surat resmi.');
    }
  };

  // Reject / Revision request
  const handleRejectLetter = async () => {
    if (!selectedLetter) return;
    try {
      await updateSchoolLetter(selectedLetter.id, {
        status: 'ditolak',
        notes: rejectReason.trim() || 'Perlu perbaikan kelengkapan berkas oleh pemohon.',
        tuOfficerId: currentUser?.uid,
        tuOfficerName: currentUser?.displayName || 'Staf Tata Usaha'
      });
      setIsRejectModalOpen(false);
      setRejectReason('');
      setSelectedLetter(null);
      toast.info('Draf surat telah dikembalikan dengan catatan revisi.');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status surat.');
    }
  };

  // Delete confirmed
  const handleDeleteConfirm = async () => {
    if (!letterToDelete) return;
    try {
      await deleteSchoolLetter(letterToDelete.id);
      setLetterToDelete(null);
      toast.info('Dokumen surat telah dihapus dari sistem persuratan madrasah.');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus dokumen surat.');
    }
  };

  // Save config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateLetterNumberingConfig({
        id: activeConfig?.id || 'default_config',
        prefix: configForm.prefix.trim() || 'B',
        schoolCode: configForm.schoolCode.trim() || 'Ma.26.06',
        formatPattern: configForm.formatPattern.trim(),
        lastCounter: Number(configForm.lastCounter) || 100,
        counterResetPeriod: configForm.counterResetPeriod as 'tahunan' | 'bulanan'
      });
      setIsConfigModalOpen(false);
      toast.success('Format nomor surat otomatis berhasil disesuaikan dengan standar madrasah.');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan konfigurasi penomoran surat.');
    }
  };

  // Print helper
  const handlePrintDocument = () => {
    window.print();
  };

  // Format date helper in Indonesian
  const formatIndonesianDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner - Unified Light/Dark Theme Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-widest uppercase bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 shadow-2xs">
                ADMINISTRASI PERSURATAN SATU PINTU
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wider bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs">
                KEMENAG RI
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-3">
              <Mail className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Tata Usaha & Persuratan Madrasah</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm mt-1.5 max-w-2xl leading-relaxed font-medium">
              Pusat kendali nomor surat resmi, dispensasi santri, surat keterangan aktif, surat tugas, dan penomoran otomatis terintegrasi MAN 2 Seram Bagian Timur.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {canManageTU && (
              <button
                onClick={() => setIsConfigModalOpen(true)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition shadow-xs cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span>Format Nomor TU</span>
              </button>
            )}

            <button
              onClick={() => handleOpenCreateModal('surat_keluar')}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 transition shadow-md shadow-emerald-600/20 hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white stroke-[3]" />
              <span>Buat Surat Baru</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <div className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Surat Keluar</div>
            <div className="text-2xl font-black text-slate-950 dark:text-white mt-1">{outgoingLetters.length}</div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">Dokumen Resmi</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <div className="text-[11px] font-black text-blue-800 dark:text-blue-400 uppercase tracking-wider">Surat Masuk</div>
            <div className="text-2xl font-black text-slate-950 dark:text-white mt-1">{incomingLetters.length}</div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">Agenda Instansi</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <div className="text-[11px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider">Antrean Nomor TU</div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{queueLetters.length}</div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">Menunggu Verifikasi</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <div className="text-[11px] font-black text-purple-800 dark:text-purple-400 uppercase tracking-wider">Format Aktif</div>
            <div className="text-sm font-black text-slate-950 dark:text-white mt-1.5 truncate">{activeConfig?.prefix || 'B'}-xxx/Ma.26.06/...</div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">Reset: {activeConfig?.counterResetPeriod || 'Tahunan'}</div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'outgoing'
                ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                : 'text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Surat Keluar</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'outgoing' ? 'bg-emerald-900 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-600'
            }`}>
              {outgoingLetters.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('incoming')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'incoming'
                ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                : 'text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Surat Masuk</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'incoming' ? 'bg-blue-900 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-600'
            }`}>
              {incomingLetters.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'queue'
                ? 'bg-amber-600 text-white shadow-sm font-extrabold'
                : 'text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Antrean Nomor TU</span>
            {queueLetters.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-950 border border-amber-400 animate-pulse">
                {queueLetters.length}
              </span>
            )}
          </button>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          {activeTab === 'incoming' ? (
            <button
              onClick={() => handleOpenCreateModal('surat_masuk')}
              className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrasi Surat Masuk</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenCreateModal('surat_keluar')}
              className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Surat Keluar</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nomor surat, perihal, nama siswa, NIS, atau instansi penerima..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="all">Semua Kategori</option>
              <option value="dispensasi">Dispensasi Siswa</option>
              <option value="keterangan_aktif">Keterangan Aktif</option>
              <option value="panggilan_ortu">Panggilan Orang Tua</option>
              <option value="surat_tugas">Surat Tugas / Mandat</option>
              <option value="undangan">Undangan Madrasah</option>
              <option value="mutasi">Mutasi Siswa</option>
              <option value="rekomendasi">Rekomendasi</option>
              <option value="lainnya">Lainnya / Umum</option>
            </select>

            {/* Status Filter */}
            {activeTab !== 'queue' && (
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="terbit_bernomor">Resmi Bernomor</option>
                <option value="draf_menunggu_nomor">Draf Menunggu TU</option>
                <option value="diarsipkan">Diarsipkan</option>
                <option value="ditolak">Perlu Revisi / Ditolak</option>
              </select>
            )}

            {(selectedCategory !== 'all' || selectedStatus !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                  setSearchQuery('');
                }}
                className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition border border-slate-200 dark:border-slate-700"
              >
                Reset Filter
              </button>
            )}

            <ExportActions
              filename={`buku_agenda_${activeTab === 'incoming' ? 'surat_masuk' : activeTab === 'queue' ? 'antrean_tu' : 'surat_keluar'}`}
              title={`Buku Agenda ${activeTab === 'incoming' ? 'Surat Masuk' : activeTab === 'queue' ? 'Antrean Nomor TU' : 'Surat Keluar'} MAN 2 SBT`}
              data={exportData}
              headers={[
                { header: 'No. Agenda', key: 'noAgenda' },
                { header: 'Nomor Surat Resmi', key: 'letterNumber' },
                { header: 'Jenis Surat', key: 'letterType' },
                { header: 'Kategori', key: 'category' },
                { header: 'Kode Klasifikasi', key: 'classificationCode' },
                { header: 'Perihal / Judul', key: 'title' },
                { header: 'Pengirim', key: 'sender' },
                { header: 'Tujuan / Penerima', key: 'recipient' },
                { header: 'Tanggal Surat', key: 'date' },
                { header: 'Tanggal Diterima', key: 'receivedDate' },
                { header: 'Status', key: 'status' },
                { header: 'Siswa Terkait', key: 'studentName' },
                { header: 'Kelas', key: 'studentClass' },
                { header: 'NIS', key: 'studentNis' },
                { header: 'Dibuat Oleh', key: 'createdBy' }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Queue Alert Banner for Staf TU */}
      {activeTab === 'queue' && queueLetters.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-2xl p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed font-medium">
            <span className="font-extrabold">Antrean Registrasi Nomor Surat Keluar:</span> Terdapat {queueLetters.length} draf surat dinas yang diajukan oleh Guru BK/Waka. Sebagai Staf Tata Usaha, Anda dapat meninjau kelengkapan berkas dan langsung menerbitkan nomor surat dinas resmi Kemenag dengan satu klik.
          </div>
        </div>
      )}

      {/* Main Letters Grid / Table */}
      {displayedLetters.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-500">
            <Mail className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">
            Belum Ada Dokumen Surat
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6 font-medium">
            {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
              ? 'Tidak ada surat yang sesuai dengan kriteria pencarian dan filter Anda.'
              : activeTab === 'queue'
              ? 'Semua permohonan surat telah selesai diverifikasi dan bernomor resmi.'
              : 'Mulai catat surat keluar, surat masuk, atau permohonan dispensasi santri.'}
          </p>
          <button
            onClick={() => handleOpenCreateModal(activeTab === 'incoming' ? 'surat_masuk' : 'surat_keluar')}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Surat Baru</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedLetters.map((letter) => {
            const cat = CATEGORY_LABELS[letter.category] || CATEGORY_LABELS.lainnya;
            const stat = STATUS_LABELS[letter.status] || STATUS_LABELS.draf_menunggu_nomor;
            const StatusIcon = stat.icon;
            const isOutgoing = letter.letterType === 'surat_keluar';

            return (
              <div
                key={letter.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs ${cat.color}`}>
                        {cat.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-slate-100 text-slate-900 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-2xs" title="Kode Klasifikasi Surat Dinas Kemenag">
                        {letter.classificationCode || cat.code}
                      </span>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black border shadow-2xs ${stat.badge}`}>
                      <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{stat.label}</span>
                    </span>
                  </div>

                  {/* Letter Number */}
                  <div className="mb-2">
                    {letter.letterNumber ? (
                      <div className="text-xs font-black text-slate-900 dark:text-white tracking-wide font-mono bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 inline-block shadow-2xs">
                        {letter.letterNumber}
                      </div>
                    ) : (
                      <div className="text-xs font-black text-amber-950 dark:text-amber-300 italic bg-amber-100 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-400 dark:border-amber-800 inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-800 dark:text-amber-400" />
                        <span>Menunggu Nomor Staf TU</span>
                      </div>
                    )}
                  </div>

                  {/* Title / Subject */}
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-2 mb-2">
                    {letter.title}
                  </h4>

                  {/* Student Tag if attached */}
                  {letter.studentName && (
                    <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                        {((letter.studentName as any)?.fullName || letter.studentName || 'S').toString().trim().charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="text-xs font-extrabold text-emerald-950 dark:text-emerald-200 truncate">
                          {typeof letter.studentName === 'string' ? letter.studentName : ((letter.studentName as any)?.fullName || 'Siswa')}
                        </div>
                        <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                          {letter.studentClass || 'Siswa'} {letter.studentNis ? `• NIS: ${letter.studentNis}` : ''}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800/80 pt-3 font-sans">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tanggal:</span>
                      <span className="font-extrabold text-slate-950 dark:text-slate-100">{formatIndonesianDate(letter.date)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{isOutgoing ? 'Tujuan:' : 'Pengirim:'}</span>
                      <span className="font-extrabold text-slate-950 dark:text-slate-100 text-right truncate max-w-[170px]">
                        {isOutgoing ? letter.recipient : letter.sender}
                      </span>
                    </div>
                    {letter.tuOfficerName && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Staf TU:</span>
                        <span className="text-slate-950 dark:text-slate-200 font-extrabold truncate max-w-[170px]">
                          {letter.tuOfficerName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {/* Preview / Print */}
                    <button
                      onClick={() => {
                        setSelectedLetter(letter);
                        setIsPrintModalOpen(true);
                      }}
                      title="Pratinjau & Cetak Blangko Surat"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {/* Detail Modal */}
                    <button
                      onClick={() => {
                        setSelectedLetter(letter);
                        setIsDetailModalOpen(true);
                      }}
                      title="Lihat Detail Lengkap"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Delete button (privileged) */}
                    {canManageTU && (
                      <button
                        onClick={() => setLetterToDelete(letter)}
                        title="Hapus Surat"
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-700 dark:text-slate-300 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Staf TU Direct Action */}
                  {canManageTU && letter.status === 'draf_menunggu_nomor' && (
                    <button
                      onClick={() => handleAssignNumberQuick(letter)}
                      className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Terbitkan Nomor</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: BUAT / AJUKAN SURAT BARU DENGAN RESPONSIVE GRID PEMILIHAN SISWA */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={formData.letterType === 'surat_masuk' ? 'Registrasi Surat Masuk' : 'Penerbitan Surat Keluar Resmi'}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSaveLetter} className="space-y-5">
          {/* Top Jenis Surat Switcher */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, letterType: 'surat_keluar' }))}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                formData.letterType === 'surat_keluar'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Surat Keluar (Madrasah)</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, letterType: 'surat_masuk' }))}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                formData.letterType === 'surat_masuk'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Surat Masuk (Eksternal)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kategori Surat */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kategori Surat Resmi
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as SchoolLetterCategory }))}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="dispensasi">Dispensasi Siswa / Izin Kegiatan Lomba (PP.00.6)</option>
                <option value="keterangan_aktif">Surat Keterangan Aktif Belajar (PP.01.1)</option>
                <option value="panggilan_ortu">Panggilan Orang Tua / Wali BK (KS.01.2)</option>
                <option value="surat_tugas">Surat Tugas / Mandat (KP.01.2)</option>
                <option value="undangan">Undangan Madrasah (HM.01)</option>
                <option value="mutasi">Surat Keterangan Mutasi / Pindah (PP.05)</option>
                <option value="rekomendasi">Rekomendasi Kesiswaan (PP.00)</option>
                <option value="lainnya">Surat Umum / Lainnya (PP.00)</option>
              </select>
            </div>

            {/* Tanggal Surat */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Surat Dinas
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Judul & Perihal */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Perihal / Judul Surat <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Surat Dispensasi Mengikuti Lomba KSM Tingkat Kabupaten Seram Bagian Timur"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pengirim */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Instansi / Pihak Pengirim
              </label>
              <input
                type="text"
                placeholder={formData.letterType === 'surat_keluar' ? 'MAN 2 Seram Bagian Timur' : 'Kantor Kemenag Kab. SBT / Instansi Luar'}
                value={formData.sender}
                onChange={(e) => setFormData(prev => ({ ...prev, sender: e.target.value }))}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Penerima */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tujuan / Penerima Surat
              </label>
              <input
                type="text"
                placeholder="Contoh: Bapak/Ibu Orang Tua Siswa / Kepala Kantor Kemenag Kab. SBT"
                value={formData.recipient}
                onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RESPONSIVE GRID PEMILIHAN SISWA (PERSYARATAN UTAMA: TANPA DROPDOWN)       */}
          {/* ========================================================================= */}
          <div className="border border-slate-300 dark:border-slate-800 rounded-3xl p-4 bg-slate-50/80 dark:bg-slate-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">
                  Pemilihan Siswa Terkait (Responsive Grid Layout)
                </span>
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.includeStudent}
                  onChange={(e) => setFormData(prev => ({ ...prev, includeStudent: e.target.checked }))}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-slate-800 dark:text-slate-200">Surat Menyangkut Siswa</span>
              </label>
            </div>

            {formData.includeStudent && (
              <div className="space-y-3 pt-2">
                {/* Active Selected Student Banner */}
                {formData.selectedStudent ? (
                  <div className="bg-emerald-50 dark:bg-emerald-950/70 border-2 border-emerald-600 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-black text-sm flex items-center justify-center shadow-xs">
                        {(formData.selectedStudent.fullName || (formData.selectedStudent as any).name || 'S').toString().trim().charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-black text-emerald-950 dark:text-emerald-100 tracking-tight">
                          {formData.selectedStudent.fullName || (formData.selectedStudent as any).name || 'Siswa'}
                        </div>
                        <div className="text-xs text-emerald-900 dark:text-emerald-300 font-bold">
                          Kelas {formData.selectedStudent.className || '-'} • NIS: {formData.selectedStudent.nis || '-'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, selectedStudent: null }))}
                      className="py-1.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow-xs transition"
                    >
                      Ganti Siswa
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-slate-700 dark:text-slate-300 font-semibold bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Klik salah satu kartu siswa pada grid di bawah untuk memilih siswa secara instan (tanpa dropdown).</span>
                  </div>
                )}

                {/* Grid Search & Class Filters */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Ketik nama atau NIS untuk memfilter kartu siswa..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none shadow-2xs"
                    />
                  </div>

                  {/* Class Pill Filters */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                    <button
                      type="button"
                      onClick={() => setStudentClassFilter('all')}
                      className={`py-1 px-3 rounded-lg text-[11px] shrink-0 transition ${
                        studentClassFilter === 'all'
                          ? 'bg-slate-900 text-white dark:bg-emerald-600 font-black shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold hover:bg-slate-100'
                      }`}
                    >
                      Semua Kelas ({students.length})
                    </button>
                    {classPillOptions.map(clsName => {
                      const count = students.filter(s => s.className === clsName).length;
                      return (
                        <button
                          key={clsName}
                          type="button"
                          onClick={() => setStudentClassFilter(clsName)}
                          className={`py-1 px-3 rounded-lg text-[11px] shrink-0 transition ${
                            studentClassFilter === clsName
                              ? 'bg-emerald-700 text-white font-black shadow-xs ring-1 ring-emerald-800'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold hover:bg-slate-100'
                          }`}
                        >
                          {clsName} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* THE RESPONSIVE STUDENT CARDS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-2 border-2 border-slate-300 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 custom-scrollbar">
                  {availableStudentsForGrid.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tidak ada siswa yang cocok dengan filter kelas atau kata kunci pencarian.
                    </div>
                  ) : (
                    availableStudentsForGrid.map(st => {
                      const isSelected = formData.selectedStudent?.id === st.id;
                      return (
                        <div
                          key={st.id}
                          onClick={() => setFormData(prev => ({ ...prev, selectedStudent: st }))}
                          className={`cursor-pointer p-3 rounded-2xl border-2 transition-all flex items-center justify-between gap-2.5 ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-600 shadow-md ring-2 ring-emerald-600/30 scale-[1.01]'
                              : 'bg-slate-50 hover:bg-white dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-2xs hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs ${
                              isSelected
                                ? 'bg-emerald-700 text-white ring-2 ring-emerald-500/40'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600'
                            }`}>
                              {(st.fullName || (st as any).name || 'S').toString().trim().charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-black text-slate-950 dark:text-white truncate tracking-tight">
                                {st.fullName || (st as any).name || 'Tanpa Nama'}
                              </div>
                              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate mt-0.5">
                                <span className="text-emerald-800 dark:text-emerald-400 font-extrabold">{st.className || 'Kelas -'}</span> • NIS: {st.nis || '-'}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Isi Ringkas & Tubuh Surat */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Isi Tubuh Surat / Penjelasan Keperluan
            </label>
            <textarea
              rows={4}
              placeholder="Tuliskan keterangan detail, waktu kegiatan lomba, atau maksud panggilan bimbingan konseling..."
              value={formData.contentBody}
              onChange={(e) => setFormData(prev => ({ ...prev, contentBody: e.target.value }))}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Opsi Penerbitan Nomor TU */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-white">
                Status Penerbitan Surat
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {canManageTU
                  ? 'Sebagai Staf TU / Admin, Anda dapat langsung menerbitkan nomor otomatis atau menyimpannya sebagai draf.'
                  : 'Surat Anda akan diajukan ke Staf TU untuk diverifikasi dan diterbitkan nomor surat resmi.'}
              </div>
            </div>

            {canManageTU ? (
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as SchoolLetterStatus }))}
                className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-emerald-700 dark:text-emerald-300"
              >
                <option value="terbit_bernomor">Langsung Terbitkan Nomor TU (Otomatis)</option>
                <option value="draf_menunggu_nomor">Simpan Sebagai Draf</option>
                <option value="diarsipkan">Simpan & Langsung Arsipkan</option>
              </select>
            ) : (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                Draf Menunggu Nomor TU
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs transition shadow-md flex items-center gap-2"
            >
              {isSubmitting ? 'Memproses...' : 'Simpan & Daftarkan Surat'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: PRATINJAU & CETAK BLANGKO SURAT RESMI MADRASAH                   */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Pratinjau & Cetak Blangko Surat Resmi Madrasah"
        maxWidth="max-w-4xl"
      >
        {selectedLetter && (
          <div className="space-y-4">
            {/* Top Print Actions */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 print:hidden">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-emerald-100 text-emerald-950 border border-emerald-400 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700 shadow-2xs">
                  {selectedLetter.letterNumber || 'DRAF BELUM BERNOMOR'}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-black bg-slate-100 text-slate-900 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-2xs">
                  KLASIFIKASI: {selectedLetter.classificationCode || CATEGORY_LABELS[selectedLetter.category]?.code || 'PP.00'}
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tanggal: {formatIndonesianDate(selectedLetter.date)}
                </span>
              </div>
              <button
                onClick={handlePrintDocument}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </button>
            </div>

            {/* Official Letter Sheet Preview (Paper Canvas) */}
            <div
              id="printable-official-letter"
              className="bg-white text-slate-900 p-8 md:p-12 rounded-2xl border border-slate-300 shadow-lg font-serif max-w-3xl mx-auto leading-relaxed"
            >
              {/* KOP RESMI MADRASAH DARI KEMENAG */}
              <SchoolLetterhead schoolInfo={schoolSetting || schoolInfo} showDoubleLine={true} />

              {/* Tanggal & Tempat Bula */}
              <div className="text-right text-xs mt-4 mb-4">
                Bula, {formatIndonesianDate(selectedLetter.date)}
              </div>

              {/* Nomor, Lampiran, Perihal Header */}
              <div className="flex justify-between items-start text-xs mb-6">
                <div className="space-y-1">
                  <div className="flex">
                    <span className="w-20 font-bold">Nomor</span>
                    <span className="w-3">:</span>
                    <span className="font-mono font-bold">{selectedLetter.letterNumber || '[MENUNGGU NOMOR TU]'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-20">Sifat</span>
                    <span className="w-3">:</span>
                    <span>Penting</span>
                  </div>
                  <div className="flex">
                    <span className="w-20">Lampiran</span>
                    <span className="w-3">:</span>
                    <span>-</span>
                  </div>
                  <div className="flex">
                    <span className="w-20 font-bold">Perihal</span>
                    <span className="w-3">:</span>
                    <span className="font-bold underline uppercase">{selectedLetter.title}</span>
                  </div>
                </div>

                <div className="text-right text-xs max-w-xs">
                  <div>Kepada Yth.</div>
                  <div className="font-bold">{selectedLetter.recipient || 'Bapak/Ibu/Saudara/i Terkait'}</div>
                  <div>Di -</div>
                  <div className="italic">Tempat</div>
                </div>
              </div>

              {/* Salam Pembuka */}
              <div className="text-xs mb-4">
                <p className="italic">Assalamu’alaikum Warahmatullahi Wabarakatuh,</p>
              </div>

              {/* Isi Surat Dinamis Berdasarkan Kategori */}
              <div className="text-xs space-y-3 mb-6 text-justify leading-relaxed">
                <p>
                  Dengan hormat, sehubungan dengan pelaksanaan agenda kesiswaan dan pembinaan madrasah pada Tahun Ajaran {selectedLetter.academicYear || activeAcademicYear || '2026/2027'}, bersama ini kami menyampaikan hal-hal sebagai berikut:
                </p>

                {/* Rincian Siswa jika ada */}
                {selectedLetter.studentName && (
                  <div className="my-3 p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs space-y-1.5 font-sans">
                    <div className="font-black text-slate-900 pb-1 mb-1 border-b border-slate-300">
                      IDENTITAS SISWA YANG BERSANGKUTAN:
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-700 font-bold">Nama Lengkap</span>
                      <span className="col-span-2 font-black text-slate-950">: {selectedLetter.studentName}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-700 font-bold">NIS / NISN</span>
                      <span className="col-span-2 font-mono font-black text-slate-950">: {selectedLetter.studentNis || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-700 font-bold">Kelas / Rombel</span>
                      <span className="col-span-2 font-bold text-slate-950">: {selectedLetter.studentClass || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-700 font-bold">Madrasah</span>
                      <span className="col-span-2 font-bold text-slate-950">: MAN 2 Seram Bagian Timur</span>
                    </div>
                  </div>
                )}

                {/* Tubuh Konten Surat */}
                <p>
                  {selectedLetter.contentBody || selectedLetter.description || 'Demikian surat resmi ini kami terbitkan untuk dapat dipergunakan sebagaimana mestinya dengan penuh tanggung jawab.'}
                </p>

                <p>
                  Demikian surat ini kami sampaikan, atas perhatian dan kerja sama yang baik kami ucapkan terima kasih.
                </p>

                <p className="italic">Wassalamu’alaikum Warahmatullahi Wabarakatuh.</p>
              </div>

              {/* Tanda Tangan Pejabat Madrasah */}
              <div className="grid grid-cols-2 gap-8 text-xs mt-10 pt-4 text-center">
                <div>
                  <div>Mengetahui,</div>
                  <div className="font-bold">Kepala Madrasah</div>
                  <div className="h-20 flex items-center justify-center italic text-slate-400">
                    [Tanda Tangan & Cap Lembaga]
                  </div>
                  <div className="font-bold underline uppercase">
                    {schoolSetting?.principalName || 'Zakaria, S. Pd.I., M. Pd'}
                  </div>
                  <div className="text-[11px] font-mono">
                    NIP. {schoolSetting?.principalNip || '197808042003121008'}
                  </div>
                </div>

                <div>
                  <div>Bula, {formatIndonesianDate(selectedLetter.date)}</div>
                  <div className="font-bold">Staf Tata Usaha / Kesiswaan</div>
                  <div className="h-20 flex items-center justify-center italic text-slate-400">
                    [Tanda Tangan Petugas TU]
                  </div>
                  <div className="font-bold underline uppercase">
                    {selectedLetter.tuOfficerName || currentUser?.displayName || 'Staf Tata Usaha'}
                  </div>
                  <div className="text-[11px] font-mono">
                    {selectedLetter.letterNumber ? 'Registrasi TU Valid' : 'Draf Pengajuan'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: PENGATURAN FORMAT PENOMORAN SURAT OTOMATIS OLEH STAF TU          */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Pengaturan Format Penomoran Surat Otomatis TU"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 rounded-2xl p-4 text-xs text-emerald-900 dark:text-emerald-200">
            <span className="font-bold">Standar Tata Usaha Kementerian Agama:</span> Format penomoran otomatis tersusun rapi dengan pola standar kode madrasah dan klasifikasi bidang kesiswaan.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Prefix Surat (Awalan)
              </label>
              <input
                type="text"
                value={configForm.prefix}
                onChange={(e) => setConfigForm(prev => ({ ...prev, prefix: e.target.value }))}
                placeholder="B"
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kode Sekolah / Madrasah
              </label>
              <input
                type="text"
                value={configForm.schoolCode}
                onChange={(e) => setConfigForm(prev => ({ ...prev, schoolCode: e.target.value }))}
                placeholder="Ma.26.06"
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Pola Format Nomor Lengkap
            </label>
            <input
              type="text"
              value={configForm.formatPattern}
              onChange={(e) => setConfigForm(prev => ({ ...prev, formatPattern: e.target.value }))}
              className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
            />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1.5">
              Variabel: {'{PREFIX}'}, {'{NO}'}, {'{KODE_SEKOLAH}'}, {'{KLASIFIKASI}'}, {'{BULAN}'}, {'{TAHUN}'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Counter Nomor Terakhir (Sequence)
              </label>
              <input
                type="number"
                value={configForm.lastCounter}
                onChange={(e) => setConfigForm(prev => ({ ...prev, lastCounter: Number(e.target.value) }))}
                className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
              />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1.5">
                Surat berikutnya akan memakai nomor: <strong className="text-emerald-700 dark:text-emerald-400">{Number(configForm.lastCounter) + 1}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kebijakan Reset Counter
              </label>
              <select
                value={configForm.counterResetPeriod}
                onChange={(e) => setConfigForm(prev => ({ ...prev, counterResetPeriod: e.target.value as any }))}
                className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
              >
                <option value="tahunan">Reset Tahunan (Tiap 1 Januari)</option>
                <option value="bulanan">Reset Bulanan (Tiap Awal Bulan)</option>
              </select>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white font-mono text-xs border border-slate-700 shadow-sm">
            <span className="text-xs font-bold text-slate-300 block mb-1 uppercase tracking-wider">CONTOH PENOMORAN YANG AKAN TERBIT:</span>
            <div className="text-emerald-400 font-black text-sm tracking-wide">
              {configForm.formatPattern
                .replace('{PREFIX}', configForm.prefix || 'B')
                .replace('{NO}', String(Number(configForm.lastCounter) + 1))
                .replace('{KODE_SEKOLAH}', configForm.schoolCode || 'Ma.26.06')
                .replace('{KLASIFIKASI}', 'PP.00.6')
                .replace('{BULAN}', '10')
                .replace('{TAHUN}', '2026')}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(false)}
              className="py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              Simpan Format TU
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: DETAIL LENGKAP SURAT                                             */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detail Berkas Surat"
        maxWidth="max-w-2xl"
      >
        {selectedLetter && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-black text-emerald-950 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-400 dark:border-emerald-700 shadow-2xs">
                    {selectedLetter.letterNumber || 'DRAF BELUM BERNOMOR'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-black bg-slate-100 text-slate-900 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-2xs">
                    KLASIFIKASI: {selectedLetter.classificationCode || CATEGORY_LABELS[selectedLetter.category]?.code || 'PP.00'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${STATUS_LABELS[selectedLetter.status]?.badge}`}>
                    {STATUS_LABELS[selectedLetter.status]?.label}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {formatIndonesianDate(selectedLetter.date)}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {selectedLetter.title}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700">
                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Pengirim</div>
                <div className="font-extrabold text-slate-900 dark:text-white mt-0.5">{selectedLetter.sender}</div>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700">
                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Penerima</div>
                <div className="font-extrabold text-slate-900 dark:text-white mt-0.5">{selectedLetter.recipient}</div>
              </div>
            </div>

            {selectedLetter.studentName && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs">
                <div className="font-extrabold text-emerald-950 dark:text-emerald-200">Siswa Terkait:</div>
                <div className="font-bold text-emerald-900 dark:text-emerald-300 mt-0.5">{selectedLetter.studentName} ({selectedLetter.studentClass || '-'}) • NIS: {selectedLetter.studentNis || '-'}</div>
              </div>
            )}

            {selectedLetter.contentBody && (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700 text-xs">
                <div className="font-extrabold text-slate-800 dark:text-slate-200 mb-1">Isi Surat:</div>
                <div className="text-slate-800 dark:text-slate-300 font-medium whitespace-pre-line leading-relaxed">
                  {selectedLetter.contentBody}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setIsPrintModalOpen(true);
                }}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Buka Lembar Cetak</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(letterToDelete)}
        title="Hapus Dokumen Surat?"
        message={`Apakah Anda yakin ingin menghapus surat "${letterToDelete?.title || ''}" (${letterToDelete?.letterNumber || 'Draf'})? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Permanen"
        cancelText="Batal"
        type="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setLetterToDelete(null)}
      />
    </div>
  );
};
