# Bluetooth Printer Integration Guide

This document provides instructions for integrating real Bluetooth printer support when ejecting the Expo project to bare workflow.

## Current Implementation

The current implementation uses a mock Bluetooth printer service that simulates printer connections and printing. This allows the app to function during development without requiring actual hardware.

## Ejecting to Bare Workflow

To use real Bluetooth printers, you'll need to eject the Expo project to bare workflow:

```bash
# Eject the project
npx expo eject
```

Follow the Expo documentation for detailed instructions on ejecting.

## Installing Bluetooth Printer Library

After ejecting, you can install a Bluetooth printer library. We recommend `react-native-bluetooth-escpos-printer`:

```bash
npm install react-native-bluetooth-escpos-printer
# Or with yarn
yarn add react-native-bluetooth-escpos-printer
```

For iOS, you'll also need to install the pods:

```bash
cd ios && pod install
```

## Updating PrinterService.ts

Replace the mock implementation with the real Bluetooth printer library:

```typescript
import { BluetoothEscposPrinter } from 'react-native-bluetooth-escpos-printer';
import { Alert } from 'react-native';
import { getStoreSettings } from './DatabaseService';

// Real Bluetooth printer implementation
class RealBluetoothPrinter implements BluetoothPrinter {
  private connectedDeviceId: string | null = null;
  
  async connect(deviceId: string): Promise<boolean> {
    try {
      await BluetoothEscposPrinter.connect(deviceId);
      this.connectedDeviceId = deviceId;
      return true;
    } catch (error) {
      console.error('Error connecting to Bluetooth printer:', error);
      return false;
    }
  }
  
  async disconnect(): Promise<void> {
    try {
      await BluetoothEscposPrinter.close();
      this.connectedDeviceId = null;
    } catch (error) {
      console.error('Error disconnecting from Bluetooth printer:', error);
    }
  }
  
  async isConnected(): Promise<boolean> {
    try {
      const state = await BluetoothEscposPrinter.getDeviceState();
      return state === 1; // 1 = connected
    } catch (error) {
      console.error('Error checking printer connection:', error);
      return false;
    }
  }
  
  async print(data: string): Promise<boolean> {
    try {
      await BluetoothEscposPrinter.printRawData(data);
      return true;
    } catch (error) {
      console.error('Error printing data:', error);
      return false;
    }
  }
}

// Initialize with real printer service when in bare workflow
const printer: BluetoothPrinter = new RealBluetoothPrinter();
```

## Permissions

For Android, add the following permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

For iOS, add the following to `ios/YourApp/Info.plist`:

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Need Bluetooth permission to connect to printers</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>Need Bluetooth permission to connect to printers</string>
```

## Testing

After implementing the real Bluetooth printer support:

1. Build the app for your target platform
2. Install it on a device (Bluetooth doesn't work in emulators)
3. Pair your Bluetooth printer with the device
4. Test the connection and printing functionality

## Supported Printers

The `react-native-bluetooth-escpos-printer` library supports most ESC/POS compatible thermal printers, including:

- Epson TM-T88 series
- Star Micronics printers
- Generic 58mm and 80mm thermal printers

## Troubleshooting

1. **Connection Issues**: Ensure the printer is paired with the device before attempting to connect
2. **Printing Issues**: Verify the printer supports ESC/POS commands
3. **Permissions**: Make sure all required permissions are granted
4. **Android 12+**: For Android 12 and above, you may need additional Bluetooth permissions

## Additional Resources

- [react-native-bluetooth-escpos-printer GitHub](https://github.com/tr3v3r/react-native-bluetooth-escpos-printer)
- [Expo Bare Workflow Documentation](https://docs.expo.dev/bare/overview/)
- [Android Bluetooth Permissions](https://developer.android.com/guide/topics/connectivity/bluetooth/permissions)
- [iOS Bluetooth Permissions](https://developer.apple.com/documentation/corebluetooth)