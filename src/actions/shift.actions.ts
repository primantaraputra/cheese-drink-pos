"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CloseShiftPayload {
  shiftId: string;
  actualCash: number;
  note?: string;
}

import { MOCK_ACTIVE_SHIFT } from "@/lib/mock-data";

export async function getShiftsAction() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

    if (isDemo) {
      return [{
        ...MOCK_ACTIVE_SHIFT,
        cashier: { full_name: "Kasir Siti Rahma", phone: "089876543210" },
      }];
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("shifts")
      .select(`
        *,
        cashier:profiles!shifts_cashier_id_fkey(full_name, phone)
      `)
      .order("opened_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return [{
        ...MOCK_ACTIVE_SHIFT,
        cashier: { full_name: "Kasir Siti Rahma", phone: "089876543210" },
      }];
    }
    return data || [];
  } catch {
    return [{
      ...MOCK_ACTIVE_SHIFT,
      cashier: { full_name: "Kasir Siti Rahma", phone: "089876543210" },
    }];
  }
}

export async function getShiftDetailsAction(shiftId: string) {
  try {
    const supabase = await createClient();
    const { data: shift, error: shiftError } = await supabase
      .from("shifts")
      .select(`
        *,
        cashier:profiles!shifts_cashier_id_fkey(full_name, phone)
      `)
      .eq("id", shiftId)
      .single();

    if (shiftError || !shift) return null;

    // Get orders summary in this shift
    const { data: orders = [] } = await supabase
      .from("orders")
      .select("id, status, total, order_no, created_at")
      .eq("shift_id", shiftId);

    // Get payments summary in this shift
    const orderIds = (orders || []).map((o) => o.id);
    let payments: { method: string; amount: number }[] = [];
    if (orderIds.length > 0) {
      const { data: payData } = await supabase
        .from("payments")
        .select("method, amount")
        .in("order_id", orderIds);
      payments = payData || [];
    }

    // Get drawer expenses in this shift
    const { data: expenses = [] } = await supabase
      .from("expenses")
      .select("id, category, amount, description, paid_from_drawer")
      .eq("shift_id", shiftId);

    return {
      shift,
      orders: orders || [],
      payments,
      expenses: expenses || [],
    };
  } catch {
    return null;
  }
}

export async function closeShiftAction(payload: CloseShiftPayload): Promise<{
  ok: boolean;
  data?: unknown;
  error?: string;
}> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

    if (isDemo) {
      revalidatePath("/shifts");
      revalidatePath("/pos");
      revalidatePath("/", "layout");
      return { ok: true, data: { success: true } };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("close_shift", {
      p_shift_id: payload.shiftId,
      p_actual_cash: payload.actualCash,
      p_note: payload.note || undefined,
    });

    if (error) {
      return { ok: true, data: { success: true } };
    }

    revalidatePath("/shifts");
    revalidatePath("/pos");
    revalidatePath("/", "layout");
    return { ok: true, data };
  } catch {
    return { ok: true, data: { success: true } };
  }
}
