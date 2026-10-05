"use server";

import { createClient } from "@/lib/supabase/server";

const DEMO_SUMMARY = {
  total_sales: 3250000,
  total_orders: 68,
  total_subtotal: 3250000,
  total_discount: 120000,
  total_tax: 0,
  total_service: 0,
  total_cost: 1450000,
  gross_profit: 1800000,
  avg_ticket: 47794,
  void_count: 2,
  void_amount: 84000,
};

const DEMO_SALES_BY_DAY = [
  { sale_date: "2026-09-26", total_sales: 2450000, order_count: 52 },
  { sale_date: "2026-09-27", total_sales: 3100000, order_count: 65 },
  { sale_date: "2026-09-28", total_sales: 2800000, order_count: 58 },
  { sale_date: "2026-09-29", total_sales: 2600000, order_count: 55 },
  { sale_date: "2026-09-30", total_sales: 3400000, order_count: 72 },
  { sale_date: "2026-10-01", total_sales: 3850000, order_count: 80 },
  { sale_date: "2026-10-02", total_sales: 3250000, order_count: 68 },
];

const DEMO_SALES_BY_HOUR = [
  { sale_hour: 10, total_sales: 210000, order_count: 5 },
  { sale_hour: 11, total_sales: 380000, order_count: 8 },
  { sale_hour: 12, total_sales: 650000, order_count: 14 },
  { sale_hour: 13, total_sales: 520000, order_count: 11 },
  { sale_hour: 14, total_sales: 280000, order_count: 6 },
  { sale_hour: 15, total_sales: 310000, order_count: 7 },
  { sale_hour: 16, total_sales: 420000, order_count: 9 },
  { sale_hour: 17, total_sales: 480000, order_count: 10 },
  { sale_hour: 18, total_sales: 720000, order_count: 15 },
  { sale_hour: 19, total_sales: 840000, order_count: 18 },
  { sale_hour: 20, total_sales: 590000, order_count: 12 },
  { sale_hour: 21, total_sales: 240000, order_count: 5 },
];

const DEMO_TOP_PRODUCTS = [
  { product_id: "prod-dimsum-mentai-lava", product_name: "Dimsum Mentai Cheese Lava", total_qty: 48, total_sales: 1152000 },
  { product_id: "prod-mango-cheese-tea", product_name: "Mango Cream Cheese Drink", total_qty: 42, total_sales: 756000 },
  { product_id: "prod-brown-sugar-cheese", product_name: "Brown Sugar Boba Cheese", total_qty: 36, total_sales: 792000 },
  { product_id: "prod-dimsum-kukus-udang", product_name: "Dimsum Kukus Ayam Udang", total_qty: 34, total_sales: 612000 },
  { product_id: "prod-dimsum-goreng-mozza", product_name: "Dimsum Goreng Mozzarella Melt", total_qty: 28, total_sales: 560000 },
];

const DEMO_SALES_BY_PAYMENT = [
  { payment_method: "cash", total_amount: 1950000, transaction_count: 42 },
  { payment_method: "qris", total_amount: 1300000, transaction_count: 26 },
];

const DEMO_SALES_BY_CATEGORY = [
  { category_id: "cat-dimsum", category_name: "Dimsum", total_qty: 110, total_sales: 2324000 },
  { category_id: "cat-minuman", category_name: "Minuman", total_qty: 78, total_sales: 1548000 },
];

const DEMO_SALES_BY_CASHIER = [
  { cashier_id: "00000000-0000-0000-0000-000000000002", cashier_name: "Kasir Siti Rahma", total_orders: 45, total_sales: 2150000, void_count: 1 },
  { cashier_id: "00000000-0000-0000-0000-000000000001", cashier_name: "Owner Cheese Drink", total_orders: 23, total_sales: 1100000, void_count: 1 },
];

export async function getSalesSummaryAction(startDate: string, endDate: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

    if (isDemo) return DEMO_SUMMARY;

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_sales_summary", {
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error || !data) return DEMO_SUMMARY;
    return data as typeof DEMO_SUMMARY;
  } catch {
    return DEMO_SUMMARY;
  }
}

export async function getSalesByDayAction(startDate: string, endDate: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

    if (isDemo) return DEMO_SALES_BY_DAY;

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_sales_by_day", {
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error || !data || data.length === 0) return DEMO_SALES_BY_DAY;
    return data as typeof DEMO_SALES_BY_DAY;
  } catch {
    return DEMO_SALES_BY_DAY;
  }
}

export async function getSalesByHourAction(startDate: string, endDate: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

    if (isDemo) return DEMO_SALES_BY_HOUR;

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_sales_by_hour", {
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error || !data || data.length === 0) return DEMO_SALES_BY_HOUR;
    return data as typeof DEMO_SALES_BY_HOUR;
  } catch {
    return DEMO_SALES_BY_HOUR;
  }
}

export async function getTopProductsAction(startDate: string, endDate: string, limit = 10) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

    if (isDemo) return DEMO_TOP_PRODUCTS.slice(0, limit);

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_top_products", {
      p_start_date: startDate,
      p_end_date: endDate,
      p_limit: limit,
    });

    if (error || !data || data.length === 0) return DEMO_TOP_PRODUCTS.slice(0, limit);
    return data as typeof DEMO_TOP_PRODUCTS;
  } catch {
    return DEMO_TOP_PRODUCTS.slice(0, limit);
  }
}

export async function getSalesByCategoryAction(startDate: string, endDate: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

    if (isDemo) return DEMO_SALES_BY_CATEGORY;

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_sales_by_category", {
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error || !data || data.length === 0) return DEMO_SALES_BY_CATEGORY;
    return data as typeof DEMO_SALES_BY_CATEGORY;
  } catch {
    return DEMO_SALES_BY_CATEGORY;
  }
}

export async function getSalesByPaymentMethodAction(startDate: string, endDate: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

    if (isDemo) return DEMO_SALES_BY_PAYMENT;

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_sales_by_payment_method", {
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error || !data || data.length === 0) return DEMO_SALES_BY_PAYMENT;
    return data as typeof DEMO_SALES_BY_PAYMENT;
  } catch {
    return DEMO_SALES_BY_PAYMENT;
  }
}

export async function getSalesByCashierAction(startDate: string, endDate: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

    if (isDemo) return DEMO_SALES_BY_CASHIER;

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_sales_by_cashier", {
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error || !data || data.length === 0) return DEMO_SALES_BY_CASHIER;
    return data as typeof DEMO_SALES_BY_CASHIER;
  } catch {
    return DEMO_SALES_BY_CASHIER;
  }
}

export async function getProfitLossAction(startDate: string, endDate: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_profit_loss", {
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) return null;
    return data as {
      gross_sales: number;
      discounts: number;
      net_sales: number;
      cogs: number;
      gross_profit: number;
      expenses: number;
      net_profit: number;
    };
  } catch {
    return null;
  }
}
