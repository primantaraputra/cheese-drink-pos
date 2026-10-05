# Panduan Lengkap Deploy Cheese Drink POS ke Vercel

Aplikasi **Cheese Drink POS** dibangun menggunakan **Next.js 16 (App Router)** dan siap 100% untuk dideploy langsung ke **Vercel** dengan performa tinggi.

---

## Opsi 1: Deploy via GitHub (Sangat Direkomendasikan ⭐)
Metode ini adalah standar industri: Setiap kali Anda melakukan perubahan kode dan push ke GitHub, Vercel akan otomatis meng-update aplikasi Anda.

### Langkah 1: Buat Repository di GitHub
1. Buka [github.com/new](https://github.com/new).
2. Buat repository baru (bebas pilih **Public** atau **Private**), misalnya beri nama: `cheese-drink-pos`.
3. Biarkan opsi *"Initialize this repository with a README"* tidak dicentang (karena kode lokal kita sudah ada).
4. Klik **Create repository**.

### Langkah 2: Hubungkan & Push Kode Lokal ke GitHub
Buka terminal PowerShell di folder proyek ini (`c:\Users\prima\.gemini\antigravity-ide\scratch\cheese-drink-pos`), lalu jalankan:

```powershell
git remote add origin https://github.com/USERNAME_ANDA/cheese-drink-pos.git
git push -u origin main
```
*(Ganti `USERNAME_ANDA` dengan username GitHub Anda).*

---

### Langkah 3: Import Project di Vercel
1. Buka dashboard [vercel.com](https://vercel.com) (login dengan akun GitHub).
2. Klik tombol **"Add New..."** lalu pilih **"Project"**.
3. Di daftar repository GitHub Anda, cari repository `cheese-drink-pos`, lalu klik **Import**.
4. Di bagian konfigurasi:
   - **Framework Preset**: Pilih `Next.js` (otomatis terdeteksi).
   - **Root Directory**: Biarkan `./`.
5. Buka dropdown **Environment Variables**, lalu tambahkan variabel berikut:

| Key (Nama Variabel) | Value (Nilai) |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://dummy-cheese-drink.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `dummy-anon-key-for-local-development-cheese-drink-pos` |
| `SUPABASE_SERVICE_ROLE_KEY` | `dummy-service-role-key-for-local-development` |
| `NEXT_PUBLIC_APP_NAME` | `Cheese Drink POS` |

*(Catatan: Jika nantinya Anda sudah menghubungkan ke proyek Supabase PostgreSQL asli, cukup ganti nilai URL dan Anon Key di atas).*

6. Klik tombol **"Deploy"**!
7. Tunggu sekitar 1 menit. Aplikasi Anda akan langsung aktif dengan URL resmi seperti:
   `https://cheese-drink-pos.vercel.app` (dapat diakses dari HP, laptop, dan tablet di mana saja tanpa perlu satu jaringan WiFi).

---

## Opsi 2: Deploy Cepat via Terminal (Vercel CLI)
Jika tidak ingin membuat repository GitHub terlebih dahulu:

1. Buka PowerShell di folder proyek ini:
   ```powershell
   npx vercel login
   ```
   *(Pilih login dengan Email atau GitHub di browser yang terbuka).*

2. Jalankan perintah deploy ke production:
   ```powershell
   npx vercel --prod
   ```
3. Ikuti pertanyaan di terminal:
   - *Set up and deploy?* Tekan **Y**
   - *Which scope?* Pilih akun Anda
   - *Link to existing project?* Tekan **N**
   - *What's your project's name?* Tekan **Enter** (`cheese-drink-pos`)
   - *In which directory is your code located?* Tekan **Enter** (`./`)
4. Vercel akan otomatis mengunggah dan memberikan link website online Anda.
