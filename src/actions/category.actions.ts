"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { categorySchema, type CategoryFormData } from "@/lib/validators/category.schema";
import type { Database } from "@/types/database.types";

type Category = Database["public"]["Tables"]["categories"]["Row"];

import { MOCK_CATEGORIES } from "@/lib/mock-data";

export async function getCategoriesAction(): Promise<Category[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

    if (isDemo) {
      return MOCK_CATEGORIES;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error || !data || data.length === 0) {
      return MOCK_CATEGORIES;
    }
    return data || [];
  } catch {
    return MOCK_CATEGORIES;
  }
}

export async function createCategoryAction(formData: CategoryFormData) {
  const parsed = categorySchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Data tidak valid" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Kategori dengan nama tersebut sudah ada." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/categories");
  revalidatePath("/pos");
  return { ok: true, data };
}

export async function updateCategoryAction(id: string, formData: Partial<CategoryFormData>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .update(formData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/categories");
  revalidatePath("/pos");
  return { ok: true, data };
}

export async function deleteCategoryAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return {
        ok: false,
        error: "Kategori tidak dapat dihapus karena masih digunakan oleh produk menu.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/categories");
  revalidatePath("/pos");
  return { ok: true };
}
