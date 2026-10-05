-- ==============================================================================
-- 0005_create_order_rpc.sql
-- RPC Transaksi POS Atomik: create_order (mode pay & hold)
-- Perhitungan uang final di database, anti race-condition queue & order no
-- ==============================================================================

create or replace function create_order(payload jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := auth.uid();
  v_mode text := coalesce(payload->>'mode', 'pay'); -- 'pay' atau 'hold'
  v_shift_id uuid;
  v_store store_settings%rowtype;
  v_order_type order_type := coalesce((payload->>'order_type')::order_type, 'dine_in');
  v_channel order_channel := coalesce((payload->>'channel')::order_channel, 'walk_in');
  v_table_no text := payload->>'table_no';
  v_customer_id uuid := (payload->>'customer_id')::uuid;
  v_customer_name text := payload->>'customer_name';
  v_order_note text := payload->>'note';
  v_discount_id uuid := (payload->>'discount_id')::uuid;

  v_today date := (now() at time zone 'Asia/Jakarta')::date;
  v_date_str text := to_char(v_today, 'YYMMDD');
  v_seq int;
  v_order_no text;
  v_order_id uuid;

  v_subtotal numeric := 0;
  v_total_cost numeric := 0;
  v_discount_amount numeric := 0;
  v_dpp numeric := 0;
  v_service_amount numeric := 0;
  v_tax_amount numeric := 0;
  v_rounding_amount numeric := 0;
  v_total numeric := 0;
  v_total_paid numeric := 0;
  v_cash_paid numeric := 0;
  v_non_cash_paid numeric := 0;
  v_change_amount numeric := 0;

  v_item jsonb;
  v_prod products%rowtype;
  v_var product_variants%rowtype;
  v_unit_price numeric;
  v_unit_cost numeric;
  v_mod_total numeric;
  v_line_total numeric;
  v_item_id uuid;
  v_mod jsonb;
  v_mod_row modifiers%rowtype;
  v_group_name text;

  v_disc discounts%rowtype;
  v_raw_discount numeric;
  v_total_before_round numeric;
  v_rounded_total numeric;

  v_pay jsonb;
  v_pay_amount numeric;
  v_pay_method payment_method;
begin
  -- 1. Validasi otentikasi staf
  if v_user_id is null then
    raise exception 'Tidak terotentikasi. Silakan login terlebih dahulu.';
  end if;

  -- 2. Ambil dan validasi shift aktif kasir
  select id into v_shift_id
  from shifts
  where cashier_id = v_user_id and status = 'open'
  limit 1;

  if v_shift_id is null then
    -- Periksa apakah user adalah owner
    if not is_owner() then
      raise exception 'Kasir belum membuka shift. Silakan buka shift terlebih dahulu.';
    end if;
  end if;

  -- 3. Ambil konfigurasi toko
  select * into v_store from store_settings where id = 1;
  if not found then
    raise exception 'Pengaturan toko tidak ditemukan.';
  end if;

  -- 4. Generate order_no dan queue_no secara concurrency-safe via daily_counters
  insert into daily_counters (counter_date, last_seq)
  values (v_today, 1)
  on conflict (counter_date) do update
  set last_seq = daily_counters.last_seq + 1
  returning last_seq into v_seq;

  v_order_no := format('%s-%s-%s', v_store.order_prefix, v_date_str, lpad(v_seq::text, 4, '0'));

  -- 5. Buat baris pesanan awal
  insert into orders (
    order_no, queue_no, shift_id, cashier_id, customer_id, customer_name,
    order_type, channel, table_no, status, note, created_at
  )
  values (
    v_order_no, v_seq, v_shift_id, v_user_id, v_customer_id, v_customer_name,
    v_order_type, v_channel, v_table_no, 'held', v_order_note, now()
  )
  returning id into v_order_id;

  -- 6. Loop dan validasi setiap item pesanan dari master database
  for v_item in select * from jsonb_array_elements(payload->'items')
  loop
    select * into v_prod from products where id = (v_item->>'product_id')::uuid;
    if not found or not v_prod.is_active then
      raise exception 'Produk dengan ID % tidak aktif atau tidak ditemukan.', v_item->>'product_id';
    end if;

    if not v_prod.is_available then
      raise exception 'Produk % sedang berstatus habis.', v_prod.name;
    end if;

    v_unit_price := v_prod.base_price;
    v_unit_cost := v_prod.cost_price;

    -- Periksa varian jika dipilih
    if (v_item->>'variant_id') is not null then
      select * into v_var from product_variants
      where id = (v_item->>'variant_id')::uuid and product_id = v_prod.id;

      if found and v_var.is_active then
        v_unit_price := v_var.price;
        v_unit_cost := v_var.cost_price;
      end if;
    end if;

    -- Hitung total delta modifier
    v_mod_total := 0;
    if (v_item->'modifiers') is not null and jsonb_array_length(v_item->'modifiers') > 0 then
      for v_mod in select * from jsonb_array_elements(v_item->'modifiers')
      loop
        select * into v_mod_row from modifiers where id = (v_mod->>'modifier_id')::uuid;
        if found and v_mod_row.is_active then
          v_mod_total := v_mod_total + v_mod_row.price_delta;
          v_unit_cost := v_unit_cost + v_mod_row.cost_delta;
        end if;
      end loop;
    end if;

    v_line_total := (v_unit_price + v_mod_total) * (v_item->>'qty')::int;
    v_subtotal := v_subtotal + v_line_total;
    v_total_cost := v_total_cost + (v_unit_cost * (v_item->>'qty')::int);

    -- Simpan snapshot item pesanan
    insert into order_items (
      order_id, product_id, variant_id, product_name, variant_name,
      unit_price, unit_cost, qty, modifiers_total, line_total, note
    )
    values (
      v_order_id, v_prod.id, v_var.id, v_prod.name, v_var.name,
      v_unit_price, v_unit_cost, (v_item->>'qty')::int, v_mod_total, v_line_total, v_item->>'note'
    )
    returning id into v_item_id;

    -- Simpan snapshot modifier item
    if (v_item->'modifiers') is not null and jsonb_array_length(v_item->'modifiers') > 0 then
      for v_mod in select * from jsonb_array_elements(v_item->'modifiers')
      loop
        select m.*, g.name as g_name into v_mod_row, v_group_name
        from modifiers m
        join modifier_groups g on g.id = m.group_id
        where m.id = (v_mod->>'modifier_id')::uuid;

        if found then
          insert into order_item_modifiers (order_item_id, modifier_id, group_name, name, price_delta)
          values (v_item_id, v_mod_row.id, v_group_name, v_mod_row.name, v_mod_row.price_delta);
        end if;
      end loop;
    end if;
  end loop;

  -- 7. Kalkulasi Diskon
  if v_discount_id is not null then
    select * into v_disc from discounts where id = v_discount_id and is_active = true;
    if found then
      if v_subtotal >= v_disc.min_purchase then
        if v_disc.type = 'percent' then
          v_raw_discount := round((v_subtotal * v_disc.value) / 100);
          if v_disc.max_discount is not null and v_raw_discount > v_disc.max_discount then
            v_discount_amount := v_disc.max_discount;
          else
            v_discount_amount := v_raw_discount;
          end if;
        else
          v_discount_amount := least(v_disc.value, v_subtotal);
        end if;
      end if;
    end if;
  end if;

  v_dpp := greatest(0, v_subtotal - v_discount_amount);

  -- 8. Kalkulasi Service Charge
  if v_store.service_enabled then
    v_service_amount := round((v_dpp * v_store.service_percent) / 100);
  else
    v_service_amount := 0;
  end if;

  v_total_before_round := v_dpp + v_service_amount;

  -- 9. Kalkulasi Pajak
  if v_store.tax_enabled then
    if v_store.tax_inclusive then
      v_tax_amount := round((v_total_before_round * v_store.tax_percent) / (100 + v_store.tax_percent));
    else
      v_tax_amount := round(((v_dpp + v_service_amount) * v_store.tax_percent) / 100);
      v_total_before_round := v_total_before_round + v_tax_amount;
    end if;
  else
    v_tax_amount := 0;
  end if;

  -- 10. Kalkulasi Pembulatan (Rounding Unit, default 100)
  if v_store.rounding_unit > 0 then
    v_rounded_total := round(v_total_before_round / v_store.rounding_unit) * v_store.rounding_unit;
  else
    v_rounded_total := v_total_before_round;
  end if;

  v_rounding_amount := v_rounded_total - v_total_before_round;
  v_total := greatest(0, v_total_before_round + v_rounding_amount);

  -- 11. Mode Eksekusi: PAY vs HOLD
  if v_mode = 'pay' then
    -- Validasi pembayaran
    for v_pay in select * from jsonb_array_elements(payload->'payments')
    loop
      v_pay_amount := (v_pay->>'amount')::numeric;
      v_pay_method := (v_pay->>'method')::payment_method;

      if v_pay_amount <= 0 then
        raise exception 'Nominal pembayaran harus lebih besar dari 0.';
      end if;

      v_total_paid := v_total_paid + v_pay_amount;
      if v_pay_method = 'cash' then
        v_cash_paid := v_cash_paid + v_pay_amount;
      else
        v_non_cash_paid := v_non_cash_paid + v_pay_amount;
      end if;

      insert into payments (order_id, method, amount, reference_no)
      values (v_order_id, v_pay_method, v_pay_amount, v_pay->>'reference_no');
    end loop;

    -- Validasi pembayaran non-tunai tidak melebihi total
    if v_non_cash_paid > v_total then
      raise exception 'Nominal pembayaran non-tunai tidak boleh melebihi total tagihan.';
    end if;

    if v_total_paid < v_total then
      raise exception 'Jumlah pembayaran kurang dari total tagihan (Total: %, Diterima: %).', v_total, v_total_paid;
    end if;

    -- Hitung kembalian tunai
    v_change_amount := greatest(0, v_cash_paid - greatest(0, v_total - v_non_cash_paid));

    -- Update order menjadi completed
    update orders
    set status = 'completed',
        subtotal = v_subtotal,
        discount_id = v_discount_id,
        discount_amount = v_discount_amount,
        service_amount = v_service_amount,
        tax_amount = v_tax_amount,
        rounding_amount = v_rounding_amount,
        total = v_total,
        paid_amount = v_total_paid,
        change_amount = v_change_amount,
        total_cost = v_total_cost,
        paid_at = now()
    where id = v_order_id;

    -- Pengurangan stok produk & pencatatan pergerakan stok
    for v_item in select * from jsonb_array_elements(payload->'items')
    loop
      select * into v_prod from products where id = (v_item->>'product_id')::uuid;
      if v_prod.track_stock then
        update products
        set stock_qty = stock_qty - (v_item->>'qty')::int
        where id = v_prod.id;

        insert into stock_movements (
          product_id, type, qty_change, balance_after, order_id, unit_cost, note, created_by
        )
        values (
          v_prod.id, 'sale', -((v_item->>'qty')::int),
          (v_prod.stock_qty - (v_item->>'qty')::int),
          v_order_id, v_prod.cost_price, 'Penjualan ' || v_order_no, v_user_id
        );
      end if;
    end loop;

    -- Update statistik pelanggan jika dipilih
    if v_customer_id is not null then
      update customers
      set total_spent = total_spent + v_total,
          visit_count = visit_count + 1,
          last_visit_at = now()
      where id = v_customer_id;
    end if;

  else
    -- Mode HOLD: pesanan disimpan dalam status 'held'
    update orders
    set status = 'held',
        subtotal = v_subtotal,
        discount_id = v_discount_id,
        discount_amount = v_discount_amount,
        service_amount = v_service_amount,
        tax_amount = v_tax_amount,
        rounding_amount = v_rounding_amount,
        total = v_total,
        total_cost = v_total_cost
    where id = v_order_id;
  end if;

  -- Return data transaksi lengkap
  return jsonb_build_object(
    'order_id', v_order_id,
    'order_no', v_order_no,
    'queue_no', v_seq,
    'status', case when v_mode = 'pay' then 'completed' else 'held' end,
    'subtotal', v_subtotal,
    'discount_amount', v_discount_amount,
    'service_amount', v_service_amount,
    'tax_amount', v_tax_amount,
    'rounding_amount', v_rounding_amount,
    'total', v_total,
    'paid_amount', v_total_paid,
    'change_amount', v_change_amount
  );
end;
$$;
