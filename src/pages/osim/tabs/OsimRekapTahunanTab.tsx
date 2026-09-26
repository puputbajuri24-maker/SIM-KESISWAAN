import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Printer,
  ExternalLink,
  Image as ImageIcon,
  Compass,
  Search,
  Filter,
  Wallet
} from 'lucide-react';
import { OsimWorkProgram } from '../../../types';
import { ExportActions } from '../../../components/common/ExportActions';

export interface OsimRekapTahunanTabProps {
  sahPrograms: OsimWorkProgram[];
  allProgramsCount: number;
  rekapTotalRab: number;
  rekapTotalRealized: number;
  rekapTotalParticipants: number;
  activeAcademicYear: string;
  onPrintAnnualReport: () => void;
  onOpenDetailProker: (proker: OsimWorkProgram) => void;
  onNavigateToProkerTab: () => void;
  osimCashBalance?: number;
  osimCashAccountName?: string;
  onNavigateToCashLedger?: () => void;
}

export const OsimRekapTahunanTab: React.FC<OsimRekapTahunanTabProps> = ({
  sahPrograms,
  allProgramsCount,
  rekapTotalRab,
  rekapTotalRealized,
  rekapTotalParticipants,
  activeAcademicYear,
  onPrintAnnualReport,
  onOpenDetailProker,
  onNavigateToProkerTab,
  osimCashBalance = 0,
  osimCashAccountName,
  onNavigateToCashLedger
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSekbid, setFilterSekbid] = useState<string>('all');

  // Extract unique sekbids from sah programs
  const uniqueSekbids = useMemo(() => {
    const set = new Set<string>();
    sahPrograms.forEach(p => {
      if (p.sekbid) set.add(p.sekbid);
    });
    return Array.from(set).sort();
  }, [sahPrograms]);

  // Filtered sah programs
  const filteredSahPrograms = useMemo(() => {
    return sahPrograms.filter(p => {
      if (filterSekbid !== 'all' && p.sekbid !== filterSekbid) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (p.title || '').toLowerCase().includes(q);
        const matchPj = (p.personInCharge || '').toLowerCase().includes(q);
        const matchSekbid = (p.sekbid || '').toLowerCase().includes(q);
        if (!matchTitle && !matchPj && !matchSekbid) {
          return false;
        }
      }
      return true;
    });
  }, [sahPrograms, filterSekbid, searchQuery]);

  return (
    <div className="space-y-4" id="view-rekap-tahunan-osim">
      {/* Header Banner */}
      <div className="bg-[#121214] border border-emerald-500/30 rounded-lg p-4 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold tracking-wide text-zinc-100 uppercase">
                  Rekapitulasi Tahunan Dokumen LPJ & Proker OSIM
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                  TERVALIDASI SAH
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
                Arsip resmi seluruh program kerja OSIM yang telah tuntas dilaksanakan, ber-LPJ sah, dan divalidasi oleh Pembina OSIM & Waka Kesiswaan untuk Laporan Pertanggungjawaban kepada Kepala Madrasah / Sekolah Tahun Ajaran {activeAcademicYear}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ExportActions
              data={sahPrograms}
              filename={`Rekap_Tahunan_LPJ_OSIM_${activeAcademicYear}`}
              title="Ekspor Rekap"
            />
            <button
              id="btn-print-rekap-kamad"
              type="button"
              onClick={onPrintAnnualReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold tracking-wide transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Cetak Lembar Pengesahan Kamad
            </button>
          </div>
        </div>

        {/* Telemetry Metric Widgets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 mt-4 pt-3 border-t border-zinc-800/80 font-mono">
          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded">
            <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Program Kerja Sah</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold text-emerald-400">{sahPrograms.length}</span>
              <span className="text-[10px] text-zinc-400">
                dari {allProgramsCount} ({Math.round((sahPrograms.length / (allProgramsCount || 1)) * 100)}%)
              </span>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded">
            <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Total Anggaran (RAB)</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-bold text-amber-400">Rp {rekapTotalRab.toLocaleString('id-ID')}</span>
              <span className="text-[10px] text-zinc-400">Rencana</span>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded">
            <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Total Realisasi Kas</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-bold text-zinc-100">Rp {rekapTotalRealized.toLocaleString('id-ID')}</span>
              <span className="text-[10px] text-emerald-400">Terpakai</span>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded">
            <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Efisiensi / Deviasi</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className={`text-sm font-bold ${rekapTotalRab >= rekapTotalRealized ? 'text-emerald-400' : 'text-rose-400'}`}>
                Rp {(rekapTotalRab - rekapTotalRealized).toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] text-zinc-400">
                {rekapTotalRab >= rekapTotalRealized ? 'Hemat' : 'Defisit'}
              </span>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded col-span-2 sm:col-span-4 lg:col-span-1">
            <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Total Partisipasi Santri</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold text-indigo-400">{rekapTotalParticipants}</span>
              <span className="text-[10px] text-zinc-400">Peserta Hadir</span>
            </div>
          </div>
        </div>

        {/* Transparansi Rekening Kas OSIM */}
        <div className="mt-3 pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-zinc-950/60 p-3 rounded-lg border border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-200 uppercase font-mono tracking-wide">
                  {osimCashAccountName || 'Rekening Kas OSIM & Intrakurikuler'}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  REKAP LPJ SAH
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Saldo Kas Terkini:{' '}
                <strong className="text-emerald-400 font-mono">
                  Rp {osimCashBalance.toLocaleString('id-ID')}
                </strong>
                {' '}• Total Pengeluaran LPJ Sah Terverifikasi:{' '}
                <strong className="text-zinc-200 font-mono">
                  Rp {rekapTotalRealized.toLocaleString('id-ID')}
                </strong>
              </p>
            </div>
          </div>

          {onNavigateToCashLedger && (
            <button
              type="button"
              onClick={onNavigateToCashLedger}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded text-xs font-semibold tracking-wide transition shrink-0"
            >
              <span>Lihat Ledger Kas OSIM</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      {sahPrograms.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[#121214] border border-zinc-800 p-3 rounded">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Cari dalam dokumen sah berdasarkan judul, PJ, atau bidang..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterSekbid}
              onChange={e => setFilterSekbid(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Semua Bidang & BPH</option>
              {uniqueSekbids.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {(searchQuery || filterSekbid !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterSekbid('all');
                }}
                className="px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-mono transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table of Certified & Archived Programs */}
      <div className="bg-[#121214] border border-zinc-800 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase text-zinc-200">
              Daftar Program Kerja Berstatus "Selesai & Sah"
            </h3>
            <p className="text-[11px] text-zinc-400">
              Dokumen terarsip yang telah memenuhi seluruh syarat akuntabilitas LPJ, kwitansi biaya, dan bukti visual.
            </p>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            Menampilkan <strong className="text-emerald-400">{filteredSahPrograms.length}</strong> dokumen sah
          </span>
        </div>

        {filteredSahPrograms.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/60">
                  <th className="p-2.5">No</th>
                  <th className="p-2.5">Bidang OSIM</th>
                  <th className="p-2.5">Nama Program Kerja</th>
                  <th className="p-2.5">PJ / Pelaksana</th>
                  <th className="p-2.5 text-right">RAB (Rp)</th>
                  <th className="p-2.5 text-right">Realisasi (Rp)</th>
                  <th className="p-2.5 text-right">Efisiensi</th>
                  <th className="p-2.5 text-center">Partisipan</th>
                  <th className="p-2.5">Tanggal Sah</th>
                  <th className="p-2.5 text-center">Berkas & Bukti</th>
                  <th className="p-2.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {filteredSahPrograms.map((p, idx) => {
                  const est = p.budgetEstimated || 0;
                  const real = p.budgetRealized || 0;
                  const diff = est - real;
                  return (
                    <tr key={p.id} className="hover:bg-zinc-900/40 transition">
                      <td className="p-2.5 font-mono text-zinc-400">{idx + 1}</td>
                      <td className="p-2.5 text-[11px] font-mono text-zinc-300 font-semibold">
                        {p.sekbid.split(':')[0]}
                      </td>
                      <td className="p-2.5 font-bold text-zinc-100">
                        {p.title}
                      </td>
                      <td className="p-2.5 text-xs text-zinc-400">{p.personInCharge}</td>
                      <td className="p-2.5 text-right font-mono text-amber-400 font-semibold">
                        Rp {est.toLocaleString('id-ID')}
                      </td>
                      <td className="p-2.5 text-right font-mono text-zinc-200">
                        Rp {real.toLocaleString('id-ID')}
                      </td>
                      <td className={`p-2.5 text-right font-mono font-semibold ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        Rp {diff.toLocaleString('id-ID')}
                      </td>
                      <td className="p-2.5 text-center font-mono text-indigo-400">
                        {p.participantCount || 0} Siswa
                      </td>
                      <td className="p-2.5 text-xs font-mono text-zinc-400">
                        {p.finalApprovedAt || p.endDate || '-'}
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {p.lpjFileUrl ? (
                            <a
                              href={p.lpjFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-cyan-400 hover:text-cyan-300 transition"
                              title="Lihat Berkas LPJ"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-zinc-500 font-mono">-</span>
                          )}
                          {p.photos && p.photos.length > 0 && (
                            <span
                              onClick={() => onOpenDetailProker(p)}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-zinc-800 text-[10px] text-emerald-400 rounded cursor-pointer hover:bg-zinc-700 font-mono"
                              title={`${p.photos.length} Foto Dokumentasi`}
                            >
                              <ImageIcon className="w-3 h-3" />
                              {p.photos.length}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => onOpenDetailProker(p)}
                          className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-emerald-400 rounded text-xs transition"
                        >
                          Detail LPJ
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 border border-dashed border-zinc-800 rounded p-6">
            <ShieldCheck className="w-9 h-9 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-zinc-300">Belum ada program kerja yang berstatus "Selesai & Sah".</p>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-md mx-auto">
              Setelah kegiatan selesai, siswa bidang mengisi LPJ & realisasi biaya. Pembina OSIM atau Waka Kesiswaan kemudian melakukan validasi akhir dan mengunci status program menjadi "Selesai & Sah".
            </p>
            <button
              type="button"
              onClick={onNavigateToProkerTab}
              className="mt-3 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 rounded text-xs font-semibold transition"
            >
              Buka Daftar Program Kerja
            </button>
          </div>
        )}
      </div>

      {/* Educational Workflow Card */}
      <div className="bg-[#121214] border border-zinc-800 p-4 rounded-lg">
        <h3 className="text-xs font-mono font-bold uppercase text-zinc-200 mb-3 flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-amber-400" />
          SOP Alur Akuntabilitas & Bimbingan Program Kerja OSIM
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center gap-2 mb-1.5 text-amber-400 font-bold">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] font-mono border border-amber-500/40">1</span>
              <span>Pengajuan Usulan (Siswa)</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Pengurus bidang membuat proposal/rencana kegiatan dengan status awal <strong>Draft</strong>, menyusun estimasi RAB & indikator keberhasilan, lalu klik <strong>Ajukan ke Pembina</strong>.
            </p>
          </div>

          <div className="p-3 rounded bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center gap-2 mb-1.5 text-indigo-400 font-bold">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-mono border border-indigo-500/40">2</span>
              <span>Bimbingan & Verifikasi (Pembina)</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Pembina OSIM menerima notifikasi, memeriksa kelayakan rencana anggaran, memberikan catatan arahan/bimbingan, dan mengesahkan status menjadi <strong>Disetujui</strong>.
            </p>
          </div>

          <div className="p-3 rounded bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center gap-2 mb-1.5 text-emerald-400 font-bold">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-mono border border-emerald-500/40">3</span>
              <span>Pelaporan LPJ & Arsip Sah (Kamad)</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Siswa mengunggah foto, kwitansi realisasi, serta evaluasi. Pembina & Waka Kesiswaan mengunci status menjadi <strong>Selesai & Sah</strong> yang otomatis terakumulasi dalam Laporan Tahunan Kamad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
