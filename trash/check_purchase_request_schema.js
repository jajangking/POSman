import { openDatabase } from './src/services/DatabaseService.js';

async function checkPurchaseRequestSchema() {
  try {
    const db = await openDatabase();
    
    // Check schema of purchase_request_history table
    const result = await db.getAllAsync("PRAGMA table_info(purchase_request_history);");
    console.log("Schema of purchase_request_history table:");
    console.log(result);
    
    // Check if there are any records in the table
    const count = await db.getFirstAsync("SELECT COUNT(*) as count FROM purchase_request_history;");
    console.log("\nNumber of records in purchase_request_history:", count.count);
    
    // Show sample records if any exist
    if (count.count > 0) {
      const sample = await db.getAllAsync("SELECT * FROM purchase_request_history LIMIT 3;");
      console.log("\nSample records from purchase_request_history:");
      console.log(sample);
    }
    
  } catch (error) {
    console.error("Error:", error);
  }
}

checkPurchaseRequestSchema();