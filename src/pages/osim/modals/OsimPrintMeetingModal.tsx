import React from 'react';
import { Printer, X } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { SchoolLetterhead } from '../../../components/common/SchoolLetterhead';
import { OsimMeeting, SchoolSetting } from '../../../types';

interface OsimPrintMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: OsimMeeting | null;
  schoolSetting: SchoolSetting | null;
}

export const OsimPrintMeetingModal: React.FC<OsimPrintMeetingModalProps> = ({
  isOpen,
  onClose,
  meeting,
  schoolSetting
}) => {
  if (!meeting) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = (() => {
    try {
      const d = new Date(meeting.date);
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return meeting.date;
    }
  })();

  const docNumber = `BA-${meeting.id.slice(0, 6).toUpperCase()}/OSIM-MAN2SBT/${new Date().getFullYear()}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pratinjau Cetak Berita Acara & Notulensi Rapat"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Action Controls (Hidden on Print) */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 print:hidden">
          <div className="text-xs text-zinc-400">
            Format resmi Berita Acara & Notulensi Sidang Pleno / Rapat OSIM siap cetak atau simpan PDF.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              Cetak / Simpan PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div
          id="printable-notulensi-sheet"
          className="bg-white text-zinc-900 p-8 rounded-lg shadow-sm border border-zinc-200 text-xs font-sans leading-relaxed print:p-0 print:border-none print:shadow-none"
        >
          {/* Official Letterhead */}
          <SchoolLetterhead
            schoolInfo={schoolSetting || undefined}
            documentTitle="BERITA ACARA & NOTULENSI RAPAT RESMI OSIM"
            documentNumber={docNumber}
            showDoubleLine={true}
          />

          {/* Meeting Metadata Box */}
          <div className="mt-4 border border-zinc-300 rounded p-3 bg-zinc-50/50">
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-zinc-200/60">
                  <td className="py-1 font-semibold text-zinc-700 w-36">Judul Rapat</td>
                  <td className="py-1 text-zinc-900 font-bold">: {meeting.title}</td>
                  <td className="py-1 font-semibold text-zinc-700 w-32">Jenis Rapat</td>
                  <td className="py-1 text-zinc-900">: {meeting.type}</td>
                </tr>
                <tr className="border-b border-zinc-200/60">
                  <td className="py-1 font-semibold text-zinc-700">Hari / Tanggal</td>
                  <td className="py-1 text-zinc-900">: {formattedDate}</td>
                  <td className="py-1 font-semibold text-zinc-700">Waktu</td>
                  <td className="py-1 text-zinc-900">: {meeting.startTime} - {meeting.endTime} WIT/WIB</td>
                </tr>
                <tr className="border-b border-zinc-200/60">
                  <td className="py-1 font-semibold text-zinc-700">Tempat / Lokasi</td>
                  <td className="py-1 text-zinc-900">: {meeting.location}</td>
                  <td className="py-1 font-semibold text-zinc-700">Jumlah Hadir</td>
                  <td className="py-1 text-zinc-900 font-semibold">: {meeting.attendeesCount} Peserta</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold text-zinc-700">Pimpinan Rapat</td>
                  <td className="py-1 text-zinc-900">: {meeting.leader}</td>
                  <td className="py-1 font-semibold text-zinc-700">Notulis / Sekretaris</td>
                  <td className="py-1 text-zinc-900">: {meeting.secretary}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 1: Agenda */}
          <div className="mt-5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-800 border-b border-zinc-300 pb-1 mb-2">
              I. AGENDA PEMBAHASAN
            </h4>
            <div className="pl-3 text-zinc-800 whitespace-pre-line leading-relaxed">
              {meeting.agenda || 'Pembahasan agenda rutin dan koordinasi kerja pengurus OSIM.'}
            </div>
          </div>

          {/* Section 2: Decisions */}
          <div className="mt-5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-800 border-b border-zinc-300 pb-1 mb-2">
              II. HASIL KEPUTUSAN & MUFAKAT SIDANG
            </h4>
            <div className="pl-3 text-zinc-800 whitespace-pre-line leading-relaxed border-l-2 border-emerald-500 bg-emerald-50/40 p-2.5 rounded-r">
              {meeting.decisionNotes || 'Seluruh peserta rapat menyetujui poin pembahasan secara musyawarah dan mufakat.'}
            </div>
          </div>

          {/* Section 3: Supervisor Notes */}
          {meeting.wakaNotes && (
            <div className="mt-5">
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-800 border-b border-zinc-300 pb-1 mb-2">
                III. CATATAN / ARAHAN PEMBINA & WAKA KESISWAAN
              </h4>
              <div className="pl-3 text-zinc-800 italic bg-amber-50/50 p-2 rounded border border-amber-200/60 leading-relaxed">
                "{meeting.wakaNotes}"
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="mt-8 pt-4 border-t border-zinc-300">
            <p className="text-right text-xs text-zinc-600 mb-6">
              Bula, {formattedDate}
            </p>

            <div className="grid grid-cols-2 gap-6 text-center text-xs">
              <div>
                <p className="font-semibold text-zinc-700">Notulis Rapat,</p>
                <div className="h-16" />
                <p className="font-bold text-zinc-900 underline">{meeting.secretary}</p>
                <p className="text-[10px] text-zinc-500">Sekretaris OSIM</p>
              </div>

              <div>
                <p className="font-semibold text-zinc-700">Pimpinan Rapat,</p>
                <div className="h-16" />
                <p className="font-bold text-zinc-900 underline">{meeting.leader}</p>
                <p className="text-[10px] text-zinc-500">Ketua Umum OSIM</p>
              </div>
            </div>

            <div className="mt-6 text-center text-xs">
              <p className="font-semibold text-zinc-700">Mengetahui,</p>
              <p className="font-semibold text-zinc-700">Pembina OSIM / Waka Bidang Kesiswaan</p>
              <div className="h-16" />
              <p className="font-bold text-zinc-900 underline">
                {schoolSetting?.pembinaOsim || schoolSetting?.wakaKesiswaanName || 'Pembina OSIM'}
              </p>
              <p className="text-[10px] text-zinc-500 font-mono">
                NIP: {schoolSetting?.pembinaOsimNip || schoolSetting?.wakaNip || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
