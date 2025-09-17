export interface InventoryItem {
  code: string; // Unified ID/Barcode field
  name: string;
  description: string;
  category: string;
  price: number;
  cost: number;
  quantity: number;
  sku: string;
  supplier?: string;
  reorderLevel: number;
  minOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryCategory {
  id: string;
  name: string;
  description: string;
  code: string; // Custom category code
}

export interface InventoryTransaction {
  id: string;
  itemCode: string; // Reference to item code instead of ID
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  price: number;
  reason: string;
  reference?: string;
  memberId?: string;
  createdAt: Date;
  createdBy: string;
}

// Empty array - categories will be managed by user
export const inventoryCategories: InventoryCategory[] = [];

// Get category by name
export const getCategoryByName = (name: string): InventoryCategory | undefined => {
  return inventoryCategories.find(category => category.name === name);
};

// Get category by code
export const getCategoryByCode = (code: string): InventoryCategory | undefined => {
  return inventoryCategories.find(category => category.code === code);
};

// Category to prefix mapping for smart code generation
// Format: [category prefix][rack number][shelf number][sequence number]
export const categoryPrefixes: { [key: string]: string } = {};

// Format number as Rupiah currency
export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Parse Rupiah string back to number
export const parseRupiah = (rupiahString: string): number => {
  // Remove currency symbol, spaces, and dots, then parse
  const cleanString = rupiahString
    .replace('Rp', '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();
  return parseFloat(cleanString) || 0;
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

// Generate a 3-digit product code based on category code
// Format: [category code][2-digit sequence number]
// Example: 101 for category "1", sequence 01
// Example: A05 for category "A", sequence 05
export const generateProductCode = (
  categoryCode: string,
  existingCodes: string[] = []
): string => {
  // Validate category code
  if (!categoryCode || categoryCode.trim() === '') {
    throw new Error('Category code is required');
  }
  
  // Clean category code (remove spaces, limit to reasonable length)
  const cleanCategoryCode = categoryCode.trim().substring(0, 3);
  
  // Generate a random sequence number between 1-99
  const sequence = Math.floor(Math.random() * 99) + 1;
  
  // Format sequence number (2 digits with leading zeros)
  const sequenceStr = sequence.toString().padStart(2, '0');
  
  // Create the base code
  let baseCode = `${cleanCategoryCode}${sequenceStr}`;
  
  // Check for duplicates and modify if needed
  let finalCode = baseCode;
  let counter = 1;
  while (existingCodes.includes(finalCode)) {
    // If duplicate found, increment the sequence number
    const newSequence = (parseInt(sequenceStr) + counter).toString().padStart(2, '0');
    finalCode = `${cleanCategoryCode}${newSequence}`;
    counter++;
    
    // Safety check to prevent infinite loop
    if (counter > 100) {
      // If we've tried too many times, generate a completely random suffix
      const randomSuffix = Math.floor(Math.random() * 99).toString().padStart(2, '0');
      finalCode = `${cleanCategoryCode}${randomSuffix}`;
      break;
    }
  }
  
  return finalCode;
};

// Check if a string looks like a generated code vs a barcode
export const isGeneratedCode = (code: string): boolean => {
  return code.startsWith('ITEM-');
};