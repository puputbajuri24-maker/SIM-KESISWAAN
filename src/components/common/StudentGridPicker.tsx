import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Users,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  School,
  AlertTriangle,
  UserCheck,
  RotateCcw
} from 'lucide-react';
import { Student, SchoolClass } from '../../types';

export interface StudentGridPickerProps {
  students: Student[];
  classes?: SchoolClass[];
  selectedStudentId?: string;
  onSelectStudent: (student: Student) => void;
  label?: string;
  required?: boolean;
  colorScheme?: 'pink' | 'indigo' | 'emerald' | 'amber' | 'cyan';
  getStudentViolationPoints?: (studentId: string) => number;
  className?: string;
}

export const StudentGridPicker: React.FC<StudentGridPickerProps> = ({
  students,
  classes = [],
  selectedStudentId,
  onSelectStudent,
  label = 'PILIH SISWA TERBIMBING',
  required = true,
  colorScheme = 'pink',
  getStudentViolationPoints,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<'all' | 'X' | 'XI' | 'XII'>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [isGridOpen, setIsGridOpen] = useState<boolean>(!selectedStudentId);

  // Synchronize open state if selectedStudentId is cleared (e.g. new form opened)
  useEffect(() => {
    if (!selectedStudentId) {
      setIsGridOpen(true);
    }
  }, [selectedStudentId]);

  // Identify currently selected student
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find(s => s.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  // Color theme classes mapping
  const colors = useMemo(() => {
    switch (colorScheme) {
      case 'pink':
        return {
          primary: 'text-pink-500 dark:text-pink-400',
          borderActive: 'border-pink-500 dark:border-pink-500',
          bgActive: 'bg-pink-50 dark:bg-pink-500/10',
          ring: 'ring-pink-500/50',
          badge: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300 border-pink-200 dark:border-pink-500/40',
          buttonActive: 'bg-pink-600 text-white border-pink-600 shadow-sm shadow-pink-600/30',
          avatarBg: 'bg-gradient-to-br from-pink-500 to-rose-600 text-white'
        };
      case 'indigo':
        return {
          primary: 'text-indigo-500 dark:text-indigo-400',
          borderActive: 'border-indigo-500 dark:border-indigo-500',
          bgActive: 'bg-indigo-50 dark:bg-indigo-500/10',
          ring: 'ring-indigo-500/50',
          badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/40',
          buttonActive: 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/30',
          avatarBg: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
        };
      case 'emerald':
        return {
          primary: 'text-emerald-500 dark:text-emerald-400',
          borderActive: 'border-emerald-500 dark:border-emerald-500',
          bgActive: 'bg-emerald-50 dark:bg-emerald-500/10',
          ring: 'ring-emerald-500/50',
          badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/40',
          buttonActive: 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/30',
          avatarBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
        };
      case 'amber':
        return {
          primary: 'text-amber-500 dark:text-amber-400',
          borderActive: 'border-amber-500 dark:border-amber-500',
          bgActive: 'bg-amber-50 dark:bg-amber-500/10',
          ring: 'ring-amber-500/50',
          badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200 dark:border-amber-500/40',
          buttonActive: 'bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-600/30',
          avatarBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
        };
      default:
        return {
          primary: 'text-cyan-500 dark:text-cyan-400',
          borderActive: 'border-cyan-500 dark:border-cyan-500',
          bgActive: 'bg-cyan-50 dark:bg-cyan-500/10',
          ring: 'ring-cyan-500/50',
          badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/40',
          buttonActive: 'bg-cyan-600 text-white border-cyan-600 shadow-sm shadow-cyan-600/30',
          avatarBg: 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white'
        };
    }
  }, [colorScheme]);

  // Extract distinct class list with student count
  const classOptions = useMemo(() => {
    const map = new Map<string, number>();
    students.forEach(s => {
      const cName = s.className ? s.className.trim() : 'Tanpa Kelas';
      map.set(cName, (map.get(cName) || 0) + 1);
    });

    const list: { name: string; count: number; grade: string }[] = [];
    map.forEach((count, name) => {
      let grade = 'other';
      if (/^XII\b/i.test(name)) grade = 'XII';
      else if (/^XI\b/i.test(name)) grade = 'XI';
      else if (/^X\b/i.test(name)) grade = 'X';
      list.push({ name, count, grade });
    });

    // Sort classes naturally: X before XI before XII, then alphabetical
    list.sort((a, b) => {
      const gradeOrder: Record<string, number> = { X: 1, XI: 2, XII: 3, other: 4 };
      const orderA = gradeOrder[a.grade] || 99;
      const orderB = gradeOrder[b.grade] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });

    return list;
  }, [students]);

  // Filter students based on Grade, Class filter, and Search Query
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return students.filter(s => {
      // 1. Grade filter
      if (selectedGrade !== 'all') {
        const cName = (s.className || '').trim().toUpperCase();
        if (selectedGrade === 'X' && !cName.startsWith('X ') && cName !== 'X' && !cName.startsWith('X-')) {
          return false;
        }
        if (selectedGrade === 'XI' && !cName.startsWith('XI ') && cName !== 'XI' && !cName.startsWith('XI-')) {
          return false;
        }
        if (selectedGrade === 'XII' && !cName.startsWith('XII ') && cName !== 'XII' && !cName.startsWith('XII-')) {
          return false;
        }
      }

      // 2. Class filter
      if (selectedClassFilter !== 'all') {
        if ((s.className || '').trim() !== selectedClassFilter) {
          return false;
        }
      }

      // 3. Search query
      if (q) {
        const matchName = (s.fullName || '').toLowerCase().includes(q);
        const matchNis = (s.nis || '').toLowerCase().includes(q);
        const matchNisn = (s.nisn || '').toLowerCase().includes(q);
        const matchClass = (s.className || '').toLowerCase().includes(q);
        return matchName || matchNis || matchNisn || matchClass;
      }

      return true;
    });
  }, [students, selectedGrade, selectedClassFilter, searchQuery]);

  // Helper for 2-letter initials
  const getInitials = (name?: string) => {
    if (!name) return 'SW';
    const words = name.trim().replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
    if (words.length === 0) return 'SW';
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  return (
    <div className={`space-y-2 font-sans ${className}`}>
      {/* Label and Toggle Button */}
      <div className="flex items-center justify-between">
        <label className="block font-mono text-[10px] text-slate-700 dark:text-zinc-400 uppercase tracking-wider font-bold">
          {label} {required && <span className="text-pink-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setIsGridOpen(prev => !prev)}
          className="text-[11px] font-mono text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1 transition-colors"
        >
          <span>{isGridOpen ? 'Sembunyikan Grid' : 'Buka Grid Siswa'}</span>
          {isGridOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Selected Student Banner (if any) */}
      {selectedStudent && (
        <div className={`p-2.5 rounded-xl border ${colors.borderActive} ${colors.bgActive} flex items-center justify-between gap-3 transition-all shadow-xs`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-xl ${colors.avatarBg} flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-xs`}>
              {getInitials(selectedStudent.fullName)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[220px] sm:max-w-[320px]">
                  {selectedStudent.fullName}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 font-semibold">
                  {selectedStudent.className || 'Tanpa Kelas'}
                </span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                  NIS: {selectedStudent.nis || '-'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-zinc-400 mt-0.5">
                <span>{selectedStudent.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                {getStudentViolationPoints && (
                  <>
                    <span>•</span>
                    <span className="font-mono">
                      {(() => {
                        const pts = getStudentViolationPoints(selectedStudent.id);
                        if (pts === 0) return <span className="text-emerald-600 dark:text-emerald-400 font-bold">0 Poin (Disiplin)</span>;
                        if (pts < 20) return <span className="text-amber-600 dark:text-amber-400 font-bold">+{pts} Poin Pelanggaran</span>;
                        return <span className="text-red-600 dark:text-red-400 font-bold">+{pts} Poin (Perhatian Khusus)</span>;
                      })()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800/60 font-semibold">
              <UserCheck className="w-3 h-3" />
              <span>Terpilih</span>
            </span>
            <button
              type="button"
              onClick={() => setIsGridOpen(true)}
              className="px-2.5 py-1 text-[10px] font-mono rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-zinc-600 transition-colors"
              title="Ganti Siswa"
            >
              Ganti Siswa
            </button>
          </div>
        </div>
      )}

      {/* Grid Picker Container */}
      {isGridOpen && (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141417] border border-slate-200 dark:border-[#27272a] space-y-2.5 transition-all shadow-inner">
          {/* 1. Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari cepat nama siswa, NIS, atau rombel kelas..."
              className="w-full pl-8 pr-8 py-1.5 text-xs rounded-xl bg-white dark:bg-[#1c1c20] border border-slate-200 dark:border-[#323238] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-colors font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white p-0.5"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. Grade Filter Tabs & Reset */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5 text-[11px] font-mono">
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 mr-1 shrink-0 flex items-center gap-1 font-semibold">
                <School className="w-3 h-3" /> Jenjang:
              </span>
              {(['all', 'X', 'XI', 'XII'] as const).map(gr => {
                const isActive = selectedGrade === gr;
                return (
                  <button
                    key={gr}
                    type="button"
                    onClick={() => {
                      setSelectedGrade(gr);
                      setSelectedClassFilter('all');
                    }}
                    className={`px-2 py-0.5 rounded-lg font-semibold transition-all shrink-0 ${
                      isActive
                        ? colors.buttonActive
                        : 'bg-white dark:bg-[#1c1c20] text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-[#2e2e34]'
                    }`}
                  >
                    {gr === 'all' ? 'Semua Jenjang' : `Kelas ${gr}`}
                  </button>
                );
              })}
            </div>

            {(selectedGrade !== 'all' || selectedClassFilter !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedGrade('all');
                  setSelectedClassFilter('all');
                  setSearchQuery('');
                }}
                className="text-[10px] text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1 shrink-0 font-semibold"
                title="Reset Semua Filter"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* 3. Class Filter Pills with Counts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-mono custom-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedClassFilter('all')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors shrink-0 ${
                selectedClassFilter === 'all'
                  ? 'bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold'
                  : 'bg-white dark:bg-[#1c1c20] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 border border-slate-200 dark:border-[#2e2e34]'
              }`}
            >
              Semua Rombel ({students.length})
            </button>
            {classOptions
              .filter(c => selectedGrade === 'all' || c.grade === selectedGrade)
              .map(c => {
                const isActive = selectedClassFilter === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedClassFilter(c.name)}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors shrink-0 ${
                      isActive
                        ? `${colors.buttonActive} font-bold`
                        : 'bg-white dark:bg-[#1c1c20] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 border border-slate-200 dark:border-[#2e2e34]'
                    }`}
                  >
                    {c.name} ({c.count})
                  </button>
                );
              })}
          </div>

          {/* 4. Student Grid List */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-zinc-400 px-1">
              <span>Menampilkan {filteredStudents.length} dari {students.length} siswa</span>
              {selectedStudent && (
                <span className="text-slate-400 dark:text-zinc-400 italic">
                  Klik kartu untuk memilih
                </span>
              )}
            </div>

            {filteredStudents.length === 0 ? (
              <div className="p-6 rounded-xl bg-white dark:bg-[#19191d] border border-dashed border-slate-200 dark:border-[#2f2f36] text-center text-slate-500 dark:text-zinc-400 text-xs">
                <Users className="w-6 h-6 mx-auto mb-1.5 text-slate-400 dark:text-zinc-500" />
                <p className="font-semibold text-slate-700 dark:text-zinc-300">Tidak ada siswa yang cocok</p>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                  Coba sesuaikan kata kunci pencarian atau ubah filter jenjang/kelas di atas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1.5 rounded-xl bg-slate-100/70 dark:bg-[#17171a] border border-slate-200/80 dark:border-[#26262b] custom-scrollbar">
                {filteredStudents.map(st => {
                  const isSelected = st.id === selectedStudentId;
                  const pts = getStudentViolationPoints ? getStudentViolationPoints(st.id) : (st.violationPoints || 0);

                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        onSelectStudent(st);
                        // Automatically close grid on small screen to keep form compact
                        if (typeof window !== 'undefined' && window.innerWidth < 640) {
                          setIsGridOpen(false);
                        }
                      }}
                      className={`p-2.5 rounded-xl text-left transition-all border flex items-center gap-2.5 relative group cursor-pointer ${
                        isSelected
                          ? `${colors.borderActive} ${colors.bgActive} shadow-xs ring-1 ${colors.ring}`
                          : 'bg-white dark:bg-[#1c1c20] border-slate-200 dark:border-[#2e2e34] hover:border-slate-400 dark:hover:border-zinc-500 hover:bg-slate-50 dark:hover:bg-[#222227]'
                      }`}
                    >
                      {/* Initials Avatar */}
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-[11px] shrink-0 transition-transform group-hover:scale-105 shadow-xs ${
                          isSelected
                            ? colors.avatarBg
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700'
                        }`}
                      >
                        {getInitials(st.fullName)}
                      </div>

                      {/* Student Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-pink-600 dark:text-pink-400' : 'text-slate-800 dark:text-zinc-200'}`}>
                            {st.fullName}
                          </p>
                          {isSelected && (
                            <CheckCircle2 className={`w-3.5 h-3.5 ${colors.primary} shrink-0`} />
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 dark:text-zinc-400 mt-0.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold border border-slate-200 dark:border-zinc-700/60 text-[9px]">
                            {st.className || 'Tanpa Kelas'}
                          </span>
                          <span className="truncate max-w-[85px]">
                            NIS: {st.nis || '-'}
                          </span>
                        </div>

                        {/* Points badge if present */}
                        {pts > 0 && (
                          <div className="mt-1 flex items-center gap-1">
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1 py-0.2 rounded border border-amber-200 dark:border-amber-800/40">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>+{pts} Poin</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
