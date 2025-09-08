const { openDatabase } = require('./src/services/DatabaseService');

async function checkSchema() {
  try {
    const db = await openDatabase();
    
    // Periksa skema tabel inventory_transactions
    const result = await db.getAllAsync("PRAGMA table_info(inventory_transactions);");
    console.log("Skema tabel inventory_transactions:");
    console.log(result);
    
    // Periksa skema tabel inventory_items
    const itemsResult = await db.getAllAsync("PRAGMA table_info(inventory_items);");
    console.log("\nSkema tabel inventory_items:");
    console.log(itemsResult);
    
  } catch (error) {
    console.error("Error:", error);
  }
}

checkSchema();