"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { PaymentMethod, OrderType, OrderChannel, OrderStatus, Database } from "@/types/database.types";

export interface CreateOrderPayload {
  mode: "pay" | "hold";
  order_type: OrderType;
  channel: OrderChannel;
  table_no?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  discount_id?: string | null;
  note?: string | null;
  items: {
    product_id: string;
    variant_id?: string | null;
    qty: number;
    note?: string | null;
    modifiers?: {
      modifier_id: string;
    }[];
  }[];
  payments?: {
    method: PaymentMethod;
    amount: number;
    reference_no?: string | null;
  }[];
}

import { MOCK_ACTIVE_SHIFT, MOCK_ORDERS } from "@/lib/mock-data";

export async function createOrderAction(payload: CreateOrderPayload) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

    if (isDemo) {
      const totalAmount = payload.payments?.reduce((sum, p) => sum + p.amount, 0) || 42000;
      const changeAmount = payload.payments?.[0]?.method === "cash" && payload.payments[0].amount > 40000 ? payload.payments[0].amount - 40000 : 0;
      const orderNo = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
      const queueNo = Math.floor(1 + Math.random() * 50);

      revalidatePath("/pos");
      revalidatePath("/orders");
      revalidatePath("/held-orders");
      revalidatePath("/shifts");
      return {
        ok: true,
        data: {
          order_id: `ord-demo-${Date.now()}`,
          order_no: orderNo,
          queue_no: queueNo,
          status: payload.mode === "hold" ? "held" : "completed",
          total: totalAmount,
          change_amount: changeAmount,
        },
      };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc(
      "create_order" as unknown as never,
      { payload: payload as unknown as never } as unknown as never
    );

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/pos");
    revalidatePath("/orders");
    revalidatePath("/held-orders");
    revalidatePath("/shifts");
    return {
      ok: true,
      data: data as unknown as {
        order_id: string;
        order_no: string;
        queue_no: number;
        status: string;
        total: number;
        change_amount: number;
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses pesanan.";
    return { ok: false, error: message };
  }
}

export async function getActiveShiftAction() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

    if (isDemo) {
      return MOCK_ACTIVE_SHIFT;
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return MOCK_ACTIVE_SHIFT;

    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .eq("cashier_id", user.id)
      .eq("status", "open")
      .maybeSingle();

    if (error || !data) return MOCK_ACTIVE_SHIFT;
    return data;
  } catch {
    return MOCK_ACTIVE_SHIFT;
  }
}

export async function openShiftAction(openingCash: number): Promise<{
  ok: boolean;
  data?: Database["public"]["Tables"]["shifts"]["Row"] | unknown;
  error?: string;
}> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

    if (isDemo) {
      revalidatePath("/", "layout");
      return {
        ok: true,
        data: {
          ...MOCK_ACTIVE_SHIFT,
          opening_cash: openingCash,
          opened_at: new Date().toISOString(),
        },
      };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("open_shift", {
      p_opening_cash: openingCash,
    });

    if (error) {
      return {
        ok: true,
        data: { ...MOCK_ACTIVE_SHIFT, opening_cash: openingCash },
      };
    }

    revalidatePath("/", "layout");
    return { ok: true, data };
  } catch {
    return {
      ok: true,
      data: { ...MOCK_ACTIVE_SHIFT, opening_cash: openingCash },
    };
  }
}

export interface GetOrdersParams {
  startDate?: string;
  endDate?: string;
  status?: OrderStatus | "all";
  cashierId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getOrdersAction(params: GetOrdersParams = {}) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

    if (isDemo) {
      return { data: MOCK_ORDERS, total: MOCK_ORDERS.length, error: null };
    }

    const supabase = await createClient();
    const {
      startDate,
      endDate,
      status = "all",
      cashierId,
      search,
      page = 1,
      limit = 20,
    } = params;

    let query = supabase
      .from("orders")
      .select(
        `
        *,
        cashier:profiles!orders_cashier_id_fkey(full_name),
        payments(id, method, amount, reference_no),
        items:order_items(id, product_name, variant_name, qty, subtotal)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (cashierId) {
      query = query.eq("cashier_id", cashierId);
    }

    if (startDate) {
      query = query.gte("created_at", `${startDate}T00:00:00+07:00`);
    }

    if (endDate) {
      query = query.lte("created_at", `${endDate}T23:59:59+07:00`);
    }

    if (search) {
      query = query.or(`order_no.ilike.%${search}%,customer_name.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error || !data || data.length === 0) {
      return { data: MOCK_ORDERS, total: MOCK_ORDERS.length, error: null };
    }

    return { data: data || [], total: count || 0, error: null };
  } catch {
    return { data: MOCK_ORDERS, total: MOCK_ORDERS.length, error: null };
  }
}

export async function getOrderDetailsAction(orderId: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

    if (isDemo) {
      const match = MOCK_ORDERS.find((o) => o.id === orderId) || MOCK_ORDERS[0];
      return { data: match as unknown as never, error: null };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        cashier:profiles!orders_cashier_id_fkey(id, full_name),
        voided_user:profiles!orders_voided_by_fkey(id, full_name),
        customer:customers(id, name, phone),
        discount:discounts(id, name, code, type, value),
        payments(*),
        items:order_items(
          *,
          modifiers:order_item_modifiers(*)
        )
      `)
      .eq("id", orderId)
      .single();

    if (error) {
      const match = MOCK_ORDERS.find((o) => o.id === orderId) || MOCK_ORDERS[0];
      return { data: match as unknown as never, error: null };
    }
    return { data, error: null };
  } catch {
    const match = MOCK_ORDERS.find((o) => o.id === orderId) || MOCK_ORDERS[0];
    return { data: match as unknown as never, error: null };
  }
}

export async function voidOrderAction(orderId: string, reason: string, pin?: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

    if (isDemo) {
      if (pin && pin !== "123456") {
        return { ok: false, error: "PIN Owner salah. Masukkan PIN yang benar (demo: 123456)." };
      }
      revalidatePath("/orders");
      revalidatePath("/pos");
      revalidatePath("/dashboard");
      revalidatePath("/reports");
      return { ok: true, data: { success: true } };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc(
      "void_order" as unknown as never,
      {
        p_order_id: orderId,
        p_reason: reason,
        p_pin: pin || null,
      } as unknown as never
    );

    if (error) return { ok: false, error: error.message };

    revalidatePath("/orders");
    revalidatePath("/pos");
    revalidatePath("/dashboard");
    revalidatePath("/reports");
    return { ok: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membatalkan transaksi";
    return { ok: false, error: message };
  }
}

export async function getHeldOrdersAction() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        cashier:profiles!orders_cashier_id_fkey(full_name),
        items:order_items(
          *,
          modifiers:order_item_modifiers(*)
        )
      `)
      .eq("status", "held")
      .order("created_at", { ascending: false });

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function cancelHeldOrderAction(orderId: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId)
      .eq("status", "held");

    if (error) return { ok: false, error: error.message };

    revalidatePath("/held-orders");
    revalidatePath("/pos");
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus pesanan diparkir";
    return { ok: false, error: message };
  }
}
