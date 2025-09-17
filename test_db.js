import { initDatabase, getStoreSettings, updateStoreSettings } from './src/services/DatabaseService';

async function testDatabase() {
  try {
    console.log('Initializing database...');
    await initDatabase();
    console.log('Database initialized successfully');
    
    // Try to get store settings
    console.log('Getting store settings...');
    const settings = await getStoreSettings();
    console.log('Store settings:', settings);
    
    // Try to update store settings
    console.log('Updating store settings...');
    await updateStoreSettings(
      'Test Store',
      '123 Test Street',
      '(555) 123-4567',
      '80mm',
      false,
      false,
      true,
      10.0,
      'Thank you for your business!',
      ''
    );
    console.log('Store settings updated successfully');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testDatabase();