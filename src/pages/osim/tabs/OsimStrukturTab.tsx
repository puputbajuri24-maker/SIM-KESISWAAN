import React from 'react';
import {
  Lock,
  Search,
  RefreshCw,
  Plus,
  Key,
  Eye,
  ShieldCheck,
  Crown,
  Edit2,
  Trash2,
  Layers,
  RotateCcw
} from 'lucide-react';
import { OsimMember, OsimDepartment, OsimWorkProgram, SchoolSetting, Teacher } from '../../../types';
import { isBphMember } from '../../../utils/osimAccountHelper';

export interface OsimStrukturTabProps {
  canCrudMembers: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterSekbid: string;
  setFilterSekbid: (sekbid: string) => void;
  sekbidList: string[];
  canManageCabinetStructure: boolean;
  onReconcileMembers: () => void;
  onOpenAddDept: () => void;
  onOpenAddMember: () => void;
  canManageOsimAccounts: boolean;
  onNavigateToAccountsTab: () => void;
  isOsimMemberAccount: boolean;
  schoolSetting: SchoolSetting | null;
  teachers: Teacher[];
  getTeacherInitials: (name: string) => string;
  osimMembers: OsimMember[];
  onOpenAddBph: (defaultPosition?: string) => void;
  onOpenDetailMember: (member: OsimMember, e?: React.MouseEvent) => void;
  onOpenManageAccountForMember: (member: OsimMember, e: React.MouseEvent) => void;
  onOpenEditMember: (member: OsimMember, e: React.MouseEvent) => void;
  onDeleteMember: (member: OsimMember) => void;
  sortedDepartments: OsimDepartment[];
  filteredMembers: OsimMember[];
  osimPrograms: OsimWorkProgram[];
  onResetDepartments: () => void;
  onOpenAddDeptMember: (deptName: string) => void;
  onOpenEditDept: (dept: OsimDepartment, e: React.MouseEvent) => void;
  onOpenDeleteDept: (dept: OsimDepartment, e: React.MouseEvent) => void;
}

export const OsimStrukturTab: React.FC<OsimStrukturTabProps> = ({
  canCrudMembers,
  searchQuery,
  setSearchQuery,
  filterSekbid,
  setFilterSekbid,
  sekbidList,
  canManageCabinetStructure,
  onReconcileMembers,
  onOpenAddDept,
  onOpenAddMember,
  canManageOsimAccounts,
  onNavigateToAccountsTab,
  isOsimMemberAccount,
  schoolSetting,
  teachers,
  getTeacherInitials,
  osimMembers,
  onOpenAddBph,
  onOpenDetailMember,
  onOpenManageAccountForMember,
  onOpenEditMember,
  onDeleteMember,
  sortedDepartments,
  filteredMembers,
  osimPrograms,
  onResetDepartments,
  onOpenAddDeptMember,
  onOpenEditDept,
  onOpenDeleteDept,
}) => {
  return (
    <div className="space-y-5" id="view-struktur-osim">
      {!canCrudMembers && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 text-amber-200">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-300">
                CRUD Data Anggota Kabinet & Pembina OSIM Terpusat di cPanel
              </p>
              <p className="text-[11px] text-zinc-400">
                Operasi Tambah, Edit, Hapus pengurus kabinet dan akun OSIM dikendalikan secara mutlak terpusat di cPanel Kesiswaan, kecuali Admin membuka izin pada Matriks Hak Akses Peran.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#121214] border border-zinc-800 p-3 rounded">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Cari pengurus OSIM berdasarkan nama, NIS, kelas, atau jabatan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterSekbid}
            onChange={e => setFilterSekbid(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Semua Bidang & BPH</option>
            {sekbidList.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {canManageCabinetStructure && (
            <>
              <button
                onClick={onReconcileMembers}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded text-xs font-semibold transition"
                title="Sinkronkan data pengurus dengan data induk siswa & bersihkan duplikat secara permanen"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Bersihkan Duplikat
              </button>
              <button
                onClick={onOpenAddDept}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded text-xs font-semibold transition"
                title="Tambah Bidang / Sekbid Baru sesuai kebijakan sekolah"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Bidang
              </button>
              <button
                onClick={onOpenAddMember}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Pengurus
              </button>
            </>
          )}

          {canManageCabinetStructure && canManageOsimAccounts && (
            <button
              onClick={onNavigateToAccountsTab}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded text-xs font-semibold transition whitespace-nowrap shadow-xs"
              title="Kelola Akun & Kata Sandi Login Anggota OSIM"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              Kelola Akun & Password
            </button>
          )}
        </div>
      </div>

      {/* Banner Informasi Akses Read-Only untuk Akun Anggota OSIM */}
      {isOsimMemberAccount && (
        <div className="bg-[#121214] border border-sky-500/30 rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5 text-sky-300">
            <div className="p-2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sky-200">Hak Akses Anggota OSIM: Lihat Struktur Kabinet (Read-Only)</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Seluruh akun anggota OSIM hanya memiliki hak akses melihat profil, kontak, dan tupoksi struktur kabinet & bidang. Penambahan, pengeditan, atau penghapusan pengurus/bidang merupakan hak prerogatif Pembina OSIM & Waka Kesiswaan.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-sky-500/15 border border-sky-500/30 text-[10px] font-mono font-bold text-sky-300 shrink-0">
            HANYA LIHAT (READ-ONLY)
          </span>
        </div>
      )}

      {/* Dewan Pembina & Penasihat Intrakurikuler (Synced with Dewan Guru & School Settings) */}
      <div className="bg-[#121214] border border-indigo-500/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-indigo-400">
              DEWAN PEMBINA & PENASIHAT INTRAKURIKULER (OSIM)
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            ⚡ Tersinkronisasi Otomatis dari Dewan Guru
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Penanggung Jawab / Kepala Madrasah */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
              PENANGGUNG JAWAB UTAMA
            </span>
            <h4 className="font-bold text-xs text-zinc-100 mt-2">{schoolSetting?.principalName || 'Kepala Madrasah'}</h4>
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">NIP: {schoolSetting?.principalNip || '-'}</p>
            <p className="text-[10px] text-zinc-500 mt-1">Kepala Madrasah Aliyah</p>
          </div>

          {/* Pengarah / Waka Kesiswaan */}
          <div className="bg-zinc-900/90 border border-amber-500/30 rounded-lg p-3">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              SUPERVISI & HAK VETO
            </span>
            <h4 className="font-bold text-xs text-zinc-100 mt-2">{schoolSetting?.wakaKesiswaanName || schoolSetting?.wakaName || 'Waka Kesiswaan'}</h4>
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">NIP: {schoolSetting?.wakaNip || '-'}</p>
            <p className="text-[10px] text-amber-400 mt-1">Waka Bidang Kesiswaan</p>
          </div>

          {/* Pembina Resmi OSIM */}
          <div className="bg-zinc-900/90 border border-indigo-500/30 rounded-lg p-3">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              PEMBINA & BIMBINGAN HARIAN
            </span>
            {(() => {
              const pembinaName = schoolSetting?.pembinaOsim || teachers.find(t => t.role?.toLowerCase().includes('osim'))?.fullName || 'Belum Ditetapkan';
              const initials = getTeacherInitials(pembinaName);

              return (
                <div className="flex items-center gap-2.5 mt-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 border border-indigo-400 text-white font-black font-mono text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs text-zinc-100 truncate">{pembinaName}</h4>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      NIP: {schoolSetting?.pembinaOsimNip || teachers.find(t => t.role?.toLowerCase().includes('osim'))?.nip || '-'}
                    </p>
                  </div>
                </div>
              );
            })()}
            <p className="text-[10px] text-indigo-400 mt-2">Pembina Harian Organisasi Siswa</p>
          </div>

          {/* Admin App (Super Admin) */}
          <div className="bg-zinc-900/90 border border-rose-500/30 rounded-lg p-3">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              ADMIN APP • SUPERVISI & VETO
            </span>
            <div className="flex items-center gap-2.5 mt-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-amber-600 border border-rose-400 text-white font-black font-mono text-xs flex items-center justify-center shrink-0 shadow-xs">
                ADM
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs text-zinc-100 truncate">Administrator Aplikasi</h4>
                <p className="text-[10px] text-zinc-400 font-mono">Super Admin Madrasah</p>
              </div>
            </div>
            <p className="text-[10px] text-rose-400 mt-2">Hak Veto, Intervensi & Audit Sistem</p>
          </div>
        </div>
      </div>

      {/* Badan Pengurus Harian (BPH) Highlight Section */}
      <div className="bg-[#121214] border border-amber-500/30 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-amber-400">
              BADAN PENGURUS HARIAN (BPH OSIM)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-400">Ketua Umum, Wakil, Sekretaris & Bendahara</span>
            {canManageCabinetStructure && (
              <button
                onClick={() => onOpenAddBph()}
                className="px-2.5 py-1 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition"
                title="Tambah Pengurus Badan Pengurus Harian (BPH)"
              >
                <Plus className="w-3 h-3" />
                Tambah BPH
              </button>
            )}
          </div>
        </div>

        {/* Grid 4 Pilar BPH (Persisten - Kolom BPH Tidak Akan Hilang Saat Dirubah atau Dihapus) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { key: 'ketua', title: 'Ketua Umum OSIM', defaultPosition: 'Ketua Umum OSIM' },
            { key: 'wakil', title: 'Wakil Ketua OSIM', defaultPosition: 'Wakil Ketua 1' },
            { key: 'sekretaris', title: 'Sekretaris Umum', defaultPosition: 'Sekretaris Umum' },
            { key: 'bendahara', title: 'Bendahara Umum', defaultPosition: 'Bendahara Umum' }
          ].map(slot => {
            const currentBphMembers = osimMembers.filter(m => isBphMember(m));
            const bph = currentBphMembers.find(m => {
              const pos = (m.position || '').toLowerCase();
              if (slot.key === 'ketua') return pos.includes('ketua') && !pos.includes('wakil') && !pos.includes('sekbid') && !pos.includes('bidang');
              if (slot.key === 'wakil') return pos.includes('wakil');
              if (slot.key === 'sekretaris') return pos.includes('sekretaris');
              if (slot.key === 'bendahara') return pos.includes('bendahara');
              return false;
            });

            if (bph) {
              return (
                <div
                  key={bph.id}
                  onClick={() => onOpenDetailMember(bph)}
                  className="bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 rounded-lg p-3.5 transition flex flex-col justify-between cursor-pointer group shadow-sm"
                >
                  <div>
                    <div className="flex items-start gap-3 mb-2">
                      {bph.photoUrl ? (
                        <img
                          src={bph.photoUrl}
                          alt={bph.fullName}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-full object-cover border border-amber-500/40 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30 shrink-0 text-sm">
                          {bph.fullName.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {bph.position}
                        </span>
                        <h4 className="font-bold text-xs text-zinc-100 group-hover:text-amber-400 mt-1 truncate transition">{bph.fullName}</h4>
                        <p className="text-[10px] text-zinc-400 font-mono">{bph.className} • NIS {bph.studentNis}</p>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 italic mt-2 line-clamp-2 border-t border-zinc-800 pt-2">
                      "{bph.vision || 'Mewujudkan visi madrasah berprestasi'}"
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500 font-mono">📱 {bph.phone}</span>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={e => onOpenDetailMember(bph, e)}
                        className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition"
                        title="Lihat Detail Pengurus"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      {canManageCabinetStructure && (
                        <>
                          {canManageOsimAccounts && (
                            <button
                              onClick={e => onOpenManageAccountForMember(bph, e)}
                              className="p-1 rounded bg-zinc-800 text-amber-400 hover:bg-amber-500/20 transition"
                              title="Kelola Akun & Kata Sandi Siswa"
                            >
                              <Key className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={e => onOpenEditMember(bph, e)}
                            className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-amber-400 transition"
                            title="Edit Pengurus"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onDeleteMember(bph);
                            }}
                            className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-rose-400 transition"
                            title="Hapus Pengurus"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // Slot BPH Kosong: Menjaga kolom BPH tetap muncul dan stabil di UI
            return (
              <div
                key={`empty-slot-${slot.key}`}
                className="bg-zinc-950/60 border border-dashed border-zinc-800 hover:border-amber-500/50 rounded-lg p-3.5 transition flex flex-col justify-between min-h-[165px] group shadow-inner"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
                      {slot.title}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-amber-400/90 bg-amber-500/10 border border-amber-500/20">
                      Belum Terisi
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-9 h-9 rounded-full bg-zinc-900 border border-dashed border-zinc-700 flex items-center justify-center text-zinc-500 group-hover:text-amber-400 group-hover:border-amber-500/40 transition shrink-0">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-300 group-hover:text-amber-300 transition">
                        {slot.title}
                      </h4>
                      <p className="text-[10px] text-zinc-500">Jabatan Inti BPH</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2 line-clamp-2 border-t border-zinc-900 pt-1.5 leading-relaxed">
                    Posisi ini kosong setelah dihapus atau belum ditetapkan. Tetapkan pengurus baru sekarang.
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800/60">
                  {canManageCabinetStructure ? (
                    <button
                      type="button"
                      onClick={() => onOpenAddBph(slot.defaultPosition)}
                      className="w-full py-1.5 px-2 rounded bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-zinc-950 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Tetapkan Pejabat</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-zinc-500 italic block text-center">
                      Belum ditetapkan Pembina
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Pengurus BPH Tambahan (Misal: Wakil Ketua 2, Wakil Sekretaris, Wakil Bendahara) */}
          {osimMembers
            .filter(m => isBphMember(m))
            .filter(m => {
              const pos = (m.position || '').toLowerCase();
              const isCoreKetua = pos.includes('ketua') && !pos.includes('wakil') && !pos.includes('sekbid') && !pos.includes('bidang');
              const isCoreWakil1 = pos === 'wakil ketua 1' || pos === 'wakil ketua umum' || (pos.includes('wakil') && !pos.includes('2'));
              const isCoreSekretaris = pos === 'sekretaris umum' || (pos.includes('sekretaris') && !pos.includes('wakil'));
              const isCoreBendahara = pos === 'bendahara umum' || (pos.includes('bendahara') && !pos.includes('wakil'));
              return !isCoreKetua && !isCoreWakil1 && !isCoreSekretaris && !isCoreBendahara;
            })
            .map(bph => (
              <div
                key={bph.id}
                onClick={() => onOpenDetailMember(bph)}
                className="bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 rounded-lg p-3.5 transition flex flex-col justify-between cursor-pointer group shadow-sm"
              >
                <div>
                  <div className="flex items-start gap-3 mb-2">
                    {bph.photoUrl ? (
                      <img
                        src={bph.photoUrl}
                        alt={bph.fullName}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover border border-amber-500/40 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30 shrink-0 text-sm">
                        {bph.fullName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {bph.position}
                      </span>
                      <h4 className="font-bold text-xs text-zinc-100 group-hover:text-amber-400 mt-1 truncate transition">{bph.fullName}</h4>
                      <p className="text-[10px] text-zinc-400 font-mono">{bph.className} • NIS {bph.studentNis}</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 italic mt-2 line-clamp-2 border-t border-zinc-800 pt-2">
                    "{bph.vision || 'Mewujudkan visi madrasah berprestasi'}"
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-zinc-500 font-mono">📱 {bph.phone}</span>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={e => onOpenDetailMember(bph, e)}
                      className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition"
                      title="Lihat Detail Pengurus"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    {canManageCabinetStructure && (
                      <>
                        {canManageOsimAccounts && (
                          <button
                            onClick={e => onOpenManageAccountForMember(bph, e)}
                            className="p-1 rounded bg-zinc-800 text-amber-400 hover:bg-amber-500/20 transition"
                            title="Kelola Akun & Kata Sandi Siswa"
                          >
                            <Key className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={e => onOpenEditMember(bph, e)}
                          className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-amber-400 transition"
                          title="Edit Pengurus"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onDeleteMember(bph);
                          }}
                          className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-rose-400 transition"
                          title="Hapus Pengurus"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Dynamic Cabinet Structure & Fields / Divisions Management */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-mono font-bold uppercase text-zinc-200 tracking-wider">
                STRUKTUR BIDANG & DEWAN SEKSI BIDANG ({sortedDepartments.filter(d => d.code !== 'BPH' && !d.name.startsWith('BPH')).length} Bidang Terdaftar)
              </h3>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Struktur bidang dapat disesuaikan, ditambah, diubah, atau dihapus secara dinamis oleh Pembina OSIM sesuai kebijakan sekolah.
            </p>
          </div>

          {canManageCabinetStructure && (
            <div className="flex items-center gap-2">
              <button
                onClick={onResetDepartments}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-mono transition"
                title="Kembalikan struktur bidang ke standar (8 Sekbid)"
              >
                <RotateCcw className="w-3 h-3" />
                Reset 8 Sekbid
              </button>
              <button
                onClick={onOpenAddDept}
                className="flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Bidang Baru
              </button>
            </div>
          )}
        </div>

        {/* Department Accordions / Cards (Seksi Bidang) */}
        <div className="space-y-4">
          {sortedDepartments
            .filter(dept => dept.code !== 'BPH' && !dept.name.startsWith('BPH') && (filterSekbid === 'all' || dept.name === filterSekbid))
            .map(dept => {
              const deptMembers = filteredMembers.filter(m => m.sekbid === dept.name);
              const deptPrograms = osimPrograms.filter(p => p.sekbid === dept.name);

              return (
                <div
                  key={dept.id}
                  className="bg-[#121214] border border-zinc-800 rounded-lg overflow-hidden shadow-sm hover:border-zinc-700 transition"
                >
                  {/* Department Header */}
                  <div className="p-3.5 bg-zinc-900/70 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs shrink-0">
                        {dept.code}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-100">{dept.name}</h4>
                        {dept.description && (
                          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{dept.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400 mt-1.5">
                          {dept.coordinatorName && (
                            <span>Koordinator: <strong className="text-zinc-200">{dept.coordinatorName}</strong></span>
                          )}
                          <span>• {deptMembers.length} Pengurus</span>
                          <span>• {deptPrograms.length} Proker</span>
                        </div>
                      </div>
                    </div>

                    {canManageCabinetStructure && (
                      <div className="flex items-center gap-1.5 self-end md:self-center">
                        <button
                          onClick={() => onOpenAddDeptMember(dept.name)}
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 text-xs font-semibold flex items-center gap-1 transition"
                          title="Tambah pengurus ke bidang ini"
                        >
                          <Plus className="w-3 h-3" />
                          Tambah Pengurus
                        </button>
                        <button
                          onClick={(e) => onOpenEditDept(dept, e)}
                          className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-amber-400 transition"
                          title="Edit Nama / Data Bidang"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => onOpenDeleteDept(dept, e)}
                          className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-rose-400 transition"
                          title="Hapus Bidang Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Department Members List */}
                  <div className="p-3.5">
                    {deptMembers.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {deptMembers.map(member => (
                          <div
                            key={member.id}
                            onClick={() => onOpenDetailMember(member)}
                            className="bg-zinc-900/90 border border-zinc-800/90 hover:border-zinc-700 rounded-lg p-3 transition flex flex-col justify-between cursor-pointer group shadow-sm"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                  {member.position}
                                </span>
                                <span className="text-[9px] font-mono text-zinc-500">
                                  NIS {member.studentNis}
                                </span>
                              </div>

                              <h5 className="font-bold text-xs text-zinc-100 group-hover:text-amber-400 transition">
                                {member.fullName}
                              </h5>
                              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                {member.className}
                              </p>

                              {member.flagshipProgram && (
                                <div className="mt-2 bg-zinc-900 border border-zinc-800 rounded p-1.5 text-[10px]">
                                  <span className="text-amber-400 font-semibold block text-[9px]">Program Kerja:</span>
                                  <span className="text-zinc-300 line-clamp-1">{member.flagshipProgram}</span>
                                </div>
                              )}
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                              <span className="text-zinc-500 font-mono">{member.phone}</span>
                              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={e => onOpenDetailMember(member, e)}
                                  className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition"
                                  title="Lihat Detail Pengurus"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                                {canManageCabinetStructure && (
                                  <>
                                    {canManageOsimAccounts && (
                                      <button
                                        onClick={e => onOpenManageAccountForMember(member, e)}
                                        className="p-1 rounded bg-zinc-800 text-amber-400 hover:bg-amber-500/20 transition"
                                        title="Kelola Akun & Kata Sandi Siswa"
                                      >
                                        <Key className="w-3 h-3" />
                                      </button>
                                    )}
                                    <button
                                      onClick={e => onOpenEditMember(member, e)}
                                      className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-amber-400 transition"
                                      title="Edit"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        onDeleteMember(member);
                                      }}
                                      className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-rose-400 transition"
                                      title="Hapus"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed border-zinc-800 rounded-lg">
                        <p className="text-xs text-zinc-500">Belum ada pengurus yang terdaftar di bidang ini.</p>
                        {canManageCabinetStructure && (
                          <button
                            onClick={() => onOpenAddDeptMember(dept.name)}
                            className="mt-2 text-xs text-amber-400 hover:underline font-semibold inline-flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Tambah Pengurus Pertama untuk Bidang Ini
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
