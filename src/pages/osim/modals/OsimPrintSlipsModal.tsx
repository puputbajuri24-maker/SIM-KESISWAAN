import React from 'react';
import { Printer } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { OsimMember, UserProfile, SchoolSetting } from '../../../types';
import { getUserSlipCredentials } from '../../../utils/osimAccountHelper';

interface OsimPrintSlipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  printSlipTarget: 'all' | UserProfile;
  setPrintSlipTarget: (target: 'all' | UserProfile) => void;
  osimAccounts: UserProfile[];
  osimMembers: OsimMember[];
  schoolSetting: SchoolSetting | null;
  activeAcademicYear: string;
}

export const OsimPrintSlipsModal: React.FC<OsimPrintSlipsModalProps> = ({
  isOpen,
  onClose,
  printSlipTarget,
  setPrintSlipTarget,
  osimAccounts,
  osimMembers,
  schoolSetting,
  activeAcademicYear
}) => {
  const handleExecutePrintSlips = (targetAccs: UserProfile[]) => {
    const schoolName = schoolSetting?.name || 'MADRASAH ALIYAH NEGERI';
    const schoolAddress = schoolSetting?.address || 'Kementerian Agama Republik Indonesia';
    const schoolAcademic = activeAcademicYear || '2026/2027';

    const cardsHtml = targetAccs.map(acc => {
      const cred = getUserSlipCredentials(acc, osimMembers);
      const linkedMem = osimMembers.find(m =>
        m.id === acc.uid ||
        (m.loginUsername && cred.rawUsername && m.loginUsername.toLowerCase() === cred.rawUsername.toLowerCase()) ||
        (m.username && cred.rawUsername && m.username.toLowerCase() === cred.rawUsername.toLowerCase()) ||
        (m.studentNis && acc.nip && m.studentNis === acc.nip) ||
        (m.fullName.toLowerCase().trim() === acc.displayName.toLowerCase().replace(/\s*\(.*\)$/, '').trim())
      );
      const studentClass = linkedMem?.className || acc.studentClass || '-';
      const studentNis = linkedMem?.studentNis || cred.nipOrNis;
      const position = linkedMem?.position || acc.osimPosition || 'Pengurus OSIM';
      const department = linkedMem?.sekbid || acc.osimDepartmentName || (acc.osimRole === 'ketua' || acc.osimRole === 'wakil' || acc.osimRole === 'sekretaris' || acc.osimRole === 'bendahara' ? 'BPH (Badan Pengurus Harian)' : 'Seksi Bidang OSIM');

      return `
        <div class="osim-card">
          <div class="card-header">
            <div class="brand-left">
              <div class="osim-badge">OSIM</div>
              <div class="school-titles">
                <h3>${schoolName}</h3>
                <p class="sub-title">KARTU AKSES LOGIN RESMI PENGURUS OSIM</p>
                <p class="academic-year">Tahun Ajaran ${schoolAcademic}</p>
              </div>
            </div>
            <div class="role-pill">${(acc.osimRole || 'SEKBID').toUpperCase()}</div>
          </div>

          <div class="student-info-grid">
            <div class="info-item full">
              <span class="label">Nama Pengurus:</span>
              <span class="value-name">${cred.displayName}</span>
            </div>
            <div class="info-item">
              <span class="label">NIS / NISN:</span>
              <span class="value font-mono">${studentNis}</span>
            </div>
            <div class="info-item">
              <span class="label">Kelas:</span>
              <span class="value font-mono">${studentClass}</span>
            </div>
            <div class="info-item full">
              <span class="label">Jabatan Kabinet:</span>
              <span class="value-pos">${position}</span>
            </div>
            <div class="info-item full">
              <span class="label">Seksi Bidang:</span>
              <span class="value-dept">${department}</span>
            </div>
          </div>

          <div class="login-box">
            <div class="login-box-header">
              <span>PORTAL SIM KESISWAAN</span>
              <span>HAK AKSES RESMI</span>
            </div>
            <div class="credentials-row">
              <div class="cred-col">
                <span class="cred-label">USERNAME LOGIN</span>
                <span class="cred-val username">${cred.loginUsername}</span>
              </div>
              <div class="cred-col">
                <span class="cred-label">KATA SANDI (PASSWORD)</span>
                <span class="cred-val password">${cred.password}</span>
              </div>
            </div>
            <div class="login-notice">Wewenang: Program Kerja, Agenda & Buku Kas OSIM</div>
          </div>

          <div class="rules-section">
            <div class="rules-title">Ketentuan Keamanan:</div>
            <ol>
              <li>Rahasiakan username dan kata sandi dari pihak lain.</li>
              <li>Perubahan kata sandi hanya dapat dilakukan oleh Pembina OSIM / Admin.</li>
              <li>Segera lapor Pembina jika terjadi kendala login atau akses akun.</li>
            </ol>
          </div>

          <div class="signature-section">
            <div class="sig-col">
              <div class="sig-title">Mengetahui,</div>
              <div class="sig-role">Waka Kesiswaan</div>
              <div class="sig-name" style="margin-top: 38px; font-weight: bold; text-decoration: underline;">${schoolSetting?.wakaKesiswaanName || schoolSetting?.wakaName || '...........................................'}</div>
              <div class="sig-nip">${schoolSetting?.wakaNip ? 'NIP. ' + schoolSetting.wakaNip : 'NIP. ............................'}</div>
            </div>
            <div class="sig-stamp">
              <div class="stamp-circle">CAP RESMI<br/>MADRASAH</div>
            </div>
            <div class="sig-col">
              <div class="sig-title">${(schoolSetting as any)?.city || (schoolSetting?.address ? schoolSetting.address.split(',')[0] : 'Madrasah')}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div class="sig-role">Pembina OSIM</div>
              <div class="sig-name" style="margin-top: 38px; font-weight: bold; text-decoration: underline;">${schoolSetting?.pembinaOsim || '...........................................'}</div>
              <div class="sig-nip">${schoolSetting?.pembinaOsimNip ? 'NIP. ' + schoolSetting.pembinaOsimNip : 'NIP. ............................'}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Kartu Akses Login Pengurus OSIM - ${schoolName}</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 8mm 8mm;
              }
              * { box-sizing: border-box; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 0;
                background: #ffffff;
                color: #111827;
              }
              .cards-sheet {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 6mm;
                padding: 4mm;
              }
              .osim-card {
                border: 2px solid #b45309;
                border-radius: 8px;
                padding: 10px 12px;
                background: #ffffff;
                page-break-inside: avoid;
                position: relative;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
              }
              .card-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 2px solid #d97706;
                padding-bottom: 6px;
                margin-bottom: 8px;
              }
              .brand-left {
                display: flex;
                align-items: center;
                gap: 8px;
              }
              .osim-badge {
                width: 28px;
                height: 28px;
                background: #b45309;
                color: #ffffff;
                font-weight: 900;
                font-size: 11px;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                letter-spacing: 0.5px;
              }
              .school-titles h3 {
                margin: 0;
                font-size: 11px;
                font-weight: 800;
                text-transform: uppercase;
                color: #92400e;
                line-height: 1.2;
              }
              .sub-title {
                margin: 1px 0 0 0;
                font-size: 8.5px;
                font-weight: 700;
                letter-spacing: 0.4px;
                color: #374151;
              }
              .academic-year {
                margin: 0;
                font-size: 8px;
                color: #6b7280;
              }
              .role-pill {
                padding: 3px 6px;
                background: #fef3c7;
                border: 1px solid #f59e0b;
                color: #92400e;
                font-size: 8.5px;
                font-weight: 800;
                border-radius: 4px;
                letter-spacing: 0.3px;
              }
              .student-info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 4px 8px;
                font-size: 10px;
                margin-bottom: 8px;
              }
              .info-item {
                display: flex;
                flex-direction: column;
              }
              .info-item.full {
                grid-column: span 2;
              }
              .label {
                font-size: 8px;
                text-transform: uppercase;
                color: #6b7280;
                font-weight: 600;
              }
              .value-name {
                font-size: 11px;
                font-weight: 800;
                color: #111827;
              }
              .value-pos {
                font-size: 10px;
                font-weight: 700;
                color: #b45309;
              }
              .value-dept {
                font-size: 9.5px;
                color: #374151;
              }
              .value {
                font-size: 10px;
                color: #111827;
                font-weight: 600;
              }
              .font-mono {
                font-family: ui-monospace, monospace;
              }
              .login-box {
                background: #fffbeb;
                border: 1.5px solid #fcd34d;
                border-radius: 6px;
                padding: 6px 8px;
                margin-bottom: 8px;
              }
              .login-box-header {
                display: flex;
                justify-content: space-between;
                font-size: 7.5px;
                font-weight: 800;
                color: #b45309;
                letter-spacing: 0.5px;
                border-bottom: 1px solid #fef3c7;
                padding-bottom: 2px;
                margin-bottom: 4px;
              }
              .credentials-row {
                display: flex;
                justify-content: space-between;
                gap: 8px;
              }
              .cred-col {
                flex: 1;
              }
              .cred-label {
                display: block;
                font-size: 7.5px;
                color: #78350f;
                font-weight: 700;
              }
              .cred-val {
                font-family: ui-monospace, monospace;
                font-size: 12px;
                font-weight: 800;
                display: inline-block;
                padding: 1px 4px;
                border-radius: 3px;
              }
              .cred-val.username {
                color: #1e3a8a;
                background: #eff6ff;
                border: 1px solid #bfdbfe;
              }
              .cred-val.password {
                color: #991b1b;
                background: #fef2f2;
                border: 1px solid #fecaca;
              }
              .login-notice {
                font-size: 8px;
                color: #92400e;
                margin-top: 3px;
                font-style: italic;
              }
              .rules-section {
                font-size: 8px;
                color: #4b5563;
                margin-bottom: 8px;
                line-height: 1.3;
              }
              .rules-title {
                font-weight: 700;
                color: #374151;
              }
              .rules-section ol {
                margin: 1px 0 0 0;
                padding-left: 14px;
              }
              .signature-section {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                font-size: 8px;
                border-top: 1px dashed #d1d5db;
                padding-top: 6px;
                margin-top: auto;
              }
              .sig-col {
                text-align: center;
                width: 38%;
              }
              .sig-title {
                font-size: 7.5px;
                color: #6b7280;
              }
              .sig-role {
                font-weight: 700;
                color: #111827;
                margin-bottom: 24px;
              }
              .sig-line {
                border-bottom: 1px solid #111827;
                margin-bottom: 1px;
              }
              .sig-nip {
                font-size: 7px;
                color: #6b7280;
              }
              .sig-stamp {
                text-align: center;
                width: 24%;
              }
              .stamp-circle {
                border: 1.5px dashed #9ca3af;
                border-radius: 50%;
                width: 36px;
                height: 36px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 6px;
                color: #9ca3af;
                font-weight: 700;
                text-align: center;
                line-height: 1.1;
              }
            </style>
          </head>
          <body>
            <div class="cards-sheet">
              ${cardsHtml}
            </div>
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      window.print();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cetak Kartu Akses Login Pengurus OSIM"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Header Kontrol Cetak */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-lg gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-zinc-100">Format Resmi Madrasah:</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                A4 Landscape (2 Kolom)
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Kartu berisi NIS, Kelas, Jabatan Kabinet, Username, Password default, dan lembar legalitas madrasah.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const targets = printSlipTarget === 'all' ? osimAccounts : [printSlipTarget];
                handleExecutePrintSlips(targets);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition shadow-sm"
              title="Buka lembar cetak dokumen bersih dan siap diprint ke PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Dokumen Resmi (PDF)</span>
            </button>
          </div>
        </div>

        {/* Selector Target Pengurus */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-zinc-950/60 p-2.5 rounded border border-zinc-800/80">
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-300 font-medium">Pilih Sasaran Cetak:</label>
            <select
              value={printSlipTarget === 'all' ? 'all' : printSlipTarget.uid}
              onChange={e => {
                if (e.target.value === 'all') {
                  setPrintSlipTarget('all');
                } else {
                  const acc = osimAccounts.find(u => u.uid === e.target.value);
                  if (acc) setPrintSlipTarget(acc);
                }
              }}
              className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Cetak Semua Pengurus ({osimAccounts.length} Siswa)</option>
              {osimAccounts.map(acc => (
                <option key={acc.uid} value={acc.uid}>
                  {acc.displayName} (@{acc.username}) - {acc.osimPosition || 'Pengurus'}
                </option>
              ))}
            </select>
          </div>

          <span className="text-[11px] text-amber-400 font-mono">
            Total: {printSlipTarget === 'all' ? osimAccounts.length : 1} Kartu Siap Dicetak
          </span>
        </div>

        {/* Pratinjau Lembar Kartu (Printable Canvas) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-1 bg-zinc-950/40 rounded-lg border border-zinc-800/60">
          {(printSlipTarget === 'all' ? osimAccounts : [printSlipTarget]).map(acc => {
            const cred = getUserSlipCredentials(acc, osimMembers);
            const linkedMem = osimMembers.find(m =>
              m.id === acc.uid ||
              (m.loginUsername && cred.rawUsername && m.loginUsername.toLowerCase() === cred.rawUsername.toLowerCase()) ||
              (m.username && cred.rawUsername && m.username.toLowerCase() === cred.rawUsername.toLowerCase()) ||
              (m.studentNis && acc.nip && m.studentNis === acc.nip) ||
              (m.fullName.toLowerCase().trim() === acc.displayName.toLowerCase().replace(/\s*\(.*\)$/, '').trim())
            );
            const studentClass = linkedMem?.className || acc.studentClass || '-';
            const studentNis = linkedMem?.studentNis || cred.nipOrNis;
            const position = linkedMem?.position || acc.osimPosition || 'Pengurus OSIM';
            const department = linkedMem?.sekbid || acc.osimDepartmentName || (acc.osimRole === 'ketua' || acc.osimRole === 'wakil' || acc.osimRole === 'sekretaris' || acc.osimRole === 'bendahara' ? 'BPH (Badan Pengurus Harian)' : 'Seksi Bidang OSIM');

            return (
              <div key={acc.uid} className="bg-white text-zinc-900 border-2 border-amber-600 rounded-lg p-3.5 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-amber-600 text-white font-extrabold flex items-center justify-center text-[10px] shadow-xs">
                      OS
                    </div>
                    <div>
                      <h4 className="font-bold text-xs leading-none text-zinc-900">{schoolSetting?.name || 'MADRASAH ALIYAH'}</h4>
                      <p className="text-[8px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">KARTU AKSES LOGIN RESMI PENGURUS OSIM</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                    {acc.osimRole || 'SEKBID'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="col-span-2">
                    <span className="text-zinc-500 text-[10px] block">Nama Lengkap Siswa:</span>
                    <span className="font-bold text-zinc-950 text-xs">{cred.displayName}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block">NIS / NISN:</span>
                    <span className="font-semibold text-zinc-900 font-mono">{studentNis}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Kelas Siswa:</span>
                    <span className="font-semibold text-zinc-900 font-mono">{studentClass}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Jabatan Kabinet:</span>
                    <span className="font-semibold text-zinc-900">{position}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Seksi Bidang:</span>
                    <span className="font-semibold text-zinc-900 truncate block">{department}</span>
                  </div>

                  <div className="col-span-2 bg-amber-50/90 border border-amber-300 rounded p-2.5 mt-1">
                    <div className="flex items-center justify-between text-[9px] font-bold text-amber-950 uppercase border-b border-amber-200/80 pb-1 mb-1.5">
                      <span>PORTAL SIM KESISWAAN</span>
                      <span>HAK AKSES RESMI</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 font-mono">
                      <div>
                        <span className="text-zinc-600 text-[9px] block uppercase font-sans">Username Login:</span>
                        <span className="font-bold text-zinc-950 text-xs">{cred.loginUsername}</span>
                      </div>
                      <div>
                        <span className="text-zinc-600 text-[9px] block uppercase font-sans">Kata Sandi (Password):</span>
                        <span className="font-bold text-amber-900 text-xs">{cred.password}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-dashed border-zinc-300 flex items-center justify-between text-[9px] text-zinc-500">
                  <span>Simpan kerahasiaan akun. Perubahan kata sandi hanya melalui Pembina OSIM.</span>
                  <span className="font-mono font-semibold">{activeAcademicYear}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <span className="text-[11px] text-zinc-400">
            Tips: Gunakan tombol <strong>Cetak Dokumen Resmi (PDF)</strong> untuk membuka halaman cetak bersih tanpa elemen antarmuka website.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};
