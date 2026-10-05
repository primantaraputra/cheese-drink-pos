import { format, parseISO, isValid } from "date-fns";
import { id } from "date-fns/locale";

/**
 * Format tanggal dalam Bahasa Indonesia dengan pattern opsional (default: dd MMMM yyyy)
 */
export function formatDate(
  date: string | Date | null | undefined,
  pattern: string = "dd MMMM yyyy"
): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "-";
  return format(d, pattern, { locale: id });
}

/**
 * Format tanggal pendek (e.g. 02/05/2026)
 */
export function formatShortDate(date: string | Date | null | undefined): string {
  return formatDate(date, "dd/MM/yyyy");
}

/**
 * Format tanggal dan waktu (e.g. 02 Mei 2026, 14:30)
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, "dd MMM yyyy, HH:mm");
}

/**
 * Format waktu saja (e.g. 14:30 WIB)
 */
export function formatTime(date: string | Date | null | undefined): string {
  return formatDate(date, "HH:mm 'WIB'");
}

/**
 * Mendapatkan string tanggal hari ini dalam format YYYY-MM-DD
 */
export function getTodayDateString(): string {
  return format(new Date(), "yyyy-MM-dd");
}
