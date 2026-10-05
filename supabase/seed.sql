-- ==============================================================================
-- supabase/seed.sql
-- Data Awal Idempotent untuk Cheese Drink POS
-- ==============================================================================

-- 1. Pengaturan Toko
insert into store_settings (
  id, store_name, tagline, address, phone,
  receipt_header, receipt_footer, receipt_paper_width,
  rounding_unit, order_prefix, low_stock_default,
  require_owner_pin_for_void, timezone
)
values (
  1,
  'Cheese Drink',
  'Nikmatnya Dimsum Gurih & Aneka Minuman Cheese Lumer',
  'Jl. Tebet Raya No. 45, Jakarta Selatan',
  '0812-9876-5432',
  'Selamat Datang di Cheese Drink!',
  'Terima kasih sudah jajan di Cheese Drink!\nFollow IG kami @cheesedrink.id',
  58,
  100,
  'CD',
  10,
  true,
  'Asia/Jakarta'
)
on conflict (id) do nothing;

-- 2. Kategori Produk
insert into categories (id, name, type, sort_order, is_active) values
  ('c1000000-0000-0000-0000-000000000001', 'Dimsum', 'food', 1, true),
  ('c1000000-0000-0000-0000-000000000002', 'Minuman Cheese', 'drink', 2, true),
  ('c1000000-0000-0000-0000-000000000003', 'Minuman Lainnya', 'drink', 3, true),
  ('c1000000-0000-0000-0000-000000000004', 'Snack & Tambahan', 'food', 4, true)
on conflict (name) do nothing;

-- 3. Grup Opsi / Topping (Modifier Groups)
insert into modifier_groups (id, name, selection, is_required, min_select, max_select, sort_order, is_active) values
  ('g1000000-0000-0000-0000-000000000001', 'Topping Minuman', 'multiple', false, 0, 3, 1, true),
  ('g1000000-0000-0000-0000-000000000002', 'Level Es', 'single', true, 1, 1, 2, true),
  ('g1000000-0000-0000-0000-000000000003', 'Level Gula', 'single', true, 1, 1, 3, true),
  ('g1000000-0000-0000-0000-000000000004', 'Pilihan Saus', 'multiple', false, 0, 2, 4, true)
on conflict (name) do nothing;

-- 4. Pilihan Modifier (Modifiers)
insert into modifiers (id, group_id, name, price_delta, cost_delta, sort_order, is_active) values
  -- Topping Minuman
  ('m1000000-0000-0000-0000-000000000001', 'g1000000-0000-0000-0000-000000000001', 'Cheese Foam', 3000, 1200, 1, true),
  ('m1000000-0000-0000-0000-000000000002', 'g1000000-0000-0000-0000-000000000001', 'Boba Brown Sugar', 3000, 1000, 2, true),
  ('m1000000-0000-0000-0000-000000000003', 'g1000000-0000-0000-0000-000000000001', 'Rainbow Jelly', 2000, 800, 3, true),
  ('m1000000-0000-0000-0000-000000000004', 'g1000000-0000-0000-0000-000000000001', 'Oreo Crumb', 3000, 1100, 4, true),

  -- Level Es
  ('m1000000-0000-0000-0000-000000000005', 'g1000000-0000-0000-0000-000000000002', 'Normal Ice', 0, 0, 1, true),
  ('m1000000-0000-0000-0000-000000000006', 'g1000000-0000-0000-0000-000000000002', 'Less Ice', 0, 0, 2, true),
  ('m1000000-0000-0000-0000-000000000007', 'g1000000-0000-0000-0000-000000000002', 'No Ice', 0, 0, 3, true),

  -- Level Gula
  ('m1000000-0000-0000-0000-000000000008', 'g1000000-0000-0000-0000-000000000003', 'Normal Sugar (100%)', 0, 0, 1, true),
  ('m1000000-0000-0000-0000-000000000009', 'g1000000-0000-0000-0000-000000000003', 'Less Sugar (50%)', 0, 0, 2, true),
  ('m1000000-0000-0000-0000-000000000010', 'g1000000-0000-0000-0000-000000000003', 'No Sugar (0%)', 0, 0, 3, true),

  -- Pilihan Saus Dimsum
  ('m1000000-0000-0000-0000-000000000011', 'g1000000-0000-0000-0000-000000000004', 'Saus Sambal Manis', 0, 0, 1, true),
  ('m1000000-0000-0000-0000-000000000012', 'g1000000-0000-0000-0000-000000000004', 'Chili Oil Gurih Pedas', 1000, 400, 2, true),
  ('m1000000-0000-0000-0000-000000000013', 'g1000000-0000-0000-0000-000000000004', 'Saus Mentai Creamy', 2000, 800, 3, true)
on conflict do nothing;

-- 5. Produk
insert into products (id, category_id, name, sku, base_price, cost_price, is_favorite, sort_order) values
  -- Dimsum
  ('p1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Siomay Ayam Original', 'DM-SIOMAY', 15000, 7500, true, 1),
  ('p1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'Hakau Udang Kristal', 'DM-HAKAU', 20000, 11000, true, 2),
  ('p1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'Dimsum Mentai Mozzarella', 'DM-MENTAI', 18000, 9500, true, 3),
  ('p1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'Lumpia Kulit Tahu Crispy', 'DM-LUMPIA', 16000, 8000, false, 4),

  -- Minuman Cheese
  ('p1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002', 'Signature Cheese Tea', 'DR-CH-TEA', 15000, 7000, true, 1),
  ('p1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000002', 'Thai Tea Cheese', 'DR-CH-THAI', 16000, 7500, true, 2),
  ('p1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000002', 'Matcha Cheese Latte', 'DR-CH-MATCHA', 18000, 9000, true, 3),
  ('p1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000002', 'Choco Milo Cheese', 'DR-CH-CHOCO', 17000, 8500, false, 4),

  -- Minuman Segar Lainnya
  ('p1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000003', 'Es Teh Jasmine Manis', 'DR-ES-TEH', 6000, 2000, true, 1),
  ('p1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000003', 'Lemon Tea Segar', 'DR-LEMON-TEA', 10000, 3500, false, 2),
  ('p1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000003', 'Air Mineral Dingin', 'DR-MINERAL', 5000, 2500, false, 3)
on conflict do nothing;

-- 6. Varian Produk
insert into product_variants (id, product_id, name, price, cost_price, is_default, sort_order) values
  -- Siomay Ayam Porsi
  ('v1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'Porsi Isi 3', 15000, 7500, true, 1),
  ('v1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000001', 'Porsi Isi 5', 24000, 12000, false, 2),

  -- Signature Cheese Tea Ukuran
  ('v1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000005', 'Ukuran Reguler (16 oz)', 15000, 7000, true, 1),
  ('v1000000-0000-0000-0000-000000000004', 'p1000000-0000-0000-0000-000000000005', 'Ukuran Large (22 oz)', 18000, 8500, false, 2),

  -- Thai Tea Cheese Ukuran
  ('v1000000-0000-0000-0000-000000000005', 'p1000000-0000-0000-0000-000000000006', 'Ukuran Reguler (16 oz)', 16000, 7500, true, 1),
  ('v1000000-0000-0000-0000-000000000006', 'p1000000-0000-0000-0000-000000000006', 'Ukuran Large (22 oz)', 19000, 9000, false, 2)
on conflict do nothing;

-- 7. Hubungkan Produk dengan Grup Modifier
insert into product_modifier_groups (product_id, group_id) values
  -- Dimsum -> Saus
  ('p1000000-0000-0000-0000-000000000001', 'g1000000-0000-0000-0000-000000000004'),
  ('p1000000-0000-0000-0000-000000000002', 'g1000000-0000-0000-0000-000000000004'),
  ('p1000000-0000-0000-0000-000000000003', 'g1000000-0000-0000-0000-000000000004'),
  ('p1000000-0000-0000-0000-000000000004', 'g1000000-0000-0000-0000-000000000004'),

  -- Minuman Cheese -> Topping, Level Es, Level Gula
  ('p1000000-0000-0000-0000-000000000005', 'g1000000-0000-0000-0000-000000000001'),
  ('p1000000-0000-0000-0000-000000000005', 'g1000000-0000-0000-0000-000000000002'),
  ('p1000000-0000-0000-0000-000000000005', 'g1000000-0000-0000-0000-000000000003'),
  ('p1000000-0000-0000-0000-000000000006', 'g1000000-0000-0000-0000-000000000001'),
  ('p1000000-0000-0000-0000-000000000006', 'g1000000-0000-0000-0000-000000000002'),
  ('p1000000-0000-0000-0000-000000000006', 'g1000000-0000-0000-0000-000000000003')
on conflict do nothing;

-- 8. Diskon / Promo Awal
insert into discounts (id, name, code, type, value, max_discount, min_purchase, is_active) values
  ('d1000000-0000-0000-0000-000000000001', 'Promo Opening 10%', 'OPEN10', 'percent', 10, 10000, 25000, true),
  ('d1000000-0000-0000-0000-000000000002', 'Potongan Hemat 5Rb', 'HEMAT5K', 'fixed', 5000, null, 30000, true)
on conflict (code) do nothing;
