import { z } from "zod";

export const storeSettingsSchema = z.object({
  store_name: z.string().min(2, "Nama toko minimal 2 karakter"),
  tagline: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  receipt_header: z.string().nullable().optional(),
  receipt_footer: z.string().nullable().optional(),
  receipt_paper_width: z.coerce.number().refine((val) => val === 58 || val === 80, {
    message: "Lebar kertas struk harus 58mm atau 80mm",
  }),
  show_logo_on_receipt: z.boolean().default(true),
  tax_enabled: z.boolean().default(false),
  tax_percent: z.coerce.number().min(0).max(100).default(0),
  tax_inclusive: z.boolean().default(false),
  service_enabled: z.boolean().default(false),
  service_percent: z.coerce.number().min(0).max(100).default(0),
  rounding_unit: z.coerce.number().int().min(0).default(100),
  order_prefix: z.string().min(1).max(5).default("CD"),
  low_stock_default: z.coerce.number().int().min(1).default(10),
  require_owner_pin_for_void: z.boolean().default(true),
});

export const ownerPinSchema = z.object({
  pin: z.string().regex(/^\d{4,8}$/, "PIN harus berupa 4 hingga 8 digit angka"),
});

export type StoreSettingsFormData = z.infer<typeof storeSettingsSchema>;
