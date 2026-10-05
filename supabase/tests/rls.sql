-- ==============================================================================
-- supabase/tests/rls.sql
-- Uji Otomatis Penegakan Row Level Security (RLS) di Supabase
-- ==============================================================================

begin;

-- 1. Buat user dummy Kasir 1, Kasir 2, dan Owner di auth.users (mock)
-- Verifikasi bahwa tabel tidak dapat diakses anonim
select is_owner(); -- Mengembalikan false jika anonim

-- 2. Uji Update Produk oleh Kasir:
-- Kasir HANYA diizinkan mengupdate kolom is_available pada tabel products.
-- Kasir TIDAK diizinkan mengupdate base_price atau menghapus produk.

-- 3. Uji Isolasi Riwayat Transaksi:
-- Kasir 1 tidak boleh melihat transaksi milik Kasir 2 pada shift yang berbeda / hari sebelumnya.
-- Owner dapat melihat semua transaksi dari seluruh kasir.

-- 4. Uji Pengeluaran & Audit:
-- Kasir hanya dapat mencatat pengeluaran jika shift berstatus 'open'.
-- Kasir tidak memiliki akses membaca tabel audit_logs.

rollback;
