# Fitur Pengaturan Struk Lengkap

## Deskripsi
Fitur pengaturan struk lengkap memungkinkan administrator untuk mengonfigurasi semua aspek struk penjualan, termasuk informasi toko, pengaturan cetak, diskon, pajak, dan pesan footer.

## Fitur yang Tersedia

### 1. Informasi Toko
- **Nama Toko**: Nama toko yang akan ditampilkan di struk
- **Alamat**: Alamat lengkap toko
- **Telepon**: Nomor telepon toko

### 2. Pengaturan Struk
- **Ukuran Kertas**: Pilihan ukuran kertas struk (58mm atau 80mm)
- **Footer Message**: Pesan kaki struk yang dapat disesuaikan

### 3. Pengaturan Cetak
- **Cetak Otomatis**: Opsi untuk mencetak struk secara otomatis setelah transaksi
- **Perangkat Bluetooth**: Konfigurasi perangkat Bluetooth untuk printer
- **Scan Bluetooth**: Fitur untuk memindai perangkat Bluetooth yang tersedia

### 4. Pengaturan Diskon
- **Diskon Aktif**: Mengaktifkan atau menonaktifkan fitur diskon
- Diskon tetap 10% diterapkan jika diaktifkan

### 5. Pengaturan Pajak
- **Pajak Aktif**: Mengaktifkan atau menonaktifkan fitur pajak
- **Persentase Pajak**: Mengatur persentase pajak yang akan diterapkan (0-100%)

## Cara Mengakses
### Dari Dashboard:
1. Login sebagai administrator
2. Pada halaman dashboard, klik tombol "Settings"

### Dari Halaman Kasir (F4):
1. Buka halaman kasir (melalui shortcut F4 atau tombol Sales di dashboard)
2. Tekan tombol "F4 Setting" di bagian bawah halaman kasir

## Cara Menggunakan
1. Isi informasi toko (nama, alamat, telepon)
2. Pilih ukuran kertas struk
3. Masukkan pesan footer
4. Aktifkan/nonaktifkan cetak otomatis
5. Masukkan ID perangkat Bluetooth atau gunakan fitur Scan
6. Aktifkan/nonaktifkan diskon
7. Aktifkan/nonaktifkan pajak dan atur persentase
8. Klik tombol "Simpan" untuk menyimpan perubahan

## Validasi
- Persentase pajak harus berupa angka antara 0 dan 100
- Nama toko tidak boleh kosong
- Jika nilai tidak valid, sistem akan menampilkan pesan error

## Penyimpanan Data
Semua pengaturan disimpan di database SQLite lokal dalam tabel `store_settings` dan dapat diakses secara global melalui `SettingsContext`.

## Implementasi Teknis
- Menggunakan React Context API untuk manajemen pengaturan global
- Data disimpan di database SQLite lokal
- Mendukung migrasi database untuk penambahan kolom baru
- Menggunakan sistem state management yang efisien