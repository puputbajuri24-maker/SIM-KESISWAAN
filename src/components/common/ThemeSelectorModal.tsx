import React from 'react';
import { createPortal } from 'react-dom';
import { useTheme, THEME_PALETTES, ThemeMode, ThemePalette, FontSize, FontContrast, FontFamily } from '../../contexts/ThemeContext';
import { Sun, Moon, Monitor, Palette, Sparkles, Check, CheckCircle2, Type, Contrast, RotateCcw, X, Eye } from 'lucide-react';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({ isOpen, onClose }) => {
  const {
    mode,
    resolvedMode,
    palette,
    fontSize,
    fontContrast,
    fontFamily,
    setMode,
    setPalette,
    setFontSize,
    setFontContrast,
    setFontFamily,
    resetTheme,
    isCloudSynced
  } = useTheme();

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Alignment Container */}
      <div className="min-h-full flex items-center justify-center p-3 sm:p-4 text-center pointer-events-none">
        {/* Modal Container */}
        <div className="relative w-full max-w-xl rounded-2xl bg-[#101726] light:bg-white border border-[#1e293b] light:border-slate-300 shadow-2xl overflow-hidden z-10 font-sans text-xs flex flex-col max-h-[90vh] pointer-events-auto my-6 text-left">
        {/* Header */}
        <div className="p-4 bg-[#131b2e] light:bg-slate-100 border-b border-[#1e293b] light:border-slate-300 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 light:bg-blue-100 border border-blue-500/30 light:border-blue-300 text-blue-400 light:text-blue-600">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white light:text-slate-900 leading-tight">
                  Pusat Tema & Visualisasi Tampilan
                </h3>
                {isCloudSynced && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    ☁️ Cloud Synced
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 light:text-slate-600">
                Sesuaikan mode gelap/terang, palet warna, dan ketajaman teks (tersinkronisasi ke akun Anda di semua perangkat).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#1e293b] light:bg-slate-200 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1 bg-[#0c111c] light:bg-slate-50">
          {/* 1. Mode Gelap / Terang / Sistem */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-white light:text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Mode Tampilan (Color Scheme)</span>
              </label>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {resolvedMode === 'dark' ? 'GELAP AKTIF' : 'TERANG AKTIF'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'dark' as ThemeMode, label: 'Mode Gelap', desc: 'Nyaman di mata', icon: Moon },
                { id: 'light' as ThemeMode, label: 'Mode Terang', desc: 'Kontras jernih', icon: Sun },
                { id: 'system' as ThemeMode, label: 'Ikuti Sistem', desc: 'Otomatis OS', icon: Monitor }
              ].map(item => {
                const isSelected = mode === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                        : 'bg-[#131b2e] light:bg-white text-slate-300 light:text-slate-700 border-[#1e293b] light:border-slate-300 hover:border-slate-600 light:hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-400 light:text-blue-600'}`} />
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs">{item.label}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400 light:text-slate-500'}`}>
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Palet Nuansa Warna (Theme Palette) */}
          <div className="space-y-2">
            <label className="font-bold text-xs text-white light:text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Nuansa Warna SIM Kesiswaan (5 Palet Tema)</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {THEME_PALETTES.map(p => {
                const isSelected = palette === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPalette(p.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-[#18233c] light:bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                        : 'bg-[#131b2e] light:bg-white border-[#1e293b] light:border-slate-300 hover:border-slate-600 light:hover:border-slate-400'
                    }`}
                  >
                    {/* Visual Color Dot Preview */}
                    <div
                      className="w-7 h-7 rounded-lg shrink-0 border border-white/20 flex items-center justify-center shadow-inner"
                      style={{ backgroundColor: p.previewBg }}
                    >
                      <div
                        className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]"
                        style={{ backgroundColor: p.previewAccent, color: p.previewAccent }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-white light:text-slate-900 truncate">
                          {p.name}
                        </span>
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-700/50 light:bg-slate-200 text-slate-300 light:text-slate-700 font-bold shrink-0">
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 light:text-slate-600 line-clamp-1 mt-0.5">
                        {p.description}
                      </p>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-blue-400 light:text-blue-600 shrink-0 self-center" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Ketajaman & Kontras Teks (Anti-Buram) */}
          <div className="p-3.5 rounded-xl bg-[#131b2e] light:bg-white border border-[#1e293b] light:border-slate-300 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Contrast className="w-4 h-4 text-blue-400 light:text-blue-600" />
                <div>
                  <h4 className="font-bold text-xs text-white light:text-slate-900">
                    Ketajaman & Keterbacaan Huruf (Anti-Buram)
                  </h4>
                  <p className="text-[10px] text-slate-400 light:text-slate-600">
                    Menghilangkan teks kabur dengan optimasi subpixel antialiasing & rasio kontras WCAG AAA.
                  </p>
                </div>
              </div>

              <div className="flex items-center bg-[#0c111c] light:bg-slate-100 p-0.5 rounded-lg border border-[#1e293b] light:border-slate-300">
                <button
                  type="button"
                  onClick={() => setFontContrast('standard')}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                    fontContrast === 'standard'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
                  }`}
                >
                  Standar
                </button>
                <button
                  type="button"
                  onClick={() => setFontContrast('high')}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                    fontContrast === 'high'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
                  }`}
                >
                  Super Tajam
                </button>
              </div>
            </div>

            {/* Font Sizing & Family */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#1e293b]/60 light:border-slate-200">
              <div>
                <label className="text-[10px] font-bold text-slate-400 light:text-slate-600 block mb-1">
                  SKALA UKURAN TEKS
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'compact' as FontSize, label: 'Ringkas' },
                    { id: 'normal' as FontSize, label: 'Normal' },
                    { id: 'comfortable' as FontSize, label: 'Lega' }
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFontSize(s.id)}
                      className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition-all text-center ${
                        fontSize === s.id
                          ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                          : 'bg-[#0c111c] light:bg-slate-100 text-slate-300 light:text-slate-700 border-[#1e293b] light:border-slate-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 light:text-slate-600 block mb-1">
                  JENIS HURUF (TYPEFACE)
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'jakarta' as FontFamily, label: 'Jakarta' },
                    { id: 'inter' as FontFamily, label: 'Inter Pro' },
                    { id: 'system' as FontFamily, label: 'Sistem' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFontFamily(f.id)}
                      className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition-all text-center ${
                        fontFamily === f.id
                          ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                          : 'bg-[#0c111c] light:bg-slate-100 text-slate-300 light:text-slate-700 border-[#1e293b] light:border-slate-300'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Live Font Preview Box */}
          <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-950/20 light:bg-blue-50/50 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-blue-400 light:text-blue-600 font-bold uppercase">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Pratinjau Langsung (Live Preview)
              </span>
              <span>{resolvedMode.toUpperCase()} • {palette.toUpperCase()}</span>
            </div>
            <p className="text-sm font-bold text-white light:text-slate-900 leading-snug">
              Sistem Informasi Manajemen Kesiswaan & Ekstrakurikuler MAN 2 Seram Bagian Timur
            </p>
            <p className="text-xs text-slate-300 light:text-slate-700 leading-relaxed">
              Teks ini dirender secara dinamis dengan kalibrasi font antialiasing dan penyesuaian kontras otomatis sehingga tajam dan mudah dibaca pada segala kondisi cahaya.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-[#131b2e] light:bg-slate-100 border-t border-[#1e293b] light:border-slate-300 flex items-center justify-between">
          <button
            type="button"
            onClick={resetTheme}
            className="px-3 py-1.5 rounded-xl bg-[#1e293b] light:bg-slate-200 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 transition-colors text-[11px] font-semibold flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-md shadow-blue-600/30"
          >
            Terapkan & Tutup
          </button>
        </div>
      </div>
    </div>
  </div>,
  document.body
);
};
