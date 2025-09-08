const { openDatabase } = require('./src/services/DatabaseService');

async function checkSOHistory() {
  try {
    const db = await openDatabase();
    
    // Periksa apakah tabel so_history ada
    const tableExists = await db.getFirstAsync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='so_history';"
    );
    
    if (!tableExists) {
      console.log("Tabel so_history tidak ditemukan");
      return;
    }
    
    // Periksa jumlah data dalam tabel
    const count = await db.getFirstAsync("SELECT COUNT(*) as count FROM so_history;");
    console.log("Jumlah riwayat SO:", count.count);
    
    // Jika ada data, tampilkan beberapa data pertama
    if (count.count > 0) {
      const history = await db.getAllAsync("SELECT * FROM so_history LIMIT 5;");
      console.log("Beberapa riwayat SO pertama:");
      console.log(history);
      
      // Periksa struktur tabel
      const schema = await db.getAllAsync("PRAGMA table_info(so_history);");
      console.log("Struktur tabel so_history:");
      console.log(schema);
    } else {
      console.log("Tidak ada data dalam tabel so_history");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

checkSOHistory();