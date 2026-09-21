import React from 'react';
import {
  AlertCircle,
  Crown,
  Sparkles,
  Search,
  Plus,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  Send,
  FileCheck,
  Upload,
  Lock,
  Edit2,
  Trash2,
  Target
} from 'lucide-react';
import { OsimWorkProgram, UserProfile } from '../../../types';

export interface OsimProkerTabProps {
  hasSupervisionVeto: boolean;
  pendingVerificationCount: number;
  pendingLpjCount: number;
  setFilterStatus: (status: string) => void;
  isOsimBph: boolean;
  currentUser: UserProfile | null;
  isOsimKetua: boolean;
  isOsimWakil: boolean;
  isOsimSekretaris: boolean;
  isOsimBendahara: boolean;
  isPengurusOsim: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterSekbid: string;
  setFilterSekbid: (sekbid: string) => void;
  filterStatus: string;
  sekbidList: string[];
  canManageOsim: boolean;
  onOpenAddProker: () => void;
  filteredPrograms: OsimWorkProgram[];
  onOpenDetailProker: (proker: OsimWorkProgram) => void;
  getStatusBadge: (status: OsimWorkProgram['status']) => React.ReactNode;
  onAjukanKePembina: (proker: OsimWorkProgram, e: React.MouseEvent) => void;
  onOpenGuidanceModal: (proker: OsimWorkProgram, e: React.MouseEvent) => void;
  onOpenLpjModal: (proker: OsimWorkProgram, e: React.MouseEvent) => void;
  onOpenLockAndArchiveModal: (proker: OsimWorkProgram, e: React.MouseEvent) => void;
  onOpenVetoModal: (proker: OsimWorkProgram, e: React.MouseEvent) => void;
  onOpenEditProker: (proker: OsimWorkProgram, e: React.MouseEvent) => void;
  onDeleteProker: (proker: OsimWorkProgram) => void;
}

export const OsimProkerTab: React.FC<OsimProkerTabProps> = ({
  hasSupervisionVeto,
  pendingVerificationCount,
  pendingLpjCount,
  setFilterStatus,
  isOsimBph,
  currentUser,
  isOsimKetua,
  isOsimWakil,
  isOsimSekretaris,
  isOsimBendahara,
  isPengurusOsim,
  searchQuery,
  setSearchQuery,
  filterSekbid,
  setFilterSekbid,
  filterStatus,
  sekbidList,
  canManageOsim,
  onOpenAddProker,
  filteredPrograms,
  onOpenDetailProker,
  getStatusBadge,
  onAjukanKePembina,
  onOpenGuidanceModal,
  onOpenLpjModal,
  onOpenLockAndArchiveModal,
  onOpenVetoModal,
  onOpenEditProker,
  onDeleteProker,
}) => {
  return (
    <div className="space-y-4" id="view-proker-osim">
      {/* Notification banner for Supervisi & Hak Veto (Pembina OSIM, Waka Kesiswaan & Admin App) */}
      {hasSupervisionVeto && (pendingVerificationCount > 0 || pendingLpjCount > 0) && (
        <div className="bg-amber-950/25 border border-amber-500/40 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-zinc-200">
              <strong className="text-amber-400">Supervisi & Hak Veto Kesiswaan:</strong> Terdapat{' '}
              {pendingVerificationCount > 0 && (
                <span className="font-semibold text-amber-300 underline underline-offset-2">
                  {pendingVerificationCount} pengajuan usulan baru
                </span>
              )}
              {pendingVerificationCount > 0 && pendingLpjCount > 0 && ' dan '}
              {pendingLpjCount > 0 && (
                <span className="font-semibold text-purple-300 underline underline-offset-2">
                  {pendingLpjCount} draft LPJ kegiatan
                </span>
              )} yang menunggu verifikasi atau validasi Anda.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {pendingVerificationCount > 0 && (
              <button
                onClick={() => setFilterStatus('Diajukan')}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium text-[11px] shadow-sm transition"
              >
                Tinjau Usulan ({pendingVerificationCount})
              </button>
            )}
            {pendingLpjCount > 0 && (
              <button
                onClick={() => setFilterStatus('Menunggu Verifikasi LPJ')}
                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium text-[11px] shadow-sm transition"
              >
                Validasi LPJ ({pendingLpjCount})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Model A: Banner Komando Pengurus Inti (BPH: Ketua, Wakil, Sekretaris, Bendahara) */}
      {isOsimBph && (
        <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Crown className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <strong className="text-emerald-300">Model A: Akun Fungsional Pengurus Inti OSIM (BPH)</strong>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {currentUser?.osimPosition || (isOsimKetua ? 'Ketua OSIM' : isOsimWakil ? 'Wakil Ketua' : isOsimSekretaris ? 'Sekretaris' : isOsimBendahara ? 'Bendahara' : 'BPH')}
                </span>
              </div>
              <p className="text-zinc-300 text-[11px] mt-0.5">
                Sebagai Pengurus Inti, Anda memiliki wewenang lintas Sekbid untuk memantau proposal, menyusun proker, dan mendampingi pelaksanaan kegiatan bersama Pembina OSIM.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Banner Anggota OSIM - Seksi Bidang (Sekbid) */}
      {isPengurusOsim && !isOsimBph && (
        <div className="bg-sky-950/20 border border-sky-500/40 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-md bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Sparkles className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <strong className="text-sky-300">Akun Fungsional Seksi Bidang (Sekbid) OSIM</strong>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {currentUser?.osimDepartmentName || currentUser?.osimPosition || 'Seksi Bidang OSIM'}
                </span>
              </div>
              <p className="text-zinc-300 text-[11px] mt-0.5">
                Sebagai pelaksana program spesifik, Anda dapat menginput draf proposal kegiatan khusus untuk bidang Anda, absensi kegiatan, dan dokumentasi/laporan keuangan mini. Sesuai batasan keamanan RBAC, akses ke data nilai, pelanggaran, atau catatan BK siswa lain tertutup total.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121214] border border-zinc-800 p-3 rounded">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Cari program kerja intrakurikuler, penanggung jawab, atau sekbid..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={filterSekbid}
            onChange={e => setFilterSekbid(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Semua Sekbid & BPH</option>
            {sekbidList.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Semua Status Proker</option>
            <option value="Draft">Draft (Usulan Awal)</option>
            <option value="Diajukan">Diajukan ke Pembina</option>
            <option value="Revisi">Perlu Revisi</option>
            <option value="Disetujui">Disetujui Pembina</option>
            <option value="Berlangsung">Sedang Berlangsung</option>
            <option value="Menunggu Verifikasi LPJ">Menunggu Verifikasi LPJ</option>
            <option value="Selesai & Sah">Selesai & Sah (Terarsip)</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>

          {canManageOsim && (
            <button
              onClick={onOpenAddProker}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Baru
            </button>
          )}
        </div>
      </div>

      {/* Proker Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredPrograms.map(proker => (
          <div
            key={proker.id}
            onClick={() => onOpenDetailProker(proker)}
            className="bg-[#121214] border border-zinc-800 hover:border-amber-500/40 rounded-lg p-4 transition cursor-pointer flex flex-col justify-between group shadow-sm relative"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 line-clamp-1">
                  {proker.sekbid.split(':')[0]}
                </span>
                {getStatusBadge(proker.status)}
              </div>

              <h3 className="font-bold text-sm text-zinc-100 group-hover:text-amber-400 transition leading-snug">
                {proker.title}
              </h3>

              <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                {proker.description || proker.successIndicator}
              </p>

              {/* Catatan Pembina banner if exists */}
              {proker.guidanceNotes && (
                <div className="mt-2.5 p-2 bg-amber-950/20 border border-amber-500/30 rounded text-[11px] text-amber-300/90 leading-relaxed">
                  <div className="font-semibold text-amber-400 flex items-center gap-1 text-[10px] uppercase">
                    <MessageSquare className="w-3 h-3" />
                    Catatan Bimbingan ({proker.verifiedBy || 'Pembina'}):
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-zinc-300">{proker.guidanceNotes}</p>
                </div>
              )}

              {/* Intervensi Hak Veto banner if vetoed */}
              {proker.vetoedBy && (
                <div className="mt-2.5 p-2 bg-rose-950/30 border border-rose-500/40 rounded text-[11px] text-rose-300 leading-relaxed">
                  <div className="font-bold text-rose-400 flex items-center gap-1 text-[10px] uppercase">
                    <ShieldAlert className="w-3 h-3 text-rose-400" />
                    Intervensi Hak Veto ({proker.vetoedBy}):
                  </div>
                  <p className="mt-0.5 text-zinc-300 text-[10px]">
                    {proker.vetoReason || 'Keputusan hak veto diberlakukan oleh otoritas kesiswaan/admin.'}
                  </p>
                </div>
              )}

              {/* Pengesahan stamp if Selesai & Sah */}
              {proker.status === 'Selesai & Sah' && (
                <div className="mt-2.5 p-2 bg-emerald-950/20 border border-emerald-500/30 rounded text-[11px] text-emerald-300 leading-relaxed flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[10px] text-zinc-300 font-mono">
                    Disahkan: {proker.finalApprovedAt || '-'} • Masuk Rekap Tahunan
                  </span>
                </div>
              )}

              <div className="mt-3 space-y-1.5 text-[11px] text-zinc-400 border-t border-zinc-800/80 pt-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">PJ / Pelaksana:</span>
                  <span className="text-zinc-200 font-medium truncate max-w-[170px]">{proker.personInCharge}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Waktu & Lokasi:</span>
                  <span className="text-zinc-300 font-mono text-[10px] truncate max-w-[170px]">{proker.startDate} • {proker.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">RAB / Realisasi:</span>
                  <div className="text-right font-mono text-[11px]">
                    <span className="text-amber-400 font-semibold">Rp {proker.budgetEstimated.toLocaleString('id-ID')}</span>
                    {proker.budgetRealized > 0 && (
                      <span className="text-zinc-400 ml-1">/ <strong className="text-emerald-400">Rp {proker.budgetRealized.toLocaleString('id-ID')}</strong></span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress bar & Contextual Actions */}
            <div className="mt-3 pt-2.5 border-t border-zinc-800/80">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
                <span>Progress Ketercapaian</span>
                <span className="font-bold text-zinc-200">{proker.progressPercentage}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    proker.progressPercentage >= 100
                      ? 'bg-emerald-500'
                      : proker.progressPercentage >= 50
                      ? 'bg-sky-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${proker.progressPercentage}%` }}
                ></div>
              </div>

              {/* Contextual Workflow Action Buttons */}
              <div className="mt-3 pt-2 border-t border-zinc-800/40 flex items-center justify-between gap-1" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Siswa Action: Ajukan ke Pembina if Draft or Revisi */}
                  {(proker.status === 'Draft' || proker.status === 'Revisi') && canManageOsim && (
                    <button
                      onClick={e => onAjukanKePembina(proker, e)}
                      className="flex items-center gap-1 px-2 py-0.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 rounded text-[10px] font-semibold transition"
                      title="Ajukan Usulan Proker ke Pembina OSIM"
                    >
                      <Send className="w-3 h-3" />
                      Ajukan ke Pembina
                    </button>
                  )}

                  {/* Supervisi Action: Verifikasi & Bimbingan */}
                  {hasSupervisionVeto && (proker.status === 'Diajukan' || proker.status === 'Draft' || proker.status === 'Revisi') && (
                    <button
                      onClick={e => onOpenGuidanceModal(proker, e)}
                      className="flex items-center gap-1 px-2 py-0.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded text-[10px] font-semibold transition"
                      title="Bimbingan & Verifikasi Usulan (Pembina, Waka & Admin)"
                    >
                      <FileCheck className="w-3 h-3" />
                      Bimbingan
                    </button>
                  )}

                  {/* Siswa Action: Pelaksanaan & Kirim LPJ */}
                  {(proker.status === 'Disetujui' || proker.status === 'Berlangsung') && canManageOsim && (
                    <button
                      onClick={e => onOpenLpjModal(proker, e)}
                      className="flex items-center gap-1 px-2 py-0.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 rounded text-[10px] font-semibold transition"
                      title="Isi LPJ, Realisasi Biaya & Upload Foto"
                    >
                      <Upload className="w-3 h-3" />
                      Pelaporan LPJ
                    </button>
                  )}

                  {/* Supervisi Action: Validasi LPJ & Kunci Sah */}
                  {hasSupervisionVeto && (proker.status === 'Menunggu Verifikasi LPJ' || proker.status === 'Berlangsung') && (
                    <button
                      onClick={e => onOpenLockAndArchiveModal(proker, e)}
                      className="flex items-center gap-1 px-2 py-0.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded text-[10px] font-semibold transition"
                      title="Validasi LPJ dan Kunci Sah (Pembina, Waka & Admin)"
                    >
                      <Lock className="w-3 h-3" />
                      Validasi Sah
                    </button>
                  )}

                  {/* Supervisi Action: Hak Veto Resmi */}
                  {hasSupervisionVeto && proker.status !== 'Draft' && (
                    <button
                      onClick={e => onOpenVetoModal(proker, e)}
                      className="flex items-center gap-1 px-2 py-0.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded text-[10px] font-semibold transition"
                      title="Pemberlakuan Hak Veto Kesiswaan (Revisi Darurat / Pembatalan)"
                    >
                      <ShieldAlert className="w-3 h-3 text-rose-400" />
                      Hak Veto
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {(hasSupervisionVeto || isOsimBph) && (
                    <button
                      onClick={e => onOpenEditProker(proker, e)}
                      className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 transition"
                      title="Edit Proker"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {hasSupervisionVeto && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onDeleteProker(proker);
                      }}
                      className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-rose-400 transition"
                      title="Hapus Proker"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPrograms.length === 0 && (
        <div className="text-center py-12 bg-[#121214] border border-zinc-800 rounded-lg p-6">
          <Target className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-zinc-300">Tidak ada program kerja intrakurikuler yang sesuai.</p>
          <p className="text-xs text-zinc-500 mt-1">Coba sesuaikan kata kunci pencarian atau ganti filter seksi bidang.</p>
          {canManageOsim && (
            <button
              onClick={onOpenAddProker}
              className="mt-4 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold"
            >
              Tambah Program Kerja Baru
            </button>
          )}
        </div>
      )}
    </div>
  );
};
