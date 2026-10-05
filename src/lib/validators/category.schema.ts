import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2, "Nama kategori minimal 2 karakter").max(50, "Nama kategori maksimal 50 karakter"),
  type: z.enum(["food", "drink", "other"], {
    errorMap: () => ({ message: "Pilih tipe kategori yang valid (Makanan, Minuman, atau Lainnya)" }),
  }),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
