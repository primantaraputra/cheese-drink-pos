"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { productSchema, type ProductFormData } from "@/lib/validators/product.schema";
import type { Database } from "@/types/database.types";

export type ProductWithDetails = Database["public"]["Tables"]["products"]["Row"] & {
  category: Database["public"]["Tables"]["categories"]["Row"];
  variants: Database["public"]["Tables"]["product_variants"]["Row"][];
  product_modifier_groups: {
    group: Database["public"]["Tables"]["modifier_groups"]["Row"] & {
      modifiers: Database["public"]["Tables"]["modifiers"]["Row"][];
    };
  }[];
};

import { MOCK_PRODUCTS, MOCK_CATEGORIES } from "@/lib/mock-data";

export async function getProductsAction(options?: {
  categoryId?: string;
  search?: string;
  includeInactive?: boolean;
}): Promise<ProductWithDetails[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

    if (isDemo) {
      let result = [...MOCK_PRODUCTS];
      if (options?.categoryId && options.categoryId !== "all") {
        result = result.filter((p) => p.category_id === options.categoryId);
      }
      if (options?.search) {
        const q = options.search.toLowerCase();
        result = result.filter((p) => p.name.toLowerCase().includes(q));
      }
      return result;
    }

    const supabase = await createClient();
    let query = supabase
      .from("products")
      .select(`
        *,
        category:categories(*),
        variants:product_variants(*),
        product_modifier_groups(
          group:modifier_groups(
            *,
            modifiers(*)
          )
        )
      `)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (!options?.includeInactive) {
      query = query.eq("is_active", true);
    }

    if (options?.categoryId) {
      query = query.eq("category_id", options.categoryId);
    }

    if (options?.search) {
      query = query.ilike("name", `%${options.search}%`);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return MOCK_PRODUCTS;
    }

    return (data as unknown as ProductWithDetails[]) || [];
  } catch {
    return MOCK_PRODUCTS;
  }
}

export async function getProductByIdAction(id: string): Promise<ProductWithDetails | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(*),
        variants:product_variants(*),
        product_modifier_groups(
          group:modifier_groups(
            *,
            modifiers(*)
          )
        )
      `)
      .eq("id", id)
      .single();

    if (error) return null;
    return (data as unknown as ProductWithDetails) || null;
  } catch {
    return null;
  }
}

export async function createProductAction(formData: ProductFormData) {
  const parsed = productSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Data tidak valid" };
  }

  const { variants, modifier_group_ids, ...productData } = parsed.data;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

  if (isDemo) {
    const category = MOCK_CATEGORIES.find((c) => c.id === productData.category_id) || MOCK_CATEGORIES[0];
    const newId = `prod-demo-${Date.now()}`;
    const newProd: ProductWithDetails = {
      id: newId,
      name: productData.name,
      sku: productData.sku || null,
      description: productData.description || null,
      category_id: productData.category_id,
      base_price: productData.base_price,
      cost_price: productData.cost_price || 0,
      stock_qty: productData.stock_qty || 0,
      low_stock_threshold: productData.low_stock_threshold || 10,
      track_stock: productData.track_stock ?? false,
      image_url: productData.image_url || null,
      is_available: productData.is_available ?? true,
      is_active: productData.is_active ?? true,
      is_favorite: productData.is_favorite ?? false,
      sort_order: productData.sort_order || MOCK_PRODUCTS.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category,
      variants: variants?.map((v, i) => ({
        id: `var-${Date.now()}-${i}`,
        product_id: newId,
        name: v.name,
        price: v.price,
        cost_price: v.cost_price || 0,
        sku: v.sku || null,
        is_default: v.is_default || i === 0,
        sort_order: i + 1,
        is_active: true,
      })) || [],
      product_modifier_groups: [],
    };
    MOCK_PRODUCTS.unshift(newProd);
    revalidatePath("/products");
    revalidatePath("/pos");
    return { ok: true, data: newProd };
  }

  const supabase = await createClient();

  // 1. Simpan produk utama
  const { data: newProduct, error: prodError } = await supabase
    .from("products")
    .insert(productData)
    .select()
    .single();

  if (prodError) {
    return { ok: false, error: prodError.message };
  }

  // 2. Simpan varian jika ada
  if (variants && variants.length > 0) {
    const variantsToInsert = variants.map((v, idx) => ({
      product_id: newProduct.id,
      name: v.name,
      price: v.price,
      cost_price: v.cost_price || 0,
      sku: v.sku || null,
      is_default: v.is_default || idx === 0,
      sort_order: idx + 1,
    }));

    await supabase.from("product_variants").insert(variantsToInsert);
  }

  // 3. Hubungkan grup modifier jika ada
  if (modifier_group_ids && modifier_group_ids.length > 0) {
    const modGroupsToInsert = modifier_group_ids.map((groupId) => ({
      product_id: newProduct.id,
      group_id: groupId,
    }));

    await supabase.from("product_modifier_groups").insert(modGroupsToInsert);
  }

  revalidatePath("/products");
  revalidatePath("/pos");
  return { ok: true, data: newProduct };
}

export async function updateProductAction(id: string, formData: Partial<ProductFormData>) {
  const { variants, modifier_group_ids, ...productData } = formData;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

  if (isDemo) {
    const idx = MOCK_PRODUCTS.findIndex((p) => p.id === id);
    if (idx !== -1) {
      const category = formData.category_id
        ? MOCK_CATEGORIES.find((c) => c.id === formData.category_id) || MOCK_PRODUCTS[idx].category
        : MOCK_PRODUCTS[idx].category;

      MOCK_PRODUCTS[idx] = {
        ...MOCK_PRODUCTS[idx],
        ...productData,
        image_url: productData.image_url !== undefined ? productData.image_url : MOCK_PRODUCTS[idx].image_url,
        category,
        variants: variants
          ? variants.map((v, i) => ({
              id: `var-${Date.now()}-${i}`,
              product_id: id,
              name: v.name,
              price: v.price,
              cost_price: v.cost_price || 0,
              sku: v.sku || null,
              is_default: v.is_default || i === 0,
              sort_order: i + 1,
              is_active: true,
            }))
          : MOCK_PRODUCTS[idx].variants,
        updated_at: new Date().toISOString(),
      };
      revalidatePath("/products");
      revalidatePath("/pos");
      return { ok: true, data: MOCK_PRODUCTS[idx] };
    }
  }

  const supabase = await createClient();

  const { data: updatedProduct, error: prodError } = await supabase
    .from("products")
    .update(productData)
    .eq("id", id)
    .select()
    .single();

  if (prodError) {
    return { ok: false, error: prodError.message };
  }

  // Update varian jika disertakan
  if (variants) {
    await supabase.from("product_variants").delete().eq("product_id", id);
    if (variants.length > 0) {
      const variantsToInsert = variants.map((v, idx) => ({
        product_id: id,
        name: v.name,
        price: v.price,
        cost_price: v.cost_price || 0,
        sku: v.sku || null,
        is_default: v.is_default || idx === 0,
        sort_order: idx + 1,
      }));
      await supabase.from("product_variants").insert(variantsToInsert);
    }
  }

  // Update hubungan grup modifier jika disertakan
  if (modifier_group_ids) {
    await supabase.from("product_modifier_groups").delete().eq("product_id", id);
    if (modifier_group_ids.length > 0) {
      const modGroupsToInsert = modifier_group_ids.map((groupId) => ({
        product_id: id,
        group_id: groupId,
      }));
      await supabase.from("product_modifier_groups").insert(modGroupsToInsert);
    }
  }

  revalidatePath("/products");
  revalidatePath("/pos");
  return { ok: true, data: updatedProduct };
}

export async function toggleProductAvailabilityAction(id: string, is_available: boolean) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

  if (isDemo) {
    const p = MOCK_PRODUCTS.find((prod) => prod.id === id);
    if (p) {
      p.is_available = is_available;
    }
    revalidatePath("/products");
    revalidatePath("/pos");
    return { ok: true };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_available })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/products");
  revalidatePath("/pos");
  return { ok: true };
}

export async function deleteProductAction(id: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const isDemo = supabaseUrl.includes("dummy") || !supabaseUrl;

  if (isDemo) {
    const idx = MOCK_PRODUCTS.findIndex((p) => p.id === id);
    if (idx !== -1) {
      MOCK_PRODUCTS[idx].is_active = false;
    }
    revalidatePath("/products");
    revalidatePath("/pos");
    return { ok: true };
  }

  const supabase = await createClient();
  // Soft delete sesuai spesifikasi Bagian 7.5
  const { error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/products");
  revalidatePath("/pos");
  return { ok: true };
}

export async function duplicateProductAction(id: string) {
  const product = await getProductByIdAction(id);
  if (!product) return { ok: false, error: "Produk tidak ditemukan" };

  return createProductAction({
    name: `${product.name} (Salinan)`,
    category_id: product.category_id,
    sku: product.sku ? `${product.sku}-COPY` : null,
    description: product.description,
    image_url: product.image_url,
    base_price: product.base_price,
    cost_price: product.cost_price,
    track_stock: product.track_stock,
    stock_qty: product.stock_qty,
    low_stock_threshold: product.low_stock_threshold,
    is_available: true,
    is_active: true,
    is_favorite: product.is_favorite,
    sort_order: product.sort_order + 1,
    variants: product.variants.map((v) => ({
      name: v.name,
      price: v.price,
      cost_price: v.cost_price,
      sku: v.sku ? `${v.sku}-COPY` : null,
      is_default: v.is_default,
    })),
    modifier_group_ids: product.product_modifier_groups.map((pmg) => pmg.group.id),
  });
}
