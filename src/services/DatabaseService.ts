import * as SQLite from 'expo-sqlite';
import { User, UserRole } from '../models/User';
import { InventoryItem, InventoryTransaction } from '../models/Inventory';
import { StockOpname, StockOpnameItem } from '../models/StockOpname';

// Open database
let db: SQLite.SQLiteDatabase | null = null;

const openDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('posman.db');
  }
  return db;
};

// Check if the inventory_items table has the correct schema
const validateInventoryItemsSchema = async (database: SQLite.SQLiteDatabase): Promise<boolean> => {
  try {
    // Get the table info
    const tableInfo: any[] = await database.getAllAsync("PRAGMA table_info(inventory_items);");
    
    // Check if the 'code' column exists
    const hasCodeColumn = tableInfo.some(column => column.name === 'code');
    
    // Check if the primary key is set correctly
    const primaryKeyColumn = tableInfo.find(column => column.pk === 1);
    const hasCorrectPrimaryKey = primaryKeyColumn && primaryKeyColumn.name === 'code';
    
    return hasCodeColumn && hasCorrectPrimaryKey;
  } catch (error) {
    console.error('Error validating inventory_items schema:', error);
    return false;
  }
};

// Recreate inventory_items table with correct schema
const recreateInventoryItemsTable = async (database: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    // Begin transaction
    await database.execAsync('BEGIN TRANSACTION;');
    
    // Create new table with correct schema
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS inventory_items_new (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        price REAL NOT NULL,
        cost REAL NOT NULL,
        quantity INTEGER NOT NULL,
        sku TEXT UNIQUE,
        supplier TEXT,
        reorderLevel INTEGER NOT NULL,
        isActive INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
    
    // Check if old table exists and has data
    try {
      const oldTableExists: any = await database.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='inventory_items';"
      );
      
      if (oldTableExists) {
        // Copy data from old table if it exists
        const oldData: any[] = await database.getAllAsync('SELECT * FROM inventory_items;');
        if (oldData.length > 0) {
          // Insert data into new table
          for (const item of oldData) {
            await database.runAsync(
              `INSERT INTO inventory_items_new (
                code, name, description, category, price, cost, quantity, 
                sku, supplier, reorderLevel, isActive, createdAt, updatedAt
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
              [
                item.code || item.id || item.barcode, // Try different possible column names
                item.name,
                item.description,
                item.category,
                item.price,
                item.cost,
                item.quantity,
                item.sku,
                item.supplier,
                item.reorderLevel || 0,
                item.isActive || 1,
                item.createdAt || new Date().toISOString(),
                item.updatedAt || new Date().toISOString()
              ]
            );
          }
        }
        
        // Drop old table
        await database.execAsync('DROP TABLE inventory_items;');
      }
    } catch (error) {
      console.warn('Warning: Could not migrate data from old inventory_items table:', error);
    }
    
    // Rename new table to correct name
    await database.execAsync('ALTER TABLE inventory_items_new RENAME TO inventory_items;');
    
    // Commit transaction
    await database.execAsync('COMMIT;');
    
    console.log('Successfully recreated inventory_items table with correct schema');
  } catch (error) {
    // Rollback transaction on error
    try {
      await database.execAsync('ROLLBACK;');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    
    console.error('Error recreating inventory_items table:', error);
    throw error;
  }
};

// Initialize database with all tables
export const initDatabase = async (): Promise<void> => {
  try {
    const database = await openDatabase();
    
    // Create users table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        createdAt TEXT NOT NULL,
        lastLogin TEXT
      );
    `);
    
    // Create inventory_items table with unified code field
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        price REAL NOT NULL,
        cost REAL NOT NULL,
        quantity INTEGER NOT NULL,
        sku TEXT UNIQUE,
        supplier TEXT,
        reorderLevel INTEGER NOT NULL,
        isActive INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
    
    // Validate inventory_items schema and recreate if needed
    const isSchemaValid = await validateInventoryItemsSchema(database);
    if (!isSchemaValid) {
      console.log('Inventory items table schema is invalid, recreating...');
      await recreateInventoryItemsTable(database);
    }
    
    // Create inventory_transactions table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id TEXT PRIMARY KEY,
        itemCode TEXT NOT NULL,
        type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        reason TEXT,
        reference TEXT,
        createdAt TEXT NOT NULL,
        createdBy TEXT NOT NULL,
        FOREIGN KEY (itemCode) REFERENCES inventory_items (code)
      );
    `);
    
    // Create stock_opname table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS stock_opname (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        createdBy TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
    `);
    
    // Create stock_opname_items table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS stock_opname_items (
        id TEXT PRIMARY KEY,
        opnameId TEXT NOT NULL,
        itemCode TEXT NOT NULL,
        systemQuantity INTEGER NOT NULL,
        actualQuantity INTEGER,
        difference INTEGER,
        status TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (opnameId) REFERENCES stock_opname (id),
        FOREIGN KEY (itemCode) REFERENCES inventory_items (code)
      );
    `);
    
    console.log('Database initialized with all tables');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Create a new user
export const createUser = async (user: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
  try {
    const database = await openDatabase();
    const id = Math.random().toString(36).substring(2, 15);
    const createdAt = new Date().toISOString();
    
    await database.runAsync(
      `INSERT INTO users (id, username, password, role, name, email, phone, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        user.username,
        user.password, // In a real app, this should be hashed
        user.role,
        user.name,
        user.email || null,
        user.phone || null,
        createdAt
      ]
    );
    
    return {
      id,
      username: user.username,
      password: user.password,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: new Date(createdAt),
      lastLogin: undefined
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Get user by username
export const getUserByUsername = async (username: string): Promise<User | null> => {
  try {
    const database = await openDatabase();
    const result: any = await database.getFirstAsync(
      'SELECT * FROM users WHERE username = ?;',
      [username]
    );
    
    if (result) {
      return {
        id: result.id,
        username: result.username,
        password: result.password,
        role: result.role as UserRole,
        name: result.name,
        email: result.email || undefined,
        phone: result.phone || undefined,
        createdAt: new Date(result.createdAt),
        lastLogin: result.lastLogin ? new Date(result.lastLogin) : undefined
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user by username:', error);
    throw error;
  }
};

// Get all users
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const database = await openDatabase();
    const result: any[] = await database.getAllAsync('SELECT * FROM users;');
    
    return result.map((user) => ({
      id: user.id,
      username: user.username,
      password: user.password,
      role: user.role as UserRole,
      name: user.name,
      email: user.email || undefined,
      phone: user.phone || undefined,
      createdAt: new Date(user.createdAt),
      lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined
    }));
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

// Update user's last login time
export const updateUserLoginTime = async (userId: string): Promise<void> => {
  try {
    const database = await openDatabase();
    const lastLogin = new Date().toISOString();
    
    await database.runAsync(
      'UPDATE users SET lastLogin = ? WHERE id = ?;',
      [lastLogin, userId]
    );
  } catch (error) {
    console.error('Error updating user login time:', error);
    throw error;
  }
};

// Create default users
export const createDefaultUsers = async (): Promise<void> => {
  try {
    const database = await openDatabase();
    
    // Check if admin user exists
    const adminExists: any = await database.getFirstAsync(
      'SELECT * FROM users WHERE username = ?;',
      ['admin']
    );
    
    if (!adminExists) {
      // Create default users
      await database.runAsync(
        `INSERT INTO users (id, username, password, role, name, email, phone, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          'admin-' + Math.random().toString(36).substring(2, 15),
          'admin',
          'admin123',
          'admin',
          'Administrator',
          'admin@posman.com',
          '',
          new Date().toISOString()
        ]
      );
      
      await database.runAsync(
        `INSERT INTO users (id, username, password, role, name, email, phone, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          'staff-' + Math.random().toString(36).substring(2, 15),
          'staff',
          'staff123',
          'staff',
          'Staff Member',
          'staff@posman.com',
          '',
          new Date().toISOString()
        ]
      );
      
      await database.runAsync(
        `INSERT INTO users (id, username, password, role, name, email, phone, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          'customer-' + Math.random().toString(36).substring(2, 15),
          'customer',
          'customer123',
          'customer',
          'Customer User',
          'customer@posman.com',
          '',
          new Date().toISOString()
        ]
      );
      
      console.log('Default users created successfully');
    } else {
      console.log('Default users already exist');
    }
  } catch (error) {
    console.error('Error creating default users:', error);
    throw error;
  }
};

// Inventory CRUD Operations

// Create a new inventory item
export const createInventoryItem = async (item: Omit<InventoryItem, 'code' | 'createdAt' | 'updatedAt'> & { code: string }): Promise<InventoryItem> => {
  try {
    const database = await openDatabase();
    const timestamp = new Date().toISOString();
    
    await database.runAsync(
      `INSERT INTO inventory_items (code, name, description, category, price, cost, quantity, sku, supplier, reorderLevel, isActive, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        item.code,
        item.name,
        item.description || null,
        item.category || null,
        item.price,
        item.cost,
        item.quantity,
        item.sku || null,
        item.supplier || null,
        item.reorderLevel,
        item.isActive ? 1 : 0,
        timestamp,
        timestamp
      ]
    );
    
    return {
      code: item.code,
      name: item.name,
      description: item.description || '',
      category: item.category || '',
      price: item.price,
      cost: item.cost,
      quantity: item.quantity,
      sku: item.sku || '',
      supplier: item.supplier || '',
      reorderLevel: item.reorderLevel,
      isActive: item.isActive,
      createdAt: new Date(timestamp),
      updatedAt: new Date(timestamp)
    };
  } catch (error: any) {
    console.error('Error creating inventory item:', error);
    // Handle specific SQLite errors
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      if (error.message.includes('inventory_items.code')) {
        throw new Error(`The product code "${item.code}" is already in use. Please try again to generate a different code.`);
      } else if (error.message.includes('inventory_items.sku')) {
        throw new Error(`The barcode/SKU "${item.sku}" is already in use. Please enter a different barcode or leave it blank.`);
      } else {
        throw new Error('Duplicate entry detected. Please check that the product code and barcode are unique.');
      }
    }
    throw new Error(error.message || 'Failed to create inventory item');
  }
};

// Get all inventory items
export const getAllInventoryItems = async (): Promise<InventoryItem[]> => {
  try {
    const database = await openDatabase();
    const result: any[] = await database.getAllAsync('SELECT * FROM inventory_items ORDER BY name;');
    
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
    console.error('Error getting all inventory items:', error);
    throw error;
  }
};

// Search inventory items
export const searchInventoryItems = async (query: string): Promise<InventoryItem[]> => {
  try {
    const database = await openDatabase();
    
    // Check if query is numeric (likely a barcode)
    const isNumeric = /^\d+$/.test(query);
    
    let result: any[];
    if (isNumeric) {
      // For numeric queries (barcodes), do exact match on code or sku
      result = await database.getAllAsync(
        `SELECT * FROM inventory_items 
         WHERE code = ? OR sku = ?
         ORDER BY name;`,
        [query, query]
      );
    } else {
      // For text queries, do partial matching
      result = await database.getAllAsync(
        `SELECT * FROM inventory_items 
         WHERE name LIKE ? OR code LIKE ? OR category LIKE ? OR supplier LIKE ? OR sku LIKE ?
         ORDER BY name;`,
        [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]
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
    console.error('Error searching inventory items:', error);
    throw error;
  }
};

// Get inventory items by category
export const getInventoryItemsByCategory = async (category: string): Promise<InventoryItem[]> => {
  try {
    const database = await openDatabase();
    const result: any[] = await database.getAllAsync(
      'SELECT * FROM inventory_items WHERE category = ? ORDER BY name;',
      [category]
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
    console.error('Error getting inventory items by category:', error);
    throw error;
  }
};

// Get inventory items below reorder level
export const getLowStockItems = async (): Promise<InventoryItem[]> => {
  try {
    const database = await openDatabase();
    const result: any[] = await database.getAllAsync(
      'SELECT * FROM inventory_items WHERE quantity <= reorderLevel AND isActive = 1 ORDER BY quantity ASC;'
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
    console.error('Error getting low stock items:', error);
    throw error;
  }
};

// Get inventory item by code
export const getInventoryItemByCode = async (code: string): Promise<InventoryItem | null> => {
  try {
    const database = await openDatabase();
    console.log('Mencari item di database dengan code/SKU:', code);
    // Cari berdasarkan code (barcode) atau SKU
    const result: any = await database.getFirstAsync(
      'SELECT * FROM inventory_items WHERE code = ? OR sku = ?;',
      [code, code]
    );
    console.log('Hasil pencarian di database:', result);
    
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
    console.error('Error getting inventory item by code:', error);
    throw error;
  }
};

// Update inventory item
export const updateInventoryItem = async (code: string, item: Partial<InventoryItem>): Promise<InventoryItem> => {
  try {
    const database = await openDatabase();
    const timestamp = new Date().toISOString();
    
    // Build dynamic update query
    const fields = [];
    const values = [];
    
    if (item.name !== undefined) {
      fields.push('name = ?');
      values.push(item.name);
    }
    if (item.description !== undefined) {
      fields.push('description = ?');
      values.push(item.description);
    }
    if (item.category !== undefined) {
      fields.push('category = ?');
      values.push(item.category);
    }
    if (item.price !== undefined) {
      fields.push('price = ?');
      values.push(item.price);
    }
    if (item.cost !== undefined) {
      fields.push('cost = ?');
      values.push(item.cost);
    }
    if (item.quantity !== undefined) {
      fields.push('quantity = ?');
      values.push(item.quantity);
    }
    if (item.sku !== undefined) {
      fields.push('sku = ?');
      values.push(item.sku);
    }
    if (item.supplier !== undefined) {
      fields.push('supplier = ?');
      values.push(item.supplier);
    }
    if (item.reorderLevel !== undefined) {
      fields.push('reorderLevel = ?');
      values.push(item.reorderLevel);
    }
    if (item.isActive !== undefined) {
      fields.push('isActive = ?');
      values.push(item.isActive ? 1 : 0);
    }
    
    fields.push('updatedAt = ?');
    values.push(timestamp);
    
    values.push(code);
    
    const query = `UPDATE inventory_items SET ${fields.join(', ')} WHERE code = ?;`;
    
    await database.runAsync(query, values);
    
    // Return updated item
    return await getInventoryItemByCode(code) as InventoryItem;
  } catch (error: any) {
    console.error('Error updating inventory item:', error);
    throw new Error(error.message || 'Failed to update inventory item');
  }
};

// Delete inventory item
export const deleteInventoryItem = async (code: string): Promise<void> => {
  try {
    const database = await openDatabase();
    await database.runAsync('DELETE FROM inventory_items WHERE code = ?;', [code]);
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    throw error;
  }
};

// Create inventory transaction
export const createInventoryTransaction = async (transaction: Omit<InventoryTransaction, 'id' | 'createdAt'>): Promise<InventoryTransaction> => {
  try {
    const database = await openDatabase();
    const id = Math.random().toString(36).substring(2, 15);
    const timestamp = new Date().toISOString();
    
    await database.runAsync(
      `INSERT INTO inventory_transactions (id, itemCode, type, quantity, price, reason, reference, createdAt, createdBy) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        transaction.itemCode,
        transaction.type,
        transaction.quantity,
        transaction.price,
        transaction.reason || null,
        transaction.reference || null,
        timestamp,
        transaction.createdBy
      ]
    );
    
    return {
      id,
      itemCode: transaction.itemCode,
      type: transaction.type,
      quantity: transaction.quantity,
      price: transaction.price,
      reason: transaction.reason || '',
      reference: transaction.reference || '',
      createdAt: new Date(timestamp),
      createdBy: transaction.createdBy
    };
  } catch (error) {
    console.error('Error creating inventory transaction:', error);
    throw error;
  }
};

// Get inventory transactions by item code
export const getInventoryTransactionsByItemCode = async (itemCode: string): Promise<InventoryTransaction[]> => {
  try {
    const database = await openDatabase();
    const result: any[] = await database.getAllAsync(
      'SELECT * FROM inventory_transactions WHERE itemCode = ? ORDER BY createdAt DESC;',
      [itemCode]
    );
    
    return result.map((transaction) => ({
      id: transaction.id,
      itemCode: transaction.itemCode,
      type: transaction.type,
      quantity: parseInt(transaction.quantity),
      price: parseFloat(transaction.price),
      reason: transaction.reason || '',
      reference: transaction.reference || '',
      createdAt: new Date(transaction.createdAt),
      createdBy: transaction.createdBy
    }));
  } catch (error) {
    console.error('Error getting inventory transactions:', error);
    throw error;
  }
};

// Stock Opname Operations

// Create a new stock opname record
export const createStockOpname = async (opname: Omit<StockOpname, 'id' | 'createdAt'>): Promise<StockOpname> => {
  try {
    const database = await openDatabase();
    const id = Math.random().toString(36).substring(2, 15);
    const createdAt = new Date().toISOString();
    
    await database.runAsync(
      `INSERT INTO stock_opname (id, date, startTime, endTime, type, status, createdBy, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        opname.date.toISOString(),
        opname.startTime.toISOString(),
        opname.endTime?.toISOString() || null,
        opname.type,
        opname.status,
        opname.createdBy,
        createdAt
      ]
    );
    
    return {
      id,
      date: opname.date,
      startTime: opname.startTime,
      endTime: opname.endTime,
      type: opname.type,
      status: opname.status,
      createdBy: opname.createdBy,
      createdAt: new Date(createdAt)
    };
  } catch (error) {
    console.error('Error creating stock opname:', error);
    throw error;
  }
};

// Create stock opname item
export const createStockOpnameItem = async (item: Omit<StockOpnameItem, 'id' | 'createdAt'>): Promise<StockOpnameItem> => {
  try {
    const database = await openDatabase();
    const id = Math.random().toString(36).substring(2, 15);
    const createdAt = new Date().toISOString();
    
    await database.runAsync(
      `INSERT INTO stock_opname_items (id, opnameId, itemCode, systemQuantity, actualQuantity, difference, status, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        item.opnameId,
        item.itemCode,
        item.systemQuantity,
        item.actualQuantity || null,
        item.difference || null,
        item.status || null,
        createdAt
      ]
    );
    
    return {
      id,
      opnameId: item.opnameId,
      itemCode: item.itemCode,
      systemQuantity: item.systemQuantity,
      actualQuantity: item.actualQuantity,
      difference: item.difference,
      status: item.status,
      createdAt: new Date(createdAt)
    };
  } catch (error) {
    console.error('Error creating stock opname item:', error);
    throw error;
  }
};

// Update stock opname status
export const updateStockOpnameStatus = async (id: string, status: StockOpname['status'], endTime?: Date): Promise<void> => {
  try {
    const database = await openDatabase();
    
    if (endTime) {
      await database.runAsync(
        'UPDATE stock_opname SET status = ?, endTime = ? WHERE id = ?;',
        [status, endTime.toISOString(), id]
      );
    } else {
      await database.runAsync(
        'UPDATE stock_opname SET status = ? WHERE id = ?;',
        [status, id]
      );
    }
  } catch (error) {
    console.error('Error updating stock opname status:', error);
    throw error;
  }
};

// Get stock opname by ID
export const getStockOpnameById = async (id: string): Promise<StockOpname | null> => {
  try {
    const database = await openDatabase();
    const result: any = await database.getFirstAsync(
      'SELECT * FROM stock_opname WHERE id = ?;',
      [id]
    );
    
    if (result) {
      return {
        id: result.id,
        date: new Date(result.date),
        startTime: new Date(result.startTime),
        endTime: result.endTime ? new Date(result.endTime) : undefined,
        type: result.type,
        status: result.status,
        createdBy: result.createdBy,
        createdAt: new Date(result.createdAt)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting stock opname by ID:', error);
    throw error;
  }
};

// Get stock opname items by opname ID
export const getStockOpnameItemsByOpnameId = async (opnameId: string): Promise<StockOpnameItem[]> => {
  try {
    const database = await openDatabase();
    const result: any[] = await database.getAllAsync(
      'SELECT * FROM stock_opname_items WHERE opnameId = ? ORDER BY createdAt;',
      [opnameId]
    );
    
    return result.map((item) => ({
      id: item.id,
      opnameId: item.opnameId,
      itemCode: item.itemCode,
      systemQuantity: parseInt(item.systemQuantity),
      actualQuantity: item.actualQuantity !== null ? parseInt(item.actualQuantity) : undefined,
      difference: item.difference !== null ? parseInt(item.difference) : undefined,
      status: item.status || undefined,
      createdAt: new Date(item.createdAt)
    }));
  } catch (error) {
    console.error('Error getting stock opname items:', error);
    throw error;
  }
};

// Fungsi debug untuk memeriksa data di database
export const debugPrintAllItems = async (): Promise<void> => {
  try {
    const database = await openDatabase();
    const result: any[] = await database.getAllAsync('SELECT * FROM inventory_items;');
    console.log('=== DEBUG: Semua item dalam database ===');
    result.forEach((item, index) => {
      console.log(`${index + 1}. Code: ${item.code}, Name: ${item.name}, SKU: ${item.sku || '(kosong)'}`);
    });
    console.log('=====================================');
  } catch (error) {
    console.error('Error debugging items:', error);
  }
};

// Fungsi debug untuk mencari item berdasarkan SKU
export const debugFindItemBySku = async (sku: string): Promise<void> => {
  try {
    const database = await openDatabase();
    const result: any = await database.getFirstAsync(
      'SELECT * FROM inventory_items WHERE sku = ?;',
      [sku]
    );
    console.log(`=== DEBUG: Mencari item dengan SKU "${sku}" ===`);
    if (result) {
      console.log('Item ditemukan:');
      console.log(`  Code: ${result.code}`);
      console.log(`  Name: ${result.name}`);
      console.log(`  SKU: ${result.sku || '(kosong)'}`);
    } else {
      console.log('Item tidak ditemukan');
    }
    console.log('=====================================');
  } catch (error) {
    console.error('Error debugging item by SKU:', error);
  }
};