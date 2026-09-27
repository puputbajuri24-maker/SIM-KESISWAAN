import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  FileText,
  CheckCircle2,
  Calendar,
  Layers,
  Scale,
  ShieldAlert,
  HeartHandshake,
  Compass,
  FileCheck2,
  DollarSign,
  Award,
  Sparkles,
  Info
} from 'lucide-react';
import { SchoolSetting, Teacher, PrintSignatory } from '../../types';
import { SchoolLetterhead } from './SchoolLetterhead';
import { DynamicSignaturesBlock } from './DynamicSignaturesBlock';
import { createDefaultSignatories } from '../../utils/printSignatureHelper';

export interface UnifiedPrintDocumentData {
  documentId: string;
  documentTitle: string;
  documentNumber?: string;
  documentCategory: 'discipline' | 'counseling' | 'permissions' | 'activities' | 'osim' | 'general';
  paperOrientation?: 'portrait' | 'landscape';
  recommendedSlots?: 1 | 2 | 3;
  dateString?: string;
  academicYear?: string;
  customReporterRole?: string;
  customReporterName?: string;
  customReporterNip?: string;
  content: React.ReactNode;
}

interface UnifiedPrintDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentData: UnifiedPrintDocumentData | null;
  schoolInfo?: Partial<SchoolSetting>;
  teachersList?: Teacher[];
  currentUserName?: string;
}

export const UnifiedPrintDocumentModal: React.FC<UnifiedPrintDocumentModalProps> = ({
  isOpen,
  onClose,
  documentData,
  schoolInfo,
  teachersList = [],
  currentUserName
}) => {
  const [slotsCount, setSlotsCount] = useState<1 | 2 | 3>(3);
  const [signatories, setSignatories] = useState<PrintSignatory[]>([]);
  const [docNumber, setDocNumber] = useState<string>('');
  const [docDate, setDocDate] = useState<string>('');
  const [paperSize, setPaperSize] = useState<'A4' | 'F4'>('A4');
  const [isEditingHeader, setIsEditingHeader] = useState(false);

  // Initialize or re-initialize signatories when documentData changes
  useEffect(() => {
    if (documentData && isOpen) {
      const recSlots = documentData.recommendedSlots || 3;
      setSlotsCount(recSlots);

      const generated = createDefaultSignatories(schoolInfo, {
        documentCategory: documentData.documentCategory,
        reporterRole: documentData.customReporterRole || (
          documentData.documentCategory === 'counseling' ? 'Koordinator Guru BK' :
          documentData.documentCategory === 'discipline' ? 'Koordinator Guru BK' :
          documentData.documentCategory === 'activities' ? 'Guru Pembina Kegiatan' :
          documentData.documentCategory === 'permissions' ? 'Staf Administrasi Kesiswaan' :
          documentData.documentCategory === 'osim' ? 'Pembina OSIM' :
          'Koordinator Pelaksana'
        ),
        reporterName: documentData.customReporterName || currentUserName || 'Guru / Staf Pembina',
        reporterNip: documentData.customReporterNip || '-'
      });

      setSignatories(generated);
      setDocNumber(documentData.documentNumber || `421.3 / ${Math.floor(100 + Math.random() * 900)} / MAN.02 / ${new Date().getFullYear()}`);
      setDocDate(documentData.dateString || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
    }
  }, [documentData, isOpen, schoolInfo, currentUserName]);

  if (!isOpen || !documentData) return null;

  const handlePrint = () => {
    window.print();
  };

  const isLandscape = documentData.paperOrientation === 'landscape';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Container Dialog */}
      <div
        className={`bg-white dark:bg-slate-900 w-full ${
          isLandscape ? 'max-w-6xl' : 'max-w-5xl'
        } rounded-2xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden border border-slate-200 dark:border-slate-800 print:border-none print:shadow-none print:max-w-none print:max-h-none print:overflow-visible`}
      >
        {/* ============================================================== */}
        {/* MODAL HEADER TOOLBAR (PRINT:HIDDEN) */}
        {/* ============================================================== */}
        <div className="print:hidden p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase">
                  {documentData.documentCategory.toUpperCase()}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Ukuran {paperSize} • {isLandscape ? 'Landscape' : 'Portrait'}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
                {documentData.documentTitle}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Paper Size selector */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setPaperSize('A4')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  paperSize === 'A4' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Kertas A4
              </button>
              <button
                type="button"
                onClick={() => setPaperSize('F4')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  paperSize === 'F4' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                F4 (Folio)
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all hover:scale-105"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Print Dokumen</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MODAL BODY (PRINTABLE SCROLL CONTAINER) */}
        {/* ============================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/60 dark:bg-slate-950/80 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          {/* Virtual Paper Sheet */}
          <div
            className={`w-full bg-white text-slate-950 p-6 sm:p-10 rounded-xl shadow-xl border border-slate-300 font-serif leading-relaxed text-xs print:border-none print:shadow-none print:p-4 print:rounded-none ${
              isLandscape ? 'max-w-[1100px]' : 'max-w-[850px]'
            }`}
          >
            {/* 1. KOP SURAT RESMI MADRASAH (Acuan Pengaturan Sekolah) */}
            <SchoolLetterhead
              schoolInfo={schoolInfo as SchoolSetting}
              documentTitle={documentData.documentTitle}
              documentNumber={docNumber}
              compact={false}
              showDoubleLine={true}
            />

            {/* Header info editor (Print Hidden) */}
            <div className="print:hidden my-2 flex items-center justify-between text-[11px] font-sans text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-indigo-500" />
                <span>Nomor Surat: <strong>{docNumber}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingHeader(!isEditingHeader)}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                {isEditingHeader ? 'Tutup Edit Header' : 'Ubah No. Surat / Tanggal'}
              </button>
            </div>

            {isEditingHeader && (
              <div className="print:hidden p-3 bg-indigo-50/70 dark:bg-indigo-950/50 rounded-xl border border-indigo-200 font-sans text-xs space-y-2 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      Nomor Dokumen Kedinasan:
                    </label>
                    <input
                      type="text"
                      value={docNumber}
                      onChange={e => setDocNumber(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      Tanggal Surat:
                    </label>
                    <input
                      type="text"
                      value={docDate}
                      onChange={e => setDocDate(e.target.value)}
                      placeholder="Contoh: 27 September 2026"
                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. ISI KONTEN DOKUMEN CETAK */}
            <div className="my-4 font-sans text-xs leading-normal">
              {documentData.content}
            </div>

            {/* 3. BLOK TANDA TANGAN DINAMIS DENGAN KONTROL ANAK PANAH */}
            <div className="mt-8 pt-4">
              <DynamicSignaturesBlock
                signatories={signatories}
                onChange={setSignatories}
                activeSlotsCount={slotsCount}
                onSlotsCountChange={setSlotsCount}
                schoolInfo={schoolInfo}
                teachersList={teachersList}
                defaultCity={schoolInfo?.defaultCity || 'Bula'}
                isEditableInPreview={true}
                onResetToDefault={() => {
                  const fresh = createDefaultSignatories(schoolInfo, {
                    documentCategory: documentData.documentCategory,
                    reporterRole: documentData.customReporterRole,
                    reporterName: documentData.customReporterName || currentUserName,
                    reporterNip: documentData.customReporterNip,
                    defaultSlotsCount: documentData.recommendedSlots || 3,
                    forceResetToDefault: true
                  });
                  setSignatories(fresh);
                  setSlotsCount(documentData.recommendedSlots || 3);
                }}
              />
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MODAL FOOTER ACTION BAR (PRINT:HIDDEN) */}
        {/* ============================================================== */}
        <div className="print:hidden p-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 text-xs">
          <span className="text-slate-500 font-medium">
            💡 Tip: Atur posisi penanda tangan dengan anak panah ⬅ ➡ sebelum mencetak.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Tutup Pratinjau
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
