import { initDatabase } from './src/services/DatabaseService';

async function testDatabase() {
  try {
    console.log('Initializing database...');
    await initDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

testDatabase();