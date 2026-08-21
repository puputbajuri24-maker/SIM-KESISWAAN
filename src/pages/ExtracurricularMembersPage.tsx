import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Compass,
  Filter,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Search,
  UserCheck
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { ExtracurricularMember } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';

interface MembersPageProps {
  initialEkskulId?: string;
}

export const ExtracurricularMembersPage: React.FC<MembersPageProps> = ({ initialEkskulId }) => {
  const { isWakaOrAdmin, isPembina, currentUser } = useAuth();
  const {
    members,
    extracurriculars,
    students,
    addMember,
    updateMember,
    deleteMember,
    activeAcademicYear
  } = useSchool();

  const [selectedEkskul, setSelectedEkskul] = useState<string>(initialEkskulId || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ExtracurricularMember | null>(null);

  // Form State for new member registration
  const [targetStudentId, setTargetStudentId] = useState<string>('');
  const [targetEkskulId, setTargetEkskulId] = useState<string>(
    initialEkskulId && initialEkskulId !== 'all' ? initialEkskulId : extracurriculars[0]?.id || ''
  );
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Available students to register
  const filteredStudentsForEnrollment = useMemo(() => {
    const existingMemberStudentIds = new Set(
      members.filter(m => m.extracurricularId === targetEkskulId && m.status === 'Aktif').map(m => m.studentId)
    );

    return students
      .filter(s => s.status === 'Aktif' && !existingMemberStudentIds.has(s.id))
      .filter(s => {
        if (!studentSearchQuery) return true;
        const q = studentSearchQuery.toLowerCase();
        return s.fullName.toLowerCase().includes(q) || s.nis.includes(q) || s.className.toLowerCase().includes(q);
      });
  }, [students, members, targetEkskulId, studentSearchQuery]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      if (selectedEkskul !== 'all' && m.extracurricularId !== selectedEkskul) return false;
      if (selectedStatus !== 'all' && m.status !== selectedStatus) return false;
      return true;
    });
  }, [members, selectedEkskul, selectedStatus]);

  const handleOpenAdd = () => {
    setTargetStudentId(filteredStudentsForEnrollment[0]?.id || '');
    setIsAddOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudentId || !targetEkskulId) {
      alert('Pilih siswa dan ekstrakurikuler yang valid.');
      return;
    }

    const student = students.find(s => s.id === targetStudentId);
    const ekskul = extracurriculars.find(e => e.id === targetEkskulId);

    if (!student || !ekskul) return;

    await addMember({
      extracurricularId: targetEkskulId,
      extracurricularName: ekskul.name,
      studentId: student.id,
      studentName: student.fullName,
      studentNis: student.nis,
      studentClass: student.className,
      gender: student.gender,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'Aktif',
      academicYear: activeAcademicYear
    });

    setIsAddOpen(false);
    setStudentSearchQuery('');
  };

  const handleDeleteConfirm = async () => {
    if (selectedMember) {
      await deleteMember(selectedMember.id);
      setIsDeleteOpen(false);
      setSelectedMember(null);
    }
  };

  const handleStatusChange = async (member: ExtracurricularMember, newStatus: any) => {
    await updateMember(member.id, { status: newStatus });
  };

  const columns: Column<ExtracurricularMember>[] = [
    {
      header: 'NIS & Nama Siswa',
      accessorKey: 'studentName',
      sortable: true,
      cell: m => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
            {m.studentName.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100">{m.studentName}</p>
            <p className="text-[11px] text-slate-400">NIS: {m.studentNis} • Kelas: {m.studentClass}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Ekstrakurikuler',
      accessorKey: 'extracurricularName',
      sortable: true,
      cell: m => (
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">{m.extracurricularName}</span>
        </div>
      )
    },
    {
      header: 'Tgl Bergabung',
      accessorKey: 'joinDate',
      sortable: true,
      cell: m => <span className="text-xs text-slate-500">{m.joinDate}</span>
    },
    {
      header: 'Status Keanggotaan',
      accessorKey: 'status',
      sortable: true,
      cell: m => (
        <select
          value={m.status}
          onChange={e => handleStatusChange(m, e.target.value)}
          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
        >
          <option value="Aktif">Aktif</option>
          <option value="Cuti">Cuti</option>
          <option value="Keluar">Keluar</option>
        </select>
      )
    },
    {
      header: 'Aksi',
      className: 'text-right',
      cell: m => (
        <button
          onClick={() => {
            setSelectedMember(m);
            setIsDeleteOpen(true);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
          title="Keluarkan dari Ekskul"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Roster & Anggota Ekstrakurikuler
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola pendaftaran siswa, status keaktifan peserta, dan rekapitulasi anggota per ekskul.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportActions
            filename="daftar_anggota_ekskul"
            title="Daftar Anggota Ekstrakurikuler"
            data={filteredMembers}
            headers={[
              { header: 'Nama Siswa', key: 'studentName' },
              { header: 'NIS', key: 'studentNis' },
              { header: 'Kelas', key: 'studentClass' },
              { header: 'Ekstrakurikuler', key: 'extracurricularName' },
              { header: 'Tanggal Bergabung', key: 'joinDate' },
              { header: 'Status', key: 'status' }
            ]}
          />

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>+ Daftarkan Anggota</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500 font-semibold">
          <Filter className="w-4 h-4" />
          <span>Filter Anggota:</span>
        </div>

        <select
          value={selectedEkskul}
          onChange={e => setSelectedEkskul(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium"
        >
          <option value="all">Semua Ekstrakurikuler ({members.length})</option>
          {extracurriculars.map(e => (
            <option key={e.id} value={e.id}>
              {e.name} ({members.filter(m => m.extracurricularId === e.id).length})
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium"
        >
          <option value="all">Semua Status</option>
          <option value="Aktif">Aktif</option>
          <option value="Cuti">Cuti</option>
          <option value="Keluar">Keluar</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        id="members-table"
        data={filteredMembers}
        columns={columns}
        searchPlaceholder="Cari nama siswa, NIS, atau ekstrakurikuler..."
        searchableKeys={['studentName', 'studentNis', 'studentClass', 'extracurricularName']}
        emptyTitle="Tidak Ada Anggota"
        emptySubtitle="Belum ada siswa yang terdaftar dalam kriteria filter ini."
      />

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Daftarkan Siswa ke Ekstrakurikuler"
        subtitle="Pilih siswa aktif untuk bergabung ke dalam ekstrakurikuler terpilih"
        maxWidth="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!targetStudentId}
              onClick={handleSaveMember}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md disabled:opacity-50"
            >
              Daftarkan Anggota
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveMember} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pilih Ekstrakurikuler Tujuan *
            </label>
            <select
              value={targetEkskulId}
              onChange={e => setTargetEkskulId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            >
              {extracurriculars.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} (Kuota: {members.filter(m => m.extracurricularId === e.id && m.status === 'Aktif').length}/{e.quota})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cari & Pilih Siswa *
            </label>
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={studentSearchQuery}
                onChange={e => setStudentSearchQuery(e.target.value)}
                placeholder="Ketik nama atau NIS siswa..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudentsForEnrollment.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Tidak ada siswa yang belum bergabung.</p>
              ) : (
                filteredStudentsForEnrollment.slice(0, 20).map(s => (
                  <div
                    key={s.id}
                    onClick={() => setTargetStudentId(s.id)}
                    className={`p-2.5 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      targetStudentId === s.id
                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <p className="text-slate-800 dark:text-slate-200">{s.fullName}</p>
                      <p className="text-[10px] text-slate-400">NIS: {s.nis} | Kelas: {s.className}</p>
                    </div>
                    {targetStudentId === s.id && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete / Remove Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Keluarkan Anggota"
        message={`Apakah Anda yakin ingin mengeluarkan siswa ${selectedMember?.studentName} dari ekstrakurikuler ${selectedMember?.extracurricularName}?`}
        confirmText="Keluarkan Siswa"
      />
    </div>
  );
};
