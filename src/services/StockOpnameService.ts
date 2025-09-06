import { 
  createStockOpname, 
  createStockOpnameItem, 
  updateStockOpnameStatus,
  getStockOpnameById,
  getStockOpnameItemsByOpnameId
} from './DatabaseService';
import { StockOpname, StockOpnameItem } from '../models/StockOpname';
import { InventoryItem } from '../models/Inventory';

// Create a new stock opname
export const startStockOpname = async (
  type: 'partial' | 'grand',
  createdBy: string
): Promise<StockOpname> => {
  try {
    const opname: Omit<StockOpname, 'id' | 'createdAt'> = {
      date: new Date(),
      startTime: new Date(),
      type,
      status: 'draft',
      createdBy
    };
    
    const newOpname = await createStockOpname(opname);
    return newOpname;
  } catch (error) {
    console.error('Error starting stock opname:', error);
    throw error;
  }
};

// Add item to stock opname
export const addItemToStockOpname = async (
  opnameId: string,
  item: InventoryItem
): Promise<StockOpnameItem> => {
  try {
    const opnameItem: Omit<StockOpnameItem, 'id' | 'createdAt'> = {
      opnameId,
      itemCode: item.code,
      systemQuantity: item.quantity
    };
    
    const newOpnameItem = await createStockOpnameItem(opnameItem);
    return newOpnameItem;
  } catch (error) {
    console.error('Error adding item to stock opname:', error);
    throw error;
  }
};

// Process stock opname
export const processStockOpname = async (
  opnameId: string,
  items: { code: string; actualQuantity: number }[]
): Promise<void> => {
  try {
    // Update status to processing
    await updateStockOpnameStatus(opnameId, 'processing');
    
    // Process each item
    // In a real implementation, we would update the actual quantities and differences here
    
    // Update status to completed
    await updateStockOpnameStatus(opnameId, 'completed', new Date());
  } catch (error) {
    console.error('Error processing stock opname:', error);
    throw error;
  }
};

// Get stock opname details
export const getStockOpnameDetails = async (id: string): Promise<{ opname: StockOpname; items: StockOpnameItem[] } | null> => {
  try {
    const opname = await getStockOpnameById(id);
    if (!opname) return null;
    
    const items = await getStockOpnameItemsByOpnameId(id);
    return { opname, items };
  } catch (error) {
    console.error('Error getting stock opname details:', error);
    throw error;
  }
};