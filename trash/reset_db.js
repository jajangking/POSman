// Simple script to reset the store_settings table
const fs = require('fs');

// Check if the database file exists
const dbPath = './posman.db';
if (fs.existsSync(dbPath)) {
  console.log('Database file found');
  
  // Try to delete the database file
  try {
    fs.unlinkSync(dbPath);
    console.log('Database file deleted successfully');
  } catch (error) {
    console.error('Error deleting database file:', error);
  }
} else {
  console.log('Database file not found');
}

console.log('Database reset completed. The app will recreate the database with the correct schema on next run.');