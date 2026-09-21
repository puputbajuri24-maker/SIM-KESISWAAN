import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Upload,
  Trash2,
  Send,
  Lock,
  RotateCcw,
  XCircle,
  ShieldAlert,
  Printer,
  ImageIcon
} from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { OsimWorkProgram, UserProfile, SchoolSetting } from '../../../types';

interface OsimGuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProker: OsimWorkProgram | null;
  guidanceForm: {
    guidanceNotes: string;
    statusDecision: 'Disetujui' | 'Revisi';
  };
  setGuidanceForm: React.Dispatch<React.SetStateAction<{
    guidanceNotes: string;
    statusDecision: 'Disetujui' | 'Revisi';
  }>>;
  onSaveGuidance: (e: React.FormEvent) => Promise<void>;
}

export const OsimGuidanceModal: React.FC<OsimGuidanceModalProps> = ({
  isOpen,
  onClose,
  selectedProker,
  guidanceForm,
  setGuidanceForm,
  onSaveGuidance
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verifikasi & Bimbingan Usulan Program Kerja"
      maxWidth="max-w-lg"
    >
      {selectedProker && (
        <form onSubmit={onSaveGuidance} className="space-y-4 text-xs">
          <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
              {selectedProker.sekbid}
            </span>
            <h4 className="font-bold text-sm text-zinc-100 mt-1">{selectedProker.title}</h4>
            <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400 mt-1">
              <span>PJ: <strong className="text-zinc-200">{selectedProker.personInCharge}</strong></span>
              <span>• RAB: <strong className="text-amber-400">Rp {selectedProker.budgetEstimated.toLocaleString('id-ID')}</strong></span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Keputusan Verifikasi Pembina *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGuidanceForm({ ...guidanceForm, statusDecision: 'Disetujui' })}
                className={`p-2.5 rounded border text-center transition flex flex-col items-center gap-1 ${
                  guidanceForm.statusDecision === 'Disetujui'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-xs">Setujui Usulan</span>
                <span className="text-[10px] text-zinc-400">Lanjut ke tahap pelaksanaan</span>
              </button>

              <button
                type="button"
                onClick={() => setGuidanceForm({ ...guidanceForm, statusDecision: 'Revisi' })}
                className={`p-2.5 rounded border text-center transition flex flex-col items-center gap-1 ${
                  guidanceForm.statusDecision === 'Revisi'
                    ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span className="font-bold text-xs">Minta Revisi</span>
                <span className="text-[10px] text-zinc-400">Perlu perbaikan oleh siswa</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Catatan Bimbingan & Arahan Pembina *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Tuliskan catatan arahan bimbingan teknis, koreksi rincian anggaran, penyesuaian jadwal, atau pesan pembinaan bagi siswa bidang..."
              value={guidanceForm.guidanceNotes}
              onChange={e => setGuidanceForm({ ...guidanceForm, guidanceNotes: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
            <p className="text-[10px] text-zinc-500 mt-1">
              Catatan ini akan langsung tampil di laman proker siswa bidang dan memicu notifikasi sistem.
            </p>
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
              className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
            >
              Simpan & Terbitkan Bimbingan
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

interface OsimLpjModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProker: OsimWorkProgram | null;
  lpjForm: {
    budgetRealized: number;
    participantCount: number;
    lpjNotes: string;
    lpjFileUrl: string;
    photos: string[];
  };
  setLpjForm: React.Dispatch<React.SetStateAction<{
    budgetRealized: number;
    participantCount: number;
    lpjNotes: string;
    lpjFileUrl: string;
    photos: string[];
  }>>;
  onSubmitDraftLpj: (e: React.FormEvent) => Promise<void>;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (idx: number) => void;
}

export const OsimLpjModal: React.FC<OsimLpjModalProps> = ({
  isOpen,
  onClose,
  selectedProker,
  lpjForm,
  setLpjForm,
  onSubmitDraftLpj,
  onPhotoUpload,
  onRemovePhoto
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pelaporan LPJ & Evaluasi Mandiri Kegiatan (Siswa Bidang)"
      maxWidth="max-w-xl"
    >
      {selectedProker && (
        <form onSubmit={onSubmitDraftLpj} className="space-y-4 text-xs">
          <div className="bg-zinc-900 p-3 rounded border border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-cyan-400 border border-zinc-700">
                {selectedProker.sekbid}
              </span>
              <span className="text-[11px] font-mono text-amber-400 font-semibold">
                RAB: Rp {selectedProker.budgetEstimated.toLocaleString('id-ID')}
              </span>
            </div>
            <h4 className="font-bold text-sm text-zinc-100 mt-1">{selectedProker.title}</h4>
            <p className="text-xs text-zinc-400 mt-0.5">PJ: {selectedProker.personInCharge}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Realisasi Biaya Kas (Rp) *
              </label>
              <input
                type="number"
                required
                min={0}
                placeholder="0"
                value={lpjForm.budgetRealized}
                onChange={e => setLpjForm({ ...lpjForm, budgetRealized: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-zinc-500 mt-0.5 block">
                Selisih: Rp {((selectedProker.budgetEstimated || 0) - (lpjForm.budgetRealized || 0)).toLocaleString('id-ID')}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Jumlah Peserta Hadir (Orang) *
              </label>
              <input
                type="number"
                required
                min={1}
                placeholder="150"
                value={lpjForm.participantCount}
                onChange={e => setLpjForm({ ...lpjForm, participantCount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Tautan Berkas LPJ / Google Drive (Link PDF)
            </label>
            <input
              type="url"
              placeholder="https://drive.google.com/file/d/.../view"
              value={lpjForm.lpjFileUrl}
              onChange={e => setLpjForm({ ...lpjForm, lpjFileUrl: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Ringkasan Evaluasi Pelaksanaan & Pembelajaran Mandiri *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Jelaskan capaian kegiatan, dinamika lapangan, kendala teknis, dan rekomendasi penyempurnaan..."
              value={lpjForm.lpjNotes}
              onChange={e => setLpjForm({ ...lpjForm, lpjNotes: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-cyan-500 leading-relaxed"
            />
          </div>

          {/* Unggah Foto Kegiatan */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                Foto Dokumentasi Kegiatan
              </label>
              <span className="text-[10px] text-zinc-400 font-mono">
                {lpjForm.photos?.length || 0} Foto Terlampir
              </span>
            </div>

            <div className="border-2 border-dashed border-zinc-800 rounded-lg p-3 text-center hover:border-cyan-500/50 transition">
              <input
                type="file"
                id="photo-upload-input"
                accept="image/*"
                multiple
                onChange={onPhotoUpload}
                className="hidden"
              />
              <label
                htmlFor="photo-upload-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-cyan-400 transition"
              >
                <Upload className="w-5 h-5 text-cyan-500" />
                <span className="text-xs font-semibold">Pilih atau Seret Foto Dokumentasi</span>
                <span className="text-[10px] text-zinc-500">Mendukung file JPG, PNG, WebP (Maks 2MB per foto)</span>
              </label>
            </div>

            {/* Previews */}
            {lpjForm.photos && lpjForm.photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {lpjForm.photos.map((p, idx) => (
                  <div key={idx} className="aspect-video bg-zinc-900 rounded overflow-hidden relative group border border-zinc-800">
                    <img src={p} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => onRemovePhoto(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full text-[10px] transition"
                      title="Hapus foto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-2.5 bg-purple-950/20 border border-purple-500/30 rounded text-[11px] text-purple-300">
            💡 <strong>Alur Lanjutan:</strong> Setelah draft LPJ dikirim, status kegiatan akan berubah menjadi <strong>"Menunggu Verifikasi LPJ"</strong> dan notifikasi otomatis diteruskan ke Pembina OSIM & Waka Kesiswaan untuk pengesahan akhir.
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
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
            >
              <Send className="w-3.5 h-3.5" />
              Kirim Draft LPJ ke Pembina
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

interface OsimValidateLpjModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProker: OsimWorkProgram | null;
  validationRemarks: string;
  setValidationRemarks: (val: string) => void;
  onRejectLpj: () => Promise<void>;
  onConfirmLockAndArchive: () => Promise<void>;
}

export const OsimValidateLpjModal: React.FC<OsimValidateLpjModalProps> = ({
  isOpen,
  onClose,
  selectedProker,
  validationRemarks,
  setValidationRemarks,
  onRejectLpj,
  onConfirmLockAndArchive
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Validasi Akhir & Penguncian LPJ (Selesai & Sah)"
      maxWidth="max-w-lg"
    >
      {selectedProker && (
        <div className="space-y-4 text-xs">
          <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-purple-400 border border-zinc-700">
                {selectedProker.sekbid}
              </span>
              <span className="text-xs font-bold text-zinc-300 font-mono">
                Diajukan: {selectedProker.personInCharge}
              </span>
            </div>
            <h4 className="font-bold text-sm text-zinc-100">{selectedProker.title}</h4>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-zinc-800">
              <div>
                <span className="text-zinc-500 block font-sans text-[10px]">Rencana Anggaran (RAB):</span>
                <span className="text-amber-400 font-semibold">Rp {selectedProker.budgetEstimated.toLocaleString('id-ID')}</span>
              </div>
              <div>
                <span className="text-zinc-500 block font-sans text-[10px]">Realisasi Pengeluaran Kas:</span>
                <span className="text-emerald-400 font-semibold">Rp {(selectedProker.budgetRealized || 0).toLocaleString('id-ID')}</span>
              </div>
              <div>
                <span className="text-zinc-500 block font-sans text-[10px]">Efisiensi Dana:</span>
                <span className="text-zinc-200 font-semibold">
                  Rp {((selectedProker.budgetEstimated || 0) - (selectedProker.budgetRealized || 0)).toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block font-sans text-[10px]">Peserta Hadir:</span>
                <span className="text-indigo-400 font-semibold">{selectedProker.participantCount || 0} Santri</span>
              </div>
            </div>
          </div>

          {/* Ringkasan Evaluasi Siswa */}
          {selectedProker.lpjNotes && (
            <div>
              <span className="text-zinc-400 font-medium block mb-1">Evaluasi yang Disampaikan Pengurus:</span>
              <div className="p-2.5 bg-black/40 rounded border border-zinc-800 text-zinc-300 text-xs leading-relaxed">
                {selectedProker.lpjNotes}
              </div>
            </div>
          )}

          {/* Foto preview */}
          {selectedProker.photos && selectedProker.photos.length > 0 && (
            <div>
              <span className="text-zinc-400 font-medium block mb-1">Bukti Dokumentasi Visual ({selectedProker.photos.length} Foto):</span>
              <div className="grid grid-cols-4 gap-1.5">
                {selectedProker.photos.slice(0, 4).map((p, idx) => (
                  <div key={idx} className="aspect-video rounded overflow-hidden border border-zinc-800">
                    <img src={p} alt="bukti" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Catatan Pengesahan Pembina & Waka Kesiswaan (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Tuliskan catatan apresiasi atau evaluasi pembinaan sebelum dikunci..."
              value={validationRemarks}
              onChange={e => setValidationRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="p-3 bg-emerald-950/25 border border-emerald-500/40 rounded-lg text-emerald-300 text-[11px] leading-relaxed">
            🔒 <strong>Peringatan Penguncian Sah:</strong> Dengan mengklik tombol di bawah, status program kerja akan dikunci menjadi <strong>"Selesai & Sah"</strong> dan secara permanen tercatat ke dalam Rekapitulasi Tahunan Kesiswaan untuk Laporan Resmi Kepala Madrasah.
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onRejectLpj}
              className="px-3 py-1.5 rounded bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-500/30 text-xs font-medium transition"
            >
              Kembalikan (Perlu Revisi)
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={onConfirmLockAndArchive}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-sm"
              >
                <Lock className="w-3.5 h-3.5" />
                Kunci Status: Selesai & Sah
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

interface OsimVetoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProker: OsimWorkProgram | null;
  vetoTargetStatus: 'Dibatalkan' | 'Revisi' | 'Draft';
  setVetoTargetStatus: (val: 'Dibatalkan' | 'Revisi' | 'Draft') => void;
  vetoReason: string;
  setVetoReason: (val: string) => void;
  onConfirmVeto: () => Promise<void>;
  currentUser: UserProfile | null;
  isSuperAdmin: boolean;
  isWaka: boolean;
}

export const OsimVetoModal: React.FC<OsimVetoModalProps> = ({
  isOpen,
  onClose,
  selectedProker,
  vetoTargetStatus,
  setVetoTargetStatus,
  vetoReason,
  setVetoReason,
  onConfirmVeto,
  currentUser,
  isSuperAdmin,
  isWaka
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pemberlakuan Hak Veto Kesiswaan & Otoritas Supervisi"
      maxWidth="max-w-lg"
    >
      {selectedProker && (
        <div className="space-y-4 text-xs">
          <div className="bg-rose-950/20 p-3 rounded-lg border border-rose-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-500/40">
                {selectedProker.sekbid}
              </span>
              <span className="text-[11px] font-mono text-zinc-300 font-bold">
                Status Saat Ini: <span className="text-amber-400">{selectedProker.status}</span>
              </span>
            </div>
            <h4 className="font-bold text-sm text-zinc-100">{selectedProker.title}</h4>
            <div className="text-[11px] text-zinc-400 font-mono">
              PJ: <strong className="text-zinc-200">{selectedProker.personInCharge}</strong> • RAB: <strong className="text-amber-400">Rp {selectedProker.budgetEstimated.toLocaleString('id-ID')}</strong>
            </div>
          </div>

          <div className="p-2.5 bg-zinc-900 rounded border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <span className="text-zinc-400 block text-[10px]">Otoritas Eksekutor Hak Veto:</span>
                <span className="font-bold text-zinc-200 text-xs">
                  {currentUser?.displayName || 'Pejabat Kesiswaan'} (
                  {isSuperAdmin ? 'Admin App / Super Admin' : isWaka ? 'Waka Kesiswaan' : 'Pembina OSIM'}
                  )
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
              Hak Veto Sah
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Pilih Tindakan / Keputusan Hak Veto *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setVetoTargetStatus('Revisi')}
                className={`p-2.5 rounded border text-center transition flex flex-col items-center gap-1 ${
                  vetoTargetStatus === 'Revisi'
                    ? 'bg-amber-600/25 border-amber-500 text-amber-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs">Veto ke Revisi</span>
                <span className="text-[9px] text-zinc-400 leading-tight">Perbaikan mendesak</span>
              </button>

              <button
                type="button"
                onClick={() => setVetoTargetStatus('Draft')}
                className={`p-2.5 rounded border text-center transition flex flex-col items-center gap-1 ${
                  vetoTargetStatus === 'Draft'
                    ? 'bg-sky-600/25 border-sky-500 text-sky-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <RotateCcw className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-xs">Turunkan ke Draft</span>
                <span className="text-[9px] text-zinc-400 leading-tight">Perombakan total</span>
              </button>

              <button
                type="button"
                onClick={() => setVetoTargetStatus('Dibatalkan')}
                className={`p-2.5 rounded border text-center transition flex flex-col items-center gap-1 ${
                  vetoTargetStatus === 'Dibatalkan'
                    ? 'bg-rose-600/25 border-rose-500 text-rose-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                <span className="font-bold text-xs">Batalkan Proker</span>
                <span className="text-[9px] text-zinc-400 leading-tight">Kegiatan dihentikan</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Alasan Tertulis & Berita Acara Intervensi Veto *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Tuliskan pertimbangan yuridis/kebijakan kesiswaan secara tegas..."
              value={vetoReason}
              onChange={e => setVetoReason(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-rose-500 leading-relaxed"
            />
            <span className="text-[10px] text-zinc-500 mt-1 block">
              Catatan ini akan tersimpan permanen dalam audit trail pengawasan kesiswaan dan dikirimkan sebagai notifikasi resmi kepada Pengurus Inti OSIM.
            </span>
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
              type="button"
              onClick={onConfirmVeto}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition shadow-sm"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Terapkan Hak Veto Kesiswaan
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

interface OsimAnnualReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolSetting: SchoolSetting | null;
  activeAcademicYear: string;
  sahPrograms: OsimWorkProgram[];
  rekapTotalRab: number;
  rekapTotalRealized: number;
}

export const OsimAnnualReportPrintModal: React.FC<OsimAnnualReportPrintModalProps> = ({
  isOpen,
  onClose,
  schoolSetting,
  activeAcademicYear,
  sahPrograms,
  rekapTotalRab,
  rekapTotalRealized
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dokumen Resmi Laporan Rekapitulasi Tahunan Kesiswaan"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <span className="text-xs text-zinc-400">
            Pratinjau Lembar Pengesahan Resmi untuk Kepala Madrasah / Sekolah
          </span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Cetak Dokumen Sekarang (PDF)
          </button>
        </div>

        {/* Printable Report Canvas */}
        <div className="bg-white text-zinc-900 p-8 rounded-lg shadow-inner font-sans print:p-0 print:shadow-none text-xs space-y-5">
          <div className="text-center border-b-2 border-zinc-900 pb-4">
            <h4 className="text-[11px] font-bold tracking-wider uppercase text-zinc-700">
              {schoolSetting?.centralInstitution || 'KEMENTERIAN AGAMA REPUBLIK INDONESIA'}
            </h4>
            <h2 className="text-base font-extrabold uppercase tracking-wide text-zinc-950">
              {schoolSetting?.name || 'MADRASAH ALIYAH NEGERI 2 SERAM BAGIAN TIMUR'}
            </h2>
            <p className="text-[10px] text-zinc-600">
              {schoolSetting?.address || 'Jl. Ksatria No. 04, Bula, Kabupaten Seram Bagian Timur, Maluku'} • Email: info@man2sbt.sch.id
            </p>
          </div>

          <div className="text-center space-y-1">
            <h3 className="text-sm font-bold uppercase underline underline-offset-4">
              REKAPITULASI LAPORAN PERTANGGUNGJAWABAN (LPJ) & REALISASI PROGRAM KERJA OSIM
            </h3>
            <p className="text-[11px] font-medium text-zinc-700">
              Tahun Ajaran {activeAcademicYear} • Periode Kepengurusan OSIM Terverifikasi
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 border border-zinc-300 p-2.5 rounded bg-zinc-50 font-mono text-[11px]">
            <div>
              <span className="text-[9px] uppercase text-zinc-500 font-sans block">Total Program Sah</span>
              <strong className="text-zinc-900">{sahPrograms.length} Kegiatan</strong>
            </div>
            <div>
              <span className="text-[9px] uppercase text-zinc-500 font-sans block">Total Rencana (RAB)</span>
              <strong className="text-zinc-900">Rp {rekapTotalRab.toLocaleString('id-ID')}</strong>
            </div>
            <div>
              <span className="text-[9px] uppercase text-zinc-500 font-sans block">Total Realisasi Kas</span>
              <strong className="text-zinc-900">Rp {rekapTotalRealized.toLocaleString('id-ID')}</strong>
            </div>
            <div>
              <span className="text-[9px] uppercase text-zinc-500 font-sans block">Efisiensi Kas Anggaran</span>
              <strong className={rekapTotalRab >= rekapTotalRealized ? 'text-emerald-700' : 'text-rose-700'}>
                Rp {(rekapTotalRab - rekapTotalRealized).toLocaleString('id-ID')}
              </strong>
            </div>
          </div>

          <table className="w-full text-left border-collapse border border-zinc-300 text-[10px]">
            <thead>
              <tr className="bg-zinc-100 border-b border-zinc-300 text-zinc-800 font-bold">
                <th className="p-2 border-r border-zinc-300 w-8 text-center">No</th>
                <th className="p-2 border-r border-zinc-300">Seksi Bidang</th>
                <th className="p-2 border-r border-zinc-300">Nama Program Kerja</th>
                <th className="p-2 border-r border-zinc-300">PJ / Pelaksana</th>
                <th className="p-2 border-r border-zinc-300 text-right">RAB (Rp)</th>
                <th className="p-2 border-r border-zinc-300 text-right">Realisasi (Rp)</th>
                <th className="p-2 border-r border-zinc-300 text-center">Peserta</th>
                <th className="p-2 text-center">Tgl Sah</th>
              </tr>
            </thead>
            <tbody>
              {sahPrograms.map((p, idx) => (
                <tr key={p.id} className="border-b border-zinc-200">
                  <td className="p-2 border-r border-zinc-300 text-center font-mono">{idx + 1}</td>
                  <td className="p-2 border-r border-zinc-300 font-semibold">{p.sekbid.split(':')[0]}</td>
                  <td className="p-2 border-r border-zinc-300 font-bold">{p.title}</td>
                  <td className="p-2 border-r border-zinc-300">{p.personInCharge}</td>
                  <td className="p-2 border-r border-zinc-300 text-right font-mono">
                    {p.budgetEstimated.toLocaleString('id-ID')}
                  </td>
                  <td className="p-2 border-r border-zinc-300 text-right font-mono text-emerald-700 font-bold">
                    {(p.budgetRealized || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="p-2 border-r border-zinc-300 text-center font-mono">
                    {p.participantCount || 0}
                  </td>
                  <td className="p-2 text-center font-mono">
                    {p.validatedAt ? new Date(p.validatedAt).toLocaleDateString('id-ID') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Lembar Tanda Tangan Pengesahan */}
          <div className="pt-6 grid grid-cols-3 text-center text-[11px] leading-relaxed">
            <div>
              <p>Mengetahui,</p>
              <p className="font-semibold">Ketua Umum OSIM</p>
              <div className="h-16"></div>
              <p className="font-bold underline">MUHAMMAD AL-FATIH</p>
              <p className="text-[10px] text-zinc-500">NIS. 24251001</p>
            </div>
            <div>
              <p>Menyetujui,</p>
              <p className="font-semibold">Pembina OSIM & Waka Kesiswaan</p>
              <div className="h-16"></div>
              <p className="font-bold underline">USTADZ AHMAD RIDWAN, M.Pd</p>
              <p className="text-[10px] text-zinc-500">NIP. 198504122010011008</p>
            </div>
            <div>
              <p>Mengesahkan,</p>
              <p className="font-semibold">Kepala Madrasah / Sekolah</p>
              <div className="h-16"></div>
              <p className="font-bold underline">{schoolSetting?.principalName || 'DRS. H. MUKHLIS RAHMAN, M.Ag'}</p>
              <p className="text-[10px] text-zinc-500">NIP. {schoolSetting?.principalNip || '197001011995031002'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 text-zinc-200 rounded text-xs hover:bg-zinc-700 transition"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </Modal>
  );
};
