"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CreateExpensePayload {
  category: string;
  amount: number;
  description?: string;
  paid_from_drawer: boolean;
  receipt_url?: string;
}

export async function getExpensesAction(params: {
  startDate?: string;
  endDate?: string;
  category?: string;
} = {}) {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("expenses")
      .select(`
        *,
        creator:profiles(full_name)
      `)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (params.startDate) {
      query = query.gte("expense_date", params.startDate);
    }
    if (params.endDate) {
      query = query.lte("expense_date", params.endDate);
    }
    if (params.category && params.category !== "all") {
      query = query.eq("category", params.category);
    }

    const { data, error } = await query;
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function createExpenseAction(payload: CreateExpensePayload) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Tidak terotentikasi" };

    if (payload.amount <= 0) {
      return { ok: false, error: "Nominal pengeluaran harus lebih besar dari 0" };
    }

    let shiftId: string | null = null;
    if (payload.paid_from_drawer) {
      // Find active shift of current user
      const { data: shift } = await supabase
        .from("shifts")
        .select("id")
        .eq("cashier_id", user.id)
        .eq("status", "open")
        .maybeSingle();

      if (!shift) {
        return {
          ok: false,
          error: "Tidak ada shift kasir yang sedang aktif. Buka shift terlebih dahulu jika ingin memotong kas laci.",
        };
      }
      shiftId = shift.id;
    }

    const { data, error } = await supabase
      .from("expenses")
      .insert({
        category: payload.category,
        amount: payload.amount,
        description: payload.description || null,
        paid_from_drawer: payload.paid_from_drawer,
        shift_id: shiftId,
        receipt_url: payload.receipt_url || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    revalidatePath("/reports");
    revalidatePath("/shifts");
    return { ok: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mencatat pengeluaran";
    return { ok: false, error: message };
  }
}

export async function deleteExpenseAction(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    revalidatePath("/reports");
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus pengeluaran";
    return { ok: false, error: message };
  }
}
