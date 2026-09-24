import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Minus,
  Search,
  Filter,
  Printer,
  ShieldCheck,
  UserCheck,
  FileText,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  ExternalLink,
  CreditCard,
  Scale,
  RefreshCw,
  Info,
  X
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { useAppTimezone } from '../contexts/TimezoneContext';
import { CashAccount, CashTransaction, UserProfile, CashAccountCategory, CashTransactionType } from '../types';
import { formatRupiah, parseRupiahInput, terbilang, generateReceiptNumber } from '../utils/currencyUtils';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';

const CATEGORY_LABELS: Record<CashAccountCategory, { label: string; color: string }> = {
  'Kesiswaan': { label: 'Kesiswaan Umum', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  'BK': { label: 'Bimbingan Konseling (BK)', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  'OSIM': { label: 'Intrakurikuler & OSIM', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  'Ekstrakurikuler': { label: 'Ekstrakurikuler', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  'Sosial & Infaq': { label: 'Sosial & Infaq Siswa', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  'Lainnya': { label: 'Lain-lain', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30' }
};

const TRANSACTION_CATEGORIES = [
  'Infaq & Sedekah Siswa',
  'Iuran Kas Rutin',
  'Dana BOS / BOM Madrasah',
  'Donasi & Sponsor Kegiatan',
  'Honor Pelatih & Pembina',
  'Konsumsi Rapat & Kegiatan',
  'Transportasi & Akomodasi Lomba',
  'Perlengkapan & Sarana Latihan',
  'Hadiah & Piala Kejuaraan',
  'Santunan & Bantuan Siswa BK',
  'Cetak Banner & Dokumentasi',
  'Operasional Kesekretariatan',
  'Lain-lain / Keperluan Darurat'
];

export const CashLedgerPage: React.FC = () => {
  const {
    isWakaOrAdmin,
    isSuperAdmin,
    isWaka,
    currentUser,
    allUsers,
    canManageCash,
    isOsimBendahara,
    osimPosition
  } = useAuth();
  const {
    cashAccounts,
    cashTransactions,
    addCashAccount,
    updateCashAccount,
    deleteCashAccount,
    assignCashManager,
    addCashTransaction,
    updateCashTransaction,
    deleteCashTransaction,
    schoolSetting,
    activeAcademicYear,
    activeSemester
  } = useSchool();
  const { timezoneAbbr } = useAppTimezone();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'buku_kas' | 'daftar_akun' | 'rekap_laporan'>('buku_kas');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  // Modal States
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isAmanahModalOpen, setIsAmanahModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isAttachmentPreviewOpen, setIsAttachmentPreviewOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Selected Data for Actions
  const [selectedTransaction, setSelectedTransaction] = useState<CashTransaction | null>(null);
  const [selectedAccountForAmanah, setSelectedAccountForAmanah] = useState<CashAccount | null>(null);
  const [selectedAccountForEdit, setSelectedAccountForEdit] = useState<CashAccount | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'transaction' | 'account'; id: string; name: string } | null>(null);
  const [previewAttachmentUrl, setPreviewAttachmentUrl] = useState<string>('');

  // Transaction Form State
  const [trxType, setTrxType] = useState<CashTransactionType>('MASUK');
  const [trxAccountId, setTrxAccountId] = useState<string>('');
  const [trxAmount, setTrxAmount] = useState<number>(0);
  const [trxAmountDisplay, setTrxAmountDisplay] = useState<string>('');
  const [trxDate, setTrxDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [trxTitle, setTrxTitle] = useState<string>('');
  const [trxDescription, setTrxDescription] = useState<string>('');
  const [trxCategory, setTrxCategory] = useState<string>(TRANSACTION_CATEGORIES[0]);
  const [trxRecipientOrPayer, setTrxRecipientOrPayer] = useState<string>('');
  const [trxReceiptUrl, setTrxReceiptUrl] = useState<string>('');
  const [trxRefNumber, setTrxRefNumber] = useState<string>('');

  // Account Form State
  const [accName, setAccName] = useState<string>('');
  const [accCode, setAccCode] = useState<string>('');
  const [accCategory, setAccCategory] = useState<CashAccountCategory>('Kesiswaan');
  const [accInitialBalance, setAccInitialBalance] = useState<number>(0);
  const [accInitialBalanceDisplay, setAccInitialBalanceDisplay] = useState<string>('');
  const [accDescription, setAccDescription] = useState<string>('');

  // Amanah Form State
  const [amanahSelectedUserIds, setAmanahSelectedUserIds] = useState<string[]>([]);

  // Check if current user has cash management privilege (Admin, Waka, or Designated Cash Manager / Bendahara)
  const isUserDelegatedCashManager = useMemo(() => {
    if (canManageCash && canManageCash()) return true;
    if (isSuperAdmin || isWaka || isOsimBendahara || osimPosition === 'bendahara') return true;
    if (!currentUser) return false;
    if (currentUser.isCashManager) return true;
    return cashAccounts.some(acc => acc.assignedManagerUserIds?.includes(currentUser.uid));
  }, [canManageCash, isSuperAdmin, isWaka, isOsimBendahara, osimPosition, currentUser, cashAccounts]);

  // List of accounts user can manage
  const managedAccounts = useMemo(() => {
    if (isSuperAdmin || isWaka) return cashAccounts;
    if (!currentUser) return [];
    if (isOsimBendahara || osimPosition === 'bendahara') {
      const osimAccs = cashAccounts.filter(acc => acc.category === 'OSIM' || acc.name.toLowerCase().includes('osim'));
      if (osimAccs.length > 0) return osimAccs;
      return cashAccounts;
    }
    if (currentUser.isCashManager) return cashAccounts;
    return cashAccounts.filter(acc => acc.assignedManagerUserIds?.includes(currentUser.uid));
  }, [isSuperAdmin, isWaka, currentUser, isOsimBendahara, osimPosition, cashAccounts]);

  // Account lookup helper
  const accountMap = useMemo(() => {
    const map = new Map<string, CashAccount>();
    cashAccounts.forEach(acc => map.set(acc.id, acc));
    return map;
  }, [cashAccounts]);

  // Calculate real-time balance for each account
  const accountBalances = useMemo(() => {
    const map: Record<string, { totalIn: number; totalOut: number; currentBalance: number; count: number }> = {};

    cashAccounts.forEach(acc => {
      map[acc.id] = {
        totalIn: 0,
        totalOut: 0,
        currentBalance: acc.initialBalance || 0,
        count: 0
      };
    });

    cashTransactions.forEach(trx => {
      if (map[trx.accountId]) {
        map[trx.accountId].count += 1;
        if (trx.type === 'MASUK') {
          map[trx.accountId].totalIn += trx.amount;
          map[trx.accountId].currentBalance += trx.amount;
        } else {
          map[trx.accountId].totalOut += trx.amount;
          map[trx.accountId].currentBalance -= trx.amount;
        }
      }
    });

    return map;
  }, [cashAccounts, cashTransactions]);

  // Global Consolidated Telemetry
  const telemetry = useMemo(() => {
    let totalInitial = 0;
    let totalIn = 0;
    let totalOut = 0;

    cashAccounts.forEach(acc => {
      totalInitial += acc.initialBalance || 0;
    });

    cashTransactions.forEach(trx => {
      if (trx.type === 'MASUK') {
        totalIn += trx.amount;
      } else {
        totalOut += trx.amount;
      }
    });

    const totalBalance = totalInitial + totalIn - totalOut;

    return {
      totalBalance,
      totalIn,
      totalOut,
      activeAccountsCount: cashAccounts.filter(a => a.isActive !== false).length,
      transactionsCount: cashTransactions.length
    };
  }, [cashAccounts, cashTransactions]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return cashTransactions.filter(trx => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = trx.title.toLowerCase().includes(q);
        const matchDesc = trx.description?.toLowerCase().includes(q);
        const matchRef = trx.referenceNumber?.toLowerCase().includes(q);
        const matchPayer = trx.recipientOrPayer?.toLowerCase().includes(q);
        const matchRecorder = trx.recordedByName.toLowerCase().includes(q);
        const matchAccount = trx.accountName.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchRef && !matchPayer && !matchRecorder && !matchAccount) {
          return false;
        }
      }

      if (selectedAccountId !== 'ALL' && trx.accountId !== selectedAccountId) {
        return false;
      }

      if (selectedType !== 'ALL' && trx.type !== selectedType) {
        return false;
      }

      if (selectedCategoryFilter !== 'ALL' && trx.category !== selectedCategoryFilter) {
        return false;
      }

      if (dateRange.start && trx.date < dateRange.start) return false;
      if (dateRange.end && trx.date > dateRange.end) return false;

      return true;
    });
  }, [cashTransactions, searchQuery, selectedAccountId, selectedType, selectedCategoryFilter, dateRange]);

  // Open Add Transaction Modal
  const handleOpenAddTransaction = (type: CashTransactionType) => {
    setTrxType(type);
    setSelectedTransaction(null);

    const defaultAcc = managedAccounts[0] || cashAccounts[0];
    setTrxAccountId(defaultAcc ? defaultAcc.id : '');
    setTrxAmount(0);
    setTrxAmountDisplay('');
    setTrxDate(new Date().toISOString().split('T')[0]);
    setTrxTitle('');
    setTrxDescription('');
    setTrxCategory(TRANSACTION_CATEGORIES[0]);
    setTrxRecipientOrPayer('');
    setTrxReceiptUrl('');
    setTrxRefNumber(generateReceiptNumber(type, defaultAcc?.code || ''));
    setIsTransactionModalOpen(true);
  };

  // Open Edit Transaction Modal
  const handleOpenEditTransaction = (trx: CashTransaction) => {
    setSelectedTransaction(trx);
    setTrxType(trx.type);
    setTrxAccountId(trx.accountId);
    setTrxAmount(trx.amount);
    setTrxAmountDisplay(trx.amount ? trx.amount.toLocaleString('id-ID') : '');
    setTrxDate(trx.date);
    setTrxTitle(trx.title);
    setTrxDescription(trx.description || '');
    setTrxCategory(trx.category || TRANSACTION_CATEGORIES[0]);
    setTrxRecipientOrPayer(trx.recipientOrPayer || '');
    setTrxReceiptUrl(trx.receiptUrl || '');
    setTrxRefNumber(trx.referenceNumber || '');
    setIsTransactionModalOpen(true);
  };

  // Save Transaction
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxAccountId || trxAmount <= 0 || !trxTitle) {
      alert('Mohon lengkapi Akun Kas, Jumlah Uang (Rp), dan Judul Transaksi!');
      return;
    }

    const targetAccount = cashAccounts.find(a => a.id === trxAccountId);
    if (!targetAccount) return;

    if (selectedTransaction) {
      await updateCashTransaction(selectedTransaction.id, {
        accountId: trxAccountId,
        accountName: targetAccount.name,
        accountCode: targetAccount.code,
        type: trxType,
        amount: trxAmount,
        date: trxDate,
        title: trxTitle,
        description: trxDescription,
        category: trxCategory,
        recipientOrPayer: trxRecipientOrPayer,
        receiptUrl: trxReceiptUrl,
        referenceNumber: trxRefNumber
      });
    } else {
      await addCashTransaction({
        accountId: trxAccountId,
        accountName: targetAccount.name,
        accountCode: targetAccount.code,
        type: trxType,
        amount: trxAmount,
        date: trxDate,
        title: trxTitle,
        description: trxDescription,
        category: trxCategory,
        recipientOrPayer: trxRecipientOrPayer,
        receiptUrl: trxReceiptUrl,
        referenceNumber: trxRefNumber,
        recordedByUid: currentUser?.uid || 'system',
        recordedByName: currentUser?.displayName || 'Petugas Kas Madrasah',
        recordedByRole: currentUser?.cashManagerTitle || (isSuperAdmin ? 'Super Administrator' : isWaka ? 'Waka Kesiswaan' : 'Pemegang Kas'),
        status: 'VERIFIED',
        academicYear: activeAcademicYear
      });
    }

    setIsTransactionModalOpen(false);
  };

  // Open Amanah Delegation Modal
  const handleOpenAmanahModal = (account: CashAccount) => {
    setSelectedAccountForAmanah(account);
    setAmanahSelectedUserIds(account.assignedManagerUserIds || []);
    setIsAmanahModalOpen(true);
  };

  // Save Amanah Delegation
  const handleSaveAmanah = async () => {
    if (!selectedAccountForAmanah) return;

    const selectedTeacherNames = allUsers
      .filter(u => amanahSelectedUserIds.includes(u.uid))
      .map(u => u.displayName);

    await assignCashManager(selectedAccountForAmanah.id, amanahSelectedUserIds, selectedTeacherNames);
    setIsAmanahModalOpen(false);
  };

  // Open Add / Edit Account Modal
  const handleOpenAccountModal = (account?: CashAccount) => {
    if (account) {
      setSelectedAccountForEdit(account);
      setAccName(account.name);
      setAccCode(account.code);
      setAccCategory(account.category);
      setAccInitialBalance(account.initialBalance || 0);
      setAccInitialBalanceDisplay(account.initialBalance ? account.initialBalance.toLocaleString('id-ID') : '');
      setAccDescription(account.description || '');
    } else {
      setSelectedAccountForEdit(null);
      setAccName('');
      setAccCode(`KAS-${Date.now().toString().slice(-4)}`);
      setAccCategory('Kesiswaan');
      setAccInitialBalance(0);
      setAccInitialBalanceDisplay('');
      setAccDescription('');
    }
    setIsAccountModalOpen(true);
  };

  // Save Account
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName || !accCode) {
      alert('Nama dan Kode Akun Kas wajib diisi!');
      return;
    }

    if (selectedAccountForEdit) {
      await updateCashAccount(selectedAccountForEdit.id, {
        name: accName,
        code: accCode,
        category: accCategory,
        initialBalance: accInitialBalance,
        description: accDescription
      });
    } else {
      await addCashAccount({
        name: accName,
        code: accCode,
        category: accCategory,
        initialBalance: accInitialBalance,
        description: accDescription,
        isActive: true,
        academicYear: activeAcademicYear,
        assignedManagerUserIds: [],
        assignedManagerNames: []
      });
    }

    setIsAccountModalOpen(false);
  };

  // Open Receipt Print Slip Modal
  const handleOpenReceiptSlip = (trx: CashTransaction) => {
    setSelectedTransaction(trx);
    setIsReceiptModalOpen(true);
  };

  // Open Attachment Preview
  const handleOpenAttachment = (url: string) => {
    setPreviewAttachmentUrl(url);
    setIsAttachmentPreviewOpen(true);
  };

  // Delete Action Confirm
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'transaction') {
      await deleteCashTransaction(itemToDelete.id);
    } else {
      await deleteCashAccount(itemToDelete.id);
    }
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  // Export Data Preparation
  const exportData = useMemo(() => {
    return filteredTransactions.map((trx, idx) => ({
      no: idx + 1,
      nomor_bukti: trx.referenceNumber || '-',
      tanggal: trx.date,
      akun_kas: trx.accountName,
      kategori: trx.category || '-',
      jenis: trx.type === 'MASUK' ? 'Uang Masuk (Debit)' : 'Uang Keluar (Kredit)',
      pembayar_penerima: trx.recipientOrPayer || '-',
      uraian: trx.title,
      nominal_masuk: trx.type === 'MASUK' ? trx.amount : 0,
      nominal_keluar: trx.type === 'KELUAR' ? trx.amount : 0,
      petugas: trx.recordedByName,
      peran: trx.recordedByRole
    }));
  }, [filteredTransactions]);

  const exportHeaders = [
    { header: 'No', key: 'no' },
    { header: 'No. Bukti / Kwitansi', key: 'nomor_bukti' },
    { header: 'Tanggal', key: 'tanggal' },
    { header: 'Akun Kas', key: 'akun_kas' },
    { header: 'Kategori Anggaran', key: 'kategori' },
    { header: 'Jenis Mutasi', key: 'jenis' },
    { header: 'Penyetor / Penerima', key: 'pembayar_penerima' },
    { header: 'Uraian Transaksi', key: 'uraian' },
    { header: 'Penerimaan (Rp)', key: 'nominal_masuk' },
    { header: 'Pengeluaran (Rp)', key: 'nominal_keluar' },
    { header: 'Petugas Pencatat', key: 'petugas' },
    { header: 'Gelar / Amanah', key: 'peran' }
  ];

  // Columns for DataTable
  const transactionColumns: Column<CashTransaction>[] = [
    {
      header: 'No. Bukti & Tanggal',
      accessorKey: 'referenceNumber',
      cell: trx => (
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <span className="font-mono text-xs font-bold text-zinc-100 bg-[#1f1f23] px-2 py-0.5 rounded border border-[#2e2e33]">
              {trx.referenceNumber || `TRX-${trx.id.slice(-6)}`}
            </span>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono mt-1 flex items-center">
            <Calendar className="w-3 h-3 mr-1 text-zinc-500" />
            {trx.date} {timezoneAbbr ? `(${timezoneAbbr})` : ''}
          </span>
        </div>
      )
    },
    {
      header: 'Akun & Kategori',
      accessorKey: 'accountName',
      cell: trx => {
        const acc = accountMap.get(trx.accountId);
        const category = acc?.category || 'Kesiswaan';
        const catConfig = CATEGORY_LABELS[category] || CATEGORY_LABELS['Kesiswaan'];
        return (
          <div className="flex flex-col max-w-[200px]">
            <span className="font-semibold text-xs text-zinc-200 truncate">{trx.accountName}</span>
            <div className="flex items-center space-x-1 mt-0.5">
              <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${catConfig.color}`}>
                {category}
              </span>
              <span className="text-[10px] text-zinc-400 truncate">{trx.category || 'Operasional'}</span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Uraian & Penyetor/Penerima',
      accessorKey: 'title',
      cell: trx => (
        <div className="flex flex-col max-w-[280px]">
          <span className="font-medium text-xs text-zinc-100 line-clamp-1">{trx.title}</span>
          {trx.recipientOrPayer && (
            <span className="text-[11px] text-zinc-400 italic">
              {trx.type === 'MASUK' ? 'Dari: ' : 'Kepada: '} {trx.recipientOrPayer}
            </span>
          )}
          {trx.description && (
            <span className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{trx.description}</span>
          )}
        </div>
      )
    },
    {
      header: 'Petugas / Amanah',
      accessorKey: 'recordedByName',
      cell: trx => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-zinc-300">{trx.recordedByName}</span>
          <span className="text-[10px] font-mono text-blue-400/80">{trx.recordedByRole}</span>
        </div>
      )
    },
    {
      header: 'Mutasi Kas (Rp)',
      accessorKey: 'amount',
      className: 'text-right',
      cell: trx => {
        const isMasuk = trx.type === 'MASUK';
        return (
          <div className="flex flex-col items-end">
            <div className={`flex items-center space-x-1 font-mono font-bold text-xs ${isMasuk ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isMasuk ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
              <span>{isMasuk ? '+ ' : '- '} {formatRupiah(trx.amount)}</span>
            </div>
            <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono mt-0.5 ${isMasuk ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              {isMasuk ? 'Penerimaan' : 'Pengeluaran'}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Bukti & Kwitansi',
      accessorKey: 'receiptUrl',
      className: 'text-center',
      cell: trx => (
        <div className="flex items-center justify-center space-x-1.5">
          <button
            onClick={() => handleOpenReceiptSlip(trx)}
            title="Cetak Kwitansi BKM/BKK"
            className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors border border-zinc-700"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
          {trx.receiptUrl ? (
            <button
              onClick={() => handleOpenAttachment(trx.receiptUrl!)}
              title="Lihat Bukti Lampiran / Nota"
              className="p-1.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="text-[10px] text-zinc-600 font-mono">-</span>
          )}
        </div>
      )
    },
    {
      header: 'Aksi',
      className: 'text-center',
      cell: trx => {
        const canEdit = isSuperAdmin || isWaka || currentUser?.isCashManager || trx.recordedByUid === currentUser?.uid || managedAccounts.some(a => a.id === trx.accountId);
        if (!canEdit) {
          return (
            <span className="text-[10px] text-zinc-400 font-mono px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 inline-flex items-center gap-1" title="Akses Peninjau Transparansi (Hanya Lihat)">
              <Eye className="w-2.5 h-2.5 text-zinc-500" />
              <span>Lihat Saja</span>
            </span>
          );
        }

        return (
          <div className="flex items-center justify-center space-x-1">
            <button
              onClick={() => handleOpenEditTransaction(trx)}
              title="Edit Transaksi"
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-blue-400 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            {(isSuperAdmin || isWaka || currentUser?.isCashManager || trx.recordedByUid === currentUser?.uid) && (
              <button
                onClick={() => {
                  setItemToDelete({ type: 'transaction', id: trx.id, name: `${trx.title} (${formatRupiah(trx.amount)})` });
                  setIsDeleteDialogOpen(true);
                }}
                title="Hapus Transaksi"
                className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-zinc-100 font-sans">
      {/* 1. Header & Telemetry Dashboard */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">Neraca Kas & Keuangan Kesiswaan</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  TRANSPARANSI REAL-TIME
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Transparansi pembukuan kas kesiswaan, BK, OSIM, dan ekstrakurikuler dengan delegasi amanah resmi dewan guru.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {isUserDelegatedCashManager && (
            <>
              <button
                id="btn-catat-uang-masuk"
                onClick={() => handleOpenAddTransaction('MASUK')}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Catat Uang Masuk</span>
              </button>
              <button
                id="btn-catat-uang-keluar"
                onClick={() => handleOpenAddTransaction('KELUAR')}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>- Catat Uang Keluar</span>
              </button>
            </>
          )}

          {isWakaOrAdmin && (
            <button
              onClick={() => handleOpenAccountModal()}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs flex items-center space-x-1.5 border border-zinc-700 transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5 text-blue-400" />
              <span>Tambah Akun Kas</span>
            </button>
          )}

          <ExportActions
            filename="Laporan_Neraca_Kas_Kesiswaan"
            title="Laporan Neraca Kas & Transparansi Keuangan Kesiswaan"
            data={exportData}
            headers={exportHeaders}
            academicYear={`${activeAcademicYear} ${activeSemester}`}
          />
        </div>
      </div>

      {/* Role / Amanah Notification Banner */}
      <div className={`p-3 rounded-lg border flex items-start space-x-3 text-xs ${
        isSuperAdmin || isWaka
          ? 'bg-blue-500/10 border-blue-500/20 text-blue-200'
          : isUserDelegatedCashManager
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
          : 'bg-zinc-900 border-zinc-800 text-zinc-300'
      }`}>
        <div className="mt-0.5 shrink-0">
          {isSuperAdmin || isWaka ? (
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          ) : isUserDelegatedCashManager ? (
            <UserCheck className="w-4 h-4 text-emerald-400" />
          ) : (
            <Eye className="w-4 h-4 text-zinc-400" />
          )}
        </div>
        <div className="flex-1">
          <div className="font-semibold">
            {isSuperAdmin || isWaka
              ? 'Hak Otoritas Penuh Super Admin / Waka Kesiswaan'
              : isUserDelegatedCashManager
              ? `Pengelola Uang Kas Aktif (${currentUser?.displayName} - ${currentUser?.cashManagerTitle || 'Bendahara Kas'})`
              : `Laman Transparansi Kas Kesiswaan (Akses Pelihat: ${currentUser?.displayName})`}
          </div>
          <p className="text-[11px] opacity-90 mt-0.5">
            {isSuperAdmin || isWaka
              ? 'Anda memiliki hak kelola penuh atas seluruh akun kas, pendelegasian bendahara, dan verifikasi arus kas.'
              : isUserDelegatedCashManager
              ? `Anda berwenang mencatat dan mengelola mutasi uang kas masuk/keluar pada akun kas kesiswaan madrasah.`
              : 'Anda memiliki akses peninjau (view-only) untuk transparansi pembukuan kas kesiswaan. Hak pencatatan mutasi kas dikhususkan bagi Admin dan Bendahara.'}
          </p>
        </div>
      </div>

      {/* 2. Key Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider">Total Saldo Terkonsolidasi</span>
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tracking-tight">
              {formatRupiah(telemetry.totalBalance)}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between">
              <span>Dari {telemetry.activeAccountsCount} Akun Kas Aktif</span>
              <span className="text-emerald-500 font-mono font-medium">REAL-TIME</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider">Total Penerimaan (Debit)</span>
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg sm:text-xl font-bold font-mono text-blue-400">
              {formatRupiah(telemetry.totalIn)}
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">Akumulasi uang kas masuk</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider">Total Pengeluaran (Kredit)</span>
            <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg sm:text-xl font-bold font-mono text-rose-400">
              {formatRupiah(telemetry.totalOut)}
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">Akumulasi pengeluaran kegiatan</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider">Aktivitas Transaksi</span>
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg sm:text-xl font-bold font-mono text-zinc-200">
              {telemetry.transactionsCount} <span className="text-xs font-normal text-zinc-400 font-sans">Kwitansi Tercatat</span>
            </div>
            <span className="text-[11px] text-amber-400/80 mt-1 block font-mono">Status Terverifikasi</span>
          </div>
        </div>
      </div>

      {/* 3. Navigation View Switcher */}
      <div className="flex items-center space-x-2 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('buku_kas')}
          className={`relative px-4 py-2.5 text-xs font-medium transition-colors flex items-center space-x-2 ${
            activeTab === 'buku_kas'
              ? 'text-emerald-400 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {activeTab === 'buku_kas' && (
            <motion.div
              layoutId="activeCashLedgerTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <FileText className="w-3.5 h-3.5" />
          <span>Buku Jurnal Mutasi Kas</span>
          <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] font-mono text-zinc-300">
            {filteredTransactions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('daftar_akun')}
          className={`relative px-4 py-2.5 text-xs font-medium transition-colors flex items-center space-x-2 ${
            activeTab === 'daftar_akun'
              ? 'text-emerald-400 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {activeTab === 'daftar_akun' && (
            <motion.div
              layoutId="activeCashLedgerTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <Layers className="w-3.5 h-3.5" />
          <span>Daftar Akun Kas & Delegasi Amanah</span>
          <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] font-mono text-zinc-300">
            {cashAccounts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('rekap_laporan')}
          className={`relative px-4 py-2.5 text-xs font-medium transition-colors flex items-center space-x-2 ${
            activeTab === 'rekap_laporan'
              ? 'text-emerald-400 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {activeTab === 'rekap_laporan' && (
            <motion.div
              layoutId="activeCashLedgerTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <Scale className="w-3.5 h-3.5" />
          <span>Neraca Rekapitulasi Keuangan</span>
        </button>
      </div>

      {/* 4. Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === 'buku_kas' && (
          <motion.div
            key="buku_kas"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="space-y-4"
          >
          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            <div className="relative sm:col-span-2">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari no bukti, uraian, penyetor/penerima..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#121215] border border-zinc-700/80 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <select
                value={selectedAccountId}
                onChange={e => setSelectedAccountId(e.target.value)}
                className="w-full py-1.5 px-2 bg-[#121215] border border-zinc-700/80 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="ALL">Semua Akun Kas ({cashAccounts.length})</option>
                {cashAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="w-full py-1.5 px-2 bg-[#121215] border border-zinc-700/80 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="ALL">Semua Mutasi (Masuk & Keluar)</option>
                <option value="MASUK">+ Uang Masuk (Debit)</option>
                <option value="KELUAR">- Uang Keluar (Kredit)</option>
              </select>
            </div>

            <div>
              <select
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
                className="w-full py-1.5 px-2 bg-[#121215] border border-zinc-700/80 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">Semua Kategori Anggaran</option>
                {TRANSACTION_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1">
              {(searchQuery || selectedAccountId !== 'ALL' || selectedType !== 'ALL' || selectedCategoryFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedAccountId('ALL');
                    setSelectedType('ALL');
                    setSelectedCategoryFilter('ALL');
                  }}
                  className="w-full py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors flex items-center justify-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-sm">
            <DataTable
              data={filteredTransactions}
              columns={transactionColumns}
              emptyTitle="Belum Ada Catatan Mutasi Kas"
              emptySubtitle="Catatan penerimaan dan pengeluaran uang kas akan tercantum di sini secara transparan."
            />
          </div>
        </motion.div>
      )}

      {activeTab === 'daftar_akun' && (
        <motion.div
          key="daftar_akun"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider font-mono">
              Buku Akun Kas & Delegasi Amanah ({cashAccounts.length} Akun)
            </h2>
            {isWakaOrAdmin && (
              <button
                onClick={() => handleOpenAccountModal()}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center space-x-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Akun Kas Baru</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cashAccounts.map(account => {
              const balanceInfo = accountBalances[account.id] || {
                totalIn: 0,
                totalOut: 0,
                currentBalance: account.initialBalance || 0,
                count: 0
              };
              const catConfig = CATEGORY_LABELS[account.category] || CATEGORY_LABELS['Kesiswaan'];
              const isAssignedToMe = currentUser && account.assignedManagerUserIds?.includes(currentUser.uid);

              return (
                <div
                  key={account.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isAssignedToMe
                      ? 'bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/30'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                        {account.code}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${catConfig.color}`}>
                        {catConfig.label}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white tracking-tight">{account.name}</h3>
                    {account.description && (
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{account.description}</p>
                    )}

                    <div className="my-3.5 p-3 rounded-lg bg-[#141417] border border-zinc-800/80">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span>Saldo Kas Saat Ini:</span>
                        <span className="font-mono text-[10px] text-zinc-500">{balanceInfo.count} Transaksi</span>
                      </div>
                      <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                        {formatRupiah(balanceInfo.currentBalance)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-zinc-800/60 text-[10px]">
                        <div>
                          <span className="text-zinc-500 block">Total Masuk:</span>
                          <span className="text-blue-400 font-mono font-medium">+{formatRupiah(balanceInfo.totalIn)}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">Total Keluar:</span>
                          <span className="text-rose-400 font-mono font-medium">-{formatRupiah(balanceInfo.totalOut)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400 font-semibold flex items-center">
                          <UserCheck className="w-3 h-3 mr-1 text-blue-400" />
                          Guru Pemegang Amanah:
                        </span>
                        {isWakaOrAdmin && (
                          <button
                            onClick={() => handleOpenAmanahModal(account)}
                            className="text-[10px] text-blue-400 hover:text-blue-300 font-medium underline"
                          >
                            Ubah Amanah
                          </button>
                        )}
                      </div>

                      {account.assignedManagerNames && account.assignedManagerNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {account.assignedManagerNames.map((name, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-500 italic block">
                          Belum didelegasikan ke guru tertentu (Dikelola Penuh Admin/Waka)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedAccountId(account.id);
                        setActiveTab('buku_kas');
                      }}
                      className="text-xs text-zinc-300 hover:text-white font-medium flex items-center space-x-1"
                    >
                      <span>Lihat Jurnal Mutasi →</span>
                    </button>

                    {isWakaOrAdmin && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenAccountModal(account)}
                          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-blue-400 transition-colors"
                          title="Edit Akun Kas"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setItemToDelete({ type: 'account', id: account.id, name: account.name });
                            setIsDeleteDialogOpen(true);
                          }}
                          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors"
                          title="Hapus Akun Kas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {activeTab === 'rekap_laporan' && (
        <motion.div
          key="rekap_laporan"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="space-y-6"
        >
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Rekapitulasi Saldo Kas per Akun Kesiswaan
                </h3>
                <p className="text-xs text-zinc-400">
                  Tahun Ajaran {activeAcademicYear} ({activeSemester}) — Madrasah {schoolSetting.name}
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center space-x-1.5 border border-zinc-700"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Rekap Neraca</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase font-mono bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Kode Akun</th>
                    <th className="py-2.5 px-3">Nama Akun Kas</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Pemegang Amanah</th>
                    <th className="py-2.5 px-3 text-right">Saldo Awal</th>
                    <th className="py-2.5 px-3 text-right">Penerimaan (Debit)</th>
                    <th className="py-2.5 px-3 text-right">Pengeluaran (Kredit)</th>
                    <th className="py-2.5 px-3 text-right">Saldo Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-sans">
                  {cashAccounts.map((acc, idx) => {
                    const balance = accountBalances[acc.id] || {
                      totalIn: 0,
                      totalOut: 0,
                      currentBalance: acc.initialBalance || 0
                    };

                    return (
                      <tr key={acc.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-zinc-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-zinc-300">{acc.code}</td>
                        <td className="py-2.5 px-3 font-semibold text-white">{acc.name}</td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-zinc-400">{acc.category}</td>
                        <td className="py-2.5 px-3 text-zinc-300">
                          {acc.assignedManagerNames?.length ? acc.assignedManagerNames.join(', ') : 'Pimpinan / Admin'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-zinc-400">
                          {formatRupiah(acc.initialBalance || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-blue-400 font-medium">
                          +{formatRupiah(balance.totalIn)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-400 font-medium">
                          -{formatRupiah(balance.totalOut)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                          {formatRupiah(balance.currentBalance)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-zinc-950 font-mono font-bold text-xs border-t-2 border-zinc-700">
                  <tr>
                    <td colSpan={5} className="py-3 px-3 text-right uppercase tracking-wider text-zinc-300">
                      Total Konsolidasi:
                    </td>
                    <td className="py-3 px-3 text-right text-zinc-400">
                      {formatRupiah(cashAccounts.reduce((sum, a) => sum + (a.initialBalance || 0), 0))}
                    </td>
                    <td className="py-3 px-3 text-right text-blue-400">+{formatRupiah(telemetry.totalIn)}</td>
                    <td className="py-3 px-3 text-right text-rose-400">-{formatRupiah(telemetry.totalOut)}</td>
                    <td className="py-3 px-3 text-right text-emerald-400 text-sm">{formatRupiah(telemetry.totalBalance)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* 5. MODAL: CATAT TRANSAKSI KAS MASUK / KELUAR */}
      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        title={selectedTransaction ? 'Edit Transaksi Kas' : trxType === 'MASUK' ? 'Catat Uang Kas Masuk (Penerimaan / BKM)' : 'Catat Uang Kas Keluar (Pengeluaran / BKK)'}
        size="lg"
      >
        <form onSubmit={handleSaveTransaction} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Pilih Akun Kas <span className="text-rose-400">*</span>
            </label>
            <select
              value={trxAccountId}
              onChange={e => {
                setTrxAccountId(e.target.value);
                const acc = cashAccounts.find(a => a.id === e.target.value);
                if (acc && !selectedTransaction) {
                  setTrxRefNumber(generateReceiptNumber(trxType, acc.code));
                }
              }}
              required
              className="w-full p-2.5 bg-[#121215] border border-zinc-700 rounded-lg text-zinc-100 font-medium focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- Pilih Akun Kas --</option>
              {(isSuperAdmin || isWaka ? cashAccounts : managedAccounts).map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} - {acc.name} ({formatRupiah(accountBalances[acc.id]?.currentBalance || 0)})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
            <label className="block text-zinc-200 font-semibold">
              Jumlah Uang (Nominal Rp) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 font-mono font-bold text-zinc-400">
                Rp
              </span>
              <input
                type="text"
                value={trxAmountDisplay}
                onChange={e => {
                  const val = parseRupiahInput(e.target.value);
                  setTrxAmount(val);
                  setTrxAmountDisplay(val ? val.toLocaleString('id-ID') : '');
                }}
                placeholder="0"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-[#18181c] border border-zinc-700 rounded-lg text-lg font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
            {trxAmount > 0 && (
              <div className="text-[11px] text-zinc-400 italic bg-zinc-900 p-2 rounded border border-zinc-800">
                <span className="text-zinc-500 font-normal">Terbilang: </span>
                <span className="text-emerald-300 font-semibold font-serif">{terbilang(trxAmount)}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Tanggal Transaksi <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={trxDate}
                onChange={e => setTrxDate(e.target.value)}
                required
                className="w-full p-2 bg-[#121215] border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                No. Registrasi Bukti Kas (BKM/BKK)
              </label>
              <input
                type="text"
                value={trxRefNumber}
                onChange={e => setTrxRefNumber(e.target.value)}
                placeholder="BKM-202608-001"
                className="w-full p-2 bg-[#121215] border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Judul Transaksi Singkat <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={trxTitle}
                onChange={e => setTrxTitle(e.target.value)}
                placeholder="Contoh: Infaq Jumat Siswa Kelas X / Pembelian Bola Basket"
                required
                className="w-full p-2 bg-[#121215] border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Kategori Anggaran <span className="text-rose-400">*</span>
              </label>
              <select
                value={trxCategory}
                onChange={e => setTrxCategory(e.target.value)}
                className="w-full p-2 bg-[#121215] border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-500 text-xs"
              >
                {TRANSACTION_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                {trxType === 'MASUK' ? 'Diterima Dari (Penyetor / Sumber Dana)' : 'Dibayarkan Kepada (Penerima / Vendor / Toko)'}
              </label>
              <input
                type="text"
                value={trxRecipientOrPayer}
                onChange={e => setTrxRecipientOrPayer(e.target.value)}
                placeholder={trxType === 'MASUK' ? 'Contoh: Siswa Kelas XI-IPA / Donatur' : 'Contoh: Toko Olahraga Nusantara / Pembina'}
                className="w-full p-2 bg-[#121215] border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Tautan Bukti / Foto Nota Struk (URL)
              </label>
              <input
                type="url"
                value={trxReceiptUrl}
                onChange={e => setTrxReceiptUrl(e.target.value)}
                placeholder="https://... atau simpan bukti nota"
                className="w-full p-2 bg-[#121215] border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Keterangan / Uraian Lengkap
            </label>
            <textarea
              value={trxDescription}
              onChange={e => setTrxDescription(e.target.value)}
              rows={2}
              placeholder="Catatan tambahan keperluan penggunaan dana, rincian per item belanja, atau peruntukan..."
              className="w-full p-2 bg-[#121215] border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-500 text-xs resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsTransactionModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-lg font-bold text-xs text-white transition-all shadow-md flex items-center space-x-1.5 ${
                trxType === 'MASUK' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Simpan Catatan Kas</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* 6. MODAL: DELEGASI AMANAH PEMEGANG KAS (ADMIN) */}
      <Modal
        isOpen={isAmanahModalOpen}
        onClose={() => setIsAmanahModalOpen(false)}
        title="Delegasi Amanah Pengelolaan Kas Madrasah"
        size="md"
      >
        <div className="space-y-4 text-xs font-sans">
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-200">
            <div className="font-bold">Akun Kas: {selectedAccountForAmanah?.name} ({selectedAccountForAmanah?.code})</div>
            <p className="text-[11px] opacity-90 mt-0.5">
              Pilih dewan guru atau staf yang diberi kewenangan resmi untuk menginput, mengedit, dan mempertanggungjawabkan keluar masuk uang kas pada akun ini.
            </p>
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-2">
              Daftar Dewan Guru & Akun Madrasah:
            </label>
            <div className="max-h-64 overflow-y-auto space-y-1.5 p-2 rounded-lg bg-zinc-950 border border-zinc-800 divide-y divide-zinc-900">
              {allUsers.map(user => {
                const isSelected = amanahSelectedUserIds.includes(user.uid);
                return (
                  <label
                    key={user.uid}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-500/15 text-blue-200' : 'hover:bg-zinc-900 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => {
                          if (e.target.checked) {
                            setAmanahSelectedUserIds(prev => [...prev, user.uid]);
                          } else {
                            setAmanahSelectedUserIds(prev => prev.filter(id => id !== user.uid));
                          }
                        }}
                        className="rounded bg-zinc-800 border-zinc-700 text-blue-500 focus:ring-blue-500 w-4 h-4"
                      />
                      <div>
                        <div className="font-semibold text-xs">{user.displayName}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {user.role.toUpperCase()} {user.nip ? `• NIP: ${user.nip}` : ''}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                        DIAMANAHKAN
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
            <button
              onClick={() => setIsAmanahModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs"
            >
              Batal
            </button>
            <button
              onClick={handleSaveAmanah}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md"
            >
              Simpan Delegasi Amanah
            </button>
          </div>
        </div>
      </Modal>

      {/* 7. MODAL: TAMBAH / EDIT AKUN KAS */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title={selectedAccountForEdit ? 'Edit Akun Kas' : 'Buat Akun Kas Baru'}
        size="md"
      >
        <form onSubmit={handleSaveAccount} className="space-y-3.5 text-xs font-sans">
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Nama Akun Kas <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={accName}
              onChange={e => setAccName(e.target.value)}
              placeholder="Contoh: Kas Layanan BK & Peduli Siswa"
              required
              className="w-full p-2 bg-[#121215] border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Kode Akun <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={accCode}
                onChange={e => setAccCode(e.target.value.toUpperCase())}
                placeholder="KAS-BK-01"
                required
                className="w-full p-2 bg-[#121215] border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Kategori <span className="text-rose-400">*</span>
              </label>
              <select
                value={accCategory}
                onChange={e => setAccCategory(e.target.value as CashAccountCategory)}
                className="w-full p-2 bg-[#121215] border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-500 text-xs"
              >
                <option value="Kesiswaan">Kesiswaan Umum</option>
                <option value="BK">Bimbingan Konseling (BK)</option>
                <option value="OSIM">Intrakurikuler & OSIM</option>
                <option value="Ekstrakurikuler">Ekstrakurikuler</option>
                <option value="Sosial & Infaq">Sosial & Infaq Siswa</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Saldo Awal Pembukuan (Rp)
            </label>
            <input
              type="text"
              value={accInitialBalanceDisplay}
              onChange={e => {
                const val = parseRupiahInput(e.target.value);
                setAccInitialBalance(val);
                setAccInitialBalanceDisplay(val ? val.toLocaleString('id-ID') : '');
              }}
              placeholder="0"
              className="w-full p-2 bg-[#121215] border border-zinc-700 rounded-lg text-zinc-100 font-mono focus:outline-none focus:border-emerald-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Keterangan / Deskripsi Tujuan Akun
            </label>
            <textarea
              value={accDescription}
              onChange={e => setAccDescription(e.target.value)}
              rows={2}
              placeholder="Peruntukan operasional kas..."
              className="w-full p-2 bg-[#121215] border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-500 text-xs resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsAccountModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
            >
              Simpan Akun Kas
            </button>
          </div>
        </form>
      </Modal>

      {/* 8. MODAL: KWITANSI RESMI BKM/BKK PRINT SLIP */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Kwitansi Bukti Kas Madrasah"
        size="lg"
      >
        {selectedTransaction && (
          <div className="space-y-4 font-sans text-zinc-900 bg-white p-6 rounded-lg shadow-inner">
            <div className="text-center border-b-2 border-zinc-900 pb-3">
              <div className="text-[11px] font-bold tracking-widest uppercase text-zinc-600">
                {schoolSetting.centralInstitution || 'KEMENTERIAN AGAMA REPUBLIK INDONESIA'}
              </div>
              <div className="text-base font-black uppercase text-zinc-900">
                {schoolSetting.name || 'MADRASAH ALIYAH NEGERI 1 TELADAN'}
              </div>
              <div className="text-[10px] text-zinc-600">
                {schoolSetting.address || 'Jl. Pendidikan No. 45, Kompleks Madrasah Terpadu'} • Telp: {schoolSetting.phone || '(021) 7890123'}
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-zinc-300 pb-2 text-xs">
              <div>
                <span className="font-bold text-sm uppercase text-zinc-900 underline">
                  {selectedTransaction.type === 'MASUK' ? 'BUKTI KAS MASUK (BKM)' : 'BUKTI KAS KELUAR (BKK)'}
                </span>
                <div className="text-[11px] font-mono text-zinc-600 mt-0.5">
                  Akun: {selectedTransaction.accountName}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-xs bg-zinc-100 px-2 py-0.5 rounded border border-zinc-300">
                  {selectedTransaction.referenceNumber || `TRX-${selectedTransaction.id.slice(-6)}`}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  Tanggal: {selectedTransaction.date}
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="grid grid-cols-4 gap-2">
                <span className="font-semibold text-zinc-700">
                  {selectedTransaction.type === 'MASUK' ? 'Diterima Dari' : 'Dibayarkan Kepada'}
                </span>
                <span className="col-span-3 font-bold text-zinc-900">
                  : {selectedTransaction.recipientOrPayer || 'Pihak Terkait'}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <span className="font-semibold text-zinc-700">Jumlah Uang</span>
                <span className="col-span-3 font-mono font-bold text-base text-zinc-900">
                  : {formatRupiah(selectedTransaction.amount)}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 bg-zinc-50 p-2 rounded border border-zinc-200">
                <span className="font-semibold text-zinc-700">Terbilang</span>
                <span className="col-span-3 font-serif italic font-bold text-zinc-800">
                  : {terbilang(selectedTransaction.amount)}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <span className="font-semibold text-zinc-700">Untuk Pembayaran</span>
                <span className="col-span-3 text-zinc-900 font-medium">
                  : {selectedTransaction.title}
                </span>
              </div>

              {selectedTransaction.description && (
                <div className="grid grid-cols-4 gap-2">
                  <span className="font-semibold text-zinc-700">Keterangan / Rincian</span>
                  <span className="col-span-3 text-zinc-600 italic">
                    : {selectedTransaction.description}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 text-center text-[11px] text-zinc-800">
              <div>
                <div className="text-zinc-600">Mengetahui,</div>
                <div className="font-semibold">Waka Kesiswaan</div>
                <div className="h-14 flex items-end justify-center font-bold underline">
                  {schoolSetting.wakaKesiswaanName || schoolSetting.wakaName || 'Drs. H. Ahmad Fauzi, M.Pd'}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  {schoolSetting.wakaNip ? `NIP. ${schoolSetting.wakaNip}` : 'NIP. 197805122003121002'}
                </div>
              </div>

              <div>
                <div className="text-zinc-600">
                  {selectedTransaction.type === 'MASUK' ? 'Penyetor / Sumber' : 'Penerima Pembayaran'}
                </div>
                <div className="font-semibold">{selectedTransaction.recipientOrPayer || 'Pihak Terkait'}</div>
                <div className="h-14 flex items-end justify-center font-bold underline">
                  ( ........................................ )
                </div>
              </div>

              <div>
                <div className="text-zinc-600">Petugas Pemegang Kas,</div>
                <div className="font-semibold">{selectedTransaction.recordedByRole}</div>
                <div className="h-14 flex items-end justify-center font-bold underline">
                  {selectedTransaction.recordedByName}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">Verifikasi Sistem Digital</div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-zinc-200">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Lembar Kwitansi</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 9. MODAL: PREVIEW LAMPIRAN BUKTI NOTA */}
      <Modal
        isOpen={isAttachmentPreviewOpen}
        onClose={() => setIsAttachmentPreviewOpen(false)}
        title="Pratinjau Bukti / Nota Transaksi"
        size="md"
      >
        <div className="space-y-3 text-center p-2">
          {previewAttachmentUrl ? (
            <div className="rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 p-2">
              <img
                src={previewAttachmentUrl}
                alt="Bukti Kwitansi"
                className="max-h-96 mx-auto object-contain rounded"
                onError={e => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <a
                href={previewAttachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center space-x-1 text-xs text-blue-400 hover:underline"
              >
                <span>Buka URL Lampiran di Tab Baru</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <p className="text-xs text-zinc-400 py-6">Tidak ada tautan lampiran bukti.</p>
          )}
        </div>
      </Modal>

      {/* 10. Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Hapus ${itemToDelete?.type === 'transaction' ? 'Transaksi Kas' : 'Akun Kas'}?`}
        message={`Apakah Anda yakin ingin menghapus "${itemToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        type="danger"
      />
    </div>
  );
};
