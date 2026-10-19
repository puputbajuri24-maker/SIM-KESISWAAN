import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  Sparkles,
  UserPlus,
  Clock,
  Calendar,
  MapPin,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { OsimMeeting, OsimMeetingAttendee, OsimMember } from '../../../types';

interface OsimMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingForm: Partial<OsimMeeting>;
  setMeetingForm: React.Dispatch<React.SetStateAction<Partial<OsimMeeting>>>;
  onSaveMeeting: (e: React.FormEvent) => Promise<void>;
  isEditing?: boolean;
  osimMembers?: OsimMember[];
}

export const OsimMeetingModal: React.FC<OsimMeetingModalProps> = ({
  isOpen,
  onClose,
  meetingForm,
  setMeetingForm,
  onSaveMeeting,
  isEditing = false,
  osimMembers = []
}) => {
  const [searchMember, setSearchMember] = useState('');
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestRole, setNewGuestRole] = useState('');
  const [showAddGuest, setShowAddGuest] = useState(false);

  // Attendees list state initialized from meetingForm or fallback from osimMembers
  const attendees: OsimMeetingAttendee[] = useMemo(() => {
    if (meetingForm.attendees && meetingForm.attendees.length > 0) {
      return meetingForm.attendees;
    }
    if (osimMembers && osimMembers.length > 0) {
      return osimMembers.map(m => ({
        memberId: m.id,
        name: m.fullName,
        roleOrPosition: m.position || m.sekbid || 'Pengurus OSIM',
        presentStatus: 'Hadir'
      }));
    }
    return [];
  }, [meetingForm.attendees, osimMembers]);

  // Recalculate attendance stats
  const attendanceStats = useMemo(() => {
    const total = attendees.length;
    const hadir = attendees.filter(a => a.presentStatus === 'Hadir').length;
    const izin = attendees.filter(a => a.presentStatus === 'Izin').length;
    const sakit = attendees.filter(a => a.presentStatus === 'Sakit').length;
    const alpa = attendees.filter(a => a.presentStatus === 'Alpa').length;
    return { total, hadir, izin, sakit, alpa };
  }, [attendees]);

  // Handle status change for a member in attendance grid
  const handleUpdateStatus = (index: number, newStatus: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa') => {
    const updated = [...attendees];
    if (updated[index]) {
      updated[index] = { ...updated[index], presentStatus: newStatus };
      const newHadirCount = updated.filter(a => a.presentStatus === 'Hadir').length;
      setMeetingForm(prev => ({
        ...prev,
        attendees: updated,
        attendeesCount: newHadirCount
      }));
    }
  };

  // Mark all attendees as "Hadir"
  const handleMarkAllHadir = () => {
    const updated = attendees.map(a => ({ ...a, presentStatus: 'Hadir' as const }));
    setMeetingForm(prev => ({
      ...prev,
      attendees: updated,
      attendeesCount: updated.length
    }));
  };

  // Add custom / outside attendee (e.g. Pembina, Waka, Tamu)
  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim()) return;

    const newGuest: OsimMeetingAttendee = {
      memberId: `guest_${Date.now()}`,
      name: newGuestName.trim(),
      roleOrPosition: newGuestRole.trim() || 'Tamu Undangan / Pembina',
      presentStatus: 'Hadir'
    };

    const updated = [...attendees, newGuest];
    const newHadirCount = updated.filter(a => a.presentStatus === 'Hadir').length;
    setMeetingForm(prev => ({
      ...prev,
      attendees: updated,
      attendeesCount: newHadirCount
    }));

    setNewGuestName('');
    setNewGuestRole('');
    setShowAddGuest(false);
  };

  // Remove attendee
  const handleRemoveAttendee = (index: number) => {
    const updated = attendees.filter((_, i) => i !== index);
    const newHadirCount = updated.filter(a => a.presentStatus === 'Hadir').length;
    setMeetingForm(prev => ({
      ...prev,
      attendees: updated,
      attendeesCount: newHadirCount
    }));
  };

  // Filtered attendees for the grid
  const filteredAttendees = useMemo(() => {
    if (!searchMember.trim()) return attendees;
    const q = searchMember.toLowerCase();
    return attendees.filter(a =>
      a.name.toLowerCase().includes(q) ||
      (a.roleOrPosition || '').toLowerCase().includes(q)
    );
  }, [attendees, searchMember]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Notulensi Sidang & Rapat OSIM' : 'Catat Notulensi Sidang Pleno & Rapat OSIM'}
      maxWidth="max-w-4xl"
    >
      <form onSubmit={onSaveMeeting} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        {/* Section 1: Informasi Dasar Rapat */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl space-y-3">
          <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              I. INFORMASI DASAR PERTEMUAN / SIDANG
            </h4>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Judul / Acara Pertemuan *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Rapat Evaluasi Bulanan & Koordinasi Program Kerja OSIM"
              value={meetingForm.title || ''}
              onChange={e => setMeetingForm({ ...meetingForm, title: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Jenis Pertemuan</label>
              <select
                value={meetingForm.type || 'Rapat Pleno Pengurus'}
                onChange={e => setMeetingForm({ ...meetingForm, type: e.target.value as any })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Rapat Pleno Pengurus">Rapat Pleno Pengurus</option>
                <option value="Rapat BPH">Rapat BPH</option>
                <option value="Rapat Koordinasi Pembina">Rapat Koordinasi Pembina</option>
                <option value="Sidang Musyawarah Kerja (MUKER)">Sidang Musyawarah Kerja (MUKER)</option>
                <option value="Rapat Evaluasi Bulanan">Rapat Evaluasi Bulanan</option>
                <option value="Rapat Koordinasi Sekbid">Rapat Koordinasi Sekbid</option>
                <option value="Rapat Luar Biasa">Rapat Luar Biasa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Tanggal</label>
              <input
                type="date"
                value={meetingForm.date || ''}
                onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Waktu Mulai - Selesai</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="15:30"
                  value={meetingForm.startTime || ''}
                  onChange={e => setMeetingForm({ ...meetingForm, startTime: e.target.value })}
                  className="w-1/2 px-2.5 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono text-center"
                />
                <span className="text-zinc-500">-</span>
                <input
                  type="text"
                  placeholder="17:00"
                  value={meetingForm.endTime || ''}
                  onChange={e => setMeetingForm({ ...meetingForm, endTime: e.target.value })}
                  className="w-1/2 px-2.5 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono text-center"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Lokasi Sidang / Rapat</label>
              <input
                type="text"
                placeholder="Contoh: Ruang Rapat OSIM & Kesiswaan"
                value={meetingForm.location || ''}
                onChange={e => setMeetingForm({ ...meetingForm, location: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Pimpinan Rapat</label>
              <input
                type="text"
                placeholder="Ketua Umum OSIM"
                value={meetingForm.leader || ''}
                onChange={e => setMeetingForm({ ...meetingForm, leader: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Notulis (Sekretaris)</label>
              <input
                type="text"
                placeholder="Sekretaris OSIM"
                value={meetingForm.secretary || ''}
                onChange={e => setMeetingForm({ ...meetingForm, secretary: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: PRESENSI KEHADIRAN PENGURUS BERBENTUK GRID (Fitur Khusus Sekretaris OSIM) */}
        <div className="bg-gradient-to-r from-sky-950/40 via-zinc-900 to-zinc-900 border border-sky-800/50 p-4 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-800/40 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-100">
                    II. PRESENSI KEHADIRAN RAPAT (GRID SEKRETARIS)
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    Fitur Notulis
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Tandai status kehadiran setiap pengurus OSIM. Jumlah hadir otomatis tersinkron ke dokumen resmi.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleMarkAllHadir}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition shadow-xs"
                title="Tandai seluruh pengurus sebagai Hadir"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Semua Hadir
              </button>
              <button
                type="button"
                onClick={() => setShowAddGuest(!showAddGuest)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-[11px] font-medium transition"
              >
                <UserPlus className="w-3.5 h-3.5 text-sky-400" />
                + Tamu / Pembina
              </button>
            </div>
          </div>

          {/* Form Tambah Peserta Tamu / Luar */}
          {showAddGuest && (
            <div className="bg-zinc-950/80 border border-sky-500/30 p-3 rounded-lg space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-sky-300 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  Tambah Peserta Luar / Tamu Undangan / Pembina:
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddGuest(false)}
                  className="text-zinc-500 hover:text-zinc-300 text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nama Lengkap Tamu / Pembina *"
                  value={newGuestName}
                  onChange={e => setNewGuestName(e.target.value)}
                  className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-sky-500"
                />
                <input
                  type="text"
                  placeholder="Jabatan / Asal Instansi (Opsional)"
                  value={newGuestRole}
                  onChange={e => setNewGuestRole(e.target.value)}
                  className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleAddGuest}
                  className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition"
                >
                  Tambahkan ke Daftar Hadir
                </button>
              </div>
            </div>
          )}

          {/* Summary Badges Kehadiran */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[11px]">
            <div className="bg-zinc-950/60 border border-zinc-800 p-2 rounded-lg">
              <span className="text-zinc-500 block text-[10px] uppercase font-mono">Total Undangan</span>
              <span className="font-bold text-zinc-200 text-sm">{attendanceStats.total}</span>
            </div>
            <div className="bg-emerald-950/30 border border-emerald-500/30 p-2 rounded-lg">
              <span className="text-emerald-400 block text-[10px] uppercase font-mono">Hadir (Sah)</span>
              <span className="font-bold text-emerald-300 text-sm">{attendanceStats.hadir}</span>
            </div>
            <div className="bg-amber-950/30 border border-amber-500/30 p-2 rounded-lg">
              <span className="text-amber-400 block text-[10px] uppercase font-mono">Izin</span>
              <span className="font-bold text-amber-300 text-sm">{attendanceStats.izin}</span>
            </div>
            <div className="bg-sky-950/30 border border-sky-500/30 p-2 rounded-lg">
              <span className="text-sky-400 block text-[10px] uppercase font-mono">Sakit</span>
              <span className="font-bold text-sky-300 text-sm">{attendanceStats.sakit}</span>
            </div>
            <div className="bg-rose-950/30 border border-rose-500/30 p-2 rounded-lg col-span-2 sm:col-span-1">
              <span className="text-rose-400 block text-[10px] uppercase font-mono">Alpa / Absen</span>
              <span className="font-bold text-rose-300 text-sm">{attendanceStats.alpa}</span>
            </div>
          </div>

          {/* Pencarian Anggota Pengurus di Grid */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Cari pengurus di daftar presensi (nama atau sekbid)..."
              value={searchMember}
              onChange={e => setSearchMember(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-sky-500 placeholder-zinc-500"
            />
          </div>

          {/* Grid Interaktif Presensi Kehadiran */}
          {filteredAttendees.length === 0 ? (
            <div className="bg-zinc-950/50 border border-dashed border-zinc-800 p-4 rounded-lg text-center text-xs text-zinc-500">
              Tidak ada data pengurus yang cocok dengan kata kunci pencarian.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {filteredAttendees.map((att, idx) => {
                const realIndex = attendees.findIndex(a =>
                  (a.memberId && a.memberId === att.memberId) ||
                  (a.name === att.name && a.roleOrPosition === att.roleOrPosition)
                );
                const targetIdx = realIndex !== -1 ? realIndex : idx;

                const isHadir = att.presentStatus === 'Hadir';
                const isIzin = att.presentStatus === 'Izin';
                const isSakit = att.presentStatus === 'Sakit';
                const isAlpa = att.presentStatus === 'Alpa';

                return (
                  <div
                    key={att.memberId || `att_${idx}`}
                    className={`p-2.5 rounded-lg border transition flex flex-col justify-between gap-2 ${
                      isHadir
                        ? 'bg-zinc-950/80 border-emerald-500/40'
                        : isIzin
                        ? 'bg-zinc-950/80 border-amber-500/40'
                        : isSakit
                        ? 'bg-zinc-950/80 border-sky-500/40'
                        : 'bg-zinc-950/80 border-rose-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-100 truncate">{att.name}</p>
                        <p className="text-[10px] text-zinc-400 font-mono truncate">{att.roleOrPosition}</p>
                      </div>
                      {att.memberId?.startsWith('guest_') && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAttendee(targetIdx)}
                          className="text-zinc-600 hover:text-rose-400 p-0.5 rounded transition"
                          title="Hapus tamu ini"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Status Pill Toggle Buttons */}
                    <div className="grid grid-cols-4 gap-1 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(targetIdx, 'Hadir')}
                        className={`py-1 px-1 rounded transition text-center ${
                          isHadir
                            ? 'bg-emerald-600 text-white shadow-xs font-black'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        Hadir
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(targetIdx, 'Izin')}
                        className={`py-1 px-1 rounded transition text-center ${
                          isIzin
                            ? 'bg-amber-600 text-white shadow-xs font-black'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        Izin
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(targetIdx, 'Sakit')}
                        className={`py-1 px-1 rounded transition text-center ${
                          isSakit
                            ? 'bg-sky-600 text-white shadow-xs font-black'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        Sakit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(targetIdx, 'Alpa')}
                        className={`py-1 px-1 rounded transition text-center ${
                          isAlpa
                            ? 'bg-rose-600 text-white shadow-xs font-black'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        Alpa
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 3: Risalah Rapat & Keputusan Sidang */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl space-y-3">
          <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              III. RISALAH NOTULENSI & KEPUTUSAN SIDANG
            </h4>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Agenda Pembahasan *</label>
            <textarea
              required
              rows={2}
              placeholder="Rincian poin agenda yang dibahas secara musyawarah..."
              value={meetingForm.agenda || ''}
              onChange={e => setMeetingForm({ ...meetingForm, agenda: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Hasil Keputusan & Mufakat Sidang *</label>
            <textarea
              required
              rows={3}
              placeholder="Poin hasil keputusan mufakat, pembagian tanggung jawab divisi, target waktu..."
              value={meetingForm.decisionNotes || ''}
              onChange={e => setMeetingForm({ ...meetingForm, decisionNotes: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Catatan Waka Kesiswaan / Pembina (Opsional)</label>
            <textarea
              rows={2}
              placeholder="Arahan khusus waka kesiswaan atau pembina OSIM..."
              value={meetingForm.wakaNotes || ''}
              onChange={e => setMeetingForm({ ...meetingForm, wakaNotes: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="font-semibold text-emerald-400">{attendanceStats.hadir} Pengurus Hadir</span>
            <span>dari {attendanceStats.total} Peserta</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-sm"
            >
              Simpan Notulensi & Presensi
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
