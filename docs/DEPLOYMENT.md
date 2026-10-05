# PANDUAN DEPLOYMENT (DEPLOYMENT GUIDE) — CHEESE DRINK POS

Dokumen ini menjelaskan langkah demi langkah untuk melakukan deploy aplikasi **Cheese Drink POS** ke layanan cloud publik: **Supabase** (Database, Auth, Storage) dan **Vercel** (Frontend Next.js).

---

## 1. Persiapan Akun & Prasyarat
Sebelum memulai, pastikan Anda memiliki:
1. Akun di [Supabase](https://supabase.com).
2. Akun di [Vercel](https://vercel.com) yang terhubung ke repositori GitHub / GitLab Anda.
3. Node.js v20+ dan npm terpasang di komputer lokal untuk pengujian pra-deploy.

---

## 2. Setup Backend Supabase Cloud

### Langkah 2.1: Buat Proyek Supabase Baru
1. Masuk ke [Supabase Dashboard](https://supabase.com/dashboard).
2. Klik **New Project**.
3. Isi rincian:
   - **Name**: `Cheese Drink POS`
   - **Database Password**: Buat password yang kuat dan catat di tempat aman.
   - **Region**: Pilih **Singapore (`ap-southeast-1`)** untuk latensi tercepat dari Indonesia.
4. Klik **Create new project** dan tunggu proses inisialisasi selesai (~2 menit).

### Langkah 2.2: Jalankan Migrasi Database (SQL Editor)
Buka menu **SQL Editor** pada dashboard Supabase Anda, lalu buat query baru dan jalankan file migrasi secara berurutan:

1. Salin dan jalankan isi `supabase/migrations/0001_initial_schema.sql` (Enums, tabel inti, relasi, dan indeks).
2. Salin dan jalankan isi `supabase/migrations/0002_functions_and_triggers.sql` (Fungsi trigger timestamp, role check, dan profil user otomatis).
3. Salin dan jalankan isi `supabase/migrations/0003_rls_policies.sql` (Kebijakan Row Level Security di seluruh tabel).
4. Salin dan jalankan isi `supabase/migrations/0004_core_rpc.sql` (Fungsi `open_shift`, `close_shift`, dan hash PIN void).
5. Salin dan jalankan isi `supabase/migrations/0005_create_order_rpc.sql` (RPC atomik `create_order` mode pay & hold, nomor struk concurrency-safe, dan pemotongan stok).
6. Salin dan jalankan isi `supabase/migrations/0006_void_order_rpc.sql` (RPC `void_order` dengan verifikasi PIN owner dan rollback stok otomatis).
7. Salin dan jalankan isi `supabase/migrations/0007_reports_rpc.sql` (RPC agregasi analitik, tren penjualan, top produk, dan laba rugi).

### Langkah 2.3: Masukkan Data Awal (Seed Data)
1. Di SQL Editor Supabase, salin seluruh isi file `supabase/seed.sql`.
2. Klik **Run** untuk memasukkan pengaturan toko default, kategori menu, grup topping, opsi level gula/es, produk sampel, dan bahan baku awal.

### Langkah 2.4: Membuat Akun Pemilik (Owner) Pertama
1. Di dashboard Supabase, buka menu **Authentication > Users**.
2. Klik **Add user > Create user**.
3. Masukkan email owner (misal: `owner@cheesedrink.com`) dan password yang kuat (minimal 8 karakter).
4. Centang **Auto Confirm User?** agar email langsung terverifikasi tanpa perlu konfirmasi link.
5. Setelah user dibuat, buka kembali **SQL Editor** dan jalankan perintah berikut untuk memberikan hak akses `owner`:
   ```sql
   update profiles
   set role = 'owner',
       full_name = 'Owner Cheese Drink'
   where id = (select id from auth.users where email = 'owner@cheesedrink.com');
   ```

### Langkah 2.5: Ambil Kunci Kredensial API
Buka menu **Project Settings > API**:
- **Project URL**: Salin URL proyek (contoh: `https://xyzcompany.supabase.co`).
- **Project API Keys**:
  - `anon` `public`: Salin kunci anonim.
  - `service_role` `secret`: Salin kunci service role (kunci ini rahasia, jangan sampai bocor ke publik!).

---

## 3. Setup Frontend di Vercel

### Langkah 3.1: Hubungkan Repositori
1. Masuk ke [Vercel Dashboard](https://vercel.com/dashboard).
2. Klik **Add New... > Project**.
3. Pilih repositori Git `cheese-drink-pos` Anda lalu klik **Import**.

### Langkah 3.2: Konfigurasi Environment Variables di Vercel
Pada bagian **Environment Variables**, tambahkan variabel berikut:

| Nama Variabel | Nilai / Deskripsi |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase Anda (dari Langkah 2.5) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Kunci `anon` Supabase Anda |
| `SUPABASE_SERVICE_ROLE_KEY` | Kunci `service_role` Supabase Anda |
| `NEXT_PUBLIC_APP_NAME` | `Cheese Drink POS` |
| `NEXT_PUBLIC_APP_URL` | URL domain Vercel Anda (misal `https://cheese-drink-pos.vercel.app`) |

> **PERINGATAN KEAMANAN**: Pastikan `SUPABASE_SERVICE_ROLE_KEY` **TIDAK** menggunakan awalan `NEXT_PUBLIC_` agar tidak dapat diakses dari browser pengguna.

### Langkah 3.3: Deploy & Verifikasi
1. Klik **Deploy**.
2. Tunggu proses build Next.js selesai (~1 menit).
3. Setelah deployment selesai, buka domain yang diberikan Vercel.
4. Uji login menggunakan akun Owner yang dibuat di Langkah 2.4.

---

## 4. Konfigurasi Domain Kustom & HTTPS (Opsional)
1. Di Vercel Dashboard, buka **Project Settings > Domains**.
2. Masukkan domain kustom kedai Anda (misal: `kasir.cheesedrink.com`).
3. Tambahkan DNS Record CNAME sesuai petunjuk Vercel. Sertifikat SSL HTTPS otomatis diterbitkan gratis oleh Vercel.

---

## 5. Pemeriksaan Pasca Deploy (Checklist Go-Live)
- [ ] Buka aplikasi di smartphone, pastikan responsif dan banner offline muncul saat koneksi diputus.
- [ ] Buka shift kasir dengan modal awal Rp 100.000.
- [ ] Lakukan 1 transaksi uji coba (tambah dimsum + minuman topping), selesaikan pembayaran tunai.
- [ ] Cek cetak struk (dialog printer browser muncul dengan lebar 58mm/80mm yang pas).
- [ ] Batalkan transaksi uji coba tersebut dengan fitur Void (pastikan status berubah dan stok kembali).
- [ ] Tutup shift kasir dan pastikan nominal kas fisik sesuai.
- [ ] Buka menu Laporan, pastikan seluruh angka teragregasi tepat sesuai zona waktu WIB.
