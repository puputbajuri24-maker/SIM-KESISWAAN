import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Clock,
  Globe,
  Smartphone,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Compass,
  Zap,
  Info,
  X,
  Radio,
  SlidersHorizontal
} from 'lucide-react';
import { useAppTimezone, INDONESIAN_TIMEZONES } from '../../contexts/TimezoneContext';

interface TimezoneSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TimezoneSelectorModal: React.FC<TimezoneSelectorModalProps> = ({ isOpen, onClose }) => {
  const {
    timezoneMode,
    resolvedTimezone,
    deviceTimezone,
    timezoneAbbr,
    utcOffsetString,
    currentTime,
    formattedTime,
    formattedDate,
    setTimezone,
    resetToAuto
  } = useAppTimezone();

  const [customIana, setCustomIana] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  if (!isOpen || typeof document === 'undefined') return null;

  // Format a live time for any timezone value
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

  const handleSelectPreset = (tzValue: string) => {
    setTimezone(tzValue, 'manual');
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customIana.trim()) {
      try {
        // test validity
        new Intl.DateTimeFormat('en-US', { timeZone: customIana.trim() }).format(new Date());
        setTimezone(customIana.trim(), 'manual');
        setShowCustomInput(false);
        setCustomIana('');
      } catch (err) {
        alert(`Zona waktu "${customIana}" tidak valid. Contoh valid: Asia/Bangkok, America/New_York, Europe/London`);
      }
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto font-sans">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="min-h-full flex items-center justify-center p-3 sm:p-4 text-center pointer-events-none">
        <div
          className="w-full max-w-xl bg-[#111114] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans max-h-[90vh] pointer-events-auto my-6 text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#27272a] flex items-center justify-between bg-gradient-to-r from-[#16161a] to-[#121215]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-zinc-100">
                    Sinkronisasi & Pilihan Zona Waktu
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 uppercase">
                    {timezoneAbbr}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Pilih waktu otomatis sesuai perangkat atau tentukan zona waktu aplikasi
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-[#202025] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Current Active Live Telemetry Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#181820] to-[#121216] border border-blue-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative z-10">
              <div>
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>WAKTU AKTIF APLIKASI SEKARANG</span>
                  {timezoneMode === 'auto' ? (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/40">
                      OTOMATIS DEVICE
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/40">
                      MANUAL PILIHAN
                    </span>
                  )}
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-bold text-white mt-1 tracking-tight flex items-baseline gap-2">
                  <span>{formattedTime}</span>
                  <span className="text-base sm:text-lg font-mono text-blue-400 font-bold">{timezoneAbbr}</span>
                </div>
                <div className="text-xs text-zinc-300 font-medium mt-0.5">
                  {formattedDate} • <span className="font-mono text-zinc-400">{resolvedTimezone} ({utcOffsetString})</span>
                </div>
              </div>

              {timezoneMode === 'manual' && (
                <button
                  onClick={resetToAuto}
                  className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center space-x-1.5 transition-all self-start sm:self-center shrink-0 shadow-sm"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Kembalikan ke Otomatis</span>
                </button>
              )}
            </div>
          </div>

          {/* Option 1: Automatic Detection (Recommended) */}
          <div
            onClick={resetToAuto}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              timezoneMode === 'auto'
                ? 'bg-blue-950/25 border-blue-500/50 shadow-md shadow-blue-500/10'
                : 'bg-[#151518] border-[#25252a] hover:border-zinc-700 hover:bg-[#18181d]'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  timezoneMode === 'auto'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    : 'bg-[#202025] text-zinc-400 border border-[#2b2b32]'
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-zinc-100">
                    Deteksi Otomatis Sesuai Perangkat (Device Detection)
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                    DISARANKAN
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  Mendeteksi timezone browser/HP: <strong className="text-zinc-200 font-mono">{deviceTimezone}</strong> ({getLiveTimeForTz(deviceTimezone)})
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {timezoneMode === 'auto' && (
                <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
              )}
            </div>
          </div>

          {/* Section Divider: Manual Presets */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                PILIHAN ZONA WAKTU INDONESIA & INTERNASIONAL
              </span>
              <span className="text-[10px] text-zinc-500">Klik untuk mengaktifkan</span>
            </div>

            <div className="space-y-2">
              {INDONESIAN_TIMEZONES.map((item) => {
                const isSelected = timezoneMode === 'manual' && resolvedTimezone === item.value;
                const liveTime = getLiveTimeForTz(item.value);

                return (
                  <div
                    key={item.value}
                    onClick={() => handleSelectPreset(item.value)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-950/25 border-blue-500/50 shadow-sm'
                        : 'bg-[#141417] border-[#242428] hover:border-zinc-700 hover:bg-[#18181d]'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                          isSelected
                            ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                            : 'bg-[#202025] text-zinc-300 border border-[#2b2b32]'
                        }`}
                      >
                        {item.abbr}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-zinc-100 truncate">
                            {item.label}
                          </span>
                          <span className="text-[10px] font-mono text-blue-400 font-semibold shrink-0">
                            {item.offset}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                          {item.region}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 ml-2">
                      <div className="text-right font-mono">
                        <div className="text-xs font-bold text-zinc-200">{liveTime}</div>
                        <div className="text-[9px] text-zinc-500">{item.abbr}</div>
                      </div>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-zinc-700" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom IANA Timezone Input Toggle */}
          <div className="pt-2">
            {!showCustomInput ? (
              <button
                onClick={() => setShowCustomInput(true)}
                className="text-xs text-zinc-400 hover:text-blue-400 font-medium flex items-center space-x-1.5 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Gunakan IANA Timezone Lainnya (Misal: Asia/Singapore, America/New_York)...</span>
              </button>
            ) : (
              <form onSubmit={handleApplyCustom} className="p-3 bg-[#161619] border border-[#27272a] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-200 flex items-center space-x-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    <span>Input IANA Timezone String:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(false)}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300"
                  >
                    Batal
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customIana}
                    onChange={(e) => setCustomIana(e.target.value)}
                    placeholder="Contoh: Asia/Bangkok, Asia/Tokyo, Europe/London"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#101013] border border-[#2d2d34] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shrink-0"
                  >
                    Terapkan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#27272a] bg-[#141418] flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-[11px] text-zinc-400">
            <Info className="w-3.5 h-3.5 text-zinc-500" />
            <span>Zona waktu otomatis tersimpan di peramban ini.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#222228] hover:bg-[#2c2c34] text-zinc-200 text-xs font-semibold transition-colors border border-[#2f2f38]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  </div>,
  document.body
);
};
