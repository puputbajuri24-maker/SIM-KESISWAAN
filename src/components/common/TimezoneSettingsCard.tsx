import React, { useState } from 'react';
import {
  Clock,
  Globe,
  Smartphone,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Info,
  Calendar,
  Zap
} from 'lucide-react';
import { useAppTimezone, INDONESIAN_TIMEZONES } from '../../contexts/TimezoneContext';
import { useToast } from '../../contexts/ToastContext';

export const TimezoneSettingsCard: React.FC = () => {
  const {
    timezoneMode,
    resolvedTimezone,
    deviceTimezone,
    timezoneAbbr,
    utcOffsetString,
    currentTime,
    formattedTime,
    formattedDate,
    formattedDateTime,
    setTimezone,
    resetToAuto
  } = useAppTimezone();

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customIana, setCustomIana] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Live time for preview
  const getLiveTimeForTz = (tz: string) => {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(currentTime);
    } catch {
      return '--:--:--';
    }
  };

  const handleSelect = (ianaTz: string) => {
    setTimezone(ianaTz, 'manual');
    setFeedbackMsg(`Zona waktu berhasil diubah ke: ${ianaTz}`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleResetAuto = () => {
    resetToAuto();
    setFeedbackMsg(`Zona waktu dikembalikan ke Deteksi Otomatis (${deviceTimezone})`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const { toast } = useToast();

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customIana.trim()) {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: customIana.trim() }).format(new Date());
        setTimezone(customIana.trim(), 'manual');
        setShowCustomInput(false);
        setCustomIana('');
        toast.success(`Zona waktu kustom aktif: ${customIana.trim()}`);
      } catch (err) {
        toast.error(`Zona waktu "${customIana}" tidak valid.`);
      }
    }
  };

  return (
    <div className="bg-[#141417] border border-[#27272a] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#242428] relative z-10">
        <div className="flex items-start space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                TIMEZONE CONFIGURATION
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                {timezoneAbbr} ({utcOffsetString})
              </span>
            </div>
            <h3 className="text-base font-bold text-zinc-100 mt-1">
              Pengaturan Zona Waktu & Jam Aplikasi
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed max-w-xl">
              Aplikasi mendeteksi zona waktu secara otomatis dari perangkat yang Anda gunakan, atau Anda dapat menentukan zona waktu standar wilayah madrasah (WIB / WITA / WIT).
            </p>
          </div>
        </div>

        {/* Live Clock Display */}
        <div className="p-3 bg-[#191920] border border-[#2e2e38] rounded-xl text-right font-mono shrink-0 shadow-inner">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center justify-end gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>JAM SISTEM REAL-TIME</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white mt-0.5 tracking-tight flex items-baseline justify-end gap-1.5">
            <span>{formattedTime}</span>
            <span className="text-xs text-blue-400 font-bold">{timezoneAbbr}</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-sans mt-0.5">{formattedDate}</div>
        </div>
      </div>

      {feedbackMsg && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Main Options */}
      <div className="mt-5 space-y-4 relative z-10">
        {/* Option 1: Automatic Detection Box */}
        <div
          onClick={handleResetAuto}
          className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            timezoneMode === 'auto'
              ? 'bg-blue-950/30 border-blue-500/50 shadow-md shadow-blue-500/10'
              : 'bg-[#18181c] border-[#27272a] hover:border-zinc-700 hover:bg-[#1c1c22]'
          }`}
        >
          <div className="flex items-start space-x-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                timezoneMode === 'auto'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                  : 'bg-[#222228] text-zinc-400 border border-[#2d2d34]'
              }`}
            >
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm font-bold text-zinc-100">
                  Mode Otomatis (Sesuai Perangkat / Browser Device)
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                  AKTIF & DISARANKAN
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Waktu akan selalu menyesuaikan otomatis ke zona waktu laptop/HP pengguna: <strong className="text-zinc-200 font-mono">{deviceTimezone}</strong> ({getLiveTimeForTz(deviceTimezone)}).
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
            {timezoneMode === 'auto' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-bold font-mono">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                DIPILIH
              </span>
            ) : (
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-[#24242c] hover:bg-[#2c2c36] text-zinc-300 text-xs font-semibold border border-[#32323c] transition-colors"
              >
                Gunakan Otomatis
              </button>
            )}
          </div>
        </div>

        {/* Option 2: Indonesian Presets Grid */}
        <div>
          <label className="block text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
            PILIHAN MANUAL ZONA WAKTU INDONESIA & INTERNASIONAL
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {INDONESIAN_TIMEZONES.slice(0, 3).map((item) => {
              const isSelected = timezoneMode === 'manual' && resolvedTimezone === item.value;
              const liveTime = getLiveTimeForTz(item.value);

              return (
                <div
                  key={item.value}
                  onClick={() => handleSelect(item.value)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-950/30 border-blue-500/60 shadow-md shadow-blue-500/10'
                      : 'bg-[#18181c] border-[#27272a] hover:border-zinc-700 hover:bg-[#1c1c22]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono font-bold text-xs">
                        {item.abbr} ({item.offset})
                      </span>
                      <span className="text-xs font-mono font-bold text-zinc-200">
                        {liveTime}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-zinc-100">{item.label}</div>
                    <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.region}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#27272a]/60 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-500">{item.value}</span>
                    {isSelected ? (
                      <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-500 hover:text-zinc-300">Pilih</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Other Presets & Custom IANA String */}
        <div className="p-3.5 bg-[#121215] border border-[#222226] rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-zinc-400">
            <Globe className="w-4 h-4 text-zinc-500" />
            <span>Zona Lainnya:</span>
            {INDONESIAN_TIMEZONES.slice(3).map((item) => (
              <button
                key={item.value}
                onClick={() => handleSelect(item.value)}
                className={`px-2.5 py-1 rounded-md border text-[11px] font-mono transition-colors ${
                  timezoneMode === 'manual' && resolvedTimezone === item.value
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-bold'
                    : 'bg-[#18181c] text-zinc-300 border-[#27272a] hover:border-zinc-600'
                }`}
              >
                {item.abbr} ({item.value})
              </button>
            ))}
          </div>

          {!showCustomInput ? (
            <button
              onClick={() => setShowCustomInput(true)}
              className="text-xs text-blue-400 hover:underline font-medium flex items-center space-x-1"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Input IANA Khusus</span>
            </button>
          ) : (
            <form onSubmit={handleApplyCustom} className="flex items-center gap-2">
              <input
                type="text"
                value={customIana}
                onChange={(e) => setCustomIana(e.target.value)}
                placeholder="misal: Asia/Singapore"
                className="px-2.5 py-1 rounded bg-[#18181c] border border-[#2d2d34] text-xs text-zinc-200 font-mono placeholder-zinc-600 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Terapkan
              </button>
              <button
                type="button"
                onClick={() => setShowCustomInput(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                Batal
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
