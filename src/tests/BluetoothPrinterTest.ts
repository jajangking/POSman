/**
 * @file Bluetooth Printer Integration Test
 * 
 * This file demonstrates how to use the Bluetooth printer functionality
 * in the POSman application.
 */

import { 
  connectToPrinter, 
  disconnectPrinter, 
  isPrinterConnected, 
  printReceipt, 
  scanForDevices, 
  testPrinterConnection,
  getConnectionStatus
} from '../services/PrinterService';

// Example usage of the Bluetooth printer service
async function testBluetoothPrinter() {
  console.log('Testing Bluetooth Printer Integration...');
  
  // 1. Scan for devices
  console.log('Scanning for Bluetooth devices...');
  const devices = await scanForDevices();
  console.log(`Found ${devices.length} devices:`, devices);
  
  // 2. Connect to a device (using the first one found as an example)
  if (devices.length > 0) {
    const deviceId = devices[0].id;
    console.log(`Connecting to device: ${deviceId}`);
    const connected = await connectToPrinter(deviceId);
    
    if (connected) {
      console.log('Successfully connected to printer');
      
      // 3. Check connection status
      const isConnected = await isPrinterConnected();
      console.log(`Printer connected: ${isConnected}`);
      
      // 4. Get detailed connection status
      const status = getConnectionStatus();
      console.log('Connection status:', status);
      
      // 5. Test printer connection
      console.log('Testing printer connection...');
      const testResult = await testPrinterConnection(deviceId);
      console.log(`Printer test result: ${testResult ? 'Success' : 'Failed'}`);
      
      // 6. Print a sample receipt (only if test was successful)
      if (testResult) {
        const sampleReceipt = {
          storeName: 'TOKO POSman',
          storeAddress: 'Jl. Contoh No. 123, Jakarta',
          storePhone: '(021) 123-4567',
          transactionId: 'TXN001',
          date: new Date().toLocaleDateString('id-ID'),
          cashier: 'Admin',
          items: [
            { name: 'Product 1', qty: 2, price: 10000, subtotal: 20000 },
            { name: 'Product 2', qty: 1, price: 15000, subtotal: 15000 }
          ],
          subtotal: 35000,
          tax: 3500,
          discount: 0,
          total: 38500,
          paymentMethod: 'cash',
          amountPaid: 40000,
          change: 1500,
          memberName: 'John Doe',
          footerMessage: 'Terima kasih telah berbelanja di toko kami!'
        };
        
        console.log('Printing sample receipt...');
        const printResult = await printReceipt(sampleReceipt);
        console.log(`Print result: ${printResult ? 'Success' : 'Failed'}`);
      }
      
      // 7. Disconnect from printer
      console.log('Disconnecting from printer...');
      await disconnectPrinter();
      console.log('Disconnected from printer');
    } else {
      console.log('Failed to connect to printer');
    }
  } else {
    console.log('No Bluetooth devices found');
  }
}

// Run the test
testBluetoothPrinter().catch(console.error);

export default testBluetoothPrinter;