import { z } from "zod";

export const modifierGroupSchema = z.object({
  name: z.string().min(2, "Nama grup minimal 2 karakter").max(60, "Nama grup maksimal 60 karakter"),
  selection: z.enum(["single", "multiple"]),
  is_required: z.boolean().default(false),
  min_select: z.coerce.number().int().min(0).default(0),
  max_select: z.coerce.number().int().positive().nullable().optional(),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

export const modifierItemSchema = z.object({
  group_id: z.string().uuid("ID grup tidak valid"),
  name: z.string().min(2, "Nama opsi minimal 2 karakter").max(60, "Nama opsi maksimal 60 karakter"),
  price_delta: z.coerce.number().int().min(0, "Tambahan harga tidak boleh negatif").default(0),
  cost_delta: z.coerce.number().int().min(0, "HPP tidak boleh negatif").default(0),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

export type ModifierGroupFormData = z.infer<typeof modifierGroupSchema>;
export type ModifierItemFormData = z.infer<typeof modifierItemSchema>;
