# Perubahan untuk Memperbaiki Masalah "Data SO Terakhir Tidak Tersimpan"

## Ringkasan Perubahan

### 1. Perbaikan pada `src/components/StockOpname.tsx`

1. Memperbaiki fungsi `handleContinueSession` agar tidak menghapus sesi secara prematur
2. Membiarkan sesi tetap ada untuk kemungkinan kembali ke sesi yang sama
3. Memperbarui `handleStartSO` agar untuk Grand SO langsung menuju ke halaman EditSO

### 2. Perbaikan pada `src/components/PartialSO.tsx`

1. Menambahkan state tracking `isSaving` untuk mencegah penyimpanan ganda
2. Menerapkan debounce pada efek penyimpanan item (500ms delay) untuk mencegah terlalu sering menyimpan
3. Menghapus penghapusan sesi prematur saat pindah ke halaman EditSO
4. Menunda penghapusan sesi sampai proses SO benar-benar selesai

### 3. Perbaikan pada `src/components/EditSO.tsx`

1. Menambahkan kemampuan penyimpanan sementara (draft) di halaman EditSO
2. Menambahkan state tracking `isSessionSaving` untuk mencegah penyimpanan sesi ganda
3. Menerapkan debounce pada efek penyimpanan item (500ms delay)
4. Menambahkan fungsi `handleSaveDraft` untuk menyimpan sementara tanpa menyelesaikan SO
5. Menambahkan tombol "Simpan Draft" di UI
6. Memastikan sesi dimuat saat komponen diinisialisasi jika ada data tersimpan

## Penjelasan Perubahan

### Penyimpanan Sementara di EditSO
Dengan menambahkan fungsi penyimpanan sementara di halaman EditSO, pengguna sekarang dapat:
1. Menyimpan draft pekerjaan mereka tanpa menyelesaikan SO
2. Melanjutkan pekerjaan mereka jika terjadi force close
3. Menghindari kehilangan data saat aplikasi tidak sengaja ditutup

### Navigasi yang Ditingkatkan
Perubahan pada navigasi memungkinkan pengguna untuk:
1. Melanjutkan sesi dari halaman EditSO jika itu adalah halaman terakhir yang digunakan
2. Langsung menuju halaman EditSO untuk Grand SO karena tidak memerlukan pemilihan item

### Penyimpanan yang Lebih Andal
Dengan menerapkan debounce dan state tracking:
1. Mengurangi frekuensi penyimpanan ke database
2. Mencegah kondisi balapan saat menyimpan data
3. Memastikan data tersimpan dengan konsisten

## Hasil yang Diharapkan

Setelah perubahan ini:
1. Data SO terakhir akan tetap tersimpan saat pengguna keluar dari aplikasi
2. Data dapat dilanjutkan dengan benar saat pengguna kembali ke aplikasi
3. Pengguna dapat menyimpan draft pekerjaan mereka di halaman EditSO
4. Sesi hanya dihapus setelah proses SO benar-benar selesai
5. Tidak terjadi kondisi balapan saat menyimpan data
6. Pengguna dapat melanjutkan dari halaman EditSO jika aplikasi force close