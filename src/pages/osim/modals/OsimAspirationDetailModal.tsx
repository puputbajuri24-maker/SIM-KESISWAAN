import React from 'react';
import { ThumbsUp, Trash2 } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { OsimAspiration } from '../../../types';

interface OsimAspirationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAspiration: OsimAspiration | null;
  canManageOsim: boolean;
  onResponseAspiration: (aspiration: OsimAspiration) => void;
  onDeleteAspiration: (aspiration: OsimAspiration) => void;
}

export const OsimAspirationDetailModal: React.FC<OsimAspirationDetailModalProps> = ({
  isOpen,
  onClose,
  selectedAspiration,
  canManageOsim,
  onResponseAspiration,
  onDeleteAspiration
}) => {
  if (!selectedAspiration) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Aspirasi & Suara Santri"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 text-xs">
        <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-lg">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
              {selectedAspiration.category}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                selectedAspiration.status === 'Direalisasikan'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : selectedAspiration.status === 'Sedang Dibahas'
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {selectedAspiration.status}
            </span>
          </div>
          <h3 className="font-bold text-base text-zinc-100">{selectedAspiration.title}</h3>
          <p className="text-zinc-400 font-mono text-[11px] mt-1">
            Pengirim: <strong className="text-zinc-200">{selectedAspiration.studentName}</strong> ({selectedAspiration.studentClass}) • Tanggal: {selectedAspiration.date}
          </p>
          <div className="mt-2 text-amber-400 font-mono text-[11px] flex items-center gap-1">
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{selectedAspiration.upvotes || 1} Santri Mendukung Aspirasi Ini</span>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3.5">
          <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-1.5">
            ISI LENGKAP ASPIRASI:
          </span>
          <p className="text-zinc-200 leading-relaxed whitespace-pre-line">{selectedAspiration.content}</p>
        </div>

        {selectedAspiration.responseNote && (
          <div className="bg-zinc-900/90 border border-emerald-500/30 rounded-lg p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-400">
                TANGGAPAN RESMI PENGURUS:
              </span>
              <span className="text-[10px] font-mono text-zinc-400">{selectedAspiration.respondedAt}</span>
            </div>
            <p className="text-zinc-200 leading-relaxed">{selectedAspiration.responseNote}</p>
            <span className="text-[10px] font-mono text-zinc-500 block mt-2">
              Ditanggapi oleh: {selectedAspiration.respondedBy || 'Pengurus OSIM'}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
          >
            Tutup
          </button>
          {canManageOsim && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onResponseAspiration(selectedAspiration);
                }}
                className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
              >
                Beri Respon
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteAspiration(selectedAspiration);
                }}
                className="px-3 py-1.5 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
