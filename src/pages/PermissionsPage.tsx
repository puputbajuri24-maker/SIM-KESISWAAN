import React, { useState, useRef, useMemo } from 'react';
import {
  FileCheck2,
  Plus,
  CheckCircle,
  XCircle,
  Printer,
  Calendar,
  Eye,
  Edit2,
  Trash2,
  Filter,
  Sparkles,
  Send,
  Building,
  UserCheck,
  RefreshCw,
  CheckCircle2,
  Search
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { StudentPermission, PermissionType, PermissionStatus } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';
import { SchoolLetterhead } from '../components/common/SchoolLetterhead';
import { ClassGridFilter } from '../components/common/ClassGridFilter';
import { calculateRecordCountsByClass, isStudentInClass } from '../utils/classResolver';

export const PermissionsPage: React.FC = () => {
  const { isWakaOrAdmin, currentUser } = useAuth();
  const { toast } = useToast();
  const [isSavingPermission, setIsSavingPermission] = useState(false);
  const {
    permissions,
    students,
    classes,
    addPermission,
    updatePermission,
    deletePermission,
    schoolInfo,
    activeAcademicYear,
    letters = [],
    addSchoolLetter
  } = useSchool();

  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Count permissions per class
  const permissionCountsByClassId = useMemo(() => {
    return calculateRecordCountsByClass(permissions, classes, students);
  }, [permissions, classes, students]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLetterOpen, setIsLetterOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPerm, setSelectedPerm] = useState<StudentPermission | null>(null);

  // Modal fast selection state
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('all');

  // Filtered students for quick grid picker
  const displayedStudents = useMemo(() => {
    return (students || []).filter(s => {
      if (studentClassFilter !== 'all' && s.className !== studentClassFilter) {
        return false;
      }
      if (!studentSearchQuery.trim()) return true;
      const q = studentSearchQuery.toLowerCase().trim();
      return (
        (s.fullName && s.fullName.toLowerCase().includes(q)) ||
        (s.nis && s.nis.toLowerCase().includes(q)) ||
        (s.className && s.className.toLowerCase().includes(q))
      );
    });
  }, [students, studentSearchQuery, studentClassFilter]);

  const [formData, setFormData] = useState<Partial<StudentPermission>>({
    studentId: '',
    studentName: '',
    studentNis: '',
    studentClass: '',
    type: 'Dispensasi Lomba',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
    activityName: '',
    status: 'Disetujui',
    approvedBy: currentUser?.displayName || 'Waka Kesiswaan'
  });

  const filteredPermissions = useMemo(() => {
    return permissions.filter(p => {
      if (selectedClass !== 'all') {
        const student = students.find(s => s.id === p.studentId);
        const match = isStudentInClass(p, selectedClass, classes) || (student && isStudentInClass(student, selectedClass, classes));
        if (!match) return false;
      }
      if (selectedType !== 'all' && p.type !== selectedType) return false;
      if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
      return true;
    });
  }, [permissions, selectedClass, selectedType, selectedStatus, classes, students]);

  const handleOpenAdd = () => {
    setSelectedPerm(null);
    setStudentSearchQuery('');
    setStudentClassFilter('all');
    const defaultStudent = students[0];
    setFormData({
      studentId: defaultStudent?.id || '',
      studentName: defaultStudent?.fullName || '',
      studentNis: defaultStudent?.nis || '',
      studentClass: defaultStudent?.className || '',
      type: 'Dispensasi Lomba',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      reason: 'Mengikuti babak final kejuaraan mewakili kontingen sekolah.',
      activityName: 'Kejuaraan Olahraga Pelajar Tingkat Provinsi 2026',
      status: 'Disetujui',
      approvedBy: currentUser?.displayName || 'Waka Kesiswaan'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: StudentPermission, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedPerm(p);
    setFormData(p);
    setStudentSearchQuery('');
    setStudentClassFilter('all');
    setIsFormOpen(true);
  };

  const handleOpenLetter = (p: StudentPermission) => {
    setSelectedPerm(p);
    setIsLetterOpen(true);
  };

  const handleOpenDelete = (p: StudentPermission, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedPerm(p);
    setIsDeleteOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.startDate || !formData.reason) {
      toast.warning('Mohon lengkapi siswa, tanggal, dan alasan izin/dispensasi.');
      return;
    }

    setIsSavingPermission(true);
    try {
      const student = students.find(s => s.id === formData.studentId);

      if (selectedPerm) {
        await updatePermission(selectedPerm.id, {
          ...formData,
          studentName: student?.fullName || formData.studentName,
          studentNis: student?.nis || formData.studentNis,
          studentClass: student?.className || formData.studentClass
        });
        toast.success(`Surat izin untuk ${student?.fullName || 'siswa'} berhasil diperbarui!`);
      } else {
        await addPermission({
          studentId: formData.studentId!,
          studentName: student?.fullName || 'Siswa',
          studentNis: student?.nis || '',
          studentClass: student?.className || '',
          type: formData.type as PermissionType,
          startDate: formData.startDate!,
          endDate: formData.endDate || formData.startDate!,
          reason: formData.reason!,
          activityName: formData.activityName || '',
          status: (formData.status as PermissionStatus) || 'Disetujui',
          approvedBy: currentUser?.displayName || 'Waka Kesiswaan',
          academicYear: activeAcademicYear
        });
        toast.success(`Surat izin/dispensasi untuk ${student?.fullName || 'siswa'} berhasil diterbitkan!`);
      }
      setIsFormOpen(false);
      setSelectedPerm(null);
    } catch (err: any) {
      console.error('Error saving permission:', err);
      toast.error('Gagal menyimpan surat izin: ' + (err?.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsSavingPermission(false);
    }
  };

  const handleQuickApprove = async (perm: StudentPermission, status: PermissionStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    await updatePermission(perm.id, {
      status,
      approvedBy: currentUser?.displayName || 'Waka Kesiswaan'
    });
  };

  const handleSendToTU = async (p: StudentPermission, e: React.MouseEvent) => {
    e.stopPropagation();
    const existing = letters.find(l => l.studentId === p.studentId && l.category === 'dispensasi' && l.date === p.startDate);
    if (existing) {
      toast.info(`Surat dispensasi untuk ${p.studentName} sudah terdaftar di Tata Usaha (${existing.letterNumber || 'Menunggu Nomor TU'}).`);
      return;
    }

    try {
      await addSchoolLetter({
        letterNumber: '',
        letterType: 'surat_keluar',
        category: 'dispensasi',
        classificationCode: 'PP.00.6',
        title: `Surat Dispensasi - ${p.activityName || p.reason || 'Kegiatan Siswa'} (${p.studentName})`,
        subject: `Dispensasi Mengikuti ${p.activityName || 'Kegiatan'}`,
        sender: 'Waka Kesiswaan MAN 2 Seram Bagian Timur',
        recipient: 'Bapak/Ibu Guru Pengajar / Wali Kelas',
        date: p.startDate,
        description: `Dispensasi siswa a.n. ${p.studentName} (${p.studentClass}) untuk mengikuti ${p.activityName || p.reason} dari tanggal ${p.startDate} s.d. ${p.endDate || p.startDate}.`,
        contentBody: p.reason,
        status: 'draf_menunggu_nomor',
        studentId: p.studentId,
        studentID: p.studentId,
        studentName: p.studentName,
        studentClass: p.studentClass,
        studentNis: p.studentNis,
        academicYear: activeAcademicYear || '2026/2027',
        createdBy: currentUser?.displayName || 'Waka Kesiswaan'
      });
      toast.success(`Surat dispensasi "${p.studentName}" berhasil diteruskan ke Antrean Nomor Surat TU!`);
    } catch (err: any) {
      toast.error('Gagal mengirim ke TU: ' + (err?.message || 'Terjadi kesalahan'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedPerm) {
      try {
        await deletePermission(selectedPerm.id);
      } catch (err) {
        console.error('Error deleting permission:', err);
      } finally {
        setIsDeleteOpen(false);
        setSelectedPerm(null);
      }
    }
  };

  const printLetter = () => {
    if (!selectedPerm) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const leftLogo = schoolInfo.logoLeftUrl || schoolInfo.logoUrl;
    const rightLogo = schoolInfo.logoRightUrl;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Surat Dispensasi - ${selectedPerm.studentName}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; padding: 30px; margin: 0; color: #111; }
            .header { display: flex; align-items: center; justify-content: space-between; gap: 15px; margin-bottom: 8px; }
            .logo { width: 80px; height: 80px; object-fit: contain; }
            .center-text { flex: 1; text-align: center; }
            .center-text h4 { font-size: 13px; margin: 0; text-transform: uppercase; font-weight: bold; }
            .center-text h5 { font-size: 12px; margin: 3px 0 0 0; text-transform: uppercase; font-weight: bold; }
            .center-text h2 { font-size: 17px; margin: 5px 0; text-transform: uppercase; font-weight: 900; }
            .center-text p { font-family: Arial, sans-serif; font-size: 11px; margin: 2px 0; color: #333; }
            .double-line { border-bottom: 3px solid #000; margin-bottom: 2px; }
            .single-line { border-bottom: 1px solid #000; margin-bottom: 25px; }
            .body-content { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.7; margin-top: 20px; }
            .student-info { margin: 15px 0 15px 25px; line-height: 1.8; }
            .agenda-box { padding: 10px 15px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: bold; margin: 12px 0; }
            .signatures { margin-top: 50px; display: flex; justify-content: space-between; }
            @media print { body { padding: 15px; } }
          </style>
        </head>
        <body>
          <div class="header">
            ${leftLogo ? `<img class="logo" src="${leftLogo}" alt="Logo Kiri" />` : '<div style="width:80px"></div>'}
            <div class="center-text">
              ${schoolInfo.centralInstitution ? `<h4>${schoolInfo.centralInstitution}</h4>` : ''}
              ${schoolInfo.regionalInstitution ? `<h5>${schoolInfo.regionalInstitution}</h5>` : ''}
              <h2>${schoolInfo.name}</h2>
              ${schoolInfo.address ? `<p>${schoolInfo.address}</p>` : ''}
            </div>
            ${rightLogo ? `<img class="logo" src="${rightLogo}" alt="Logo Kanan" />` : '<div style="width:80px"></div>'}
          </div>
          <div class="double-line"></div>
          <div class="single-line"></div>

          <div class="body-content">
            <h3 style="text-align: center; text-decoration: underline; text-transform: uppercase; margin-bottom: 3px; font-size: 13px;">
              SURAT KETERANGAN DISPENSASI KESISWAAN
            </h3>
            <p style="text-align: center; margin-top: 0; font-size: 11px; color: #555;">
              Nomor: 421.3 / ${selectedPerm.id.slice(0, 5).toUpperCase()} / DISP / ${new Date().getFullYear()}
            </p>

            <p style="margin-top: 25px;">
              Yang bertanda tangan di bawah ini, Kepala Sekolah / Waka Kesiswaan <strong>${schoolInfo.name}</strong> menerangkan bahwa:
            </p>

            <div class="student-info">
              <div><strong>Nama Lengkap:</strong> ${selectedPerm.studentName}</div>
              <div><strong>Nomor Induk Siswa (NIS):</strong> ${selectedPerm.studentNis}</div>
              <div><strong>Kelas:</strong> ${selectedPerm.studentClass}</div>
              <div><strong>Sekolah / Madrasah:</strong> ${schoolInfo.name}</div>
            </div>

            <p>
              Diberikan izin dispensasi tidak mengikuti Kegiatan Belajar Mengajar (KBM) pada tanggal <strong>${selectedPerm.startDate} ${selectedPerm.endDate && selectedPerm.endDate !== selectedPerm.startDate ? `s/d ${selectedPerm.endDate}` : ''}</strong> sehubungan dengan keikutsertaan dalam agenda kesiswaan:
            </p>

            <div class="agenda-box">
              📌 ${selectedPerm.activityName || selectedPerm.type}: ${selectedPerm.reason}
            </div>

            <p>
              Demikian surat dispensasi ini diterbitkan untuk dipergunakan sebagaimana mestinya dan kepada bapak/ibu guru pengajar mata pelajaran yang bersangkutan dimohon maklum adanya.
            </p>

            <div class="signatures">
              <div>
                <p>Mengetahui,</p>
                <p><strong>Kepala Sekolah</strong></p>
                <div style="height: 55px;"></div>
                <p><strong><u>${schoolInfo.principalName}</u></strong></p>
                <p style="font-size: 10px;">NIP. ${schoolInfo.principalNip || '19750812 200003 1 002'}</p>
              </div>
              <div style="text-align: right;">
                <p>Dikeluarkan pada: ${selectedPerm.startDate}</p>
                <p><strong>Waka Bidang Kesiswaan</strong></p>
                <div style="height: 55px;"></div>
                <p><strong><u>${selectedPerm.approvedBy || schoolInfo.wakaKesiswaanName || schoolInfo.wakaName}</u></strong></p>
                <p style="font-size: 10px;">NIP. ${schoolInfo.wakaNip || '19820415 200604 1 008'}</p>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const columns: Column<StudentPermission>[] = [
    {
      header: 'Nama Siswa & NIS',
      accessorKey: 'studentName',
      sortable: true,
      cell: p => (
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100">{p.studentName}</p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">NIS: {p.studentNis} • Kelas: {p.studentClass}</p>
        </div>
      )
    },
    {
      header: 'Jenis Izin / Dispensasi',
      accessorKey: 'type',
      sortable: true,
      cell: p => (
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">{p.type}</span>
            {p.type.includes('Dispensasi') && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-black bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 shadow-2xs" title="Klasifikasi Persuratan Kemenag: PP.00.6 (Dispensasi)">
                PP.00.6
              </span>
            )}
          </div>
          {p.activityName && <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium line-clamp-1 mt-0.5">{p.activityName}</p>}
        </div>
      )
    },
    {
      header: 'Rentang Tanggal',
      accessorKey: 'startDate',
      sortable: true,
      cell: p => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {p.startDate} {p.endDate && p.endDate !== p.startDate && `s/d ${p.endDate}`}
          </span>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Alasan: {p.reason}</p>
        </div>
      )
    },
    {
      header: 'Status & Pengesahan',
      accessorKey: 'status',
      sortable: true,
      cell: p => (
        <div>
          <StatusBadge status={p.status} />
          {p.approvedBy && <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">Oleh: {p.approvedBy}</p>}
        </div>
      )
    },
    {
      header: 'Aksi',
      className: 'text-right',
      cell: p => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          {p.status === 'Diajukan' && (
            <>
              <button
                onClick={e => handleQuickApprove(p, 'Disetujui', e)}
                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-400 transition-colors"
                title="Setujui Izin / Dispensasi"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={e => handleQuickApprove(p, 'Ditolak', e)}
                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-400 transition-colors"
                title="Tolak Izin"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={() => handleOpenLetter(p)}
            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-400 transition-colors"
            title="Cetak Surat Dispensasi Resmi"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={e => handleSendToTU(p, e)}
            className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-600 dark:bg-teal-950/60 dark:hover:bg-teal-900 dark:text-teal-400 transition-colors"
            title="Teruskan ke Antrean Nomor Surat TU"
          >
            <Send className="w-4 h-4" />
          </button>

          <button
            onClick={e => handleOpenEdit(p, e)}
            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:hover:bg-amber-900 dark:text-amber-400 transition-colors"
            title="Edit Perizinan"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={e => handleOpenDelete(p, e)}
            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-400 transition-colors"
            title="Hapus Izin / Dispensasi"
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
            Perizinan Siswa & Surat Dispensasi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pengajuan izin sakit, keperluan keluarga, dan penerbitan surat dispensasi resmi lomba/kegiatan kesiswaan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportActions
            filename="daftar_perizinan_siswa"
            title="Rekapitulasi Perizinan & Dispensasi Siswa"
            data={filteredPermissions}
            headers={[
              { header: 'Nama Siswa', key: 'studentName' },
              { header: 'NIS', key: 'studentNis' },
              { header: 'Kelas', key: 'studentClass' },
              { header: 'Jenis Izin', key: 'type' },
              { header: 'Tanggal Mulai', key: 'startDate' },
              { header: 'Tanggal Selesai', key: 'endDate' },
              { header: 'Alasan / Kegiatan', key: 'reason' },
              { header: 'Nama Acara', key: 'activityName' },
              { header: 'Status', key: 'status' },
              { header: 'Disetujui Oleh', key: 'approvedBy' }
            ]}
          />

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Perizinan / Dispensasi</span>
          </button>
        </div>
      </div>

      {/* Class Grid Filter */}
      <ClassGridFilter
        classes={classes}
        selectedClassId={selectedClass}
        onSelectClass={setSelectedClass}
        countsByClassId={permissionCountsByClassId}
        totalCount={permissions.length}
        label="Filter Perizinan Berdasarkan Rombel Kelas"
        itemUnit="Surat"
        colorScheme="indigo"
      />

      {/* Secondary Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500 font-semibold">
          <Filter className="w-4 h-4" />
          <span>Filter Lanjutan:</span>
        </div>

        <select
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium"
        >
          <option value="all">Semua Jenis Perizinan</option>
          <option value="Dispensasi Lomba">Dispensasi Lomba</option>
          <option value="Dispensasi Kegiatan Sekolah">Dispensasi Kegiatan Sekolah</option>
          <option value="Sakit">Izin Sakit</option>
          <option value="Izin">Izin Keperluan Keluarga</option>
        </select>

        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium"
        >
          <option value="all">Semua Status</option>
          <option value="Diajukan">Diajukan (Menunggu ACC)</option>
          <option value="Disetujui">Disetujui (ACC)</option>
          <option value="Ditolak">Ditolak</option>
        </select>

        {(selectedClass !== 'all' || selectedType !== 'all' || selectedStatus !== 'all') && (
          <button
            onClick={() => {
              setSelectedClass('all');
              setSelectedType('all');
              setSelectedStatus('all');
            }}
            className="text-xs text-rose-600 hover:underline font-semibold ml-auto"
          >
            Reset Semua Filter
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable
        id="permissions-table"
        data={filteredPermissions}
        columns={columns}
        searchPlaceholder="Cari siswa, nama kegiatan lomba, atau alasan izin..."
        searchableKeys={['studentName', 'studentNis', 'activityName', 'reason']}
        onRowClick={handleOpenLetter}
      />

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedPerm ? 'Edit Perizinan / Dispensasi' : 'Penerbitan Surat Dispensasi / Izin Siswa'}
        subtitle="Surat keterangan resmi yang dapat dicetak dan ditandatangani"
        maxWidth="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSavingPermission}
              onClick={handleSave}
              className={`px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center gap-2 transition-all ${
                isSavingPermission ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isSavingPermission ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menerbitkan...</span>
                </>
              ) : (
                <span>Simpan & Terbitkan</span>
              )}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Quick Select Student Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pilih Siswa *
              </label>
              {formData.studentName && (
                <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                  Terpilih: {formData.studentName} ({formData.studentClass || '-'})
                </span>
              )}
            </div>

            {/* Student Search & Class Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Cari nama atau NIS siswa..."
                  value={studentSearchQuery}
                  onChange={e => setStudentSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <select
                value={studentClassFilter}
                onChange={e => setStudentClassFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-200 shrink-0"
              >
                <option value="all">Semua Kelas</option>
                {classes.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Interactive Student Selection Cards / Grid */}
            <div className="max-h-48 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5 border border-slate-200/80 dark:border-slate-800 rounded-lg p-1.5 bg-slate-50/60 dark:bg-slate-900/60">
              {displayedStudents.length === 0 ? (
                <div className="col-span-full py-5 text-center text-xs text-slate-500 dark:text-slate-400">
                  Tidak ada siswa yang cocok dengan pencarian "{studentSearchQuery}".
                </div>
              ) : (
                displayedStudents.map(s => {
                  const isSelected = formData.studentId === s.id;
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => {
                        setFormData({
                          ...formData,
                          studentId: s.id,
                          studentName: s.fullName,
                          studentNis: s.nis,
                          studentClass: s.className || ''
                        });
                      }}
                      className={`text-left p-2 rounded-lg border text-xs transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-950 dark:text-indigo-200 font-bold shadow-sm ring-1 ring-indigo-500'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="truncate min-w-0">
                        <p className="truncate font-semibold">{s.fullName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          NIS: {s.nis || '-'} • <span className="font-semibold text-slate-700 dark:text-slate-300">{s.className || '-'}</span>
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jenis Surat Izin *
              </label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as PermissionType })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value="Dispensasi Lomba">Dispensasi Kejuaraan / Lomba</option>
                <option value="Dispensasi Kegiatan Sekolah">Dispensasi Kepanitiaan / Acara Sekolah</option>
                <option value="Sakit">Izin Sakit</option>
                <option value="Izin">Izin Keperluan Keluarga</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Lomba / Acara (Jika Dispensasi)
              </label>
              <input
                type="text"
                value={formData.activityName}
                onChange={e => setFormData({ ...formData, activityName: e.target.value })}
                placeholder="Contoh: Babak Final Kejuaraan Karate Nasional"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Mulai Izin *
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Selesai *
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Alasan & Keperluan Resmi *
            </label>
            <textarea
              rows={2}
              required
              value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Jelaskan alasan permohonan dispensasi..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status Pengesahan
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as PermissionStatus })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="Diajukan">Diajukan</option>
                <option value="Disetujui">Disetujui (ACC)</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pejabat Pengesah
              </label>
              <input
                type="text"
                value={formData.approvedBy}
                onChange={e => setFormData({ ...formData, approvedBy: e.target.value })}
                placeholder="Waka Kesiswaan"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Official Dispensation Print Letter Modal */}
      {selectedPerm && (
        <Modal
          isOpen={isLetterOpen}
          onClose={() => setIsLetterOpen(false)}
          title="Surat Dispensasi / Keterangan Resmi"
          subtitle="Format cetak dokumen resmi sekolah dengan kop surat dan tanda tangan"
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Siap dicetak pada kertas A4</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLetterOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={printLetter}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Print Surat</span>
                </button>
              </div>
            </div>
          }
        >
          {/* Printable Letterhead Paper Style */}
          <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-xl border border-slate-200 shadow-inner font-serif leading-relaxed text-xs">
            {/* Kop Surat Resmi */}
            <SchoolLetterhead
              schoolInfo={schoolInfo}
              documentTitle="SURAT KETERANGAN DISPENSASI KESISWAAN"
              documentNumber={`421.3 / ${selectedPerm.id.slice(0, 5).toUpperCase()} / DISP / ${new Date().getFullYear()}`}
            />

            {/* Letter Body */}
            <div className="space-y-3 font-sans text-xs mt-4">
              <p>Yang bertanda tangan di bawah ini, Kepala Sekolah / Waka Kesiswaan {schoolInfo.name} menerangkan bahwa:</p>

              <div className="pl-6 space-y-1 my-2">
                <p><strong>Nama Lengkap:</strong> {selectedPerm.studentName}</p>
                <p><strong>Nomor Induk Siswa (NIS):</strong> {selectedPerm.studentNis}</p>
                <p><strong>Kelas:</strong> {selectedPerm.studentClass}</p>
                <p><strong>Sekolah:</strong> {schoolInfo.name}</p>
              </div>

              <p>
                Diberikan dispensasi / izin tidak mengikuti kegiatan belajar mengajar (KBM) pada tanggal{' '}
                <strong>
                  {selectedPerm.startDate}{' '}
                  {selectedPerm.endDate && selectedPerm.endDate !== selectedPerm.startDate && `s/d ${selectedPerm.endDate}`}
                </strong>{' '}
                sehubungan dengan keikutsertaan dalam agenda:
              </p>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold">
                📌 {selectedPerm.activityName || selectedPerm.type}: {selectedPerm.reason}
              </div>

              <p>
                Demikian surat dispensasi ini diterbitkan untuk dipergunakan sebagaimana mestinya dan kepada guru mata pelajaran yang bersangkutan dimohon maklum adanya.
              </p>
            </div>

            {/* Signature Block */}
            <div className="mt-8 flex justify-between pt-4 font-sans text-xs">
              <div>
                <p className="text-slate-500">Mengetahui,</p>
                <p className="font-bold text-slate-800">Kepala Sekolah</p>
                <div className="h-14"></div>
                <p className="font-bold underline">{schoolInfo.principalName}</p>
                <p className="text-[10px] text-slate-500">NIP. 19750812 200003 1 002</p>
              </div>

              <div className="text-right">
                <p className="text-slate-500">Dikeluarkan pada: {selectedPerm.startDate}</p>
                <p className="font-bold text-slate-800">Waka Bidang Kesiswaan</p>
                <div className="h-14"></div>
                <p className="font-bold underline">{selectedPerm.approvedBy || schoolInfo.wakaKesiswaanName}</p>
                <p className="text-[10px] text-slate-500">NIP. 19820415 200604 1 008</p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Surat Izin"
        message={`Apakah Anda yakin ingin menghapus perizinan siswa ${selectedPerm?.studentName}?`}
        confirmText="Hapus Izin"
      />
    </div>
  );
};
