import React from 'react';
import {
  Plus,
  UserCheck,
  Edit2,
  AlertCircle
} from 'lucide-react';
import { SchoolClass, Teacher } from '../../../types';

export interface StudentsHomeroomTabProps {
  homeroomStats: { totalClasses: number; filled: number; empty: number };
  teachers: Teacher[];
  homeroomGradeFilter: 'all' | 'X' | 'XI' | 'XII';
  setHomeroomGradeFilter: (grade: 'all' | 'X' | 'XI' | 'XII') => void;
  homeroomSearchQuery: string;
  setHomeroomSearchQuery: (query: string) => void;
  handleOpenAddHomeroom: (classId?: string) => void;
  filteredHomeroomClasses: SchoolClass[];
  studentCountsByClassId: Record<string, number>;
  handleQuickAssignHomeroom: (classId: string, teacherName: string) => void;
}

export const StudentsHomeroomTab: React.FC<StudentsHomeroomTabProps> = ({
  homeroomStats,
  teachers,
  homeroomGradeFilter,
  setHomeroomGradeFilter,
  homeroomSearchQuery,
  setHomeroomSearchQuery,
  handleOpenAddHomeroom,
  filteredHomeroomClasses,
  studentCountsByClassId,
  handleQuickAssignHomeroom,
}) => {
  return (
    <div className="space-y-6" id="view-students-homeroom">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold">Total Rombel Kelas</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{homeroomStats.totalClasses}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Tingkat X, XI, dan XII</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 shadow-xs">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Wali Kelas Terisi</span>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{homeroomStats.filled}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Sudah memiliki wali kelas aktif</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 shadow-xs">
          <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">Belum Terisi</span>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{homeroomStats.empty}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Perlu penetapan wali kelas</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50 shadow-xs">
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">Dewan Guru Terdaftar</span>
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">{teachers.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Guru & pembina di database</p>
        </div>
      </div>

      {/* Filter and Search Bar for Homeroom */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-1">Tingkat:</span>
          {(['all', 'X', 'XI', 'XII'] as const).map(g => (
            <button
              key={g}
              type="button"
              onClick={() => setHomeroomGradeFilter(g)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                homeroomGradeFilter === g
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {g === 'all' ? 'Semua Tingkat' : `Kelas ${g}`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={homeroomSearchQuery}
            onChange={e => setHomeroomSearchQuery(e.target.value)}
            placeholder="Cari rombel atau wali kelas..."
            className="px-3.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 w-full sm:w-64"
          />
          <button
            type="button"
            onClick={() => handleOpenAddHomeroom()}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tetapkan Wali Kelas</span>
          </button>
        </div>
      </div>

      {/* Classes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredHomeroomClasses.map(c => {
          const studentCount = studentCountsByClassId[c.id] || 0;
          const hasHomeroom = !!c.homeroomTeacher && c.homeroomTeacher.trim() !== '' && c.homeroomTeacher !== '-';

          return (
            <div
              key={c.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                        {c.grade}
                      </span>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                        {c.name}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      {c.major}
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs shrink-0">
                    {studentCount} Siswa
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Wali Kelas Saat Ini:
                  </span>
                  {hasHomeroom ? (
                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/50">
                      <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {c.homeroomTeacher?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-amber-950 dark:text-amber-200 truncate">
                          {c.homeroomTeacher}
                        </p>
                        <span className="inline-block text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                          ✓ Wali Kelas Resmi
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>Belum Ditentukan</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <select
                    value={c.homeroomTeacher || ''}
                    onChange={e => handleQuickAssignHomeroom(c.id, e.target.value)}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="">-- Pilih Cepat dari Dewan Guru --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.fullName}>
                        {t.fullName} ({t.role || 'Guru'})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAddHomeroom(c.id)}
                  className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Atur / Tambah Guru Baru</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredHomeroomClasses.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">Tidak Ada Rombel Kelas</h3>
          <p className="text-xs text-slate-400 mt-1">Tidak ditemukan rombel kelas yang sesuai dengan filter pencarian.</p>
        </div>
      )}
    </div>
  );
};
