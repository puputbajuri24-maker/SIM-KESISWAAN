import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  Compass,
  CheckCircle2,
  AlertCircle,
  Filter,
  Edit2,
  Trash2,
  ClipboardCheck,
  CalendarDays
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { Schedule, ScheduleType } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';

interface SchedulesPageProps {
  onStartAttendance?: (schedule: Schedule) => void;
}

export const SchedulesPage: React.FC<SchedulesPageProps> = ({ onStartAttendance }) => {
  const { isWakaOrAdmin, isPembina, currentUser } = useAuth();
  const { schedules, extracurriculars, addSchedule, updateSchedule, deleteSchedule, activeAcademicYear } = useSchool();

  const [selectedEkskul, setSelectedEkskul] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  const [formData, setFormData] = useState<Partial<Schedule>>({
    title: '',
    extracurricularId: '',
    extracurricularName: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '15:30',
    endTime: '17:00',
    location: '',
    coachName: '',
    type: 'Rutin',
    description: '',
    status: 'Terjadwal'
  });

  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      if (selectedEkskul !== 'all' && s.extracurricularId !== selectedEkskul) return false;
      if (selectedType !== 'all' && s.type !== selectedType) return false;
      return true;
    });
  }, [schedules, selectedEkskul, selectedType]);

  const handleOpenAdd = () => {
    setSelectedSchedule(null);
    const defaultEkskul = extracurriculars[0];
    setFormData({
      title: defaultEkskul ? `Latihan Rutin ${defaultEkskul.name}` : 'Latihan Rutin',
      extracurricularId: defaultEkskul?.id || '',
      extracurricularName: defaultEkskul?.name || '',
      date: new Date().toISOString().split('T')[0],
      startTime: defaultEkskul?.startTime || '15:30',
      endTime: defaultEkskul?.endTime || '17:00',
      location: defaultEkskul?.location || 'Sekolah',
      coachName: defaultEkskul?.coachName || currentUser?.displayName || '',
      type: 'Rutin',
      description: 'Latihan rutin mingguan pendalaman materi dan fisik.',
      status: 'Terjadwal'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (schedule: Schedule, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedSchedule(schedule);
    setFormData(schedule);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (schedule: Schedule, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedSchedule(schedule);
    setIsDeleteOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.extracurricularId) {
      alert('Mohon isi judul kegiatan, tanggal, dan pilih ekstrakurikuler.');
      return;
    }

    const ekskul = extracurriculars.find(e => e.id === formData.extracurricularId);

    if (selectedSchedule) {
      await updateSchedule(selectedSchedule.id, {
        ...formData,
        extracurricularName: ekskul?.name || formData.extracurricularName
      });
    } else {
      await addSchedule({
        title: formData.title!,
        extracurricularId: formData.extracurricularId!,
        extracurricularName: ekskul?.name || 'Ekstrakurikuler',
        date: formData.date!,
        startTime: formData.startTime || '15:30',
        endTime: formData.endTime || '17:00',
        location: formData.location || 'Sekolah',
        coachName: formData.coachName || ekskul?.coachName || 'Pembina',
        type: formData.type as ScheduleType,
        notes: (formData as any).description || (formData as any).notes || '',
        status: (formData.status as any) || 'Dijadwalkan',
        academicYear: activeAcademicYear
      });
    }
    setIsFormOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (selectedSchedule) {
      await deleteSchedule(selectedSchedule.id);
      setIsDeleteOpen(false);
      setSelectedSchedule(null);
    }
  };

  const columns: Column<Schedule>[] = [
    {
      header: 'Kegiatan / Sesi',
      accessorKey: 'title',
      sortable: true,
      cell: s => (
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100">{s.title}</p>
          <p className="text-[11px] text-slate-400">{s.extracurricularName} • {s.coachName}</p>
        </div>
      )
    },
    {
      header: 'Tanggal & Waktu',
      accessorKey: 'date',
      sortable: true,
      cell: s => (
        <div>
          <span className="font-semibold text-xs text-indigo-600 dark:text-indigo-400">{s.date}</span>
          <p className="text-[11px] text-slate-400">{s.startTime} - {s.endTime} WIB</p>
        </div>
      )
    },
    {
      header: 'Lokasi',
      accessorKey: 'location',
      cell: s => <span className="text-xs text-slate-600 dark:text-slate-300">📍 {s.location}</span>
    },
    {
      header: 'Tipe',
      accessorKey: 'type',
      cell: s => (
        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
          {s.type}
        </span>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: s => <StatusBadge status={s.status} />
    },
    {
      header: 'Aksi',
      className: 'text-right',
      cell: s => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          {onStartAttendance && (
            <button
              onClick={() => onStartAttendance(s)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 flex items-center gap-1"
              title="Input Presensi Sesi Ini"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Presensi</span>
            </button>
          )}
          <button
            onClick={e => handleOpenEdit(s, e)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={e => handleOpenDelete(s, e)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
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
            Jadwal & Kalender Kegiatan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Penjadwalan latihan rutin mingguan, uji coba tanding, persiapan lomba, dan gladi bersih kesiswaan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'timeline' ? 'bg-white dark:bg-slate-900 shadow-xs text-indigo-600' : 'text-slate-500'
              }`}
            >
              Timeline Card
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white dark:bg-slate-900 shadow-xs text-indigo-600' : 'text-slate-500'
              }`}
            >
              Tabel
            </button>
          </div>

          <ExportActions
            filename="jadwal_kegiatan_ekskul"
            title="Jadwal Kegiatan Ekstrakurikuler"
            data={filteredSchedules}
            headers={[
              { header: 'Kegiatan', key: 'title' },
              { header: 'Ekstrakurikuler', key: 'extracurricularName' },
              { header: 'Tanggal', key: 'date' },
              { header: 'Jam Mulai', key: 'startTime' },
              { header: 'Jam Selesai', key: 'endTime' },
              { header: 'Lokasi', key: 'location' },
              { header: 'Pembina', key: 'coachName' },
              { header: 'Tipe', key: 'type' },
              { header: 'Status', key: 'status' }
            ]}
          />

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Jadwal</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500 font-semibold">
          <Filter className="w-4 h-4" />
          <span>Filter Jadwal:</span>
        </div>

        <select
          value={selectedEkskul}
          onChange={e => setSelectedEkskul(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium"
        >
          <option value="all">Semua Ekstrakurikuler ({schedules.length})</option>
          {extracurriculars.map(e => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium"
        >
          <option value="all">Semua Tipe Jadwal</option>
          <option value="Rutin">Rutin</option>
          <option value="Tambahan">Tambahan</option>
          <option value="Uji Coba">Uji Coba</option>
          <option value="Lomba">Lomba</option>
          <option value="Gladi Bersih">Gladi Bersih</option>
        </select>
      </div>

      {/* View Mode: Timeline Cards */}
      {viewMode === 'timeline' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchedules.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Tidak ada jadwal kegiatan</p>
              <p className="text-xs text-slate-400 mt-1">Gunakan tombol "+ Buat Jadwal" untuk membuat agenda latihan baru.</p>
            </div>
          ) : (
            filteredSchedules.map(sch => (
              <div
                key={sch.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800">
                      {sch.type}
                    </span>
                    <StatusBadge status={sch.status} />
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      {sch.title}
                    </h3>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                      {sch.extracurricularName}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {sch.description}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-slate-800 dark:text-slate-100">{sch.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sch.startTime} - {sch.endTime} WIB</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{sch.location}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  {onStartAttendance ? (
                    <button
                      onClick={() => onStartAttendance(sch)}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      <span>Buka Presensi</span>
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={e => handleOpenEdit(sch, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={e => handleOpenDelete(sch, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <DataTable
          id="schedules-table"
          data={filteredSchedules}
          columns={columns}
          searchPlaceholder="Cari jadwal kegiatan atau ekstrakurikuler..."
          searchableKeys={['title', 'extracurricularName', 'location', 'coachName']}
        />
      )}

      {/* Form Modal (Add / Edit) */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedSchedule ? 'Edit Jadwal Kegiatan' : 'Buat Jadwal Kegiatan Baru'}
        subtitle="Atur tanggal, jam pelaksanaan, dan lokasi latihan"
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
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
            >
              Simpan Jadwal
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pilih Ekstrakurikuler *
            </label>
            <select
              value={formData.extracurricularId}
              onChange={e => {
                const targetEkskul = extracurriculars.find(ek => ek.id === e.target.value);
                setFormData({
                  ...formData,
                  extracurricularId: e.target.value,
                  extracurricularName: targetEkskul?.name || '',
                  coachName: targetEkskul?.coachName || '',
                  location: targetEkskul?.location || formData.location
                });
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            >
              {extracurriculars.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Judul Sesi / Agenda Kegiatan *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Latihan Rutin & Drill Taktik"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jam Mulai
              </label>
              <input
                type="text"
                value={formData.startTime}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                placeholder="15:30"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jam Selesai
              </label>
              <input
                type="text"
                value={formData.endTime}
                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                placeholder="17:00"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipe Sesi
              </label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as ScheduleType })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="Rutin">Rutin</option>
                <option value="Tambahan">Tambahan</option>
                <option value="Uji Coba">Uji Coba</option>
                <option value="Lomba">Lomba</option>
                <option value="Gladi Bersih">Gladi Bersih</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="Terjadwal">Terjadwal</option>
                <option value="Selesai">Selesai</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Lokasi / Tempat Pelaksanaan
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="Contoh: Lapangan Basket Utama"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Deskripsi & Materi
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Rencana materi latihan..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Jadwal Kegiatan"
        message={`Apakah Anda yakin ingin menghapus jadwal "${selectedSchedule?.title}" pada tanggal ${selectedSchedule?.date}?`}
        confirmText="Hapus Jadwal"
      />
    </div>
  );
};
