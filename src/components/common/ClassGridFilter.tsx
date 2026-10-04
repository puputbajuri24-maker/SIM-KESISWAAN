import React, { useState, useMemo } from 'react';
import {
  Grid,
  School,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  Users,
  Filter,
  ArrowUpDown,
  X
} from 'lucide-react';
import { SchoolClass } from '../../types';
import { sortClasses, ClassSortOrder, deduplicateClassesList } from '../../utils/classResolver';

export interface ClassGridFilterProps {
  classes: SchoolClass[];
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  countsByClassId?: Record<string, number>;
  totalCount?: number;
  label?: string;
  itemUnit?: string; // e.g. "Siswa", "Kasus", "Prestasi", "Presensi"
  showGradeTabs?: boolean;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  defaultSortOrder?: ClassSortOrder;
  colorScheme?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky';
  className?: string;
}

export const ClassGridFilter: React.FC<ClassGridFilterProps> = ({
  classes,
  selectedClassId,
  onSelectClass,
  countsByClassId = {},
  totalCount,
  label = 'Filter Rombongan Belajar (Rombel / Kelas)',
  itemUnit = 'Data',
  showGradeTabs = true,
  isCollapsible = true,
  defaultExpanded = true,
  defaultSortOrder = 'classification',
  colorScheme = 'indigo',
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedGrade, setSelectedGrade] = useState<'all' | 'X' | 'XI' | 'XII'>('all');
  const [classSortOrder, setClassSortOrder] = useState<ClassSortOrder>(defaultSortOrder);
  const [searchQuery, setSearchQuery] = useState('');

  // Deduplicate classes list to guarantee strictly 1 card per distinct class name
  const cleanClasses = useMemo(() => {
    return deduplicateClassesList(classes).deduplicated;
  }, [classes]);

  // Calculate distinct grades present in the classes
  const availableGrades = useMemo(() => {
    const gradesSet = new Set<string>();
    cleanClasses.forEach(c => {
      if (c.grade) gradesSet.add(c.grade);
    });
    return Array.from(gradesSet).sort();
  }, [cleanClasses]);

  // Filter classes based on grade and search query, then sort per chosen order
  const filteredClasses = useMemo(() => {
    const filtered = cleanClasses.filter(c => {
      const matchGrade = selectedGrade === 'all' || c.grade === selectedGrade;
      const matchSearch =
        !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.major && c.major.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.homeroomTeacherName && c.homeroomTeacherName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchGrade && matchSearch;
    });

    return sortClasses(filtered, classSortOrder, countsByClassId);
  }, [cleanClasses, selectedGrade, searchQuery, classSortOrder, countsByClassId]);

  // Computed total count if not provided
  const computedTotal = useMemo(() => {
    if (typeof totalCount === 'number') return totalCount;
    const validClassIds = new Set(cleanClasses.map(c => c.id));
    if (validClassIds.size > 0) {
      return Object.entries(countsByClassId).reduce((acc: number, [key, val]) => {
        if (validClassIds.has(key)) {
          return acc + (Number(val) || 0);
        }
        return acc;
      }, 0);
    }
    return Object.values(countsByClassId).reduce((acc: number, curr) => acc + (Number(curr) || 0), 0);
  }, [totalCount, countsByClassId, cleanClasses]);

  // Color scheme mappings
  const schemeStyles = {
    indigo: {
      activeBorder: 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200',
      activeBadge: 'bg-indigo-600 text-white',
      gradeActive: 'bg-indigo-600 text-white',
      accentText: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
      tagBg: 'bg-indigo-100/70 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
    },
    emerald: {
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200',
      activeBadge: 'bg-emerald-600 text-white',
      gradeActive: 'bg-emerald-600 text-white',
      accentText: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
      tagBg: 'bg-emerald-100/70 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
    },
    amber: {
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200',
      activeBadge: 'bg-amber-600 text-white',
      gradeActive: 'bg-amber-600 text-white',
      accentText: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
      tagBg: 'bg-amber-100/70 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
    },
    rose: {
      activeBorder: 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200',
      activeBadge: 'bg-rose-600 text-white',
      gradeActive: 'bg-rose-600 text-white',
      accentText: 'text-rose-600 dark:text-rose-400',
      iconBg: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
      tagBg: 'bg-rose-100/70 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
    },
    violet: {
      activeBorder: 'border-violet-500 ring-2 ring-violet-500/20 bg-violet-50/80 dark:bg-violet-950/40 text-violet-900 dark:text-violet-200',
      activeBadge: 'bg-violet-600 text-white',
      gradeActive: 'bg-violet-600 text-white',
      accentText: 'text-violet-600 dark:text-violet-400',
      iconBg: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
      tagBg: 'bg-violet-100/70 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
    },
    sky: {
      activeBorder: 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/80 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200',
      activeBadge: 'bg-sky-600 text-white',
      gradeActive: 'bg-sky-600 text-white',
      accentText: 'text-sky-600 dark:text-sky-400',
      iconBg: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
      tagBg: 'bg-sky-100/70 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
    }
  };

  const scheme = schemeStyles[colorScheme] || schemeStyles.indigo;

  // Selected class object
  const activeClassObj = cleanClasses.find(c => c.id === selectedClassId || c.name === selectedClassId);

  return (
    <div
      className={`rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition-all ${className}`}
    >
      {/* Header bar */}
      <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${scheme.iconBg}`}>
            <Grid className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                {label}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {cleanClasses.length} Rombel
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {selectedClassId === 'all' ? (
                <span>Menampilkan seluruh kelas ({computedTotal} {itemUnit})</span>
              ) : (
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  Terpilih: {activeClassObj?.name || selectedClassId} ({countsByClassId[selectedClassId] || countsByClassId[activeClassObj?.id || ''] || 0} {itemUnit})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedClassId !== 'all' && (
            <button
              onClick={() => onSelectClass('all')}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-rose-300 flex items-center gap-1 transition-colors"
              title="Reset ke Semua Kelas"
            >
              <X className="w-3 h-3" />
              <span>Reset Filter</span>
            </button>
          )}

          {isCollapsible && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title={isExpanded ? 'Sembunyikan Grid Kelas' : 'Tampilkan Grid Kelas'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Grid Content */}
      {isExpanded && (
        <div className="p-4 space-y-3.5">
          {/* Sub-bar: Grade Selector & Class Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800/80">
            {showGradeTabs && (
              <div className="flex items-center flex-wrap gap-1">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-slate-500 dark:text-slate-400" /> Tingkat:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedGrade('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedGrade === 'all'
                      ? scheme.gradeActive + ' shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Semua ({cleanClasses.length})
                </button>
                {['X', 'XI', 'XII'].map(grade => {
                  const countInGrade = cleanClasses.filter(c => c.grade === grade).length;
                  if (countInGrade === 0 && !availableGrades.includes(grade)) return null;
                  return (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => setSelectedGrade(grade as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        selectedGrade === grade
                          ? scheme.gradeActive + ' shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      Kelas {grade} ({countInGrade})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Right Controls: Sort Order & Quick search class */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Sort Order Selector */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold hidden sm:inline flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-slate-500 dark:text-slate-400" /> Urutkan:
                </span>
                <select
                  value={classSortOrder}
                  onChange={e => setClassSortOrder(e.target.value as ClassSortOrder)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer"
                  title="Urutkan Rombel Kelas"
                >
                  <option value="classification">🏷️ Tingkat (X ➔ XI ➔ XII) & Abjad</option>
                  <option value="name-asc">🔤 Abjad Rombel (A ➔ Z)</option>
                  <option value="name-desc">🔡 Abjad Rombel (Z ➔ A)</option>
                  <option value="count-desc">👥 Jumlah {itemUnit} Terbanyak</option>
                </select>
              </div>

              {/* Quick search class */}
              <div className="relative min-w-[160px] sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari rombel/wali..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Class Grid Cards */}
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2">
            {/* "Semua Kelas" Primary Button */}
            <button
              type="button"
              onClick={() => onSelectClass('all')}
              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all group relative ${
                selectedClassId === 'all'
                  ? scheme.activeBorder + ' shadow-xs font-bold'
                  : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-1 mb-1">
                <span className="text-xs font-bold leading-tight">
                  Semua Kelas
                </span>
                {selectedClassId === 'all' && (
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${scheme.accentText}`} />
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span className="truncate">Total Rombel</span>
                <span className="font-semibold px-1.5 py-0.2 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                  {computedTotal}
                </span>
              </div>
            </button>

            {/* Individual Classes */}
            {filteredClasses.map(cls => {
              const isSelected = selectedClassId === cls.id || selectedClassId === cls.name;
              const count = countsByClassId[cls.id] ?? countsByClassId[cls.name] ?? 0;

              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => onSelectClass(cls.id)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all group relative ${
                    isSelected
                      ? scheme.activeBorder + ' shadow-xs'
                      : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/90 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-xs font-extrabold truncate" title={cls.name}>
                      {cls.name}
                    </span>
                    {isSelected ? (
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${scheme.accentText}`} />
                    ) : (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 shrink-0">
                        {cls.grade}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    <span className="truncate text-[10px] text-slate-600 dark:text-slate-400 font-medium max-w-[65px]" title={cls.homeroomTeacherName || cls.major || ''}>
                      {cls.homeroomTeacherName ? cls.homeroomTeacherName.split(' ')[0] : (cls.major || cls.grade)}
                    </span>
                    <span
                      className={`font-semibold px-1.5 py-0.2 rounded-md text-[10px] shrink-0 ${
                        count > 0
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                          : 'bg-slate-100/60 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredClasses.length === 0 && (
            <div className="text-center py-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
              Tidak ada rombel kelas yang sesuai dengan pencarian atau tingkat terpilih.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
