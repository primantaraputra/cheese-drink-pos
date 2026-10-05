-- ==============================================================================
-- 0002_functions_and_triggers.sql
-- Trigger Helper, Otomasi Profil, Role Helper, dan Audit Trail
-- ==============================================================================

-- 1. Helper updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Pasang trigger update pada tabel yang memiliki kolom updated_at
create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger trg_store_settings_updated_at
  before update on store_settings
  for each row execute function set_updated_at();

create trigger trg_categories_updated_at
  before update on categories
  for each row execute function set_updated_at();

create trigger trg_products_updated_at
  before update on products
  for each row execute function set_updated_at();

create trigger trg_ingredients_updated_at
  before update on ingredients
  for each row execute function set_updated_at();

create trigger trg_customers_updated_at
  before update on customers
  for each row execute function set_updated_at();

create trigger trg_orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- 2. Role Helper Functions (Security Definer)
create or replace function current_role_name()
returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid() and is_active = true limit 1;
$$;

create or replace function is_owner()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role = 'owner' from profiles where id = auth.uid() and is_active = true limit 1),
    false
  );
$$;

create or replace function is_staff()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and is_active = true
  );
$$;

-- 3. Trigger otomatis pembuatan baris profil saat user dibuat di auth.users
create or replace function handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_role user_role := 'cashier';
  v_name text;
begin
  if new.raw_user_meta_data->>'role' = 'owner' then
    v_role := 'owner';
  end if;

  v_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  insert into public.profiles (id, full_name, phone, role, is_active)
  values (
    new.id,
    v_name,
    new.raw_user_meta_data->>'phone',
    v_role,
    true
  )
  on conflict (id) do update
  set full_name = excluded.full_name,
      phone = coalesce(excluded.phone, profiles.phone);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 4. Audit otomatis perubahan harga produk
create or replace function audit_product_price_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.base_price <> new.base_price or old.cost_price <> new.cost_price then
    insert into audit_logs (user_id, action, entity, entity_id, old_data, new_data)
    values (
      auth.uid(),
      'product.price_change',
      'products',
      new.id::text,
      jsonb_build_object('base_price', old.base_price, 'cost_price', old.cost_price),
      jsonb_build_object('base_price', new.base_price, 'cost_price', new.cost_price)
    );
  end if;
  return new;
end;
$$;

create trigger trg_audit_product_price
  after update of base_price, cost_price on products
  for each row execute function audit_product_price_change();

-- 5. Immutability check pada orders yang sudah completed/void
create or replace function check_order_immutability()
returns trigger
language plpgsql as $$
begin
  if old.status in ('completed', 'void') and new.status = old.status then
    if old.total <> new.total or old.subtotal <> new.subtotal or old.paid_amount <> new.paid_amount then
      raise exception 'Pesanan yang telah selesai atau dibatalkan bersifat immutable dan tidak boleh diubah nilainya.';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_orders_immutability
  before update on orders
  for each row execute function check_order_immutability();
