export interface EkskulColorTheme {
  id: string;
  name: string;
  bgLight: string;
  bgDark: string;
  textLight: string;
  textDark: string;
  borderLight: string;
  borderDark: string;
  topBorder: string;
  avatarBg: string;
  avatarText: string;
  avatarBorder: string;
  badgeClass: string;
  progressBar: string;
  actionText: string;
  headerGradient: string;
  swatchBg: string;
}

export const EKSKUL_COLOR_THEMES: EkskulColorTheme[] = [
  {
    id: 'emerald',
    name: 'Hijau Emerald',
    bgLight: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-950/40',
    textLight: 'text-emerald-700',
    textDark: 'dark:text-emerald-300',
    borderLight: 'border-emerald-200',
    borderDark: 'dark:border-emerald-800',
    topBorder: 'border-t-emerald-500',
    avatarBg: 'bg-emerald-100 dark:bg-emerald-950/80',
    avatarText: 'text-emerald-700 dark:text-emerald-300',
    avatarBorder: 'border-emerald-300 dark:border-emerald-700',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    progressBar: 'bg-emerald-500 dark:bg-emerald-400',
    actionText: 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300',
    headerGradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/20 dark:via-emerald-500/10 dark:to-transparent',
    swatchBg: 'bg-emerald-500'
  },
  {
    id: 'sky',
    name: 'Biru Langit',
    bgLight: 'bg-sky-50',
    bgDark: 'dark:bg-sky-950/40',
    textLight: 'text-sky-700',
    textDark: 'dark:text-sky-300',
    borderLight: 'border-sky-200',
    borderDark: 'dark:border-sky-800',
    topBorder: 'border-t-sky-500',
    avatarBg: 'bg-sky-100 dark:bg-sky-950/80',
    avatarText: 'text-sky-700 dark:text-sky-300',
    avatarBorder: 'border-sky-300 dark:border-sky-700',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    progressBar: 'bg-sky-500 dark:bg-sky-400',
    actionText: 'text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300',
    headerGradient: 'from-sky-500/10 via-sky-500/5 to-transparent dark:from-sky-500/20 dark:via-sky-500/10 dark:to-transparent',
    swatchBg: 'bg-sky-500'
  },
  {
    id: 'amber',
    name: 'Emas / Amber',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-950/40',
    textLight: 'text-amber-700',
    textDark: 'dark:text-amber-300',
    borderLight: 'border-amber-200',
    borderDark: 'dark:border-amber-800',
    topBorder: 'border-t-amber-500',
    avatarBg: 'bg-amber-100 dark:bg-amber-950/80',
    avatarText: 'text-amber-700 dark:text-amber-300',
    avatarBorder: 'border-amber-300 dark:border-amber-700',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    progressBar: 'bg-amber-500 dark:bg-amber-400',
    actionText: 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300',
    headerGradient: 'from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/20 dark:via-amber-500/10 dark:to-transparent',
    swatchBg: 'bg-amber-500'
  },
  {
    id: 'rose',
    name: 'Merah Rose',
    bgLight: 'bg-rose-50',
    bgDark: 'dark:bg-rose-950/40',
    textLight: 'text-rose-700',
    textDark: 'dark:text-rose-300',
    borderLight: 'border-rose-200',
    borderDark: 'dark:border-rose-800',
    topBorder: 'border-t-rose-500',
    avatarBg: 'bg-rose-100 dark:bg-rose-950/80',
    avatarText: 'text-rose-700 dark:text-rose-300',
    avatarBorder: 'border-rose-300 dark:border-rose-700',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    progressBar: 'bg-rose-500 dark:bg-rose-400',
    actionText: 'text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300',
    headerGradient: 'from-rose-500/10 via-rose-500/5 to-transparent dark:from-rose-500/20 dark:via-rose-500/10 dark:to-transparent',
    swatchBg: 'bg-rose-500'
  },
  {
    id: 'violet',
    name: 'Ungu Violet',
    bgLight: 'bg-violet-50',
    bgDark: 'dark:bg-violet-950/40',
    textLight: 'text-violet-700',
    textDark: 'dark:text-violet-300',
    borderLight: 'border-violet-200',
    borderDark: 'dark:border-violet-800',
    topBorder: 'border-t-violet-500',
    avatarBg: 'bg-violet-100 dark:bg-violet-950/80',
    avatarText: 'text-violet-700 dark:text-violet-300',
    avatarBorder: 'border-violet-300 dark:border-violet-700',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800',
    progressBar: 'bg-violet-500 dark:bg-violet-400',
    actionText: 'text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300',
    headerGradient: 'from-violet-500/10 via-violet-500/5 to-transparent dark:from-violet-500/20 dark:via-violet-500/10 dark:to-transparent',
    swatchBg: 'bg-violet-500'
  },
  {
    id: 'teal',
    name: 'Hijau Toska / Teal',
    bgLight: 'bg-teal-50',
    bgDark: 'dark:bg-teal-950/40',
    textLight: 'text-teal-700',
    textDark: 'dark:text-teal-300',
    borderLight: 'border-teal-200',
    borderDark: 'dark:border-teal-800',
    topBorder: 'border-t-teal-500',
    avatarBg: 'bg-teal-100 dark:bg-teal-950/80',
    avatarText: 'text-teal-700 dark:text-teal-300',
    avatarBorder: 'border-teal-300 dark:border-teal-700',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
    progressBar: 'bg-teal-500 dark:bg-teal-400',
    actionText: 'text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300',
    headerGradient: 'from-teal-500/10 via-teal-500/5 to-transparent dark:from-teal-500/20 dark:via-teal-500/10 dark:to-transparent',
    swatchBg: 'bg-teal-500'
  },
  {
    id: 'indigo',
    name: 'Biru Indigo',
    bgLight: 'bg-indigo-50',
    bgDark: 'dark:bg-indigo-950/40',
    textLight: 'text-indigo-700',
    textDark: 'dark:text-indigo-300',
    borderLight: 'border-indigo-200',
    borderDark: 'dark:border-indigo-800',
    topBorder: 'border-t-indigo-500',
    avatarBg: 'bg-indigo-100 dark:bg-indigo-950/80',
    avatarText: 'text-indigo-700 dark:text-indigo-300',
    avatarBorder: 'border-indigo-300 dark:border-indigo-700',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    progressBar: 'bg-indigo-500 dark:bg-indigo-400',
    actionText: 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300',
    headerGradient: 'from-indigo-500/10 via-indigo-500/5 to-transparent dark:from-indigo-500/20 dark:via-indigo-500/10 dark:to-transparent',
    swatchBg: 'bg-indigo-500'
  },
  {
    id: 'fuchsia',
    name: 'Magenta / Fuchsia',
    bgLight: 'bg-fuchsia-50',
    bgDark: 'dark:bg-fuchsia-950/40',
    textLight: 'text-fuchsia-700',
    textDark: 'dark:text-fuchsia-300',
    borderLight: 'border-fuchsia-200',
    borderDark: 'dark:border-fuchsia-800',
    topBorder: 'border-t-fuchsia-500',
    avatarBg: 'bg-fuchsia-100 dark:bg-fuchsia-950/80',
    avatarText: 'text-fuchsia-700 dark:text-fuchsia-300',
    avatarBorder: 'border-fuchsia-300 dark:border-fuchsia-700',
    badgeClass: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 dark:border-fuchsia-800',
    progressBar: 'bg-fuchsia-500 dark:bg-fuchsia-400',
    actionText: 'text-fuchsia-600 dark:text-fuchsia-400 hover:text-fuchsia-700 dark:hover:text-fuchsia-300',
    headerGradient: 'from-fuchsia-500/10 via-fuchsia-500/5 to-transparent dark:from-fuchsia-500/20 dark:via-fuchsia-500/10 dark:to-transparent',
    swatchBg: 'bg-fuchsia-500'
  },
  {
    id: 'orange',
    name: 'Jingga / Orange',
    bgLight: 'bg-orange-50',
    bgDark: 'dark:bg-orange-950/40',
    textLight: 'text-orange-700',
    textDark: 'dark:text-orange-300',
    borderLight: 'border-orange-200',
    borderDark: 'dark:border-orange-800',
    topBorder: 'border-t-orange-500',
    avatarBg: 'bg-orange-100 dark:bg-orange-950/80',
    avatarText: 'text-orange-700 dark:text-orange-300',
    avatarBorder: 'border-orange-300 dark:border-orange-700',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
    progressBar: 'bg-orange-500 dark:bg-orange-400',
    actionText: 'text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300',
    headerGradient: 'from-orange-500/10 via-orange-500/5 to-transparent dark:from-orange-500/20 dark:via-orange-500/10 dark:to-transparent',
    swatchBg: 'bg-orange-500'
  },
  {
    id: 'cyan',
    name: 'Biru Cyan',
    bgLight: 'bg-cyan-50',
    bgDark: 'dark:bg-cyan-950/40',
    textLight: 'text-cyan-700',
    textDark: 'dark:text-cyan-300',
    borderLight: 'border-cyan-200',
    borderDark: 'dark:border-cyan-800',
    topBorder: 'border-t-cyan-500',
    avatarBg: 'bg-cyan-100 dark:bg-cyan-950/80',
    avatarText: 'text-cyan-700 dark:text-cyan-300',
    avatarBorder: 'border-cyan-300 dark:border-cyan-700',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
    progressBar: 'bg-cyan-500 dark:bg-cyan-400',
    actionText: 'text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300',
    headerGradient: 'from-cyan-500/10 via-cyan-500/5 to-transparent dark:from-cyan-500/20 dark:via-cyan-500/10 dark:to-transparent',
    swatchBg: 'bg-cyan-500'
  }
];

/**
 * Get color theme by color ID, or compute a deterministic theme based on string seed (id or name)
 */
export function getEkskulTheme(colorId?: string, fallbackSeed: string = '', index: number = 0): EkskulColorTheme {
  if (colorId) {
    const found = EKSKUL_COLOR_THEMES.find(t => t.id === colorId);
    if (found) return found;
  }

  // Deterministic hash based on string seed + index
  let hash = index;
  const str = (fallbackSeed || '').trim().toLowerCase();
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % EKSKUL_COLOR_THEMES.length;
  }
  return EKSKUL_COLOR_THEMES[Math.abs(hash) % EKSKUL_COLOR_THEMES.length];
}
