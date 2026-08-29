import * as XLSX from 'xlsx';
import { Extracurricular, Teacher } from '../types';

export interface ParsedImportTeacher extends Omit<Teacher, 'id'> {
  isValid: boolean;
  errors: string[];
}

/**
 * Generate default sample teacher & pembina data
 */
export const generateTeacherTemplateData = (extracurriculars: Extracurricular[] = []) => {
  const e1 = extracurriculars[0]?.name || 'Pramuka';
  const e2 = extracurriculars[1]?.name || 'PMR Wira';
  const e3 = extracurriculars[2]?.name || 'Paskibra';
  const e4 = extracurriculars[3]?.name || 'KIR (Karya Ilmiah Remaja)';
  const e5 = extracurriculars[4]?.name || 'Futsal & Sepakbola';

  return [
    {
      'NIP': '198503122010011005',
      'Nama Lengkap': 'Drs. H. Bambang Sutrisno, M.Pd.',
      'Jenis Kelamin': 'L',
      'Jabatan / Peran': 'Pembina Ekskul',
      'Mata Pelajaran': 'Pendidikan Jasmani & Olahraga',
      'No HP / WhatsApp': '081234567801',
      'Email': 'bambang.sutrisno@sekolah.sch.id',
      'Binaan Ekstrakurikuler': `${e1}, ${e5}`,
      'Status': 'Aktif'
    },
    {
      'NIP': '198807252014032002',
      'Nama Lengkap': 'Siti Nurhaliza, S.Psi., M.A.',
      'Jenis Kelamin': 'P',
      'Jabatan / Peran': 'Guru BK / Konselor',
      'Mata Pelajaran': 'Bimbingan Konseling',
      'No HP / WhatsApp': '081234567802',
      'Email': 'siti.nurhaliza@sekolah.sch.id',
      'Binaan Ekstrakurikuler': '',
      'Status': 'Aktif'
    },
    {
      'NIP': '199011152017081003',
      'Nama Lengkap': 'Ahmad Fauzi, S.Pd., Gr.',
      'Jenis Kelamin': 'L',
      'Jabatan / Peran': 'Pembina OSIM',
      'Mata Pelajaran': 'Pendidikan Pancasila & Kewarganegaraan',
      'No HP / WhatsApp': '081234567803',
      'Email': 'ahmad.fauzi@sekolah.sch.id',
      'Binaan Ekstrakurikuler': e3,
      'Status': 'Aktif'
    },
    {
      'NIP': '199204182019032004',
      'Nama Lengkap': 'Dewi Anggraini, S.Pd.',
      'Jenis Kelamin': 'P',
      'Jabatan / Peran': 'Pembina Ekskul',
      'Mata Pelajaran': 'Bahasa Inggris',
      'No HP / WhatsApp': '081234567804',
      'Email': 'dewi.anggraini@sekolah.sch.id',
      'Binaan Ekstrakurikuler': `${e2}, ${e4}`,
      'Status': 'Aktif'
    },
    {
      'NIP': '197901052006041001',
      'Nama Lengkap': 'Drs. Supriyanto, M.M.',
      'Jenis Kelamin': 'L',
      'Jabatan / Peran': 'Waka Kesiswaan',
      'Mata Pelajaran': 'Sejarah Indonesia',
      'No HP / WhatsApp': '081234567805',
      'Email': 'supriyanto@sekolah.sch.id',
      'Binaan Ekstrakurikuler': '',
      'Status': 'Aktif'
    },
    {
      'NIP': '198706142012021003',
      'Nama Lengkap': 'Hendro Pratama, S.Si.',
      'Jenis Kelamin': 'L',
      'Jabatan / Peran': 'Tim Ketertiban',
      'Mata Pelajaran': 'Fisika',
      'No HP / WhatsApp': '081234567806',
      'Email': 'hendro.pratama@sekolah.sch.id',
      'Binaan Ekstrakurikuler': '',
      'Status': 'Aktif'
    }
  ];
};

/**
 * Downloads official Excel (.xlsx) import template for teachers & pembina
 */
export const downloadTeacherTemplateXLSX = (extracurriculars: Extracurricular[] = [], schoolName?: string) => {
  const data = generateTeacherTemplateData(extracurriculars);
  const ws = XLSX.utils.json_to_sheet(data);

  // Set explicit column widths for readability
  ws['!cols'] = [
    { wch: 22 }, // NIP
    { wch: 32 }, // Nama Lengkap
    { wch: 14 }, // Jenis Kelamin
    { wch: 24 }, // Jabatan / Peran
    { wch: 30 }, // Mata Pelajaran
    { wch: 18 }, // No HP / WhatsApp
    { wch: 30 }, // Email
    { wch: 35 }, // Binaan Ekstrakurikuler
    { wch: 12 }  // Status
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Guru & Pembina');

  // Sheet 2: Petunjuk Pengisian
  const guideData = [
    { 'KOLOM': 'NIP', 'STATUS': 'Opsional', 'CONTOH': '198503122010011005', 'PETUNJUK': 'NIP / NUPTK / NPK resmi pegawai (isi tanda strip "-" jika non-NIP).' },
    { 'KOLOM': 'Nama Lengkap', 'STATUS': 'Wajib', 'CONTOH': 'Drs. H. Bambang Sutrisno, M.Pd.', 'PETUNJUK': 'Nama lengkap beserta gelar akademik/keagamaan pembina/guru.' },
    { 'KOLOM': 'Jenis Kelamin', 'STATUS': 'Opsional', 'CONTOH': 'L atau P', 'PETUNJUK': 'Isi dengan huruf "L" untuk Laki-Laki atau "P" untuk Perempuan (Default: L).' },
    { 'KOLOM': 'Jabatan / Peran', 'STATUS': 'Wajib', 'CONTOH': 'Pembina Ekskul', 'PETUNJUK': 'Pilihan: Pembina Ekskul, Guru BK / Konselor, Pembina OSIM, Waka Kesiswaan, Tim Ketertiban, Guru Mata Pelajaran, atau Staf Kesiswaan.' },
    { 'KOLOM': 'Mata Pelajaran', 'STATUS': 'Opsional', 'CONTOH': 'Pendidikan Jasmani & Olahraga', 'PETUNJUK': 'Mata pelajaran yang diampu atau bidang keahlian guru.' },
    { 'KOLOM': 'No HP / WhatsApp', 'STATUS': 'Opsional', 'CONTOH': '081234567801', 'PETUNJUK': 'Nomor WhatsApp aktif untuk koordinasi kegiatan dan presensi kesiswaan.' },
    { 'KOLOM': 'Email', 'STATUS': 'Opsional', 'CONTOH': 'guru@sekolah.sch.id', 'PETUNJUK': 'Alamat email aktif untuk akun login atau korespondensi.' },
    { 'KOLOM': 'Binaan Ekstrakurikuler', 'STATUS': 'Opsional', 'CONTOH': 'Pramuka, PMR Wira', 'PETUNJUK': 'Nama ekskul binaan (pisahkan dengan koma jika membina lebih dari 1 ekskul). Lihat sheet Daftar Ekstrakurikuler.' },
    { 'KOLOM': 'Status', 'STATUS': 'Opsional', 'CONTOH': 'Aktif', 'PETUNJUK': 'Pilihan status: Aktif atau Nonaktif (Default: Aktif).' }
  ];

  const wsGuide = XLSX.utils.json_to_sheet(guideData);
  wsGuide['!cols'] = [
    { wch: 22 },
    { wch: 12 },
    { wch: 30 },
    { wch: 65 }
  ];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk Pengisian');

  // Sheet 3: Daftar Unit Ekstrakurikuler Terdaftar
  if (extracurriculars.length > 0) {
    const ekskulData = extracurriculars.map((e, idx) => ({
      'No': idx + 1,
      'Kode Ekskul': e.id,
      'Nama Ekstrakurikuler': e.name,
      'Kategori': e.category || 'Umum',
      'Hari & Waktu': `${e.day || '-'} (${e.startTime || ''} - ${e.endTime || ''})`,
      'Lokasi / Ruangan': e.location || '-',
      'Pembina Terdaftar': e.coachName || '-'
    }));

    const wsEkskul = XLSX.utils.json_to_sheet(ekskulData);
    wsEkskul['!cols'] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 28 },
      { wch: 18 },
      { wch: 24 },
      { wch: 25 },
      { wch: 28 }
    ];
    XLSX.utils.book_append_sheet(wb, wsEkskul, 'Daftar Ekstrakurikuler');
  }

  const prefix = schoolName ? schoolName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : 'sim_kesiswaan';
  XLSX.writeFile(wb, `Template_Import_Guru_Pembina_${prefix}.xlsx`);
};

/**
 * Downloads standard UTF-8 CSV import template for teachers & pembina
 */
export const downloadTeacherTemplateCSV = (extracurriculars: Extracurricular[] = []) => {
  const data = generateTeacherTemplateData(extracurriculars);
  const ws = XLSX.utils.json_to_sheet(data);
  const csvContent = XLSX.utils.sheet_to_csv(ws);

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Template_Import_Guru_Pembina.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Parse and validate uploaded Excel / CSV rows into structured teacher records
 */
export const parseTeacherRows = (rawRows: any[], existingEkskul: Extracurricular[] = []): ParsedImportTeacher[] => {
  return rawRows.map((item, index) => {
    const errors: string[] = [];

    // 1. Resolve Full Name (Mandatory)
    const rawName = item['Nama Lengkap'] || item['Nama Guru'] || item['Nama'] || item['fullName'] || item['name'] || item['NAMA'];
    const fullName = rawName ? String(rawName).trim() : '';
    if (!fullName) {
      errors.push('Nama Lengkap guru/pembina wajib diisi');
    }

    // 2. Resolve NIP
    const rawNip = item['NIP'] || item['nip'] || item['NUPTK'] || item['NPK'] || item['No NIP'];
    const nip = rawNip ? String(rawNip).trim() : '-';

    // 3. Resolve Gender
    const rawGender = String(item['Jenis Kelamin'] || item['JK'] || item['gender'] || item['L/P'] || 'L').toUpperCase().trim();
    const gender: 'L' | 'P' = (rawGender === 'P' || rawGender === 'PEREMPUAN' || rawGender === 'WANITA' || rawGender === 'FEMALE') ? 'P' : 'L';

    // 4. Resolve Role / Jabatan (Mandatory)
    const rawRole = item['Jabatan / Peran'] || item['Jabatan'] || item['Peran'] || item['role'] || item['JABATAN'] || 'Pembina Ekskul';
    let role = String(rawRole).trim();
    
    // Normalize role synonyms
    const lowerRole = role.toLowerCase();
    if (lowerRole.includes('bk') || lowerRole.includes('konselor') || lowerRole.includes('bimbingan')) {
      role = 'Guru BK / Konselor';
    } else if (lowerRole.includes('osim') || lowerRole.includes('osiss')) {
      role = 'Pembina OSIM';
    } else if (lowerRole.includes('waka') || lowerRole.includes('kesiswaan')) {
      role = 'Waka Kesiswaan';
    } else if (lowerRole.includes('tertib') || lowerRole.includes('tatib') || lowerRole.includes('disiplin')) {
      role = 'Tim Ketertiban';
    } else if (lowerRole.includes('staf') || lowerRole.includes('staff')) {
      role = 'Staf Kesiswaan';
    } else if (lowerRole.includes('mapel') || lowerRole.includes('guru')) {
      role = 'Guru Mata Pelajaran';
    } else if (lowerRole.includes('ekskul') || lowerRole.includes('ekstrakurikuler') || lowerRole.includes('pembina')) {
      role = 'Pembina Ekskul';
    }

    // 5. Resolve Subject / Mata Pelajaran
    const rawSubject = item['Mata Pelajaran'] || item['Mapel'] || item['subject'] || item['Bidang Studi'] || item['Keahlian'];
    const subject = rawSubject ? String(rawSubject).trim() : '';

    // 6. Resolve Phone / WA
    const rawPhone = item['No HP / WhatsApp'] || item['No HP'] || item['No WA'] || item['Telepon'] || item['phone'] || item['telepon'] || item['WhatsApp'];
    const phone = rawPhone ? String(rawPhone).trim() : '';

    // 7. Resolve Email
    const rawEmail = item['Email'] || item['email'] || item['Surel'] || item['E-mail'];
    const email = rawEmail ? String(rawEmail).trim() : '';

    // 8. Resolve Assigned Extracurriculars
    const rawEkskul = item['Binaan Ekstrakurikuler'] || item['Ekskul Binaan'] || item['assignedExtracurriculars'] || item['Ekstrakurikuler'] || item['Binaan'];
    let assignedExtracurriculars: string[] = [];
    if (rawEkskul) {
      if (Array.isArray(rawEkskul)) {
        assignedExtracurriculars = rawEkskul.map(String);
      } else {
        assignedExtracurriculars = String(rawEkskul)
          .split(/[,;\n]+/)
          .map(s => s.trim())
          .filter(Boolean);
      }
    }

    // 9. Resolve Status
    const rawStatus = String(item['Status'] || item['status'] || 'Aktif').trim();
    const isActive = !rawStatus.toLowerCase().includes('non') && !rawStatus.toLowerCase().includes('tidak') && !rawStatus.toLowerCase().includes('pasif');

    const isPembina = role.toLowerCase().includes('pembina') || assignedExtracurriculars.length > 0;

    return {
      nip,
      fullName,
      gender,
      role,
      subject,
      phone,
      email,
      assignedExtracurriculars,
      isPembina,
      isActive,
      isValid: errors.length === 0,
      errors
    };
  });
};
