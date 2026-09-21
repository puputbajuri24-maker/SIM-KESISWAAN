import React from 'react';
import { Check, Edit2, RotateCcw, Layers, Search, Crown, Key, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Student, OsimMember, OsimSekbid } from '../../../types';

interface OsimMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMember: OsimMember | null;
  onSaveMember: (e: React.FormEvent) => Promise<void>;
  memberSelectionMode: 'db' | 'manual';
  setMemberSelectionMode: (mode: 'db' | 'manual') => void;
  isChangingSelectedStudent: boolean;
  setIsChangingSelectedStudent: (val: boolean) => void;
  memberForm: Partial<OsimMember>;
  setMemberForm: React.Dispatch<React.SetStateAction<Partial<OsimMember>>>;
  selectedClassFilter: string;
  setSelectedClassFilter: (val: string) => void;
  studentSearchTerm: string;
  setStudentSearchTerm: (val: string) => void;
  filteredStudentsForOsim: Student[];
  classesWithCounts: { totalCount: number; classList: { id: string; name: string; count: number }[] };
  osimMembers: OsimMember[];
  onSelectStudentForMember: (student: Student) => void;
  memberCategoryTab: 'bph' | 'sekbid';
  setMemberCategoryTab: (tab: 'bph' | 'sekbid') => void;
  sekbidList: string[];
  canManageOsimAccounts: boolean;
  memberLoginUsername: string;
  setMemberLoginUsername: (val: string) => void;
  memberLoginPassword: string;
  setMemberLoginPassword: (val: string) => void;
  showMemberLoginPassword: boolean;
  setShowMemberLoginPassword: (val: boolean) => void;
}

export const OsimMemberModal: React.FC<OsimMemberModalProps> = ({
  isOpen,
  onClose,
  selectedMember,
  onSaveMember,
  memberSelectionMode,
  setMemberSelectionMode,
  isChangingSelectedStudent,
  setIsChangingSelectedStudent,
  memberForm,
  setMemberForm,
  selectedClassFilter,
  setSelectedClassFilter,
  studentSearchTerm,
  setStudentSearchTerm,
  filteredStudentsForOsim,
  classesWithCounts,
  osimMembers,
  onSelectStudentForMember,
  memberCategoryTab,
  setMemberCategoryTab,
  sekbidList,
  canManageOsimAccounts,
  memberLoginUsername,
  setMemberLoginUsername,
  memberLoginPassword,
  setMemberLoginPassword,
  showMemberLoginPassword,
  setShowMemberLoginPassword
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedMember ? 'Ubah Data Pengurus OSIM' : 'Tambah Pengurus / BPH / Sekbid OSIM'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={onSaveMember} className="space-y-3">
        {/* Header Mode Seleksi Siswa */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-900/90 border border-zinc-800 p-1.5 rounded-lg gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setMemberSelectionMode('db');
                setIsChangingSelectedStudent(false);
              }}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                memberSelectionMode === 'db'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Pilih dari Data Siswa Madrasah
            </button>
            <button
              type="button"
              onClick={() => setMemberSelectionMode('manual')}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                memberSelectionMode === 'manual'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              Input Manual
            </button>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono px-2">
            {memberSelectionMode === 'db' ? 'Filter Kelas Grid Aktif' : 'Pengetikan Manual'}
          </span>
        </div>

        {/* Mode Database: Siswa Picker dengan Filter Kelas Grid */}
        {memberSelectionMode === 'db' && (
          <>
            {memberForm.fullName && !isChangingSelectedStudent ? (
              /* Card Siswa yang Sedang Terpilih */
              <div className="bg-amber-950/20 border border-amber-500/40 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {memberForm.photoUrl ? (
                    <img
                      src={memberForm.photoUrl}
                      alt={memberForm.fullName}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-full object-cover border-2 border-amber-500/50 shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/40 shrink-0 text-base">
                      {memberForm.fullName?.charAt(0) || 'S'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        Siswa Terpilih dari Database
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300">
                        {memberForm.className}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-zinc-100 mt-1 truncate">{memberForm.fullName}</h4>
                    <p className="text-[11px] text-zinc-400 font-mono">NIS: {memberForm.studentNis || '-'} • Kontak: {memberForm.phone || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setIsChangingSelectedStudent(true)}
                    className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Ganti Siswa Lain
                  </button>
                </div>
              </div>
            ) : (
              /* Pemilih Siswa dengan Grid Filter Kelas */
              <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    Filter Kelas (Pilih Kelas):
                  </label>
                  <span className="text-[10px] text-amber-400/90 font-mono">
                    {filteredStudentsForOsim.length} siswa ditemukan
                  </span>
                </div>

                {/* Filter Kelas dalam Bentuk Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 max-h-32 overflow-y-auto p-1 bg-zinc-900/80 rounded border border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => setSelectedClassFilter('all')}
                    className={`px-2 py-1.5 rounded text-[11px] font-medium transition flex items-center justify-between gap-1 ${
                      selectedClassFilter === 'all'
                        ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
                        : 'bg-zinc-800/90 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/60'
                    }`}
                    title="Tampilkan semua siswa dari semua kelas"
                  >
                    <span className="truncate">Semua</span>
                    <span className={`text-[9px] px-1 rounded ${
                      selectedClassFilter === 'all' ? 'bg-amber-600/40 text-zinc-950 font-black' : 'bg-zinc-900 text-zinc-400'
                    }`}>
                      {classesWithCounts.totalCount}
                    </span>
                  </button>

                  {classesWithCounts.classList.map(cls => {
                    const isSelected = selectedClassFilter === cls.id || selectedClassFilter === cls.name;
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => setSelectedClassFilter(cls.name || cls.id)}
                        className={`px-2 py-1.5 rounded text-[11px] font-medium transition flex items-center justify-between gap-1 ${
                          isSelected
                            ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
                            : 'bg-zinc-800/90 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/60'
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

                {/* Pencarian Cepat Nama / NIS */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Cari siswa berdasarkan nama lengkap atau NIS..."
                    value={studentSearchTerm}
                    onChange={e => setStudentSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-8 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                  {studentSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setStudentSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Grid Kartu Siswa */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {filteredStudentsForOsim.length > 0 ? (
                    filteredStudentsForOsim.map(student => {
                      const isSelected = memberForm.studentNis === student.nis && memberForm.fullName === student.fullName;
                      const existingOsim = osimMembers.find(
                        m => (m.studentNis && m.studentNis === student.nis) ||
                             m.fullName.toLowerCase() === student.fullName.toLowerCase()
                      );

                      return (
                        <div
                          key={student.id}
                          onClick={() => onSelectStudentForMember(student)}
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
                              <div className="flex items-center gap-1.5">
                                <h5 className="font-bold text-xs text-zinc-100 truncate">{student.fullName}</h5>
                                {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono mt-0.5">
                                <span className="px-1 py-0.2 bg-zinc-800 rounded text-zinc-300 font-semibold">{student.className}</span>
                                <span>• NIS {student.nis || '-'}</span>
                              </div>
                              {existingOsim && (
                                <div className="mt-0.5">
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-medium truncate inline-block max-w-[170px]">
                                    {existingOsim.position} ({existingOsim.sekbid?.startsWith('BPH') ? 'BPH' : 'Sekbid'})
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectStudentForMember(student);
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-semibold shrink-0 transition ${
                              isSelected
                                ? 'bg-amber-500 text-zinc-950'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                            }`}
                          >
                            {isSelected ? 'Terpilih' : 'Pilih'}
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-1 sm:col-span-2 text-center py-6 border border-dashed border-zinc-800 rounded-lg">
                      <p className="text-xs text-zinc-400">Tidak ada siswa yang sesuai pencarian atau kelas ini.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClassFilter('all');
                          setStudentSearchTerm('');
                        }}
                        className="mt-1.5 text-xs text-amber-400 hover:underline"
                      >
                        Reset filter kelas & pencarian
                      </button>
                    </div>
                  )}
                </div>

                {isChangingSelectedStudent && memberForm.fullName && (
                  <div className="pt-1 text-right">
                    <button
                      type="button"
                      onClick={() => setIsChangingSelectedStudent(false)}
                      className="text-xs text-zinc-400 hover:text-zinc-200 underline"
                    >
                      Batal ganti, tetap gunakan {memberForm.fullName}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Mode Manual: Input Nama, NIS, dan Kelas Manual */}
        {memberSelectionMode === 'manual' && (
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-3 space-y-2.5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Nama Lengkap Siswa *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Muhammad Al-Fatih"
                value={memberForm.fullName || ''}
                onChange={e => setMemberForm({ ...memberForm, fullName: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">NIS Siswa</label>
                <input
                  type="text"
                  placeholder="24251001"
                  value={memberForm.studentNis || ''}
                  onChange={e => setMemberForm({ ...memberForm, studentNis: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Kelas</label>
                <input
                  type="text"
                  placeholder="XI RPL 1"
                  value={memberForm.className || ''}
                  onChange={e => setMemberForm({ ...memberForm, className: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Penugasan Jabatan & Struktur OSIM */}
        <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-3 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2">
            <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              Struktur Penugasan OSIM:
            </label>
            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded border border-zinc-800 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setMemberCategoryTab('bph');
                  setMemberForm(prev => ({
                    ...prev,
                    sekbid: 'BPH (Badan Pengurus Harian)',
                    position: prev.position?.includes('Ketua') || prev.position?.includes('Sekretaris') || prev.position?.includes('Bendahara')
                      ? prev.position
                      : 'Ketua Umum OSIM'
                  }));
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  memberCategoryTab === 'bph'
                    ? 'bg-amber-500 text-zinc-950 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Badan Pengurus Harian (BPH)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMemberCategoryTab('sekbid');
                  setMemberForm(prev => ({
                    ...prev,
                    sekbid: (prev.sekbid && prev.sekbid !== 'BPH (Badan Pengurus Harian)')
                      ? prev.sekbid
                      : ((sekbidList.find(s => !s.startsWith('BPH')) || 'Sekbid 1: Keimanan, Ketaqwaan & Moderasi Beragama') as OsimSekbid),
                    position: prev.position === 'Ketua Umum OSIM' ? 'Ketua Sekbid' : (prev.position || 'Anggota Sekbid')
                  }));
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  memberCategoryTab === 'sekbid'
                    ? 'bg-amber-500 text-zinc-950 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Seksi Bidang (Sekbid)
              </button>
            </div>
          </div>

          {memberCategoryTab === 'bph' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Jabatan BPH *</label>
                <select
                  value={memberForm.position || 'Ketua Umum OSIM'}
                  onChange={e => setMemberForm({ ...memberForm, position: e.target.value as any })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Ketua Umum OSIM">Ketua Umum OSIM</option>
                  <option value="Wakil Ketua 1">Wakil Ketua 1 (Bidang Internal)</option>
                  <option value="Wakil Ketua 2">Wakil Ketua 2 (Bidang Eksternal)</option>
                  <option value="Sekretaris Umum">Sekretaris Umum</option>
                  <option value="Wakil Sekretaris">Wakil Sekretaris</option>
                  <option value="Bendahara Umum">Bendahara Umum</option>
                  <option value="Wakil Bendahara">Wakil Bendahara</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Entitas Kepengurusan</label>
                <input
                  type="text"
                  disabled
                  value="BPH (Badan Pengurus Harian)"
                  className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded text-xs text-amber-400 font-mono"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Pilih Seksi Bidang (Sekbid) *</label>
                <select
                  value={memberForm.sekbid || sekbidList.find(s => !s.startsWith('BPH')) || ''}
                  onChange={e => setMemberForm({ ...memberForm, sekbid: e.target.value as OsimSekbid })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  {sekbidList.filter(s => !s.startsWith('BPH')).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Posisi dalam Sekbid *</label>
                <select
                  value={memberForm.position || 'Ketua Sekbid'}
                  onChange={e => setMemberForm({ ...memberForm, position: e.target.value as any })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Ketua Sekbid">Ketua Sekbid (Koordinator)</option>
                  <option value="Wakil Ketua Sekbid">Wakil Ketua Sekbid</option>
                  <option value="Sekretaris Bidang">Sekretaris Bidang</option>
                  <option value="Bendahara Bidang">Bendahara Bidang</option>
                  <option value="Anggota Sekbid">Anggota Sekbid</option>
                  <option value="Koordinator Divisi">Koordinator Divisi</option>
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">No. WhatsApp / HP</label>
              <input
                type="text"
                placeholder="081234567890"
                value={memberForm.phone || ''}
                onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Status Keaktifan</label>
              <select
                value={memberForm.status || 'Aktif'}
                onChange={e => setMemberForm({ ...memberForm, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Aktif">Aktif Menjabat</option>
                <option value="Demisioner">Demisioner / Purna Tugas</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Program Unggulan / Amanah yang Diusung</label>
            <input
              type="text"
              placeholder="Contoh: Digitalisasi E-Voting & Madrasah Hijau Ramah Lingkungan"
              value={memberForm.flagshipProgram || ''}
              onChange={e => setMemberForm({ ...memberForm, flagshipProgram: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Visi Singkat / Komitmen Pengurus</label>
            <textarea
              rows={2}
              placeholder="Tuliskan motivasi, komitmen atau visi pengurus..."
              value={memberForm.vision || ''}
              onChange={e => setMemberForm({ ...memberForm, vision: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Otorisasi Pembina OSIM: Manajemen Akun & Kata Sandi Siswa */}
          {canManageOsimAccounts && (
            <div className="bg-amber-950/20 border border-amber-500/40 rounded-lg p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
                  <Key className="w-3.5 h-3.5" />
                  <span>Akun & Kata Sandi Login Pengurus (Hak Akses Pembina)</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                  KENDALI PENUH
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Pembina OSIM memiliki wewenang penuh mengatur akses login anggota OSIM. Jika Anda merubah kata sandi di bawah ini, password lama siswa akan otomatis langsung tergantikan.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1">Username Login Siswa</label>
                  <input
                    type="text"
                    placeholder="Contoh: 24251001 atau osim.ketua"
                    value={memberLoginUsername}
                    onChange={e => setMemberLoginUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1">Kata Sandi Login</label>
                  <div className="relative">
                    <input
                      type={showMemberLoginPassword ? 'text' : 'password'}
                      placeholder="Masukkan password baru"
                      value={memberLoginPassword}
                      onChange={e => setMemberLoginPassword(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMemberLoginPassword(!showMemberLoginPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                    >
                      {showMemberLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-zinc-800">
          <div className="text-xs text-zinc-400">
            {!memberForm.fullName ? (
              <span className="text-amber-400 font-medium">* Silakan pilih siswa dari daftar kelas di atas</span>
            ) : (
              <span className="text-emerald-400 font-medium">✓ Data {memberForm.fullName} ({memberForm.className}) siap disimpan</span>
            )}
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!memberForm.fullName}
              className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Check className="w-3.5 h-3.5" />
              Simpan Pengurus
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
