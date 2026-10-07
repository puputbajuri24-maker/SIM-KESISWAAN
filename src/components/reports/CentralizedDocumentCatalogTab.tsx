import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  Scale,
  ShieldAlert,
  HeartHandshake,
  Compass,
  FileCheck2,
  DollarSign,
  Award,
  Users,
  Search,
  Filter,
  Sparkles,
  Layers,
  ChevronRight,
  Info,
  Calendar,
  Building,
  CheckCircle2
} from 'lucide-react';
import {
  StudentViolation,
  StudentCounseling,
  ActivityReport,
  ParentCallLetter,
  StudentPermission,
  StudentAchievement,
  AttendanceSession,
  CashTransaction,
  CashAccount,
  OsimWorkProgram,
  OsimMeeting,
  Extracurricular,
  Student,
  Teacher,
  SchoolSetting
} from '../../types';
import { UnifiedPrintDocumentData } from '../common/UnifiedPrintDocumentModal';

interface CentralizedDocumentCatalogTabProps {
  onOpenPrintDocument: (data: UnifiedPrintDocumentData) => void;
  violations: StudentViolation[];
  counseling: StudentCounseling[];
  activityReports: ActivityReport[];
  parentCallLetters: ParentCallLetter[];
  permissions?: StudentPermission[];
  achievements?: StudentAchievement[];
  attendance?: AttendanceSession[];
  cashTransactions?: CashTransaction[];
  cashAccounts?: CashAccount[];
  osimPrograms?: OsimWorkProgram[];
  osimMeetings?: OsimMeeting[];
  extracurriculars: Extracurricular[];
  students: Student[];
  teachers: Teacher[];
  schoolSetting?: Partial<SchoolSetting>;
  activeAcademicYear: string;
  disciplineStudentsSummary: any[];
  sk380Metrics: any;
}

export const CentralizedDocumentCatalogTab: React.FC<CentralizedDocumentCatalogTabProps> = ({
  onOpenPrintDocument,
  violations,
  counseling,
  activityReports,
  parentCallLetters,
  permissions = [],
  achievements = [],
  attendance = [],
  cashTransactions = [],
  cashAccounts = [],
  osimPrograms = [],
  osimMeetings = [],
  extracurriculars,
  students,
  teachers,
  schoolSetting,
  activeAcademicYear,
  disciplineStudentsSummary,
  sk380Metrics
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const city = schoolSetting?.defaultCity || 'Bula';
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // =========================================================================
  // DOCUMENT GENERATORS (COMPILE PRINT DATA)
  // =========================================================================

  // 1. Rekapitulasi Evaluasi Kedisiplinan SK B-380
  const generateDisciplineSk380Document = (): UnifiedPrintDocumentData => {
    return {
      documentId: 'doc-sk380',
      documentTitle: 'LAPORAN EVALUASI KEDISIPLINAN & 5 JENJANG SANKSI SISWA',
      documentNumber: `B-380/Ma.25.06/PP.00.6/07/${new Date().getFullYear()}`,
      documentCategory: 'discipline',
      paperOrientation: 'landscape',
      recommendedSlots: 3,
      customReporterRole: 'Koordinator Guru BK',
      content: (
        <div>
          <div className="mb-4 text-center">
            <p className="font-sans text-[11px] font-semibold text-slate-700">
              Rujukan Keputusan Kepala Madrasah Nomor B-380/Ma.25.06/PP.00.6/07/2024 • Tahun Pelajaran {activeAcademicYear}
            </p>
          </div>

          {/* Metrics summary banner */}
          <div className="grid grid-cols-5 gap-2 mb-4 text-[10px] font-sans">
            <div className="p-2 border border-slate-300 rounded bg-slate-50 text-center">
              <span className="text-slate-500 block text-[9px]">Total Kasus</span>
              <span className="text-xs font-bold text-slate-900">{sk380Metrics.totalViolations} Kasus</span>
            </div>
            <div className="p-2 border border-slate-300 rounded bg-slate-50 text-center">
              <span className="text-slate-500 block text-[9px]">Siswa Melanggar</span>
              <span className="text-xs font-bold text-slate-900">{sk380Metrics.totalViolatingStudents} Siswa</span>
            </div>
            <div className="p-2 border border-slate-300 rounded bg-slate-50 text-center">
              <span className="text-slate-500 block text-[9px]">Ambang Sanksi (≥10p)</span>
              <span className="text-xs font-bold text-amber-700">{sk380Metrics.activeSanctionStudents} Siswa</span>
            </div>
            <div className="p-2 border border-slate-300 rounded bg-slate-50 text-center">
              <span className="text-slate-500 block text-[9px]">SP 2 Skorsing (41-75p)</span>
              <span className="text-xs font-bold text-rose-700">{sk380Metrics.tier3Count} Siswa</span>
            </div>
            <div className="p-2 border border-slate-300 rounded bg-slate-50 text-center">
              <span className="text-slate-500 block text-[9px]">SP 3 Pleno (≥76p)</span>
              <span className="text-xs font-bold text-purple-700">{sk380Metrics.tier4Count + sk380Metrics.tier5Count} Siswa</span>
            </div>
          </div>

          <table className="w-full font-sans text-[10px] border-collapse border border-slate-400 mb-4">
            <thead>
              <tr className="bg-slate-100 text-slate-900">
                <th className="border border-slate-400 p-1 text-center w-8">No</th>
                <th className="border border-slate-400 p-1.5 text-left">Nama Lengkap Siswa</th>
                <th className="border border-slate-400 p-1 text-center">NIS</th>
                <th className="border border-slate-400 p-1 text-center">Kelas</th>
                <th className="border border-slate-400 p-1 text-center">Total Poin</th>
                <th className="border border-slate-400 p-1.5 text-left">Jenjang Sanksi SK B-380</th>
                <th className="border border-slate-400 p-1.5 text-left">Tindakan Wajib / Rekomendasi Sanksi</th>
                <th className="border border-slate-400 p-1 text-center">Status SP</th>
              </tr>
            </thead>
            <tbody>
              {disciplineStudentsSummary.slice(0, 30).map((s, idx) => (
                <tr key={s.studentId} className="border-b border-slate-300">
                  <td className="border border-slate-300 p-1 text-center">{idx + 1}</td>
                  <td className="border border-slate-300 p-1.5 font-bold">{s.studentName}</td>
                  <td className="border border-slate-300 p-1 text-center font-mono">{s.studentNis}</td>
                  <td className="border border-slate-300 p-1 text-center">{s.studentClass}</td>
                  <td className="border border-slate-300 p-1 text-center font-bold font-mono">
                    <span className={s.totalPoints >= 41 ? 'text-red-700' : s.totalPoints >= 21 ? 'text-orange-700' : 'text-slate-800'}>
                      {s.totalPoints} P
                    </span>
                  </td>
                  <td className="border border-slate-300 p-1.5 font-semibold">
                    {s.tier ? s.tier.name : '<10 P (Pembinaan Preventif)'}
                  </td>
                  <td className="border border-slate-300 p-1.5 text-[9.5px]">
                    {s.tier ? s.tier.actionRequired : 'Pembinaan rutin wali kelas'}
                  </td>
                  <td className="border border-slate-300 p-1 text-center">
                    {s.highestCall > 0 ? `SP ${s.highestCall}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    };
  };

  // 2. Rekap Catatan Pelanggaran Siswa
  const generateViolationsDocument = (): UnifiedPrintDocumentData => {
    return {
      documentId: 'doc-violations',
      documentTitle: 'REKAPITULASI CATATAN PELANGGARAN KEDISIPLINAN SISWA',
      documentNumber: `421.3 / ${Math.floor(100 + Math.random() * 900)} / TATA-TERTIB / ${new Date().getFullYear()}`,
      documentCategory: 'discipline',
      paperOrientation: 'landscape',
      recommendedSlots: 3,
      customReporterRole: 'Koordinator Guru BK',
      content: (
        <div>
          <p className="text-center text-[11px] font-sans text-slate-700 mb-3">
            Tahun Pelajaran: {activeAcademicYear} • Total {violations.length} Catatan Pelanggaran
          </p>
          <table className="w-full font-sans text-[10px] border-collapse border border-slate-400 mb-4">
            <thead>
              <tr className="bg-slate-100 text-slate-900">
                <th className="border border-slate-400 p-1 text-center w-8">No</th>
                <th className="border border-slate-400 p-1.5 text-left">Nama Siswa & NIS</th>
                <th className="border border-slate-400 p-1 text-center">Kelas</th>
                <th className="border border-slate-400 p-1 text-center">Tanggal</th>
                <th className="border border-slate-400 p-1.5 text-left">Kategori & Bentuk Pelanggaran</th>
                <th className="border border-slate-400 p-1 text-center">Poin</th>
                <th className="border border-slate-400 p-1.5 text-left">Tindakan / Sanksi Yang Diberikan</th>
                <th className="border border-slate-400 p-1 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {violations.slice(0, 35).map((v, idx) => (
                <tr key={v.id} className="border-b border-slate-300">
                  <td className="border border-slate-300 p-1 text-center">{idx + 1}</td>
                  <td className="border border-slate-300 p-1.5 font-bold">
                    {v.studentName}
                    <span className="block text-[9px] text-slate-500 font-normal">NIS: {v.studentNis}</span>
                  </td>
                  <td className="border border-slate-300 p-1 text-center">{v.studentClass}</td>
                  <td className="border border-slate-300 p-1 text-center">{v.date}</td>
                  <td className="border border-slate-300 p-1.5">
                    <span className="font-semibold block">{v.violationType}</span>
                    <span className="text-[9px] text-slate-500">{v.category}</span>
                  </td>
                  <td className="border border-slate-300 p-1 text-center font-bold text-rose-700">+{v.points}</td>
                  <td className="border border-slate-300 p-1.5">{v.actionTaken || '-'}</td>
                  <td className="border border-slate-300 p-1 text-center">{v.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    };
  };

  // 3. Rekapitulasi Layanan Bimbingan & Konseling (BK)
  const generateCounselingDocument = (): UnifiedPrintDocumentData => {
    return {
      documentId: 'doc-counseling',
      documentTitle: 'REKAPITULASI LAYANAN BIMBINGAN & KONSELING (BK)',
      documentNumber: `421.3 / ${Math.floor(100 + Math.random() * 900)} / BK / ${new Date().getFullYear()}`,
      documentCategory: 'counseling',
      paperOrientation: 'landscape',
      recommendedSlots: 2,
      customReporterRole: 'Guru Bimbingan Konseling',
      content: (
        <div>
          <p className="text-center text-[11px] font-sans text-slate-700 mb-3">
            Tahun Pelajaran: {activeAcademicYear} • Total {counseling.length} Sesi Bimbingan
          </p>
          <table className="w-full font-sans text-[10px] border-collapse border border-slate-400 mb-4">
            <thead>
              <tr className="bg-slate-100 text-slate-900">
                <th className="border border-slate-400 p-1 text-center w-8">No</th>
                <th className="border border-slate-400 p-1.5 text-left">Nama Siswa</th>
                <th className="border border-slate-400 p-1 text-center">Kelas</th>
                <th className="border border-slate-400 p-1 text-center">Tanggal</th>
                <th className="border border-slate-400 p-1 text-left">Bidang</th>
                <th className="border border-slate-400 p-1.5 text-left">Topik / Masalah</th>
                <th className="border border-slate-400 p-1.5 text-left">Hasil / Kesepakatan Pembinaan</th>
                <th className="border border-slate-400 p-1.5 text-left">Guru Konselor</th>
              </tr>
            </thead>
            <tbody>
              {counseling.slice(0, 30).map((c, idx) => (
                <tr key={c.id} className="border-b border-slate-300">
                  <td className="border border-slate-300 p-1 text-center">{idx + 1}</td>
                  <td className="border border-slate-300 p-1.5 font-bold">{c.studentName}</td>
                  <td className="border border-slate-300 p-1 text-center">{c.studentClass}</td>
                  <td className="border border-slate-300 p-1 text-center">{c.date}</td>
                  <td className="border border-slate-300 p-1 font-semibold text-indigo-900">{c.serviceField || 'Pribadi'}</td>
                  <td className="border border-slate-300 p-1.5">{c.topic || c.reason || '-'}</td>
                  <td className="border border-slate-300 p-1.5">{c.solution || c.counselingResult || '-'}</td>
                  <td className="border border-slate-300 p-1.5">{c.counselorName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    };
  };

  // 4. Surat Keterangan Dispensasi Resmi Siswa
  const generateDispensationDocument = (): UnifiedPrintDocumentData => {
    const samplePerm = permissions[0] || {
      id: 'disp-sample',
      studentName: 'Ahmad Faisal Rahman',
      studentNis: '202410089',
      studentClass: 'X IPA 1',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      type: 'Dispensasi Lomba',
      activityName: 'Kejuaraan Olahraga Madrasah Nasional',
      reason: 'Mengikuti babak final kejuaraan karate perorangan mewakili madrasah',
      approvedBy: schoolSetting?.wakaName || 'Waka Kesiswaan'
    };

    return {
      documentId: 'doc-dispensation',
      documentTitle: 'SURAT KETERANGAN DISPENSASI KESISWAAN',
      documentNumber: `421.3 / ${Math.floor(100 + Math.random() * 900)} / DISP / ${new Date().getFullYear()}`,
      documentCategory: 'permissions',
      paperOrientation: 'portrait',
      recommendedSlots: 2,
      customReporterRole: 'Waka Bidang Kesiswaan',
      content: (
        <div className="space-y-4 font-sans text-xs leading-relaxed">
          <p>
            Yang bertanda tangan di bawah ini, Kepala Madrasah / Waka Kesiswaan {schoolSetting?.name || 'MAN 2 SERAM BAGIAN TIMUR'} dengan ini menerangkan bahwa:
          </p>

          <div className="pl-6 space-y-1.5 my-3">
            <p><strong>Nama Lengkap:</strong> {samplePerm.studentName}</p>
            <p><strong>Nomor Induk Siswa (NIS):</strong> {samplePerm.studentNis}</p>
            <p><strong>Kelas:</strong> {samplePerm.studentClass}</p>
            <p><strong>Madrasah:</strong> {schoolSetting?.name || 'MAN 2 Seram Bagian Timur'}</p>
          </div>

          <p>
            Diberikan dispensasi untuk tidak mengikuti Kegiatan Belajar Mengajar (KBM) tatap muka terhitung mulai tanggal{' '}
            <strong>
              {samplePerm.startDate} {samplePerm.endDate && samplePerm.endDate !== samplePerm.startDate ? `sampai dengan ${samplePerm.endDate}` : ''}
            </strong>{' '}
            dikarenakan keikutsertaan dalam agenda resmi madrasah:
          </p>

          <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold">
            📌 Agenda: {samplePerm.activityName || samplePerm.type} <br />
            Keterangan: {samplePerm.reason}
          </div>

          <p>
            Demikian surat keterangan dispensasi ini dibuat dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya, serta kepada bapak/ibu guru pengajar dimohon permaklumannya.
          </p>
        </div>
      )
    };
  };

  // 5. Surat Pemanggilan Orang Tua / Wali Siswa
  const generateParentCallDocument = (): UnifiedPrintDocumentData => {
    const sampleCall = parentCallLetters[0] || {
      callNumber: 1 as const,
      studentName: 'Muhammad Rizky Pratama',
      studentNis: '202410142',
      studentClass: 'XI IPS 2',
      parentName: 'Bapak / Ibu Orang Tua / Wali',
      callDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      callTime: '09:00 WIT',
      location: 'Ruang Bimbingan & Konseling (BK)',
      reason: 'Pembahasan perkembangan belajar dan evaluasi poin kedisiplinan tata tertib siswa',
      counselorName: 'Dra. Hj. Nurhayati, M.Pd.'
    };

    return {
      documentId: 'doc-parent-call',
      documentTitle: 'SURAT PANGGILAN ORANG TUA / WALI PESERTA DIDIK',
      documentNumber: `421.3 / ${Math.floor(100 + Math.random() * 900)} / SP-ORTU / ${new Date().getFullYear()}`,
      documentCategory: 'counseling',
      paperOrientation: 'portrait',
      recommendedSlots: 3,
      customReporterRole: 'Koordinator Guru BK',
      content: (
        <div className="space-y-4 font-sans text-xs leading-relaxed">
          <div className="flex justify-between items-start">
            <div>
              <p>Nomor: 421.3 / SP / {new Date().getFullYear()}</p>
              <p>Lampiran: -</p>
              <p>Perihal: <strong>Panggilan Orang Tua / Wali Siswa (Peringatan Ke-{sampleCall.callNumber})</strong></p>
            </div>
            <div className="text-right">
              <p>{city}, {currentDate}</p>
              <p className="mt-1">Kepada Yth.</p>
              <p><strong>{sampleCall.parentName}</strong></p>
              <p>Orang Tua / Wali dari: <strong>{sampleCall.studentName}</strong></p>
              <p>Kelas: {sampleCall.studentClass}</p>
              <p>di Tempat</p>
            </div>
          </div>

          <p className="mt-4">
            <em>Assalamu’alaikum Warahmatullahi Wabarakatuh,</em>
          </p>

          <p>
            Dengan hormat, sehubungan dengan perlunya koordinasi dan pembinaan terpadu terhadap putra/putri Bapak/Ibu:
          </p>

          <div className="pl-6 space-y-1">
            <p><strong>Nama Siswa:</strong> {sampleCall.studentName}</p>
            <p><strong>NIS / Kelas:</strong> {sampleCall.studentNis} / {sampleCall.studentClass}</p>
            <p><strong>Alasan / Keperluan:</strong> {sampleCall.reason}</p>
          </div>

          <p>
            Maka dengan ini kami mengundang Bapak/Ibu untuk berkenan hadir ke madrasah pada:
          </p>

          <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs space-y-1 pl-4">
            <p><strong>Hari / Tanggal:</strong> {sampleCall.callDate}</p>
            <p><strong>Waktu:</strong> {sampleCall.callTime || '09.00 WIT s/d Selesai'}</p>
            <p><strong>Tempat:</strong> {sampleCall.location || 'Ruang Konseling & Bimbingan BK'}</p>
            <p><strong>Menemui:</strong> {sampleCall.counselorName || 'Guru BK & Waka Kesiswaan'}</p>
          </div>

          <p>
            Mengingat pentingnya agenda pembinaan ini demi masa depan pendidikan putra/putri Bapak/Ibu, kehadiran tepat pada waktunya sangat kami harapkan. Atas perhatian dan kerja samanya, kami sampaikan terima kasih.
          </p>

          <p>
            <em>Wassalamu’alaikum Warahmatullahi Wabarakatuh.</em>
          </p>
        </div>
      )
    };
  };

  // 6. Laporan Pertanggungjawaban (LPJ) Ekstrakurikuler
  const generateLpjDocument = (): UnifiedPrintDocumentData => {
    const report = activityReports[0] || {
      activityTitle: 'Latihan Gabungan & Ujian Kenaikan Tingkat PMR Wira',
      extracurricularName: 'Palang Merah Remaja (PMR)',
      coachName: 'Guru Pembina PMR',
      date: new Date().toISOString().split('T')[0],
      attendanceCount: 32,
      totalBudgetSpent: 750000,
      summary: 'Kegiatan berjalan lancar dan seluruh peserta berhasil menuntaskan materi pertolongan pertama lapangan.',
      achievements: 'Tercapai 100% target kelulusan materi dasar P3K',
      challenges: 'Keterbatasan perlengkapan tandu lipat dan obat-obatan simulasi'
    };

    return {
      documentId: 'doc-lpj',
      documentTitle: 'BERKAS LAPORAN PERTANGGUNGJAWABAN (LPJ) KEGIATAN',
      documentNumber: `421.3 / ${Math.floor(100 + Math.random() * 900)} / LPJ / ${new Date().getFullYear()}`,
      documentCategory: 'activities',
      paperOrientation: 'portrait',
      recommendedSlots: 3,
      customReporterRole: 'Guru Pembina Ekstrakurikuler',
      content: (
        <div className="space-y-4 font-sans text-xs leading-relaxed">
          <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg space-y-1">
            <p><strong>Nama Kegiatan:</strong> {report.activityTitle}</p>
            <p><strong>Unit / Cabang:</strong> {report.extracurricularName}</p>
            <p><strong>Tanggal Pelaksanaan:</strong> {report.date}</p>
            <p><strong>Jumlah Peserta Hadir:</strong> {report.attendanceCount} Siswa</p>
            <p><strong>Realisasi Anggaran:</strong> Rp {(report.totalBudgetSpent || 0).toLocaleString('id-ID')}</p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 uppercase underline text-[11px] mb-1">I. Ringkasan Pelaksanaan</h4>
            <p className="text-slate-800 leading-relaxed pl-2">{report.summary}</p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 uppercase underline text-[11px] mb-1">II. Output & Capaian Prestasi</h4>
            <p className="text-slate-800 leading-relaxed pl-2">{report.achievements || '-'}</p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 uppercase underline text-[11px] mb-1">III. Kendala & Catatan Evaluasi</h4>
            <p className="text-slate-800 leading-relaxed pl-2">{report.challenges || '-'}</p>
          </div>

          <p className="mt-3">
            Demikian laporan pertanggungjawaban kegiatan ini disusun sebagai bahan evaluasi dan arsip resmi kesiswaan madrasah.
          </p>
        </div>
      )
    };
  };

  // 7. Berita Acara Rapat / Sidang Pleno OSIM
  const generateOsimMeetingDocument = (): UnifiedPrintDocumentData => {
    const meeting = osimMeetings[0] || {
      title: 'Sidang Pleno Penyusunan Program Kerja OSIM',
      date: new Date().toISOString().split('T')[0],
      location: 'Aula Madrasah MAN 2 SBT',
      agenda: 'Pembahasan matrik program kerja tahunan dan penetapan jadwal latihan gabungan',
      attendeesCount: 45,
      decisionNotes: '1. Disetujui 12 program kerja utama; 2. Peringatan Milad Madrasah ditetapkan bulan depan.'
    };

    return {
      documentId: 'doc-osim-meeting',
      documentTitle: 'BERITA ACARA SIDANG / RAPAT PLENO OSIM',
      documentNumber: `421.3 / ${Math.floor(100 + Math.random() * 900)} / OSIM / ${new Date().getFullYear()}`,
      documentCategory: 'osim',
      paperOrientation: 'portrait',
      recommendedSlots: 3,
      customReporterRole: 'Ketua Umum OSIM',
      content: (
        <div className="space-y-4 font-sans text-xs leading-relaxed">
          <p>
            Pada hari ini, tanggal <strong>{meeting.date}</strong>, bertempat di <strong>{meeting.location || 'Madrasah'}</strong>, telah diselenggarakan rapat pleno pengurus OSIM dengan rincian sebagai berikut:
          </p>

          <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg space-y-1">
            <p><strong>Agenda Acara:</strong> {meeting.title}</p>
            <p><strong>Topik Pembahasan:</strong> {meeting.agenda || '-'}</p>
            <p><strong>Jumlah Peserta Hadir:</strong> {meeting.attendeesCount || 40} Anggota Pengurus</p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 uppercase underline text-[11px] mb-1">Hasil Keputusan & Kesepakatan Rapat:</h4>
            <p className="text-slate-800 leading-relaxed pl-2 whitespace-pre-line">{meeting.decisionNotes || 'Rapat menyetujui seluruh rangkaian program kerja yang diajukan.'}</p>
          </div>

          <p>
            Demikian Berita Acara ini dibuat dan ditandatangani oleh pimpinan sidang untuk dipergunakan sebagaimana mestinya.
          </p>
        </div>
      )
    };
  };

  // 8. Laporan Buku Kas / Keuangan Kesiswaan
  const generateCashLedgerDocument = (): UnifiedPrintDocumentData => {
    const totalMasuk = cashTransactions.filter(t => t.type === 'MASUK').reduce((a, b) => a + b.amount, 0);
    const totalKeluar = cashTransactions.filter(t => t.type === 'KELUAR').reduce((a, b) => a + b.amount, 0);
    const saldo = totalMasuk - totalKeluar;

    return {
      documentId: 'doc-cash-ledger',
      documentTitle: 'LAPORAN REKAPITULASI BUKU KAS KESISWAAN',
      documentNumber: `421.3 / ${Math.floor(100 + Math.random() * 900)} / KAS / ${new Date().getFullYear()}`,
      documentCategory: 'general',
      paperOrientation: 'portrait',
      recommendedSlots: 3,
      customReporterRole: 'Bendahara Kesiswaan',
      content: (
        <div>
          <div className="grid grid-cols-3 gap-3 font-sans text-xs mb-4">
            <div className="p-3 border border-slate-300 rounded bg-emerald-50 text-center">
              <span className="text-[10px] text-emerald-700 block font-semibold">Total Penerimaan Kas</span>
              <span className="text-sm font-bold text-emerald-900">Rp {totalMasuk.toLocaleString('id-ID')}</span>
            </div>
            <div className="p-3 border border-slate-300 rounded bg-rose-50 text-center">
              <span className="text-[10px] text-rose-700 block font-semibold">Total Pengeluaran Kas</span>
              <span className="text-sm font-bold text-rose-900">Rp {totalKeluar.toLocaleString('id-ID')}</span>
            </div>
            <div className="p-3 border border-slate-300 rounded bg-indigo-50 text-center">
              <span className="text-[10px] text-indigo-700 block font-semibold">Saldo Kas Akhir</span>
              <span className="text-sm font-bold text-indigo-900">Rp {saldo.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <table className="w-full font-sans text-[10px] border-collapse border border-slate-400 mb-4">
            <thead>
              <tr className="bg-slate-100 text-slate-900">
                <th className="border border-slate-400 p-1 text-center w-8">No</th>
                <th className="border border-slate-400 p-1.5 text-center">Tanggal</th>
                <th className="border border-slate-400 p-1.5 text-left">Uraian Transaksi</th>
                <th className="border border-slate-400 p-1.5 text-right">Pemasukan</th>
                <th className="border border-slate-400 p-1.5 text-right">Pengeluaran</th>
                <th className="border border-slate-400 p-1.5 text-center">Kategori</th>
              </tr>
            </thead>
            <tbody>
              {cashTransactions.slice(0, 25).map((t, idx) => (
                <tr key={t.id} className="border-b border-slate-300">
                  <td className="border border-slate-300 p-1 text-center">{idx + 1}</td>
                  <td className="border border-slate-300 p-1 text-center">{t.date}</td>
                  <td className="border border-slate-300 p-1.5 font-medium">{t.description || t.title}</td>
                  <td className="border border-slate-300 p-1.5 text-right font-mono text-emerald-700">
                    {t.type === 'MASUK' ? `Rp ${t.amount.toLocaleString('id-ID')}` : '-'}
                  </td>
                  <td className="border border-slate-300 p-1.5 text-right font-mono text-rose-700">
                    {t.type === 'KELUAR' ? `Rp ${t.amount.toLocaleString('id-ID')}` : '-'}
                  </td>
                  <td className="border border-slate-300 p-1 text-center">{t.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    };
  };

  // 9. Rekapitulasi Prestasi Siswa
  const generateAchievementsDocument = (): UnifiedPrintDocumentData => {
    return {
      documentId: 'doc-achievements',
      documentTitle: 'REKAPITULASI PRESTASI & PIAGAM PENGHARGAAN SISWA',
      documentNumber: `421.3 / ${Math.floor(100 + Math.random() * 900)} / PRESTASI / ${new Date().getFullYear()}`,
      documentCategory: 'general',
      paperOrientation: 'landscape',
      recommendedSlots: 2,
      customReporterRole: 'Pembina Prestasi Siswa',
      content: (
        <div>
          <p className="text-center text-[11px] font-sans text-slate-700 mb-3">
            Tahun Pelajaran: {activeAcademicYear} • Total {achievements.length} Piagam Terdata
          </p>
          <table className="w-full font-sans text-[10px] border-collapse border border-slate-400 mb-4">
            <thead>
              <tr className="bg-slate-100 text-slate-900">
                <th className="border border-slate-400 p-1 text-center w-8">No</th>
                <th className="border border-slate-400 p-1.5 text-left">Nama Siswa</th>
                <th className="border border-slate-400 p-1 text-center">Kelas</th>
                <th className="border border-slate-400 p-1.5 text-left">Nama Kejuaraan / Lomba</th>
                <th className="border border-slate-400 p-1 text-center">Tingkat</th>
                <th className="border border-slate-400 p-1 text-center">Peringkat</th>
                <th className="border border-slate-400 p-1.5 text-left">Penyelenggara</th>
                <th className="border border-slate-400 p-1 text-center">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {achievements.slice(0, 30).map((a, idx) => (
                <tr key={a.id} className="border-b border-slate-300">
                  <td className="border border-slate-300 p-1 text-center">{idx + 1}</td>
                  <td className="border border-slate-300 p-1.5 font-bold">{a.studentName}</td>
                  <td className="border border-slate-300 p-1 text-center">{a.studentClass}</td>
                  <td className="border border-slate-300 p-1.5 font-semibold">{a.title}</td>
                  <td className="border border-slate-300 p-1 text-center">{a.level}</td>
                  <td className="border border-slate-300 p-1 text-center font-bold text-amber-700">{a.rank}</td>
                  <td className="border border-slate-300 p-1.5">{a.organizer || '-'}</td>
                  <td className="border border-slate-300 p-1 text-center">{a.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    };
  };

  // Master Document Catalog List
  const documentCatalog = useMemo(() => {
    return [
      {
        id: 'sk380',
        code: 'SK-380',
        title: 'Rekapitulasi Evaluasi Kedisiplinan & 5 Jenjang Sanksi (SK B-380)',
        category: 'discipline',
        categoryLabel: 'Tata Tertib & SK B-380',
        description: 'Format rekapitulasi evaluasi pelanggaran kumulatif seluruh siswa, kategori sanksi bertingkat (Tahap 1 s/d Tahap 5), dan kesiapan berkas sidang pleno madrasah.',
        paperFormat: 'Kertas A4 / F4 • Landscape',
        signers: '3 Penanda Tangan (BK, Waka, Kepala Madrasah)',
        generator: generateDisciplineSk380Document,
        badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
      },
      {
        id: 'violations',
        code: 'PELANGGARAN',
        title: 'Rekapitulasi Buku Catatan Pelanggaran Kedisiplinan Siswa',
        category: 'discipline',
        categoryLabel: 'Tata Tertib & SK B-380',
        description: 'Daftar kronologis pelanggaran tata tertib peserta didik dengan rincian bentuk kasus, bobot poin, tindakan sanksi, dan status penyelesaian.',
        paperFormat: 'Kertas A4 / F4 • Landscape',
        signers: '3 Penanda Tangan (BK, Waka, Kepala Madrasah)',
        generator: generateViolationsDocument,
        badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
      },
      {
        id: 'counseling',
        code: 'BK-LAYANAN',
        title: 'Rekapitulasi Layanan Bimbingan & Konseling (BK)',
        category: 'counseling',
        categoryLabel: 'Bimbingan Konseling (BK)',
        description: 'Dokumen rekapitulasi layanan konseling individual, bimbingan kelompok, konsultasi pribadi, karir, dan kesepakatan tindak lanjut siswa.',
        paperFormat: 'Kertas A4 / F4 • Landscape',
        signers: '2 Penanda Tangan (Guru BK & Waka Kesiswaan)',
        generator: generateCounselingDocument,
        badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
      },
      {
        id: 'parent_call',
        code: 'SP-ORTU',
        title: 'Surat Panggilan Orang Tua / Wali Peserta Didik (SP)',
        category: 'counseling',
        categoryLabel: 'Bimbingan Konseling (BK)',
        description: 'Surat dinas resmi pemanggilan orang tua/wali siswa ke madrasah terkait evaluasi kedisiplinan dan pembinaan terpadu.',
        paperFormat: 'Kertas A4 / F4 • Portrait',
        signers: '3 Penanda Tangan (Guru BK, Waka, Kepala Madrasah)',
        generator: generateParentCallDocument,
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
      },
      {
        id: 'dispensation',
        code: 'DISPENSASI',
        title: 'Surat Keterangan Dispensasi Resmi Kesiswaan',
        category: 'permissions',
        categoryLabel: 'Perizinan & Dispensasi',
        description: 'Surat izin dinas dispensasi KBM untuk siswa yang mewakili madrasah dalam perlombaan, kompetisi sains, olahraga, seni, atau acara kemadrasahan.',
        paperFormat: 'Kertas A4 / F4 • Portrait',
        signers: '2 Penanda Tangan (Waka Kesiswaan & Kepala Madrasah)',
        generator: generateDispensationDocument,
        badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'
      },
      {
        id: 'lpj',
        code: 'LPJ-EKSKUL',
        title: 'Laporan Pertanggungjawaban (LPJ) Kegiatan Ekstrakurikuler & OSIM',
        category: 'activities',
        categoryLabel: 'Ekstrakurikuler & Prestasi',
        description: 'Format laporan resmi kegiatan, absensi kehadiran siswa, realisasi anggaran dana, serta evaluasi capaian dan kendala pelaksanaan.',
        paperFormat: 'Kertas A4 / F4 • Portrait',
        signers: '3 Penanda Tangan (Pembina, Waka, Kepala Madrasah)',
        generator: generateLpjDocument,
        badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      },
      {
        id: 'achievements',
        code: 'PRESTASI',
        title: 'Rekapitulasi Prestasi & Piagam Penghargaan Siswa',
        category: 'activities',
        categoryLabel: 'Ekstrakurikuler & Prestasi',
        description: 'Daftar rekapitulasi capaian medali, piala, dan piagam kejuaraan siswa tingkat kabupaten, provinsi, hingga nasional.',
        paperFormat: 'Kertas A4 / F4 • Landscape',
        signers: '2 Penanda Tangan (Pembina Prestasi & Waka Kesiswaan)',
        generator: generateAchievementsDocument,
        badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
      },
      {
        id: 'osim_meeting',
        code: 'NOTULENSI-OSIM',
        title: 'Berita Acara Rapat & Sidang Pleno Pengurus OSIM',
        category: 'osim',
        categoryLabel: 'OSIM & Musyawarah',
        description: 'Berita acara resmi pelaksanaan musyawarah kerja, sidang pleno, evaluasi program kerja, dan pemilihan ketua umum OSIM.',
        paperFormat: 'Kertas A4 / F4 • Portrait',
        signers: '3 Penanda Tangan (Ketua OSIM, Pembina OSIM, Waka)',
        generator: generateOsimMeetingDocument,
        badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
      },
      {
        id: 'cash_ledger',
        code: 'KAS-KESISWAAN',
        title: 'Buku Kas & Laporan Transparansi Keuangan Kesiswaan',
        category: 'general',
        categoryLabel: 'Keuangan & Presensi',
        description: 'Laporan arus kas masuk dan kas keluar kesiswaan, iuran pembinaan, saldo akhir, dan bukti pertanggungjawaban amanah.',
        paperFormat: 'Kertas A4 / F4 • Portrait',
        signers: '3 Penanda Tangan (Bendahara, Waka, Kepala Madrasah)',
        generator: generateCashLedgerDocument,
        badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
      }
    ];
  }, [
    disciplineStudentsSummary,
    sk380Metrics,
    violations,
    counseling,
    permissions,
    parentCallLetters,
    activityReports,
    achievements,
    osimMeetings,
    cashTransactions,
    activeAcademicYear,
    schoolSetting,
    city,
    currentDate
  ]);

  // Filtered documents by search & category
  const filteredDocuments = useMemo(() => {
    return documentCatalog.filter(doc => {
      if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          doc.title.toLowerCase().includes(query) ||
          doc.code.toLowerCase().includes(query) ||
          doc.description.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [documentCatalog, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* HERO BANNER: PUSAT DOKUMEN CETAK TERPADU */}
      {/* ============================================================== */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-50/90 via-white to-slate-50 border border-indigo-200/90 dark:from-indigo-950 dark:via-[#111827] dark:to-slate-900 dark:border-indigo-500/30 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/40">
              UNIFIED PRINT CENTER • T.P. {activeAcademicYear}
            </span>
            <span className="text-[11px] text-slate-600 dark:text-slate-400">
              Acuan Kop: <strong className="text-slate-800 dark:text-slate-200">{schoolSetting?.name || 'MAN 2 SERAM BAGIAN TIMUR'}</strong>
            </span>
          </div>

          <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <Printer className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Katalog Dokumen Cetak Kedinasan Kesiswaan</span>
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
            Semua pencetakan berkas dari seluruh modul kesiswaan dipusatkan di sini. Lengkap dengan Kop Surat Resmi dari pengaturan madrasah, pilihan kertas A4 / F4 (Folio), serta blok tanda tangan dinamis yang posisinya dapat digeser dengan anak panah ⬅ ➡ dan dapat diedit langsung pada layar pratinjau.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Total Template</span>
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-300">{documentCatalog.length} Berkas Resmi</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* FILTER & SEARCH BAR */}
      {/* ============================================================== */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari judul dokumen cetak, nomor berkas, atau kategori..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Menampilkan <strong>{filteredDocuments.length}</strong> dari {documentCatalog.length} dokumen</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {[
            { id: 'all', label: 'Semua Dokumen' },
            { id: 'discipline', label: 'Tata Tertib & SK B-380' },
            { id: 'counseling', label: 'Bimbingan Konseling (BK)' },
            { id: 'permissions', label: 'Perizinan & Dispensasi' },
            { id: 'activities', label: 'Ekstrakurikuler & Prestasi' },
            { id: 'osim', label: 'OSIM & Musyawarah' },
            { id: 'general', label: 'Keuangan & Presensi' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* DOCUMENT CARDS GRID */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.map(doc => (
          <div
            key={doc.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/50 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${doc.badgeColor}`}>
                  {doc.code}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {doc.categoryLabel}
                </span>
              </div>

              <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                {doc.title}
              </h4>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed line-clamp-3">
                {doc.description}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-[11px] font-sans text-slate-600 dark:text-slate-400">
                <p className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>{doc.paperFormat}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{doc.signers}</span>
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3">
              <button
                type="button"
                onClick={() => onOpenPrintDocument(doc.generator())}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-indigo-950/60 dark:hover:bg-indigo-600 dark:text-indigo-300 dark:hover:text-white border border-indigo-200 dark:border-indigo-800/80 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs group-hover:bg-indigo-600 group-hover:text-white"
              >
                <Printer className="w-4 h-4" />
                <span>Pratinjau & Cetak Resmi</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Tidak ada dokumen yang sesuai</p>
          <p className="text-xs text-slate-500 mt-1">Coba gunakan kata kunci pencarian lain atau pilih kategori Semua Dokumen.</p>
        </div>
      )}
    </div>
  );
};
