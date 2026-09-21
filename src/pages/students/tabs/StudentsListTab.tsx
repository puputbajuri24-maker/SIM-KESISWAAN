import React from 'react';
import {
  Filter,
  ArrowUpDown,
  Table,
  Layers,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit2,
  Users
} from 'lucide-react';
import { Student, SchoolClass } from '../../../types';
import { DataTable, Column } from '../../../components/common/DataTable';
import { StatusBadge } from '../../../components/common/Badge';
import { ClassGridFilter } from '../../../components/common/ClassGridFilter';
import { StudentSortOrder } from '../../../utils/classResolver';

export interface StudentsListTabProps {
  classes: SchoolClass[];
  selectedClass: string;
  setSelectedClass: (cls: string) => void;
  studentCountsByClassId: Record<string, number>;
  totalStudentCount: number;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedGender: string;
  setSelectedGender: (gender: string) => void;
  studentSortOrder: StudentSortOrder;
  setStudentSortOrder: (order: StudentSortOrder) => void;
  viewMode: 'table' | 'grouped';
  setViewMode: (mode: 'table' | 'grouped') => void;
  collapsedGroupIds: Set<string>;
  setCollapsedGroupIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  filteredStudents: Student[];
  columns: Column<Student>[];
  handleOpenDetail: (student: Student) => void;
  selectedStudentIds: Set<string>;
  handleToggleSelectStudent: (id: string) => void;
  handleToggleSelectAllStudents: (ids: string[]) => void;
  setIsBulkDeleteOpen: (open: boolean) => void;
  groupedStudents: { classObj: SchoolClass; students: Student[] }[];
  handleOpenEdit: (student: Student, e: React.MouseEvent) => void;
  handleOpenDelete: (student: Student, e: React.MouseEvent) => void;
}

export const StudentsListTab: React.FC<StudentsListTabProps> = ({
  classes,
  selectedClass,
  setSelectedClass,
  studentCountsByClassId,
  totalStudentCount,
  selectedStatus,
  setSelectedStatus,
  selectedGender,
  setSelectedGender,
  studentSortOrder,
  setStudentSortOrder,
  viewMode,
  setViewMode,
  collapsedGroupIds,
  setCollapsedGroupIds,
  filteredStudents,
  columns,
  handleOpenDetail,
  selectedStudentIds,
  handleToggleSelectStudent,
  handleToggleSelectAllStudents,
  setIsBulkDeleteOpen,
  groupedStudents,
  handleOpenEdit,
  handleOpenDelete,
}) => {
  return (
    <div className="space-y-4" id="view-students-list">
      {/* Class Selector Grid Filter */}
      <ClassGridFilter
        classes={classes}
        selectedClassId={selectedClass}
        onSelectClass={setSelectedClass}
        countsByClassId={studentCountsByClassId}
        totalCount={totalStudentCount}
        label="Filter Rombongan Belajar (Rombel / Kelas)"
        itemUnit="Siswa"
        colorScheme="indigo"
      />

      {/* Secondary Filter and View Options */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-bold text-slate-500 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            Filter & Urutan:
          </span>

          {/* Sort Order Selector */}
          <div className="relative">
            <select
              value={studentSortOrder}
              onChange={e => setStudentSortOrder(e.target.value as StudentSortOrder)}
              className="px-3 py-1.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 font-bold focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              title="Urutan Tampilan Siswa"
            >
              <option value="class-alphabetical">🏷️ Per Kelas (X➔XI➔XII) lalu Abjad Siswa (A-Z)</option>
              <option value="name-asc">🔤 Abjad Nama Siswa (A ➔ Z Seluruhnya)</option>
              <option value="name-desc">🔡 Abjad Nama Siswa (Z ➔ A Seluruhnya)</option>
              <option value="nis-asc">🔢 Nomor Induk Siswa (NIS)</option>
              <option value="status">🟢 Status Siswa (Aktif Terlebih Dahulu)</option>
              <option value="violations">⚠️ Poin Pelanggaran Tertinggi</option>
              <option value="achievements">🏆 Poin Prestasi Tertinggi</option>
            </select>
          </div>

          {/* Filter Status */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 font-medium cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Alumni">Alumni</option>
            <option value="Pindah">Pindah</option>
            <option value="Keluar">Keluar</option>
          </select>

          {/* Filter Gender */}
          <select
            value={selectedGender}
            onChange={e => setSelectedGender(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 font-medium cursor-pointer"
          >
            <option value="all">Semua Gender</option>
            <option value="L">Laki-Laki (L)</option>
            <option value="P">Perempuan (P)</option>
          </select>

          {(selectedClass !== 'all' || selectedStatus !== 'all' || selectedGender !== 'all' || studentSortOrder !== 'class-alphabetical') && (
            <button
              onClick={() => {
                setSelectedClass('all');
                setSelectedStatus('all');
                setSelectedGender('all');
                setStudentSortOrder('class-alphabetical');
              }}
              className="text-xs text-rose-600 hover:underline font-semibold ml-1"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* View Mode Toggle: Single Table vs Grouped by Class */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Tampilan Tabel Standar Lengkap"
          >
            <Table className="w-3.5 h-3.5" />
            <span>Tabel Standar</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grouped')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'grouped'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Tampilan Tersekat Per Rombel Kelas"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sekat Per Kelas</span>
          </button>
        </div>
      </div>

      {/* Active Mode Notice */}
      {studentSortOrder === 'class-alphabetical' && (
        <div className="px-4 py-2 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-xs text-indigo-800 dark:text-indigo-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            <span>
              <strong>Urutan Aktif:</strong> Siswa diklasifikasikan per rombel kelas (Tingkat X ➔ XI ➔ XII), dan di dalam setiap rombel siswa terurut abjad nama (A-Z) sesuai nomor absen.
            </span>
          </div>
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
            {filteredStudents.length} Siswa Terdaftar
          </span>
        </div>
      )}

      {/* Main View: Table vs Grouped */}
      {viewMode === 'table' ? (
        /* Main Table with Batch Selection */
        <DataTable
          id="students-table"
          data={filteredStudents}
          columns={columns}
          searchPlaceholder="Cari siswa berdasarkan NIS, Nama, atau Kelas..."
          searchableKeys={['nis', 'nisn', 'fullName', 'className', 'parentName']}
          onRowClick={handleOpenDetail}
          selectable={true}
          selectedIds={selectedStudentIds}
          onToggleSelect={handleToggleSelectStudent}
          onToggleSelectAll={handleToggleSelectAllStudents}
          batchActions={(ids) => (
            <button
              type="button"
              onClick={() => setIsBulkDeleteOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus {ids.length} Siswa Terpilih</span>
            </button>
          )}
          emptyTitle="Tidak Ada Siswa"
          emptySubtitle="Tidak ditemukan data siswa yang sesuai dengan filter pencarian."
        />
      ) : (
        /* Grouped View: Distinct Cards per Class */
        <div className="space-y-4">
          {/* Grouped Header Toolbar */}
          <div className="flex items-center justify-between gap-3 px-1 text-xs">
            <span className="text-slate-500 font-semibold">
              Menampilkan {groupedStudents.filter(g => g.students.length > 0).length} Rombel Kelas Aktif
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCollapsedGroupIds(new Set())}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
              >
                Buka Semua
              </button>
              <button
                type="button"
                onClick={() => {
                  const allIds = new Set(groupedStudents.map(g => g.classObj.id));
                  setCollapsedGroupIds(allIds);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
              >
                Tutup Semua
              </button>
            </div>
          </div>

          {groupedStudents.map(group => {
            // If filters are applied and class has no matching students, skip it
            if (group.students.length === 0 && (selectedStatus !== 'all' || selectedGender !== 'all')) {
              return null;
            }

            const isCollapsed = collapsedGroupIds.has(group.classObj.id);

            return (
              <div
                key={group.classObj.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition-all"
              >
                {/* Class Group Header */}
                <div
                  onClick={() => {
                    setCollapsedGroupIds(prev => {
                      const next = new Set(prev);
                      if (next.has(group.classObj.id)) next.delete(group.classObj.id);
                      else next.add(group.classObj.id);
                      return next;
                    });
                  }}
                  className="px-5 py-3.5 bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      {group.classObj.grade}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                          {group.classObj.name}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
                          {group.classObj.major}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Wali Kelas: <strong className="text-slate-700 dark:text-slate-300">{group.classObj.homeroomTeacher || '-'}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{group.students.length} Siswa Terdaftar</span>
                      </span>
                      {group.students.filter(s => s.status === 'Aktif').length !== group.students.length && (
                        <span className="px-2 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold">
                          {group.students.filter(s => s.status === 'Aktif').length} Aktif
                        </span>
                      )}
                    </div>

                    <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                      {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Class Students Table */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    {group.students.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        Belum ada data siswa di rombel kelas ini.
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                            <th className="px-4 py-2.5 w-12 text-center">No</th>
                            <th className="px-4 py-2.5">NIS / NISN</th>
                            <th className="px-4 py-2.5">Nama Siswa</th>
                            <th className="px-4 py-2.5">Gender / No. HP</th>
                            <th className="px-4 py-2.5">Poin Disiplin</th>
                            <th className="px-4 py-2.5">Status</th>
                            <th className="px-4 py-2.5 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {group.students.map((st, idx) => (
                            <tr
                              key={st.id}
                              onClick={() => handleOpenDetail(st)}
                              className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors cursor-pointer"
                            >
                              <td className="px-4 py-2.5 text-center text-slate-400 font-bold">
                                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 inline-flex items-center justify-center text-[10px] text-slate-600 dark:text-slate-300">
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="px-4 py-2.5">
                                <span className="font-bold text-slate-800 dark:text-slate-200">{st.nis}</span>
                                {st.nisn && <p className="text-[10px] text-slate-400">NISN: {st.nisn}</p>}
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                                    {st.fullName.charAt(0)}
                                  </div>
                                  <span className="font-bold text-slate-900 dark:text-slate-100">
                                    {st.fullName}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                                <span className="font-semibold">{st.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}</span>
                                {st.phone && <p className="text-[10px] text-slate-400">{st.phone}</p>}
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                    (st.violationPoints || 0) > 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    ⚠️ {st.violationPoints || 0}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                    (st.achievementPoints || 0) > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    🏆 {st.achievementPoints || 0}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5">
                                <StatusBadge status={st.status} />
                              </td>
                              <td className="px-4 py-2.5 text-right" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => handleOpenDetail(st)}
                                    className="p-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-400"
                                    title="Detail"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={e => handleOpenEdit(st, e)}
                                    className="p-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:hover:bg-amber-900 dark:text-amber-400"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={e => handleOpenDelete(st, e)}
                                    className="p-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-400"
                                    title="Hapus"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
