const { initDatabase } = require('./src/services/DatabaseService');

async function testDatabase() {
  try {
    console.log('Initializing database...');
    await initDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

testDatabase();