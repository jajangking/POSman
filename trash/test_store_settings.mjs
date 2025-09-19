import { initDatabase, getStoreSettings, updateStoreSettings } from './src/services/DatabaseService.ts';

async function testStoreSettings() {
  try {
    console.log('Initializing database...');
    await initDatabase();
    
    console.log('Getting store settings...');
    const settings = await getStoreSettings();
    console.log('Current settings:', settings);
    
    console.log('Updating store settings...');
    await updateStoreSettings(
      'Test Store',
      '123 Test Street',
      '555-1234',
      '80mm',
      true,
      false,
      true,
      10.0,
      'Thank you for shopping with us!',
      ''
    );
    
    console.log('Getting updated settings...');
    const updatedSettings = await getStoreSettings();
    console.log('Updated settings:', updatedSettings);
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testStoreSettings();