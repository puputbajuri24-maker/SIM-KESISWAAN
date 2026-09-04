import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSchool } from '../../contexts/SchoolContext';
import { SchoolSetting } from '../../types';

interface ExportActionsProps {
  filename: string;
  title: string;
  data: Record<string, any>[];
  headers?: { header: string; key: string }[];
  schoolName?: string;
  academicYear?: string;
  customSchoolInfo?: SchoolSetting;
}

export const ExportActions: React.FC<ExportActionsProps> = ({
  filename,
  title,
  data,
  headers,
  schoolName,
  academicYear,
  customSchoolInfo
}) => {
  const { schoolInfo: contextSchoolInfo, activeAcademicYear, activeSemester } = useSchool();
  const schoolInfo = customSchoolInfo || contextSchoolInfo;
  const currentSchoolName = schoolName || schoolInfo?.name || 'SMA NEGERI 1 TELADAN NUSANTARA';
  const currentAcademicYear = academicYear || `${activeAcademicYear} ${activeSemester}`;

  const [isOpen, setIsOpen] = useState(false);

  const exportToExcel = () => {
    try {
      const exportData = data.map(item => {
        if (headers) {
          const row: Record<string, any> = {};
          headers.forEach(h => {
            row[h.header] = item[h.key] ?? '-';
          });
          return row;
        }
        return item;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Kesiswaan');
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
      setIsOpen(false);
    } catch (e) {
      console.error('Error export excel:', e);
    }
  };

  const exportToCSV = () => {
    try {
      const exportData = data.map(item => {
        if (headers) {
          const row: Record<string, any> = {};
          headers.forEach(h => {
            row[h.header] = item[h.key] ?? '-';
          });
          return row;
        }
        return item;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setIsOpen(false);
    } catch (e) {
      console.error('Error export CSV:', e);
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF('landscape');
      
      let startY = 15;

      // Central Institution
      if (schoolInfo?.centralInstitution) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(schoolInfo.centralInstitution.toUpperCase(), 148, startY, { align: 'center' });
        startY += 5;
      }

      // Regional Institution
      if (schoolInfo?.regionalInstitution) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(schoolInfo.regionalInstitution.toUpperCase(), 148, startY, { align: 'center' });
        startY += 5;
      }

      // School Name
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(currentSchoolName.toUpperCase(), 148, startY, { align: 'center' });
      startY += 5;
      
      // Address (Baris 4 - Kalimat sesuai yang ditulis user)
      if (schoolInfo?.address) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(schoolInfo.address, 148, startY, { align: 'center' });
        startY += 4;
      }

      // Double Line
      doc.setLineWidth(0.8);
      doc.line(14, startY, 282, startY);
      doc.setLineWidth(0.2);
      doc.line(14, startY + 1.2, 282, startY + 1.2);
      startY += 6;

      // Document Title
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`LAPORAN RESMI: ${title.toUpperCase()}`, 14, startY);
      startY += 5;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Periode Tahun Ajaran: ${currentAcademicYear} | Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, startY);
      startY += 4;

      const tableHeaders = headers ? headers.map(h => h.header) : Object.keys(data[0] || {});
      const tableRows = data.map((item, index) => {
        if (headers) {
          return [index + 1, ...headers.map(h => String(item[h.key] ?? '-'))];
        }
        return [index + 1, ...Object.values(item).map(v => String(v ?? '-'))];
      });

      autoTable(doc, {
        head: [['No', ...tableHeaders]],
        body: tableRows,
        startY: startY,
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      // Signature footer in PDF
      const finalY = (doc as any).lastAutoTable?.finalY || 160;
      if (finalY < 165) {
        const signY = finalY + 15;
        doc.setFontSize(8);
        doc.text('Mengetahui,', 20, signY);
        doc.text('Kepala Sekolah', 20, signY + 4);
        doc.text(schoolInfo?.principalName || 'Kepala Sekolah', 20, signY + 22);
        doc.text(`NIP. ${schoolInfo?.principalNip || '-'}`, 20, signY + 26);

        doc.text(`Ditetapkan pada: ${new Date().toISOString().split('T')[0]}`, 220, signY);
        doc.text('Waka Bidang Kesiswaan', 220, signY + 4);
        doc.text(schoolInfo?.wakaKesiswaanName || schoolInfo?.wakaName || 'Waka Kesiswaan', 220, signY + 22);
        doc.text(`NIP. ${schoolInfo?.wakaNip || '-'}`, 220, signY + 26);
      }

      doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
      setIsOpen(false);
    } catch (e) {
      console.error('Error export PDF:', e);
    }
  };

  const handlePrintHTML = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const leftLogo = schoolInfo?.logoLeftUrl || schoolInfo?.logoUrl;
    const rightLogo = schoolInfo?.logoRightUrl;

    const tableHeaders = headers ? headers.map(h => h.header) : Object.keys(data[0] || {});
    const tableRows = data.map((item, index) => {
      if (headers) {
        return [index + 1, ...headers.map(h => String(item[h.key] ?? '-'))];
      }
      return [index + 1, ...Object.values(item).map(v => String(v ?? '-'))];
    });

    const theadHTML = `<tr>${['No', ...tableHeaders].map(th => `<th style="border: 1px solid #334155; padding: 6px; background-color: #f1f5f9; font-size: 11px; text-align: left;">${th}</th>`).join('')}</tr>`;
    const tbodyHTML = tableRows.map(row => `<tr>${row.map(cell => `<td style="border: 1px solid #cbd5e1; padding: 5px 6px; font-size: 10px;">${cell}</td>`).join('')}</tr>`).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - ${currentSchoolName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 25px; margin: 0; color: #0f172a; }
            .header { display: flex; align-items: center; justify-content: space-between; gap: 15px; margin-bottom: 8px; font-family: 'Times New Roman', Times, serif; }
            .logo { width: 75px; height: 75px; object-fit: contain; }
            .center-text { flex: 1; text-align: center; }
            .center-text h4 { font-size: 13px; margin: 0; text-transform: uppercase; font-weight: bold; }
            .center-text h5 { font-size: 12px; margin: 2px 0 0 0; text-transform: uppercase; font-weight: bold; }
            .center-text h2 { font-size: 17px; margin: 4px 0; text-transform: uppercase; font-weight: 900; }
            .center-text p { font-family: Arial, sans-serif; font-size: 10px; margin: 1px 0; color: #475569; }
            .double-line { border-bottom: 3px solid #0f172a; margin-bottom: 2px; }
            .single-line { border-bottom: 1px solid #0f172a; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .signatures { margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px; }
            @media print { body { padding: 10px; } }
          </style>
        </head>
        <body>
          <div class="header">
            ${leftLogo ? `<img class="logo" src="${leftLogo}" alt="Logo Kiri" />` : '<div style="width:75px"></div>'}
            <div class="center-text">
              ${schoolInfo?.centralInstitution ? `<h4>${schoolInfo.centralInstitution}</h4>` : ''}
              ${schoolInfo?.regionalInstitution ? `<h5>${schoolInfo.regionalInstitution}</h5>` : ''}
              <h2>${currentSchoolName}</h2>
              ${schoolInfo?.address ? `<p>${schoolInfo.address}</p>` : ''}
            </div>
            ${rightLogo ? `<img class="logo" src="${rightLogo}" alt="Logo Kanan" />` : '<div style="width:75px"></div>'}
          </div>
          <div class="double-line"></div>
          <div class="single-line"></div>

          <h3 style="margin: 0; text-transform: uppercase; font-size: 14px; font-weight: bold; text-align: center;">
            ${title}
          </h3>
          <p style="margin: 4px 0 15px 0; font-size: 11px; text-align: center; color: #64748b;">
            Periode: ${currentAcademicYear} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <table>
            <thead>${theadHTML}</thead>
            <tbody>${tbodyHTML}</tbody>
          </table>

          <div class="signatures">
            <div>
              <p>Mengetahui,</p>
              <p><strong>Kepala Sekolah</strong></p>
              <div style="height: 50px;"></div>
              <p><strong><u>${schoolInfo?.principalName || 'Kepala Sekolah'}</u></strong></p>
              <p style="font-size: 10px; color: #64748b;">NIP. ${schoolInfo?.principalNip || '-'}</p>
            </div>
            <div style="text-align: right;">
              <p>Dicetak pada: ${new Date().toLocaleDateString('id-ID')}</p>
              <p><strong>Waka Bidang Kesiswaan</strong></p>
              <div style="height: 50px;"></div>
              <p><strong><u>${schoolInfo?.wakaKesiswaanName || schoolInfo?.wakaName || 'Waka Kesiswaan'}</u></strong></p>
              <p style="font-size: 10px; color: #64748b;">NIP. ${schoolInfo?.wakaNip || '-'}</p>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left font-sans">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
      >
        <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <span>Ekspor / Cetak Laporan</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-1.5 z-30 text-xs">
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Pilihan Format Dokumen
            </div>
            <button
              onClick={handlePrintHTML}
              className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-2.5 transition-colors"
            >
              <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <div>
                <span className="font-bold block">Cetak Lembar Resmi (A4)</span>
                <span className="text-[10px] text-slate-400">Lengkap dengan Kop & Logo</span>
              </div>
            </button>
            <button
              onClick={exportToPDF}
              className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-2.5 transition-colors"
            >
              <FileText className="w-4 h-4 text-rose-500" />
              <div>
                <span className="font-bold block">Unduh Berkas PDF</span>
                <span className="text-[10px] text-slate-400">PDF Landscape Resmi</span>
              </div>
            </button>
            <button
              onClick={exportToExcel}
              className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-2.5 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <div>
                <span className="font-bold block">Excel Spreadsheet (.xlsx)</span>
                <span className="text-[10px] text-slate-400">Tabel data terformat</span>
              </div>
            </button>
            <button
              onClick={exportToCSV}
              className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-2.5 transition-colors"
            >
              <Download className="w-4 h-4 text-blue-500" />
              <div>
                <span className="font-bold block">Data CSV Mentah</span>
                <span className="text-[10px] text-slate-400">Comma-separated values</span>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
