import React from 'react';
import { SchoolSetting } from '../../types';

interface SchoolLetterheadProps {
  schoolInfo?: SchoolSetting;
  documentTitle?: string;
  documentNumber?: string;
  className?: string;
  compact?: boolean;
  showDoubleLine?: boolean;
  theme?: 'print' | 'preview';
}

export const SchoolLetterhead: React.FC<SchoolLetterheadProps> = ({
  schoolInfo,
  documentTitle,
  documentNumber,
  className = '',
  compact = false,
  showDoubleLine = true
}) => {
  const info: Partial<SchoolSetting> = schoolInfo || {
    name: 'MAN 2 SERAM BAGIAN TIMUR',
    centralInstitution: 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
    regionalInstitution: 'KANTOR KEMENTERIAN AGAMA KABUPATEN SERAM BAGIAN TIMUR',
    npsn: '60728491',
    address: 'Jl. Lintas Seram, Kec. Bula, Kab. Seram Bagian Timur, Maluku',
    postalCode: '97554',
    phone: '(0915) 21189',
    email: 'man2sbt@kemenag.go.id',
    website: 'https://man2serambagiantimur.sch.id',
    logoLeftUrl: '',
    logoRightUrl: ''
  };

  const leftLogo = info.logoLeftUrl;
  const rightLogo = info.logoRightUrl || info.logoUrl;

  return (
    <div className={`w-full font-serif text-slate-900 ${className}`}>
      {/* Header Container */}
      <div className={`flex items-center justify-between gap-3 sm:gap-4 ${compact ? 'pb-2 mb-1.5' : 'pb-3 mb-2'}`}>
        {/* Left Logo (Instansi Pusat / Wilayah / Pembina) */}
        <div className="w-16 sm:w-20 shrink-0 flex items-center justify-center">
          {leftLogo ? (
            <img
              src={leftLogo}
              alt="Logo Instansi Kiri"
              className={`object-contain max-h-16 sm:max-h-20 max-w-full ${compact ? 'max-h-12' : ''}`}
              referrerPolicy="no-referrer"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-14 h-14 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400 text-center p-1 leading-tight">
              Logo Instansi Kiri
            </div>
          )}
        </div>

        {/* Center Text (Pedoman Susunan Kop Standar Resmi: Baris 1 sampai 4) */}
        <div className="flex-1 text-center px-1">
          {/* Baris 1: Instansi Pusat */}
          {info.centralInstitution && (
            <h4 className={`font-bold tracking-wider uppercase text-slate-900 leading-tight ${compact ? 'text-[10px]' : 'text-xs sm:text-sm'}`}>
              {info.centralInstitution}
            </h4>
          )}
          {/* Baris 2: Instansi Wilayah / Kabupaten / Dinas Pendidikan */}
          {info.regionalInstitution && (
            <h5 className={`font-bold uppercase text-slate-800 leading-tight mt-0.5 ${compact ? 'text-[9px]' : 'text-[11px] sm:text-xs'}`}>
              {info.regionalInstitution}
            </h5>
          )}
          {/* Baris 3: Nama Resmi Satuan Pendidikan / Sekolah / Madrasah */}
          <h2 className={`font-black uppercase tracking-wide text-slate-950 leading-tight my-1 ${compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-lg'}`}>
            {info.name || 'NAMA SEKOLAH / MADRASAH'}
          </h2>
          {/* Baris 4: Kalimat Alamat / Kontak Resmi Persis Sesuai yang Ditulis User */}
          {info.address && (
            <p className={`font-sans text-slate-700 leading-tight ${compact ? 'text-[9px]' : 'text-[10px] sm:text-[11px]'}`}>
              {info.address}
            </p>
          )}
        </div>

        {/* Right Logo (Sekolah / Madrasah / OSIM) */}
        <div className="w-16 sm:w-20 shrink-0 flex items-center justify-center">
          {rightLogo ? (
            <img
              src={rightLogo}
              alt="Logo Sekolah Kanan"
              className={`object-contain max-h-16 sm:max-h-20 max-w-full ${compact ? 'max-h-12' : ''}`}
              referrerPolicy="no-referrer"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-14 h-14 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400 text-center p-1 leading-tight">
              Logo Sekolah Kanan
            </div>
          )}
        </div>
      </div>

      {/* Double Border Line Kop Surat Resmi (Garis Ganda Tebal-Tipis Standar Tata Naskah Dinas) */}
      {showDoubleLine && (
        <div className="mb-4">
          <div className="border-b-[3px] border-slate-950 w-full mb-[2px]"></div>
          <div className="border-b-[1px] border-slate-950 w-full"></div>
        </div>
      )}

      {/* Optional Document Header Title */}
      {documentTitle && (
        <div className="text-center my-3">
          <h3 className="font-bold text-xs sm:text-sm uppercase underline tracking-wider text-slate-900 font-sans">
            {documentTitle}
          </h3>
          {documentNumber && (
            <p className="text-[10px] sm:text-xs font-sans text-slate-600 mt-0.5 font-medium">
              Nomor: {documentNumber}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
