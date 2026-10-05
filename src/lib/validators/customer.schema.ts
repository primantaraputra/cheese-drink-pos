import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(2, "Nama pelanggan minimal 2 karakter").max(80, "Nama pelanggan maksimal 80 karakter"),
  phone: z
    .string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, "Format nomor telepon tidak valid (contoh: 08123456789)")
    .nullable()
    .optional()
    .or(z.literal("")),
  notes: z.string().nullable().optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
