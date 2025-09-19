# Implementasi Halaman Settings Terpisah untuk Kasir

## Ringkasan
Implementasi halaman settings terpisah untuk fitur kasir yang memungkinkan administrator mengonfigurasi berbagai aspek sistem penjualan, termasuk informasi toko, pengaturan struk, opsi pencetakan, diskon, dan pajak.

## Komponen yang Dibuat

### 1. SettingsPage.tsx
Komponen utama yang menyediakan antarmuka untuk mengelola semua pengaturan toko:
- Informasi toko (nama, alamat, telepon)
- Pengaturan struk (ukuran kertas, pesan footer)
- Pengaturan pencetakan (cetak otomatis, perangkat Bluetooth)
- Pengaturan diskon (aktif/tidak aktif)
- Pengaturan pajak (aktif/tidak aktif, persentase)

### 2. FunctionButtons.tsx
Diperbarui untuk mengubah fungsi tombol F4 dari "Hold" menjadi "Setting" yang membuka halaman pengaturan.

## Integrasi dengan Aplikasi

### 1. Routing
- Menambahkan route baru untuk halaman settings di App.tsx
- Memperbarui state navigation untuk menyertakan 'settings'

### 2. Navigasi
- Menambahkan tombol "Store Settings" di dashboard admin
- Menambahkan fungsi navigasi ke settings dari halaman kasir (tombol F4)

### 3. Akses
- Halaman settings dapat diakses oleh administrator dari dashboard
- Halaman settings dapat diakses dari halaman kasir melalui tombol F4

## Fitur yang Diimplementasikan

### 1. Informasi Toko
- Nama toko
- Alamat toko
- Nomor telepon

### 2. Pengaturan Struk
- Ukuran kertas (58mm/80mm)
- Pesan footer yang dapat disesuaikan

### 3. Pengaturan Pencetakan
- Opsi cetak otomatis
- Konfigurasi perangkat Bluetooth
- Fungsi scan Bluetooth (placeholder)

### 4. Pengaturan Diskon
- Toggle on/off untuk fitur diskon

### 5. Pengaturan Pajak
- Toggle on/off untuk fitur pajak
- Pengaturan persentase pajak (0-100%)

## Validasi
- Validasi input untuk persentase pajak
- Pesan error yang jelas untuk input yang tidak valid

## Penyimpanan Data
- Semua pengaturan disimpan di database SQLite lokal
- Menggunakan fungsi yang sudah ada di DatabaseService.ts

## Kesesuaian dengan Database yang Ada
- Tidak mengubah struktur database yang sudah ada
- Menggunakan fungsi-fungsi yang sudah ada di DatabaseService.ts
- Tidak menghapus atau merusak data yang sudah ada

## Cara Menggunakan

### Dari Dashboard (Administrator)
1. Login sebagai administrator
2. Klik tombol "Store Settings" di bagian Admin Tools

### Dari Halaman Kasir (F4)
1. Buka halaman kasir
2. Tekan tombol F4 (tombol "Setting" di bagian bawah)
3. Halaman settings akan terbuka

### Mengelola Pengaturan
1. Ubah pengaturan sesuai kebutuhan
2. Klik tombol "Save" untuk menyimpan perubahan
3. Gunakan tombol "Scan" untuk mencari perangkat Bluetooth (placeholder)

## Keuntungan Implementasi
- Memisahkan fungsi pengaturan dari fungsi penjualan
- Memudahkan administrator dalam mengelola konfigurasi toko
- Menyediakan akses cepat ke pengaturan dari halaman kasir
- Mempertahankan semua data dan struktur database yang sudah ada