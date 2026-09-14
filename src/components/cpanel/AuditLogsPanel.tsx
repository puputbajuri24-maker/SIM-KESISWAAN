import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Download,
  Printer,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  LogOut,
  Shield,
  ShieldCheck,
  User,
  Key,
  Database,
  Calendar,
  Clock,
  Layers,
  ArrowUpDown,
  FileSpreadsheet,
  FileText,
  Copy,
  Eye,
  X,
  Radio,
  SlidersHorizontal,
  Info,
  Activity
} from 'lucide-react';
import { AuditLogItem } from '../../types';
import { useSchool } from '../../contexts/SchoolContext';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const AuditLogsPanel: React.FC = () => {
  const { auditLogs, clearAuditLogs, refreshAuditLogs, schoolSetting } = useSchool();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;

  // Selected Log for detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Handle Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAuditLogs();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Get unique modules from existing logs
  const availableModules = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach(l => {
      if (l.module) set.add(l.module);
    });
    return Array.from(set).sort();
  }, [auditLogs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // Keyword search
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        log.userName?.toLowerCase().includes(q) ||
        log.userEmail?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        log.module?.toLowerCase().includes(q) ||
        log.details?.toLowerCase().includes(q) ||
        log.timestamp?.toLowerCase().includes(q);

      // Role filter
      const matchRole =
        selectedRole === 'all' ||
        log.userRole?.toLowerCase() === selectedRole.toLowerCase();

      // Module filter
      const matchModule =
        selectedModule === 'all' ||
        log.module?.toLowerCase() === selectedModule.toLowerCase();

      // Action Type filter
      let matchAction = true;
      if (selectedActionType === 'auth') {
        matchAction =
          log.action?.toUpperCase().includes('LOGIN') ||
          log.action?.toUpperCase().includes('LOGOUT') ||
          log.action?.toUpperCase().includes('AUTH');
      } else if (selectedActionType === 'create') {
        matchAction =
          log.action?.toUpperCase().includes('CREATE') ||
          log.action?.toUpperCase().includes('ADD') ||
          log.action?.toUpperCase().includes('TAMBAH');
      } else if (selectedActionType === 'update') {
        matchAction =
          log.action?.toUpperCase().includes('UPDATE') ||
          log.action?.toUpperCase().includes('EDIT') ||
          log.action?.toUpperCase().includes('CHANGE');
      } else if (selectedActionType === 'delete') {
        matchAction =
          log.action?.toUpperCase().includes('DELETE') ||
          log.action?.toUpperCase().includes('REMOVE') ||
          log.action?.toUpperCase().includes('HAPUS') ||
          log.action?.toUpperCase().includes('CLEAR');
      } else if (selectedActionType === 'security') {
        matchAction =
          log.action?.toUpperCase().includes('PASSWORD') ||
          log.action?.toUpperCase().includes('RESET') ||
          log.action?.toUpperCase().includes('BLOCKED');
      }

      return matchSearch && matchRole && matchModule && matchAction;
    }).sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.timestamp > b.timestamp ? 1 : -1;
      }
      return a.timestamp < b.timestamp ? 1 : -1;
    });
  }, [auditLogs, searchTerm, selectedRole, selectedModule, selectedActionType, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = auditLogs.length;
    const authCount = auditLogs.filter(l =>
      l.action?.toUpperCase().includes('LOGIN') ||
      l.action?.toUpperCase().includes('LOGOUT')
    ).length;
    const userManagementCount = auditLogs.filter(l =>
      l.module?.toLowerCase().includes('pengguna') ||
      l.module?.toLowerCase().includes('akun') ||
      l.action?.toUpperCase().includes('USER')
    ).length;
    const operationalCount = auditLogs.filter(l =>
      !l.action?.toUpperCase().includes('LOGIN') &&
      !l.action?.toUpperCase().includes('LOGOUT') &&
      !l.action?.toUpperCase().includes('USER')
    ).length;

    return { total, authCount, userManagementCount, operationalCount };
  }, [auditLogs]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['ID Log', 'Waktu & Tanggal', 'Nama Pengguna', 'Email/NIP', 'Peran Akun', 'Modul Sistem', 'Kode Aksi', 'Detail Aktivitas'];
    const rows = filteredLogs.map(l => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${l.userName || ''}"`,
      `"${l.userEmail || ''}"`,
      `"${l.userRole || ''}"`,
      `"${l.module || ''}"`,
      `"${l.action || ''}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Audit_Logs_SIM_Kesiswaan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON
  const handleExportJSON = () => {
    if (filteredLogs.length === 0) return;
    const jsonStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Audit_Logs_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  // Copy raw log to clipboard
  const handleCopyRaw = (log: AuditLogItem) => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Helper for action badge styling
  const getActionBadge = (action: string) => {
    const act = action?.toUpperCase() || '';
    if (act.includes('LOGIN_SUCCESS') || act.includes('LOGIN')) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <LogIn className="w-3 h-3 text-emerald-400" />
          <span>{action}</span>
        </span>
      );
    }
    if (act.includes('LOGOUT')) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-500/15 text-zinc-300 border border-zinc-500/30">
          <LogOut className="w-3 h-3 text-zinc-400" />
          <span>{action}</span>
        </span>
      );
    }
    if (act.includes('CREATE') || act.includes('ADD') || act.includes('TAMBAH')) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
          <CheckCircle2 className="w-3 h-3 text-blue-400" />
          <span>{action}</span>
        </span>
      );
    }
    if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('CHANGE')) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <SlidersHorizontal className="w-3 h-3 text-amber-400" />
          <span>{action}</span>
        </span>
      );
    }
    if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('CLEAR') || act.includes('HAPUS')) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <Trash2 className="w-3 h-3 text-rose-400" />
          <span>{action}</span>
        </span>
      );
    }
    if (act.includes('FAILED') || act.includes('BLOCKED') || act.includes('WARNING')) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
          <AlertTriangle className="w-3 h-3 text-red-400" />
          <span>{action}</span>
        </span>
      );
    }
    if (act.includes('RESET') || act.includes('PASSWORD')) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
          <Key className="w-3 h-3 text-purple-400" />
          <span>{action}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
        <Activity className="w-3 h-3 text-cyan-400" />
        <span>{action}</span>
      </span>
    );
  };

  // Helper for role badge styling
  const getRoleBadge = (role: string) => {
    const r = role?.toLowerCase() || '';
    if (r.includes('super_admin') || r.includes('admin')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">SUPER ADMIN</span>;
    }
    if (r.includes('waka')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">WAKA KESISWAAN</span>;
    }
    if (r.includes('bk')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">GURU BK</span>;
    }
    if (r.includes('osim') || r.includes('osis')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">PEMBINA OSIM</span>;
    }
    if (r.includes('ekskul') || r.includes('pembina')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">PEMBINA EKSKUL</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-500/20 text-zinc-300 border border-zinc-500/30">{role?.toUpperCase() || 'PENGGUNA'}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Live Indicator */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shadow-inner">
                <History className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-zinc-100">
                    Log Aktivitas & Audit Trail Seluruh Akun
                  </h3>
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Live Audit Active</span>
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Memantau seluruh riwayat login, logout, sesi peran, serta seluruh aktivitas penambahan, pengeditan, dan penghapusan data pada seluruh akun pengguna.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 shadow transition active:scale-95 disabled:opacity-50"
              title="Refresh / Muat Ulang Log"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Muat Ulang</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={filteredLogs.length === 0}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 shadow transition active:scale-95 disabled:opacity-50"
              title="Export Log ke Format CSV / Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportJSON}
              disabled={filteredLogs.length === 0}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 shadow transition active:scale-95 disabled:opacity-50"
              title="Backup JSON Log"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={filteredLogs.length === 0}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 shadow transition active:scale-95 disabled:opacity-50"
              title="Cetak Rekapan Audit Log"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>

            <button
              onClick={() => setIsClearModalOpen(true)}
              disabled={auditLogs.length === 0}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow transition active:scale-95 disabled:opacity-50"
              title="Kosongkan Seluruh Riwayat Log"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Bersihkan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-zinc-100 tracking-tight">{stats.total}</div>
            <div className="text-[11px] font-medium text-zinc-400">Total Rekaman Log</div>
          </div>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-zinc-100 tracking-tight">{stats.authCount}</div>
            <div className="text-[11px] font-medium text-zinc-400">Aktivitas Autentikasi</div>
          </div>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-zinc-100 tracking-tight">{stats.userManagementCount}</div>
            <div className="text-[11px] font-medium text-zinc-400">Manajemen Akun & cPanel</div>
          </div>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-zinc-100 tracking-tight">{stats.operationalCount}</div>
            <div className="text-[11px] font-medium text-zinc-400">Operasional Kesiswaan</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-3 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Keyword Search */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari user, email, aksi, modul, kata kunci..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#121214] border border-[#27272a] rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedRole}
              onChange={e => {
                setSelectedRole(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-[#121214] border border-[#27272a] rounded-xl text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Peran</option>
              <option value="super_admin">Super Admin</option>
              <option value="waka_kesiswaan">Waka Kesiswaan</option>
              <option value="guru_bk">Guru BK</option>
              <option value="pembina_osim">Pembina OSIM</option>
              <option value="pembina_ekskul">Pembina Ekskul</option>
            </select>
          </div>

          {/* Module Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedModule}
              onChange={e => {
                setSelectedModule(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-[#121214] border border-[#27272a] rounded-xl text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Modul Aplikasi</option>
              {availableModules.map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Action Type Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedActionType}
              onChange={e => {
                setSelectedActionType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-[#121214] border border-[#27272a] rounded-xl text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Tipe Aksi</option>
              <option value="auth">Login & Logout</option>
              <option value="create">Tambah Data</option>
              <option value="update">Ubah / Edit Data</option>
              <option value="delete">Hapus Data</option>
              <option value="security">Keamanan & Password</option>
            </select>
          </div>

          {/* Sort Order Toggle */}
          <div className="md:col-span-1">
            <button
              onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
              className="w-full flex items-center justify-center space-x-1 py-2 text-xs bg-[#121214] hover:bg-zinc-800 border border-[#27272a] rounded-xl text-zinc-300 transition"
              title={`Urutkan: ${sortOrder === 'desc' ? 'Terbaru ke Terlama' : 'Terlama ke Terbaru'}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">{sortOrder === 'desc' ? 'Baru' : 'Lama'}</span>
            </button>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-[#27272a]/60">
          <div>
            Menampilkan <span className="text-emerald-400 font-bold">{filteredLogs.length}</span> dari{' '}
            <span className="text-zinc-200 font-bold">{auditLogs.length}</span> total log aktivitas
          </div>
          {(searchTerm || selectedRole !== 'all' || selectedModule !== 'all' || selectedActionType !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedRole('all');
                setSelectedModule('all');
                setSelectedActionType('all');
                setCurrentPage(1);
              }}
              className="text-emerald-400 hover:underline flex items-center space-x-1"
            >
              <X className="w-3 h-3" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Audit Logs Table View */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden shadow-lg">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-500">
              <History className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-zinc-300">Tidak ada data riwayat log aktivitas</h4>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              {searchTerm || selectedRole !== 'all' || selectedModule !== 'all' || selectedActionType !== 'all'
                ? 'Tidak ditemukan riwayat log yang sesuai dengan filter pencarian yang diterapkan.'
                : 'Sistem audit trail siap merekam seluruh login, logout, dan aksi kerja pengguna di seluruh modul.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#27272a] bg-[#121214]/80 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-4 w-44">Waktu & Tanggal</th>
                    <th className="py-3 px-4 w-60">Pengguna & Peran</th>
                    <th className="py-3 px-4 w-44">Modul</th>
                    <th className="py-3 px-4 w-44">Kode Aksi</th>
                    <th className="py-3 px-4">Rincian Aktivitas</th>
                    <th className="py-3 px-4 text-right w-20">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]/60 text-xs">
                  {paginatedLogs.map((log, index) => (
                    <tr
                      key={log.id ? `audit-${log.id}-${index}` : `audit-idx-${index}`}
                      onClick={() => {
                        setSelectedLog(log);
                        setIsDetailModalOpen(true);
                      }}
                      className="hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-zinc-300 font-mono text-[11px]">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span>{log.timestamp}</span>
                        </div>
                      </td>

                      {/* User Info & Role */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="font-semibold text-zinc-100 flex items-center space-x-1.5">
                            <span className="truncate max-w-[180px]">{log.userName || 'Sistem'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getRoleBadge(log.userRole)}
                            <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[130px]">
                              {log.userEmail || '-'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Module */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                          {log.module || 'Umum'}
                        </span>
                      </td>

                      {/* Action Code */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-4 text-zinc-300">
                        <div className="line-clamp-2 text-xs leading-relaxed">
                          {log.details}
                        </div>
                      </td>

                      {/* Detail Button */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedLog(log);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 transition"
                          title="Lihat Detail Log"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-[#27272a] bg-[#121214]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
              <div>
                Halaman <span className="text-zinc-200 font-bold">{currentPage}</span> dari{' '}
                <span className="text-zinc-200 font-bold">{totalPages}</span> (Total{' '}
                <span className="text-emerald-400 font-bold">{filteredLogs.length}</span> baris log)
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition text-xs font-semibold"
                >
                  Sebelumnya
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (currentPage > 3) pageNum = currentPage - 2 + i;
                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                        currentPage === pageNum
                          ? 'bg-emerald-500 text-zinc-900 shadow-md'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition text-xs font-semibold"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* DETAIL MODAL */}
      {isDetailModalOpen && selectedLog && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Rincian Audit Log Aktivitas"
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <div className="bg-[#121214] border border-[#27272a] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
                <div className="space-y-0.5">
                  <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Waktu Pencatatan</div>
                  <div className="text-xs font-mono font-bold text-zinc-200 flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{selectedLog.timestamp}</span>
                  </div>
                </div>
                <div>{getActionBadge(selectedLog.action)}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase">Nama Pengguna</div>
                  <div className="font-semibold text-zinc-100 mt-0.5">{selectedLog.userName}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase">Peran / Hak Akses</div>
                  <div className="mt-0.5">{getRoleBadge(selectedLog.userRole)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase">Email / Identitas</div>
                  <div className="font-mono text-zinc-300 mt-0.5 text-[11px]">{selectedLog.userEmail || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase">Modul Sistem</div>
                  <div className="text-zinc-200 mt-0.5 font-medium">{selectedLog.module}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#27272a] space-y-1">
                <div className="text-[10px] text-zinc-500 font-bold uppercase">Deskripsi / Detail Aktivitas</div>
                <div className="text-xs text-zinc-200 bg-[#18181b] p-3 rounded-lg border border-[#27272a] leading-relaxed">
                  {selectedLog.details}
                </div>
              </div>

              <div className="pt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-zinc-500 font-bold uppercase">Raw Payload Log</div>
                  <button
                    onClick={() => handleCopyRaw(selectedLog)}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copySuccess ? 'Tersalin!' : 'Salin JSON'}</span>
                  </button>
                </div>
                <pre className="text-[10px] font-mono text-zinc-400 bg-black/40 p-2.5 rounded-lg border border-[#27272a] overflow-x-auto max-h-36">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM CLEAR AUDIT LOGS MODAL */}
      <ConfirmDialog
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={async () => {
          await clearAuditLogs();
          setIsClearModalOpen(false);
        }}
        title="Kosongkan Riwayat Audit Log?"
        message="Tindakan ini akan menghapus seluruh catatan riwayat audit log aktivitas yang tersimpan di sistem lokal maupun Firebase. Rekaman baru akan tetap dimulai setelah ini."
        confirmText="Ya, Kosongkan Log"
        type="danger"
      />
    </div>
  );
};
