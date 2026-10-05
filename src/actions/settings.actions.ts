"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { storeSettingsSchema, ownerPinSchema, type StoreSettingsFormData } from "@/lib/validators/settings.schema";
import type { Database } from "@/types/database.types";

type StoreSettings = Database["public"]["Tables"]["store_settings"]["Row"];

import { MOCK_STORE_SETTINGS } from "@/lib/mock-data";

export async function getStoreSettingsAction(): Promise<StoreSettings | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

    if (isDemo) {
      return MOCK_STORE_SETTINGS;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return MOCK_STORE_SETTINGS;
    return data;
  } catch {
    return MOCK_STORE_SETTINGS;
  }
}

export async function updateStoreSettingsAction(formData: StoreSettingsFormData) {
  const parsed = storeSettingsSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Data tidak valid" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_settings")
    .update(parsed.data)
    .eq("id", 1)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true, data };
}

export async function updateOwnerVoidPinAction(newPin: string) {
  const parsed = ownerPinSchema.safeParse({ pin: newPin });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "PIN tidak valid" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_owner_void_pin", {
    p_new_pin: parsed.data.pin,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/store");
  return { ok: true };
}
