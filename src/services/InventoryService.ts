import { 
  getAllInventoryItems, 
  getInventoryItemByCode, 
  createInventoryItem, 
  updateInventoryItem, 
  deleteInventoryItem,
  createInventoryTransaction,
  searchInventoryItems,
  getInventoryItemsByCategory,
  getLowStockItems,
  getInventoryTransactionsByItemCode
} from '../services/DatabaseService';
import { InventoryItem, InventoryTransaction, formatRupiah } from '../models/Inventory';

// Get all inventory items
export const fetchAllInventoryItems = async (): Promise<InventoryItem[]> => {
  try {
    const items = await getAllInventoryItems();
    return items;
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    throw error;
  }
};

// Search inventory items
export const searchInventory = async (query: string): Promise<InventoryItem[]> => {
  try {
    const items = await searchInventoryItems(query);
    return items;
  } catch (error) {
    console.error('Error searching inventory items:', error);
    throw error;
  }
};

// Get inventory items by category
export const fetchItemsByCategory = async (category: string): Promise<InventoryItem[]> => {
  try {
    const items = await getInventoryItemsByCategory(category);
    return items;
  } catch (error) {
    console.error('Error fetching inventory items by category:', error);
    throw error;
  }
};

// Get low stock items
export const fetchLowStockItems = async (): Promise<InventoryItem[]> => {
  try {
    const items = await getLowStockItems();
    return items;
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    throw error;
  }
};

// Get inventory item by code
export const fetchInventoryItemByCode = async (code: string): Promise<InventoryItem | null> => {
  try {
    console.log('Mencari item dengan code/SKU:', code);
    const item = await getInventoryItemByCode(code);
    console.log('Item ditemukan:', item);
    return item;
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    throw error;
  }
};

// Create new inventory item
export const addInventoryItem = async (item: Omit<InventoryItem, 'code' | 'createdAt' | 'updatedAt'> & { code: string }): Promise<InventoryItem> => {
  try {
    const newItem = await createInventoryItem(item);
    return newItem;
  } catch (error) {
    console.error('Error creating inventory item:', error);
    throw error;
  }
};

// Update inventory item
export const modifyInventoryItem = async (code: string, item: Partial<InventoryItem>): Promise<InventoryItem> => {
  try {
    const updatedItem = await updateInventoryItem(code, item);
    return updatedItem;
  } catch (error) {
    console.error('Error updating inventory item:', error);
    throw error;
  }
};

// Delete inventory item
export const removeInventoryItem = async (code: string): Promise<void> => {
  try {
    await deleteInventoryItem(code);
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    throw error;
  }
};

// Add stock to inventory item
export const addStock = async (itemCode: string, quantity: number, price: number, reason: string, createdBy: string): Promise<InventoryItem> => {
  try {
    // Get current item
    const item = await getInventoryItemByCode(itemCode);
    if (!item) {
      throw new Error('Item not found');
    }
    
    // Create transaction
    const transaction: Omit<InventoryTransaction, 'id' | 'createdAt'> = {
      itemCode,
      type: 'in',
      quantity,
      price,
      reason,
      createdBy
    };
    
    await createInventoryTransaction(transaction);
    
    // Update item quantity
    const updatedItem = await updateInventoryItem(itemCode, {
      quantity: item.quantity + quantity
    });
    
    return updatedItem;
  } catch (error) {
    console.error('Error adding stock:', error);
    throw error;
  }
};

// Remove stock from inventory item
export const removeStock = async (itemCode: string, quantity: number, price: number, reason: string, createdBy: string): Promise<InventoryItem> => {
  try {
    // Get current item
    const item = await getInventoryItemByCode(itemCode);
    if (!item) {
      throw new Error('Item not found');
    }
    
    if (item.quantity < quantity) {
      throw new Error('Insufficient stock');
    }
    
    // Create transaction
    const transaction: Omit<InventoryTransaction, 'id' | 'createdAt'> = {
      itemCode,
      type: 'out',
      quantity,
      price,
      reason,
      createdBy
    };
    
    await createInventoryTransaction(transaction);
    
    // Update item quantity
    const updatedItem = await updateInventoryItem(itemCode, {
      quantity: item.quantity - quantity
    });
    
    return updatedItem;
  } catch (error) {
    console.error('Error removing stock:', error);
    throw error;
  }
};

// Get inventory transactions by item code
export const fetchInventoryTransactions = async (itemCode: string): Promise<InventoryTransaction[]> => {
  try {
    const transactions = await getInventoryTransactionsByItemCode(itemCode);
    return transactions;
  } catch (error) {
    console.error('Error fetching inventory transactions:', error);
    throw error;
  }
};

// Format price as Rupiah
export const formatPrice = (price: number): string => {
  return formatRupiah(price);
};