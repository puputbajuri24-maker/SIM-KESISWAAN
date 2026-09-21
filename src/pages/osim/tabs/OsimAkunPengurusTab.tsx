import React from 'react';
import {
  Key,
  RefreshCw,
  Printer,
  UserPlus,
  Check,
  Search,
  Eye,
  EyeOff,
  Edit2,
  Trash2
} from 'lucide-react';
import { OsimMember, UserProfile } from '../../../types';

export interface OsimAkunPengurusTabProps {
  osimMembers: OsimMember[];
  osimAccounts: UserProfile[];
  filteredOsimAccounts: UserProfile[];
  unlinkedKabinetMembers: OsimMember[];
  isSyncingAccounts: boolean;
  onSyncAccountsFromStructure: () => void;
  onPrintSlips: (target: 'all' | UserProfile) => void;
  onOpenAddOsimAccount: () => void;
  accountSearchQuery: string;
  setAccountSearchQuery: (query: string) => void;
  accountRoleFilter: 'all' | 'bph' | 'sekbid';
  setAccountRoleFilter: (filter: 'all' | 'bph' | 'sekbid') => void;
  showAccountPasswords: boolean;
  setShowAccountPasswords: (show: boolean) => void;
  onPromptQuickResetOsimPassword: (user: UserProfile) => void;
  onOpenEditOsimAccount: (user: UserProfile) => void;
  onPromptDeleteOsimAccount: (user: UserProfile) => void;
}

export const OsimAkunPengurusTab: React.FC<OsimAkunPengurusTabProps> = ({
  osimMembers,
  osimAccounts,
  filteredOsimAccounts,
  unlinkedKabinetMembers,
  isSyncingAccounts,
  onSyncAccountsFromStructure,
  onPrintSlips,
  onOpenAddOsimAccount,
  accountSearchQuery,
  setAccountSearchQuery,
  accountRoleFilter,
  setAccountRoleFilter,
  showAccountPasswords,
  setShowAccountPasswords,
  onPromptQuickResetOsimPassword,
  onOpenEditOsimAccount,
  onPromptDeleteOsimAccount,
}) => {
  return (
    <div className="space-y-4" id="view-akun-pengurus-osim">
      {/* Policy & Authority Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900/90 to-zinc-900 border border-amber-500/40 p-4 rounded-lg shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shrink-0 mt-0.5">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                  Pusat Manajemen Akun & Kata Sandi Login Pengurus OSIM
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  HAK AKSES PEMBINA & ADMIN
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed">
                Sesuai kebijakan madrasah: Siswa pengurus OSIM <strong>dilarang dan ditiadakan fitur ganti password mandiri</strong>. Pembina OSIM dan Admin App memegang kendali penuh atas akun dan kata sandi login anggota OSIM. Setiap perubahan kata sandi langsung aktif secara <em>real-time</em> dan password lama otomatis tidak berlaku lagi.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
            <button
              type="button"
              onClick={onSyncAccountsFromStructure}
              disabled={isSyncingAccounts}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition disabled:opacity-50"
              title="Otomatis buatkan akun bagi pengurus yang belum memiliki kredensial"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAccounts ? 'animate-spin text-amber-400' : 'text-zinc-400'}`} />
              Sinkronisasi dari Anggota ({osimMembers.length})
            </button>

            <button
              type="button"
              onClick={() => onPrintSlips('all')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition"
              title="Cetak kartu slip login resmi untuk dibagikan ke siswa pengurus"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              Cetak Kartu Login
            </button>

            <button
              type="button"
              onClick={onOpenAddOsimAccount}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Tambah Akun Pengurus
            </button>
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
        <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded">
          <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Total Akun Login OSIM</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-zinc-100">{osimAccounts.length}</span>
            <span className="text-[10px] text-amber-400 font-sans">Terdaftar</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded">
          <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Akun BPH (Inti)</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-amber-400">
              {osimAccounts.filter(u => u.osimRole === 'ketua' || u.osimRole === 'wakil' || u.osimRole === 'sekretaris' || u.osimRole === 'bendahara').length}
            </span>
            <span className="text-[10px] text-zinc-400 font-sans">Ketua, Sekr, Bend</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded">
          <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Akun Sekbid / Koord</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-sky-400">
              {osimAccounts.filter(u => u.osimRole === 'sekbid').length}
            </span>
            <span className="text-[10px] text-zinc-400 font-sans">Bidang</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded">
          <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Status Akun Aktif</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-emerald-400">
              {osimAccounts.filter(u => (u.status || 'Aktif') === 'Aktif').length}
            </span>
            <span className="text-[10px] text-emerald-400 font-sans">Bisa Login</span>
          </div>
        </div>
      </div>

      {/* Banner Status Sinkronisasi Struktur Kabinet */}
      {unlinkedKabinetMembers.length > 0 ? (
        <div className="bg-amber-950/30 border border-amber-500/40 p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-300">Sinkronisasi Struktur Kabinet Belum Lengkap</h4>
              <p className="text-[11px] text-zinc-300 mt-0.5">
                Terdapat <strong className="text-amber-400">{unlinkedKabinetMembers.length} anggota</strong> di sub-menu <strong>Struktur Kabinet</strong> yang belum memiliki akun login resmi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSyncAccountsFromStructure}
            disabled={isSyncingAccounts}
            className="px-3.5 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shrink-0 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAccounts ? 'animate-spin' : ''}`} />
            <span>Sinkronkan {unlinkedKabinetMembers.length} Akun Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="bg-emerald-950/20 border border-emerald-500/30 px-3.5 py-2.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Seluruh anggota di <strong>Struktur Kabinet OSIM</strong> telah 100% tersinkron dengan sub-menu <strong>Kelola Akun</strong> dan cPanel Admin.</span>
          </div>
          <span className="text-[10px] font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-emerald-400 shrink-0">
            ✓ Sinkronisasi Optimal
          </span>
        </div>
      )}

      {/* Search, Filter & Show Password Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#121214] border border-zinc-800 p-3 rounded">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Cari akun berdasarkan nama, username, jabatan atau seksi bidang..."
            value={accountSearchQuery}
            onChange={e => setAccountSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded p-0.5">
            <button
              type="button"
              onClick={() => setAccountRoleFilter('all')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                accountRoleFilter === 'all'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Semua ({osimAccounts.length})
            </button>
            <button
              type="button"
              onClick={() => setAccountRoleFilter('bph')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                accountRoleFilter === 'bph'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              BPH
            </button>
            <button
              type="button"
              onClick={() => setAccountRoleFilter('sekbid')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                accountRoleFilter === 'sekbid'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sekbid
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAccountPasswords(!showAccountPasswords)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-semibold transition ${
              showAccountPasswords
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
            title="Tampilkan kata sandi teks terbuka untuk pengawasan pembina"
          >
            {showAccountPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showAccountPasswords ? 'Tutup Password' : 'Lihat Password'}</span>
          </button>
        </div>
      </div>

      {/* Accounts List / Table */}
      {filteredOsimAccounts.length === 0 ? (
        <div className="bg-[#121214] border border-dashed border-zinc-800 rounded-lg p-10 text-center">
          <Key className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm text-zinc-400 font-medium">Tidak ada akun pengurus OSIM yang cocok dengan pencarian.</p>
          <p className="text-xs text-zinc-500 mt-1">Gunakan tombol "Sinkronisasi dari Anggota" untuk membuatkan akun otomatis dari daftar anggota yang ada.</p>
        </div>
      ) : (
        <div className="bg-[#121214] border border-zinc-800 rounded-lg overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 uppercase font-mono text-[10px]">
                  <th className="py-2.5 px-3">Nama & Jabatan Pengurus</th>
                  <th className="py-2.5 px-3">Username Login</th>
                  <th className="py-2.5 px-3">Kata Sandi Login</th>
                  <th className="py-2.5 px-3">Seksi Bidang</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi Pembina</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredOsimAccounts.map(u => {
                  const isBph = u.osimRole === 'ketua' || u.osimRole === 'wakil' || u.osimRole === 'sekretaris' || u.osimRole === 'bendahara';
                  const linkedMem = osimMembers.find(m =>
                    m.id === u.uid ||
                    (m.loginUsername && u.username && m.loginUsername.toLowerCase() === u.username.toLowerCase()) ||
                    (m.username && u.username && m.username.toLowerCase() === u.username.toLowerCase()) ||
                    (m.studentNis && u.nip && m.studentNis === u.nip) ||
                    (m.fullName.toLowerCase().trim() === u.displayName.toLowerCase().replace(/\s*\(.*\)$/, '').trim())
                  );

                  return (
                    <tr key={u.uid} className="hover:bg-zinc-900/40 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isBph
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                          }`}>
                            {u.displayName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-zinc-100 truncate">{u.displayName}</div>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                                isBph
                                  ? 'bg-amber-500/15 text-amber-300 font-bold'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}>
                                {u.osimPosition || (isBph ? 'BPH OSIM' : 'Pengurus Sekbid')}
                              </span>
                              {linkedMem ? (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                                  ✓ Kabinet: {linkedMem.className} (NIS: {linkedMem.studentNis || '-'})
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-zinc-800 text-zinc-400 font-mono">
                                  {u.studentClass ? `Kelas ${u.studentClass}` : 'Data Mandiri'}
                                </span>
                              )}
                              {u.isCashManager && (
                                <span className="px-1 py-0.2 rounded text-[9px] bg-emerald-500/15 text-emerald-400 font-mono font-bold">
                                  KAS
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono text-zinc-200 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                          @{u.username}
                        </span>
                        <div className="text-[10px] text-zinc-500 mt-1 font-mono truncate max-w-[150px]">
                          {u.email}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <div className="flex items-center gap-2">
                          {showAccountPasswords ? (
                            <span className="text-emerald-400 font-bold bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/30">
                              {u.password || 'password'}
                            </span>
                          ) : (
                            <span className="text-zinc-500">••••••••</span>
                          )}
                          <button
                            type="button"
                            onClick={() => onPromptQuickResetOsimPassword(u)}
                            className="p-1 rounded hover:bg-zinc-800 text-amber-400 transition"
                            title="Ganti Kata Sandi Siswa"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-zinc-300">
                        <span className="line-clamp-1 max-w-[200px]" title={u.osimDepartmentName || '-'}>
                          {u.osimDepartmentName || (isBph ? 'Badan Pengurus Harian' : '-')}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          (u.status || 'Aktif') === 'Aktif'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {u.status || 'Aktif'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onPrintSlips(u)}
                            className="px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold flex items-center gap-1 transition"
                            title="Cetak Kartu Login Siswa Ini"
                          >
                            <Printer className="w-3 h-3 text-indigo-400" />
                            <span>Cetak</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onPromptQuickResetOsimPassword(u)}
                            className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1 transition"
                            title="Ganti Password"
                          >
                            <Key className="w-3 h-3" />
                            <span>Password</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenEditOsimAccount(u)}
                            className="p-1.5 rounded bg-zinc-800 text-zinc-300 hover:text-white transition"
                            title="Edit Akun & Wewenang"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onPromptDeleteOsimAccount(u)}
                            className="p-1.5 rounded bg-zinc-800 text-rose-400 hover:text-rose-300 transition"
                            title="Hapus Akun"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
