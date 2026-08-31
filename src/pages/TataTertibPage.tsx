import React, { useState, useMemo } from 'react';
import {
  BookOpenCheck,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  FileText,
  Printer,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  Award,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Scale,
  UserCheck,
  Building,
  HelpCircle,
  FileSpreadsheet,
  Layers,
  Copy,
  Check,
  Info,
  Calendar
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import {
  SchoolRuleArticle,
  SchoolHandbookMeta,
  RuleCategoryChapter,
  RuleSeverity
} from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { StatusBadge } from '../components/common/Badge';

const ALL_CHAPTERS: RuleCategoryChapter[] = [
  'Bab I: Ketentuan Umum & Kehadiran',
  'Bab II: Pakaian, Seragam & Kerapian',
  'Bab III: Etika, Perilaku & Sopan Santun',
  'Bab IV: Larangan Keras & Ketertiban Umum',
  'Bab V: Penggunaan Perangkat Elektronik & Medsos',
  'Bab VI: Kegiatan Ekstrakurikuler & Organisasi',
  'Bab VII: Apresiasi, Prestasi & Pemulihan Disiplin'
];

export const TataTertibPage: React.FC = () => {
  const { isWakaOrAdmin, isSuperAdmin, currentUser } = useAuth();
  const {
    schoolRules,
    handbookMeta,
    addSchoolRule,
    updateSchoolRule,
    deleteSchoolRule,
    resetSchoolRulesToDefault,
    updateHandbookMeta,
    schoolSetting,
    activeAcademicYear
  } = useSchool();

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'handbook' | 'table' | 'sop'>('handbook');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isMetaModalOpen, setIsMetaModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const [selectedRule, setSelectedRule] = useState<SchoolRuleArticle | null>(null);
  const [copiedRuleId, setCopiedRuleId] = useState<string | null>(null);

  // Form State for Adding / Editing a Rule
  const [formData, setFormData] = useState<Partial<SchoolRuleArticle>>({
    chapter: 'Bab I: Ketentuan Umum & Kehadiran',
    articleNumber: '',
    title: '',
    description: '',
    points: 10,
    severity: 'Ringan',
    consequence: '',
    authorizedOfficer: 'Guru Piket & Wali Kelas',
    sopSteps: ['Teguran lisan langsung', 'Pencatatan dalam buku saku'],
    isMandatory: true
  });
  const [sopStepInput, setSopStepInput] = useState('');

  // Form State for Handbook Metadata (SK & Poin)
  const [metaFormData, setMetaFormData] = useState<SchoolHandbookMeta>(handbookMeta);

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return schoolRules.filter(r => {
      if (selectedChapter !== 'all' && r.chapter !== selectedChapter) {
        return false;
      }
      if (selectedSeverity !== 'all' && r.severity !== selectedSeverity) {
        return false;
      }
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(query);
        const matchArticle = r.articleNumber.toLowerCase().includes(query);
        const matchDesc = r.description.toLowerCase().includes(query);
        const matchConseq = r.consequence.toLowerCase().includes(query);
        const matchOfficer = r.authorizedOfficer.toLowerCase().includes(query);
        return matchTitle || matchArticle || matchDesc || matchConseq || matchOfficer;
      }
      return true;
    });
  }, [schoolRules, selectedChapter, selectedSeverity, searchTerm]);

  // Grouped Rules by Chapter for Handbook view
  const groupedRules = useMemo(() => {
    const map = new Map<RuleCategoryChapter, SchoolRuleArticle[]>();
    ALL_CHAPTERS.forEach(ch => map.set(ch, []));

    filteredRules.forEach(rule => {
      const list = map.get(rule.chapter) || [];
      list.push(rule);
      map.set(rule.chapter, list);
    });

    return map;
  }, [filteredRules]);

  // Statistics
  const stats = useMemo(() => {
    const total = schoolRules.length;
    const ringan = schoolRules.filter(r => r.severity === 'Ringan').length;
    const sedang = schoolRules.filter(r => r.severity === 'Sedang').length;
    const berat = schoolRules.filter(r => r.severity === 'Berat').length;
    const sangatBerat = schoolRules.filter(r => r.severity === 'Sangat Berat').length;
    const apresiasi = schoolRules.filter(r => r.severity === 'Apresiasi').length;
    return { total, ringan, sedang, berat, sangatBerat, apresiasi };
  }, [schoolRules]);

  // Handlers for Add / Edit Rule
  const handleOpenAdd = () => {
    setIsEditMode(false);
    setSelectedRule(null);
    setFormData({
      chapter: selectedChapter !== 'all' ? (selectedChapter as RuleCategoryChapter) : 'Bab I: Ketentuan Umum & Kehadiran',
      articleNumber: `Pasal ${schoolRules.length + 1} Ayat 1`,
      title: '',
      description: '',
      points: 10,
      severity: 'Ringan',
      consequence: 'Teguran lisan, pembinaan wali kelas, dan pencatatan dalam buku saku kedisiplinan.',
      authorizedOfficer: 'Guru Piket & Wali Kelas',
      sopSteps: [
        'Pemeriksaan dan klarifikasi pelanggaran oleh Guru Piket / Wali Kelas',
        'Pencatatan bobot poin ke SIM Kesiswaan',
        'Pembinaan edukatif dan komitmen perbaikan sikap'
      ],
      isMandatory: true
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (rule: SchoolRuleArticle) => {
    setIsEditMode(true);
    setSelectedRule(rule);
    setFormData({
      ...rule,
      sopSteps: rule.sopSteps || []
    });
    setIsFormModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.articleNumber || !formData.description) {
      alert('Mohon lengkapi Nomor Pasal, Judul Aturan, dan Bunyi Ketentuan!');
      return;
    }

    if (isEditMode && selectedRule) {
      await updateSchoolRule(selectedRule.id, formData);
    } else {
      await addSchoolRule(formData as Omit<SchoolRuleArticle, 'id'>);
    }
    setIsFormModalOpen(false);
  };

  const handleDeleteRule = async () => {
    if (selectedRule) {
      await deleteSchoolRule(selectedRule.id);
      setIsDeleteConfirmOpen(false);
      setSelectedRule(null);
    }
  };

  const handleResetToDefault = async () => {
    await resetSchoolRulesToDefault();
    setIsResetConfirmOpen(false);
  };

  const handleSaveHandbookMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateHandbookMeta(metaFormData);
    setIsMetaModalOpen(false);
  };

  const handleCopyRuleText = (rule: SchoolRuleArticle) => {
    const text = `[BUKU TATA TERTIB SISWA]\n${rule.articleNumber}: ${rule.title}\nBab: ${rule.chapter}\nBobot: ${rule.points} Poin (${rule.severity})\n\nBunyi Aturan:\n${rule.description}\n\nKonsekuensi / Sanksi:\n${rule.consequence}\n\nPihak Berwenang: ${rule.authorizedOfficer}`;
    navigator.clipboard.writeText(text);
    setCopiedRuleId(rule.id);
    setTimeout(() => setCopiedRuleId(null), 2000);
  };

  const getSeverityBadgeColor = (severity: RuleSeverity) => {
    switch (severity) {
      case 'Ringan':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'Sedang':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'Berat':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      case 'Sangat Berat':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'Apresiasi':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Header & Official Decree Card */}
      <div className="bg-white dark:bg-[#0c111c] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <BookOpenCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  Pedoman Disiplin & Kode Etik Siswa
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> TP {handbookMeta.academicYear || activeAcademicYear}
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Buku Tata Tertib Siswa
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Landasan hukum operasional penegakan kedisiplinan, tata krama, hak & kewajiban siswa berdasar <strong>{handbookMeta.decreeNumber}</strong> ({handbookMeta.decreeTitle}).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 shadow-xs"
              title="Pratinjau & Cetak Buku Tata Tertib"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Cetak Pedoman</span>
            </button>

            {isWakaOrAdmin && (
              <>
                <button
                  onClick={() => {
                    setMetaFormData(handbookMeta);
                    setIsMetaModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-amber-200 dark:border-amber-800/60 shadow-xs"
                >
                  <Scale className="w-4 h-4 text-amber-600" />
                  <span>Pengaturan SK & Ambang Poin</span>
                </button>

                <button
                  onClick={handleOpenAdd}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pasal Baru</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Ambang Poin SP Escalation Banner */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Ambang Surat Peringatan I (SP 1)
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                  {handbookMeta.thresholdSp1}
                </span>
                <span className="text-[11px] text-slate-500">Poin Akumulasi</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                Peringatan tertulis & pembinaan wali kelas
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Ambang Surat Peringatan II (SP 2)
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-black text-orange-600 dark:text-orange-400">
                  {handbookMeta.thresholdSp2}
                </span>
                <span className="text-[11px] text-slate-500">Poin Akumulasi</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                Pemanggilan orang tua & konseling intensif BK
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Ambang SP 3 & Skorsing Edukatif
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                  {handbookMeta.thresholdSp3}
                </span>
                <span className="text-[11px] text-slate-500">Poin Akumulasi</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                Konferensi kasus kesiswaan & skorsing 3-7 hari
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Maksimal Poin (Dikembalikan)
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-black text-rose-700 dark:text-rose-500">
                  {handbookMeta.thresholdDrop}
                </span>
                <span className="text-[11px] text-slate-500">Poin Batas Akhir</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                Dikembalikan pembinaannya kepada Orang Tua
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-[#0c111c] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Pasal</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Semua klausul aturan</div>
        </div>
        <div className="bg-white dark:bg-[#0c111c] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Ringan</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.ringan}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">1 s.d 10 Poin</div>
        </div>
        <div className="bg-white dark:bg-[#0c111c] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Sedang</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.sedang}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">11 s.d 30 Poin</div>
        </div>
        <div className="bg-white dark:bg-[#0c111c] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Berat</div>
          <div className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">{stats.berat}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">31 s.d 75 Poin</div>
        </div>
        <div className="bg-white dark:bg-[#0c111c] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Sangat Berat</div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{stats.sangatBerat}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">76 s.d 100 Poin</div>
        </div>
        <div className="bg-white dark:bg-[#0c111c] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Apresiasi</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{stats.apresiasi}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Pemulihan / Prestasi</div>
        </div>
      </div>

      {/* Control Bar: Filters, Search & View Switcher */}
      <div className="bg-white dark:bg-[#0c111c] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari pasal, nama pelanggaran, bobot poin, atau kata kunci (contoh: rambut, terlambat, rokok, hp)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
            <button
              onClick={() => setViewMode('handbook')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                viewMode === 'handbook'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpenCheck className="w-3.5 h-3.5" />
              <span>Buku Panduan</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Tabel Ringkasan</span>
            </button>
            <button
              onClick={() => setViewMode('sop')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                viewMode === 'sop'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Alur SOP & Penindak</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter Bab:
            </span>
            <select
              value={selectedChapter}
              onChange={e => setSelectedChapter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white font-medium focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">Semua Bab Tata Tertib ({schoolRules.length})</option>
              {ALL_CHAPTERS.map(ch => {
                const count = schoolRules.filter(r => r.chapter === ch).length;
                return (
                  <option key={ch} value={ch}>
                    {ch} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tingkat Bobot:</span>
            <select
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white font-medium focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">Semua Tingkat</option>
              <option value="Ringan">Ringan (1-10 Poin)</option>
              <option value="Sedang">Sedang (11-30 Poin)</option>
              <option value="Berat">Berat (31-75 Poin)</option>
              <option value="Sangat Berat">Sangat Berat (76-100 Poin)</option>
              <option value="Apresiasi">Apresiasi & Pemulihan</option>
            </select>
          </div>

          {(selectedChapter !== 'all' || selectedSeverity !== 'all' || searchTerm !== '') && (
            <button
              onClick={() => {
                setSelectedChapter('all');
                setSelectedSeverity('all');
                setSearchTerm('');
              }}
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium ml-auto"
            >
              Reset Filter
            </button>
          )}

          {isSuperAdmin && (
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-2.5 py-1 text-[11px] text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors ml-auto"
              title="Kembalikan ke pedoman baku standar nasional"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Standar Baku</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area based on View Mode */}
      {viewMode === 'handbook' && (
        <div className="space-y-6">
          {Array.from(groupedRules.entries()).map(([chapter, rules]) => {
            if (rules.length === 0) return null;
            return (
              <div
                key={chapter}
                className="bg-white dark:bg-[#0c111c] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs"
              >
                {/* Chapter Header */}
                <div className="bg-slate-50 dark:bg-slate-900/80 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                      {chapter}
                    </h2>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {rules.length} Aturan
                  </span>
                </div>

                {/* Rules List in this chapter */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {rules.map(rule => (
                    <div
                      key={rule.id}
                      className="p-5 hover:bg-slate-50/70 dark:hover:bg-slate-900/30 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/60">
                              {rule.articleNumber}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              {rule.title}
                            </h3>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded border ${getSeverityBadgeColor(
                                rule.severity
                              )}`}
                            >
                              {rule.severity === 'Apresiasi' ? '⭐ Apresiasi' : `${rule.points} Poin (${rule.severity})`}
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-0.5">
                            {rule.description}
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 text-xs">
                            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1">
                                Sanksi / Tindakan Edukatif:
                              </span>
                              <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                                {rule.consequence}
                              </p>
                            </div>

                            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                                Pihak Berwenang Menindak:
                              </span>
                              <p className="text-slate-700 dark:text-slate-300 text-xs font-medium">
                                {rule.authorizedOfficer}
                              </p>
                            </div>
                          </div>

                          {rule.sopSteps && rule.sopSteps.length > 0 && (
                            <div className="pt-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                Tahapan SOP Pembinaan:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {rule.sopSteps.map((step, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                  >
                                    {idx + 1}. {step}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 self-end lg:self-start shrink-0">
                          <button
                            onClick={() => handleCopyRuleText(rule)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Salin klausul pasal"
                          >
                            {copiedRuleId === rule.id ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            onClick={() => {
                              setSelectedRule(rule);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Lihat Detail Pasal"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isWakaOrAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(rule)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Edit Pasal Ini"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRule(rule);
                                  setIsDeleteConfirmOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Hapus Pasal Ini"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredRules.length === 0 && (
            <div className="bg-white dark:bg-[#0c111c] border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
              <BookOpenCheck className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tidak ada aturan yang sesuai</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Silakan ubah kata kunci pencarian atau reset filter untuk melihat seluruh pasal buku tata tertib.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Table Matrix View */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-[#0c111c] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Pasal & Ayat</th>
                  <th className="px-4 py-3">Jenis Pelanggaran / Aturan</th>
                  <th className="px-4 py-3">Bab & Kategori</th>
                  <th className="px-4 py-3 text-center">Bobot Poin</th>
                  <th className="px-4 py-3">Konsekuensi / Sanksi</th>
                  <th className="px-4 py-3">Pihak Berwenang</th>
                  {isWakaOrAdmin && <th className="px-4 py-3 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {filteredRules.map(rule => (
                  <tr key={rule.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap">
                      {rule.articleNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">{rule.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{rule.description}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {rule.chapter.split(':')[0]}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded border ${getSeverityBadgeColor(
                          rule.severity
                        )}`}
                      >
                        {rule.severity === 'Apresiasi' ? '⭐ Apresiasi' : `${rule.points} Poin`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 max-w-xs">
                      <p className="line-clamp-2">{rule.consequence}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {rule.authorizedOfficer}
                    </td>
                    {isWakaOrAdmin && (
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleOpenEdit(rule)}
                            className="p-1 text-slate-400 hover:text-amber-600 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRule(rule);
                              setIsDeleteConfirmOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SOP Flow View */}
      {viewMode === 'sop' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0c111c] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-500" />
              Alur & Mekanisme SOP Penegakan Disiplin Siswa
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed max-w-3xl">
              Tata urutan penanganan pelanggaran disiplin siswa dilaksanakan secara bertahap, edukatif, berkeadilan, dan berorientasi pada pembinaan karakter siswa sesuai regulasi madrasah/sekolah.
            </p>

            <div className="relative border-l-2 border-amber-500/30 ml-4 space-y-8 pl-6">
              {/* Step 1 */}
              <div className="relative">
                <div className="absolute -left-[33px] top-0 w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  1
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Tahap I: Teguran Lisan & Pembinaan Awal (1 - 24 Poin)
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Guru Piket / Wali Kelas
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Setiap pelanggaran ringan langsung dicatat ke dalam SIM Kesiswaan. Guru piket atau wali kelas memberikan nasihat, teguran edukatif, dan mencatat komitmen perbaikan pada buku saku kedisiplinan.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="absolute -left-[33px] top-0 w-8 h-8 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs font-bold">
                  2
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Tahap II: Surat Peringatan I (SP 1) & Konseling BK (25 - 49 Poin)
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      Wali Kelas & Guru BK
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Wali kelas menerbitkan Surat Peringatan I (SP1) yang ditandatangani oleh siswa dan diketahui orang tua. Siswa dirujuk ke Layanan Bimbingan Konseling (BK) untuk sesi konseling terstruktur dan penandatanganan surat pernyataan pertama.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="absolute -left-[33px] top-0 w-8 h-8 rounded-full bg-orange-500/20 border-2 border-orange-500 flex items-center justify-center text-orange-600 dark:text-orange-400 text-xs font-bold">
                  3
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Tahap III: Surat Peringatan II (SP 2) & Pemanggilan Orang Tua (50 - 74 Poin)
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 border border-orange-500/20">
                      Guru BK & Waka Kesiswaan
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Penerbitan Surat Panggilan Resmi Orang Tua / Wali ke sekolah untuk duduk bersama Guru BK, Wali Kelas, dan Waka Kesiswaan. Penandatanganan fakta integritas bermaterai serta penugasan sanksi sosial edukatif di lingkungan sekolah.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative">
                <div className="absolute -left-[33px] top-0 w-8 h-8 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-600 dark:text-rose-400 text-xs font-bold">
                  4
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Tahap IV: Surat Peringatan Terakhir (SP 3) & Skorsing Edukatif (75 - 99 Poin)
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 border border-rose-500/20">
                      Kepala Madrasah & Tim Kesiswaan
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Pelaksanaan Konferensi Kasus Tingkat Sekolah yang dipimpin oleh Kepala Madrasah/Sekolah. Siswa dikenakan sanksi skorsing belajar mandiri di rumah selama 3 s.d 7 hari kerja di bawah pengawasan ketat orang tua.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="relative">
                <div className="absolute -left-[33px] top-0 w-8 h-8 rounded-full bg-rose-700/20 border-2 border-rose-700 flex items-center justify-center text-rose-700 dark:text-rose-500 text-xs font-bold">
                  5
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Tahap V: Pengembalian Pembinaan Siswa ke Orang Tua (≥100 Poin)
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-700/10 text-rose-700 border border-rose-700/20">
                      Rapat Pleno Dewan Guru & Kepala Madrasah
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Berdasarkan hasil Rapat Pleno Dewan Guru dan bukti rekapitulasi poin pelanggaran pada SIM Kesiswaan, Kepala Madrasah/Sekolah menerbitkan SK Pengembalian Pembinaan Siswa kepada Orang Tua / Wali atau fasilitasi mutasi ke sekolah lain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Rule */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={isEditMode ? 'Edit Klausul Pasal Tata Tertib' : 'Tambah Pasal Tata Tertib Baru'}
        subtitle="Sesuaikan bunyi pasal, bobot poin, dan tindakan pembinaan hasil musyawarah dewan guru"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveRule} className="space-y-4 text-xs font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Bab Tata Tertib <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.chapter}
                onChange={e => setFormData({ ...formData, chapter: e.target.value as RuleCategoryChapter })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                required
              >
                {ALL_CHAPTERS.map(ch => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Pasal & Ayat <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.articleNumber || ''}
                onChange={e => setFormData({ ...formData, articleNumber: e.target.value })}
                placeholder="Contoh: Pasal 5 Ayat 2"
                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Judul Pelanggaran / Klausul Aturan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Keterlambatan Masuk Sekolah (>15 Menit)"
              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Uraian Bunyi Ketentuan / Pasal <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Uraikan secara jelas deskripsi dan batasan aturan yang berlaku..."
              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tingkat Bobot <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.severity}
                onChange={e => {
                  const sev = e.target.value as RuleSeverity;
                  let defPoints = 10;
                  if (sev === 'Sedang') defPoints = 25;
                  if (sev === 'Berat') defPoints = 50;
                  if (sev === 'Sangat Berat') defPoints = 75;
                  if (sev === 'Apresiasi') defPoints = 0;
                  setFormData({ ...formData, severity: sev, points: defPoints });
                }}
                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Ringan">Ringan (1 - 10 Poin)</option>
                <option value="Sedang">Sedang (11 - 30 Poin)</option>
                <option value="Berat">Berat (31 - 75 Poin)</option>
                <option value="Sangat Berat">Sangat Berat (76 - 100 Poin)</option>
                <option value="Apresiasi">Apresiasi / Pemutihan Poin</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Bobot Poin Pelanggaran <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.points || 0}
                onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Sanksi & Tindakan Pembinaan Edukatif <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={formData.consequence || ''}
              onChange={e => setFormData({ ...formData, consequence: e.target.value })}
              placeholder="Contoh: Teguran lisan, pencatatan di buku saku, dan membersihkan lingkungan sekolah."
              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Pihak Berwenang Menindak <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.authorizedOfficer || ''}
              onChange={e => setFormData({ ...formData, authorizedOfficer: e.target.value })}
              placeholder="Contoh: Guru Piket, Wali Kelas, Guru BK, Waka Kesiswaan"
              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              required
            />
          </div>

          {/* SOP Steps */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Langkah SOP Pembinaan (Opsional)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={sopStepInput}
                onChange={e => setSopStepInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (sopStepInput.trim()) {
                      setFormData({
                        ...formData,
                        sopSteps: [...(formData.sopSteps || []), sopStepInput.trim()]
                      });
                      setSopStepInput('');
                    }
                  }
                }}
                placeholder="Ketik langkah pembinaan lalu tekan Enter atau klik Tambah"
                className="flex-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  if (sopStepInput.trim()) {
                    setFormData({
                      ...formData,
                      sopSteps: [...(formData.sopSteps || []), sopStepInput.trim()]
                    });
                    setSopStepInput('');
                  }
                }}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg font-semibold hover:bg-slate-300"
              >
                + Tambah
              </button>
            </div>
            {formData.sopSteps && formData.sopSteps.length > 0 && (
              <div className="space-y-1">
                {formData.sopSteps.map((st, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded bg-slate-100 dark:bg-slate-800 text-[11px]"
                  >
                    <span>
                      {idx + 1}. {st}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          sopSteps: formData.sopSteps?.filter((_, i) => i !== idx)
                        });
                      }}
                      className="text-rose-500 hover:text-rose-700 font-bold ml-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
            >
              {isEditMode ? 'Simpan Perubahan' : 'Tambahkan Pasal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit SK & Ambang Poin */}
      <Modal
        isOpen={isMetaModalOpen}
        onClose={() => setIsMetaModalOpen(false)}
        title="Pengaturan SK & Ambang Poin Tata Tertib"
        subtitle="Perbarui nomor SK legalitas dan batas ambang akumulasi SP sesuai keputusan rapat dinas"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveHandbookMeta} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nomor SK Kepala Madrasah / Sekolah <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={metaFormData.decreeNumber}
              onChange={e => setMetaFormData({ ...metaFormData, decreeNumber: e.target.value })}
              placeholder="Contoh: SK.042/KM/MAN1/PP.00.6/2026"
              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white font-mono"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Judul Keputusan / Regulasi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={metaFormData.decreeTitle}
              onChange={e => setMetaFormData({ ...metaFormData, decreeTitle: e.target.value })}
              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Penetapan Berlaku
              </label>
              <input
                type="date"
                value={metaFormData.effectiveDate}
                onChange={e => setMetaFormData({ ...metaFormData, effectiveDate: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tahun Pelajaran
              </label>
              <input
                type="text"
                value={metaFormData.academicYear}
                onChange={e => setMetaFormData({ ...metaFormData, academicYear: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
              Konfigurasi Ambang Batas Poin Sanksi (SP)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Ambang SP 1
                </label>
                <input
                  type="number"
                  value={metaFormData.thresholdSp1}
                  onChange={e => setMetaFormData({ ...metaFormData, thresholdSp1: parseInt(e.target.value) || 25 })}
                  className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Ambang SP 2
                </label>
                <input
                  type="number"
                  value={metaFormData.thresholdSp2}
                  onChange={e => setMetaFormData({ ...metaFormData, thresholdSp2: parseInt(e.target.value) || 50 })}
                  className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Ambang SP 3
                </label>
                <input
                  type="number"
                  value={metaFormData.thresholdSp3}
                  onChange={e => setMetaFormData({ ...metaFormData, thresholdSp3: parseInt(e.target.value) || 75 })}
                  className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Maksimal / DO
                </label>
                <input
                  type="number"
                  value={metaFormData.thresholdDrop}
                  onChange={e => setMetaFormData({ ...metaFormData, thresholdDrop: parseInt(e.target.value) || 100 })}
                  className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Kepala Madrasah / Sekolah
              </label>
              <input
                type="text"
                value={metaFormData.signedBy}
                onChange={e => setMetaFormData({ ...metaFormData, signedBy: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                NIP Kepala Sekolah
              </label>
              <input
                type="text"
                value={metaFormData.signedNip || ''}
                onChange={e => setMetaFormData({ ...metaFormData, signedNip: e.target.value })}
                placeholder="197508122003121002"
                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsMetaModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs"
            >
              Simpan Konfigurasi SK
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail Rule */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedRule ? `${selectedRule.articleNumber}: ${selectedRule.title}` : 'Detail Pasal'}
        subtitle={selectedRule?.chapter}
        maxWidth="lg"
      >
        {selectedRule && (
          <div className="space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Bobot Sanksi</span>
                <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                  {selectedRule.points} Poin ({selectedRule.severity})
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Pihak Berwenang</span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {selectedRule.authorizedOfficer}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Bunyi Ketentuan / Klausul:
              </span>
              <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200/80 dark:border-slate-800">
                {selectedRule.description}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1">
                Konsekuensi & Sanksi Pembinaan:
              </span>
              <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed p-3 bg-rose-500/5 border border-rose-500/20 rounded-lg">
                {selectedRule.consequence}
              </p>
            </div>

            {selectedRule.sopSteps && selectedRule.sopSteps.length > 0 && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                  Langkah Penanganan SOP:
                </span>
                <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200/80 dark:border-slate-800">
                  {selectedRule.sopSteps.map((st, i) => (
                    <div key={i} className="flex items-start space-x-2 text-slate-700 dark:text-slate-300">
                      <span className="font-bold text-indigo-600">{i + 1}.</span>
                      <span>{st}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
              <span>Terakhir disesuaikan: {selectedRule.updatedAt ? new Date(selectedRule.updatedAt).toLocaleDateString('id-ID') : '-'}</span>
              <button
                onClick={() => handleCopyRuleText(selectedRule)}
                className="px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Teks Aturan</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Print-friendly Preview */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Dokumen Resmi Buku Tata Tertib Siswa"
        subtitle="Format siap cetak untuk lampiran rapat dinas, sosialisasi wali murid & guru piket"
        maxWidth="4xl"
      >
        <div className="space-y-6 text-xs font-sans text-slate-900 dark:text-slate-100">
          {/* Header Kop Resmi */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl space-y-4">
            <div className="text-center pb-4 border-b-2 border-slate-900 dark:border-slate-100">
              <h2 className="text-sm font-bold tracking-widest uppercase">
                KEMENTERIAN AGAMA REPUBLIK INDONESIA
              </h2>
              <h1 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                {schoolSetting.name || 'MADRASAH ALIYAH NEGERI'}
              </h1>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                {schoolSetting.address || 'Jl. Pendidikan Karakter No. 1'} • NPSN: {schoolSetting.npsn || '12345678'}
              </p>
            </div>

            <div className="text-center py-2">
              <h3 className="text-sm font-black uppercase underline">
                SURAT KEPUTUSAN KEPALA MADRASAH
              </h3>
              <p className="font-mono font-bold text-xs mt-0.5">Nomor: {handbookMeta.decreeNumber}</p>
              <p className="text-xs font-semibold mt-1">TENTANG</p>
              <p className="text-xs font-bold uppercase max-w-lg mx-auto">
                {handbookMeta.decreeTitle} TAHUN PELAJARAN {handbookMeta.academicYear || activeAcademicYear}
              </p>
            </div>

            <div className="space-y-4 pt-2 max-h-[400px] overflow-y-auto pr-2">
              {Array.from(groupedRules.entries()).map(([chapter, rules]) => {
                if (rules.length === 0) return null;
                return (
                  <div key={chapter} className="space-y-2">
                    <h4 className="font-bold text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded uppercase border-l-4 border-amber-500">
                      {chapter}
                    </h4>
                    <div className="space-y-2 pl-2">
                      {rules.map(r => (
                        <div key={r.id} className="text-[11px] pb-2 border-b border-slate-200 dark:border-slate-800">
                          <div className="flex items-center justify-between font-bold">
                            <span>
                              {r.articleNumber}: {r.title}
                            </span>
                            <span className="font-mono text-amber-600">
                              {r.severity === 'Apresiasi' ? 'Apresiasi' : `${r.points} Poin`}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 mt-0.5">{r.description}</p>
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">
                            <strong>Sanksi:</strong> {r.consequence}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Signature Area */}
            <div className="pt-6 flex justify-end">
              <div className="text-center w-64">
                <p className="text-xs">Ditetapkan di: Tempat Kedudukan Sekolah</p>
                <p className="text-xs">Pada tanggal: {new Date(handbookMeta.effectiveDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="text-xs font-bold mt-2">Kepala Madrasah / Sekolah,</p>
                <div className="h-16 flex items-center justify-center text-slate-300 italic text-[10px]">
                  [Tanda Tangan & Stempel Resmi]
                </div>
                <p className="text-xs font-bold underline">{handbookMeta.signedBy}</p>
                {handbookMeta.signedNip && <p className="text-[10px] font-mono">NIP. {handbookMeta.signedNip}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-[11px] text-slate-500">Total {schoolRules.length} pasal terdaftar dalam sistem</span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Cetak PDF</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Rule Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteRule}
        title="Hapus Klausul Pasal Tata Tertib?"
        message={`Apakah Anda yakin ingin menghapus "${selectedRule?.articleNumber} - ${selectedRule?.title}"? Tindakan ini akan menghapus klausul ini dari buku tata tertib.`}
        confirmText="Ya, Hapus Pasal"
        type="danger"
      />

      {/* Confirm Reset to Defaults Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetToDefault}
        title="Reset Buku Tata Tertib ke Standar Baku Nasional?"
        message="Tindakan ini akan mengembalikan seluruh pasal, bobot poin, dan SK tata tertib ke standar baku nasional (Kemenag & Kemdikbudristek). Modifikasi lokal yang belum tersimpan akan ditimpa."
        confirmText="Ya, Reset Standar Baku"
        type="warning"
      />
    </div>
  );
};
