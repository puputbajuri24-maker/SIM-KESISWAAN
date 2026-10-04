import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { handleFirestoreError, OperationType, isPermissionError } from '../services/firestoreErrors';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

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
  isCloudSynced: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State from localStorage (strictly dark mode across all devices by default)
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('simkesiswaan_theme_mode') as ThemeMode;
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {}
    return 'dark'; // Strictly dark mode by default
  });

  const [palette, setPaletteState] = useState<ThemePalette>(() => {
    try {
      const saved = localStorage.getItem('simkesiswaan_theme_palette') as ThemePalette;
      if (THEME_PALETTES.some(p => p.id === saved)) return saved;
    } catch (e) {}
    return 'sunset';
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

  // 2. Track System Color Scheme (only used if user explicitly selects 'system')
  const [systemIsDark, setSystemIsDark] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemIsDark(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 3. Resolve Dark vs Light: Guarantee dark mode unless explicitly set to light
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

  // 5. Global Real-Time Theme Listener (doc: settings/theme_config)
  // Ensures ALL devices (HP, Tablet, Desktop) immediately display identical theme
  useEffect(() => {
    let unsubTheme: (() => void) | null = null;
    try {
      unsubTheme = onSnapshot(doc(db, 'settings', 'theme_config'), (docSnap) => {
        if (!docSnap.exists()) return;
        const data = docSnap.data();
        if (data?.mode && (data.mode === 'dark' || data.mode === 'light' || data.mode === 'system')) {
          setModeState(prev => (prev !== data.mode ? data.mode : prev));
        }
        if (data?.palette && THEME_PALETTES.some(p => p.id === data.palette)) {
          setPaletteState(prev => (prev !== data.palette ? data.palette : prev));
        }
        if (data?.fontSize && ['compact', 'normal', 'comfortable'].includes(data.fontSize)) {
          setFontSizeState(prev => (prev !== data.fontSize ? data.fontSize : prev));
        }
        if (data?.fontContrast && ['standard', 'high'].includes(data.fontContrast)) {
          setFontContrastState(prev => (prev !== data.fontContrast ? data.fontContrast : prev));
        }
        if (data?.fontFamily && ['jakarta', 'inter', 'system'].includes(data.fontFamily)) {
          setFontFamilyState(prev => (prev !== data.fontFamily ? data.fontFamily : prev));
        }
      }, (err) => {
        if (isPermissionError(err)) {
          console.warn('Theme config read notice (using local preferences):', err);
        } else {
          handleFirestoreError(err, OperationType.GET, 'settings/theme_config');
        }
      });
    } catch (e) {
      console.warn('Theme listener attach warning:', e);
    }

    return () => {
      if (unsubTheme) unsubTheme();
    };
  }, []);

  // Helper to persist preference to Cloud Firestore in background
  const saveCloudPreference = (partialPref: {
    mode?: ThemeMode;
    palette?: ThemePalette;
    fontSize?: FontSize;
    fontContrast?: FontContrast;
    fontFamily?: FontFamily;
  }) => {
    try {
      const updatedPref = {
        mode: partialPref.mode ?? mode,
        palette: partialPref.palette ?? palette,
        fontSize: partialPref.fontSize ?? fontSize,
        fontContrast: partialPref.fontContrast ?? fontContrast,
        fontFamily: partialPref.fontFamily ?? fontFamily,
        updatedAt: new Date().toISOString()
      };

      // 1. Save to global theme config in Firestore if authenticated admin
      if (auth.currentUser) {
        setDoc(doc(db, 'settings', 'theme_config'), updatedPref, { merge: true }).catch((err) => {
          if (!isPermissionError(err)) {
            handleFirestoreError(err, OperationType.WRITE, 'settings/theme_config');
          }
        });
      }

      // 2. Also save to user doc if logged in
      let uid: string | null = null;
      try {
        const sessionUser = sessionStorage.getItem('sim_kesiswaan_session_user');
        if (sessionUser) {
          const parsed = JSON.parse(sessionUser);
          uid = parsed?.uid || null;
        }
      } catch {}
      if (!uid && auth.currentUser) {
        uid = auth.currentUser.uid;
      }
      if (uid && auth.currentUser) {
        setDoc(doc(db, 'users', uid), {
          themePreference: updatedPref
        }, { merge: true }).catch((err) => {
          if (!isPermissionError(err)) {
            handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
          }
        });
      }
    } catch (err) {
      console.warn('Failed to sync theme preference to cloud:', err);
    }
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    saveCloudPreference({ mode: newMode });
  };

  // Pure state updater without synchronous side-effects during render
  const toggleMode = () => {
    const current = mode === 'system' ? (systemIsDark ? 'dark' : 'light') : mode;
    const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
    setModeState(next);
    saveCloudPreference({ mode: next });
  };

  const setPalette = (newPalette: ThemePalette) => {
    setPaletteState(newPalette);
    saveCloudPreference({ palette: newPalette });
  };

  const setFontSize = (newSize: FontSize) => {
    setFontSizeState(newSize);
    saveCloudPreference({ fontSize: newSize });
  };

  const setFontContrast = (newContrast: FontContrast) => {
    setFontContrastState(newContrast);
    saveCloudPreference({ fontContrast: newContrast });
  };

  const setFontFamily = (newFont: FontFamily) => {
    setFontFamilyState(newFont);
    saveCloudPreference({ fontFamily: newFont });
  };

  const resetTheme = () => {
    setModeState('dark');
    setPaletteState('navy');
    setFontSizeState('normal');
    setFontContrastState('high');
    setFontFamilyState('jakarta');
    saveCloudPreference({
      mode: 'dark',
      palette: 'navy',
      fontSize: 'normal',
      fontContrast: 'high',
      fontFamily: 'jakarta'
    });
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
        currentPaletteInfo,
        isCloudSynced: true
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
