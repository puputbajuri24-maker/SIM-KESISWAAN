import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Users,
  Trophy,
  HeartHandshake,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  X,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSchool } from '../contexts/SchoolContext';
import man2SbtBuildingImg from '../assets/images/man2_sbt_building_1787643586750.jpg';

// Official Kemenag / Madrasah Seal Emblem SVG
const MadrasahEmblem: React.FC<{ className?: string; size?: number; customUrl?: string }> = ({
  className = '',
  size = 52,
  customUrl
}) => {
  if (customUrl) {
    return (
      <img
        src={customUrl}
        alt="Logo Madrasah"
        style={{ width: size, height: size }}
        className={`object-contain shrink-0 drop-shadow-sm ${className}`}
        referrerPolicy="no-referrer"
        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-sm ${className}`}
    >
      {/* Outer Pentagon with Golden Border */}
      <polygon
        points="50,4 96,37 79,92 21,92 4,37"
        fill="#0c4a2a"
        stroke="#eab308"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Inner Gold Pentagon Line */}
      <polygon
        points="50,9 91,39 75,87 25,87 9,39"
        fill="#0f5933"
        stroke="#facc15"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Top Star */}
      <path
        d="M50,14 L52,19 L57,19 L53,22 L54.5,27 L50,24 L45.5,27 L47,22 L43,19 L48,19 Z"
        fill="#facc15"
      />
      {/* Golden Circular Ring */}
      <circle cx="50" cy="52" r="23" fill="#08381f" stroke="#eab308" strokeWidth="2" />
      {/* Open Book / Al-Qur'an */}
      <path
        d="M50,57 C44,52 36,53 32,56 L32,44 C36,41 44,40 50,45 C56,40 64,41 68,44 L68,56 C64,53 56,52 50,57 Z"
        fill="#ffffff"
        stroke="#ca8a04"
        strokeWidth="1"
      />
      {/* Spine & Ribbon */}
      <path d="M50,45 L50,59" stroke="#ca8a04" strokeWidth="1.5" />
      {/* Pen / Quill in Center */}
      <path d="M50,33 L52,43 L48,43 Z" fill="#facc15" />
      {/* Rice & Cotton Wreath Accents */}
      <path
        d="M33,65 C35,70 41,73 50,73 C59,73 65,70 67,65"
        stroke="#facc15"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};

// Stylized SIM-Kesiswaan Emblem (Golden Sun + Open Mint Book)
const SimKesiswaanLogo: React.FC<{ className?: string; logoSchool?: string }> = ({
  className = '',
  logoSchool
}) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {logoSchool ? (
        <div className="flex items-center justify-center mb-2">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md p-2 border border-white/20 flex items-center justify-center shadow-lg">
            <img src={logoSchool} alt="Logo Sekolah" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
          </div>
        </div>
      ) : (
        <div className="relative flex items-center justify-center">
          {/* Student Head / Sun of Knowledge in Gold */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 shadow-lg shadow-amber-500/30 flex items-center justify-center mb-1 ring-4 ring-emerald-950/50">
            <div className="w-7 h-7 rounded-full bg-amber-400/90 flex items-center justify-center" />
          </div>
        </div>
      )}
      {/* Stylized Modern Open Book / Spreading Wings */}
      <svg
        width="90"
        height="46"
        viewBox="0 0 90 46"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="-mt-1 text-emerald-400 drop-shadow-md"
      >
        <path
          d="M45 42C33 34 16 35 4 41V9C17 3 33 2 45 10C57 2 73 3 86 9V41C74 35 57 34 45 42Z"
          fill="#34d399"
          fillOpacity="0.25"
          stroke="#6ee7b7"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M45 10V42"
          stroke="#6ee7b7"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Side page stripes */}
        <path d="M14 16C23 12 34 12 41 17" stroke="#a7f3d0" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M76 16C67 12 56 12 49 17" stroke="#a7f3d0" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M14 26C23 22 34 22 41 27" stroke="#a7f3d0" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M76 26C67 22 56 22 49 27" stroke="#a7f3d0" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
};

// Google Colorful G SVG
const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export const LoginPage: React.FC = () => {
  const { loginWithIdentifier, isLoading } = useAuth();
  const { schoolSetting, activeAcademicYear, activeSemester, setActiveAcademicYear } = useSchool();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg('Silakan masukkan Username, NIS, atau NIP Anda.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Silakan masukkan password akun Anda.');
      return;
    }

    setErrorMsg(null);
    setActiveAcademicYear(activeAcademicYear || '2026/2027', activeSemester || 'Ganjil');

    const res = await loginWithIdentifier(identifier, password);
    if (!res.success) {
      setErrorMsg(res.error || 'Username/NIS/NIP atau Password yang Anda masukkan tidak cocok.');
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMsg(null);
    setTimeout(() => {
      setIsGoogleLoading(false);
      setErrorMsg('Fitur Google SSO memerlukan akun Google Workspace madrasah terverifikasi. Silakan login manual dengan Username / NIP / NIS Anda.');
    }, 900);
  };

  const currentSchoolName = schoolSetting?.name || 'MAN 2 SERAM BAGIAN TIMUR';
  const schoolLogo = schoolSetting?.logoRightUrl || schoolSetting?.logoUrl || schoolSetting?.logoLeftUrl;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-between font-sans selection:bg-emerald-600 selection:text-white">
      {/* Background Container with Islamic Green Aesthetic */}
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 flex items-center justify-center">
        <div className="w-full bg-[#082a1b] text-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px] border border-emerald-900/50">
          
          {/* LEFT HERO PANEL (Branding, Information & Madrasah Building) */}
          <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden bg-gradient-to-br from-[#062417] via-[#093522] to-[#0c442c]">
            {/* Soft decorative background circles & light beams */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            <div className="absolute bottom-1/3 left-0 w-72 h-72 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

            {/* Top Left Institution Badge */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm">
                <MadrasahEmblem size={34} customUrl={schoolLogo} />
                <div>
                  <h3 className="text-xs font-black tracking-wide text-white uppercase">MAN 2 SERAM BAGIAN TIMUR</h3>
                  <p className="text-[10px] text-emerald-200/90 font-medium leading-tight">
                    Madrasah Aliyah Negeri 2<br />
                    Seram Bagian Timur, Maluku
                  </p>
                </div>
              </div>
            </div>

            {/* Center Hero Information */}
            <div className="relative z-10 my-8 sm:my-10 text-center flex flex-col items-center">
              {/* Logo SIM-Kesiswaan (Hanya Logo Sekolah) */}
              <SimKesiswaanLogo className="mb-4" logoSchool={schoolLogo} />

              {/* Title & Subtitle */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-wider drop-shadow-sm uppercase">
                SIM-KESISWAAN
              </h1>
              <p className="text-[11px] sm:text-xs font-bold text-emerald-300 uppercase tracking-widest mt-1.5 mb-4">
                SISTEM INFORMASI MANAJEMEN KESISWAAN
              </p>

              {/* Description Quote */}
              <p className="text-xs sm:text-sm text-emerald-100/90 max-w-md mx-auto leading-relaxed font-medium">
                Satu sistem terintegrasi untuk mendukung seluruh kegiatan kesiswaan madrasah secara efektif, efisien dan terstruktur.
              </p>

              {/* 3 Translucent Feature Cards */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-7 w-full max-w-md">
                <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 sm:p-4 text-center transition-all shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center mx-auto mb-2 text-amber-300">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-white block">Kegiatan Intra</span>
                </div>

                <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 sm:p-4 text-center transition-all shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center mx-auto mb-2 text-amber-300">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-white block">Kegiatan Ekstra</span>
                </div>

                <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 sm:p-4 text-center transition-all shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center mx-auto mb-2 text-amber-300">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-white block">Konseling</span>
                </div>
              </div>
            </div>

            {/* Bottom Madrasah Building Photo Banner */}
            <div className="relative z-10 mt-4 rounded-2xl overflow-hidden border border-white/20 shadow-lg group">
              <div className="h-32 sm:h-40 w-full overflow-hidden relative bg-emerald-950">
                <img
                  src={man2SbtBuildingImg}
                  alt="Gedung MAN 2 Seram Bagian Timur"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#062417]/90 via-transparent to-transparent flex items-end p-3">
                  <span className="text-[11px] font-semibold text-white/90 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    Kampus Terpadu MAN 2 SERAM BAGIAN TIMUR
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT PANEL (Clean White Login Card) */}
          <div className="lg:col-span-5 bg-white text-slate-800 p-6 sm:p-10 flex flex-col justify-center relative">
            <div className="w-full max-w-sm mx-auto">
              
              {/* Header inside Form Card with School Logo */}
              <div className="text-center mb-6">
                <div className="flex justify-center items-center mb-3">
                  <MadrasahEmblem size={64} customUrl={schoolLogo} />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {currentSchoolName}
                </h2>
                <p className="text-xs text-emerald-800 font-bold mt-0.5">
                  Kabupaten Seram Bagian Timur
                </p>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-4">
                  Selamat Datang Kembali!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Silakan masuk untuk melanjutkan ke akun Anda.
                </p>

                {/* Centered Diamond Ornament Divider */}
                <div className="flex items-center justify-center gap-2 my-3">
                  <div className="h-px w-10 bg-slate-200" />
                  <div className="w-2 h-2 rotate-45 bg-[#0a4829]" />
                  <div className="h-px w-10 bg-slate-200" />
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form Fields: Username/NIS/NIP & Password Manual Entry */}
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                {/* Username / NIS / NIP */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Username / NIS / NIP
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      autoComplete="username"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder="Masukkan username, NIS atau NIP"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0a4829] focus:ring-2 focus:ring-[#0a4829]/20 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Masukkan password"
                      className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0a4829] focus:ring-2 focus:ring-[#0a4829]/20 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                      title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Lupa Password Link */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(true)}
                    className="text-xs font-bold text-[#0a4829] hover:underline transition-colors"
                  >
                    Lupa Password?
                  </button>
                </div>

                {/* Submit Button (Masuk) */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-[#082a1b] hover:bg-[#062015] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-[#082a1b]/30 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isLoading ? 'Memverifikasi...' : 'Masuk'}</span>
                </button>
              </form>

              {/* Divider 'atau' */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase">
                  <span className="bg-white px-3 text-slate-400 font-medium">atau</span>
                </div>
              </div>

              {/* Masuk dengan Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-2xs hover:border-slate-300 disabled:opacity-60"
              >
                <GoogleIcon className="w-4 h-4" />
                <span>{isGoogleLoading ? 'Menghubungkan...' : 'Masuk dengan Google'}</span>
              </button>

              {/* Trust & Security Badge at Bottom */}
              <div className="mt-5 p-3 rounded-xl bg-emerald-50/80 border border-emerald-100 flex items-center gap-3 text-left">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Akses aman dan terpercaya</h4>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Data siswa terjaga kerahasiaan dan keamanannya.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Page Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white/60">
        <p className="font-semibold text-slate-700">© 2025 SIM-KESISWAAN MAN 2 SERAM BAGIAN TIMUR</p>
        <p className="text-[11px] text-slate-400">All rights reserved.</p>
      </footer>

      {/* Lupa Password Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-[#0a4829]">
                <HelpCircle className="w-5 h-5" />
                <h3 className="text-sm font-bold text-slate-900">Bantuan Lupa Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <p>
                Untuk alasan keamanan data kesiswaan madrasah, reset password akun dilakukan secara terpusat oleh Administrator / Proktor SIM Kesiswaan MAN 2 Seram Bagian Timur.
              </p>
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Langkah Pemulihan Akun:</span>
                </div>
                <ul className="list-disc list-inside text-emerald-900 text-[11px] space-y-1 pl-1">
                  <li>Hubungi <strong>Waka Kesiswaan</strong> atau <strong>Proktor Madrasah</strong>.</li>
                  <li>Sebutkan <strong>Nama Lengkap</strong> dan <strong>NIP / NIS</strong> terdaftar Anda.</li>
                  <li>Admin akan mereset kata sandi akun Anda ke default (<code>password</code>).</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsForgotOpen(false)}
                className="px-4 py-2 bg-[#082a1b] hover:bg-[#062015] text-white font-bold text-xs rounded-xl transition"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
