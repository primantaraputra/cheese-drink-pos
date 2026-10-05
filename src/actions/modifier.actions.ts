"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  modifierGroupSchema,
  modifierItemSchema,
  type ModifierGroupFormData,
  type ModifierItemFormData,
} from "@/lib/validators/modifier.schema";
import type { Database } from "@/types/database.types";

type ModifierGroup = Database["public"]["Tables"]["modifier_groups"]["Row"] & {
  modifiers: Database["public"]["Tables"]["modifiers"]["Row"][];
};

export async function getModifierGroupsAction(): Promise<ModifierGroup[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("modifier_groups")
      .select("*, modifiers(*)")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return (data as unknown as ModifierGroup[]) || [];
  } catch {
    return [];
  }
}

export async function createModifierGroupAction(formData: ModifierGroupFormData) {
  const parsed = modifierGroupSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Data tidak valid" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("modifier_groups")
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/modifiers");
  revalidatePath("/pos");
  return { ok: true, data };
}

export async function updateModifierGroupAction(id: string, formData: Partial<ModifierGroupFormData>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("modifier_groups")
    .update(formData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/modifiers");
  revalidatePath("/pos");
  return { ok: true, data };
}

export async function deleteModifierGroupAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("modifier_groups").delete().eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/modifiers");
  revalidatePath("/pos");
  return { ok: true };
}

export async function createModifierItemAction(formData: ModifierItemFormData) {
  const parsed = modifierItemSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Data tidak valid" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("modifiers")
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/modifiers");
  revalidatePath("/pos");
  return { ok: true, data };
}

export async function updateModifierItemAction(id: string, formData: Partial<ModifierItemFormData>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("modifiers")
    .update(formData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/modifiers");
  revalidatePath("/pos");
  return { ok: true, data };
}

export async function deleteModifierItemAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("modifiers").delete().eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/modifiers");
  revalidatePath("/pos");
  return { ok: true };
}
