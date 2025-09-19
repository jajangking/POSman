const { openDatabase } = require('./src/services/DatabaseService');

const resetStoreSettings = async () => {
  try {
    console.log('Opening database...');
    const database = await openDatabase();
    
    // Drop store_settings table if it exists
    console.log('Dropping store_settings table...');
    await database.execAsync('DROP TABLE IF EXISTS store_settings;');
    
    // Recreate the table
    console.log('Recreating store_settings table...');
    await database.execAsync(`
      CREATE TABLE store_settings (
        id TEXT PRIMARY KEY DEFAULT 'store_settings',
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT NOT NULL,
        paperSize TEXT NOT NULL DEFAULT '80mm',
        printAuto INTEGER NOT NULL DEFAULT 0,
        discountEnabled INTEGER NOT NULL DEFAULT 0,
        taxEnabled INTEGER NOT NULL DEFAULT 1,
        taxPercentage REAL NOT NULL DEFAULT 10.0,
        footerMessage TEXT NOT NULL DEFAULT 'Terima kasih telah berbelanja di toko kami!',
        bluetoothDevice TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
    
    // Insert default settings
    console.log('Inserting default settings...');
    const now = new Date().toISOString();
    await database.runAsync(
      `INSERT INTO store_settings (id, name, address, phone, paperSize, printAuto, discountEnabled, taxEnabled, taxPercentage, footerMessage, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['store_settings', 'TOKO POSman', 'Jl. Contoh No. 123, Jakarta', '(021) 123-4567', '80mm', 0, 0, 1, 10.0, 'Terima kasih telah berbelanja di toko kami!', now, now]
    );
    
    console.log('Store settings table reset successfully');
  } catch (error) {
    console.error('Error resetting store settings:', error);
  }
};

// Run the reset function
resetStoreSettings().then(() => {
  console.log('Database reset completed');
}).catch((error) => {
  console.error('Error during database reset:', error);
});