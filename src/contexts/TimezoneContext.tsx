import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

export interface TimezoneOption {
  value: string; // IANA string e.g. 'Asia/Jayapura', 'Asia/Jakarta'
  label: string; // e.g. 'WIT - Waktu Indonesia Timur'
  region: string; // e.g. 'Maluku (Seram Bagian Timur), Papua'
  abbr: string; // 'WIT'
  offset: string; // 'UTC+09:00'
  offsetHours: number; // 9
}

export const INDONESIAN_TIMEZONES: TimezoneOption[] = [
  {
    value: 'Asia/Jayapura',
    label: 'WIT — Waktu Indonesia Timur',
    region: 'Maluku (MAN 2 Seram Bagian Timur), Maluku Utara, Papua',
    abbr: 'WIT',
    offset: 'UTC+09:00',
    offsetHours: 9
  },
  {
    value: 'Asia/Makassar',
    label: 'WITA — Waktu Indonesia Tengah',
    region: 'Bali, NTB, NTT, Sulawesi, Kalimantan Selatan/Timur/Utara',
    abbr: 'WITA',
    offset: 'UTC+08:00',
    offsetHours: 8
  },
  {
    value: 'Asia/Jakarta',
    label: 'WIB — Waktu Indonesia Barat',
    region: 'Jawa, Sumatera, Kalimantan Barat & Tengah',
    abbr: 'WIB',
    offset: 'UTC+07:00',
    offsetHours: 7
  },
  {
    value: 'Asia/Riyadh',
    label: 'AST — Waktu Makkah / Arab Saudi',
    region: 'Arab Saudi, Timur Tengah (UTC+3)',
    abbr: 'AST',
    offset: 'UTC+03:00',
    offsetHours: 3
  },
  {
    value: 'UTC',
    label: 'UTC — Coordinated Universal Time',
    region: 'Standar Waktu Internasional (GMT/UTC+0)',
    abbr: 'UTC',
    offset: 'UTC+00:00',
    offsetHours: 0
  }
];

export interface TimezoneContextType {
  timezoneMode: 'auto' | 'manual';
  selectedTimezone: string;
  resolvedTimezone: string;
  deviceTimezone: string;
  timezoneAbbr: string;
  utcOffsetString: string;
  currentTime: Date;
  formattedTime: string;
  formattedDate: string;
  formattedDateTime: string;
  setTimezone: (ianaTimezone: string, mode?: 'auto' | 'manual') => void;
  resetToAuto: () => void;
  formatCustomDate: (dateInput: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
}

const STORAGE_KEY = 'sim_kesiswaan_timezone_pref';
const STORAGE_MODE_KEY = 'sim_kesiswaan_timezone_mode';

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

// Helper to get standard Indonesian abbreviation or formatted fallback
export function getTimezoneAbbreviation(ianaTz: string, date: Date = new Date()): string {
  if (ianaTz === 'Asia/Jayapura') return 'WIT';
  if (ianaTz === 'Asia/Makassar') return 'WITA';
  if (ianaTz === 'Asia/Jakarta' || ianaTz === 'Asia/Pontianak') return 'WIB';
  if (ianaTz === 'UTC') return 'UTC';
  if (ianaTz === 'Asia/Riyadh') return 'AST';

  try {
    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: ianaTz,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    if (tzPart && tzPart.value) {
      // Map standard Indonesian parts
      if (tzPart.value.includes('GMT+9') || tzPart.value.includes('UTC+9')) return 'WIT';
      if (tzPart.value.includes('GMT+8') || tzPart.value.includes('UTC+8')) return 'WITA';
      if (tzPart.value.includes('GMT+7') || tzPart.value.includes('UTC+7')) return 'WIB';
      return tzPart.value;
    }
  } catch (e) {}

  return 'WAKTU';
}

export function getUtcOffsetString(ianaTz: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaTz,
      timeZoneName: 'longOffset'
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    if (tzPart && tzPart.value) {
      return tzPart.value.replace('GMT', 'UTC');
    }
  } catch (e) {}

  // Fallback map
  if (ianaTz === 'Asia/Jayapura') return 'UTC+09:00';
  if (ianaTz === 'Asia/Makassar') return 'UTC+08:00';
  if (ianaTz === 'Asia/Jakarta') return 'UTC+07:00';
  if (ianaTz === 'UTC') return 'UTC+00:00';
  return 'UTC';
}

export const TimezoneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Detect device timezone
  const deviceTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jayapura';
    } catch {
      return 'Asia/Jayapura';
    }
  }, []);

  // 2. Load mode ('auto' or 'manual')
  const [timezoneMode, setTimezoneMode] = useState<'auto' | 'manual'>(() => {
    try {
      const savedMode = localStorage.getItem(STORAGE_MODE_KEY);
      if (savedMode === 'manual' || savedMode === 'auto') return savedMode;
      return 'auto'; // Default: automatically detect device timezone
    } catch {
      return 'auto';
    }
  });

  // 3. Load selected timezone
  const [selectedTimezone, setSelectedTimezone] = useState<string>(() => {
    try {
      const savedTz = localStorage.getItem(STORAGE_KEY);
      if (savedTz) return savedTz;
      return deviceTimezone;
    } catch {
      return deviceTimezone;
    }
  });

  // Active resolved timezone
  const resolvedTimezone = timezoneMode === 'auto' ? deviceTimezone : selectedTimezone;

  // Real-time ticking clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timezoneAbbr = useMemo(() => {
    return getTimezoneAbbreviation(resolvedTimezone, currentTime);
  }, [resolvedTimezone, currentTime]);

  const utcOffsetString = useMemo(() => {
    return getUtcOffsetString(resolvedTimezone, currentTime);
  }, [resolvedTimezone, currentTime]);

  // Formatted representations
  const formattedTime = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        timeZone: resolvedTimezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(currentTime);
    } catch {
      return currentTime.toLocaleTimeString('id-ID');
    }
  }, [resolvedTimezone, currentTime]);

  const formattedDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        timeZone: resolvedTimezone,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(currentTime);
    } catch {
      return currentTime.toLocaleDateString('id-ID');
    }
  }, [resolvedTimezone, currentTime]);

  const formattedDateTime = useMemo(() => {
    return `${formattedDate} ${formattedTime} ${timezoneAbbr}`;
  }, [formattedDate, formattedTime, timezoneAbbr]);

  const setTimezone = (ianaTz: string, mode: 'auto' | 'manual' = 'manual') => {
    setSelectedTimezone(ianaTz);
    setTimezoneMode(mode);
    try {
      localStorage.setItem(STORAGE_KEY, ianaTz);
      localStorage.setItem(STORAGE_MODE_KEY, mode);
    } catch {}
  };

  const resetToAuto = () => {
    setTimezoneMode('auto');
    setSelectedTimezone(deviceTimezone);
    try {
      localStorage.setItem(STORAGE_MODE_KEY, 'auto');
      localStorage.setItem(STORAGE_KEY, deviceTimezone);
    } catch {}
  };

  const formatCustomDate = (dateInput: string | number | Date, options?: Intl.DateTimeFormatOptions): string => {
    try {
      const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
      if (isNaN(d.getTime())) return String(dateInput);

      const defaultOptions: Intl.DateTimeFormatOptions = {
        timeZone: resolvedTimezone,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...options
      };

      return new Intl.DateTimeFormat('id-ID', defaultOptions).format(d);
    } catch {
      return String(dateInput);
    }
  };

  return (
    <TimezoneContext.Provider
      value={{
        timezoneMode,
        selectedTimezone,
        resolvedTimezone,
        deviceTimezone,
        timezoneAbbr,
        utcOffsetString,
        currentTime,
        formattedTime,
        formattedDate,
        formattedDateTime,
        setTimezone,
        resetToAuto,
        formatCustomDate
      }}
    >
      {children}
    </TimezoneContext.Provider>
  );
};

export const useAppTimezone = () => {
  const context = useContext(TimezoneContext);
  if (!context) {
    throw new Error('useAppTimezone must be used within a TimezoneProvider');
  }
  return context;
};
