// Script to reset the database
// This will delete the existing database file so that the app can create a new one with the correct schema

import { initDatabase } from './src/services/DatabaseService';

async function resetDatabase() {
  try {
    console.log('Initializing database with new schema...');
    await initDatabase();
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

resetDatabase();