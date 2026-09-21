import * as XLSX from 'xlsx';
import { SchoolClass, Student } from '../types';
import { findMatchingClass } from './classResolver';
import { formatStudentCode } from './idGenerator';

export interface ParsedImportStudent extends Omit<Student, 'id' | 'createdAt'> {
  isValid: boolean;
  errors: string[];
}

/**
 * Generate default sample rows with realistic Indonesian student profiles
 */
export const generateStudentTemplateData = (classes: SchoolClass[] = []) => {
  const c1 = classes[0]?.name || 'X MIPA 1';
  const c2 = classes[1]?.name || classes[0]?.name || 'X MIPA 2';
  const c3 = classes[2]?.name || classes[0]?.name || 'XI IPS 1';

  return [
    {
      'ID Siswa': 'SIS-2425-0001',
      'NIS': '20240101',
      'NISN': '0081234501',
      'Nama Lengkap': 'Muhammad Rizky Pratama',
      'Jenis Kelamin': 'L',
      'Tempat Lahir': 'Jakarta',
      'Tanggal Lahir': '2008-04-12',
      'Kelas': c1,
      'Jurusan': classes[0]?.major || 'MIPA',
      'No HP Siswa': '081234567891',
      'Nama Orang Tua': 'H. Ahmad Supriyadi',
      'No HP Orang Tua': '081398765431',
      'Alamat': 'Jl. Melati No. 15, RT 02/04',
      'Status': 'Aktif'
    },
    {
      'ID Siswa': 'SIS-2425-0002',
      'NIS': '20240102',
      'NISN': '0081234502',
      'Nama Lengkap': 'Aisyah Putri Azzahra',
      'Jenis Kelamin': 'P',
      'Tempat Lahir': 'Bandung',
      'Tanggal Lahir': '2008-07-25',
      'Kelas': c1,
      'Jurusan': classes[0]?.major || 'MIPA',
      'No HP Siswa': '081234567892',
      'Nama Orang Tua': 'Ir. Bambang Wijaya',
      'No HP Orang Tua': '081398765432',
      'Alamat': 'Jl. Anggrek No. 8, Blok C',
      'Status': 'Aktif'
    },
    {
      'ID Siswa': 'SIS-2425-0003',
      'NIS': '20240103',
      'NISN': '0081234503',
      'Nama Lengkap': 'Dimas Bagus Wicaksono',
      'Jenis Kelamin': 'L',
      'Tempat Lahir': 'Surabaya',
      'Tanggal Lahir': '2008-01-19',
      'Kelas': c2,
      'Jurusan': classes[1]?.major || 'MIPA',
      'No HP Siswa': '081234567893',
      'Nama Orang Tua': 'Heri Gunawan',
      'No HP Orang Tua': '081398765433',
      'Alamat': 'Jl. Dahlia No. 42',
      'Status': 'Aktif'
    },
    {
      'ID Siswa': 'SIS-2425-0004',
      'NIS': '20240104',
      'NISN': '0081234504',
      'Nama Lengkap': 'Nabila Zahra Syahrini',
      'Jenis Kelamin': 'P',
      'Tempat Lahir': 'Yogyakarta',
      'Tanggal Lahir': '2008-09-03',
      'Kelas': c2,
      'Jurusan': classes[1]?.major || 'MIPA',
      'No HP Siswa': '081234567894',
      'Nama Orang Tua': 'Hj. Maryam, S.Pd.',
      'No HP Orang Tua': '081398765434',
      'Alamat': 'Jl. Kenanga Timur No. 10',
      'Status': 'Aktif'
    },
    {
      'ID Siswa': 'SIS-2425-0005',
      'NIS': '20240105',
      'NISN': '0081234505',
      'Nama Lengkap': 'Fajar Nur Hidayat',
      'Jenis Kelamin': 'L',
      'Tempat Lahir': 'Semarang',
      'Tanggal Lahir': '2007-11-30',
      'Kelas': c3,
      'Jurusan': classes[2]?.major || 'IPS',
      'No HP Siswa': '081234567895',
      'Nama Orang Tua': 'Drs. Hendro Wibowo',
      'No HP Orang Tua': '081398765435',
      'Alamat': 'Jl. Cempaka Putih No. 7',
      'Status': 'Aktif'
    }
  ];
};

/**
 * Downloads official Excel (.xlsx) import template with multiple helpful sheets
 */
export const downloadStudentTemplateXLSX = (classes: SchoolClass[] = [], schoolName?: string) => {
  const data = generateStudentTemplateData(classes);
  const ws = XLSX.utils.json_to_sheet(data);

  // Set explicit column widths for easy reading
  ws['!cols'] = [
    { wch: 16 }, // ID Siswa
    { wch: 14 }, // NIS
    { wch: 14 }, // NISN
    { wch: 28 }, // Nama Lengkap
    { wch: 14 }, // Jenis Kelamin
    { wch: 16 }, // Tempat Lahir
    { wch: 14 }, // Tanggal Lahir
    { wch: 16 }, // Kelas
    { wch: 16 }, // Jurusan
    { wch: 16 }, // No HP Siswa
    { wch: 24 }, // Nama Orang Tua
    { wch: 16 }, // No HP Orang Tua
    { wch: 32 }, // Alamat
    { wch: 12 }  // Status
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');

  // Sheet 2: Petunjuk Pengisian
  const guideData = [
    { 'KOLOM': 'ID Siswa', 'STATUS': 'Opsional', 'CONTOH': 'SIS-2425-0001', 'PETUNJUK': 'Format ID unik SIM Kesiswaan. Jika kosong, sistem otomatis membuatkan.' },
    { 'KOLOM': 'NIS', 'STATUS': 'Wajib', 'CONTOH': '20240101', 'PETUNJUK': 'Nomor Induk Siswa lokal sekolah/madrasah. Wajib unik per siswa.' },
    { 'KOLOM': 'NISN', 'STATUS': 'Sangat Dianjurkan', 'CONTOH': '0081234567', 'PETUNJUK': 'Nomor Induk Siswa Nasional (10 digit). Kunci utama pencocokan data.' },
    { 'KOLOM': 'Nama Lengkap', 'STATUS': 'Wajib', 'CONTOH': 'Muhammad Rizky', 'PETUNJUK': 'Nama lengkap siswa sesuai akta lahir / ijazah.' },
    { 'KOLOM': 'Jenis Kelamin', 'STATUS': 'Wajib', 'CONTOH': 'L / P', 'PETUNJUK': 'L untuk Laki-laki, P untuk Perempuan.' },
    { 'KOLOM': 'Tempat Lahir', 'STATUS': 'Opsional', 'CONTOH': 'Jakarta', 'PETUNJUK': 'Kota/kabupaten tempat lahir siswa.' },
    { 'KOLOM': 'Tanggal Lahir', 'STATUS': 'Opsional', 'CONTOH': '2008-04-12', 'PETUNJUK': 'Format Tahun-Bulan-Hari (YYYY-MM-DD).' },
    { 'KOLOM': 'Kelas', 'STATUS': 'Wajib', 'CONTOH': 'X MIPA 1', 'PETUNJUK': 'Wajib sesuai dengan daftar rombel kelas sekolah.' },
    { 'KOLOM': 'Jurusan', 'STATUS': 'Opsional', 'CONTOH': 'MIPA', 'PETUNJUK': 'Peminatan/Jurusan (MIPA, IPS, Keagamaan, RPL, TKJ, dll).' },
    { 'KOLOM': 'No HP Siswa', 'STATUS': 'Opsional', 'CONTOH': '081234567890', 'PETUNJUK': 'Nomor WhatsApp aktif siswa.' },
    { 'KOLOM': 'Nama Orang Tua', 'STATUS': 'Opsional', 'CONTOH': 'H. Ahmad', 'PETUNJUK': 'Nama ayah/ibu/wali siswa.' },
    { 'KOLOM': 'No HP Orang Tua', 'STATUS': 'Opsional', 'CONTOH': '081398765430', 'PETUNJUK': 'Nomor WhatsApp wali untuk notifikasi presensi & poin.' },
    { 'KOLOM': 'Alamat', 'STATUS': 'Opsional', 'CONTOH': 'Jl. Melati No. 15', 'PETUNJUK': 'Alamat domisili tempat tinggal siswa saat ini.' },
    { 'KOLOM': 'Status', 'STATUS': 'Wajib', 'CONTOH': 'Aktif', 'PETUNJUK': 'Pilihan: "Aktif", "Alumni", "Pindah", atau "Keluar".' }
  ];
  const wsGuide = XLSX.utils.json_to_sheet(guideData);
  wsGuide['!cols'] = [
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 60 }
  ];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk Pengisian');

  // Sheet 3: Daftar Kelas Sekolah
  if (classes && classes.length > 0) {
    const classListData = classes.map((c, idx) => ({
      'No': idx + 1,
      'Nama Rombel Kelas': c.name,
      'Tingkat': c.grade,
      'Jurusan / Peminatan': c.major,
      'Wali Kelas': c.homeroomTeacher || 'Belum Ditentukan'
    }));
    const wsClasses = XLSX.utils.json_to_sheet(classListData);
    wsClasses['!cols'] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 12 },
      { wch: 24 },
      { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, wsClasses, 'Daftar Kelas Sekolah');
  }

  const prefix = schoolName ? schoolName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20) : 'SIM';
  XLSX.writeFile(wb, `Template_Import_Siswa_${prefix}.xlsx`);
};

/**
 * Downloads standard UTF-8 CSV import template with BOM header
 */
export const downloadStudentTemplateCSV = (classes: SchoolClass[] = []) => {
  const data = generateStudentTemplateData(classes);
  const ws = XLSX.utils.json_to_sheet(data);
  const csvContent = XLSX.utils.sheet_to_csv(ws);

  // Prepend UTF-8 BOM so Microsoft Excel & LibreOffice automatically parse Indonesian characters correctly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Template_Import_Data_Siswa.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Robust sanitization helpers for Indonesian school data
 */
export const cleanNisString = (val: any): string => {
  if (val === null || val === undefined) return '';
  // Remove leading/trailing quotes, apostrophes, spaces, tabs
  return String(val).replace(/^['"`\s]+|['"`\s]+$/g, '').trim();
};

export const cleanPhoneString = (val: any): string => {
  if (!val) return '';
  let str = String(val).replace(/[^0-9+]/g, '').trim();
  if (str.startsWith('+62')) {
    str = '0' + str.substring(3);
  } else if (str.startsWith('62') && str.length > 8) {
    str = '0' + str.substring(2);
  }
  return str;
};

export const parseIndonesianDateString = (val: any): string => {
  if (!val) return '2008-01-01';
  const str = String(val).trim();

  // Excel serial number check (e.g. 39500 to 45000)
  if (!isNaN(Number(str)) && Number(str) > 20000 && Number(str) < 60000) {
    try {
      const parsedDate = new Date((Number(str) - 25569) * 86400 * 1000);
      return parsedDate.toISOString().split('T')[0];
    } catch (e) {}
  }

  // Check DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Check YYYY-MM-DD standard
  const ymdMatch = str.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return str;
};

/**
 * Parse and validate uploaded Excel / CSV rows into structured student records
 * With internal duplicate detection and robust data sanitization
 */
export const parseStudentRows = (
  rawRows: any[], 
  existingClasses: SchoolClass[], 
  activeAcademicYear?: string,
  existingStudentsNisList: string[] = []
): ParsedImportStudent[] => {
  const seenNisMap = new Map<string, number>();
  const existingNisSet = new Set(existingStudentsNisList.map(n => cleanNisString(n)));

  return rawRows.map((item, index) => {
    const errors: string[] = [];
    const rowNum = index + 1;

    // 1. Resolve & Sanitize NIS
    const rawNis = item['NIS'] || item['nis'] || item['Nomor Induk'] || item['No Induk'] || item['nis_siswa'];
    const nis = cleanNisString(rawNis);
    if (!nis) {
      errors.push('NIS wajib diisi');
    } else {
      if (seenNisMap.has(nis)) {
        errors.push(`NIS duplikat dalam file (sama dengan baris ${seenNisMap.get(nis)})`);
      } else {
        seenNisMap.set(nis, rowNum);
      }
    }

    // 2. Resolve & Sanitize NISN
    const rawNisn = item['NISN'] || item['nisn'] || item['No NISN'] || item['nisn_siswa'];
    const nisn = cleanNisString(rawNisn);

    // 3. Resolve Full Name
    const rawName = item['Nama Lengkap'] || item['Nama Siswa'] || item['nama'] || item['fullName'] || item['Name'] || item['NAMA'];
    const fullName = rawName ? String(rawName).trim() : '';
    if (!fullName) {
      errors.push('Nama Lengkap siswa wajib diisi');
    }

    // 4. Resolve ID Siswa (Code)
    const rawCode = item['ID Siswa'] || item['id_siswa'] || item['code'] || item['Kode Siswa'];
    const code = rawCode ? String(rawCode).trim() : formatStudentCode(activeAcademicYear, index + 1);

    // 5. Resolve Gender
    const rawGender = String(item['Jenis Kelamin'] || item['JK'] || item['L/P'] || item['gender'] || item['Gender'] || 'L').toUpperCase().trim();
    const gender: 'L' | 'P' = (rawGender === 'P' || rawGender === 'PEREMPUAN' || rawGender === 'WANITA' || rawGender === 'FEMALE') ? 'P' : 'L';

    // 6. Resolve Class & Major
    const rawClassName = String(item['Kelas'] || item['kelas'] || item['className'] || item['Class'] || '').trim();
    const matchedClass = findMatchingClass(rawClassName, existingClasses);

    const className = matchedClass ? matchedClass.name : (rawClassName || existingClasses[0]?.name || 'X');
    const classId = matchedClass ? matchedClass.id : (existingClasses[0]?.id || 'c_default');
    
    const rawMajor = item['Jurusan'] || item['jurusan'] || item['major'] || item['Program Keahlian'];
    const major = rawMajor ? String(rawMajor).trim() : (matchedClass?.major || 'Umum');

    // 7. Resolve Birth Place & Date
    const birthPlace = String(item['Tempat Lahir'] || item['tempat_lahir'] || item['birthPlace'] || '-').trim();
    const rawBirthDate = item['Tanggal Lahir'] || item['tanggal_lahir'] || item['birthDate'] || '2008-01-01';
    const birthDate = parseIndonesianDateString(rawBirthDate);

    // 8. Resolve Contacts
    const rawPhone = item['No HP Siswa'] || item['No HP'] || item['No WA'] || item['phone'] || item['telepon'] || item['No Telepon'];
    const phone = cleanPhoneString(rawPhone);

    const rawParentName = item['Nama Orang Tua'] || item['Nama Wali'] || item['Orang Tua'] || item['parentName'] || item['Wali'] || item['Nama Ayah/Ibu'];
    const parentName = rawParentName ? String(rawParentName).trim() : '';

    const rawParentPhone = item['No HP Orang Tua'] || item['No WA Ortu'] || item['No HP Wali'] || item['parentPhone'] || item['Telepon Ortu'];
    const parentPhone = cleanPhoneString(rawParentPhone);

    const rawAddress = item['Alamat'] || item['alamat'] || item['address'] || item['Alamat Rumah'] || item['Domisili'];
    const address = rawAddress ? String(rawAddress).trim() : '';

    // 9. Resolve Status
    const rawStatus = String(item['Status'] || item['status'] || 'Aktif').trim();
    const validStatuses = ['Aktif', 'Alumni', 'Pindah', 'Keluar'];
    const status = validStatuses.includes(rawStatus) ? (rawStatus as 'Aktif' | 'Alumni' | 'Pindah' | 'Keluar') : 'Aktif';

    return {
      code,
      nis,
      nisn,
      fullName,
      gender,
      birthPlace,
      birthDate,
      classId,
      className,
      major,
      phone,
      parentName,
      parentPhone,
      address,
      status,
      violationPoints: 0,
      achievementPoints: 0,
      isValid: errors.length === 0,
      errors
    };
  });
};
