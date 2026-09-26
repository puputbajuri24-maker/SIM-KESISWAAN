import React from 'react';
import { Edit2, Trash2, Printer } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { OsimMeeting } from '../../../types';

interface OsimMeetingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMeeting: OsimMeeting | null;
  canManageOsim: boolean;
  onEditMeeting: (meeting: OsimMeeting) => void;
  onDeleteMeeting: (meeting: OsimMeeting) => void;
  onPrintMeeting?: (meeting: OsimMeeting) => void;
}

export const OsimMeetingDetailModal: React.FC<OsimMeetingDetailModalProps> = ({
  isOpen,
  onClose,
  selectedMeeting,
  canManageOsim,
  onEditMeeting,
  onDeleteMeeting,
  onPrintMeeting
}) => {
  if (!selectedMeeting) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Notulensi Sidang & Rapat OSIM"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 text-xs">
        <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-lg">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {selectedMeeting.type}
            </span>
            <span className="text-zinc-400 font-mono text-[11px]">
              📅 {selectedMeeting.date} ({selectedMeeting.startTime} - {selectedMeeting.endTime} WIB)
            </span>
          </div>
          <h3 className="font-bold text-base text-zinc-100">{selectedMeeting.title}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-zinc-800 text-[11px] font-mono text-zinc-400">
            <div>
              <span className="text-zinc-500 block text-[10px]">Lokasi:</span>
              <strong className="text-zinc-200">{selectedMeeting.location}</strong>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">Kehadiran:</span>
              <strong className="text-zinc-200">{selectedMeeting.attendeesCount} Orang</strong>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">Pimpinan Rapat:</span>
              <strong className="text-zinc-200">{selectedMeeting.leader}</strong>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">Notulis:</span>
              <strong className="text-zinc-200">{selectedMeeting.secretary}</strong>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3.5">
          <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-1.5">
            AGENDA PEMBAHASAN:
          </span>
          <p className="text-zinc-200 leading-relaxed whitespace-pre-line">{selectedMeeting.agenda}</p>
        </div>

        <div className="bg-zinc-900/60 border border-emerald-500/20 rounded-lg p-3.5">
          <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 block mb-1.5">
            HASIL KEPUTUSAN & MUFAKAT SIDANG:
          </span>
          <p className="text-zinc-200 leading-relaxed whitespace-pre-line">{selectedMeeting.decisionNotes}</p>
        </div>

        {selectedMeeting.wakaNotes && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3.5">
            <span className="text-[10px] font-mono font-bold uppercase text-amber-400 block mb-1">
              Catatan Waka Kesiswaan / Pembina:
            </span>
            <p className="text-zinc-200 italic">{selectedMeeting.wakaNotes}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
            >
              Tutup
            </button>
            {onPrintMeeting && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPrintMeeting(selectedMeeting);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Berita Acara
              </button>
            )}
          </div>
          {canManageOsim && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditMeeting(selectedMeeting);
                }}
                className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Notulensi
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteMeeting(selectedMeeting);
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
