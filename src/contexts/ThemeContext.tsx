import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';
export type ThemePalette = 'navy' | 'emerald' | 'indigo' | 'sunset' | 'slate';
export type FontSize = 'compact' | 'normal' | 'comfortable';
export type FontContrast = 'standard' | 'high';
export type FontFamily = 'jakarta' | 'inter' | 'system';

export interface ThemePaletteInfo {
  id: ThemePalette;
  name: string;
  badge: string;
  description: string;
  previewBg: string;
  previewAccent: string;
  primaryClass: string;
  glowColor: string;
}

export const THEME_PALETTES: ThemePaletteInfo[] = [
  {
    id: 'navy',
    name: 'Modern Navy & Sapphire',
    badge: 'DEFAULT',
    description: 'Palet biru safir modern berteknologi tinggi dengan kontras tajam.',
    previewBg: '#090d16',
    previewAccent: '#3b82f6',
    primaryClass: 'from-blue-600 to-indigo-600',
    glowColor: 'rgba(59, 130, 246, 0.4)'
  },
  {
    id: 'emerald',
    name: 'Madrasah Emerald & Mint',
    badge: 'KEMENAG',
    description: 'Nuansa hijau zamrud islami yang segar, sejuk, dan berkharisma.',
    previewBg: '#06130e',
    previewAccent: '#10b981',
    primaryClass: 'from-emerald-600 to-teal-600',
    glowColor: 'rgba(16, 185, 129, 0.4)'
  },
  {
    id: 'indigo',
    name: 'Royal Academic Indigo',
    badge: 'PRESTIGE',
    description: 'Nuansa ungu indigo anggun untuk atmosfer institusi pendidikan berprestasi.',
    previewBg: '#0c0b1a',
    previewAccent: '#6366f1',
    primaryClass: 'from-indigo-600 to-purple-600',
    glowColor: 'rgba(99, 102, 241, 0.4)'
  },
  {
    id: 'sunset',
    name: 'Warm Sunset & Amber',
    badge: 'DYNAMIC',
    description: 'Nuansa jingga emas dan tembaga hangat yang bersemangat dan energetik.',
    previewBg: '#140c06',
    previewAccent: '#f59e0b',
    primaryClass: 'from-amber-600 to-rose-600',
    glowColor: 'rgba(245, 158, 11, 0.4)'
  },
  {
    id: 'slate',
    name: 'Monochrome Graphite Pro',
    badge: 'MINIMALIST',
    description: 'Nuansa grafit monokrom berkelas dengan kejernihan dan keterbacaan maksimal.',
    previewBg: '#0f1117',
    previewAccent: '#94a3b8',
    primaryClass: 'from-slate-700 to-zinc-800',
    glowColor: 'rgba(148, 163, 184, 0.3)'
  }
];

interface ThemeContextType {
  mode: ThemeMode;
  resolvedMode: 'dark' | 'light';
  palette: ThemePalette;
  fontSize: FontSize;
  fontContrast: FontContrast;
  fontFamily: FontFamily;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setPalette: (palette: ThemePalette) => void;
  setFontSize: (fontSize: FontSize) => void;
  setFontContrast: (contrast: FontContrast) => void;
  setFontFamily: (fontFamily: FontFamily) => void;
  resetTheme: () => void;
  currentPaletteInfo: ThemePaletteInfo;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State from localStorage
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('simkesiswaan_theme_mode') as ThemeMode;
      if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
    } catch (e) {}
    return 'dark'; // Default dark mode
  });

  const [palette, setPaletteState] = useState<ThemePalette>(() => {
    try {
      const saved = localStorage.getItem('simkesiswaan_theme_palette') as ThemePalette;
      if (THEME_PALETTES.some(p => p.id === saved)) return saved;
    } catch (e) {}
    return 'navy';
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    try {
      const saved = localStorage.getItem('simkesiswaan_font_size') as FontSize;
      if (saved === 'compact' || saved === 'normal' || saved === 'comfortable') return saved;
    } catch (e) {}
    return 'normal';
  });

  const [fontContrast, setFontContrastState] = useState<FontContrast>(() => {
    try {
      const saved = localStorage.getItem('simkesiswaan_font_contrast') as FontContrast;
      if (saved === 'standard' || saved === 'high') return saved;
    } catch (e) {}
    return 'high'; // Default high contrast for ultra crisp font
  });

  const [fontFamily, setFontFamilyState] = useState<FontFamily>(() => {
    try {
      const saved = localStorage.getItem('simkesiswaan_font_family') as FontFamily;
      if (saved === 'jakarta' || saved === 'inter' || saved === 'system') return saved;
    } catch (e) {}
    return 'jakarta';
  });

  // 2. Track System Color Scheme
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 3. Resolve Dark vs Light
  const resolvedMode: 'dark' | 'light' = useMemo(() => {
    if (mode === 'system') {
      return systemIsDark ? 'dark' : 'light';
    }
    return mode;
  }, [mode, systemIsDark]);

  // 4. Apply DOM attributes & CSS Classes
  useEffect(() => {
    const root = document.documentElement;

    // Toggle .dark and .light classes
    if (resolvedMode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    // Set data attributes
    root.setAttribute('data-mode', resolvedMode);
    root.setAttribute('data-theme', palette);
    root.setAttribute('data-font-size', fontSize);
    root.setAttribute('data-font-contrast', fontContrast);
    root.setAttribute('data-font-family', fontFamily);

    // Save to localStorage
    try {
      localStorage.setItem('simkesiswaan_theme_mode', mode);
      localStorage.setItem('simkesiswaan_theme_palette', palette);
      localStorage.setItem('simkesiswaan_font_size', fontSize);
      localStorage.setItem('simkesiswaan_font_contrast', fontContrast);
      localStorage.setItem('simkesiswaan_font_family', fontFamily);
    } catch (e) {}
  }, [mode, resolvedMode, palette, fontSize, fontContrast, fontFamily]);

  const setMode = (newMode: ThemeMode) => setModeState(newMode);
  const toggleMode = () => {
    setModeState(prev => {
      const current = prev === 'system' ? (systemIsDark ? 'dark' : 'light') : prev;
      return current === 'dark' ? 'light' : 'dark';
    });
  };
  const setPalette = (newPalette: ThemePalette) => setPaletteState(newPalette);
  const setFontSize = (newSize: FontSize) => setFontSizeState(newSize);
  const setFontContrast = (newContrast: FontContrast) => setFontContrastState(newContrast);
  const setFontFamily = (newFont: FontFamily) => setFontFamilyState(newFont);

  const resetTheme = () => {
    setModeState('dark');
    setPaletteState('navy');
    setFontSizeState('normal');
    setFontContrastState('high');
    setFontFamilyState('jakarta');
  };

  const currentPaletteInfo = useMemo(() => {
    return THEME_PALETTES.find(p => p.id === palette) || THEME_PALETTES[0];
  }, [palette]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        resolvedMode,
        palette,
        fontSize,
        fontContrast,
        fontFamily,
        setMode,
        toggleMode,
        setPalette,
        setFontSize,
        setFontContrast,
        setFontFamily,
        resetTheme,
        currentPaletteInfo
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
