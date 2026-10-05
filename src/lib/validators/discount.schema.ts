import { z } from "zod";

export const discountSchema = z.object({
  name: z.string().min(2, "Nama diskon minimal 2 karakter").max(60, "Nama diskon maksimal 60 karakter"),
  code: z.string().nullable().optional(),
  type: z.enum(["percent", "fixed"], {
    errorMap: () => ({ message: "Pilih tipe diskon yang valid (Persen atau Potongan Tetap)" }),
  }),
  value: z.coerce.number().positive("Nilai diskon harus lebih besar dari 0"),
  max_discount: z.coerce.number().int().positive().nullable().optional(),
  min_purchase: z.coerce.number().int().min(0).default(0),
  start_at: z.string().nullable().optional(),
  end_at: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});

export type DiscountFormData = z.infer<typeof discountSchema>;
