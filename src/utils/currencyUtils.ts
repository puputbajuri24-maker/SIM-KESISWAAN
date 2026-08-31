/**
 * Utilities for Currency & Indonesian Financial Formatting
 */

export const formatRupiah = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
};

export const parseRupiahInput = (value: string): number => {
  const clean = value.replace(/[^0-9]/g, '');
  return clean ? parseInt(clean, 10) : 0;
};

const SATUAN = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

export const terbilang = (n: number): string => {
  n = Math.floor(Math.abs(n));
  if (n === 0) return 'Nol Rupiah';

  const convert = (num: number): string => {
    if (num < 12) return SATUAN[num];
    if (num < 20) return convert(num - 10) + ' Belas';
    if (num < 100) return convert(Math.floor(num / 10)) + ' Puluh ' + convert(num % 10);
    if (num < 200) return 'Seratus ' + convert(num - 100);
    if (num < 1000) return convert(Math.floor(num / 100)) + ' Ratus ' + convert(num % 100);
    if (num < 2000) return 'Seribu ' + convert(num - 100);
    if (num < 1000000) return convert(Math.floor(num / 1000)) + ' Ribu ' + convert(num % 1000);
    if (num < 1000000000) return convert(Math.floor(num / 1000000)) + ' Juta ' + convert(num % 1000000);
    if (num < 1000000000000) return convert(Math.floor(num / 1000000000)) + ' Miliar ' + convert(num % 1000000000);
    return convert(Math.floor(num / 1000000000000)) + ' Triliun ' + convert(num % 1000000000000);
  };

  const result = convert(n).replace(/\s+/g, ' ').trim();
  return result + ' Rupiah';
};

export const generateReceiptNumber = (type: 'MASUK' | 'KELUAR', prefix = ''): string => {
  const now = new Date();
  const yearMonth = now.toISOString().slice(0, 7).replace('-', '');
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  const pfx = type === 'MASUK' ? 'BKM' : 'BKK';
  return prefix ? `${pfx}-${prefix}-${yearMonth}-${rand}` : `${pfx}-${yearMonth}-${rand}`;
};
