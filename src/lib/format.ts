/**
 * Format number into Indonesian Rupiah (IDR).
 * Example: 64000 -> "Rp 64.000"
 */
export function formatRupiah(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || amount === '') return 'Rp 0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'Rp 0';
  return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
}
