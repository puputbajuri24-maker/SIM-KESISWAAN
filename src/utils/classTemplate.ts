import * as XLSX from 'xlsx';
import { SchoolClass, Teacher } from '../types';

export interface ParsedImportClass extends Omit<SchoolClass, 'id'> {
  id?: string;
  isValid: boolean;
  errors: string[];
}

/**
 * Generate default sample class / rombel template data
 */
export const generateClassTemplateData = (teachers: Teacher[] = []) => {
  const t1 = teachers[0]?.fullName || 'Nama Wali Kelas 1';
  const t2 = teachers[1]?.fullName || 'Nama Wali Kelas 2';
  const t3 = teachers[2]?.fullName || 'Nama Wali Kelas 3';
  const t4 = teachers[3]?.fullName || 'Nama Wali Kelas 4';
  const t5 = teachers[4]?.fullName || 'Nama Wali Kelas 5';

  return [
    {
      'Nama Rombel': 'X-1',
      'Tingkat': 'X',
      'Jurusan / Peminatan': 'Umum (Kurikulum Merdeka / Fase E)',
      'Wali Kelas': t1
    },
    {
      'Nama Rombel': 'X-2',
      'Tingkat': 'X',
      'Jurusan / Peminatan': 'Umum (Kurikulum Merdeka / Fase E)',
      'Wali Kelas': t2
    },
    {
      'Nama Rombel': 'XI MIPA 1',
      'Tingkat': 'XI',
      'Jurusan / Peminatan': 'MIPA (Matematika & IPA)',
      'Wali Kelas': t3
    },
    {
      'Nama Rombel': 'XI IPS 1',
      'Tingkat': 'XI',
      'Jurusan / Peminatan': 'IPS (Ilmu-Ilmu Sosial)',
      'Wali Kelas': t4
    },
    {
      'Nama Rombel': 'XII Keagamaan',
      'Tingkat': 'XII',
      'Jurusan / Peminatan': 'Ilmu Keagamaan Islam (IIK)',
      'Wali Kelas': t5
    }
  ];
};

/**
 * Downloads official Excel (.xlsx) import template for Classes / Rombel
 */
export const downloadClassTemplateXLSX = (teachers: Teacher[] = [], schoolName?: string) => {
  const data = generateClassTemplateData(teachers);
  const ws = XLSX.utils.json_to_sheet(data);

  ws['!cols'] = [
    { wch: 20 }, // Nama Rombel
    { wch: 12 }, // Tingkat
    { wch: 35 }, // Jurusan / Peminatan
    { wch: 35 }  // Wali Kelas
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Rombel Kelas');

  // Add Guide Sheet
  const guideData = [
    { 'PETUNJUK PENGISIAN MASTER ROMBEL KELAS': '' },
    { 'PETUNJUK PENGISIAN MASTER ROMBEL KELAS': '1. Kolom "Nama Rombel" wajib diisi (Contoh: X-1, X MIA 1, Fase E-1, XI IPA 1).' },
    { 'PETUNJUK PENGISIAN MASTER ROMBEL KELAS': '2. Kolom "Tingkat" diisi dengan pilihan: X, XI, atau XII.' },
    { 'PETUNJUK PENGISIAN MASTER ROMBEL KELAS': '3. Kolom "Jurusan / Peminatan" diisi dengan peminatan kelas (MIPA, IPS, Keagamaan, Umum, dll).' },
    { 'PETUNJUK PENGISIAN MASTER ROMBEL KELAS': '4. Kolom "Wali Kelas" diisi dengan nama guru yang bertugas sebagai wali kelas.' }
  ];
  const wsGuide = XLSX.utils.json_to_sheet(guideData);
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk Format');

  const fileName = schoolName
    ? `Template_Master_Rombel_Kelas_${schoolName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`
    : 'Template_Master_Rombel_Kelas.xlsx';

  XLSX.writeFile(wb, fileName);
};

/**
 * Downloads CSV import template for Classes
 */
export const downloadClassTemplateCSV = (teachers: Teacher[] = []) => {
  const data = generateClassTemplateData(teachers);
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Template_Master_Rombel_Kelas.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Parses raw JSON rows from uploaded file into validated Class objects
 */
export const parseClassRows = (rawRows: any[], teachers: Teacher[] = []): ParsedImportClass[] => {
  return rawRows.map((row) => {
    const errors: string[] = [];

    // Helper to find value across possible column headers
    const getValue = (...possibleKeys: string[]): string => {
      for (const k of possibleKeys) {
        const foundKey = Object.keys(row).find(
          rk => rk.trim().toLowerCase() === k.trim().toLowerCase()
        );
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
          return String(row[foundKey]).trim();
        }
      }
      return '';
    };

    const name = getValue('Nama Rombel', 'Nama Kelas', 'Kelas', 'Rombel', 'Name');
    let rawGrade = getValue('Tingkat', 'Grade', 'Tingkatan', 'Kelas Tingkat');
    const major = getValue('Jurusan / Peminatan', 'Jurusan', 'Peminatan', 'Major') || 'Umum';
    let homeroomTeacher = getValue('Wali Kelas', 'Wali', 'Guru Wali', 'HomeroomTeacher') || 'Belum Ditentukan';

    if (!name) {
      errors.push('Nama Rombel wajib diisi');
    }

    // Auto-detect grade if empty
    let grade: 'X' | 'XI' | 'XII' = 'X';
    const gradeUpper = rawGrade.toUpperCase();
    if (gradeUpper.includes('XII') || gradeUpper === '12' || name.toUpperCase().includes('XII') || name.startsWith('12')) {
      grade = 'XII';
    } else if (gradeUpper.includes('XI') || gradeUpper === '11' || name.toUpperCase().includes('XI') || name.startsWith('11')) {
      grade = 'XI';
    } else {
      grade = 'X';
    }

    // If homeroom teacher specified, try to match closely
    if (homeroomTeacher && homeroomTeacher !== 'Belum Ditentukan') {
      const matchedTeacher = teachers.find(
        t => t.fullName.toLowerCase().includes(homeroomTeacher.toLowerCase()) ||
             homeroomTeacher.toLowerCase().includes(t.fullName.toLowerCase())
      );
      if (matchedTeacher) {
        homeroomTeacher = matchedTeacher.fullName;
      }
    }

    return {
      name,
      grade,
      major,
      homeroomTeacher,
      studentCount: 0,
      isValid: errors.length === 0,
      errors
    };
  });
};
