import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  UserCheck,
  Edit3,
  Check,
  Users,
  Calendar,
  MapPin,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { PrintSignatory, SchoolSetting, Teacher } from '../../types';
import { moveSignatoryOrder } from '../../utils/printSignatureHelper';

interface DynamicSignaturesBlockProps {
  signatories: PrintSignatory[];
  onChange: (signatories: PrintSignatory[]) => void;
  activeSlotsCount: 1 | 2 | 3;
  onSlotsCountChange?: (count: 1 | 2 | 3) => void;
  onResetToDefault?: () => void;
  schoolInfo?: Partial<SchoolSetting>;
  teachersList?: Teacher[];
  defaultCity?: string;
  className?: string;
  isEditableInPreview?: boolean;
}

export const DynamicSignaturesBlock: React.FC<DynamicSignaturesBlockProps> = ({
  signatories,
  onChange,
  activeSlotsCount,
  onSlotsCountChange,
  onResetToDefault,
  schoolInfo,
  teachersList = [],
  defaultCity = 'Bula',
  className = '',
  isEditableInPreview = true
}) => {
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<PrintSignatory>>({});

  // Sort signatories by order (0 = left, 1 = center, 2 = right)
  const sortedSignatories = [...signatories].sort((a, b) => a.order - b.order);

  // Active items based on activeSlotsCount
  const visibleSignatories = React.useMemo(() => {
    if (activeSlotsCount === 1) {
      // 1 Signatory: Show primary/rightmost official (or first available)
      return [sortedSignatories[sortedSignatories.length - 1] || sortedSignatories[0]];
    }
    if (activeSlotsCount === 2) {
      // 2 Signatories: Left and Right
      if (sortedSignatories.length >= 3) {
        return [sortedSignatories[0], sortedSignatories[2]];
      }
      return sortedSignatories.slice(0, 2);
    }
    // 3 Signatories: Left, Center, Right
    return sortedSignatories.slice(0, 3);
  }, [sortedSignatories, activeSlotsCount]);

  // Handle moving signatory position with arrow buttons
  const handleMove = (visibleIndex: number, direction: 'left' | 'right') => {
    const targetSig = visibleSignatories[visibleIndex];
    if (!targetSig) return;
    const realIndex = sortedSignatories.findIndex(s => s.id === targetSig.id);
    if (realIndex === -1) return;

    const updated = moveSignatoryOrder(sortedSignatories, realIndex, direction);

    // Auto-update rightmost signatory's prefix with City & Date if it was on previous rightmost
    const city = defaultCity || schoolInfo?.defaultCity || 'Bula';
    const currentDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const normalizedWithPrefixes = updated.map((sig, i) => {
      const isRightmost = i === updated.length - 1;
      if (isRightmost) {
        // Ensure rightmost has city and date if prefix is empty or previously just an approving word
        if (!sig.prefix || sig.prefix.trim() === 'Menyetujui,' || sig.prefix.trim() === 'Mengetahui,') {
          return {
            ...sig,
            prefix: `${city}, ${currentDate}`
          };
        }
      } else {
        // Non-rightmost should not have city date as prefix unless user explicitly typed it
        if (sig.prefix?.startsWith(city) || sig.prefix?.includes(currentDate)) {
          return {
            ...sig,
            prefix: i === 0 ? '' : 'Menyetujui,'
          };
        }
      }
      return sig;
    });

    onChange(normalizedWithPrefixes);
  };

  // Open modal/popover to edit signatory details
  const handleStartEdit = (sig: PrintSignatory) => {
    setEditingSlotId(sig.id);
    setEditFormData({ ...sig });
  };

  // Save signatory details
  const handleSaveEdit = (sigId: string) => {
    const updated = signatories.map(s => {
      if (s.id === sigId) {
        return {
          ...s,
          ...editFormData
        };
      }
      return s;
    });
    onChange(updated);
    setEditingSlotId(null);
  };

  // Quick select an official from presets (Kepala Madrasah, Waka, Guru, etc.)
  const handleSelectOfficialPreset = (type: 'principal' | 'waka' | 'bk' | 'teacher', teacherId?: string) => {
    if (type === 'principal') {
      setEditFormData(prev => ({
        ...prev,
        roleTitle: 'Kepala Madrasah',
        name: schoolInfo?.principalName || 'Zakaria, S.Pd.I., M.Pd',
        nipOrIdentifier: schoolInfo?.principalNip || '197808102005011007',
        customSubtitle: 'Penanggung Jawab Madrasah'
      }));
    } else if (type === 'waka') {
      setEditFormData(prev => ({
        ...prev,
        roleTitle: 'Waka Bidang Kesiswaan',
        name: schoolInfo?.wakaKesiswaanName || schoolInfo?.wakaName || 'Puput Eka Bajuri, S.Pd., M.Or',
        nipOrIdentifier: schoolInfo?.wakaNip || '198806082023211020',
        customSubtitle: 'Pimpinan Kesiswaan'
      }));
    } else if (type === 'bk') {
      setEditFormData(prev => ({
        ...prev,
        roleTitle: 'Koordinator Guru BK',
        name: 'Dra. Hj. Nurhayati, M.Pd.',
        nipOrIdentifier: '197204121998032001',
        customSubtitle: 'Pamong Bimbingan & Kedisiplinan'
      }));
    } else if (type === 'teacher' && teacherId) {
      const teacher = teachersList.find(t => t.id === teacherId);
      if (teacher) {
        setEditFormData(prev => ({
          ...prev,
          roleTitle: teacher.role || (teacher.isPembina ? 'Guru Pembina' : 'Guru Mata Pelajaran'),
          name: teacher.fullName || teacher.name || 'Guru Madrasah',
          nipOrIdentifier: teacher.nip || '-',
          customSubtitle: teacher.subject ? `Guru ${teacher.subject}` : 'Pembina Madrasah'
        }));
      }
    }
  };

  return (
    <div className={`w-full font-serif ${className}`}>
      {/* ============================================================== */}
      {/* PRINT-HIDDEN INTERACTIVE TOOLBAR (Di Layar Preview Saja) */}
      {/* ============================================================== */}
      {isEditableInPreview && (
        <div className="print:hidden mb-4 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs font-sans space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Format Penanda Tangan Dokumen:</span>
              </span>
              {onSlotsCountChange && (
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => onSlotsCountChange(1)}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                      activeSlotsCount === 1
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    1 Orang
                  </button>
                  <button
                    type="button"
                    onClick={() => onSlotsCountChange(2)}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                      activeSlotsCount === 2
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    2 Orang (Kiri - Kanan)
                  </button>
                  <button
                    type="button"
                    onClick={() => onSlotsCountChange(3)}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                      activeSlotsCount === 3
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    3 Orang (Kiri - Tengah - Kanan)
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onResetToDefault && (
                <button
                  type="button"
                  onClick={onResetToDefault}
                  className="px-2.5 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1 transition-colors"
                  title="Kembalikan format susunan tanda tangan ke default awal"
                >
                  <RotateCcw className="w-3 h-3 text-slate-500" />
                  <span>Reset Default</span>
                </button>
              )}
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                *Gunakan tombol anak panah ⬅ ➡ untuk menggeser posisi tanda tangan
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SIGNATURE GRID BLOCK (Tampil Rapi di Layar & Cetak Fisik) */}
      {/* ============================================================== */}
      <div
        className={`pt-4 break-inside-avoid print:break-inside-avoid ${
          activeSlotsCount === 1
            ? 'flex justify-end'
            : activeSlotsCount === 2
            ? 'flex justify-between items-start gap-8'
            : 'grid grid-cols-3 gap-4'
        }`}
      >
        {visibleSignatories.map((sig, idx) => {
          const isLeft = idx === 0 && activeSlotsCount > 1;
          const isCenter = idx === 1 && activeSlotsCount === 3;
          const isRight =
            (activeSlotsCount === 1) ||
            (activeSlotsCount === 2 && idx === 1) ||
            (activeSlotsCount === 3 && idx === 2);

          const isEditing = editingSlotId === sig.id;

          return (
            <div
              key={sig.id}
              className={`flex-1 text-center font-serif text-[11px] leading-relaxed relative ${
                activeSlotsCount === 1 ? 'max-w-xs' : ''
              }`}
            >
              {/* INTERACTIVE CONTROLS (PRINT:HIDDEN) */}
              {isEditableInPreview && (
                <div className="print:hidden mb-2 p-1.5 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-lg border border-indigo-200/80 dark:border-indigo-800/60 font-sans flex items-center justify-between gap-1 shadow-sm">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'left')}
                      className="p-1 rounded bg-white dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 disabled:opacity-30 disabled:hover:bg-transparent shadow-xs transition-colors"
                      title="Geser Posisi ke Kiri (⬅)"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === visibleSignatories.length - 1}
                      onClick={() => handleMove(idx, 'right')}
                      className="p-1 rounded bg-white dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 disabled:opacity-30 disabled:hover:bg-transparent shadow-xs transition-colors"
                      title="Geser Posisi ke Kanan (➡)"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="text-[10px] font-bold text-indigo-900 dark:text-indigo-300 uppercase">
                    Slot {idx + 1}: {isLeft ? 'Kiri' : isCenter ? 'Tengah' : 'Kanan'}
                  </span>

                  <button
                    type="button"
                    onClick={() => (isEditing ? handleSaveEdit(sig.id) : handleStartEdit(sig))}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 border border-slate-200 dark:border-slate-700 flex items-center gap-1 shadow-xs"
                    title="Edit Nama / Jabatan Penanda Tangan"
                  >
                    {isEditing ? (
                      <>
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Selesai</span>
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-2.5 h-2.5 text-indigo-600" />
                        <span>Edit</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* EDIT FORM POPUP / INLINE (PRINT:HIDDEN) */}
              {isEditing && (
                <div className="print:hidden p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-300 dark:border-indigo-700 shadow-lg text-left text-xs font-sans space-y-2.5 mb-3 animate-in fade-in">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      Ubah Penanda Tangan (Slot {idx + 1})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(sig.id)}
                      className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700"
                    >
                      Simpan
                    </button>
                  </div>

                  {/* Preset Buttons */}
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                      Pilih Pejabat Cepat:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => handleSelectOfficialPreset('principal')}
                        className="px-2 py-0.5 text-[10px] rounded bg-slate-100 hover:bg-indigo-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-medium"
                      >
                        Kepala Madrasah
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectOfficialPreset('waka')}
                        className="px-2 py-0.5 text-[10px] rounded bg-slate-100 hover:bg-indigo-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-medium"
                      >
                        Waka Kesiswaan
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectOfficialPreset('bk')}
                        className="px-2 py-0.5 text-[10px] rounded bg-slate-100 hover:bg-indigo-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-medium"
                      >
                        Guru BK
                      </button>
                    </div>
                  </div>

                  {teachersList.length > 0 && (
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                        Atau Pilih dari Daftar Dewan Guru:
                      </label>
                      <select
                        onChange={e => {
                          if (e.target.value) handleSelectOfficialPreset('teacher', e.target.value);
                        }}
                        defaultValue=""
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        <option value="">Pilih Guru Pembina / Wali Kelas...</option>
                        {teachersList.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.fullName || t.name} ({t.role || t.subject || 'Guru'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 block mb-0.5">
                      Teks Baris Atas / Tanggal / Frasa Pembuka
                    </label>
                    <input
                      type="text"
                      value={editFormData.prefix || ''}
                      onChange={e => setEditFormData({ ...editFormData, prefix: e.target.value })}
                      placeholder="Contoh: Bula, 27 September 2026 atau Mengetahui,"
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 block mb-0.5">
                      Jabatan Penanda Tangan *
                    </label>
                    <input
                      type="text"
                      value={editFormData.roleTitle || ''}
                      onChange={e => setEditFormData({ ...editFormData, roleTitle: e.target.value })}
                      placeholder="Contoh: Kepala Madrasah / Waka Kesiswaan / Guru BK"
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 block mb-0.5">
                      Nama Lengkap & Gelar *
                    </label>
                    <input
                      type="text"
                      value={editFormData.name || ''}
                      onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                      placeholder="Contoh: Zakaria, S.Pd.I., M.Pd"
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 block mb-0.5">
                      Nomor Induk Pegawai (NIP) / Keterangan
                    </label>
                    <input
                      type="text"
                      value={editFormData.nipOrIdentifier || ''}
                      onChange={e => setEditFormData({ ...editFormData, nipOrIdentifier: e.target.value })}
                      placeholder="Contoh: 197808102005011007 atau -"
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* OFFICIAL SIGNATURE TEXT OUTPUT (KEDINASAN RESMI KEMENAG) */}
              {/* ============================================================== */}
              <div className="font-serif text-slate-900">
                {/* Baris 1: Tanggal / Frasa Pembuka (e.g. "Bula, 27 September 2026" atau "Mengetahui,") */}
                <p className="min-h-[16px] text-[11px] font-sans">
                  {sig.prefix ? sig.prefix : '\u00A0'}
                </p>

                {/* Baris 2: Jabatan Penanda Tangan */}
                <p className="font-bold text-xs mt-0.5 text-slate-950 font-sans tracking-wide">
                  {sig.roleTitle}
                </p>

                {/* Spasi Ruang Tanda Tangan Fisik & Cap Basah (Tinggi Standar Kedinasan 60-70px) */}
                <div className="h-16 sm:h-20 flex items-center justify-center">
                  {/* Subtle placeholder line in screen preview, invisible in print */}
                  <span className="print:hidden text-[9px] font-sans text-slate-400 select-none">
                    (Ruang Tanda Tangan & Stempel)
                  </span>
                </div>

                {/* Baris 3: Nama Lengkap Penanda Tangan (Bold, Bergaris Bawah) */}
                <p className="font-bold underline text-xs text-slate-950 tracking-wide">
                  {sig.name || 'Nama Penanda Tangan'}
                </p>

                {/* Baris 4: NIP Pegawai */}
                {sig.nipOrIdentifier && sig.nipOrIdentifier !== '-' ? (
                  <p className="text-[10px] text-slate-700 font-sans mt-0.5 font-medium">
                    NIP. {sig.nipOrIdentifier}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-600 font-sans mt-0.5">
                    {sig.customSubtitle || 'Pamong Madrasah'}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
