import { Camera } from 'expo-camera';

// Supported barcode types
export const SUPPORTED_BARCODE_TYPES = [
  "upc_e",
  "upc_a",
  "ean8",
  "ean13",
  "code128",
  "code39",
  "code93",
  "itf14",
  "qr"
];

// Validate barcode format
export const isValidBarcode = (barcode: string): boolean => {
  // Check if barcode is not empty
  if (!barcode || barcode.trim() === '') {
    return false;
  }
  
  // Check if barcode contains only valid characters (numbers and letters)
  const validBarcodeRegex = /^[0-9A-Za-z\-]+$/;
  return validBarcodeRegex.test(barcode);
};

// Format barcode for display
export const formatBarcode = (barcode: string): string => {
  if (!barcode) return '';
  
  // For EAN-13 barcodes, add spaces for better readability
  if (barcode.length === 13 && /^\d+$/.test(barcode)) {
    return `${barcode.substring(0, 1)} ${barcode.substring(1, 7)} ${barcode.substring(7, 13)}`;
  }
  
  // For UPC-A barcodes, add spaces for better readability
  if (barcode.length === 12 && /^\d+$/.test(barcode)) {
    return `${barcode.substring(0, 1)} ${barcode.substring(1, 6)} ${barcode.substring(6, 11)} ${barcode.substring(11, 12)}`;
  }
  
  return barcode;
};

// Generate a unique product code if none is provided
export const generateProductCode = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ITEM-${timestamp.substring(timestamp.length - 6)}-${random}`;
};

// Check if a string looks like a generated code vs a barcode
export const isGeneratedCode = (code: string): boolean => {
  return code.startsWith('ITEM-');
};