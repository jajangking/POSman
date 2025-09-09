import { openDatabase } from './DatabaseService';
import { InventoryItem } from '../models/Inventory';
import { updateMemberPoints } from './MemberService';
import { getAllInventoryItems } from './DatabaseService';

// Interface for cart items
export interface CartItem {
  id: string;
  code: string;
  name: string;
  qty: number;
  price: number;
  subtotal: number;
}

// Search for products by code, SKU, or name
export const searchProducts = async (query: string): Promise<InventoryItem[]> => {
  try {
    const database = await openDatabase();
    
    // If query is numeric, search by code or SKU
    const isNumeric = /^\d+$/.test(query);
    
    let result: any[];
    if (isNumeric) {
      result = await database.getAllAsync(
        `SELECT * FROM inventory_items 
         WHERE (code = ? OR sku = ?) AND isActive = 1`,
        [query, query]
      );
    } else {
      // For text queries, search by name
      result = await database.getAllAsync(
        `SELECT * FROM inventory_items 
         WHERE name LIKE ? AND isActive = 1
         ORDER BY name LIMIT 20`,
        [`%${query}%`]
      );
    }
    
    return result.map((item) => ({
      code: item.code,
      name: item.name,
      description: item.description || '',
      category: item.category || '',
      price: parseFloat(item.price),
      cost: parseFloat(item.cost),
      quantity: parseInt(item.quantity),
      sku: item.sku || '',
      supplier: item.supplier || '',
      reorderLevel: parseInt(item.reorderLevel),
      isActive: item.isActive === 1,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    }));
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

// Get all active products
export const getAllActiveProducts = async (): Promise<InventoryItem[]> => {
  try {
    const database = await openDatabase();
    const result: any[] = await database.getAllAsync(
      'SELECT * FROM inventory_items WHERE isActive = 1 ORDER BY name'
    );
    
    return result.map((item) => ({
      code: item.code,
      name: item.name,
      description: item.description || '',
      category: item.category || '',
      price: parseFloat(item.price),
      cost: parseFloat(item.cost),
      quantity: parseInt(item.quantity),
      sku: item.sku || '',
      supplier: item.supplier || '',
      reorderLevel: parseInt(item.reorderLevel),
      isActive: item.isActive === 1,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    }));
  } catch (error) {
    console.error('Error getting all active products:', error);
    throw error;
  }
};

// Get product by code or SKU
export const getProductByCode = async (code: string): Promise<InventoryItem | null> => {
  try {
    const database = await openDatabase();
    const result: any = await database.getFirstAsync(
      'SELECT * FROM inventory_items WHERE (code = ? OR sku = ?) AND isActive = 1',
      [code, code]
    );
    
    if (result) {
      return {
        code: result.code,
        name: result.name,
        description: result.description || '',
        category: result.category || '',
        price: parseFloat(result.price),
        cost: parseFloat(result.cost),
        quantity: parseInt(result.quantity),
        sku: result.sku || '',
        supplier: result.supplier || '',
        reorderLevel: parseInt(result.reorderLevel),
        isActive: result.isActive === 1,
        createdAt: new Date(result.createdAt),
        updatedAt: new Date(result.updatedAt)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting product by code:', error);
    throw error;
  }
};

// Generate receipt number with format: 3-letter user code + DDMM + sequential number
export const generateReceiptNumber = async (userCode: string = 'USR'): Promise<string> => {
  try {
    // Ensure userCode is exactly 3 characters
    const code = userCode.substring(0, 3).toUpperCase().padStart(3, 'X');
    
    const database = await openDatabase();
    
    // Get the current date
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    // Format: USER + DDMM
    const prefix = `${code}${day}${month}`;
    
    // Get the last receipt number for today with this user code
    const result: any = await database.getFirstAsync(
      `SELECT reference FROM inventory_transactions 
       WHERE reference LIKE ? 
       ORDER BY reference DESC LIMIT 1`,
      [`${prefix}%`]
    );
    
    let sequence = 1;
    if (result) {
      // Extract sequence number from the last receipt (last 3 digits)
      const lastReference = result.reference;
      const lastSequenceStr = lastReference.slice(-3);
      const lastSequence = parseInt(lastSequenceStr);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }
    
    // Format: USER + DDMM + sequence (3 digits)
    return `${prefix}${sequence.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating receipt number:', error);
    // Fallback to a simple receipt number
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    return `USR${hours}${minutes}${seconds}`;
  }
};

// Save transaction to database
export const saveTransaction = async (
  items: CartItem[],
  total: number,
  userId: string,
  receiptNumber: string,
  memberId?: string,
  pointsRedeemed?: number
): Promise<void> => {
  try {
    const database = await openDatabase();
    const timestamp = new Date().toISOString();
    
    // Save each item as a transaction
    for (const item of items) {
      await database.runAsync(
        `INSERT INTO inventory_transactions 
         (id, itemId, type, quantity, price, reason, reference, memberId, createdAt, createdBy) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Math.random().toString(36).substring(2, 15),
          item.code,
          'out',
          item.qty,
          item.price,
          'Sale',
          receiptNumber,
          memberId || null,
          timestamp,
          userId
        ]
      );
      
      // Update inventory quantity
      await database.runAsync(
        `UPDATE inventory_items 
         SET quantity = quantity - ?, updatedAt = ? 
         WHERE code = ?`,
        [item.qty, timestamp, item.code]
      );
    }
    
    // Update member's total purchases and points if member ID is provided
    if (memberId) {
      // Get current total purchases and points for the member
      const memberResult: any = await database.getFirstAsync(
        'SELECT totalPurchases, totalPoints FROM members WHERE id = ?',
        [memberId]
      );
      
      if (memberResult) {
        const currentTotal = parseFloat(memberResult.totalPurchases) || 0;
        const newTotal = currentTotal + total;
        
        // Calculate new points balance
        let currentPoints = parseInt(memberResult.totalPoints) || 0;
        if (pointsRedeemed && pointsRedeemed > 0) {
          currentPoints = currentPoints - pointsRedeemed;
        }
        
        // Update member's total purchases, points, and last transaction date
        await database.runAsync(
          'UPDATE members SET totalPurchases = ?, totalPoints = ?, lastTransaction = ?, updatedAt = ? WHERE id = ?',
          [newTotal, currentPoints, timestamp, timestamp, memberId]
        );
      }
    }
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
};