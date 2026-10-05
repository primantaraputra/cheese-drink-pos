"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { StockMovementType } from "@/types/database.types";

export interface StockMovementPayload {
  targetType: "product" | "ingredient";
  targetId: string;
  type: StockMovementType;
  qtyChange: number; // positive for in/purchase, negative for waste/reduction
  unitCost?: number;
  note?: string;
}

import { MOCK_PRODUCTS } from "@/lib/mock-data";

const MOCK_INGREDIENTS = [
  { id: "ing-1", name: "Daging Ayam Cincang", unit: "gram", stock_qty: 4500, min_stock: 1000, cost_per_unit: 45 },
  { id: "ing-2", name: "Udang Kupas Segar", unit: "gram", stock_qty: 2500, min_stock: 800, cost_per_unit: 80 },
  { id: "ing-3", name: "Keju Mozzarella Block", unit: "gram", stock_qty: 1800, min_stock: 500, cost_per_unit: 110 },
  { id: "ing-4", name: "Kulit Pangsit Dimsum", unit: "pcs", stock_qty: 320, min_stock: 100, cost_per_unit: 250 },
  { id: "ing-5", name: "Bubuk Mango Premium", unit: "gram", stock_qty: 1200, min_stock: 300, cost_per_unit: 65 },
  { id: "ing-6", name: "Cream Cheese Powder", unit: "gram", stock_qty: 950, min_stock: 400, cost_per_unit: 140 },
  { id: "ing-7", name: "Susu UHT Full Cream", unit: "ml", stock_qty: 8500, min_stock: 2000, cost_per_unit: 18 },
];

export async function getTrackedProductsAction() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

    if (isDemo) {
      return MOCK_PRODUCTS.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock_qty: p.stock_qty,
        low_stock_threshold: p.low_stock_threshold,
        track_stock: p.track_stock,
        is_active: p.is_active,
        category: { name: p.category.name },
      }));
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        sku,
        stock_qty,
        low_stock_threshold,
        track_stock,
        is_active,
        category:categories(name)
      `)
      .order("name", { ascending: true });

    if (error || !data || data.length === 0) {
      return MOCK_PRODUCTS.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock_qty: p.stock_qty,
        low_stock_threshold: p.low_stock_threshold,
        track_stock: p.track_stock,
        is_active: p.is_active,
        category: { name: p.category.name },
      }));
    }
    return data || [];
  } catch {
    return MOCK_PRODUCTS.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stock_qty: p.stock_qty,
      low_stock_threshold: p.low_stock_threshold,
      track_stock: p.track_stock,
      is_active: p.is_active,
      category: { name: p.category.name },
    }));
  }
}

export async function getIngredientsAction() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

    if (isDemo) return MOCK_INGREDIENTS;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .order("name", { ascending: true });

    if (error || !data || data.length === 0) return MOCK_INGREDIENTS;
    return data || [];
  } catch {
    return MOCK_INGREDIENTS;
  }
}

export async function createIngredientAction(formData: {
  name: string;
  unit: string;
  stock_qty: number;
  min_stock: number;
  cost_per_unit: number;
}) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ingredients")
      .insert(formData)
      .select()
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath("/inventory");
    return { ok: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menambahkan bahan baku";
    return { ok: false, error: message };
  }
}

export async function updateIngredientAction(
  id: string,
  formData: {
    name?: string;
    unit?: string;
    min_stock?: number;
    cost_per_unit?: number;
  }
) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ingredients")
      .update(formData)
      .eq("id", id)
      .select()
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath("/inventory");
    return { ok: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui bahan baku";
    return { ok: false, error: message };
  }
}

export async function recordStockMovementAction(payload: StockMovementPayload) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Tidak terotentikasi" };

    let newBalance = 0;

    if (payload.targetType === "product") {
      // Get current stock of product
      const { data: prod } = await supabase
        .from("products")
        .select("stock_qty")
        .eq("id", payload.targetId)
        .single();

      newBalance = Number(prod?.stock_qty || 0) + payload.qtyChange;

      // Update product stock
      const { error: updateErr } = await supabase
        .from("products")
        .update({ stock_qty: newBalance })
        .eq("id", payload.targetId);

      if (updateErr) return { ok: false, error: updateErr.message };

      // Insert stock movement record
      const { error: moveErr } = await supabase.from("stock_movements").insert({
        product_id: payload.targetId,
        type: payload.type,
        qty_change: payload.qtyChange,
        balance_after: newBalance,
        unit_cost: payload.unitCost || null,
        note: payload.note || null,
        created_by: user.id,
      });

      if (moveErr) return { ok: false, error: moveErr.message };
    } else {
      // Target is ingredient
      const { data: ing } = await supabase
        .from("ingredients")
        .select("stock_qty")
        .eq("id", payload.targetId)
        .single();

      newBalance = Number(ing?.stock_qty || 0) + payload.qtyChange;

      const { error: updateErr } = await supabase
        .from("ingredients")
        .update({ stock_qty: newBalance })
        .eq("id", payload.targetId);

      if (updateErr) return { ok: false, error: updateErr.message };

      const { error: moveErr } = await supabase.from("stock_movements").insert({
        ingredient_id: payload.targetId,
        type: payload.type,
        qty_change: payload.qtyChange,
        balance_after: newBalance,
        unit_cost: payload.unitCost || null,
        note: payload.note || null,
        created_by: user.id,
      });

      if (moveErr) return { ok: false, error: moveErr.message };
    }

    revalidatePath("/inventory");
    return { ok: true, balance: newBalance };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mencatat mutasi stok";
    return { ok: false, error: message };
  }
}

export async function getStockMovementsAction(params: {
  targetId?: string;
  limit?: number;
} = {}) {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("stock_movements")
      .select(`
        *,
        product:products(name),
        ingredient:ingredients(name, unit),
        creator:profiles(full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(params.limit || 50);

    if (params.targetId) {
      query = query.or(`product_id.eq.${params.targetId},ingredient_id.eq.${params.targetId}`);
    }

    const { data, error } = await query;
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}
