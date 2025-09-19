# Perbaikan Sistem Stock Opname - Konfirmasi Keluar & Deteksi Halaman Terakhir

## Masalah yang Ditemukan
1. Tidak ada konfirmasi sebelum keluar dari sesi Stock Opname
2. Sistem tidak bisa mendeteksi halaman terakhir pengguna saat melanjutkan sesi
3. Informasi halaman terakhir tidak disimpan dengan benar dalam sesi

## Perubahan yang Dilakukan

### 1. Konfirmasi Sebelum Keluar Sesi
- **EditSO.tsx**: Menambahkan konfirmasi sebelum keluar dari halaman EditSO dengan opsi "Simpan Draft & Kembali"
- **PartialSO.tsx**: Menambahkan konfirmasi sebelum keluar dari halaman PartialSO dengan opsi "Simpan Draft & Kembali"
- **StockOpname.tsx**: Memperbaiki konfirmasi saat keluar dari halaman utama StockOpname

### 2. Deteksi Halaman Terakhir Pengguna
- **App.tsx**: Memperbarui fungsi `handleNavigate` untuk menyimpan informasi halaman terakhir ke dalam sesi database
- **StockOpname.tsx**: Memperbarui fungsi `handleContinueSession` untuk menggunakan informasi `lastView` dari sesi
- **PartialSO.tsx**: Memperbarui fungsi `handleProcess` untuk menyimpan informasi bahwa pengguna akan pergi ke halaman EditSO

### 3. Penyimpanan Informasi Halaman Terakhir
- **EditSO.tsx**: Memperbarui fungsi `handleSaveDraft` untuk menyimpan informasi bahwa pengguna masih berada di halaman EditSO
- **StockOpname.tsx**: Memperbarui fungsi `handleStartSO` dan `handleBackPress` untuk menyimpan informasi halaman terakhir dengan benar
- **PartialSO.tsx**: Memperbarui fungsi `handleProcess` untuk menyimpan informasi halaman terakhir sebelum melanjutkan ke EditSO

## Cara Kerja Sistem yang Baru

### Saat Memulai Sesi Baru:
1. Pengguna memilih tipe SO (Partial atau Grand)
2. Sistem menyimpan sesi dengan informasi halaman terakhir:
   - Partial SO → 'partialSO'
   - Grand SO → 'editSO' (langsung ke halaman edit)

### Saat Melanjutkan Sesi:
1. Sistem memuat sesi dari database
2. Sistem membaca field `lastView` untuk menentukan halaman terakhir
3. Pengguna langsung dibawa ke halaman terakhir tempat mereka bekerja

### Saat Menavigasi Antar Halaman:
1. Setiap kali pengguna berpindah halaman, sistem memperbarui field `lastView` dalam sesi
2. Informasi ini digunakan saat pengguna kembali ke aplikasi

### Saat Keluar dari Aplikasi:
1. Pengguna menekan tombol kembali hardware
2. Sistem menampilkan konfirmasi: "Apakah Anda yakin ingin kembali? Data SO akan disimpan sebagai draft."
3. Jika pengguna memilih "Simpan Draft & Kembali":
   - Data disimpan sebagai draft ke sesi database
   - Pengguna dikembalikan ke halaman sebelumnya
4. Jika pengguna memilih "Batal":
   - Pengguna tetap berada di halaman saat ini

## Keuntungan Perubahan
1. **Pengalaman Pengguna yang Lebih Baik**: Pengguna selalu diberi konfirmasi sebelum keluar dari sesi
2. **Data Tidak Hilang**: Data selalu disimpan sebagai draft sebelum keluar
3. **Kontinuitas Pekerjaan**: Pengguna bisa melanjutkan dari halaman terakhir tempat mereka bekerja
4. **Fleksibilitas**: Pengguna bisa keluar dan masuk kembali kapan saja tanpa kehilangan kemajuan

## Pengujian yang Direkomendasikan
1. Memulai sesi baru dan memastikan informasi halaman terakhir disimpan dengan benar
2. Keluar dari aplikasi dan memastikan data disimpan sebagai draft
3. Melanjutkan sesi dan memastikan pengguna dibawa ke halaman terakhir
4. Berpindah antar halaman dan memastikan informasi halaman terakhir diperbarui
5. Memastikan konfirmasi keluar muncul saat menekan tombol kembali hardware