# Integrasi Supabase dengan POSman

## Gambaran Umum

Integrasi Supabase dengan POSman menggantikan sistem autentikasi dan database lokal SQLite dengan solusi cloud berbasis Supabase. Ini menyediakan:

1. **Autentikasi yang Lebih Aman**: Menggunakan sistem autentikasi Supabase yang kuat
2. **Database Terpusat**: Data disimpan di cloud dan dapat diakses dari berbagai perangkat
3. **Kontrol Akses Berbasis Role**: Menggunakan Row Level Security (RLS) untuk mengontrol akses data
4. **Manajemen User yang Lebih Baik**: Admin dapat membuat dan mengelola user staff dan customer

## Fitur Utama

### Autentikasi dan Otorisasi
- Login dengan email dan password
- Registrasi user baru (fungsi admin)
- Manajemen sesi otomatis
- Proteksi password oleh Supabase

### Manajemen User
- Admin dapat membuat user staff dan customer
- Setiap user hanya dapat mengakses data yang sesuai dengan perannya
- Guest users untuk akses terbatas

### Database Terpusat
- Semua data disimpan di database Supabase
- Sinkronisasi data antar perangkat
- Backup dan recovery otomatis

### Keamanan Data
- Row Level Security (RLS) untuk kontrol akses data
- Enkripsi data di rest
- Audit trail untuk aktivitas penting

## Struktur Implementasi

### File Utama
1. `src/config/supabase.ts` - Konfigurasi klien Supabase
2. `src/services/AuthService.ts` - Layanan autentikasi
3. `src/services/DatabaseServiceSupabase.ts` - Layanan database
4. `src/context/AuthContext.tsx` - Context untuk manajemen autentikasi
5. `src/components/LoginPanel.tsx` - Komponen login
6. `src/components/UserManagementForm.tsx` - Form untuk manajemen user

### Tabel Database
1. `users` - Informasi user
2. `inventory_items` - Item inventaris
3. `inventory_transactions` - Transaksi inventaris
4. `members` - Data member
5. `store_settings` - Pengaturan toko

## Cara Menggunakan

### Prasyarat
Sebelum menggunakan aplikasi, Anda perlu:

1. Membuat tabel-tabel di Supabase
2. Membuat user default di Supabase Auth

### Setup Database
Jalankan perintah berikut untuk mendapatkan instruksi setup database:
```bash
npm run setup:db
```

Ikuti instruksi yang ditampilkan untuk membuat tabel-tabel di Supabase. **Pastikan untuk membuat tabel `users` terlebih dahulu** sebelum tabel lainnya.

### Membuat User Default
Setelah membuat tabel, jalankan perintah berikut untuk membuat user default:
```bash
npm run create:users
```

Ini akan membuat 3 user default:
- Admin: email "admin@posman.com", password "admin123"
- Staff: email "staff@posman.com", password "staff123"
- Customer: email "customer@posman.com", password "customer123"

### Instalasi
1. Tambahkan dependensi Supabase (jika belum ada):
   ```bash
   npm install @supabase/supabase-js
   ```

2. File `.env` sudah dibuat dengan konfigurasi Supabase Anda

### Penggunaan
1. Jalankan aplikasi:
   ```bash
   npm start
   ```

2. Login dengan kredensial default:
   - Admin: email "admin@posman.com", password "admin123"
   - Staff: email "staff@posman.com", password "staff123"
   - Customer: email "customer@posman.com", password "customer123"

3. Admin dapat membuat user baru melalui menu "User Management"

## Keuntungan

1. **Skalabilitas**: Dapat menangani banyak user dan toko
2. **Keamanan**: Proteksi password dan kontrol akses yang lebih baik
3. **Sinkronisasi**: Data tersedia di semua perangkat
4. **Manajemen**: Admin memiliki kontrol penuh atas user dan data

## Pertimbangan

1. **Koneksi Internet**: Aplikasi memerlukan koneksi internet untuk berfungsi
2. **Biaya**: Supabase memiliki batasan gratis dan biaya berdasarkan penggunaan
3. **Kompleksitas**: Implementasi lebih kompleks dibandingkan SQLite lokal

## Dokumentasi Tambahan

- `SUPABASE_SCHEMA.md` - Struktur database dan RLS policies
- `MIGRATION_GUIDE.md` - Panduan migrasi dari SQLite ke Supabase
- `README_AUTH.md` - Dokumentasi sistem autentikasi