import React from 'react';
import { Modal } from '../../../components/common/Modal';
import { OsimAspiration } from '../../../types';

interface OsimAspirationModalProps {
  isOpen: boolean;
  onClose: () => void;
  aspirationForm: Partial<OsimAspiration>;
  setAspirationForm: React.Dispatch<React.SetStateAction<Partial<OsimAspiration>>>;
  onSaveAspiration: (e: React.FormEvent) => Promise<void>;
}

export const OsimAspirationModal: React.FC<OsimAspirationModalProps> = ({
  isOpen,
  onClose,
  aspirationForm,
  setAspirationForm,
  onSaveAspiration
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sampaikan Aspirasi / Ide untuk OSIM & Madrasah"
      maxWidth="max-w-md"
    >
      <form onSubmit={onSaveAspiration} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">Nama Siswa / Pengirim</label>
          <input
            type="text"
            value={aspirationForm.studentName || ''}
            onChange={e => setAspirationForm({ ...aspirationForm, studentName: e.target.value })}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">Kategori Usulan *</label>
          <select
            value={aspirationForm.category || 'Kegiatan & Acara'}
            onChange={e => setAspirationForm({ ...aspirationForm, category: e.target.value as any })}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
          >
            <option value="Fasilitas & Sarpras">Fasilitas & Sarpras</option>
            <option value="Kegiatan & Acara">Kegiatan & Acara</option>
            <option value="Akademik & Pembelajaran">Akademik & Pembelajaran</option>
            <option value="Kedisiplinan & Tata Tertib">Kedisiplinan & Tata Tertib</option>
            <option value="Ekstrakurikuler">Ekstrakurikuler</option>
            <option value="Kesejahteraan Santri/Siswa">Kesejahteraan Santri/Siswa</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">Judul Aspirasi *</label>
          <input
            type="text"
            required
            placeholder="Contoh: Penambahan Stop Kontak di Gazebo Belajar"
            value={aspirationForm.title || ''}
            onChange={e => setAspirationForm({ ...aspirationForm, title: e.target.value })}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">Isi Aspirasi / Usulan Detail *</label>
          <textarea
            required
            rows={4}
            placeholder="Jelaskan alasan dan manfaat usulan ini bagi santri madrasah..."
            value={aspirationForm.content || ''}
            onChange={e => setAspirationForm({ ...aspirationForm, content: e.target.value })}
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
            Kirim Aspirasi
          </button>
        </div>
      </form>
    </Modal>
  );
};

interface OsimAspirationResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAspiration: OsimAspiration | null;
  responseStatus: 'Ditampung' | 'Sedang Dibahas' | 'Direalisasikan' | 'Ditolak';
  setResponseStatus: (val: 'Ditampung' | 'Sedang Dibahas' | 'Direalisasikan' | 'Ditolak') => void;
  responseNoteText: string;
  setResponseNoteText: (val: string) => void;
  onSaveResponse: () => Promise<void>;
}

export const OsimAspirationResponseModal: React.FC<OsimAspirationResponseModalProps> = ({
  isOpen,
  onClose,
  selectedAspiration,
  responseStatus,
  setResponseStatus,
  responseNoteText,
  setResponseNoteText,
  onSaveResponse
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tanggapan Resmi Pengurus OSIM & Kesiswaan"
      maxWidth="max-w-md"
    >
      {selectedAspiration && (
        <div className="space-y-3 text-xs">
          <div className="bg-zinc-900 p-3 rounded border border-zinc-800">
            <h4 className="font-bold text-zinc-100">{selectedAspiration.title}</h4>
            <p className="text-zinc-400 mt-1 text-[11px]">{selectedAspiration.content}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Status Tindak Lanjut</label>
            <select
              value={responseStatus}
              onChange={e => setResponseStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              <option value="Ditampung">Ditampung</option>
              <option value="Sedang Dibahas">Sedang Dibahas</option>
              <option value="Direalisasikan">Direalisasikan</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Isi Tanggapan / Keterangan Resmi</label>
            <textarea
              rows={4}
              placeholder="Tuliskan tindakan yang telah atau akan diambil oleh OSIM/Kesiswaan..."
              value={responseNoteText}
              onChange={e => setResponseNoteText(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onSaveResponse}
              className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
            >
              Simpan Tanggapan
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
