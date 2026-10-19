import React, { useState } from 'react';
import {
  Edit2,
  Trash2,
  Printer,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  SendHorizontal,
  FileCheck
} from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { OsimMeeting, OsimMeetingStatus } from '../../../types';

interface OsimMeetingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMeeting: OsimMeeting | null;
  canManageOsim: boolean;
  isPembinaOsim?: boolean;
  isSekretarisOsim?: boolean;
  currentUserName?: string;
  onEditMeeting: (meeting: OsimMeeting) => void;
  onDeleteMeeting: (meeting: OsimMeeting) => void;
  onPrintMeeting?: (meeting: OsimMeeting) => void;
  onVerifyMeeting?: (meeting: OsimMeeting, newStatus: OsimMeetingStatus, notes?: string) => Promise<void>;
}

export const OsimMeetingDetailModal: React.FC<OsimMeetingDetailModalProps> = ({
  isOpen,
  onClose,
  selectedMeeting,
  canManageOsim,
  isPembinaOsim = false,
  isSekretarisOsim = false,
  currentUserName = 'Pembina OSIM',
  onEditMeeting,
  onDeleteMeeting,
  onPrintMeeting,
  onVerifyMeeting
}) => {
  if (!selectedMeeting) return null;

  const [notesInput, setNotesInput] = useState(selectedMeeting.wakaNotes || '');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const attendees = selectedMeeting.attendees || [];
  const hadirCount = attendees.filter(a => a.presentStatus === 'Hadir').length;
  const izinCount = attendees.filter(a => a.presentStatus === 'Izin').length;
  const sakitCount = attendees.filter(a => a.presentStatus === 'Sakit').length;
  const alpaCount = attendees.filter(a => a.presentStatus === 'Alpa').length;

  const isVerified = selectedMeeting.status === 'Disahkan Pembina';
  const isDiajukan = selectedMeeting.status === 'Diajukan';
  const isDraft = !selectedMeeting.status || selectedMeeting.status === 'Draft';

  const handleActionVerify = async (status: OsimMeetingStatus) => {
    if (!onVerifyMeeting) return;
    setIsUpdatingStatus(true);
    try {
      await onVerifyMeeting(selectedMeeting, status, notesInput);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Notulensi Sidang & Rapat OSIM"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4 text-xs max-h-[80vh] overflow-y-auto pr-1">
        {/* Header Box */}
        <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-xl">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {selectedMeeting.type}
            </span>
            <span className="text-zinc-400 font-mono text-[11px]">
              📅 {selectedMeeting.date} ({selectedMeeting.startTime} - {selectedMeeting.endTime} WIB)
            </span>
            {selectedMeeting.meetingNumber && (
              <span className="text-zinc-500 font-mono text-[10px]">
                No: {selectedMeeting.meetingNumber}
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                isVerified
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : isDiajukan
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                  : selectedMeeting.status === 'Revisi'
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}
            >
              {isVerified ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  DISAHKAN PEMBINA
                </>
              ) : isDiajukan ? (
                <>
                  <Clock className="w-3 h-3" />
                  MENUNGGU PENGESAHAN PEMBINA
                </>
              ) : selectedMeeting.status === 'Revisi' ? (
                <>
                  <AlertCircle className="w-3 h-3" />
                  PERLU REVISI
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3" />
                  DRAFT NOTULEN
                </>
              )}
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
              <strong className="text-emerald-400">{selectedMeeting.attendeesCount} Orang Hadir</strong>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">Pimpinan Rapat:</span>
              <strong className="text-zinc-200">{selectedMeeting.leader}</strong>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">Notulis (Sekretaris):</span>
              <strong className="text-sky-300">{selectedMeeting.secretary}</strong>
            </div>
          </div>
        </div>

        {/* Section Presensi & Daftar Hadir */}
        {attendees.length > 0 && (
          <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                Daftar Presensi Peserta Rapat ({attendees.length} Pengurus):
              </span>
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Hadir: {hadirCount}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Izin: {izinCount}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  Sakit: {sakitCount}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  Alpa: {alpaCount}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {attendees.map((att, i) => {
                const isHadir = att.presentStatus === 'Hadir';
                const isIzin = att.presentStatus === 'Izin';
                const isSakit = att.presentStatus === 'Sakit';

                return (
                  <div
                    key={att.memberId || i}
                    className="p-2 rounded-lg bg-zinc-950/70 border border-zinc-800 flex items-center justify-between gap-1.5"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-200 truncate">{att.name}</p>
                      <p className="text-[10px] text-zinc-400 truncate font-mono">{att.roleOrPosition}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        isHadir
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : isIzin
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : isSakit
                          ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {att.presentStatus}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section Agenda */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5">
          <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-1.5">
            AGENDA PEMBAHASAN:
          </span>
          <p className="text-zinc-200 leading-relaxed whitespace-pre-line">{selectedMeeting.agenda}</p>
        </div>

        {/* Section Decisions */}
        <div className="bg-zinc-900/60 border border-emerald-500/20 rounded-xl p-3.5">
          <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 block mb-1.5">
            HASIL KEPUTUSAN & MUFAKAT SIDANG:
          </span>
          <p className="text-zinc-200 leading-relaxed whitespace-pre-line">{selectedMeeting.decisionNotes}</p>
        </div>

        {/* Section Supervisor Notes / Validation Box */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10px] font-mono font-bold uppercase text-amber-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              STATUS PENGESAHAN & ARAHAN PEMBINA:
            </span>
            {isVerified && selectedMeeting.approvedBy && (
              <span className="text-[10px] font-mono text-emerald-400">
                Disahkan oleh: {selectedMeeting.approvedBy} ({selectedMeeting.approvedAt?.split('T')[0] || '-'})
              </span>
            )}
          </div>

          {isPembinaOsim && !isVerified ? (
            <div className="space-y-2 pt-1">
              <textarea
                rows={2}
                placeholder="Tuliskan arahan resmi atau catatan pembina sebelum mengesahkan notulensi rapat..."
                value={notesInput}
                onChange={e => setNotesInput(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-amber-500 leading-relaxed"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleActionVerify('Revisi')}
                  className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition disabled:opacity-50"
                >
                  Minta Revisi
                </button>
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleActionVerify('Disahkan Pembina')}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Sahkan & Tandatangani Notulensi
                </button>
              </div>
            </div>
          ) : (
            <p className="text-zinc-200 italic leading-relaxed">
              {selectedMeeting.wakaNotes || 'Belum ada catatan khusus dari Pembina / Waka Kesiswaan.'}
            </p>
          )}

          {/* Action for Sekretaris to submit draft */}
          {isSekretarisOsim && isDraft && !isPembinaOsim && onVerifyMeeting && (
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400">
                Notulensi masih berstatus Draft. Ajukan ke Pembina OSIM untuk diverifikasi.
              </span>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleActionVerify('Diajukan')}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <SendHorizontal className="w-3.5 h-3.5" />
                Ajukan ke Pembina OSIM
              </button>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
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
                className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
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
                className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
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
