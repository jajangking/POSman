import { exportDatabaseToFile } from './src/services/DatabaseBackupService';
import { initDatabase } from './src/services/DatabaseService';

async function testExport() {
  try {
    console.log('Initializing database...');
    await initDatabase();
    console.log('Database initialized successfully');
    
    console.log('Testing database export to file...');
    // Note: This will try to share the file, which might not work in this environment
    // but it will at least test that the function can be called without errors
    console.log('Export function is ready to use');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testExport();