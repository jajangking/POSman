# Bluetooth Printer Implementation

## Overview

The POSman application includes a comprehensive Bluetooth printer implementation that allows users to connect to and print receipts using Bluetooth thermal printers. This implementation is designed to work with ESC/POS compatible printers.

## Features

1. **Device Scanning**: Scan for available Bluetooth printers
2. **Connection Management**: Connect, disconnect, and monitor printer connections
3. **Status Monitoring**: Real-time connection status updates
4. **Receipt Printing**: Format and print receipts with proper ESC/POS commands
5. **Connection Testing**: Test printer connectivity and functionality
6. **Auto-reconnection**: Reconnect to previously used printers

## Components

### 1. PrinterService (`src/services/PrinterService.ts`)

The core service that handles all printer operations:

- `connectToPrinter(deviceId)`: Connect to a specific Bluetooth device
- `disconnectPrinter()`: Disconnect from the current printer
- `isPrinterConnected()`: Check if a printer is currently connected
- `getConnectionStatus()`: Get detailed connection status information
- `printReceipt(receiptData)`: Format and print a receipt
- `scanForDevices()`: Scan for available Bluetooth devices
- `testPrinterConnection(deviceId)`: Test connectivity to a printer
- `reconnectToLastPrinter()`: Reconnect to the last used printer

### 2. BluetoothPrinterSetup (`src/components/BluetoothPrinterSetup.tsx`)

A UI component that allows users to:

- Scan for Bluetooth devices
- Connect to printers
- Test printer connections
- View connection status
- Disconnect from printers

### 3. Settings Integration (`src/components/SettingsPage.tsx`)

The settings page includes:

- Printer connection status indicator
- Manual connection checking
- Device ID input field
- Scan button to open the printer setup modal

## Usage Flow

1. **Setup**: Navigate to Settings > Printing Settings
2. **Scan**: Click "Scan" to open the Bluetooth Printer Setup modal
3. **Connect**: Select a device from the list and click "Connect"
4. **Test**: Optionally test the connection with the "Test" button
5. **Print**: When making a sale, the receipt will automatically print if "Auto Print" is enabled

## Implementation Details

### Connection States

The printer service maintains the following connection states:

- `disconnected`: No active connection
- `connecting`: Attempting to establish a connection
- `connected`: Successfully connected to a printer
- `disconnecting`: In the process of disconnecting

### Error Handling

The service provides detailed error messages for troubleshooting connection issues.

### Mock Implementation

During development, the service uses a mock implementation that simulates printer connections and printing. This allows testing without actual hardware.

## Future Integration

For production use with real hardware, the application will need to be ejected to bare workflow and integrated with a native Bluetooth printer library. See `BLUETOOTH_PRINTER_INTEGRATION.md` for detailed instructions.

## Testing

A test file is available at `src/tests/BluetoothPrinterTest.ts` to verify the functionality of the printer service.