import { describe, it, expect } from "vitest";
import {
  calculateLineTotal,
  calculateDiscount,
  calculateOrderTotals,
  calculateChange,
  roundToNearest,
} from "../../src/lib/utils/calc";
import { formatIDR, parseIDR, formatNumber } from "../../src/lib/utils/currency";
import { formatDate } from "../../src/lib/utils/date";

describe("Calculation Business Logic (Cheese Drink POS)", () => {
  it("calculates line total with unit price and modifier price deltas", () => {
    // Dimsum Siomay (15.000) + Saus Mentai (2.000) * 2 qty = 34.000
    const lineTotal = calculateLineTotal(15000, 2000, 2);
    expect(lineTotal).toBe(34000);
  });

  it("calculates percent discount with max discount limit", () => {
    // Subtotal 100.000, discount 20%, max 15.000 => 15.000
    const discount = calculateDiscount(100000, {
      type: "percent",
      value: 20,
      maxDiscount: 15000,
    });
    expect(discount).toBe(15000);
  });

  it("calculates fixed discount capped at subtotal", () => {
    // Subtotal 10.000, discount fixed 15.000 => 10.000
    const discount = calculateDiscount(10000, {
      type: "fixed",
      value: 15000,
    });
    expect(discount).toBe(10000);
  });

  it("calculates rounding to nearest 100 (round-half-up)", () => {
    expect(roundToNearest(10049, 100)).toBe(10000);
    expect(roundToNearest(10050, 100)).toBe(10100);
    expect(roundToNearest(10099, 100)).toBe(10100);
  });

  it("calculates order totals with discount, service, tax exclusive, and rounding", () => {
    // 2 items: 25.000 each = 50.000 subtotal
    // Discount 10% = 5.000 -> DPP = 45.000
    // Service 5% = 2.250
    // Tax exclusive 10% of (45.000 + 2.250 = 47.250) = 4.725
    // Total before round = 47.250 + 4.725 = 51.975
    // Rounding unit 100 => 52.000 (roundingAmount = +25)
    const items = [
      { unitPrice: 25000, modifiersTotal: 0, qty: 2 },
    ];
    const settings = {
      taxEnabled: true,
      taxPercent: 10,
      taxInclusive: false,
      serviceEnabled: true,
      servicePercent: 5,
      roundingUnit: 100,
    };
    const discount = {
      type: "percent" as const,
      value: 10,
    };

    const result = calculateOrderTotals(items, settings, discount);
    expect(result.subtotal).toBe(50000);
    expect(result.discountAmount).toBe(5000);
    expect(result.dpp).toBe(45000);
    expect(result.serviceAmount).toBe(2250);
    expect(result.taxAmount).toBe(4725);
    expect(result.totalBeforeRound).toBe(51975);
    expect(result.roundingAmount).toBe(25);
    expect(result.total).toBe(52000);
  });

  it("calculates order totals with tax inclusive", () => {
    // 1 item: 110.000
    // Tax inclusive 10%: DPP = 110.000 / 1.1 = 100.000, Tax = 10.000
    const items = [{ unitPrice: 110000, modifiersTotal: 0, qty: 1 }];
    const settings = {
      taxEnabled: true,
      taxPercent: 10,
      taxInclusive: true,
      serviceEnabled: false,
      servicePercent: 0,
      roundingUnit: 100,
    };

    const result = calculateOrderTotals(items, settings);
    expect(result.subtotal).toBe(110000);
    expect(result.taxAmount).toBe(10000);
    expect(result.total).toBe(110000);
  });

  it("calculates cash change correctly including split payment", () => {
    // Total 50.000, QRIS paid 20.000, Cash paid 50.000
    // Remaining to pay after QRIS = 30.000
    // Cash change = 50.000 - 30.000 = 20.000
    const result = calculateChange(50000, 50000, 20000);
    expect(result.changeAmount).toBe(20000);
    expect(result.isUnderpaid).toBe(false);
    expect(result.remainingToPay).toBe(0);
  });

  it("detects underpaid cash change accurately", () => {
    const result = calculateChange(50000, 20000);
    expect(result.isUnderpaid).toBe(true);
    expect(result.remainingToPay).toBe(30000);
    expect(result.changeAmount).toBe(0);
  });
});

describe("Currency & Date Formatting Helpers", () => {
  it("formats IDR without decimals and parses correctly", () => {
    expect(formatIDR(25000)).toMatch(/Rp\s*25\.000/);
    expect(formatNumber(25000)).toBe("25.000");
    expect(parseIDR("Rp 25.000")).toBe(25000);
    expect(parseIDR("150.000")).toBe(150000);
  });

  it("formats Indonesian dates with fallback", () => {
    expect(formatDate(null)).toBe("-");
    const formatted = formatDate("2026-10-02T10:00:00Z", "dd/MM/yyyy");
    expect(formatted).toBe("02/10/2026");
  });
});
