import React, { useState, useEffect, useMemo } from 'react';
import { Search, User, Trophy, ShieldAlert, Activity, Calendar, ArrowRight, X } from 'lucide-react';
import { useSchool } from '../../contexts/SchoolContext';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: string, extraId?: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const { students, extracurriculars, activities, violations, achievements } = useSchool();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return null;
    const q = query.toLowerCase();

    const matchedStudents = students
      .filter(s => s.fullName.toLowerCase().includes(q) || s.nis.includes(q) || s.className.toLowerCase().includes(q))
      .slice(0, 5);

    const matchedEkskul = extracurriculars
      .filter(e => e.name.toLowerCase().includes(q) || e.coachName.toLowerCase().includes(q) || e.category.toLowerCase().includes(q))
      .slice(0, 4);

    const matchedActivities = activities
      .filter(a => a.title.toLowerCase().includes(q) || a.location.toLowerCase().includes(q))
      .slice(0, 4);

    const matchedViolations = violations
      .filter(v => v.studentName.toLowerCase().includes(q) || v.violationType.toLowerCase().includes(q))
      .slice(0, 4);

    const matchedAchievements = achievements
      .filter(a => a.studentName.toLowerCase().includes(q) || a.title.toLowerCase().includes(q))
      .slice(0, 4);

    return {
      students: matchedStudents,
      ekskul: matchedEkskul,
      activities: matchedActivities,
      violations: matchedViolations,
      achievements: matchedAchievements
    };
  }, [query, students, extracurriculars, activities, violations, achievements]);

  if (!isOpen) return null;

  const hasAnyResult =
    results &&
    (results.students.length > 0 ||
      results.ekskul.length > 0 ||
      results.activities.length > 0 ||
      results.violations.length > 0 ||
      results.achievements.length > 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="min-h-full flex items-start justify-center p-3 sm:p-4 pt-12 sm:pt-16 text-center">
        <div
          className="w-full max-w-2xl bg-[#0d0d0f] rounded border border-[#27272a] shadow-2xl text-left overflow-hidden transform transition-all"
          onClick={e => e.stopPropagation()}
        >
          {/* Search Header */}
          <div className="p-3 border-b border-[#27272a] bg-[#121215] flex items-center gap-2.5">
            <Search className="w-4 h-4 text-blue-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="SEARCH_QUERY: Nama Siswa, NIS, Ekstrakurikuler, Kegiatan..."
              className="w-full text-xs bg-transparent border-0 focus:outline-none focus:ring-0 text-zinc-200 placeholder-zinc-500 font-mono"
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-1 text-zinc-500 hover:text-zinc-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-mono text-zinc-500 bg-[#161618] rounded border border-[#27272a]">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-[60vh] overflow-y-auto p-3 space-y-3 text-xs">
            {!query.trim() && (
              <div className="py-6 text-center text-zinc-500 font-mono text-[11px]">
                <p className="text-zinc-400 font-bold uppercase tracking-wider">COMMAND_INDEX / SEARCH</p>
                <p className="text-[10px] text-zinc-600 mt-1">Ketikkan minimal 2 karakter pencarian.</p>
              </div>
            )}

            {query.trim() && !hasAnyResult && (
              <div className="py-6 text-center text-zinc-500 font-mono text-[11px]">
                <p className="text-zinc-400 font-bold">NO_MATCHING_RECORDS</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">Tidak ada entitas yang sesuai kata kunci.</p>
              </div>
            )}

            {/* Students */}
            {results && results.students.length > 0 && (
              <div>
                <p className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <User className="w-3 h-3 text-blue-400" /> SISWA ({results.students.length})
                </p>
                <div className="space-y-0.5">
                  {results.students.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        onNavigate('students');
                        onClose();
                      }}
                      className="w-full text-left p-2 rounded hover:bg-[#161618] border border-transparent hover:border-[#27272a] flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-zinc-200 group-hover:text-blue-400 text-xs">
                          {s.fullName}
                        </p>
                        <p className="text-[10px] font-mono text-zinc-500">
                          NIS: {s.nis} | Kelas: {s.className} | Status: {s.status}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Extracurriculars */}
            {results && results.ekskul.length > 0 && (
              <div>
                <p className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-400" /> EKSTRAKURIKULER ({results.ekskul.length})
                </p>
                <div className="space-y-0.5">
                  {results.ekskul.map(e => (
                    <button
                      key={e.id}
                      onClick={() => {
                        onNavigate('extracurriculars');
                        onClose();
                      }}
                      className="w-full text-left p-2 rounded hover:bg-[#161618] border border-transparent hover:border-[#27272a] flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-zinc-200 group-hover:text-emerald-400 text-xs">
                          {e.name}
                        </p>
                        <p className="text-[10px] font-mono text-zinc-500">
                          Kategori: {e.category} | Pembina: {e.coachName} | {e.day} {e.startTime}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Activities */}
            {results && results.activities.length > 0 && (
              <div>
                <p className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-cyan-400" /> KEGIATAN ({results.activities.length})
                </p>
                <div className="space-y-0.5">
                  {results.activities.map(a => (
                    <button
                      key={a.id}
                      onClick={() => {
                        onNavigate('activities');
                        onClose();
                      }}
                      className="w-full text-left p-2 rounded hover:bg-[#161618] border border-transparent hover:border-[#27272a] flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-zinc-200 group-hover:text-cyan-400 text-xs">
                          {a.title}
                        </p>
                        <p className="text-[10px] font-mono text-zinc-500">
                          Tanggal: {a.date} | Lokasi: {a.location} | Status: {a.status}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Violations */}
            {results && results.violations.length > 0 && (
              <div>
                <p className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-red-400" /> PELANGGARAN ({results.violations.length})
                </p>
                <div className="space-y-0.5">
                  {results.violations.map(v => (
                    <button
                      key={v.id}
                      onClick={() => {
                        onNavigate('violations');
                        onClose();
                      }}
                      className="w-full text-left p-2 rounded hover:bg-[#161618] border border-transparent hover:border-[#27272a] flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-zinc-200 group-hover:text-red-400 text-xs">
                          {v.studentName} ({v.studentClass})
                        </p>
                        <p className="text-[10px] font-mono text-zinc-500">
                          {v.violationType} | +{v.points} Poin | {v.category}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-red-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {results && results.achievements.length > 0 && (
              <div>
                <p className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-orange-400" /> PRESTASI ({results.achievements.length})
                </p>
                <div className="space-y-0.5">
                  {results.achievements.map(ach => (
                    <button
                      key={ach.id}
                      onClick={() => {
                        onNavigate('achievements');
                        onClose();
                      }}
                      className="w-full text-left p-2 rounded hover:bg-[#161618] border border-transparent hover:border-[#27272a] flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-zinc-200 group-hover:text-orange-400 text-xs">
                          {ach.title}
                        </p>
                        <p className="text-[10px] font-mono text-zinc-500">
                          Oleh: {ach.studentName} ({ach.studentClass}) | {ach.rank} ({ach.level})
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
