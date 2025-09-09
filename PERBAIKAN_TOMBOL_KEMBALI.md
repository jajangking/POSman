# Perbaikan Masalah Tombol Kembali Hardware pada Aplikasi Stock Opname

## Masalah yang Ditemukan
1. Ketika pengguna menekan tombol kembali di navigasi Android, aplikasi langsung menampilkan konfirmasi hapus data dan pergi ke halaman selesai
2. Tidak ada penyimpanan draft otomatis saat pengguna menekan tombol kembali
3. Tidak ada penanganan yang konsisten untuk tombol kembali hardware di semua halaman SO

## Perubahan yang Dilakukan

### 1. Perbaikan pada `src/components/EditSO.tsx`
- Memodifikasi fungsi `handleHardwareBackPress` agar menyimpan draft secara otomatis sebelum kembali
- Menghapus konfirmasi alert yang mengganggu saat menekan tombol kembali
- Menambahkan parameter `showAlert` pada fungsi `handleSaveDraft` untuk kontrol alert

### 2. Penambahan Penanganan Tombol Kembali pada `src/components/PartialSO.tsx`
- Menambahkan fungsi `useImperativeHandle` untuk menangani tombol kembali hardware
- Mengonversi komponen menjadi `React.forwardRef` agar bisa menerima ref
- Memodifikasi fungsi `handleProcess` agar menyimpan draft sebelum melanjutkan ke halaman EditSO

### 3. Perbaikan pada `App.tsx`
- Menambahkan ref untuk komponen PartialSO
- Memperbarui penanganan tombol kembali hardware untuk menyertakan PartialSO
- Memastikan semua halaman SO memiliki penanganan tombol kembali yang konsisten

## Hasil yang Diharapkan
1. Ketika pengguna menekan tombol kembali di halaman EditSO, data akan disimpan secara otomatis sebagai draft
2. Ketika pengguna menekan tombol kembali di halaman PartialSO, data akan disimpan secara otomatis sebagai draft
3. Pengguna dapat melanjutkan pekerjaan mereka dengan mudah tanpa kehilangan data
4. Tidak ada lagi konfirmasi mengganggu yang langsung mengarahkan ke halaman selesai

## Cara Kerja
1. Saat pengguna menekan tombol kembali hardware:
   - Data saat ini disimpan sebagai draft ke sesi database
   - Pengguna dikembalikan ke halaman sebelumnya (StockOpname)
   - Tidak ada konfirmasi mengganggu yang ditampilkan

2. Saat pengguna menekan tombol "Proses" di halaman PartialSO:
   - Data disimpan sebagai draft sebelum melanjutkan ke halaman EditSO
   - Pengguna tetap bisa melanjutkan pekerjaan mereka nanti

3. Saat pengguna menekan tombol "Simpan Draft" di halaman EditSO:
   - Data disimpan sebagai draft dengan notifikasi konfirmasi
   - Pengguna tetap berada di halaman EditSO untuk melanjutkan pekerjaan

Dengan perubahan ini, pengalaman pengguna menjadi lebih baik dan data tidak akan hilang saat aplikasi force close atau pengguna tidak sengaja menekan tombol kembali.