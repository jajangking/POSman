import * as SQLite from 'expo-sqlite';
import { User, UserRole } from '../models/User';
import { InventoryItem, InventoryTransaction } from '../models/Inventory';
import { Member } from '../models/Member';

// Open database
let db: SQLite.SQLiteDatabase | null = null;

export const openDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('posman.db');
  }
  return db;
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
    
    // Create receipts table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT,
        price REAL NOT NULL,
        cost REAL NOT NULL,
        quantity INTEGER NOT NULL,
        sku TEXT,
        supplier TEXT,
        minStock INTEGER NOT NULL,
        isActive INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
    
    // Create purchase_request_history table
    await createPurchaseRequestHistoryTable();
    
    // Create inventory_transactions table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id TEXT PRIMARY KEY,
        itemId TEXT NOT NULL,
        type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        reason TEXT,
        reference TEXT,
        memberId TEXT,
        paymentMethod TEXT DEFAULT 'cash',
        createdAt TEXT NOT NULL,
        createdBy TEXT NOT NULL,
        FOREIGN KEY (itemId) REFERENCES inventory_items (code)
      );
    `);
    
    // Create so_history table for stock opname history
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS so_history (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        userId TEXT NOT NULL,
        userName TEXT NOT NULL,
        totalItems INTEGER NOT NULL,
        totalDifference INTEGER NOT NULL,
        totalRpDifference REAL NOT NULL,
        duration INTEGER NOT NULL, -- in seconds
        items TEXT NOT NULL, -- JSON string of items
        createdAt TEXT NOT NULL
      );
    `);
    
    // Create so_monitoring table for stock opname monitoring
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS so_monitoring (
        id TEXT PRIMARY KEY,
        itemCode TEXT NOT NULL,
        itemName TEXT NOT NULL,
        date TEXT NOT NULL,
        soCount INTEGER NOT NULL DEFAULT 1,
        totalDifference INTEGER NOT NULL,
        totalRpDifference REAL NOT NULL,
        consecutiveSOCount INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL, -- 'normal', 'warning', 'critical'
        notes TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (itemCode) REFERENCES inventory_items (code)
      );
    `);
    
    // Create so_sessions table for stock opname sessions
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS so_sessions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL, -- 'partial' or 'grand'
        startTime TEXT NOT NULL,
        lastView TEXT NOT NULL, -- 'partialSO', 'grandSO', or 'editSO'
        items TEXT, -- JSON string of SO items
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
    
    // Create members table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phoneNumber TEXT,
        email TEXT,
        birthday TEXT,
        totalPurchases REAL NOT NULL DEFAULT 0,
        totalPoints INTEGER NOT NULL DEFAULT 0,
        lastTransaction TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
    
    // Create point_settings table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS point_settings (
        id TEXT PRIMARY KEY,
        amountSpentToEarnPoints REAL NOT NULL,
        pointsEarnedPerAmount INTEGER NOT NULL,
        pointsRedemptionRate REAL NOT NULL,
        minPointsForRedemption INTEGER NOT NULL,
        maxPointsRedemption REAL NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
    
    // Create operating_expenses table for profit/loss report
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS operating_expenses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
        date TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
    
    // Create setoran_history table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS setoran_history (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        cashierId TEXT NOT NULL,
        cashierName TEXT NOT NULL,
        cashAmount REAL NOT NULL,
        systemSales REAL NOT NULL,
        difference REAL NOT NULL,
        status TEXT NOT NULL,
        notes TEXT,
        paymentMethodBreakdown TEXT,
        createdAt TEXT NOT NULL
      );
    `);
    
    // Create store_settings table with migration
    try {
      // Try to create the table
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS store_settings (
          id TEXT PRIMARY KEY DEFAULT 'store_settings',
          name TEXT NOT NULL DEFAULT 'TOKO POSman',
          address TEXT,
          phone TEXT,
          paperSize TEXT NOT NULL DEFAULT '80mm',
          printAuto INTEGER NOT NULL DEFAULT 0,
          discountEnabled INTEGER NOT NULL DEFAULT 0,
          taxEnabled INTEGER NOT NULL DEFAULT 1,
          taxPercentage REAL NOT NULL DEFAULT 10.0,
          footerMessage TEXT,
          bluetoothDevice TEXT,
          syncEnabled INTEGER NOT NULL DEFAULT 0,
          lastSync INTEGER NOT NULL DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);
      
      // Ensure there's at least one row in the store_settings table
      const existingSettings = await database.getFirstAsync('SELECT * FROM store_settings WHERE id = ?', ['store_settings']);
      if (!existingSettings) {
        const timestamp = new Date().toISOString();
        await database.runAsync(
          `INSERT INTO store_settings (
            id, name, address, phone, paperSize, printAuto, discountEnabled, 
            taxEnabled, taxPercentage, footerMessage, bluetoothDevice, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'store_settings',
            'TOKO POSman',
            '',
            '',
            '80mm',
            0,
            0,
            1,
            10.0,
            'Terima kasih telah berbelanja di toko kami!',
            '',
            timestamp,
            timestamp
          ]
        );
      }
      
      // Migrate store_settings table if needed
      await migrateStoreSettingsTable(database);
      
      // Migrate inventory_items table if needed
      await migrateInventoryItemsTable(database);
    } catch (createError) {
      console.log('Issue with store_settings table creation, attempting migration...');
      try {
        // If table creation fails, try to migrate
        await migrateStoreSettingsTable(database);
      } catch (migrateError) {
        console.error('Error creating or migrating store_settings table:', migrateError);
      }
    }
    
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
      `INSERT INTO inventory_items (code, name, description, category, price, cost, quantity, sku, supplier, reorderLevel, minOrder, isActive, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
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
        item.minOrder || 1,
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
      minOrder: item.minOrder || 1,
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
      minOrder: item.minOrder ? parseInt(item.minOrder) : 1,
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

// Get top selling items based on transaction history
export const getTopSellingItems = async (limit: number = 10): Promise<{itemCode: string, totalSold: number}[]> => {
  try {
    const database = await openDatabase();
    const result: any[] = await database.getAllAsync(
      `SELECT itemId as itemCode, SUM(quantity) as totalSold 
       FROM inventory_transactions 
       WHERE type = 'out' 
       GROUP BY itemId 
       ORDER BY totalSold DESC 
       LIMIT ?;`,
      [limit]
    );
    
    return result.map((row) => ({
      itemCode: row.itemCode,
      totalSold: parseInt(row.totalSold)
    }));
  } catch (error) {
    console.error('Error getting top selling items:', error);
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
        minOrder: result.minOrder ? parseInt(result.minOrder) : 1,
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
    if (item.minOrder !== undefined) {
      fields.push('minOrder = ?');
      values.push(item.minOrder);
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
      `INSERT INTO inventory_transactions (id, itemId, type, quantity, price, reason, reference, createdAt, createdBy) 
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
    
    // Gunakan itemId sesuai dengan definisi tabel yang sebenarnya
    const result: any[] = await database.getAllAsync(
      'SELECT * FROM inventory_transactions WHERE itemId = ? ORDER BY createdAt DESC',
      [itemCode]
    );
    
    return result.map((transaction) => ({
      id: transaction.id,
      itemCode: transaction.itemId,
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

// Get daily transactions
export const getDailyTransactions = async (date: string): Promise<any[]> => {
  try {
    const database = await openDatabase();
    
    // Get all transactions for the specified date
    const result: any[] = await database.getAllAsync(
      `SELECT 
        reference as id,
        createdAt,
        SUM(quantity) as items,
        SUM(price * quantity) as total
      FROM inventory_transactions 
      WHERE type = 'out' 
      AND date(createdAt) = ? 
      GROUP BY reference, createdAt
      ORDER BY createdAt DESC`,
      [date]
    );
    
    // Map the results to match our transaction interface
    return result.map(transaction => ({
      id: transaction.id,
      date: transaction.createdAt.split('T')[0],
      time: transaction.createdAt.split('T')[1].split('.')[0],
      items: parseInt(transaction.items),
      total: parseFloat(transaction.total),
      paymentMethod: 'cash', // Default to cash for now
      status: 'completed' // Default to completed
    }));
  } catch (error) {
    console.error('Error getting daily transactions:', error);
    throw error;
  }
};

// Get inventory transactions by item code within the last month
export const getInventoryTransactionsByItemCodeLastMonth = async (itemCode: string): Promise<InventoryTransaction[]> => {
  try {
    const database = await openDatabase();
    
    // Calculate the date one month ago
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    // Get transactions from the last month
    const result: any[] = await database.getAllAsync(
      'SELECT * FROM inventory_transactions WHERE itemId = ? AND createdAt >= ? AND type = ? ORDER BY createdAt DESC',
      [itemCode, oneMonthAgo.toISOString(), 'out']
    );
    
    return result.map((transaction) => ({
      id: transaction.id,
      itemCode: transaction.itemId,
      type: transaction.type,
      quantity: parseInt(transaction.quantity),
      price: parseFloat(transaction.price),
      reason: transaction.reason || '',
      reference: transaction.reference || '',
      createdAt: new Date(transaction.createdAt),
      createdBy: transaction.createdBy
    }));
  } catch (error) {
    console.error('Error getting inventory transactions for last month:', error);
    throw error;
  }
};

// Calculate total sales for an item in the last month
export const calculateTotalSalesLastMonth = async (itemCode: string): Promise<number> => {
  try {
    const transactions = await getInventoryTransactionsByItemCodeLastMonth(itemCode);
    
    // Sum up the quantities of 'out' transactions (sales)
    const totalSales = transactions.reduce((total, transaction) => {
      if (transaction.type === 'out') {
        return total + transaction.quantity;
      }
      return total;
    }, 0);
    
    return totalSales;
  } catch (error) {
    console.error('Error calculating total sales for last month:', error);
    throw error;
  }
};

// SO Monitoring functions

// Add SO monitoring record
export const addSOMonitoringRecord = async (record: {
  itemCode: string;
  itemName: string;
  date: string;
  soCount?: number;
  totalDifference: number;
  totalRpDifference: number;
  consecutiveSOCount?: number;
  status: 'normal' | 'warning' | 'critical';
  notes?: string;
}): Promise<void> => {
  try {
    const database = await openDatabase();
    const id = Math.random().toString(36).substring(2, 15);
    const createdAt = new Date().toISOString();
    
    await database.runAsync(
      `INSERT INTO so_monitoring (
        id, itemCode, itemName, date, soCount, totalDifference, totalRpDifference, 
        consecutiveSOCount, status, notes, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        record.itemCode,
        record.itemName,
        record.date,
        record.soCount || 1,
        record.totalDifference,
        record.totalRpDifference,
        record.consecutiveSOCount || 0,
        record.status,
        record.notes || null,
        createdAt
      ]
    );
  } catch (error) {
    console.error('Error adding SO monitoring record:', error);
    throw error;
  }
};

// Get SO monitoring records by item code
export const getSOMonitoringRecordsByItemCode = async (itemCode: string): Promise<any[]> => {
  try {
    const database = await openDatabase();
    const result: any[] = await database.getAllAsync(
      'SELECT * FROM so_monitoring WHERE itemCode = ? ORDER BY date DESC',
      [itemCode]
    );
    
    return result.map(record => ({
      id: record.id,
      itemCode: record.itemCode,
      itemName: record.itemName,
      date: record.date,
      soCount: record.soCount,
      totalDifference: record.totalDifference,
      totalRpDifference: record.totalRpDifference,
      consecutiveSOCount: record.consecutiveSOCount,
      status: record.status,
      notes: record.notes,
      createdAt: new Date(record.createdAt)
    }));
  } catch (error) {
    console.error('Error getting SO monitoring records:', error);
    throw error;
  }
};

// Get all SO monitoring records
export const getAllSOMonitoringRecords = async (): Promise<any[]> => {
  try {
    const database = await openDatabase();
    const result: any[] = await database.getAllAsync(
      'SELECT * FROM so_monitoring ORDER BY date DESC'
    );
    
    return result.map(record => ({
      id: record.id,
      itemCode: record.itemCode,
      itemName: record.itemName,
      date: record.date,
      soCount: record.soCount,
      totalDifference: record.totalDifference,
      totalRpDifference: record.totalRpDifference,
      consecutiveSOCount: record.consecutiveSOCount,
      status: record.status,
      notes: record.notes,
      createdAt: new Date(record.createdAt)
    }));
  } catch (error) {
    console.error('Error getting all SO monitoring records:', error);
    throw error;
  }
};

// Update SO monitoring record
export const updateSOMonitoringRecord = async (id: string, updates: Partial<any>): Promise<void> => {
  try {
    const database = await openDatabase();
    const timestamp = new Date().toISOString();
    
    // Build dynamic update query
    const fields = [];
    const values = [];
    
    if (updates.soCount !== undefined) {
      fields.push('soCount = ?');
      values.push(updates.soCount);
    }
    if (updates.totalDifference !== undefined) {
      fields.push('totalDifference = ?');
      values.push(updates.totalDifference);
    }
    if (updates.totalRpDifference !== undefined) {
      fields.push('totalRpDifference = ?');
      values.push(updates.totalRpDifference);
    }
    if (updates.consecutiveSOCount !== undefined) {
      fields.push('consecutiveSOCount = ?');
      values.push(updates.consecutiveSOCount);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }
    
    fields.push('createdAt = ?');
    values.push(timestamp);
    
    values.push(id);
    
    const query = `UPDATE so_monitoring SET ${fields.join(', ')} WHERE id = ?;`;
    
    await database.runAsync(query, values);
  } catch (error) {
    console.error('Error updating SO monitoring record:', error);
    throw error;
  }
};

// Delete SO monitoring record
export const deleteSOMonitoringRecord = async (id: string): Promise<void> => {
  try {
    const database = await openDatabase();
    await database.runAsync('DELETE FROM so_monitoring WHERE id = ?;', [id]);
  } catch (error) {
    console.error('Error deleting SO monitoring record:', error);
    throw error;
  }
};

// SO Session functions

// Interface for SO Session
export interface SOSession {
  id: string;
  type: 'partial' | 'grand';
  startTime: string;
  lastView: 'partialSO' | 'grandSO' | 'editSO';
  items: string; // JSON string of SO items
  createdAt: string;
  updatedAt: string;
}

// Create or update SO session
export const upsertSOSession = async (session: Omit<SOSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<SOSession> => {
  try {
    const database = await openDatabase();
    const timestamp = new Date().toISOString();
    const id = 'current_so_session'; // Use a fixed ID for the current session
    
    // Check if session already exists
    const existingSession: any = await database.getFirstAsync(
      'SELECT * FROM so_sessions WHERE id = ?;', 
      [id]
    );
    
    if (existingSession) {
      // Update existing session
      await database.runAsync(
        `UPDATE so_sessions SET type = ?, startTime = ?, lastView = ?, items = ?, updatedAt = ? WHERE id = ?;`,
        [
          session.type,
          session.startTime,
          session.lastView,
          session.items || null,
          timestamp,
          id
        ]
      );
    } else {
      // Create new session
      await database.runAsync(
        `INSERT INTO so_sessions (id, type, startTime, lastView, items, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          id,
          session.type,
          session.startTime,
          session.lastView,
          session.items || null,
          timestamp,
          timestamp
        ]
      );
    }
    
    return {
      id,
      type: session.type,
      startTime: session.startTime,
      lastView: session.lastView,
      items: session.items || '',
      createdAt: existingSession ? existingSession.createdAt : timestamp,
      updatedAt: timestamp
    };
  } catch (error) {
    console.error('Error upserting SO session:', error);
    throw error;
  }
};

// Get current SO session
export const getCurrentSOSession = async (): Promise<SOSession | null> => {
  try {
    const database = await openDatabase();
    const result: any = await database.getFirstAsync(
      'SELECT * FROM so_sessions WHERE id = ?;',
      ['current_so_session']
    );
    
    if (result) {
      return {
        id: result.id,
        type: result.type as 'partial' | 'grand',
        startTime: result.startTime,
        lastView: result.lastView as 'partialSO' | 'grandSO' | 'editSO',
        items: result.items || '',
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current SO session:', error);
    throw error;
  }
};

// Delete SO session
export const deleteSOSession = async (): Promise<void> => {
  try {
    const database = await openDatabase();
    await database.runAsync('DELETE FROM so_sessions WHERE id = ?;', ['current_so_session']);
  } catch (error) {
    console.error('Error deleting SO session:', error);
    throw error;
  }
};

// Update SO session items
export const updateSOSessionItems = async (items: string): Promise<void> => {
  try {
    const database = await openDatabase();
    const timestamp = new Date().toISOString();
    
    await database.runAsync(
      `UPDATE so_sessions SET items = ?, updatedAt = ? WHERE id = ?;`,
      [
        items,
        timestamp,
        'current_so_session'
      ]
    );
  } catch (error) {
    console.error('Error updating SO session items:', error);
    throw error;
  }
};

// Member functions

// Create a new member
export const createMember = async (member: Omit<Member, 'id' | 'totalPurchases' | 'totalPoints' | 'createdAt' | 'updatedAt'>): Promise<Member> => {
  try {
    const database = await openDatabase();
    const id = Math.random().toString(36).substring(2, 15);
    const timestamp = new Date().toISOString();
    
    await database.runAsync(
      `INSERT INTO members (id, name, phoneNumber, email, birthday, totalPurchases, totalPoints, lastTransaction, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        member.name,
        member.phoneNumber || null,
        member.email || null,
        member.birthday || null,
        0, // totalPurchases default to 0
        0, // totalPoints default to 0
        null, // lastTransaction default to null
        timestamp,
        timestamp
      ]
    );
    
    return {
      id,
      name: member.name,
      phoneNumber: member.phoneNumber || '',
      email: member.email || undefined,
      birthday: member.birthday || undefined,
      totalPurchases: 0,
      totalPoints: 0,
      lastTransaction: undefined,
      createdAt: timestamp,
      updatedAt: timestamp
    };
  } catch (error) {
    console.error('Error creating member:', error);
    throw error;
  }
};

// Get all members
export const getAllMembers = async (): Promise<Member[]> => {
  try {
    const database = await openDatabase();
    const members = await database.getAllAsync<Member>('SELECT * FROM members ORDER BY name');
    return members;
  } catch (error) {
    console.error('Error getting all members:', error);
    throw error;
  }
};

// Point Settings interface
export interface PointSettings {
  id: string;
  amountSpentToEarnPoints: number;
  pointsEarnedPerAmount: number;
  pointsRedemptionRate: number;
  minPointsForRedemption: number;
  maxPointsRedemption: number;
  createdAt: string;
  updatedAt: string;
}

// Save point settings
export const savePointSettings = async (settings: Omit<PointSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<PointSettings> => {
  try {
    const database = await openDatabase();
    const id = 'default'; // Using a fixed ID for simplicity
    const now = new Date().toISOString();
    
    // Check if settings already exist
    const existing = await database.getFirstAsync<PointSettings>('SELECT * FROM point_settings WHERE id = ?', [id]);
    
    if (existing) {
      // Update existing settings
      await database.runAsync(
        `UPDATE point_settings SET 
          amountSpentToEarnPoints = ?, 
          pointsEarnedPerAmount = ?, 
          pointsRedemptionRate = ?, 
          minPointsForRedemption = ?, 
          maxPointsRedemption = ?, 
          updatedAt = ? 
        WHERE id = ?`,
        [
          settings.amountSpentToEarnPoints,
          settings.pointsEarnedPerAmount,
          settings.pointsRedemptionRate,
          settings.minPointsForRedemption,
          settings.maxPointsRedemption,
          now,
          id
        ]
      );
    } else {
      // Insert new settings
      await database.runAsync(
        `INSERT INTO point_settings (
          id, 
          amountSpentToEarnPoints, 
          pointsEarnedPerAmount, 
          pointsRedemptionRate, 
          minPointsForRedemption, 
          maxPointsRedemption, 
          createdAt, 
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          settings.amountSpentToEarnPoints,
          settings.pointsEarnedPerAmount,
          settings.pointsRedemptionRate,
          settings.minPointsForRedemption,
          settings.maxPointsRedemption,
          now,
          now
        ]
      );
    }
    
    // Return the saved settings
    const savedSettings = await database.getFirstAsync<PointSettings>('SELECT * FROM point_settings WHERE id = ?', [id]);
    if (!savedSettings) {
      throw new Error('Failed to save point settings');
    }
    
    return savedSettings;
  } catch (error) {
    console.error('Error saving point settings:', error);
    throw error;
  }
};

// Get point settings
export const getPointSettings = async (): Promise<PointSettings | null> => {
  try {
    const database = await openDatabase();
    const settings = await database.getFirstAsync<PointSettings>('SELECT * FROM point_settings WHERE id = ?', ['default']);
    return settings || null;
  } catch (error) {
    console.error('Error getting point settings:', error);
    return null;
  }
};

// Update member
export const updateMember = async (id: string, member: Partial<Omit<Member, 'id' | 'createdAt'>>): Promise<Member> => {
  try {
    const database = await openDatabase();
    const timestamp = new Date().toISOString();
    
    // Build dynamic update query
    const fields = [];
    const values = [];
    
    if (member.name !== undefined) {
      fields.push('name = ?');
      values.push(member.name);
    }
    if (member.phoneNumber !== undefined) {
      fields.push('phoneNumber = ?');
      values.push(member.phoneNumber);
    }
    if (member.email !== undefined) {
      fields.push('email = ?');
      values.push(member.email);
    }
    if (member.birthday !== undefined) {
      fields.push('birthday = ?');
      values.push(member.birthday);
    }
    if (member.totalPurchases !== undefined) {
      fields.push('totalPurchases = ?');
      values.push(member.totalPurchases);
    }
    if (member.totalPoints !== undefined) {
      fields.push('totalPoints = ?');
      values.push(member.totalPoints);
    }
    if (member.lastTransaction !== undefined) {
      fields.push('lastTransaction = ?');
      values.push(member.lastTransaction);
    }
    
    fields.push('updatedAt = ?');
    values.push(timestamp);
    
    values.push(id);
    
    const query = `UPDATE members SET ${fields.join(', ')} WHERE id = ?;`;
    
    await database.runAsync(query, values);
    
    // Return updated member
    const updatedMember: any = await database.getFirstAsync('SELECT * FROM members WHERE id = ?;', [id]);
    
    if (!updatedMember) {
      throw new Error('Member not found');
    }
    
    return {
      id: updatedMember.id,
      name: updatedMember.name,
      phoneNumber: updatedMember.phoneNumber || '',
      email: updatedMember.email || undefined,
      birthday: updatedMember.birthday || undefined,
      totalPurchases: parseFloat(updatedMember.totalPurchases),
      totalPoints: parseInt(updatedMember.totalPoints),
      lastTransaction: updatedMember.lastTransaction || undefined,
      createdAt: updatedMember.createdAt,
      updatedAt: updatedMember.updatedAt
    };
  } catch (error) {
    console.error('Error updating member:', error);
    throw error;
  }
};

// Delete member
export const deleteMember = async (id: string): Promise<void> => {
  try {
    const database = await openDatabase();
    await database.runAsync('DELETE FROM members WHERE id = ?;', [id]);
  } catch (error) {
    console.error('Error deleting member:', error);
    throw error;
  }
};

// Get member by ID
export const getMemberById = async (id: string): Promise<Member | null> => {
  try {
    const database = await openDatabase();
    const result: any = await database.getFirstAsync('SELECT * FROM members WHERE id = ?;', [id]);
    
    if (result) {
      return {
        id: result.id,
        name: result.name,
        phoneNumber: result.phoneNumber || '',
        email: result.email || undefined,
        birthday: result.birthday || undefined,
        totalPurchases: parseFloat(result.totalPurchases),
        totalPoints: parseInt(result.totalPoints),
        lastTransaction: result.lastTransaction || undefined,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting member by ID:', error);
    throw error;
  }
};

// Get member by phone number
export const getMemberByPhoneNumber = async (phoneNumber: string): Promise<Member | null> => {
  try {
    const database = await openDatabase();
    const result: any = await database.getFirstAsync('SELECT * FROM members WHERE phoneNumber = ?;', [phoneNumber]);
    
    if (result) {
      return {
        id: result.id,
        name: result.name,
        phoneNumber: result.phoneNumber || '',
        email: result.email || undefined,
        birthday: result.birthday || undefined,
        totalPurchases: parseFloat(result.totalPurchases),
        totalPoints: parseInt(result.totalPoints),
        lastTransaction: result.lastTransaction || undefined,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting member by phone number:', error);
    throw error;
  }
};

// Store Settings interface
export interface StoreSettings {
  id: string;
  name: string;
  address: string;
  phone: string;
  paperSize: string;
  printAuto: boolean;
  discountEnabled: boolean;
  taxEnabled: boolean;
  taxPercentage: number;
  footerMessage: string;
  bluetoothDevice: string;
  createdAt: string;
  updatedAt: string;
}

// Get store settings
export const getStoreSettings = async (): Promise<StoreSettings | null> => {
  try {
    const database = await openDatabase();
    const result: any = await database.getFirstAsync('SELECT * FROM store_settings WHERE id = ?', ['store_settings']);
    
    if (result) {
      return {
        id: result.id,
        name: result.name || 'TOKO POSman',
        address: result.address || '',
        phone: result.phone || '',
        paperSize: result.paperSize || '80mm',
        printAuto: result.printAuto === 1,
        discountEnabled: result.discountEnabled === 1,
        taxEnabled: result.taxEnabled === 1,
        taxPercentage: parseFloat(result.taxPercentage) || 10.0,
        footerMessage: result.footerMessage || 'Terima kasih telah berbelanja di toko kami!',
        bluetoothDevice: result.bluetoothDevice || '',
        syncEnabled: result.syncEnabled === 1,
        lastSync: result.lastSync || 0,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting store settings:', error);
    throw error;
  }
};

// Update store settings
export const updateStoreSettings = async (
  name: string,
  address: string,
  phone: string,
  paperSize: string,
  printAuto: boolean,
  discountEnabled: boolean,
  taxEnabled: boolean,
  taxPercentage: number,
  footerMessage: string,
  bluetoothDevice: string,
  syncEnabled: boolean,
  lastSync: number
): Promise<void> => {
  try {
    const database = await openDatabase();
    const timestamp = new Date().toISOString();
    
    // Ensure name is not empty
    if (!name || name.trim() === '') {
      throw new Error('Store name cannot be empty');
    }
    
    // Check if settings already exist
    const existing = await database.getFirstAsync('SELECT * FROM store_settings WHERE id = ?', ['store_settings']);
    
    if (existing) {
      // Update existing settings
      await database.runAsync(
        `UPDATE store_settings SET 
          name = ?, 
          address = ?, 
          phone = ?, 
          paperSize = ?, 
          printAuto = ?, 
          discountEnabled = ?, 
          taxEnabled = ?, 
          taxPercentage = ?, 
          footerMessage = ?, 
          bluetoothDevice = ?,
          syncEnabled = ?,
          lastSync = ?,
          updatedAt = ? 
        WHERE id = ?`,
        [
          name,
          address || '',
          phone || '',
          paperSize || '80mm',
          printAuto ? 1 : 0,
          discountEnabled ? 1 : 0,
          taxEnabled ? 1 : 0,
          taxPercentage || 0,
          footerMessage || '',
          bluetoothDevice || '',
          syncEnabled ? 1 : 0,
          lastSync || 0,
          timestamp,
          'store_settings'
        ]
      );
    } else {
      // Insert new settings with defaults for any missing values
      await database.runAsync(
        `INSERT INTO store_settings (
          id, name, address, phone, paperSize, printAuto, discountEnabled, 
          taxEnabled, taxPercentage, footerMessage, bluetoothDevice, syncEnabled, lastSync, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'store_settings',
          name,
          address || '',
          phone || '',
          paperSize || '80mm',
          printAuto ? 1 : 0,
          discountEnabled ? 1 : 0,
          taxEnabled ? 1 : 0,
          taxPercentage || 0,
          footerMessage || '',
          bluetoothDevice || '',
          syncEnabled ? 1 : 0,
          lastSync || 0,
          timestamp,
          timestamp
        ]
      );
    }
  } catch (error) {
    console.error('Error updating store settings:', error);
    throw error;
  }
};

// Migrate store_settings table if column structure has changed
const migrateStoreSettingsTable = async (database: SQLite.SQLiteDatabase) => {
  try {
    // Try to add new columns if they don't exist
    try {
      await database.execAsync(`ALTER TABLE store_settings ADD COLUMN taxEnabled INTEGER NOT NULL DEFAULT 1;`);
    } catch (error) {
      // Column might already exist, which is fine
      console.log('taxEnabled column already exists or error adding it:', error);
    }
    
    try {
      await database.execAsync(`ALTER TABLE store_settings ADD COLUMN taxPercentage REAL NOT NULL DEFAULT 10.0;`);
    } catch (error) {
      // Column might already exist, which is fine
      console.log('taxPercentage column already exists or error adding it:', error);
    }
    
    try {
      await database.execAsync(`ALTER TABLE store_settings ADD COLUMN footerMessage TEXT;`);
    } catch (error) {
      // Column might already exist, which is fine
      console.log('footerMessage column already exists or error adding it:', error);
    }
    
    try {
      await database.execAsync(`ALTER TABLE store_settings ADD COLUMN bluetoothDevice TEXT;`);
    } catch (error) {
      // Column might already exist, which is fine
      console.log('bluetoothDevice column already exists or error adding it:', error);
    }
    
    // Add paymentMethod column to inventory_transactions table if it doesn't exist
    try {
      await database.execAsync(`ALTER TABLE inventory_transactions ADD COLUMN paymentMethod TEXT DEFAULT 'cash';`);
    } catch (error) {
      // Column might already exist, which is fine
      console.log('Payment method column might already exist, continuing...');
    }
  } catch (error) {
    console.error('Error migrating store_settings table:', error);
  }
};

// Migrate inventory_items table if column structure has changed
const migrateInventoryItemsTable = async (database: SQLite.SQLiteDatabase) => {
  try {
    // Try to add minOrder column if it doesn't exist
    try {
      await database.execAsync(`ALTER TABLE inventory_items ADD COLUMN minOrder INTEGER NOT NULL DEFAULT 1;`);
    } catch (error) {
      // Column might already exist, which is fine
      console.log('minOrder column already exists or error adding it:', error);
    }
  } catch (error) {
    console.error('Error migrating inventory_items table:', error);
  }
};

// Create purchase_request_history table
export const createPurchaseRequestHistoryTable = async () => {
  try {
    const database = await openDatabase();
    
    // Create the table with all columns
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS purchase_request_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        poNumber TEXT NOT NULL,
        date TEXT NOT NULL,
        items TEXT NOT NULL,
        totalAmount REAL NOT NULL,
        supplier TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL
      );
    `);
    
    // Try to add status column if it doesn't exist
    try {
      await database.execAsync(`
        ALTER TABLE purchase_request_history ADD COLUMN status TEXT DEFAULT 'pending';
      `);
    } catch (alterError) {
      // Column might already exist, which is fine
      console.log('Status column might already exist or alter failed:', alterError);
    }
    
    // Add paymentMethod column to inventory_transactions table if it doesn't exist
    try {
      await database.execAsync(`ALTER TABLE inventory_transactions ADD COLUMN paymentMethod TEXT DEFAULT 'cash';`);
    } catch (error) {
      // Column might already exist, which is fine
      console.log('Payment method column might already exist, continuing...');
    }
    
    console.log('Purchase request history table created/updated successfully');
  } catch (error) {
    console.error('Error creating/updating purchase request history table:', error);
    throw error;
  }
};

export const savePurchaseRequest = async (
  poNumber: string,
  date: string,
  items: any[],
  totalAmount: number,
  supplier?: string,
  notes?: string
): Promise<number> => {
  try {
    const database = await openDatabase();
    const itemsJson = JSON.stringify(items);
    const createdAt = new Date().toISOString();
    
    // Try to insert with all columns first
    try {
      const result = await database.runAsync(
        `INSERT INTO purchase_request_history 
         (poNumber, date, items, totalAmount, supplier, notes, status, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [poNumber, date, itemsJson, totalAmount, supplier || null, notes || null, 'pending', createdAt]
      );
      
      console.log('Purchase request saved successfully with ID:', result.lastInsertRowId);
      return result.lastInsertRowId;
    } catch (insertError) {
      // If that fails, try inserting without the new columns
      console.log('Insert with new columns failed, trying without status column:', insertError);
      const result = await database.runAsync(
        `INSERT INTO purchase_request_history 
         (poNumber, date, items, totalAmount, supplier, notes, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [poNumber, date, itemsJson, totalAmount, supplier || null, notes || null, createdAt]
      );
      
      console.log('Purchase request saved successfully with ID:', result.lastInsertRowId);
      return result.lastInsertRowId;
    }
  } catch (error) {
    console.error('Error saving purchase request:', error);
    throw error;
  }
};

// Get all purchase requests from history
export const getAllPurchaseRequests = async () => {
  try {
    const database = await openDatabase();
    const requests = await database.getAllAsync<any>(
      'SELECT * FROM purchase_request_history ORDER BY createdAt DESC'
    );
    
    // Parse items JSON back to objects and handle missing columns
    return requests.map(request => {
      let items = [];
      try {
        items = JSON.parse(request.items);
      } catch (parseError) {
        console.error('Error parsing items JSON for request:', request.id, parseError);
        items = []; // Default to empty array if JSON parsing fails
      }
      
      return {
        ...request,
        items,
        poNumber: request.poNumber || '', // Handle missing poNumber
        date: request.date || '', // Handle missing date
        totalAmount: request.totalAmount || 0, // Handle missing totalAmount
        status: request.status || 'pending', // Default to pending if status is missing
        createdAt: request.createdAt || '', // Handle missing createdAt
        processedAt: request.processedAt || null // Default to null if processedAt is missing
      };
    });
  } catch (error) {
    console.error('Error getting purchase requests:', error);
    throw error;
  }
};

// Get purchase request by ID
export const getPurchaseRequestById = async (id: number) => {
  try {
    const database = await openDatabase();
    const request = await database.getFirstAsync<any>(
      'SELECT * FROM purchase_request_history WHERE id = ?', 
      [id]
    );
    
    if (request) {
      let items = [];
      try {
        items = JSON.parse(request.items);
      } catch (parseError) {
        console.error('Error parsing items JSON for request:', id, parseError);
        items = []; // Default to empty array if JSON parsing fails
      }
      
      return {
        ...request,
        items,
        poNumber: request.poNumber || '', // Handle missing poNumber
        date: request.date || '', // Handle missing date
        totalAmount: request.totalAmount || 0, // Handle missing totalAmount
        createdAt: request.createdAt || '', // Handle missing createdAt
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting purchase request by ID:', error);
    throw error;
  }
};

// Update purchase request status
export const updatePurchaseRequestStatus = async (poNumber: string, status: 'pending' | 'processed' | 'cancelled') => {
  try {
    const database = await openDatabase();
    const processedAt = status === 'processed' ? new Date().toISOString() : null;
    
    // Try to update with both status and processedAt
    try {
      await database.runAsync(
        'UPDATE purchase_request_history SET status = ?, processedAt = ? WHERE poNumber = ?',
        [status, processedAt, poNumber]
      );
    } catch (updateError) {
      // If that fails, try updating with just status
      console.log('Update with processedAt failed, trying without:', updateError);
      await database.runAsync(
        'UPDATE purchase_request_history SET status = ? WHERE poNumber = ?',
        [status, poNumber]
      );
    }
    
    console.log(`Purchase request ${poNumber} status updated to ${status}`);
  } catch (error) {
    console.error('Error updating purchase request status:', error);
    throw error;
  }
};

// Get pending purchase requests
export const getPendingPurchaseRequests = async () => {
  try {
    const database = await openDatabase();
    
    // Try to get requests with status first
    try {
      const requests = await database.getAllAsync<any>(
        'SELECT * FROM purchase_request_history WHERE status = ? ORDER BY createdAt DESC',
        ['pending']
      );
      
      // Parse items JSON back to objects
      return requests.map(request => {
        let items = [];
        try {
          items = JSON.parse(request.items);
        } catch (parseError) {
          console.error('Error parsing items JSON for request:', request.id, parseError);
          items = []; // Default to empty array if JSON parsing fails
        }
        
        return {
          ...request,
          items,
          poNumber: request.poNumber || '', // Handle missing poNumber
          date: request.date || '', // Handle missing date
          totalAmount: request.totalAmount || 0, // Handle missing totalAmount
          createdAt: request.createdAt || '', // Handle missing createdAt
        };
      });
    } catch (selectError) {
      // If that fails, get all requests (older version without status column)
      console.log('Select with status failed, getting all requests:', selectError);
      const requests = await database.getAllAsync<any>(
        'SELECT * FROM purchase_request_history ORDER BY createdAt DESC'
      );
      
      // Parse items JSON back to objects
      return requests.map(request => {
        let items = [];
        try {
          items = JSON.parse(request.items);
        } catch (parseError) {
          console.error('Error parsing items JSON for request:', request.id, parseError);
          items = []; // Default to empty array if JSON parsing fails
        }
        
        return {
          ...request,
          items,
          poNumber: request.poNumber || '', // Handle missing poNumber
          date: request.date || '', // Handle missing date
          totalAmount: request.totalAmount || 0, // Handle missing totalAmount
          createdAt: request.createdAt || '', // Handle missing createdAt
          status: 'pending' // Default to pending for older records
        };
      });
    }
  } catch (error) {
    console.error('Error getting pending purchase requests:', error);
    throw error;
  }
}

// Operating Expenses interface
export interface OperatingExpense {
  id: string;
  name: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly';
  date: string;
  createdAt: string;
  updatedAt: string;
}

// Save operating expense
export const saveOperatingExpense = async (
  name: string,
  amount: number,
  period: 'daily' | 'weekly' | 'monthly',
  date: string
): Promise<OperatingExpense> => {
  try {
    const database = await openDatabase();
    const id = Math.random().toString(36).substring(2, 15);
    const timestamp = new Date().toISOString();
    
    await database.runAsync(
      `INSERT INTO operating_expenses (id, name, amount, period, date, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, amount, period, date, timestamp, timestamp]
    );
    
    return {
      id,
      name,
      amount,
      period,
      date,
      createdAt: timestamp,
      updatedAt: timestamp
    };
  } catch (error) {
    console.error('Error saving operating expense:', error);
    throw error;
  }
};

// Get operating expenses by period and date range
export const getOperatingExpenses = async (
  period: 'daily' | 'weekly' | 'monthly',
  startDate: string,
  endDate: string
): Promise<OperatingExpense[]> => {
  try {
    const database = await openDatabase();
    const result: any[] = await database.getAllAsync(
      `SELECT * FROM operating_expenses 
       WHERE period = ? AND date >= ? AND date <= ? 
       ORDER BY date DESC`,
      [period, startDate, endDate]
    );
    
    return result.map(expense => ({
      id: expense.id,
      name: expense.name,
      amount: parseFloat(expense.amount),
      period: expense.period,
      date: expense.date,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt
    }));
  } catch (error) {
    console.error('Error getting operating expenses:', error);
    throw error;
  }
};

// Update operating expense
export const updateOperatingExpense = async (
  id: string,
  name: string,
  amount: number,
  period: 'daily' | 'weekly' | 'monthly',
  date: string
): Promise<OperatingExpense> => {
  try {
    const database = await openDatabase();
    const timestamp = new Date().toISOString();
    
    await database.runAsync(
      `UPDATE operating_expenses 
       SET name = ?, amount = ?, period = ?, date = ?, updatedAt = ? 
       WHERE id = ?`,
      [name, amount, period, date, timestamp, id]
    );
    
    // Fetch the updated expense from database
    const result: any = await database.getFirstAsync(
      'SELECT * FROM operating_expenses WHERE id = ?',
      [id]
    );
    
    if (result) {
      return {
        id: result.id,
        name: result.name,
        amount: parseFloat(result.amount),
        period: result.period,
        date: result.date,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    } else {
      throw new Error('Failed to fetch updated expense');
    }
  } catch (error) {
    console.error('Error updating operating expense:', error);
    throw error;
  }
};

// Delete operating expense
export const deleteOperatingExpense = async (id: string): Promise<void> => {
  try {
    const database = await openDatabase();
    await database.runAsync('DELETE FROM operating_expenses WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting operating expense:', error);
    throw error;
  }
};

// Get revenue data by period
export const getRevenueByPeriod = async (
  startDate: string,
  endDate: string
): Promise<{ totalRevenue: number; revenueItems: { name: string; amount: number }[] }> => {
  try {
    const database = await openDatabase();
    
    const result: any[] = await database.getAllAsync(
      `SELECT 
        date(createdAt) as date,
        SUM(price * quantity) as dailyRevenue
      FROM inventory_transactions 
      WHERE type = 'out' 
      AND date(createdAt) >= ? 
      AND date(createdAt) <= ?
      GROUP BY date(createdAt)
      ORDER BY date(createdAt)`,
      [startDate, endDate]
    );
    
    // Calculate total revenue
    const totalRevenue = result.reduce((sum, item) => sum + (parseFloat(item.dailyRevenue) || 0), 0);
    
    // For detailed items, we'll need to get item names from inventory_items
    const itemDetails: any[] = await database.getAllAsync(
      `SELECT 
        i.name,
        SUM(it.price * it.quantity) as itemRevenue
      FROM inventory_transactions it
      JOIN inventory_items i ON it.itemId = i.code
      WHERE it.type = 'out'
      AND date(it.createdAt) >= ?
      AND date(it.createdAt) <= ?
      GROUP BY i.code, i.name
      ORDER BY itemRevenue DESC`,
      [startDate, endDate]
    );
    
    const revenueItems = itemDetails.map(item => ({
      name: item.name,
      amount: parseFloat(item.itemRevenue) || 0
    }));
    
    return {
      totalRevenue,
      revenueItems
    };
  } catch (error) {
    console.error('Error getting revenue data:', error);
    throw error;
  }
}

// Report History interface
export interface ReportHistory {
  id: string;
  reportType: string;
  date: string;
  accessTime: string;
  createdAt: string;
}

// Setoran History interface
export interface SetoranHistory {
  id: string;
  date: string;
  time: string;
  cashierId: string;
  cashierName: string;
  cashAmount: number;
  systemSales: number;
  difference: number;
  status: 'surplus' | 'deficit' | 'balanced';
  notes: string;
  paymentMethodBreakdown: {[key: string]: number};
  createdAt: string;
}

// Save setoran to history
export const saveSetoranToHistory = async (
  cashierId: string,
  cashierName: string,
  cashAmount: number,
  systemSales: number,
  difference: number,
  status: 'surplus' | 'deficit' | 'balanced',
  notes: string,
  paymentMethodBreakdown: {[key: string]: number}
): Promise<SetoranHistory> => {
  try {
    const database = await openDatabase();
    const id = Math.random().toString(36).substring(2, 15);
    const timestamp = new Date().toISOString();
    const date = timestamp.split('T')[0];
    const time = timestamp.split('T')[1].split('.')[0];
    
    await database.runAsync(
      `INSERT INTO setoran_history 
       (id, date, time, cashierId, cashierName, cashAmount, systemSales, difference, status, notes, paymentMethodBreakdown, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        date,
        time,
        cashierId,
        cashierName,
        cashAmount,
        systemSales,
        difference,
        status,
        notes || null,
        JSON.stringify(paymentMethodBreakdown),
        timestamp
      ]
    );
    
    return {
      id,
      date,
      time,
      cashierId,
      cashierName,
      cashAmount,
      systemSales,
      difference,
      status,
      notes: notes || '',
      paymentMethodBreakdown,
      createdAt: timestamp
    };
  } catch (error) {
    console.error('Error saving setoran to history:', error);
    throw error;
  }
};

// Get setoran history
export const getSetoranHistory = async (cashierId?: string, limit: number = 50): Promise<SetoranHistory[]> => {
  try {
    const database = await openDatabase();
    
    let query = 'SELECT * FROM setoran_history';
    let params: any[] = [];
    
    if (cashierId) {
      query += ' WHERE cashierId = ?';
      params.push(cashierId);
    }
    
    query += ' ORDER BY createdAt DESC LIMIT ?';
    params.push(limit);
    
    const result: any[] = await database.getAllAsync(query, params);
    
    return result.map(history => ({
      id: history.id,
      date: history.date,
      time: history.time,
      cashierId: history.cashierId,
      cashierName: history.cashierName,
      cashAmount: parseFloat(history.cashAmount),
      systemSales: parseFloat(history.systemSales),
      difference: parseFloat(history.difference),
      status: history.status as 'surplus' | 'deficit' | 'balanced',
      notes: history.notes || '',
      paymentMethodBreakdown: history.paymentMethodBreakdown ? JSON.parse(history.paymentMethodBreakdown) : {},
      createdAt: history.createdAt
    }));
  } catch (error) {
    console.error('Error getting setoran history:', error);
    throw error;
  }
};

// Save report access to history
export const saveReportHistory = async (
  reportType: string,
  date: string
): Promise<ReportHistory> => {
  try {
    const database = await openDatabase();
    const id = Math.random().toString(36).substring(2, 15);
    const timestamp = new Date().toISOString();
    
    await database.runAsync(
      `INSERT INTO report_history (id, reportType, date, accessTime, createdAt) 
       VALUES (?, ?, ?, ?, ?)`,
      [id, reportType, date, timestamp, timestamp]
    );
    
    return {
      id,
      reportType,
      date,
      accessTime: timestamp,
      createdAt: timestamp
    };
  } catch (error) {
    console.error('Error saving report history:', error);
    throw error;
  }
};

// Get report history
export const getReportHistory = async (reportType: string, limit: number = 50): Promise<ReportHistory[]> => {
  try {
    const database = await openDatabase();
    const result: any[] = await database.getAllAsync(
      `SELECT * FROM report_history 
       WHERE reportType = ? 
       ORDER BY accessTime DESC 
       LIMIT ?`,
      [reportType, limit]
    );
    
    return result.map(history => ({
      id: history.id,
      reportType: history.reportType,
      date: history.date,
      accessTime: history.accessTime,
      createdAt: history.createdAt
    }));
  } catch (error) {
    console.error('Error getting report history:', error);
    throw error;
  }
};

// Delete old report history (keep only recent records)
export const deleteOldReportHistory = async (reportType: string, keepCount: number = 50): Promise<void> => {
  try {
    const database = await openDatabase();
    
    // Get the IDs of records to delete (all except the most recent keepCount)
    const result: any[] = await database.getAllAsync(
      `SELECT id FROM report_history 
       WHERE reportType = ? 
       ORDER BY accessTime DESC 
       LIMIT -1 OFFSET ?`,
      [reportType, keepCount]
    );
    
    // Delete the old records
    if (result.length > 0) {
      const idsToDelete = result.map(row => row.id);
      const placeholders = idsToDelete.map(() => '?').join(',');
      await database.runAsync(
        `DELETE FROM report_history WHERE id IN (${placeholders})`,
        idsToDelete
      );
    }
  } catch (error) {
    console.error('Error deleting old report history:', error);
    throw error;
  }
};;

// Get cost of goods sold (COGS) by period
export const getCOGSByPeriod = async (
  startDate: string,
  endDate: string
): Promise<{ totalCOGS: number; cogsItems: { name: string; amount: number }[] }> => {
  try {
    const database = await openDatabase();
    
    // Get COGS by joining transactions with item costs
    const result: any[] = await database.getAllAsync(
      `SELECT 
        i.name,
        SUM(it.quantity * i.cost) as itemCOGS
      FROM inventory_transactions it
      JOIN inventory_items i ON it.itemId = i.code
      WHERE it.type = 'out'
      AND date(it.createdAt) >= ?
      AND date(it.createdAt) <= ?
      GROUP BY i.code, i.name, i.cost
      ORDER BY itemCOGS DESC`,
      [startDate, endDate]
    );
    
    // Calculate total COGS
    const totalCOGS = result.reduce((sum, item) => sum + (parseFloat(item.itemCOGS) || 0), 0);
    
    const cogsItems = result.map(item => ({
      name: item.name,
      amount: parseFloat(item.itemCOGS) || 0
    }));
    
    return {
      totalCOGS,
      cogsItems
    };
  } catch (error) {
    console.error('Error getting COGS data:', error);
    throw error;
  }
};

// Get total sales for a specific cashier (user) for today
// Only includes cash transactions as these are the ones that need to be physically deposited
export const getTotalSalesForCashier = async (userId: string, date?: string): Promise<number> => {
  try {
    const database = await openDatabase();
    
    // If no date provided, use today
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Query to get total sales for the user on the specified date
    // We're looking for 'out' transactions (sales) created by this user
    // Only include cash transactions as these are the ones that need to be physically deposited
    const result: any = await database.getFirstAsync(
      `SELECT SUM(price * quantity) as totalSales
       FROM inventory_transactions 
       WHERE createdBy = ? 
       AND type = 'out'
       AND paymentMethod = 'cash'
       AND date(createdAt) = ?
       AND reference IS NOT NULL`,
      [userId, targetDate]
    );
    
    return result && result.totalSales ? parseFloat(result.totalSales) : 0;
  } catch (error) {
    console.error('Error getting total sales for cashier:', error);
    throw error;
  }
};

// Get transaction count for a specific cashier for today
export const getTransactionCountForCashier = async (userId: string, date?: string): Promise<number> => {
  try {
    const database = await openDatabase();
    
    // If no date provided, use today
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Query to get transaction count for the user on the specified date
    const result: any = await database.getFirstAsync(
      `SELECT COUNT(DISTINCT reference) as transactionCount
       FROM inventory_transactions 
       WHERE createdBy = ? 
       AND type = 'out'
       AND date(createdAt) = ?
       AND reference IS NOT NULL`,
      [userId, targetDate]
    );
    
    return result && result.transactionCount ? parseInt(result.transactionCount) : 0;
  } catch (error) {
    console.error('Error getting transaction count for cashier:', error);
    throw error;
  }
};

// Get work duration for a specific cashier for today (in minutes)
export const getWorkDurationForCashier = async (userId: string, date?: string): Promise<number> => {
  try {
    const database = await openDatabase();
    
    // If no date provided, use today
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Query to get first and last transaction times for the user on the specified date
    const result: any = await database.getFirstAsync(
      `SELECT 
         MIN(createdAt) as firstTransaction,
         MAX(createdAt) as lastTransaction
       FROM inventory_transactions 
       WHERE createdBy = ? 
       AND type = 'out'
       AND date(createdAt) = ?
       AND reference IS NOT NULL`,
      [userId, targetDate]
    );
    
    if (result && result.firstTransaction && result.lastTransaction) {
      const firstTime = new Date(result.firstTransaction);
      const lastTime = new Date(result.lastTransaction);
      const durationInMinutes = (lastTime.getTime() - firstTime.getTime()) / (1000 * 60);
      return Math.round(durationInMinutes);
    }
    
    return 0;
  } catch (error) {
    console.error('Error getting work duration for cashier:', error);
    throw error;
  }
};

// Get payment method breakdown for a specific cashier for today
export const getPaymentMethodBreakdownForCashier = async (userId: string, date?: string): Promise<{[key: string]: number}> => {
  try {
    const database = await openDatabase();
    
    // If no date provided, use today
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Query to get payment method breakdown for the user on the specified date
    const result: any[] = await database.getAllAsync(
      `SELECT 
         paymentMethod,
         SUM(price * quantity) as totalAmount
       FROM inventory_transactions 
       WHERE createdBy = ? 
       AND type = 'out'
       AND date(createdAt) = ?
       AND reference IS NOT NULL
       GROUP BY paymentMethod`,
      [userId, targetDate]
    );
    
    // Convert to object with payment method as key and total amount as value
    const breakdown: {[key: string]: number} = {};
    result.forEach(item => {
      breakdown[item.paymentMethod] = parseFloat(item.totalAmount) || 0;
    });
    
    return breakdown;
  } catch (error) {
    console.error('Error getting payment method breakdown for cashier:', error);
    throw error;
  }
};;