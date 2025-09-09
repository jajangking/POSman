const fs = require('fs');
const path = require('path');

// Fungsi untuk memeriksa file database SQLite
function checkDatabase() {
  const dbPath = path.join(__dirname, 'posman.db');
  
  // Periksa apakah file database ada
  if (!fs.existsSync(dbPath)) {
    console.log("File database tidak ditemukan");
    return;
  }
  
  console.log("File database ditemukan di:", dbPath);
  
  // Periksa ukuran file
  const stats = fs.statSync(dbPath);
  console.log("Ukuran database:", stats.size, "bytes");
  
  // Kita tidak bisa membaca isi database SQLite dengan JavaScript biasa
  // Tapi kita bisa memeriksa apakah file ada dan ukurannya tidak nol
  if (stats.size > 0) {
    console.log("Database tampaknya sudah diinisialisasi");
  } else {
    console.log("Database kosong");
  }
}

// Fungsi untuk memeriksa struktur folder
function checkProjectStructure() {
  console.log("Memeriksa struktur project...");
  
  const srcPath = path.join(__dirname, 'src');
  if (fs.existsSync(srcPath)) {
    console.log("Folder src ditemukan");
    
    const servicesPath = path.join(srcPath, 'services');
    if (fs.existsSync(servicesPath)) {
      console.log("Folder src/services ditemukan");
      
      const dbServicePath = path.join(servicesPath, 'DatabaseService.ts');
      if (fs.existsSync(dbServicePath)) {
        console.log("File DatabaseService.ts ditemukan");
      } else {
        console.log("File DatabaseService.ts tidak ditemukan");
      }
    } else {
      console.log("Folder src/services tidak ditemukan");
    }
  } else {
    console.log("Folder src tidak ditemukan");
  }
}

// Fungsi untuk memeriksa tabel so_sessions
async function checkSOSessions() {
  try {
    // Kita akan menggunakan pendekatan simulasi karena tidak bisa mengakses SQLite dari sini
    console.log("Untuk memeriksa tabel so_sessions, jalankan aplikasi dan periksa log console saat proses SO berlangsung.");
    console.log("Tabel so_sessions digunakan untuk menyimpan sesi Stock Opname yang sedang berjalan.");
    console.log("Jika data SO terakhir tidak tersimpan, kemungkinan besar:");
    console.log("1. Tabel so_sessions tidak diinisialisasi dengan benar");
    console.log("2. Data sesi tidak disimpan ke tabel so_sessions");
    console.log("3. Data sesi tidak dimuat kembali saat aplikasi dimulai ulang");
    console.log("4. Terjadi error saat menyimpan atau memuat data sesi");
  } catch (error) {
    console.error("Error:", error);
  }
}

// Jalankan pemeriksaan
console.log("=== Pemeriksaan Database Stock Opname ===");
checkProjectStructure();
checkDatabase();
console.log("========================================");
console.log("=== Informasi Tabel so_sessions ===");
checkSOSessions();
console.log("===================================");