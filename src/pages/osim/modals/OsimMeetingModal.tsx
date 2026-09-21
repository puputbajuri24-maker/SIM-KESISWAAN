import React from 'react';
import { Modal } from '../../../components/common/Modal';
import { OsimMeeting } from '../../../types';

interface OsimMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingForm: Partial<OsimMeeting>;
  setMeetingForm: React.Dispatch<React.SetStateAction<Partial<OsimMeeting>>>;
  onSaveMeeting: (e: React.FormEvent) => Promise<void>;
  isEditing?: boolean;
}

export const OsimMeetingModal: React.FC<OsimMeetingModalProps> = ({
  isOpen,
  onClose,
  meetingForm,
  setMeetingForm,
  onSaveMeeting,
  isEditing = false
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Notulensi Sidang & Rapat OSIM' : 'Catat Notulensi Sidang Pleno / Rapat OSIM'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={onSaveMeeting} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">Judul / Acara Rapat *</label>
          <input
            type="text"
            required
            placeholder="Contoh: Rapat Evaluasi Bulanan Program Kerja OSIM"
            value={meetingForm.title || ''}
            onChange={e => setMeetingForm({ ...meetingForm, title: e.target.value })}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Jenis Pertemuan</label>
            <select
              value={meetingForm.type || 'Rapat Pleno Pengurus'}
              onChange={e => setMeetingForm({ ...meetingForm, type: e.target.value as any })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              <option value="Rapat Pleno Pengurus">Rapat Pleno Pengurus</option>
              <option value="Rapat BPH">Rapat BPH</option>
              <option value="Rapat Koordinasi Pembina">Rapat Koordinasi Pembina</option>
              <option value="Sidang Musyawarah Kerja (MUKER)">Sidang Musyawarah Kerja (MUKER)</option>
              <option value="Rapat Evaluasi Bulanan">Rapat Evaluasi Bulanan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Tanggal</label>
            <input
              type="date"
              value={meetingForm.date || ''}
              onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Waktu Mulai - Selesai</label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="15:30"
                value={meetingForm.startTime || ''}
                onChange={e => setMeetingForm({ ...meetingForm, startTime: e.target.value })}
                className="w-1/2 px-2.5 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
              />
              <span className="text-zinc-500">-</span>
              <input
                type="text"
                placeholder="17:00"
                value={meetingForm.endTime || ''}
                onChange={e => setMeetingForm({ ...meetingForm, endTime: e.target.value })}
                className="w-1/2 px-2.5 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Lokasi Sidang / Rapat</label>
            <input
              type="text"
              placeholder="Contoh: Ruang OSIM"
              value={meetingForm.location || ''}
              onChange={e => setMeetingForm({ ...meetingForm, location: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Pimpinan Rapat</label>
            <input
              type="text"
              placeholder="Ketua Umum OSIM"
              value={meetingForm.leader || ''}
              onChange={e => setMeetingForm({ ...meetingForm, leader: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Notulis</label>
            <input
              type="text"
              placeholder="Sekretaris Umum"
              value={meetingForm.secretary || ''}
              onChange={e => setMeetingForm({ ...meetingForm, secretary: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Jumlah Hadir</label>
            <input
              type="number"
              min={1}
              value={meetingForm.attendeesCount ?? 20}
              onChange={e => setMeetingForm({ ...meetingForm, attendeesCount: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">Agenda Pembahasan *</label>
          <textarea
            required
            rows={2}
            placeholder="Rincian poin agenda yang dibahas..."
            value={meetingForm.agenda || ''}
            onChange={e => setMeetingForm({ ...meetingForm, agenda: e.target.value })}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">Hasil Keputusan & Mufakat *</label>
          <textarea
            required
            rows={3}
            placeholder="Keputusan rapat, pembagian tugas, deadline..."
            value={meetingForm.decisionNotes || ''}
            onChange={e => setMeetingForm({ ...meetingForm, decisionNotes: e.target.value })}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">Catatan Waka Kesiswaan / Pembina (Opsional)</label>
          <textarea
            rows={2}
            placeholder="Arahan khusus waka kesiswaan atau pembina..."
            value={meetingForm.wakaNotes || ''}
            onChange={e => setMeetingForm({ ...meetingForm, wakaNotes: e.target.value })}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
          >
            Simpan Notulensi
          </button>
        </div>
      </form>
    </Modal>
  );
};
