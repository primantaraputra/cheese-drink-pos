"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { UserRole, Database } from "@/types/database.types";

export interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function quickDemoLoginAction(
  role: "owner" | "cashier"
): Promise<ActionResult<{ role: UserRole }>> {
  const cookieStore = await cookies();
  cookieStore.set("demo_user", role, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  revalidatePath("/", "layout");
  return { ok: true, data: { role } };
}

export async function loginAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult<{ role: UserRole }>> {
  const identifier = ((formData.get("email") as string) || "").trim().toLowerCase();
  const password = ((formData.get("password") as string) || "").trim();

  if (!identifier || !password) {
    return { ok: false, error: "Username/Email dan kata sandi wajib diisi." };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

  // Demo Fallback Mode (Memungkinkan pengujian lokal tanpa database cloud)
  if (isDemo) {
    const isOwnerIdentifier =
      identifier === "owner" ||
      identifier === "admin" ||
      identifier.startsWith("owner@") ||
      identifier.startsWith("admin@") ||
      identifier.includes("owner") ||
      identifier.includes("admin");

    const isKasirIdentifier =
      identifier === "kasir" ||
      identifier === "cashier" ||
      identifier.startsWith("kasir@") ||
      identifier.startsWith("cashier@") ||
      identifier.includes("kasir") ||
      identifier.includes("cashier");

    const normalizedPassword = password.toLowerCase();
    const isOwnerPass =
      normalizedPassword === "password123!" ||
      normalizedPassword === "password123" ||
      normalizedPassword === "admin123" ||
      normalizedPassword === "admin" ||
      normalizedPassword === "owner" ||
      normalizedPassword === "123456";

    const isKasirPass =
      normalizedPassword === "kasir123" ||
      normalizedPassword === "kasir" ||
      normalizedPassword === "password123!" ||
      normalizedPassword === "password123" ||
      normalizedPassword === "123456" ||
      normalizedPassword === "000000";

    // Prioritaskan kasir jika username adalah kasir
    if (isKasirIdentifier || normalizedPassword === "kasir123" || normalizedPassword === "kasir") {
      const cookieStore = await cookies();
      cookieStore.set("demo_user", "cashier", {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });
      revalidatePath("/", "layout");
      return { ok: true, data: { role: "cashier" } };
    }

    if (isOwnerIdentifier || isOwnerPass) {
      const cookieStore = await cookies();
      cookieStore.set("demo_user", "owner", {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });
      revalidatePath("/", "layout");
      return { ok: true, data: { role: "owner" } };
    }

    // Default ke kasir jika user kasir mencoba variasi lain
    const cookieStore = await cookies();
    cookieStore.set("demo_user", "cashier", {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
    revalidatePath("/", "layout");
    return { ok: true, data: { role: "cashier" } };
  }

  // Real Supabase Auth Mode
  try {
    const supabase = await createClient();

    const emailToUse = identifier.includes("@")
      ? identifier
      : `${identifier}@cheesedrink.com`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    });

    if (error || !data.user) {
      return {
        ok: false,
        error: "Email atau kata sandi salah. Silakan periksa kembali.",
      };
    }

    // Ambil profil dan peran pengguna
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active, full_name")
      .eq("id", data.user.id)
      .maybeSingle<{ role: UserRole; is_active: boolean; full_name: string }>();

    if (profile && !profile.is_active) {
      await supabase.auth.signOut();
      return {
        ok: false,
        error: "Akun Anda telah dinonaktifkan. Silakan hubungi pemilik toko.",
      };
    }

    const role: UserRole = profile?.role || "cashier";

    revalidatePath("/", "layout");
    return { ok: true, data: { role } };
  } catch {
    return {
      ok: false,
      error: "Gagal menghubungkan ke server otentikasi Supabase. Periksa koneksi internet.",
    };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("demo_user");

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // ignore
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

export async function getCurrentUserProfile() {
  const cookieStore = await cookies();
  const demoRole = cookieStore.get("demo_user")?.value;

  if (demoRole === "owner") {
    return {
      id: "00000000-0000-0000-0000-000000000001",
      full_name: "Owner Cheese Drink",
      role: "owner" as UserRole,
      is_active: true,
      phone: "081234567890",
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  if (demoRole === "cashier") {
    return {
      id: "00000000-0000-0000-0000-000000000002",
      full_name: "Kasir Siti Rahma",
      role: "cashier" as UserRole,
      is_active: true,
      phone: "089876543210",
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle<Database["public"]["Tables"]["profiles"]["Row"]>();

    return (
      profile || {
        id: user.id,
        full_name: user.email?.split("@")[0] || "Staf",
        role: "cashier" as UserRole,
        is_active: true,
        phone: null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    );
  } catch {
    return null;
  }
}
