-- ==============================================================================
-- 0006_void_order_rpc.sql
-- RPC Pembatalan Pesanan (Void) dengan Validasi PIN Owner & Rollback Stok
-- ==============================================================================

create or replace function void_order(
  p_order_id uuid,
  p_reason text,
  p_pin text default null
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := auth.uid();
  v_order orders%rowtype;
  v_settings store_settings%rowtype;
  v_item record;
  v_rec record;
  v_new_stock numeric;
  v_is_owner boolean := false;
  v_order_date date;
  v_today date;
begin
  if v_user_id is null then
    raise exception 'Tidak terotentikasi';
  end if;

  v_is_owner := is_owner();

  -- Ambil data pesanan
  select * into v_order from orders where id = p_order_id;
  if not found then
    raise exception 'Pesanan tidak ditemukan';
  end if;

  if v_order.status = 'void' then
    raise exception 'Pesanan ini sudah dibatalkan (void) sebelumnya';
  end if;

  if v_order.status = 'held' then
    raise exception 'Pesanan yang masih diparkir (held) dapat langsung dibatalkan atau dihapus';
  end if;

  -- Validasi alasan pembatalan
  if length(trim(coalesce(p_reason, ''))) < 5 then
    raise exception 'Alasan pembatalan (void) wajib diisi minimal 5 karakter';
  end if;

  -- Ambil pengaturan toko
  select * into v_settings from store_settings where id = 1;

  -- Kasir rules: hanya boleh void pesanan di hari yang sama
  v_order_date := (v_order.created_at at time zone coalesce(v_settings.timezone, 'Asia/Jakarta'))::date;
  v_today := (now() at time zone coalesce(v_settings.timezone, 'Asia/Jakarta'))::date;

  if not v_is_owner then
    if v_order_date <> v_today then
      raise exception 'Kasir hanya diperbolehkan membatalkan transaksi pada hari yang sama. Hubungi Pemilik/Owner untuk membatalkan transaksi lampau.';
    end if;

    -- Validasi PIN Owner jika disyaratkan
    if v_settings.require_owner_pin_for_void then
      if p_pin is null or length(trim(p_pin)) = 0 then
        raise exception 'PIN Owner diperlukan untuk membatalkan transaksi.';
      end if;

      if not verify_owner_void_pin(p_pin) then
        raise exception 'PIN Owner tidak valid atau salah.';
      end if;
    end if;
  end if;

  -- 1. Update status order menjadi void
  update orders
  set status = 'void',
      voided_at = now(),
      voided_by = v_user_id,
      void_reason = trim(p_reason),
      updated_at = now()
  where id = p_order_id;

  -- 2. Kembalikan stok produk & bahan baku
  for v_item in (select * from order_items where order_id = p_order_id) loop
    -- Rollback stok langsung produk jika dilacak
    if exists (select 1 from products where id = v_item.product_id and track_stock = true) then
      update products
      set current_stock = current_stock + v_item.qty,
          updated_at = now()
      where id = v_item.product_id
      returning current_stock into v_new_stock;

      insert into stock_movements (
        product_id, type, qty_change, balance_after, order_id, note, created_by
      ) values (
        v_item.product_id, 'sale_void', v_item.qty, v_new_stock, p_order_id,
        'Void transaksi: ' || v_order.order_no || ' (' || v_item.product_name || ')',
        v_user_id
      );
    end if;

    -- Rollback bahan baku resep jika ada
    for v_rec in (
      select r.ingredient_id, r.quantity, i.name as ingredient_name
      from recipes r
      join ingredients i on i.id = r.ingredient_id
      where r.product_id = v_item.product_id
    ) loop
      update ingredients
      set current_stock = current_stock + (v_rec.quantity * v_item.qty),
          updated_at = now()
      where id = v_rec.ingredient_id
      returning current_stock into v_new_stock;

      insert into stock_movements (
        ingredient_id, type, qty_change, balance_after, order_id, note, created_by
      ) values (
        v_rec.ingredient_id, 'sale_void', (v_rec.quantity * v_item.qty), v_new_stock, p_order_id,
        'Void transaksi: ' || v_order.order_no || ' (' || v_rec.ingredient_name || ')',
        v_user_id
      );
    end loop;
  end loop;

  -- 3. Kembalikan statistik pelanggan jika ada
  if v_order.customer_id is not null then
    update customers
    set visit_count = greatest(0, visit_count - 1),
        total_spent = greatest(0, total_spent - v_order.total),
        updated_at = now()
    where id = v_order.customer_id;
  end if;

  -- 4. Catat Audit Log
  insert into audit_logs (user_id, action, entity, entity_id, old_data, new_data)
  values (
    v_user_id,
    'order.void',
    'orders',
    p_order_id::text,
    jsonb_build_object('order_no', v_order.order_no, 'total', v_order.total, 'status', 'completed'),
    jsonb_build_object('reason', trim(p_reason), 'voided_by', v_user_id, 'voided_at', now())
  );

  return jsonb_build_object(
    'order_id', p_order_id,
    'order_no', v_order.order_no,
    'status', 'void',
    'void_reason', trim(p_reason)
  );
end;
$$;
