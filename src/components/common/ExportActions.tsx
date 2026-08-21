import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportActionsProps {
  filename: string;
  title: string;
  data: Record<string, any>[];
  headers?: { header: string; key: string }[];
  schoolName?: string;
  academicYear?: string;
}

export const ExportActions: React.FC<ExportActionsProps> = ({
  filename,
  title,
  data,
  headers,
  schoolName = 'SMA NEGERI 1 TELADAN NUSANTARA',
  academicYear = '2026/2027 Ganjil'
}) => {
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
      
      // Header Kop Surat
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(schoolName.toUpperCase(), 14, 15);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('SISTEM INFORMASI MANAJEMEN KESISWAAN & EKSTRAKURIKULER (SIM-KESISWAAN)', 14, 21);
      doc.text(`Laporan: ${title} | Periode Tahun Ajaran: ${academicYear}`, 14, 27);
      doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 33);
      doc.line(14, 36, 282, 36);

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
        startY: 40,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [24, 24, 27], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
      setIsOpen(false);
    } catch (e) {
      console.error('Error export PDF:', e);
    }
  };

  return (
    <div className="relative inline-block text-left font-sans">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded bg-[#161618] border border-[#27272a] text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors"
      >
        <Download className="w-3.5 h-3.5 text-blue-400" />
        <span>EXPORT_DATA</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-48 rounded bg-[#0d0d0f] border border-[#27272a] shadow-xl py-1 z-30 font-mono text-[11px]">
            <button
              onClick={exportToPDF}
              className="w-full text-left px-3 py-1.5 text-zinc-300 hover:bg-[#161618] flex items-center gap-2"
            >
              <FileText className="w-3.5 h-3.5 text-red-400" />
              <span>PDF_OFFICIAL (Print)</span>
            </button>
            <button
              onClick={exportToExcel}
              className="w-full text-left px-3 py-1.5 text-zinc-300 hover:bg-[#161618] flex items-center gap-2"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>EXCEL_SHEET (.xlsx)</span>
            </button>
            <button
              onClick={exportToCSV}
              className="w-full text-left px-3 py-1.5 text-zinc-300 hover:bg-[#161618] flex items-center gap-2"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>CSV_FORMAT</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
