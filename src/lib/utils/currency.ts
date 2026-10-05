/**
 * Format angka ke mata uang Rupiah tanpa desimal (e.g. Rp 25.000)
 */
export function formatIDR(amount: number | string | null | undefined): string {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(numericAmount)) return "Rp 0";
  
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericAmount);
}

/**
 * Format angka dengan pemisah ribuan saja tanpa simbol Rp (e.g. 25.000)
 */
export function formatNumber(amount: number | string | null | undefined): string {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(numericAmount)) return "0";
  
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericAmount);
}

/**
 * Parse string berisi format mata uang/angka menjadi angka murni
 */
export function parseIDR(input: string): number {
  const clean = input.replace(/[^0-9-]/g, "");
  const num = parseInt(clean, 10);
  return isNaN(num) ? 0 : num;
}
