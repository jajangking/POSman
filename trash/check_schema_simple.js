const { openDatabaseAsync } = require('expo-sqlite');

async function checkStoreSettingsSchema() {
  try {
    const db = await openDatabaseAsync('posman.db');
    
    // Check schema of store_settings table
    const result = await db.getAllAsync("PRAGMA table_info(store_settings);");
    console.log("Schema of store_settings table:");
    console.log(result);
    
    // Check if the table exists
    const tableExists = await db.getAllAsync("SELECT name FROM sqlite_master WHERE type='table' AND name='store_settings';");
    console.log("\nDoes store_settings table exist?");
    console.log(tableExists);
    
    // Check some sample data
    try {
      const sampleData = await db.getAllAsync("SELECT * FROM store_settings LIMIT 1;");
      console.log("\nSample data from store_settings:");
      console.log(sampleData);
    } catch (e) {
      console.log("\nNo data found in store_settings or table doesn't exist");
    }
    
  } catch (error) {
    console.error("Error:", error);
  }
}

checkStoreSettingsSchema();