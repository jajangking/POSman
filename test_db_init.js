// Test script for database initialization
import { initDatabase } from './src/services/DatabaseService';

async function testDatabaseInit() {
  try {
    console.log('Testing database initialization...');
    await initDatabase();
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

testDatabaseInit();