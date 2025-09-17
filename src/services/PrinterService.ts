import { Alert } from 'react-native';
import { getStoreSettings } from './DatabaseService';

// Type definitions
interface BluetoothDevice {
  id: string;
  name: string;
}

// Enhanced mock implementation for Expo development
class MockBluetoothPrinter {
  private connectedDeviceId: string | null = null;
  
  async connect(deviceId: string): Promise<boolean> {
    // Simulate connection process with some delay
    console.log(`Connecting to Bluetooth device: ${deviceId}`);
    // Simulate a connection attempt that might fail
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate 90% success rate
    const success = Math.random() > 0.1;
    if (success) {
      this.connectedDeviceId = deviceId;
      console.log(`Successfully connected to Bluetooth device: ${deviceId}`);
      return true;
    } else {
      console.log(`Failed to connect to Bluetooth device: ${deviceId}`);
      return false;
    }
  }
  
  async disconnect(): Promise<void> {
    console.log(`Disconnecting from Bluetooth device: ${this.connectedDeviceId}`);
    this.connectedDeviceId = null;
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('Disconnected from Bluetooth device');
  }
  
  async isConnected(): Promise<boolean> {
    // Simulate occasional connection drops
    if (this.connectedDeviceId && Math.random() > 0.05) {
      return true;
    } else {
      this.connectedDeviceId = null;
      return false;
    }
  }
  
  async print(data: string): Promise<boolean> {
    if (!this.connectedDeviceId) {
      throw new Error('Not connected to a printer');
    }
    
    console.log('Printing data:', data.substring(0, 100) + '...');
    // Simulate printing process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate 95% success rate
    const success = Math.random() > 0.05;
    if (success) {
      console.log('Receipt printed successfully');
      return true;
    } else {
      console.log('Failed to print receipt');
      return false;
    }
  }
  
  async scanForDevices(): Promise<BluetoothDevice[]> {
    try {
      // Simulate scanning process
      console.log('Scanning for Bluetooth devices...');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Return mock devices with more realistic names
      const mockDevices: BluetoothDevice[] = [
        { id: "00:11:22:33:44:55", name: "MTP-3" },
        { id: "AA:BB:CC:DD:EE:FF", name: "XP-80C" },
        { id: "12:34:56:78:90:AB", name: "QSPrint-203" },
        { id: "CD:EF:12:34:56:78", name: "HM-A300" },
        { id: "98:76:54:32:10:FE", name: "BT-Printer-5802" },
      ];

      // Randomly filter some devices to simulate real scanning
      const filteredDevices = mockDevices.filter(() => Math.random() > 0.3);

      console.log(`Found ${filteredDevices.length} Bluetooth devices`);
      return filteredDevices;
    } catch (error) {
      console.error('Error scanning for devices:', error);
      return [];
    }
  }
}

// Initialize printer service
const mockPrinter = new MockBluetoothPrinter();

// ESC/POS command constants
const ESC = '\x1b';
const GS = '\x1d';
const LF = '\x0a';
const CMD = {
  LINE_FEED: LF,
  CUT_PAPER: ESC + 'm',
  BOLD_ON: ESC + 'E\x01',
  BOLD_OFF: ESC + 'E\x00',
  CENTER_ALIGN: ESC + 'a\x01',
  LEFT_ALIGN: ESC + 'a\x00',
  RIGHT_ALIGN: ESC + 'a\x02',
  FONT_A: ESC + 'M\x00',
  FONT_B: ESC + 'M\x01',
  FONT_C: ESC + 'M\x02',
  TEXT_SIZE: GS + '!',
  BARCODE_HEIGHT: GS + 'h',
  BARCODE_WIDTH: GS + 'w',
  BARCODE_FONT: GS + 'f',
  BARCODE_POSITION: GS + 'H',
  PRINT_BARCODE: GS + 'k',
  PRINT_QRCODE: GS + 'q',
};

// Connection status management
let connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'disconnecting' = 'disconnected';
let connectionError: string | null = null;

// Get current connection status
export const getConnectionStatus = (): { status: typeof connectionStatus, error: string | null } => {
  return { status: connectionStatus, error: connectionError };
};

// Set connection status (internal use)
const setConnectionStatus = (status: typeof connectionStatus, error: string | null = null) => {
  connectionStatus = status;
  connectionError = error;
};

// Printer service functions
export const connectToPrinter = async (deviceId: string): Promise<boolean> => {
  try {
    setConnectionStatus('connecting');
    connectionError = null;
    
    const connected = await mockPrinter.connect(deviceId);
    if (connected) {
      console.log('Successfully connected to printer');
      setConnectionStatus('connected');
      return true;
    } else {
      const error = 'Failed to connect to printer';
      console.log(error);
      setConnectionStatus('disconnected', error);
      Alert.alert('Connection Error', 'Failed to connect to the printer. Please try again.');
      return false;
    }
  } catch (error) {
    console.error('Error connecting to printer:', error);
    setConnectionStatus('disconnected', error instanceof Error ? error.message : 'Unknown error');
    Alert.alert('Connection Error', 'Failed to connect to the printer. Please try again.');
    return false;
  }
};

export const disconnectPrinter = async (): Promise<void> => {
  try {
    setConnectionStatus('disconnecting');
    await mockPrinter.disconnect();
    console.log('Disconnected from printer');
    setConnectionStatus('disconnected');
  } catch (error) {
    console.error('Error disconnecting from printer:', error);
    setConnectionStatus('disconnected', error instanceof Error ? error.message : 'Unknown error');
  }
};

export const isPrinterConnected = async (): Promise<boolean> => {
  try {
    const connected = await mockPrinter.isConnected();
    // Update connection status based on actual connection state
    if (connected) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }
    return connected;
  } catch (error) {
    console.error('Error checking printer connection:', error);
    setConnectionStatus('disconnected', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};

// Format receipt data for printing
export const formatReceiptForPrinting = (receiptData: any): string => {
  let receipt = '';
  
  // Header
  receipt += CMD.CENTER_ALIGN;
  receipt += CMD.BOLD_ON;
  receipt += receiptData.storeName + CMD.LINE_FEED;
  receipt += CMD.BOLD_OFF;
  receipt += receiptData.storeAddress + CMD.LINE_FEED;
  receipt += receiptData.storePhone + CMD.LINE_FEED;
  receipt += '-----------------------------' + CMD.LINE_FEED;
  
  // Transaction info
  receipt += CMD.LEFT_ALIGN;
  receipt += `Receipt No: ${receiptData.transactionId}` + CMD.LINE_FEED;
  receipt += `Date: ${receiptData.date}` + CMD.LINE_FEED;
  receipt += `Cashier: ${receiptData.cashier}` + CMD.LINE_FEED;
  receipt += '-----------------------------' + CMD.LINE_FEED;
  
  // Items header
  receipt += CMD.CENTER_ALIGN;
  receipt += 'Item              Qty  Price' + CMD.LINE_FEED;
  receipt += '-----------------------------' + CMD.LINE_FEED;
  
  // Items
  receipt += CMD.LEFT_ALIGN;
  receiptData.items.forEach((item: any) => {
    receipt += `${item.name}` + CMD.LINE_FEED;
    receipt += `                  ${item.qty} x ${item.price} = ${item.subtotal}` + CMD.LINE_FEED;
  });
  
  receipt += '-----------------------------' + CMD.LINE_FEED;
  
  // Totals
  receipt += `Subtotal:          ${receiptData.subtotal}` + CMD.LINE_FEED;
  receipt += `Tax:               ${receiptData.tax}` + CMD.LINE_FEED;
  if (receiptData.discount > 0) {
    receipt += `Discount:         -${receiptData.discount}` + CMD.LINE_FEED;
  }
  receipt += CMD.BOLD_ON;
  receipt += `Total:             ${receiptData.total}` + CMD.LINE_FEED;
  receipt += CMD.BOLD_OFF;
  receipt += `Payment:           ${receiptData.paymentMethod}` + CMD.LINE_FEED;
  receipt += `Amount Paid:       ${receiptData.amountPaid}` + CMD.LINE_FEED;
  receipt += `Change:            ${receiptData.change}` + CMD.LINE_FEED;
  
  if (receiptData.memberName) {
    receipt += '-----------------------------' + CMD.LINE_FEED;
    receipt += `Member: ${receiptData.memberName}` + CMD.LINE_FEED;
  }
  
  // Footer
  receipt += '-----------------------------' + CMD.LINE_FEED;
  receipt += CMD.CENTER_ALIGN;
  receipt += 'Thank you for your purchase!' + CMD.LINE_FEED;
  receipt += receiptData.footerMessage + CMD.LINE_FEED;
  receipt += CMD.LINE_FEED;
  receipt += CMD.LINE_FEED;
  receipt += CMD.CUT_PAPER;
  
  return receipt;
};

// Print receipt
export const printReceipt = async (receiptData: any): Promise<boolean> => {
  try {
    // Check if printer is connected
    const isConnected = await isPrinterConnected();
    if (!isConnected) {
      // Try to connect using saved device ID
      const settings = await getStoreSettings();
      if (settings && settings.bluetoothDevice) {
        const connected = await connectToPrinter(settings.bluetoothDevice);
        if (!connected) {
          throw new Error('Could not connect to printer');
        }
      } else {
        throw new Error('No printer configured');
      }
    }
    
    // Format receipt data
    const formattedReceipt = formatReceiptForPrinting(receiptData);
    
    // Send to printer
    const success = await mockPrinter.print(formattedReceipt);
    
    if (success) {
      console.log('Receipt printed successfully');
      return true;
    } else {
      throw new Error('Failed to print receipt');
    }
  } catch (error) {
    console.error('Error printing receipt:', error);
    Alert.alert('Print Error', `Failed to print receipt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

// Scan for available Bluetooth devices (MOCK for Expo development)
export const scanForDevices = async (): Promise<BluetoothDevice[]> => {
  try {
    // Use mock Bluetooth scanning for Expo development
    const devices = await mockPrinter.scanForDevices();
    return devices;
  } catch (error) {
    console.error('Error scanning for devices:', error);
    return [];
  }
};

// Test printer connection
export const testPrinterConnection = async (deviceId: string): Promise<boolean> => {
  try {
    const connected = await connectToPrinter(deviceId);
    if (connected) {
      // Print a test message
      const testMessage = CMD.CENTER_ALIGN + 'Printer Test Successful!' + CMD.LINE_FEED + 
                         'Connection is working properly.' + CMD.LINE_FEED + 
                         new Date().toLocaleString() + CMD.LINE_FEED + 
                         CMD.LINE_FEED + CMD.CUT_PAPER;
      const success = await mockPrinter.print(testMessage);
      await disconnectPrinter();
      return success;
    }
    return false;
  } catch (error) {
    console.error('Error testing printer connection:', error);
    return false;
  }
};

// Reconnect to the last used printer
export const reconnectToLastPrinter = async (): Promise<boolean> => {
  try {
    const settings = await getStoreSettings();
    if (settings && settings.bluetoothDevice) {
      return await connectToPrinter(settings.bluetoothDevice);
    }
    return false;
  } catch (error) {
    console.error('Error reconnecting to last printer:', error);
    return false;
  }
};

export default {
  connectToPrinter,
  disconnectPrinter,
  isPrinterConnected,
  printReceipt,
  scanForDevices,
  testPrinterConnection,
  getConnectionStatus,
  reconnectToLastPrinter,
};
