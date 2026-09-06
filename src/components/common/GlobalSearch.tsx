import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  User,
  Users,
  GraduationCap,
  Trophy,
  ShieldAlert,
  Calendar,
  ArrowRight,
  X,
  HeartHandshake,
  FileSpreadsheet,
  FileText,
  ClipboardCheck,
  BookOpenCheck,
  Settings,
  Shield,
  UserCog,
  Megaphone,
  Compass,
  Wallet,
  FileCheck,
  LayoutDashboard,
  Crown,
  CornerDownLeft,
  Sparkles,
  Command,
  Clock
} from 'lucide-react';
import { useSchool } from '../../contexts/SchoolContext';
import { useAuth } from '../../contexts/AuthContext';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: string, extraId?: string) => void;
}

type SearchCategory =
  | 'all'
  | 'students'
  | 'teachers'
  | 'ekskul'
  | 'activities'
  | 'counseling'
  | 'violations'
  | 'achievements'
  | 'navigation';

interface SearchResultItem {
  id: string;
  category: SearchCategory;
  categoryLabel: string;
  title: string;
  subtitle: string;
  metadata?: string;
  tabId: string;
  entityId?: string;
  icon: React.ComponentType<{ className?: string }>;
  colorScheme: {
    bg: string;
    text: string;
    border: string;
    badgeBg: string;
    badgeText: string;
  };
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const {
    students,
    teachers,
    extracurriculars,
    activities,
    violations,
    achievements,
    counseling,
    classes
  } = useSchool();

  const { canAccessTab } = useAuth();

  // Detect platform for keyboard shortcut display
  const isMac = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  }, []);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveCategory('all');
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // System navigation items
  const navigationItems = useMemo(() => {
    const rawPages = [
      { id: 'dashboard', label: 'Command Center / Dashboard', keywords: 'dashboard beranda statistik ikhtisar ringkasan kesiswaan home', icon: LayoutDashboard },
      { id: 'announcements', label: 'Pusat Pengumuman & Broadcast', keywords: 'pengumuman warta siaran notifikasi informasi surat edaran', icon: Megaphone },
      { id: 'students', label: 'Data Siswa & Rombel', keywords: 'siswa murid santri rombel kelas nis nisn biodata peserta didik', icon: Users },
      { id: 'teachers', label: 'Dewan Guru & Manajemen', keywords: 'guru ustadz pembina wali kelas pendidik staf nip dewan guru bimbingan', icon: UserCog },
      { id: 'osim', label: 'Pengurus & Proker OSIM', keywords: 'osim osis pengurus organisasi siswa proker rapat program kerja', icon: Crown },
      { id: 'extracurriculars', label: 'Manajemen Ekstrakurikuler', keywords: 'ekskul ekstra klub kegiatan minat bakat pramuka paskibra pmr', icon: Compass },
      { id: 'members', label: 'Daftar Anggota Ekstrakurikuler', keywords: 'anggota member siswa ekstra peserta ekskul daftar nama', icon: Users },
      { id: 'schedules', label: 'Jadwal & Kalender Kegiatan', keywords: 'jadwal kalender agenda waktu hari jam pelaksanaan', icon: Calendar },
      { id: 'attendance', label: 'Presensi Digital & Absensi', keywords: 'presensi absen absensi kehadiran rekap sakit izin alfa', icon: ClipboardCheck },
      { id: 'activities', label: 'Aktivitas Harian Kesiswaan', keywords: 'aktivitas kegiatan agenda event harian foto dokumentasi', icon: FileSpreadsheet },
      { id: 'reports', label: 'Laporan & Notula Kegiatan', keywords: 'laporan report notula lpj berkas administrasi rekap', icon: FileText },
      { id: 'rules', label: 'Buku Tata Tertib Siswa', keywords: 'tata tertib tatib peraturan aturan pasal sanksi poin buku saku', icon: BookOpenCheck },
      { id: 'violations', label: 'Pelanggaran & Disiplin Siswa', keywords: 'pelanggaran disiplin poin pelanggaran kasus sp surat peringatan hukum', icon: ShieldAlert },
      { id: 'counseling', label: 'Bimbingan Konseling (BK)', keywords: 'bk bimbingan konseling konselor guru bk home visit panggilan wali karir', icon: HeartHandshake },
      { id: 'achievements', label: 'Prestasi & Penghargaan Siswa', keywords: 'prestasi juara penghargaan lomba piala medali sertifikat piagam', icon: Trophy },
      { id: 'permissions', label: 'Dispensasi & Surat Izin', keywords: 'izin dispensasi surat izin meninggalkan madrasah sakit perizinan', icon: FileCheck },
      { id: 'cash', label: 'Neraca Kas & Keuangan Kesiswaan', keywords: 'kas uang keuangan saldo pemasukan pengeluaran bendahara kuitansi buku kas', icon: Wallet },
      { id: 'settings', label: 'Konfigurasi Sistem Madrasah', keywords: 'pengaturan setting konfigurasi madrasah logo kop surat info sekolah', icon: Settings },
      { id: 'cpanel', label: 'cPanel & Akses Akun Pengguna', keywords: 'cpanel akun user login password hak akses role perizinan pengguna', icon: Shield },
      { id: 'profile', label: 'Profil Saya & Pengaturan Akun', keywords: 'profil akun saya ganti password email info pengguna', icon: User }
    ];

    return rawPages.filter(p => canAccessTab(p.id));
  }, [canAccessTab]);

  // Compute all matching items
  const allResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list: SearchResultItem[] = [];

    // 1. Navigation Pages
    navigationItems.forEach(nav => {
      const matchLabel = nav.label.toLowerCase().includes(q);
      const matchKeywords = nav.keywords.toLowerCase().includes(q);
      if (!q || matchLabel || matchKeywords) {
        list.push({
          id: `nav_${nav.id}`,
          category: 'navigation',
          categoryLabel: 'Menu Halaman',
          title: nav.label,
          subtitle: `Buka halaman ${nav.label.split('/')[0].trim()}`,
          metadata: 'Navigasi Cepat',
          tabId: nav.id,
          icon: nav.icon,
          colorScheme: {
            bg: 'bg-blue-50 dark:bg-blue-950/40',
            text: 'text-blue-600 dark:text-blue-400',
            border: 'border-blue-200 dark:border-blue-800/60',
            badgeBg: 'bg-blue-100 dark:bg-blue-900/50',
            badgeText: 'text-blue-700 dark:text-blue-300'
          }
        });
      }
    });

    // 2. Teachers / Dewan Guru & Pembina
    (teachers || []).forEach(t => {
      const matchName = (t.fullName || '').toLowerCase().includes(q);
      const matchNip = (t.nip || '').toLowerCase().includes(q);
      const matchRole = (t.role || '').toLowerCase().includes(q);
      const matchSubject = (t.subject || '').toLowerCase().includes(q);
      const matchPhone = (t.phone || '').toLowerCase().includes(q);
      const matchEmail = (t.email || '').toLowerCase().includes(q);

      if (!q || matchName || matchNip || matchRole || matchSubject || matchPhone || matchEmail) {
        list.push({
          id: `teacher_${t.id}`,
          entityId: t.id,
          category: 'teachers',
          categoryLabel: 'Dewan Guru',
          title: t.fullName,
          subtitle: `${t.role || 'Guru'} • ${t.subject || 'Mata Pelajaran'}`,
          metadata: `NIP: ${t.nip || '-'} ${t.phone ? `• WA: ${t.phone}` : ''}`,
          tabId: 'teachers',
          icon: GraduationCap,
          colorScheme: {
            bg: 'bg-purple-50 dark:bg-purple-950/40',
            text: 'text-purple-600 dark:text-purple-400',
            border: 'border-purple-200 dark:border-purple-800/60',
            badgeBg: 'bg-purple-100 dark:bg-purple-900/50',
            badgeText: 'text-purple-700 dark:text-purple-300'
          }
        });
      }
    });

    // 3. Students / Siswa
    (students || []).forEach(s => {
      const matchName = (s.fullName || '').toLowerCase().includes(q);
      const matchNis = (s.nis || '').toLowerCase().includes(q);
      const matchNisn = (s.nisn || '').toLowerCase().includes(q);
      const matchClass = (s.className || '').toLowerCase().includes(q);
      const matchPhone = (s.phone || '').toLowerCase().includes(q);

      if (!q || matchName || matchNis || matchNisn || matchClass || matchPhone) {
        list.push({
          id: `student_${s.id}`,
          entityId: s.id,
          category: 'students',
          categoryLabel: 'Siswa',
          title: s.fullName,
          subtitle: `Kelas: ${s.className || '-'} • NIS: ${s.nis || '-'}`,
          metadata: `Status: ${s.status || 'Aktif'} ${s.nisn ? `• NISN: ${s.nisn}` : ''}`,
          tabId: 'students',
          icon: User,
          colorScheme: {
            bg: 'bg-emerald-50 dark:bg-emerald-950/40',
            text: 'text-emerald-600 dark:text-emerald-400',
            border: 'border-emerald-200 dark:border-emerald-800/60',
            badgeBg: 'bg-emerald-100 dark:bg-emerald-900/50',
            badgeText: 'text-emerald-700 dark:text-emerald-300'
          }
        });
      }
    });

    // 4. Extracurriculars
    (extracurriculars || []).forEach(e => {
      const matchName = (e.name || '').toLowerCase().includes(q);
      const matchCoach = (e.coachName || '').toLowerCase().includes(q);
      const matchCategory = (e.category || '').toLowerCase().includes(q);
      const matchDay = (e.day || '').toLowerCase().includes(q);
      const matchLoc = (e.location || '').toLowerCase().includes(q);

      if (!q || matchName || matchCoach || matchCategory || matchDay || matchLoc) {
        list.push({
          id: `ekskul_${e.id}`,
          entityId: e.id,
          category: 'ekskul',
          categoryLabel: 'Ekstrakurikuler',
          title: e.name,
          subtitle: `Kategori: ${e.category} • Pembina: ${e.coachName || '-'}`,
          metadata: `Jadwal: ${e.day || '-'} ${e.startTime || ''} ${e.location ? `(${e.location})` : ''}`,
          tabId: 'extracurriculars',
          icon: Compass,
          colorScheme: {
            bg: 'bg-amber-50 dark:bg-amber-950/40',
            text: 'text-amber-600 dark:text-amber-400',
            border: 'border-amber-200 dark:border-amber-800/60',
            badgeBg: 'bg-amber-100 dark:bg-amber-900/50',
            badgeText: 'text-amber-700 dark:text-amber-300'
          }
        });
      }
    });

    // 5. Activities / Kegiatan
    (activities || []).forEach(a => {
      const matchTitle = (a.title || '').toLowerCase().includes(q);
      const matchLocation = (a.location || '').toLowerCase().includes(q);
      const matchDesc = (a.description || '').toLowerCase().includes(q);
      const matchDate = (a.date || '').toLowerCase().includes(q);

      if (!q || matchTitle || matchLocation || matchDesc || matchDate) {
        list.push({
          id: `activity_${a.id}`,
          entityId: a.id,
          category: 'activities',
          categoryLabel: 'Kegiatan',
          title: a.title,
          subtitle: `Tanggal: ${a.date} • Lokasi: ${a.location || '-'}`,
          metadata: `Status: ${a.status || 'Terjadwal'} • ${a.description ? a.description.slice(0, 50) + '...' : ''}`,
          tabId: 'activities',
          icon: Calendar,
          colorScheme: {
            bg: 'bg-cyan-50 dark:bg-cyan-950/40',
            text: 'text-cyan-600 dark:text-cyan-400',
            border: 'border-cyan-200 dark:border-cyan-800/60',
            badgeBg: 'bg-cyan-100 dark:bg-cyan-900/50',
            badgeText: 'text-cyan-700 dark:text-cyan-300'
          }
        });
      }
    });

    // 6. Counseling / Layanan BK
    (counseling || []).forEach(c => {
      const matchStudent = (c.studentName || '').toLowerCase().includes(q);
      const matchCounselor = (c.counselorName || '').toLowerCase().includes(q);
      const matchTopic = (c.topic || '').toLowerCase().includes(q);
      const matchType = (c.counselingType || '').toLowerCase().includes(q);

      if (!q || matchStudent || matchCounselor || matchTopic || matchType) {
        list.push({
          id: `counseling_${c.id}`,
          entityId: c.id,
          category: 'counseling',
          categoryLabel: 'Layanan BK',
          title: `Konseling: ${c.studentName} (${c.studentClass})`,
          subtitle: `Konselor: ${c.counselorName} • Layanan: ${c.counselingType || 'Individu'}`,
          metadata: `Topik: ${c.topic || '-'} • Tanggal: ${c.date}`,
          tabId: 'counseling',
          icon: HeartHandshake,
          colorScheme: {
            bg: 'bg-teal-50 dark:bg-teal-950/40',
            text: 'text-teal-600 dark:text-teal-400',
            border: 'border-teal-200 dark:border-teal-800/60',
            badgeBg: 'bg-teal-100 dark:bg-teal-900/50',
            badgeText: 'text-teal-700 dark:text-teal-300'
          }
        });
      }
    });

    // 7. Violations / Pelanggaran
    (violations || []).forEach(v => {
      const matchStudent = (v.studentName || '').toLowerCase().includes(q);
      const matchClass = (v.studentClass || '').toLowerCase().includes(q);
      const matchType = (v.violationType || '').toLowerCase().includes(q);
      const matchCategory = (v.category || '').toLowerCase().includes(q);

      if (!q || matchStudent || matchClass || matchType || matchCategory) {
        list.push({
          id: `violation_${v.id}`,
          entityId: v.id,
          category: 'violations',
          categoryLabel: 'Pelanggaran',
          title: `${v.studentName} (${v.studentClass})`,
          subtitle: `${v.violationType} • +${v.points} Poin`,
          metadata: `Kategori: ${v.category} • Tanggal: ${v.date}`,
          tabId: 'violations',
          icon: ShieldAlert,
          colorScheme: {
            bg: 'bg-rose-50 dark:bg-rose-950/40',
            text: 'text-rose-600 dark:text-rose-400',
            border: 'border-rose-200 dark:border-rose-800/60',
            badgeBg: 'bg-rose-100 dark:bg-rose-900/50',
            badgeText: 'text-rose-700 dark:text-rose-300'
          }
        });
      }
    });

    // 8. Achievements / Prestasi
    (achievements || []).forEach(ach => {
      const matchTitle = (ach.title || '').toLowerCase().includes(q);
      const matchStudent = (ach.studentName || '').toLowerCase().includes(q);
      const matchRank = (ach.rank || '').toLowerCase().includes(q);
      const matchLevel = (ach.level || '').toLowerCase().includes(q);

      if (!q || matchTitle || matchStudent || matchRank || matchLevel) {
        list.push({
          id: `ach_${ach.id}`,
          entityId: ach.id,
          category: 'achievements',
          categoryLabel: 'Prestasi',
          title: ach.title,
          subtitle: `Peraih: ${ach.studentName} (${ach.studentClass})`,
          metadata: `Peringkat: ${ach.rank} • Tingkat: ${ach.level} • ${ach.date}`,
          tabId: 'achievements',
          icon: Trophy,
          colorScheme: {
            bg: 'bg-orange-50 dark:bg-orange-950/40',
            text: 'text-orange-600 dark:text-orange-400',
            border: 'border-orange-200 dark:border-orange-800/60',
            badgeBg: 'bg-orange-100 dark:bg-orange-900/50',
            badgeText: 'text-orange-700 dark:text-orange-300'
          }
        });
      }
    });

    // 9. Classes / Rombel
    (classes || []).forEach(c => {
      const matchName = (c.name || '').toLowerCase().includes(q);
      const matchTeacher = (c.homeroomTeacher || '').toLowerCase().includes(q);
      if (!q || matchName || matchTeacher) {
        list.push({
          id: `class_${c.id}`,
          entityId: c.id,
          category: 'students',
          categoryLabel: 'Kelas & Rombel',
          title: `Rombel: ${c.name}`,
          subtitle: `Wali Kelas: ${c.homeroomTeacher || 'Belum Ditentukan'}`,
          metadata: `Tingkat: ${c.grade} • Jurusan: ${c.major || 'Umum'}`,
          tabId: 'students',
          icon: Users,
          colorScheme: {
            bg: 'bg-emerald-50 dark:bg-emerald-950/40',
            text: 'text-emerald-600 dark:text-emerald-400',
            border: 'border-emerald-200 dark:border-emerald-800/60',
            badgeBg: 'bg-emerald-100 dark:bg-emerald-900/50',
            badgeText: 'text-emerald-700 dark:text-emerald-300'
          }
        });
      }
    });

    return list;
  }, [query, navigationItems, teachers, students, extracurriculars, activities, counseling, violations, achievements, classes]);

  // Filtered by selected category chip
  const filteredResults = useMemo(() => {
    if (activeCategory === 'all') {
      if (!query.trim()) {
        return allResults.filter(item => item.category === 'navigation').slice(0, 8);
      }
      return allResults;
    }
    return allResults.filter(item => item.category === activeCategory);
  }, [allResults, activeCategory, query]);

  // Result counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: 0,
      students: (students || []).length,
      teachers: (teachers || []).length,
      ekskul: (extracurriculars || []).length,
      activities: (activities || []).length,
      counseling: (counseling || []).length,
      violations: (violations || []).length,
      achievements: (achievements || []).length,
      navigation: navigationItems.length
    };

    if (query.trim()) {
      const searchCounts: Record<string, number> = {
        all: allResults.length,
        students: 0,
        teachers: 0,
        ekskul: 0,
        activities: 0,
        counseling: 0,
        violations: 0,
        achievements: 0,
        navigation: 0
      };
      allResults.forEach(item => {
        if (searchCounts[item.category] !== undefined) {
          searchCounts[item.category]++;
        }
      });
      return searchCounts;
    }

    counts.all =
      counts.navigation +
      counts.students +
      counts.teachers +
      counts.ekskul +
      counts.activities +
      counts.counseling +
      counts.violations +
      counts.achievements;

    return counts;
  }, [allResults, query, students, teachers, extracurriculars, activities, counseling, violations, achievements, navigationItems]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : 0));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : Math.max(0, filteredResults.length - 1)));
        return;
      }

      if (e.key === 'Enter') {
        if (filteredResults.length > 0 && filteredResults[selectedIndex]) {
          e.preventDefault();
          const target = filteredResults[selectedIndex];
          handleSelectItem(target);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex, onNavigate, onClose]);

  const handleSelectItem = (item: SearchResultItem) => {
    const rawId = item.entityId || item.id.replace(/^[a-z]+_/, '');
    const detail = {
      category: item.category,
      id: item.id,
      rawId,
      entityId: item.entityId || rawId,
      title: item.title,
      tabId: item.tabId
    };

    try {
      sessionStorage.setItem('pending_search_select', JSON.stringify(detail));
    } catch (e) {
      console.warn('Could not set pending_search_select in sessionStorage', e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('app:search-select', { detail })
      );
    }
    onNavigate(item.tabId, rawId);
    onClose();
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const categoriesList: { key: SearchCategory; label: string; count: number }[] = [
    { key: 'all', label: 'Semua', count: categoryCounts.all },
    { key: 'navigation', label: 'Menu', count: categoryCounts.navigation },
    { key: 'students', label: 'Siswa', count: categoryCounts.students },
    { key: 'teachers', label: 'Dewan Guru', count: categoryCounts.teachers },
    { key: 'ekskul', label: 'Ekstrakurikuler', count: categoryCounts.ekskul },
    { key: 'activities', label: 'Kegiatan', count: categoryCounts.activities },
    { key: 'counseling', label: 'Layanan BK', count: categoryCounts.counseling },
    { key: 'violations', label: 'Pelanggaran', count: categoryCounts.violations },
    { key: 'achievements', label: 'Prestasi', count: categoryCounts.achievements }
  ];

  return createPortal(
    <div className="fixed inset-0 z-[99999] overflow-y-auto font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity cursor-pointer pointer-events-auto"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Alignment container strictly ABOVE backdrop */}
      <div className="relative z-10 min-h-full flex items-start justify-center p-3 sm:p-4 pt-6 sm:pt-12 text-left pointer-events-none">
        <div
          className="relative z-20 w-full max-w-2xl bg-white dark:bg-[#0e1526] rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xl text-slate-900 dark:text-slate-100 overflow-hidden transform transition-all pointer-events-auto flex flex-col max-h-[85vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header & Integrated Search Input Box */}
          <div className="p-3 sm:p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-[#0a101d] flex items-center gap-2.5">
            <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-white dark:bg-[#151c2e] border border-slate-300 dark:border-slate-700/80 rounded-xl shadow-2xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <Search className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Cari siswa, dewan guru, ekstrakurikuler, kegiatan..."
                className="search-input w-full text-sm sm:text-base bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 font-medium"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                  title="Hapus kata kunci"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shrink-0 flex items-center gap-1.5"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Tutup</span>
            </button>
          </div>

          {/* Filter Chips Bar */}
          <div className="px-3 sm:px-4 py-2 border-b border-slate-100 dark:border-slate-800/70 bg-white dark:bg-[#0b1120] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {categoriesList
              .filter(cat => cat.key === 'all' || cat.count > 0 || !query.trim())
              .map(cat => {
                const isActive = activeCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>{cat.label}</span>
                    {cat.count > 0 && (
                      <span
                        className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                          isActive
                            ? 'bg-white/25 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {cat.count}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>

          {/* Results List */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1 text-xs divide-y divide-slate-100/60 dark:divide-slate-800/40">
            {/* Empty Query State on 'all': Fast Suggestions & Quick Student Access */}
            {!query.trim() && activeCategory === 'all' && (
              <div className="p-3 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      Pintasan Menu Cepat
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {isMac ? '⌘K' : 'Ctrl+K'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {navigationItems.slice(0, 6).map((nav, idx) => {
                      const Icon = nav.icon;
                      return (
                        <button
                          key={nav.id}
                          data-index={idx}
                          onClick={() => {
                            onNavigate(nav.id);
                            onClose();
                          }}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group ${
                            selectedIndex === idx
                              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 shadow-xs'
                              : 'bg-slate-50/70 dark:bg-slate-850/40 border-slate-200/70 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/30'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <p className="font-bold text-slate-800 dark:text-slate-200 text-xs group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                                {nav.label.split('/')[0].trim()}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                Buka modul kerja
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Student Access under 'all' */}
                {students && students.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-500" />
                        Akses Cepat Siswa ({students.length} Siswa Terdaftar)
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveCategory('students')}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Lihat Semua Siswa →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {students.slice(0, 6).map(s => (
                        <button
                          key={s.id}
                          onClick={() =>
                            handleSelectItem({
                              id: `student_${s.id}`,
                              entityId: s.id,
                              category: 'students',
                              categoryLabel: 'Siswa',
                              title: s.fullName,
                              subtitle: `Kelas: ${s.className || '-'} • NIS: ${s.nis || '-'}`,
                              tabId: 'students',
                              icon: User,
                              colorScheme: {
                                bg: 'bg-emerald-50 dark:bg-emerald-950/40',
                                text: 'text-emerald-600 dark:text-emerald-400',
                                border: 'border-emerald-200 dark:border-emerald-800/60',
                                badgeBg: 'bg-emerald-100 dark:bg-emerald-900/50',
                                badgeText: 'text-emerald-700 dark:text-emerald-300'
                              }
                            })
                          }
                          className="w-full text-left p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 transition-all flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                              {(s.fullName || 'S').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="truncate">
                              <p className="font-bold text-slate-800 dark:text-slate-200 text-xs group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                                {s.fullName}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {s.className || 'Kelas -'} • NIS: {s.nis || '-'}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>💡 Ketikkan kata kunci untuk mencari Siswa, Guru BK/Pembina, Ekstrakurikuler, atau Kegiatan.</span>
                </div>
              </div>
            )}

            {/* Query Has No Results */}
            {query.trim() && filteredResults.length === 0 && (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
                  <Search className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Tidak Ditemukan Data untuk "{query}"
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Coba periksa ejaan nama, gunakan NIS/NIP, atau cari kategori umum seperti <em>siswa</em>, <em>guru</em>, <em>bk</em>, <em>ekskul</em>, atau <em>jadwal</em>.
                </p>
              </div>
            )}

            {/* Results rendering */}
            {(query.trim() || activeCategory !== 'all') && filteredResults.length > 0 && (
              <div className="space-y-1">
                {!query.trim() && (
                  <div className="px-2 py-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>
                      Daftar {categoriesList.find(c => c.key === activeCategory)?.label} ({filteredResults.length})
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Klik untuk membuka detail</span>
                  </div>
                )}
                {filteredResults.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = selectedIndex === idx;

                  return (
                    <button
                      key={item.id}
                      data-index={idx}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left p-2.5 sm:p-3 rounded-xl border transition-all flex items-center justify-between group ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400 dark:border-blue-600 shadow-xs'
                          : 'bg-transparent border-transparent hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Category Icon */}
                        <div
                          className={`w-9 h-9 rounded-xl ${item.colorScheme.bg} border ${item.colorScheme.border} flex items-center justify-center ${item.colorScheme.text} shrink-0 mt-0.5`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        {/* Text Information */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-md tracking-wider ${item.colorScheme.badgeBg} ${item.colorScheme.badgeText}`}
                            >
                              {item.categoryLabel}
                            </span>
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                              {item.title}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                            {item.subtitle}
                          </p>

                          {item.metadata && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                              {item.metadata}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Navigation Hint */}
                      <div className="flex items-center gap-1.5 ml-3 shrink-0">
                        {isSelected && (
                          <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-200 rounded">
                            Tekan ↵
                          </span>
                        )}
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer with Keyboard Hints & Count */}
          <div className="px-3.5 sm:px-4 py-2.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-[#0f172a]/70 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
                  ↑
                </kbd>
                <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
                  ↓
                </kbd>
                <span className="hidden sm:inline">Navigasi</span>
              </span>

              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
                  ↵
                </kbd>
                <span className="hidden sm:inline">Buka</span>
              </span>

              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
                  ESC
                </kbd>
                <span className="hidden sm:inline">Tutup</span>
              </span>
            </div>

            <div className="font-semibold text-slate-600 dark:text-slate-400">
              {query.trim() ? (
                <span>
                  {filteredResults.length} hasil ditemukan
                </span>
              ) : (
                <span>Ketik pencarian cepat</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
