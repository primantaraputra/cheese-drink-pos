"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { customerSchema, type CustomerFormData } from "@/lib/validators/customer.schema";
import type { Database } from "@/types/database.types";

type Customer = Database["public"]["Tables"]["customers"]["Row"];

import { MOCK_CUSTOMERS } from "@/lib/mock-data";

export async function getCustomersAction(search?: string): Promise<Customer[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

    if (isDemo) {
      if (!search) return MOCK_CUSTOMERS;
      const q = search.toLowerCase();
      return MOCK_CUSTOMERS.filter((c) => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)));
    }

    const supabase = await createClient();
    let query = supabase.from("customers").select("*").order("total_spent", { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return MOCK_CUSTOMERS;
    }
    return data || [];
  } catch {
    return MOCK_CUSTOMERS;
  }
}

export async function createCustomerAction(formData: CustomerFormData) {
  const parsed = customerSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Data tidak valid" };
  }

  const supabase = await createClient();
  const insertData = {
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    notes: parsed.data.notes || null,
  };

  const { data, error } = await supabase
    .from("customers")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Nomor telepon pelanggan sudah terdaftar." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/customers");
  revalidatePath("/pos");
  return { ok: true, data };
}

export async function updateCustomerAction(id: string, formData: Partial<CustomerFormData>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .update(formData)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/customers");
  revalidatePath("/pos");
  return { ok: true, data };
}
