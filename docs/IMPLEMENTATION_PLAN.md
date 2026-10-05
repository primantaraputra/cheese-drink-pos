# IMPLEMENTATION PLAN: CHEESE DRINK POS

Aplikasi kasir (POS) modern berbasis web untuk UMKM F&B "Cheese Drink" (penjual dimsum & aneka minuman cheese/tea/coffee), dirancang mobile-first, cepat, tangguh, dan memenuhi standar operasional kasir UMKM.

---

## 1. Arsitektur & Teknologi Utama
- **Frontend**: Next.js 15+ (App Router), React 19, TypeScript (strict), Tailwind CSS, shadcn/ui (Radix Primitives), Lucide Icons, Recharts, TanStack Table.
- **Backend & Database**: Supabase PostgreSQL, Row Level Security (RLS) di semua tabel, Database Functions / RPC (PostgreSQL PL/pgSQL) untuk kalkulasi uang dan integritas stok, Supabase Auth, Supabase Storage, Supabase Realtime.
- **State & Data Fetching**: Zustand (keranjang POS dengan `localStorage` persistensi), TanStack Query untuk interaksi client POS & riwayat, Server Actions & Server Components untuk mutasi aman dan rendering cepat.
- **Keamanan & Validasi**: Dual-layer RBAC (Middleware & Next.js Guards + RLS di Postgres), Zod schema sharing client/server, sandboxing PIN void dengan bcrypt via pgcrypto.
- **Cetak Struk & Ekspor**: CSS thermal print 58mm & 80mm via `window.print()`, PDF generation (jsPDF + autoTable), XLSX Excel & CSV export.
- **PWA & Offline**: Web App Manifest, Service Worker, IndexedDB caching untuk menu & fallback state offline.

---

## 2. Fase Eksekusi & Task List

### FASE 0 — Fondasi & Inisialisasi
- [x] Inisialisasi proyek Next.js 15+ TypeScript, Tailwind CSS, ESLint, Prettier.
- [x] Setup shadcn/ui dan konfigurasi tema visual "Cheese Drink" (Warm Cheese Gold `#F5A623`/`#FFB703`, Soft Cream `#FFF8E7`, Dark Roast `#3B2A1A`, Dark Mode support).
- [x] Setup struktur folder standar (`src/app`, `src/components`, `src/lib`, `src/actions`, `src/hooks`, `src/stores`, `src/types`, `supabase/migrations`, `docs/`).
- [x] Utilitas dasar: `lib/utils/currency.ts` (format IDR tanpa desimal), `lib/utils/date.ts` (Asia/Jakarta WIB date-fns), `lib/utils/calc.ts` (preview kalkulasi keuangan).
- [x] Supabase clients (`client.ts`, `server.ts`, `admin.ts`, `middleware.ts`).
- [x] `.env.example` dan `.env.local` template.
- [x] Acceptance criteria check: lint, typecheck, dan dev/build pass.

### FASE 1 — Skema Database, RLS, & Otentikasi
- [x] File migrasi SQL (`0001_initial_schema.sql`): Enums, tables (profiles, store_settings, categories, products, product_variants, modifier_groups, modifiers, product_modifier_groups, ingredients, recipes, customers, discounts, shifts, daily_counters, orders, order_items, order_item_modifiers, payments, expenses, stock_movements, audit_logs), indexes, dan auto `updated_at` trigger.
- [x] File migrasi RPC & Function (`0002_functions_and_triggers.sql`): `set_updated_at`, `current_role_name`, `is_owner`, `is_staff`, profile creation trigger on `auth.users`, audit log triggers.
- [x] File migrasi RLS (`0003_rls_policies.sql`): Strict RLS di seluruh 18 tabel.
- [x] RPC operasional dasar (`open_shift`, `close_shift`).
- [x] Seed data (`supabase/seed.sql`): Pengaturan default, kategori dimsum & minuman, grup opsi (level gula, es, saus, topping), produk & varian contoh.
- [x] TypeScript Database Types generation (`src/types/database.types.ts`).
- [x] Auth pages & flow: `/login`, auth middleware, session check, role guard.
- [x] Shell layout: Topbar (nama toko, status shift, indikator online/offline, toggle tema, menu profil), Responsive Sidebar (desktop/tablet), Bottom Navigation (mobile).
- [x] Acceptance criteria check: auth flow siap, menu terisolasi per role, build pass.

### FASE 2 — Manajemen Master Data (Owner & Staff)
- [x] Kategori Produk (Food, Drink, Other, sorting order, active toggle).
- [x] Produk & Varian: CRUD lengkap, varian harga & SKU, toggle ketersediaan ("Habis" vs "Tersedia"), lacak stok toggle & threshold, upload gambar placeholder/Supabase storage, duplikasi produk.
- [x] Grup Modifier & Topping: single/multiple selection, min/max selection, required toggle, harga delta, pemetaan produk-modifier.
- [x] Diskon & Promo: percent/fixed, max discount, min purchase, validity dates, active toggle.
- [x] Manajemen Pelanggan: CRUD pelanggan, riwayat belanja (total_spent, visit_count, last_visit).
- [x] Pengaturan Toko: nama, alamat, telepon, logo, header/footer struk, lebar kertas (58/80mm), pajak & service charge (inclusive/exclusive), pembulatan tunai, PIN void owner.
- [x] Manajemen Pengguna: Owner membuat akun kasir via Server Action (Supabase Admin API), aktifkan/nonaktifkan kasir, reset password.
- [x] Acceptance criteria check: CRUD validasi Zod, form handling ramah mobile, build pass.

### FASE 3 — POS Inti (Kasir & Pemesanan)
- [x] Layar Kasir POS Tablet/Desktop (Split View) & Mobile (1-column + Bottom Sheet Cart).
- [x] Grid produk, pencarian instan (debounce), filter kategori horizontal.
- [x] Modal pemilihan varian & topping modifier dinamis dengan validasi rules.
- [x] Zustand Cart Store dengan persistensi localStorage, custom item note, qty controls.
- [x] Dialog / Modal Buka Shift kasir jika kasir belum membuka shift.
- [x] Migrasi RPC `create_order`: kalkulasi atomik server-side, `daily_counters` concurrency safe order number (`CD-YYMMDD-XXXX`) & queue number, update stock, pemotongan stok bahan baku/produk, pencatatan snapshot item.
- [x] Modal Pembayaran: Tunai (dengan Numpad interaktif, uang pas, preset pecahan 10k, 20k, 50k, 100k, realtime kembalian), QRIS manual, Transfer Bank, E-Wallet, dan Split Payment.
- [x] Layar Sukses Transaksi: Nomor antrean besar, rincian kembalian, shortcut cetak struk, kirim WhatsApp, transaksi baru.
- [x] Mode Hold / Parkir pesanan.
- [x] Acceptance criteria check: order creation RPC teruji, tidak ada manipulasi harga dari client, build pass.

### FASE 4 — Manajemen Pesanan, Struk Termal, Shift, & Void
- [x] Riwayat Pesanan: Server-side pagination, filter tanggal (Asia/Jakarta), filter status, kasir, tipe bayar, pencarian no struk.
- [x] Detail Pesanan: modal/halaman rincian snapshot, audit status, log pembayaran.
- [x] Pesanan Diparkir (`held-orders`): kartu pesanan tertunda, tombol lanjutkan transaksi ke POS atau batalkan.
- [x] Komponen Cetak Struk (`<Receipt />`) teruji untuk 58mm & 80mm thermal paper via CSS `@media print`, watermark "SALINAN" jika cetak ulang.
- [x] Export Struk PDF & Format teks WhatsApp (`wa.me`).
- [x] Fitur Void Transaksi (`void_order` RPC): pembatalan order completed dengan validasi PIN owner untuk kasir, alasan void wajib (min 5 char), rollback stok otomatis (`sale_void`), dan audit log.
- [x] Siklus Tutup Shift (`close_shift` RPC): modal input kas fisik aktual, kalkulasi kas sistem (modal awal + tunai masuk - pengeluaran laci), hitung selisih kas, cetak rekap shift.
- [x] Acceptance criteria check: alur end-to-end POS berjalan mulus, build pass.

### FASE 5 — Dashboard Analitik & Laporan Keuangan
- [x] Migrasi SQL RPC Laporan: `get_sales_summary`, `get_sales_by_day`, `get_sales_by_hour`, `get_top_products`, `get_sales_by_category`, `get_sales_by_payment_method`, `get_sales_by_cashier`, `get_profit_loss`.
- [x] Dashboard Owner: KPI Cards (Omzet hari ini, transaksi, rata-rata tiket, laba kotor, pengeluaran), tren 7/30 hari (Recharts), jam tersibuk, Top 5 produk, distribusi pembayaran.
- [x] Dashboard Kasir: Ringkasan shift aktif & shortcut POS.
- [x] 8 Modul Laporan lengkap: Laporan Penjualan, Laporan Produk, Metode Pembayaran, Laporan Kasir, Laporan Laba Rugi Sederhana, Laporan Kas/Shift, Laporan Stok, Analisis Jam Sibuk.
- [x] Export ke Excel (`.xlsx`), CSV, dan Dokumen PDF (`jspdf` + `jspdf-autotable`).
- [x] Acceptance criteria check: laporan akurat berbasis timezone WIB, export berfungsi, build pass.

### FASE 6 — Inventori, Pengeluaran, & Notifikasi
- [x] Manajemen Stok Produk & Bahan Baku (Ingredients): stok saat ini, ambang minimum, satuan unit.
- [x] Form Mutasi Stok: Barang Masuk (Purchase), Penyesuaian (Stock Opname), Barang Rusak/Basi (Waste). Riwayat `stock_movements`.
- [x] Pengeluaran Operasional (Expenses): Kategori (Bahan Baku, Gas, Listrik, Gaji, Kemasan, Lain-lain), opsi potong kas laci (`paid_from_drawer`).
- [x] Notifikasi banner di Topbar & Dashboard: Peringatan stok menipis, status shift aktif.
- [x] Acceptance criteria check: mutasi stok konsisten, pengeluaran memotong kas laci pada tutup shift secara tepat, build pass.

### FASE 7 — PWA, Offline Fallback, Audit Trail, & Keamanan
- [x] Web Manifest PWA, icon metadata, service worker cache shell.
- [x] Halaman `/offline` fallback informatif.
- [x] Audit Log Viewer (Owner): Riwayat perubahan harga, void order, status user, dan konfigurasi.
- [x] Security Hardening: HTTP Security Headers di `next.config`, Zod server validation, sanitasi input, CSP dasar.
- [x] Acceptance criteria check: audit log terekam, offline banner informatif, build pass.

### FASE 8 — Polishing, Testing, Dokumentasi, & Serah Terima
- [x] Polishing UI/UX: Empty state, error boundary, loading skeletons, konfirmasi dialog pada aksi destruktif.
- [x] Pengujian Unit (Vitest): logika kalkulasi uang (`calc.ts`), pembulatan IDR, pajak, diskon, dan kembalian.
- [x] Checklist pengujian manual komprehensif (`docs/TEST_CHECKLIST.md`).
- [x] Dokumentasi lengkap:
  - `README.md`
  - `docs/ERD.md` (Diagram Mermaid skema DB)
  - `docs/ASSUMPTIONS.md` (Daftar keputusan desain & teknis)
  - `docs/USER_GUIDE.md` (Panduan pengguna awam untuk Owner & Kasir)
  - `docs/DEPLOYMENT.md` (Panduan deploy Supabase & Vercel)
  - `docs/TEST_CHECKLIST.md` (Daftar uji penerimaan)
- [x] Verifikasi kriteria penerimaan global (Definition of Done).
