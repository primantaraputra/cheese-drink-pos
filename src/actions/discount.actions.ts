"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { discountSchema, type DiscountFormData } from "@/lib/validators/discount.schema";
import type { Database } from "@/types/database.types";

type Discount = Database["public"]["Tables"]["discounts"]["Row"];

import { MOCK_DISCOUNTS } from "@/lib/mock-data";

export async function getDiscountsAction(onlyActive = false): Promise<Discount[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

    if (isDemo) {
      return onlyActive ? MOCK_DISCOUNTS.filter((d) => d.is_active) : MOCK_DISCOUNTS;
    }

    const supabase = await createClient();
    let query = supabase.from("discounts").select("*").order("created_at", { ascending: false });

    if (onlyActive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return onlyActive ? MOCK_DISCOUNTS.filter((d) => d.is_active) : MOCK_DISCOUNTS;
    }
    return data || [];
  } catch {
    return onlyActive ? MOCK_DISCOUNTS.filter((d) => d.is_active) : MOCK_DISCOUNTS;
  }
}

export async function createDiscountAction(formData: DiscountFormData) {
  const parsed = discountSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Data tidak valid" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("discounts")
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Kode diskon tersebut sudah digunakan." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/discounts");
  revalidatePath("/pos");
  return { ok: true, data };
}

export async function updateDiscountAction(id: string, formData: Partial<DiscountFormData>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("discounts")
    .update(formData)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/discounts");
  revalidatePath("/pos");
  return { ok: true, data };
}

export async function toggleDiscountStatusAction(id: string, is_active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("discounts").update({ is_active }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/discounts");
  revalidatePath("/pos");
  return { ok: true };
}

export async function deleteDiscountAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("discounts").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/discounts");
  revalidatePath("/pos");
  return { ok: true };
}
