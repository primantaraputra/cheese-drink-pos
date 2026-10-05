# ASSUMPTIONS & DESIGN DECISIONS — CHEESE DRINK POS

Dokumen ini mencatat semua asumsi bisnis, teknis, dan keputusan desain yang diambil demi kelancaran operasional UMKM F&B Cheese Drink.

---

## 1. Asumsi Bisnis & Operasional
1. **Mata Uang & Format**:
   - Seluruh nominal adalah Rupiah Indonesia (IDR) tanpa angka di belakang koma (bilangan bulat integer / `numeric(12,0)`).
   - Pembulatan kasir default menggunakan aturan `rounding_unit = 100` (dibulatkan ke kelipatan Rp 100 terdekat secara round-half-up).
2. **Zona Waktu**:
   - Jam operasional dan seluruh agregasi laporan menggunakan zona waktu Indonesia Barat (`Asia/Jakarta`, UTC+7).
   - Penomoran struk harian (`CD-YYMMDD-XXXX`) dan antrean harian (`queue_no`) di-reset setiap pergantian hari pukul 00:00 WIB.
3. **Shift Kasir**:
   - Satu kasir hanya diperbolehkan memiliki maksimal 1 shift terbuka (`open`) pada satu waktu.
   - Kasir diwajibkan membuka shift (input modal awal) sebelum dapat memproses transaksi di POS, untuk menjamin akuntabilitas kas laci.
4. **Pembayaran Campuran (Split Payment)**:
   - Pelanggan diperbolehkan membayar sebagian tunai dan sisanya non-tunai (misal QRIS / transfer).
   - Jumlah nominal non-tunai tidak boleh melebihi sisa tagihan.
   - Kembalian hanya dihitung dari kelebihan pembayaran tunai.
5. **Void & Keamanan**:
   - Transaksi `completed` tidak dapat dihapus permanen atau di-edit nilainya demi integritas pembukuan.
   - Pembatalan transaksi menggunakan fitur `void_order` yang mencatat alasan (minimal 5 karakter), waktu, dan pelaku.
   - Kasir membutuhkan verifikasi PIN Owner untuk melakukan void jika pengaturan `require_owner_pin_for_void` aktif.
   - Void secara otomatis mengembalikan stok produk / bahan baku yang terpotong.
6. **Snapshot Harga & Nama Produk**:
   - Item pesanan menyimpan snapshot nama, varian, topping, harga satuan, dan HPP pada saat transaksi terjadi. Perubahan nama atau harga master produk di masa depan tidak mempengaruhi riwayat transaksi terdahulu.

---

## 2. Asumsi Teknis & Arsitektur
1. **Frontend**:
   - Next.js 15 App Router dengan React 19, TypeScript strict mode.
   - Tailwind CSS v3.4/v4 dan komponen shadcn/ui.
   - Zustand digunakan untuk mengelola keranjang belanja kasir secara instan dan disimpan ke `localStorage` agar pesanan tidak hilang jika tab browser tertutup tanpa sengaja.
2. **Database & Otorisasi**:
   - Supabase PostgreSQL dengan Row Level Security (RLS) diaktifkan di seluruh tabel.
   - Perhitungan uang final dilakukan di database via Postgres Function / RPC (`create_order`, `void_order`, `close_shift`) untuk mencegah kecurangan atau manipulasi harga dari sisi client.
   - Service Role key hanya digunakan pada server-side Route Handlers / Server Actions (misalnya untuk pembuatan akun kasir baru oleh owner) dan tidak pernah diekspos ke client.
3. **Printer Struk**:
   - Menggunakan CSS print `@media print` presisi untuk thermal printer 58mm dan 80mm via dialog `window.print()`.
