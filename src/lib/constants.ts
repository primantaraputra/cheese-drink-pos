export const APP_NAME = "Cheese Drink POS";
export const DEFAULT_TIMEZONE = "Asia/Jakarta";

export const ORDER_TYPES = [
  { value: "dine_in", label: "Makan di Tempat" },
  { value: "take_away", label: "Bawa Pulang" },
  { value: "delivery", label: "Delivery" },
] as const;

export const ORDER_CHANNELS = [
  { value: "walk_in", label: "Langsung (Walk-in)" },
  { value: "gofood", label: "GoFood" },
  { value: "grabfood", label: "GrabFood" },
  { value: "shopeefood", label: "ShopeeFood" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "other", label: "Lainnya" },
] as const;

export const PAYMENT_METHODS = [
  { value: "cash", label: "Tunai", icon: "Banknote" },
  { value: "qris", label: "QRIS", icon: "QrCode" },
] as const;

export const EXPENSE_CATEGORIES = [
  "Bahan Baku",
  "Gas",
  "Listrik",
  "Gaji",
  "Kemasan",
  "Operasional",
  "Lain-lain",
] as const;

export const STOCK_MOVEMENT_TYPES = [
  { value: "purchase", label: "Barang Masuk (Beli)" },
  { value: "sale", label: "Penjualan" },
  { value: "sale_void", label: "Pembatalan Penjualan" },
  { value: "adjustment", label: "Penyesuaian (Opname)" },
  { value: "waste", label: "Rusak / Basi" },
  { value: "opening", label: "Stok Awal" },
] as const;

export const QUICK_CASH_AMOUNTS = [
  10000, 20000, 50000, 100000
];
