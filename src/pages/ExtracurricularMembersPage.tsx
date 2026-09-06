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
  UserCheck,
  Eye,
  Calendar,
  Award,
  ShieldAlert,
  Phone,
  Mail,
  FileSpreadsheet,
  Grid,
  CheckSquare,
  Square,
  School,
  Sparkles,
  Check
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { ExtracurricularMember } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';
import { ClassGridFilter } from '../components/common/ClassGridFilter';
import { calculateRecordCountsByClass, isStudentInClass } from '../utils/classResolver';

interface MembersPageProps {
  initialEkskulId?: string;
}

export const ExtracurricularMembersPage: React.FC<MembersPageProps> = ({ initialEkskulId }) => {
  const { isWakaOrAdmin, isPembina, currentUser } = useAuth();
  const {
    classes,
    members,
    extracurriculars,
    students,
    attendance,
    achievements,
    addMember,
    updateMember,
    deleteMember,
    deleteMembersBulk,
    updateMembersStatusBulk,
    activeAcademicYear
  } = useSchool();

  const isPembinaOnly = isPembina && !isWakaOrAdmin;
  const myAssignedIds = currentUser?.extracurricularIds || [];

  const availableEkskuls = useMemo(() => {
    if (isPembinaOnly) {
      return extracurriculars.filter(e => 
        myAssignedIds.includes(e.id) || 
        e.coachId === currentUser?.uid || 
        (currentUser?.displayName && e.coachName?.toLowerCase().includes(currentUser.displayName.toLowerCase().split(' ')[0]))
      );
    }
    return extracurriculars;
  }, [extracurriculars, isPembinaOnly, myAssignedIds, currentUser]);

  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedEkskul, setSelectedEkskul] = useState<string>(() => {
    if (initialEkskulId) return initialEkskulId;
    if (isPembinaOnly && availableEkskuls.length > 0) return availableEkskuls[0].id;
    return 'all';
  });
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Multi-selection state for table members
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Count members per class
  const memberCountsByClassId = useMemo(() => {
    return calculateRecordCountsByClass(members, classes, students);
  }, [members, classes, students]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ExtracurricularMember | null>(null);

  // Edit form state
  const [editStatus, setEditStatus] = useState<'Aktif' | 'Cuti' | 'Keluar'>('Aktif');
  const [editRole, setEditRole] = useState<string>('Anggota');
  const [editNotes, setEditNotes] = useState<string>('');

  // Form State for new member registration
  const [targetEkskulId, setTargetEkskulId] = useState<string>(
    initialEkskulId && initialEkskulId !== 'all' ? initialEkskulId : availableEkskuls[0]?.id || extracurriculars[0]?.id || ''
  );
  const [selectedEnrollClass, setSelectedEnrollClass] = useState<string>('all');
  const [selectedEnrollGrade, setSelectedEnrollGrade] = useState<'all' | 'X' | 'XI' | 'XII'>('all');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isSavingEnroll, setIsSavingEnroll] = useState(false);

  // Extract distinct class list sorted naturally
  const uniqueClassNames = useMemo(() => {
    const classSet = new Set<string>();
    classes.forEach(c => {
      if (c.name) classSet.add(c.name.trim());
    });
    students.forEach(s => {
      if (s.className) classSet.add(s.className.trim());
    });
    return Array.from(classSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [classes, students]);

  // Set of students already registered to target extracurricular
  const enrolledStudentIdSet = useMemo(() => {
    return new Set(
      members.filter(m => m.extracurricularId === targetEkskulId && m.status === 'Aktif').map(m => m.studentId)
    );
  }, [members, targetEkskulId]);

  // All eligible un-enrolled students (Sorted Alphabetically)
  const eligibleStudentsForEnrollment = useMemo(() => {
    return students
      .filter(s => s.status === 'Aktif' && !enrolledStudentIdSet.has(s.id))
      .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'id', { sensitivity: 'base' }));
  }, [students, enrolledStudentIdSet]);

  // Count un-enrolled students per class
  const studentCountPerClass = useMemo(() => {
    const counts: Record<string, number> = {};
    eligibleStudentsForEnrollment.forEach(s => {
      if (s.className) {
        const cls = s.className.trim();
        counts[cls] = (counts[cls] || 0) + 1;
      }
    });
    return counts;
  }, [eligibleStudentsForEnrollment]);

  // Filtered class list based on grade level
  const displayedClassList = useMemo(() => {
    if (selectedEnrollGrade === 'all') return uniqueClassNames;
    return uniqueClassNames.filter(c => {
      const upper = c.toUpperCase();
      if (selectedEnrollGrade === 'X') {
        return (upper.startsWith('X ') || upper.startsWith('X-') || upper === 'X') && !upper.startsWith('XI') && !upper.startsWith('XII');
      }
      if (selectedEnrollGrade === 'XI') {
        return (upper.startsWith('XI ') || upper.startsWith('XI-') || upper === 'XI') && !upper.startsWith('XII');
      }
      if (selectedEnrollGrade === 'XII') {
        return upper.startsWith('XII ') || upper.startsWith('XII-') || upper === 'XII';
      }
      return true;
    });
  }, [uniqueClassNames, selectedEnrollGrade]);

  // Filtered students for enrollment list based on class grid selection and search query
  const filteredStudentsForEnrollment = useMemo(() => {
    return eligibleStudentsForEnrollment.filter(s => {
      if (selectedEnrollClass !== 'all' && s.className?.trim() !== selectedEnrollClass) {
        return false;
      }
      if (selectedEnrollGrade !== 'all') {
        const upper = (s.className || '').trim().toUpperCase();
        if (selectedEnrollGrade === 'X' && !((upper.startsWith('X ') || upper.startsWith('X-') || upper === 'X') && !upper.startsWith('XI') && !upper.startsWith('XII'))) {
          return false;
        }
        if (selectedEnrollGrade === 'XI' && !((upper.startsWith('XI ') || upper.startsWith('XI-') || upper === 'XI') && !upper.startsWith('XII'))) {
          return false;
        }
        if (selectedEnrollGrade === 'XII' && !(upper.startsWith('XII ') || upper.startsWith('XII-') || upper === 'XII')) {
          return false;
        }
      }
      if (!studentSearchQuery) return true;
      const q = studentSearchQuery.toLowerCase();
      return (
        (s.fullName || '').toLowerCase().includes(q) ||
        (s.nis || '').toLowerCase().includes(q) ||
        (s.className && s.className.toLowerCase().includes(q))
      );
    });
  }, [eligibleStudentsForEnrollment, selectedEnrollClass, selectedEnrollGrade, studentSearchQuery]);

  // Filtered members list (Sorted Alphabetically by Student Name)
  const filteredMembers = useMemo(() => {
    return members
      .filter(m => {
        if (isPembinaOnly) {
          const allowedIds = availableEkskuls.map(e => e.id);
          if (!allowedIds.includes(m.extracurricularId)) return false;
        }
        if (selectedClass !== 'all') {
          const student = students.find(s => s.id === m.studentId);
          const match = isStudentInClass(m, selectedClass, classes) || (student && isStudentInClass(student, selectedClass, classes));
          if (!match) return false;
        }
        if (selectedEkskul !== 'all' && m.extracurricularId !== selectedEkskul) return false;
        if (selectedStatus !== 'all' && m.status !== selectedStatus) return false;
        return true;
      })
      .sort((a, b) => (a.studentName || '').localeCompare(b.studentName || '', 'id', { sensitivity: 'base' }));
  }, [members, selectedClass, selectedEkskul, selectedStatus, isPembinaOnly, availableEkskuls, classes, students]);

  const handleOpenAdd = () => {
    setSelectedStudentIds([]);
    setSelectedEnrollClass('all');
    setSelectedEnrollGrade('all');
    setStudentSearchQuery('');
    setIsAddOpen(true);
  };

  const handleToggleSelectStudent = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAllFilteredStudents = () => {
    const allFilteredIds = filteredStudentsForEnrollment.map(s => s.id);
    const areAllSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedStudentIds.includes(id));

    if (areAllSelected) {
      // Unselect all filtered
      setSelectedStudentIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      // Select all filtered
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handleToggleSelectMember = (id: string) => {
    setSelectedMemberIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAllMembers = (items: ExtracurricularMember[]) => {
    const itemIds = items.map(m => m.id);
    setSelectedMemberIds(prev => {
      const isAllSelected = itemIds.length > 0 && itemIds.every(id => prev.has(id));
      const next = new Set(prev);
      if (isAllSelected) {
        itemIds.forEach(id => next.delete(id));
      } else {
        itemIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const handleSelectAllFilteredMembers = () => {
    const filteredIds = filteredMembers.map(m => m.id);
    const isAllSelected = filteredIds.length > 0 && filteredIds.every(id => selectedMemberIds.has(id));
    if (isAllSelected) {
      setSelectedMemberIds(new Set());
    } else {
      setSelectedMemberIds(new Set(filteredIds));
    }
  };

  const handleClearSelection = () => {
    setSelectedMemberIds(new Set());
  };

  const handleBulkDeleteConfirm = async () => {
    const ids: string[] = Array.from(selectedMemberIds);
    if (ids.length === 0) return;
    setIsProcessingBulk(true);
    try {
      await deleteMembersBulk(ids);
      setSelectedMemberIds(new Set());
      setIsBulkDeleteOpen(false);
    } catch (err) {
      console.error('Error bulk deleting members:', err);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkUpdateStatus = async (status: 'Aktif' | 'Cuti' | 'Keluar') => {
    const ids: string[] = Array.from(selectedMemberIds);
    if (ids.length === 0) return;
    setIsProcessingBulk(true);
    try {
      await updateMembersStatusBulk(ids, status);
      setSelectedMemberIds(new Set());
    } catch (err) {
      console.error('Error bulk updating member status:', err);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleOpenDetail = (member: ExtracurricularMember, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedMember(member);
    setIsDetailOpen(true);
  };

  const handleOpenEdit = (member: ExtracurricularMember, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedMember(member);
    setEditStatus((member.status as any) || 'Aktif');
    setEditRole((member as any).role || 'Anggota');
    setEditNotes((member as any).notes || '');
    setIsEditOpen(true);
  };

  const handleOpenDelete = (member: ExtracurricularMember, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedMember(member);
    setIsDeleteOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0 || !targetEkskulId) {
      alert('Pilih minimal satu siswa dan ekstrakurikuler tujuan.');
      return;
    }

    setIsSavingEnroll(true);
    try {
      const ekskul = extracurriculars.find(e => e.id === targetEkskulId);
      if (!ekskul) return;

      const targetStudents = students.filter(s => selectedStudentIds.includes(s.id));

      for (const student of targetStudents) {
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
      }
    } catch (err) {
      console.error('Error adding members:', err);
    } finally {
      setIsSavingEnroll(false);
      setIsAddOpen(false);
      setSelectedStudentIds([]);
      setStudentSearchQuery('');
      setSelectedEnrollClass('all');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    try {
      await updateMember(selectedMember.id, {
        status: editStatus,
        role: editRole,
        notes: editNotes
      } as any);
    } catch (err) {
      console.error('Error updating member:', err);
    } finally {
      setIsEditOpen(false);
      setSelectedMember(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedMember) {
      try {
        await deleteMember(selectedMember.id);
      } catch (err) {
        console.error('Error deleting member:', err);
      } finally {
        setIsDeleteOpen(false);
        setSelectedMember(null);
      }
    }
  };

  // Selected student details for modal
  const selectedStudentObj = selectedMember ? students.find(s => s.id === selectedMember.studentId) : null;
  const selectedEkskulObj = selectedMember ? extracurriculars.find(e => e.id === selectedMember.extracurricularId) : null;

  // Attendance rate for this member in this ekskul
  const memberAttendanceStats = useMemo(() => {
    if (!selectedMember) return { present: 0, total: 0, rate: 0 };
    const relevantRecords = attendance.filter(a => a.extracurricularId === selectedMember.extracurricularId);
    let present = 0;
    let total = relevantRecords.length;
    relevantRecords.forEach(rec => {
      const item = rec.items?.find(i => i.studentId === selectedMember.studentId);
      if (item && item.status === 'Hadir') present++;
    });
    const rate = total > 0 ? Math.round((present / total) * 100) : 100;
    return { present, total, rate };
  }, [selectedMember, attendance]);

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
            <p className="font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => handleOpenDetail(m)}>
              {m.studentName}
            </p>
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
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
          m.status === 'Aktif'
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
        }`}>
          {m.status}
        </span>
      )
    },
    {
      header: 'Aksi',
      className: 'text-right',
      cell: m => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={e => handleOpenDetail(m, e)}
            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-400 transition-colors"
            title="Lihat Detail Anggota"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={e => handleOpenEdit(m, e)}
            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:hover:bg-amber-900 dark:text-amber-400 transition-colors"
            title="Edit Status Keanggotaan"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={e => handleOpenDelete(m, e)}
            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-400 transition-colors"
            title="Keluarkan dari Ekskul"
          >
            <Trash2 className="w-4 h-4" />
          </button>
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
            Roster & Anggota Ekstrakurikuler
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola pendaftaran siswa, status keaktifan peserta, dan rekapitulasi anggota per ekskul.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportActions
            filename="daftar_anggota_ekskul"
            title={selectedMemberIds.size > 0 ? `Daftar ${selectedMemberIds.size} Anggota Ekstrakurikuler Terpilih` : 'Daftar Anggota Ekstrakurikuler'}
            data={selectedMemberIds.size > 0 ? filteredMembers.filter(m => selectedMemberIds.has(m.id)) : filteredMembers}
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

      {/* Class Grid Filter */}
      <ClassGridFilter
        classes={classes}
        selectedClassId={selectedClass}
        onSelectClass={setSelectedClass}
        countsByClassId={memberCountsByClassId}
        totalCount={members.length}
        label="Filter Anggota Ekstrakurikuler Berdasarkan Rombel Kelas"
        itemUnit="Anggota"
        colorScheme="violet"
      />

      {/* Secondary Filter Bar with Quick "Tandai Semua" */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 text-slate-500 font-semibold">
            <Filter className="w-4 h-4" />
            <span>Filter:</span>
          </div>

          <select
            value={selectedEkskul}
            onChange={e => setSelectedEkskul(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium"
          >
            {!isPembinaOnly && <option value="all">Semua Ekstrakurikuler ({members.length})</option>}
            {availableEkskuls.map(e => (
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

          {(selectedClass !== 'all' || selectedEkskul !== (isPembinaOnly && availableEkskuls.length > 0 ? availableEkskuls[0].id : 'all') || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSelectedClass('all');
                if (!isPembinaOnly) setSelectedEkskul('all');
                setSelectedStatus('all');
              }}
              className="text-xs text-rose-600 hover:underline font-semibold"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Quick "Tandai Semua" on Filtered Members */}
        {filteredMembers.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAllFilteredMembers}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                filteredMembers.every(m => selectedMemberIds.has(m.id))
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750'
              }`}
            >
              {filteredMembers.every(m => selectedMemberIds.has(m.id)) ? (
                <>
                  <CheckSquare className="w-4 h-4 text-white" />
                  <span>Batal Tandai Semua ({filteredMembers.length})</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-indigo-500" />
                  <span>Tandai Semua ({filteredMembers.length} Anggota)</span>
                </>
              )}
            </button>

            {selectedMemberIds.size > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Batal ({selectedMemberIds.size})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Batch Actions Toolbar when members are selected */}
      {selectedMemberIds.size > 0 && (
        <div className="p-3.5 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/70 border-2 border-indigo-300 dark:border-indigo-700/80 flex flex-wrap items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
              {selectedMemberIds.size}
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-950 dark:text-indigo-100 flex items-center gap-2">
                <span>{selectedMemberIds.size} Anggota Terpilih</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200/80 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-semibold">
                  Aksi Massal Aktif
                </span>
              </p>
              <p className="text-[11px] text-indigo-700/90 dark:text-indigo-300">
                Pilih aksi massal untuk mengubah status keaktifan atau mengeluarkan anggota terpilih sekaligus.
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Quick Status Change Buttons */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1.5">Ubah Status:</span>
              <button
                type="button"
                disabled={isProcessingBulk}
                onClick={() => handleBulkUpdateStatus('Aktif')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 transition"
              >
                Set Aktif
              </button>
              <button
                type="button"
                disabled={isProcessingBulk}
                onClick={() => handleBulkUpdateStatus('Cuti')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 transition"
              >
                Set Cuti
              </button>
              <button
                type="button"
                disabled={isProcessingBulk}
                onClick={() => handleBulkUpdateStatus('Keluar')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              >
                Set Keluar
              </button>
            </div>

            {/* Bulk Delete / Remove Button */}
            <button
              type="button"
              disabled={isProcessingBulk}
              onClick={() => setIsBulkDeleteOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus / Keluarkan ({selectedMemberIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <DataTable
        id="members-table"
        data={filteredMembers}
        columns={columns}
        onRowClick={m => handleOpenDetail(m)}
        selectable={true}
        selectedIds={selectedMemberIds}
        onToggleSelect={handleToggleSelectMember}
        onToggleSelectAll={handleToggleSelectAllMembers}
        searchPlaceholder="Cari nama siswa, NIS, atau ekstrakurikuler..."
        searchableKeys={['studentName', 'studentNis', 'studentClass', 'extracurricularName']}
        emptyTitle="Tidak Ada Anggota"
        emptySubtitle="Belum ada siswa yang terdaftar dalam kriteria filter ini."
        batchActions={(ids) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBulkDeleteOpen(true)}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Hapus ({ids.length})</span>
            </button>
            <button
              type="button"
              onClick={() => handleBulkUpdateStatus('Aktif')}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
            >
              Aktifkan
            </button>
          </div>
        )}
      />

      {/* Show / Detail Member Modal Popup */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedMember(null);
        }}
        title="Detail Anggota Ekstrakurikuler"
        subtitle={`Informasi Keanggotaan & Kehadiran ${selectedMember?.studentName || ''}`}
        maxWidth="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setIsDetailOpen(false);
                if (selectedMember) handleOpenEdit(selectedMember);
              }}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Status
            </button>
            <button
              type="button"
              onClick={() => {
                setIsDetailOpen(false);
                setSelectedMember(null);
              }}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
            >
              Tutup
            </button>
          </>
        }
      >
        {selectedMember && (
          <div className="space-y-4">
            {/* Header info */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/90 border border-zinc-800">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-extrabold text-xl flex items-center justify-center shrink-0">
                {selectedMember.studentName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-zinc-100">{selectedMember.studentName}</h3>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    selectedMember.status === 'Aktif'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : selectedMember.status === 'Cuti'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {selectedMember.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                  NIS: {selectedMember.studentNis} • Kelas: {selectedMember.studentClass}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-indigo-400">
                  <Compass className="w-3.5 h-3.5" />
                  <span className="font-semibold">{selectedMember.extracurricularName}</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center">
                <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-0.5">Kehadiran Sesi</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  {memberAttendanceStats.rate}%
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">
                  ({memberAttendanceStats.present}/{memberAttendanceStats.total} Pertemuan)
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center">
                <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-0.5">Poin Disiplin</span>
                <span className={`text-base font-bold font-mono ${(selectedStudentObj?.violationPoints || 0) > 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                  {selectedStudentObj?.violationPoints || 0}
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">Poin Pelanggaran</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center">
                <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-0.5">Poin Prestasi</span>
                <span className="text-base font-bold text-amber-400 font-mono">
                  {selectedStudentObj?.achievementPoints || 0}
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">Poin Reward</span>
              </div>
            </div>

            {/* Detail List */}
            <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Tanggal Terdaftar:</span>
                <span className="font-semibold text-zinc-200 font-mono">{selectedMember.joinDate}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Tahun Ajaran:</span>
                <span className="font-semibold text-zinc-200 font-mono">{selectedMember.academicYear || activeAcademicYear}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Pembina Ekstrakurikuler:</span>
                <span className="font-semibold text-zinc-200">{selectedEkskulObj?.coachName || '-'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Jadwal & Lokasi:</span>
                <span className="font-semibold text-zinc-200">
                  {selectedEkskulObj ? `${selectedEkskulObj.day}, ${selectedEkskulObj.startTime}-${selectedEkskulObj.endTime} WIB (${selectedEkskulObj.location})` : '-'}
                </span>
              </div>
              {selectedStudentObj?.phone && (
                <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Kontak Siswa:</span>
                  <span className="font-semibold text-zinc-200 font-mono">📞 {selectedStudentObj.phone}</span>
                </div>
              )}
              {selectedStudentObj?.parentName && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-zinc-400">Orang Tua / Wali:</span>
                  <span className="font-semibold text-zinc-200">
                    {selectedStudentObj.parentName} ({selectedStudentObj.parentPhone || '-'})
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Status Modal Popup */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedMember(null);
        }}
        title="Edit Status & Catatan Anggota"
        subtitle={`Perbarui status keaktifan untuk ${selectedMember?.studentName || ''}`}
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setIsEditOpen(false);
                setSelectedMember(null);
              }}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
            >
              Simpan Perubahan
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Status Keanggotaan *
            </label>
            <select
              value={editStatus}
              onChange={e => setEditStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#161618] border border-zinc-700 text-zinc-200 font-semibold focus:border-indigo-500 focus:outline-none"
            >
              <option value="Aktif">Aktif (Mengikuti Kegiatan Rutin)</option>
              <option value="Cuti">Cuti (Izin Sementara / Sakit)</option>
              <option value="Keluar">Keluar (Mengundurkan Diri)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Peran / Jabatan dalam Ekskul
            </label>
            <input
              type="text"
              value={editRole}
              onChange={e => setEditRole(e.target.value)}
              placeholder="Contoh: Ketua Ekskul, Sekretaris, Anggota..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#161618] border border-zinc-700 text-zinc-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Catatan Pembina / Keterangan
            </label>
            <textarea
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              rows={3}
              placeholder="Catatan perkembangan, dispensasi, atau alasan perubahan status..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#161618] border border-zinc-700 text-zinc-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </form>
      </Modal>

      {/* Add Member Modal Popup */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Daftarkan Siswa ke Ekstrakurikuler"
        subtitle="Pilih satu atau beberapa siswa aktif untuk didaftarkan ke ekstrakurikuler"
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {selectedStudentIds.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                  <Check className="w-3.5 h-3.5" />
                  {selectedStudentIds.length} Siswa Siap Didaftarkan
                </span>
              ) : (
                <span>Pilih siswa dari daftar di bawah</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={selectedStudentIds.length === 0 || isSavingEnroll}
                onClick={handleSaveMember}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
              >
                {isSavingEnroll ? (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Mendaftarkan...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      Daftarkan {selectedStudentIds.length > 0 ? `(${selectedStudentIds.length}) Siswa` : 'Anggota'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSaveMember} className="space-y-4">
          {/* Target Extracurricular */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Pilih Ekstrakurikuler Tujuan *
            </label>
            <select
              value={targetEkskulId}
              onChange={e => {
                setTargetEkskulId(e.target.value);
                setSelectedStudentIds([]);
              }}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
            >
              {availableEkskuls.map(e => {
                const activeCount = members.filter(m => m.extracurricularId === e.id && m.status === 'Aktif').length;
                return (
                  <option key={e.id} value={e.id}>
                    {e.name} — Kuota Terisi: {activeCount}/{e.quota} ({Math.max(0, e.quota - activeCount)} sisa slot)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Quick Class Grid Filter */}
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Grid className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Filter Kelas Siswa (Pilih Cepat Grid):</span>
              </label>
              {selectedEnrollClass !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedEnrollClass('all')}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  Tampilkan Semua Kelas
                </button>
              )}
            </div>

            {/* Grade Level Selector Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {(['all', 'X', 'XI', 'XII'] as const).map(grade => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => setSelectedEnrollGrade(grade)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    selectedEnrollGrade === grade
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {grade === 'all' ? 'Semua Tingkat' : `Tingkat ${grade}`}
                </button>
              ))}
            </div>

            {/* Interactive Class Tiles Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1.5 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 custom-scrollbar">
              {/* "Semua Kelas" Card */}
              <button
                type="button"
                onClick={() => setSelectedEnrollClass('all')}
                className={`p-2.5 rounded-xl text-left transition-all border flex flex-col justify-between ${
                  selectedEnrollClass === 'all'
                    ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-xs ring-2 ring-indigo-500/20'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold text-xs">Semua Kelas</span>
                  {selectedEnrollClass === 'all' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  )}
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 mt-1 font-medium">
                  {eligibleStudentsForEnrollment.length} Siswa Siap
                </span>
              </button>

              {/* Individual Class Tiles */}
              {displayedClassList.map(clsName => {
                const count = studentCountPerClass[clsName] || 0;
                const isSelected = selectedEnrollClass === clsName;
                return (
                  <button
                    key={clsName}
                    type="button"
                    onClick={() => setSelectedEnrollClass(clsName)}
                    className={`p-2.5 rounded-xl text-left transition-all border flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs shadow-indigo-600/30 ring-2 ring-indigo-500/30'
                        : count > 0
                        ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30'
                        : 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-extrabold text-xs truncate">{clsName}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span
                        className={`text-[10px] font-semibold ${
                          isSelected
                            ? 'text-indigo-100'
                            : count > 0
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {count} Siswa
                      </span>
                      {count > 0 && !isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Student Search & Multi-Select List */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Pilih Siswa ({filteredStudentsForEnrollment.length} Tersedia
                {selectedEnrollClass !== 'all' ? ` di ${selectedEnrollClass}` : ''})
              </label>
              {filteredStudentsForEnrollment.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllFilteredStudents}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition"
                >
                  {filteredStudentsForEnrollment.every(s => selectedStudentIds.includes(s.id)) ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Batal Tandai Semua</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Tandai Semua ({filteredStudentsForEnrollment.length})</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={studentSearchQuery}
                onChange={e => setStudentSearchQuery(e.target.value)}
                placeholder="Cari nama atau NIS siswa..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Student List with Checkboxes */}
            <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 custom-scrollbar">
              {filteredStudentsForEnrollment.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-xs font-medium text-slate-400">
                    Tidak ada siswa yang belum bergabung
                    {selectedEnrollClass !== 'all' ? ` untuk kelas ${selectedEnrollClass}` : ''}.
                  </p>
                </div>
              ) : (
                filteredStudentsForEnrollment.map(s => {
                  const isChecked = selectedStudentIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleToggleSelectStudent(s.id)}
                      className={`p-2.5 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-l-4 border-indigo-600'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0 text-indigo-600 dark:text-indigo-400">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`truncate ${
                              isChecked
                                ? 'font-bold text-indigo-950 dark:text-indigo-100'
                                : 'font-semibold text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {s.fullName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            NIS: {s.nis} • Kelas: <span className="font-bold text-slate-600 dark:text-slate-300">{s.className}</span> • {s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                          </p>
                        </div>
                      </div>

                      {isChecked && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-600 text-white shrink-0 ml-2">
                          Terpilih
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete / Remove Confirmation Popup */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Keluarkan Anggota"
        message={`Apakah Anda yakin ingin mengeluarkan siswa ${selectedMember?.studentName} dari ekstrakurikuler ${selectedMember?.extracurricularName}?`}
        confirmText="Keluarkan Siswa"
      />

      {/* Bulk Delete / Remove Confirmation Popup */}
      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Keluarkan / Hapus Anggota Massal"
        message={`Apakah Anda yakin ingin mengeluarkan ${selectedMemberIds.size} siswa terpilih dari ekstrakurikuler terkait? Tindakan ini akan menghapus data keanggotaan mereka.`}
        confirmText={isProcessingBulk ? "Memproses..." : `Ya, Keluarkan ${selectedMemberIds.size} Anggota`}
      />
    </div>
  );
};

