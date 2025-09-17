import * as SQLite from 'expo-sqlite';

async function checkStoreSettingsSchema() {
  try {
    const db = await SQLite.openDatabaseAsync('posman.db');
    
    // Check schema of store_settings table
    const result = await db.getAllAsync("PRAGMA table_info(store_settings);");
    console.log("Schema of store_settings table:");
    console.log(result);
    
    // Check if the table exists
    const tableExists = await db.getAllAsync("SELECT name FROM sqlite_master WHERE type='table' AND name='store_settings';");
    console.log("\nDoes store_settings table exist?");
    console.log(tableExists);
    
  } catch (error) {
    console.error("Error:", error);
  }
}

checkStoreSettingsSchema();