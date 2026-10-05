import { format } from "date-fns";

/**
 * Format nomor pesanan standar CD-YYMMDD-XXXX
 */
export function formatOrderNo(prefix: string, date: Date, seq: number): string {
  const datePart = format(date, "yyMMdd");
  const seqPart = String(seq).padStart(4, "0");
  return `${prefix}-${datePart}-${seqPart}`;
}

/**
 * Format nomor antrean (e.g. #01 atau 1)
 */
export function formatQueueNo(queueNo: number): string {
  return `#${String(queueNo).padStart(2, "0")}`;
}
