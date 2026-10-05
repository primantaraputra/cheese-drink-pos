"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { createUserSchema, type CreateUserFormData } from "@/lib/validators/user.schema";
import type { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getUsersListAction(): Promise<Profile[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

export async function createUserAction(formData: CreateUserFormData) {
  const parsed = createUserSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Data tidak valid" };
  }

  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.data.full_name,
        role: parsed.data.role,
        phone: parsed.data.phone || null,
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        return { ok: false, error: "Email tersebut sudah terdaftar." };
      }
      return { ok: false, error: error.message };
    }

    revalidatePath("/users");
    return { ok: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat pengguna baru.";
    return { ok: false, error: message };
  }
}

export async function toggleUserStatusAction(userId: string, is_active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/users");
  return { ok: true };
}
