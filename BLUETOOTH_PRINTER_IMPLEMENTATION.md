# Bluetooth Thermal Printer Integration Guide for POSman

This document provides a complete guide for implementing Bluetooth thermal printer support in the POSman application.

## Overview

The current implementation provides a complete framework for Bluetooth thermal printer support, including:
1. Printer discovery and connection management
2. ESC/POS command formatting for thermal printers
3. Receipt formatting and printing
4. UI components for printer setup
5. Integration with existing settings and receipt systems

## Current Implementation Status

The current implementation includes:
- Mock services that simulate Bluetooth printer functionality
- Complete UI components for printer setup and management
- Integration with existing settings system
- Auto-print functionality based on settings

## Steps to Implement Real Bluetooth Functionality

### 1. Choose a Bluetooth Library

For Expo projects, you have several options:

#### Option A: Eject to Bare Workflow (Recommended)
If you need full native functionality, eject to the bare workflow and use:
- `react-native-bluetooth-escpos-printer`
- `react-native-ble-plx` for more control

#### Option B: Custom Development Build
Create a custom development build with native modules:
1. Create a custom Expo config plugin
2. Integrate native Bluetooth libraries

#### Option C: Third-party Services
Use a service like `expo-print` combined with network printing if you have network-connected printers.

### 2. Implementation Steps

#### Step 1: Install Required Dependencies
```bash
# If ejecting to bare workflow
npm install react-native-bluetooth-escpos-printer
# Or for BLE control
npm install react-native-ble-plx
```

#### Step 2: Replace Mock Implementation
Replace the mock implementation in `src/services/PrinterService.ts` with actual Bluetooth calls:

```typescript
// Example implementation using react-native-bluetooth-escpos-printer
import { BluetoothManager, BluetoothEscposPrinter } from 'react-native-bluetooth-escpos-printer';

// Replace the mock printer class with actual implementation
class BluetoothPrinterService implements BluetoothPrinter {
  async connect(deviceId: string): Promise<boolean> {
    try {
      await BluetoothManager.connect(deviceId);
      return true;
    } catch (error) {
      console.error('Connection error:', error);
      return false;
    }
  }
  
  async disconnect(): Promise<void> {
    await BluetoothManager.disconnect();
  }
  
  async isConnected(): Promise<boolean> {
    const state = await BluetoothManager.checkBluetoothState();
    return state === 'connected';
  }
  
  async print(data: string): Promise<boolean> {
    try {
      await BluetoothEscposPrinter.printerInit();
      await BluetoothEscposPrinter.printText(data);
      return true;
    } catch (error) {
      console.error('Print error:', error);
      return false;
    }
  }
}
```

#### Step 3: Update Device Scanning
Implement actual Bluetooth device scanning:

```typescript
export const scanForDevices = async (): Promise<Array<{id: string, name: string}>> => {
  try {
    const devices = await BluetoothManager.scanDevices();
    return devices.map(device => ({
      id: device.address,
      name: device.name
    }));
  } catch (error) {
    console.error('Scan error:', error);
    return [];
  }
};
```

#### Step 4: Enhance ESC/POS Commands
Expand the ESC/POS command set in the printer service:

```typescript
// Enhanced ESC/POS commands
const CMD = {
  INIT: '\x1b@',
  LINE_FEED: '\x0a',
  CUT_PAPER: '\x1dVA0',
  BOLD_ON: '\x1bE\x01',
  BOLD_OFF: '\x1bE\x00',
  CENTER_ALIGN: '\x1ba\x01',
  LEFT_ALIGN: '\x1ba\x00',
  RIGHT_ALIGN: '\x1ba\x02',
  FONT_A: '\x1bM\x00',
  FONT_B: '\x1bM\x01',
  TEXT_SIZE: '\x1d!',
  // ... more commands
};
```

### 3. Testing the Implementation

1. **Mock Testing**: Test with the current mock implementation to ensure UI flows work correctly
2. **Device Testing**: Once real Bluetooth is implemented, test with actual thermal printers
3. **Error Handling**: Verify all error states are handled gracefully
4. **Performance**: Ensure printing doesn't block the UI

### 4. Configuration Options

The system supports several configuration options through the settings page:
- Auto-print toggle
- Paper size selection (58mm/80mm)
- Bluetooth device selection
- Custom footer messages

### 5. Error Handling

The system includes comprehensive error handling for:
- Connection failures
- Printing errors
- Device not found
- Bluetooth not enabled

## Future Enhancements

1. **Print Queue**: Implement a print queue for handling multiple print jobs
2. **Status Monitoring**: Add real-time printer status monitoring
3. **Multiple Printers**: Support for multiple simultaneous printers
4. **Template System**: Advanced receipt templating system
5. **Print History**: Track printed receipts for auditing

## Troubleshooting

### Common Issues

1. **Connection Failures**: Ensure Bluetooth is enabled on the device
2. **Printing Issues**: Check printer paper and battery levels
3. **Discovery Problems**: Make sure printer is in pairing mode
4. **ESC/POS Compatibility**: Test with different printer models

### Debugging Tips

1. Enable verbose logging in development
2. Use Bluetooth debugging tools to monitor connections
3. Test with simple print commands before full receipts
4. Verify ESC/POS command compatibility with your printer model

## Conclusion

This implementation provides a solid foundation for Bluetooth thermal printer support in POSman. The modular design makes it easy to swap out the mock implementation for real Bluetooth functionality when you're ready to implement it.