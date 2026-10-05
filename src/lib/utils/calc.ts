export interface OrderItemCalcInput {
  unitPrice: number;
  modifiersTotal: number;
  qty: number;
}

export interface DiscountCalcInput {
  type: "percent" | "fixed";
  value: number;
  maxDiscount?: number | null;
  minPurchase?: number;
}

export interface StoreTaxServiceSettings {
  taxEnabled: boolean;
  taxPercent: number;
  taxInclusive: boolean;
  serviceEnabled: boolean;
  servicePercent: number;
  roundingUnit: number;
}

export interface OrderCalculationResult {
  subtotal: number;
  discountAmount: number;
  dpp: number;
  serviceAmount: number;
  taxAmount: number;
  totalBeforeRound: number;
  roundingAmount: number;
  total: number;
}

/**
 * Pembulatan Round-Half-Up ke bilangan bulat terdekat
 */
export function roundHalfUp(num: number): number {
  return Math.round(num);
}

/**
 * Pembulatan ke kelipatan unit terdekat (misal rounding_unit = 100)
 */
export function roundToNearest(value: number, unit: number): number {
  if (unit <= 0) return Math.round(value);
  return Math.round(value / unit) * unit;
}

/**
 * Menghitung line total item pesanan
 */
export function calculateLineTotal(unitPrice: number, modifiersTotal: number, qty: number): number {
  return Math.max(0, (unitPrice + modifiersTotal) * Math.max(1, qty));
}

/**
 * Menghitung potongan diskon
 */
export function calculateDiscount(subtotal: number, discount?: DiscountCalcInput | null): number {
  if (!discount || subtotal <= 0) return 0;
  if (discount.minPurchase && subtotal < discount.minPurchase) return 0;

  if (discount.type === "percent") {
    const rawDiscount = (subtotal * discount.value) / 100;
    const capped = discount.maxDiscount ? Math.min(rawDiscount, discount.maxDiscount) : rawDiscount;
    return roundHalfUp(Math.min(capped, subtotal));
  } else {
    return roundHalfUp(Math.min(discount.value, subtotal));
  }
}

/**
 * Menghitung rincian total transaksi (subtotal, diskon, service, pajak, pembulatan, total)
 */
export function calculateOrderTotals(
  items: OrderItemCalcInput[],
  settings: StoreTaxServiceSettings,
  discount?: DiscountCalcInput | null
): OrderCalculationResult {
  const subtotal = items.reduce(
    (sum, item) => sum + calculateLineTotal(item.unitPrice, item.modifiersTotal, item.qty),
    0
  );

  const discountAmount = calculateDiscount(subtotal, discount);
  const dpp = Math.max(0, subtotal - discountAmount);

  const serviceAmount = settings.serviceEnabled
    ? roundHalfUp((dpp * settings.servicePercent) / 100)
    : 0;

  let taxAmount = 0;
  let totalBeforeRound = dpp + serviceAmount;

  if (settings.taxEnabled) {
    if (settings.taxInclusive) {
      taxAmount = roundHalfUp((totalBeforeRound * settings.taxPercent) / (100 + settings.taxPercent));
    } else {
      taxAmount = roundHalfUp(((dpp + serviceAmount) * settings.taxPercent) / 100);
      totalBeforeRound += taxAmount;
    }
  }

  const roundedTotal = settings.roundingUnit > 0
    ? roundToNearest(totalBeforeRound, settings.roundingUnit)
    : totalBeforeRound;

  const roundingAmount = roundedTotal - totalBeforeRound;
  const total = Math.max(0, totalBeforeRound + roundingAmount);

  return {
    subtotal,
    discountAmount,
    dpp,
    serviceAmount,
    taxAmount,
    totalBeforeRound,
    roundingAmount,
    total,
  };
}

/**
 * Menghitung kembalian uang tunai pada pembayaran tunggal atau campuran (split payment)
 */
export function calculateChange(
  total: number,
  cashPaid: number,
  nonCashPaid: number = 0
): { changeAmount: number; isUnderpaid: boolean; remainingToPay: number } {
  const totalPaid = cashPaid + nonCashPaid;
  const remainingToPay = Math.max(0, total - totalPaid);
  const isUnderpaid = totalPaid < total;

  // Kembalian hanya diberikan dari porsi tunai yang melebihi sisa tagihan setelah non-tunai
  const cashNeeded = Math.max(0, total - nonCashPaid);
  const changeAmount = Math.max(0, cashPaid - cashNeeded);

  return {
    changeAmount,
    isUnderpaid,
    remainingToPay,
  };
}
