import React from 'react';
import {
  Send,
  MessageCircle,
  ShieldCheck,
  ExternalLink,
  ImageIcon,
  FileCheck,
  Upload,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { OsimWorkProgram, OsimSekbid, OsimProgramStatus } from '../../../types';

interface OsimProkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProker: OsimWorkProgram | null;
  prokerForm: Partial<OsimWorkProgram>;
  setProkerForm: React.Dispatch<React.SetStateAction<Partial<OsimWorkProgram>>>;
  onSaveProker: (e: React.FormEvent, submitToPembina?: boolean) => Promise<void>;
  isPengurusOsim: boolean;
  isOsimBph: boolean;
  sekbidList: string[];
}

export const OsimProkerModal: React.FC<OsimProkerModalProps> = ({
  isOpen,
  onClose,
  selectedProker,
  prokerForm,
  setProkerForm,
  onSaveProker,
  isPengurusOsim,
  isOsimBph,
  sekbidList
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedProker ? 'Ubah Program Kerja OSIM' : 'Tambah Program Kerja Intrakurikuler Baru'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={(e) => onSaveProker(e)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-zinc-300 mb-1">Nama Program Kerja / Kegiatan *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Latihan Dasar Kepemimpinan Santri (LDKS 2026)"
              value={prokerForm.title || ''}
              onChange={e => setProkerForm({ ...prokerForm, title: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-zinc-300">Seksi Bidang Penanggung Jawab *</label>
              {isPengurusOsim && !isOsimBph && (
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                  🔒 Terkunci (Bidang Sendiri)
                </span>
              )}
            </div>
            <select
              value={prokerForm.sekbid || ''}
              disabled={isPengurusOsim && !isOsimBph}
              onChange={e => setProkerForm({ ...prokerForm, sekbid: e.target.value as OsimSekbid })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {sekbidList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {isPengurusOsim && !isOsimBph && (
              <p className="text-[10px] text-zinc-400 mt-1">
                Sesuai matriks privilege RBAC, pengurus Sekbid menginput draf kegiatan khusus untuk bidangnya sendiri.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Penanggung Jawab (PJ) Pelaksana</label>
            <input
              type="text"
              placeholder="Nama Ketua Panitia / Sekbid"
              value={prokerForm.personInCharge || ''}
              onChange={e => setProkerForm({ ...prokerForm, personInCharge: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Tanggal Mulai Pelaksanaan *</label>
            <input
              type="date"
              required
              value={prokerForm.startDate || ''}
              onChange={e => setProkerForm({ ...prokerForm, startDate: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Tanggal Selesai (Opsional)</label>
            <input
              type="date"
              value={prokerForm.endDate || ''}
              onChange={e => setProkerForm({ ...prokerForm, endDate: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Lokasi Pelaksanaan *</label>
            <input
              type="text"
              required
              placeholder="Aula Utama / Lapangan / Wisma"
              value={prokerForm.location || ''}
              onChange={e => setProkerForm({ ...prokerForm, location: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Estimasi Anggaran (RAB Rp) *</label>
            <input
              type="number"
              required
              min={0}
              value={prokerForm.budgetEstimated ?? 0}
              onChange={e => setProkerForm({ ...prokerForm, budgetEstimated: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Status Program Kerja</label>
            <select
              value={prokerForm.status || 'Diajukan'}
              onChange={e => setProkerForm({ ...prokerForm, status: e.target.value as OsimProgramStatus })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              <option value="Draft">Draft</option>
              <option value="Diajukan">Diajukan</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Berlangsung">Berlangsung</option>
              <option value="Selesai">Selesai</option>
              <option value="Dibatalkan">Dibatalkan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Progress Ketercapaian ({prokerForm.progressPercentage || 0}%)</label>
            <input
              type="range"
              min="0"
              max="100"
              value={prokerForm.progressPercentage || 0}
              onChange={e => setProkerForm({ ...prokerForm, progressPercentage: Number(e.target.value) })}
              className="w-full accent-amber-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-zinc-300 mb-1">Indikator Keberhasilan (KPI Target)</label>
            <input
              type="text"
              placeholder="Target capaian kuantitatif/kualitatif kegiatan"
              value={prokerForm.successIndicator || ''}
              onChange={e => setProkerForm({ ...prokerForm, successIndicator: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-zinc-300 mb-1">Deskripsi & Rincian Teknis Kegiatan</label>
            <textarea
              rows={3}
              placeholder="Penjelasan latar belakang, konsep acara, dan tahapan eksekusi..."
              value={prokerForm.description || ''}
              onChange={e => setProkerForm({ ...prokerForm, description: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Bagian LPJ & Evaluasi Mandiri Siswa */}
          <div className="md:col-span-2 pt-3 border-t border-zinc-800">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-bold text-cyan-400">Laporan Pertanggungjawaban (LPJ) & Evaluasi Mandiri Siswa</span>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono">
                Belajar Mandiri
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mb-3">
              Ruang mandiri bagi pengurus seksi bidang untuk mencatat realisasi dana, evaluasi ketercapaian, dan mengunggah dokumen LPJ kegiatan.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Realisasi Anggaran Terpakai (Rp)</label>
            <input
              type="number"
              min={0}
              placeholder="0"
              value={prokerForm.budgetRealized || 0}
              onChange={e => setProkerForm({ ...prokerForm, budgetRealized: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Tautan Berkas LPJ / Google Drive (Link)</label>
            <input
              type="url"
              placeholder="https://drive.google.com/... atau link dokumen"
              value={prokerForm.lpjFileUrl || ''}
              onChange={e => setProkerForm({ ...prokerForm, lpjFileUrl: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-zinc-300 mb-1">Catatan Evaluasi & Hasil Pelaksanaan (LPJ Ringkas)</label>
            <textarea
              rows={3}
              placeholder="Tuliskan evaluasi pelaksanaan: capaian jumlah peserta, kendala di lapangan, solusi yang diambil, serta saran untuk kepengurusan berikutnya..."
              value={prokerForm.lpjNotes || ''}
              onChange={e => setProkerForm({ ...prokerForm, lpjNotes: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            {(!selectedProker || selectedProker.status === 'Draft' || selectedProker.status === 'Revisi') ? (
              <>
                <button
                  type="button"
                  onClick={(e) => onSaveProker(e, false)}
                  className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
                >
                  Simpan Sebagai Draft
                </button>
                <button
                  type="button"
                  onClick={(e) => onSaveProker(e, true)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  Simpan & Ajukan ke Pembina
                </button>
              </>
            ) : (
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
              >
                Simpan Perubahan
              </button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};

interface OsimProkerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProker: OsimWorkProgram | null;
  getStatusBadge: (status: OsimProgramStatus) => React.ReactNode;
  setSelectedPhotoPreview: (url: string) => void;
  canManageOsim: boolean;
  hasSupervisionVeto: boolean;
  onAjukanKePembina: (p: OsimWorkProgram) => void;
  onOpenGuidanceModal: (p: OsimWorkProgram) => void;
  onOpenLpjModal: (p: OsimWorkProgram) => void;
  onOpenLockAndArchiveModal: (p: OsimWorkProgram) => void;
  onOpenVetoModal: (p: OsimWorkProgram) => void;
  onJumpToRekap: () => void;
}

export const OsimProkerDetailModal: React.FC<OsimProkerDetailModalProps> = ({
  isOpen,
  onClose,
  selectedProker,
  getStatusBadge,
  setSelectedPhotoPreview,
  canManageOsim,
  hasSupervisionVeto,
  onAjukanKePembina,
  onOpenGuidanceModal,
  onOpenLpjModal,
  onOpenLockAndArchiveModal,
  onOpenVetoModal,
  onJumpToRekap
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Program Kerja Intrakurikuler OSIM"
      maxWidth="max-w-2xl"
    >
      {selectedProker && (
        <div className="space-y-4 text-xs">
          <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-3">
            <div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
                {selectedProker.sekbid}
              </span>
              <h3 className="text-base font-bold text-zinc-100 mt-1">{selectedProker.title}</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Penanggung Jawab: <strong className="text-zinc-200">{selectedProker.personInCharge}</strong></p>
            </div>
            {getStatusBadge(selectedProker.status)}
          </div>

          {/* Catatan Bimbingan Pembina OSIM */}
          {selectedProker.guidanceNotes && (
            <div className="p-3 bg-amber-950/25 border border-amber-500/40 rounded-lg space-y-1 text-xs">
              <div className="flex items-center justify-between text-amber-400 font-bold text-[11px] uppercase font-mono">
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5" />
                  Catatan Bimbingan Pembina OSIM
                </span>
                <span className="text-zinc-400 text-[10px] font-sans">
                  {selectedProker.verifiedBy || 'Pembina'} • {selectedProker.guidanceDate || '-'}
                </span>
              </div>
              <p className="text-zinc-200 leading-relaxed whitespace-pre-line text-[11px] bg-black/40 p-2.5 rounded border border-amber-500/20">
                {selectedProker.guidanceNotes}
              </p>
            </div>
          )}

          {/* Pengesahan Akhir & Rekap Tahunan Seal */}
          {selectedProker.status === 'Selesai & Sah' && (
            <div className="p-3 bg-emerald-950/25 border border-emerald-500/40 rounded-lg space-y-1 text-xs">
              <div className="flex items-center justify-between text-emerald-400 font-bold text-[11px] uppercase font-mono">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Status Dokumen: Selesai & Sah (Terarsip)
                </span>
                <span className="text-zinc-400 text-[10px] font-sans">
                  Sah: {selectedProker.finalApprovedAt || '-'}
                </span>
              </div>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                Program kerja dan LPJ ini telah divalidasi oleh <strong className="text-emerald-300">{selectedProker.finalApprovedBy || 'Pembina OSIM & Waka Kesiswaan'}</strong>. Seluruh data realisasi anggaran, evaluasi, dan bukti foto secara otomatis terakumulasi dalam <strong>Rekapitulasi Tahunan Kesiswaan</strong> untuk Laporan Kepala Madrasah / Sekolah.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 bg-zinc-900/80 p-3 rounded border border-zinc-800 font-mono">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block font-sans">Waktu & Tempat</span>
              <p className="text-zinc-200 mt-0.5">{selectedProker.startDate} {selectedProker.endDate && `s/d ${selectedProker.endDate}`}</p>
              <p className="text-zinc-400 text-[11px]">📍 {selectedProker.location}</p>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 uppercase block font-sans">Alokasi Anggaran (RAB)</span>
              <p className="text-amber-400 font-bold text-sm mt-0.5">Rp {selectedProker.budgetEstimated.toLocaleString('id-ID')}</p>
              <p className="text-zinc-400 text-[11px]">
                Realisasi: <strong className="text-emerald-400">Rp {(selectedProker.budgetRealized || 0).toLocaleString('id-ID')}</strong>
              </p>
            </div>
          </div>

          <div>
            <span className="text-zinc-400 font-semibold block mb-1">Target Peserta & Realisasi:</span>
            <p className="text-zinc-200 bg-zinc-900 p-2.5 rounded border border-zinc-800">
              {selectedProker.targetParticipants} (Estimasi: {selectedProker.participantCount || 0} Santri)
            </p>
          </div>

          <div>
            <span className="text-zinc-400 font-semibold block mb-1">Indikator Keberhasilan:</span>
            <p className="text-zinc-200 bg-zinc-900 p-2.5 rounded border border-zinc-800">{selectedProker.successIndicator}</p>
          </div>

          <div>
            <span className="text-zinc-400 font-semibold block mb-1">Deskripsi Kegiatan:</span>
            <p className="text-zinc-300 bg-zinc-900 p-2.5 rounded border border-zinc-800 leading-relaxed whitespace-pre-line">
              {selectedProker.description || 'Tidak ada deskripsi tambahan.'}
            </p>
          </div>

          {/* Laporan Pertanggungjawaban (LPJ) & Evaluasi Mandiri Siswa */}
          {(selectedProker.lpjNotes || selectedProker.lpjFileUrl || (selectedProker.budgetRealized && selectedProker.budgetRealized > 0) || (selectedProker.photos && selectedProker.photos.length > 0)) && (
            <div className="bg-cyan-950/20 border border-cyan-500/30 p-3 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                    Laporan Pertanggungjawaban (LPJ) & Evaluasi Mandiri Siswa
                  </span>
                </div>
                {selectedProker.lpjFileUrl && (
                  <a
                    href={selectedProker.lpjFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Buka Dokumen LPJ (Drive/PDF)</span>
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-black/40 p-2.5 rounded border border-cyan-500/20">
                <div>
                  <span className="text-zinc-400 block font-sans text-[10px]">Realisasi Kas vs RAB:</span>
                  <span className="text-emerald-400 font-bold">
                    Rp {(selectedProker.budgetRealized || 0).toLocaleString('id-ID')}
                  </span>
                  <span className="text-zinc-500 text-[10px] ml-1">
                    (RAB: Rp {selectedProker.budgetEstimated.toLocaleString('id-ID')})
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block font-sans text-[10px]">Efisiensi Anggaran:</span>
                  <span className={`font-bold ${((selectedProker.budgetEstimated || 0) - (selectedProker.budgetRealized || 0)) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    Rp {((selectedProker.budgetEstimated || 0) - (selectedProker.budgetRealized || 0)).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {selectedProker.lpjNotes && (
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase font-semibold block mb-1">
                    Ringkasan Evaluasi Pelaksanaan:
                  </span>
                  <div className="p-2.5 bg-black/40 rounded border border-cyan-500/20 text-zinc-300 text-xs whitespace-pre-line leading-relaxed">
                    {selectedProker.lpjNotes}
                  </div>
                </div>
              )}

              {/* Dokumentasi Foto Kegiatan */}
              {selectedProker.photos && selectedProker.photos.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-zinc-300 font-semibold text-[11px] flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                      Dokumentasi Foto Kegiatan ({selectedProker.photos.length} Foto):
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {selectedProker.photos.map((photo, pIdx) => (
                      <div
                        key={pIdx}
                        onClick={() => setSelectedPhotoPreview(photo)}
                        className="aspect-video bg-zinc-900 rounded overflow-hidden border border-zinc-800 hover:border-cyan-400 cursor-pointer relative group transition"
                      >
                        <img
                          src={photo}
                          alt={`Dokumentasi ${pIdx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-semibold transition">
                          Perbesar
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Actions based on Role & Workflow Stage */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-zinc-800">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Siswa: Ajukan ke Pembina if Draft or Revisi */}
              {(selectedProker.status === 'Draft' || selectedProker.status === 'Revisi') && canManageOsim && (
                <button
                  onClick={() => {
                    onAjukanKePembina(selectedProker);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  Ajukan ke Pembina OSIM
                </button>
              )}

              {/* Supervisi: Bimbingan & Verifikasi (Pembina, Waka, Admin) */}
              {hasSupervisionVeto && (selectedProker.status === 'Diajukan' || selectedProker.status === 'Draft' || selectedProker.status === 'Revisi') && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenGuidanceModal(selectedProker);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold transition shadow-sm"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  Bimbingan & Verifikasi
                </button>
              )}

              {/* Siswa: Lapor LPJ */}
              {(selectedProker.status === 'Disetujui' || selectedProker.status === 'Berlangsung') && canManageOsim && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenLpjModal(selectedProker);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold transition shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Pelaporan & Unggah LPJ
                </button>
              )}

              {/* Supervisi: Validasi Akhir LPJ (Pembina, Waka, Admin) */}
              {hasSupervisionVeto && (selectedProker.status === 'Menunggu Verifikasi LPJ' || selectedProker.status === 'Berlangsung') && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenLockAndArchiveModal(selectedProker);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold transition shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Validasi & Kunci Sah LPJ
                </button>
              )}

              {/* Supervisi: Hak Veto Resmi (Pembina, Waka, Admin) */}
              {hasSupervisionVeto && selectedProker.status !== 'Draft' && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenVetoModal(selectedProker);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold transition shadow-sm"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Hak Veto
                </button>
              )}

              {/* Jump to Rekap if Selesai & Sah */}
              {selectedProker.status === 'Selesai & Sah' && (
                <button
                  onClick={() => {
                    onClose();
                    onJumpToRekap();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded text-xs font-semibold transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Buka di Rekap Tahunan
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded text-xs hover:bg-zinc-700 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
