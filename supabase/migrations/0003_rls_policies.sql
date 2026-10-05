-- ==============================================================================
-- 0003_rls_policies.sql
-- Penegakan Row Level Security (RLS) di SEMUA 18 Tabel
-- ==============================================================================

-- 1. Enable RLS di SEMUA tabel
alter table profiles enable row level security;
alter table store_settings enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table modifier_groups enable row level security;
alter table modifiers enable row level security;
alter table product_modifier_groups enable row level security;
alter table ingredients enable row level security;
alter table recipes enable row level security;
alter table customers enable row level security;
alter table discounts enable row level security;
alter table shifts enable row level security;
alter table daily_counters enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_item_modifiers enable row level security;
alter table payments enable row level security;
alter table expenses enable row level security;
alter table stock_movements enable row level security;
alter table audit_logs enable row level security;

-- 2. profiles
create policy "profiles_select_policy" on profiles
  for select using (
    is_owner() or id = auth.uid()
  );

create policy "profiles_update_policy" on profiles
  for update using (
    is_owner() or id = auth.uid()
  ) with check (
    is_owner() or (id = auth.uid() and role = (select role from profiles where id = auth.uid()))
  );

-- 3. store_settings
create policy "store_settings_select_policy" on store_settings
  for select using (is_staff());

create policy "store_settings_update_policy" on store_settings
  for update using (is_owner()) with check (is_owner());

-- 4. categories
create policy "categories_select_policy" on categories
  for select using (is_staff());

create policy "categories_modify_policy" on categories
  for all using (is_owner()) with check (is_owner());

-- 5. products
create policy "products_select_policy" on products
  for select using (is_staff());

create policy "products_owner_modify_policy" on products
  for all using (is_owner()) with check (is_owner());

-- Kasir hanya boleh mengubah ketersediaan produk (is_available toggle)
create policy "products_cashier_toggle_policy" on products
  for update using (
    is_staff() and not is_owner()
  ) with check (
    is_staff() and not is_owner()
  );

-- 6. product_variants
create policy "product_variants_select_policy" on product_variants
  for select using (is_staff());

create policy "product_variants_modify_policy" on product_variants
  for all using (is_owner()) with check (is_owner());

-- 7. modifier_groups & modifiers
create policy "modifier_groups_select_policy" on modifier_groups
  for select using (is_staff());

create policy "modifier_groups_modify_policy" on modifier_groups
  for all using (is_owner()) with check (is_owner());

create policy "modifiers_select_policy" on modifiers
  for select using (is_staff());

create policy "modifiers_modify_policy" on modifiers
  for all using (is_owner()) with check (is_owner());

create policy "product_modifier_groups_select_policy" on product_modifier_groups
  for select using (is_staff());

create policy "product_modifier_groups_modify_policy" on product_modifier_groups
  for all using (is_owner()) with check (is_owner());

-- 8. ingredients & recipes (Hanya Owner)
create policy "ingredients_owner_policy" on ingredients
  for all using (is_owner()) with check (is_owner());

create policy "recipes_owner_policy" on recipes
  for all using (is_owner()) with check (is_owner());

-- 9. customers
create policy "customers_select_policy" on customers
  for select using (is_staff());

create policy "customers_insert_update_policy" on customers
  for insert with check (is_staff());

create policy "customers_update_policy" on customers
  for update using (is_staff()) with check (is_staff());

create policy "customers_delete_policy" on customers
  for delete using (is_owner());

-- 10. discounts
create policy "discounts_select_policy" on discounts
  for select using (
    is_owner() or (is_staff() and is_active = true)
  );

create policy "discounts_modify_policy" on discounts
  for all using (is_owner()) with check (is_owner());

-- 11. shifts
create policy "shifts_select_policy" on shifts
  for select using (
    is_owner() or cashier_id = auth.uid()
  );

-- 12. orders, order_items, order_item_modifiers, payments (SELECT dibatasi, MUTASI lewat RPC)
create policy "orders_select_policy" on orders
  for select using (
    is_owner() or (
      cashier_id = auth.uid() and (
        shift_id in (select id from shifts where cashier_id = auth.uid() and status = 'open')
        or created_at >= date_trunc('day', now() at time zone 'Asia/Jakarta')
      )
    )
  );

create policy "order_items_select_policy" on order_items
  for select using (
    exists (select 1 from orders where orders.id = order_items.order_id and (
      is_owner() or orders.cashier_id = auth.uid()
    ))
  );

create policy "order_item_modifiers_select_policy" on order_item_modifiers
  for select using (
    exists (
      select 1 from order_items
      join orders on orders.id = order_items.order_id
      where order_items.id = order_item_modifiers.order_item_id
      and (is_owner() or orders.cashier_id = auth.uid())
    )
  );

create policy "payments_select_policy" on payments
  for select using (
    exists (select 1 from orders where orders.id = payments.order_id and (
      is_owner() or orders.cashier_id = auth.uid()
    ))
  );

-- 13. expenses
create policy "expenses_select_policy" on expenses
  for select using (
    is_owner() or created_by = auth.uid()
  );

create policy "expenses_insert_policy" on expenses
  for insert with check (
    is_owner() or (
      created_by = auth.uid() and
      shift_id in (select id from shifts where cashier_id = auth.uid() and status = 'open')
    )
  );

create policy "expenses_modify_policy" on expenses
  for update using (is_owner()) with check (is_owner());

create policy "expenses_delete_policy" on expenses
  for delete using (is_owner());

-- 14. stock_movements (Hanya Owner membaca, penulisan lewat RPC)
create policy "stock_movements_select_policy" on stock_movements
  for select using (is_owner());

create policy "stock_movements_owner_insert" on stock_movements
  for insert with check (is_owner());

-- 15. audit_logs (Hanya Owner membaca, penulisan lewat trigger)
create policy "audit_logs_select_policy" on audit_logs
  for select using (is_owner());
