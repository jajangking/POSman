/**
 * Test script to verify store settings fixes
 * This script tests the database operations related to store settings
 */

import { initDatabase, getStoreSettings, updateStoreSettings } from './src/services/DatabaseService';

async function testStoreSettings() {
  console.log('Testing store settings functionality...');
  
  try {
    // Initialize the database
    console.log('1. Initializing database...');
    await initDatabase();
    console.log('   Database initialized successfully');
    
    // Get current settings
    console.log('2. Getting current store settings...');
    const currentSettings = await getStoreSettings();
    console.log('   Current settings:', currentSettings);
    
    // Update settings with valid data
    console.log('3. Updating store settings with valid data...');
    await updateStoreSettings(
      'Test Store Name',  // name - should not be empty
      '123 Test Street',   // address
      '555-1234',         // phone
      '80mm',             // paperSize
      true,               // printAuto
      false,              // discountEnabled
      true,               // taxEnabled
      10.0,               // taxPercentage
      'Thank you for your business!', // footerMessage
      'BT123456'          // bluetoothDevice
    );
    console.log('   Settings updated successfully');
    
    // Verify updated settings
    console.log('4. Verifying updated settings...');
    const updatedSettings = await getStoreSettings();
    console.log('   Updated settings:', updatedSettings);
    
    // Test with empty name (should fail)
    console.log('5. Testing update with empty name (should fail)...');
    try {
      await updateStoreSettings(
        '',                 // name - empty, should cause validation error
        '123 Test Street',   // address
        '555-1234',         // phone
        '80mm',             // paperSize
        true,               // printAuto
        false,              // discountEnabled
        true,               // taxEnabled
        10.0,               // taxPercentage
        'Thank you for your business!', // footerMessage
        'BT123456'          // bluetoothDevice
      );
      console.log('   ERROR: Update with empty name should have failed but did not');
    } catch (error) {
      console.log('   Expected error occurred:', error.message);
    }
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testStoreSettings();