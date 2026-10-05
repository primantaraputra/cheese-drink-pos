"use server";

import { createClient } from "@/lib/supabase/server";

export async function getAuditLogsAction(limit = 100) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

    if (isDemo) {
      return [
        {
          id: "audit-1",
          user_id: "00000000-0000-0000-0000-000000000001",
          action: "shift_open",
          table_name: "shifts",
          record_id: "shift-demo-1",
          entity: "shifts",
          entity_id: "shift-demo-1",
          old_data: null,
          new_data: { opening_cash: 100000 },
          ip_address: "127.0.0.1",
          created_at: new Date().toISOString(),
          user: { full_name: "Owner Cheese Drink", role: "owner" },
        },
        {
          id: "audit-2",
          user_id: "00000000-0000-0000-0000-000000000002",
          action: "create_order",
          table_name: "orders",
          record_id: "ord-demo-1",
          entity: "orders",
          entity_id: "ord-demo-1",
          old_data: null,
          new_data: { total: 42000, status: "completed" },
          ip_address: "127.0.0.1",
          created_at: new Date().toISOString(),
          user: { full_name: "Kasir Siti Rahma", role: "cashier" },
        },
      ];
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .select(`
        *,
        user:profiles(full_name, role)
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}
