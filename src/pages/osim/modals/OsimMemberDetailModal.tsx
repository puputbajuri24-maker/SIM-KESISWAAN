import React from 'react';
import { Key, Edit2, Trash2 } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { OsimMember } from '../../../types';

interface OsimMemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMember: OsimMember | null;
  activeAcademicYear: string;
  canManageCabinetStructure: boolean;
  canManageOsimAccounts: boolean;
  onManageAccount: (member: OsimMember) => void;
  onEditMember: (member: OsimMember) => void;
  onDeleteMember: (member: OsimMember) => void;
}

export const OsimMemberDetailModal: React.FC<OsimMemberDetailModalProps> = ({
  isOpen,
  onClose,
  selectedMember,
  activeAcademicYear,
  canManageCabinetStructure,
  canManageOsimAccounts,
  onManageAccount,
  onEditMember,
  onDeleteMember
}) => {
  if (!selectedMember) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Profil Pengurus OSIM"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 text-xs">
        <div className="flex items-start gap-3 bg-zinc-900/90 border border-zinc-800 p-3 rounded-lg">
          {selectedMember.photoUrl ? (
            <img
              src={selectedMember.photoUrl}
              alt={selectedMember.fullName}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover border border-amber-500/40 shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30 shrink-0 text-xl">
              {selectedMember.fullName.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {selectedMember.position}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                {selectedMember.status}
              </span>
            </div>
            <h3 className="font-bold text-sm text-zinc-100 mt-1">{selectedMember.fullName}</h3>
            <p className="text-zinc-400 font-mono text-[11px] mt-0.5">
              NIS: {selectedMember.studentNis} • Kelas: {selectedMember.className}
            </p>
            <p className="text-zinc-500 text-[10px] font-mono mt-0.5">
              Masa Bakti: {selectedMember.period || activeAcademicYear}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
          <div>
            <span className="text-[10px] text-zinc-500 block font-mono">Seksi Bidang:</span>
            <span className="text-zinc-200 font-semibold">{selectedMember.sekbid}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block font-mono">No. Telepon / WA:</span>
            <span className="text-zinc-200 font-mono">{selectedMember.phone || '-'}</span>
          </div>
          {selectedMember.email && (
            <div className="col-span-2">
              <span className="text-[10px] text-zinc-500 block font-mono">Email:</span>
              <span className="text-zinc-300 font-mono">{selectedMember.email}</span>
            </div>
          )}
        </div>

        {selectedMember.vision && (
          <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
            <span className="text-[10px] text-amber-400 font-mono font-bold uppercase block mb-1">
              Visi & Komitmen:
            </span>
            <p className="text-zinc-300 leading-relaxed italic">"{selectedMember.vision}"</p>
          </div>
        )}

        {selectedMember.flagshipProgram && (
          <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
            <span className="text-[10px] text-sky-400 font-mono font-bold uppercase block mb-1">
              Program Unggulan yang Diusung:
            </span>
            <p className="text-zinc-200 font-medium">{selectedMember.flagshipProgram}</p>
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
          {canManageCabinetStructure && (
            <div className="flex items-center gap-2">
              {canManageOsimAccounts && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onManageAccount(selectedMember);
                  }}
                  className="px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                  title="Kelola Akun & Password Login Siswa"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Akun & Password
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditMember(selectedMember);
                }}
                className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Profil
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteMember(selectedMember);
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
