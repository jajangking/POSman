# Fitur Pengaturan Discount dan Tax

## Deskripsi
Fitur pengaturan discount dan tax memungkinkan administrator untuk mengonfigurasi apakah fitur discount dan tax akan diaktifkan dalam aplikasi, serta mengatur persentase tax yang akan diterapkan.

## Fitur yang Tersedia

### 1. Discount Settings
- **Toggle Discount**: Mengaktifkan atau menonaktifkan fitur discount
- Jika diaktifkan, sistem akan menerapkan discount 10% pada subtotal

### 2. Tax Settings
- **Toggle Tax**: Mengaktifkan atau menonaktifkan fitur tax
- **Tax Percentage**: Mengatur persentase tax yang akan diterapkan (0-100%)

## Cara Mengakses
### Dari Dashboard:
1. Login sebagai administrator
2. Pada halaman dashboard, klik tombol "Settings"

### Dari Halaman Kasir (F4):
1. Buka halaman kasir (melalui shortcut F4 atau tombol Sales di dashboard)
2. Tekan tombol "F4 Setting" di bagian bawah halaman kasir

## Cara Menggunakan
1. Aktifkan/nonaktifkan toggle Discount sesuai kebutuhan
2. Aktifkan/nonaktifkan toggle Tax sesuai kebutuhan
3. Atur persentase tax pada kolom input
4. Klik tombol "Save Settings" untuk menyimpan perubahan

## Validasi
- Persentase tax harus berupa angka antara 0 dan 100
- Jika nilai tidak valid, sistem akan menampilkan pesan error

## Implementasi Teknis
Pengaturan disimpan dalam state aplikasi dan dapat diintegrasikan dengan penyimpanan persisten (database) di implementasi selanjutnya.