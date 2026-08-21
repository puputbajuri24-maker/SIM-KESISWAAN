import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  MapPin,
  Clock,
  DollarSign,
  Users,
  FileText,
  Edit2,
  Trash2,
  Compass,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { Activity } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';

export const ActivitiesPage: React.FC = () => {
  const { isWakaOrAdmin } = useAuth();
  const { activities, extracurriculars, addActivity, updateActivity, deleteActivity } = useSchool();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const [formData, setFormData] = useState<Partial<Activity>>({
    title: '',
    extracurricularId: '',
    extracurricularName: '',
    date: new Date().toISOString().split('T')[0],
    endDate: '',
    location: '',
    organizer: '',
    description: '',
    budget: 0,
    participantCount: 0,
    status: 'Rencana'
  });

  const handleOpenAdd = () => {
    setSelectedActivity(null);
    setFormData({
      title: '',
      extracurricularId: extracurriculars[0]?.id || '',
      extracurricularName: extracurriculars[0]?.name || '',
      date: new Date().toISOString().split('T')[0],
      endDate: '',
      location: 'Aula Utama Sekolah',
      organizer: 'Waka Kesiswaan & OSIS',
      description: '',
      budget: 1500000,
      participantCount: 50,
      status: 'Rencana'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (act: Activity, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedActivity(act);
    setFormData(act);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (act: Activity) => {
    setSelectedActivity(act);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (act: Activity, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedActivity(act);
    setIsDeleteOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.location) {
      alert('Mohon lengkapi judul kegiatan, tanggal, dan lokasi.');
      return;
    }

    const ekskul = extracurriculars.find(e => e.id === formData.extracurricularId);

    if (selectedActivity) {
      await updateActivity(selectedActivity.id, {
        ...formData,
        extracurricularName: ekskul?.name || formData.extracurricularName
      });
    } else {
      await addActivity({
        title: formData.title!,
        extracurricularId: formData.extracurricularId || '',
        extracurricularName: ekskul?.name || 'Kesiswaan Umum',
        date: formData.date!,
        endDate: formData.endDate || '',
        location: formData.location!,
        organizer: formData.organizer || 'Kesiswaan',
        description: formData.description || '',
        budget: Number(formData.budget) || 0,
        participantCount: Number(formData.participantCount) || 0,
        status: (formData.status as any) || 'Rencana'
      });
    }
    setIsFormOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (selectedActivity) {
      await deleteActivity(selectedActivity.id);
      setIsDeleteOpen(false);
      setSelectedActivity(null);
    }
  };

  const columns: Column<Activity>[] = [
    {
      header: 'Nama Kegiatan / Event',
      accessorKey: 'title',
      sortable: true,
      cell: a => (
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100">{a.title}</p>
          <p className="text-[11px] text-slate-400">
            {a.extracurricularName} • Penyelenggara: {a.organizer}
          </p>
        </div>
      )
    },
    {
      header: 'Waktu Pelaksanaan',
      accessorKey: 'date',
      sortable: true,
      cell: a => (
        <div>
          <span className="font-semibold text-xs text-indigo-600 dark:text-indigo-400">
            {a.date} {a.endDate && `s/d ${a.endDate}`}
          </span>
          <p className="text-[11px] text-slate-400">📍 {a.location}</p>
        </div>
      )
    },
    {
      header: 'Peserta & Anggaran',
      cell: a => (
        <div className="text-xs">
          <p className="font-bold text-slate-800 dark:text-slate-200">👥 {a.participantCount || 0} Peserta</p>
          <p className="text-[11px] text-emerald-600 font-semibold">
            💰 Rp {(a.budget || 0).toLocaleString('id-ID')}
          </p>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: a => <StatusBadge status={a.status} />
    },
    {
      header: 'Aksi',
      className: 'text-right',
      cell: a => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => handleOpenDetail(a)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={e => handleOpenEdit(a, e)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={e => handleOpenDelete(a, e)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
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
            Agenda & Kegiatan Kesiswaan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Program kerja kesiswaan, kejuaraan, festival seni, kemah bakti, dan workshop kepemimpinan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportActions
            filename="agenda_kegiatan_kesiswaan"
            title="Daftar Agenda Kegiatan Kesiswaan"
            data={activities}
            headers={[
              { header: 'Nama Kegiatan', key: 'title' },
              { header: 'Unit / Ekskul', key: 'extracurricularName' },
              { header: 'Tanggal Mulai', key: 'date' },
              { header: 'Tanggal Selesai', key: 'endDate' },
              { header: 'Lokasi', key: 'location' },
              { header: 'Penyelenggara', key: 'organizer' },
              { header: 'Jumlah Peserta', key: 'participantCount' },
              { header: 'Anggaran (Rp)', key: 'budget' },
              { header: 'Status', key: 'status' }
            ]}
          />

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>+ Rencana Kegiatan</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        id="activities-table"
        data={activities}
        columns={columns}
        searchPlaceholder="Cari nama kegiatan, penyelenggara, atau lokasi..."
        searchableKeys={['title', 'extracurricularName', 'organizer', 'location']}
        onRowClick={handleOpenDetail}
      />

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedActivity ? 'Edit Rencana Kegiatan' : 'Tambah Agenda Kegiatan Baru'}
        subtitle="Rincian program kerja, kebutuhan anggaran, dan target peserta"
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
              Simpan Kegiatan
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama / Judul Kegiatan *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Turnamen Futsal Antar Sekolah Se-Provinsi"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kaitkan ke Ekstrakurikuler
              </label>
              <select
                value={formData.extracurricularId}
                onChange={e => {
                  const eks = extracurriculars.find(ek => ek.id === e.target.value);
                  setFormData({
                    ...formData,
                    extracurricularId: e.target.value,
                    extracurricularName: eks?.name || 'Kesiswaan Umum'
                  });
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="">Kesiswaan Umum / OSIS</option>
                {extracurriculars.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Penyelenggara *
              </label>
              <input
                type="text"
                value={formData.organizer}
                onChange={e => setFormData({ ...formData, organizer: e.target.value })}
                placeholder="Contoh: Tim Futsal & Waka Kesiswaan"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Mulai *
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
                Tanggal Selesai (Opsional)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lokasi Pelaksanaan *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="GOR Utama..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Anggaran (Rp)
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={e => setFormData({ ...formData, budget: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Peserta
              </label>
              <input
                type="number"
                value={formData.participantCount}
                onChange={e => setFormData({ ...formData, participantCount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status Kegiatan
            </label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="Rencana">Rencana</option>
              <option value="Berjalan">Sedang Berjalan</option>
              <option value="Selesai">Selesai</option>
              <option value="Dibatalkan">Dibatalkan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Deskripsi & Rincian
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Rincian tujuan dan susunan acara..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {selectedActivity && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Detail Kegiatan: ${selectedActivity.title}`}
          subtitle={`Penyelenggara: ${selectedActivity.organizer}`}
          maxWidth="lg"
          footer={
            <button
              onClick={() => setIsDetailOpen(false)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-white"
            >
              Tutup
            </button>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
              <p><strong>Ekstrakurikuler:</strong> {selectedActivity.extracurricularName}</p>
              <p><strong>Waktu:</strong> {selectedActivity.date} {selectedActivity.endDate && `s/d ${selectedActivity.endDate}`}</p>
              <p><strong>Lokasi:</strong> {selectedActivity.location}</p>
              <p><strong>Jumlah Peserta:</strong> {selectedActivity.participantCount} Siswa</p>
              <p><strong>Anggaran:</strong> Rp {(selectedActivity.budget || 0).toLocaleString('id-ID')}</p>
              <p><strong>Status:</strong> <StatusBadge status={selectedActivity.status} /></p>
              <p className="mt-2"><strong>Deskripsi:</strong> {selectedActivity.description || '-'}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Agenda Kegiatan"
        message={`Apakah Anda yakin ingin menghapus agenda kegiatan "${selectedActivity?.title}"?`}
        confirmText="Hapus Kegiatan"
      />
    </div>
  );
};
