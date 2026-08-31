import React from 'react';
import { useTheme, THEME_PALETTES, ThemeMode, ThemePalette, FontSize, FontContrast, FontFamily } from '../../contexts/ThemeContext';
import { Sun, Moon, Monitor, Palette, Sparkles, Check, CheckCircle2, Type, Contrast, RotateCcw, Eye, ShieldCheck, Zap } from 'lucide-react';

export const ThemeSettingsCard: React.FC = () => {
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
    resetTheme
  } = useTheme();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Pengaturan Mode Tampilan, Tema Warna & Ketajaman Visual
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilih mode gelap/terang, nuansa palet warna, dan kalibrasi font agar teks selalu tajam, kontras tinggi, dan tidak buram.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={resetTheme}
          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
          title="Kembalikan ke pengaturan visual standar"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Tema</span>
        </button>
      </div>

      {/* 1. Pilihan Mode Tampilan (Dark / Light / System) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>1. Mode Skema Tampilan (Color Scheme)</span>
          </label>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
            Aktif: {resolvedMode === 'dark' ? 'Mode Gelap (Dark)' : 'Mode Terang (Light)'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: 'dark' as ThemeMode,
              title: 'Mode Gelap (Dark)',
              desc: 'Latar gelap elegan dengan kontras teks terang, nyaman untuk penggunaan jangka panjang di ruangan minim cahaya.',
              icon: Moon
            },
            {
              id: 'light' as ThemeMode,
              title: 'Mode Terang (Light)',
              desc: 'Latar putih & abu-abu terang bersih dengan teks gelap sangat tajam untuk pencahayaan kantor atau siang hari.',
              icon: Sun
            },
            {
              id: 'system' as ThemeMode,
              title: 'Ikuti Sistem (Auto)',
              desc: 'Secara otomatis menyesuaikan preferensi skema warna sistem operasi (Windows, Mac, Android, iOS).',
              icon: Monitor
            }
          ].map(item => {
            const isSelected = mode === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </div>
                  <p className={`font-bold text-xs ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                    {item.desc}
                  </p>
                </div>
                <span className={`text-[10px] font-bold mt-3 self-start ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                  {isSelected ? '● Sedang Diterapkan' : 'Pilih Mode Ini →'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Pilihan Palet Tema (5 Tema Resmi SIM Kesiswaan) */}
      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>2. Palet Nuansa Warna & Atmosfer (5 Pilihan Tema)</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {THEME_PALETTES.map(p => {
            const isSelected = palette === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPalette(p.id)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-md border border-black/10 dark:border-white/20 flex items-center justify-center shadow-inner"
                        style={{ backgroundColor: p.previewBg }}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: p.previewAccent }}
                        />
                      </div>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {p.badge}
                      </span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </div>

                  <p className={`font-bold text-xs ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                    {p.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-1">
                    {p.description}
                  </p>
                </div>

                <span className={`text-[10px] font-bold mt-2.5 self-start ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                  {isSelected ? '● Tema Terpilih' : 'Terapkan Tema →'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Kalibrasi Visualisasi Font Anti-Buram & Ketajaman Teks */}
      <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-blue-500" />
          <span>3. Kalibrasi Tipografi & Keterbacaan Huruf (Anti-Buram)</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tingkat Kontras */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Contrast className="w-4 h-4 text-blue-500" />
              <span>Kontras & Ketajaman</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Memaksimalkan rasio kontras teks dan ketajaman subpixel agar bebas blur.
            </p>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {[
                { id: 'standard' as FontContrast, label: 'Standar' },
                { id: 'high' as FontContrast, label: 'Ultra Tajam' }
              ].map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFontContrast(c.id)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all text-center ${
                    fontContrast === c.id
                      ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Skala Ukuran Teks */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Type className="w-4 h-4 text-blue-500" />
              <span>Skala Ukuran Huruf</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Sesuaikan kerapatan informasi pada tabel presensi dan panel dashboard.
            </p>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {[
                { id: 'compact' as FontSize, label: 'Ringkas' },
                { id: 'normal' as FontSize, label: 'Normal' },
                { id: 'comfortable' as FontSize, label: 'Lega' }
              ].map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setFontSize(s.id)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all text-center ${
                    fontSize === s.id
                      ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Jenis Huruf (Font Family) */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>Jenis Font (Typeface)</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Pilihan font modern dengan keterbacaan tinggi di layar monitor.
            </p>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {[
                { id: 'jakarta' as FontFamily, label: 'Jakarta' },
                { id: 'inter' as FontFamily, label: 'Inter' },
                { id: 'system' as FontFamily, label: 'Sistem' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFontFamily(f.id)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all text-center ${
                    fontFamily === f.id
                      ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Interactive Live Preview Card */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Eye className="w-4 h-4 text-indigo-500" />
            <span>Pratinjau Hasil Visual Nyata (Live Component Preview)</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
            {resolvedMode.toUpperCase()} • PALET_{palette.toUpperCase()} • FONT_{fontFamily.toUpperCase()}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                MAN 2 SERAM BAGIAN TIMUR — SISTEM KESISWAAN
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Monitoring presensi ekskul, disiplin siswa, surat dispensasi dinas, dan pengumuman resmi.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Sistem Aktif (100% Online)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block font-semibold">TOTAL SISWA</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">428 Siswa</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block font-semibold">UNIT EKSKUL</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">11 Terdaftar</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block font-semibold">PRESENSI HARI INI</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">96.8% Hadir</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block font-semibold">KONTROL DISIPLIN</span>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">0 Pelanggaran</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
