// Migration script to fix store_settings table schema
const { openDatabase } = require('expo-sqlite');

async function migrateStoreSettings() {
  try {
    console.log('Opening database...');
    const db = await openDatabase('posman.db');
    
    // Check if store_settings table exists
    const tableExists = await db.getFirstAsync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='store_settings';"
    );
    
    if (!tableExists) {
      console.log('store_settings table does not exist, creating with correct schema...');
      await db.execAsync(`
        CREATE TABLE store_settings (
          id TEXT PRIMARY KEY DEFAULT 'store_settings',
          name TEXT NOT NULL DEFAULT 'TOKO POSman',
          address TEXT,
          phone TEXT,
          paperSize TEXT NOT NULL DEFAULT '80mm',
          printAuto INTEGER NOT NULL DEFAULT 0,
          discountEnabled INTEGER NOT NULL DEFAULT 0,
          taxEnabled INTEGER NOT NULL DEFAULT 1,
          taxPercentage REAL NOT NULL DEFAULT 10.0,
          footerMessage TEXT,
          bluetoothDevice TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);
      console.log('store_settings table created successfully');
      return;
    }
    
    // Check current schema
    const columns = await db.getAllAsync("PRAGMA table_info(store_settings);");
    const columnNames = columns.map(col => col.name);
    
    console.log('Current columns:', columnNames);
    
    // Check if we already have the correct schema
    const hasCorrectSchema = columnNames.includes('name') && 
                            columnNames.includes('address') && 
                            columnNames.includes('phone') &&
                            !columnNames.includes('storeName');
    
    if (hasCorrectSchema) {
      console.log('store_settings table already has correct schema');
      return;
    }
    
    console.log('Migrating store_settings table...');
    
    // Create new table with correct schema
    await db.execAsync(`
      CREATE TABLE store_settings_new (
        id TEXT PRIMARY KEY DEFAULT 'store_settings',
        name TEXT NOT NULL DEFAULT 'TOKO POSman',
        address TEXT,
        phone TEXT,
        paperSize TEXT NOT NULL DEFAULT '80mm',
        printAuto INTEGER NOT NULL DEFAULT 0,
        discountEnabled INTEGER NOT NULL DEFAULT 0,
        taxEnabled INTEGER NOT NULL DEFAULT 1,
        taxPercentage REAL NOT NULL DEFAULT 10.0,
        footerMessage TEXT,
        bluetoothDevice TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
    
    // Copy data from old table to new table
    if (columnNames.includes('storeName')) {
      console.log('Copying data from old column names...');
      await db.execAsync(`
        INSERT INTO store_settings_new 
        SELECT id, 
               COALESCE(storeName, 'TOKO POSman'),
               COALESCE(storeAddress, ''),
               COALESCE(storePhone, ''),
               paperSize, 
               printAuto, 
               discountEnabled, 
               taxEnabled, 
               taxPercentage, 
               footerMessage, 
               bluetoothDevice, 
               createdAt, 
               updatedAt
        FROM store_settings;
      `);
    } else {
      console.log('Copying data from existing columns...');
      await db.execAsync(`
        INSERT INTO store_settings_new 
        SELECT id, 
               COALESCE(name, 'TOKO POSman'),
               COALESCE(address, ''),
               COALESCE(phone, ''),
               paperSize, 
               printAuto, 
               discountEnabled, 
               taxEnabled, 
               taxPercentage, 
               footerMessage, 
               bluetoothDevice, 
               createdAt, 
               updatedAt
        FROM store_settings;
      `);
    }
    
    // Drop old table
    await db.execAsync('DROP TABLE store_settings;');
    
    // Rename new table to original name
    await db.execAsync('ALTER TABLE store_settings_new RENAME TO store_settings;');
    
    console.log('store_settings table migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

migrateStoreSettings();