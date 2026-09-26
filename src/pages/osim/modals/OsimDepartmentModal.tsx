import React, { useState, useMemo } from 'react';
import {
  Layers,
  Users,
  Search,
  Check,
  Sparkles,
  Info,
  Shield,
  Palette,
  Hash,
  FileText,
  UserCheck
} from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { OsimDepartment, Student, OsimMember } from '../../../types';
import { extractSekbidNumber } from '../../../utils/osimAccountHelper';

const COLOR_PRESETS = [
  { name: 'Emerald', value: '#10b981', bg: 'bg-emerald-500' },
  { name: 'Sky Blue', value: '#0ea5e9', bg: 'bg-sky-500' },
  { name: 'Amber Gold', value: '#f59e0b', bg: 'bg-amber-500' },
  { name: 'Purple', value: '#a855f7', bg: 'bg-purple-500' },
  { name: 'Rose Red', value: '#f43f5e', bg: 'bg-rose-500' },
  { name: 'Indigo', value: '#6366f1', bg: 'bg-indigo-500' },
  { name: 'Teal', value: '#14b8a6', bg: 'bg-teal-500' },
  { name: 'Zinc Slate', value: '#71717a', bg: 'bg-zinc-500' }
];

interface OsimDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDept: OsimDepartment | null;
  deptForm: Partial<OsimDepartment>;
  setDeptForm: React.Dispatch<React.SetStateAction<Partial<OsimDepartment>>>;
  onSaveDept: (e: React.FormEvent) => Promise<void>;
  students?: Student[];
  osimMembers?: OsimMember[];
}

export const OsimDepartmentModal: React.FC<OsimDepartmentModalProps> = ({
  isOpen,
  onClose,
  selectedDept,
  deptForm,
  setDeptForm,
  onSaveDept,
  students = [],
  osimMembers = []
}) => {
  const [studentSearch, setStudentSearch] = useState('');
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);

  // Filter active students for coordinator selection
  const candidateStudents = useMemo(() => {
    if (!studentSearch.trim()) return [];
    const q = studentSearch.toLowerCase().trim();
    return students
      .filter(s => s.status !== 'Keluar' && s.status !== 'Pindah' && !s.isDeleted)
      .filter(s =>
        s.fullName.toLowerCase().includes(q) ||
        (s.nis && s.nis.includes(q)) ||
        (s.className && s.className.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [students, studentSearch]);

  const handleSelectCoordinator = (student: Student) => {
    setDeptForm(prev => ({
      ...prev,
      coordinatorName: student.fullName
    }));
    setIsSearchingStudent(false);
    setStudentSearch('');
  };

  const isEditing = Boolean(selectedDept);
  const sekbidNum = extractSekbidNumber(deptForm.name || '');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Kelola & Ubah Seksi Bidang OSIM' : 'Tambah Seksi Bidang / Departemen OSIM Baru'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={onSaveDept} className="space-y-4">
        {/* Banner Info Sinkronisasi Otomatis */}
        <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200/90 leading-relaxed">
            <span className="font-semibold text-amber-300">Sinkronisasi 2-Arah Terintegrasi:</span> Mengisi nama Koordinator Bidang di sini akan otomatis menetapkannya sebagai <strong>Ketua Sekbid</strong> pada Struktur Kabinet dan menyinkronkan akun login di <strong>cPanel Kesiswaan</strong>.
          </div>
        </div>

        {/* Nama Bidang */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Nama Seksi Bidang / Departemen *
          </label>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="Contoh: Sekbid 1: Keimanan, Ketaqwaan & Moderasi Beragama"
              value={deptForm.name || ''}
              onChange={e => {
                const newName = e.target.value;
                const autoNum = extractSekbidNumber(newName);
                const suggestedCode = autoNum ? `SEKBID-${autoNum}` : deptForm.code;
                setDeptForm(prev => ({
                  ...prev,
                  name: newName,
                  code: prev.code ? prev.code : suggestedCode
                }));
              }}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500 pl-8 font-medium"
            />
            <Layers className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-3" />
          </div>
          <span className="text-[11px] text-zinc-400 mt-0.5 block">
            {sekbidNum ? `Terdeteksi sebagai Seksi Bidang ke-${sekbidNum}` : 'Gunakan format "Sekbid [Nomor]: [Nama Bidang]" untuk penomoran otomatis.'}
          </span>
        </div>

        {/* Kode Bidang & Urutan Tampilan */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Kode Singkatan *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="SEKBID-1 / BPH"
                value={deptForm.code || ''}
                onChange={e => setDeptForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500 pl-8 font-mono uppercase"
              />
              <Hash className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Nomor Urutan Tampilan *
            </label>
            <input
              type="number"
              min="0"
              max="20"
              required
              value={deptForm.sortOrder ?? 1}
              onChange={e => setDeptForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
        </div>

        {/* Koordinator / Ketua Sekbid */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-zinc-300">
              Koordinator / Ketua Sekbid
            </label>
            <button
              type="button"
              onClick={() => setIsSearchingStudent(!isSearchingStudent)}
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition"
            >
              <Search className="w-3 h-3" />
              {isSearchingStudent ? 'Tutup Pencarian' : 'Cari dari Buku Induk Siswa'}
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Ketik nama lengkap atau cari siswa..."
              value={deptForm.coordinatorName || ''}
              onChange={e => setDeptForm(prev => ({ ...prev, coordinatorName: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500 pl-8"
            />
            <UserCheck className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-3" />
          </div>

          {/* Student Search Dropdown */}
          {isSearchingStudent && (
            <div className="mt-2 p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl space-y-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik nama siswa atau NIS..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-200 pl-8 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1">
                {candidateStudents.length > 0 ? (
                  candidateStudents.map(student => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => handleSelectCoordinator(student)}
                      className="w-full text-left p-1.5 hover:bg-zinc-800/80 rounded flex items-center justify-between text-xs text-zinc-200 transition group"
                    >
                      <div>
                        <div className="font-medium group-hover:text-amber-400 transition">{student.fullName}</div>
                        <div className="text-[10px] text-zinc-400">NIS: {student.nis || '-'} • Kelas: {student.className}</div>
                      </div>
                      <span className="text-[10px] text-amber-500/80 font-semibold px-1.5 py-0.5 bg-amber-500/10 rounded">Pilih</span>
                    </button>
                  ))
                ) : (
                  <div className="text-[11px] text-zinc-500 text-center py-2">
                    {studentSearch.trim() ? 'Tidak ada siswa yang cocok.' : 'Ketik nama siswa untuk mencari...'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pilihan Aksen Warna Bidang */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            Warna Aksen Bidang
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_PRESETS.map(preset => {
              const isSelected = (deptForm.color || '#10b981') === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setDeptForm(prev => ({ ...prev, color: preset.value }))}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition ${
                    isSelected
                      ? 'border-zinc-200 bg-zinc-800 text-white shadow'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${preset.bg}`} />
                  <span className="text-[11px]">{preset.name}</span>
                  {isSelected && <Check className="w-3 h-3 text-emerald-400 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Deskripsi Tugas Pokok Bidang */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Deskripsi & Fokus Program Kerja Bidang
          </label>
          <textarea
            rows={3}
            placeholder="Jelaskan ruang lingkup, tanggung jawab, dan misi kerja seksi bidang ini..."
            value={deptForm.description || ''}
            onChange={e => setDeptForm(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-semibold transition"
          >
            Batal
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold tracking-wide transition shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            {isEditing ? 'Simpan Perubahan Bidang' : 'Tambahkan Bidang'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
