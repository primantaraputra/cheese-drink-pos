# DAFTAR UJI PENERIMAAN (ACCEPTANCE & TEST CHECKLIST) — CHEESE DRINK POS

Dokumen ini adalah panduan pengujian menyeluruh (Quality Assurance & User Acceptance Testing) untuk memastikan seluruh fitur aplikasi kasir **Cheese Drink POS** berfungsi sempurna sebelum diserahterimakan kepada mitra UMKM.

---

## 1. Autentikasi & Hak Akses (RBAC)
- [ ] **Login Akun**: Memasukkan email dan password yang benar mengarahkan ke halaman sesuai peran (Owner ke Dashboard, Kasir ke Layar POS).
- [ ] **Validasi Password Salah**: Menampilkan pesan kesalahan ramah berbahasa Indonesia tanpa crash.
- [ ] **Isolasi Role Kasir**: Kasir yang mencoba membuka `/reports`, `/products`, `/categories`, `/modifiers`, `/discounts`, `/users`, `/settings`, atau `/audit-logs` secara otomatis dialihkan atau ditolak.
- [ ] **Akun Nonaktif**: Akun dengan status `is_active = false` tidak dapat login ke sistem.
- [ ] **Logout**: Tombol keluar membersihkan sesi cookie dan mengarahkan kembali ke `/login`.

---

## 2. Shift Kasir (Buka & Tutup)
- [ ] **Gerbang Buka Shift**: Jika belum ada shift aktif, kasir tidak dapat memproses pesanan dan dialog buka shift muncul otomatis.
- [ ] **Modal Awal**: Kasir dapat memasukkan modal awal dengan format Rupiah yang benar.
- [ ] **Shift Ganda**: Satu kasir tidak dapat membuka dua shift aktif sekaligus.
- [ ] **Tutup Shift Kasir**:
  - [ ] Menampilkan modal awal sistem.
  - [ ] Menghitung total uang tunai masuk dari penjualan.
  - [ ] Memperhitungkan pengeluaran operasional yang diambil dari laci.
  - [ ] Menghitung kas yang diharapkan sistem.
  - [ ] Kasir memasukkan kas fisik aktual.
  - [ ] Indikator selisih kas menghitung perbedaan secara realtime (merah jika minus, hijau jika pas).
  - [ ] Validasi pesanan diparkir (shift tidak dapat ditutup jika masih ada order `held`).
  - [ ] Tombol cetak slip rekap shift menghasilkan format struk ringkas.

---

## 3. Layar Kasir POS & Pemesanan
- [ ] **Tampilan Menu Responsif**: Grid menu tampil 2 kolom di HP (375px), 3–4 kolom di tablet/desktop.
- [ ] **Pencarian Cepat**: Mengetik di kolom pencarian atau menekan tombol `/` memfilter produk secara instan tanpa sensitif huruf besar/kecil.
- [ ] **Filter Kategori**: Tab kategori (Semua, Favorit, Dimsum, Minuman, Snack) memfilter daftar menu dengan benar.
- [ ] **Tambah Item Cepat (1-Tap)**: Produk tanpa varian/topping langsung masuk keranjang saat di-tap.
- [ ] **Dialog Kustomisasi Varian & Topping**:
  - [ ] Memilih varian ukuran/porsi (radio button).
  - [ ] Memilih topping (checkbox multiple dengan batasan max).
  - [ ] Memilih opsi wajib (level gula / es).
  - [ ] Menambahkan catatan per item (mis. "Saus dipisah").
  - [ ] Harga otomatis bertambah sesuai selisih harga (price delta) topping.
- [ ] **Keranjang Belanja (Zustand)**:
  - [ ] Tambah / kurang kuantitas (+ / -).
  - [ ] Hapus item dari keranjang.
  - [ ] Penggabungan item identik (produk, varian, dan opsi sama digabung).
  - [ ] Persistensi `localStorage` (isi keranjang tidak hilang saat tab browser tidak sengaja di-refresh).
  - [ ] Floating button *"Lihat Pesanan"* muncul di layar HP.
- [ ] **Parkir Pesanan (Hold Order)**:
  - [ ] Klik *"Parkir Pesanan"* menyimpan transaksi dengan status `held`.
  - [ ] Menu **Pesanan Diparkir** menampilkan kartu pesanan tertunda.
  - [ ] Klik *"Lanjutkan Transaksi"* memuat kembali item ke keranjang POS.
  - [ ] Klik *"Batalkan Pesanan"* menghapus pesanan tertunda.

---

## 4. Pembayaran & Cetak Struk
- [ ] **Kalkulasi Server-Side**: Total tagihan dihitung final oleh fungsi Postgres DB (`create_order`), bukan dipercaya mentah dari client.
- [ ] **Metode Bayar Tunai**:
  - [ ] Preset tombol nominal cepat (10rb, 20rb, 50rb, 100rb) dan tombol *"Uang Pas"*.
  - [ ] Numpad interaktif bekerja mulus di layar sentuh tablet/HP.
  - [ ] Menghitung uang kembalian secara tepat.
  - [ ] Menolak penyelesaian jika uang yang diserahkan kurang.
- [ ] **Metode Bayar Non-Tunai**: QRIS, Transfer Bank, dan E-Wallet mencatat referensi pembayaran.
- [ ] **Split Payment**: Membayar sebagian tunai dan sebagian QRIS berhasil diproses.
- [ ] **Layar Sukses**:
  - [ ] Menampilkan nomor antrean harian berukuran besar (mis. `#15`).
  - [ ] Menampilkan nomor struk unik format `CD-YYMMDD-XXXX`.
  - [ ] Menampilkan rincian kembalian.
- [ ] **Cetak Struk Thermal**:
  - [ ] Dialog `window.print()` terpanggil rapi.
  - [ ] Format kertas 58mm dan 80mm presisi tanpa margin meluap.
  - [ ] Nama toko, antrean, rincian produk, subtotal, diskon, pajak, total, dan footer tercetak jelas.
  - [ ] Cetak ulang dari riwayat menampilkan label watermark **"*** SALINAN ***"**.
- [ ] **Bagikan via WhatsApp**: Tombol WA membuka tautan `wa.me` dengan format teks struk terstruktur rapi.

---

## 5. Pembatalan Transaksi (Void)
- [ ] **Hak Akses Void**:
  - [ ] Kasir yang membatalkan transaksi wajib memasukkan PIN Owner (4–8 digit).
  - [ ] Owner dapat membatalkan langsung tanpa PIN.
- [ ] **Alasan Void**: Wajib diisi minimal 5 karakter.
- [ ] **Pembatasan Waktu**: Kasir hanya boleh membatalkan transaksi pada hari yang sama (WIB).
- [ ] **Rollback Stok**: Stok produk langsung bertambah kembali dan dicatat sebagai mutasi `sale_void`.
- [ ] **Status**: Status pesanan berubah menjadi `void` dan tidak dihitung ke omzet bersih laporan.
- [ ] **Audit Log**: Aksi void tercatat lengkap di tabel `audit_logs`.

---

## 6. Laporan Keuangan & Ekspor
- [ ] **Zona Waktu WIB**: Seluruh filter tanggal menggunakan acuan Asia/Jakarta (UTC+7).
- [ ] **8 Modul Laporan**:
  1. Penjualan Harian: Menampilkan omzet dan frekuensi pesanan.
  2. Kinerja Produk: Peringkat terlaris berdasarkan kuantitas dan omzet.
  3. Kategori: Perbandingan kontribusi Dimsum vs Minuman.
  4. Metode Pembayaran: Nominal dan persentase Tunai vs Non-Tunai.
  5. Kinerja Kasir: Omzet dan catatan pembatalan (void) per kasir.
  6. Laba Rugi Sederhana: Omzet − Diskon − HPP = Laba Kotor; − Biaya = Laba Bersih.
  7. Kas / Shift: Rekap modal awal, kas sistem, kas fisik, dan selisih kas.
  8. Jam Sibuk: Pola kepadatan transaksi dari jam 00:00 s.d 23:00 WIB.
- [ ] **Ekspor**:
  - [ ] Tombol **Excel** mengunduh file `.xlsx` valid yang dapat dibuka di Microsoft Excel.
  - [ ] Tombol **CSV** menghasilkan file `.csv` berformat UTF-8.
  - [ ] Tombol **PDF** menghasilkan dokumen tabel dengan header kuning keju khas Cheese Drink.

---

## 7. Inventori & Pengeluaran
- [ ] **Stok Produk**: Indikator stok menipis (merah) aktif jika stok <= ambang batas minimum.
- [ ] **Bahan Baku**: Tambah bahan baku racikan baru (gram, ml, pcs, lembar).
- [ ] **Mutasi Barang Masuk**: Stok bertambah dan riwayat mutasi tercatat.
- [ ] **Mutasi Barang Rusak / Basi**: Stok berkurang dengan alasan kerusakan.
- [ ] **Catat Pengeluaran**:
  - [ ] Memilih kategori biaya operasional.
  - [ ] Opsi *"Ambil dari Kas Laci"* memotong kas shift yang sedang aktif.
  - [ ] Pengeluaran tercatat di laporan laba rugi.

---

## 8. Tampilan & Responsivitas (UI/UX)
- [ ] **Viewport HP (375px)**: Tidak ada elemen yang overflow horizontal, tombol nyaman di-tap jari (touch target >= 44px).
- [ ] **Viewport Tablet (768px - 1024px)**: Layout kasir split-view (menu di kiri, keranjang di kanan).
- [ ] **Viewport Desktop (1280px+)**: Tampilan luas dan proporsional.
- [ ] **Empty State**: Halaman kosong menampilkan ilustrasi ikon, pesan ramah, dan tombol aksi.
- [ ] **Aksi Destruktif**: Menghapus produk, membatalkan pesanan, atau menghapus kategori dilindungi dialog konfirmasi (*ConfirmDialog*).
- [ ] **Notifikasi Toast**: Pesan sukses dan gagal berbahasa Indonesia muncul via Sonner toast di pojok layar.
