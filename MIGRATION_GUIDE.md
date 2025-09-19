# Migrasi dari SQLite ke Supabase

## Gambaran Umum

Dokumen ini menjelaskan proses migrasi data dari sistem SQLite lokal ke Supabase yang terpusat. Proses ini diperlukan untuk beralih dari autentikasi lokal ke sistem autentikasi dan database terpusat berbasis cloud.

## Prasyarat

1. Supabase project yang telah dibuat
2. Environment variables yang telah dikonfigurasi (`EXPO_PUBLIC_SUPABASE_URL` dan `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
3. Tabel-tabel yang telah dibuat di Supabase sesuai dengan `SUPABASE_SCHEMA.md`
4. Akses ke database SQLite lokal

## Langkah-langkah Migrasi

### 1. Backup Database SQLite Lokal
Sebelum memulai migrasi, buat backup dari database SQLite lokal Anda:
```bash
# Di direktori project
cp posman.db posman.db.backup
```

### 2. Instal Dependensi
Pastikan semua dependensi telah diinstal:
```bash
npm install @supabase/supabase-js
```

### 3. Konfigurasi Environment Variables
Buat file `.env` dengan konfigurasi Supabase Anda:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Jalankan Script Migrasi
Jalankan script migrasi untuk memindahkan data dari SQLite ke Supabase:
```bash
npx ts-node src/utils/migrateToSupabase.ts
```

## Detail Migrasi per Tabel

### Users Table
- Migrasi semua user dari tabel `users` di SQLite ke tabel `users` di Supabase
- Konversi field `username` ke `email` jika diperlukan
- Pertahankan role dan informasi lainnya

### Inventory Items Table
- Migrasi semua item dari tabel `inventory_items` di SQLite ke tabel `inventory_items` di Supabase
- Pertahankan semua field dan nilai

### Inventory Transactions Table
- Migrasi semua transaksi dari tabel `inventory_transactions` di SQLite ke tabel `inventory_transactions` di Supabase
- Pertahankan referensi ke item dan user

### Members Table
- Migrasi semua member dari tabel `members` di SQLite ke tabel `members` di Supabase
- Pertahankan semua informasi member

## Penanganan Error

Script migrasi mencakup penanganan error dasar:
- Error pada level koneksi database
- Error pada query individu
- Duplikasi data

Jika terjadi error selama migrasi, script akan mencatat error tersebut dan melanjutkan dengan data lainnya.

## Verifikasi Migrasi

Setelah migrasi selesai, verifikasi data di Supabase:
1. Periksa jumlah record di setiap tabel
2. Periksa sample data untuk memastikan integritas
3. Uji autentikasi dengan user yang telah dimigrasi

## Rollback

Jika terjadi masalah setelah migrasi:
1. Gunakan backup database SQLite (`posman.db.backup`)
2. Kosongkan tabel di Supabase
3. Jalankan ulang script migrasi setelah masalah diperbaiki

## Pertimbangan Keamanan

- Pastikan environment variables tidak di-commit ke repository
- Setelah migrasi, pertimbangkan untuk menghapus data sensitif dari backup
- Aktifkan RLS (Row Level Security) di Supabase setelah migrasi