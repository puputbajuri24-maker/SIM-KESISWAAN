import { PrintSignatory, PrintSignatureConfig, SchoolSetting } from '../types';

/**
 * Default preset factory for Indonesian Madrasah / School documents.
 * Standard roles:
 * - Left (Slot 0): Pembuat / Pelapor / Guru BK / Pembina / Wali Kelas
 * - Center (Slot 1): Menyetujui / Waka Kesiswaan
 * - Right (Slot 2): Mengetahui / Kepala Madrasah
 */
export const createDefaultSignatories = (
  school?: Partial<SchoolSetting>,
  context?: {
    documentCategory?: string;
    reporterRole?: string;
    reporterName?: string;
    reporterNip?: string;
    customCity?: string;
    defaultSlotsCount?: 1 | 2 | 3;
    forceResetToDefault?: boolean;
  }
): PrintSignatory[] => {
  // If school has locked signatures and not forced to reset, return the user's locked signatories
  if (!context?.forceResetToDefault && school?.defaultSignaturesConfig?.signatories && school.defaultSignaturesConfig.signatories.length > 0) {
    // If context provided custom reporter (like specific Guru BK or Pembina Ekskul) and slot 0 isn't locked to specific teacher, adapt slot 0 prefix/title
    return school.defaultSignaturesConfig.signatories.map(sig => {
      if (sig.order === 0 && context?.reporterRole && (!school.isSignatureLocked && !school.defaultSignaturesConfig?.isLockedByUser)) {
        return {
          ...sig,
          roleTitle: context.reporterRole,
          name: context.reporterName || sig.name,
          nipOrIdentifier: context.reporterNip || sig.nipOrIdentifier
        };
      }
      return sig;
    });
  }

  const city = context?.customCity || school?.defaultCity || 'Bula';
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const principalName = school?.principalName || 'Zakaria, S.Pd.I., M.Pd';
  const principalNip = school?.principalNip || '197808102005011007';

  const wakaName = school?.wakaKesiswaanName || school?.wakaName || 'Puput Eka Bajuri, S.Pd., M.Or';
  const wakaNip = school?.wakaNip || '198806082023211020';

  const reporterRole = context?.reporterRole || 'Koordinator Guru BK / Pembina';
  const reporterName = context?.reporterName || 'Guru BK / Pembina';
  const reporterNip = context?.reporterNip || '-';

  return [
    {
      id: 'sig-left',
      order: 0,
      alignment: 'left',
      prefix: '',
      roleTitle: reporterRole,
      name: reporterName,
      nipOrIdentifier: reporterNip,
      customSubtitle: 'Pamong Pembinaan',
      isActive: true
    },
    {
      id: 'sig-center',
      order: 1,
      alignment: 'center',
      prefix: 'Menyetujui,',
      roleTitle: 'Waka Bidang Kesiswaan',
      name: wakaName,
      nipOrIdentifier: wakaNip,
      customSubtitle: 'Pimpinan Kesiswaan',
      isActive: true
    },
    {
      id: 'sig-right',
      order: 2,
      alignment: 'right',
      prefix: `${city}, ${currentDate}`,
      roleTitle: 'Kepala Madrasah',
      name: principalName,
      nipOrIdentifier: principalNip,
      customSubtitle: 'Penanggung Jawab Lembaga',
      isActive: true
    }
  ];
};

/**
 * Swap or move signatory slot with arrow keys (left or right)
 */
export const moveSignatoryOrder = (
  signatories: PrintSignatory[],
  indexToMove: number,
  direction: 'left' | 'right'
): PrintSignatory[] => {
  const sorted = [...signatories].sort((a, b) => a.order - b.order);
  const targetIndex = direction === 'left' ? indexToMove - 1 : indexToMove + 1;

  if (targetIndex < 0 || targetIndex >= sorted.length) {
    return signatories; // Cannot move beyond boundaries
  }

  // Clone items to avoid mutating state directly
  const cloned = sorted.map(item => ({ ...item }));

  const currentItem = cloned[indexToMove];
  const targetItem = cloned[targetIndex];

  // Swap order
  const currentOrder = currentItem.order;
  currentItem.order = targetItem.order;
  targetItem.order = currentOrder;

  // Re-sort according to new orders
  const updatedSorted = cloned.sort((a, b) => a.order - b.order);

  // Normalize order indices to 0, 1, 2...
  return updatedSorted.map((item, idx) => ({
    ...item,
    order: idx,
    alignment: idx === 0 ? 'left' : idx === 1 ? 'center' : 'right'
  }));
};

/**
 * Filter signatories by active count (1, 2, or 3)
 */
export const getActiveSignatoriesByCount = (
  signatories: PrintSignatory[],
  count: 1 | 2 | 3
): PrintSignatory[] => {
  const sorted = [...signatories].sort((a, b) => a.order - b.order);

  if (count === 1) {
    // Return only the primary authority (usually the rightmost / highest official e.g. Kepala Madrasah)
    return [sorted[sorted.length - 1] || sorted[0]];
  }

  if (count === 2) {
    // Return two parties (e.g. Left and Right, or Pembuat and Mengetahui)
    if (sorted.length >= 3) {
      return [sorted[0], sorted[2]];
    }
    return sorted.slice(0, 2);
  }

  // All 3
  return sorted.slice(0, 3);
};
