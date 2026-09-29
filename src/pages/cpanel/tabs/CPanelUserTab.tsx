import React from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Key,
  ShieldCheck,
  Crown,
  Shield,
  HeartHandshake,
  Compass,
  Users,
  LayoutGrid,
  List,
  Search,
  X,
  Filter,
  Printer,
  RotateCcw,
  Wallet,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  LogIn,
  Copy,
  Tent
} from 'lucide-react';
import { Teacher, UserProfile, Extracurricular } from '../../../types';

export interface CPanelUserTabProps {
  unregisteredTeachers: Teacher[];
  handleSyncFromTeachers: () => void;
  isSyncingAll: boolean;
  unregisteredOsimCount: number;
  handleSyncFromOsim: () => void;
  isSyncingOsim: boolean;
  currentUser: UserProfile | null;
  adminUsers: UserProfile[];
  wakaUsers: UserProfile[];
  bkUsers: UserProfile[];
  pembinaOsimUsers: UserProfile[];
  pembinaEkskulUsers: UserProfile[];
  osimPengurusUsers: UserProfile[];
  selectedBkUserId: string;
  setSelectedBkUserId: (id: string) => void;
  selectedPembinaUserId: string;
  setSelectedPembinaUserId: (id: string) => void;
  selectedOsimUserId: string;
  setSelectedOsimUserId: (id: string) => void;
  loginWithUser: (user: UserProfile) => void;
  loginWithDemoRole: (role: any) => void;
  getPembinaEkskulName: (user: UserProfile) => string;
  getOsimPositionName: (user: UserProfile) => string;
  rolePillFilter: string;
  setRolePillFilter: (role: string) => void;
  roleCounts: Record<string, number>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  roleFilter: string;
  setRoleFilter: (filter: string) => void;
  userViewMode: 'grid' | 'table' | 'cards' | string;
  setUserViewMode: (mode: any) => void;
  allUsers: UserProfile[];
  filteredUsers: UserProfile[];
  handleOpenPrintModal: (user: UserProfile | 'all') => void;
  getRoleBadge: (user: any) => { label: string; color: string; border?: string; bg?: string; number?: number };
  showPasswordMap: Record<string, boolean>;
  togglePasswordVisibility: (uid: string) => void;
  getTeacherInitials: (name: string) => string;
  getInitialsColorTheme: (role: string) => { bgGradient: string; borderColor: string; textColor: string };
  handleOpenEditModal: (user: UserProfile) => void;
  handleOpenDetailModal: (user: UserProfile) => void;
  handleCopyCredentials: (user: UserProfile) => void;
  handlePrintAccountSlip: (user: UserProfile) => void;
  handlePromptResetPassword: (user: UserProfile) => void;
  handleToggleCashManager: (user: UserProfile) => void;
  handlePromptDeleteUser: (user: UserProfile) => void;
  extracurriculars: Extracurricular[];
  getEkskulTheme: (id: string, category?: string) => any;
}

export const CPanelUserTab: React.FC<CPanelUserTabProps> = ({
  unregisteredTeachers,
  handleSyncFromTeachers,
  isSyncingAll,
  unregisteredOsimCount,
  handleSyncFromOsim,
  isSyncingOsim,
  currentUser,
  adminUsers,
  wakaUsers,
  bkUsers,
  pembinaOsimUsers,
  pembinaEkskulUsers,
  osimPengurusUsers,
  selectedBkUserId,
  setSelectedBkUserId,
  selectedPembinaUserId,
  setSelectedPembinaUserId,
  selectedOsimUserId,
  setSelectedOsimUserId,
  loginWithUser,
  loginWithDemoRole,
  getPembinaEkskulName,
  getOsimPositionName,
  rolePillFilter,
  setRolePillFilter,
  roleCounts,
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  userViewMode,
  setUserViewMode,
  allUsers,
  filteredUsers,
  handleOpenPrintModal,
  getRoleBadge,
  showPasswordMap,
  togglePasswordVisibility,
  getTeacherInitials,
  getInitialsColorTheme,
  handleOpenEditModal,
  handleOpenDetailModal,
  handleCopyCredentials,
  handlePrintAccountSlip,
  handlePromptResetPassword,
  handleToggleCashManager,
  handlePromptDeleteUser,
  extracurriculars,
  getEkskulTheme,
}) => {
  return (
    <div className="space-y-4" id="view-cpanel-users">
      {/* Unsynced Teachers Alert Banner */}
      {unregisteredTeachers.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-300">
                Terdapat {unregisteredTeachers.length} Data Guru & Pembina Belum Memiliki Akun cPanel
              </h4>
              <p className="text-[11px] text-zinc-200 mt-0.5">
                Data guru baru dari menu Dewan Guru atau hasil Import Excel belum disinkronkan ke daftar akun login cPanel. Klik tombol di samping untuk membuat akun otomatis.
              </p>
            </div>
          </div>
          <button
            onClick={handleSyncFromTeachers}
            disabled={isSyncingAll}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center space-x-2 transition-colors shrink-0 shadow-lg shadow-amber-950/40 disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
            <span>Sinkronkan Sekarang ({unregisteredTeachers.length} Akun)</span>
          </button>
        </div>
      )}

      {/* Unsynced OSIM Accounts Alert Banner */}
      {unregisteredOsimCount > 0 && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-indigo-300">
                Sinkronisasi Data Akun Pengurus & 8 Sekbid OSIM ({unregisteredOsimCount} Bidang Perlu Sinkron)
              </h4>
              <p className="text-[11px] text-zinc-200 mt-0.5">
                Sinkronkan data pengurus dan seksi bidang OSIM agar masing-masing memiliki password login resmi unik per bidang (contoh: sekbid12026, ketua2026).
              </p>
            </div>
          </div>
          <button
            onClick={handleSyncFromOsim}
            disabled={isSyncingOsim}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-2 transition-colors shrink-0 shadow-lg shadow-indigo-950/40 disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingOsim ? 'animate-spin' : ''}`} />
            <span>Sinkronkan Akun OSIM</span>
          </button>
        </div>
      )}

      {/* FITUR PENGUJIAN PERAN CEPAT (KHUSUS ADMIN) */}
      <div className="bg-[#151518] border-2 border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272a] pb-3.5">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Fitur Pengujian Peran Cepat (Simulasi Tampilan Hak Akses)
                </h3>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  KHUSUS ADMIN
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-300 mt-0.5">
                Akses uji coba antarmuka dan wewenang untuk setiap peran. Karena terdapat lebih dari 1 Guru BK, Pembina Ekstra, dan Pengurus Sekbid OSIM, pilih akun spesifik yang ingin disimulasikan di bawah.
              </p>
            </div>
          </div>
        </div>

        {/* Grid 5 Kartu Utama */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {/* Card 1: Admin & Waka */}
          <div className="p-3.5 rounded-xl bg-[#1c1c20] border border-[#2e2e34] flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                    <Crown className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">Administrator & Waka</span>
                </div>
                {currentUser?.role === 'super_admin' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                    Aktif
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                Pengelola madrasah, kesiswaan & cPanel kontrol pusat.
              </p>
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  if (adminUsers[0]) loginWithUser(adminUsers[0]);
                }}
                className="w-full py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>Mode Administrator</span>
              </button>
              {wakaUsers.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (wakaUsers[0]) loginWithUser(wakaUsers[0]);
                  }}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-blue-900/40 hover:bg-blue-900/60 border border-blue-700/40 text-blue-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span>Mode Waka Kesiswaan</span>
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Guru BK (Dengan Pilihan Guru BK) */}
          <div className="p-3.5 rounded-xl bg-[#1c1c20] border border-purple-500/30 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">Guru BK ({bkUsers.length} Guru)</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono font-bold">
                  {bkUsers.length} Akun
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                Akses konseling, rekap pelanggaran & pembinaan siswa.
              </p>
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-purple-300 flex items-center justify-between">
                  <span>Pilih Konselor BK:</span>
                </label>
                <select
                  value={selectedBkUserId || (bkUsers[0]?.uid || '')}
                  onChange={e => setSelectedBkUserId(e.target.value)}
                  disabled={bkUsers.length === 0}
                  className="w-full text-xs p-1.5 rounded-lg bg-[#151518] border border-purple-500/40 text-purple-100 focus:outline-none focus:border-purple-400 font-medium disabled:opacity-50"
                >
                  {bkUsers.length === 0 ? (
                    <option value="">Belum ada akun Guru BK</option>
                  ) : (
                    bkUsers.map((u, idx) => (
                      <option key={u.uid ? `cpanel-bk-${u.uid}-${idx}` : `cpanel-bk-idx-${idx}`} value={u.uid}>
                        {u.displayName} {u.counselorSpecialization ? `(${u.counselorSpecialization})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  const target = bkUsers.find(u => u.uid === (selectedBkUserId || bkUsers[0]?.uid)) || bkUsers[0];
                  if (target) {
                    loginWithUser(target);
                  } else {
                    loginWithDemoRole('guru_bk');
                  }
                }}
                className="w-full py-1.5 px-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm shadow-purple-900/30"
              >
                <HeartHandshake className="w-3.5 h-3.5 text-purple-200" />
                <span>Uji Tampilan Sebagai Guru BK</span>
              </button>
            </div>
          </div>

          {/* Card 3: Pembina OSIM */}
          <div className="p-3.5 rounded-xl bg-[#1c1c20] border border-amber-500/30 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">Pembina OSIM</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold">
                  {pembinaOsimUsers.length} Akun
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                Supervisi kegiatan intra, pengesahan proker OSIM & buku kas.
              </p>
            </div>

            <div className="space-y-2">
              <div className="p-2 rounded-lg bg-[#151518] border border-amber-500/30 text-[11px] text-zinc-300">
                <span className="text-zinc-400 text-[10px] block">Akun Pembina Terdaftar:</span>
                <strong className="text-amber-300 truncate block">
                  {pembinaOsimUsers[0]?.displayName || 'Pembina OSIM Utama'}
                </strong>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (pembinaOsimUsers[0]) {
                    loginWithUser(pembinaOsimUsers[0]);
                  } else {
                    loginWithDemoRole('pembina_osim');
                  }
                }}
                className="w-full py-1.5 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm shadow-amber-900/30"
              >
                <Users className="w-3.5 h-3.5 text-amber-200" />
                <span>Uji Tampilan Pembina OSIM</span>
              </button>
            </div>
          </div>

          {/* Card 4: Guru Pembina Ekstrakurikuler (Dengan Pilihan Pembina) */}
          <div className="p-3.5 rounded-xl bg-[#1c1c20] border border-emerald-500/30 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Compass className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">Pembina Ekstra ({pembinaEkskulUsers.length} Pembina)</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                  {pembinaEkskulUsers.length} Akun
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                Kelola absensi ekskul, anggota binaan, jurnal latihan & nilai semester.
              </p>
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-emerald-300 flex items-center justify-between">
                  <span>Pilih Guru Pembina Ekstra:</span>
                </label>
                <select
                  value={selectedPembinaUserId || (pembinaEkskulUsers[0]?.uid || '')}
                  onChange={e => setSelectedPembinaUserId(e.target.value)}
                  disabled={pembinaEkskulUsers.length === 0}
                  className="w-full text-xs p-1.5 rounded-lg bg-[#151518] border border-emerald-500/40 text-emerald-100 focus:outline-none focus:border-emerald-400 font-medium disabled:opacity-50"
                >
                  {pembinaEkskulUsers.length === 0 ? (
                    <option value="">Belum ada akun pembina ekstra</option>
                  ) : (
                    pembinaEkskulUsers.map((u, idx) => (
                      <option key={u.uid ? `cpanel-pembina-${u.uid}-${idx}` : `cpanel-pembina-idx-${idx}`} value={u.uid}>
                        {u.displayName} ({getPembinaEkskulName(u)})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  const target = pembinaEkskulUsers.find(u => u.uid === (selectedPembinaUserId || pembinaEkskulUsers[0]?.uid)) || pembinaEkskulUsers[0];
                  if (target) {
                    loginWithUser(target);
                  } else {
                    loginWithDemoRole('pembina_ekskul');
                  }
                }}
                className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm shadow-emerald-900/30"
              >
                <Compass className="w-3.5 h-3.5 text-emerald-200" />
                <span>Uji Tampilan Sebagai Pembina</span>
              </button>
            </div>
          </div>

          {/* Card 5: Pengurus & Sekbid OSIM (Simulasi Akses Sekbid / BPH) */}
          <div className="p-3.5 rounded-xl bg-[#1c1c20] border border-indigo-500/30 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">Pengurus & Sekbid OSIM</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-bold">
                  {osimPengurusUsers.length} Akun
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                Akses fungsional ketua umum, bendahara (buku kas), dan 8 seksi bidang OSIM.
              </p>
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-indigo-300 flex items-center justify-between">
                  <span>Pilih Jabatan / Sekbid:</span>
                </label>
                <select
                  value={selectedOsimUserId || (osimPengurusUsers[0]?.uid || '')}
                  onChange={e => setSelectedOsimUserId(e.target.value)}
                  disabled={osimPengurusUsers.length === 0}
                  className="w-full text-xs p-1.5 rounded-lg bg-[#151518] border border-indigo-500/40 text-indigo-100 focus:outline-none focus:border-indigo-400 font-medium disabled:opacity-50"
                >
                  {osimPengurusUsers.length === 0 ? (
                    <option value="">Belum ada akun pengurus OSIM</option>
                  ) : (
                    osimPengurusUsers.map((u, idx) => (
                      <option key={u.uid ? `cpanel-osim-${u.uid}-${idx}` : `cpanel-osim-idx-${idx}`} value={u.uid}>
                        {u.displayName} ({getOsimPositionName(u)})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  const target = osimPengurusUsers.find(u => u.uid === (selectedOsimUserId || osimPengurusUsers[0]?.uid)) || osimPengurusUsers[0];
                  if (target) {
                    loginWithUser(target);
                  } else {
                    loginWithDemoRole('pengurus_osim');
                  }
                }}
                className="w-full py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm shadow-indigo-900/30"
              >
                <Key className="w-3.5 h-3.5 text-indigo-200" />
                <span>Uji Tampilan Akun Terpilih</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Role Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setRolePillFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            rolePillFilter === 'all'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/40'
              : 'bg-[#18181b] hover:bg-[#222226] text-zinc-300 border border-[#27272a]'
          }`}
        >
          <span>Semua Akun (1-7)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${rolePillFilter === 'all' ? 'bg-emerald-800 text-emerald-100' : 'bg-zinc-800 text-zinc-300'}`}>
            {roleCounts.all}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setRolePillFilter('super_admin')}
          className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            rolePillFilter === 'super_admin'
              ? 'bg-red-600 text-white shadow-sm shadow-red-900/40'
              : 'bg-[#18181b] hover:bg-[#222226] text-red-300 border border-red-500/20'
          }`}
        >
          <span>1. Admin</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${rolePillFilter === 'super_admin' ? 'bg-red-800 text-red-100' : 'bg-red-950/60 text-red-300'}`}>
            {roleCounts.super_admin}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setRolePillFilter('waka_kesiswaan')}
          className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            rolePillFilter === 'waka_kesiswaan'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/40'
              : 'bg-[#18181b] hover:bg-[#222226] text-blue-300 border border-blue-500/20'
          }`}
        >
          <span>2. Waka Kesiswaan</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${rolePillFilter === 'waka_kesiswaan' ? 'bg-blue-800 text-blue-100' : 'bg-blue-950/60 text-blue-300'}`}>
            {roleCounts.waka_kesiswaan}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setRolePillFilter('guru_bk')}
          className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            rolePillFilter === 'guru_bk'
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-900/40'
              : 'bg-[#18181b] hover:bg-[#222226] text-purple-300 border border-purple-500/20'
          }`}
        >
          <span>3. Guru BK</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${rolePillFilter === 'guru_bk' ? 'bg-purple-800 text-purple-100' : 'bg-purple-950/60 text-purple-300'}`}>
            {roleCounts.guru_bk}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setRolePillFilter('pembina_osim')}
          className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            rolePillFilter === 'pembina_osim'
              ? 'bg-amber-600 text-white shadow-sm shadow-amber-900/40'
              : 'bg-[#18181b] hover:bg-[#222226] text-amber-300 border border-amber-500/20'
          }`}
        >
          <span>4. Pembina OSIM</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${rolePillFilter === 'pembina_osim' ? 'bg-amber-800 text-amber-100' : 'bg-amber-950/60 text-amber-300'}`}>
            {roleCounts.pembina_osim}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setRolePillFilter('pembina_ekskul')}
          className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            rolePillFilter === 'pembina_ekskul'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/40'
              : 'bg-[#18181b] hover:bg-[#222226] text-emerald-300 border border-emerald-500/20'
          }`}
        >
          <span>5. Pembina Ekskul</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${rolePillFilter === 'pembina_ekskul' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-950/60 text-emerald-300'}`}>
            {roleCounts.pembina_ekskul}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setRolePillFilter('bph_osim')}
          className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            rolePillFilter === 'bph_osim'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/40'
              : 'bg-[#18181b] hover:bg-[#222226] text-indigo-300 border border-indigo-500/20'
          }`}
        >
          <span>6. Anggota BPH OSIM</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${rolePillFilter === 'bph_osim' ? 'bg-indigo-800 text-indigo-100' : 'bg-indigo-950/60 text-indigo-300'}`}>
            {roleCounts.bph_osim}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setRolePillFilter('sekbid_osim')}
          className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            rolePillFilter === 'sekbid_osim'
              ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-900/40'
              : 'bg-[#18181b] hover:bg-[#222226] text-cyan-300 border border-cyan-500/20'
          }`}
        >
          <span>7. Sekbid 1-8</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${rolePillFilter === 'sekbid_osim' ? 'bg-cyan-800 text-cyan-100' : 'bg-cyan-950/60 text-cyan-300'}`}>
            {roleCounts.sekbid_osim}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setRolePillFilter('cash_manager')}
          className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            rolePillFilter === 'cash_manager'
              ? 'bg-amber-500 text-black shadow-sm'
              : 'bg-[#18181b] hover:bg-[#222226] text-amber-300 border border-amber-500/30'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Pengelola Kas (★)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${rolePillFilter === 'cash_manager' ? 'bg-black text-amber-400 font-bold' : 'bg-amber-950/60 text-amber-300'}`}>
            {roleCounts.cash_manager}
          </span>
        </button>
      </div>

      {/* Filter & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#151518] p-3 rounded-xl border border-[#27272a]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama, email, NIP/NIS, jabatan BPH/Sekbid..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-[#1c1c20] border border-[#323238] text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-200"
              title="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-zinc-300" />
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#1c1c20] border border-[#323238] text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="all">Semua Peran Terurut 1 s/d 7 ({allUsers.length})</option>
              <option value="super_admin">1. Super Admin / Proktor</option>
              <option value="waka_kesiswaan">2. Waka Kesiswaan</option>
              <option value="guru_bk">3. Guru Bimbingan Konseling (BK)</option>
              <option value="pembina_osim">4. Pembina OSIM</option>
              <option value="pembina_ekskul">5. Pembina / Coach Ekstrakurikuler</option>
              <option value="pengurus_osim">6-7. Pengurus OSIM (BPH & Sekbid)</option>
            </select>
          </div>

          {/* View Mode Toggle: Grid (Cards) vs Table (Matrix) */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#1c1c20] border border-[#323238]">
            <button
              type="button"
              onClick={() => setUserViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                userViewMode === 'grid'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Tampilan Grid Kartu (Sesuai OSIM & Pembina Ekstra)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setUserViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                userViewMode === 'table'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Tampilan Tabel Matriks"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Tabel</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleOpenPrintModal('all')}
            className="px-2.5 py-1.5 rounded-lg bg-[#222226] hover:bg-[#2b2b30] border border-[#37373f] text-xs font-semibold text-zinc-100 flex items-center space-x-1.5 transition-colors"
            title="Cetak kartu slip akun login"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Cetak Slip</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="bg-[#151518] border border-[#27272a] rounded-xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Tidak ada akun pengguna yang cocok</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Coba sesuaikan kata kunci pencarian atau ubah filter peran di atas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('all');
              setRolePillFilter('all');
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-600/30 transition-colors inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        </div>
      )}

      {/* CARD GRID VIEW */}
      {userViewMode === 'grid' && filteredUsers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredUsers.map((u, idx) => {
            const badge = getRoleBadge(u);
            const isRevealed = showPasswordMap[u.uid];
            const teacherInitials = getTeacherInitials(u.displayName);
            const theme = getInitialsColorTheme(u.role);

            return (
              <div
                key={u.uid ? `grid-user-${u.uid}-${idx}` : `grid-user-idx-${idx}`}
                className="bg-[#151518] border border-[#27272a] hover:border-emerald-500/40 rounded-xl p-4 transition-all shadow hover:shadow-lg flex flex-col justify-between space-y-3"
              >
                {/* Card Top: Identity & Role */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center space-x-3 min-w-0">
                      {u.photoURL ? (
                        <img
                          src={u.photoURL}
                          alt={u.displayName}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-xl object-cover border border-emerald-500/40 shrink-0"
                        />
                      ) : (
                        <div
                          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${theme.bgGradient} text-white flex flex-col items-center justify-center font-black text-xs font-mono shrink-0 border ${theme.borderColor} shadow-xs`}
                          title={`Inisial: ${teacherInitials}`}
                        >
                          <span>{teacherInitials}</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs font-bold text-white truncate" title={u.displayName}>
                          {u.displayName}
                        </h3>
                        <p className="text-[11px] text-zinc-300 font-mono truncate" title={u.email}>
                          {u.email}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-zinc-400 font-mono">
                            NIP: <strong className="text-zinc-200">{u.nip || '-'}</strong>
                          </span>
                          {u.phone && (
                            <span className="text-[10px] text-emerald-400 font-mono">
                              • {u.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                      u.status === 'Nonaktif' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {u.status || 'Aktif'}
                    </span>
                  </div>

                  {/* Role & Cash Manager Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className={`inline-block text-[9px] font-mono font-extrabold px-2 py-0.5 rounded border ${badge.color}`}>
                      {badge.label}
                    </span>

                    {u.isCashManager && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold flex items-center gap-1">
                        <Wallet className="w-2.5 h-2.5 text-amber-400" />
                        <span>★ {u.cashManagerTitle || 'Pengelola Kas'}</span>
                      </span>
                    )}
                  </div>

                  {/* Assigned Tasks / Binaan */}
                  {(u.counselorSpecialization || (u.extracurricularIds && u.extracurricularIds.length > 0)) && (
                    <div className="bg-[#1a1a1f] p-2 rounded-lg border border-[#27272a] space-y-1">
                      {u.counselorSpecialization && (
                        <div className="text-[10px] text-purple-300 font-medium flex items-center gap-1">
                          <Compass className="w-3 h-3 text-purple-400 shrink-0" />
                          <span className="truncate">BK: {u.counselorSpecialization}</span>
                        </div>
                      )}
                      {u.extracurricularIds && u.extracurricularIds.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center">
                          <Tent className="w-3 h-3 text-emerald-400 shrink-0 mr-0.5" />
                          {u.extracurricularIds.map((eid, eIdx) => {
                            const ek = extracurriculars.find(e => e.id === eid);
                            const ekTheme = getEkskulTheme(eid, ek?.category);
                            return (
                              <span
                                key={`grid-ek-${eid}-${eIdx}`}
                                className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${ekTheme.bgLight} ${ekTheme.textLight} ${ekTheme.borderLight}`}
                              >
                                {ek ? ek.name : eid.replace(/ekskul_/g, '').toUpperCase()}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Credentials Preview Box */}
                  <div className="bg-[#121215] p-2 rounded-lg border border-[#222226] text-[11px] font-mono flex items-center justify-between">
                    <div className="truncate pr-2">
                      <span className="text-zinc-500 text-[10px]">USER:</span>{' '}
                      <span className="text-zinc-200 font-bold">@{u.username || u.email.split('@')[0]}</span>
                      <span className="mx-1 text-zinc-600">|</span>
                      <span className="text-zinc-500 text-[10px]">PASS:</span>{' '}
                      <span className="text-emerald-400 font-bold">
                        {isRevealed ? u.password || 'password' : '••••••••'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(u.uid)}
                        className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800"
                        title={isRevealed ? 'Sembunyikan password' : 'Lihat password'}
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyCredentials(u)}
                        className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800"
                        title="Salin username & password"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Action Toolbar */}
                <div className="pt-2 border-t border-[#222226] flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => loginWithUser(u)}
                      title={`Uji Tampilan Sebagai ${u.displayName}`}
                      className="px-2 py-1 rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <LogIn className="w-3 h-3" />
                      <span>Uji</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDetailModal(u)}
                      title="Detail Akun"
                      className="p-1 rounded-md bg-[#222226] hover:bg-[#2b2b30] text-zinc-300 hover:text-white transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintAccountSlip(u)}
                      title="Cetak Slip Login"
                      className="p-1 rounded-md bg-[#222226] hover:bg-[#2b2b30] text-zinc-300 hover:text-white transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handlePromptResetPassword(u)}
                      title="Ganti / Reset Password"
                      className="p-1 rounded-md bg-[#222226] hover:bg-[#2b2b30] text-zinc-300 hover:text-white transition-colors"
                    >
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(u)}
                      title="Edit Akun"
                      className="p-1 rounded-md bg-[#222226] hover:bg-[#2b2b30] text-zinc-300 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                    {u.uid !== 'user_super_admin' && (
                      <button
                        type="button"
                        onClick={() => handlePromptDeleteUser(u)}
                        title="Hapus Akun"
                        className="p-1 rounded-md bg-[#222226] hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW (MATRIX) */}
      {userViewMode === 'table' && filteredUsers.length > 0 && (
        <div className="bg-[#151518] border border-[#27272a] rounded-xl overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#1a1a1e] text-zinc-300 font-mono text-[10px] uppercase">
                  <th className="py-3 px-4 font-bold">Pengguna & Identitas</th>
                  <th className="py-3 px-4 font-bold">Peran / Hak Akses</th>
                  <th className="py-3 px-4 font-bold">Kredensial Login (NIP / Password)</th>
                  <th className="py-3 px-4 font-bold">Status & Tugas Binaan</th>
                  <th className="py-3 px-4 font-bold text-right">Tindakan cPanel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {filteredUsers.map((u, idx) => {
                  const badge = getRoleBadge(u);
                  const isRevealed = showPasswordMap[u.uid];
                  const teacherInitials = getTeacherInitials(u.displayName);
                  const theme = getInitialsColorTheme(u.role);

                  return (
                    <tr
                      key={u.uid ? `table-user-${u.uid}-${idx}` : `table-user-idx-${idx}`}
                      className="hover:bg-[#1a1a1f] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          {u.photoURL ? (
                            <img
                              src={u.photoURL}
                              alt={u.displayName}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-xl object-cover border border-[#323238] shrink-0"
                            />
                          ) : (
                            <div
                              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${theme.bgGradient} text-white flex items-center justify-center font-black text-xs font-mono shrink-0 border ${theme.borderColor}`}
                              title={`Inisial: ${teacherInitials}`}
                            >
                              <span>{teacherInitials}</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs truncate" title={u.displayName}>
                              {u.displayName}
                            </div>
                            <div className="text-[11px] text-zinc-300 font-mono truncate" title={u.email}>
                              {u.email}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                              @{u.username || u.email.split('@')[0]}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${badge.color}`}>
                            {badge.label}
                          </span>
                          {u.isCashManager && (
                            <div className="text-[10px] text-amber-300 font-bold flex items-center gap-1">
                              <Wallet className="w-2.5 h-2.5 text-amber-400" />
                              <span>★ {u.cashManagerTitle || 'Pengelola Kas'}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="text-zinc-200">
                          NIP: <span className="font-bold text-white">{u.nip || '-'}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span className="text-zinc-300 font-medium">Pass:</span>
                          <span className="font-bold text-emerald-400">
                            {isRevealed ? u.password || 'password' : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(u.uid)}
                            className="text-zinc-400 hover:text-white p-0.5"
                            title={isRevealed ? 'Sembunyikan' : 'Lihat password'}
                          >
                            {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[11px]">
                        <div className="flex items-center space-x-1.5 mb-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Nonaktif' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                          <span className={u.status === 'Nonaktif' ? 'text-red-400 font-bold' : 'text-zinc-200 font-medium'}>
                            {u.status || 'Aktif'}
                          </span>
                        </div>
                        {u.counselorSpecialization && (
                          <span className="text-[10px] text-purple-300 font-medium block line-clamp-1">
                            BK: {u.counselorSpecialization}
                          </span>
                        )}
                        {u.extracurricularIds && u.extracurricularIds.length > 0 && (
                          <span className="text-[10px] text-emerald-300 font-medium block line-clamp-1">
                            Ekskul: {u.extracurricularIds.join(', ').replace(/ekskul_/g, '').toUpperCase()}
                          </span>
                        )}
                        <div className="mt-1">
                          {u.isCashManager ? (
                            <button
                              type="button"
                              onClick={() => handleToggleCashManager(u)}
                              title="Klik untuk mencabut hak pengelola kas dari akun ini"
                              className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 transition-all"
                            >
                              <Wallet className="w-2.5 h-2.5 text-amber-400" />
                              <span>★ {u.cashManagerTitle || 'Pengelola Kas'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleCashManager(u)}
                              title="Pilih akun ini sebagai Pengelola Uang Kas (Menu Neraca Kas & Keuangan otomatis muncul)"
                              className="px-1.5 py-0.5 rounded bg-[#1f1f24] hover:bg-[#282830] text-zinc-300 hover:text-amber-300 border border-zinc-700/60 hover:border-amber-500/40 text-[9px] font-medium flex items-center gap-1 transition-all"
                            >
                              <Wallet className="w-2.5 h-2.5 text-zinc-400" />
                              <span>+ Set Kas</span>
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => loginWithUser(u)}
                            title={`Masuk & Uji Tampilan Sebagai ${u.displayName} (${u.role.toUpperCase()})`}
                            className="p-1.5 rounded bg-[#222226] hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDetailModal(u)}
                            title="Lihat Detail Akun"
                            className="p-1.5 rounded bg-[#222226] hover:bg-[#2e2e35] text-zinc-100 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleCopyCredentials(u)}
                            title="Salin Kredensial"
                            className="p-1.5 rounded bg-[#222226] hover:bg-[#2e2e35] text-zinc-100 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePrintAccountSlip(u)}
                            title="Cetak Kartu Login SIM Kesiswaan"
                            className="p-1.5 rounded bg-[#222226] hover:bg-[#2e2e35] text-zinc-100 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-400" />
                          </button>
                          <button
                            onClick={() => handlePromptResetPassword(u)}
                            title="Reset Password ke default"
                            className="p-1.5 rounded bg-[#222226] hover:bg-[#2e2e35] text-zinc-100 transition-colors"
                          >
                            <Key className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            title="Edit Akun"
                            className="p-1.5 rounded bg-[#222226] hover:bg-[#2e2e35] text-zinc-100 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                          </button>
                          {u.uid !== 'user_super_admin' && (
                            <button
                              onClick={() => handlePromptDeleteUser(u)}
                              title="Hapus Akun"
                              className="p-1.5 rounded bg-[#222226] hover:bg-red-500/20 text-zinc-300 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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
