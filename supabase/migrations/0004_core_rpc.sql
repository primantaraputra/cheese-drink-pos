-- ==============================================================================
-- 0004_core_rpc.sql
-- RPC Operasional: Shift Manajemen dan Verifikasi PIN Void Owner
-- ==============================================================================

-- Aktifkan pgcrypto untuk hashing PIN void
create extension if not exists pgcrypto;

-- 1. Buka Shift Kasir
create or replace function open_shift(p_opening_cash numeric)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := auth.uid();
  v_new_shift_id uuid;
begin
  if v_user_id is null then
    raise exception 'Tidak terotentikasi';
  end if;

  if exists (select 1 from shifts where cashier_id = v_user_id and status = 'open') then
    raise exception 'Kasir sudah memiliki shift yang masih terbuka. Silakan tutup shift sebelumnya terlebih dahulu.';
  end if;

  insert into shifts (cashier_id, status, opened_at, opening_cash)
  values (v_user_id, 'open', now(), coalesce(p_opening_cash, 0))
  returning id into v_new_shift_id;

  return v_new_shift_id;
end;
$$;

-- 2. Tutup Shift Kasir
create or replace function close_shift(
  p_shift_id uuid,
  p_actual_cash numeric,
  p_note text default null
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_shift shifts%rowtype;
  v_cash_sales numeric := 0;
  v_drawer_expenses numeric := 0;
  v_expected_cash numeric := 0;
  v_difference numeric := 0;
  v_held_count int := 0;
begin
  select * into v_shift from shifts where id = p_shift_id;
  if not found then
    raise exception 'Shift tidak ditemukan';
  end if;

  if v_shift.status = 'closed' then
    raise exception 'Shift sudah ditutup sebelumnya';
  end if;

  -- Pastikan hanya pemilik shift atau owner yang dapat menutup
  if v_shift.cashier_id <> auth.uid() and not is_owner() then
    raise exception 'Anda tidak memiliki hak akses untuk menutup shift ini';
  end if;

  -- Validasi pesanan held
  select count(*) into v_held_count
  from orders
  where shift_id = p_shift_id and status = 'held';

  if v_held_count > 0 then
    raise exception 'Terdapat % pesanan diparkir (held) yang belum diselesaikan atau dibatalkan. Selesaikan terlebih dahulu sebelum menutup shift.', v_held_count;
  end if;

  -- Total pembayaran tunai untuk order completed di shift ini
  select coalesce(sum(p.amount), 0) into v_cash_sales
  from payments p
  join orders o on o.id = p.order_id
  where o.shift_id = p_shift_id
    and o.status = 'completed'
    and p.method = 'cash';

  -- Total pengeluaran yang diambil dari laci
  select coalesce(sum(amount), 0) into v_drawer_expenses
  from expenses
  where shift_id = p_shift_id
    and paid_from_drawer = true;

  v_expected_cash := v_shift.opening_cash + v_cash_sales - v_drawer_expenses;
  v_difference := coalesce(p_actual_cash, 0) - v_expected_cash;

  update shifts
  set status = 'closed',
      closed_at = now(),
      expected_cash = v_expected_cash,
      actual_cash = coalesce(p_actual_cash, 0),
      cash_difference = v_difference,
      note = p_note
  where id = p_shift_id;

  return jsonb_build_object(
    'shift_id', p_shift_id,
    'opening_cash', v_shift.opening_cash,
    'cash_sales', v_cash_sales,
    'drawer_expenses', v_drawer_expenses,
    'expected_cash', v_expected_cash,
    'actual_cash', p_actual_cash,
    'difference', v_difference
  );
end;
$$;

-- 3. Set Owner Void PIN (Hanya Owner)
create or replace function set_owner_void_pin(p_new_pin text)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not is_owner() then
    raise exception 'Hanya owner yang berhak mengatur PIN pembatalan (void).';
  end if;

  if length(p_new_pin) < 4 or length(p_new_pin) > 8 then
    raise exception 'PIN harus terdiri dari 4 hingga 8 digit angka.';
  end if;

  update store_settings
  set owner_void_pin_hash = crypt(p_new_pin, gen_salt('bf'))
  where id = 1;

  insert into audit_logs (user_id, action, entity, entity_id)
  values (auth.uid(), 'store.set_void_pin', 'store_settings', '1');

  return true;
end;
$$;

-- 4. Verifikasi PIN Owner untuk Void
create or replace function verify_owner_void_pin(p_pin text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_hash text;
begin
  select owner_void_pin_hash into v_hash from store_settings where id = 1;
  if v_hash is null then
    -- Jika PIN belum diatur, izinkan jika pemanggil adalah owner
    return is_owner();
  end if;

  return v_hash = crypt(p_pin, v_hash);
end;
$$;
