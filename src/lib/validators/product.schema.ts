import { z } from "zod";

export const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nama varian wajib diisi"),
  price: z.coerce.number().int().min(0, "Harga varian tidak boleh negatif"),
  cost_price: z.coerce.number().int().min(0).default(0),
  sku: z.string().nullable().optional(),
  is_default: z.boolean().default(false),
});

export const productSchema = z.object({
  name: z.string().min(2, "Nama produk minimal 2 karakter").max(80, "Nama produk maksimal 80 karakter"),
  category_id: z.string().min(1, "Pilih kategori yang valid"),
  sku: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  base_price: z.coerce.number().int().min(0, "Harga dasar tidak boleh negatif"),
  cost_price: z.coerce.number().int().min(0, "HPP tidak boleh negatif").default(0),
  track_stock: z.boolean().default(false),
  stock_qty: z.coerce.number().min(0).default(0),
  low_stock_threshold: z.coerce.number().min(0).nullable().optional(),
  is_available: z.boolean().default(true),
  is_active: z.boolean().default(true),
  is_favorite: z.boolean().default(false),
  sort_order: z.coerce.number().int().default(0),
  variants: z.array(variantSchema).default([]),
  modifier_group_ids: z.array(z.string()).default([]),
});

export type ProductFormData = z.infer<typeof productSchema>;
export type VariantFormData = z.infer<typeof variantSchema>;
