# Perbaikan Error Database SQLite

## Masalah
Error yang terjadi:
```
ERROR  Error getting user by username: [Error: Call to function 'NativeDatabase.prepareAsync' has been rejected.
→ Caused by: java.lang.NullPointerException: java.lang.NullPointerException]
```

Error ini disebabkan oleh konflik pada struktur tabel `store_settings` yang terjadi saat melakukan migrasi database dengan menambahkan kolom baru ke tabel yang sudah ada.

## Solusi yang Diimplementasikan

### 1. Pemeriksaan Tabel yang Lebih Robust
- Memperbarui fungsi `createStoreSettingsTable` untuk memeriksa keberadaan tabel sebelum membuatnya
- Menggunakan query `sqlite_master` untuk memeriksa apakah tabel sudah ada

### 2. Migrasi Database yang Lebih Aman
- Menambahkan blok try-catch di sekitar setiap operasi migrasi
- Memeriksa keberadaan setiap kolom sebelum mencoba menambahkannya
- Menangani error secara individual untuk setiap operasi

### 3. Inisialisasi Ulang Tabel
- Membuat skrip `reset_store_settings.js` untuk membersihkan dan membuat ulang tabel
- Menghapus tabel yang bermasalah dan membuatnya dari awal dengan struktur yang benar

## Cara Mengatasi Error

### Opsi 1: Menggunakan Skrip Reset (Direkomendasikan)
1. Jalankan skrip reset database:
   ```bash
   node reset_store_settings.js
   ```

2. Restart aplikasi

### Opsi 2: Hapus Data Aplikasi
1. Hapus data aplikasi dari device/emulator
2. Restart aplikasi untuk menginisialisasi database baru

## Pencegahan di Masa Depan

### 1. Validasi Struktur Tabel
- Selalu memeriksa keberadaan tabel dan kolom sebelum melakukan operasi
- Menggunakan pendekatan bertahap dalam migrasi database

### 2. Penanganan Error yang Lebih Baik
- Menambahkan logging yang lebih detail untuk setiap operasi database
- Memisahkan operasi migrasi untuk setiap tabel

### 3. Pengujian Migrasi
- Mengujikan migrasi database dengan data yang sudah ada
- Memastikan kompatibilitas backward saat menambahkan kolom baru

## Ringkasan Perubahan

### File yang Diperbarui:
1. `src/services/DatabaseService.ts` - Memperbaiki fungsi migrasi dan inisialisasi
2. `reset_store_settings.js` - Skrip untuk mereset tabel store_settings

### Perbaikan Kunci:
- Memastikan tabel `store_settings` dibuat dengan struktur yang benar
- Menangani error migrasi dengan lebih baik
- Menyediakan mekanisme untuk mereset database saat terjadi error