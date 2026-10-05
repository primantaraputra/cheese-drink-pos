-- ==============================================================================
-- 0001_initial_schema.sql
-- Inisialisasi Enums, Tabel Inti, Relasi, dan Indeks untuk Cheese Drink POS
-- ==============================================================================

-- 1. Enums
create type user_role as enum ('owner', 'cashier');
create type order_type as enum ('dine_in', 'take_away', 'delivery');
create type order_channel as enum ('walk_in', 'gofood', 'grabfood', 'shopeefood', 'whatsapp', 'other');
create type order_status as enum ('held', 'completed', 'void');
create type payment_method as enum ('cash', 'qris', 'bank_transfer', 'ewallet', 'other');
create type discount_type as enum ('percent', 'fixed');
create type shift_status as enum ('open', 'closed');
create type stock_movement_type as enum ('purchase', 'sale', 'sale_void', 'adjustment', 'waste', 'opening');
create type category_type as enum ('food', 'drink', 'other');
create type modifier_selection as enum ('single', 'multiple');

-- 2. Profil Pengguna (1-1 dengan auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role user_role not null default 'cashier',
  is_active boolean not null default true,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Pengaturan Toko (Singleton, hanya 1 baris id=1)
create table store_settings (
  id int primary key default 1 check (id = 1),
  store_name text not null default 'Cheese Drink',
  tagline text,
  address text,
  phone text,
  logo_url text,
  instagram text,
  receipt_header text,
  receipt_footer text default 'Terima kasih sudah jajan di Cheese Drink!',
  receipt_paper_width int not null default 58 check (receipt_paper_width in (58, 80)),
  show_logo_on_receipt boolean not null default true,
  tax_enabled boolean not null default false,
  tax_percent numeric(5,2) not null default 0,
  tax_inclusive boolean not null default false,
  service_enabled boolean not null default false,
  service_percent numeric(5,2) not null default 0,
  rounding_unit int not null default 100,
  order_prefix text not null default 'CD',
  low_stock_default int not null default 10,
  require_owner_pin_for_void boolean not null default true,
  owner_void_pin_hash text,
  timezone text not null default 'Asia/Jakarta',
  updated_at timestamptz not null default now()
);

-- 4. Kategori Produk
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type category_type not null default 'other',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Produk
create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete restrict,
  name text not null,
  sku text unique,
  description text,
  image_url text,
  base_price numeric(12,0) not null check (base_price >= 0),
  cost_price numeric(12,0) not null default 0 check (cost_price >= 0),
  track_stock boolean not null default false,
  stock_qty numeric(12,2) not null default 0,
  low_stock_threshold numeric(12,2),
  is_available boolean not null default true,
  is_active boolean not null default true,
  is_favorite boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_products_category on products(category_id);
create index idx_products_search on products using gin (to_tsvector('simple', name));
create index idx_products_active_available on products(is_active, is_available);

-- 6. Varian Produk
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  price numeric(12,0) not null check (price >= 0),
  cost_price numeric(12,0) not null default 0,
  sku text unique,
  is_default boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  unique (product_id, name)
);
create index idx_product_variants_product on product_variants(product_id);

-- 7. Grup Modifier & Topping
create table modifier_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  selection modifier_selection not null default 'multiple',
  is_required boolean not null default false,
  min_select int not null default 0,
  max_select int,
  sort_order int not null default 0,
  is_active boolean not null default true
);

-- 8. Modifier / Topping Items
create table modifiers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references modifier_groups(id) on delete cascade,
  name text not null,
  price_delta numeric(12,0) not null default 0,
  cost_delta numeric(12,0) not null default 0,
  is_active boolean not null default true,
  sort_order int not null default 0,
  unique (group_id, name)
);
create index idx_modifiers_group on modifiers(group_id);

-- 9. Pemetaan Produk ke Grup Modifier
create table product_modifier_groups (
  product_id uuid references products(id) on delete cascade,
  group_id uuid references modifier_groups(id) on delete cascade,
  primary key (product_id, group_id)
);

-- 10. Bahan Baku
create table ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  unit text not null,
  stock_qty numeric(14,3) not null default 0,
  min_stock numeric(14,3) not null default 0,
  cost_per_unit numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 11. Resep Produk/Varian
create table recipes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete restrict,
  qty numeric(14,3) not null check (qty > 0)
);
create index idx_recipes_product on recipes(product_id);

-- 12. Pelanggan
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text unique,
  notes text,
  total_spent numeric(14,0) not null default 0,
  visit_count int not null default 0,
  last_visit_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 13. Diskon & Promo
create table discounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  type discount_type not null,
  value numeric(12,2) not null check (value > 0),
  max_discount numeric(12,0),
  min_purchase numeric(12,0) not null default 0,
  start_at timestamptz,
  end_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 14. Shift Kasir
create table shifts (
  id uuid primary key default gen_random_uuid(),
  cashier_id uuid not null references profiles(id),
  status shift_status not null default 'open',
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  opening_cash numeric(12,0) not null default 0,
  expected_cash numeric(12,0),
  actual_cash numeric(12,0),
  cash_difference numeric(12,0),
  note text
);
create unique index one_open_shift_per_cashier on shifts(cashier_id) where status = 'open';

-- 15. Daily Counters (untuk penomoran unik CD-YYMMDD-XXXX bebas race condition)
create table daily_counters (
  counter_date date primary key,
  last_seq int not null default 0
);

-- 16. Pesanan (Orders)
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  queue_no int not null,
  shift_id uuid references shifts(id),
  cashier_id uuid not null references profiles(id),
  customer_id uuid references customers(id),
  customer_name text,
  order_type order_type not null default 'dine_in',
  channel order_channel not null default 'walk_in',
  table_no text,
  status order_status not null default 'held',
  subtotal numeric(12,0) not null default 0,
  discount_id uuid references discounts(id),
  discount_amount numeric(12,0) not null default 0,
  service_amount numeric(12,0) not null default 0,
  tax_amount numeric(12,0) not null default 0,
  rounding_amount numeric(12,0) not null default 0,
  total numeric(12,0) not null default 0,
  paid_amount numeric(12,0) not null default 0,
  change_amount numeric(12,0) not null default 0,
  total_cost numeric(12,0) not null default 0,
  note text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  voided_at timestamptz,
  voided_by uuid references profiles(id),
  void_reason text,
  updated_at timestamptz not null default now()
);
create index idx_orders_created_at on orders(created_at desc);
create index idx_orders_status_created_at on orders(status, created_at desc);
create index idx_orders_shift on orders(shift_id);
create index idx_orders_cashier on orders(cashier_id, created_at desc);

-- 17. Item Pesanan (Order Items - Snapshot)
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,
  product_name text not null,
  variant_name text,
  unit_price numeric(12,0) not null,
  unit_cost numeric(12,0) not null default 0,
  qty int not null check (qty > 0),
  modifiers_total numeric(12,0) not null default 0,
  line_total numeric(12,0) not null,
  note text
);
create index idx_order_items_order on order_items(order_id);
create index idx_order_items_product on order_items(product_id);

-- 18. Modifiers Item Pesanan (Snapshot)
create table order_item_modifiers (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references order_items(id) on delete cascade,
  modifier_id uuid references modifiers(id) on delete set null,
  group_name text,
  name text not null,
  price_delta numeric(12,0) not null default 0
);
create index idx_order_item_modifiers_item on order_item_modifiers(order_item_id);

-- 19. Pembayaran (Payments)
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  method payment_method not null,
  amount numeric(12,0) not null check (amount > 0),
  reference_no text,
  created_at timestamptz not null default now()
);
create index idx_payments_order on payments(order_id);

-- 20. Pengeluaran Operasional (Expenses)
create table expenses (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid references shifts(id),
  expense_date date not null default (now() at time zone 'Asia/Jakarta')::date,
  category text not null,
  description text,
  amount numeric(12,0) not null check (amount > 0),
  paid_from_drawer boolean not null default false,
  receipt_url text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);
create index idx_expenses_date on expenses(expense_date desc);
create index idx_expenses_shift on expenses(shift_id);

-- 21. Pergerakan Stok (Stock Movements)
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  ingredient_id uuid references ingredients(id) on delete cascade,
  type stock_movement_type not null,
  qty_change numeric(14,3) not null,
  balance_after numeric(14,3),
  order_id uuid references orders(id) on delete set null,
  unit_cost numeric(12,2),
  note text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  check ((product_id is not null) <> (ingredient_id is not null))
);
create index idx_stock_movements_product on stock_movements(product_id);
create index idx_stock_movements_ingredient on stock_movements(ingredient_id);

-- 22. Audit Logs
create table audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id),
  action text not null,
  entity text not null,
  entity_id text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
create index idx_audit_logs_created on audit_logs(created_at desc);
