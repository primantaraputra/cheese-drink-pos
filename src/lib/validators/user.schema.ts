import { z } from "zod";

export const createUserSchema = z.object({
  full_name: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  phone: z.string().nullable().optional(),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  role: z.enum(["owner", "cashier"]).default("cashier"),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
