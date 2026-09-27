import React, { useMemo } from 'react';
import { SchoolSetting } from '../../types';

interface SchoolLetterheadProps {
  schoolInfo?: Partial<SchoolSetting> | null;
  documentTitle?: string;
  documentNumber?: string;
  className?: string;
  showDoubleLine?: boolean;
  compact?: boolean;
}

export const SchoolLetterhead: React.FC<SchoolLetterheadProps> = ({
  schoolInfo,
  documentTitle,
  documentNumber,
  className = '',
  showDoubleLine = true,
  compact = false
}) => {
  // Always safely fallback to MAN 2 SERAM BAGIAN TIMUR authentic data
  const defaultInfo: Partial<SchoolSetting> = {
    name: 'MAN 2 SERAM BAGIAN TIMUR',
    centralInstitution: 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
    regionalInstitution: 'KANTOR KEMENTERIAN AGAMA KABUPATEN SERAM BAGIAN TIMUR',
    address: 'Jl. Lintas Seram, Kec. Bula, Kab. Seram Bagian Timur, Maluku',
    postalCode: '97554',
    phone: '(0915) 21189',
    email: 'man2sbt@kemenag.go.id',
    website: 'https://man2serambagiantimur.sch.id',
    npsn: '60728491'
  };

  const info = {
    ...defaultInfo,
    ...schoolInfo
  };

  // Safe logo assignment: leftLogo for Kemenag, rightLogo for School/OSIM
  const leftLogo = (info.logoLeftUrl || '').trim();
  const rightLogo = (info.logoRightUrl || info.logoUrl || '').trim();

  // Baris 4 Kop Surat: Persis hanya teks alamat yang ditulis user di pengaturan, tanpa menyisipkan kolom kode pos, telp, email, atau website
  const addressLine = useMemo(() => {
    return (info.address || '').trim();
  }, [info.address]);

  return (
    <div className={`w-full font-serif text-slate-900 ${className}`}>
      {/* Header Container */}
      <div className={`flex items-center justify-between gap-3 sm:gap-4 ${compact ? 'pb-2 mb-1.5' : 'pb-3 mb-2'}`}>
        {/* Left Logo (Instansi Pembina / Kemenag RI) */}
        <div className="w-16 sm:w-20 shrink-0 flex items-center justify-center">
          {leftLogo ? (
            <img
              src={leftLogo}
              alt="Logo Instansi Kiri"
              className={`object-contain max-h-16 sm:max-h-20 max-w-full drop-shadow-xs ${compact ? 'max-h-12' : ''}`}
              referrerPolicy="no-referrer"
              onError={(e) => {
                // If it fails to load via web link, show placeholder instead of collapsing layout
                const target = e.currentTarget;
                target.style.opacity = '0.3';
              }}
            />
          ) : (
            <div className="w-14 h-14 rounded-xl border border-dashed border-slate-300 print:hidden flex items-center justify-center text-[9px] text-slate-400 text-center p-1 leading-tight bg-slate-50">
              Logo Kiri (Kemenag)
            </div>
          )}
        </div>

        {/* Center Text (Pedoman Susunan Kop Standar Resmi Kementerian Agama / Dinas) */}
        <div className="flex-1 text-center px-1">
          {/* Baris 1: Instansi Pusat */}
          {info.centralInstitution && (
            <h4 className={`font-bold tracking-wider uppercase text-slate-900 leading-tight ${compact ? 'text-[10px]' : 'text-xs sm:text-sm'}`}>
              {info.centralInstitution}
            </h4>
          )}
          {/* Baris 2: Instansi Wilayah / Kabupaten / Kantor Kemenag */}
          {info.regionalInstitution && (
            <h5 className={`font-bold uppercase text-slate-800 leading-tight mt-0.5 ${compact ? 'text-[9px]' : 'text-[11px] sm:text-xs'}`}>
              {info.regionalInstitution}
            </h5>
          )}
          {/* Baris 3: Nama Resmi Satuan Pendidikan / Madrasah */}
          <h2 className={`font-black uppercase tracking-wide text-slate-950 leading-tight my-1 ${compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-lg'}`}>
            {info.name || 'MAN 2 SERAM BAGIAN TIMUR'}
          </h2>
          {/* Baris 4: Kalimat Alamat / Kontak Resmi */}
          {addressLine && (
            <p className={`font-sans text-slate-700 leading-tight font-normal ${compact ? 'text-[9px]' : 'text-[10px] sm:text-[11px]'}`}>
              {addressLine}
            </p>
          )}
        </div>

        {/* Right Logo (Sekolah / Madrasah / OSIM) */}
        <div className="w-16 sm:w-20 shrink-0 flex items-center justify-center">
          {rightLogo ? (
            <img
              src={rightLogo}
              alt="Logo Sekolah Kanan"
              className={`object-contain max-h-16 sm:max-h-20 max-w-full drop-shadow-xs ${compact ? 'max-h-12' : ''}`}
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.opacity = '0.3';
              }}
            />
          ) : (
            <div className="w-14 h-14 rounded-xl border border-dashed border-slate-300 print:hidden flex items-center justify-center text-[9px] text-slate-400 text-center p-1 leading-tight bg-slate-50">
              Logo Kanan (Madrasah)
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
            <p className="text-[11px] sm:text-xs text-slate-600 font-sans mt-0.5">
              Nomor: {documentNumber}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
