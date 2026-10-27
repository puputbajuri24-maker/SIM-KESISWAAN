import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock, RefreshCw, LogOut, ShieldAlert } from 'lucide-react';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  remainingSeconds: number;
  onExtend: () => void;
  onLogout: () => void;
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
  isOpen,
  remainingSeconds,
  onExtend,
  onLogout
}) => {
  useEffect(() => {
    if (!isOpen) return;

    // Menangani tombol Enter untuk perpanjang sesi otomatis
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onExtend();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onExtend]);

  if (!isOpen || typeof document === 'undefined') return null;

  // Persentase sisa waktu dari 60 detik
  const progressPercent = Math.min(100, Math.max(0, (remainingSeconds / 60) * 100));
  const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : `${remainingSeconds}`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#18181d] border-2 border-amber-500/60 dark:border-amber-500/40 rounded-2xl shadow-2xl p-6 text-zinc-900 dark:text-zinc-100 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header dengan Ikon Animasi Jam */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                Peringatan Sesi
              </span>
              <span className="text-zinc-400 text-xs">• Idle Timeout</span>
            </div>
            <h3 id="session-timeout-title" className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white leading-tight">
              Sesi Anda Akan Segera Berakhir
            </h3>
          </div>
        </div>

        {/* Kotak Hitung Mundur */}
        <div className="bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 text-center space-y-2">
          <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block">
            Sistem akan otomatis keluar dalam:
          </span>
          <div className="flex items-center justify-center gap-2">
            <div className="font-mono text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400 tracking-wider">
              00:{formattedSeconds}
            </div>
            <span className="text-xs font-bold text-amber-700/80 dark:text-amber-300/80 self-end pb-1 font-mono">
              detik
            </span>
          </div>

          {/* Baris Progress Animasi */}
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${
                remainingSeconds <= 15 ? 'bg-red-500' : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Informasi Jaminan Keamanan Data */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
          <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p>
            Tidak ada aktivitas selama 29 menit. Klik <strong>Perpanjang Sesi</strong> agar seluruh data atau draf yang sedang Anda input <strong>tidak hilang</strong> dan pekerjaan dapat dilanjutkan normal.
          </p>
        </div>

        {/* Tombol Aksi */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center gap-1.5 transition active:scale-[0.98]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Sekarang</span>
          </button>

          <button
            type="button"
            onClick={onExtend}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Perpanjang Sesi</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
