const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Open database
const dbPath = path.join(__dirname, 'posman.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  
  console.log('Connected to database at:', dbPath);
  
  // Check schema of purchase_request_history table
  db.all("PRAGMA table_info(purchase_request_history);", (err, rows) => {
    if (err) {
      console.error('Error querying schema:', err);
      return;
    }
    
    console.log("Schema of purchase_request_history table:");
    console.log(rows);
    
    // Check if there are any records in the table
    db.get("SELECT COUNT(*) as count FROM purchase_request_history;", (err, row) => {
      if (err) {
        console.error('Error counting records:', err);
        return;
      }
      
      console.log("\nNumber of records in purchase_request_history:", row.count);
      
      // Show sample records if any exist
      if (row.count > 0) {
        db.all("SELECT * FROM purchase_request_history LIMIT 3;", (err, rows) => {
          if (err) {
            console.error('Error getting sample records:', err);
            return;
          }
          
          console.log("\nSample records from purchase_request_history:");
          console.log(rows);
        });
      } else {
        console.log("No records found in purchase_request_history table");
        db.close();
      }
    });
  });
  
  // Also check all tables in the database
  db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, rows) => {
    if (err) {
      console.error('Error getting table list:', err);
      return;
    }
    
    console.log("\nAll tables in database:");
    console.log(rows);
  });
});

// Close database when all queries are done
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
  });
}, 1000);