import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  FileSpreadsheet,
  Upload,
  UserCheck,
  Eye,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Calendar,
  Award,
  ShieldAlert,
  Compass,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { Student } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';
import * as XLSX from 'xlsx';

export const StudentsPage: React.FC = () => {
  const { isWakaOrAdmin } = useAuth();
  const {
    students,
    classes,
    addStudent,
    updateStudent,
    deleteStudent,
    importStudentsBulk,
    members,
    violations,
    counseling,
    achievements,
    attendance,
    schoolSetting
  } = useSchool();

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailTab, setDetailTab] = useState<'profile' | 'ekskul' | 'prestasi' | 'pelanggaran' | 'presensi'>('profile');

  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({
    nis: '',
    nisn: '',
    fullName: '',
    gender: 'L',
    birthPlace: '',
    birthDate: '',
    classId: '',
    className: '',
    major: '',
    phone: '',
    parentName: '',
    parentPhone: '',
    address: '',
    status: 'Aktif'
  });

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (selectedClass !== 'all' && s.classId !== selectedClass) return false;
      if (selectedStatus !== 'all' && s.status !== selectedStatus) return false;
      if (selectedGender !== 'all' && s.gender !== selectedGender) return false;
      return true;
    });
  }, [students, selectedClass, selectedStatus, selectedGender]);

  const handleOpenAdd = () => {
    setSelectedStudent(null);
    setFormData({
      nis: '',
      nisn: '',
      fullName: '',
      gender: 'L',
      birthPlace: 'Jakarta',
      birthDate: '2008-01-01',
      classId: classes[0]?.id || '',
      className: classes[0]?.name || '',
      major: classes[0]?.major || '',
      phone: '',
      parentName: '',
      parentPhone: '',
      address: '',
      status: 'Aktif'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (student: Student, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedStudent(student);
    setFormData(student);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (student: Student) => {
    setSelectedStudent(student);
    setDetailTab('profile');
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (student: Student, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedStudent(student);
    setIsDeleteOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nis || !formData.fullName || !formData.classId) {
      alert('Mohon lengkapi NIS, Nama Siswa, dan Kelas.');
      return;
    }

    const targetClass = classes.find(c => c.id === formData.classId);

    if (selectedStudent) {
      await updateStudent(selectedStudent.id, {
        ...formData,
        className: targetClass?.name || formData.className,
        major: targetClass?.major || formData.major
      });
    } else {
      await addStudent({
        nis: formData.nis!,
        nisn: formData.nisn || '',
        fullName: formData.fullName!,
        gender: formData.gender as 'L' | 'P',
        birthPlace: formData.birthPlace || '',
        birthDate: formData.birthDate || '',
        classId: formData.classId!,
        className: targetClass?.name || 'X RPL 1',
        major: targetClass?.major || 'Rekayasa Perangkat Lunak',
        phone: formData.phone || '',
        parentName: formData.parentName || '',
        parentPhone: formData.parentPhone || '',
        address: formData.address || '',
        status: (formData.status as any) || 'Aktif'
      });
    }
    setIsFormOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (selectedStudent) {
      await deleteStudent(selectedStudent.id);
      setIsDeleteOpen(false);
      setSelectedStudent(null);
    }
  };

  // Import Excel Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async evt => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const parsedStudents = data.map(item => ({
          nis: String(item.NIS || item.nis || Math.floor(10000000 + Math.random() * 90000000)),
          nisn: String(item.NISN || item.nisn || ''),
          fullName: String(item['Nama Lengkap'] || item.nama || item.name || 'Siswa Baru'),
          gender: (item['Jenis Kelamin'] === 'P' || item.gender === 'P' ? 'P' : 'L') as 'L' | 'P',
          birthPlace: String(item['Tempat Lahir'] || 'Jakarta'),
          birthDate: String(item['Tanggal Lahir'] || '2008-01-01'),
          classId: classes[0]?.id || 'c_x_rpl1',
          className: String(item.Kelas || item.kelas || 'X RPL 1'),
          major: String(item.Jurusan || 'Rekayasa Perangkat Lunak'),
          phone: String(item['No HP'] || item.phone || ''),
          parentName: String(item['Nama Orang Tua'] || item.wali || ''),
          parentPhone: String(item['No HP Orang Tua'] || ''),
          address: String(item.Alamat || item.address || ''),
          status: 'Aktif' as const
        }));

        if (parsedStudents.length > 0) {
          await importStudentsBulk(parsedStudents);
          alert(`Berhasil mengimpor ${parsedStudents.length} data siswa.`);
          setIsImportOpen(false);
        } else {
          alert('File tidak berisi format data siswa yang sesuai.');
        }
      } catch (err) {
        console.error('Error import excel:', err);
        alert('Gagal membaca file Excel/CSV. Pastikan format kolom sesuai.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Student specific relations
  const studentMemberships = selectedStudent ? members.filter(m => m.studentId === selectedStudent.id) : [];
  const studentAchievements = selectedStudent ? achievements.filter(a => a.studentId === selectedStudent.id) : [];
  const studentViolations = selectedStudent ? violations.filter(v => v.studentId === selectedStudent.id) : [];
  const studentCounselings = selectedStudent ? counseling.filter(c => c.studentId === selectedStudent.id) : [];

  const columns: Column<Student>[] = [
    {
      header: 'NIS / NISN',
      accessorKey: 'nis',
      sortable: true,
      cell: s => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100">{s.nis}</span>
          {s.nisn && <p className="text-[11px] text-slate-400">NISN: {s.nisn}</p>}
        </div>
      )
    },
    {
      header: 'Nama Lengkap Siswa',
      accessorKey: 'fullName',
      sortable: true,
      cell: s => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
            {s.fullName.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{s.fullName}</p>
            <p className="text-[11px] text-slate-400">
              {s.gender === 'L' ? 'Laki-Laki' : 'Perempuan'} • {s.phone || 'Tanpa HP'}
            </p>
          </div>
        </div>
      )
    },
    {
      header: 'Kelas & Jurusan',
      accessorKey: 'className',
      sortable: true,
      cell: s => (
        <div>
          <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold text-xs text-slate-700 dark:text-slate-300">
            {s.className}
          </span>
          <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{s.major}</p>
        </div>
      )
    },
    {
      header: 'Poin Disiplin / Prestasi',
      cell: s => (
        <div className="flex items-center gap-2 text-xs">
          <span className={`px-2 py-0.5 rounded-lg font-bold ${
            (s.violationPoints || 0) > 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-slate-100 text-slate-500'
          }`}>
            ⚠️ {s.violationPoints || 0} Poin
          </span>
          <span className={`px-2 py-0.5 rounded-lg font-bold ${
            (s.achievementPoints || 0) > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-100 text-slate-500'
          }`}>
            🏆 {s.achievementPoints || 0}
          </span>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: s => <StatusBadge status={s.status} />
    },
    {
      header: 'Aksi',
      className: 'text-right',
      cell: s => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => handleOpenDetail(s)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
            title="Lihat Detail Profil & Rekap"
          >
            <Eye className="w-4 h-4" />
          </button>
          {isWakaOrAdmin && (
            <>
              <button
                onClick={e => handleOpenEdit(s, e)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                title="Edit Data Siswa"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={e => handleOpenDelete(s, e)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                title="Hapus Siswa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
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
            Data Siswa Sekolah
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Database lengkap kesiswaan, riwayat ekstrakurikuler, presensi, pelanggaran, dan prestasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportActions
            filename="data_siswa_sekolah"
            title="Daftar Siswa Sekolah"
            data={filteredStudents}
            headers={[
              { header: 'NIS', key: 'nis' },
              { header: 'NISN', key: 'nisn' },
              { header: 'Nama Lengkap', key: 'fullName' },
              { header: 'L/P', key: 'gender' },
              { header: 'Kelas', key: 'className' },
              { header: 'Jurusan', key: 'major' },
              { header: 'No HP', key: 'phone' },
              { header: 'Orang Tua / Wali', key: 'parentName' },
              { header: 'Poin Pelanggaran', key: 'violationPoints' },
              { header: 'Poin Prestasi', key: 'achievementPoints' },
              { header: 'Status', key: 'status' }
            ]}
          />

          {isWakaOrAdmin && (
            <>
              <button
                onClick={() => setIsImportOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Import Excel/CSV</span>
              </button>

              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Siswa</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500 font-semibold">
          <Filter className="w-4 h-4" />
          <span>Filter Data:</span>
        </div>

        {/* Filter Kelas */}
        <select
          value={selectedClass}
          onChange={e => setSelectedClass(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 font-medium"
        >
          <option value="all">Semua Kelas ({students.length})</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} ({students.filter(s => s.classId === c.id).length})
            </option>
          ))}
        </select>

        {/* Filter Status */}
        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 font-medium"
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
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 font-medium"
        >
          <option value="all">Semua Gender</option>
          <option value="L">Laki-Laki (L)</option>
          <option value="P">Perempuan (P)</option>
        </select>

        {(selectedClass !== 'all' || selectedStatus !== 'all' || selectedGender !== 'all') && (
          <button
            onClick={() => {
              setSelectedClass('all');
              setSelectedStatus('all');
              setSelectedGender('all');
            }}
            className="text-xs text-rose-600 hover:underline font-semibold ml-auto"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Main Table */}
      <DataTable
        id="students-table"
        data={filteredStudents}
        columns={columns}
        searchPlaceholder="Cari siswa berdasarkan NIS, Nama, atau Kelas..."
        searchableKeys={['nis', 'nisn', 'fullName', 'className', 'parentName']}
        onRowClick={handleOpenDetail}
        emptyTitle="Tidak Ada Siswa"
        emptySubtitle="Tidak ditemukan data siswa yang sesuai dengan filter pencarian."
      />

      {/* Form Modal (Add / Edit) */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
        subtitle="Lengkapi data kesiswaan sesuai dokumen resmi sekolah"
        maxWidth="2xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveStudent}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
            >
              Simpan Data Siswa
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                NIS (Nomor Induk Siswa) *
              </label>
              <input
                type="text"
                required
                value={formData.nis}
                onChange={e => setFormData({ ...formData, nis: e.target.value })}
                placeholder="Contoh: 24251001"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                NISN (Nasional)
              </label>
              <input
                type="text"
                value={formData.nisn}
                onChange={e => setFormData({ ...formData, nisn: e.target.value })}
                placeholder="Contoh: 0081234501"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Lengkap Siswa *
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Contoh: Aditya Pratama Nugraha"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jenis Kelamin *
              </label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="L">Laki-Laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tempat Lahir
              </label>
              <input
                type="text"
                value={formData.birthPlace}
                onChange={e => setFormData({ ...formData, birthPlace: e.target.value })}
                placeholder="Jakarta"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Lahir
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rombel Kelas *
              </label>
              <select
                value={formData.classId}
                onChange={e => {
                  const targetClass = classes.find(c => c.id === e.target.value);
                  setFormData({
                    ...formData,
                    classId: e.target.value,
                    className: targetClass?.name || '',
                    major: targetClass?.major || ''
                  });
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.major}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status Siswa
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Aktif">Aktif</option>
                <option value="Alumni">Alumni</option>
                <option value="Pindah">Pindah</option>
                <option value="Keluar">Keluar</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                No HP / WhatsApp Siswa
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="081234567890"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Orang Tua / Wali
              </label>
              <input
                type="text"
                value={formData.parentName}
                onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                placeholder="Nama Ayah/Ibu/Wali"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Alamat Domisili
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="Alamat lengkap tempat tinggal siswa..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {selectedStudent && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Profil Siswa: ${selectedStudent.fullName}`}
          subtitle={`NIS: ${selectedStudent.nis} | Kelas: ${selectedStudent.className}`}
          maxWidth="3xl"
          footer={
            <button
              onClick={() => setIsDetailOpen(false)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
            >
              Tutup
            </button>
          }
        >
          {/* Navigation Tabs in Detail */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-1 text-xs font-bold">
            <button
              onClick={() => setDetailTab('profile')}
              className={`px-3 py-2 rounded-t-xl transition-colors ${
                detailTab === 'profile' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Biodata Lengkap
            </button>
            <button
              onClick={() => setDetailTab('ekskul')}
              className={`px-3 py-2 rounded-t-xl transition-colors ${
                detailTab === 'ekskul' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Ekstrakurikuler ({studentMemberships.length})
            </button>
            <button
              onClick={() => setDetailTab('prestasi')}
              className={`px-3 py-2 rounded-t-xl transition-colors ${
                detailTab === 'prestasi' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Prestasi ({studentAchievements.length})
            </button>
            <button
              onClick={() => setDetailTab('pelanggaran')}
              className={`px-3 py-2 rounded-t-xl transition-colors ${
                detailTab === 'pelanggaran' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pelanggaran ({studentViolations.length})
            </button>
          </div>

          {/* Tab 1: Profile */}
          {detailTab === 'profile' && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
                  <p className="font-bold text-slate-500 uppercase tracking-wider">Identitas Pribadi</p>
                  <p><strong>Nama Lengkap:</strong> {selectedStudent.fullName}</p>
                  <p><strong>NIS / NISN:</strong> {selectedStudent.nis} / {selectedStudent.nisn || '-'}</p>
                  <p><strong>Jenis Kelamin:</strong> {selectedStudent.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}</p>
                  <p><strong>Tempat, Tgl Lahir:</strong> {selectedStudent.birthPlace}, {selectedStudent.birthDate}</p>
                  <p><strong>Status Siswa:</strong> <StatusBadge status={selectedStudent.status} /></p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
                  <p className="font-bold text-slate-500 uppercase tracking-wider">Akademik & Kontak</p>
                  <p><strong>Kelas:</strong> {selectedStudent.className}</p>
                  <p><strong>Jurusan:</strong> {selectedStudent.major}</p>
                  <p><strong>No HP Siswa:</strong> {selectedStudent.phone || '-'}</p>
                  <p><strong>Orang Tua / Wali:</strong> {selectedStudent.parentName || '-'}</p>
                  <p><strong>No HP Wali:</strong> {selectedStudent.parentPhone || '-'}</p>
                  <p><strong>Alamat:</strong> {selectedStudent.address || '-'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Ekskul */}
          {detailTab === 'ekskul' && (
            <div className="space-y-3 pt-2">
              {studentMemberships.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Siswa belum terdaftar pada ekstrakurikuler manapun.</p>
              ) : (
                studentMemberships.map(m => (
                  <div key={m.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{m.extracurricularName}</p>
                      <p className="text-slate-400">No Anggota: {m.memberNumber || '-'} • Bergabung: {m.joinDate}</p>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Prestasi */}
          {detailTab === 'prestasi' && (
            <div className="space-y-3 pt-2">
              {studentAchievements.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Belum ada catatan prestasi terverifikasi.</p>
              ) : (
                studentAchievements.map(ach => (
                  <div key={ach.id} className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{ach.title}</span>
                      <span className="font-bold text-amber-700 dark:text-amber-300">+{ach.pointsAwarded} Poin</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{ach.rank} ({ach.level}) • Penyelenggara: {ach.organizer}</p>
                    <p className="text-[10px] text-slate-400">Tanggal: {ach.date}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 4: Pelanggaran */}
          {detailTab === 'pelanggaran' && (
            <div className="space-y-3 pt-2">
              {studentViolations.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center text-emerald-600 font-semibold">
                  ✨ Bersih dari catatan pelanggaran tata tertib sekolah.
                </p>
              ) : (
                studentViolations.map(v => (
                  <div key={v.id} className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-800 dark:text-rose-300">{v.violationType}</span>
                      <span className="font-bold text-rose-600">+{v.points} Poin ({v.category})</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">Tindakan: {v.actionTaken}</p>
                    <p className="text-[10px] text-slate-400">Dicatat oleh: {v.officerName} • {v.date}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </Modal>
      )}

      {/* Import Modal */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Data Siswa dari Excel / CSV"
        subtitle="Unggah file spreadsheet berformat .xlsx atau .csv dengan kolom NIS, Nama Lengkap, Jenis Kelamin, dan Kelas."
        maxWidth="md"
      >
        <div className="space-y-4 py-3">
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-indigo-500 transition-colors">
            <Upload className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Pilih file Excel (.xlsx) atau CSV (.csv)
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              File akan otomatis dipetakan ke database siswa.
            </p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="mt-4 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Data Siswa"
        message={`Apakah Anda yakin ingin menghapus data siswa ${selectedStudent?.fullName} (NIS: ${selectedStudent?.nis})? Data historis terkait akan dihapus.`}
        confirmText="Hapus Siswa"
      />
    </div>
  );
};
