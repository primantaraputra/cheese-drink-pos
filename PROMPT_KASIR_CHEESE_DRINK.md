# MASTER PROMPT — Aplikasi Kasir (POS) Web "Cheese Drink"

> Dokumen ini adalah spesifikasi lengkap. Baca SELURUH dokumen sebelum menulis kode.
> Jika ada hal yang tidak dijelaskan, ambil keputusan paling masuk akal untuk UMKM F&B, catat asumsinya di `docs/ASSUMPTIONS.md`, lalu lanjutkan. **Jangan berhenti untuk bertanya** kecuali ada blocker teknis (mis. kredensial Supabase belum tersedia).

---

## 0. CARA KERJA YANG DIHARAPKAN DARI AGENT

1. Buat **Implementation Plan** + **Task List** dulu berdasarkan Fase di Bagian 18, lalu kerjakan **fase demi fase**.
2. Setiap akhir fase: jalankan `npm run lint`, `npm run typecheck`, `npm run build`. Perbaiki semua error sebelum lanjut.
3. Setiap akhir fase: verifikasi dengan checklist "Acceptance Criteria" di fase tersebut, lalu buat ringkasan singkat (apa yang selesai, apa yang belum).
4. Jangan menaruh data dummy di kode produksi selain lewat file seed (`supabase/seed.sql`).
5. Jangan pernah hardcode secret/API key. Gunakan `.env.local` dan sediakan `.env.example`.
6. Semua teks UI **Bahasa Indonesia**. Semua nama variabel/kode/tabel **Bahasa Inggris**.
7. Kode harus bertipe kuat (TypeScript `strict: true`), tanpa `any` kecuali benar-benar terpaksa (beri komentar alasannya).
8. Jika Supabase MCP / CLI tersedia, gunakan untuk menjalankan migrasi. Jika tidak, tulis semua SQL ke `supabase/migrations/*.sql` berurutan dan beri instruksi menjalankannya di SQL Editor Supabase.

---

## 1. KONTEKS PROYEK

| Item | Isi |
|---|---|
| Nama proyek | **Cheese Drink POS** |
| Konteks akademik | Capstone Project (mitra UMKM nyata) |
| Mitra | UMKM **Cheese Drink** — menjual **aneka dimsum** dan **aneka minuman** (varian keju/cheese drink, teh, kopi, dll.) |
| Masalah mitra | Pencatatan penjualan masih **manual (buku/nota tulis)**: rawan salah hitung, sulit rekap harian/bulanan, tidak tahu produk terlaris, stok tidak terpantau, tidak ada pemisahan kas per shift, dan laporan keuangan sulit dibuat. |
| Solusi | Aplikasi **web kasir (POS)** yang responsif (HP, tablet, desktop), mudah dipakai karyawan non-teknis, dan menghasilkan laporan otomatis untuk pemilik. |
| Pengguna | 1) **Owner/Pemilik** (akses penuh) 2) **Kasir/Karyawan** (akses terbatas) |
| Lokasi/zona waktu | Indonesia, **Asia/Jakarta (WIB, UTC+7)**, mata uang **Rupiah (IDR)** tanpa desimal |

### Tujuan
- Mempercepat transaksi kasir (target ≤ 5 ketukan/klik untuk transaksi sederhana).
- Menghapus pencatatan manual → semua transaksi tersimpan di database.
- Memberi owner laporan penjualan, laba kotor, produk terlaris, dan rekap kas tanpa hitung manual.
- Tetap usable di HP murah dan koneksi internet kurang stabil.

### Di luar lingkup (jangan dibuat)
- Integrasi payment gateway otomatis (Midtrans/Xendit). QRIS/transfer hanya **dicatat manual** sebagai metode bayar.
- Integrasi langsung ke GoFood/GrabFood/ShopeeFood API (cukup dicatat sebagai tipe pesanan / channel).
- Aplikasi native mobile (cukup PWA).
- Multi-cabang (cukup desain agar nanti bisa ditambah; lihat catatan skalabilitas).

---

## 2. TECH STACK (WAJIB)

| Kebutuhan | Pilihan |
|---|---|
| Framework | **Next.js 15+ (App Router)**, React 19, **TypeScript strict** |
| Styling | **Tailwind CSS** (v4 jika stabil, atau v3.4) + **shadcn/ui** (Radix) |
| Ikon | `lucide-react` |
| Backend/DB | **Supabase** (PostgreSQL, Auth, Row Level Security, Realtime, Storage) |
| Klien Supabase | `@supabase/supabase-js` + `@supabase/ssr` (cookie-based session untuk Server Components, Route Handlers, Middleware) |
| Data fetching | Server Components + Server Actions untuk mutasi; **TanStack Query** untuk data interaktif di client (POS, riwayat) |
| State lokal | **Zustand** (keranjang POS, setting UI) dengan persist ke `localStorage` untuk keranjang |
| Form & validasi | **react-hook-form** + **zod** (skema dibagi pakai client & server) |
| Grafik | **Recharts** |
| Tanggal | **date-fns** (+ `date-fns-tz`), locale `id` |
| Notifikasi UI | `sonner` (toast) |
| Tabel | `@tanstack/react-table` |
| Export | `xlsx` (Excel/CSV) dan `jspdf` + `jspdf-autotable` (PDF laporan) |
| Cetak struk | CSS `@media print` ukuran **58mm & 80mm** (thermal) via `window.print()`; opsional Web Bluetooth/ESC-POS sebagai bonus |
| PWA | `@serwist/next` (atau `next-pwa`) — installable, cache aset, halaman offline fallback |
| Package manager | `npm` |
| Linting | ESLint + Prettier (+ `prettier-plugin-tailwindcss`) |
| Test | **Vitest** (unit logika hitung) + **Playwright** (E2E alur kasir utama) |
| Deploy | **Vercel** (frontend) + **Supabase Cloud** (backend) |

---

## 3. PERAN & HAK AKSES (RBAC)

Dua peran, disimpan di `profiles.role` (`owner` | `cashier`) dan **ditegakkan di dua lapis**: (1) middleware/guard di Next.js, (2) **RLS di database**.

| Fitur | Owner | Kasir |
|---|:-:|:-:|
| Login / logout / ganti password sendiri | ✅ | ✅ |
| Buka & tutup shift kasir | ✅ | ✅ (shift miliknya) |
| Transaksi POS (buat pesanan, bayar, cetak struk) | ✅ | ✅ |
| Hold/parkir pesanan, lanjutkan pesanan | ✅ | ✅ |
| Lihat riwayat transaksi | ✅ semua | ✅ **hanya miliknya & hari ini / shift aktif** |
| Void/batalkan transaksi | ✅ langsung | ⚠️ hanya **mengajukan** (atau butuh PIN owner) — lihat Bagian 9.7 |
| Kelola produk, kategori, varian, topping | ✅ | ❌ (lihat saja) |
| Ubah ketersediaan produk (habis/tersedia) | ✅ | ✅ (toggle cepat "Habis") |
| Kelola stok & penyesuaian stok | ✅ | ❌ (lihat saja) |
| Catat pengeluaran | ✅ | ✅ (hanya saat shift aktif, kategori terbatas) |
| Kelola pelanggan | ✅ | ✅ (tambah/cari saja) |
| Kelola diskon/promo | ✅ | ❌ (hanya memakai) |
| Dashboard & Laporan lengkap | ✅ | ❌ (hanya ringkasan shift sendiri) |
| Kelola pengguna (tambah kasir, nonaktifkan, reset password) | ✅ | ❌ |
| Pengaturan toko & struk | ✅ | ❌ |
| Audit log | ✅ | ❌ |

Aturan tambahan:
- Akun tidak bisa mendaftar sendiri (**tidak ada halaman register publik**). Owner membuat akun kasir dari menu Pengguna (gunakan Supabase Admin API di **server-side only** dengan `SUPABASE_SERVICE_ROLE_KEY`).
- Akun dengan `is_active = false` tidak boleh login/mengakses apa pun (cek di middleware & RLS).
- Akun owner pertama dibuat lewat **script seed / instruksi manual** (dokumentasikan di README).

---

## 4. ARSITEKTUR & STRUKTUR FOLDER

```
cheese-drink-pos/
├─ src/
│  ├─ app/
│  │  ├─ (auth)/
│  │  │  ├─ login/page.tsx
│  │  │  └─ layout.tsx
│  │  ├─ (app)/                      # area terproteksi
│  │  │  ├─ layout.tsx               # shell: sidebar (desktop) / bottom-nav (mobile) + topbar
│  │  │  ├─ dashboard/page.tsx
│  │  │  ├─ pos/page.tsx             # layar kasir utama
│  │  │  ├─ orders/
│  │  │  │  ├─ page.tsx              # riwayat transaksi
│  │  │  │  └─ [id]/page.tsx         # detail + cetak ulang + void
│  │  │  ├─ held-orders/page.tsx     # pesanan diparkir
│  │  │  ├─ shifts/
│  │  │  │  ├─ page.tsx              # daftar shift
│  │  │  │  └─ [id]/page.tsx         # detail & rekap shift
│  │  │  ├─ products/
│  │  │  │  ├─ page.tsx
│  │  │  │  ├─ new/page.tsx
│  │  │  │  └─ [id]/edit/page.tsx
│  │  │  ├─ categories/page.tsx
│  │  │  ├─ modifiers/page.tsx       # topping/opsi tambahan
│  │  │  ├─ inventory/
│  │  │  │  ├─ page.tsx              # stok produk & bahan baku
│  │  │  │  └─ movements/page.tsx    # riwayat pergerakan stok
│  │  │  ├─ expenses/page.tsx
│  │  │  ├─ customers/page.tsx
│  │  │  ├─ discounts/page.tsx
│  │  │  ├─ reports/
│  │  │  │  ├─ page.tsx              # hub laporan
│  │  │  │  ├─ sales/page.tsx
│  │  │  │  ├─ products/page.tsx
│  │  │  │  ├─ payments/page.tsx
│  │  │  │  ├─ cashiers/page.tsx
│  │  │  │  ├─ profit/page.tsx
│  │  │  │  └─ cash/page.tsx
│  │  │  ├─ users/page.tsx
│  │  │  ├─ settings/
│  │  │  │  ├─ store/page.tsx
│  │  │  │  ├─ receipt/page.tsx
│  │  │  │  └─ profile/page.tsx
│  │  │  └─ audit-logs/page.tsx
│  │  ├─ offline/page.tsx
│  │  ├─ api/                        # route handler (export, print, admin-only)
│  │  ├─ layout.tsx
│  │  ├─ globals.css
│  │  └─ manifest.ts
│  ├─ components/
│  │  ├─ ui/                         # shadcn
│  │  ├─ layout/                     # Sidebar, BottomNav, Topbar, PageHeader
│  │  ├─ pos/                        # ProductGrid, CartPanel, VariantDialog, PaymentDialog, NumPad, Receipt
│  │  ├─ shared/                     # DataTable, EmptyState, ConfirmDialog, CurrencyInput, DateRangePicker
│  │  └─ charts/
│  ├─ lib/
│  │  ├─ supabase/{client,server,admin,middleware}.ts
│  │  ├─ utils/{currency,date,order-number,calc}.ts
│  │  ├─ validators/                 # zod schemas
│  │  ├─ constants.ts
│  │  └─ permissions.ts
│  ├─ actions/                       # server actions per modul
│  ├─ hooks/
│  ├─ stores/                        # zustand (cart.store.ts, ui.store.ts)
│  ├─ types/                         # database.types.ts (generated) + domain types
│  └─ middleware.ts
├─ supabase/
│  ├─ migrations/                    # 0001_init.sql, 0002_rls.sql, 0003_functions.sql, ...
│  ├─ seed.sql
│  └─ config.toml
├─ tests/{unit,e2e}/
├─ docs/{ASSUMPTIONS.md,ERD.md,USER_GUIDE.md,DEPLOYMENT.md}
├─ public/{icons,logo}
├─ .env.example
└─ README.md
```

Prinsip arsitektur:
- **Semua perhitungan uang final dilakukan di database (RPC/Postgres function)**, bukan dipercaya dari client. Client boleh menghitung untuk preview, tetapi server menghitung ulang.
- Gunakan **Server Actions** atau **RPC** untuk mutasi; validasi zod di sisi server.
- Pisahkan "snapshot" data transaksi (nama produk, harga saat transaksi) agar perubahan harga di masa depan **tidak mengubah riwayat**.
- Gunakan `numeric(12,0)` untuk uang (Rupiah tanpa desimal), **jangan float**.

---

## 5. SKEMA DATABASE (SUPABASE / POSTGRES)

Buat sebagai migrasi berurutan. Semua tabel memiliki `created_at timestamptz default now()`; tabel yang bisa diedit punya `updated_at` dengan trigger `set_updated_at()`. Primary key `uuid default gen_random_uuid()` kecuali dinyatakan lain.

### 5.1 Enum
```sql
create type user_role as enum ('owner','cashier');
create type order_type as enum ('dine_in','take_away','delivery');
create type order_channel as enum ('walk_in','gofood','grabfood','shopeefood','whatsapp','other');
create type order_status as enum ('held','completed','void');
create type payment_method as enum ('cash','qris','bank_transfer','ewallet','other');
create type discount_type as enum ('percent','fixed');
create type shift_status as enum ('open','closed');
create type stock_movement_type as enum ('purchase','sale','sale_void','adjustment','waste','opening');
create type category_type as enum ('food','drink','other');
create type modifier_selection as enum ('single','multiple');
```

### 5.2 Tabel inti

```sql
-- Profil pengguna (1-1 dengan auth.users)
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

-- Pengaturan toko (singleton, hanya 1 baris)
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
  receipt_paper_width int not null default 58 check (receipt_paper_width in (58,80)),
  show_logo_on_receipt boolean not null default true,
  tax_enabled boolean not null default false,
  tax_percent numeric(5,2) not null default 0,
  tax_inclusive boolean not null default false,
  service_enabled boolean not null default false,
  service_percent numeric(5,2) not null default 0,
  rounding_unit int not null default 100,          -- pembulatan ke Rp100 (0 = nonaktif)
  order_prefix text not null default 'CD',
  low_stock_default int not null default 10,
  require_owner_pin_for_void boolean not null default true,
  owner_void_pin_hash text,                        -- hash PIN (bcrypt via pgcrypto), jangan simpan plaintext
  timezone text not null default 'Asia/Jakarta',
  updated_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type category_type not null default 'other',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete restrict,
  name text not null,
  sku text unique,
  description text,
  image_url text,
  base_price numeric(12,0) not null check (base_price >= 0),
  cost_price numeric(12,0) not null default 0 check (cost_price >= 0), -- HPP
  track_stock boolean not null default false,
  stock_qty numeric(12,2) not null default 0,
  low_stock_threshold numeric(12,2),
  is_available boolean not null default true,   -- toggle cepat "Habis" oleh kasir
  is_active boolean not null default true,      -- soft delete / arsip
  is_favorite boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on products(category_id);
create index on products using gin (to_tsvector('simple', name));
create index on products(is_active, is_available);

-- Varian ukuran/porsi: mis. Reguler/Large, Isi 3/Isi 6
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  price numeric(12,0) not null check (price >= 0),   -- harga FINAL varian (bukan delta)
  cost_price numeric(12,0) not null default 0,
  sku text unique,
  is_default boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  unique (product_id, name)
);

-- Grup opsi/topping: mis. "Topping", "Level Gula", "Saus Dimsum"
create table modifier_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  selection modifier_selection not null default 'multiple',
  is_required boolean not null default false,
  min_select int not null default 0,
  max_select int,                      -- null = tanpa batas
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table modifiers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references modifier_groups(id) on delete cascade,
  name text not null,
  price_delta numeric(12,0) not null default 0,   -- tambahan harga
  cost_delta numeric(12,0) not null default 0,
  is_active boolean not null default true,
  sort_order int not null default 0,
  unique (group_id, name)
);

create table product_modifier_groups (
  product_id uuid references products(id) on delete cascade,
  group_id uuid references modifier_groups(id) on delete cascade,
  primary key (product_id, group_id)
);

-- Bahan baku (opsional, untuk stok bahan & resep)
create table ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  unit text not null,                  -- gram, ml, pcs, pack
  stock_qty numeric(14,3) not null default 0,
  min_stock numeric(14,3) not null default 0,
  cost_per_unit numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table recipes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete restrict,
  qty numeric(14,3) not null check (qty > 0)
);

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

create table discounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  type discount_type not null,
  value numeric(12,2) not null check (value > 0),
  max_discount numeric(12,0),                 -- batas diskon untuk tipe percent
  min_purchase numeric(12,0) not null default 0,
  start_at timestamptz,
  end_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table shifts (
  id uuid primary key default gen_random_uuid(),
  cashier_id uuid not null references profiles(id),
  status shift_status not null default 'open',
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  opening_cash numeric(12,0) not null default 0,       -- modal awal laci
  expected_cash numeric(12,0),                         -- dihitung sistem saat tutup
  actual_cash numeric(12,0),                           -- hitungan fisik kasir
  cash_difference numeric(12,0),                       -- actual - expected
  note text
);
-- Satu kasir hanya boleh punya 1 shift terbuka
create unique index one_open_shift_per_cashier on shifts(cashier_id) where status = 'open';

create table daily_counters (
  counter_date date primary key,
  last_seq int not null default 0
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,                 -- CD-260502-0001
  queue_no int not null,                         -- nomor antrean harian (reset tiap hari)
  shift_id uuid references shifts(id),
  cashier_id uuid not null references profiles(id),
  customer_id uuid references customers(id),
  customer_name text,                            -- nama bebas (tanpa perlu terdaftar)
  order_type order_type not null default 'dine_in',
  channel order_channel not null default 'walk_in',
  table_no text,
  status order_status not null default 'held',
  subtotal numeric(12,0) not null default 0,
  discount_id uuid references discounts(id),
  discount_amount numeric(12,0) not null default 0,
  service_amount numeric(12,0) not null default 0,
  tax_amount numeric(12,0) not null default 0,
  rounding_amount numeric(12,0) not null default 0,   -- bisa negatif
  total numeric(12,0) not null default 0,
  paid_amount numeric(12,0) not null default 0,
  change_amount numeric(12,0) not null default 0,
  total_cost numeric(12,0) not null default 0,        -- total HPP (untuk laba kotor)
  note text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  voided_at timestamptz,
  voided_by uuid references profiles(id),
  void_reason text,
  updated_at timestamptz not null default now()
);
create index on orders(created_at desc);
create index on orders(status, created_at desc);
create index on orders(shift_id);
create index on orders(cashier_id, created_at desc);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,
  product_name text not null,            -- SNAPSHOT
  variant_name text,                     -- SNAPSHOT
  unit_price numeric(12,0) not null,     -- harga varian/dasar saat transaksi
  unit_cost numeric(12,0) not null default 0,
  qty int not null check (qty > 0),
  modifiers_total numeric(12,0) not null default 0,   -- total tambahan per 1 unit
  line_total numeric(12,0) not null,                  -- (unit_price + modifiers_total) * qty
  note text
);
create index on order_items(order_id);
create index on order_items(product_id);

create table order_item_modifiers (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references order_items(id) on delete cascade,
  modifier_id uuid references modifiers(id) on delete set null,
  group_name text,                       -- SNAPSHOT
  name text not null,                    -- SNAPSHOT
  price_delta numeric(12,0) not null default 0
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  method payment_method not null,
  amount numeric(12,0) not null check (amount > 0),
  reference_no text,                     -- no. referensi QRIS/transfer (opsional)
  created_at timestamptz not null default now()
);
create index on payments(order_id);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid references shifts(id),
  expense_date date not null default (now() at time zone 'Asia/Jakarta')::date,
  category text not null,                -- Bahan Baku, Gas, Listrik, Gaji, Kemasan, Lain-lain
  description text,
  amount numeric(12,0) not null check (amount > 0),
  paid_from_drawer boolean not null default false,   -- true = mengurangi kas laci shift
  receipt_url text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  ingredient_id uuid references ingredients(id) on delete cascade,
  type stock_movement_type not null,
  qty_change numeric(14,3) not null,     -- + masuk, - keluar
  balance_after numeric(14,3),
  order_id uuid references orders(id) on delete set null,
  unit_cost numeric(12,2),
  note text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  check ((product_id is not null) <> (ingredient_id is not null))  -- salah satu saja
);

create table audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id),
  action text not null,                  -- 'order.void', 'product.price_change', 'user.deactivate', dll
  entity text not null,
  entity_id text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
create index on audit_logs(created_at desc);
```

### 5.3 Helper functions & trigger (wajib)
```sql
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
-- pasang trigger BEFORE UPDATE di semua tabel yang punya updated_at

create or replace function current_role_name() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid() and is_active = true
$$;

create or replace function is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'owner' from profiles where id = auth.uid() and is_active), false)
$$;

create or replace function is_staff() returns boolean   -- owner atau kasir aktif
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and is_active)
$$;
```
- Trigger `on auth.users insert` → otomatis buat baris `profiles` (ambil `full_name` & `role` dari `raw_user_meta_data`; default `cashier`).
- Trigger audit otomatis untuk perubahan **harga produk**, **status aktif user**, dan **void order**.
- Trigger/aturan: `orders` yang `completed`/`void` **tidak boleh diubah** field uang-nya (immutable) kecuali lewat fungsi `void_order`.

### 5.4 RPC / Postgres function yang WAJIB dibuat (`security definer`, `set search_path = public`)

1. **`open_shift(p_opening_cash numeric)`** → buat shift; gagal jika kasir sudah punya shift terbuka.
2. **`close_shift(p_shift_id uuid, p_actual_cash numeric, p_note text)`** →
   `expected_cash = opening_cash + total pembayaran cash (order completed di shift) − pengeluaran paid_from_drawer`; simpan `cash_difference`; ubah status `closed`. Gagal jika masih ada order `held` di shift (atau minta dipindah/dibatalkan — tampilkan peringatan jelas).
3. **`create_order(payload jsonb)`** — **atomik dalam satu transaksi**, melakukan:
   1. Validasi pemanggil adalah staf aktif & punya shift `open` (kecuali owner mengaktifkan opsi "boleh tanpa shift" — default: **wajib shift**).
   2. Ambil harga **dari database** (bukan dari payload) untuk setiap `product_id`/`variant_id`/`modifier_id`; tolak jika produk tidak aktif/`is_available = false`.
   3. Validasi aturan modifier group (required/min/max/selection).
   4. Hitung `subtotal`, diskon (validasi periode, min_purchase, max_discount), service, pajak (inclusive/exclusive sesuai setting), **pembulatan** (ke `rounding_unit`), `total`, `total_cost`.
   5. Generate `order_no` & `queue_no` secara **aman dari race condition** memakai `daily_counters` (`insert ... on conflict (counter_date) do update set last_seq = daily_counters.last_seq + 1 returning last_seq`). Tanggal berdasarkan zona waktu Asia/Jakarta.
   6. Jika `payload.mode = 'hold'` → status `held` (belum ada pembayaran, stok belum berkurang).
      Jika `payload.mode = 'pay'` → validasi total pembayaran ≥ total, simpan ke `payments`, hitung `change_amount` (kembalian hanya dari porsi tunai), status `completed`, set `paid_at`.
   7. Saat `completed`: kurangi stok (`products.stock_qty` bila `track_stock`, dan/atau bahan baku via `recipes`) + tulis `stock_movements` bertipe `sale`; update `customers` (`total_spent`, `visit_count`, `last_visit_at`).
   8. Return `jsonb` berisi order lengkap (id, order_no, queue_no, total, change, dll).
4. **`pay_held_order(p_order_id uuid, p_payments jsonb, p_discount_id uuid, ...)`** → melunasi pesanan `held` (hitung ulang harga terbaru atau pertahankan snapshot — **pertahankan snapshot harga saat dibuat**, tampilkan peringatan jika harga produk sudah berubah).
5. **`update_held_order(p_order_id uuid, payload jsonb)`** → ubah isi pesanan `held`.
6. **`void_order(p_order_id uuid, p_reason text, p_pin text default null)`** → hanya untuk order `completed`: validasi (owner langsung / kasir wajib PIN owner bila `require_owner_pin_for_void`), set status `void`, simpan alasan & pelaku, **kembalikan stok** (`sale_void`), kurangi statistik pelanggan, tulis `audit_logs`. Alasan **wajib** (min 5 karakter).
7. **`set_owner_void_pin(p_new_pin text)`** → simpan hash (`crypt(p_pin, gen_salt('bf'))`).
8. **Fungsi laporan** (semua hanya owner, kecuali `get_shift_summary` boleh kasir untuk shift miliknya):
   - `get_sales_summary(p_from timestamptz, p_to timestamptz)` → total penjualan, jumlah transaksi, rata-rata nilai transaksi, total diskon, total pajak, laba kotor.
   - `get_sales_by_day(p_from, p_to)` / `get_sales_by_hour(p_from, p_to)` (jam sibuk).
   - `get_top_products(p_from, p_to, p_limit)` → qty & omzet per produk (+ kontribusi %).
   - `get_sales_by_category(p_from, p_to)`.
   - `get_sales_by_payment_method(p_from, p_to)`.
   - `get_sales_by_cashier(p_from, p_to)`.
   - `get_profit_summary(p_from, p_to)` → omzet − HPP − pengeluaran = laba bersih sederhana.
   - `get_shift_summary(p_shift_id)`.
   Semua laporan hanya menghitung order `status = 'completed'` dan memakai batas hari berdasarkan **Asia/Jakarta**.

### 5.5 Row Level Security (WAJIB aktif di SEMUA tabel)

Aturan umum — **enable RLS di semua tabel**, lalu:

| Tabel | SELECT | INSERT/UPDATE/DELETE |
|---|---|---|
| profiles | user lihat profil sendiri; owner lihat semua | owner (kecuali ubah profil sendiri non-role) |
| store_settings | semua staf aktif | owner |
| categories, products, product_variants, modifier_groups, modifiers, product_modifier_groups | semua staf aktif | owner (+ kasir hanya boleh update `products.is_available`) |
| ingredients, recipes | owner | owner |
| customers | semua staf aktif | semua staf aktif (INSERT/UPDATE), DELETE owner |
| discounts | semua staf aktif (yang aktif) | owner |
| shifts | owner semua; kasir hanya miliknya | lewat RPC saja |
| orders, order_items, order_item_modifiers, payments | owner semua; kasir hanya miliknya & dalam shift aktifnya/hari ini | **hanya lewat RPC** (tidak ada policy insert/update langsung dari client) |
| expenses | owner semua; kasir miliknya | owner semua; kasir insert miliknya saat shift aktif |
| stock_movements | owner | RPC/owner |
| audit_logs | owner | tidak ada (hanya trigger/RPC) |

- Tulis policy **eksplisit dan teruji**; sertakan file `supabase/tests/rls.sql` atau skrip yang membuktikan: kasir **tidak bisa** membaca laporan/transaksi kasir lain, dan tidak bisa mengubah produk/harga.
- Jangan pernah memakai `service_role` di kode client. Hanya di `lib/supabase/admin.ts` untuk server action pembuatan user.

### 5.6 Storage
- Bucket `product-images` (public read, write owner only), batas ukuran 2 MB, tipe `image/jpeg|png|webp`.
- Bucket `store-assets` (logo), bucket `expense-receipts` (private; akses owner & pembuat).
- Kompres/resize gambar di client sebelum upload (maks sisi 800px).

### 5.7 Realtime
- Aktifkan Realtime pada `orders` & `products.is_available` agar daftar pesanan diparkir & status "Habis" ter-update di semua perangkat tanpa refresh.

---

## 6. ATURAN BISNIS & PERHITUNGAN (SUMBER KEBENARAN)

```
line_total      = (unit_price + sum(modifier.price_delta)) * qty
subtotal        = Σ line_total
discount_amount = tipe percent: min(subtotal * value/100, max_discount ?? ∞)
                  tipe fixed  : min(value, subtotal)
dpp             = subtotal - discount_amount
service_amount  = service_enabled ? round(dpp * service_percent/100) : 0
tax_amount (exclusive) = tax_enabled ? round((dpp + service_amount) * tax_percent/100) : 0
tax_amount (inclusive) = tax_enabled ? round(total_before_round * tax_percent/(100+tax_percent)) : 0  -- hanya info, tidak menambah total
total_before_round = dpp + service_amount + (tax exclusive ? tax_amount : 0)
rounding_amount = rounding_unit > 0 ? round_to_nearest(total_before_round, rounding_unit) - total_before_round : 0
total           = total_before_round + rounding_amount
change_amount   = max(0, cash_paid_total - (total - non_cash_paid_total))   -- kembalian hanya dari tunai
```
Aturan penting:
- Semua angka bulat Rupiah. Pembulatan: *round half up*.
- Uang diterima tidak boleh kurang dari total. Pembayaran **campuran (split payment)** didukung (mis. sebagian tunai + sebagian QRIS). Pembayaran non-tunai **tidak boleh melebihi** sisa tagihan.
- Diskon hanya 1 per transaksi (v1).
- Transaksi `completed` **tidak bisa diedit**. Koreksi = **void** lalu buat transaksi baru.
- Harga & nama di `order_items` adalah **snapshot**.
- Produk `is_available = false` tidak bisa dimasukkan keranjang (tampilkan badge "Habis", tombol disabled).
- Produk `track_stock = true` dengan stok ≤ 0: tampilkan peringatan; owner bisa mengatur apakah boleh jual saat stok 0 (setting `allow_negative_stock`, default `false`).
- Nomor struk `CD-YYMMDD-0001` (reset urut tiap hari WIB). `queue_no` juga reset tiap hari.
- Laba kotor = Σ(line_total) − Σ(unit_cost*qty) (+ modifier cost). Jika HPP belum diisi, tampilkan laporan laba dengan catatan "HPP belum lengkap".

---

## 7. DESAIN UI/UX

### 7.1 Prinsip
- **Mobile-first, responsif penuh**. Breakpoint utama: HP (<640px), tablet (640–1024px, **mode kasir utama**), desktop (>1024px).
- Dirancang untuk **karyawan non-teknis**: label jelas, tombol besar (min tinggi **44px**), kontras tinggi, tidak ada istilah teknis.
- Cepat: skeleton loading, optimistic update di keranjang, tidak ada reload penuh saat tambah item.
- Konsisten: gunakan komponen shadcn/ui, `PageHeader`, `EmptyState`, `ConfirmDialog` yang sama di semua halaman.
- Aksesibilitas: label form, fokus terlihat, navigasi keyboard (desktop), `aria-*` pada dialog, kontras WCAG AA.

### 7.2 Identitas visual
- Tema "keju": primer **kuning-oranye keju** (mis. `#F5A623` / `#FFB703`), aksen **krem hangat** (`#FFF8E7`), teks **cokelat tua** (`#3B2A1A`), sukses hijau, bahaya merah.
- Tentukan token warna di CSS variables (`--primary`, `--background`, dst.) agar mudah diganti.
- Font: **Inter** atau **Plus Jakarta Sans** (via `next/font`).
- **Dark mode** (toggle di topbar, simpan preferensi).
- Sudut membulat (radius 12px), bayangan lembut, ikon konsisten (lucide).
- Logo placeholder teks "Cheese Drink" + ikon keju/gelas (bisa diganti dari Pengaturan).

### 7.3 Navigasi
- **Desktop/tablet landscape**: Sidebar kiri yang bisa collapse (ikon + label), topbar (nama toko, status shift, toggle tema, menu profil).
- **HP**: **Bottom navigation** 4–5 item (POS, Pesanan, Laporan/Ringkasan, Produk, Menu lainnya) + drawer "Lainnya".
- Menu disaring otomatis berdasarkan role (kasir tidak melihat menu owner).
- Indikator **status koneksi** (online/offline) di topbar.

### 7.4 Layar POS (paling penting)
**Tablet/Desktop (2 kolom)**:
- Kiri (±62%): bar pencarian (cepat, debounce), **tab kategori** (Semua, Favorit, Dimsum, Minuman, …) yang bisa discroll horizontal, **grid produk** (kartu: foto/placeholder, nama, harga, badge "Habis"/"Stok menipis").
- Kanan (±38%): **Panel Keranjang** (sticky): pilihan tipe pesanan (Makan di tempat / Bawa pulang / Delivery), nomor meja/nama pelanggan (opsional), daftar item (qty +/−, catatan item, hapus), baris ringkasan (subtotal, diskon, service, pajak, pembulatan, **TOTAL** besar), tombol **Simpan/Parkir** dan **Bayar**.

**HP (1 kolom)**:
- Grid produk 2 kolom, tab kategori di atas, **tombol melayang "Keranjang (n) • Rp xx.xxx"** di bawah yang membuka **bottom sheet** keranjang penuh.

Interaksi:
- Tap produk tanpa varian/opsi → langsung masuk keranjang (qty +1). Jika ada varian/opsi → buka **dialog pilih varian & topping** (radio untuk single, checkbox untuk multiple, validasi required, input qty, catatan).
- Item identik (produk+varian+opsi+catatan sama) digabung, qty bertambah.
- **Dialog Pembayaran**: tampil total; pilih metode (Tunai, QRIS, Transfer, E-Wallet); untuk tunai: **numpad**, tombol **uang pas** dan **nominal cepat** (mis. 5rb, 10rb, 20rb, 50rb, 100rb), kembalian dihitung realtime; mendukung **split payment**; tombol "Selesaikan".
- Setelah sukses: **layar Berhasil** (nomor antrean besar, kembalian, tombol **Cetak Struk**, **Bagikan via WhatsApp** (teks ringkas lewat `wa.me`), **Transaksi Baru**).
- Pintasan keyboard desktop: `/` fokus pencarian, `F2` bayar, `Esc` tutup dialog.
- Mencegah kehilangan data: keranjang disimpan di localStorage; konfirmasi bila pindah halaman dengan keranjang terisi.
- Jika **belum ada shift terbuka**, POS menampilkan **gerbang "Buka Shift"** (input modal awal) sebelum bisa bertransaksi.

### 7.5 Halaman lain (ringkas, tetapi lengkap)
- **Login**: email + password, "tampilkan password", pesan error ramah, redirect sesuai role. Tampilan elegan dengan logo.
- **Dashboard (owner)**: kartu KPI (Penjualan hari ini, Jumlah transaksi, Rata-rata/transaksi, Laba kotor hari ini, Pengeluaran hari ini), perbandingan vs kemarin (% naik/turun), grafik penjualan 7/30 hari, **jam tersibuk**, **Top 5 produk**, komposisi metode bayar (donut), peringatan stok menipis, status shift aktif. **Dashboard (kasir)**: ringkasan shift sendiri + pintasan ke POS.
- **Riwayat Pesanan**: tabel (desktop) / kartu (HP), filter tanggal (preset: Hari ini, Kemarin, 7 hari, Bulan ini, Kustom), status, metode bayar, kasir (owner), pencarian no. struk/nama pelanggan, pagination server-side, badge status berwarna. **Detail pesanan**: rincian, pembayaran, jejak void, tombol cetak ulang, tombol void.
- **Pesanan Diparkir**: daftar kartu, tombol Lanjutkan / Bayar / Hapus; realtime.
- **Shift**: tombol Buka/Tutup shift; layar tutup shift menampilkan rekap (total per metode bayar, kas diharapkan, input kas fisik, selisih berwarna, catatan) + **cetak rekap shift**.
- **Produk**: tabel + pencarian + filter kategori/status, tambah/edit (nama, kategori, SKU, harga, HPP, foto, deskripsi, varian dinamis, hubungkan grup topping, lacak stok, ambang stok), toggle aktif/habis, **duplikat produk**, urutkan. Arsip (soft delete) bukan hapus permanen jika sudah pernah dipakai di transaksi.
- **Kategori**, **Topping/Opsi**: CRUD sederhana + urutan (drag-drop atau tombol naik/turun).
- **Inventori**: stok produk & bahan baku, filter "menipis/habis", form **Barang Masuk (pembelian)**, **Penyesuaian** (stok opname dengan alasan), **Waste/Rusak**, riwayat pergerakan.
- **Pengeluaran**: input cepat (kategori, nominal, catatan, foto nota opsional), daftar & filter, total per kategori.
- **Pelanggan**: daftar, cari, tambah cepat dari POS, riwayat belanja per pelanggan.
- **Diskon/Promo**: CRUD, aktif/nonaktif, periode.
- **Laporan** (lihat Bagian 8).
- **Pengguna** (owner): tambah kasir (nama, email, password awal), ubah role (hati-hati), nonaktifkan/aktifkan, reset password, ganti PIN void.
- **Pengaturan**: Profil toko, Struk (pratinjau live), Pajak/Service/Pembulatan, Printer (ukuran kertas), Preferensi.
- **Audit Log**: tabel kronologis dengan filter aksi/pengguna/tanggal, lihat perubahan (old/new).

### 7.6 Status kosong, error, loading
- Setiap daftar punya **empty state** yang informatif dengan tombol aksi.
- Setiap halaman punya `loading.tsx` (skeleton) dan `error.tsx` (pesan ramah + tombol coba lagi); `not-found.tsx` kustom.
- Semua aksi destruktif memakai **ConfirmDialog**.
- Toast untuk sukses/gagal; pesan error **bahasa Indonesia** dan spesifik (bukan "Something went wrong").

---

## 8. LAPORAN & EXPORT

Semua laporan: filter rentang tanggal (preset + kustom), tampil **tabel + grafik**, tombol **Export Excel (.xlsx)**, **CSV**, dan **PDF**, serta tombol Cetak.

1. **Laporan Penjualan**: per hari/minggu/bulan; total omzet, jumlah transaksi, rata-rata, diskon, pajak; grafik garis/batang; tabel daftar transaksi.
2. **Laporan Produk**: produk terlaris (qty & omzet), produk kurang laku, kontribusi per kategori (Dimsum vs Minuman), analisis varian & topping terlaris.
3. **Laporan Metode Pembayaran**: total per metode, persentase.
4. **Laporan Kasir**: transaksi & omzet per kasir, jumlah void.
5. **Laporan Laba Rugi Sederhana**: Omzet − Diskon − HPP = Laba kotor; − Pengeluaran per kategori = **Laba bersih**; grafik per periode.
6. **Laporan Kas/Shift**: daftar shift, modal awal, penjualan tunai, pengeluaran, selisih kas.
7. **Laporan Stok**: stok saat ini, nilai persediaan, riwayat pergerakan, barang menipis.
8. **Jam Sibuk**: heatmap/bar penjualan per jam & per hari dalam seminggu (membantu jadwal karyawan).

Aturan: hanya order `completed` dihitung; void ditampilkan terpisah. Format angka `Rp 1.234.567`, tanggal `02 Mei 2026, 14:30` (WIB).

---

## 9. FITUR DETAIL TAMBAHAN (JANGAN TERLEWAT)

### 9.1 Struk / Receipt
- Komponen `<Receipt />` untuk kertas **58mm & 80mm** (dari setting), font monospace, lebar presisi, tanpa margin berlebih.
- Isi: logo (opsional), nama toko, alamat, telepon, no. struk, **nomor antrean (besar)**, tanggal-jam, kasir, tipe pesanan/meja, daftar item (nama, varian, topping, qty × harga, subtotal), subtotal, diskon, service, pajak, pembulatan, **TOTAL**, metode bayar, tunai, kembalian, catatan, footer kustom.
- Tombol: Cetak (`window.print()` dengan stylesheet print khusus), Unduh PDF, Bagikan WA. Cetak ulang diberi label **"SALINAN"**.
- Opsional: **struk dapur/bar (kitchen ticket)** terpisah untuk dimsum & minuman (daftar item per stasiun, tanpa harga) — buat toggle di Pengaturan.

### 9.2 Offline & PWA
- Aplikasi **installable** (manifest, ikon 192/512, `theme_color` kuning keju, `display: standalone`, orientasi bebas).
- Cache aset statis & halaman shell; halaman `/offline` bila tidak ada koneksi.
- **Mode degradasi**: jika offline, POS tetap bisa menyusun keranjang & menampilkan menu dari cache terakhir; transaksi **diantrekan secara lokal (IndexedDB)** dan **disinkronkan otomatis** ketika online (dengan `client_uuid` idempoten agar tidak dobel). Tampilkan banner "Mode offline — transaksi akan disinkronkan". Jika fitur antrean offline dianggap terlalu berisiko, **minimal**: tampilkan pesan jelas dan jangan hilangkan keranjang. *(Prioritaskan keandalan: lebih baik fitur sederhana yang benar daripada kompleks yang bug.)*

### 9.3 Pencarian & Cepat
- Pencarian produk **tanpa diacritic/kapital sensitif**, debounce 250ms.
- Tab "Favorit" & "Terlaris hari ini".
- Scan **barcode** (opsional bonus: input teks yang menangkap scanner USB).

### 9.4 Notifikasi internal
- Banner/lencana: stok menipis, shift belum ditutup sejak kemarin, selisih kas besar, pesanan diparkir > 2 jam.

### 9.5 Keamanan
- Middleware Next.js: redirect belum login → `/login`; blokir rute berdasarkan role.
- Semua Server Action: cek sesi & role **di server**, validasi zod, jangan percaya data client.
- Header keamanan (CSP dasar, `X-Frame-Options`, `Referrer-Policy`) di `next.config`.
- Rate-limit percobaan login (andalkan Supabase Auth + pesan generik; tampilkan jeda setelah gagal berulang).
- Kebijakan password minimal 8 karakter; ganti password mandiri di Pengaturan > Profil.
- Sanitasi input, escape output; tidak ada `dangerouslySetInnerHTML` dari input pengguna.
- Log aksi sensitif ke `audit_logs`.
- Backup: dokumentasikan cara ekspor data (Supabase backup / export CSV dari aplikasi).

### 9.6 Kinerja
- Indeks DB sesuai Bagian 5; pagination server-side (default 20/halaman); jangan `select *` pada daftar besar.
- `next/image` untuk gambar produk, lazy-load, placeholder blur.
- Target Lighthouse (mobile): Performance ≥ 85, Accessibility ≥ 90, PWA installable.
- Cache `categories/products` di TanStack Query (`staleTime` wajar) + invalidasi saat mutasi/realtime.

### 9.7 Aturan Void
- Kasir: tombol "Batalkan Transaksi" meminta **alasan** + **PIN owner** (jika diaktifkan). Owner: alasan saja.
- Hanya transaksi di **hari yang sama** yang bisa di-void oleh kasir; owner tidak dibatasi.
- Void tidak menghapus data; status berubah, stok kembali, tercatat di audit, muncul di laporan "Void".

### 9.8 Validasi Form (contoh minimal)
- Harga: bilangan bulat ≥ 0; nama produk wajib 2–80 karakter & unik dalam kategori; kategori wajib; qty 1–999; telepon format Indonesia (`08xx`/`+62xx`) opsional; nominal pengeluaran > 0.
- Input uang memakai `CurrencyInput` (format ribuan otomatis, hanya angka, `inputMode="numeric"`).

### 9.9 Internasionalisasi
- Hanya Indonesia, tetapi simpan semua string di satu modul `lib/strings.ts` atau gunakan struktur yang memudahkan i18n kelak.

---

## 10. DATA AWAL (`supabase/seed.sql`)

Buat seed idempotent (`on conflict do nothing`). **Harga hanya contoh — owner akan menyesuaikan.**

**store_settings**: `Cheese Drink`, alamat/telepon placeholder.

**categories**: Dimsum (food), Minuman Cheese (drink), Minuman Lainnya (drink), Snack/Tambahan (food).

**modifier_groups & modifiers (contoh)**:
- *Topping Minuman* (multiple, max 3): Cheese Foam (+3000), Boba (+3000), Jelly (+2000), Oreo Crumb (+3000)
- *Level Es* (single, required): Normal, Less Ice, No Ice
- *Level Gula* (single, required): Normal, Less Sugar, No Sugar
- *Saus Dimsum* (multiple): Saus Sambal (+0), Saus Mentai (+2000), Chili Oil (+1000)

**products (contoh)**:
- Dimsum: Siomay Ayam (isi 3 / isi 5 sebagai varian), Hakau Udang, Dimsum Mentai, Dimsum Keju, Lumpia Kulit Tahu, Bakpao Ayam, Bakpao Coklat
- Minuman Cheese: Cheese Tea, Thai Tea Cheese, Matcha Cheese, Choco Cheese, Milo Cheese, Red Velvet Cheese (varian Reguler / Large)
- Minuman Lainnya: Es Teh, Lemon Tea, Jeruk Peras, Air Mineral

**Akun**: sediakan petunjuk di README membuat akun owner pertama (Supabase Dashboard → Auth → Add user, lalu set `profiles.role = 'owner'` via SQL), serta skrip `scripts/create-owner.ts` opsional.

---

## 11. ENVIRONMENT & SETUP

`.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server-only, JANGAN diawali NEXT_PUBLIC
NEXT_PUBLIC_APP_NAME="Cheese Drink POS"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
Skrip `package.json`: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`, `db:types` (generate `database.types.ts` via `supabase gen types typescript`), `format`.

README harus berisi: ringkasan, prasyarat, langkah setup Supabase (buat project, jalankan migrasi, seed, buat owner), konfigurasi env, menjalankan lokal, deploy Vercel, daftar akun demo, troubleshooting.

---

## 12. KUALITAS KODE

- Struktur modular, komponen kecil & reusable, **tanpa duplikasi** logika hitung (satu sumber di `lib/utils/calc.ts` untuk preview client; versi SQL untuk final; **uji kesetaraan keduanya** dengan unit test pakai kasus yang sama).
- Penamaan konsisten, komentar untuk logika bisnis non-trivial.
- Penanganan error terpusat (helper `actionResult<T>` → `{ ok: true, data } | { ok: false, error }`).
- Tidak ada `console.log` tersisa; tidak ada TODO tanpa catatan di `docs/`.
- Commit terstruktur (jika git diaktifkan): `feat:`, `fix:`, `chore:`.

---

## 13. PENGUJIAN

**Unit (Vitest)** — fungsi hitung: subtotal, diskon percent/fixed + batas max, service, pajak inclusive/exclusive, pembulatan, kembalian, split payment, format Rupiah, generator nomor.

**E2E (Playwright)** — minimal:
1. Login kasir → buka shift → tambah 3 produk (1 dengan varian & topping) → bayar tunai → struk muncul → riwayat tampil.
2. Parkir pesanan → lanjutkan → bayar QRIS.
3. Kasir mencoba membuka `/reports` & `/products/new` → ditolak.
4. Void dengan PIN owner → stok kembali & status void.
5. Tutup shift → selisih kas terhitung benar.
6. Tampilan di viewport 375px (HP) dan 1024px (tablet) tidak overflow horizontal.

**Manual checklist** disimpan di `docs/TEST_CHECKLIST.md`.

---

## 14. DOKUMENTASI YANG HARUS DIHASILKAN

- `README.md` (lihat Bagian 11)
- `docs/ERD.md` (diagram Mermaid dari skema)
- `docs/ASSUMPTIONS.md` (semua asumsi yang diambil)
- `docs/USER_GUIDE.md` (panduan pemakaian untuk **owner & kasir** dengan bahasa awam, langkah per langkah — ini penting untuk serah terima ke mitra UMKM)
- `docs/DEPLOYMENT.md`
- `docs/TEST_CHECKLIST.md`

---

## 15. KRITERIA PENERIMAAN GLOBAL (DEFINITION OF DONE)

- [ ] Semua halaman di Bagian 7.5 ada, berfungsi, dan responsif (375px / 768px / 1280px).
- [ ] Alur kasir lengkap: buka shift → transaksi → bayar → struk → tutup shift tanpa error.
- [ ] RLS aktif di semua tabel dan terbukti membatasi akses kasir.
- [ ] Perhitungan uang konsisten antara preview client dan hasil server; transaksi atomik.
- [ ] Laporan sesuai Bagian 8 dengan export Excel/CSV/PDF.
- [ ] Struk 58mm/80mm dapat dicetak rapi.
- [ ] PWA dapat di-install; halaman offline berfungsi.
- [ ] `lint`, `typecheck`, `build`, unit test, dan E2E utama **lulus**.
- [ ] Tidak ada secret di repo; `.env.example` lengkap.
- [ ] Dokumentasi Bagian 14 lengkap.
- [ ] Seed data memudahkan demo langsung setelah setup.

---

## 16. CATATAN SKALABILITAS (JANGAN DIIMPLEMENTASI SEKARANG, TAPI JANGAN DIBLOKIR)

Desain agar nanti mudah menambah: multi-cabang (`branch_id` pada tabel transaksional), integrasi payment gateway, kitchen display system, program loyalitas/poin, voucher, multi-bahasa. Hindari keputusan skema yang menyulitkan penambahan ini.

---

## 17. HAL YANG HARUS DIHINDARI

- Menghitung total hanya di client dan mempercayainya.
- Menyimpan harga uang dengan `float`.
- Menghapus permanen produk yang sudah pernah ditransaksikan.
- Menggunakan `service_role` di sisi browser.
- Menonaktifkan RLS "sementara" lalu lupa mengaktifkan.
- Hardcode zona waktu UTC pada batas laporan harian.
- UI yang hanya bagus di desktop.
- Teks UI berbahasa Inggris bercampur.
- Meninggalkan fitur setengah jadi tanpa dicatat di `docs/ASSUMPTIONS.md`.

---

## 18. RENCANA EKSEKUSI BERTAHAP (FASE) + ACCEPTANCE CRITERIA

### FASE 0 — Fondasi
Inisialisasi Next.js (TS, Tailwind, ESLint), pasang shadcn/ui, Prettier, struktur folder, tema warna keju, font, layout dasar, util `currency/date`, klien Supabase (client/server/admin/middleware), `.env.example`.
**Selesai jika**: app jalan, tema & dark mode berfungsi, `build` lulus.

### FASE 1 — Database & Auth
Migrasi lengkap (enum, tabel, indeks, trigger, helper), RLS, RPC dasar (`open_shift`, `close_shift`), trigger `profiles`, storage bucket, seed. Halaman Login, middleware proteksi, guard role, layout shell (sidebar/bottom-nav/topbar) dengan menu per role. Generate `database.types.ts`.
**Selesai jika**: owner & kasir bisa login, menu sesuai role, RLS teruji.

### FASE 2 — Master Data
CRUD Kategori, Produk (+varian, upload foto, toggle), Grup Topping & Opsi, Diskon, Pengguna (owner buat kasir via admin API), Pengaturan Toko (termasuk pajak/service/pembulatan/PIN void), Pelanggan.
**Selesai jika**: semua CRUD berfungsi dengan validasi & empty state, soft delete benar.

### FASE 3 — POS Inti
Layar POS responsif, keranjang (Zustand + persist), dialog varian/topping, pencarian & tab kategori, diskon, tipe pesanan, RPC `create_order` (mode `pay` & `hold`), dialog pembayaran (tunai/QRIS/transfer/e-wallet, split, numpad), layar berhasil, gerbang buka shift.
**Selesai jika**: transaksi tersimpan benar di DB, total server = total client, stok berkurang, nomor struk & antrean benar.

### FASE 4 — Pesanan, Struk, Shift, Void
Riwayat & detail pesanan, pesanan diparkir (+realtime), struk 58/80mm + cetak + PDF + WA, kitchen ticket opsional, `void_order` + PIN + audit, tutup shift + rekap + cetak.
**Selesai jika**: seluruh alur Bagian 15 poin 2 berjalan.

### FASE 5 — Dashboard & Laporan
Semua RPC laporan, dashboard owner/kasir, 8 jenis laporan, grafik, export xlsx/csv/pdf.
**Selesai jika**: angka laporan cocok dengan data transaksi uji (verifikasi dengan data seed transaksi dummy).

### FASE 6 — Inventori, Pengeluaran, Notifikasi
Stok produk & bahan baku, resep (opsional diaktifkan), barang masuk/opname/waste, riwayat pergerakan, pengeluaran + foto nota, notifikasi internal, laporan stok & laba rugi.
**Selesai jika**: stok konsisten dengan penjualan/void; laba bersih memperhitungkan pengeluaran.

### FASE 7 — PWA, Offline, Audit, Keamanan
Manifest + service worker, halaman offline, banner koneksi, antrean offline (atau degradasi aman), Audit Log UI, header keamanan, review RLS ulang.
**Selesai jika**: app bisa di-install, offline tidak menghilangkan keranjang, audit log tercatat.

### FASE 8 — Polish, Test, Dokumentasi, Deploy
Perapian UI (loading/error/empty), aksesibilitas, optimasi performa, unit & E2E test, dokumentasi lengkap (Bagian 14), panduan deploy Vercel + Supabase, data demo.
**Selesai jika**: seluruh checklist Bagian 15 terpenuhi.

---

## 19. PERINTAH AKHIR UNTUK AGENT

Mulailah dengan menyusun **Implementation Plan** dan **Task List** dari Fase 0–8, tampilkan ringkasannya, lalu **langsung eksekusi Fase 0** tanpa menunggu konfirmasi. Lanjutkan fase berikutnya secara otomatis setelah acceptance criteria fase sebelumnya terpenuhi. Bila terjadi blocker (mis. kredensial Supabase), tulis instruksi jelas yang perlu dilakukan pengguna, lalu lanjutkan bagian yang tidak bergantung pada blocker tersebut. Di akhir, berikan **laporan akhir**: fitur selesai, fitur yang disederhanakan (beserta alasannya), cara menjalankan, dan langkah serah terima ke mitra.
