# POSman Bluetooth Printer Integration Guide

## Overview
This guide explains how to integrate POSman with real Bluetooth thermal printers after ejecting from Expo Managed Workflow.

## Prerequisites
1. Real Bluetooth thermal printer (ESC/POS compatible)
2. Bluetooth enabled on your device
3. Printer paired with your device

## Step-by-Step Integration

### 1. Eject from Expo Managed Workflow
```bash
# In your project directory
npx expo eject
```

Select:
- "Bare workflow"
- Confirm app name and bundle identifier

### 2. Install Bluetooth Printer Library
```bash
npm install react-native-bluetooth-escpos-printer
```

### 3. Install iOS Pods (if building for iOS)
```bash
cd ios && pod install && cd ..
```

### 4. Configure Android Permissions
Add these permissions to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

### 5. Configure iOS Permissions
Add this to `ios/YourApp/Info.plist`:
```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Need Bluetooth permission to connect to printers</string>
```

### 6. Build and Run the Application
```bash
# For Android
npm run android

# For iOS
npm run ios
```

## Using the Bluetooth Printer

### 1. Pair Your Printer
- Make sure your printer is in pairing mode
- Pair it with your device through system Bluetooth settings

### 2. Connect from POSman
1. Open POSman app
2. Go to Settings
3. In Printing Settings section, click "Scan" button
4. Select your printer from the list
5. Click "Connect"
6. Click "Test" to verify connection
7. Save settings

### 3. Print Receipts
- After a transaction, if "Auto Print" is enabled, receipt will print automatically
- Or manually click "Cetak Struk" on the receipt screen

## Supported Printers
The integration supports most ESC/POS compatible thermal printers:
- Epson TM series
- Star Micronics printers
- Generic 58mm and 80mm thermal printers

## Troubleshooting

### Common Issues:
1. **Printer not found during scan**
   - Ensure printer is in pairing mode
   - Check if printer is already paired with device
   - Restart Bluetooth on both device and printer

2. **Connection fails**
   - Verify printer is paired in system settings
   - Check if another app is using the printer
   - Ensure location permissions are granted

3. **Printing fails**
   - Check paper and power status on printer
   - Verify printer supports ESC/POS commands
   - Try printing a test page

### Debugging:
- Check logs using `adb logcat` (Android) or Xcode console (iOS)
- Look for "Bluetooth" or "Printer" related messages
- Verify printer is sending data by checking printer status lights

## API Reference

### PrinterService Functions:
- `scanForDevices()`: Find available Bluetooth printers
- `connectToPrinter(deviceId)`: Connect to a specific printer
- `isPrinterConnected()`: Check current connection status
- `printReceipt(receiptData)`: Print formatted receipt
- `testPrinterConnection(deviceId)`: Test connection and print sample
- `disconnectPrinter()`: Disconnect from current printer

## Testing with Real Hardware
1. Use a real Bluetooth thermal printer
2. Ensure it's ESC/POS compatible
3. Pair it with your development device
4. Run the app and test all printer functions

## Notes
- This implementation only works after ejecting from Expo Managed Workflow
- Mock implementation is used when running in Expo development mode
- Real printing functionality requires native Bluetooth permissions