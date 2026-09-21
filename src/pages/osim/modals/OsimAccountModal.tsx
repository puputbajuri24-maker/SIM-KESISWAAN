import React, { useState } from 'react';
import { Key, Eye, EyeOff, Check, GraduationCap, RotateCcw, Search } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Student, UserProfile, OsimDepartment } from '../../../types';
import { getDefaultOsimPassword } from '../../../services/seedData';

export interface OsimAccountFormData {
  displayName: string;
  username: string;
  email: string;
  password: string;
  osimRole: 'ketua' | 'wakil' | 'sekretaris' | 'bendahara' | 'sekbid';
  osimPosition: string;
  osimDepartmentName: string;
  status: 'Aktif' | 'Nonaktif';
  isCashManager: boolean;
}

interface OsimAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAddingOsimAccount: boolean;
  selectedOsimAccount: UserProfile | null;
  osimAccountForm: OsimAccountFormData;
  setOsimAccountForm: React.Dispatch<React.SetStateAction<OsimAccountFormData>>;
  onSaveOsimAccount: (e: React.FormEvent) => Promise<void>;
  showFormPassword: boolean;
  setShowFormPassword: React.Dispatch<React.SetStateAction<boolean>>;
  osimDepartments: OsimDepartment[];
  osimAccounts: UserProfile[];
  // Grid Selection Props
  selectedStudentForAccount: Student | null;
  isChangingStudentForAccount: boolean;
  setIsChangingStudentForAccount: (val: boolean) => void;
  filteredStudentsForAccount: Student[];
  classesWithCounts: { totalCount: number; classList: { id: string; name: string; count: number }[] };
  accountSelectedClassFilter: string;
  setAccountSelectedClassFilter: (val: string) => void;
  accountStudentSearchTerm: string;
  setAccountStudentSearchTerm: (val: string) => void;
  onSelectStudentForAccount: (student: Student) => void;
}

export const OsimAccountModal: React.FC<OsimAccountModalProps> = ({
  isOpen,
  onClose,
  isAddingOsimAccount,
  selectedOsimAccount,
  osimAccountForm,
  setOsimAccountForm,
  onSaveOsimAccount,
  showFormPassword,
  setShowFormPassword,
  osimDepartments,
  osimAccounts,
  selectedStudentForAccount,
  isChangingStudentForAccount,
  setIsChangingStudentForAccount,
  filteredStudentsForAccount,
  classesWithCounts,
  accountSelectedClassFilter,
  setAccountSelectedClassFilter,
  accountStudentSearchTerm,
  setAccountStudentSearchTerm,
  onSelectStudentForAccount
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isAddingOsimAccount ? 'Tambah Akun Login Pengurus OSIM' : `Edit Akun & Password: ${selectedOsimAccount?.displayName || ''}`}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={onSaveOsimAccount} className="space-y-4 text-xs">
        <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-lg flex items-start gap-2.5">
          <Key className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-zinc-300 text-[11px] leading-relaxed">
            Hak Akses Pembina: Setiap akun pengurus OSIM otomatis tersinkronisasi dengan <strong>Struktur Kabinet</strong> dan <strong>cPanel Admin</strong>. Password lama otomatis tidak dapat digunakan lagi.
          </p>
        </div>

        {/* PILIHAN DATA SISWA & KELAS DALAM BENTUK GRID (KHUSUS TAMBAH AKUN) */}
        {isAddingOsimAccount && (
          <div className="space-y-3 bg-zinc-950/60 border border-zinc-800 p-3.5 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" />
                Pilih Data Siswa & Kelas (Grid Selection) *
              </label>
              <span className="text-[10px] text-zinc-400 font-mono">
                {selectedStudentForAccount ? '1 Siswa Terpilih' : `${filteredStudentsForAccount.length} Siswa Tersedia`}
              </span>
            </div>

            {selectedStudentForAccount && !isChangingStudentForAccount ? (
              /* Card Siswa Terpilih */
              <div className="bg-amber-950/30 border border-amber-500/50 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {selectedStudentForAccount.photoUrl ? (
                    <img
                      src={selectedStudentForAccount.photoUrl}
                      alt={selectedStudentForAccount.fullName}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover border-2 border-amber-500/60 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center border border-amber-500/40 shrink-0 text-base">
                      {selectedStudentForAccount.fullName.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        Siswa Terpilih dari Database
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-200 border border-zinc-700">
                        Kelas {selectedStudentForAccount.className}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-zinc-100 mt-1 truncate">{selectedStudentForAccount.fullName}</h4>
                    <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      NIS: {selectedStudentForAccount.nis || '-'} • Kontak: {selectedStudentForAccount.phone || '-'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsChangingStudentForAccount(true)}
                  className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 shrink-0 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  Ganti Siswa Lain
                </button>
              </div>
            ) : (
              /* Grid Filter Kelas & Grid Siswa */
              <div className="space-y-2.5">
                {/* Grid Filter Kelas */}
                <div>
                  <span className="text-[11px] text-zinc-400 font-medium block mb-1.5">
                    1. Pilih Kelas Siswa:
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 max-h-28 overflow-y-auto p-1 bg-zinc-900/90 rounded border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setAccountSelectedClassFilter('all')}
                      className={`px-2 py-1.5 rounded text-[11px] font-medium transition flex items-center justify-between gap-1 ${
                        accountSelectedClassFilter === 'all'
                          ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60'
                      }`}
                      title="Tampilkan semua siswa dari semua kelas"
                    >
                      <span className="truncate">Semua</span>
                      <span className={`text-[9px] px-1 rounded ${
                        accountSelectedClassFilter === 'all' ? 'bg-amber-600/40 text-zinc-950 font-black' : 'bg-zinc-900 text-zinc-400'
                      }`}>
                        {classesWithCounts.totalCount}
                      </span>
                    </button>

                    {classesWithCounts.classList.map(cls => {
                      const isSelected = accountSelectedClassFilter === cls.id || accountSelectedClassFilter === cls.name;
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => setAccountSelectedClassFilter(cls.name || cls.id)}
                          className={`px-2 py-1.5 rounded text-[11px] font-medium transition flex items-center justify-between gap-1 ${
                            isSelected
                              ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60'
                          }`}
                          title={`Filter kelas ${cls.name}`}
                        >
                          <span className="truncate">{cls.name}</span>
                          <span className={`text-[9px] px-1 rounded ${
                            isSelected ? 'bg-amber-600/40 text-zinc-950 font-black' : 'bg-zinc-900 text-zinc-400'
                          }`}>
                            {cls.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Input Cari Siswa */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Cari siswa berdasarkan nama lengkap atau NIS..."
                    value={accountStudentSearchTerm}
                    onChange={e => setAccountStudentSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-8 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                  {accountStudentSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setAccountStudentSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Grid Pilihan Siswa */}
                <div>
                  <span className="text-[11px] text-zinc-400 font-medium block mb-1">
                    2. Klik Siswa untuk Memilih:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {filteredStudentsForAccount.length > 0 ? (
                      filteredStudentsForAccount.map(student => {
                        const isSelected = selectedStudentForAccount?.id === student.id || osimAccountForm.displayName === student.fullName;
                        const hasExistingAccount = osimAccounts.some(
                          u => (u.nip && u.nip === student.nis) || (u.displayName.toLowerCase() === student.fullName.toLowerCase())
                        );

                        return (
                          <div
                            key={student.id}
                            onClick={() => onSelectStudentForAccount(student)}
                            className={`p-2 rounded-lg border transition cursor-pointer flex items-center justify-between gap-2 text-left ${
                              isSelected
                                ? 'bg-amber-500/20 border-amber-500 text-amber-200 ring-1 ring-amber-500'
                                : 'bg-zinc-900/90 border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800/80 text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {student.photoUrl ? (
                                <img
                                  src={student.photoUrl}
                                  alt={student.fullName}
                                  referrerPolicy="no-referrer"
                                  className="w-8 h-8 rounded-full object-cover border border-zinc-700 shrink-0"
                                />
                              ) : (
                                <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                                  student.gender === 'P'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                }`}>
                                  {student.fullName.charAt(0)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-semibold text-xs text-zinc-100 truncate">{student.fullName}</div>
                                <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
                                  <span>NIS: {student.nis}</span>
                                  <span>•</span>
                                  <span className="text-amber-400/90">{student.className}</span>
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-1">
                              {hasExistingAccount && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                  Ada Akun
                                </span>
                              )}
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                                isSelected ? 'bg-amber-500 border-amber-500 text-zinc-950' : 'border-zinc-700 text-transparent'
                              }`}>
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-2 p-6 text-center text-zinc-500 bg-zinc-900/60 rounded border border-zinc-800">
                        Tidak ada siswa yang sesuai dengan filter kelas & pencarian ini.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-zinc-300 mb-1">Nama Lengkap Siswa *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Muhammad Farhan Al-Fatih"
              value={osimAccountForm.displayName}
              onChange={e => setOsimAccountForm({ ...osimAccountForm, displayName: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Username Login *</label>
            <input
              type="text"
              required
              placeholder="Contoh: 24251001 atau osim.ketua"
              value={osimAccountForm.username}
              onChange={e => setOsimAccountForm({ ...osimAccountForm, username: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Email Kredensial *</label>
            <input
              type="email"
              required
              placeholder="email@madrasah.sch.id"
              value={osimAccountForm.email}
              onChange={e => setOsimAccountForm({ ...osimAccountForm, email: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Kategori Kepengurusan *</label>
            <select
              value={osimAccountForm.osimRole}
              onChange={e => {
                const newRole = e.target.value as any;
                const defaultP = getDefaultOsimPassword(newRole);
                const isBph = newRole !== 'sekbid';
                setOsimAccountForm(prev => ({
                  ...prev,
                  osimRole: newRole,
                  password: defaultP,
                  osimPosition: newRole === 'ketua' ? 'Ketua Umum OSIM' :
                                newRole === 'wakil' ? 'Wakil Ketua OSIM' :
                                newRole === 'sekretaris' ? 'Sekretaris OSIM' :
                                newRole === 'bendahara' ? 'Bendahara OSIM' : 'Anggota Sekbid',
                  osimDepartmentName: isBph ? 'BPH (Badan Pengurus Harian)' : prev.osimDepartmentName,
                  isCashManager: newRole === 'bendahara'
                }));
              }}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              <option value="ketua">Ketua Umum OSIM</option>
              <option value="wakil">Wakil Ketua OSIM</option>
              <option value="sekretaris">Sekretaris OSIM</option>
              <option value="bendahara">Bendahara OSIM</option>
              <option value="sekbid">Pengurus / Sekbid OSIM</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Jabatan Spesifik</label>
            <input
              type="text"
              placeholder="Contoh: Koordinator Sekbid Keagamaan"
              value={osimAccountForm.osimPosition}
              onChange={e => setOsimAccountForm({ ...osimAccountForm, osimPosition: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-zinc-300 mb-1">Seksi Bidang / Departemen</label>
            <div className="flex gap-2">
              <select
                value={osimDepartments.some(d => d.name === osimAccountForm.osimDepartmentName) ? osimAccountForm.osimDepartmentName : 'custom'}
                onChange={e => {
                  if (e.target.value !== 'custom') {
                    setOsimAccountForm({ ...osimAccountForm, osimDepartmentName: e.target.value });
                  }
                }}
                className="w-1/2 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="BPH (Badan Pengurus Harian)">BPH (Badan Pengurus Harian)</option>
                {osimDepartments.map(d => (
                  <option key={d.id} value={d.name}>
                    {d.code}: {d.name}
                  </option>
                ))}
                <option value="custom">Ketik Nama Manual...</option>
              </select>
              <input
                type="text"
                placeholder="Nama Seksi Bidang / Departemen"
                value={osimAccountForm.osimDepartmentName}
                onChange={e => setOsimAccountForm({ ...osimAccountForm, osimDepartmentName: e.target.value })}
                className="w-1/2 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Status Akun Login</label>
            <select
              value={osimAccountForm.status}
              onChange={e => setOsimAccountForm({ ...osimAccountForm, status: e.target.value as any })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              <option value="Aktif">Aktif (Dapat Login)</option>
              <option value="Nonaktif">Nonaktif (Diblokir/Purna)</option>
            </select>
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={osimAccountForm.isCashManager}
                onChange={e => setOsimAccountForm({ ...osimAccountForm, isCashManager: e.target.checked })}
                className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500 w-4 h-4"
              />
              <span className="text-xs text-zinc-300 font-medium">Beri Hak Kelola Buku Kas OSIM</span>
            </label>
          </div>

          <div className="sm:col-span-2 pt-2 border-t border-zinc-800">
            <label className="block text-xs font-semibold text-amber-400 mb-1">
              {isAddingOsimAccount ? 'Kata Sandi Awal *' : 'Ganti Kata Sandi (Kosongkan jika tidak ingin merubah)'}
            </label>
            <div className="relative">
              <input
                type={showFormPassword ? 'text' : 'password'}
                placeholder={isAddingOsimAccount ? 'Masukkan password awal' : 'Ketik kata sandi baru untuk merubah'}
                value={osimAccountForm.password}
                onChange={e => setOsimAccountForm({ ...osimAccountForm, password: e.target.value })}
                className="w-full pl-3 pr-9 py-2 bg-zinc-900 border border-amber-500/40 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowFormPassword(!showFormPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                {showFormPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Kata sandi akan otomatis disinkronkan ke <strong>cPanel Admin</strong> dan <strong>Struktur Kabinet</strong>.
            </p>
          </div>
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
            className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            Simpan & Sinkronkan Akun
          </button>
        </div>
      </form>
    </Modal>
  );
};

interface OsimQuickResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOsimAccount: UserProfile | null;
  quickResetPasswordText: string;
  setQuickResetPasswordText: (val: string) => void;
  showQuickResetText: boolean;
  setShowQuickResetText: (val: boolean) => void;
  onConfirmReset: (e: React.FormEvent) => Promise<void>;
}

export const OsimQuickResetPasswordModal: React.FC<OsimQuickResetPasswordModalProps> = ({
  isOpen,
  onClose,
  selectedOsimAccount,
  quickResetPasswordText,
  setQuickResetPasswordText,
  showQuickResetText,
  setShowQuickResetText,
  onConfirmReset
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ubah Kata Sandi: ${selectedOsimAccount?.displayName || ''}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={onConfirmReset} className="space-y-4 text-xs">
        <div className="bg-amber-950/20 border border-amber-500/40 p-3 rounded-lg flex items-start gap-2.5">
          <Key className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-zinc-200 font-semibold text-xs">
              Otorisasi Khusus Pembina OSIM
            </p>
            <p className="text-zinc-400 text-[11px] mt-0.5 leading-relaxed">
              Anda sedang mengubah kata sandi login untuk siswa <strong>{selectedOsimAccount?.displayName}</strong> (@{selectedOsimAccount?.username}). Password lama otomatis digantikan dan tidak berlaku lagi.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Kata Sandi Baru *
          </label>
          <div className="relative">
            <input
              type={showQuickResetText ? 'text' : 'password'}
              required
              value={quickResetPasswordText}
              onChange={e => setQuickResetPasswordText(e.target.value)}
              placeholder="Masukkan kata sandi baru"
              className="w-full pl-3 pr-9 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowQuickResetText(!showQuickResetText)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
            >
              {showQuickResetText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedOsimAccount && (
            <button
              type="button"
              onClick={() => {
                const defaultP = getDefaultOsimPassword(selectedOsimAccount.osimDepartmentCode || selectedOsimAccount.osimRole || selectedOsimAccount.username);
                setQuickResetPasswordText(defaultP);
              }}
              className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-mono border border-amber-500/40 transition flex items-center gap-1"
            >
              <Key className="w-3 h-3 text-amber-400" />
              <span>Set Standar Sekbid ({getDefaultOsimPassword(selectedOsimAccount.osimDepartmentCode || selectedOsimAccount.osimRole || selectedOsimAccount.username)})</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setQuickResetPasswordText(`osim${new Date().getFullYear()}`)}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono border border-zinc-700 transition"
          >
            Set ke "osim{new Date().getFullYear()}"
          </button>
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
            className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            Simpan Kata Sandi Baru
          </button>
        </div>
      </form>
    </Modal>
  );
};
