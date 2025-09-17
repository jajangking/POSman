# Bluetooth Thermal Printer Workflow for POSman

This document details the complete workflow for implementing Bluetooth thermal printer support in the POSman application.

## 1. System Architecture

### Core Components

1. **PrinterService** (`src/services/PrinterService.ts`)
   - Handles all printer communication
   - Manages connections and ESC/POS commands
   - Formats receipt data for printing

2. **BluetoothPrinterSetup** (`src/components/BluetoothPrinterSetup.tsx`)
   - UI component for discovering and connecting to printers
   - Provides device scanning and connection testing

3. **Settings Integration** (`src/components/SettingsPage.tsx`)
   - Allows users to configure printer settings
   - Stores printer device ID in database

4. **Receipt Integration** (`src/components/cashier/ReceiptPage.tsx`, `src/components/CashierScreen.tsx`)
   - Triggers printing from receipt screen
   - Implements auto-print functionality

### Data Flow

```
1. User navigates to Settings → Printer Setup
   ↓
2. BluetoothPrinterSetup scans for devices
   ↓
3. User selects and connects to a printer
   ↓
4. Device ID saved in store settings
   ↓
5. During transaction, receipt is formatted
   ↓
6. If auto-print enabled, receipt sent to printer
   ↓
7. If auto-print disabled, user manually triggers print
```

## 2. Implementation Details

### Discovery and Connection

**Process:**
1. User clicks "Scan" in Settings → Printing Settings
2. BluetoothPrinterSetup modal opens
3. `scanForDevices()` is called to discover Bluetooth devices
4. Devices displayed in a list with Connect/Test buttons
5. User connects to a device, which saves the device ID to settings

**Key Functions:**
- `scanForDevices()`: Returns list of available Bluetooth devices
- `connectToPrinter(deviceId)`: Establishes connection to a printer
- `testPrinterConnection(deviceId)`: Tests connection with a test print
- `disconnectPrinter()`: Disconnects from current printer

### ESC/POS Command Formatting

**Process:**
1. Receipt data is collected from transaction
2. `formatReceiptForPrinting()` converts data to ESC/POS commands
3. Formatted data sent to printer via `print()` function

**Supported Commands:**
- Text formatting (bold, alignment, font sizes)
- Line feeds and paper cutting
- Barcode and QR code printing (planned)

### Receipt Data Formatting

**Process:**
1. Transaction data collected after payment
2. Data formatted to match printer capabilities
3. Special characters and encoding handled
4. Paper size considerations applied

**Data Structure:**
```typescript
{
  storeName: string,
  storeAddress: string,
  storePhone: string,
  transactionId: string,
  date: string,
  cashier: string,
  items: Array<{name, qty, price, subtotal}>,
  subtotal: number,
  tax: number,
  discount: number,
  total: number,
  paymentMethod: string,
  amountPaid: number,
  change: number,
  memberName?: string,
  footerMessage: string
}
```

### Error Handling

**Connection Errors:**
- Device not found
- Pairing required
- Connection timeout

**Printing Errors:**
- Paper out
- Printer offline
- Data transmission errors

**Recovery:**
- Automatic retry attempts
- Fallback to sharing
- User notifications

## 3. Integration Points

### Settings Page Integration

**Location:** `src/components/SettingsPage.tsx`
**Features:**
- Scan button opens BluetoothPrinterSetup modal
- Device ID stored in database settings
- Auto-print toggle

### Receipt Page Integration

**Location:** `src/components/cashier/ReceiptPage.tsx`
**Features:**
- "Cetak Struk" button triggers printing
- Checks connection status before printing
- Fallback to sharing if printing fails

### Cashier Screen Integration

**Location:** `src/components/CashierScreen.tsx`
**Features:**
- Auto-print functionality based on settings
- Receipt data preparation for printing
- Error handling and fallback mechanisms

## 4. User Workflow

### Initial Setup

1. **Navigate to Settings**
   - User goes to Settings page from Cashier screen
   - Scrolls to "Printing Settings" section

2. **Configure Printer**
   - Click "Scan" to discover Bluetooth devices
   - Select printer from list and connect
   - Optionally test connection
   - Enable "Auto Print" if desired

3. **Save Settings**
   - Click "Save" to store printer configuration

### Daily Operations

1. **Process Transaction**
   - Complete normal transaction flow
   - View receipt on screen

2. **Print Receipt**
   - If auto-print enabled: Receipt prints automatically
   - If auto-print disabled: Click "Cetak Struk" button
   - If printing fails: Fallback to sharing option

### Troubleshooting

1. **Printer Not Found**
   - Ensure printer is powered on and in pairing mode
   - Retry scanning
   - Check device Bluetooth settings

2. **Connection Issues**
   - Verify device is paired in system Bluetooth settings
   - Disconnect and reconnect
   - Restart printer and device

3. **Printing Problems**
   - Check paper and battery levels
   - Test printer connection
   - Verify ESC/POS compatibility

## 5. Configuration Options

### Auto Print
- **Enabled**: Receipt prints automatically after transaction
- **Disabled**: User must manually click print button

### Paper Size
- **80mm**: Standard receipt width
- **58mm**: Narrow receipt width (affects formatting)

### Device Selection
- Manual entry of device ID
- Scanning for available devices
- Connection testing

## 6. Security Considerations

### Data Protection
- No sensitive data sent to printer
- Receipt data is transaction-specific
- Device IDs stored securely in local database

### Connection Security
- Bluetooth pairing provides basic security
- No network transmission of data
- Local device communication only

## 7. Performance Considerations

### Connection Management
- Maintain connection for multiple prints
- Handle disconnections gracefully
- Optimize connection process

### Data Transmission
- Minimize data sent to printer
- Efficient ESC/POS command usage
- Error recovery without data loss

### User Experience
- Non-blocking print operations
- Progress indicators for long operations
- Clear error messages

## 8. Testing Strategy

### Unit Testing
- Mock Bluetooth device responses
- Test various ESC/POS command combinations
- Verify receipt formatting

### Integration Testing
- End-to-end transaction to print flow
- Settings save and load
- Error condition handling

### User Acceptance Testing
- Real printer testing
- Various receipt scenarios
- Error recovery workflows

## 9. Maintenance Considerations

### Updates
- ESC/POS command updates
- New printer model compatibility
- Bluetooth library updates

### Monitoring
- Print job success/failure tracking
- Error pattern analysis
- User feedback collection

### Support
- Troubleshooting documentation
- Common issue resolutions
- Printer compatibility matrix

This workflow provides a comprehensive framework for implementing and maintaining Bluetooth thermal printer support in POSman while ensuring a good user experience and reliable operation.